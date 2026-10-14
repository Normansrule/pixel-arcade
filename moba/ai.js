// AEONFALL — CPU champions: laning (last hits, trades, tower safety), jungling (camp routes, smite, ganks),
// objectives (drake, warden), late-game grouping and pushing, defence, recalls and shopping. Bots see only what their team sees.
import * as MAP from './map.js';
import {ITEMS,priceOf,MON} from './data.js';
import {polyProj,polyAt,cl} from './util.js';

export const DIFF=[
 {name:'EASY',think:.55,aim:2.2,lh:.55,use:.45,dodge:0,aggr:.7,dive:0,react:.5,trade:.4},
 {name:'NORMAL',think:.32,aim:1.1,lh:.8,use:.8,dodge:.35,aggr:1,dive:.3,react:.25,trade:.75},
 {name:'HARD',think:.18,aim:.35,lh:.95,use:1,dodge:.75,aggr:1.2,dive:.6,react:.1,trade:1}];
const H=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

export class Brains{
 constructor(S,diff,allyDiff){this.S=S;this.D=[DIFF[allyDiff??diff],DIFF[diff]];this.team=[{call:null,callT:0},{call:null,callT:0}];this.tT=0;
  for(const u of S.champs)u.brain={t:Math.random()*.3,bi:0,gankT:90/S.T+Math.random()*20,mode:'',lastGo:null,campT:0,dodgeT:0,goal:null};}
 update(dt,autopilot){const S=this.S;this.tT-=dt;if(this.tT<=0){this.tT=1;for(const t of[0,1])this.teamThink(t);}
  for(const u of S.champs){if(!u.bot&&!autopilot)continue;const b=u.brain;b.t-=dt;b.dodgeT-=dt;if(b.t>0)continue;const D=this.D[u.team];b.t=D.think*(.8+Math.random()*.4);try{this.think(u,D);}catch(e){console.error(e);}}}
 /* ---------- team level: objective calls, grouping, defence ---------- */
 teamThink(team){const S=this.S,tb=this.team[team],mine=S.champs.filter(c=>c.team===team),alive=mine.filter(c=>c.alive),foes=S.champs.filter(c=>c.team!==team);
  const foesDead=foes.filter(c=>!c.alive).length,avgHp=alive.reduce((s,c)=>s+c.hp/c.st.hp,0)/Math.max(1,alive.length),late=S.t>Math.min(S.len*.6,840);
  if(tb.call&&(S.t>tb.call.until||tb.call.done&&tb.call.done()))tb.call=null;
  // defend a structure under attack by champions
  for(const s of S.units)if(s.struct&&s.team===team&&s.alive&&s.kind!=='fountain'&&S.t-s.lastHit<2){const att=foes.filter(c=>c.alive&&H(c,s)<14&&S.seen(team,c));if(att.length&&(!tb.call||tb.call.k!=='defend')){tb.call={k:'defend',x:s.x,z:s.z,until:S.t+15,who:s.kind==='core'||s.kind==='inhib'||late?5:3,done:()=>!s.alive||S.t-s.lastHit>5};return;}}
  if(tb.call)return;
  const bossCall=(k,need)=>{const b=S.bosses[k];if(!b.u||!b.u.alive)return false;const ready=alive.filter(c=>c.hp>c.st.hp*.6&&Math.hypot(c.x-b.x,c.z-b.z)<70).length;if(ready<(k==='warden'?4:3))return false;tb.call={k,x:b.x,z:b.z,until:S.t+24,who:need,boss:b.u,done:()=>!b.u||!b.u.alive};return true;};
  if(S.bosses.warden.u&&(foesDead>=2||late&&avgHp>.7&&alive.length>=4&&Math.random()<.25))if(bossCall('warden',5))return;
  if(S.bosses.drake.u&&S.t>200&&avgHp>.55&&(foesDead>=1||Math.random()<.18))if(bossCall('drake',late?5:4))return;
  if(late&&alive.length>=3){// group and push the lane with the weakest enemy defences
   let best=null,bs=1e9;for(const k of MAP.LANE_IDS){const ts=S.units.filter(x=>x.team!==team&&x.alive&&x.struct&&(x.lane===k)).length;const sc=ts*10+Math.random()*8;if(sc<bs){bs=sc;best=k;}}
   tb.call={k:'push',lane:best,until:S.t+45,who:4,split:best==='top'?'bot':'top'};}}
 /* ---------- one champion ---------- */
 think(u,D){const S=this.S,b=u.brain;
  if(!u.alive){this.shop(u);return;}
  if(u.recall>0){const th=this.threats(u,10);if(th.length)S.cancelRecall(u);else return;}
  if(b.mode==='recall')b.mode='';
  if(S.atFountain(u)){this.shop(u);if(u.hp<u.st.hp*.85&&!this.threats(u,20).length){b.mode='heal';S.order(u,null);return;}}
  if(u.dash)return;
  const hpP=u.hp/u.st.hp,th=this.threats(u,13),allies=S.champs.filter(c=>c.team===u.team&&c.alive&&c!==u&&H(c,u)<13);
  // dodge enemy skillshots
  if(D.dodge&&b.dodgeT<=0&&Math.random()<D.dodge){const m=this.incoming(u);if(m){b.dodgeT=.6;const px=-m.dz,pz=m.dx,side=((u.x-m.x)*px+(u.z-m.z)*pz)>=0?1:-1;const tx=u.x+px*side*2.6,tz=u.z+pz*side*2.6;if(MAP.walk(tx,tz)){S.order(u,{k:'move',x:tx,z:tz});return;}}}
  // retreat / recall
  const outnum=th.length>allies.length+1;
  if(hpP<.22||(hpP<.4&&outnum)||(u.mp<u.st.mp*.12&&hpP<.5&&th.length)){b.mode='retreat';this.escape(u,th,D);return;}
  if(b.mode==='retreat'&&hpP<.6&&(th.length||hpP<.35)){this.escape(u,th,D);return;}
  const nxt=this.nextItem(u);
  if(!th.length&&!this.nearTeamFight(u)&&((nxt&&this.spendable(u)>=Math.min(1100,priceOf(nxt,u.items).c)&&(hpP<.75||u.gold>1400))||hpP<.3||(u.mp<u.st.mp*.12&&u.role!=='jungle'))){const far=Math.hypot(u.x-MAP.FOUNTAIN[u.team][0],u.z-MAP.FOUNTAIN[u.team][1]);if(far>25){b.mode='retreat';this.escape(u,th,D);return;}}
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
 assigned(u,c){if(c.k==='push')return u.role!==c.split&&!(u.role==='sup'&&c.split==='bot');if(c.who>=5)return true;const S=this.S;if(c.k==='drake'||c.k==='defend'){const near=S.champs.filter(x=>x.team===u.team&&x.alive).sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z)).slice(0,c.who);return near.includes(u)||u.role==='jungle';}return true;}
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
  let allIn=(burst>e.hp*.9&&hpP>.3)||(myPow>theirPow*1.35/D.aggr&&hpP>.35)||(eP<.3&&hpP>.45)||e.cc.stun&&hpP>.4;
  if(S.t-u.lastChampHit<1.5&&H(u,e)<u.st.rng+3&&hpP>eP+.1)allIn=allIn||myPow>theirPow*1.1;
  if(!towerOk)allIn=false;
  // abilities
  this.combo(u,e,allIn,D,th);
  if(u.dash)return true;
  if(allIn){this.summoners(u,e,D,true);this.atk(u,e);return true;}
  // trading in lane: auto the enemy when they are in range and we are not under their tower
  const myTw=this.underTower(u.team,u.x,u.z,1);
  if(!myTw&&d<u.st.rng+u.r+e.r+.4&&Math.random()<D.trade*.5&&hpP>.55&&hpP>eP-.05){this.atk(u,e);return true;}
  return false;}
 burst(u,e){let s=u.st.ad*3*(100/(100+e.st.ar));for(let i=0;i<4;i++){const r=u.ab[i];if(r&&u.cd[i]<=0)s+=(i===3?250+100*r:40+35*r)+(u.st.ap*.6)+(u.st.ad-u.baseAD)*.6;}return s;}
 aimAt(u,e,spd,D){// lead the target; error by difficulty
  const d=H(u,e),tt=spd?d/spd:.5;let x=e.x+(e.moving?Math.sin(e.yaw)*e.st.ms*tt*.85:0),z=e.z+(e.moving?Math.cos(e.yaw)*e.st.ms*tt*.85:0);
  x+=(Math.random()-.5)*D.aim*2;z+=(Math.random()-.5)*D.aim*2;return[x,z];}
 combo(u,e,allIn,D,th){const S=this.S;const d=H(u,e),eP=e.hp/e.st.hp;
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
 supportCasts(u,D){const S=this.S;for(let i=0;i<4;i++){const a=S.abil(u,i);if(!['heal','shield','heal_ult'].includes(a.ai)||!S.canCast(u,i))continue;
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
  if(c.k==='push'){return this.lane(u,c.lane,D,th,true);}
  if(c.k==='defend'){if(d>9){this.go(u,c.x,c.z);return true;}return false;}
  if(c.boss){const boss=c.boss;if(!boss.alive)return false;const near=S.champs.filter(x=>x.team===u.team&&x.alive&&Math.hypot(x.x-c.x,x.z-c.z)<16).length;
   if(d>12){this.go(u,c.x,c.z);return true;}
   if(near<(c.k==='warden'?3:2)&&!(u.role==='jungle'&&u.lvl>=9)){this.go(u,c.x+(u.team?6:-6),c.z+(u.team?-6:6));return true;}
   const si=u.spells.findIndex(s=>s.id==='strike');if(si>=0&&boss.hp<450+30*u.lvl&&H(u,boss)<6+boss.r){S.spell(u,si,boss.x,boss.z,boss);}
   this.farmCasts(u,boss,D);this.atk(u,boss);return true;}
  return false;}
 farmCasts(u,t,D){const S=this.S;if(u.mp<u.st.mp*.3)return;for(let i=0;i<3;i++){if(!S.canCast(u,i))continue;const a=S.abil(u,i);if(a.type==='ally'||a.ai==='escape'||a.ai==='escape_back'||a.ai==='stealth'||a.ai==='heal'||a.ai==='shield')continue;
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
 lane(u,k,D,th,push){const S=this.S,pts=MAP.laneFor(u.team,k),L=MAP.LEN[k];
  const my=polyProj(u.x,u.z,pts);
  // wave fronts
  let front=-1,efront=1e9;const enemies=[];
  for(const m of S.units){if(m.kind!=='minion'||!m.alive||m.lane!==k)continue;const p=polyProj(m.x,m.z,pts);if(p.d>12)continue;if(m.team===u.team){if(p.s>front)front=p.s;}else if(S.seen(u.team,m)){enemies.push(m);if(p.s<efront)efront=p.s;}}
  // the next enemy structure in this lane and our safest tower
  let eTower=null,es=1e9,myTower=null,ms=-1;for(const t of S.units){if(!t.struct||!t.alive||t.kind==='fountain')continue;if(t.lane!==k&&t.kind!=='core'&&t.lane!=='core')continue;const p=polyProj(t.x,t.z,pts);
   if(t.team!==u.team){if(S.attackable(t)&&p.s<es){es=p.s;eTower=t;}}else if(t.kind==='tower'&&p.s>ms){ms=p.s;myTower=t;}}
  if(!eTower){const c=S.units.find(x=>x.kind==='core'&&x.team!==u.team);eTower=c;es=L;}
  const ranged=u.ranged;let want;
  if(front<0){want=Math.max(8,(myTower?polyProj(myTower.x,myTower.z,pts).s:20)-(push?-6:3));}
  else want=front-(ranged?3.5:1.5);
  if(th.length&&u.hp<u.st.hp*.5)want-=6;
  // tower safety: stay outside the enemy tower unless our minions are tanking it
  const towerTanked=eTower&&eTower.kind==='tower'&&S.units.some(m=>m.kind==='minion'&&m.alive&&m.team===u.team&&Math.hypot(m.x-eTower.x,m.z-eTower.z)<eTower.st.rng)&&!(eTower.tgt===u);
  const allyN=S.champs.filter(c=>c.team===u.team&&c.alive&&H(c,u)<14).length;
  const siege=push&&allyN>=3&&allyN>th.length;
  if(siege&&front<es-eTower.st.rng)want=es-1;
  if(eTower&&eTower.kind==='tower'&&!towerTanked&&!siege)want=Math.min(want,es-eTower.st.rng-2.2);
  if(eTower&&eTower.tgt===u){want=Math.min(want,es-eTower.st.rng-4);}
  const tgtP=polyAt(pts,cl(want,2,L-2));
  // support follows the bot laner
  if(u.role==='sup'&&!push){const adc=S.champs.find(c=>c.team===u.team&&c.alive&&c.role==='bot'&&c!==u);if(adc&&!S.atFountain(adc)){const p=polyProj(adc.x,adc.z,pts);const q=polyAt(pts,cl(Math.min(p.s-1.5,want),2,L-2));if(H(u,q)>2.5)this.go(u,q.x+1,q.z+1);else this.harass(u,D,th);return;}}
  // last hits: wait for minions to drop into one-hit range, whittle healthy ones down when it is safe
  const reach=u.st.rng+u.r+2.5;let lh=null,lhs=1e9,big=null,bigs=1e9;
  for(const m of enemies){const d=H(u,m);if(d>reach+3)continue;const dm=u.st.ad*(100/(100+Math.max(0,m.st.ar)));const hitters=S.units.filter(o=>o.kind==='minion'&&o.team===u.team&&o.tgt===m&&o.alive).length;
   const pred=m.hp-hitters*9*(u.ranged?1:.5);if(pred<=dm*(.7+.3*D.lh)&&m.hp<lhs){lhs=m.hp;lh=m;}else if(m.hp>dm*2.4&&d<bigs){bigs=d;big=m;}}
  const safe=m=>!this.underTower(u.team,m.x,m.z,.5)||towerTanked;
  if(lh&&safe(lh)){this.atk(u,lh);return;}
  const pushing=push||!th.length||S.t>S.len*.35||Math.random()<.55;
  const eNear=th.length,aNear=allyN;
  if(eTower&&eTower.alive&&S.attackable(eTower)&&eTower.tgt!==u&&(towerTanked||eTower.kind!=='tower'||siege)&&H(u,eTower)<u.st.rng+eTower.r+6&&(!th.length||siege||!enemies.some(m=>H(u,m)<4))){this.atk(u,eTower);return;}
  if(big&&pushing&&(u.role!=='sup'||!S.champs.some(c=>c.team===u.team&&c.role==='bot'&&c.alive&&H(c,u)<15))&&safe(big)){this.atk(u,big);if(Math.random()<.2)this.farmCasts(u,big,{use:.5});return;}
  if(H(u,tgtP)>2.2){this.go(u,tgtP.x+(Math.random()-.5),tgtP.z+(Math.random()-.5));return;}
  this.harass(u,D,th);}
 harass(u,D,th){const S=this.S;const e=th[0];if(!e)return;if(this.underTower(u.team,e.x,e.z,.5))return;const d=H(u,e);
  if(d<u.st.rng+u.r+e.r+.3&&Math.random()<D.trade*.5)this.atk(u,e);}}
