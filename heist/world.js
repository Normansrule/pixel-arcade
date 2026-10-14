// HALCYON HEIST — scene construction. Static geometry is lit by BAKED lamp light (per-vertex, ray-traced through the level so
// walls, counters and furniture cast real shadows; glass lets light through); glass panes, doors, the vault door, cameras and
// loot are dynamic. Dusk / night-rain moods, street dressing, skyline.
import * as THREE from '../vendor/three.module.min.js';
import {labelTex,monitorTex} from './tex.js';
import {charMat} from './actors.js';
const V=THREE.Vector3;
export const BAKE_U={value:1};
export function bakeMat(o){const m=new THREE.MeshStandardMaterial(o);m.onBeforeCompile=s=>{s.uniforms.uBake=BAKE_U;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 bake;varying vec3 vBake;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBake=bake;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vBake;uniform float uBake;')
   .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )','#if 0'))
   .replace('#include <lights_fragment_maps>','#include <lights_fragment_maps>\n irradiance+=vBake*uBake;');};m.customProgramCacheKey=()=>'hbake1';return m;}
class GB{constructor(){this.p=[];this.n=[];this.uv=[];this.c=[];this.b=[];this.i=[];}
 v(x,y,z,nx,ny,nz,u,w,c,b){this.p.push(x,y,z);this.n.push(nx,ny,nz);this.uv.push(u,w);this.c.push(c[0],c[1],c[2]);this.b.push(b[0],b[1],b[2]);}
 quad(P,n,uvf,col,bk){const[a,b,c]=P;const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  const Q=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0?[P[3],P[2],P[1],P[0]]:P;const k=this.p.length/3;for(const p of Q){const t=uvf(p);this.v(p[0],p[1],p[2],n[0],n[1],n[2],t[0],t[1],typeof col==='function'?col(p):col,bk?bk(p,n):[0,0,0]);}this.i.push(k,k+1,k+2,k,k+2,k+3);}
 box(x0,y0,z0,x1,y1,z1,col,bk,o={}){const s=o.s||1,sk=o.skip||'';const F=[['px',[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],p=>[p[2]/s,p[1]/s]],['nx',[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],p=>[p[2]/s,p[1]/s]],
  ['py',[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],p=>[p[0]/s,p[2]/s]],['ny',[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],p=>[p[0]/s,p[2]/s]],
  ['pz',[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],p=>[p[0]/s,p[1]/s]],['nz',[0,0,-1],[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],p=>[p[0]/s,p[1]/s]]];
  for(const[k,n,P,uv]of F)if(!sk.includes(k))this.quad(P,n,uv,col,bk);}
 add(g,m,col,bk){const G=g.index?g.toNonIndexed():g;const P=G.attributes.position,N=G.attributes.normal,U=G.attributes.uv;const v=new V(),n=new V(),nm=new THREE.Matrix3().getNormalMatrix(m);const k=this.p.length/3;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();this.v(v.x,v.y,v.z,n.x,n.y,n.z,U?U.getX(i):0,U?U.getY(i):0,col,bk?bk([v.x,v.y,v.z],[n.x,n.y,n.z]):[0,0,0]);this.i.push(k+i);}}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('bake',new THREE.Float32BufferAttribute(this.b,3));g.setIndex(this.i);g.computeBoundingSphere();return g;}
 get empty(){return!this.i.length;}}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const lin=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(a,b,h,s=16)=>new THREE.CylinderGeometry(a,b,h,s),SP=(r,a=12,b=8)=>new THREE.SphereGeometry(r,a,b);
function mergeN(list){if(!list.length)return null;const gs=list.map(g2=>g2.index?g2.toNonIndexed():g2);let n=0;for(const g2 of gs)n+=g2.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3);let o=0;
  for(const g2 of gs){P.set(g2.attributes.position.array,o);N.set(g2.attributes.normal.array,o);o+=g2.attributes.position.array.length;}const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));return out;}
let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;

const MOODS={
 dusk:{sky:{top:0x1d2a52,mid:0x6a4a78,hor:0xf39a5c,sun:new V(-.6,.06,.78).normalize(),sunCol:0xffa060,stars:.2},hemi:[0x8e9cc8,0x3a2a24,.5],fog:[0x4a3c4a,.008],exp:1.05,bloom:.55,thr:.86,sat:1.08,tint:0xfff0e4,outAmb:[.075,.065,.085],street:0xffa860,inAmb:[.03,.026,.022]},
 night:{sky:{top:0x05070e,mid:0x0e1424,hor:0x2a2c3c,sun:new V(.3,.5,-.8).normalize(),sunCol:0x8090b0,stars:.5},hemi:[0x55607e,0x1a1a20,.42],fog:[0x141820,.012],exp:1.12,bloom:.5,thr:.92,sat:1.02,tint:0xe6ecff,outAmb:[.03,.034,.05],street:0xd8e4ff,lampI:11,lampBulb:[1.7,1.85,2.1],inAmb:[.026,.024,.026]}};

function makeSky(o){const g=new THREE.SphereGeometry(450,32,16);const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{top:{value:new THREE.Color(o.top)},mid:{value:new THREE.Color(o.mid)},hor:{value:new THREE.Color(o.hor)},sunDir:{value:o.sun.clone()},sunCol:{value:new THREE.Color(o.sunCol)},st:{value:o.stars},time:{value:0}},
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 top,mid,hor,sunCol,sunDir;uniform float st,time;varying vec3 vD;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(hor,mid,smoothstep(0.,.18,h));c=mix(c,top,smoothstep(.15,.7,h));c=mix(c,hor*.35,smoothstep(0.,-.1,h));
  float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,8.)*.35+pow(s,2.)*.08);
  if(h>0.){vec2 p=d.xz/(h+.15)*1.2+vec2(time*.003,0.);float n=fbm(p*1.6);float k=smoothstep(.45,.85,n)*smoothstep(0.,.3,h);c=mix(c,mid*.7+sunCol*pow(s,3.)*.4,k*.6);
   float sp=h2(floor(d.xz/(h+.2)*260.));c+=vec3(1.)*step(.997,sp)*st*smoothstep(.2,.6,h)*(1.-k);}
  gl_FragColor=vec4(c,1.);}`});const s=new THREE.Mesh(g,m);s.renderOrder=-10;s.frustumCulled=false;return s;}

/* ================================================================== lamps + baking */
export function makeLamps(L,mood){const def=L.def,out=[];const M=MOODS[mood];const add=(x,y,z,col,I,R,o={})=>out.push({x,y,z,col:lin(col),I,R,room:L.roomId(x,z),...o});
 const bank=def.id==='bank';
 for(const[name,c0,r0,c1,r1]of def.rooms){const x0=L.X(c0),x1=L.X(c1+1),z0=L.Z(r0),z1=L.Z(r1+1),w=x1-x0,d=z1-z0;const cx=(x0+x1)/2,cz=(z0+z1)/2;
  if(!L.inside(cx,cz)&&!L.inside(x0+.5,z0+.5))continue;const h=L.ceilAt(cx,cz)||L.ceilAt(x0+.5,z0+.5)||3.4;
  const kind=name==='LOBBY'||name==='SHOWROOM'?'grand':name==='VAULT'||name==='STRONG ROOM'?'vault':name==='SECURITY'?'sec':/CORRIDOR|ARCHIVE|STOCK|LOUNGE/.test(name)?'staff':'office';
  const col=kind==='grand'?0xffe2c4:kind==='vault'?0xdcecff:kind==='sec'?0xa8c0ff:kind==='staff'?0xeef2ff:0xfff0dc;const I=kind==='grand'?(bank?9:7):kind==='vault'?10:kind==='sec'?3.5:kind==='staff'?5:6;
  const sp=kind==='grand'?6.5:4.6;const nx=Math.max(1,Math.round(w/sp)),nz=Math.max(1,Math.round(d/sp));
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=x0+w*(i+.5)/nx,z=z0+d*(j+.5)/nz;const y=kind==='grand'?h-1.4:h-.18;add(x,y,z,col,I,kind==='grand'?13:9,{kind,ceil:h});}}
 for(const[c,r]of def.lamps){const p=L.P([c,r]);const off=r<def.H/2+8&&def.id==='bank'?0:0;add(p.x,5.6,p.z+off,M.street,M.lampI||26,17,{kind:'street'});}
 // alley floodlight over the van + entrance sconces
 const vz=L.P(def.van.door);add(vz.x+2,4.2,vz.z+2,0xfff0d0,14,13,{kind:'flood'});
 return out;}
function bakeAt(L,lamps,amb,x,y,z,nx,ny,nz){const sx=x+nx*.25,sz=z+nz*.25;const inside=L.inside(sx,sz);const rid=L.roomId(sx,sz);
 const a=inside?amb.inA:amb.outA;const sky=inside?0:(.6+.4*Math.max(0,ny));const o=[a[0]*(inside?1:sky),a[1]*(inside?1:sky),a[2]*(inside?1:sky)];
 for(const l of lamps){const dx=l.x-x,dy=l.y-y,dz=l.z-z,d2=dx*dx+dy*dy+dz*dz;if(d2>l.R*l.R)continue;const d=Math.sqrt(d2);const ndl=(dx*nx+dy*ny+dz*nz)/d;const fall=l.I/(1+d2*.5)*ss(l.R,l.R*.55,d);
  if(l.room===rid){const fill=fall*.09*(.55+.45*Math.max(0,ndl));o[0]+=l.col[0]*fill;o[1]+=l.col[1]*fill;o[2]+=l.col[2]*fill;}if(ndl<=0)continue;
  if(!L.los(x+nx*.05,y+ny*.05,z+nz*.05,l.x,l.y,l.z))continue;const k=fall*ndl;o[0]+=l.col[0]*k;o[1]+=l.col[1]*k;o[2]+=l.col[2]*k;}
 return o;}

/* ================================================================== world */
export function buildWorld(L,TX,R,mood){const group=new THREE.Group();const def=L.def,M=MOODS[mood],bank=def.id==='bank',night=mood==='night';seed=bank?3:9;
 const lamps=makeLamps(L,mood);const amb={inA:M.inAmb,outA:M.outAmb};const cache=new Map();
 const bk=(p,n)=>{const key=(Math.round(p[0]*6))+','+(Math.round(p[1]*6))+','+(Math.round(p[2]*6))+','+(Math.round(n[0]*2))+(Math.round(n[1]*2))+(Math.round(n[2]*2));let v=cache.get(key);if(!v){v=bakeAt(L,lamps,amb,p[0],p[1],p[2],n[0],n[1],n[2]);cache.set(key,v);}return v;};
 const bm=(t,o)=>bakeMat({map:t&&t.map,normalMap:t&&t.normalMap,roughnessMap:t&&t.roughnessMap||null,vertexColors:true,...o});
 const MAT={marble:bm(TX.marble,{roughness:.32,envMapIntensity:1.5}),marbleDark:bm(TX.marbleDark,{roughness:.22,envMapIntensity:1.6}),carpet:bm(TX.carpet,{roughness:1,envMapIntensity:.1}),tile:bm(TX.tile,{roughness:.35,envMapIntensity:.8}),
  concrete:bm(TX.concrete,{roughness:.85,envMapIntensity:.3}),steel:bm(TX.steel,{roughness:.42,metalness:.45,envMapIntensity:1}),parquet:bm(TX.parquet,{roughness:.4,envMapIntensity:1.1}),sidewalk:bm(TX.sidewalk,{roughness:.8,envMapIntensity:night?1.4:.4}),
  asphalt:bm(TX.asphalt,{roughness:.6,envMapIntensity:night?2:.5}),plaster:bm(TX.plaster,{roughness:.9,envMapIntensity:.25}),paint:bm(TX.paint,{roughness:.8,envMapIntensity:.3}),wainscot:bm(TX.wainscot,{roughness:.45,envMapIntensity:.7}),
  facade:bm(TX.facade,{roughness:.85,envMapIntensity:.4}),brick:bm(TX.brick,{roughness:.85,envMapIntensity:.35}),ceiling:bm(TX.ceiling,{roughness:.95,envMapIntensity:.1}),coffer:bm(TX.coffer,{roughness:.8,envMapIntensity:.25}),
  wood:bm(TX.wood,{roughness:.45,envMapIntensity:.7}),metal:bm(TX.metal,{roughness:.42,metalness:.5,envMapIntensity:1}),brass:bm(null,{color:0xd0a050,roughness:.34,metalness:.55,envMapIntensity:1.4}),chrome:bm(null,{roughness:.18,metalness:.8,envMapIntensity:1.4}),
  dark:bm(null,{roughness:.55,metalness:.1,envMapIntensity:.5}),leather:bm(null,{roughness:.5,envMapIntensity:.5}),fabric:bm(null,{roughness:.95,envMapIntensity:.1}),leaf:bm(null,{roughness:.7,envMapIntensity:.3}),white:bm(null,{roughness:.6,envMapIntensity:.4}),
  paintLine:bm(null,{roughness:.6,envMapIntensity:.4}),car:bm(null,{roughness:.25,metalness:.6,envMapIntensity:1.3})};
 const meshes=[];const G={};const gb=k=>G[k]||(G[k]=new GB());
 const emit=()=>{for(const k in G){if(G[k].empty)continue;const m=new THREE.Mesh(G[k].geo(),MAT[k]);m.receiveShadow=true;group.add(m);meshes.push(m);}};
 const W=L.W,H=L.H,g=L.g;const FL='mktcvsrax',THIN='wgDLKnE';
 /* ---------- floors (0.5 m quads so the baked pools of light read) ---------- */
 const FMAT={m:'marble',k:'carpet',t:'tile',c:'concrete',v:'steel',x:'parquet',s:'sidewalk',r:'asphalt',a:'asphalt'};const FS={marble:2,marbleDark:2,carpet:2,tile:2,concrete:3,steel:1.5,parquet:2.5,sidewalk:2,asphalt:5};
 const FT={m:[1,1,1],k:bank?[1,1,1]:[.7,.5,.5],t:[1,1,1],c:[1,1,1],v:[1,1,1],x:[1,1,1],s:[1,1,1],r:[1,1,1],a:[.75,.72,.7]};
 const isFloor=(c,r)=>FL.includes(L.at(c,r));
 for(let r=0;r<H;r++)for(let c=0;c<W;c++){const ch=g[r][c];if(ch==='#'||ch==='!'||ch==='G')continue;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){let f=FL.includes(ch)?ch:null;if(!f){if(THIN.includes(ch)){const o=L.orient(c,r);const nc=o==='h'?c:c+(i?1:-1),nr=o==='h'?r+(j?1:-1):r;f=L.fk[nr]?.[nc]||L.fk[r][c];}else f=L.fk[r][c];}
   let k=FMAT[f]||'concrete';if(f==='m'){let edge=false;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=L.at(c+dc,r+dr);if('w#gGnDLKE'.includes(n))edge=true;}if(edge||!FL.includes(ch)&&'NV'.includes(ch))k='marbleDark';}
   const x0=L.X(c)+i*.5,z0=L.Z(r)+j*.5,s=FS[k]||2;gb(k).quad([[x0,0,z0],[x0+.5,0,z0],[x0+.5,0,z0+.5],[x0,0,z0+.5]],[0,1,0],p=>[p[0]/s,p[2]/s],FT[f]||[1,1,1],bk);}}
 // road markings, crosswalk, curbs
 {const rows=[];for(let r=0;r<H;r++)if(g[r].filter(ch=>ch==='r').length>W/2)rows.push(r);if(rows.length){const zc=(L.Z(rows[0])+L.Z(rows[rows.length-1]+1))/2;const yl=[.95,.85,.55];
   for(let x=-L.hw+1;x<L.hw-1;x+=4)gb('paintLine').quad([[x,.012,zc-.07],[x+2.2,.012,zc-.07],[x+2.2,.012,zc+.07],[x,.012,zc+.07]],[0,1,0],p=>[0,0],yl,bk);
   const ent=L.doors.find(d=>d.kind==='E');if(ent){for(let k=-3;k<=3;k++){const x=ent.x+k*.9;gb('paintLine').quad([[x-.3,.012,L.Z(rows[0])+.3],[x+.3,.012,L.Z(rows[0])+.3],[x+.3,.012,L.Z(rows[rows.length-1]+1)-.3],[x-.3,.012,L.Z(rows[rows.length-1]+1)-.3]],[0,1,0],p=>[0,0],[.9,.9,.88],bk);}}
   for(const zz of[L.Z(rows[0]),L.Z(rows[rows.length-1]+1)])gb('concrete').quad([[-L.hw,.014,zz-.12],[L.hw,.014,zz-.12],[L.hw,.014,zz+.12],[-L.hw,.014,zz+.12]],[0,1,0],p=>[p[0]/3,p[2]/3],[.7,.7,.68],bk);}}
 /* ---------- ceilings + bulkheads ---------- */
 const lobbyRect=def.ceil[0];const inR=(c,r,q)=>c>=q[0]&&c<=q[2]&&r>=q[1]&&r<=q[3];
 for(let r=0;r<H;r++)for(let c=0;c<W;c++){const h=L.ch[r*W+c];if(!h||g[r][c]==='#')continue;const x0=L.X(c),z0=L.Z(r);const grand=inR(c,r,lobbyRect)&&h>4;
  gb(grand?'coffer':'ceiling').quad([[x0,h,z0],[x0+1,h,z0],[x0+1,h,z0+1],[x0,h,z0+1]],[0,-1,0],p=>grand?[p[0]/2,p[2]/2]:[p[0]/1.2,p[2]/1.2],grand?[1,1,1]:[.95,.94,.92],bk);
  for(const[dc,dr]of[[1,0],[0,1],[-1,0],[0,-1]]){const nc=c+dc,nr=r+dr;const h2=L.ch[nr*W+nc];if(nc<0||nr<0||nc>=W||nr>=H||!h2||h2>=h||'w#'.includes(g[nr][nc])||'w#'.includes(g[r][c]))continue;
   const ex=dc>0?x0+1:dc<0?x0:null,ez=dr>0?z0+1:dr<0?z0:null;const P=ex!==null?[[ex,h2,z0],[ex,h2,z0+1],[ex,h,z0+1],[ex,h,z0]]:[[x0,h2,ez],[x0+1,h2,ez],[x0+1,h,ez],[x0,h,ez]];
   gb('plaster').quad(P,[-dc,0,-dr],p=>[(p[0]+p[2])/2,p[1]/2],[.95,.92,.88],bk);gb('brass').quad(P.map((p,k)=>[p[0]-dc*.01,k<2?h2:h2+.06,p[2]-dr*.01]),[-dc,0,-dr],p=>[0,0],[1,1,1],bk);}}
 /* ---------- walls: material chosen by what each face looks at ---------- */
 const theme=(f,y)=>{if(!f)return null;if(f==='a')return['brick',[.95,.9,.88],1.5];if(f==='s'||f==='r')return['facade',[1,1,1],2.6];
  if(f==='m')return y<1.15?['wainscot',[1,1,1],1.15]:['plaster',[1,.96,.9],2];if(f==='x')return y<1.15?['wainscot',[.8,.75,.8],1.15]:['plaster',[.42,.5,.5],2];if(f==='k')return['plaster',bank?[.95,.93,.88]:[.85,.82,.78],2];
  if(f==='t')return['paint',[.92,.95,.93],2];if(f==='c')return['concrete',[.9,.9,.9],3];if(f==='v')return['metal',[.75,.77,.8],1.5];return['plaster',[1,1,1],2];};
 const VK={ext:1,wall:1,lintel:1,sill:1,head:1,counter:1};
 for(const b of L.boxes){if(!VK[b.kind])continue;
  for(const[ax,sg]of[[0,-1],[0,1],[2,-1],[2,1]]){const fx=ax===0?(sg<0?b.x0:b.x1):(sg<0?b.z0:b.z1);if(ax===0&&(fx<=-L.hw+.01||fx>=L.hw-.01))continue;if(ax===2&&(fx<=-L.hh+.01||fx>=L.hh-.01))continue;
   const a0=ax===0?b.z0:b.x0,a1=ax===0?b.z1:b.x1;const nx=ax===0?sg:0,nz=ax===2?sg:0;const nseg=Math.max(1,Math.round(a1-a0));
   for(let si=0;si<nseg;si++){const u0=a0+(a1-a0)*si/nseg,u1=a0+(a1-a0)*(si+1)/nseg,um=(u0+u1)/2;const sx=ax===0?fx+nx*.62:um,sz=ax===2?fx+nz*.62:um;const sc=L.chAt(sx,sz);if(sc==='#'||sc==='!'&&b.kind!=='ext')continue;
    if(L.inside3(sx,1,sz)>=0&&L.boxes[L.inside3(sx,1,sz)].kind!=='prop'&&L.boxes[L.inside3(sx,1,sz)].mat!=='glass'&&b.kind!=='counter')continue;
    const f=L.fkAt(sx,sz);const isIn=L.inside(sx,sz);let top=b.y1;if(isIn){const ch=L.ceilAt(sx,sz);if(ch)top=Math.min(top,ch+.02);}if(top<=b.y0)continue;
    const ys=[b.y0];for(const y of[1.15,2.5,3.5,5])if(y>b.y0+.05&&y<top-.05)ys.push(y);ys.push(top);
    for(let yi=0;yi<ys.length-1;yi++){const y0=ys[yi],y1=ys[yi+1];let th=theme(f,(y0+y1)/2);if(!th)continue;if(b.kind==='counter')th=['wood',[.85,.7,.6],1];
     const P=(u,y)=>ax===0?[fx,y,u]:[u,y,fx];const uvs=th[2];gb(th[0]).quad([P(u0,y0),P(u1,y0),P(u1,y1),P(u0,y1)],[nx,0,nz],p=>[(ax===0?p[2]:p[0])/uvs*(ax===0?-sg:sg),p[1]/uvs],th[1],bk);}}}
  // tops of low boxes; undersides of lintels
  if(b.y1<3.2&&b.kind!=='lintel'){const k=b.kind==='counter'?'marbleDark':b.kind==='sill'?'marbleDark':'facade';gb(k).quad([[b.x0,b.y1,b.z0],[b.x1,b.y1,b.z0],[b.x1,b.y1,b.z1],[b.x0,b.y1,b.z1]],[0,1,0],p=>[p[0]/2,p[2]/2],[1,1,1],bk);}
  if(b.kind==='lintel'||b.kind==='head'){const k=L.inside((b.x0+b.x1)/2,(b.z0+b.z1)/2+.6)||L.inside((b.x0+b.x1)/2+.6,(b.z0+b.z1)/2)?'plaster':'facade';gb(k).quad([[b.x0,b.y0,b.z0],[b.x1,b.y0,b.z0],[b.x1,b.y0,b.z1],[b.x0,b.y0,b.z1]],[0,-1,0],p=>[p[0]/2,p[2]/2],[.9,.9,.9],bk);}}
 // skirting + crown trims along interior wall faces in the grand room
 /* ---------- facade dressing: cornices, pilasters, entrance canopy, sign ---------- */
 const fac=[];for(const b of L.boxes)if(b.kind==='ext'||b.kind==='head'||b.kind==='sill'){for(const[ax,sg]of[[2,1],[2,-1],[0,1],[0,-1]]){const fx=ax===0?(sg<0?b.x0:b.x1):(sg<0?b.z0:b.z1);const a0=ax===0?b.z0:b.x0,a1=ax===0?b.z1:b.x1;const um=(a0+a1)/2;
   const sx=ax===0?fx+sg*.3:um,sz=ax===2?fx+sg*.3:um;const f=L.fkAt(sx,sz);if(!'sr'.includes(f)||L.chAt(sx,sz)==='!'||b.y1<8)continue;fac.push({ax,sg,fx,a0,a1});}}
 for(const f of fac){const B=(y0,y1,d)=>{const o=f.sg*d;if(f.ax===2)gb('facade').box(f.a0,y0,Math.min(f.fx,f.fx+o),f.a1,y1,Math.max(f.fx,f.fx+o),[.92,.9,.86],bk,{s:2});else gb('facade').box(Math.min(f.fx,f.fx+o),y0,f.a0,Math.max(f.fx,f.fx+o),y1,f.a1,[.92,.9,.86],bk,{s:2});};
  B(4.1,4.45,.22);B(8.4,9,.35);B(0,.35,.12);}
 // window frames (dark bronze) + mullions
 for(const ge of L.glass){const b=ge.box;if(ge.kind==='case')continue;const ax=b.x1-b.x0>b.z1-b.z0?'x':'z';const t=ge.kind==='window'?.12:.06,fw=.06;const k=ge.kind==='window'?'dark':'metal';const col=ge.kind==='window'?[.18,.16,.14]:[.8,.8,.82];
  if(ax==='x'){const zc=(b.z0+b.z1)/2;gb(k).box(b.x0,b.y0-fw,zc-t,b.x1,b.y0,zc+t,col,bk);gb(k).box(b.x0,b.y1,zc-t,b.x1,b.y1+fw,zc+t,col,bk);gb(k).box(b.x0,b.y0,zc-t,b.x0+fw*.6,b.y1,zc+t,col,bk);gb(k).box(b.x1-fw*.6,b.y0,zc-t,b.x1,b.y1,zc+t,col,bk);}
  else{const xc=(b.x0+b.x1)/2;gb(k).box(xc-t,b.y0-fw,b.z0,xc+t,b.y0,b.z1,col,bk);gb(k).box(xc-t,b.y1,b.z0,xc+t,b.y1+fw,b.z1,col,bk);gb(k).box(xc-t,b.y0,b.z0,xc+t,b.y1,b.z0+fw*.6,col,bk);gb(k).box(xc-t,b.y0,b.z1-fw*.6,xc+t,b.y1,b.z1,col,bk);}}
 /* ---------- door casings ---------- */
 for(const d of L.doors){const t=d.ext?.56:.22,w=.08;const col=d.kind==='E'?[.75,.62,.35]:[.32,.2,.12];const k=d.kind==='E'?'brass':'wood';
  if(d.hor){const x0=L.X(d.c),x1=x0+1;const same=(dc)=>L.at(d.c+dc,d.r)===d.kind;if(!same(-1))gb(k).box(x0,0,d.z-t,x0+w,2.55,d.z+t,col,bk);if(!same(1))gb(k).box(x1-w,0,d.z-t,x1,2.55,d.z+t,col,bk);gb(k).box(x0,2.48,d.z-t,x1,2.58,d.z+t,col,bk);}
  else{const z0=L.Z(d.r),z1=z0+1;const same=(dr)=>L.at(d.c,d.r+dr)===d.kind;if(!same(-1))gb(k).box(d.x-t,0,z0,d.x+t,2.55,z0+w,col,bk);if(!same(1))gb(k).box(d.x-t,0,z1-w,d.x+t,2.55,z1,col,bk);gb(k).box(d.x-t,2.48,z0,d.x+t,2.58,z1,col,bk);}}
 /* ---------- props ---------- */
 const lootVis=new Map();// loot -> {meshes}
 const dyn=new THREE.Group();group.add(dyn);
 const stdM=o=>charMat(new THREE.MeshStandardMaterial(o));
 const DM={cash:stdM({map:TX.cash,roughness:.8}),cashTop:stdM({map:TX.cashTop,roughness:.8}),gold:stdM({color:0xf4c452,roughness:.3,metalness:.6,envMapIntensity:1.6,emissive:0x2a1800}),jewel:stdM({color:0xffffff,roughness:.02,metalness:.1,emissive:0x3a5a8a,emissiveIntensity:.4,envMapIntensity:3}),
  gem:stdM({color:0x60c0ff,roughness:.05,metalness:.2,emissive:0x2070ff,emissiveIntensity:.8}),ruby:stdM({color:0xff3050,roughness:.05,metalness:.2,emissive:0xff1030,emissiveIntensity:.7}),goldJ:stdM({color:0xffcc66,roughness:.22,metalness:.65,envMapIntensity:2,emissive:0x2a1800}),velvet:stdM({color:0x1a0a14,roughness:1})};
 const cashStack=(x,y,z,w,h,d)=>{const grp=new THREE.Group();const n=Math.max(1,Math.round(h/.14));const geo=BX(w,n*.14-.01,d);const uv=geo.attributes.uv;for(let f=0;f<6;f++){if(f===2||f===3)continue;for(let k=0;k<4;k++)uv.setY(f*4+k,uv.getY(f*4+k)*n);}
  const m=new THREE.Mesh(geo,[DM.cash,DM.cash,DM.cashTop,DM.cash,DM.cash,DM.cash]);m.position.y=(n*.14-.01)/2;grp.add(m);grp.position.set(x,y,z);return grp;};
 for(const p of L.props){const x=p.x,z=p.z,k=p.ch||p.kind;const w=p.x1-p.x0,d=p.z1-p.z0;
  if(k==='o'){const h=p.hgt;const col=gb('marble');col.add(CY(.34,.36,h-.9,24),M4(x,.45+(h-.9)/2,z),[1,1,1],bk);gb('marbleDark').add(CY(.44,.46,.45,24),M4(x,.225,z),[1,1,1],bk);gb('brass').add(CY(.4,.36,.08,24),M4(x,.49,z),[1,1,1],bk);
   gb('plaster').add(CY(.5,.36,.45,24),M4(x,h-.225,z),[1,.97,.92],bk);gb('brass').add(CY(.37,.37,.06,24),M4(x,h-.48,z),[1,1,1],bk);}
  else if(k==='p'){gb('marbleDark').add(CY(.34,.26,.7,14),M4(x,.35,z),[1,1,1],bk);for(let i=0;i<7;i++){const a=i/7*6.28;gb('leaf').add(new THREE.IcosahedronGeometry(.28+rnd()*.12,0),M4(x+Math.cos(a)*.18,.95+rnd()*.5,z+Math.sin(a)*.18,rnd(),rnd(),rnd()),[.18,.36,.14],bk);}gb('leaf').add(new THREE.IcosahedronGeometry(.32,0),M4(x,1.55,z),[.2,.4,.16],bk);}
  else if(k==='b'){const lob=L.fkAt(x,z)==='m'||L.fkAt(x,z)==='x';gb(lob?'leather':'wood').box(p.x0,.36,p.z0,p.x1,.48,p.z1,lob?[.22,.12,.08]:[.6,.45,.35],bk,{s:1});for(const sx of[p.x0+.1,p.x1-.16])gb('chrome').box(sx,0,p.z0+.08,sx+.06,.36,p.z1-.08,[.9,.9,.9],bk);}
  else if(k==='d'||k==='M'||k==='T'){const top=k==='T'?.74:.76;gb('wood').box(p.x0,top,p.z0,p.x1,top+.04,p.z1,[.9,.75,.6],bk,{s:1});const ins=.06;
   if(k==='T')gb('chrome').add(CY(.05,.08,top,8),M4(x,top/2,z),[.9,.9,.9],bk);else{gb('wood').box(p.x0+ins,0,p.z0+ins,p.x0+ins+.04,top,p.z1-ins,[.7,.55,.45],bk);gb('wood').box(p.x1-ins-.04,0,p.z0+ins,p.x1-ins,top,p.z1-ins,[.7,.55,.45],bk);}
   if(k==='d'){const big=w*d>2;const n=big?2:1;for(let i=0;i<n;i++){const mx=big?p.x0+w*(i+.5)/n:x,mz=z;gb('dark').box(mx-.24,top+.18,mz-.03,mx+.24,top+.5,mz+.01,[.08,.08,.09],bk);gb('dark').box(mx-.03,top+.04,mz-.02,mx+.03,top+.18,mz+.02,[.1,.1,.1],bk);gb('dark').box(mx-.2,top+.04,mz+.12,mx+.2,top+.06,mz+.26,[.12,.12,.13],bk);}
    gb('fabric').box(x-.24,.42,p.z1+.18,x+.24,.5,p.z1+.62,[.08,.08,.1],bk);gb('fabric').box(x-.24,.5,p.z1+.58,x+.24,1.05,p.z1+.66,[.08,.08,.1],bk);gb('chrome').add(CY(.03,.03,.42,6),M4(x,.21,p.z1+.4),[.8,.8,.8],bk);}
   if(k==='M'){gb('dark').box(p.x0+.2,top+.04,p.z0+.05,p.x1-.2,top+1.5,p.z0+.15,[.06,.06,.07],bk);const mt=new THREE.Mesh(new THREE.PlaneGeometry(w-.5,1.3),new THREE.MeshBasicMaterial({map:monitorTex(),color:new THREE.Color(1.6,1.6,1.6)}));mt.position.set(x,top+.8,p.z0+.16);dyn.add(mt);}}
  else if(k==='N'){gb('wood').box(p.x0+.04,0,p.z0+.04,p.x1-.04,1,p.z1-.04,[.55,.36,.22],bk,{s:1});gb('marbleDark').box(p.x0-.04,1,p.z0-.04,p.x1+.04,1.06,p.z1+.04,[1,1,1],bk,{s:1});gb('brass').box(p.x0,.08,p.z0,p.x1,.12,p.z1+.005,[1,1,1],bk);}
  else if(k==='h'){const ax=w>d;gb('metal').box(p.x0,0,p.z0,p.x1,2.2,p.z1,[.35,.36,.38],bk,{skip:ax?'pznz':'pxnx'});for(const y of[.05,.6,1.15,1.7,2.15])gb('metal').box(p.x0,y,p.z0,p.x1,y+.04,p.z1,[.55,.56,.6],bk);
   const n=Math.round((ax?w:d)/.42);for(let i=0;i<n;i++)for(const y of[.09,.64,1.19,1.74]){if(rnd()<.25)continue;const t=(i+.5)/n;const bx=ax?p.x0+w*t:x,bz=ax?z:p.z0+d*t;const s=.18+rnd()*.12;gb('white').box(bx-s,y,bz-s*.9,bx+s,y+.28+rnd()*.15,bz+s*.9,rnd()<.5?[.62,.5,.36]:[.78,.76,.7],bk);}}
  else if(k==='P'){gb('wood').box(p.x0+.02,0,p.z0+.02,p.x1-.02,.14,p.z1-.02,[.6,.45,.3],bk,{s:1});}
  else if(k==='A'){gb('wood').box(p.x0+.04,0,p.z0+.04,p.x1-.04,.12,p.z1-.04,[.5,.4,.3],bk,{s:1});gb('metal').box(p.x0+.04,.12,p.z0+.04,p.x1-.04,.5,p.z1-.04,[.3,.3,.32],bk);}
  else if(k==='X'){const ax=w>d;const n=Math.round(ax?w*3:d*3),rows=8;const fz=ax?(L.inside(x,z+.8)&&L.at(...L.cr(x,z+.8))!=='X'?p.z1:p.z0):0,fxx=!ax?(L.chAt(x+.8,z)!=='X'?p.x1:p.x0):0;
   gb('metal').box(p.x0,0,p.z0,p.x1,p.hgt,p.z1,[.5,.5,.52],bk,{s:.6});for(let i=0;i<n;i++)for(let j=0;j<rows;j++){const t0=i/n,t1=(i+1)/n,y0=.15+j*.3,y1=y0+.27;const col=[.72+((i+j)%3)*.04,.72,.7];
    if(ax){const zz=fz+(fz===p.z1?.012:-.012);gb('brass').box(p.x0+w*t0+.02,y0,Math.min(zz,fz),p.x0+w*t1-.02,y1,Math.max(zz,fz),[.7,.65,.55],bk);gb('chrome').box(p.x0+w*(t0+t1)/2-.03,y0+.11,Math.min(zz,fz)-.02,p.x0+w*(t0+t1)/2+.03,y0+.15,Math.max(zz,fz)+.02,col,bk);}
    else{const xx=fxx+(fxx===p.x1?.012:-.012);gb('brass').box(Math.min(xx,fxx),y0,p.z0+d*t0+.02,Math.max(xx,fxx),y1,p.z0+d*t1-.02,[.7,.65,.55],bk);}}}
  else if(k==='q'){gb('car').box(p.x0,.12,p.z0,p.x1,p.hgt,p.z1,[.12,.28,.16],bk);gb('dark').box(p.x0-.03,p.hgt,p.z0-.03,p.x1+.03,p.hgt+.06,p.z1+.03,[.05,.05,.05],bk);}
  else if(k==='y'){gb('metal').box(p.x0,0,p.z0,p.x1,p.hgt,p.z1,[.3,.32,.36],bk);const sz=L.chAt(x,z+1)!=='w'?p.z1:p.z0;const scr=new THREE.Mesh(new THREE.PlaneGeometry(.4,.3),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,.9,1.4)}));scr.position.set(x,1.3,sz+(sz===p.z1?.01:-.01));if(sz===p.z0)scr.rotation.y=Math.PI;dyn.add(scr);}
  else if(k==='u'){gb('leather').box(p.x0,0,p.z0,p.x1,.42,p.z1,[.35,.16,.1],bk);const back=L.chAt(x,p.z0-.3)!=='k';gb('leather').box(p.x0,.42,back?p.z1-.2:p.z0,p.x1,.82,back?p.z1:p.z0+.2,[.32,.15,.09],bk);}
  else if(k==='j'){gb('dark').box(p.x0,0,p.z0,p.x1,p.hgt-.02,p.z1,[.08,.07,.07],bk);gb('brass').box(p.x0-.02,p.hgt-.04,p.z0-.02,p.x1+.02,p.hgt,p.z1+.02,[1,1,1],bk);gb('brass').box(p.x0-.01,1.4,p.z0-.01,p.x1+.01,1.44,p.z1+.01,[1,1,1],bk);
   const jg=new THREE.Group();const pad=new THREE.Mesh(BX(w-.2,.04,d-.2),DM.velvet);pad.position.y=p.hgt+.02;jg.add(pad);for(let i=0;i<5;i++){const a=i/5*6.28+rnd();const r=.18;const t=new THREE.Mesh(new THREE.TorusGeometry(.05,.012,8,16),DM.goldJ);t.position.set(Math.cos(a)*r,p.hgt+.1,Math.sin(a)*r);t.rotation.x=1.2;jg.add(t);
    const gm=new THREE.Mesh(new THREE.OctahedronGeometry(.025),i%2?DM.ruby:DM.gem);gm.position.set(Math.cos(a)*r,p.hgt+.15,Math.sin(a)*r);jg.add(gm);}const nk=new THREE.Mesh(new THREE.TorusGeometry(.12,.008,6,24),DM.goldJ);nk.position.set(0,p.hgt+.06,0);nk.rotation.x=Math.PI/2;jg.add(nk);
   const lt=new THREE.Mesh(BX(w-.1,.02,d-.1),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,2.3,2.1)}));lt.position.y=1.39;jg.add(lt);jg.position.set(x,0,z);dyn.add(jg);const lo=L.loot.find(l=>l.prop===p);if(lo)lootVis.set(lo,[jg.children.filter(c=>c!==pad&&c!==lt)]);}
  else if(k==='S'){gb('steel').box(p.x0,0,p.z0,p.x1,p.hgt,p.z1,[.4,.42,.46],bk,{s:.8});}
  else if(k==='z'||k==='Z')carModel(p,k==='Z');
  else if(k==='l'){gb('dark').add(CY(.07,.1,5.6,8),M4(x,2.8,z),[.12,.12,.13],bk);const ld=L.def.H/2;gb('dark').box(x-.08,5.5,z-.08,x+.08,5.62,z+.9,[.12,.12,.13],bk);
   const bulb=new THREE.Mesh(BX(.3,.08,.5),new THREE.MeshBasicMaterial({color:night?new THREE.Color(...M.lampBulb):new THREE.Color(5,3.2,1.4)}));bulb.position.set(x,5.46,z+.7);dyn.add(bulb);}}
 // loot meshes: cash pallets (2 stacks each), gold (bars), safe contents
 for(const lo of L.loot){const p=lo.prop;if(lo.kind==='cash'&&p.ch==='P'){const a=cashStack(p.x-.2,.14,p.z,.36,.9,.5),b=cashStack(p.x+.2,.14,p.z,.36,1.05,.5);dyn.add(a,b);lootVis.set(lo,[b,a]);}
  else if(lo.kind==='gold'&&p.ch==='A'){const grp=new THREE.Group();const bars=[];for(let j=0;j<4;j++)for(let i=0;i<3;i++)for(let k2=0;k2<2;k2++){const g2=new THREE.BoxGeometry(.24,.08,.12);if(j%2){g2.rotateY(Math.PI/2);g2.translate((k2-.5)*.26,.54+j*.085,(i-1)*.24*.6);}else g2.translate((i-1)*.24,.54+j*.085,(k2-.5)*.26);bars.push(g2);}grp.add(new THREE.Mesh(mergeN(bars),DM.gold));grp.position.set(p.x,0,p.z);dyn.add(grp);lootVis.set(lo,[grp]);}
  else if(lo.need==='safe'&&p.ch==='S'){const grp=lo.kind==='gold'?new THREE.Group():cashStack(p.x+.2,.12,p.z,.4,.42,.45);if(lo.kind==='gold'){for(let i=0;i<6;i++){const m=new THREE.Mesh(BX(.24,.08,.12),DM.gold);m.position.set(p.x-.25+(i%3)*.22,1.02+(i/3|0)*.085,p.z);grp.add(m);}}dyn.add(grp);lootVis.set(lo,[grp]);}}
 function carModel(p,van){const ax=(p.x1-p.x0)>(p.z1-p.z0);const len=ax?p.x1-p.x0:p.z1-p.z0,wid=ax?p.z1-p.z0:p.x1-p.x0;const ry=ax?0:Math.PI/2;const col=van?[.82,.82,.8]:[[.5,.06,.06],[.08,.12,.22],[.22,.22,.24],[.6,.55,.45],[.05,.05,.06]][(p.c+p.r)%5];
  const T=(lx,ly,lz)=>{const c=Math.cos(ry),s=Math.sin(ry);return[p.x+lx*c+lz*s,ly,p.z-lx*s+lz*c];};const box=(k,lx0,ly0,lz0,lx1,ly1,lz1,cc)=>{const a=T(lx0,ly0,lz0),b=T(lx1,ly1,lz1);gb(k).box(Math.min(a[0],b[0]),ly0,Math.min(a[2],b[2]),Math.max(a[0],b[0]),ly1,Math.max(a[2],b[2]),cc,bk,{s:1});};
  const hl=len/2,hw=wid/2-.05;if(van){box('car',-hl,.35,-hw,hl,2.3,hw,col);box('dark',hl-1.1,1.3,-hw-.01,hl-.2,2.05,hw+.01,[.05,.06,.08]);box('dark',hl+.001,1.2,-hw+.15,hl+.02,2.05,hw-.15,[.05,.06,.08]);box('car',-hl,.35,-hw-.02,hl,.6,hw+.02,[.2,.2,.22]);}
  else{box('car',-hl,.3,-hw,hl,.95,hw,col);box('car',-hl*.45,.95,-hw+.08,hl*.4,1.42,hw-.08,col);box('dark',-hl*.45+.05,1,-hw+.07,hl*.4-.05,1.38,hw-.07,[.04,.05,.07]);}
  for(const sx of[-hl+.55,hl-.6])for(const sz of[-hw,hw]){const c=T(sx,.32,sz);gb('dark').add(CY(.33,.33,.22,14),M4(c[0],.33,c[2],Math.PI/2,ry+Math.PI/2,0),[.04,.04,.04],bk);}
  const lc=T(hl+.01,.75,0);const hlm=new THREE.Mesh(BX(.04,.12,wid-.4),new THREE.MeshBasicMaterial({color:van?new THREE.Color(.2,.2,.2):new THREE.Color(2.5,2.4,2)}));hlm.position.set(lc[0],.75,lc[2]);hlm.rotation.y=ry;dyn.add(hlm);
  const tc=T(-hl-.01,.8,0);const tl=new THREE.Mesh(BX(.04,.1,wid-.3),new THREE.MeshBasicMaterial({color:new THREE.Color(2.5,.1,.08)}));tl.position.set(tc[0],.8,tc[2]);tl.rotation.y=ry;dyn.add(tl);
  if(van){const sign=new THREE.Mesh(new THREE.PlaneGeometry(len*.55,.7),new THREE.MeshStandardMaterial({map:labelTex([{t:'BRASSWORKS',f:'400 150px Anton, Impact, sans-serif',c:'#1d3a5a',y:.42},{t:'PLUMBING · 24H',f:'700 70px JetBrains Mono, monospace',c:'#b8462a',y:.8}],{w:1024,h:256}),transparent:true,roughness:.6}));
   for(const s of[-1,1]){const m=sign.clone();const c=T(-.3,1.4,s*(hw+.03));m.position.set(c[0],1.4,c[2]);m.rotation.y=ry+(s>0?0:Math.PI);dyn.add(m);}}}
 /* ---------- cameras ---------- */
 const camMat=stdM({color:0xd8d8d4,roughness:.4,metalness:.3}),camDark=stdM({color:0x1a1a1c,roughness:.3}),ledM=new THREE.MeshBasicMaterial({color:new THREE.Color(4,.2,.1)});
 const coneM=new THREE.MeshBasicMaterial({map:TX.cone,color:new THREE.Color(1,.35,.25),transparent:true,opacity:.11,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
 const cams=def.cams.map(([c,r,y,yaw,sweep],i)=>{const x=(c-W/2)*1,z=(r-H/2)*1;const root=new THREE.Group();root.position.set(x,y,z);const arm=new THREE.Mesh(BX(.06,.06,.3),camDark);arm.position.z=0;root.add(arm);
  const piv=new THREE.Group();piv.rotation.y=yaw*Math.PI/180;root.add(piv);const tilt=new THREE.Group();tilt.rotation.x=-.42;piv.add(tilt);const body=new THREE.Mesh(BX(.16,.14,.36),camMat);body.position.z=-.12;tilt.add(body);const lens=new THREE.Mesh(CY(.05,.06,.06,12),camDark);lens.rotation.x=Math.PI/2;lens.position.z=-.32;tilt.add(lens);
  const hood=new THREE.Mesh(BX(.2,.02,.42),camMat);hood.position.set(0,.085,-.14);tilt.add(hood);const led=new THREE.Mesh(SP(.015,6,4),ledM);led.position.set(.05,.04,-.31);tilt.add(led);
  const len=14;const cg=new THREE.ConeGeometry(Math.tan(.42)*len,len,24,1,true);cg.translate(0,-len/2,0);cg.rotateX(-Math.PI/2);const cone=new THREE.Mesh(cg,coneM);cone.position.z=-.3;cone.rotation.x=0;tilt.add(cone);cone.renderOrder=5;
  dyn.add(root);return{root,piv,tilt,led,cone,yaw0:yaw*Math.PI/180,sweep:sweep*Math.PI/180,x,y,z,ph:i*1.7,dead:false};});
 /* ---------- glass (one instanced mesh; broken panes scale to zero) ---------- */
 const glassMat=new THREE.MeshPhysicalMaterial({color:0xcfe8ff,roughness:.04,metalness:0,transmission:0,transparent:true,opacity:.18,envMapIntensity:2.2,depthWrite:false,side:THREE.DoubleSide,specularIntensity:1});
 const glassMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),glassMat,L.glass.length);glassMesh.renderOrder=6;const m4=new THREE.Matrix4();
 L.glass.forEach((ge,i)=>{const b=ge.box;ge.ii=i;m4.compose(new V((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.z0+b.z1)/2),new THREE.Quaternion(),new V(b.x1-b.x0,b.y1-b.y0,b.z1-b.z0));glassMesh.setMatrixAt(i,m4);});group.add(glassMesh);
 const breakGlass=ge=>{m4.makeScale(0,0,0);glassMesh.setMatrixAt(ge.ii,m4);glassMesh.instanceMatrix.needsUpdate=true;};
 /* ---------- doors (dynamic leaves) ---------- */
 const DOORM={D:stdM({map:TX.wood.map,color:0xb08060,roughness:.5}),L:stdM({map:TX.wood.map,color:0x8a6040,roughness:.5}),K:stdM({color:0x6a7078,roughness:.35,metalness:.8}),E:stdM({color:0xcfe8ff,roughness:.05,transparent:true,opacity:.22,envMapIntensity:2,depthWrite:false}),
  frameE:stdM({color:0xc89a50,roughness:.25,metalness:1}),handle:stdM({color:0xd0b070,roughness:.2,metalness:1})};
 for(const d of L.doors){const piv=new THREE.Group();const hx=d.hor?L.X(d.c)+(d.hinge>0?1:0):d.x,hz=d.hor?d.z:L.Z(d.r)+(d.hinge>0?1:0);piv.position.set(hx,0,hz);
  const leaf=new THREE.Group();piv.add(leaf);const len=.96;const geo=BX(d.hor?len:.06,2.46,d.hor?.06:len);const m=new THREE.Mesh(geo,DOORM[d.kind]);const off=-d.hinge*(len/2+.02);if(d.hor)m.position.set(off,1.23,0);else m.position.set(0,1.23,off);leaf.add(m);
  if(d.kind==='E'){const fr=new THREE.Mesh(BX(d.hor?len:.07,.08,d.hor?.07:len),DOORM.frameE);fr.position.copy(m.position);fr.position.y=.04;leaf.add(fr);const fr2=fr.clone();fr2.position.y=2.42;leaf.add(fr2);const bar=new THREE.Mesh(BX(d.hor?.5:.05,.04,d.hor?.05:.5),DOORM.frameE);bar.position.copy(m.position);bar.position.y=1.05;leaf.add(bar);}
  else{const h=new THREE.Mesh(BX(d.hor?.12:.14,.03,d.hor?.14:.12),DOORM.handle);const ho=-d.hinge*(len-.1);if(d.hor)h.position.set(ho,1.02,0);else h.position.set(0,1.02,ho);leaf.add(h);}
  if(d.kind==='K'||d.kind==='L'){const rd=new THREE.Group();const rb=new THREE.Mesh(BX(.1,.16,.04),camDark);rd.add(rb);const led=new THREE.Mesh(BX(.03,.03,.02),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.1)}));led.position.set(0,.05,.025);rd.add(led);
   const side=d.hinge;const px=d.hor?L.X(d.c)+(side>0?-.12:1.12):d.x,pz=d.hor?d.z:L.Z(d.r)+(side>0?-.12:1.12);if(d.kind==='K'){rd.position.set(px,1.2,pz);if(!d.hor)rd.rotation.y=Math.PI/2;dyn.add(rd);d.led=led;}}
  dyn.add(piv);d.mesh=piv;}
 /* ---------- vault door ---------- */
 let vaultG=null;if(L.vault){const v=L.vault;const vm=stdM({map:TX.vaultDoor.map,normalMap:TX.vaultDoor.normalMap,color:0xc8ccd2,roughness:.3,metalness:.85});const vs=stdM({color:0x8a8e94,roughness:.35,metalness:.9});
  const hingeX=L.X(v.c1+1)-.15;const piv=new THREE.Group();piv.position.set(hingeX,0,v.z+.55);const door=new THREE.Group();piv.add(door);
  const disc=new THREE.Mesh(CY(1.55,1.55,.55,40),[vs,vm,vm]);disc.rotation.x=Math.PI/2;disc.position.set(-(hingeX-v.x),1.75,-.1);door.add(disc);
  for(let i=0;i<14;i++){const a=i/14*6.28;const bolt=new THREE.Mesh(CY(.09,.09,.4,10),vs);bolt.rotation.z=Math.PI/2;bolt.rotation.y=a;bolt.position.set(disc.position.x+Math.cos(a)*1.55,1.75+Math.sin(a)*1.55,-.1);door.add(bolt);}
  const wheel=new THREE.Group();wheel.position.set(disc.position.x,1.75,.25);for(let i=0;i<4;i++){const s=new THREE.Mesh(CY(.03,.03,1.2,8),DOORM.handle);s.rotation.z=i*Math.PI/4;wheel.add(s);}const hub=new THREE.Mesh(CY(.12,.12,.12,16),DOORM.handle);hub.rotation.x=Math.PI/2;wheel.add(hub);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.035,8,32),DOORM.handle);wheel.add(ring);door.add(wheel);
  // frame (static)
  const fr=new THREE.Mesh(new THREE.TorusGeometry(1.62,.14,10,40),vs);fr.position.set(v.x,1.75,v.z+.52);dyn.add(fr);
  dyn.add(piv);vaultG={piv,wheel,door};v.mesh=piv;}
 let safeG=null;if(L.safe){const s=L.safe;const vm=stdM({color:0x5a5f66,roughness:.35,metalness:.85});const piv=new THREE.Group();const front=L.chAt(s.x,s.z1+.5)!=='S'?1:-1;piv.position.set(s.x0+.02,0,front>0?s.z1+.02:s.z0-.02);const dr=new THREE.Mesh(BX(s.x1-s.x0-.06,s.hgt-.12,.12),vm);dr.position.set((s.x1-s.x0)/2,s.hgt/2,front*.06);piv.add(dr);
  const dial=new THREE.Mesh(CY(.12,.12,.06,20),DOORM.handle);dial.rotation.x=Math.PI/2;dial.position.set((s.x1-s.x0)/2,s.hgt*.6,front*.14);piv.add(dial);const hdl=new THREE.Mesh(BX(.36,.05,.06),DOORM.handle);hdl.position.set((s.x1-s.x0)/2,s.hgt*.42,front*.15);piv.add(hdl);dyn.add(piv);safeG={piv,dial,front};}
 /* ---------- lobby / showroom decor ---------- */
 const lights=[];// emissive fixtures + chandeliers
 const bulbM=new THREE.MeshBasicMaterial({color:new THREE.Color(5,4,2.6)}),panelM=new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,3.1,2.9)}),coldM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,3,3.6)});
 const panelGeo=[];const bulbGeo=[];
 const chB=[],chR=[],chD=[];const at=(g2,x,y,z,rx=0)=>{const m=new THREE.Matrix4().makeRotationX(rx);m.setPosition(x,y,z);g2.applyMatrix4(m);return g2;};
 for(const l of lamps){if(l.kind==='street'||l.kind==='flood')continue;if(l.kind==='grand'){// chandelier: brass rings + bulbs + crystal drops, merged per material
   chR.push(at(CY(.02,.02,l.ceil-l.y,6),l.x,l.y+(l.ceil-l.y)/2,l.z));
   for(const[r,y,n]of[[.9,0,12],[.6,.35,8],[.3,.65,5]]){chR.push(at(new THREE.TorusGeometry(r,.025,6,32),l.x,l.y+y,l.z,Math.PI/2));for(let i=0;i<n;i++){const a=i/n*6.28;
     chB.push(at(SP(.05,8,6),l.x+Math.cos(a)*r,l.y+y+.07,l.z+Math.sin(a)*r));chD.push(at(new THREE.OctahedronGeometry(.035),l.x+Math.cos(a)*r,l.y+y-.1,l.z+Math.sin(a)*r));}}}
  else{const g2=l.kind==='vault'?BX(.25,.06,1.2):BX(.6,.03,.6);g2.translate(l.x,l.ceil-.015,l.z);(l.kind==='vault'||l.kind==='sec'?bulbGeo:panelGeo).push(g2);}}
 {const r=mergeN(chR);if(r)dyn.add(new THREE.Mesh(r,DOORM.handle));const d=mergeN(chD);if(d)dyn.add(new THREE.Mesh(d,DM.jewel));}
 const mergeG=(list)=>{if(!list.length)return null;let n=0;for(const g2 of list)n+=g2.toNonIndexed().attributes.position.count;const P=new Float32Array(n*3);let o=0;for(const g2 of list){const a=g2.toNonIndexed().attributes.position.array;P.set(a,o);o+=a.length;}const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));return out;};
 {const c=mergeG(chB);if(c)dyn.add(new THREE.Mesh(c,bulbM));const a=mergeG(panelGeo);if(a)dyn.add(new THREE.Mesh(a,panelM));const b=mergeG(bulbGeo);if(b)dyn.add(new THREE.Mesh(b,coldM));}
 // bank name over the counter bulkhead, and on the facade
 const labelMat=(lines,o)=>new THREE.MeshBasicMaterial({map:labelTex(lines,o),transparent:true,depthWrite:false,color:new THREE.Color(1.3,1.3,1.3)});
 if(bank){const c=lobbyRect;const zc=L.Z(c[1])+.02,xc=(L.X(c[0])+L.X(c[2]+1))/2;const s=new THREE.Mesh(new THREE.PlaneGeometry(9,1.6),labelMat([{t:'HALCYON',f:'400 150px Anton, Impact, sans-serif',c:'#e8c06a',y:.42,glow:'#ffb040',blur:12},{t:'SAVINGS  &  TRUST  ·  EST. 1921',f:'700 46px JetBrains Mono, monospace',c:'#d8b880',y:.84}],{w:1024,h:256}));s.position.set(xc,4.6,zc+.01);dyn.add(s);
  const ent=L.doors.find(d=>d.kind==='E');if(ent){const fs=new THREE.Mesh(new THREE.PlaneGeometry(10,1.2),labelMat([{t:'HALCYON SAVINGS & TRUST',f:'400 120px Anton, Impact, sans-serif',c:'#f2d48a',y:.55,glow:'#ffa030',blur:20}],{w:1024,h:160}));fs.position.set(ent.x+(L.doors.filter(d=>d.kind==='E').length-1)/2*0,6.3,L.Z(ent.r+1)+.4);dyn.add(fs);
   const ec=L.doors.filter(d=>d.kind==='E');const ex=(ec[0].x+ec[ec.length-1].x)/2;fs.position.x=ex;const can=new THREE.Mesh(BX(ec.length+2,.18,1.6),stdM({color:0x1a1c22,roughness:.4,metalness:.6}));can.position.set(ex,3.1,L.Z(ent.r+1)+.8);dyn.add(can);
   const cl=new THREE.Mesh(BX(ec.length+1.8,.03,1.4),panelM);cl.position.set(ex,3.0,L.Z(ent.r+1)+.8);dyn.add(cl);}
  // paintings on the lobby's east wall + clock above the counter
  const pw=L.X(c[2]+1)-.17;for(let i=0;i<3;i++){const pz=L.Z(c[1])+3+i*4.2;const fr=new THREE.Mesh(BX(.06,1.5,2.1),DOORM.handle);fr.position.set(pw-.04,2.4,pz);dyn.add(fr);const art=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.3),stdM({map:TX.paintings[i],roughness:.7}));art.position.set(pw-.08,2.4,pz);art.rotation.y=-Math.PI/2;dyn.add(art);}
  const clock=new THREE.Mesh(CY(.45,.45,.06,32),[DOORM.handle,stdM({map:labelTex([{t:'XII',f:'700 60px serif',c:'#222',y:.16},{t:'·  ·',f:'700 60px serif',c:'#222',y:.5},{t:'VI',f:'700 60px serif',c:'#222',y:.85}],{w:256,h:256,bg:'#f4ecd8'}),roughness:.4}),DOORM.handle]);clock.rotation.x=Math.PI/2;clock.position.set(xc+6.2,4.6,zc+.05);dyn.add(clock);
  // queue stanchions
  const stM=DOORM.handle,ropeM=stdM({color:0x7a0e18,roughness:.6});for(let i=0;i<5;i++){const sx=L.X(c[0])+4+i*1.6,sz=L.Z(c[1])+2.2;const post=new THREE.Mesh(CY(.03,.03,.95,8),stM);post.position.set(sx,.48,sz);dyn.add(post);const base=new THREE.Mesh(CY(.16,.18,.04,16),stM);base.position.set(sx,.02,sz);dyn.add(base);
   if(i<4){const rope=new THREE.Mesh(CY(.02,.02,1.6,6),ropeM);rope.rotation.z=Math.PI/2;rope.position.set(sx+.8,.82,sz);dyn.add(rope);}}}
 else{// jewellery: neon sign on the facade, mirror strip
  const ent=L.doors.filter(d=>d.kind==='E');const ex=(ent[0].x+ent[ent.length-1].x)/2;const fs=new THREE.Mesh(new THREE.PlaneGeometry(9,1.6),new THREE.MeshBasicMaterial({map:labelTex([{t:'LUMEN & CO.',f:'400 150px Anton, Impact, sans-serif',c:'#ffe6ff',y:.45,glow:'#ff40c0',blur:30},{t:'FINE JEWELLERS',f:'700 48px JetBrains Mono, monospace',c:'#ffd0f0',y:.85,glow:'#ff40c0',blur:16}],{w:1024,h:200}),transparent:true,depthWrite:false,color:new THREE.Color(2,2,2)}));
  fs.position.set(ex,5.2,L.Z(ent[0].r+1)+.25);dyn.add(fs);const can=new THREE.Mesh(BX(ent.length+2,.15,1.4),stdM({color:0x111114,roughness:.4,metalness:.6}));can.position.set(ex,3.1,L.Z(ent[0].r+1)+.7);dyn.add(can);
  const c=def.ceil[0];const pw=L.X(c[2]+1)-.17;for(let i=0;i<2;i++){const pz=L.Z(c[1])+3+i*5;const art=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.1),stdM({map:TX.paintings[i+2],roughness:.7}));art.position.set(L.X(c[0])+.18,2.6,pz+1);art.rotation.y=Math.PI/2;dyn.add(art);}}
 emit();
 /* ---------- skyline beyond the street + across the alley ---------- */
 {const cm=new THREE.MeshStandardMaterial({map:TX.city.map,emissiveMap:TX.city.emissiveMap,emissive:new THREE.Color(1.3,1.15,.95),roughness:.9});TX.city.map.repeat.set(1,1);const sk=new THREE.Group();
  const put=(x,z,w,d,h)=>{const g2=BX(w,h,d);const uv=g2.attributes.uv;for(let i=0;i<uv.count;i++){const nx=g2.attributes.normal.getX(i),nz=g2.attributes.normal.getZ(i);const sw=Math.abs(nx)>.5?d:w;uv.setXY(i,uv.getX(i)*sw/13,uv.getY(i)*h/16);}const m=new THREE.Mesh(g2,cm);m.position.set(x,h/2,z);sk.add(m);};
  const zs=L.hh+1;for(let x=-L.hw-20;x<L.hw+20;){const w=8+rnd()*12;put(x+w/2,zs+6+rnd()*4,w,10,12+rnd()*22);x+=w+.5;}
  for(let z=-L.hh-20;z<L.hh;){const d=8+rnd()*10;put(L.hw+8+rnd()*3,z+d/2,12,d,14+rnd()*20);put(-L.hw-8-rnd()*3,z+d/2,12,d,14+rnd()*20);z+=d+.5;}
  for(let x=-L.hw;x<L.hw;){const w=9+rnd()*10;put(x+w/2,-L.hh-8,w,12,16+rnd()*24);x+=w+.5;}group.add(sk);}
 /* ---------- lights for dynamic objects (characters, doors, loot): a pool of point lights parked at the nearest lamps ---------- */
 const hemi=new THREE.HemisphereLight(M.hemi[0],M.hemi[1],M.hemi[2]);group.add(hemi);
 const pool=[];for(let i=0;i<6;i++){const l=new THREE.PointLight(0xffffff,0,10,1.6);group.add(l);pool.push(l);}
 const sky=makeSky(M.sky);group.add(sky);
 let env=null;{const s=new THREE.Scene();s.background=new THREE.Color(night?0x0a0c14:0x2a2228);const room=new THREE.Mesh(new THREE.BoxGeometry(30,10,30),new THREE.MeshBasicMaterial({color:night?0x181a22:0x3a3028,side:THREE.BackSide}));room.position.y=4;s.add(room);
  for(let i=0;i<6;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(3,1.5),new THREE.MeshBasicMaterial({color:new THREE.Color(night?2:2.8,night?2.2:2.3,night?2.6:1.7),side:THREE.DoubleSide}));p.rotation.x=Math.PI/2;p.position.set(-8+(i%3)*8,8.9,-5+(i/3|0)*10);s.add(p);}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshBasicMaterial({color:night?0x101014:0x30261e}));fl.rotation.x=-Math.PI/2;fl.position.y=-.9;s.add(fl);const pm=new THREE.PMREMGenerator(R);env=pm.fromScene(s,.03).texture;pm.dispose();}
 /* ---------- rain (night) ---------- */
 let rain=null;if(night){const N=2400,pos=new Float32Array(N*6),vel=new Float32Array(N);const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
  const m=new THREE.LineBasicMaterial({color:new THREE.Color(.55,.6,.72),transparent:true,opacity:.26,depthWrite:false});const ls=new THREE.LineSegments(g2,m);ls.frustumCulled=false;group.add(ls);
  for(let i=0;i<N;i++){vel[i]=17+Math.random()*6;pos[i*6]=(Math.random()-.5)*40;pos[i*6+1]=Math.random()*14;pos[i*6+2]=(Math.random()-.5)*40;}rain={pos,vel,N,g:g2};}
 let t=0;const street=lamps.filter(l=>l.kind!=='grand'||true);
 function update(dt,cam,splash){t+=dt;sky.material.uniforms.time.value=t;
  // park the dynamic light pool on the lamps nearest the camera
  const cx=cam.position.x,cz=cam.position.z;const near=lamps.map(l=>[l,Math.hypot(l.x-cx,l.z-cz)/Math.sqrt(l.I)]).sort((a,b)=>a[1]-b[1]);
  pool.forEach((pl,i)=>{const e=near[i];if(!e){pl.intensity=0;return;}const l=e[0];pl.position.set(l.x,l.kind==='grand'?l.y-.2:l.y-.3,l.z);pl.color.setRGB(l.col[0],l.col[1],l.col[2]);pl.intensity=l.I*(l.kind==='street'?.55:l.kind==='grand'?1.4:1.1);pl.distance=l.R;});
  for(const c of cams){if(c.dead){c.led.visible=false;c.cone.visible=false;continue;}c.led.visible=(t+c.ph)%1.4<.7;}
  if(rain){const{pos,vel,N}=rain;const cy=cam.position.y;const drift=1.2;
   for(let i=0;i<N;i++){const k=i*6;let x=pos[k],y=pos[k+1],z=pos[k+2];y-=vel[i]*dt;x+=drift*dt;let rx=x-cx,rz=z-cz;if(rx>20)x-=40;else if(rx<-20)x+=40;if(rz>20)z-=40;else if(rz<-20)z+=40;
    const fl=L.inside(x,z)||L.chAt(x,z)==='#'?9:0;if(y<fl){if(splash&&fl===0&&Math.random()<.06&&Math.abs(x-cx)<10&&Math.abs(z-cz)<10)splash(x,.02,z);y=cy+7+Math.random()*6;x=cx+(Math.random()-.5)*40;z=cz+(Math.random()-.5)*40;}
    pos[k]=x;pos[k+1]=y;pos[k+2]=z;pos[k+3]=x-drift*.025;pos[k+4]=y+.32;pos[k+5]=z;}rain.g.attributes.position.needsUpdate=true;}}
 return{group,meshes,sky,env,hemi,pool,lamps,cams,glassMesh,breakGlass,lootVis,vaultG,safeG,update,M,fog:new THREE.FogExp2(M.fog[0],M.fog[1]),MAT,DM,dyn,cashStack};}
