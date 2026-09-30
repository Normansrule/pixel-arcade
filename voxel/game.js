import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {cinematic,quality,setQuality} from '../js/fx3d.js';

/* ================= constants ================= */
const CS=16,CH=72,SEA=24,RD=5;
const $=id=>document.getElementById(id);
const hash=(x,y,z,s)=>{let h=(x*374761393+y*668265263+z*2147483647+s*1013904223)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};

/* ================= blocks ================= */
// tile indices into an 8x4 atlas
const B=[
 null,
 {n:'GRASS',t:0,s:1,b:2,hard:.5},{n:'DIRT',t:2,s:2,b:2,hard:.45},{n:'STONE',t:3,s:3,b:3,hard:1.2,drop:13,need:1},{n:'SAND',t:4,s:4,b:4,hard:.4},
 {n:'WATER',t:5,s:5,b:5,liquid:1},{n:'LOG',t:7,s:6,b:7,hard:.9},{n:'LEAVES',t:8,s:8,b:8,hard:.15,trans:1},{n:'PLANKS',t:9,s:9,b:9,hard:.8},
 {n:'GLASS',t:10,s:10,b:10,hard:.3,trans:1},{n:'SNOW',t:11,s:12,b:2,hard:.4},{n:'COAL',t:13,s:13,b:13,hard:1.4,ore:15,need:1,drop:101},{n:'IRON',t:14,s:14,b:14,hard:1.8,ore:40,need:2},
 {n:'COBBLE',t:15,s:15,b:15,hard:1.3,need:1},{n:'BRICK',t:16,s:16,b:16,hard:1.5,need:1},{n:'GLOWSTONE',t:17,s:17,b:17,hard:.6,glow:1},{n:'BEDROCK',t:18,s:18,b:18,hard:1e9},
 {n:'GOLD',t:19,s:19,b:19,hard:2,ore:80,need:3},{n:'DIAMOND',t:20,s:20,b:20,hard:2.5,ore:200,need:3,drop:102},{n:'CACTUS',t:22,s:21,b:22,hard:.4,trans:1},{n:'LAVA',t:23,s:23,b:23,liquid:1,glow:1},
 {n:'TORCH',t:24,s:24,b:24,hard:.05,trans:1,torch:1},{n:'TNT',t:26,s:25,b:26,hard:.2,tnt:1},
];
const solid=id=>id>0&&!B[id].liquid&&!B[id].torch;const opaque=id=>id>0&&!B[id].liquid&&!B[id].trans;
const CREATIVE=[1,3,8,6,9,14,15,21,22];
// non-block items (ids >= 100): tools are used automatically, food is eaten with right click
const ITEMS={100:{n:'STICK'},101:{n:'COAL'},102:{n:'DIAMOND'},103:{n:'MUTTON',food:6},110:{n:'WOOD PICKAXE',pick:1,c:'#b08850'},111:{n:'STONE PICKAXE',pick:2,c:'#8a8a90'},112:{n:'IRON PICKAXE',pick:3,c:'#e6d2c0'},113:{n:'DIAMOND PICKAXE',pick:4,c:'#5ae6e6'},120:{n:'IRON SWORD',sword:1,c:'#e6e6ee'}};
const nameOf=id=>id>=100?ITEMS[id].n:B[id].n;
const RECIPES=[{out:8,n:4,in:{6:1}},{out:100,n:4,in:{8:2}},{out:110,n:1,in:{8:3,100:2}},{out:21,n:4,in:{100:1,101:1}},{out:111,n:1,in:{13:3,100:2}},{out:112,n:1,in:{12:3,100:2}},{out:120,n:1,in:{12:2,100:1}},{out:113,n:1,in:{102:3,100:2}},{out:9,n:2,in:{4:2,101:1}},{out:14,n:4,in:{13:4}},{out:15,n:2,in:{17:1,101:2}},{out:22,n:1,in:{4:4,101:2}}];
const MULT=[1,2.2,3.2,4.6,6.5];

/* ================= texture atlas (procedural 16x16 tiles) ================= */
function atlas(){const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');const e=document.createElement('canvas');e.width=128;e.height=64;const ex=e.getContext('2d');ex.fillStyle='#000';ex.fillRect(0,0,128,64);
 const R=mulberry(7);const tile=(i,fn,glow)=>{const ox=(i%8)*16,oy=(i>>3)*16;for(let py=0;py<16;py++)for(let px=0;px<16;px++){const col=fn(px,py,R());if(!col)continue;x.fillStyle=col;x.fillRect(ox+px,oy+py,1,1);if(glow){ex.fillStyle=col;ex.fillRect(ox+px,oy+py,1,1);}}};
 const v=(r,g,b,n,k)=>`rgb(${Math.max(0,Math.min(255,r+n*k))|0},${Math.max(0,Math.min(255,g+n*k))|0},${Math.max(0,Math.min(255,b+n*k))|0})`;
 tile(0,(px,py,r)=>v(92,150,56,r-.5,50));
 tile(1,(px,py,r)=>py<3+((px*7)%3===0?1:0)?v(92,150,56,r-.5,50):v(122,86,58,r-.5,40));
 tile(2,(px,py,r)=>v(122,86,58,r-.5,40));
 tile(3,(px,py,r)=>v(128,128,132,r-.5,36));
 tile(4,(px,py,r)=>v(222,206,150,r-.5,26));
 tile(5,(px,py,r)=>v(40,90,190,r-.5,20));
 tile(6,(px,py,r)=>v(104,78,46,((px%4===0)?-.6:0)+r*.4,50));
 tile(7,(px,py,r)=>{const d=Math.hypot(px-7.5,py-7.5);return d>7?v(104,78,46,r-.5,30):v(176,142,92,(Math.floor(d)%2?-.3:.2)+r*.3,40);});
 tile(8,(px,py,r)=>r<.12?null:v(58,120,42,r-.5,60));
 tile(9,(px,py,r)=>v(176,136,84,(py%4===0?-.7:0)+((px+(py>>2)*5)%8===0?-.6:0)+r*.3,40));
 tile(10,(px,py,r)=>px===0||py===0||px===15||py===15||(px===py&&px>3&&px<8)?v(210,236,248,r*.2,20):null);
 tile(11,(px,py,r)=>v(238,244,250,r-.5,16));
 tile(12,(px,py,r)=>py<4+((px*5)%3===0?1:0)?v(238,244,250,r-.5,16):v(122,86,58,r-.5,40));
 const ore=(i,rr,gg,bb,glow)=>tile(i,(px,py,r)=>{const s=hash(px>>1,py>>1,i,3)<.2;return s?v(rr,gg,bb,r-.5,40):v(128,128,132,r-.5,36);},glow);
 ore(13,30,30,30);ore(14,216,166,120);
 tile(15,(px,py,r)=>{const c=hash(px>>2,py>>2,15,1);return v(118,118,122,(c-.5)*1.4+(px%4===0||py%4===0?-.7:0),40);});
 tile(16,(px,py,r)=>(py%4===0||((px+((py>>2)%2)*4)%8===0))?v(200,190,180,r*.2,20):v(160,70,54,r-.5,30));
 tile(17,(px,py,r)=>v(250,210,110,(hash(px>>1,py>>1,17,2)-.5)*1.2,60),true);
 tile(18,(px,py,r)=>v(60,60,64,r-.5,50));
 ore(19,250,210,60,true);ore(20,90,230,230,true);
 tile(21,(px,py,r)=>(px===0||px===15)?null:v(70,140,50,(px%4===1?.5:0)+r*.2-.2,50));
 tile(22,(px,py,r)=>(px===0||px===15||py===0||py===15)?v(60,120,44,0,0):v(100,170,70,r*.3,30));
 tile(23,(px,py,r)=>v(240,110,30,(Math.sin(px*.8+py*.5)+r)*.4,60),true);
 tile(24,(px,py,r)=>px>=7&&px<=8&&py>=5?v(120,86,50,r*.3,30):px>=6&&px<=9&&py>=1&&py<5?v(255,190-py*20,60,r*.3,40):null,true);
 tile(25,(px,py,r)=>py>=6&&py<=9?(py===6||py===9?v(40,40,40,0,0):v(236,236,230,r*.2,20)):v(200,46,36,(px%4===0?-.5:0)+r*.3,40));
 tile(26,(px,py,r)=>(Math.hypot(px-7.5,py-7.5)<2.5)?v(40,40,40,r*.2,20):v(200,46,36,r*.4,40));
 const mk=cv=>{const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;return t;};return{map:mk(c),em:mk(e),canvas:c};}

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(72,1,.05,400);scene.add(cam);
const AT=atlas();
const WU={uTime:{value:0}};
const mat=new THREE.MeshStandardMaterial({map:AT.map,emissiveMap:AT.em,emissive:0xffffff,emissiveIntensity:1.4,vertexColors:true,alphaTest:.5,roughness:.92,metalness:0});
// leaves sway in the wind (per-vertex 'sway' weight baked by the mesher)
mat.onBeforeCompile=sh=>{sh.uniforms.uTime=WU.uTime;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float sway;uniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nif(sway>0.){float ph=position.x*.7+position.z*.45;transformed.x+=sway*(sin(uTime*1.6+ph)*.055+sin(uTime*4.3+ph*3.)*.012);transformed.z+=sway*cos(uTime*1.3+ph*1.3)*.045;transformed.y+=sway*sin(uTime*2.1+ph)*.018;}');};
// water: vertex waves, wave normals for sun glints and sky reflections, fresnel opacity
const wmat=new THREE.MeshStandardMaterial({color:0x1d5a9e,transparent:true,opacity:.7,roughness:.09,metalness:.05,envMapIntensity:.45,depthWrite:false});
wmat.onBeforeCompile=sh=>{sh.uniforms.uTime=WU.uTime;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;varying vec3 vWP;varying float vTop;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 w0=modelMatrix*vec4(transformed,1.);vTop=step(.5,normal.y);transformed.y+=vTop*((sin(w0.x*1.3+uTime*1.8)+cos(w0.z*1.1+uTime*1.4))*.035-.03);vWP=(modelMatrix*vec4(transformed,1.)).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime;varying vec3 vWP;varying float vTop;')
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(vTop>.5){float dx=cos(vWP.x*1.3+uTime*1.8)*.045+cos(vWP.x*3.1+vWP.z*2.3+uTime*2.6)*.09+cos(vWP.x*7.3-vWP.z*5.1+uTime*3.7)*.035,dz=-sin(vWP.z*1.1+uTime*1.4)*.04+sin(vWP.z*2.7-vWP.x*1.9+uTime*2.2)*.09+sin(vWP.z*6.9+vWP.x*4.7-uTime*3.1)*.035;normal=normalize((viewMatrix*vec4(normalize(vec3(-dx*2.2,1.,-dz*2.2)),0.)).xyz);}')
  .replace('#include <opaque_fragment>','diffuseColor.a=mix(diffuseColor.a,.9,pow(1.-abs(dot(normalize(vViewPosition),normal)),5.));\n#include <opaque_fragment>');};
const skyGain={value:.5};const gainSky=m=>{m.onBeforeCompile=sh=>{sh.uniforms.skyGain=skyGain;sh.fragmentShader='uniform float skyGain;\n'+sh.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );','gl_FragColor = vec4( pow(retColor*skyGain,vec3(1.08)), 1.0 );');};};
const sky=new Sky();sky.scale.setScalar(900);gainSky(sky.material);scene.add(sky);const SU=sky.material.uniforms;SU.turbidity.value=2.4;SU.rayleigh.value=2.3;SU.mieCoefficient.value=.003;SU.mieDirectionalG.value=.86;
const sun=new THREE.DirectionalLight(0xfff0dd,2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:220});sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0xbcd8ff,0x5a4a3a,.7);scene.add(hemi);
scene.fog=new THREE.Fog(0xbcd8ff,40,RD*CS-4);
const stars=(()=>{const g=new THREE.BufferGeometry(),p=[];for(let i=0;i<1400;i++){const a=Math.random()*6.283,e=Math.random()*1.5,r=380;p.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.3,sizeAttenuation:false,transparent:true,fog:false,depthWrite:false}));})();cam.add(stars);
const moon=new THREE.Mesh(new THREE.CircleGeometry(12,24),new THREE.MeshBasicMaterial({color:0xf2eedc,fog:false}));scene.add(moon);
const pmrem=new THREE.PMREMGenerator(R);const skyScene=new THREE.Scene();const sky2=new Sky();sky2.scale.setScalar(900);gainSky(sky2.material);skyScene.add(sky2);Object.assign(sky2.material.uniforms,{});sky2.material.uniforms.turbidity.value=2.4;sky2.material.uniforms.rayleigh.value=2.3;sky2.material.uniforms.mieCoefficient.value=.003;sky2.material.uniforms.mieDirectionalG.value=.86;let envRT=null;
let fx=null;const buildFx=()=>{fx=cinematic(R,scene,cam,{exposure:.72,bloom:.32,bloomThreshold:1.8,bloomRadius:.35,vignette:.3,saturation:1.12,aoStrength:.8});};

/* ================= world ================= */
let seed=1,noise,chunks=new Map(),edits={},mode='survival';
function initNoise(){noise=new SimplexNoise({random:mulberry(seed)});}
const fbm=(x,z,o)=>{let s=0,a=1,f=1,n=0;for(let i=0;i<o;i++){s+=noise.noise(x*f,z*f)*a;n+=a;a*=.5;f*=2;}return s/n;};
const hcache=new Map();
function terrain(x,z){const k=x*100003+z;let v=hcache.get(k);if(v)return v;const cont=noise.noise(x*.0035,z*.0035),hills=fbm(x*.018,z*.018,4),mnt=Math.max(0,noise.noise(x*.007+91,z*.007-37));const temp=noise.noise(x*.0028+300,z*.0028-150);
 let h=Math.floor(SEA+2+cont*9+hills*7+mnt*mnt*34);h=Math.max(3,Math.min(CH-6,h));const desert=temp>.3&&h<SEA+10,snowy=h>SEA+22;v={h,desert,snowy};if(hcache.size>200000)hcache.clear();hcache.set(k,v);return v;}
function genChunk(cx,cz){const d=new Uint8Array(CS*CS*CH);const I=(x,y,z)=>(y*CS+z)*CS+x;
 for(let x=0;x<CS;x++)for(let z=0;z<CS;z++){const wx=cx*CS+x,wz=cz*CS+z,T=terrain(wx,wz),h=T.h;
  for(let y=0;y<=Math.max(h,SEA);y++){let id=0;if(y===0)id=16;else if(y<h-3)id=3;else if(y<h)id=T.desert||h<=SEA+1?4:2;else if(y===h)id=T.desert||h<=SEA+1?4:T.snowy?10:1;else if(y<=SEA)id=5;
   if(id===3){const r=hash(wx,y,wz,seed);if(r<.012)id=11;else if(y<34&&r<.019)id=12;else if(y<18&&r<.0215)id=17;else if(y<12&&r<.0228)id=18;}
   if(y>1&&y<h-2&&id!==5){const c=noise.noise3d(wx*.06,y*.09,wz*.06)+noise.noise3d(wx*.13,y*.13,wz*.13)*.35;if(c>.62)id=y<6?20:0;}
   d[I(x,y,z)]=id;}}
 for(let x=-2;x<CS+2;x++)for(let z=-2;z<CS+2;z++){const wx=cx*CS+x,wz=cz*CS+z,T=terrain(wx,wz);if(T.h<=SEA+1||T.snowy)continue;const r=hash(wx,1,wz,seed+9);
  const put=(px,py,pz,id,soft)=>{if(px<0||pz<0||px>=CS||pz>=CS||py<0||py>=CH)return;const i=I(px,py,pz);if(soft&&d[i])return;d[i]=id;};
  if(T.desert){if(r<.006){const hh=2+Math.floor(r*400)%2;for(let k=1;k<=hh;k++)put(x,T.h+k,z,19);}continue;}
  if(r<.018){const th=4+Math.floor(hash(wx,2,wz,seed)*3);for(let k=1;k<=th;k++)put(x,T.h+k,z,6);for(let dy=th-2;dy<=th+1;dy++){const rad=dy>th-1?1:2;for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){if(Math.abs(dx)===rad&&Math.abs(dz)===rad&&hash(wx+dx,dy,wz+dz,seed)<.5)continue;put(x+dx,T.h+dy,z+dz,7,true);}}}}
 for(const k in edits){const[a,b,c]=k.split(',').map(Number);if(Math.floor(a/CS)===cx&&Math.floor(c/CS)===cz)d[I(a-cx*CS,b,c-cz*CS)]=edits[k];}
 return{cx,cz,d,mesh:null,wmesh:null,dirty:true};}
const key=(cx,cz)=>cx+','+cz;
function chunk(cx,cz){let c=chunks.get(key(cx,cz));if(!c){c=genChunk(cx,cz);chunks.set(key(cx,cz),c);}return c;}
function get(x,y,z){if(y<0||y>=CH)return 0;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunk(cx,cz);return c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)];}
function set(x,y,z,id){if(y<1||y>=CH)return;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunk(cx,cz);c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)]=id;c.dirty=true;edits[x+','+y+','+z]=id;
 const lx=x-cx*CS,lz=z-cz*CS;if(lx===0)mark(cx-1,cz);if(lx===CS-1)mark(cx+1,cz);if(lz===0)mark(cx,cz-1);if(lz===CS-1)mark(cx,cz+1);saveSoon();}
const mark=(cx,cz)=>{const c=chunks.get(key(cx,cz));if(c)c.dirty=true;};

/* ================= meshing with per-vertex ambient occlusion ================= */
const FACES=[
 {d:[-1,0,0],c:[[0,1,0,0,1],[0,0,0,0,0],[0,1,1,1,1],[0,0,1,1,0]],k:'s'},
 {d:[1,0,0],c:[[1,1,1,0,1],[1,0,1,0,0],[1,1,0,1,1],[1,0,0,1,0]],k:'s'},
 {d:[0,-1,0],c:[[1,0,1,1,0],[0,0,1,0,0],[1,0,0,1,1],[0,0,0,0,1]],k:'b'},
 {d:[0,1,0],c:[[0,1,1,1,1],[1,1,1,0,1],[0,1,0,1,0],[1,1,0,0,0]],k:'t'},
 {d:[0,0,-1],c:[[1,0,0,0,0],[0,0,0,1,0],[1,1,0,0,1],[0,1,0,1,1]],k:'s'},
 {d:[0,0,1],c:[[0,0,1,0,0],[1,0,1,1,0],[0,1,1,0,1],[1,1,1,1,1]],k:'s'}];
const AOL=[.42,.62,.8,1];const SHADE=[.8,.8,.62,1,.88,.88];
const torchStick=new THREE.BoxGeometry(.12,.55,.12),torchHead=new THREE.BoxGeometry(.17,.17,.17),torchSM=new THREE.MeshStandardMaterial({color:0x6a4a2a,roughness:.9}),torchHM=new THREE.MeshStandardMaterial({color:0xffc060,emissive:0xff9a30,emissiveIntensity:5});
function dropMesh(c,k){if(!c[k])return;scene.remove(c[k]);if(c[k].isGroup)c[k].children.forEach(o=>o.dispose&&o.dispose());else c[k].geometry.dispose();c[k]=null;}
function meshChunk(c){const P=[],N=[],U=[],C=[],I=[],WP=[],WN=[],WI=[],TT=[],SW=[];const bx=c.cx*CS,bz=c.cz*CS;const E=.0005;
 for(let y=0;y<CH;y++)for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const id=c.d[(y*CS+z)*CS+x];if(!id)continue;const wx=bx+x,wz=bz+z,bd=B[id];if(bd.torch){TT.push(wx+.5,y,wz+.5);continue;}
  for(let f=0;f<6;f++){const F=FACES[f],nx=wx+F.d[0],ny=y+F.d[1],nz=wz+F.d[2],nb=get(nx,ny,nz);
   if(id===5){if(nb)continue;const base=WP.length/3,top=f===3?-.12:0;for(const q of F.c){WP.push(wx+q[0],y+q[1]+(q[1]?top:0),wz+q[2]);WN.push(...F.d);}WI.push(base,base+1,base+2,base+2,base+1,base+3);continue;}
   if(opaque(nb)||(nb===id&&bd.trans))continue;
   const tile=bd[F.k],tu=tile%8,tv=tile>>3,base=P.length/3,ao=[];
   const ax=F.d[0]!==0?[1,2]:F.d[1]!==0?[0,2]:[0,1];
   for(const q of F.c){const s1=[0,0,0],s2=[0,0,0];s1[ax[0]]=q[ax[0]]?1:-1;s2[ax[1]]=q[ax[1]]?1:-1;
    const o1=opaque(get(nx+s1[0],ny+s1[1],nz+s1[2]))?1:0,o2=opaque(get(nx+s2[0],ny+s2[1],nz+s2[2]))?1:0,oc=opaque(get(nx+s1[0]+s2[0],ny+s1[1]+s2[1],nz+s1[2]+s2[2]))?1:0;
    const a=o1&&o2?0:3-(o1+o2+oc);ao.push(a);const l=AOL[a]*SHADE[f];
    P.push(wx+q[0],y+q[1],wz+q[2]);SW.push(id===7?(.55+.45*q[1]):0);N.push(...F.d);U.push((tu+(q[3]?1-E*16:E*16))/8,1-(tv+1-(q[4]?1-E*16:E*16))/4);C.push(l,l,l);}
   if(ao[0]+ao[3]>ao[1]+ao[2])I.push(base,base+1,base+3,base,base+3,base+2);else I.push(base,base+1,base+2,base+2,base+1,base+3);}}
 const mk=(p,n,idx,u,col,m,shadow)=>{if(!idx.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));if(u)g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();const me=new THREE.Mesh(g,m);me.castShadow=shadow;me.receiveShadow=true;return me;};
 for(const k of['mesh','wmesh','tmesh'])dropMesh(c,k);
 c.mesh=mk(P,N,I,U,C,mat,true);if(c.mesh)c.mesh.geometry.setAttribute('sway',new THREE.Float32BufferAttribute(SW,1));c.wmesh=mk(WP,WN,WI,null,null,wmat,false);if(c.mesh)scene.add(c.mesh);if(c.wmesh){c.wmesh.renderOrder=2;scene.add(c.wmesh);}
 c.torches=[];if(TT.length){const n=TT.length/3,g=new THREE.Group(),s1=new THREE.InstancedMesh(torchStick,torchSM,n),s2=new THREE.InstancedMesh(torchHead,torchHM,n),m4=new THREE.Matrix4();for(let i=0;i<n;i++){const x=TT[i*3],y=TT[i*3+1],z=TT[i*3+2];m4.makeTranslation(x,y+.28,z);s1.setMatrixAt(i,m4);m4.makeTranslation(x,y+.62,z);s2.setMatrixAt(i,m4);c.torches.push(new THREE.Vector3(x,y+.75,z));}g.add(s1,s2);c.tmesh=g;scene.add(g);}
 c.dirty=false;}

/* ================= player ================= */
const P={x:.5,y:60,z:.5,vx:0,vy:0,vz:0,yaw:0,pitch:0,on:false,fly:false,hp:20,air:10,inWater:false,fall:0};
let inv={},slot=0,score=0,mined=0,dayT=.28,nights=0,wasNight=false,dead=false,goal=0,crafted={},swing=0,craftOpen=false;
const tier=()=>mode==='creative'?4:Math.max(0,...Object.keys(inv).filter(k=>inv[k]>0&&ITEMS[k]?.pick).map(k=>ITEMS[k].pick));
const give=(id,n=1)=>{inv[id]=(inv[id]||0)+n;};
const W2=.3,PH=1.8;
function collides(x,y,z){for(let bx=Math.floor(x-W2);bx<=Math.floor(x+W2-1e-6);bx++)for(let by=Math.floor(y);by<=Math.floor(y+PH-1e-6);by++)for(let bz=Math.floor(z-W2);bz<=Math.floor(z+W2-1e-6);bz++)if(solid(get(bx,by,bz)))return true;return false;}
function spawn(){let x=0,z=0;for(let tr=0;tr<400;tr++){const T=terrain(x,z);if(T.h>SEA+1)break;x+=7;z+=3;}const T=terrain(x,z);P.x=x+.5;P.z=z+.5;P.y=T.h+1.02;P.vx=P.vy=P.vz=0;P.hp=20;P.air=10;}
function hotbar(){return mode==='creative'?CREATIVE:Object.keys(inv).map(Number).filter(k=>inv[k]>0&&(k<100||ITEMS[k].food)).slice(0,9);}

/* ================= voxel ray cast (DDA) ================= */
function raycast(o,d,maxD){let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);const sx=Math.sign(d.x),sy=Math.sign(d.y),sz=Math.sign(d.z);
 const tdx=Math.abs(1/d.x),tdy=Math.abs(1/d.y),tdz=Math.abs(1/d.z);let tx=((sx>0?x+1-o.x:o.x-x))*tdx,ty=((sy>0?y+1-o.y:o.y-y))*tdy,tz=((sz>0?z+1-o.z:o.z-z))*tdz;let px=x,py=y,pz=z,t=0;
 while(t<maxD){const id=get(x,y,z);if(id&&!B[id].liquid)return{x,y,z,px,py,pz,id,t};px=x;py=y;pz=z;if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;}else if(ty<tz){y+=sy;t=ty;ty+=tdy;}else{z+=sz;t=tz;tz+=tdz;}}return null;}

/* ================= mobs ================= */
const mobs=[];const mobM={husk:new THREE.MeshStandardMaterial({color:0x4a7a4a,roughness:.8}),huskS:new THREE.MeshStandardMaterial({color:0x2a4a8a,roughness:.8}),eye:new THREE.MeshBasicMaterial({color:0xff3030}),sheep:new THREE.MeshStandardMaterial({color:0xf2f2ea,roughness:1}),face:new THREE.MeshStandardMaterial({color:0x3a2a22})};
function makeMob(kind,x,z){const g=new THREE.Group();const add=(w,h,d,m,px,py,pz)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(px,py,pz);o.castShadow=true;g.add(o);return o;};
 let legs=[];if(kind==='husk'){add(.5,.7,.3,mobM.husk,0,1.05,0);add(.45,.45,.45,mobM.husk,0,1.62,0);add(.08,.06,.02,mobM.eye,-.1,1.65,.23);add(.08,.06,.02,mobM.eye,.1,1.65,.23);add(.16,.6,.16,mobM.husk,-.33,1.1,.25).rotation.x=-1.4;add(.16,.6,.16,mobM.husk,.33,1.1,.25).rotation.x=-1.4;legs=[add(.2,.7,.2,mobM.huskS,-.13,.35,0),add(.2,.7,.2,mobM.huskS,.13,.35,0)];}
 else if(kind==='bloater'){const bm=new THREE.MeshStandardMaterial({color:0x5a8a3a,roughness:.55,emissive:0x2a6a10,emissiveIntensity:.4});const spot=new THREE.MeshStandardMaterial({color:0xc8ff5a,emissive:0x9aff30,emissiveIntensity:2.2});add(.9,.95,.9,bm,0,.95,0);add(.7,.35,.7,bm,0,1.55,0);for(const[a,b,c]of[[.46,1.1,.1],[-.46,.9,-.2],[.1,1.2,.46],[-.2,.8,.46],[.2,1.35,-.46]])add(.16,.16,.16,spot,a,b,c);add(.1,.1,.02,mobM.eye,-.16,1.2,.46);add(.1,.1,.02,mobM.eye,.16,1.2,.46);legs=[add(.25,.45,.25,bm,-.22,.22,0),add(.25,.45,.25,bm,.22,.22,0)];g.userData.bm=bm;}
 else{add(.8,.6,1.1,mobM.sheep,0,.75,0);add(.4,.4,.4,mobM.face,0,.95,.65);legs=[[-.25,-.35],[.25,-.35],[-.25,.35],[.25,.35]].map(p=>add(.18,.45,.18,mobM.face,p[0],.22,p[1]));}
 const T=terrain(Math.floor(x),Math.floor(z));g.position.set(x,T.h+1,z);scene.add(g);const m={kind,g,legs,vx:0,vy:0,vz:0,hp:kind==='husk'?10:kind==='bloater'?8:6,fuse:0,t:Math.random()*100,hurt:0,cd:0,dir:Math.random()*6.28};mobs.push(m);return m;}
function mobStep(m,dt){const p=m.g.position;m.t+=dt;if(m.hurt>0)m.hurt-=dt;let ax=0,az=0;const dx=P.x-p.x,dz=P.z-p.z,d=Math.hypot(dx,dz);
 if(m.kind==='bloater'){if(d<20&&m.fuse<=0){ax=dx/d*.8;az=dz/d*.8;}m.g.rotation.y=Math.atan2(dx,dz);if(d<2.4&&Math.abs(P.y-p.y)<2)m.fuse+=dt;else if(d>5)m.fuse=Math.max(0,m.fuse-dt);if(m.fuse>0&&Math.random()<dt*6)sfx('hiss');const bm=m.g.userData.bm;bm.emissive.setRGB(m.fuse>0&&Math.sin(m.fuse*22)>0?1:.16,m.fuse>0&&Math.sin(m.fuse*22)>0?1:.4,m.fuse>0&&Math.sin(m.fuse*22)>0?1:.06);bm.emissiveIntensity=m.fuse>0?.9:.4;if(m.fuse>1.5){m.dead=true;explode(p.x,p.y+.8,p.z,2.9);return;}}
 else if(m.kind==='husk'){if(d<24){ax=dx/d;az=dz/d;}m.g.rotation.y=Math.atan2(dx,dz);if(d<1.2&&Math.abs(P.y-p.y)<1.8&&(m.cd-=dt)<=0){m.cd=1.3;hurtPlayer(2,p);}}else{if(Math.random()<.01)m.dir+=Math.random()*2-1;ax=Math.sin(m.dir)*.4;az=Math.cos(m.dir)*.4;m.g.rotation.y=m.dir;}
 const sp=m.kind==='husk'?2.3:m.kind==='bloater'?2:1;m.vx=ax*sp;m.vz=az*sp;m.vy-=22*dt;const hit=(x,y,z)=>solid(get(Math.floor(x),Math.floor(y),Math.floor(z)))||solid(get(Math.floor(x),Math.floor(y+1),Math.floor(z)));
 const nx=p.x+m.vx*dt,nz=p.z+m.vz*dt;if(!hit(nx,p.y+.01,p.z))p.x=nx;else if(m.vy===0||Math.abs(m.vy)<.1){m.vy=7;}if(!hit(p.x,p.y+.01,nz))p.z=nz;else if(Math.abs(m.vy)<.1)m.vy=7;
 p.y+=m.vy*dt;if(solid(get(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z)))){p.y=Math.floor(p.y)+1;m.vy=0;}const sw=Math.sin(m.t*8)*Math.min(1,Math.hypot(m.vx,m.vz))*.6;m.legs.forEach((l,i)=>l.rotation.x=(i%2?sw:-sw));
 m.g.scale.setScalar((m.hurt>0?1.1:1)*(1+Math.min(1,m.fuse/1.5)*.35));}

/* ================= input ================= */
const keys={};let state='menu',mouseL=false,brk={t:0,b:null};
addEventListener('keydown',e=>{keys[e.code]=true;if(craftOpen){if(e.code==='KeyE'||e.code==='Escape')closeCraft();return;}if(state!=='play')return;if(/^Digit[1-9]$/.test(e.code)){slot=+e.code.slice(5)-1;drawBar();}if(e.code==='KeyF'&&mode==='creative'){P.fly=!P.fly;toast(P.fly?'FLYING':'WALKING');}if(e.code==='KeyE'&&mode==='survival'&&!dead){openCraft();}if(e.code==='KeyG'){const q=(fx.q+2)%3;setQuality(q);buildFx();resize();toast('GRAPHICS '+['FAST','HIGH','ULTRA'][q]);}if(e.code==='Space')e.preventDefault();});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('wheel',e=>{if(state!=='play')return;const n=Math.max(1,hotbar().length);slot=(slot+(e.deltaY>0?1:n-1))%n;drawBar();});
canvas.addEventListener('mousedown',e=>{if(state==='play'&&document.pointerLockElement!==canvas){canvas.requestPointerLock();return;}if(state!=='play')return;if(e.button===0){mouseL=true;attack();}if(e.button===2)place();});
addEventListener('mouseup',e=>{if(e.button===0){mouseL=false;brk.t=0;brk.b=null;}});canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||state!=='play')return;P.yaw-=e.movementX*.0023;P.pitch=Math.max(-1.55,Math.min(1.55,P.pitch-e.movementY*.0023));});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&state==='play'&&!craftOpen){state='paused';$('menu').style.display='flex';$('go').textContent='NEW WORLD';$('cont').textContent='RESUME';document.body.classList.remove('playing');}});
document.querySelectorAll('.mode button').forEach(b=>b.onclick=()=>{mode=b.dataset.m;document.querySelectorAll('.mode button').forEach(x=>x.classList.toggle('on',x===b));});
const eye=()=>new THREE.Vector3(P.x,P.y+1.62,P.z);const look=()=>new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(P.pitch,P.yaw,0,'YXZ'));
function mobHit(){const o=eye(),d=look();let best=null,bt=4;for(const m of mobs){const p=m.g.position,h=m.kind==='husk'?1.9:m.kind==='bloater'?1.8:1.1;const c=new THREE.Box3(new THREE.Vector3(p.x-.45,p.y,p.z-.45),new THREE.Vector3(p.x+.45,p.y+h,p.z+.45));const r=new THREE.Ray(o,d),pt=r.intersectBox(c,new THREE.Vector3());if(pt){const t=pt.distanceTo(o);if(t<bt){bt=t;best=m;}}}return best;}
function attack(){swing=.3;const m=mobHit();if(!m){const h=raycast(eye(),look(),6);if(h&&B[h.id].tnt){set(h.x,h.y,h.z,0);ignite(h.x,h.y,h.z,2.6);return;}}if(m){m.hp-=inv[120]>0?8:4+tier()*.5;m.hurt=.25;const dx=m.g.position.x-P.x,dz=m.g.position.z-P.z,d=Math.hypot(dx,dz)||1;m.g.position.x+=dx/d*.6;m.g.position.z+=dz/d*.6;m.vy=5;sfx('hit');if(m.hp<=0){scene.remove(m.g);mobs.splice(mobs.indexOf(m),1);score+=m.kind==='husk'?50:m.kind==='bloater'?80:5;sfx('ko');if(m.kind==='sheep'&&mode==='survival'){give(103,1+(Math.random()<.5?1:0));toast('+ MUTTON');drawBar();}}brk.b=null;}}
function place(){const bar=hotbar(),id=bar[slot];if(id&&ITEMS[id]?.food){if(P.hp>=20){toast('NOT HUNGRY');return;}P.hp=Math.min(20,P.hp+ITEMS[id].food);inv[id]--;if(inv[id]<=0)delete inv[id];sfx('place');toast('+'+ITEMS[id].food/2+' ♥');drawBar();return;}swing=.25;const h=raycast(eye(),look(),6);if(!h)return;if(!id)return;if(mode==='survival'&&!(inv[id]>0))return;const{px,py,pz}=h;
 if(Math.floor(P.x-W2)<=px&&px<=Math.floor(P.x+W2)&&Math.floor(P.y)<=py&&py<=Math.floor(P.y+PH)&&Math.floor(P.z-W2)<=pz&&pz<=Math.floor(P.z+W2))return;if(get(px,py,pz)&&!B[get(px,py,pz)].liquid)return;
 set(px,py,pz,id);if(mode==='survival'){inv[id]--;if(inv[id]<=0)delete inv[id];}sfx('place');drawBar();}

/* ================= audio ================= */
let AC=null;function sfx(k){try{AC=AC||new AudioContext();const t=AC.currentTime,g=AC.createGain();g.connect(AC.destination);const len={hit:.08,ko:.3,place:.06,break:.12,hurt:.2,step:.05,boom:1.1,hiss:.25}[k]||.08;const b=AC.createBuffer(1,AC.sampleRate*len,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value={hit:900,ko:400,place:1400,break:1100,hurt:500,step:600,boom:220,hiss:5200}[k]||800;s.connect(f);f.connect(g);g.gain.value=k==='step'?.05:k==='boom'?.9:k==='hiss'?.06:.25;s.start(t);}catch(e){}}

/* ================= HUD ================= */
const iconCache={};function icon(id){if(iconCache[id])return iconCache[id];const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');
 if(id<100){const tt=B[id].s;x.drawImage(AT.canvas,(tt%8)*16,(tt>>3)*16,16,16,0,0,16,16);}
 else{const it=ITEMS[id],px=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};const stick=()=>{for(let i=0;i<9;i++)px(3+i,12-i,2,2,i%2?'#8a6236':'#6a4a26');};
  if(id===100)stick();else if(id===101){px(4,5,8,7,'#1c1c1e');px(5,4,5,2,'#2c2c30');px(6,6,2,2,'#4a4a50');}else if(id===102){px(7,2,2,2,'#bff');px(5,4,6,2,'#6ee');px(3,6,10,2,'#4cc');px(5,8,6,2,'#3aa');px(7,10,2,3,'#288');}
  else if(id===103){px(3,5,10,7,'#d86a6a');px(4,6,6,4,'#f0a0a0');px(11,9,3,2,'#f2e8d8');}
  else if(it.pick){stick();px(2,2,12,3,it.c);px(1,4,3,3,it.c);px(12,4,3,3,it.c);px(3,2,10,1,'rgba(255,255,255,.35)');}
  else if(it.sword){for(let i=0;i<9;i++)px(5+i,9-i,2,2,it.c);px(2,11,6,2,'#6a4a26');px(3,9,2,6,'#3a3a40');px(2,13,3,3,'#6a4a26');}}
 iconCache[id]=c;return c;}
function itemEl(id,n,cls='it'){const d=document.createElement('div');d.className=cls;const cv=document.createElement('canvas');cv.width=cv.height=16;cv.getContext('2d').drawImage(icon(id),0,0);d.appendChild(cv);if(n!=null){const b=document.createElement('b');b.textContent=n;d.appendChild(b);}d.title=nameOf(id);return d;}
/* ================= crafting ================= */
const canCraft=r=>Object.entries(r.in).every(([k,n])=>(inv[k]||0)>=n);
function craft(r){if(!canCraft(r))return;for(const[k,n]of Object.entries(r.in)){inv[k]-=n;if(inv[k]<=0)delete inv[k];}give(r.out,r.n);crafted[r.out]=1;sfx('place');saveSoon();drawCraft();drawBar();}
function drawCraft(){const ci=$('cinv');ci.innerHTML='';Object.keys(inv).map(Number).filter(k=>inv[k]>0).sort((a,b)=>a-b).forEach(k=>ci.appendChild(itemEl(k,inv[k])));if(!ci.children.length)ci.textContent='Inventory empty. Mine a tree trunk first.';
 const cr=$('crec');cr.innerHTML='';for(const r of RECIPES){const ok=canCraft(r),b=document.createElement('button');b.className='r'+(ok?'':' no');b.appendChild(itemEl(r.out,r.n>1?r.n:null));const sp=document.createElement('span');sp.innerHTML=nameOf(r.out)+'<small>'+Object.entries(r.in).map(([k,n])=>n+' '+nameOf(+k).toLowerCase()).join(' + ')+'</small>';b.appendChild(sp);const ing=document.createElement('div');ing.className='ing';for(const[k,n]of Object.entries(r.in))ing.appendChild(itemEl(+k,n));b.appendChild(ing);b.onclick=()=>craft(r);cr.appendChild(b);}}
function openCraft(){craftOpen=true;mouseL=false;brk.b=null;drawCraft();$('craft').hidden=false;try{document.exitPointerLock();}catch(e){}}
function closeCraft(){craftOpen=false;$('craft').hidden=true;for(const k in keys)keys[k]=false;try{canvas.requestPointerLock();}catch(e){}}
$('craft').addEventListener('mousedown',e=>{if(e.target.id==='craft')closeCraft();});
/* ================= goals ================= */
const GOALS=[['Mine a tree trunk','Hold left click on a log',()=>inv[6]>0||crafted[8]],['Craft planks','Press E, click PLANKS',()=>crafted[8]],['Craft a wooden pickaxe','Planks + sticks',()=>tier()>=1],['Mine stone','Rock needs a pickaxe',()=>inv[13]>0||tier()>=2],['Craft a stone pickaxe','3 cobblestone + 2 sticks',()=>tier()>=2],['Light the dark','Mine coal, craft torches',()=>crafted[21]],['Survive a night','Husks hunt after dark',()=>nights>=1],['Craft an iron pickaxe','Iron ore lies deeper',()=>tier()>=3],['Find a diamond','Deep underground',()=>inv[102]>0||tier()>=4]];
function goals(){if(mode!=='survival'){$('goal').innerHTML='';return;}while(goal<GOALS.length&&GOALS[goal][2]()){goal++;score+=150;toast('GOAL COMPLETE');sfx('ko');saveSoon();}
 $('goal').innerHTML=goal<GOALS.length?`<b>GOAL ${goal+1}/${GOALS.length}</b>${GOALS[goal][0]}<br><span style="color:#9a9a9a">${GOALS[goal][1]}</span>`:'<b>ALL GOALS DONE</b>Build something great';}
function drawBar(){const bar=hotbar(),el=$('bar');el.innerHTML='';for(let i=0;i<9;i++){const s=document.createElement('div');s.className='s'+(i===slot?' on':'');const id=bar[i];if(id){const cv=document.createElement('canvas');cv.width=cv.height=16;cv.getContext('2d').drawImage(icon(id),0,0);s.appendChild(cv);s.title=nameOf(id);if(mode==='survival'){const b=document.createElement('b');b.textContent=inv[id];s.appendChild(b);}}el.appendChild(s);}updateHeld();}
let toastT=0;function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;toastT=2;}
function hud(){if($('hud').hidden)return;const hr=((dayT*24+6)%24),hh=Math.floor(hr),mm=Math.floor((hr-hh)*60);const h=raycast(eye(),look(),6);
 const tr=tier();$('info').innerHTML=`<b>${mode.toUpperCase()}</b> · SCORE ${score}<br>DAY ${nights+1} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}<br>XYZ ${P.x|0} ${P.y|0} ${P.z|0}<br>${mode==='survival'?(tr?ITEMS[109+tr].n:'BARE HANDS')+(mode==='survival'?' · <kbd style="font-size:.6rem">E</kbd> CRAFT':'')+'<br>':''}${h?B[h.id].n+(mode==='survival'&&B[h.id].need>tr?' · <span style="color:#ff7a5a">NEEDS '+ITEMS[109+B[h.id].need].n+'</span>':''):''}`;
 $('hearts').textContent=mode==='creative'?'':'♥'.repeat(Math.ceil(P.hp/2))+'♡'.repeat(10-Math.ceil(P.hp/2))+(P.inWater&&P.air<10?'  '+'○'.repeat(Math.ceil(P.air)):'');
 $('brk').style.opacity=brk.b?1:0;if(brk.b){const f=Math.min(1,brk.t/brk.need);$('brk').style.background=`conic-gradient(#ff4d00 ${f*360}deg, rgba(255,255,255,.15) 0)`;$('brk').style.mask='radial-gradient(circle,transparent 13px,#000 14px)';$('brk').style.webkitMask='radial-gradient(circle,transparent 13px,#000 14px)';}
 if(toastT>0){toastT-=1/60;if(toastT<=0)$('toast').style.opacity=0;}}

/* ================= save / load ================= */
let saveT=0;const saveSoon=()=>{saveT=2;};function save(){try{localStorage.setItem('voxel_world',JSON.stringify({seed,edits,mode,inv,score,dayT,nights,goal,crafted,P:{x:P.x,y:P.y,z:P.z,hp:P.hp}}));}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem('voxel_world'));}catch(e){return null;}}

/* ================= game flow ================= */
function resetWorld(s){for(const c of chunks.values())for(const k of['mesh','wmesh','tmesh'])dropMesh(c,k);chunks=new Map();hcache.clear();mobs.splice(0).forEach(m=>scene.remove(m.g));seed=s;initNoise();}
function clearPrimed(){primed.splice(0).forEach(p=>scene.remove(p.m));}
function newWorld(){clearPrimed();edits={};inv={};goal=0;crafted={};score=0;mined=0;dayT=.28;nights=0;resetWorld((Math.random()*1e9)|0);spawn();start();}
function contWorld(){const s=load();if(state==='paused'){start();return;}if(!s){newWorld();return;}edits=s.edits||{};mode=s.mode||mode;inv=s.inv||{};goal=s.goal||0;crafted=s.crafted||{};score=s.score||0;dayT=s.dayT??.28;nights=s.nights||0;resetWorld(s.seed);P.x=s.P.x;P.y=s.P.y+.5;P.z=s.P.z;P.hp=s.P.hp||20;P.vx=P.vy=P.vz=0;start();}
function start(){dead=false;state='play';$('menu').style.display='none';$('hud').hidden=false;document.body.classList.add('playing');drawBar();try{canvas.requestPointerLock();}catch(e){}}
$('go').onclick=newWorld;$('cont').onclick=contWorld;if(!load())$('cont').style.display='none';
function hurtPlayer(n,from){if(mode==='creative'||dead)return;P.hp-=n;sfx('hurt');if(from){const dx=P.x-from.x,dz=P.z-from.z,d=Math.hypot(dx,dz)||1;P.vx+=dx/d*6;P.vz+=dz/d*6;P.vy=5;}flashT=.3;if(P.hp<=0){dead=true;toast('YOU DIED · SCORE '+score);award();setTimeout(()=>{spawn();dead=false;const keep={};for(const k in inv)if(ITEMS[k]?.pick||ITEMS[k]?.sword)keep[k]=inv[k];inv=keep;drawBar();toast('RESPAWNED · TOOLS KEPT');},2500);}}
function award(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=5+Math.min(60,score/20|0);localStorage.setItem('pxd_profile',JSON.stringify(pr));const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'voxel3d';if(+(localStorage.getItem(k)||0)<score)localStorage.setItem(k,score);}catch(e){}}
let flashT=0;

/* ================= update ================= */
function step(dt){if(state!=='play'||dead)return;
 // day/night (10 minute day)
 dayT=(dayT+dt/600)%1;const night=Math.sin(dayT*Math.PI*2)<-.05;if(night&&!wasNight)toast('NIGHT FALLS');if(!night&&wasNight){nights++;toast('DAY '+(nights+1));score+=100;mobs.filter(m=>m.kind==='husk'||m.kind==='bloater').forEach(m=>{scene.remove(m.g);mobs.splice(mobs.indexOf(m),1);});}wasNight=night;
 // movement
 const k=keys,sprint=k.ShiftLeft||k.ShiftRight;const f=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),s=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);
 const feet=get(Math.floor(P.x),Math.floor(P.y+.2),Math.floor(P.z)),head=get(Math.floor(P.x),Math.floor(P.y+1.5),Math.floor(P.z));P.inWater=B[feet]?.liquid||B[head]?.liquid;const lava=feet===20||head===20;
 let sp=P.fly?11:P.inWater?2.4:sprint?5.8:4.3;const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);let wx=-sy*f+cy*s,wz=-cy*f-sy*s;const wl=Math.hypot(wx,wz)||1;wx=wx/wl*sp*(f||s?1:0);wz=wz/wl*sp*(f||s?1:0);
 const acc=P.on||P.fly||P.inWater?14:4;P.vx+=(wx-P.vx)*Math.min(1,acc*dt);P.vz+=(wz-P.vz)*Math.min(1,acc*dt);
 if(P.fly){P.vy=(k.Space?8:0)-(k.ShiftLeft?8:0);}else if(P.inWater){P.vy=Math.max(-3,P.vy-8*dt);if(k.Space)P.vy=Math.min(3.2,P.vy+20*dt);}else{P.vy-=26*dt;if(k.Space&&P.on)P.vy=8.3;}P.vy=Math.max(P.vy,-40);
 const pvy=P.vy;for(const ax of['x','z','y']){const v=P['v'+ax]*dt;if(!v)continue;const o=P[ax];P[ax]+=v;if(collides(P.x,P.y,P.z)){P[ax]=o;if(ax==='y'){if(P.vy<0){P.on=true;if(!P.inWater&&pvy<-15&&mode==='survival')hurtPlayer(Math.floor((-pvy-13)/2.2),null);}P.vy=0;}else{P['v'+ax]=0;
    if(P.on&&!P.fly){const up=P.y+1.05;if(!collides(ax==='x'?o+v:P.x,up,ax==='z'?o+v:P.z)&&!collides(P.x,up,P.z)){P.y=up;P[ax]=o+v;}}}}else if(ax==='y')P.on=false;}
 if(P.y<-10){hurtPlayer(99);}
 if(lava&&Math.random()<dt*3)hurtPlayer(3);if(P.inWater&&B[head]?.liquid){P.air-=dt*.8;if(P.air<=0){P.air=0;if(Math.random()<dt*1.2)hurtPlayer(2);}}else P.air=Math.min(10,P.air+dt*4);
 if(mode==='survival'&&P.hp<20&&Math.random()<dt*.15)P.hp=Math.min(20,P.hp+1);
 // mining (hold)
 if(mouseL&&!mobHit()){const h=raycast(eye(),look(),6);if(h&&h.id!==16){const kk=h.x+','+h.y+','+h.z;if(!brk.b||brk.b!==kk){brk.b=kk;brk.t=0;const bd=B[h.id],tr=tier();brk.need=mode==='creative'?.12:bd.need?bd.hard*3/MULT[tr]:bd.hard;brk.ok=!bd.need||tr>=bd.need;}swing=Math.max(swing,.2);brk.t+=dt;if(brk.t>=brk.need){const drop=B[h.id].drop||h.id;debris(h.x+.5,h.y+.5,h.z+.5,h.id,10);set(h.x,h.y,h.z,0);sfx('break');if(mode==='survival'&&h.id!==5){if(brk.ok)give(drop);else toast('NEEDS A BETTER PICKAXE');}mined++;score+=B[h.id].ore||1;brk.b=null;drawBar();}}else brk.b=null;}else if(!mouseL)brk.b=null;
 // mobs
 if(mode==='survival'){const nH=mobs.filter(m=>m.kind==='husk'||m.kind==='bloater').length;if(night&&nH<6&&Math.random()<dt*.35){const a=Math.random()*6.28,r=18+Math.random()*10;makeMob(Math.random()<.3?'bloater':'husk',P.x+Math.cos(a)*r,P.z+Math.sin(a)*r);}}
 if(mobs.filter(m=>m.kind==='sheep').length<5&&Math.random()<dt*.2){const a=Math.random()*6.28,r=14+Math.random()*16,x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r,T=terrain(Math.floor(x),Math.floor(z));if(!T.desert&&T.h>SEA+1)makeMob('sheep',x,z);}
 for(const m of mobs.slice()){if(m.dead){scene.remove(m.g);mobs.splice(mobs.indexOf(m),1);continue;}mobStep(m,dt);if(m.dead){scene.remove(m.g);mobs.splice(mobs.indexOf(m),1);continue;}const d=Math.hypot(m.g.position.x-P.x,m.g.position.z-P.z);if(d>70||m.g.position.y<-5){scene.remove(m.g);mobs.splice(mobs.indexOf(m),1);}}
 if(saveT>0&&(saveT-=dt)<=0)save();if(flashT>0)flashT-=dt;}

/* ================= chunk streaming ================= */
function stream(budget){const pcx=Math.floor(P.x/CS),pcz=Math.floor(P.z/CS),todo=[];for(let dx=-RD;dx<=RD;dx++)for(let dz=-RD;dz<=RD;dz++){if(dx*dx+dz*dz>RD*RD+1)continue;const c=chunk(pcx+dx,pcz+dz);if(c.dirty)todo.push([dx*dx+dz*dz,c]);}
 todo.sort((a,b)=>a[0]-b[0]);for(let i=0;i<Math.min(budget,todo.length);i++)meshChunk(todo[i][1]);
 for(const[k,c]of chunks){if(Math.abs(c.cx-pcx)>RD+3||Math.abs(c.cz-pcz)>RD+3){for(const kk of['mesh','wmesh','tmesh'])dropMesh(c,kk);chunks.delete(k);}}return todo.length;}

/* ================= sky / lighting ================= */
let envT=0;const sunDir=new THREE.Vector3();
function lighting(dt){const a=dayT*Math.PI*2,el=Math.sin(a);sunDir.set(Math.cos(a)*.8,el,.35).normalize();SU.sunPosition.value.copy(sunDir);
 const day=THREE.MathUtils.smoothstep(el,-.12,.18);const moonUp=el<0;const ld=moonUp?sunDir.clone().negate():sunDir;sun.intensity=moonUp?.55*(1-day):2.6*day;sun.position.set(P.x+ld.x*90,P.y+ld.y*90,P.z+ld.z*90);sun.target.position.set(P.x,P.y,P.z);const warm=1-THREE.MathUtils.smoothstep(el,.02,.35);if(moonUp)sun.color.setRGB(.62,.72,1);else sun.color.setRGB(1,.94-warm*.3,.86-warm*.5);
 hemi.intensity=.3+.5*day;hemi.color.setRGB(.55+.2*day,.62+.2*day,.8+.1*day);const fc=new THREE.Color().setRGB(.04+.5*day+.32*warm*day,.06+.66*day+.04*warm*day,.14+.8*day-.28*warm*day,THREE.SRGBColorSpace);scene.fog.color.copy(fc);R.setClearColor(fc);
 stars.material.opacity=1-THREE.MathUtils.smoothstep(el,-.2,.05);clouds.position.set(Math.round(P.x/50)*50,CH+46,Math.round(P.z/50)*50);cloudU.uDay.value=day;cloudU.uSun.value.setRGB(1,.94-warm*.28,.9-warm*.45);moon.position.set(P.x-sunDir.x*300,P.y-sunDir.y*300,P.z-sunDir.z*300);moon.lookAt(P.x,P.y,P.z);sky.position.set(P.x,0,P.z);
 if(P.inWater&&B[get(Math.floor(P.x),Math.floor(P.y+1.62),Math.floor(P.z))]?.liquid){scene.fog.near=1;scene.fog.far=20;scene.fog.color.setRGB(.05,.2*day+.04,.35*day+.08);}else{scene.fog.near=52;scene.fog.far=RD*CS+6;}
 if((envT-=dt)<=0){envT=6;sky2.material.uniforms.sunPosition.value.copy(sunDir);Object.assign(sky2.material.uniforms,{});if(envRT)envRT.dispose();envRT=pmrem.fromScene(skyScene);scene.environment=envRT.texture;mat.envMapIntensity=.35*day+.05;}}

/* ================= debris, TNT, explosions ================= */
const tileCol=(()=>{const d=AT.canvas.getContext('2d').getImageData(0,0,128,64).data,out=[];for(let t=0;t<32;t++){let r=0,g=0,b=0,n=0;const ox=(t%8)*16,oy=(t>>3)*16;for(let y=0;y<16;y+=2)for(let x=0;x<16;x+=2){const i=((oy+y)*128+ox+x)*4;if(d[i+3]<128)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}out.push(new THREE.Color(n?r/n/255:.5,n?g/n/255:.5,n?b/n/255:.5).convertSRGBToLinear());}return out;})();
const DN=360,dMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.85}),DN);dMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);dMesh.castShadow=true;dMesh.frustumCulled=false;scene.add(dMesh);
const parts=[];let pHead=0;const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_p=new THREE.Vector3();for(let i=0;i<DN;i++){parts.push({t:0});dMesh.setColorAt(i,new THREE.Color(1,1,1));}
function debris(x,y,z,id,n,power=1){const bd=B[id];if(!bd)return;const col=tileCol[bd.s];for(let i=0;i<n;i++){const p=parts[pHead];pHead=(pHead+1)%DN;Object.assign(p,{x:x+(Math.random()-.5)*.6,y:y+(Math.random()-.5)*.6,z:z+(Math.random()-.5)*.6,vx:(Math.random()-.5)*3*power,vy:(1+Math.random()*3)*power,vz:(Math.random()-.5)*3*power,t:.7+Math.random()*.6,s:.08+Math.random()*.1,r:Math.random()*6});dMesh.setColorAt(parts.indexOf(p),col);}dMesh.instanceColor.needsUpdate=true;}
function stepDebris(dt){let n=0;for(let i=0;i<DN;i++){const p=parts[i];if(p.t<=0){_m.makeScale(0,0,0);dMesh.setMatrixAt(i,_m);continue;}n++;p.t-=dt;p.vy-=18*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;const ny=p.y+p.vy*dt;if(solid(get(Math.floor(p.x),Math.floor(ny-p.s/2),Math.floor(p.z)))){p.vy*=-.3;p.vx*=.6;p.vz*=.6;}else p.y=ny;p.r+=dt*6;
  const sc=p.s*Math.min(1,p.t*3);_m.compose(_p.set(p.x,p.y,p.z),_q.setFromEuler(_e.set(p.r,p.r*.7,0)),_s.set(sc,sc,sc));dMesh.setMatrixAt(i,_m);}dMesh.instanceMatrix.needsUpdate=true;}
const tntGeo=(()=>{const g=new THREE.BoxGeometry(.98,.98,.98),uv=g.attributes.uv;for(let f=0;f<6;f++){const t=f===2||f===3?26:25;for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,((t%8)+(uv.getX(i)*.96+.02))/8,1-((t>>3)+1-(uv.getY(i)*.96+.02))/4);}}return g;})();
const primed=[];const flash=new THREE.PointLight(0xffc080,0,26,1.4);scene.add(flash);let shakeT=0;
function ignite(x,y,z,fuse){const m=new THREE.Mesh(tntGeo,new THREE.MeshStandardMaterial({map:AT.map,emissive:0xffffff,emissiveIntensity:0,roughness:.8}));m.castShadow=true;m.position.set(x+.5,y+.5,z+.5);scene.add(m);primed.push({m,t:fuse,vy:3});sfx('hiss');}
function explode(x,y,z,r){sfx('boom');shakeT=Math.max(shakeT,.6*Math.min(1,14/Math.max(3,Math.hypot(P.x-x,P.y-y,P.z-z))));flash.position.set(x,y+1,z);flash.intensity=160;
 const cx=Math.floor(x),cy=Math.floor(y),cz=Math.floor(z),R2=Math.ceil(r);let blasted=0;
 for(let dx=-R2;dx<=R2;dx++)for(let dy=-R2;dy<=R2;dy++)for(let dz=-R2;dz<=R2;dz++){const d=Math.hypot(dx,dy,dz);if(d>r*(.8+.35*hash(cx+dx,cy+dy,cz+dz,seed)))continue;const bx=cx+dx,by=cy+dy,bz=cz+dz,id=get(bx,by,bz);if(!id||id===16||id===5||id===20)continue;
  if(B[id].tnt){set(bx,by,bz,0);ignite(bx,by,bz,.35+Math.random()*.5);continue;}if(Math.random()<.35)debris(bx+.5,by+.5,bz+.5,id,2,1.8);set(bx,by,bz,0);blasted++;if(mode==='survival'&&Math.random()<.2){const drop=B[id].drop||id;if(!B[id].torch)give(drop);}}
 score+=blasted;const pd=Math.hypot(P.x-x,P.y+.9-y,P.z-z);if(pd<r*2.2){hurtPlayer(Math.round(Math.max(1,(r*2.2-pd)*2.6)),{x,z});P.vy+=4*(1-pd/(r*2.2));}
 for(const m of mobs){const q=m.g.position,md=Math.hypot(q.x-x,q.y-y,q.z-z);if(md<r*2){m.hp-=(r*2-md)*4;m.hurt=.3;const k=(r*2-md)*1.4/(md||1);q.x+=(q.x-x)*k*.2;q.z+=(q.z-z)*k*.2;m.vy=6;if(m.hp<=0&&!m.dead){m.dead=true;score+=m.kind==='husk'?50:m.kind==='bloater'?80:5;}}}drawBar();}
function stepPrimed(dt){for(const p of primed.slice()){p.t-=dt;p.vy-=20*dt;const ny=p.m.position.y+p.vy*dt;if(solid(get(Math.floor(p.m.position.x),Math.floor(ny-.5),Math.floor(p.m.position.z)))){p.vy=0;p.m.position.y=Math.floor(ny-.5)+1.5;}else p.m.position.y=ny;
  const on=Math.sin(p.t*(p.t<1?30:12))>0;p.m.material.emissiveIntensity=on?1.4:0;p.m.scale.setScalar(1+(p.t<.4?(.4-p.t)*.5:0));
  if(p.t<=0){scene.remove(p.m);p.m.material.dispose();primed.splice(primed.indexOf(p),1);explode(p.m.position.x,p.m.position.y,p.m.position.z,3.6);}}
 if(flash.intensity>0)flash.intensity=Math.max(0,flash.intensity-dt*500);}
/* ================= clouds (world-anchored fbm layer) ================= */
const cloudU={uTime:WU.uTime,uDay:{value:1},uSun:{value:new THREE.Color(1,1,1)}};
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,uniforms:cloudU,
 vertexShader:'varying vec2 vW;varying vec2 vL;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;vL=position.xy/500.;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:`uniform float uTime,uDay;uniform vec3 uSun;varying vec2 vW;varying vec2 vL;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
 void main(){vec2 p=vW/140.+vec2(uTime*.006,uTime*.002);float c=fbm(p),d=fbm(p*2.3+4.);float cov=smoothstep(.54,.8,c);float fade=1.-smoothstep(.55,1.,length(vL));
  vec3 lit=mix(vec3(.74,.78,.86),vec3(1.08),smoothstep(.5,.9,c+d*.25));vec3 col=lit*mix(vec3(.05,.06,.1),uSun,uDay);gl_FragColor=vec4(col,cov*fade*.9);}`}));
clouds.rotation.x=-Math.PI/2;clouds.renderOrder=-1;scene.add(clouds);

/* ================= torch lights (nearest 6 torches get real point lights) ================= */
const TL=[];for(let i=0;i<6;i++){const l=new THREE.PointLight(0xffa048,0,15,1.5);scene.add(l);TL.push(l);}
let tlT=0,tlSet=[],heldId=0;
function torchLights(dt){const e=eye();if((tlT-=dt)<=0){tlT=.25;const arr=[],pcx=Math.floor(P.x/CS),pcz=Math.floor(P.z/CS);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const c=chunks.get(key(pcx+dx,pcz+dz));if(c&&c.torches)for(const v of c.torches)arr.push([v.distanceToSquared(e),v]);}arr.sort((a,b)=>a[0]-b[0]);tlSet=arr.slice(0,6).map(a=>a[1]);}
 const f=performance.now()/1000;let i=0;if(heldId===21&&state==='play'){TL[0].position.copy(e).add(look().multiplyScalar(.8));TL[0].intensity=6*(1+.1*Math.sin(f*17));i=1;}
 for(const v of tlSet){if(i>=6)break;TL[i].position.copy(v);TL[i].intensity=9*(1+.07*Math.sin(f*13+i*2.3)+.04*Math.sin(f*29+i));i++;}for(;i<6;i++)TL[i].intensity=0;}

/* ================= held item viewmodel ================= */
const held=new THREE.Group();held.position.set(.4,-.36,-.6);cam.add(held);const vmCache={};
const vmMat=(c,e)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:.65,metalness:e?0:.1,emissive:e?c:0,emissiveIntensity:e?4:0,depthTest:false,depthWrite:false,fog:false,transparent:true});return m;};
function vmBox(g,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.renderOrder=999;g.add(o);return o;}
function viewModel(kind,col){const k=kind+col;if(vmCache[k])return vmCache[k];const g=new THREE.Group();
 if(kind==='arm'){vmBox(g,.15,.15,.55,vmMat(0xd8a07a),0,-.02,.08);vmBox(g,.16,.16,.2,vmMat(0x3a6ab0),0,-.02,.3);}
 else if(kind==='torch'){vmBox(g,.06,.42,.06,vmMat(0x6a4a2a),0,0,0);vmBox(g,.1,.1,.1,vmMat(0xffb040,1),0,.24,0);g.rotation.set(-.35,0,.15);g.scale.setScalar(.6);g.position.set(.06,-.06,0);}
 else if(kind==='block'){const m=new THREE.MeshStandardMaterial({map:AT.map,depthTest:false,depthWrite:false,fog:false,roughness:.9,transparent:true});const geo=new THREE.BoxGeometry(.15,.15,.15);const t=B[col].s;const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,((t%8)+(uv.getX(i)*.96+.02))/8,1-((t>>3)+1-(uv.getY(i)*.96+.02))/4);const o=new THREE.Mesh(geo,m);o.renderOrder=999;o.rotation.set(.3,.6,0);o.position.set(.06,-.02,-.05);g.add(o);}
 else{const it=ITEMS[col];vmBox(g,.05,.55,.05,vmMat(0x7a5530),0,0,0);if(it.sword){vmBox(g,.07,.5,.02,vmMat(new THREE.Color(it.c).getHex()),0,.5,0);vmBox(g,.22,.04,.06,vmMat(0x3a3a40),0,.26,0);}else{vmBox(g,.46,.08,.08,vmMat(new THREE.Color(it.c).getHex()),0,.26,0);}g.rotation.set(-.55,0,.35);g.scale.setScalar(.75);g.position.set(.04,-.04,0);}
 vmCache[k]=g;return g;}
function updateHeld(){const id=hotbar()[slot]||0;heldId=id;const tr=tier();let v;if(id===21)v=viewModel('torch','');else if(id&&id<100&&!mouseL)v=viewModel('block',id);else if(inv[120]>0&&mode==='survival')v=viewModel('tool',120);else if(tr>0&&mode==='survival')v=viewModel('tool',109+tr);else if(id&&id<100)v=viewModel('block',id);else v=viewModel('arm','');if(held.children[0]!==v){held.clear();held.add(v);}}
let ph=0,bobT=0,lastMouse=false;
function animHeld(dt){if(mouseL!==lastMouse){lastMouse=mouseL;updateHeld();}const active=mouseL||swing>0;if(swing>0)swing-=dt;if(active)ph+=dt*13;else ph=0;const sp=Math.hypot(P.vx,P.vz);bobT+=dt*sp*1.6;
 held.visible=state==='play'&&!dead;held.rotation.x=-Math.abs(Math.sin(ph))*.9;held.rotation.y=Math.abs(Math.sin(ph))*.3;held.position.set(.4+Math.sin(bobT)*.02*Math.min(1,sp/4),-.36+Math.abs(Math.cos(bobT))*.025*Math.min(1,sp/4)-(active?.05:0),-.6);}

/* ================= main loop ================= */
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();fx&&fx.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);
seed=1234;initNoise();spawn();buildFx();resize();
let last=performance.now(),menuA=0;
let goalT=0;
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;WU.uTime.value=now/1000%1000;step(dt);if(state==='play'){stepPrimed(dt);}stepDebris(dt);stream(state==='play'?2:4);lighting(dt);torchLights(dt);animHeld(dt);if((goalT-=dt)<=0&&state==='play'){goalT=.4;goals();}
 if(state==='play'||state==='paused'){cam.position.copy(eye());cam.rotation.set(P.pitch,P.yaw,0,'YXZ');if(shakeT>0){shakeT=Math.max(0,shakeT-dt);const a=shakeT*shakeT*.9;cam.position.x+=(Math.random()-.5)*a;cam.position.y+=(Math.random()-.5)*a;cam.position.z+=(Math.random()-.5)*a;}}else{menuA+=dt*.03;cam.position.set(P.x+Math.cos(menuA)*30,P.y+22,P.z+Math.sin(menuA)*30);cam.lookAt(P.x,P.y+2,P.z);}
 fx.grade&&(fx.grade.uniforms.tint.value.setRGB(1,flashT>0?.6:1,flashT>0?.6:1));fx.render();hud();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
window.VOXEL={step,stream,P,get,set,raycast,eye,look,terrain,get state(){return state;},newWorld,get inv(){return inv;},get score(){return score;},get mobs(){return mobs;},makeMob,keys,attack,place,get chunks(){return chunks;},set dayT(v){dayT=v;},get dayT(){return dayT;},lighting,setMode:m=>{mode=m;drawBar();},mineAt:()=>{mouseL=true;},stopMine:()=>{mouseL=false;},render:()=>fx.render(),R,sun,fxq:()=>fx.q,renderFrom:()=>{cam.position.copy(eye());cam.rotation.set(P.pitch,P.yaw,0,'YXZ');hud();animHeld(0);torchLights(1);fx.render();},ignite,explode,debris,primed,stepPrimed,stepDebris,WU,clouds,craft,RECIPES,openCraft,closeCraft,tier,get goal(){return goal;},goals,give,TL,held,updateHeld,set slot(v){slot=v;drawBar();}};
