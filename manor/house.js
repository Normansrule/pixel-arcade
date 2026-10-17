// HOLLOW MANOR — the house: four floor plans (cellar, ground, upper, attic) on a 1 m grid, merged static geometry with baked
// corner shading, windows with moonlight shafts, doors, stairs, furniture, lamps, hiding places, collision, sight lines and
// the stalker's breadth-first path finding across floors.
import * as THREE from '../vendor/three.module.min.js';
import {portraitTex,paintingTex,labelTex,SERIF} from './tex.js';
const V=THREE.Vector3;
export const W=30,H=22,FH=3.6,NL=4,LY=[-3.6,0,3.6,7.2];
export const ROOMS={
 l:{n:'LIBRARY',wall:'wpG',floor:'oak',wain:1},s:{n:'STUDY',wall:'wpR',floor:'oak',wain:1},g:{n:'PORTRAIT GALLERY',wall:'wpD',floor:'oak',wain:1},
 f:{n:'GRAND FOYER',wall:'wpD',floor:'marble',wain:1},d:{n:'DINING ROOM',wall:'wpR',floor:'oak',wain:1},k:{n:'KITCHEN',wall:'plaster',floor:'ktile',tile:1},
 h:{n:'UPPER LANDING',wall:'wpB',floor:'oak',wain:1},b:{n:'MASTER BEDROOM',wall:'wpP',floor:'oak',wain:1},n:{n:'NURSERY',wall:'wpN',floor:'oak',wain:1},
 u:{n:'GUEST ROOM',wall:'wpG',floor:'oak',wain:1},t:{n:"SERVANTS' STAIR",wall:'plaster',floor:'planks'},a:{n:'ATTIC',wall:'planks',floor:'planks',ceil:'planks'},
 c:{n:'CELLAR',wall:'stone',floor:'stonef',ceil:'stonef'}};
const SC={wpG:1.2,wpR:1.2,wpD:1.2,wpP:1.2,wpN:1.2,wpB:1.2,panel:1,trim:.6,wood:1,dark:1,oak:3,marble:2,ktile:2,wtile:.8,planks:1.4,stone:1.8,stonef:2,plaster:2,ceil:3,cloth:.8,sheet:1.2,rug:2,metal:1,books:.8};
const SOLID='#=';const DOORS='DLKPE';
const isOpen=ch=>ch!==undefined&&!SOLID.includes(ch)&&ch!=='~';
const CH=(x,z)=>[x,z];
export const STAIRS=[{L:1,x0:13,x1:16,z0:8,z1:13,room:'f',grand:1},{L:0,x0:27,x1:28,z0:12,z1:16,room:'c'},{L:2,x0:21,x1:22,z0:13,z1:18,room:'t'}];
function plan(){const P=[0,1,2,3].map(()=>Array.from({length:H},()=>Array(W).fill('#')));
 const R=(L,x0,z0,x1,z1,c)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)P[L][z][x]=c;},S=(L,c,...pts)=>{for(const[x,z]of pts)P[L][z][x]=c;};
 // cellar
 R(0,14,9,24,15,'c');R(0,14,17,28,20,'c');R(0,27,12,28,16,'^');S(0,'D',[20,16]);S(0,'=',[17,21],[23,21],[29,19]);
 // ground floor
 R(1,1,1,8,11,'l');R(1,1,13,8,20,'s');R(1,10,1,19,6,'g');R(1,10,8,19,20,'f');R(1,21,1,28,9,'d');R(1,21,11,28,20,'k');R(1,26,12,26,17,'#');R(1,27,17,28,17,'#');R(1,27,12,28,16,'^');R(1,13,8,16,13,'^');
 S(1,'L',[9,9]);S(1,'K',[9,16]);S(1,'D',[11,7],[18,7],[20,4],[20,9],[25,10],[20,17]);S(1,'E',[14,21],[15,21]);
 S(1,'=',[0,3],[0,6],[0,9],[4,0],[0,15],[0,18],[4,21],[11,21],[18,21],[23,0],[26,0],[29,4],[29,7],[29,19],[23,21],[29,13]);
 // upper floor
 R(2,10,1,19,7,'h');R(2,10,8,19,20,'~');R(2,13,8,16,13,'^');R(2,1,1,8,11,'b');R(2,1,13,8,20,'n');R(2,21,1,28,9,'u');R(2,21,11,28,20,'t');R(2,23,12,23,18,'#');R(2,21,11,22,12,'#');R(2,21,13,22,18,'^');
 S(2,'D',[9,4],[4,12],[20,4]);S(2,'P',[25,10]);S(2,'=',[0,3],[0,6],[0,9],[2,0],[0,15],[0,18],[4,21],[12,0],[17,0],[12,21],[17,21],[23,0],[26,0],[29,4],[29,7],[29,14],[29,18]);
 // attic
 R(3,3,4,28,12,'a');R(3,9,4,9,12,'#');R(3,14,6,15,7,'#');R(3,21,13,22,18,'^');S(3,'D',[9,8]);S(3,'=',[2,8],[29,8]);
 return P;}

/* ================= geometry builder: explicit faces, per-vertex shade, merged per material ================= */
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
class GB{constructor(){this.d={};}
 a(k){return this.d[k]||(this.d[k]={p:[],n:[],u:[],c:[]});}
 // quad from origin o along ux (w) and vy (h); normal = ux × vy; cols = [c0,c1] (bottom/top) or 4 corner shades
 face(k,o,ux,vy,w,h,s=1,uo=0,vo=0,cols=[1,1]){const T=this.a(k),n=cross(ux,vy),C=cols.length===4?cols:[cols[0],cols[0],cols[1],cols[1]];
  const pt=(a,b)=>[o[0]+ux[0]*a+vy[0]*b,o[1]+ux[1]*a+vy[1]*b,o[2]+ux[2]*a+vy[2]*b];const Q=[[0,0,0],[w,0,1],[w,h,2],[0,h,3]];
  for(const i of[0,1,2,0,2,3]){const[a,b,ci]=Q[i];const p=pt(a,b);T.p.push(p[0],p[1],p[2]);T.n.push(n[0],n[1],n[2]);T.u.push((uo+a)/s,(vo+b)/s);const c=C[ci];T.c.push(c,c,c);}}
 // arbitrary quad A,B,C,D (counter-clockwise seen from the normal side), uv per corner
 quad(k,A,B,C,D,uv=[[0,0],[1,0],[1,1],[0,1]],col=1){const T=this.a(k);const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[D[0]-A[0],D[1]-A[1],D[2]-A[2]];let n=cross(e1,e2);const l=Math.hypot(...n)||1;n=n.map(v=>v/l);
  const P=[A,B,C,D];for(const i of[0,1,2,0,2,3]){const p=P[i];T.p.push(p[0],p[1],p[2]);T.n.push(n[0],n[1],n[2]);T.u.push(uv[i][0],uv[i][1]);T.c.push(col,col,col);}}
 box(k,x0,y0,z0,x1,y1,z1,s=1,m=63,c0=1,c1=1){if(x0>x1)[x0,x1]=[x1,x0];if(y0>y1)[y0,y1]=[y1,y0];if(z0>z1)[z0,z1]=[z1,z0];const w=x1-x0,h=y1-y0,d=z1-z0,cc=[c0,c1];
  if(m&1)this.face(k,[x1,y0,z1],[0,0,-1],[0,1,0],d,h,s,-z1,y0,cc);if(m&2)this.face(k,[x0,y0,z0],[0,0,1],[0,1,0],d,h,s,z0,y0,cc);
  if(m&4)this.face(k,[x0,y1,z1],[1,0,0],[0,0,-1],w,d,s,x0,-z1,[c1,c1]);if(m&8)this.face(k,[x0,y0,z0],[1,0,0],[0,0,1],w,d,s,x0,z0,[c0,c0]);
  if(m&16)this.face(k,[x0,y0,z1],[1,0,0],[0,1,0],w,h,s,x0,y0,cc);if(m&32)this.face(k,[x1,y0,z0],[-1,0,0],[0,1,0],w,h,s,-x1,y0,cc);}
 geo(k,g,mat,us=1){const T=this.a(k);const G=g.index?g.toNonIndexed():g;G.applyMatrix4(mat);const nm=new THREE.Matrix3().getNormalMatrix(mat);const P=G.attributes.position,N=G.attributes.normal,U=G.attributes.uv;const n=new V();
  for(let i=0;i<P.count;i++){T.p.push(P.getX(i),P.getY(i),P.getZ(i));n.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(nm).normalize();T.n.push(n.x,n.y,n.z);T.u.push(U?U.getX(i)*us:0,U?U.getY(i)*us:0);T.c.push(1,1,1);}}
 build(mats,group){const out=[];for(const k in this.d){const T=this.d[k];if(!T.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(T.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(T.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(T.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(T.c,3));g.computeBoundingSphere();const m=new THREE.Mesh(g,mats[k]||mats.wood);m.name=k;m.receiveShadow=true;m.castShadow=!/^(oak|marble|ktile|stonef|ceil|planksF|shaft|patch|glass|rug)$/.test(k);group.add(m);out.push(m);}return out;}}
const mergeG=gs=>{const o=new THREE.BufferGeometry();for(const[a,k]of[['position',3],['normal',3],['uv',2]]){const f=new Float32Array(gs.reduce((n,g)=>n+g.attributes[a].array.length,0));let i=0;for(const g of gs){f.set(g.attributes[a].array,i);i+=g.attributes[a].array.length;}o.setAttribute(a,new THREE.BufferAttribute(f,k));}o.computeBoundingSphere();return o;};
const M4=new THREE.Matrix4(),Q4=new THREE.Quaternion(),E4=new THREE.Euler();
const mtx=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>M4.compose(new V(x,y,z),Q4.setFromEuler(E4.set(rx,ry,rz)),new V(sx,sy,sz)).clone();

/* ================= furniture catalogue (local coords: back at -z, front facing +z) ================= */
const B=(k,x0,y0,z0,x1,y1,z1,s)=>[k,x0,y0,z0,x1,y1,z1,s];
function legs(p,w,d,h,t=.06,k='dark',i=.05){for(const sx of[-1,1])for(const sz of[-1,1])p.push(B(k,sx*(w/2-i)-t/2,0,sz*(d/2-i)-t/2,sx*(w/2-i)+t/2,h,sz*(d/2-i)+t/2));return p;}
const CAT={
 shelf(w,h=2.9,d=.42){const p=[B('dark',-w/2,0,-d/2,-w/2+.06,h,d/2),B('dark',w/2-.06,0,-d/2,w/2,h,d/2),B('dark',-w/2-.03,h-.08,-d/2-.02,w/2+.03,h,d/2+.04),B('dark',-w/2,0,-d/2,w/2,.14,d/2+.01),B('dark',-w/2,0,-d/2,w/2,h,-d/2+.03)];
  for(let y=.14;y<h-.45;y+=.56){p.push(B('dark',-w/2+.06,y,-d/2,w/2-.06,y+.035,d/2));p.push(B('books',-w/2+.06,y+.035,-d/2+.04,w/2-.06,y+.035+.4,d/2-.07));}return p;},
 table(w,d,h=.78,k='wood'){return legs([B(k,-w/2,h-.05,-d/2,w/2,h,d/2),B('dark',-w/2+.05,h-.16,-d/2+.05,w/2-.05,h-.05,d/2-.05)],w,d,h-.05);},
 cloth(w,d,h=.78){return[...legs([B('dark',-w/2+.05,h-.16,-d/2+.05,w/2-.05,h-.05,d/2-.05)],w,d,h-.05),B('sheet',-w/2-.04,h-.3,-d/2-.04,w/2+.04,h+.01,d/2+.04)];},
 chair(){return legs([B('dark',-.22,.44,-.22,.22,.5,.22),B('dark',-.22,.5,-.24,.22,1.08,-.18),B('cloth',-.19,.5,-.19,.19,.54,.19)],.44,.44,.46,.045);},
 arm(){return[B('cloth',-.45,.12,-.42,.45,.48,.42),B('cloth',-.45,.48,-.42,.45,1.05,-.22),B('cloth',-.45,.48,-.42,-.32,.72,.42),B('cloth',.32,.48,-.42,.45,.72,.42),...legs([],.86,.8,.12,.07)];},
 bed(w,l,posts=1){const p=[B('dark',-w/2,.28,-l/2,w/2,.42,l/2),B('sheet',-w/2+.05,.42,-l/2+.08,w/2-.05,.66,l/2-.05),B('cloth',-w/2-.04,.34,-l/2+.7,w/2+.04,.7,l/2+.04),B('sheet',-w/2+.15,.66,-l/2+.12,w/2-.15,.8,-l/2+.55),
  B('dark',-w/2,0,-l/2,w/2,1.45,-l/2+.08),B('dark',-w/2,.3,l/2-.07,w/2,1.0,l/2)];legs(p,w,l,.3,.08);
  if(posts){for(const sx of[-1,1])for(const sz of[-1,1])p.push(B('dark',sx*w/2-.05,0,sz*l/2-.05,sx*w/2+.05,2.3,sz*l/2+.05));p.push(B('dark',-w/2-.05,2.25,-l/2-.05,w/2+.05,2.35,-l/2+.05),B('dark',-w/2-.05,2.25,l/2-.05,w/2+.05,2.35,l/2+.05),B('dark',-w/2-.05,2.25,-l/2,-w/2+.05,2.35,l/2),B('dark',w/2-.05,2.25,-l/2,w/2+.05,2.35,l/2));
   p.push(B('cloth',-w/2-.07,1.5,-l/2-.07,-w/2-.02,2.3,-l/2+.5),B('cloth',w/2+.02,1.5,-l/2-.07,w/2+.07,2.3,-l/2+.5));}return p;},
 ward(w=1.2,d=.6,h=2.25){return[B('dark',-w/2,0,-d/2,w/2,h,d/2-.02),B('dark',-w/2-.04,h,-d/2-.03,w/2+.04,h+.1,d/2+.04),B('dark',-w/2,0,d/2-.03,w/2,.12,d/2+.02),B('panel',-w/2+.05,.14,d/2-.02,-.01,h-.08,d/2+.01,.9),B('panel',.01,.14,d/2-.02,w/2-.05,h-.08,d/2+.01,.9),B('brass',-.08,1.1,d/2,-.04,1.3,d/2+.04),B('brass',.04,1.1,d/2,.08,1.3,d/2+.04)];},
 dresser(w=1.2,d=.5,h=.95){const p=[B('dark',-w/2,0,-d/2,w/2,h,d/2),B('wood',-w/2-.02,h,-d/2-.02,w/2+.02,h+.04,d/2+.02)];for(let y=.12;y<h-.1;y+=.27)p.push(B('wood',-w/2+.04,y,d/2,w/2-.04,y+.22,d/2+.02),B('brass',-.05,y+.09,d/2+.02,.05,y+.12,d/2+.05));return p;},
 counter(w,d=.62){return[B('dark',-w/2,0,-d/2,w/2,.88,d/2-.03),B('marble',-w/2-.02,.88,-d/2,w/2+.02,.93,d/2+.03),B('panel',-w/2+.04,.1,d/2-.03,w/2-.04,.84,d/2-.01,.8)];},
 crate(s=.7,k='wood'){return[B(k,-s/2,0,-s/2,s/2,s,s/2),B('dark',-s/2-.01,s*.45,-s/2-.01,s/2+.01,s*.55,s/2+.01)];},
 fire(){return[B('stone',-1.15,0,-.5,-.62,1.22,.08),B('stone',.62,0,-.5,1.15,1.22,.08),B('stone',-1.15,.95,-.5,1.15,1.25,.08),B('dark',-1.3,1.22,-.55,1.3,1.33,.16),B('stone',-.95,1.33,-.5,.95,FH,-.12),
  B('black',-.62,0,-.5,.62,.95,-.38),B('stone',-1.25,0,-.5,1.25,.05,.45),B('ember',-.38,.05,-.36,.38,.13,-.12),B('dark',-.4,.12,-.32,.35,.2,-.2),B('metal',-.5,0,-.05,-.46,.32,.0),B('metal',.46,0,-.05,.5,.32,.0)];},
 clock(){return[B('dark',-.3,0,-.22,.3,.25,.22),B('dark',-.24,.25,-.18,.24,1.5,.18),B('dark',-.3,1.5,-.22,.3,2.25,.22),B('dark',-.34,2.25,-.25,.34,2.36,.25),B('glass',-.2,.5,.18,.2,1.35,.19),B('ivory',-.2,1.65,.22,.2,2.05,.23),B('brass',-.04,.6,.17,.04,1.0,.18)];},
 safe(){return[B('iron',-.42,0,-.38,.42,1.0,.36),B('black',-.34,.1,.36,.34,.9,.37),B('iron',-.42,0,.36,-.36,1,.4),B('iron',.36,0,.36,.42,1,.4),B('iron',-.42,0,.36,.42,.08,.4),B('iron',-.42,.92,.36,.42,1,.4)];},
 stove(){return[B('iron',-.7,0,-.35,.7,.9,.35),B('iron2',-.72,.9,-.37,.72,.96,.37),B('iron',-.7,.96,-.35,.7,1.6,-.25),B('ember',-.35,.25,.35,.35,.38,.36),B('black',-.4,.2,.35,.4,.6,.355),B('iron',-.08,1.6,-.33,.08,FH,-.2)];},
 crib(){const p=[B('wood',-.45,.3,-.8,.45,.36,.8),B('sheet',-.42,.36,-.77,.42,.48,.77)];for(const sx of[-1,1])p.push(B('wood',sx*.45-.03,0,-.8,sx*.45+.03,1.0,-.74),B('wood',sx*.45-.03,0,.74,sx*.45+.03,1.0,.8),B('wood',sx*.45-.025,.95,-.8,sx*.45+.025,1.0,.8));
  for(let z=-.7;z<=.71;z+=.12)for(const sx of[-1,1])p.push(B('wood',sx*.45-.012,.36,z-.012,sx*.45+.012,.95,z+.012));for(const sz of[-1,1])for(let x=-.36;x<=.37;x+=.12)p.push(B('wood',x-.012,.36,sz*.77-.012,x+.012,.95,sz*.77+.012));return p;},
 barrel(){return[];},
 rack(w){const p=[B('dark',-w/2,0,-.22,w/2,2.1,-.18)];for(let y=.2;y<2;y+=.36)p.push(B('dark',-w/2,y,-.22,w/2,y+.04,.22));for(let x=-w/2+.15;x<w/2;x+=.22)for(let y=.24;y<2;y+=.36)p.push(B('bottle',x-.04,y,-.16,x+.04,y+.08,.2));return p;},
 bench(w){return[B('dark',-w/2,.25,-.5,w/2,.35,.5),B('dark',-w/2+.08,0,-.4,-w/2+.18,.25,.4),B('dark',w/2-.18,0,-.4,w/2-.08,.25,.4)];},
 sheetShape(w,d,h){return[B('sheet',-w/2,0,-d/2,w/2,h,d/2),B('sheet',-w/2-.06,0,-d/2-.06,w/2+.06,h*.5,d/2+.06)];},
};

/* ================= the house ================= */
export class House{
 constructor(){this.P=plan();this.stairs=STAIRS;this.doors=[];this.doorAt=new Map();this.cols=[[],[],[],[]];this.nav=new Uint8Array(NL*W*H);this.lamps=[];this.glows=[];this.hides=[];this.spots={};this.windows=[];this.anim=[];
  this.prev=new Int32Array(NL*W*H);this.q=new Int32Array(NL*W*H);}
 ch(L,x,z){return L<0||L>=NL||x<0||z<0||x>=W||z>=H?'#':this.P[L][z][x];}
 id(L,x,z){return(L*H+z)*W+x;}
 door(L,x,z){return this.doorAt.get(this.id(L,x,z));}
 solidCell(L,x,z){const c=this.ch(L,x,z);if(SOLID.includes(c)||c==='~')return true;if(DOORS.includes(c)){const d=this.door(L,x,z);return !d||!d.pass;}return false;}
 stairAt(x,z,L){for(const s of this.stairs)if(x>=s.x0&&x<s.x1+1&&z>=s.z0&&z<s.z1+1&&(s.L===L||s.L===L-1))return s;return null;}
 stairH(s,z){return LY[s.L]+FH*Math.min(1,Math.max(0,(s.z1+1-z)/(s.z1+1-s.z0)));}
 groundAt(L,x,z){const s=this.stairAt(x,z,L);return s?this.stairH(s,z):LY[L];}
 // after moving on a stair, which level's grid applies
 levelAt(L,x,y,z){const s=this.stairAt(x,z,L);if(!s)return L;return y-LY[s.L]>FH*.5?s.L+1:s.L;}
 roomKey(L,x,z){x=Math.floor(x);z=Math.floor(z);const c=this.ch(L,x,z);if(ROOMS[c])return c;const s=this.stairAt(x+.5,z+.5,L);if(s)return s.room;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=this.ch(L,x+dx,z+dz);if(ROOMS[n])return n;}return null;}
 roomName(L,x,z){const k=this.roomKey(L,x,z);return k?ROOMS[k].n:'';}
 // circle push-out against walls, closed doors and furniture boxes
 collide(p,r,L){for(let it=0;it<2;it++){const cx=Math.floor(p.x),cz=Math.floor(p.z);for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++){if(!this.solidCell(L,x,z))continue;this._push(p,r,x,z,x+1,z+1);}
  for(const b of this.cols[L])if(p.x>b.x0-r-.1&&p.x<b.x1+r+.1&&p.z>b.z0-r-.1&&p.z<b.z1+r+.1)this._push(p,r,b.x0,b.z0,b.x1,b.z1);}}
 _push(p,r,x0,z0,x1,z1){const nx=Math.max(x0,Math.min(p.x,x1)),nz=Math.max(z0,Math.min(p.z,z1));let dx=p.x-nx,dz=p.z-nz;const d2=dx*dx+dz*dz;if(d2>=r*r)return;
  if(d2<1e-8){const l=p.x-x0,rr=x1-p.x,t=p.z-z0,b=z1-p.z,m=Math.min(l,rr,t,b);if(m===l)p.x=x0-r;else if(m===rr)p.x=x1+r;else if(m===t)p.z=z0-r;else p.z=z1+r;return;}const d=Math.sqrt(d2);p.x=nx+dx/d*r;p.z=nz+dz/d*r;}
 // sight line on one level: walls, windows and closed doors block; the open foyer void does not
 los(L,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,d=Math.hypot(dx,dz),n=Math.ceil(d/.2);for(let i=1;i<n;i++){const t=i/n,x=Math.floor(ax+dx*t),z=Math.floor(az+dz*t);const c=this.ch(L,x,z);if(SOLID.includes(c))return false;if(DOORS.includes(c)){const dd=this.door(L,x,z);if(!dd||!dd.pass)return false;}}return true;}
 /* ---------- navigation (BFS over cells; stair cells belong to their lower level) ---------- */
 walk(L,x,z){const c=this.ch(L,x,z);if(!isOpen(c)||c==='^')return false;if(this.nav[this.id(L,x,z)])return false;if(DOORS.includes(c)){const d=this.door(L,x,z);return d&&!d.locked&&d.lock!=='exit';}return true;}
 _st(L,x,z){for(const s of this.stairs)if(s.L===L&&x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1)return s;return null;}
 _nb(L,x,z,out){out.length=0;const s=this._st(L,x,z);
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;
   if(s){if(nx>=s.x0&&nx<=s.x1&&nz>=s.z0&&nz<=s.z1)out.push(this.id(L,nx,nz));else if(dx===0&&dz===1&&nz===s.z1+1&&this.walk(L,nx,nz))out.push(this.id(L,nx,nz));else if(dx===0&&dz===-1&&nz===s.z0-1&&this.walk(L+1,nx,nz))out.push(this.id(L+1,nx,nz));continue;}
   let t=null;for(const q of this.stairs)if(nx>=q.x0&&nx<=q.x1&&nz>=q.z0&&nz<=q.z1&&(q.L===L||q.L===L-1)){t=q;break;}
   if(t){if(t.L===L&&dz===-1&&z===t.z1+1)out.push(this.id(L,nx,nz));else if(t.L===L-1&&dz===1&&z===t.z0-1)out.push(this.id(t.L,nx,nz));continue;}
   if(this.walk(L,nx,nz))out.push(this.id(L,nx,nz));}return out;}
 node(L,x,z){x=Math.floor(x);z=Math.floor(z);const s=this.stairAt(x+.5,z+.5,L);if(s)L=s.L;return this.id(L,x,z);}
 path(fL,fx,fz,tL,tx,tz){const a=this.node(fL,fx,fz),b=this.node(tL,tx,tz);if(a===b)return[this._pt(b)];const prev=this.prev,q=this.q;prev.fill(-1);prev[a]=a;let h=0,t=0;q[t++]=a;const nb=[];
  while(h<t){const c=q[h++];if(c===b)break;const L=(c/(W*H))|0,z=((c%(W*H))/W)|0,x=c%W;for(const n of this._nb(L,x,z,nb))if(prev[n]<0){prev[n]=c;q[t++]=n;}}
  if(prev[b]<0)return null;const out=[];for(let c=b;c!==a;c=prev[c])out.push(this._pt(c));out.reverse();return this._smooth(fL,fx,fz,out);}
 _pt(c){const L=(c/(W*H))|0,z=((c%(W*H))/W)|0,x=c%W;return{L,x:x+.5,z:z+.5};}
 _smooth(L,x,z,pts){const out=[];let cx=x,cz=z,cL=L,i=0;while(i<pts.length){let j=i;while(j+1<pts.length&&pts[j+1].L===cL&&!this.stairAt(pts[j+1].x,pts[j+1].z,cL)&&this._clear(cL,cx,cz,pts[j+1].x,pts[j+1].z))j++;out.push(pts[j]);cx=pts[j].x;cz=pts[j].z;cL=pts[j].L;i=j+1;}return out;}
 _clear(L,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,d=Math.hypot(dx,dz),n=Math.ceil(d/.25),px=-dz/d*.32,pz=dx/d*.32;for(let i=1;i<=n;i++){const t=i/n;for(const k of[-1,0,1]){const x=Math.floor(ax+dx*t+px*k),z=Math.floor(az+dz*t+pz*k);if(!this.walk(L,x,z)&&!this._st(L,x,z))return false;if(this._st(L,x,z))return false;}}return true;}
 cellsOf(L,key){const out=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(this.P[L][z][x]===key&&this.walk(L,x,z))out.push([x+.5,z+.5]);return out;}

 /* ---------- build everything ---------- */
 build(scene,T,mats){const gb=new GB(),grp=new THREE.Group();this.group=grp;scene.add(grp);this.gb=gb;this.T=T;this.mats=mats;const P=this.P;
  // doors first, so wall faces know where openings are
  for(let L=0;L<NL;L++)for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=P[L][z][x];if(!DOORS.includes(c)||this.door(L,x,z))continue;
   const passZ=SOLID.includes(this.ch(L,x-1,z))||this.ch(L,x-1,z)==='E';const cells=[[x,z]];if(c==='E'){let k=x+1;while(this.ch(L,k,z)==='E'){cells.push([k,z]);k++;}}
   const d={L,x,z,cells,ch:c,passZ,lock:{L:'lib',K:'study',P:'power',E:'exit'}[c]||null,locked:c!=='D',open:false,pass:false,t:0,sign:1};this.doors.push(d);for(const[cx,cz]of cells)this.doorAt.set(this.id(L,cx,cz),d);}
  this._walls(gb);this._floors(gb);this._stairs(gb);this._edges(gb);
  for(const d of this.doors)this._door(d,gb);
  this._furnish(gb);
  this.meshes=gb.build(mats,grp);}
 _wallFrame(L,x,z,dx,dz){// origin of the face (a=0,b=0 at floor), along-wall axis U and outward normal N
  if(dx===1)return{o:[x+1,LY[L],z+1],U:[0,0,-1],N:[1,0,0],uo:-(z+1)};if(dx===-1)return{o:[x,LY[L],z],U:[0,0,1],N:[-1,0,0],uo:z};if(dz===1)return{o:[x,LY[L],z+1],U:[1,0,0],N:[0,0,1],uo:x};return{o:[x+1,LY[L],z],U:[-1,0,0],N:[0,0,-1],uo:-(x+1)};}
 _band(gb,k,f,a0,a1,y0,y1,c0,c1){const o=[f.o[0]+f.U[0]*a0,f.o[1]+y0,f.o[2]+f.U[2]*a0];gb.face(k,o,f.U,[0,1,0],a1-a0,y1-y0,SC[k]||1,f.uo+a0,y0,[c0,c1]);}
 _strip(gb,k,f,a0,a1,y0,y1,dep){const p=(a,y,e)=>[f.o[0]+f.U[0]*a+f.N[0]*e,f.o[1]+y,f.o[2]+f.U[2]*a+f.N[2]*e];const A=p(a0,y0,0),Bp=p(a1,y1,dep);gb.box(k,Math.min(A[0],Bp[0]),A[1],Math.min(A[2],Bp[2]),Math.max(A[0],Bp[0]),Bp[1],Math.max(A[2],Bp[2]),SC[k]||1,63,.8,1);}
 // the vertical stack of a papered wall between a0..a1, clipped to the y ranges given
 _wallStack(gb,f,room,a0,a1,ys=[[0,FH]]){const R=ROOMS[room]||ROOMS.f;for(const[y0,y1]of ys){const seg=(k,b0,b1,c0,c1)=>{const lo=Math.max(b0,y0),hi=Math.min(b1,y1);if(hi>lo+.001)this._band(gb,k,f,a0,a1,lo,hi,c0+(c1-c0)*(lo-b0)/(b1-b0),c0+(c1-c0)*(hi-b0)/(b1-b0));};
   if(R.wain){seg('trim',0,.16,.42,.55);seg('panel',.16,1,.62,.95);seg('trim',1,1.08,.95,.95);seg(R.wall,1.08,FH-.2,1,.82);seg('trim',FH-.2,FH,.75,.6);}
   else if(R.tile){seg('wtile',0,1.5,.5,1);seg('trim',1.5,1.56,1,1);seg(R.wall,1.56,FH,1,.7);}
   else{seg(R.wall,0,.7,.45,.95);seg(R.wall,.7,FH,.95,.7);}}}
 _wallTrims(gb,f,room,a0,a1,below){const R=ROOMS[room]||ROOMS.f;if(!R.wain)return;this._strip(gb,'trim',f,a0,a1,0,.17,.025);this._strip(gb,'trim',f,a0,a1,.99,1.09,.03);if(!below)this._strip(gb,'trim',f,a0,a1,FH-.22,FH,.07);}
 _faceRoom(L,x,z){const c=this.ch(L,x,z);if(ROOMS[c])return c;if(c==='~')return 'f';if(c==='^'){const s=this.stairAt(x+.5,z+.5,L);return s?s.room:'f';}return null;}
 _walls(gb){for(let L=0;L<NL;L++)for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=this.P[L][z][x];if(!SOLID.includes(c))continue;
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,n=this.ch(L,nx,nz);if(SOLID.includes(n))continue;const f=this._wallFrame(L,x,z,dx,dz);
   if(DOORS.includes(n)){const dd=this.door(L,nx,nz);if(dd&&dd.cells.length>1&&dd.cells.some(([cx,cz])=>cx===x&&cz===z))continue;this._band(gb,'trim',f,0,1,0,FH,.6,.8);continue;}
   const room=this._faceRoom(L,nx,nz);if(!room)continue;
   if(c==='=')this._window(gb,L,x,z,f,room,n==='~');else{this._wallStack(gb,f,room,0,1);this._wallTrims(gb,f,room,0,1);}}}}
 _window(gb,L,x,z,f,room,tall){const cellar=L===0,a0=cellar?.2:.18,a1=cellar?.8:.82,sill=cellar?2.55:1.12,head=cellar?3.25:3.0,d=.5;
  this._wallStack(gb,f,room,0,1,[[0,sill],[head,FH]]);this._wallStack(gb,f,room,0,a0,[[sill,head]]);this._wallStack(gb,f,room,a1,1,[[sill,head]]);this._wallTrims(gb,f,room,0,1,cellar);if(!cellar)this._strip(gb,'trim',f,0,1,FH-.22,FH,.07);
  const pt=(a,y,e)=>[f.o[0]+f.U[0]*a-f.N[0]*e,f.o[1]+y,f.o[2]+f.U[2]*a-f.N[2]*e];const Y=[0,1,0],N=f.N,U=f.U,rev=cellar?'stone':'plaster';
  gb.face('trim',pt(a0,sill,d),N,U,d,a1-a0,1,0,0,[.8,.8]);gb.face(rev,pt(a0,head,d),U,N,a1-a0,d,1,0,0,[.7,.7]);gb.face(rev,pt(a0,sill,d),Y,N,head-sill,d,1,0,0,[.7,.7]);gb.face(rev,pt(a1,sill,d),N,Y,d,head-sill,1,0,0,[.7,.7]);
  gb.face('glass',pt(a0,sill,d),U,Y,a1-a0,head-sill,1.6,f.uo*.37+a0,sill*.4);
  const bx=(k,A,Bp)=>gb.box(k,Math.min(A[0],Bp[0]),Math.min(A[1],Bp[1]),Math.min(A[2],Bp[2]),Math.max(A[0],Bp[0]),Math.max(A[1],Bp[1]),Math.max(A[2],Bp[2]),.6);
  const mid=(a0+a1)/2;bx('dark',pt(mid-.025,sill,d-.03),pt(mid+.025,head,d+.02));bx('dark',pt(a0,sill+(head-sill)*.62-.025,d-.03),pt(a1,sill+(head-sill)*.62+.025,d+.02));if(!cellar)bx('dark',pt(a0,sill+(head-sill)*.3-.02,d-.03),pt(a1,sill+(head-sill)*.3+.02,d+.02));
  else for(let a=a0+.1;a<a1;a+=.12)bx('metal',pt(a-.012,sill,.15),pt(a+.012,head,.18));
  if(!cellar){for(const[c0,c1]of[[-.04,a0+.1],[a1-.1,1.04]])for(let i=0;i<3;i++){const s0=c0+(c1-c0)*i/3,s1=c0+(c1-c0)*(i+1)/3;bx('drape',pt(s0,.12,-.05-(i%2)*.05),pt(s1,3.2,-.13-(i%2)*.05));}bx('dark',pt(-.08,3.18,0),pt(1.08,3.42,-.2));}
  // moonlight: a slanted shaft from the glass to the floor plus a soft window-shaped patch where it lands
  const floorY=tall?LY[L-1]:LY[L],k=tall?1.5:1.15,D=[N[0]+U[0]*.18,-k,N[2]+U[2]*.18];const corners=[pt(a0,sill,d-.02),pt(a1,sill,d-.02),pt(a1,head,d-.02),pt(a0,head,d-.02)];
  const proj=c=>{const t=(c[1]-floorY-.02)/k;return[c[0]+D[0]*t,floorY+.02,c[2]+D[2]*t];};const q=corners.map(proj);const[c00,c10,c11,c01]=corners,[q00,q10,q11,q01]=q;
  const S=(A,Bp,C,Dd)=>gb.quad('shaft',A,Bp,C,Dd,[[0,1],[1,1],[1,0],[0,0]]);S(c00,c10,q10,q00);S(c01,c11,q11,q01);S(c00,c01,q01,q00);S(c10,c11,q11,q10);
  {const e1=[q10[0]-q00[0],0,q10[2]-q00[2]],e2=[q01[0]-q00[0],0,q01[2]-q00[2]];if(cross(e1,e2)[1]>0)gb.quad('patch',q00,q10,q11,q01,[[0,1],[1,1],[1,0],[0,0]]);else gb.quad('patch',q00,q01,q11,q10,[[0,1],[0,0],[1,0],[1,1]]);}
  this.windows.push({L,x:pt(.5,0,0)[0],z:pt(.5,0,0)[2],y:LY[L]+(sill+head)/2,N});}
 _floors(gb){for(let L=0;L<NL;L++)for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=this.P[L][z][x];if(SOLID.includes(c))continue;
  const sh=(cx,cz,v)=>{let s=0;for(const[ax,az]of[[cx-1,cz-1],[cx,cz-1],[cx-1,cz],[cx,cz]]){const q=this.ch(L,ax,az);if(SOLID.includes(q)||DOORS.includes(q))s++;}return s?v:1;};
  const isD=DOORS.includes(c);let room=ROOMS[c]?c:null;if(isD){const d=this.door(L,x,z);for(const[dx,dz]of d.passZ?[[0,-1],[0,1]]:[[-1,0],[1,0]]){const r=this.ch(L,x+dx,z+dz);if(ROOMS[r]){room=r;break;}}}
  if(room&&c!=='^'&&c!=='~'){const R=ROOMS[room],y=LY[L];gb.face(R.floor,[x,y,z+1],[1,0,0],[0,0,-1],1,1,SC[R.floor],x,-(z+1),[sh(x,z+1,.5),sh(x+1,z+1,.5),sh(x+1,z,.5),sh(x,z,.5)]);}
  if(isD)continue;const up=L<NL-1?this.P[L+1][z][x]:'#';if(up==='^'||up==='~')continue;const cr=ROOMS[this._faceRoom(L,x,z)]||ROOMS.f,ck=cr.ceil||'ceil',y=LY[L]+FH;
  gb.face(ck,[x,y,z],[1,0,0],[0,0,1],1,1,SC[ck]||2,x,z,[sh(x,z,.4),sh(x+1,z,.4),sh(x+1,z+1,.4),sh(x,z+1,.4)]);}
  // attic rafters and a ridge beam; cellar pipes along the ceiling
  for(let x=3.6;x<28.5;x+=1.5)gb.box('dark',x,LY[3]+FH-.32,4,x+.16,LY[3]+FH,13);gb.box('dark',3,LY[3]+FH-.42,7.9,29,LY[3]+FH-.22,8.1);for(let x=4.5;x<28;x+=4.5)if(x!==9){gb.box('dark',x,LY[3],8.92,x+.14,LY[3]+FH,9.08);this.cols[3].push({x0:x-.05,z0:8.87,x1:x+.19,z1:9.13});}
  for(const z of[9.3,9.5])gb.geo('metal',new THREE.CylinderGeometry(.05,.05,10.6,8),mtx(19.3,LY[0]+FH-.3-(z-9.3),z,0,0,Math.PI/2));gb.geo('metal',new THREE.CylinderGeometry(.07,.07,14,8),mtx(21,LY[0]+FH-.25,20.6,0,0,Math.PI/2));}
 _stairs(gb){for(const s of this.stairs){const n=18,len=s.z1+1-s.z0,dz=len/n,y0=LY[s.L],k=s.grand?'trim':s.L===0?'stone':'planks';
  for(let i=0;i<n;i++){const za=s.z1+1-(i+1)*dz,zb=s.z1+1-i*dz,top=y0+FH*(i+1)/n;gb.box(k,s.x0,y0,za,s.x1+1,top,zb,.8,63,.55,1);gb.box('trim',s.x0,top-.04,zb-.03,s.x1+1,top+.012,zb+.02,.6);
   if(s.grand){gb.box('cloth',s.x0+.7,top,za,s.x1+.3,top+.012,zb+.02,.8);gb.box('cloth',s.x0+.7,top-FH/n,zb+.02,s.x1+.3,top,zb+.032,.8);}}
  const ang=Math.atan2(FH,len),hl=Math.hypot(FH,len);
  for(const x of[s.x0+.06,s.x1+.94]){this.cols[s.L].push({x0:x-.1,z0:s.z0,x1:x+.1,z1:s.z1+1});this.cols[s.L+1].push({x0:x-.1,z0:s.z0,x1:x+.1,z1:s.z1+1});
   if(!s.grand)continue;gb.geo('dark',new THREE.BoxGeometry(.09,.1,hl),mtx(x,y0+FH/2+.95,s.z0+len/2,ang,0,0));for(let i=0;i<n;i++){const zz=s.z1+1-(i+.5)*dz,top=y0+FH*(i+1)/n;gb.box('trim',x-.022,top,zz-.022,x+.022,top+.95-FH/n*.5,zz+.022,.5);}
   gb.box('dark',x-.1,y0,s.z1+.85,x+.1,y0+1.25,s.z1+1.05,.5);gb.geo('brass',new THREE.SphereGeometry(.09,10,8),mtx(x,y0+1.32,s.z1+.95));}}}
 // the upper floor's edge over the double-height foyer: a fascia and a balustrade
 _edges(gb){for(let L=1;L<NL;L++)for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=this.P[L][z][x];if(!isOpen(c)||c==='^')continue;
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){if(this.ch(L,x+dx,z+dz)!=='~')continue;const y=LY[L];const f=this._wallFrame(L,x,z,dx,dz);
   gb.face('trim',[f.o[0],y-.4,f.o[2]],f.U,[0,1,0],1,.4,.6,f.uo,0,[.6,.8]);
   const p=(a,e)=>[f.o[0]+f.U[0]*a-f.N[0]*e,f.o[2]+f.U[2]*a-f.N[2]*e];const A=p(0,.06),Bp=p(1,.14);const bx=(k,y0,y1,A,Bp)=>gb.box(k,Math.min(A[0],Bp[0]),y0,Math.min(A[1],Bp[1]),Math.max(A[0],Bp[0]),y1,Math.max(A[1],Bp[1]),.5);
   bx('dark',y+.94,y+1.02,p(0,.03),p(1,.17));bx('trim',y,y+.08,A,Bp);for(let a=.12;a<1;a+=.25){const q0=p(a-.025,.08),q1=p(a+.025,.12);bx('trim',y+.08,y+.94,q0,q1);}}}}
 _door(d,gb){const L=d.L,y=LY[L],T=this.T,M=this.mats;
  // lintel and architraves for every cell of the opening
  for(const[x,z]of d.cells)for(const[dx,dz]of d.passZ?[[0,1],[0,-1]]:[[1,0],[-1,0]]){const n=this.ch(L,x+dx,z+dz);if(!isOpen(n))continue;const room=this._faceRoom(L,x+dx,z+dz);
   const f=this._wallFrame(L,x,z,dx,dz),R=ROOMS[room]||ROOMS.f,hd=d.ch==='E'?2.95:2.4;this._wallStack(gb,f,room,0,1,[[hd,FH]]);if(R.wain)this._strip(gb,'trim',f,0,1,FH-.22,FH,.07);
   const first=d.cells[0][0]===x&&d.cells[0][1]===z,last=d.cells[d.cells.length-1][0]===x&&d.cells[d.cells.length-1][1]===z;const flip=f.U[0]+f.U[2]<0,lo=flip?last:first,hi=flip?first:last;
   if(lo)this._strip(gb,'dark',f,-.1,.04,0,hd+.12,.05);if(hi)this._strip(gb,'dark',f,.96,1.1,0,hd+.12,.05);this._strip(gb,'dark',f,-.1,1.1,hd,hd+.14,.06);}
  for(const[x,z]of d.cells)gb.box('trim',x,y+(d.ch==='E'?2.95:2.4),z,x+1,y+(d.ch==='E'?2.95:2.4)+.01,z+1,.6,8);
  // the leaf on a hinge pivot
  const piv=new THREE.Group();const g=new THREE.Group();piv.add(g);const ex=d.ch==='E';
  if(ex){d.leaves=[];for(const s of[0,1]){const pv=new THREE.Group();const lf=new THREE.Mesh(new THREE.BoxGeometry(.98,2.9,.1),M.door);lf.position.set(s?-.49:.49,1.45,0);lf.castShadow=true;pv.add(lf);
    for(const yy of[.75,2.05]){const pn=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.03),M.darkO);pn.position.set(s?-.49:.49,yy,.06);pv.add(pn);}const rg=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,6,14),M.brassO);rg.position.set(s?-.1:.1,1.3,.08);pv.add(rg);
    pv.position.set(d.x+(s?2:0),y,d.z+.25);piv.add(pv);d.leaves.push(pv);}this.group.add(piv);d.piv=piv;
   d.sockets=[0,1,2].map(i=>{const m=new THREE.Mesh(new THREE.CircleGeometry(.09,20),new THREE.MeshStandardMaterial({color:0x111111,emissive:0x000000,roughness:.4,metalness:.6}));m.position.set(d.x+.62+i*.38,y+1.75,d.z+.32);piv.add(m);
    const r=new THREE.Mesh(new THREE.TorusGeometry(.11,.02,6,20),M.brassO);r.position.copy(m.position);piv.add(r);return m;});return;}
  const gate=d.lock==='power';const lf=new THREE.Mesh(new THREE.BoxGeometry(.92,2.36,gate?.04:.065),gate?M.ironO:M.door);lf.position.set(.46,1.18,0);lf.castShadow=true;g.add(lf);
  if(gate){lf.visible=false;for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.035,2.3,.035),M.ironO);b.position.set(.08+i*.13,1.17,0);g.add(b);}for(const yy of[.15,1.2,2.25]){const b=new THREE.Mesh(new THREE.BoxGeometry(.92,.06,.05),M.ironO);b.position.set(.46,yy,0);g.add(b);}
   const box=new THREE.Mesh(new THREE.BoxGeometry(.16,.24,.12),M.ironO);box.position.set(.8,1.15,.06);g.add(box);d.led=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.1)}));d.led.position.set(.8,1.22,.13);g.add(d.led);}
  else{// both knobs (and the lock plate) as one shared brass mesh: one draw per door instead of two or three
   if(!this._knobG){const kn=[-1,1].map(s=>new THREE.SphereGeometry(.035,10,8).toNonIndexed().translate(.82,1.0,s*.06));this._knobG=[mergeG(kn),mergeG([...kn,new THREE.BoxGeometry(.06,.16,.08).toNonIndexed().translate(.82,.86,0)])];}
   g.add(new THREE.Mesh(this._knobG[d.locked?1:0],M.brassO));}
  if(d.passZ){piv.position.set(d.x+.04,y,d.z+.5);}else{piv.position.set(d.x+.5,y,d.z+.96);piv.rotation.y=Math.PI/2;}d.base=piv.rotation.y;d.piv=piv;this.group.add(piv);}
 setDoor(d,t){d.t=t;if(d.leaves){d.leaves[0].rotation.y=-t*1.4;d.leaves[1].rotation.y=t*1.4;}else d.piv.rotation.y=d.base+d.sign*t*1.62;d.pass=t>.55;}

 /* ---------- furniture, lamps, hiding places, item spots ---------- */
 piece(L,cx,cz,rot,parts,col=true,nav=true){const gb=this.gb,y=LY[L];const tr=(x,z)=>rot===0?[x,z]:rot===1?[z,-x]:rot===2?[-x,-z]:[-z,x];let bx0=1e9,bz0=1e9,bx1=-1e9,bz1=-1e9;
  for(const[k,x0,y0,z0,x1,y1,z1,s]of parts){const a=tr(x0,z0),b=tr(x1,z1);const X0=cx+Math.min(a[0],b[0]),X1=cx+Math.max(a[0],b[0]),Z0=cz+Math.min(a[1],b[1]),Z1=cz+Math.max(a[1],b[1]);gb.box(k,X0,y+y0,Z0,X1,y+y1,Z1,s||SC[k]||1,63,y0<.05?.6:1,1);
   if(y0<1.2&&k!=='rug'){bx0=Math.min(bx0,X0);bz0=Math.min(bz0,Z0);bx1=Math.max(bx1,X1);bz1=Math.max(bz1,Z1);}}
  if(col&&bx1>bx0){const c=Array.isArray(col)?(()=>{const a=tr(col[0],col[1]),b=tr(col[2],col[3]);return{x0:cx+Math.min(a[0],b[0]),z0:cz+Math.min(a[1],b[1]),x1:cx+Math.max(a[0],b[0]),z1:cz+Math.max(a[1],b[1])};})():{x0:bx0+.02,z0:bz0+.02,x1:bx1-.02,z1:bz1-.02};this.cols[L].push(c);
   if(nav)for(let z=Math.floor(c.z0);z<=Math.floor(c.z1);z++)for(let x=Math.floor(c.x0);x<=Math.floor(c.x1);x++){const ox=Math.min(c.x1,x+1)-Math.max(c.x0,x),oz=Math.min(c.z1,z+1)-Math.max(c.z0,z);if(ox*oz>.3)this.nav[this.id(L,x,z)]=1;}}
  return{L,x:cx,z:cz,rot,fwd:tr(0,1)};}
 lamp(L,x,y,z,kind,o={}){const l={L,x,y:LY[L]+y,z,kind,col:new THREE.Color(o.col??(kind==='fire'?0xff7a30:kind==='candle'?0xff8a38:kind==='moon'?0x6a88ff:0xffc890)),pow:o.pow??(kind==='fire'?9:kind==='candle'?1.3:kind==='chand'?12:3),range:o.range??(kind==='chand'?13:kind==='fire'?7:kind==='candle'?5:8),
  elec:kind==='elec'||kind==='chand',on:o.on??!(kind==='elec'||kind==='chand'),levels:o.levels||[L],ph:Math.random()*99,cur:0,fl:1,broken:o.broken||0};this.lamps.push(l);
  const gl=(gx,gy,gz,sz)=>this.glows.push({x:gx,y:LY[L]+gy,z:gz,size:sz,lamp:l,flame:kind==='candle'||kind==='fire'});
  if(kind==='candle'){const n=o.n||1;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=n>1?.14:0,cx=x+Math.cos(a)*r,cz=z+Math.sin(a)*r;this.gb.geo('wax',new THREE.CylinderGeometry(.022,.025,.16,8),mtx(cx,LY[L]+y-.08,cz));gl(cx,y+.03,cz,.07);}}
  else if(kind==='fire')gl(x,y,z,.9);else if(kind!=='chand'&&kind!=='moon')gl(x,y,z,o.gs||.16);return l;}
 hide(L,x,z,yaw,type,y,ex,ez){this.hides.push({L,x,z,yaw,type,y:LY[L]+y,ex,ez,id:this.hides.length});}
 spot(name,L,x,y,z){this.spots[name]={L,x,y:LY[L]+y,z};}
 picture(L,x,y,z,rot,tex,w=.9,h=.7){const g=new THREE.Group();const fr=new THREE.Mesh(new THREE.BoxGeometry(w+.14,h+.14,.05),this.mats.gilt);g.add(fr);const cv=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.55}));cv.position.z=.03;g.add(cv);
  g.position.set(x,LY[L]+y,z);g.rotation.y=rot*Math.PI/2;this.group.add(g);return g;}
 _furnish(gb){const C=CAT,p=(...a)=>this.piece(...a),T=this.T;
  // ======== GROUND FLOOR ========
  // library
  for(const x of[2,4,6,8])p(1,x,1.22,0,C.shelf(2));for(const z of[2.5,4.5,6.5])p(1,8.78,z,3,C.shelf(2));p(1,1.22,11,1,C.shelf(1.6));
  p(1,4.5,11.58,2,C.fire());this.lamp(1,4.5,.35,11.75,'fire');p(1,4.5,6,0,C.table(2.4,1.2));for(const[x,z,r]of[[3.6,5,0],[5.4,5,0],[3.6,7,2],[5.4,7,2]])p(1,x,z,r,C.chair(),true,false);
  p(1,3,9.9,0,C.arm());p(1,6.1,9.9,0,C.arm());p(1,4.5,6,0,[B('rug',-2,0,-1.8,2,.012,1.8,4)],false);this.lamp(1,4.0,.86,6.1,'candle',{n:3});gb.geo('brass',new THREE.CylinderGeometry(.08,.11,.06,10),mtx(4,.81,6.1));
  this.spot('fuseA',1,5.4,.8,6.2);this.spot('hint',1,3.3,.8,5.8);this.spot('bat_lib',1,6.1,1.36,11.75);gb.geo('brass',new THREE.SphereGeometry(.2,14,10),mtx(1.7,1.05,2.6));p(1,1.7,2.6,0,[B('dark',-.04,0,-.04,.04,.85,.04)]);
  // study
  p(1,4.5,15.2,0,C.table(1.8,.9,.78,'dark'));p(1,4.5,14.4,0,C.chair(),true,false);p(1,2.2,13.22,0,C.shelf(2.2));p(1,6.4,13.22,0,C.shelf(1.6,2.2));p(1,1.95,20.55,2,C.safe());p(1,8.66,18.6,3,C.ward(1.2,.62));this.hide(1,8.3,18.6,Math.PI/2,'wardrobe',1.55,7.6,18.6);
  p(1,5.6,18.6,2,C.arm());p(1,4.6,17.6,0,[B('rug',-2,0,-1.6,2,.012,1.6,3.6)],false);this.lamp(1,5.2,1.18,15.3,'elec',{col:0x9affb0,pow:4,range:5});gb.geo('brass',new THREE.CylinderGeometry(.015,.015,.36,6),mtx(5.2,.96,15.3));gb.geo('shadeG',new THREE.CylinderGeometry(.06,.16,.14,12,1,true),mtx(5.2,1.18,15.3));
  this.spot('safe',1,1.95,.5,20.1);this.spot('bat_study',1,3.9,.8,15.1);
  // portrait gallery: four rotating portraits, the hidden niche between them, candle sconces
  this.portraits=[11.8,13.6,16.4,18.2].map((x,i)=>{const g=this.picture(1,x,2.05,1.07,0,portraitTex(i),.82,1.04);this.gb.box('brass',x-.16,LY[1]+1.3,1.0,x+.16,LY[1]+1.38,1.06);return{g,x,z:1.1,L:1,rot:0,ang:0};});
  {const np=new THREE.Mesh(new THREE.BoxGeometry(.86,1.2,.06),this.mats.panelM);np.position.set(15,1.8,1.03);this.group.add(np);const back=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.1),this.mats.velvet);back.position.set(15,1.8,1.002);this.group.add(back);this.niche={panel:np,y0:1.8,t:0};gb.box('dark',14.5,1.15,1,15.5,1.2,1.25);}
  this.spot('bone',1,15,1.55,1.12);this.lamp(1,12.5,2.15,6.8,'candle');this.lamp(1,17.5,2.15,6.8,'candle');for(const x of[12.5,17.5])gb.box('brass',x-.06,2.0,6.86,x+.06,2.1,7);
  p(1,15,4.2,1,C.bench(2.2));for(const x of[10.6,19.4]){p(1,x,3.5,0,[B('marble',-.25,0,-.25,.25,1.1,.25)]);gb.geo('ivory',new THREE.SphereGeometry(.17,12,10),mtx(x,1.32,3.5,0,0,0,1,1.2,1));gb.geo('ivory',new THREE.CylinderGeometry(.1,.2,.2,10),mtx(x,1.18,3.5));}
  this.spot('bat_gal',1,15.4,.37,4.2);
  // grand foyer
  this.lamp(1,15,5.6,16,'chand',{levels:[1,2]});{const y=5.6;gb.geo('brass',new THREE.TorusGeometry(.75,.035,6,28),mtx(15,y,16,Math.PI/2));gb.geo('brass',new THREE.TorusGeometry(.4,.03,6,20),mtx(15,y+.35,16,Math.PI/2));gb.geo('brass',new THREE.CylinderGeometry(.012,.012,FH*2-y,4),mtx(15,(y+FH*2)/2,16));
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2,bx=15+Math.cos(a)*.75,bz=16+Math.sin(a)*.75;gb.geo('wax',new THREE.CylinderGeometry(.03,.03,.14,6),mtx(bx,y+.08,bz));this.glows.push({x:bx,y:y+.2,z:bz,size:.12,lamp:this.lamps[this.lamps.length-1],flame:false});}
   for(let i=0;i<14;i++){const a=i/14*Math.PI*2;gb.geo('crystal',new THREE.OctahedronGeometry(.04),mtx(15+Math.cos(a)*.6,y-.18,16+Math.sin(a)*.6,0,0,0,1,2,1));}}
  p(1,10.3,11.5,1,C.clock());this.clockPos=new V(10.5,1.5,11.5);p(1,19.62,10.8,3,C.table(1.4,.45,.86,'dark'));this.lamp(1,19.62,1.03,10.8,'candle',{n:3});gb.geo('brass',new THREE.CylinderGeometry(.03,.09,.16,8),mtx(19.62,.94,10.8));
  p(1,10.38,18,1,C.table(1.4,.45,.86,'dark'));this.spot('intro',1,10.4,.87,18.2);p(1,15,17.5,0,[B('cloth',-.95,0,-3.2,.95,.012,3.4,2)],false);
  for(const x of[11.8,18.2]){p(1,x,14.6,0,[B('stone',-.28,0,-.28,.28,.75,.28)]);gb.geo('dark',new THREE.ConeGeometry(.3,.5,7),mtx(x,.95,14.6));for(let i=0;i<5;i++)gb.geo('dark',new THREE.CylinderGeometry(.008,.015,.7,4),mtx(x+Math.cos(i)*.1,1.3,14.6+Math.sin(i)*.1,Math.sin(i*3)*.5,0,Math.cos(i*2)*.5));}
  p(1,18.9,20.4,0,[B('dark',-.03,0,-.03,.03,1.8,.03),B('dark',-.25,0,-.25,.25,.04,.25)]);gb.geo('cloth',new THREE.CylinderGeometry(.12,.25,1,8,1,true),mtx(18.9,1.2,20.4));
  this.picture(1,9.07,2.2,15,1,paintingTex(0),1.2,.9);this.picture(1,19.93,2.2,15,3,paintingTex(1),1.2,.9);this.picture(1,9.07,5.6,12,1,paintingTex(2),1.6,1.2);this.picture(1,19.93,5.6,12,3,paintingTex(3),1.6,1.2);
  // dining room
  p(1,25,5.5,0,C.cloth(4.6,1.6));for(let i=0;i<4;i++)for(const s of[-1,1])p(1,23.3+i*1.15,5.5+s*1.05,s>0?2:0,C.chair(),true,false);p(1,22.2,5.5,1,C.chair(),true,false);p(1,27.8,5.5,3,C.chair(),true,false);
  this.lamp(1,24,.95,5.5,'candle',{n:3});gb.geo('brass',new THREE.CylinderGeometry(.03,.1,.18,8),mtx(24,.86,5.5));gb.geo('brass',new THREE.CylinderGeometry(.03,.1,.18,8),mtx(26.2,.86,5.5));for(let i=0;i<3;i++)gb.geo('wax',new THREE.CylinderGeometry(.022,.025,.14,8),mtx(26.2+Math.cos(i*2.1)*.14,.98,5.5+Math.sin(i*2.1)*.14));
  p(1,22.5,9.72,2,C.dresser(2,.52,.92));this.spot('libkey',1,22.2,.97,9.65);p(1,24.8,1.3,0,[...C.shelf(1.5,2.4,.5).map(b=>b[0]==='books'?['china',...b.slice(1)]:b)]);this.spot('bat_din',1,27.5,.97,9.6);p(1,27.5,9.72,2,C.dresser(1.2,.5,.92));
  this.picture(1,28.93,2.3,5.5,3,paintingTex(4),1.4,1);
  // kitchen
  p(1,23.4,20.66,2,C.counter(4.8));p(1,21.34,14.6,1,C.counter(2));p(1,21.4,12.6,1,C.stove());this.lamp(1,21.8,.32,12.6,'fire',{pow:3,range:4});p(1,23.9,15,0,C.table(1.6,1,.9,'wood'));
  this.lamp(1,23.9,2.75,15,'elec',{pow:1.8,range:7,broken:1});gb.geo('metal',new THREE.CylinderGeometry(.006,.006,.8,4),mtx(23.9,3.2,15));gb.geo('shade',new THREE.ConeGeometry(.24,.18,14,1,true),mtx(23.9,2.85,15));
  for(let i=0;i<5;i++)gb.geo('metal',new THREE.CylinderGeometry(.11,.09,.12,10),mtx(23.3+i*.32,2.15,15));gb.box('metal',23.1,2.32,14.98,24.7,2.36,15.02);
  p(1,27.9,20.62,2,C.ward(1.5,.7,2.3));this.hide(1,27.9,20.22,0,'cupboard',1.55,27.9,19.3);p(1,22.4,11.22,0,C.shelf(1.4,2.2,.4).map(b=>b[0]==='books'?['jars',...b.slice(1)]:b));
  this.spot('n1',1,23.6,.92,15.2);this.spot('bat_kit',1,22.2,.95,20.5);
  // ======== CELLAR ========
  p(0,16,10.1,0,[B('iron',-1.2,0,-.9,1.2,1.7,.9),B('iron2',-1,1.7,-.7,1,2.1,.7),B('ember',-.5,.3,.9,.5,.65,.92),B('iron',-.15,2.1,-.15,.15,FH,.15)]);this.lamp(0,16,.55,11.3,'fire',{pow:8,range:7});
  this.fusebox={L:0,x:20.5,y:LY[0]+1.55,z:9.1};gb.box('iron',19.95,LY[0]+1.05,9,21.05,LY[0]+2.05,9.22);gb.box('metal',20,LY[0]+.4,9,20.08,LY[0]+FH,9.08);
  p(0,24.2,9.42,0,C.table(1.8,.8,.92,'dark'));this.lamp(0,23.6,1.12,9.4,'candle',{col:0xffb060,pow:3.5});gb.box('metal',23.5,LY[0]+.92,9.3,23.7,LY[0]+1.0,9.5);this.spot('studykey',0,24.6,.95,9.4);
  p(0,18.5,20.72,2,C.rack(5));for(const[x,z]of[[25,19.3],[26,19.6],[25.6,18.4],[15,17.6]]){gb.geo('wood',new THREE.CylinderGeometry(.34,.34,.95,12),mtx(x,LY[0]+.48,z));gb.geo('metal',new THREE.CylinderGeometry(.35,.35,.05,12),mtx(x,LY[0]+.2,z));gb.geo('metal',new THREE.CylinderGeometry(.35,.35,.05,12),mtx(x,LY[0]+.78,z));this.cols[0].push({x0:x-.34,z0:z-.34,x1:x+.34,z1:z+.34});}
  p(0,14.42,19,1,C.ward(1.2,.62));this.hide(0,14.78,19,-Math.PI/2,'cupboard',1.55,15.5,19);p(0,22.6,9.3,0,C.shelf(1.4,2.2,.4).map(b=>b[0]==='books'?['jars',...b.slice(1)]:b));for(const[x,z]of[[23.5,13.7],[22.8,14.4],[14.8,14.5]])p(0,x,z,0,C.crate(.8));
  this.lamp(0,19,3.1,12.5,'elec',{pow:3.5});this.lamp(0,21.5,3.1,18.5,'elec',{pow:3.5,broken:1});for(const[x,z]of[[19,12.5],[21.5,18.5]])gb.geo('metal',new THREE.CylinderGeometry(.005,.005,.4,4),mtx(x,LY[0]+3.4,z));
  this.spot('n3',0,15,.98,17.6);this.spot('bat_cel',0,26,1.0,19.6);
  // ======== UPPER FLOOR ========
  // landing
  p(2,15,1.3,0,C.table(1.6,.5,.86,'dark'));this.lamp(2,14.5,1.03,1.3,'candle');for(const x of[11.5,18.5]){this.lamp(2,x,2.3,1.12,'elec',{pow:2.5,range:6});gb.geo('shade',new THREE.CylinderGeometry(.06,.12,.16,10,1,true),mtx(x,LY[2]+2.3,1.12));}
  this.picture(2,10.07,2.1,4,1,paintingTex(5));this.picture(2,19.93,2.1,2,3,paintingTex(6));this.spot('bat_hall',2,15.6,.87,1.3);this.glimpse={L:2,x:18.6,z:4};
  // master bedroom
  p(2,5.3,2.3,0,C.bed(2,2.4));this.hide(2,5.3,3.0,Math.PI,'bed',.22,5.3,4.3);p(2,3.5,1.3,0,C.dresser(.5,.42,.62));this.lamp(2,3.5,.8,1.25,'candle');this.spot('n2',2,3.6,.64,1.3);
  p(2,8.62,7.3,3,C.ward(1.3,.62));this.hide(2,8.27,7.3,Math.PI/2,'wardrobe',1.55,7.6,7.3);p(2,1.3,8.5,1,C.dresser(1.4,.5,.95));this.picture(2,1.07,2.2,8.5,1,paintingTex(7),.7,.9);p(2,5,6.8,0,[B('rug',-1.6,0,-1.2,1.6,.012,1.2,3)],false);
  // nursery
  p(2,6,15.5,0,C.crib());p(2,7.4,19.6,3,C.bed(1,1.9,0));this.hide(2,6.9,19.6,Math.PI/2,'bed',.2,5.9,19.6);p(2,2,19.8,0,[B('wood',-.5,0,-.3,.5,.5,.3),B('dark',-.52,.5,-.32,.52,.56,.32)]);this.spot('fuseB',2,2,.58,19.8);
  this.musicBox={L:2,x:2.2,y:LY[2]+.62,z:14};p(2,2.2,14,0,C.table(.6,.5,.55,'wood'));gb.box('wood',2.05,LY[2]+.55,13.92,2.35,LY[2]+.66,14.08);
  {const x=4.6,z=17.8,y=LY[2];gb.geo('wood',new THREE.TorusGeometry(.5,.03,6,16,Math.PI),mtx(x,y+.5,z-.18,Math.PI,0,0,1,.4,1));gb.geo('wood',new THREE.TorusGeometry(.5,.03,6,16,Math.PI),mtx(x,y+.5,z+.18,Math.PI,0,0,1,.4,1));gb.box('wood',x-.3,y+.38,z-.12,x+.3,y+.58,z+.12);gb.geo('wood',new THREE.BoxGeometry(.14,.3,.12),mtx(x+.32,y+.7,z,0,0,-.4));
   this.cols[2].push({x0:x-.5,z0:z-.2,x1:x+.5,z1:z+.2});}
  for(let i=0;i<6;i++)gb.box(['cloth','wood','sheet','dark'][i%4],3+i*.31,LY[2],16.5+(i%2)*.4,3.18+i*.31,LY[2]+.18,16.68+(i%2)*.4);this.spot('bat_nur',2,6.2,.5,15.5);
  // guest room
  p(2,26,2.3,0,C.bed(1.8,2.3));this.hide(2,26,3.0,Math.PI,'bed',.22,26,4.3);p(2,21.38,6.8,1,C.ward(1.3,.62));this.hide(2,21.74,6.8,-Math.PI/2,'wardrobe',1.55,22.5,6.8);p(2,27.2,8.3,2,C.table(1.4,.6,.78,'dark'));p(2,27.2,7.6,2,C.chair(),true,false);
  this.lamp(2,27.6,1.1,8.4,'elec',{pow:2.0,range:5});gb.geo('shade',new THREE.CylinderGeometry(.08,.17,.2,12,1,true),mtx(27.6,LY[2]+1.1,8.4));gb.geo('brass',new THREE.CylinderGeometry(.015,.015,.3,6),mtx(27.6,LY[2]+.9,8.4));this.spot('bat_guest',2,26.8,.8,8.3);
  // servants' stair room
  p(2,27.4,11.22,0,C.shelf(1.8,2.2,.4).map(b=>b[0]==='books'?['sheet',...b.slice(1)]:b));for(const[x,z]of[[27.7,15],[27.5,16.1],[25,19.9]])p(2,x,z,0,C.crate(.7));this.lamp(2,25.5,3.0,15.5,'elec',{pow:3.0});this.spot('bat_srv',2,27.6,.73,15);
  // ======== ATTIC ========
  for(const[x,z,r,w,d,h]of[[12,5,0,1.4,.8,1.1],[17,11.4,0,1.6,.9,.9],[19,5,0,1.2,1.2,1.5],[25,5,1,.9,2.2,.8],[27.5,10.5,0,.8,.8,1.7]])p(3,x,z,r,C.sheetShape(w,d,h));for(const[x,z]of[[13,10.5],[13.7,11.4],[24,8.5],[26,6.5]])p(3,x,z,0,C.crate(.75));
  p(3,25.6,11.6,0,[B('dark',-.6,0,-.35,.6,.6,.35),B('metal',-.62,.55,-.37,.62,.6,.37)]);this.spot('bat_att',3,25.6,.62,11.6);
  p(3,5.5,8.5,0,C.table(1.4,.8,.85,'dark'));this.lamp(3,5.0,.93,8.3,'candle',{n:3,pow:4});this.lamp(3,6.1,.93,8.7,'candle',{n:2,pow:2});this.spot('salt',3,5.5,.92,8.5);this.spot('n4',3,5.9,.86,8.2);
  gb.geo('chalk',new THREE.RingGeometry(1.3,1.36,40),mtx(5.5,LY[3]+.012,8.5,-Math.PI/2));gb.geo('chalk',new THREE.RingGeometry(1.0,1.03,40),mtx(5.5,LY[3]+.012,8.5,-Math.PI/2));
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,x=5.5+Math.cos(a)*1.6,z=8.5+Math.sin(a)*1.6;if(x>3.3&&x<8.6&&z>4.3&&z<12.6){gb.geo('ivory',new THREE.SphereGeometry(.08,8,6),mtx(x,LY[3]+.48,z));gb.box('cloth',x-.07,LY[3],z-.05,x+.07,LY[3]+.4,z+.05);}}
  this.lamp(3,18,3.0,8,'elec',{pow:3.5,range:9});{const x=10.5,z=7.5;gb.box('dark',x-.04,LY[3],z-.04,x+.04,LY[3]+1.2,z+.04);gb.geo('sheet',new THREE.CylinderGeometry(.18,.24,.75,10),mtx(x,LY[3]+1.5,z));gb.geo('sheet',new THREE.SphereGeometry(.11,10,8),mtx(x,LY[3]+1.95,z));this.cols[3].push({x0:x-.25,z0:z-.25,x1:x+.25,z1:z+.25});}
  // start, roam points
  this.start={L:1,x:15,z:19.6,yaw:0};}
}
