// BLOCK BEASTS — turn-based battle rules (pure logic; the game presents the event list it returns).
import {SPECIES,MOVES,eff,statOf,hpOf,xpFor,PREV,ITEMS} from './data.js';

let UID=1;export function setUid(n){UID=Math.max(UID,n);}
export function fullLs(id){const s=SPECIES[id];return(PREV[id]?fullLs(PREV[id]):[]).concat(s.ls);}
export function movesAt(id,lv){const out=[];for(const[l,m]of fullLs(id))if(l<=lv){const i=out.indexOf(m);if(i>=0)out.splice(i,1);out.push(m);}return out.slice(-4);}
export function mkMon(id,lv,o={}){const m={sp:id,lv,xp:xpFor(lv),hp:0,moves:movesAt(id,lv),status:null,sleepT:0,uid:UID++,...o};m.hp=maxHp(m);return m;}
export const maxHp=m=>hpOf(SPECIES[m.sp].b[0],m.lv);
export function stats(m){const b=SPECIES[m.sp].b;return{hp:maxHp(m),atk:statOf(b[1],m.lv),def:statOf(b[2],m.lv),spd:statOf(b[3],m.lv)};}
export const nameOf=m=>m.nick||SPECIES[m.sp].n;
const stageMul=s=>s>=0?(2+s)/2:2/(2-s);
const val=k=>{const M=MOVES[k];return M.pow||48;};
export const STATUS_N={burn:'BURNED',freeze:'FROZEN',sleep:'ASLEEP',para:'PARALYZED'};
const IMMUNE={burn:'EMBER',freeze:'FROST',para:'SPARK'};

// gain xp, returns events (level ups, learned moves, pending evolution)
export function gainXp(m,amt,idx,ev){if(m.hp<=0||m.lv>=60)return;m.xp+=amt;ev.push({e:'xp',idx,amt,uid:m.uid});
 while(m.lv<60&&m.xp>=xpFor(m.lv+1)){const old=maxHp(m);m.lv++;m.hp=Math.min(maxHp(m),m.hp+maxHp(m)-old);ev.push({e:'lvl',idx,lv:m.lv,uid:m.uid,name:nameOf(m)});
  for(const[l,k]of fullLs(m.sp))if(l===m.lv&&!m.moves.includes(k)){let forgot=null;if(m.moves.length<4)m.moves.push(k);else{let wi=0;m.moves.forEach((q,i)=>{if(val(q)<val(m.moves[wi]))wi=i;});if(val(k)>=val(m.moves[wi])){forgot=m.moves[wi];m.moves[wi]=k;}else continue;}ev.push({e:'learn',idx,move:k,forgot,name:nameOf(m)});}
  const evo=SPECIES[m.sp].evo;if(evo&&m.lv>=evo[1])m.evolve=evo[0];}}

export class Battle{
 // party: player's array (mutated); foes: array of mons; o: {kind:'wild'|'trainer', name, leader, smart (0..1)}
 constructor(party,foes,bag,o={}){this.party=party;this.foes=foes;this.bag=bag;this.kind=o.kind||'wild';this.tname=o.name||'';this.leader=!!o.leader;this.smart=o.smart??(this.kind==='wild'?0:o.leader?.9:.6);
  this.me=party.findIndex(m=>m.hp>0);this.fi=0;this.st={me:{atk:0,def:0,spd:0},foe:{atk:0,def:0,spd:0}};this.part=new Set([party[this.me]?.uid]);this.runs=0;this.over=null;this.need=false;this.turnNo=0;this.potions=o.leader?1:0;this.rng=o.rng||Math.random;}
 get A(){return this.party[this.me];}get F(){return this.foes[this.fi];}
 mon(side){return side==='me'?this.A:this.F;}
 spd(side){const m=this.mon(side),s=stats(m).spd*stageMul(this.st[side].spd);return m.status==='para'?s*.5:s;}
 aiMove(){const F=this.F,A=this.A;const opts=F.moves.map(k=>{const M=MOVES[k];let sc;if(M.pow){const stab=M.type===SPECIES[F.sp].t?1.5:1;sc=M.pow*stab*eff(M.type,SPECIES[A.sp].t)*M.acc/100;}else if(M.st)sc=A.status||IMMUNE[M.st]===SPECIES[A.sp].t?0:38*M.acc/100;else if(M.self){const k2=Object.keys(M.self)[0];sc=this.st.foe[k2]>=2?0:30;}else sc=this.st.me.spd<=-2?0:22;return{k,sc};});
  if(this.rng()<this.smart){opts.sort((a,b)=>b.sc-a.sc);return opts[0].k;}const dmg=opts.filter(o=>MOVES[o.k].pow);const pool=this.rng()<.7&&dmg.length?dmg:opts;return pool[Math.floor(this.rng()*pool.length)].k;}
 // damage calc (exposed for tests/AI)
 damage(side,k,crit){const M=MOVES[k],att=this.mon(side),def=this.mon(side==='me'?'foe':'me'),os=side==='me'?'foe':'me';const S1=stats(att),S2=stats(def);
  const A=S1.atk*stageMul(this.st[side].atk),D=S2.def*stageMul(this.st[os].def);const stab=M.type===SPECIES[att.sp].t?1.5:1,ef=eff(M.type,SPECIES[def.sp].t);
  let d=Math.floor(Math.floor(Math.floor(2*att.lv/5+2)*M.pow*A/D)/50)+2;d=d*stab*ef*(crit?1.5:1)*(.85+this.rng()*.15)*(att.status==='burn'&&M.cat==='p'?.6:1)*(this.kind==='wild'&&side==='foe'?.8:1);return{d:Math.max(1,Math.floor(d)),ef};}
 useMove(side,k,ev){const att=this.mon(side),os=side==='me'?'foe':'me',def=this.mon(os),M=MOVES[k];
  // status gates
  if(att.status==='freeze'){if(this.rng()<.25){att.status=null;ev.push({e:'cure',side,st:'freeze',s:nameOf(att)+' THAWED OUT!'});}else{ev.push({e:'cant',side,st:'freeze',s:nameOf(att)+' IS FROZEN SOLID!'});return;}}
  if(att.status==='sleep'){if(--att.sleepT<=0){att.status=null;ev.push({e:'cure',side,st:'sleep',s:nameOf(att)+' WOKE UP!'});}else{ev.push({e:'cant',side,st:'sleep',s:nameOf(att)+' IS FAST ASLEEP.'});return;}}
  if(att.status==='para'&&this.rng()<.25){ev.push({e:'cant',side,st:'para',s:nameOf(att)+' IS PARALYZED! IT CAN\'T MOVE!'});return;}
  ev.push({e:'use',side,move:k,s:(side==='foe'?(this.kind==='wild'?'WILD ':'FOE '):'')+nameOf(att)+' USED '+M.n+'!'});
  const selfOnly=M.cat==='x'&&M.self;
  if(!selfOnly&&this.rng()*100>=M.acc){ev.push({e:'miss',side,s:'BUT IT MISSED!'});return;}
  if(M.pow){const crit=this.rng()<(M.crit?1/6:1/16);const{d,ef}=this.damage(side,k,crit);const dealt=Math.min(def.hp,d);def.hp-=dealt;
   ev.push({e:'dmg',side:os,amt:dealt,ef,crit,hp:def.hp,type:M.type});if(crit)ev.push({e:'msg',s:'A CRITICAL HIT!'});if(ef>1)ev.push({e:'msg',s:'IT\'S SUPER EFFECTIVE!'});if(ef<1)ev.push({e:'msg',s:'IT\'S NOT VERY EFFECTIVE...'});
   if(M.drain&&att.hp>0){const h=Math.min(stats(att).hp-att.hp,Math.max(1,Math.floor(dealt*M.drain)));if(h>0){att.hp+=h;ev.push({e:'heal',side,amt:h,hp:att.hp,s:nameOf(att)+' DRAINED '+h+' HP!'});}}
   if(def.status==='freeze'&&M.type==='EMBER'&&def.hp>0){def.status=null;ev.push({e:'cure',side:os,st:'freeze',s:nameOf(def)+' THAWED OUT!'});}}
  if(def.hp>0||!M.pow){
   if(M.st&&(M.ch>=1||this.rng()<M.ch)){if(def.hp>0){if(def.status){if(!M.pow)ev.push({e:'msg',s:'BUT IT FAILED!'});}else if(IMMUNE[M.st]===SPECIES[def.sp].t){if(!M.pow)ev.push({e:'msg',s:'IT DOESN\'T AFFECT '+nameOf(def)+'...'});}else{def.status=M.st;if(M.st==='sleep')def.sleepT=1+Math.floor(this.rng()*3);ev.push({e:'status',side:os,st:M.st,s:nameOf(def)+' IS '+STATUS_N[M.st]+'!'});}}}
   if(M.self)for(const[s,n]of Object.entries(M.self)){const c=this.st[side];if(c[s]>=4){ev.push({e:'msg',s:'NOTHING HAPPENED.'});continue;}c[s]=Math.min(4,c[s]+n);ev.push({e:'stat',side,stat:s,n,s:nameOf(att)+'\'S '+{atk:'ATTACK',def:'DEFENSE',spd:'SPEED'}[s]+(n>1?' ROSE SHARPLY!':' ROSE!')});}
   if(M.foe&&def.hp>0&&(M.ch??1)>=1)for(const[s,n]of Object.entries(M.foe)){const c=this.st[os];if(c[s]<=-4)continue;c[s]=Math.max(-4,c[s]+n);ev.push({e:'stat',side:os,stat:s,n,s:nameOf(def)+'\'S '+{atk:'ATTACK',def:'DEFENSE',spd:'SPEED'}[s]+' FELL!'});}}}
 xpFor(F){return Math.floor(SPECIES[F.sp].xp*F.lv/5*(this.kind==='trainer'?1.5:1)*1.5);}
 foeFainted(ev){const F=this.F;ev.push({e:'faint',side:'foe',s:(this.kind==='wild'?'WILD ':'FOE ')+nameOf(F)+' FAINTED!'});const g=this.xpFor(F);
  this.party.forEach((m,i)=>{if(m.hp<=0)return;const amt=this.part.has(m.uid)?g:Math.floor(g*.4);if(amt>0)gainXp(m,amt,i,ev);});
  const next=this.foes.findIndex(m=>m.hp>0);if(next<0){this.over='win';const coins=this.kind==='trainer'?Math.max(...this.foes.map(f=>f.lv))*(this.leader?40:22):Math.max(4,F.lv*4);this.coins=coins;ev.push({e:'end',result:'win',coins,s:this.kind==='trainer'?'YOU DEFEATED '+this.tname+'!':''});return;}
  this.fi=next;this.st.foe={atk:0,def:0,spd:0};this.part=new Set([this.A.uid]);ev.push({e:'switch',side:'foe',idx:next,s:this.tname+' SENT OUT '+nameOf(this.F)+'!'});}
 meFainted(ev){ev.push({e:'faint',side:'me',s:nameOf(this.A)+' FAINTED!'});if(this.party.some(m=>m.hp>0)){this.need=true;ev.push({e:'need'});}else{this.over='lose';ev.push({e:'end',result:'lose',s:'YOU HAVE NO BEASTS LEFT TO FIGHT!'});}}
 checkFaints(ev){if(this.over)return true;let stop=false;if(this.F.hp<=0){this.foeFainted(ev);stop=true;if(this.over)return true;}if(this.A.hp<=0){this.meFainted(ev);return true;}return stop;}
 doSwitch(i,ev){ev.push({e:'recall',side:'me',s:nameOf(this.A)+', COME BACK!'});this.me=i;this.st.me={atk:0,def:0,spd:0};this.part.add(this.A.uid);ev.push({e:'switch',side:'me',idx:i,s:'GO, '+nameOf(this.A)+'!'});}
 // free switch after a faint
 forceSwitch(i){const ev=[];if(!this.need||!this.party[i]||this.party[i].hp<=0)return ev;this.need=false;this.me=i;this.st.me={atk:0,def:0,spd:0};this.part.add(this.A.uid);ev.push({e:'switch',side:'me',idx:i,s:'GO, '+nameOf(this.A)+'!'});return ev;}
 catchChance(k){const F=this.F,s=SPECIES[F.sp],S=stats(F);const sm=F.status==='sleep'||F.status==='freeze'?2:F.status?1.5:1;return Math.min(1,s.cr*ITEMS[k].ball*sm*(1-.78*F.hp/S.hp)+.03);}
 turn(a){const ev=[];if(this.over||this.need)return ev;this.turnNo++;const foeMove=this.aiMove();let myMove=null;
  if(a.t==='run'){if(this.kind!=='wild'){ev.push({e:'msg',s:'NO RUNNING FROM A TRAINER BATTLE!'});return ev;}this.runs++;const ok=this.spd('me')>=this.spd('foe')||this.rng()<.45+this.runs*.15;
   if(ok){this.over='run';ev.push({e:'run',ok:true,s:'GOT AWAY SAFELY!'});ev.push({e:'end',result:'run'});return ev;}ev.push({e:'run',ok:false,s:'COULDN\'T GET AWAY!'});}
  else if(a.t==='switch'){if(a.i===this.me||!this.party[a.i]||this.party[a.i].hp<=0)return ev;this.doSwitch(a.i,ev);}
  else if(a.t==='item'){const it=ITEMS[a.k];const m=this.party[a.i??this.me];if(!(this.bag[a.k]>0)||!m)return ev;
   if(it.revive){if(m.hp>0)return ev;m.hp=Math.floor(maxHp(m)/2);ev.push({e:'item',k:a.k,i:a.i,s:nameOf(m)+' WAS REVIVED!'});}
   else if(it.heal){if(m.hp<=0||m.hp>=maxHp(m))return ev;const h=Math.min(it.heal,maxHp(m)-m.hp);m.hp+=h;ev.push({e:'item',k:a.k,i:a.i,s:'USED '+it.n+'. '+nameOf(m)+' RECOVERED '+h+' HP!'});if(m===this.A)ev.push({e:'heal',side:'me',amt:h,hp:m.hp});}
   else if(it.cure){if(!m.status||m.hp<=0)return ev;m.status=null;ev.push({e:'item',k:a.k,i:a.i,s:'USED REMEDY. '+nameOf(m)+' IS CURED!'});if(m===this.A)ev.push({e:'cure',side:'me',st:'any',s:''});}
   else if(it.ball){if(this.kind!=='wild'){ev.push({e:'msg',s:'YOU CAN\'T CATCH ANOTHER TRAINER\'S BEAST!'});return ev;}this.bag[a.k]--;const p=this.catchChance(a.k),q=Math.pow(p,1/3);let shakes=0;while(shakes<3&&this.rng()<q)shakes++;const ok=shakes===3;
    ev.push({e:'cube',k:a.k,shakes,ok,s:'YOU THREW A '+it.n+'!'});if(ok){this.over='caught';ev.push({e:'end',result:'caught',s:'GOTCHA! '+nameOf(this.F)+' WAS CAUGHT!'});return ev;}ev.push({e:'msg',s:['OH NO! IT BROKE FREE!','ARGH! SO CLOSE!','ALMOST HAD IT!','SO CLOSE!'][shakes]});}
   if(!it.ball)this.bag[a.k]--;}
  else if(a.t==='move')myMove=this.A.moves[a.i]||this.A.moves[0];
  // moves in priority/speed order
  const order=[];if(myMove)order.push({side:'me',k:myMove});order.push({side:'foe',k:foeMove});
  // leader/trainer potion
  if(this.potions>0&&this.F.hp>0&&this.F.hp<stats(this.F).hp*.25&&this.rng()<.5){this.potions--;order.pop();const h=Math.min(60,stats(this.F).hp-this.F.hp);this.F.hp+=h;ev.push({e:'heal',side:'foe',amt:h,hp:this.F.hp,s:this.tname+' USED A POTION!'});}
  order.sort((x,y)=>(MOVES[y.k].prio||0)-(MOVES[x.k].prio||0)||this.spd(y.side)-this.spd(x.side)||(this.rng()-.5));
  for(const o of order){if(this.mon(o.side).hp<=0)continue;if(this.mon(o.side==='me'?'foe':'me').hp<=0)continue;this.useMove(o.side,o.k,ev);if(this.checkFaints(ev))return ev;}
  // end of turn: burn
  for(const side of['me','foe']){const m=this.mon(side);if(m.status==='burn'&&m.hp>0){const d=Math.max(1,Math.floor(stats(m).hp/12));m.hp=Math.max(0,m.hp-d);ev.push({e:'statusdmg',side,st:'burn',amt:d,hp:m.hp,s:nameOf(m)+' IS HURT BY ITS BURN!'});}}
  this.checkFaints(ev);return ev;}
}
