// TUMBLE ROYALE — full 3D wobbly-bean game show. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import * as PH from './physics.js';
import {Bean,DT} from './physics.js';
import {makeMats,makeEnv,buildStage,Beans,Particles,Confetti,COLORS,PATTERNS,HATS,randomLook,CZ} from './models.js';
import {ROUNDS,RACES,SURV,buildRound} from './rounds.js';
import {DIFF,initBot,think} from './ai.js';
import {Sound} from './sound.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const N=30,INTRO=4.6;
const NAMES=['JELLO','BLIP','WOBBLES','NUGGET','PIP','SQUISH','BEANO','TUMBLES','ZIGGY','POPCORN','GUMDROP','FIZZ','DOODLE','SPROUT','MOCHI','PICKLE','NOODLE','BOOP','SPRINKLE','TOFU','WIGGLE','BISCUIT','TWIRL','JUJU','PUDDING','MARBLE','SCOOT','BUBBLES','DUMPLING','KAZOO','PEBBLE','TOAST','FLAN','DOTTY','SNORKEL'];
const TAGCOL={RACE:'#3fd4ff',SURVIVAL:'#ff5fa2',TEAM:'#7cf05a',FINAL:'#ffd23a'};

/* ================= renderer + scene ================= */
const canvas=$('c');const RD=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});RD.setPixelRatio(Math.min(devicePixelRatio,1.5));
RD.shadowMap.enabled=true;RD.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.environment=makeEnv(RD);scene.fog=new THREE.Fog(0xb4d4ff,240,1000);
scene.add(new THREE.HemisphereLight(0xd6eaff,0xffb3d9,.9));
const stage=buildStage(scene);
const sun=new THREE.DirectionalLight(0xfff0d8,2.75);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:5,far:260});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
const mats=makeMats(),vis=new Beans(scene,N),puffs=new Particles(scene,1600,false),sparks=new Particles(scene,1400,true),confetti=new Confetti(scene,1500),snd=new Sound();
const cam=new THREE.PerspectiveCamera(60,1,.1,2600);

/* ================= profile + options ================= */
const PK='pxd_tumble';
function loadProf(){let p={kudos:0,crowns:0,shows:0,best:0,look:{c1:'#ff5fa2',c2:'#ffe94a',pat:1,hat:1}};try{const s=JSON.parse(localStorage.getItem(PK));if(s)p={...p,...s,look:{...p.look,...(s.look||{})}};}catch(e){}return p;}
let prof=loadProf();const saveProf=()=>{try{localStorage.setItem(PK,JSON.stringify(prof));}catch(e){}};
let opt={show:1,round:'spin',diff:1};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_tumble_opt'))||{});}catch(e){}
const patOK=i=>prof.kudos>=PATTERNS[i].k,hatOK=i=>HATS[i].crowns?prof.crowns>=HATS[i].crowns:prof.kudos>=HATS[i].k;

/* ================= state ================= */
const beans=[...Array(N)].map((_,i)=>new Bean(i));const me=beans[0];me.name='YOU';const looks=beans.map(()=>randomLook());
let app='menu',phase='lobby',phaseT=0,R=null,W=null,time=0,pt=0,clock=0,acc=0,timeScale=1,show=null,quota=0,qualCount=0,spec=null,diff=DIFF[1];
let lastBeep=0,goT=0,banT=0,lastOut=null,startCount=0,hype=0,act=[],roundRes=null,camIdle=9;
const G={t:0,pt:0,beans,diff,playing:false,puff:p=>puffAt(p,1.4,[new THREE.Color(1,.6,.3),new THREE.Color(1,.85,.5)])};

function teamLook(t,l){return{c1:R.teamCols[t],c2:'#ffffff',pat:1,hat:l.hat};}
function quotaFor(kind,n){if(kind==='race')return n<=3?Math.max(1,n-1):Math.max(2,Math.round(n*.68));if(kind==='survival'||kind==='tail')return Math.max(1,Math.min(n-1,Math.round(n*.6)));if(kind==='final')return 1;return 0;}

/* ================= round setup ================= */
function setupRound(id,field){if(R)R.ctx.dispose();R=buildRound(id,scene,mats,{onDoor,gooMat:stage.gooMat});W=R.W;time=0;pt=0;clock=R.def.time;qualCount=0;acc=0;R.score=[0,0];lastOut=null;timeScale=1;
 beans.forEach(b=>{PH.releaseGrab(b);Object.assign(b,{out:true,hidden:true,inRound:false,crowned:false,cele:false,tail:false,team:-1,finished:false,botCtl:false});});
 let teams=null;if(R.kind==='team'){const sh=shuffle(field.slice());teams=field.map(b=>sh.indexOf(b)%2);}
 const sp=R.spawns(field.length,teams);
 field.forEach((b,i)=>{const s=sp[i];b.place(s[0],s[1]+.05,s[2],s[3]);Object.assign(b,{out:false,hidden:false,inRound:true,frozen:R.kind!=='lobby',cp:0,respawnT:0,rank:0,inv:0,team:teams?teams[i]:-1,lastFake:null,tailInv:0,grabCd:0,cel:null});
  initBot(b,diff);if(b===me&&R.kind!=='lobby')b.speed=1;b.ai.cel=null;vis.setLook(b.id,teams?teamLook(teams[i],looks[b.id]):looks[b.id]);});
 startCount=field.length;quota=quotaFor(R.kind,field.length);
 if(R.kind==='tail')shuffle(field.slice()).slice(0,quota).forEach(b=>b.tail=true);
 act=field.slice();spec=null;CAM.snap=true;CAM.yaw=R.kind==='race'?0:me.inRound?me.yaw:Math.PI;CAM.pitch=R.kind==='final'?.55:.4;
 const d=R.def;$('rtag').textContent=d.tag||'';$('rtag').style.color=TAGCOL[d.tag]||'#fff';$('rtitle').textContent=d.name;$('teams').hidden=R.kind!=='team';
 if(R.kind==='team'){$('tn0').textContent=R.teamNames[0];$('tn1').textContent=R.teamNames[1];}
 $('feed').innerHTML='';}

/* ================= show flow ================= */
function hideAll(){['menu','keys','over','pause','intro','summary'].forEach(i=>$(i).hidden=true);}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);try{localStorage.setItem('pxd_tumble_opt',JSON.stringify({show:opt.show,round:opt.round,diff:opt.diff}));}catch(e){}
 snd.init();me.menuPose=false;diff=DIFF[opt.diff];G.diff=diff;const nm=shuffle(NAMES.slice());
 beans.forEach((b,i)=>{b.elim=false;b.knocks=0;b.name=i?nm[i]:'YOU';looks[i]=i?randomLook():{...prof.look};});
 let list;if(opt.show===2)list=[opt.round];else{const r=shuffle(RACES.slice()),s=shuffle(SURV.slice());const s2=s.filter(x=>x!=='ball'&&x!==s[0]);list=opt.show===0?[r[0],s[0],'hex']:[r[0],s[0],r[1],s2[0]||'skip','hex'];}
 if(o.list)list=o.list.slice();
 show={list,idx:0,res:[],kudos:0,left:false,winner:null,practice:opt.show===2&&!o.list,done:false};
 app='show';hideAll();$('hud').hidden=false;document.body.classList.add('playing');beginRound();}
function beginRound(){let id=show.list[show.idx];const field=beans.filter(b=>!b.elim);if(id==='ball'&&field.length<6)id=show.list[show.idx]='skip';
 setupRound(id,field);phase='intro';phaseT=0;G.playing=false;snd.setMusic(true,.07);fillIntro();}
function fillIntro(){const d=R.def,n=startCount,list=show.list;$('iround').textContent=show.practice?'PRACTICE ROUND':`ROUND ${show.idx+1} OF ${list.length}`+(me.elim?' · SPECTATING':'');
 $('ichips').innerHTML=list.map((r,i)=>`<i class="${i<show.idx?'done':i===show.idx?'now':''}${ROUNDS[r].kind==='final'?' fin':''}"></i>`).join('');
 $('itag').textContent=d.tag;$('itag').style.background=TAGCOL[d.tag];$('iname').textContent=d.name;$('idesc').textContent=d.desc;
 $('iq').textContent=R.kind==='race'?`${quota} OF ${n} QUALIFY`:R.kind==='survival'?`SURVIVE · ${quota} OF ${n} GO THROUGH`:R.kind==='tail'?`${quota} TAILS FOR ${n} BEANS`:R.kind==='team'?(me.inRound?`YOUR TEAM: ${R.teamNames[me.team]} · LOSERS ARE OUT`:'LOSING TEAM IS ELIMINATED'):`${n} FINALISTS · LAST BEAN STANDING WINS`;
 $('iq').style.color=R.kind==='team'&&me.inRound?R.teamCols[me.team]:'';$('intro').hidden=false;$('summary').hidden=true;}
function go(){phase='play';phaseT=0;goT=1.1;G.playing=true;for(const b of act)if(b.respawnT<=0)b.frozen=false;if(R.gate){R.gate.col.on=false;R.gate.openT=time;}snd.play('whistle');snd.setMusic(true,.1);hype=.7;
 if(R.kind==='final')snd.setMusic(true,.13);}
function qualify(b){if(b.finished||b.out)return;b.finished=true;qualCount++;b.rank=qualCount;b.inv=999;PH.releaseGrab(b);
 feed(`${b.name} QUALIFIED${b===me?' · #'+b.rank:''}`,b===me?'me':'');sparks.burst(new V(b.p.x,b.p.y+1,b.p.z),26,7,[new THREE.Color(2,1.8,.6),new THREE.Color(.6,2,.8)],.5,.8,{grav:4});
 if(b===me){banner('QUALIFIED!',`#${b.rank} ACROSS THE LINE`,'#7cf05a',2.4);snd.play('qualify');confetti.burst(new V(b.p.x,b.p.y+2,b.p.z),160,7);hype=1;}}
function eliminate(b,why){if(b.out)return;b.out=true;b.hidden=true;b.elimHere=true;lastOut=b;PH.releaseGrab(b);if(b.tail){b.tail=false;}
 const p=new V(b.p.x,R.goo?R.goo.y:Math.max(b.p.y,-14),b.p.z);puffAt(p,1.6,[new THREE.Color(1,.35,.7),new THREE.Color(1,.6,.85)]);
 feed(`${b.name} ELIMINATED`,b===me?'bad':'');if(b===me){banner('ELIMINATED','YOU CAN SPECTATE OR LEAVE THE SHOW','#ff5fa2',2.8);snd.play('elim');snd.play('splash');}else if(near(b.p,25))snd.play('splash');}
function respawn(b){const k=R.kind;b.hidden=false;b.frozen=!G.playing;b.inv=1.4;
 if(k==='race'){const c=R.cps[b.cp];if(R.goo&&c.y<R.goo.y+.6){b.hidden=true;eliminate(b,'goo');return;}b.place((rnd(2)-1)*c.x,c.y+.1,c.z,0);}
 else if(k==='team'){const s=b.team?1:-1;b.place(rnd(14)-7,.1,CZ+s*14,s>0?Math.PI:0);}
 else{const a=rnd(6.283),r=6+rnd(6);b.place(Math.sin(a)*r,.1,CZ+Math.cos(a)*r,a+Math.PI);}
 puffAt(new V(b.p.x,b.p.y+.6,b.p.z),1,[new THREE.Color(1,1,1),new THREE.Color(.8,.9,1)]);if(b===me){CAM.snap=true;}}
function alive(){return act.filter(b=>!b.out);}
function rules(dt){const k=R.kind;
 for(const b of act){if(b.out)continue;
  if(b.respawnT>0){b.respawnT-=dt;if(b.respawnT<=0)respawn(b);continue;}
  if(R.goo&&b.p.y+.35<R.goo.y&&!b.finished){eliminate(b,'goo');continue;}
  if(b.p.y<R.killY){if(k==='race'||k==='team'||k==='tail'){if(k==='tail'&&b.tail){b.tail=false;const pool=act.filter(o=>!o.out&&!o.tail&&o!==b&&!o.hidden);const o=pool[Math.random()*pool.length|0];if(o){o.tail=true;o.tailInv=1.5;}feed(`${b.name} DROPPED A TAIL${o?' · '+o.name+' GOT IT':''}`,b===me?'bad':o===me?'me':'');}
    puffAt(new V(b.p.x,-13.5,b.p.z),1.2,[new THREE.Color(1,.35,.7)]);if(b===me)snd.play('splash');b.respawnT=.9;b.resp=k==='race'?new V(0,R.cps[b.cp].y,R.cps[b.cp].z):k==='team'?new V(0,0,CZ+(b.team?14:-14)):new V(0,0,CZ);b.hidden=true;b.frozen=true;PH.releaseGrab(b);}else eliminate(b,'fall');continue;}
  if(k==='race'&&!b.finished){while(b.cp+1<R.cps.length&&b.p.z>R.cps[b.cp+1].z-.5&&b.ground)b.cp++;if(b.p.z>R.finishZ&&b.p.y>R.finishY-1.5)qualify(b);}
  if(b.tailInv>0)b.tailInv-=dt;}
 if(k==='race'&&(qualCount>=quota||act.every(b=>b.out||b.finished)))return endRound('quota');
 if(k==='survival'&&alive().length<=quota)return endRound('quota');
 if(k==='final'&&alive().length<=1)return endRound('last');
 if(k==='team')for(const bl of R.balls){const z=bl.p.z-CZ;if(Math.abs(z)>R.Z+1.2&&!bl.scored){bl.scored=true;const t=z>0?0:1;R.score[t]++;feed(`GOAL FOR ${R.teamNames[t]}!`,me.team===t?'me':'bad');banner('GOAL!',`${R.teamNames[t]} ${R.score[0]}-${R.score[1]}`,R.teamCols[t],1.6);snd.play('goal');
   confetti.burst(new V(bl.p.x,bl.p.y+2,bl.p.z),140,9);hype=1;bl.resetT=1.2;}
  if(bl.resetT>0){bl.resetT-=dt;if(bl.resetT<=0){bl.scored=false;bl.p.set(bl.home.x,8,bl.home.z);bl.v.set(0,0,0);puffAt(bl.p,1.5,[new THREE.Color(1,1,1)]);}}}
 if(k==='race'&&!R.goo){/* nothing */}}
function endRound(reason){if(phase!=='play')return;phase='end';phaseT=0;G.playing=false;const k=R.kind,field=act;let Q=[],winner=null;
 if(k==='race')Q=field.filter(b=>b.finished);
 else if(k==='survival')Q=field.filter(b=>!b.out);
 else if(k==='tail'){Q=field.filter(b=>!b.out&&b.tail);if(!Q.length)Q=field.filter(b=>!b.out).slice(0,1);}
 else if(k==='team'){let w=R.score[0]>R.score[1]?0:R.score[1]>R.score[0]?1:-1;if(w<0){const s=R.balls.reduce((a,b)=>a+(b.p.z-CZ),0);w=s>0?0:s<0?1:Math.random()<.5?0:1;}R.win=w;Q=field.filter(b=>b.team===w);
  banner(`${R.teamNames[w]} WIN`,`${R.score[0]} - ${R.score[1]}`,R.teamCols[w],2.6);}
 else if(k==='final'){const al=field.filter(b=>!b.out);winner=al.length?al.slice().sort((a,b)=>(b.p.y-a.p.y)||(a.p.distanceToSquared(R.center)-b.p.distanceToSquared(R.center)))[0]:lastOut||field[0];Q=[winner];show.winner=winner;}
 if(!Q.length&&field.length){const pool=field.filter(b=>!b.out);Q=[k==='race'&&pool.length?pool.reduce((a,b)=>b.p.z>a.p.z?b:a):pool[0]||lastOut||field[0]];if(k==='final'){winner=Q[0];show.winner=winner;}}
 for(const b of field){if(!Q.includes(b))b.elim=true;}
 const inR=me.inRound&&!me.elimBefore;let res='S',det='',kud=0;
 if(me.inRound){if(k==='final'){res=winner===me?'W':'E';kud=winner===me?300:30;det=winner===me?'CROWN WON':`${winner.name} WON`;}
  else if(Q.includes(me)){res='Q';kud=k==='race'?40+Math.min(30,Math.max(0,quota-me.rank)*2):55;det=k==='race'?`#${me.rank} OF ${quota}`:k==='team'?`${R.teamNames[me.team]} WON ${Math.max(...R.score)}-${Math.min(...R.score)}`:k==='tail'?'KEPT A TAIL':'SURVIVED';}
  else{res='E';kud=12;det=k==='race'?'DID NOT FINISH IN TIME':k==='tail'?'NO TAIL AT THE BUZZER':k==='team'?'YOUR TEAM LOST':'KNOCKED OUT';}}
 show.kudos+=kud;roundRes={id:R.id,name:R.def.name,tag:R.def.tag,res,det,kud,q:Q.length,e:field.length-Q.length};show.res.push(roundRes);
 if(k!=='team'){if(res==='Q')banner('QUALIFIED!',det,'#7cf05a',2.6);else if(res==='E'&&k!=='final')banner(me.out&&me.elimHere?'ROUND OVER':'ELIMINATED',det,'#ff5fa2',2.6);else if(k==='final')banner(winner===me?'CROWNED!':'WINNER!',winner===me?'YOU WIN THE SHOW!':`${winner.name} TAKES THE CROWN`,'#ffd23a',2.6);else banner('ROUND OVER',`${Q.length} QUALIFIED`,'#ffffff',2.4);}
 if(res==='Q'||res==='W'){snd.play(res==='W'?'crown':'qualify');confetti.burst(new V(me.p.x,me.p.y+2,me.p.z),200,8);}else if(res==='E'&&!me.elimHere)snd.play('elim');else snd.play('whistle');
 for(const b of Q){b.cele=true;}snd.setMusic(true,.05);}
function fillSummary(){const r=roundRes;$('sround').textContent=show.practice?'PRACTICE RESULTS':`ROUND ${show.idx+1} RESULTS · ${r.name}`;
 $('sres').textContent={Q:'QUALIFIED',E:'ELIMINATED',W:'CROWNED',S:'SPECTATING'}[r.res];$('sres').style.color={Q:'#7cf05a',E:'#ff5fa2',W:'#ffd23a',S:'#ffffff'}[r.res];
 $('sdet').textContent=`${r.q} QUALIFIED · ${r.e} ELIMINATED`+(r.det?' · '+r.det:'');const tot=r.q+r.e||1;$('sbar').innerHTML=`<i class="q" style="width:${r.q/tot*100}%"></i><i class="e" style="width:${r.e/tot*100}%"></i>`;
 $('skud').textContent=r.kud?`+${r.kud} KUDOS · SHOW TOTAL ${show.kudos}`:'';const nx=show.list[show.idx+1];
 $('snext').textContent=(R.kind==='final'||show.practice||!nx)?'SPACE · CONTINUE':me.elim?`NEXT: ${ROUNDS[nx].name} · SPACE CONTINUE · ENTER LEAVE`:`NEXT: ${ROUNDS[nx].name} · SPACE · CONTINUE`;
 $('summary').hidden=false;}
function nextRound(){$('summary').hidden=true;const al=beans.filter(b=>!b.elim);
 if(R.kind==='final'||al.length<=1)return crown(show.winner||al[0]||me);
 show.idx++;if(show.practice||show.idx>=show.list.length)return showOver();beginRound();}
function leaveShow(){if(!show||show.done)return;const al=beans.filter(b=>!b.elim&&b!==me&&!(b.inRound&&b.out));const pool=al.length?al:beans.filter(b=>b!==me);
 let tot=0;pool.forEach(b=>tot+=Math.pow(b.speed||1,10));let r=rnd(tot),w=pool[0];for(const b of pool){r-=Math.pow(b.speed||1,10);if(r<=0){w=b;break;}}
 show.left=true;if(show.res.length===show.idx&&R&&R.kind!=='lobby'){const r={id:R.id,name:R.def.name,tag:R.def.tag,res:me.inRound?'E':'S',det:me.inRound?'KNOCKED OUT':'LEFT THE SHOW',kud:me.inRound?12:0,q:0,e:0};show.res.push(r);show.kudos+=r.kud;}
 for(let i=show.res.length;i<show.list.length;i++)show.res.push({id:show.list[i],name:ROUNDS[show.list[i]].name,tag:ROUNDS[show.list[i]].tag,res:'S',det:'LEFT THE SHOW',kud:0,q:0,e:0});
 G.playing=false;crown(w);}
function crown(w){show.done=true;show.winner=w;$('intro').hidden=true;$('summary').hidden=true;$('hud').hidden=false;
 const others=beans.filter(b=>b!==w&&(b===me||!b.elim||b.elimHere)).slice(0,8);const field=[w,...others.filter(b=>b!==w)].slice(0,9);
 setupRound('lobby',field);w.place(R.podium.x,R.podium.y+.05,R.podium.z,Math.PI);w.crowned=true;phase='crown';phaseT=0;
 field.forEach(b=>{b.cele=true;b.frozen=false;if(b!==w)b.yaw=Math.atan2(w.p.x-b.p.x,w.p.z-b.p.z);});
 banner(w===me?'CROWNED!':'WINNER!',w===me?'YOU ARE THE TUMBLE ROYALE CHAMPION':`${w.name} TAKES THE CROWN`,'#ffd23a',4.2);snd.play('crown');snd.setMusic(true,.1);
 confetti.burst(new V(0,5,CZ),360,12);hype=1;}
function showOver(){app='over';phase='over';$('hud').hidden=true;document.body.classList.remove('playing');hideAll();try{document.exitPointerLock();}catch(e){}
 const w=show.winner,won=w===me;if(R.kind!=='lobby'||!w){const f=w?[w]:[me];setupRound('lobby',f);}const sh=w||me;sh.place(R.podium.x,R.podium.y+.05,R.podium.z,Math.PI);sh.crowned=!!w;sh.cele=true;sh.frozen=false;
 const last=show.res[show.res.length-1]||{};
 $('oeye').textContent=show.practice?`PRACTICE · ${ROUNDS[show.list[0]].name}`:`SHOW OVER · ${show.list.length} ROUNDS · BOTS ${diff.n}`;
 $('ores').textContent=won?'CROWNED!':show.practice?(last.res==='Q'||last.res==='W'?'QUALIFIED':'ELIMINATED'):'ELIMINATED';$('ores').style.color=won?'#ffd23a':show.practice&&(last.res==='Q'||last.res==='W')?'#7cf05a':'#ff5fa2';
 const ei=show.res.findIndex(r=>r.res==='E');$('ofs').textContent=won?'YOU OUTLASTED 29 BEANS AND TOOK THE CROWN':show.practice?last.det||'':(ei>=0?`OUT IN ROUND ${ei+1} · ${show.res[ei].name}`:'')+(w&&!won?` · ${w.name} WON THE CROWN`:'');
 $('stats').innerHTML='<tr><th>ROUND</th><th>TYPE</th><th>RESULT</th><th>KUDOS</th></tr>'+show.res.map((r,i)=>`<tr><td><span class="pill" style="background:${TAGCOL[r.tag]}">${i+1}</span>${r.name}</td><td>${r.tag}</td><td class="${r.res.toLowerCase()}">${{Q:'QUALIFIED',E:'ELIMINATED',W:'CROWNED',S:'—'}[r.res]}${r.det&&r.res!=='S'?' · '+r.det:''}</td><td>${r.kud?'+'+r.kud:''}</td></tr>`).join('');
 const before={k:prof.kudos,c:prof.crowns};const tok=award(show.kudos,won);const unl=[];PATTERNS.forEach((p,i)=>{if(p.k>before.k&&p.k<=prof.kudos)unl.push(p.n+' PATTERN');});HATS.forEach((h,i)=>{if(h.crowns?before.c<h.crowns&&prof.crowns>=h.crowns:h.k>before.k&&h.k<=prof.kudos)unl.push(h.n+' HAT');});
 $('otok').innerHTML=`+${show.kudos} KUDOS · +${tok} TOKENS · <b>${prof.crowns}</b> CROWNS · ${prof.kudos} KUDOS TOTAL`+(unl.length?`<br>UNLOCKED: <b>${unl.join(' · ')}</b>`:'');
 $('over').hidden=false;snd.setMusic(true,.06);if(won)confetti.burst(new V(0,6,CZ),300,10);}
let lastAward=null;
function award(pts,won){lastAward={pts,won,rounds:show.res.length,diff:diff.n.toLowerCase(),show:show.practice?'practice':show.list.length===3?'quick':'full',best:show.res.filter(r=>r.res==='Q'||r.res==='W').length};
 prof.kudos+=pts;if(won)prof.crowns++;prof.shows++;prof.best=Math.max(prof.best||0,pts);saveProf();
 const tok=5+Math.min(60,pts/10|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'tumble';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function toMenu(){app='menu';phase='lobby';show=null;G.playing=false;hideAll();$('menu').hidden=false;$('keys').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');try{document.exitPointerLock();}catch(e){}
 looks[0]={...prof.look};const field=[me,...beans.slice(1,8)];for(let i=1;i<8;i++)looks[i]=randomLook();setupRound('lobby',field);me.place(R.podium.x,R.podium.y+.05,R.podium.z,Math.PI);me.cele=false;me.menuPose=true;
 field.forEach((b,i)=>{if(b===me)return;b.cele=true;const a=(i-4)*.42+(i%2?.12:-.12),r=4.5+(i%3);b.place(R.podium.x+Math.sin(a)*r*1.2,.05,R.podium.z+3+Math.cos(a)*r*.7,Math.PI+a*.3);});refreshMenu();snd.ac&&snd.setMusic(true,.06);}

/* ================= events from physics ================= */
const DUST=[new THREE.Color(1,1,1),new THREE.Color(.92,.9,1)],STAR=[new THREE.Color(2.2,2,.6),new THREE.Color(2,2,2),new THREE.Color(2.2,.8,1.4)];
function near(p,r=22){return CAM.tgt.distanceToSquared(p)<r*r;}
function puffAt(p,s,cols){puffs.burst(p,Math.round(14*s),4*s,cols||DUST,.9*s,.7,{up:true,grav:-1.2,drag:2.4,jit:.4*s});}
function ev(t,a,b,c){
 if(t==='jump'){if(a===me)snd.play('jump');if(near(a.p))puffs.burst(new V(a.p.x,a.p.y+.1,a.p.z),5,2.2,DUST,.45,.45,{up:true,upK:.3,drag:3});}
 else if(t==='land'){if(a===me){snd.play('land',b);}if(near(a.p)&&b>6)puffs.burst(new V(a.p.x,a.p.y+.08,a.p.z),Math.min(16,b|0),3+b*.15,DUST,.5,.5,{flat:true,drag:3.4});}
 else if(t==='dive'){if(a===me)snd.play('dive');}
 else if(t==='knock'){if(near(a.p,30)){sparks.burst(new V(a.p.x,a.p.y+1.2,a.p.z),18,6,STAR,.42,.6,{drag:2});snd.play('knock');}if(a===me){CAM.shake=.55;}hype=Math.min(1,hype+.15);}
 else if(t==='boing'){if(near(a.p,25))snd.play('boing');sparks.burst(new V(a.p.x,a.p.y+1,a.p.z),8,4,STAR,.3,.4);}
 else if(t==='bump'){if((a===me||b===me))snd.play('bump',c);}
 else if(t==='tile'){if(b===me)snd.play('tile',Math.random());}
 else if(t==='ballhit'){if(near(a.p,25))snd.play('bump',b*.5);}}
function onDoor(col,b,real){const p=new V(col.c.x,1.6,col.c.z);if(real){puffAt(p,1.4,[new THREE.Color(.5,.85,1),new THREE.Color(1,1,1)]);sparks.burst(p,14,6,STAR,.4,.5);if(near(p,30))snd.play('door');if(b===me)feed('DOOR BUSTED!','me');}
 else{if(b===me||near(p,12))snd.play('fake');if(b===me)feed('FAKE DOOR!','bad');}}

/* ================= input ================= */
const keys={},edge={},mouse={l:false,r:false};let locked=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)||(app==='show'&&(e.code==='ControlLeft'||e.code==='ControlRight')))e.preventDefault();
 if(e.code==='Escape'){if(app==='show')pause(true);else if(app==='paused')pause(false);}
 if(e.code==='KeyM'){snd.music=!snd.music;snd.ac&&snd.setMusic(snd.music,.08);feed(snd.music?'MUSIC ON':'MUSIC OFF','');}});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
canvas.addEventListener('mousedown',e=>{if(app==='show'&&!locked&&(phase==='play'||phase==='countdown'||phase==='intro')){try{canvas.requestPointerLock();}catch(err){}return;}if(e.button===0)mouse.l=true;if(e.button===2)mouse.r=true;});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&app==='show'&&phase==='play')pause(true);});
addEventListener('mousemove',e=>{if(!locked)return;CAM.yaw-=e.movementX*.0027;CAM.pitch=cl(CAM.pitch+e.movementY*.0022,-.25,1.15);camIdle=0;});
addEventListener('wheel',e=>{if(app==='show')CAM.dist=cl(CAM.dist+Math.sign(e.deltaY)*.8,5.5,15);},{passive:true});
const padPrev={};
function gp(){const l=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];return l[0]||null;}
function readInput(dt){if(me.botCtl)return;const k=me.ctrl,kb=c=>!!keys[c];let mx=(kb('KeyD')?1:0)-(kb('KeyA')?1:0),mz=(kb('KeyW')?1:0)-(kb('KeyS')?1:0);
 const spectating=me.out||me.elim||!me.inRound;let cy=0;if(!spectating||true){cy=(kb('ArrowLeft')?1:0)-(kb('ArrowRight')?1:0);if(spectating)cy=0;}
 k.jump=kb('Space');k.dive=kb('ControlLeft')||kb('ControlRight')||kb('KeyC')||mouse.r;k.grab=kb('ShiftLeft')||kb('ShiftRight')||kb('KeyE')||mouse.l;
 const g=gp();if(g){const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.18?v:0;const sx=dz(ax[0]||0),sy=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);if(sx||sy){mx=sx;mz=-sy;}
  if(rx||ry){CAM.yaw-=rx*2.6*dt;CAM.pitch=cl(CAM.pitch+ry*1.6*dt,-.25,1.15);camIdle=0;}
  if(bt[0]?.pressed)k.jump=true;if(bt[2]?.pressed||bt[1]?.pressed)k.dive=true;if((bt[7]?.value||0)>.3||bt[5]?.pressed)k.grab=true;
  if(bt[0]?.pressed&&!padPrev.a)edge.PadA=true;if(bt[9]?.pressed&&!padPrev.st)pause(app==='show');if(bt[14]?.pressed&&!padPrev.l)edge.ArrowLeft=true;if(bt[15]?.pressed&&!padPrev.r)edge.ArrowRight=true;
  padPrev.a=bt[0]?.pressed;padPrev.st=bt[9]?.pressed;padPrev.l=bt[14]?.pressed;padPrev.r=bt[15]?.pressed;}
 if(cy){CAM.yaw+=cy*2.4*dt;camIdle=0;}
 const fx=Math.sin(CAM.yaw),fz=Math.cos(CAM.yaw);k.x=fx*mz-fz*mx;k.z=fz*mz+fx*mx;
 if(me.frozen||phase==='intro'){k.x=k.z=0;}
 camIdle+=dt;if(!locked&&camIdle>1.6&&Math.hypot(mx,mz)>.1&&mz>=0&&me.state==='run'){let d=me.yaw-CAM.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)<2.2)CAM.yaw+=d*Math.min(1,dt*1.1);}}
function pause(on){if(on&&app==='show'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');try{document.exitPointerLock();}catch(e){}}else if(!on&&app==='paused'){app='show';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= simulation ================= */
let tick=0;
function fixed(dt){time+=dt;if(G.playing)pt+=dt;G.t=time;G.pt=pt;W.t=time;
 PH.updateMovers(W,time);for(const sw of W.seesaws)PH.stepSeesaw(sw,beans,dt);if(W.hex)PH.stepHex(W.hex,dt,R.fuse||.6);
 const ctl=phase==='play'||phase==='end'||phase==='crown'||phase==='lobby'||phase==='over';
 tick++;for(const b of act){if(b.out)continue;if(b!==me||R.kind==='lobby'||me.botCtl){if((b.id+tick)&1)continue;if(ctl&&!b.frozen)think(b,R,G,dt*2);else{b.ctrl.x=b.ctrl.z=0;b.ctrl.jump=b.ctrl.dive=b.ctrl.grab=false;}}}
 if(R.kind==='lobby'&&me.menuPose&&app==='menu'){me.ctrl.x=me.ctrl.z=0;me.ctrl.jump=false;me.cele=false;}
 for(const b of act)PH.stepBean(b,W,dt,ev);
 const L=act.length;for(let i=0;i<L;i++){const a=act[i];if(a.out||a.hidden)continue;for(let j=i+1;j<L;j++){const b=act[j];if(!b.hidden)PH.beanPair(a,b,ev);}}
 for(const bl of W.balls){if(!bl.on)continue;PH.stepBall(bl,W,dt,ev);for(const b of act)if(!b.hidden)PH.ballBean(bl,b,ev);}
 for(let i=0;i<W.balls.length;i++)for(let j=i+1;j<W.balls.length;j++)PH.ballBall(W.balls[i],W.balls[j]);
 grabs(dt);}
const tv=new V();
function grabs(dt){for(const a of act){if(a.out||a.hidden)continue;if(a.grabCd>0)a.grabCd-=dt;
 if(a.grabbing){const b=a.grabbing;a.grabT+=dt;const d=a.p.distanceTo(b.p);if(!a.ctrl.grab||d>2.1||a.grabT>2.4||a.state!=='run'||b.state==='rag'||b.out||b.hidden){PH.releaseGrab(a);a.grabCd=.35;continue;}
  tv.subVectors(a.p,b.p).setY(0);if(d>1.05){tv.normalize();b.v.x+=tv.x*12*dt;b.v.z+=tv.z*12*dt;}
  if(R.kind==='tail'&&b.tail&&!a.tail&&a.grabT>.16&&!(b.tailInv>0)&&G.playing){a.tail=true;b.tail=false;a.tailInv=1.6;R.steals=(R.steals||0)+1;PH.releaseGrab(a);a.grabCd=.6;
   sparks.burst(new V(a.p.x,a.p.y+1.2,a.p.z),24,6,[new THREE.Color(2.4,1.4,.3),new THREE.Color(2,2,1)],.45,.7);if(a===me||b===me)snd.play('steal');feed(`${a.name} STOLE ${b.name==='YOU'?'YOUR':b.name+"'S"} TAIL`,a===me?'me':b===me?'bad':'');}}
 else if(a.ctrl.grab&&a.state==='run'&&!(a.grabCd>0)&&!a.heldBy){a.fwd(tv);for(const b of act){if(b===a||b.out||b.hidden||b.heldBy||b.grabbing===a||b.state==='rag'||b.finished)continue;const dx=b.p.x-a.p.x,dz=b.p.z-a.p.z,dy=b.p.y-a.p.y,d2=dx*dx+dz*dz;
   if(d2<1.35*1.35&&Math.abs(dy)<1&&(dx*tv.x+dz*tv.z)>.35*Math.sqrt(d2)){a.grabbing=b;b.heldBy=a;a.grabT=0;if(a===me||b===me)snd.play('grab');break;}}a.grabCd=.15;}}}

let roleT=0;
function step(dt){dt=Math.min(dt,.1);
 if(app==='show'&&R.kind!=='lobby')readInput(dt);else{me.ctrl.grab=false;}
 const skip=edge.Space||edge.Enter||edge.PadA,leave=edge.Enter,sl=edge.ArrowLeft,sr=edge.ArrowRight;for(const k in edge)delete edge[k];
 if(app==='paused'){visuals(0);return;}
 if(app==='show')flow(dt,skip,leave,sl,sr);
 acc+=dt*timeScale;let n=0;while(acc>=DT&&n<14){fixed(DT);acc-=DT;n++;}if(n>=14)acc=0;
 visuals(dt);}
function flow(dt,skip,leave,sl,sr){phaseT+=dt;
 if(phase==='intro'){if(phaseT>INTRO||skip&&phaseT>.5){phase='countdown';phaseT=0;lastBeep=4;$('intro').hidden=true;CAM.snap=true;}}
 else if(phase==='countdown'){const n=Math.ceil(3-phaseT);if(n!==lastBeep&&n>0){lastBeep=n;snd.play('beep',0);}if(phaseT>=3)go();}
 else if(phase==='play'){goT-=dt;clock-=dt;if(clock<=0){clock=0;rules(dt);if(phase==='play')endRound('time');}else rules(dt);
  if((me.out||me.elim)&&leave&&!show.practice)return leaveShow();}
 else if(phase==='end'){timeScale=phaseT<1.2?.4:1;if(phaseT>2.9){timeScale=1;phase='summary';phaseT=0;fillSummary();}}
 else if(phase==='summary'){if(me.elim&&leave&&R.kind!=='final'&&!show.practice&&phaseT>.3)return leaveShow();if(phaseT>5||skip&&phaseT>.6)nextRound();}
 else if(phase==='crown'){if(phaseT%1.3<dt)confetti.burst(new V(rnd(10)-5,4,CZ+rnd(10)-5),120,9);if(phaseT>6.5||skip&&phaseT>1.5)showOver();}
 // spectating
 if((phase==='play'||phase==='end'||phase==='countdown')&&(me.out||me.elim||!me.inRound)){const al=act.filter(b=>!b.out&&!b.hidden);if(al.length){if(!spec||spec.out||!al.includes(spec)){spec=al.slice().sort((a,b)=>b.p.z-a.p.z)[0];CAM.snap=true;}
  if(sl||sr){const i=al.indexOf(spec);spec=al[(i+(sr?1:-1)+al.length)%al.length];CAM.snap=true;}}}
 else spec=null;}

/* ================= visuals ================= */
function visuals(dt){G.t=time;
 for(const m of W.movers){if(m.vis){m.vis.position.copy(m.visPiv?m.piv:m.c);m.vis.quaternion.copy(m.q);}}
 for(const sw of W.seesaws)sw.col.vis.quaternion.copy(sw.col.q);
 if(R.gate&&R.gate.openT!==undefined){const k=Math.min(1,(time-R.gate.openT)*1.8);R.gate.vis.position.y=R.gate.y0-k*k*3.4;R.gate.vis.visible=k<1;}
 if(R.update)R.update(time,dt,G);
 vis.update(beans,time,dt,cam.position);stage.update(time);puffs.update(dt);sparks.update(dt);confetti.update(dt,time);
 hype=Math.max(0,hype-dt*.2);stage.hype.value=hype;if(snd.ac)snd.hype(hype);
 camUpdate(dt);hud(dt);}

/* ================= camera ================= */
const CAM={yaw:0,pitch:.4,dist:10.5,tgt:new V(0,1,0),pos:new V(0,6,-10),look:new V(),shake:0,snap:true,fov:58};
const cr=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);};
function spline(keys,u,o,off){const n=keys.length-1,f=cl(u,0,.9999)*n,i=Math.floor(f),t=f-i;const k=j=>keys[cl(j,0,n)];for(let a=0;a<3;a++)o.setComponent(a,cr(k(i-1)[a+off],k(i)[a+off],k(i+1)[a+off],k(i+2)[a+off],t));return o;}
const want=new V(),lk=new V();
function camUpdate(dt){let fov=58;const ks=1-Math.exp(-dt*7);
 if(app==='menu'){const p=R.podium,a=Math.sin(time*.22)*.22;want.set(p.x+Math.sin(a)*6,p.y+1.1,p.z-6*Math.cos(a));lk.set(p.x+1.05,p.y+.85,p.z);fov=44;CAM.pos.lerp(want,CAM.snap?1:ks);CAM.look.lerp(lk,CAM.snap?1:ks);CAM.snap=false;CAM.tgt.copy(p);}
 else if(app==='over'||phase==='crown'){const p=show&&show.winner?show.winner.p:me.p,a=time*.22;const r=phase==='crown'?9:8;want.set(p.x+Math.sin(a)*r,p.y+(phase==='crown'?3.2:2.4),p.z+Math.cos(a)*r);
  lk.copy(p).add(tv.set(0,phase==='crown'?2.4:1.2,0));if(app==="over"){tv.set(Math.cos(a),0,-Math.sin(a));lk.addScaledVector(tv,-2.4);}CAM.pos.lerp(want,CAM.snap?1:ks);CAM.look.lerp(lk,CAM.snap?1:ks);CAM.snap=false;CAM.tgt.copy(p);fov=48;}
 else if(phase==='intro'&&R.intro){const u=Math.min(1,phaseT/INTRO),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;spline(R.intro,e,CAM.pos,0);spline(R.intro,e,CAM.look,3);CAM.tgt.copy(CAM.look);fov=55;}
 else{const b=spec||me;const p=b.hidden&&b.respawnT>0&&b.resp?b.resp:b.p;want.set(p.x,p.y+1.5,p.z);if(CAM.snap)CAM.tgt.copy(want);else CAM.tgt.lerp(want,1-Math.exp(-dt*(b.state==='rag'?6:11)));
  if(CAM.snap&&spec)CAM.yaw=spec.yaw;
  const cp=Math.cos(CAM.pitch),dd=CAM.dist;want.set(CAM.tgt.x-Math.sin(CAM.yaw)*cp*dd,CAM.tgt.y+Math.sin(CAM.pitch)*dd,CAM.tgt.z-Math.cos(CAM.yaw)*cp*dd);
  if(spec&&!locked){let d=spec.yaw-CAM.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));CAM.yaw+=d*Math.min(1,dt*.6);}
  CAM.pos.lerp(want,CAM.snap?1:1-Math.exp(-dt*14));CAM.look.copy(CAM.tgt);CAM.snap=false;fov=58+Math.min(6,Math.hypot(b.v.x,b.v.z)*.35);}
 CAM.fov+=(fov-CAM.fov)*Math.min(1,dt*4);cam.fov=CAM.fov;cam.position.copy(CAM.pos);CAM.shake=Math.max(0,CAM.shake-dt*1.6);const s=CAM.shake*CAM.shake*.5;if(s>0)cam.position.add(tv.set(rnd(s)-s/2,rnd(s)-s/2,rnd(s)-s/2));cam.lookAt(CAM.look);
 sun.position.copy(CAM.tgt).addScaledVector(stage.sunDir,130);sun.target.position.copy(CAM.tgt);}

/* ================= HUD ================= */
let feedEl=$('feed');const hc={};
function feed(t,cls){const d=document.createElement('div');d.textContent=t;if(cls)d.className=cls;feedEl.prepend(d);setTimeout(()=>d.remove(),4200);while(feedEl.children.length>5)feedEl.lastChild.remove();}
function banner(t,s,col,dur){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s;$('bs').hidden=!s;$('banner').classList.add('on');banT=dur;}
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function setTxt(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}}
const pv=new V();
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 if(app!=='show'&&app!=='paused')return;const k=R.kind;
 $('top').style.visibility=$('count').style.visibility=phase==='crown'||phase==='intro'?'hidden':'';
 setTxt('clock',fmt(clock));$('clock').classList.toggle('low',phase==='play'&&clock<=10);
 const al=alive().length;let lab='',num='',sub='';
 if(k==='race'){lab='QUALIFIED';num=`${qualCount}/${quota}`;}else if(k==='survival'){lab='ELIMINATED';num=`${startCount-al}/${startCount-quota}`;}else if(k==='tail'){lab='TAILS LEFT';num=String(act.filter(b=>b.tail&&!b.out).length);}
 else if(k==='team'){lab='YOUR TEAM';num=me.inRound?R.teamNames[me.team]:'—';}else if(k==='final'){lab='REMAINING';num=String(al);}
 if(me.elim&&!me.inRound||me.out)sub='SPECTATING';else if(me.finished)sub='YOU QUALIFIED';
 setTxt('clab',lab);setTxt('cnum',num);setTxt('csub',sub);if(k==='team'){setTxt('ts0',String(R.score[0]));setTxt('ts1',String(R.score[1]));$('cnum').style.color=me.inRound?R.teamCols[me.team]:'';}else $('cnum').style.color='';
 let cd='';if(phase==='countdown')cd=String(Math.max(1,Math.ceil(3-phaseT)));else if(phase==='play'&&goT>0)cd='GO!';setTxt('cd',cd);$('cd').classList.toggle('go',cd==='GO!');
 const fr=phase==='countdown'?(3-phaseT)%1:goT;$('cd').style.opacity=cd?Math.min(1,fr*2.5+.2):0;$('cd').style.transform=`scale(${1+(1-Math.min(1,fr))*.25})`;
 let st='',cls='';
 if(phase==='play'||phase==='end'||phase==='countdown'){
  if(me.out||me.elim||!me.inRound){st=spec?`SPECTATING ${spec.name} · ◀ ▶ SWITCH${show.practice?'':' · ENTER LEAVE SHOW'}`:'SPECTATING';}
  else if(me.respawnT>0)st='RESPAWNING...';
  else if(k==='tail'){st=me.tail?'YOU HAVE A TAIL · KEEP IT!':'NO TAIL · GRAB A TAIL-HOLDER (SHIFT)';cls=me.tail?'good':'bad';}
  else if(k==='survival'){st=R.drops.some(d=>pt>d-3&&pt<d)?'THE RING IS FALLING!':'';cls='bad';}
  else if(me.heldBy){st=`${me.heldBy.name} IS GRABBING YOU · JUMP!`;cls='bad';}
  else if(k==='race'&&!me.finished&&phase==='play'&&quota-qualCount<=3&&quota-qualCount>0){st=`ONLY ${quota-qualCount} SPOT${quota-qualCount>1?'S':''} LEFT!`;cls='bad';}}
 setTxt('status',st);$('status').className=cls;
 // name tag
 const tb=spec||me;let tag='';if((phase==='play'||phase==='countdown'||phase==='end')&&tb.inRound&&!tb.hidden&&!tb.out){pv.set(tb.p.x,tb.p.y+2.35,tb.p.z).project(cam);if(pv.z<1){const el=$('tag');el.style.left=((pv.x+1)/2*innerWidth)+'px';el.style.top=((1-pv.y)/2*innerHeight)+'px';tag=tb===me?'YOU':tb.name;}}
 setTxt('tag',tag);}

/* ================= rendering ================= */
const POST={exposure:.93,bloom:.26,bloomThreshold:.94,bloomRadius:.35,vignette:.2,saturation:1.14,grain:.012,aoStrength:.5};
let fx=null,gfx=quality();
function applyQuality(q){gfx=q;sun.castShadow=q>0;const ms=q>=2?2048:1024;sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}RD.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fx=null;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(RD.domElement.width!==Math.floor(w*RD.getPixelRatio())||RD.domElement.height!==Math.floor(h*RD.getPixelRatio())){RD.setSize(w,h,false);if(fx)fx.w=0;}
 if(!fx){fx=cinematic(RD,scene,cam,{...POST,quality:gfx,ao:gfx>=2});fx.w=0;}if(fx.w!==w*9999+h){fx.w=w*9999+h;fx.setSize(w,h);}
 cam.aspect=w/h;cam.updateProjectionMatrix();const sc=h*RD.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));puffs.U.uScale.value=sparks.U.uScale.value=sc;fx.render();}
addEventListener('resize',()=>{if(fx)fx.w=0;});

/* ================= menu wiring ================= */
function seg(id,list,get,set,lock){const el=$(id);el.innerHTML=list.map((x,i)=>`<button data-v="${i}">${x.n||x}${lock&&lock(i)?`<small>${lock(i)}</small>`:''}</button>`).join('');
 el.querySelectorAll('button').forEach(b=>{const i=+b.dataset.v;b.disabled=!!(lock&&lock(i));b.classList.toggle('on',get()===i);b.onclick=()=>{set(i);refreshMenu();};});}
function refreshMenu(){const L=prof.look;
 $('o-show').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',+b.dataset.v===opt.show);b.onclick=()=>{opt.show=+b.dataset.v;refreshMenu();};});
 $('o-diff').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',+b.dataset.v===opt.diff);b.onclick=()=>{opt.diff=+b.dataset.v;refreshMenu();};});
 const ids=Object.keys(ROUNDS).filter(k=>k!=='lobby');seg('o-round',ids.map(k=>ROUNDS[k].name),()=>ids.indexOf(opt.round),i=>opt.round=ids[i]);$('o-round').hidden=$('l-round').hidden=opt.show!==2;
 for(const[id,key]of[['o-c1','c1'],['o-c2','c2']]){const el=$(id);el.innerHTML=COLORS.map(c=>`<button style="background:${c}" class="${L[key]===c?'on':''}" data-c="${c}" title="${c}"></button>`).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{L[key]=b.dataset.c;saveProf();refreshMenu();});}
 seg('o-pat',PATTERNS,()=>L.pat,i=>{L.pat=i;saveProf();},i=>patOK(i)?'':PATTERNS[i].k+'K');
 seg('o-hat',HATS,()=>L.hat,i=>{L.hat=i;saveProf();},i=>hatOK(i)?'':HATS[i].crowns?'1 CROWN':HATS[i].k+'K');
 if(!patOK(L.pat))L.pat=0;if(!hatOK(L.hat))L.hat=0;looks[0]={...L};if(app==='menu')vis.setLook(0,looks[0]);
 $('prof').innerHTML=`<b>${prof.crowns}</b> CROWNS · <b>${prof.kudos}</b> KUDOS · ${prof.shows} SHOWS · BEST ${prof.best||0}`;}
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Tumble Royale\nPoints: ${a.pts||0}\nResult: ${a.won?'crowned':'eliminated'}\nRounds qualified: ${a.best||0} of ${a.rounds||0}\nShow: ${a.show||''} · bots ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] tumble '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.TUMBLE={get state(){return app==='show'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start,toMenu,beans,me,get R(){return R;},get W(){return W;},get show(){return show;},
 setClock(s){clock=s;},get clock(){return clock;},get time(){return time;},get pt(){return pt;},get quota(){return quota;},get qualCount(){return qualCount;},get spec(){return spec;},
 skip(){edge.Space=true;},leave(){edge.Enter=true;},eliminate:b=>eliminate(b),qualify:b=>qualify(b),endRound,leaveShow,alive,act:()=>act,
 setQuality:applyQuality,cam:()=>cam,CAM,keys,PH,scene,RD,sparks,puffs,confetti,DIFF,get fx(){return fx;},
 finishMe(){if(R.kind==='race'){me.place(0,R.finishY+.2,R.finishZ+1.2,0);}},
 kill(b){b.p.y=-60;},stats:()=>act.map(b=>({name:b.name,z:+b.p.z.toFixed(1),y:+b.p.y.toFixed(1),out:b.out,fin:b.finished,tail:b.tail,st:b.state,knocks:b.knocks}))};
