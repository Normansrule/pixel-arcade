// PET BRAWL — 3D team auto-battler for Pixel Arcade (original game).
// Shop phase (60 s timer): buy, feed, merge, freeze, roll, sell. Battle phase: teams fight on their own, played back
// from a simulated event log with lunges, damage numbers, ability callouts and faint effects. Win 10 trophies.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {ID,PETS,TOKENS,FOODS,PERKS,TRIG,petById,foodById,tierFor,fmtTx} from './data.js';
import * as S from './sim.js';
import {Diorama,makeFood,TEAM_X,TEAM_Z,SHOP_Y,SHOP_Z,shopX,BAT_X,BAT_Z} from './scene.js';
import {makePet} from './models.js';
import {Sound} from './sound.js';

const $=id=>document.getElementById(id);
const SHOP_TIME=60,FACE_TEAM=Math.PI/2-.42,FACE_SHOP=.25;
const KEYS_TEAM=['KeyB','KeyV','KeyC','KeyX','KeyZ'];// slot 0 (front, right) .. slot 4 (back, left)
const KEY_LABEL=['B','V','C','X','Z'];

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const D=new Diorama(R);const snd=new Sound();
let gfx=quality(),fxP=null;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));D.sun.castShadow=q>0;fxP=null;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= state ================= */
let G=null,app='menu',shopT=SHOP_TIME,sel=null,drag=null,hoverK=null,B=null,speed=1,diff=1,lastAward=null,time=0,indexOpen=false,lastTick=0,pendingBattle=null;
try{diff=+(localStorage.getItem('pxd_petbrawl_diff')??1);}catch(e){}
const selRing=new THREE.Mesh(new THREE.TorusGeometry(.8,.06,6,40),new THREE.MeshBasicMaterial({color:0xff4d00}));selRing.rotation.x=Math.PI/2;selRing.visible=false;D.scene.add(selRing);

/* ================= HTML overlays ================= */
const BD=new Map();const badges=$('badges'),fxl=$('fxl');
function badgeFor(key){let b=BD.get(key);if(!b){const el=document.createElement('div');el.className='bd';el.innerHTML='<b class="atk"></b><b class="hp"></b>';const lv=document.createElement('div');lv.className='lvb';const tag=document.createElement('div');tag.className='tag';badges.append(el,lv,tag);b={el,lv,tag,last:{}};BD.set(key,b);}return b;}
function dropBadge(key){const b=BD.get(key);if(b){b.el.remove();b.lv.remove();b.tag.remove();BD.delete(key);}}
const W=()=>innerWidth,H=()=>innerHeight;
function screenOf(v,dy=0){const p=v.g.position.clone();p.y+=dy;return D.project(p,W(),H());}
function floatText(v,txt,cls,dy=1.6){if(!v)return;const s=screenOf(v,dy);const e=document.createElement('div');e.className='float '+cls;e.textContent=txt;e.style.left=s.x+'px';e.style.top=s.y+'px';fxl.appendChild(e);setTimeout(()=>e.remove(),1000);}
function callout(v,trig,name){if(!v)return;const s=screenOf(v,1.9);const e=document.createElement('div');e.className='call';e.innerHTML=`<em>${TRIG[trig]||trig}</em>${name}`;e.style.left=s.x+'px';e.style.top=s.y+'px';fxl.appendChild(e);setTimeout(()=>e.remove(),1100);}
function banner(t,sub,cls='',dur=1.6){const b=$('banner');b.className='on '+cls;b.querySelector('b').textContent=t;b.querySelector('span').textContent=sub||'';b.querySelector('span').style.display=sub?'':'none';clearTimeout(banner.t);banner.t=setTimeout(()=>b.className='',dur*1000);}
const pips=(lv,xp)=>lv>=3?'<span>MAX</span>':`LV${lv} `+(lv===1?[0,1].map(k=>`<i class="${xp>k?'on':''}"></i>`).join(''):[2,3,4].map(k=>`<i class="${xp>k?'on':''}"></i>`).join(''));
function updateBadges(){const seen=new Set();
 for(const v of D.views.values()){if(!v.ref&&!v.stat)continue;if(v.key[0]==='m')continue;seen.add(v.key);const b=badgeFor(v.key);const s=screenOf(v,-.05),top=screenOf(v,v.food?1.05:1.75);
  let a,h,tmp=false,lvH='',tagH='',perk=null,small=false;
  if(v.stat){a=v.stat.a;h=Math.max(0,v.stat.h);perk=v.stat.perk;lvH=v.stat.lv>1?`LV${v.stat.lv}`:'';}
  else if(v.food){a=null;const f=foodById(v.id);tagH=(v.ref.frozen?'❄ ':'')+f.n.toUpperCase();}
  else{const p=v.ref.pet||v.ref;a=p.a+(p.tmpA||0);h=p.h+(p.tmpH||0);tmp=!!(p.tmpA||p.tmpH);perk=p.perk;if(v.key[0]==='t')lvH=pips(p.lv,p.xp);else{small=true;tagH=(v.ref.frozen?'❄ ':'')+'TIER '+petById(p.id).t;}}
  const sig=[a,h,tmp,lvH,tagH,perk,small,v.ref&&v.ref.frozen].join('|');
  if(b.last.sig!==sig){b.last.sig=sig;b.el.style.display=a==null?'none':'';b.el.classList.toggle('small',small);if(a!=null){b.el.children[0].textContent=a;b.el.children[1].textContent=h;b.el.children[1].classList.toggle('tmp',tmp);b.el.children[0].classList.toggle('tmp',tmp);}
   b.lv.innerHTML=lvH+(perk?`<span class="pk" title="${PERKS[perk].n}">${PERKS[perk].ic}</span>`:'');b.lv.style.display=lvH||perk?'':'none';b.tag.textContent=tagH;b.tag.style.display=tagH?'':'none';b.tag.classList.toggle('frz',!!(v.ref&&v.ref.frozen));}
  const vis=v.faint>0||v.spawn<.3?0:1;b.el.style.opacity=vis;b.lv.style.opacity=vis;
  b.el.style.left=s.x+'px';b.el.style.top=s.y+'px';b.lv.style.left=top.x+'px';b.lv.style.top=top.y+'px';b.tag.style.left=s.x+'px';b.tag.style.top=(s.y+(a==null?0:30))+'px';}
 for(const k of [...BD.keys()])if(!seen.has(k))dropBadge(k);
 if(app==='shop'){const f=D.project(new THREE.Vector3(TEAM_X(0)+1.25,1.6,TEAM_Z),W(),H());const l=document.querySelector('.l-front');l.style.left=f.x+'px';l.style.top=f.y+'px';l.style.display='';}else document.querySelector('.l-front').style.display='none';}

/* ================= shop sync ================= */
function syncShop(){if(!G)return;const want=new Set();
 G.team.forEach((p,i)=>{if(!p)return;const key='t'+p.uid;if(!D.views.has(key)){const sv=[...D.views.values()].find(v=>v.petUid===p.uid);if(sv){D.views.delete(sv.key);dropBadge(sv.key);sv.key=key;D.views.set(key,sv);}else{const v=D.petView(key,p.id,{x:TEAM_X(i),y:.3,z:TEAM_Z});v.spawn=0;}}
  const v=D.views.get(key);v.want.set(TEAM_X(i),.3,TEAM_Z);v.face=FACE_TEAM;v.petUid=p.uid;v.ref=p;v.slot=i;v.fast=false;want.add(key);});
 let np=0,nf=0;G.shop.forEach((s,k)=>{const key='s'+s.sid;let v;const fresh=!D.views.has(key);
  if(s.kind==='pet'){v=D.petView(key,s.pet.id,{x:shopX(np,false),y:SHOP_Y,z:SHOP_Z});v.want.set(shopX(np++,false),SHOP_Y,SHOP_Z);v.petUid=s.pet.uid;v.face=FACE_SHOP;}
  else{v=D.foodView(key,s.food,{x:shopX(nf,true),y:SHOP_Y,z:SHOP_Z});v.want.set(shopX(nf++,true),SHOP_Y,SHOP_Z);}
  if(fresh){v.spawn=0;v.pos.copy(v.want);}v.ref=s;v.shopIdx=k;D.setIce(v,s.frozen);want.add(key);});
 for(const[k,v]of [...D.views])if((k[0]==='t'||k[0]==='s')&&!want.has(k)){D.removeView(k,true);dropBadge(k);}
 updateSel();updateHud();}
function viewOfTeam(i){const p=G.team[i];return p?D.views.get('t'+p.uid):null;}
function viewOfShop(k){const s=G.shop[k];return s?D.views.get('s'+s.sid):null;}

/* ================= log → effects ================= */
function viewByUid(uid){return D.views.get('t'+uid)||[...D.views.values()].find(v=>v.petUid===uid);}
function consumeLog(){if(!G)return;for(const e of G.log){const v=viewByUid(e.uid);
  if(e.e==='ability'){callout(v,e.trig,e.n);snd.play('ability');}
  else if(e.e==='buff'){if(v){floatText(v,(e.a?(e.a>0?'+':'')+e.a:'')+(e.a&&e.h?'/':'')+(e.h?(e.h>0?'+':'')+e.h:''),e.a<0?'neg':'buff');v.pop=1;}snd.play('buff');}
  else if(e.e==='perk'){if(v){floatText(v,e.perk?PERKS[e.perk].ic+' '+PERKS[e.perk].n:'PERK LOST','buff');v.pop=1;}snd.play('eat');}
  else if(e.e==='level'){if(v){floatText(v,'LEVEL '+e.lv+'!','lvl',2.2);D.sparkle(v.g.position,'#ffd23a',30);v.bounce=1;}snd.play('level');}
  else if(e.e==='gold'){floatGold('+'+e.n);}
  else if(e.e==='shopbuff'){for(const s of G.shop)if(s.kind==='pet'){const sv=D.views.get('s'+s.sid);if(sv){sv.pop=1;floatText(sv,'+1/+1','buff');}}}}
 G.log=[];}
function floatGold(t){const r=$('h-gold').getBoundingClientRect();const e=document.createElement('div');e.className='float gold';e.textContent=t;e.style.left=(r.left+r.width/2)+'px';e.style.top=(r.bottom+16)+'px';fxl.appendChild(e);setTimeout(()=>e.remove(),1000);}

/* ================= actions ================= */
function info(item){const set=(eye,name,tx)=>{$('i-eye').textContent=eye;$('i-name').innerHTML=name;$('i-tx').innerHTML=tx;};
 if(!item){set('YOUR SHOP · TIER '+tierFor(G.turn),'Drag pets onto your team','Front pet fights first. Drop a pet on the same kind to level it up. Drop food on a pet to feed it. Drop a team pet on the counter to sell it.');return;}
 const d=describe(item);set(d.eye,d.name,d.body);}
function describe(item){// item: {pet} | {food} | unit view
 if(item.food){const f=foodById(item.food);return{eye:'FOOD · TIER '+f.t+' · 3 GOLD'+(item.frozen?' · FROZEN':''),name:f.n,body:f.tx};}
 const p=item.pet||item,b=petById(p.id);const L=p.lv||1;const trig=b.trig?`<span class="tr">${TRIG[b.trig]||''}</span>`:'';
 return{eye:`TIER ${b.t}${item.pet?' · 3 GOLD':''}${p.lv?' · LEVEL '+p.lv:''}${item.frozen?' · FROZEN':''}`,name:`${b.n} <b class="a">${p.a+(p.tmpA||0)}</b>/<b class="h">${p.h+(p.tmpH||0)}</b>`,body:trig+fmtTx(b.tx,L)+(p.perk?`<br>${PERKS[p.perk].ic} <b>${PERKS[p.perk].n}</b> — ${PERKS[p.perk].d}`:'')};}
function msg(t){banner(t,'','',1.1);snd.play('bad');}
function doBuy(si,slot){const s=G.shop[si];if(!s)return;const r=S.buy(G,si,slot);if(!r.ok){msg(r.msg);return;}
 snd.play(s.kind==='food'?'eat':r.merged?'level':'buy');if(r.merged){const v=viewOfTeam(slot);const sv=D.views.get('s'+s.sid);if(sv){D.removeView(sv.key,false);dropBadge(sv.key);}if(v){D.sparkle(v.g.position,'#ffffff',20);v.pop=1;floatText(v,'+1/+1','buff');}}
 if(s.kind==='food'){const sv=D.views.get('s'+s.sid);if(sv){D.removeView(sv.key,false);dropBadge(sv.key);}const v=r.pet?D.views.get('t'+r.pet.uid):null;if(v){D.sparkle(v.g.position,r.food.col,16);v.bounce=1;}}
 sel=null;syncShop();consumeLog();}
function doMove(a,b){const r=S.move(G,a,b);if(!r.ok)return;if(r.merged){snd.play('level');const v=viewOfTeam(b);if(v){D.sparkle(v.g.position,'#ffffff',20);v.pop=1;}}else snd.play('buy');sel=null;syncShop();consumeLog();}
function doSell(slot){const p=G.team[slot];if(!p)return;const v=viewOfTeam(slot);if(v)D.poof(v.g.position,['#ffd23a','#ffffff'],24);const r=S.sell(G,slot);if(r.ok){snd.play('sell');floatGold('+'+r.gold);}sel=null;consumeLog();syncShop();}
function doRoll(){if(!S.roll(G)){msg('Not enough gold.');return;}snd.play('roll');for(const[k,v]of D.views)if(k[0]==='s'&&!(v.ref&&v.ref.frozen)){}syncShop();}
function doFreeze(si){if(si==null||!G.shop[si]){msg('Select a shop item to freeze.');return;}S.freeze(G,si);snd.play('freeze');sel=null;syncShop();info(null);}
function act(id){if(app!=='shop')return;if(id==='roll')doRoll();if(id==='freeze')doFreeze(sel&&sel.k==='shop'?sel.i:null);if(id==='sell'){if(sel&&sel.k==='team')doSell(sel.i);else msg('Select one of your pets to sell.');}if(id==='end')endTurn();}
function updateSel(){selRing.visible=false;D.pads.forEach((p,i)=>{p.ring.material.opacity=0;});
 if(!G||app!=='shop')return;const holding=(drag&&drag.moved)?drag.from:sel;
 if(holding){if(holding.k==='shop'){const v=viewOfShop(holding.i);if(v){selRing.visible=true;selRing.position.set(v.want.x,SHOP_Y+.12,SHOP_Z);}const s=G.shop[holding.i];
   D.pads.forEach((p,i)=>{const t=G.team[i];const ok=s&&(s.kind==='food'?!!t||['multi','all','shop'].includes(foodById(s.food).k):!t||t.id===s.pet.id||G.team.includes(null));p.ring.material.opacity=ok?.85:0;p.ring.material.color.set(t&&s&&s.kind==='pet'&&t.id===s.pet.id?0xffd23a:0xffffff);});}
  else if(holding.k==='team'){selRing.visible=true;selRing.position.set(TEAM_X(holding.i),.33,TEAM_Z);const me=G.team[holding.i];D.pads.forEach((p,i)=>{if(i===holding.i)return;const t=G.team[i];p.ring.material.opacity=.6;p.ring.material.color.set(t&&me&&t.id===me.id?0xffd23a:0xffffff);});}}
 $('sellv').textContent=sel&&sel.k==='team'&&G.team[sel.i]?'+'+G.team[sel.i].lv+' GOLD · S':'S';}

/* ================= picking & pointer ================= */
const anchor=new THREE.Vector3();
function pickAt(px,py,shopOnly){let best=null,bd=Math.max(46,H()*.075);const test=(k,i,x,y,z)=>{anchor.set(x,y,z);const s=D.project(anchor,W(),H());const d=Math.hypot(s.x-px,s.y-py);if(d<bd){bd=d;best={k,i};}};
 if(app==='shop'&&G){if(!shopOnly)for(let i=0;i<5;i++)test('team',i,TEAM_X(i),.8,TEAM_Z);G.shop.forEach((s,k)=>{const v=viewOfShop(k);if(v)test('shop',k,v.want.x,SHOP_Y+.5,SHOP_Z);});}
 if(app==='battle'&&B){for(const v of D.views.values())if(v.key[0]==='b'&&!v.faint)test('unit',v.key,v.g.position.x,.9,v.g.position.z);}
 return best;}
function overShopZone(px,py){const a=D.project(new THREE.Vector3(0,SHOP_Y,SHOP_Z-1.1),W(),H());return py>a.y;}
function inEl(id,px,py){const r=$(id).getBoundingClientRect();return px>=r.left&&px<=r.right&&py>=r.top&&py<=r.bottom;}
canvas.addEventListener('pointerdown',e=>{snd.init();if(app!=='shop'){return;}const h=pickAt(e.clientX,e.clientY);
 if(!h){sel=null;updateSel();info(null);return;}
 if(h.k==='team'&&!G.team[h.i]){if(sel&&sel.k==='shop'){doBuy(sel.i,h.i);return;}if(sel&&sel.k==='team'){doMove(sel.i,h.i);return;}return;}
 drag={from:h,sx:e.clientX,sy:e.clientY,moved:false,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(drag){if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>8){drag.moved=true;const v=drag.from.k==='shop'?viewOfShop(drag.from.i):viewOfTeam(drag.from.i);drag.v=v;if(v){v.dragging=true;v.fast=true;}hideTip();updateSel();}
  if(drag.moved&&drag.v){const p=D.pickPlane(e.clientX/W()*2-1,-(e.clientY/H())*2+1,.6);drag.v.want.set(p.x,.6,p.z);}return;}
 hover(e.clientX,e.clientY);});
canvas.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;try{canvas.releasePointerCapture(d.id);}catch(_){}if(d.v){d.v.dragging=false;d.v.fast=false;}
 if(!d.moved){// click semantics
  if(sel&&sel.k==='shop'&&d.from.k==='team'){doBuy(sel.i,d.from.i);return;}
  if(sel&&sel.k==='team'&&d.from.k==='team'&&sel.i!==d.from.i){doMove(sel.i,d.from.i);return;}
  if(sel&&sel.k===d.from.k&&sel.i===d.from.i){sel=null;}else sel=d.from;const it=sel?(sel.k==='shop'?G.shop[sel.i]:G.team[sel.i]):null;info(it);updateSel();snd.play('tick');return;}
 const h=pickAt(e.clientX,e.clientY);
 if(d.from.k==='shop'){if(h&&h.k==='team')doBuy(d.from.i,h.i);else{const s=G.shop[d.from.i];if(s&&s.kind==='food'&&['multi','all','shop'].includes(foodById(s.food).k)&&!overShopZone(e.clientX,e.clientY))doBuy(d.from.i,0);else syncShop();}}
 else if(d.from.k==='team'){if(inEl('b-sell',e.clientX,e.clientY)||overShopZone(e.clientX,e.clientY))doSell(d.from.i);else if(h&&h.k==='team'&&h.i!==d.from.i)doMove(d.from.i,h.i);else syncShop();}
 sel=null;updateSel();});
canvas.addEventListener('pointerleave',()=>hideTip());
function hover(px,py){const h=pickAt(px,py);let item=null,v=null;
 if(h&&app==='shop'){if(h.k==='team'&&G.team[h.i]){item=G.team[h.i];v=viewOfTeam(h.i);}else if(h.k==='shop'){item=G.shop[h.i];v=viewOfShop(h.i);}}
 else if(h&&app==='battle'){v=D.views.get(h.i);if(v&&v.stat)item={...v.stat,id:v.id};}
 if(!item){hideTip();canvas.style.cursor='default';return;}canvas.style.cursor='pointer';
 const d=describe(item),t=$('tip');t.innerHTML=`<div class="t">${d.eye}</div><h4>${d.name}</h4><p>${d.body}</p>`;t.hidden=false;const x=Math.min(px+18,W()-290),y=Math.max(10,Math.min(py-20,H()-160));t.style.left=x+'px';t.style.top=y+'px';
 if(app==='shop'&&!sel)info(item);}
function hideTip(){$('tip').hidden=true;}

/* ================= turn flow ================= */
function newRun(o={}){snd.init();D.clearViews();for(const k of [...BD.keys()])dropBadge(k);G=S.newRun({diff:o.diff??diff,seed:o.seed});consumeLog();app='shop';shopT=SHOP_TIME;sel=null;B=null;
 document.body.classList.add('playing');$('menu').hidden=true;$('over').hidden=true;$('keys').hidden=true;$('hud').hidden=false;$('shopbar').hidden=false;$('battlebar').hidden=true;D.setMode('shop');syncShop();info(null);
 banner('TURN 1','Buy pets · 60 seconds on the clock','',1.8);}
function endTurn(force){if(app!=='shop')return;if(!G.team.some(Boolean)){if(force){const k=G.shop.findIndex(s=>s.kind==='pet');if(k>=0&&G.gold>=3)S.buy(G,k,0);syncShop();}if(!G.team.some(Boolean)){msg('You need at least one pet.');return;}}
 sel=null;drag=null;hideTip();updateSel();const{gh,B:res}=S.playTurn(G);consumeLog();app='prebattle';pendingBattle={gh,res,t:.75};$('shopbar').hidden=true;snd.play('start');}
function startBattle(gh,res){app='battle';D.setMode('battle');$('battlebar').hidden=false;$('foe').textContent=gh.name.toUpperCase()+' · '+gh.arch.toUpperCase();
 for(const[k,v]of [...D.views])if(k[0]==='s'){D.removeView(k,true);dropBadge(k);}
 B={ev:res.ev,i:0,wait:0,order:[[],[]],res,gh,done:false,endT:0};banner('BATTLE!','TURN '+G.turn+' · VS '+gh.name.toUpperCase(),'',1.3);}
function bview(uid){return D.views.get('b'+uid);}
function relayout(){for(const s of[0,1])B.order[s].forEach((uid,i)=>{const v=bview(uid);if(v&&!v.faint)v.want.set(BAT_X(s,i),.3,BAT_Z);});}
function proc(e,instant){let w=0;
 switch(e.e){
  case'init':{B.order=e.order;for(const u of e.units){const key='b'+u.uid;let v;const tv=u.side===0?D.views.get('t'+u.src):null;
    if(tv){D.views.delete(tv.key);dropBadge(tv.key);tv.key=key;D.views.set(key,tv);v=tv;v.ref=null;}else{v=D.petView(key,u.id,{x:u.side?16:-16,y:.3,z:BAT_Z});}
    v.stat={a:u.a,h:u.h,lv:u.lv,perk:u.perk,id:u.id};v.side=u.side;v.face=u.side?-Math.PI/2:Math.PI/2;}
   for(const[k]of [...D.views])if(k[0]==='t'){D.removeView(k,true);dropBadge(k);}relayout();w=1.4;break;}
  case'phase':if(!instant)banner('START OF BATTLE','','',.8);w=.5;break;
  case'ability':{const v=bview(e.uid);if(!instant){callout(v,e.trig,e.n);snd.play('ability');}if(v){v.pop=1;}w=.55;break;}
  case'buff':{const v=bview(e.uid);if(v){v.stat.a=e.na;v.stat.h=e.nh;if(!instant){floatText(v,(e.a?(e.a>0?'+':'')+e.a:'')+(e.a&&e.h?'/':'')+(e.h?(e.h>0?'+':'')+e.h:''),e.a<0?'neg':'buff');v.pop=1;}}w=.3;break;}
  case'dmg':{const v=bview(e.uid);if(v){v.stat.h=e.h;if(!instant){floatText(v,'-'+e.n,'dmg',1.3);v.hurt=1;if(!e.atk){const sv=bview(e.src);if(sv)D.sparkle(v.g.position,'#ffb03a',10);snd.play('hit');}}}w=e.atk?.12:.38;break;}
  case'attack':{const a=bview(e.a),b=bview(e.b);if(a)a.lunge=1;if(b)b.lunge=1;if(!instant){D.shake=.5;snd.play('hit');if(a&&b)setTimeout(()=>D.poof(new THREE.Vector3(0,.4,BAT_Z),['#ffffff','#ffe0a0'],14),130/speed);}w=.5;break;}
  case'block':{const v=bview(e.uid);if(!instant)floatText(v,'BLOCKED','blk');w=.28;break;}
  case'perk':{const v=bview(e.uid);if(v){v.stat.perk=e.perk;if(!instant){if(e.pop){D.poof(v.g.position,['#9af0ff','#ffffff'],20);floatText(v,'POP!','blk');}else floatText(v,e.perk?PERKS[e.perk].ic+' '+PERKS[e.perk].n:'PERK LOST',e.perk?'buff':'neg');}}w=.3;break;}
  case'faint':{const v=bview(e.uid);if(v){v.faint=.001;v.removeAt=time+(instant?0:.7);if(!instant)D.poof(v.g.position,['#ffffff','#d8d8e8','#ffd0e0'],22);}B.order=e.order;relayout();if(!instant)snd.play('faint');w=.5;break;}
  case'summon':{const u=e.unit;B.order=e.order;const i=B.order[u.side].indexOf(u.uid);const v=D.petView('b'+u.uid,u.id,{x:BAT_X(u.side,i),y:.3,z:BAT_Z});v.spawn=0;v.stat={a:u.a,h:u.h,lv:u.lv,perk:u.perk,id:u.id};v.face=u.side?-Math.PI/2:Math.PI/2;v.side=u.side;relayout();if(!instant){D.sparkle(v.g.position,'#b8f0ff',22);snd.play('summon');}w=.45;break;}
  case'end':{B.done=true;w=0;break;}}
 return w;}
function battleStep(dt){if(!B)return;for(const v of [...D.views.values()])if(v.removeAt&&time>=v.removeAt){D.removeView(v.key,false);dropBadge(v.key);}
 if(B.done){B.endT+=dt;if(B.endT>.4&&!B.shown){B.shown=true;showOutcome();}if(B.endT>2.2)finishBattle();return;}
 B.wait-=dt*speed;let guard=0;while(B.wait<=0&&B.i<B.ev.length&&guard++<50){B.wait+=proc(B.ev[B.i++],false);}}
function skipBattle(){if(!B||B.done)return;while(B.i<B.ev.length)proc(B.ev[B.i++],true);for(const v of [...D.views.values()])if(v.removeAt){D.removeView(v.key,false);dropBadge(v.key);}}
let lostLives=0;
function showOutcome(){const r=B.res.res;lostLives=S.applyResult(G,r,B.res.dealt);updateHud();
 if(r==='win'){banner('VICTORY!','+1 TROPHY · '+G.wins+' / 10','win',2);snd.play('win');for(const v of D.views.values())if(v.side===0)v.bounce=1;}
 else if(r==='lose'){banner('DEFEAT','-'+lostLives+' '+(lostLives>1?'LIVES':'LIFE')+' · '+G.lives+' LEFT','lose',2);snd.play('lose');}else{banner('DRAW','NO TROPHY, NO DAMAGE','',2);snd.play('draw');}}
function finishBattle(){for(const[k]of [...D.views])if(k[0]==='b'){D.removeView(k,false);dropBadge(k);}B=null;$('battlebar').hidden=true;
 if(G.over){showOver();return;}S.startTurn(G);app='shop';shopT=SHOP_TIME;D.setMode('shop');$('shopbar').hidden=false;syncShop();consumeLog();info(null);
 const t=tierFor(G.turn);banner('TURN '+G.turn,(G.turn%2===1&&G.turn>1&&t<=6?'TIER '+t+' UNLOCKED · ':'')+'10 GOLD','',1.5);}

/* ================= run over ================= */
const PORT=new Map();let pr=null;
function portrait(id,food){const k=(food?'f:':'p:')+id;if(PORT.has(k))return PORT.get(k);if(!pr){pr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});pr.setSize(240,180,false);pr.setClearColor(0,0);pr.toneMapping=THREE.ACESFilmicToneMapping;pr.outputColorSpace=THREE.SRGBColorSpace;}
 const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x667755,1.6));const l=new THREE.DirectionalLight(0xffffff,2.6);l.position.set(3,5,4);s.add(l);
 const g=food?makeFood(id):makePet(petById(id).m);g.rotation.y=food?.3:.65;s.add(g);const box=new THREE.Box3().setFromObject(g),c=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()).length();
 const cam=new THREE.PerspectiveCamera(30,4/3,.01,50);cam.position.set(c.x+sz*.55,c.y+sz*.45,c.z+sz*1.55);cam.lookAt(c);pr.render(s,cam);const url=pr.domElement.toDataURL();PORT.set(k,url);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});return url;}
function score(){return S.score(G);}
function award(){const pts=score(),won=G.over==='win';const team=G.team.filter(Boolean);const mvp=team.slice().sort((a,b)=>b.dmg-a.dmg)[0];
 lastAward={pts,won,wins:G.wins,lives:G.lives,turns:G.turn,record:`${G.wins}-${G.losses}-${G.draws}`,diff:['casual','normal','tough'][G.diff],mvp:mvp?petById(mvp.id).n:''};
 const tok=5+Math.min(60,pts/25|0);try{const p=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};p.played++;p.tokens+=tok;if(won)p.wins++;localStorage.setItem('pxd_profile',JSON.stringify(p));
  const k='pxd_hs_'+(p.user?p.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);localStorage.setItem('petbrawl_best',Math.max(+(localStorage.getItem('petbrawl_best')||0),G.wins));}catch(e){}return tok;}
function best(){try{const p=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(p.user?p.user.toLowerCase()+'_':'')+ID)||0);}catch(e){return 0;}}
function showOver(){app='over';const tok=award();const won=G.over==='win';$('oeye').textContent=won?'RUN COMPLETE · 10 TROPHIES':'RUN OVER · OUT OF LIVES';$('ores').textContent=won?'CHAMPIONS!':'KNOCKED OUT';$('ores').style.color=won?'#ffd23a':'#ff5a5a';
 const st=[['TROPHIES',G.wins+'/10'],['LIVES LEFT',G.lives],['TURNS',G.turn],['RECORD',`${G.wins}-${G.losses}-${G.draws}`],['SCORE',lastAward.pts]];$('ostats').innerHTML=st.map(([a,b])=>`<div><i>${a}</i><b>${b}</b></div>`).join('');
 const team=G.team.filter(Boolean),mvp=team.slice().sort((a,b)=>b.dmg-a.dmg)[0];
 $('oteam').innerHTML=team.map(p=>`<div class="${p===mvp?'mvp':''}"><img src="${portrait(p.id)}" alt=""><b>${petById(p.id).n}</b>${p.a}/${p.h} · LV${p.lv}${p===mvp?'<br>★ MVP · '+p.dmg+' DMG':''}</div>`).join('');
 $('otok').textContent=`+${tok} TOKENS · BEST ${best()} PTS · ${['CASUAL','NORMAL','TOUGH'][G.diff]} GHOSTS`;
 $('hud').hidden=true;$('over').hidden=false;document.body.classList.remove('playing');D.setMode('menu');for(const[k]of [...D.views])if(k[0]!=='m'){D.removeView(k,false);dropBadge(k);}
 team.forEach((p,i)=>{const v=D.petView('m'+i,p.id,{x:1.4+i*1.95,y:.3,z:-.6+(i%2)*1.1});v.face=-.3;v.bounce=won?1:0;});}

/* ================= menu / index ================= */
function toMenu(){app='menu';G=null;B=null;D.clearViews();for(const k of [...BD.keys()])dropBadge(k);$('menu').hidden=false;$('over').hidden=true;$('hud').hidden=true;$('keys').hidden=false;document.body.classList.remove('playing');D.setMode('menu');
 const ids=['kraken','dragon','fox','sheep','frog'];ids.forEach((id,i)=>{const v=D.petView('m'+i,id,{x:1.4+i*1.95,y:.3,z:-.6+(i%2)*1.1});v.face=-.35+i*.05;});
 const b=best();$('m-best').textContent=b?'BEST SCORE '+b+' PTS':'';}
const segDiff=$('o-diff');function setDiff(v){diff=v;segDiff.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));try{localStorage.setItem('pxd_petbrawl_diff',v);}catch(e){}}
segDiff.querySelectorAll('button').forEach(b=>b.onclick=()=>setDiff(+b.dataset.v));setDiff(diff);
let itab=1;function openIndex(){indexOpen=true;$('index').hidden=false;$('itabs').innerHTML=[1,2,3,4,5,6].map(t=>`<button data-v="${t}" class="${t===itab?'on':''}">TIER ${t}</button>`).join('')+`<button data-v="0" class="${itab===0?'on':''}">FOOD</button>`;
 $('itabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{itab=+b.dataset.v;openIndex();});
 const list=itab?PETS.filter(p=>p.t===itab):FOODS;$('igrid').innerHTML=list.map(p=>itab?`<div class="pc"><img data-id="${p.id}" alt=""><h4>${p.n}<span><b class="a">${p.a}</b> / <b class="h">${p.h}</b></span></h4><p><span class="tr">${TRIG[p.trig]}</span>${fmtTx(p.tx,1)}</p><p style="opacity:.6">Lv2: ${fmtTx(p.tx,2).replace(/^[^:]*: /,'')} · Lv3: ${fmtTx(p.tx,3).replace(/^[^:]*: /,'')}</p></div>`
  :`<div class="pc food"><img data-f="${p.id}" alt=""><h4>${p.n}<span style="font-size:.7rem;color:#8a8f9a">TIER ${p.t}</span></h4><p>${p.tx}</p></div>`).join('');
 let k=0;const imgs=[...$('igrid').querySelectorAll('img')];const next=()=>{if(!indexOpen||k>=imgs.length)return;const im=imgs[k++];im.src=im.dataset.id?portrait(im.dataset.id):portrait(im.dataset.f,true);setTimeout(next,0);};next();}
function closeIndex(){indexOpen=false;$('index').hidden=true;}
$('i-close').onclick=closeIndex;$('m-index').onclick=openIndex;$('b-index').onclick=openIndex;$('b-menu').onclick=()=>{if(confirm('Abandon this run?'))toMenu();};
$('go').onclick=()=>newRun();$('again').onclick=()=>newRun();$('omenu').onclick=toMenu;
$('b-roll').onclick=()=>act('roll');$('b-freeze').onclick=()=>act('freeze');$('b-sell').onclick=()=>act('sell');$('b-end').onclick=()=>act('end');
$('speed').querySelectorAll('button').forEach(b=>b.onclick=()=>{const v=+b.dataset.v;if(v===99){skipBattle();return;}setSpeed(v);});
function setSpeed(v){speed=v;$('speed').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));}
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Pet Brawl\nScore: ${a.pts||0}\nResult: ${a.won?'champion':'knocked out'} · ${a.wins||0} trophies · record ${a.record||''}\nTurns: ${a.turns||0} · lives left ${a.lives??''}\nMVP: ${a.mvp||''} · ${a.diff||''} ghosts\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};
addEventListener('keydown',e=>{if(e.repeat)return;snd.init();const c=e.code;
 if(indexOpen){if(c==='Escape'||c==='KeyI')closeIndex();return;}
 if(c==='KeyI'&&app!=='menu'){openIndex();return;}
 if(app==='menu'){if(c==='Enter'||c==='Space'){e.preventDefault();newRun();}if(c==='KeyI')openIndex();return;}
 if(app==='over'){if(c==='Enter'||c==='Space'){e.preventDefault();newRun();}if(c==='Escape')toMenu();return;}
 if(app==='battle'){if(c==='Space'||c==='Enter'){e.preventDefault();skipBattle();}if(c==='BracketRight'||c==='Equal')setSpeed(speed>=4?4:speed*2);if(c==='BracketLeft'||c==='Minus')setSpeed(speed<=1?1:speed/2);return;}
 if(app!=='shop')return;
 if(c==='Space'||c==='Enter'){e.preventDefault();act('end');return;}if(c==='KeyR')act('roll');if(c==='KeyF')act('freeze');if(c==='KeyS')act('sell');if(c==='Escape'){sel=null;updateSel();info(null);}
 const d=c.match(/^Digit([1-7])$/);if(d){const k=+d[1]-1;if(G.shop[k]){sel={k:'shop',i:k};info(G.shop[k]);updateSel();snd.play('tick');}return;}
 const ti=KEYS_TEAM.indexOf(c);if(ti>=0){if(sel&&sel.k==='shop'){doBuy(sel.i,ti);}else if(sel&&sel.k==='team'&&sel.i!==ti){doMove(sel.i,ti);}else if(G.team[ti]){sel={k:'team',i:ti};info(G.team[ti]);updateSel();snd.play('tick');}}});

/* ================= HUD ================= */
function updateHud(){if(!G)return;$('h-gold').textContent=G.gold;$('h-lives').textContent=G.lives;$('h-wins').textContent=G.wins;$('h-turn').textContent=G.turn;$('h-tier').textContent='TIER '+tierFor(G.turn);
 $('b-roll').disabled=G.gold<1;}
function updateTimer(){const t=Math.max(0,shopT);$('h-time').textContent=Math.ceil(t);$('h-ring').style.strokeDashoffset=(119.4*(1-t/SHOP_TIME)).toFixed(1);$('h-timer').classList.toggle('low',t<10&&app==='shop');}

/* ================= loop ================= */
function step(dt){time+=dt;
 if(app==='shop'&&!indexOpen){shopT-=dt;const s=Math.ceil(shopT);if(s<=5&&s!==lastTick&&s>0){lastTick=s;snd.play('tick');}if(shopT<=0){shopT=0;banner('TIME!','The bell rings — to battle!','',1.2);endTurn(true);}}
 if(app==='prebattle'&&pendingBattle){pendingBattle.t-=dt;if(pendingBattle.t<=0){const p=pendingBattle;pendingBattle=null;startBattle(p.gh,p.res);}}
 if(app==='battle')battleStep(dt);
 D.update(dt*(app==='battle'?Math.min(speed,2.5):1));}
function frame(){updateBadges();if(app==='shop'||app==='prebattle')updateTimer();
 if(sel&&app==='shop'){const v=sel.k==='shop'?viewOfShop(sel.i):viewOfTeam(sel.i);if(v){selRing.rotation.z+=.03;}}}
function render(){const w=W(),h=H();if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);if(fxP)fxP.w=0;}D.cam.aspect=w/h;D.cam.updateProjectionMatrix();
 if(!fxP){fxP=cinematic(R,D.scene,D.cam,{exposure:1.02,bloom:.32,bloomThreshold:.92,bloomRadius:.4,vignette:.3,saturation:1.1,grain:.012,aoStrength:.7});fxP.w=0;}if(fxP.w!==w*9999+h){fxP.w=w*9999+h;fxP.setSize(w,h);}fxP.render();}
toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);frame();render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.PETS={get state(){return app;},get app(){return app;},get G(){return G;},newRun,newGame:()=>newRun(),toMenu,step,frame,render,
 buy:(si,slot)=>doBuy(si,slot),buyTo:(si,slot)=>doBuy(si,slot),sell:slot=>doSell(slot),roll:()=>doRoll(),freeze:si=>doFreeze(si),move:(a,b)=>doMove(a,b),act,endTurn:()=>endTurn(),startBattle:()=>endTurn(),skip:skipBattle,setSpeed,battleStep:()=>battleStep(.1),endBattle:()=>skipBattle(),
 get shopT(){return shopT;},set shopT(v){shopT=v;},get team(){return G&&G.team;},get shop(){return G&&G.shop;},get gold(){return G&&G.gold;},get wins(){return G&&G.wins;},get lives(){return G&&G.lives;},get turn(){return G&&G.turn;},get battle(){return B;},
 setWins(n){G.wins=n;updateHud();},setLives(n){G.lives=n;updateHud();},giveGold(n){G.gold+=n;updateHud();},
 screenOfShop(k){const v=viewOfShop(k);return v?D.project(v.want.clone().setY(SHOP_Y+.5),W(),H()):null;},screenOfSlot(i){return D.project(new THREE.Vector3(TEAM_X(i),.8,TEAM_Z),W(),H());},
 openIndex,closeIndex,D,S,setQuality:applyQuality,get award(){return lastAward;},pickAt,describe};
