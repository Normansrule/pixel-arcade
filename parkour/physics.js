// RUNLINE — collision world (oriented boxes, sphere pushes, ray casts) and the momentum runner controller.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v;

// movement tuning (metres, seconds)
export const MV={g:22,run:8.4,sprint:11.2,sprintRamp:1.3,accel:7.5,fric:7,stop:3,airAccel:12,airCap:1.1,surfCap:2.6,airCtl:2.4,
 jump:7.5,coyote:.12,buf:.13,slideMin:5,slideBoost:3,slideFric:.32,slideCD:.9,crouch:3.6,
 wallMin:5.2,wallG:6.5,wallT:1.7,wallMax:12.6,wallOut:6.4,wallUp:7.3,climbV:7,mantleH:1.95,
 dash:9,dashCap:21,dashCD:.45,grapR:44,grapAcc:50,grapMax:26,grapRel:4.5,
 rollV:-15.5,dieV:-33,eye:1.62,eyeLow:.86,r:.4};
const OFF_HI=[.4,.9,1.4],OFF_LO=[.4,.86];

const _e=new THREE.Euler(),_q=new THREE.Quaternion(),_m=new THREE.Matrix4(),_n=new V(),_s=new V(),_t=new V(),_d=new V(),_g=new V(),_o=new V(),_r={t:0,n:new V(),b:null};

/* ---------------- oriented box ---------------- */
export class Box{
 constructor(p,s,r=[0,0,0],o={}){this.c=new V(p[0],p[1],p[2]);this.hx=s[0]/2;this.hy=s[1]/2;this.hz=s[2]/2;this.o=o;this.on=true;this.id=-1;this.setRot(r);}
 setRot(r){_e.set(r[0]||0,r[1]||0,r[2]||0,'YXZ');this.q=new THREE.Quaternion().setFromEuler(_e);_m.makeRotationFromQuaternion(this.q);const e=_m.elements;
  this.ax=new V(e[0],e[1],e[2]);this.ay=new V(e[4],e[5],e[6]);this.az=new V(e[8],e[9],e[10]);this.bounds();}
 bounds(){const{ax,ay,az,hx,hy,hz,c}=this;const ex=Math.abs(ax.x)*hx+Math.abs(ay.x)*hy+Math.abs(az.x)*hz,ey=Math.abs(ax.y)*hx+Math.abs(ay.y)*hy+Math.abs(az.y)*hz,ez=Math.abs(ax.z)*hx+Math.abs(ay.z)*hy+Math.abs(az.z)*hz;
  this.min=new V(c.x-ex,c.y-ey,c.z-ez);this.max=new V(c.x+ex,c.y+ey,c.z+ez);}
}

/* ---------------- world ---------------- */
export class World{
 constructor(){this.boxes=[];}
 add(b){b.id=this.boxes.length;this.boxes.push(b);return b;}
 // push sphere p (mutated) out of every box; hit(n,box) is called per contact
 sphere(p,r,hit){let cnt=0;
  for(const b of this.boxes){if(!b.on||b.o.nc)continue;const mn=b.min,mx=b.max;
   if(p.x+r<mn.x||p.x-r>mx.x||p.y+r<mn.y||p.y-r>mx.y||p.z+r<mn.z||p.z-r>mx.z)continue;
   const dx=p.x-b.c.x,dy=p.y-b.c.y,dz=p.z-b.c.z,ax=b.ax,ay=b.ay,az=b.az;
   const lx=dx*ax.x+dy*ax.y+dz*ax.z,ly=dx*ay.x+dy*ay.y+dz*ay.z,lz=dx*az.x+dy*az.y+dz*az.z;
   const ox=lx-cl(lx,-b.hx,b.hx),oy=ly-cl(ly,-b.hy,b.hy),oz=lz-cl(lz,-b.hz,b.hz),d2=ox*ox+oy*oy+oz*oz;
   if(d2>=r*r)continue;let nx=0,ny=0,nz=0,pen;
   if(d2>1e-10){const d=Math.sqrt(d2);nx=ox/d;ny=oy/d;nz=oz/d;pen=r-d;}
   else{const px=b.hx-Math.abs(lx),py=b.hy-Math.abs(ly),pz=b.hz-Math.abs(lz);
    if(px<py&&px<pz){nx=lx<0?-1:1;pen=px+r;}else if(py<pz){ny=ly<0?-1:1;pen=py+r;}else{nz=lz<0?-1:1;pen=pz+r;}}
   _n.set(nx*ax.x+ny*ay.x+nz*az.x,nx*ax.y+ny*ay.y+nz*az.y,nx*ax.z+ny*ay.z+nz*az.z);
   p.addScaledVector(_n,pen);cnt++;if(hit)hit(_n,b);}
  return cnt;}
 overlap(p,r){for(const b of this.boxes){if(!b.on||b.o.nc)continue;const mn=b.min,mx=b.max;if(p.x+r<mn.x||p.x-r>mx.x||p.y+r<mn.y||p.y-r>mx.y||p.z+r<mn.z||p.z-r>mx.z)continue;
   const dx=p.x-b.c.x,dy=p.y-b.c.y,dz=p.z-b.c.z,ax=b.ax,ay=b.ay,az=b.az;const lx=dx*ax.x+dy*ax.y+dz*ax.z,ly=dx*ay.x+dy*ay.y+dz*ay.z,lz=dx*az.x+dy*az.y+dz*az.z;
   const ox=lx-cl(lx,-b.hx,b.hx),oy=ly-cl(ly,-b.hy,b.hy),oz=lz-cl(lz,-b.hz,b.hz);if(ox*ox+oy*oy+oz*oz<r*r)return b;}return null;}
 // nearest hit along o + d*t (d normalised), t<max; rays starting inside a box ignore it. Returns shared result or null.
 ray(o,d,max,skip){let best=max,bb=null;const sx=Math.min(o.x,o.x+d.x*max),sX=Math.max(o.x,o.x+d.x*max),sy=Math.min(o.y,o.y+d.y*max),sY=Math.max(o.y,o.y+d.y*max),sz=Math.min(o.z,o.z+d.z*max),sZ=Math.max(o.z,o.z+d.z*max);
  for(const b of this.boxes){if(!b.on||b.o.nc||b===skip)continue;if(sX<b.min.x||sx>b.max.x||sY<b.min.y||sy>b.max.y||sZ<b.min.z||sz>b.max.z)continue;
   const dx=o.x-b.c.x,dy=o.y-b.c.y,dz=o.z-b.c.z;const A=[b.ax,b.ay,b.az],H=[b.hx,b.hy,b.hz];let t0=0,t1=best,axi=-1,sg=0,ok=true;
   for(let i=0;i<3;i++){const a=A[i],oo=dx*a.x+dy*a.y+dz*a.z,dd=d.x*a.x+d.y*a.y+d.z*a.z,hh=H[i];
    if(Math.abs(dd)<1e-9){if(oo<-hh||oo>hh){ok=false;break;}continue;}
    let ta=(-hh-oo)/dd,tb=(hh-oo)/dd;if(ta>tb){const t=ta;ta=tb;tb=t;}
    if(ta>t0){t0=ta;axi=i;sg=dd>0?-1:1;}if(tb<t1)t1=tb;if(t0>t1){ok=false;break;}}
   if(ok&&axi>=0&&t0<best){best=t0;bb=b;_r.n.copy(A[axi]).multiplyScalar(sg);}}
  if(!bb)return null;_r.t=best;_r.b=bb;return _r;}
}

/* ---------------- the runner ---------------- */
export class Runner{
 constructor(){this.pos=new V();this.vel=new V();this.gn=new V(0,1,0);this.wn=new V();this.sn=new V();this.wn0=new V();this.reset(new V(),0);}
 reset(p,yaw){this.pos.copy(p);this.vel.set(0,0,0);this.yaw=yaw;this.pitch=0;this.state='run';this.ground=true;this.wasG=true;this.crouch=false;this.coy=0;this.jbuf=0;this.crBuf=0;
  this.dashN=1;this.dashCD=0;this.dashT=0;this.wallT=0;this.wallCD=0;this.lastWall=null;this.wallBox=null;this.wallLost=0;this.wallSide=0;this.slideCD=0;this.climbUsed=false;this.grap=null;this.mantle=null;
  this.rollT=0;this.stun=0;this.sprintK=0;this.airT=0;this.t=0;this.jumped=false;this.eyeH=MV.eye;this.gBox=null;this.wHit=null;this.sHit=null;this.sBox=null;this.surf=false;this.stepDip=0;this.preVy=0;this.landT=0;this.grapTarget=null;this.knockT=0;}
 get hs(){return Math.hypot(this.vel.x,this.vel.z);}
 fric(k,dt){const sp=this.vel.length();if(sp<1e-4)return;const drop=Math.max(sp,MV.stop)*k*dt;this.vel.multiplyScalar(Math.max(0,sp-drop)/sp);}
 acc(wd,ws,a,dt){const cur=this.vel.dot(wd),add=ws-cur;if(add<=0)return;this.vel.addScaledVector(wd,Math.min(a*ws*dt,add));}
 headroom(W){_s.set(this.pos.x,this.pos.y+1.4,this.pos.z);return !W.overlap(_s,MV.r-.02);}
 jump(ev,kind='jump'){this.vel.y=Math.max(this.vel.y,0)+MV.jump;if(this.state==='slide'){this.vel.y-=.6;}this.ground=false;this.wasG=false;this.coy=0;this.jbuf=0;this.jumped=true;this.state='air';this.crouch=this.crouch&&this.state==='slide';ev(kind,this.hs);}
 // I: {f,s,jump,jumpE,slide,slideE,dashE,grapE,sprint}
 step(dt,I,W,ev){this.t+=dt;this.jumped=false;
  this.coy=Math.max(0,this.coy-dt);this.jbuf=I.jumpE?MV.buf:Math.max(0,this.jbuf-dt);this.crBuf=I.slideE?.32:Math.max(0,this.crBuf-dt);
  this.dashCD-=dt;this.dashT-=dt;this.wallCD-=dt;this.slideCD-=dt;this.stun-=dt;this.rollT-=dt;this.knockT-=dt;this.stepDip*=Math.exp(-dt*14);this.landT=Math.max(0,this.landT-dt);
  const sy=Math.sin(this.yaw),cy=Math.cos(this.yaw),fx=-sy,fz=-cy,rx=cy,rz=-sy;
  let wx=fx*I.f+rx*I.s,wz=fz*I.f+rz*I.s,wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;wl=1;}if(this.stun>0){wx=wz=wl=0;}
  const wd=_d.set(wl>0?wx/wl:0,0,wl>0?wz/wl:0);
  if(this.state==='dead')return;
  /* ---- mantle / vault animation ---- */
  if(this.mantle){const m=this.mantle;m.t+=dt;const k=Math.min(1,m.t/m.dur),ky=1-Math.pow(1-Math.min(1,k/.7),2),kx=k<m.lag?0:(t=>t*t*(3-2*t))((k-m.lag)/(1-m.lag));
   this.pos.set(m.a.x+(m.b.x-m.a.x)*kx,m.a.y+(m.b.y-m.a.y)*ky,m.a.z+(m.b.z-m.a.z)*kx);
   if(k>=1){this.mantle=null;this.pos.copy(m.b);this.vel.set(m.dx*m.keep,0,m.dz*m.keep);this.state='run';this.ground=this.wasG=true;this.gn.set(0,1,0);this.climbUsed=false;this.dashN=1;ev('mantleEnd',m.kind);}
   this.eye(dt);return;}
  /* ---- edges: dash, grapple ---- */
  if(I.dashE&&this.dashN>0&&this.dashCD<=0&&this.state!=='roll'&&this.stun<=0){let dx=wl>.1?wd.x:fx,dz=wl>.1?wd.z:fz;const hs=this.hs,along=Math.max(0,this.vel.x*dx+this.vel.z*dz);
   const ns=Math.min(Math.max(hs,along+MV.dash),Math.max(hs,MV.dashCap));this.vel.x=dx*ns;this.vel.z=dz*ns;if(!this.ground)this.vel.y=Math.max(this.vel.y,.6);
   this.dashT=.2;this.dashN=0;this.dashCD=MV.dashCD;if(this.state==='wall'){this.state='air';this.lastWall=this.wallBox;this.wallCD=.25;}if(this.state==='slide')this.state='run';ev('dash');}
  if(I.grapE&&this.grap){this.releaseGrap(ev,false);}
  else if(I.grapE&&this.grapTarget&&this.state!=='roll'){const g=this.grapTarget;this.grap={pt:g,t:0};this.state='grap';this.ground=false;this.wasG=false;this.crouch=false;if(this.vel.y<0)this.vel.y*=.4;ev('grap',g);}
  /* ---- per state ---- */
  if(this.state==='grap'){const g=this.grap;g.t+=dt;_t.set(g.pt.p.x-this.pos.x,g.pt.p.y-(this.pos.y+1.1),g.pt.p.z-this.pos.z);const dist=_t.length();_t.divideScalar(dist||1);
   this.vel.addScaledVector(_t,MV.grapAcc*dt);this.vel.y-=MV.g*.25*dt;const al=this.vel.dot(_t);_s.copy(this.vel).addScaledVector(_t,-al);this.vel.addScaledVector(_s,-Math.min(1,2.6*dt));
   const sp=this.vel.length();if(sp>MV.grapMax)this.vel.multiplyScalar(MV.grapMax/sp);g.dist=dist;
   if(dist<MV.grapRel||g.t>2.6||this.jbuf>0)this.releaseGrap(ev,this.jbuf>0);}
  else if(this.state==='wall'){const n=this.wn;_t.set(this.vel.x,0,this.vel.z);_t.addScaledVector(n,-_t.dot(n));const tl=_t.length();if(tl>.01)_t.divideScalar(tl);else _t.set(-n.z,0,n.x);
   let hs=Math.max(tl,7.4);if(I.f>0)hs=Math.min(hs+3*dt,Math.max(hs,MV.wallMax));
   this.vel.x=_t.x*hs-n.x*1.6;this.vel.z=_t.z*hs-n.z*1.6;this.vel.y=Math.max(-7,this.vel.y-MV.wallG*dt);this.wallT+=dt;this.dashN=1;
   if(this.jbuf>0){this.jbuf=0;let ox=n.x*MV.wallOut,oz=n.z*MV.wallOut;const lf=fx*n.x+fz*n.z;if(lf>.15){ox+=fx*2.4;oz+=fz*2.4;}
    this.vel.set(_t.x*hs*.96+ox,MV.wallUp,_t.z*hs*.96+oz);this.state='air';this.lastWall=this.wallBox;this.wallCD=.18;this.climbUsed=false;ev('walljump',this.wallSide);}
   else if(this.wallT>MV.wallT||I.slideE||(I.f<=0&&this.wallT>.25)){this.vel.x+=n.x*1.8;this.vel.z+=n.z*1.8;this.state='air';this.lastWall=this.wallBox;this.wallCD=.3;ev('wallend');}}
  else if(this.ground&&this.state!=='roll'){this.airT=0;if(this.dashCD<=0)this.dashN=1;this.climbUsed=false;this.lastWall=null;
   if(this.jbuf>0&&this.stun<=0){this.jump(ev);}
   else{const hs=this.hs;
    if(this.state!=='slide'&&(I.slideE||(I.slide&&this.landT>0))&&hs>MV.slideMin){this.state='slide';if(this.slideCD<=0){const k=Math.min(MV.slideBoost,Math.max(0,17-hs));this.vel.x+=this.vel.x/hs*k;this.vel.z+=this.vel.z/hs*k;this.slideCD=MV.slideCD;}ev('slide');}
    if(this.state==='slide'&&(!I.slide||hs<2.8)){this.state='run';}
    if(this.state!=='slide')this.state='run';
    this.crouch=this.state==='slide'||I.slide||(this.crouch&&!this.headroom(W));
    const vn=this.vel.dot(this.gn);this.vel.addScaledVector(this.gn,-vn);
    if(this.state==='slide'){_g.set(0,-MV.g,0);_g.addScaledVector(this.gn,-_g.dot(this.gn));this.vel.addScaledVector(_g,dt);this.fric(MV.slideFric,dt);
     if(wl>0){const a=Math.atan2(this.vel.x,this.vel.z),b=Math.atan2(wd.x,wd.z);let da=b-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<1.6){const r=cl(da,-1.3*dt,1.3*dt),c=Math.cos(r),s=Math.sin(r),vx=this.vel.x,vz=this.vel.z;this.vel.x=vx*c+vz*s;this.vel.z=-vx*s+vz*c;}}}
    else{if(this.dashT<=0)this.fric(this.stun>0?16:MV.fric,dt);
     if(I.f>.5&&hs>MV.run*.75&&I.sprint!==false)this.sprintK=Math.min(1,this.sprintK+dt/MV.sprintRamp);else this.sprintK=Math.max(0,this.sprintK-dt*1.6);
     const top=this.crouch?MV.crouch:MV.run+(MV.sprint-MV.run)*this.sprintK;
     if(wl>0){_s.copy(wd);_s.addScaledVector(this.gn,-_s.dot(this.gn)).normalize();this.acc(_s,wl*top,MV.accel,dt);}}}}
  else if(this.state==='roll'){this.crouch=true;const vn=this.vel.dot(this.gn);if(this.ground)this.vel.addScaledVector(this.gn,-vn);else this.vel.y-=MV.g*dt;if(this.rollT<=0){this.state=this.ground?'run':'air';}}
  else{/* air */this.airT+=dt;if(this.state!=='air')this.state='air';
   this.vel.y-=MV.g*(this.dashT>0?.12:1)*dt;
   if(this.surf&&this.sBox){// surf assist: soften the cross-ramp pull of gravity while holding a direction
    if(wl>0){_g.set(0,-MV.g,0);_g.addScaledVector(this.sn,-_g.dot(this.sn));const ax=this.sBox.az;const along=_g.dot(ax);_s.copy(_g).addScaledVector(ax,-along);this.vel.addScaledVector(_s,-.6*dt);}}
   if(wl>0&&this.surf&&this.sBox){// on a surf face only the across-ramp part of the input pushes (so W+A/D works like A/D)
    const ax=this.sBox.az,hl=Math.hypot(ax.x,ax.z)||1,axx=ax.x/hl,axz=ax.z/hl,d=wd.x*axx+wd.z*axz;wd.x-=axx*d;wd.z-=axz*d;const l=Math.hypot(wd.x,wd.z);if(l>.08){wd.x/=l;wd.z/=l;}else wl=0;}
   if(wl>0){const cap=this.surf?MV.surfCap:MV.airCap,cur=this.vel.x*wd.x+this.vel.z*wd.z,add=cap*wl-cur;if(add>0){const as=Math.min(MV.airAccel*MV.run*wl*dt,add);this.vel.x+=wd.x*as;this.vel.z+=wd.z*as;}}
   if(I.f>.3&&Math.abs(I.s)<.3&&!this.surf&&this.knockT<=0){const hs=this.hs;if(hs>.5){const a=Math.atan2(this.vel.x,this.vel.z),b=Math.atan2(fx,fz);let da=b-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<1.75){const r=cl(da,-MV.airCtl*dt,MV.airCtl*dt),c=Math.cos(r),s=Math.sin(r),vx=this.vel.x,vz=this.vel.z;this.vel.x=vx*c+vz*s;this.vel.z=-vx*s+vz*c;}}}
   this.crouch=I.slide||(this.crouch&&!this.headroom(W));}
  /* ---- step-up onto low edges ---- */
  if(this.ground&&this.hs>.6){const hs=this.hs,dx=this.vel.x/hs,dz=this.vel.z/hs;_o.set(this.pos.x+dx*.58,this.pos.y+.56,this.pos.z+dz*.58);_d.set(0,-1,0);const h=W.ray(_o,_d,.54);
   if(h&&h.n.y>.7){const dh=.56-h.t;if(dh>.04&&dh<=.52){_s.set(_o.x,this.pos.y+dh+.42,_o.z);if(!W.overlap(_s,MV.r-.03)){this.pos.y+=dh+.005;this.stepDip+=dh;}}}}
  /* ---- integrate + collide ---- */
  this.preVy=this.vel.y;this.pvx=this.vel.x;this.pvz=this.vel.z;this.wasG=this.ground;const sp=this.vel.length(),n=Math.max(1,Math.ceil(sp*dt/.18)),h=dt/n;
  this.gHit=false;this.wHit=null;this.sHit=null;
  for(let i=0;i<n;i++){this.pos.addScaledVector(this.vel,h);this.collide(W);}
  // ground snap
  if(!this.gHit&&this.wasG&&!this.jumped&&this.vel.y<=.6&&this.state!=='grap'){_o.set(this.pos.x,this.pos.y+.35,this.pos.z);_d.set(0,-1,0);const r=W.ray(_o,_d,.8);
   if(r&&r.n.y>.7){this.pos.y-=r.t-.35;this.gHit=true;this.gn.copy(r.n);this.gBox=r.b;const vn=this.vel.dot(this.gn);if(vn<0)this.vel.addScaledVector(this.gn,-vn);}}
  if(this.state==='grap'&&this.gHit&&this.grap&&this.grap.t>.25)this.releaseGrap(ev,false);
  this.ground=this.gHit&&this.state!=='grap';this.surf=!this.ground&&!!this.sHit;this.sBox=this.surf?this.sHit:null;
  if(!this.ground&&this.wasG&&!this.jumped&&this.state!=='grap')this.coy=MV.coyote;
  /* ---- landing ---- */
  if(this.ground&&!this.wasG){const vy=this.preVy;this.landT=.12;
   if(this.state==='wall'){this.state='run';}
   if(vy<MV.dieV){ev('die','fall');return;}
   if(vy<MV.rollV){if(this.crBuf>0||I.slide){this.state='roll';this.rollT=.55;const hs=Math.max(this.hs,5.5),d=this.hs>.1?1/this.hs:0;if(d){this.vel.x*=d*hs*.92;this.vel.z*=d*hs*.92;}else{this.vel.x=fx*5;this.vel.z=fz*5;}ev('roll',vy);}
    else{this.stun=.6;this.vel.x*=.18;this.vel.z*=.18;ev('hard',vy);}}
   else ev('land',vy);
   if(this.state==='air')this.state='run';}
  /* ---- wall run / wall climb ---- */
  if(this.state==='wall'){if(this.wHit&&this.wn.dot(this.wn0)>.75){this.wallLost=0;this.wn0.copy(this.wn);}else{this.wallLost+=dt;if(this.wallLost>.1){this.state='air';this.lastWall=this.wallBox;this.wallCD=.25;ev('wallend');}else this.wn.copy(this.wn0);}}
  else if(this.state==='air'&&this.wHit&&this.wallCD<=0&&!I.slide){const hs=Math.hypot(this.pvx,this.pvz),n=this.wn;
   if(hs>.5){const vx=this.pvx/hs,vz=this.pvz/hs,into=-(vx*n.x+vz*n.z),look=-(fx*n.x+fz*n.z);
    if(into<.82&&look<.9&&hs>MV.wallMin&&this.wHit!==this.lastWall&&this.vel.y>-9&&I.f>0){_o.set(this.pos.x,this.pos.y+.2,this.pos.z);_d.set(0,-1,0);if(!W.ray(_o,_d,1.1)){
      this.state='wall';this.wallT=0;{const al=this.pvx*-n.z+this.pvz*n.x,sg=al<0?-1:1;const sp=Math.max(Math.abs(al),hs*.85);this.vel.x=-n.z*sg*sp;this.vel.z=n.x*sg*sp;}this.wallLost=0;this.wallBox=this.wHit;this.wn0.copy(n);this.wallSide=Math.sign(vz*n.x-vx*n.z)||1;this.vel.y=cl(this.vel.y+1.4,1.6,4.6);this.dashN=1;this.grap=null;ev('wallrun',this.wallSide);}}
    else if(look>.7&&I.f>0&&!this.climbUsed&&this.vel.y>-6){this.climbUsed=true;this.vel.y=Math.max(this.vel.y,MV.climbV);ev('climb');}}}
  /* ---- ledge mantle (air) + vault (ground) ---- */
  if(!this.mantle&&I.f>0&&this.state!=='grap'&&this.state!=='roll'){
   if(!this.ground&&this.vel.y<7.5)this.tryLedge(W,fx,fz,false,ev);
   else if(this.ground&&this.hs>3)this.tryLedge(W,this.vel.x/this.hs,this.vel.z/this.hs,true,ev);}
  this.eye(dt);}
 tryLedge(W,dx,dz,vault,ev){const reach=vault?1.42:2.2,px=this.pos.x+dx*.8,pz=this.pos.z+dz*.8;_o.set(px,this.pos.y+reach,pz);_d.set(0,-1,0);const r=W.ray(_o,_d,reach-.2);
  if(!r||r.n.y<.7)return false;const top=this.pos.y+reach-r.t,dh=top-this.pos.y;if(vault?(dh<.5||dh>1.4):(dh<.28||dh>MV.mantleH))return false;
  _o.set(this.pos.x,this.pos.y+Math.min(dh-.12,1.1),this.pos.z);_d.set(dx,0,dz);if(!W.ray(_o,_d,1.05))return false;
  const tx=px+dx*.25,tz=pz+dz*.25;for(const h of[.42,.92,1.42]){_s.set(tx,top+h,tz);if(W.overlap(_s,MV.r-.04))return false;}
  const hs=this.hs,keep=vault?Math.max(hs*.97,6):Math.max(hs*.55,4.5);
  this.mantle={a:this.pos.clone(),b:new V(tx,top,tz),t:0,dur:vault?.22:.26+dh*.07,lag:vault?.15:.38,keep,dx,dz,kind:vault?'vault':'mantle'};this.state='mantle';this.vel.set(0,0,0);this.grap=null;ev(vault?'vault':'mantle',dh);return true;}
 releaseGrap(ev,jumped){const g=this.grap;if(!g)return;this.grap=null;g.pt.cd=1.1;this.vel.y=Math.min(Math.max(this.vel.y,0),6.5)+(jumped?5:3.2);this.state='air';this.dashN=1;this.jbuf=0;ev('grapRel',g.pt);}
 collide(W){const offs=this.crouch?OFF_LO:OFF_HI;
  for(let pass=0;pass<2;pass++)for(let i=0;i<offs.length;i++){_s.set(this.pos.x,this.pos.y+offs[i],this.pos.z);this._i=i;
   W.sphere(_s,MV.r,this._hit||(this._hit=(n,b)=>{const vn=this.vel.dot(n);if(vn<0)this.vel.addScaledVector(n,-vn);
    if(n.y>.7){if(this._i===0){this.gHit=true;this.gn.copy(n);this.gBox=b;}}
    else if(n.y>.12){this.sHit=b;this.sn.copy(n);}
    else if(n.y>-.3){if(!this.wHit||this._i===1){this.wHit=b;this.wn.copy(n);}}}));
   this.pos.set(_s.x,_s.y-offs[i],_s.z);}}
 eye(dt){const t=this.mantle?MV.eye-.25:this.crouch||this.state==='roll'?MV.eyeLow:MV.eye;this.eyeH+=(t-this.eyeH)*Math.min(1,dt*(t<this.eyeH?16:9));}
 die(){this.state='dead';this.vel.set(0,0,0);this.grap=null;this.mantle=null;}
}
