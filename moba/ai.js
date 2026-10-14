// AEONFALL — CPU champions: laning (last hits, trades, tower safety), jungling (camp routes, smite, ganks),
// objectives (drake, warden), late-game grouping and pushing, defence, recalls and shopping. Bots see only what their team sees.
import * as MAP from './map.js';
import {ITEMS,priceOf,MON} from './data.js';
import {polyProj,polyAt,cl} from './util.js';

export const DIFF=[
 {name:'EASY',think:.55,aim:2.2,lh:.3,use:.45,dodge:0,aggr:.7,dive:0,react:.5,trade:.4},
 {name:'NORMAL',think:.32,aim:1.1,lh:.7,use:.8,dodge:.35,aggr:1,dive:.3,react:.25,trade:.75},
 {name:'HARD',think:.18,aim:.35,lh:.95,use:1,dodge:.75,aggr:1.2,dive:.6,react:.1,trade:1}];
const H=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

export class Brains{
 constructor(S,diff,allyDiff){this.S=S;this.D=[DIFF[allyDiff??diff],DIFF[diff]];this.team=[{call:null,callT:0},{call:null,callT:0}];this.tT=0;
  for(const u of S.champs)u.brain={t:Math.random()*.3,bi:0,gankT:90/S.T+Math.random()*20,mode:'',lastGo:null,campT:0,dodgeT:0,goal:null};}
 update(dt,autopilot){const S=this.S;this.tT-=dt;if(this.tT<=0){this.tT=1;for(const t of[0,1])this.teamThink(t);}
  for(const u of S.champs){if(!u.bot&&!autopilot)continue;const b=u.brain;b.t-=dt;b.dodgeT-=dt;if(b.lh&&u.alive&&(b.lhT=(b.lhT||0)-dt)<=0){b.lhT=this.D[u.team].react*.5;this.lhTick(u,this.D[u.team]);}if(b.t>0)continue;const D=this.D[u.team];b.t=D.think*(.8+Math.random()*.4);try{this.think(u,D);}catch(e){console.error(e);}}}
 /* ---------- team level: objective calls, grouping, defence ---------- */
 teamThink(team){const S=this.S,tb=this.team[team],mine=S.champs.filter(c=>c.team===team),alive=mine.filter(c=>c.alive),foes=S.champs.filter(c=>c.team!==team),fa=foes.filter(c=>c.alive);
  const foesDead=foes.length-fa.length,avgHp=alive.reduce((s,c)=>s+c.hp/c.st.hp,0)/Math.max(1,alive.length),late=S.t>Math.min(S.len*.55,840),midG=S.t>S.len*.3,adv=alive.length-fa.length,aeon=S.aeon[team]>S.t+15;if(tb.dr!==S.drakes[team]){if(tb.dr!=null)tb.fresh=S.t+20;tb.dr=S.drakes[team];}const fresh=tb.fresh>S.t;
  if(tb.call&&(S.t>tb.call.until||tb.call.done&&tb.call.done()))tb.call=null;
  // a push that lost its fight falls back
  if(tb.call&&tb.call.k==='push'&&(adv<0&&alive.length<3||avgHp<.3)){tb.call=null;tb.calm=S.t+12;}
  // defend a structure under attack by champions: a lone poke at an outer tower only draws the nearest two
  for(const s of S.units)if(s.struct&&s.team===team&&s.alive&&s.kind!=='fountain'&&S.t-s.lastHit<2){const att=fa.filter(c=>H(c,s)<15&&S.seen(team,c)),base=s.kind!=='tower'||s.lane==='core'||s.tier<2;
   if(att.length&&(att.length>=(s.tier===3?3:2)||base||s.hp<s.st.hp*.5)&&(!tb.call||tb.call.k!=='defend'&&!(tb.call.k==='push'&&!base&&att.length<3)&&!(tb.call.boss&&tb.call.boss.hp<tb.call.boss.st.hp*.6&&!base))){tb.call={k:'defend',x:s.x,z:s.z,until:S.t+20,who:base||att.length>=3||late?5:Math.min(4,att.length+1),done:()=>!s.alive||S.t-s.lastHit>6};return;}}
  // a numbers advantage is the moment to take a boss, even mid-push; otherwise bosses wait for a free moment
  if(tb.call&&!(tb.call.k==='push'&&foesDead>=1&&(S.bosses.warden.u&&foesDead>=2||S.bosses.drake.u)))return;
  const bossCall=(k,need)=>{const b=S.bosses[k];if(!b.u||!b.u.alive)return false;const ready=alive.filter(c=>c.hp>c.st.hp*.6&&Math.hypot(c.x-b.x,c.z-b.z)<(k==='warden'?120:70)).length;if(ready<(k==='warden'?4:3))return false;tb.call={k,x:b.x,z:b.z,until:S.t+(k==='warden'?70:32),who:need,boss:b.u,done:()=>!b.u||!b.u.alive};return true;};
  if(S.bosses.warden.u&&(foesDead>=2||!tb.call&&late&&adv>=1&&avgHp>.7))if(bossCall('warden',5))return;
  if(S.bosses.drake.u&&S.t>200&&avgHp>.55&&(foesDead>=1||!tb.call&&Math.random()<.18))if(bossCall('drake',late?5:3))return;
  if(tb.call)return;
  // group and siege: after winning a fight, with a boss buff, or as the game matures
  if(alive.length>=3&&adv>=0&&!(tb.calm>S.t)&&(late&&avgHp>.45||midG&&(aeon||fresh&&avgHp>.5||adv>=2||adv>=1&&avgHp>.5||avgHp>.7&&alive.length>=4&&Math.random()<.05))){
   const cx=alive.reduce((s,c)=>s+c.x,0)/alive.length,cz=alive.reduce((s,c)=>s+c.z,0)/alive.length;let best=null,bs=1e9,bt=null;
   for(const k of MAP.LANE_IDS){const ts=S.units.filter(x=>x.team!==team&&x.alive&&x.struct&&x.lane===k);const nx=ts.find(x=>S.attackable(x))||S.units.find(x=>x.kind==='core'&&x.team!==team);
    const sc=ts.length*9+Math.hypot(nx.x-cx,nx.z-cz)/8+Math.random()*7-(k===tb.lane?12:0);if(sc<bs){bs=sc;best=k;bt=nx;}}
   const all=late&&S.t>S.len*.7||bt.kind!=='tower'||bt.lane==='core'||aeon||adv>=2;
   tb.lane=best;tb.call={k:'push',lane:best,until:S.t+(late?80:60),who:all?5:late?4:3,split:all?null:best==='top'?'bot':'top'};}}
 /* ---------- one champion ---------- */
 think(u,D){const S=this.S,b=u.brain;
  if(!u.alive){this.shop(u);return;}
  if(u.recall>0){const th=this.threats(u,10);if(th.length)S.cancelRecall(u);else return;}
  if(b.mode==='recall')b.mode='';
  if(S.atFountain(u)){this.shop(u);if(u.hp<u.st.hp*.85&&!this.threats(u,20).length){b.mode='heal';const[fx,fz]=MAP.FOUNTAIN[u.team];if(Math.hypot(u.x-fx,u.z-fz)>8)this.go(u,fx,fz);else S.order(u,null);return;}}
  if(u.dash)return;
  const hpP=u.hp/u.st.hp,th=this.threats(u,13),allies=S.champs.filter(c=>c.team===u.team&&c.alive&&c!==u&&H(c,u)<13);
  // dodge enemy skillshots
  if(D.dodge&&b.dodgeT<=0&&Math.random()<D.dodge){const m=this.incoming(u);if(m){b.dodgeT=.6;const px=-m.dz,pz=m.dx,side=((u.x-m.x)*px+(u.z-m.z)*pz)>=0?1:-1;const tx=u.x+px*side*2.6,tz=u.z+pz*side*2.6;if(MAP.walk(tx,tz)){S.order(u,{k:'move',x:tx,z:tz});return;}}}
  // retreat / recall
  const outnum=th.length>allies.length+1;
  if(hpP<.22||(hpP<.4&&outnum)||(u.mp<u.st.mp*.12&&hpP<.5&&th.length)){b.mode='retreat';this.escape(u,th,D);return;}
  if(b.mode==='retreat'&&hpP<.6&&(th.length||hpP<.35)){this.escape(u,th,D);return;}
  const nxt=this.nextItem(u);
  const sieging=this.team[u.team].call?.k==='push'&&this.assigned(u,this.team[u.team].call),wave=sieging||u.role!=='jungle'&&S.units.some(m=>m.kind==='minion'&&m.alive&&m.team!==u.team&&Math.abs(m.x-u.x)<12&&Math.abs(m.z-u.z)<12);// shop between waves
  if(!th.length&&!this.nearTeamFight(u)&&((nxt&&this.spendable(u)>=Math.min(1100,priceOf(nxt,u.items).c)&&(hpP<.75&&!wave||hpP<.45||u.gold>(wave?1900:1400)))||hpP<.3||(u.mp<u.st.mp*.12&&u.role!=='jungle'))){const far=Math.hypot(u.x-MAP.FOUNTAIN[u.team][0],u.z-MAP.FOUNTAIN[u.team][1]);if(far>25){b.mode='retreat';this.escape(u,th,D);return;}}
  b.mode='';
  // fight?
  const tgt=this.pickTarget(u,th,allies,D);
  if(tgt){if(this.fight(u,tgt,th,allies,D))return;}
  // support abilities on allies
  this.supportCasts(u,D);
  // team calls
  const call=this.team[u.team].call;
  if(call&&this.assigned(u,call)){if(this.doCall(u,call,D,th))return;}
  if(u.role==='jungle'&&S.t<S.len*.9){this.jungle(u,D,th);return;}
  const lane=u.role==='sup'?'bot':u.role==='jungle'?'mid':u.role;this.lane(u,lane,D,th);}
 threats(u,r){const S=this.S;return S.champs.filter(c=>c.team!==u.team&&c.alive&&H(c,u)<r&&S.seen(u.team,c));}
 nearTeamFight(u){const S=this.S;return S.champs.some(c=>c.team===u.team&&c.alive&&c!==u&&H(c,u)<20&&S.t-c.lastFight<2);}
 assigned(u,c){if(c.k==='push')return c.who>=5||(c.who===4?u.role!==c.split:u.role==='jungle'||u.role==='sup'||u.role===c.lane);if(c.who>=5)return true;const S=this.S;if(c.k==='drake'||c.k==='defend'){const near=S.champs.filter(x=>x.team===u.team&&x.alive).sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z)).slice(0,c.who);return near.includes(u)||u.role==='jungle';}return true;}
 incoming(u){const S=this.S;for(const m of S.projs){if(m.homing||m.team===u.team)continue;const rx=u.x-m.x,rz=u.z-m.z,along=rx*m.dx+rz*m.dz;if(along<0||along>m.spd*.7||along>m.rng-m.trav)continue;const perp=Math.abs(rx*m.dz-rz*m.dx);if(perp<m.w+u.r+.2)return m;}return null;}
 go(u,x,z){const o=u.ord;if(o&&o.k==='move'&&Math.hypot(o.x-x,o.z-z)<1)return;this.S.order(u,{k:'move',x,z});}
 atk(u,t){const o=u.ord;if(o&&o.k==='atk'&&o.t===t)return;this.S.order(u,{k:'atk',t});}
 /* ---------- shopping ---------- */
 nextItem(u){const bl=u.def.build;const have=[...u.items];
  for(const id of bl){if(have.includes(id)){have.splice(have.indexOf(id),1);continue;}
   // a component already merged into a finished item counts as bought
   if(!ITEMS[id].from&&u.items.some(x=>(ITEMS[x].from||[]).includes(id)&&bl.indexOf(x)>bl.indexOf(id)))continue;return id;}return null;}
 missing(u,id){const pool=[...u.items],out=[];for(const f of ITEMS[id].from||[]){const k=pool.indexOf(f);if(k>=0)pool[k]=null;else out.push(f);}return out;}
 // gold that a trip to the shop would actually spend now
 spendable(u){const id=this.nextItem(u);if(!id)return 0;const{c}=priceOf(id,u.items);if(u.gold>=c)return c;let s=0,g=u.gold;for(const f of this.missing(u,id)){if(g>=ITEMS[f].c){g-=ITEMS[f].c;s+=ITEMS[f].c;}}return s;}
 shop(u){const S=this.S;if(!S.canShop(u))return;for(let n=0;n<6;n++){const id=this.nextItem(u);if(!id)return;const{c}=priceOf(id,u.items);
  if(u.gold>=c){if(!S.buy(u,id))return;continue;}
  for(const f of this.missing(u,id)){if(u.gold>=ITEMS[f].c&&u.items.length<6)S.buy(u,f);}return;}}
 /* ---------- combat ---------- */
 power(u){return u.hp*(1+u.st.ad/100+u.st.ap/150)*(1+u.lvl/10);}
 pickTarget(u,th,allies,D){const S=this.S;if(!th.length)return null;let best=null,bs=-1e9;for(const e of th){const d=H(u,e);let s=-d*.6-(e.hp/e.st.hp)*12;if(e.cc.stun||e.cc.root)s+=6;if(s>bs){bs=s;best=e;}}return best;}
 underTower(team,x,z,pad=1){const S=this.S;for(const t of S.units)if(t.kind==='tower'&&t.alive&&t.team!==team&&Math.hypot(t.x-x,t.z-z)<t.st.rng+pad)return t;
  const f=MAP.FOUNTAIN[1-team];if(Math.hypot(f[0]-x,f[1]-z)<16)return true;return null;}
 fight(u,e,th,allies,D){const S=this.S,b=u.brain,d=H(u,e),hpP=u.hp/u.st.hp,eP=e.hp/e.st.hp;
  const myPow=this.power(u)+allies.reduce((s,c)=>s+this.power(c)*(H(c,e)<12?1:.3),0),theirPow=th.reduce((s,c)=>s+this.power(c),0);
  const tw=this.underTower(u.team,e.x,e.z,0);const towerOk=!tw||(eP<.25&&hpP>.5&&Math.random()<D.dive)||(tw!==true&&tw.tgt&&tw.tgt.kind==='minion'&&allies.length>=2);
  const burst=this.burst(u,e);
  // in a 1v1 lane the bots farm and trade; they commit only with a clear edge (kill pressure, numbers, a big lead)
  const duel=S.t<S.len*.3&&!allies.some(c=>H(c,e)<12)&&th.length<2,edge=duel?1.75:1.35;
  let allIn=(burst>e.hp*.9&&hpP>.3)||(myPow>theirPow*edge/D.aggr&&hpP>.35)||(eP<.3&&hpP>.45&&hpP>eP+.15)||e.cc.stun&&hpP>.4&&!duel;
  if(S.t-u.lastChampHit<1.5&&H(u,e)<u.st.rng+3&&hpP>eP+(duel?.25:.1))allIn=allIn||myPow>theirPow*(duel?1.3:1.1);
  if(!towerOk)allIn=false;
  // abilities
  this.combo(u,e,allIn,D,th);
  if(u.dash)return true;
  if(allIn){this.summoners(u,e,D,true);this.atk(u,e);return true;}
  // trading in lane: auto the enemy when they are in range and we are not under their tower
  const myTw=this.underTower(u.team,u.x,u.z,1);
  if(!myTw&&d<u.st.rng+u.r+e.r+.4&&Math.random()<D.trade*.5&&hpP>.55&&hpP>eP-.05&&!(b.lhBusy>S.t)){this.atk(u,e);return true;}
  return false;}
 burst(u,e){let s=u.st.ad*3*(100/(100+e.st.ar));for(let i=0;i<4;i++){const r=u.ab[i];if(r&&u.cd[i]<=0)s+=(i===3?250+100*r:40+35*r)+(u.st.ap*.6)+(u.st.ad-u.baseAD)*.6;}return s;}
 aimAt(u,e,spd,D){// lead the target; error by difficulty
  const d=H(u,e),tt=spd?d/spd:.5;let x=e.x+(e.moving?Math.sin(e.yaw)*e.st.ms*tt*.85:0),z=e.z+(e.moving?Math.cos(e.yaw)*e.st.ms*tt*.85:0);
  x+=(Math.random()-.5)*D.aim*2;z+=(Math.random()-.5)*D.aim*2;return[x,z];}
 combo(u,e,allIn,D,th){const S=this.S;if(!allIn&&u.wind>0&&u.wt&&u.wt.kind==='minion')return;// a cast would cancel the last-hit swing
  const d=H(u,e),eP=e.hp/e.st.hp;
  for(let i=0;i<4;i++){if(!S.canCast(u,i)||Math.random()>D.use)continue;const a=S.abil(u,i),tag=a.ai,rng=a.rng||(a.r||3);let use=false,x=e.x,z=e.z,t=e;
   switch(tag){
    case'poke':use=d<(a.type==='self'?(a.r||u.st.rng+1.5):rng*.95)&&(allIn||u.mp>u.st.mp*.35);break;
    case'cc':case'zone':use=d<rng*.92&&(allIn||Math.random()<.5);break;
    case'engage':use=allIn&&d<rng&&d>2.2;if(a.type==='target')t=e;break;
    case'buff':use=d<u.st.rng+u.r+e.r+1.5&&(allIn||Math.random()<.4);break;
    case'cc_close':use=d<(a.r||4)*.85;break;
    case'ult':use=allIn&&d<rng&&(eP<.75||th.filter(o=>H(o,e)<(a.r||3)).length>=2);break;
    case'ult_close':use=allIn&&d<(a.r||4)*.8;break;
    case'buff_ult':use=allIn&&d<6;break;
    case'execute':use=d<rng+e.r&&e.hp<(130+100*u.ab[i]+(u.st.ad-u.baseAD)+(e.st.hp-e.hp)*.22)*.9;break;
    case'snipe':use=d<40&&(eP<.35||e.cc.stun)&&Math.random()<.5;break;
    case'snipe_close':use=d<rng*.85&&(eP<.45||allIn);break;
    case'stealth':use=allIn&&d<9&&d>u.st.rng+1;break;
    case'escape':case'escape_back':use=false;break;}
   if(!use)continue;
   if(a.type==='skill'||a.type==='ground'){[x,z]=this.aimAt(u,e,a.type==='skill'?(i===3&&u.def.id==='nyra'?32:24):0,D);}
   if(a.type==='dash'&&tag==='engage'){x=e.x;z=e.z;}
   if(S.cast(u,i,x,z,t))return;}}
 supportCasts(u,D){const S=this.S;if(u.wind>0&&u.wt&&u.wt.kind==='minion')return;for(let i=0;i<4;i++){const a=S.abil(u,i);if(!['heal','shield','heal_ult'].includes(a.ai)||!S.canCast(u,i))continue;
  const al=S.champs.filter(c=>c.team===u.team&&c.alive&&H(c,u)<(a.rng||a.r||6)).sort((p,q)=>p.hp/p.st.hp-q.hp/q.st.hp);const low=al[0];if(!low)continue;
  if(a.ai==='heal'&&low.hp<low.st.hp*.6){S.cast(u,i,low.x,low.z,low);return;}
  if(a.ai==='shield'&&S.t-low.lastHit<1&&low.hp<low.st.hp*.85){S.cast(u,i,low.x,low.z,low);return;}
  if(a.ai==='heal_ult'&&(al.filter(c=>c.hp<c.st.hp*.5).length>=2||low.hp<low.st.hp*.28)&&this.threats(u,12).length){S.cast(u,i,u.x,u.z,u);return;}}}
 summoners(u,e,D,allIn){const S=this.S;u.spells.forEach((s,k)=>{if(s.cd>0)return;const hpP=u.hp/u.st.hp;
  if(s.id==='scorch'&&e&&H(u,e)<6.5&&e.hp<e.st.hp*.35)S.spell(u,k,e.x,e.z,e);
  else if(s.id==='mend'&&hpP<.25)S.spell(u,k,u.x,u.z);
  else if(s.id==='barrier'&&hpP<.22&&S.t-u.lastChampHit<1)S.spell(u,k,u.x,u.z);
  else if(s.id==='haste'&&allIn&&e&&H(u,e)>u.st.rng+2&&e.hp<e.st.hp*.4)S.spell(u,k,u.x,u.z);});}
 escape(u,th,D){const S=this.S;const[fx,fz]=MAP.FOUNTAIN[u.team];
  if(th.length){const e=th[0],hpP=u.hp/u.st.hp;
   // escape tools: dashes toward home, slows/cc on the chaser
   for(let i=0;i<4;i++){if(!S.canCast(u,i))continue;const a=S.abil(u,i);
    if(a.ai==='escape'&&H(u,e)<7){const dx=fx-u.x,dz=fz-u.z,l=Math.hypot(dx,dz);if(S.cast(u,i,u.x+dx/l*6,u.z+dz/l*6))return;}
    if(a.ai==='escape_back'&&H(u,e)<5){if(S.cast(u,i,e.x,e.z))return;}
    if((a.ai==='cc'||a.ai==='poke')&&H(u,e)<(a.rng||4)*.8&&Math.random()<D.use){const[x,z]=this.aimAt(u,e,24,D);if(S.cast(u,i,x,z,e))return;}
    if(a.ai==='stealth'&&H(u,e)<6){if(S.cast(u,i,u.x,u.z))return;}}
   u.spells.forEach((s,k)=>{if(s.cd>0)return;if(s.id==='blink'&&hpP<.18&&H(u,e)<4){const dx=fx-u.x,dz=fz-u.z,l=Math.hypot(dx,dz);S.spell(u,k,u.x+dx/l*6,u.z+dz/l*6);}
    else if((s.id==='mend'&&hpP<.3)||(s.id==='barrier'&&hpP<.22)||(s.id==='haste'))S.spell(u,k,u.x,u.z);});
   this.go(u,fx,fz);return;}
  const far=Math.hypot(u.x-fx,u.z-fz);if(far>25&&this.safe(u)){S.recallStart(u);return;}this.go(u,fx,fz);}
 safe(u){const S=this.S;if(this.threats(u,17).length)return false;if(S.t-u.lastHit<2.5)return false;for(const m of S.units)if(m.alive&&m.team!==u.team&&(m.kind==='minion'||m.kind==='monster'&&m.aggro)&&Math.abs(m.x-u.x)<10&&Math.abs(m.z-u.z)<10)return false;return !this.underTower(u.team,u.x,u.z,2);}
 /* ---------- objectives ---------- */
 doCall(u,c,D,th){const S=this.S;const d=Math.hypot(u.x-c.x,u.z-c.z);
  if(c.k==='push'){this.lane(u,c.lane,D,th,true);return true;}
  if(c.k==='defend'){if(d>9){this.go(u,c.x,c.z);return true;}let m=null,md=11;for(const x of S.units)if(x.kind==='minion'&&x.alive&&x.team!==u.team&&Math.hypot(x.x-c.x,x.z-c.z)<md){md=Math.hypot(x.x-c.x,x.z-c.z);m=x;}if(m){this.atk(u,m);if(Math.random()<.3)this.farmCasts(u,m,D);}return true;}
  if(c.boss){const boss=c.boss;if(!boss.alive)return false;const near=S.champs.filter(x=>x.team===u.team&&x.alive&&Math.hypot(x.x-c.x,x.z-c.z)<16).length;
   if(d>12){this.go(u,c.x,c.z);return true;}
   if(near<(c.k==='warden'?3:2)&&!(u.role==='jungle'&&u.lvl>=9)){this.go(u,c.x+(u.team?6:-6),c.z+(u.team?-6:6));return true;}
   const si=u.spells.findIndex(s=>s.id==='strike');if(si>=0&&boss.hp<450+30*u.lvl&&H(u,boss)<6+boss.r){S.spell(u,si,boss.x,boss.z,boss);}
   this.farmCasts(u,boss,D);this.atk(u,boss);return true;}
  return false;}
 farmCasts(u,t,D){const S=this.S;if(u.mp<u.st.mp*.3||u.wind>0&&u.wt&&u.wt.kind==='minion'&&u.wt!==t)return;for(let i=0;i<3;i++){if(!S.canCast(u,i))continue;const a=S.abil(u,i);if(a.type==='ally'||a.ai==='escape'||a.ai==='escape_back'||a.ai==='stealth'||a.ai==='heal'||a.ai==='shield')continue;
  const d=H(u,t);if(d<(a.type==='self'?(a.r||u.st.rng+2):(a.rng||4)*.9)&&Math.random()<D.use*.5){if(S.cast(u,i,t.x,t.z,t))return;}}}
 /* ---------- jungle ---------- */
 jungle(u,D,th){const S=this.S,b=u.brain;
  // ganks
  if(u.lvl>=3&&S.t>b.gankT){const lanes=MAP.LANE_IDS.map(k=>{const es=S.champs.filter(c=>c.team!==u.team&&c.alive&&S.seen(u.team,c)&&MAP.LANES[k]&&polyProj(c.x,c.z,MAP.LANES[k]).d<9);return{k,e:es[0]};}).filter(l=>l.e&&l.e.hp<l.e.st.hp*.75&&!this.underTower(u.team,l.e.x,l.e.z,2));
   if(lanes.length){const l=lanes.sort((a,b2)=>H(u,a.e)-H(u,b2.e))[0];b.gank={e:l.e,until:S.t+22};}b.gankT=S.t+(45+Math.random()*30)/Math.sqrt(S.T);}
  if(b.gank){const e=b.gank.e;if(S.t>b.gank.until||!e.alive||!S.seen(u.team,e)||this.underTower(u.team,e.x,e.z,1)){b.gank=null;}else{if(H(u,e)<9){this.combo(u,e,true,D,[e]);this.atk(u,e);}else this.go(u,e.x,e.z);return;}}
  // camps: nearest alive camp on our side (both sides later)
  const camps=S.camps.filter(c=>c.units.some(m=>m.alive)&&(c.side===u.team||u.lvl>=8&&!S.champs.some(e=>e.team!==u.team&&e.alive&&S.seen(u.team,e)&&Math.hypot(e.x-c.x,e.z-c.z)<18)));
  if(!camps.length){this.lane(u,['top','mid','bot'][(S.t/40|0)%3],D,th);return;}
  const cp=b.camp&&camps.includes(b.camp)?b.camp:camps.sort((a,c)=>Math.hypot(a.x-u.x,a.z-u.z)-Math.hypot(c.x-u.x,c.z-u.z))[0];b.camp=cp;
  if(Math.hypot(cp.x-u.x,cp.z-u.z)>7){this.go(u,cp.x,cp.z);return;}
  const mons=cp.units.filter(m=>m.alive).sort((a,c)=>c.st.hp-a.st.hp);const m=mons[0];
  const si=u.spells.findIndex(s=>s.id==='strike');if(si>=0&&u.spells[si].ch>0&&m&&m.hp<450+30*u.lvl&&(MON[m.mtype].buff||MON[m.mtype].hp>800||u.spells[si].ch>1))S.spell(u,si,m.x,m.z,m);
  if(m){this.farmCasts(u,m,D);this.atk(u,m);}}
 /* ---------- lane ---------- */
 lane(u,k,D,th,push){const S=this.S,pts=MAP.laneFor(u.team,k),L=MAP.LEN[k];if(u.wind>0&&u.wt&&u.wt.alive&&u.wt.kind!=='champ')return true;// let the swing land
  const my=polyProj(u.x,u.z,pts);
  // wave fronts
  let front=-1,efront=1e9;const enemies=[];
  for(const m of S.units){if(m.kind!=='minion'||!m.alive||m.lane!==k)continue;const p=polyProj(m.x,m.z,pts);if(p.d>12)continue;if(m.team===u.team){if(p.s>front)front=p.s;}else if(S.seen(u.team,m)){enemies.push(m);if(p.s<efront)efront=p.s;}}
  // the next enemy structure in this lane and our safest tower
  let eTower=null,es=1e9,myTower=null,ms=-1;for(const t of S.units){if(!t.struct||!t.alive||t.kind==='fountain')continue;if(t.lane!==k&&t.kind!=='core'&&t.lane!=='core')continue;const p=polyProj(t.x,t.z,pts);
   if(t.team!==u.team){if(S.attackable(t)&&p.s<es){es=p.s;eTower=t;}}else if(t.kind==='tower'&&p.s>ms){ms=p.s;myTower=t;}}
  if(!eTower){const c=S.units.find(x=>x.kind==='core'&&x.team!==u.team);eTower=c;es=L;}
  const ranged=u.ranged,b=u.brain,rg=u.st.rng+u.r,myS=myTower?polyProj(myTower.x,myTower.z,pts).s:20;let want;
  // stand at attack range behind our own minions, just out of reach of theirs
  if(efront>1e8)want=front<0?Math.max(8,myS-(push?-6:3)):front-(ranged?3:1.2);
  else{want=efront-(ranged?rg+.4:2.4);want=Math.min(want,front>=0?front+(ranged?-.5:.6):myS+2);}
  if(!push&&enemies.filter(m=>m.tgt===u).length>=2)want-=3;
  if(!push)want-=(1-D.lh)*4;// easier bots hang back from the wave
  if(push&&eTower)want=Math.max(want,es-(eTower.kind==='tower'?eTower.st.rng+3:6));// a siege walks straight to the edge of the next structure's range
  if(th.length&&u.hp<u.st.hp*.5)want-=6;
  // tower safety: stay outside the enemy tower unless our minions are tanking it
  const towerTanked=eTower&&eTower.kind==='tower'&&S.units.some(m=>m.kind==='minion'&&m.alive&&m.team===u.team&&Math.hypot(m.x-eTower.x,m.z-eTower.z)<eTower.st.rng)&&!(eTower.tgt===u);
  const allyN=S.champs.filter(c=>c.team===u.team&&c.alive&&H(c,u)<14).length;
  const siege=push&&allyN>=3&&allyN>th.length,dive=siege&&(towerTanked||eTower.kind!=='tower'||eTower.hp<eTower.st.hp*.45||allyN>=4||allyN>=th.length+3||u.has('aeon'));
  if(dive&&front<es-eTower.st.rng)want=es-1;
  if(eTower&&eTower.kind==='tower'&&!towerTanked&&!dive)want=Math.min(want,es-eTower.st.rng-2.2);
  if(eTower&&eTower.tgt===u){want=Math.min(want,es-eTower.st.rng-4);}
  let tgtP=polyAt(pts,cl(want,2,L-2));
  // the lanes end at the inhibitors: inside the base, stand off the next structure on the lane side (away from the fountain)
  if(eTower&&(eTower.lane==='core'||eTower.kind==='core')&&want>L-8){const e=pts[pts.length-1],dx=e[0]-eTower.x,dz=e[1]-eTower.z,l=Math.hypot(dx,dz)||1,sd=eTower.kind==='tower'&&!dive&&!towerTanked?eTower.st.rng+2.5:Math.max(1.5,u.st.rng+u.r+eTower.r-.6);tgtP={x:eTower.x+dx/l*sd,z:eTower.z+dz/l*sd};}
  // support follows the bot laner
  if(u.role==='sup'&&!push){const adc=S.champs.find(c=>c.team===u.team&&c.alive&&c.role==='bot'&&c!==u);if(adc&&!S.atFountain(adc)){b.lh=null;const p=polyProj(adc.x,adc.z,pts);const q=polyAt(pts,cl(Math.min(p.s-1.5,want),2,L-2));if(H(u,q)>2.5)this.go(u,q.x+1,q.z+1);else this.harass(u,D,th);return;}}
  // last hits: predict each minion's health when our attack would land; hold the attack for the ones about to drop
  const near=enemies.filter(m=>H(u,m)<rg+9),safe=m=>!this.underTower(u.team,m.x,m.z,.5)||towerTanked;
  const share=(u.role==='sup'||push&&u.role==='jungle')&&S.champs.some(c=>c.team===u.team&&c.alive&&c!==u&&c.role!=='sup'&&c.role!=='jungle'&&H(c,u)<15);
  const{kill,soon,wait}=share?{}:this.lhEval(u,D,near);const focus=Math.random()<D.lh;b.lh=focus&&near.length&&!share?{until:S.t+D.think*1.6,safe}:null;// easier bots lose focus and swing at whatever is closest
  if(kill&&safe(kill)&&(focus||Math.random()<.4)){this.atk(u,kill);return;}
  if(kill||soon)b.lhBusy=S.t+.8;if(soon&&safe(soon)&&focus){u.idleT=.3;const o=u.ord;if(o&&o.k==='atk'&&o.t!==soon&&o.t.kind==='minion')S.order(u,null);const d=H(u,soon),rr=rg+soon.r;if(d>rr-.2)this.go(u,soon.x+(u.x-soon.x)/d*(rr-.7),soon.z+(u.z-soon.z)/d*(rr-.7));return;}
  // push the wave after winning the trade (or with the lane empty); otherwise only last-hit
  const eL=th.filter(e=>H(e,u)<16),hpP=u.hp/u.st.hp;
  const hard=push||S.t>S.len*.5&&!eL.length,pushing=hard||(!eL.length||eL.every(e=>e.hp/e.st.hp<hpP-.3))&&!wait;
  let big=null,bigs=1e9;for(const m of near){const dm=this.hitDmg(u,m);if(m.hp>dm*1.1&&m.hp<bigs&&H(u,m)<rg+m.r+1.5){bigs=m.hp;big=m;}}// soften the weakest so the next swing is a last hit
  if(eTower&&eTower.alive&&S.attackable(eTower)&&eTower.tgt!==u&&(towerTanked||eTower.kind!=='tower'||dive)&&H(u,eTower)<u.st.rng+eTower.r+6&&(!th.length||siege||!enemies.some(m=>H(u,m)<4))){this.atk(u,eTower);return;}
  if(near.length&&!share&&focus)u.idleT=.3;if(big&&pushing&&!share&&safe(big)){// push with spells; swing at healthy minions only when nothing else is hitting them or the team is sieging
   if(near.length>=3&&u.mp>u.st.mp*.4&&Math.random()<.5)this.farmCasts(u,big,{use:.7});
   if(hard||front<0||!S.units.some(o=>o.kind==='minion'&&o.alive&&o.team===u.team&&o.tgt===big)){this.atk(u,big);return;}}
  if(H(u,tgtP)>2.2){this.go(u,tgtP.x+(Math.random()-.5),tgtP.z+(Math.random()-.5));return;}
  this.harass(u,D,th);}
 /* ---------- last hits: predicted health of a minion when our attack lands ---------- */
 hitDmg(u,m){let r=m.st.ar;if(r>0)r=r*(1-u.st.pen)-u.st.lethal;let d=u.st.ad*(r>=0?100/(100+r):2-100/(100-r));if(u.st.onhitM)d+=u.st.onhitM*(m.st.mr>=0?100/(100+m.st.mr):2-100/(100-m.st.mr));return m.emp?d*.7:d;}
 srcDmg(o,m){if(o.kind==='tower')return m.st.hp*({melee:.45,caster:.7,siege:.14,super:.08}[m.mtype]||.3);if(o.kind==='champ')return this.hitDmg(o,m);const r=m.st.ar;return o.st.ad*(r>=0?100/(100+r):2-100/(100-r))*2*(m.emp?.7:1);}
 inc(m,tau,att){const S=this.S;let s=0;// damage the others will deal to m within tau seconds
  for(const p of S.projs)if(p.homing===m&&p.atk&&p.src.team!==m.team&&Math.hypot(m.x-p.x,m.z-p.z)/p.spd<=tau)s+=this.srcDmg(p.src,m);
  for(const o of att){const t=o.wind>0?o.wt:o.kind==='champ'?o.ord&&o.ord.t:o.tgt;if(t!==m||o.wind<=0&&!S.inRange(o,m))continue;
   const tr=o.ranged||o.kind==='tower'?Math.hypot(m.x-o.x,m.z-o.z)/(o.kind==='tower'?26:24):0,wu=o.kind==='champ'?S.windOf(o):.22,per=1/o.st.as,dm=this.srcDmg(o,m);
   if((o.wind>0?o.wind:Math.max(0,o.atkT)+wu)+tr<=tau)s+=dm;for(let t2=(o.wind>0?Math.max(o.atkT,o.wind):Math.max(0,o.atkT)+per)+wu+tr;t2<=tau;t2+=per)s+=dm;}
  return s;}
 lhEval(u,D,ms){const S=this.S;if(!ms.length)return{};const att=S.units.filter(o=>o.alive&&o!==u&&o.team===u.team&&(o.kind==='minion'||o.kind==='tower'||o.kind==='champ')&&Math.abs(o.x-u.x)<24&&Math.abs(o.z-u.z)<24);
  const err=(1-D.lh)*1.4,per=1/u.st.as;let kill=null,kh=1e9,soon=null,sd=1e9,wait=false;
  for(const m of ms){if(!m.alive)continue;const d=H(u,m),rr=u.st.rng+u.r+m.r,walk=Math.max(0,d-rr)/u.st.ms;if(walk>2)continue;
   const land=walk+Math.max(0,u.atkT-walk)+S.windOf(u)+(u.ranged?Math.min(d,rr)/24:0),my=this.hitDmg(u,m)*(1+Math.sin(m.id*12.9898+u.id*78.233)*43758.5453%1*err);
   const h=m.hp-this.inc(m,land,att);if(h<=0)continue;if(!wait&&m.hp-this.inc(m,land+per*1.7,att)<=my*1.2)wait=true;
   if(h<=my&&walk<.35){if(h<kh){kh=h;kill=m;}}else if(h<=my*2.2&&m.hp-this.inc(m,land+per+.15,att)<=my&&d<sd){sd=d;soon=m;}}
  return{kill,soon,wait};}
 lhTick(u,D){const S=this.S,b=u.brain;if(S.t>b.lh.until||u.dash||u.recall>0||u.castLock>0){b.lh=null;return;}const r=u.st.rng+u.r+9,ms=S.units.filter(m=>m.kind==='minion'&&m.alive&&m.team!==u.team&&Math.abs(m.x-u.x)<r&&Math.abs(m.z-u.z)<r&&S.seen(u.team,m)),{kill,soon}=this.lhEval(u,D,ms);
  u.idleT=.3;if(kill&&b.lh.safe(kill)){this.atk(u,kill);return;}if(soon||kill)b.lhBusy=S.t+.8;}
 harass(u,D,th){const S=this.S;const e=th[0];if(!e||u.brain.lhBusy>S.t)return;if(this.underTower(u.team,e.x,e.z,.5))return;const d=H(u,e);
  if(d<u.st.rng+u.r+e.r+.3&&Math.random()<D.trade*.5)this.atk(u,e);}}
