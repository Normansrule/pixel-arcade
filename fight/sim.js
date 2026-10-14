// TEMPEST FIST — fight simulation. Fixed 60 Hz frames, two fighters on a walled round floor in full 3D (x/z plane, y up).
// Inputs are relative: x +1 = toward the opponent, y +1 = up; buttons P K H (attacks), T throw, S special, U super, SS sidestep.
// Linear attacks lock their facing at startup, so a sidestep really steps off the line; homing ones (home:1) re-aim.
export const G=.0105;
const BTN=['P','K','H','T','S','U','SS'];
const dirOf=(x,y)=>y>0?(x>0?9:x<0?7:8):y<0?(x>0?3:x<0?1:2):(x>0?6:x<0?4:5);
export function blankIn(){const I={x:0,y:0,ss:1,want:null};for(const b of BTN){I[b]=false;I[b+'p']=false;}return I;}

/* ---------- move preparation: defaults for every hit window ---------- */
export function prepMove(m,H){const sc=H/1.8;if(m._p)return m;m._p=1;
 if(!m.h)m.h=m.s!=null&&m.d!=null?[{s:m.s,e:m.s+(m.a||2)-1,d:m.d,lv:m.lv,hb:m.hb,launch:m.launch,kd:m.kd,push:m.push,hs:m.hs,bs:m.bs,jv:m.jv}]:[];
 let prev=m.hb||[.7,1.2,.3];
 for(const h of m.h){if(!h.hb)h.hb=prev;prev=h.hb;h.e=h.e??h.s+2;h.hs=h.hs??Math.round(11+h.d*.14);h.bs=h.bs??Math.round(7+h.d*.07);h.push=h.push??(.04+h.d*.0006);h.lv=h.lv||'m';
  h.fw=h.hb[0]*sc;h.y=h.hb[1]*sc;h.r=h.hb[2]*Math.max(1,sc*.95);}
 if(m.grab){m.s=m.s??10;m.ge=m.s+(m.a??3)-1;}
 m.first=m.h.length?m.h[0].s:m.grab?m.s:m.proj?m.proj.at:m.tp?m.tp.at:8;
 m.last=m.h.length?Math.max(...m.h.map(h=>h.e)):m.grab?m.ge:m.first+2;
 m.f=m.f??(m.last+(m.r??16));
 return m;}

/* ---------- motion inputs over the direction history (numpad notation, relative to facing) ---------- */
function seqIn(h,seq,win,fresh=6){let i=seq.length-1;const n=h.length;for(let k=n-1;k>=Math.max(0,n-win);k--){if(h[k]===seq[i]){if(i===seq.length-1&&n-1-k>fresh)return false;i--;if(i<0)return true;}}return false;}
export function motion(h,m){switch(m){
 case 'qcf':return seqIn(h,[2,3,6],16)||seqIn(h,[2,6],10);
 case 'qcb':return seqIn(h,[2,1,4],16)||seqIn(h,[2,4],10);
 case 'dp':return seqIn(h,[6,2,3],18)||seqIn(h,[6,3,2,3],18);
 case 'hcf':return seqIn(h,[4,2,6],24)||seqIn(h,[4,1,2,3,6],26);
 case 'qcf2':return seqIn(h,[2,6,2,6],30)||seqIn(h,[2,3,6,2,3,6],32);}
 return false;}

/* ---------- fighter ---------- */
export class Fighter{
 constructor(def,side,o={}){this.def=def;this.side=side;this.H=def.H;this.human=o.human??-1;this.lvl=o.lvl||'normal';this.maxHp=Math.round(def.hp*(o.hpMul||1));this.dmgMul=o.dmgMul||1;
  this.moves={};for(const k in def.moves)this.moves[k]=prepMove(def.moves[k],def.H);for(const s of def.sp)this.moves[s.name].isSp=1;this.moves.sup.isSp=1;
  this.wins=0;this.meter=o.meter||0;this.stats={dealt:0,taken:0,hits:0,blocks:0,maxCombo:0,throws:0,breaks:0,supers:0,counters:0,parries:0};this.reset(0,0,1,0);}
 reset(x,z,fx,fz){Object.assign(this,{x,z,y:0,vy:0,kx:0,kz:0,jx:0,jz:0,fx,fz,st:'idle',t:0,move:null,mname:'',mt:0,done:0,connected:0,cwEnd:0,locked:null,lockBy:null,
  stun:0,hitLv:'m',crouchB:false,combo:0,cdmg:0,jug:0,wallUsed:0,airAtk:0,lag:0,ko:false,hp:this.maxHp,inp:blankIn(),hist:[],buf:{},thr:null,flash:0,ssDir:1,counterT:0,lastHit:null,hitFlash:0,dashDir:0});
  for(const b of BTN)this.buf[b]=0;}
 get rage(){return this.hp>0&&this.hp<this.maxHp*.3;}
 inWin(w){return this.st==='atk'&&w&&this.mt>=w[0]&&this.mt<=w[1];}
}

/* ---------- world ---------- */
export class Fight{
 constructor(a,b,o={}){this.f=[a,b];a.opp=b;b.opp=a;this.proj=[];this.frame=0;this.stop=0;this.freeze=0;this.freezer=null;this.R=o.radius||7;this.ev=o.ev||(()=>{});this.training=!!o.training;this.pid=0;this.active=true;}
 place(sep=2.6){const[a,b]=this.f;a.reset(-sep/2,0,1,0);b.reset(sep/2,0,-1,0);this.proj.length=0;this.stop=this.freeze=0;}
 dist(){const[a,b]=this.f;return Math.hypot(b.x-a.x,b.z-a.z);}
 step(){this.frame++;
  for(const f of this.f)this.input(f,this.stop>0||this.freeze>0);
  if(this.freeze>0){this.freeze--;return;}
  if(this.stop>0){this.stop--;for(const f of this.f)if(f.flash>0)f.flash--;return;}
  if(!this.active){for(const f of this.f)this.phys(f);return;}
  for(const f of this.f)this.decide(f);
  for(const f of this.f)this.phys(f);
  this.resolve();this.projStep();this.separate();
  for(const f of this.f){if(this.free(f))this.face(f);if(f.flash>0)f.flash--;if(f.counterT>0)f.counterT--;
   const o=f.opp;if(f.combo>0&&(this.free(f)||f.st==='down'||f.st==='getup'||f.st==='block')){this.ev('comboEnd',f,o,f.combo,f.cdmg);if(this.training&&!f.ko&&f.human<0){f.hp=f.maxHp;}f.combo=0;f.cdmg=0;f.jug=0;f.wallUsed=0;}}
  if(this.training)for(const f of this.f){if(f.combo===0&&this.free(f))f.hp=Math.min(f.maxHp,f.hp+f.maxHp*.02);}
 }
 /* ---- input: direction history, buffered presses (6 frames), held buttons repeat once free ---- */
 input(f,paused){const I=f.inp;for(const b of BTN){if(I[b+'p'])f.buf[b]=6;else if(!paused&&f.buf[b]>0)f.buf[b]--;}
  if(paused)return;if(I.dash){f.dashDir=I.dash;I.dash=0;}else f.dashDir=0;const d=dirOf(I.x,I.y);f.hist.push(d);if(f.hist.length>36)f.hist.shift();
  const n=f.hist.length;if(n>2&&(d===6||d===4)&&f.hist[n-2]!==d){for(let k=n-2;k>=Math.max(0,n-12);k--){if(f.hist[k]===d&&k<n-2){f.dashDir=d===6?1:-1;break;}if(f.hist[k]!==5&&f.hist[k]!==d)break;}}
  if(this.free(f)&&f.st!=='atk')for(const b of['P','K','H','T','S','U','SS'])if(I[b]&&!f.buf[b]&&b!=='SS')f.buf[b]=1;}
 free(f){switch(f.st){case 'idle':case 'walk':case 'crouch':return true;case 'dash':return f.t>=6;case 'bdash':return f.t>=15;case 'ss':return f.t>=10;case 'land':return f.t>=f.lag;}return false;}
 grounded(f){return f.y<=.001&&f.vy<=0;}
 face(f){const o=f.opp,dx=o.x-f.x,dz=o.z-f.z,l=Math.hypot(dx,dz);if(l>.05){f.fx=dx/l;f.fz=dz/l;}}
 canGo(f,name){const m=f.moves[name];if(!m)return false;
  if(m.sup&&f.meter<100)return false;if(m.proj&&this.proj.some(p=>p.o===f))return false;
  if(m.air)return f.st==='jump'&&!f.airAtk;if(f.st==='jump'||f.y>.01)return false;return true;}
 go(f,name){if(!this.canGo(f,name))return false;this.start(f,name);return true;}
 start(f,name){const m=f.moves[name];this.face(f);f.move=m;f.mname=name;f.mt=0;f.st='atk';f.t=0;f.done=0;f.connected=0;f.locked=null;f.cwEnd=0;
  if(m.air)f.airAtk=1;
  if(m.sup){f.meter-=100;this.freeze=42;this.freezer=f;f.stats.supers++;this.ev('super',f,m);}
  this.ev('move',f,m,name);}
 /* cancel windows: strings chain from their active frames on whiff, block or hit; specials cancel sc normals once they connect */
 cancel(f){if(f.st!=='atk')return 0;const m=f.move;let c=0;if(m.chain&&f.mt>=m.first&&f.mt<=m.last+13)c|=1;if((m.sc||m.chain)&&f.connected&&f.mt<=f.cwEnd)c|=2;if(f.connected&&!m.sup&&!m.chain&&!m.sc&&f.def.sp.some(s=>s.name===f.mname)&&f.mt<=f.cwEnd)c|=4;return c;}
 decide(f){const free=this.free(f),c=this.cancel(f);const air=f.st==='jump';if(!free&&!c&&!air)return;
  const I=f.inp,b=f.buf,d=f.hist[f.hist.length-1]||5,g=!air&&f.y<=.001;
  const use=(k,name)=>{if(this.go(f,name)){if(k)b[k]=0;return true;}return false;};
  if(I.want){const w=I.want;I.want=null;const m=f.moves[w];if(m){const ok=free&&!air?!m.air:air?m.air:(c&1&&Object.values(f.move.chain||{}).includes(w))||(c&2&&(f.def.sp.some(s=>s.name===w)||m.sup))||(c&4&&m.sup);if(ok&&use(null,w))return;}}
  if(g&&(free||c&6)){
   if(f.meter>=100&&(b.U||(b.H&&motion(f.hist,'qcf2')))){if(use(b.U?'U':'H','sup'))return;}
   if(free||c&2){if(b.S){const cls=d===6||d===9?'f':d===4||d===7?'b':d<=3?'d':'n';const sp=f.def.sp.find(s=>s.s===cls)||f.def.sp[0];if(use('S',sp.name))return;}
    for(const m of['hcf','dp','qcf','qcb'])for(const sp of f.def.sp)if(sp.m===m&&b[sp.b]&&motion(f.hist,m)){if(use(sp.b,sp.name))return;}}}
  if(c&1&&!free){const m=f.move;for(const k in m.chain)if(b[k]||I[k]){if(use(k,m.chain[k]))return;}return;}
  if(!free&&!air)return;
  if(air){for(const k of['H','K','P'])if(b[k]&&use(k,'j'+k))return;return;}
  if(b.T||(b.P&&b.K)){if(use(b.T?'T':'P',f.moves.T?'T':'P')){b.K=0;return;}}
  const cls=d===3?'3':d<=2?'2':d===6||d===9?'6':d===4||d===7?'4':'';
  for(const k of['H','K','P'])if(b[k]){const nm=f.moves[cls+k]?cls+k:cls==='3'&&f.moves['2'+k]?'2'+k:k;if(use(k,nm))return;}
  // movement
  if(b.SS){b.SS=0;f.st='ss';f.t=0;f.ssDir=I.ss||1;this.ev('ss',f);return;}
  if(f.dashDir>0&&f.st!=='dash'){f.st='dash';f.t=0;this.ev('dash',f);return;}
  if(f.dashDir<0&&f.st!=='bdash'){f.st='bdash';f.t=0;this.ev('dash',f);return;}
  if((f.st==='dash'||f.st==='bdash'||f.st==='ss')&&!I.y&&(f.st==='dash'?I.x>=0:f.st==='bdash'?I.x<=0:true))return;
  if(I.y>0){f.st='jsq';f.t=0;f.jdir=I.x;return;}
  if(I.y<0){if(f.st!=='crouch'){f.st='crouch';f.t=0;}return;}
  if(I.x){if(f.st!=='walk'){f.st='walk';f.t=0;}return;}
  if(f.st!=='idle'){f.st='idle';f.t=0;}}
 /* ---- per-state physics ---- */
 phys(f){const I=f.inp,def=f.def;f.t++;
  switch(f.st){
   case 'walk':{const s=I.x>0?def.walk:-def.back;f.x+=f.fx*s;f.z+=f.fz*s;if(!I.x&&this.active){f.st='idle';f.t=0;}break;}
   case 'crouch':if(I.y>=0&&this.active){f.st='idle';f.t=0;}break;
   case 'jsq':if(f.t>=4){f.st='jump';f.t=0;f.vy=def.jump;f.airAtk=0;const s=f.jdir>0?.05:f.jdir<0?-.04:0;f.jx=f.fx*s;f.jz=f.fz*s;this.ev('jump',f);}break;
   case 'jump':this.fall(f,1);break;
   case 'land':if(f.t>=f.lag){f.st='idle';f.t=0;}break;
   case 'dash':{const s=def.dash*Math.max(0,1-f.t/18);f.x+=f.fx*s;f.z+=f.fz*s;if(f.t>=16){f.st='idle';f.t=0;}break;}
   case 'bdash':{const s=-def.dash*.9*Math.max(0,1-f.t/20);f.x+=f.fx*s;f.z+=f.fz*s;if(f.t>=18){f.st='idle';f.t=0;}break;}
   case 'ss':{const s=.068*Math.max(0,1-f.t/18)*f.ssDir;f.x+=f.fz*s;f.z-=f.fx*s;if(f.t>=17){f.st='idle';f.t=0;}break;}
   case 'atk':this.atk(f);break;
   case 'hit':case 'block':case 'stagger':this.slide(f);if(--f.stun<=0){f.st=f.crouchB&&I.y<0?'crouch':'idle';f.t=0;}break;
   case 'air':case 'kd':this.slide(f,.97);this.fall(f,1+f.jug*.07*(def.weight||1));break;
   case 'wall':f.kx=f.kz=0;if(f.y>0){f.y=Math.max(0,f.y-.02);}if(--f.stun<=0){f.st='down';f.t=0;f.y=0;this.ev('land',f,.5);}break;
   case 'down':this.slide(f,.8);if(f.t>=38&&!f.ko&&this.active){f.st='getup';f.t=0;}break;
   case 'getup':if(f.t>=20){f.st='idle';f.t=0;}break;
   case 'throw':this.throwStep(f);break;
   case 'thrown':case 'sup':break;
  }}
 slide(f,k=.86){f.x+=f.kx;f.z+=f.kz;f.kx*=k;f.kz*=k;}
 fall(f,gm){f.vy-=G*gm;f.y+=f.vy;if(f.st==='jump'){f.x+=f.jx;f.z+=f.jz;}
  if(f.y<=0&&f.vy<0){f.y=0;const v=f.vy;f.vy=0;
   if(f.st==='jump'){f.st='land';f.t=0;f.lag=4;this.ev('land',f,v);}
   else if(f.st==='air'||f.st==='kd'){f.st='down';f.t=0;f.kx*=.5;f.kz*=.5;this.ev('land',f,v,true);}}}
 atk(f){const m=f.move;f.mt++;
  if(m.home&&f.mt<m.first-2)this.face(f);
  if(m.mv&&f.mt>=m.mv[0]&&f.mt<=m.mv[1]){const s=m.mv[2]/(m.mv[1]-m.mv[0]+1)*(f.locked?.3:1);const d=this.dist();if(!(d<.75&&!f.locked)){f.x+=f.fx*s;f.z+=f.fz*s;}}
  if(m.jump&&f.mt===m.jump.at){f.vy=m.jump.vy;f.jx=f.fx*(m.jump.fwd||0);f.jz=f.fz*(m.jump.fwd||0);}
  if(f.y>0||f.vy>0){f.vy-=G;f.y+=f.vy;f.x+=f.jx;f.z+=f.jz;
   if(f.y<=0&&f.vy<0){f.y=0;f.vy=0;if(m.quake)this.ev('quake',f);if(m.air||m.jump){if(m.air||f.mt>=m.last){this.end(f,m.air?6:Math.max(8,m.f-f.mt));return;}}}}
  if(m.quakeAt&&f.mt===m.quakeAt)this.ev('quake',f);
  if(m.tp&&f.mt===m.tp.at)this.teleport(f,m.tp.kind);
  if(m.flick&&m.flick.includes(f.mt)&&f.locked)this.ev('flick',f);
  if(m.proj&&f.mt===m.proj.at)this.spawn(f,m.proj);
  if(f.mt>=m.f){if(f.y>0){f.st='jump';f.t=0;f.airAtk=1;f.move=null;}else this.end(f,0);}}
 end(f,lag){const was=f.move;f.move=null;f.mname='';if(f.locked){const d=f.locked;if(d.st==='sup'){d.st='kd';d.vy=.12;d.kx=f.fx*.06;d.kz=f.fz*.06;}f.locked=null;}
  if(lag){f.st='land';f.t=0;f.lag=lag;}else{f.st=was&&was.crouch&&f.inp.y<0?'crouch':'idle';f.t=0;}}
 teleport(f,kind){const o=f.opp;let dx=f.x-o.x,dz=f.z-o.z,l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  if(kind==='behind'){f.x=o.x-dx*1.0;f.z=o.z-dz*1.0;}else{f.x=o.x+dx*Math.min(4.8,l+2.6);f.z=o.z+dz*Math.min(4.8,l+2.6);}
  this.clamp(f);this.face(f);this.ev('tp',f);}
 spawn(f,p){const sc=f.H/1.8;this.proj.push({id:++this.pid,o:f,x:f.x+f.fx*.6,z:f.z+f.fz*.6,y:f.y+p.y*(p.kind==='quake'||p.lv==='l'?1:sc),vx:f.fx*p.spd,vz:f.fz*p.spd,life:p.life,t:0,r:p.r,p,kind:p.kind});this.ev('proj',f,p);}
 /* ---- hurtbox: vertical capsule shaped by stance ---- */
 hurt(d){let y0=d.y,top=d.H;const s=d.st,m=d.move;
  if(s==='down'||s==='getup'||s==='thrown'||(s==='throw'))return null;
  if(s==='crouch'||(s==='atk'&&m.crouch)||((s==='block'||s==='hit')&&d.crouchB)||(s==='jsq'))top=d.H*.6;
  if(s==='atk'&&d.inWin(m.low))top=d.H*.48;
  if(s==='atk'&&(d.inWin(m.airb)||(m.hand&&d.inWin(m.hand))))y0+=.5;
  if(s==='air'||s==='kd'){y0=d.y+.05;top=1.15;}
  else if(s==='jump'||(s==='atk'&&d.y>.05)){y0=d.y+.25;top=d.H*.72;}
  return[y0,y0+top];}
 inv(d){if(d.st==='atk'&&d.inWin(d.move.inv))return true;return d.st==='down'||d.st==='getup';}
 hitTest(a,h,d){const hb=this.hurt(d);if(!hb)return false;const cx=a.x+a.fx*h.fw,cz=a.z+a.fz*h.fw,cy=a.y+h.y;
  const lo=hb[0]+.25,hi=Math.max(lo,hb[1]-.25),vy=cy<lo?lo-cy:cy>hi?cy-hi:0;return Math.hypot(d.x-cx,d.z-cz,vy)<h.r+.3;}
 beamTest(a,bm,d){const hb=this.hurt(d);if(!hb)return false;const dx=d.x-a.x,dz=d.z-a.z,along=dx*a.fx+dz*a.fz,lat=Math.abs(-dx*a.fz+dz*a.fx);const cy=a.y+bm.y*a.H/1.8;
  return along>0&&along<bm.len&&lat<bm.w+.3&&cy>hb[0]-.3&&cy<hb[1]+.3;}
 blocking(d,lv){if(d.ko)return false;const ok=d.st==='idle'||d.st==='walk'||d.st==='crouch'||d.st==='block'||(d.st==='land'&&d.lag<8);if(!ok)return false;
  if(d.inp.x>=0)return false;const low=d.inp.y<0;return lv==='l'?low:lv==='h'?true:!low;}
 /* ---- collect every connecting hit this frame, then apply them together (trades happen) ---- */
 resolve(){const hits=[];
  for(const a of this.f){if(a.st!=='atk'||!a.move)continue;const m=a.move,d=a.opp;
   if(m.grab){if(a.mt>=m.s&&a.mt<=m.ge&&!a.done)if(this.grabTest(a,d))hits.push({a,d,grab:1});continue;}
   m.h.forEach((h,i)=>{if(a.done&(1<<i)||a.mt<h.s||a.mt>h.e)return;
    if(a.locked){if(a.mt===h.s)hits.push({a,d,h,i,m,auto:1});return;}
    if(i>0&&m.lock&&!a.connected)return;
    if(this.inv(d))return;const ok=m.beam?this.beamTest(a,m.beam,d):this.hitTest(a,h,d);if(ok)hits.push({a,d,h,i,m});});}
  if(hits.length===2&&hits[0].grab&&hits[1].grab){const[a,b]=this.f;this.breakThrow(a,b);return;}
  for(const x of hits)if(x.grab)this.grabStart(x.a,x.d);else if(x.a.st!=='thrown')this.apply(x.a,x.d,x.h,x.i,x.auto,x.m);}
 grabTest(a,d){const m=a.move,g=m.grab;if(d.ko||d.y>.05)return false;if(Math.hypot(d.x-a.x,d.z-a.z)>g.range*Math.max(1,a.H/1.9))return false;
  const dx=d.x-a.x,dz=d.z-a.z,l=Math.hypot(dx,dz)||1;if((dx*a.fx+dz*a.fz)/l<.5)return false;
  if(!['idle','walk','dash','bdash','atk','land','jsq','crouch','ss'].includes(d.st))return false;
  if(d.st==='atk'&&(d.y>.05||d.inWin(d.move.inv)||d.move.air))return false;
  if((d.st==='crouch'||(d.st==='atk'&&d.move.crouch))&&!g.low)return false;
  return true;}
 grabStart(a,d){const m=a.move;a.done=1;a.connected=1;a.st='throw';a.t=0;a.thr={g:m.grab,t:0,m,sup:!!m.sup,ox:a.x,oz:a.z};d.st='thrown';d.t=0;d.move=null;d.thrP=0;d.thrK=m.grab.kind;d.thrBy=a;d.combo=0;this.ev('grab',a,d,m);}
 breakThrow(a,b){for(const f of[a,b]){f.st='stagger';f.stun=18;f.t=0;f.move=null;const o=f.opp;f.kx=-f.fx*.1;f.kz=-f.fz*.1;f.thr=null;}a.stats.breaks++;this.ev('break',a,b);}
 throwStep(a){const T=a.thr,d=a.opp,g=T.g;T.t++;const br=g.br||0;
  if(T.t<=br){d.x=a.x+a.fx*.62;d.z=a.z+a.fz*.62;d.y=0;d.thrP=0;if(d.inp.Tp||(d.inp.Pp&&d.inp.Kp)||d.buf.T>4||(d.buf.P>3&&d.buf.K>3)){d.buf.T=0;this.breakThrow(d,a);return;}return;}
  const dur={toss:38,slam:44,knee:46,spin:64,pile:84}[g.kind]||40,t=T.t-br,p=Math.min(1,t/dur);d.thrP=p;a.thrP=p;
  const fx=a.fx,fz=a.fz;let off=.62,y=0;
  switch(g.kind){
   case 'toss':off=.62+p*.7;y=Math.sin(p*Math.PI)*1.3;break;
   case 'slam':off=.62*Math.cos(p*Math.PI);y=Math.sin(p*Math.PI)*1.6;break;
   case 'knee':off=.58;y=0;if(t===10||t===20||t===30)this.ev('throwTick',a,d);break;
   case 'spin':{const ang=p*Math.PI*4,r=1.1;d.x=a.x+(fx*Math.cos(ang)-fz*Math.sin(ang))*r;d.z=a.z+(fz*Math.cos(ang)+fx*Math.sin(ang))*r;d.y=.5+Math.sin(p*Math.PI)*.3;break;}
   case 'pile':{const up=Math.sin(Math.min(1,p/.8)*Math.PI);a.y=up*2.2;off=.15;y=a.y+1.6*(p<.8?1:Math.max(0,1-(p-.8)*5));if(t===Math.round(dur*.8))this.ev('throwTick',a,d,1);break;}}
  if(g.kind!=='spin'){d.x=a.x+fx*off;d.z=a.z+fz*off;d.y=y;}
  if(p>=1){a.y=0;const dmg=Math.round(g.d*a.dmgMul*(a.rage?1.1:1));this.damage(a,d,dmg,true);a.stats.throws++;if(T.sup){a.stats.supers+=0;}
   d.st=g.kind==='spin'?'kd':'down';d.t=0;d.y=g.kind==='spin'?.5:0;d.vy=g.kind==='spin'?.08:0;
   if(g.kind==='spin'){d.kx=fx*.16;d.kz=fz*.16;}if(g.kind==='slam'||g.kind==='pile')this.face(a);
   a.st='land';a.t=0;a.lag=g.kind==='pile'?20:12;a.thr=null;a.move=null;this.clamp(d);this.ev('throwHit',a,d,g,dmg);}}
 damage(a,d,dmg,isThrow){d.hp=Math.max(0,d.hp-dmg);a.stats.dealt+=dmg;d.stats.taken+=dmg;d.cdmg+=dmg;
  a.meter=Math.min(100,a.meter+dmg*.1*(a.rage?1.3:1));d.meter=Math.min(100,d.meter+dmg*.07*(d.rage?1.5:1));
  if(this.training)d.hp=Math.max(1,d.hp);if(d.hp<=0&&!d.ko){d.ko=true;this.ev('ko',d,a);}}
 apply(a,d,h,i,auto,m=a.move,dir=null,pp=null){const proj=!!dir;dir=dir||{x:a.fx,z:a.fz};if(!proj)a.done|=1<<i;
  // parry stance turns the strike around
  if(!auto&&d.st==='atk'&&d.move.parry&&d.inWin(d.move.parry)&&h.lv!=='l'){d.stats.parries++;this.stop=12;this.ev('parry',d,a,proj);if(!proj){a.st='stagger';a.stun=30;a.move=null;a.t=0;this.start(d,d.move.parryInto);}return;}
  const blocked=!auto&&this.blocking(d,h.lv);
  const counter=!auto&&d.st==='atk'&&d.move&&d.mt<d.move.first&&!blocked;
  if(!proj){a.connected=blocked?2:1;a.cwEnd=Math.max(a.cwEnd,h.e+14);}
  const sc=d.combo>0?Math.max(.3,1-d.combo*.09):1;
  let dmg=Math.round(h.d*a.dmgMul*sc*(counter?1.2:1)*(a.rage?1.1:1));
  const P=pp?{x:pp.x,y:pp.y,z:pp.z}:{x:d.x-dir.x*.25,y:Math.min(d.y+d.H*.9,Math.max(d.y+.2,a.y+h.y)),z:d.z-dir.z*.25};
  const adv=v=>proj?null:v-(m.f-a.mt);
  if(blocked){const chip=m.sup?Math.round(dmg*.18):m.isSp?Math.round(dmg*.06):0;if(chip)this.damage(a,d,chip);
   d.st='block';d.stun=h.bs;d.t=0;d.crouchB=d.inp.y<0;d.kx=dir.x*h.push*1.15;d.kz=dir.z*h.push*1.15;d.stats.blocks++;a.meter=Math.min(100,a.meter+h.d*.04);
   this.stop=Math.min(10,5+h.d/16|0);this.ev('block',a,d,{h,m,pos:P,adv:adv(h.bs),proj});return;}
  // armour soaks the blow
  if(!auto&&d.st==='atk'&&d.inWin(d.move.armor)){this.damage(a,d,Math.round(dmg*.8));d.flash=6;this.stop=8;this.ev('armor',a,d,{h,m,pos:P});return;}
  if(counter)a.stats.counters++;
  const wasAir=d.st==='air'||d.st==='kd'||(d.y>.05&&d.st!=='wall'&&d.st!=='sup');const crouched=d.st==='crouch'||(d.st==='atk'&&d.move&&d.move.crouch)||(d.crouchB&&(d.st==='hit'||d.st==='block'));
  this.damage(a,d,dmg);d.combo++;a.stats.hits++;a.stats.maxCombo=Math.max(a.stats.maxCombo,d.combo);
  d.lastHit=h;d.hitLv=h.lv;d.flash=5;d.move=null;d.mname='';if(d.locked)d.locked=null;if(d.st==='throw'){d.thr=null;d.y=0;}
  const push=h.push,lock=(m.lock||m.lockKeep)&&!proj;
  if(lock&&!a.locked&&i===0&&!m.grab)a.locked=d;
  if(lock&&a.locked===d&&i<m.h.length-1){d.st='sup';d.t=0;d.y=Math.max(0,d.y*.5);d.vy=0;d.kx=d.kz=0;
   if(!m.lockKeep){const k=m.lock*a.H/1.8;d.x=a.x+a.fx*k;d.z=a.z+a.fz*k;}d.hitLv=i%2?'h':'m';}
  else if(h.launch||wasAir||(d.ko&&d.y<.05)){const dec=Math.pow(.86,d.jug);d.st='air';d.t=0;
   d.vy=h.launch?(wasAir?Math.max(.1,h.launch*.8*dec):h.launch):Math.max(d.vy*.25,(h.jv||.085)*dec);if(d.ko)d.vy=Math.max(d.vy,.13);d.jug++;
   d.kx=dir.x*(push*.4+.012)*(d.ko?2.5:1);d.kz=dir.z*(push*.4+.012)*(d.ko?2.5:1);if(d.y<.02)d.y=.02;}
  else if(h.kd){d.st='kd';d.t=0;d.vy=.1;d.y=.02;d.kx=dir.x*(push*.6+.03);d.kz=dir.z*(push*.6+.03);}
  else if(d.st==='wall'){d.stun=Math.max(16,d.stun-4)+6;}
  else{d.st='hit';d.t=0;d.stun=h.hs+(counter?6:0);d.crouchB=crouched;d.kx=dir.x*push;d.kz=dir.z*push;}
  this.stop=Math.min(18,(m.sup?10:6)+h.d/14|0)+(counter?4:0);if(a.locked===d&&i>0&&i<m.h.length-1)this.stop=Math.min(this.stop,6);
  this.ev('hit',a,d,{h,m,i,pos:P,dmg,counter,combo:d.combo,launch:!!h.launch,kd:!!h.kd,heavy:h.d>=70||!!m.heavy,sup:!!m.sup,proj,adv:h.launch?'LAUNCH':h.kd?'KND':adv(h.hs+(counter?6:0))});}
 /* ---- projectiles: travel along the line they were thrown on (sidestep them), clash with each other, die on walls ---- */
 projStep(){for(const p of this.proj){p.t++;p.x+=p.vx;p.z+=p.vz;const d=p.o.opp;
   if(p.t>p.life||Math.hypot(p.x,p.z)>this.R+.3){p.dead=1;continue;}
   for(const q of this.proj)if(q!==p&&q.o!==p.o&&!q.dead&&Math.hypot(q.x-p.x,q.z-p.z,q.y-p.y)<p.r+q.r){p.dead=q.dead=1;this.ev('clash',p,q);}
   if(p.dead)continue;if(this.inv(d))continue;const hb=this.hurt(d);if(!hb)continue;
   const lo=hb[0]+.2,hi=Math.max(lo,hb[1]-.2),vy=p.y<lo?lo-p.y:p.y>hi?p.y-hi:0;
   if(Math.hypot(d.x-p.x,d.z-p.z,vy)<p.r+.3){p.dead=1;const P=p.p,l=Math.hypot(p.vx,p.vz)||1;
    const h={s:0,e:0,d:P.d,lv:P.lv,hs:P.hs,bs:P.bs,push:.08,kd:P.kd,fw:0,y:p.y,r:p.r};
    this.apply(p.o,d,h,0,false,{h:[h],f:0,isSp:1,first:0},{x:p.vx/l,z:p.vz/l},{x:p.x,y:p.y,z:p.z});this.ev('projHit',p,d,d.st==='block');}}
  this.proj=this.proj.filter(p=>!p.dead);}
 /* ---- body separation, round walls, wall splats ---- */
 clamp(f){const r=Math.hypot(f.x,f.z),R=this.R-.35;if(r>R){f.x*=R/r;f.z*=R/r;return true;}return false;}
 separate(){const[a,b]=this.f;const skip=s=>s==='throw'||s==='thrown'||s==='sup';
  if(!skip(a.st)&&!skip(b.st)&&Math.abs(a.y-b.y)<1.1){const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),min=.33*(a.H+b.H)/1.8;
   if(l<min){const nx=l>1e-4?dx/l:a.fx,nz=l>1e-4?dz/l:a.fz,push=(min-l);const ad=a.st==='down'||a.st==='air',bd=b.st==='down'||b.st==='air';const wa=ad&&!bd?.15:bd&&!ad?.85:.5;
    a.x-=nx*push*wa;a.z-=nz*push*wa;b.x+=nx*push*(1-wa);b.z+=nz*push*(1-wa);}}
  for(const f of this.f){const sp=Math.hypot(f.kx,f.kz);const hit=this.clamp(f);
   if(hit&&(f.st==='air'||f.st==='kd'||(f.st==='hit'&&sp>.07))&&!f.wallUsed&&!f.ko&&sp>.035){f.wallUsed=1;f.st='wall';f.stun=34;f.t=0;f.kx=f.kz=0;f.vy=0;this.stop=Math.max(this.stop,6);this.ev('wall',f);}}}
}
