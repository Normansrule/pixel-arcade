// AEONFALL — the match simulation: units, combat, abilities, minion waves, structures, jungle, bosses, economy, vision.
// Pure logic (no Three.js). The view reads S.units / S.projs / S.zones and drains S.ev for effects and sounds.
//
// Ability API used by champs.js:
//  missile(u,{dx,dz,spd,rng,w,look,pierce,champs,onHit(t,m),onEnd})   zone(u,{x,z,r,delay,dur,period,follow,look,col,onHit,pre,tick(foes,allies),end})
//  dash(u,x,z,spd,{over,stop,tgt,w,hit,onEnd,trail,arc})   blink(u,x,z,col)   cone(u,dx,dz,r,half,look,col)->foes
//  foes(u,x,z,r,o)   friends(u,x,z,r)   dmg(src,t,amt,'p'|'m'|'t',{ab,aoe})   heal(src,t,amt)   shield(src,t,amt,dur,id)
//  buff(t,{id,dur,...})   cc(t,'stun'|'root'|'air'|'silence',dur,src)   slow(t,p,dur)   push(t,x,z,spd)   nextAtk(u,{n,bonus,onHit,dur})   fx(kind,o)
import {MON,CAMP_MON,MINION,TOWER,XPNEED,ITEMS,SPELLS,priceOf,BOOTS} from './data.js';
import {CH} from './champs.js';
import * as MAP from './map.js';
import {cl,polyProj} from './util.js';

export const V=100; // vision grid: 2-unit cells
const vblock=new Uint8Array(V*V);for(let j=0;j<V;j++)for(let i=0;i<V;i++)vblock[j*V+i]=MAP.field(i*2-99,j*2-99)>1.6?1:0;
export const vcell=(x,z)=>{const i=(x+100)>>1,j=(z+100)>>1;return i<0||j<0||i>=V||j>=V?-1:j*V+i;};
const SIGHT={champ:15,minion:8.5,tower:12,inhib:8,core:12,ward:10,fountain:20};

class Unit{
 constructor(S,kind,team,x,z){this.id=++S.uid;this.kind=kind;this.team=team;this.x=x;this.z=z;this.yaw=team===1?Math.PI*.75:team===0?-Math.PI/4:0;this.alive=true;this.buffs=[];this.shields=[];this.r=.6;
  this.atkT=0;this.wind=0;this.wt=null;this.tgt=null;this.moving=false;this.cc={};this.hp=1;this.mp=0;this.st={};this.b={};this.path=null;this.vx=0;this.vz=0;this.spd=0;this.atkAnim=0;this.castAnim=0;this.hitT=0;this.lastHit=-99;this.lastChampHit=-99;}
 shieldOf(id){let s=0;for(const x of this.shields)if(x.id===id)s+=x.amt;return s;}
 get shield(){let s=0;for(const x of this.shields)s+=x.amt;return s;}
 has(id){return this.buffs.some(b=>b.id===id);}
 bf(id){return this.buffs.find(b=>b.id===id);}}

export class Sim{
 constructor(o){
  this.o=o;this.uid=0;this.t=0;this.len=o.minutes*60;this.T=cl(25/o.minutes,1,2.1);this.units=[];this.champs=[];this.projs=[];this.zones=[];this.ev=[];this.over=null;
  this.vis=[new Uint8Array(V*V),new Uint8Array(V*V)];this.visT=0;this.kills=[0,0];this.towersK=[0,0];this.inhibK=[0,0];this.drakes=[0,0];this.wardens=[0,0];this.goldT=[0,0];this.firstBlood=false;
  this.aeon=[0,0];this.wave=0;this.nextWave=20;this.camps=MAP.CAMPS.map(c=>({...c,units:[],at:22,name:c.kind}));
  this.bosses={drake:{at:150/this.T,u:null,x:MAP.PITS.drake[0],z:MAP.PITS.drake[1]},warden:{at:600/this.T,u:null,x:MAP.PITS.warden[0],z:MAP.PITS.warden[1]}};
  for(const s of MAP.structures()){const u=this.add(new Unit(this,s.kind,s.team,s.x,s.z));u.lane=s.lane;u.tier=s.tier;u.r=s.kind==='core'?2.8:s.kind==='inhib'?1.7:1.3;
   const hp=(s.kind==='core'?5500:s.kind==='inhib'?3600:TOWER.hp[s.tier])*(.45+.4/this.T);u.b={hp,ad:TOWER.ad,ar:s.kind==='tower'?TOWER.ar:20,mr:s.kind==='tower'?TOWER.mr:20,as:TOWER.as,ms:0,rng:TOWER.rng};u.st={...u.b};u.hp=hp;u.struct=1;}
  for(const team of[0,1]){const f=this.add(new Unit(this,'fountain',team,MAP.FOUNTAIN[team][0],MAP.FOUNTAIN[team][1]));f.r=2;f.st={hp:1,ad:0,ar:0,mr:0,rng:13};f.hp=1;f.untarget=1;f.struct=1;}
  // champions: o.teams = [[{id,role,bot,spells:[a,b],name}],[...]]
  o.teams.forEach((list,team)=>list.forEach((c,i)=>{const u=this.add(new Unit(this,'champ',team,0,0));u.def=CH[c.id];u.role=c.role;u.bot=c.bot;u.name=c.name||u.def.name;u.r=.8;
   u.lvl=1;u.xp=0;u.gold=500;u.items=[];u.ab=[0,0,0,0];u.sp=1;u.cd=[0,0,0,0];u.spells=c.spells.map(id=>({id,cd:0,ch:2}));u.k=u.d=u.a=u.cs=0;u.streak=0;u.dstreak=0;u.dmgDealt=0;u.goldEarned=0;u.wards=2;u.wardT=0;
   u.dmgBy=new Map();u.helpBy=new Map();u.respawn=0;u.recall=0;u.ord=null;u.pc=0;u.na=null;u.slot=i;u.idx=this.champs.length;u.proj=u.def.proj;u.ranged=!!u.def.ranged;u.multi=[];
   this.place(u);this.calc(u);u.hp=u.st.hp;u.mp=u.st.mp;this.champs.push(u);if(!c.bot)this.player=u;}));
  this.player=this.player||this.champs[0];
  for(const u of this.champs)if(u.bot||this.o.autoLvl)this.autoLevel(u);
  this.visUpdate();}
 add(u){this.units.push(u);return u;}
 place(u){const[fx,fz]=MAP.FOUNTAIN[u.team],a=u.slot/5*Math.PI*2,s=u.team?-1:1;[u.x,u.z]=MAP.nearestOpen(fx+s*3.2+Math.cos(a)*1.8,fz-s*3.2+Math.sin(a)*1.8);u.path=null;u.ord=null;}
 fx(k,o){this.ev.push({k,...o});}

 /* ---------------- stats ---------------- */
 calc(u){
  if(u.kind!=='champ'){const b=u.b,st=u.st;st.ar=b.ar;st.mr=b.mr;st.ad=b.ad;st.as=b.as;st.rng=b.rng;let ms=b.ms,slow=0,msP=0,adM=1;
   for(const x of u.buffs){if(x.slow)slow=Math.max(slow,x.slow);if(x.msP)msP+=x.msP;if(x.adM)adM*=x.adM;if(x.ar)st.ar+=x.ar;}
   st.ad=b.ad*adM;st.ms=u.boss?ms:ms*(1-slow)*(1+msP);return;}
  const b=u.def.base,l=u.lvl-1,g=(1-.035*l)*0+1;
  const st={hp:b.hp+b.hpG*l*(.65+.035*l),hpr:b.hpr+b.hprG*l,mp:b.mp+b.mpG*l,mpr:b.mpr+b.mprG*l,ad:b.ad+b.adG*l,ap:0,ar:b.ar+b.arG*l,mr:b.mr+b.mrG*l,asB:b.asG*l,ms:b.ms,msP:0,rng:b.rng,cdr:0,ls:0,pen:0,lethal:0,mpen:0,onhitM:0,healPow:0,thorns:0,abSlow:0,spellblade:0};
  u.baseAD=st.ad;
  for(const id of u.items){const it=ITEMS[id];for(const k of['ad','ap','hp','mp','ar','mr','ms','cdr','ls','pen','lethal','mpen','onhitM','healPow','thorns','abSlow','spellblade'])if(it[k])st[k]+=it[k];if(it.as)st.asB+=it.as;if(it.mpr)st.mpr+=it.mpr;if(it.hp5)st.hpr+=it.hp5;}
  let slow=0,noSlow=false,size=1;
  for(const x of u.buffs){if(x.ad)st.ad+=x.ad;if(x.ap)st.ap+=x.ap;if(x.ar)st.ar+=x.ar;if(x.mr)st.mr+=x.mr;if(x.as)st.asB+=x.as;if(x.ms)st.ms+=x.ms;if(x.msP)st.msP+=x.msP;if(x.rng)st.rng+=x.rng;if(x.onhitM)st.onhitM+=x.onhitM;if(x.cdr)st.cdr+=x.cdr;if(x.mpr)st.mpr+=x.mpr;
   if(x.slow)slow=Math.max(slow,x.slow);if(x.noSlow)noSlow=true;if(x.size)size=Math.max(size,x.size);}
  const p=u.def.passive;if(p.stats)p.stats(this,u,st);
  const dr=this.drakes[u.team];if(dr){st.ad*=1+.06*dr;st.ap*=1+.06*dr;}
  st.as=Math.min(2.5,b.as*(1+st.asB));st.cdr=Math.min(.4,st.cdr);if(!noSlow)st.msP-=slow;st.ms=Math.max(1.2,st.ms*(1+st.msP));u.size=size;
  if(u.st.hp&&st.hp>u.st.hp)u.hp+=st.hp-u.st.hp;if(u.st.mp&&st.mp>u.st.mp)u.mp+=st.mp-u.st.mp;
  u.st=st;u.hp=Math.min(u.hp,st.hp);u.mp=Math.min(u.mp,st.mp);}

 /* ---------------- queries ---------------- */
 attackable(u){if(!u.struct||u.kind==='fountain')return u.kind!=='fountain';const us=this.units;
  if(u.kind==='tower'){if(u.lane==='core')return us.some(x=>x.kind==='inhib'&&x.team===u.team&&!x.alive);if(u.tier===3)return true;return !us.some(x=>x.kind==='tower'&&x.team===u.team&&x.lane===u.lane&&x.tier>u.tier&&x.alive);}
  if(u.kind==='inhib')return !us.some(x=>x.kind==='tower'&&x.team===u.team&&x.lane===u.lane&&x.alive);
  if(u.kind==='core')return !us.some(x=>x.kind==='tower'&&x.team===u.team&&x.lane==='core'&&x.alive);return true;}
 seen(team,u){if(u.team===team||u.struct)return true;if(!u.alive)return false;const c=vcell(u.x,u.z);if(c<0||!this.vis[team][c])return false;
  if(u.stealth){for(const x of this.units)if(x.team===team&&x.alive&&(x.kind==='champ'||x.kind==='tower')&&Math.abs(x.x-u.x)<3&&Math.abs(x.z-u.z)<3)return true;return false;}return true;}
 foes(u,x,z,r,o={}){const out=[],team=u.team;for(const t of this.units){if(!t.alive||t.team===team||t.untarget||t.kind==='ward'||t.struct)continue;if(o.champs&&t.kind!=='champ')continue;if(team===2&&t.kind!=='champ')continue;if(u.kind==='minion'&&t.team===2)continue;
  const rr=r+t.r;if(Math.abs(t.x-x)>rr||Math.abs(t.z-z)>rr)continue;if((t.x-x)**2+(t.z-z)**2<=rr*rr)out.push(t);}return out;}
 friends(u,x,z,r,champs=true){const out=[];for(const t of this.units){if(!t.alive||t.team!==u.team||t.struct||t.kind==='ward')continue;if(champs&&t.kind!=='champ')continue;if((t.x-x)**2+(t.z-z)**2<=(r+t.r)**2)out.push(t);}return out;}
 cone(u,dx,dz,r,half,look,col){this.fx('cone',{x:u.x,z:u.z,dx,dz,r,half,look,col});const out=[];for(const t of this.foes(u,u.x,u.z,r)){const ax=t.x-u.x,az=t.z-u.z,l=Math.hypot(ax,az);if(l<t.r+.5||(ax*dx+az*dz)/l>=Math.cos(half))out.push(t);}return out;}

 /* ---------------- effects ---------------- */
 buff(t,o){if(!t.alive||t.struct)return;if(t.boss&&(o.slow||o.stun||o.root))return;const id=o.id||('b'+(++this.uid));const old=t.buffs.findIndex(b=>b.id===id);const b={...o,id,t:o.dur};if(old>=0)t.buffs[old]=b;else t.buffs.push(b);t.dirty=1;if(b.stealth)t.stealth=1;return b;}
 slow(t,p,dur){if(t.kind==='champ'||t.kind==='minion'||t.kind==='monster')this.buff(t,{slow:p,dur});}
 cc(t,k,dur,src){if(!t.alive||t.struct||t.boss)return;if(k==='air'){t.airT=dur;t.airD=dur;}this.buff(t,{[k]:1,dur,cc:k});if(k!=='silence'){t.wind=0;if(t.recall)this.cancelRecall(t);}this.fx('cc',{u:t,k,dur});}
 push(t,x,z,spd){if(!t.alive||t.struct||t.boss)return;const[ex,ez]=MAP.dashEnd(t.x,t.z,x,z,false);t.dash={x1:ex,z1:ez,spd,forced:1};this.cc(t,'stun',Math.hypot(ex-t.x,ez-t.z)/spd+.05);}
 shield(src,t,amt,dur,id){if(!t.alive)return;if(src&&src.kind==='champ'&&src!==t)amt*=1+src.st.healPow;t.shields.push({amt,t:dur,id:id||'s'});if(src&&src.kind==='champ'&&src!==t&&t.kind==='champ')t.helpBy.set(src,this.t);if(src&&src.def&&src.def.passive.heal)src.def.passive.heal(this,src,t);}
 heal(src,t,amt,silent){if(!t.alive)return;if(src&&src.kind==='champ'&&src!==t)amt*=1+src.st.healPow;if(t.has('grievous'))amt*=.5;const h=Math.min(amt,t.st.hp-t.hp);t.hp+=h;
  if(src&&src.kind==='champ'&&src!==t&&t.kind==='champ'){t.helpBy.set(src,this.t);if(src.def.passive.heal)src.def.passive.heal(this,src,t);}if(!silent&&h>6)this.fx('heal',{u:t,n:h});}
 nextAtk(u,o){u.na={...o,until:this.t+(o.dur||6)};}
 ember(u,t){const b=t.bf('ember');const n=Math.min(4,(b?b.n:0)+1);this.buff(t,{id:'ember',dur:3,n,dot:(3+u.lvl)*n,dotType:'m',src:u,fx:'ember'});}
 blink(u,x,z,col,over=1){const[ex,ez]=MAP.dashEnd(u.x,u.z,x,z,over);this.fx('blink',{x0:u.x,z0:u.z,x1:ex,z1:ez,col});u.x=ex;u.z=ez;u.path=null;u.wind=0;}
 dash(u,x,z,spd,o={}){const[ex,ez]=MAP.dashEnd(u.x,u.z,x,z,!!o.over);u.dash={x1:ex,z1:ez,spd,...o,set:new Set(),x0:u.x,z0:u.z};u.wind=0;u.path=null;if(o.trail||o.arc)this.fx('dash',{u,trail:o.trail,arc:o.arc});}

 /* ---------------- damage ---------------- */
 dmg(src,t,amt,type,o={}){
  if(!t.alive||t.untarget||amt<=0)return 0;if(t.struct){if(o.ab||!this.attackable(t))return 0;}
  if(src&&src.kind==='champ'){const p=src.def.passive;if(p.amp)amt*=p.amp(this,src,t);if(src.def.id==='morrow'&&t.has('chill'))amt*=1.1;
   if(t.struct)amt*=1.3;if(t.struct&&!this.units.some(m=>m.kind==='minion'&&m.alive&&m.team===src.team&&Math.abs(m.x-t.x)<11&&Math.abs(m.z-t.z)<11))amt*=.5;}
  if(t.emp)amt*=.7;if(t.kind==='monster'&&src&&src.kind==='champ'&&src.role==='jungle')amt*=1.35;
  let res=type==='p'?t.st.ar:type==='m'?t.st.mr:0;if(src&&src.kind==='champ'&&res>0){if(type==='p'){res=res*(1-src.st.pen)-src.st.lethal;}else res*=(1-src.st.mpen);}
  let d=type==='t'?amt:amt*(res>=0?100/(100+res):2-100/(100-res));
  if(t.kind==='champ'&&src&&src.kind==='minion')d*=.5;if(t.kind==='minion'&&src&&src.kind==='minion')d*=2;if(t.struct&&src&&src.kind==='minion')d*=1.5;
  let rem=d;for(const s of t.shields){const a=Math.min(s.amt,rem);s.amt-=a;rem-=a;if(rem<=0)break;}t.shields=t.shields.filter(s=>s.amt>.5);
  t.hp-=rem;t.lastHit=this.t;t.hitT=.12;if(t.recall)this.cancelRecall(t);
  if(src){if(src.kind==='champ'){if(t.kind==='champ'){t.dmgBy.set(src,this.t);t.lastChampHit=this.t;src.dmgDealt+=d;src.lastFight=this.t;}if(o.ab&&src.def.passive.abhit)src.def.passive.abhit(this,src,t);if(o.ab&&src.st.abSlow)this.slow(t,.2,1);
    if(src.st.ls&&o.atk)this.heal(src,src,d*src.st.ls,1);}
   if(t.kind==='monster'&&t.alive&&!t.aggro)this.aggroCamp(t,src);if(t.kind==='champ'&&src.kind==='champ')src.lastAtkChampT=this.t;}
  if(t.kind==='champ'||(src&&src===this.player)||t===this.player.ord?.t)this.fx('dmg',{u:t,n:d,type,src,crit:o.crit});
  if(t.hp<=0)this.die(t,src);return d;}
 autoHit(u,t){
  if(!t.alive)return;let mul=1;const p=u.def&&u.def.passive;if(p&&p.crit)mul=p.crit(this,u);
  if(u.kind==='tower'){if(t.kind==='minion'){const f={melee:.45,caster:.7,siege:.14,super:.08}[t.mtype]||.3;this.dmg(u,t,t.st.hp*f,'t');}else{const n=u.streak=(u.lastT===t?Math.min(3,(u.streak||0)+1):0);u.lastT=t;this.dmg(u,t,(u.st.ad+TOWER.adG*this.t/60*this.T)*(1+.25*n),'p');}return;}
  let d=u.st.ad*mul;if(u.kind==='minion'&&t.struct)d*=.65;if(u.kind==='monster'&&t.kind==='champ')d*=1;
  const na=u.na&&this.t<u.na.until?u.na:null;let extra=null;if(na){extra=na.bonus?na.bonus(t):null;}
  this.dmg(u,t,d,'p',{atk:1,crit:mul>1});
  if(extra&&t.alive)this.dmg(u,t,extra[0],extra[1]);if(na){if(na.onHit&&t.alive)na.onHit(t);na.n--;if(na.n<=0)u.na=null;this.fx('hitbig',{x:t.x,z:t.z,col:u.def?u.def.col:'#fff'});}
  if(u.kind==='champ'){if(u.st.onhitM&&t.alive)this.dmg(u,t,u.st.onhitM,'m');if(u.sb&&this.t<u.sb&&t.alive){u.sb=0;this.dmg(u,t,u.baseAD,'p');this.fx('hitbig',{x:t.x,z:t.z,col:'#4aa8ff'});}
   if(u.has('crimson')&&t.alive&&!t.struct){this.buff(t,{id:'burn',dur:3,dot:8+2*u.lvl,dotType:'t',src:u,slow:.1,fx:'ember'});}
   if(p.hit&&t.alive)p.hit(this,u,t);}
  if(t.kind==='champ'&&t.st.thorns&&u.kind!=='tower')this.dmg(t,u,10+.1*t.st.ar,'m');}

 /* ---------------- death & rewards ---------------- */
 grant(u,g,src){if(u.kind!=='champ'||g<=0)return;u.gold+=g;u.goldEarned+=g;this.goldT[u.team]+=g;if(src)this.fx('gold',{u,n:g,x:src.x,z:src.z});}
 xp(u,n){if(u.lvl>=18)return;u.xp+=n;while(u.lvl<18&&u.xp>=XPNEED(u.lvl)){u.xp-=XPNEED(u.lvl);u.lvl++;u.sp++;this.calc(u);this.fx('lvl',{u});if(u.bot||this.o.autoLvl)this.autoLevel(u);}}
 shareXP(team,x,z,n){const near=this.champs.filter(c=>c.alive&&c.team===team&&(c.x-x)**2+(c.z-z)**2<16*16);if(!near.length)return;const k=near.length===1?1:1.3/near.length;for(const c of near)this.xp(c,n*k*this.T*1.25);}
 canLevel(u,i){if(u.sp<=0)return false;const r=u.ab[i];if(i===3)return r<3&&u.lvl>=6+5*r;return r<5&&r<Math.ceil(u.lvl/2);}
 levelUp(u,i){if(!this.canLevel(u,i))return false;u.ab[i]++;u.sp--;return true;}
 autoLevel(u){const order=(u.def.max||'QWE').split('').map(c=>'QWER'.indexOf(c));while(u.sp>0){if(this.levelUp(u,3))continue;let done=false;
  if(u.lvl<=3){for(let i=0;i<3;i++)if(!u.ab[i]&&this.levelUp(u,i)){done=true;break;}}if(!done)for(const i of order)if(this.levelUp(u,i)){done=true;break;}if(!done)break;}}
 die(t,src){
  t.alive=false;t.hp=0;t.dash=null;t.wind=0;t.buffs=[];t.shields=[];
  // credit: the last champion to hurt a champion within 10 s gets the kill when a minion or tower finishes it
  let killer=src&&src.kind==='champ'?src:null;
  if(t.kind==='champ'){if(!killer){let best=-1;for(const[c,tt]of t.dmgBy)if(this.t-tt<10&&tt>best){best=tt;killer=c;}}
   const as=new Set();for(const[c,tt]of t.dmgBy)if(this.t-tt<10&&c!==killer)as.add(c);if(killer)for(const[c,tt]of killer.helpBy)if(this.t-tt<10&&c!==killer&&c.team===killer.team)as.add(c);
   t.d++;t.dstreak++;t.respawn=(5+t.lvl*1.7)*(1+this.t/this.len*.5)/Math.sqrt(this.T);this.kills[1-t.team]++;
   if(killer){let g=300;if(t.streak>=3)g+=Math.min(500,(t.streak-2)*100);if(t.dstreak>1)g=Math.max(120,g*Math.pow(.82,t.dstreak-1));if(!this.firstBlood){this.firstBlood=true;g+=100;this.fx('banner',{k:'first',u:killer,v:t});}
    this.grant(killer,g,t);killer.k++;killer.streak++;killer.dstreak=0;const ag=as.size?Math.round(g*.5/as.size):0;for(const a of as){a.a++;this.grant(a,ag,t);}
    const xp=(120+40*t.lvl);const all=[killer,...as];for(const a of all)this.xp(a,xp/all.length*1.2);
    killer.multi=killer.multi.filter(x=>this.t-x<10);killer.multi.push(this.t);if(killer.def.passive.kill)killer.def.passive.kill(this,killer,t);for(const a of as)if(a.def.passive.kill)a.def.passive.kill(this,a,t);
    for(const id of['azure','crimson']){const b=t.bf(id);if(b)this.buff(killer,{...b,id,dur:Math.max(30,b.t)});}}
   t.streak=0;t.dmgBy.clear();t.helpBy.clear();t.recall=0;
   this.fx('kill',{killer,victim:t,src,assists:[...as],multi:killer?killer.multi.length:0});return;}
  if(t.kind==='minion'){const g=t.gold;if(killer){this.grant(killer,g,t);killer.cs++;}this.shareXP(1-t.team,t.x,t.z,t.xpv);this.fx('mdie',{u:t});return;}
  if(t.kind==='monster'){const m=MON[t.mtype];if(!killer){let best=-1;for(const c of this.champs)if(c.alive&&c.team!==2&&(c.x-t.x)**2+(c.z-t.z)**2<400&&c.lastFight>best){best=c.lastFight;killer=c;}}
   this.fx('mdie',{u:t});
   if(m.boss){const team=killer?killer.team:null;if(team===null)return;if(m.boss==='drake'){this.drakes[team]++;for(const c of this.champs)if(c.team===team){this.grant(c,60,t);this.xp(c,m.xp*.6);this.calc(c);}}
    else{this.wardens[team]++;for(const c of this.champs)if(c.team===team){this.grant(c,250,t);this.xp(c,m.xp*.6);if(c.alive)this.buff(c,{id:'aeon',dur:150/Math.sqrt(this.T),ad:30,ap:45,fx:'aeon'});}this.aeon[team]=this.t+150/Math.sqrt(this.T);}
    this.fx('boss',{boss:m.boss,team,killer});return;}
   if(killer){this.grant(killer,m.gold,t);killer.cs++;this.xp(killer,m.xp*this.T*(killer.role==='jungle'?1.15:1));if(m.buff)this.buff(killer,{id:m.buff,dur:90,fx:m.buff,...(m.buff==='azure'?{cdr:.1,mpr:4}:{})});
    if(killer.spells.some(s=>s.id==='strike'))this.heal(killer,killer,40+killer.st.hp*.04);}return;}
  if(t.kind==='ward'){this.fx('wardx',{u:t});return;}
  if(t.struct){const team=1-t.team;
   if(t.kind==='tower'){this.towersK[team]++;for(const c of this.champs)if(c.team===team)this.grant(c,c.alive&&(c.x-t.x)**2+(c.z-t.z)**2<400?150:100,t);}
   if(t.kind==='inhib'){this.inhibK[team]++;t.respawnAt=this.t+240/this.T;for(const c of this.champs)if(c.team===team)this.grant(c,50,t);}
   this.fx('struct',{u:t,team});
   if(t.kind==='core'){this.end(team,'core');}}}
 end(win,why){if(this.over)return;this.over={win,why,t:this.t};this.fx('end',{win,why});}
 score(team){return this.kills[team]+this.towersK[team]*3+this.inhibK[team]*4+this.drakes[team]*2+this.wardens[team]*4;}

 /* ---------------- player/bot commands ---------------- */
 order(u,o){if(!u.alive)return;if(u.recall&&o)this.cancelRecall(u);if(o&&o.k==='move'&&u.wind>0&&u.wind<this.windOf(u)*.8)u.wind=0;u.ord=o;u.path=null;u.repath=0;}
 windOf(u){return Math.max(.1,.32/u.st.as);}
 rank(u,i){return u.ab[i];}
 abil(u,i){return u.def['QWER'[i]];}
 canCast(u,i){const a=this.abil(u,i),r=u.ab[i];return u.alive&&r>0&&u.cd[i]<=0&&u.mp>=a.cost[r-1]&&!u.cc.stun&&!u.cc.silence&&!u.dash&&!u.cc.air;}
 cast(u,i,x,z,t){
  if(!this.canCast(u,i))return false;const a=this.abil(u,i);
  if(a.type==='target'){if(!t||!t.alive||(!a.any&&t.team===u.team)||t.struct||t.kind==='ward')return false;if(Math.hypot(t.x-u.x,t.z-u.z)>a.rng+t.r+.3){u.ord={k:'cast',i,t};u.path=null;return 'pending';}}
  if(a.type==='ally'){if(!t||!t.alive||t.team!==u.team||t.kind!=='champ')t=u;if(Math.hypot(t.x-u.x,t.z-u.z)>a.rng+1){t=u;}}
  return this.doCast(u,i,x,z,t);}
 doCast(u,i,x,z,t){const a=this.abil(u,i),r=u.ab[i];if(u.recall)this.cancelRecall(u);
  let dx=x-u.x,dz=z-u.z,l=Math.hypot(dx,dz);if(l<.01){dx=Math.sin(u.yaw);dz=Math.cos(u.yaw);l=1;}dx/=l;dz/=l;
  if(t&&a.type==='target'){dx=t.x-u.x;dz=t.z-u.z;l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;}
  if(a.type==='ground'||a.type==='dash'){if(l>a.rng){x=u.x+dx*a.rng;z=u.z+dz*a.rng;}}
  if(a.type!=='self'&&a.type!=='ally')u.yaw=Math.atan2(dx,dz);
  u.mp-=a.cost[r-1];u.cd[i]=a.cd[r-1]*(1-u.st.cdr);u.castAnim=.35;u.castLock=a.type==='dash'?0:.12;u.wind=0;if(u.ord&&u.ord.k==='cast')u.ord=null;
  if(u.st.spellblade)u.sb=this.t+10;if(u.stealth&&i!==1){this.unveil(u);}
  this.fx('cast',{u,i,x,z});a.cast(this,u,{x,z,dx,dz,t,lv:r});if(u.def.passive.cast)u.def.passive.cast(this,u,i);return true;}
 unveil(u){u.buffs=u.buffs.filter(b=>!b.stealth);u.stealth=0;}
 spell(u,k,x,z,t){const s=u.spells[k];if(!s||!u.alive||u.cc.stun||u.cc.air||u.dash)return false;const sp=SPELLS[s.id];
  if(s.id==='strike'){if(s.ch<=0||s.cd>0)return false;const tg=t&&t.alive&&(t.kind==='monster'||t.kind==='minion')&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<6+t.r?t:null;if(!tg)return false;
   s.ch--;s.cd=1;this.fx('strike',{x:tg.x,z:tg.z,u});this.dmg(u,tg,450+30*u.lvl,'t');if(!tg.alive||tg.kind==='monster')this.heal(u,u,60+u.st.hp*.05);return true;}
  if(s.cd>0)return false;const scd=sp.cd/Math.sqrt(this.T);
  if(s.id==='blink'){const dx=x-u.x,dz=z-u.z,l=Math.hypot(dx,dz)||1,d=Math.min(5.5,l);this.blink(u,u.x+dx/l*d,u.z+dz/l*d,'#ffe08a');u.ord=null;}
  else if(s.id==='mend'){this.heal(u,u,90+15*u.lvl);this.buff(u,{id:'mendms',dur:1,msP:.3});const al=this.friends(u,u.x,u.z,8).filter(c=>c!==u).sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp)[0];if(al)this.heal(u,al,90+15*u.lvl);this.fx('bloom',{u,col:'#7dff9a'});}
  else if(s.id==='scorch'){const tg=t&&t.kind==='champ'&&t.team!==u.team&&t.alive&&Math.hypot(t.x-u.x,t.z-u.z)<7+t.r?t:null;if(!tg)return false;this.buff(tg,{id:'scorch',dur:5,dot:(70+20*u.lvl)/5,dotType:'t',src:u,fx:'ember'});this.buff(tg,{id:'grievous',dur:5});t.dmgBy.set(u,this.t);this.fx('zap',{x0:u.x,z0:u.z,x1:tg.x,z1:tg.z,col:'#ff7a2a'});}
  else if(s.id==='haste'){this.buff(u,{id:'haste',dur:8,msP:.4,fx:'haste'});}
  else if(s.id==='barrier'){this.shield(u,u,105+18*u.lvl,2.5);this.fx('ring',{u,col:'#e8e0ff'});}
  s.cd=scd;this.fx('spell',{u,id:s.id});if(u.recall)this.cancelRecall(u);return true;}
 recallStart(u){if(!u.alive||u.recall||u.dash)return;u.ord=null;u.path=null;u.wind=0;u.recall=u.has('aeon')?4:8;u.recallMax=u.recall;this.fx('recall',{u});}
 cancelRecall(u){if(u.recall){u.recall=0;this.fx('recallx',{u});}}
 ward(u,x,z){if(!u.alive||u.wards<=0)return false;const dx=x-u.x,dz=z-u.z,l=Math.hypot(dx,dz);if(l>7){x=u.x+dx/l*7;z=u.z+dz/l*7;}if(!MAP.walk(x,z))[x,z]=MAP.nearestOpen(x,z);
  u.wards--;const w=this.add(new Unit(this,'ward',u.team,x,z));w.hp=3;w.st={hp:3,ar:0,mr:0};w.r=.4;w.until=this.t+90;w.owner=u;this.fx('ward',{u:w});return true;}
 atFountain(u){const f=MAP.FOUNTAIN[u.team];return Math.hypot(u.x-f[0],u.z-f[1])<16;}
 canShop(u){return !u.alive||this.atFountain(u);}
 buy(u,id){const it=ITEMS[id];if(!it||!this.canShop(u))return false;const{c,used}=priceOf(id,u.items);if(u.gold<c)return false;
  if(BOOTS.includes(id)&&u.items.some(x=>BOOTS.includes(x)&&!(it.from||[]).includes(x)))return false;
  const left=u.items.filter((x,k)=>!used.includes(k));if(left.length>=6)return false;u.items=[...left,id];u.gold-=c;this.calc(u);this.fx('buy',{u,id});return true;}
 sell(u,k){if(!this.canShop(u)||!u.items[k])return false;const id=u.items[k];u.gold+=Math.round(ITEMS[id].c*.6);u.items.splice(k,1);this.calc(u);return true;}

 /* ---------------- simulation step ---------------- */
 step(dt){
  if(this.over)return;this.t+=dt;const T=this.T;
  // waves
  if(this.t>=this.nextWave){this.nextWave+=30;this.wave++;this.spawnWave();}
  // passive gold
  if(this.t>25)for(const c of this.champs){c.gold+=2*T*dt;c.goldEarned+=2*T*dt;if(c.alive&&c.lvl<18){c.xpAcc=(c.xpAcc||0)+1.5*T*dt;if(c.xpAcc>5){this.xp(c,c.xpAcc);c.xpAcc=0;}}}
  // jungle
  for(const cp of this.camps){if(!cp.units.length&&cp.at!==null&&this.t>=cp.at){this.spawnCamp(cp);}
   if(cp.units.length&&cp.units.every(u=>!u.alive)){cp.units=[];cp.at=this.t+(cp.kind==='azure'||cp.kind==='crimson'?150:90)/T;}}
  for(const k in this.bosses){const b=this.bosses[k];if(!b.u&&b.at!==null&&this.t>=b.at){this.spawnBoss(k);}if(b.u&&!b.u.alive){b.u=null;b.at=this.t+(k==='drake'?240:300)/T;}}
  // inhibitors respawn
  for(const u of this.units)if(u.kind==='inhib'&&!u.alive&&u.respawnAt&&this.t>=u.respawnAt){u.alive=true;u.hp=u.st.hp*.5;u.respawnAt=0;this.fx('inhibup',{u});}
  if(this.t-this.lastEmp>.5||!this.lastEmp){this.lastEmp=this.t;for(const m of this.units)if(m.kind==='minion'&&m.alive){m.emp=this.aeon[m.team]>this.t&&this.champs.some(c=>c.team===m.team&&c.alive&&c.has('aeon')&&(c.x-m.x)**2+(c.z-m.z)**2<100);}}
  for(const u of this.units){if(!u.alive&&u.kind!=='champ')continue;this.tickUnit(u,dt);}
  for(const u of this.units){if(!u.alive)continue;
   if(u.kind==='champ')this.champStep(u,dt);else if(u.kind==='minion')this.minionStep(u,dt);else if(u.kind==='monster')this.monsterStep(u,dt);else if(u.kind==='tower')this.towerStep(u,dt);else if(u.kind==='fountain')this.fountainStep(u,dt);else if(u.kind==='ward'){if(this.t>u.until)this.die(u,null);}}
  for(const u of this.champs)if(!u.alive){u.respawn-=dt;if(u.respawn<=0){u.alive=true;this.place(u);this.calc(u);u.hp=u.st.hp;u.mp=u.st.mp;u.airT=0;this.fx('respawn',{u});}}
  this.stepProjs(dt);this.stepZones(dt);
  // cleanup dead minions/monsters/wards after their death animations
  if((this.cleanT=(this.cleanT||0)+dt)>1){this.cleanT=0;this.units=this.units.filter(u=>u.alive||u.kind==='champ'||u.struct||this.t-u.lastHit<1.5);}
  this.visT-=dt;if(this.visT<=0){this.visT=.2;this.visUpdate();}
  if(this.t>=this.len&&!this.over){const a=this.score(0),b=this.score(1);this.end(a===b?(this.goldT[0]>=this.goldT[1]?0:1):a>b?0:1,'time');}}
 tickUnit(u,dt){
  u.hitT=Math.max(0,u.hitT-dt);u.atkAnim=Math.max(0,u.atkAnim-dt);u.castAnim=Math.max(0,u.castAnim-dt);if(u.airT>0)u.airT-=dt;
  if(u.kind==='champ'){if(!u.alive)return;for(let i=0;i<4;i++)if(u.cd[i]>0)u.cd[i]-=dt;for(const s of u.spells){if(s.cd>0)s.cd-=dt;if(s.id==='strike'&&s.ch<2){s.rt=(s.rt||0)+dt;if(s.rt>=50/this.T){s.rt=0;s.ch++;}}}
   if(u.wards<2){u.wardT+=dt;if(u.wardT>=90/this.T){u.wardT=0;u.wards++;}}
   const inF=this.atFountain(u)&&Math.hypot(u.x-MAP.FOUNTAIN[u.team][0],u.z-MAP.FOUNTAIN[u.team][1])<10;
   u.hp=Math.min(u.st.hp,u.hp+(u.st.hpr+(inF?u.st.hp*.12:0))*dt);u.mp=Math.min(u.st.mp,u.mp+(u.st.mpr+(inF?u.st.mp*.12:0))*dt);
   if(u.def.passive.tick)u.def.passive.tick(this,u,dt);
   if(u.recall>0){u.recall-=dt;if(u.recall<=0){u.recall=0;this.place(u);this.fx('recalled',{u});}}}
  let ch=false;const cc={};
  for(let k=u.buffs.length-1;k>=0;k--){const b=u.buffs[k];if(!b)continue;b.t-=dt;
   if(b.dot&&u.alive){this.dmg(b.src,u,b.dot*dt,b.dotType||'m');if(!u.alive)break;}if(b.hot&&u.alive)this.heal(u,u,b.hot*dt,1);
   if(b.t<=0){u.buffs.splice(k,1);ch=true;if(b.stealth)u.stealth=0;continue;}if(b.cc)cc[b.cc]=1;if(b.slow||b.ms||b.msP||b.as||b.ad||b.ap)ch=true;}
  if(cc.air)cc.stun=1;u.cc=cc;
  for(const s of u.shields)s.t-=dt;if(u.shields.length)u.shields=u.shields.filter(s=>s.t>0&&s.amt>.5);
  if(u.kind==='champ'||ch||u.dirty){u.dirty=0;if(u.alive)this.calc(u);}}
 face(u,x,z,k=1){const a=Math.atan2(x-u.x,z-u.z);let d=a-u.yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;u.yaw+=d*k;}
 // move toward (x,z); returns true when arrived
 moveTo(u,x,z,dt,stop=.15){const dx=x-u.x,dz=z-u.z,l=Math.hypot(dx,dz);if(l<=stop){u.moving=false;return true;}const s=Math.min(l-stop+.001,u.st.ms*dt);let nx=u.x+dx/l*s,nz=u.z+dz/l*s;
  if(!MAP.walk(nx,nz)&&MAP.walk(u.x,u.z)){if(MAP.walk(nx,u.z))nz=u.z;else if(MAP.walk(u.x,nz))nx=u.x;else{u.moving=false;return true;}}
  u.x=nx;u.z=nz;u.moving=true;this.face(u,x,z,Math.min(1,dt*14));return false;}
 // pathfind toward (x,z)
 goTo(u,x,z,dt,stop=.15){if(u.cc.root||u.cc.stun){u.moving=false;return false;}
  if(!u.path||u.pathTo&&Math.hypot(u.pathTo[0]-x,u.pathTo[1]-z)>1.5||(u.repath-=dt)<=0){u.path=MAP.path(u.x,u.z,x,z);u.pathTo=[x,z];u.repath=.6;}
  const p=u.path[0];if(!p){u.moving=false;return true;}const last=u.path.length===1;if(this.moveTo(u,p[0],p[1],dt,last?stop:.1)){if(last){u.path=null;return true;}u.path.shift();}return false;}
 inRange(u,t){const r=u.st.rng+u.r+t.r;return(t.x-u.x)**2+(t.z-u.z)**2<=r*r;}
 // attack t if in range; returns false if out of range
 attack(u,t,dt){if(!this.inRange(u,t))return false;u.moving=false;this.face(u,t.x,t.z,Math.min(1,dt*20));if(u.cc.stun||u.cc.air)return true;
  if(u.wind>0){u.wind-=dt;if(u.wind<=0){u.wind=0;const tt=u.wt;if(tt&&tt.alive){if(u.ranged||u.kind==='tower'){this.projs.push({homing:tt,x:u.x,z:u.z,y:u.kind==='tower'?6:1.4,spd:u.kind==='tower'?26:24,team:u.team,src:u,look:u.kind==='tower'?'tower':(u.proj||'shot'),atk:1});}else this.autoHit(u,tt);
     if(u.stealth)this.unveil(u);if(u.recall)this.cancelRecall(u);}}return true;}
  if(u.atkT<=0){u.wind=u.kind==='champ'?this.windOf(u):.22;u.wt=t;u.atkT=1/u.st.as;u.atkAnim=.4;if(u.kind==='champ'&&t.kind==='champ')u.lastFight=this.t;this.fx('atk',{u,t});}return true;}
 champStep(u,dt){
  u.atkT-=dt;if(u.recall>0){u.moving=false;return;}
  if(u.dash){this.dashStep(u,dt);return;}
  if(u.cc.stun||u.cc.air){u.moving=false;u.wind=0;return;}
  if(u.castLock>0){u.castLock-=dt;u.moving=false;return;}
  if(u.wind>0&&u.wt){if(!u.wt.alive||!this.inRange(u,u.wt)){u.wind=0;}else{this.attack(u,u.wt,dt);return;}}
  const o=u.ord;
  if(o){
   if(o.k==='move'){if(this.goTo(u,o.x,o.z,dt))u.ord=null;return;}
   if(o.k==='atk'||o.k==='cast'){const t=o.t;if(!t||!t.alive||(!this.seen(u.team,t)&&t.team!==u.team)||(t.struct&&!this.attackable(t)&&o.k==='atk')){u.ord=null;return;}
    if(o.k==='cast'){const a=this.abil(u,o.i);if(!this.canCast(u,o.i)){u.ord=null;return;}if(Math.hypot(t.x-u.x,t.z-u.z)<=a.rng+t.r+.3){u.ord=null;this.doCast(u,o.i,t.x,t.z,t);return;}this.goTo(u,t.x,t.z,dt,.5);return;}
    if(!this.attack(u,t,dt)){u.wind=0;if(u.cc.root){u.moving=false;return;}if(this.inRange(u,t)){return;}
     if(Math.hypot(t.x-u.x,t.z-u.z)<6&&MAP.los(u.x,u.z,t.x,t.z))this.moveTo(u,t.x,t.z,dt,.1);else this.goTo(u,t.x,t.z,dt,.5);}return;}
   if(o.k==='amove'){const f=this.nearestFoe(u,u.x,u.z,7,true);if(f){u.ord={k:'atk',t:f};return;}if(this.goTo(u,o.x,o.z,dt))u.ord=null;return;}}
  u.moving=false;
  // idle: auto-attack anything in range
  if((u.idleT=(u.idleT||0)-dt)<=0){u.idleT=.25;const f=this.nearestFoe(u,u.x,u.z,u.st.rng+u.r+.4,!u.bot);if(f&&(f.kind!=='tower'||this.attackable(f)))u.ord={k:'atk',t:f,auto:1};}}
 nearestFoe(u,x,z,r,structs,mons){let best=null,bd=1e9;for(const t of this.units){if(!t.alive||t.team===u.team||t.untarget)continue;if(t.team===2&&!mons&&!(t.aggro===u))continue;if(t.struct&&(!structs||!this.attackable(t)))continue;if(t.kind==='fountain')continue;
  const d=(t.x-x)**2+(t.z-z)**2-(t.r*t.r);if(d<r*r&&d<bd&&this.seen(u.team,t)){bd=d;best=t;}}return best;}
 dashStep(u,dt){const d=u.dash;if(d.tgt&&d.tgt.alive){const[ex,ez]=MAP.dashEnd(u.x,u.z,d.tgt.x,d.tgt.z,!!d.over);d.x1=ex;d.z1=ez;}
  const dx=d.x1-u.x,dz=d.z1-u.z,l=Math.hypot(dx,dz),stop=d.stop||0;const s=d.spd*dt;
  if(l<=stop+s||l<.05){if(l>stop){const k=(l-stop)/l;u.x+=dx*k;u.z+=dz*k;}u.dash=null;u.moving=false;if(d.onEnd)d.onEnd();return;}
  u.x+=dx/l*s;u.z+=dz/l*s;if(!d.back)u.yaw=Math.atan2(dx,dz);u.moving=true;
  if(d.hit){for(const t of this.foes(u,u.x,u.z,d.w||1.2))if(!d.set.has(t)){d.set.add(t);d.hit(t);}}}
 // ---- minions ----
 spawnWave(){const w=this.wave,T=this.T;const grow=Math.min(30,this.t/90*T);
  for(const team of[0,1])for(const k of MAP.LANE_IDS){const pts=MAP.laneFor(team,k);const types=['melee','melee','melee'];
   const supers=this.units.some(x=>x.kind==='inhib'&&x.team!==team&&x.lane===k&&!x.alive);if(supers)types.push('super');else if(w%3===0||(this.t>this.len*.6&&w%2===0))types.push('siege');types.push('caster','caster','caster');
   types.forEach((ty,n)=>{const m=MINION[ty];const sx=pts[0][0],sz=pts[0][1],nx=pts[1][0]-sx,nz=pts[1][1]-sz,nl=Math.hypot(nx,nz);
    const u=this.add(new Unit(this,'minion',team,sx-nx/nl*n*1.3+(Math.random()-.5)*.6,sz-nz/nl*n*1.3+(Math.random()-.5)*.6));u.mtype=ty;u.r=m.r;u.lane=k;u.pts=pts;u.wp=1;u.ranged=!!m.ranged;u.proj=ty==='siege'?'cannon':'mshot';
    const hp=m.hp+m.hpG*grow;u.b={hp,ad:m.ad+m.adG*grow,ar:m.ar,mr:m.mr,as:m.as,ms:m.ms,rng:m.rng};u.st={...u.b};u.hp=hp;u.gold=m.gold+(ty==='siege'?Math.min(30,grow):grow*.5);u.xpv=m.xp;u.yaw=Math.atan2(nx,nz);u.acq=Math.random()*.3;});}
  this.fx('wave',{n:w});}
 minionStep(u,dt){
  u.atkT-=dt;if(u.dash){this.dashStep(u,dt);return;}if(u.cc.stun||u.cc.air){u.moving=false;return;}
  if(u.wind>0&&u.wt&&u.wt.alive&&this.inRange(u,u.wt)){this.attack(u,u.wt,dt);return;}u.wind=0;
  let t=u.tgt;if(t&&(!t.alive||(t.x-u.x)**2+(t.z-u.z)**2>12*12||(t.kind==='champ'&&!this.seen(u.team,t))||(t.struct&&!this.attackable(t))))t=u.tgt=null;
  if((u.acq-=dt)<=0){u.acq=.35;// call for help: champions hitting allied champions nearby
   let best=null,bs=1e9;for(const x of this.units){if(!x.alive||x.team===u.team||x.team===2||x.untarget||x.kind==='fountain'||x.kind==='ward')continue;const d=(x.x-u.x)**2+(x.z-u.z)**2;if(d>9*9)continue;if(x.struct&&!this.attackable(x))continue;if(x.kind==='champ'&&!this.seen(u.team,x))continue;
    let pr=d;if(x.kind==='champ'){pr+=x.lastAtkChampT>this.t-2?-200:60;}else if(x.struct)pr+=40;if(pr<bs){bs=pr;best=x;}}
   if(best&&(!t||(t.kind!=='minion'&&best.kind==='minion')||!this.inRange(u,t)))t=u.tgt=best;}
  if(t){if(!this.attack(u,t,dt)){this.moveTo(u,t.x,t.z,dt,.1);}}
  else{const p=u.pts[u.wp];if(p){if(this.moveTo(u,p[0],p[1],dt,1.5))u.wp++;}else{const c=MAP.CORE[1-u.team];this.moveTo(u,c[0],c[1],dt,2);}}
  // separation from other minions
  if((u.sepT=(u.sepT||0)-dt)<=0){u.sepT=.1;for(const o of this.units){if(o===u||o.kind!=='minion'||!o.alive)continue;const dx=u.x-o.x,dz=u.z-o.z,rr=u.r+o.r;if(Math.abs(dx)>rr||Math.abs(dz)>rr)continue;const l=Math.hypot(dx,dz);if(l<rr&&l>.001){const k=(rr-l)*.5;const nx=u.x+dx/l*k,nz=u.z+dz/l*k;if(MAP.walk(nx,nz)){u.x=nx;u.z=nz;}}}}}
 // ---- jungle ----
 spawnCamp(cp){const list=CAMP_MON[cp.kind];cp.units=list.map((m,i)=>{const a=i/list.length*Math.PI*2+.5,rr=i?1.8:0;const u=this.mkMon(m,cp.x+Math.cos(a)*rr,cp.z+Math.sin(a)*rr);u.camp=cp;return u;});cp.at=null;this.fx('camp',{cp});}
 mkMon(m,x,z){const d=MON[m],g=Math.min(1.6,1+this.t/this.len*.9);const u=this.add(new Unit(this,'monster',2,x,z));u.mtype=m;u.r=d.r;u.home=[x,z];u.ranged=!!d.ranged;u.proj=m==='drake'?'fireball':m==='bog'?'spit':'mshot';
  u.b={hp:d.hp*g,ad:d.ad*g*(d.boss?1:.65),ar:d.ar,mr:d.mr,as:d.as,ms:5.2,rng:d.rng};u.st={...u.b};u.hp=u.b.hp;u.boss=d.boss;u.yaw=Math.random()*6;return u;}
 spawnBoss(k){const b=this.bosses[k];b.u=this.mkMon(k,b.x,b.z);b.u.camp={units:[b.u],x:b.x,z:b.z,boss:k};b.at=null;this.fx('bossup',{boss:k});}
 aggroCamp(t,src){const cp=t.camp;if(!src||src.team===2)return;for(const m of(cp?cp.units:[t]))if(m.alive&&!m.aggro){m.aggro=src;}}
 monsterStep(u,dt){u.atkT-=dt;if(u.dash){this.dashStep(u,dt);return;}if(u.cc.stun||u.cc.air)return;const[hx,hz]=u.home;const leash=u.boss?14:11;
  let t=u.aggro;if(t&&(!t.alive||Math.hypot(t.x-hx,t.z-hz)>leash+3||Math.hypot(u.x-hx,u.z-hz)>leash||t.stealth)){
   // switch to another nearby champion that hurt the camp recently, else reset
   const alt=this.champs.find(c=>c.alive&&c!==t&&c.team!==2&&Math.hypot(c.x-hx,c.z-hz)<leash&&this.t-c.lastFight<4&&(c.x-u.x)**2+(c.z-u.z)**2<64);u.aggro=t=alt||null;if(!t)u.reset=1;}
  if(u.wind>0&&u.wt&&u.wt.alive&&this.inRange(u,u.wt)){this.attack(u,u.wt,dt);return;}u.wind=0;
  if(t&&!u.reset){if(u.boss&&(u.slam=(u.slam||6)-dt)<=0){u.slam=u.boss==='warden'?7:8;this.zone(u,{x:t.x,z:t.z,r:3.5,delay:1,look:u.boss==='drake'?'fire':'quake',col:u.boss==='drake'?'#ff7a2a':'#c99aff',onHit:x=>{this.dmg(u,x,u.st.ad*1.6,'m');if(u.boss==='warden')this.cc(x,'air',.6,u);}});}
   if(!this.attack(u,t,dt))this.moveTo(u,t.x,t.z,dt,.1);return;}
  if(u.reset||Math.hypot(u.x-hx,u.z-hz)>.4){u.st.ms=8;if(this.moveTo(u,hx,hz,dt,.3)){u.reset=0;u.aggro=null;}u.hp=Math.min(u.st.hp,u.hp+u.st.hp*.25*dt);}else{u.moving=false;u.hp=Math.min(u.st.hp,u.hp+u.st.hp*.03*dt);}}
 // ---- structures ----
 towerStep(u,dt){u.atkT-=dt;let t=u.tgt;const R=u.st.rng+.3;const ok=x=>x&&x.alive&&x.team!==u.team&&x.team!==2&&!x.untarget&&x.kind!=='ward'&&!x.struct&&(x.x-u.x)**2+(x.z-u.z)**2<=(R+x.r)**2&&this.seen(u.team,x);
  if(!ok(t))t=u.tgt=null;
  if((u.acq=(u.acq||0)-dt)<=0){u.acq=.25;
   // champions that hurt an allied champion inside the tower's range draw aggro
   for(const c of this.champs)if(ok(c)&&c.team!==u.team){for(const a of this.champs)if(a.team===u.team&&a.alive&&this.t-a.lastChampHit<.6&&a.dmgBy.get(c)>this.t-.6&&(a.x-u.x)**2+(a.z-u.z)**2<=R*R){if(t!==c){t=u.tgt=c;u.streak=0;this.fx('aggro',{u,t:c});}}}
   if(!t){let best=null,bd=1e9;for(const x of this.units){if(!ok(x))continue;const d=(x.x-u.x)**2+(x.z-u.z)**2+(x.kind==='champ'?400:x.mtype==='siege'?-50:0);if(d<bd){bd=d;best=x;}}t=u.tgt=best;if(t&&t.kind==='champ')this.fx('aggro',{u,t});}}
  if(t)this.attack(u,t,dt);}
 fountainStep(u,dt){for(const c of this.champs)if(c.alive&&c.team!==u.team&&Math.hypot(c.x-u.x,c.z-u.z)<13){this.dmg(null,c,1200*dt,'t');if(Math.random()<dt*8)this.fx('zap',{x0:u.x,z0:u.z,x1:c.x,z1:c.z,col:u.team?'#ff4a3a':'#4aa8ff'});}}
 // ---- projectiles ----
 missile(u,o){const m={x:o.x??u.x,z:o.z??u.z,y:1.3,dx:o.dx,dz:o.dz,spd:o.spd,rng:o.rng,w:o.w,trav:0,team:u.team,src:u,look:o.look,pierce:o.pierce,champs:o.champs,onHit:o.onHit,onEnd:o.onEnd,hit:new Set(),tether:o.tether};this.projs.push(m);this.fx('missile',{m});return m;}
 stepProjs(dt){for(let k=this.projs.length-1;k>=0;k--){const m=this.projs[k];
  if(m.homing){const t=m.homing;if(!t.alive){this.projs.splice(k,1);continue;}const dx=t.x-m.x,dz=t.z-m.z,l=Math.hypot(dx,dz),s=m.spd*dt;
   if(l<=s+t.r*.5){this.projs.splice(k,1);if(m.atk&&m.src.alive!==undefined)this.autoHit(m.src,t);else if(m.onHit)m.onHit(t);this.fx('hit',{x:t.x,z:t.z,look:m.look,team:m.team});continue;}m.x+=dx/l*s;m.z+=dz/l*s;m.dx=dx/l;m.dz=dz/l;continue;}
  const s=m.spd*dt;m.x+=m.dx*s;m.z+=m.dz*s;m.trav+=s;let done=false;
  for(const t of this.foes(m.src,m.x,m.z,m.w,{champs:m.champs})){if(m.hit.has(t))continue;m.hit.add(t);if(m.onHit)m.onHit(t,m);this.fx('hit',{x:t.x,z:t.z,look:m.look,team:m.team});if(!m.pierce){done=true;break;}}
  if(done||m.trav>=m.rng||Math.abs(m.x)>99||Math.abs(m.z)>99){this.projs.splice(k,1);if(m.onEnd)m.onEnd(m);this.fx('mend',{m});}}}
 zone(u,o){const z={...o,team:u.team,src:u,t:0,acc:0,delay:o.delay||0,dur:o.dur||0,period:o.period||.5,fired:false,x:o.x??u.x,z:o.z??u.z};this.zones.push(z);this.fx('zone',{z});return z;}
 stepZones(dt){for(let k=this.zones.length-1;k>=0;k--){const z=this.zones[k];z.t+=dt;if(z.follow){if(!z.follow.alive){this.zones.splice(k,1);continue;}z.x=z.follow.x;z.z=z.follow.z;}
  if(!z.fired){if(z.t<z.delay){if(z.pre)for(const t of this.foes(z.src,z.x,z.z,z.r))z.pre(t);continue;}z.fired=true;z.t0=z.t;if(z.onHit){for(const t of this.foes(z.src,z.x,z.z,z.r))z.onHit(t);}this.fx('boom',{z});if(!z.dur){this.zones.splice(k,1);continue;}}
  z.acc+=dt;if(z.acc>=z.period){z.acc-=z.period;if(z.tick)z.tick(this.foes(z.src,z.x,z.z,z.r),this.friends(z.src,z.x,z.z,z.r,false));}
  if(z.t-z.t0>=z.dur){if(z.end)z.end(this.foes(z.src,z.x,z.z,z.r));this.zones.splice(k,1);}}}
 // ---- vision ----
 visUpdate(){for(const team of[0,1]){const g=this.vis[team];g.fill(0);
  for(const u of this.units){if(!u.alive||u.team!==team)continue;const r=SIGHT[u.kind];if(!r)continue;const ci=(u.x+100)/2,cj=(u.z+100)/2,rc=r/2,i0=Math.max(0,Math.floor(ci-rc)),i1=Math.min(V-1,Math.ceil(ci+rc)),j0=Math.max(0,Math.floor(cj-rc)),j1=Math.min(V-1,Math.ceil(cj+rc));
   const losOn=u.kind==='champ'||u.kind==='ward';
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=i+.5-ci,dz=j+.5-cj;if(dx*dx+dz*dz>rc*rc)continue;const c=j*V+i;if(g[c])continue;
    if(losOn){const n=Math.ceil(Math.hypot(dx,dz)/.8);let ok=true;for(let s=1;s<n;s++){const x=Math.floor(ci+dx*s/n),y=Math.floor(cj+dz*s/n);if(vblock[y*V+x]){ok=false;break;}}if(!ok)continue;}g[c]=1;}}}}
}
