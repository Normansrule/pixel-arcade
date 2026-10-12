// ORBIT LAB — orbital mechanics + flight physics. Pure JS (no three.js) so it runs headless in node for unit tests.
// Units: metres, seconds, kilograms, newtons. Frame: body-centred inertial, +Y = orbit normal (north), launch site at +X.
export const G0=9.80665;

/* ---------- tiny vector + quaternion maths (arrays) ---------- */
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
export const madd=(a,b,s)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s];
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const len=a=>Math.hypot(a[0],a[1],a[2]);
export const norm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
export const clamp=(v,a,b)=>v<a?a:v>b?b:v;
export const angleBetween=(a,b)=>Math.atan2(len(cross(a,b)),dot(a,b));
export const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
export const qconj=q=>[-q[0],-q[1],-q[2],q[3]];
export const qnorm=q=>{const l=Math.hypot(q[0],q[1],q[2],q[3])||1;return[q[0]/l,q[1]/l,q[2]/l,q[3]/l];};
export const qaxis=(ax,an)=>{const s=Math.sin(an/2);return[ax[0]*s,ax[1]*s,ax[2]*s,Math.cos(an/2)];};
export function qrot(q,v){const[x,y,z,w]=q;const ix=w*v[0]+y*v[2]-z*v[1],iy=w*v[1]+z*v[0]-x*v[2],iz=w*v[2]+x*v[1]-y*v[0],iw=-x*v[0]-y*v[1]-z*v[2];
 return[ix*w-iw*x-iy*z+iz*y,iy*w-iw*y-iz*x+ix*z,iz*w-iw*z-ix*y+iy*x];}
export function qFromTo(a,b){const d=dot(a,b);if(d<-.999999){let ax=cross([1,0,0],a);if(len(ax)<1e-6)ax=cross([0,1,0],a);return qaxis(norm(ax),Math.PI);}const c=cross(a,b);return qnorm([c[0],c[1],c[2],1+d]);}
// orientation whose +Y (nose) = n and +X (right) as close as possible to r
export function qLook(n,r){n=norm(n);let x=sub(r,mul(n,dot(r,n)));if(len(x)<1e-6)x=cross(n,[0,0,1]);x=norm(x);const z=cross(x,n);
 const m00=x[0],m01=n[0],m02=z[0],m10=x[1],m11=n[1],m12=z[1],m20=x[2],m21=n[2],m22=z[2],tr=m00+m11+m22;let q;
 if(tr>0){const s=.5/Math.sqrt(tr+1);q=[(m21-m12)*s,(m02-m20)*s,(m10-m01)*s,.25/s];}
 else if(m00>m11&&m00>m22){const s=2*Math.sqrt(1+m00-m11-m22);q=[.25*s,(m01+m10)/s,(m02+m20)/s,(m21-m12)/s];}
 else if(m11>m22){const s=2*Math.sqrt(1+m11-m00-m22);q=[(m01+m10)/s,.25*s,(m12+m21)/s,(m02-m20)/s];}
 else{const s=2*Math.sqrt(1+m22-m00-m11);q=[(m02+m20)/s,(m12+m21)/s,.25*s,(m10-m01)/s];}return qnorm(q);}

/* ---------- the system: planet VERDA, its moon LUNE, a station ---------- */
export const VERDA={id:'verda',name:'VERDA',R:300000,g:9.81,atm:70000,rho0:1.1,H:6500,soi:Infinity};
VERDA.mu=VERDA.g*VERDA.R*VERDA.R;
export const LUNE={id:'lune',name:'LUNE',R:80000,g:1.63,atm:0,a:4000000,theta0:2.1};
LUNE.mu=LUNE.g*LUNE.R*LUNE.R;LUNE.n=Math.sqrt(VERDA.mu/LUNE.a**3);LUNE.T=2*Math.PI/LUNE.n;LUNE.soi=LUNE.a*(LUNE.mu/VERDA.mu)**.4;
export const BODY={verda:VERDA,lune:LUNE};
export const STATION={r:VERDA.R+120000,theta0:.9};STATION.n=Math.sqrt(VERDA.mu/STATION.r**3);
export const SUN=norm([.45,.22,-.86]);
export const LAUNCH=[1,0,0];        // launch-site direction on VERDA (equator); east = -Z
const circ=(a,n,th0,t)=>{const th=th0+n*t;return{r:[a*Math.cos(th),0,-a*Math.sin(th)],v:[-a*n*Math.sin(th),0,-a*n*Math.cos(th)]};};
export const luneState=t=>circ(LUNE.a,LUNE.n,LUNE.theta0,t);
export const lunePos=t=>luneState(t).r;
export const stationState=t=>circ(STATION.r,STATION.n,STATION.theta0,t);
export const phaseAngle=r=>Math.atan2(-r[2],r[0]); // angle in the orbital plane, increasing prograde

/* ---------- atmosphere ---------- */
const EA=Math.exp(-VERDA.atm/VERDA.H);
export function density(body,h){if(!body.atm||h>=body.atm)return 0;h=Math.max(0,h);return body.rho0*(Math.exp(-h/body.H)-EA)/(1-EA);}
export const pressureRatio=(body,h)=>body.atm?density(body,h)/body.rho0:0;

/* ---------- Kepler propagation (universal variables, Curtis ch.3) ---------- */
function stS(z){if(z>1e-6){const s=Math.sqrt(z);return(s-Math.sin(s))/(s*s*s);}if(z<-1e-6){const s=Math.sqrt(-z);return(Math.sinh(s)-s)/(s*s*s);}return 1/6-z/120+z*z/5040;}
function stC(z){if(z>1e-6)return(1-Math.cos(Math.sqrt(z)))/z;if(z<-1e-6)return(Math.cosh(Math.sqrt(-z))-1)/(-z);return .5-z/24+z*z/720;}
export function kepler(r0,v0,dt,mu){
 if(dt===0)return{r:r0.slice(),v:v0.slice()};
 const r0n=len(r0),vr0=dot(r0,v0)/r0n,sm=Math.sqrt(mu),alpha=2/r0n-dot(v0,v0)/mu;
 if(alpha>1e-12){const T=2*Math.PI/Math.sqrt(mu*alpha**3);dt=dt%T;if(dt===0)return{r:r0.slice(),v:v0.slice()};}
 const A=r0n*vr0/sm,B=1-alpha*r0n;
 const F=x=>{const z=alpha*x*x;return A*x*x*stC(z)+B*x*x*x*stS(z)+r0n*x-sm*dt;};
 const dF=x=>{const z=alpha*x*x;return A*x*(1-z*stS(z))+B*x*x*stC(z)+r0n;};
 // bracket (time of flight is monotonic in chi) then safeguarded Newton
 let lo,hi,x;const sg=Math.sign(dt);
 if(alpha>1e-12){x=sm*alpha*dt;}else if(alpha<-1e-12){const a=1/alpha;const den=dot(r0,v0)+sg*Math.sqrt(-mu*a)*(1-r0n*alpha);x=sg*Math.sqrt(-a)*Math.log(Math.max(1e-12,(-2*mu*alpha*dt)/(den||1e-12)));if(!isFinite(x))x=sm*dt/r0n;}else x=sm*dt/r0n;
 let step=Math.abs(x)||sm*Math.abs(dt)/r0n||1;lo=0;hi=0;
 if(sg>0){lo=0;hi=Math.max(x,step);let k=0;while(F(hi)<0&&k++<200)hi*=2;}else{hi=0;lo=Math.min(x,-step);let k=0;while(F(lo)>0&&k++<200)lo*=2;}
 if(x<=lo||x>=hi)x=(lo+hi)/2;
 for(let i=0;i<80;i++){const f=F(x);if(Math.abs(f)<1e-7*Math.max(1,sm*Math.abs(dt)))break;if(f>0)hi=x;else lo=x;let nx=x-f/dF(x);if(!(nx>lo&&nx<hi))nx=(lo+hi)/2;if(Math.abs(nx-x)<1e-12*Math.max(1,Math.abs(x))){x=nx;break;}x=nx;}
 const z=alpha*x*x,S=stS(z),C=stC(z);const f=1-x*x/r0n*C,g=dt-x*x*x*S/sm;const r=add(mul(r0,f),mul(v0,g));const rn=len(r);
 const fd=sm/(rn*r0n)*(alpha*x*x*x*S-x),gd=1-x*x/rn*C;return{r,v:add(mul(r0,fd),mul(v0,gd))};}

/* ---------- orbital elements ---------- */
export function elements(r,v,mu){const rn=len(r),v2=dot(v,v),h=cross(r,v),hn=len(h)||1e-9;const eps=v2/2-mu/rn,a=-mu/(2*eps);
 const ev=sub(mul(cross(v,h),1/mu),mul(r,1/rn)),e=len(ev),p=hn*hn/mu;const rp=p/(1+e),ra=eps<0?2*a-rp:Infinity;
 const P=e>1e-7?mul(ev,1/e):mul(r,1/rn),hh=mul(h,1/hn),Q=norm(cross(hh,P));
 let nu=Math.atan2(dot(r,Q),dot(r,P));
 const T=e<1?2*Math.PI*Math.sqrt(a*a*a/mu):Infinity;
 const tpe=timeFromPe(nu,e,a,mu);
 const toPe=e<1?((T-tpe)%T+T)%T:-tpe,toAp=e<1?((T/2-tpe)%T+T)%T:Infinity;
 return{a,e,p,rp,ra,T,h,hn,hh,P,Q,nu,eps,mu,inc:Math.acos(clamp(hh[1],-1,1)),toPe,toAp,tpe,r:rn,v:Math.sqrt(v2),vr:dot(r,v)/rn};}
// time since periapsis for true anomaly nu (negative before periapsis for open orbits)
export function timeFromPe(nu,e,a,mu){
 if(e<1){const E=2*Math.atan(Math.sqrt((1-e)/(1+e))*Math.tan(nu/2));const M=E-e*Math.sin(E);return M/Math.sqrt(mu/(a*a*a));}
 const Fh=2*Math.atanh(clamp(Math.sqrt((e-1)/(e+1))*Math.tan(nu/2),-.999999999,.999999999));const M=e*Math.sinh(Fh)-Fh;return M/Math.sqrt(mu/(-a)**3);}
export const posAt=(el,nu)=>{const rr=el.p/(1+el.e*Math.cos(nu));return add(mul(el.P,rr*Math.cos(nu)),mul(el.Q,rr*Math.sin(nu)));};
export const vCirc=(mu,r)=>Math.sqrt(mu/r);
export const visViva=(mu,r,a)=>Math.sqrt(Math.max(0,mu*(2/r-1/a)));
export const period=(mu,a)=>2*Math.PI*Math.sqrt(a*a*a/mu);

/* ---------- textbook formulas (used by UI + unit tests) ---------- */
export const tsiolkovsky=(isp,m0,mf)=>isp*G0*Math.log(m0/mf);
export const burnTime=(mp,isp,F)=>mp*isp*G0/F;
export const burnTimeForDv=(dv,m0,isp,F)=>m0*isp*G0/F*(1-Math.exp(-dv/(isp*G0)));
export function hohmann(mu,r1,r2){const at=(r1+r2)/2;const dv1=Math.sqrt(mu/r1)*(Math.sqrt(2*r2/(r1+r2))-1),dv2=Math.sqrt(mu/r2)*(1-Math.sqrt(2*r1/(r1+r2)));
 const t=Math.PI*Math.sqrt(at*at*at/mu);return{at,dv1,dv2,total:Math.abs(dv1)+Math.abs(dv2),t,vp:Math.sqrt(mu/r1)+dv1,phase:Math.PI-Math.sqrt(mu/(r2*r2*r2))*t};}
export const stopDistance=(v,a)=>a>0?v*v/(2*a):Infinity;
export const terminalVelocity=(m,g,rho,cdA)=>Math.sqrt(2*m*g/(rho*cdA));

/* ---------- patched-conic prediction ---------- */
// state:{body:'verda'|'lune', r, v}; returns up to `max` conic segments with their end events
export function predict(st,t0,o={}){const segs=[];let cur={body:st.body,r:st.r.slice(),v:st.v.slice(),t:t0};const max=o.max??3;
 for(let k=0;k<max&&cur;k++){const B=BODY[cur.body],el=elements(cur.r,cur.v,B.mu);const seg={body:cur.body,r0:cur.r,v0:cur.v,t0:cur.t,el,tEnd:null,end:null,next:null};segs.push(seg);
  let tImp=Infinity;const floor=B.R+(o.floor??(B.atm?B.atm*.0:0));
  if(el.rp<floor){const cn=clamp((el.p/floor-1)/(el.e||1e-9),-1,1),nuI=-Math.acos(cn);const ti=timeFromPe(nuI,el.e,el.a,el.mu),tn=timeFromPe(el.nu,el.e,el.a,el.mu);
   let d=ti-tn;if(el.e<1){d=((d%el.T)+el.T)%el.T;}if(d>0&&!(el.r<floor+1&&el.vr<0&&d>el.T*.9))tImp=d;else if(el.r<=floor)tImp=0;}
  let nxt=null,tE=Infinity;
  if(cur.body==='lune'){if(el.e>=1||el.ra>LUNE.soi){const cn=clamp((el.p/LUNE.soi-1)/el.e,-1,1),nuX=Math.acos(cn);let d=timeFromPe(nuX,el.e,el.a,el.mu)-timeFromPe(el.nu,el.e,el.a,el.mu);if(el.e<1)d=((d%el.T)+el.T)%el.T;
    if(d>=0&&d<tImp){tE=d;const s=kepler(cur.r,cur.v,d,el.mu),L=luneState(cur.t+d);nxt={body:'verda',r:add(s.r,L.r),v:add(s.v,L.v),t:cur.t+d};seg.end='exit';}}}
  else{const enc=findEncounter(cur.r,cur.v,cur.t,el,Math.min(tImp,o.horizon??(el.e<1?Math.min(el.T,LUNE.T*1.2):LUNE.T)));seg.closest=enc.closest;
   if(enc.t!=null){tE=enc.t-cur.t;const s=kepler(cur.r,cur.v,tE,el.mu),L=luneState(enc.t);nxt={body:'lune',r:sub(s.r,L.r),v:sub(s.v,L.v),t:enc.t};seg.end='enc';}}
  if(tImp<tE){tE=tImp;seg.end='impact';nxt=null;}
  seg.tEnd=isFinite(tE)?cur.t+tE:null;seg.next=nxt;cur=nxt;}
 return segs;}
function findEncounter(r0,v0,t0,el,horizon){const out={t:null,closest:{d:Infinity,t:null}};if(el.ra<LUNE.a-LUNE.soi*1.05||el.rp>LUNE.a+LUNE.soi*1.05)return out;
 const N=Math.min(900,Math.max(160,Math.ceil(horizon/90)));const step=horizon/N;let prev=null;
 const dist=dt=>{const s=kepler(r0,v0,dt,el.mu);return len(sub(s.r,lunePos(t0+dt)));};
 for(let i=1;i<=N;i++){const tt=i*step,d=dist(tt);if(d<out.closest.d){out.closest={d,t:t0+tt};}
  if(d<LUNE.soi){let a=(i-1)*step,b=tt;for(let j=0;j<40;j++){const m=(a+b)/2;if(dist(m)<LUNE.soi)b=m;else a=m;}out.t=t0+b;return out;}prev=d;}
 return out;}
// closest approach between ship (verda frame) and the station over `span` seconds
export function closestApproach(r0,v0,t0,span,targetFn){let best={d:Infinity,t:t0};const N=240;
 for(let i=0;i<=N;i++){const dt=span*i/N,s=kepler(r0,v0,dt,VERDA.mu),T=targetFn(t0+dt);const d=len(sub(s.r,T.r));if(d<best.d)best={d,t:t0+dt};}
 // refine (golden section)
 let a=Math.max(0,best.t-t0-span/N),b=Math.min(span,best.t-t0+span/N);const f=dt=>{const s=kepler(r0,v0,dt,VERDA.mu),T=targetFn(t0+dt);return len(sub(s.r,T.r));};
 for(let k=0;k<40;k++){const m1=a+(b-a)*.382,m2=a+(b-a)*.618;if(f(m1)<f(m2))b=m2;else a=m1;}const tt=(a+b)/2;return{d:f(tt),t:t0+tt};}

/* ---------- maneuver nodes ---------- */
// orbital frame at a state: prograde, normal, radial-out
export function orbitFrame(r,v){const pro=norm(v),nrm=norm(cross(r,v)),rad=norm(cross(v,cross(r,v)));return{pro,nrm,rad};}
export function nodeState(st,t0,node){const B=BODY[st.body];const s=kepler(st.r,st.v,node.t-t0,B.mu);const f=orbitFrame(s.r,s.v);
 const dv=add(add(mul(f.pro,node.pro),mul(f.nrm,node.nrm)),mul(f.rad,node.rad));return{body:st.body,r:s.r,v:add(s.v,dv),dvW:dv,pre:s};}
// grid search + pattern refinement over (time, prograde dv) to minimise cost(prediction)
export function optimizeNode(st,t0,cost,o={}){const B=BODY[st.body],el=elements(st.r,st.v,B.mu);const span=o.span??(el.e<1?el.T:600);
 const tA=o.tMin??t0+30,dvA=o.dvMin??0,dvB=o.dvMax??1200;const nt=o.nt??40,nd=o.nd??28;let best={c:Infinity};
 const ev=(t,pro)=>{const ns=nodeState(st,t0,{t,pro,nrm:0,rad:0});ns.t=t;const segs=predict(ns,t,{max:3,horizon:o.horizon});return cost(segs,ns);};
 for(let i=0;i<nt;i++)for(let j=0;j<nd;j++){const t=tA+span*i/nt,pro=dvA+(dvB-dvA)*j/(nd-1);const c=ev(t,pro);if(c<best.c)best={c,t,pro};}
 let st1=span/nt,st2=(dvB-dvA)/(nd-1);
 for(let k=0;k<60&&(st1>.05||st2>.01);k++){let moved=false;for(const[a,b]of[[st1,0],[-st1,0],[0,st2],[0,-st2]]){const t=best.t+a,pro=best.pro+b;if(t<tA)continue;const c=ev(t,pro);if(c<best.c){best={c,t,pro};moved=true;}}if(!moved){st1/=2;st2/=2;}}
 return{t:best.t,pro:best.pro,nrm:0,rad:0,cost:best.c};}
// first time after t0 when the phase lead of a circular target reaches `phase` (radians)
export function phaseWindow(st,t0,targetR,targetTheta,phase){const el=elements(st.r,st.v,VERDA.mu);const ns=Math.sqrt(VERDA.mu/Math.max(el.a,VERDA.R)**3),nt=Math.sqrt(VERDA.mu/targetR**3);
 const lead=wrap(targetTheta(t0)-phaseAngle(st.r));const rate=nt-ns;let d=wrap(phase-lead);
 if(rate<0){d=d>0?d-2*Math.PI:d;return t0+d/rate;}return t0+(d<0?d+2*Math.PI:d)/rate;}
export const wrap=a=>{a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI;};

/* ---------- continents (mirrors the GLSL in models.js) — used for splashdown vs touchdown ---------- */
const fr=x=>x-Math.floor(x);
function hash3(x,y,z){x=fr(x*.1031);y=fr(y*.1031);z=fr(z*.1031);const d=x*(y+33.33)+y*(z+33.33)+z*(x+33.33);x+=d;y+=d;z+=d;return fr((x+y)*z);}
function vnoise(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),uz=fz*fz*(3-2*fz);
 const L=(a,b,t)=>a+(b-a)*t;const h=(a,b,c)=>hash3(ix+a,iy+b,iz+c);
 return L(L(L(h(0,0,0),h(1,0,0),ux),L(h(0,1,0),h(1,1,0),ux),uy),L(L(h(0,0,1),h(1,0,1),ux),L(h(0,1,1),h(1,1,1),ux),uy),uz);}
export function continent(n){let x=n[0]*1.7+3.1,y=n[1]*1.7+1.3,z=n[2]*1.7+5.7,a=.5,s=0;for(let i=0;i<5;i++){s+=a*vnoise(x,y,z);x=x*2.03+1.7;y=y*2.03+.3;z=z*2.03+2.9;a*=.5;}
 const dl=(n[0]-1)**2+n[1]**2+n[2]**2,dc=(n[0]-.9945)**2+n[1]**2+(n[2]+.1045)**2;return s-.5+.38*Math.exp(-dl/.006)-.42*Math.exp(-dc/.004);}

/* ---------- part-stack analysis lives in parts.js; vessel dynamics here ---------- */
export const DT=1/50;
