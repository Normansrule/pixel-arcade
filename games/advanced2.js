/* ADVANCED PACK 2: deep-systems cabinets inspired by famous games (all original names, characters and art) */
(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const EL=(x,y,rx,ry,col)=>{const c=A.c;c.fillStyle=col;c.beginPath();if(c.ellipse)c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,6.2832);c.fill();};
const ER=(x,y,rx,ry,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();if(c.ellipse)c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,6.2832);c.stroke();};
const GR=(x,y,w,h,c1,c2)=>{const c=A.c,gr=c.createLinearGradient?c.createLinearGradient(0,y,0,y+h):null;if(gr&&gr.addColorStop){gr.addColorStop(0,c1);gr.addColorStop(1,c2);c.fillStyle=gr;}else c.fillStyle=c1;c.fillRect(x,y,w,h);};
const GL=(x,y,r,col,a)=>{const c=A.c,gr=c.createRadialGradient?c.createRadialGradient(x,y,0,x,y,Math.max(1,r)):null;if(!gr||!gr.addColorStop)return;gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=a===undefined?1:a;c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1;};
const BAR=(x,y,w,h,f,col,bg)=>{R(x,y,w,h,bg||'#1a1430');R(x,y,Math.max(0,w*cl(isFinite(f)?f:0,0,1)),h,col);};
const PANEL=(x,y,w,h,bc,a)=>{A.c.globalAlpha=a||.9;R(x,y,w,h,'#0b0820');A.c.globalAlpha=1;A.box(x,y,w,h,bc||K.y);};
const AL=a=>{A.c.globalAlpha=cl(a,0,1);};
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)||d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const hit2=(x,y,bx,by,bw,bh)=>x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh;
const mouseOn=()=>A.mouse.t>0;
const seeded=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const ang=(a)=>{while(a>Math.PI)a-=6.2832;while(a<-Math.PI)a+=6.2832;return a;};

/* ---- UNDERWORLD RUN: isometric dash roguelite ---- */
A.add({id:'underworld',name:'UNDERWORLD RUN',cat:'ACTION',time:600,tags:'hades roguelite rogue-lite dungeon isometric boons',
how:'ARROWS MOVE, A ATTACKS (HOLD = SPECIAL), B DASHES, A MID-DASH CASTS. ESCAPE 3 DEPTHS.',make(){
 const g={over:null,score:0};
 const M=store.get('pxd_uw',{});const meta={shade:M.shade|0,hp:M.hp|0,dmg:M.dmg|0,dash:M.dash|0,defy:M.defy|0,cast:M.cast|0,wep:M.wep|0};const save=()=>store.set('pxd_uw',meta);
 const PAT=[['EMBER','#ff7a2f'],['TIDE','#3fb6ff'],['GALE','#ffe14a'],['VEIL','#b46bff']];
 const SL=['ATTACK','SPECIAL','DASH','CAST','PASSIVE','DUO'];
 const BD={
  'EMBER STRIKE':[0,0,l=>'ATTACKS SET FOES ABLAZE, '+(4*l)+' DMG PER SEC'],
  'EMBER FLOURISH':[0,1,l=>'SPECIAL +'+(30*l)+'% DMG AND BURNS'],
  'CINDER DASH':[0,2,l=>'DASH LEAVES A FIRE TRAIL ('+(6*l)+'/SEC)'],
  'FLARE SHARD':[0,3,l=>'CAST EXPLODES FOR '+(25*l)+' AREA DMG'],
  'KINDLING':[0,4,l=>'BURNING FOES TAKE +'+(20*l)+'% DMG'],
  'RIPTIDE STRIKE':[1,0,l=>'ATTACKS +'+(20*l)+'% DMG, HUGE KNOCKBACK'],
  'SURGE FLOURISH':[1,1,l=>'SPECIAL +'+(40*l)+'% DMG, HUGE KNOCKBACK'],
  'WAVE DASH':[1,2,l=>'DASH SHOVES FOES AWAY FOR '+(12*l)+' DMG'],
  'TIDAL SHARD':[1,3,l=>'CAST BURSTS IN A WAVE FOR '+(18*l)],
  'BREAKWATER':[1,4,l=>'FOES KNOCKED INTO WALLS TAKE '+(30*l)],
  'GALE STRIKE':[2,0,l=>'HITS ARC LIGHTNING TO '+(1+l)+' FOES ('+(8+4*l)+')'],
  'THUNDER FLOURISH':[2,1,l=>'SPECIAL CALLS A BOLT FOR '+(30*l)],
  'STATIC DASH':[2,2,l=>'DASH SHOCKS FOES YOU PASS ('+(18*l)+')'],
  'STORM SHARD':[2,3,l=>'CAST ZAPS 3 FOES FOR '+(18*l)],
  'HIGH VOLTAGE':[2,4,l=>'+'+(12*l)+'% CHANCE TO CRIT FOR DOUBLE DMG'],
  'HEX STRIKE':[3,0,l=>'HITS WEAKEN FOES: THEY DEAL -'+(30+10*l)+'% DMG'],
  'NIGHT FLOURISH':[3,1,l=>'SPECIAL +'+(60*l)+'% DMG TO WEAK FOES'],
  'SHADE STEP':[3,2,l=>'FIRST HIT AFTER A DASH +'+(50*l)+'% DMG'],
  'VOID SHARD':[3,3,l=>'CAST PULLS FOES IN AND WEAKENS ('+(10*l)+')'],
  'SOUL THIRST':[3,4,l=>'HEAL '+(2*l)+' HP FOR EVERY KILL'],
  'WILDFIRE':[[0,2],5,()=>'LIGHTNING SETS FOES ABLAZE'],
  'SCALDING STEAM':[[0,1],5,()=>'KNOCKBACK DOUBLES A FOE\'S BURN'],
  'ASH HEX':[[0,3],5,()=>'WEAK BURNING FOES EXPLODE ON DEATH'],
  'MONSOON':[[1,2],5,()=>'WALL SLAMS ARC LIGHTNING'],
  'DEEP CALM':[[1,3],5,()=>'EVERY DASH HEALS 1 HP'],
  'ECLIPSE':[[2,3],5,()=>'CRITS WEAKEN FOES AND HEAL 1 HP']};
 const WEP=[['DUSK BLADE','FAST 3-HIT COMBO. SPECIAL: WHIRLWIND','#d8d8f0'],['WARDEN SPEAR','LONG THRUST. SPECIAL: HURL AND RECALL','#ffcf6a'],['HOLLOW BOW','RANGED SHOTS. SPECIAL: 5-ARROW VOLLEY','#8fe08f']];
 const UPG=[['VITALITY','+10 MAX HP','hp',3,[20,35,55]],['FURY','+10% DAMAGE','dmg',3,[25,45,70]],['SECOND WIND','+1 DASH CHARGE','dash',1,[50]],['DEFIANCE','REVIVE ONCE PER RUN','defy',1,[70]],['SHARD POUCH','+1 CAST SHARD','cast',1,[40]]];
 const ZONE=[['ASHEN HALLS','#5a2a2a','#6a3430','#2a0e14','#ff5a2a'],['DROWNED VAULT','#24484e','#2c565c','#081c24','#3fd0ff'],['DUSK SPIRE','#3e2c5c','#4a3870','#150a28','#ffcf3f']];
 const ED={wretch:[38,4,.5,'#c83a50'],caster:[30,4,.45,'#8a5cff'],bloater:[26,5,.6,'#7fcf3a'],brute:[130,7,.32,'#9a7050'],wisp:[22,3.5,.9,'#4fe0ff']};
 const PX=(x,y)=>160+(x-y)*1.4,PY=(x,y)=>52+(x+y)*.7;
 const toW=(sx,sy)=>{const u=(sx-160)/1.4,v=(sy-52)/.7;return[(u+v)/2,(v-u)/2];};
 const dirW=(ix,iy)=>{const dx=(ix/1.4+iy/.7)/2,dy=(iy/.7-ix/1.4)/2,m=Math.hypot(dx,dy)||1;return[dx/m,dy/m];};
 let st='lobby',sel=0,depth=1,room=0,kills=0,runShade=0,boons={},p=null,en=[],shots=[],ps=[],fires=[],bolts=[],nums=[],slashes=[],tele=[],pil=[],spk=[],doors=[],orb=null,waves=[],menu=null,msg='',msgT=0,fade=0,roomKind='fight',boss=null,deadT=0,fountain=0,pend=null,lastHit=0;
 const lv=n=>boons[n]?boons[n].lv:0;
 const say=(m,t)=>{msg=m;msgT=t||110;};
 const num=(x,y,v,col)=>{nums.push({x:PX(x,y)+rnd(6)-3,y:PY(x,y)-14,t:34,s:String(v),c:col||K.w});};
 const maxCast=()=>2+meta.cast;
 function newRun(){boons={};depth=1;room=0;kills=0;runShade=0;g.score=0;p={x:84,y:84,hp:60+meta.hp*10,mhp:60+meta.hp*10,fx:-.7,fy:-.7,dashT:0,dx:0,dy:0,dashN:1+meta.dash,dashCd:0,iv:0,atkCd:0,spCd:0,combo:0,comboT:0,hold:0,cast:maxCast(),defy:meta.defy,step:0,wep:meta.wep,spear:null,walk:0};pend={k:'boon',p:ri(4)};nextRoom();}
 function nextRoom(){room++;if(room>4){room=1;depth++;}en=[];shots=[];ps=[];fires=[];tele=[];orb=null;doors=[];boss=null;fountain=0;p.x=84;p.y=84;p.spear=null;p.cast=maxCast();fade=30;
  roomKind=room<4?'fight':depth<3?'rest':'boss';pil=[];spk=[];
  if(roomKind==='fight'){const n=1+ri(3);for(let i=0;i<n;i++){let x,y,ok,tries=0;do{x=20+rnd(60);y=20+rnd(60);ok=Math.hypot(x-84,y-84)>22&&Math.hypot(x-50,y-50)>8&&pil.every(q=>Math.hypot(q.x-x,q.y-y)>22);}while(!ok&&++tries<30);if(ok)pil.push({x,y,r:5});}
   const ns=depth+ri(3)+1;for(let i=0;i<ns;i++)spk.push({x:10+ri(8)*10,y:10+ri(8)*10,o:ri(120)});spk=spk.filter(s=>Math.hypot(s.x+5-84,s.y+5-84)>14);
   const budget=3+depth*2+room,kinds=depth===1?['wretch','wretch','caster','bloater']:depth===2?['wretch','caster','bloater','wisp','brute']:['wretch','caster','bloater','wisp','brute','brute'];
   waves=[];const nw=depth===3?3:2;for(let w=0;w<nw;w++){const list=[];for(let i=0;i<Math.ceil(budget/nw);i++)list.push(kinds[ri(kinds.length)]);waves.push(list);}st='fight';
   say(ZONE[depth-1][0]+'  '+depth+'-'+room,80);}
  else if(roomKind==='rest'){waves=[];st='clear';say('A QUIET SPRING. DRINK TO HEAL.',140);makeDoors(1);}
  else{waves=[];st='fight';boss={t:'boss',x:30,y:30,r:9,hp:1700,mhp:1700,spd:.42,st:'idle',tm:90,cd:60,kx:0,ky:0,burn:0,burnT:0,weak:0,fl:0,ph:1,pat:0,stun:0};en.push(boss);say('THE WARDEN OF DUSK BARS THE WAY',150);for(const c of [[22,22],[78,22],[22,78]])pil.push({x:c[0],y:c[1],r:4});}}
 function spawnWave(list){for(const t of list){let x,y,tries=0;do{x=12+rnd(76);y=12+rnd(76);}while((Math.hypot(x-p.x,y-p.y)<30||pil.some(q=>Math.hypot(q.x-x,q.y-y)<q.r+6))&&++tries<40);tele.push({x,y,t:40,k:'spawn',e:t,el:depth===3&&Math.random()<.3});}}
 function addEnemy(t,x,y,el){const d=ED[t],m=(1+.35*(depth-1))*(el?1.6:1);en.push({t,x,y,r:d[1]*(el?1.2:1),hp:d[0]*m,mhp:d[0]*m,spd:d[2],st:'move',tm:0,cd:30+ri(60),kx:0,ky:0,burn:0,burnT:0,weak:0,fl:0,el,a:rnd(6.28)});}
 function makeDoors(n){const opts=[];const pool=['boon','boon','boon','pom','heart','shade'];for(let i=0;i<n;i++){let k=pool[ri(pool.length)];if(k==='pom'&&!Object.keys(boons).some(b=>BD[b][1]<5))k='boon';const o={k};if(k==='boon'){o.p=ri(4);if(opts[0]&&opts[0].k==='boon'&&opts[0].p===o.p)o.p=(o.p+1)%4;}opts.push(o);}
  const nextBoss=depth===3&&room===3,nextRest=room===3&&depth<3;doors=[];const spots=n===1?[[50,0]]:[[50,0],[0,50]];spots.forEach((s,i)=>doors.push({x:s[0],y:s[1],r:roomKind==='rest'||nextBoss||nextRest?(nextBoss?{k:'boss'}:nextRest?{k:'rest'}:opts[i]):opts[i]}));}
 function grant(o){if(!o)return;if(o.k==='boon'){openBoon(o.p);}else if(o.k==='pom'){const own=Object.keys(boons).filter(b=>BD[b][1]<5);if(!own.length){p.mhp+=10;p.hp+=10;say('+10 MAX HP');finishReward();return;}menu={title:'POM OF POWER',col:'#ff5a7a',opts:own.sort(()=>Math.random()-.5).slice(0,3).map(b=>({n:b,lv:boons[b].lv+1,up:1})),i:0};st='menu';}
  else if(o.k==='heart'){p.mhp+=15;p.hp=Math.min(p.mhp,p.hp+25);say('CENTAUR HEART: +15 MAX HP');S('score');finishReward();}
  else if(o.k==='shade'){const v=15+depth*8;runShade+=v;meta.shade+=v;save();say('+'+v+' SHADE (KEPT FOREVER)');S('coin');finishReward();}else finishReward();}
 function openBoon(pi){const have=new Set(Object.keys(boons));const cand=Object.keys(BD).filter(b=>{const d=BD[b];if(have.has(b))return false;if(d[1]===5)return(d[0][0]===pi||d[0][1]===pi)&&Object.keys(boons).some(x=>BD[x][1]<5&&BD[x][0]===d[0][0])&&Object.keys(boons).some(x=>BD[x][1]<5&&BD[x][0]===d[0][1]);return d[0]===pi;});
  const duo=cand.filter(b=>BD[b][1]===5),norm=cand.filter(b=>BD[b][1]<5).sort(()=>Math.random()-.5);const pick=(duo.length?[duo[ri(duo.length)]]:[]).concat(norm).slice(0,3);
  const rar=()=>{const r=Math.random();return r<.08?3:r<.3?2:1;};menu={title:'BOON OF '+PAT[pi][0],col:PAT[pi][1],opts:pick.map(b=>({n:b,lv:BD[b][1]===5?1:rar()})),i:0};if(!menu.opts.length){menu=null;p.mhp+=10;p.hp+=10;finishReward();return;}st='menu';S('coin');}
 function choose(o){if(o.up){boons[o.n].lv=o.lv;say(o.n+' NOW LV '+o.lv);}else{const s=BD[o.n][1];if(s<4)for(const b in boons)if(BD[b][1]===s)delete boons[b];boons[o.n]={lv:o.lv};say((BD[o.n][1]===5?'DUO BOON! ':'')+o.n);}menu=null;S('win');A.burst(PX(p.x,p.y),PY(p.x,p.y)-16,K.y,20,2);finishReward();}
 function finishReward(){st='clear';if(!doors.length)makeDoors(depth===3&&room===3?1:room===3?1:2);}
 const hurtP=(d,src)=>{if(p.iv>0||p.dashT>0||st==='dead'||st==='win')return;if(src&&src.weak>0)d*=1-(.3+.1*Math.max(1,lv('HEX STRIKE')));d=Math.round(d*(1+.15*(depth-1)));p.hp-=d;p.iv=45;A.shake=6;S('hit');num(p.x,p.y,'-'+d,K.r);A.burst(PX(p.x,p.y),PY(p.x,p.y)-12,K.r,10,2);
  if(p.hp<=0){if(p.defy>0){p.defy--;p.hp=Math.round(p.mhp*.5);p.iv=120;say('DEFIANCE! YOU REFUSE TO FALL');S('win');A.burst(PX(p.x,p.y),PY(p.x,p.y)-12,K.y,30,3);}else{p.hp=0;st='dead';deadT=0;S('lose');}}};
 function zap(from,n,dmg,skip){let cur=from;const hitS=new Set(skip||[from]);for(let i=0;i<n;i++){let best=null,bd=40;for(const e of en){if(hitS.has(e)||e.hp<=0)continue;const d=Math.hypot(e.x-cur.x,e.y-cur.y);if(d<bd){bd=d;best=e;}}if(!best)break;bolts.push({a:[cur.x,cur.y],b:[best.x,best.y],t:8});hitS.add(best);dmgE(best,dmg,'chain');if(lv('WILDFIRE'))burnE(best,6);cur=best;}}
 const burnE=(e,v)=>{e.burn=Math.min(Math.max(e.burn,0)+v,v*3);e.burnT=180;};
 function dmgE(e,base,src,kb,kx,ky){if(e.hp<=0)return;let m=1+.1*meta.dmg;if(src==='atk')m+=.2*lv('RIPTIDE STRIKE');if(src==='sp'){m+=.3*lv('EMBER FLOURISH')+.4*lv('SURGE FLOURISH');if(e.weak>0)m+=.6*lv('NIGHT FLOURISH');}
  if(e.burn>0)m+=.2*lv('KINDLING');if(p.step>0&&(src==='atk'||src==='sp')){m+=.5*lv('SHADE STEP');p.step=0;}if(e===boss&&boss.stun>0)m+=.5;
  let crit=false;if(src!=='burn'&&Math.random()<.12*lv('HIGH VOLTAGE')){crit=true;m*=2;}let d=base*m;e.hp-=d;e.fl=6;lastHit=A.t;
  if(src!=='burn'||A.t%30===0)num(e.x,e.y,src==='burn'?Math.round(e.burn/2):Math.round(d),crit?K.y:src==='burn'?'#ff9a4a':src==='chain'?'#fff27a':K.w);
  if(crit&&lv('ECLIPSE')){e.weak=180;p.hp=Math.min(p.mhp,p.hp+1);}
  if(src==='atk'){if(lv('EMBER STRIKE'))burnE(e,4*lv('EMBER STRIKE'));if(lv('HEX STRIKE'))e.weak=180;if(lv('GALE STRIKE'))zap(e,1+lv('GALE STRIKE'),8+4*lv('GALE STRIKE'));}
  if(src==='sp'){if(lv('EMBER FLOURISH'))burnE(e,5*lv('EMBER FLOURISH'));if(lv('THUNDER FLOURISH')){bolts.push({a:[e.x,e.y-60],b:[e.x,e.y],t:10,big:1});const ex=e;setTimeout0(()=>dmgE(ex,30*lv('THUNDER FLOURISH'),'chain'));}}
  if(kb&&e.t!=='boss'){let f=kb*((src==='atk'&&lv('RIPTIDE STRIKE'))||(src==='sp'&&lv('SURGE FLOURISH'))?2.2:1)*(e.t==='brute'?.25:1);e.kx+=kx*f;e.ky+=ky*f;if(lv('SCALDING STEAM')&&e.burn>0)e.burn=Math.min(e.burn*2,60);}
  if(src!=='burn'){S('hit');A.burst(PX(e.x,e.y),PY(e.x,e.y)-8,crit?K.y:'#ffffff',4,1.5);}}
 let later=[];const setTimeout0=f=>later.push(f);
 function killE(e){kills++;g.score+=10*depth*(e.el?2:1);A.burst(PX(e.x,e.y),PY(e.x,e.y)-6,ED[e.t]?ED[e.t][3]:K.p,18,2.4);S('boom');A.shake=3;if(lv('SOUL THIRST'))p.hp=Math.min(p.mhp,p.hp+2*lv('SOUL THIRST'));
  if(lv('ASH HEX')&&e.weak>0&&e.burn>0){tele.push({x:e.x,y:e.y,t:1,k:'boom',r:18,d:30,own:1});}if(Math.random()<.04)orbDrop(e.x,e.y);}
 function orbDrop(x,y){fires.push({x,y,t:600,heal:1});}
 /* player attacks */
 const aimDir=()=>{let fx=p.fx,fy=p.fy;if(mouseOn()){const w=toW(A.mouse.x,A.mouse.y),dx=w[0]-p.x,dy=w[1]-p.y,m=Math.hypot(dx,dy);if(m>2){fx=dx/m;fy=dy/m;}}let best=null,bd=1e9;for(const e of en){if(e.hp<=0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d>(p.wep===2?90:40)||d<.1)continue;const dot=(dx*fx+dy*fy)/d;if(dot>.55&&d/dot<bd){bd=d/dot;best=[dx/d,dy/d];}}if(best){fx=best[0];fy=best[1];}p.fx=fx;p.fy=fy;return[fx,fy];};
 function melee(range,cosT,dmg,kb,src){const[fx,fy]=[p.fx,p.fy];for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d>range+e.r)continue;if(cosT>-1&&d>2&&(dx*fx+dy*fy)/d<cosT)continue;dmgE(e,dmg,src,kb,dx/(d||1),dy/(d||1));}}
 function attack(){const[fx,fy]=aimDir();if(p.wep===0){if(p.comboT<=0)p.combo=0;const c=p.combo;melee(17,.3,[20,20,32][c],[.8,.8,2][c],'atk');slashes.push({x:p.x,y:p.y,fx,fy,t:9,w:c===2?1.3:1,r:17,k:0});if(c===2){p.x+=fx*4;p.y+=fy*4;}p.atkCd=[11,11,20][c];p.combo=(c+1)%3;p.comboT=34;S('shoot');}
  else if(p.wep===1){melee(27,.82,25,1.4,'atk');slashes.push({x:p.x,y:p.y,fx,fy,t:8,r:27,k:1});p.x+=fx*2;p.y+=fy*2;p.atkCd=17;S('shoot');}
  else{ps.push({x:p.x,y:p.y,vx:fx*3.4,vy:fy*3.4,t:42,d:22,k:'arrow',hit:new Set()});p.atkCd=15;S('shoot');}}
 function special(){const[fx,fy]=aimDir();p.spCd=40;if(p.wep===0){melee(23,-2,36,2.4,'sp');slashes.push({x:p.x,y:p.y,fx,fy,t:14,r:23,k:2});S('boom');A.shake=4;}
  else if(p.wep===1){if(p.spear)return;p.spear={x:p.x,y:p.y,vx:fx*3.2,vy:fy*3.2,t:0,hit:new Set()};S('jump');}
  else{for(let i=-2;i<=2;i++){const a=Math.atan2(fy,fx)+i*.2;ps.push({x:p.x,y:p.y,vx:Math.cos(a)*3.6,vy:Math.sin(a)*3.6,t:40,d:17,k:'arrow',sp:1,hit:new Set()});}S('shoot');}}
 function cast(){if(p.cast<=0){say('NO SHARDS - PICK THEM UP',50);return;}p.cast--;const[fx,fy]=aimDir();ps.push({x:p.x,y:p.y,vx:fx*3.6,vy:fy*3.6,t:24,d:40,k:'shard',hit:new Set()});S('shoot');}
 function shardLand(s){s.k='lodged';s.t=420;const L_=['FLARE SHARD','TIDAL SHARD','STORM SHARD','VOID SHARD'];if(lv(L_[0]))tele.push({x:s.x,y:s.y,t:1,k:'boom',r:16,d:25*lv(L_[0]),own:1,fire:1});
  if(lv(L_[1])){for(const e of en){const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy);if(d<20)dmgE(e,18*lv(L_[1]),'cast',3,dx/(d||1),dy/(d||1));}slashes.push({x:s.x,y:s.y,fx:1,fy:0,t:12,r:20,k:3});}
  if(lv(L_[2]))zap({x:s.x,y:s.y},3,18*lv(L_[2]),[]);if(lv(L_[3])){for(const e of en){const dx=s.x-e.x,dy=s.y-e.y,d=Math.hypot(dx,dy);if(d<35&&e.t!=='boss'){e.kx+=dx*.12;e.ky+=dy*.12;e.weak=180;dmgE(e,10*lv(L_[3]),'cast');}}slashes.push({x:s.x,y:s.y,fx:1,fy:0,t:16,r:35,k:4});}}
 const push=(o,r)=>{o.x=cl(o.x,5,95);o.y=cl(o.y,5,95);for(const q of pil){const dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy),m=q.r+r;if(d<m&&d>0){o.x=q.x+dx/d*m;o.y=q.y+dy/d*m;}}};
 /* enemies */
 function upEnemy(e){if(e.fl>0)e.fl--;if(e.weak>0)e.weak--;if(e.burnT>0){e.burnT--;dmgE(e,e.burn/60,'burn');if(e.burnT<=0)e.burn=0;}
  const ox=e.x,oy=e.y;e.x+=e.kx;e.y+=e.ky;const sp=Math.hypot(e.kx,e.ky);e.kx*=.82;e.ky*=.82;
  const wall=e.x<5||e.x>95||e.y<5||e.y>95||pil.some(q=>Math.hypot(e.x-q.x,e.y-q.y)<q.r+e.r);if(wall&&sp>1.4&&e.t!=='boss'){if(lv('BREAKWATER'))dmgE(e,30*lv('BREAKWATER'),'wall');if(lv('MONSOON'))zap(e,2,15);A.shake=3;e.kx=e.ky=0;}
  const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;e.cd--;e.tm--;const mv=(vx,vy)=>{e.x+=vx;e.y+=vy;};
  if(e.t==='wretch'){if(e.st==='move'){mv(ux*e.spd,uy*e.spd);if(d<15&&e.cd<=0){e.st='wind';e.tm=22;e.lx=ux;e.ly=uy;}}else if(e.st==='wind'){if(e.tm<=0){e.st='lunge';e.tm=11;e.hitP=0;}}else if(e.st==='lunge'){mv(e.lx*2.3,e.ly*2.3);if(!e.hitP&&d<e.r+4){e.hitP=1;hurtP(e.el?10:7,e);}if(e.tm<=0){e.st='move';e.cd=50;}}}
  else if(e.t==='caster'){if(e.st==='move'){const want=d<35?-1:d>62?1:0;mv(ux*e.spd*want-uy*e.spd*.6*Math.sin(e.a+A.t*.01),uy*e.spd*want+ux*e.spd*.6*Math.sin(e.a+A.t*.01));if(e.cd<=0){e.st='wind';e.tm=30;}}else if(e.tm<=0){const n=depth>1||e.el?3:1;for(let i=0;i<n;i++){const a=Math.atan2(uy,ux)+(i-(n-1)/2)*.32;shots.push({x:e.x,y:e.y,vx:Math.cos(a)*1.25,vy:Math.sin(a)*1.25,t:160,d:6,src:e});}S('shoot');e.st='move';e.cd=110+ri(40);}}
  else if(e.t==='bloater'){if(e.st==='move'){mv(ux*e.spd,uy*e.spd);if(d<13){e.st='fuse';e.tm=34;}}else if(e.tm<=0){e.hp=0;tele.push({x:e.x,y:e.y,t:1,k:'boom',r:17,d:12,src:e,hurtEn:1});}}
  else if(e.t==='brute'){if(e.st==='move'){mv(ux*e.spd,uy*e.spd);if(d<19&&e.cd<=0){e.st='wind';e.tm=48;}}else if(e.tm<=0){if(d<21)hurtP(e.el?18:14,e);A.shake=7;S('boom');A.burst(PX(e.x,e.y),PY(e.x,e.y),'#c0a080',20,2.5);e.st='move';e.cd=90;}}
  else if(e.t==='wisp'){if(e.st==='move'){e.a+=.03;const tx=p.x+Math.cos(e.a)*28,ty=p.y+Math.sin(e.a)*28,tx2=tx-e.x,ty2=ty-e.y,m=Math.hypot(tx2,ty2)||1;mv(tx2/m*e.spd,ty2/m*e.spd);if(e.cd<=0){e.st='wind';e.tm=20;}}else if(e.st==='wind'){if(e.tm<=0){e.st='lunge';e.tm=16;e.lx=ux;e.ly=uy;e.hitP=0;}}else{mv(e.lx*2.6,e.ly*2.6);if(!e.hitP&&d<e.r+4){e.hitP=1;hurtP(5,e);}if(e.tm<=0){e.st='move';e.cd=80+ri(50);}}}
  else if(e.t==='boss')upBoss(e,d,ux,uy);
  if(e.t!=='boss'){for(const o of en){if(o===e||o.t==='boss')continue;const qx=e.x-o.x,qy=e.y-o.y,qd=Math.hypot(qx,qy),m=e.r+o.r;if(qd<m&&qd>0){e.x+=qx/qd*(m-qd)*.5;e.y+=qy/qd*(m-qd)*.5;}}}push(e,e.r);
  if(e.st==='move'&&e.t!=='boss'&&d<e.r+3){e.x-=ux*.6;e.y-=uy*.6;}}
 function upBoss(b,d,ux,uy){if(b.stun>0){b.stun--;return;}if(b.ph===1&&b.hp<b.mhp*.5){b.ph=2;say('THE WARDEN RAGES!',120);A.shake=12;S('boom');}const fast=b.ph===2?.7:1;
  if(b.st==='idle'){const want=d>30?1:d<18?-1:0;b.x+=ux*b.spd*want;b.y+=uy*b.spd*want;if(b.tm-->0)return;const pats=['ring','charge','rain','summon'];b.pat=(b.pat+1+ri(2))%4;b.st=pats[b.pat];b.tm=b.st==='charge'?40:45;b.lx=ux;b.ly=uy;if(b.st==='summon'&&en.filter(e=>e.t==='wretch').length>=3)b.st='ring';if(b.st==='rain')for(let i=0;i<(b.ph===2?8:5);i++)tele.push({x:cl(p.x+rnd(50)-25,8,92),y:cl(p.y+rnd(50)-25,8,92),t:55+i*6,k:'boom',r:11,d:12});}
  else if(b.st==='ring'){if(b.tm<=0){const n=b.ph===2?18:12,o=rnd(1);for(let i=0;i<n;i++){const a=i/n*6.283+o;shots.push({x:b.x,y:b.y,vx:Math.cos(a)*1.1,vy:Math.sin(a)*1.1,t:200,d:8,big:1});}S('boom');b.st=b.ph===2&&!b.again?'ring':'idle';b.again=!b.again&&b.ph===2;b.tm=b.st==='ring'?25:80*fast;}}
  else if(b.st==='charge'){if(b.tm>0){b.lx=ux;b.ly=uy;return;}b.x+=b.lx*3.2;b.y+=b.ly*3.2;if(Math.hypot(p.x-b.x,p.y-b.y)<b.r+4)hurtP(14,b);if(b.x<7||b.x>93||b.y<7||b.y>93||pil.some(q=>Math.hypot(q.x-b.x,q.y-b.y)<q.r+b.r)){b.st='idle';b.tm=70*fast;b.stun=60;A.shake=10;S('boom');say('STUNNED - STRIKE NOW!',60);push(b,b.r);}if(b.tm<-50){b.st='idle';b.tm=60;}}
  else if(b.st==='rain'){if(b.tm<=0){b.st='idle';b.tm=90*fast;}}
  else if(b.st==='summon'){if(b.tm<=0){for(let i=0;i<2;i++)tele.push({x:cl(b.x+rnd(30)-15,10,90),y:cl(b.y+rnd(30)-15,10,90),t:30,k:'spawn',e:'wretch'});b.st='idle';b.tm=90*fast;}}}
 /* main update */
 g.update=()=>{for(const n of nums){n.y-=.5;n.t--;}nums=nums.filter(n=>n.t>0);bolts=bolts.filter(b=>--b.t>0);slashes=slashes.filter(s=>--s.t>0);if(msgT)msgT--;if(fade>0)fade--;const l0=later;later=[];l0.forEach(f=>f());
  const h=A.hit(0),k=A.in(0);
  if(st==='lobby'){const rows=7;if(mouseOn()){for(let i=0;i<rows;i++)if(hit2(A.mouse.x,A.mouse.y,30,60+i*20,260,18))sel=i;}if(h.u){sel=(sel+rows-1)%rows;S('blip');}if(h.d){sel=(sel+1)%rows;S('blip');}
   if(sel===0&&(h.l||h.r)){meta.wep=(meta.wep+(h.r?1:2))%3;save();S('blip');}
   if(h.a){if(sel===0||sel===6){newRun();S('coin');}else{const u=UPG[sel-1],cur=meta[u[2]];if(cur>=u[3])say('MAXED',50);else if(meta.shade<u[4][cur]){say('NOT ENOUGH SHADE',50);S('lose');}else{meta.shade-=u[4][cur];meta[u[2]]++;save();S('score');say(u[0]+' UPGRADED',60);}}}return;}
  if(st==='menu'){const n=menu.opts.length;if(mouseOn())for(let i=0;i<n;i++)if(hit2(A.mouse.x,A.mouse.y,20,58+i*46,280,42))menu.i=i;if(h.u){menu.i=(menu.i+n-1)%n;S('blip');}if(h.d){menu.i=(menu.i+1)%n;S('blip');}menu.t=(menu.t||0)+1;if(h.a&&menu.t>12)choose(menu.opts[menu.i]);return;}
  if(st==='dead'){deadT++;if(deadT>100){meta.shade+=0;save();g.over='SLAIN IN '+ZONE[depth-1][0]+' - '+runShade+' SHADE KEPT';}return;}
  if(st==='win'){deadT++;if(deadT>120)g.over='VICTORY - YOU ESCAPED THE UNDERWORLD';return;}
  /* player */
  if(p.iv>0)p.iv--;if(p.atkCd>0)p.atkCd--;if(p.spCd>0)p.spCd--;if(p.comboT>0)p.comboT--;if(p.step>0)p.step--;
  if(p.dashN<1+meta.dash){if(++p.dashCd>=38){p.dashCd=0;p.dashN++;}}
  let ix=ax(k),iy=ay(k);const mvd=ix||iy?dirW(ix,iy):null;if(mvd&&!mouseOn()){p.fx=mvd[0];p.fy=mvd[1];}
  if(h.b&&p.dashN>0&&p.dashT<=0){p.dashN--;p.dashT=10;const d=mvd||[p.fx,p.fy];p.dx=d[0];p.dy=d[1];p.iv=Math.max(p.iv,14);p.zapped=new Set();S('jump');if(lv('DEEP CALM'))p.hp=Math.min(p.mhp,p.hp+1);if(lv('SHADE STEP'))p.step=60;
   if(lv('WAVE DASH'))for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,dd=Math.hypot(dx,dy);if(dd<20)dmgE(e,12*lv('WAVE DASH'),'dash',3,dx/(dd||1),dy/(dd||1));}}
  if(p.dashT>0){p.dashT--;p.x+=p.dx*3.1;p.y+=p.dy*3.1;if(lv('CINDER DASH')&&p.dashT%2===0)fires.push({x:p.x,y:p.y,t:150,dps:6*lv('CINDER DASH')});if(lv('STATIC DASH'))for(const e of en)if(!p.zapped.has(e)&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+6){p.zapped.add(e);bolts.push({a:[p.x,p.y],b:[e.x,e.y],t:8});dmgE(e,18*lv('STATIC DASH'),'chain');}A.fx.push({x:PX(p.x,p.y)+rnd(6)-3,y:PY(p.x,p.y)-8-rnd(14),vx:0,vy:0,t:10,c:'#9a8aff',g:0});}
  else if(mvd){const sp=p.hold>14?.45:.86;p.x+=mvd[0]*sp;p.y+=mvd[1]*sp;p.walk+=.25;}
  push(p,3.5);
  if(h.a){if(p.dashT>0){cast();p.hold=-999;}else if(p.atkCd<=0){attack();p.hold=0;}else p.hold=0;}
  if(k.a){if(p.hold>=0)p.hold++;}else{if(p.hold>=24&&p.spCd<=0)special();p.hold=0;}
  /* player projectiles */
  for(const s of ps){if(s.k==='lodged'){s.t--;if(Math.hypot(s.x-p.x,s.y-p.y)<6||s.t<=0){s.t=0;p.cast=Math.min(maxCast(),p.cast+1);S('coin');}continue;}
   s.x+=s.vx;s.y+=s.vy;s.t--;let out=s.x<3||s.x>97||s.y<3||s.y>97||pil.some(q=>Math.hypot(q.x-s.x,q.y-s.y)<q.r);
   for(const e of en){if(s.hit.has(e)||e.hp<=0)continue;if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+2){s.hit.add(e);const m=Math.hypot(s.vx,s.vy)||1;dmgE(e,s.d,s.k==='shard'?'cast':s.sp?'sp':'atk',.8,s.vx/m,s.vy/m);if(s.k==='shard'){out=true;break;}if(!s.sp){s.t=0;break;}}}
   if(s.k==='shard'&&(out||s.t<=0)){s.x=cl(s.x,5,95);s.y=cl(s.y,5,95);shardLand(s);continue;}if(out)s.t=0;}
  ps=ps.filter(s=>s.t>0);
  if(p.spear){const s=p.spear;s.t++;if(s.t<24){s.x+=s.vx;s.y+=s.vy;s.x=cl(s.x,4,96);s.y=cl(s.y,4,96);}else{const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy)||1;if(s.t===24)s.hit=new Set();s.x+=dx/d*3.6;s.y+=dy/d*3.6;if(d<5)p.spear=null;}
   if(p.spear)for(const e of en)if(!s.hit.has(e)&&Math.hypot(e.x-s.x,e.y-s.y)<e.r+3){s.hit.add(e);dmgE(e,32,'sp',1.5,s.vx/3.2,s.vy/3.2);}}
  /* enemy shots */
  for(const s of shots){s.x+=s.vx;s.y+=s.vy;s.t--;if(s.x<2||s.x>98||s.y<2||s.y>98||pil.some(q=>Math.hypot(q.x-s.x,q.y-s.y)<q.r))s.t=0;if(Math.hypot(s.x-p.x,s.y-p.y)<(s.big?4.5:3.5)&&p.iv<=0&&p.dashT<=0){hurtP(s.d,s.src);s.t=0;}}shots=shots.filter(s=>s.t>0);
  /* fires, heals */
  for(const f of fires){f.t--;if(f.heal){if(Math.hypot(f.x-p.x,f.y-p.y)<5){p.hp=Math.min(p.mhp,p.hp+8);num(p.x,p.y,'+8',K.g);S('coin');f.t=0;}continue;}if(A.t%10===0)for(const e of en)if(Math.hypot(e.x-f.x,e.y-f.y)<e.r+3)burnE(e,f.dps);}fires=fires.filter(f=>f.t>0);
  /* traps */
  for(const s of spk){const ph=(A.t+s.o)%140;if(ph===110)S('blip');if(ph>=120&&ph<136){if(p.x>s.x&&p.x<s.x+10&&p.y>s.y&&p.y<s.y+10)hurtP(9);if(ph===120)for(const e of en)if(e.t!=='boss'&&e.x>s.x&&e.x<s.x+10&&e.y>s.y&&e.y<s.y+10)dmgE(e,25,'trap');}}
  /* telegraphs */
  for(const t of tele){t.t--;if(t.t>0)continue;if(t.k==='spawn')addEnemy(t.e,t.x,t.y,t.el);else if(t.k==='boom'){A.shake=Math.max(A.shake,5);S('boom');A.burst(PX(t.x,t.y),PY(t.x,t.y)-4,t.fire?'#ff7a2f':t.own?'#ffcf3f':'#ff4f6d',22,2.6);slashes.push({x:t.x,y:t.y,fx:1,fy:0,t:10,r:t.r,k:5,col:t.own?'#ffb040':'#ff5050'});
    if(!t.own&&Math.hypot(p.x-t.x,p.y-t.y)<t.r+2)hurtP(t.d,t.src);if(t.own||t.hurtEn)for(const e of en)if(e!==t.src&&Math.hypot(e.x-t.x,e.y-t.y)<t.r+e.r){dmgE(e,t.own?t.d:30,'boom',2,Math.sign(e.x-t.x)||1,Math.sign(e.y-t.y));if(t.fire)burnE(e,8);}}}
  tele=tele.filter(t=>t.t>0);
  for(const e of en)if(e.hp>0)upEnemy(e);
  for(const e of en)if(e.hp<=0&&!e.dead){e.dead=1;if(e===boss){g.score+=2000+Math.round(p.hp)*10;meta.shade+=60;runShade+=60;save();st='win';deadT=0;S('win');A.shake=14;for(let i=0;i<5;i++)A.burst(PX(e.x,e.y)+rnd(30)-15,PY(e.x,e.y)-20,i%2?K.y:'#b46bff',30,3.5);en.forEach(o=>o.hp=0);}else killE(e);}
  en=en.filter(e=>e.hp>0);
  /* room flow */
  if(st==='fight'&&roomKind==='fight'){const pending=tele.some(t=>t.k==='spawn');if(!pending&&en.length<=1&&waves.length){spawnWave(waves.shift());}
   if(!pending&&!en.length&&!waves.length){st='reward';g.score+=50*depth;meta.shade+=2;runShade+=2;save();orb={x:50,y:50,o:pend,t:0};S('score');say('CHAMBER CLEARED',70);}}
  if(st==='fight'&&roomKind==='boss'&&!en.length&&!boss)st='clear';
  if(st==='reward'&&orb){orb.t++;if(orb.t>30&&Math.hypot(p.x-orb.x,p.y-orb.y)<7){const o=orb.o;orb=null;grant(o);}}
  if(st==='clear'){if(roomKind==='rest'&&!fountain&&Math.hypot(p.x-50,p.y-50)<10){fountain=1;const v=Math.round(p.mhp*.4);p.hp=Math.min(p.mhp,p.hp+v);num(p.x,p.y,'+'+v,K.g);S('win');say('YOU FEEL RESTORED',80);}
   for(const d of doors){if(Math.hypot(p.x-(d.x||3),p.y-(d.y||3))<9){pend=d.r.k==='boss'||d.r.k==='rest'?null:d.r;if(!pend&&d.r.k==='rest')pend=null;S('coin');nextRoom();if(roomKind==='fight'&&!pend)pend={k:'boon',p:ri(4)};break;}}}
 };
 /* ---------- drawing ---------- */
 const quad=(pts,col)=>A.poly(pts,col,1);
 function drawFloor(z){const Z=ZONE[z];A.cls(Z[3]);GL(160,120,150,Z[4],.12);
  for(let i=0;i<14;i++){const x=(i*53+A.t*.2)%340-10,y=210+Math.sin(i+A.t*.02)*6;GL(x,y,22,Z[4],.25);}
  quad([[PX(100,0),PY(100,0)],[PX(100,100),PY(100,100)],[PX(100,100),PY(100,100)+12],[PX(100,0),PY(100,0)+12]],A.mix(Z[1],'#000000',.55));
  quad([[PX(0,100),PY(0,100)],[PX(100,100),PY(100,100)],[PX(100,100),PY(100,100)+12],[PX(0,100),PY(0,100)+12]],A.mix(Z[1],'#000000',.35));
  for(let i=0;i<10;i++)for(let j=0;j<10;j++){const x=i*10,y=j*10,v=((i*7+j*13)%5)/20;quad([[PX(x,y),PY(x,y)],[PX(x+10,y),PY(x+10,y)],[PX(x+10,y+10),PY(x+10,y+10)],[PX(x,y+10),PY(x,y+10)]],A.mix((i+j)%2?Z[1]:Z[2],'#000000',v));}
  AL(.18);for(let i=0;i<=10;i++){L(PX(i*10,0),PY(i*10,0),PX(i*10,100),PY(i*10,100),'#000000');L(PX(0,i*10),PY(0,i*10),PX(100,i*10),PY(100,i*10),'#000000');}AL(1);
  const WH=26,wc=A.mix(Z[1],'#000000',.25),wc2=A.mix(Z[1],'#000000',.45);
  quad([[PX(0,0),PY(0,0)],[PX(100,0),PY(100,0)],[PX(100,0),PY(100,0)-WH],[PX(0,0),PY(0,0)-WH]],wc);quad([[PX(0,0),PY(0,0)],[PX(0,100),PY(0,100)],[PX(0,100),PY(0,100)-WH],[PX(0,0),PY(0,0)-WH]],wc2);
  AL(.3);for(let r=1;r<4;r++){L(PX(0,0),PY(0,0)-r*7,PX(100,0),PY(100,0)-r*7,'#000000');L(PX(0,0),PY(0,0)-r*7,PX(0,100),PY(0,100)-r*7,'#000000');}for(let i=0;i<10;i++){const o=(i%2)*5;L(PX(i*10+o,0),PY(i*10+o,0)-7,PX(i*10+o,0),PY(i*10+o,0)-14,'#000000');L(PX(0,i*10+o),PY(0,i*10+o)-14,PX(0,i*10+o),PY(0,i*10+o)-21,'#000000');}AL(1);
  L(PX(0,0),PY(0,0)-WH,PX(100,0),PY(100,0)-WH,Z[4]);L(PX(0,0),PY(0,0)-WH,PX(0,100),PY(0,100)-WH,Z[4]);
  for(const c of [[100,0],[0,100],[0,0]]){const x=PX(c[0],c[1]),y=PY(c[0],c[1]);R(x-3,y-WH-6,6,WH+6,A.mix(Z[1],'#000000',.6));C(x,y-WH-9,3+Math.sin(A.t*.3+c[0])*.6,Z[4]);GL(x,y-WH-9,14,Z[4],.5);}}
 function drawDoor(d){const open=st==='clear'&&d.r;const left=d.y>0;const x0=left?0:45,y0=left?45:0,x1=left?0:55,y1=left?55:0;const pts=[[PX(x0,y0),PY(x0,y0)],[PX(x1,y1),PY(x1,y1)],[PX(x1,y1),PY(x1,y1)-20],[PX((x0+x1)/2,(y0+y1)/2),PY((x0+x1)/2,(y0+y1)/2)-25],[PX(x0,y0),PY(x0,y0)-20]];
  quad(pts,open?'#1a0a2a':'#2a2030');if(open){AL(.5+Math.sin(A.t*.1)*.2);quad(pts,d.r.k==='boon'?PAT[d.r.p][1]:d.r.k==='boss'?'#ff3030':'#b46bff');AL(1);}A.poly(pts,ZONE[depth-1][4]);
  if(open)icon(d.r,PX((x0+x1)/2,(y0+y1)/2),PY((x0+x1)/2,(y0+y1)/2)-36+Math.sin(A.t*.08)*2,1);}
 function icon(o,x,y,big){if(!o)return;const s=big?1:.8;if(o.k==='boon'){GL(x,y,10*s,PAT[o.p][1],.6);C(x,y,5*s,PAT[o.p][1]);T(PAT[o.p][0][0],x+.5,y-2,'#000000',1,'c');}else if(o.k==='pom'){C(x,y,5*s,'#ff4f6d');R(x-1,y-8*s,2,3,'#3dff8b');}else if(o.k==='heart'){C(x-2.5*s,y-1,3*s,'#ff3a5a');C(x+2.5*s,y-1,3*s,'#ff3a5a');A.poly([[x-5.5*s,y],[x+5.5*s,y],[x,y+6*s]],'#ff3a5a',1);}
  else if(o.k==='shade'){A.poly([[x,y-6*s],[x+4*s,y],[x,y+6*s],[x-4*s,y]],'#b46bff',1);A.poly([[x,y-3*s],[x+2*s,y],[x,y+3*s],[x-2*s,y]],'#e8d0ff',1);}else if(o.k==='boss'){C(x,y,5,'#3a0a0a');T('!',x+.5,y-2,K.r,1,'c');}else if(o.k==='rest'){C(x,y,5,'#3fd0ff');}}
 function drawPlayer(){const sx=PX(p.x,p.y),sy=PY(p.x,p.y),fl=p.iv>0&&p.dashT<=0&&A.t%6<3;if(p.dashT>0){AL(.35);A.person(sx-p.dx*8,sy-p.dy*4,{s:.62,c:'#6a5aff',pants:'#1a1a3a',st:p.walk,d:p.dx-p.dy>=0?1:-1});AL(1);}if(fl)AL(.45);
  const sd=p.fx-p.fy>=0?1:-1;GL(sx,sy-10,16,'#ff5a3a',.25);A.person(sx,sy,{s:.62,c:'#b8202a',pants:'#2a1a1a',hair:'#1a0a0a',skin:'#e8c0a0',st:p.walk,d:sd,arm2:p.atkCd>6?-1.6:undefined});
  const wx=sx+(p.fx-p.fy)*1.4*6,wy=sy-11+(p.fx+p.fy)*.7*6;if(p.wep===0)L(sx,sy-11,wx,wy,'#e8e8ff',2);else if(p.wep===1&&!p.spear)L(sx-(p.fx-p.fy)*6,sy-11-(p.fx+p.fy)*3,wx+(p.fx-p.fy)*6,wy+(p.fx+p.fy)*3,'#ffcf6a',1.5);else if(p.wep===2){A.c.strokeStyle='#8fe08f';A.c.lineWidth=1.2;A.c.beginPath();A.c.arc(sx+sd*3,sy-12,5,sd>0?-1.3:1.84,sd>0?1.3:4.44);A.c.stroke();}
  AL(1);if(p.hold>14){const f=Math.min(1,p.hold/24);A.c.strokeStyle=f>=1?K.y:'#ffffff';A.c.lineWidth=1.5;A.c.beginPath();A.c.arc(sx,sy-11,10,-1.57,-1.57+f*6.28);A.c.stroke();}}
 function drawEnemy(e){const sx=PX(e.x,e.y),sy=PY(e.x,e.y),col=e.fl>0?'#ffffff':(ED[e.t]?ED[e.t][3]:'#3a2a4a'),wind=e.st==='wind'||e.st==='fuse';EL(sx,sy,e.r*1.6,e.r*.8,'rgba(0,0,0,.35)');if(e.el)ER(sx,sy-e.r,e.r*2.2,e.r*1.6,'#ffcf3f');
  if(e.burn>0&&A.t%4<2)A.fx.push({x:sx+rnd(8)-4,y:sy-6-rnd(10),vx:0,vy:-.6,t:12,c:A.t%8<4?'#ff7a2f':'#ffcf3f',g:0});if(e.weak>0){AL(.5);ER(sx,sy-3,e.r*1.8,e.r*.8,'#b46bff');AL(1);}
  if(e.t==='wretch'){const b=e.st==='lunge'?-3:Math.sin(A.t*.2+e.a)*1;A.poly([[sx-5,sy],[sx+5,sy],[sx+3,sy-10+b],[sx-3,sy-11+b]],col,1);C(sx+(p.x-e.x>0?1:-1),sy-13+b,4,col);R(sx-2,sy-14+b,1.5,1.5,wind?K.y:'#ffe040');R(sx+1,sy-14+b,1.5,1.5,wind?K.y:'#ffe040');L(sx-5,sy-6,sx-8,sy-2+b,col,1.5);L(sx+5,sy-6,sx+8,sy-2+b,col,1.5);if(wind&&A.t%4<2)T('!',sx,sy-24,K.y,1,'c');}
  else if(e.t==='caster'){const b=-5+Math.sin(A.t*.08+e.a)*2;A.poly([[sx-5,sy+b+4],[sx+5,sy+b+4],[sx,sy+b-14]],col,1);C(sx,sy+b-13,3.2,'#2a1a4a');R(sx-1.5,sy+b-14,1,1,'#ff60ff');R(sx+.5,sy+b-14,1,1,'#ff60ff');const oc=wind?'#ffb0ff':'#c080ff';GL(sx+4,sy+b-6,wind?12:7,oc,.7);C(sx+4,sy+b-6,2,oc);}
  else if(e.t==='bloater'){const pu=1+Math.sin(A.t*(wind?.6:.12))*.12+(wind?(34-e.tm)/60:0);C(sx,sy-7,7*pu,wind&&A.t%6<3?'#ff5050':col);C(sx-2,sy-9,2*pu,'#c8ff90');R(sx-3,sy-8,1.5,1.5,'#200');R(sx+1.5,sy-8,1.5,1.5,'#200');}
  else if(e.t==='brute'){if(wind){AL(.25+(48-e.tm)/100);EL(sx,sy,21*1.98,21*.99,'#ff3030');AL(1);ER(sx,sy,21*1.98,21*.99,'#ff6060');}const b=wind?-(48-e.tm)/10:0;R(sx-4,sy-6,3,6,'#3a2a20');R(sx+1,sy-6,3,6,'#3a2a20');R(sx-7,sy-18+b,14,13,col);R(sx-7,sy-18+b,14,3,'#c0a070');C(sx,sy-21+b,4,'#5a4a40');R(sx-2,sy-22+b,4,1.5,K.r);C(sx-9,sy-12+b*2,3,'#7a5a40');C(sx+9,sy-12+b*2,3,'#7a5a40');}
  else if(e.t==='wisp'){const b=-10+Math.sin(A.t*.15+e.a)*3;GL(sx,sy+b,12,col,.6);C(sx,sy+b,3.5,wind?'#ffffff':col);A.poly([[sx-3,sy+b],[sx+3,sy+b],[sx,sy+b+7]],col,1);}
  else if(e.t==='boss')drawBoss(e,sx,sy);
  if(e.t!=='boss'&&e.hp<e.mhp){BAR(sx-8,sy-(e.t==='brute'?30:24),16,2,e.hp/e.mhp,e.burn>0?'#ff9a4a':K.r,'#300');}}
 function drawBoss(b,sx,sy){const rage=b.ph===2,col=b.fl>0?'#ffffff':rage?'#5a1020':'#2a2040';EL(sx,sy,22,10,'rgba(0,0,0,.4)');if(b.st==='charge'&&b.tm>0){AL(.4);L(sx,sy,sx+(b.lx-b.ly)*1.4*80,sy+(b.lx+b.ly)*.7*80,K.r,6);AL(1);}
  const bob=Math.sin(A.t*.06)*1.5,s=b.stun>0;R(sx-7,sy-12,5,12,'#1a1020');R(sx+2,sy-12,5,12,'#1a1020');A.poly([[sx-12,sy-12],[sx+12,sy-12],[sx+9,sy-34+bob],[sx-9,sy-34+bob]],col,1);R(sx-10,sy-30+bob,20,3,'#c8a040');R(sx-3,sy-28+bob,6,14,'#c8a040');
  C(sx,sy-40+bob,7,col);A.poly([[sx-7,sy-42+bob],[sx-12,sy-54+bob],[sx-3,sy-45+bob]],'#c8a040',1);A.poly([[sx+7,sy-42+bob],[sx+12,sy-54+bob],[sx+3,sy-45+bob]],'#c8a040',1);R(sx-4,sy-41+bob,3,2,rage?K.r:K.y);R(sx+1,sy-41+bob,3,2,rage?K.r:K.y);GL(sx,sy-40,16,rage?'#ff2020':'#ffcf3f',.35);
  L(sx+12,sy-36+bob,sx+18,sy+2,'#888',2);A.poly([[sx+14,sy-40+bob],[sx+28,sy-34+bob],[sx+18,sy-30+bob]],'#c0c8d0',1);if(s){for(let i=0;i<3;i++){const a=A.t*.1+i*2.1;C(sx+Math.cos(a)*9,sy-52+Math.sin(a)*3,1.5,K.y);}}}
 g.draw=()=>{const z=st==='lobby'?2:depth-1;
  if(st==='lobby'){A.cls('#0c0a1e');drawFloor(2);const sx=PX(50,50),sy=PY(50,50);A.person(sx,sy,{s:.9,c:'#b8202a',pants:'#2a1a1a',hair:'#1a0a0a',skin:'#e8c0a0',d:1});
   PANEL(26,28,268,190,'#b46bff',.92);T('HOUSE OF SHADES',160,34,K.y,2,'c');A.poly([[230,49],[234,53],[230,57],[226,53]],'#b46bff',1);T('SHADE '+meta.shade,238,51,'#d8b0ff',1);T('RUN PREP',34,51,K.gr,1);
   const rowsT=[['WEAPON  < '+WEP[meta.wep][0]+' >',WEP[meta.wep][1]]].concat(UPG.map(u=>{const c=meta[u[2]];return[u[0]+'  '+'*'.repeat(c)+'-'.repeat(u[3]-c),c>=u[3]?u[1]+'  (MAXED)':u[1]+'  COST '+u[4][c]];}),[['START ESCAPE  >','3 DEPTHS. 12 CHAMBERS. ONE WARDEN.']]);
   rowsT.forEach((r,i)=>{const y=62+i*20;if(i===sel){R(30,y-2,260,18,'#2a1a4a');A.box(30,y-2,260,18,K.y);}T(r[0],36,y+1,i===sel?K.y:i===6?K.g:K.w,1);T(r[1],36,y+9,K.gr,1);});
   T(sel===0?'LEFT/RIGHT: CHANGE WEAPON  A: START':sel===6?'A: BEGIN THE RUN':'A: BUY WITH SHADE (EARNED EVERY RUN)',160,207,K.c,1,'c');if(msgT)T(msg,160,22,K.y,1,'c');return;}
  drawFloor(z);
  if(roomKind==='rest'){const sx=PX(50,50),sy=PY(50,50);EL(sx,sy,20,10,'#4a5a6a');EL(sx,sy-2,17,8.5,fountain?'#2a4a5a':'#3fd0ff');R(sx-2,sy-14,4,12,'#6a7a8a');C(sx,sy-15,3,'#9ae8ff');if(!fountain){GL(sx,sy-4,26,'#3fd0ff',.4);for(let i=0;i<2;i++)A.fx.push({x:sx+rnd(4)-2,y:sy-16,vx:rnd(1)-.5,vy:-.8,t:18,c:'#bff4ff',g:.08});}}
  for(const s of spk){const ph=(A.t+s.o)%140,up=ph>=120&&ph<136,warn=ph>=100&&ph<120;quad([[PX(s.x+1,s.y+1),PY(s.x+1,s.y+1)],[PX(s.x+9,s.y+1),PY(s.x+9,s.y+1)],[PX(s.x+9,s.y+9),PY(s.x+9,s.y+9)],[PX(s.x+1,s.y+9),PY(s.x+1,s.y+9)]],warn&&A.t%6<3?'#6a2020':'#2a2228');
   for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=PX(s.x+2.5+i*2.5,s.y+2.5+j*2.5),y=PY(s.x+2.5+i*2.5,s.y+2.5+j*2.5);if(up)A.poly([[x-1.5,y],[x+1.5,y],[x,y-7]],'#d0d0e0',1);else R(x-.5,y-.5,1.5,1.5,'#000000');}}
  for(const f of fires){const x=PX(f.x,f.y),y=PY(f.x,f.y);if(f.heal){GL(x,y-4,9,'#3dff8b',.7);C(x,y-4+Math.sin(A.t*.1)*1.5,2.5,'#3dff8b');continue;}AL(Math.min(1,f.t/40));GL(x,y-2,7,'#ff7a2f',.8);C(x+Math.sin(A.t*.5+f.x)*1,y-3,1.6,'#ffd040');AL(1);}
  for(const t of tele){const x=PX(t.x,t.y),y=PY(t.x,t.y);if(t.k==='spawn'){AL(.6);ER(x,y,10*(1-t.t/40)+4,5*(1-t.t/40)+2,'#ff60ff',1.5);GL(x,y-6,10,'#b46bff',.6);AL(1);}else if(t.t>0){AL(.25+.25*Math.sin(A.t*.4));EL(x,y,t.r*1.98,t.r*.99,'#ff3030');AL(1);ER(x,y,t.r*1.98*(1-t.t/60),t.r*.99*(1-t.t/60),'#ffb0b0');}}
  for(const d of (doors.length?doors:[{x:50,y:0},{x:0,y:50}]))drawDoor(d);
  const list=[{y:p.x+p.y,f:drawPlayer}];for(const e of en)list.push({y:e.x+e.y,f:()=>drawEnemy(e)});for(const q of pil)list.push({y:q.x+q.y,f:()=>{const x=PX(q.x,q.y),y=PY(q.x,q.y),c=ZONE[z][1];EL(x,y+2,q.r*2.4,q.r*1.1,'rgba(0,0,0,.35)');R(x-q.r*1.3,y-30,q.r*2.6,30,A.mix(c,'#000000',.2));R(x-q.r*1.3,y-30,q.r*1.3,30,A.mix(c,'#ffffff',.08));R(x-q.r*1.6,y-34,q.r*3.2,5,A.mix(c,'#ffffff',.15));R(x-q.r*1.6,y-2,q.r*3.2,3,A.mix(c,'#000000',.4));}});
  if(orb)list.push({y:orb.x+orb.y,f:()=>{const x=PX(orb.x,orb.y),y=PY(orb.x,orb.y)-12+Math.sin(A.t*.1)*3;EL(x,y+12,6,3,'rgba(0,0,0,.3)');GL(x,y,18,orb.o&&orb.o.k==='boon'?PAT[orb.o.p][1]:'#ffffff',.6);icon(orb.o||{k:'shade'},x,y,1);}});
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  for(const s of ps){const x=PX(s.x,s.y),y=PY(s.x,s.y)-(s.k==='lodged'?2:10);if(s.k==='arrow')L(x,y,x-(s.vx-s.vy)*1.4*2,y-(s.vx+s.vy)*.7*2,s.sp?K.y:'#e0ffe0',1.5);else{GL(x,y,8,'#ff4f9a',.7);A.poly([[x,y-4],[x+2.5,y],[x,y+4],[x-2.5,y]],'#ff8ad0',1);}}
  if(p.spear){const s=p.spear,x=PX(s.x,s.y),y=PY(s.x,s.y)-10,a=A.t*.6;L(x-Math.cos(a)*7,y-Math.sin(a)*3,x+Math.cos(a)*7,y+Math.sin(a)*3,'#ffcf6a',2);}
  for(const s of shots){const x=PX(s.x,s.y),y=PY(s.x,s.y)-8;GL(x,y,s.big?9:7,s.big?'#ff3050':'#d060ff',.8);C(x,y,s.big?2.4:1.8,'#ffd0ff');}
  for(const s of slashes){const x=PX(s.x,s.y),y=PY(s.x,s.y)-(s.k>=3?0:10),a=Math.atan2((s.fx+s.fy)*.7,(s.fx-s.fy)*1.4),c=A.c,bc=lv('EMBER STRIKE')?'#ff9a4a':lv('GALE STRIKE')?'#fff27a':lv('RIPTIDE STRIKE')?'#7ad0ff':lv('HEX STRIKE')?'#d0a0ff':'#ffffff';AL(s.t/10);c.strokeStyle=s.col||(s.k>=3?(s.k===4?'#b46bff':'#7ad0ff'):bc);c.lineWidth=s.k===2?3:2;c.beginPath();
   if(c.ellipse){if(s.k===0)c.ellipse(x,y,s.r*1.4,s.r*.7,0,a-1.1*s.w,a+1.1*s.w);else if(s.k===1){c.moveTo(x,y);c.lineTo(x+Math.cos(a)*s.r*1.3,y+Math.sin(a)*s.r*.75);}else c.ellipse(x,y+(s.k>=3?0:6),s.r*1.98*(s.k>=3?1-s.t/20:1),s.r*.99*(s.k>=3?1-s.t/20:1),0,0,6.283);}c.stroke();AL(1);}
  for(const b of bolts){const x1=PX(b.a[0],b.a[1]),y1=PY(b.a[0],b.a[1])-(b.big?60:8),x2=PX(b.b[0],b.b[1]),y2=PY(b.b[0],b.b[1])-8;let px=x1,py=y1;for(let i=1;i<=5;i++){const nx=x1+(x2-x1)*i/5+(i<5?rnd(6)-3:0),ny=y1+(y2-y1)*i/5+(i<5?rnd(6)-3:0);L(px,py,nx,ny,i%2?'#fff27a':'#ffffff',b.big?2:1);px=nx;py=ny;}}
  for(const n of nums){AL(n.t/20);T(n.s,n.x,n.y,n.c,1,'c');AL(1);}
  /* HUD */
  R(0,0,W,12,'#0a0614');T(ZONE[z][0]+'  '+depth+'-'+Math.min(room,4),4,4,ZONE[z][4],1);A.poly([[W-50,3],[W-46,6],[W-50,9],[W-54,6]],'#b46bff',1);T(''+meta.shade,W-42,4,'#d8b0ff',1);T('SCORE '+g.score,190,4,K.w,1,'r');
  if(boss&&boss.hp>0){T('WARDEN OF DUSK',160,16,K.r,1,'c');BAR(80,23,160,4,boss.hp/boss.mhp,boss.ph===2?'#ff3030':'#c8a040','#300');}
  R(0,206,W,34,'#0a0614');R(0,206,W,1,ZONE[z][4]);BAR(6,212,96,7,p.hp/p.mhp,p.hp<p.mhp*.3?(A.t%20<10?K.r:'#ff8080'):'#e83a4a','#3a0a14');T(Math.ceil(p.hp)+'/'+p.mhp,54,213,K.w,1,'c');if(p.defy>0)T('+'+p.defy,106,213,K.y,1);
  T('DASH',6,224,K.gr,1);for(let i=0;i<1+meta.dash;i++)R(26+i*8,224,6,5,i<p.dashN?'#8a7aff':'#2a2440');T('CAST',48,224,K.gr,1);for(let i=0;i<maxCast();i++)A.poly([[71+i*7,223],[73.5+i*7,226.5],[71+i*7,230],[68.5+i*7,226.5]],i<p.cast?'#ff8ad0':'#3a2440',1);
  T(WEP[p.wep][0],6,233,WEP[p.wep][2],1);let bx=120;for(const b in boons){const d=BD[b],col=d[1]===5?'#ffffff':PAT[d[0]][1];R(bx,212,11,11,'#1a1430');A.box(bx,212,11,11,col);T(SL[d[1]][0],bx+6,215,col,1,'c');if(boons[b].lv>1)T(''+boons[b].lv,bx+9,225,K.w,1,'c');bx+=13;if(bx>W-14)break;}
  if(!Object.keys(boons).length)T('NO BOONS YET',120,215,K.gr,1);
  if(msgT){AL(Math.min(1,msgT/20));T(msg,160,186,K.y,1,'c');AL(1);}if(fade>0){AL(fade/30);R(0,0,W,H,'#000000');AL(1);}
  if(st==='menu'&&menu){PANEL(14,32,292,176,menu.col,.95);T(menu.title,160,38,menu.col,2,'c');T('CHOOSE ONE',160,50,K.gr,1,'c');menu.opts.forEach((o,i)=>{const y=60+i*46,d=BD[o.n],on=i===menu.i,col=d[1]===5?'#ffffff':PAT[d[0]][1];R(20,y,280,42,on?'#2a1a4a':'#140c28');A.box(20,y,280,42,on?K.y:'#3a2a5a');
   T(o.n,26,y+5,col,2);const rar=o.up?'LEVEL UP > '+o.lv:d[1]===5?'DUO':['','COMMON','RARE','EPIC'][o.lv];T(SL[d[1]]+'  '+rar,294,y+7,o.lv===3?'#ff8aff':o.lv===2?'#5ab0ff':K.gr,1,'r');T(d[2](o.lv),26,y+21,K.w,1);
   const rep=Object.keys(boons).find(b=>b!==o.n&&BD[b][1]===d[1]&&d[1]<4);if(rep&&!o.up)T('REPLACES '+rep,26,y+31,K.o,1);});}
  if(st==='dead'){AL(Math.min(.7,deadT/80));R(0,0,W,H,'#300008');AL(1);T('YOU HAVE FALLEN',160,100,K.r,3,'c');}
 };
 return g;}});

/* ---- KITCHEN CHAOS: co-op / versus cooking ---- */
A.add({id:'kitchenchaos',name:'KITCHEN CHAOS',cat:'PARTY',vs:1,time:430,tags:'overcooked cooking kitchen chef co-op',
how:'ARROWS MOVE, A PICKS UP / PUTS DOWN, HOLD B TO CHOP, WASH OR SPRAY. COOK, PLATE, SERVE!',make(){
 const g={over:null,score:0},TS=20,OX=10,OY=36,CW=15,CH=9;
 const REC=[{n:'TOMATO SOUP',c:['ST']},{n:'ONION SOUP',c:['SO']},{n:'BURGER',c:['B','P']},{n:'DELUXE BURGER',c:['B','L','P']},{n:'SALAD',c:['L','T']}];
 const KIT=[
  {n:'CORNER BISTRO',menu:[0,1],hz:'TROLLEY ON THE LOOSE',fl:['#d8c49a','#c8b286'],ct:'#8a5a3a',map:['#T#O#X#SSS#####','#.............#','#.............V','#....##E##....V','#.............#','#.............Z','#.............#','#.............#','#W#R#DD##X#####']},
  {n:'CONVEYOR CAFE',menu:[2,3,4],hz:'SLIDING ISLAND',fl:['#a8c8d0','#98b8c4'],ct:'#5a6a7a',map:['#BB#MM#LL#TT###','#.............#','X.............#','#>>>>>>>>>....V','#.............V','X.............#','#.............Z','#........E....#','#W#R#DD##PP#X##']},
  {n:'SHIP GALLEY',menu:[0,4,3],hz:'ROUGH SEAS AND DRAWBRIDGES',fl:['#c09a6a','#b08a5a'],ct:'#6a4a2a',map:['#TL#SS#~#PP#BM#','#......~......#','X......b......V','#......~......#','#..E...#......#','#......~......V','X......b......#','#......~......#','#W#R#DD~X#X#Z##']},
  {n:'FOOD TRUCK',menu:[0,1,2,3,4],hz:'TRAFFIC!',fl:['#c8c0b0','#b8b0a0'],ct:'#b03a2a',map:['#T#O#M#SS#PP#B#','#.............#','X.............#','#.............L','_______________','#.............V','X.............V','#....E........Z','#W#R#DD#X######']}];
 const ING={T:['TOMATO','#e8402a'],O:['ONION','#e8d0a0'],L:['LETTUCE','#5ac040'],M:['MEAT','#d06070'],B:['BUN','#e0a050']};
 let mode=-1,msel=0,mT=0,ki=-1,kt=0,tiles,it,fire,orders=[],oT=0,sc=[0,0],kSc=[0,0],stars=0,chefs=[],dirtyQ=[],sumT=0,hz={},msg='',msgT=0,total=[0,0];
 const KT=5400;
 const cellAt=(x,y)=>[Math.floor(x/TS),Math.floor(y/TS)];
 const tl=(x,y)=>x<0||y<0||x>=CW||y>=CH?'#':tiles[y][x];
 const isCounter=c=>'#TOLMBXSPDWRVZE>='.includes(c);
 const walk=(x,y,ai)=>{const c=tl(x,y);if(c==='.')return!(hz.isl&&hz.isl.some(q=>q[0]===x&&q[1]===y));if(c==='_')return!(ai&&hz.car&&hz.warn>0);if(c==='b')return hz.bridge&&hz.bridge[y]===1;return false;};
 const comp=i=>!i||i.k!=='ing'||i.burnt?null:i.t==='B'?'B':i.t==='M'?(i.s===2?'P':null):(i.s===1&&(i.t==='L'||i.t==='T'))?i.t:null;
 const menuR=()=>KIT[ki].menu.map(m=>REC[m]);
 const msub=(have,want)=>{const w=want.slice();for(const h of have){const j=w.indexOf(h);if(j<0)return false;w.splice(j,1);}return true;};
 const accepts=(plate,c)=>c&&menuR().some(r=>msub(plate.c.concat([c]),r.c));
 const exact=plate=>orders.findIndex(o=>o.c.length===plate.c.length&&msub(plate.c,o.c));
 function loadKitchen(i){ki=i;kt=0;const K_=KIT[i];tiles=K_.map.map(r=>r.split(''));it=[];fire=[];for(let y=0;y<CH;y++){it.push([]);fire.push([]);for(let x=0;x<CW;x++){const c=tiles[y][x];fire[y].push(0);it[y].push(c==='S'?{k:'pot',c:[],t:0}:c==='P'?{k:'pan',c:[],t:0}:c==='D'?{k:'plates',n:2}:c==='E'?{k:'ext'}:c==='W'?{k:'sink',d:0,cl:0,w:0}:null);}}
  orders=[];oT=60;kSc=[0,0];dirtyQ=[];hz={t:0};if(i===0)hz.cart={x:40,y:6*TS+10,v:1.1};if(i===1){hz.isl=[[4,5],[5,5]];hz.dir=1;hz.isl.forEach(q=>{tiles[q[1]][q[0]]='=';});}if(i===2)hz.bridge={2:1,6:0},hz.rock=0;if(i===3)hz.car=null,hz.warn=0,hz.next=300;
  const st=[[3,4],[11,4]];if(i===3){st[0]=[3,2];st[1]=[11,6];}if(i===2){st[0]=[3,3];st[1]=[11,3];}
  chefs.forEach((c,j)=>{c.x=st[j][0]*TS+10;c.y=st[j][1]*TS+10;c.hold=null;c.task=null;c.stun=0;c.prog=0;c.fx=0;c.fy=-1;});msg=K_.n+': '+K_.hz;msgT=150;}
 function startGame(m){mode=m;chefs=[{p:0,team:0,ai:false,c:'#ffffff',sh:'#3a7bd5'},{p:1,team:m===1?1:0,ai:!A.two,c:'#ffffff',sh:'#e8452a'}];total=[0,0];stars=0;loadKitchen(0);}
 const say=(m,t)=>{msg=m;msgT=t||90;};
 /* item placement */
 function place(ch,x,y){const t=tl(x,y);if(fire[y]&&fire[y][x]>.05){say('PUT THE FIRE OUT FIRST!',60);S('lose');return;}const h=ch.hold,cur=it[y][x];
  if(t==='V'){if(h&&h.k==='plate'){const o=exact(h);if(o>=0){const od=orders[o],tip=Math.round(8*od.t/od.max),pts=20+tip;orders.splice(o,1);ch.hold=null;const tm=mode===1?ch.team:0;sc[tm]+=pts;kSc[tm]+=pts;total[tm]+=pts;dirtyQ.push(360);S('score');A.burst(OX+x*TS+10,OY+y*TS+10,K.y,22,2.5);say((mode===1?(ch.team?(A.two?'P2':'CPU'):'P1')+' SERVED ':'SERVED ')+od.n+' +'+pts,70);}else{say('NOBODY ORDERED THAT',60);S('lose');}}else S('blip');return;}
  if(t==='Z'){if(!h)return;if(h.k==='pot'||h.k==='pan'){h.c=[];h.t=0;h.done=0;h.burnt=0;h.bt=0;}else if(h.k==='plate'){h.c=[];}else if(h.k==='ext'||h.k==='dirty')return;else ch.hold=null;S('hit');return;}
  if(t==='W'){if(!h&&cur.cl>0){cur.cl--;ch.hold={k:'plate',c:[]};S('blip');}else if(h&&h.k==='dirty'){cur.d+=h.n;ch.hold=null;S('blip');}return;}
  if(t==='R'){if(!h&&cur&&cur.n){ch.hold=cur;it[y][x]=null;S('blip');}return;}
  if('TOLMB'.includes(t)&&!cur){if(!h){ch.hold={k:'ing',t,s:0};S('blip');}else if(h.k==='plate'&&t==='B'&&accepts(h,'B')){h.c.push('B');S('blip');}return;}
  if(!isCounter(t))return;
  if(!h){if(!cur)return;if(cur.k==='plates'){cur.n--;ch.hold={k:'plate',c:[]};if(cur.n<=0)it[y][x]=null;S('blip');return;}if(cur.k==='pan'&&cur.done&&!cur.burnt){ch.hold={k:'ing',t:'M',s:2};cur.c=[];cur.done=0;cur.t=0;cur.bt=0;S('blip');return;}ch.hold=cur;it[y][x]=null;ch.prog=0;S('blip');return;}
  if(!cur){if((t==='S'&&h.k!=='pot')||(t==='P'&&h.k!=='pan')){if(h.k==='ing'){say('USE A '+(t==='S'?'POT':'PAN'),40);}return;}if(t==='X'&&h.k!=='ing')return;it[y][x]=h;ch.hold=null;S('blip');return;}
  /* combining */
  if(h.k==='plate'){if(cur.k==='pot'||cur.k==='pan'){if(cur.done&&!cur.burnt){const c=cur.k==='pot'?'S'+cur.c[0]:'P';if(accepts(h,c)){h.c.push(c);cur.c=[];cur.t=0;cur.done=0;cur.bt=0;S('coin');}else say('THAT DOESN\'T GO ON THIS PLATE',50);}return;}
   const c=comp(cur);if(c&&accepts(h,c)){h.c.push(c);it[y][x]=null;S('blip');}else if(cur.k==='plate'&&!cur.c.length){/*stack*/}return;}
  if(h.k==='ing'){if(cur.k==='pot'&&!cur.burnt&&h.s===1&&(h.t==='T'||h.t==='O')&&cur.c.length<3&&(!cur.c.length||cur.c[0]===h.t)){cur.c.push(h.t);ch.hold=null;S('blip');return;}
   if(cur.k==='pan'&&!cur.burnt&&h.t==='M'&&h.s===1&&!cur.c.length){cur.c.push('M');ch.hold=null;S('blip');return;}
   if(cur.k==='plate'){const c=comp(h);if(c&&accepts(cur,c)){cur.c.push(c);ch.hold=null;S('blip');}return;}
   if((cur.k==='pot'||cur.k==='pan')&&h.s===0){say('CHOP IT FIRST (HOLD B ON A BOARD)',60);}return;}
  if((h.k==='pot'||h.k==='pan')&&cur.k==='plate'&&h.done&&!h.burnt){const c=h.k==='pot'?'S'+h.c[0]:'P';if(accepts(cur,c)){cur.c.push(c);h.c=[];h.t=0;h.done=0;h.bt=0;S('coin');}return;}}
 const front=ch=>{const[cx,cy]=cellAt(ch.x,ch.y);return[cx+ch.fx,cy+ch.fy];};
 function use(ch){const[x,y]=front(ch),t=tl(x,y);if(y<0||y>=CH||x<0||x>=CW)return false;const cur=it[y][x];
  if(ch.hold&&ch.hold.k==='ext'){let any=false;for(const[dx,dy]of[[0,0],[ch.fy,ch.fx],[-ch.fy,-ch.fx],[ch.fx,ch.fy]]){const X=x+dx,Y=y+dy;if(fire[Y]&&fire[Y][X]>0){fire[Y][X]=Math.max(0,fire[Y][X]-.025);any=true;}}if(A.t%3===0)A.fx.push({x:OX+ch.x+ch.fx*12,y:OY+ch.y+ch.fy*12-6,vx:ch.fx*1.5+rnd(1)-.5,vy:ch.fy*1.5+rnd(1)-.5,t:20,c:'#ffffff',g:0});return any;}
  if(ch.hold)return false;if(fire[y][x]>.05)return false;
  if(t==='X'&&cur&&cur.k==='ing'&&cur.s===0&&cur.t!=='B'){ch.prog++;if(A.t%10===0){S('hit');A.burst(OX+x*TS+10,OY+y*TS+8,ING[cur.t][1],3,1);}if(ch.prog>=55){cur.s=1;ch.prog=0;S('coin');}return true;}
  if(t==='W'&&cur.d>0){cur.w++;if(A.t%12===0)A.burst(OX+x*TS+10,OY+y*TS+6,'#bfe8ff',4,1);if(cur.w>=70){cur.w=0;cur.d--;cur.cl++;S('coin');}return true;}return false;}
 /* ---------- CPU chef ---------- */
 function bfs(ch,targets){const[sx,sy]=cellAt(ch.x,ch.y);const goal=new Map();for(const t of targets)for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const X=t[0]+dx,Y=t[1]+dy;if(walk(X,Y,1)||(X===sx&&Y===sy))if(!goal.has(X+','+Y))goal.set(X+','+Y,[t[0],t[1]]);}
  const prev=new Map([[sx+','+sy,null]]),q=[[sx,sy]];while(q.length){const[cx,cy]=q.shift(),key=cx+','+cy;if(goal.has(key)){let k=key,path=[];while(k){path.unshift(k);k=prev.get(k);}const nxt=(path[1]||path[0]).split(',').map(Number);return{next:nxt,stand:[cx,cy],tile:goal.get(key)};}
   for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const X=cx+dx,Y=cy+dy,k2=X+','+Y;if(!prev.has(k2)&&walk(X,Y,1)){prev.set(k2,key);q.push([X,Y]);}}}return null;}
 const find=f=>{const o=[];for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(f(tl(x,y),it[y][x],x,y)&&!(fire[y][x]>.05))o.push([x,y]);return o;};
 function needs(){const need={T:0,O:0,L:0,M:0,B:0},have={T:0,O:0,L:0,M:0,B:0};const add=(c,o)=>{if(c==='ST')o.T+=3;else if(c==='SO')o.O+=3;else if(c==='P')o.M++;else if(o[c]!==undefined)o[c]++;};
  orders.slice(0,2).forEach(od=>od.c.forEach(c=>add(c,need)));
  const cnt=i=>{if(!i)return;if(i.k==='ing'&&!i.burnt)have[i.t]++;else if(i.k==='pot'&&!i.burnt){i.c.forEach(t=>have[t]++);}else if(i.k==='pan'&&!i.burnt&&i.c.length)have.M++;else if(i.k==='plate')i.c.forEach(c=>add(c,have));};
  for(const row of it)row.forEach(cnt);chefs.forEach(c=>cnt(c.hold));return Object.keys(need).filter(k=>need[k]>have[k]);}
 function decide(ch){const h=ch.hold,mine=(i)=>true;
  if(fire.some(r=>r.some(v=>v>0))){if(h&&h.k==='ext')return{t:find((t,i,x,y)=>false).concat(fireTiles()),act:'b',chk:()=>fire.some(r=>r.some(v=>v>0))};if(!h){const e=find((t,i)=>i&&i.k==='ext');const held=chefs.some(c=>c.hold&&c.hold.k==='ext');if(e.length&&!held)return{t:e,act:'a'};}}
  if(h){if(h.k==='ext'){const f=find((t,i)=>isCounter(t)&&!i&&'#E'.includes(t));return{t:f,act:'a'};}
   if(h.k==='dirty')return{t:find(t=>t==='W'),act:'a'};
   if(h.k==='plate'){if(h.c.length&&!orders.some(o=>msub(h.c,o.c)))return{t:find(t=>t==='Z'),act:'a'};if(h.c.length&&exact(h)>=0)return{t:find(t=>t==='V'),act:'a'};
    const cook=find((t,i)=>i&&(i.k==='pot'||i.k==='pan')&&i.done&&!i.burnt&&accepts(h,i.k==='pot'?'S'+i.c[0]:'P'));if(cook.length)return{t:cook,act:'a'};
    const loose=find((t,i)=>i&&i.k==='ing'&&comp(i)&&accepts(h,comp(i))&&t!=='X');if(loose.length)return{t:loose,act:'a'};
    const bun=h.c.length<3&&accepts(h,'B')&&needs().includes('B')?find((t,i)=>t==='B'&&!i):[];if(bun.length)return{t:bun,act:'a'};
    const free=find((t,i)=>(t==='#'||t==='E')&&!i);return{t:nearV(free),act:'a'};}
   if(h.k==='pot'||h.k==='pan'){if(h.burnt||(h.k==='pot'&&!h.c.length&&false))return{t:find(t=>t==='Z'),act:'a'};return{t:find((t,i)=>t===(h.k==='pot'?'S':'P')&&!i),act:'a'};}
   if(h.k==='ing'){if(h.burnt)return{t:find(t=>t==='Z'),act:'a'};
    if(h.s===0&&h.t!=='B')return{t:find((t,i)=>t==='X'&&!i),act:'a'};
    if(h.t==='T'||h.t==='O'){const wantSoup=orders.some(o=>o.c.includes('S'+h.t));const pot=find((t,i)=>i&&i.k==='pot'&&!i.burnt&&!i.done&&i.c.length<3&&(!i.c.length||i.c[0]===h.t)&&t==='S');const part=pot.filter(p=>it[p[1]][p[0]].c.length>0);if(wantSoup&&(part.length||pot.length)&&!(h.t==='T'&&orders.some(o=>o.c.includes('T'))&&!part.length&&!orders.slice(0,2).some(o=>o.c.includes('ST'))))return{t:part.length?part:pot,act:'a'};}
    if(h.t==='M'&&h.s===1)return{t:find((t,i)=>i&&i.k==='pan'&&!i.c.length&&!i.burnt),act:'a'};
    const pl=find((t,i)=>i&&i.k==='plate'&&comp(h)&&accepts(i,comp(h)));if(pl.length)return{t:pl,act:'a'};
    return{t:nearV(find((t,i)=>t==='#'&&!i)),act:'a'};}}
  /* empty hands */
  const ready=find((t,i)=>i&&i.k==='plate'&&i.c.length&&exact(i)>=0);if(ready.length)return{t:ready,act:'a'};
  const burnt=find((t,i)=>i&&(i.k==='pot'||i.k==='pan')&&i.burnt);if(burnt.length)return{t:burnt,act:'a'};
  const done=find((t,i)=>i&&(i.k==='pot'||i.k==='pan')&&i.done&&!i.burnt);if(done.length){const plates=find((t,i)=>i&&i.k==='plate'&&done.some(d=>{const q=it[d[1]][d[0]];return accepts(i,q.k==='pot'?'S'+q.c[0]:'P');}));if(plates.length)return{t:plates,act:'a'};const st=find((t,i)=>(i&&i.k==='plates')||(t==='W'&&i.cl>0));if(st.length)return{t:st,act:'a'};}
  const chop=find((t,i)=>t==='X'&&i&&i.k==='ing'&&i.s===0);if(chop.length&&!chefs.some(c=>c!==ch&&c.task&&c.task.act==='b'&&c.task.t.some(q=>chop.some(z=>z[0]===q[0]&&z[1]===q[1]))))return{t:chop,act:'b',chk:()=>{const[x,y]=front(ch);const i=it[y]&&it[y][x];return i&&i.k==='ing'&&i.s===0;}};
  const chopped=find((t,i)=>t==='X'&&i&&i.k==='ing'&&i.s===1);if(chopped.length)return{t:chopped,act:'a'};
  const looseC=find((t,i)=>i&&i.k==='ing'&&comp(i)&&t!=='X'&&orders.some(o=>o.c.includes(comp(i))));if(looseC.length){const pOn=find((t,i)=>i&&i.k==='plate'&&looseC.some(q=>accepts(i,comp(it[q[1]][q[0]]))));if(pOn.length)return{t:pOn,act:'a'};const st=find((t,i)=>(i&&i.k==='plates')||(t==='W'&&i.cl>0));if(st.length)return{t:st,act:'a'};}
  const dirty=find((t,i)=>t==='R'&&i&&i.n>0),sinkD=find((t,i)=>t==='W'&&i.d>0),clean=find((t,i)=>(i&&i.k==='plates')).length+find((t,i)=>t==='W'&&i.cl>0).length;
  if(sinkD.length&&clean<1)return{t:sinkD,act:'b',chk:()=>{const[x,y]=front(ch);const i=it[y]&&it[y][x];return i&&i.d>0;}};
  if(dirty.length&&clean<1)return{t:dirty,act:'a'};
  const junk=find((t,i)=>i&&i.k==='plate'&&i.c.length&&!orders.some(o=>msub(i.c,o.c)));if(junk.length&&orders.length)return{t:junk,act:'a'};
  const n=needs();const others=chefs.filter(c=>c!==ch&&c.ai&&c.want).map(c=>c.want);const pickN=n.find(k=>!others.includes(k))||n[0];
  if(pickN){ch.want=pickN;const cr=find((t,i)=>t===pickN&&!i);if(cr.length)return{t:cr,act:'a'};}
  const plate=find((t,i)=>i&&i.k==='plates');const onC=find((t,i)=>i&&i.k==='plate');if(!onC.length&&plate.length&&orders.length)return{t:plate,act:'a'};
  if(sinkD.length)return{t:sinkD,act:'b',chk:()=>{const[x,y]=front(ch);const i=it[y]&&it[y][x];return i&&i.d>0;}};if(dirty.length)return{t:dirty,act:'a'};
  return null;}
 const fireTiles=()=>{const o=[];for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(fire[y][x]>0)o.push([x,y]);return o;};
 const nearV=list=>{const v=find(t=>t==='V')[0]||[14,4];return list.sort((a,b)=>Math.abs(a[0]-v[0])+Math.abs(a[1]-v[1])-Math.abs(b[0]-v[0])-Math.abs(b[1]-v[1])).slice(0,3);};
 function aiChef(ch){if(ch.wait>0){ch.wait--;return null;}if(!ch.task){const d=decide(ch);if(!d||!d.t||!d.t.length){ch.wait=20;return null;}ch.task=d;ch.tt=0;}const T_=ch.task;T_.tt=(T_.tt||0)+1;if(T_.tt>600){ch.task=null;ch.wait=10;return null;}
  const r=bfs(ch,T_.t);if(!r){ch.task=null;ch.wait=25;return null;}const[cx,cy]=cellAt(ch.x,ch.y);const tx=r.next[0]*TS+10,ty=r.next[1]*TS+10;
  if(cx===r.stand[0]&&cy===r.stand[1]){const dx=ch.x-(cx*TS+10),dy=ch.y-(cy*TS+10);ch.fx=Math.sign(r.tile[0]-cx);ch.fy=Math.sign(r.tile[1]-cy);if(Math.abs(dx)>3||Math.abs(dy)>3)return{x:-Math.sign(dx)*(Math.abs(dx)>1),y:-Math.sign(dy)*(Math.abs(dy)>1),keep:1};
   if(T_.act==='a'){place(ch,r.tile[0],r.tile[1]);ch.task=null;ch.wait=Math.round(5+18*(1-A.ai));return null;}if(!use(ch)||(T_.chk&&!T_.chk())){T_.b=(T_.b||0)+1;if(T_.b>8){ch.task=null;ch.wait=8;}}return null;}
  return{x:Math.sign(tx-ch.x)*(Math.abs(tx-ch.x)>1),y:Math.sign(ty-ch.y)*(Math.abs(ty-ch.y)>1)};}
 /* ---------- update ---------- */
 const blockedPx=(x,y,ch)=>{for(const[dx,dy]of[[-6,-6],[6,-6],[-6,6],[6,6]]){const[cx,cy]=cellAt(x+dx,y+dy);if(!walk(cx,cy,0))return true;}return false;};
 function moveChef(ch,mx,my,sp){if(mx&&my){mx*=.72;my*=.72;}const nx=ch.x+mx*sp,ny=ch.y+my*sp,stuck=blockedPx(ch.x,ch.y,ch);if(stuck||!blockedPx(nx,ch.y,ch))ch.x=cl(nx,8,CW*TS-8);if(stuck||!blockedPx(ch.x,ny,ch))ch.y=cl(ny,8,CH*TS-8);}
 function fireOn(x,y){if(fire[y]&&fire[y][x]<=0){fire[y][x]=1;S('boom');say('FIRE! GRAB THE EXTINGUISHER',90);}}
 g.update=()=>{if(msgT)msgT--;
  if(mode<0){mT++;const h=A.hit(0);if(h.l||h.r){msel^=1;S('blip');}if(mouseOn())for(let i=0;i<2;i++)if(hit2(A.mouse.x,A.mouse.y,40+i*130,96,110,70))msel=i;if((h.a&&mT>10)||mT>300){startGame(msel);S('coin');}return;}
  if(sumT>0){sumT--;if(sumT===0){if(ki<3)loadKitchen(ki+1);else{if(mode===0)g.over='SERVICE COMPLETE - '+stars+'/12 STARS';else g.over=total[0]===total[1]?'DRAW!':A.win(total[0]>total[1]?0:1);}}return;}
  kt++;hz.t++;
  /* orders */
  if(--oT<=0&&orders.length<4){const m=KIT[ki].menu,r=REC[m[ri(m.length)]],max=2700-ki*150;orders.push({n:r.n,c:r.c.slice(),t:max,max});oT=Math.max(540,840-ki*60-kt/30);S('blip');}
  for(const o of orders){o.t--;}const ex=orders.filter(o=>o.t<=0);if(ex.length){orders=orders.filter(o=>o.t>0);if(mode===0){sc[0]-=10;kSc[0]-=10;total[0]-=10;}S('lose');say('AN ORDER EXPIRED',60);}
  for(let i=dirtyQ.length-1;i>=0;i--)if(--dirtyQ[i]<=0){dirtyQ.splice(i,1);const r=find(t=>t==='R')[0];if(r){const c=it[r[1]][r[0]];if(c)c.n++;else it[r[1]][r[0]]={k:'dirty',n:1};}}
  /* cooking & fire */
  if(A.t%30===0)for(const r of it)for(const i of r)if(i)i.mv=0;
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const i=it[y][x],t=tiles[y][x];if(i&&(i.k==='pot'||i.k==='pan')&&(t==='S'||t==='P')&&fire[y][x]<=0&&!i.burnt){const full=i.k==='pot'?i.c.length===3:i.c.length===1;if(full&&!i.done){i.t++;if(i.t>=(i.k==='pot'?300:220)){i.done=1;i.bt=0;S('coin');}}else if(i.done){i.bt++;if(i.bt>240&&A.t%30===0)S('blip');if(i.bt>480){i.burnt=1;fireOn(x,y);}}}
   if(ki===1&&t==='>'&&i&&A.t%30===0&&tl(x+1,y)==='>'&&!it[y][x+1]&&!i.mv){it[y][x+1]=i;it[y][x]=null;i.mv=1;}
   if(fire[y][x]>0&&A.t%240===0&&Math.random()<.5){const d=[[1,0],[-1,0],[0,1],[0,-1]][ri(4)],X=x+d[0],Y=y+d[1];if(isCounter(tl(X,Y))&&tl(X,Y)!=='V')fireOn(X,Y);}}
  /* hazards */
  if(hz.cart){const c=hz.cart;c.x+=c.v;if(c.x<30||c.x>CW*TS-30)c.v*=-1;for(const ch of chefs)if(Math.abs(ch.x-c.x)<16&&Math.abs(ch.y-c.y)<12&&!ch.stun){ch.stun=24;ch.kx=Math.sign(c.v)*2.5;ch.ky=ch.y<c.y?-2:2;S('hit');A.shake=3;}}
  if(hz.isl&&hz.t%420===0){const nx=hz.isl[0][0]+hz.dir*3;if(nx<2||nx>10)hz.dir*=-1;const step=hz.dir*3;const old=hz.isl.map(q=>q.slice());const newC=old.map(q=>[q[0]+step,q[1]]);if(newC.every(q=>tl(q[0],q[1])==='.')){const items=old.map(q=>it[q[1]][q[0]]);old.forEach(q=>{tiles[q[1]][q[0]]='.';it[q[1]][q[0]]=null;});hz.isl=newC;newC.forEach((q,j)=>{tiles[q[1]][q[0]]='=';it[q[1]][q[0]]=items[j];});S('boom');A.shake=4;for(const ch of chefs){const[cx,cy]=cellAt(ch.x,ch.y);if(newC.some(q=>q[0]===cx&&q[1]===cy)){ch.y+=ch.y%TS<10?-12:12;ch.stun=20;}}chefs.forEach(c=>c.task=null);}}
  if(hz.bridge){if(hz.t%480===420)say('DRAWBRIDGES SWITCHING!',50);if(hz.t%480===0){hz.bridge[2]^=1;hz.bridge[6]^=1;S('boom');for(const ch of chefs){const[cx,cy]=cellAt(ch.x,ch.y);if(tl(cx,cy)==='b'&&!hz.bridge[cy]){ch.x=(cx+(ch.fx>0?-1:1))*TS+10;ch.stun=30;S('lose');}ch.task=null;}}
   hz.rock=Math.sin(hz.t/90)*(hz.t%1200>900?1:0);if(hz.t%1200===880)say('ROUGH SEAS - HOLD ON!',60);}
  if(hz.car!==undefined){if(hz.car){hz.car.x+=hz.car.v;for(const ch of chefs)if(Math.abs(ch.x-hz.car.x)<18&&Math.abs(ch.y-(4*TS+10))<12&&!ch.stun){ch.stun=40;ch.ky=ch.y<4*TS+10?-3:3;ch.kx=hz.car.v*.6;if(ch.hold&&ch.hold.k==='ing')ch.hold=null;S('boom');A.shake=6;say('SPLAT! WATCH THE ROAD',60);}if(hz.car.x<-40||hz.car.x>CW*TS+40)hz.car=null;}
   else{if(hz.warn>0){if(--hz.warn===0){const l=Math.random()<.5;hz.car={x:l?-30:CW*TS+30,v:l?4:-4,c:['#3a7bd5','#e8c03a','#3dbf6b'][ri(3)]};}}else if(--hz.next<=0){hz.warn=80;hz.next=280+ri(200);S('blip');}}}
  /* chefs */
  for(const ch of chefs){if(ch.stun>0){ch.stun--;moveChef(ch,ch.kx||0,ch.ky||0,1);ch.kx*=.85;ch.ky*=.85;continue;}
   let mx=0,my=0,useB=false,hitA=false;if(ch.ai){const o=aiChef(ch);if(o){mx=o.x;my=o.y;}}else{const k=A.in(ch.p),h=A.hit(ch.p);mx=ax(k);my=ay(k);useB=k.b;hitA=h.a;if(mx||my){if(Math.abs(mx)>=Math.abs(my)&&mx){ch.fx=mx;ch.fy=0;}else{ch.fx=0;ch.fy=my;}}}
   if(hz.rock)mx+=hz.rock*.6;const sp=ch.ai?1.15+.45*A.ai:1.55;if(mx||my){moveChef(ch,mx,my,sp);ch.st=(ch.st||0)+.3;}
   if(!ch.ai){if(hitA){const[x,y]=front(ch);if(x>=0&&y>=0&&x<CW&&y<CH)place(ch,x,y);}if(useB)use(ch);else ch.prog=0;}}
  if(kt>=KT){const t=mode===1?null:kSc[0];if(mode===0){const s=t>=200?3:t>=130?2:t>=60?1:0;stars+=s;msg=s+' STAR'+(s===1?'':'S');}sumT=200;S('win');A.confetti();}
  g.score=mode===1?sc[0]:total[0];};
 g.timeUp=()=>mode===1?(total[0]===total[1]?'TIME UP - DRAW':'TIME UP - '+(total[0]>total[1]?'P1 WINS':A.cpu?'CPU WINS':'P2 WINS')):'TIME UP - '+stars+' STARS, '+total[0]+' PTS';
 /* ---------- drawing ---------- */
 function drawIng(t,s,x,y,sz){sz=sz||1;const c=ING[t][1];if(s===2&&t==='M'){EL(x,y,5*sz,3*sz,'#6a3a1a');EL(x,y-1,4*sz,2*sz,'#8a4a2a');return;}if(s===1){for(let i=0;i<3;i++)C(x-3*sz+i*3*sz,y+(i%2)*sz,2.2*sz,c);return;}
  if(t==='B'){EL(x,y,5.5*sz,4*sz,c);EL(x-1,y-1.5*sz,3*sz,1.5*sz,'#f0c070');return;}if(t==='M'){R(x-4*sz,y-3*sz,8*sz,6*sz,c);R(x-2*sz,y-1*sz,3*sz,2*sz,'#f0a0b0');return;}C(x,y,4.5*sz,c);if(t==='T')R(x-1,y-5*sz,2,2,'#2a8a2a');if(t==='L')C(x+1,y-1,2*sz,'#8ae070');if(t==='O')L(x,y-5*sz,x,y-3,'#8a6a3a');}
 function drawPlate(p,x,y){EL(x,y+1,8,4,'rgba(0,0,0,.25)');EL(x,y,8,4,'#f4f4f8');EL(x,y,5.5,2.6,'#e0e0e8');p.c.forEach((c,i)=>{const yy=y-1-i*2;if(c[0]==='S'){EL(x,y-1,5,2.4,c==='ST'?'#e04a2a':'#e8c87a');}else if(c==='B')EL(x,yy-1,5,2.8,'#e0a050');else if(c==='P')EL(x,yy,4.5,2,'#6a3a1a');else if(c==='L')EL(x+(i%2),yy,5,1.8,'#5ac040');else if(c==='T'){C(x-2,yy,1.6,'#e8402a');C(x+2,yy,1.6,'#e8402a');}});}
 function drawItem(i,x,y){if(!i)return;if(i.k==='ing')drawIng(i.t,i.s,x,y);else if(i.k==='plate')drawPlate(i,x,y);else if(i.k==='plates'||i.k==='dirty'){for(let j=0;j<i.n;j++){EL(x,y+2-j*2,8,4,i.k==='dirty'?'#a89880':'#f4f4f8');if(i.k==='dirty')C(x-2+j,y+1-j*2,1,'#6a5a3a');}}
  else if(i.k==='pot'){R(x-10,y-2,3,2,'#444');R(x+7,y-2,3,2,'#444');EL(x,y+1,7,5,i.burnt?'#222':'#6a6a78');R(x-7,y-3,14,4,i.burnt?'#222':'#7a7a88');EL(x,y-3,7,2.6,i.burnt?'#333':'#b8b8c8');EL(x,y-3,5.5,1.8,i.c.length?(i.burnt?'#111':i.c[0]==='T'?'#e04a2a':'#e8c87a'):'#3a3a44');if(i.done&&!i.burnt&&A.t%20<10)A.fx.push({x:x+rnd(6)-3,y:y-5,vx:0,vy:-.5,t:14,c:'#ffffff',g:0});
   if(i.c.length&&!i.burnt){const f=i.done?1:i.c.length<3?i.c.length/3*.3:.3+.7*i.t/300;BAR(x-7,y-10,14,2,f,i.done?(i.bt>240&&A.t%10<5?K.r:K.g):K.y,'#222');for(let j=0;j<i.c.length;j++)C(x-4+j*4,y+8,1.3,ING[i.c[j]][1]);}}
  else if(i.k==='pan'){C(x,y,6,i.burnt?'#222':'#3a3a40');R(x+5,y-1,7,2,'#2a2a2a');if(i.c.length)EL(x,y,4,2.5,i.burnt?'#111':i.done?'#6a3a1a':'#d06070');if(i.c.length&&!i.burnt)BAR(x-7,y-10,14,2,i.done?1:i.t/220,i.done?(i.bt>240&&A.t%10<5?K.r:K.g):K.y,'#222');}
  else if(i.k==='ext'){R(x-3,y-8,6,12,'#e82a2a');R(x-2,y-10,4,2,'#333');R(x+2,y-9,4,1.5,'#333');}}
 function drawTile(x,y){const t=tiles[y][x],px=OX+x*TS,py=OY+y*TS,K_=KIT[ki];
  if(t==='.'||t==='b'||t==='_'){if(t==='_'){R(px,py,TS,TS,'#3a3a44');if(x%2===0)R(px+4,py+9,10,2,'#e8e0a0');return;}if(t==='b'){if(hz.bridge[y]){R(px,py,TS,TS,'#8a6a3a');for(let i=0;i<4;i++)R(px,py+i*5,TS,1,'#5a4020');}else{R(px,py,TS,TS,'#2a5a8a');R(px+2,py,3,TS,'#8a6a3a');R(px+15,py,3,TS,'#8a6a3a');}return;}R(px,py,TS,TS,(x+y)%2?K_.fl[0]:K_.fl[1]);AL(.12);R(px,py,TS,1,'#000000');R(px,py,1,TS,'#000000');if(y>0&&isCounter(tl(x,y-1))){AL(.2);R(px,py,TS,4,'#000000');}AL(1);return;}
  if(t==='~'){R(px,py,TS,TS,'#2a5a8a');AL(.4);R(px+((A.t/4+y*7)%TS),py+6,6,1,'#9ad8ff');R(px+((A.t/3+y*11+9)%TS),py+13,5,1,'#9ad8ff');AL(1);return;}
  const top=t==='>'?'#4a4a52':t==='='?'#a07a4a':A.mix(K_.ct,'#ffffff',.25);R(px,py,TS,TS-4,top);R(px,py+TS-4,TS,4,A.mix(K_.ct,'#000000',.35));A.box(px,py,TS,TS-4,A.mix(K_.ct,'#000000',.15));
  const cx=px+10,cy=py+8;
  if('TOLMB'.includes(t)){R(px+2,py+2,16,12,'#6a4a2a');R(px+3,py+3,14,10,'#8a6a3a');drawIng(t,0,cx,cy,.9);}
  else if(t==='X'){R(px+2,py+3,16,10,'#e8d0a0');R(px+2,py+11,16,2,'#c0a070');L(px+14,py+4,px+18,py+2,'#ccc',1);}
  else if(t==='S'||t==='P'){R(px+2,py+2,16,12,'#2a2a30');ER(cx,cy,6,3,fire[y][x]>0?'#ff6a2a':'#ff4020');}
  else if(t==='W'){R(px+2,py+2,16,11,'#d0e8f8');R(px+4,py+4,12,7,'#5ab0e8');}
  else if(t==='V'){R(px,py,TS,TS-4,'#3a3a44');R(px+2,py+2,16,10,'#c8c8d8');for(let i=0;i<3;i++)R(px+3+i*5,py+12,4,2,A.t%40<20?'#ffcf3f':'#e8a030');}
  else if(t==='Z'){R(px+4,py+2,12,12,'#4a4a52');R(px+3,py+1,14,3,'#6a6a72');}
  else if(t==='R'){R(px+2,py+3,16,10,'#5a5a64');T('R',cx,py+6,'#9a9aa4',1,'c');}
  else if(t==='>'){const o=(A.t/2)%6;for(let i=-6;i<TS;i+=6)if(i+o>=0&&i+o<TS-2)R(px+i+o,py+2,2,12,'#2a2a32');}
  else if(t==='D'){R(px+3,py+3,14,10,A.mix(K_.ct,'#ffffff',.15));}
  const w=y===0?'#':null;}
 g.draw=()=>{A.cls('#2a1a14');
  if(mode<0){GR(0,0,W,H,'#3a2a6a','#1a0a2a');T('KITCHEN CHAOS',160,22,K.y,3,'c');T('4 KITCHENS. ORDERS PILE UP. THINGS CATCH FIRE.',160,52,K.w,1,'c');T('CHOOSE A MODE',160,74,K.gr,1,'c');
   const L2=[['CO-OP',A.two?'P1 + P2 SHARE ONE KITCHEN':'YOU + A CPU SOUS-CHEF','EARN UP TO 12 STARS'],['VERSUS',A.two?'P1 VS P2 IN ONE KITCHEN':'YOU VS A CPU RIVAL CHEF','STEAL ORDERS, MOST POINTS WINS']];
   L2.forEach((m,i)=>{const x=40+i*130,on=msel===i;R(x,96,110,70,on?'#4a3a8a':'#241a44');A.box(x,96,110,70,on?K.y:'#5a4a8a');T(m[0],x+55,104,on?K.y:K.w,2,'c');T(m[1],x+55,124,K.w,1,'c');T(m[2],x+55,136,K.gr,1,'c');A.person(x+55,162,{s:.5,c:i?'#e8452a':'#3a7bd5',d:1});});
   T('LEFT/RIGHT TO PICK, A TO START',160,180,K.c,1,'c');T('A GRABS AND DROPS. HOLD B AT A BOARD TO CHOP, AT THE SINK TO WASH,',160,198,K.gr,1,'c');T('OR WITH THE RED EXTINGUISHER TO FIGHT FIRES.',160,207,K.gr,1,'c');return;}
  R(OX-4,OY-4,CW*TS+8,CH*TS+8,'#1a100a');
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)drawTile(x,y);
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const i=it[y][x];if(i&&tiles[y][x]!=='W')drawItem(i,OX+x*TS+10,OY+y*TS+8);if(tiles[y][x]==='W'){const s=it[y][x];if(s.d)drawItem({k:'dirty',n:Math.min(3,s.d)},OX+x*TS+10,OY+y*TS+8);if(s.cl)drawItem({k:'plates',n:Math.min(3,s.cl)},OX+x*TS+10,OY+y*TS+2);if(s.w)BAR(OX+x*TS+3,OY+y*TS-3,14,2,s.w/70,'#5ab0e8','#222');}
   if(fire[y][x]>0){const px=OX+x*TS+10,py=OY+y*TS+8,f=fire[y][x];GL(px,py,16*f,'#ff6a1a',.7);for(let j=0;j<3;j++){const fh=(6+Math.sin(A.t*.4+j*2+x)*3)*f;A.poly([[px-6+j*5,py+4],[px-2+j*5,py+4],[px-4+j*5,py-fh]],j%2?'#ffcf3f':'#ff6a1a',1);}}}
  if(hz.cart){const c=hz.cart,x=OX+c.x,y=OY+c.y;EL(x,y+7,14,3,'rgba(0,0,0,.3)');R(x-13,y-8,26,12,'#9aa0b0');R(x-13,y-8,26,3,'#c8ccd8');C(x-9,y+5,2.5,'#222');C(x+9,y+5,2.5,'#222');drawIng('B',0,x-5,y-10);drawIng('T',0,x+5,y-10);}
  if(hz.car!==undefined){const ry=OY+4*TS;if(hz.warn>0&&A.t%10<5){T('<<  CAR  >>',OX+CW*TS/2,ry+7,K.r,1,'c');}if(hz.car){const c=hz.car,x=OX+c.x;R(x-18,ry+2,36,16,c.c);R(x-10,ry+4,18,12,'#9ad8ff');C(x-11,ry+17,3,'#111');C(x+11,ry+17,3,'#111');R(c.v>0?x+16:x-18,ry+5,2,4,K.y);}}
  const list=chefs.slice().sort((a,b)=>a.y-b.y);for(const ch of list){const x=OX+ch.x,y=OY+ch.y+8;if(!ch.ai||true){const[fx,fy]=front(ch);if(fx>=0&&fy>=0&&fx<CW&&fy<CH&&!ch.ai){AL(.5+.3*Math.sin(A.t*.2));A.box(OX+fx*TS,OY+fy*TS,TS,TS-4,ch.p?'#ff8a6a':'#8ad0ff');AL(1);}}
   A.person(x,y,{s:.62,c:ch.sh,pants:'#2a2a3a',st:ch.st||0,d:ch.fx<0?-1:1,id:ch.p*3+1,arm1:ch.hold?-2.2:undefined,arm2:ch.hold?-2.2:undefined});C(x,y-21,4.2,'#ffffff');C(x-2.5,y-22,2.8,'#ffffff');C(x+2.5,y-22,2.8,'#ffffff');R(x-3.5,y-19,7,2,'#e8e8f0');
   if(ch.stun>0&&A.t%8<4)T('*',x,y-30,K.y,1,'c');if(ch.hold)drawItem(ch.hold,x+ch.fx*6,y-10+(ch.fy<0?-4:0));if(ch.prog>0)BAR(x-8,y-30,16,3,ch.prog/55,K.g,'#222');
   if(mode===1||ch.ai)T(ch.ai?'CPU':ch.p?'P2':'P1',x,y-34,ch.p?'#ff8a6a':'#8ad0ff',1,'c');}
  /* HUD */
  R(0,0,W,32,'#1a1028');orders.forEach((o,i)=>{const x=4+i*62,f=o.t/o.max;R(x,2,58,28,'#f8f0e0');A.box(x,2,58,28,f<.25&&A.t%20<10?K.r:'#c8b8a0');T(o.n,x+29,4,'#3a2a1a',1,'c');
   if(o.c[0][0]==='S')drawPlate({c:[o.c[0]]},x+29,18);else drawPlate({c:o.c},x+16,19);if(o.c[0][0]!=='S')o.c.forEach((c,j)=>{const ix=x+32+j*9,iy=18;if(c==='B')drawIng('B',ix,iy,.6);else if(c==='P')drawIng('M',ix,iy,.6);else drawIng(c,1,ix,iy,.5);});BAR(x+2,26,54,2,f,f>.5?K.g:f>.25?K.y:K.r,'#d8c8b0');});
  const left=Math.max(0,Math.ceil((KT-kt)/60));R(258,2,60,28,'#2a1a3a');T(left+'',288,5,left<=10&&A.t%30<15?K.r:K.w,2,'c');T(mode===1?'P1 '+sc[0]:'PTS '+total[0],288,17,'#8ad0ff',1,'c');if(mode===1)T((A.two?'P2 ':'CPU ')+sc[1],288,24,'#ff8a6a',1,'c');else T('STARS '+stars,288,24,K.y,1,'c');
  R(0,218,W,22,'#1a1028');T(KIT[ki].n+'  '+(ki+1)+'/4',6,224,K.y,1);if(mode===0){const k=kSc[0];[60,130,200].forEach((v,j)=>{const x=232+j*12;A.poly([[x,222],[x+2,226],[x+6,226],[x+3,229],[x+4,233],[x,230.5],[x-4,233],[x-3,229],[x-6,226],[x-2,226]],k>=v?K.y:'#4a3a5a',1);});T(k+'',272,226,K.w,1);}else T('MOST POINTS WINS',W-6,226,K.gr,1,'r');
  if(msgT&&!sumT){AL(Math.min(1,msgT/20)*.8);R(160-msg.length*2-6,OY+2,msg.length*4+12,11,'#000000');AL(Math.min(1,msgT/20));T(msg,160,OY+5,K.y,1,'c');AL(1);}
  if(sumT>0){PANEL(70,70,180,90,K.y);T(KIT[ki].n+' CLOSED',160,80,K.y,1,'c');if(mode===0){T('KITCHEN SCORE '+kSc[0],160,98,K.w,1,'c');T(msg,160,112,K.y,2,'c');}else{T('P1 '+kSc[0]+'   '+(A.two?'P2 ':'CPU ')+kSc[1],160,100,K.w,1,'c');T('TOTAL '+total[0]+' - '+total[1],160,114,K.y,1,'c');}T(ki<3?'NEXT: '+KIT[ki+1].n:'FINAL WHISTLE',160,140,K.gr,1,'c');}};
 return g;}});

/* ---- CHECKPOINT: border inspection ---- */
A.add({id:'checkpoint',name:'CHECKPOINT',cat:'PUZZLE',time:480,tags:'papers please border inspector documents',
how:'CLICK OR A ON TWO FIELDS THAT DISAGREE TO FLAG THEM, THEN STAMP APPROVE OR DENY.',make(){
 const g={over:null,score:0};
 const CT=[['VARNOVA',['MIREL','OSTA'],'#3a5a8a'],['KESTRIA',['ORVEL','DANZ'],'#8a3a3a'],['OLMAR',['TESK','VOLA'],'#3a7a4a'],['DRUZEK',['BRAN','KOLT'],'#6a4a8a'],['SALVET',['LUME','PIRA'],'#8a6a2a'],['TAURIN',['ZEMA','HARO'],'#2a6a7a']];
 const FM=['ANDRE','BORIS','EMIL','IVAN','MILO','PAVEL','SIMON','TOMAS','VIKTOR','OLEG'],FF=['ANNA','DARIA','ELENA','IRINA','LENA','MARTA','NADIA','SOFIA','VERA','ZORA'],LN=['KOVAC','ORLOV','BREN','MALEK','NOVAK','PETRA','RADEK','SOREL','VOLKOV','ZIMA','HALDEN','KESLER','DUROV','FENIK','LASKO','MIRO'];
 const HAIR=[['#1a1410','BLACK'],['#6a3a1a','BROWN'],['#e8c860','BLOND'],['#b84a1a','RED'],['#b8b8b8','GREY']],SKIN=['#f1c7a3','#e0a57c','#c68a5e','#9a6440','#6e4428'];
 const PURP=['VISIT','TRANSIT','WORK','STUDY'],JOB=['FARMING','MINING','FACTORY','DOCKS','BUILDING'];
 const fmt=n=>{const y=Math.floor(n/360),m=Math.floor(n%360/30)+1,d=n%30+1;return(80+y)+'.'+(m<10?'0':'')+m+'.'+(d<10?'0':'')+d;};
 const DAYLEN=3600,DAYS=6;
 let day=0,today=0,clock=0,credits=10,cit=0,stats=null,ent=null,phase='intro',pt=0,sel=null,cur='ent',msg='',msgT=0,msgC=K.w,vaccC=1,banC=2,queue=[],stampT=0,stamp=null,flagged=false,summary=false,hs=[],decided=0;
 const say=(m,c,t)=>{msg=m;msgC=c||K.w;msgT=t||160;};
 const rules=()=>{const r=[['valid','PASSPORT MUST NOT BE EXPIRED']];r.push(['cityh','ISSUING CITY MUST MATCH:']);if(day>=2)r.push(['permit','FOREIGNERS NEED AN ENTRY PERMIT']);if(day>=3)r.push(['id','CITIZENS NEED AN ID CARD']);if(day>=4)r.push(['work','WORK PURPOSE NEEDS A WORK PASS']);if(day>=5)r.push(['vacc',CT[vaccC][0]+' NEEDS A VACCINE CERT']);if(day>=6)r.push(['ban','NO ENTRY FROM '+CT[banC][0]]);return r;};
 function newEntrant(){const home=Math.random()<(day===1?.5:.35);let c=home?0:1+ri(5);if(day>=6&&c===banC&&Math.random()<.6)c=1+((c)%5);const sex=Math.random()<.5,first=(sex?FM:FF)[ri(10)],last=LN[ri(LN.length)],name=last+', '+first;
  const e={name,c,hair:ri(5),skin:ri(5),sex,shirt:['#5a5a6a','#7a4a3a','#3a5a4a','#4a4a7a','#8a7a5a'][ri(5)],dob:1930+ri(50),num:CT[c][0][0]+'-'+(10000+ri(89999)),city:CT[c][1][ri(2)],exp:today+20+ri(500),docs:{pp:1},purp:PURP[ri(4)],x:-60,st:'in',flaw:null,pairs:[],valid:true,line:['GOOD DAY, OFFICER.','HERE ARE MY DOCUMENTS.','I HAVE COME A LONG WAY.','PLEASE, IT IS COLD OUT.','HELLO.','I AM VISITING FAMILY.'][ri(6)]};
  e.photo=e.hair;if(c!==0&&day>=2){e.docs.pm={name,num:e.num,purp:e.purp,dur:(1+ri(6))+' MO',exp:today+10+ri(200)};if(e.purp==='WORK'&&day>=4)e.docs.wk={name,job:JOB[ri(5)],until:today+30+ri(300)};}
  if(c===0&&day>=3)e.docs.id={name,dob:e.dob,dist:['NORTH','EAST','RIVER','OLD TOWN'][ri(4)]};if(day>=5&&c===vaccC)e.docs.vc={name,vac:'GREY FEVER',exp:today+20+ri(300)};
  if(day>=6&&c===banC){e.valid=false;e.flaw='BANNED NATIONALITY';e.pairs=[['pp.cty','r.ban']];}
  else if(Math.random()<.42+day*.03){const F=['expired','city','photo'];if(c!==0&&day>=2)F.push('nopermit','pname','pnum','pexp');if(c===0&&day>=3)F.push('noid','idname','iddob');if(e.docs.wk)F.push('nowork','wname');if(e.docs.vc)F.push('novacc','vexp');const f=F[ri(F.length)];e.valid=false;
   const other=(l,v)=>{let o;do o=l[ri(l.length)];while(o===v);return o;};
   if(f==='expired'){e.exp=today-1-ri(200);e.flaw='PASSPORT EXPIRED';e.pairs=[['pp.exp','today'],['pp.exp','r.valid']];}
   else if(f==='city'){e.city=other(CT[(c+1+ri(5))%6][1],'');e.flaw='WRONG ISSUING CITY';e.pairs=[['pp.city','r.city'+c],['pp.city','r.cityh']];}
   else if(f==='photo'){e.photo=(e.hair+1+ri(4))%5;e.flaw='PHOTO DOES NOT MATCH';e.pairs=[['pp.photo','ent']];}
   else if(f==='nopermit'){delete e.docs.pm;delete e.docs.wk;e.flaw='NO ENTRY PERMIT';e.pairs=[['pp.cty','r.permit'],['ent','r.permit']];}
   else if(f==='pname'){e.docs.pm.name=LN[ri(LN.length)]+', '+first;if(e.docs.pm.name===name)e.docs.pm.name='VOSK, '+first;e.flaw='NAME MISMATCH ON PERMIT';e.pairs=[['pp.name','pm.name']];}
   else if(f==='pnum'){e.docs.pm.num=CT[c][0][0]+'-'+(10000+ri(89999));e.flaw='PASSPORT NUMBER MISMATCH';e.pairs=[['pp.num','pm.num']];}
   else if(f==='pexp'){e.docs.pm.exp=today-1-ri(60);e.flaw='PERMIT EXPIRED';e.pairs=[['pm.exp','today']];}
   else if(f==='noid'){delete e.docs.id;e.flaw='NO ID CARD';e.pairs=[['pp.cty','r.id'],['ent','r.id']];}
   else if(f==='idname'){e.docs.id.name=last+', '+other(sex?FM:FF,first);e.flaw='NAME MISMATCH ON ID';e.pairs=[['pp.name','id.name']];}
   else if(f==='iddob'){e.docs.id.dob=e.dob+(Math.random()<.5?-1:1)*(1+ri(9));e.flaw='DATE OF BIRTH MISMATCH';e.pairs=[['pp.dob','id.dob']];}
   else if(f==='nowork'){delete e.docs.wk;e.flaw='NO WORK PASS';e.pairs=[['pm.purp','r.work']];}
   else if(f==='wname'){e.docs.wk.name=LN[ri(LN.length)]+', '+first;if(e.docs.wk.name===name)e.docs.wk.name='VOSK, '+first;e.flaw='NAME MISMATCH ON WORK PASS';e.pairs=[['pp.name','wk.name'],['pm.name','wk.name']];}
   else if(f==='novacc'){delete e.docs.vc;e.flaw='NO VACCINE CERT';e.pairs=[['pp.cty','r.vacc'],['ent','r.vacc']];}
   else if(f==='vexp'){e.docs.vc.exp=today-1-ri(90);e.flaw='VACCINE CERT EXPIRED';e.pairs=[['vc.exp','today']];}}
  ent=e;sel=null;flagged=false;stamp=null;stampT=0;cur='ent';}
 function startDay(){day++;today=4*360+2*30+8+day;clock=0;cit=0;stats={n:0,ok:0,bad:0,pay:0,fine:0};vaccC=1+ri(5);do banC=1+ri(5);while(banC===vaccC);queue=[];for(let i=0;i<9;i++)queue.push({c:['#5a5a6a','#7a4a3a','#3a5a4a','#4a4a7a'][ri(4)],id:ri(6)});phase='play';newEntrant();
  say(['DAY 1: CHECK EXPIRY, CITIES AND PHOTOS.','DAY 2: FOREIGNERS NOW NEED ENTRY PERMITS.','DAY 3: CITIZENS NOW NEED ID CARDS.','DAY 4: WORKERS NEED A WORK PASS.','DAY 5: VACCINE RULE FOR '+CT[vaccC][0]+'.','DAY 6: '+CT[banC][0]+' IS BANNED.'][day-1],K.y,240);}
 /* hotspots */
 const DX=[[78,104],[154,104],[78,154],[154,154]];
 function docList(){if(!ent)return[];const o=[['pp',2,104,74,98]];let i=0;for(const k of ['pm','id','wk','vc'])if(ent.docs[k]){o.push([k,DX[i][0],DX[i][1],74,48]);i++;}return o;}
 function buildHS(){hs=[];if(!ent||ent.st!=='desk')return;const e=ent;hs.push({id:'ent',x:32,y:30,w:56,h:64,lab:'THE ENTRANT'});hs.push({id:'today',x:4,y:14,w:84,h:8,lab:'TODAY'});
  for(const[d,x,y]of docList()){const L_=(id,ly,txt)=>hs.push({id:d+'.'+id,x:x+2,y:y+ly-1,w:70,h:8,txt});
   if(d==='pp'){hs.push({id:'pp.cty',x:x+2,y:y+2,w:70,h:8});hs.push({id:'pp.photo',x:x+4,y:y+13,w:22,h:27});L_('name',44);L_('dob',53);L_('city',62);L_('num',71);L_('exp',80);}
   else if(d==='pm'){L_('name',12);L_('num',20);L_('purp',28);L_('exp',36);}else if(d==='id'){L_('name',12);L_('dob',20);}else if(d==='wk'){L_('name',12);L_('job',20);}else if(d==='vc'){L_('name',12);L_('exp',28);}}
  let y=24;for(const r of rules()){hs.push({id:'r.'+r[0],x:233,y:y-1,w:84,h:r[1].length>20?16:8});y+=r[1].length>20?16:8;if(r[0]==='cityh'){for(let i=0;i<6;i++){hs.push({id:'r.city'+i,x:233,y:y-1,w:84,h:8});y+=8;}}y+=2;}
  hs.push({id:'APPROVE',x:232,y:208,w:42,h:26});hs.push({id:'DENY',x:276,y:208,w:42,h:26});if(!hs.find(h=>h.id===cur))cur='ent';}
 const ctr=h=>[h.x+h.w/2,h.y+h.h/2];
 function navigate(dx,dy){const c=hs.find(h=>h.id===cur);if(!c){cur=hs[0]&&hs[0].id;return;}const[cx,cy]=ctr(c);let best=null,bs=1e9;for(const h of hs){if(h===c)continue;const[x,y]=ctr(h),vx=x-cx,vy=y-cy,along=vx*dx+vy*dy,perp=Math.abs(vx*dy-vy*dx);if(along<=1)continue;const s=along+perp*2.2;if(s<bs){bs=s;best=h;}}if(best){cur=best.id;S('blip');}}
 function activate(id){if(!ent||ent.st!=='desk')return;if(id==='APPROVE'||id==='DENY'){decide(id==='APPROVE');return;}
  if(!sel){sel=id;S('blip');say('NOW PICK WHAT IT SHOULD MATCH...',K.c,90);return;}if(sel===id){sel=null;return;}
  const hit=ent.pairs.some(p=>(p[0]===sel&&p[1]===id)||(p[1]===sel&&p[0]===id));if(hit){flagged=true;S('score');say('DISCREPANCY: '+ent.flaw,K.r,240);A.burst(160,120,K.r,16,2);}else{S('lose');say('NO DISCREPANCY THERE',K.gr,90);}sel=null;}
 function decide(ok){const e=ent;stats.n++;const right=ok===e.valid;stamp=ok?'APPROVED':'DENIED';stampT=40;S(right?'coin':'boom');
  if(right){const p=5+(flagged&&!ok?2:0);credits+=p;stats.ok++;stats.pay+=p;say(ok?'ENTRY GRANTED. +'+p:'ENTRY REFUSED'+(flagged?' (FLAGGED +2)':'')+'. +'+p,K.g,120);}
  else{stats.bad++;cit++;if(cit>2){credits-=5;stats.fine+=5;}say('CITATION: '+(ok?e.flaw:'THEIR PAPERS WERE IN ORDER')+(cit>2?' -5':' (WARNING '+cit+'/2)'),K.r,220);A.shake=4;}e.st='stamp';decided++;}
 g.update=()=>{if(msgT)msgT--;const h=A.hit(0);
  if(phase==='intro'){pt++;if((h.a&&pt>20)||pt>420){startDay();S('coin');}return;}
  if(phase==='summary'){pt++;if(h.a&&pt>40){if(credits<0){g.over='EVICTED - CREDITS RAN OUT ON DAY '+day;return;}if(day>=DAYS){g.over='CONTRACT COMPLETE - 6 DAYS SERVED';g.score=credits;return;}startDay();}return;}
  clock++;const e=ent;
  if(e){if(e.st==='in'){e.x+=2;if(e.x>=60){e.x=60;e.st='desk';S('blip');buildHS();}}else if(e.st==='stamp'){if(--stampT<=0)e.st='out';}else if(e.st==='out'){e.x+=3;if(e.x>200){if(queue.length)queue.shift();newEntrant();}}}
  if(e&&e.st==='desk'){buildHS();if(mouseOn()){for(const q of hs)if(hit2(A.mouse.x,A.mouse.y,q.x,q.y,q.w,q.h))cur=q.id;}
   if(h.l)navigate(-1,0);if(h.r)navigate(1,0);if(h.u)navigate(0,-1);if(h.d)navigate(0,1);if(h.b){sel=null;S('blip');}
   if(h.a){if(mouseOn()){const q=hs.find(q=>hit2(A.mouse.x,A.mouse.y,q.x,q.y,q.w,q.h));if(q)activate(q.id);}else activate(cur);}}
  if(clock>=DAYLEN&&(!e||e.st!=='stamp')){const rent=day>1?12:8;credits-=rent;stats.rent=rent;phase='summary';pt=0;S('win');}
  g.score=credits;};
 /* drawing */
 const pal={pm:'#d8ecd0',id:'#d0e0f4',wk:'#f4ecc0',vc:'#f4d8e0'},ttl={pm:'ENTRY PERMIT',id:'ID CARD',wk:'WORK PASS',vc:'VACCINE CERT'};
 function face(x,y,s,hair,skin){C(x,y,6*s,skin);A.c.fillStyle=hair;A.c.beginPath();A.c.arc(x,y-1*s,6.4*s,Math.PI*1.05,Math.PI*1.95);A.c.fill();R(x-6.4*s,y-2*s,2*s,5*s,hair);R(x+4.4*s,y-2*s,2*s,5*s,hair);R(x-2.6*s,y-.5*s,1.4*s,1.4*s,'#1a1a1a');R(x+1.4*s,y-.5*s,1.4*s,1.4*s,'#1a1a1a');R(x-1.5*s,y+3*s,3*s,.8*s,'#8a4040');}
 function drawDocs(){const e=ent;if(!e||e.st==='in')return;const off=e.st==='out'?(e.x-60)*1.5:0;
  for(const[d,x0,y0,w,hh]of docList()){const x=x0-off,y=y0;R(x+2,y+2,w,hh,'rgba(0,0,0,.35)');
   if(d==='pp'){const cc=CT[e.c][2];R(x,y,w,hh,cc);R(x+2,y+11,w-4,hh-13,'#efe6d0');T(CT[e.c][0],x+w/2,y+3,'#ffe8a0',1,'c');R(x+4,y+13,22,27,'#c8d8e0');face(x+15,y+27,1.25,HAIR[e.photo][0],SKIN[e.skin]);R(x+4,y+35,22,5,e.shirt);
    T('PASSPORT',x+29,y+15,'#6a5a4a',1);T('SEX '+(e.sex?'M':'F'),x+29,y+25,'#3a3a3a',1);C(x+40,y+35,4.5,CT[e.c][2]);A.ring(x+40,y+35,3,'#ffe8a0');T('SEAL',x+47,y+33,'#8a7a6a',1);
    T(e.name,x+4,y+44,'#1a1a2a',1);T('DOB '+e.dob,x+4,y+53,'#2a2a3a',1);T('CITY '+e.city,x+4,y+62,'#2a2a3a',1);T('NO '+e.num,x+4,y+71,'#2a2a3a',1);T('EXP '+fmt(e.exp),x+4,y+80,'#2a2a3a',1);
    if(stamp){const sc=stamp==='APPROVED'?'#2a9a3a':'#c82a2a';AL(Math.min(1,(40-stampT+1)/6));A.box(x+6,y+86,62,10,sc);T(stamp,x+37,y+88,sc,1,'c');AL(1);}else{R(x+4,y+88,66,6,'#e0d6c0');T('STAMP AREA',x+37,y+89,'#b8ae98',1,'c');}continue;}
   const D=e.docs[d];R(x,y,w,hh,pal[d]);R(x,y,w,9,A.mix(pal[d],'#000000',.25));T(ttl[d],x+w/2,y+2,'#ffffff',1,'c');
   if(d==='pm'){T(D.name,x+4,y+12,'#1a1a2a',1);T('NO '+D.num,x+4,y+20,'#2a2a3a',1);T(D.purp+' '+D.dur,x+4,y+28,'#2a2a3a',1);T('EXP '+fmt(D.exp),x+4,y+36,'#2a2a3a',1);}
   if(d==='id'){T(D.name,x+4,y+12,'#1a1a2a',1);T('DOB '+D.dob,x+4,y+20,'#2a2a3a',1);T('DIST '+D.dist,x+4,y+30,'#5a5a6a',1);face(x+64,y+38,.7,HAIR[e.hair][0],SKIN[e.skin]);}
   if(d==='wk'){T(D.name,x+4,y+12,'#1a1a2a',1);T('FIELD '+D.job,x+4,y+20,'#2a2a3a',1);T('UNTIL '+fmt(D.until),x+4,y+30,'#5a5a6a',1);}
   if(d==='vc'){T(D.name,x+4,y+12,'#1a1a2a',1);T(D.vac,x+4,y+20,'#2a2a3a',1);T('EXP '+fmt(D.exp),x+4,y+28,'#2a2a3a',1);}}}
 g.draw=()=>{A.cls('#1a1a22');
  if(phase==='intro'){GR(0,0,W,H,'#2a2a3a','#0a0a12');for(let i=0;i<8;i++)A.person(30+i*36,200,{s:1,c:['#5a5a6a','#7a4a3a','#3a5a4a','#4a4a7a'][i%4],id:i,d:1});R(0,200,W,40,'#2a2a30');
   T('CHECKPOINT',160,26,K.y,3,'c');T('THE BORDER POST OF VARNOVA NEEDS AN INSPECTOR.',160,54,K.w,1,'c');T('EACH DAY BRINGS NEW RULES. READ THE RULEBOOK ON THE RIGHT.',160,66,K.w,1,'c');
   T('SPOT A PROBLEM? SELECT BOTH FIELDS THAT DISAGREE TO FLAG IT.',160,82,K.c,1,'c');T('THEN STAMP APPROVE OR DENY. MISTAKES EARN CITATIONS.',160,94,K.c,1,'c');T('RENT IS DUE EVERY NIGHT. SURVIVE 6 DAYS.',160,110,K.y,1,'c');if(A.t%60<40)T('PRESS A TO START DAY 1',160,134,K.w,2,'c');return;}
  /* booth view */
  GR(0,12,140,92,'#8aa0b8','#c8ccd0');R(0,70,140,34,'#6a6a70');for(let i=0;i<7;i++)R(i*22,64,18,6,'#5a5a60');
  const e=ent;if(e&&e.st!=='desk'){}if(e){const x=e.x;A.person(x,128,{s:2.2,c:e.shirt,hair:HAIR[e.hair][0],skin:SKIN[e.skin],id:e.c,d:1});}
  R(0,96,140,8,'#5a4a3a');R(0,96,140,2,'#8a7a6a');R(0,12,4,92,'#3a3a44');R(136,12,4,92,'#3a3a44');AL(.08);R(4,12,132,84,'#ffffff');AL(1);
  GR(140,12,90,92,'#8aa0b8','#b8bcc0');R(140,80,90,24,'#7a7a74');R(140,12,2,92,'#2a2a34');queue.forEach((q,i)=>{if(i<6)A.person(160+i*12,96-((i*7)%5),{s:.55,c:q.c,id:q.id,d:-1});});R(196,40,30,40,'#5a5a64');R(199,44,24,4,'#8a2a2a');T('VARNOVA',211,50,'#e8e0c0',1,'c');
  if(e&&e.st==='desk'&&e.line&&!stamp){R(8,16,124,9,'rgba(255,255,255,.85)');T(e.line,70,18,'#2a2a3a',1,'c');}
  /* desk */
  GR(0,104,230,104,'#6a4a32','#4a3222');for(let i=0;i<6;i++)R(0,110+i*17,230,1,'rgba(0,0,0,.12)');EL(206,190,11,5,'rgba(0,0,0,.3)');R(196,172,20,18,'#e8e8f0');EL(206,172,10,3,'#5a3a1a');R(216,176,4,8,'#e8e8f0');R(92,182,46,18,'#2a2a30');R(94,184,20,14,'#c82a2a');R(116,184,20,14,'#2a9a3a');T('INK',115,174,'#8a7a6a',1,'c');T('SEEN '+decided,190,108,'#c8b8a0',1);drawDocs();
  /* rulebook */
  R(230,12,90,194,'#3a2a22');R(232,14,86,190,'#e8dcc0');T('RULES - DAY '+day,275,16,'#8a2a2a',1,'c');let y=24;for(const r of rules()){const t=r[1];if(t.length>20){const sp=t.lastIndexOf(' ',21);T(t.slice(0,sp),235,y,'#2a2a3a',1);T(t.slice(sp+1),235,y+8,'#2a2a3a',1);y+=16;}else{T(t,235,y,r[0]==='cityh'?'#8a2a2a':'#2a2a3a',1);y+=8;}
   if(r[0]==='cityh')for(let i=0;i<6;i++){T(CT[i][0]+' '+CT[i][1].join(' '),237,y,'#4a4a5a',1);y+=8;}y+=2;}
  if(day>=2&&y<186)T('FOREIGN = NOT VARNOVA',235,y+2,'#8a8a8a',1);
  /* highlights */
  if(e&&e.st==='desk'){for(const q of hs){if(q.id===sel){AL(.35);R(q.x,q.y,q.w,q.h,K.y);AL(1);A.box(q.x-1,q.y-1,q.w+2,q.h+2,K.o);}}const c=hs.find(q=>q.id===cur);if(c&&(!mouseOn()||A.t%40<30)){A.box(c.x-1,c.y-1,c.w+2,c.h+2,A.t%30<15?'#ff4fd8':'#ffffff');}}
  /* top bar */
  R(0,0,W,12,'#0a0a10');T('TODAY '+fmt(today),4,4,K.w,1);const hr=9+Math.floor(clock/DAYLEN*9),mn=Math.floor((clock/DAYLEN*9%1)*60);T((hr<10?'0':'')+hr+':'+(mn<10?'0':'')+mn,100,4,clock>DAYLEN*.85?K.r:K.c,1);T('DAY '+day+'/6',140,4,K.y,1);T('CR '+credits,196,4,credits<0?K.r:K.g,1);T('CITATIONS '+cit+'/2',W-4,4,cit>2?K.r:cit>0?K.o:K.gr,1,'r');
  /* bottom strip */
  R(0,206,232,34,'#0e0e16');if(msgT){T(msg.length>56?msg.slice(0,56):msg,6,212,msgC,1);if(msg.length>56)T(msg.slice(56),6,221,msgC,1);}else T(sel?'SELECTED - NOW PICK THE FIELD IT CLASHES WITH (B CANCELS)':'ARROWS/MOUSE: CHOOSE   A/CLICK: INSPECT OR STAMP',6,212,K.gr,1);
  const qn=hs.find(q=>q.id===cur);if(qn&&qn.id!=='APPROVE'&&qn.id!=='DENY')T(sel?'COMPARE '+sel.toUpperCase()+' WITH '+qn.id.toUpperCase():'POINTING AT '+qn.id.toUpperCase().replace('R.','RULE '),6,226,'#6a6a8a',1);
  const bt=(id,x,col)=>{const on=cur===id;R(x,208,42,26,on?col:A.mix(col,'#000000',.5));A.box(x,208,42,26,on?K.w:col);T(id==='APPROVE'?'OK':'NO',x+21,213,'#ffffff',2,'c');T(id,x+21,226,'#ffffff',1,'c');};bt('APPROVE',232,'#2a9a3a');bt('DENY',276,'#c82a2a');
  if(phase==='summary'){PANEL(60,40,200,160,K.y,.95);T('END OF DAY '+day,160,48,K.y,2,'c');const L_=[['PROCESSED',stats.n],['CORRECT',stats.ok],['MISTAKES',stats.bad],['WAGES','+'+stats.pay],['FINES','-'+stats.fine],['RENT AND FOOD','-'+stats.rent],['SAVINGS',credits]];L_.forEach((l,i)=>{T(l[0],76,72+i*12,K.w,1);T(''+l[1],244,72+i*12,i===6?(credits<0?K.r:K.g):K.w,1,'r');});
   T(credits<0?'YOU CANNOT PAY. PRESS A.':day>=6?'YOUR CONTRACT IS DONE. PRESS A.':'PRESS A FOR DAY '+(day+1),160,170,credits<0?K.r:K.c,1,'c');}};
 return g;}});

/* ---- STICK BRAWL: 4-way ragdoll brawler ---- */
A.add({id:'stickbrawl',name:'STICK BRAWL',cat:'VERSUS',vs:1,time:240,tags:'stick fight stickman ragdoll brawl',
how:'ARROWS MOVE, UP JUMPS TWICE, A HITS OR FIRES, B THROWS YOUR WEAPON. BE THE LAST STANDING.',make(){
 const g={over:null,score:0};const COL=['#2fd6ff','#ff4f9a','#ffcf3f','#3dff8b'],NM=()=>['P1',A.two?'P2':'CPU','CPU 2','CPU 3'];
 const MAPS=[
  {n:'TWIN TOWERS',sky:['#1a2a5a','#6a4a8a'],b:[[20,150,60,90],[240,150,60,90],[115,110,90,10],[0,70,40,8],[280,70,40,8],[140,190,40,10]],sp:[[50,140],[270,140],[130,100],[190,100]]},
  {n:'CRATE YARD',sky:['#3a2a1a','#c8804a'],b:[[0,200,320,40],[60,160,22,22,'c'],[82,160,22,22,'c'],[71,138,22,22,'c'],[216,160,22,22,'c'],[238,160,22,22,'c'],[227,138,22,22,'c'],[130,120,60,8],[148,178,22,22,'c']],sp:[[30,190],[290,190],[150,110],[170,110]]},
  {n:'LIFT SHAFT',sky:['#0a1a2a','#2a5a6a'],b:[[0,190,70,50],[250,190,70,50],[80,150,50,8,'m',0,60],[190,100,50,8,'m',1,60],[130,60,60,8]],sp:[[30,180],[290,180],[100,140],[210,90]]},
  {n:'PENDULUM',sky:['#2a0a1a','#8a3a3a'],b:[[0,120,50,8],[270,120,50,8],[110,170,100,10,'h',0,80],[135,80,50,8],[0,200,40,40],[280,200,40,40]],sp:[[20,110],[300,110],[140,160],[180,160]]},
  {n:'SPIKE PIT',sky:['#1a1a1a','#5a5a3a'],b:[[0,200,110,40],[210,200,110,40],[110,225,100,15,'s'],[120,140,80,8],[20,130,40,8],[260,130,40,8]],sp:[[40,190],[280,190],[140,130],[180,130]]}];
 const WP={sword:{n:'SWORD',cd:24,ammo:99},pistol:{n:'PISTOL',cd:16,ammo:8},smg:{n:'SPRAYER',cd:5,ammo:30},nade:{n:'GRENADES',cd:30,ammo:3}};
 let lava=999,rT=0,mi=-1,blocks=[],F=[],items=[],bul=[],nades=[],wins=[0,0,0,0],state='intro',st=0,winner=-1,dropT=0,round=0,banner='',bT=0;
 const SEG=[[0,1,6],[1,2,10],[1,7,5],[7,3,5],[1,8,5],[8,4,5],[2,9,6],[9,5,6],[2,10,6],[10,6,6]];
 function mkF(i,x,y){const f={i,x,y,vx:0,vy:0,hp:100,alive:true,dir:i%2?-1:1,gr:false,air:1,cd:0,atk:0,stun:0,w:null,ammo:0,ph:0,ai:i>1||(i===1&&!A.two),think:0,mem:{},pts:[]};for(let k=0;k<11;k++)f.pts.push({x,y:y-12,px:x,py:y-12});pose(f,1);return f;}
 function pose(f,snap){const x=f.x,y=f.y,d=f.dir,ln=cl(f.vx*1.2,-4,4),T_=[];const atk=f.atk>0,wk=f.gr&&Math.abs(f.vx)>.3;f.ph+=wk?Math.abs(f.vx)*.22:0;const s=Math.sin(f.ph),c=Math.cos(f.ph);
  T_[2]=[x,y-12];T_[1]=[x+ln,y-22];T_[0]=[x+ln*1.2,y-28];
  if(f.gr){T_[5]=[x+s*5,y-Math.max(0,c)*3];T_[6]=[x-s*5,y-Math.max(0,-c)*3];}else{T_[5]=[x+3*d,y-4];T_[6]=[x-3*d,y-6];}
  const aim=f.aim||0,ca=Math.cos(aim)*d,sa=Math.sin(aim);
  if(f.w&&f.w!=='nade'){T_[4]=[x+ln+ca*(f.w==='sword'&&atk?13:9),y-20+sa*9-(f.w==='sword'&&atk?Math.sin((f.atk/12)*3)*8:0)];T_[3]=[x+ln+ca*5,y-19+sa*5];}
  else if(atk){T_[4]=[x+ln+d*14,y-21];T_[3]=[x+ln-d*3,y-16];}else{T_[3]=[x+ln-d*4+s*2,y-14];T_[4]=[x+ln+d*5-s*2,y-15];}
  T_[7]=[(T_[1][0]+T_[3][0])/2-d*1.5,(T_[1][1]+T_[3][1])/2+2];T_[8]=[(T_[1][0]+T_[4][0])/2-d*1,(T_[1][1]+T_[4][1])/2+2];T_[9]=[(T_[2][0]+T_[5][0])/2+d*2,(T_[2][1]+T_[5][1])/2];T_[10]=[(T_[2][0]+T_[6][0])/2+d*2,(T_[2][1]+T_[6][1])/2];
  const k=snap?1:f.stun>0?.1:.42;for(let i=0;i<11;i++){const p=f.pts[i];p.x+=(T_[i][0]-p.x)*k;p.y+=(T_[i][1]-p.y)*k;if(snap){p.px=p.x;p.py=p.y;}}}
 function rag(f){const gv=f.alive?.12:.32;for(const p of f.pts){const vx=(p.x-p.px)*.96,vy=(p.y-p.py)*.96;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+gv;}
  if(f.alive)pose(f);for(let it=0;it<3;it++){for(const s of SEG){const a=f.pts[s[0]],b=f.pts[s[1]],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,df=(d-s[2])/d*.5;a.x+=dx*df;a.y+=dy*df;b.x-=dx*df;b.y-=dy*df;}
   if(!f.alive)for(const p of f.pts)for(const b of blocks){if(b.s)continue;if(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h){const o=[p.y-b.y,b.y+b.h-p.y,p.x-b.x,b.x+b.w-p.x],m=Math.min(...o);if(m===o[0]){p.y=b.y;p.px+=(p.x-p.px)*.4;}else if(m===o[1])p.y=b.y+b.h;else if(m===o[2])p.x=b.x;else p.x=b.x+b.w;}}}}
 const imp=(f,ix,iy)=>{for(const p of f.pts){p.px-=ix*(.6+Math.random()*.8);p.py-=iy*(.6+Math.random()*.8);}};
 function loadMap(){mi=(mi+1)%MAPS.length;const M=MAPS[mi];blocks=M.b.map(b=>({x:b[0],y:b[1],w:b[2],h:b[3],c:b[4]==='c',hp:40,m:b[4]==='m'?{ax:'y',o:b[5],a:b[6],bx:b[0],by:b[1]}:b[4]==='h'?{ax:'x',o:b[5],a:b[6],bx:b[0],by:b[1]}:null,s:b[4]==='s',dx:0,dy:0}));F=M.sp.map((s,i)=>mkF(i,s[0],s[1]));items=[];bul=[];nades=[];dropT=90;lava=999;rT=0;state='ready';st=0;round++;banner=M.n;bT=90;}
 const solids=()=>blocks.filter(b=>!b.s);
 function hurt(f,d,ix,iy,by){if(!f.alive)return;f.hp-=d;imp(f,ix*.7,iy*.7);f.vx+=ix*.5;f.vy+=iy*.4;if(d>=12)f.stun=Math.max(f.stun,Math.min(40,d*1.2));A.burst(f.pts[1].x,f.pts[1].y,COL[f.i],Math.min(18,4+d/3),1.8);S('hit');if(d>=20)A.shake=Math.max(A.shake,4);if(f.hp<=0)kill(f,ix,iy);}
 function kill(f,ix,iy){if(!f.alive)return;f.alive=false;f.hp=0;imp(f,ix*1.4,(iy||-3)*1.2);S('boom');A.shake=6;A.burst(f.pts[0].x,f.pts[0].y,COL[f.i],26,2.8);if(f.w){items.push({k:f.w,ammo:f.ammo,x:f.x,y:f.y-20,vx:ix*.3,vy:-2,t:0});f.w=null;}}
 function boom(x,y,own){S('boom');A.shake=10;A.burst(x,y,K.o,34,3.8);A.burst(x,y,K.y,20,2.4);for(const f of F){const dx=f.x-x,dy=f.y-14-y,d=Math.hypot(dx,dy);if(d<38&&f.alive){const p=(1-d/38);hurt(f,Math.round(60*p+10),dx/(d||1)*7*p,dy/(d||1)*7*p-3,own);}else if(d<50&&!f.alive)imp(f,dx/(d||1)*5,-4);}
  for(const b of blocks)if(b.c&&Math.hypot(b.x+b.w/2-x,b.y+b.h/2-y)<40)b.hp=0;}
 function attack(f,aimT){const w=f.w;if(f.cd>0)return;const d=f.dir,cx=f.x,cy=f.y-20;
  if(!w){f.cd=15;f.atk=9;S('shoot');for(const o of F)if(o!==f&&o.alive&&Math.abs(o.x-(cx+d*9))<11&&Math.abs(o.y-f.y)<18)hurt(o,9,d*4,-2,f);hitCrates(cx+d*12,cy,8,8);return;}
  if(w==='sword'){f.cd=WP.sword.cd;f.atk=12;S('jump');for(const o of F)if(o!==f&&o.alive&&Math.abs(o.x-(cx+d*13))<18&&Math.abs(o.y-f.y)<24)hurt(o,34,d*7,-4,f);hitCrates(cx+d*16,cy,16,20);for(const b of bul)if(Math.abs(b.x-(cx+d*12))<14&&Math.abs(b.y-cy)<16&&b.o!==f){b.vx*=-1;b.o=f;S('coin');}return;}
  if(w==='nade'){f.cd=30;const a=f.aim-.5;nades.push({x:cx+d*6,y:cy-4,vx:Math.cos(a)*d*4.2+f.vx*.5,vy:Math.sin(a)*4.2-1,t:75,o:f});f.ammo--;S('jump');if(f.ammo<=0)f.w=null;return;}
  const a=f.aim+(w==='smg'?rnd(.24)-.12:rnd(.04)-.02);f.cd=WP[w].cd;f.atk=5;bul.push({x:cx+Math.cos(f.aim)*d*12,y:cy+Math.sin(f.aim)*10,vx:Math.cos(a)*d*8,vy:Math.sin(a)*8,o:f,dm:w==='smg'?7:19,t:60});f.vx-=d*(w==='smg'?.15:.6);S('shoot');f.ammo--;if(f.ammo<=0){f.w=null;}}
 function hitCrates(x,y,w,h){for(const b of blocks)if(b.c&&x+w>b.x&&x-w<b.x+b.w&&y+h>b.y&&y-h<b.y+b.h){b.hp-=20;A.burst(x,y,'#a8743a',6,1.5);}}
 function throwW(f){if(!f.w)return;items.push({k:f.w,ammo:f.ammo,x:f.x+f.dir*8,y:f.y-22,vx:f.dir*6+f.vx,vy:-1.5,t:0,th:f,live:30});f.w=null;S('jump');}
 /* AI */
 const groundAt=(x,y)=>solids().some(b=>x>=b.x&&x<=b.x+b.w&&b.y>=y-2&&b.y<y+70);
 function brain(f){const k={};if(f.think>0){f.think--;return f.mem;}f.think=Math.round(4+8*(1-A.ai));
  const foes=F.filter(o=>o!==f&&o.alive);if(!foes.length)return k;let tgt=foes.reduce((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)<Math.hypot(b.x-f.x,b.y-f.y)?a:b);let gx=tgt.x,gy=tgt.y;
  if(!f.w){const it=items.filter(i=>!i.live&&!i.chute&&!(i.ign&&i.ign[f.i])&&i.y>f.y-60).sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0];if(it&&Math.hypot(it.x-f.x,it.y-f.y)<Math.hypot(tgt.x-f.x,tgt.y-f.y)*1.2){gx=it.x;gy=it.y;if(f.chase===it)f.chaseT+=f.think+1;else{f.chase=it;f.chaseT=0;}if(f.chaseT>200){it.ign=it.ign||{};it.ign[f.i]=1;}}}
  const dx=gx-f.x,dy=gy-f.y,dist=Math.hypot(tgt.x-f.x,tgt.y-f.y);const ranged=f.w==='pistol'||f.w==='smg';let want=ranged?(Math.abs(dx)<70?-Math.sign(dx):Math.abs(dx)>150?Math.sign(dx):0):Math.abs(dx)>10?Math.sign(dx):0;
  if(!want&&dy>24&&f.gr&&f.on&&!ranged){want=f.x-f.on.x<f.on.x+f.on.w-f.x?-1:1;}if(!want&&dy<-30&&f.gr&&Math.abs(dx)<30){want=(f.x<160?1:-1);}
  if(want<0)k.l=1;if(want>0)k.r=1;const ahead=f.x+want*14;if(want&&f.gr&&!groundAt(ahead,f.y)){const below=solids().some(b=>ahead>=b.x&&ahead<=b.x+b.w&&b.y>f.y&&b.y<f.y+170),ex=f.x+want*70,across=solids().some(b=>ex>=b.x-10&&ex<=b.x+b.w+10&&b.y>f.y-60&&b.y<f.y+60);if(dy>20&&below){}else if(across||dy<-10)k.u=1;else if(!below){k.l=k.r=0;}}
  if(f.gr&&dy<-24&&Math.abs(dx)<90)k.u=1;if(!f.gr&&f.vy>1&&!groundAt(f.x,f.y)&&f.air>0)k.u=1;
  if(f.gr&&want&&solids().some(b=>ahead>b.x&&ahead<b.x+b.w&&f.y-4>b.y&&f.y-20<b.y+b.h))k.u=1;
  f.aim=0;const tdx=tgt.x-f.x,tdy=tgt.y-f.y;if(!ranged&&Math.abs(tdx)>1&&dist<40)f.dir=Math.sign(tdx);if(ranged||f.w==='nade'){f.dir=Math.sign(tdx)||f.dir;f.aim=cl(Math.atan2(tdy,Math.abs(tdx))+(rnd(.3)-.15)*(1.2-A.ai),-1,1);}
  if(!f.w&&Math.abs(tdx)<19&&Math.abs(tdy)<18&&Math.random()<.3+.5*A.ai)k.a=1;if(f.w==='sword'&&Math.abs(tdx)<26&&Math.abs(tdy)<24)k.a=1;if(ranged&&Math.abs(tdy)<40+60*A.ai&&dist<230&&Math.random()<.4+.4*A.ai)k.a=1;if(f.w==='nade'&&dist>50&&dist<170&&Math.random()<.25)k.a=1;
  f.mem=k;return k;}
 /* update */
 function stepF(f){if(f.cd>0)f.cd--;if(f.atk>0)f.atk--;if(f.stun>0)f.stun--;
  if(f.alive){let k=f.i===0?A.in(0):(f.i===1&&A.two)?A.in(1):brain(f);const h=f.i===0?A.hit(0):(f.i===1&&A.two)?A.hit(1):{u:k.u&&!f.mem.pu,a:k.a,b:false};if(f.ai)f.mem.pu=k.u;
   const ctrl=f.stun<=0&&state==='fight';if(ctrl){const mx=ax(k);if(mx){f.vx+=mx*(f.gr?.55:.32);if(!f.ai||!(f.w==='pistol'||f.w==='smg'||f.w==='nade'))f.dir=mx;}if(!f.ai)f.aim=k.u&&!mx?-.9:k.u?-.45:k.d?.45:0;
    if(h.u&&(f.gr||f.air>0)){f.vy=f.gr?-5.6:-4.8;if(!f.gr)f.air--;f.gr=false;S('jump');}if(f.w==='smg'||f.w==='sword'?k.a:h.a)attack(f);if(h.b)throwW(f);}
   if(f.gr&&f.on){f.x+=f.on.dx;f.y+=f.on.dy;}f.vy+=.28;f.vx*=f.gr?.78:.93;f.vx=cl(f.vx,-6,6);f.vy=Math.min(f.vy,8);
   f.x+=f.vx;for(const b of solids())if(f.x+4>b.x&&f.x-4<b.x+b.w&&f.y>b.y+2&&f.y-24<b.y+b.h){f.x=f.vx>0?b.x-4:b.x+b.w+4;f.vx=0;}
   const oy=f.y;f.y+=f.vy;f.gr=false;for(const b of solids())if(f.x+4>b.x&&f.x-4<b.x+b.w&&f.y>b.y&&f.y-24<b.y+b.h){if(oy<=b.y+2+Math.max(0,b.dy)){f.y=b.y;f.vy=0;f.gr=true;f.air=1;f.on=b;}else if(f.vy<0){f.y=b.y+b.h+24;f.vy=0;}}
   for(const b of blocks)if(b.s&&f.x>b.x&&f.x<b.x+b.w&&f.y>b.y){if(A.t%6===0)hurt(f,6,0,-6,null);f.vy=-6;}
   if(f.y>270||f.x<-40||f.x>360||f.y>lava+4)kill(f,0,-2);
   if(!f.w)for(const it of items)if(!it.live&&Math.abs(it.x-f.x)<10&&Math.abs(it.y-(f.y-8))<16){f.w=it.k;f.ammo=it.ammo;it.dead=1;S('coin');}}
  rag(f);if(!f.alive){f.x=f.pts[2].x;f.y=f.pts[2].y;}}
 g.update=()=>{if(bT>0)bT--;
  if(state==='intro'){st++;if(st>2){mi=-1;loadMap();}return;}
  if(state==='ready'){st++;F.forEach(f=>{rag(f);});if(st>70){state='fight';S('coin');}}
  if(state==='over'){st++;if(st>110){if(winner>=0&&wins[winner]>=5){g.over=winner===0?'PLAYER 1 WINS!':winner===1?A.win(1):'CPU WINS!';return;}loadMap();return;}}
  /* platforms */
  for(const b of blocks){b.dx=b.dy=0;if(b.m){const v=Math.sin(A.t*.02+b.m.o*3.14)*b.m.a;const nx=b.m.ax==='x'?b.m.bx+v:b.x,ny=b.m.ax==='y'?b.m.by+v:b.y;b.dx=nx-b.x;b.dy=ny-b.y;b.x=nx;b.y=ny;}}
  blocks=blocks.filter(b=>{if(b.c&&b.hp<=0){A.burst(b.x+b.w/2,b.y+b.h/2,'#a8743a',18,2.4);S('boom');return false;}return true;});
  if(state==='fight'){rT++;if(rT===1800){banner='SUDDEN DEATH - THE LAVA RISES';bT=120;lava=250;S('boom');}if(rT>1800)lava-=.22;if(--dropT<=0){const ks=['sword','pistol','smg','nade'];const k_=ks[ri(4)];items.push({k:k_,ammo:WP[k_].ammo,x:30+rnd(260),y:-10,vx:0,vy:0,t:0,chute:1});dropT=260+ri(160);}}
  F.forEach(stepF);
  for(const it of items){it.t++;if(it.chute){it.vy=Math.min(it.vy+.05,1.1);}else it.vy+=.3;it.x+=it.vx;it.y+=it.vy;it.vx*=.97;if(it.live>0){it.live--;for(const f of F)if(f!==it.th&&f.alive&&Math.abs(f.x-it.x)<9&&Math.abs(f.y-12-it.y)<16){hurt(f,15,Math.sign(it.vx)*5,-2,it.th);it.live=0;it.vx*=-.3;}}
   for(const b of solids())if(it.x>b.x-3&&it.x<b.x+b.w+3&&it.y>b.y-6&&it.y<b.y+b.h){if(it.vy>0&&it.y-it.vy<=b.y-5){it.y=b.y-6;it.vy=0;it.vx*=.6;it.chute=0;it.x+=b.dx;}else if(it.live){it.vx*=-.4;}}if(it.y>260||it.t>1400)it.dead=1;}items=items.filter(i=>!i.dead);
  for(const b of bul){b.x+=b.vx;b.y+=b.vy;b.t--;for(const bl of solids())if(b.x>bl.x&&b.x<bl.x+bl.w&&b.y>bl.y&&b.y<bl.y+bl.h){b.t=0;if(bl.c)bl.hp-=b.dm;A.burst(b.x,b.y,bl.c?'#a8743a':'#c8c8d8',4,1);}
   for(const f of F)if(f!==b.o&&f.alive&&b.t>0&&Math.abs(f.x-b.x)<6&&b.y>f.y-30&&b.y<f.y){hurt(f,b.dm,Math.sign(b.vx)*(b.dm>10?4:1.8),-1.5,b.o);b.t=0;}}bul=bul.filter(b=>b.t>0&&b.x>-10&&b.x<330);
  for(const n of nades){n.vy+=.25;n.x+=n.vx;n.y+=n.vy;for(const b of solids())if(n.x>b.x&&n.x<b.x+b.w&&n.y>b.y&&n.y<b.y+b.h){if(n.y-n.vy<=b.y){n.y=b.y;n.vy*=-.4;n.vx*=.7;}else{n.vx*=-.5;n.x+=n.vx*2;}}if(--n.t<=0||n.y>260){if(n.y<260)boom(n.x,n.y,n.o);n.dead=1;}}nades=nades.filter(n=>!n.dead);
  if(state==='fight'){const al=F.filter(f=>f.alive);if(al.length<=1){state='over';st=0;winner=al.length?al[0].i:-1;if(winner>=0){wins[winner]++;banner=NM()[winner]+' TAKES THE ROUND';}else banner='NOBODY SURVIVED';bT=110;S(winner===0?'win':'score');}}
  g.score=wins[0];};
 g.timeUp=()=>{const m=Math.max(...wins),w=wins.indexOf(m);return wins.filter(v=>v===m).length>1?'TIME UP - DRAW':'TIME UP - '+(w===0?'P1 WINS':w===1&&!A.cpu?'P2 WINS':'CPU WINS');};
 /* draw */
 function drawW(k,x,y,a,d,sc){const c=Math.cos(a)*d,s=Math.sin(a);sc=sc||1;if(k==='sword'){L(x-c*3,y-s*3,x+c*16*sc,y+s*16*sc,'#e8eef8',2);L(x-c*1,y-s*1+0,x+c*1,y+s*1,'#c8a040',3);L(x-s*3,y+c*3,x+s*3,y-c*3,'#c8a040',1.5);}
  else if(k==='pistol'){L(x,y,x+c*8*sc,y+s*8*sc,'#3a3a44',3);L(x,y,x-s*3,y+3,'#3a3a44',2);}else if(k==='smg'){L(x-c*2,y-s*2,x+c*11*sc,y+s*11*sc,'#2a4a3a',3.5);L(x+c*3,y+s*3,x+c*3-s*4,y+s*3+4,'#2a2a2a',2);}else if(k==='nade'){C(x,y,3,'#3a6a2a');R(x-1,y-4,2,2,'#888');}}
 g.draw=()=>{const M=MAPS[Math.max(0,mi)];A.cls(M.sky[0]);GR(0,0,W,H,M.sky[0],M.sky[1]);
  for(let i=0;i<9;i++){const x=(i*47+mi*31)%340-10,h=40+((i*37)%60);R(x,H-h,26,h,A.mix(M.sky[1],'#000000',.55));}GL(260,50,60,'#ffffff',.08);
  for(const b of blocks){if(b.s){for(let x=b.x;x<b.x+b.w;x+=8)A.poly([[x,b.y+b.h],[x+4,b.y],[x+8,b.y+b.h]],'#c8c8d0',1);R(b.x,b.y+b.h-3,b.w,3,'#5a1010');continue;}
   if(b.c){R(b.x,b.y,b.w,b.h,b.hp<20?'#8a5a2a':'#b07a3a');A.box(b.x,b.y,b.w,b.h,'#5a3a1a');L(b.x+2,b.y+2,b.x+b.w-2,b.y+b.h-2,'#6a4a20',1.5);L(b.x+b.w-2,b.y+2,b.x+2,b.y+b.h-2,'#6a4a20',1.5);continue;}
   GR(b.x,b.y,b.w,b.h,b.m?'#8a9aaa':'#6a6a7a',b.m?'#4a5a6a':'#2a2a3a');R(b.x,b.y,b.w,2,b.m?'#c8e0f0':'#9a9aaa');A.box(b.x,b.y,b.w,b.h,'#1a1a24');if(b.m){if(b.m.ax==='y')L(b.x+b.w/2,0,b.x+b.w/2,b.y,'#3a3a44',1);else{L(b.x+10,b.y,160,20,'#5a5a64',1);L(b.x+b.w-10,b.y,160,20,'#5a5a64',1);}}}
  for(const it of items){if(it.chute){A.c.fillStyle='#e8e8f0';A.c.beginPath();A.c.arc(it.x,it.y-16,10,Math.PI,0);A.c.fill();L(it.x-9,it.y-16,it.x,it.y-4,'#ccc');L(it.x+9,it.y-16,it.x,it.y-4,'#ccc');}if(it.live)drawW(it.k,it.x,it.y,A.t*.5,1);else{GL(it.x,it.y-2,10,'#ffffff',.25);drawW(it.k,it.x-4,it.y-1,0,1);}}
  for(const f of F){const p=f.pts,col=f.alive?COL[f.i]:A.mix(COL[f.i],'#000000',.45),w=2.4;
   for(const s of SEG)L(p[s[0]].x,p[s[0]].y,p[s[1]].x,p[s[1]].y,col,w);C(p[0].x,p[0].y-2,4.2,col);if(f.alive){R(p[0].x+f.dir*1.5-.5,p[0].y-3,1.5,1.5,'#000000');}else{L(p[0].x-2,p[0].y-4,p[0].x+1,p[0].y-1,'#000',1);L(p[0].x+1,p[0].y-4,p[0].x-2,p[0].y-1,'#000',1);}
   if(f.w)drawW(f.w,p[4].x,p[4].y,(f.w==='sword'&&f.atk>0?-1.2+(12-f.atk)*.25:f.aim||0),f.dir);
   if(f.alive){BAR(f.x-8,f.y-40,16,2,f.hp/100,COL[f.i],'#000');if(f.i<2||A.t%60<30)T(NM()[f.i],f.x,f.y-47,COL[f.i],1,'c');if(f.w&&f.w!=='sword')T(''+f.ammo,f.x+12,f.y-41,K.w,1);}}
  if(lava<250){GL(160,lava,120,'#ff5a1a',.4);GR(0,lava,W,H-lava+2,'#ff7a2a','#a01a0a');for(let x=0;x<W;x+=16)C(x+(A.t*.5%16),lava+Math.sin(x+A.t*.1)*1.5,5,'#ff9a3a');}
  for(const b of bul){L(b.x,b.y,b.x-b.vx*1.2,b.y-b.vy*1.2,'#fff6b0',1.5);}
  for(const n of nades){C(n.x,n.y,2.6,n.t<25&&A.t%6<3?K.r:'#3a6a2a');}
  R(0,0,W,13,'rgba(0,0,0,.55)');for(let i=0;i<4;i++){const x=6+i*80;C(x+3,6,3.5,COL[i]);T(NM()[i],x+10,4,COL[i],1);for(let j=0;j<5;j++)R(x+38+j*7,3,5,6,j<wins[i]?COL[i]:'#2a2a3a');}
  T(M.n,160,16,K.gr,1,'c');
  if(bT>0||state==='ready'){AL(Math.min(1,(state==='ready'?90:bT)/20));T(state==='ready'?(st<40?banner:'FIGHT!'):banner,160,100,state==='over'&&winner>=0?COL[winner]:K.y,2,'c');AL(1);}};
 return g;}});

/* ---- TINY RACERS: top-down toy car championship ---- */
A.add({id:'tinyracers',name:'TINY RACERS',cat:'SPORTS',time:600,tags:'micro machines racing toy cars top down',
how:'UP OR A GAS, DOWN BRAKES, LEFT/RIGHT STEER, B USES ITEMS. 3 LAPS x 4 TRACKS. WIN THE CUP.',make(){
 const g={over:null,score:0};
 const TR=[
  {n:'BREAKFAST TABLE',wp:[[120,120],[400,100],[640,130],[690,270],[590,340],[460,300],[380,380],[440,460],[300,490],[140,450],[90,300]],w:50,bg:'#b07a48',bg2:'#9a6838',edge:1,tc:'#e8e0d0',bc:'#c83a3a',
   ob:[[250,290,46,'bowl'],[545,215,20,'cup'],[700,450,24,'cup'],[230,190,10,'cube'],[600,470,14,'egg']],dec:'table'},
  {n:'GARDEN PATH',wp:[[100,100],[300,80],[420,180],[560,90],[700,160],[680,340],[540,460],[360,420],[260,500],[110,430],[160,280]],w:50,bg:'#4a8a3a',bg2:'#3e7a32',slow:1,tc:'#c8a878',bc:'#8a6a4a',
   ob:[[330,280,40,'pot'],[560,300,30,'stone'],[700,520,26,'pot'],[60,540,22,'stone'],[460,30,16,'stone']],dec:'garden'},
  {n:'OFFICE DESK',wp:[[120,90],[640,90],[690,200],[520,240],[520,330],[680,380],[620,500],[160,500],[90,420],[150,330],[100,220]],w:48,bg:'#6a5a4a',bg2:'#5e4e40',tc:'#f0f0f4',bc:'#3a6ad8',
   ob:[[380,200,36,'mug'],[370,390,30,'tape'],[250,410,14,'eraser'],[720,280,18,'mug']],dec:'desk'},
  {n:'POOL TABLE',wp:[[140,110],[620,110],[690,220],[600,290],[420,270],[350,340],[470,400],[650,420],[600,500],[150,500],[80,400],[90,200]],w:50,bg:'#1e7a4a',bg2:'#1a6e42',edge:1,tc:'#d8d0b8',bc:'#e8e8e8',
   ob:[[260,300,9,'ball'],[300,220,9,'ball'],[200,380,9,'ball'],[520,190,9,'ball'],[560,360,9,'ball']],dec:'pool'}];
 const NAMES=['YOU','ZIPPY','BOLT','NOVA','RUSTY','PIXIE','TURBO','MOJO'],COLS=['#2f8bff','#ff4f6d','#ffcf3f','#3dff8b','#ff9838','#c86bff','#2fd6c3','#f0f0f0'];
 const PTS=[10,8,6,5,4,3,2,1];
 let ti=-1,trk,path,cars=[],state='intro',st=0,cam={x:0,y:0},boxes=[],hz=[],shots=[],champ=[0,0,0,0,0,0,0,0],res=[],finT=0,cps=0,msg='',msgT=0,balls=[];
 const LAPS=3;
 function smooth(wp){const o=[],n=wp.length;for(let i=0;i<n;i++){const p0=wp[(i-1+n)%n],p1=wp[i],p2=wp[(i+1)%n],p3=wp[(i+2)%n];for(let s=0;s<10;s++){const t=s/10,t2=t*t,t3=t2*t;o.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}return o;}
 const N=()=>path.length;
 function segT(c,i){const a=path[(i-1+N())%N()],b=path[i%N()],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;return((c.x-a[0])*dx+(c.y-a[1])*dy)/l;}
 function distPath(x,y,c0){let best=1e9;for(let k=-3;k<=3;k++){const i=(c0+k+N()*2)%N(),j=(i+1)%N(),a=path[i],b=path[j],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=cl(((x-a[0])*dx+(y-a[1])*dy)/l,0,1),d=Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);if(d<best)best=d;}return best;}
 function loadTrack(i){ti=i;trk=TR[i];path=smooth(trk.wp);const p0=path[0],p1=path[2],ang=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]);cars=[];
  const order=[0,1,2,3,4,5,6,7].sort((a,b)=>i===0?b-a:champ[a]-champ[b]);
  order.forEach((id,k)=>{const row=Math.floor(k/2),side=k%2?1:-1,bx=p0[0]-Math.cos(ang)*(20+row*18),by=p0[1]-Math.sin(ang)*(20+row*18);cars.push({id,x:bx-Math.sin(ang)*side*11,y:by+Math.cos(ang)*side*11,a:ang,v:0,vx:0,vy:0,lap:0,cp:1,prog:0,item:null,boost:0,spin:0,fall:0,fin:0,place:0,sk:id===0?1:.9+id*.012+rnd(.03),off:0,rx:0,ry:0,last:0,useT:60+ri(200),ai:id!==0,trail:[]});});
  boxes=[];for(const f of [.3,.62]){const k=Math.floor(N()*f),a=path[k],b=path[(k+1)%N()],an=Math.atan2(b[1]-a[1],b[0]-a[0]);for(let s=-1;s<=1;s++)boxes.push({x:a[0]-Math.sin(an)*s*15,y:a[1]+Math.cos(an)*s*15,t:0});}
  hz=[];shots=[];balls=trk.dec==='pool'?trk.ob.map(o=>({x:o[0],y:o[1],vx:rnd(1.2)-.6,vy:rnd(1.2)-.6,r:o[2],c:['#e8d020','#2050d0','#d02020','#6a2a8a','#e87a20'][ri(5)]})):[];
  state='count';st=0;finT=0;res=[];const p=cars.find(c=>c.id===0);cam.x=p.x-160;cam.y=p.y-120;}
 const player=()=>cars.find(c=>c.id===0);
 const obs=()=>trk.dec==='pool'?balls.map(b=>[b.x,b.y,b.r,'ball']):trk.ob;
 function useItem(c){const it=c.item;if(!it)return;c.item=null;if(it==='BOOST'){c.boost=70;S('jump');}else if(it==='OIL'){hz.push({k:'oil',x:c.x-Math.cos(c.a)*14,y:c.y-Math.sin(c.a)*14,t:900});S('blip');}else if(it==='BOMB'){hz.push({k:'bomb',x:c.x-Math.cos(c.a)*14,y:c.y-Math.sin(c.a)*14,t:150});S('blip');}else if(it==='ROCKET'){shots.push({x:c.x+Math.cos(c.a)*10,y:c.y+Math.sin(c.a)*10,a:c.a,t:120,o:c});S('shoot');}}
 function spinOut(c,n){if(c.spin>0||c.fin)return;c.spin=n;c.v*=.35;if(c.id===0){A.shake=6;S('boom');}}
 function rank(){const o=cars.slice().sort((a,b)=>(b.fin?1e6-b.fin:0)-(a.fin?1e6-a.fin:0)||b.prog-a.prog);o.forEach((c,i)=>{if(!c.fin)c.place=i+1;});return o;}
 function drive(c,gas,brake,steer,useB){if(c.fall>0){c.fall--;if(c.fall===0){const i=(c.cp-1+N())%N(),a=path[i],b=path[c.cp%N()];c.x=a[0];c.y=a[1];c.a=Math.atan2(b[1]-a[1],b[0]-a[0]);c.v=c.vx=c.vy=0;c.spin=0;}return;}
  if(c.boost>0)c.boost--;const off=distPath(c.x,c.y,c.cp)>trk.w/2+2;c.off=off;
  if(c.spin>0){c.spin--;c.a+=.28;gas=brake=0;steer=0;}
  const top=(c.boost>0?3.7:2.75)*(c.ai?c.sk:1)*(off?(trk.slow?.55:.72):1);
  if(gas)c.v+=c.v<top?.075:-.04;else if(brake)c.v-=c.v>0?.13:.05;else c.v*=.985;if(c.v>top+.05&&!gas)c.v-=.05;c.v=cl(c.v,-1.1,c.boost>0?3.7:3.2);if(c.v>top)c.v-=.06;
  c.a+=steer*.058*cl(Math.abs(c.v)/1.4,0,1)*(c.v<0?-1:1);
  const grip=c.spin>0?.02:off?.12:.2,tx=Math.cos(c.a)*c.v,ty=Math.sin(c.a)*c.v;c.vx+=(tx-c.vx)*grip;c.vy+=(ty-c.vy)*grip;c.x+=c.vx;c.y+=c.vy;
  if(Math.abs(steer)&&Math.abs(c.v)>2.2&&!off&&A.t%3===0)c.trail.push({x:c.x,y:c.y,t:60});
  /* obstacles */
  for(const o of obs()){const dx=c.x-o[0],dy=c.y-o[1],d=Math.hypot(dx,dy),m=o[2]+5;if(d<m&&d>0){c.x=o[0]+dx/d*m;c.y=o[1]+dy/d*m;const dot=(c.vx*dx+c.vy*dy)/d;if(dot<0){c.vx-=1.6*dot*dx/d;c.vy-=1.6*dot*dy/d;c.v*=.55;if(c.id===0&&dot<-1.2){S('hit');A.shake=3;}}}}
  /* edge of table / out of world */
  const out=c.x<20||c.x>760||c.y<20||c.y>560;if(out){if(trk.edge){c.fall=50;c.v=0;if(c.id===0){S('lose');msg='OFF THE EDGE!';msgT=60;}}else{c.x=cl(c.x,20,760);c.y=cl(c.y,20,560);c.vx*=-.5;c.vy*=-.5;c.v*=.4;}}
  if(trk.dec==='pool'){for(const p of [[30,30],[390,22],[750,30],[30,550],[390,558],[750,550]])if(Math.hypot(c.x-p[0],c.y-p[1])<18&&!c.fall){c.fall=50;if(c.id===0){S('lose');msg='POCKETED!';msgT=60;}}}
  /* progress */
  for(let k=0;k<4;k++){if(segT(c,c.cp)>=1&&distPath(c.x,c.y,c.cp)<trk.w*1.6){c.cp=(c.cp+1)%N();if(c.id===0&&!c.fin){cps++;}if(c.cp===1){c.lap++;if(c.lap>=LAPS&&!c.fin){c.fin=cars.filter(q=>q.fin).length+1;c.place=c.fin;if(c.id===0){S('win');msg=['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'][c.fin-1]+' PLACE!';msgT=120;}}else if(c.id===0&&!c.fin){S('coin');msg=c.lap===LAPS-1?'FINAL LAP!':'LAP '+(c.lap+1);msgT=60;}}}else break;}
  c.prog=c.lap*N()+c.cp+cl(segT(c,c.cp),0,1);
  for(const b of boxes)if(b.t<=0&&Math.hypot(c.x-b.x,c.y-b.y)<9&&!c.item){b.t=300;const pl=c.place||4;const pool=pl>=5?['ROCKET','BOOST','BOOST','ROCKET','BOMB']:pl<=2?['OIL','BOMB','OIL','BOOST']:['ROCKET','OIL','BOOST','BOMB'];c.item=pool[ri(pool.length)];if(c.id===0){S('coin');}}
  if(useB)useItem(c);}
 function aiDrive(c){if(c.prog>(c.bp||0)+.5){c.bp=c.prog;c.stk=0;}else if(!c.fall&&++c.stk>170){c.stk=0;const i=(c.cp-1+N())%N(),a=path[i],b=path[c.cp%N()];c.x=a[0];c.y=a[1];c.a=Math.atan2(b[1]-a[1],b[0]-a[0]);c.v=c.vx=c.vy=0;c.spin=0;}const look=Math.round(4+c.v*2.2),tp=path[(c.cp+look)%N()],tp2=path[(c.cp+look+8)%N()];let ta=Math.atan2(tp[1]-c.y,tp[0]-c.x);const da=ang(ta-c.a);
  const turn=Math.abs(ang(Math.atan2(tp2[1]-tp[1],tp2[0]-tp[0])-Math.atan2(tp[1]-c.y,tp[0]-c.x)));const want=turn>1.0?1.7:turn>.6?2.2:3;
  for(const o of obs()){const dx=o[0]-c.x,dy=o[1]-c.y,d=Math.hypot(dx,dy);if(d<o[2]+30){const a2=ang(Math.atan2(dy,dx)-c.a);if(Math.abs(a2)<.6){c.a+=(a2>0?-1:1)*.03;}}}
  const p=player();let rub=1;if(p&&!c.fin){const gap=c.prog-p.prog;rub=gap>N()*.25?.93:gap<-N()*.25?1.06:1;}c.sk2=rub;
  let useB=false;if(c.item){c.useT--;if(c.item==='BOOST'&&Math.abs(da)<.15&&turn<.4&&c.useT<0)useB=true;if(c.item==='ROCKET'){for(const o of cars)if(o!==c&&Math.hypot(o.x-c.x,o.y-c.y)<130&&Math.abs(ang(Math.atan2(o.y-c.y,o.x-c.x)-c.a))<.25)useB=true;}if((c.item==='OIL'||c.item==='BOMB')){for(const o of cars)if(o!==c&&Math.hypot(o.x-c.x,o.y-c.y)<60&&Math.abs(ang(Math.atan2(o.y-c.y,o.x-c.x)-c.a))>2.4)useB=true;if(c.useT<-300)useB=true;}}
  const sk=c.sk;c.sk=sk*rub;drive(c,c.v<want*.95,c.v>want+.4,cl(da*2.2,-1,1),useB);c.sk=sk;}
 g.update=()=>{if(msgT)msgT--;const h=A.hit(0),k=A.in(0);
  if(state==='intro'){st++;if((h.a&&st>15)||st>360){loadTrack(0);}return;}
  if(state==='results'){st++;if(h.a&&st>40||st>900){if(ti<3)loadTrack(ti+1);else{const o=[0,1,2,3,4,5,6,7].sort((a,b)=>champ[b]-champ[a]);const pl=o.indexOf(0)+1;g.over=pl===1?'CHAMPION - YOU WIN THE TINY CUP':'CUP OVER - YOU FINISHED '+['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'][pl-1];}}return;}
  st++;if(state==='count'){if(st===1||st===61||st===121)S('blip');if(st>=180){state='race';S('win');}}
  for(const b of boxes)if(b.t>0)b.t--;for(const t of hz)t.t--;
  if(state==='race'){for(const c of cars){if(c.ai||c.fin)aiDrive(c);else drive(c,k.u||k.a,k.d,ax(k),h.b);}
   /* car-car */
   for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){const a=cars[i],b=cars[j];if(a.fall||b.fall)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<10&&d>0){const o=(10-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx*.8;a.vy+=rv*ny*.8;b.vx-=rv*nx*.8;b.vy-=rv*ny*.8;if(a.id===0||b.id===0)S('hit');}}}
   for(const t of hz){for(const c of cars)if(!c.fall&&Math.hypot(c.x-t.x,c.y-t.y)<(t.k==='oil'?11:8)){if(t.k==='oil'){spinOut(c,40);}else{t.t=0;}}if(t.k==='bomb'&&t.t<=0&&!t.done){t.done=1;A.burst(t.x-cam.x,t.y-cam.y,K.o,24,3);S('boom');for(const c of cars)if(Math.hypot(c.x-t.x,c.y-t.y)<30){spinOut(c,60);c.vx+=(c.x-t.x)*.08;c.vy+=(c.y-t.y)*.08;}}}hz=hz.filter(t=>t.t>0||(t.k==='bomb'&&!t.done));
   for(const s of shots){s.t--;let best=null,bd=90;for(const c of cars){if(c===s.o)continue;const d=Math.hypot(c.x-s.x,c.y-s.y),a2=Math.abs(ang(Math.atan2(c.y-s.y,c.x-s.x)-s.a));if(d<bd&&a2<.9){bd=d;best=c;}}if(best)s.a+=cl(ang(Math.atan2(best.y-s.y,best.x-s.x)-s.a),-.06,.06);s.x+=Math.cos(s.a)*4.6;s.y+=Math.sin(s.a)*4.6;
    for(const c of cars)if(c!==s.o&&!c.fall&&Math.hypot(c.x-s.x,c.y-s.y)<8){spinOut(c,60);s.t=0;A.burst(s.x-cam.x,s.y-cam.y,K.o,18,2.5);if(c.id===0||s.o.id===0)S('boom');}for(const o of obs())if(Math.hypot(o[0]-s.x,o[1]-s.y)<o[2])s.t=0;}shots=shots.filter(s=>s.t>0);
   for(const b of balls){b.x+=b.vx;b.y+=b.vy;b.vx*=.995;b.vy*=.995;if(b.x<40||b.x>740)b.vx*=-1;if(b.y<40||b.y>540)b.vy*=-1;for(const c of cars){const dx=b.x-c.x,dy=b.y-c.y,d=Math.hypot(dx,dy);if(d<b.r+6&&d>0){b.vx+=dx/d*Math.max(.6,Math.abs(c.v)*.6);b.vy+=dy/d*Math.max(.6,Math.abs(c.v)*.6);}}const sp=Math.hypot(b.vx,b.vy);if(sp>3){b.vx*=3/sp;b.vy*=3/sp;}if(sp<.3){b.vx+=rnd(.4)-.2;b.vy+=rnd(.4)-.2;}}
   for(const c of cars)for(const t of c.trail)t.t--;for(const c of cars)c.trail=c.trail.filter(t=>t.t>0).slice(-40);
   rank();const p=player();if(cars.some(c=>c.fin)&&!finT)finT=1;if(p.fin&&!p.ft)p.ft=finT;if(finT){finT++;if((p.ft&&finT>p.ft+240)||finT>1500||cars.every(c=>c.fin)){const o=cars.slice().sort((a,b)=>(a.fin||99)-(b.fin||99)||b.prog-a.prog);res=o.map(c=>c.id);res.forEach((id,i)=>champ[id]+=PTS[i]);state='results';st=0;S('win');}}}
  const p=player();const tx=p.x+p.vx*22-160,ty=p.y+p.vy*22-120;cam.x+=(tx-cam.x)*.12;cam.y+=(ty-cam.y)*.12;cam.x=cl(cam.x,-20,800-320+20);cam.y=cl(cam.y,-20,580-240+20);
  g.score=champ[0]*10+cps;};
 /* drawing */
 function carDraw(c,x,y,s){const ctx=A.c;s=s||1;EL(x+2,y+3,8*s,5*s,'rgba(0,0,0,.35)');ctx.save();ctx.translate(x,y);ctx.rotate(c.a);ctx.scale(s,s);const col=COLS[c.id];
  R(-7,-5,4,2,'#111');R(3,-5,4,2,'#111');R(-7,3,4,2,'#111');R(3,3,4,2,'#111');R(-8,-4,16,8,col);R(-8,-4,16,2,A.mix(col,'#ffffff',.35));R(-2,-3,5,6,'#1a2a3a');R(-1,-3,3,6,'#4a6a8a');R(6,-3,2,2,'#ffffc0');R(6,1,2,2,'#ffffc0');if(c.boost>0){R(-11,-2,3,4,A.t%4<2?K.y:K.o);}ctx.restore();}
 function decor(){const d=trk.dec,cx=cam.x,cy=cam.y;
  if(d==='table'){for(let x=-((cx)%60);x<W;x+=60)R(x,0,1,H,'rgba(0,0,0,.15)');}
  if(d==='garden'){for(let i=0;i<60;i++){const x=(i*137)%780,y=(i*251)%580;if(x-cx<-10||x-cx>330||y-cy<-10||y-cy>250)continue;C(x-cx,y-cy,2,i%3?'#e8e050':'#e85a8a');}}
  if(d==='desk'){A.c.globalAlpha=.25;for(let x=-((cx)%24);x<W;x+=24)R(x,0,1,H,'#000');A.c.globalAlpha=1;R(40-cx,240-cy,120,8,'#e8c040');A.poly([[160-cx,240-cy],[172-cx,244-cy],[160-cx,248-cy]],'#e0b080',1);R(560-cx,520-cy,140,10,'#d84040');}
  if(d==='pool'){R(0-cx,0-cy,780,14,'#4a2a10');R(0-cx,566-cy,780,14,'#4a2a10');R(0-cx,0-cy,14,580,'#4a2a10');R(766-cx,0-cy,14,580,'#4a2a10');for(const p of [[30,30],[390,22],[750,30],[30,550],[390,558],[750,550]])C(p[0]-cx,p[1]-cy,15,'#0a0a0a');}
  if(trk.edge&&d==='table'){A.c.globalAlpha=1;}}
 function obDraw(o){const x=o[0]-cam.x,y=o[1]-cam.y,r=o[2];if(x<-r-20||x>W+r+20||y<-r-20||y>H+r+20)return;EL(x+4,y+5,r,r*.9,'rgba(0,0,0,.3)');const t=o[3];
  if(t==='bowl'){C(x,y,r,'#f0f0f8');C(x,y,r*.8,'#e8e0c8');for(let i=0;i<14;i++){const a=i*2.4,rr=(i%4)*r*.18;C(x+Math.cos(a)*rr,y+Math.sin(a)*rr,4,'#e8b850');}}
  else if(t==='cup'||t==='mug'){C(x,y,r,t==='mug'?'#d84a4a':'#f8f8f8');C(x,y,r*.75,'#4a2a1a');R(x+r-2,y-3,8,6,t==='mug'?'#d84a4a':'#f8f8f8');}
  else if(t==='cube'){R(x-r,y-r,r*2,r*2,'#ffffff');}else if(t==='egg'){EL(x,y,r,r*.8,'#ffffff');C(x,y,r*.45,'#ffc020');}
  else if(t==='pot'){C(x,y,r,'#b8603a');C(x,y,r*.8,'#5a3a20');for(let i=0;i<5;i++)C(x+Math.cos(i*1.26)*r*.4,y+Math.sin(i*1.26)*r*.4,r*.35,'#3a9a3a');}
  else if(t==='stone'){C(x,y,r,'#8a8a8a');C(x-r*.3,y-r*.3,r*.4,'#aaaaaa');}else if(t==='tape'){C(x,y,r,'#c8c8d0');C(x,y,r*.5,trk.bg);}else if(t==='eraser'){R(x-r,y-r*.6,r*2,r*1.2,'#e86a8a');}
  else if(t==='ball'){C(x,y,r,o[4]||'#e8d020');}}
 g.draw=()=>{if(state==='intro'){GR(0,0,W,H,'#2a3a6a','#0a1a3a');T('TINY RACERS',160,30,K.y,3,'c');T('THE TINY CUP: 4 TRACKS, 8 TOY CARS, 3 LAPS EACH',160,60,K.w,1,'c');T('POINTS 10-8-6-5-4-3-2-1. MOST POINTS LIFTS THE CUP.',160,72,K.gr,1,'c');
   for(let i=0;i<8;i++)carDraw({id:i,a:-1.57+Math.sin(A.t*.05+i)*.2,boost:0},40+i*34,130,2);T('GRAB ? BOXES FOR BOOSTS, ROCKETS, OIL AND BOMBS',160,170,K.c,1,'c');T('B FIRES THEM. FALL OFF A TABLE AND YOU LOSE TIME.',160,182,K.c,1,'c');if(A.t%60<40)T('PRESS A',160,206,K.w,2,'c');return;}
  A.cls(trk.bg);const cx=cam.x,cy=cam.y;
  for(let y=-((cy)%40)-40;y<H;y+=40)R(0,y,W,20,trk.bg2);decor();
  if(trk.edge&&trk.dec==='table'){const ex=20-cx,ey=20-cy;R(0,0,W,Math.max(0,ey),'#1a1410');R(0,560-cy,W,H,'#1a1410');R(0,0,Math.max(0,ex),H,'#1a1410');R(760-cx,0,W,H,'#1a1410');R(ex,ey,740,3,'#d09060');R(ex,557-cy,740,3,'#5a3a20');}
  const c=A.c;c.lineJoin='round';c.lineCap='round';const stroke=(w,col,dash)=>{c.strokeStyle=col;c.lineWidth=w;if(c.setLineDash)c.setLineDash(dash||[]);c.beginPath();path.forEach((p,i)=>{const x=p[0]-cx,y=p[1]-cy;if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.closePath();c.stroke();if(c.setLineDash)c.setLineDash([]);};
  stroke(trk.w+8,'rgba(0,0,0,.25)');stroke(trk.w+6,trk.bc);stroke(trk.w+6,'#ffffff',[10,10]);stroke(trk.w,trk.tc);stroke(2,'rgba(0,0,0,.18)',[8,10]);
  {const a=path[0],b=path[2],an=Math.atan2(b[1]-a[1],b[0]-a[0]),nx=-Math.sin(an),ny=Math.cos(an);for(let s=-trk.w/2;s<trk.w/2;s+=5)for(let r=0;r<2;r++){const px=a[0]+nx*s+Math.cos(an)*r*5-cx,py=a[1]+ny*s+Math.sin(an)*r*5-cy;R(px-2.5,py-2.5,5,5,((s/5|0)+r)%2?'#ffffff':'#111111');}}
  for(const cr of cars)for(const t of cr.trail){AL(t.t/120);R(t.x-cx-1,t.y-cy-1,2,2,'#222222');}AL(1);
  for(const b of boxes)if(b.t<=0){const x=b.x-cx,y=b.y-cy+Math.sin(A.t*.1+b.x)*1.5;R(x-5,y-5,10,10,'#ffcf3f');A.box(x-5,y-5,10,10,'#c87a10');T('?',x+.5,y-2,'#8a3a10',1,'c');}
  for(const t of hz){const x=t.x-cx,y=t.y-cy;if(t.k==='oil'){EL(x,y,11,7,'#1a1a22');EL(x-2,y-2,4,2,'#4a4a6a');}else{C(x,y,4,'#222');if(A.t%10<5)C(x+2,y-3,1.5,K.r);}}
  obs().forEach(o=>obDraw(trk.dec==='pool'?[o[0],o[1],o[2],'ball',balls.find(b=>b.x===o[0])?balls.find(b=>b.x===o[0]).c:'#fff']:o));
  for(const cr of cars.slice().sort((a,b)=>a.y-b.y)){const x=cr.x-cx,y=cr.y-cy;if(x<-20||x>W+20||y<-20||y>H+20)continue;if(cr.fall>0){const s=cr.fall/50;AL(s);carDraw(cr,x,y,s);AL(1);continue;}carDraw(cr,x,y,1);if(cr.id===0)A.ring(x,y,11,A.t%20<10?'#ffffff':'#2f8bff');if(cr.spin>0&&A.t%6<3)T('*',x,y-12,K.y,1,'c');}
  for(const s of shots){const x=s.x-cx,y=s.y-cy;L(x,y,x-Math.cos(s.a)*7,y-Math.sin(s.a)*7,'#e83a3a',3);C(x-Math.cos(s.a)*8,y-Math.sin(s.a)*8,2,A.t%4<2?K.y:K.o);}
  /* HUD */
  const p=player();R(0,0,W,14,'rgba(0,0,0,.55)');T(trk.n+'  '+(ti+1)+'/4',4,4,K.y,1);const lp=Math.min(LAPS,p.lap+1);T('LAP '+lp+'/'+LAPS,150,4,K.w,1);
  const pl=p.fin||p.place||8;T(['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'][pl-1],W-30,18,pl===1?K.y:K.w,3,'r');T('/8',W-6,27,K.gr,1,'r');
  R(4,18,22,22,'rgba(0,0,0,.5)');A.box(4,18,22,22,p.item?K.y:'#5a5a6a');if(p.item){const it=p.item,x=15,y=29;if(it==='BOOST'){A.poly([[x-5,y+4],[x,y-6],[x+5,y+4]],K.o,1);}else if(it==='ROCKET'){R(x-6,y-2,10,4,K.r);A.poly([[x+4,y-3],[x+8,y],[x+4,y+3]],'#ddd',1);}else if(it==='OIL'){EL(x,y+1,7,4,'#2a2a3a');}else{C(x,y+1,5,'#222');R(x-1,y-6,2,3,K.y);}T(it,15,42,K.w,1,'c');}
  T('PTS '+champ[0],W-4,4,K.c,1,'r');
  const mx=W-66,my=H-52;R(mx-2,my-2,64,50,'rgba(0,0,0,.45)');c.strokeStyle='#cccccc';c.lineWidth=2;c.beginPath();path.forEach((q,i)=>{const x=mx+q[0]/780*60,y=my+q[1]/580*46;if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.closePath();c.stroke();for(const cr of cars)C(mx+cr.x/780*60,my+cr.y/580*46,cr.id===0?2.5:1.6,COLS[cr.id]);
  if(state==='count'){const n=3-Math.floor(st/60);for(let i=0;i<3;i++)C(136+i*24,90,9,i<3-n?(n<=0?K.g:K.r):'#2a2a2a');T(n>0?''+n:'GO!',160,108,n>0?K.r:K.g,3,'c');}
  if(msgT)T(msg,160,60,K.y,2,'c');
  if(state==='results'){PANEL(40,24,240,196,K.y,.94);T(trk.n+' RESULTS',160,30,K.y,1,'c');res.forEach((id,i)=>{const y=44+i*10;T((i+1)+'. '+NAMES[id],56,y,id===0?K.c:K.w,1);T('+'+PTS[i],150,y,K.g,1,'r');});
   T('CUP STANDINGS',220,44,K.y,1,'c');[0,1,2,3,4,5,6,7].sort((a,b)=>champ[b]-champ[a]).forEach((id,i)=>{const y=56+i*10;C(170,y+2,2.5,COLS[id]);T(NAMES[id],176,y,id===0?K.c:K.w,1);T(''+champ[id],268,y,K.y,1,'r');});
   T(ti<3?'A: NEXT TRACK - '+TR[ti+1].n:'A: SEE THE FINAL CUP RESULT',160,206,K.c,1,'c');}};
 return g;}});

/* ---- MONSTER TAMER: creature-collecting RPG ---- */
A.add({id:'monstertamer',name:'MONSTER TAMER',cat:'SIM',time:900,tags:'pokemon creature collector rpg monster catching gym badges',
how:'ARROWS WALK, A TALKS/CONFIRMS, B OPENS THE MENU. CATCH, TRAIN, AND BEAT 3 GYMS.',make(){
 const g={over:null,score:0},TS=16;
 const MAP=['##############################','#..........^^^^^^^^..........#','#..RRRRRRR..........RRRRR....#','#..RRRRRRR..........RRRRR....#','#..HHHGHHH..........HHCHH....#','#.....=...............=......#','#.....=================......#','#.f...........==.........f...#','#......S......==....rr.......#','#.............==.............#','##########....==....##########','#,,,,,,,,#....==....#,,,,,,,,#',
  '#,,,,,,,,.....==.....,,,,,,,,#','#,,,,,,,,.....==.....,,,,,,,,#','#.............==.............#','#..~~~~~~.....==...T.........#','#..~~~~~~.....==.............#','#.....,,,,,,..==..,,,,,,,....#','#.....,,,,,,..==..,,,,,,,....#','~~~~~~~~~~~~~~BB~~~~~~~~~~~~~~','~~~~~~~~~~~~~~BB~~~~~~~~~~~~~~','#.............==.............#','#.....,,,,,,.T==..,,,,,,,....#','#.....,,,,,,..==..,,,,,,,....#','#.....,,,,,,..==..,,,,,,,....#','#..rr.........==...T.....rr..#','#.............==.............#','##############X###############',
  '#.............==.............#','#..RRRRR.........RRRRRRR.....#','#..RRRRR.........RRRRRRR.....#','#..HHCHH.........HHHGHHH.....#','#....=..............=........#','#....================........#','#.f...........==.........~~~.#','#.......S.....==....f....~~~.#','#.............==.............#','#....rr.......==.......rr....#','#.............==.............#','##############X###############',
  '#.............==.............#','#..,,,,,,.....==.....,,,,,,..#','#..,,,,,,.....==.....,,,,,,..#','#..,,,,,,..T..==.............#','#.............==....T........#','#.....rr......==.....,,,,,,..#','#..~~~~.......==.....,,,,,,..#','#..~~~~.......==.............#','#.............==..,,,,,,.....#','#..,,,,,,.....==..,,,,,,.....#','#..,,,,,,.....==.............#','#.............==.............#',
  '#.............==.............#','#.RRRRR.RRRRR.....RRRRRRR....#','#.RRRRR.RRRRR.....RRRRRRR....#','#.HHMHH.HHCHH.....HHHGHHH....#','#...=.....=...==.....=.......#','#...==================.......#','#.f...........==.........f...#','#.....S.......==.............#','#.............==.............#','#..,,,,,,.............,,,,,..#','#..,,,,,,.............,,,,,..#','##############################'];
 const MW=30,MH=MAP.length;
 const TY=['NORMAL','FIRE','WATER','GRASS','VOLT','EARTH'],TC=['#c8c0b0','#ff7a3a','#4aa8ff','#5ad04a','#ffd83a','#c09060'];
 const EFF=(a,d)=>{const t={1:{3:2,2:.5,1:.5,5:.5},2:{1:2,5:2,2:.5,3:.5},3:{2:2,5:2,1:.5,3:.5},4:{2:2,5:0,3:.5,4:.5},5:{1:2,4:2,3:.5}};return t[a]&&t[a][d]!==undefined?t[a][d]:1;};
 const MV={TACKLE:[0,35,95],'QUICK JAB':[0,40,100,'pri'],GROWL:[0,0,100,'atk-'],HARDEN:[0,0,100,'def+'],SOOTHE:[0,0,100,'heal'],GUST:[0,45,100],'BODY SLAM':[0,75,90],
  EMBER:[1,40,100],'FLAME DASH':[1,65,95],INFERNO:[1,90,85],BUBBLE:[2,40,100],'WAVE BREAK':[2,65,95],'TIDAL CRASH':[2,90,85],'LEAF CUT':[3,40,100],'VINE LASH':[3,65,95],'BLOOM BEAM':[3,90,85],
  SPARK:[4,40,100],'THUNDER FANG':[4,65,95],STORMBOLT:[4,90,85],'ROCK TOSS':[5,45,95],'MUD SLAM':[5,60,95],QUAKE:[5,90,90]};
 /* name,type,hp,atk,def,spd,evoTo,evoLv,catch,look,learnset */
 const SP=[
  ['EMBIT',1,46,56,42,62,1,14,.5,{c:'#ff8a3a',b:'#ffe0b0',s:.8,ears:'point',tail:'flame'},[[1,'TACKLE'],[1,'GROWL'],[5,'EMBER'],[10,'QUICK JAB'],[16,'FLAME DASH'],[22,'INFERNO']]],
  ['BLAZELYNX',1,70,82,60,84,-1,0,.2,{c:'#e84a2a',b:'#ffd090',s:1.15,ears:'point',tail:'flame',head:'mane',legs:1},[[1,'TACKLE'],[16,'FLAME DASH'],[22,'INFERNO']]],
  ['PUDDLIT',2,52,48,58,44,3,14,.5,{c:'#4a9aff',b:'#c8e8ff',s:.8,head:'fin',eyes:'big'},[[1,'TACKLE'],[1,'GROWL'],[5,'BUBBLE'],[10,'HARDEN'],[16,'WAVE BREAK'],[22,'TIDAL CRASH']]],
  ['TORRENTOAD',2,80,72,82,56,-1,0,.2,{c:'#2a6ad8',b:'#a8d0ff',s:1.2,shape:'wide',back:'spikes',spots:'#1a4aa8'},[[1,'TACKLE'],[16,'WAVE BREAK'],[22,'TIDAL CRASH']]],
  ['SPROUTLE',3,50,52,56,48,5,14,.5,{c:'#5ac04a',b:'#d8f0b0',s:.8,head:'sprout'},[[1,'TACKLE'],[1,'GROWL'],[5,'LEAF CUT'],[10,'HARDEN'],[16,'VINE LASH'],[22,'BLOOM BEAM']]],
  ['THORNOAK',3,78,76,80,54,-1,0,.2,{c:'#7a6a3a',b:'#b8d880',s:1.2,shape:'tall',head:'crown',back:'spikes'},[[1,'TACKLE'],[16,'VINE LASH'],[22,'BLOOM BEAM']]],
  ['ZAPPIP',4,40,52,38,78,7,15,.45,{c:'#ffd83a',b:'#fff4c0',s:.7,ears:'point',tail:'zig',tips:'#2a2a2a'},[[1,'QUICK JAB'],[4,'SPARK'],[9,'GROWL'],[15,'THUNDER FANG'],[21,'STORMBOLT']]],
  ['VOLTARO',4,62,80,56,96,-1,0,.15,{c:'#ffc81a',b:'#3a3a3a',s:1.1,ears:'point',tail:'zig',head:'mane',tips:'#2a2a2a',legs:1},[[1,'SPARK'],[15,'THUNDER FANG'],[21,'STORMBOLT']]],
  ['PEBBLIN',5,48,58,70,30,9,16,.5,{c:'#8a8a8a',b:'#aaaaaa',s:.75,shape:'round',spots:'#6a6a6a'},[[1,'TACKLE'],[1,'HARDEN'],[6,'ROCK TOSS'],[13,'MUD SLAM'],[20,'QUAKE']]],
  ['BOULDRAKE',5,80,86,96,40,-1,0,.15,{c:'#6a6a72',b:'#9a9aa0',s:1.25,shape:'wide',head:'horns',back:'spikes',spots:'#4a4a52'},[[1,'ROCK TOSS'],[13,'MUD SLAM'],[20,'QUAKE']]],
  ['FLUFFIN',0,56,44,46,52,11,12,.6,{c:'#f4f0e8',b:'#ffffff',s:.75,shape:'fluff',ears:'round'},[[1,'TACKLE'],[1,'GROWL'],[7,'QUICK JAB'],[11,'SOOTHE'],[17,'BODY SLAM']]],
  ['CLOUDMANE',0,82,66,62,74,-1,0,.25,{c:'#e8e4f8',b:'#ffffff',s:1.15,shape:'fluff',head:'mane',legs:1},[[1,'QUICK JAB'],[11,'SOOTHE'],[17,'BODY SLAM']]],
  ['MOTHLIT',3,44,46,40,70,-1,0,.55,{c:'#c8d850',b:'#f0f8b0',s:.75,back:'wings',head:'antenna'},[[1,'TACKLE'],[4,'LEAF CUT'],[8,'GUST'],[14,'VINE LASH'],[19,'SOOTHE']]],
  ['SHELLBY',2,56,50,76,38,-1,0,.45,{c:'#2ab8a8',b:'#c8f0e8',s:.85,shape:'wide',back:'shell'},[[1,'TACKLE'],[1,'HARDEN'],[5,'BUBBLE'],[12,'WAVE BREAK'],[20,'TIDAL CRASH']]],
  ['ASHMOLE',1,54,66,50,56,-1,0,.45,{c:'#6a4a3a',b:'#c89070',s:.85,spots:'#ff7a2a',ears:'round',claws:1},[[1,'TACKLE'],[5,'EMBER'],[10,'ROCK TOSS'],[16,'FLAME DASH'],[22,'QUAKE']]]];
 const stat=(b,lv,hp)=>hp?Math.floor(b*2*lv/100)+lv+10:Math.floor(b*2*lv/100)+5;
 const xpFor=lv=>lv*lv*8;
 function mkMon(s,lv){const m={s,lv,xp:xpFor(lv),mv:[],st:[0,0]};SP[s][10].forEach(l=>{if(l[0]<=lv&&!m.mv.includes(l[1])){m.mv.push(l[1]);if(m.mv.length>4)m.mv.shift();}});calc(m);m.hp=m.mhp;return m;}
 function calc(m){const d=SP[m.s];const old=m.mhp||0;m.mhp=stat(d[2],m.lv,1);m.atk=stat(d[3],m.lv);m.def=stat(d[4],m.lv);m.spd=stat(d[5],m.lv);if(old&&m.hp!==undefined)m.hp=Math.min(m.mhp,m.hp+(m.mhp-old));}
 /* trainers */
 const TRN=[{x:11,y:43,d:3,n:'BUG CATCHER BEN',team:[[12,5],[10,5]],pay:120,line:'MY BUGS ARE READY TO RUMBLE!'},{x:20,y:44,d:1,n:'HIKER HAL',team:[[8,7]],pay:140,line:'ROCKS NEVER LOSE. MOSTLY.'},
  {x:19,y:15,d:1,n:'SWIMMER SUE',team:[[13,10],[2,10]],pay:220,line:'THE RIVER MADE US STRONG!'},{x:13,y:22,d:3,n:'FIREBUG FINN',team:[[14,11]],pay:220,line:'FEEL THE HEAT!'},{x:19,y:25,d:1,n:'ACE AMY',team:[[6,11],[10,12]],pay:260,line:'I AIM TO BE THE BEST.'}];
 const GYM=[{x:21,y:55,n:'LEADER ROWAN',b:'STONE BADGE',team:[[8,7],[10,8]],line:'MY STONES ARE STEADY. SHOW ME YOUR NERVE!',pay:400},{x:20,y:31,n:'LEADER MARINA',b:'TIDE BADGE',team:[[13,11],[2,11],[3,13]],line:'THE SEA TESTS EVERY TRAINER.',pay:700},{x:6,y:4,n:'LEADER VOLTA',b:'SPARK BADGE',team:[[6,14],[14,14],[7,16]],line:'LIGHTNING NEVER WAITS. NEITHER DO I!',pay:1000}];
 const SIGNS={'6,59':'MOSSVALE - WHERE JOURNEYS BEGIN. TALL GRASS HIDES WILD CREATURES.','8,35':'CINDERPORT - THE TIDE GYM IS UPTOWN.','7,8':'FROSTPEAK - HOME OF THE SPARK GYM. THE LAST CHALLENGE.'};
 const GUARD={'14,39':[1,'ONLY TRAINERS WITH THE STONE BADGE MAY PASS. TRY THE GYM IN MOSSVALE.'],'14,27':[2,'THE BRIDGE NORTH NEEDS THE TIDE BADGE. VISIT CINDERPORT GYM.']};
 const ZONES=[[0,10,'FROSTPEAK',[[13,11,13],[14,11,13],[6,12,14],[12,11,13]]],[11,26,'ROUTE 2',[[13,8,11],[14,8,11],[6,8,11],[8,9,12],[12,8,11],[2,9,11],[4,10,12]]],[27,39,'CINDERPORT',[]],[40,51,'ROUTE 1',[[10,3,6],[6,4,6],[8,4,7],[12,3,6],[2,5,7],[0,5,7]]],[52,63,'MOSSVALE',[[10,2,4],[12,2,4],[8,3,4]]]];
 const zoneAt=y=>ZONES.find(z=>y>=z[0]&&y<=z[1])||ZONES[4];
 /* state */
 let st='start',sel=0,p={x:4,y:56,d:0,mx:0,my:0,mt:0,step:0},party=[],box=[],bag={orb:5,potion:3},coins=300,badges=0,beaten={},caught=new Set(),seen=new Set(),dlg=null,menu=null,bt=null,heal={x:4,y:56},zoneN='',zoneT=0,cam={x:0,y:0},walkT=0,lastZ='',flash=0,evo=null;
 const dirs=[[0,1],[-1,0],[0,-1],[1,0]];
 const tile=(x,y)=>x<0||y<0||x>=MW||y>=MH?'#':MAP[y][x];
 const trainerAt=(x,y)=>TRN.find(t=>t.x===x&&t.y===y);
 const solid=(x,y)=>{const c=tile(x,y);if('#~HR^rSCMGT'.includes(c))return true;if(c==='X')return badges<GUARD[x+','+y][0];return false;};
 const say=(lines,after)=>{dlg={l:Array.isArray(lines)?lines:[lines],i:0,t:0,after};};
 const lead=()=>party.find(m=>m.hp>0);
 const zone=()=>zoneAt(p.y);
 function healAll(){party.forEach(m=>{m.hp=m.mhp;m.st=[0,0];});}
 /* ---------- battle ---------- */
 function startBattle(kind,team,tr){const en=team.map(t=>mkMon(t[0],t[1]));bt={kind,en,ei:0,tr,q:[],menu:0,sub:null,sel:0,me:party.indexOf(lead()),anim:null,orb:null,shake:0,over:false,runs:0,dispE:0,dispM:0,part:new Set(),turnLock:false};en.forEach(m=>seen.add(m.s));
  bt.dispE=1;bt.dispM=1;const E=en[0];bt.part.add(bt.me);st='battle';S('boom');flash=30;
  if(kind==='wild')Q('A WILD '+SP[E.s][0]+' APPEARED!');else Q(tr.n+' WANTS TO BATTLE!'),Q(tr.n+' SENT OUT '+SP[E.s][0]+'!');Q('GO, '+SP[party[bt.me].s][0]+'!');Q(()=>{bt.menu=0;bt.sub=null;});}
 const Q=x=>bt.q.push(typeof x==='function'?{f:x}:typeof x==='string'?{m:x}:x);
 const me=()=>party[bt.me],foe=()=>bt.en[bt.ei];
 const stg=s=>[.5,.67,1,1.5,2][s+2];
 function doMove(att,def,mvN,isMe){const M=MV[mvN],A_=SP[att.s],D=SP[def.s];Q((isMe?'':'FOE ')+A_[0]+' USED '+mvN+'!');Q({a:isMe?'lunge':'lungeE'});
  Q(()=>{if(att.hp<=0)return;if(M[3]==='atk-'){def.st[0]=Math.max(-2,def.st[0]-1);bt.q.unshift({m:(isMe?'FOE ':'')+D[0]+'\'S ATTACK FELL!'});return;}if(M[3]==='def+'){att.st[1]=Math.min(2,att.st[1]+1);bt.q.unshift({m:A_[0]+'\'S DEFENSE ROSE!'});return;}
   if(M[3]==='heal'){const v=Math.round(att.mhp*.4);att.hp=Math.min(att.mhp,att.hp+v);S('coin');bt.q.unshift({m:A_[0]+' FEELS BETTER!'});return;}
   if(Math.random()*100>M[2]){bt.q.unshift({m:'BUT IT MISSED!'});return;}
   const e=EFF(M[0],D[1]),stab=M[0]===A_[1]&&M[0]>0?1.5:1,crit=Math.random()<.06;let dmg=Math.floor(((2*att.lv/5+2)*M[1]*(att.atk*stg(att.st[0]))/(def.def*stg(def.st[1]))/50+2)*stab*e*(crit?1.5:1)*(.85+Math.random()*.15));if(e===0)dmg=0;
   def.hp=Math.max(0,def.hp-dmg);bt.hit=isMe?'E':'M';bt.hitT=16;S(e>1?'boom':'hit');if(e>1)A.shake=6;const msgs=[];if(crit&&dmg)msgs.push({m:'A CRITICAL HIT!'});if(e>1)msgs.push({m:'IT\'S SUPER EFFECTIVE!'});else if(e===0)msgs.push({m:'IT HAD NO EFFECT...'});else if(e<1)msgs.push({m:'IT\'S NOT VERY EFFECTIVE...'});bt.q.unshift({w:28},...msgs);});}
 function pickFoeMove(f,t){const mvs=f.mv;if(bt.kind==='wild'&&Math.random()<.4)return mvs[ri(mvs.length)];let best=mvs[0],bs=-1;for(const m of mvs){const M=MV[m];let s=M[1]*EFF(M[0],SP[t.s][1])*(M[0]===SP[f.s][1]?1.5:1)*M[2]/100;if(M[3]==='heal')s=f.hp<f.mhp*.4?90:0;if(M[3]==='atk-'||M[3]==='def+')s=f.hp>f.mhp*.7?25:5;s*=.8+Math.random()*.4;if(s>bs){bs=s;best=m;}}return best;}
 function turn(myMove){const M=me(),F=foe(),fm=pickFoeMove(F,M);const meFirst=myMove?((MV[myMove][3]==='pri')!==(MV[fm][3]==='pri')?MV[myMove][3]==='pri':M.spd*stg(0)>=F.spd*(Math.random()<.1?1.2:1)):false;
  const act=(isMe)=>Q(()=>{const a=isMe?me():foe(),d=isMe?foe():me();if(a.hp<=0||d.hp<=0)return;bt.q.unshift(...(()=>{const save=bt.q;bt.q=[];doMove(a,d,isMe?myMove:fm,isMe);const o=bt.q;bt.q=save;return o;})());});
  if(myMove){if(meFirst){act(true);act(false);}else{act(false);act(true);}}else act(false);Q(()=>checkFaint());}
 function checkFaint(){const F=foe(),M=me();if(F.hp<=0){Q({a:'faintE'});Q('FOE '+SP[F.s][0]+' FAINTED!');Q(()=>giveXP(F));Q(()=>{if(bt.ei<bt.en.length-1){bt.ei++;bt.part=new Set([bt.me]);const N=foe();seen.add(N.s);Q(bt.tr.n+' SENT OUT '+SP[N.s][0]+'!');Q(()=>{bt.dispE=1;bt.menu=0;bt.sub=null;});}else win();});return;}
  if(M.hp<=0){Q({a:'faintM'});Q(SP[M.s][0]+' FAINTED!');Q(()=>{if(!lead()){lose();return;}bt.sub='team';bt.forced=true;bt.sel=Math.max(0,party.findIndex(q=>q.hp>0));});return;}Q(()=>{bt.sub=null;});}
 function giveXP(F){const base=Math.round((15*F.lv+20)*(bt.kind==='wild'?1:1.5));const ids=[...bt.part].filter(i=>party[i]&&party[i].hp>0);const o=[];const Q=x=>o.push(typeof x==='function'?{f:x}:{m:x});party.forEach((m,i)=>{if(m.hp<=0)return;const share=ids.includes(i)?Math.round(base/ids.length):Math.round(base*.3);if(!share)return;if(ids.includes(i))Q(SP[m.s][0]+' GAINED '+share+' XP!');Q(()=>{m.xp+=share;while(m.lv<40&&m.xp>=xpFor(m.lv+1)){m.lv++;const old=m.mhp;calc(m);S('win');bt.q.unshift({m:SP[m.s][0]+' GREW TO LV '+m.lv+'!'},...learn(m));}});});bt.q.unshift(...o);}
 function learn(m){const o=[];SP[m.s][10].forEach(l=>{if(l[0]===m.lv&&!m.mv.includes(l[1])){let forgot='';if(m.mv.length>=4){let wi=0,wp=1e9;m.mv.forEach((x,i)=>{const pw=MV[x][1]||20;if(pw<wp){wp=pw;wi=i;}});forgot=m.mv[wi];m.mv.splice(wi,1);}m.mv.push(l[1]);o.push({m:SP[m.s][0]+' LEARNED '+l[1]+'!'+(forgot?' (FORGOT '+forgot+')':'')});}});return o;}
 function win(){bt.over=true;if(bt.kind==='wild'){Q(()=>endBattle());return;}const pay=bt.tr.pay;coins+=pay;Q('YOU DEFEATED '+bt.tr.n+'!');Q('YOU GOT '+pay+' COINS.');if(bt.kind==='gym'){Q('YOU EARNED THE '+bt.tr.b+'!');Q(()=>{badges++;S('win');A.confetti();});}beaten[bt.tr.n]=1;Q(()=>endBattle());}
 function lose(){bt.over=true;Q('YOU HAVE NO CREATURES LEFT...');Q('YOU HURRY BACK TO HEAL. HALF YOUR COINS ARE GONE.');Q(()=>{coins=Math.floor(coins/2);healAll();p.x=heal.x;p.y=heal.y;p.d=0;endBattle();});}
 function endBattle(){party.forEach(m=>m.st=[0,0]);const ev=party.find(m=>SP[m.s][6]>=0&&m.lv>=SP[m.s][7]&&m.hp>0);bt=null;st='walk';if(ev){evo={m:ev,t:0};st='evo';}if(badges>=3&&!g.over){say(['THE SPARK BADGE! THAT MAKES ALL THREE.','YOU ARE THE NEW REGION CHAMPION!'],()=>{g.over='CHAMPION - ALL 3 BADGES WON';});}}
 function throwOrb(){if(bag.orb<=0){Q('YOU HAVE NO TAME ORBS!');Q(()=>{bt.sub=null;});return;}bag.orb--;const F=foe(),rate=SP[F.s][8]*(1.2-F.hp/F.mhp)*1.5;const shakes=Math.random()<rate?3:Math.random()<rate*1.6?2:Math.random()<.5?1:0;Q('YOU THREW A TAME ORB!');Q({a:'orb',n:shakes});
  if(shakes>=3){Q(()=>{caught.add(F.s);S('win');});Q('GOTCHA! '+SP[F.s][0]+' WAS TAMED!');Q(()=>{const m=F;m.st=[0,0];if(party.length<6){party.push(m);}else{box.push(m);bt.q.unshift({m:SP[m.s][0]+' WAS SENT TO STORAGE.'});}bt.over=true;bt.q.push({f:()=>endBattle()});});}
  else{Q(['OH NO! IT BROKE FREE!','ALMOST HAD IT!','SO CLOSE!','ARGH! IT ESCAPED THE ORB!'][shakes]);Q(()=>{turn(null);});}}
 function battleInput(h){if(bt.q.length)return;const opts=bt.sub;
  if(!opts){if(h.l||h.r){bt.menu^=1;S('blip');}if(h.u||h.d){bt.menu^=2;S('blip');}if(h.a){S('blip');if(bt.menu===0){bt.sub='fight';bt.sel=0;}else if(bt.menu===1){bt.sub='bag';bt.sel=0;}else if(bt.menu===2){bt.sub='team';bt.sel=0;bt.forced=false;}else{if(bt.kind!=='wild'){Q('YOU CAN\'T RUN FROM A TRAINER BATTLE!');}else if(Math.random()<.5+.25*bt.runs++||me().spd>foe().spd){Q('GOT AWAY SAFELY!');Q(()=>endBattle());}else{Q('COULDN\'T GET AWAY!');turn(null);}}}return;}
  if(opts==='fight'){const n=me().mv.length;if(h.l||h.r){bt.sel^=1;}if(h.u||h.d){bt.sel^=2;}if(bt.sel>=n)bt.sel=n-1;if(h.b){bt.sub=null;}if(h.a){bt.sub='busy';turn(me().mv[bt.sel]);}return;}
  if(opts==='bag'){const items=[['TAME ORB','orb'],['POTION','potion']];if(h.u||h.d)bt.sel^=1;if(h.b)bt.sub=null;if(h.a){const it=items[bt.sel][1];if(bag[it]<=0){Q('NONE LEFT!');return;}bt.sub='busy';if(it==='orb'){if(bt.kind!=='wild'){Q('YOU CAN\'T TAME ANOTHER TRAINER\'S CREATURE!');Q(()=>{bt.sub=null;});}else throwOrb();}else{bag.potion--;const m=me();m.hp=Math.min(m.mhp,m.hp+30);S('coin');Q(SP[m.s][0]+' RECOVERED HP!');turn(null);}}return;}
  if(opts==='team'){if(h.u)bt.sel=(bt.sel+party.length-1)%party.length;if(h.d)bt.sel=(bt.sel+1)%party.length;if(h.b&&!bt.forced)bt.sub=null;if(h.a){const m=party[bt.sel];if(m.hp<=0){Q('IT HAS NO ENERGY LEFT!');return;}if(bt.sel===bt.me){bt.sub=null;return;}const wasForced=bt.forced;bt.me=bt.sel;bt.part.add(bt.me);bt.sub='busy';bt.dispM=1;Q('GO, '+SP[m.s][0]+'!');if(!wasForced)turn(null);else Q(()=>{bt.sub=null;bt.forced=false;});}}}
 function stepQ(h){if(!bt||!bt.q.length)return;const it=bt.q[0];it.t=(it.t||0)+1;
  if(it.f){bt.q.shift();it.f();return;}if(it.w!==undefined){if(it.t>=it.w)bt.q.shift();return;}
  if(it.a){const dur=it.a==='orb'?40+it.n*28+20:it.a.startsWith('faint')?30:16;bt.anim=it;if(it.t>=dur){bt.q.shift();bt.anim=null;if(it.a==='faintE')bt.dispE=0;if(it.a==='faintM')bt.dispM=0;}if(it.a==='orb'&&it.t>40&&(it.t-40)%28===0)S('blip');return;}
  if(it.m!==undefined){if((h.a&&it.t>8)||it.t>90){bt.q.shift();}}}
 /* ---------- overworld ---------- */
 function tryStep(dx,dy){const nx=p.x+dx,ny=p.y+dy;const c=tile(nx,ny);
  if(c==='X'&&badges<GUARD[nx+','+ny][0]){say(GUARD[nx+','+ny][1]);return false;}if(solid(nx,ny))return false;p.mx=dx;p.my=dy;p.mt=8;return true;}
 function arrive(){p.step++;const z=zone();if(z[2]!==lastZ){lastZ=z[2];zoneN=z[2];zoneT=120;}
  for(const t of TRN){if(beaten[t.n])continue;const[dx,dy]=dirs[t.d];for(let k=1;k<=6;k++){const x=t.x+dx*k,y=t.y+dy*k;if(solid(x,y))break;if(x===p.x&&y===p.y){S('blip');say([t.n+': '+t.line],()=>startBattle('trainer',t.team,t));t.spot=40;return;}}}
  if(tile(p.x,p.y)===','&&z[3].length&&Math.random()<.11){const e=z[3][ri(z[3].length)];startBattle('wild',[[e[0],e[1]+ri(e[2]-e[1]+1)]],null);}}
 function interact(){const[dx,dy]=dirs[p.d],x=p.x+dx,y=p.y+dy,c=tile(x,y);
  if(c==='S'){say(SIGNS[x+','+y]||'A WEATHERED SIGN.');return;}
  if(c==='M'||c==='C'){heal={x,y:y+1};healAll();S('win');if(c==='M'){say(['MOM: YOU LOOK TIRED. REST A WHILE.','YOUR TEAM IS FULLY HEALED!']);return;}say(['INN: YOUR TEAM IS FULLY HEALED!','SHOP: ORBS 50, POTIONS 40. COINS '+coins+'.'],()=>{menu={k:'shop',i:0};st='menu';});return;}
  if(c==='G'){const gi=GYM.findIndex(q=>q.x===x&&q.y===y);const G_=GYM[gi];if(gi>badges){say('THE GYM IS LOCKED. EARN THE EARLIER BADGES FIRST.');return;}if(gi<badges){say(G_.n+': YOU ALREADY HOLD THE '+G_.b+'. KEEP GOING!');return;}say([G_.n+': '+G_.line],()=>startBattle('gym',G_.team,G_));return;}
  const t=trainerAt(x,y);if(t){say(beaten[t.n]?t.n+': YOU BEAT ME FAIR AND SQUARE.':t.n+': '+t.line,beaten[t.n]?null:()=>startBattle('trainer',t.team,t));return;}
  if(c==='X'){say(badges>=GUARD[x+','+y][0]?'GUARD: GO ON THROUGH!':GUARD[x+','+y][1]);return;}if(c==='~')say('THE WATER SPARKLES. SOMETHING SWIMS BELOW.');}
 g.update=()=>{if(flash>0)flash--;if(zoneT>0)zoneT--;const h=A.hit(0),k=A.in(0);
  if(st==='start'){if(h.l){sel=(sel+2)%3;S('blip');}if(h.r){sel=(sel+1)%3;S('blip');}if(mouseOn())for(let i=0;i<3;i++)if(hit2(A.mouse.x,A.mouse.y,30+i*90,70,80,90))sel=i;walkT++;if((h.a&&walkT>15)||walkT>600){party=[mkMon([0,2,4][sel],5)];caught.add([0,2,4][sel]);st='walk';say(['YOU CHOSE '+SP[[0,2,4][sel]][0]+'!','BEAT THE 3 GYM LEADERS TO BECOME CHAMPION. FIRST: LEADER ROWAN, RIGHT HERE IN MOSSVALE.','TIP: TRAIN IN THE TALL GRASS SOUTH OF TOWN FIRST.']);lastZ='MOSSVALE';zoneN='MOSSVALE';zoneT=120;}return;}
  if(dlg){dlg.t++;if((h.a&&dlg.t>8)||(dlg.t>240)){dlg.i++;dlg.t=0;if(dlg.i>=dlg.l.length){const a=dlg.after;dlg=null;if(a)a();}}return;}
  if(st==='evo'){evo.t++;if(evo.t===1)S('blip');if(evo.t%20===0)S('blip');if(evo.t>=150){const m=evo.m,from=SP[m.s][0];m.s=SP[m.s][6];calc(m);caught.add(m.s);S('win');A.confetti();evo=null;st='walk';say(['WHAT? '+from+' IS EVOLVING!','CONGRATULATIONS! '+from+' BECAME '+SP[m.s][0]+'!']);}return;}
  if(st==='battle'){stepQ(h);if(bt)battleInput(h);if(bt&&bt.hitT>0)bt.hitT--;return;}
  if(st==='menu'){menuInput(h);return;}
  /* walking */
  if(p.mt>0){p.mt--;if(p.mt===0){p.x+=p.mx;p.y+=p.my;p.mx=p.my=0;arrive();}}
  else{const dx=ax(k),dy=ay(k);if(dx||dy){const nd=dx?(dx<0?1:3):(dy<0?2:0);if(nd!==p.d&&!k.hold){p.d=nd;}const[ddx,ddy]=dirs[nd];p.d=nd;tryStep(ddx,ddy);}if(h.a)interact();if(h.b){menu={k:'main',i:0};st='menu';S('blip');}}
  const px=p.x*TS+p.mx*(8-p.mt)*2,py=p.y*TS+p.my*(8-p.mt)*2;cam.x=cl(px-152,0,MW*TS-W);cam.y=cl(py-112,0,MH*TS-H);
  g.score=badges*1000+caught.size*100+Object.keys(beaten).length*150+party.reduce((s,m)=>s+m.lv*10,0);};
 function menuInput(h){const m=menu;if(m.k==='main'){const o=['TEAM','BAG','CLOSE'];if(h.u)m.i=(m.i+2)%3;if(h.d)m.i=(m.i+1)%3;if(h.b){menu=null;st='walk';}if(h.a){if(m.i===0)menu={k:'team',i:0,pick:-1};else if(m.i===1)menu={k:'bag',i:0};else{menu=null;st='walk';}}return;}
  if(m.k==='team'){if(h.u)m.i=(m.i+party.length-1)%party.length;if(h.d)m.i=(m.i+1)%party.length;if(h.b){menu={k:'main',i:0};}if(h.a){if(m.pick<0){m.pick=m.i;S('blip');}else{const a=party[m.pick];party[m.pick]=party[m.i];party[m.i]=a;m.pick=-1;S('coin');}}return;}
  if(m.k==='bag'){if(h.u||h.d)m.i^=1;if(h.b)menu={k:'main',i:1};if(h.a&&m.i===1&&bag.potion>0){const t=party.filter(q=>q.hp>0&&q.hp<q.mhp).sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];if(t){bag.potion--;t.hp=Math.min(t.mhp,t.hp+30);S('coin');}}return;}
  if(m.k==='shop'){if(h.u||h.d)m.i=(m.i+(h.u?2:1))%3;if(h.b||(h.a&&m.i===2)){menu=null;st='walk';return;}if(h.a){const c=m.i===0?50:40;if(coins>=c){coins-=c;if(m.i===0)bag.orb++;else bag.potion++;S('coin');}else S('lose');}}}
 /* ---------- drawing ---------- */
 function drawMon(si,x,y,sc,back,alpha){const L_=SP[si][9],s=(L_.s||1)*sc,c=L_.c,b=L_.b,t=A.t;const bob=Math.sin(t*.08+si)*1.5*sc;y+=bob;if(alpha!==undefined)AL(alpha);
  EL(x,y+14*s-bob,16*s,4*s,'rgba(0,0,0,.25)');
  if(L_.tail==='flame'){const fx=x-(back?-1:1)*14*s;for(let i=0;i<3;i++)C(fx+Math.sin(t*.3+i)*2*s,y-4*s-i*4*s,(5-i*1.2)*s,i%2?'#ffd040':'#ff5a1a');}
  if(L_.tail==='zig'){const tx=x-(back?-1:1)*12*s;A.poly([[tx,y],[tx-6*s*(back?-1:1),y-8*s],[tx-2*s*(back?-1:1),y-8*s],[tx-9*s*(back?-1:1),y-18*s],[tx-4*s*(back?-1:1),y-7*s],[tx-8*s*(back?-1:1),y-7*s]],c,1);}
  if(L_.back==='wings'){const fl=Math.sin(t*.4)*.3+1;EL(x-12*s,y-8*s,11*s*fl,15*s,'#f0f0a0');EL(x+12*s,y-8*s,11*s*fl,15*s,'#f0f0a0');C(x-12*s,y-10*s,3*s,'#a8c030');C(x+12*s,y-10*s,3*s,'#a8c030');}
  if(L_.back==='shell'){EL(x,y-4*s,17*s,13*s,'#8a6a3a');EL(x,y-6*s,13*s,9*s,'#b88a4a');for(let i=-1;i<=1;i++)A.ring(x+i*6*s,y-6*s,3*s,'#6a4a2a');}
  if(L_.back==='spikes')for(let i=-2;i<=2;i++)A.poly([[x+i*6*s-3*s,y-12*s],[x+i*6*s,y-(20+Math.abs(i)*-2)*s],[x+i*6*s+3*s,y-12*s]],L_.spots||'#5a4a2a',1);
  if(L_.legs){R(x-10*s,y+4*s,4*s,10*s,A.mix(c,'#000000',.25));R(x+6*s,y+4*s,4*s,10*s,A.mix(c,'#000000',.25));}
  const sh=L_.shape;if(sh==='fluff'){for(let i=0;i<7;i++){const a=i/7*6.28;C(x+Math.cos(a)*9*s,y-2*s+Math.sin(a)*7*s,7*s,c);}C(x,y-2*s,10*s,b);}
  else if(sh==='wide')EL(x,y,18*s,11*s,c);else if(sh==='tall'){EL(x,y-4*s,12*s,16*s,c);}else EL(x,y,13*s,12*s,c);
  if(L_.spots)for(let i=0;i<4;i++)C(x+[-7,6,-3,8][i]*s,y+[-4,-6,4,3][i]*s,2*s,L_.spots);
  if(!back&&sh!=='fluff')EL(x,y+3*s,8*s,6*s,b);
  const hy=y-(sh==='tall'?16:10)*s;
  if(L_.ears==='point'){for(const e of [-1,1]){A.poly([[x+e*4*s,hy-6*s],[x+e*11*s,hy-18*s],[x+e*11*s,hy-4*s]],c,1);if(L_.tips)A.poly([[x+e*9.5*s,hy-14*s],[x+e*11*s,hy-18*s],[x+e*11*s,hy-13*s]],L_.tips,1);}}
  if(L_.ears==='round'){C(x-9*s,hy-6*s,4*s,c);C(x+9*s,hy-6*s,4*s,c);}
  if(L_.head==='sprout'){L(x,hy-8*s,x,hy-14*s,'#3a8a2a',2*s);EL(x-4*s,hy-15*s,5*s,2.5*s,'#6ae05a');EL(x+4*s,hy-16*s,5*s,2.5*s,'#6ae05a');}
  if(L_.head==='crown'){for(let i=0;i<5;i++)C(x-10*s+i*5*s,hy-12*s-(i%2)*3*s,6*s,i%2?'#3a9a3a':'#4ab84a');}
  if(L_.head==='fin')A.poly([[x-3*s,hy-8*s],[x+2*s,hy-18*s],[x+6*s,hy-7*s]],'#8ad0ff',1);
  if(L_.head==='horns'){A.poly([[x-8*s,hy-6*s],[x-14*s,hy-18*s],[x-4*s,hy-8*s]],'#e8e0c8',1);A.poly([[x+8*s,hy-6*s],[x+14*s,hy-18*s],[x+4*s,hy-8*s]],'#e8e0c8',1);}
  if(L_.head==='mane')for(let i=0;i<6;i++){const a=3.6+i*.45;C(x+Math.cos(a)*10*s,hy-2*s+Math.sin(a)*8*s,5*s,si===1?(i%2?'#ffd040':'#ff6a1a'):si===7?'#2a2a2a':'#ffffff');}
  if(L_.head==='antenna'){L(x-3*s,hy-6*s,x-8*s,hy-16*s,'#5a5a2a',1);L(x+3*s,hy-6*s,x+8*s,hy-16*s,'#5a5a2a',1);C(x-8*s,hy-16*s,2*s,'#ffe060');C(x+8*s,hy-16*s,2*s,'#ffe060');}
  if(!back){const er=(L_.eyes==='big'?3.6:2.6)*s;C(x-5*s,y-6*s,er,'#ffffff');C(x+5*s,y-6*s,er,'#ffffff');C(x-4.5*s,y-6*s,er*.6,'#1a1a2a');C(x+5.5*s,y-6*s,er*.6,'#1a1a2a');R(x-4*s,y-7.5*s,s,s,'#ffffff');R(x+6*s,y-7.5*s,s,s,'#ffffff');L(x-3*s,y-1*s,x+3*s,y-1*s,'#3a1a1a',1);if(L_.claws){for(let i=-1;i<=1;i++){L(x-12*s,y+6*s,x-15*s,y+8*s+i*2*s,'#e8e8e8',1);L(x+12*s,y+6*s,x+15*s,y+8*s+i*2*s,'#e8e8e8',1);}}}
  else{EL(x,y-4*s,6*s,4*s,A.mix(c,'#000000',.15));}
  C(x-7*s,y+10*s,3*s,A.mix(c,'#000000',.3));C(x+7*s,y+10*s,3*s,A.mix(c,'#000000',.3));AL(1);}
 const RC=new Map();function roofCol(x,y){const k=x+','+y;if(!RC.has(k))RC.set(k,roofCol0(x,y));return RC.get(k);}
 function roofCol0(x,y){let yy=y;while(tile(x,yy)==='R')yy++;let l=x,r=x;while(tile(l-1,yy)==='H'||'CMG'.includes(tile(l-1,yy)))l--;while(tile(r+1,yy)==='H'||'CMG'.includes(tile(r+1,yy)))r++;let d='';for(let i=l;i<=r;i++)if('CMG'.includes(tile(i,yy)))d=tile(i,yy);return d==='G'?'#8a4ad8':d==='C'?'#d84a4a':'#4a7ad8';}
 const FR=(x,y,w,h,col)=>{A.c.fillStyle=col;A.c.fillRect(Math.round(x),Math.round(y),w,h);};
 function drawTile(x,y){const c=MAP[y][x],sx=x*TS-cam.x,sy=y*TS-cam.y,t=A.t;const gc=y<11?'#d8e8e0':'#6ac04a',gc2=y<11?'#c8dcd4':'#5eb444';
  FR(sx,sy,TS,TS,(x+y)%2?gc:gc2);
  if(c==='.'){if((x*7+y*3)%5===0){R(sx+4,sy+8,1,3,A.mix(gc,'#000000',.2));R(sx+6,sy+7,1,4,A.mix(gc,'#000000',.2));}}
  else if(c===','){FR(sx,sy,TS,TS,y<11?'#a8c8b8':'#3a9a3a');for(let i=0;i<4;i++){const bx=sx+2+i*4,sw=Math.sin(t*.05+x+i)*1;A.poly([[bx,sy+15],[bx+1+sw,sy+4],[bx+3,sy+15]],y<11?'#88a898':'#2a7a2a',1);}}
  else if(c==='='||c==='B'||c==='X'){FR(sx,sy,TS,TS,c==='B'?'#9a6a3a':'#d8c090');if(c==='B')for(let i=0;i<4;i++)R(sx,sy+i*4,TS,1,'#6a4a2a');else{R(sx+3,sy+5,2,2,'#c0a878');R(sx+10,sy+11,2,2,'#c0a878');}}
  else if(c==='#'){FR(sx,sy,TS,TS,gc2);R(sx+6,sy+10,4,6,'#6a4a2a');C(sx+8,sy+7,8,y<11?'#3a6a5a':'#2a7a3a');C(sx+6,sy+5,4,y<11?'#e8f0f0':'#4a9a4a');}
  else if(c==='~'){FR(sx,sy,TS,TS,'#3a7ad8');AL(.4);R(sx+((t*.3+y*5)%16),sy+4,5,1,'#a8d8ff');R(sx+((t*.25+y*9+8)%16),sy+11,4,1,'#a8d8ff');AL(1);}
  else if(c==='R'){const rc=roofCol(x,y);FR(sx,sy,TS,TS,rc);AL(.15);for(let i=0;i<4;i++)FR(sx,sy+i*4+3,TS,1,'#000000');AL(1);R(sx,sy+TS-3,TS,3,A.mix(rc,'#000000',.3));if(tile(x,y-1)!=='R')R(sx,sy,TS,3,A.mix(rc,'#ffffff',.3));}
  else if(c==='H'){FR(sx,sy,TS,TS,'#f0e0c0');R(sx+4,sy+4,8,7,'#8ac8f0');A.box(sx+4,sy+4,8,7,'#8a6a4a');}
  else if('CMG'.includes(c)){R(sx,sy,TS,TS,'#f0e0c0');R(sx+3,sy+2,10,14,'#6a3a1a');R(sx+10,sy+9,2,2,'#e8c040');if(c!=='M'){R(sx+1,sy-4,14,6,c==='G'?'#ffcf3f':'#ffffff');T(c==='G'?'GYM':'INN',sx+8,sy-3,c==='G'?'#6a2a8a':'#d84a4a',1,'c');}}
  else if(c==='r'||c==='^'){C(sx+8,sy+9,7,c==='^'?'#e8f0f8':'#8a8a92');C(sx+6,sy+7,3,c==='^'?'#ffffff':'#aaaab2');}
  else if(c==='f'){C(sx+5,sy+6,2,'#ff6a8a');C(sx+11,sy+10,2,'#ffe060');C(sx+9,sy+4,2,'#ffffff');}
  else if(c==='S'){R(sx+7,sy+8,2,8,'#6a4a2a');R(sx+2,sy+2,12,8,'#a8784a');A.box(sx+2,sy+2,12,8,'#6a4a2a');}
  }
 function hpCol(f){return f>.5?'#3dd84a':f>.2?'#ffcf3f':'#ff4f4f';}
 function infoBox(m,x,y,w,mine){R(x,y,w,mine?34:26,'#f8f0e0');A.box(x,y,w,mine?34:26,'#3a3a4a');T(SP[m.s][0],x+5,y+4,'#2a2a3a',1);T('LV'+m.lv,x+w-5,y+4,'#2a2a3a',1,'r');R(x+5,y+12,4*TY[SP[m.s][1]].length+4,7,TC[SP[m.s][1]]);T(TY[SP[m.s][1]],x+7,y+13,'#1a1a1a',1);
  const f=m.hp/m.mhp;T('HP',x+w-60,y+13,'#c8a020',1);BAR(x+w-50,y+13,45,5,f,hpCol(f),'#4a4a4a');if(mine){T(m.hp+'/'+m.mhp,x+w-5,y+21,'#2a2a3a',1,'r');BAR(x+5,y+29,w-10,2,(m.xp-xpFor(m.lv))/(xpFor(m.lv+1)-xpFor(m.lv)),'#4aa8ff','#c8c8c8');}}
 function drawBattle(){const b=bt,zn=zone()[2];GR(0,0,W,120,b.kind==='gym'?'#4a2a6a':'#8ac8f8',b.kind==='gym'?'#8a5ab8':'#d8f0ff');R(0,120,W,52,b.kind==='gym'?'#5a3a7a':'#a8d880');
  EL(232,98,52,12,b.kind==='gym'?'#6a4a8a':'#88b860');EL(232,96,48,9,b.kind==='gym'?'#7a5a9a':'#98c870');EL(84,160,62,13,b.kind==='gym'?'#6a4a8a':'#88b860');EL(84,158,58,10,b.kind==='gym'?'#7a5a9a':'#98c870');
  const an=b.anim,F=foe(),M=me();let ex=232,ey=78,mx=84,my=134,ea=1,ma=1;if(an){const k=an.t;if(an.a==='lunge')mx+=Math.sin(Math.min(1,k/16)*3.14)*22;if(an.a==='lungeE')ex-=Math.sin(Math.min(1,k/16)*3.14)*22;if(an.a==='faintE'){ey+=k*1.2;ea=1-k/30;}if(an.a==='faintM'){my+=k*1.2;ma=1-k/30;}}
  if(an&&an.a==='orb'){const k=an.t;if(k<40){const tx=k/40;const ox=84+(232-84)*tx,oy=134-Math.sin(tx*3.14)*70+(84-134)*tx;C(ox,oy,5,'#ff4a4a');R(ox-5,oy,10,1,'#222');C(ox,oy+2,4,'#ffffff');}else{const sh=Math.floor((k-40)/28),ph=(k-40)%28;const rx=232+(sh<an.n&&ph<10?Math.sin(ph*.6)*4:0);C(rx,92,6,'#ff4a4a');R(rx-6,92,12,1,'#222');EL(rx,95,5,3,'#ffffff');C(rx,92,1.8,'#ffffff');}}
  else if(b.dispE&&F){const fl=b.hit==='E'&&b.hitT>0&&b.hitT%4<2;drawMon(F.s,ex,ey,1.5,false,fl?.3:ea);}
  if(b.dispM&&M){const fl=b.hit==='M'&&b.hitT>0&&b.hitT%4<2;drawMon(M.s,mx,my,1.8,true,fl?.3:ma);}
  if(F&&b.dispE)infoBox(F,10,10,130,false);if(M&&b.dispM)infoBox(M,176,118,136,true);
  if(b.kind!=='wild'){for(let i=0;i<b.en.length;i++)C(150+i*9,16,3,b.en[i].hp>0?'#ff4f4f':'#5a5a5a');}
  R(0,172,W,68,'#2a2a3a');R(3,175,W-6,62,'#f8f8f0');A.box(3,175,W-6,62,'#4a4a6a');
  const it=b.q[0];if(it&&it.m){const words=it.m.split(' ');const lines=[''];for(const w of words){if((lines[lines.length-1]+' '+w).length>36)lines.push(w);else lines[lines.length-1]=(lines[lines.length-1]+' '+w).trim();}lines.slice(0,3).forEach((l,i)=>T(l,12,182+i*15,'#2a2a3a',2));if(A.t%40<26)A.poly([[300,226],[306,226],[303,230]],'#4a4a6a',1);return;}
  if(b.q.length)return;
  if(!b.sub){T('WHAT WILL '+SP[M.s][0]+' DO?',12,184,'#2a2a3a',1);['FIGHT','BAG','TEAM','RUN'].forEach((o,i)=>{const x=170+(i%2)*72,y=184+Math.floor(i/2)*22;if(i===b.menu){R(x-4,y-4,64,16,'#ffe9a0');A.poly([[x-2,y],[x+2,y+2.5],[x-2,y+5]],'#2a2a3a',1);}T(o,x+6,y,'#2a2a3a',2);});}
  else if(b.sub==='fight'){M.mv.forEach((m,i)=>{const x=10+(i%2)*150,y=181+Math.floor(i/2)*26,on=i===b.sel,D=MV[m];R(x,y,144,22,on?'#ffe9a0':'#eeeeea');A.box(x,y,144,22,on?'#c8a020':'#c8c8c8');T(m,x+6,y+4,'#2a2a3a',1);R(x+6,y+12,TY[D[0]].length*4+4,7,TC[D[0]]);T(TY[D[0]],x+8,y+13,'#1a1a1a',1);T(D[1]?'PWR '+D[1]:'STATUS',x+138,y+13,'#6a6a7a',1,'r');if(on){const e=D[1]?EFF(D[0],SP[F.s][1]):1;if(e!==1)T(e>1?'STRONG!':e===0?'NO EFFECT':'WEAK',x+138,y+4,e>1?'#2a9a3a':'#c83a3a',1,'r');}});}
  else if(b.sub==='bag'){[['TAME ORB',bag.orb],['POTION (+30 HP)',bag.potion]].forEach((o,i)=>{const y=184+i*16;if(i===b.sel)R(10,y-3,300,13,'#ffe9a0');T(o[0],16,y,'#2a2a3a',1);T('X'+o[1],300,y,'#2a2a3a',1,'r');});T('B: BACK',16,222,'#8a8a9a',1);}
  else if(b.sub==='team'){party.forEach((m,i)=>{const x=10+(i%2)*152,y=180+Math.floor(i/2)*18;if(i===b.sel)R(x-2,y-2,148,16,'#ffe9a0');drawMon(m.s,x+8,y+8,.32);T(SP[m.s][0]+' L'+m.lv,x+20,y,i===bt.me?'#2a6ad8':'#2a2a3a',1);BAR(x+20,y+7,60,3,m.hp/m.mhp,hpCol(m.hp/m.mhp),'#888');T(m.hp+'/'+m.mhp,x+140,y+6,'#5a5a6a',1,'r');});if(b.forced)T('CHOOSE WHO GOES NEXT',160,232,'#c83a3a',1,'c');}}
 g.draw=()=>{if(st==='start'){GR(0,0,W,H,'#3a8ad8','#a8e0ff');R(0,170,W,70,'#6ac04a');T('MONSTER TAMER',160,18,'#ffffff',3,'c');T('PROFESSOR: PICK YOUR FIRST PARTNER!',160,48,'#1a2a4a',1,'c');
   [0,2,4].forEach((s,i)=>{const x=70+i*90,on=sel===i;R(x-40,70,80,96,on?'#fff4c0':'#f0f0f0');A.box(x-40,70,80,96,on?'#c8a020':'#aaaaaa');drawMon(s,x,112,on?1.5:1.3);T(SP[s][0],x,146,'#2a2a3a',1,'c');R(x-18,155,36,8,TC[SP[s][1]]);T(TY[SP[s][1]],x,156,'#1a1a1a',1,'c');});
   T('FIRE BEATS GRASS, GRASS BEATS WATER, WATER BEATS FIRE.',160,182,'#1a3a1a',1,'c');T('VOLT BEATS WATER. EARTH BEATS FIRE AND VOLT.',160,194,'#1a3a1a',1,'c');T('LEFT/RIGHT TO CHOOSE, A TO CONFIRM',160,214,'#ffffff',1,'c');return;}
  if(st==='battle'&&bt){drawBattle();if(flash>0){AL(flash/30);R(0,0,W,H,'#ffffff');AL(1);}if(dlg)drawDlg();return;}
  if(st==='evo'&&evo){A.cls('#1a1a3a');const k=evo.t,a=Math.abs(Math.sin(k*k*.0009));GL(160,110,90,'#ffffff',k/150);drawMon(evo.m.s,160,120,2,false,1-a);drawMon(SP[evo.m.s][6],160,120,2,false,a);T('EVOLVING...',160,200,'#ffffff',2,'c');return;}
  A.cls('#2a7a3a');const x0=Math.max(0,Math.floor(cam.x/TS)),y0=Math.max(0,Math.floor(cam.y/TS));for(let y=y0;y<Math.min(MH,y0+17);y++)for(let x=x0;x<Math.min(MW,x0+22);x++)drawTile(x,y);
  for(const t of TRN){const sx=t.x*TS-cam.x+8,sy=t.y*TS-cam.y+15;if(sx<-20||sx>340||sy<-20||sy>270)continue;A.person(sx,sy,{s:.5,c:beaten[t.n]?'#8a8a9a':'#d84a8a',id:t.x,d:t.d===1?-1:1,cap:'#3a3a8a'});if(t.spot>0){t.spot--;T('!',sx,sy-26,K.r,2,'c');}}
  for(const k in GUARD){const[x,y]=k.split(',').map(Number);const open=badges>=GUARD[k][0];const sx=(open?x+1:x)*TS-cam.x+8,sy=y*TS-cam.y+15;A.person(sx,sy,{s:.5,c:'#3a5a9a',id:2,cap:'#1a2a5a',d:open?-1:1});}
  const px=p.x*TS+p.mx*(8-p.mt)*2-cam.x+8,py=p.y*TS+p.my*(8-p.mt)*2-cam.y+15;const onG=tile(p.x,p.y)===','&&!p.mt;A.person(px,py,{s:.52,c:'#e83a3a',pants:'#2a3a6a',cap:'#e83a3a',id:3,st:p.mt?(p.x+p.y)*2+p.mt*.4:0,d:p.d===1?-1:1});if(onG){for(let i=0;i<3;i++)A.poly([[px-6+i*4,py],[px-5+i*4,py-6],[px-3+i*4,py]],'#2a7a2a',1);}
  if(zoneT>0){AL(Math.min(1,zoneT/30));R(6,6,4*zoneN.length+16,15,'#f8f0e0');A.box(6,6,4*zoneN.length+16,15,'#4a4a6a');T(zoneN,14,11,'#2a2a3a',1);AL(1);}
  R(W-112,H-12,112,12,'rgba(0,0,0,.45)');for(let i=0;i<3;i++)C(W-104+i*9,H-6,3,i<badges?['#a8a8b8','#4aa8ff','#ffd83a'][i]:'#3a3a3a');T('C'+coins+'  B:MENU',W-4,H-9,K.w,1,'r');
  if(st==='menu')drawMenu();if(dlg)drawDlg();};
 function drawDlg(){R(6,182,W-12,52,'#f8f8f0');A.box(6,182,W-12,52,'#4a4a6a');A.box(8,184,W-16,48,'#a8a8c0');const s=dlg.l[dlg.i]||'',words=s.split(' '),lines=[''];for(const w of words){if((lines[lines.length-1]+' '+w).length>35)lines.push(w);else lines[lines.length-1]=(lines[lines.length-1]+' '+w).trim();}lines.slice(0,3).forEach((l,i)=>T(l,14,188+i*14,'#2a2a3a',2));if(A.t%40<26)A.poly([[300,224],[306,224],[303,228]],'#4a4a6a',1);}
 function drawMenu(){const m=menu;if(m.k==='main'){R(W-90,8,82,64,'#f8f8f0');A.box(W-90,8,82,64,'#4a4a6a');['TEAM','BAG','CLOSE'].forEach((o,i)=>{if(i===m.i)A.poly([[W-84,16+i*16],[W-80,18.5+i*16],[W-84,21+i*16]],'#2a2a3a',1);T(o,W-74,16+i*16,'#2a2a3a',1);});T('BADGES '+badges+'/3',W-49,62,'#6a6a7a',1,'c');}
  if(m.k==='team'){R(10,8,300,160,'#f8f8f0');A.box(10,8,300,160,'#4a4a6a');T('TEAM - A PICKS, A AGAIN SWAPS. FIRST GOES OUT FIRST.',160,13,'#6a6a7a',1,'c');party.forEach((q,i)=>{const y=24+i*23;if(i===m.i)R(14,y-2,292,22,'#ffe9a0');if(i===m.pick)A.box(14,y-2,292,22,'#d84a4a');drawMon(q.s,30,y+10,.45);T(SP[q.s][0]+'  LV '+q.lv,48,y+1,'#2a2a3a',1);R(48,y+9,TY[SP[q.s][1]].length*4+4,7,TC[SP[q.s][1]]);T(TY[SP[q.s][1]],50,y+10,'#1a1a1a',1);BAR(150,y+3,80,4,q.hp/q.mhp,hpCol(q.hp/q.mhp),'#888');T(q.hp+'/'+q.mhp,300,y+2,'#4a4a5a',1,'r');T(q.mv.join(' '),150,y+11,'#8a8a9a',1);});T('CAUGHT '+caught.size+'/15  SEEN '+seen.size,160,158,'#6a6a7a',1,'c');}
  if(m.k==='bag'){R(W-150,8,142,58,'#f8f8f0');A.box(W-150,8,142,58,'#4a4a6a');[['TAME ORB X'+bag.orb,'USE IN WILD BATTLES'],['POTION X'+bag.potion,'A: HEAL WEAKEST +30']].forEach((o,i)=>{const y=14+i*22;if(i===m.i)R(W-146,y-2,134,20,'#ffe9a0');T(o[0],W-140,y,'#2a2a3a',1);T(o[1],W-140,y+9,'#8a8a9a',1);});}
  if(m.k==='shop'){R(W-160,8,152,70,'#f8f8f0');A.box(W-160,8,152,70,'#4a4a6a');T('COINS '+coins,W-84,13,'#c8a020',1,'c');[['TAME ORB','50'],['POTION','40'],['LEAVE','']].forEach((o,i)=>{const y=26+i*15;if(i===m.i)R(W-156,y-3,144,13,'#ffe9a0');T(o[0],W-150,y,'#2a2a3a',1);T(o[1],W-14,y,'#2a2a3a',1,'r');});T('HAVE ORB '+bag.orb+' POT '+bag.potion,W-84,70,'#8a8a9a',1,'c');}}
 return g;}});

/* ---- MAZE ROYALE: 99-player maze chomper battle ---- */
A.add({id:'mazeroyale',name:'MAZE ROYALE',cat:'CLASSICS',time:260,tags:'pacman 99 pac-man battle royale maze',
how:'ARROWS STEER. EAT GHOST TRAINS TO JAM RIVALS. B PICKS WHO YOU TARGET. BE THE LAST OF 99.',make(){
 const g={over:null,score:0};
 const MZ=['#####################','#.........#.........#','#o###.###.#.###.###o#','#...................#','#.###.#.#####.#.###.#','#.....#...#...#.....#','#####.### # ###.#####','    #.#       #.#    ','#####.# ##-## #.#####','     .  #   #  .     ','#####.# ##### #.#####','    #.#       #.#    ','#####.# ##### #.#####','#.........#.........#','#.###.###.#.###.###.#','#o..#...........#..o#','###.#.#.#####.#.#.###','#.....#...#...#.....#','#.#######.#.#######.#','#...................#','#####################'];
 const MW=21,MH=21,TS=8,OX=76,OY=34,DIR=[[1,0],[0,1],[-1,0],[0,-1]];
 let grid,pel,pac,ghosts,train,sleepers,jams,hist,power=0,lvl=1,t=0,alive=98,opps,target=0,kos=0,inbound=0,sparks=[],dead=0,msg='',msgT=0,combo=0,slow=0,started=0;
 const TG=['RANDOM','WEAKEST','ATTACKERS'];
 const wall=(x,y,gh)=>{x=((x%MW)+MW)%MW;const c=(MZ[y]||'')[x];if(c===undefined)return true;if(c==='#')return true;if(c==='-')return!gh;return false;};
 function fill(){pel=[];for(let y=0;y<MH;y++){pel.push([]);for(let x=0;x<MW;x++){const c=MZ[y][x];pel[y].push(c==='.'?1:c==='o'?2:0);}}}
 function reset(){fill();pac={x:10,y:15,d:2,nd:2,mo:0};ghosts=[[10,9,'#ff3a3a',100],[9,9,'#ff9ad8',220],[10,9,'#3ae8ff',400],[11,9,'#ffaa3a',600]].map((q,i)=>({x:q[0],y:q[1],c:q[2],d:2,rel:q[3],i,mode:'house',fr:0}));
  sleepers=[[3,1],[17,1],[1,5],[19,5],[5,9],[15,9],[3,13],[17,13],[1,17],[19,17],[9,19],[11,19],[5,3],[15,3]].map(p=>({x:p[0],y:p[1]}));train=[];jams=[];hist=[];power=0;}
 opps=[];for(let i=0;i<98;i++)opps.push({alive:1,stress:0,sk:.3+Math.random()*.7,flash:0,atk:0,got:0});
 reset();
 const center=e=>Math.abs(e.x-Math.round(e.x))<.026&&Math.abs(e.y-Math.round(e.y))<.026;
 function stepEnt(e,sp,choose,gh){let left=sp;while(left>0){const s=Math.min(left,.05);left-=s;if(center(e)){e.x=Math.round(e.x);e.y=Math.round(e.y);const nd=choose(e);if(nd!==undefined&&nd>=0)e.d=nd;const[dx,dy]=DIR[e.d];if(wall(e.x+dx,e.y+dy,gh)){if(e===pac)return;}}const[dx,dy]=DIR[e.d];if(center(e)&&wall(Math.round(e.x)+dx,Math.round(e.y)+dy,gh))return;e.x+=dx*s;e.y+=dy*s;if(e.x<-.5)e.x+=MW;if(e.x>MW-.5)e.x-=MW;}}
 function ghostChoose(gh){return e=>{const opts=[];for(let d=0;d<4;d++){if(d===(e.d+2)%4&&e.mode!=='eyes')continue;const[dx,dy]=DIR[d];if(!wall(Math.round(e.x)+dx,Math.round(e.y)+dy,e.mode==='eyes'||e.mode==='exit'))opts.push(d);}if(!opts.length)return(e.d+2)%4;
  if(e.mode==='fright'||e.mode==='jam')return opts[ri(opts.length)];let tx=pac.x,ty=pac.y;if(e.mode==='eyes'){tx=10;ty=9;}else if(e.mode==='exit'){tx=10;ty=7;}else if(e.i===1){tx+=DIR[pac.d][0]*4;ty+=DIR[pac.d][1]*4;}else if(e.i===2){if(Math.random()<.3)return opts[ri(opts.length)];}else if(e.i===3&&Math.hypot(e.x-pac.x,e.y-pac.y)<6){tx=0;ty=20;}
  let best=opts[0],bd=1e9;for(const d of opts){const nx=Math.round(e.x)+DIR[d][0],ny=Math.round(e.y)+DIR[d][1],dd=(nx-tx)**2+(ny-ty)**2;if(dd<bd){bd=dd;best=d;}}return best;};}
 const pickTarget=()=>{const al=opps.map((o,i)=>i).filter(i=>opps[i].alive);if(!al.length)return-1;if(target===1)return al.sort((a,b)=>opps[b].stress-opps[a].stress)[ri(Math.min(3,al.length))];if(target===2){const at=al.filter(i=>opps[i].atk>0);if(at.length)return at[ri(at.length)];}return al[ri(al.length)];};
 function sendAttack(n,sx,sy){for(let k=0;k<n;k++){const i=pickTarget();if(i<0)return;opps[i].stress+=.55;opps[i].got=1;opps[i].flash=30;const[bx,by]=boardPos(i);sparks.push({x:sx,y:sy,tx:bx+5,ty:by+13,t:0});}}
 function boardPos(i){const side=i<49?0:1,j=i%49,c=j%7,r=Math.floor(j/7);return[side?246+c*10.5:2+c*10.5,32+r*29];}
 function eatGhost(x,y){combo++;const pts=100*Math.pow(2,Math.min(combo,6));g.score+=pts;S('score');A.burst(OX+x*TS+4,OY+y*TS+4,K.c,12,2);sendAttack(1+Math.floor(combo/3),OX+x*TS,OY+y*TS);msg=pts+'';msgT=30;}
 function die(){dead=1;S('lose');A.shake=10;A.burst(OX+pac.x*TS+4,OY+pac.y*TS+4,K.y,30,3);}
 g.update=()=>{if(msgT)msgT--;const h=A.hit(0),k=A.in(0);if(!started){started++;msg='GO!';msgT=60;}
  if(dead){dead++;if(dead>80){const rank=alive+1;g.score+=(99-rank)*20;g.over='KNOCKED OUT - RANK '+rank+' OF 99';}return;}
  t++;if(h.b){target=(target+1)%3;S('blip');}
  const ix=ax(k),iy=ay(k);if(ix||iy){pac.nd=ix>0?0:ix<0?2:iy>0?1:3;}if(pac.nd===(pac.d+2)%4)pac.d=pac.nd;
  const spd=(.105+lvl*.005)*(slow>0?.55:1)*(power>0?1.1:1);if(slow>0)slow--;
  stepEnt(pac,spd,e=>{const[dx,dy]=DIR[pac.nd];if(!wall(Math.round(e.x)+dx,Math.round(e.y)+dy))return pac.nd;return e.d;});pac.mo+=.3;
  hist.push([pac.x,pac.y]);if(hist.length>400)hist.shift();
  const px=Math.round(pac.x),py=Math.round(pac.y);if(pel[py]&&pel[py][px]){if(pel[py][px]===2){power=Math.max(160,420-lvl*30);combo=0;ghosts.forEach(q=>{if(q.mode==='chase'){q.mode='fright';q.d=(q.d+2)%4;}});S('coin');}else{if(t%2===0)S('blip');}g.score+=pel[py][px]===2?50:10;pel[py][px]=0;
   if(pel.every(r=>r.every(v=>!v))){lvl++;g.score+=1000;sendAttack(4,OX+84,OY+84);fill();msg='MAZE CLEAR! LEVEL '+lvl;msgT=90;S('win');}}
  if(power>0){power--;if(power===0)ghosts.forEach(q=>{if(q.mode==='fright')q.mode='chase';});}
  /* ghosts */
  const gs=.095+lvl*.006+t/36000;
  for(const q of ghosts){if(q.mode==='house'){if(t>q.rel){q.mode='exit';q.x=10;q.y=9;}else{q.y=9+Math.sin(t*.1+q.i)*.3;continue;}}
   if(q.mode==='exit'&&Math.round(q.y)<=7&&center(q)){q.mode=power>0?'fright':'chase';}
   if(q.mode==='eyes'&&Math.round(q.x)===10&&Math.round(q.y)===9&&center(q)){q.mode='exit';}
   stepEnt(q,q.mode==='eyes'?.25:q.mode==='fright'?gs*.55:gs,ghostChoose(),q.mode==='eyes'||q.mode==='exit');
   if(Math.hypot(q.x-pac.x,q.y-pac.y)<.7){if(q.mode==='fright'){q.mode='eyes';eatGhost(q.x,q.y);}else if(q.mode==='chase'){die();return;}}}
  /* sleepers & train */
  for(let i=sleepers.length-1;i>=0;i--){const s=sleepers[i];if(Math.hypot(s.x-pac.x,s.y-pac.y)<1.3){sleepers.splice(i,1);train.push({lag:60+train.length*14,x:s.x,y:s.y,w:0});S('hit');}}
  train.forEach((tg,j)=>{tg.w++;if(tg.lag>36)tg.lag-=.02;const hi=hist.length-1-Math.round(tg.lag);if(hi>=0&&tg.w>30){tg.x=hist[hi][0];tg.y=hist[hi][1];}if(tg.w>30&&Math.hypot(tg.x-pac.x,tg.y-pac.y)<.65){if(power>0){tg.dead=1;eatGhost(tg.x,tg.y);}else{die();}}});
  if(dead)return;train=train.filter(q=>!q.dead);
  if(t%600===0&&sleepers.length<10){const spots=[[3,1],[17,1],[1,5],[19,5],[3,13],[17,13],[1,17],[19,17],[9,19],[11,19]];const sp=spots[ri(spots.length)];if(Math.hypot(sp[0]-pac.x,sp[1]-pac.y)>5)sleepers.push({x:sp[0],y:sp[1]});}
  /* jammers */
  for(const j of jams){stepEnt(j,.07,ghostChoose(),false);if(Math.hypot(j.x-pac.x,j.y-pac.y)<.7){j.dead=1;if(power>0){g.score+=100;S('coin');}else{slow=100;S('hit');msg='JAMMED!';msgT=40;}}}jams=jams.filter(j=>!j.dead);
  /* opponents */
  const sec=t/60,haz=(.004+.00012*sec+(sec>170?(sec-170)*.004:0))/60;let n=0;
  for(const o of opps){if(!o.alive)continue;if(o.flash>0)o.flash--;if(o.atk>0)o.atk--;o.stress=Math.max(0,o.stress-.0015*o.sk);if(Math.random()<haz*(1.4-o.sk)+o.stress*o.stress*.0009||sec>235){o.alive=0;if(o.got){kos++;g.score+=200;}}else n++;}
  if(n<alive){S('hit');}alive=n;
  const atkRate=(.08+sec*.0025)*Math.min(1,alive/30+.4)/60;if(alive>0&&t>600&&Math.random()<atkRate){const a=opps.findIndex((o,i)=>o.alive&&Math.random()<.05);if(a>=0){opps[a].atk=180;const[bx,by]=boardPos(a);sparks.push({x:bx+5,y:by+13,tx:OX+84,ty:OY+76,t:0,inc:1});inbound++;}}
  for(const s of sparks){s.t+=.03;if(s.t>=1&&s.inc&&!s.done){s.done=1;inbound--;if(jams.length<6){jams.push({x:10,y:7,d:ri(2)?0:2,mode:'jam',i:9});A.burst(OX+84,OY+60,K.r,10,1.5);}}}sparks=sparks.filter(s=>s.t<1);
  if(alive===0){g.score+=5000;g.over='ROYALE WIN - 1ST OF 99';S('win');}};
 function ghostDraw(x,y,col,fr,small,eyesOnly){const r=small?2.6:3.6;if(!eyesOnly){A.c.fillStyle=col;A.c.beginPath();A.c.arc(x,y-.5,r,Math.PI,0);A.c.lineTo(x+r,y+r);for(let i=0;i<3;i++){A.c.lineTo(x+r-(i+.5)*r*2/3,y+r-(A.t%10<5?1.4:0)*(i%2?1:0)-1);A.c.lineTo(x+r-(i+1)*r*2/3,y+r);}A.c.closePath();A.c.fill();}
  if(fr){R(x-2,y-1.5,1.4,1.4,'#ffd0d0');R(x+.8,y-1.5,1.4,1.4,'#ffd0d0');return;}R(x-2.4,y-2,2,2.2,'#ffffff');R(x+.6,y-2,2,2.2,'#ffffff');R(x-1.6,y-1.2,1,1,'#2030a0');R(x+1.4,y-1.2,1,1,'#2030a0');}
 g.draw=()=>{A.cls('#05051a');
  /* side boards */
  for(let i=0;i<98;i++){const[bx,by]=boardPos(i),o=opps[i];R(bx,by,9,26,o.alive?(o.flash>0&&A.t%6<3?'#ff4f9a':o.atk>0?'#3a1030':'#0e0e3a'):'#141418');if(o.alive){A.box(bx,by,9,26,o.atk>0?'#ff4f6d':'#2a3aaa');R(bx+2,by+4+(i*7+A.t/8|0)%16,2,2,K.y);R(bx+5,by+8+(i*3)%12,1,1,'#ffd0a0');if(o.stress>.6)R(bx+1,by+23,Math.min(7,o.stress*3),2,K.r);}else{L(bx+1,by+1,bx+8,by+25,'#3a3a44');L(bx+8,by+1,bx+1,by+25,'#3a3a44');}}
  /* maze */
  R(OX-2,OY-2,MW*TS+4,MH*TS+4,'#000010');
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const c=MZ[y][x],sx=OX+x*TS,sy=OY+y*TS;if(c==='#'){A.c.fillStyle='#10106a';A.c.fillRect(sx,sy,TS,TS);A.c.fillStyle=lvl%2?'#4a6aff':'#ff4af0';for(const[dx,dy]of DIR){const n=(MZ[y+dy]||'')[x+dx];if(n!==undefined&&n!=='#'){if(dx)A.c.fillRect(dx>0?sx+TS-1:sx,sy,1,TS);else A.c.fillRect(sx,dy>0?sy+TS-1:sy,TS,1);}}}else if(c==='-')R(sx,sy+3,TS,2,'#ffb0d0');
   const p=pel[y][x];if(p===1){A.c.fillStyle='#ffd8b0';A.c.fillRect(sx+3,sy+3,2,2);}else if(p===2&&A.t%20<14)C(sx+4,sy+4,3,'#ffe8c0');}
  for(const s of sleepers){const x=OX+s.x*TS+4,y=OY+s.y*TS+4;AL(.6);ghostDraw(x,y,'#8a8aa0',0,1);AL(1);if(A.t%60<30)T('Z',x+4,y-8,'#aaaacc',1);}
  for(const tg of train)if(tg.w>30){const x=OX+tg.x*TS+4,y=OY+tg.y*TS+4;ghostDraw(x,y,power>0?(power<90&&A.t%10<5?'#ffffff':'#2a3aff'):'#c0c0d8',power>0,1);}
  for(const j of jams){const x=OX+j.x*TS+4,y=OY+j.y*TS+4;ghostDraw(x,y,power>0?'#2a3aff':'#3a2a3a',power>0,1);if(power<=0)A.ring(x,y,4.5,'#ff4f9a');}
  for(const q of ghosts){const x=OX+q.x*TS+4,y=OY+q.y*TS+4;if(q.mode==='eyes')ghostDraw(x,y,'',0,0,1);else ghostDraw(x,y,q.mode==='fright'?(power<90&&A.t%10<5?'#ffffff':'#2a3aff'):q.c,q.mode==='fright');}
  {const x=OX+pac.x*TS+4,y=OY+pac.y*TS+4,m=dead?Math.min(3.1,dead/20):Math.abs(Math.sin(pac.mo))*.8,a=[0,1.57,3.14,4.71][pac.d];A.c.fillStyle=slow>0&&A.t%8<4?'#c8a020':'#ffe830';A.c.beginPath();A.c.moveTo(x,y);A.c.arc(x,y,4,a+m,a+6.283-m);A.c.closePath();A.c.fill();if(power>0)A.ring(x,y,6,'#80ffff');}
  for(const s of sparks){const x=s.x+(s.tx-s.x)*s.t,y=s.y+(s.ty-s.y)*s.t-Math.sin(s.t*3.14)*30;C(x,y,2.2,s.inc?K.r:K.c);GL(x,y,6,s.inc?'#ff4f6d':'#2fd6ff',.6);}
  /* HUD */
  R(OX,0,MW*TS,30,'#05051a');T(''+g.score,OX+2,4,K.w,2);T('ALIVE',OX+MW*TS-2,4,K.gr,1,'r');T((alive+1)+'',OX+MW*TS-2,12,alive<10?K.y:K.w,2,'r');
  T('TARGET '+TG[target],OX+2,20,K.c,1);T('KO '+kos,OX+110,20,K.y,1);
  R(OX,OY+MH*TS+4,MW*TS,H-(OY+MH*TS+4),'#05051a');if(power>0)BAR(OX,OY+MH*TS+6,MW*TS,3,power/420,'#2a3aff','#111');T('LV '+lvl,OX+2,OY+MH*TS+12,K.gr,1);T('TRAIN '+train.length,OX+60,OY+MH*TS+12,'#c0c0d8',1);if(inbound>0)T('INCOMING '+inbound,OX+MW*TS-2,OY+MH*TS+12,A.t%20<10?K.r:'#ff9aa0',1,'r');
  if(msgT)T(msg,OX+MW*TS/2,OY+74,K.y,1,'c');};
 return g;}});

/* ---- SUMMIT LEAP: charge-jump tower climb ---- */
const JK=(()=>{const G=.3,MF=8,SC=12,HT=SC*240,BW=5,BH=18;
 const wind=y=>{const s=Math.floor(y/240);return s<=2&&s>=0?(s%2?1:-1)*.045:0;};
 function air(o,plats){o.vy=Math.min(o.vy+G,MF);o.vx+=wind(o.y);o.x+=o.vx;let ev=null;
  if(o.x<8+BW){o.x=8+BW;o.vx=-o.vx*.6;ev='wall';}if(o.x>312-BW){o.x=312-BW;o.vx=-o.vx*.6;ev='wall';}
  for(const p of plats)if(o.x+BW>p.x&&o.x-BW<p.x+p.w&&o.y>p.y+.5&&o.y-BH<p.y+p.h){if(o.vx>0)o.x=p.x-BW;else o.x=p.x+p.w+BW;o.vx=-o.vx*.6;ev='wall';}
  const py=o.y;o.y+=o.vy;
  for(const p of plats)if(o.x+BW>p.x&&o.x-BW<p.x+p.w){if(o.vy>0&&py<=p.y&&o.y>=p.y){o.y=p.y;return{land:p,ev};}if(o.vy<0&&py-BH>=p.y+p.h&&o.y-BH<p.y+p.h){o.y=p.y+p.h+BH;o.vy=0;ev='bonk';}}
  return{ev};}
 function gen(seed){const rnd=seeded(seed);const plats=[{x:8,y:HT-10,w:304,h:30,k:'ground'}],paths=[];let cur=plats[0],guard=0;
  const hitsPath=(p)=>paths.some(pts=>pts.some(q=>q[0]>p.x-BW-2&&q[0]<p.x+p.w+BW+2&&q[1]>p.y-2&&q[1]<p.y+p.h+BH+2));
  const hitsPlat=(p)=>plats.some(q=>p.x<q.x+q.w+8&&p.x+p.w>q.x-8&&p.y<q.y+q.h+26&&p.y+p.h>q.y-26);
  while(cur.y>80&&guard++<200){let ok=false;for(let tr=0;tr<500&&!ok;tr++){const sx=cur.x+6+rnd()*(cur.w-12),dir=[-1,1,1,-1,0][Math.floor(rnd()*5)],c=6+Math.floor(rnd()*31);
    const o={x:sx,y:cur.y,vx:dir*2.5,vy:-(2.6+c*.21)},pts=[];let bad=false;for(let f=0;f<160;f++){const r=air(o,plats);if(r.land||r.ev==='bonk')break;pts.push([o.x,o.y,o.vy]);if(o.y>cur.y+5)break;}if(bad)continue;
    const cand=[];pts.forEach((q,i)=>{if(q[2]>=1.4&&q[1]<cur.y-45&&q[1]>cur.y-170&&q[0]>24&&q[0]<296&&i>3)cand.push(i);});if(!cand.length)continue;
    const k=cand[Math.floor(rnd()*cand.length)],q=pts[k],w=30+Math.floor(rnd()*26);const np={x:cl(Math.round(q[0]-w*(.25+rnd()*.5)),8,312-w),y:Math.floor(q[1]),w,h:10};if(np.x>q[0]-BW||np.x+np.w<q[0]+BW)continue;
    if(np.y<70){np.y=Math.max(np.y,40);}
    const prev=pts.slice(0,k);if(prev.some(z=>z[0]>np.x-BW-1&&z[0]<np.x+np.w+BW+1&&z[1]>np.y-1&&z[1]<np.y+np.h+BH+1))continue;if(hitsPlat(np)||hitsPath(np))continue;
    plats.push(np);paths.push(prev);np.c=c;np.dir=dir;np.sx=sx;cur=np;ok=true;}if(!ok)return null;}
  if(cur.y>80)return null;cur.k='summit';
  for(let i=0;i<70;i++){const w=24+Math.floor(rnd()*40),np={x:8+Math.floor(rnd()*(304-w)),y:120+Math.floor(rnd()*(HT-200)),w,h:10,k:'deco'};if(!hitsPlat(np)&&!hitsPath(np))plats.push(np);}
  for(let i=0;i<14;i++){const h=40+Math.floor(rnd()*80),np={x:rnd()<.5?8:296,y:200+Math.floor(rnd()*(HT-400)),w:16,h,k:'pillar'};if(!hitsPlat(np)&&!hitsPath(np))plats.push(np);}
  return plats;}
 let P=null,seed=7;const get=()=>{while(!P&&seed<40)P=gen(seed++);return P||[{x:8,y:HT-10,w:304,h:30,k:'ground'},{x:120,y:40,w:60,h:10,k:'summit'}];};return{G,MF,HT,BW,BH,air,get,wind,seed:()=>seed};})();
A.add({id:'jumpking',name:'SUMMIT LEAP',cat:'ACTION',time:600,tags:'jump king rage climb charge jump tower',
how:'HOLD A TO CHARGE, RELEASE TO LEAP. HOLD LEFT/RIGHT TO LEAP SIDEWAYS. NO AIR CONTROL!',make(){
 const g={over:null,score:0},PL=JK.get(),HT=JK.HT;
 let p={x:40,y:HT-10,vx:0,vy:0,gr:true,ch:-1,dir:1,face:1,stun:0,fy:HT-10,walk:0},best=0,falls=0,jumps=0,t=0,msg='',msgT=0,won=0,lastS=11,dust=[];
 const ZN=[['THE WINDY SPIRE','#4a8ad8','#c8e0ff'],['THE WINDY SPIRE','#4a8ad8','#c8e0ff'],['THE WINDY SPIRE','#5a7ad0','#b8d0f8'],['CHAPEL OF ECHOES','#3a2a5a','#6a4a8a'],['CHAPEL OF ECHOES','#3a2a5a','#6a4a8a'],['CHAPEL OF ECHOES','#3a2a5a','#6a4a8a'],['MOSSY RUINS','#3a4a4a','#6a7a6a'],['MOSSY RUINS','#3a4a4a','#6a7a6a'],['MOSSY RUINS','#3a4a4a','#6a7a6a'],['OLD WOODS','#1a3a2a','#3a6a3a'],['OLD WOODS','#1a3a2a','#3a6a3a'],['OLD WOODS','#1a3a2a','#3a6a3a']];
 g.update=()=>{t++;if(msgT)msgT--;if(won){won++;if(won>150)g.over='SUMMIT REACHED - YOU WIN IN '+Math.floor(t/60)+'S';return;}const k=A.in(0);
  if(p.stun>0){p.stun--;return;}
  if(p.gr){const dx=ax(k);if(dx)p.face=dx;
   if(k.a){if(p.ch<0)p.ch=0;p.ch=Math.min(36,p.ch+1);p.dir=dx;}
   else if(p.ch>=0){const c=p.ch;p.vy=-(2.6+c*.21);p.vx=p.dir*2.5;p.gr=false;p.ch=-1;p.fy=p.y;jumps++;S('jump');for(let i=0;i<5;i++)dust.push({x:p.x,y:p.y,vx:rnd(2)-1,vy:-rnd(1),t:20});}
   else if(dx){p.x+=dx*1.3;p.walk+=.25;p.x=cl(p.x,8+JK.BW,312-JK.BW);for(const q of PL)if(p.x+JK.BW>q.x&&p.x-JK.BW<q.x+q.w&&p.y>q.y+.5&&p.y-JK.BH<q.y+q.h){p.x-=dx*1.3;}
    const on=PL.some(q=>p.x+JK.BW>q.x&&p.x-JK.BW<q.x+q.w&&Math.abs(p.y-q.y)<.6);if(!on){p.gr=false;p.vx=dx*1.3;p.vy=0;p.fy=p.y;}}}
  else{const r=JK.air(p,PL);if(r.ev==='wall'||r.ev==='bonk')S('hit');if(r.land){p.gr=true;p.vx=0;p.vy=0;const drop=p.y-p.fy;if(drop>260){p.stun=50;falls++;S('boom');A.shake=8;msg=['OUCH.','THAT HURT.','DOWN AGAIN...','DEEP BREATHS.','THE SUMMIT CAN WAIT.'][falls%5];msgT=90;}else{S('blip');}for(let i=0;i<6;i++)dust.push({x:p.x,y:p.y,vx:rnd(2)-1,vy:-rnd(1),t:20});
    if(r.land.k==='summit'){won=1;S('win');A.confetti();g.score+=1000+Math.max(0,600-Math.floor(t/60))*2;}}
   if(p.y>HT){p.y=HT-10;p.gr=true;}}
  for(const d of dust){d.x+=d.vx;d.y+=d.vy;d.t--;}dust=dust.filter(d=>d.t>0);
  const h=Math.floor((HT-10-p.y)/10);if(h>best){best=h;}g.score=best*10+(won?g.score%10:0)+(won?1000:0);
  const s=Math.floor((p.y-1)/240);if(s!==lastS){if(s<lastS&&s>=0&&s<12)msg=ZN[s][0];msgT=s<lastS?80:msgT;lastS=s;}};
 g.draw=()=>{const s=cl(Math.floor((p.y-1)/240),0,11),oy=s*240,Z=ZN[s];GR(0,0,W,H,Z[1],Z[2]);
  if(s<=2){for(let i=0;i<6;i++){const x=((i*71+t*(s%2?.4:-.4))%380+380)%380-30,y=30+i*34;EL(x,y,26,8,'rgba(255,255,255,.5)');EL(x+14,y-4,16,7,'rgba(255,255,255,.5)');}for(let i=0;i<8;i++){const y=(i*29+t)%240;AL(.4);L(((i*53+t*(s%2?2:-2))%320+320)%320,y,((i*53+t*(s%2?2:-2))%320+320)%320+(s%2?12:-12),y,'#ffffff');AL(1);}}
  else if(s<=5){for(let i=0;i<3;i++){const x=50+i*110;R(x,40,30,70,'#2a1a3a');A.c.fillStyle='#2a1a3a';A.c.beginPath();A.c.arc(x+15,40,15,Math.PI,0);A.c.fill();GR(x+4,34,22,72,'#ff8ad8','#5a8aff');AL(.5);R(x+14,30,2,76,'#2a1a3a');R(x+4,64,22,2,'#2a1a3a');AL(1);}}
  else if(s<=8){for(let y=0;y<H;y+=16)for(let x=((y/16)%2)*16;x<W;x+=32){AL(.15);R(x,y,30,14,'#000000');AL(1);}}
  else{for(let i=0;i<9;i++){const x=i*38+10;R(x,0,8,H,'#2a1a10');C(x+4,30+(i%3)*40,18,'#2a5a2a');}}
  R(0,0,8,H,'#2a2228');R(312,0,8,H,'#2a2228');
  for(const q of PL){const y=q.y-oy;if(y>H||y+q.h<0)continue;const col=q.k==='summit'?'#e8c860':q.k==='ground'?'#4a3a2a':s<=2?'#c8d0e0':s<=5?'#6a5a7a':s<=8?'#7a7a70':'#6a4a2a';
   R(q.x,y,q.w,q.h,col);R(q.x,y,q.w,2,A.mix(col,'#ffffff',.35));R(q.x,y+q.h-2,q.w,2,A.mix(col,'#000000',.35));if(s>=6&&s<=8&&q.k!=='ground')R(q.x+2,y-1,q.w-4,2,'#5a9a4a');if(s<=2&&q.k!=='ground'){AL(.7);R(q.x+1,y+q.h,q.w-2,2,'#ffffff');AL(1);}
   if(q.k==='summit'){const bx=q.x+q.w/2,by=y-2;R(bx-1,by-26,2,26,'#6a4a2a');R(bx-10,by-28,20,3,'#6a4a2a');A.c.fillStyle='#ffd040';A.c.beginPath();A.c.moveTo(bx-6,by-10);A.c.quadraticCurveTo(bx-6,by-24,bx,by-24);A.c.quadraticCurveTo(bx+6,by-24,bx+6,by-10);A.c.closePath();A.c.fill();GL(bx,by-16,20,'#ffe080',.5+.3*Math.sin(t*.1));}}
  for(const d of dust){AL(d.t/20);R(d.x-1,d.y-oy-1,2,2,'#e8e0d0');}AL(1);
  const px=p.x,py=p.y-oy;if(p.stun>0&&p.gr){A.c.save();A.c.translate(px,py-2);A.c.rotate(p.face>0?-1.5:1.5);A.person(0,8,{s:.55,c:'#4a6ad8',pants:'#3a3a4a',cap:'#c8c8d8',id:2,d:p.face});A.c.restore();T('*',px,py-20,K.y,1,'c');}
  else{const squat=p.ch>=0?Math.min(1,p.ch/36):0;A.c.save();A.c.translate(px,py);A.c.scale(1+squat*.15,1-squat*.25);A.person(0,0,{s:.55,c:'#4a6ad8',pants:'#3a3a4a',cap:'#c8c8d8',id:2,d:p.face,st:p.gr?p.walk:0,arm1:p.gr?undefined:-2.4,arm2:p.gr?undefined:-2.4});A.c.restore();
   if(p.ch>=0){BAR(px-10,py-26,20,3,p.ch/36,p.ch>=36?K.r:K.y,'#222');if(p.dir)A.poly(p.dir>0?[[px+12,py-12],[px+17,py-9],[px+12,py-6]]:[[px-12,py-12],[px-17,py-9],[px-12,py-6]],K.w,1);}}
  if(JK.wind(p.y)){const wd=JK.wind(p.y)>0;T(wd?'WIND >>':'<< WIND',160,16,'#ffffff',1,'c');}
  R(0,0,W,12,'rgba(0,0,0,.5)');T('HEIGHT '+best+'M / '+Math.floor((HT-50)/10)+'M',4,3,K.y,1);T('FALLS '+falls,170,3,K.r,1);T('LEAPS '+jumps,W-4,3,K.w,1,'r');
  const mp=(1-(p.y/HT));R(W-5,14,3,H-20,'rgba(0,0,0,.4)');R(W-6,14+(H-20)*(1-mp)-1,5,3,K.y);
  if(msgT)T(msg,160,40,K.w,2,'c');if(won)T('THE SUMMIT!',160,90,K.y,3,'c');};
 return g;}});

/* ---- HOOPS JAM: 2-on-2 arcade basketball ---- */
A.add({id:'hoopsjam',name:'HOOPS JAM',cat:'SPORTS',vs:1,time:200,tags:'nba jam basketball dunk 2v2 arcade',
how:'ARROWS RUN, DOUBLE-TAP = TURBO. A SHOOTS/BLOCKS (TURBO NEAR RIM = DUNK). B PASSES/SHOVES.',make(){
 const g={over:null,score:0},HX=[568,32],RIMH=58,QLEN=2100;
 const TM=[{n:'BLAZE',c:'#ff6a2a',p:'#5a1a0a'},{n:'STORM',c:'#3a8aff',p:'#0a1a4a'}];
 let P=[],ball,sc=[0,0],q=1,clk=QLEN,shotClk=720,poss=0,state='tip',st=0,banner='',bT=0,ctl=[0,2],lastTap=[{},{}],fx=[],crowd=[];
 for(let i=0;i<140;i++)crowd.push({x:ri(600),y:ri(3),c:['#ff6a6a','#6aa0ff','#ffd06a','#e0e0e0','#9a6aff'][ri(5)],ph:rnd(6)});
 function mk(i){const t=i<2?0:1;return{i,t,x:t?380:220,z:i%2?70:30,h:0,vh:0,vx:0,vz:0,turbo:100,tb:false,down:0,cd:0,fire:0,streak:0,num:[23,7,33,11][i],shoot:0,dunk:null,face:t?-1:1,ai:true,st:0};}
 P=[0,1,2,3].map(mk);
 ball={own:null,x:300,z:50,h:60,vx:0,vz:0,vh:0,shot:null,pass:null};
 const dist=(a,b)=>Math.hypot(a.x-b.x,(a.z-b.z)*1.4);
 const human=p=>(p.t===0&&ctl[0]===p.i)||(p.t===1&&A.two&&ctl[1]===p.i);
 const mate=p=>P[p.t*2+(p.i%2?0:1)];
 function give(p){ball.own=p;ball.shot=null;ball.pass=null;if(poss!==p.t){poss=p.t;shotClk=720;}if(p.t===0)ctl[0]=p.i;else if(A.two)ctl[1]=p.i;}
 function inbound(t){const a=P[t*2],b=P[t*2+1];a.x=t?560:40;a.z=50;b.x=t?470:130;b.z=30;P.filter(p=>p.t!==t).forEach((p,k)=>{p.x=t?420:180;p.z=30+k*40;});P.forEach(p=>{p.h=0;p.vh=0;p.shoot=0;p.dunk=null;p.down=0;});give(a);state='play';}
 function score(p,pts,how){sc[p.t]+=pts;S('score');A.shake=how==='dunk'?12:4;const o=P.filter(q=>q.t!==p.t);o.forEach(q=>{q.streak=0;q.fire=0;});p.streak++;if(p.fire)p.fire--;if(p.streak>=3&&!p.fire){p.fire=4;banner=(p.t===0?'P1':A.two?'P2':'CPU')+' TEAM IS ON FIRE!';bT=120;S('win');}
  else{banner=how==='dunk'?['MONSTER JAM!','BOOMSHAKALAKA-STYLE SLAM!','RIM WRECKER!','FROM DOWNTOWN... NO, FROM THE SKY!'][ri(4)]:pts===3?'FROM DOWNTOWN!':'IT\'S GOOD!';bT=70;}
  for(let i=0;i<20;i++)fx.push({x:HX[p.t],z:50,h:RIMH,vx:rnd(4)-2,vz:rnd(2)-1,vh:rnd(3),t:40,c:p.fire?K.o:K.y});state='after';st=0;ball.own=null;ball.shot=null;ball.x=HX[p.t];ball.z=50;ball.h=RIMH-10;ball.vx=ball.vz=0;ball.vh=-1;g.lastScorer=p.t;}
 function shootRelease(p){const H_=HX[p.t],d=Math.abs(p.x-H_)+Math.abs(p.z-50)*.6;const tq=1-Math.min(1,Math.abs(p.shoot-16)/16);let pr=d<40?.8:Math.max(.12,.72-(d-40)/330);pr+=(tq-.5)*.3;const df=P.filter(o=>o.t!==p.t&&dist(o,p)<24&&!o.down);if(df.length)pr-=df.some(o=>o.h>8)?.3:.15;if(p.fire)pr=.92;
  const pts=d>185?3:2;ball.own=null;ball.shot={p,pts,go:Math.random()<pr,t:0,T:Math.round(28+d/9),sx:p.x,sz:p.z,sh:p.h+28};ball.pass=null;p.shoot=0;S('jump');}
 function startDunk(p){p.dunk={t:0,sx:p.x,sz:p.z,flip:Math.random()<.6};p.vh=0;S('jump');}
 function pass(p){const m=mate(p);if(m.down)return;ball.own=null;ball.pass={from:p,to:m,t:0,T:Math.max(10,Math.round(dist(p,m)/7)),sx:p.x,sz:p.z};S('blip');}
 function shove(p){p.cd=40;const o=P.filter(q=>q.t!==p.t&&!q.down&&dist(q,p)<20).sort((a,b)=>dist(a,p)-dist(b,p))[0];S('shoot');if(!o)return;o.down=45;o.shoot=0;o.dunk=null;S('hit');A.shake=4;if(ball.own===o){ball.own=null;ball.x=o.x;ball.z=o.z;ball.h=18;ball.vx=(o.x-p.x)*.06;ball.vz=(o.z-p.z)*.06;ball.vh=2;}}
 function looseBall(){const b=ball;b.vh-=.3;b.x+=b.vx;b.z+=b.vz;b.h+=b.vh;if(b.h<6){b.h=6;b.vh=Math.abs(b.vh)*.55;b.vx*=.9;b.vz*=.9;}b.z=cl(b.z,2,98);if(b.x<10||b.x>590)b.vx*=-1;b.x=cl(b.x,10,590);
  for(const p of P)if(!p.down&&b.h<p.h+30&&dist(p,b)<11){give(p);return;}}
 function ctrlInput(p,k,h,pi){const tap=lastTap[pi];let tb=false;for(const d of['l','r','u','d']){if(h[d]){if(A.t-(tap[d]||-99)<14)p.tbHold=d;tap[d]=A.t;}}if(p.tbHold&&k[p.tbHold]&&p.turbo>0)tb=true;else if(p.tbHold&&!k[p.tbHold])p.tbHold=null;
  return{mx:ax(k),mz:ay(k),tb,a:h.a,ah:k.a,b:h.b};}
 function aiInput(p){const o={mx:0,mz:0,tb:false,a:false,ah:false,b:false},H_=HX[p.t],dir=p.t?-1:1,sk=p.t===1?A.ai:.75;let tx=p.x,tz=p.z;
  if(ball.own===p){const d=Math.abs(p.x-H_),def=P.filter(q=>q.t!==p.t).reduce((m,q)=>Math.min(m,dist(q,p)),999);tx=H_-dir*20;tz=50+(p.z<50?-8:8);
   if(p.shoot>0){o.ah=p.shoot<15+ri(4)*(sk<.9?1:0);}else{if(d<75&&p.turbo>20&&Math.random()<.06*sk+.01){o.tb=true;o.a=true;}else if((def>26&&d<190&&Math.random()<.02)||shotClk<120||(d<60&&Math.random()<.03)){o.a=true;o.ah=true;}else if(def<15&&Math.random()<.02)o.b=true;if(d>110&&p.turbo>40&&Math.random()<.6)o.tb=true;}}
  else if(ball.own&&ball.own.t===p.t){tx=H_-dir*(110+(p.i%2)*50);tz=ball.own.z<50?78:22;}
  else if(!ball.own&&!ball.shot&&!ball.pass){tx=ball.x;tz=ball.z;o.tb=p.turbo>30;}
  else{const man=P[(1-p.t)*2+(p.i%2)];const OH=HX[1-p.t];tx=man.x+(OH-man.x)*.18;tz=man.z+(50-man.z)*.18;if(ball.own===man&&dist(p,man)<20&&p.cd<=0&&Math.random()<.035*sk)o.b=true;
   const sh=P.find(q=>q.t!==p.t&&(q.shoot>0||q.dunk));if(sh&&dist(sh,p)<34&&p.h===0&&Math.random()<.25*sk){o.a=true;}if(ball.shot&&ball.shot.p.t!==p.t&&Math.abs(ball.x-p.x)<26&&p.h===0&&Math.random()<.1*sk)o.a=true;}
  const dx=tx-p.x,dz=tz-p.z;o.mx=Math.abs(dx)>5?Math.sign(dx):0;o.mz=Math.abs(dz)>4?Math.sign(dz):0;return o;}
 function stepP(p){if(p.cd>0)p.cd--;if(p.down>0){p.down--;return;}
  if(p.dunk){const d=p.dunk;d.t++;const f=d.t/32;p.x=d.sx+(HX[p.t]-(p.t?-10:10)-d.sx)*Math.min(1,f);p.z=d.sz+(50-d.sz)*Math.min(1,f);p.h=Math.sin(Math.min(1,f)*1.57)*(RIMH+8);
   if(d.t===32){p.dunk=null;const blk=P.some(o=>o.t!==p.t&&o.h>20&&dist(o,p)<16&&Math.random()<.5);if(blk||Math.random()<.05){ball.own=null;ball.x=p.x;ball.z=p.z;ball.h=RIMH;ball.vx=(p.t?1:-1)*2;ball.vz=rnd(2)-1;ball.vh=2;banner=blk?'REJECTED!':'CLANK!';bT=50;S('lose');}else score(p,2,'dunk');p.vh=-2;}return;}
  const hu=human(p),pi=p.t===0?0:1;const k=hu?A.in(pi):null,h=hu?A.hit(pi):null;const o=hu?ctrlInput(p,k,h,pi):aiInput(p);
  if(o.mx)p.face=o.mx;const tb=o.tb&&p.turbo>0;p.tb=tb;if(tb)p.turbo=Math.max(0,p.turbo-(p.fire?0:.9));else p.turbo=Math.min(100,p.turbo+.25);
  const sp=(tb?2.4:1.55)*(p.h>0?.5:1);if(!p.shoot){p.x=cl(p.x+o.mx*sp,8,592);p.z=cl(p.z+o.mz*sp*.7,4,96);}if(o.mx||o.mz)p.st+=.35;
  if(p.h>0||p.vh>0){p.vh-=.28;p.h=Math.max(0,p.h+p.vh);if(p.h===0)p.vh=0;}
  if(ball.own===p){if(p.shoot>0){p.shoot++;if((!o.ah&&p.shoot>3)||p.shoot>=28)shootRelease(p);}
   else if(o.a){const d=Math.abs(p.x-HX[p.t])+Math.abs(p.z-50)*.6;if(tb&&d<80)startDunk(p);else{p.shoot=1;p.vh=4.6;}}else if(o.b)pass(p);}
  else{if(o.a&&p.h===0){p.vh=4.8;S('jump');}if(o.b&&p.cd<=0)shove(p);}}
 g.update=()=>{if(bT>0)bT--;for(const f of fx){f.x+=f.vx;f.z+=f.vz;f.h+=f.vh;f.vh-=.15;f.t--;}fx=fx.filter(f=>f.t>0);
  if(state==='tip'){st++;if(st===1){banner='TIP OFF!';bT=60;}if(st>60){const w=Math.random()<.5?0:1;give(P[w*2]);state='play';}return;}
  if(state==='qbreak'){st++;if(st>120){q++;clk=QLEN;inbound(q%2?0:1);}return;}
  if(state==='final'){st++;if(st>120)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}
  if(state==='after'){st++;looseBall();if(st>50){inbound(1-g.lastScorer);}P.forEach(p=>{if(p.h>0){p.vh-=.28;p.h=Math.max(0,p.h+p.vh);}});return;}
  clk--;shotClk--;if(clk<=0){S('win');if(q>=4){state='final';st=0;banner='FINAL';bT=120;}else{state='qbreak';st=0;banner='END OF Q'+q;bT=120;}return;}
  if(shotClk<=0&&ball.own){banner='SHOT CLOCK!';bT=60;S('lose');inbound(1-poss);return;}
  for(const t of [0,1]){if(t===1&&!A.two)continue;if(ball.own&&ball.own.t===t)ctl[t]=ball.own.i;else{const c=P[ctl[t]],o=mate(c);if(dist(o,ball)<dist(c,ball)-15)ctl[t]=o.i;}}
  P.forEach(stepP);
  /* separation */
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=P[i],b=P[j],d=dist(a,b);if(d<10&&d>0){const ox=(a.x-b.x)/d*(10-d)/2,oz=(a.z-b.z)/d*(10-d)/2/1.4;a.x+=ox;a.z+=oz;b.x-=ox;b.z-=oz;}}
  /* ball */
  if(ball.own){const p=ball.own;ball.x=p.x+p.face*6;ball.z=p.z+1;ball.h=p.dunk?p.h+20:p.shoot?p.h+26:10+Math.abs(Math.sin(A.t*.25))*8;if(!p.shoot&&!p.dunk&&ball.h<11&&A.t%8===0)S('blip');}
  else if(ball.pass){const ps=ball.pass;ps.t++;const f=ps.t/ps.T;ball.x=ps.sx+(ps.to.x-ps.sx)*f;ball.z=ps.sz+(ps.to.z-ps.sz)*f;ball.h=18+Math.sin(f*3.14)*14;
   const thief=P.find(o=>o.t!==ps.from.t&&!o.down&&dist(o,ball)<8&&Math.random()<.12*(o.t===1?A.ai:.75));if(thief){give(thief);banner='STOLEN!';bT=40;}else if(f>=1)give(ps.to);}
  else if(ball.shot){const s=ball.shot;s.t++;const f=s.t/s.T,H_=HX[s.p.t];ball.x=s.sx+(H_-s.sx)*f;ball.z=s.sz+(50-s.sz)*f;ball.h=s.sh+(RIMH-s.sh)*f+Math.sin(f*3.14)*(40+s.T*.6);
   if(s.p.fire&&A.t%2===0)fx.push({x:ball.x,z:ball.z,h:ball.h,vx:0,vz:0,vh:.5,t:14,c:A.t%4?K.o:K.y});
   for(const o of P){if(o.t===s.p.t||o.h<14||dist(o,ball)>14||Math.abs(o.h+30-ball.h)>18)continue;if(f<.45){ball.shot=null;ball.vx=(s.p.t?1:-1)*-2.4;ball.vz=rnd(2)-1;ball.vh=1;banner='BLOCKED!';bT=50;S('boom');A.shake=6;return;}else if(f>.6){banner='GOALTENDING!';bT=60;score(s.p,s.pts,'shot');return;}}
   if(f>=1){if(s.go)score(s.p,s.pts,'shot');else{ball.shot=null;ball.vx=(s.p.t?1:-1)*(1+rnd(2));ball.vz=rnd(3)-1.5;ball.vh=2.5;S('hit');banner='';}}}
  else looseBall();
  g.score=sc[0];};
 g.timeUp=()=>sc[0]===sc[1]?'TIME UP - DRAW':'TIME UP - '+(sc[0]>sc[1]?'P1 WINS':A.cpu?'CPU WINS':'P2 WINS');
 /* drawing */
 let cam=140;const SY=(z,h)=>118+z*1.0-(h||0),X=x=>x-cam;
 g.draw=()=>{const tx=cl(ball.x-160,0,280);cam+=(tx-cam)*.1;
  GR(0,0,W,118,'#140a24','#2a1a3a');for(const c of crowd){R(((c.x-cam*.6)%340+340)%340-10,48+c.y*14+Math.sin(A.t*.15+c.ph)*(bT>0?2:.5),5,6,c.c);C(((c.x-cam*.6)%340+340)%340-7.5,46+c.y*14+Math.sin(A.t*.15+c.ph)*(bT>0?2:.5),2.5,'#e8c0a0');}
  R(0,90,W,28,'#1a1030');R(0,90,W,2,'#ffcf3f');for(let i=0;i<8;i++){GL(i*46+((A.t*.5)%46),100,14,'#ffffff',.06);}
  A.poly([[X(0)-30,118],[X(600)+30,118],[X(600)+60,222],[X(0)-60,222]],'#c8904a',1);for(let i=0;i<30;i++){const x=X(i*20);AL(.12);L(x,118,x+((x-160)*.25),222,'#5a3a1a');AL(1);}
  const lc='#ffffff';AL(.85);L(X(300),118,X(300),222,lc,1.5);ER(X(300),170,24,12,lc,1.5);L(X(0),118,X(600),118,lc);L(X(0)-60,222,X(600)+60,222,lc);
  for(const s of [0,1]){const hx=HX[s],dir=s?1:-1;A.c.fillStyle='rgba(180,40,40,.35)';A.c.fillRect(Math.min(X(hx),X(hx+dir*70)),148,70,44);A.box(Math.min(X(hx),X(hx+dir*70)),148,70,44,lc);ER(X(hx+dir*70),170,10,22,lc);A.c.strokeStyle=lc;A.c.beginPath();if(A.c.ellipse)A.c.ellipse(X(hx),170,190,58,0,s?-Math.PI*.5:Math.PI*.5,s?Math.PI*.5:Math.PI*1.5,false);A.c.stroke();}
  AL(1);
  const drawHoop=(s)=>{const hx=X(HX[s]),dir=s?-1:1,ry=SY(50,RIMH);R(hx+dir*12-2,ry-2,4,170-ry+52,'#5a5a6a');R(hx+dir*8-3,ry-30,6,34,'#e8e8f0');A.box(hx+dir*8-3,ry-30,6,34,'#c83a3a');ER(hx,ry,9,3,'#ff6a2a',2);for(let i=-3;i<=3;i++)L(hx+i*2.6,ry+1,hx+i*1.6,ry+11,'#ffffff',.8);};
  drawHoop(1);drawHoop(0);
  const list=P.map(p=>({z:p.z,f:()=>drawP(p)}));list.push({z:ball.z+.1,f:drawBall});list.sort((a,b)=>a.z-b.z).forEach(o=>o.f());
  for(const f of fx){AL(f.t/40);R(X(f.x)-1,SY(f.z,f.h)-1,2.5,2.5,f.c);}AL(1);
  R(0,0,W,40,'#0a0612');R(118,1,84,18,'#000000');A.box(118,1,84,18,'#ffcf3f');T(TM[0].n,6,3,TM[0].c,1);T(TM[1].n,W-6,3,TM[1].c,1,'r');T(''+sc[0],140,6,TM[0].c,2,'c');T(''+sc[1],180,6,TM[1].c,2,'c');
  const s_=Math.ceil(Math.max(0,clk)/60);T('Q'+Math.min(q,4)+' '+Math.floor(s_/60)+':'+String(s_%60).padStart(2,'0'),160,24,K.w,1,'c');T(''+Math.ceil(Math.max(0,shotClk)/60),160,32,shotClk<180?K.r:K.y,1,'c');
  const hp=P[ctl[0]];BAR(6,13,60,3,hp.turbo/100,hp.fire?K.o:K.c,'#222');T('TURBO',70,12,K.gr,1);if(A.two){const h2=P[ctl[1]];BAR(W-66,13,60,3,h2.turbo/100,h2.fire?K.o:K.c,'#222');}
  if(bT>0&&banner){AL(Math.min(1,bT/15));T(banner,160,46,K.y,2,'c');AL(1);}};
 function drawP(p){const x=X(p.x),y=SY(p.z,0),sc_=.92+p.z/300;EL(x,y,9*sc_,3*sc_,'rgba(0,0,0,.35)');const T_=TM[p.t];if(p.fire)GL(x,y-p.h-14,22,'#ff6a1a',.5+.2*Math.sin(A.t*.4));
  const hu=human(p);if(hu){ER(x,y,11,4,p.t===0?'#ffe060':'#80d0ff',1.5);T(p.t===0?'P1':'P2',x,y-p.h-44*sc_,p.t===0?'#ffe060':'#80d0ff',1,'c');}
  A.c.save();A.c.translate(x,y-p.h);if(p.down>0)A.c.rotate(p.face*1.3);if(p.dunk&&p.dunk.flip)A.c.rotate(Math.min(1,p.dunk.t/32)*6.283*p.face);A.person(0,0,{s:1.15*sc_,c:T_.c,pants:T_.p,num:p.num,id:p.i+1,st:p.st,d:p.face,arm1:p.shoot||p.dunk||p.h>0?-2.8:undefined,arm2:p.shoot||p.dunk||p.h>0?-2.6:undefined});A.c.restore();
  if(p.tb&&A.t%3===0)fx.push({x:p.x-p.face*6,z:p.z,h:4,vx:0,vz:0,vh:.2,t:12,c:'#ffffff'});if(p.down>0&&A.t%10<5)T('*',x,y-30,K.y,1,'c');}
 function drawBall(){const x=X(ball.x),y=SY(ball.z,ball.h);EL(X(ball.x),SY(ball.z,0),4,1.5,'rgba(0,0,0,.3)');C(x,y,3.6,ball.shot&&ball.shot.p.fire?'#ff3a1a':'#ff8a2a');L(x-3.5,y,x+3.5,y,'#5a2a0a',.7);L(x,y-3.5,x,y+3.5,'#5a2a0a',.7);}
 return g;}});

/* ---- GRIDIRON PRO: retro american football season ---- */
A.add({id:'gridironpro',name:'GRIDIRON PRO',cat:'SPORTS',time:900,tags:'retro bowl american football nfl season quarterback',
how:'PICK A PLAY, A SNAPS. DRAG BACK WITH THE MOUSE (OR UP/DOWN + A) TO PASS. B JUKES.',make(){
 const g={over:null,score:0};
 const TEAMS=[['GALES','#2a8adf','#f0f0f0'],['IRONCLADS','#5a5a6a','#e8c040'],['COMETS','#e84a2a','#ffd040'],['BISON','#7a4a2a','#e8d8b8'],['VIPERS','#2a9a4a','#101010'],['LUMBERJACKS','#c83a3a','#2a2a2a'],['OWLS','#6a3a9a','#e8e8e8'],['FOXES','#e88a2a','#ffffff']];
 const RT=[0,[3,3],[2,4],[3,2],[4,2],[2,2],[3,3],[4,4]];
 const ATR=[['QB ARM','qb'],['WR SPEED','wr'],['RB POWER','rb'],['O-LINE','ol'],['DEFENSE','df']];
 let team={qb:2,wr:2,rb:2,ol:2,df:2},cp=3,week=0,sched=[],rec=TEAMS.map(()=>({w:0,l:0,pf:0,pa:0})),opp=1,gs=[0,0],drive=0,DRIVES=3,yards=0,pts=0,champ=0,bowl=false;
 let st='intro',stT=0,sel=0,los=25,down=1,togo=10,pl=[],ball=null,play=null,phase='call',pT=0,res='',resT=0,carrier=null,tgt=0,drag=null,fg=null,juke=0,jcd=0,camX=25,oppMsg=[],ended=false;
 { const o=[1,2,3,4,5,6,7].sort(()=>Math.random()-.5);sched=o.slice(0,4);}
 const PLAYS=[{n:'SLANTS',d:'QUICK INSIDE CUTS'},{n:'DEEP POST',d:'GO LONG, BIG GAINS'},{n:'HB DIVE',d:'HAND OFF AND RUN'},{n:'SCREEN',d:'DUMP TO THE BACK'}];
 const opts=()=>{const o=PLAYS.slice();if(down===4){o.push({n:'PUNT',d:'FLIP THE FIELD'});if(los>=58)o.push({n:'FIELD GOAL',d:(117-los)+' YARDS'});}return o;};
 /* --- play setup --- */
 function setup(pi){const P=opts()[pi];play=P.n;const L_=los,c=26.6;pl=[];const add=(r,x,y,o)=>{const p=Object.assign({r,x:L_+x,y,vx:0,vy:0,off:r[0]!=='D'&&r!=='LB'&&r!=='CB'&&r!=='S',st:0,blk:0},o||{});pl.push(p);return p;};
  add('QB',-3,c);add('RB',-6,c);add('OL',-1,c-2.2);add('OL',-1,c+2.2);add('WR',0,7);add('WR',0,46);add('TE',-1,c+5);
  add('DL',1,c-2.4);add('DL',1,c+2.6);add('LB',5,c-7);add('LB',5,c+7);add('CB',3,8);add('CB',3,45);add('S',14,c);
  const wr=pl.filter(p=>p.r==='WR'),te=pl.find(p=>p.r==='TE'),rb=pl.find(p=>p.r==='RB');const R_=(p,pts)=>{p.route=pts.map(q=>[L_+q[0],q[1]]);p.ri=0;};
  if(play==='SLANTS'){R_(wr[0],[[4,7],[11,16]]);R_(wr[1],[[4,46],[11,37]]);R_(te,[[5,c+5],[7,40]]);R_(rb,[[-5,c-2]]);}
  if(play==='DEEP POST'){R_(wr[0],[[30,7]]);R_(wr[1],[[12,46],[30,32]]);R_(te,[[3,c+5],[4,14]]);R_(rb,[[1,c-10],[4,c-14]]);}
  if(play==='HB DIVE'){R_(wr[0],[[4,9]]);R_(wr[1],[[4,44]]);R_(te,[[1,c+3]]);R_(rb,[[-3,c-.5]]);}
  if(play==='SCREEN'){R_(wr[0],[[14,8]]);R_(wr[1],[[14,45]]);R_(te,[[6,c+4]]);R_(rb,[[-3,c-12],[3,c-15]]);}
  ball={own:pl[0],x:L_-3,y:c,h:0,fl:null};carrier=null;tgt=0;drag=null;juke=0;phase='pre';pT=0;
  if(play==='PUNT'||play==='FIELD GOAL'){phase=play==='PUNT'?'punt':'fg';fg={t:0,v:0,dir:1,stop:-1};}}
 const recv=()=>pl.filter(p=>p.off&&(p.r==='WR'||p.r==='TE'||(p.r==='RB'&&play!=='HB DIVE')));
 function endPlay(spot,how){if(phase==='dead')return;spot=Math.round(spot);phase='dead';pT=0;const gain=Math.round(spot-los);
  if(how==='td'){res='TOUCHDOWN!';gs[0]+=7;pts+=7;yards+=Math.max(0,gain);cp+=1;S('win');A.confetti();finishDrive();return;}
  if(how==='int'){res='INTERCEPTED!';S('lose');finishDrive();return;}
  if(how==='inc'){res='INCOMPLETE';S('lose');}else{yards+=Math.max(0,gain);res=how==='sack'?'SACKED! '+gain+' YDS':(gain>=0?'GAIN OF '+gain:'LOSS OF '+(-gain));S(gain>0?'coin':'hit');}
  const spotN=how==='inc'?los:cl(spot,1,99);if(how!=='inc'&&spotN>=los+togo){los=spotN;down=1;togo=Math.min(10,100-los);res+=' - FIRST DOWN!';}else{down++;togo-=(spotN-los);los=spotN;if(down>4){res+=' - TURNOVER ON DOWNS';finishDrive();return;}}}
 function finishDrive(){ended=true;}
 function simOpp(){const o=RT[opp],r=Math.random(),pTD=.26+.07*(o[0]-team.df),pFG=.2;let m;if(r<pTD){gs[1]+=7;m=TEAMS[opp][0]+' DRIVE: TOUCHDOWN';}else if(r<pTD+pFG){gs[1]+=3;m=TEAMS[opp][0]+' DRIVE: FIELD GOAL';}else m=TEAMS[opp][0]+' DRIVE: '+['PUNT','YOUR D FORCES A PUNT','INTERCEPTED BY YOUR D!','TURNOVER ON DOWNS'][ri(4)];return m;}
 function nextDrive(){drive++;if(drive>DRIVES){if(gs[0]===gs[1]&&DRIVES<5){DRIVES++;}else{endGame();return;}}los=25;down=1;togo=10;phase='call';sel=0;ended=false;st='game';}
 function endGame(){const w=gs[0]>gs[1]||(gs[0]===gs[1]&&Math.random()<.5);const me=rec[0],o=rec[opp];if(w){me.w++;o.l++;cp+=3;g.score+=100;}else{me.l++;o.w++;cp+=1;}me.pf+=gs[0];me.pa+=gs[1];o.pf+=gs[1];o.pa+=gs[0];
  if(!bowl){for(let i=1;i<8;i++){if(i===opp)continue;}const others=[1,2,3,4,5,6,7].filter(i=>i!==opp).sort(()=>Math.random()-.5);for(let k=0;k+1<others.length;k+=2){const a=others[k],b=others[k+1],ra=RT[a][0]+RT[a][1]+rnd(4),rb=RT[b][0]+RT[b][1]+rnd(4);const sa=10+ri(25),sb=10+ri(25);if(ra>rb){rec[a].w++;rec[b].l++;}else{rec[b].w++;rec[a].l++;}rec[a].pf+=sa;rec[b].pf+=sb;}}
  st=bowl?'bowlres':'results';stT=0;g.lastWin=w;if(bowl){champ=w;}}
 const standings=()=>[0,1,2,3,4,5,6,7].sort((a,b)=>rec[b].w-rec[a].w||(rec[b].pf-rec[b].pa)-(rec[a].pf-rec[a].pa));
 function startGame(){opp=bowl?standings().find(i=>i!==0):sched[week];gs=[0,0];drive=0;DRIVES=3;nextDrive();oppMsg=[];}
 /* --- live play --- */
 const SPD=r=>r==='WR'?.27+team.wr*.015:r==='RB'?.25+team.rb*.012:r==='TE'?.24:r==='QB'?.2:r==='CB'?.255+RT[opp][1]*.01:r==='S'?.25+RT[opp][1]*.01:r==='LB'?.23+RT[opp][1]*.01:r==='DL'?.17+RT[opp][1]*.008:.16;
 const toward=(p,tx,ty,sp)=>{const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);if(d<.05)return;const s=Math.min(sp,d);p.x+=dx/d*s;p.y+=dy/d*s;p.st+=.3;};
 function throwTo(tx,ty){const q=ball.own;const d=Math.hypot(tx-q.x,ty-q.y),sp=.55+team.qb*.07,T_=Math.max(8,d/sp);ball.own=null;ball.fl={sx:q.x,sy:q.y,tx,ty,t:0,T:T_};S('jump');}
 function live(){const k=A.in(0),h=A.hit(0);pT++;const qb=pl[0],off=pl.filter(p=>p.off),def=pl.filter(p=>!p.off);
  /* offense movement */
  for(const p of off){if(p===carrier)continue;if(carrier&&p!==pl[0]){const d=def.filter(q=>!q.blk).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(d){toward(p,d.x-.6,d.y,SPD(p.r));if(Math.hypot(d.x-p.x,d.y-p.y)<1.1&&Math.random()<.03+team.ol*.01)d.blk=Math.round(15+team.ol*6);}continue;}if(p.route&&p.ri<p.route.length){const t=p.route[p.ri];toward(p,t[0],t[1],SPD(p.r)*(pT<4?.3:1));if(Math.hypot(p.x-t[0],p.y-t[1])<.3)p.ri++;}
   else if(p.route&&p.ri>=p.route.length&&p!==qb&&!carrier){toward(p,p.x+1,p.y,SPD(p.r)*.6);}
   else if(p.r==='OL'||p.r==='TE'||(carrier&&p!==qb)){const d=def.filter(q=>!q.blk).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(d&&(p.r==='OL'||carrier)){toward(p,d.x-.6,d.y,SPD(p.r));if(Math.hypot(d.x-p.x,d.y-p.y)<1.1&&Math.random()<.04+team.ol*.012)d.blk=Math.round(20+team.ol*8);}}}
  if(ball.own===qb&&!carrier){if(pT<22&&!(ax(k)||ay(k)))toward(qb,los-7,26.6,.18);else{qb.x+=ax(k)*.2;qb.y+=ay(k)*.2;}if(qb.x>los){carrier=qb;}
   if(play==='HB DIVE'){const rb=pl[1];if(Math.hypot(rb.x-qb.x,rb.y-qb.y)<1.4||pT>16){ball.own=rb;carrier=rb;rb.route=null;S('blip');}}
   else{const rs=recv();if(h.u){tgt=(tgt+rs.length-1)%rs.length;S('blip');}if(h.d){tgt=(tgt+1)%rs.length;S('blip');}
    if(mouseOn()&&A.mouse.down){if(!drag)drag={x:A.mouse.x,y:A.mouse.y};drag.cx=A.mouse.x;drag.cy=A.mouse.y;}
    else if(drag){const vx=(drag.x-drag.cx)/7*2.2,vy=(drag.y-drag.cy)/3.6*1.4;if(Math.hypot(vx,vy)>2){throwTo(qb.x+vx,cl(qb.y+vy,0,53));}drag=null;}
    else if(h.a&&!mouseOn()&&pT>6){const r=rs[tgt];const d=Math.hypot(r.x-qb.x,r.y-qb.y),T_=d/(.55+team.qb*.07);const ti=r.route&&r.ri<r.route.length?r.route[r.ri]:[r.x+3,r.y];const dx=ti[0]-r.x,dy=ti[1]-r.y,dd=Math.hypot(dx,dy)||1,sp=SPD(r.r);throwTo(r.x+dx/dd*sp*T_*.9,cl(r.y+dy/dd*sp*T_*.9,1,52));}}}
  else if(carrier){const c=carrier;if(jcd>0)jcd--;if(juke>0)juke--;if(h.b&&jcd<=0){juke=22;jcd=60;c.jy=ay(k)||(Math.random()<.5?-1:1);S('jump');}
   const sp=SPD(c.r)*(k.a?1.15:1)*(juke>0?1.3:1);c.x+=(ax(k)>=0?(ax(k)>0?1:.55):-.5)*sp;c.y+=(juke>0?c.jy*.9:ay(k))*sp;c.st+=.3;
   if(c.x>=100){endPlay(100,'td');return;}if(c.y<0||c.y>53.3){endPlay(c.x,'oob');return;}}
  /* ball flight */
  if(ball.fl){const f=ball.fl;f.t++;const u=f.t/f.T;ball.x=f.sx+(f.tx-f.sx)*u;ball.y=f.sy+(f.ty-f.sy)*u;ball.h=Math.sin(u*3.14)*Math.min(8,f.T*.12);
   if(u>=1){ball.fl=null;const rs=recv().map(r=>[r,Math.hypot(r.x-ball.x,r.y-ball.y)]).sort((a,b)=>a[1]-b[1])[0],ds=def.map(r=>[r,Math.hypot(r.x-ball.x,r.y-ball.y)]).sort((a,b)=>a[1]-b[1])[0];
    if(ds&&ds[1]<1.4&&(!rs||ds[1]<rs[1])&&Math.random()<.3+RT[opp][1]*.04){A.shake=6;endPlay(los,'int');return;}
    if(rs&&rs[1]<2.2){const cover=ds&&ds[1]<1.6;if(Math.random()<(cover?.55:.9)){carrier=rs[0];ball.own=carrier;S('coin');res='';}else{endPlay(los,'inc');return;}}else{endPlay(los,'inc');return;}}}
  /* defense */
  for(const p of def){if(p.blk>0){p.blk--;continue;}const tgtP=carrier||ball.own;
   if(p.r==='DL'){toward(p,tgtP?tgtP.x:ball.x,tgtP?tgtP.y:ball.y,SPD('DL'));}
   else if(carrier||(ball.fl&&p.r!=='DL')){const aim=carrier?[carrier.x+.6,carrier.y]:[ball.fl.tx,ball.fl.ty];toward(p,aim[0],aim[1],SPD(p.r)*(carrier?1:.9));}
   else if(p.r==='CB'){const wr=pl.filter(q=>q.r==='WR').sort((a,b)=>Math.abs(a.y-p.y)-Math.abs(b.y-p.y))[0];toward(p,wr.x+.8,wr.y,SPD('CB'));}
   else if(p.r==='LB'){const m=pl.find(q=>q.r==='TE');toward(p,Math.max(los+4,m.x+1),p.y+(m.y-p.y)*.05,SPD('LB')*.5);}
   else if(p.r==='S'){const deep=Math.max(...recv().map(r=>r.x));toward(p,Math.max(deep+3,los+10),26.6,SPD('S')*.6);}
   const bc=carrier||(ball.own===qb?qb:null);if(bc&&Math.hypot(p.x-bc.x,p.y-bc.y)<.95&&!(juke>8)){if(Math.random()<.3+RT[opp][1]*.03-(bc.r==='RB'?team.rb*.03:0)){A.shake=4;S('hit');endPlay(bc.x,bc===qb&&!carrier?'sack':'tackle');return;}}}
  if(pT>600&&!ball.fl)endPlay(ball.own?ball.own.x:los,'tackle');
  if(ball.own){ball.x=ball.own.x;ball.y=ball.own.y;ball.h=2;}}
 function kick(){const h=A.hit(0);fg.t++;if(phase==='punt'){if(fg.t>40){const net=36+ri(14)+team.qb;res='PUNT: '+net+' YARDS';S('jump');phase='dead';pT=0;finishDrive();}return;}
  if(fg.stop<0){fg.v+=fg.dir*.045;if(fg.v>1||fg.v<-1)fg.dir*=-1;if(h.a&&fg.t>15){fg.stop=fg.v;S('jump');}if(fg.t>400)fg.stop=fg.v;}else{const dst=117-los,tol=.42-dst*.005;const good=Math.abs(fg.stop)<tol;res=good?'FIELD GOAL IS GOOD!':'FIELD GOAL MISSED';if(good){gs[0]+=3;pts+=3;S('score');}else S('lose');phase='dead';pT=0;finishDrive();}}
 g.update=()=>{const h=A.hit(0);if(resT)resT--;stT++;
  if(st==='intro'){if((h.a&&stT>20)||stT>420){st='office';stT=0;sel=ATR.length;}return;}
  if(st==='office'){const n=ATR.length+1;if(mouseOn())for(let i=0;i<n;i++)if(hit2(A.mouse.x,A.mouse.y,40,70+i*20,240,18))sel=i;if(h.u)sel=(sel+n-1)%n;if(h.d)sel=(sel+1)%n;
   if(h.a&&stT>15){if(sel===ATR.length){startGame();}else{const a=ATR[sel][1];if(team[a]<5&&cp>=team[a]){cp-=team[a];team[a]++;S('coin');}else S('lose');}}if(stT>900)startGame();return;}
  if(st==='results'||st==='bowlres'){if((h.a&&stT>40)||stT>600){if(st==='bowlres'){g.score+=champ?1000:0;g.over=champ?'CHAMPIONS - BOWL VICTORY':'BOWL LOST - SEASON OVER';return;}week++;if(week>=4){const s=standings();if(s.indexOf(0)<2){bowl=true;st='office';stT=0;sel=ATR.length;}else{g.over='SEASON OVER - '+rec[0].w+'-'+rec[0].l+' RECORD';}}else{st='office';stT=0;sel=ATR.length;}}return;}
  if(st==='oppdrive'){if((h.a&&stT>30)||stT>200){if(oppMsg.length)oppMsg.shift();if(!oppMsg.length)nextDrive();else stT=0;}return;}
  /* game */
  if(phase==='call'){const o=opts();if(mouseOn())o.forEach((p,i)=>{const x=10+(i%3)*102,y=60+Math.floor(i/3)*44;if(hit2(A.mouse.x,A.mouse.y,x,y,96,38))sel=i;});if(h.l||h.u){sel=(sel+o.length-1)%o.length;S('blip');}if(h.r||h.d){sel=(sel+1)%o.length;S('blip');}if(sel>=o.length)sel=0;if(h.a&&stT>10){setup(sel);stT=0;S('coin');}return;}
  if(phase==='pre'){if(h.a&&stT>8){phase='live';pT=0;S('hit');}return;}
  if(phase==='live')live();else if(phase==='punt'||phase==='fg')kick();
  else if(phase==='dead'){pT++;if(pT>90||(h.a&&pT>30)){if(ended){oppMsg.push(simOpp());st='oppdrive';stT=0;}else{phase='call';stT=0;}}}
  g.score=Math.max(g.score,0);g.score=yards+pts*10+rec[0].w*100+(champ?1000:0);};
 /* drawing */
 const SX=x=>110+(x-camX)*7,SYY=y=>30+y*3.6;
 function field(){R(0,0,W,H,'#2a7a3a');for(let yd=-10;yd<110;yd+=5){const x=SX(yd);if(x<-40||x>W+40)continue;R(x,30,35,192,((yd/5)|0)%2?'#2e8a40':'#2a7e3a');}
  const ez=(a,b,col,name)=>{const x0=SX(a),x1=SX(b);R(Math.min(x0,x1),30,Math.abs(x1-x0),192,col);for(let i=0;i<6;i++)T(name[i%name.length],(x0+x1)/2,40+i*30,'#ffffff',2,'c');};ez(-10,0,TEAMS[0][1],TEAMS[0][0]);ez(100,110,TEAMS[opp][1],TEAMS[opp][0]);
  for(let yd=0;yd<=100;yd+=5){const x=SX(yd);if(x<-5||x>W+5)continue;L(x,30,x,222,'#e8f0e8',yd%10?1:1.5);if(yd%10===0&&yd>0&&yd<100){const n=yd<=50?yd:100-yd;T(''+n,x,40,'#e8f0e8',2,'c');T(''+n,x,206,'#e8f0e8',2,'c');}}
  for(let yd=0;yd<100;yd++){const x=SX(yd);if(x<0||x>W)continue;R(x,SYY(22.6),1,2,'#d8e8d8');R(x,SYY(30.6),1,2,'#d8e8d8');}
  R(0,26,W,4,'#e8e8e8');R(0,222,W,4,'#e8e8e8');
  const lx=SX(los);R(lx-1,30,2,192,'#3a8aff');const fx=SX(los+togo);if(togo<=99-los)R(fx-1,30,2,192,'#ffd83a');}
 g.draw=()=>{if(st==='intro'){GR(0,0,W,H,'#1a3a6a','#0a1a2a');T('GRIDIRON PRO',160,24,K.y,3,'c');T('YOU COACH THE '+TEAMS[0][0]+'. YOU CALL THE PLAYS. YOU THROW THE BALL.',160,54,K.w,1,'c');T('4-GAME SEASON. TOP 2 IN THE STANDINGS PLAY THE BOWL.',160,66,K.gr,1,'c');
   for(let i=0;i<5;i++)A.person(60+i*50,140,{s:1.4,c:TEAMS[0][1],pants:'#e8e8e8',num:[12,88,24,72,54][i],id:i,cap:TEAMS[0][1],d:1});T('PASS: DRAG BACK FROM ANYWHERE AND RELEASE,',160,160,K.c,1,'c');T('OR UP/DOWN PICKS A RECEIVER AND A THROWS.',160,170,K.c,1,'c');T('CARRYING: ARROWS RUN, A SPRINTS, B JUKES.',160,184,K.c,1,'c');if(A.t%60<40)T('PRESS A',160,208,K.w,2,'c');return;}
  if(st==='office'||st==='results'||st==='bowlres'){GR(0,0,W,H,'#1a2a4a','#0a1020');
   if(st==='office'){T(bowl?'BOWL WEEK - FRONT OFFICE':'WEEK '+(week+1)+' - FRONT OFFICE',160,10,K.y,2,'c');const o=bowl?standings().find(i=>i!==0):sched[week];T('NEXT: VS '+TEAMS[o][0]+'  (OFF '+RT[o][0]+' DEF '+RT[o][1]+')',160,32,TEAMS[o][1],1,'c');T('COACH POINTS '+cp+'   RECORD '+rec[0].w+'-'+rec[0].l,160,48,K.c,1,'c');
    ATR.forEach((a,i)=>{const y=70+i*20,on=sel===i;R(40,y,240,18,on?'#2a3a6a':'#141c34');A.box(40,y,240,18,on?K.y:'#3a4a6a');T(a[0],48,y+6,K.w,1);for(let j=0;j<5;j++)R(140+j*14,y+5,11,8,j<team[a[1]]?K.g:'#2a2a3a');T(team[a[1]]<5?'COST '+team[a[1]]:'MAX',272,y+6,cp>=team[a[1]]?K.y:K.gr,1,'r');});
    const y=70+ATR.length*20,on=sel===ATR.length;R(40,y,240,18,on?'#2a6a3a':'#143424');A.box(40,y,240,18,on?K.y:'#3a6a4a');T('KICK OFF  >',160,y+6,K.w,1,'c');T('UP/DOWN + A. UPGRADES COST THEIR CURRENT LEVEL.',160,206,K.gr,1,'c');return;}
   T(st==='bowlres'?'BOWL GAME FINAL':'FINAL - WEEK '+(week+1),160,10,K.y,2,'c');T(TEAMS[0][0]+' '+gs[0]+'  -  '+gs[1]+' '+TEAMS[opp][0],160,32,g.lastWin?K.g:K.r,2,'c');
   if(st==='bowlres'){T(champ?'CHAMPIONS!':'SO CLOSE.',160,90,champ?K.y:K.gr,3,'c');T('PRESS A',160,200,K.w,1,'c');return;}
   T('STANDINGS',160,54,K.y,1,'c');standings().forEach((i,k)=>{const y=66+k*14;R(60,y-2,200,12,i===0?'#2a3a6a':'#121a30');C(70,y+3,3,TEAMS[i][1]);T((k+1)+'. '+TEAMS[i][0],78,y+1,i===0?K.c:K.w,1);T(rec[i].w+'-'+rec[i].l,250,y+1,K.w,1,'r');});T(week>=3?'A: SEE IF YOU MADE THE BOWL':'A: NEXT WEEK',160,190,K.c,1,'c');return;}
  if(st==='oppdrive'){A.cls('#0a1020');T(TEAMS[opp][0]+' ON OFFENSE',160,70,TEAMS[opp][1],2,'c');T(oppMsg[0]||'',160,104,K.w,1,'c');T(TEAMS[0][0]+' '+gs[0]+' - '+gs[1]+' '+TEAMS[opp][0],160,130,K.y,2,'c');T('YOUR DEFENSE RATING '+team.df+' VS THEIR OFFENSE '+RT[opp][0],160,160,K.gr,1,'c');return;}
  const focus=ball&&phase!=='call'?ball.x:los;camX+=(focus-camX)*.15;field();
  if(phase!=='call'&&pl.length){
   if(phase==='pre')for(const p of pl)if(p.route){let px=SX(p.x),py=SYY(p.y);for(const q of p.route){const nx=SX(q[0]),ny=SYY(q[1]);A.c.setLineDash&&A.c.setLineDash([3,3]);L(px,py,nx,ny,'#ffff80',1);px=nx;py=ny;}A.c.setLineDash&&A.c.setLineDash([]);A.poly([[px-2,py-2],[px+2,py],[px-2,py+2]],'#ffff80',1);}
   const rs=recv();const list=pl.slice().sort((a,b)=>a.y-b.y);for(const p of list){const x=SX(p.x),y=SYY(p.y)+6;if(x<-20||x>W+20)continue;const T_=p.off?TEAMS[0]:TEAMS[opp];A.person(x,y,{s:.62,c:T_[1],pants:T_[2],cap:T_[1],id:pl.indexOf(p),st:p.st,d:p.off?1:-1});if(p.blk>0&&A.t%10<5)T('*',x,y-24,'#ffffff',1,'c');
    if(phase==='live'&&!carrier&&ball.own===pl[0]&&play!=='HB DIVE'&&rs[tgt]===p&&!mouseOn()){ER(x,y,7,2.5,K.y,1.5);T('A',x,y-26,K.y,1,'c');}if(p===carrier)ER(x,y,7,2.5,'#ffffff',1.5);}
   if(ball&&(ball.fl||phase==='live')){const x=SX(ball.x),y=SYY(ball.y)+2-ball.h*3;if(ball.fl)EL(SX(ball.x),SYY(ball.y)+4,2.5,1,'rgba(0,0,0,.3)');EL(x,y,2.6,1.6,'#8a4a1a');L(x-1,y,x+1,y,'#ffffff',.6);}
   if(drag&&drag.cx!==undefined){const q=pl[0],x=SX(q.x),y=SYY(q.y);const vx=(drag.x-drag.cx)*2.2,vy=(drag.y-drag.cy)*1.4;L(x,y-8,x+vx,y-8+vy,K.y,2);C(x+vx,y-8+vy,3,K.y);ER(SX(q.x+vx/7),SYY(cl(q.y+vy/3.6,0,53))+4,6,2.5,K.y,1);L(drag.x,drag.y,drag.cx,drag.cy,'rgba(255,255,255,.5)',1);}}
  /* HUD */
  R(0,0,W,24,'#0a1020');T(TEAMS[0][0]+' '+gs[0],6,3,TEAMS[0][1],1);T(gs[1]+' '+TEAMS[opp][0],W-6,3,TEAMS[opp][1],1,'r');T(bowl?'BOWL GAME':'WEEK '+(week+1),160,3,K.gr,1,'c');
  const ord=['1ST','2ND','3RD','4TH'][Math.min(3,down-1)],spot=los<50?'OWN '+los:los===50?'MIDFIELD':'OPP '+(100-los);T(ord+' & '+(los+togo>=100?'GOAL':togo)+'  AT '+spot,6,14,K.w,1);T('DRIVE '+Math.min(drive,DRIVES)+'/'+DRIVES,W-6,14,K.y,1,'r');
  if(phase==='call'){PANEL(4,40,312,104,K.y,.92);T('CALL THE PLAY',160,46,K.y,1,'c');opts().forEach((p,i)=>{const x=10+(i%3)*102,y=58+Math.floor(i/3)*42,on=i===sel;R(x,y,96,38,on?'#2a4a8a':'#141c34');A.box(x,y,96,38,on?K.y:'#3a4a6a');T(p.n,x+48,y+8,on?K.y:K.w,1,'c');T(p.d,x+48,y+22,K.gr,1,'c');});}
  if(phase==='pre')T('A: SNAP THE BALL',160,228,K.y,1,'c');else if(phase==='live'&&!carrier&&play!=='HB DIVE')T('DRAG BACK + RELEASE TO PASS, OR UP/DOWN + A',160,228,K.w,1,'c');else if(carrier)T('ARROWS RUN  A SPRINT  B JUKE',160,228,K.w,1,'c');
  if(phase==='fg'){PANEL(60,90,200,50,K.y);T('FIELD GOAL - '+(117-los)+' YDS',160,96,K.y,1,'c');R(80,112,160,10,'#2a2a3a');const tol=(.42-(117-los)*.005)*80;R(160-tol,112,tol*2,10,'#2a8a3a');const v=fg.stop<0?fg.v:fg.stop;R(160+v*80-1,108,3,18,K.w);T('A: KICK',160,130,K.c,1,'c');}
  if(phase==='dead'&&res){PANEL(50,92,220,26,K.y);T(res,160,102,res.startsWith('TOUCH')||res.includes('GOOD')||res.includes('FIRST')?K.g:K.w,1,'c');}};
 return g;}});
})();
