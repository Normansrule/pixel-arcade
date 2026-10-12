// EXFIL — "Saltcrest Works": an abandoned coastal factory town. Buildings with interiors, locked rooms, doors, loot containers, props, extracts.
import * as THREE from '../vendor/three.module.min.js';
import {World,Geo,H,WATER,shoreX} from './world.js';

export function makeMats(T){const std=(t,o={})=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,map:t?t.map:null,normalMap:t?t.normalMap:null,roughness:.9,metalness:0,...o});if(t)m.normalScale=new THREE.Vector2(.8,.8);return m;};
 const fc=document.createElement('canvas');fc.width=fc.height=64;const x=fc.getContext('2d');x.strokeStyle='#c8ccd0';x.lineWidth=2.2;for(let i=-64;i<128;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}
 const ft=new THREE.CanvasTexture(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.colorSpace=THREE.SRGBColorSpace;
 const M={conc:std(T.conc,{roughness:.95}),plaster:std(T.plaster,{roughness:.92}),brick:std(T.brick,{roughness:.9}),metal:std(T.metal,{roughness:.55,metalness:.45}),wood:std(T.wood,{roughness:.8}),floor:std(T.floor,{roughness:.7}),
  asph:std(T.asph,{roughness:.97}),roof:std(T.roof,{roughness:.95}),steel:std(T.steel,{roughness:.45,metalness:.6}),rust:std(T.rust,{roughness:.85,metalness:.3}),fabric:std(T.fabric,{roughness:1}),
  glow:new THREE.MeshStandardMaterial({color:0x111111,emissive:0xfff2dc,emissiveIntensity:2.4,vertexColors:true}),fence:new THREE.MeshStandardMaterial({map:ft,alphaTest:.45,side:THREE.DoubleSide,roughness:.5,metalness:.6,vertexColors:true}),
  dark:new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:1,vertexColors:true}),paint:std(null,{roughness:.6})};
 M.fence.userData.noShadow=true;M.glow.userData.noShadow=true;for(const k in M)M[k].envMapIntensity=.6;return M;}
const UVS={conc:3,plaster:2.5,brick:2.2,metal:2.6,wood:1.6,floor:2,asph:6,roof:4,steel:2,rust:2,fabric:1,glow:1,fence:2.4,dark:2,paint:2};
const SURF={conc:0,plaster:0,brick:0,metal:1,steel:1,rust:1,wood:2,floor:0,asph:0,roof:0,fabric:5,dark:0,fence:1,glow:0,paint:1};
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

export function buildMap(mats){const geo=new Geo();geo.uvs=UVS;const W=new World();const R=rng(90210);
 const doors=[],conts=[],loose=[],foot=[],roads=[],bulbs=[],named=[];
 const S=(x0,y0,z0,x1,y1,z1,m,t=0xffffff,o={})=>{geo.box(x0,y0,z0,x1,y1,z1,m,t,o);return W.add(x0,y0,z0,x1,y1,z1,o.f??3,SURF[m]);};
 const Vb=(x0,y0,z0,x1,y1,z1,m,t=0xffffff,o={})=>geo.box(x0,y0,z0,x1,y1,z1,m,t,o);
 const Cb=(x0,y0,z0,x1,y1,z1,f=1,m=0)=>W.add(x0,y0,z0,x1,y1,z1,f,m);
 const IND=.58;const pick=a=>a[(R()*a.length)|0];

 /* ---------- walls with openings ---------- */
 function pieces(a0,a1,y0,y1,ops){const out=[];let cur=a0;for(const o of ops.slice().sort((p,q)=>p.a-q.a)){if(o.a>cur+.01)out.push([cur,o.a,y0,y1]);if(o.lo>.01)out.push([o.a,o.b,y0,y0+o.lo]);if(y0+o.hi<y1-.01)out.push([o.a,o.b,y0+o.hi,y1]);cur=Math.max(cur,o.b);}if(cur<a1-.01)out.push([cur,a1,y0,y1]);return out;}
 // ax 'x': wall along x (a = x range), occupying z c0..c1. outer: -1 = outer face at c0, +1 = at c1, 0 = interior wall
 function wall(ax,c0,c1,a0,a1,y0,y1,ops,ext,et,inm,it,outer){const m=(c0+c1)/2;
  for(const[a,b,ya,yb]of pieces(a0,a1,y0,y1,ops)){const bx=(p,q,r,s)=>ax==='x'?[a,ya,p,b,yb,q]:[p,ya,a,q,yb,b];
   if(outer===0){const k=bx(c0,c1);geo.box(...k,inm,it,{ind:IND});}
   else{const oc=outer<0?[c0,m]:[m,c1],ic=outer<0?[m,c1]:[c0,m];geo.box(...bx(oc[0],oc[1]),ext,et,{});geo.box(...bx(ic[0],ic[1]),inm,it,{ind:IND});}
   const k=bx(c0,c1);W.add(...k,3,SURF[ext]);}
  // window sills
  for(const o of ops)if(o.lo>.5){if(ax==='x')Vb(o.a,y0+o.lo-.06,c0-.06,o.b,y0+o.lo,c1+.06,'conc',0xb8b4aa);else Vb(c0-.06,y0+o.lo-.06,o.a,c1+.06,y0+o.lo,o.b,'conc',0xb8b4aa);}}
 function door(ax,at,a,w,y,lock,open,kind='wood'){const d={ax,at,a,w,y,h:2.15,lock,unlocked:!lock,open:false,ang:0,tgt:0,sgn:1,kind,id:doors.length};
  d.x=ax==='x'?a+w/2:at;d.z=ax==='x'?at:a+w/2;d.box=ax==='x'?W.add(a,y,at-.06,a+w,y+2.15,at+.06,7,kind==='wood'?2:1):W.add(at-.06,y,a,at+.06,y+2.15,a+w,7,kind==='wood'?2:1);d.startOpen=!!open&&!lock;doors.push(d);return d;}
 function slab(x0,z0,x1,z1,y0,y1,m,t,hole,o={}){if(!hole){S(x0,y0,z0,x1,y1,z1,m,t,o);return;}const[hx0,hz0,hx1,hz1]=hole;
  if(hz0>z0)S(x0,y0,z0,x1,y1,hz0,m,t,o);if(hz1<z1)S(x0,y0,hz1,x1,y1,z1,m,t,o);if(hx0>x0)S(x0,y0,hz0,hx0,y1,hz1,m,t,o);if(hx1<x1)S(hx1,y0,hz0,x1,y1,hz1,m,t,o);}
 function stairs(x,z,ax,dir,w,y0,y1,m='conc',t=0xa8a49c){const n=Math.ceil((y1-y0)/.24),rise=(y1-y0)/n,run=.3;for(let i=0;i<n;i++){const a=i*run*dir,b=(i+1)*run*dir;const yt=y0+rise*(i+1);
   if(ax==='x')S(x+Math.min(a,b),y0,z,x+Math.max(a,b),yt,z+w,m,t,{ind:.85});else S(x,y0,z+Math.min(a,b),x+w,yt,z+Math.max(a,b),m,t,{ind:.85});}
  const L=n*run;return ax==='x'?[Math.min(x,x+L*dir),z,Math.max(x,x+L*dir),z+w]:[x,Math.min(z,z+L*dir),x+w,Math.max(z,z+L*dir)];}
 // generic building
 function bld(d){const{x0,z0,x1,z1}=d,h=d.h??3.2,fl=d.fl??1,t=.3,by=d.by??0;const ext=d.ext??'brick',et=d.et??0xffffff,inm=d.inm??'plaster',it=d.it??0xddd6c8;foot.push([x0,z0,x1,z1]);
  let st=null;if(d.st){const s=d.st;st={...s,fp:null};}
  for(let f=0;f<fl;f++){const fy=by+f*h;
   if(f===0){S(x0,by-1.2,z0,x1,by+.1,z1,d.flr??'floor',d.ft??0xffffff,{});}
   else{const hole=st&&st.fp?[st.fp[0]-.1,st.fp[1]-.1,st.fp[2]+.1,st.fp[3]+.1]:null;slab(x0+t,z0+t,x1-t,z1-t,fy-.22,fy+.1,d.flr??'floor',d.ft??0xffffff,hole);Vb(x0,fy-.25,z0,x1,fy+.05,z1,ext,et,{skip:{py:1,ny:1}});}
   const ops=s=>[...(d.doors||[]).filter(o=>o.s===s&&(o.f||0)===f).map(o=>({a:(s==='n'||s==='s'?x0:z0)+o.o,b:(s==='n'||s==='s'?x0:z0)+o.o+(o.w||1.1),lo:0,hi:o.hi||2.3,door:o})),...(d.win||[]).filter(o=>o.s===s&&(o.f||0)===f).map(o=>({a:(s==='n'||s==='s'?x0:z0)+o.o,b:(s==='n'||s==='s'?x0:z0)+o.o+(o.w||1.4),lo:o.lo||1,hi:o.hi||2.2}))];
   const top=fy+h;
   wall('x',z0,z0+t,x0,x1,fy,top,ops('n'),ext,et,inm,it,-1);wall('x',z1-t,z1,x0,x1,fy,top,ops('s'),ext,et,inm,it,1);
   wall('z',x0,x0+t,z0+t,z1-t,fy,top,ops('w'),ext,et,inm,it,-1);wall('z',x1-t,x1,z0+t,z1-t,fy,top,ops('e'),ext,et,inm,it,1);
   for(const s of['n','s','w','e'])for(const o of ops(s))if(o.door&&!o.door.none){const D=o.door;if(s==='n'||s==='s')door('x',s==='n'?z0+t/2:z1-t/2,o.a,o.b-o.a,fy+.1,D.lock,D.open??R()<.45,D.kind);else door('z',s==='w'?x0+t/2:x1-t/2,o.a,o.b-o.a,fy+.1,D.lock,D.open??R()<.45,D.kind);}
   for(const p of(d.parts||[]).filter(p=>(p.f||0)===f)){const ops2=p.door!==undefined?[{a:p.a+p.door,b:p.a+p.door+(p.w||1.05),lo:0,hi:2.3}]:[];wall(p.ax,p.at-.07,p.at+.07,p.a,p.b,fy+.1,top,ops2,ext,et,inm,it,0);
    if(p.door!==undefined&&!p.nodoor)door(p.ax,p.at,p.a+p.door,p.w||1.05,fy+.1,p.lock,p.open??R()<.5,p.kind);}
   if(st&&st.f===f){st.fp=stairs(st.x,st.z,st.ax,st.dir,st.w||1.2,fy+.1,fy+h+.1,'conc',0xa8a49c);}
   // ceiling lights
   if(d.lights!==false){const nl=Math.max(1,Math.round((x1-x0)*(z1-z0)/60));for(let i=0;i<nl;i++){const lx=x0+(x1-x0)*(i+.5)/nl,lz=(z0+z1)/2;if(d.lightsAx==='z'){const lz2=z0+(z1-z0)*(i+.5)/nl;Vb((x0+x1)/2-.08,top-.08,lz2-.6,(x0+x1)/2+.08,top-.02,lz2+.6,'glow',0xffffff);}else Vb(lx-.6,top-.08,lz-.08,lx+.6,top-.02,lz+.08,'glow',0xffffff);}}}
  const ry=by+fl*h;
  if(d.roof==='gable'){S(x0-.1,ry,z0-.1,x1+.1,ry+.2,z1+.1,'conc',0x8a8680,{});const ax=(x1-x0)>(z1-z0)?'x':'z';const span=ax==='x'?(z1-z0):(x1-x0),pitch=.5,rise=span/2*Math.tan(pitch),sl=span/2/Math.cos(pitch)+.4;
   if(ax==='x'){const zc=(z0+z1)/2;for(const sg of[-1,1])geo.box(x0-.4,ry+rise/2-.1,zc+sg*span/4-sl/2,x1+.4,ry+rise/2+.1,zc+sg*span/4+sl/2,'roof',d.rt??0x7a4a3a,{m:new THREE.Matrix4().makeRotationX(sg*pitch)});
    for(let k=0;k<6;k++){const hh=rise*(k+1)/6,wz=span*(1-(k+.5)/6)/2;for(const x of[x0+.05,x1-.35])Vb(x,ry+rise*k/6,zc-wz,x+.3,ry+hh,zc+wz,d.ext??'brick',d.et??0xffffff);}}
   else{const xc=(x0+x1)/2;for(const sg of[-1,1])geo.box(xc+sg*span/4-sl/2,ry+rise/2-.1,z0-.4,xc+sg*span/4+sl/2,ry+rise/2+.1,z1+.4,'roof',d.rt??0x7a4a3a,{m:new THREE.Matrix4().makeRotationZ(-sg*pitch)});
    for(let k=0;k<6;k++){const hh=rise*(k+1)/6,wx=span*(1-(k+.5)/6)/2;for(const z of[z0+.05,z1-.35])Vb(xc-wx,ry+rise*k/6,z,xc+wx,ry+hh,z+.3,d.ext??'brick',d.et??0xffffff);}}
   // gable roofs are not collidable beyond the ceiling slab; add a soft blocker
   Cb(x0,ry,z0,x1,ry+rise,z1,3,0);}
  else{S(x0+.3,ry,z0+.3,x1-.3,ry+.25,z1-.3,'roof',d.rt??0x8a8a86);W.add(x0,ry,z0,x1,ry+.25,z1,3,0);{Vb(x0,ry,z0,x1,ry+.75,z0+.3,ext,et);Vb(x0,ry,z1-.3,x1,ry+.75,z1,ext,et);Vb(x0,ry,z0+.3,x0+.3,ry+.75,z1-.3,ext,et);Vb(x1-.3,ry,z0+.3,x1,ry+.75,z1-.3,ext,et);
   const nu=Math.floor((x1-x0)*(z1-z0)/90);for(let i=0;i<nu;i++){const ux=x0+2+R()*(x1-x0-4),uz=z0+2+R()*(z1-z0-4);Vb(ux-.7,ry+.25,uz-.5,ux+.7,ry+1.3,uz+.5,'steel',0x9aa0a4);}}}
  if(d.fill)for(let f=0;f<fl;f++)d.fill(by+f*h+.1,f);return d;}

 /* ---------- furniture + props ---------- */
 const WOODT=[0x9a7a5a,0x7a5a3e,0xb0906a,0x6a4a34];
 function table(x,z,w,d,y,t=pick(WOODT)){S(x-w/2,y+.72,z-d/2,x+w/2,y+.78,z+d/2,'wood',t,{ind:.8});for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])Vb(x+sx*(w/2-.06)-.03,y,z+sz*(d/2-.06)-.03,x+sx*(w/2-.06)+.03,y+.72,z+sz*(d/2-.06)+.03,'wood',t,{ind:.7});Cb(x-w/2+.08,y,z-d/2+.08,x+w/2-.08,y+.72,z+d/2-.08,1);}
 function desk(x,z,w,d,y,pc){table(x,z,w,d,y,0x5a5450);Vb(x+w/2-.45,y,z-d/2+.02,x+w/2-.05,y+.7,z+d/2-.02,'steel',0x7a7e82,{ind:.8});if(R()<.7){Vb(x-.25,y+.78,z-.1,x+.25,y+1.12,z-.06,'steel',0x1e2024,{ind:.9});Vb(x-.04,y+.78,z-.06,x+.04,y+.95,z,'steel',0x1e2024);}if(pc)cont('pc',x-w/2+.25,y,z,0);}
 function chair(x,z,y,q=0){Vb(x-.22,y+.42,z-.22,x+.22,y+.48,z+.22,'wood',0x6a5040,{ind:.8});const bz=q?z+.2:z-.2;Vb(x-.22,y+.48,bz-.03,x+.22,y+.95,bz+.03,'wood',0x6a5040,{ind:.8});Vb(x-.2,y,z-.2,x+.2,y+.42,z+.2,'steel',0x333,{ind:.6,skip:{py:1}});Cb(x-.22,y,z-.22,x+.22,y+.5,z+.22,1);}
 function shelf(x0,z0,x1,z1,y,h=2.1,lv=4,goods=.7,t=0x5a6e88){const ax=(x1-x0)>(z1-z0)?'x':'z';const L=ax==='x'?x1-x0:z1-z0;
  for(let k=0;k<=Math.ceil(L/2);k++){const a=Math.min(L,k*2);if(ax==='x')Vb(x0+a-.04,y,z0,x0+a+.04,y+h,z1,'steel',t,{ind:.8});else Vb(x0,y,z0+a-.04,x1,y+h,z0+a+.04,'steel',t,{ind:.8});}
  for(let l=0;l<lv;l++){const yy=y+.12+l*(h-.1)/lv;Vb(x0,yy,z0,x1,yy+.04,z1,'steel',0x8a8e92,{ind:.8});
   for(let a=.1;a<L-.4;a+=.45+R()*.4){if(R()>goods)continue;const gw=.3+R()*.4,gh=.2+R()*Math.min(.35,(h-.1)/lv-.12),gt=pick([0xa88a62,0x8a6a48,0x6a7a5a,0xb0a080,0x5a6a7a]);if(ax==='x')Vb(x0+a,yy+.04,z0+.05,x0+a+gw,yy+.04+gh,z1-.05,pick(['wood','fabric']),gt,{ind:.75});else Vb(x0+.05,yy+.04,z0+a,x1-.05,yy+.04+gh,z0+a+gw,pick(['wood','fabric']),gt,{ind:.75});}}
  Cb(x0,y,z0,x1,y+h,z1,3,1);}
 function bed(x,z,q,y){const sw=q%2,w=sw?2:1,d=sw?1:2;S(x-w/2,y,z-d/2,x+w/2,y+.4,z+d/2,'wood',0x5a4030,{ind:.8});Vb(x-w/2+.05,y+.4,z-d/2+.05,x+w/2-.05,y+.58,z+d/2-.05,'fabric',pick([0x8a8478,0x6a7488,0x9a8a7a]),{ind:.8});}
 function counter(x0,z0,x1,z1,y,t=0x6a5a4a){S(x0,y,z0,x1,y+1,z1,'wood',t,{ind:.8});Vb(x0-.05,y+1,z0-.05,x1+.05,y+1.05,z1+.05,'steel',0x9a9a96,{ind:.9});}
 function locker(x,z,q,y){const sw=q%2;S(x-(sw?.25:.3),y,z-(sw?.3:.25),x+(sw?.25:.3),y+1.9,z+(sw?.3:.25),'steel',pick([0x5a6a5a,0x6a7684,0x7a6a5a]),{ind:.8});}
 function machine(x0,z0,x1,z1,y,h,t=0x5a6a64){S(x0,y,z0,x1,y+h,z1,'steel',t,{ind:.85});Vb(x0+.3,y+h,z0+.3,x1-.3,y+h+.5,z1-.3,'steel',0x3a3e40,{ind:.85});Vb(x0-.05,y+h*.55,z0-.05,x1+.05,y+h*.6,z1+.05,'steel',0xc8a028,{ind:.9});if(R()<.6)geo.cyl((x0+x1)/2,y+h+.5,(z0+z1)/2,.25,1.6,'steel',0x777,10);}
 function crateStack(x,z,y,n=2,t=0xa08060){for(let k=0;k<n;k++){const s=.95-k*.08,o=(R()-.5)*.15;S(x-s/2+o,y+k*.95,z-s/2,x+s/2+o,y+k*.95+.95,z+s/2,'wood',t,{});}}
 function pallet(x,z,y,goods){Vb(x-.6,y,z-.5,x+.6,y+.14,z+.5,'wood',0x8a7050);if(goods){S(x-.55,y+.14,z-.45,x+.55,y+.14+goods,z+.45,'fabric',pick([0xa89878,0x7a8a9a,0x6a7a5a]),{});}else Cb(x-.6,y,z-.5,x+.6,y+.14,z+.5,1);}
 function barrel(x,z,y=0,t=pick([0x3a5a8a,0x8a3a2a,0x4a5a3a,0x6a6a6a])){geo.cyl(x,y,z,.3,.92,'steel',t,12);geo.cyl(x,y+.3,z,.31,.04,'steel',0x333,12,'y',{open:true});W.add(x-.3,y,z-.3,x+.3,y+.92,z+.3,3,1);}
 function car(x,z,q,t=pick([0x6a2a22,0x2a4a6a,0x7a7a72,0x3a4a3a,0x8a7a4a]),rot=0){const sw=q%2,L=4.3,Wd=1.8;const hx=sw?Wd/2:L/2,hz=sw?L/2:Wd/2;const o={rot:[0,rot,0]};
  S(x-hx,.32,z-hz,x+hx,1.0,z+hz,'steel',t,{rot:[0,rot,0],f:3});const cx=sw?0:-.2,cz=sw?-.2:0;Vb(x-(sw?.8:1.2)+cx,1,z-(sw?1.2:.8)+cz,x+(sw?.8:1.2)+cx,1.5,z+(sw?1.2:.8)+cz,'steel',0x1a1c1e,o);Cb(x-(sw?.8:1.2)+cx,1,z-(sw?1.2:.8)+cz,x+(sw?.8:1.2)+cx,1.5,z+(sw?1.2:.8)+cz,3,1);
  for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const wx=sw?a*.85:a*1.35,wz=sw?b*1.35:b*.85;geo.cyl(x+wx,.34,z+wz-(sw?0:0),.34,.25,'steel',0x18191a,10,sw?'x':'z');}}
 function truck(x,z,q,t=0x4a5a6a){const sw=q%2;const L=8,Wd=2.5;const hx=sw?Wd/2:L/2,hz=sw?L/2:Wd/2;S(x-hx,.5,z-hz,x+hx,1.2,z+hz,'steel',0x2a2a2a);
  const cab=sw?[x-hx,1.2,z+hz-2.2,x+hx,3.1,z+hz]:[x+hx-2.2,1.2,z-hz,x+hx,3.1,z+hz];S(...cab,'steel',t);const box=sw?[x-hx,1.2,z-hz,x+hx,3.6,z+hz-2.4]:[x-hx,1.2,z-hz,x+hx-2.4,3.6,z+hz];S(...box,'metal',0xb8b4aa);
  for(const a of[-1,1])for(const b of[-.7,.1,.7]){const wx=sw?a*1.1:b*L/2,wz=sw?b*L/2:a*1.1;geo.cyl(x+wx,.5,z+wz,.5,.35,'steel',0x18191a,10,sw?'x':'z');}}
 function shipCont(x,z,q,t,y=0,open=false,loot=null){const sw=q%2,L=6.06,Wd=2.44,Hh=2.59;const hx=sw?Wd/2:L/2,hz=sw?L/2:Wd/2;const x0=x-hx,x1=x+hx,z0=z-hz,z1=z+hz;
  if(!open){S(x0,y,z0,x1,y+Hh,z1,'metal',t,{s:2.4});Vb(x0-.04,y+Hh-.12,z0-.04,x1+.04,y+Hh,z1+.04,'steel',t);Vb(x0-.04,y,z0-.04,x1+.04,y+.12,z1+.04,'steel',0x2a2a2a);return;}
  const th=.08;S(x0,y,z0,x1,y+.12,z1,'wood',0x6a5a48,{});S(x0,y+Hh-.08,z0,x1,y+Hh,z1,'metal',t);
  if(!sw){S(x0,y,z0,x1,y+Hh,z0+th,'metal',t);S(x0,y,z1-th,x1,y+Hh,z1,'metal',t);S(x0,y,z0,x0+th,y+Hh,z1,'metal',t);Vb(x1,y,z0,x1+.06,y+Hh,z0+1.2,'metal',t,{rot:[0,-.9,0]});Vb(x1,y,z1-1.2,x1+.06,y+Hh,z1,'metal',t,{rot:[0,.9,0]});}
  else{S(x0,y,z0,x0+th,y+Hh,z1,'metal',t);S(x1-th,y,z0,x1,y+Hh,z1,'metal',t);S(x0,y,z0,x1,y+Hh,z0+th,'metal',t);Vb(x0,y,z1,x0+1.2,y+Hh,z1+.06,'metal',t,{rot:[0,.9,0]});Vb(x1-1.2,y,z1,x1,y+Hh,z1+.06,'metal',t,{rot:[0,-.9,0]});}
  if(loot)cont(loot,sw?x:x0+.9,y+.12,sw?z0+.9:z,sw?0:1);if(R()<.7)loose.push({x,y:y+.12,z});}
 function barrier(x,z,q){const sw=q%2;S(x-(sw?.3:1),0,z-(sw?1:.3),x+(sw?.3:1),.82,z+(sw?1:.3),'conc',0xb0aca2);}
 function sandbags(x0,z0,x1,z1,h=1){S(x0,0,z0,x1,h,z1,'fabric',0x8a7a5a,{s:.6});}
 function lamp(x,z,y=0){geo.cyl(x,y,z,.09,7,'steel',0x5a5e60,8);Vb(x-.1,y+6.8,z-.1,x+1.2,y+7,z+.1,'steel',0x5a5e60);Vb(x+.7,y+6.7,z-.15,x+1.3,y+6.8,z+.15,'glow',0x999999);W.add(x-.1,y,z-.1,x+.1,y+7,z+.1,3,1);}
 function pole(x,z){const y=H(x,z);geo.cyl(x,y-.5,z,.13,9.5,'wood',0x5a4a3a,8);Vb(x-1.1,y+8.4,z-.06,x+1.1,y+8.55,z+.06,'wood',0x5a4a3a);W.add(x-.13,y,z-.13,x+.13,y+9,z+.13,3,2);}
 function tree(x,z,s=1){const y=H(x,z);geo.cyl(x,y-.3,z,.18*s,3*s,'wood',0x4a3a2c,7);for(let k=0;k<4;k++){const r=(2.4-k*.5)*s,yy=y+1.6*s+k*1.5*s;geo.cyl(x,yy,z,r,2.2*s,'fabric',0x3e4c36,8,'y',{r2:.05});}W.add(x-.25*s,y,z-.25*s,x+.25*s,y+6*s,z+.25*s,3,2);}
 function rock(x,z,s){const y=H(x,z);Vb(x-s,y-s*.4,z-s*.8,x+s,y+s*.8,z+s*.8,'conc',0x7a7872,{rot:[R()*.6,R()*3,R()*.6],s:2});W.add(x-s*.8,y-s,z-s*.7,x+s*.8,y+s*.6,z+s*.7,3,0);}
 function fence(x0,z0,x1,z1,h=2.3,y=0){const ax=Math.abs(x1-x0)>Math.abs(z1-z0)?'x':'z';const L=ax==='x'?Math.abs(x1-x0):Math.abs(z1-z0);
  if(ax==='x'){const zz=z0;Vb(Math.min(x0,x1),y,zz-.01,Math.max(x0,x1),y+h,zz+.01,'fence',0xffffff,{s:2.4});W.add(Math.min(x0,x1),y,zz-.08,Math.max(x0,x1),y+h,zz+.08,1,1);for(let a=0;a<=L;a+=3)geo.cyl(Math.min(x0,x1)+a,y,zz,.05,h+.1,'steel',0x777,6);Vb(Math.min(x0,x1),y+h-.03,zz-.03,Math.max(x0,x1),y+h+.03,zz+.03,'steel',0x777);}
  else{const xx=x0;Vb(xx-.01,y,Math.min(z0,z1),xx+.01,y+h,Math.max(z0,z1),'fence',0xffffff,{s:2.4});W.add(xx-.08,y,Math.min(z0,z1),xx+.08,y+h,Math.max(z0,z1),1,1);for(let a=0;a<=L;a+=3)geo.cyl(xx,y,Math.min(z0,z1)+a,.05,h+.1,'steel',0x777,6);Vb(xx-.03,y+h-.03,Math.min(z0,z1),xx+.03,y+h+.03,Math.max(z0,z1),'steel',0x777);}}
 function cwall(x0,z0,x1,z1,h=2.6,t=0xa09c94){S(Math.min(x0,x1),0,Math.min(z0,z1),Math.max(x0,x1),h,Math.max(z0,z1),'conc',t,{});}
 function road(x0,z0,x1,z1,mark){roads.push([x0,z0,x1,z1]);Vb(x0,-.1,z0,x1,.03,z1,'asph',0xffffff,{skip:{ny:1}});if(mark==='x')for(let x=x0+2;x<x1-3;x+=6)Vb(x,.03,(z0+z1)/2-.08,x+3,.036,(z0+z1)/2+.08,'paint',0xd8d4c4,{});if(mark==='z')for(let z=z0+2;z<z1-3;z+=6)Vb((x0+x1)/2-.08,.03,z,(x0+x1)/2+.08,.036,z+3,'paint',0xd8d4c4,{});}
 function walk(x0,z0,x1,z1){S(x0,-.2,z0,x1,.14,z1,'conc',0xa8a49e,{s:1.2,f:3});}

 /* ---------- loot containers ---------- */
 const CD={crate:[.9,.62,.62],weaponbox:[1.25,.45,.5],cabinet:[.5,1.32,.6],safe:[.72,.86,.7],medcase:[.56,.3,.38],toolbox:[.56,.28,.26],pc:[.22,.46,.46],duffel:[.86,.36,.38],jacket:[.5,.8,.14]};
 function cont(type,x,y,z,q=0,o={}){let[w,h,d]=CD[type];if(q%2)[w,d]=[d,w];const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;const fx=[0,1,0,-1][q],fz=[1,0,-1,0][q];
  if(type==='crate'){S(x0,y,z0,x1,y+h,z1,'wood',0xb08a5a,{f:3});Vb(x0-.02,y+h*.42,z0-.02,x1+.02,y+h*.58,z1+.02,'wood',0x7a5a38);}
  else if(type==='weaponbox'){S(x0,y,z0,x1,y+h,z1,'steel',0x4a5536,{f:3});Vb(x0-.01,y+h-.06,z0-.01,x1+.01,y+h-.02,z1+.01,'steel',0x2a2e22);for(const k of[-.3,.3])Vb(x+(q%2?0:k*w)-.04,y+h*.4,z+(q%2?k*d:0)-.04,x+(q%2?0:k*w)+.04,y+h*.75,z+(q%2?k*d:0)+.04,'steel',0xc8a028);}
  else if(type==='cabinet'){S(x0,y,z0,x1,y+h,z1,'steel',0x8a9096,{f:3});for(let k=0;k<4;k++){const yy=y+.08+k*.31;const px=x+fx*(q%2?w/2:0),pz=z+fz*(q%2?0:d/2);if(q%2)Vb(px-.01,yy+.25,z-.08,px+fx*.03,yy+.28,z+.08,'steel',0x333);else Vb(x-.08,yy+.25,pz-.01,x+.08,yy+.28,pz+fz*.03,'steel',0x333);}}
  else if(type==='safe'){S(x0,y,z0,x1,y+h,z1,'steel',0x2a2c30,{f:3});geo.cyl(x+fx*(w/2+.02),y+h*.55,z+fz*(d/2+.02),.07,.04,'steel',0xc8c8c0,12,q%2?'x':'z');}
  else if(type==='medcase'){S(x0,y,z0,x1,y+h,z1,'paint',0xe4e4dc,{f:3});Vb(x-.04,y+h,z-.12,x+.04,y+h+.005,z+.12,'paint',0x2a9a4a);Vb(x-.12,y+h,z-.04,x+.12,y+h+.005,z+.04,'paint',0x2a9a4a);}
  else if(type==='toolbox'){S(x0,y,z0,x1,y+h,z1,'paint',0xb03a2a,{f:3});Vb(x-.12,y+h,z-.02,x+.12,y+h+.06,z+.02,'steel',0x333);}
  else if(type==='pc'){S(x0,y,z0,x1,y+h,z1,'steel',0x26282c,{f:3});}
  else if(type==='duffel'){geo.cyl(x,y+.18,z,.18,w>d?w:d,'fabric',pick([0x3c4a3a,0x2a3442,0x4a3a2a]),10,w>d?'x':'z');W.add(x0,y,z0,x1,y+.36,z1,1,5);}
  else if(type==='jacket'){Vb(x0,y,z0,x1,y+h,z1,'fabric',pick([0x4a4a3a,0x2a3040,0x5a4030,0x3a3a3a]),{rot:[0,0,(R()-.5)*.1]});Vb(x-.05,y+h,z-.05,x+.05,y+h+.08,z+.05,'steel',0x777);}
  const c={type,x,y,z,q,top:y+h,id:conts.length,...o};conts.push(c);return c;}

 /* ================= LAYOUT ================= */
 // roads + sidewalks
 road(-104,-4,60,4,'x');road(31,-112,39,92,'z');road(-104,34,42,40,'x');road(-12,-33,14,-6);road(-6,8,16,30);road(39,40,60,48);
 walk(-96,-7,-12,-4);walk(-96,4,-12,7);walk(-12,-7,12,-6);
 // harbour quay platform + quay wall
 S(60,-3.2,-64,78,.05,48,'conc',0xb4b0a6,{s:3});S(77.6,-3.2,-64,78.2,.4,48,'conc',0x8a8680);
 for(let z=-60;z<=44;z+=8)geo.cyl(77,.05,z,.22,.5,'steel',0x2a2c2e,10);
 // pier
 S(78,.05,6,118,.35,14,'wood',0x9a8466,{s:1.4});S(118,.05,-6,130,.35,26,'wood',0x9a8466,{s:1.4});
 for(let x=80;x<=118;x+=4)for(const z of[6.3,13.7])geo.cyl(x,-4,z,.22,4.3,'wood',0x5a4a3a,8);for(let x=119;x<=130;x+=4)for(let z=-5;z<=26;z+=4)geo.cyl(x,-4,z,.22,4.3,'wood',0x5a4a3a,8);
 const prail=(x0,z0,x1,z1)=>{Vb(Math.min(x0,x1),1.05,Math.min(z0,z1),Math.max(x0,x1)+.06,1.11,Math.max(z0,z1)+.06,'wood',0x6a5a48);W.add(Math.min(x0,x1),.35,Math.min(z0,z1),Math.max(x0,x1)+.06,1.1,Math.max(z0,z1)+.06,1,2);const ax=Math.abs(x1-x0)>Math.abs(z1-z0);const L=ax?Math.abs(x1-x0):Math.abs(z1-z0);for(let a=0;a<=L;a+=2)Vb((ax?Math.min(x0,x1)+a:x0)-.04,.35,(ax?z0:Math.min(z0,z1)+a)-.04,(ax?Math.min(x0,x1)+a:x0)+.04,1.08,(ax?z0:Math.min(z0,z1)+a)+.04,'wood',0x6a5a48);};
 prail(78,5.95,118,5.95);prail(78,13.99,118,13.99);prail(118,-6.05,130,-6.05);prail(130,-6,130,26);prail(118,-6,118,6);prail(118,14,118,26);prail(118,26,121,26);prail(127,26,130,26);
 for(const[x,z]of[[90,6.3],[106,13.7],[121,-5.6],[129,10]])barrel(x,z,.35,0x8a3a2a);crateStack(124,-3,.35,2);crateStack(126,-3,.35,1);
 cont('crate',96,.35,12.9,2);cont('duffel',126.5,.35,6,1);loose.push({x:110,y:.35,z:7.5});loose.push({x:122,y:.35,z:20});
 // the boat at the T-head
 {const bx=124,bz0=27.5,bz1=40;S(bx-3,-1.2,bz0+1,bx+3,.6,bz1,'steel',0x2a3a4a);S(bx-2,-1.2,bz0,bx+2,.6,bz0+1,'steel',0x2a3a4a);Vb(bx-3.05,.6,bz0,bx+3.05,.75,bz1,'steel',0xb8b0a0);
  S(bx-1.8,.6,bz0+5,bx+1.8,2.8,bz0+9,'steel',0xd8d4c8);Vb(bx-1.9,2.8,bz0+4.9,bx+1.9,2.95,bz0+9.1,'steel',0x2a3a4a);Vb(bx-1.81,1.7,bz0+5.4,bx+1.81,2.4,bz0+8.6,'steel',0x18202a);geo.cyl(bx,2.95,bz0+7,.08,2.4,'steel',0x777,6);
  named.push({id:'boat',x:bx,z:bz0+7});}
 // radio post for the boatman (pay)
 S(120.6,.35,15.6,121.4,1.35,16.4,'steel',0x4a5236);Vb(120.7,1.35,15.7,121.3,1.6,16.3,'steel',0x2a2e22);geo.cyl(121.2,1.6,16.2,.02,1.2,'steel',0x777,4);
 // cranes
 for(const cz of[-28,40]){for(const[lx,lz]of[[66,cz-4],[66,cz+4],[76,cz-4],[76,cz+4]]){S(lx-.6,.05,lz-.6,lx+.6,22,lz+.6,'steel',0xc8a028,{});}
  Vb(58,22,cz-4.6,100,23.6,cz-3.4,'steel',0xc8a028);Vb(58,22,cz+3.4,100,23.6,cz+4.6,'steel',0xc8a028);for(let x=60;x<100;x+=4)Vb(x,22,cz-3.4,x+.4,23.4,cz+3.4,'steel',0xc8a028);
  Vb(80,19,cz-2,85,22,cz+2,'steel',0xd8d0b8);Vb(80.2,19.6,cz-2.02,84.8,21.4,cz-1.98,'steel',0x1a222a);for(let y=2;y<22;y+=4)for(const lx of[66,76]){geo.beam(lx,y,cz-4,lx,y+4,cz+4,.18,'steel',0xc8a028);}
  geo.cyl(92,14,cz,.04,8,'steel',0x333,4);S(91,13,cz-.8,93,14,cz+.8,'steel',0x5a5e60,{f:2});}
 // container yard
 const CC=[0x9a3a2a,0x2a5a8a,0x3a6a3a,0x8a8a82,0xb0702a,0x5a3a6a,0x2a6a7a];
 const yard=[[47.2,15.4,0,0,0],[54,15.4,0,1,1],[60.8,15.4,0,0,0,'crate'],[67.6,15.4,0,1,0],[47.2,21.2,0,0,0,'weaponbox'],[54,21.2,0,0,0],[67.6,21.2,0,0,1],[47.2,28,0,1,0],[54,28,0,0,0,'duffel'],[60.8,28,0,1,1],[67.6,28,0,0,0,'toolbox'],[47.2,33.6,0,0,0]];
 yard.forEach((c,i)=>{const[x,z,q,stack,open,loot]=c;const t=CC[i%CC.length];shipCont(x,z,q,t,0,!!loot,loot||null);if(stack)shipCont(x+(R()-.5)*.3,z,q,CC[(i+3)%CC.length],2.59);});
 shipCont(62,-44,1,CC[1]);shipCont(65,-44,1,CC[4],0,true,'crate');shipCont(62,-44,1,CC[2],2.59);shipCont(70,-10,0,CC[0]);shipCont(70,-10,0,CC[5],2.59);shipCont(70,0,0,CC[3],0,true,'toolbox');
 for(const[x,z]of[[51,19],[58,25],[64,18],[44,25],[71,31]])pallet(x,z,0,R()<.6?.6+R()*.6:0);barrel(57.5,19,0);barrel(58.1,19.4,0);barrel(64.5,24.6,0);
 // ===== HARBOR OFFICE (2 floors, locked records room upstairs) =====
 bld({x0:42,z0:-22,x1:58,z1:-8,h:3.3,fl:2,ext:'plaster',et:0x9aa6ae,it:0xd8d6cc,
  doors:[{s:'s',o:6.5,w:1.3,open:true},{s:'e',o:4,w:1.1}],win:[{s:'s',o:1.5},{s:'s',o:10},{s:'s',o:13},{s:'n',o:3},{s:'n',o:10},{s:'e',o:9},{s:'w',o:4},{s:'w',o:9},{s:'s',o:1.5,f:1},{s:'s',o:6},{s:'s',o:10,f:1},{s:'s',o:6,f:1},{s:'n',o:3,f:1},{s:'n',o:12,f:1},{s:'e',o:3,f:1},{s:'e',o:9,f:1},{s:'w',o:9,f:1}],
  parts:[{ax:'z',at:50,a:-21.7,b:-8.3,door:8.2},{ax:'x',at:-15,a:50,b:57.7,door:3,f:1,lock:'harbor'},{ax:'z',at:50,a:-21.7,b:-15,f:1},{ax:'z',at:46,a:-15,b:-8.3,f:1,door:2.6}],
  st:{x:42.4,z:-21.6,ax:'z',dir:1,w:1.25,f:0},
  fill:(y,f)=>{if(f===0){counter(44,-12.5,48.5,-11.8,y);cont('cabinet',43,y,-17,1);cont('cabinet',43,y,-15.8,1);locker(49.4,-20,3,y);cont('jacket',49.7,y+1.1,-18.5,3);desk(54,-12,1.6,.8,y,true);chair(54,-11,y);desk(54,-19,1.6,.8,y,true);cont('medcase',56.8,y+.78,-19,3);table(56.8,-19,.8,1.2,y);cont('crate',51,y,-21.2,0);loose.push({x:46,y:y+1.05,z:-12.1});}
   else{// records room
    cont('cabinet',51,y,-21.4,0,{forced:'manifest'});cont('cabinet',52,y,-21.4,0);cont('cabinet',53,y,-21.4,0);cont('safe',57.2,y,-21.3,3);shelf(55,-21.9,57,-21.3,y,2.1,4,.8);desk(54,-17.5,1.6,.8,y,true);loose.push({x:54,y:y+.78,z:-17.3});
    desk(47,-12,1.6,.8,y,true);chair(47,-11,y);desk(53,-11.5,1.6,.8,y,false);cont('jacket',57.7,y+1.1,-11,3);cont('cabinet',43,y,-9.5,1);shelf(42.4,-14.5,43,-12,y,2,4);table(54,-9.4,1.8,.9,y);loose.push({x:54,y:y+.78,z:-9.4});}}});
 // ===== CANNERY =====
 bld({x0:44,z0:-62,x1:66,z1:-46,h:5.5,ext:'metal',et:0x7a8a8a,inm:'metal',it:0x9aa4a4,flr:'conc',roof:'flat',rt:0x6a6a66,
  doors:[{s:'w',o:5,w:3.5,hi:4,none:true},{s:'s',o:16,w:1.2},{s:'n',o:4,w:1.2},{s:'e',o:10,w:3.5,hi:4,none:true}],win:[{s:'s',o:3,w:3,lo:2.8,hi:4.2},{s:'s',o:9,w:3,lo:2.8,hi:4.2},{s:'n',o:9,w:3,lo:2.8,hi:4.2},{s:'n',o:15,w:3,lo:2.8,hi:4.2}],
  parts:[{ax:'x',at:-56,a:58,b:65.7,door:2},{ax:'z',at:58,a:-61.7,b:-56,door:1}],
  fill:(y)=>{for(const z of[-52,-49])machine(46,z-.6,56,z+.6,y,1.1,0x6a7a7a);for(let x=47;x<56;x+=3)geo.cyl(x,y+1.7,-50.5,.6,1.4,'steel',0xa8b0b0,12);machine(48,-60.5,54,-58.8,y,1.8,0x5a6a74);
   cont('cabinet',59,y,-61.3,0);cont('cabinet',60,y,-61.3,0);desk(63,-59,1.6,.8,y,true);cont('jacket',65.6,y+1.1,-58,3);cont('toolbox',64,y+.78,-57,0);table(64,-57,1.2,.7,y);
   cont('crate',46,y,-47.2,0);crateStack(47.3,-47.2,y,2);cont('toolbox',62,y,-47,0);pallet(60,-50,y,.8);pallet(62,-52,y,0);loose.push({x:61,y:y+.15,z:-52});cont('medcase',56.5,y+.78,-47.2,0);table(56.5,-47.2,1.2,.6,y);}});
 // ===== ADMIN BUILDING (2 floors, director's office) =====
 bld({x0:-10,z0:-52,x1:12,z1:-36,h:3.4,fl:2,ext:'brick',et:0xc8a090,it:0xd8d0c0,
  doors:[{s:'s',o:10,w:1.6,open:true},{s:'n',o:4,w:1.1},{s:'w',o:8,w:1.1}],win:[{s:'s',o:2},{s:'s',o:5.5},{s:'s',o:14},{s:'s',o:18},{s:'n',o:9},{s:'n',o:14},{s:'n',o:18},{s:'e',o:4},{s:'e',o:10},{s:'w',o:3},{s:'w',o:12},
   {s:'s',o:2,f:1},{s:'s',o:6,f:1},{s:'s',o:10,f:1},{s:'s',o:14,f:1},{s:'s',o:18,f:1},{s:'n',o:3,f:1},{s:'n',o:9,f:1},{s:'n',o:16,f:1},{s:'e',o:4,f:1},{s:'e',o:11,f:1},{s:'w',o:5,f:1},{s:'w',o:11,f:1}],
  parts:[{ax:'x',at:-44,a:-9.7,b:11.7,door:3},{ax:'x',at:-44,a:-9.7,b:-2},{ax:'z',at:-2,a:-51.7,b:-44,door:3},{ax:'z',at:5,a:-51.7,b:-44,door:2},
   {ax:'x',at:-45,a:4,b:11.7,door:1.5,f:1,lock:'dir'},{ax:'z',at:4,a:-51.7,b:-45,f:1},{ax:'z',at:-2,a:-51.7,b:-45,f:1,door:2.5}],
  st:{x:-9.6,z:-43.6,ax:'x',dir:1,w:1.3,f:0},
  fill:(y,f)=>{if(f===0){counter(0,-39.5,5,-38.8,y,0x4a3a2e);chair(2,-40.4,y,1);cont('cabinet',-9.4,y,-38,1);cont('cabinet',-9.4,y,-39,1);locker(11.4,-38,3,y);locker(11.4,-38.6,3,y);
    desk(-6,-49,1.6,.8,y,true);chair(-6,-48,y);cont('jacket',-9.7,y+1.1,-46.5,1);shelf(-9.7,-51.7,-9.1,-49.5,y);desk(1.5,-48.5,1.6,.8,y,true);cont('cabinet',3.5,y,-51.4,0);cont('medcase',8,y+.78,-50,0);table(8,-50,1.4,.8,y);cont('crate',10.9,y,-47,1);loose.push({x:8,y:y+.78,z:-49.6});}
   else{cont('safe',11.3,y,-51.3,3,{forced:'card'});desk(8,-48,1.8,.9,y,true);chair(8,-49,y,1);cont('cabinet',4.6,y,-51.4,0);cont('jacket',11.7,y+1.1,-46.3,3);shelf(4.3,-46,4.9,-45.3,y,1.8,3);loose.push({x:7.4,y:y+.78,z:-47.8});
    for(const[x,z]of[[-6,-50],[-6,-47]])desk(x,z,1.6,.8,y,true);cont('cabinet',-1.4,y,-51.4,0);cont('cabinet',-.8,y,-51.4,0);for(const x of[-7,-1,6])desk(x,-40,1.6,.8,y,R()<.5);cont('jacket',-9.7,y+1.1,-41,1);table(9,-38.5,2,1,y);loose.push({x:9,y:y+.78,z:-38.5});cont('pc',2,y,-37,0);}}});
 // parking lot cars
 for(const[x,z,q]of[[-8,-28,1],[-4,-28,1],[4,-29,1],[10,-28,1],[-6,-16,1],[6,-15,1]])car(x,z,q);barrier(-11,-12,1);barrier(13,-12,1);
 // ===== TOWN — north row =====
 const house=(x0,z0,x1,z1,face,t,extra)=>{const w=x1-x0,dd=z1-z0;const fo=face==='s'||face==='n'?w/2-.6:dd/2-.6;
  bld({x0,z0,x1,z1,h:3,ext:R()<.5?'plaster':'brick',et:t,it:pick([0xd8d0c0,0xc8c8b8,0xd0c4b0]),roof:'gable',rt:pick([0x6a3a2e,0x4a4a4e,0x5a4a3a]),
   doors:[{s:face,o:fo,w:1.1},{s:face==='s'?'n':'s',o:w*.25,w:1}],win:[{s:face,o:1},{s:face,o:w-2.4},{s:'e',o:dd/2-.7},{s:'w',o:dd/2-.7},{s:face==='s'?'n':'s',o:w*.6}],
   parts:[{ax:'z',at:x0+w*.55,a:z0+.3,b:z1-.3,door:face==='s'?dd-2.4:1.2}],
   fill:(y)=>{const mx=x0+w*.55;bed(x0+w*.78,z0+1.4,1,y);cont(R()<.6?'cabinet':'duffel',x1-.6,y,z1-.7,3);cont('jacket',x0+.32,y+1.1,face==='s'?z0+1.6:z1-1.6,1);
    table(x0+w*.27,(z0+z1)/2,1.4,.9,y);chair(x0+w*.27-.9,(z0+z1)/2,y);loose.push({x:x0+w*.27,y:y+.78,z:(z0+z1)/2});if(R()<.5)shelf(mx-.75,z0+.35,mx-.15,z0+2.4,y,1.9,3,.6,0x7a5a3e);if(extra)extra(y,mx);}});};
 house(-88,-26,-78,-12,'s',0xb8a890);house(-74,-25,-65,-12,'s',0xa8b0a0);
 // pharmacy with locked back room
 bld({x0:-60,z0:-26,x1:-46,z1:-12,h:3.4,ext:'plaster',et:0xd0c8b0,it:0xe0e0d8,doors:[{s:'s',o:5.5,w:1.6,open:true},{s:'w',o:3,w:1}],win:[{s:'s',o:1.2,w:3,lo:.6},{s:'s',o:9,w:3.5,lo:.6},{s:'e',o:9}],
  parts:[{ax:'x',at:-20,a:-59.7,b:-46.3,door:9.5,lock:'pharm'}],
  fill:(y)=>{counter(-58,-17.6,-52,-17,y,0x8a9aa8);shelf(-59.7,-16,-59.1,-13,y,1.9,4,.8,0xc8ccd0);shelf(-50,-19.6,-46.6,-19,y,1.9,4,.8,0xc8ccd0);shelf(-55,-14.6,-51.5,-14,y,1.6,3,.8,0xc8ccd0);
   loose.push({x:-53,y:y+1.05,z:-17.3});loose.push({x:-49,y:y+.95,z:-19.3});cont('cabinet',-59.4,y,-19,1);
   // back room
   cont('medcase',-58,y+.78,-25,0);table(-57,-25,2.4,.8,y);cont('medcase',-56,y+.78,-25,0);cont('medcase',-47,y,-25.4,0);cont('safe',-46.7,y,-21,3);shelf(-53,-25.7,-49,-25.1,y,2,4,.9,0xc8ccd0);loose.push({x:-51,y:y+.95,z:-25.4});}});
 house(-42,-25,-32,-12,'s',0x9aa4a8);
 // tavern
 bld({x0:-28,z0:-27,x1:-14,z1:-12,h:3.4,ext:'brick',et:0xa87a6a,it:0xc8b8a0,roof:'gable',rt:0x3a3a3e,doors:[{s:'s',o:6,w:1.4,open:true},{s:'n',o:2,w:1},{s:'e',o:5}],win:[{s:'s',o:1.5,w:2},{s:'s',o:10,w:2},{s:'w',o:4},{s:'w',o:9}],
  parts:[{ax:'x',at:-21.5,a:-27.7,b:-14.3,door:2}],
  fill:(y)=>{counter(-21,-19.5,-15,-18.8,y,0x5a3a2a);shelf(-20.8,-21.4,-15,-20.8,y,2,3,.9,0x5a3a2a);for(const[x,z]of[[-25,-16],[-25,-14],[-21,-14.5]]){table(x,z,1,1,y);chair(x-.7,z,y);chair(x+.7,z,y);}loose.push({x:-18,y:y+1.05,z:-19.2});
   cont('crate',-27,y,-26.3,0);crateStack(-25.9,-26.3,y,2);cont('duffel',-17,y,-26.4,0);barrel(-15,-26,y);barrel(-15,-25.2,y);cont('jacket',-14.6,y+1.1,-23,3);}});
 // ===== TOWN — south row =====
 house(-88,10,-78,24,'n',0xa89a88);
 // garage
 bld({x0:-74,z0:10,x1:-62,z1:22,h:4,ext:'metal',et:0x7a8a7a,inm:'metal',it:0x9aa49a,flr:'conc',doors:[{s:'n',o:4,w:4,hi:3.4,none:true},{s:'e',o:8,w:1}],win:[{s:'w',o:4,w:2.5,lo:1.6}],
  fill:(y)=>{car(-68,15,1,0x5a6a7a);counter(-73.6,14,-73,21.6,y,0x5a5e60);cont('toolbox',-73.3,y+1,16,1);cont('toolbox',-73.3,y+1,19,1);shelf(-72,21.4,-65,21.9,y,2.2,4,.8,0x6a6e72);cont('crate',-63,y,21.2,2);barrel(-63,11.2,y);barrel(-63.6,11.2,y);cont('cabinet',-62.6,y,18,3);loose.push({x:-73.3,y:y+1.05,z:12});}});
 house(-58,10,-48,23,'n',0xb0a8a0);house(-44,10,-35,22,'n',0x98a0a8);
 // general store
 bld({x0:-30,z0:10,x1:-16,z1:20,h:3.3,ext:'plaster',et:0xb8b8a8,it:0xe0dccc,doors:[{s:'n',o:6,w:1.6,open:true},{s:'s',o:2}],win:[{s:'n',o:1.2,w:3,lo:.6},{s:'n',o:9.5,w:3,lo:.6}],
  fill:(y)=>{counter(-29.6,12,-27,13,y);for(const z of[14,16.5])shelf(-25,z,-17,z+.6,y,1.7,3,.85,0xa8b0b8);cont('cabinet',-29.4,y,18.8,1);cont('crate',-17,y,19.2,2);loose.push({x:-21,y:y+.95,z:14.3});loose.push({x:-23,y:y+.95,z:16.8});}});
 // gas station
 S(-5,0,8,15,.12,22,'conc',0xa8a49c,{s:2});for(const[x,z]of[[-3,10],[13,10],[-3,20],[13,20]])S(x-.25,.12,z-.25,x+.25,4.4,z+.25,'steel',0xd8d4c8);S(-5,4.4,8.5,15,5,21.5,'steel',0xd8d4c8);Vb(-5.02,4.45,8.48,15.02,4.95,21.52,'paint',0xc83a2a,{skip:{py:1,ny:1}});
 for(const x of[1,9]){S(x-.6,.12,14.4,x+.6,1.7,15.6,'steel',0xc8c4b8);Vb(x-.62,1.2,14.38,x+.62,1.6,15.62,'paint',0xc83a2a);}Vb(-4,4.3,14,14,4.4,16,'glow',0xffffff);
 bld({x0:2,z0:23,x1:12,z1:30,h:3,ext:'plaster',et:0xd8d4c8,doors:[{s:'n',o:2,w:1.4,open:true}],win:[{s:'n',o:5,w:4,lo:.7}],fill:(y)=>{counter(8,24,11.5,25,y);shelf(2.4,27,7,27.6,y,1.7,3,.8,0xa8b0b8);cont('cabinet',11.5,y,29.4,3);cont('jacket',2.32,y+1.1,25,1);loose.push({x:4,y:y+.95,z:27.3});}});
 // water tower
 {const tx=-72,tz=-48;for(const[a,b]of[[-2.5,-2.5],[2.5,-2.5],[-2.5,2.5],[2.5,2.5]]){geo.beam(tx+a,0,tz+b,tx+a*.6,12,tz+b*.6,.3,'steel',0x6a6e6a);W.add(tx+a-.3,0,tz+b-.3,tx+a+.3,4,tz+b+.3,3,1);}geo.cyl(tx,12,tz,3.4,5,'metal',0x8a948e,16);geo.cyl(tx,17,tz,3.5,.4,'steel',0x5a5e5a,16,'y',{r2:.4});}
 // ===== WAREHOUSE A (mezzanine office) =====
 bld({x0:-30,z0:46,x1:6,z1:68,h:9,ext:'metal',et:0x8c8f88,inm:'metal',it:0xa0a49c,flr:'conc',rt:0x6a6c6a,lightsAx:'x',
  doors:[{s:'n',o:6,w:5,hi:4.5,none:true},{s:'n',o:24,w:5,hi:4.5,none:true},{s:'e',o:8,w:1.2},{s:'w',o:14,w:1.2},{s:'s',o:30,w:1.2}],win:[{s:'s',o:4,w:5,lo:6,hi:7.6},{s:'s',o:14,w:5,lo:6,hi:7.6},{s:'n',o:14,w:5,lo:6,hi:7.6},{s:'e',o:13,w:4,lo:6,hi:7.6},{s:'w',o:4,w:4,lo:6,hi:7.6}],
  fill:(y)=>{for(const z of[52,57,62])shelf(-27,z,-11,z+1.2,y,4.4,4,.75,0x2a5a9a);cont('crate',-12,y,51.2,0);cont('crate',-20,y,55.6,2);cont('weaponbox',-24,y,60.6,0);crateStack(-28.8,51,y,2);
   // mezzanine office
   S(-6.1,3,60,5.7,3.2,67.7,'conc',0x9a9690,{ind:.8});for(const[x,z]of[[-6,60.2],[5.5,60.2],[-.3,60.2]])S(x-.15,y,z-.15,x+.15,3,z+.15,'steel',0xc8a028);
   stairs(-10,60.3,'x',1,1.2,y,3.2,'steel',0x7a7e82);Vb(-10,1.2,61.5,-6.1,4.2,61.56,'steel',0xc8a028,{rot:[0,0,-.68]});
   Vb(-4.9,3.2,60,5.7,4.2,60.06,'steel',0xc8a028);W.add(-4.9,3.2,59.95,5.7,4.25,60.1,1,1);
   const oy=3.2;wall('x',63.4,63.55,-6.1,5.7,oy,6,[{a:-1,b:0,lo:0,hi:2.2},{a:1.5,b:4.5,lo:1,hi:2}],'plaster',0xc8c4b8,'plaster',0xc8c4b8,0);door('x',63.47,-1,1,oy,null,true);
   desk(1,65.5,1.6,.8,oy,true);cont('cabinet',5.3,oy,66,3);cont('safe',-5.6,oy,67.1,1);cont('jacket',5.6,oy+1.1,64.5,3);loose.push({x:-3,y:oy,z:62});cont('crate',3,oy,61.2,0);
   // floor stuff
   truck(-4,54,0,0x3a5a7a);for(const[x,z]of[[-8,50],[0,48.6],[3,58],[-14,66]])pallet(x,z,y,R()<.6?1:0);cont('toolbox',2,y,50,0);cont('duffel',-8,y,66.6,0);loose.push({x:-12,y:y,z:58.8});loose.push({x:-22,y:y,z:65.5});cont('crate',4.9,y,48,1);}});
 // ===== WAREHOUSE B (locked cage) =====
 bld({x0:42,z0:52,x1:64,z1:70,h:7,ext:'metal',et:0x6c7a86,inm:'metal',it:0x8a98a4,flr:'conc',rt:0x5a5e60,
  doors:[{s:'n',o:8,w:5,hi:4.5,none:true},{s:'w',o:12,w:1.2},{s:'s',o:4,w:1.2}],win:[{s:'s',o:10,w:5,lo:4.5,hi:6},{s:'n',o:15,w:4,lo:4.5,hi:6},{s:'e',o:4,w:5,lo:4.5,hi:6}],
  fill:(y)=>{fence(56,63,63.7,63,3,y);fence(56,63,56,69.7,3,y);door('x',63,57,1.2,y,'cage',false,'cage');S(56,y+3,63,63.7,y+3.05,69.7,'fence',0xffffff,{f:0});
   cont('weaponbox',61,y,69.2,0);cont('weaponbox',59,y,64,0);cont('crate',62.9,y,66,1);loose.push({x:58,y:y,z:68});
   shipCont(47,63,1,CC[1],y);shipCont(50.3,63,1,CC[4],y,true,'crate');for(const[x,z]of[[55,56],[58,58],[46,56]])pallet(x,z,y,R()<.6?1:0);cont('crate',62.9,y,55,1);crateStack(62.9,56.2,y,2);cont('toolbox',44,y,69.3,0);loose.push({x:53,y:y,z:68});}});
 // ===== FACTORY HALL + chimney =====
 bld({x0:-74,z0:46,x1:-46,z1:72,h:8,ext:'brick',et:0x8a6a5a,inm:'brick',it:0x9a8a7a,flr:'conc',rt:0x5a5450,
  doors:[{s:'n',o:10,w:4.5,hi:4.2,none:true},{s:'e',o:12,w:1.2},{s:'w',o:6,w:1.2},{s:'s',o:20,w:1.2}],win:[{s:'n',o:2,w:3,lo:3.5,hi:6},{s:'n',o:18,w:3,lo:3.5,hi:6},{s:'n',o:23,w:3,lo:3.5,hi:6},{s:'s',o:3,w:3,lo:3.5,hi:6},{s:'s',o:10,w:3,lo:3.5,hi:6},{s:'w',o:12,w:3,lo:3.5,hi:6},{s:'e',o:3,w:3,lo:3.5,hi:6}],
  parts:[{ax:'x',at:65,a:-73.7,b:-62,door:5},{ax:'z',at:-62,a:65,b:71.7,door:2}],
  fill:(y)=>{machine(-70,52,-64,56,y,2.6,0x4a5a6a);machine(-58,51,-52,55,y,2.2,0x5a6a5a);machine(-70,59,-66,62,y,3.2,0x6a5a4a);machine(-58,58,-50,61,y,1.4,0x4a5a6a);for(let x=-60;x<-48;x+=2.4)geo.cyl(x,y+3.2,59.5,.35,.3,'steel',0x777,10,'z');
   geo.cyl(-54,y,64,1.8,4.5,'steel',0x8a8e86,16);W.add(-55.8,y,62.2,-52.2,y+4.5,65.8,3,1);
   cont('weaponbox',-72.6,y,70.6,0);cont('crate',-70,y,71,0);cont('cabinet',-63,y,71.2,0);cont('jacket',-73.7,y+1.1,68,1);desk(-67,68,1.6,.8,y,true);locker(-62.6,69,3,y);cont('toolbox',-50,y+.78,70,0);table(-50,70,1.6,.8,y);cont('toolbox',-48,y,47.2,0);cont('crate',-47,y,51,1);
   loose.push({x:-56,y:y+2.3,z:53});loose.push({x:-49,y:y,z:66});loose.push({x:-68,y:y,z:49});}});
 geo.cyl(-50,0,75,2.3,34,'brick',0x7a5a4a,16,'y',{r2:1.7});W.add(-52.3,0,72.7,-47.7,34,77.3,3,0);
 // compound walls
 cwall(-78,42,-46,42.4);cwall(-78,42,-77.6,76);cwall(-78,75.6,-34,76);cwall(-26,75.6,30,76);cwall(42,75.6,66,76);cwall(65.6,50,66,76);
 // yard between factory + warehouse A
 truck(-38,56,1,0x6a4a3a);for(const[x,z]of[[-40,47],[-36,66],[-42,70]])crateStack(x,z,0,2);barrier(-34,44,0);barrier(-38,74,0);sandbags(-44,62,-43,66,1);
 cont('crate',-34.5,0,70.3,0);loose.push({x:-37,y:0,z:62});
 // fuel tanks
 for(const[x,z]of[[18,82],[28,82]]){geo.cyl(x,0,z,4,8,'steel',0xc8c4bc,20);geo.cyl(x,8,z,4.05,.8,'steel',0xa8a49c,20,'y',{r2:3});W.add(x-3.7,0,z-3.7,x+3.7,8,z+3.7,3,1);Vb(x+3.9,0,z-.4,x+4.1,8,z+.4,'steel',0x5a5e60);}
 geo.cyl(23,2.5,82,.35,10,'steel',0x8a8e86,10,'x');cont('toolbox',23,0,77.5,0);loose.push({x:22,y:0,z:86});fence(10,76,10,90);fence(36,76.4,36,90);
 // ===== RAIL LINE + yard =====
 for(let z=-100;z<80;z+=.7)Vb(-107.3,-.05,z,-104.7,.1,z+.25,'wood',0x4a3e32,{skip:{ny:1}});for(const x of[-106.8,-105.2])Vb(x-.04,.1,-100,x+.04,.24,80,'steel',0x6a6460);
 Vb(-107,.24,79,-105,1.2,80,'steel',0xc8a028);
 const boxcar=(z,open,t)=>{const x0=-107.5,x1=-104.5,z0=z,z1=z+12;S(x0,.8,z0,x1,1.1,z1,'wood',0x5a4a3a);if(open){S(x0,1.1,z0,x0+.1,4,z1,'metal',t);S(x1-.1,1.1,z0,x1,4,z0+4.5,'metal',t);S(x1-.1,1.1,z0+7.5,x1,4,z1,'metal',t);S(x0,1.1,z0,x1,4,z0+.1,'metal',t);S(x0,1.1,z1-.1,x1,4,z1,'metal',t);S(x0,4,z0,x1,4.15,z1,'metal',t);Cb(x0,0,z0,x1,.8,z1,3,1);
   stairs(x1+.95,z0+5.4,'x',-1,1.2,0,1.1,'wood',0x6a5a48);cont('crate',x0+.8,1.1,z0+6,1);if(R()<.7)loose.push({x:x0+1.5,y:1.1,z:z0+9});}else S(x0,.8,z0,x1,4.1,z1,'metal',t);
  for(const zz of[z0+1.5,z1-1.5])for(const xx of[-106.8,-105.2])geo.cyl(xx,.45,zz,.42,.18,'steel',0x222,10,'x');};
 boxcar(-44,true,0x7a3a2a);boxcar(-30,false,0x5a4a3a);boxcar(18,true,0x3a4a5a);boxcar(32,false,0x7a5a3a);boxcar(46,false,0x6a3a2a);
 // signal box + platform
 bld({x0:-100,z0:46,x1:-92,z1:54,h:3,ext:'brick',et:0x9a6a5a,roof:'gable',rt:0x4a4a4e,doors:[{s:'n',o:3}],win:[{s:'w',o:2,w:4,lo:.9},{s:'e',o:3}],fill:(y)=>{desk(-96,52.5,2,.8,y,false);cont('cabinet',-92.6,y,49,3);cont('jacket',-99.7,y+1.1,51,1);loose.push({x:-96,y:y+.78,z:52.5});}});
 S(-103,0,-10,-100,.6,10,'conc',0xa09c94);
 // ===== RAIL TUNNEL portal (north) =====
 S(-118,0,-102,-109.6,13,-100,'conc',0x8a8680,{s:2});S(-102.4,0,-102,-94,13,-100,'conc',0x8a8680,{s:2});S(-109.6,5.6,-102,-102.4,13,-100,'conc',0x8a8680,{s:2});
 Vb(-118.5,12.6,-102.2,-93.5,13.4,-99.6,'conc',0x7a7670);S(-109.6,0,-110,-109.2,5.6,-102,'dark',0xffffff);S(-102.8,0,-110,-102.4,5.6,-102,'dark',0xffffff);S(-109.6,5.6,-110,-102.4,6,-102,'dark',0xffffff);S(-109.6,0,-110,-102.4,5.6,-109.6,'dark',0xffffff);
 Vb(-109.62,5.3,-100.05,-102.38,5.6,-99.95,'paint',0xc8a028);for(const x of[-110.5,-101.5])lamp(x,-97.5);
 // ===== RADIO TOWER HILL =====
 const hy=(x,z)=>H(x,z);const shY=Math.max(hy(-56,-77),hy(-50,-77),hy(-56,-72),hy(-50,-72))+.05;
 bld({x0:-56,z0:-77,x1:-50,z1:-72,h:2.8,by:shY,ext:'conc',et:0xb0aca4,doors:[{s:'s',o:2.4,w:1}],win:[{s:'e',o:2,w:1.5},{s:'w',o:2,w:1.5}],
  fill:(y)=>{desk(-53,-76.2,2.4,.8,y,false);Vb(-54,y+.78,-76.5,-52,y+1.3,-76.1,'steel',0x3a4236);cont('cabinet',-55.6,y,-73,1,{forced:'codebook'});cont('jacket',-50.3,y+1.1,-74,3);cont('toolbox',-51,y,-76.6,0);loose.push({x:-53,y:y+.78,z:-76});}});
 {const tx=-46,tz=-83,ty=H(tx,tz)-.2,TH=42;const leg=(a,b)=>[tx+a,ty,tz+b];const top=(a,b)=>[tx+a*.18,ty+TH,tz+b*.18];
  for(const[a,b]of[[-3.5,-3.5],[3.5,-3.5],[-3.5,3.5],[3.5,3.5]]){geo.beam(...leg(a,b),...top(a,b),.32,'steel',0xb8402a);W.add(tx+a-.4,ty,tz+b-.4,tx+a+.4,ty+6,tz+b+.4,3,1);S(tx+a-.6,ty-1,tz+b-.6,tx+a+.6,ty+.4,tz+b+.6,'conc',0x9a968e);}
  for(let k=0;k<7;k++){const y0=k*TH/7,y1=(k+1)*TH/7,s0=1-.82*y0/TH,s1=1-.82*y1/TH,r0=3.5*s0,r1=3.5*s1;const col=k%2?0xd8d4cc:0xb8402a;
   for(const[ax,az,bx,bz]of[[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]]){geo.beam(tx+ax*r0,ty+y0,tz+az*r0,tx+bx*r1,ty+y1,tz+bz*r1,.12,'steel',col);geo.beam(tx+bx*r0,ty+y0,tz+bz*r0,tx+ax*r1,ty+y1,tz+az*r1,.12,'steel',col);geo.beam(tx+ax*r1,ty+y1,tz+az*r1,tx+bx*r1,ty+y1,tz+bz*r1,.14,'steel',col);}}
  Vb(tx-1.2,ty+TH,tz-1.2,tx+1.2,ty+TH+.3,tz+1.2,'steel',0x5a5e60);geo.cyl(tx,ty+TH+.3,tz,.1,6,'steel',0x777,6);for(const[a,b]of[[1,0],[-1,0],[0,1]])Vb(tx+a*.6-.25,ty+TH-6,tz+b*.6-.25,tx+a*.6+.25,ty+TH-3,tz+b*.6+.25,'paint',0xd8d4cc);
  named.push({id:'towerTop',x:tx,y:ty+TH+6.3,z:tz});}
 // helipad + flare beacon
 {const px=-34,pz=-78,py=H(px,pz);geo.cyl(px,py-1,pz,5.5,1.25,'conc',0x9a968e,24);W.add(px-4.6,py-1,pz-4.6,px+4.6,py+.25,pz+4.6,3,0);Vb(px-.25,py+.26,pz-2,px+.25,py+.27,pz+2,'paint',0xd8d4c4);Vb(px+.25,py+.26,pz-.25,px+1.6,py+.27,pz+.25,'paint',0xd8d4c4);Vb(px-1.6,py+.26,pz-2,px-1.1,py+.27,pz+2,'paint',0xd8d4c4);Vb(px+1.1,py+.26,pz-2,px+1.6,py+.27,pz+2,'paint',0xd8d4c4);
  S(px+4,py+.25,pz-.4,px+4.8,py+1.3,pz+.4,'steel',0x3a5a3a);Vb(px+4.15,py+1.3,pz-.25,px+4.65,py+1.45,pz+.25,'paint',0x3fcf6a);named.push({id:'beacon',x:px+4.4,y:py+1.3,z:pz});}
 // hill path markers + sandbag nest near tower
 sandbags(-41,-70+H(-41,-70)*0,-38,-69.4,1);
 // ===== GATEHOUSE (north) =====
 {fence(18,-97,30.9,-97);fence(39.1,-97,52,-97);S(30.6,0,-97.3,31.1,3,-96.7,'steel',0x5a5e60);S(38.9,0,-97.3,39.4,3,-96.7,'steel',0x5a5e60);
  const gate={box:W.add(31,0,-97.15,39,2.6,-96.85,7,1),x:35,z:-97};named.push({id:'gate',...gate});
  bld({x0:41,z0:-96,x1:45.5,z1:-91.5,h:2.8,ext:'plaster',et:0xc8c0a8,doors:[{s:'s',o:2,w:1}],win:[{s:'w',o:1.2,w:2,lo:.9},{s:'n',o:1.4,w:1.6,lo:1}],fill:(y)=>{counter(41.4,-95,43,-92.5,y,0x6a6e72);cont('cabinet',45,y,-95.5,3);cont('jacket',45.2,y+1.1,-93,3);loose.push({x:42,y:y+1.05,z:-94});}});
  S(40.55,.9,-94.4,40.75,1.7,-93.8,'steel',0x2a2e34);Vb(40.5,1.4,-94.25,40.56,1.55,-93.95,'paint',0x3a8aff);named.push({id:'panel',x:40.5,y:1.3,z:-94.1});
  barrier(33,-90,0);barrier(37.5,-86,0);sandbags(26,-92,27,-88,1);lamp(29,-95);}
 // ===== props: cars along roads, barriers, poles, trees, rocks =====
 for(const[x,z,q]of[[-80,1.5,0],[-60,-2,0],[-36,2,0],[-14,-1.5,0],[20,2,0],[34.5,-40,1],[35.5,-70,1],[34,20,1],[35.5,60,1],[-90,37,0],[-20,36.5,0],[10,37.5,0]])car(x,z,q,undefined,(R()-.5)*.25);
 truck(48,-2,0,0x7a4a2a);truck(-96,-28,1,0x4a5a4a);
 for(const[x,z,q]of[[-100,-6,0],[-100,6,0],[44,4.8,0],[30,-30,1],[40,-60,1],[24,44,0],[-2,44,0],[56,-30,0]])barrier(x,z,q);
 sandbags(-46,-6.5,-42,-5.5,1.1);sandbags(28,-50,29,-46,1.1);sandbags(60.5,-6,61.5,-2,1.1);sandbags(4,36,8,37,1);
 for(let x=-96;x<60;x+=22){lamp(x,-7.6);}for(let z=-90;z<80;z+=26)lamp(39.6,z);
 for(let x=-100;x<30;x+=30)pole(x,-30);for(let z=-60;z<80;z+=30)pole(-112,z);
 for(let k=0;k<70;k++){const x=-124+R()*250,z=-108+R()*206;const h=H(x,z);if(h<1.5||x>shoreX(z)-8)continue;tree(x,z,.8+R()*.7);}
 for(const[x,z]of[[-80,-60],[-96,-70],[-20,-68],[-10,-80],[-60,-62],[-110,-30],[-112,40],[-30,86],[50,88],[70,-75],[0,-60],[-86,-80],[-30,-58],[14,-66]])tree(x,z,.9+R()*.5);
 for(let k=0;k<40;k++){const x=-124+R()*250,z=-108+R()*206;const h=H(x,z);if(h<2&&!(Math.abs(x-shoreX(z))<6))continue;rock(x,z,.6+R()*1.4);}
 for(let z=-80;z<-62;z+=4)rock(shoreX(z)-1+R()*3,z,1+R());for(let z=56;z<90;z+=5)rock(shoreX(z)-2+R()*4,z,1+R());
 // scattered cover in town + yard
 for(const[x,z]of[[-66,-6],[-30,6],[18,-12],[22,26],[-96,26],[-8,30],[26,-36],[18,46],[-46,30],[-84,-34],[-56,-36],[24,60]])crateStack(x,z,0,1+(R()*2|0));
 for(const[x,z]of[[-20,30],[-84,30],[-50,-32],[16,-20],[26,-60]])barrel(x,z);
 // loose loot outside
 for(const[x,z]of[[-66,-5.3],[22,26.8],[-82,-34],[-44,32],[60,-34],[-100,10],[30,-88],[-36,-62],[14,72],[-20,41]])loose.push({x,y:Math.max(0,H(x,z)),z});

 // ===== finalize =====
 W.doorOf=new Map(doors.map(d=>[d.box,d]));W.gateBox=named.find(n=>n.id==='gate').box;W.finalize();
 const group=new THREE.Group();geo.build(mats,group);
 // door meshes (pivot at hinge)
 for(const d of doors){const g=new THREE.Group();const dg=new Geo();dg.uvs=UVS;const w=d.w-.04;const m=d.kind==='cage'?'fence':d.lock?'steel':'wood',t=d.kind==='cage'?0xffffff:d.lock?0x6a7480:pick([0x8a6a4a,0x6a4a34,0x9a8a74,0x5a6a7a]);
  if(d.ax==='x'){dg.box(.02,0,-.03,.02+w,2.13,.03,m,t);dg.box(w-.12,.95,.03,w-.05,1.05,.09,'steel',0xc8c8c0);dg.box(w-.12,.95,-.09,w-.05,1.05,-.03,'steel',0xc8c8c0);}else{dg.box(-.03,0,.02,.03,2.13,.02+w,m,t);dg.box(.03,.95,w-.12,.09,1.05,w-.05,'steel',0xc8c8c0);dg.box(-.09,.95,w-.12,-.03,1.05,w-.05,'steel',0xc8c8c0);}
  dg.build(mats,g);g.position.set(d.ax==='x'?d.a:d.at,d.y,d.ax==='x'?d.at:d.a);d.mesh=g;group.add(g);}
 const gateMesh=new THREE.Group();{const dg=new Geo();dg.uvs=UVS;for(let x=0;x<8;x+=.5)dg.box(x,0,-.04,x+.08,2.5,.04,'steel',0x4a5058);dg.box(0,.2,-.06,8,.35,.06,'steel',0x4a5058);dg.box(0,2.2,-.06,8,2.35,.06,'steel',0x4a5058);dg.box(3.6,1,-.07,4.4,1.5,.07,'paint',0xc8a028);dg.build(mats,gateMesh);gateMesh.position.set(31,0,-97);group.add(gateMesh);}
 return{W,group,doors,conts,loose,foot,roads,named,gateMesh};}

/* ================= static raid metadata ================= */
export const EXTRACTS=[
 {id:'tunnel',n:'RAIL TUNNEL',kind:'open',x:-106,z:-97.5,r:4,desc:'Always open. North-west rail cutting.'},
 {id:'boat',n:'PIER BOAT',kind:'pay',cost:6000,x:124,z:21,r:4.2,ix:121,iz:16,desc:'Pay the boatman 6,000 CR in cash at the radio post.'},
 {id:'gate',n:'GATEHOUSE',kind:'card',x:35,z:-104,r:4.5,ix:40.5,iz:-94.1,desc:'Swipe a blue gate keycard at the booth panel.'},
 {id:'flare',n:'TOWER FLARE',kind:'flare',x:-34,z:-78,r:5,ix:-29.6,iz:-78,desc:'Fire a green flare at the helipad beacon, then hold for pickup.'},
];
export const SPAWNS=[{x:10,z:94,yaw:0,n:'SOUTH ROAD'},{x:-98,z:82,yaw:-Math.PI*.6,n:'RAIL YARD'},{x:62,z:-80,yaw:Math.PI*.78,n:'NORTH BEACH'}];
export const POI=[
 {n:'Town square',x:-50,z:0,w:3},{n:'Pharmacy',x:-53,z:-9,w:2},{n:'Garage',x:-68,z:7,w:2},{n:'Tavern',x:-21,z:-9,w:2},{n:'Admin lot',x:0,z:-25,w:3},{n:'Admin hall',x:2,z:-42,w:2},{n:'Gas station',x:4,z:15,w:2},
 {n:'Harbor office',x:52,z:-4,w:3},{n:'Container yard',x:58,z:24,w:3},{n:'Pier',x:88,z:10,w:2},{n:'Cannery',x:52,z:-40,w:2},{n:'Warehouse A',x:-12,z:42,w:3},{n:'Warehouse floor',x:-6,z:58,w:2},
 {n:'Warehouse B',x:52,z:48,w:2},{n:'Factory yard',x:-38,z:58,w:3},{n:'Factory hall',x:-58,z:66,w:2},{n:'Fuel tanks',x:22,z:72,w:1},{n:'Rail yard',x:-100,z:0,w:2},{n:'Signal box',x:-96,z:42,w:1},
 {n:'Tower hill',x:-40,z:-66,w:2},{n:'Radio shack',x:-53,z:-70,w:1},{n:'Gatehouse',x:35,z:-88,w:2},{n:'North crane',x:68,z:-30,w:1},{n:'South crane',x:68,z:42,w:1},{n:'Water tower',x:-70,z:-40,w:1}];
