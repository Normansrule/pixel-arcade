// SKATE CITY — CPU skater: follows a hand-placed line through the park (vert walls, kickers, rails, ollie spots),
// plans air tricks from predicted airtime, balances grinds/manuals with skill-dependent reflexes, and recovers when stuck.
import {G} from './skater.js';
import {DIRS} from './tricks.js';
export const AIDIFF=[{n:'EASY',mult:.5,skill:.5,spin:.15,chain:0,man:.1,trick:.6},{n:'NORMAL',mult:.8,skill:.78,spin:.5,chain:.3,man:.45,trick:.85},{n:'HARD',mult:1,skill:.95,spin:.85,chain:.7,man:.85,trick:1}];
const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;},pick=a=>a[Math.random()*a.length|0],cl=(v,a,b)=>v<a?a:v>b?b:v;
const DXY={N:[0,0],U:[0,1],D:[0,-1],L:[-1,0],R:[1,0],UL:[-1,1],UR:[1,1],DL:[-1,-1],DR:[1,-1]};
export class AI{
 constructor(sk,L,d){this.sk=sk;this.line=L.line;this.d=d;this.i=0;this.t=0;this.nodeT=0;this.slow=0;this.plan=null;this.wasAir=false;this.held=0;this.manT=0;this.onRespawn=null;this.lastBest=1e9;}
 get node(){return this.line[this.i%this.line.length];}
 next(){this.from=null;this.i=(this.i+1)%this.line.length;this.nodeT=0;this.lastBest=1e9;this.armed=false;this.vertDone=false;}
 nearestStart(){const p=this.sk.p;let b=0,bd=1e9;this.line.forEach((n,i)=>{const d=(n[1]-p.x)**2+(n[2]-p.z)**2;if(d<bd){bd=d;b=i;}});this.i=b;this.from=[p.x,p.z];}
 update(dt){const sk=this.sk,c=sk.ctl,d=this.d;this.t+=dt;this.nodeT+=dt;
  c.flip=c.grab=c.grind=c.revert=c.special=false;c.x=0;c.y=0;
  if(sk.mode==='bail'){c.ollie=false;this.plan=null;return;}
  const nd=this.node,[type,tx,tz]=nd;const p=sk.p,v=sk.v;const sp=Math.hypot(v.x,v.z);
  // ---------- air: run the trick plan ----------
  if(sk.mode==='air'){c.ollie=false;if(!this.wasAir){this.wasAir=true;this.makePlan();}const P=this.plan,A=sk.air;if(!P)return;const at=A.t;
   for(const s of P.steps){if(s.kind==='flip'&&!s.done&&at>=s.at){c.flip=true;[c.x,c.y]=DXY[s.dir];s.done=true;return;}
    if(s.kind==='grab'&&at>=s.at&&at<s.at+s.hold){c.grab=true;if(!s.done){[c.x,c.y]=DXY[s.dir];s.done=true;return;}}}
   const gap=p.y-sk.world.H(p.x,p.z);if(v.y<0&&gap<1.1)c.grab=false;
   if(P.spin&&Math.abs(A.spin)+Math.abs(A.spinV)/12<P.spin-.1&&!(sk.trick&&sk.trick.kind==='grab'&&at<.05))c.x=P.sdir;
   if(P.grind&&v.y<0)c.grind=true;
   return;}
  if(this.wasAir){this.wasAir=false;if(sk.mode==='ground'&&sk.combo.active&&Math.random()<d.man&&sp>4&&type!=='vert'){c.manual=true;this.manT=.6+Math.random()*1.4;}
   if(type==='ollie'||type==='kick')this.next();else if(type==='vert')this.vertDone=true;}
  if(type==='vert'&&this.vertDone&&sk.mode==='ground'&&sk.n.y>.92){this.vertDone=false;this.next();return;}
  // ---------- balance ----------
  const bal=o=>{const s=d.skill;return cl(-(o.bal*2.6+o.dr*.5)*s+(Math.random()-.5)*(1-s)*2.2,-1,1);};
  if(sk.mode==='grind'){const g=sk.grind;c.x=bal(g);const R=g.rail,seg=R.segs[g.seg],left=g.dir>0?(1-g.t)*seg.len+R.segs.slice(g.seg+1).reduce((a,s)=>a+s.len,0):g.t*seg.len+R.segs.slice(0,g.seg).reduce((a,s)=>a+s.len,0);
   if(!R.closed&&left<1.1&&Math.random()<d.chain*.2){c.ollie=true;}else c.ollie=false;if(R.closed&&g.dist>8+Math.random()*4)c.ollie=true;
   if(type==='rail')this.next();return;}
  if(sk.mode==='lip'){c.y=bal(sk.lip);c.grind=sk.lip.T<.8+d.skill;return;}
  // ---------- ground: pure pursuit along the line segment (previous node -> this node) ----------
  const pv=this.line[(this.i-1+this.line.length)%this.line.length],ax=this.from?this.from[0]:pv[1],az=this.from?this.from[1]:pv[2];
  let sx=tx-ax,sz=tz-az,sl=Math.hypot(sx,sz)||1;sx/=sl;sz/=sl;let tt=((p.x-ax)*sx+(p.z-az)*sz)/sl;
  let la=Math.min(sl+3,tt*sl+3.5);let aimX=ax+sx*la,aimZ=az+sz*la,want=10.5;
  if(type==='go'&&la>sl){aimX=tx;aimZ=tz;}
  if(type==='rail'){const ex=nd[3],ez=nd[4],dx=ex-tx,dz=ez-tz,l=Math.hypot(dx,dz);const ux=dx/l,uz=dz/l;const along=(p.x-tx)*ux+(p.z-tz)*uz,side=Math.abs((p.x-tx)*uz-(p.z-tz)*ux);
   if(along>-3&&side<1.6){aimX=ex;aimZ=ez;}want=7.5;if(along>-2.4&&along<l-1&&side<1.6)c.grind=true;if(along>l)this.next();}
  if(type==='vert')want=14;if(type==='kick')want=10.5;
  // steer around hazards (fountain water)
  for(const hz of sk.world.hazards){const dx=hz.x-p.x,dz=hz.z-p.z,d0=Math.hypot(dx,dz);const ax2=aimX-p.x,az2=aimZ-p.z,al=Math.hypot(ax2,az2)||1;const t=(dx*ax2+dz*az2)/al;if(t>0&&t<al+hz.r){const off=Math.abs(dx*az2-dz*ax2)/al;if(off<hz.r+1.6&&d0>hz.r){const side=(dx*az2-dz*ax2)>0?1:-1;const px=-az2/al*side,pz=ax2/al*side;aimX=hz.x+px*(hz.r+2.4);aimZ=hz.z+pz*(hz.r+2.4);}}}
  const hx=sp>.6?v.x:Math.sin(this.yaw()),hz=sp>.6?v.z:Math.cos(this.yaw());const cur=Math.atan2(hx,hz),des=Math.atan2(aimX-p.x,aimZ-p.z);const df=wrap(des-cur);
  const onRamp=sk.n.y<.93;c.x=(onRamp&&(type==='vert'||sk.steep))?0:cl(-df*2.4,-1,1);
  if(sk.man){c.y=bal(sk.man);this.manT-=dt;c.ollie=false;if(this.manT<=0||Math.abs(df)>1.3){if(Math.random()<d.chain&&Math.abs(df)<1)c.ollie=true;else c.manual=true;this.manT=9;}}
  else if(Math.abs(df)>1&&sp>4.5&&!onRamp)c.y=-1;else if(sp<want)c.y=1;else if(sp>want+3&&type==='rail')c.y=-1;
  const dist=Math.hypot(tx-p.x,tz-p.z);
  if(type==='go'&&(dist<3||(tt>=1&&dist<7)))this.next();
  if(sk.man){}
  else if(type==='ollie'||type==='kick'){const hl=Math.hypot(hx,hz)||1,ahead=((tx-p.x)*hx+(tz-p.z)*hz)/hl;const tt2=ahead/Math.max(1,sp);if(!this.armed&&tt2<.32&&tt2>-.2&&dist<4){this.armed=true;}
   c.ollie=this.armed;if(this.armed&&(tt2<.04||dist<.5)){c.ollie=false;}if(this.armed&&dist>6)this.armed=false;if(!this.armed&&tt>1.15&&dist>2.5)this.next();}
  else c.ollie=false;
  // stuck / lost: hop to the target node
  if(sp<1&&!sk.steep)this.slow+=dt;else this.slow=0;
  if(this.slow>2.2||this.nodeT>14){this.slow=0;const nx=this.line[(this.i+1)%this.line.length];this.respawnAt(tx,tz,Math.atan2(nx[1]-tx,nx[2]-tz));}}
 yaw(){const f=this.sk.fwd();return Math.atan2(f.x,f.z);}
 respawnAt(x,z,yaw){const sk=this.sk;sk.reset(x,z,yaw);this.nodeT=0;this.next();this.from=[x,z];if(this.onRespawn)this.onRespawn(sk);}
 makePlan(){const sk=this.sk,d=this.d,v=sk.v,A=sk.air;const h0=sk.p.y-sk.world.H(sk.p.x,sk.p.z);let T=(v.y+Math.sqrt(Math.max(0,v.y*v.y+2*G*Math.max(0,h0+(A.vert?0:0)))))/G;if(A.vert)T=2*Math.max(0,v.y)/G+.1;
  const steps=[];let at=.06;const P={steps,spin:0,sdir:Math.random()<.5?1:-1,grind:false};
  if(T>.75&&Math.random()<d.spin){const half=T>1.3&&d.skill>.9?(Math.random()<.5?2:3):T>1?2:1;P.spin=half*Math.PI;if(!A.vert&&half%2===1&&Math.random()<.5)P.spin=Math.PI*2;}
  if(Math.random()<d.trick){let left=T-.35;const n=1+(Math.random()<d.chain?1:0);for(let k=0;k<n&&left>.45;k++){if(Math.random()<.5||left<.75){const dur=sk.flipT;steps.push({kind:'flip',dir:pick(d.skill>.8?DIRS:['N','L','R']),at});at+=dur+.05;left-=dur+.05;}
    else{const hold=Math.min(left-.25,.3+Math.random()*.5);steps.push({kind:'grab',dir:pick(d.skill>.7?DIRS:['N','U','D']),at,hold});at+=hold+.2;left-=hold+.2;}}}
  this.plan=P;}
}
