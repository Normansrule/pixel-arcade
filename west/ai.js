// DUSTWATER — outlaw brains: camp life (sit by the fire, stand watch, lookouts), hearing gunshots, spotting the player with a
// reaction delay, alerting the gang, moving between camp cover (rocks, walls, crates), peeking and firing with difficulty-scaled
// accuracy, reloading, and advancing on a target they lost sight of.
import {V,cl,angDiff} from './util.js';

export const DIFF=[
 {n:'EASY',sight:42,react:1.3,cd:1.7,spread:.085,dmg:8,hp:90,count:4,bounty:.8,duel:1.3,hear:110},
 {n:'NORMAL',sight:60,react:.85,cd:1.2,spread:.055,dmg:10,hp:100,count:6,bounty:1,duel:.9,hear:140},
 {n:'HARD',sight:78,react:.55,cd:1,spread:.038,dmg:12,hp:120,count:8,bounty:1.4,duel:.62,hear:170}];
const NAMES=['JED','CLEM','AMOS','RUFUS','WADE','HOLT','CASS','BRODY','DUKE','LEFTY','ZEKE','MORGAN','TUCK','SAWYER','BOONE','CALLUM','DECKER','FLINT'];
export const bName=i=>NAMES[i%NAMES.length];
const tv=new V();
export function newBrain(){return{state:'idle',alert:0,react:0,seeT:0,think:0,goal:null,coverT:0,strafeT:0,strafe:0,lastSeen:null,heard:null,idleT:Math.random()*5,shots:0,yell:0};}
// called every frame for a living, free bandit; writes a.inp {mx,mz (world move dir), run, face (yaw target), fire, aim}
export function think(a,G,dt){const b=a.ai,D=G.diff,P=G.player,I=a.inp;I.mx=I.mz=0;I.run=false;I.fire=false;I.aim=false;
 b.think-=dt;const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,dist=Math.hypot(dx,dz);
 if(b.think<=0){b.think=.2+Math.random()*.1;
  // perception
  const can=P.alive&&!G.peace;let sees=false;if(can&&dist<D.sight*(P.mounted?1.15:1)){const fa=Math.abs(angDiff(a.yaw,Math.atan2(dx,dz)));if(dist<14||fa<1.15||b.state==='fight')sees=G.los(a,P);}
  b.sees=sees;if(sees){b.lastSeen=P.pos.clone();b.seeT+=.25;if(b.state!=='fight'){b.alert+=(.35+cl(1-dist/D.sight,0,1)*1.4)*(b.state==='alert'?2:1);if(b.alert>=1)G.alarm(a,P.pos);}}else b.seeT=0;
  const nz=G.noise;if(nz&&nz.t>G.time-.35&&b.state!=='fight'){const nd=Math.hypot(nz.p.x-a.pos.x,nz.p.z-a.pos.z);if(nd<D.hear){b.heard=nz.p.clone();if(nd<D.hear*.6||nz.who===P)G.alarm(a,nz.p);else b.state='alert';}}}
 if(b.state==='idle'){a.pose=a.home.sit?'sit':'';if(a.home.sit){a.pos.x+=(a.home.x-a.pos.x)*Math.min(1,dt*4);a.pos.z+=(a.home.z-a.pos.z)*Math.min(1,dt*4);I.face=a.home.face;return;}
  b.idleT-=dt;if(b.idleT<=0){b.idleT=4+Math.random()*7;const r=a.lookout?0:2.5;b.goal=new V(a.home.x+(Math.random()-.5)*r*2,0,a.home.z+(Math.random()-.5)*r*2);b.look=a.home.face+(Math.random()-.5)*1.6;}
  if(b.goal){const gx=b.goal.x-a.pos.x,gz=b.goal.z-a.pos.z,gd=Math.hypot(gx,gz);if(gd>.4){I.mx=gx/gd*.45;I.mz=gz/gd*.45;I.face=Math.atan2(gx,gz);}else{b.goal=null;}}else I.face=b.look??a.home.face;return;}
 a.pose='';
 if(b.state==='alert'){const h=b.heard||b.lastSeen;if(h){const gx=h.x-a.pos.x,gz=h.z-a.pos.z,gd=Math.hypot(gx,gz);I.face=Math.atan2(gx,gz);I.aim=true;if(gd>6){I.mx=gx/gd*.6;I.mz=gz/gd*.6;}}return;}
 // ---- fight ----
 I.aim=true;const see=b.sees;if(see){b.react-=dt;I.face=Math.atan2(dx,dz);}else{b.react=Math.max(b.react,D.react*.5);}
 // cover selection
 b.coverT-=dt;if(b.coverT<=0||!b.goal){b.coverT=3.5+Math.random()*4;let best=null,bs=1e9;const pref=a.wpn==='rifle'?32:18;
  for(const c of a.camp.cover){const ox=c.x-P.pos.x,oz=c.z-P.pos.z,od=Math.hypot(ox,oz)||1,sx=c.x+ox/od*(c.r+.9),sz=c.z+oz/od*(c.r+.9);const sd=Math.hypot(sx-a.pos.x,sz-a.pos.z),pd=Math.hypot(sx-P.pos.x,sz-P.pos.z);
   let sc=sd*.8+Math.abs(pd-pref)*.6+(G.coverTaken(c,a)?40:0)+Math.random()*6;if(sc<bs){bs=sc;best={x:sx,z:sz,c};}}
  if(G.diff.n==='HARD'&&Math.random()<.25&&dist>14)best={x:a.pos.x+dx*.35,z:a.pos.z+dz*.35,c:null};
  if(!see&&b.lastSeen&&Math.random()<.5)best={x:b.lastSeen.x+(Math.random()-.5)*8,z:b.lastSeen.z+(Math.random()-.5)*8,c:null};
  if(best){b.goal=new V(best.x,0,best.z);b.cover=best.c;}}
 let mvx=0,mvz=0;if(b.goal){const gx=b.goal.x-a.pos.x,gz=b.goal.z-a.pos.z,gd=Math.hypot(gx,gz);if(gd>.7){mvx=gx/gd;mvz=gz/gd;I.run=gd>4;if(!see)I.face=Math.atan2(gx,gz);}
  else{b.strafeT-=dt;if(b.strafeT<=0){b.strafeT=1.2+Math.random()*2;b.strafe=Math.random()<.5?-1:Math.random()<.5?1:0;}if(b.strafe&&dist>3){const rx=dz/dist,rz=-dx/dist;mvx=rx*b.strafe*.55;mvz=rz*b.strafe*.55;}}}
 if(dist<7){mvx-=dx/dist*.8;mvz-=dz/dist*.8;}
 I.mx=mvx;I.mz=mvz;
 // fire
 if(see&&b.react<=0&&a.cd<=0&&a.reloadT<=0&&dist<D.sight*1.4){if(a.mag>0){I.fire=true;}else{a.reloadT=2.2;}}}
