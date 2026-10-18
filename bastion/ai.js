// BASTION LINE — the CPU side. Director: the enemy warlord that composes every wave from a budget, reads the player's
// defences (damage kinds, anti-air, splash, which road is weakest) and, from NORMAL up, counters them; HARD adds escorts,
// healers behind the heavies and elite units. Autopilot: a CPU builder used for the menu backdrop and automated tests.
import {T,E,UNLOCK,BASEW,tstats,TOWER_LIST} from './data.js';

const COST={raider:1,runner:.7,brute:2.2,harpy:1.2,aegis:2.3,mender:1.6,brood:2.4};
const GROUP={raider:[3,7,.55],runner:[4,8,.32],brute:[2,4,1],harpy:[3,6,.6],aegis:[2,3,.9],mender:[1,2,.8],brood:[1,3,1.1]};
const FLAVOR={raider:'A raiding column marches',runner:'Skirmishers sprint for the keep — slow them',brute:'Ironhides in the van — bring piercing or arcane',harpy:'Harpies on the wind — mind your anti-air',aegis:'Aegis Wardens raise their shields — arcane cracks them',mender:'Menders tend the column — kill them first',brood:'Brood Sacks waddle in — they burst when killed'};
export function dpsOf(t){const s=t.s;if(s.eco)return 0;let m=s.shots||1;if(s.chain)m=Math.min(s.chain,4);if(s.splash)m*=1.8;if(s.proj==='pulse')m*=2;return s.dmg*s.rate*m+(s.burn||0)*1.5;}
export class Director{
 constructor(S){this.S=S;}
 profile(){const S=this.S,P={tot:1,phys:0,air:0,splash:0,magic:0,slow:0,path:S.M.paths.map(()=>0)};
  for(const t of S.towers){const d=dpsOf(t);if(!d)continue;P.tot+=d;if(t.s.kind==='phys')P.phys+=d;if(t.s.kind==='magic')P.magic+=d;if(t.s.air)P.air+=d;if(t.s.splash||t.s.proj==='pulse'||t.s.chain)P.splash+=d;if(t.s.slow)P.slow++;
   S.M.paths.forEach((pp,i)=>{let c=0;for(let k=0;k<pp.n;k+=4)if(Math.hypot(pp.X[k]-t.x,pp.Z[k]-t.z)<t.s.range)c++;P.path[i]+=c*d;});}
  if(S.hero)P.tot+=S.hero.s.dmg*S.hero.s.rate;return P;}
 plan(w){const S=this.S,A=S.DF.adapt,hard=S.diff===2,P=this.profile(),np=S.M.paths.length;let intel='';const list=[];const r=Math.random;
  const wt={};for(const k in UNLOCK)if(w>=UNLOCK[k])wt[k]=BASEW[k];const why=[];
  if(w>=3&&A>0){const ps=P.phys/P.tot,as=P.air/P.tot,ss=P.splash/P.tot;
   if(ps>.45&&wt.brute){const f=(ps-.45)/.55;wt.brute*=1+3*A*f;if(wt.aegis)wt.aegis*=1+1.5*A*f;why.push([f,'Your defences lean on arrows and shot — IRONHIDES are marching']);}
   if(wt.harpy&&as<.3){const f=1-as/.3;wt.harpy*=1+2.5*A*f;why.push([f*.9,'Your skies are open — HARPY flights incoming']);}
   if(ss<.25){const f=1-ss/.25;wt.runner*=1+2*A*f;if(wt.brood)wt.brood*=1+1.5*A*f;why.push([f*.8,'Few blast towers — the warlord sends a SWARM']);}
   else if(ss>.55){wt.brute=(wt.brute||0)+1.5*A;if(wt.mender)wt.mender*=1+A;why.push([.5,'Heavy splash on the road — armour and healers lead']);}
   if(P.magic/P.tot>.5&&wt.aegis){wt.aegis*=.5;if(wt.brute)wt.brute*=1.2;}
   if(!P.slow&&wt.runner){wt.runner*=1+A;}}
  why.sort((a,b)=>b[0]-a[0]);if(why.length&&why[0][0]>.15)intel=why[0][1];
  // path choice: lean towards the road with the least firepower
  const weak=np>1?(P.path[0]<=P.path[1]?0:1):0;const pw=np>1?.5+.35*A*(Math.abs(P.path[0]-P.path[1])/(P.path[0]+P.path[1]+1)>.06?1:0):1;
  const pathOf=()=>np>1?(r()<pw?weak:1-weak):0;if(np>1&&A>0&&pw>.6&&!intel)intel='Scouts found your weaker road — the column turns';
  const final=w===S.waves,boss=final||w%10===0;let at=1.5,budget=(8+w*1.75)*(boss?.6:1)*(hard?1.1:1);
  const add=(type,n,gap,pi,elite)=>{for(let i=0;i<n;i++){list.push({type,pi,at,elite:elite||(w>=12&&hard&&r()<.15)||(w>=18&&S.diff===1&&r()<.07)});at+=gap*S.DF.spawn;}};
  if(boss&&!final){const n=Math.floor(w/10)+(hard?1:0);for(let i=0;i<n;i++){add('jugg',1,3,pathOf());if(hard&&wt.mender)add('mender',2,.8,list[list.length-1].pi);}at+=2;}
  if(final){add('colossus',1,4,np>1?weak:0);if(wt.brute)add('brute',3,1,list[0].pi);if(wt.mender)add('mender',2,.8,list[0].pi);at+=3;budget*=.8;}
  const keys=Object.keys(wt),sum=()=>keys.reduce((a,k)=>a+wt[k],0);
  while(budget>0){let x=r()*sum(),type=keys[0];for(const k of keys){x-=wt[k];if(x<=0){type=k;break;}}
   const[a,b,g]=GROUP[type];const n=Math.max(1,Math.min(Math.ceil(budget/COST[type]),a+Math.floor(r()*(b-a+1+w/8))));const pi=pathOf();add(type,n,g,pi);budget-=n*COST[type];
   if(hard&&(type==='brute'||type==='aegis')&&wt.mender&&r()<.6)add('mender',1,.8,pi);at+=1.3+r()*1.2;}
  const counts={};for(const g of list)counts[g.type]=(counts[g.type]||0)+1;
  if(!intel&&w>=3){const top=Object.entries(counts).sort((a,b)=>b[1]*COST[b[0]]-a[1]*COST[a[0]])[0];if(top)intel=FLAVOR[top[0]]||'';}if(boss&&!final)intel='A JUGGERNAUT leads the column — armour-breaking damage needed';if(final)intel='THE IRON COLOSSUS marches on the keep';
  return{w,list,counts,intel,boss:boss?(final?'colossus':'jugg'):null,dur:at};}}

// CPU builder: picks spots that cover the most road, buys a balanced mix, upgrades, and fires hero abilities.
export class Autopilot{
 constructor(S,skill=1){this.S=S;this.skill=skill;this.t=0;this.i=0;const M=S.M;const spots=[];
  for(let z=-28;z<=28;z+=1.6)for(let x=-48;x<=48;x+=1.6){if(M.canBuild(x,z,[],null))continue;let c=0,late=0;for(const P of M.paths)for(let k=0;k<P.n;k+=2){const d=Math.hypot(P.X[k]-x,P.Z[k]-z);if(d<9){c++;late+=k/P.n;}}if(c>6)spots.push({x,z,c:c+late*.3});}
  this.spots=spots.sort((a,b)=>b.c-a.c);
  this.order=['archer','cannon','archer','frost','tesla','sniper','cannon','mint','mortar','tesla','archer','frost','sniper','cannon','tesla','mortar','archer','tesla','sniper','cannon'];}
 spot(type){const S=this.S,rg=tstats(type,0,0).range||8;for(const s of this.spots){if(S.M.canBuild(s.x,s.z,S.towers,S.hero))continue;
   if(type==='mint')return s.c<this.spots[0].c*.4?s:null;if(type==='sniper'||type==='mortar'){if(s.c<this.spots[0].c*.5)return s;continue;}if(rg<7&&s.c<this.spots[0].c*.7)continue;return s;}
  return this.spots.find(s=>!S.M.canBuild(s.x,s.z,S.towers,S.hero));}
 update(dt){const S=this.S;this.t+=dt;if(S.over||this.t<.5/this.skill)return;this.t=0;
  if(!S.hero){const s=this.spots.find(s=>!S.M.canBuild(s.x,s.z,S.towers,null));if(s)S.placeHero(s.x,s.z);}
  else{for(let i=0;i<2;i++)if(S.hero.lv>=S.hero.H.ab[i].lv&&S.hero.ab[i]<=0&&S.enemies.filter(e=>e.alive).length>(i?6:3))S.ability(i);}
  // upgrade or build: alternate once a few towers stand
  const want=this.order[this.i%this.order.length];const up=S.towers.length>=4&&(this.i%3===2||S.towers.length>=14);
  if(up){let best=null,bc=1e9;for(const t of S.towers){const pp=t.type==='mint'?0:t.id%2;const p=!S.canUp(t,pp)?pp:!S.canUp(t,1-pp)?1-pp:-1;if(p<0)continue;const c=S.upCost(t,p)*(t.type==='mint'&&S.wave>S.waves*.6?3:1);if(c<bc){bc=c;best=[t,p];}}
   if(best){if(S.gold>=S.upCost(best[0],best[1])){S.upgrade(best[0],best[1]);this.i++;}return;}}
  if(S.gold>=T[want].c){const s=this.spot(want);if(s){const t=S.build(want,s.x,s.z);if(typeof t==='object'){if(want==='mortar'||want==='sniper')t.mode='strong';}}this.i++;}
  if(S.next!=null&&S.next>4&&!S.enemies.some(e=>e.alive)&&this.skill>1)S.callWave();}}
