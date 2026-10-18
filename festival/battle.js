// LANTERN STREET — turn-based battle rules with timed presses (pure logic, no rendering). The game reads this.ev (events)
// and this.ring (the active timing ring) to present it. Every action and every foe attack has one ring: the outer ring
// closes on the target over ring.dur seconds; a press within ±great of the close is GREAT, within ±good is GOOD,
// otherwise EARLY / LATE. With assist on, the ring presses itself at the close and always lands GOOD.
import {MOVES,FOES,HERO_GLOW} from './data.js';

export const RES_MUL={atk:{GREAT:1.5,GOOD:1.25,EARLY:.8,LATE:.8},def:{GREAT:0,GOOD:.5,EARLY:1,LATE:1}};
export class Battle{
 constructor(D,assist,rng=Math.random){this.D=D;this.assist=!!assist;this.rng=rng;
  this.hero={hp:D.heroHp,max:D.heroHp,glow:HERO_GLOW[0],guard:1};
  const mk=(k,i)=>{const F=FOES[k],hp=Math.round(F.hp*D.hp);return{k,i,n:F.n+(k==='puff'?' '+'AB'[i>1?1:i]:''),hp,max:hp,atk:F.atk*D.dmg,charged:false,cd:2,alive:true};};
  this.foes=[mk('puff',0),mk('bellows',1),mk('puff',2)];this.foes[2].n='PUFFKIN B';this.foes[0].n='PUFFKIN A';
  this.phase='intro';this.wait=1.4;this.next=()=>this.toMenu();this.ring=null;this.ev=[];this.queue=[];this.round=0;
  this.st={turns:0,great:0,good:0,miss:0,rings:0,dmgTaken:0,dealt:0};this.over=null;this.pending=null;}
 get alive(){return this.foes.filter(f=>f.alive);}
 can(i){const m=MOVES[i];return!!m&&this.hero.glow>=m.cost&&(m.k!=='relight'||this.hero.hp<this.hero.max);}
 toMenu(){if(this.over)return;this.phase='menu';this.round++;this.hero.guard=1;this.ev.push({e:'menu'});}
 // player picks move i (0..3) and a target index into foes (for single-target moves); returns false when not allowed
 choose(i,ti){if(this.phase!=='menu'||!this.can(i))return false;const m=MOVES[i];let tgt=null;
  if(m.tgt==='one'){tgt=this.foes[ti];if(!tgt||!tgt.alive)tgt=this.alive[0];}
  this.hero.glow-=m.cost;this.st.turns++;this.pending={m,tgt};this.ev.push({e:'use',move:m.k,n:m.n,tgt:tgt?tgt.i:-1});
  this.startRing('atk',m.k==='bash'||m.k==='sweep'?.95:.8);return true;}
 startRing(kind,dur){this.ring={kind,t:0,dur:dur*(kind==='def'?1:1),great:this.D.great,good:this.D.good,res:null};this.phase=kind==='atk'?'act':'foe';this.st.rings++;this.ev.push({e:'ring',kind});}
 press(){const r=this.ring;if(!r||r.res)return null;const d=r.t-r.dur;let res;
  if(Math.abs(d)<=r.great)res='GREAT';else if(Math.abs(d)<=r.good)res='GOOD';else if(d<0)res='EARLY';else res='LATE';
  if(this.assist)res='GOOD';return this.resolve(res);}
 resolve(res){const r=this.ring;r.res=res;if(res==='GREAT')this.st.great++;else if(res==='GOOD')this.st.good++;else this.st.miss++;this.ev.push({e:'timing',kind:r.kind,res});
  if(r.kind==='atk')this.applyHero(res);else this.applyFoe(res);return res;}
 applyHero(res){const{m,tgt}=this.pending,H=this.hero,mul=RES_MUL.atk[res];
  if(m.k==='bash'||m.k==='sweep'){const list=m.k==='bash'?[tgt]:this.alive;for(const f of list){const amt=Math.max(1,Math.round(m.pow*mul*(.92+this.rng()*.16)));f.hp=Math.max(0,f.hp-amt);this.st.dealt+=amt;
    if(f.charged&&res==='GREAT'&&m.k==='bash'){f.charged=false;this.ev.push({e:'msg',s:f.n+' LOST ITS BREATH!'});}
    this.ev.push({e:'hit',i:f.i,amt,res});if(f.hp<=0){f.alive=false;this.ev.push({e:'faint',i:f.i,s:f.n+' DRIFTS AWAY!'});}}
   if(res==='GREAT'){H.glow=Math.min(HERO_GLOW[1],H.glow+1);this.ev.push({e:'glow',amt:1});}}
  else if(m.k==='wall'){H.guard=res==='GREAT'?.15:res==='GOOD'?.3:.5;const g=res==='GREAT'?3:2;H.glow=Math.min(HERO_GLOW[1],H.glow+g);this.ev.push({e:'guard',res,g});}
  else if(m.k==='relight'){const amt=Math.min(H.max-H.hp,m.heal+(res==='GREAT'?6:res==='GOOD'?3:0));H.hp+=amt;this.ev.push({e:'heal',amt,res});}
  this.pending=null;this.after(.8,()=>this.foePhase());}
 foePhase(){if(!this.alive.length){this.win();return;}this.queue=this.alive.slice();this.nextFoe();}
 nextFoe(){if(this.over)return;const f=this.queue.shift();if(!f){this.hero.glow=Math.min(HERO_GLOW[1],this.hero.glow+1);this.toMenu();return;}if(!f.alive){this.nextFoe();return;}
  if(f.k==='bellows'){if(f.charged){f.charged=false;this.atk={f,move:'BIG HUFF',mul:2.3};}
   else if(--f.cd<=0){f.cd=3;f.charged=true;this.ev.push({e:'inhale',i:f.i,s:'OLD BELLOWS IS INHALING... BRACE OR BASH IT!'});this.after(1.1,()=>this.nextFoe());return;}
   else this.atk={f,move:'GUST',mul:1};}
  else{const pp=this.rng()<.3;this.atk={f,move:pp?'PUFF-PUFF':'SNUFF',mul:pp?.75:1,drain:pp};}
  this.ev.push({e:'fatk',i:f.i,move:this.atk.move,s:f.n+' USES '+this.atk.move+'!'});this.phase='windup';this.after(.5,()=>this.startRing('def',this.atk.move==='BIG HUFF'?1.15:.9));}
 applyFoe(res){const{f,mul,drain}=this.atk,H=this.hero;let amt=Math.round(f.atk*mul*RES_MUL.def[res]*H.guard*(.9+this.rng()*.2));if(res!=='GREAT')amt=Math.max(1,amt);
  if(res==='GREAT'){H.glow=Math.min(HERO_GLOW[1],H.glow+1);this.ev.push({e:'block',i:f.i,res,s:'PERFECT BLOCK!'});}
  else{H.hp=Math.max(0,H.hp-amt);this.st.dmgTaken+=amt;this.ev.push({e:'hurt',i:f.i,amt,res});if(drain&&H.glow>0){H.glow--;this.ev.push({e:'msg',s:'THE PUFF STOLE 1 GLOW!'});}}
  this.atk=null;if(H.hp<=0){this.after(.7,()=>this.lose());return;}this.after(.7,()=>this.nextFoe());}
 after(t,fn){this.phase=this.phase==='act'||this.phase==='foe'?'resolve':this.phase;this.wait=t;this.next=fn;}
 win(){this.over='win';this.phase='end';this.ring=null;this.ev.push({e:'win'});}
 lose(){this.over='lose';this.phase='end';this.ring=null;this.ev.push({e:'lose'});}
 // grade from timing accuracy, damage taken, rounds and retries
 grade(tries=1){const s=this.st,acc=(s.great+s.good*.6)/Math.max(1,s.rings),hurt=Math.min(1,s.dmgTaken/this.hero.max),par=5;
  const sc=acc*50+(1-hurt)*30+Math.max(0,20-Math.max(0,s.turns-par)*4)-(tries-1)*15;return{sc:Math.round(sc),g:sc>=85?'S':sc>=70?'A':sc>=50?'B':'C',acc};}
 step(dt){const r=this.ring;
  if(r&&!r.res){r.t+=dt;if(this.assist&&r.t>=r.dur)this.resolve('GOOD');else if(r.t>r.dur+r.good)this.resolve('LATE');}
  if(this.wait>0){this.wait-=dt;if(this.wait<=0){this.wait=0;if(this.ring&&this.ring.res)this.ring=null;const f=this.next;this.next=null;if(f)f();}}}
}
