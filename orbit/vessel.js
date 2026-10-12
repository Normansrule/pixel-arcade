// ORBIT LAB — vessel flight dynamics: staging, thrust (pressure-dependent Isp), drag, aero torque, SAS, parachutes,
// landing/crash, patched-conic SOI switching, and on-rails (Kepler) time warp. Pure JS.
import * as P from './physics.js';
import {layout,segments,engineStats} from './parts.js';
const {add,sub,mul,madd,dot,cross,len,norm,clamp,qrot,qmul,qnorm,qconj,qLook,BODY,VERDA,LUNE}=P;

export const SAS_MODES=['off','hold','pro','retro','normal','anti','radout','radin','node','target','antitarget'];

export class Vessel{
 constructor(ids,o={}){this.ids=ids.slice();this.ps=layout(ids).map(p=>({...p,fuel:p.def.fuel?p.def.fuel*1000:0,fuel0:p.def.fuel?p.def.fuel*1000:0}));
  this.easy=!!o.easy;this.body='verda';const up=P.LAUNCH;this.ignited=false;this.throttle=0;this.sas='hold';this.w=[0,0,0];
  this.chute=0;this.chuteOpen=0;this.chuteTorn=false;this.legs=false;this.solarOpen=false;this.landed=true;this.landedOn='verda';this.splashed=false;this.destroyed=null;
  this.ecMax=this.ps.reduce((a,p)=>a+(p.def.ec||0),0);this.ec=this.ecMax;this.heat=0;this.q=0;this.mach=0;this.dvAcc=[0,0,0];this.dvUsed=0;this.gload=1;this.aoa=0;
  this.stats={maxAlt:0,maxQ:0,maxG:0,maxV:0,landedLune:false,landedLuneOk:false,enteredLune:false,landT:0,flightT:0};this.events=[];
  const mp=this.props();this.q4=qLook(up,[0,0,-1]);this.r=mul(up,VERDA.R+mp.foot+.02);this.v=[0,0,0];this.holdDir=up;}
 get nose(){return qrot(this.q4,[0,1,0]);}
 get right(){return qrot(this.q4,[1,0,0]);}
 get B(){return BODY[this.body];}
 get alt(){return len(this.r)-this.B.R;}
 segs(){return segments(this.ps);}
 bottomSeg(){return this.segs()[0]||[];}
 hasChute(){return this.ps.some(p=>p.def.chute);}
 hasLegs(){return this.ps.some(p=>p.def.legs);}
 hasSolar(){return this.ps.some(p=>p.def.solar);}
 // mass properties of the attached stack (kg, m)
 props(){let m=0,my=0,la=0,ly=0,dmax=1.25;for(const p of this.ps){const pm=p.def.mass*1000+p.fuel,yc=(p.y0+p.y1)/2;m+=pm;my+=pm*yc;const a=p.def.h*Math.max(p.dt,p.db)*(p.def.pod?.6:1)+(p.def.fins||0)*(p.dt/1.25)**2;la+=a;ly+=a*(p.def.fins?p.y0+.1:yc);dmax=Math.max(dmax,p.dt,p.db);}
  const com=m?my/m:0;let I=0;for(const p of this.ps){const pm=p.def.mass*1000+p.fuel,yc=(p.y0+p.y1)/2;I+=pm*((yc-com)**2+p.def.h**2/12+Math.max(p.dt,p.db)**2/16);}
  const y0=this.ps.length?this.ps[this.ps.length-1].y0:0;const top=this.ps.find(p=>!p.def.chute);
  const legExt=this.legs&&this.hasLegs()?.9:0;
  return{m,com,I:Math.max(I,50),cop:la?ly/la:com,Slat:la,dmax,foot:com-y0+legExt,y0,top,cd:(top&&top.def.pod&&!top.def.probe?.32:.7)+(this.ps.some(p=>p.def.fins)?.06:0)};}
 engines(){return this.bottomSeg().filter(p=>p.def.thrust);}
 segFuel(){return this.bottomSeg().reduce((a,p)=>a+p.fuel,0);}
 segFuel0(){return this.bottomSeg().reduce((a,p)=>a+p.fuel0,0);}
 thrustInfo(pr){const E=engineStats(this.engines(),pr);const live=this.ignited&&this.segFuel()>0&&E.F>0;return{...E,live};}
 // remaining delta-v per stage from current fuel (vacuum Isp, or current pressure for the active stage)
 dvStages(pr=0){const segs=this.segs();const out=[];let above=0;const ms=segs.map(s=>s.reduce((a,p)=>a+p.def.mass*1000+p.fuel,0));
  for(let i=segs.length-1;i>=0;i--){above+=ms[i];const s=segs[i],fuel=s.reduce((a,p)=>a+p.fuel,0),E=engineStats(s.filter(p=>p.def.thrust),i===0?pr:0);
   out[i]={m0:above,mf:above-fuel,isp:E.isp,F:E.F,fuel,dv:fuel>0&&E.F>0?E.isp*P.G0*Math.log(above/(above-fuel)):0};}return out;}
 dvTotal(pr=0){return this.dvStages(pr).reduce((a,s)=>a+s.dv,0);}
 // SPACE: ignite → separate → open chute
 stage(){if(this.destroyed)return null;
  if(!this.ignited&&this.engines().length){this.ignited=true;this.ev('ignite');return'ignite';}
  const segs=this.segs();
  if(segs.length>1){const drop=segs[0];const oldCom=this.props().com,oldR=this.r.slice(),nose=this.nose;
   this.ps=this.ps.slice(0,this.ps.length-drop.length);this.ignited=true;const yDrop=drop.reduce((a,p)=>a+p.def.h,0);
   for(const p of this.ps){p.y0-=yDrop;p.y1-=yDrop;}// re-base so the stack bottom is y=0, and keep the remaining parts where they were
   this.r=madd(oldR,nose,this.props().com+yDrop-oldCom);
   this.ev('sep',{parts:drop,r:madd(oldR,nose,yDrop/2-oldCom),v:this.v.slice(),q:this.q4.slice(),body:this.body,yDrop});return'sep';}
  if(this.hasChute()&&!this.chute){this.deployChute();return'chute';}
  return null;}
 deployChute(){if(!this.hasChute()||this.chute||this.chuteTorn)return false;this.chute=1;this.ev('chute');return true;}
 toggleLegs(){if(!this.hasLegs())return;this.legs=!this.legs;this.ev('legs');}
 toggleSolar(){if(!this.hasSolar())return;this.solarOpen=!this.solarOpen;this.ev('solar');}
 ev(type,data={}){this.events.push({type,...data});}
 inSun(){const rr=this.uniPos(this._t||0),s=dot(rr,P.SUN);if(s>0)return true;return len(sub(rr,mul(P.SUN,s)))>VERDA.R;}
 uniPos(t){return this.body==='verda'?this.r:add(this.r,P.lunePos(t));}
 uniVel(t){return this.body==='verda'?this.v:add(this.v,P.luneState(t).v);}
 orbit(){return P.elements(this.r,this.v,this.B.mu);}
 // direction the SAS should hold for a mode; ctx.node / ctx.target supplied by the game
 sasDir(mode,ctx={}){const r=this.r,v=this.v,vh=len(v)>.5?norm(v):norm(r);const h=cross(r,v);const hn=len(h)>1e-3?norm(h):[0,1,0];
  switch(mode){case'pro':return vh;case'retro':return mul(vh,-1);case'normal':return hn;case'anti':return mul(hn,-1);
   case'radout':return len(h)>1e-3?norm(cross(v,h)):norm(r);case'radin':return len(h)>1e-3?mul(norm(cross(v,h)),-1):mul(norm(r),-1);
   case'node':return ctx.nodeDir||null;case'target':return ctx.tgtDir||null;case'antitarget':return ctx.tgtDir?mul(ctx.tgtDir,-1):null;
   case'hold':return this.holdDir;default:return null;}}
 // one physics step. inp:{pitch,yaw,roll,throttle,dir(optional explicit target direction)}
 step(dt,inp,t){if(this.destroyed)return;this._t=t;const B=this.B;let rn=len(this.r),up=mul(this.r,1/rn),alt=rn-B.R;
  const pr=P.pressureRatio(B,alt),rho=P.density(B,alt);const mp=this.props();this.throttle=clamp(inp.throttle??this.throttle,0,1);
  const E=this.thrustInfo(pr);const thr=E.live?this.throttle:0;const F=E.F*thr,mdot=E.mdot*thr;this.thrustN=F;
  // ---- attitude ----
  const easyK=this.easy?1.6:1;const hasEC=this.ec>0||this.easy;
  const tauRW=hasEC?this.ps.reduce((a,p)=>a+(p.def.torque||0),0)*1000:0;const tauG=this.engines().reduce((a,p)=>a+(thr>0?p.def.thrust*1000*thr*Math.sin(p.def.gimbal||0):0),0)*Math.max(.5,mp.com-mp.y0);
  const alpha=clamp((tauRW+tauG)/mp.I,0,3.2)*easyK;this.alpha=alpha;
  let cmd=[0,0,0];const man=[inp.pitch||0,inp.roll||0,inp.yaw||0];
  let dir=inp.dir||null;
  if(this.landed){this.w=[0,0,0];}
  else{
   if(dir&&hasEC){const n=this.nose,ax=cross(n,dir),sn=len(ax),ang=Math.atan2(sn,dot(n,dir));const axU=sn>1e-9?mul(ax,1/sn):[0,0,0];
    const wmag=Math.min(Math.sqrt(2*Math.max(alpha,.05)*.55*ang),1.1);const wdesW=mul(axU,wmag);const wdes=qrot(qconj(this.q4),wdesW);
    const k=1/Math.max(.05,alpha*.22);cmd=[clamp((wdes[0]-this.w[0])*k,-1,1),clamp((0-this.w[1])*k,-1,1),clamp((wdes[2]-this.w[2])*k,-1,1)];}
   else if(this.sas!=='off'&&hasEC){const k=1/Math.max(.05,alpha*.25);cmd=this.w.map(x=>clamp(-x*k,-1,1));}
   for(let i=0;i<3;i++)if(man[i])cmd[i]=man[i];
   const aw=[cmd[0]*alpha,cmd[1]*alpha*2.5,cmd[2]*alpha];
   // aerodynamic torque: stable stacks weathervane toward the airflow, unstable ones flip
   const vs=len(this.v);this.q=.5*rho*vs*vs;this.aoa=0;
   if(this.q>1&&vs>1){const vh=mul(this.v,1/vs),n=this.nose;const ax=cross(n,vh);this.aoa=Math.atan2(len(ax),dot(n,vh));
    let margin=mp.com-mp.cop;if(this.easy)margin=Math.max(margin,.6);if(this.chute&&this.chuteOpen>.3)margin=-3;// chute pulls the top up (nose against the flow)
    const ka=this.q*mp.Slat*margin*.35/mp.I;const tb=qrot(qconj(this.q4),mul(ax,ka));for(let i=0;i<3;i++)aw[i]+=clamp(tb[i],-6,6);
    const damp=Math.min(4,this.q*mp.Slat*.6/mp.I);for(let i=0;i<3;i++)aw[i]-=this.w[i]*damp;}
   for(let i=0;i<3;i++)this.w[i]+=aw[i]*dt;
   if(!hasEC&&!thr)for(let i=0;i<3;i++)this.w[i]*=1-.02*dt;
   const wq=[this.w[0],this.w[1],this.w[2],0];const dq=qmul(this.q4,wq);this.q4=qnorm(this.q4.map((x,i)=>x+.5*dq[i]*dt));
   // EC usage
   if(!this.easy){this.ec-=((this.sas!=='off'||dir?.06:0)+(Math.abs(cmd[0])+Math.abs(cmd[1])+Math.abs(cmd[2]))*.15*(tauRW>0?1:0))*dt;}
  }
  if(this.hasSolar()&&this.solarOpen&&this.inSun())this.ec+=this.ps.reduce((a,p)=>a+(p.def.solar||0),0)*dt;this.ec=clamp(this.ec,0,this.ecMax);
  // ---- parachute ----
  if(this.chute&&!this.chuteTorn){if(rho>0){const lim=this.easy?1e9:28000;if(this.q>lim&&this.chuteOpen<.99){this.chuteTorn=true;this.chute=0;this.chuteOpen=0;this.ev('torn');}else this.chuteOpen=Math.min(1,this.chuteOpen+dt*(this.q>8000?.25:.5));}}
  // ---- translation (RK4; thrust direction and mass frozen over the step) ----
  const nose=this.nose,m=mp.m,mu=B.mu,dmax=mp.dmax,area=Math.PI*dmax*dmax/4,cdBase=mp.cd*(this.easy?.6:1),chA=this.chute&&!this.chuteTorn?1000*this.chuteOpen**2*(this.ps.filter(p=>p.def.chute).length):0;
  const s2a=Math.sin(this.aoa)**2,back=(1-Math.cos(this.aoa))/2,cdEff=cdBase+(1.25*(this.easy?.8:1)-cdBase)*back;
  const acc=(r,v)=>{const rr=len(r);let a=mul(r,-mu/(rr*rr*rr));if(F)a=madd(a,nose,F/m);
   if(B.atm){const h=rr-B.R,rh=P.density(B,h);if(rh>0){const vs=len(v);const cdA=cdEff*area*(1+2*s2a)+chA;a=madd(a,v,-.5*rh*vs*cdA/m);}}return a;};
  if(this.landed){
   const wdir=dot(nose,up);const aUp=F/m*wdir-mu/(rn*rn);
   if(F>0&&aUp>0){this.landed=false;this.landedOn=null;this.splashed=false;this.ev('liftoff');}
   else{this.v=[0,0,0];this.burn(mdot,dt);this.stats.flightT+=dt;return;}}
  const r0=this.r,v0=this.v;
  const k1v=acc(r0,v0),k1r=v0;
  const k2r=madd(v0,k1v,dt/2),k2v=acc(madd(r0,k1r,dt/2),k2r);
  const k3r=madd(v0,k2v,dt/2),k3v=acc(madd(r0,k2r,dt/2),k3r);
  const k4r=madd(v0,k3v,dt),k4v=acc(madd(r0,k3r,dt),k4r);
  this.r=add(r0,mul(add(add(k1r,mul(k2r,2)),add(mul(k3r,2),k4r)),dt/6));
  this.v=add(v0,mul(add(add(k1v,mul(k2v,2)),add(mul(k3v,2),k4v)),dt/6));
  if(F){this.dvAcc=madd(this.dvAcc,nose,F/m*dt);this.dvUsed+=F/m*dt;}
  const ng=len(sub(acc(this.r,this.v),mul(this.r,-mu/len(this.r)**3)));this.gload=ng/P.G0;
  this.burn(mdot,dt);
  // heating ∝ √ρ·v³ (Sutton–Graves)
  const vs=len(this.v);this.heat=clamp(Math.sqrt(rho)*vs*vs*vs/3.2e8,0,1.5);this.mach=vs/340;
  rn=len(this.r);alt=rn-B.R;up=mul(this.r,1/rn);
  const st=this.stats;st.maxAlt=Math.max(st.maxAlt,this.body==='verda'?alt:st.maxAlt);st.maxQ=Math.max(st.maxQ,this.q);st.maxG=Math.max(st.maxG,this.gload);st.maxV=Math.max(st.maxV,vs);st.flightT+=dt;
  // ---- ground contact ----
  const mp2=this.props(),tilt=dot(this.nose,up);const clear=alt-mp2.foot*Math.max(.25,tilt);
  if(clear<=0){const vi=len(this.v);const bottom=this.ps[this.ps.length-1];
   let tol=(this.legs&&this.hasLegs())?8:(bottom?.def.crash??(bottom?.def.chute?10:6));if(this.easy)tol*=1.7;
   if(tilt<.5&&!(this.legs&&this.hasLegs()))tol*=.9;
   if(vi>tol){this.destroyed={why:vi>60?'LITHOBRAKING':'HARD LANDING',v:vi,tol};this.ev('crash',{v:vi});return;}
   this.landed=true;this.landedOn=this.body;this.v=[0,0,0];this.w=[0,0,0];this.r=mul(up,B.R+mp2.foot*Math.max(.25,tilt)+.01);
   this.splashed=this.body==='verda'&&P.continent(up)<0;this.touch={v:vi,tilt:Math.acos(clamp(tilt,-1,1))};
   if(this.body==='lune'){st.landedLune=true;if(vi<=tol&&this.touch.tilt<.6)st.landedLuneOk=true;}
   this.ev('touch',{v:vi,splash:this.splashed});}
  this.soi(t+dt);}
 burn(mdot,dt){if(!mdot)return;const seg=this.bottomSeg().filter(p=>p.fuel>0);const tot=seg.reduce((a,p)=>a+p.fuel,0);if(tot<=0)return;
  const use=Math.min(tot,mdot*dt);for(const p of seg)p.fuel=Math.max(0,p.fuel-use*p.fuel/tot);if(use>=tot-1e-9)this.ev('flameout');}
 // patched conics: switch reference body at the sphere-of-influence boundary
 soi(t){if(this.body==='verda'){const L=P.luneState(t),d=sub(this.r,L.r);if(len(d)<LUNE.soi){this.body='lune';this.r=d;this.v=sub(this.v,L.v);this.stats.enteredLune=true;this.ev('soi',{to:'lune'});return true;}}
  else{if(len(this.r)>LUNE.soi){const L=P.luneState(t);this.body='verda';this.r=add(this.r,L.r);this.v=add(this.v,L.v);this.ev('soi',{to:'verda'});return true;}}return false;}
 // altitude below which on-rails warp is not allowed
 warpFloor(){return this.body==='verda'?VERDA.atm:8000;}
 // on-rails propagation for time warp; returns false if it had to stop (too low)
 rails(dt,t,dirFn){let left=dt,tt=t;
  while(left>1e-9){const B=this.B,rn=len(this.r),vs=len(this.v),alt=rn-B.R;
   if(alt<this.warpFloor())return{ok:false,t:tt};
   const el=P.elements(this.r,this.v,B.mu);let h=Math.min(left,Math.max(.5,.04*LUNE.soi/Math.max(vs,1)));
   if(el.rp<B.R+this.warpFloor()){h=Math.min(h,Math.max(.2,(alt-this.warpFloor())/Math.max(1,-el.vr*1.5+vs*.05)));}
   const s=P.kepler(this.r,this.v,h,B.mu);this.r=s.r;this.v=s.v;left-=h;tt+=h;this.stats.flightT+=h;
   if(this.soi(tt)){}
   if(dirFn){const d=dirFn();if(d)this.q4=qLook(d,this.right);}this.w=[0,0,0];
   if(this.landed)return{ok:false,t:tt};}
  return{ok:true,t:tt};}
}

// dropped stages: simple ballistic objects that tumble, burn up or crash
export class Debris{constructor(d,t){Object.assign(this,{body:d.body,r:d.r,v:d.v,q4:d.q,parts:d.parts,age:0,w:[(Math.random()-.5)*.5,(Math.random()-.5)*.2,(Math.random()-.5)*.5],dead:false,yDrop:d.yDrop,com:d.com});
  const sep=qrot(this.q4,[0,-1,0]);this.v=madd(this.v,sep,2.5);}
 step(dt,t){const B=BODY[this.body];const rr=len(this.r);let a=mul(this.r,-B.mu/rr**3);const h=rr-B.R;const rho=P.density(B,h);
  if(rho>0){const vs=len(this.v);a=madd(a,this.v,-.5*rho*vs*1.1*1.2/Math.max(300,this.parts.reduce((s,p)=>s+p.def.mass*1000+p.fuel,0)));}
  this.v=madd(this.v,a,dt);this.r=madd(this.r,this.v,dt);this.age+=dt;
  const dq=qmul(this.q4,[this.w[0],this.w[1],this.w[2],0]);this.q4=qnorm(this.q4.map((x,i)=>x+.5*dq[i]*dt));
  if(h<0){this.dead='crash';}}}
