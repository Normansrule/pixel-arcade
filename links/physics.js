// FAIRWAY LEGENDS — ball physics: flight with drag, Magnus lift (backspin + side spin), wind; bounce, check and roll on
// sloped turf with per-lie friction; cup capture and lip-outs. Pure JS (no three.js) so CPU planning and node tests can run it.
// Units: metres, seconds, radians. Terrain T: {h(x,z), n(x,z,out), surf(x,z)->lie key, wet(x,z,y)->bool, inb(x,z)->bool, tree(x,y,z)->bool, pin:{x,z}}
export const G=9.81,BR=.02135,CUP=.056,YD=.9144,FT=.3048,PIN_H=2.3;
const K=1.225*Math.PI*BR*BR/(2*.04593);// rho*A/(2m)
// club table (pro-ish launch monitor numbers): ball speed m/s, launch deg, backspin rpm
export const CLUBS=[
 {id:'DR',n:'DRIVER',v:74.5,la:10.9,sp:2700},{id:'3W',n:'3 WOOD',v:70.4,la:9.6,sp:3600},{id:'5W',n:'5 WOOD',v:67.8,la:9.8,sp:4300},
 {id:'4H',n:'4 HYBRID',v:65,la:10.4,sp:4500},{id:'5I',n:'5 IRON',v:59.5,la:12.2,sp:5300},{id:'6I',n:'6 IRON',v:57,la:14.1,sp:6200},
 {id:'7I',n:'7 IRON',v:53.8,la:16.3,sp:7000},{id:'8I',n:'8 IRON',v:51.2,la:18.2,sp:7900},{id:'9I',n:'9 IRON',v:48.6,la:20.5,sp:8600},
 {id:'PW',n:'PITCHING WEDGE',v:45.4,la:24.2,sp:9300},{id:'GW',n:'GAP WEDGE',v:41.5,la:27.5,sp:9700},{id:'SW',n:'SAND WEDGE',v:37.5,la:31,sp:9900},
 {id:'LW',n:'LOB WEDGE',v:32.5,la:36,sp:10000},{id:'PT',n:'PUTTER',v:0,la:0,sp:0,putt:true}];
export const PUTTER=CLUBS.length-1;
// lies: e restitution, fr tangential loss per bounce, r rolling resistance (× g), grab = backspin bite, pw power, sm spin, err extra scatter
export const LIES={
 tee:{n:"TEE",e:.3,fr:.52,r:.1,grab:2.6,pw:1,sm:1,err:0},
 fairway:{n:"FAIRWAY",e:.3,fr:.52,r:.1,grab:2.6,pw:1,sm:1,err:0},
 fringe:{n:"FRINGE",e:.26,fr:.58,r:.13,grab:3.2,pw:.97,sm:.9,err:.05},
 green:{n:"GREEN",e:.22,fr:.5,r:.056,grab:4.6,pw:.96,sm:.9,err:0},
 rough:{n:'ROUGH',e:.2,fr:.7,r:.3,grab:.5,pw:.86,sm:.55,err:.25},
 deep:{n:'DUNE GRASS',e:.1,fr:.84,r:.7,grab:.3,pw:.68,sm:.4,err:.55},
 sand:{n:'BUNKER',e:.05,fr:.93,r:2.2,grab:.2,pw:.74,sm:.75,err:.35},
 water:{n:'WATER',e:0,fr:1,r:9,grab:0,pw:0,sm:0,err:0},ob:{n:'OUT OF BOUNDS',e:0,fr:1,r:9,grab:0,pw:0,sm:0,err:0}};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
/** course conditions set by the weather: carry (heavy, wet air), roll (softer turf) and green speed multipliers */
export const COND={carry:1,roll:1,green:1};
/** New ball at rest at p. */
export function ball(x,y,z){return{p:{x,y,z},v:{x:0,y:0,z:0},w:0,ax:{x:1,y:0,z:0},st:'rest',t:0,bn:0,air:0,land:null,apex:0,carry:0,start:{x,y,z},tc:0,lip:0};}
/** Launch a full shot. o: {club, pw 0..1.12 (fraction of the club's full distance), yaw (0 = +z), shape -1 draw..+1 fade, err -1..1 (hook..slice),
 *  lie key, spin -1..1 (less..more backspin)}. Ball speed is chosen from a calibrated table so pw scales carry ~linearly. */
export function launch(b,o){const c=CLUBS[o.club],L=LIES[o.lie]||LIES.fairway;b.start={...b.p};b.t=0;b.bn=0;b.air=0;b.land=null;b.apex=b.p.y;b.carry=0;b.lip=0;b.tc=0;
 if(c.putt){const d=Math.max(0,o.pw)*o.range;// putter: rolling start speed for distance d on a flat green
  const a=G*LIES.green.r*(o.lie==='green'?1:L.r/LIES.green.r*.75+.25),s=Math.sqrt(2*a*d)*1.0;b.v.x=Math.sin(o.yaw)*s;b.v.z=Math.cos(o.yaw)*s;b.v.y=0;b.w=0;b.st='roll';return b;}
 const pw=cl(o.pw,.05,1.15),sf=speedFor(o.club,pw),lieP=o.lie==='sand'&&o.club>=10?.93:L.pw;
 const spd=c.v*sf*Math.sqrt(lieP)*(o.boost||1)*COND.carry,la=(c.la+(o.lie==='sand'?3:0)+(o.loft||0))*Math.PI/180*(1+(1-pw)*.25);
 const err=o.err||0,shape=o.shape||0;
 // start line: a draw starts right and curves left; mishits push/pull with the curve
 const off=(-shape*2.2+err*2.4)*Math.PI/180,yaw=o.yaw+off*(-1);// yaw rotates towards +x; "right" is -x when looking down +z
 const ch=Math.cos(la);b.v.x=Math.sin(yaw)*ch*spd;b.v.z=Math.cos(yaw)*ch*spd;b.v.y=Math.sin(la)*spd;
 b.w=c.sp*Math.PI/30*sf*(L.sm)*(1+(o.spin||0)*.35)*(o.spinB||1);
 const tilt=cl(shape*.14+err*.3,-.6,.6);// + tilts the spin axis so the lift pushes right (fade/slice)
 // spin axis = cos(tilt)·right − sin(tilt)·up, right = cross(forward, up) = (−cos yaw, 0, sin yaw)
 b.ax.x=-Math.cos(yaw)*Math.cos(tilt);b.ax.y=-Math.sin(tilt);b.ax.z=Math.sin(yaw)*Math.cos(tilt);
 b.st='air';return b;}
// ---- calibration: carry of each club vs ball-speed fraction, so the meter maps linearly to distance ----
const CAL=[];
function flatCarry(ci,sf){const c=CLUBS[ci],b=ball(0,0,0),spd=c.v*sf,la=c.la*Math.PI/180*(1+(1-sf)*.25);b.v={x:0,y:Math.sin(la)*spd,z:Math.cos(la)*spd};b.w=c.sp*Math.PI/30*sf;b.ax={x:-1,y:0,z:0};b.st='air';
 const dt=1/120;for(let i=0;i<2400&&b.st==='air';i++){fly(b,dt,null);if(b.p.y<=0&&b.v.y<0)break;}return b.p.z;}
for(let ci=0;ci<PUTTER;ci++){const t=[];for(let i=0;i<=24;i++){const sf=.12+i*.045;t.push([sf,flatCarry(ci,sf)]);}CAL.push(t);}
export function fullCarry(ci){return CAL[ci]?CAL[ci].find(e=>e[0]>=1-1e-6)?.[1]||lerpCal(ci,1):0;}
function lerpCal(ci,sf){const t=CAL[ci];for(let i=1;i<t.length;i++)if(t[i][0]>=sf){const a=t[i-1],b=t[i],f=(sf-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*f;}return t[t.length-1][1];}
/** speed fraction that carries pw × the club's full carry */
export function speedFor(ci,pw){const t=CAL[ci],full=lerpCal(ci,1),want=full*pw;for(let i=1;i<t.length;i++)if(t[i][1]>=want){const a=t[i-1],b=t[i],f=(want-a[1])/(b[1]-a[1]||1);return a[0]+(b[0]-a[0])*f;}return t[t.length-1][0];}
export function carryOf(ci,pw=1){return ci>=PUTTER?0:lerpCal(ci,speedFor(ci,pw));}
// ---- flight ----
function fly(b,dt,wind){const v=b.v;let rx=v.x,ry=v.y,rz=v.z;if(wind){const hf=cl(b.p.y/25,.35,1.15);rx-=wind.x*hf;rz-=wind.z*hf;}
 const s=Math.hypot(rx,ry,rz)||1e-6,S=BR*b.w/s,Cd=.2+.38*Math.min(S,.35),Cl=Math.min(.36,.06+1.05*S);
 const ax=b.ax,cx=ax.y*rz-ax.z*ry,cy=ax.z*rx-ax.x*rz,cz=ax.x*ry-ax.y*rx;// axis × v_rel
 v.x+=(-K*Cd*s*rx+K*Cl*s*cx)*dt;v.y+=(-K*Cd*s*ry+K*Cl*s*cy-G)*dt;v.z+=(-K*Cd*s*rz+K*Cl*s*cz)*dt;
 b.p.x+=v.x*dt;b.p.y+=v.y*dt;b.p.z+=v.z*dt;b.w*=1-dt*.035;b.air+=dt;if(b.p.y>b.apex)b.apex=b.p.y;}
const N={x:0,y:1,z:0};
/** Advance the ball by dt (sub-stepped). Returns an event string or null: 'land','bounce','holed','water','ob','rest','lip','tree','pin'. */
export function step(b,T,wind,dt){let ev=null;const n=Math.max(1,Math.ceil(dt/(1/240))),h=dt/n;for(let i=0;i<n;i++){const e=sub(b,T,wind,h);if(e&&(!ev||e!=='bounce'))ev=e;if(b.st==='rest'||b.st==='holed'||b.st==='water'||b.st==='ob')break;}return ev;}
function sub(b,T,wind,dt){if(b.st==='rest'||b.st==='holed'||b.st==='water'||b.st==='ob')return null;b.t+=dt;const p=b.p,v=b.v;
 if(!T.inb(p.x,p.z)){b.st='ob';return'ob';}
 if(b.st==='air'){fly(b,dt,wind);let ev=null;
  if(b.tc<=0&&p.y<40&&T.tree(p.x,p.y,p.z)){const sp=Math.hypot(v.x,v.y,v.z);v.x*=-.15+Math.random()*.4;v.z*=-.15+Math.random()*.4;v.y=Math.min(v.y,0)*.3;b.w*=.3;b.tc=.6;ev='tree';void sp;}if(b.tc>0)b.tc-=dt;
  // flagstick
  const pdx=p.x-T.pin.x,pdz=p.z-T.pin.z,gh=T.h(T.pin.x,T.pin.z);if(pdx*pdx+pdz*pdz<.0036&&p.y-gh<PIN_H&&p.y>gh+.05){const hs=Math.hypot(v.x,v.z);if(p.y-gh<.25&&hs<7){b.st='holed';p.x=T.pin.x;p.z=T.pin.z;p.y=gh-.05;return'holed';}v.x*=-.25;v.z*=-.25;ev='pin';}
  const gy=T.h(p.x,p.z);
  if(p.y<=gy){if(T.wet(p.x,p.z,gy)){b.st='water';b.land=b.land||{x:p.x,z:p.z};return'water';}
   T.n(p.x,p.z,N);const vn=v.x*N.x+v.y*N.y+v.z*N.z;p.y=gy;
   if(vn<0){const L=LIES[T.surf(p.x,p.z)]||LIES.rough;const first=!b.land;if(first){b.land={x:p.x,z:p.z,lie:T.surf(p.x,p.z)};b.carry=Math.hypot(p.x-b.start.x,p.z-b.start.z);}b.bn++;
    // cup on the fly
    if(pdx*pdx+pdz*pdz<CUP*CUP*1.6&&Math.hypot(v.x,v.z)<5){b.st='holed';p.x=T.pin.x;p.z=T.pin.z;p.y=gy-.05;return'holed';}
    const tx=v.x-vn*N.x,ty=v.y-vn*N.y,tz=v.z-vn*N.z,ts=Math.hypot(tx,ty,tz)||1e-6;
    const e=L.e*cl(1.15-(-vn)/40,.45,1);const steep=-vn/(Math.hypot(v.x,v.y,v.z)||1);let keep=1-cl(L.fr*cl(-vn/14,.25,1)*(.45+steep*1.1),0,.97);
    // backspin bite: high spin on receptive turf checks (or sucks back) the ball
    const bite=L.grab*b.w/1000*cl(-vn/10,.2,1);let nt=ts*keep-bite;nt=Math.max(nt,-ts*.35);
    const k=nt/ts;v.x=tx*k-vn*e*N.x;v.y=ty*k-vn*e*N.y;v.z=tz*k-vn*e*N.z;b.w*=.62;
    if(-vn*e<.9){b.st='roll';}ev=ev||(first?'land':'bounce');}}
  return ev;}
 // rolling on the surface
 const lie=T.surf(p.x,p.z);if(lie==='water'||T.wet(p.x,p.z,T.h(p.x,p.z))){b.st='water';b.land=b.land||{x:p.x,z:p.z};return'water';}
 const L=LIES[lie]||LIES.rough;T.n(p.x,p.z,N);
 // gravity along the slope (rolling sphere: 5/7 g sinθ)
 const gx=-G*N.y*N.x*5/7,gz=-G*N.y*N.z*5/7;let sp=Math.hypot(v.x,v.z);const rr=G*L.r*(lie==='green'?COND.green:COND.roll);
 if(sp<.04){const gs=Math.hypot(gx,gz);if(gs<rr*1.15||lie==='sand'){v.x=v.z=v.y=0;b.st='rest';p.y=T.h(p.x,p.z);return'rest';}}
 v.x+=gx*dt;v.z+=gz*dt;sp=Math.hypot(v.x,v.z);if(sp>1e-6){const d=Math.min(sp,rr*dt);v.x-=v.x/sp*d;v.z-=v.z/sp*d;}
 p.x+=v.x*dt;p.z+=v.z*dt;const ny=T.h(p.x,p.z);
 // rolling off a crest at speed: go airborne again
 if(ny<p.y-.06&&sp>6){b.st='air';v.y=0;return null;}p.y=ny;v.y=0;
 // the cup
 const dx=p.x-T.pin.x,dz=p.z-T.pin.z,d2=dx*dx+dz*dz;
 if(d2<CUP*CUP){sp=Math.hypot(v.x,v.z);if(sp<1.35){b.st='holed';p.x=T.pin.x;p.z=T.pin.z;p.y=ny-.06;return'holed';}
  if(b.lip<=0){b.lip=.3;const a=(Math.random()-.5)*1.6,c=Math.cos(a),s=Math.sin(a);const nx=v.x*c-v.z*s,nz=v.x*s+v.z*c;v.x=nx*.55;v.z=nz*.55;return'lip';}}
 if(b.lip>0)b.lip-=dt;return null;}
/** Fast forward a copy of a ball to rest (CPU planning, preview). Returns {b, ev[], path?}. */
export function simulate(b0,T,wind,maxT=14,trace){const b=JSON.parse(JSON.stringify(b0));const path=trace?[]:null;let last=null,tt=0;const dt=1/60;
 while(tt<maxT&&!['rest','holed','water','ob'].includes(b.st)){const e=step(b,T,wind,dt);if(e)last=e;tt+=dt;if(path&&b.st==='air')path.push(b.p.x,b.p.y,b.p.z);}
 if(!['holed','water','ob'].includes(b.st))b.st='rest';return{b,last,path};}
