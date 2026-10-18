// BASTION LINE — the simulation (no rendering): waves and their spawn queue, enemies walking the paths with status effects
// (slow, freeze, stun, burn, sunder, brittle), shields, healers, splitters and bosses; towers with targeting priorities and
// projectiles; the hero with levels and abilities; gold, interest and lives. Everything the view needs comes out as events in S.ev.
import {T,E,HEROES,HERO_XP,DIFF,tstats,SELL} from './data.js';
import {makeMap} from './map.js';
import {Director} from './ai.js';
import {cl} from './util.js';

const PRI=['first','last','strong','close'];
export class Sim{
 constructor(o){this.M=makeMap(o.map);this.diff=o.diff;this.DF=DIFF[o.diff];this.waves=o.waves;this.len=Math.round(o.waves*(this.DF.gap+26)+300);this.heroType=o.hero||'wren';
  this.t=0;this.lives=this.lives0=this.DF.lives;this.gold=this.DF.gold;this.wave=0;this.enemies=[];this.towers=[];this.projs=[];this.patches=[];this.strikes=[];this.ev=[];this.queue=[];
  this.next=this.DF.first;this.over=null;this.id=1;this.hero=null;this.waveLeft={};this.waveDone={};
  this.st={kills:0,leaks:0,leaked:0,built:0,upg:0,sold:0,earned:0,spent:0,cleared:0,bossKills:0,interest:0,early:0};
  this.dir=new Director(this);this.plan=this.dir.plan(1);this._p={x:0,y:0,z:0,yaw:0};}
 /* ---------- economy & orders ---------- */
 earn(n){n=Math.round(n);this.gold+=n;this.st.earned+=n;}
 build(type,x,z){const d=T[type];if(!d||this.over)return'Unknown tower';if(this.gold<d.c)return'Not enough gold';const why=this.M.canBuild(x,z,this.towers,this.hero);if(why)return why;
  this.gold-=d.c;this.st.spent+=d.c;const t={id:this.id++,type,x,z,y:this.M.height(x,z),a:0,b:0,mode:'first',cd:.3,yaw:Math.random()*6,kills:0,dmg:0,spent:d.c,stunT:0,buffT:0,n:0,s:tstats(type,0,0),born:this.t,fireT:0};
  this.towers.push(t);this.st.built++;this.ev.push({k:'build',t});return t;}
 canUp(t,p){const tier=p?t.b:t.a,other=p?t.a:t.b;if(tier>=3)return'Path complete';if(tier>=1&&other>=2)return'Other path is specialised';return 0;}
 upCost(t,p){const tier=p?t.b:t.a;return tier<3?T[t.type].p[p][tier].c:0;}
 upgrade(t,p){if(this.over)return'Over';const why=this.canUp(t,p);if(why)return why;const c=this.upCost(t,p);if(this.gold<c)return'Not enough gold';this.gold-=c;this.st.spent+=c;t.spent+=c;
  if(p)t.b++;else t.a++;t.s=tstats(t.type,t.a,t.b);this.st.upg++;this.ev.push({k:'upgrade',t,p,tier:p?t.b:t.a});return 0;}
 sell(t){const i=this.towers.indexOf(t);if(i<0)return;this.towers.splice(i,1);const v=Math.round(t.spent*SELL);this.gold+=v;this.st.sold++;this.ev.push({k:'sell',t,v});}
 sellValue(t){return Math.round(t.spent*SELL);}
 cycle(t,dir=1){t.mode=PRI[(PRI.indexOf(t.mode)+dir+4)%4];return t.mode;}
 placeHero(x,z){if(this.hero)return'Hero already placed';const why=this.M.canBuild(x,z,this.towers,null);if(why)return why;const H=HEROES[this.heroType];
  this.hero={type:this.heroType,H,x,z,tx:x,tz:z,y:this.M.height(x,z),lv:1,xp:0,cd:0,ab:[0,0],yaw:0,kills:0,dmg:0,buffT:0,moving:0,atkT:0,s:null};this.heroStats();this.ev.push({k:'hero',h:this.hero});return 0;}
 moveHero(x,z){const h=this.hero;if(!h)return'No hero';const M=this.M;if(Math.abs(x)>50||Math.abs(z)>30||(M.water!=null&&M.riverD(x,z)<4.4&&M.pathD(x,z)>2)||M.inBlock(x,z,.4)||M.height(x,z)>2.2)return'Cannot stand there';
  for(const t of this.towers)if(Math.hypot(t.x-x,t.z-z)<1.6)return'A tower is there';h.tx=x;h.tz=z;return 0;}
 heroStats(){const h=this.hero,b=h.H.s,l=h.lv-1;h.s={...b,dmg:b.dmg*(1+.22*l),rate:b.rate*(1+.04*l),range:b.range+.12*l};}
 heroXP(n){const h=this.hero;if(!h)return;h.xp+=n;while(h.lv<10&&h.xp>=HERO_XP[h.lv]){h.lv++;this.heroStats();this.ev.push({k:'herolvl',h});}}
 ability(i){const h=this.hero;if(!h||this.over)return'No hero';const A=h.H.ab[i];if(h.lv<A.lv)return'Unlocks at level '+A.lv;if(h.ab[i]>0)return'Recharging';const live=this.enemies.filter(e=>e.alive);
  if(h.type==='wren'){if(i===0){for(const t of this.towers)if(Math.hypot(t.x-h.x,t.z-h.z)<12)t.buffT=8;h.buffT=8;this.ev.push({k:'warcry',h});}
   else{if(!live.length)return'No targets';const tg=this.strongest(live);const p={x:tg.x,z:tg.z};for(const e of live)if(Math.hypot(e.x-p.x,e.z-p.z)<3.6){this.hurt(e,320+130*h.lv,'pierce',h);if(!e.d.boss)e.stunT=Math.max(e.stunT,1.5);}this.ev.push({k:'skyfall',x:p.x,z:p.z});}}
  else{if(i===0){let n=0;for(const e of live)if(Math.hypot(e.x-h.x,e.z-h.z)<9){n++;if(e.d.boss){e.slowK=Math.max(e.slowK,.6);e.slowT=2;}else e.frzT=Math.max(e.frzT,2);this.hurt(e,30+10*h.lv,'magic',h);}this.ev.push({k:'nova',h,n});}
   else{if(!live.length)return'No targets';for(let k=0;k<14;k++)this.strikes.push({at:this.t+.15+k*.17,dmg:110+40*h.lv});this.ev.push({k:'tempest',h});}}
  h.ab[i]=A.cd;return 0;}
 callWave(){if(this.over||this.next==null||this.wave>=this.waves)return false;if(this.wave>0&&this.next>1){const b=Math.round(this.next*2.2);this.earn(b);this.st.early+=b;this.ev.push({k:'early',g:b});}this.next=0;return true;}
 /* ---------- waves ---------- */
 startWave(){const w=++this.wave,p=this.plan;if(w>1&&!this.waveDone[w-1]){this.waveDone[w-1]=1;this.waveEnd(w-1);}this.next=null;for(const g of p.list)this.queue.push({...g,at:this.t+g.at,w});this.waveLeft[w]=p.list.length;this.ev.push({k:'wave',w,plan:p,boss:p.boss});}
 spawn(type,pi,dist,w,elite,off){const d=E[type],DF=this.DF;const k=w-1;const mul=(d.boss?1+.05*k:1+.12*k+.0065*k*k)*DF.hp*(elite?1.35:1);
  const e={id:this.id++,type,d,pi,dist,off:off??(Math.random()-.5)*1.5,hp:d.hp*mul,mhp:d.hp*mul,shield:(d.shield||0)*mul,mshield:(d.shield||0)*mul,spd:d.spd*DF.spd*(elite?1.12:1),armor:d.armor||0,fly:!!d.fly,alive:true,w,
   x:0,y:0,z:0,yaw:0,slowK:0,slowT:0,frzT:0,stunT:0,burnT:0,burnD:0,burnS:null,sundT:0,britT:0,hitT:0,healT:2+Math.random(),phase:0,stompT:7,elite:!!elite,born:this.t};
  this.M.pos(pi,dist,e.off,e);if(e.fly)e.y+=3.2;this.enemies.push(e);this.waveLeft[w]=(this.waveLeft[w]||0)+1;if(d.boss)this.ev.push({k:'boss',e});return e;}
 gone(e){const w=e.w;this.waveLeft[w]--;}
 /* ---------- damage ---------- */
 hurt(e,dmg,kind,src,o){if(!e.alive||dmg<=0)return 0;let d=dmg;if(o&&o.boss&&e.d.boss)d*=o.boss;if(e.britT>0)d*=1.35;if(e.elite)d*=.9;
  if(e.shield>0&&kind!=='fire'){const mk=kind==='magic'?2:1;let sd=d*mk;if(o&&o.strip)sd=Math.max(sd,e.shield);const take=Math.min(e.shield,sd);e.shield-=take;d-=take/mk;
   if(e.shield<=0){e.shield=0;this.ev.push({k:'shieldbreak',e});}if(d<=0){if(src)src.dmg+=take/mk;if(!(o&&o.quiet))e.hitT=.1;return take/mk;}}
  if(kind==='phys')d*=1-Math.max(0,e.armor-(e.sundT>0?.35:0));
  e.hp-=d;if(src)src.dmg+=d;if(!(o&&o.quiet))e.hitT=.1;if(e.hp<=0)this.kill(e,src);return d;}
 kill(e,src){e.alive=false;e.hp=0;this.gone(e);const g=e.d.gold*(e.elite?1.5:1);this.earn(g);this.st.kills++;if(e.d.boss)this.st.bossKills++;
  if(src){src.kills++;if(src===this.hero)this.heroXP(4+g*1.5);}this.heroXP(1);this.ev.push({k:'die',e,g:Math.round(g),src});
  if(e.d.split)for(let i=0;i<3;i++){const c=this.spawn(e.d.split,e.pi,Math.max(0,e.dist+(i-1)*.8),e.w,e.elite,e.off+(i-1)*.5);c.fly=false;}}
 strongest(list){let b=null,bs=-1;for(const e of list){const s=(e.d.boss?1e7:0)+e.hp+e.shield;if(s>bs){bs=s;b=e;}}return b;}
 rem(e){return this.M.paths[e.pi].len-e.dist;}
 pick(list,mode,x,z){let b=null,bs=-1e9;for(const e of list){let s;if(mode==='first')s=-this.rem(e);else if(mode==='last')s=this.rem(e);else if(mode==='strong')s=(e.d.boss?1e7:0)+e.hp+e.shield;else s=-Math.hypot(e.x-x,e.z-z);if(s>bs){bs=s;b=e;}}return b;}
 ahead(e,secs){const v=e.spd*this.factor(e),o={x:0,y:0,z:0,yaw:0};this.M.pos(e.pi,Math.min(this.M.paths[e.pi].len,e.dist+v*secs),e.off,o);if(e.fly)o.y+=3.2;return o;}
 factor(e){return e.stunT>0||e.frzT>0?0:(1-e.slowK);}
 splash(x,z,r,dmg,kind,src,s,air=false){let n=0;for(const e of this.enemies){if(!e.alive||(e.fly&&!air))continue;const dd=Math.hypot(e.x-x,e.z-z);if(dd>r+e.d.r*.5)continue;n++;
   this.hurt(e,dmg*(1-.45*cl(dd/r,0,1)),kind,src,s);if(!e.alive)continue;if(s.stun&&!e.d.boss)e.stunT=Math.max(e.stunT,s.stun);if(s.sunder)e.sundT=4;if(s.burn){e.burnT=3;if(s.burn>=e.burnD){e.burnD=s.burn;e.burnS=src;}}}return n;}
 /* ---------- tick ---------- */
 step(dt){if(this.over)return;this.t+=dt;const M=this.M;
  if(this.next!=null&&this.wave<this.waves){if(this.wave>0||this.next>0)this.next-=dt;if(this.next<=0)this.startWave();}
  for(let i=this.queue.length-1;i>=0;i--){const q=this.queue[i];if(this.t>=q.at){this.queue.splice(i,1);this.spawn(q.type,q.pi,0,q.w,q.elite);this.waveLeft[q.w]--;}}
  // once a wave has fully spawned, count down to the next one
  if(this.next==null&&!this.queue.length&&this.wave<this.waves){this.next=this.DF.gap+(this.plan.boss?6:0);this.plan=this.dir.plan(this.wave+1);}
  // strikes (tempest)
  for(let i=this.strikes.length-1;i>=0;i--){const s=this.strikes[i];if(this.t<s.at)continue;this.strikes.splice(i,1);const live=this.enemies.filter(e=>e.alive);if(!live.length)continue;
   const sorted=live.sort((a,b)=>(b.d.boss?1e7:0)+b.hp-((a.d.boss?1e7:0)+a.hp));const tg=sorted[Math.min(sorted.length-1,(Math.random()*Math.min(4,sorted.length))|0)];this.ev.push({k:'strike',x:tg.x,y:tg.y,z:tg.z});this.hurt(tg,s.dmg,'magic',this.hero);}
  // enemies
  for(const e of this.enemies){if(!e.alive)continue;e.hitT-=dt;if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slowK=0;}if(e.frzT>0)e.frzT-=dt;if(e.stunT>0)e.stunT-=dt;if(e.sundT>0)e.sundT-=dt;if(e.britT>0)e.britT-=dt;
   if(e.burnT>0){e.burnT-=dt;this.hurt(e,e.burnD*dt,'fire',e.burnS,{quiet:1});if(!e.alive)continue;if(e.burnT<=0)e.burnD=0;}
   let v=e.spd*this.factor(e);
   if(e.d.heal){e.healT-=dt;if(e.healT<=0){e.healT=2.6;const l=[];for(const o of this.enemies)if(o.alive&&o!==e&&o.hp<o.mhp&&Math.hypot(o.x-e.x,o.z-e.z)<4.5){o.hp=Math.min(o.mhp,o.hp+o.mhp*(o.d.boss?.015:.12));l.push(o);}if(l.length)this.ev.push({k:'heal',e,l});}
    // stay with the pack: never outrun the nearest wounded ally ahead
    let lead=null,ld=6;for(const o of this.enemies)if(o.alive&&o!==e&&o.pi===e.pi&&!o.fly&&o.dist>e.dist&&o.dist-e.dist<ld){ld=o.dist-e.dist;lead=o;}if(lead&&ld<2.5)v=Math.min(v,lead.spd*this.factor(lead)+.2);}
   if(e.d.boss){e.stompT-=dt;if(e.stompT<=0){e.stompT=e.d.boss===2?9:12;const r=e.d.boss===2?7.5:5;let n=0;for(const t of this.towers)if(Math.hypot(t.x-e.x,t.z-e.z)<r){t.stunT=e.d.boss===2?2.6:1.6;n++;}this.ev.push({k:'stomp',e,r,n});}
    if(e.d.boss===2){const f=e.hp/e.mhp;if((e.phase===0&&f<.66)||(e.phase===1&&f<.33)){e.phase++;e.shield=e.mshield=e.mhp*.1;e.stunT=0;this.ev.push({k:'roar',e});
      for(let i=0;i<8;i++){const typ=i<5?'brood':'aegis';this.spawn(typ,e.pi,Math.max(0,e.dist-3-i*1.6),this.wave,this.diff===2);}}}}
   e.dist+=v*dt;const P=M.paths[e.pi];
   if(e.dist>=P.len){e.alive=false;this.gone(e);const lk=e.d.boss===2?Math.ceil(this.lives0*.6):e.d.leak;this.st.leaks++;this.st.leaked+=Math.min(lk,this.lives);this.lives-=lk;this.ev.push({k:'leak',e,lk});if(this.lives<=0){this.lives=0;this.end(-1,'lives');return;}continue;}
   M.pos(e.pi,e.dist,e.off,e);if(e.fly)e.y+=3.2+Math.sin(this.t*2+e.id)*.25;}
  if(this.enemies.length>60||this.t%2<dt)this.enemies=this.enemies.filter(e=>e.alive);
  // burning patches
  for(let i=this.patches.length-1;i>=0;i--){const p=this.patches[i];p.t-=dt;if(p.t<=0){this.patches.splice(i,1);continue;}for(const e of this.enemies)if(e.alive&&!e.fly&&Math.hypot(e.x-p.x,e.z-p.z)<p.r){e.burnT=Math.max(e.burnT,1);if(p.dps>=e.burnD){e.burnD=p.dps;e.burnS=p.src;}}}
  // towers
  for(const t of this.towers)this.tower(t,dt);
  if(this.hero)this.heroStep(dt);
  // projectiles
  for(let i=this.projs.length-1;i>=0;i--){const p=this.projs[i];p.t+=dt;
   if(p.home){const g=p.tgt;if(g.alive){p.tx=g.x;p.ty=g.y+.6;p.tz=g.z;}const dx=p.tx-p.x,dy=p.ty-p.y,dz=p.tz-p.z,l=Math.hypot(dx,dy,dz),m=p.spd*dt;
    if(l<=m||p.t>2){this.projs.splice(i,1);if(g.alive){this.hurt(g,p.dmg,p.kind,p.src,p.s);if(g.alive&&p.s.stun&&!g.d.boss)g.stunT=Math.max(g.stunT,p.s.stun);}this.ev.push({k:'hit',p,x:p.tx,y:p.ty,z:p.tz});continue;}
    p.x+=dx/l*m;p.y+=dy/l*m;p.z+=dz/l*m;continue;}
   const k=Math.min(1,p.t/p.dur);p.x=p.sx+(p.tx-p.sx)*k;p.z=p.sz+(p.tz-p.sz)*k;p.y=p.sy+(p.ty-p.sy)*k+Math.sin(k*Math.PI)*p.arc;
   if(k>=1){this.projs.splice(i,1);const s=p.s;const n=this.splash(p.tx,p.tz,s.splash,p.dmg,p.kind,p.src,s);this.ev.push({k:'boom',p,x:p.tx,y:p.ty,z:p.tz,r:s.splash,n,look:p.look});
    if(s.cluster)for(let c=0;c<s.cluster;c++){const a=c/s.cluster*6.283+Math.random(),rr=s.splash*.9;const x=p.tx+Math.cos(a)*rr,z=p.tz+Math.sin(a)*rr;this.splash(x,z,s.splash*.6,p.dmg*.5,p.kind,p.src,s);this.ev.push({k:'boom',p,x,y:p.ty,z,r:s.splash*.6,small:1,look:p.look});}
    if(s.patch)this.patches.push({x:p.tx,z:p.tz,r:s.splash*.8,t:4,dps:s.burn,src:p.src});}}
  // wave clear rewards
  for(const w in this.waveLeft)if(this.waveLeft[w]<=0&&!this.waveDone[w]&&!this.queue.some(q=>q.w==w)){this.waveDone[w]=1;this.waveEnd(+w);}
  if(this.wave>=this.waves&&!this.queue.length&&!this.enemies.some(e=>e.alive)){this.end(1,'cleared');return;}
  if(this.t>=this.len)this.end(0,'time');}
 waveEnd(w){this.st.cleared=Math.max(this.st.cleared,w);let mint=0,cap=50+w*4,rate=.05,lives=0;for(const t of this.towers)if(t.s.eco){mint+=t.s.gold;cap+=t.s.cap||0;rate+=t.s.irate||0;lives+=t.s.lives||0;}
  const bonus=100+w*12,interest=Math.min(cap,Math.floor(this.gold*rate));this.earn(bonus+interest+mint);this.st.interest+=interest;if(lives)this.lives=Math.min(this.lives0*1.5,this.lives+lives);
  this.heroXP(30+w*8);this.ev.push({k:'waveEnd',w,bonus,interest,mint,lives});}
 end(win,why){if(this.over)return;this.over={win,why,t:this.t};this.projs.length=0;}
 tower(t,dt){const s=t.s;if(s.eco)return;t.fireT-=dt;if(t.stunT>0){t.stunT-=dt;return;}if(t.buffT>0)t.buffT-=dt;t.cd-=dt*(t.buffT>0?1.5:1);if(t.cd>0)return;
  const r2=s.range,list=[];for(const e of this.enemies){if(!e.alive||(e.fly&&!s.air))continue;const d=Math.hypot(e.x-t.x,e.z-t.z);if(d>r2+e.d.r*.5||(s.min&&d<s.min))continue;list.push(e);}
  if(!list.length){t.cd=0;return;}t.cd=1/s.rate;t.fireT=.25;t.n++;const top={x:t.x,y:t.y+(t.type==='sniper'?5.2:t.type==='mortar'?1.6:3.4),z:t.z};
  if(s.proj==='pulse'){const fz=s.freeze&&t.n%3===0;for(const e of list){this.hurt(e,s.dmg,s.kind,t,s);if(!e.alive)continue;if(fz&&!e.d.boss){e.frzT=Math.max(e.frzT,s.freeze);if(s.brittle)e.britT=s.freeze+1.5;}e.slowK=Math.max(e.slowK,e.d.boss?s.slow*.5:s.slow);e.slowT=s.slowT;}
   this.ev.push({k:'pulse',t,r:s.range,fz});return;}
  const tg=this.pick(list,t.mode,t.x,t.z);t.yaw=Math.atan2(tg.x-t.x,tg.z-t.z);
  if(s.proj==='arc'){const hit=[tg];let cur=tg;while(hit.length<s.chain){let b=null,bd=3.8;for(const e of this.enemies){if(!e.alive||hit.includes(e))continue;const d=Math.hypot(e.x-cur.x,e.z-cur.z);if(d<bd){bd=d;b=e;}}if(!b)break;hit.push(b);cur=b;}
   const pts=[top,...hit.map(e=>({x:e.x,y:e.y+.7,z:e.z}))];for(const e of hit){this.hurt(e,s.dmg,s.kind,t,s);if(e.alive&&s.stun&&!e.d.boss)e.stunT=Math.max(e.stunT,s.stun);}this.ev.push({k:'arc',t,pts});return;}
  if(s.proj==='rifle'){let d=s.dmg,crit=s.crit&&Math.random()<s.crit;if(crit)d*=3;this.hurt(tg,d,s.kind,t,s);if(tg.alive&&s.stun&&!tg.d.boss)tg.stunT=Math.max(tg.stunT,s.stun);this.ev.push({k:'shot',t,look:'rifle',a:top,b:{x:tg.x,y:tg.y+.7,z:tg.z},crit});return;}
  if(s.proj==='arrow'){const sorted=list.slice().sort((a,b)=>this.rem(a)-this.rem(b));const tgs=[tg];for(const e of sorted){if(tgs.length>=s.shots)break;if(!tgs.includes(e))tgs.push(e);}while(tgs.length<s.shots)tgs.push(tg);
   for(const g of tgs)this.projs.push({look:'arrow',home:1,x:top.x,y:top.y,z:top.z,tx:g.x,ty:g.y,tz:g.z,tgt:g,spd:42,t:0,dmg:s.dmg,kind:s.kind,src:t,s});this.ev.push({k:'shot',t,look:'arrow',a:top});return;}
  // ballistic: lead the target
  const fl=s.proj==='shell'?1.1+Math.hypot(tg.x-t.x,tg.z-t.z)/28:.35+Math.hypot(tg.x-t.x,tg.z-t.z)/24;const p=this.ahead(tg,fl);
  this.projs.push({look:s.proj,x:top.x,y:top.y,z:top.z,sx:top.x,sy:top.y,sz:top.z,tx:p.x,ty:p.y,tz:p.z,t:0,dur:fl,arc:s.proj==='shell'?9:1.6,dmg:s.dmg,kind:s.kind,src:t,s});this.ev.push({k:'shot',t,look:s.proj,a:top});}
 heroStep(dt){const h=this.hero,s=h.s;for(let i=0;i<2;i++)if(h.ab[i]>0)h.ab[i]-=dt;if(h.buffT>0)h.buffT-=dt;h.atkT-=dt;
  const dx=h.tx-h.x,dz=h.tz-h.z,l=Math.hypot(dx,dz);h.moving=l>.15;if(h.moving){const m=Math.min(l,6*dt);h.x+=dx/l*m;h.z+=dz/l*m;h.yaw=Math.atan2(dx,dz);h.y=this.M.height(h.x,h.z);if(this.M.pathD(h.x,h.z)<2)h.y=Math.max(h.y,this.M.water!=null?.22:h.y);return;}
  h.cd-=dt*(h.buffT>0?1.4:1);if(h.cd>0)return;let tg=null,bd=1e9;for(const e of this.enemies){if(!e.alive||(e.fly&&!s.air))continue;const d=Math.hypot(e.x-h.x,e.z-h.z);if(d<s.range+e.d.r&&-this.rem(e)>-bd){bd=this.rem(e);tg=e;}}
  if(!tg){h.cd=0;return;}h.cd=1/s.rate;h.yaw=Math.atan2(tg.x-h.x,tg.z-h.z);h.atkT=.35;const dm=s.dmg*(h.buffT>0&&h.type==='wren'?2:1);
  if(s.cleave){let n=0;for(const e of this.enemies){if(!e.alive||e.fly||n>=s.cleave)continue;if(e===tg||Math.hypot(e.x-tg.x,e.z-tg.z)<1.7){n++;this.hurt(e,dm*(e===tg?1:.6),s.kind,h);}}this.ev.push({k:'lance',h,x:tg.x,y:tg.y,z:tg.z});}
  else{this.projs.push({look:'bolt',home:1,x:h.x,y:h.y+2.1,z:h.z,tx:tg.x,ty:tg.y,tz:tg.z,tgt:tg,spd:30,t:0,dmg:dm,kind:s.kind,src:h,s:{}});this.ev.push({k:'shot',t:null,h,look:'bolt',a:{x:h.x,y:h.y+2.1,z:h.z}});}}}
