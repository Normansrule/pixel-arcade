// RUNLINE — level builder (a heading cursor that lays rooftop "pieces" and the rival's route) + the 12 handcrafted courses.
const PI=Math.PI,H90=PI/2;
export const DISTRICTS=[
 {id:'sun',name:'SUNWARD HEIGHTS',sub:'Sunlit rooftops · cranes · billboards',col:'#ff6a1a'},
 {id:'neon',name:'NEON YARDS',sub:'Night industry · surf ramps · lasers',col:'#19e3ff'},
 {id:'sky',name:'CLOUDLINE',sub:'Sky towers above the clouds',col:'#ffb43a'}];
// gold-pace speeds of the rival per route tag (m/s): r run, j jump, w wallrun, g grapple, s slide, u surf, m mantle/climb, v vault, f fall
const REF={l1:16.4,l2:18.9,l3:18.7,l4:18.3,l5:17.4,l6:19.4,l7:17.1,l8:21.6,l9:13.7,l10:12.5,l11:16.1,l12:21.8};
export const PACE={r:10.6,j:10.8,w:11.4,g:17,s:13.5,u:17,m:3.4,v:8.5,f:12};

class B{
 constructor(id,name,district,seed){this.lip=null;this.L={id,name,district,boxes:[],route:[],orbs:[],cps:[],graps:[],lasers:[],drones:[],boards:[],cranes:[],deco:[],tips:[],crumbles:[]};
  this.x=0;this.y=0;this.z=0;this.h=0;this.pend='r';this.seed=seed;this.roofN=0;}
 rnd(){this.seed=(this.seed*16807)%2147483647;return(this.seed-1)/2147483646;}
 W(u,v,f){const c=Math.cos(this.h),s=Math.sin(this.h);return[this.x+u*c-f*s,this.y+v,this.z-u*s-f*c];}
 adv(f,u=0,dy=0){const p=this.W(u,dy,f);this.x=p[0];this.y=p[1];this.z=p[2];}
 box(u,v,f,w,h,d,o={}){const b={p:this.W(u,v,f),s:[w,h,d],r:[o.pitch||0,this.h+(o.yaw||0),o.roll||0],m:o.m||'conc'};for(const k of['hint','nc','crumble','surf','tint','run','ad','dk','lip'])if(o[k]!==undefined)b[k]=o[k];this.L.boxes.push(b);return b;}
 pt(u,v,f,tag,side){this.L.route.push({p:this.W(u,v,f),tag:tag||'r',side:side||0});}
 tip(text,f=0,r=7){this.L.tips.push({p:this.W(0,1,f),r,text});}
 orb(u,v,f){this.L.orbs.push(this.W(u,v,f));}
 drone(u,v,f,o={}){const c=Math.cos(this.h),s=Math.sin(this.h);const ax=o.axis==='f'?[-s,0,-c]:[c,0,-s];this.L.drones.push({c:this.W(u,v,f),ax,range:o.range??3.5,speed:o.speed??1.4,ph:this.rnd()*6});}
 laser(f,v,w,o={}){const a=this.W(-w/2+.35,v,f),b=this.W(w/2-.35,v,f);this.L.lasers.push({a,b,mode:o.mode||'on',period:o.period||2.2,duty:o.duty??.55,amp:o.amp||0,speed:o.speed||1.6,ph:o.ph??this.rnd()*6});
  this.box(-w/2+.15,v,f,.3,.5,.3,{m:'metal'});this.box(w/2-.15,v,f,.3,.5,.3,{m:'metal'});}
 /* a building whose roof is at cursor height + top */
 bld(u,f0,w,len,top=0,o={}){return this.box(u,(top-70)/2,f0+len/2,w,70+top,len,{m:'bld',...o});}
 start(f=2){this.L.start={p:this.W(0,0,f),yaw:this.h};}
 roof(len,o={}){const w=o.w??10,tag=this.pend;this.pend='r';this.roofN++;
  this.bld(0,0,w,len,0,{dk:o.dk});
  if(o.start)this.start(Math.min(3,len*.3));
  const pts=[[Math.min(2.2,len*.3),0,tag]];
  // parapets along the long sides
  if(w>=7&&o.par!==false){for(const s of[-1,1])this.box(s*(w/2-.15),.25,len/2,.3,.5,len-.2,{m:'par'});}
  if(o.cp)this.L.cps.push({p:this.W(0,0,Math.min(2.4,len*.4)),yaw:this.h});
  for(const f of o.vault||[]){this.box(0,.5,f,w-1.2,1,.7,{m:'acc',hint:true});pts.push([f-1.2,0,'r'],[f+1,0,'v']);}
  for(const f of o.pipe||[]){this.box(0,1.62,f,w+.4,.5,.7,{m:'pipe',hint:true});for(const s of[-1,1])this.box(s*(w/2-.2),.7,f,.3,1.4,.3,{m:'metal'});pts.push([f-2.4,0,'r'],[f+1.6,0,'s']);}
  for(const l of o.laser||[]){this.laser(l.f,l.v,w,l);pts.push([l.f-2,0,'r'],[l.f+1.6,0,l.v>1.2?'s':'j']);}
  for(const d of o.drone||[])this.drone(d.u??0,d.v??1.3,d.f,d);
  for(const ob of o.orb||[])this.orb(ob[0],ob[1],ob[2]);
  for(const t of o.tip||[])this.tip(t[1],t[0],t[2]||7);
  if(o.fin){const ff=Math.max(len-3.5,len*.6);this.L.finish={p:this.W(0,0,ff),yaw:this.h};pts.push([ff,0,'r']);}
  else pts.push([len-.7,0,'r']);
  pts.sort((a,b)=>a[0]-b[0]);for(const p of pts)this.pt(0,p[1],p[0],p[2]);
  // roof clutter off the line
  if(w>=8&&len>=11&&o.deco!==false){for(let f=5;f<len-4;f+=5+this.rnd()*4){const s=this.rnd()<.5?-1:1;if(this.rnd()<.7)this.L.deco.push({k:'r'+(this.rnd()*4|0),p:this.W(s*(w/2-1.4),0,f),yaw:this.h+(this.rnd()<.5?0:H90),s});}}
  // takeoff lip at the far edge
  this.lip=o.fin?null:this.box(0,.03,len-.12,Math.min(w-1,6),.08,.24,{m:'acc',hint:true,nc:true,lip:true});
  this.adv(len);return this;}
 noLip(){if(this.lip){const i=this.L.boxes.indexOf(this.lip);if(i>=0)this.L.boxes.splice(i,1);this.lip=null;}}
 gap(d,dy=0){this.adv(d,0,dy);this.pend=dy>1?'m':dy<-5?'f':'j';return this;}
 up(h){this.adv(0,0,h);this.pend='m';return this;}
 corner(size,dir,o={}){this.noLip();const tag=this.pend;this.pend='r';this.bld(0,0,size,size,0);this.pt(0,0,Math.min(2,size*.3),tag);this.pt(0,0,size/2,'r');
  if(o.cp)this.L.cps.push({p:this.W(0,0,size/2),yaw:this.h+dir*H90});
  for(const ob of o.orb||[])this.orb(ob[0],ob[1],ob[2]);
  this.adv(size/2);this.h+=dir*H90;this.adv(size/2);this.pt(0,0,-.7,'r');
  // parapet on the outer sides
  this.box(0,.25,-size+.15,size,.5,.3,{m:'par'});this.box(dir*(size/2-.15),.25,-size/2,.3,.5,size,{m:'par'});return this;}
 // wall-run wall alongside a gap
 wall(len,side,o={}){const off=o.off??2.9,u=side*off,dy=o.dy??0;
  this.box(u,.6,len/2,.5,10,len-2,{m:'wall',hint:true,run:true,ad:o.ad});
  const pu=side*(off-.68);this.pt(pu,1.3,2.6,'w',side);this.pt(pu,1.9,len*.5,'w',side);this.pt(pu,1.3,len-2.5,'w',side);
  for(const ob of o.orb||[])this.orb(ob[0]*side,ob[1],ob[2]);
  this.adv(len,0,dy);this.pend=dy>1?'m':'j';return this;}
 walls(len,side,o={}){const off=3,a=len*.56,b=len*.44;
  this.box(side*off,.6,1+(a-1)/2,.5,10,a-1,{m:'wall',hint:true,run:true});this.box(-side*off,.9,b+(len-1-b)/2,.5,10,len-1-b,{m:'wall',hint:true,run:true});
  const p1=side*(off-.68),p2=-side*(off-.68);this.pt(p1,1.3,2.6,'w',side);this.pt(p1,1.9,a*.62,'w',side);this.pt(p2,2.4,b+2.6,'w',-side);this.pt(p2,2.2,len-2.6,'w',-side);
  for(const ob of o.orb||[])this.orb(ob[0],ob[1],ob[2]);
  this.adv(len,0,o.dy??0);this.pend='j';return this;}
 grap(d,o={}){const gh=o.gh??6.5,dy=o.dy??0;const gp=this.W(o.gu??0,gh+Math.max(0,dy)*.6,d*(o.at??.5));this.L.graps.push(gp);
  this.pt(0,2.6,d*.16,'j');this.pt(o.gu??0,gh-1.6+Math.max(0,dy)*.5,d*(o.at??.5)-2.5,'g');
  for(const ob of o.orb||[])this.orb(ob[0],ob[1],ob[2]);
  this.adv(d,0,dy);this.pend='f';return this;}
 // slide ramp going down
 slope(len,drop,o={}){this.noLip();const w=o.w??7,L=Math.hypot(len,drop),pitch=-Math.atan2(drop,len),nv=len/L,nf=drop/L;
  this.box(0,-drop/2-nv*.3,len/2-nf*.3,w,.6,L,{m:'ramp',pitch,hint:true});
  for(const s of[-1,1])this.box(s*(w/2+.1),-drop/2+.35,len/2,.25,.5,L,{m:'metal',pitch,nc:true});
  for(let f=4;f<len-1;f+=7)for(const s of[-1,1])this.box(s*(w/2-.6),-drop*f/len-30.5,f,.5,60,.5,{m:'metal'});
  const tag=this.pend;this.pend='r';this.pt(0,-drop*.12,len*.12,tag==='r'?'r':tag);this.pt(0,-drop*.5,len*.5,'s');this.pt(0,-drop+.3,len-.6,'s');
  for(const ob of o.orb||[])this.orb(ob[0],ob[1],ob[2]);
  this.adv(len,0,-drop);return this;}
 // surf ramp: an A-frame prism falling away along the path; ride the `side` face
 surf(len,drop,side,o={}){const a=o.angle??.9,fw=o.fw??7.4,peak=o.peak??-.5,fs=2,ln=len-fs,L=Math.hypot(ln,drop),pitch=-Math.atan2(drop,ln),ca=Math.cos(a),sa=Math.sin(a),fm=fs+ln/2;
  for(const s of[-1,1]){const cu=s*(fw/2*ca-.25*sa),cv=peak-fw/2*sa-.25*ca;this.box(cu,cv-drop/2,fm,fw,.5,L,{m:'surf',pitch,roll:-s*a,hint:s===side,surf:true});}
  this.box(0,peak-drop/2+.02,fm,.3,.2,L,{m:'neon',pitch,nc:true});
  const hAt=f=>-drop*Math.max(0,f-fs)/ln;
  for(let f=fs+4;f<len-2;f+=9)this.box(0,peak+hAt(f)-31,f,.6,60,.6,{m:'metal'});
  const pu=side*1.9,pv=peak-1.9*Math.tan(a)+.1;const tag=this.pend;this.pend='j';
  this.pt(pu,pv+hAt(4.5),4.5,tag==='r'?'j':tag,side);this.pt(pu,pv+hAt(fs+ln*.5),fs+ln*.5,'u',side);this.pt(pu,pv+hAt(len-1.5),len-1.5,'u',side);
  for(const ob of o.orb||[])this.orb(ob[0]*side,ob[1],ob[2]);
  this.adv(len,0,-drop);return this;}
 // narrow girder / crane jib / skybridge across a gap
 beam(len,o={}){const w=o.w??1.5;this.box(0,-.25,len/2,w,.5,len-3,{m:'beam',hint:true});const tag=this.pend;this.pend='j';this.pt(0,0,2.2,tag==='r'?'j':tag);this.pt(0,0,len-2.2,'r');
  if(o.crane)this.L.cranes.push({p:this.W(o.crane*7,0,len*.5),yaw:this.h,jib:len,side:o.crane});
  for(const ob of o.orb||[])this.orb(ob[0],ob[1],ob[2]);
  this.adv(len);return this;}
 // collapsing slabs
 crumble(len,o={}){const n=Math.max(2,Math.round((len-2)/3.6)),seg=(len-2)/n,w=o.w??4;const tag=this.pend;this.pend='j';
  for(let i=0;i<n;i++){const f=1+seg*i+seg/2;const b=this.box((i%2?.6:-.6)*(o.zig??0),-.2,f,w,.4,seg-.5,{m:'plat',crumble:true});this.L.crumbles.push(b);this.pt((i%2?.6:-.6)*(o.zig??0),0,f,i===0?(tag==='r'?'j':tag):'r');}
  this.adv(len);return this;}
 board(u,f,o={}){const p=this.W(u,o.v??0,f);this.L.boards.push({p,yaw:this.h+(o.yaw??0),w:o.w??8,h:o.h??4.5,ad:o.ad??-1});return this;}
 crane(u,f,o={}){this.L.cranes.push({p:this.W(u,o.v??-30,f),yaw:this.h+(o.yaw??0),jib:o.jib??34,side:0,mast:o.mast??60});return this;}
 done(){const L=this.L;if(!L.finish)throw new Error('no finish '+L.id);let minY=1e9;for(const r of L.route)minY=Math.min(minY,r.p[1]);L.killY=minY-22;
  // medal times from the route at rival pace
  let gold=0;for(let i=1;i<L.route.length;i++){const a=L.route[i-1].p,b=L.route[i].p;gold+=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])/PACE[L.route[i].tag];}
  // medal times are calibrated against the physics autopilot's clean run (REF, a near-perfect line without tricks); the route estimate is a fallback
  const r1=x=>Math.round(x*10)/10,ref=REF[L.id]??gold*.85;L.est=r1(gold);L.ref=ref;L.plat=r1(ref*.97);L.gold=r1(ref*1.12);L.silver=r1(ref*1.35);L.bronze=r1(ref*1.65);L.par=Math.ceil((L.bronze*1.5+8)/5)*5;
  return L;}
}

/* ====================== the courses ====================== */
function L1(){const b=new B('l1','FIRST LIGHT',0,11);
 b.roof(26,{start:true,tip:[[0,'WASD to run (sprint is automatic) · MOUSE to look',8],[17,'SPACE — jump the gap',6]],orb:[[3,1.2,13]]});
 b.gap(3.5).roof(18,{vault:[9],tip:[[4,'Run into low walls to VAULT them',6]]});
 b.gap(4.5,-1.5).roof(20,{pipe:[11],cp:true,tip:[[5,'Hold C or CTRL while running to SLIDE under',7]],orb:[[-3,1,16]]});
 b.tip('Jump at a ledge and keep W held to MANTLE',-3,6);b.gap(3,2.4).roof(16,{orb:[[0,1.2,8]]});
 b.tip('Jump onto the red wall to WALL-RUN · SPACE kicks off',-2,7);b.wall(13,1,{orb:[[2.2,2.4,6.5]]}).roof(20,{cp:true});
 b.tip('Big drop: press C just before you land to ROLL',-3,7);b.gap(4,-8).roof(22,{cp:true,orb:[[3.4,1.2,12]]});
 b.tip('RIGHT-CLICK the glowing node to GRAPPLE',-2,8);b.grap(22,{orb:[[0,4.8,8]]}).roof(24,{fin:true});
 return b.done();}
function L2(){const b=new B('l2','CRANE LINE',0,23);
 b.crane(-26,8,{jib:40}).crane(30,70,{yaw:H90,jib:30});
 b.roof(20,{start:true,orb:[[3,1,12]],tip:[[1,'Tap E or LEFT-CLICK to DASH — it stretches any jump',7]]});
 b.gap(4).roof(14,{vault:[7]});
 b.beam(18,{crane:1,orb:[[0,1.2,9]]}).roof(16,{cp:true});
 b.wall(14,-1,{ad:2}).roof(12);
 b.gap(3,2.2).roof(18,{pipe:[8],orb:[[3.4,1,13]]});
 b.grap(24,{gh:7}).roof(16,{cp:true});
 b.board(-4.6,6,{yaw:H90,w:7,ad:1});
 b.slope(22,7,{orb:[[0,1.2,12]]}).gap(6,-1).roof(14);
 b.walls(18,1).roof(22,{fin:true,orb:[[-3,1,8]]});
 return b.done();}
function L3(){const b=new B('l3','BILLBOARD ALLEY',0,37);
 b.crane(34,20,{jib:36,yaw:-.4});
 b.roof(18,{start:true});
 b.wall(14,1,{ad:0,orb:[[2.2,2.5,7]]}).roof(10);
 b.wall(14,-1,{ad:3}).roof(14,{cp:true});
 b.corner(12,1,{orb:[[0,1.2,6]]}).gap(4);
 b.crumble(15,{zig:1}).roof(14,{cp:true});
 b.tip('Long fall — ROLL with C as you land',-2,6);b.gap(5,-9).roof(18,{pipe:[8],vault:[13],orb:[[-3.4,1,4]]});
 b.walls(20,-1,{orb:[[0,3,10]]}).roof(12,{cp:true});
 b.corner(12,-1).gap(4.5).roof(20,{fin:true});
 return b.done();}
function L4(){const b=new B('l4','SKYLIGHT SPRINT',0,41);
 b.crane(-30,40,{jib:38,yaw:.5}).crane(28,120,{jib:32,yaw:2.2});
 b.roof(24,{start:true,drone:[{f:15,range:3}],tip:[[2,'Drones knock you around — time your pass',7],[19,'Long gap: DASH mid-jump (E / LEFT-CLICK)',6]]});
 b.gap(7).roof(16);
 b.slope(20,6).gap(8,-1).roof(18,{cp:true,drone:[{f:10,range:3.5,speed:1.8}],orb:[[3.4,1,14]]});
 b.gap(3,2.2).roof(10);
 b.wall(14,1,{ad:4}).roof(14,{orb:[[0,1.2,7]]});
 b.grap(26,{gh:7.5}).roof(18,{cp:true});
 b.crumble(16).roof(12);
 b.gap(6,-2).roof(20,{fin:true,orb:[[3.2,1,6]]});
 return b.done();}
function L5(){const b=new B('l5','SURF YARD',1,53);
 b.roof(20,{start:true,tip:[[12,'SURF: land on the red face, hold A or D into it and steer down the ramp',9]]});
 b.gap(3).roof(10);
 b.surf(40,10,1,{orb:[[1.9,0,26]]}).gap(3,-2).roof(16,{cp:true});
 b.surf(44,12,-1).gap(3,-2).roof(14,{cp:true,orb:[[3.4,1,7]]});
 b.wall(14,1).roof(12);
 b.surf(36,9,1).gap(3,-2).roof(20,{fin:true});
 return b.done();}
function L6(){const b=new B('l6','LASER GRID',1,61);
 b.roof(22,{start:true,laser:[{f:12,v:.45}],tip:[[5,'Lasers send you back to the checkpoint — jump the low beams',7]]});
 b.gap(4).roof(24,{laser:[{f:7,v:1.5},{f:13,v:.45,mode:'blink',period:2.4}],tip:[[2,'SLIDE under the high beams',6]]});
 b.wall(14,-1).roof(22,{cp:true,laser:[{f:11,v:.9,mode:'sweep',amp:.75,speed:1.4}],orb:[[3.4,1,18]]});
 b.gap(5,-2).roof(20,{laser:[{f:5,v:1.5},{f:11,v:.45}]});
 b.corner(12,1).surf(32,8,-1).gap(3,-2).roof(14,{cp:true});
 b.walls(18,1,{orb:[[0,3,9]]}).roof(16,{laser:[{f:8,v:.45,mode:'blink',period:2}]});
 b.grap(24).roof(24,{fin:true,laser:[{f:15,v:1.5,mode:'blink',period:3,duty:.7}]});
 return b.done();}
function L7(){const b=new B('l7','SMOKESTACK',1,71);
 b.roof(18,{start:true,tip:[[10,'Run and jump INTO a tall wall to climb it, then mantle',7]]});
 b.gap(3,2.4).roof(8,{w:8});
 b.up(3.4).roof(10,{cp:true,w:9});
 b.grap(18,{gh:11,dy:6}).roof(12,{orb:[[3,1,6]]});
 b.wall(14,1,{dy:1.5}).roof(12,{cp:true});
 b.slope(30,12,{orb:[[0,1,18]]}).gap(9,-3).roof(14);
 b.up(3).roof(10,{drone:[{f:5,range:3}]});
 b.grap(30,{gh:8}).roof(20,{fin:true,orb:[[-3,1,8]]});
 return b.done();}
function L8(){const b=new B('l8','OVERDRIVE',1,83);
 b.roof(18,{start:true}).gap(4).roof(10);
 b.surf(40,12,1,{orb:[[1.9,0,20]]}).gap(3,-2).roof(12,{cp:true});
 b.walls(18,-1).roof(10,{drone:[{f:5,range:3}]});
 b.grap(26).roof(14,{cp:true,laser:[{f:8,v:.45,mode:'blink',period:2.2}]});
 b.slope(20,8).gap(9,-2).roof(12,{orb:[[3.4,1,6]]});
 b.crumble(14).roof(12,{cp:true});
 b.surf(36,10,-1).gap(3,-2).roof(20,{fin:true,laser:[{f:8,v:1.5}]});
 return b.done();}
function L9(){const b=new B('l9','ABOVE THE DECK',2,97);
 b.roof(18,{start:true,tip:[[10,'Skybridges are narrow — keep your line',7]]});
 b.beam(14).roof(12,{orb:[[3,1,6]]});
 b.grap(24,{orb:[[0,5,9]]}).roof(14,{cp:true});
 b.crumble(16,{zig:1}).roof(10);
 b.wall(14,1).roof(14,{cp:true});
 b.corner(12,-1).gap(6,-2).roof(12);
 b.grap(26,{gh:7}).roof(20,{fin:true,orb:[[-3,1,8]]});
 return b.done();}
function L10(){const b=new B('l10','SPIRE HOPS',2,101);
 b.roof(14,{start:true,w:8});
 b.gap(4).roof(5,{w:5});b.gap(4.5).roof(5,{w:5,orb:[[0,1.2,2.5]]});b.gap(4,1.5).roof(6,{w:6,cp:true});
 b.wall(14,-1).roof(11,{w:6});
 b.walls(18,1,{orb:[[0,3,9]]}).roof(12,{cp:true});
 b.beam(16,{w:1.1}).roof(6,{w:6});
 b.gap(5,-2).roof(5,{w:5});b.gap(5,-2).roof(16,{fin:true});
 return b.done();}
function L11(){const b=new B('l11','STORM RAIL',2,113);
 b.roof(16,{start:true});
 b.slope(26,9).gap(8,-2).roof(12,{cp:true,drone:[{f:6,range:3}]});
 b.slope(22,8,{orb:[[0,1,12]]}).gap(8,-2).roof(20,{laser:[{f:11,v:.45,mode:'sweep',amp:.4}]});
 b.wall(14,-1).roof(12,{cp:true});
 b.surf(40,12,1).gap(3,-2).roof(12,{orb:[[-3,1,6]]});
 b.grap(26).roof(20,{fin:true});
 return b.done();}
function L12(){const b=new B('l12','ZENITH',2,127);
 b.roof(16,{start:true}).gap(3,2.4).roof(8);
 b.wall(14,1).roof(10,{cp:true});
 b.up(3.2).roof(8,{w:8});
 b.grap(22,{gh:12,dy:5}).roof(12,{cp:true});
 b.walls(18,-1).roof(10);
 b.crumble(14).roof(12,{cp:true,drone:[{f:6,range:3}]});
 b.slope(20,7).gap(7,-1).roof(10);
 b.grap(28,{orb:[[0,5,12]]}).roof(12,{cp:true});
 b.gap(3,2.2).roof(8);
 b.wall(14,-1).roof(18,{fin:true,orb:[[3,1,8]]});
 return b.done();}

export const LEVELS=[L1(),L2(),L3(),L4(),L5(),L6(),L7(),L8(),L9(),L10(),L11(),L12()];
