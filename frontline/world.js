// FRONTLINE OPS — level geometry (collision boxes, hitscan raycasts, nav grid + A*, cover points) and scene construction
// (merged architecture with trims/windows/roofs, instanced props + vehicles + trees, terrain, water, sky).
import * as THREE from '../vendor/three.module.min.js';

export const STEP=.5,MANTLE=1.3;
const V=THREE.Vector3,PI=Math.PI;
// prop footprints [w (x), h, d (z)] at rot 0; vehicles face +z. h=0 or w=0 -> no collision
export const PROPS={crate:[1.2,1.2,1.2],crateS:[.8,.8,.8],crateL:[2.2,1.1,1.1],barrel:[.62,.92,.62],pallet:[1.2,.16,1],truck:[2.5,3.1,7.4],jeep:[2.1,1.9,4.6],car:[1.85,1.45,4.4],pickup:[2,1.85,5.2],wreck:[1.85,1.3,4.4],tanker:[2.5,3,8],forklift:[1.3,2.2,2.8],
 tree:[.5,7,.5],pine:[.6,9,.6],palm:[.5,8,.5],rock:[1.6,1.1,1.6],bush:[0,0,0],shrub:[0,0,0],lamp:[.25,5.5,.25],stall:[2.6,.95,1.6],dumpster:[1.9,1.4,1.2],gen:[2.2,1.5,1.2],dish:[1.6,3,1.6],barrier:[3,.9,.62],bollard:[.32,.8,.32],
 fueltank:[3.2,3.6,3.2],ac:[0,0,0],watertank:[0,0,0],cafe:[1.2,.75,1.2],bench:[1.8,.5,.55],cone:[0,0,0],heli:[0,0,0],tires:[1.1,.8,1.1],cable:[1.8,1.1,1.8]};

export class Level{
 constructor(o){Object.assign(this,{boxes:[],props:[],lamps:[],roads:[],pads:[],windows:[],blds:[],roofs:[],awnings:[],fences:[],wires:[],signs:[],spawns:{a:[],b:[]},pts:{},flags:[],grass:[],noGrass:[],paint:[],decor:[]},o);}
 box(x0,z0,x1,z1,h,o={}){if(x0>x1)[x0,x1]=[x1,x0];if(z0>z1)[z0,z1]=[z1,z0];const y0=o.y0||0;const b={x0,y0,z0,x1,y1:y0+h,z1,mat:o.mat||'concrete',solid:o.solid!==false,col:o.col??null,vis:o.vis!==false,pass:!!o.pass,ao:o.ao!==false,uvs:o.uvs};this.boxes.push(b);return b;}
 boxC(cx,cz,w,d,h,o){return this.box(cx-w/2,cz-d/2,cx+w/2,cz+d/2,h,o);}
 wall(x0,z0,x1,z1,h,t=.3,o={}){if(Math.abs(z1-z0)<Math.abs(x1-x0))return this.box(x0,z0-t/2,x1,z0+t/2,h,o);return this.box(x0-t/2,z0,x0+t/2,z1,h,o);}
 wallGaps(x0,z0,x1,z1,h,gaps=[],t=.3,o={},dh=2.3){const horiz=Math.abs(z1-z0)<Math.abs(x1-x0);const a=horiz?Math.min(x0,x1):Math.min(z0,z1),b=horiz?Math.max(x0,x1):Math.max(z0,z1);
  const gs=gaps.map(([c,w])=>[a+c-w/2,a+c+w/2]).sort((p,q)=>p[0]-q[0]);let cur=a;const seg=(s,e)=>{if(e-s<.05)return;horiz?this.wall(s,z0,e,z0,h,t,o):this.wall(x0,s,x0,e,h,t,o);};
  for(const[s,e]of gs){seg(cur,s);if(h>dh+.05)horiz?this.box(s,z0-t/2,e,z0+t/2,h-dh,{...o,y0:dh}):this.box(x0-t/2,s,x0+t/2,e,h-dh,{...o,y0:dh});cur=e;}seg(cur,b);return gs;}
 // building: walls with doors {n,s,e,w: [[offset,width],...]}, roof, windows, trims. o.roof: 'flat' | 'pitched' | 'dome' | false
 building(x0,z0,x1,z1,h,o={}){const m=o.mat||'plaster',t=.3,d=o.doors||{},col=o.col??0xe8e0d0,mo={mat:m,col};const trim=o.trim??0xd8d0c4;
  const dh=o.dh||2.3;this.wallGaps(x0,z0,x1,z0,h,d.n||[],t,mo,dh);this.wallGaps(x0,z1,x1,z1,h,d.s||[],t,mo,dh);this.wallGaps(x0,z0,x0,z1,h,d.w||[],t,mo,dh);this.wallGaps(x1,z0,x1,z1,h,d.e||[],t,mo,dh);
  const roof=o.roof??'flat';
  if(roof){this.box(x0-.2,z0-.2,x1+.2,z1+.2,.3,{y0:h,mat:'roof',vis:roof!=='pitched'});
   if(roof==='flat'&&o.parapet!==false){const p=.6,pm={mat:m,col};this.box(x0-.2,z0-.2,x1+.2,z0+.08,p,{y0:h+.3,...pm});this.box(x0-.2,z1-.08,x1+.2,z1+.2,p,{y0:h+.3,...pm});this.box(x0-.2,z0+.08,x0+.08,z1-.08,p,{y0:h+.3,...pm});this.box(x1-.08,z0+.08,x1+.2,z1-.08,p,{y0:h+.3,...pm});
    // cap
    this.box(x0-.28,z0-.28,x1+.28,z1+.28,.08,{y0:h+.9,mat:'trim',col:trim,solid:false});}
   if(roof==='pitched')this.roofs.push({x0:x0-.45,z0:z0-.45,x1:x1+.45,z1:z1+.45,y:h+.05,col,mat:m,rcol:o.rcol});
   if(roof==='dome')this.props.push({kind:'dome',x:(x0+x1)/2,z:(z0+z1)/2,y:h+.3,rot:0,s:Math.min(x1-x0,z1-z0)*.36,col});}
  // interior floor
  this.box(x0+.15,z0+.15,x1-.15,z1-.15,.04,{mat:o.floor||'tile',solid:false,col:o.fcol??0xd8cfc0,ao:false});
  // plinth + cornice band (visual)
  const pl=o.plinth??0x8a8278;this.box(x0-.06,z0-.06,x1+.06,z1+.06,.5,{mat:'concrete',col:pl,solid:false,cut:true});
  if(roof!=='pitched')this.box(x0-.12,z0-.12,x1+.12,z1+.12,.22,{y0:h-.22,mat:'trim',col:trim,solid:false});
  // floor bands on tall buildings
  for(let y=3.2;y<h-1;y+=3.2)this.box(x0-.05,z0-.05,x1+.05,z1+.05,.12,{y0:y,mat:'trim',col:trim,solid:false});
  // windows + sills (visual)
  const lit=o.lit??.35,floors=Math.max(1,Math.floor(h/3.2)),wv=o.win??0,dens=o.dens??.8;
  for(let f=0;f<floors;f++){const wy=1.1+f*3.2;if(wy+1.4>h)break;
   for(const[side,a0,a1]of[['n',x0,x1],['s',x0,x1],['w',z0,z1],['e',z0,z1]]){const len=a1-a0,n=Math.floor(len/2.8);for(let k=0;k<n;k++){const c=a0+(k+.5)*len/n;const gaps=d[side]||[];if(f===0&&gaps.some(([g,w])=>Math.abs(a0+g-c)<w/2+.8))continue;if(this.rnd()>dens)continue;
    const x=side==='w'?x0:side==='e'?x1:c,z=side==='n'?z0:side==='s'?z1:c;const v=this.rnd()<lit?3:(o.shut!=null&&this.rnd()<.6?o.shut:wv);this.windows.push({side,x,z,y:wy,v});
    const o2=.16,sx=side==='w'?-1:side==='e'?1:0,sz=side==='n'?-1:side==='s'?1:0;// sill
    if(sz)this.box(c-.62,z+sz*o2-.07,c+.62,z+sz*o2+.07,.07,{y0:wy-.06,mat:'trim',col:trim,solid:false});else this.box(x+sx*o2-.07,c-.62,x+sx*o2+.07,c+.62,.07,{y0:wy-.06,mat:'trim',col:trim,solid:false});}}}
  // door frames
  for(const side of['n','s','w','e'])for(const[g,w]of(d[side]||[])){const along=side==='n'||side==='s',c=(along?x0:z0)+g,pz=side==='n'?z0:side==='s'?z1:0,px=side==='w'?x0:side==='e'?x1:0,tm={mat:'trim',col:o.dcol??0x4a3a2a,solid:false};
   if(along){this.box(c-w/2-.12,pz-.2,c-w/2,pz+.2,dh+.12,tm);this.box(c+w/2,pz-.2,c+w/2+.12,pz+.2,dh+.12,tm);this.box(c-w/2-.12,pz-.2,c+w/2+.12,pz+.2,.14,{...tm,y0:dh});}
   else{this.box(px-.2,c-w/2-.12,px+.2,c-w/2,dh+.12,tm);this.box(px-.2,c+w/2,px+.2,c+w/2+.12,dh+.12,tm);this.box(px-.2,c-w/2-.12,px+.2,c+w/2+.12,.14,{...tm,y0:dh});}}
  // awnings
  if(o.awn)for(const[side,off,w,c]of o.awn)this.awnings.push({side,x0,z0,x1,z1,off,w,col:c,y:2.55});
  // roof clutter on flat roofs
  if(roof==='flat'&&o.clutter!==false){const n=Math.max(1,Math.floor((x1-x0)*(z1-z0)/40));for(let i=0;i<n;i++){const r=this.rnd();const kind=r<.45?'ac':r<.75?'watertank':'dish';this.props.push({kind,x:x0+1.2+this.rnd()*(x1-x0-2.4),z:z0+1.2+this.rnd()*(z1-z0-2.4),y:h+.3,rot:(this.rnd()*4|0)*PI/2,s:kind==='dish'?.45:1,col:null});}}
  if(o.light)this.lamps.push({x:(x0+x1)/2,y:Math.min(h-.4,3),z:(z0+z1)/2,light:true,inside:true,col:o.lightCol||0xffc890});
  this.blds.push({x0,z0,x1,z1,h});}
 prop(kind,x,z,rot=0,o={}){const q=Math.round(rot/(PI/2))&3,f=PROPS[kind];let[w,h,d]=f;if(o.s){w*=o.s;h*=o.s;d*=o.s;}if(q&1)[w,d]=[d,w];const y0=o.y0||0;
  this.props.push({kind,x,z,y:y0,rot:o.free?rot:q*PI/2+(o.jit??0),col:o.col,s:o.s||1});if(w>0&&h>0&&o.solid!==false)this.box(x-w/2,z-d/2,x+w/2,z+d/2,h,{y0,vis:false,mat:kind,pass:kind==='bush'});}
 lamp(x,z,rot=0,light=true,col){this.lamps.push({x,z,rot,light,col});this.box(x-.12,z-.12,x+.12,z+.12,5.4,{vis:false,mat:'lamp'});}
 sandbags(x0,z0,x1,z1,h=1.05){return this.wall(x0,z0,x1,z1,h,.7,{mat:'sandbag',col:0xffffff});}
 hesco(x0,z0,x1,z1,h=2.1){return this.wall(x0,z0,x1,z1,h,1.1,{mat:'hesco',col:0xffffff});}
 // chain-link fence: blocks movement, not bullets
 fence(x0,z0,x1,z1,h=2.4){this.fences.push({x0,z0,x1,z1,h});const b=this.wall(x0,z0,x1,z1,h,.08,{mat:'fence',vis:false,pass:true});return b;}
 container(cx,cz,rotZ,col,y0=0){const L=6.06,W=2.44,H=2.59;const b=rotZ?this.box(cx-W/2,cz-L/2,cx+W/2,cz+L/2,H,{y0,mat:'metal',col}):this.box(cx-L/2,cz-W/2,cx+L/2,cz+W/2,H,{y0,mat:'metal',col});
  const fc=0x2a2a2a,o={mat:'trim',col:new THREE.Color(col).multiplyScalar(.55).getHex(),solid:false},e=.05;
  for(const[x,z]of[[b.x0,b.z0],[b.x1,b.z0],[b.x0,b.z1],[b.x1,b.z1]])this.box(x-.13,z-.13,x+.13,z+.13,H+.02,{...o,y0:y0-.01});
  this.box(b.x0-e,b.z0-e,b.x1+e,b.z1+e,.16,{...o,y0});this.box(b.x0-e,b.z0-e,b.x1+e,b.z1+e,.14,{...o,y0:y0+H-.12});void fc;return b;}
 jersey(x0,z0,x1,z1){const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz),n=Math.max(1,Math.round(l/3)),r=Math.abs(dx)>Math.abs(dz)?0:PI/2;for(let i=0;i<n;i++){const t=(i+.5)/n;this.prop('barrier',x0+dx*t,z0+dz*t,r);}}
 wire(a,b,y=7){this.wires.push({a,b,y});}
 rnd(){this._s=((this._s||12345)*16807)%2147483647;return this._s/2147483647;}

 /* ---------- finalize: arrays for raycasts, nav grid, cover ---------- */
 finalize(){const S=this.boxes.filter(b=>b.solid);this.solid=S;const n=S.length,B=this.B=new Float32Array(n*6);this.pass=new Uint8Array(n);S.forEach((b,i)=>{B.set([b.x0,b.y0,b.z0,b.x1,b.y1,b.z1],i*6);this.pass[i]=b.pass?1:0;});
  const GS=this.GS=4,GN=this.GN=Math.ceil(this.half*2/GS);this.grid=Array.from({length:GN*GN},()=>[]);S.forEach((b,i)=>{const i0=Math.max(0,Math.floor((b.x0+this.half)/GS)),i1=Math.min(GN-1,Math.floor((b.x1+this.half)/GS)),j0=Math.max(0,Math.floor((b.z0+this.half)/GS)),j1=Math.min(GN-1,Math.floor((b.z1+this.half)/GS));for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++)this.grid[j*GN+k].push(i);});this.qs=new Uint32Array(n);this.qg=0;this.ql=[];
  const N=this.N=Math.ceil(this.half*2),off=this.half;this.blk=new Uint8Array(N*N);this.high=new Uint8Array(N*N);
  for(const b of S){if(b.y0>1.8||b.y1<.35)continue;const rx=Math.max(.31,(1.02-(b.x1-b.x0))/2),rz=Math.max(.31,(1.02-(b.z1-b.z0))/2);const i0=Math.max(0,Math.floor(b.x0-rx+off)),i1=Math.min(N-1,Math.floor(b.x1+rx+off)),j0=Math.max(0,Math.floor(b.z0-rz+off)),j1=Math.min(N-1,Math.floor(b.z1+rz+off));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const cx=i-off+.5,cz=j-off+.5;if(cx>b.x0-rx&&cx<b.x1+rx&&cz>b.z0-rz&&cz<b.z1+rz){this.blk[j*N+i]=1;if(b.y1>1.0&&!b.pass)this.high[j*N+i]=Math.max(this.high[j*N+i],b.y1>1.7?2:1);}}}
  for(let i=0;i<N;i++){this.blk[i]=this.blk[(N-1)*N+i]=this.blk[i*N]=this.blk[i*N+N-1]=1;}
  this.cover=[];const D=[[1,0],[-1,0],[0,1],[0,-1]];for(let j=2;j<N-2;j+=1)for(let i=2;i<N-2;i+=1){if(this.blk[j*N+i])continue;for(const[di,dj]of D){const k=(j+dj)*N+i+di;if(this.blk[k]&&this.high[k]){this.cover.push({x:i-off+.5,z:j-off+.5,nx:di,nz:dj,tall:this.high[k]===2,owner:null});break;}}}
  this.g=new Float32Array(N*N);this.par=new Int32Array(N*N);this.stamp=new Uint32Array(N*N);this.cstamp=new Uint32Array(N*N);this.gen=1;this.heap=new Int32Array(N*N*2);this.hf=new Float32Array(N*N*2);}
 near(x,z,r){const GS=this.GS,GN=this.GN,h=this.half,out=this.ql;out.length=0;const g=++this.qg;const i0=Math.max(0,Math.floor((x-r+h)/GS)),i1=Math.min(GN-1,Math.floor((x+r+h)/GS)),j0=Math.max(0,Math.floor((z-r+h)/GS)),j1=Math.min(GN-1,Math.floor((z+r+h)/GS));
  for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const c=this.grid[j*GN+k];for(let m=0;m<c.length;m++){const i=c[m];if(this.qs[i]!==g){this.qs[i]=g;out.push(i);}}}return out;}
 cell(x,z){const N=this.N,i=Math.floor(x+this.half),j=Math.floor(z+this.half);return(i<0||j<0||i>=N||j>=N)?-1:j*N+i;}
 free(x,z){const c=this.cell(x,z);return c>=0&&!this.blk[c];}
 // hitscan / LOS: t of first hit (or Infinity); out.n = face normal, out.i = box index (-2 ground)
 ray(ox,oy,oz,dx,dy,dz,maxT,out){if(Math.abs(dx)<1e-7)dx=1e-7;if(Math.abs(dy)<1e-7)dy=1e-7;if(Math.abs(dz)<1e-7)dz=1e-7;const B=this.B,PS=this.pass,n=B.length/6;let best=maxT,ax=-1,sg=0,bi=-1;const ix=1/dx,iy=1/dy,iz=1/dz;
  if(dy<-1e-6){const t=-oy/dy;if(t<best){best=t;ax=1;sg=1;bi=-2;}}
  for(let i=0;i<n;i++){if(PS[i])continue;const k=i*6;let t1=(B[k]-ox)*ix,t2=(B[k+3]-ox)*ix,tmin,tmax,a=0,s;if(t1<t2){tmin=t1;tmax=t2;s=-1;}else{tmin=t2;tmax=t1;s=1;}
   t1=(B[k+1]-oy)*iy;t2=(B[k+4]-oy)*iy;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=1;s=1;}}else if(t1>tmin){tmin=t1;a=1;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax)continue;
   t1=(B[k+2]-oz)*iz;t2=(B[k+5]-oz)*iz;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=2;s=1;}}else if(t1>tmin){tmin=t1;a=2;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax||tmax<0)continue;
   if(tmin<0)continue;if(tmin<best){best=tmin;ax=a;sg=s;bi=i;}}
  if(out){out.t=best;out.i=bi;out.n.set(ax===0?sg:0,ax===1?sg:0,ax===2?sg:0);}return best<maxT?best:Infinity;}
 los(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz);if(l<1e-4)return true;return this.ray(a.x,a.y,a.z,dx/l,dy/l,dz/l,l-.05)===Infinity;}
 ground(x,z,feet,r=.25){let g=0;const B=this.B,L=this.near(x,z,r+.1);for(let q=0;q<L.length;q++){const k=L[q]*6;if(B[k+4]>feet+STEP||B[k+4]<=g)continue;if(x+r<B[k]||x-r>B[k+3]||z+r<B[k+2]||z-r>B[k+5])continue;g=B[k+4];}return g;}
 collide(p,r,h){const B=this.B,L=this.near(p.x,p.z,r+.6).slice();let hit=false;for(let pass=0;pass<2;pass++)for(let q=0;q<L.length;q++){const k=L[q]*6;if(B[k+4]<=p.y+STEP||B[k+1]>=p.y+h)continue;
   const cx=Math.max(B[k],Math.min(p.x,B[k+3])),cz=Math.max(B[k+2],Math.min(p.z,B[k+5]));let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=true;
   if(d2>1e-8){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}else{const l=p.x-B[k],rr=B[k+3]-p.x,u=p.z-B[k+2],dd=B[k+5]-p.z,m=Math.min(l,rr,u,dd);if(m===l)p.x=B[k]-r;else if(m===rr)p.x=B[k+3]+r;else if(m===u)p.z=B[k+2]-r;else p.z=B[k+5]+r;}}
  const H=this.half-1;p.x=Math.max(-H,Math.min(H,p.x));p.z=Math.max(-H,Math.min(H,p.z));return hit;}
 ledge(p,fx,fz,r){const B=this.B;const x=p.x+fx*(r+.45),z=p.z+fz*(r+.45);let top=-1;const L=this.near(x,z,.2).slice();
  for(let q=0;q<L.length;q++){const k=L[q]*6;if(this.pass[L[q]])continue;if(x<B[k]-.05||x>B[k+3]+.05||z<B[k+2]-.05||z>B[k+5]+.05)continue;if(B[k+1]>p.y+.3)continue;const t=B[k+4];if(t>p.y+STEP&&t<=p.y+MANTLE)top=Math.max(top,t);else if(t>p.y+MANTLE)return -1;}
  if(top<0)return -1;for(let q=0;q<L.length;q++){const k=L[q]*6;if(x<B[k]||x>B[k+3]||z<B[k+2]||z>B[k+5])continue;if(B[k+1]>=top-.01&&B[k+1]<top+1.8)return -1;}return top;}
 inside(x,y,z){const B=this.B,L=this.near(x,z,.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(this.pass[i])continue;if(x>B[k]&&x<B[k+3]&&y>B[k+1]&&y<B[k+4]&&z>B[k+2]&&z<B[k+5])return i;}return -1;}
 nearestFree(x,z){const N=this.N,off=this.half;let i=Math.floor(x+off),j=Math.floor(z+off);for(let r=0;r<12;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>0&&b>0&&a<N-1&&b<N-1&&!this.blk[b*N+a])return b*N+a;}return -1;}
 walkable(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.ceil(l/.4);for(let k=1;k<=n;k++){const t=k/n,x=ax+dx*t,z=az+dz*t;if(!this.free(x,z))return false;}return true;}
 path(sx,sz,tx,tz,maxIter=7000){const N=this.N,off=this.half;let s=this.cell(sx,sz),t=this.cell(tx,tz);if(s<0||this.blk[s])s=this.nearestFree(sx,sz);if(t<0||this.blk[t])t=this.nearestFree(tx,tz);if(s<0||t<0)return null;
  const gen=++this.gen,g=this.g,par=this.par,st=this.stamp,cs=this.cstamp,H=this.heap,F=this.hf;let hn=0;const ti=t%N,tj=t/N|0;
  const h=c=>{const dx=Math.abs(c%N-ti),dz=Math.abs((c/N|0)-tj);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
  const push=(c,f)=>{let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;H[k]=H[p];F[k]=F[p];k=p;}H[k]=c;F[k]=f;};
  const pop=()=>{const top=H[0],lc=H[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;H[k]=H[c];F[k]=F[c];k=c;}H[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false;
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cs[c]===gen)continue;cs[c]=gen;const ci=c%N,cj=c/N|0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;if(this.blk[k]||cs[k]===gen)continue;
    if(di&&dj&&(this.blk[cj*N+ni]||this.blk[nj*N+ci]))continue;const ng=g[c]+(di&&dj?1.414:1);if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;push(k,ng+h(k));}}}
  if(!found)return null;const pts=[];for(let c=t;c>=0;c=par[c])pts.push([c%N-off+.5,(c/N|0)-off+.5]);pts.reverse();
  const out=[[sx,sz]];let a=0;const P=pts;while(a<P.length-1){let b=P.length-1;const[ax,az]=out[out.length-1];while(b>a+1&&!this.walkable(ax,az,P[b][0],P[b][1]))b--;out.push(P[b]);a=b;}
  out.shift();if(out.length)out[out.length-1]=[P[P.length-1][0],P[P.length-1][1]];return out;}
}

/* ================= geometry helpers ================= */
const IDM=new THREE.Matrix4();
export function merge(list){const P=[],N=[],U=[],C=[];let hasC=false;const nm=new THREE.Matrix3(),v=new V();for(const it of list){const geo=it.geo,m=it.m||IDM;const g=geo.index?geo.toNonIndexed():geo;const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,c=g.attributes.color;nm.getNormalMatrix(m);const col=it.c!=null?new THREE.Color(it.c):null;if(col||c)hasC=true;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);U.push(u?u.getX(i)*(it.us||1):0,u?u.getY(i)*(it.vs||1):0);
   if(c)C.push(c.getX(i),c.getY(i),c.getZ(i));else if(col)C.push(col.r,col.g,col.b);else C.push(1,1,1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));if(hasC)g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeBoundingSphere();return g;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(rt,rb,h,s=12,open=false)=>new THREE.CylinderGeometry(rt,rb,h,s,1,open),SP=(r,a=12,b=8)=>new THREE.SphereGeometry(r,a,b);
// side profile (u = forward z, v = up y) extruded across x with a soft bevel
export function prof(pts,width,bevel=.04,curve=4){const s=new THREE.Shape();pts.forEach(([u,v],i)=>i?s.lineTo(u,v):s.moveTo(u,v));const g=new THREE.ExtrudeGeometry(s,{depth:width-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:curve>1?2:1,curveSegments:curve});
 g.translate(0,0,-(width-bevel*2)/2);g.rotateY(-PI/2);g.computeVertexNormals();return g;}
const MAT_UV={concrete:4,plaster:3.2,stone:3.6,brick:2.6,metal:3,sandbag:1.2,hesco:2.2,roof:3,tile:2.4,wood:1.6,trim:2,cobble:3,slab:5,snowcap:4};

function boxGeoAppend(A,b,uvs,rnd){const{x0,y0,z0,x1,y1,z1}=b,c=b.col!=null?new THREE.Color(b.col):new THREE.Color(1,1,1);const tint=.94+rnd()*.1;c.multiplyScalar(tint);
 const faces=[[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],'zy'],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],'zy'],
  [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],'xz'],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],'xz'],
  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],'xy'],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],'xy']];
 for(const f of faces){if(f[4][1]<0&&y0<=.01)continue;const base=A.p.length/3;for(let k=0;k<4;k++){const v=f[k];A.p.push(v[0],v[1],v[2]);A.n.push(...f[4]);
   const u=f[5]==='zy'?[v[2]*f[4][0],v[1]]:f[5]==='xz'?[v[0],v[2]]:[-v[0]*f[4][2],v[1]];A.u.push(u[0]/uvs,u[1]/uvs);
   // baked ambient: darken toward the ground, slight top light
   let ao=1;if(b.ao&&f[4][1]===0)ao=Math.min(1,.58+.42*Math.min(1,v[1]/1.6))*(v[1]>=y1-.01&&y1>2?1.04:1);if(f[4][1]<0)ao=.55;A.c.push(c.r*ao,c.g*ao,c.b*ao);}
  A.i.push(base,base+1,base+2,base,base+2,base+3);}}
function toGeo(A){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(A.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));g.setIndex(A.i);g.computeBoundingSphere();return g;}

/* ================= vehicles ================= */
function vehicleParts(kind){const P={paint:[],dark:[],glass:[],lamp:[],canvas:[],chrome:[]};const wheel=(x,y,z,r=.45,w=.35)=>{P.dark.push({geo:CY(r,r,w,16),m:M4(x,y,z,0,0,PI/2)});P.chrome.push({geo:CY(r*.55,r*.55,w+.02,10),m:M4(x,y,z,0,0,PI/2)});};
 if(kind==='truck'||kind==='tanker'){P.paint.push({geo:prof([[1.25,.75],[3.55,.75],[3.7,1.1],[3.6,2.05],[3.3,2.75],[1.25,2.8]],2.4,.06),m:M4(0,0,1.0)},{geo:BX(2.5,.32,7.2),m:M4(0,.85,0)});
  P.glass.push({geo:BX(2.25,.62,.05),m:M4(0,2.25,4.27,-.32)},{geo:BX(.05,.55,1.2),m:M4(1.215,2.2,3.35)},{geo:BX(.05,.55,1.2),m:M4(-1.215,2.2,3.35)});
  P.dark.push({geo:BX(2.3,.3,7),m:M4(0,.55,0)},{geo:BX(2.55,.28,.3),m:M4(0,.82,4.62)},{geo:BX(1.4,.5,.06),m:M4(0,1.45,4.72)},{geo:BX(.3,.5,1.1),m:M4(1.35,1.0,2.2)},{geo:BX(.3,.5,1.1),m:M4(-1.35,1.0,2.2)});P.lamp.push({geo:BX(.3,.2,.06),m:M4(.85,1.15,4.72)},{geo:BX(.3,.2,.06),m:M4(-.85,1.15,4.72)});
  if(kind==='truck'){P.paint.push({geo:BX(2.5,.6,4.8),m:M4(0,1.3,-1.25)});P.canvas.push({geo:BX(2.45,1.5,4.7),m:M4(0,2.35,-1.25)},{geo:CY(1.22,1.22,4.7,14,true),m:M4(0,3.1,-1.25,PI/2,0,0,1,1,.32)});}
  else{P.paint.push({geo:CY(1.15,1.15,4.9,20),m:M4(0,2.15,-1.3,PI/2)},{geo:SP(1.15,16,8),m:M4(0,2.15,1.15,0,0,0,1,1,.25)},{geo:SP(1.15,16,8),m:M4(0,2.15,-3.75,0,0,0,1,1,.25)});P.dark.push({geo:CY(.3,.3,.4,10),m:M4(0,3.35,-1.3)});}
  for(const z of[3.05,-1.3,-2.7])for(const x of[-1.05,1.05])wheel(x,.52,z,.52,.42);}
 else if(kind==='jeep'){P.paint.push({geo:prof([[-2.25,.55],[2.2,.55],[2.3,.85],[2.2,1.2],[.9,1.32],[.55,1.35],[-2.25,1.35]],2.05,.07),m:M4()},{geo:prof([[-2.15,1.35],[.5,1.35],[.25,2.0],[-2.0,2.0]],1.95,.05),m:M4()});
  P.glass.push({geo:BX(1.75,.5,.05),m:M4(0,1.68,.39,-.42)},{geo:BX(.05,.4,1.1),m:M4(.985,1.72,-.6)},{geo:BX(.05,.4,1.1),m:M4(-.985,1.72,-.6)});
  P.dark.push({geo:BX(2.1,.22,.3),m:M4(0,.7,2.3)},{geo:CY(.4,.4,.28,14),m:M4(0,1.25,-2.36,PI/2)},{geo:BX(1.6,.12,.9),m:M4(0,1.32,1.55)},{geo:BX(.08,.6,.1),m:M4(0,2.25,-1.2)},{geo:CY(.08,.08,.7,8),m:M4(0,2.45,-.9,PI/2)});
  P.lamp.push({geo:BX(.26,.18,.05),m:M4(.72,1.08,2.27)},{geo:BX(.26,.18,.05),m:M4(-.72,1.08,2.27)});for(const z of[1.45,-1.45])for(const x of[-.98,.98])wheel(x,.46,z,.46,.36);}
 else if(kind==='pickup'){P.paint.push({geo:prof([[-2.55,.5],[2.5,.5],[2.6,.8],[2.5,1.1],[1.25,1.18],[.55,1.75],[-.6,1.8],[-.75,1.2],[-2.55,1.2]],1.95,.08),m:M4()});
  P.glass.push({geo:BX(1.7,.5,.05),m:M4(0,1.48,.9,-.85)},{geo:BX(1.95,.42,1.1),m:M4(0,1.5,-.05)});P.dark.push({geo:BX(1.8,.1,1.75),m:M4(0,.8,-1.65)},{geo:BX(2,.22,.25),m:M4(0,.62,2.6)},{geo:BX(2,.22,.25),m:M4(0,.62,-2.6)});
  P.lamp.push({geo:BX(.3,.14,.05),m:M4(.72,.98,2.58)},{geo:BX(.3,.14,.05),m:M4(-.72,.98,2.58)});for(const z of[1.65,-1.65])for(const x of[-.92,.92])wheel(x,.42,z,.42,.3);}
 else if(kind==='forklift'){P.paint.push({geo:prof([[-1.2,.25],[.9,.25],[.9,1.1],[-1.2,1.3]],1.2,.05),m:M4()},{geo:BX(1.1,.12,1.2),m:M4(0,2.15,-.1)});P.dark.push({geo:BX(.08,2.1,.08),m:M4(.55,1.15,.4)},{geo:BX(.08,2.1,.08),m:M4(-.55,1.15,.4)},{geo:BX(.08,2.1,.08),m:M4(.55,1.15,-.8)},{geo:BX(.08,2.1,.08),m:M4(-.55,1.15,-.8)},{geo:BX(.1,2.4,.12),m:M4(.4,1.2,1.0)},{geo:BX(.1,2.4,.12),m:M4(-.4,1.2,1.0)},{geo:BX(.1,.06,1.0),m:M4(.3,.1,1.5)},{geo:BX(.1,.06,1.0),m:M4(-.3,.1,1.5)},{geo:BX(.4,.4,.4),m:M4(0,1.1,-.3)});
  for(const z of[.6,-.8])for(const x of[-.5,.5])wheel(x,.3,z,.3,.22);}
 else{// sedan / wreck
  P.paint.push({geo:prof([[-2.2,.36],[2.15,.36],[2.22,.62],[2.12,.82],[.95,.92],[.35,1.38],[-1.1,1.4],[-1.75,.95],[-2.2,.9]],1.82,.08),m:M4()});
  P.glass.push({geo:prof([[.9,.93],[.33,1.33],[-1.06,1.35],[-1.68,.96]],1.66,0),m:M4()});P.dark.push({geo:BX(1.84,.16,4.34),m:M4(0,.42,0)},{geo:BX(1.7,.2,.12),m:M4(0,.5,2.17)},{geo:BX(1.7,.2,.12),m:M4(0,.5,-2.17)});
  P.lamp.push({geo:BX(.32,.12,.05),m:M4(.62,.74,2.18)},{geo:BX(.32,.12,.05),m:M4(-.62,.74,2.18)});for(const z of[1.35,-1.35])for(const x of[-.84,.84])wheel(x,.34,z,.34,.24);}
 const out={};for(const k in P)if(P[k].length)out[k]=merge(P[k]);return out;}

/* ================= heli + jets (also used by modes / streaks) ================= */
export function makeHeli(col=0x4a5440){const g=new THREE.Group();const body=new THREE.MeshStandardMaterial({color:col,roughness:.5,metalness:.35}),dark=new THREE.MeshStandardMaterial({color:0x18191b,roughness:.4,metalness:.6}),glass=new THREE.MeshStandardMaterial({color:0x1a2a36,roughness:.05,metalness:.9});
 const add=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;g.add(o);return o;};
 add(prof([[-2.4,.9],[1.6,.9],[2.6,1.2],[3.0,1.9],[2.5,2.6],[1.2,3.0],[-2.4,3.0],[-3,2.4]],2.2,.18,6),body,0,0,0);add(prof([[-7.4,2.3],[-2.6,1.9],[-2.6,2.9],[-7.4,2.7]],.5,.08),body,0,0,0);add(BX(.12,1.7,1.1),body,0,3.1,-7.2,.3);add(BX(1.8,.08,.7),body,0,2.5,-6.4);
 add(prof([[1.65,1.5],[2.55,1.35],[2.95,1.9],[2.45,2.55],[1.5,2.6]],2.25,.04),glass,0,0,0);
 add(BX(.1,.1,3.8),dark,1.05,.32,0);add(BX(.1,.1,3.8),dark,-1.05,.32,0);for(const z of[1,-1])for(const x of[1,-1])add(BX(.07,.6,.07),dark,x*.98,.62,z*1.1,0,0,x*.25);
 add(CY(.18,.18,.5,10),dark,0,3.25,0);add(BX(1.4,.4,1.6),body,0,3.1,-.4);const rotor=new THREE.Group();rotor.position.set(0,3.5,0);g.add(rotor);for(let i=0;i<4;i++){const piv=new THREE.Group();piv.rotation.y=i*PI/2;const b=new THREE.Mesh(BX(.32,.04,6.6),dark);b.position.z=3.3;piv.add(b);rotor.add(piv);}
 const tr=new THREE.Group();tr.position.set(.3,3.0,-7.3);g.add(tr);for(let i=0;i<2;i++){const b=new THREE.Mesh(BX(.04,1.5,.16),dark);b.rotation.x=i*PI/2;tr.add(b);}
 const beacon=new THREE.Mesh(SP(.09,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(6,.4,.3)}));beacon.position.set(0,.85,0);g.add(beacon);g.userData={rotor,tr,beacon};return g;}
export function makeJet(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x6a7078,roughness:.35,metalness:.6}),dk=new THREE.MeshStandardMaterial({color:0x22262a,roughness:.3,metalness:.7});
 const add=(geo,mm,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,mm);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o;};
 add(CY(.55,.75,9,14),m,0,0,0,PI/2);add(new THREE.ConeGeometry(.55,3,14),m,0,0,6,PI/2);add(prof([[-1.5,0],[2.5,0],[-3.5,4.6],[-4.6,4.6]].map(([u,v])=>[u,v]),.14,.02),m,0,0,0,0,0,PI/2);
 const w2=add(prof([[-1.5,0],[2.5,0],[-3.5,-4.6],[-4.6,-4.6]],.14,.02),m,0,0,0,0,0,PI/2);void w2;
 add(prof([[-4.6,.3],[-3.0,.3],[-4.4,2.4],[-5.2,2.4]],.12,.02),m,0,.3,0);add(BX(4.2,.1,1.3),m,0,0,-4.2);add(SP(.45,10,6),new THREE.MeshStandardMaterial({color:0x10161c,roughness:.05,metalness:.9}),0,.5,2.6,0,0,0);
 add(CY(.5,.4,.6,12,true),dk,0,0,-4.8,PI/2);
 const fl=add(new THREE.ConeGeometry(.42,3.2,12,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(6,2.6,.8),transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}),0,0,-6.6,-PI/2);g.userData.fl=fl;g.visible=false;return g;}

/* ================= sky ================= */
const SKY_V='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const SKY_F=`uniform vec3 uTop,uMid,uHor,uSunC,uSun,uCloudC,uGround;uniform float uCloud,uT,uSunSize;varying vec3 vP;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){vec3 d=normalize(vP);float y=d.y;vec3 c=mix(uHor,uMid,smoothstep(0.,.28,y));c=mix(c,uTop,smoothstep(.22,.85,y));
 float s=max(0.,dot(d,uSun));c+=uSunC*(pow(s,5.)*.22+pow(s,40.)*.45);c+=uSunC*smoothstep(1.-uSunSize,1.-uSunSize*.6,s)*6.;
 if(y>0.){vec2 uv=d.xz/(y+.1)*1.3+vec2(uT*.006,uT*.002);float f=fbm(uv);float cl=smoothstep(.5-uCloud*.3,.85,f)*smoothstep(0.,.18,y)*min(1.,uCloud*1.6);
  vec3 cc=uCloudC*(.82+.35*fbm(uv*2.+3.))+uSunC*pow(s,8.)*.5;c=mix(c,cc,cl*.9);}
 else c=mix(uHor,uGround,smoothstep(0.,-.25,y));
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function makeSky(look){const U={uTop:{value:new THREE.Color(look.sky.top)},uMid:{value:new THREE.Color(look.sky.mid)},uHor:{value:new THREE.Color(look.sky.hor)},uGround:{value:new THREE.Color(look.sky.ground??look.fog.c)},uSun:{value:new V(...look.sun.dir).normalize()},uSunC:{value:new THREE.Color(look.sun.c).multiplyScalar(look.sky.sunK??1)},
  uCloudC:{value:new THREE.Color(look.sky.cloud??0xffffff)},uCloud:{value:look.sky.clouds??.5},uT:{value:0},uSunSize:{value:look.sky.sunSize??.0008}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:true,fog:false,uniforms:U,vertexShader:SKY_V,fragmentShader:SKY_F}));m.renderOrder=-10;m.frustumCulled=false;m.userData.U=U;return m;}

/* ================= scene construction ================= */
export function buildScene(L,TX,q){const look=L.look;L.timeU=L.timeU||{value:0};const G=new THREE.Group();const dusk=!!look.lampsOn;const std=o=>new THREE.MeshStandardMaterial(o);
 const W=(t,o={})=>std({map:t.map,normalMap:t.normalMap,normalScale:new THREE.Vector2(o.ns??.9,o.ns??.9),roughness:o.r??.9,metalness:o.m??0,vertexColors:true,...(o.x||{})});
 const mats={concrete:W(TX.concrete,{r:.92}),plaster:W(TX.plaster,{r:.95}),stone:W(TX.stone,{r:.9}),brick:W(TX.brick,{r:.9}),metal:W(TX.metal,{r:.55,m:.25,ns:.7}),wood:W(TX.wood,{r:.85}),
  sandbag:W(TX.sandbag,{r:1}),hesco:W(TX.hesco,{r:1}),roof:W(TX.roof,{r:.92}),tile:W(TX.slab,{r:.75,ns:.4}),trim:std({color:0xffffff,roughness:.7,metalness:.05,vertexColors:true}),cobble:W(TX.cobble,{r:.85}),slab:W(TX.slab,{r:.85}),snowcap:W(TX.snow,{r:.8,ns:.3})};
 // ----- merged static boxes
 const acc={};const rnd=()=>L.rnd();for(const b of L.boxes){if(!b.vis)continue;const m=mats[b.mat]?b.mat:'concrete';(acc[m]=acc[m]||{p:[],n:[],u:[],c:[],i:[]});boxGeoAppend(acc[m],b,b.uvs||MAT_UV[m]||3,rnd);}
 // pitched roofs: gables in wall material, slopes in tile material
 const roofA={p:[],n:[],u:[],c:[],i:[]};
 const quad=(A,a,b,c,d,n,col,uv)=>{const base=A.p.length/3;for(const[v,t]of[[a,uv[0]],[b,uv[1]],[c,uv[2]],[d,uv[3]]]){A.p.push(...v);A.n.push(...n);A.u.push(...t);A.c.push(col.r,col.g,col.b);}A.i.push(base,base+1,base+2,base,base+2,base+3);};
 const tri=(A,a,b,c,n,col,s)=>{const base=A.p.length/3;for(const v of[a,b,c]){A.p.push(...v);A.n.push(...n);A.u.push((v[0]+v[2])/s,v[1]/s);A.c.push(col.r,col.g,col.b);}A.i.push(base,base+1,base+2);};
 for(const r of L.roofs){const alongX=(r.x1-r.x0)>=(r.z1-r.z0),span=alongX?(r.z1-r.z0):(r.x1-r.x0),rise=span*.32,y=r.y,yt=y+rise;const col=new THREE.Color(r.rcol??0xffffff),wc=new THREE.Color(r.col);const wm=r.mat==='brick'?'brick':'plaster';(acc[wm]=acc[wm]||{p:[],n:[],u:[],c:[],i:[]});
  if(alongX){const zm=(r.z0+r.z1)/2,l=r.x1-r.x0,sl=Math.hypot(span/2,rise),ny=span/2/sl,nz=rise/sl;
   quad(roofA,[r.x0,y,r.z1],[r.x1,y,r.z1],[r.x1,yt,zm],[r.x0,yt,zm],[0,ny,nz],col,[[0,0],[l/2.2,0],[l/2.2,sl/2.2],[0,sl/2.2]]);quad(roofA,[r.x1,y,r.z0],[r.x0,y,r.z0],[r.x0,yt,zm],[r.x1,yt,zm],[0,ny,-nz],col,[[0,0],[l/2.2,0],[l/2.2,sl/2.2],[0,sl/2.2]]);
   quad(roofA,[r.x0,y-.02,r.z0],[r.x1,y-.02,r.z0],[r.x1,y-.02,r.z1],[r.x0,y-.02,r.z1],[0,-1,0],col.clone().multiplyScalar(.4),[[0,0],[1,0],[1,1],[0,1]]);
   tri(acc[wm],[r.x0+.45,y,r.z0+.45],[r.x0+.45,y,r.z1-.45],[r.x0+.45,yt-.3,zm],[-1,0,0],wc,3.2);tri(acc[wm],[r.x1-.45,y,r.z1-.45],[r.x1-.45,y,r.z0+.45],[r.x1-.45,yt-.3,zm],[1,0,0],wc,3.2);}
  else{const xm=(r.x0+r.x1)/2,l=r.z1-r.z0,sl=Math.hypot(span/2,rise),ny=span/2/sl,nx=rise/sl;
   quad(roofA,[r.x1,y,r.z1],[r.x1,y,r.z0],[xm,yt,r.z0],[xm,yt,r.z1],[nx,ny,0],col,[[0,0],[l/2.2,0],[l/2.2,sl/2.2],[0,sl/2.2]]);quad(roofA,[r.x0,y,r.z0],[r.x0,y,r.z1],[xm,yt,r.z1],[xm,yt,r.z0],[-nx,ny,0],col,[[0,0],[l/2.2,0],[l/2.2,sl/2.2],[0,sl/2.2]]);
   quad(roofA,[r.x0,y-.02,r.z1],[r.x1,y-.02,r.z1],[r.x1,y-.02,r.z0],[r.x0,y-.02,r.z0],[0,-1,0],col.clone().multiplyScalar(.4),[[0,0],[1,0],[1,1],[0,1]]);
   tri(acc[wm],[r.x1-.45,y,r.z0+.45],[r.x0+.45,y,r.z0+.45],[xm,yt-.3,r.z0+.45],[0,0,-1],wc,3.2);tri(acc[wm],[r.x0+.45,y,r.z1-.45],[r.x1-.45,y,r.z1-.45],[xm,yt-.3,r.z1-.45],[0,0,1],wc,3.2);}}
 for(const k in acc){const me=new THREE.Mesh(toGeo(acc[k]),mats[k]);me.castShadow=k!=='tile';me.receiveShadow=true;G.add(me);}
 if(roofA.p.length){const me=new THREE.Mesh(toGeo(roofA),std({map:TX.tiles.map,normalMap:TX.tiles.normalMap,roughness:.8,vertexColors:true,side:THREE.DoubleSide}));me.castShadow=me.receiveShadow=true;G.add(me);}
 // ----- terrain: flat play area + sculpted surroundings
 const T=L.terrain,ext=L.half*2+520,seg=q>=2?160:110;const gg=new THREE.PlaneGeometry(ext,ext,seg,seg);gg.rotateX(-PI/2);const gp=gg.attributes.position,guv=gg.attributes.uv,gcol=new Float32Array(gp.count*3);
 const hn=(x,z)=>Math.sin(x*.031+1.3)*Math.cos(z*.027)*.5+Math.sin(x*.071+z*.053)*.3+Math.sin(x*.13-z*.11+2)*.15+.5;
 for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i);const e=Math.max(Math.abs(x),Math.abs(z))-L.half-4;let y=0;
  if(e>0&&!(T.seaSide&&T.seaSide(x,z))){const k=Math.min(1,e/(T.ramp||60));y=k*k*(T.height||20)*(.45+hn(x,z)*.9)+(T.dunes?Math.sin(x*.09+z*.04)*Math.min(1,e/20)*2.5:0);}
  if(T.seaSide&&T.seaSide(x,z))y=-2.2;gp.setY(i,y);guv.setXY(i,x/7,-z/7);const v=.86+hn(x*3,z*3)*.22;gcol[i*3]=gcol[i*3+1]=gcol[i*3+2]=v;}
 gg.setAttribute('color',new THREE.Float32BufferAttribute(gcol,3));gg.computeVertexNormals();
 const base=TX[T.base],alt=TX[T.alt||T.base],pathT=TX[T.path||'dirt'];const splat=L.splatTex;
 const gm=std({map:base.map,normalMap:base.normalMap,normalScale:new THREE.Vector2(.8,.8),roughness:T.rough??.95,vertexColors:true,color:T.tint??0xffffff});
 gm.onBeforeCompile=s=>{s.uniforms.uB={value:alt.map};s.uniforms.uC={value:pathT.map};s.uniforms.uSplat={value:splat};s.uniforms.uHalf={value:L.half};s.uniforms.uBK={value:T.altK??.5};s.uniforms.uCS={value:T.pathScale??1.13};
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <fog_vertex>','#include <fog_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vWP;uniform sampler2D uB,uC,uSplat;uniform float uHalf,uBK,uCS;
float th(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float tn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(th(i),th(i+vec2(1,0)),f.x),mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x),f.y);}`)
   .replace('#include <map_fragment>',`vec2 wu=vMapUv;vec4 ta=texture2D(map,wu);vec4 tb=texture2D(uB,wu*.71+.31);vec4 tc=texture2D(uC,wu*uCS);
 float mk=smoothstep(.38,.62,tn(vWP.xz*.045)*.65+tn(vWP.xz*.13)*.35)*uBK;vec4 col=mix(ta,tb,mk);
 vec2 su=(vWP.xz+uHalf)/(2.*uHalf);vec4 sp=texture2D(uSplat,vec2(su.x,1.-su.y));float inb=step(0.,su.x)*step(su.x,1.)*step(0.,su.y)*step(su.y,1.);
 float pm=smoothstep(.15,.6,sp.r+(tn(vWP.xz*.6)-.5)*.35)*inb;col=mix(col,tc,pm);col=mix(col,tb,sp.g*inb);
 col.rgb*=.86+.28*tn(vWP.xz*.012);diffuseColor*=col;`);};
 const ground=new THREE.Mesh(gg,gm);ground.receiveShadow=true;G.add(ground);
 // water
 L.water=null;if(T.water){const wm=std({color:T.water.c,roughness:.06,metalness:.2,normalMap:TX.waterN,normalScale:new THREE.Vector2(.35,.35),transparent:true,opacity:.92});wm.normalMap=TX.waterN.clone();wm.normalMap.needsUpdate=true;wm.normalMap.repeat.set(80,80);
  const w=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),wm);w.rotation.x=-PI/2;w.position.y=T.water.y;G.add(w);L.water=wm;}
 // ----- roads + pads + painted lines
 for(const r of L.roads){const len=r.len,w=r.w,t=TX[r.kind]||TX.asphalt;const m=std({map:t.map.clone(),normalMap:t.normalMap.clone(),roughness:.85,polygonOffset:true,polygonOffsetFactor:-2,color:r.col??0xffffff});m.map.needsUpdate=m.normalMap.needsUpdate=true;
  m.map.repeat.set(w/6,len/6);m.normalMap.repeat.set(w/6,len/6);const me=new THREE.Mesh(new THREE.PlaneGeometry(w,len),m);me.rotation.set(-PI/2,0,r.rot||0);me.position.set(r.x,.02,r.z);me.receiveShadow=true;G.add(me);
  if(r.lines){const lm=new THREE.MeshStandardMaterial({color:r.lines,roughness:.7,polygonOffset:true,polygonOffsetFactor:-4});const parts=[];for(let s=-len/2+2;s<len/2-2;s+=6)parts.push({geo:new THREE.PlaneGeometry(.18,3),m:M4(0,0,s+1.5)});if(parts.length){const lg=merge(parts);lg.rotateX(-PI/2);const lme=new THREE.Mesh(lg,lm);lme.rotation.y=r.rot||0;lme.position.set(r.x,.03,r.z);lme.receiveShadow=true;G.add(lme);}}}
 for(const p of L.pads){const m=std({map:TX.pad,roughness:.8,polygonOffset:true,polygonOffsetFactor:-3});const me=new THREE.Mesh(new THREE.PlaneGeometry(p.r*2,p.r*2),m);me.rotation.x=-PI/2;me.position.set(p.x,(p.y||0)+.03,p.z);me.receiveShadow=true;G.add(me);}
 for(const p of L.paint){const m=std({color:p.c,roughness:.7,polygonOffset:true,polygonOffsetFactor:-4,map:p.map||null,transparent:!!p.map});const me=new THREE.Mesh(new THREE.PlaneGeometry(p.w,p.d),m);me.rotation.set(-PI/2,0,p.rot||0);me.position.set(p.x,.035,p.z);me.receiveShadow=true;G.add(me);}
 // ----- windows: 4 atlas variants as instanced quads
 {const geo=new THREE.PlaneGeometry(1.25,1.4);const byV=[[],[],[],[]];for(const w of L.windows)byV[w.v&3].push(w);
  const wmat=std({map:TX.win,roughness:.25,metalness:.2,emissive:dusk?0xffc080:0x000000,emissiveMap:TX.winE,emissiveIntensity:dusk?1.7:0,envMapIntensity:1.3});
  byV.forEach((list,vi)=>{if(!list.length)return;const g=geo.clone(),uv=g.attributes.uv,ox=(vi%2)*.5,oy=vi<2?.5:0;for(let i=0;i<uv.count;i++)uv.setXY(i,ox+uv.getX(i)*.5,oy+uv.getY(i)*.5);
   const im=new THREE.InstancedMesh(g,wmat,list.length);const m=new THREE.Matrix4(),qq=new THREE.Quaternion(),e=new THREE.Euler();list.forEach((w,i)=>{const r={n:PI,s:0,w:-PI/2,e:PI/2}[w.side],o=.162;
    const x=w.x+(w.side==='w'?-o:w.side==='e'?o:0),z=w.z+(w.side==='n'?-o:w.side==='s'?o:0);m.compose(new V(x,w.y+.62,z),qq.setFromEuler(e.set(0,r,0)),new V(1,1,1));im.setMatrixAt(i,m);});im.receiveShadow=true;G.add(im);});}
 // ----- awnings (cloth, slanted)
 if(L.awnings.length){const parts=[];for(const a of L.awnings){const c=new THREE.Color(a.col);let x,z,ry;if(a.side==='n'){x=a.x0+a.off;z=a.z0-.75;ry=PI;}else if(a.side==='s'){x=a.x0+a.off;z=a.z1+.75;ry=0;}else if(a.side==='w'){x=a.x0-.75;z=a.z0+a.off;ry=-PI/2;}else{x=a.x1+.75;z=a.z0+a.off;ry=PI/2;}
   parts.push({geo:BX(a.w,.04,1.6),m:M4(x,a.y,z,0,ry,0).multiply(M4(0,0,0,.32)),c},{geo:BX(a.w,.36,.03),m:M4(x,a.y,z,0,ry,0).multiply(M4(0,-.42,.76)),c});}
  const am=std({map:TX.stripe,roughness:.9,vertexColors:true,side:THREE.DoubleSide});const me=new THREE.Mesh(merge(parts),am);me.castShadow=true;me.receiveShadow=true;G.add(me);}
 // ----- fences (chain link: alpha-tested grid via shader-free texture)
 if(L.fences.length){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.strokeStyle='#c8ccd0';x.lineWidth=2;for(let i=-64;i<128;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}
  const ft=new THREE.CanvasTexture(c);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.colorSpace=THREE.SRGBColorSpace;const fparts=[],posts=[];
  for(const f of L.fences){const dx=f.x1-f.x0,dz=f.z1-f.z0,l=Math.hypot(dx,dz),a=Math.atan2(dz,dx);fparts.push({geo:new THREE.PlaneGeometry(l,f.h),m:M4((f.x0+f.x1)/2,f.h/2,(f.z0+f.z1)/2,0,-a,0),us:l/1.2,vs:f.h/1.2});
   const n=Math.ceil(l/3);for(let i=0;i<=n;i++){const t=i/n;posts.push({geo:CY(.04,.04,f.h+.1,6),m:M4(f.x0+dx*t,(f.h+.1)/2,f.z0+dz*t)});}posts.push({geo:CY(.025,.025,l,6),m:M4((f.x0+f.x1)/2,f.h,(f.z0+f.z1)/2,0,-a,PI/2)});}
  const fm=std({map:ft,alphaTest:.5,side:THREE.DoubleSide,roughness:.5,metalness:.6,transparent:false});const fg=merge(fparts);const me=new THREE.Mesh(fg,fm);me.castShadow=true;G.add(me);
  const pm=new THREE.Mesh(merge(posts),std({color:0x8a8e92,roughness:.4,metalness:.7}));pm.castShadow=true;G.add(pm);}
 // ----- signs
 for(const s of L.signs){const t=TX.sign(s.text,s.bg,s.fg);const m=std({map:t,roughness:.6,emissive:dusk&&s.glow?0xffffff:0,emissiveMap:dusk&&s.glow?t:null,emissiveIntensity:.8});const me=new THREE.Mesh(new THREE.PlaneGeometry(s.w,s.w/4),m);me.position.set(s.x,s.y,s.z);me.rotation.y=s.ry||0;G.add(me);}
 // ----- power / harbour wires
 if(L.wires.length){const parts=[];for(const w of L.wires){const a=new V(w.a[0],w.y,w.a[1]),b=new V(w.b[0],w.y,w.b[1]);const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new V().lerpVectors(a,b,t).add(new V(0,-Math.sin(t*PI)*1.2,0)));}
   parts.push({geo:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.02,4,false),m:new THREE.Matrix4()});}G.add(new THREE.Mesh(merge(parts),std({color:0x1a1a1a,roughness:.6})));}
 // ----- instanced props
 const groups={};for(const p of L.props)(groups[p.kind]=groups[p.kind]||[]).push(p);
 const inst=(geo,mat,list,cast=true,fn)=>{const im=new THREE.InstancedMesh(geo,mat,list.length);const m=new THREE.Matrix4(),qq=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();
  list.forEach((p,i)=>{const s=p.s||1;if(fn)fn(p,m,i);else m.compose(new V(p.x,p.y,p.z),qq.setFromEuler(e.set(0,p.rot,0)),new V(s,s,s));im.setMatrixAt(i,m);c.set(p.col!=null?p.col:0xffffff);im.setColorAt(i,c);});
  im.castShadow=cast;im.receiveShadow=true;G.add(im);return im;};
 const crateM=std({map:TX.crate.map,normalMap:TX.crate.normalMap,roughness:.85});
 for(const[k,s]of[['crate',1.2],['crateS',.8]])if(groups[k]){const g=BX(s,s,s);g.translate(0,s/2,0);inst(g,crateM,groups[k]);}
 if(groups.crateL){const g=merge([{geo:BX(2.2,1.1,1.1),m:M4(0,.55,0)},{geo:BX(2.26,.08,1.16),m:M4(0,.15,0),c:0x333333},{geo:BX(2.26,.08,1.16),m:M4(0,.95,0),c:0x333333}]);inst(g,std({map:TX.wood.map,roughness:.8,vertexColors:true}),groups.crateL.map(p=>({...p,col:p.col??0x6a7a4a})));}
 if(groups.pallet){const pp=[];for(let i=-2;i<=2;i++)pp.push({geo:BX(1.2,.03,.16),m:M4(0,.145,i*.21)});for(const x of[-.5,0,.5])pp.push({geo:BX(.1,.1,1),m:M4(x,.06,0)});inst(merge(pp),std({map:TX.wood.map,roughness:.9}),groups.pallet,true);}
 if(groups.barrel){const g=merge([{geo:CY(.31,.31,.92,18),m:M4(0,.46,0)},{geo:CY(.32,.32,.04,18),m:M4(0,.3,0)},{geo:CY(.32,.32,.04,18),m:M4(0,.62,0)}]);inst(g,std({map:TX.metal.map,roughness:.45,metalness:.55}),groups.barrel.map(p=>({...p,col:p.col??0x4a6a3a})));}
 if(groups.tires){const tg=[];for(let i=0;i<3;i++)tg.push({geo:new THREE.TorusGeometry(.4,.15,8,16),m:M4(0,.15+i*.28,0,PI/2)});inst(merge(tg),std({color:0x1a1a1a,roughness:.9}),groups.tires);}
 if(groups.dumpster){const g=merge([{geo:BX(1.9,1.2,1.2),m:M4(0,.7,0)},{geo:BX(2,.08,1.3),m:M4(0,1.34,0,-.08)},{geo:BX(1.95,.12,.08),m:M4(0,1.1,.62)}]);inst(g,std({map:TX.metal.map,roughness:.6,metalness:.4}),groups.dumpster.map(p=>({...p,col:p.col??0x2d6a4a})));}
 if(groups.gen){const g=merge([{geo:BX(2.2,1.2,1.2),m:M4(0,.6,0)},{geo:CY(.1,.1,1.2,8),m:M4(.7,1.6,0)},{geo:BX(.6,.4,.8),m:M4(-.6,1.4,0)},{geo:BX(2.3,.12,1.3),m:M4(0,1.22,0)}]);inst(g,std({map:TX.metal.map,color:0xb8a860,roughness:.6,metalness:.3}),groups.gen);}
 if(groups.barrier){const g=prof([[-.31,0],[.31,0],[.31,.08],[.12,.3],[.08,.9],[-.08,.9],[-.12,.3],[-.31,.08]].map(([u,v])=>[u,v]),3,.02);g.rotateY(PI/2);inst(g,std({map:TX.concrete.map,normalMap:TX.concrete.normalMap,roughness:.9}),groups.barrier.map(p=>({...p,col:p.col??0xd8d4cc})));}
 if(groups.bollard){const g=merge([{geo:CY(.14,.16,.8,12),m:M4(0,.4,0)},{geo:SP(.15,12,6),m:M4(0,.8,0,0,0,0,1,.5,1)}]);inst(g,std({color:0xd8b020,roughness:.5,metalness:.4}),groups.bollard);}
 if(groups.cone){const g=merge([{geo:new THREE.ConeGeometry(.16,.55,12),m:M4(0,.3,0)},{geo:BX(.4,.04,.4),m:M4(0,.02,0)}]);inst(g,std({color:0xff6a1a,roughness:.6}),groups.cone,false);}
 if(groups.bench){const g=merge([{geo:BX(1.8,.06,.45),m:M4(0,.45,0)},{geo:BX(1.8,.4,.05),m:M4(0,.7,-.22,-.15)},{geo:BX(.06,.45,.45),m:M4(.8,.22,0)},{geo:BX(.06,.45,.45),m:M4(-.8,.22,0)}]);inst(g,std({map:TX.wood.map,roughness:.8}),groups.bench);}
 if(groups.cafe){const t=merge([{geo:CY(.45,.45,.04,16),m:M4(0,.74,0)},{geo:CY(.03,.03,2.3,6),m:M4(0,1.15,0)},{geo:CY(.25,.25,.03,12),m:M4(0,.01,0)}]);inst(t,std({color:0x2a2c30,roughness:.4,metalness:.7}),groups.cafe);
  const u=new THREE.ConeGeometry(1.4,.55,8,1,true);u.translate(0,2.35,0);inst(u,std({map:TX.cloth,roughness:.9,side:THREE.DoubleSide}),groups.cafe.map((p,i)=>({...p,col:p.col??[0xc8402a,0xe8d8b0,0x2a6a5a,0xd8a030][i%4]})));}
 if(groups.stall){const tab=merge([{geo:BX(2.6,.08,1.6),m:M4(0,.9,0)},...[[1.2,.7],[-1.2,.7],[1.2,-.7],[-1.2,-.7]].map(([x,z])=>({geo:BX(.08,.9,.08),m:M4(x,.45,z)})),...[[1.25,-.75,2.4],[-1.25,-.75,2.4],[1.25,.75,2.1],[-1.25,.75,2.1]].map(([x,z,h])=>({geo:BX(.08,h,.08),m:M4(x,h/2,z)}))]);
  inst(tab,std({map:TX.wood.map,color:0xb89a70,roughness:.9}),groups.stall);inst(BX(2.9,.05,2.1).translate(0,2.28,0),std({map:TX.stripe,roughness:.9,side:THREE.DoubleSide}),groups.stall.map((p,i)=>({...p,col:p.col??[0xc84a2a,0x2a5ab0,0xd8a030,0x3a8a4a,0xe8e0d0][i%5]})));
  const goods=merge([{geo:BX(.5,.3,.4),m:M4(-.7,1.09,0)},{geo:BX(.4,.25,.4),m:M4(.2,1.07,.2)},{geo:SP(.18,8,6),m:M4(.8,1.1,-.1)},{geo:SP(.15,8,6),m:M4(.55,1.08,.3)},{geo:SP(.15,8,6),m:M4(-.2,1.08,-.3)}]);inst(goods,std({color:0xffffff,roughness:.8}),groups.stall.map((p,i)=>({...p,col:[0xe0842a,0x9ac83a,0xd8302a,0xf0c040][i%4]})));}
 if(groups.ac){const g=merge([{geo:BX(.9,.6,.6),m:M4(0,.3,0)},{geo:CY(.22,.22,.02,14),m:M4(0,.3,.31,PI/2),c:0x333333}]);inst(g,std({color:0xd8d8d4,roughness:.5,metalness:.3,vertexColors:true}),groups.ac);}
 if(groups.watertank){const g=merge([{geo:CY(.6,.6,1.2,16),m:M4(0,.95,0)},...[[.45,.45],[-.45,.45],[.45,-.45],[-.45,-.45]].map(([x,z])=>({geo:BX(.06,.4,.06),m:M4(x,.2,z)}))]);inst(g,std({color:0xe8e4dc,roughness:.6}),groups.watertank);}
 if(groups.dish){const g=merge([{geo:CY(.06,.06,1.6,8),m:M4(0,.8,0)},{geo:new THREE.SphereGeometry(1,16,8,0,PI*2,0,.9),m:M4(0,1.9,.1,-1.1,0,0,1,.4,1)}]);inst(g,std({color:0xe2e4e6,roughness:.4,metalness:.4,side:THREE.DoubleSide}),groups.dish);}
 if(groups.dome){const g=new THREE.SphereGeometry(1,24,12,0,PI*2,0,PI/2);inst(g,std({map:TX.plaster.map,normalMap:TX.plaster.normalMap,roughness:.9}),groups.dome);}
 if(groups.radome){const g=merge([{geo:new THREE.SphereGeometry(6.2,32,18,0,PI*2,0,PI*.62),m:M4(0,4.2,0)},{geo:CY(5.2,5.4,1.2,32),m:M4(0,.6,0)}]);inst(g,std({color:0xf2f4f6,roughness:.55,metalness:.05}),groups.radome);}
 if(groups.clock){const parts=[];for(let i=0;i<4;i++){const a=i*PI/2;parts.push({geo:new THREE.CircleGeometry(1.15,24),m:M4(Math.sin(a)*1.82,0,Math.cos(a)*1.82,0,a,0)});}const cg=merge(parts);inst(cg,std({color:0xf4ecd8,roughness:.5,emissive:dusk?0xffe0a0:0,emissiveIntensity:dusk?.6:0}),groups.clock,false);
  const hp=[];for(let i=0;i<4;i++){const a=i*PI/2;hp.push({geo:BX(.08,.8,.03),m:M4(Math.sin(a)*1.84,.3,Math.cos(a)*1.84,0,a,0)},{geo:BX(.6,.08,.03),m:M4(Math.sin(a)*1.84,0,Math.cos(a)*1.84,0,a,.5).multiply(M4(.25,0,0))});}inst(merge(hp),std({color:0x1a1a1a}),groups.clock,false);}
 if(groups.fueltank){const g=merge([{geo:CY(1.6,1.6,3.4,24),m:M4(0,1.7,0)},{geo:SP(1.6,20,8),m:M4(0,3.4,0,0,0,0,1,.18,1)},{geo:BX(.08,3.4,.08),m:M4(1.62,1.7,0)}]);inst(g,std({map:TX.metal.map,roughness:.45,metalness:.5}),groups.fueltank.map(p=>({...p,col:p.col??0xe8e8e8})));}
 if(groups.cable){const g=merge([{geo:CY(.9,.9,.08,18),m:M4(0,.05,0)},{geo:CY(.9,.9,.08,18),m:M4(0,1.05,0)},{geo:CY(.45,.45,1,14),m:M4(0,.55,0)}]);inst(g,std({map:TX.wood.map,roughness:.9}),groups.cable);}
 // vehicles
 const vmat={paint:k=>std({color:0xffffff,roughness:k==='wreck'?.95:.32,metalness:k==='wreck'?.2:.5,map:k==='wreck'?TX.metal.map:null}),dark:()=>std({color:0x141516,roughness:.8}),glass:()=>std({color:0x16222c,roughness:.05,metalness:.95}),
  lamp:()=>std({color:0x333333,emissive:dusk?0xfff0c0:0x000000,emissiveIntensity:dusk?2.5:0}),canvas:()=>std({color:0xffffff,map:TX.cloth,roughness:1}),chrome:()=>std({color:0x8a8e92,roughness:.3,metalness:.8})};
 for(const k of['truck','tanker','jeep','car','pickup','wreck','forklift'])if(groups[k]){const parts=vehicleParts(k==='wreck'?'car':k);for(const pk in parts){if(k==='wreck'&&(pk==='lamp'||pk==='glass'))continue;
  const list=groups[k].map(p=>({...p,col:pk==='paint'?(p.col??(k==='wreck'?0x4a3a2e:k==='forklift'?0xe8b020:0x5a6648)):pk==='canvas'?0x76734f:null}));inst(parts[pk],vmat[pk](k),list);}}
 // trees, palms, pines, rocks, bushes
 const bark=std({map:TX.bark,roughness:1}),leafM=(c,o={})=>std({map:TX.leaf,roughness:.95,color:c,...o});
 if(groups.tree){const tr=merge([{geo:CY(.12,.24,4,8),m:M4(0,2,0)},{geo:CY(.05,.09,1.8,6),m:M4(.45,3.4,0,0,0,-.7)},{geo:CY(.05,.09,1.6,6),m:M4(-.4,3.2,.2,.3,0,.7)}]);inst(tr,bark,groups.tree);
  const cn=[];const ico=new THREE.IcosahedronGeometry(1,1);for(const[x,y,z,s]of[[0,4.7,0,1.9],[1,4.2,.4,1.4],[-.9,4.4,-.3,1.5],[.2,5.7,-.2,1.25],[-.2,3.9,.9,1.2],[.5,5.1,-.9,1.1]])cn.push({geo:ico,m:M4(x,y,z,0,0,0,s,s*.85,s)});inst(merge(cn),leafM(L.leafCol??0x9ab070),groups.tree);}
 if(groups.pine){const tr=CY(.12,.24,3.2,7);tr.translate(0,1.6,0);inst(tr,bark,groups.pine);const cn=[],sn=[];for(const[y,r,h]of[[2.2,2.0,2.6],[3.6,1.6,2.4],[4.9,1.2,2.2],[6.1,.8,1.9],[7.2,.42,1.4]]){cn.push({geo:new THREE.ConeGeometry(r,h,10),m:M4(0,y,0)});if(L.snowTrees)sn.push({geo:new THREE.ConeGeometry(r*.82,h*.42,10),m:M4(0,y+h*.32,0)});}
  inst(merge(cn),leafM(L.pineCol??0x6a8a5a),groups.pine);if(sn.length)inst(merge(sn),std({color:0xf4f8ff,roughness:.7}),groups.pine);}
 if(groups.palm){// curved segmented trunk + arched frond cards
  const tp=[];const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new V(Math.sin(t*1.4)*.9,t*7,0));}tp.push({geo:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.2,8,false),m:new THREE.Matrix4()});for(let i=1;i<8;i++){const p=pts[i];tp.push({geo:new THREE.TorusGeometry(.21,.035,4,10),m:M4(p.x,p.y,0,PI/2)});}
  inst(merge(tp),std({map:TX.bark,color:0xfff0d8,roughness:1}),groups.palm);
  const fr=[];const top=pts[8];for(let i=0;i<9;i++){const a=i/9*PI*2;const pg=new THREE.PlaneGeometry(3.6,1.1,6,1);const pp=pg.attributes.position;for(let k=0;k<pp.count;k++){const x=pp.getX(k)+1.8;pp.setXYZ(k,x,pp.getY(k)*.5-x*x*.09,pp.getY(k)*.4);}pg.computeVertexNormals();
   fr.push({geo:pg,m:M4(top.x,top.y,0,0,a,(i%2?.25:.05)).multiply(M4(0,0,0,PI/2*.2))});}
  inst(merge(fr),std({map:TX.palm,alphaTest:.45,side:THREE.DoubleSide,roughness:.9,color:0xd8e8c0}),groups.palm,true);}
 const hs3=(x,y,z)=>{const v=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return v-Math.floor(v);};
 if(groups.bush||groups.shrub){const g=new THREE.IcosahedronGeometry(1,2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),s=.8+hs3(Math.round(x*100),Math.round(y*100),Math.round(z*100))*.35;p.setXYZ(i,x*s,Math.max(-.3,y)*s*.7,z*s);}g.computeVertexNormals();g.translate(0,.35,0);
  if(groups.bush)inst(g,leafM(L.bushCol??0xb0c890),groups.bush,false);if(groups.shrub)inst(g,leafM(0xc8b880,{color:0xb8a878}),groups.shrub,false);}
 if(groups.rock){const g=new THREE.IcosahedronGeometry(.9,2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=hs3(Math.round(x*100),Math.round(y*100),Math.round(z*100)),s=.82+k*.22+Math.sin(x*3+z*2)*.08;p.setXYZ(i,x*s*1.1,Math.max(-.2,y)*s*.62,z*s);}g.computeVertexNormals();g.translate(0,.35,0);inst(g,std({map:TX.concrete.map,normalMap:TX.concrete.normalMap,color:L.rockCol??0xb0a898,roughness:.95}),groups.rock);}
 // static helicopters (exfil decor)
 if(groups.heli){for(const p of groups.heli){const h=makeHeli();h.position.set(p.x,p.y,p.z);h.rotation.y=p.rot;G.add(h);(L.helis=L.helis||[]).push(h);}}
 // street lamps
 const lampList=L.lamps.filter(l=>!l.inside);if(lampList.length){const pole=merge([{geo:CY(.07,.11,5.4,8),m:M4(0,2.7,0)},{geo:BX(1.2,.08,.08),m:M4(.55,5.35,0)},{geo:BX(.5,.16,.32),m:M4(1.1,5.28,0)}]);
  inst(pole,std({color:0x2a2c30,roughness:.5,metalness:.7}),lampList.map(l=>({x:l.x,y:0,z:l.z,rot:l.rot||0})));const bulb=BX(.4,.04,.26);bulb.translate(1.1,5.2,0);
  inst(bulb,new THREE.MeshBasicMaterial({color:dusk?new THREE.Color(8,5.6,3):new THREE.Color(.9,.9,.85)}),lampList.map(l=>({x:l.x,y:0,z:l.z,rot:l.rot||0})),false);
  if(dusk){const cone=new THREE.CylinderGeometry(.14,1.8,5.1,20,1,true);cone.translate(0,-2.55,0);const cm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uC:{value:new THREE.Color(0xffb070).multiplyScalar(.09)}},
    vertexShader:'varying float vY;varying vec3 vN,vV;\n#include <common>\nvoid main(){vY=position.y;vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.);vN=normalize(normalMatrix*mat3(instanceMatrix)*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uC;varying float vY;varying vec3 vN,vV;void main(){float f=pow(abs(dot(vN,vV)),1.5);float h=smoothstep(-5.1,0.,vY);gl_FragColor=vec4(uC*f*h*h,1.);}'});
   inst(cone,cm,lampList.map(l=>{const a=l.rot||0;return{x:l.x+Math.cos(a)*1.1,y:5.2,z:l.z-Math.sin(a)*1.1,rot:0};}),false);}}
 const lights=[];if(dusk){let nl=0;const maxL=q>=2?10:q===1?6:3;for(const l of L.lamps){if(!l.light||nl>=maxL)continue;nl++;const pl=new THREE.PointLight(l.col||0xffb36a,l.inside?10:26,l.inside?10:20,1.6);
  const a=l.rot||0;pl.position.set(l.x+(l.inside?0:Math.cos(a)*1.1),l.inside?l.y:5,l.z-(l.inside?0:Math.sin(a)*1.1));G.add(pl);lights.push(pl);}}
 // grass tufts
 if(q>0&&L.grass.length){const tufts=[];const geo=new THREE.PlaneGeometry(.6,.45);geo.translate(0,.22,0);const g2=geo.clone().rotateY(PI/2);const cross=merge([{geo,m:new THREE.Matrix4()},{geo:g2,m:new THREE.Matrix4()}]);{const n=cross.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);}
  const nTot=q>=2?7000:3500;const area=L.grass.reduce((a,z)=>a+(z[2]-z[0])*(z[3]-z[1]),0);
  for(const z of L.grass){const n=Math.round(nTot*(z[2]-z[0])*(z[3]-z[1])/area);for(let i=0;i<n;i++){const x=z[0]+L.rnd()*(z[2]-z[0]),zz=z[1]+L.rnd()*(z[3]-z[1]);if(L.noGrass.some(r=>x>r[0]&&x<r[2]&&zz>r[1]&&zz<r[3]))continue;if(L.boxes.some(b=>b.solid&&x>b.x0-.3&&x<b.x1+.3&&zz>b.z0-.3&&zz<b.z1+.3))continue;tufts.push({x,y:0,z:zz,rot:L.rnd()*3,s:.6+L.rnd()*.8});}}
  const gmat=std({map:TX.grassCard,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:new THREE.Color(L.grassCol??0xc8d0a0)});
  gmat.onBeforeCompile=s=>{s.uniforms.uT=L.timeU;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);transformed.x+=sin(uT*1.7+wp0.x*.4+wp0.z*.3)*.08*position.y;');};
  if(tufts.length)inst(cross,gmat,tufts,false);}
 // distant silhouettes (skyline / ridges) beyond the terrain
 if(T.far){const geo=new THREE.CylinderGeometry(420,420,1,96,1,true);const p=geo.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)>0){const a=Math.atan2(p.getZ(i),p.getX(i));p.setY(i,T.far.h*(.5+.3*Math.sin(a*3+1)+.2*Math.sin(a*11)+.08*Math.sin(a*37)));}else p.setY(i,-5);}geo.computeVertexNormals();
  G.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:T.far.c,side:THREE.BackSide,fog:true})));}
 return{group:G,lights};}
