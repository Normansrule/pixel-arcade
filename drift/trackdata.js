// SIDEWAYS — track definitions + pure geometry maths (no rendering, importable from node for tests).
// Conventions: y up, yaw 0 faces +z, forward = (sin yaw, cos yaw), left = (cos yaw, -sin yaw).
// A sampled track stores, per metre-ish sample: centre (x,y,z), unit tangent t, LEFT normal n, half width,
// wall offsets (left/right, measured from the centre), curvature (+ = turning left) and arc length.

export const TRACKS=[
 {id:'pass',name:'SERPENT PASS',sub:'NIGHT · MOUNTAIN TOUGE',blurb:'Three tight switchbacks up the ridge, a flowing descent back down and the whole city glittering below the guardrail.',
  w:5.2,shoulder:.55,ribbon:true,time:'night',
  // [x, z, y]
  pts:[[0,-30,0],[0,60,2.2],[1,140,5.5],[8,176,7],[26,192,8],[46,186,9],[56,166,10.5],[56,110,14],[55,40,18],[58,8,20],[72,-6,21],[92,-2,22],[103,14,23.5],[105,60,27],[106,130,32],[110,170,35],[126,188,37],[148,186,39],[166,166,41],[178,120,44],[204,74,46],[252,52,46],[296,10,44],[312,-50,41],[294,-110,37],[256,-138,33],[214,-128,30],[176,-150,27],[150,-196,24],[106,-214,20],[60,-196,15],[34,-160,11],[34,-118,7.5],[16,-84,4],[2,-60,1.5]]},
 {id:'docks',name:'PORT NINE',sub:'RAIN · HARBOUR DOCKS',blurb:'Slick wet concrete between container stacks, gantry cranes overhead and black water one mistake away.',
  w:7,shoulder:1.2,ribbon:true,time:'rain',
  pts:[[0,-120,0],[0,40,0],[4,120,0],[26,158,0],[70,170,0],[150,168,0],[196,150,0],[214,110,0],[212,70,0],[230,40,0],[272,30,0],[318,24,0],[350,-4,0],[352,-52,0],[326,-84,0],[280,-92,0],[232,-80,0],[196,-54,0],[156,-74,0],[120,-104,0],[76,-104,0],[44,-140,0],[22,-170,0],[4,-158,0]]},
 {id:'ring',name:'EMBER RING',sub:'SUNSET · DRIFT CIRCUIT',blurb:'A purpose-built drift circuit: wide sweepers, long-angle bowls and kerbs painted for the judges.',
  w:9,shoulder:5.5,ribbon:true,time:'sunset',
  pts:[[0,-140,0],[0,90,0],[22,170,0],[90,214,0],[176,206,0],[236,150,0],[240,80,0],[196,30,0],[170,-20,0],[200,-80,0],[270,-104,0],[330,-150,0],[322,-236,0],[250,-286,0],[150,-276,0],[90,-236,0],[50,-250,0],[14,-226,0]]},
 {id:'lot',name:'LOT 22',sub:'FREE ROAM · PRACTICE',blurb:'An empty floodlit parking lot after closing. Donuts, figure-eights, pillars to clip, nobody to complain.',
  ribbon:false,time:'night',W:130,L:95}];

/* ---------- centripetal Catmull-Rom (closed) ---------- */
function crPoint(p0,p1,p2,p3,t){// centripetal parametrisation, alpha=.5
 const d=(a,b)=>Math.pow(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])||1e-4,.5);
 const t0=0,t1=t0+d(p0,p1),t2=t1+d(p1,p2),t3=t2+d(p2,p3),tt=t1+(t2-t1)*t,o=[0,0,0];
 for(let k=0;k<3;k++){const A1=(t1-tt)/(t1-t0)*p0[k]+(tt-t0)/(t1-t0)*p1[k],A2=(t2-tt)/(t2-t1)*p1[k]+(tt-t1)/(t2-t1)*p2[k],A3=(t3-tt)/(t3-t2)*p2[k]+(tt-t2)/(t3-t2)*p3[k];
  const B1=(t2-tt)/(t2-t0)*A1+(tt-t0)/(t2-t0)*A2,B2=(t3-tt)/(t3-t1)*A2+(tt-t1)/(t3-t1)*A3;o[k]=(t2-tt)/(t2-t1)*B1+(tt-t1)/(t2-t1)*B2;}
 return o;}

export const STEP=1.5;
export function sampleTrack(def){
 const P=def.pts.map(p=>[p[0],p[2]||0,p[1]]),n0=P.length,dense=[];let L=0,prev=null;
 for(let i=0;i<n0;i++){const p0=P[(i-1+n0)%n0],p1=P[i],p2=P[(i+1)%n0],p3=P[(i+2)%n0];for(let k=0;k<60;k++){const q=crPoint(p0,p1,p2,p3,k/60);if(prev)L+=Math.hypot(q[0]-prev[0],q[2]-prev[2]);dense.push([q[0],q[1],q[2],L]);prev=q;}}
 L+=Math.hypot(dense[0][0]-prev[0],dense[0][2]-prev[2]);dense.push([dense[0][0],dense[0][1],dense[0][2],L]);
 const n=Math.round(L/STEP),st=L/n;
 const B={def,n,len:L,step:st,x:new Float32Array(n),y:new Float32Array(n),z:new Float32Array(n),tx:new Float32Array(n),tz:new Float32Array(n),nx:new Float32Array(n),nz:new Float32Array(n),
  hw:new Float32Array(n),wl:new Float32Array(n),wr:new Float32Array(n),curv:new Float32Array(n),s:new Float32Array(n),slope:new Float32Array(n)};
 let j=0;for(let i=0;i<n;i++){const l=i*st;while(j<dense.length-2&&dense[j+1][3]<l)j++;const a=dense[j],b=dense[j+1],f=b[3]>a[3]?(l-a[3])/(b[3]-a[3]):0;
  B.x[i]=a[0]+(b[0]-a[0])*f;B.y[i]=a[1]+(b[1]-a[1])*f;B.z[i]=a[2]+(b[2]-a[2])*f;B.s[i]=l;}
 // smooth elevation a little so the road has no kinks
 for(let it=0;it<6;it++){const y=B.y.slice();for(let i=0;i<n;i++)B.y[i]=(y[(i-2+n)%n]+y[(i-1+n)%n]+y[i]+y[(i+1)%n]+y[(i+2)%n])/5;}
 for(let i=0;i<n;i++){const a=(i-1+n)%n,b=(i+1)%n;let dx=B.x[b]-B.x[a],dz=B.z[b]-B.z[a];const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;B.tx[i]=dx;B.tz[i]=dz;B.nx[i]=dz;B.nz[i]=-dx;B.slope[i]=(B.y[b]-B.y[a])/d;}
 for(let i=0;i<n;i++){const a=(i-4+n)%n,b=(i+4)%n;let da=Math.atan2(B.tx[a],B.tz[a])-Math.atan2(B.tx[b],B.tz[b]);while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;B.curv[i]=da/(8*st);}
 // curvature sign: + when the road bends LEFT. (atan2(tx,tz) is yaw; a left turn increases yaw... we computed a-b so negate)
 for(let i=0;i<n;i++)B.curv[i]=-B.curv[i];
 const c2=B.curv.slice();for(let i=0;i<n;i++){let s=0;for(let k=-6;k<=6;k++)s+=c2[(i+k+n)%n];B.curv[i]=s/13;}
 // width: a touch wider in tight corners so hairpins stay drivable
 for(let i=0;i<n;i++){const k=Math.abs(B.curv[i]);B.hw[i]=def.w*(1+Math.min(.45,k*8));}
 const hw=B.hw.slice();for(let i=0;i<n;i++){let s=0;for(let k=-10;k<=10;k++)s+=hw[(i+k+n)%n];B.hw[i]=s/21;}
 for(let i=0;i<n;i++){B.wl[i]=B.hw[i]+def.shoulder;B.wr[i]=B.hw[i]+def.shoulder;}
 B.grid=buildGrid(B);
 return B;}

/* spatial hash so a query from anywhere finds the nearest centre sample fast */
function buildGrid(B){const C=24,g=new Map();for(let i=0;i<B.n;i++){const k=(Math.floor(B.x[i]/C))+','+(Math.floor(B.z[i]/C));if(!g.has(k))g.set(k,[]);g.get(k).push(i);}return{C,g};}
export function nearestGlobal(B,x,z){const{C,g}=B.grid,cx=Math.floor(x/C),cz=Math.floor(z/C);let best=-1,bd=1e18;
 for(let r=0;r<6&&best<0||r<2;r++){for(let i=-r;i<=r;i++)for(let k=-r;k<=r;k++){if(Math.max(Math.abs(i),Math.abs(k))!==r)continue;const a=g.get((cx+i)+','+(cz+k));if(!a)continue;for(const s of a){const d=(B.x[s]-x)**2+(B.z[s]-z)**2;if(d<bd){bd=d;best=s;}}}if(r>40)break;}
 return best<0?0:best;}
// local search from a hint index (walks downhill on distance)
export function nearest(B,x,z,hint){const n=B.n;if(hint==null||hint<0)return nearestGlobal(B,x,z);let i=hint,d=(B.x[i]-x)**2+(B.z[i]-z)**2;
 for(let it=0;it<400;it++){const a=(i+1)%n,b=(i-1+n)%n,da=(B.x[a]-x)**2+(B.z[a]-z)**2,db=(B.x[b]-x)**2+(B.z[b]-z)**2;if(da<d){i=a;d=da;}else if(db<d){i=b;d=db;}else break;}
 if(d>900)return nearestGlobal(B,x,z);return i;}
// frame at a world point: index, lateral offset (+left), along-fraction, interpolated height and height gradient
export function frame(B,x,z,hint,out={}){const i=nearest(B,x,z,hint),n=B.n;const dx=x-B.x[i],dz=z-B.z[i];const along=dx*B.tx[i]+dz*B.tz[i];
 const j=along>=0?(i+1)%n:(i-1+n)%n,f=Math.min(1,Math.abs(along)/B.step);const y=B.y[i]+(B.y[j]-B.y[i])*f;
 out.i=i;out.d=dx*B.nx[i]+dz*B.nz[i];out.y=y;out.gx=B.slope[i]*B.tx[i];out.gz=B.slope[i]*B.tz[i];out.s=(B.s[i]+along+B.len)%B.len;return out;}
// signed progress difference a-b along a loop, in (-len/2, len/2]
export function sdiff(B,a,b){let d=a-b;while(d>B.len/2)d-=B.len;while(d<=-B.len/2)d+=B.len;return d;}

/* ---------- auto clipping points: outer zone on the apex of every real corner ---------- */
export function clipPoints(B){const out=[],n=B.n;let i=0;const thr=.012;
 while(i<n){if(Math.abs(B.curv[i])>thr){let j=i,pk=i;while(j<i+n&&Math.abs(B.curv[j%n])>thr*.7&&Math.sign(B.curv[j%n])===Math.sign(B.curv[i])){if(Math.abs(B.curv[j%n])>Math.abs(B.curv[pk%n]))pk=j;j++;}
   const len=(j-i)*B.step;if(len>14){const k=pk%n,side=-Math.sign(B.curv[k]);// outside of the corner
    out.push({i:k,side,kind:'outer',x:B.x[k]+B.nx[k]*side*(B.hw[k]-1.6),z:B.z[k]+B.nz[k]*side*(B.hw[k]-1.6),y:B.y[k],r:3.4});
    const k2=(k+Math.round(-8/B.step)+n)%n;out.push({i:k2,side:-side,kind:'inner',x:B.x[k2]-B.nx[k2]*side*(B.hw[k2]-1.4),z:B.z[k2]-B.nz[k2]*side*(B.hw[k2]-1.4),y:B.y[k2],r:2.6});}
   i=j+1;}else i++;}
 return out;}

/* ---------- lot layout (free roam) ---------- */
export function lotLayout(def){const W=def.W,L=def.L,circles=[],boxes=[];
 // light poles on islands + concrete pillars to clip
 for(const x of[-70,0,70])for(const z of[-38,38]){boxes.push({x,z,hx:13,hz:2.2,h:.25,kind:'island'});circles.push({x:x-11,z,r:.35,kind:'pole'});circles.push({x:x+11,z,r:.35,kind:'pole'});}
 for(const[x,z]of[[-35,0],[35,0],[-100,0],[100,0]])circles.push({x,z,r:1.1,kind:'pillar'});
 const clips=[];for(const c of circles)if(c.kind==='pillar')clips.push({x:c.x,z:c.z,y:0,r:4.2,kind:'pillar'});
 return{W,L,circles,boxes,clips};}
