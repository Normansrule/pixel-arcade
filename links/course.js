// FAIRWAY LEGENDS — Gullhaven Links: nine procedurally built coastal holes. Each hole is a compact recipe (centreline,
// widths, bunkers, water, sea side, elevations) expanded here into a 2 m heightfield plus surface "margin" fields
// (fairway, green, sand, rough) that both the ground shader and the physics read, so what you see is what the ball feels.
// Pure JS: no three.js, so the CPU planner and node tests can use it.
export const CS=2,ENC=8;// cell size (m); field encoding: byte = 128 + margin*ENC
const cl=(v,a,b)=>v<a?a:v>b?b:v,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t;
// ---- seeded value noise ----
export function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hash(x,y,s){let h=(x*374761393+y*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
export function noise(x,y,s=0){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return(a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v)*2-1;}
export function fbm(x,y,s=0,o=4){let t=0,a=.5,f=1;for(let i=0;i<o;i++){t+=noise(x*f,y*f,s+i*17)*a;f*=2.03;a*=.5;}return t;}
// ---- the course ----
// pts: centreline (x left of the golfer at the tee, z down the hole), fw: fairway half width, fs: fairway start,
// gr: green radii [across, along], gb: greenside bunkers [angle (0 = behind), size], fb: fairway bunkers [s 0..1, lateral m, r],
// water: ponds {s, off, r:[a,b]} or {burn:s, w}, sea: {side 1 left / -1 right, d lateral m, cliff}, el: [tee, green] heights
export const HOLES=[
 {n:'HARBOUR GATE',par:4,pts:[[0,0],[-4,180],[-38,372]],fw:17,fs:40,gr:[15,13],gb:[[2.4,5],[-2.3,4.5]],fb:[[.6,17,5],[.55,-19,4.2]],el:[10,9],seed:11},
 {n:'GULL ROCK',par:3,pts:[[0,0],[6,72],[10,149]],fw:13,fs:95,gr:[14,12],gb:[[1.7,4.5],[-1.2,4],[.1,3.5]],fb:[],water:[{s:.5,off:2,r:[22,14]}],sea:{side:-1,d:34,cliff:1},el:[15,11],seed:23},
 {n:'LONG DUNES',par:5,pts:[[0,0],[14,200],[-18,370],[-8,512]],fw:18,fs:45,gr:[16,14],gb:[[2,5],[-2.6,4]],fb:[[.36,-17,5],[.56,2,4.5],[.6,-12,4],[.78,16,4.5]],water:[{s:.95,off:27,r:[13,10]}],el:[8,10],seed:37},
 {n:'LIGHTHOUSE',par:4,pts:[[0,0],[8,205],[30,412]],fw:16,fs:40,gr:[14,13],gb:[[-1.8,5],[2.6,4]],fb:[[.6,-16,5],[.66,12,4]],sea:{side:1,d:52,cliff:1},el:[14,12],lh:1,seed:41},
 {n:'SALTBURN',par:4,pts:[[0,0],[-6,175],[4,326]],fw:18,fs:40,gr:[14,12],gb:[[1.9,4.5],[-1.9,4.5]],fb:[[.55,-18,4.5]],water:[{burn:.78,w:3.2}],el:[9,9],seed:53},
 {n:'KITTIWAKE',par:3,pts:[[0,0],[-4,90],[-10,177]],fw:12,fs:110,gr:[13,13],gb:[[2.2,3.6],[-2.2,3.6],[1,3.4],[-1,3.4],[3.1,3.2]],fb:[],sea:{side:-1,d:42,cliff:0},el:[9,9],seed:67},
 {n:'WESTERLY',par:5,pts:[[0,0],[-14,225],[18,365],[50,494]],fw:19,fs:45,gr:[16,13],gb:[[-2,5],[2.8,4]],fb:[[.42,-19,5],[.62,0,4],[.7,15,4.5]],sea:{side:1,d:68,cliff:0},el:[8,8],seed:71},
 {n:'PUNCHBOWL',par:4,pts:[[0,0],[5,220],[-12,425]],fw:17,fs:40,gr:[17,15],gb:[[1.6,4.5],[-1.6,4.5]],fb:[[.55,16,5],[.6,-15,4.5],[.72,-2,3.5]],el:[11,7],bowl:1,seed:83},
 {n:'HOMEWARD',par:4,pts:[[0,0],[-15,200],[-5,393]],fw:18,fs:40,gr:[15,14],gb:[[2.3,4.5],[0,4]],fb:[[.56,18,5],[.6,-16,4.5]],water:[{s:.9,off:-19,r:[17,12]}],el:[9,9],club:1,seed:97}];
export const QUICK=[3,5,8];
export const COURSE='GULLHAVEN LINKS';
export const WIND_DIR=Math.PI*.15;// prevailing wind blows from the sea; trees lean with it

function catmull(pts,step){const P=pts.map(p=>({x:p[0],z:p[1]})),out=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
  const L=Math.hypot(p2.x-p1.x,p2.z-p1.z),n=Math.max(2,Math.ceil(L/step));for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;
   const f=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push({x:f(p0.x,p1.x,p2.x,p3.x),z:f(p0.z,p1.z,p2.z,p3.z)});}}
 out.push({x:P[P.length-1].x,z:P[P.length-1].z});let s=0;out.forEach((p,i)=>{if(i)s+=Math.hypot(p.x-out[i-1].x,p.z-out[i-1].z);p.s=s;});return out;}
// project (x,z) on the polyline: {s, u (signed lateral, + = left), d (true distance)}
function project(path,x,z,o){let best=1e18,bs=0,bu=0;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],ex=b.x-a.x,ez=b.z-a.z,l2=ex*ex+ez*ez;let t=((x-a.x)*ex+(z-a.z)*ez)/l2;
  const tc=t<0?0:t>1?1:t,px=a.x+ex*tc,pz=a.z+ez*tc,d2=(x-px)**2+(z-pz)**2;if(d2<best){best=d2;const l=Math.sqrt(l2);bs=a.s+t*l;bu=((x-a.x)*ez-(z-a.z)*ex)/l;}}
 o.s=bs;o.u=bu;o.d=Math.sqrt(best);return o;}

/** Expand hole i into terrain + fields. pinPick 0..1 picks the pin spot. */
export function buildHole(i,pinPick=Math.random()){const D=HOLES[i],R=rng(D.seed*7919+1),sd=D.seed;
 const path=catmull(D.pts,6),S=path[path.length-1].s,tee={x:path[0].x,z:path[0].z},gc={x:path[path.length-1].x,z:path[path.length-1].z};
 const yards=Math.round(S/.9144);const a=path[path.length-4],gdir=Math.atan2(gc.x-a.x,gc.z-a.z),t2=path[3],tdir=Math.atan2(t2.x-tee.x,t2.z-tee.z);
 const hd={x:gc.x-tee.x,z:gc.z-tee.z},hl=Math.hypot(hd.x,hd.z);hd.x/=hl;hd.z/=hl;const left={x:hd.z,z:-hd.x};
 // domain (multiple of 20 m so the far terrain grid lines up)
 let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;for(const p of path){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mnz=Math.min(mnz,p.z);mxz=Math.max(mxz,p.z);}
 const M=130;const x0=Math.floor((mnx-M)/20)*20,x1=Math.ceil((mxx+M)/20)*20,z0=Math.floor((mnz-70)/20)*20,z1=Math.ceil((mxz+100)/20)*20;
 const nx=(x1-x0)/CS+1,nz=(z1-z0)/CS+1;
 const [teeE,grE]=D.el,base=Math.min(teeE,grE);
 const sea=D.sea;const seaSide=sea?sea.side:0;
 // far/outer terrain: smooth dunes; also used at the domain border so the far mesh joins seamlessly
 const coast=(x,z)=>{if(!sea)return-1e9;const lat=(x-tee.x)*left.x*seaSide+(z-tee.z)*left.z*seaSide;const al=(x-tee.x)*hd.x+(z-tee.z)*hd.z;return lat-(sea.d+fbm(al/90,3.3,sd+5,3)*16);};
 const far=(x,z)=>{let h=base+4+fbm(x/170,z/170,sd+9,3)*8+Math.abs(fbm(x/60,z/60,sd+3,2))*4;const c=coast(x,z);if(c>-40){const t=ss(-40,sea.cliff?8:60,c);h=mix(h,-6,t);}return h;};
 // greens + bunkers + water specs
 const gr={x:gc.x,z:gc.z,rx:D.gr[0],rz:D.gr[1],rot:gdir,tx:(R()-.5)*.028,tz:(R()-.5)*.024-.008,ph:R()*6,amp:.05+R()*.05};
 const gpt=(ang,extra)=>{const a=gdir+ang,rr=(Math.abs(Math.cos(ang))*gr.rz+Math.abs(Math.sin(ang))*gr.rx)+extra;return{x:gc.x+Math.sin(a)*rr,z:gc.z+Math.cos(a)*rr};};
 const ptAt=(s,u)=>{let k=0;while(k<path.length-2&&path[k+1].s<s)k++;const p=path[k],q=path[k+1],t=cl((s-p.s)/(q.s-p.s||1),0,1),x=mix(p.x,q.x,t),z=mix(p.z,q.z,t),dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz)||1;return{x:x+dz/l*u,z:z-dx/l*u};};
 const bunkers=[];for(const[ang,r]of D.gb){const p=gpt(ang,r+3.4);bunkers.push({x:p.x,z:p.z,r,e:1+R()*.35,a:R()*3,dep:1.2+R()*.4});}
 for(const[s,u,r]of D.fb){const p=ptAt(s*S,u);bunkers.push({x:p.x,z:p.z,r,e:1+R()*.5,a:R()*3,dep:1.1+R()*.5});}
 const water=[];for(const w of D.water||[]){if(w.burn!=null)water.push({burn:w.burn*S,w:w.w});else{const p=ptAt(w.s*S,w.off);water.push({x:p.x,z:p.z,a:w.r[0],b:w.r[1],rot:R()*3});}}
 const trend=s=>mix(teeE,grE,ss(.1,.95,s/S));
 const pr={s:0,u:0,d:0};
 // corridor height (smooth, links humps)
 const corr=(x,z,s)=>trend(s)+fbm(x/42,z/42,sd+1,3)*1.5+fbm(x/13,z/13,sd+2,2)*.22;
 const dunes=(x,z)=>base+2.4+fbm(x/75,z/75,sd+4,3)*6+(1-Math.abs(noise(x/26,z/26,sd+6)))*2.6+fbm(x/8,z/8,sd+7,2)*.35;
 for(const w of water)if(w.burn==null){project(path,w.x,w.z,pr);w.lvl=corr(w.x,w.z,pr.s)-1;}else w.lvl=trend(w.burn)-1.1;
 const h=new Float32Array(nx*nz),F=new Uint8Array(nx*nz*4),A=new Uint8Array(nx*nz*4);
 const fwW=s=>D.fw+fbm(s/60,1.7,sd+11,2)*4,rW=s=>fwW(s)+9+fbm(s/40,4.1,sd+12,2)*5;
 const greenM=(x,z)=>{const dx=x-gr.x,dz=z-gr.z,c=Math.cos(gr.rot),s=Math.sin(gr.rot),lx=dx*c-dz*s,lz=dx*s+dz*c,e=Math.hypot(lx/gr.rx,lz/gr.rz);return(1-e)*Math.min(gr.rx,gr.rz)+noise(x/5,z/5,sd+20)*.9;};
 const greenH=(x,z)=>{const dx=x-gr.x,dz=z-gr.z;return grE+.5+gr.tx*dx+gr.tz*(dx*Math.sin(gdir)+dz*Math.cos(gdir))+gr.amp*Math.sin(dx*.21+gr.ph)*Math.cos(dz*.17-gr.ph)+gr.amp*.6*Math.sin((dx+dz)*.13);};
 const bunkM=(x,z,b)=>{const dx=x-b.x,dz=z-b.z,c=Math.cos(b.a),s=Math.sin(b.a),lx=dx*c-dz*s,lz=(dx*s+dz*c)/b.e;return b.r-Math.hypot(lx,lz)+noise(x/3,z/3,sd+30)*.6;};
 const teeM=(x,z)=>{const dx=x-tee.x,dz=z-tee.z,c=Math.cos(tdir),s=Math.sin(tdir),lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.min(6-Math.abs(lx),9-Math.abs(lz+2));};
 for(let j=0;j<nz;j++)for(let i2=0;i2<nx;i2++){const x=x0+i2*CS,z=z0+j*CS,k=j*nx+i2;project(path,x,z,pr);const s=pr.s,u=pr.u,d=pr.d;
  const fwe=fwW(s),rwe=rW(s);
  // ---- height ----
  const cf=ss(rwe+30,fwe+3,d);let y=mix(dunes(x,z),corr(x,z,s),cf);
  if(D.bowl){const gd=Math.hypot(x-gc.x,z-gc.z);y+=ss(gr.rx+30,gr.rx+8,gd)*3.2*ss(gr.rx+2,gr.rx+10,gd);}
  const tm=teeM(x,z);if(tm>-4){y=mix(y,teeE+.6,ss(-4,0,tm));}
  const gm=greenM(x,z);if(gm>-8){y=mix(y,greenH(x,z),ss(-8,-.5,gm));}
  let sm=-20;for(const b of bunkers){const m=bunkM(x,z,b);if(m>sm)sm=m;if(m>-2.5){y+=.35*ss(-2.5,-1,m)*(1-ss(-.6,0,m));y-=b.dep*ss(-.4,1.6,m);}}
  for(const w of water){if(w.burn!=null){const q=Math.abs(s-w.burn)-w.w;if(q<6){y=Math.min(y,mix(w.lvl-1.3,Math.max(y,w.lvl+.5),ss(-1.5,6,q)));}}
   else{const dx=x-w.x,dz=z-w.z,c=Math.cos(w.rot),sn=Math.sin(w.rot),e=Math.hypot((dx*c-dz*sn)/w.a,(dx*sn+dz*c)/w.b)+noise(x/6,z/6,sd+40)*.08;
    if(e<1.6){const t=ss(1.35,.85,e)*ss(-6,-3,gm);y=mix(Math.max(y,w.lvl+.35+(e-1)*2),w.lvl-1.6,t);}}}
  const ct=coast(x,z);if(sea&&ct>-30){y=mix(y,-5,ss(-2,sea.cliff?7:40,ct));if(!sea.cliff&&ct>-6)y=Math.min(y,mix(y,1.2-ct*.06,ss(-6,4,ct)));}
  // join the far terrain at the border
  const bd=Math.min(i2,nx-1-i2,j,nz-1-j)*CS;if(bd<36){y=mix(far(x,z),y,ss(0,36,bd));}
  h[k]=y;
  // ---- fields (margins in metres, + = inside) ----
  let mf=s<D.fs||s>S?-30:fwe-Math.abs(u)+noise(x/9,z/9,sd+50)*1.4;mf=Math.min(mf,(s-D.fs)*.8);if(tm>-30)mf=Math.max(mf,tm);
  let mr=rwe-d+noise(x/7,z/7,sd+51)*2.2;mr=Math.max(mr,gm+9);if(tm>-30)mr=Math.max(mr,tm+5);
  let msd=sm;if(sea&&!sea.cliff&&ct>-14)msd=Math.max(msd,(ct+8)*1.4+noise(x/7,z/7,sd+52)*2);
  const e=(m)=>cl(Math.round(128+m*ENC),0,255);F[k*4]=e(mf);F[k*4+1]=e(gm);F[k*4+2]=e(msd);F[k*4+3]=e(mr);
  let dep=-9;if(sea&&ct>-60)dep=-y;for(const w of water){if(w.burn!=null){if(Math.abs(s-w.burn)<w.w+6)dep=Math.max(dep,w.lvl-y);}else if(Math.hypot(x-w.x,z-w.z)<Math.max(w.a,w.b)*1.7)dep=Math.max(dep,w.lvl-y);}
  A[k*4]=e(ct);A[k*4+1]=bd<6?0:255;A[k*4+2]=cl(Math.round(dep*40),0,255);A[k*4+3]=255;}
 // smooth the heightfield a touch outside greens (removes 2 m stair-steps on the noise)
 const H2=h.slice();for(let j=1;j<nz-1;j++)for(let i2=1;i2<nx-1;i2++){const k=j*nx+i2;if(F[k*4+1]>64)continue;H2[k]=(h[k]*4+h[k-1]+h[k+1]+h[k-nx]+h[k+nx])/8;}h.set(H2);
 // pin: random spot on the green at least 3.5 m in
 const pins=[];for(let tries=0;tries<400&&pins.length<30;tries++){const a=R()*6.283,r=R()*Math.max(gr.rx,gr.rz),x=gc.x+Math.sin(a)*r,z=gc.z+Math.cos(a)*r;if(greenM(x,z)>3.5)pins.push({x,z});}
 const pin=pins.length?pins[Math.floor(pinPick*pins.length)%pins.length]:{x:gc.x,z:gc.z};
 const T={i,def:D,name:D.n,par:D.par,yards,path,S,tee,gc,gr,pin,bunkers,water,sea,x0,z0,x1,z1,nx,nz,hf:h,F,A,tdir,gdir,hd,left,coast,far,trees:[],
  hRaw(x,z){const fx=cl((x-x0)/CS,0,nx-1.001),fz=cl((z-z0)/CS,0,nz-1.001),ix=fx|0,iz=fz|0,tx=fx-ix,tz=fz-iz,k=iz*nx+ix;return(h[k]*(1-tx)+h[k+1]*tx)*(1-tz)+(h[k+nx]*(1-tx)+h[k+nx+1]*tx)*tz;},
  h(x,z){if(x<x0||x>x1||z<z0||z>z1)return far(x,z);return T.hRaw(x,z);},
  n(x,z,o){const e=.6,a=T.h(x-e,z)-T.h(x+e,z),b=T.h(x,z-e)-T.h(x,z+e),l=Math.hypot(a,2*e,b);o.x=a/l;o.y=2*e/l;o.z=b/l;return o;},
  field(x,z,c){const fx=cl((x-x0)/CS,0,nx-1.001),fz=cl((z-z0)/CS,0,nz-1.001),ix=fx|0,iz=fz|0,tx=fx-ix,tz=fz-iz,k=(iz*nx+ix)*4+c;return((F[k]*(1-tx)+F[k+4]*tx)*(1-tz)+(F[k+nx*4]*(1-tx)+F[k+nx*4+4]*tx)*tz-128)/ENC;},
  inb(x,z){return x>x0+8&&x<x1-8&&z>z0+8&&z<z1-8;},
  wet(x,z,y){if(y<.05&&T.coast(x,z)>-60)return true;for(const w of water){if(w.burn!=null){project(path,x,z,pr);if(Math.abs(pr.s-w.burn)<w.w+4&&y<w.lvl)return true;}else if(Math.hypot(x-w.x,z-w.z)<Math.max(w.a,w.b)*1.7&&y<w.lvl)return true;}return false;},
  surf(x,z){const y=T.h(x,z);if(T.wet(x,z,y))return'water';if(!T.inb(x,z))return'ob';if(T.field(x,z,1)>0)return'green';if(T.field(x,z,1)>-1.6)return'fringe';if(T.field(x,z,2)>0)return'sand';
   if(T.field(x,z,0)>0)return Math.hypot(x-tee.x,z-tee.z)<12?'tee':'fairway';if(T.field(x,z,3)>0)return'rough';return'deep';},
  tree(x,y,z){for(const t of T.trees){const dx=x-t.cx,dz=z-t.cz;if(dx*dx+dz*dz<t.cr*t.cr){const dy=y-t.cy;if(dx*dx+dy*dy*1.6+dz*dz<t.cr*t.cr)return true;}}return false;},
  proj(x,z){return project(path,x,z,{s:0,u:0,d:0});},ptAt};
 // wind-bent trees out in the dunes, away from the line of play
 const wl=WIND_DIR;for(let tries=0;tries<900&&T.trees.length<(D.trees||46);tries++){const x=x0+30+R()*(x1-x0-60),z=z0+30+R()*(z1-z0-60);project(path,x,z,pr);
  if(pr.d<rW(pr.s)+7||Math.hypot(x-tee.x,z-tee.z)<22||Math.hypot(x-gc.x,z-gc.z)<gr.rx+22)continue;const y=T.h(x,z);if(y<1.5||T.wet(x,z,y))continue;if(sea&&T.coast(x,z)>-12)continue;
  const sc=.75+R()*.7,hh=7*sc,lean=.25+R()*.25;// clusters
  T.trees.push({x,z,y,s:sc,rot:R()*6.283,lean,cx:x+Math.sin(wl)*hh*lean*.8,cz:z+Math.cos(wl)*hh*lean*.8,cy:y+hh*.78,cr:2.8*sc});
  if(R()<.5){const a=R()*6.283,r=5+R()*5,x2=x+Math.cos(a)*r,z2=z+Math.sin(a)*r,y2=T.h(x2,z2);if(y2>1.5&&!T.wet(x2,z2,y2)){project(path,x2,z2,pr);if(pr.d>rW(pr.s)+7){const s2=.6+R()*.5,h2=7*s2;T.trees.push({x:x2,z:z2,y:y2,s:s2,rot:R()*6.283,lean,cx:x2+Math.sin(wl)*h2*lean*.8,cz:z2+Math.cos(wl)*h2*lean*.8,cy:y2+h2*.78,cr:2.8*s2});}}}}
 return T;}
/** Where to drop after water / out of bounds: walk from the entry point back towards `from` to dry, playable ground. */
export function dropSpot(T,entry,from){const dx=from.x-entry.x,dz=from.z-entry.z,L=Math.hypot(dx,dz)||1;
 for(let d=2;d<L+40;d+=1.5){const t=Math.min(d,L),x=entry.x+dx/L*t,z=entry.z+dz/L*t;const s=T.surf(x,z);if(s!=='water'&&s!=='ob'&&s!=='sand'&&T.inb(x,z)){const x2=entry.x+dx/L*Math.min(L,t+2),z2=entry.z+dz/L*Math.min(L,t+2);const s2=T.surf(x2,z2);return s2!=='water'&&s2!=='ob'?{x:x2,z:z2}:{x,z};}}
 return{x:from.x,z:from.z};}
