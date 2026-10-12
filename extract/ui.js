// EXFIL — hideout screens (raid setup, stash + loadout + workbench, traders, tasks, record) and the in-raid inventory overlay.
import {ITEMS,WPN,AMMO,CAL,RAR,TRADERS,SELL,QUESTS,CONT,money,itemValue,itemKg,wstats,mkItem,LVXP,levelOf,AMMO_OF,VARIANTS,RAID_MIN,DIFF} from './data.js';
import {iconFor} from './tex.js';
import {SLOTS,slotAccept,autoAdd,removeIt,findGridOf,loKg,loValue,walk,describe,countId,takeId,newGrid,findSpot,place} from './inv.js';
import {questProg,questReady,completeQuest,saveProfile,level,freeKit,resetProfile} from './profile.js';
const $=id=>document.getElementById(id);
const SLOTDIM={primary:[5,2],secondary:[3,2],helmet:[2,2],armor:[3,3],bag:[3,3]};
const SLOTN={primary:'PRIMARY',secondary:'PISTOL',helmet:'HELMET',armor:'BODY ARMOUR',bag:'BACKPACK'};

export class UI{
 constructor(G){this.G=G;this.inv=G.inv;this.tab='raid';this.trader='marta';this.wb=null;
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{G.snd.click();this.show(b.dataset.t);});
  $('s-sort').onclick=()=>{this.sortStash();};
  this.inv.ctx={onChange:()=>this.onChange(),combine:(a,b)=>this.combine(a,b),home:it=>this.home(it),sell:(it,D)=>this.sellDrop(it,D),drop:(it,D)=>G.dropItem(it,D),price:it=>this.tab==='trade'&&this.G.app==='menu'?'SELL: '+money(this.sellPrice(it).v)+' → '+this.sellPrice(it).t:''};}
 get p(){return this.G.prof;}
 save(){saveProfile(this.p);}
 onChange(){if(this.G.app==='menu'){this.meta();this.save();if(this.tab==='raid')this.raidPane();if(this.tab==='stash')this.stashMeta();if(this.wb)this.workbench(this.wb);if(this.tab==='trade')this.tradeSum();}else this.G.onInvChange&&this.G.onInvChange();}
 show(t){this.tab=t;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-'+t));$('keys').hidden=t!=='raid';
  this.inv.views.clear();this.wb=null;$('s-wb').hidden=true;if(t==='raid')this.raidPane();if(t==='stash')this.stashPane();if(t==='trade')this.tradePane();if(t==='quest')this.questPane();if(t==='rec')this.recPane();this.meta();}
 meta(){const p=this.p,l=level(p);$('m-cr').textContent=money(p.credits);$('m-lv').textContent='LV '+l;const a=LVXP(l),b=LVXP(l+1);$('m-xp').style.width=(l>=30?100:Math.min(100,(p.xp-a)/(b-a)*100))+'%';}
 /* ---------- RAID ---------- */
 raidPane(){const lo=this.p.lo;const it=s=>lo[s]?ITEMS[lo[s].id].s+(ITEMS[lo[s].id].c==='weapon'?' ('+lo[s].ammo+')':''):'—';
  $('r-kit').innerHTML=`<span>PRIMARY <b>${it('primary')}</b></span><span>PISTOL <b>${it('secondary')}</b></span><span>ARMOUR <b>${lo.armor?ITEMS[lo.armor.id].s+' C'+ITEMS[lo.armor.id].cls:'—'}</b></span><span>HELMET <b>${lo.helmet?ITEMS[lo.helmet.id].s:'—'}</b></span><span>BAG <b>${it('bag')}</b></span><span>AT RISK <b class="v">${money(loValue(lo)-this.pouchVal())}</b></span><span>WEIGHT <b>${loKg(lo).toFixed(1)} KG</b></span>`;
  const noGun=!lo.primary&&!lo.secondary;$('freekit').hidden=!noGun;$('r-warn').textContent=noGun?'You have no weapon. Buy one from Marta, equip one from the stash, or request the free basic kit.':this.ammoWarn();}
 ammoWarn(){const lo=this.p.lo;for(const s of['primary','secondary']){const w=lo[s];if(!w)continue;const cal=WPN[ITEMS[w.id].wid].cal;const n=countId([lo.pockets,lo.pouch,...(lo.bag?[lo.bag.g]:[])],AMMO_OF[cal][0])+countId([lo.pockets,lo.pouch,...(lo.bag?[lo.bag.g]:[])],AMMO_OF[cal][1]);if(w.ammo===0&&n===0)return `${ITEMS[w.id].s} has no ammo loaded or carried.`;}return '';}
 pouchVal(){let v=0;for(const e of this.p.lo.pouch.items)v+=itemValue(e.it);return v;}
 /* ---------- STASH ---------- */
 stashPane(){const p=this.p,lo=p.lo;const eq=$('s-eq'),lg=$('s-lo'),sh=$('s-stash');eq.innerHTML='';lg.innerHTML='';sh.innerHTML='';
  const quick=it=>this.quickStash(it),menu=it=>this.menu(it),dbl=it=>{if(ITEMS[it.id].c==='weapon')this.workbench(it);};
  for(const s of SLOTS){const[w,h]=SLOTDIM[s];this.inv.slotView(eq,SLOTN[s],()=>lo[s],v=>{lo[s]=v;},it=>slotAccept(s,it),{w,h,quick,menu,dbl});}
  const lab=t=>{const e=document.createElement('h4');e.innerHTML=t;lg.appendChild(e);};
  lab('POCKETS');this.inv.gridView(lg,lo.pockets,{kind:'pockets',quick,menu,dbl});lab('SECURE POUCH <span>· KEPT ON DEATH</span>');this.inv.gridView(lg,lo.pouch,{kind:'pouch',quick,menu,dbl});
  this.bagHost=document.createElement('div');lg.appendChild(this.bagHost);this.bagView();
  this.inv.gridView(sh,p.stash,{kind:'stash',quick,menu,dbl});this.stashMeta();}
 bagView(){const lo=this.p.lo;const h=this.bagHost;if(!h)return;h.innerHTML='';const v={el:h,render:()=>{h.innerHTML='';if(lo.bag){const t=document.createElement('h4');t.innerHTML='BACKPACK <span>'+ITEMS[lo.bag.id].s+'</span>';h.appendChild(t);const gv=this.inv.gridView(h,lo.bag.g,{kind:'bag',quick:it=>this.quickStash(it),menu:it=>this.menu(it),dbl:it=>{if(ITEMS[it.id].c==='weapon')this.workbench(it);}});}}};v.render();this.inv.views.add(v);}
 stashMeta(){const p=this.p;$('s-val').textContent=money(loValue(p.lo))+' · '+loKg(p.lo).toFixed(1)+' KG';let v=0,n=0;for(const e of p.stash.items){v+=itemValue(e.it);n++;}$('s-cnt').textContent=n+' ITEMS · '+money(v);}
 sortStash(){const g=this.p.stash;const list=g.items.map(e=>e.it).sort((a,b)=>{const A=ITEMS[a.id],B=ITEMS[b.id];return B.w*B.h-A.w*A.h||A.c.localeCompare(B.c)||itemValue(b)-itemValue(a);});g.items.length=0;for(const it of list){if(!autoAdd(g,it)){const s=findSpot(g,it);if(s)place(g,it,s.x,s.y,s.r);}}this.G.snd.click();this.inv.refresh();}
 quickStash(it){const p=this.p,lo=p.lo;const src=this.srcOf(it);if(!src)return;
  if(src.kind==='stash'){const d=ITEMS[it.id];for(const s of SLOTS)if(!lo[s]&&slotAccept(s,it)){removeIt(src.g,it);lo[s]=it;this.inv.refresh();return;}
   removeIt(src.g,it);for(const[g,k]of[[lo.pockets,'pockets'],...(lo.bag?[[lo.bag.g,'bag']]:[])]){if(autoAdd(g,it,k)){this.inv.refresh();return;}}autoAdd(src.g,it);this.G.snd.err();this.G.note('NO SPACE IN LOADOUT','k');}
  else{if(src.slot){if(autoAdd(p.stash,it)){lo[src.slot]=null;}else this.G.snd.err();}else{removeIt(src.g,it);if(!autoAdd(p.stash,it)){autoAdd(src.g,it);this.G.snd.err();}}}this.inv.refresh();}
 srcOf(it){const p=this.p,lo=p.lo;for(const s of SLOTS)if(lo[s]===it)return{slot:s};const grids=this.G.app==='menu'?[[p.stash,'stash'],[lo.pockets,'pockets'],[lo.pouch,'pouch'],...(lo.bag?[[lo.bag.g,'bag']]:[])]:[[lo.pockets,'pockets'],[lo.pouch,'pouch'],...(lo.bag?[[lo.bag.g,'bag']]:[]),...(this.G.loot?[[this.G.loot.grid,'loot']]:[])];
  for(const[g,k]of grids){if(g.items.some(e=>e.it===it))return{g,kind:k};}for(const[g,k]of grids){const gg=findGridOf([g],it);if(gg)return{g:gg,kind:k==='stash'?'stash':'bag'};}return null;}
 home(it){const p=this.p;if(this.G.app==='menu')return autoAdd(p.stash,it);const lo=p.lo;return autoAdd(lo.pockets,it,'pockets')||(lo.bag&&autoAdd(lo.bag.g,it,'bag'))||(this.G.loot&&autoAdd(this.G.loot.grid,it));}
 // drag item A onto item B
 combine(a,b){const A=ITEMS[a.id],B=ITEMS[b.id];if(B.c!=='weapon')return false;const wid=B.wid;
  if(A.c==='mod'&&A.fits.includes(wid)){const old=b.mods[A.slot];b.mods[A.slot]=a;if(old&&!this.home(old)){b.mods[A.slot]=old;return false;}if(A.slot==='mag'||old&&ITEMS[old.id].slot==='mag'){const cap=wstats(b).mag;if(b.ammo>cap){const extra=b.ammo-cap;b.ammo=cap;this.home(mkItem(b.at,{n:extra,fir:true}));}}this.G.snd.rack();return true;}
  if(A.c==='ammo'&&AMMO[A.ammo].cal===WPN[wid].cal){if(b.ammo>0&&b.at!==a.id){this.unload(b);}b.at=a.id;const cap=wstats(b).mag;const k=Math.min(cap-b.ammo,a.n);if(k<=0)return false;b.ammo+=k;a.n-=k;this.G.snd.magIn();if(a.n>0)return false;return true;}
  return false;}
 unload(w){if(!w.ammo)return;const it=mkItem(w.at,{n:w.ammo});w.ammo=0;if(!this.home(it))this.G.note('NO SPACE FOR ROUNDS','k');}
 menu(it){const d=ITEMS[it.id],G=this.G,out=[];
  if(G.app!=='menu'){if(d.c==='med')out.push(['USE '+d.s,()=>G.useItem(it)]);if(d.c==='weapon'&&it.ammo>0)out.push(['UNLOAD',()=>{this.unload(it);}]);if(d.c==='bag'&&it.g&&it.g.items.length)out.push(['DROP CONTENTS',()=>{for(const e of it.g.items.slice()){removeIt(it.g,e.it);G.dropItem(e.it);}}]);out.push(['DROP',()=>{const s=this.srcOf(it);if(!s)return;if(s.slot)this.p.lo[s.slot]=null;else removeIt(s.g,it);G.dropItem(it);}]);return out;}
  if(d.c==='weapon'){out.push(['MODIFY',()=>this.workbench(it)]);if(it.ammo>0)out.push(['UNLOAD ROUNDS',()=>this.unload(it)]);const cal=WPN[d.wid].cal;for(const aid of AMMO_OF[cal]){const n=countId([this.p.stash,this.p.lo.pockets,this.p.lo.pouch,...(this.p.lo.bag?[this.p.lo.bag.g]:[])],aid);if(n>0)out.push(['LOAD '+ITEMS[aid].s+' ('+n+')',()=>this.loadFrom(it,aid)]);}}
  if(d.c==='bag'&&it.g&&it.g.items.length)out.push(['EMPTY INTO STASH',()=>{for(const e of it.g.items.slice()){if(autoAdd(this.p.stash,e.it))removeIt(it.g,e.it);}}]);
  if(this.tab==='trade'&&d.v>0){const sp=this.sellPrice(it);out.push(['SELL TO '+sp.t+' · '+money(sp.v),()=>this.sell(it)]);}
  out.push(['DISCARD',()=>{const s=this.srcOf(it);if(!s)return;if(s.slot)this.p.lo[s.slot]=null;else removeIt(s.g,it);}]);return out;}
 loadFrom(w,aid){const grids=[this.p.stash,this.p.lo.pockets,this.p.lo.pouch,...(this.p.lo.bag?[this.p.lo.bag.g]:[])];if(w.ammo>0&&w.at!==aid)this.unload(w);w.at=aid;const cap=wstats(w).mag;const need=cap-w.ammo;const left=takeId(grids,aid,need,false);w.ammo+=need-left;this.G.snd.magIn();}
 workbench(it){this.wb=it;const el=$('s-wb');el.hidden=false;const d=ITEMS[it.id],s=wstats(it),W=WPN[d.wid];this.inv.views.forEach(v=>{if(v.wb)this.inv.views.delete(v);});
  el.innerHTML=`<h3>${d.n.toUpperCase()}</h3><span style="color:${RAR[d.r].c};font-size:.55rem;letter-spacing:.16em">${RAR[d.r].n} · ${W.cls}</span><div class="st"><span>CALIBRE</span><b>${CAL[W.cal]}</b><span>FIRE</span><b>${W.modes.join(' / ').toUpperCase()} · ${W.rpm} RPM</b><span>MAGAZINE</span><b>${it.ammo} / ${s.mag} ${ITEMS[it.at].s}</b><span>RECOIL</span><b>${Math.round(W.kick*s.rec*100)}</b><span>ADS TIME</span><b>${Math.round(s.ergo*1000)} ms</b><span>OPTIC</span><b>${s.optic?ITEMS[s.optic].s+' '+s.zoom+'×':'IRONS'}</b><span>LOUDNESS</span><b>${Math.round(s.loud)} m${s.sup?' · SUPPRESSED':''}</b><span>VALUE</span><b>${money(itemValue(it))}</b></div><div class="mods"></div><p style="color:var(--mut);margin-top:10px">Drag mods from the stash onto a slot or onto the weapon. Right-click a weapon to load rounds.</p><div class="row" style="margin-top:8px"><button class="mini" id="wb-x">CLOSE</button></div>`;
  const mh=el.querySelector('.mods');for(const sl of W.slots){const v=this.inv.slotView(mh,sl.toUpperCase(),()=>it.mods[sl]||null,m=>{const old=it.mods[sl];it.mods[sl]=m;},m=>ITEMS[m.id].c==='mod'&&ITEMS[m.id].slot===sl&&ITEMS[m.id].fits.includes(d.wid),{w:5,h:1,quick:m=>{if(autoAdd(this.p.stash,m)){it.mods[sl]=null;this.inv.refresh();}},menu:m=>[['REMOVE TO STASH',()=>{if(autoAdd(this.p.stash,m))it.mods[sl]=null;}]]});v.wb=true;}
  el.querySelector('#wb-x').onclick=()=>{this.wb=null;el.hidden=true;};}
 /* ---------- TRADERS ---------- */
 tradePane(){const p=this.p,l=level(p);const tl=$('t-list');tl.innerHTML='';for(const t of TRADERS){const b=document.createElement('div');b.className='trd'+(t.id===this.trader?' on':'');b.innerHTML=`<div class="av" style="background:${t.col}">${t.n[0]}</div><b>${t.n}</b><span>${t.role.toUpperCase()}</span>`;b.title=t.blurb;b.onclick=()=>{this.trader=t.id;this.G.snd.click();this.tradePane();};tl.appendChild(b);}
  const T=TRADERS.find(t=>t.id===this.trader);const st=$('t-stock');st.innerHTML=`<p style="grid-column:1/-1;margin:0 0 4px;font-size:.66rem;color:var(--mut)">${T.blurb} Buys: ${T.buys[0]==='*'?'anything':T.buys.join(', ')} at ${Math.round((T.buys[0]==='*'?SELL.pike:SELL.own)*100)}% value.</p>`;
  for(const[id,lv]of T.stock){const d=ITEMS[id];const n=d.stack?(d.stack>=60?60:d.stack):1;const price=Math.round(d.v*n*(1-Math.min(.12,(l-lv)*.015)));const lock=l<lv;const e=document.createElement('div');e.className='so'+(lock?' lock':'');
   e.innerHTML=`<img src="${iconFor(mkItem(id))}"><div><b style="color:${RAR[d.r].c}">${d.n}${n>1?' ×'+n:''}</b><i>${money(price)}</i><span class="bl">${lock?'UNLOCKS AT LV '+lv:d.c.toUpperCase()}</span></div><button ${lock||p.credits<price?'disabled':''}>BUY</button>`;
   e.querySelector('button').onclick=()=>{if(p.credits<price||lock)return;const it=mkItem(id,d.stack?{n}:{});if(d.c==='weapon'){it.ammo=0;}if(!autoAdd(p.stash,it)){this.G.snd.err();this.G.toast('STASH FULL');return;}p.credits-=price;this.G.snd.buy();this.inv.refresh();this.tradePane();};
   e.onpointerenter=ev=>this.inv.showTip(mkItem(id,d.stack?{n}:{}),ev);e.onpointerleave=()=>{this.inv.tip.hidden=true;};st.appendChild(e);}
  const sh=$('t-stash');sh.innerHTML='';this.inv.views.clear();this.inv.gridView(sh,p.stash,{kind:'stash',menu:it=>this.menu(it),quick:it=>this.sell(it)});this.tradeSum();}
 tradeSum(){$('t-sum').textContent='SHIFT-CLICK TO SELL INSTANTLY';}
 sellPrice(it){const d=ITEMS[it.id];if(d.c==='quest'||d.c==='cash')return{v:d.c==='cash'?it.n:0,t:'CASH'};const T=TRADERS.find(t=>t.id===this.trader);const own=T.buys[0]!=='*'&&T.buys.includes(d.c);
  if(own)return{v:Math.round(itemValue(it)*SELL.own),t:T.n};return{v:Math.round(itemValue(it)*SELL.pike),t:'PIKE'};}
 sell(it){const d=ITEMS[it.id];if(d.c==='quest'){this.G.snd.err();return false;}const sp=this.sellPrice(it);const src=this.srcOf(it);if(!src)return false;if(src.slot)this.p.lo[src.slot]=null;else removeIt(src.g,it);this.p.credits+=sp.v;this.G.snd.buy();this.inv.refresh();this.meta();return true;}
 sellDrop(it,D){return this.sell(it);}
 /* ---------- TASKS ---------- */
 questPane(){const p=this.p,el=$('q-list');el.innerHTML='';for(const q of QUESTS){const s=p.quests[q.id],T=TRADERS.find(t=>t.id===q.tr);const prog=questProg(p,q),ready=questReady(p,q);const c=document.createElement('div');c.className='qc'+(s.s==='done'?' done':s.s==='locked'?' locked':'');
  const rw=[q.rw.cr?money(q.rw.cr):'',q.rw.xp?q.rw.xp+' XP':'',...(q.rw.items||[]).map(([id,n])=>ITEMS[id].s+(n>1?' ×'+n:''))].filter(Boolean).join(' · ');
  c.innerHTML=`<span class="tr" style="color:${T.col}">${T.n} · ${s.s==='locked'?'LOCKED':s.s==='done'?'COMPLETE':'ACTIVE'}</span><h4>${q.n}</h4><p>${q.d}</p><div class="pb"><i style="width:${prog/q.n_*100}%"></i></div><span>${prog} / ${q.n_}</span><p class="rw">REWARD: ${rw}</p>${s.s==='locked'?`<p style="color:var(--dim)">Requires: ${QUESTS.find(x=>x.id===q.req).n}</p>`:''}`;
  if(s.s==='active'){const b=document.createElement('button');b.textContent=q.type==='hand'?'HAND OVER':'CLAIM REWARD';b.disabled=!ready;b.onclick=()=>{const r=completeQuest(p,q);if(r){this.G.snd.quest();this.save();this.questPane();this.meta();if(r.lost.length)this.G.toast('STASH FULL · SOME REWARDS LOST');}};c.appendChild(b);}
  el.appendChild(c);}}
 /* ---------- RECORD ---------- */
 recPane(){const p=this.p,s=p.stats,el=$('rec');const rate=s.raids?Math.round(s.survived/s.raids*100):0;const cards=[['LEVEL',level(p)],['EXPERIENCE',p.xp.toLocaleString()],['RAIDS',s.raids],['SURVIVAL RATE',rate+'%'],['EXTRACTED',s.survived],['KILLED IN ACTION',s.kia],['MISSING IN ACTION',s.mia],['CURRENT STREAK',s.streak],['BEST STREAK',s.best],['DRIFTERS NEUTRALISED',s.kills.drifter],['PATROL NEUTRALISED',s.kills.patrol],['HEADSHOTS',s.heads],['VALUE EXTRACTED',money(s.extracted)],['BEST RAID',money(s.bestRaid)],['CREDITS',money(p.credits)]];
  el.innerHTML=cards.map(([a,b])=>`<div class="rc"><span>${a}</span><b>${b}</b></div>`).join('')+`<div class="rbtn"><button class="ghost" id="rst">RESET PROFILE</button></div>`;
  $('rst').onclick=()=>{if(!confirm('Wipe your EXFIL profile (stash, level, tasks)?'))return;this.G.prof=resetProfile();this.save();this.show('rec');};}

 /* ================= in-raid inventory ================= */
 raidInv(){const G=this.G,p=this.p,lo=p.lo;this.inv.views.clear();const eq=$('i-eq'),me=$('i-me'),lt=$('i-loot');eq.innerHTML='';me.innerHTML='';lt.innerHTML='';
  const quickMe=it=>{const L=G.loot;const src=this.srcOf(it);if(!src)return;if(L&&L.grid){if(src.slot){if(autoAdd(L.grid,it))lo[src.slot]=null;}else{removeIt(src.g,it);if(!autoAdd(L.grid,it))autoAdd(src.g,it);}this.inv.refresh();}};
  const quickLoot=it=>{const L=G.loot;removeIt(L.grid,it);const d=ITEMS[it.id];for(const s of SLOTS)if(!lo[s]&&slotAccept(s,it)){lo[s]=it;G.picked(it);this.inv.refresh();return;}
   if(autoAdd(lo.pockets,it,'pockets')||(lo.bag&&autoAdd(lo.bag.g,it,'bag'))){G.picked(it);this.inv.refresh();return;}autoAdd(L.grid,it);G.snd.err();G.note('NO SPACE','k');};
  const menu=it=>this.menu(it);
  const h=t=>{const e=document.createElement('h5');e.innerHTML=t;return e;};
  eq.appendChild(h('EQUIPMENT'));const r1=document.createElement('div');r1.className='eqrow';eq.appendChild(r1);
  for(const s of SLOTS){const[w,hh]=SLOTDIM[s];this.inv.slotView(r1,SLOTN[s],()=>lo[s],v=>{lo[s]=v;},it=>slotAccept(s,it),{w,h:hh,quick:quickMe,menu});}
  eq.appendChild(h('CONDITION'));const bh=document.createElement('div');bh.className='bodyhp';eq.appendChild(bh);this.bodyEl=bh;this.bodyHp();
  me.appendChild(h('POCKETS'));this.inv.gridView(me,lo.pockets,{kind:'pockets',quick:quickMe,menu});me.appendChild(h('SECURE POUCH <b>KEPT ON DEATH</b>'));this.inv.gridView(me,lo.pouch,{kind:'pouch',quick:quickMe,menu});
  const bagHost=document.createElement('div');me.appendChild(bagHost);const bv={el:bagHost,render:()=>{bagHost.innerHTML='';if(lo.bag){bagHost.appendChild(h('BACKPACK <b>'+ITEMS[lo.bag.id].s+'</b>'));this.inv.gridView(bagHost,lo.bag.g,{kind:'bag',quick:quickMe,menu});}else bagHost.appendChild(h('NO BACKPACK'));}};bv.render();this.inv.views.add(bv);
  const L=G.loot;if(L){const t=L.type==='body'?L.name:CONT[L.type]?CONT[L.type].n:'Container';lt.appendChild(h((L.type==='body'?'BODY · ':'')+t.toUpperCase()+' <b id="lstat"></b>'));this.inv.gridView(lt,L.grid,{kind:'loot',quick:quickLoot,menu:it=>[],hidden:it=>L.hidden&&L.hidden.has(it)?L.prog(it):null});}
  else{const e=h('NOTHING OPENED · PRESS F ON A CONTAINER OR BODY');lt.appendChild(e);}
  this.weightLine();}
 weightLine(){const lo=this.p.lo;$('iweight').textContent=loKg(lo).toFixed(1)+' KG · '+money(loValue(lo));}
 bodyHp(){if(!this.bodyEl||!this.G.P)return;const P=this.G.P;const n={head:'HEAD',thorax:'THORAX',stomach:'STOMACH',larm:'LEFT ARM',rarm:'RIGHT ARM',lleg:'LEFT LEG',rleg:'RIGHT LEG'};this.bodyEl.innerHTML=Object.keys(n).map(k=>`<span>${n[k]}</span><b style="color:${P.hp[k]<=0?'var(--bad)':P.hp[k]<P.max[k]*.5?'var(--warn)':'var(--fg)'}">${Math.max(0,Math.round(P.hp[k]))} / ${P.max[k]}${P.bleed[k]?' · BLEEDING':''}${P.frac[k]?' · FRACTURE':''}</b>`).join('');}
}
