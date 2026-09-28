(()=>{
/* ================= Pet Brawl: a team auto-battler ================= */
const cv=document.getElementById('c'),X=cv.getContext('2d'),VW=960,VH=540;X.scale(2,2);
const rnd=n=>Math.random()*n,ri=n=>Math.random()*n|0,pick=a=>a[ri(a.length)],cl=(v,a,b)=>v<a?a:v>b?b:v;
const O='#ff4d00',FG='#f2f2f2',MUT='#8a8a8a';
/* ---------- pets ---------- */
const P=[
 // tier 1
 {n:'Ant',e:'🐜',t:1,a:2,h:1,tx:'Faint: give a random friend +2/+1.',on:{faint:(s,u)=>{const f=rf(s.team,u);if(f)buff(f,2,1);}}},
 {n:'Fish',e:'🐟',t:1,a:2,h:2,tx:'Level up: give all friends +1/+1.',on:{levelup:(s,u)=>s.team.forEach(f=>f&&f!==u&&buff(f,1,1))}},
 {n:'Beaver',e:'🦫',t:1,a:3,h:2,tx:'Sell: give 2 random friends +1 health.',on:{sell:(s,u)=>rfs(s.team,u,2).forEach(f=>buff(f,0,u.lv))}},
 {n:'Mosquito',e:'🦟',t:1,a:2,h:2,tx:'Start of battle: deal 1 damage to a random enemy.',on:{start:(s,u,foe)=>{for(let i=0;i<u.lv;i++){const t=rf(foe);if(t)hit(t,1,s,foe,u);}}}},
 {n:'Cricket',e:'🦗',t:1,a:1,h:2,tx:'Faint: summon a 1/1 Zombie Cricket.',on:{faint:(s,u,foe,i)=>summon(s.team,i,{n:'Zombie',e:'🧟',a:u.lv,h:u.lv,t:1},s)}},
 {n:'Duck',e:'🦆',t:1,a:2,h:3,tx:'Sell: give shop pets +1 health.',on:{sell:(s,u)=>shop.forEach(x=>x&&x.p&&buff(x.p,0,u.lv))}},
 {n:'Otter',e:'🦦',t:1,a:1,h:3,tx:'Buy: give a random friend +1/+1.',on:{buy:(s,u)=>{const f=rf(s.team,u);if(f)buff(f,u.lv,u.lv);}}},
 {n:'Pig',e:'🐖',t:1,a:4,h:1,tx:'Sell: gain 1 extra gold.',on:{sell:(s,u)=>{gold+=u.lv;}}},
 // tier 2
 {n:'Flamingo',e:'🦩',t:2,a:3,h:2,tx:'Faint: give the two pets behind +1/+1.',on:{faint:(s,u,foe,i)=>s.team.slice(i+1).filter(Boolean).slice(0,2).forEach(f=>buff(f,u.lv,u.lv))}},
 {n:'Hedgehog',e:'🦔',t:2,a:3,h:2,tx:'Faint: deal 2 damage to all pets.',on:{faint:(s,u,foe)=>{[...s.team,...foe].filter(p=>p&&p!==u&&p.h>0).forEach(p=>hit(p,2*u.lv,s,foe,u));}}},
 {n:'Peacock',e:'🦚',t:2,a:2,h:5,tx:'Hurt: gain +4 attack (once per battle).',on:{hurt:(s,u)=>{if(!u.used){u.used=1;u.a+=4*u.lv;pop(u,'+'+4*u.lv,O);}}}},
 {n:'Swan',e:'🦢',t:2,a:1,h:3,tx:'Start of turn: gain 1 gold.',on:{turn:(s,u)=>{gold+=u.lv;}}},
 {n:'Kangaroo',e:'🦘',t:2,a:1,h:2,tx:'Friend ahead attacks: gain +2/+2.',on:{aheadAttacks:(s,u)=>buff(u,2*u.lv,2*u.lv)}},
 {n:'Crab',e:'🦀',t:2,a:3,h:1,tx:'Buy: copy half the health of your healthiest friend.',on:{buy:(s,u)=>{const m=Math.max(0,...s.team.filter(f=>f&&f!==u).map(f=>f.h));u.h=Math.max(u.h,Math.ceil(m*.5*u.lv));}}},
 // tier 3
 {n:'Dodo',e:'🦤',t:3,a:2,h:3,tx:'Start of battle: give the friend ahead half your attack.',on:{start:(s,u,foe,i)=>{const f=s.team.slice(0,i).reverse().find(Boolean);if(f)buff(f,Math.ceil(u.a*.5*u.lv),0);}}},
 {n:'Elephant',e:'🐘',t:3,a:3,h:5,tx:'Before attack: deal 1 damage to the friend behind.',on:{before:(s,u,foe,i)=>{const f=s.team.slice(i+1).find(Boolean);if(f)hit(f,u.lv,s,foe,u);}}},
 {n:'Camel',e:'🐫',t:3,a:2,h:6,tx:'Hurt: give the friend behind +1/+2.',on:{hurt:(s,u,foe,i)=>{const f=s.team.slice(i+1).find(Boolean);if(f)buff(f,u.lv,2*u.lv);}}},
 {n:'Dog',e:'🐕',t:3,a:3,h:3,tx:'Friend summoned: gain +1/+1.',on:{summoned:(s,u)=>buff(u,u.lv,u.lv)}},
 {n:'Sheep',e:'🐑',t:3,a:2,h:2,tx:'Faint: summon two 2/2 Rams.',on:{faint:(s,u,foe,i)=>{summon(s.team,i,{n:'Ram',e:'🐏',a:2*u.lv,h:2*u.lv,t:1},s);summon(s.team,i,{n:'Ram',e:'🐏',a:2*u.lv,h:2*u.lv,t:1},s);}}},
 {n:'Badger',e:'🦡',t:3,a:5,h:3,tx:'Faint: deal attack damage to adjacent pets.',on:{faint:(s,u,foe,i)=>{const b=s.team.slice(i+1).find(p=>p&&p.h>0);if(b)hit(b,u.a,s,foe,u);const f=foe.find(p=>p&&p.h>0);if(i===firstIdx(s.team)&&f)hit(f,u.a,s,foe,u);}}},
 // tier 4
 {n:'Bison',e:'🦬',t:4,a:4,h:4,tx:'End of turn: +2/+2 if you have a level 3 friend.',on:{endturn:(s,u)=>{if(s.team.some(f=>f&&f!==u&&f.lv>=3))buff(u,2*u.lv,2*u.lv);}}},
 {n:'Hippo',e:'🦛',t:4,a:4,h:5,tx:'Knock out: gain +3/+3.',on:{ko:(s,u)=>buff(u,3*u.lv,3*u.lv)}},
 {n:'Blowfish',e:'🐡',t:4,a:3,h:5,tx:'Hurt: deal 2 damage to a random enemy.',on:{hurt:(s,u,foe)=>{const t=rf(foe);if(t)hit(t,2*u.lv,s,foe,u);}}},
 {n:'Skunk',e:'🦨',t:4,a:3,h:6,tx:'Start of battle: cut the healthiest enemy\'s health by a third.',on:{start:(s,u,foe)=>{const t=foe.filter(Boolean).sort((a,b)=>b.h-a.h)[0];if(t){const d=Math.ceil(t.h*.33*u.lv);t.h=Math.max(1,t.h-d);pop(t,'-'+d,'#ff5a6a');}}}},
 // tier 5
 {n:'Shark',e:'🦈',t:5,a:4,h:4,tx:'Friend faints: gain +2/+1.',on:{friendFaint:(s,u)=>buff(u,2*u.lv,u.lv)}},
 {n:'Turkey',e:'🦃',t:5,a:3,h:4,tx:'Friend summoned: give it +3/+3.',on:{summonedTarget:(s,u,foe,i,x)=>buff(x,3*u.lv,3*u.lv)}},
 {n:'Rhino',e:'🦏',t:5,a:5,h:8,tx:'Knock out: deal 4 damage to the first enemy.',on:{ko:(s,u,foe)=>{const t=foe.find(p=>p&&p.h>0);if(t)hit(t,4*u.lv,s,foe,u);}}},
 {n:'Leopard',e:'🐆',t:5,a:10,h:4,tx:'Start of battle: deal half your attack to a random enemy.',on:{start:(s,u,foe)=>{const t=rf(foe);if(t)hit(t,Math.ceil(u.a*.5),s,foe,u);}}},
];
const FOODS=[{n:'Apple',e:'🍎',t:1,tx:'Give a pet +1/+1.',use:p=>buff(p,1,1)},{n:'Honey',e:'🍯',t:1,tx:'Faint: summon a 1/1 Bee.',use:p=>{p.honey=1;}},{n:'Pear',e:'🍐',t:2,tx:'Give a pet +2/+2.',use:p=>buff(p,2,2)},{n:'Cupcake',e:'🧁',t:2,tx:'+3/+3 for the next battle only.',use:p=>{p.tmpA=(p.tmpA||0)+3;p.tmpH=(p.tmpH||0)+3;}},{n:'Garlic',e:'🧄',t:3,tx:'Take 2 less damage (min 1).',use:p=>{p.garlic=1;}},{n:'Melon',e:'🍉',t:4,tx:'Block 20 damage once per battle.',use:p=>{p.melon=1;}},{n:'Steak',e:'🥩',t:4,tx:'+10 attack on the first hit each battle.',use:p=>{p.steak=1;}}];
/* ---------- state ---------- */
let team=[null,null,null,null,null],shop=[],gold=10,turn=1,lives=5,wins=0,sel=null,msg='',msgT=0,state='title',hover=null,frozen=new Set();
let battle=null,fx=[],shake=0,t=0,bestWins=+(localStorage.getItem('petbrawl_best')||0);
const mk=(b,lv)=>({...b,base:b,a:b.a,h:b.h,lv:lv||1,xp:0,id:Math.random()});
const tierMax=()=>Math.min(5,1+((turn-1)>>1));
const rf=(arr,not)=>{const c=arr.filter(p=>p&&p!==not&&p.h>0);return c.length?pick(c):null;};
const rfs=(arr,not,n)=>arr.filter(p=>p&&p!==not).sort(()=>Math.random()-.5).slice(0,n);
const firstIdx=arr=>arr.findIndex(p=>p&&p.h>0);
function buff(p,a,h){p.a=Math.min(50,p.a+a);p.h=Math.min(50,p.h+h);if(a||h)pop(p,(a?'+'+a:'')+(a&&h?'/':'')+(h?'+'+h:''),'#3dff8b');}
function pop(p,txt,col){fx.push({k:'txt',p,txt,col,t:50});}
function trig(side,ev,foe,extra){side.team.forEach((u,i)=>{if(u&&u.base.on&&u.base.on[ev])u.base.on[ev](side,u,foe||[],i,extra);});}
function summon(arr,i,b,side){let at=i;if(arr[at]&&arr[at].h>0){const e=arr.findIndex((p,k)=>k>=i&&(!p||p.h<=0));if(e<0)return;at=e;}const s=mk(b);s.summoned=1;arr[at]=s;fx.push({k:'spawn',p:s,t:20});if(side){side.team.forEach(f=>{if(f&&f!==s&&f.base.on){if(f.base.on.summoned)f.base.on.summoned(side,f);if(f.base.on.summonedTarget)f.base.on.summonedTarget(side,f,[],0,s);}});}}
function hit(p,d,side,foe,src){if(p.h<=0||d<=0)return;if(p.melon){p.melon=0;d=Math.max(0,d-20);pop(p,'BLOCK','#9fd8ff');}if(p.garlic&&d>0)d=Math.max(1,d-2);if(!d)return;p.h-=d;pop(p,'-'+d,'#ff5a6a');p.shk=8;const mySide=battle&&(battle.L.team.includes(p)?battle.L:battle.R.team.includes(p)?battle.R:null);if(mySide&&p.h>0&&p.base.on&&p.base.on.hurt){const other=mySide===battle.L?battle.R.team:battle.L.team;p.base.on.hurt(mySide,p,other,mySide.team.indexOf(p));}if(p.h<=0&&src&&src.base&&src.base.on&&src.base.on.ko&&battle){const ss=battle.L.team.includes(src)?battle.L:battle.R;src.base.on.ko(ss,src,ss===battle.L?battle.R.team:battle.L.team,0);}}
/* ---------- shop ---------- */
function roll(keepFrozen){const tm=tierMax(),pool=P.filter(p=>p.t<=tm),fpool=FOODS.filter(f=>f.t<=tm);const n=turn<5?3:turn<9?4:5,nf=turn<3?1:2;const old=shop;shop=[];for(let i=0;i<n+nf;i++){const f=old[i];if(keepFrozen&&f&&frozen.has(f.id)&&((i<n)===(!f.food))){shop.push(f);continue;}shop.push(i<n?{p:mk(pick(pool)),id:Math.random()}:{food:pick(fpool),id:Math.random()});}frozen=new Set([...frozen].filter(id=>shop.some(s=>s&&s.id===id)));}
function newGame(){fx=[];shake=0;battle=null;team=[null,null,null,null,null];gold=10;turn=1;lives=5;wins=0;sel=null;frozen=new Set();shop=[];roll(false);state='shop';say('Buy pets (3 gold). Drag or click to place.');}
function say(s){msg=s;msgT=180;}
function startTurn(){turn++;gold=10;team.forEach(p=>{if(p){delete p.tmpA;delete p.tmpH;}});const side={team};trig(side,'turn',[]);roll(true);state='shop';}
function levelFor(xp){return xp>=5?3:xp>=2?2:1;}
function mergeInto(dst,srcP){const before=dst.lv;dst.xp+=srcP.xp+1;dst.a=Math.max(dst.a,srcP.a)+1;dst.h=Math.max(dst.h,srcP.h)+1;dst.lv=levelFor(dst.xp);if(dst.lv>before){pop(dst,'LEVEL '+dst.lv,O);if(dst.base.on&&dst.base.on.levelup)dst.base.on.levelup({team},dst,[],team.indexOf(dst));const tm=Math.min(5,tierMax()+1),pl=P.filter(p=>p.t===tm);if(pl.length&&shop.length<8)shop.splice(Math.min(shop.length,4),0,{p:mk(pick(pl)),id:Math.random()});}}
function buyTo(i,slot){const s=shop[i];if(!s)return;if(gold<3){say('Not enough gold.');return;}
 if(s.food){const tgt=team[slot];if(!tgt){say('Feed food to a pet.');return;}gold-=3;s.food.use(tgt);shop[i]=null;frozen.delete(s.id);fx.push({k:'burst',x:slotX(slot),y:TEAMY,col:'#3dff8b'});return;}
 const cur=team[slot];if(cur&&cur.base.n!==s.p.base.n){say('Slot taken. Pick an empty slot or the same pet.');return;}if(cur&&cur.lv>=3){say('Already max level.');return;}
 gold-=3;shop[i]=null;frozen.delete(s.id);if(cur){mergeInto(cur,s.p);}else{team[slot]=s.p;const side={team};if(s.p.base.on&&s.p.base.on.buy)s.p.base.on.buy(side,s.p,[],slot);}fx.push({k:'burst',x:slotX(slot),y:TEAMY,col:O});}
function sell(slot){const p=team[slot];if(!p)return;gold+=p.lv;if(p.base.on&&p.base.on.sell)p.base.on.sell({team},p,[],slot);team[slot]=null;say('Sold '+p.base.n+' for '+p.lv+' gold.');}
/* ---------- opponent + battle ---------- */
function enemyTeam(){const tm=tierMax(),n=Math.min(5,1+Math.ceil(turn/2));const out=[];for(let i=0;i<n;i++){const b=pick(P.filter(p=>p.t<=tm&&p.t>=Math.max(1,tm-2)));const p=mk(b,turn>=10?(Math.random()<.3?3:2):turn>=6?(Math.random()<.3?2:1):1);const bonus=Math.floor(turn*.3);p.a+=ri(bonus+1);p.h+=ri(bonus+1);out.push(p);}while(out.length<5)out.push(null);return out;}
function startBattle(){if(!team.some(Boolean)){say('You need at least one pet.');return;}const side={team};trig(side,'endturn',[]);
 const L=team.map(p=>p?{...p,a:p.a+(p.tmpA||0),h:p.h+(p.tmpH||0),used:0,ref:p}:null),R=enemyTeam();battle={L:{team:L},R:{team:R},ph:'start',t:0,res:null,log:[]};state='battle';}
function cleanup(side,foe){let changed=true;while(changed){changed=false;side.team.forEach((p,i)=>{if(p&&p.h<=0&&!p.gone){p.gone=1;changed=true;fx.push({k:'faint',x:0,p,t:30,side:side===battle.L?-1:1,i});if(p.honey)summon(side.team,i,{n:'Bee',e:'🐝',a:1,h:1,t:1},side);if(p.base.on&&p.base.on.faint)p.base.on.faint(side,p,foe.team,i);side.team.forEach(f=>{if(f&&f!==p&&f.h>0&&f.base.on&&f.base.on.friendFaint)f.base.on.friendFaint(side,f);});}});}side.team=side.team.map(p=>p&&p.h<=0?null:p);}
function battleStep(){const B=battle;if(B.ph==='start'){trig(B.L,'start',B.R.team);trig(B.R,'start',B.L.team);cleanup(B.L,B.R);cleanup(B.R,B.L);B.ph='fight';B.t=0;return;}
 const li=firstIdx(B.L.team),rj=firstIdx(B.R.team);if(li<0||rj<0){B.res=li<0&&rj<0?'draw':li<0?'lose':'win';B.ph='done';B.t=0;return;}
 const a=B.L.team[li],b=B.R.team[rj];[[B.L,li],[B.R,rj]].forEach(([s,i])=>{const u=s.team[i],o=s===B.L?B.R:B.L;if(u.base.on&&u.base.on.before)u.base.on.before(s,u,o.team,i);const behind=s.team.slice(i+1).find(Boolean);if(behind&&behind.base.on&&behind.base.on.aheadAttacks)behind.base.on.aheadAttacks(s,behind);});
 let da=a.a,db=b.a;if(a.steak){da+=10;a.steak=0;}if(b.steak){db+=10;b.steak=0;}a.lunge=1;b.lunge=1;hit(b,da,B.R,B.L.team,a);hit(a,db,B.L,B.R.team,b);shake=6;fx.push({k:'clash',t:12});cleanup(B.L,B.R);cleanup(B.R,B.L);}
function endBattle(){const r=battle.res;if(r==='win'){wins++;say('Victory! '+wins+'/10 trophies.');}else if(r==='lose'){lives-=Math.min(3,1+((turn-1)>>2));say('Defeat. '+Math.max(0,lives)+' lives left.');}else say('Draw.');battle=null;
 if(wins>=10){state='won';bestWins=Math.max(bestWins,wins);localStorage.setItem('petbrawl_best',bestWins);award(true);}else if(lives<=0){state='lost';bestWins=Math.max(bestWins,wins);localStorage.setItem('petbrawl_best',bestWins);award(false);}else startTurn();}
function award(win){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=5+wins*4;if(win)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));}catch(e){}}
/* ---------- layout ---------- */
const TEAMY=250,SHOPY=420,slotX=i=>180+i*110,shopX=i=>120+i*100;
const btns=()=>[{id:'roll',x:620,y:500,w:110,h:34,l:'ROLL · 1'},{id:'freeze',x:740,y:500,w:100,h:34,l:'FREEZE'},{id:'sell',x:470,y:500,w:140,h:34,l:'SELL'},{id:'end',x:850,y:500,w:100,h:34,l:'BATTLE ▶',hot:1}];
/* ---------- input ---------- */
let mouse={x:0,y:0},drag=null;
const toV=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*VW,y:(e.clientY-r.top)/r.height*VH};};
function hitTest(p){for(let i=0;i<5;i++)if(Math.abs(p.x-slotX(i))<48&&Math.abs(p.y-TEAMY)<55)return{k:'team',i};for(let i=0;i<shop.length;i++)if(Math.abs(p.x-shopX(i))<44&&Math.abs(p.y-SHOPY)<50)return{k:'shop',i};for(const b of btns())if(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h)return{k:'btn',id:b.id};return null;}
cv.addEventListener('pointerdown',e=>{const p=toV(e);mouse=p;if(state==='title'||state==='won'||state==='lost'){newGame();return;}if(state==='battle'){if(battle)battle.fast=true;return;}const h=hitTest(p);if(!h){sel=null;return;}
 if(h.k==='btn'){act(h.id);return;}if(h.k==='shop'&&shop[h.i]){drag={from:h,x:p.x,y:p.y,moved:false};return;}if(h.k==='team'&&team[h.i]){drag={from:h,x:p.x,y:p.y,moved:false};return;}if(h.k==='team'&&sel&&sel.k==='shop'){buyTo(sel.i,h.i);sel=null;return;}if(h.k==='team'&&sel&&sel.k==='team'){[team[sel.i],team[h.i]]=[team[h.i],team[sel.i]];sel=null;}});
cv.addEventListener('pointermove',e=>{mouse=toV(e);if(drag){if(Math.hypot(mouse.x-drag.x,mouse.y-drag.y)>8)drag.moved=true;}hover=hitTest(mouse);});
addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;const h=hitTest(toV(e));if(!d.moved){if(sel&&sel.k==='team'&&d.from.k==='team'&&sel.i!==d.from.i){const a=team[sel.i],b=team[d.from.i];if(a&&b&&a.base.n===b.base.n&&b.lv<3){mergeInto(b,a);team[sel.i]=null;}else{[team[sel.i],team[d.from.i]]=[team[d.from.i],team[sel.i]];}sel=null;return;}if(sel&&sel.k==='shop'&&d.from.k==='team'){buyTo(sel.i,d.from.i);sel=null;return;}sel=d.from;return;}
 if(!h)return;if(d.from.k==='shop'&&h.k==='team')buyTo(d.from.i,h.i);else if(d.from.k==='team'&&h.k==='team'&&h.i!==d.from.i){const a=team[d.from.i],b=team[h.i];if(a&&b&&a.base.n===b.base.n&&b.lv<3){mergeInto(b,a);team[d.from.i]=null;}else[team[d.from.i],team[h.i]]=[team[h.i],team[d.from.i]];}else if(d.from.k==='team'&&h.k==='btn'&&h.id==='sell')sell(d.from.i);sel=null;});
addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){if(state==='shop')act('end');else if(state==='battle'&&battle)battle.fast=true;else newGame();}if(e.code==='KeyR'&&state==='shop')act('roll');if(e.code==='KeyF'&&state==='shop')act('freeze');if(e.code==='KeyS'&&state==='shop')act('sell');});
function act(id){if(id==='roll'){if(gold<1){say('No gold.');return;}gold--;roll(true);}if(id==='freeze'){if(sel&&sel.k==='shop'&&shop[sel.i]){const s=shop[sel.i];frozen.has(s.id)?frozen.delete(s.id):frozen.add(s.id);}else say('Select a shop item to freeze.');}if(id==='sell'){if(sel&&sel.k==='team'){sell(sel.i);sel=null;}else say('Select a pet to sell.');}if(id==='end')startBattle();}
/* ---------- drawing ---------- */
function bg(){const g=X.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#0b1a3a');g.addColorStop(.55,'#27406a');g.addColorStop(.56,'#3f7a3a');g.addColorStop(1,'#1f4a22');X.fillStyle=g;X.fillRect(0,0,VW,VH);
 X.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<6;i++){const cx=((i*190+t*.15)%1100)-100;X.beginPath();X.ellipse(cx,70+(i%3)*28,70,18,0,0,7);X.fill();}
 X.fillStyle='#2f6a30';X.beginPath();X.moveTo(0,305);for(let x=0;x<=VW;x+=40)X.lineTo(x,300-Math.sin(x*.012+1)*18);X.lineTo(VW,330);X.lineTo(0,330);X.fill();
 X.fillStyle='rgba(0,0,0,.35)';X.fillRect(0,340,VW,VH);}
function pet(p,x,y,s,opts){opts=opts||{};const bob=Math.sin(t*.06+x*.02)*2*(opts.still?0:1),sk=p.shk?(Math.random()-.5)*p.shk:0;if(p.shk)p.shk--;X.save();X.translate(x+sk,y+bob);
 X.fillStyle='rgba(0,0,0,.35)';X.beginPath();X.ellipse(0,34*s,30*s,7*s,0,0,7);X.fill();
 X.font=`${64*s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;X.textAlign='center';X.textBaseline='middle';X.fillStyle='#ffffff';if(opts.flip)X.scale(-1,1);X.fillText(p.e||p.base.e,0,0);if(opts.flip)X.scale(-1,1);
 const a=p.a+(opts.tmp?(p.tmpA||0):0),h=p.h+(opts.tmp?(p.tmpH||0):0);stat(-18*s,44*s,a,'#ff9a3a',s);stat(18*s,44*s,Math.max(0,h),'#ff4d6a',s);
 if(p.lv&&!opts.noLv){X.font=`700 ${11*s}px JetBrains Mono,monospace`;X.fillStyle=O;X.fillText('LV'+p.lv+(p.lv<3?' '+'●'.repeat(p.xp-(p.lv===2?2:0))+'○'.repeat((p.lv===1?2:3)-(p.xp-(p.lv===2?2:0))):''),0,-42*s);}
 const tags=[p.honey&&'🍯',p.melon&&'🍉',p.garlic&&'🧄',p.steak&&'🥩',(p.tmpA||p.tmpH)&&'🧁'].filter(Boolean);X.font=`${14*s}px sans-serif`;tags.forEach((e,i)=>X.fillText(e,28*s,-28*s+i*15*s));X.restore();}
function stat(x,y,v,col,s){X.fillStyle=col;X.beginPath();X.arc(x,y,12*s,0,7);X.fill();X.fillStyle='#fff';X.font=`700 ${13*s}px JetBrains Mono,monospace`;X.textAlign='center';X.textBaseline='middle';X.fillStyle='#ffffff';X.fillText(v,x,y+1);}
function txt(s,x,y,size,col,al,font){X.font=(font||'700 ')+size+'px '+(font&&font.includes('Anton')?'':'JetBrains Mono,monospace');X.fillStyle=col||FG;X.textAlign=al||'left';X.textBaseline='alphabetic';X.fillText(s,x,y);}
function big(s,x,y,size,col,al){X.font=`${size}px Anton,Impact,sans-serif`;X.fillStyle=col||FG;X.textAlign=al||'left';X.textBaseline='alphabetic';X.fillText(s,x,y);}
function hud(){X.fillStyle='rgba(0,0,0,.55)';X.fillRect(0,0,VW,44);const items=[['🪙',gold],['❤️',lives],['🏆',wins+'/10'],['TURN',turn]];items.forEach((it,i)=>{X.font='20px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';X.textAlign='left';X.textBaseline='middle';X.fillStyle='#ffffff';if(it[0]==='TURN'){txt('TURN '+it[1],24+i*140,28,15,MUT);}else{X.fillText(it[0],24+i*140,23);txt(String(it[1]),54+i*140,29,18,FG);}});big('PET BRAWL',VW-24,33,26,O,'right');}
function draw(){t++;X.save();if(shake>0){X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.85;if(shake<.5)shake=0;}bg();
 if(state==='title'||state==='won'||state==='lost'){const row=['🐜','🦦','🐟','🦩','🦔','🐘','🦈','🦏','🐆','🦚'];row.forEach((e,i)=>{X.font='48px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillStyle='#ffffff';X.fillText(e,70+i*92,300+Math.sin(t*.05+i)*10);});
  txt('[ PIXEL ARCADE ] TEAM AUTO-BATTLER',40,90,13,MUT);big(state==='title'?'PET BRAWL':state==='won'?'CHAMPION!':'KNOCKED OUT',40,190,110,state==='lost'?'#ff5a6a':FG);X.fillStyle=O;X.fillRect(40,205,60,6);
  txt(state==='title'?'Build a team of animals. They battle on their own. Win 10 battles.':'Trophies '+wins+'/10 · best '+bestWins,40,238,16,FG,'left','400 ');txt('CLICK OR PRESS SPACE TO '+(state==='title'?'PLAY':'PLAY AGAIN'),40,440,15,O);X.restore();return;}
 hud();
 if(state==='shop'){txt('YOUR TEAM',40,178,12,MUT);txt('← FRONT',40,196,11,MUT);for(let i=0;i<5;i++){const x=slotX(i),p=team[i],isSel=sel&&sel.k==='team'&&sel.i===i,hv=hover&&hover.k==='team'&&hover.i===i;X.fillStyle=isSel?'rgba(255,77,0,.25)':hv?'rgba(255,255,255,.08)':'rgba(0,0,0,.25)';X.beginPath();X.ellipse(x,TEAMY+38,44,11,0,0,7);X.fill();if(p&&!(drag&&drag.moved&&drag.from.k==='team'&&drag.from.i===i))pet(p,x,TEAMY,1,{tmp:1});}
  txt('SHOP',40,352,12,MUT);txt('3 GOLD EACH',40,370,11,MUT);shop.forEach((s,i)=>{if(!s)return;const x=shopX(i),isSel=sel&&sel.k==='shop'&&sel.i===i;X.fillStyle=frozen.has(s.id)?'rgba(120,200,255,.35)':isSel?'rgba(255,77,0,.3)':'rgba(0,0,0,.35)';X.beginPath();X.roundRect?X.roundRect(x-44,SHOPY-50,88,112,12):X.rect(x-44,SHOPY-50,88,112);X.fill();if(frozen.has(s.id)){X.strokeStyle='#9fd8ff';X.lineWidth=2;X.stroke();}
   if(drag&&drag.moved&&drag.from.k==='shop'&&drag.from.i===i)return;if(s.food){X.font='48px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillStyle='#ffffff';X.fillText(s.food.e,x,SHOPY);txt(s.food.n.toUpperCase(),x,SHOPY+50,10,MUT,'center');}else{pet(s.p,x,SHOPY-4,.82,{noLv:1});txt('T'+s.p.base.t,x-36,SHOPY-36,10,MUT);}});
  btns().forEach(b=>{const hv=hover&&hover.k==='btn'&&hover.id===b.id;X.fillStyle=b.hot?O:hv?'#333':'#1a1a1a';X.beginPath();X.roundRect?X.roundRect(b.x,b.y,b.w,b.h,17):X.rect(b.x,b.y,b.w,b.h);X.fill();txt(b.l,b.x+b.w/2,b.y+22,13,b.hot?'#000':FG,'center');});
  const info=sel?(sel.k==='shop'&&shop[sel.i]?(shop[sel.i].food||shop[sel.i].p.base):sel.k==='team'&&team[sel.i]?team[sel.i].base:null):(hover&&hover.k==='shop'&&shop[hover.i]?(shop[hover.i].food||shop[hover.i].p.base):hover&&hover.k==='team'&&team[hover.i]?team[hover.i].base:null);
  if(info){X.fillStyle='rgba(0,0,0,.7)';X.fillRect(40,60,600,54);txt(info.n.toUpperCase(),56,82,15,O);txt(info.tx,56,103,13,FG,'left','400 ');}else{txt('Drag pets from the shop onto your team. Drop a pet on the same kind to level up. Front pet fights first.',40,88,13,MUT,'left','400 ');}
  if(drag&&drag.moved){const it=drag.from.k==='shop'?shop[drag.from.i]:{p:team[drag.from.i]};if(it){if(it.food){X.font='48px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';X.textAlign='center';X.fillStyle='#ffffff';X.fillText(it.food.e,mouse.x,mouse.y);}else pet(it.p,mouse.x,mouse.y,1,{still:1});}}}
 if(state==='battle'&&battle){const B=battle;B.t++;const sp=B.fast?4:1;if(B.ph==='start'&&B.t>40/sp){battleStep();}else if(B.ph==='fight'&&B.t>55/sp){B.t=0;battleStep();}else if(B.ph==='done'&&B.t>80/sp){endBattle();}
  if(battle){big('VS',VW/2,200,40,O,'center');battle&&[battle.L,battle.R].forEach((s,k)=>{let n=0;s.team.forEach((p,i)=>{if(!p)return;const pos=n++;const x=k?VW/2+70+pos*84:VW/2-70-pos*84;let lx=0;if(p.lunge){lx=(k?-1:1)*Math.sin(Math.min(1,p.lunge)*Math.PI)*26;p.lunge+=.12;if(p.lunge>1)p.lunge=0;}pet(p,x+lx,TEAMY+10,.95,{flip:!k});});});
   if(battle.ph==='done')big(battle.res==='win'?'WIN':battle.res==='lose'?'LOSS':'DRAW',VW/2,150,64,battle.res==='win'?'#3dff8b':battle.res==='lose'?'#ff5a6a':FG,'center');txt('CLICK TO SPEED UP',VW/2,500,12,MUT,'center');}}
 // fx
 for(const f of fx){f.t--;if(f.k==='txt'){const pos=locate(f.p);if(pos){X.globalAlpha=Math.min(1,f.t/20);txt(f.txt,pos[0],pos[1]-50-(50-f.t)*.8,18,f.col,'center');X.globalAlpha=1;}}if(f.k==='burst'){for(let i=0;i<10;i++){const a=i/10*6.283,r=(20-f.t)*3;X.fillStyle=f.col;X.fillRect(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,4,4);}}if(f.k==='clash'){X.fillStyle=`rgba(255,255,255,${f.t/60})`;X.fillRect(0,0,VW,VH);}}
 fx=fx.filter(f=>f.t>0&&(f.k!=='burst'||(f.t=Math.min(f.t,20))));if(msgT>0){msgT--;X.globalAlpha=Math.min(1,msgT/30);X.fillStyle='rgba(0,0,0,.75)';X.fillRect(VW/2-260,120,520,34);txt(msg,VW/2,143,14,FG,'center');X.globalAlpha=1;}X.restore();}
function locate(p){if(state==='shop'){const i=team.indexOf(p);if(i>=0)return[slotX(i),TEAMY];const s=shop.findIndex(x=>x&&x.p===p);if(s>=0)return[shopX(s),SHOPY];}if(battle){for(const[k,s]of[[0,battle.L],[1,battle.R]]){let n=0;for(const q of s.team){if(!q)continue;if(q===p)return[k?VW/2+70+n*84:VW/2-70-n*84,TEAMY+10];n++;}}}return null;}
function loop(){draw();requestAnimationFrame(loop);}loop();
window.PETS={newGame,get state(){return state;},get team(){return team;},get shop(){return shop;},get gold(){return gold;},buyTo,act,sell,get battle(){return battle;},battleStep,endBattle,get wins(){return wins;},get lives(){return lives;},get turn(){return turn;},startBattle};
})();
