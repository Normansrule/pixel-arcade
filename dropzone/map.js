// DROPZONE — "Port Halvard": a 620 m coastal city. Street grid, downtown towers, enterable multi-storey buildings with stairs and roof access,
// warehouses, a harbour with cranes and containers, a foundry, a power plant, a rail yard, suburbs, depots (buy stations), loot spots,
// and the off-shore gulag arena "THE CAGE".
import * as THREE from '../vendor/three.module.min.js';
import {World,Geo,LAND} from './world.js';

export function makeMats(T){const std=(t,o={})=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,map:t?t.map:null,normalMap:t?t.normalMap:null,roughness:.9,metalness:0,...o});if(t)m.normalScale=new THREE.Vector2(.8,.8);return m;};
 const fc=document.createElement('canvas');fc.width=fc.height=64;const x=fc.getContext('2d');x.strokeStyle='#c8ccd0';x.lineWidth=2.2;for(let i=-64;i<128;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}
 const ft=new THREE.CanvasTexture(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.colorSpace=THREE.SRGBColorSpace;
 const M={conc:std(T.conc,{roughness:.95}),plaster:std(T.plaster,{roughness:.92}),brick:std(T.brick,{roughness:.9}),metal:std(T.metal,{roughness:.55,metalness:.45}),corr:std(T.corr,{roughness:.6,metalness:.35}),wood:std(T.wood,{roughness:.8}),floor:std(T.floor,{roughness:.7}),tile:std(T.tile,{roughness:.5}),
  asph:std(T.asph,{roughness:.97}),roof:std(T.roof,{roughness:.95}),steel:std(T.steel,{roughness:.45,metalness:.6}),rust:std(T.rust,{roughness:.85,metalness:.3}),fabric:std(T.fabric,{roughness:1}),
  facA:std(T.facA,{roughness:.6,metalness:.1}),facB:std(T.facB,{roughness:.7}),facC:std(T.facC,{roughness:.45,metalness:.2}),facD:std(T.facD,{roughness:.7}),grass:std(T.grass,{roughness:1}),sand:std(T.sand,{roughness:1}),
  glow:new THREE.MeshStandardMaterial({color:0x111111,emissive:0xfff2dc,emissiveIntensity:2.2,vertexColors:true}),screen:new THREE.MeshStandardMaterial({color:0x0a1a10,emissive:0x2aff8a,emissiveIntensity:.95,vertexColors:true}),
  fence:new THREE.MeshStandardMaterial({map:ft,alphaTest:.45,side:THREE.DoubleSide,roughness:.5,metalness:.6,vertexColors:true}),
  glass:new THREE.MeshStandardMaterial({color:0x8fa8b8,roughness:.08,metalness:.85,vertexColors:true,envMapIntensity:1.4}),
  dark:new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:1,vertexColors:true}),paint:std(null,{roughness:.6})};
 M.fence.userData.noShadow=true;M.glow.userData.noShadow=true;M.screen.userData.noShadow=true;for(const k in M)M[k].envMapIntensity=M[k].envMapIntensity===1?.6:M[k].envMapIntensity;
 const fac=t=>{t.map.repeat.set(1,1);};['facA','facB','facC','facD'].forEach(k=>fac(T[k]));return M;}
const UVS={conc:3,plaster:2.5,brick:2.2,metal:2.6,corr:3,wood:1.6,floor:2,tile:2,asph:8,roof:4,steel:2,rust:2,fabric:1,glow:1,screen:1,fence:2.4,dark:2,paint:2,grass:6,sand:6,glass:4,facA:6,facB:6,facC:6,facD:6};
// surface ids for impacts + footsteps: 0 concrete 1 metal 2 wood 3 dirt 4 water 5 soft
const SURF={conc:0,plaster:0,brick:0,metal:1,corr:1,steel:1,rust:1,wood:2,floor:0,tile:0,asph:0,roof:0,fabric:5,dark:0,fence:1,glow:0,screen:1,paint:1,glass:1,grass:3,sand:3,facA:0,facB:0,facC:0,facD:0};
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

export const ROADS=[-240,-160,-80,0,80,160,240],RW=6,SW=3;
export const GULAG={x:420,z:0,w:36,d:24};

export function buildMap(mats){const geo=new Geo();geo.uvs=UVS;const W=new World();const R=rng(4242);const pick=a=>a[(R()*a.length)|0];
 const foot=[],spots=[],crates=[],depots=[],vehicles=[],props=[],pois=[],parks=[],stairsL=[],navBlock=[];
 const S=(x0,y0,z0,x1,y1,z1,m,t=0xffffff,o={})=>{geo.box(x0,y0,z0,x1,y1,z1,m,t,o);return W.add(x0,y0,z0,x1,y1,z1,o.f??3,SURF[m]);};
 const Vb=(x0,y0,z0,x1,y1,z1,m,t=0xffffff,o={})=>geo.box(x0,y0,z0,x1,y1,z1,m,t,o);
 const Cb=(x0,y0,z0,x1,y1,z1,f=3,m=0)=>W.add(x0,y0,z0,x1,y1,z1,f,m);
 const IND=.62;

 /* ---------- walls with openings ---------- */
 function pieces(a0,a1,y0,y1,ops){const out=[];let cur=a0;for(const o of ops.slice().sort((p,q)=>p.a-q.a)){if(o.a>cur+.01)out.push([cur,o.a,y0,y1]);if(o.lo>.01)out.push([o.a,o.b,y0,y0+o.lo]);if(y0+o.hi<y1-.01)out.push([o.a,o.b,y0+o.hi,y1]);cur=Math.max(cur,o.b);}if(cur<a1-.01)out.push([cur,a1,y0,y1]);return out;}
 function wall(ax,c0,c1,a0,a1,y0,y1,ops,ext,et,inm,it,outer,eo={}){const m=(c0+c1)/2;
  for(const[a,b,ya,yb]of pieces(a0,a1,y0,y1,ops)){const bx=(p,q)=>ax==='x'?[a,ya,p,b,yb,q]:[p,ya,a,q,yb,b];
   if(outer===0)geo.box(...bx(c0,c1),inm,it,{ind:IND});
   else{const oc=outer<0?[c0,m]:[m,c1],ic=outer<0?[m,c1]:[c0,m];const sk=ax==='x'?(outer<0?{pz:1}:{nz:1}):(outer<0?{px:1}:{nx:1});const sk2=ax==='x'?(outer<0?{nz:1}:{pz:1}):(outer<0?{nx:1}:{px:1});geo.box(...bx(oc[0],oc[1]),ext,et,{...eo,skip:sk});geo.box(...bx(ic[0],ic[1]),inm,it,{ind:IND,skip:sk2});}
   W.add(...bx(c0,c1),3,SURF[ext]);}
  for(const o of ops){if(o.lo>.5){if(ax==='x')Vb(o.a-.08,y0+o.lo-.08,c0-.1,o.b+.08,y0+o.lo,c1+.1,'conc',0xc8c4ba);else Vb(c0-.1,y0+o.lo-.08,o.a-.08,c1+.1,y0+o.lo,o.b+.08,'conc',0xc8c4ba);
    // thin glass pane remnants (visual only): broken windows show the lower half
    if(o.glass){if(ax==='x')Vb(o.a,y0+o.lo,m-.02,o.b,y0+o.lo+(o.hi-o.lo)*.35,m+.02,'glass',0x8899aa,{skip:{py:1,ny:1}});else Vb(m-.02,y0+o.lo,o.a,m+.02,y0+o.lo+(o.hi-o.lo)*.35,o.b,'glass',0x8899aa,{skip:{py:1,ny:1}});}}
   else if(o.lo<=.01&&o.frame!==false){const fw=.12,fy=y0+o.hi;if(ax==='x'){Vb(o.a-fw,y0,c0-.06,o.a,fy+fw,c1+.06,'wood',0x4a3a2a);Vb(o.b,y0,c0-.06,o.b+fw,fy+fw,c1+.06,'wood',0x4a3a2a);Vb(o.a,fy,c0-.06,o.b,fy+fw,c1+.06,'wood',0x4a3a2a);}
    else{Vb(c0-.06,y0,o.a-fw,c1+.06,fy+fw,o.a,'wood',0x4a3a2a);Vb(c0-.06,y0,o.b,c1+.06,fy+fw,o.b+fw,'wood',0x4a3a2a);Vb(c0-.06,fy,o.a,c1+.06,fy+fw,o.b,'wood',0x4a3a2a);}}}}
 function slab(x0,z0,x1,z1,y0,y1,m,t,holes=[],o={}){// rectangle minus up to one hole
  const h=holes[0];if(!h){S(x0,y0,z0,x1,y1,z1,m,t,o);return;}const[hx0,hz0,hx1,hz1]=h;
  if(hz0>z0)S(x0,y0,z0,x1,y1,hz0,m,t,o);if(hz1<z1)S(x0,y0,hz1,x1,y1,z1,m,t,o);if(hx0>x0)S(x0,y0,hz0,hx0,y1,hz1,m,t,o);if(hx1<x1)S(hx1,y0,hz0,x1,y1,hz1,m,t,o);}
 function flight(x,z,ax,dir,w,y0,y1,m='conc',t=0xa8a49c){const n=Math.ceil((y1-y0)/.25),rise=(y1-y0)/n,run=.3;for(let i=0;i<n;i++){const a=i*run*dir,b=(i+1)*run*dir;const yt=y0+rise*(i+1);
   if(ax==='x')S(x+Math.min(a,b),yt-Math.min(.5,yt-y0),z,x+Math.max(a,b),yt,z+w,m,t,{ind:.85});else S(x,yt-Math.min(.5,yt-y0),z+Math.min(a,b),x+w,yt,z+Math.max(a,b),m,t,{ind:.85});}
  // underside fill (visual) + collision under the steps so players cannot walk beneath
  const L=n*run;if(ax==='z'){const za=Math.min(z,z+L*dir),zb=Math.max(z,z+L*dir);Cb(x,y0,za,x+w,y0+Math.max(.01,(y1-y0)*.45),zb,1,0);}return L;}

 /* ---------- enterable building ----------
  d: {x0,z0,x1,z1, fl, h, ext, et, inm, it, front:'n'|'s'|'e'|'w', flr, roof:true (roof access), part:true, big:doors, win:spacing, kind} */
 function bld(d){const{x0,z0,x1,z1}=d,h=d.h??3.4,fl=d.fl??2,t=.3;const ext=d.ext??'brick',et=d.et??0xffffff,inm=d.inm??'plaster',it=d.it??0xe2dccf,flr=d.flr??'floor',ft=d.ft??0xffffff;
  const wx=x1-x0,wz=z1-z0;foot.push({x0,z0,x1,z1,h:fl*h,k:d.kind||'bld',col:d.mapc});
  // stair core: two side-by-side flights along z at the west wall
  const roofAcc=d.roof!==false,needSt=fl>1||roofAcc;const sw=1.25,L=Math.ceil(h/.25)*.3,sz0=z0+1.5,sx=x0+t+.05;const stOK=needSt&&wz>=L+3.6&&wx>=7;
  const fA=[sx,sz0,sx+sw,sz0+L],fB=[sx+sw,sz0,sx+sw*2,sz0+L];
  const ws=d.win??3.6,dw=d.big?4:1.8,dh=d.big?4.2:2.45;
  for(let f=0;f<fl;f++){const fy=f*h;
   if(f===0)S(x0,-.3,z0,x1,.12,z1,flr,ft,{});else{const hole=stOK?[(f-1)%2?fB:fA].map(q=>[q[0]-.05,q[1]-.05,q[2]+.05,q[3]+.05]):[];slab(x0+t,z0+t,x1-t,z1-t,fy-.18,fy+.12,flr,ft,hole);Vb(x0-.04,fy-.3,z0-.04,x1+.04,fy+.16,z1+.04,'conc',0xb8b4aa,{skip:{py:1,ny:1}});}
   const yb=fy+(f===0?0:.12),top=fy+h;
   const ops=s=>{const along=s==='n'||s==='s',a0=along?x0:z0,a1=along?x1:z1,len=a1-a0,out=[];
    if(f===0){const dr=d.doors||{};const dd=dr[s]??(s===d.front?[.5]:s===({n:'s',s:'n',e:'w',w:'e'})[d.front]&&len>8?[.5]:[]);for(const p of dd){const c=a0+len*p;out.push({a:c-dw/2,b:c+dw/2,lo:0,hi:dh});}}
    const n=Math.floor((len-1)/ws);for(let k=0;k<n;k++){const c=a0+(k+.5)*len/n;if(out.some(o=>c>o.a-1.3&&c<o.b+1.3))continue;if(s==='w'&&stOK&&c<sz0+L+.8)continue;if(d.noWin&&f===0)continue;
     out.push({a:c-.7,b:c+.7,lo:d.big?4.6:.95,hi:d.big?6.2:2.25,glass:R()<.5});}return out;};
   wall('x',z0,z0+t,x0,x1,yb,top,ops('n'),ext,et,inm,it,-1,d.eo);wall('x',z1-t,z1,x0,x1,yb,top,ops('s'),ext,et,inm,it,1,d.eo);
   wall('z',x0,x0+t,z0+t,z1-t,yb,top,ops('w'),ext,et,inm,it,-1,d.eo);wall('z',x1-t,x1,z0+t,z1-t,yb,top,ops('e'),ext,et,inm,it,1,d.eo);
   if(stOK&&(f<fl-1||roofAcc)){const odd=f%2;const fx=odd?fB:fA;flight(fx[0],odd?fx[3]:fx[1],'z',odd?-1:1,sw,yb+.0,top+.12,'conc',0xa8a49c);
    // railing between the flights (visual + collision)
    Vb(sx+sw-.03,yb,sz0+.3,sx+sw+.03,yb+1,sz0+L-.3,'steel',0x4a4e52);Cb(sx+sw-.03,yb,sz0+.3,sx+sw+.03,yb+1,sz0+L-.3,1,1);stairsL.push({x:sx,z:sz0,f});}
   // partition wall with a doorway (wide buildings)
   if(d.part!==false&&wx>13){const px=Math.round((x0+x1)/2+(stOK?1.5:0));const dz=z0+wz*(R()<.5?.3:.7);wall('z',px-.07,px+.07,z0+t,z1-t,yb,top,[{a:dz-.9,b:dz+.9,lo:0,hi:2.3,frame:false}],ext,et,inm,it,0);}
   // ceiling lights
   if(d.lights!==false){const nl=Math.max(1,Math.round(wx*wz/70));for(let i=0;i<nl;i++){const lx=x0+wx*(i+.5)/nl,lz=(z0+z1)/2;Vb(lx-.5,top-.08,lz-.08,lx+.5,top-.02,lz+.08,'glow',0xffffff);}}
   // furnishing + loot
   furnish(d,f,yb,stOK?sx+sw*2+.3:x0+t+.3);}
  // roof
  const ry=fl*h;const hole=stOK&&roofAcc?[[(fl-1)%2?fB:fA].map(q=>[q[0]-.05,q[1]-.05,q[2]+.05,q[3]+.05])[0]]:[];
  slab(x0,z0,x1,z1,ry,ry+.25,'roof',d.rt??0x9a9a96,hole);
  for(const[a,b,c,e]of[[x0,z0,x1,z0+.3],[x0,z1-.3,x1,z1],[x0,z0+.3,x0+.3,z1-.3],[x1-.3,z0+.3,x1,z1-.3]])S(a,ry+.25,b,c,ry+1.05,e,ext,et,d.eo||{});
  Vb(x0-.12,ry+1.05,z0-.12,x1+.12,ry+1.15,z1+.12,'conc',0xc8c4ba,{});
  if(stOK&&roofAcc){const q=(fl-1)%2?fB:fA;// rails around the roof hatch
   Vb(q[0]-.05,ry+.25,q[1]-.1,q[2]+.05,ry+1.2,q[1]-.04,'steel',0x5a5e60);Cb(q[0]-.05,ry+.25,q[1]-.1,q[2]+.05,ry+1.2,q[1]-.04,1,1);}
  const nu=Math.floor(wx*wz/80);for(let i=0;i<nu;i++){const ux=x0+3+R()*(wx-6),uz=z0+3+R()*(wz-6);if(stOK&&ux<x0+4&&uz<sz0+L+1)continue;props.push({k:'ac',x:ux,y:ry+.25,z:uz,r:(R()*4|0)*Math.PI/2});Cb(ux-.8,ry+.25,uz-.6,ux+.8,ry+1.3,uz+.6,3,1);}
  if(roofAcc)spots.push({x:x0+wx*.65,y:ry+.25,z:z0+wz*.6,lvl:2});
  return d;}
 // interior dressing + loot spots for one floor
 function furnish(d,f,y,xMin){const{x0,z0,x1,z1}=d,in_=.6;const k=d.kind||'bld';const n=Math.max(2,Math.round((x1-x0)*(z1-z0)/55));
  for(let i=0;i<n;i++){const x=xMin+.4+R()*Math.max(.5,x1-in_-xMin-.8),z=z0+in_+.4+R()*(z1-z0-in_*2-.8);if(Math.abs(x-(x0+x1)/2-1.5)<1.2)continue;
   const r=R();if(k==='ware'){if(r<.5)shelf(x,z,y,R()<.5);else crateStack(x,z,y,1+(R()*2|0));}
   else if(r<.35)table(x,z,y);else if(r<.55)shelf(x,z,y,R()<.5);else if(r<.7)sofa(x,z,y);else if(r<.82)crateStack(x,z,y,1);}
  // loot on the floor
  const ls=1+(R()*2.4|0)+(k==='ware'?1:0);for(let i=0;i<ls;i++){const x=xMin+.5+R()*Math.max(.3,x1-in_-xMin-1),z=z0+in_+.5+R()*(z1-z0-in_*2-1);spots.push({x,y:y+.02,z,lvl:f?1:0});}
  if(R()<(f===0?.5:.35)){const x=x1-1.1,z=z0+1+R()*(z1-z0-2);crates.push({x,y,z,q:3});Cb(x-.5,y,z-.35,x+.5,y+.62,z+.35,3,2);}}
 const WOODT=[0x9a7a5a,0x7a5a3e,0xb0906a,0x6a4a34];
 function table(x,z,y,w=1.6,dd=.9){const t=pick(WOODT);S(x-w/2,y+.72,z-dd/2,x+w/2,y+.78,z+dd/2,'wood',t,{ind:.8,f:2});for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])Vb(x+sx*(w/2-.06)-.03,y,z+sz*(dd/2-.06)-.03,x+sx*(w/2-.06)+.03,y+.72,z+sz*(dd/2-.06)+.03,'wood',t,{ind:.7});Cb(x-w/2+.08,y,z-dd/2+.08,x+w/2-.08,y+.72,z+dd/2-.08,1);}
 function shelf(x,z,y,rot){const w=rot?.5:2,dd=rot?2:.5,h=2;const c=pick([0x5a6e88,0x7a6a5a,0x6a7a6a]);for(let l=0;l<4;l++)Vb(x-w/2,y+.1+l*.62,z-dd/2,x+w/2,y+.14+l*.62,z+dd/2,'steel',c,{ind:.85});
  for(const s of[-1,1])Vb(rot?x-w/2:x+s*(w/2-.03)-.03,y,rot?z+s*(dd/2-.03)-.03:z-dd/2,rot?x+w/2:x+s*(w/2-.03)+.03,y+h,rot?z+s*(dd/2-.03)+.03:z+dd/2,'steel',c,{ind:.8});
  for(let l=0;l<3;l++)for(let a=0;a<3;a++)if(R()<.7){const bw=.35+R()*.2;const cx=rot?x:x-.65+a*.65,cz=rot?z-.65+a*.65:z;Vb(cx-bw/2,y+.14+l*.62,cz-bw/2*(rot?1:.8),cx+bw/2,y+.14+l*.62+.25+R()*.2,cz+bw/2*(rot?1:.8),'fabric',pick([0xa88a62,0x8a6a48,0x6a7a5a,0xb0a080,0x5a6a7a]),{ind:.75});}
  Cb(x-w/2,y,z-dd/2,x+w/2,y+h,z+dd/2,3,1);}
 function sofa(x,z,y){const c=pick([0x6a3a32,0x3a4a5a,0x5a5a4a,0x7a6a52]);S(x-1,y,z-.45,x+1,y+.45,z+.45,'fabric',c,{ind:.8,s:.8});Vb(x-1,y+.45,z+.25,x+1,y+.9,z+.45,'fabric',c,{ind:.75,s:.8});}
 function crateStack(x,z,y,n=2,t=0xa08060){for(let k=0;k<n;k++){const s=1-k*.1,o=(R()-.5)*.15;S(x-s/2+o,y+k*.98,z-s/2,x+s/2+o,y+k*.98+.98,z+s/2,'wood',t,{});}}

 /* ---------- solid towers + facades ---------- */
 function tower(x0,z0,x1,z1,h,fac=pick(['facA','facB','facC','facD'])){const tint=fac==='facC'?pick([0xffffff,0xdce8f0,0xe8f0e8]):0xffffff;S(x0,0,z0,x1,h,z1,fac,tint,{su:6,sv:6.4,skip:{py:1,ny:1}});
  S(x0-.15,h,z0-.15,x1+.15,h+.4,z1+.15,'conc',0x9a968e,{});Vb(x0+.4,h+.4,z0+.4,x1-.4,h+.42,z1-.4,'roof',0x8a8a86);
  // ground-floor storefront band
  Vb(x0-.2,3.2,z0-.2,x1+.2,3.6,z1+.2,'conc',pick([0x2a2e34,0x6a2a22,0x2a4a6a,0xb8b0a0]),{});
  foot.push({x0,z0,x1,z1,h,k:'tower'});const wx=x1-x0,wz=z1-z0;
  if(h>14){props.push({k:'water',x:x0+wx*.3,y:h+.4,z:z0+wz*.35,r:0});Cb(x0+wx*.3-1.3,h+.4,z0+wz*.35-1.3,x0+wx*.3+1.3,h+5,z0+wz*.35+1.3,3,1);}
  for(let i=0;i<Math.floor(wx*wz/120);i++){const ux=x0+2+R()*(wx-4),uz=z0+2+R()*(wz-4);props.push({k:'ac',x:ux,y:h+.4,z:uz,r:(R()*4|0)*Math.PI/2});}
  if(h>24&&R()<.6){Vb(x0+wx/2-.15,h+.4,z0+wz/2-.15,x0+wx/2+.15,h+9,z0+wz/2+.15,'steel',0xb0b0b0);Vb(x0+wx/2-.25,h+8.8,z0+wz/2-.25,x0+wx/2+.25,h+9.2,z0+wz/2+.25,'glow',0xff4040);}}
 function shipCont(x,z,q,t,y=0){const sw=q%2,L=6.06,Wd=2.44,Hh=2.59;const hx=sw?Wd/2:L/2,hz=sw?L/2:Wd/2;S(x-hx,y,z-hz,x+hx,y+Hh,z+hz,'corr',t,{s:2.6,su:sw?2.6:1.3});Vb(x-hx-.04,y+Hh-.12,z-hz-.04,x+hx+.04,y+Hh,z+hz+.04,'steel',t);Vb(x-hx-.04,y,z-hz-.04,x+hx+.04,y+.14,z+hz+.04,'steel',0x2a2a2a);foot.push({x0:x-hx,z0:z-hz,x1:x+hx,z1:z+hz,h:y+Hh,k:'cont',col:t});}
 function barrier(x,z,q){const sw=q%2;S(x-(sw?.3:1),0,z-(sw?1:.3),x+(sw?.3:1),.85,z+(sw?1:.3),'conc',0xb0aca2);}
 function fence(x0,z0,x1,z1,h=2.3){const ax=Math.abs(x1-x0)>Math.abs(z1-z0)?'x':'z';const L=ax==='x'?Math.abs(x1-x0):Math.abs(z1-z0);
  if(ax==='x'){const zz=z0;Vb(Math.min(x0,x1),0,zz-.01,Math.max(x0,x1),h,zz+.01,'fence',0xffffff,{s:2.4});W.add(Math.min(x0,x1),0,zz-.08,Math.max(x0,x1),h,zz+.08,1,1);for(let a=0;a<=L;a+=3)geo.cyl(Math.min(x0,x1)+a,0,zz,.05,h+.1,'steel',0x777,6);}
  else{const xx=x0;Vb(xx-.01,0,Math.min(z0,z1),xx+.01,h,Math.max(z0,z1),'fence',0xffffff,{s:2.4});W.add(xx-.08,0,Math.min(z0,z1),xx+.08,h,Math.max(z0,z1),1,1);for(let a=0;a<=L;a+=3)geo.cyl(xx,0,Math.min(z0,z1)+a,.05,h+.1,'steel',0x777,6);}}
 function tree(x,z,s=1){props.push({k:'tree',x,y:0,z,r:R()*6,s});Cb(x-.25*s,0,z-.25*s,x+.25*s,5*s,z+.25*s,3,2);}
 function car(x,z,rot){const sw=Math.abs(Math.sin(rot))>.5;props.push({k:'car',x,y:0,z,r:rot,c:pick([0x8a2a22,0x2a4a7a,0xd8d8d0,0x3a3e44,0x5a6a4a,0x9a8a5a,0x1a1c20,0x6a6e74])});const hx=sw?2.15:.9,hz=sw?.9:2.15;Cb(x-hx,0,z-hz,x+hx,1.45,z+hz,3,1);}
 function dumpster(x,z,rot){props.push({k:'dump',x,y:0,z,r:rot,c:pick([0x2a5a3a,0x2a3e6a,0x6a4a2a])});const sw=Math.abs(Math.sin(rot))>.5;Cb(x-(sw?.7:1),0,z-(sw?1:.7),x+(sw?.7:1),1.3,z+(sw?1:.7),3,1);}
 function barrel(x,z,y=0){props.push({k:'barrel',x,y,z,r:0,c:pick([0x3a5a8a,0x8a3a2a,0x4a5a3a,0x6a6a6a])});Cb(x-.3,y,z-.3,x+.3,y+.92,z+.3,3,1);}
 function lamp(x,z,r){props.push({k:'lamp',x,y:0,z,r});Cb(x-.12,0,z-.12,x+.12,7,z+.12,3,1);}

 /* ================= GROUND + ROADS ================= */
 const B0=-306,B1=306;const blocks=[];const edges=[B0,...ROADS.flatMap(r=>[r-RW-SW,r+RW+SW]),B1];for(let i=0;i<8;i++)for(let j=0;j<8;j++)blocks.push({bi:i,bj:j,x0:edges[i*2],x1:edges[i*2+1],z0:edges[j*2],z1:edges[j*2+1]});
 for(const r of ROADS){for(let a=-LAND+4;a<LAND-4;a+=40){const e=Math.min(a+40,LAND-4);Vb(r-RW,-.2,a,r+RW,.02,e,'asph',0xffffff,{skip:{ny:1}});Vb(a,-.2,r-RW,e,.021,r+RW,'asph',0xffffff,{skip:{ny:1}});}
  // lane markings
  for(let a=-LAND+8;a<LAND-8;a+=8){if(ROADS.some(q=>Math.abs(a+1.5-q)<RW+1))continue;Vb(r-.08,.022,a,r+.08,.03,a+3,'paint',0xd8c860,{});Vb(a,.023,r-.08,a+3,.031,r+.08,'paint',0xd8c860,{});}
  // crosswalks at intersections
  for(const q of ROADS)for(let k=-2;k<=2;k++){Vb(r-RW+.5,.024,q+RW+1+k*.0,r+RW-.5,.032,q+RW+1.6,'paint',0xe0e0d8,{});}}
 // sidewalks (low curbs, walkable) around every block
 for(const b of blocks){const x0=b.x0,x1=b.x1,z0=b.z0,z1=b.z1;const c=0xb8b4ac;
  if(b.bi>0)S(x0-SW,0,z0-SW,x0,.14,z1+SW,'conc',c,{s:1.5,f:1});if(b.bi<7)S(x1,0,z0-SW,x1+SW,.14,z1+SW,'conc',c,{s:1.5,f:1});
  if(b.bj>0)S(x0,0,z0-SW,x1,.14,z0,'conc',c,{s:1.5,f:1});if(b.bj<7)S(x0,0,z1,x1,.14,z1+SW,'conc',c,{s:1.5,f:1});}
 // street lamps + parked cars along roads
 for(const r of ROADS)for(let a=-290;a<=290;a+=24){if(ROADS.some(q=>Math.abs(a-q)<14))continue;lamp(r+RW+1.2,a,Math.PI);lamp(r-RW-1.2,a+12,0);if(R()<.35)car(r+RW-1.3,a+6+R()*4,0);if(R()<.3)car(a+5,r-RW+1.3,Math.PI/2);}

 /* ================= DISTRICTS ================= */
 const B=(i,j)=>blocks.find(b=>b.bi===i&&b.bj===j);
 const poi=(n,x,z,r=60)=>pois.push({n,x,z,r});
 const FT=[0xffffff,0xf0e0d0,0xd8c8b8,0xe8e8f0];const PLT=[0xe8e0d0,0xd8e4ea,0xead6c8,0xdcdcd0,0xc8d4c0,0xf0e4c8];
 // generic mixed block: a ring of enterable buildings + a mid-rise + parking/courtyard
 function mixed(b,o={}){const{x0,x1,z0,z1}=b;const W_=x1-x0,D_=z1-z0;const ext=()=>pick(['brick','plaster','plaster']);
  const A={x0:x0+2,z0:z0+2,x1:x0+2+16+R()*4|0,z1:z0+2+12+R()*3|0},Bq={x0:x1-2-(14+R()*5|0),z0:z0+2,x1:x1-2,z1:z0+2+(12+R()*4|0)};
  const e1=ext();bld({...A,fl:2+(R()*2|0),ext:e1,et:e1==='plaster'?pick(PLT):pick(FT),front:'n'});const e2=ext();bld({...Bq,fl:1+(R()*3|0),ext:e2,et:e2==='plaster'?pick(PLT):pick(FT),front:'n'});
  const Cq={x0:x0+2,z0:z1-2-(13+R()*4|0),x1:x0+2+(15+R()*5|0),z1:z1-2};const e3=ext();bld({...Cq,fl:2+(R()*2|0),ext:e3,et:e3==='plaster'?pick(PLT):pick(FT),front:'s'});
  if(o.tower!==false&&R()<.75)tower(x1-2-(14+R()*6|0),z1-2-(14+R()*6|0),x1-2,z1-2,10+(R()*4|0)*3.2);else{const D={x0:x1-2-16,z0:z1-2-13,x1:x1-2,z1:z1-2};const e=ext();bld({...D,fl:2,ext:e,et:e==='plaster'?pick(PLT):pick(FT),front:'s'});}
  // courtyard: parked cars, dumpsters, loot
  const cx=(x0+x1)/2,cz=(z0+z1)/2;for(let i=0;i<3;i++){if(R()<.6)car(cx-8+i*6+R(),cz+(R()-.5)*6,R()<.5?0:Math.PI);}dumpster(cx+(R()-.5)*16,cz-8,Math.PI/2);
  for(let i=0;i<3;i++)spots.push({x:cx+(R()-.5)*22,y:0,z:cz+(R()-.5)*14,lvl:0});if(R()<.5)barrel(cx+(R()-.5)*18,cz+6+R()*3);}
 function residential(b){const{x0,x1,z0,z1}=b;for(let i=0;i<2;i++)for(let j=0;j<2;j++){const hx=x0+4+i*31,hz=z0+4+j*31;const w=12+R()*4|0,dd=10+R()*3|0;const e=R()<.5?'plaster':'brick';
   bld({x0:hx,z0:hz,x1:hx+w,z1:hz+dd,fl:2,h:3.1,ext:e,et:e==='plaster'?pick(PLT):pick(FT),front:j?'s':'n',kind:'house',flr:'wood',ft:0xd0b090,win:3.2});
   // yard fence + trees
   const fx0=hx-2,fz0=hz-2,fx1=hx+26,fz1=hz+24;if(R()<.7){fence(fx0,j?fz0:fz1,fx1,j?fz0:fz1,1.4);}tree(hx+w+5+R()*6,hz+3+R()*12,.8+R()*.5);tree(hx+3+R()*8,hz+dd+4+R()*6,.8+R()*.5);
   if(R()<.5)car(hx+w+4,hz+dd/2,0);spots.push({x:hx+w+3,y:0,z:hz+dd+3,lvl:0});}}
 function park(b){const{x0,x1,z0,z1}=b;parks.push([x0,z0,x1,z1]);for(let i=0;i<26;i++)tree(x0+4+R()*(x1-x0-8),z0+4+R()*(z1-z0-8),.9+R()*.7);
  const cx=(x0+x1)/2,cz=(z0+z1)/2;geo.cyl(cx,0,cz,5,.6,'conc',0xb8b4aa,24);geo.cyl(cx,.6,cz,4.4,.05,'paint',0x4a7a8a,24);W.add(cx-4,0,cz-4,cx+4,.6,cz+4,1,0);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;props.push({k:'bench',x:cx+Math.cos(a)*9,y:0,z:cz+Math.sin(a)*9,r:-a+Math.PI/2});}
  // small pavilion
  bld({x0:x0+6,z0:z1-16,x1:x0+18,z1:z1-6,fl:1,h:3.4,ext:'wood',et:0xa08060,front:'n',kind:'house',roof:false,part:false});for(let i=0;i<5;i++)spots.push({x:x0+8+R()*(x1-x0-16),y:0,z:z0+8+R()*(z1-z0-16),lvl:0});}
 function warehouse(x0,z0,x1,z1,o={}){bld({x0,z0,x1,z1,fl:1,h:o.h||8,ext:'corr',et:o.c??pick([0xc8ccd0,0xb8c4c8,0xd0c0a8,0xa8b4a0]),inm:'corr',it:0xb0b4b8,flr:'conc',ft:0xc8c4bc,big:true,front:o.front||'n',kind:'ware',win:7,part:false,roof:o.roof??false,eo:{su:3,sv:3}});}
 // --- HARBOR (east column) ---
 for(let j=0;j<8;j++){const b=B(7,j);const{x0,x1,z0,z1}=b;
  if(j%3===1){warehouse(x0+2,z0+4,x0+30,z1-6,{front:'w'});const CC=[0x9a3a2a,0x2a5a8a,0x3a6a3a,0x8a8a82,0xb0702a,0x5a3a6a,0x2a6a7a];for(let k=0;k<4;k++){shipCont(x1-8,z0+6+k*3.2,0,CC[(j+k)%7]);if(R()<.5)shipCont(x1-8,z0+6+k*3.2,0,CC[(j+k+3)%7],2.59);}spots.push({x:x1-14,y:0,z:z1-10,lvl:0});}
  else{const CC=[0x9a3a2a,0x2a5a8a,0x3a6a3a,0x8a8a82,0xb0702a,0x5a3a6a,0x2a6a7a];for(let r=0;r<3;r++)for(let k=0;k<5;k++){if(R()<.25)continue;const cx=x0+8+r*14,cz=z0+6+k*11;shipCont(cx,cz,1,CC[(r*5+k+j)%7]);if(R()<.45)shipCont(cx,cz,1,CC[(r*5+k+j+2)%7],2.59);if(R()<.3)spots.push({x:cx+2.2,y:0,z:cz,lvl:0});}
   if(R()<.6)crates.push({x:x0+15,y:0,z:(z0+z1)/2,q:0});}
  // quay edge bollards + cranes
  for(let z=z0;z<z1;z+=10)geo.cyl(LAND-1.5,0,z,.22,.6,'steel',0x2a2c2e,10);
  if(j%2===0){const cz=(z0+z1)/2,cx=x1-3;for(const[lx,lz]of[[cx-5,cz-4],[cx-5,cz+4],[cx+5,cz-4],[cx+5,cz+4]])S(lx-.6,0,lz-.6,lx+.6,24,lz+.6,'steel',0xd8a030,{});
   Vb(cx-30,24,cz-4.6,cx+40,25.6,cz-3.4,'steel',0xd8a030);Vb(cx-30,24,cz+3.4,cx+40,25.6,cz+4.6,'steel',0xd8a030);for(let x=cx-28;x<cx+40;x+=4)Vb(x,24,cz-3.4,x+.4,25.4,cz+3.4,'steel',0xd8a030);
   Vb(cx-2,21,cz-2,cx+3,24,cz+2,'steel',0xd8d0b8);for(let y=2;y<24;y+=4)for(const lx of[cx-5,cx+5])geo.beam(lx,y,cz-4,lx,y+4,cz+4,.18,'steel',0xd8a030);geo.cyl(cx+20,16,cz,.04,8,'steel',0x333,4);}}
 // piers + moored ships (visual, beyond the walkable edge)
 for(const pz of[-200,-40,120]){Vb(LAND-2,-2,pz-6,LAND+60,.35,pz+6,'wood',0x8a7a60,{s:1.6});for(let x=LAND;x<LAND+60;x+=5)for(const z of[pz-5.6,pz+5.6])geo.cyl(x,-4,z,.25,4.3,'wood',0x5a4a3a,8);}
 {const sx=LAND+40,sz=40;S(sx-9,-3,sz-60,sx+9,4,sz+60,'steel',0x2a3a4a,{f:0});Vb(sx-9.1,4,sz-60,sx+9.1,4.4,sz+60,'steel',0x8a3a2a,{});Vb(sx-7,4.4,sz+30,sx+7,14,sz+50,'steel',0xe8e4d8,{});Vb(sx-7.1,11,sz+30.5,sx+7.1,12.5,sz+49.5,'steel',0x1a2430,{});
  const CC=[0x9a3a2a,0x2a5a8a,0x3a6a3a,0xb0702a];for(let r=0;r<2;r++)for(let k=0;k<7;k++)for(let l=0;l<2;l++)Vb(sx-6+r*6.2,4.4+l*2.6,sz-52+k*11,sx+r*6.2-.2,4.4+l*2.6+2.59,sz-52+k*11+10,'corr',CC[(r+k+l)%4],{s:2.6});}
 poi('HARBOR',278,0,40);
 // --- FOUNDRY (north-east) ---
 for(const[i,j]of[[4,0],[5,0],[6,0],[5,1],[6,1]]){const b=B(i,j);const{x0,x1,z0,z1}=b;
  if((i+j)%2===0){warehouse(x0+3,z0+4,x1-3,z0+30,{front:'s',h:10,c:0xb8a890,roof:true});
   for(let k=0;k<3;k++){const cx=x0+10+k*16,cz=z1-14;geo.cyl(cx,0,cz,4,14,'rust',0xc0a080,16);geo.cyl(cx,14,cz,4,1.2,'steel',0x777,16,'y',{r2:1});W.add(cx-3.4,0,cz-3.4,cx+3.4,14,cz+3.4,3,1);foot.push({x0:cx-4,z0:cz-4,x1:cx+4,z1:cz+4,h:14,k:'silo'});}spots.push({x:x0+12,y:0,z:z1-5,lvl:0},{x:x1-10,y:0,z:z1-24,lvl:0});}
  else{warehouse(x0+3,z0+3,x0+28,z1-24,{front:'e'});bld({x0:x1-24,z0:z0+4,x1:x1-4,z1:z0+18,fl:3,ext:'brick',front:'w',kind:'office'});
   geo.cyl(x1-12,0,z1-12,2.2,42,'brick',0x9a5a42,14,'y',{r2:1.6});geo.cyl(x1-12,40,z1-12,1.8,1.5,'steel',0x333,14);W.add(x1-14,0,z1-14,x1-10,42,z1-10,3,0);foot.push({x0:x1-14.2,z0:z1-14.2,x1:x1-9.8,z1:z1-9.8,h:42,k:'stack'});
   for(let k=0;k<5;k++)barrel(x0+32+R()*10,z1-10+R()*6);crates.push({x:x0+40,y:0,z:z1-18,q:0});}
  // pipe racks
  for(let k=0;k<3;k++)geo.cyl(x0,5+k*.7,z0+33+k*.8,.3,x1-x0,'steel',[0x8a8a8a,0xa86a3a,0x5a6a7a][k],10,'x',{open:true});for(let x=x0+4;x<x1;x+=10)Vb(x-.15,0,z0+32.5,x+.15,6.6,z0+35.5,'steel',0x5a5e60);}
 poi('FOUNDRY',160,-250,70);
 // --- POWER PLANT (north-west) ---
 for(const[i,j]of[[1,0],[2,0]]){const b=B(i,j);const{x0,x1,z0,z1}=b;const cx=(x0+x1)/2,cz=(z0+z1)/2;
  if(i===1){// cooling tower (hyperboloid) + transformer yard
   const tx=cx-6,tz=cz-6,seg=24;for(let k=0;k<10;k++){const y=k*3.5,f=(t)=>18-Math.sin(t*Math.PI)*6;geo.cyl(tx,y,tz,f(k/10),3.5,'conc',0xd0ccc4,seg,'y',{r2:f((k+1)/10),open:true});}
   W.add(tx-14,0,tz-14,tx+14,35,tz+14,3,0);foot.push({x0:tx-18,z0:tz-18,x1:tx+18,z1:tz+18,h:35,k:'cool'});navBlock.push([tx-18,tz-18,tx+18,tz+18]);
   for(let k=0;k<4;k++){const bx=x1-10,bz=z0+6+k*12;S(bx-2.5,0,bz-2,bx+2.5,3.2,bz+2,'steel',0x6a7a6a,{});for(let m=0;m<3;m++)geo.cyl(bx-1.5+m*1.5,3.2,bz,.15,1.8,'steel',0xb0a080,8);}
   fence(x1-15,z0+2,x1-15,z1-2);}
  else{bld({x0:x0+4,z0:z0+6,x1:x0+40,z1:z0+30,fl:2,h:5,ext:'brick',et:0xd0b8a0,front:'s',kind:'ware',big:true,win:6});warehouse(x0+6,z1-24,x1-6,z1-3,{front:'n',c:0xa8b8c0});}}
 poi('POWER PLANT',-160,-275,60);
 // --- DOWNTOWN (centre 2x2 blocks) ---
 for(const[i,j]of[[3,3],[4,3],[3,4],[4,4]]){const b=B(i,j);const{x0,x1,z0,z1}=b;const nearC=(xx,zz)=>Math.hypot(xx,zz)<36;
  // towers on the outer half, an enterable office block toward the plaza
  const ox=i===3?x0:x1-28,oz=j===3?z0:z1-26;tower(ox+2,oz+2,ox+26,oz+24,26+(R()*6|0)*3.2);
  const tx=i===3?x1-26:x0+2,tz=j===3?z0+2:z1-24;tower(tx,tz,tx+24,tz+22,18+(R()*4|0)*3.2,'facC');
  const ex=i===3?x0+2:x1-26,ez=j===3?z1-24:z0+2;bld({x0:ex,z0:ez,x1:ex+24,z1:ez+22,fl:3,h:3.6,ext:'plaster',et:pick(PLT),front:j===3?'s':'n',kind:'office',flr:'tile'});
  const fx=i===3?x1-24:x0+2,fz=j===3?z1-20:z0+2;bld({x0:fx,z0:fz,x1:fx+22,z1:fz+18,fl:2,h:4,ext:'brick',front:j===3?'s':'n',kind:'shop',flr:'tile',noWin:false});
  for(let k=0;k<3;k++)spots.push({x:(x0+x1)/2+(R()-.5)*10,y:0,z:(z0+z1)/2+(R()-.5)*10,lvl:0});void nearC;}
 // central plaza at the 0,0 intersection: fountain + barricades
 {geo.cyl(0,0,0,6,.8,'conc',0xc8c4bc,28);geo.cyl(0,.8,0,5.4,.05,'paint',0x3a6a7a,28);geo.cyl(0,0,0,.6,3.6,'conc',0xd8d4cc,12);W.add(-5,0,-5,5,.8,5,1,0);W.add(-.6,0,-.6,.6,3.6,.6,3,0);
  for(const[x,z,q]of[[-12,-9,0],[12,9,0],[-9,12,1],[9,-12,1],[-20,4,1],[20,-4,1]])barrier(x,z,q);}
 poi('DOWNTOWN',0,0,70);
 // --- HOSPITAL (bi 2, bj 1) ---
 {const b=B(2,1);const{x0,x1,z0,z1}=b;bld({x0:x0+4,z0:z0+6,x1:x1-4,z1:z0+34,fl:3,h:3.6,ext:'plaster',et:0xeef0f0,front:'s',kind:'office',flr:'tile',ft:0xe0ecec});
  Vb(x0+20,3*3.6+.26,z0+12,x0+40,3*3.6+.3,z0+28,'paint',0x3a8a5a,{});Vb(x0+28,3*3.6+.3,z0+16,x0+32,3*3.6+.33,z0+24,'paint',0xffffff,{});Vb(x0+24,3*3.6+.3,z0+18.5,x0+36,3*3.6+.33,z0+21.5,'paint',0xffffff,{});
  for(let k=0;k<3;k++)car(x0+14+k*8,z1-12,0);props.push({k:'amb',x:x1-14,y:0,z:z1-10,r:Math.PI/2});Cb(x1-16.6,0,z1-11.2,x1-11.4,2.6,z1-8.8,3,1);crates.push({x:x0+10,y:0,z:z1-6,q:0});}
 poi('HOSPITAL',-120,-200,50);
 // --- RAIL YARD (south row) ---
 for(const i of[2,3,4,5]){const b=B(i,7);const{x0,x1,z0,z1}=b;for(const tz of[z0+10,z0+20,z0+30]){Vb(x0-9,.02,tz-1.2,x1+9,.06,tz+1.2,'wood',0x5a4a3a,{s:1});for(const o of[-.72,.72])Vb(x0-9,.06,tz+o-.05,x1+9,.2,tz+o+.05,'steel',0x8a8a8a,{});}
  for(let k=0;k<3;k++){if(R()<.35)continue;const tz=z0+10+k*10,cx=x0+10+R()*30;const c=pick([0x7a3a2a,0x3a4a5a,0x5a5a4a,0x8a6a3a]);S(cx-7,1,tz-1.4,cx+7,4.4,tz+1.4,'corr',c,{});Vb(cx-6,0,tz-1,cx+6,1,tz+1,'steel',0x2a2a2a);Cb(cx-7,0,tz-1.4,cx+7,1,tz+1.4,3,1);foot.push({x0:cx-7,z0:tz-1.4,x1:cx+7,z1:tz+1.4,h:4.4,k:'car',col:c});spots.push({x:cx+8,y:0,z:tz+2.2,lvl:0});}
  if(i===3)bld({x0:x0+6,z0:z1-18,x1:x1-6,z1:z1-3,fl:2,h:4.2,ext:'brick',et:0xe0d0c0,front:'n',kind:'shop',flr:'tile'});if(i===5)warehouse(x0+4,z1-20,x0+34,z1-3,{front:'n'});}
 poi('RAIL YARD',-40,270,70);
 // --- LINDEN HEIGHTS (west residential) ---
 for(const i of[0,1])for(let j=2;j<=6;j++){if(i===1&&j===4){park(B(i,j));continue;}residential(B(i,j));}
 poi('LINDEN HEIGHTS',-240,40,90);
 // --- SUPERSTORE (bi 5, bj 5) ---
 {const b=B(5,5);const{x0,x1,z0,z1}=b;bld({x0:x0+4,z0:z0+4,x1:x1-4,z1:z0+36,fl:1,h:6,ext:'plaster',et:0xe8e0d0,inm:'plaster',it:0xf0f0ea,flr:'tile',front:'s',kind:'ware',big:true,doors:{s:[.3,.7],n:[.5]},roof:true,win:8,part:false});
  for(let k=0;k<5;k++)for(let m=0;m<3;m++)shelf(x0+12+k*8,z0+12+m*7,.12,false);Vb(x0+10,6.3,z0+3.2,x1-10,8,z0+3.6,'paint',0xd03030,{});for(let k=0;k<10;k++)car(x0+8+k*5,z1-12,0);}
 poi('SUPERSTORE',120,120,50);
 // --- TV STATION (bi 2, bj 3): radio mast ---
 {const b=B(2,3);const{x0,x1,z0,z1}=b;bld({x0:x0+4,z0:z0+4,x1:x0+30,z1:z0+24,fl:2,h:3.8,ext:'plaster',et:0xd8dee4,front:'s',kind:'office',flr:'tile'});
  const mx=x1-16,mz=z1-16;for(let k=0;k<12;k++){const y=k*5,w=2.4-k*.15;for(const[a,c]of[[-1,-1],[1,-1],[-1,1],[1,1]])geo.beam(mx+a*w,y,mz+c*w,mx+a*(w-.15),y+5,mz+c*(w-.15),.14,'steel',k%2?0xd03a2a:0xe8e8e8);geo.beam(mx-w,y,mz-w,mx+w-.15,y+5,mz+w-.15,.08,'steel',0xb0b0b0);}
  Vb(mx-.3,60,mz-.3,mx+.3,61,mz+.3,'glow',0xff3030);W.add(mx-2.4,0,mz-2.4,mx+2.4,60,mz+2.4,3,1);foot.push({x0:mx-2.4,z0:mz-2.4,x1:mx+2.4,z1:mz+2.4,h:60,k:'mast'});fence(mx-6,mz-6,mx+6,mz-6);dish(x0+12,z1-10);}
 function dish(x,z){geo.cyl(x,0,z,.4,4,'steel',0x9a9a9a,8);props.push({k:'dish',x,y:4,z,r:R()*6});Cb(x-.4,0,z-.4,x+.4,4,z+.4,3,1);}
 poi('TV STATION',-120,-40,40);
 // --- generic blocks everywhere else ---
 const done=new Set(['7','40','50','60','51','61','10','20','33','43','34','44','21','27','37','47','57','02','12','03','13','04','14','05','15','06','16','55','23']);
 for(const b of blocks){const key=''+b.bi+b.bj;if(done.has(key))continue;if(b.bi===7)continue;
  if(b.bi===0||b.bj===0||b.bj===7){// outskirts: lighter density near the coast
   if(R()<.5){mixed(b,{tower:false});}else{const{x0,x1,z0,z1}=b;warehouse(x0+6,z0+6,x0+6+26+(R()*8|0),z0+6+18+(R()*6|0),{front:b.bj===0?'s':'n'});for(let k=0;k<4;k++)tree(x0+4+R()*(x1-x0-8),z1-6-R()*10,.9+R()*.5);crates.push({x:x1-12,y:0,z:z1-12,q:0});spots.push({x:x1-16,y:0,z:z1-14,lvl:0});}}
  else mixed(b);}
 poi('OLD TOWN',-40,-120,60);poi('MIDTOWN',120,-80,60);poi('SOUTH END',120,200,60);poi('WEST DOCKS',-270,-260,40);
 // --- DEPOTS (buy stations) ---
 for(const[x,z]of[[-8.5,-30],[86,-86],[-86,86],[166,40],[-166,-120],[246,-170],[40,246],[-246,200],[-40,-246],[166,200]]){const q=Math.abs(x%80)<10?1:0;
  S(x-.6,0,z-.5,x+.6,2.3,z+.5,'steel',0x2a3036,{});Vb(x-.62,1.2,z-.52,x+.62,2.1,z+.52,'screen',0xffffff,{});Vb(x-.8,2.3,z-.7,x+.8,2.45,z+.7,'steel',0x1a1e22,{});Vb(x-.05,2.45,z-.05,x+.05,4.2,z+.05,'steel',0x4a4e52);Vb(x-.5,4.2,z-.05,x+.5,4.8,z+.05,'screen',0xffffff,{});
  depots.push({x,z,q});}
 // --- vehicles (armoured rovers) ---
 for(const[x,z,r]of[[-2,-60,0],[82,30,0],[-78,130,0],[162,-200,0],[-162,60,0],[238,110,0],[30,162,Math.PI/2],[-200,-78,Math.PI/2]])vehicles.push({x,z,r});
 // extra street loot
 for(let k=0;k<70;k++){const r=ROADS[(R()*7)|0],a=-290+R()*580;if(ROADS.some(q=>Math.abs(a-q)<10))continue;if(R()<.5)spots.push({x:r+(R()<.5?-1:1)*(RW+1.6),y:.14,z:a,lvl:0});else spots.push({x:a,y:.14,z:r+(R()<.5?-1:1)*(RW+1.6),lvl:0});}

 /* ================= THE CAGE (gulag) ================= */
 {const{x,z,w,d}=GULAG,x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;S(x0-14,-6,z0-12,x1+14,0,z1+12,'conc',0x8a8680,{s:4});
  for(const[a,b,c,e]of[[x0-.5,z0-.5,x1+.5,z0],[x0-.5,z1,x1+.5,z1+.5],[x0-.5,z0,x0,z1],[x1,z0,x1+.5,z1]])S(a,0,b,c,7,e,'conc',0x7a7670,{});
  // cage roof grid (visual)
  for(let k=0;k<=6;k++)Vb(x0+k*w/6-.1,7,z0,x0+k*w/6+.1,7.3,z1,'steel',0x3a3a3a);for(let k=0;k<=4;k++)Vb(x0,7,z0+k*d/4-.1,x1,7.3,z0+k*d/4+.1,'steel',0x3a3a3a);
  Vb(x0,7.1,z0,x1,7.15,z1,'fence',0xffffff,{s:3,skip:{ny:0}});
  // stands
  for(const s of[-1,1])for(let k=0;k<4;k++){Vb(x0-1-k*2.4,0,s<0?z0-3-k*2.2:z1+.5+k*2.2,x1+1+k*2.4,1.2+k*1.4,s<0?z0-.5-k*2.2:z1+3+k*2.2,'conc',0x6a6660,{});}
  for(let k=0;k<5;k++){const lx=x0+3+k*(w-6)/4;Vb(lx-.6,6.6,z0+.3,lx+.6,6.9,z0+.8,'glow',0xffffff);Vb(lx-.6,6.6,z1-.8,lx+.6,6.9,z1-.3,'glow',0xffffff);}
  // symmetric cover
  const cov=[[-10,0,1,2.2],[10,0,1,2.2],[-4,-6,2.4,1.2],[4,6,2.4,1.2],[0,0,1.2,1.2],[-12,-8,1.2,1.2],[12,8,1.2,1.2],[-6,7,1.6,1.2],[6,-7,1.6,1.2]];
  for(const[cx,cz,hw,hh]of cov){S(x+cx-hw/2,0,z+cz-.6,x+cx+hw/2,hh,z+cz+.6,cx===0&&cz===0?'wood':'conc',cx===0&&cz===0?0xa08060:0xb0aca2,{});}
  shipCont(x-4,z-9.5,0,0x9a3a2a);shipCont(x+4,z+9.5,0,0x2a5a8a);}

 W.finalize();const group=new THREE.Group();const meshes=geo.build(mats,group);
 return{group,W,meshes,foot,spots,crates,depots,vehicles,props,pois,parks,blocks,navBlock,stairs:stairsL};}
