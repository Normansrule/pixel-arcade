// ORBIT LAB — career missions, their briefings (equation + mini diagram) and the MATH NOTEBOOK. Pure JS (no DOM).
import * as P from './physics.js';
const {VERDA,LUNE}=P;
const ac='#ff4d00';
// tiny SVG helpers for briefing diagrams (stroke = currentColor so they theme with the UI)
const svg=(body,vb='0 0 260 150')=>`<svg viewBox="${vb}" class="diag" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.6" font-family="JetBrains Mono,monospace" font-size="9">${body}</svg>`;
const planet=(x,y,r,l='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#123a5c" stroke="#5fb4ff"/>${l?`<text x="${x}" y="${y+3}" text-anchor="middle" fill="#cfe8ff" stroke="none">${l}</text>`:''}`;
const arrow=(x1,y1,x2,y2,c=ac,l='',lx=0,ly=0)=>{const a=Math.atan2(y2-y1,x2-x1),h=6;return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2"/><path d="M${x2},${y2} L${x2-h*Math.cos(a-.4)},${y2-h*Math.sin(a-.4)} L${x2-h*Math.cos(a+.4)},${y2-h*Math.sin(a+.4)}Z" fill="${c}" stroke="none"/>${l?`<text x="${x2+lx}" y="${y2+ly}" fill="${c}" stroke="none">${l}</text>`:''}`;};
const rocket=(x,y,s=1)=>`<g transform="translate(${x},${y}) scale(${s})"><path d="M0,-22 L5,-12 L5,10 L-5,10 L-5,-12Z" fill="#e8e8ea" stroke="#999"/><path d="M-5,6 L-10,14 L-5,12Z M5,6 L10,14 L5,12Z" fill="${ac}" stroke="none"/></g>`;

export const DIAGRAMS={
 twr:svg(`<line x1="20" y1="132" x2="240" y2="132" stroke="#4a6a3a"/>${rocket(130,95,1.6)}${arrow(130,70,130,22,ac,'F = thrust',8,6)}${arrow(150,90,150,128,'#5fb4ff','m·g',6,-2)}<text x="20" y="20" fill="currentColor" stroke="none">TWR = F / (m·g) &gt; 1 → lift-off</text>`),
 tsiol:svg(`${rocket(60,80,1.6)}<text x="30" y="132" stroke="none" fill="currentColor">m₀ (full)</text>${arrow(95,75,150,75)}<g transform="translate(200,80)"><path d="M0,-22 L5,-12 L5,10 L-5,10 L-5,-12Z" fill="#e8e8ea" stroke="#999"/><rect x="-5" y="-8" width="10" height="18" fill="none" stroke-dasharray="2 2"/></g><text x="168" y="132" stroke="none" fill="currentColor">m_f (empty)</text><text x="58" y="22" stroke="none" fill="${ac}">Δv = Isp·g₀·ln(m₀/m_f)</text>`),
 drag:svg(`<defs><linearGradient id="atm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5fb4ff" stop-opacity=".7"/><stop offset="1" stop-color="#5fb4ff" stop-opacity="0"/></linearGradient></defs><rect x="0" y="20" width="260" height="112" fill="url(#atm)" stroke="none"/><line x1="0" y1="34" x2="260" y2="34" stroke-dasharray="4 3"/><text x="6" y="30" stroke="none" fill="currentColor">70 km — space begins</text><path d="M30,132 C40,60 120,40 200,34" stroke="${ac}" stroke-width="2"/><text x="120" y="110" stroke="none" fill="currentColor">ρ = ρ₀·e^(−h/H)</text><text x="120" y="124" stroke="none" fill="currentColor">q = ½ρv²</text>`),
 orbit:svg(`${planet(130,75,32,'VERDA')}<circle cx="130" cy="75" r="58" stroke="${ac}" stroke-dasharray="3 3"/>${rocket(188,75,.7)}${arrow(188,75,188,25,ac,'v = √(μ/r)',6,0)}${arrow(178,75,140,75,'#5fb4ff','g',0,-5)}<text x="8" y="140" stroke="none" fill="currentColor">falling sideways fast enough to miss the ground</text>`),
 hohmann:svg(`${planet(110,75,20)}<circle cx="110" cy="75" r="36" stroke="#5fb4ff"/><circle cx="110" cy="75" r="66" stroke="#5fb4ff"/><ellipse cx="95" cy="75" rx="51" ry="48.7" stroke="${ac}" stroke-dasharray="4 3"/>${arrow(146,75,146,52,ac,'Δv₁',4,0)}${arrow(44,75,44,100,ac,'Δv₂',-22,10)}<text x="182" y="40" stroke="none" fill="currentColor">r₁ → r₂</text><text x="182" y="54" stroke="none" fill="currentColor">a = (r₁+r₂)/2</text>`),
 rendez:svg(`${planet(80,75,22)}<circle cx="80" cy="75" r="40" stroke="#5fb4ff"/><circle cx="80" cy="75" r="62" stroke="#5fb4ff"/><line x1="80" y1="75" x2="120" y2="75" stroke-dasharray="2 2"/><line x1="80" y1="75" x2="131" y2="40" stroke-dasharray="2 2"/><path d="M104,75 A24,24 0 0,0 100,62" stroke="${ac}"/><text x="108" y="68" fill="${ac}" stroke="none">φ</text><rect x="128" y="35" width="8" height="8" fill="#ffd166" stroke="none"/><text x="150" y="40" stroke="none" fill="currentColor">station leads by φ</text><text x="150" y="110" stroke="none" fill="currentColor">φ = π − n₂·t</text>`),
 soi:svg(`${planet(50,75,26,'VERDA')}<circle cx="200" cy="75" r="12" fill="#666" stroke="#bbb"/><circle cx="200" cy="75" r="42" stroke="${ac}" stroke-dasharray="4 3"/><path d="M62,58 C120,10 170,30 175,50" stroke="#5fb4ff"/><text x="160" y="140" stroke="none" fill="${ac}">r_SOI = a(m/M)^⅖</text><text x="190" y="25" stroke="none" fill="currentColor">LUNE</text>`),
 land:svg(`<line x1="10" y1="132" x2="250" y2="132" stroke="#999"/>${rocket(130,60,1.3)}${arrow(116,40,116,8,ac,'',0,0)}${arrow(146,70,146,118,'#5fb4ff','v',6,0)}<line x1="170" y1="78" x2="170" y2="132" stroke-dasharray="3 3"/><text x="176" y="108" stroke="none" fill="currentColor">d = v²/(2a)</text><text x="10" y="20" stroke="none" fill="currentColor">a = F/m − g  (braking)</text>`),
 chute:svg(`<path d="M90,40 Q130,0 170,40Z" fill="${ac}" fill-opacity=".25" stroke="${ac}"/><line x1="92" y1="40" x2="130" y2="96"/><line x1="168" y1="40" x2="130" y2="96"/>${rocket(130,112,.8)}${arrow(200,60,200,110,'#5fb4ff','m·g',6,0)}${arrow(220,110,220,62,ac,'drag',6,0)}<text x="8" y="140" stroke="none" fill="currentColor">v_t = √(2mg / (ρ·C_d·A))</text>`),
};

// MATH NOTEBOOK entries — each has an interactive calculator
export const NOTEBOOK=[
 {id:'twr',t:'Thrust-to-weight ratio',f:'TWR = F / (m·g)',x:'Above 1 the rocket accelerates upward; the net acceleration is (TWR − 1)·g. 1.4–2.0 is the sweet spot at launch.',d:'twr',
  v:[['F','Thrust','','kN',250,10,2000],['m','Mass','','t',10,.5,80],['g','Gravity','','m/s²',9.81,1,12]],calc:o=>{const r=o.F*1000/(o.m*1000*o.g);return`TWR = ${o.F*1000|0} / (${o.m*1000|0} × ${o.g}) = <b>${r.toFixed(2)}</b> → a = ${((r-1)*o.g).toFixed(2)} m/s²`;}},
 {id:'tsiol',t:'Tsiolkovsky rocket equation',f:'Δv = I<sub>sp</sub>·g₀·ln(m₀ / m<sub>f</sub>)',x:'The total velocity change a stage can give. Doubling fuel does NOT double Δv — the logarithm punishes heavy rockets. That is why we stage: dropping empty tanks resets m₀.',d:'tsiol',
  v:[['isp','Specific impulse','','s',300,80,450],['m0','Full mass m₀','','t',10,1,80],['mf','Empty mass m_f','','t',4,.5,79]],calc:o=>{const mf=Math.min(o.mf,o.m0-.01);const dv=o.isp*P.G0*Math.log(o.m0/mf);return`Δv = ${o.isp} × 9.81 × ln(${o.m0}/${mf}) = <b>${dv.toFixed(0)} m/s</b>`;}},
 {id:'burn',t:'Burn time',f:'t = m<sub>p</sub>·I<sub>sp</sub>·g₀ / F',x:'Mass flow ṁ = F/(I<sub>sp</sub>·g₀); burn time is propellant mass divided by it. For a partial burn: t = (m₀I<sub>sp</sub>g₀/F)(1 − e<sup>−Δv/(I<sub>sp</sub>g₀)</sup>).',d:'tsiol',
  v:[['mp','Propellant','','t',4,.1,40],['isp','Isp','','s',300,80,450],['F','Thrust','','kN',215,10,2000]],calc:o=>`t = ${o.mp*1000|0} × ${o.isp} × 9.81 / ${o.F*1000|0} = <b>${(o.mp*1000*o.isp*P.G0/(o.F*1000)).toFixed(1)} s</b>`},
 {id:'drag',t:'Atmosphere and drag',f:'ρ = ρ₀·e<sup>−h/H</sup> ,  q = ½ρv² ,  F<sub>d</sub> = q·C<sub>d</sub>·A',x:`VERDA's air thins by a factor e every H = ${VERDA.H/1000} km. Dynamic pressure q peaks low and fast ("max-Q"); a gravity turn keeps the nose on prograde so drag can't flip the rocket.`,d:'drag',
  v:[['h','Altitude','','km',10,0,70],['v','Speed','','m/s',400,0,2500]],calc:o=>{const r=P.density(VERDA,o.h*1000);return`ρ = <b>${r.toFixed(4)}</b> kg/m³ → q = ½·ρ·v² = <b>${(.5*r*o.v*o.v/1000).toFixed(2)} kPa</b>`;}},
 {id:'circ',t:'Circular orbit speed',f:'v<sub>c</sub> = √(μ / r)',x:`μ = G·M = ${(VERDA.mu/1e9).toFixed(1)}×10⁹ m³/s² for VERDA (R = ${VERDA.R/1000} km). r is measured from the planet's centre, not the surface!`,d:'orbit',
  v:[['h','Altitude','','km',80,0,4000]],calc:o=>{const r=VERDA.R+o.h*1000;return`v = √(${(VERDA.mu/1e9).toFixed(1)}e9 / ${(r/1000).toFixed(0)} km) = <b>${P.vCirc(VERDA.mu,r).toFixed(0)} m/s</b>`;}},
 {id:'visviva',t:'Vis-viva equation',f:'v² = μ·(2/r − 1/a)',x:'Speed anywhere on an orbit from just the distance r and the semi-major axis a = (r<sub>Pe</sub> + r<sub>Ap</sub>)/2. Fast at periapsis, slow at apoapsis — energy is conserved.',d:'orbit',
  v:[['pe','Periapsis alt','','km',80,0,3000],['ap','Apoapsis alt','','km',250,0,4000],['h','Where (alt)','','km',80,0,4000]],calc:o=>{const a=VERDA.R+(o.pe+o.ap)*500,r=VERDA.R+o.h*1000;return`a = ${(a/1000).toFixed(0)} km → v = <b>${P.visViva(VERDA.mu,r,a).toFixed(0)} m/s</b>`;}},
 {id:'period',t:'Orbital period (Kepler III)',f:'T = 2π·√(a³ / μ)',x:'Bigger orbits are slower AND longer: T grows with a<sup>3/2</sup>.',d:'orbit',
  v:[['h','Circular alt','','km',80,0,4000]],calc:o=>{const a=VERDA.R+o.h*1000;return`T = <b>${(P.period(VERDA.mu,a)/60).toFixed(1)} min</b>`;}},
 {id:'hohmann',t:'Hohmann transfer',f:'Δv₁ = √(μ/r₁)(√(2r₂/(r₁+r₂)) − 1) ,  Δv₂ = √(μ/r₂)(1 − √(2r₁/(r₁+r₂)))',x:'The cheapest two-burn trip between circular orbits: burn prograde to stretch the orbit into an ellipse touching r₂, coast half an orbit (t = π√(a³/μ)), burn prograde again to round it off.',d:'hohmann',
  v:[['h1','From alt','','km',80,0,3000],['h2','To alt','','km',250,0,4000]],calc:o=>{const H=P.hohmann(VERDA.mu,VERDA.R+o.h1*1000,VERDA.R+o.h2*1000);return`Δv₁ = <b>${H.dv1.toFixed(1)}</b>, Δv₂ = <b>${H.dv2.toFixed(1)}</b> m/s, total ${H.total.toFixed(1)} m/s, transfer ${(H.t/60).toFixed(1)} min`;}},
 {id:'phase',t:'Phase angle for rendezvous',f:'φ = π − n₂·t<sub>transfer</sub> ,  n₂ = √(μ/r₂³)',x:'While we coast half an ellipse, the target moves n₂·t radians. Launch the transfer when the target leads by φ and you arrive together. Close in by matching velocity: relative speed → 0.',d:'rendez',
  v:[['h1','Your alt','','km',80,0,3000],['h2','Target alt','','km',120,0,4000]],calc:o=>{const H=P.hohmann(VERDA.mu,VERDA.R+o.h1*1000,VERDA.R+o.h2*1000);return`φ = <b>${(H.phase*180/Math.PI).toFixed(1)}°</b> (target ahead)`;}},
 {id:'soi',t:'Sphere of influence',f:'r<sub>SOI</sub> = a·(m/M)<sup>2/5</sup>',x:`Inside this radius LUNE's pull dominates and we track our orbit around LUNE alone ("patched conics"). For LUNE: a = ${LUNE.a/1000} km, m/M = ${(LUNE.mu/VERDA.mu).toFixed(4)}.`,d:'soi',
  v:[['a','Moon distance','','km',4000,500,9000],['k','Mass ratio m/M','','',.0118,.001,.1]],calc:o=>`r<sub>SOI</sub> = <b>${(o.a*o.k**.4).toFixed(0)} km</b>`},
 {id:'suicide',t:'Suicide burn',f:'d = v² / (2a) ,  a = F/m − g',x:'Falling at v, braking with net deceleration a, you need distance d to stop. Light the engine when your height ≈ d (plus a safety margin) — the most fuel-efficient landing.',d:'land',
  v:[['v','Descent speed','','m/s',200,1,800],['F','Thrust','','kN',24,1,500],['m','Mass','','t',3,.3,40]],calc:o=>{const a=o.F*1000/(o.m*1000)-LUNE.g;return a<=0?'a ≤ 0 — this engine can\'t stop you on LUNE!':`a = ${a.toFixed(2)} m/s² → d = <b>${(o.v*o.v/(2*a)).toFixed(0)} m</b>`;}},
 {id:'terminal',t:'Terminal velocity',f:'v<sub>t</sub> = √(2mg / (ρ·C<sub>d</sub>·A))',x:'Drag grows with v² until it equals weight. A parachute multiplies C<sub>d</sub>A by ~2000 — dropping v<sub>t</sub> to a gentle few m/s.',d:'chute',
  v:[['m','Mass','','t',1.5,.3,10],['cda','C_d·A','','m²',1000,.5,3000],['h','Altitude','','km',0,0,30]],calc:o=>{const r=P.density(VERDA,o.h*1000)||1e-6;return`v<sub>t</sub> = <b>${P.terminalVelocity(o.m*1000,VERDA.g,r,o.cda).toFixed(1)} m/s</b>`;}},
];
export const noteById=id=>NOTEBOOK.find(n=>n.id===id);

const alt=F=>F.ves.alt;
export const MISSIONS=[
 {id:'hop',n:'01',t:'FIRST HOP',sub:'Reach 10 km',funds:8000,pts:100,notes:['twr','tsiol','burn'],plan:'ascent',d:'twr',
  brief:`Your first rocket only has to go <b>up</b>. Thrust must beat weight: the thrust-to-weight ratio <code>TWR = F/(m·g)</code> must exceed 1 or the rocket sits on the pad. How high you get depends on Δv from the rocket equation <code>Δv = I<sub>sp</sub>·g₀·ln(m₀/m<sub>f</sub>)</code>.`,
  tips:['Capsule on top, a tank or two, an engine at the bottom.','Watch the VAB stats: TWR between 1.4 and 2.5.','SPACE ignites the engine. Z = full throttle.'],
  check:F=>F.ves.stats.maxAlt>=10000},
 {id:'space',n:'02',t:'EDGE OF SPACE',sub:'Reach 70 km',funds:12000,pts:150,notes:['drag'],plan:'ascent',d:'drag',
  brief:`Above <b>70 km</b> VERDA's atmosphere is gone. Air density falls exponentially <code>ρ = ρ₀e<sup>−h/H</sup></code>, so drag (<code>½ρv²·C<sub>d</sub>A</code>) is brutal low down and vanishes high up. Keep the nose pointed along your velocity and let fins keep you stable.`,
  tips:['Fins at the bottom move the centre of pressure below the centre of mass.','Two stages beat one: drop empty tanks (SPACE).','Easy route: straight up is fine for this one!'],
  check:F=>F.ves.stats.maxAlt>=70000},
 {id:'orbit',n:'03',t:'ORBIT',sub:'Periapsis above 70 km',funds:20000,pts:250,notes:['circ','visviva','period'],plan:'orbit',d:'orbit',
  brief:`An orbit is falling sideways so fast you keep missing the ground. A circle needs <code>v = √(μ/r)</code> ≈ 1,520 m/s at 80 km. Climb, tip east in a <b>gravity turn</b>, coast to apoapsis, then burn prograde until the periapsis also clears 70 km. The vis-viva equation <code>v² = μ(2/r − 1/a)</code> tells you the speed anywhere on the orbit.`,
  tips:['Start tilting east (D) at ~50 m/s, about 10°.','Follow prograde (SAS PRO) after 10 km.','Cut the engine when Ap = 80 km; burn again near Ap.'],
  check:F=>{const v=F.ves;if(v.body!=='verda'||v.landed)return false;return v.orbit().rp-VERDA.R>=70000;}},
 {id:'hohmann',n:'04',t:'HIGH ORBIT',sub:'Circular 250 km via Hohmann',funds:18000,pts:250,notes:['hohmann'],plan:'hohmann',d:'hohmann',
  brief:`Raise your orbit the efficient way: a <b>Hohmann transfer</b>. Burn prograde <code>Δv₁ = √(μ/r₁)(√(2r₂/(r₁+r₂)) − 1)</code> to stretch the orbit to 250 km, coast half an orbit, then <code>Δv₂ = √(μ/r₂)(1 − √(2r₁/(r₁+r₂)))</code> to circularise. Open the <b>HOHMANN HELPER</b> (H) to see every step with your numbers.`,
  tips:['Get to a low orbit first (or skip ascent).','H → HOHMANN HELPER → CREATE NODE.','B executes the node automatically if you want.'],
  check:F=>{const v=F.ves;if(v.body!=='verda'||v.landed)return false;const e=v.orbit();return e.rp-VERDA.R>=225000&&e.ra-VERDA.R<=280000;}},
 {id:'rendezvous',n:'05',t:'RENDEZVOUS',sub:'Within 200 m of the station, < 2 m/s',funds:25000,pts:350,notes:['phase'],plan:'rendezvous',d:'rendez',target:'station',
  brief:`The station circles at 120 km. Catch it with a transfer timed by the <b>phase angle</b> <code>φ = π − n₂·t</code>: burn when the station leads you by φ, so you both arrive at the same place. Near it, kill the <b>relative velocity</b> (SAS TARGET-RETRO) and drift in slowly.`,
  tips:['The map shows closest approach markers.','HOHMANN HELPER → target STATION builds the node.','Under 1 km, approach at ≤ d/50 m/s.'],
  check:F=>{const ti=F.targetInfo();return ti&&ti.name==='STATION'&&ti.d<200&&ti.vr<2;}},
 {id:'flyby',n:'06',t:'LUNE FLYBY',sub:'Enter LUNE\'s sphere of influence',funds:25000,pts:350,notes:['soi'],plan:'flyby',d:'soi',target:'lune',
  brief:`LUNE orbits 4,000 km out. Within its <b>sphere of influence</b> <code>r = a(m/M)<sup>2/5</sup></code> ≈ ${(LUNE.soi/1000).toFixed(0)} km we switch to orbiting LUNE — "patched conics". A Hohmann-style burn of ~550 m/s from low orbit, timed so LUNE arrives when you do, gets you there.`,
  tips:['HOHMANN HELPER → target LUNE builds an optimised node.','Time-warp (. ,) while coasting; it stops at the SOI.','The orbit line turns pale when it enters LUNE.'],
  check:F=>F.ves.stats.enteredLune},
 {id:'land',n:'07',t:'LUNE LANDING',sub:'Touch down on LUNE, upright',funds:35000,pts:500,notes:['suicide'],plan:'land',d:'land',target:'lune',
  brief:`No air on LUNE, no parachutes: you land on engine power. Falling at speed v with braking acceleration <code>a = F/m − g</code> you need <code>d = v²/(2a)</code> to stop. The <b>SUICIDE-BURN</b> gauge shows d live — light the engine when altitude ≈ d.`,
  tips:['Legs (L) raise crash tolerance to 8 m/s.','Kill horizontal speed first, then fall straight.','The MOTH lander engine throttles finely.'],
  check:F=>F.ves.stats.landedLuneOk},
 {id:'home',n:'08',t:'RETURN HOME',sub:'Land on LUNE, then on VERDA',funds:50000,pts:800,notes:['terminal'],plan:'home',d:'chute',target:'lune',
  brief:`The grand tour: land on LUNE, launch again, escape <b>against</b> LUNE's motion so your new orbit around VERDA dips into the air, survive reentry heat-shield first, then open the chute below ~250 m/s. Under canopy you fall at <code>v<sub>t</sub> = √(2mg/(ρC<sub>d</sub>A))</code>.`,
  tips:['Bring a parachute and enough Δv (~5,500 m/s total).','HOHMANN HELPER → RETURN TO VERDA when in LUNE orbit.','P opens the chute; drop spent stages before entry.'],
  check:F=>F.ves.stats.landedLuneOk&&F.ves.landed&&F.ves.landedOn==='verda'},
];
export const missionIndex=id=>MISSIONS.findIndex(m=>m.id===id);
