// IRONCLAD — ballistics & damage: shell flight with gravity, hit boxes with armour facing, ricochets, criticals, splash, coilgun pierce, structure damage.
import * as THREE from '../vendor/three.module.min.js';
import {V3,cl} from './util.js';
import {segBox,rayObs,rayTerrain,breakOb} from './maps.js';
import {G as GRAV} from './tanks.js';
const R=(a=1)=>Math.random()*a;
const TB={talon:{hx:.95,hz:1.15,h:.62,cz:-.1},maul:{hx:1.3,hz:1.7,h:.86,cz:-.25},lance:{hx:1.15,hz:1.45,h:.98,cz:-.15}};
const _b={},_t={},_q=new THREE.Quaternion(),_qi=new THREE.Quaternion(),_e=new THREE.Euler(),_a=new V3(),_c=new V3(),_n=new V3();
// hull & turret boxes of a tank in the hull's local frame (pitch/roll/yaw as drawn), as segBox-compatible objects
function boxes(t){const d=t.d;Object.assign(_b,{x:0,z:0,hx:d.W/2,hz:d.L/2,c:1,s:0,y0:.22,h:d.y1-.22});
 const tb=TB[t.lo.turret],sc=d.sc,r=t.tRel,cz=d.turZ;Object.assign(_t,{x:Math.sin(r)*tb.cz*sc,z:cz+Math.cos(r)*tb.cz*sc,hx:tb.hx*sc,hz:tb.hz*sc,c:Math.cos(r),s:Math.sin(r),y0:d.y1-.02,h:tb.h*sc});return[_b,_t];}
// nearest tank hit along a segment (tested in each hull's tilted frame; n = world normal, ln = hull-local normal)
export function rayTanks(tanks,p0,p1,skip){let best=null;for(const t of tanks){if(!t.alive||t===skip)continue;const dx=t.p.x-p0.x,dz=t.p.z-p0.z,ex=p1.x-p0.x,ez=p1.z-p0.z,L2=ex*ex+ez*ez||1,u=cl((dx*ex+dz*ez)/L2,0,1);
  if(Math.hypot(p0.x+ex*u-t.p.x,p0.z+ez*u-t.p.z)>t.d.L*.6+2)continue;const[hb,tb]=boxes(t);
  _q.setFromEuler(_e.set(-t.pitch,t.yaw,t.roll,'YXZ'));_qi.copy(_q).invert();_a.subVectors(p0,t.p).applyQuaternion(_qi);_c.subVectors(p1,t.p).applyQuaternion(_qi);
  for(let k=0;k<2;k++){const h=segBox(k?tb:hb,_a,_c);if(h&&(!best||h.t<best.t)){_n.set(h.nx,h.ny,h.nz);best={t:h.t,tank:t,part:k?'turret':'hull',ln:_n.clone(),n:_n.clone().applyQuaternion(_q),axis:h.axis,inside:h.inside};}}}return best;}
// classify the face that was hit (front/side/rear/top) from the normal in the hit part's frame
function facing(h){const t=h.tank,n=h.ln||h.n,yaw=h.part==='turret'?t.tRel:0;if(n.y>.5)return'top';const fx=Math.sin(yaw),fz=Math.cos(yaw);const d=n.x*fx+n.z*fz;return d>.6?'front':d<-.6?'rear':'side';}
const MUL={hull:{front:.7,side:1,rear:1.45,top:1.3},turret:{front:.85,side:1.05,rear:1.35,top:1.3}};
const CRIT={front:.05,side:.09,rear:.22,top:.15};
const MODS=['TRACKS','TURRET RING','ENGINE','AMMO RACK'];

export class Ballistics{constructor(G){this.G=G;this.shells=[];}
 clear(){this.shells.length=0;this.G.fx.hideTracers(0);}
 fire(t){const G=this.G,T=t.T,dir=t.gunDir(new V3()),mz=t.muzzle(new V3());
  // dispersion cone
  const a=Math.sqrt(R())*t.disp,b=R(6.283),up=Math.abs(dir.y)<.95?new V3(0,1,0):new V3(1,0,0),s1=new V3().crossVectors(dir,up).normalize(),s2=new V3().crossVectors(dir,s1);dir.addScaledVector(s1,Math.cos(b)*a).addScaledVector(s2,Math.sin(b)*a).normalize();
  const dmg=T.dmg*(t.buffs.dmg>0?2:1);G.onFire(t,mz,dir);
  if(T.pierce){this.hitscan(t,mz,dir,dmg);return;}
  // spawn slightly back inside the barrel so point-blank shots still register
  this.shells.push({p:mz.clone().addScaledVector(dir,-.4),v:dir.clone().multiplyScalar(T.speed).add(new V3(t.vel.x,0,t.vel.z)),owner:t,team:t.team,dmg,kind:t.lo.turret,life:4,splash:T.splash,age:0,ric:0,skip:t,skipT:.15});}
 hitscan(t,p0,dir,dmg){const G=this.G,W=G.W;const p1=p0.clone().addScaledVector(dir,360);let end=p1.clone();let tEnd=1;
  const tt=rayTerrain(W,p0,p1);if(tt>=0){tEnd=tt;}
  let solid=rayObs(W,p0,p1,true);if(solid&&solid.t<tEnd){tEnd=solid.t;}else solid=null;
  end.lerpVectors(p0,p1,tEnd);
  // pass-through obstacles before the end
  for(let k=0;k<6;k++){const h=rayObs(W,p0,end,false);if(!h||!h.o.pass)break;G.knock(h.o,t,dir);}
  // tanks along the line, pierce with falloff
  const hits=[];for(const o of G.tanks){if(!o.alive||o===t)continue;const h=rayTanks([o],p0,end,t);if(h)hits.push(h);}hits.sort((a,b)=>a.t-b.t);let f=1;
  for(const h of hits){const hp=new V3().lerpVectors(p0,end,h.t);this.resolve(h,hp,dir,dmg*f,t,true);f*=.72;}
  if(solid)G.hurtOb(solid.o,dmg*.9,end,dir,t,solid.n);else if(tt>=0)G.groundHit(end,dir,'rail');
  G.fx.beam(p0,end,t.team?[2.4,.6,.5]:[.6,1.4,2.6],.13);G.fx.beam(p0,end,[1.6,1.6,1.8],.04);
  const n=Math.min(60,p0.distanceTo(end)/2|0);for(let i=0;i<n;i++){const k=i/n,a=k*40,p=new V3().lerpVectors(p0,end,k);G.fx.glow.emit(p.x+Math.cos(a)*.25,p.y+Math.sin(a)*.25,p.z,R(.6)-.3,R(.6),R(.6)-.3,t.team?1.4:.4,t.team?.4:.9,t.team?.3:1.6,1,.5,.1,.6,0,1);}}
 // simulate a trajectory without side effects (gun marker / AI). returns {p, tank, t}
 predict(t,maxT=3.2){const G=this.G,T=t.T,dir=t.gunDir(new V3()),p=t.muzzle(new V3());if(T.pierce){const p1=p.clone().addScaledVector(dir,360);let tEnd=1;const tt=rayTerrain(G.W,p,p1);if(tt>=0)tEnd=tt;const o=rayObs(G.W,p,p1,true);if(o&&o.t<tEnd)tEnd=o.t;const e=new V3().lerpVectors(p,p1,tEnd);const h=rayTanks(G.tanks,p,e,t);return{p:h?new V3().lerpVectors(p,e,h.t):e,tank:h?h.tank:null,face:h?facing(h):null,time:0};}
  const v=dir.multiplyScalar(T.speed);const q=new V3(),dt=1/30;
  for(let s=0;s<maxT;s+=dt){q.copy(p).addScaledVector(v,dt);q.y-=.5*GRAV*dt*dt;let best=2,tank=null,face=null;const h=rayTanks(G.tanks,p,q,t);if(h){best=h.t;tank=h.tank;face=facing(h);}
   const o=rayObs(G.W,p,q,true);if(o&&o.t<best){best=o.t;tank=null;}const tt=rayTerrain(G.W,p,q);if(tt>=0&&tt<best){best=tt;tank=null;}
   if(best<=1)return{p:p.clone().lerp(q,best),tank,face,time:s+dt*best};p.copy(q);v.y-=GRAV*dt;}
  return{p,tank:null,time:maxT};}
 update(dt){const G=this.G,W=G.W;const q=new V3();let ti=0;
  for(let i=this.shells.length-1;i>=0;i--){const s=this.shells[i];s.age+=dt;q.copy(s.p).addScaledVector(s.v,dt);q.y-=.5*GRAV*dt*dt;let done=false;
   for(let it=0;it<4&&!done;it++){let best=2,what=null;const h=rayTanks(G.tanks,s.p,q,s.age<s.skipT?s.skip:null);if(h&&!h.inside){best=h.t;what='tank';}
    const o=rayObs(W,s.p,q,false);if(o&&o.t<best){best=o.t;what='ob';}
    const tt=rayTerrain(W,s.p,q);if(tt>=0&&tt<best){best=tt;what='ground';}
    if(!what)break;const hp=new V3().lerpVectors(s.p,q,best);const dir=s.v.clone().normalize();
    if(what==='tank'){const r=this.resolve(h,hp,dir,s.dmg,s.owner,false,s);if(r==='ric'){// bounce off
      const n=h.n;s.v.addScaledVector(n,-2*s.v.dot(n)).multiplyScalar(.6);s.p.copy(hp).addScaledVector(n,.15);q.copy(s.p).addScaledVector(s.v,dt*(1-best));s.dmg*=.5;s.ric++;s.skip=h.tank;s.skipT=s.age+.12;continue;}
     if(s.splash)this.splash(hp,s,h.tank);done=true;}
    else if(what==='ob'){if(o.o.pass){G.knock(o.o,s.owner,dir);s.v.multiplyScalar(.92);continue;}G.hurtOb(o.o,s.dmg*(s.kind==='maul'?1.6:1),hp,dir,s.owner,o.n);if(s.splash)this.splash(hp,s,null);done=true;}
    else{G.groundHit(hp,dir,s.kind);if(s.splash)this.splash(hp,s,null);done=true;}}
   if(done||s.age>s.life||Math.abs(q.x)>200||Math.abs(q.z)>200){this.shells.splice(i,1);continue;}
   s.p.copy(q);s.v.y-=GRAV*dt;
   // smoke trail on the heavy shell
   if(s.kind==='maul'&&Math.random()<.7)G.fx.puff(s.p,1,.4,[.75,.72,.7],.25,1.1,.9,{a:.35,grav:-.2});}
  // tracer visuals
  for(const s of this.shells){if(ti>=G.fx.tr.length)break;const big=s.kind==='maul';G.fx.tracer(ti++,s.p,s.v,big?5:3.4,big?[4,1.9,.7]:[3.6,3,1.4],big?.11:.06);}
  G.fx.hideTracers(ti);}
 // apply a tank hit. returns 'ric' when the shell bounced
 resolve(h,hp,dir,dmg,att,pierce,shell){const G=this.G,t=h.tank;if(!t.alive)return;const face=facing(h);const cosI=Math.abs(dir.dot(h.n));
  if(!pierce&&face!=='top'&&(shell?shell.ric<1:true)&&(cosI<.24||(cosI<.36&&Math.random()<.35))){G.ricochet(t,att,hp,dir,h.n);return'ric';}
  if(t.prot>0){G.shieldHit(t,hp);return;}
  let mul=MUL[h.part][face];if(face==='front'&&h.part==='hull'&&t.lo.hull==='behemoth')mul=.6;
  let crit=null;if(Math.random()<CRIT[face]+(pierce?.04:0)){crit=MODS[R(4)|0];mul*=1.5;}
  const red=(1-t.H.armor)*(t.buffs.armor>0?.5:1);const amount=dmg*mul*red*(.9+R(.2));
  if(crit==='TRACKS')t.crit.track=2.5;else if(crit==='TURRET RING')t.crit.turret=4;else if(crit==='ENGINE')t.crit.engine=4;
  G.damage(t,att,amount,{p:hp,dir,face,part:h.part,crit,n:h.n,kind:pierce?'lance':shell?shell.kind:'?'});}
 splash(p,s,direct){const G=this.G,R0=s.splash;for(const t of G.tanks){if(!t.alive||t===direct)continue;const d=t.p.distanceTo(p)-t.d.W*.4;if(d>R0)continue;if(t.prot>0)continue;
   const amt=s.dmg*.38*(1-Math.max(0,d)/R0)*(1-t.H.armor)*(t.buffs.armor>0?.5:1);if(amt>1)G.damage(t,s.owner,amt,{p:t.p.clone().setY(t.p.y+1),dir:new V3().subVectors(t.p,p).normalize(),face:'side',part:'hull',splash:true,kind:'maul'});}
  for(const o of G.W.obs){if(!o.alive||o.kind==='bound'||o.hp===Infinity)continue;const d=Math.hypot(o.x-p.x,o.z-p.z)-o.r*.6;if(d<R0)G.hurtOb(o,s.dmg*.6*(1-Math.max(0,d)/R0),null,null,s.owner);}
  G.fx.explosion(p,1.6,{dust:G.dustCol,debris:true,ground:true});G.shake(p,1.2,30);}}
