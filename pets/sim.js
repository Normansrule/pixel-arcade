// PET BRAWL — pure game logic (no DOM): run state, shop, food, merging, abilities, ghost teams, battle simulation.
// The battle is simulated up front and returns an event log the 3D scene plays back.
import {PETS,TOKENS,FOODS,ARCH,ADJ,NOUN,petById,foodById,tierFor} from './data.js';

export function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
let UID=1;const uid=()=>UID++;
export const COST=3,ROLL=1,START_GOLD=10,LIVES=6,TROPHIES=10;
export const levelOf=xp=>xp>=5?3:xp>=2?2:1;
export function mkPet(id,o={}){const b=petById(id);return{uid:uid(),id,a:o.a??b.a,h:o.h??b.h,lv:o.lv||1,xp:o.xp??(o.lv===3?5:o.lv===2?2:0),perk:o.perk||null,tmpA:0,tmpH:0,dmg:0,kos:0};}
export const shopPetCount=t=>t<5?3:t<9?4:5,shopFoodCount=t=>t<3?1:2;

/* ================= run ================= */
export function newRun(o={}){const G={seed:o.seed??(Math.random()*1e9|0),turn:0,gold:0,lives:LIVES,wins:0,losses:0,draws:0,team:[null,null,null,null,null],shop:[],shopBuff:{a:0,h:0},diff:o.diff??1,log:[],history:[],over:null,best:null};G.r=rng(G.seed);startTurn(G);return G;}
export function startTurn(G){G.turn++;G.gold=START_GOLD;G.team.forEach(p=>{if(p){p.tmpA=0;p.tmpH=0;}});
 triggerShop(G,'startTurn');roll(G,false);}
function poolFor(G,tier){return PETS.filter(p=>p.t<=tier);}
export function roll(G,paid=true){if(paid){if(G.gold<ROLL)return false;G.gold-=ROLL;}const tier=tierFor(G.turn),r=G.r;const np=shopPetCount(G.turn),nf=shopFoodCount(G.turn);
 const keepP=G.shop.filter(s=>s&&s.frozen&&s.kind==='pet'),keepF=G.shop.filter(s=>s&&s.frozen&&s.kind==='food');
 const pets=keepP.slice(0,Math.max(np,keepP.length)),foods=keepF.slice(0,Math.max(nf,keepF.length));const pool=poolFor(G,tier),fpool=FOODS.filter(f=>f.t<=tier);
 while(pets.length<np){const b=pool[r()*pool.length|0];pets.push({kind:'pet',pet:mkPet(b.id,{a:b.a+G.shopBuff.a,h:b.h+G.shopBuff.h}),frozen:false,sid:uid()});}
 while(foods.length<nf){const f=fpool[r()*fpool.length|0];foods.push({kind:'food',food:f.id,frozen:false,sid:uid()});}
 G.shop=[...pets,...foods];return true;}
export const teamCount=G=>G.team.filter(Boolean).length;
function makeRoom(G,slot){if(!G.team[slot])return true;const e=G.team.indexOf(null);if(e<0)return false;// shift towards the empty slot
 if(e>slot){for(let i=e;i>slot;i--)G.team[i]=G.team[i-1];}else{for(let i=e;i<slot;i++)G.team[i]=G.team[i+1];}G.team[slot]=null;return true;}
export function canBuy(G,si){const s=G.shop[si];return !!s&&G.gold>=COST;}
export function buy(G,si,slot){const s=G.shop[si];if(!s)return{ok:false,msg:'Nothing there.'};if(G.gold<COST)return{ok:false,msg:'Not enough gold.'};
 if(s.kind==='food')return feed(G,si,slot);
 const cur=G.team[slot];
 if(cur&&cur.id===s.pet.id){if(cur.lv>=3)return{ok:false,msg:'Already max level.'};G.gold-=COST;G.shop.splice(si,1);const up=merge(G,cur,s.pet);trigger(G,'buy',cur);return{ok:true,merged:true,levelUp:up,pet:cur};}
 if(cur&&!makeRoom(G,slot))return{ok:false,msg:'Team is full. Sell a pet or merge.'};
 G.gold-=COST;G.shop.splice(si,1);G.team[slot]=s.pet;trigger(G,'buy',s.pet);return{ok:true,pet:s.pet};}
export function merge(G,dst,src){const before=dst.lv;dst.xp=Math.min(5,dst.xp+src.xp+1);dst.a=Math.max(dst.a,src.a)+1;dst.h=Math.max(dst.h,src.h)+1;dst.lv=levelOf(dst.xp);if(src.perk&&!dst.perk)dst.perk=src.perk;
 if(dst.lv>before){G.log.push({e:'level',uid:dst.uid,lv:dst.lv});// bonus pet from the next tier
  const t=Math.min(6,tierFor(G.turn)+1),pool=PETS.filter(p=>p.t===t),b=pool[G.r()*pool.length|0];G.shop.splice(G.shop.filter(x=>x.kind==='pet').length,0,{kind:'pet',pet:mkPet(b.id,{a:b.a+G.shopBuff.a,h:b.h+G.shopBuff.h}),frozen:false,sid:uid(),bonus:true});return true;}return false;}
export function feed(G,si,slot){const s=G.shop[si],f=foodById(s.food),p=G.team[slot];const needsPet=['stat','perk','temp','xp'].includes(f.k);
 if(needsPet&&!p)return{ok:false,msg:'Drop food onto a pet.'};if(G.gold<COST)return{ok:false,msg:'Not enough gold.'};
 if(f.k==='xp'&&p.lv>=3&&!f.a)return{ok:false,msg:'Already max level.'};
 G.gold-=COST;G.shop.splice(si,1);let up=false;
 if(f.k==='stat')buffP(G,p,f.a,f.h);else if(f.k==='temp'){p.tmpA+=f.a;p.tmpH+=f.h;G.log.push({e:'buff',uid:p.uid,a:f.a,h:f.h,tmp:1});}
 else if(f.k==='perk'){p.perk=f.perk;G.log.push({e:'perk',uid:p.uid,perk:f.perk});}
 else if(f.k==='xp'){for(let i=0;i<f.cnt;i++)if(p.lv<3)up=merge(G,p,{xp:-1,a:0,h:0})||up;if(f.a)buffP(G,p,f.a,f.h);}
 else if(f.k==='multi'){const c=G.team.filter(Boolean).sort(()=>G.r()-.5).slice(0,f.cnt);c.forEach(q=>buffP(G,q,f.a,f.h));}
 else if(f.k==='all'){G.team.filter(Boolean).forEach(q=>buffP(G,q,f.a,f.h));}
 else if(f.k==='shop'){G.shopBuff.a+=f.a;G.shopBuff.h+=f.h;G.shop.forEach(x=>{if(x.kind==='pet'){x.pet.a+=f.a;x.pet.h+=f.h;}});G.log.push({e:'shopbuff'});}
 if(p&&needsPet)trigger(G,'eat',p);else G.team.filter(Boolean).forEach(q=>{});
 return{ok:true,food:f,pet:p,levelUp:up};}
export function sell(G,slot){const p=G.team[slot];if(!p)return{ok:false};G.gold+=p.lv;trigger(G,'sell',p);G.team[slot]=null;G.log.push({e:'sold',uid:p.uid});return{ok:true,pet:p,gold:p.lv};}
export function move(G,from,to){if(from===to)return{ok:false};const a=G.team[from],b=G.team[to];if(!a)return{ok:false};
 if(b&&b.id===a.id&&b.lv<3&&a!==b){const up=merge(G,b,a);G.team[from]=null;return{ok:true,merged:true,levelUp:up,pet:b};}
 G.team[to]=a;G.team[from]=b;return{ok:true};}
export function freeze(G,si){const s=G.shop[si];if(!s)return false;s.frozen=!s.frozen;return true;}
function buffP(G,p,a,h){p.a=Math.max(1,Math.min(50,p.a+a));p.h=Math.max(1,Math.min(50,p.h+h));G.log.push({e:'buff',uid:p.uid,a,h});}

/* ---------- shop-phase triggers ---------- */
function shopApi(G,me){const T=G.team,idx=T.indexOf(me);const alive=()=>T.filter(Boolean);return{me,L:me.lv,idx,
 friends:(inc)=>alive().filter(p=>inc||p!==me),ahead:n=>{const o=[];for(let i=idx-1;i>=0&&o.length<n;i--)if(T[i])o.push(T[i]);return o;},behind:n=>{const o=[];for(let i=idx+1;i<5&&o.length<n;i++)if(T[i])o.push(T[i]);return o;},
 foes:()=>[],all:()=>alive().filter(p=>p!==me),rand:(arr,n)=>arr.slice().sort(()=>G.r()-.5).slice(0,n),buff:(t,a,h)=>{if(t)buffP(G,t,a,h);},dmg:()=>{},perk:(t,p)=>{if(t){t.perk=p;G.log.push({e:'perk',uid:t.uid,perk:p});}},
 summon:()=>{},gold:n=>{G.gold+=n;G.log.push({e:'gold',n});},shopPets:()=>G.shop.filter(s=>s.kind==='pet').map(s=>s.pet),goldLeft:()=>G.gold,tierOf:p=>petById(p.id).t};}
function trigger(G,trig,me,o){const b=petById(me.id);if(!b||b.trig!==trig||!b.fn)return;G.log.push({e:'ability',uid:me.uid,trig,n:b.n});b.fn(shopApi(G,me),o);}
function triggerShop(G,trig){const ord=G.team.filter(Boolean).sort((a,b)=>b.a-a.a);for(const p of ord)if(G.team.includes(p))trigger(G,trig,p);}
export function endTurnTriggers(G){triggerShop(G,'endTurn');}

/* ================= ghosts ================= */
export function ghost(turn,diff=1,r=Math.random){const tier=tierFor(turn),arch=ARCH[r()*ARCH.length|0];const n=Math.min(5,turn<=2?2+turn:1+turn);const mul=[.55,.8,1.05][diff];
 const pool=PETS.filter(p=>p.t<=tier&&p.id!=='scorpion'||(p.id==='scorpion'&&tier>=5&&r()<.3));const out=[];
 for(let k=0;k<n;k++){let tot=0;const w=pool.map(p=>{let v=1+p.t/tier*1.5;if(arch.tags.some(t=>p.tags.includes(t)))v*=3;if(p.t===tier)v*=1.3;tot+=v;return v;});let x=r()*tot,b=pool[0];for(let i=0;i<pool.length;i++){x-=w[i];if(x<=0){b=pool[i];break;}}
  const p2=Math.min(.6,Math.max(0,(turn-3)*.09)),p3=Math.min(.4,Math.max(0,(turn-7)*.06));const lv=r()<p3?3:r()<p2?2:1;const pet=mkPet(b.id,{lv});
  const bonus=Math.round((turn-1)*1.1*mul+(lv-1));let ba=0;for(let i=0;i<bonus;i++)if(r()<.5)ba++;pet.a=Math.min(50,pet.a+ba+(lv-1));pet.h=Math.min(50,pet.h+(bonus-ba)+(lv-1));
  if(r()<Math.min(.65,turn*.055)){const pf=FOODS.filter(f=>f.k==='perk'&&f.t<=tier);pet.perk=pf[r()*pf.length|0].perk;}out.push(pet);}
 // order: tanky up front, snipers / start-of-battle at the back
 const score=p=>{const b=petById(p.id);return p.h*1.2-p.a*.3+(b.tags.includes('tank')?6:0)+(b.tags.includes('hurt')?3:0)-(b.tags.includes('snipe')?6:0)-(b.trig==='start'?3:0)-(b.trig==='faint'&&b.tags.includes('summon')?-2:0);};
 out.sort((a,b)=>score(b)-score(a));while(out.length<5)out.push(null);
 return{team:out,name:'The '+ADJ[r()*ADJ.length|0]+' '+NOUN[r()*NOUN.length|0],arch:arch.n};}

/* ================= battle ================= */
export function battle(teamA,teamB,r=Math.random){const ev=[];const sides=[[],[]];
 const mk=(p,side)=>({uid:uid(),src:p.uid,id:p.id,a:Math.min(50,p.a+(p.tmpA||0)),h:Math.min(50,p.h+(p.tmpH||0)),lv:p.lv||1,perk:p.perk||null,side,dealt:0,uses:0,meatUsed:false,reborn:p.reborn});
 teamA.forEach(p=>p&&sides[0].push(mk(p,0)));teamB.forEach(p=>p&&sides[1].push(mk(p,1)));
 const order=()=>[sides[0].map(u=>u.uid),sides[1].map(u=>u.uid)];
 ev.push({e:'init',units:[...sides[0],...sides[1]].map(u=>({uid:u.uid,id:u.id,a:u.a,h:u.h,lv:u.lv,perk:u.perk,side:u.side,src:u.src})),order:order()});
 let hurtQ=[];
 const alive=s=>sides[s].filter(u=>u.h>0);
 function deal(t,n,src,isAttack){if(!t||t.h<=0||n<=0)return 0;let d=n;
  if(t.perk==='bubble'){const b=Math.min(15,d);d-=b;t.perk=null;ev.push({e:'perk',uid:t.uid,perk:null,pop:'bubble'});}
  if(d>0&&t.perk==='armor')d=Math.max(1,d-2);
  if(d<=0){ev.push({e:'block',uid:t.uid});return 0;}
  if(isAttack&&src&&src.id==='scorpion')d=Math.max(d,t.h);
  t.h-=d;if(src){src.dealt+=d;t.lastHit=src;t.lastAtk=!!isAttack;}ev.push({e:'dmg',uid:t.uid,n:d,h:t.h,src:src?src.uid:0,atk:!!isAttack});if(t.h>0&&!hurtQ.includes(t))hurtQ.push(t);return d;}
 function api(me,forced){const S=sides[me.side],O=sides[1-me.side];const idx=forced??S.indexOf(me),b0=forced!==undefined?idx:idx+1;
  return{me,L:me.lv,idx:Math.max(0,idx),
   friends:(inc)=>S.filter(u=>u.h>0&&(inc||u!==me)),ahead:n=>{const o=[];for(let i=Math.min(idx,S.length)-1;i>=0&&o.length<n;i--)if(S[i].h>0)o.push(S[i]);return o;},behind:n=>{const o=[];for(let i=b0;i<S.length&&o.length<n;i++)if(S[i].h>0)o.push(S[i]);return o;},
   foes:()=>O.filter(u=>u.h>0),all:()=>[...S,...O].filter(u=>u.h>0&&u!==me),rand:(arr,n)=>arr.slice().sort(()=>r()-.5).slice(0,n),
   buff:(t,a,h)=>{if(!t||t.h<=0)return;t.a=Math.max(1,Math.min(50,t.a+a));t.h=Math.max(1,Math.min(50,t.h+h));ev.push({e:'buff',uid:t.uid,a,h,na:t.a,nh:t.h});},
   dmg:(t,n)=>deal(t,n,me,false),perk:(t,p)=>{if(!t||t.h<=0)return;t.perk=p;ev.push({e:'perk',uid:t.uid,perk:p});},
   summon:(spec,at)=>summon(me.side,spec,at),gold:()=>{},shopPets:()=>[],goldLeft:()=>0,tierOf:u=>(petById(u.id)||{t:1}).t};}
 function summon(side,spec,at){const S=sides[side];if(S.filter(u=>u.h>0).length>=5)return null;const b=petById(spec.id);
  const u={uid:uid(),src:0,id:spec.id,a:spec.a??b.a,h:spec.h??b.h,lv:spec.lv||1,perk:null,side,dealt:0,uses:0,meatUsed:false,reborn:spec.reborn,summoned:true};
  S.splice(Math.min(Math.max(0,at),S.length),0,u);ev.push({e:'summon',unit:{uid:u.uid,id:u.id,a:u.a,h:u.h,lv:u.lv,side,perk:null},order:order()});
  for(const f of S)if(f!==u&&f.h>0)fire(f,'summoned',u);return u;}
 function fire(u,trig,o){const b=petById(u.id);if(!b||b.trig!==trig||!b.fn)return;if(u.h<=0&&trig!=='faint')return;ev.push({e:'ability',uid:u.uid,trig,n:b.n});b.fn(api(u),o);}
 function resolve(){for(let guard=0;guard<60;guard++){let did=false;
   const hq=hurtQ;hurtQ=[];for(const u of hq){if(u.h>0){fire(u,'hurt');did=true;}}
   for(const s of[0,1]){const S=sides[s];for(let i=0;i<S.length;i++){const u=S[i];if(u.h>0)continue;did=true;
     const idx=i;S.splice(i,1);i--;ev.push({e:'faint',uid:u.uid,order:order()});
     const behindU=S[idx]&&S[idx].h>0?S[idx]:null;
     // faint ability runs "at" its old index
     const b=petById(u.id);if(b&&b.trig==='faint'&&b.fn){ev.push({e:'ability',uid:u.uid,trig:'faint',n:b.n});b.fn(api(u,idx));}
     if(u.perk==='honey')summon(s,{id:'bumble',a:1,h:1},idx);
     if(u.perk==='revive')summon(s,{id:u.id,a:1,h:1,lv:u.lv},idx);
     if(behindU)fire(behindU,'friendAheadFaint');
     for(const f of S)if(f.h>0)fire(f,'friendFaint');
     const k=u.lastHit;if(k&&k.h>0&&u.lastAtk&&k.side!==s){k.kos=(k.kos||0)+1;fire(k,'ko');}}}
   if(!did&&!hurtQ.length)break;}}
 // ---- start of battle
 ev.push({e:'phase',p:'start'});
 const starters=[...sides[0],...sides[1]].sort((a,b)=>b.a-a.a||r()-.5);
 for(const u of starters){if(u.h<=0)continue;fire(u,'start');if(u.perk==='thunder'){const O=alive(1-u.side);if(O.length){ev.push({e:'ability',uid:u.uid,trig:'start',n:'Thunder Cake'});deal(O[r()*O.length|0],6,u,false);}}}
 resolve();
 // ---- rounds
 let rounds=0;
 while(alive(0).length&&alive(1).length&&rounds<120){rounds++;const A=alive(0)[0],B=alive(1)[0];
  fire(A,'before');if(B.h>0)fire(B,'before');resolve();
  if(!(A.h>0&&B.h>0&&alive(0)[0]===A&&alive(1)[0]===B)){continue;}
  let da=A.a,db=B.a;if(A.perk==='meat'&&!A.meatUsed){da+=8;A.meatUsed=true;}if(B.perk==='meat'&&!B.meatUsed){db+=8;B.meatUsed=true;}
  ev.push({e:'attack',a:A.uid,b:B.uid});
  deal(B,da,A,true);deal(A,db,B,true);
  if(A.perk==='chili'){const t=alive(1)[1];if(t)deal(t,4,A,false);}if(B.perk==='chili'){const t=alive(0)[1];if(t)deal(t,4,B,false);}
  resolve();}
 const a0=alive(0).length,a1=alive(1).length;const res=a0&&!a1?'win':a1&&!a0?'lose':'draw';
 ev.push({e:'end',res});
 const dealt={};[...sides[0]].forEach(u=>{if(u.src)dealt[u.src]=(dealt[u.src]||0)+u.dealt;});
 return{res,ev,rounds,dealt,survivors:alive(0).map(u=>u.src)};}
// helper used during battle to credit damage to the player's pets (incl. those that fainted)
export function playTurn(G,diff=G.diff){endTurnTriggers(G);const gh=ghost(G.turn,diff,G.r);const B=battle(G.team,gh.team,G.r);return{gh,B};}
export function applyResult(G,res,dealt={}){for(const p of G.team)if(p&&dealt[p.uid])p.dmg+=dealt[p.uid];
 let lost=0;if(res==='win')G.wins++;else if(res==='lose'){lost=G.turn<=4?1:2;G.lives=Math.max(0,G.lives-lost);G.losses++;}else G.draws++;
 G.history.push({turn:G.turn,res,team:G.team.map(p=>p?{id:p.id,a:p.a,h:p.h,lv:p.lv}:null)});
 if(G.wins>=TROPHIES)G.over='win';else if(G.lives<=0)G.over='lose';return lost;}
export function score(G){return G.wins*100+G.lives*25+(G.over==='win'?500:0)+Math.max(0,30-G.turn)*5*(G.over==='win'?1:0);}
