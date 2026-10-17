// TEMPEST FIST — CPU opponents. They press the same inputs a player would (direction + moves by name), with a reaction delay,
// a read on high/low, punishes, anti-airs, throw breaks and combo plans whose length grows with the difficulty.
import {blankIn} from './sim.js';
export const LV={
 easy:{react:28,block:.22,read:.45,combo:1,aggro:.38,punish:.15,tb:.1,aa:.12,ss:.03,wait:[28,64],sup:.15,jug:1},
 normal:{react:16,block:.55,read:.76,combo:3,aggro:.6,punish:.55,tb:.38,aa:.42,ss:.09,wait:[12,34],sup:.5,jug:3},
 hard:{react:9,block:.86,read:.94,combo:6,aggro:.74,punish:.9,tb:.72,aa:.82,ss:.16,wait:[4,16],sup:.85,jug:5},
};
const rnd=Math.random,pick=a=>a[rnd()*a.length|0];
function nextLv(o){const m=o.move;if(!m)return 'm';const h=m.h.find(h=>o.mt<=h.e);return h?h.lv:'m';}
function reach(o){const m=o.move;if(!m)return 1.2;if(m.beam)return m.beam.len;if(m.proj)return 9;let r=0;for(const h of m.h)r=Math.max(r,h.fw+h.r+.4);if(m.mv)r+=m.mv[2];if(m.grab)r=Math.max(r,m.grab.range+.2);return r;}
export function think(f,w,mode){const I=blankIn(),o=f.opp,L=LV[f.lvl]||LV.normal,A=f.ai||(f.ai={wait:20,plan:[],guard:null,seen:null,brk:null,hold:0,hx:0,hy:0,ssT:0,last:null}),D=f.def.ai||{};
 const dx=o.x-f.x,dz=o.z-f.z,dist=Math.hypot(dx,dz),fr=w.frame;
 // training dummy modes
 if(mode==='stand')return I;if(mode==='crouch'){I.y=-1;return I;}
 if(mode==='jump'){if(w.free(f))I.y=1;return I;}
 if(mode==='block'){if(o.st==='atk'||w.proj.length){const lv=nextLv(o);I.x=-1;I.y=lv==='l'?-1:0;}return I;}
 // throw break
 if(f.st==='thrown'){if(A.brk===null){A.brk=rnd()<L.tb?Math.max(2,(L.react*.6)|0):-1;}if(A.brk>0&&f.t===A.brk){I.Tp=true;I.T=true;}return I;}else A.brk=null;
 const free=w.free(f),c=w.cancel(f),air=f.st==='jump';
 // combo plans: feed the next string link / cancel while the current move runs
 if(f.st==='atk'&&A.plan.length){if(f.mname===A.plan[0])A.plan.shift();let nx=A.plan[0];
  if(nx&&nx[0]==='?'){if(f.connected===1)nx=nx.slice(1);else{A.plan.length=0;nx=null;}}
  if(nx){I.want=nx;if(nx==='sup'&&f.meter<100)A.plan.length=0;}}
 // guard against the incoming strike (decided once per enemy move, after the reaction delay)
 const threat=(o.st==='atk'&&o.move&&o.mt<=o.move.last&&dist<reach(o)+.6)||w.proj.some(p=>p.o===o&&Math.hypot(p.x-f.x,p.z-f.z)<3.2);
 if(threat){const key=o.st==='atk'?o.move.n+':'+(fr-o.mt):'proj'+w.proj.length;
  if(A.seen!==key&&(o.st!=='atk'||o.mt>=Math.min(L.react,(o.move.first||8)-2))){A.seen=key;const lv=o.st==='atk'?nextLv(o):(w.proj.find(p=>p.o===o)||{p:{lv:'m'}}).p.lv;
   const r=rnd();if(r<L.block){A.guard={lv:rnd()<L.read?lv:pick(['h','m','l']),until:fr+30};
    if(o.st==='atk'&&!o.move.home&&!o.move.beam&&rnd()<L.ss*2&&free){I.SSp=I.SS=true;I.ss=rnd()<.5?1:-1;A.guard=null;}}
   else A.guard=null;}}
 else if(A.guard&&fr>A.guard.until-20)A.guard=null;
 if(A.guard&&(free||f.st==='block')&&!(f.st==='atk')){I.x=-1;I.y=A.guard.lv==='l'?-1:0;if(A.guard.lv==='h'&&L.read>.7&&rnd()<.3)I.y=-1;return I;}
 if(!free&&!air)return I;
 // anti-air
 if(o.st==='jump'&&dist<2.8&&free&&o.vy<.1&&rnd()<L.aa*.25){const aa=f.def.sp.find(s=>s.s==='d');I.want=aa&&f.moves[aa.name].h.some(h=>h.launch)?aa.name:'3H';A.plan=[];return I;}
 // juggle the airborne opponent
 if((o.st==='air'||o.st==='wall')&&free&&o.combo>0){const j=o.combo;
  if(dist>1.25){I.x=1;if(dist>1.9)I.dash=1;return I;}
  if(o.combo>L.jug+1||o.y<.15&&o.st==='air'&&o.vy<0){return I;}
  if(f.meter>=100&&rnd()<L.sup*.5&&f.lvl!=='easy'){I.want='sup';return I;}
  const end=f.def.sp.find(s=>f.moves[s.name].h.some(h=>h.kd||h.launch));
  if(j>=L.jug&&end&&rnd()<.6){I.want=end.name;return I;}
  I.want=pick(['P','P','K',o.y>.6?'P':'2P']);if(I.want==='P'&&L.combo>2)A.plan=['P','PP','PPP'].slice(1,1+Math.min(2,L.combo-1));return I;}
 // punish a whiffed or blocked move, or a broken throw
 const rec=o.st==='atk'&&o.move&&o.mt>o.move.last?o.move.f-o.mt:o.st==='land'?o.lag-o.t:o.st==='stagger'?o.stun:0;
 if(rec>8&&dist<1.5&&free&&A.pun!==o.mname+fr/60|0){A.pun=o.mname+fr/60|0;if(rnd()<L.punish){
  if(rec>16&&f.lvl!=='easy'){I.want='3H';A.plan=['3H'];return I;}I.want='P';A.plan=['P','PP',L.combo>2?'PPP':'PP'];return I;}}
 // walk into range for the attack already chosen
 if(A.pend){const m=f.moves[A.pend[0]],r=m?mreach(m):1;if(!m||A.pendT--<=0||o.st==='down'){A.pend=null;}
  else if(dist>r){I.x=1;if(dist>r+1.2)I.dash=1;return I;}else{A.plan=A.pend;A.pend=null;I.want=A.plan[0];return I;}}
 // neutral game
 if(A.wait>0){A.wait--;
  const want=D.range||1.2;
  if(o.st==='down'||o.st==='getup'){I.x=dist>1.6?1:0;return I;}
  if(A.hold>0){A.hold--;I.x=A.hx;I.y=A.hy;return I;}
  const r=rnd();
  if(dist>want+.5){I.x=1;if(dist>3.5&&r<.04)I.dash=1;}
  else if(dist<want-.6){I.x=-1;if(r<.03)I.dash=-1;}
  else if(r<.05){A.hold=12+rnd()*20|0;A.hx=pick([0,0,-1,1]);A.hy=rnd()<.2?-1:0;}
  if(r>.985&&rnd()<L.ss*3){I.SS=I.SSp=true;I.ss=rnd()<.5?1:-1;}
  return I;}
 A.wait=(L.wait[0]+rnd()*(L.wait[1]-L.wait[0]))*(1.3-(D.aggro||.6)*.6)|0;
 if(o.st==='down'||o.st==='getup')return I;
 const proj=D.proj,sp=f.def.sp;
 if(f.meter>=100&&dist<1.5&&rnd()<L.sup*.18){I.want='sup';return I;}
 if(proj&&dist>2.3&&rnd()<.55){I.want=pick(proj);return I;}
 if(dist>(D.range||1.2)+.9){if(rnd()<.35){I.dash=1;return I;}const rush=sp.find(s=>{const m=f.moves[s.name];return m.mv&&m.mv[2]>1.5;});if(rush&&rnd()<.22&&dist<3.4){I.want=rush.name;return I;}A.hold=10;A.hx=1;A.hy=0;return I;}
 if(rnd()>L.aggro){if(rnd()<.4){A.hold=18;A.hx=-1;A.hy=rnd()<.4?-1:0;}else if(rnd()<.3){I.dash=-1;}return I;}
 const close=dist<1.15,opts=[];
 const add=(w,plan)=>opts.push([w,plan]);
 add(2,['P','PP',L.combo>1?'PPP':'PP',L.combo>3?'?'+pick(sp).name:null]);add(1.4,['K','KK',L.combo>1?'KKK':'KK']);add(1,['2K']);add(.8,['2P','?P']);add(.7,['6P',L.combo>2?'?'+sp[0].name:null]);
 add(.6,['2H']);add(.5,['6K']);add(.45,['3H']);add(.4,['4H']);add(.35,['4K']);
 if(close){add(1.1,['T']);if(D.grab)add(1.2,[D.grab]);}
 for(const s of sp)if(!f.moves[s.name].parry)add(.45,[s.name]);else if(o.st==='atk'||rnd()<.3)add(.6,[s.name]);
 if(dist>1.5&&f.moves['6K'])add(1,['6K']);
 let tot=0;for(const o of opts)tot+=o[0];let r=rnd()*tot,ch=opts[0];for(const o of opts){r-=o[0];if(r<=0){ch=o;break;}}
 const plan=ch[1].filter(Boolean),m=f.moves[plan[0]];if(m&&dist>mreach(m)&&!m.proj){A.pend=plan;A.pendT=50;A.wait=0;return I;}
 A.plan=plan;I.want=plan[0];return I;}
function mreach(m){if(m.proj||m.beam)return 9;if(m.grab)return m.grab.range*.95;let r=0;for(const h of m.h)r=Math.max(r,h.fw+h.r+.15);if(m.mv)r+=m.mv[2]*.8;if(m.tp)r=9;return r||1;}
