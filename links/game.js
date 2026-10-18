// FAIRWAY LEGENDS — full 3D links golf. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {CLUBS,PUTTER,LIES,YD,FT,BR,ball as newBall,launch,step as phStep,simulate,carryOf} from './physics.js';
import {HOLES,QUICK,COURSE,buildHole as makeHole,dropSpot,WIND_DIR} from './course.js';
import {buildHole as buildScene,makeEnv,ctex} from './world.js';
import {Golfer,swingAt} from './rig.js';
import {plan,execute,DIFF,clubFor} from './ai.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepads,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,hyp=Math.hypot,ID='fairwaylegends';
/* ================= renderer ================= */
const Rd=new THREE.WebGLRenderer({canvas:$('c'),powerPreference:'high-performance'});Rd.setPixelRatio(Math.min(devicePixelRatio,1.5));Rd.shadowMap.enabled=true;Rd.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,16/9,.1,14000);scene.background=new THREE.Color(0x9cc4ea);
scene.environment=makeEnv(Rd);scene.fog=new THREE.FogExp2(0xb8d2ec,.00036);
let W=null,T=null,gfx=quality(),fxp=null;const snd=new Sound();
function applyQuality(q){gfx=q;Rd.setPixelRatio(Math.min(devicePixelRatio,q===0?1:1.5));if(W&&W.key){const s=q===2?4096:q===1?2048:1024;if(W.key.shadow.mapSize.x!==s){W.key.shadow.mapSize.set(s,s);if(W.key.shadow.map){W.key.shadow.map.dispose();W.key.shadow.map=null;}}}fxp=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));
const POST={exposure:.95,bloom:.14,bloomThreshold:.98,bloomRadius:.45,vignette:.22,saturation:1.1,grain:.012,aoStrength:.45};
/* ================= shared meshes ================= */
const blobT=ctex(64,64,x=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);},{clamp:true});
const ballGeo=new THREE.SphereGeometry(BR,20,14),ballMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35,emissive:0x303030});
const shadowBlob=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false}));shadowBlob.renderOrder=3;scene.add(shadowBlob);
// shot tracer ribbon
const TRN=700,trPos=new Float32Array(TRN*2*3),trA=new Float32Array(TRN*2);const trGeo=new THREE.BufferGeometry();trGeo.setAttribute('position',new THREE.BufferAttribute(trPos,3).setUsage(THREE.DynamicDrawUsage));trGeo.setAttribute('a',new THREE.BufferAttribute(trA,1).setUsage(THREE.DynamicDrawUsage));
{const idx=[];for(let i=0;i<TRN-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}trGeo.setIndex(idx);}
const trMat=new THREE.ShaderMaterial({uniforms:{col:{value:new THREE.Color(2.2,.55,.18)},fade:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
 vertexShader:'attribute float a;varying float vA;void main(){vA=a;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 col;uniform float fade;varying float vA;void main(){gl_FragColor=vec4(col*vA*fade,1.);}'});
const tracer=new THREE.Mesh(trGeo,trMat);tracer.frustumCulled=false;tracer.renderOrder=4;scene.add(tracer);let trail=[];
// preview arc dots, landing ring, rest marker
const NDOT=70,dots=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.6,.5),transparent:true,opacity:.85,depthWrite:false}),NDOT);dots.frustumCulled=false;dots.renderOrder=5;scene.add(dots);
const ringT=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=7;x.beginPath();x.arc(64,64,54,0,7);x.stroke();x.lineWidth=3;x.beginPath();x.arc(64,64,34,0,7);x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(64,64,6,0,7);x.fill();},{clamp:true});
const mkDecal=(col,s)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:ringT,color:col,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6}));m.renderOrder=5;m.visible=false;scene.add(m);return m;};
const landRing=mkDecal(new THREE.Color(1.5,1.3,.4),1),restRing=mkDecal(new THREE.Color(.9,1.4,1.6),1);
// putting grid
let grid=null;
// particles
class Parts{constructor(n=900){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.l=new Float32Array(n);this.i=0;const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));this.g=g;
  this.m=new THREE.Points(g,new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,depthWrite:false}));this.m.frustumCulled=false;scene.add(this.m);for(let i=0;i<n;i++)this.p[i*3+1]=-999;}
 burst(x,y,z,n,sp,cols,life,up=1,dir){for(let k=0;k<n;k++){const i=this.i;this.i=(i+1)%this.n;const a=rnd()*6.283,s=sp*(.3+rnd()*.7);this.p.set([x,y,z],i*3);
   this.v.set([Math.cos(a)*s*.6+(dir?dir.x*sp:0),(.5+rnd())*sp*up,Math.sin(a)*s*.6+(dir?dir.z*sp:0)],i*3);const c=cols[rnd()*cols.length|0];this.c.set([c.r,c.g,c.b],i*3);this.l[i]=life*(.6+rnd()*.6);}}
 update(dt){for(let i=0;i<this.n;i++){if(this.l[i]<=0){if(this.p[i*3+1]>-900)this.p[i*3+1]=-999;continue;}this.l[i]-=dt;const j=i*3;this.v[j+1]-=9*dt;this.p[j]+=this.v[j]*dt;this.p[j+1]+=this.v[j+1]*dt;this.p[j+2]+=this.v[j+2]*dt;}
  this.g.attributes.position.needsUpdate=this.g.attributes.color.needsUpdate=true;}}
const parts=new Parts(1200);const C3=(r,g,b)=>new THREE.Color(r,g,b);
const PC={turf:[C3(.22,.4,.12),C3(.3,.22,.12),C3(.35,.55,.2)],sand:[C3(.85,.76,.58),C3(.75,.66,.5)],water:[C3(.9,.95,1),C3(.6,.8,.9)],deep:[C3(.55,.5,.28),C3(.35,.42,.2)]};
/* ================= options + round state ================= */
let opt={mode:0,hum:1,cpu:1,diff:1,clock:1,assist:1};const saveOpt=stored('pxd_fairway_opt',opt);
const CLOCKS=[[360,150],[720,270],[1260,480]];
const LOOKS=[{shirt:0xe23b2e,pants:0x2a2f3a,skin:0xe0b090,cap:0xffffff,c:'#e23b2e'},{shirt:0x2b7de0,pants:0xe8e4da,skin:0xc89a72,cap:0x1b2a44,c:'#2b7de0'},{shirt:0xf2c230,pants:0x33363d,skin:0xf0c8a4,cap:0x2a2a2a,c:'#f2c230'},{shirt:0x2fb36a,pants:0xd9d2c0,skin:0x9a6a48,cap:0xffffff,c:'#2fb36a'},
 {shirt:0x8a4fd8,pants:0x24262c,skin:0xe6b894,cap:0x8a4fd8,c:'#8a4fd8'},{shirt:0xff7a2a,pants:0x3b4250,skin:0xd2a07a,cap:0xffffff,c:'#ff7a2a'},{shirt:0x1fb8c4,pants:0xf0ece2,skin:0xb98060,cap:0x14313a,c:'#1fb8c4'}];
const CPU_NAMES=['ISLA BRENNAN','KAI LINDQVIST','MATEO FERRAZ','HANA OKABE','CALLUM REIDY','SOFIA MARCHETTI','TOBIAS WREN','AMARA OSEI'];
let app='menu',holes=[],hi=0,players=[],cur=-1,phase='',pt=0,wind={x:0,z:0,mph:0,dir:0},meter=null,anim=null,fl=null,timeScale=1,camView=0,lastAward=null,autoHum=false,attractT=0,flyC=null,cardT=0,honors=[],roundT=0;
const P=()=>players[cur];
/* ================= holes ================= */
function loadHole(i,pinPick){if(W)W.dispose();T=makeHole(i,pinPick);W=buildScene(scene,T,{q:gfx});applyQuality(gfx);buildGrid();buildMap();
 snd.setSea(T.sea?1:.25);}
function startRound(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);saveOpt();snd.init();snd.play('ui',1);
 opt.hum=cl(opt.hum,1,4);opt.cpu=cl(opt.cpu,0,4-opt.hum);
 holes=opt.mode===1?QUICK.slice():HOLES.map((_,i)=>i);hi=0;players.forEach(p=>{p.golfer.dispose();scene.remove(p.bm);});players=[];
 const names=CPU_NAMES.slice().sort(()=>rnd()-.5),clk=CLOCKS[opt.clock][opt.mode?1:0];
 for(let i=0;i<opt.hum;i++)players.push(mkPlayer(opt.hum===1?'YOU':'PLAYER '+(i+1),true,LOOKS[i],clk));
 for(let i=0;i<opt.cpu;i++)players.push(mkPlayer(names[i],false,LOOKS[opt.hum+i],0));
 honors=players.map((_,i)=>i);roundT=0;app='play';for(const id of['menu','keys','over','pause'])$(id).hidden=true;$('hud').hidden=false;document.body.classList.add('playing');$('card').hidden=true;startHole();}
function mkPlayer(name,human,look,clock){const g=new Golfer(scene,look);g.visible(false);const bm=new THREE.Mesh(ballGeo,ballMat);bm.visible=false;scene.add(bm);
 return{name,human,look,golfer:g,bm,scores:[],str:0,pos:{x:0,y:0,z:0},lie:'tee',done:false,clock,out:false,aim:{yaw:0,club:0,shape:0,spin:0},st:{putts:0,fir:0,firN:0,gir:0,girN:0,drive:0,pen:0},onGreenAt:0,hp:0};}
function startHole(){loadHole(holes[hi],rnd());const D=T.def;
 // wind: links breeze, mostly off the sea
 const mph=4+rnd()*rnd()*20,dir=WIND_DIR+Math.PI+(rnd()-.5)*2.2;wind={mph:Math.round(mph),dir,x:Math.sin(dir)*mph*.447,z:Math.cos(dir)*mph*.447};snd.setWind(wind.mph);
 const ty=T.h(T.tee.x,T.tee.z);
 players.forEach(p=>{p.str=0;p.done=false;p.pos={x:T.tee.x,y:ty,z:T.tee.z};p.lie='tee';p.bm.visible=false;p.hp=0;p.reachedGreen=false;p.putts=0;
  if(p.out){p.done=true;p.scores[hi]=D.par+2;}});
 trail=[];tracer.visible=false;phase='flyover';pt=0;flyC=flyPath();$('fly').hidden=false;$('flyh').textContent=`HOLE ${hi+1} · ${D.n}`;$('flys').textContent=`PAR ${D.par} · ${T.yards} YDS · WIND ${wind.mph} MPH`;hudCache={};
 players.forEach(p=>p.golfer.visible(false));if(!players.some(p=>!p.done))return holeEnd();}
function flyPath(){const up=(p,h)=>new V(p.x,T.h(p.x,p.z)+h,p.z),pa=s=>T.ptAt(T.S*s,0);const t=T.tee,g=T.gc,hd=T.hd;
 const pos=[up({x:t.x-hd.x*45,z:t.z-hd.z*45},26),up(pa(.3),42),up(pa(.62),40),up({x:g.x-hd.x*55,z:g.z-hd.z*55},24),up({x:g.x-hd.x*24+T.left.x*14,z:g.z-hd.z*24+T.left.z*14},9)];
 const look=[up(pa(.25),0),up(pa(.55),0),up(g,0),up(g,0),up(g,0)];return{p:new THREE.CatmullRomCurve3(pos),l:new THREE.CatmullRomCurve3(look),dur:7.5};}
function nextTurn(){const live=players.map((p,i)=>i).filter(i=>!players[i].done);if(!live.length)return holeEnd();
 const tee=honors.filter(i=>!players[i].done&&players[i].str===0);let n=tee.length?tee[0]:live.sort((a,b)=>dPin(players[b])-dPin(players[a]))[0];cur=n;beginTurn();}
const dPin=p=>hyp(p.pos.x-T.pin.x,p.pos.z-T.pin.z);
function beginTurn(){const p=P();phase='aim';pt=0;meter=null;anim=null;camView=0;p.plan=null;p.lie=T.surf(p.pos.x,p.pos.z);
 p.aim.club=clubFor(T,p.pos,p.lie);if(p.lie!=='green'&&p.aim.club===PUTTER)p.aim.club=12;p.aim.shape=0;p.aim.spin=0;autoAim(p);
 players.forEach(q=>q.golfer.visible(q===p));p.golfer.setClub(p.aim.club);placeGolfer();p.bm.visible=true;previewDirty=true;tracer.visible=false;
 if(p.human)toastMsg(`${p.name} · ${shotName(p)}`);snd.play('tick');}
function shotName(p){const n=p.str+1;return p.lie==='green'?'PUTT '+(p.putts+1):n===1?'TEE SHOT':'SHOT '+n;}
function autoAim(p){const c=p.aim.club,d=dPin(p),reach=c===PUTTER?1e9:carryOf(c)*LIES[p.lie].pw*1.1;
 if(d<=reach){p.aim.yaw=Math.atan2(T.pin.x-p.pos.x,T.pin.z-p.pos.z);}else{const pr=T.proj(p.pos.x,p.pos.z);let best=null;for(let s=pr.s;s<T.S;s+=4){const q=T.ptAt(s,0),dd=hyp(q.x-p.pos.x,q.z-p.pos.z);if(dd>=reach*.92){best=q;break;}}if(!best)best=T.pin;p.aim.yaw=Math.atan2(best.x-p.pos.x,best.z-p.pos.z);}
 if(c===PUTTER)p.aim.range=puttRange(d);}
const puttRange=d=>{const ft=d/FT*1.25;return([10,20,30,45,60,90,120].find(r=>r>=ft)||150)*FT;};
function placeGolfer(){const p=P();p.golfer.place(p.pos.x,p.pos.y,p.pos.z,p.aim.yaw);}
/* ================= shots ================= */
function addAmp(p){return p.lie==='green'?0:1;}
function takeShot(pw,err){const p=P(),a=p.aim,putt=a.club===PUTTER;let e=err+(putt?0:(rnd()-.5)*LIES[p.lie].err*.8);if(pw>1&&!putt)e+=(rnd()-.5)*(pw-1)*7;
 const b=newBall(p.pos.x,p.pos.y,p.pos.z);const yaw=putt?a.yaw+e*.035:a.yaw;launch(b,{club:a.club,pw:putt?cl(pw,0,1.1):pw,range:a.range,yaw,shape:a.shape,err:putt?0:cl(e,-1.4,1.4),lie:p.lie,spin:a.spin});
 const pred=simulate(b,T,wind,16,true);fl={b,t:0,from:{...p.pos},pred:pred.b,predLand:pred.b.land||pred.b.p,club:a.club,lie:p.lie,putt,str:p.str,lastIn:{...p.pos},cam:0,camP:null};
 p.str++;if(putt)p.putts++;trail=[];tracer.visible=!putt&&hyp(pred.b.p.x-p.pos.x,pred.b.p.z-p.pos.z)>45;trMat.uniforms.fade.value=1;phase='flight';pt=0;
 const c=a.club;snd.play('whoosh',putt?.3:1);snd.play(putt?'putt':p.lie==='sand'?'sandshot':c<=3?'driver':c>=9?'wedge':'iron');
 const dir={x:Math.sin(a.yaw),z:Math.cos(a.yaw)};if(!putt){if(p.lie==='sand')parts.burst(p.pos.x,p.pos.y+.05,p.pos.z,60,3.2,PC.sand,1.2,1,dir);else if(p.lie!=='tee')parts.burst(p.pos.x,p.pos.y+.03,p.pos.z,26,2.6,p.lie==='deep'?PC.deep:PC.turf,1,1,dir);}}
function finishShot(ev){const p=P(),b=fl.b,D=T.def;let msg='',big=null;const yds=Math.round(hyp(b.p.x-fl.from.x,b.p.z-fl.from.z)/YD);
 if(ev==='holed'){p.done=true;p.scores[hi]=p.str;p.pos={x:T.pin.x,y:T.h(T.pin.x,T.pin.z),z:T.pin.z};p.bm.visible=false;const d=p.str-D.par;big=[p.str===1?'HOLE IN ONE!':scoreName(d),`${p.name} · ${p.str} ${p.str===1?'STROKE':'STROKES'}`,d<0?'#ffd23f':'#ffffff'];snd.play('cup');snd.play(d<0?'cheer':'clap',d<-1?1.4:1);
  if(fl.putt)p.st.putts++;if(p.str===1&&D.par>3){p.st.firN++;}}
 else if(ev==='water'||ev==='ob'){p.str++;p.st.pen++;const e=b.land||fl.lastIn,dp=dropSpot(T,ev==='ob'?fl.lastIn:e,fl.from);p.pos={x:dp.x,y:T.h(dp.x,dp.z),z:dp.z};
  big=[ev==='water'?'WATER HAZARD':'OUT OF BOUNDS','+1 PENALTY · DROP','#7fd0ff'];snd.play('groan');if(fl.str===0&&D.par>3)p.st.firN++;}
 else{p.pos={x:b.p.x,y:b.p.y,z:b.p.z};const lie=T.surf(b.p.x,b.p.z);p.lie=lie;
  if(fl.putt){const ft=Math.round(dPin(p)/FT);msg=ft<=1?'TAP-IN LEFT':`${ft} FT LEFT`;if(fl.lie==='green')p.st.putts++;}
  else{msg=`${CLUBS[fl.club].n} · ${yds} YDS · ${LIES[lie].n}`;if(fl.str===0&&D.par>3){p.st.firN++;if(lie==='fairway')p.st.fir++;if(lie!=='deep'&&lie!=='sand')p.st.drive=Math.max(p.st.drive,yds);}}}
 if(!p.reachedGreen&&(p.done||T.surf(p.pos.x,p.pos.z)==='green')){p.reachedGreen=true;p.st.girN++;if(p.str<=D.par-2)p.st.gir++;}
 if(!p.done&&p.str>=D.par+3){p.done=true;p.scores[hi]=D.par+3;p.bm.visible=false;big=big||['PICKED UP',`${p.name} · MAX ${D.par+3}`,'#ffffff'];}
 if(!p.done){p.golfer.visible(false);}
 if(!p.reachedGreen)p.st.girN+=0;
 if(big)banner(...big);else if(msg&&(p.human||!fl.putt))toastMsg(`${p.name} · ${msg}`);
 phase='settle';pt=0;}
const scoreName=d=>d<=-3?'ALBATROSS!':d===-2?'EAGLE!':d===-1?'BIRDIE!':d===0?'PAR':d===1?'BOGEY':d===2?'DOUBLE BOGEY':'+'+d;
function timeout(p){p.out=true;p.done=true;p.scores[hi]=Math.max(p.str+2,T.def.par+2);p.bm.visible=false;p.golfer.visible(false);banner("TIME'S UP",`${p.name} · REMAINING HOLES PAR +2`,'#ff6a5a');snd.play('groan');phase='settle';pt=0;meter=null;anim=null;}
function holeEnd(){phase='holeEnd';pt=0;cardT=0;players.forEach(p=>{if(p.scores[hi]==null)p.scores[hi]=p.str;});
 // honors: best score on this hole tees off first next time
 honors=players.map((_,i)=>i).sort((a,b)=>(players[a].scores[hi]-players[b].scores[hi])||(honors.indexOf(a)-honors.indexOf(b)));
 showCard(`HOLE ${hi+1} <em>COMPLETE</em>`);if(!players.some(p=>p.human&&!p.out))endEarly();}
function endEarly(){// every human is out of time: CPUs finish on paper
 for(let h=hi+1;h<holes.length;h++)players.forEach(p=>{const par=HOLES[holes[h]].par;if(p.out||p.human)p.scores[h]=par+2;else{const D=DIFF[p.dk||opt.diff];p.scores[h]=Math.max(2,par+Math.round((rnd()-.5)*2+[1.1,.35,-.1][opt.diff]));}});hi=holes.length-1;}
function nextHole(){$('card').hidden=true;hi++;if(hi>=holes.length)return endRound();startHole();}
/* ================= results ================= */
const tot=p=>p.scores.reduce((a,b)=>a+(b||0),0),parTo=k=>holes.slice(0,k).reduce((a,h)=>a+HOLES[h].par,0),toPar=p=>{const n=p.scores.filter(x=>x!=null).length;return tot(p)-parTo(n);};
const fmtTP=v=>v===0?'E':v>0?'+'+v:''+v;
function scoreTable(){const n=holes.length;let h='<table class="sc"><tr><th>HOLE</th>'+holes.map((_,i)=>`<th>${i+1}</th>`).join('')+'<th>TOT</th><th>±</th></tr>';
 h+='<tr class="par"><td>PAR</td>'+holes.map(i=>`<td>${HOLES[i].par}</td>`).join('')+`<td>${parTo(n)}</td><td></td></tr>`;
 for(const p of players){h+=`<tr><td><b style="color:${p.look.c}">●</b> ${p.name}${p.out?' ⏱':''}</td>`+holes.map((hh,i)=>{const s=p.scores[i];if(s==null)return'<td>·</td>';const d=s-HOLES[hh].par;return`<td><span class="${d<=-2?'e':d===-1?'b':d===1?'o':d>=2?'d':''}">${s}</span></td>`;}).join('')+`<td class="tot">${tot(p)}</td><td>${fmtTP(toPar(p))}</td></tr>`;}
 return h+'</table>';}
function showCard(title){$('card').innerHTML=`<h2>${title}</h2>${scoreTable()}<p class="eye" style="margin:10px 0 0">${phase==='holeEnd'?'SPACE · CLICK · A TO CONTINUE':'TAB TO CLOSE'}</p>`;$('card').hidden=false;}
function endRound(){app='over';phase='over';$('hud').hidden=true;$('card').hidden=true;document.body.classList.remove('playing');players.forEach(p=>{p.golfer.visible(false);p.bm.visible=false;});
 const rank=players.slice().sort((a,b)=>tot(a)-tot(b)),w=rank[0],me=players[0],par=parTo(holes.length);
 const won=w===me||tot(me)===tot(w);const two=players.filter(p=>p.human).length>1;
 $('oeye').textContent=`${COURSE} · ${holes.length===9?'9 HOLES':'QUICK 3'} · ${opt.cpu?'CPU '+DIFF[opt.diff].n:'STROKE PLAY'}`;
 $('ores').textContent=players.length===1?(toPar(me)<0?'UNDER PAR':toPar(me)===0?'LEVEL PAR':'ROUND COMPLETE'):two&&!opt.cpu?w.name+' WINS':won?'CHAMPION':'ROUND COMPLETE';
 $('olb').innerHTML=rank.map((p,i)=>`<div class="${i===0?'w':''}"><span>${i===0?'WINNER':'#'+(i+1)}</span><b style="color:${p.look.c}">${p.name}</b><i>${tot(p)} · ${fmtTP(toPar(p))}</i></div>`).join('');
 $('osc').innerHTML=scoreTable();
 const bird=me.scores.filter((s,i)=>s!=null&&s<HOLES[holes[i]].par).length,eag=me.scores.filter((s,i)=>s!=null&&s<=HOLES[holes[i]].par-2).length,pars=me.scores.filter((s,i)=>s===HOLES[holes[i]].par).length;
 $('ostat').innerHTML=[['SCORE',`${tot(me)} (${fmtTP(toPar(me))})`],['BIRDIES+',bird],['PARS',pars],['FAIRWAYS',`${me.st.fir}/${me.st.firN}`],['GREENS IN REG',`${me.st.gir}/${holes.length}`],['PUTTS',me.st.putts],['LONGEST DRIVE',me.st.drive?me.st.drive+' YDS':'—'],['PENALTIES',me.st.pen]].map(([a,b])=>`<div>${a}<b>${b}</b></div>`).join('');
 const pts=Math.max(0,Math.round((900+(par-tot(me))*120+bird*60+eag*180+(won&&opt.cpu?220*(opt.diff+1):0)+(me.out?-300:0))*(holes.length===9?1:.4)));
 const tok=6+Math.min(60,pts/40|0);addRound(tok,won&&(opt.cpu>0||players.length>1));saveBest(ID,pts);
 let bk='pxd_fairway_best_'+(holes.length===9?'9':'3'),bt=null;try{bt=localStorage.getItem(bk);bt=bt==null?null:+bt;if(!me.out&&(bt==null||toPar(me)<bt)){localStorage.setItem(bk,toPar(me));bt=toPar(me);}}catch(e){}
 lastAward={pts,won,tp:toPar(me),strokes:tot(me),mode:holes.length===9?'9 holes':'quick 3',diff:DIFF[opt.diff].n.toLowerCase(),cpu:opt.cpu,hum:opt.hum,bird};
 $('otok').textContent=`+${tok} TOKENS · ${pts} PTS · BEST ${bestScore(ID)} PTS${bt!=null?' · BEST ROUND '+fmtTP(bt):''}`;$('over').hidden=false;menuBest();}
function toMenu(){app='menu';phase='menu';players.forEach(p=>{p.golfer.dispose();scene.remove(p.bm);});players=[];for(const id of['over','pause','hud','card'])$(id).hidden=true;$('menu').hidden=false;$('keys').hidden=false;document.body.classList.remove('playing');
 loadHole(3,.5);wind={mph:9,dir:0,x:2,z:1};attractT=0;tracer.visible=false;dots.count=0;landRing.visible=restRing.visible=false;if(grid)grid.g.visible=false;menuBest();}
function menuBest(){let b9=null;try{b9=localStorage.getItem('pxd_fairway_best_9');}catch(e){}$('mbest').textContent=`BEST ${bestScore(ID)} PTS`+(b9!=null?` · BEST 9 ${fmtTP(+b9)}`:'');}
function pause(on){if(on&&app==='play'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='play';$('pause').hidden=true;document.body.classList.add('playing');}}
/* ================= input ================= */
const I=controls(Rd.domElement,{canLock:()=>false,menu:()=>false,look:()=>!!(meter&&meter.mode==='tempo'),onKey:e=>{
 if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&app==='play')e.preventDefault();
 if(e.code==='Escape'){if(app==='play')pause(true);else if(app==='paused')pause(false);}
 if(e.code==='KeyM'){snd.on=!snd.on;toastMsg(snd.on?'SOUND ON':'SOUND OFF');}},onKeyUp:e=>{if(e.code==='Tab'&&app==='play'&&phase!=='holeEnd')$('card').hidden=true;}});
const {keys,edge,mouse}=I;
// touch: a drag on the canvas is a tempo swing (pull down, push up); a tap advances
{let tx=0,ty=0;const cv=Rd.domElement,o={passive:false};cv.addEventListener('touchstart',e=>{const t=e.touches[0];tx=t.clientX;ty=t.clientY;mouse.l=mouse.le=true;e.preventDefault();},o);
 cv.addEventListener('touchmove',e=>{const t=e.touches[0];if(meter&&meter.mode==='tempo'){mouse.dx+=t.clientX-tx;mouse.dy+=t.clientY-ty;}tx=t.clientX;ty=t.clientY;e.preventDefault();},o);
 cv.addEventListener('touchend',()=>{mouse.l=false;});}let padPrev=[];
function pad(){const g=gamepads()[0];if(!g)return null;const b=g.buttons.map(x=>!!(x&&x.pressed)),e=b.map((v,i)=>v&&!padPrev[i]);padPrev=b;return{ax:g.axes,b,e,lt:g.buttons[6]?g.buttons[6].value:0,rt:g.buttons[7]?g.buttons[7].value:0};}
function anyAdvance(gp){return edge.Space||edge.Enter||mouse.le||(gp&&gp.e[0]);}
/* ================= step ================= */
let previewDirty=true,gridOff=false;
function step(dt){dt=Math.min(dt,.1);const gp=pad();
 if(gp&&gp.e[9]){if(app==='play')pause(true);else if(app==='paused')pause(false);}
 if(app==='paused'){I.flush();mouse.le=mouse.re=false;visuals(0);return;}
 const ff=(keys.KeyF||(gp&&gp.b[1]))&&app==='play';timeScale=ff&&(phase==='flight'||phase==='settle'||phase==='flyover'||(P()&&!P().human))?3.5:1;const sdt=dt*timeScale;
 snd.tick(dt);
 if(app==='play'){roundT+=dt;
  if(edge.Tab||(gp&&gp.e[8])){if($('card').hidden)showCard(`${COURSE} <em>SCORECARD</em>`);else if(phase!=='holeEnd')$('card').hidden=true;}
  if(phase==='flyover'){pt+=sdt;if(anyAdvance(gp)||pt>flyC.dur){$('fly').hidden=true;nextTurn();}}
  else if(phase==='aim'||phase==='swing')turn(dt,gp);
  else if(phase==='anim')animStep(sdt);
  else if(phase==='flight')flightStep(sdt);
  else if(phase==='settle'){pt+=sdt;if(pt>1.7||(pt>.5&&anyAdvance(gp)))nextTurn();}
  else if(phase==='holeEnd'){pt+=dt;if(pt>5.5||(pt>.6&&anyAdvance(gp)))nextHole();}}
 else if(app==='menu'||app==='over')attractT+=dt;
 I.flush();mouse.le=mouse.re=false;visuals(dt);}
function turn(dt,gp){const p=P(),a=p.aim;pt+=dt;
 if(p.human&&!autoHum){p.clock-=dt;if(p.clock<=0){p.clock=0;return timeout(p);}}
 if(!p.human||autoHum)return cpuTurn(dt);
 const putt=a.club===PUTTER,ax=gp?deadzone(gp.ax[0]||0,.2):0;
 if(phase==='aim'){
  const turnR=(putt?.1:.32)*(keys.ShiftLeft||keys.ShiftRight?.25:1);let r=0;if(keys.KeyA||keys.ArrowLeft)r+=1;if(keys.KeyD||keys.ArrowRight)r-=1;r-=ax;if(r){a.yaw+=r*turnR*dt;previewDirty=true;placeGolfer();}
  let dc=0;if(edge.KeyW||edge.ArrowUp||(gp&&gp.e[12]))dc=-1;if(edge.KeyS||edge.ArrowDown||(gp&&gp.e[13]))dc=1;if(dc)setClub(p,cl(a.club+dc,p.lie==='tee'?0:1,PUTTER));
  if(edge.KeyQ||(gp&&gp.e[4])){a.shape=Math.max(-1,a.shape-.5);previewDirty=true;snd.play('ui');}if(edge.KeyE||(gp&&gp.e[5])){a.shape=Math.min(1,a.shape+.5);previewDirty=true;snd.play('ui');}
  if(edge.KeyZ||(gp&&gp.lt>.6&&!p.ltH)){a.spin=Math.max(-1,a.spin-1);previewDirty=true;snd.play('ui');}if(edge.KeyX||(gp&&gp.rt>.6&&!p.rtH)){a.spin=Math.min(1,a.spin+1);previewDirty=true;snd.play('ui');}if(gp){p.ltH=gp.lt>.6;p.rtH=gp.rt>.6;}
  if(edge.KeyV||(gp&&gp.e[3]))camView=camView===1?0:1;if(edge.KeyC||(gp&&gp.e[2]))camView=camView===2?0:2;
  if(edge.Space||(gp&&gp.e[0])){meter={mode:'meter',st:1,pos:0,power:0};phase='swing';snd.play('set');}
  else if(mouse.le){meter={mode:'tempo',y:0,max:0,fx:0,ft:0,st:1,pos:0,power:0};mouse.dx=mouse.dy=0;phase='swing';}
  else if(gp&&(gp.ax[3]||0)>.4){meter={mode:'tempo',pad:true,y:0,max:0,fx:0,ft:0,st:1,pos:0,power:0};phase='swing';}
  if(phase==='swing')camView=0;}
 else if(phase==='swing'){const m=meter;const press=edge.Space||(gp&&gp.e[0]);
  if(m.mode==='meter'){if(m.st===1){m.pos+=dt/(putt?1.25:1.05);if(press&&m.pos>.03){m.power=m.pos;m.st=2;snd.play('set');}else if(m.pos>=1.12){m.power=1.12;m.st=2;}}
   else{m.pos-=dt*1.55;if(press){m.acc=m.pos;return release(m.power,accErr(m.acc));}if(m.pos<-.2)return release(m.power,1.15);}}
  else{// tempo: pull back, push through
   let dy,dx;if(m.pad){const sy=gp?(gp.ax[3]||0):0,sx=gp?(gp.ax[2]||0):0;dy=sy*230-m.y;dx=sx*6;}else{dy=mouse.dy;dx=mouse.dx;mouse.dx=mouse.dy=0;}m.y+=dy;
   if(m.st===1){m.max=Math.max(m.max,m.y);m.pos=cl(m.max/230,0,1.12);m.power=m.pos;if(m.max>30&&m.max-m.y>14){m.st=2;m.fx=0;m.ft=0;}
    if(!m.pad&&!mouse.l&&m.st===1){meter=null;phase='aim';return;}if(m.pad&&m.max<40&&(gp?(gp.ax[3]||0):0)<.2){meter=null;phase='aim';return;}}
   else{m.fx+=dx;m.ft+=dt;m.pos=cl(m.y/230,-.2,1.12);const done=m.y<=-12||(!m.pad&&!mouse.l)||m.ft>1.4;
    if(done){let pw=m.power;if(m.ft>.75)pw*=.93;const e=cl(m.fx/(40+m.max*.35),-1.3,1.3);return release(pw,Math.abs(e)<.08?0:e);}}}
  // backswing follows the meter
  const s=swingAt('back',1,topFor(a.club,m.st===1?m.pos:m.power),putt);p.golfer.pose(s[0],s[1]);}}
const accErr=acc=>Math.abs(acc)<.032?0:cl(-acc/.15,-1.3,1.3);
function topFor(c,pw){return c===PUTTER?.08+.32*cl(pw,0,1.1):(c<=3?2.25:2.05)*(.45+.55*cl(pw,0,1.1));}
function release(pw,err){const p=P();meter=null;anim={st:'down',t:0,top:topFor(p.aim.club,pw),pw,err,fired:false};phase='anim';}
function setClub(p,c){if(c===p.aim.club)return;p.aim.club=c;p.golfer.setClub(c);if(c===PUTTER)p.aim.range=puttRange(dPin(p));autoAimKeep(p);placeGolfer();previewDirty=true;snd.play('ui');}
function autoAimKeep(p){/* keep the player's aim; only snap if aiming far off the hole */}
function cpuTurn(dt){const p=P(),a=p.aim;
 if(!p.plan&&pt>.25){const pl=plan(T,p.pos,p.lie,wind);p.plan=pl;p.exec=execute(pl,p.human?2:opt.diff);a.club=pl.club;a.range=pl.range;a.shape=pl.shape||0;p.golfer.setClub(a.club);p.aimFrom=a.yaw;p.aimT=0;}
 if(p.plan){p.aimT+=dt;const k=cl(p.aimT/.7,0,1);a.yaw=p.aimFrom+(p.exec.yaw-p.aimFrom)*k*k*(3-2*k);placeGolfer();previewDirty=true;
  if(pt>DIFF[opt.diff].think+.9){anim={st:'back',t:0,top:topFor(a.club,p.exec.pw),pw:p.exec.pw,err:p.exec.err,fired:false,cpu:true};a.yaw=p.exec.yaw;phase='anim';}}}
function animStep(dt){const p=P(),A=anim,putt=p.aim.club===PUTTER;A.t+=dt;
 if(A.st==='back'){const d=putt?.7:.85,s=swingAt('back',cl(A.t/d,0,1),A.top,putt);p.golfer.pose(s[0],s[1]);if(A.t>=d+.08){A.st='down';A.t=0;}}
 else if(A.st==='down'){const d=putt?.42:.3,k=cl(A.t/d,0,1),s=swingAt('down',k,A.top,putt);p.golfer.pose(s[0],s[1]);
  if(!A.fired&&s[0]>=0){A.fired=true;if(A.cpu)takeCpuShot(A);else takeShot(A.pw,A.err);anim=A;phase='flight';A.st='fin';A.t=0;}}}
function takeCpuShot(A){const p=P(),e=p.exec;const b=newBall(p.pos.x,p.pos.y,p.pos.z);
 // CPU shot uses the planned launch but goes through takeShot for effects / bookkeeping
 const keep={...p.aim};p.aim.club=e.club;p.aim.yaw=e.yaw;p.aim.range=e.range;p.aim.shape=e.shape||0;p.aim.spin=0;takeShot(e.pw,e.err);void b;void keep;}
function flightStep(dt){const p=P(),b=fl.b;fl.t+=dt;pt+=dt;
 if(anim&&anim.st==='fin'){anim.t+=dt;const s=swingAt('fin',0,anim.top,p.aim.club===PUTTER);const k=cl(anim.t/.35,0,1);const prev=swingAt('down',1,anim.top,p.aim.club===PUTTER);p.golfer.pose(prev[0]+(s[0]-prev[0])*k,prev[1]+(s[1]-prev[1])*k);}
 const wasAir=b.st==='air';if(T.inb(b.p.x,b.p.z))fl.lastIn={x:b.p.x,y:b.p.y,z:b.p.z};
 const ev=phStep(b,T,wind,dt);if(wasAir||b.st==='air'){trail.push(b.p.x,b.p.y,b.p.z);if(trail.length>TRN*3)trail.splice(0,3);}
 if(ev){const lie=T.surf(b.p.x,b.p.z);if(ev==='land'||ev==='bounce'){const v=hyp(b.v.x,b.v.y,b.v.z);if(lie==='sand'){snd.play('landsand',cl(v/10,.3,1));parts.burst(b.p.x,b.p.y,b.p.z,ev==='land'?30:8,2,PC.sand,.9);}else{snd.play('land',cl(v/14,.2,1));if(ev==='land')parts.burst(b.p.x,b.p.y,b.p.z,10,1.4,lie==='deep'?PC.deep:PC.turf,.6);}}
  else if(ev==='water'){snd.play('splash');parts.burst(b.p.x,b.p.y,b.p.z,70,4.5,PC.water,1.2,1.4);}
  else if(ev==='tree')snd.play('tree');else if(ev==='pin')snd.play('pin');else if(ev==='lip')snd.play('lip');}
 if(['rest','holed','water','ob'].includes(b.st)){if(fl.t<.2&&b.st==='rest'&&!fl.putt){}finishShot(b.st);}
 else if(fl.t>40){b.st='rest';finishShot('rest');}}
/* ================= preview: arc / landing / putt line ================= */
const tm=new THREE.Matrix4(),tq=new THREE.Quaternion(),tv=new V(),tv2=new V(),UP=new V(0,1,0);
function preview(){dots.count=0;landRing.visible=restRing.visible=false;const p=P();if(!p||!p.human)return;const a=p.aim,putt=a.club===PUTTER;
 if(previewDirty){previewDirty=false;const b=newBall(p.pos.x,p.pos.y,p.pos.z);
  if(putt){const d=dPin(p);launch(b,{club:PUTTER,pw:d/a.range*1.0,range:a.range,yaw:a.yaw,lie:p.lie});const pts=[];let tt=0;const bb=JSON.parse(JSON.stringify(b));while(tt<12&&bb.st==='roll'){phStep(bb,T,wind,1/30);tt+=1/30;pts.push(bb.p.x,bb.p.y,bb.p.z);}p.prev={pts,putt:true,end:bb.p};}
  else{launch(b,{club:a.club,pw:1,yaw:a.yaw,shape:a.shape,err:0,lie:p.lie,spin:a.spin});const r=simulate(b,T,wind,16,true);p.prev={pts:r.path,land:r.b.land,end:r.b.p,st:r.b.st};}}
 const pv=p.prev;if(!pv)return;const pts=pv.pts,n=pts.length/3;if(!n)return;
 if(pv.putt){const show=opt.assist?Math.floor(n*.45):Math.min(n,8);let k=0;for(let i=0;i<show&&k<NDOT;i+=Math.max(1,Math.floor(show/NDOT))){const s=.035;tm.compose(tv.set(pts[i*3],pts[i*3+1]+.03,pts[i*3+2]),tq.identity(),tv2.set(s,s,s));dots.setMatrixAt(k++,tm);}dots.count=k;}
 else{const step=Math.max(1,Math.floor(n/NDOT));let k=0;const cd=cam.position;for(let i=Math.max(2,Math.floor(n*.06));i<n&&k<NDOT;i+=step){const x=pts[i*3],y=pts[i*3+1],z=pts[i*3+2],s=.06+hyp(x-cd.x,y-cd.y,z-cd.z)*.0042;tm.compose(tv.set(x,y,z),tq.identity(),tv2.set(s,s,s));dots.setMatrixAt(k++,tm);}dots.count=k;
  if(pv.land){placeDecal(landRing,pv.land.x,pv.land.z,Math.max(2,hyp(pv.land.x-p.pos.x,pv.land.z-p.pos.z)*.035));}if(pv.end&&opt.assist&&pv.st==='rest')placeDecal(restRing,pv.end.x,pv.end.z,1.2);}
 dots.instanceMatrix.needsUpdate=true;}
function placeDecal(m,x,z,s){const n=T.n(x,z,{x:0,y:1,z:0});m.position.set(x,T.h(x,z)+.04,z);m.quaternion.setFromUnitVectors(new V(0,0,1),tv.set(n.x,n.y,n.z));m.scale.setScalar(s);m.visible=true;}
/* ================= putting grid ================= */
function buildGrid(){if(grid){scene.remove(grid.g);grid.lines.geometry.dispose();grid.arrows.geometry.dispose();}const g=new THREE.Group();g.visible=false;scene.add(g);
 const sp=1,pos=[],col=[],pts=[];const R=Math.max(T.gr.rx,T.gr.rz)+5,c=new THREE.Color();const N={x:0,y:1,z:0};
 const inG=(x,z)=>T.field(x,z,1)>-2.2;
 const colr=(x,z)=>{T.n(x,z,N);const s=Math.hypot(N.x,N.z)/N.y*100;c.setHSL(cl(.58-s*.13,0,.6),.95,.55);return c;};
 for(let gx=-R;gx<=R;gx+=sp)for(let gz=-R;gz<=R;gz+=sp){const x=T.gc.x+gx,z=T.gc.z+gz;if(!inG(x,z))continue;
  for(const[dx,dz]of[[sp,0],[0,sp]]){const x2=x+dx,z2=z+dz;if(!inG(x2,z2))continue;const segs=4;for(let k=0;k<segs;k++){const a=k/segs,b=(k+1)/segs;const xa=x+dx*a,za=z+dz*a,xb=x+dx*b,zb=z+dz*b;pos.push(xa,T.h(xa,za)+.02,za,xb,T.h(xb,zb)+.02,zb);const ca=colr(xa,za);col.push(ca.r,ca.g,ca.b);const cb=colr(xb,zb);col.push(cb.r,cb.g,cb.b);}}
  if(((gx/sp)|0)%2===0&&((gz/sp)|0)%2===0&&T.field(x,z,1)>-1){T.n(x,z,N);pts.push({x,z,nx:N.x,nz:N.z,s:Math.hypot(N.x,N.z)/N.y});}}
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 const lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.5,depthWrite:false}));lines.renderOrder=4;g.add(lines);
 const ag=new THREE.ConeGeometry(.06,.26,3);ag.rotateX(Math.PI/2);ag.scale(1,.25,1);const arrows=new THREE.InstancedMesh(ag,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}),Math.max(1,pts.length));arrows.renderOrder=5;arrows.frustumCulled=false;
 pts.forEach((q,i)=>{c.setHSL(cl(.58-q.s*100*.13,0,.6),.8,.78);arrows.setColorAt(i,c);});arrows.count=pts.length;g.add(arrows);grid={g,lines,arrows,pts};}
function gridUpdate(t){if(!grid||!grid.g.visible)return;const q=new THREE.Quaternion();grid.pts.forEach((p,i)=>{const L=Math.hypot(p.nx,p.nz)||1e-6,dx=p.nx/L,dz=p.nz/L,f=((t*(.25+p.s*12)+i*.37)%1)*.9-.45,x=p.x+dx*f,z=p.z+dz*f;
  q.setFromAxisAngle(UP,Math.atan2(dx,dz));const s=p.s<.004?.4:.7+Math.min(1.5,p.s*40);tm.compose(tv.set(x,T.h(x,z)+.05,z),q,tv2.set(s,1,s));grid.arrows.setMatrixAt(i,tm);});grid.arrows.instanceMatrix.needsUpdate=true;}
/* ================= cameras ================= */
const CM={p:new V(0,30,-30),l:new V(),fov:50,snap:true};let orbA=0;
function camTarget(dt){const tp=new V(),tl=new V();let fov=48,rate=3;const p=P();
 if(app==='menu'||app==='over'||!T){orbA+=dt*.035;const g=T.gc,r=150;tp.set(g.x+Math.sin(orbA+2.3)*r,T.h(g.x,g.z)+38,g.z+Math.cos(orbA+2.3)*r);tl.set(g.x-T.hd.x*40,T.h(g.x,g.z)+2,g.z-T.hd.z*40);fov=46;rate=99;}
 else if(phase==='flyover'&&flyC){const k=cl(pt/flyC.dur,0,1),e=k*k*(3-2*k);flyC.p.getPoint(e,tp);flyC.l.getPoint(e,tl);fov=50;rate=99;}
 else if(phase==='holeEnd'){orbA+=dt*.12;const g=T.pin,gy=T.h(g.x,g.z);tp.set(g.x+Math.sin(orbA)*16,gy+6,g.z+Math.cos(orbA)*16);tl.set(g.x,gy+.8,g.z);fov=50;rate=2;}
 else if(p&&(phase==='aim'||phase==='swing'||phase==='anim'||(phase==='flight'&&fl&&fl.t<.25)||(phase==='settle'&&!fl))){const a=p.aim,putt=a.club===PUTTER,dx=Math.sin(a.yaw),dz=Math.cos(a.yaw),b=p.pos;
  if(camView===1&&!putt&&p.prev&&p.prev.land){const L=p.prev.land,ly=T.h(L.x,L.z);tp.set(L.x-dx*30-dz*12,ly+26,L.z-dz*30+dx*12);tl.set(L.x,ly,L.z);fov=44;}
  else if(camView===2){const g=T.gc,gy=T.h(g.x,g.z);tp.set(g.x-dx*10,gy+Math.max(T.gr.rx,T.gr.rz)*2.1,g.z-dz*10);tl.set(g.x,gy,g.z);fov=50;}
  else if(putt){const d=Math.min(dPin(p),25);tp.set(b.x-dx*4.4+dz*.75,b.y+1.6+d*.03,b.z-dz*4.4-dx*.75);tl.set(b.x+dx*Math.max(3,d*.6),b.y,b.z+dz*Math.max(3,d*.6));fov=50;}
  else{tp.set(b.x-dx*5.6-dz*.4,b.y+2.1,b.z-dz*5.6+dx*.4);const ld=p.prev&&p.prev.land?Math.min(80,hyp(p.prev.land.x-b.x,p.prev.land.z-b.z)*.4):50;tl.set(b.x+dx*ld,b.y+2.2,b.z+dz*ld);fov=52;}
  rate=camView?2.5:5;}
 else if(phase==='flight'||phase==='settle'){const b=fl.b,bp=b.p,dx=Math.sin(P().aim.yaw),dz=Math.cos(P().aim.yaw);
  if(fl.putt||hyp(fl.predLand.x-fl.from.x,fl.predLand.z-fl.from.z)<45){tp.set(bp.x-dx*4.5,bp.y+2.2,bp.z-dz*4.5);tl.set(bp.x+dx*2,bp.y,bp.z+dz*2);fov=48;rate=2.2;
   if(fl.putt){const mx=(fl.from.x+T.pin.x)/2,mz=(fl.from.z+T.pin.z)/2,d=hyp(T.pin.x-fl.from.x,T.pin.z-fl.from.z);tp.set(fl.from.x-dx*3,fl.from.y+1.4+d*.08,fl.from.z-dz*3);tl.set(mx*.4+bp.x*.6,bp.y,mz*.4+bp.z*.6);fov=50;}}
  else{const down=b.st!=='air'||(b.v.y<0&&fl.t>1.2)||fl.t>2.6;
   if(!down){const vx=b.v.x,vz=b.v.z,l=hyp(vx,vz)||1;tp.set(bp.x-vx/l*15,bp.y+3.5,bp.z-vz/l*15);tl.set(bp.x+vx/l*10,bp.y,bp.z+vz/l*10);fov=46;rate=3.2;}
   else{if(!fl.camP){const L=fl.predLand,ly=T.h(L.x,L.z),sx=-dz,sz=dx;let best=null;for(const sd of[1,-1])for(const bk of[38,26]){const c={x:L.x+dx*bk+sx*sd*10,z:L.z+dz*bk+sz*sd*10};const sc=T.field(c.x,c.z,3)+(T.h(c.x,c.z)<.5?-50:0)+rnd();if(!best||sc>best.sc)best={...c,sc};}
     fl.camP=new V(best.x,Math.max(T.h(best.x,best.z),ly)+10,best.z);CM.snap=true;}
    tp.copy(fl.camP);tl.set(bp.x,bp.y+.5,bp.z);const d=tp.distanceTo(tl);fov=cl(Math.atan(14/d)*2*180/Math.PI,14,46);rate=6;}}}
 return{tp,tl,fov,rate};}
function cameraUpdate(dt){const{tp,tl,fov,rate}=camTarget(dt);if(CM.snap||rate>=99){CM.p.copy(tp);CM.l.copy(tl);CM.snap=false;}else{const k=1-Math.exp(-dt*rate);CM.p.lerp(tp,k);CM.l.lerp(tl,1-Math.exp(-dt*rate*1.6));}
 if(T){const gh=T.h(CM.p.x,CM.p.z)+.6;if(CM.p.y<gh)CM.p.y=gh;}CM.fov+=(fov-CM.fov)*Math.min(1,dt*4);cam.fov=CM.fov;cam.position.copy(CM.p);cam.lookAt(CM.l);}
/* ================= visuals ================= */
let lastPhase='';
function visuals(dt){if(phase!==lastPhase){if((lastPhase==='flight'&&phase==='settle')||phase==='aim'||phase==='holeEnd'||phase==='flyover')CM.snap=phase==='aim'||phase==='flyover';lastPhase=phase;}
 cameraUpdate(dt);if(W){W.update(dt,cam.position);const f=app==='play'&&P()?P().pos:{x:CM.l.x,y:CM.l.y,z:CM.l.z};const fp=phase==='flight'&&fl?fl.b.p:f;W.focus(tv.set((fp.x+cam.position.x)/2,fp.y,(fp.z+cam.position.z)/2));}
 // balls
 const cp=cam.position;for(const p of players){if(!p.bm.visible)continue;const fly=phase==='flight'&&fl&&p===P();const bp=fly?fl.b.p:p.pos;p.bm.position.set(bp.x,bp.y+BR,bp.z);const d=cp.distanceTo(p.bm.position);p.bm.scale.setScalar(Math.max(1,d*.003/BR));}
 const fb=phase==='flight'&&fl?fl.b:null;shadowBlob.visible=!!fb&&fb.st==='air';if(shadowBlob.visible){const gy=T.h(fb.p.x,fb.p.z),hgt=fb.p.y-gy;shadowBlob.position.set(fb.p.x,gy+.05,fb.p.z);shadowBlob.scale.setScalar(.3+hgt*.03);shadowBlob.material.opacity=cl(1-hgt/40,.15,1);}
 // tracer ribbon
 const n=trail.length/3;if(tracer.visible&&n>1){const w0=cp;for(let i=0;i<TRN;i++){const j=Math.min(i,n-1)*3,j2=Math.min(Math.max(1,i),n-1)*3;const x=trail[j],y=trail[j+1],z=trail[j+2];const tx=x-trail[j2-3],ty=y-trail[j2-2],tz=z-trail[j2-1];
   const vx=x-w0.x,vy=y-w0.y,vz=z-w0.z,d=Math.hypot(vx,vy,vz);let sx=ty*vz-tz*vy,sy=tz*vx-tx*vz,sz=tx*vy-ty*vx;const sl=Math.hypot(sx,sy,sz)||1,w=d*.0018+.004;sx*=w/sl;sy*=w/sl;sz*=w/sl;
   trPos[i*6]=x+sx;trPos[i*6+1]=y+sy;trPos[i*6+2]=z+sz;trPos[i*6+3]=x-sx;trPos[i*6+4]=y-sy;trPos[i*6+5]=z-sz;const al=i<n?Math.min(1,.15+i/n):0;trA[i*2]=trA[i*2+1]=al;}
  trGeo.attributes.position.needsUpdate=trGeo.attributes.a.needsUpdate=true;}
 if(phase==='settle'||phase==='aim')trMat.uniforms.fade.value=Math.max(0,trMat.uniforms.fade.value-dt*.4);
 // putting grid on the human's putts
 const p=P();const showGrid=!gridOff&&app==="play"&&p&&p.human&&(phase==='aim'||phase==='swing')&&(p.aim.club===PUTTER||camView===2)&&T.field(p.pos.x,p.pos.z,1)>-12;if(grid){grid.g.visible=!!showGrid;if(showGrid)gridUpdate(performance.now()/1000);}
 if(!(app==='play'&&p&&p.human&&(phase==='aim'||phase==='swing'))){dots.count=0;landRing.visible=restRing.visible=false;}else preview();
 parts.update(dt);hud(dt);}
/* ================= HUD ================= */
let hudCache={},banT=0;
function setT(id,v){if(hudCache[id]!==v){hudCache[id]=v;$(id).textContent=v;}}
function setH(id,v){if(hudCache['h'+id]!==v){hudCache['h'+id]=v;$(id).innerHTML=v;}}
function banner(t,s,col){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s;$('banner').classList.add('on');banT=2.6;}
function toastMsg(h){toast($('toast'),h,2600,3);}
const fmtClock=s=>{s=Math.max(0,Math.ceil(s));return String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(app!=='play'||!T)return;const D=T.def,p=P();
 setT('hno',String(hi+1));setT('hname',D.n);setT('hpar',`PAR ${D.par} · ${T.yards} YDS · ${hi+1}/${holes.length}`);
 setH('board',players.map((q,i)=>{const v=q.scores.slice(0,hi).reduce((a,b)=>a+b,0)+(q.done?q.scores[hi]||0:0)-parTo(hi+(q.done?1:0));
  return`<div class="${i===cur&&phase!=='holeEnd'?'cur':''} ${q.done?'done':''}"><i style="background:${q.look.c}"></i><b>${q.name}</b><em>${q.out?'⏱ OUT':q.done?'IN '+q.scores[hi]:'SHOT '+(q.str+1)}</em><u class="${v<0?'un':v>0?'ov':''}">${fmtTP(v)}</u></div>`;}).join(''));
 setT('wmph',String(wind.mph));drawWind();
 const hp=players.find(q=>q===p&&q.human)||players.find(q=>q.human&&!q.out)||players[0];setT('clk',fmtClock(hp.clock));$('clock').classList.toggle('low',hp.clock<60&&!hp.out);
 const live=p&&(phase==='aim'||phase==='swing'||phase==='anim'||phase==='flight'||phase==='settle');$('pl').style.opacity=live?1:0;$('clubs').style.opacity=live&&p.human&&(phase==='aim'||phase==='swing')?1:0;$('meter').style.opacity=live&&p.human&&(phase==='aim'||phase==='swing'||phase==='anim')?1:0;
 if(p){setT('pname',p.name);$('pdot').style.background=p.look.c;const v=p.scores.slice(0,hi).reduce((a,b)=>a+b,0)-parTo(hi);setT('ptp',fmtTP(v));setT('pshot',String(p.str+1));
  const d=dPin(p);setT('pdist',p.lie==='green'||d<30?Math.round(d/FT)+' FT':Math.round(d/YD)+' YDS');setT('plie',`${LIES[p.lie].n}${LIES[p.lie].pw<1&&p.lie!=='green'?' '+Math.round(LIES[p.lie].pw*100)+'%':''}`);
  const dh=(T.h(T.pin.x,T.pin.z)-p.pos.y)/FT;setT('pelev',Math.abs(dh)<1.5?'LEVEL WITH THE PIN':`${dh>0?'▲ UPHILL':'▼ DOWNHILL'} ${Math.abs(Math.round(dh))} FT`);
  const a=p.aim,c=CLUBS[a.club];setT('cname',c.n);setT('ccarry',a.club===PUTTER?`${Math.round(a.range/FT)} FT MAX`:`${Math.round(carryOf(a.club)*LIES[p.lie].pw/YD)} YDS CARRY`);
  setT('sh',a.shape<0?(a.shape<-.6?'◀◀ BIG DRAW':'◀ DRAW'):a.shape>0?(a.shape>.6?'BIG FADE ▶▶':'FADE ▶'):'STRAIGHT');setT('sp','SPIN · '+['LOW','MID','HIGH'][a.spin+1]);
  let help='';if(phase==='flyover')help='';else if(p.human&&phase==='aim')help=(players.filter(q=>q.human).length>1?p.name+' · ':'')+'A/D AIM · W/S CLUB · Q/E SHAPE · SPACE OR DRAG TO SWING · V/C CAMS';
  else if(phase==='swing')help=meter&&meter.mode==='tempo'?'PULL BACK · PUSH THROUGH STRAIGHT':meter&&meter.st===1?'SPACE TO SET POWER':'SPACE ON THE NOTCH';else if(!p.human&&(phase==='aim'||phase==='anim'||phase==='flight'))help='HOLD F TO FAST-FORWARD';
  setT('help',help);}
 drawMeter();drawMap();labels();}
function drawWind(){const c=$('wc'),x=c.getContext('2d'),w=120;x.clearRect(0,0,w,w);x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=3;x.beginPath();x.arc(60,60,52,0,7);x.stroke();
 const cy=Math.atan2(CM.l.x-CM.p.x,CM.l.z-CM.p.z),a=wind.dir-cy;x.save();x.translate(60,60);x.rotate(-a+Math.PI);const k=cl(wind.mph/20,.3,1);x.fillStyle=wind.mph>14?'#ff7a5a':wind.mph>8?'#ffc93c':'#7fe0a0';
 x.beginPath();x.moveTo(0,-44);x.lineTo(20,-8);x.lineTo(7,-10);x.lineTo(7,38*k);x.lineTo(-7,38*k);x.lineTo(-7,-10);x.lineTo(-20,-8);x.closePath();x.fill();x.restore();}
const mctx=$('meter').getContext('2d');
function drawMeter(){const x=mctx,w=520,h=92,p=P();x.clearRect(0,0,w,h);if(!p||!p.human)return;const putt=p.aim.club===PUTTER;const x0=70,x1=430,xo=470,y=34,bh=26,px=v=>x0+v*(x1-x0);
 x.fillStyle='rgba(10,18,24,.78)';rr(x,8,8,w-16,h-16,14);x.fill();
 const g=x.createLinearGradient(x0,0,x1,0);g.addColorStop(0,'#3fd17a');g.addColorStop(.7,'#ffc93c');g.addColorStop(1,'#ff6a3a');x.fillStyle='rgba(255,255,255,.08)';rr(x,px(-.2),y,xo-px(-.2),bh,8);x.fill();
 const m=meter;const pw=m?(m.st===1?m.pos:m.power):0;if(pw>0){x.fillStyle=g;rr(x,x0,y+3,Math.max(2,px(Math.min(pw,1.12))-x0),bh-6,6);x.fill();}
 x.fillStyle='rgba(255,90,60,.35)';x.fillRect(x1,y,xo-x1,bh);x.fillStyle='#fff';x.fillRect(x1-1,y-6,2,bh+12);
 for(let i=1;i<4;i++){x.fillStyle='rgba(255,255,255,.3)';x.fillRect(px(i/4)-1,y+bh-7,2,7);}
 x.fillStyle='#fff';x.fillRect(x0-6,y-8,12,bh+16);x.fillStyle='rgba(10,18,24,1)';x.fillRect(x0-2,y-3,4,bh+6);
 x.font='700 11px JetBrains Mono, monospace';x.textAlign='center';x.fillStyle='#c8d0d8';const full=putt?Math.round(p.aim.range/FT)+' FT':Math.round(carryOf(p.aim.club)*LIES[p.lie].pw/YD)+' Y';x.fillText(full,x1,y-10);x.fillText(putt?'0':'IMPACT',x0,y+bh+18);
 if(m&&m.mode==='meter'){const mx=px(m.pos);x.fillStyle='#fff';x.beginPath();x.moveTo(mx,y-4);x.lineTo(mx-7,y-14);x.lineTo(mx+7,y-14);x.fill();x.fillRect(mx-1.5,y-4,3,bh+8);}
 if(pw>0){x.fillStyle='#ffc93c';x.textAlign='left';const est=putt?Math.round(pw*p.aim.range/FT)+' FT':Math.round(carryOf(p.aim.club,Math.min(pw,1.12))*LIES[p.lie].pw/YD)+' Y';x.fillText(est,Math.min(px(pw)+8,w-60),y+bh+18);}
 if(putt){const d=Math.round(dPin(p)/FT);x.fillStyle='rgba(255,201,60,.9)';x.fillRect(px(d/(p.aim.range/FT))-1,y-4,2,bh+8);}
 else{x.fillStyle='rgba(255,255,255,.55)';const d=dPin(p)/(carryOf(p.aim.club)*LIES[p.lie].pw);if(d<1.12){x.fillRect(px(d)-1,y-4,2,bh+8);x.textAlign='center';x.fillText('PIN',px(d),y+bh+18);}}
 x.textAlign='left';x.fillStyle='#8a939c';x.font='700 10px JetBrains Mono, monospace';x.fillText(m&&m.mode==='tempo'?'TEMPO':'METER',20,24);}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
// mini-map: hole drawn tee-at-bottom from the same fields the physics reads
let mapImg=null,mapX=null;
function buildMap(){const w=150,h=330,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),id=x.createImageData(w,h);
 const along0=-30,along1=T.S+40,scale=(h-20)/(along1-along0),wd=(w-10)/scale/2;mapX={along0,scale,w,h};
 const col={green:[70,170,70],fringe:[60,145,60],fairway:[85,160,60],tee:[95,170,70],rough:[45,100,40],deep:[150,140,85],sand:[230,212,160],water:[50,130,190],ob:[30,40,50]};
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const al=along0+(h-10-j)/scale,ac=(i-w/2)/scale,X=T.tee.x+T.hd.x*al+T.left.x*ac,Z=T.tee.z+T.hd.z*al+T.left.z*ac;let k;
   if(!T.inb(X,Z))k='ob';else{const y=T.h(X,Z);if(y<.05&&T.sea)k='water';else if(T.field(X,Z,1)>0)k='green';else if(T.field(X,Z,1)>-1.6)k='fringe';else if(T.field(X,Z,2)>0)k=y<1.8?'sand':'sand';else if(T.field(X,Z,0)>0)k='fairway';else if(T.field(X,Z,3)>0)k='rough';else k='deep';
    if(k!=='water'&&T.water.length&&T.wet(X,Z,y))k='water';}
   const cc=col[k],o=(j*w+i)*4;id.data[o]=cc[0];id.data[o+1]=cc[1];id.data[o+2]=cc[2];id.data[o+3]=230;}
 x.putImageData(id,0,0);for(const t of T.trees){const m=toMap(t.x,t.z);x.fillStyle='rgba(20,50,25,.85)';x.beginPath();x.arc(m[0],m[1],2.2*t.s,0,7);x.fill();}mapImg=c;void wd;}
function toMap(X,Z){const dx=X-T.tee.x,dz=Z-T.tee.z,al=dx*T.hd.x+dz*T.hd.z,ac=dx*T.left.x+dz*T.left.z;return[mapX.w/2+ac*mapX.scale,mapX.h-10-(al-mapX.along0)*mapX.scale];}
const mapCtx=$('map').getContext('2d');
function drawMap(){const x=mapCtx;x.clearRect(0,0,150,330);if(!mapImg)return;x.drawImage(mapImg,0,0);const p=P();
 const pin=toMap(T.pin.x,T.pin.z);x.fillStyle='#ffd21f';x.fillRect(pin[0]-1,pin[1]-9,2,9);x.beginPath();x.moveTo(pin[0]+1,pin[1]-9);x.lineTo(pin[0]+7,pin[1]-6.5);x.lineTo(pin[0]+1,pin[1]-4);x.fill();
 if(p&&p.human&&(phase==='aim'||phase==='swing')&&p.prev&&p.prev.land){const a=toMap(p.pos.x,p.pos.z),b=toMap(p.prev.land.x,p.prev.land.z);x.strokeStyle='rgba(255,255,255,.85)';x.setLineDash([3,3]);x.lineWidth=1.5;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();x.setLineDash([]);x.beginPath();x.arc(b[0],b[1],4,0,7);x.stroke();}
 if(phase==='flight'&&fl){const t=fl.b.p,m=toMap(t.x,t.z);x.fillStyle='#ff6a3a';x.beginPath();x.arc(m[0],m[1],3,0,7);x.fill();}
 for(const q of players){if(q.done)continue;const m=toMap(q.pos.x,q.pos.z);x.fillStyle=q.look.c;x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.arc(m[0],m[1],q===p?4.5:3.2,0,7);x.fill();x.stroke();}}
const lbPool=[];function labels(){const host=$('labels'),Wd=innerWidth,Hd=innerHeight;let k=0;const p=P();
 const put=(x,y,z,txt,cls)=>{tv.set(x,y,z).project(cam);if(tv.z>1||Math.abs(tv.x)>1.1||Math.abs(tv.y)>1.1)return;let el=lbPool[k];if(!el){el=document.createElement('div');el.innerHTML='<div></div>';host.appendChild(el);lbPool.push(el);}el.style.display='';el.className='lb '+cls;
  el.style.transform=`translate(${((tv.x*.5+.5)*Wd).toFixed(1)}px,${((-tv.y*.5+.5)*Hd).toFixed(1)}px)`;if(el.dataset.t!==txt){el.dataset.t=txt;el.firstChild.textContent=txt;}k++;};
 if(app==='play'&&(phase==='aim'||phase==='swing'||phase==='flight')&&p){const d=dPin(p);if(d>12||phase==='flight'){const py=T.h(T.pin.x,T.pin.z)+2.6;put(T.pin.x,py,T.pin.z,phase==='flight'?'PIN':`PIN · ${d<30?Math.round(d/FT)+' FT':Math.round(d/YD)+' Y'}`,'pin');}
  if(p.human&&p.prev&&p.prev.land&&(phase==='aim'||phase==='swing')&&!camView){const L=p.prev.land;put(L.x,T.h(L.x,L.z)+.5,L.z,Math.round(hyp(L.x-p.pos.x,L.z-p.pos.z)/YD)+' Y','land');}
  for(const q of players){if(q===p||q.done||q.str===0)continue;put(q.pos.x,q.pos.y+.4,q.pos.z,q.name.split(' ')[0],'');}}
 for(let i=k;i<lbPool.length;i++)lbPool[i].style.display='none';}
/* ================= rendering ================= */
function render(){const w=innerWidth,h=innerHeight;if(Rd.domElement.width!==Math.floor(w*Rd.getPixelRatio())||Rd.domElement.height!==Math.floor(h*Rd.getPixelRatio())){Rd.setSize(w,h,false);fxp&&(fxp.w=0);}
 cam.aspect=w/h;cam.updateProjectionMatrix();if(!fxp){fxp=cinematic(Rd,scene,cam,{...POST,ao:gfx>=2,quality:gfx});fxp.w=0;}if(fxp.w!==w*9999+h){fxp.w=w*9999+h;fxp.setSize(w,h);}fxp.render();}
addEventListener('resize',()=>{fxp&&(fxp.w=0);});
/* ================= menu ================= */
const pick=pickers(opt,saveOpt),seg=(id,key)=>pick(id,key,true,()=>{snd.init();snd.play('ui');menuVis();});
function menuVis(){if(opt.hum+opt.cpu>4){opt.cpu=4-opt.hum;pick.sync();saveOpt();}document.querySelectorAll('#o-cpu button').forEach(b=>b.disabled=+b.dataset.v>4-opt.hum);}
seg('o-mode','mode');seg('o-hum','hum');seg('o-cpu','cpu');seg('o-diff','diff');seg('o-clock','clock');seg('o-assist','assist');menuVis();
$('go').onclick=()=>startRound();$('again').onclick=()=>startRound();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('cprev').onclick=()=>{const p=P();if(p&&p.human&&phase==='aim')setClub(p,Math.max(p.lie==='tee'?0:1,p.aim.club-1));};$('cnext').onclick=()=>{const p=P();if(p&&p.human&&phase==='aim')setClub(p,Math.min(PUTTER,p.aim.club+1));};
postButton($('post'),ID,()=>{const a=lastAward||{};return[a.pts||0,`Game: FAIRWAY LEGENDS\nPoints: ${a.pts||0}\nRound: ${a.strokes||0} strokes (${fmtTP(a.tp||0)}) · ${a.mode||''} at ${COURSE}\nBirdies or better: ${a.bird||0}\nField: ${a.hum||1} golfer(s) + ${a.cpu||0} CPU ${a.diff||''}`];});
/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
/* ================= test hooks ================= */
window.FAIRWAY={start:startRound,step,render,toMenu,pause,setQuality:applyQuality,
 get state(){return app==='play'?phase:app;},get app(){return app;},get phase(){return phase;},get players(){return players;},get cur(){return cur;},get player(){return P();},get hole(){return hi;},get holes(){return holes;},get T(){return T;},get wind(){return wind;},get flight(){return fl;},
 get score(){const p=players[0];return p?{strokes:tot(p),toPar:toPar(p)}:null;},get award(){return lastAward;},auto(on=true){autoHum=on;},
 hit(pw=1,err=0){if(phase==='aim'&&P().human){release(pw,err);return true;}return false;},skip(){edge.Space=true;},setClock(s){players.forEach(p=>{if(p.human)p.clock=s;});},
 cam:()=>cam,info:()=>({...Rd.info.render,geos:Rd.info.memory.geometries,tex:Rd.info.memory.textures}),aim(yaw){P().aim.yaw=yaw;previewDirty=true;placeGolfer();},goto(h){hi=h;startHole();},place(x,z){const p=P()||players[0];cur=players.indexOf(p);p.pos={x,y:T.h(x,z),z};p.str=Math.max(1,p.str);beginTurn();},dots(v){dots.visible=v;if(grid)grid.g.visible=v;gridOff=!v;landRing.material.opacity=restRing.material.opacity=v?1:0;},club(c){setClub(P(),c);},view(v){camView=v;}};
