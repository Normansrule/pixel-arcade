// ORBIT LAB — AUTOPILOT COACH. Flies (and explains) gravity turns, circularisation, Hohmann transfers, rendezvous,
// lunar transfer/capture, suicide-burn landings and the trip home. Pure JS: drives a Flight (flight.js).
import * as P from './physics.js';
const {add,sub,mul,dot,cross,len,norm,clamp,angleBetween,VERDA,LUNE}=P;
export const WARPS=[1,2,4,10,50,100,500,1000,5000];
export const warpFor=rem=>{let w=1;for(const k of WARPS)if(rem/k>=2.2)w=k;return w;};
const km=x=>(x/1000).toFixed(1)+' km',ms=x=>Math.round(x)+' m/s',deg=x=>(x*180/Math.PI).toFixed(0)+'°';
const slerpDir=(a,b,k)=>norm(add(mul(a,1-k),mul(b,k)));
// time until radius rr is crossed on the way down (inf if never)
export function timeToRadius(el,rr){if(el.rp>rr||el.r<rr)return Infinity;const nuX=-Math.acos(clamp((el.p/rr-1)/(el.e||1e-9),-1,1));
 let d=P.timeFromPe(nuX,el.e,el.a,el.mu)-P.timeFromPe(el.nu,el.e,el.a,el.mu);if(el.e<1)d=((d%el.T)+el.T)%el.T;return d<0?Infinity:d;}

export const PLANS={
 ascent:['ascent'],orbit:['ascent'],hohmann:['ascent','raise','node','circap','node'],
 rendezvous:['ascent','window','node','match'],flyby:['ascent','moonplan','node','warpsoi'],
 land:['ascent','moonplan','node','warpsoi','capture','node','landlune'],
 home:['ascent','moonplan','node','warpsoi','capture','node','landlune','liftlune','returnplan','node','warpsoi','landhome'],
 landhome:['landhome'],node:['node'],
};

export class Coach{
 constructor(plan,opt={}){this.plan=(PLANS[plan]||plan).slice();this.p=null;this.title='';this.text='';this.done=false;this.opt=opt;this.lastStage=-9;this.fail=null;}
 say(title,text){this.title=title;this.text=text;}
 update(F){const out={throttle:0,dir:null};
  if(this.done)return out;
  if(!this.p){const name=this.plan.shift();if(!name){this.done=true;this.say('COACH','Programme complete — you have control.');return out;}this.p={name,phase:'start',t0:F.t,s:{}};}
  const fn=PROG[this.p.name];const o=fn?fn(F,this.p,this,out):{done:true};
  if(o&&o.done){this.p=null;}
  const vv=F.ves;if(vv.hasSolar()&&!vv.solarOpen&&vv.alt>(vv.B.atm||0)+1000)out.solar=true;
  // keep staging while burning
  const v=F.ves;if((out.throttle>0||this.p?.name==='ascent')&&v.ignited&&v.segs().length>1&&(v.segFuel()<=0||!v.engines().length)&&F.t-this.lastStage>.8&&!this.noStage){out.stage=true;this.lastStage=F.t;}
  return out;}
}
const PROG={
 // ---------- 1. gravity turn to a target apoapsis, then circularise ----------
 ascent(F,p,C,out){const v=F.ves,B=v.B,rr=len(v.r),up=norm(v.r),alt=rr-B.R,el=v.orbit(),vs=len(v.v),mu=B.mu;
  const atm=!!B.atm,tgt=p.arg??(atm?80000:18000);const east=norm(cross([0,1,0],up));const mp=v.props(),m=mp.m,g=mu/rr/rr;
  const T=v.thrustInfo(P.pressureRatio(B,alt));const twr=T.F/(m*g);out.dir=up;
  if(p.phase==='start'){if(!v.ignited)out.stage=true;p.phase='climb';C.lastStage=F.t;}
  if(p.phase==='climb'){out.throttle=1;out.dir=up;
   C.say('PHASE 1 · VERTICAL CLIMB',`Full throttle, straight up. TWR = F/(m·g) = ${(T.F/1000).toFixed(0)} kN / (${(m/1000).toFixed(2)} t × ${g.toFixed(2)}) = <b>${twr.toFixed(2)}</b>, so net acceleration a = (TWR − 1)·g = ${((twr-1)*g).toFixed(1)} m/s². We punch through the thickest air before tipping over.`);
   if(alt>(atm?300:500)||vs>(atm?50:35))p.phase='turn';}
  if(p.phase==='turn'){const tEnd=atm?45000:9000;const k=clamp((alt-(atm?300:400))/tEnd,0,1);const pitch=Math.max(atm?8:3,Math.pow(k,atm?.5:.38)*(atm?86:89))*Math.PI/180;
   let d=add(mul(up,Math.cos(pitch)),mul(east,Math.sin(pitch)));
   if(v.q>6000&&vs>40){const vh=norm(v.v);const mx=v.q>15000?.06:.12;const a=angleBetween(vh,d);if(a>mx)d=slerpDir(vh,d,mx/a);}
   out.dir=d;out.throttle=atm&&alt<22000&&twr>2.0?2.0/twr:1;
   C.say('PHASE 2 · GRAVITY TURN',`Pitch from vertical θ = 90°·√(h/${tEnd/1000} km) = <b>${deg(pitch)}</b>. Gravity bends the path sideways for free; we keep the nose within a few degrees of prograde so drag (½ρv²·C<sub>d</sub>A, now q = ${(v.q/1000).toFixed(1)} kPa) can't flip us. Ap = ${km(el.ra-B.R)} → target ${km(tgt)}.`);
   if(el.ra-B.R>=tgt){p.phase='coast';}}
  if(p.phase==='coast'){out.throttle=0;out.dir=norm(v.v);
   if(atm&&alt<B.atm&&el.ra-B.R<tgt-500){out.throttle=.3;}
   const vap=P.visViva(mu,el.ra,el.a),vc=P.vCirc(mu,el.ra),dv=vc-vap;const TV=v.thrustInfo(0);const bt=TV.F>0?P.burnTimeForDv(dv,m,TV.isp,TV.F):0;p.s.bt=bt;
   C.say('PHASE 3 · COAST TO APOAPSIS',`Engines off. At Ap the vis-viva equation gives v = √(μ(2/r − 1/a)) = <b>${ms(vap)}</b>, but a circle needs v<sub>c</sub> = √(μ/r) = <b>${ms(vc)}</b>. Circularisation Δv = ${ms(dv)}; burn time ≈ ${bt.toFixed(0)} s, so we light up ${(bt/2).toFixed(0)} s before Ap. T−Ap ${el.toAp.toFixed(0)} s.`);
   const ready=!atm||alt>B.atm-1500;if(ready&&el.toAp<bt/2+1.5&&el.toAp<el.T/2)p.phase='circ';
   else if(!atm||alt>B.atm+200)out.warp=warpFor(el.toAp-bt/2-12);}
  if(p.phase==='circ'){const vr=dot(v.v,up),hv=sub(v.v,mul(up,vr)),hz=norm(hv);const d=norm(add(hz,mul(up,clamp(-vr/120,-.35,.6))));out.dir=d;
   const vc=P.vCirc(mu,rr),need=vc-len(hv);const TV=v.thrustInfo(0);const aM=TV.F/m||1;out.throttle=angleBetween(v.nose,d)<.12?clamp(need/(aM*1.2),.04,1):0;
   C.say('PHASE 4 · CIRCULARISE',`Burning horizontally. Need v<sub>c</sub> = √(μ/r) = ${ms(vc)}, have ${ms(len(hv))} → ${ms(need)} to go. Periapsis rising: Pe = <b>${km(el.rp-B.R)}</b>.`);
   const floor=atm?B.atm+2500:4000;if(el.rp-B.R>=Math.min(tgt*.92,el.ra-B.R-1500)&&el.rp-B.R>floor||need<1){out.throttle=0;C.say('ORBIT!',`Pe ${km(el.rp-B.R)} · Ap ${km(el.ra-B.R)}. Period T = 2π√(a³/μ) = ${(el.T/60).toFixed(1)} min. We are falling around ${B.name} forever.`);return{done:true};}}
  return null;},
 // ---------- execute the current maneuver node ----------
 node(F,p,C,out){const v=F.ves,n=F.node;if(!n){out.throttle=0;return{done:true};}
  const m=v.props().m;const pr=P.pressureRatio(v.B,v.alt);let T=v.thrustInfo(pr);
  if(!T.live&&v.segs().length>1&&v.ignited){out.stage=true;}
  if(!v.ignited){out.stage=true;}
  if(p.phase==='start'){p.phase='align';p.s.dvW=n.dvW.slice();}
  const dvW=p.s.dvW,dvm=len(dvW);
  if(p.phase==='align'){out.dir=norm(dvW);out.throttle=0;const bt=T.F>0?P.burnTimeForDv(dvm,m,T.isp,T.F):0;const tr=n.t-bt/2-F.t;const al=angleBetween(v.nose,out.dir);
   C.say('MANEUVER NODE',`Δv = ${ms(dvm)}. Burn time t = (m₀·I<sub>sp</sub>·g₀/F)(1 − e<sup>−Δv/(I<sub>sp</sub>g₀)</sup>) = <b>${bt.toFixed(1)} s</b>, so ignition is ${(bt/2).toFixed(1)} s before the node — half the burn on each side. Ignition in ${Math.max(0,tr).toFixed(0)} s.`);
   if(tr>30&&al<.08)out.warp=warpFor(tr-20);
   if(tr<=0&&al<.06){p.phase='burn';p.s.acc0=v.dvAcc.slice();}}
  if(p.phase==='burn'){const done=sub(v.dvAcc,p.s.acc0),rem=sub(dvW,done),rm=len(rem);out.dir=rm>2?norm(rem):norm(dvW);const aM=T.F/m||1;
   out.throttle=angleBetween(v.nose,out.dir)<.17?clamp(rm/(aM*1.4),.02,1):0;
   C.say('BURNING',`Remaining Δv <b>${ms(rm)}</b>. Every second the engine adds a = F/m = ${(aM).toFixed(1)} m/s² — and the ship gets lighter, so acceleration climbs.`);
   if(dot(rem,dvW)<=0||rm<.3){out.throttle=0;F.node=null;return{done:true};}}
  return null;},
 // ---------- raise orbit: Hohmann first burn ----------
 raise(F,p,C,out){const v=F.ves,el=v.orbit(),mu=VERDA.mu,r2=VERDA.R+(F.o.targetAlt||250000);
  const tn=el.e<.01?F.t+60:F.t+el.toPe;const s=P.kepler(v.r,v.v,tn-F.t,mu);const r1=len(s.r);const vNeed=P.visViva(mu,r1,(r1+r2)/2),vNow=P.visViva(mu,r1,el.a);
  F.setNode({t:tn,pro:vNeed-vNow,nrm:0,rad:0});const H=P.hohmann(mu,r1,r2);
  C.say('HOHMANN TRANSFER',`r₁ = ${km(r1)}, r₂ = ${km(r2)}. Δv₁ = √(μ/r₁)(√(2r₂/(r₁+r₂)) − 1) = <b>${ms(H.dv1)}</b> at periapsis; then Δv₂ = √(μ/r₂)(1 − √(2r₁/(r₁+r₂))) = <b>${ms(H.dv2)}</b> at apoapsis. Transfer time π√(a³/μ) = ${(H.t/60).toFixed(1)} min.`);return{done:true};},
 circap(F,p,C,out){const v=F.ves,el=v.orbit(),mu=v.B.mu;const tn=F.t+el.toAp;const dv=P.vCirc(mu,el.ra)-P.visViva(mu,el.ra,el.a);F.setNode({t:tn,pro:dv,nrm:0,rad:0});
  C.say('CIRCULARISE AT AP',`At apoapsis r = ${km(el.ra)} from the centre: Δv = √(μ/r) − v<sub>ap</sub> = <b>${ms(dv)}</b>.`);return{done:true};},
 // ---------- rendezvous ----------
 window(F,p,C,out){const v=F.ves,el=v.orbit(),mu=VERDA.mu,r1=el.a,r2=P.STATION.r;const H=P.hohmann(mu,r1,r2);
  const tn=Math.max(F.t+60,P.phaseWindow({r:v.r,v:v.v},F.t,r2,t=>P.STATION.theta0+P.STATION.n*t,H.phase));
  const nd=P.optimizeNode({body:'verda',r:v.r,v:v.v},F.t,(segs,ns)=>P.closestApproach(ns.r,ns.v,ns.t,H.t*1.4,P.stationState).d,{tMin:Math.max(F.t+40,tn-el.T*.08),span:el.T*.16,dvMin:H.dv1*.7,dvMax:H.dv1*1.3,nt:14,nd:11});
  F.setNode(nd);
  C.say('PHASING',`The station must lead us by φ = π − n₂·t<sub>transfer</sub> = <b>${deg(H.phase)}</b> when we burn, so we both arrive at the same point together (n₂ = √(μ/r₂³) is its angular speed). Node in ${((nd.t-F.t)/60).toFixed(1)} min, Δv₁ = ${ms(nd.pro)}; predicted miss ${km(nd.cost)}.`);return{done:true};},
 match(F,p,C,out){const v=F.ves;if(v.body!=='verda')return{done:true};const S=P.stationState(F.t);const rel=sub(v.r,S.r),vrel=sub(v.v,S.v),d=len(rel),vr=len(vrel);
  const m=v.props().m,T=v.thrustInfo(0),aM=T.F/m||1;
  if(p.phase==='start'||p.phase==='coast'){p.phase='coast';if(!p.s.ca||F.real-p.s.caAt>1){p.s.ca=P.closestApproach(v.r,v.v,F.t,Math.min(v.orbit().T||3000,6000),P.stationState);p.s.caAt=F.real;}
   const ca=p.s.ca,bt=vr/aM;out.dir=norm(mul(vrel,-1));const tr=ca.t-F.t-bt/2;if(tr>25&&d>3000)out.warp=warpFor(tr-15);
   C.say('COAST TO CLOSEST APPROACH',`Closest approach <b>${km(ca.d)}</b> in ${(ca.t-F.t).toFixed(0)} s. There we cancel the relative velocity (now ${vr.toFixed(0)} m/s): burn time ≈ v/a = ${bt.toFixed(0)} s.`);
   if(tr<=0||d<1500)p.phase='near';return null;}
  const sp=clamp((d-70)/50,0,18);const des=mul(norm(rel),-sp);const err=sub(des,vrel),em=len(err);
  if(em>.4){out.dir=norm(err);out.throttle=angleBetween(v.nose,out.dir)<.12?clamp(em/(aM*2),.02,1):0;}else{out.dir=mul(norm(rel),-1);out.throttle=0;}
  C.say('MATCH VELOCITY',`Distance <b>${d.toFixed(0)} m</b>, relative speed <b>${vr.toFixed(1)} m/s</b>. We aim for v<sub>rel</sub> ≈ d/50 toward the target: fast when far, gentle when close — stopping distance d = v²/(2a) must stay short.`);
  if(d<150&&vr<1){out.throttle=0;return{done:true};}return null;},
 // ---------- lune transfer ----------
 moonplan(F,p,C,out){const v=F.ves,el=v.orbit(),mu=VERDA.mu;const H=P.hohmann(mu,el.a,LUNE.a);
  const t0=P.phaseWindow({r:v.r,v:v.v},F.t,LUNE.a,t=>LUNE.theta0+LUNE.n*t,H.phase);const tg=Math.max(F.t+60,t0);
  const want=LUNE.R+(F.o.lunePe||30000);
  const nd=P.optimizeNode({body:'verda',r:v.r,v:v.v},F.t,(segs)=>{const s=segs[0];if(s.end==='enc'&&segs[1]){const rp=segs[1].el.rp;return Math.abs(rp-want)/1000+(rp<LUNE.R+5000?200:0);}return 1000+(s.closest?.d||1e7)/1e4;},
   {tMin:Math.max(F.t+40,tg-el.T*.12),span:el.T*.24,dvMin:H.dv1-60,dvMax:H.dv1+60,nt:18,nd:13});
  F.setNode(nd);
  C.say('TRANSFER TO LUNE',`Hohmann to r₂ = ${km(LUNE.a)}: Δv₁ ≈ ${ms(H.dv1)}, flight time π√(a³/μ) = ${(H.t/3600).toFixed(1)} h. LUNE moves ${deg(LUNE.n*H.t)} meanwhile, so we leave when it leads by φ = π − n·t = <b>${deg(P.wrap(H.phase))}</b>. Fine-tuned node: ${ms(nd.pro)} prograde.`);return{done:true};},
 warpsoi(F,p,C,out){const v=F.ves;if(!p.s.b0)p.s.b0=v.body;if(v.body!==p.s.b0){out.warp=1;return{done:true};}
  const s=F.pred&&F.pred[0];if(s&&s.tEnd&&(s.end==='enc'||s.end==='exit')){out.warp=warpFor(s.tEnd-F.t);}else out.warp=warpFor(600);
  out.dir=norm(v.v);C.say(v.body==='verda'?'COAST TO LUNE':'LEAVING LUNE',`Sphere of influence r<sub>SOI</sub> = a(m/M)<sup>2/5</sup> = <b>${km(LUNE.soi)}</b>. Inside it we treat LUNE as the only gravity source — "patched conics".`);return null;},
 capture(F,p,C,out){const v=F.ves;if(v.body!=='lune')return{done:true};const el=v.orbit();const mu=LUNE.mu;const tn=F.t+(el.e<1?el.toPe:Math.max(5,el.toPe));
  const vp=P.visViva(mu,el.rp,el.a),vc=P.vCirc(mu,el.rp);F.setNode({t:tn,pro:vc-vp,nrm:0,rad:0});
  C.say('LUNAR CAPTURE',`At periapsis we're doing ${ms(vp)}; a circular orbit needs √(μ/r) = ${ms(vc)}. Retro burn Δv = <b>${ms(vp-vc)}</b>.`);return{done:true};},
 // ---------- suicide-burn landing (any airless body) ----------
 landlune(F,p,C,out){const v=F.ves;if(v.landed){out.throttle=0;C.say('TOUCHDOWN',`Landed at ${v.touch?v.touch.v.toFixed(1):'0'} m/s.`);return{done:true};}
  const B=v.B,rr=len(v.r),up=norm(v.r),alt=rr-B.R,mp=v.props(),m=mp.m,g=B.mu/rr/rr;let T=v.thrustInfo(0);
  if(p.phase==='start'){const el0=v.orbit();if(el0.e<1&&el0.rp>B.R+4000&&!F.o.anyLight){const fwd=norm(P.kepler(v.r,v.v,el0.T*.04,B.mu).r);const lit=dot(fwd,P.SUN);
    if(lit<.6){out.dir=norm(mul(v.v,-1));out.warp=warpFor(el0.T*.08);C.say('WAITING FOR DAYLIGHT',`Coasting until the landing zone below is sunlit (sun elevation there: ${deg(Math.asin(clamp(lit,-1,1)))}). Orbital period T = 2π√(a³/μ) = ${(el0.T/60).toFixed(0)} min.`);return null;}}p.phase='go';}
  if(!T.live&&v.segs().length>1){out.stage=true;}
  if(alt<3000&&v.hasLegs()&&!v.legs)out.legs=true;
  const aM=T.F/m||.01,vz=dot(v.v,up),vh=sub(v.v,mul(up,vz));const hc=alt-mp.foot;
  const ds=v.dvStages(0),need=len(v.v)+Math.sqrt(2*g*Math.max(0,hc));let aP=aM;if(ds.length>1&&ds[0].dv<need*1.25&&ds[1].F>0)aP=Math.min(aM,ds[1].F/ds[1].m0);const aBrake=clamp(.55*aP-g,.2,5);const vzDes=-Math.sqrt(2*aBrake*Math.max(0,hc-12))-1.5;
  const vhm=len(vh);if(vhm>8)p.s.hk=true;if(vhm<1.2)p.s.hk=false;
  let ac=add(mul(up,(vzDes-vz)*2.2+g),p.s.hk||(hc<400&&vhm>.5)?mul(vh,-1.2):[0,0,0]);const av=dot(ac,up);if(av<0)ac=sub(ac,mul(up,av));
  if(hc<250&&av>0){const hp=sub(ac,mul(up,av)),hl=len(hp),mx=av*Math.tan(hc<60?.1:.25);if(hl>mx)ac=add(mul(up,av),mul(hp,mx/hl));}
  const dStop=P.stopDistance(-vz,aM-g);
  if(len(ac)<g*.3){out.throttle=0;out.dir=len(v.v)>2?norm(mul(v.v,-1)):up;
   if(-vz>0&&alt>14000&&B.atm===0){const tt=(hc-dStop*1.6)/Math.max(10,-vz);if(tt>40)out.warp=Math.min(4,warpFor(tt));}}
  else{out.dir=norm(ac);out.throttle=angleBetween(v.nose,out.dir)<.25?clamp(len(ac)/aM,0,1):0;}
  if(hc<40)p.phase='final';
  C.say('SUICIDE BURN',`Speed ${ms(len(v.v))}, altitude ${(hc).toFixed(0)} m. Braking accel a = F/m − g = ${(aM-g).toFixed(1)} m/s² → stopping distance d = v²/(2a) = <b>${dStop.toFixed(0)} m</b>. Burn starts when height ≈ d (we keep a 30% margin).`);
  return null;},
 liftlune(F,p,C,out){if(p.phase==='start'){p.arg=18000;}return PROG.ascent(F,p,C,out);},
 returnplan(F,p,C,out){const v=F.ves;if(v.body!=='lune')return{done:true};const el=v.orbit();const want=VERDA.R+(F.o.homePe||32000);
  const nd=P.optimizeNode({body:'lune',r:v.r,v:v.v},F.t,(segs)=>{const s=segs[0];if(s.end==='exit'&&segs[1]){return Math.abs(segs[1].el.rp-want)/1000+(segs[1].end==='enc'?400:0);}return 5000-(s.el.ra||0)/1000;},
   {tMin:F.t+30,span:el.T,dvMin:120,dvMax:650,nt:36,nd:24});F.setNode(nd);
  C.say('RETURN WINDOW',`Escape LUNE moving <i>against</i> its orbit: we leave with velocity v<sub>LUNE</sub> − v<sub>∞</sub> relative to VERDA, so the new orbit's periapsis dips into the atmosphere (target ${km(want-VERDA.R)}). Δv = ${ms(nd.pro)}.`);return{done:true};},
 landhome(F,p,C,out){const v=F.ves;if(v.landed){out.throttle=0;C.say(v.splashed?'SPLASHDOWN':'TOUCHDOWN',`Home safe at ${v.touch?v.touch.v.toFixed(1):0} m/s. Terminal velocity under canopy v<sub>t</sub> = √(2mg/(ρC<sub>d</sub>A)).`);return{done:true};}
  if(v.body!=='verda'){out.warp=warpFor(600);return null;}
  const el=v.orbit(),B=VERDA,alt=v.alt,vs=len(v.v);out.dir=vs>1?norm(mul(v.v,-1)):norm(v.r);
  if(p.phase==='start'){p.phase=el.rp-B.R>45000?'deorbit':'coast';}
  if(p.phase==='deorbit'){const T=v.thrustInfo(0);if(!T.live&&v.segs().length>1)out.stage=true;out.throttle=angleBetween(v.nose,out.dir)<.1?1:0;
   C.say('DEORBIT',`Retro burn lowers the far side of the orbit: Pe = ${km(el.rp-B.R)} → target 30 km, deep enough for drag to catch us.`);
   if(el.rp-B.R<30000||(!T.live&&v.segs().length<=1)){out.throttle=0;p.phase='coast';}return null;}
  if(p.phase==='coast'){const tt=timeToRadius(el,B.R+B.atm);if(alt>B.atm+500&&isFinite(tt))out.warp=warpFor(tt-20);
   if(alt<B.atm+30000&&v.segs().length>1&&F.t-C.lastStage>1){out.stage=true;C.lastStage=F.t;}
   if(alt<6000&&v.hasLegs()&&!v.legs)out.legs=true;
   if(alt>B.atm&&alt<B.atm+60000&&v.segs().length<=1&&v.thrustInfo(0).live&&angleBetween(v.nose,out.dir)<.1){out.throttle=1;C.say('BRAKING BURN',`Spending leftover fuel retrograde before entry — every m/s we cancel now is heat (∝ v³) we don't have to shed.`);return null;}
   C.say('REENTRY',`Heat shield first. Heating grows like √ρ·v³ — at ${ms(vs)} that's ferocious. Drag F = ½ρv²C<sub>d</sub>A slows us; q = ${(v.q/1000).toFixed(1)} kPa.`);
   if(alt<B.atm){C.noStage=true;out.warp=v.chute&&v.chuteOpen>.9?10:alt<B.atm-15000&&vs<600?4:1;if((alt<14000&&v.q<18000||alt<2500)&&!v.chute)out.chute=true;if(v.chute){const tv=P.terminalVelocity(v.props().m,B.g,P.density(B,alt)||1e-6,1000);
    C.say('PARACHUTE',`Canopy open. Terminal velocity v<sub>t</sub> = √(2mg/(ρC<sub>d</sub>A)) = <b>${tv.toFixed(1)} m/s</b> at this altitude (ρ = ${P.density(B,alt).toFixed(3)} kg/m³).`);}}}
  return null;},
};
