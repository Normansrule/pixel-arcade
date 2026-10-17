// EXFIL — persistent profile: stash, loadout, credits, XP/levels, quest state, raid record.
import {ITEMS,QUESTS,mkItem,setUid,levelOf,AMMO_OF,WPN} from './data.js';
import {newGrid,autoAdd,countId,takeId,walk,SLOTS} from './inv.js';
const KEY='pxd_exfil_save';

function load(it,n){it.ammo=n;return it;}
export function newProfile(){const p={v:1,credits:45000,xp:0,stash:newGrid(10,40),lo:{primary:null,secondary:null,helmet:null,armor:null,bag:null,pockets:newGrid(4,1),pouch:newGrid(2,2)},quests:{},
  stats:{raids:0,survived:0,kia:0,mia:0,streak:0,best:0,kills:{drifter:0,patrol:0},heads:0,extracted:0,bestRaid:0,found:0},opt:{var:-1,time:1,diff:1,sens:1},kitN:0};
 const lo=p.lo;lo.primary=load(mkItem('vx9'),30);lo.secondary=load(mkItem('p9'),15);lo.armor=mkItem('vest2');lo.helmet=mkItem('hlm2');lo.bag=mkItem('bag1');
 autoAdd(lo.bag.g,mkItem('9fmj',{n:60}),'bag');autoAdd(lo.bag.g,mkItem('9fmj',{n:30}),'bag');autoAdd(lo.bag.g,mkItem('band'),'bag');autoAdd(lo.pockets,mkItem('kit'),'pockets');autoAdd(lo.pockets,mkItem('band'),'pockets');autoAdd(lo.pockets,mkItem('cash',{n:6000}),'pockets');
 const st=p.stash;for(const[id,o]of[['stk',{}],['12b',{n:20}],['12s',{n:10}],['9fmj',{n:60}],['9fmj',{n:60}],['band',{}],['band',{}],['splint',{}],['pills',{}],['kit',{}],['dot',{}],['grip',{}],['bag1',{}],['bolts',{}],['tape',{}],['cash',{n:4000}]]){const it=mkItem(id,o);if(id==='stk')load(it,0);autoAdd(st,it);}
 initQuests(p);return p;}
export function loadProfile(){let p=null;try{p=JSON.parse(localStorage.getItem(KEY));}catch(e){}if(!p||p.v!==1)p=newProfile();
 // uid continuity
 let m=1;const scan=it=>{if(!it)return;m=Math.max(m,it.u||0);if(it.mods)for(const k in it.mods)scan(it.mods[k]);if(it.g)for(const e of it.g.items)scan(e.it);};for(const e of p.stash.items)scan(e.it);for(const s of SLOTS)scan(p.lo[s]);for(const e of p.lo.pockets.items)scan(e.it);for(const e of p.lo.pouch.items)scan(e.it);setUid(m+1);
 initQuests(p);p.opt=Object.assign({var:-1,time:1,diff:1,sens:1},p.opt||{});return p;}
export function saveProfile(p){try{localStorage.setItem(KEY,JSON.stringify(p));}catch(e){}}
export function resetProfile(){try{localStorage.removeItem(KEY);}catch(e){}return newProfile();}
export const level=p=>levelOf(p.xp);

/* ---------- quests ---------- */
export function initQuests(p){for(const q of QUESTS){if(!p.quests[q.id])p.quests[q.id]={s:'locked',n:0};const s=p.quests[q.id];if(s.s==='locked'&&(!q.req||(p.quests[q.req]&&p.quests[q.req].s==='done')))s.s='active';}}
export function questProg(p,q){const s=p.quests[q.id];if(s.s==='done')return q.n_;if(q.type==='hand'){const a=countId([p.stash],q.item,true);if(q.item2){return Math.min(a,countId([p.stash],q.item2,true));}return Math.min(q.n_,a);}return Math.min(q.n_,s.n);}
export function questReady(p,q){const s=p.quests[q.id];return s.s==='active'&&questProg(p,q)>=q.n_;}
export function completeQuest(p,q){const s=p.quests[q.id];if(!questReady(p,q))return false;if(q.type==='hand'){takeId([p.stash],q.item,q.n_,true);if(q.item2)takeId([p.stash],q.item2,q.n_,true);}
 s.s='done';p.credits+=q.rw.cr||0;p.xp+=q.rw.xp||0;const lost=[];for(const[id,n]of q.rw.items||[]){const d=ITEMS[id];const it=mkItem(id,d.stack?{n}:{});if(!autoAdd(p.stash,it))lost.push(id);}initQuests(p);return{lost};}
// raid summary: {kills:[{fac,cls,head}], ex:id|null, survived, carried:Set(ids)}
export function questRaid(p,r){const out=[];for(const q of QUESTS){const s=p.quests[q.id];if(s.s!=='active')continue;const before=s.n;
  if(q.type==='kill'){for(const k of r.kills){if(q.fac!=='*'&&k.fac!==q.fac)continue;if(q.cls&&k.cls!==q.cls)continue;if(q.head&&!k.head)continue;s.n=Math.min(q.n_,s.n+1);}}
  else if(q.type==='extract'){if(r.survived&&r.ex===q.ex)s.n=q.n_;}
  else if(q.type==='streak'){s.n=r.survived?Math.min(q.n_,s.n+1):0;}
  else if(q.type==='carry'){if(r.survived&&r.carried.has(q.item))s.n=q.n_;}
  if(s.n!==before&&q.type!=='streak'||q.type==='streak'&&s.n>=q.n_&&before<q.n_)out.push({q,n:s.n,ready:s.n>=q.n_});}return out;}
export function freeKit(p){// basic issue: pistol + rounds + bandage
 const lo=p.lo;if(!lo.secondary){const it=mkItem('p9');it.ammo=15;lo.secondary=it;}if(!lo.pockets.items.some(e=>e.it.id==='9fmj'))autoAdd(lo.pockets,mkItem('9fmj',{n:45}),'pockets');if(!lo.pockets.items.some(e=>ITEMS[e.it.id].c==='med'))autoAdd(lo.pockets,mkItem('band'),'pockets');p.kitN++;}
