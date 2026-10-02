// KART GRAND PRIX — items: prism boxes, roulette, coins, projectiles (orbs, seeker, peel, bomb), boosts, shrink, aura.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,wrapA} from './util.js';
import {rollItem} from './data.js';
import {query,F} from './trackmath.js';
import {arenaHeight} from './world.js';
import {orbMesh,peelMesh,bombMesh} from './models.js';

const tv=new V();
export class Items{
 constructor(scene,G){this.scene=scene;this.G=G;this.list=[];this.orbVis=new Map();this.q={};}
 clear(){for(const p of this.list)this.scene.remove(p.m);this.list=[];for(const[k,a]of this.orbVis)a.forEach(m=>this.scene.remove(m));this.orbVis.clear();}
 ground(x,z,y){const G=this.G;if(G.A)return{ok:true,inside:Math.hypot(x,z)<G.A.R-1,y:arenaHeight(x,z,G.A.R),flag:0,r:Math.hypot(x,z)};const q=query(G.C,x,z,y,this.q);return q;}
 // ---------- pickups ----------
 pickups(k,dt){const G=this.G,W=G.W;if(k.respawn>0||k.out)return;
  for(const b of W.boxes){if(b.t>0)continue;const dx=b.p.x-k.p.x,dz=b.p.z-k.p.z,dy=b.p.y-k.p.y;if(dx*dx+dz*dz<5.3&&Math.abs(dy)<3){b.t=2;G.ev('box',k,b.p);
    if(!k.item&&!k.roulette&&!k.orbs){k.roulette=k.human>=0?1.5:1.2;k.rollFor=rollItem(k.place,G.karts.length,Math.random,!!G.A);}}}
  for(const c of W.coins){if(c.t>0)continue;const dx=c.p.x-k.p.x,dz=c.p.z-k.p.z;if(dx*dx+dz*dz<3.2&&Math.abs(c.p.y-k.p.y)<2.6){c.t=14;k.coins=Math.min(10,k.coins+1);G.ev('coin',k,c.p);}}
  if(k.roulette>0){k.roulette-=dt;if(k.roulette<=0){k.roulette=0;k.item=k.rollFor;k.itemN=k.item==='pepper3'?3:1;G.ev('gotitem',k,k.item);if(k.item==='orb'){k.orbs=3;k.item=null;}}}}
 // ---------- use ----------
 use(k,back=false){const G=this.G;if(k.respawn>0||k.out)return false;
  if(k.orbs>0){this.fire(k,'orb',back);k.orbs--;G.ev('throw',k,'orb');return true;}
  if(!k.item||k.roulette>0)return false;const it=k.item;k.stats.items++;
  const done=()=>{k.itemN--;if(k.itemN<=0){k.item=null;k.itemN=0;}};
  switch(it){
   case'coin':k.coins=Math.min(10,k.coins+2);G.ev('coin',k,k.p);done();break;
   case'pepper':case'pepper3':k.boost=Math.max(k.boost,1.35);k.boostPow=1.48;k.boostCol=4;G.ev('pepper',k);done();break;
   case'aura':k.aura=7.5;k.boost=Math.max(k.boost,.6);G.ev('aura',k);done();break;
   case'bolt':G.ev('bolt',k);for(const o of G.karts){if(o===k||o.aura>0||o.finished||o.out||o.respawn>0)continue;o.shrink=o.place<k.place?6:4;if(!o.roulette&&o.item&&o.item!=='aura'){o.item=null;o.itemN=0;}o.orbs=0;this.spin(o,.7,k,false);}done();break;
   case'seeker':this.fire(k,'seeker',back);G.ev('throw',k,it);done();break;
   case'peel':this.fire(k,'peel',!back?true:false);G.ev('throw',k,it);done();break;
   case'bomb':this.fire(k,'bomb',back);G.ev('throw',k,it);done();break;}
  return true;}
 fire(k,type,back){const G=this.G,m=type==='orb'||type==='seeker'?orbMesh(type):type==='peel'?peelMesh():bombMesh();this.scene.add(m);
  const fx=Math.sin(k.yaw),fz=Math.cos(k.yaw),dir=back?-1:1,off=back?-2.6:2.6;
  const p={type,m,owner:k,p:new V(k.p.x+fx*off,k.p.y+.6,k.p.z+fz*off),v:new V(),life:type==='peel'?60:type==='bomb'?2.6:type==='seeker'?14:9,age:0,target:null,ground:true,bounces:0,y0:k.p.y};
  if(type==='orb'){const s=Math.max(52,k.spd+24)*dir;p.v.set(fx*s,0,fz*s);}
  else if(type==='seeker'){p.v.set(fx*48,0,fz*48);// target: the racer one place ahead (the leader if you are 2nd)
   const cand=G.karts.filter(o=>o!==k&&!o.out&&!o.finished);if(G.A){p.target=cand.filter(o=>o.balloons>0).sort((a,b)=>a.p.distanceToSquared(k.p)-b.p.distanceToSquared(k.p))[0]||null;}
   else p.target=cand.filter(o=>o.place<k.place).sort((a,b)=>b.place-a.place)[0]||null;}
  else if(type==='peel'){if(back){p.p.set(k.p.x-fx*2.6,k.p.y+.3,k.p.z-fz*2.6);p.v.set(-fx*3,0,-fz*3);}else{p.p.set(k.p.x+fx*2.4,k.p.y+1,k.p.z+fz*2.4);p.v.set(fx*(k.spd+18),9,fz*(k.spd+18));p.ground=false;}}
  else if(type==='bomb'){const s=back?-10:(k.spd+20);p.v.set(fx*s,back?3:10,fz*s);p.ground=false;if(back)p.p.set(k.p.x-fx*2.6,k.p.y+.8,k.p.z-fz*2.6);}
  m.position.copy(p.p);this.list.push(p);return p;}
 // ---------- hurt ----------
 spin(o,t,by,coins=true){if(o.aura>0||o.invuln>0||o.respawn>0)return false;o.spin=Math.max(o.spin,t);o.drift=0;o.driftT=0;o.driftLv=0;o.boost=0;o.invuln=t+.6;if(coins)o.coins=Math.max(0,o.coins-2);this.G.ev('hit',o,by,'spin');return true;}
 tumble(o,by){if(o.aura>0||o.invuln>0||o.respawn>0)return false;o.tumble=1.3;o.spin=0;o.vel.y=10;o.ground=false;o.vel.x*=.2;o.vel.z*=.2;o.drift=0;o.driftT=0;o.driftLv=0;o.boost=0;o.invuln=1.9;o.coins=Math.max(0,o.coins-3);this.G.ev('hit',o,by,'tumble');return true;}
 explode(p){const G=this.G;G.ev('boom',p.p,p.owner);for(const o of G.karts){if(o.out)continue;const d=o.p.distanceTo(p.p);if(d<8.5)this.tumble(o,p.owner);}p.life=0;}
 // ---------- update ----------
 update(dt){const G=this.G;
  for(const p of this.list){p.age+=dt;p.life-=dt;const m=p.m;
   if(p.type==='seeker'){const t=p.target;let tx,tz;
    if(t&&!t.finished&&!t.out&&t.respawn<=0){const d=t.p.distanceTo(p.p);if(d<28||G.A){tx=t.p.x;tz=t.p.z;}else{const q=this.ground(p.p.x,p.p.z,p.p.y);if(q.ok&&q.B){const B=q.B,j=B.closed?(q.i+8)%B.n:Math.min(B.n-1,q.i+8);tx=B.x[j]+B.nx[j]*B.line[j];tz=B.z[j]+B.nz[j]*B.line[j];}}}
    else{const q=this.ground(p.p.x,p.p.z,p.p.y);if(q.ok&&q.B){const B=q.B,j=B.closed?(q.i+8)%B.n:Math.min(B.n-1,q.i+8);tx=B.x[j];tz=B.z[j];}}
    if(tx!==undefined){const want=Math.atan2(tx-p.p.x,tz-p.p.z),cur=Math.atan2(p.v.x,p.v.z),da=wrapA(want-cur),nd=cur+cl(da,-4.5*dt,4.5*dt),s=Math.min(62,p.v.length()+30*dt);p.v.set(Math.sin(nd)*s,0,Math.cos(nd)*s);}}
   // move
   const nx=p.p.x+p.v.x*dt,nz=p.p.z+p.v.z*dt;
   const q=this.ground(nx,nz,p.p.y);
   if(p.type==='orb'||p.type==='seeker'){
    if(q.ok&&!q.inside&&!(G.A?false:((G.fall&&!(q.flag&F.rail))||(q.flag&F.noWall)))){// bounce off the wall
     if(G.A){const r=q.r||1,ax=nx/r,az=nz/r,vn=p.v.x*ax+p.v.z*az;p.v.x-=2*vn*ax;p.v.z-=2*vn*az;}else{const sg=Math.sign(q.u),vn=(p.v.x*q.nx+p.v.z*q.nz)*sg;if(vn>0){p.v.x-=2*vn*q.nx*sg;p.v.z-=2*vn*q.nz*sg;}}p.bounces++;G.ev('bounce',p.p);}
    else{p.p.x=nx;p.p.z=nz;}
    if(G.A)for(const c of G.A.cols){const dx=p.p.x-c.x,dz=p.p.z-c.z,d=Math.hypot(dx,dz);if(d<c.r+.6){const ax=dx/d,az=dz/d,vn=p.v.x*ax+p.v.z*az;if(vn<0){p.v.x-=2*vn*ax;p.v.z-=2*vn*az;}p.p.x=c.x+ax*(c.r+.6);p.p.z=c.z+az*(c.r+.6);}}
    const gy=q.ok&&q.inside&&!q.gap?q.y:p.p.y-30*dt;p.p.y+=(gy+.6-p.p.y)*Math.min(1,dt*14);if(q.ok&&(!q.inside&&(G.fall||(q.flag&F.noWall)))||q.gap)p.life=Math.min(p.life,.4);
    m.rotation.y=Math.atan2(p.v.x,p.v.z);m.userData.band.rotation.z+=dt*12;}
   else{// peel + bomb: ballistic until grounded, then slide
    p.p.x=nx;p.p.z=nz;const gy=q.ok&&q.inside&&!q.gap?q.y:-1e4;
    if(!p.ground){p.v.y-=30*dt;p.p.y+=p.v.y*dt;if(p.p.y<=gy){p.p.y=gy;p.ground=true;p.v.y=0;if(p.type==='bomb'){p.v.x*=.3;p.v.z*=.3;}else{p.v.x=p.v.z=0;}}}
    else{p.p.y=gy>-1e3?gy:p.p.y-dt*20;p.v.x*=Math.exp(-3*dt);p.v.z*=Math.exp(-3*dt);if(q.ok&&!q.inside&&!G.A){const sg=Math.sign(q.u),ex=Math.abs(q.u)-q.lim;p.p.x-=q.nx*sg*ex;p.p.z-=q.nz*sg*ex;}}
    if(G.A&&Math.hypot(p.p.x,p.p.z)>G.A.R-1.5){const r=Math.hypot(p.p.x,p.p.z);p.p.x*=(G.A.R-1.5)/r;p.p.z*=(G.A.R-1.5)/r;}
    if(gy<-1e3&&p.p.y<(p.y0-20))p.life=0;
    if(p.type==='bomb'){m.userData.spark.scale.setScalar(.7+Math.random()*.8);m.rotation.y+=dt*2;if(p.life<=0){this.explode(p);}}
    else m.rotation.y+=dt*.5;}
   m.position.copy(p.p);if(p.type==='peel')m.position.y+=.05;if(p.type==='bomb')m.position.y+=.75;
   // hits on karts
   if(p.life>0)for(const o of G.karts){if(o.out||o.respawn>0)continue;if(o===p.owner&&p.age<(p.type==='peel'?.6:.45))continue;const r=(o.shrink>0?.9:1.5)+(p.type==='bomb'?.8:.6);
    const dx=o.p.x-p.p.x,dz=o.p.z-p.p.z;if(dx*dx+dz*dz>r*r||Math.abs(o.p.y-p.p.y)>2.6)continue;
    // orbiting orbs block projectiles
    if(o.orbs>0&&p.type!=='bomb'){o.orbs--;p.life=0;G.ev('block',o,p.p);break;}
    if(p.type==='bomb'){this.explode(p);break;}
    if(p.type==='peel'){if(o.aura<=0&&o.invuln<=0){this.spin(o,1.0,p.owner);}p.life=0;G.ev('pop',p.p);break;}
    if(this.tumble(o,p.owner)||o.aura>0||o.invuln>0){p.life=0;G.ev('pop',p.p);break;}}
   if(p.type==='orb'&&p.bounces>5)p.life=0;}
  // projectile vs projectile
  for(let i=0;i<this.list.length;i++)for(let j=i+1;j<this.list.length;j++){const a=this.list[i],b=this.list[j];if(a.life<=0||b.life<=0)continue;if(a.p.distanceToSquared(b.p)<1.6){if(a.type==='bomb')this.explode(a);else if(b.type==='bomb')this.explode(b);else{a.life=0;b.life=0;G.ev('pop',a.p);}}}
  this.list=this.list.filter(p=>{if(p.life<=0){this.scene.remove(p.m);return false;}return true;});
  // orbiting orb visuals
  for(const k of G.karts){let a=this.orbVis.get(k);const n=k.respawn>0?0:k.orbs;if(!a){a=[];this.orbVis.set(k,a);}while(a.length<n){const m=orbMesh('orb');m.scale.setScalar(.75);this.scene.add(m);a.push(m);}while(a.length>n){this.scene.remove(a.pop());}
   k.orbA+=dt*4.5;a.forEach((m,i)=>{const ang=k.orbA+i*Math.PI*2/3;m.position.set(k.p.x+Math.cos(ang)*2.1,k.p.y+.9,k.p.z+Math.sin(ang)*2.1);m.userData.band.rotation.z+=dt*12;});}}
 // AI helper: dangers near a point
 near(p,r){return this.list.filter(x=>x.p.distanceToSquared(p)<r*r);}}
