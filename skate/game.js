// SKATE CITY — arcade 3D skateboarding. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {LEVELS,goalList} from './levels.js';
import {World} from './world.js';
import {Skater} from './skater.js';
import {Combo} from './tricks.js';
import {Rig,nameTag,COLORS,DECKS} from './rig.js';
import {AI,AIDIFF} from './ai.js';
import {makeTextures} from './tex.js';
import {makeMaterials,buildLevel} from './build.js';
import {Particles,SpeedLines} from './fx.js';
import {Sound} from './sound.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,fmtN=n=>Math.round(n).toLocaleString('en-US');
const RUN=120,DT=1/120,ID='skatecity',SAVE='pxd_skatecity';
const RIVALS=[{name:'PIP',shirt:'#ffb000',pants:'#3a2a22',shoes:'#1d1d22',cap:'#2e6fe2',skin:'#f1c7a5',deck:4,deckA:'#1d1d22',deckB:'#ffb000'},
 {name:'DASH',shirt:'#2fbf71',pants:'#1d1d22',shoes:'#ffb000',cap:'none',skin:'#7a4a2e',deck:3,deckA:'#0e2a3a',deckB:'#3dd6ff'},
 {name:'RAZOR',shirt:'#1d1d22',pants:'#9aa3ad',shoes:'#d23b2e',cap:'#e23b2e',skin:'#d9a27a',deck:0,deckA:'#1d1d22',deckB:'#ff3fa4'}];

/* ================= save ================= */
function defSave(){return{goals:{},stats:{air:3,speed:3,spin:3,balance:3,flip:3},look:{name:'ROOKIE',shirt:'#e23b2e',pants:'#2a3550',shoes:'#1d1d22',cap:'#1d1d22',skin:'#d9a27a',deck:0,deckA:'#141418',deckB:'#ff4d00'},best:{},opt:{mode:0,level:0,diff:1},music:true};}
let save=defSave();try{const s=JSON.parse(localStorage.getItem(SAVE));if(s)save={...save,...s,look:{...save.look,...s.look},stats:{...save.stats,...s.stats},opt:{...save.opt,...s.opt}};}catch(e){}
const persist=()=>{try{localStorage.setItem(SAVE,JSON.stringify(save));}catch(e){}};
const goalsDone=id=>Object.keys(save.goals[id]||{}).length;
const totalGoals=()=>LEVELS.reduce((a,L)=>a+goalsDone(L.id),0);
const statPoints=()=>2+totalGoals()-Object.values(save.stats).reduce((a,v)=>a+(v-3),0);
const unlocked=i=>i===0||goalsDone(LEVELS[i-1].id)>=4;

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(70,1,.1,1500);
const hemi=new THREE.HemisphereLight(0xffffff,0x444444,1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:160});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;scene.add(sun,sun.target);
const T=makeTextures(),M=makeMaterials(T);
const sparks=new Particles(scene,3000,true),dust=new Particles(scene,1500,false),snd=new Sound(),lines=new SpeedLines($('lines'));
const sparkLight=new THREE.PointLight(0xffa040,0,7,1.6);scene.add(sparkLight);
const ENV={
 indoor:{fog:new THREE.FogExp2(0x24262c,.006),bg:0x1a1c22,hemi:[0xc9d4e8,0x4a3a2c,1.25],sun:[0xfff0d8,5.5],dir:[.42,1,.3],exp:1.05,bloomT:.92},
 day:{fog:new THREE.Fog(0xa9bccb,140,620),hemi:[0xd6e6ff,0x5a4a3a,.7],sun:[0xfff2dc,3.0],dir:[.55,.85,.4],exp:.78,sky:{turb:3.2,ray:1.2,mie:.004,gain:.42},bloomT:.97},
 dusk:{fog:new THREE.Fog(0x5a4258,120,560),hemi:[0xffb08a,0x2a2040,.75],sun:[0xff9a50,3.4],dir:[-.66,.2,-.55],exp:.85,sky:{turb:6,ray:2.8,mie:.008,gain:.32},bloomT:.96}};
let envTex=null,skyMesh=null;
function setEnv(L){const E=ENV[L.env];scene.fog=E.fog;hemi.color.set(E.hemi[0]);hemi.groundColor.set(E.hemi[1]);hemi.intensity=E.hemi[2];sun.color.set(E.sun[0]);sun.intensity=E.sun[1];sunDir.set(...E.dir).normalize();
 if(skyMesh){scene.remove(skyMesh);skyMesh.material.dispose();skyMesh=null;}if(envTex){envTex.dispose();envTex=null;}
 const pm=new THREE.PMREMGenerator(R);
 const mkSky=()=>{const k=new Sky();k.material.uniforms.gain={value:E.sky.gain};k.material.fragmentShader='uniform float gain;\n'+k.material.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );','gl_FragColor = vec4( retColor*gain, 1.0 );');return k;};
 if(E.sky){skyMesh=mkSky();skyMesh.scale.setScalar(1200);const u=skyMesh.material.uniforms;u.turbidity.value=E.sky.turb;u.rayleigh.value=E.sky.ray;u.mieCoefficient.value=E.sky.mie;u.mieDirectionalG.value=.8;u.sunPosition.value.copy(sunDir).multiplyScalar(100);
  const es=new THREE.Scene();const s2=mkSky();s2.scale.setScalar(1000);s2.material.uniforms.sunPosition.value.copy(sunDir);for(const k of['turbidity','rayleigh','mieCoefficient'])s2.material.uniforms[k].value=u[k].value;es.add(s2);envTex=pm.fromScene(es,.03).texture;scene.add(skyMesh);scene.background=null;}
 else{const es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.16,.14,.12),vec3(.22,.24,.28),smoothstep(-.3,.4,h));gl_FragColor=vec4(c,1.);}'})));
  const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(9,9,8.5),side:THREE.DoubleSide});for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(10,6),lm);m.position.set(-24+i*12,30,(i%2?-6:8));m.rotation.x=Math.PI/2;es.add(m);}
  envTex=pm.fromScene(es,.02).texture;scene.background=new THREE.Color(E.bg);}
 pm.dispose();scene.environment=envTex;for(const k of['facB','facG','facS','school','gym'])M[k].m.emissiveIntensity=L.env==='day'?.22:1.1;R.toneMappingExposure=E.exp;POST.exposure=E.exp;POST.bloomThreshold=E.bloomT;fx=null;}
const sunDir=new V(.5,.8,.4).normalize();

/* ================= level ================= */
let L=null,world=null,lvl=null,li=-1;
function loadLevel(i){if(li===i&&world)return;li=i;L=LEVELS[i];if(lvl){scene.remove(lvl.root);lvl.dispose();}world=new World(L);lvl=buildLevel(L,world,M,T);scene.add(lvl.root);setEnv(L);
 sparks.ground=dust.ground=(x,z)=>world.H(x,z);sparks.clear();dust.clear();for(const s of skaters)s.sk.world=world;}

/* ================= skaters ================= */
let skaters=[],player=null,rival=null;
function makeSkater(look,stats,isAI,diff){const combo=new Combo();const sk=new Skater(world,{combo,stats,ev,name:look.name});const rig=new Rig(scene,look);
 const o={sk,rig,combo,look,isAI,score:0,ai:null,tag:null};if(isAI){o.ai=new AI(sk,L,diff);o.ai.onRespawn=()=>{rig.rag=null;};}skaters.push(o);sk.owner=o;return o;}
function removeSkater(o){if(!o)return;o.rig.dispose();if(o.tag)scene.remove(o.tag);skaters=skaters.filter(s=>s!==o);}
function rebuildPlayer(){const pos=player?player.sk.p.clone():null;removeSkater(player);player=makeSkater(save.look,save.stats,app==='menu',AIDIFF[2]);if(app==='menu'){player.ai.line=L.line;}placeAtSpawn(player);}
function placeAtSpawn(o){const[x,z,yaw]=L.spawn;o.sk.reset(x,z,yaw);o.sk.v.set(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(4);o.rig.rag=null;if(o.ai){o.ai.line=L.line;o.ai.nearestStart();}}

/* ================= run state ================= */
let app='menu',run=null,time=0,acc=0,camMode=0,shake=0,introT=0;
function newRun(){return{score:0,letters:[0,0,0,0,0],tape:false,gaps:new Set(),best:0,tricks:0,banks:0,bails:0,newGoals:[],clock:RUN,phase:'intro',endT:0,lastT:0,vs:save.opt.mode===1,diff:save.opt.diff,rivalScore:0,longGrind:0,maxAir:0};}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(save.opt,o);persist();snd.init();snd.music=save.music;
 if(!unlocked(save.opt.level))save.opt.level=0;app='run';loadLevel(save.opt.level);run=newRun();
 removeSkater(player);removeSkater(rival);player=makeSkater(save.look,save.stats,false);placeAtSpawn(player);rival=null;
 if(run.vs){const rl=RIVALS[run.diff];rival=makeSkater(rl,{air:4+run.diff*2,speed:4+run.diff*2,spin:4+run.diff*2,balance:4+run.diff*2,flip:4+run.diff*2},true,AIDIFF[run.diff]);placeAtSpawn(rival);rival.sk.reset(L.spawn[0]+2,L.spawn[1],L.spawn[2]);rival.ai.nearestStart();rival.tag=nameTag(rl.name,'#3dd6ff');scene.add(rival.tag);}
 for(const l of lvl.letters)l.got=false;lvl.tape.got=false;
 $('menu').hidden=true;$('keys').hidden=true;$('goalsCard').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('skater').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');
 $('rival').hidden=!run.vs;$('lvl').textContent=L.name+(run.vs?' · VS '+RIVALS[run.diff].name:'');
 $('iEye').textContent=(run.vs?'VS RIVAL · ':'CAREER · ')+L.sub.toUpperCase();$('iName').textContent=L.name;$('iGoals').innerHTML=goalList(L).map(g=>`<li class="${save.goals[L.id]?.[g.id]?'done':''}">${g.text}</li>`).join('');$('intro').hidden=false;
 introT=0;camSnap=true;comboShow=0;$('combo').className='';hc={};sparks.clear();dust.clear();}
function toMenu(){app='menu';run=null;removeSkater(rival);rival=null;if(!unlocked(save.opt.level))save.opt.level=0;loadLevel(save.opt.level);removeSkater(player);player=makeSkater(save.look,save.stats,true,AIDIFF[2]);placeAtSpawn(player);
 $('menu').hidden=false;$('keys').hidden=false;$('goalsCard').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;document.body.classList.remove('playing');menuUI();camSnap=true;}
function pause(on){if(on&&app==='run'){app='paused';$('pause').hidden=false;$('pGoals').innerHTML=goalList(L).map(g=>`<li class="${save.goals[L.id]?.[g.id]?'done':''}">${g.text}</li>`).join('');document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='run';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= events from skaters ================= */
const tv=new V();
function ev(type,sk,a,b){const o=sk.owner,me=o===player&&app==='run',c=o&&o.combo;
 switch(type){
  case'ollie':if(me||!o.isAI||app==='menu')snd.play('pop');dust.burst(tv.copy(sk.p).setY(sk.p.y+.05),8,2,[new THREE.Color(.5,.48,.45)],.5,.5,{up:true,grav:2,drag:3});break;
  case'land':if(near(sk))snd.play('land',a);if(a>5)dust.burst(tv.copy(sk.p).setY(sk.p.y+.05),Math.min(30,a*2)|0,3,[new THREE.Color(.55,.52,.48)],.6,.6,{up:true,grav:1,drag:3});if(me)shake=Math.max(shake,Math.min(.25,a*.02));if(me&&b)run.maxAir=Math.max(run.maxAir,b);break;
  case'bump':if(near(sk))snd.play('bump');if(me)shake=Math.max(shake,.2);break;
  case'trick':if(me){trickName(a,b);run.tricks++;if(b)snd.play('special');else snd.play('trick');}break;
  case'grind':if(me){trickName(a,b);run.tricks++;}if(near(sk))snd.play('grind');break;
  case'lip':if(me){trickName(a);run.tricks++;}break;
  case'spark':{const g=a;if(Math.random()<.7){const s=g.slide?1.6:1;tv.copy(sk.p);tv.y+=.04;const d=sk.v;for(let i=0;i<(g.def.special?4:2);i++)sparks.emit(tv.x,tv.y,tv.z,-d.x*.25+(Math.random()-.5)*3*s,1+Math.random()*2.5,-d.z*.25+(Math.random()-.5)*3*s,3,1.6+Math.random(),.4,.07+Math.random()*.05,.25+Math.random()*.35,14,1.2);}
   if(o===player){sparkLight.position.copy(sk.p);sparkLight.position.y+=.2;sparkLight.intensity=6+Math.random()*8;}break;}
  case'gap':if(me){pop(a.name,'gap','+'+a.pts);snd.play('gap');run.gaps.add(a.name);checkGoals();}break;
  case'specialReady':if(me){pop('SPECIAL!','sp');snd.play('special');}break;
  case'bank':{const pts=a;if(o.isAI&&run){o.score+=pts*o.ai.d.mult;run.rivalScore=o.score;}
   if(me){run.score+=pts;run.banks++;run.best=Math.max(run.best,pts);comboFlash('bank',pts);if(pts>=1000)snd.play('bank');checkGoals();}break;}
  case'bail':{o.rig.startRag(sk.v.clone(),sk.v.clone().multiplyScalar(.7).add(new V(0,3,0)));if(near(sk))snd.play(a==='splash'?'splash':'bail');if(a==='splash')dust.burst(tv.copy(sk.p).setY(.5),60,5,[new THREE.Color(.7,.85,1)],.4,1,{up:true,grav:9,drag:.5});
   if(me){run.bails++;shake=.6;comboFlash('bail',b);pop(a==='splash'?'SPLASH!':'BAIL!','bail');}break;}
 }}
const near=sk=>!cam||sk.p.distanceToSquared(cam.position)<900;
let lastTrickT=0;function trickName(n,sp){const el=$('tname');el.textContent=n;el.className='';void el.offsetWidth;el.className='on'+(sp?' sp':'');}
let comboShow=0,comboKind='',comboPts=0;function comboFlash(k,pts){comboKind=k;comboPts=pts;comboShow=k==='bail'?1.4:1.6;}
function pop(text,cls,sub){const d=document.createElement('div');d.className='pop '+(cls||'');d.innerHTML=text+(sub?`<small>${sub}</small>`:'');$('pops').appendChild(d);setTimeout(()=>d.remove(),1750);while($('pops').children.length>4)$('pops').firstChild.remove();}

/* ================= goals ================= */
function checkGoals(){if(!run)return;const g=L.goals,S=save.goals[L.id]||(save.goals[L.id]={});const test={hs:run.score>=g.score[0],pro:run.score>=g.score[1],sick:run.score>=g.score[2],skate:run.letters.every(x=>x),tape:run.tape,gaps:g.gaps.every(n=>run.gaps.has(n)),combo:run.best>=g.combo};
 for(const it of goalList(L)){if(!S[it.id]&&test[it.id]){S[it.id]=1;run.newGoals.push(it.id);pop('GOAL COMPLETE','goal',it.text.toUpperCase());snd.play('goal');persist();}}}
function pickups(){if(!run||run.phase==='intro')return;const sk=player.sk;if(sk.mode==='bail')return;const c=tv.set(0,.9,0).applyQuaternion(sk.visQ).add(sk.p);
 lvl.letters.forEach((l,i)=>{if(!l.got&&c.distanceTo(l.pos)<1.3){l.got=true;run.letters[i]=1;pop(l.ch+'!','letter',run.letters.every(x=>x)?'S-K-A-T-E COMPLETE':'');snd.play('letter');sparks.burst(l.pos,60,6,[new THREE.Color(3,1.4,.3),new THREE.Color(3,2.4,.8)],.25,.9,{grav:4,drag:1.2});checkGoals();}});
 const t=lvl.tape;if(!t.got&&c.distanceTo(t.pos)<1.35){t.got=true;run.tape=true;pop('SECRET TAPE!','tape');snd.play('tape');sparks.burst(t.pos,90,7,[new THREE.Color(2.4,.6,2.6),new THREE.Color(.6,2,3)],.3,1.1,{grav:3,drag:1});checkGoals();}}

/* ================= input ================= */
const keys={},edge={};let seqU=-9,seqD=-9;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;const rep=e.repeat;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(app==='run')pause(true);else if(app==='paused')pause(false);else if(!$('skater').hidden)closeEditor();}
 if(rep)return;const t=performance.now()/1000;
 if(e.code==='KeyW'||e.code==='ArrowUp'){if(t-seqD<.32)queueManual('nose');seqU=t;}
 if(e.code==='KeyS'||e.code==='ArrowDown'){if(t-seqU<.32)queueManual('man');seqD=t;}
 if(e.code==='KeyI')queueManual(keys.KeyS||keys.ArrowDown?'nose':'man');
 if(e.code==='KeyC')camMode=(camMode+1)%2;
 if(e.code==='KeyN'){save.music=!save.music;snd.music=save.music;persist();}
 if(e.code==='KeyR'&&app==='run'&&player&&player.sk.mode!=='bail'&&run.phase==='play'){player.combo.fail();player.sk.respawn(player.sk.p.x,player.sk.p.z);}});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
let manQ=null;function queueManual(k){manQ=k;}
const any=a=>a.some(k=>keys[k]);let padPrev={};
function readPlayer(){const c=player.sk.ctl;c.x=(any(['KeyD','ArrowRight'])?1:0)-(any(['KeyA','ArrowLeft'])?1:0);c.y=(any(['KeyW','ArrowUp'])?1:0)-(any(['KeyS','ArrowDown'])?1:0);
 c.ollie=!!keys.Space;c.flip=!!keys.KeyJ;c.grab=!!keys.KeyK;c.grind=!!keys.KeyL;c.revert=any(['KeyQ','KeyE']);c.special=any(['ShiftLeft','ShiftRight']);
 const g=gp();if(g){const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.25?v:0;const sx=dz(ax[0]||0),sy=dz(ax[1]||0);if(sx)c.x=sx;if(sy)c.y=-sy;
  if(bt[12]?.pressed)c.y=1;if(bt[13]?.pressed)c.y=-1;if(bt[14]?.pressed)c.x=-1;if(bt[15]?.pressed)c.x=1;
  if(bt[0]?.pressed)c.ollie=true;if(bt[2]?.pressed)c.flip=true;if(bt[1]?.pressed)c.grab=true;if(bt[3]?.pressed)c.grind=true;if(bt[4]?.pressed||bt[5]?.pressed)c.revert=true;if((bt[6]?.value||0)>.4)c.special=true;
  const rt=(bt[7]?.value||0)>.4;if(rt&&!padPrev.rt)manQ=c.y<-.4?'nose':'man';padPrev.rt=rt;
  if(bt[9]?.pressed&&!padPrev.st)pause(app==='run');padPrev.st=bt[9]?.pressed;if(bt[0]?.pressed&&!padPrev.a)edge.PadA=true;padPrev.a=bt[0]?.pressed;}
 if(manQ){if(manQ==='nose')c.nose=true;else c.manual=true;manQ=null;}}
function gp(){const l=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];return l[0]||null;}

/* ================= simulation ================= */
function fixed(dt){for(const o of skaters)o.sk.step(dt);}
function step(dt){dt=Math.min(dt,.1);time+=dt;const skip=edge.Space||edge.Enter||edge.PadA;for(const k in edge)delete edge[k];
 const g=gp();if(g&&app!=='run'){const a=g.buttons[0]?.pressed,s=g.buttons[9]?.pressed;if(app==='paused'&&s&&!padPrev.st)pause(false);else if((app==='menu'||app==='over')&&a&&!padPrev.a&&$('skater').hidden)start();padPrev.a=a;padPrev.st=s;}
 if(app==='paused'){visuals(0);return;}
 if(app==='run'){const r=run;
  if(r.phase==='intro'){introT+=dt;if((skip&&introT>.4)||introT>4.5){r.phase='play';$('intro').hidden=true;snd.play('beep',1);}}
  else if(r.phase==='play'){r.clock-=dt;const s=Math.ceil(r.clock);if(s<=5&&s>0&&s!==r.lastT){r.lastT=s;snd.play('beep',0);}if(r.clock<=0){r.clock=0;r.phase='last';r.endT=0;snd.play('horn');}}
  else if(r.phase==='last'){r.endT+=dt;const sk=player.sk;if(r.endT>10||(!player.combo.active&&(sk.mode==='ground'||sk.mode==='bail')&&sk.landWin<=0&&!sk.man)){if(player.combo.active&&sk.mode!=='bail')sk.bank();r.phase='end';r.endT=0;}}
  else if(r.phase==='end'){r.endT+=dt;if(r.endT>1.2){showOver();return;}}
  if(r.phase!=='intro'&&r.phase!=='end'){if(!player.ai)readPlayer();}else{const c=player.sk.ctl;c.x=c.y=0;c.ollie=c.flip=c.grab=c.grind=false;}}
 for(const o of skaters)if(o.ai){if(app==='run'&&run.phase==='intro'){o.sk.ctl.x=o.sk.ctl.y=0;continue;}o.ai.update(dt);}
 if(!(app==='run'&&run.phase==='intro')){acc+=dt;let n=0;while(acc>=DT&&n<14){fixed(DT);acc-=DT;n++;}if(n>=14)acc=0;}
 // bails recover after the ragdoll settles
 for(const o of skaters){const sk=o.sk;if(sk.mode==='bail'&&(sk.bailT>2.2||(o===player&&sk.bailT>1.1&&(skip||any(['KeyJ','KeyK','KeyL']))))){const c=o.rig.ragCenter();sk.respawn(c.x,c.z);o.rig.rag=null;}}
 if(app==='run')pickups();
 visuals(dt);}

/* ================= visuals ================= */
function visuals(dt){for(const o of skaters){o.rig.update(o.sk,dt);if(o.tag){o.tag.position.copy(o.sk.mode==='bail'?o.rig.ragCenter():o.sk.p).add(tv.set(0,2.35,0));}}
 sparks.update(dt);dust.update(dt);sparkLight.intensity*=Math.exp(-dt*20);if(lvl)lvl.update(time);
 const sk=player?player.sk:null;lines.update(dt,app==='run'&&sk&&sk.mode!=='bail'?cl((sk.speed-10.5)/5,0,1)+(sk.special>=1&&sk.mode==='air'?.3:0):0);
 snd.update(dt,app==='run'?sk:null);cameraUpdate(dt);hud(dt);
 // sun + shadow box follow the action
 const f=player?player.sk.p:new V();sun.target.position.copy(f);sun.position.copy(f).addScaledVector(sunDir,70);}

/* ================= camera ================= */
const cpos=new V(),clook=new V(),cdir=new V(0,0,-1);let camSnap=true,orbit=0;
function cameraUpdate(dt){if(!player)return;const sk=player.sk,o=player;
 if(app==='run'&&run.phase==='intro'){orbit+=dt*.35;const p=sk.p;const a=orbit+L.spawn[2]+Math.PI;cam.position.set(p.x+Math.sin(a)*7,p.y+2.6,p.z+Math.cos(a)*7);keepIn(cam.position,new V(p.x,p.y+1,p.z));cam.lookAt(p.x,p.y+1,p.z);cam.fov=60;cam.updateProjectionMatrix();cpos.copy(cam.position);clook.set(p.x,p.y+1,p.z);cdir.set(-Math.sin(L.spawn[2]+Math.PI),0,-Math.cos(L.spawn[2]+Math.PI));camSnap=false;return;}
 if(app==='over'){orbit+=dt*.25;const p=sk.mode==='bail'?o.rig.ragCenter():sk.p;const a=orbit;cam.position.set(p.x+Math.sin(a)*5.5,p.y+2,p.z+Math.cos(a)*5.5);keepIn(cam.position,tv.set(p.x,p.y+1,p.z));cam.lookAt(p.x,p.y+1,p.z);cam.fov=55;cam.updateProjectionMatrix();return;}
 const v=sk.v,hs=Math.hypot(v.x,v.z),m=sk.mode;let target=tv;
 const vert=(m==='air'&&sk.air&&sk.air.vert)||(m==='ground'&&sk.n.y<.6)||m==='lip';
 if(!vert&&m!=='bail'&&hs>(m==='air'?2:.8)){const a=Math.atan2(cdir.x,cdir.z),b=Math.atan2(v.x,v.z);let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;const na=a+d*Math.min(1,dt*(m==='grind'?4:3.2));cdir.set(Math.sin(na),0,Math.cos(na));}
 const menu=app==='menu';const far=camMode===1||menu;const dist=(far?7.4:5.4)+Math.min(1.6,sk.speed*.05),hgt=(far?2.9:2.05)+(vert?.8:0);
 const P=m==='bail'?o.rig.ragCenter():sk.p;
 const want=new V(P.x-cdir.x*dist,P.y+hgt,P.z-cdir.z*dist),look=new V(P.x+cdir.x*1.6,P.y+1.05,P.z+cdir.z*1.6);
 if(vert){want.y=Math.max(P.y+.6,(sk.air?sk.air.y:P.y)*.5+P.y*.5+1.4);look.set(P.x,P.y+.8,P.z);}
 if(menu){orbit+=dt*.12;const a=Math.atan2(cdir.x,cdir.z)+Math.sin(orbit)*.9;want.set(P.x-Math.sin(a)*dist,P.y+hgt+.6,P.z-Math.cos(a)*dist);}
 keepIn(want,tv.set(P.x,P.y+1,P.z));
 if(camSnap){cpos.copy(want);clook.copy(look);camSnap=false;}else{const kh=1-Math.exp(-dt*7),kv=1-Math.exp(-dt*(vert?3:6)),kl=1-Math.exp(-dt*12);cpos.x+=(want.x-cpos.x)*kh;cpos.z+=(want.z-cpos.z)*kh;cpos.y+=(want.y-cpos.y)*kv;clook.lerp(look,kl);}
 const gh=world.H(cpos.x,cpos.z);if(cpos.y<gh+.5)cpos.y=gh+.5;if(L.env==='indoor')cpos.y=Math.min(cpos.y,11.5);
 cam.position.copy(cpos);shake=Math.max(0,shake-dt*1.8);if(shake>0){const s=shake*shake*.4;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;}
 cam.lookAt(clook);const fv=66+Math.min(14,sk.speed*.55)+(sk.special>=1?3:0);cam.fov+=(fv-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();}
// pull the camera in front of walls / ramps between it and the skater
function keepIn(want,look){const n=14;let ok=1;for(let i=1;i<=n;i++){const t=i/n,x=look.x+(want.x-look.x)*t,y=look.y+(want.y-look.y)*t,z=look.z+(want.z-look.z)*t;if(world.H(x,z)>y-.35){ok=(i-1)/n;break;}}
 if(ok<1){const t=Math.max(.15,ok);want.set(look.x+(want.x-look.x)*t,look.y+(want.y-look.y)*t+(1-t)*1.2,look.z+(want.z-look.z)*t);}
 const b=L.bounds;want.x=cl(want.x,b[0]+.4,b[1]-.4);want.z=cl(want.z,b[2]+.4,b[3]-.4);}

/* ================= HUD ================= */
let hc={};const setT=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}};
const fmtT=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function hud(dt){if(app!=='run'&&app!=='paused')return;const r=run,sk=player.sk,c=player.combo;
 setT('score',fmtN(r.score));setT('clock',r.phase==='last'?'0:00':fmtT(r.clock));setT('clockS',r.phase==='last'?'FINISH IT':'TIME');
 const cw=$('clockW');cw.classList.toggle('low',r.phase==='play'&&r.clock<=10);cw.classList.toggle('ot',r.phase==='last');
 const lt=r.letters.join('')+(r.tape?1:0);if(hc.lt!==lt){hc.lt=lt;[...$('letters').children].forEach((e,i)=>e.classList.toggle('on',i<5?!!r.letters[i]:r.tape));}
 const sp=Math.round(sk.special*100);if(hc.sp!==sp){hc.sp=sp;$('specF').style.width=sp+'%';$('spec').classList.toggle('full',sp>=100);}
 if(r.vs){const rs=`RIVAL · <b>${rival.look.name}</b> ${fmtN(r.rivalScore)}`;if(hc.rv!==rs){hc.rv=rs;$('rival').innerHTML=rs;}}
 // combo
 const el=$('combo');comboShow=Math.max(0,comboShow-dt);
 if(c.active){const txt=c.list.slice(-6).map(e=>e.gap?`<span class="gap">${e.name}</span>`:e.name).join(' + ');const k=txt+c.mult;if(hc.ct!==k){hc.ct=k;$('ctricks').innerHTML=(c.list.length>6?'… + ':'')+txt;}
  const s=`${fmtN(c.base)}<small>×</small>${c.mult}`;if(hc.cs!==s){hc.cs=s;$('cscore').innerHTML=s;}el.className='on';hc.kind='';}
 else if(comboShow>0){if(hc.kind!==comboKind){hc.kind=comboKind;$('cscore').innerHTML=(comboKind==='bail'?'BAIL ':'+')+fmtN(comboPts);hc.cs='';}el.className='on '+comboKind;if(comboShow<.3)el.className=comboKind;}
 else{el.className='';hc.kind='';}
 // balance meter
 const b=$('bal'),bo=sk.grind||sk.man||sk.lip;if(bo){const v=sk.grind?0:1;b.className='on'+(v?' v':'');const n=cl(bo.bal,-1,1);b.firstChild.style[v?'top':'left']=(v?50-n*50:50+n*50)+'%';}else if(b.className)b.className='';}

/* ================= results ================= */
let lastAward=null;
function showOver(){app='over';$('hud').hidden=true;document.body.classList.remove('playing');const r=run;
 const won=r.vs?r.score>r.rivalScore:r.newGoals.length>0;const best0=save.best[L.id]||0;const nb=r.score>best0;if(nb){save.best[L.id]=r.score;persist();}
 $('oeye').textContent=`TIME'S UP · ${L.name}${r.vs?' · VS '+rival.look.name:''}`;
 $('ores').textContent=r.vs?(won?'YOU WIN':'RIVAL WINS'):r.score>=L.goals.score[2]?'SICK RUN':r.score>=L.goals.score[1]?'PRO RUN':r.score>=L.goals.score[0]?'NICE RUN':'KEEP PUSHING';$('ores').style.color=r.vs?(won?'#5dff9a':'#ff3f5a'):'';
 $('ofs').textContent=fmtN(r.score)+(nb?'  · NEW BEST':'');$('ovs').innerHTML=r.vs?`You ${fmtN(r.score)} — <b>${rival.look.name}</b> ${fmtN(r.rivalScore)}`:'';
 $('stats').innerHTML=[['Best combo',fmtN(r.best)],['Combos landed',r.banks],['Tricks',r.tricks],['Gaps found',`${r.gaps.size} / ${L.gaps.length}`],['Letters',`${r.letters.filter(x=>x).length} / 5`],['Secret tape',r.tape?'FOUND':'—'],['Bails',r.bails]].map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');
 $('oGoals').innerHTML=goalList(L).map(g=>`<li class="${save.goals[L.id]?.[g.id]?'done':''} ${r.newGoals.includes(g.id)?'new':''}">${g.text}</li>`).join('');
 const tok=award(won);const nx=LEVELS[li+1];$('next').hidden=!nx||!unlocked(li+1);
 const unlockedNow=nx&&unlocked(li+1)&&goalsDone(L.id)-r.newGoals.length<4;
 $('otok').textContent=`+${tok} TOKENS · BEST ${fmtN(save.best[L.id]||0)}`+(r.newGoals.length?` · +${r.newGoals.length} STAT POINT${r.newGoals.length>1?'S':''}`:'')+(unlockedNow?` · ${nx.name} UNLOCKED!`:'');
 $('over').hidden=false;}
function award(won){const pts=run.score;lastAward={pts,won,level:L.name,best:run.best,goals:goalsDone(L.id),vs:run.vs?`${rival.look.name} ${fmtN(run.rivalScore)}`:''};
 const tok=5+Math.min(60,pts/1500|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}

/* ================= rendering ================= */
const POST={exposure:1,bloom:.38,bloomThreshold:.92,bloomRadius:.45,vignette:.3,saturation:1.08,grain:.02};
let fx=null,gfx=quality();
function applyQuality(q){gfx=q;R.shadowMap.enabled=q>0;sun.castShadow=q>0;const ms=q>=2?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
 scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined&&o.isMesh)o.material.needsUpdate=true;});fx=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);fx=null;}
 cam.aspect=w/h;cam.updateProjectionMatrix();sparks.U.uScale.value=dust.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 if(!fx){fx=cinematic(R,scene,cam,{...POST,quality:gfx,ao:gfx>=2});fx.setSize(w,h);if(fx.ao){const ov=fx.ao.overrideVisibility.bind(fx.ao);fx.ao.overrideVisibility=()=>{ov();scene.traverse(o=>{if(o.userData.noAO)o.visible=false;});};}}fx.render();}

/* ================= menu ================= */
function menuUI(){const o=save.opt;
 $('parks').innerHTML=LEVELS.map((P,i)=>`<button data-i="${i}" class="${i===o.level?'on':''} ${unlocked(i)?'':'lock'}"><b>${P.name}</b><span>${unlocked(i)?goalsDone(P.id)+' / 7 GOALS · BEST '+fmtN(save.best[P.id]||0):'COMPLETE 4 GOALS IN '+LEVELS[i-1].name}</span></button>`).join('');
 $('parks').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(!unlocked(i))return;snd.init();save.opt.level=i;persist();loadLevel(i);placeAtSpawn(player);camSnap=true;menuUI();});
 seg('o-mode','mode');seg('o-diff','diff');$('o-diff').style.visibility=$('diffL').style.visibility=o.mode===1?'visible':'hidden';
 const P=LEVELS[o.level];$('gcName').innerHTML=P.name+'<em>.</em>';$('gcList').innerHTML=goalList(P).map(g=>`<li class="${save.goals[P.id]?.[g.id]?'done':''}">${g.text}</li>`).join('');$('gcInfo').textContent=`${totalGoals()} / ${LEVELS.length*7} goals complete · stat points ${statPoints()}`;}
function seg(id,key){const el=$(id);el.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',+b.dataset.v===save.opt[key]);b.onclick=()=>{save.opt[key]=+b.dataset.v;persist();menuUI();};});}
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;$('restart').onclick=()=>{app='run';start();};
$('next').onclick=()=>{if(unlocked(li+1)){save.opt.level=li+1;start();}};
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Skate City\nPoints: ${a.pts||0}\nPark: ${a.level||''}\nBest combo: ${a.best||0}\nGoals: ${a.goals||0}/7${a.vs?'\nRival: '+a.vs+(a.won?' (won)':' (lost)'):''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};
// skater editor
const STATN={air:'AIR',speed:'SPEED',spin:'SPIN',balance:'BALANCE',flip:'FLIP'};
function openEditor(){$('skater').hidden=false;$('sName').value=save.look.name;editorUI();}
function closeEditor(){$('skater').hidden=true;save.look.name=($('sName').value||'ROOKIE').toUpperCase().slice(0,10);persist();if(app==='menu')rebuildPlayer();menuUI();}
function editorUI(){const lk=save.look;let h='';for(const k of['shirt','pants','shoes','cap','skin']){h+=`<div class="ed"><label>${k.toUpperCase()}</label><div class="sw">${COLORS[k].map(c=>c==='none'?`<button class="txt ${lk[k]===c?'on':''}" data-k="${k}" data-c="${c}">NO CAP</button>`:`<button style="background:${c}" class="${lk[k]===c?'on':''}" data-k="${k}" data-c="${c}"></button>`).join('')}</div></div>`;}
 h+=`<div class="ed"><label>DECK</label><div class="sw">${DECKS.map((d,i)=>`<button class="txt ${lk.deck===i?'on':''}" data-k="deck" data-c="${i}">${d.toUpperCase()}</button>`).join('')}</div></div>`;
 $('sColors').innerHTML=h;$('sColors').querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;save.look[k]=k==='deck'?+b.dataset.c:b.dataset.c;persist();rebuildPlayer();editorUI();});
 const pts=statPoints();$('sPts').textContent=`· ${pts} POINT${pts===1?'':'S'} TO SPEND`;
 $('sStats').innerHTML=Object.keys(STATN).map(k=>`<div class="st"><span>${STATN[k]}</span><div class="bar"><i style="width:${save.stats[k]*10}%"></i></div><div><button data-k="${k}" data-d="-1">−</button><button data-k="${k}" data-d="1">+</button></div></div>`).join('');
 $('sStats').querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,d=+b.dataset.d,v=save.stats[k]+d;if(v<1||v>10)return;if(d>0&&statPoints()<=0)return;save.stats[k]=v;persist();editorUI();});}
$('edit').onclick=openEditor;$('sDone').onclick=closeEditor;

/* ================= loop ================= */
loadLevel(unlocked(save.opt.level)?save.opt.level:0);toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.SKATE={get state(){return app==='run'?run.phase:app;},get app(){return app;},step,render,start,toMenu,pause,
 get run(){return run;},get player(){return player;},get rival(){return rival;},get world(){return world;},get level(){return L;},get levels(){return LEVELS;},get save(){return save;},get skaters(){return skaters;},
 setClock(s){if(run){run.clock=s;if(run.phase==='intro'){run.phase='play';$('intro').hidden=true;}}},get clock(){return run?run.clock:0;},keys,
 skipIntro(){if(run&&run.phase==='intro'){run.phase='play';$('intro').hidden=true;}},
 teleport(x,z,yaw,speed=0){const sk=player.sk;sk.reset(x,z,yaw);sk.v.set(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(speed);camSnap=true;},
 collect(){if(!run)return;lvl.letters.forEach((l,i)=>{const sk=player.sk;sk.p.copy(l.pos).add(new V(0,-.9,0));pickups();});const t=lvl.tape;player.sk.p.copy(t.pos).add(new V(0,-.9,0));pickups();},
 addScore(n){if(run){run.score+=n;run.best=Math.max(run.best,n);checkGoals();}},endRun(){if(run){run.clock=0;run.phase='end';run.endT=0;}},
 resetSave(){save=defSave();persist();menuUI();},setQuality:applyQuality,get gfx(){return gfx;},scene,R,cam,sparks,lvl:()=>lvl,
 get camInfo(){return{cam:cam.position.toArray().map(v=>+v.toFixed(2)),dir:cdir.toArray().map(v=>+v.toFixed(2)),look:clook.toArray().map(v=>+v.toFixed(2))};},autopilot(d=2){player.ai=new AI(player.sk,L,AIDIFF[d]);player.ai.nearestStart();},setRivalScore(n){if(rival){rival.score=n;run.rivalScore=n;}}};
