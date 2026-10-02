// TUMBLE ROYALE — physics: wobbly bean character controller, kinematic obstacles, see-saws, hex tiles, rolling balls.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,Q=THREE.Quaternion;
export const DT=1/120,G=30,R=.48,H=1.72,RUN=8.4,JUMP=11.2,ACC=62,AIR=15,DIVE_H=11.8,DIVE_V=5.2;
export const SPH=[R,.86,H-R];// sphere centres (feet, belly, head) above the bean's feet point
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const tl=new V(),tp=new V(),vc=new V(),tq=new Q(),tw=new V(),tn=new V(),YA=new V(0,1,0);

/* ---------- colliders ---------- */
// box: centre c, half extents h, orientation q.  cyl: vertical cylinder, radius rad, half height hh.
// movers carry pose(t,o) which writes c,q,v,w,piv into o (pure in t so bots can look ahead).
function base(o){const c=Object.assign({k:0,c:null,h:null,rad:0,hh:0,R:0,bounce:0,knock:6.5,bump:0,slip:0,on:true,tag:'',danger:'',pose:null,touch:null,vis:null,visPiv:false,scr:null,noBall:false,real:false,door:false,broken:false,knownFake:false,hp:0,wob:0,x:0,row:0,bt:0,hitV:0},o);c.q=o.q?o.q.clone():new Q();c.qi=c.q.clone().invert();c.v=new V();c.w=new V();c.piv=new V();return c;}
export function mkBox(c,h,o={}){const col=base(o);col.k=0;col.c=c.clone();col.h=h.clone();col.piv.copy(c);col.R=col.h.length();return col;}
export function mkCyl(c,rad,hh,o={}){const col=base(o);col.k=1;col.c=c.clone();col.rad=rad;col.hh=hh;col.piv.copy(c);col.R=Math.hypot(rad,hh);return col;}
export function scratch(col){return{k:col.k,c:new V(),q:new Q(),qi:new Q(),v:new V(),w:new V(),piv:new V(),h:col.h,rad:col.rad,hh:col.hh,R:col.R};}

// closest-point contact between sphere (p,r) and collider; C.n points from collider to sphere, C.pen>0 when overlapping
export const C={n:new V(),pen:0};
export function contact(col,p,r,m=0){
 if(col.k===0){tl.subVectors(p,col.c).applyQuaternion(col.qi);const h=col.h;
  const cx=cl(tl.x,-h.x,h.x),cy=cl(tl.y,-h.y,h.y),cz=cl(tl.z,-h.z,h.z),dx=tl.x-cx,dy=tl.y-cy,dz=tl.z-cz,d2=dx*dx+dy*dy+dz*dz;
  if(d2>(r+m)*(r+m))return false;
  if(d2>1e-10){const d=Math.sqrt(d2);C.n.set(dx/d,dy/d,dz/d);C.pen=r-d;}
  else{const ex=h.x-Math.abs(tl.x),ey=h.y-Math.abs(tl.y),ez=h.z-Math.abs(tl.z);
   if(ey<=ex&&ey<=ez){C.n.set(0,tl.y<0?-1:1,0);C.pen=r+ey;}else if(ex<=ez){C.n.set(tl.x<0?-1:1,0,0);C.pen=r+ex;}else{C.n.set(0,0,tl.z<0?-1:1);C.pen=r+ez;}}
  C.n.applyQuaternion(col.q);return true;}
 const lx=p.x-col.c.x,ly=p.y-col.c.y,lz=p.z-col.c.z,d=Math.hypot(lx,lz),cy=cl(ly,-col.hh,col.hh);let qx=lx,qz=lz;
 if(d>col.rad){qx=lx/d*col.rad;qz=lz/d*col.rad;}
 const dx=lx-qx,dy=ly-cy,dz=lz-qz,d2=dx*dx+dy*dy+dz*dz;if(d2>(r+m)*(r+m))return false;
 if(d2>1e-10){const dd=Math.sqrt(d2);C.n.set(dx/dd,dy/dd,dz/dd);C.pen=r-dd;}
 else{const et=col.hh-ly,eb=ly+col.hh,er=col.rad-d;if(et<=eb&&et<=er){C.n.set(0,1,0);C.pen=r+et;}else if(eb<=er){C.n.set(0,-1,0);C.pen=r+eb;}else{if(d>1e-6)C.n.set(lx/d,0,lz/d);else C.n.set(1,0,0);C.pen=r+er;}}
 return true;}
export function pointVel(col,pt,out){return out.crossVectors(col.w,tv0.subVectors(pt,col.piv)).add(col.v);}
const tv0=new V();

/* ---------- the bean ---------- */
export class Bean{
 constructor(id){this.id=id;this.p=new V();this.v=new V();this.yaw=0;this.ctrl={x:0,z:0,jump:false,dive:false,grab:false};
  this.ground=false;this.wasGround=false;this.gn=new V(0,1,0);this.gcol=null;this.gv=new V();this.state='run';this.st=0;this.ragT=0;
  this.rq=new Q();this.rw=new V();this.coy=0;this.jbuf=0;this.dbuf=0;this.pj=false;this.pd=false;this.jl=0;this.dl=0;this.inv=0;
  this.speed=1;this.grabbing=null;this.heldBy=null;this.grabT=0;this.out=false;this.finished=false;this.fallV=0;this.getup=0;this.air=0;
  this.squash=0;this.squashV=0;this.walk=0;this.lean=0;this.team=-1;this.tail=false;this.frozen=false;this.ghost=false;this.knocks=0;}
 place(x,y,z,yaw=0){this.p.set(x,y,z);this.v.set(0,0,0);this.yaw=yaw;this.state='run';this.st=0;this.ragT=0;this.rq.identity();this.rw.set(0,0,0);this.grabbing=null;this.heldBy=null;this.ground=false;this.gv.set(0,0,0);this.gcol=null;}
 fwd(o){return o.set(Math.sin(this.yaw),0,Math.cos(this.yaw));}}

export function knock(b,dir,str,t,ev){if(b.inv>0||b.out||b.finished)return false;
 b.state='rag';b.ragT=t??1.2+Math.min(.8,str*.03);b.st=0;b.v.set(dir.x*str,Math.max(dir.y*str,3.5+str*.32),dir.z*str);
 tw.set(dir.z,0,-dir.x);if(tw.lengthSq()<.01)tw.set(1,0,0);tw.normalize().multiplyScalar(4+str*.45);b.rw.copy(tw).add(tn.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(3));
 releaseGrab(b);b.knocks++;ev&&ev('knock',b,str);return true;}
export function releaseGrab(b){if(b.grabbing){b.grabbing.heldBy=null;b.grabbing=null;}if(b.heldBy){b.heldBy.grabbing=null;b.heldBy=null;}b.grabT=0;}

// one fixed step of a bean: controls, gravity, integration, world collision
export function stepBean(b,W,dt,ev){if(b.out||b.frozen)return;
 const k=b.ctrl,was=b.ground;b.wasGround=was;b.inv=Math.max(0,b.inv-dt);b.jl-=dt;b.dl-=dt;b.coy-=dt;b.st+=dt;b.getup=Math.max(0,b.getup-dt);
 const je=k.jump&&!b.pj,de=k.dive&&!b.pd;b.pj=k.jump;b.pd=k.dive;if(je)b.jbuf=.13;else b.jbuf-=dt;if(de)b.dbuf=.1;else b.dbuf-=dt;
 if(b.state==='rag'){b.ragT-=dt;tq.setFromAxisAngle(tw.copy(b.rw).normalize(),b.rw.length()*dt);if(b.rw.lengthSq()>1e-6)b.rq.premultiply(tq);
  b.rw.multiplyScalar(Math.exp(-dt*(b.ground?5:1)));if(b.ground){const f=Math.exp(-dt*3.2);b.v.x=b.gv.x+(b.v.x-b.gv.x)*f;b.v.z=b.gv.z+(b.v.z-b.gv.z)*f;}
  if(b.ragT<=0&&(b.ground||b.ragT<-2.5)){b.state='run';b.st=0;b.getup=.35;b.inv=Math.max(b.inv,.5);}}
 else if(b.state==='dive'){if(b.ground&&b.st>.1){b.state='slide';b.st=0;ev&&ev('land',b,4);}if(b.st>2)b.state='run';}
 else if(b.state==='slide'){const f=Math.exp(-dt*(b.ground?4.2:.5));b.v.x=b.gv.x+(b.v.x-b.gv.x)*f;b.v.z=b.gv.z+(b.v.z-b.gv.z)*f;
  if(b.st>.55||(b.jbuf>0&&b.st>.22)){b.state='run';b.st=0;b.getup=.25;b.jbuf=0;}}
 else{let mx=k.x,mz=k.z,ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;ml=1;}
  const mul=RUN*b.speed*(b.grabbing?.55:1)*(b.heldBy?.42:1)*(b.getup>0?.55:1),tx=mx*mul,tz=mz*mul;
  if(b.ground){let fr=1;const ny=b.gn.y;if(b.gcol&&b.gcol.slip)fr=cl((ny-.915)/.06,.08,1);else fr=cl((ny-.78)/.12,.1,1);
   const rx=b.v.x-b.gv.x,rz=b.v.z-b.gv.z;let dx=tx-rx,dz=tz-rz;const dl=Math.hypot(dx,dz),mx2=ACC*fr*dt;if(dl>mx2){dx*=mx2/dl;dz*=mx2/dl;}b.v.x+=dx;b.v.z+=dz;}
  else{let dx=tx-b.v.x,dz=tz-b.v.z;if(ml<.1){dx*=.15;dz*=.15;}const dl=Math.hypot(dx,dz),mx2=AIR*dt;if(dl>mx2){dx*=mx2/dl;dz*=mx2/dl;}b.v.x+=dx;b.v.z+=dz;}
  if(ml>.1){let d=Math.atan2(mx,mz)-b.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));b.yaw+=cl(d,-14*dt,14*dt);}
  if(b.jbuf>0&&(b.ground||b.coy>0)&&b.jl<=0&&!b.heldBy){b.v.y=JUMP+Math.max(0,b.gv.y*.8);b.ground=false;b.coy=0;b.jl=.28;b.jbuf=0;b.squashV=7;ev&&ev('jump',b);releaseGrab(b);}
  else if(b.dbuf>0&&b.dl<=0&&!b.heldBy){const fx=ml>.1?mx/ml:Math.sin(b.yaw),fz=ml>.1?mz/ml:Math.cos(b.yaw);b.yaw=Math.atan2(fx,fz);
   const keep=Math.max(0,b.v.x*fx+b.v.z*fz)*.25;b.v.x=fx*(DIVE_H+keep)+b.gv.x*.4;b.v.z=fz*(DIVE_H+keep)+b.gv.z*.4;b.v.y=b.ground?DIVE_V:Math.max(b.v.y*.4,2.2);
   b.state='dive';b.st=0;b.dl=.75;b.dbuf=0;b.ground=false;ev&&ev('dive',b);releaseGrab(b);}}
 b.v.y-=G*dt;if(b.v.y<-40)b.v.y=-40;
 b.p.addScaledVector(b.v,dt);if(!b.ground||b.v.y<0)b.fallV=Math.min(b.fallV,b.v.y);
 collide(b,W,ev);
 if(b.ground){b.coy=.12;if(!was&&b.fallV<-7){ev&&ev('land',b,-b.fallV);b.squashV=Math.min(0,b.fallV*.35);}b.fallV=0;}
 b.air=b.ground?0:b.air+dt;
 // jelly squash spring (visual only, but lives here so the fixed step drives it)
 b.squashV+=(-b.squash*220-b.squashV*11)*dt;b.squash=cl(b.squash+b.squashV*dt,-.32,.32);}

export const BZ=140,BS=4,NBIN=110;
// z-binned broadphase: every collider is listed in the 4 m slices its (swept) bounding sphere can reach
export function buildBins(W){W.bins=[];for(let i=0;i<NBIN;i++)W.bins.push([]);
 for(const col of W.cols){const ext=col.R+col.c.distanceTo(col.piv)+1.2,zc=col.pose?col.piv.z:col.c.z;const i0=Math.max(0,Math.floor((zc-ext+BZ)/BS)),i1=Math.min(NBIN-1,Math.floor((zc+ext+BZ)/BS));for(let i=i0;i<=i1;i++)W.bins[i].push(col);}}
export function binAt(W,z){const i=Math.floor((z+BZ)/BS);return W.bins[i<0?0:i>=NBIN?NBIN-1:i];}
function collide(b,W,ev){b.ground=false;const list=binAt(W,b.p.z);
 for(let s=0;s<3;s++){
  for(let ci=0;ci<list.length;ci++){const col=list[ci];if(!col.on)continue;tp.set(b.p.x,b.p.y+SPH[s],b.p.z);const dx=tp.x-col.c.x,dy=tp.y-col.c.y,dz=tp.z-col.c.z,rr=col.R+R+.2;if(dx*dx+dy*dy+dz*dz>rr*rr)continue;
   if(contact(col,tp,R,s===0?.07:0))hit(b,col,s,ev);}
  if(W.hex)hexCollide(b,W,s,ev);}
 if(!b.ground&&b.wasGround&&b.v.y<=.5&&b.state!=='rag'){/* keep feet glued when walking down slopes / tilting boards */}}

function hit(b,col,s,ev){const n=C.n;
 if(C.pen<=0){// only inside the feet margin: snap to the ground we were already standing on
  if(s===0&&n.y>.55&&b.wasGround&&b.v.y<=.6&&b.state!=='dive'){b.p.addScaledVector(n,C.pen);b.ground=true;b.gn.copy(n);b.gcol=col;pointVel(col,tp,b.gv);}return;}
 b.p.addScaledVector(n,C.pen);tp.addScaledVector(n,C.pen);pointVel(col,tl.copy(tp).addScaledVector(n,-R),vc);
 const rvx=b.v.x-vc.x,rvy=b.v.y-vc.y,rvz=b.v.z-vc.z,vn=rvx*n.x+rvy*n.y+rvz*n.z;
 if(col.bump>0&&Math.abs(n.y)<.8&&b.state!=='rag'&&b.inv<=0){tn.set(n.x,0,n.z).normalize();tn.y=.35;knock(b,tn,col.bump,1.1,ev);ev&&ev('bonk',b,col);}
 else if(vn<0){const mov=col.w.lengthSq()>1e-4||col.v.lengthSq()>1e-4;
  if(mov&&-vn>col.knock&&Math.abs(n.y)<.72&&b.state!=='rag'&&b.inv<=0){tn.set(vc.x,0,vc.z);const sp=tn.length();tn.normalize().multiplyScalar(.8);tn.x+=n.x*.5;tn.z+=n.z*.5;tn.y=.42;tn.normalize();knock(b,tn,Math.max(9,sp*1.25),undefined,ev);ev&&ev('bonk',b,col);}
  else{const e=b.state==='rag'?.3:col.bounce;b.v.x-=n.x*vn*(1+e);b.v.y-=n.y*vn*(1+e);b.v.z-=n.z*vn*(1+e);if(col.bounce>.5&&-vn>3)ev&&ev('boing',b,col);}}
 if(s===0&&n.y>.55){b.ground=true;b.gn.copy(n);b.gcol=col;b.gv.copy(vc);}
 if(col.touch)col.touch(b,col,n,s);}

/* ---------- hex floor (final) ---------- */
export function makeHex(layers,s){const hx={s,layers:[]};const ap=s*Math.sqrt(3)/2;
 for(const L of layers){const tiles=[],map=new Map();for(let q=-L.n;q<=L.n;q++)for(let r=Math.max(-L.n,-q-L.n);r<=Math.min(L.n,-q+L.n);r++){const x=s*Math.sqrt(3)*(q+r/2)+L.cx,z=s*1.5*r+L.cz;const t={q,r,x,z,st:0,t:0,dy:0,vy:0,shake:0,i:tiles.length};tiles.push(t);map.set(q+','+r,t);}
  hx.layers.push({y:L.y,cx:L.cx,cz:L.cz,n:L.n,tiles,map});}
 hx.tmp=mkCyl(new V(),ap*1.04,.3);return hx;}
const NB=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
function hexCollide(b,W,s,ev){const hx=W.hex,S=hx.s,col=hx.tmp;
 for(const L of hx.layers){const top=L.y,y=b.p.y+SPH[s];if(y>top+1.2||y<top-1.4)continue;
  const lx=b.p.x-L.cx,lz=b.p.z-L.cz;const fq=(Math.sqrt(3)/3*lx-lz/3)/S,fr=(2/3*lz)/S;let rq=Math.round(fq),rr=Math.round(fr);const rs=Math.round(-fq-fr);
  const dq=Math.abs(rq-fq),dr=Math.abs(rr-fr),ds=Math.abs(rs+fq+fr);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;
  for(const[a,c]of NB){const t=L.map.get((rq+a)+','+(rr+c));if(!t||t.st>=2)continue;col.c.set(t.x,top-.3,t.z);tp.set(b.p.x,y,b.p.z);
   if(contact(col,tp,R,s===0?.07:0)){const n=C.n;
    if(C.pen<=0){if(s===0&&n.y>.55&&b.wasGround&&b.v.y<=.6){b.p.addScaledVector(n,C.pen);b.ground=true;b.gn.copy(n);b.gcol=null;b.gv.set(0,0,0);if(t.st===0){t.st=1;t.t=0;ev&&ev('tile',t,b);}}continue;}
    b.p.addScaledVector(n,C.pen);const vn=b.v.dot(n);if(vn<0)b.v.addScaledVector(n,-vn*(b.state==='rag'?1.25:1));
    if(s===0&&n.y>.55){b.ground=true;b.gn.copy(n);b.gcol=null;b.gv.set(0,0,0);if(t.st===0){t.st=1;t.t=0;ev&&ev('tile',t,b);}}}}}}
export function stepHex(hx,dt,fuse){for(const L of hx.layers)for(const t of L.tiles){if(t.st===1){t.t+=dt;if(t.t>fuse){t.st=2;t.vy=0;}}else if(t.st===2){t.vy-=G*.7*dt;t.dy+=t.vy*dt;if(t.dy<-40)t.st=3;}}}

/* ---------- bean vs bean ---------- */
export function beanPair(a,b,ev){if(a.out||b.out||a.ghost||b.ghost||a.frozen||b.frozen)return;const dy=b.p.y-a.p.y;if(dy>H||dy<-H)return;
 const dx=b.p.x-a.p.x,dz=b.p.z-a.p.z,d2=dx*dx+dz*dz,rr=2*R*.94;if(d2>rr*rr)return;
 if(dy>H-.4&&b.v.y<=a.v.y+.5&&d2<R*R*1.4){b.p.y=a.p.y+H-.05;b.v.y=Math.max(b.v.y,a.v.y);b.ground=true;b.gn.set(0,1,0);b.gcol=null;b.gv.copy(a.v).setY(0);return;}
 if(-dy>H-.4&&a.v.y<=b.v.y+.5&&d2<R*R*1.4){a.p.y=b.p.y+H-.05;a.v.y=Math.max(a.v.y,b.v.y);a.ground=true;a.gn.set(0,1,0);a.gcol=null;a.gv.copy(b.v).setY(0);return;}
 const d=Math.sqrt(d2)||.001,nx=d2>1e-6?dx/d:1,nz=d2>1e-6?dz/d:0,pen=rr-d;
 const ma=a.state==='rag'?.55:a.state==='dive'?1.4:1,mb=b.state==='rag'?.55:b.state==='dive'?1.4:1,wa=mb/(ma+mb),wb=ma/(ma+mb);
 a.p.x-=nx*pen*wa;a.p.z-=nz*pen*wa;b.p.x+=nx*pen*wb;b.p.z+=nz*pen*wb;
 const vr=(b.v.x-a.v.x)*nx+(b.v.z-a.v.z)*nz;
 if(vr<0){const j=-vr*1.3/(1/ma+1/mb);a.v.x-=nx*j/ma;a.v.z-=nz*j/ma;b.v.x+=nx*j/mb;b.v.z+=nz*j/mb;
  if(-vr>6.5){if(a.state==='dive'&&b.state!=='rag'){tn.set(nx,.4,nz);knock(b,tn,-vr*.9,1,ev);}else if(b.state==='dive'&&a.state!=='rag'){tn.set(-nx,.4,-nz);knock(a,tn,-vr*.9,1,ev);}}
  if(-vr>2.5)ev&&ev('bump',a,b,-vr);}}

/* ---------- rolling balls ---------- */
export class Ball{constructor(r,m,knock=8){this.r=r;this.m=m;this.knock=knock;this.p=new V();this.v=new V();this.q=new Q();this.on=true;this.ground=false;}}
export function stepBall(ball,W,dt,ev){if(!ball.on)return;ball.v.y-=G*dt;ball.p.addScaledVector(ball.v,dt);ball.ground=false;
 const list=binAt(W,ball.p.z);for(let ci=0;ci<list.length;ci++){const col=list[ci];if(!col.on||col.noBall)continue;const dx=ball.p.x-col.c.x,dy=ball.p.y-col.c.y,dz=ball.p.z-col.c.z,rr=col.R+ball.r+.2;if(dx*dx+dy*dy+dz*dz>rr*rr)continue;
  if(!contact(col,ball.p,ball.r))continue;const n=C.n;ball.p.addScaledVector(n,C.pen);pointVel(col,ball.p,vc);
  const rx=ball.v.x-vc.x,ry=ball.v.y-vc.y,rz=ball.v.z-vc.z,vn=rx*n.x+ry*n.y+rz*n.z;if(vn<0){const e=Math.abs(vn)>4?.38:0;ball.v.x-=n.x*vn*(1+e);ball.v.y-=n.y*vn*(1+e);ball.v.z-=n.z*vn*(1+e);if(-vn>6)ev&&ev('ballhit',ball,-vn);}
  if(n.y>.5){ball.ground=true;}}
 const f=Math.exp(-dt*(ball.ground?.35:.05));ball.v.x*=f;ball.v.z*=f;
 const sp=Math.hypot(ball.v.x,ball.v.z);if(sp>.01){tw.set(ball.v.z,0,-ball.v.x).normalize();tq.setFromAxisAngle(tw,sp/ball.r*dt);ball.q.premultiply(tq);}}
export function ballBean(ball,b,ev){if(!ball.on||b.out||b.frozen||b.ghost)return;
 for(let s=0;s<3;s++){tp.set(b.p.x,b.p.y+SPH[s],b.p.z);const dx=tp.x-ball.p.x,dy=tp.y-ball.p.y,dz=tp.z-ball.p.z,d2=dx*dx+dy*dy+dz*dz,rr=ball.r+R;if(d2>rr*rr)continue;
  const d=Math.sqrt(d2)||.001,nx=dx/d,ny=dy/d,nz=dz/d,pen=rr-d,mb=b.state==='rag'?.6:1,wb=ball.m/(ball.m+mb),wl=mb/(ball.m+mb);
  b.p.x+=nx*pen*wb;b.p.y+=ny*pen*wb;b.p.z+=nz*pen*wb;ball.p.x-=nx*pen*wl;ball.p.y-=ny*pen*wl;ball.p.z-=nz*pen*wl;
  const vr=(b.v.x-ball.v.x)*nx+(b.v.y-ball.v.y)*ny+(b.v.z-ball.v.z)*nz;
  if(vr<0){const j=-vr*1.2/(1/mb+1/ball.m);b.v.x+=nx*j/mb;b.v.y+=ny*j/mb;b.v.z+=nz*j/mb;ball.v.x-=nx*j/ball.m;ball.v.y-=ny*j/ball.m;ball.v.z-=nz*j/ball.m;
   if(-vr>ball.knock&&b.state!=='rag'){tn.set(nx,.5,nz).normalize();knock(b,tn,Math.min(18,-vr*1.1),undefined,ev);}}
  if(ny>.6){b.ground=true;b.gn.set(nx,ny,nz);b.gcol=null;b.gv.copy(ball.v);}}}

/* ---------- see-saws ---------- */
export function stepSeesaw(sw,beans,dt){let tq2=0;const ax=sw.axis;// boards tilt about their long axis (z): beans on the +x side push that side down
 for(const b of beans){if(b.out||b.gcol!==sw.col||!b.ground)continue;const lx=b.p.x-sw.col.c.x;tq2+=-lx*(b.state==='rag'?.6:1);}
 sw.angV+=(tq2*sw.k-sw.ang*sw.spring-sw.angV*sw.damp)*dt;sw.ang+=sw.angV*dt;if(sw.ang>sw.max){sw.ang=sw.max;sw.angV=Math.min(0,sw.angV);}if(sw.ang<-sw.max){sw.ang=-sw.max;sw.angV=Math.max(0,sw.angV);}
 sw.col.q.setFromAxisAngle(ax,sw.ang);sw.col.qi.copy(sw.col.q).invert();sw.col.w.copy(ax).multiplyScalar(sw.angV);}

export function updateMovers(W,t){for(const m of W.movers){m.pose(t,m);m.qi.copy(m.q).invert();}}
export function ballBall(a,b){if(!a.on||!b.on)return;const dx=b.p.x-a.p.x,dy=b.p.y-a.p.y,dz=b.p.z-a.p.z,d2=dx*dx+dy*dy+dz*dz,rr=a.r+b.r;if(d2>rr*rr)return;const d=Math.sqrt(d2)||.001,nx=dx/d,ny=dy/d,nz=dz/d,pen=(rr-d)/2;
 a.p.x-=nx*pen;a.p.y-=ny*pen;a.p.z-=nz*pen;b.p.x+=nx*pen;b.p.y+=ny*pen;b.p.z+=nz*pen;const vr=(b.v.x-a.v.x)*nx+(b.v.y-a.v.y)*ny+(b.v.z-a.v.z)*nz;if(vr<0){const j=-vr*.9;a.v.x-=nx*j;a.v.y-=ny*j;a.v.z-=nz*j;b.v.x+=nx*j;b.v.y+=ny*j;b.v.z+=nz*j;}}
