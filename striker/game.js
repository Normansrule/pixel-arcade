// STRIKER 11 — full 3D association football. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {P,R,predict,setWet} from './physics.js';
import {CLUBS,FORM_NAMES,DIFF,crest} from './data.js';
import {Squad,animate,act,NP,X,Y,Z,VIS} from './rig.js';
import {buildWorld,makeEnv,ctex} from './world.js';
import {flareTex} from './tex.js';
import {ShaderPass} from '../vendor/jsm/postprocessing/ShaderPass.js';
import {S,setupMatch,fixed,afterGoal,minute,clockText,setCtl,skipBreak,beginSP,foul,fwdOf,shoot,humanPass,toPlay,substitute,tiredest} from './match.js';
import {active} from './ai.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepads,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,hyp=Math.hypot;
const DT=1/60;
/* ================= renderer ================= */
const Rd=new THREE.WebGLRenderer({canvas:$('c'),powerPreference:'high-performance'});Rd.setPixelRatio(Math.min(devicePixelRatio,1.5));Rd.shadowMap.enabled=true;Rd.shadowMap.type=THREE.PCFSoftShadowMap;
// load time: skip the synchronous compile-status query after every shader link (it stalls on software GL); errors still surface in the console
Rd.debug.checkShaderErrors=false;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(26,16/9,.5,6000);
const squadM=new Squad(scene,26,quality()),snd=new Sound();const hiddenPose=new Float32Array(NP);
const envs={};const env=n=>envs[n]||(envs[n]=makeEnv(Rd,n));
let world=null,gfx=quality(),fxp=null;
/* ball + markers + particles */
const ballMesh=(()=>{const t=ctex(512,256,(x,w,h)=>{x.fillStyle='#f6f6f2';x.fillRect(0,0,w,h);x.lineCap='round';
  for(let i=0;i<4;i++){x.strokeStyle=i%2?'#14182a':'#ff4d00';x.lineWidth=18;x.beginPath();for(let u=0;u<=w;u+=8){const y=h*(.18+i*.22)+Math.sin(u/w*Math.PI*4+i*1.7)*h*.08;u?x.lineTo(u,y):x.moveTo(u,y);}x.stroke();}
  x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;for(let i=0;i<10;i++){x.beginPath();x.moveTo(i*w/10,0);x.lineTo(i*w/10+30,h);x.stroke();}});
 const m=new THREE.Mesh(new THREE.SphereGeometry(R,28,18),new THREE.MeshStandardMaterial({map:t,roughness:.42,metalness:0,envMapIntensity:.8}));m.castShadow=true;m.scale.setScalar(1.35);scene.add(m);return m;})();
const ringTex=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=10;x.beginPath();x.arc(64,64,52,0,7);x.stroke();x.fillStyle='#fff';x.beginPath();x.moveTo(64,4);x.lineTo(54,22);x.lineTo(74,22);x.fill();},{clamp:true});
const mkRing=(col,s)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:ringTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.renderOrder=5;m.visible=false;scene.add(m);return m;};
const rings=[mkRing(new THREE.Color(2.2,.8,.15),1.7),mkRing(new THREE.Color(.3,1.6,2.2),1.7)];const landRing=mkRing(new THREE.Color(1.4,1.4,1.4),1.1);const aimRing=mkRing(new THREE.Color(2,1.2,.3),1.6);
const arrows=[0,1].map(i=>{const m=new THREE.Mesh(new THREE.ConeGeometry(.16,.34,4).rotateX(Math.PI),new THREE.MeshBasicMaterial({color:i?new THREE.Color(.3,1.6,2.2):new THREE.Color(2.4,.9,.15)}));m.visible=false;scene.add(m);return m;});
const aimArrow=(()=>{const s=new THREE.Shape();s.moveTo(-.12,0);s.lineTo(.12,0);s.lineTo(.12,2.4);s.lineTo(.42,2.4);s.lineTo(0,3.2);s.lineTo(-.42,2.4);s.lineTo(-.12,2.4);s.closePath();const g=new THREE.ShapeGeometry(s);g.rotateX(Math.PI/2);
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1,.2),transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}));m.visible=false;scene.add(m);return m;})();
const penMark=(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(.2,.3,24),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1,.2),side:THREE.DoubleSide,transparent:true,depthWrite:false}));m.visible=false;scene.add(m);return m;})();
const cardMesh=new THREE.Mesh(new THREE.PlaneGeometry(.09,.13),new THREE.MeshBasicMaterial({color:0xffd400,side:THREE.DoubleSide}));cardMesh.visible=false;scene.add(cardMesh);
const flagMeshes=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.32,.24),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,.3,.1),side:THREE.DoubleSide}));m.geometry.translate(.16,0,0);scene.add(m);return m;});
const dotTex=ctex(32,32,(x)=>{const r=x.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.55,'rgba(255,255,255,.85)');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,32,32);},{clamp:true});
class Parts{constructor(n=1600){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.l=new Float32Array(n);this.i=0;const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));this.g=g;
  this.m=new THREE.Points(g,new THREE.PointsMaterial({size:.16,vertexColors:true,transparent:true,depthWrite:false,map:dotTex,alphaTest:.05}));this.m.frustumCulled=false;scene.add(this.m);}
 emit(x,y,z,vx,vy,vz,col,life){const i=this.i;this.i=(i+1)%this.n;this.p.set([x,y,z],i*3);this.v.set([vx,vy,vz],i*3);this.c.set([col.r,col.g,col.b],i*3);this.l[i]=life;}
 burst(x,y,z,n,sp,cols,life,up=1){for(let k=0;k<n;k++){const a=rnd()*6.283,s=sp*(.3+rnd()*.7);this.emit(x,y,z,Math.cos(a)*s,(.5+rnd())*sp*up,Math.sin(a)*s,cols[rnd()*cols.length|0],life*(.6+rnd()*.6));}}
 update(dt){for(let i=0;i<this.n;i++){if(this.l[i]<=0){if(this.p[i*3+1]>-50)this.p[i*3+1]=-99;continue;}this.l[i]-=dt;const j=i*3;this.v[j+1]-=9*dt;this.v[j]*=.985;this.v[j+2]*=.985;this.p[j]+=this.v[j]*dt;this.p[j+1]+=this.v[j+1]*dt;this.p[j+2]+=this.v[j+2]*dt;if(this.p[j+1]<.02){this.p[j+1]=.02;this.v[j]*=.5;this.v[j+2]*=.5;this.v[j+1]=0;}}
  this.g.attributes.position.needsUpdate=this.g.attributes.color.needsUpdate=true;}}
const parts=new Parts(2400);const confetti=new Parts(1800);confetti.m.material.size=.13;
const GRASS=[new THREE.Color(.25,.45,.18),new THREE.Color(.33,.52,.22),new THREE.Color(.42,.35,.2)];
/* ================= options ================= */
let opt={mode:0,humans:1,club:11,opp:0,size:11,form:'4-4-2',diff:1,half:180,offside:1,night:1,wx:0};const saveOpt=stored('pxd_striker_opt',opt);
let intro=null,shake=0,curRain=false,app='menu',attract=true,cup=null,league=null,comp=null,l3T=0,l3Q=[],acc=0,timeScale=1,camMode=1,lastAward=null,overT=0,replay=null,rec=[],recT=0,goalIdx=0,hype=0,flash=0;
/* ================= world + post ================= */
// night MEDIUM+: players throw their four floodlight shadows (rig.js), so the key light casts none and every lit shader
// compiles without shadow-map code: faster load and frames. Day, and LOW at night, use the key light's shadow map.
function applyQuality(q){gfx=q;Rd.setPixelRatio(Math.min(devicePixelRatio,q===0?1:1.5));if(world&&world.key){world.key.castShadow=!(opt.night&&q>=1);const s=q===2?4096:q===1?2048:1024;if(world.key.shadow.mapSize.x!==s){world.key.shadow.mapSize.set(s,s);if(world.key.shadow.map){world.key.shadow.map.dispose();world.key.shadow.map=null;}}}fxp=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function post(){const n=opt.night;return n?{exposure:1.02,bloom:.55,bloomThreshold:.9,bloomRadius:.5,vignette:.3,saturation:1.1,grain:.02,ao:gfx>=2,aoStrength:.55}:{exposure:.92,bloom:.22,bloomThreshold:.97,bloomRadius:.4,vignette:.26,saturation:1.08,grain:.015,ao:gfx>=2,aoStrength:.65};}
function rebuildWorld(){if(world)world.dispose();world=buildWorld(scene,{night:!!opt.night,rain:curRain,q:gfx,crowd:[.36,.7,.92][gfx],kits:[S.teams[0].kit,S.teams[1].kit],names:S.teams.map(t=>t.club.n.split(' ')[0])});scene.environment=env(!!opt.night);
 scene.fog=opt.night?new THREE.FogExp2(0x1a1c26,.0021):new THREE.FogExp2(0xc2ccd6,.0017);/* floodlit / afternoon haze: depth between pitch, stands and city */applyQuality(gfx);drawScreen(true);}
/* ================= matches ================= */
function assignLooks(){for(let i=0;i<26;i++){const e=S.ents[i];if(e)squadM.setLook(i,e.look);else squadM.pose(i,hiddenPose);}}
function begin(home,away,o){setupMatch({home,away,humans:o.humans,size:o.size,form:[o.form,o.form2],diff:o.diff,per:o.per,offside:o.offside,cup:o.cup,attract:o.attract,boost:o.boost});
 curRain=!!o.rain;setWet(curRain);rebuildWorld();assignLooks();if(snd.ac)snd.rain(!!o.rain);rec=[];replay=null;hype=0;$('feed').innerHTML='';hudCache={};drawCrests();}
function attractMatch(){const a=rnd()*16|0;let b=rnd()*16|0;if(b===a)b=(a+5)%16;begin(a,b,{humans:0,size:11,form:FORM_NAMES[rnd()*3|0],form2:FORM_NAMES[rnd()*3|0],diff:[DIFF[2],DIFF[2]],per:9999,offside:1,attract:true,boost:[0,0]});}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);saveOpt();snd.init();snd.play('ui',1);
 if(opt.mode===1&&!o._cup){cup=newCup(opt.club);showCup();return;}
 if(opt.mode===2&&!o._lg){league=loadLeague();if(!league||league.club!==opt.club||league.done)league=newLeague(opt.club);showLeague();return;}
 const cupM=opt.mode===1,lgM=opt.mode===2&&!!league;comp=cupM?'CUP · '+RN[cup.round]:lgM?`LEAGUE · MATCHDAY ${league.md+1} OF ${league.fx.length}`:opt.humans===2?'LOCAL DERBY':'FRIENDLY';
 const away=cupM?cupOpponent():lgM?leagueOpponent():opt.opp===opt.club?(opt.club+1)%16:opt.opp;const hum=cupM||lgM?1:opt.humans;
 const cpu=DIFF[opt.diff],mate={...DIFF[1]};
 begin(opt.club,away,{rain:!!opt.wx,humans:hum,size:opt.size,form:opt.form,form2:hum===2?opt.form:FORM_NAMES[rnd()*3|0],diff:[mate,hum===2?mate:cpu],per:opt.half,offside:!!opt.offside,cup:cupM,boost:[0,hum===2?0:cpu.r]});
 attract=false;app='match';timeScale=1;intro={t:0,dur:6.4,said:false};$('bars').classList.add('on');
 for(const id of['menu','keys','over','pause','cupv','lgv'])$(id).hidden=true;$('hud').hidden=false;$('comp').textContent=comp;l3Q=[];l3T=0;$('l3').classList.remove('on');document.body.classList.add('playing');}
function toMenu(){app='menu';attract=true;cup=null;attractMatch();for(const id of['over','pause','cupv','lgv','hud','ht'])$(id).hidden=true;$('menu').hidden=false;$('keys').hidden=false;$('bars').classList.remove('on');document.body.classList.remove('playing');}
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');}}
/* ================= cup ================= */
const RN=['QUARTER-FINAL','SEMI-FINAL','FINAL'];
function newCup(club){const pool=[...Array(16).keys()].filter(i=>i!==club).sort(()=>rnd()-.5).slice(0,7);const t=[club,...pool].sort(()=>rnd()-.5);return{teams:t,round:0,res:[[],[],[]],alive:true,champion:-1,club,played:false};}
const roundTeams=r=>r===0?cup.teams:cup.res[r-1].map(x=>x.w);
function cupOpponent(){const t=roundTeams(cup.round),i=t.indexOf(cup.club);return t[i^1];}
function simGame(a,b){const ra=CLUBS[a].r,rb=CLUBS[b].r;const pois=l=>{let k=0,p=Math.exp(-l),s=p;const u=rnd();while(u>s&&k<9){k++;p*=l/k;s+=p;}return k;};
 const ga=pois(1.35+(ra-rb)*.05),gb=pois(1.35+(rb-ra)*.05);if(ga!==gb)return{a,b,ga,gb,w:ga>gb?a:b};const pa=3+rnd()*3|0,pb=pa+(rnd()<.5?1:-1)*(1+rnd()*2|0);return{a,b,ga,gb,pa:Math.max(pa,pb>pa?pa:pa),pb:Math.max(0,pb),w:pb>pa?b:a};}
function cupRecord(){const t=roundTeams(cup.round),i=t.indexOf(cup.club),opp=t[i^1];const so=S.shoot;const won=S.winner===0;
 const r={a:cup.club,b:opp,ga:S.score[0],gb:S.score[1],w:won?cup.club:opp};if(so){r.pa=so.kicks[0].filter(x=>x).length;r.pb=so.kicks[1].filter(x=>x).length;}
 for(let k=0;k<t.length;k+=2){const a=t[k],b=t[k+1];if(a===cup.club||b===cup.club){const rr=a===cup.club?r:{a:b,b:a,ga:r.gb,gb:r.ga,pa:r.pb,pb:r.pa,w:r.w};rr.a=a;rr.b=b;if(a!==cup.club){rr.ga=r.gb;rr.gb=r.ga;rr.pa=r.pb;rr.pb=r.pa;}cup.res[cup.round][k/2]=rr;}else cup.res[cup.round][k/2]=simGame(a,b);}
 if(!won)cup.alive=false;else if(cup.round===2)cup.champion=cup.club;cup.played=true;}
function cupContinue(){if(!cup)return toMenu();if(cup.played){cup.played=false;if(cup.alive&&cup.champion<0)cup.round++;}showCup();}
const crestURL={};function crestImg(ci,s=40){const k=ci+'_'+s;if(!crestURL[k]){const c=document.createElement('canvas');c.width=c.height=s*2;crest(c.getContext('2d'),ci,s*2);crestURL[k]=c.toDataURL();}return`<img src="${crestURL[k]}" width="${s}" height="${s}" alt="">`;}
function showCup(){app='cup';for(const id of['menu','keys','over','pause','hud','lgv'])$(id).hidden=true;$('cupv').hidden=false;document.body.classList.remove('playing');
 const done=!cup.alive||cup.champion>=0;$('cuph').innerHTML=cup.champion>=0?'CHAMP<br>IONS<em>.</em>':!cup.alive?'KNOCKED<br>OUT<em>.</em>':RN[cup.round].replace('-','<br>')+'<em>.</em>';
 let h='';for(let r=0;r<3;r++){const t=roundTeams(r)||[];h+=`<div class="rd"><p>${RN[r]}</p>`;const n=[4,2,1][r];for(let k=0;k<n;k++){const a=t[k*2],b=t[k*2+1],res=cup.res[r][k];
   const row=(ci,g,pg,w)=>ci==null?`<div class="tm tbd">—</div>`:`<div class="tm${ci===cup.club?' me':''}${res&&res.w!==ci?' out':''}">${crestImg(ci,22)}<b>${CLUBS[ci].s}</b><i>${res?g+(res.pa!=null?` <small>(${pg})</small>`:''):''}</i></div>`;
   h+=`<div class="mt">${row(a,res&&res.ga,res&&res.pa)}${row(b,res&&res.gb,res&&res.pb)}</div>`;}h+='</div>';}
 h+=`<div class="rd ch"><p>WINNER</p><div class="mt">${cup.champion>=0?`<div class="tm me">${crestImg(cup.champion,30)}<b>${CLUBS[cup.champion].s}</b></div>`:cup.res[2][0]?`<div class="tm">${crestImg(cup.res[2][0].w,30)}<b>${CLUBS[cup.res[2][0].w].s}</b></div>`:'<div class="tm tbd">?</div>'}</div></div>`;
 $('bracket').innerHTML=h;
 if(cup.champion>=0){$('cupmsg').textContent=`${CLUBS[cup.club].n} lift the cup. Legendary.`;confettiBurst(2);}else if(!cup.alive){$('cupmsg').textContent=`${CLUBS[cup.club].n} are out in the ${RN[cup.round].toLowerCase()}.`;}
 else{const o=cupOpponent();$('cupmsg').innerHTML=`Next: <b>${CLUBS[cup.club].n}</b> vs <b>${CLUBS[o].n}</b> · ${CLUBS[o].r} OVR. Knockout: draws go to extra time and penalties.`;}
 $('cupgo').textContent=done?'NEW CUP':'PLAY '+RN[cup.round];$('cupgo').onclick=()=>{if(done){cup=newCup(opt.club);showCup();}else start({_cup:true});};}
/* ================= league: six clubs, single round robin (five matchdays), saved between visits ================= */
const LGK='pxd_striker_league';
function newLeague(club){const pool=[...Array(16).keys()].filter(i=>i!==club).sort(()=>rnd()-.5).slice(0,5);const t=[club,...pool];
 // circle method: fix t[0], rotate the rest
 const fx=[];let r=t.slice(1);for(let d=0;d<5;d++){const all=[t[0],...r],m=[];for(let i=0;i<3;i++)m.push(d%2&&i===0?[all[5-i],all[i]]:[all[i],all[5-i]]);fx.push(m);r=[r[4],...r.slice(0,4)];}
 const tb={};t.forEach(c=>tb[c]={p:0,w:0,d:0,l:0,gf:0,ga:0});return saveLeague({club,teams:t,fx,md:0,tb,res:[],done:false,played:false});}
function saveLeague(l){try{localStorage.setItem(LGK,JSON.stringify(l));}catch(e){}return l;}
function loadLeague(){try{const l=JSON.parse(localStorage.getItem(LGK)||'null');return l&&l.fx&&l.tb?l:null;}catch(e){return null;}}
function leagueOpponent(){const m=league.fx[league.md].find(x=>x.includes(league.club));return m[0]===league.club?m[1]:m[0];}
const pts=r=>r.w*3+r.d;
function standings(){return league.teams.slice().sort((a,b)=>{const A=league.tb[a],B=league.tb[b];return pts(B)-pts(A)||(B.gf-B.ga)-(A.gf-A.ga)||B.gf-A.gf||CLUBS[b].r-CLUBS[a].r;});}
function leagueRecord(){const md=league.md,res=[];const put=(a,b,ga,gb)=>{const A=league.tb[a],B=league.tb[b];A.p++;B.p++;A.gf+=ga;A.ga+=gb;B.gf+=gb;B.ga+=ga;if(ga>gb){A.w++;B.l++;}else if(gb>ga){B.w++;A.l++;}else{A.d++;B.d++;}res.push({a,b,ga,gb});};
 for(const[a,b]of league.fx[md]){if(a===league.club||b===league.club){const o=a===league.club?b:a;const g=[S.score[0],S.score[1]];if(a===league.club)put(a,o,g[0],g[1]);else put(o,a,g[1],g[0]);}
  else{const r=simGame(a,b);put(a,b,r.ga,r.gb);}}
 league.res[md]=res;league.md++;league.played=true;if(league.md>=league.fx.length)league.done=true;saveLeague(league);}
function leaguePos(){return standings().indexOf(league.club)+1;}
const ORD=n=>n+(n===1?'ST':n===2?'ND':n===3?'RD':'TH');
function showLeague(){app='league';for(const id of['menu','keys','over','pause','hud','cupv'])$(id).hidden=true;$('lgv').hidden=false;document.body.classList.remove('playing');
 const L=league,pos=leaguePos(),done=L.done;$('lgeye').textContent=`STRIKER 11 · LEAGUE · ${CLUBS[L.club].n.toUpperCase()}`;
 $('lgh').innerHTML=done?(pos===1?'CHAMPIONS<em>.</em>':`FINISHED ${ORD(pos)}<em>.</em>`):`MATCHDAY ${L.md+1}<em>.</em>`;
 let h='<tr><th>#</th><th style="text-align:left">CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th class="pt">PTS</th></tr>';
 standings().forEach((c,i)=>{const r=L.tb[c],gd=r.gf-r.ga;h+=`<tr class="${c===L.club?'me':''}${i===0?' top':''}"><td>${i+1}</td><td class="c">${crestImg(c,20)}<b>${CLUBS[c].n}</b></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${gd>0?'+':''}${gd}</td><td class="pt">${pts(r)}</td></tr>`;});
 $('lgtab').innerHTML=h;
 const last=L.res[L.md-1];$('lgres').innerHTML=last?`<p>MATCHDAY ${L.md} RESULTS</p>`+last.map(r=>`${CLUBS[r.a].s} <b>${r.ga} – ${r.gb}</b> ${CLUBS[r.b].s}`).join('<br>'):`<p>FIXTURES · MATCHDAY 1</p>`+L.fx[0].map(([a,b])=>`${CLUBS[a].s} v ${CLUBS[b].s}`).join('<br>');
 if(done){$('lgmsg').innerHTML=pos===1?`<b>${CLUBS[L.club].n}</b> win the league. Champions.`:`${CLUBS[L.club].n} finish ${ORD(pos).toLowerCase()} with ${pts(L.tb[L.club])} points.`;if(pos===1)confettiBurst(2);}
 else{const o=leagueOpponent();$('lgmsg').innerHTML=`Next: <b>${CLUBS[L.club].n}</b> vs <b>${CLUBS[o].n}</b> · ${CLUBS[o].r} OVR · ${ORD(pos).toLowerCase()} in the table. Win 3 pts, draw 1. Top of the table after five matchdays takes the title.`;}
 $('lggo').textContent=done?'NEW SEASON':'PLAY MATCHDAY '+(L.md+1);$('lggo').onclick=()=>{if(done){league=newLeague(opt.club);showLeague();}else start({_lg:true});};
 $('lgnew').hidden=done;$('lgnew').onclick=()=>{league=newLeague(opt.club);showLeague();};}
function leagueContinue(){if(!league)return toMenu();showLeague();}
/* ================= lower thirds ================= */
function lowerThird(o){l3Q.push(o);if(l3T<=0)nextL3();}
function nextL3(){const o=l3Q.shift();const el=$('l3');if(!o){el.classList.remove('on');return;}
 $('l3t').textContent=o.tag;el.style.setProperty('--k',o.col);const c=new THREE.Color(o.col);el.style.setProperty('--kt',c.r*.3+c.g*.59+c.b*.11>.55?'#0b0d12':'#ffffff');
 const cv=$('l3c'),x=cv.getContext('2d');x.clearRect(0,0,96,96);if(o.ci!=null)crest(x,o.ci,96);$('l3n').innerHTML=o.name;$('l3s').innerHTML=o.sub;
 el.classList.remove('on');void el.offsetWidth;el.classList.add('on');l3T=o.dur||4.5;}
function l3Step(dt){if(o3Wait.length){for(const w of o3Wait)w.t-=dt;while(o3Wait.length&&o3Wait[0].t<=0)lowerThird(o3Wait.shift().o);}if(l3T>0){l3T-=dt;if(l3T<=0){$('l3').classList.remove('on');if(l3Q.length)setTimeout(nextL3,380);}}}
const o3Wait=[];
/* ================= fx from the simulation ================= */
const tv=new V();
S.fx=(k,a,b,c,d)=>{if(!world)return;const live=app==='match';
 switch(k){
  case'kick':{snd.play('kick',a?.st?b:b);const p=a;if(b>14)parts.burst(p.p.x,.05,p.p.z,8,1.6,GRASS,.6);if(c==='shot'||c==='lob'||c==='cross')hype=Math.max(hype,.35);break;}
  case'shot':hype=Math.max(hype,.55);break;
  case'touch':snd.play('touch');break;
  case'bounce':snd.play('bounce',a);break;
  case'post':snd.play('post');snd.play('ooh');shake=Math.max(shake,.6);hype=Math.max(hype,.8);if(live)feed('OFF THE WOODWORK!',-1);break;
  case'net':{snd.play('net',a);shake=Math.max(shake,Math.min(.5,a*.03));const n=world.nets.find(x=>x.s===Math.sign(b.z));if(n)n.kick(b,S.ball.v,a*3+6);break;}
  case'tackle':snd.play('tackle');parts.burst(a.p.x,.05,a.p.z,10,1.8,GRASS,.6);break;
  case'slide':parts.burst(a.p.x,.05,a.p.z,14,2,GRASS,.8);break;
  case'fall':snd.play('tackle');break;
  case'whistle':snd.play('whistle',1);break;
  case'foul':{const[off,vic,card,box]=[a,b,c,d];if(live){banner(box?'PENALTY!':'FOUL',`${off.name} on ${vic.name}`,box?'#ff4d00':'#ffffff',1.8);}snd.play('groan');break;}
  case'card':{snd.play('card');const red=b!=='yellow';cardMesh.material.color.set(red?0xe01818:0xffd400);if(live){banner(b==='red2'?'SECOND YELLOW':red?'RED CARD':'YELLOW CARD',`${a.name} · ${S.teams[a.team].club.s}`,red?'#ff3030':'#ffd400',2.2);feed(`<span class="cd ${red?'r':'y'}"></span>${a.name} ${minute()}'`,a.team);}break;}
  case'offside':if(live)banner('OFFSIDE',a.name,'#ffd400',1.6);snd.play('whistle',1);break;
  case'out':if(live)prompt(a,1.2);break;
  case'goal':{const g=a,T=S.teams[g.team];snd.play('roar');snd.play('whistle',3);hype=1;flash=1;world[g.team===0?'hypeH':'hypeA'].value=1;if(world.goalBoards)world.goalBoards(T.kit.c1,T.kit.c2==='#ffffff'?'#ffd400':T.kit.c2,g.og?'GOAL ◆':'GOAL ◆ '+T.club.s+' ◆');
   const name=g.og?'OWN GOAL':g.scorer?g.scorer.name:'GOAL';if(live||attract){banner('GOAL!',`${name}${g.pen?' (PEN)':''} · ${minute()}'`,'#ffffff',2.8,T.kit.c1);}
   if(live)feed(`⚽ ${name}${g.og?' (OG)':''}${g.pen?' (P)':''} ${minute()}'`,g.team);if(live){const sc=g.scorer,tot=S.events.filter(e=>e.team===g.team&&!e.og&&sc&&e.name===sc.name).length;
    o3Wait.push({t:2.6,o:{tag:g.og?'OWN GOAL':g.pen?'GOAL · PENALTY':tot>=3?'GOAL · HAT-TRICK':'GOAL',col:T.kit.c1,ci:T.ci,name:g.og?(S.lastToucher?S.lastToucher.name:'OWN GOAL'):sc?`${sc.name} <small style="font-size:.9rem;opacity:.7">#${sc.num}</small>`:name,
     sub:`${T.club.n.toUpperCase()} · ${minute()}'${tot>1&&!g.og?` · ${tot} GOALS TODAY`:''} · ${S.teams[0].club.s} ${S.score[0]}–${S.score[1]} ${S.teams[1].club.s}`,dur:5}});}goalIdx=rec.length;$('sb').classList.remove('flash');void $('sb').offsetWidth;$('sb').classList.add('flash');timeScale=.45;shake=1;break;}
  case'save':snd.play('ooh');hype=Math.max(hype,.7);if(live){banner('SAVE!',a.name,'#9fe3ff',1.1);}break;
  case'catch':snd.play('touch');break;
  case'header':snd.play('kick',8);break;
  case'setpiece':{const sp=a;if(!live)break;const L={kick:'KICK-OFF',throw:'THROW-IN',corner:'CORNER',goalkick:'GOAL KICK',free:sp.indirect?'INDIRECT FREE KICK':'FREE KICK',pen:'PENALTY'};
   if(sp.type!=='kick'&&!sp.shootout)prompt(L[sp.type]+' · '+S.teams[sp.team].club.s,1.6);break;}
  case'period':snd.play('whistle',3);if(live){if(a==='PENALTIES')banner(a,'','#ff4d00',2);else showHT(a);}break;
  case'kickoffPeriod':$('ht').hidden=true;snd.play('whistle',1);break;
  case'fulltime':snd.play('whistle',3);hype=a>=0?.9:.3;if(live)banner('FULL TIME',`${S.teams[0].club.s} ${S.score[0]} – ${S.score[1]} ${S.teams[1].club.s}${S.shoot?` · ${S.shoot.kicks[0].filter(x=>x).length}–${S.shoot.kicks[1].filter(x=>x).length} PENS`:''}`,'#ffffff',3);break;
  case'shootout':$('ht').hidden=true;if(live)banner('PENALTIES','SUDDEN DEATH AFTER FIVE','#ff4d00',2.4);break;
  case'pen':if(live)banner(b?'SCORED!':'MISSED!',S.teams[a].club.s,b?'#7dff9a':'#ff5050',1.2);if(b){snd.play('roar');hype=.9;}else snd.play('groan');break;
  case'replay':startReplay();break;
  case'advantage':if(live){prompt('ADVANTAGE · PLAY ON',1.6);feed(`ADVANTAGE · foul by ${a.name}`,b.team);}snd.play('ooh');break;
  case'punch':snd.play('kick',10);snd.play('ooh');if(live)prompt('PUNCHED CLEAR · '+a.name,1.1);break;
  case'sub':{squadM.setLook(a.idx,a.look);snd.play('clap');if(live){const T=S.teams[c];lowerThird({tag:'SUBSTITUTION',col:T.kit.c1,ci:T.ci,name:`<span class="on">▲</span> ${a.name} <small style="font-size:.9rem;opacity:.7">#${a.num}</small>`,sub:`<span class="off">▼ OFF</span> ${b} · ${T.club.n.toUpperCase()} · ${minute()}'`,dur:4.2});feed(`<span class="sub">⇄</span> ${a.name} for ${b} ${minute()}'`,c);}break;}
  case'chance':break;}};
function confettiBurst(kind,side){const cols=kind===2?[new THREE.Color(.95,.75,.15),new THREE.Color(.9,.9,.9),new THREE.Color(.9,.2,.08),new THREE.Color(S.teams[0]?.kit?.c1||'#fff')]:[new THREE.Color(S.teams[0]?.kit?.c1||'#fff'),new THREE.Color('#ffffff'),new THREE.Color(1.6,1.3,.25)];
 const z=kind===2?0:side*(P.L+2);for(let i=0;i<(kind===2?600:220);i++){const x=(rnd()-.5)*(kind===2?P.W*1.6:P.GW*3),y=kind===2?18+rnd()*10:2+rnd()*3;confetti.emit(x,y,z+(rnd()-.5)*(kind===2?P.L*1.6:4),(rnd()-.5)*4,kind===2?-rnd()*2:3+rnd()*6,(rnd()-.5)*4,cols[rnd()*cols.length|0],4+rnd()*3);}}
/* ================= replays ================= */
function record(dt){if(!['play','setpiece','goal','dead','shootkick'].includes(S.phase))return;recT+=dt;if(recT<1/30)return;recT=0;const n=S.ents.length,f=new Float32Array(7+n*NP);const b=S.ball;
 f[0]=b.p.x;f[1]=b.p.y;f[2]=b.p.z;f[3]=b.q.x;f[4]=b.q.y;f[5]=b.q.z;f[6]=b.q.w;for(let i=0;i<n;i++)f.set(S.ents[i].pose,7+i*NP);rec.push(f);if(rec.length>330){rec.shift();goalIdx--;}}
function startReplay(){if(attract||rec.length<40||!S.goal){afterGoal();return;}const gi=cl(goalIdx,1,rec.length);const a=Math.max(0,gi-170);replay={frames:rec.slice(a,Math.min(rec.length,gi+40)),gi:gi-a,t:0,end:0,cut:[rnd()<.5?'tele':'behind',rnd()<.55?'net':'low'],cutAt:gi-a-22};
 $('replay').hidden=false;$('bars').classList.add('on');}
function replayStep(dt){const r=replay;if(!r){afterGoal();return;}const N=r.frames.length;const fi=r.t*30;const near=Math.abs(fi-r.gi)<40;r.t+=dt*(near?.4:.8);
 if(r.t*30>=N-1.01){endReplay();}}
function endReplay(){replay=null;$('replay').hidden=true;$('bars').classList.remove('on');afterGoal();}
const rq=new THREE.Quaternion(),rq2=new THREE.Quaternion(),rpose=new Float32Array(NP);
function replayPose(){const r=replay,N=r.frames.length,fi=Math.min(N-1.001,r.t*30),i=Math.floor(fi),f=fi-i,A=r.frames[i],B=r.frames[i+1];
 ballMesh.position.set(A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f);rq.set(A[3],A[4],A[5],A[6]);rq2.set(B[3],B[4],B[5],B[6]);ballMesh.quaternion.copy(rq.slerp(rq2,f));
 const n=(A.length-7)/NP;for(let k=0;k<n;k++){const o=7+k*NP;for(let j=0;j<NP;j++){let a=A[o+j],b=B[o+j];if(j===3){let d=b-a;d=Math.atan2(Math.sin(d),Math.cos(d));b=a+d;}rpose[j]=a+(b-a)*f;}if(!B[o+VIS])rpose[VIS]=0;squadM.pose(k,rpose);}}
/* ================= input ================= */
const I=controls(Rd.domElement,{canLock:()=>false,menu:()=>false,onKey:e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Slash','Quote'].includes(e.code)&&app==='match')e.preventDefault();
 if(e.code==='Escape'){if(app==='match')pause(true);else if(app==='paused')pause(false);}
 if(app==='match'&&e.code==='KeyC'){camMode=(camMode+1)%3;prompt(['CAMERA · WIDE','CAMERA · BROADCAST','CAMERA · TELE'][camMode],1);}
 if(app==='match'&&e.code==='KeyM'){snd.on=!snd.on;prompt(snd.on?'SOUND ON':'SOUND OFF',1);}}});
const {keys,edge:edgeK}=I;
const KB=[{u:['KeyW'],d:['KeyS'],l:['KeyA'],r:['KeyD'],spr:['ShiftLeft'],pass:['KeyF'],shoot:['Space'],lob:['KeyR'],thru:['KeyT'],skill:['KeyE'],sw:['KeyQ']},
 {u:['ArrowUp'],d:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],spr:['ShiftRight','NumpadAdd'],pass:['Period','Numpad1'],shoot:['Slash','Numpad2'],lob:['Semicolon','Numpad3'],thru:['KeyL','Numpad5'],skill:['Comma','Numpad4'],sw:['Enter','Numpad0']}];
const any=a=>a.some(k=>keys[k]);let padPrevA=[false,false];
function pads(){return gamepads().slice(0,2);}
const cr=new V(),cf=new V();
function readInputs(){cr.set(1,0,0).applyQuaternion(cam.quaternion);cr.y=0;cr.normalize();cf.set(0,0,-1).applyQuaternion(cam.quaternion);cf.y=0;if(cf.lengthSq()<1e-4)cf.set(cr.z,0,-cr.x);cf.normalize();
 const solo=S.humans.length===1,gl=pads();
 for(const h of S.humans){const maps=solo?KB:[KB[h.i]],on=n=>maps.some(m=>any(m[n]));let sx=(on('r')?1:0)-(on('l')?1:0),sy=(on('u')?1:0)-(on('d')?1:0);
  const o={spr:on('spr'),pass:on('pass'),shoot:on('shoot'),lob:on('lob'),thru:on('thru'),skill:on('skill'),sw:on('sw')};
  const g=solo?gl[0]:gl[h.i];if(g){const ax=g.axes,bt=g.buttons,dz=v=>deadzone(v,.2);const gx=dz(ax[0]||0),gy=dz(ax[1]||0);if(gx||gy){sx=gx;sy=-gy;}
   const B=i=>bt[i]&&bt[i].pressed;if(B(0))o.pass=true;if(B(1))o.shoot=true;if(B(2))o.lob=true;if(B(3))o.thru=true;if(B(5))o.skill=true;if(B(4))o.sw=true;if((bt[7]&&bt[7].value>.3)||B(10))o.spr=true;
   if(B(9)&&!h.padSt){pause(app==='match');}h.padSt=B(9);}
  const l=hyp(sx,sy);if(l>1){sx/=l;sy/=l;}o.x=cr.x*sx+cf.x*sy;o.z=cr.z*sx+cf.z*sy;h.inp=o;}}
function skipPressed(){let s=edgeK.Space||edgeK.Enter||edgeK.NumpadEnter;const gl=pads();gl.forEach((g,i)=>{const a=g.buttons[0]&&g.buttons[0].pressed;if(a&&!padPrevA[i])s=true;padPrevA[i]=a;});return s;}
/* ================= step ================= */
function subKey(){if(app!=='match'||intro)return;const gl=pads();S.humans.forEach((h,i)=>{const solo=S.humans.length===1;let e=i===0?edgeK.KeyB:(edgeK.Backslash||edgeK.NumpadDecimal);if(solo&&!e)e=edgeK.Backslash;
  const g=solo?gl[0]:gl[i];if(g){const b=g.buttons[8]&&g.buttons[8].pressed;if(b&&!h.subPad)e=true;h.subPad=b;}if(!e)return;
  if(!['dead','setpiece','break'].includes(S.phase)||S.shoot){prompt('SUBS ONLY AT A STOPPAGE',1.2);return;}const T=S.teams[h.team];if(T.subs<=0||!T.bench.length){prompt('NO SUBSTITUTIONS LEFT',1.2);return;}
  const p=tiredest(T);if(p){if(S.sp&&S.sp.taker===p)return prompt('CANNOT SUB THE TAKER',1.2);substitute(h.team,p);}});}
function step(dt){dt=Math.min(dt,.1);if(app==='match')readInputs();const skip=skipPressed();subKey();I.flush();
 if(app==='paused'){visuals(0);return;}
 if(intro&&app==='match'){intro.t+=dt;if(!intro.said&&intro.t>.3){intro.said=true;banner(`${S.teams[0].club.s}  v  ${S.teams[1].club.s}`,`${S.teams[0].club.n.toUpperCase()} · ${S.teams[1].club.n.toUpperCase()} · ${opt.night?'UNDER THE LIGHTS':'MATCHDAY'}`,'#ffffff',3.2);}
  if(!intro.l3&&intro.t>3.4){intro.l3=1;lowerThird({tag:comp||'FRIENDLY',col:'#ff4d00',ci:S.teams[0].ci,name:`${S.teams[0].club.n} <small style="font-size:.9rem;opacity:.6">v</small> ${S.teams[1].club.n}`,sub:`${opt.night?'UNDER THE LIGHTS':'AFTERNOON KICK-OFF'} · ${curRain?'RAIN':'DRY'} · ${opt.half/60} MIN HALVES · CPU ${DIFF[opt.diff].n}`,dur:3.2});}
  if((skip&&intro.t>.25)||intro.t>=intro.dur){intro=null;$('bars').classList.remove('on');}visuals(dt);return;}
 if(S.phase==='replay'){if(replay){if(skip&&replay.t>.4)replay.t=1e9;replayStep(dt);}else afterGoal();}
 else{if(S.phase==='break'&&skip)skipBreak();timeScale=S.phase==='goal'&&S.goalT<.9?.45:1;acc+=dt*timeScale;let n=0;while(acc>=DT&&n<10){fixed(DT);acc-=DT;n++;}if(n>=10)acc=0;}
 if(app==='match'&&S.phase==='end'&&S.endT>3.4)showOver();
 if(app==='menu'&&S.phase==='end')attractMatch();
 visuals(dt);if(S.phase!=='replay')record(dt);}
/* ================= visuals ================= */
const hp=new V();
function visuals(dt){const rp=S.phase==='replay'&&replay;
 if(rp)replayPose();else{for(const e of S.ents){e.visible=!e.hidden;if(e.ctl<0&&e.role!=='REF'&&e.role!=='LINE')e.sprint=e.ai.sprint;else if(e.role==='REF'||e.role==='LINE')e.sprint=e.ai.sprint;animate(e,dt);squadM.pose(e.idx,e.pose);}
  ballMesh.position.copy(S.ball.p);ballMesh.quaternion.copy(S.ball.q);}
 squadM.commit();squadM.shadows(S.ents,world&&world.lamps,gfx>=1&&opt.night);
 // referee card + linesmen flags in their right hands
 const r=S.ref;if(r&&!rp&&r.anim.act==='card'){squadM.hand(r.idx,1,hp);cardMesh.position.copy(hp);cardMesh.position.y+=.08;cardMesh.lookAt(cam.position);cardMesh.visible=true;}else cardMesh.visible=false;
 S.lines.forEach((l,i)=>{squadM.hand(l.idx,1,hp);const m=flagMeshes[i];m.position.copy(hp);m.rotation.set(0,(l.face||0)+Math.PI/2,l.anim.act==='flag'?.2:-1.4);m.visible=!rp;});
 if(world){world.update(dt,ballMesh.position,tv.copy(cam.position).lerp(C.l,.42));hype=Math.max(.08,hype-dt*.12);const bz=Math.abs(S.ball.p.z)/P.L;const amb=.1+Math.max(0,bz-.6)*.6;world.hype.value=Math.max(amb,hype*.8);
  world.hypeH.value=Math.max(0,world.hypeH.value-dt*.08);world.hypeA.value=Math.max(0,world.hypeA.value-dt*.08);if(snd.ac)snd.hype(Math.max(amb,hype));}
 parts.update(dt);confetti.update(dt);flash=Math.max(0,flash-dt*1.5);
 markers(rp);cameraUpdate(dt);hud(dt);}
function markers(rp){rp=rp||!!intro;const penCam=S.sp&&S.sp.type==='pen'&&S.phase==='setpiece'||!!S.shoot;const live=app==='match'&&!rp&&['play','setpiece','dead'].includes(S.phase);
 rings.forEach((m,i)=>{const h=S.humans[i];const p=h&&h.pl;const vis=live&&!penCam&&p&&active(p);m.visible=!!vis;arrows[i].visible=!!vis;if(!vis)return;m.position.set(p.p.x,.03,p.p.z);m.rotation.y=p.face;
  arrows[i].position.set(p.p.x,p.p.y+2.35*p.h+Math.sin(S.time*6)*.06,p.p.z);arrows[i].rotation.y=S.time*2;});
 // where a lofted ball will land
 const b=S.ball;landRing.visible=false;if(live&&!b.owner&&!b.held&&b.p.y>1.2){const pr=S.pred;for(let i=1;i<pr.length;i++){if(pr[i].y<.4&&pr[i-1].y>=.4){landRing.position.set(pr[i].x,.04,pr[i].z);landRing.visible=true;break;}}}
 // set-piece aim
 aimArrow.visible=false;aimRing.visible=false;penMark.visible=false;const sp=S.sp;
 if(live&&sp&&sp.ready&&!sp.done){const h=S.humans.find(h=>h.pl===sp.taker);if(h){if(sp.type==='corner'&&sp.aimPt){aimRing.position.set(sp.aimPt.x,.05,sp.aimPt.z);aimRing.visible=true;}
   else if(sp.type==='pen'){const T=S.teams[sp.team];const ax=cl((h.inp.x||0)*1.25,-1,1)*(P.GW-.3),ch=h.charge||0;penMark.position.set(Math.abs(h.inp.x||0)>.2?ax:-Math.sign(sp.taker.p.x||1)*0,.25+ch*1.9,T.dir*(P.L-.05));penMark.rotation.y=0;penMark.visible=true;}
   else if(sp.type!=='pen'){const a=h.aim&&hyp(h.aim.x,h.aim.z)>.1?h.aim:{x:Math.sin(sp.taker.face),z:Math.cos(sp.taker.face)};aimArrow.position.set(b.p.x,.05,b.p.z);aimArrow.rotation.y=Math.atan2(a.x,a.z);aimArrow.visible=true;}}}}
/* ================= cameras ================= */
const C={p:new V(-80,26,0),l:new V(),f:new V(),fov:26,init:false};let orbitA=0;
function cameraUpdate(dt){const b=S.ball;let fov=26;const k=1-Math.exp(-dt*2.6);
 const gx=-(P.W+(P.size===5?24:38)),gy=P.size===5?16:24;
 if(intro&&app==='match'){// cinematic walk-in: aerial over the bowl, low dolly past the line-up, crane down to the broadcast spot
  const t=intro.t,u=t/intro.dur,W2=world?world.a:P.W+7;fov=40;
  if(t<2.4){const k=t/2.4,an=1.15+k*.75;tv.set(Math.cos(an)*(P.L+40)*(1-k*.25),48-k*14,Math.sin(an)*(P.L+40)*(1-k*.25));C.p.copy(tv);C.l.set(0,0,0);fov=48;}
  else if(t<4.6){const k=(t-2.4)/2.2;tv.set(-P.W+2.5,1.25+k*.5,-14+k*28);C.p.copy(tv);C.l.set(0,1.1,tv.z*.35);fov=30;}
  else{const k=Math.min(1,(t-4.6)/1.8),e=k*k*(3-2*k);const gx0=-(P.W+(P.size===5?24:38)),gy0=P.size===5?16:24;C.p.set(-6+(gx0+6)*e,2+(gy0-2)*e,-2+2*e);C.l.set(0,.8*(1-e),0);fov=34+(26-34)*e;}
  C.fov=fov;}
 else if(S.phase==='replay'&&replay){const r=replay,fi=r.t*30,s=S.goal.side,bp=ballMesh.position,cut=fi<r.cutAt?r.cut[0]:r.cut[1];const snap=cut!==r.lastCut;r.lastCut=cut;const kk=snap?1:1-Math.exp(-dt*3),kl=snap?1:1-Math.exp(-dt*7);
  if(cut==='behind'){C.p.lerp(tv.set(bp.x*.4+8,7.5,s*(P.L+17)),kk);C.l.lerp(bp,kl);fov=32;}
  else if(cut==='tele'){C.p.lerp(tv.set(P.W+13,7.2,bp.z*.85),kk);C.l.lerp(tv.set(bp.x,bp.y*.6+.6,bp.z),kl);fov=11;}
  else if(cut==='net'){C.p.set(s*0+bp.x*.15,1.05,s*(P.L+P.GD-.25));C.l.lerp(tv.set(bp.x,bp.y+.2,bp.z),kl);fov=58;}
  else{C.p.lerp(tv.set(bp.x-9,2.1,bp.z-s*7.5),kk);C.l.lerp(bp,kl);fov=38;}
  C.fov=fov;}
 else if(app==='over'){orbitA+=dt*.06;C.p.set(Math.cos(orbitA)*15,3.2+Math.sin(orbitA*.7)*.8,Math.sin(orbitA)*15);C.l.set(0,1.2,0);fov=42;}
 else if(app==='menu'||app==='cup'||app==='league'){orbitA+=dt*.03;C.p.set(Math.cos(orbitA)*P.W*.9,P.L*.42,Math.sin(orbitA)*P.L*.85);C.l.set(0,2,0);fov=50;}
 else if(S.sp&&S.sp.type==='pen'&&['setpiece','shootkick','shootres'].includes(S.phase)||S.shoot&&S.phase!=='end'){const s=S.sp?S.teams[S.sp.team].dir:1;const sz=s*(P.L-P.SPOT);C.p.lerp(tv.set(0,2.4,sz-s*10.5),1-Math.exp(-dt*5));C.l.lerp(tv.set(0,1.1,s*P.L),1-Math.exp(-dt*5));fov=32;}
 else if(S.phase==='goal'&&S.goalT>.9&&S.goal&&S.goal.cel){const c=S.goal.cel;C.p.lerp(tv.set(gx*.75,gy*.6,c.p.z*.9),k);C.l.lerp(tv.set(c.p.x,1.1,c.p.z),1-Math.exp(-dt*4));fov=13;}
 else{const o=b.owner||b.held;const fx=o?o.p.x+o.v.x*.35:b.p.x+b.v.x*.25,fz=o?o.p.z+o.v.z*.45:b.p.z+b.v.z*.3;C.f.lerp(tv.set(fx,0,fz),C.init?1-Math.exp(-dt*2.2):1);
  const zl=P.L*.5;C.p.lerp(tv.set(gx,gy,cl(C.f.z*.55,-zl,zl)),C.init?k:1);C.l.lerp(tv.set(C.f.x*.62+2,0,C.f.z),C.init?1-Math.exp(-dt*3):1);fov=[34,26,19][camMode]*(P.size===5?1.05:1);
  if(S.phase==='end')fov*=.8;}
 C.init=true;C.fov+=(fov-C.fov)*Math.min(1,dt*3);cam.fov=C.fov;cam.position.copy(C.p);
 // a human operator: slow drift on the head, plus a short shake on big moments (scaled by zoom so a telephoto does not jump)
 const tt=performance.now()/1000,zf=C.fov/30;shake=Math.max(0,shake-dt*1.8);const sh=shake*shake*.35*zf;
 tv.copy(C.l);if(app==='match'&&!intro&&S.phase!=='replay'){tv.x+=Math.sin(tt*.37)*.12*zf+Math.sin(tt*.91)*.05*zf;tv.y+=Math.sin(tt*.53+1)*.06*zf;}
 if(sh>0){tv.x+=(rnd()-.5)*sh;tv.y+=(rnd()-.5)*sh;tv.z+=(rnd()-.5)*sh;}cam.lookAt(tv);}
/* ================= HUD ================= */
let hudCache={},banT=0,promT=0;
function setT(id,v){if(hudCache[id]!==v){hudCache[id]=v;$(id).textContent=v;}}
function banner(t,s,col,dur,glow){$('bt').textContent=t;$('bt').style.color=col;$('bt').style.textShadow=glow?`0 0 34px ${glow},0 0 2px ${glow},0 6px 0 rgba(0,0,0,.35)`:'';$('bs').textContent=s;$('banner').classList.add('on');banT=dur;}
function prompt(t,dur){$('prompt').textContent=t;$('prompt').classList.add('on');promT=dur;}
function feed(html,team){const d=toast($('feed'),html,6000,5);if(team>=0)d.style.borderLeftColor=S.teams[team].kit.c1;}
function drawCrests(){for(const t of[0,1]){const c=$('cr'+t),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);crest(x,S.teams[t].ci,c.width);$('n'+t).textContent=S.teams[t].club.s;$('t'+t).style.setProperty('--k',S.teams[t].kit.c1);$('t'+t).style.setProperty('--k2',S.teams[t].kit.c2);}}
const radar=$('radar').getContext('2d');
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(promT>0){promT-=dt;if(promT<=0)$('prompt').classList.remove('on');}l3Step(dt);
 drawScreen();if(app!=='match'&&app!=='paused')return;
 setT('s0',String(S.score[0]));setT('s1',String(S.score[1]));setT('clk',clockText());setT('per',S.period>4?'SHOOTOUT':['','1ST HALF','2ND HALF','EXTRA 1','EXTRA 2'][S.period]);
 const so=S.shoot;$('so').hidden=!so;if(so){const dots=t=>{const k=so.kicks[t];let s='';for(let i=0;i<Math.max(5,k.length);i++)s+=`<i class="${k[i]===true?'g':k[i]===false?'m':''}"></i>`;return s;};const v=dots(0)+'|'+dots(1);if(hudCache.so!==v){hudCache.so=v;$('so').innerHTML=`<div>${dots(0)}</div><div>${dots(1)}</div>`;}}
 // ball carrier caption
 const o=S.ball.owner||S.ball.held;const lk=o&&o.team>=0?new THREE.Color(o.look.c1):null;const cap=o&&o.team>=0&&S.phase==='play'?`<b style="--k:${o.look.c1};color:${lk.r*.3+lk.g*.59+lk.b*.11>.6?'#0b0d12':'#fff'}">${o.num}</b>${o.name}`:'';if(hudCache.cap!==cap){hudCache.cap=cap;$('cap').innerHTML=cap;$('cap').classList.toggle('on',!!cap);}
 $('radar').style.opacity=S.phase==='replay'||S.phase==='goal'||intro?0:1;drawRadar();labels();
 // contextual prompts for the human taker
 const sp=S.sp;let pr='';if(sp&&sp.ready&&!sp.done&&S.phase==='setpiece'){const h=S.humans.find(h=>h.pl===sp.taker);if(h){const two=S.humans.length>1,k=h.i?['.','/',';','L']:['F','SPACE','R','T'];
  pr={kick:`KICK-OFF · ${k[0]} PASS`,throw:`THROW-IN · AIM · ${k[0]} SHORT · ${k[2]} LONG`,corner:`CORNER · AIM · ${k[2]} CROSS · ${k[0]} SHORT`,goalkick:`GOAL KICK · ${k[0]} SHORT · ${k[2]} LONG`,free:`FREE KICK · HOLD ${k[1]} SHOOT · ${k[0]} PASS · ${k[2]} LOB`,pen:`PENALTY · AIM · HOLD ${k[1]} FOR POWER`}[sp.type]||'';if(two)pr=(h.i?'P2 · ':'P1 · ')+pr;}
  else if(sp.type==='pen'){const h=S.humans.find(h=>h.team!==sp.team);if(h)pr=`KEEPER · HOLD ${h.i?'←/→':'A/D'} TO PICK YOUR DIVE`;}}
 if(S.phase==='break')pr=S.breakKind+' · SPACE / A TO CONTINUE';
 if(['dead','setpiece','break'].includes(S.phase)&&!S.shoot){const subs=S.humans.map(h=>{const T=S.teams[h.team],p=tiredest(T);return T.subs>0&&T.bench.length&&p&&p.cond<.72?`${S.humans.length>1?(h.i?'P2 \\':'P1 B'):'B'} · SUB ${p.name} ${Math.round(p.cond*100)}% (${T.subs} LEFT)`:'';}).filter(x=>x).join('   ');if(subs)pr=pr?pr+'   ·   '+subs:subs;}
 setT('help',pr);}
function labels(){const host=$('labels'),W=innerWidth,H=innerHeight;S.humans.forEach((h,i)=>{let el=host.children[i];if(!el){el=document.createElement('div');el.className='lb p'+i;el.innerHTML='<b></b><i><s></s></i><u><s></s></u>';host.appendChild(el);}
  const p=h.pl;const show=p&&active(p)&&['play','setpiece','dead'].includes(S.phase)&&!(S.sp&&S.sp.type==='pen'&&S.phase==='setpiece')&&!S.shoot;el.style.display=show?'':'none';if(!show)return;hp.set(p.p.x,p.p.y+2.6*p.h,p.p.z).project(cam);
  el.style.transform=`translate(${(hp.x*.5+.5)*W}px,${(-hp.y*.5+.5)*H}px)`;const nm=(S.humans.length>1?'P'+(i+1)+' · ':'')+p.name;if(el.dataset.n!==nm){el.dataset.n=nm;el.firstChild.textContent=nm;}
  el.children[1].firstChild.style.width=(p.stamina*100).toFixed(0)+'%';const cw=(p.cond*100).toFixed(0);if(el.dataset.c!==cw){el.dataset.c=cw;el.children[1].style.background=`linear-gradient(90deg,rgba(0,0,0,.55) ${cw}%,rgba(255,70,50,.6) ${cw}%)`;}const ch=h.charge||p.charging||0;el.children[2].style.opacity=ch>0?1:0;el.children[2].firstChild.style.width=(ch*100).toFixed(0)+'%';el.children[2].classList.toggle('hot',ch>.86);});
 while(host.children.length>S.humans.length)host.lastChild.remove();}
function drawRadar(){const c=radar,w=240,h=156,m=8;c.clearRect(0,0,w,h);c.fillStyle='rgba(8,24,14,.62)';c.fillRect(0,0,w,h);const sx=(w-2*m)/(2*P.L),sy=(h-2*m)/(2*P.W);const X=z=>m+(z+P.L)*sx,Yy=x=>m+(P.W-x)*sy;
 c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=1;c.strokeRect(m,m,w-2*m,h-2*m);c.beginPath();c.moveTo(w/2,m);c.lineTo(w/2,h-m);c.stroke();c.beginPath();c.arc(w/2,h/2,P.CR*sx,0,7);c.stroke();
 for(const s of[-1,1]){c.strokeRect(s<0?m:w-m-P.BD*sx,Yy(P.BW),P.BD*sx,2*P.BW*sy);}
 for(const p of S.plist){if(!active(p))continue;const T=S.teams[p.team];c.fillStyle=p.role==='GK'?T.club.gk:T.kit.c1;c.beginPath();c.arc(X(p.p.z),Yy(p.p.x),p.ctl>=0?4.5:3.4,0,7);c.fill();c.strokeStyle=p.ctl>=0?(p.ctl?'#2ad1ff':'#ff4d00'):'rgba(0,0,0,.6)';c.lineWidth=p.ctl>=0?2:1;c.stroke();}
 c.fillStyle='#fff';c.beginPath();c.arc(X(S.ball.p.z),Yy(S.ball.p.x),2.6,0,7);c.fill();}
let scrKey='';function drawScreen(force){if(!world||!world.screen||!S.teams[0])return;const key=S.score.join()+minute()+app+(S.shoot?'p':'');if(!force&&key===scrKey)return;scrKey=key;const{c,t}=world.screen,x=c.getContext('2d'),w=c.width,h=c.height;
 x.fillStyle='#05070d';x.fillRect(0,0,w,h);const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,S.teams[0].kit.c1);g.addColorStop(.3,'#0a0d18');g.addColorStop(.7,'#0a0d18');g.addColorStop(1,S.teams[1].kit.c1);x.fillStyle=g;x.globalAlpha=.55;x.fillRect(0,0,w,h);x.globalAlpha=1;
 x.save();x.translate(18,h/2-40);crest(x,S.teams[0].ci,80);x.restore();x.save();x.translate(w-98,h/2-40);crest(x,S.teams[1].ci,80);x.restore();
 x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='86px Anton, Impact, sans-serif';x.fillText(`${S.score[0]} – ${S.score[1]}`,w/2,h/2-8);
 x.font='30px Anton, Impact, sans-serif';x.fillStyle='#ff4d00';x.fillText(attract?'STRIKER 11':S.shoot?'PENALTIES':minute()+"'",w/2,h-24);x.fillStyle='rgba(0,0,0,.3)';for(let i=0;i<h;i+=3)x.fillRect(0,i,w,1);t.needsUpdate=true;}
function showHT(kind){const T=S.teams;$('ht').innerHTML=`<h2>${kind}<em>.</em></h2><p class="htsc">${crestImg(T[0].ci,30)}<b>${S.score[0]} – ${S.score[1]}</b>${crestImg(T[1].ci,30)}</p><div class="hts">${statsTable()}</div><p class="eye">SPACE / A TO CONTINUE</p>`;$('ht').hidden=false;}
function statsTable(){const T=S.teams,tot=T[0].stats.poss+T[1].stats.poss||1;const rows=[['POSSESSION',Math.round(T[0].stats.poss/tot*100)+'%',Math.round(T[1].stats.poss/tot*100)+'%'],['SHOTS',T[0].stats.shots,T[1].stats.shots],['ON TARGET',T[0].stats.sot,T[1].stats.sot],
  ['PASS ACCURACY',pct(T[0].stats),pct(T[1].stats)],['TACKLES',T[0].stats.tackles,T[1].stats.tackles],['SAVES',T[0].stats.saves,T[1].stats.saves],['CORNERS',T[0].stats.corners,T[1].stats.corners],['FOULS',T[0].stats.fouls,T[1].stats.fouls],['SUBS USED',(P.size===5?2:3)-T[0].subs,(P.size===5?2:3)-T[1].subs],['OFFSIDES',T[0].stats.offsides,T[1].stats.offsides],['CARDS',`${T[0].stats.yel}Y ${T[0].stats.red}R`,`${T[1].stats.yel}Y ${T[1].stats.red}R`]];
 return`<table class="st"><tr><th style="color:${T[0].kit.c1}">${T[0].club.s}</th><th></th><th style="color:${T[1].kit.c1}">${T[1].club.s}</th></tr>${rows.map(r=>`<tr><td>${r[1]}</td><td>${r[0]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;}
const pct=s=>s.passes?Math.round(s.passOK/s.passes*100)+'%':'—';
/* ================= results ================= */
function rating(p,T,won,cs){let r=6+p.st.goals*1.2+p.st.assists*.7+p.st.sot*.15+p.st.passOK*.025+p.st.tackles*.2+p.st.saves*.4-p.st.fouls*.15-p.st.yel*.3-p.st.red*1.5+(won?.4:0)+(cs&&(p.role==='GK'||p.role==='DF')?.6:0);return cl(r,3,10);}
function showOver(){app='over';overT=0;$('hud').hidden=true;$('ht').hidden=true;document.body.classList.remove('playing');$('bars').classList.remove('on');
 const two=S.humans.length>1,w=S.winner,T=S.teams;const so=S.shoot;const ps=so?` · ${so.kicks[0].filter(x=>x).length}–${so.kicks[1].filter(x=>x).length} ON PENALTIES`:'';
 const lgM=opt.mode===2&&league&&comp&&comp.startsWith('LEAGUE');$('oeye').textContent=(S.cup?'CUP · '+RN[cup.round]+' · ':lgM?`LEAGUE · MATCHDAY ${league.md+1} · `:'')+(so?'AFTER PENALTIES':S.period>2?'AFTER EXTRA TIME':'FULL TIME');
 $('ores').textContent=two?(w<0?'DRAW':T[w].club.s+' WIN'):w===0?'VICTORY':w<0?'DRAW':'DEFEAT';$('ores').style.color=w<0?'#fff':w===0||two?T[w].kit.c1==='#151515'?'#fff':T[w].kit.c1:'#ff5050';
 $('ofs').innerHTML=`${crestImg(T[0].ci,44)}<span>${T[0].club.n}</span><b>${S.score[0]} – ${S.score[1]}</b><span>${T[1].club.n}</span>${crestImg(T[1].ci,44)}<small>${ps}</small>`;
 const ev=t=>S.events.filter(e=>e.team===t).map(e=>`${e.name} ${e.min}'${e.og?' (OG)':''}${e.pen?' (P)':''}`).join('<br>')||'—';$('oscr').innerHTML=`<div>${ev(0)}</div><div>${ev(1)}</div>`;
 $('stats').innerHTML=statsTable();
 const all=[...S.plist,...S.gone].map(p=>({p,r:rating(p,S.teams[p.team],w===p.team,S.score[1-p.team]===0)})).sort((a,b)=>b.r-a.r);const mvp=all[0];
 $('mvp').innerHTML=mvp?`<span>PLAYER OF THE MATCH</span><b>${mvp.p.name}</b><i>${T[mvp.p.team].club.s} · #${mvp.p.num} · ${mvp.r.toFixed(1)}</i>`:'';
 if(lgM)leagueRecord();const tok=award(w,lgM);$('otok').textContent=`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${best()} PTS`;
 if(S.cup)cupRecord();$('again').textContent=S.cup||lgM?'CONTINUE':'PLAY AGAIN';$('again').onclick=()=>S.cup?cupContinue():lgM?leagueContinue():start();$('omenu').hidden=!!S.cup&&false;
 $('over').hidden=false;}
function award(w,lgM){const won=w===0,draw=w<0;const g=S.score[0];const fin=S.cup&&cup&&cup.round===2&&won;
 // league: points for the result now, and a title / podium bonus on the last matchday (table as it will stand after this game)
 let lgB=0;if(lgM&&league.done){const p=leaguePos();lgB=p===1?600:p<=3?200:0;}
 const pts=g*100+(won?300:draw?100:0)+(S.score[1]===0?75:0)+(won&&S.humans.length===1?opt.diff*100:0)+(fin?500:0)+lgB;
 lastAward={pts,won,score:`${S.score[0]}-${S.score[1]}`,club:S.teams[0].club.n,opp:S.teams[1].club.n,mode:S.cup?'cup '+RN[cup.round].toLowerCase():lgM?'league matchday '+league.md+(lgB?' title bonus':''):'quick',size:P.size+'v'+P.size,diff:DIFF[opt.diff].n.toLowerCase(),two:S.humans.length>1,goals:g};
 const tok=5+Math.min(60,pts/20|0);addRound(tok,won);saveBest('striker',pts);return tok;}
function best(){return bestScore('striker');}
/* ================= lens flare (MEDIUM+ at night) ================= */
const FL=(()=>{const sc=new THREE.Scene(),oc=new THREE.OrthographicCamera(-1,1,1,-1,-1,1),T=flareTex();
 const mk=(map,col)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,color:col,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false}));m.visible=false;sc.add(m);return m;};
 const els=[];for(let i=0;i<4;i++)els.push({glow:mk(T.glow,new THREE.Color(1,.93,.8)),streak:mk(T.streak,new THREE.Color(.5,.65,1)),gh:[[mk(T.ring,new THREE.Color(.22,.32,.55)),-.45,.16],[mk(T.ring,new THREE.Color(.45,.3,.12)),-.9,.3],[mk(T.glow,new THREE.Color(.12,.2,.3)),.4,.12],[mk(T.ring,new THREE.Color(.2,.4,.3)),-1.35,.09]]});
 return{sc,oc,els,any:false};})();
const fv=new V(),fd=new V(),cdir=new V();
function flares(){FL.any=false;const on=gfx>=1&&opt.night&&world&&world.lamps;const asp=innerWidth/innerHeight;cam.getWorldDirection(cdir);
 FL.els.forEach((e,i)=>{const L=on&&world.lamps[i];let I=0;if(L){fd.copy(L).sub(cam.position).normalize();const f=fd.dot(cdir);fv.copy(L).project(cam);
   if(f>0&&Math.abs(fv.x)<1.15&&Math.abs(fv.y)<1.15){I=Math.min(1,Math.max(0,(f-.55)/.4))*(1-Math.max(0,Math.max(Math.abs(fv.x),Math.abs(fv.y))-.85)/.3);I=Math.max(0,I);}}
  const vis=I>.01;e.glow.visible=e.streak.visible=vis;e.gh.forEach(([m])=>m.visible=vis);if(!vis)return;FL.any=true;
  const s=.18+.32*I;e.glow.position.set(fv.x,fv.y,0);e.glow.scale.set(s/asp,s,1);e.glow.material.opacity=.55*I;
  e.streak.position.set(fv.x,fv.y,0);e.streak.scale.set(1.5*I+.3,.05+.03*I,1);e.streak.material.opacity=.5*I;
  for(const[m,k,sz]of e.gh){m.position.set(fv.x*k,fv.y*k,0);m.scale.set(sz/asp,sz,1);m.material.opacity=.7*I;}});}
/* replay depth of field (ULTRA): sharp around the ball, a soft disc blur growing away from it */
const DOF={uniforms:{tDiffuse:{value:null},uF:{value:new THREE.Vector2(.5,.5)},uR:{value:0},uAsp:{value:1.7}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uF;uniform float uR,uAsp;varying vec2 vUv;void main(){vec2 d=vUv-uF;d.x*=uAsp;float m=smoothstep(.16,.62,length(d))*uR;vec4 c=texture2D(tDiffuse,vUv);if(m<.0005){gl_FragColor=c;return;}
  vec4 acc=c;float w=1.;for(int i=0;i<12;i++){float a=float(i)*2.39996;float r=sqrt(float(i)+.5)/3.46;vec2 o=vec2(cos(a),sin(a))*r*m;o.x/=uAsp;acc+=texture2D(tDiffuse,vUv+o);w+=1.;}gl_FragColor=acc/w;}`};
let dofPass=null;
/* ================= rendering ================= */
function render(){const w=innerWidth,h=innerHeight;if(Rd.domElement.width!==Math.floor(w*Rd.getPixelRatio())||Rd.domElement.height!==Math.floor(h*Rd.getPixelRatio())){Rd.setSize(w,h,false);fxp&&(fxp.w=0);}
 cam.aspect=w/h;cam.updateProjectionMatrix();if(!fxp||fxp.night!==opt.night){fxp=cinematic(Rd,scene,cam,{...post(),quality:gfx});fxp.night=opt.night;fxp.w=0;}if(fxp.w!==w*9999+h){fxp.w=w*9999+h;fxp.setSize(w,h);}
 if(fxp.bloom)fxp.bloom.strength=post().bloom+flash*.25;
 if(fxp.composer&&gfx>=2){if(!fxp.dof){fxp.dof=dofPass=new ShaderPass(DOF);const ps=fxp.composer.passes;fxp.composer.insertPass(dofPass,ps.findIndex(p=>p===fxp.bloom)+1);}
  const on=S.phase==='replay'&&!!replay;fxp.dof.enabled=on;if(on){fv.copy(ballMesh.position).project(cam);fxp.dof.uniforms.uF.value.set(fv.x*.5+.5,fv.y*.5+.5);fxp.dof.uniforms.uR.value=C.fov<20?.009:.0045;fxp.dof.uniforms.uAsp.value=w/h;}}
 fxp.render();flares();if(FL.any){Rd.autoClear=false;Rd.render(FL.sc,FL.oc);Rd.autoClear=true;}}
addEventListener('resize',()=>{fxp&&(fxp.w=0);});
/* ================= menu ================= */
const pick=pickers(opt,saveOpt),seg=(id,key,num=true)=>pick(id,key,num,()=>{snd.init();snd.play('ui');menuVis();});
function picker(id,key){const el=$(id);const draw=()=>{const c=CLUBS[opt[key]],cv=el.querySelector('canvas'),x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);crest(x,opt[key],cv.width);el.querySelector('b').textContent=c.n;
  const st=Math.round((c.r-66)/4);el.querySelector('span').textContent='★'.repeat(cl(st,1,5))+'☆'.repeat(5-cl(st,1,5))+' · '+c.r+' OVR';};
 el.querySelector('.l').onclick=()=>{opt[key]=(opt[key]+15)%16;if(key==='opp'&&opt.opp===opt.club)opt.opp=(opt.opp+15)%16;draw();saveOpt();snd.play('ui');};el.querySelector('.r').onclick=()=>{opt[key]=(opt[key]+1)%16;if(key==='opp'&&opt.opp===opt.club)opt.opp=(opt.opp+1)%16;draw();saveOpt();snd.play('ui');};draw();el.redraw=draw;}
function menuVis(){$('r-opp').hidden=opt.mode>=1;$('o-pl').parentElement&&($('r-pl').hidden=opt.mode>=1);$('r-oppl').hidden=$('r-opp').hidden;$('l-opp').textContent=opt.humans===2?'P2 CLUB':'OPPONENT';$('r-pll').hidden=$('r-pl').hidden;}
seg('o-mode','mode');seg('o-pl','humans');seg('o-size','size');seg('o-form','form',false);seg('o-diff','diff');seg('o-half','half');seg('o-off','offside');seg('o-night','night');seg('o-wx','wx');picker('p-club','club');picker('p-opp','opp');menuVis();
$('go').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;$('cupmenu').onclick=toMenu;$('lgmenu').onclick=toMenu;
postButton($('post'),'striker',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: STRIKER 11\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'no win'} ${a.score||''} · ${a.club||''} vs ${a.opp||''}\nGoals: ${a.goals||0}\nMode: ${a.mode||''} ${a.size||''}${a.two?' 2P versus':''} · CPU ${a.diff||''}`];});
/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
/* ================= test hooks ================= */
window.STRIKER={get state(){return app==='match'?S.phase:app;},get app(){return app;},get phase(){return S.phase;},step,render,start,toMenu,pause,S,get ball(){return S.ball;},get players(){return S.plist;},get teams(){return S.teams;},
 get score(){return S.score;},get period(){return S.period;},get clock(){return Math.max(0,(S.period<=2?S.per:S.per/3)-S.clock);},setClock(sec){S.clock=Math.max(0,(S.period<=2?S.per:S.per/3)-sec);},
 setIdle(t,on=true){S.idle[t]=on;},skip(){edgeK.Space=true;},keys,get humans(){return S.humans;},get replay(){return replay;},get cup(){return cup;},cupContinue,showCup,get league(){return league;},leagueContinue,showLeague,newLeague:c=>league=newLeague(c),get opt(){return opt;},
 setQuality:applyQuality,cam:()=>cam,substitute,get intro(){return intro;},renderer:()=>Rd,info:()=>({...Rd.info.render,geos:Rd.info.memory.geometries,tex:Rd.info.memory.textures,crowd:world&&world.crowdN}),foul,beginSP,shoot,humanPass,setCtl,get rec(){return rec;},get world(){return world;},
 toPlay,give(p){toPlay();S.ball.owner=p;S.ball.held=null;S.lastToucher=p;S.lastTeam=p.team;},
 forceGoal(t){const s=S.teams[t].dir;const g=S.teams[1-t].gk;if(g){g.p.x=-P.GW*.8;g.ai.save=null;}S.ball.owner=null;S.ball.held=null;S.ball.p.set(P.GW*.6,.6,s*(P.L-1.2));S.ball.v.set(0,1,s*16);S.lastToucher=S.teams[t].pl.find(p=>p.role==='FW')||S.teams[t].pl[9];S.lastTeam=t;S.phase='play';}};
