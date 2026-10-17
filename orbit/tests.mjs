// ORBIT LAB — headless physics unit checks.  Run:  node orbit/tests.mjs   (add --quick to skip the long autopilot missions)
import * as P from './physics.js';
import {analyze,TEMPLATES,PARTS} from './parts.js';
import {Vessel} from './vessel.js';
import {Flight} from './flight.js';
const quick=process.argv.includes('--quick');let fails=0,n=0;
const ok=(name,cond,info='')=>{n++;if(!cond)fails++;console.log(`${cond?'PASS':'FAIL'}  ${name}${info?'  — '+info:''}`);};
const rel=(a,b)=>Math.abs(a-b)/Math.max(1e-12,Math.abs(b));
const {VERDA,LUNE}=P;

// 1. Kepler propagation conserves energy + angular momentum and closes after one period
{const r=[VERDA.R+80000,0,0],v=[0,30,-1600];const el=P.elements(r,v,VERDA.mu);const s=P.kepler(r,v,el.T,VERDA.mu);
 ok('kepler: returns to start after one period T = 2π√(a³/μ)',P.len(P.sub(s.r,r))<1e-3,`miss ${P.len(P.sub(s.r,r)).toExponential(2)} m`);
 const e2=P.elements(...Object.values(P.kepler(r,v,el.T*.37,VERDA.mu)),VERDA.mu);ok('kepler: specific energy conserved',rel(e2.eps,el.eps)<1e-9,`rel ${rel(e2.eps,el.eps).toExponential(2)}`);
 ok('kepler: angular momentum conserved',rel(e2.hn,el.hn)<1e-9);
 const h=[VERDA.R+80000,0,0],hv=[0,0,-3000];const he=P.elements(h,hv,VERDA.mu);const hs=P.kepler(h,hv,5000,VERDA.mu);ok('kepler: hyperbolic energy conserved',rel(P.elements(hs.r,hs.v,VERDA.mu).eps,he.eps)<1e-8);}
// 2. Vessel RK4 integrator: energy conservation over a full orbit (no thrust, vacuum)
{const V=new Vessel(['probe']);V.landed=false;const r0=VERDA.R+150000;V.r=[r0,0,0];V.v=[0,0,-P.vCirc(VERDA.mu,r0)*1.05];const E0=P.elements(V.r,V.v,VERDA.mu);
 let t=0;const dt=P.DT;const N=Math.ceil(E0.T/dt);for(let i=0;i<N;i++){V.step(dt,{throttle:0},t);t+=dt;}const E1=P.elements(V.r,V.v,VERDA.mu);
 ok('RK4 orbit: energy drift over one orbit < 1e-6',rel(E1.eps,E0.eps)<1e-6,`rel ${rel(E1.eps,E0.eps).toExponential(2)}`);
 ok('RK4 orbit: vis-viva v² = μ(2/r − 1/a) holds',rel(P.len(V.v),P.visViva(VERDA.mu,P.len(V.r),E1.a))<1e-6);
 ok('RK4 orbit: period matches 2π√(a³/μ)',P.len(P.sub(V.r,[r0,0,0]))<200,`closure ${P.len(P.sub(V.r,[r0,0,0])).toFixed(2)} m after ${N} steps`);}
// 3. Tsiolkovsky: VAB numbers match the formula, and a simulated burn delivers them
{const ids=['probe','tankS4','wren'];const a=analyze(ids,{vac:true});const m0=(.12+2.25+.5)*1000,mf=m0-2000;const dvF=345*P.G0*Math.log(m0/mf);
 ok('VAB Δv = Isp·g₀·ln(m₀/m_f)',rel(a.st[0].dv,dvF)<1e-9,`${a.st[0].dv.toFixed(2)} vs ${dvF.toFixed(2)} m/s`);
 ok('VAB burn time = m_p·Isp·g₀/F',rel(a.st[0].burn,2000*345*P.G0/60000)<1e-9,`${a.st[0].burn.toFixed(2)} s`);
 ok('VAB launch TWR = F/(m·g)',rel(analyze(['pod','tankS2','hawk']).st[0].twr,250e3*270/300/((.84+1.125+1.25)*1000*9.81))<1e-9);
 const V=new Vessel(ids);V.landed=false;V.ignited=true;const r0=VERDA.R+500000;V.r=[r0,0,0];V.v=[0,0,-P.vCirc(VERDA.mu,r0)];V.q4=P.qLook([0,0,-1],[1,0,0]);V.sas='off';
 let t=0;while(V.segFuel()>0&&t<2000){V.step(P.DT,{throttle:1},t);t+=P.DT;}
 ok('simulated burn: Σ(F/m)dt equals Tsiolkovsky Δv',rel(V.dvUsed,dvF)<2e-3,`${V.dvUsed.toFixed(1)} vs ${dvF.toFixed(1)} m/s, burn ${t.toFixed(1)} s`);
 ok('simulated burn time matches m_p·Isp·g₀/F',Math.abs(t-2000*345*P.G0/60000)<.1);}
// 4. Hohmann: analytic Δv equals vis-viva differences, and the autopilot spends that much
{const r1=VERDA.R+80000,r2=VERDA.R+250000,H=P.hohmann(VERDA.mu,r1,r2),at=(r1+r2)/2;
 ok('Hohmann Δv₁ = v_peri(transfer) − v_circ(r₁)',rel(H.dv1,P.visViva(VERDA.mu,r1,at)-P.vCirc(VERDA.mu,r1))<1e-12,`${H.dv1.toFixed(3)} m/s`);
 ok('Hohmann Δv₂ = v_circ(r₂) − v_apo(transfer)',rel(H.dv2,P.vCirc(VERDA.mu,r2)-P.visViva(VERDA.mu,r2,at))<1e-12,`${H.dv2.toFixed(3)} m/s`);
 ok('Hohmann transfer time = half the transfer period',rel(H.t,P.period(VERDA.mu,at)/2)<1e-12);
 const F=new Flight(TEMPLATES.orbiter.stack,{orbit:80000,targetAlt:250000});const d0=F.ves.dvUsed;F.startCoach(['raise','node','circap','node']);F.run(f=>!f.coach,400);
 const e=F.ves.orbit(),used=F.ves.dvUsed-d0;ok('autopilot Hohmann: circular 250 km orbit reached',Math.abs(e.ra-r2)<4000&&Math.abs(e.rp-r2)<4000,`Ap ${((e.ra-VERDA.R)/1e3).toFixed(1)} Pe ${((e.rp-VERDA.R)/1e3).toFixed(1)} km`);
 ok('autopilot Hohmann: Δv spent ≈ Δv₁ + Δv₂ (±3%)',rel(used,H.total)<.03,`${used.toFixed(1)} vs ${H.total.toFixed(1)} m/s`);}
// 5. Sphere of influence, phase angle, suicide burn, terminal velocity formulas
ok('SOI = a(m/M)^(2/5)',rel(LUNE.soi,LUNE.a*(LUNE.mu/VERDA.mu)**.4)<1e-12,`${(LUNE.soi/1e3).toFixed(1)} km`);
{const F=new Flight(['probe'],{});const v=F.ves;v.landed=false;const r=P.lunePos(0);const L=P.luneState(0);v.r=P.add(r,[LUNE.soi*1.02,0,0]);v.v=L.v.slice();F.t=0;let t=0;for(let i=0;i<200;i++){v.step(P.DT,{throttle:0},t);t+=P.DT;}
 v.r=P.add(P.lunePos(t),[LUNE.soi*.99,0,0]);v.soi(t);ok('patched conics: frame switches to LUNE inside its SOI',v.body==='lune');}
ok('stopping distance d = v²/(2a)',P.stopDistance(200,5)===4000);
ok('terminal velocity formula',rel(P.terminalVelocity(1000,9.81,1.1,1000),Math.sqrt(2*1000*9.81/(1.1*1000)))<1e-12);
// 6. A parachute capsule falls at the predicted terminal velocity near sea level
{const V=new Vessel(['chute','pod']);V.landed=false;V.r=[VERDA.R+3000,0,0];V.v=[-60,0,0];V.q4=P.qLook([1,0,0],[0,0,-1]);V.deployChute();let t=0;let vt=0;
 while(!V.landed&&!V.destroyed&&t<900){V.step(P.DT,{throttle:0},t);t+=P.DT;if(V.alt<600&&!vt)vt=P.len(V.v);}
 const vtF=P.terminalVelocity(V.props().m,VERDA.g,P.density(VERDA,600),1000);ok('parachute descent ≈ v_t = √(2mg/(ρC_dA))',rel(vt,vtF)<.08,`${vt.toFixed(2)} vs ${vtF.toFixed(2)} m/s`);ok('parachute landing is survivable',V.landed&&!V.destroyed);}
// 7. Autopilot missions (the coach flies the career)
const fly=(plan,stack,o,lim)=>{const F=new Flight(stack,o);F.startCoach(plan);const okk=F.run(f=>!f.coach,lim);return F;};
{const F=fly('orbit',TEMPLATES.orbiter.stack,{},900);const e=F.ves.orbit();ok('coach ascent: stable orbit (Pe > 70 km)',e.rp-VERDA.R>70000&&!F.ves.destroyed,`Ap ${((e.ra-VERDA.R)/1e3).toFixed(1)} Pe ${((e.rp-VERDA.R)/1e3).toFixed(1)} km, Δv used ${F.ves.dvUsed.toFixed(0)} m/s`);}
{const F=fly(['window','node','match'],TEMPLATES.orbiter.stack,{orbit:80000,target:'station'},1500);const ti=F.targetInfo();ok('coach rendezvous: within 200 m and < 2 m/s of the station',ti.d<200&&ti.vr<2,`${ti.d.toFixed(0)} m, ${ti.vr.toFixed(2)} m/s`);}
{const F=fly(['moonplan','node','warpsoi'],TEMPLATES.lander.stack,{orbit:80000,target:'lune'},900);ok('coach transfer: enters LUNE sphere of influence',F.ves.stats.enteredLune);}
if(!quick){const F=fly('home',TEMPLATES.lander.stack,{target:'lune'},3000);ok('coach grand tour: landed on LUNE upright',F.ves.stats.landedLuneOk);ok('coach grand tour: back home on VERDA safely',F.ves.landed&&F.ves.landedOn==='verda'&&!F.ves.destroyed,`touchdown ${F.ves.touch?.v.toFixed(1)} m/s`);}
// 8. Crash detection
{const V=new Vessel(['pod','tankS1']);V.landed=false;V.r=[VERDA.R+200,0,0];V.v=[-80,0,0];let t=0;while(!V.destroyed&&!V.landed&&t<60){V.step(P.DT,{throttle:0},t);t+=P.DT;}ok('hard impact destroys the vessel',!!V.destroyed,V.destroyed?.why);}
console.log(`\n${n-fails}/${n} checks passed`);process.exit(fails?1:0);
