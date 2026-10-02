/* ADVANCED PACK 1: deep-system games inspired by famous classics. All names, characters and art are original. */
(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const GA=a=>{A.c.globalAlpha=a;};
const box=(x,y,w,h,bg,bd)=>{R(x,y,w,h,bg);if(bd)A.box(x,y,w,h,bd);};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);const t=a[i];a[i]=a[j];a[j]=t;}return a;};
const mClick=()=>A.hit(0).a&&A.mouse.down;
const inR=(x,y,w,h)=>A.mouse.x>=x&&A.mouse.x<x+w&&A.mouse.y>=y&&A.mouse.y<y+h;
const pick=a=>a[ri(a.length)];
const dist=(a,b,c,d)=>Math.hypot(c-a,d-b);

/* ---- BLOCK 99: falling-block battle royale vs 98 simulated boards ---- */
A.add({id:'block99',name:'BLOCK 99',cat:'PUZZLE',time:480,tags:'tetris 99 battle royale falling blocks',how:'ARROWS MOVE, UP DROPS, A ROTATES, B HOLDS, DOWN+B SWAPS TARGET. BE THE LAST BOARD.',make(){
 const g={over:null,score:0};
 const PC=['#35d8ff','#ffd23f','#b45cff','#3dff8b','#ff4f6d','#4d7bff','#ff9838','#77708f'];
 const SH=[[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[1,1],[1,1]],[[0,1,0],[1,1,1],[0,0,0]],[[0,1,1],[1,1,0],[0,0,0]],[[1,1,0],[0,1,1],[0,0,0]],[[1,0,0],[1,1,1],[0,0,0]],[[0,0,1],[1,1,1],[0,0,0]]];
 const rot=m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
 const COLS=10,ROWS=22,BX=120,BY=36,CS=8,MODES=['RANDOM','ATTACKERS','KOS','BADGES'],MS=['RND','ATK','KO','BDG'];
 let bd=[];for(let y=0;y<ROWS;y++)bd.push(Array(COLS).fill(0));
 let bag=[],queue=[],cur=null,hold=-1,held=false,fallT=0,lockT=0,lockN=0,das=0,lastRot=false,combo=-1,b2b=false,inq=[],mode=1,pb=0,kos=0,lines=0,el=0,msg='',msgT=0,flash=[],shots=[],dead=false,place=99,endT=0;
 const nextP=()=>{if(!bag.length)bag=shuf([0,1,2,3,4,5,6]);return bag.pop();};for(let i=0;i<5;i++)queue.push(nextP());
 const cpus=[];for(let i=0;i<98;i++){const s=i<49?0:1,j=i%49;cpus.push({i,h:rnd(5),sk:.42+rnd(.9),t:120+ri(400),in:[],badge:0,ko:false,tgt:-2,last:-2,col:PC[ri(7)],cols:Array(10).fill(0),kt:0,x:(s?226:4)+(j%7)*13,y:26+(j/7|0)*30});}
 const shape=c=>{for(let x=0;x<10;x++)c.cols[x]=cl(Math.round(c.h+rnd(2.4)-1.2),0,20);};cpus.forEach(shape);
 const alive=()=>cpus.filter(c=>!c.ko);
 const blv=()=>pb>=30?4:pb>=14?3:pb>=6?2:pb>=2?1:0;
 const fits=(m,px,py)=>{for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(m[y][x]){const bx=px+x,by=py+y;if(bx<0||bx>=COLS||by>=ROWS)return false;if(by>=0&&bd[by][bx])return false;}return true;};
 const topOut=()=>{if(dead)return;dead=true;place=alive().length+1;S('lose');A.shake=10;A.burst(160,120,K.r,40,3);endT=70;};
 const spawn=k=>{cur={k,m:SH[k],x:k===1?4:3,y:0};fallT=0;lockT=0;lockN=0;lastRot=false;if(!fits(cur.m,cur.x,cur.y)){cur.y=-1;if(!fits(cur.m,cur.x,cur.y))topOut();}};
 spawn(queue.shift());queue.push(nextP());
 const center=c=>[c.x+5,c.y+10];
 const shot=(x0,y0,x1,y1,c,n)=>{if(shots.length<40)shots.push({x0,y0,x1,y1,c,n,t:0});};
 const koCpu=(c)=>{c.ko=true;c.kt=40;A.burst(c.x+5,c.y+10,K.r,10,1.5);const kl=c.last;if(kl===-1){kos++;pb+=c.badge+1;g.score+=500;msg='K.O.! +'+(c.badge+1)+' BADGE';msgT=80;S('score');}else if(kl>=0&&!cpus[kl].ko)cpus[kl].badge+=c.badge+1;};
 const send=n=>{const al=alive();if(!al.length)return;let tg=[];if(mode===1){tg=al.filter(c=>c.tgt===-1).slice(0,4);if(tg.length>1)n+=Math.min(3,tg.length-1);if(!tg.length)tg=[pick(al)];}else if(mode===2)tg=[al.reduce((a,b)=>b.h>a.h?b:a)];else if(mode===3)tg=[al.reduce((a,b)=>b.badge>a.badge?b:a)];else tg=[pick(al)];
  for(const c of tg){c.in.push({n,t:90,from:-1});const[x,y]=center(c);shot(160,110,x,y,K.c,n);}};
 const applyGarbage=()=>{let cap=8,over=false;while(cap>0&&inq.length&&inq[0].t<=0){const q=inq[0],n=Math.min(q.n,cap),hole=ri(COLS);for(let i=0;i<n;i++){const top=bd.shift();if(top.some(v=>v))over=true;const row=Array(COLS).fill(8);row[hole]=0;bd.push(row);}q.n-=n;cap-=n;if(q.n<=0)inq.shift();}if(cap<8){S('hit');A.shake=4;}if(over)topOut();};
 const lock=()=>{let hidden=true;for(let y=0;y<cur.m.length;y++)for(let x=0;x<cur.m[y].length;x++)if(cur.m[y][x]){const by=cur.y+y;if(by>=0)bd[by][cur.x+x]=cur.k+1;if(by>=2)hidden=false;}
  if(hidden){topOut();return;}
  let ts=false;if(cur.k===2&&lastRot){let n=0;for(const[dx,dy]of[[0,0],[2,0],[0,2],[2,2]]){const x=cur.x+dx,y=cur.y+dy;if(x<0||x>=COLS||y>=ROWS||(y>=0&&bd[y][x]))n++;}ts=n>=3;}
  const full=[];bd.forEach((r,y)=>{if(r.every(v=>v))full.push(y);});const n=full.length;
  if(n){full.forEach(y=>flash.push({y,t:14}));bd=bd.filter(r=>!r.every(v=>v));while(bd.length<ROWS)bd.unshift(Array(COLS).fill(0));combo++;lines+=n;
   let atk=ts?[0,2,4,6,6][n]:[0,0,1,2,4][n];const big=n===4||ts;if(big&&b2b)atk++;b2b=big;atk+=[0,0,1,1,2,2,3,3,4,4,4,5][Math.min(combo,11)];const pc=bd.every(r=>r.every(v=>!v));if(pc)atk+=6;atk=Math.floor(atk*(1+.25*blv()));
   g.score+=n*n*40+atk*30;msg=(pc?'ALL CLEAR! ':'')+(ts?'T-SPIN '+['','SINGLE','DOUBLE','TRIPLE'][Math.min(3,n)]:['','SINGLE','DOUBLE','TRIPLE','QUAD!'][n])+(combo>0?' COMBO '+combo:'');msgT=60;S(n>=4||ts?'win':'score');A.burst(BX+40,BY+(full[0]-2)*CS,PC[cur.k],16,2);
   while(atk>0&&inq.length){const q=inq[0],m=Math.min(q.n,atk);q.n-=m;atk-=m;if(q.n<=0)inq.shift();}if(atk>0)send(atk);}
  else{combo=-1;applyGarbage();S('blip');}
  g.score+=2;held=false;if(!dead){spawn(queue.shift());queue.push(nextP());}};
 const move=d=>{if(fits(cur.m,cur.x+d,cur.y)){cur.x+=d;lastRot=false;if(!fits(cur.m,cur.x,cur.y+1)&&lockN<15){lockT=0;lockN++;}return true;}return false;};
 const rotate=()=>{const m=rot(cur.m);for(const[dx,dy]of[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1],[-2,0],[2,0],[0,1]]){if(fits(m,cur.x+dx,cur.y+dy)){cur.m=m;cur.x+=dx;cur.y+=dy;lastRot=true;if(lockN<15){lockT=0;lockN++;}S('blip');return;}}};
 const ghostY=()=>{let y=cur.y;while(fits(cur.m,cur.x,y+1))y++;return y;};
 g.update=()=>{el++;if(msgT)msgT--;flash.forEach(f=>f.t--);flash=flash.filter(f=>f.t>0);shots.forEach(s=>s.t+=.045);shots=shots.filter(s=>s.t<1);
  if(dead){if(--endT<=0){g.score+=(99-place)*15;g.over='KO - PLACE '+place+' OF 99';}return;}
  const sp=1+el/3600*.5,al=alive();
  for(const c of cpus){if(c.ko){if(c.kt)c.kt--;continue;}c.h+=.0016*sp*sp*(1.6-c.sk*.6);for(const q of c.in)q.t--;while(c.in.length&&c.in[0].t<=0){const q=c.in.shift();c.h+=q.n;c.last=q.from;shape(c);}
   if(--c.t<=0){const r=rnd(1)*c.sk,ln=r>1.05?4:r>.8?3:r>.5?2:1;c.h=Math.max(0,c.h-ln);let atk=[0,0,1,2,4][ln]+(rnd(1)<.3?1:0);while(atk>0&&c.in.length){const q=c.in[0],m=Math.min(q.n,atk);q.n-=m;atk-=m;if(q.n<=0)c.in.shift();}
    if(atk>0&&al.length>1){const o=al[ri(al.length)];if(o!==c&&!o.ko){o.in.push({n:atk,t:90,from:c.i});c.tgt=o.i;if(rnd(1)<.08){const[a,b]=center(c),[x,y]=center(o);shot(a,b,x,y,'#ff9a9a',1);}}}
    c.t=(260+ri(260))/(c.sk*Math.sqrt(sp));shape(c);}
   if(c.h>=20)koCpu(c);}
  const al2=alive();if(!al2.length){g.score+=2500;g.over='VICTORY ROYALE! 1ST OF 99';return;}
  // incoming to the player
  const aggro=[1,.8,1.2,1.2][mode]*(1+blv()*.06),rate=(.08+.3*(1-al2.length/99))*aggro;
  if(rnd(1)<rate/60/1.6){const atkers=al2.filter(c=>c.tgt===-1),src=atkers.length&&rnd(1)<.6?pick(atkers):pick(al2);src.tgt=-1;const r=rnd(1)*src.sk,n=r>1.1?4:r>.85?3:r>.55?2:1;inq.push({n,t:180,from:src.i});const[x,y]=center(src);shot(x,y,BX+40,BY+80,K.r,n);}
  for(const q of inq)q.t--;
  // input
  const k=A.in(0),h=A.hit(0);let ui=false;
  if(mClick())MS.forEach((_,i)=>{if(inR(98+i*32,201,30,11)){mode=i;ui=true;S('coin');}});
  if(h.b&&k.d){mode=(mode+1)%4;S('coin');msg='TARGET '+MODES[mode];msgT=50;}
  else if(h.b&&!held){held=true;const t=cur.k;if(hold<0){hold=t;spawn(queue.shift());queue.push(nextP());}else{spawn(hold);hold=t;}S('blip');}
  if(dead)return;
  if(h.a&&!ui)rotate();
  const dx=ax(k);if(h.l||h.r){move(h.l?-1:1);das=0;}else if(dx){das++;if(das>9&&das%2===0)move(dx);}else das=0;
  if(h.u){const gy=ghostY();g.score+=(gy-cur.y);cur.y=gy;A.shake=2;lock();return;}
  const lvl=1+(el/1800|0),grav=Math.max(3,42-lvl*4);fallT+=k.d&&!k.b?grav/2:1;
  if(fallT>=grav){fallT=0;if(fits(cur.m,cur.x,cur.y+1))cur.y++;}
  if(!fits(cur.m,cur.x,cur.y+1)){if(++lockT>30)lock();}else lockT=0;};
 const cell=(x,y,c,s)=>{R(x,y,s,s,c);if(s>=4){R(x,y,s,1,A.mix(c,'#ffffff',.45));R(x,y+s-1,s,1,A.mix(c,'#000000',.4));}};
 const mini=(m,k,x,y,s)=>{const w=m[0].length;for(let yy=0;yy<m.length;yy++)for(let xx=0;xx<w;xx++)if(m[yy][xx])cell(x+xx*s-(w===2?-s:0),y+yy*s,PC[k],s);};
 g.draw=()=>{A.cls('#0b0a22');R(94,22,132,218,'#14123a');R(0,22,94,218,'#100e2c');R(226,22,94,218,'#100e2c');
  // CPU boards
  const al=alive().length;
  const cx_=A.c;for(const c of cpus){cx_.fillStyle=c.tgt===-1&&!c.ko?'#ff4f6d':'#2a2650';cx_.fillRect(c.x-1,c.y-1,12,22);cx_.fillStyle='#06051a';cx_.fillRect(c.x,c.y,10,20);if(c.ko){if(c.kt){GA(c.kt/40);cx_.fillStyle='#ffffff';cx_.fillRect(c.x,c.y,10,20);GA(1);}cx_.fillStyle='#3a3656';cx_.fillRect(c.x+2,c.y+9,6,2);continue;}
   cx_.fillStyle=c.h>14?'#c0405a':c.col;for(let x=0;x<10;x++){const hh=c.cols[x];if(hh>0)cx_.fillRect(c.x+x,c.y+20-hh,1,hh);}if(c.badge){cx_.fillStyle=K.y;cx_.fillRect(c.x,c.y-3,Math.min(10,c.badge),2);}}
  // targets
  const al2=alive();let tg=[];if(mode===1)tg=al2.filter(c=>c.tgt===-1).slice(0,4);else if(mode===2&&al2.length)tg=[al2.reduce((a,b)=>b.h>a.h?b:a)];else if(mode===3&&al2.length)tg=[al2.reduce((a,b)=>b.badge>a.badge?b:a)];
  for(const c of tg){A.box(c.x-3,c.y-3,16,26,A.t%20<10?K.y:K.c);}
  // board
  const danger=bd[6].some(v=>v);R(BX-2,BY-2,COLS*CS+4,160+4,danger&&A.t%30<15?K.r:'#4a4490');R(BX,BY,COLS*CS,160,'#07061a');
  for(let x=1;x<COLS;x++)R(BX+x*CS,BY,1,160,'#12102e');for(let y=1;y<20;y++)R(BX,BY+y*CS,COLS*CS,1,'#12102e');
  for(let y=2;y<ROWS;y++)for(let x=0;x<COLS;x++){const v=bd[y][x];if(v)cell(BX+x*CS,BY+(y-2)*CS,PC[v-1],CS);}
  flash.forEach(f=>{GA(f.t/14);R(BX,BY+(f.y-2)*CS,COLS*CS,CS,'#ffffff');GA(1);});
  if(cur&&!dead){const gy=ghostY();for(let y=0;y<cur.m.length;y++)for(let x=0;x<cur.m[y].length;x++)if(cur.m[y][x]){const px=BX+(cur.x+x)*CS;if(gy+y>=2)A.box(px,BY+(gy+y-2)*CS,CS,CS,PC[cur.k]);if(cur.y+y>=2)cell(px,BY+(cur.y+y-2)*CS,PC[cur.k],CS);}}
  // garbage meter
  let tot=0,yy=BY+160;for(const q of inq){const hh=Math.min(q.n*CS,yy-BY);yy-=hh;R(116,yy,3,hh,q.t<=0?(A.t%10<5?K.r:'#ff9a9a'):K.y);tot+=q.n;}
  // hold / next
  T('HOLD',106,26,K.gr,1,'c');box(96,34,20,18,'#0c0b26','#3a3570');if(hold>=0)mini(SH[hold],hold,98,38,4);
  T('NEXT',212,26,K.gr,1,'c');for(let i=0;i<4;i++){box(202,34+i*20,20,18,'#0c0b26',i?'#2a2650':'#3a3570');mini(SH[queue[i]],queue[i],204,38+i*20,4);}
  T('LV '+(1+(el/1800|0)),212,118,K.gr,1,'c');T('LINES',212,130,K.gr,1,'c');T(''+lines,212,138,K.w,1,'c');
  // target mode buttons
  MS.forEach((m,i)=>{const on=mode===i;box(98+i*32,201,30,11,on?'#3a2a78':'#14123a',on?K.y:'#3a3570');T(m,113+i*32,204,on?K.y:K.gr,1,'c');});
  const att=al2.filter(c=>c.tgt===-1).length;T('ATTACKERS '+att,160,216,att>2?K.r:K.gr,1,'c');
  const bl=blv();for(let i=0;i<4;i++)C(130+i*10,230,3.5,i<bl?K.y:'#2a2650');T('+'+bl*25+'%',176,227,K.y,1);
  // shots
  shots.forEach(s=>{const x=s.x0+(s.x1-s.x0)*s.t,y=s.y0+(s.y1-s.y0)*s.t-Math.sin(s.t*3.14)*20;C(x,y,1.5+Math.min(3,s.n*.6),s.c);});
  // HUD
  T('ALIVE '+(al+(dead?0:1)),4,6,K.c,2);T(''+g.score,160,6,K.w,2,'c');T('KO '+kos,316,6,K.y,2,'r');
  if(msgT)T(msg,160,92,K.y,1,'c');if(dead)T('K.O.',160,100,K.r,3,'c');};
 return g;}});

/* ---- LANE RUSH: two-lane card battler with elixir, towers and overtime ---- */
A.add({id:'lanerush',name:'LANE RUSH',cat:'VERSUS',vs:1,time:240,tags:'clash royale tower rush card battle',how:'LEFT/RIGHT PICK A CARD, UP/DOWN LANE, A DEPLOYS, B FRONT/BACK. OR CLICK CARD THEN ARENA.',make(){
 const g={over:null,score:0};
 // id,name,cost,type,n,hp,dmg,cd,rng,spd,r,air,hitsAir,bldOnly
 const CD=[
  {n:'KNIGHT',c:3,t:'u',k:1,hp:720,d:78,cd:70,rg:9,sp:.42,r:5,col:'#c0c8d8'},
  {n:'ARCHERS',c:3,t:'u',k:2,hp:150,d:42,cd:60,rg:56,sp:.42,r:4,ha:1,col:'#5ac060'},
  {n:'GIANT',c:5,t:'u',k:1,hp:2000,d:125,cd:90,rg:9,sp:.28,r:7,bo:1,col:'#d89050'},
  {n:'GOBLINS',c:2,t:'u',k:3,hp:95,d:55,cd:58,rg:7,sp:.72,r:3.5,col:'#70d040'},
  {n:'BATS',c:2,t:'u',k:3,hp:62,d:40,cd:55,rg:9,sp:.78,r:3.5,air:1,ha:1,col:'#6a4a9a'},
  {n:'RIFLER',c:4,t:'u',k:1,hp:380,d:96,cd:66,rg:66,sp:.42,r:4.5,ha:1,col:'#b05cff'},
  {n:'FIREBALL',c:4,t:'s',d:330,r:20,col:'#ff7a2a'},
  {n:'CANNON',c:3,t:'b',hp:720,d:82,cd:50,rg:62,r:7,col:'#8a8a9a'}];
 const LY=[62,148],RIV=160,TC=['#3a8aff','#ff4a5a'],TCD=['#1a4a9a','#9a1a2a'];
 let ents=[],projs=[],fbs=[],el=0,crowns=[0,0],pl=[],msg='',msgT=0,ot=false,kingF=[0,0];
 const mkTower=(side,kind,lane)=>{const x=kind==='k'?(side?300:20):(side?262:58),y=kind==='k'?105:LY[lane];return{side,x,y,hp:kind==='k'?2600:1500,max:kind==='k'?2600:1500,d:kind==='k'?70:55,cd:kind==='k'?50:48,rg:kind==='k'?62:66,r:kind==='k'?12:9,ha:1,bld:1,tw:kind,lane,act:kind!=='k',atk:0,fl:0};};
 for(const s of[0,1]){ents.push(mkTower(s,'k',-1),mkTower(s,'p',0),mkTower(s,'p',1));}
 for(const s of[0,1]){const deck=shuf([0,1,2,3,4,5,6,7]);pl.push({el:5,hand:deck.slice(0,4),q:deck.slice(4),sel:0,lane:s?1:0,front:1,think:60,plan:null});}
 const tw=(s,kind,lane)=>ents.find(e=>e.side===s&&e.tw===kind&&(kind==='k'||e.lane===lane)&&e.hp>0);
 const laneOf=y=>y<105?0:1;
 const pocket=(s,lane)=>!tw(1-s,'p',lane);
 const validDeploy=(s,c,x,y)=>{if(CD[c].t==='s')return y>20&&y<190;if(y<24||y>186)return false;const own=s?x>RIV+12:x<RIV-12;if(own)return s?x<314:x>6;if(pocket(s,laneOf(y))){return s?x>110&&(laneOf(y)===0?y<100:y>110):x<210&&(laneOf(y)===0?y<100:y>110);}return false;};
 const kbSpot=(s,c)=>{const p=pl[s],lane=p.lane,y=LY[lane];if(CD[c].t==='s'){let best=null,bv=0;for(const e of ents)if(e.side!==s&&e.hp>0&&laneOf(e.y)===lane&&!e.tw){let v=0;for(const o of ents)if(o.side!==s&&o.hp>0&&dist(e.x,e.y,o.x,o.y)<20)v+=Math.min(o.hp,330);if(v>bv){bv=v;best=e;}}if(best)return[best.x,best.y];const t=tw(1-s,'p',lane)||tw(1-s,'k');return t?[t.x,t.y]:[s?60:260,y];}
  let x=p.front?(pocket(s,lane)?(s?118:202):(s?174:146)):(s?286:34);if(CD[c].t==='b')x=p.front?(s?222:98):(s?270:50);return[x,p.front||CD[c].t==='b'?y:105+(lane?18:-18)];};
 const deploy=(s,i,x,y)=>{const p=pl[s],c=p.hand[i],cd=CD[c];if(p.el<cd.c){S('lose');return false;}if(!validDeploy(s,c,x,y)){S('lose');return false;}p.el-=cd.c;p.hand[i]=p.q.shift();p.q.push(c);
  if(cd.t==='s'){const k=tw(s,'k');fbs.push({x0:k?k.x:(s?300:20),y0:105,x,y,t:0,s});S('shoot');}
  else if(cd.t==='b'){ents.push({side:s,x,y,hp:cd.hp,max:cd.hp,d:cd.d,cd:cd.cd,rg:cd.rg,r:cd.r,bld:1,cn:1,atk:0,fl:0,dec:cd.hp/1800,ang:s?3.14:0,dep:30});S('hit');}
  else for(let j=0;j<cd.k;j++){const a=j/cd.k*6.28;ents.push({side:s,ty:c,x:x+(cd.k>1?Math.cos(a)*7:0),y:y+(cd.k>1?Math.sin(a)*7:0),hp:cd.hp,max:cd.hp,d:cd.d,cd:cd.cd,rg:cd.rg,sp:cd.sp,r:cd.r,air:cd.air,ha:cd.ha,bo:cd.bo,atk:0,fl:0,tg:null,st:rnd(6),dep:30,lane:laneOf(y)});}
  if(cd.t==='u')S('hit');A.burst(x,y,TC[s],8,1.2);return true;};
 const canHit=(a,b)=>b.hp>0&&b.side!==a.side&&(!b.air||a.ha)&&(!a.bo||b.bld);
 const hurt=(e,d)=>{if(e.hp<=0)return;e.hp-=d;e.fl=6;if(e.tw==='k'&&!e.act){e.act=1;}if(e.hp<=0){A.burst(e.x,e.y,e.bld?'#c8b8a0':TC[e.side],e.tw?30:8,e.tw?2.5:1.2);if(e.tw){S('boom');A.shake=10;const o=1-e.side;crowns[o]+=e.tw==='k'?3-crowns[o]:1;crowns[o]=Math.min(3,crowns[o]);msg=(o===0?A.nm(0):A.nm(1))+(e.tw==='k'?' TAKES THE KING!':' TAKES A TOWER!');msgT=100;const k=tw(e.side,'k');if(k)k.act=1;}}};
 const nearestT=(u)=>{let best=null,bd=1e9;const sight=u.bld?u.rg+u.r:70;for(const e of ents){if(!canHit(u,e))continue;const d=dist(u.x,u.y,e.x,e.y)-e.r;if(e.bld&&!e.cn&&!u.bld&&d>sight)continue;if(!e.bld&&d>sight)continue;if(u.bld&&d>sight)continue;if(e.cn&&d>sight)continue;if(d<bd){bd=d;best=e;}}if(!best&&!u.bld){const t=tw(1-u.side,'p',u.lane)||tw(1-u.side,'k');best=t;}return best;};
 const step=u=>{if(u.dep){u.dep--;return;}if(u.atk>0)u.atk--;if(u.fl)u.fl--;if(u.bld&&!u.tw){u.hp-=u.dec;if(u.hp<=0){A.burst(u.x,u.y,'#8a8a9a',8,1);return;}}
  if(u.tw==='k'&&!u.act)return;
  if(!u.tg||u.tg.hp<=0||A.t%12===0)u.tg=nearestT(u);const t=u.tg;if(!t)return;const d=dist(u.x,u.y,t.x,t.y)-t.r-u.r;
  if(d<=u.rg){if(u.cn)u.ang=Math.atan2(t.y-u.y,t.x-u.x);if(u.atk<=0){u.atk=u.cd;u.sw=10;if(u.rg>20)projs.push({x:u.x,y:u.y-(u.tw?14:4),t,d:u.d,col:u.tw||u.cn?'#ffe08a':TC[u.side],sp:u.cn?4:3.2,big:u.cn||u.tw});else{hurt(t,u.d);if(!A.silent&&t.tw)A.burst(t.x,t.y-4,'#fff3d6',3,1);}}return;}
  if(u.bld)return;
  let tx=t.x,ty=t.y;const cross=!u.air&&((u.x<RIV-10&&tx>RIV-10)||(u.x>RIV+10&&tx<RIV+10));if(cross){const ly=LY[u.lane];if(Math.abs(u.y-ly)>3||Math.abs(u.x-RIV)>14){tx=u.x<RIV?RIV-12:RIV+12;ty=ly;if(Math.abs(u.x-tx)<3&&Math.abs(u.y-ly)<4)tx=u.x<RIV?RIV+14:RIV-14;}}
  if(!u.air&&Math.abs(u.x-RIV)<12)ty=LY[u.lane];
  const dd=dist(u.x,u.y,tx,ty)||1;u.x+=(tx-u.x)/dd*u.sp;u.y+=(ty-u.y)/dd*u.sp;u.st+=.25;u.f=tx>u.x?1:-1;};
 const rnUp=()=>{for(const u of ents)if(u.hp>0)step(u);
  // separation
  const us=ents.filter(e=>!e.bld&&e.hp>0);for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++){const a=us[i],b=us[j];if(!!a.air!==!!b.air)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;if(d>0&&d<m){const p=(m-d)/2/d;a.x-=dx*p;a.y-=dy*p;b.x+=dx*p;b.y+=dy*p;}}
  for(const u of us){u.y=cl(u.y,22,188);u.x=cl(u.x,4,316);if(!u.air&&Math.abs(u.x-RIV)<11&&Math.abs(u.y-LY[u.lane])>9){u.x=u.x<RIV?RIV-11:RIV+11;}}
  for(const p of projs){const t=p.t,d=dist(p.x,p.y,t.x,t.y);if(t.hp<=0){p.dead=1;continue;}if(d<p.sp+2){hurt(t,p.d);p.dead=1;}else{p.x+=(t.x-p.x)/d*p.sp;p.y+=(t.y-p.y)/d*p.sp;}}projs=projs.filter(p=>!p.dead);
  for(const f of fbs){f.t+=.04;if(f.t>=1){f.dead=1;S('boom');A.shake=6;A.burst(f.x,f.y,'#ff9a3a',24,2.5);for(const e of ents)if(e.side!==f.s&&e.hp>0&&dist(e.x,e.y,f.x,f.y)<20+e.r){hurt(e,e.tw?330*.35|0:330);if(!e.bld){const a=Math.atan2(e.y-f.y,e.x-f.x);e.x+=Math.cos(a)*8;e.y+=Math.sin(a)*8;}}}}fbs=fbs.filter(f=>!f.dead);
  ents=ents.filter(e=>e.hp>0||e.tw);};
 // CPU brain
 const cpuThink=s=>{const p=pl[s];if(--p.think>0)return;p.think=(A.lvl===0?70:A.lvl===1?42:24)+ri(20);const opp=1-s,mine=x=>s?x>RIV-30:x<RIV+30;
  const threat=[0,0],air=[0,0],tank=[0,0],swarm=[0,0];for(const e of ents)if(e.side===opp&&e.hp>0&&!e.tw&&mine(e.x)){const l=laneOf(e.y);threat[l]+=e.hp;if(e.air)air[l]++;if(e.hp>1200)tank[l]=1;if(e.max<200)swarm[l]++;}
  const has=c=>p.hand.indexOf(c)>=0&&p.el>=CD[c].c;const play=(c,x,y)=>{const i=p.hand.indexOf(c);if(i<0)return false;return deploy(s,i,x,y);};
  const L_=threat[0]>threat[1]?0:1;const mx=x=>s?x:320-x;
  if(threat[L_]>250){const y=LY[L_];let tgtE=null,bv=0;for(const e of ents)if(e.side===opp&&e.hp>0&&!e.tw&&laneOf(e.y)===L_&&mine(e.x)){let v=0;for(const o of ents)if(o.side===opp&&o.hp>0&&!o.tw&&dist(e.x,e.y,o.x,o.y)<20)v++;if(v>bv){bv=v;tgtE=e;}}
   if(A.ai<.6&&rnd(1)<.35)return;
   if(bv>=3&&has(6)&&tgtE){play(6,tgtE.x,tgtE.y);return;}
   if(air[L_]&&(has(1)||has(5)||has(4))){play(has(5)?5:has(1)?1:4,mx(262),y+(L_?-14:14));return;}
   if(tank[L_]){if(has(7)){play(7,mx(220),y);return;}if(has(3)){play(3,tgtE?tgtE.x+(s?12:-12):mx(240),y);return;}if(has(0)){play(0,mx(232),y);return;}}
   if(swarm[L_]>=2&&has(1)){play(1,mx(262),y);return;}
   for(const c of[0,5,1,3,4])if(has(c)){play(c,mx(238),y);return;}return;}
  // offense
  const thr=A.lvl===2?7:A.lvl===1?8:9.5;if(p.el<thr)return;const ln=(()=>{const a=tw(opp,'p',0),b=tw(opp,'p',1);if(!a)return 0;if(!b)return 1;return a.hp<b.hp?0:1;})();const y=LY[ln];
  const lead=ents.find(e=>e.side===s&&!e.bld&&e.hp>0&&laneOf(e.y)===ln&&(s?e.x<RIV+40:e.x>RIV-40));
  if(!lead){if(has(2)){play(2,mx(276),y);return;}if(has(0)){play(0,mx(238),y);return;}}else{for(const c of[1,5,3,4,0])if(has(c)){play(c,s?Math.max(lead.x+14,172):Math.min(lead.x-14,148),y);return;}}
  for(const c of[3,4,1,0])if(has(c)){play(c,mx(250),y);return;}};
 const human=s=>s===0||A.two;
 const input=s=>{const p=pl[s],h=A.hit(s);if(h.l){p.sel=(p.sel+3)%4;S('blip');}if(h.r){p.sel=(p.sel+1)%4;S('blip');}if(h.u&&p.lane){p.lane=0;S('blip');}if(h.d&&!p.lane){p.lane=1;S('blip');}if(h.b){p.front^=1;S('blip');}
  if(s===0&&mClick()){const mx=A.mouse.x,my=A.mouse.y;if(my>=194){for(let i=0;i<4;i++)if(mx>=4+i*37&&mx<4+i*37+35){p.sel=i;S('blip');}return;}deploy(0,p.sel,mx,my);return;}
  if(h.a){const[x,y]=kbSpot(s,p.hand[p.sel]);deploy(s,p.sel,x,y);}};
 const finish=w=>{g.over=w<0?'DRAW - TOWERS EVEN':A.win(w);};
 const minHp=s=>{let m=1;for(const e of ents)if(e.side===s&&e.tw&&e.hp>0)m=Math.min(m,e.hp/e.max);for(const e of ents)if(e.side===s&&e.tw&&e.hp<=0)m=0;return m;};
 const decide=()=>{if(crowns[0]!==crowns[1])return crowns[0]>crowns[1]?0:1;const a=minHp(0),b=minHp(1);return Math.abs(a-b)<.001?-1:a>b?0:1;};
 g.timeUp=()=>{const w=decide();return w<0?'TIME UP - DRAW':w===0?'TIME UP - P1 WINS':'TIME UP - '+(A.cpu?'CPU':'P2')+' WINS';};
 g.update=()=>{el++;if(msgT)msgT--;const dbl=el>=5400,rate=dbl?84:168;
  for(const p of pl)p.el=Math.min(10,p.el+1/rate*(ot?1.5:1));
  if(el===5400){msg='DOUBLE ELIXIR!';msgT=100;S('score');}
  input(0);if(A.two)input(1);else cpuThink(1);
  rnUp();
  if(crowns[0]>=3||crowns[1]>=3){finish(crowns[0]>=3?0:1);return;}
  if(el===9000){if(crowns[0]!==crowns[1]){finish(crowns[0]>crowns[1]?0:1);return;}ot=true;msg='OVERTIME! NEXT CROWN WINS';msgT=120;S('win');}
  if(ot&&crowns[0]!==crowns[1]){finish(crowns[0]>crowns[1]?0:1);return;}
  if(el>=12600){finish(decide());return;}
  g.score=crowns[0];};
 // ---------- drawing ----------
 const drawUnit=(ty,x,y,side,f,st,sc,sw)=>{sc=sc||1;const c=TC[side];
  if(ty===4){const fl=Math.sin(st*2)*3*sc;C(x,y-10*sc,3*sc,'#3a2a5a');A.poly([[x-1,y-10*sc],[x-8*sc,y-12*sc-fl],[x-5*sc,y-7*sc]],'#6a4a9a',1);A.poly([[x+1,y-10*sc],[x+8*sc,y-12*sc-fl],[x+5*sc,y-7*sc]],'#6a4a9a',1);R(x-1,y-11*sc,1,1,c);R(x+1,y-11*sc,1,1,c);A.c.fillStyle='rgba(0,0,0,.2)';A.c.fillRect(x-3,y-1,6,2);return;}
  const o={c:c,st,d:f||1,s:.5*sc};if(ty===0){o.cap='#c0c8d8';o.pants='#5a5a6a';}if(ty===1){o.cap='#3a8a3a';o.s=.42*sc;}if(ty===2){o.s=.95*sc;o.pants='#6a4a2a';o.skin='#e0a070';}if(ty===3){o.s=.36*sc;o.skin='#70d040';o.hair='#2a4a1a';}if(ty===5){o.cap='#8a4ac0';o.s=.48*sc;}
  if(sw)o.arm2=-1.6*(f||1);A.person(x,y,o);
  if(ty===0){const ar=sw?-1.2:.2;L(x+3*(f||1)*sc,y-11*sc,x+(3+Math.cos(ar)*8)*(f||1)*sc,y-11*sc+Math.sin(ar)*8*sc,'#e8e8f0',1.2);}
  if(ty===1){A.c.strokeStyle='#8a5a2a';A.c.lineWidth=1;A.c.beginPath();A.c.arc(x+4*(f||1)*sc,y-10*sc,4*sc,-1.3,1.3);A.c.stroke();}
  if(ty===5)L(x,y-10*sc,x+9*(f||1)*sc,y-11*sc,'#3a3a3a',1.5);};
 const drawCannon=(e)=>{C(e.x,e.y,7,'#5a5a6a');C(e.x,e.y,5,'#8a8a9a');L(e.x,e.y,e.x+Math.cos(e.ang)*10,e.y+Math.sin(e.ang)*10,'#2a2a2a',4);R(e.x-6,e.y+4,12,3,TCD[e.side]);};
 const drawTower=e=>{const s=e.side,k=e.tw==='k',w=k?26:18,h=k?30:22,x=e.x-w/2,y=e.y-h+6;if(e.hp<=0){C(e.x,e.y,w/2,'#5a5040');C(e.x-3,e.y-2,w/3,'#7a7060');return;}
  A.c.fillStyle='rgba(0,0,0,.3)';A.c.fillRect(x+3,e.y+3,w,6);R(x,y,w,h,e.fl?'#ffffff':'#9a9aa8');R(x,y,w,5,'#b8b8c8');for(let i=0;i<w;i+=6)R(x+i,y-4,4,4,'#b8b8c8');R(x+2,y+6,w-4,h-10,TCD[s]);R(x+4,y+8,w-8,h-14,TC[s]);
  if(k){const cx=e.x;A.poly([[cx-7,y-5],[cx-7,y-12],[cx-3,y-8],[cx,y-14],[cx+3,y-8],[cx+7,y-12],[cx+7,y-5]],e.act?K.y:'#8a7a3a',1);}else{C(e.x,y+2,3,K.y);}
  const bw=w+6;R(e.x-bw/2,y-(k?20:10),bw,3,'#1a1a1a');R(e.x-bw/2,y-(k?20:10),bw*Math.max(0,e.hp)/e.max,3,s?'#ff6a6a':'#6ac0ff');};
 const card=(c,x,y,on,can,face)=>{box(x,y-(on?3:0),35,36,face?(on?'#3a2a78':'#241a4a'):'#2a1a3a',on?K.y:'#4a3a8a');if(!face){T('?',x+17,y+14,'#6a5a9a',2,'c');return;}const cd=CD[c];
  if(cd.t==='u')drawUnit(c,x+17,y+(c===2?28:25)-(on?3:0),0,1,0,c===2?.6:1.4);else if(cd.t==='s'){C(x+17,y+14-(on?3:0),7,'#ff7a2a');C(x+15,y+12-(on?3:0),4,'#ffd060');}else drawCannon({x:x+17,y:y+16-(on?3:0),ang:-.6,side:0});
  T(cd.n.slice(0,8),x+17,y+29-(on?3:0),K.w,1,'c');C(x+5,y+5-(on?3:0),5,'#c040e0');T(''+cd.c,x+5,y+3-(on?3:0),K.w,1,'c');if(!can){GA(.55);R(x,y-(on?3:0),35,36,'#000000');GA(1);}};
 g.draw=()=>{
  const cx_=A.c;cx_.fillStyle='#4ea44c';cx_.fillRect(0,18,320,174);cx_.fillStyle='#56ae54';for(let yy=18;yy<192;yy+=12)for(let xx=((yy-18)/12)%2*16;xx<320;xx+=32)cx_.fillRect(xx,yy,16,12);cx_.fillStyle='rgba(30,80,30,.35)';for(let i=0;i<60;i++){const gx=(i*73)%320,gy=22+(i*41)%166;cx_.fillRect(gx,gy,1,2);}
  R(0,18,320,1,'#2a6a2a');R(RIV-10,18,20,174,'#2a7ad0');for(let yy=20;yy<190;yy+=8)R(RIV-6+Math.sin((yy+A.t)*.1)*3,yy,4,1,'#8ac8ff');
  for(const ly of LY){R(RIV-14,ly-9,28,18,'#9a6a3a');for(let i=0;i<28;i+=5)R(RIV-14+i,ly-9,1,18,'#6a4a2a');R(RIV-14,ly-9,28,2,'#c08a50');}
  for(const ly of LY){A.c.fillStyle='rgba(255,255,255,.07)';A.c.fillRect(0,ly-6,320,12);}
  // deploy marker
  const p0=pl[0];const c0=p0.hand[p0.sel];let mk=null;if(A.mouse.t>0&&A.mouse.y<192)mk=[A.mouse.x,A.mouse.y,validDeploy(0,c0,A.mouse.x,A.mouse.y)];else{const[x,y]=kbSpot(0,c0);mk=[x,y,true];}
  if(mk){GA(.35+.15*Math.sin(A.t*.2));C(mk[0],mk[1],CD[c0].t==='s'?20:8,mk[2]?'#ffffff':'#ff3030');GA(1);A.ring(mk[0],mk[1],CD[c0].t==='s'?20:9,mk[2]?K.w:K.r);}
  if(A.two){const p1=pl[1],c1=p1.hand[p1.sel];const[x,y]=kbSpot(1,c1);GA(.3);C(x,y,CD[c1].t==='s'?20:8,'#ff8a8a');GA(1);}
  const ds=ents.slice().sort((a,b)=>(a.air?1000:0)+a.y-((b.air?1000:0)+b.y));
  for(const e of ds){if(e.tw)drawTower(e);else if(e.cn)drawCannon(e);else{if(e.dep){GA(.5);}drawUnit(e.ty,e.x,e.y+(e.air?-6:0),e.side,e.f||(e.side?-1:1),e.st,1,e.atk>e.cd-10);GA(1);if(e.fl){GA(.5);C(e.x,e.y-6,e.r+1,'#ffffff');GA(1);}}
   if(!e.tw&&e.hp<e.max){R(e.x-6,e.y-(e.ty===2?34:e.air?22:20),12,2,'#1a1a1a');R(e.x-6,e.y-(e.ty===2?34:e.air?22:20),12*e.hp/e.max,2,e.side?'#ff6a6a':'#6ac0ff');}}
  for(const pr of projs){if(pr.big)C(pr.x,pr.y,2,'#ffd060');else L(pr.x-2,pr.y,pr.x+2,pr.y,pr.col,1.5);}
  for(const f of fbs){const x=f.x0+(f.x-f.x0)*f.t,y=f.y0+(f.y-f.y0)*f.t-Math.sin(f.t*3.14)*40;C(x,y,6,'#ff7a2a');C(x-1,y-1,3,'#ffe08a');GA(.3);C(f.x,f.y,20,'#ff3000');GA(1);}
  // HUD
  R(0,0,320,18,'#1a1238');const sec=Math.max(0,((ot?12600:9000)-el)/60|0);T((ot?'OT ':'')+(sec/60|0)+':'+String(sec%60).padStart(2,'0'),160,4,ot?K.r:el>=5400?K.p:K.w,2,'c');
  for(let i=0;i<3;i++){C(16+i*14,9,5,i<crowns[0]?K.y:'#3a2a5a');C(304-i*14,9,5,i<crowns[1]?K.y:'#3a2a5a');}T(A.nm(0),60,6,K.c,1);T('NEXT '+CD[pl[0].q[0]].n,76,6,K.gr,1);T(A.nm(1),260,6,K.p,1,'r');if(el>=5400)T('X2',206,6,K.p,1);
  R(0,192,320,48,'#140c2c');
  for(let s=0;s<2;s++){const p=pl[s],ox=s?164:4,face=s===0||A.two;for(let i=0;i<4;i++)card(p.hand[i],ox+i*37,198,face&&p.sel===i,p.el>=CD[p.hand[i]].c,face);
   R(ox,233,150,6,'#2a1a3a');R(ox,233,150*p.el/10,6,'#d040f0');for(let i=1;i<10;i++)R(ox+i*15,233,1,6,'#140c2c');T(''+Math.floor(p.el),ox+3,234,K.w,1);}
  if(msgT)T(msg,160,30,K.y,1,'c');};
 return g;}});

/* ---- PIXEL FARM: seasons, crops, animals, fishing, townsfolk and a community goal ---- */
A.add({id:'pixelfarm',name:'PIXEL FARM',cat:'SIM',time:600,tags:'stardew valley harvest moon farming sim',how:'ARROWS WALK, A USES TOOL/TALKS, B SWAPS SLOT. GROW, FISH, SHIP, FILL THE TOWN BUNDLES.',make(){
 const g={over:null,score:0},TS=16,MW=40,MH=26,DAY=2160;
 const M=[];for(let y=0;y<MH;y++){M.push([]);for(let x=0;x<MW;x++)M[y].push(x===0||y===0||x===MW-1||y===MH-1?'T':'.');}
 const fill=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)M[j][i]=c;};
 fill(22,0,2,MH,'W');fill(22,11,2,2,'b');fill(3,1,4,3,'H');M[3][5]='D';fill(9,1,4,3,'C');M[3][11]='c';M[4][8]='B';fill(2,7,14,8,'f');fill(3,18,6,4,'W');
 fill(31,1,6,3,'S');M[3][33]='s';fill(26,1,4,3,'h');fill(32,15,4,3,'h');fill(26,18,4,3,'h');M[9][30]='N';
 fill(5,4,1,2,'=');fill(5,5,11,1,'=');fill(16,11,6,2,'=');fill(24,11,15,2,'=');fill(30,4,1,7,'=');fill(33,4,1,1,'=');fill(30,4,4,1,'=');fill(28,4,1,1,'=');fill(28,4,3,1,'=');fill(34,13,1,6,'=');fill(28,13,1,5,'=');
 for(const[x,y]of[[17,3],[19,9],[12,17],[15,20],[18,23],[2,23],[10,23],[25,7],[37,8],[36,21],[38,13],[25,15],[20,16],[13,22],[30,23],[37,4]])M[y][x]='T';
 for(let i=0;i<40;i++){const x=1+ri(20),y=16+ri(9);if(M[y][x]==='.')M[y][x]=',';}
 const SOL='TWHDCcBSshNR';const solid=(x,y)=>{const tx=Math.floor(x/TS),ty=Math.floor(y/TS);if(tx<0||ty<0||tx>=MW||ty>=MH)return true;return SOL.indexOf(M[ty][tx])>=0;};
 const SEA=['SPRING','SUMMER','FALL','WINTER'],GRASS=['#5cb85a','#4aa448','#b89a4a','#dfe8f2'];
 const CROPS={TURNIP:{s:0,c:20,d:2,v:45,col:'#f0e0f0'},POTATO:{s:0,c:35,d:3,v:80,col:'#c8a060'},BEAN:{s:0,c:60,d:3,v:35,re:2,col:'#60c040'},TOMATO:{s:1,c:50,d:3,v:42,re:2,col:'#ff4030'},CORN:{s:1,c:40,d:3,v:90,col:'#ffd040'},MELON:{s:1,c:90,d:3,v:220,col:'#70d070'},YAM:{s:2,c:40,d:2,v:85,col:'#c05a8a'},PUMPKIN:{s:2,c:100,d:3,v:260,col:'#ff8a20'},GRAPE:{s:2,c:70,d:3,v:45,re:2,col:'#8a4ad0'}};
 const FISH={CARP:{v:30,dif:.6},BASS:{v:60,dif:1},TROUT:{v:80,dif:1.3},CATFISH:{v:120,dif:1.7},GOLDFIN:{v:500,dif:2.3}};
 const VAL=n=>CROPS[n]?CROPS[n].v:FISH[n]?FISH[n].v:n==='EGG'?50:n==='MILK'?125:10;
 const BUN=[['SPRING CROPS',['TURNIP','POTATO','BEAN']],['SUMMER CROPS',['TOMATO','CORN','MELON']],['FALL CROPS',['YAM','PUMPKIN','GRAPE']],['RIVER FISH',['CARP','BASS','TROUT']],['ANIMAL GOODS',['EGG','EGG','MILK']]];
 const don=BUN.map(b=>b[1].map(()=>false));
 const NPCS=[{n:'MAYA',c:'#e05a9a',hair:'#8a2a1a',love:['MELON','PUMPKIN'],like:['TURNIP','GRAPE','BEAN'],hate:['CARP'],lines:['THE TOWN WAS LIVELIER ONCE.','HAVE YOU SEEN THE BOARD BY THE PATH?','I LOVE A SWEET MELON.']},
  {n:'OTTO',c:'#4a8ad0',hair:'#5a5a5a',love:['CATFISH','TROUT','GOLDFIN'],like:['BASS','CARP','CORN'],hate:['TURNIP'],lines:['THE RIVER BITES BEST AT DAWN.','WATCH THE FISH, NOT THE BAR.','A GOLDFIN? ONLY IN LEGENDS...']},
  {n:'JUNE',c:'#e0b030',hair:'#2a1a10',love:['MILK','TOMATO'],like:['EGG','POTATO','YAM'],hate:['BASS'],lines:['MY BAKERY NEEDS FRESH EGGS.','PET YOUR ANIMALS EVERY DAY!','THE SHOP RESTOCKS EACH SEASON.']}];
 NPCS.forEach((n,i)=>{n.x=(27+i*4)*TS;n.y=(13+i)*TS;n.f=0;n.vx=0;n.vy=0;n.wt=0;n.pts=0;n.talk=false;n.gift=false;n.rew=false;n.st=0;});
 const soil={};const sk=(x,y)=>x+','+y;
 let px=7*TS,py=6*TS+8,face=[0,1],st=0,day=1,tick=0,gold=500,earned=0,energy=100,emax=100,water=20,wmax=20,inv={},seeds={TURNIP:6},sel='HOE',shipped=[],rain=false,
  upg={hoe:0,can:0,rod:0},animals=[],basket={EGG:0,MILK:0},msg='',msgT=0,shop=null,board=0,fish=null,fade=0,pts=0,pop=[];
 const say=(m,t)=>{msg=m;msgT=t||120;};
 const slots=()=>{const s=['HOE','CAN','ROD'];for(const k in seeds)if(seeds[k]>0)s.push('S:'+k);for(const k in inv)if(inv[k]>0)s.push('I:'+k);return s;};
 const addI=(n,c)=>{inv[n]=(inv[n]||0)+(c||1);};const useI=n=>{inv[n]--;if(inv[n]<=0){delete inv[n];if(sel==='I:'+n)sel='HOE';}};
 const season=()=>((day-1)/4|0)%4;
 const addPts=n=>{pts+=n;};
 const newDay=(passed)=>{fade=50;let pay=0;for(const n of shipped)pay+=VAL(n);shipped=[];gold+=pay;earned+=pay;if(passed){const l=Math.min(100,gold*.1|0);gold-=l;say('YOU PASSED OUT. LOST '+l+'G. EARNED '+pay+'G',180);}else say('DAY '+(day+1)+'. SHIPPING PAID '+pay+'G',150);
  const os=season();day++;const ns=season();
  for(const k in soil){const s=soil[k];if(s.c){const cd=CROPS[s.c.k];if(os!==ns&&cd.s!==ns){s.c.dead=1;}else if(s.w&&!s.c.dead&&s.c.age<cd.d)s.c.age++;}s.w=false;if(!s.c&&rnd(1)<.08)delete soil[k];}
  rain=ns!==3&&rnd(1)<.2;if(rain)for(const k in soil)soil[k].w=true;
  for(const a of animals){if(a.pet||rnd(1)<.5)basket[a.k==='COW'?'MILK':'EGG']++;a.pet=false;}
  for(const n of NPCS){n.talk=false;n.gift=false;}
  energy=emax;tick=0;px=5*TS+8;py=4*TS+10;face=[0,1];if(os!==ns)say('WELCOME TO '+SEA[ns]+'! NEW SEEDS IN THE SHOP.',200);};
 const front=()=>[Math.floor((px+face[0]*13)/TS),Math.floor((py-4+face[1]*13)/TS)];
 const npcAt=(wx,wy)=>NPCS.find(n=>Math.abs(n.x-wx)<14&&Math.abs(n.y-wy)<16);
 const aniAt=(wx,wy)=>animals.find(a=>Math.abs(a.x-wx)<14&&Math.abs(a.y-wy)<14);
 const hearts=n=>Math.min(5,n.pts/100|0);
 const giveTo=(n,item)=>{if(n.gift){say(n.n+': YOU ALREADY GAVE ME SOMETHING TODAY.');return;}n.gift=true;useI(item);let d=20,r='THANKS.';if(n.love.includes(item)){d=80;r='I LOVE THIS!';}else if(n.like.includes(item)){d=45;r='OH, NICE!';}else if(n.hate.includes(item)){d=-20;r='UM... NO THANKS.';}n.pts=Math.max(0,n.pts+d);say(n.n+': '+r+(d>0?' +'+d:''),120);S(d>0?'coin':'lose');addPts(Math.max(0,d/10|0));checkRew(n);};
 const checkRew=n=>{if(!n.rew&&hearts(n)>=3){n.rew=true;gold+=300;earned+=300;say(n.n+' SENT YOU A GIFT: 300G! (3 HEARTS)',200);S('win');}};
 const shopList=()=>{const s=season(),L=[];for(const k in CROPS)if(CROPS[k].s===s)L.push({n:k+' SEEDS',p:CROPS[k].c,f:()=>{seeds[k]=(seeds[k]||0)+5;},q:5});L.push({n:'CHICKEN',p:400,f:()=>animals.push({k:'CHICKEN',x:(14+ri(5))*TS,y:(2+ri(3))*TS,pet:false,vx:0,vy:0,t:0}),ok:()=>animals.filter(a=>a.k==='CHICKEN').length<4});L.push({n:'COW',p:900,f:()=>animals.push({k:'COW',x:(14+ri(5))*TS,y:(2+ri(3))*TS,pet:false,vx:0,vy:0,t:0}),ok:()=>animals.filter(a=>a.k==='COW').length<2});
  L.push({n:'STEEL HOE',p:500,f:()=>upg.hoe=1,ok:()=>!upg.hoe});L.push({n:'BIG CAN',p:450,f:()=>{upg.can=1;wmax=40;water=40;},ok:()=>!upg.can});L.push({n:'FIBER ROD',p:400,f:()=>upg.rod=1,ok:()=>!upg.rod});L.push({n:'ENERGY TONIC',p:120,f:()=>{energy=Math.min(emax,energy+50);}});return L;};
 const interact=()=>{const[tx,ty]=front(),t=(M[ty]||[])[tx],wx=tx*TS+8,wy=ty*TS+8;
  const n=npcAt(px+face[0]*14,py-6+face[1]*14);if(n){if(sel.startsWith('I:')){giveTo(n,sel.slice(2));return true;}if(!n.talk){n.talk=true;n.pts+=20;addPts(2);checkRew(n);}say(n.n+': '+n.lines[(day+NPCS.indexOf(n))%3]+'  '+'<3'.repeat(hearts(n)),150);S('blip');return true;}
  const an=aniAt(px+face[0]*14,py-4+face[1]*14);if(an){if(!an.pet){an.pet=true;addPts(3);S('coin');A.burst(an.x,an.y-10,K.p,6,1);}say('THE '+an.k+' LOOKS HAPPY.',60);return true;}
  if(t==='D'){newDay(false);S('win');return true;}
  if(t==='B'){if(sel.startsWith('I:')){const it=sel.slice(2),c=inv[it];for(let i=0;i<c;i++)shipped.push(it);delete inv[it];sel='HOE';say('SHIPPED '+c+' '+it+'. PAID OVERNIGHT.');S('coin');addPts(c);}else say('SELECT AN ITEM SLOT (B) TO SHIP IT.');return true;}
  if(t==='s'){shop={i:0,L:shopList()};S('blip');return true;}
  if(t==='c'){const e=basket.EGG,m=basket.MILK;if(e+m){addI('EGG',e);if(!e)delete inv.EGG;addI('MILK',m);if(!m)delete inv.MILK;basket={EGG:0,MILK:0};say('COLLECTED '+e+' EGG, '+m+' MILK.');S('coin');addPts(e+m);}else say(animals.length?'NO PRODUCTS YET. PET YOUR ANIMALS DAILY.':'THE COOP IS EMPTY. BUY ANIMALS AT THE SHOP.');return true;}
  if(t==='N'){if(sel.startsWith('I:')){const it=sel.slice(2);for(let b=0;b<BUN.length;b++){const j=BUN[b][1].findIndex((x,jj)=>x===it&&!don[b][jj]);if(j>=0){don[b][j]=true;useI(it);addPts(40);S('win');A.burst(wx,wy,K.y,20,2);say('DONATED '+it+' TO '+BUN[b][0]+'!');if(don[b].every(v=>v)){say(BUN[b][0]+' BUNDLE COMPLETE! +500G',200);gold+=500;earned+=500;}if(don.every(d=>d.every(v=>v)))g.over='COMMUNITY COMPLETE!';return true;}}say('THE BOARD DOES NOT NEED '+it+'.');}board=200;S('blip');return true;}
  const s=soil[sk(tx,ty)];if(s&&s.c&&!s.c.dead&&s.c.age>=CROPS[s.c.k].d){const cd=CROPS[s.c.k];addI(s.c.k);addPts(5);S('coin');A.burst(wx,wy,cd.col,10,1.5);if(cd.re){s.c.age=cd.d-cd.re;}else s.c=null;return true;}
  if(s&&s.c&&s.c.dead){s.c=null;addPts(1);S('hit');return true;}
  return false;};
 const useTool=()=>{const[tx,ty]=front(),t=(M[ty]||[])[tx];const line=n=>{const r=[];for(let i=0;i<n;i++)r.push([tx+face[0]*i,ty+face[1]*i]);return r;};
  if(sel==='HOE'){if(energy<2){say('TOO TIRED. SLEEP AT THE HOUSE DOOR.');return;}let did=0;for(const[x,y]of line(upg.hoe?3:1))if(M[y]&&M[y][x]==='f'&&!soil[sk(x,y)]){soil[sk(x,y)]={w:rain,c:null};did++;}if(did){energy-=2;addPts(did);S('hit');A.burst(tx*TS+8,ty*TS+8,'#8a5a2a',6,1);}else S('blip');}
  else if(sel==='CAN'){if(t==='W'){water=wmax;say('CAN REFILLED.',50);S('coin');return;}if(water<=0){say('CAN IS EMPTY. REFILL AT WATER.');return;}if(energy<1){say('TOO TIRED.');return;}let did=0;for(const[x,y]of line(upg.can?3:1)){const s=soil[sk(x,y)];if(s&&!s.w&&water>0){s.w=true;water--;did++;}}if(did){energy-=1;addPts(did);S('blip');A.burst(tx*TS+8,ty*TS+8,'#6ac0ff',8,1);}}
  else if(sel==='ROD'){if(t==='W'){if(energy<3){say('TOO TIRED TO FISH.');return;}energy-=3;fish={ph:'wait',t:60+ri(180),x:tx*TS+8,y:ty*TS+8,pond:tx<20};S('jump');}else say('FACE THE WATER TO CAST.',60);}
  else if(sel.startsWith('S:')){const k=sel.slice(2),s=soil[sk(tx,ty)];if(!s){say('TILL THE FIELD WITH THE HOE FIRST.',80);return;}if(s.c){return;}if(CROPS[k].s!==season()){say(k+' WILL NOT GROW IN '+SEA[season()]+'.');return;}s.c={k,age:0};seeds[k]--;if(seeds[k]<=0){delete seeds[k];sel='HOE';}addPts(2);S('hit');}
  else if(sel.startsWith('I:'))say('GIVE IT TO A NEIGHBOUR, SHIP IT OR DONATE IT.',80);};
 const fishPick=pond=>{const s=season(),r=rnd(1);if(!pond&&r<.03&&s!==3)return'GOLDFIN';if(r<.12)return pond?'CATFISH':'TROUT';if(r<.4)return pond?'BASS':(s===1?'BASS':'TROUT');return'CARP';};
 g.dbg={set:o=>{if(o.px)px=o.px;if(o.py)py=o.py;if(o.face)face=o.face;if(o.sel)sel=o.sel;if(o.gold)gold=o.gold;if(o.day){day=o.day;}if(o.tick)tick=o.tick;},soil,inv,seeds};
 say('TILL THE FIELD (A), PLANT, WATER. SLEEP AT THE HOUSE DOOR.',260);
 g.update=()=>{const k=A.in(0),h=A.hit(0);if(msgT)msgT--;if(fade)fade--;if(board)board--;
  pop.forEach(p=>p.t--);pop=pop.filter(p=>p.t>0);
  g.score=earned+pts+don.flat().filter(v=>v).length*100+NPCS.reduce((a,n)=>a+hearts(n)*50,0);
  if(shop){if(h.u)shop.i=(shop.i+shop.L.length-1)%shop.L.length;if(h.d)shop.i=(shop.i+1)%shop.L.length;if(h.b){shop=null;return;}if(h.a){const it=shop.L[shop.i];if(it.ok&&!it.ok()){say('YOU ALREADY HAVE THE MAX.');S('lose');}else if(gold<it.p){say('NOT ENOUGH GOLD.');S('lose');}else{gold-=it.p;it.f();S('coin');say('BOUGHT '+it.n+'.');addPts(3);}}return;}
  if(fish){const f=fish;if(h.b&&f.ph!=='reel'){fish=null;return;}f.t--;
   if(f.ph==='wait'&&f.t<=0){f.ph='bite';f.t=45;S('score');}
   else if(f.ph==='bite'){if(h.a){const kd=fishPick(f.pond);f.ph='reel';f.k=kd;f.dif=FISH[kd].dif;f.fy=50;f.fv=0;f.tg=50;f.by=40;f.bv=0;f.bh=upg.rod?38:28;f.p=.3;}else if(f.t<=0){say('IT GOT AWAY...',60);fish=null;}}
   else if(f.ph==='wait'&&h.a){say('TOO EARLY! WAIT FOR THE !',60);fish=null;}
   else if(f.ph==='reel'){if(A.t%Math.max(10,40-f.dif*12|0)===0||rnd(1)<.01*f.dif)f.tg=rnd(92);f.fv+=(f.tg-f.fy)*.004*f.dif;f.fv*=.9;f.fy=cl(f.fy+f.fv,0,92);
    f.bv+=k.a?-.32:.22;f.bv*=.93;f.by+=f.bv;if(f.by<0){f.by=0;f.bv=0;}if(f.by>100-f.bh){f.by=100-f.bh;f.bv*=-.3;}
    const inb=f.fy+4>f.by&&f.fy+4<f.by+f.bh;f.p+=inb?.008:-.005*(.6+f.dif*.3);if(f.p>=1){addI(f.k);addPts(10+f.dif*8|0);say('CAUGHT A '+f.k+'! (WORTH '+FISH[f.k].v+'G)',120);S('win');A.burst(px,py-20,K.c,16,2);fish=null;}else if(f.p<=0){say('THE '+f.k+' ESCAPED.',80);S('lose');fish=null;}}
   return;}
  tick++;if(tick>=DAY){newDay(true);return;}
  // movement
  const dx=ax(k),dy=ay(k);if(dx||dy){face=dx&&!dy?[dx,0]:!dx&&dy?[0,dy]:(Math.abs(face[0])?[dx,0]:[0,dy]);if(!face[0]&&!face[1])face=[dx,0];st+=.3;}
  const spd=energy>0?1.5:.8;const nx=px+dx*spd,ny=py+dy*spd;const ok=(x,y)=>!solid(x-5,y-6)&&!solid(x+5,y-6)&&!solid(x-5,y)&&!solid(x+5,y);if(ok(nx,py))px=nx;if(ok(px,ny))py=ny;
  if(h.b){const s=slots();let i=s.indexOf(sel);i=(i+(k.d?s.length-1:1))%s.length;sel=s[i];S('blip');}
  if(mClick()&&A.mouse.y>=210){const s=slots(),i0=Math.max(0,Math.min(s.indexOf(sel)-4,s.length-10));const j=i0+Math.floor((A.mouse.x-5)/31);if(s[j]){sel=s[j];S('blip');}}
  else if(h.a){if(!interact())useTool();}
  // npcs
  for(const n of NPCS){if(Math.abs(n.x-px)<24&&Math.abs(n.y-py)<24){n.vx=n.vy=0;n.f=px<n.x?-1:1;continue;}if(--n.wt<=0){n.wt=60+ri(120);const a=ri(5);n.vx=[0,.6,-.6,0,0][a];n.vy=[0,0,0,.6,-.6][a];}const ax_=n.x+n.vx*8,ay_=n.y+n.vy*8;if(ax_<25*TS||ax_>38*TS||ay_<4*TS||ay_>24*TS||solid(ax_,ay_-4)){n.vx=-n.vx;n.vy=-n.vy;}else{n.x+=n.vx;n.y+=n.vy;if(n.vx||n.vy)n.st+=.25;if(n.vx)n.f=n.vx>0?1:-1;}}
  for(const a of animals){if(--a.t<=0){a.t=40+ri(100);const r=ri(5);a.vx=[0,.4,-.4,0,0][r];a.vy=[0,0,0,.4,-.4][r];}a.x=cl(a.x+a.vx,13*TS+8,20*TS-8);a.y=cl(a.y+a.vy,1*TS+12,5*TS);}};
 const icon=(it,x,y)=>{const n=it.replace(/^[SI]:/,'');if(it==='HOE'){L(x-5,y+5,x+4,y-5,'#8a5a2a',2);R(x+1,y-7,6,3,'#b8c0d0');if(upg.hoe)R(x+1,y-7,6,1,K.y);return;}
  if(it==='CAN'){R(x-6,y-3,10,8,upg.can?'#d0b040':'#6a8ab0');L(x+4,y-1,x+8,y-5,'#6a8ab0',2);R(x-4,y-6,6,2,'#4a6a90');R(x-6,y+6,10*water/wmax,1,K.c);return;}
  if(it==='ROD'){L(x-6,y+6,x+6,y-7,upg.rod?'#d0b040':'#8a5a2a',1.5);A.c.strokeStyle='#ffffff';A.c.lineWidth=.5;A.c.beginPath();A.c.moveTo(x+6,y-7);A.c.lineTo(x+6,y+4);A.c.stroke();return;}
  if(it.startsWith('S:')){R(x-5,y-6,10,12,'#e8d8b0');R(x-5,y-6,10,3,CROPS[n].col);C(x,y+2,2,'#6a4a2a');return;}
  if(CROPS[n]){C(x,y+1,5,CROPS[n].col);R(x-1,y-6,2,3,'#3a8a2a');return;}if(FISH[n]){A.c.fillStyle=n==='GOLDFIN'?'#ffd040':n==='CATFISH'?'#7a6a5a':n==='TROUT'?'#e08aa0':n==='BASS'?'#5a9a5a':'#c0a070';A.c.beginPath();A.c.ellipse(x,y,6,3,0,0,6.283);A.c.fill();A.poly([[x+5,y],[x+8,y-3],[x+8,y+3]],A.c.fillStyle,1);R(x-4,y-1,1,1,'#000000');return;}
  if(n==='EGG'){A.c.fillStyle='#fff8e8';A.c.beginPath();A.c.ellipse(x,y,4,5,0,0,6.283);A.c.fill();return;}if(n==='MILK'){R(x-3,y-4,6,10,'#f8f8ff');R(x-2,y-6,4,2,'#4a8ad0');return;}};
 const tree=(x,y,s)=>{R(x+6,y+8,4,8,'#6a4a2a');const c=['#3a9a3a','#2a8a3a','#d8782a','#e8f0f8'][s];C(x+8,y+6,8,c);C(x+5,y+4,4,A.mix(c,'#ffffff',.25));};
 g.draw=()=>{const s=season(),cx=cl(px-160,0,MW*TS-320),cy=cl(py-104,0,MH*TS-208);const tx0=Math.floor(cx/TS),ty0=Math.floor(cy/TS);const c=A.c;
  c.fillStyle=GRASS[s];c.fillRect(0,0,320,208);
  for(let ty=ty0;ty<=ty0+13&&ty<MH;ty++)for(let tx=tx0;tx<=tx0+20&&tx<MW;tx++){const t=M[ty][tx],x=tx*TS-cx,y=ty*TS-cy;
   if(t==='W'){c.fillStyle=s===3?'#a8c8e8':'#3a8ad8';c.fillRect(x,y,TS,TS);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+((tx*7+A.t/8)|0)%14,y+(ty*5)%12+2,3,1);}
   else if(t==='='||t==='b'){c.fillStyle=t==='b'?'#9a6a3a':'#c8b080';c.fillRect(x,y,TS,TS);if(t==='b'){c.fillStyle='#6a4a2a';c.fillRect(x,y+3,TS,1);c.fillRect(x,y+11,TS,1);}}
   else if(t==='f'){c.fillStyle=s===3?'#c8c0b8':'#a8885a';c.fillRect(x,y,TS,TS);c.fillStyle='rgba(0,0,0,.08)';c.fillRect(x,y+15,TS,1);}
   else if(t===','){c.fillStyle=A.mix(GRASS[s],'#000000',.25);c.fillRect(x+3,y+8,1,4);c.fillRect(x+7,y+6,1,6);c.fillRect(x+11,y+9,1,3);}
   const so=soil[tx+','+ty];if(so){R(x+1,y+1,14,14,so.w?'#5a3a1a':'#8a5a30');c.fillStyle='rgba(0,0,0,.15)';c.fillRect(x+2,y+5,12,1);c.fillRect(x+2,y+10,12,1);
    if(so.c){const cd=CROPS[so.c.k],f=so.c.age/cd.d;if(so.c.dead){R(x+6,y+6,4,6,'#6a5a3a');}else if(f>=1){R(x+7,y+4,2,9,'#3a8a2a');C(x+8,y+5,4+(cd.v>200?2:0),cd.col);C(x+6,y+4,1.5,'#ffffff');}else{const hh=3+f*8;R(x+7,y+13-hh,2,hh,'#4aa83a');R(x+4,y+13-hh,3,2,'#5ac04a');R(x+9,y+12-hh,3,2,'#5ac04a');}}}}
  for(let ty=ty0;ty<=ty0+13&&ty<MH;ty++)for(let tx=tx0;tx<=tx0+20&&tx<MW;tx++){const t=M[ty][tx],x=tx*TS-cx,y=ty*TS-cy;if(t==='T')tree(x,y,s);else if(t==='B'){R(x+1,y+3,14,12,'#8a5a2a');R(x,y+2,16,3,'#6a3a1a');}else if(t==='N'){R(x+2,y+2,12,10,'#7a5a3a');R(x+3,y+3,10,8,'#d8c8a0');R(x+4,y+4,4,3,'#ffffff');R(x+9,y+6,3,3,'#f0d080');R(x+7,y+12,2,4,'#5a3a1a');}}
  const bld=(bx,by,w,h,wall,roof,door)=>{const x=bx*TS-cx,y=by*TS-cy;R(x,y+10,w*TS,h*TS-10,wall);A.poly([[x-4,y+12],[x+w*TS/2,y-8],[x+w*TS+4,y+12]],roof,1);R(x+6,y+18,10,8,'#a8d8ff');if(door!==undefined){R(door*TS-cx+3,y+h*TS-14,10,14,'#5a3a1a');R(door*TS-cx+10,y+h*TS-7,1,1,K.y);}};
  bld(3,1,4,3,'#d8b890','#c04a3a',5);bld(9,1,4,3,'#c8a070','#8a3a2a',11);bld(26,1,4,3,'#e0d0b0','#4a6ab0');bld(32,15,4,3,'#d0c0e0','#6a4a9a');bld(26,18,4,3,'#e8d8a0','#3a8a5a');bld(31,1,6,3,'#f0e0c0','#3a7ad8',33);
  {const x=31*TS-cx,y=1*TS-cy;R(x+30,y+14,36,7,'#ffffff');T('SHOP',x+48,y+15,'#3a7ad8',1,'c');}
  // actors sorted by y
  const ac=[];NPCS.forEach(n=>ac.push([n.y,()=>{A.person(n.x-cx,n.y-cy,{c:n.c,hair:n.hair,st:n.st,d:n.f||1,s:.75});if(Math.abs(n.x-px)<40&&Math.abs(n.y-py)<40){T(n.n,n.x-cx,n.y-cy-32,K.w,1,'c');for(let i=0;i<5;i++)C(n.x-cx-8+i*4,n.y-cy-36,1.5,i<hearts(n)?K.r:'#3a2a3a');}}]));
  animals.forEach(a=>ac.push([a.y,()=>{const x=a.x-cx,y=a.y-cy;if(a.k==='COW'){R(x-9,y-12,18,9,'#f8f8f0');R(x-5,y-11,5,4,'#2a2a2a');R(x+8*(a.vx<0?-1:1)-3,y-14,6,6,'#f8f8f0');R(x-8,y-3,2,4,'#5a5a5a');R(x+6,y-3,2,4,'#5a5a5a');}else{C(x,y-5,5,'#fff8f0');C(x+(a.vx<0?-4:4),y-9,3,'#fff8f0');R(x+(a.vx<0?-5:3),y-13,2,2,K.r);R(x+(a.vx<0?-8:6),y-9,2,1,K.o);}if(!a.pet&&A.t%60<30)C(x,y-18,1.5,K.p);}]));
  ac.push([py,()=>{A.person(px-cx,py-cy,{c:'#3a7ad8',pants:'#3a4a7a',cap:'#d8b060',st:(ax(A.in(0))||ay(A.in(0)))?st:0,d:face[0]||1,s:.8,id:2});const[ftx,fty]=front();A.box(ftx*TS-cx,fty*TS-cy,TS,TS,'rgba(255,255,255,.5)');}]);
  ac.sort((a,b)=>a[0]-b[0]).forEach(a=>a[1]());
  if(fish){const f=fish;L(px-cx+6,py-cy-20,f.x-cx,f.y-cy,'#ffffff',.5);C(f.x-cx,f.y-cy+Math.sin(A.t*.2),2,K.r);if(f.ph==='bite')T('!',px-cx,py-cy-40,K.y,3,'c');
   if(f.ph==='reel'){box(240,40,40,110,'#2a1a10','#8a6a3a');R(250,45,14,100,'#3a6aa0');R(250,45+f.by,14,f.bh,'rgba(80,255,120,.55)');R(250,45+f.by,14,f.bh,'#3dff8b');GA(.6);R(251,46+f.by,12,f.bh-2,'#3a6aa0');GA(1);icon('I:'+f.k,257,49+f.fy);R(268,45,6,100,'#1a1a1a');R(268,145-100*f.p,6,100*f.p,f.p<.25?K.r:K.y);T('HOLD A',260,154,K.w,1,'c');}}
  if(rain||s===3){c.fillStyle=s===3?'rgba(255,255,255,.8)':'rgba(170,200,255,.6)';for(let i=0;i<50;i++){const rx=(i*53+A.t*(s===3?1:4))%320,ry=(i*37+A.t*(s===3?1.5:6))%208;c.fillRect(rx,ry,1,s===3?1:4);}}
  const hr=6+tick/DAY*20;if(hr>17){GA(Math.min(.55,(hr-17)*.09));R(0,0,320,208,'#0a0a3a');GA(1);}
  if(fade){GA(fade/50);R(0,0,320,208,'#000000');GA(1);}
  // HUD
  box(2,2,96,26,'rgba(10,8,30,.75)','#8a6a3a');const hh=Math.floor(hr)%24,mm=Math.floor((hr%1)*6)*10;T(SEA[s]+' '+(((day-1)%4)+1),6,6,['#7aff8a','#ffd84a','#ffa04a','#bfe0ff'][s],1);T((hh<10?'0':'')+hh+':'+(mm?mm:'00'),94,6,K.w,1,'r');T('G '+gold,6,16,K.y,1);T('DAY '+day,94,16,K.gr,1,'r');
  box(230,2,88,12,'rgba(10,8,30,.75)','#8a6a3a');R(250,5,64,6,'#3a2a2a');R(250,5,64*energy/emax,6,energy<20?K.r:K.g);T('EN',234,5,K.w,1);if(rain)T('RAIN',316,18,'#9ac8ff',1,'r');
  R(0,208,320,32,'#2a1a10');R(0,208,320,2,'#8a6a3a');const sl=slots(),si=sl.indexOf(sel),i0=Math.max(0,Math.min(si-4,sl.length-10));for(let i=0;i<10;i++){const it=sl[i0+i];const x=5+i*31;box(x,212,29,26,it===sel?'#6a4a2a':'#3a2a1a',it===sel?K.y:'#5a4a3a');if(!it)continue;icon(it,x+14,223);const n=it.replace(/^[SI]:/,'');const cnt=it.startsWith('S:')?seeds[n]:it.startsWith('I:')?inv[n]:null;if(cnt)T(''+cnt,x+27,231,K.w,1,'r');}
  const sn=sel.replace(/^[SI]:/,'')+(sel.startsWith('S:')?' SEEDS':'');T(sn,160,201,K.w,1,'c');
  if(msgT){const w=Math.min(316,msg.length*4+8);box(160-w/2,30,w,12,'rgba(10,8,30,.85)','#8a6a3a');T(msg.slice(0,78),160,33,K.w,1,'c');}
  if(shop){box(70,40,180,150,'#2a1a10','#d8b060');T('HARBOR GENERAL STORE',160,46,K.y,1,'c');T('GOLD '+gold,160,56,K.w,1,'c');shop.L.forEach((it,i)=>{const y=68+i*11,on=i===shop.i,dis=(it.ok&&!it.ok())||gold<it.p;if(on)R(74,y-2,172,10,'#5a3a1a');T((on?'> ':'  ')+it.n,78,y,dis?'#7a6a5a':on?K.y:K.w,1);T(it.p+'G',242,y,dis?'#7a6a5a':K.y,1,'r');});T('UP/DOWN  A BUY  B LEAVE',160,180,K.gr,1,'c');}
  if(board&&!shop){box(60,46,200,112,'#2a1a10','#d8b060');T('COMMUNITY BOARD',160,52,K.y,1,'c');T('FINISH ALL 5 TO RESTORE THE TOWN',160,62,K.gr,1,'c');BUN.forEach((b,i)=>{const y=76+i*15,dn=don[i].every(v=>v);T(b[0],66,y,dn?K.g:K.w,1);b[1].forEach((it,j)=>{const x=178+j*24;box(x-9,y-5,18,15,don[i][j]?'#3a6a2a':'#3a2a1a','#5a4a3a');icon('I:'+it,x,y+2);if(don[i][j]){GA(.4);R(x-9,y-5,18,15,'#3dff8b');GA(1);}});});}
 };
 return g;}});

/* ---- COMBO KINGS: six fighters, motion specials, supers, high/low blocks, throws ---- */
A.add({id:'combokings',name:'COMBO KINGS',cat:'VERSUS',vs:1,time:300,tags:'street fighter fighting game combos',how:'A PUNCH, B KICK, BACK BLOCKS (DOWN-BACK LOW). DOWN,FWD+A/B SPECIALS. A+B SUPER. BEST OF 3.',make(){
 const g={over:null,score:0},FL=206,GR=.45,RT=60;
 const NORM={jab:{s:4,a:3,r:7,d:30,hs:14,bs:10,l:'m',hb:[6,-60,24,12],kb:2,pose:'jab',rank:1},kick:{s:7,a:4,r:15,d:62,hs:18,bs:12,l:'m',hb:[6,-50,32,14],kb:4,pose:'kick',rank:2},
  cjab:{s:4,a:3,r:7,d:24,hs:13,bs:9,l:'l',hb:[6,-36,24,10],kb:2,pose:'cjab',rank:1,cr:1},sweep:{s:8,a:4,r:20,d:55,hs:20,bs:12,l:'l',hb:[6,-12,36,12],kb:2,kd:1,pose:'sweep',rank:2,cr:1},
  jA:{s:4,a:8,r:4,d:45,hs:16,bs:10,l:'o',hb:[0,-50,24,22],pose:'jA',air:1},jB:{s:6,a:8,r:4,d:60,hs:18,bs:12,l:'o',hb:[2,-32,28,20],pose:'jB',air:1},
  throw:{s:3,a:2,r:22,d:110,grab:1,rg:38,pose:'throw',th:1}};
 const P=(o)=>Object.assign({l:'m',hs:20,bs:14,kb:4,sp:1},o);
 const CH=[
  {n:'RYKER',c:'#f4f0e8',c2:'#d02a2a',hair:'#2a1a10',hp:1000,spd:1.4,mv:'QCF+A FIREBALL / QCF+B RISING FIST / QCF QCF+A BEAM',
   qa:P({s:12,a:1,r:28,pose:'push',proj:{vx:3.4,d:80,hs:20,bs:14,w:14,h:12,y:-52,col:'#5ab8ff'}}),qb:P({s:3,a:12,r:26,d:115,hs:30,hb:[2,-92,22,72],inv:8,vy:-7.5,vx:1.4,kd:1,la:-6,pose:'rise'}),su:P({s:10,a:1,r:30,pose:'push',proj:{vx:4.5,d:48,hits:6,hint:5,w:30,h:28,y:-58,col:'#ffd84a',big:1}})},
  {n:'VALE',c:'#5a7a3a',c2:'#e0c040',hair:'#e0c060',hp:1000,spd:1.25,mv:'HOLD BACK, FWD+A BLADE WAVE / HOLD DOWN, UP+B FLASH KICK',
   ca:P({s:9,a:1,r:20,pose:'push',proj:{vx:4.4,d:70,hs:18,bs:12,w:18,h:10,y:-54,col:'#c0ff60'}}),cd:P({s:3,a:12,r:26,d:120,hs:30,hb:[0,-86,32,66],inv:8,vy:-8,vx:.6,kd:1,la:-6,pose:'flash'}),su:P({s:3,a:40,r:30,d:70,hits:3,hint:12,hb:[0,-86,34,76],inv:16,vy:-5,vx:.8,kd:1,la:-5,pose:'flash'})},
  {n:'MEI-LIN',c:'#3a6ad8',c2:'#f0f0ff',hair:'#1a1a1a',hp:900,spd:1.7,mv:'QCF+A SPIN PALM / QCF+B LIGHTNING KICKS / A+B KICK STORM',
   qa:P({s:8,a:24,r:16,d:28,hits:3,hint:8,hb:[0,-62,30,40],vx:2.5,pose:'spin'}),qb:P({s:6,a:24,r:16,d:22,hits:4,hint:6,hb:[6,-58,36,24],pose:'multi'}),su:P({s:4,a:32,r:20,d:34,hits:8,hint:4,hb:[4,-62,38,42],vx:3,pose:'multi'})},
  {n:'BRAKK',c:'#7a4a2a',c2:'#3a3a3a',hair:'#8a2a1a',hp:1200,spd:1,mv:'QCF+A IRON GRAB / QCF+B LARIAT (ARMOR) / A+B BIG SLAM',
   qa:P({s:5,a:3,r:40,d:170,grab:1,rg:46,pose:'throw'}),qb:P({s:8,a:22,r:20,d:95,hb:[-26,-62,56,26],vx:1.6,armor:1,kd:1,pose:'lariat'}),su:P({s:2,a:4,r:50,d:320,grab:1,rg:54,pose:'throw'})},
  {n:'ZEPHYR',c:'#8a3ab0',c2:'#40e0d0',hair:'#f0f0f0',hp:950,spd:1.3,mv:'QCF+A SPIRIT ORB / QCF+B TELEPORT / A+B TRIPLE ORB',
   qa:P({s:14,a:1,r:26,pose:'push',proj:{vx:2.2,d:90,hs:22,bs:16,w:20,h:18,y:-50,col:'#c060ff'}}),qb:P({s:6,a:1,r:14,tele:1,inv:22,pose:'push'}),su:P({s:10,a:1,r:30,pose:'push',proj:{vx:3,d:90,hs:22,bs:14,w:16,h:14,y:-50,col:'#40e0d0',tri:1}})},
  {n:'KANE',c:'#2a2a3a',c2:'#ff8a20',hair:'#ff5a1a',hp:1000,spd:1.5,mv:'HOLD BACK, FWD+A DASH PUNCH / QCF+B OVERHEAD / A+B RUSH',
   ca:P({s:6,a:14,r:18,d:90,hb:[4,-60,26,26],vx:5,kb:10,pose:'jab'}),qb:P({s:16,a:4,r:16,d:85,l:'o',hb:[4,-82,32,52],vy:-4,vx:2,pose:'over'}),su:P({s:4,a:36,r:20,d:38,hits:8,hint:4,vx:3.5,hb:[4,-64,34,38],pose:'jab'})}];
 let phase='select',cur=[0,1],lock=[false,false],ps=[],round=1,wins=[0,0],rt=0,rtT=0,frz=0,frzN='',projs=[],banner='',banT=0,endT=0,ai={t:0,k:{}},sparks=[];
 const mkP=(i,c)=>({i,ch:CH[c],x:i?220:100,y:FL,vx:0,vy:0,f:i?-1:1,hp:CH[c].hp,max:CH[c].hp,meter:0,st:'idle',t:0,mv:null,mt:0,hit:0,hn:0,lt:0,buf:[],chB:0,chBok:0,chD:0,chDok:0,inv:0,combo:0,cdisp:0,cdT:0,air:false,ws:0,tech:0,arm:0,fl:0});
 const startRound=()=>{ps=[mkP(0,cur[0]),mkP(1,cur[1])];projs=[];rt=RT*60;banner='ROUND '+round;banT=100;phase='intro';};
 const opp=p=>ps[1-p.i];
 const numOf=(p,k)=>{const fw=p.f>0?k.r:k.l,bk=p.f>0?k.l:k.r;const h=fw?1:bk?-1:0,v=k.u?1:k.d?-1:0;return 5+h+v*3;};
 const seq=(p,s,w)=>{let j=s.length-1;for(let i=p.buf.length-1;i>=Math.max(0,p.buf.length-w)&&j>=0;i--)if(p.buf[i]===s[j])j--;return j<0;};
 const qcf=p=>seq(p,[2,3,6],16),dq=p=>seq(p,[2,3,6,2,3,6],32);
 const hurt=p=>p.st==='down'||p.st==='ko'?null:(p.st==='crouch'||(p.mv&&p.mv.cr)||(p.st==='block'&&p.lowB))?[p.x-11,p.y-46,22,46]:[p.x-10,p.y-72,20,72];
 const ov=(a,b)=>a&&b&&a[0]<b[0]+b[2]&&a[0]+a[2]>b[0]&&a[1]<b[1]+b[3]&&a[1]+a[3]>b[1];
 const canAct=p=>['idle','walk','crouch','pre'].includes(p.st);
 const begin0=(p,key)=>{const m=key in NORM?NORM[key]:p.ch[key];if(!m)return false;if(key==='su'){if(p.meter<100)return false;p.meter=0;frz=40;frzN=p.ch.n+' SUPER!';S('win');A.shake=6;}else if(!(key in NORM))p.meter=Math.min(100,p.meter+4);
  if(m.tele){const o=opp(p);p.x=cl(o.x-o.f*30,16,304);p.inv=m.inv;A.burst(p.x,p.y-40,'#c060ff',14,2);S('jump');}
  p.mv=m;p.key=key;p.mt=0;p.hit=0;p.hn=0;p.lt=-99;p.arm=m.armor||0;p.st=m.air?'jatk':'atk';if(m.vy){p.vy=m.vy;p.air=true;}if(m.inv)p.inv=Math.max(p.inv,m.inv);if(!m.air)p.vx=0;S(m.proj?'shoot':'blip');return true;};
 const begin=(p,key)=>begin0(p,key);
 const command=(p,k,h)=>{const n=numOf(p,k),fw=n===6||n===3||n===9;
  if(p.meter>=100&&((h.a&&k.b)||(h.b&&k.a)||(h.a&&dq(p))))return'su';
  if(!h.a&&!h.b)return null;const A_=h.a;
  if(p.st==='jump')return A_?'jA':'jB';
  if(p.ch.ca&&A_&&(p.chB>=35||p.chBok>0)&&fw)return'ca';
  if(p.ch.cd&&!A_&&(p.chD>=35||p.chDok>0)&&k.u)return'cd';
  if(qcf(p)){if(A_&&p.ch.qa)return'qa';if(!A_&&p.ch.qb)return'qb';}
  if(!A_&&(n===6||n===4)&&Math.abs(opp(p).x-p.x)<40&&opp(p).y>=FL&&canAct(opp(p))||(!A_&&(n===6||n===4)&&Math.abs(opp(p).x-p.x)<40&&opp(p).st==='block'))return'throw';
  if(k.d)return A_?'cjab':'sweep';return A_?'jab':'kick';};
 const hitStop=n=>{if(frz<=0)frzN='';frz=Math.max(frz,n);};
 const spark=(x,y,c)=>{sparks.push({x,y,t:10,c});A.burst(x,y,c,6,1.6);};
 const doHit=(a,d,m,px_,py_)=>{const o=d;if(o.inv||o.st==='down'||o.st==='ko')return false;
  const blocking=(o.st==='idle'||o.st==='walk'||o.st==='crouch'||o.st==='block')&&o.y>=FL&&o.back;
  if(m.grab){if(o.y<FL||o.st==='hit'&&o.air)return false;if(m.th&&(o.tech>0)){o.tech=0;a.x-=a.f*14;o.x+=a.f*14;banner='TECH!';banT=30;S('hit');return true;}o.st='thrown';o.t=26;o.thr=a;o.thD=m.d;S('boom');a.meter=Math.min(100,a.meter+12);return true;}
  if(blocking&&!(m.l==='l'&&!o.lowB)&&!(m.l==='o'&&o.lowB)){o.st='block';o.t=m.bs;o.hp-=m.chip!==false&&!(m.rank)?Math.ceil(m.d/8):0;push(a,o,(m.kb||3)*.8);spark(px_,py_,'#9ad8ff');S('hit');o.meter=Math.min(100,o.meter+3);if(o.hp<=0){o.hp=0;ko(o);}return true;}
  if(o.arm>0&&o.st==='atk'){o.arm--;o.hp-=m.d/2|0;spark(px_,py_,'#ffd84a');S('hit');return true;}
  if(o.st==='hit'&&o.air){if((o.jug||0)>=2)return false;o.jug=(o.jug||0)+1;}const sc=Math.max(.45,1-o.combo*.1);const dm=Math.round(m.d*sc);o.hp-=dm;o.combo++;if(o.combo>=2){a.cdisp=o.combo;a.cdT=60;}
  a.meter=Math.min(100,a.meter+8);o.meter=Math.min(100,o.meter+5);o.mv=null;
  if(m.kd||m.la||o.y<FL){o.st='hit';o.air=true;o.vy=m.la||-4;o.vx=-o.f*(m.la?1.2:2.2);o.t=999;}else{o.st='hit';o.t=m.hs;push(a,o,m.kb||3);}
  spark(px_,py_,dm>=80?K.y:'#ffffff');S(dm>=80?'boom':'hit');A.shake=dm>=80?5:2;hitStop(dm>=80?6:3);
  if(o.hp<=0){o.hp=0;ko(o);}return true;};
 const push=(a,o,k)=>{const nx=o.x+a.f*k;if(nx<14||nx>306)a.x-=a.f*k;o.x=cl(nx,14,306);};
 const ko=o=>{o.st='ko';o.air=true;o.vy=-5;o.vx=-o.f*2;o.t=999;frz=50;frzN='K.O.!';S('lose');A.shake=12;};
 const updP=(p,k,h)=>{const o=opp(p);if(p.inv)p.inv--;if(p.cdT)p.cdT--;if(p.tech)p.tech--;
  const n=numOf(p,k);p.buf.push(n);if(p.buf.length>40)p.buf.shift();
  if(n===4||n===1||n===7)p.chB++;else{if(p.chB>=35)p.chBok=10;p.chB=0;}if(p.chBok)p.chBok--;
  if(n<=3)p.chD++;else{if(p.chD>=35)p.chDok=10;p.chD=0;}if(p.chDok)p.chDok--;
  p.back=n===4||n===1;p.lowB=n===1;if((h.b)&&(n===6||n===4))p.tech=6;
  if(p.st==='ko'||p.st==='hit'&&p.air||p.st==='down'||p.st==='thrown'){}
  if(p.st==='thrown'){if(--p.t<=0){p.hp-=p.thD;p.st='hit';p.air=true;p.vy=-5;p.vx=p.thr.f*2.5;p.t=999;p.x=cl(p.thr.x+p.thr.f*20,14,306);A.shake=8;spark(p.x,p.y-30,K.y);if(p.hp<=0){p.hp=0;ko(p);}}return;}
  if(p.st==='block'||p.st==='hit'&&!p.air){if(--p.t<=0){p.st='idle';p.combo=0;}return;}
  if(p.air||p.y<FL){p.vy+=GR;p.y+=p.vy;p.x=cl(p.x+p.vx,14,306);if(p.y>=FL){p.y=FL;p.air=false;p.vy=0;p.vx=0;if(p.st==='hit'){p.st='down';p.t=40;p.inv=50;p.jug=0;S('hit');A.shake=3;}else if(p.st==='ko'){p.st='kod';}else if(p.st==='jatk'||p.st==='jump'){p.st='idle';p.mv=null;}else if(p.st==='atk'&&p.mv&&p.mt>p.mv.s+p.mv.a){p.st='idle';p.mv=null;}}}
  if(p.st==='down'){if(--p.t<=0){p.st='idle';p.combo=0;}return;}if(p.st==='ko'||p.st==='kod'||p.st==='hit')return;
  if(p.st==='atk'||p.st==='jatk'){const m=p.mv;p.mt++;
   if(p.hit&&m.rank&&p.mt>m.s){const c=command(p,k,h);if(c&&c!=='throw'&&(!(c in NORM)||NORM[c].rank>m.rank||c===p.key&&m.rank===1)){begin(p,c);return;}}
   if(p.hit&&!m.rank&&p.key!=='su'&&p.meter>=100&&(h.a&&k.b||h.b&&k.a)){begin(p,'su');return;}
   if(m.vx&&p.mt>m.s&&p.mt<=m.s+m.a&&!m.vy)p.x=cl(p.x+p.f*m.vx,14,306);if(m.vy&&p.air)p.x=cl(p.x+p.f*(m.vx||0),14,306);
   if(m.proj&&p.mt===m.s){const pr=m.proj;if(pr.tri){for(let j=0;j<3;j++)projs.push({o:p.i,x:p.x+p.f*20,y:p.y-36-j*18,vx:p.f*pr.vx*(1-j*.12),d:pr.d*.6|0,hs:pr.hs,bs:pr.bs,w:pr.w,h:pr.h,col:pr.col,hits:1,ht:0,life:200});}else if(!projs.some(q=>q.o===p.i&&!q.big)||pr.big)projs.push({o:p.i,x:p.x+p.f*22,y:p.y+pr.y,vx:p.f*pr.vx,d:pr.d,hs:pr.hs||20,bs:pr.bs||14,w:pr.w,h:pr.h,col:pr.col,hits:pr.hits||1,hint:pr.hint||0,ht:0,big:pr.big,life:220});}
   if(p.mt>=m.s+m.a+m.r&&!(p.air&&p.st==='jatk')){p.st=p.air?'jump':'idle';p.mv=null;if(p.air)p.st='jump';}
   return;}
  if(p.st==='pre'){const c=command(p,k,h);if(c&&c!=='jA'&&c!=='jB'&&begin(p,c))return;if(n===9)p.jd=1;if(n===7)p.jd=-1;if(--p.t<=0){p.st='jump';p.air=true;p.vy=-8;p.vx=p.jd*p.f*2.3;S('jump');}return;}
  if(p.st==='jump'){const c=command(p,k,h);if(c==='jA'||c==='jB')begin(p,c);else if(c==='su')begin(p,'su');return;}
  // neutral
  if(o.st!=='ko'&&o.st!=='kod')p.f=o.x>p.x?1:-1;
  const c=command(p,k,h);if(c&&begin(p,c))return;
  if(k.u){p.st='pre';p.t=3;p.jd=(n===9)?1:(n===7)?-1:0;return;}
  if(k.d){p.st='crouch';return;}
  const dx=ax(k);if(dx){p.st='walk';p.x=cl(p.x+dx*p.ch.spd*(dx===p.f?1:.8),14,306);p.ws+=.2;}else p.st='idle';};
 const hitboxes=()=>{for(const a of ps){const m=a.mv;if(!m||!m.hb&&!m.grab)continue;const act=a.mt>m.s&&a.mt<=m.s+m.a;if(!act)continue;const d=opp(a);
   if(m.grab){if(!a.hit&&Math.abs(d.x-a.x)<m.rg&&Math.abs(d.y-a.y)<10){a.hit=1;doHit(a,d,m,(a.x+d.x)/2,a.y-40);}continue;}
   const hits=m.hits||1;if(a.hn>=hits||(a.hn>0&&a.mt-a.lt<(m.hint||99)))continue;
   const hb=[a.f>0?a.x+m.hb[0]:a.x-m.hb[0]-m.hb[2],a.y+m.hb[1],m.hb[2],m.hb[3]];const hu=hurt(d);if(ov(hb,hu)){a.hn++;a.lt=a.mt;a.hit=1;doHit(a,d,m,a.f>0?Math.min(hb[0]+hb[2],d.x):Math.max(hb[0],d.x),hb[1]+hb[3]/2);}}
  for(const pr of projs){pr.x+=pr.vx;pr.life--;if(pr.ht)pr.ht--;const d=ps[1-pr.o];const hu=hurt(d);if(!pr.ht&&ov([pr.x-pr.w/2,pr.y-pr.h/2,pr.w,pr.h],hu)){const a=ps[pr.o];doHit(a,d,{d:pr.d,hs:pr.hs,bs:pr.bs,l:'m',kb:4,kd:pr.big&&pr.hits===1,chip:true},pr.x,pr.y);pr.hits--;pr.ht=pr.hint||0;if(pr.hits<=0)pr.life=0;}
   for(const q of projs)if(q!==pr&&q.o!==pr.o&&q.life>0&&Math.abs(q.x-pr.x)<(q.w+pr.w)/2&&Math.abs(q.y-pr.y)<20){q.hits--;pr.hits--;spark((q.x+pr.x)/2,pr.y,K.w);if(q.hits<=0)q.life=0;if(pr.hits<=0)pr.life=0;}}
  projs=projs.filter(p=>p.life>0&&p.x>-30&&p.x<350);};
 const sep=()=>{const[a,b]=ps;if(a.y<FL-30||b.y<FL-30)return;const d=b.x-a.x,m=26;if(Math.abs(d)<m){const pu=(m-Math.abs(d))/2*(d>=0?1:-1);a.x=cl(a.x-pu,14,306);b.x=cl(b.x+pu,14,306);if(Math.abs(b.x-a.x)<m-1){if(a.x<30)b.x=a.x+m;else if(b.x<30)a.x=b.x+m;else if(a.x>290)b.x=a.x-m;else if(b.x>290)a.x=b.x-m;}}};
 const cpuInput=p=>{const o=opp(p),d=Math.abs(o.x-p.x),fw=o.x>p.x?'r':'l',bk=fw==='r'?'l':'r',lv=A.ai;const k={},h={};const free=canAct(p);const begin=(q,key)=>free&&begin0(q,key);
  if(--ai.t>0){Object.assign(k,ai.k);return{k,h};}ai.t=Math.round(14/lv)+ri(8);ai.k={};
  const oa=o.mv&&(o.st==='atk'||o.st==='jatk')&&o.mt<=o.mv.s+o.mv.a;const pr=projs.find(q=>q.o!==p.i&&Math.abs(q.x-p.x)<90&&Math.sign(q.vx)===Math.sign(p.x-q.x));
  const R_=rnd(1);
  if(p.meter>=100&&d<70&&R_<.5*lv){h.a=1;k.b=1;return{k,h};}
  if(o.air&&o.vy<1&&d<90&&R_<.7*lv){const aa=p.ch.qb&&p.ch.qb.la?'qb':p.ch.cd?'cd':null;if(aa&&canAct(p)){begin(p,aa);return{k,h};}}
  if(pr){if(R_<.35){ai.k={u:1,[fw]:1};ai.t=10;}else if(R_<.35+.5*lv){ai.k={[bk]:1,d:pr.y>p.y-40?1:0};ai.t=16;}return{k:ai.k,h};}
  if(oa&&d<75&&R_<.85*lv){ai.k={[bk]:1,d:o.mv.l==='l'?1:0};ai.t=o.mv.s+o.mv.a+2;return{k:ai.k,h};}
  if(d>120){if((p.ch.qa&&p.ch.qa.proj||p.ch.ca&&p.ch.ca.proj)&&R_<.35){begin(p,p.ch.qa&&p.ch.qa.proj?'qa':'ca');return{k,h};}ai.k={[fw]:1};ai.t=20;if(R_>.85){ai.k={u:1,[fw]:1};}return{k:ai.k,h};}
  if(d>50){if(R_<.25)ai.k={u:1,[fw]:1};else if(R_<.5){h.b=1;}else if(R_<.6&&p.ch.ca&&!p.ch.ca.proj){begin(p,'ca');}else if(R_<.65&&p.ch.qb&&p.ch.qb.l==='o'){begin(p,'qb');}else ai.k={[fw]:1};ai.t=10+ri(10);return{k:ai.k,h};}
  if(R_<.12)ai.k={[bk]:1};else if(R_<.24){h.b=1;k[fw]=1;}else if(R_<.24+.4*lv){p.cpuCombo=lv>.7?3:2;h.a=1;if(R_<.4)k.d=1;}else if(R_<.8){h.b=1;if(R_<.65)k.d=1;}else ai.k={[bk]:1,d:1};
  return{k,h};};
 const cpuCombo=p=>{if(p.cpuCombo&&p.hit&&p.mv&&p.mv.rank&&p.mt>p.mv.s+1){const sp=p.ch.qa&&!p.ch.qa.proj?'qa':p.ch.qb&&!p.ch.qb.la?'qb':p.ch.qb?'qb':p.ch.ca?'ca':'qa';p.cpuCombo=0;if(p.meter>=100&&rnd(1)<A.ai)begin(p,'su');else if(p.mv.rank===1&&rnd(1)<.5)begin(p,'kick');else begin(p,sp);}};
 g.dbg=()=>({ps,projs,phase});
 g.timeUp=()=>{if(ps.length<2)return'TIME UP - DRAW';const s=(i)=>wins[i]*10+ps[i].hp/ps[i].max;const a=s(0),b=s(1);return Math.abs(a-b)<.001?'TIME UP - DRAW':a>b?'TIME UP - P1 WINS':'TIME UP - '+(A.cpu?'CPU':'P2')+' WINS';};
 g.update=()=>{if(banT)banT--;sparks.forEach(s=>s.t--);sparks=sparks.filter(s=>s.t>0);
  if(phase==='select'){const h0=A.hit(0);const mvC=(i,h)=>{if(lock[i])return;if(h.l)cur[i]=(cur[i]+5)%6;if(h.r)cur[i]=(cur[i]+1)%6;if(h.u||h.d)cur[i]=(cur[i]+3)%6;if(h.l||h.r||h.u||h.d)S('blip');if(h.a){lock[i]=true;S('coin');}};
   if(mClick()){for(let i=0;i<6;i++){const x=40+(i%3)*84,y=46+(i/3|0)*70;if(inR(x,y,72,62)){cur[0]=i;lock[0]=true;S('coin');}}}else mvC(0,h0);
   if(A.two)mvC(1,A.hit(1));else if(lock[0]&&!lock[1]){cur[1]=(cur[0]+1+ri(5))%6;lock[1]=true;}
   if(lock[0]&&lock[1]){if(++endT>40){endT=0;startRound();}}return;}
  if(frz>0){frz--;return;}
  if(phase==='intro'){if(banT===40){banner='FIGHT!';S('score');}if(banT<=0)phase='fight';return;}
  if(phase==='end'){for(const p of ps){if(p.air||p.y<FL){p.vy+=GR;p.y=Math.min(FL,p.y+p.vy);p.x=cl(p.x+p.vx,14,306);if(p.y>=FL){p.air=false;if(p.st==='ko')p.st='kod';else if(p.st==='hit')p.st='down';else if(p.st!=='kod'&&p.st!=='down'){p.st='idle';p.mv=null;}}}else if(p.st!=='kod'&&p.st!=='down'&&p.st!=='ko'){p.st='idle';p.mv=null;}}if(--endT<=0){const w=wins[0]>=2?0:wins[1]>=2?1:-1;if(w>=0){g.over=A.win(w);g.score=wins[0];return;}round++;startRound();}return;}
  const k0=A.in(0),h0=A.hit(0);let k1,h1;if(A.two){k1=A.in(1);h1=A.hit(1);}else{const r=cpuInput(ps[1]);k1=r.k;h1=r.h;}
  updP(ps[0],k0,h0);updP(ps[1],k1,h1);if(!A.two)cpuCombo(ps[1]);sep();hitboxes();
  if(--rt<=0||ps.some(p=>p.hp<=0)){const a=ps[0].hp/ps[0].max,b=ps[1].hp/ps[1].max;let w=-1;if(a>b+1e-6)w=0;else if(b>a+1e-6)w=1;if(w>=0)wins[w]++;else if(!(wins[0]===1&&wins[1]===1)){wins[0]++;wins[1]++;}
   banner=w<0?'DOUBLE K.O.':(ps[0].hp<=0||ps[1].hp<=0?'K.O.! ':'TIME! ')+(w===0?A.nm(0):A.nm(1))+' WINS';banT=120;phase='end';endT=130;S(w===0?'win':'lose');}
  g.score=wins[0];};
 // ---- drawing ----
 const ik=(x0,y0,x1,y1,a,b,bend)=>{let dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy);d=cl(d,Math.abs(a-b)+.01,a+b-.01);const base=Math.atan2(dy,dx),off=Math.acos(cl((a*a+d*d-b*b)/(2*a*d),-1,1));const an=base+off*bend;return[x0+Math.cos(an)*a,y0+Math.sin(an)*a];};
 const pose=(p)=>{const t=A.t*.08,b=Math.sin(t)*1.2;let P_={hip:[0,-33],nk:[2,-58+b],h1:[14,-50+b],h2:[8,-46+b],f1:[8,0],f2:[-8,0]};const st=p.st,m=p.mv,key=p.key,ph=m?(p.mt<=m.s?0:p.mt<=m.s+m.a?1:2):0;
  if(st==='walk'){const s=Math.sin(p.ws*2.2);P_.f1=[8+s*7,s>0?-s*3:0];P_.f2=[-8-s*7,s<0?s*3:0];}
  if(st==='crouch'||st==='block'&&p.lowB)P_={hip:[0,-20],nk:[6,-42],h1:[16,-36],h2:[10,-32],f1:[12,0],f2:[-10,0]};
  if(st==='jump'||st==='jatk')P_={hip:[0,-34],nk:[0,-58],h1:[12,-56],h2:[-6,-50],f1:[8,-14],f2:[-6,-10]};
  if(st==='block'){P_.h1=[12,-58];P_.h2=[10,-52];if(p.lowB){P_.h1=[14,-40];P_.h2=[12,-36];}P_.nk[0]-=2;}
  if(st==='hit'||st==='thrown'){P_.nk=[-9,-54];P_.h1=[-2,-44];P_.h2=[-12,-46];P_.hip=[-2,-32];}
  if(st==='down'||st==='kod'){return{hip:[0,-5],nk:[-26,-6],h1:[-30,-2],h2:[-20,-2],f1:[22,0],f2:[16,-1],lie:1};}
  if(st==='ko'||st==='hit'&&p.air)return{hip:[0,-26],nk:[-22,-34],h1:[-30,-40],h2:[-18,-28],f1:[18,-22],f2:[12,-12]};
  if(m){const ex=ph===1?1:ph===0?.35:.6;const pz=m.pose;
   if(pz==='jab')P_.h1=[8+18*ex,-58];if(pz==='kick'){P_.f1=[6+24*ex,-10-30*ex];P_.nk=[-4,-56];}
   if(pz==='cjab'){Object.assign(P_,{hip:[0,-20],nk:[6,-42],h2:[10,-32],f1:[12,0],f2:[-10,0]});P_.h1=[10+16*ex,-34];}
   if(pz==='sweep'){Object.assign(P_,{hip:[-2,-16],nk:[-4,-38],h1:[-6,-12],h2:[4,-14],f2:[-10,0]});P_.f1=[8+26*ex,-4];}
   if(pz==='jA')P_.h1=[10+12*ex,-44+6*ex];if(pz==='jB'){P_.f1=[10+16*ex,-24];P_.f2=[-4,-14];}
   if(pz==='throw'){P_.h1=[16+8*ex,-50];P_.h2=[14+8*ex,-46];}
   if(pz==='push'){P_.h1=[10+16*ex,-50];P_.h2=[8+16*ex,-44];P_.f1=[12,0];P_.f2=[-12,0];}
   if(pz==='rise'||pz==='flash'){if(pz==='rise'){P_.h1=[8,-58-28*ex];P_.nk=[4,-60];}else{P_.f1=[12+8*ex,-60*ex-10];P_.nk=[-8,-52];P_.h1=[-10,-50];}}
   if(pz==='spin'){const a=p.mt*.6;P_.h1=[Math.cos(a)*18,-52];P_.h2=[-Math.cos(a)*18,-50];}
   if(pz==='multi'){const s=(p.mt>>2)%3;P_.f1=[18+s*6,-30-s*10];P_.f2=[-6,0];P_.nk=[-6,-56];P_.h1=[-4,-50];}
   if(pz==='lariat'){const a=p.mt*.5;P_.h1=[Math.cos(a)*24,-54];P_.h2=[-Math.cos(a)*24,-54];}
   if(pz==='over'){P_.h1=ph===0?[-4,-80]:[22,-40];P_.h2=ph===0?[-8,-78]:[18,-36];}}
  return P_;};
 const drawF=(p)=>{const P_=pose(p),f=p.f,ox=p.x,oy=p.y,ch=p.ch,c=A.c;const X=v=>ox+v[0]*f,Y=v=>oy+v[1];const big=ch.n==='BRAKK'?1.15:1;
  const sc=(v)=>[v[0]*big,v[1]*big];const hip=sc(P_.hip),nk=sc(P_.nk);
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(ox,FL+1,18,4,0,0,6.283);c.fill();
  const limb=(r,t,la,lb,bend,col,col2,w)=>{const j=ik(r[0],r[1],t[0],t[1],la,lb,bend);L(X(r),Y(r),X(j),Y(j),col,w);L(X(j),Y(j),X(t),Y(t),col2,w-.6);C(X(t),Y(t),w/2,col2);};
  const skin='#e0a57c',dk=A.mix(ch.c,'#000000',.35);const sh=[nk[0]*.9+hip[0]*.1,nk[1]+4];
  if(P_.lie){limb(hip,sc(P_.f2),15*big,15*big,-1,dk,dk,5);L(X(hip),Y(hip),X(nk),Y(nk),ch.c,9);limb(hip,sc(P_.f1),15*big,15*big,-1,ch.c,ch.c,5);C(X(nk)-f*7,Y(nk),6,skin);return;}
  limb(sh,sc(P_.h2),11*big,11*big,1,dk,A.mix(skin,'#000000',.25),5.2);limb(hip,sc(P_.f2),16*big,16*big,-1,dk,dk,6.5);
  L(X(hip),Y(hip),X(nk),Y(nk),ch.c,ch.n==='BRAKK'?13:10);R(X(hip)-6,Y(hip)-2,12,3,ch.c2);
  limb(hip,sc(P_.f1),16*big,16*big,-1,ch.c,ch.c,6.5);
  const hd=[nk[0]+1,nk[1]-8*big];C(X(hd),Y(hd),6.5*big,skin);c.fillStyle=ch.hair;c.beginPath();c.arc(X(hd),Y(hd)-1,6.8*big,Math.PI*1.05,Math.PI*1.95);c.fill();R(X(hd)-f*6-1,Y(hd)-4,3,5,ch.hair);
  if(ch.n==='RYKER'){R(X(hd)-6,Y(hd)-3,12,2,ch.c2);L(X(hd)-f*6,Y(hd)-2,X(hd)-f*13,Y(hd)+2+Math.sin(A.t*.2)*2,ch.c2,1.5);}
  if(ch.n==='MEI-LIN'){C(X(hd)-f*5,Y(hd)-5,3,ch.hair);C(X(hd)+f*1,Y(hd)-7,3,ch.hair);}
  if(ch.n==='ZEPHYR'){GA(.5);C(X(hd),Y(hd)-8,3+Math.sin(A.t*.1),'#40e0d0');GA(1);}
  R(X(hd)+f*2-1,Y(hd)-1,2,2,'#1a1a1a');
  limb(sh,sc(P_.h1),11*big,11*big,1,ch.c,skin,5.2);
  if(p.inv&&p.st!=='down'&&A.t%4<2){GA(.3);C(ox,oy-36,20,'#ffffff');GA(1);}};
 const stage=()=>{const c=A.c;A.skyband('#2a1a4a','#ff8a5a',150);c.fillStyle='#3a1a3a';for(let i=0;i<14;i++){const h=30+(i*37)%50;c.fillRect(i*24-4,150-h,20,h);}c.fillStyle='#ffcf6a';for(let i=0;i<30;i++)c.fillRect((i*47)%320,(i*29)%60+100,2,2);
  C(250,70,18,'#ffd8a0');R(0,150,320,20,'#4a2a3a');c.fillStyle='#2a1426';for(let i=0;i<22;i++){const bx=i*15+(i%3)*2,by=166+Math.sin(A.t*.15+i*1.7)*1.5;c.beginPath();c.arc(bx,by-7,4.5,0,6.283);c.fill();c.fillRect(bx-6,by-3,12,9);}
  R(0,170,320,70,'#8a5a3a');for(let i=0;i<8;i++){const y=170+i*9;R(0,y,320,1,'#6a3a2a');}for(let i=-6;i<=6;i++)L(160+i*20,170,160+i*60,240,'#6a3a2a',1);
  for(const x of[30,290]){R(x-2,120,4,50,'#3a1a1a');C(x,118,8,'#ff4a2a');GA(.25);C(x,118,16,'#ffaa5a');GA(1);}};
 const portrait=(i,x,y,sel,lk)=>{box(x,y,72,62,sel?'#3a2a78':'#1a1238',sel?(lk?K.g:K.y):'#3a3570');const ch=CH[i];const p={x:x+36,y:y+70-8,f:1,st:'idle',ch,mv:null,inv:0,ws:0};const sv=A.c;A.c.save();A.c.beginPath();A.c.rect(x+1,y+1,70,48);A.c.clip();drawF(Object.assign(p,{y:y+86}));A.c.restore();R(x+1,y+49,70,12,'#0a0820');T(ch.n,x+36,y+52,sel?K.y:K.w,1,'c');};
 g.draw=()=>{if(phase==='select'){A.cls('#120a2a');for(let i=0;i<16;i++)R(i*20,0,10,3,i%2?K.p:K.y);T('CHOOSE YOUR FIGHTER',160,14,K.y,2,'c');for(let i=0;i<6;i++)portrait(i,40+(i%3)*84,46+(i/3|0)*70,cur[0]===i||(A.two&&cur[1]===i),cur[0]===i?lock[0]:lock[1]);
   T('P1',40+(cur[0]%3)*84+4,40+(cur[0]/3|0)*70,K.c,1);if(A.two||lock[1])T(A.nm(1),112+(cur[1]%3)*84-4,40+(cur[1]/3|0)*70,K.p,1,'r');
   const ch=CH[cur[0]];T(ch.n+'  HP '+ch.hp+'  SPEED '+ch.spd,160,190,K.w,1,'c');T(ch.mv,160,202,K.c,1,'c');T('QCF = DOWN, DOWN-FORWARD, FORWARD.  SUPER NEEDS A FULL METER',160,214,K.gr,1,'c');return;}
  stage();for(const p of ps.slice().sort((a,b)=>(a.mv?1:0)-(b.mv?1:0)))drawF(p);
  for(const pr of projs){GA(.4);C(pr.x,pr.y,pr.w*.7,pr.col);GA(1);C(pr.x,pr.y,pr.w*.4,pr.col);C(pr.x-pr.vx,pr.y,pr.w*.2,'#ffffff');}
  for(const s of sparks){GA(s.t/10);A.ring(s.x,s.y,14-s.t,s.c);L(s.x-8,s.y,s.x+8,s.y,s.c,2);L(s.x,s.y-8,s.x,s.y+8,s.c,2);GA(1);}
  if(frz>0&&frzN){GA(.35);R(0,0,320,240,'#000000');GA(1);T(frzN,160,100,frzN==='K.O.!'?K.r:K.y,frzN==='K.O.!'?5:3,'c');}
  // HUD
  for(const p of ps){const L_=p.i===0,x=L_?8:180,w=132,f=Math.max(0,p.hp)/p.max;R(x-1,7,w+2,12,'#000000');R(x,8,w,10,'#7a1a1a');const fw=w*f;R(L_?x+w-fw:x,8,fw,10,f<.3?'#ff6a3a':'#ffd84a');T(p.ch.n,L_?x:x+w,22,L_?K.c:K.p,1,L_?undefined:'r');for(let i=0;i<2;i++)C(L_?x+w-6-i*10:x+6+i*10,26,3,i<wins[p.i]?K.y:'#3a2a4a');
   const mx=L_?8:220;R(mx,228,92,7,'#1a1238');R(mx,228,92*p.meter/100,7,p.meter>=100?(A.t%10<5?'#ffffff':K.c):'#2a8ad8');T(p.meter>=100?'SUPER!':'SUPER',L_?mx:mx+92,220,p.meter>=100?K.y:K.gr,1,L_?undefined:'r');
   if(p.cdT)T(p.cdisp+' HIT COMBO',L_?10:310,46,K.y,1,L_?undefined:'r');}
  box(146,4,28,20,'#1a1238','#4a4490');T(''+Math.ceil(Math.max(0,rt)/60),160,8,rt<600?K.r:K.w,2,'c');
  if(banT)T(banner,160,96,banner==='FIGHT!'?K.r:K.y,banner.length>10?2:4,'c');};
 return g;}});

/* ---- CAVERN QUEST: interconnected metroidvania with ability gates, saves, map and bosses ---- */
A.add({id:'cavernquest',name:'CAVERN QUEST',cat:'ACTION',time:600,tags:'metroid hollow knight metroidvania castlevania platformer',how:'ARROWS MOVE, A JUMPS, B SLASHES. DOUBLE-TAP TO DASH, DOWN+B BOMBS, HOLD UP FOR MAP.',make(){
 const g={over:null,score:0},TS=16,OY=16;
 const RM={
  '1,1':{n:'HOLLOW GATE',m:['####################','#..................#','#..................#','#..................#','#..................#','#......====........#','#..................#','#..................#','#..==.........==...#','#..................#','....................','.....S.......e......','#########XX#########','#########XX#########']},
  '2,1':{n:'MOSSY HALL',m:['###############..###','#..................#','#..................#','#..................#','#.............====.#','#..................#','#..................#','#..................#','#.............====.#','#...f..............#','....................','......e.......e.....','####################','####################']},
  '3,1':{n:'BRUTE DEN',boss:1,m:['####################','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..====......====..#','#..................#','...................#','...................#','####################','####################']},
  '2,0':{n:'UPPER GROTTO',ab:'dash',m:['####################','#...................','#...................','#................###','#................###','#....f...........###','#................###','#.........f......###','#................###','#................###','..............====.#','...A......e........#','###############..###','###############..###']},
  '1,0':{n:'SPIKE RUN',m:['####################','####################','###....######....###','##.....######......#','##.....######......#','####################','####################','####################','####################','####################','....................','..e..............e..','#######^^^^^########','####################']},
  '0,0':{n:'BELL SHRINE',ab:'wall',m:['####################','#..................#','#..................#','#........===.......#','#..................#','#..................#','#..===.............#','#..................#','#..........f.......#','#..................#','#...................','#....S.......A......','#..#################','#..#################']},
  '0,1':{n:'WEST SHAFT',m:['#..#################','#..#################','#..#################','#..#################','#...H###############','#..#################','#..#################','#..#################','#..#####........####','#..#####...f....####','#...................','#.......e...........','####################','####################']},
  '3,0':{n:'LANTERN HALL',boss:2,m:['####################','...................#','...................#','####...............#','#..................#','#..................#','#.====.......====..#','#..................#','#..................#','#....====....====..#','#..................#','#..................#','####################','####################']},
  '1,2':{n:'DEEP HOLLOW',m:['#########..#########','#..................#','#..................#','#.......====.......#','#..................#','#..................#','#.###.........f....#','#.H#...............#','####......====.....#','#..................#','#..................#','#.....e.....g.......','###^^^###########^^#','####################']},
  '2,2':{n:'ROOT REST',m:['####################','#..................#','#..................#','#..................#','#..................#','#.......====.......#','#..................#','#..................#','#..................#','#..................#','....................','.........S..........','####################','####################']},
  '3,2':{n:'KING\'S PIT',boss:3,m:['####################','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..===........===..#','#..................#','#..................#','...................#','...................#','####################','####################']}};
 const PAL={0:['#3a3060','#5a4a90','#1a1430'],1:['#2a4a3a','#4a8a5a','#0e1a14'],2:['#4a2a2a','#8a4a3a','#1a0c0c']};
 const tiles={};for(const k in RM)tiles[k]=RM[k].m.map(r=>r.split(''));
 let rx=1,ry=1,px=60,py=11*TS+16,vx=0,vy=0,f=1,onG=false,jumps=0,hp=5,hpMax=5,inv=0,abil={},dashT=0,dashCd=0,airDash=0,lastTap={l:-99,r:-99},wallSide=0,lockT=0,
  atk=0,atkDir=0,atkHit=false,bomb=null,ens=[],shots=[],boss=null,beaten={},taken={},seen={'1,1':1},save={rx:1,ry:1,x:100,y:11*TS+16},safe={x:60,y:11*TS+16},msg='',msgT=0,mapT=0,fade=0,st=0,deaths=0,keyHeld=false;
 const ROOM=()=>tiles[rx+','+ry];
 const tAt=(x,y)=>{const t=ROOM();const cx=Math.floor(x/TS),cy=Math.floor(y/TS);if(cx<0||cx>19||cy<0||cy>13){return'.';}return t[cy][cx];};
 const sol=c=>c==='#'||c==='X';
 const say=(m,t)=>{msg=m;msgT=t||150;};
 const enterRoom=()=>{const k=rx+','+ry,R_=RM[k];ens=[];shots=[];bomb=null;boss=null;if(!seen[k]){seen[k]=1;g.score+=50;}
  R_.m.forEach((row,y)=>row.split('').forEach((c,x)=>{const ex=x*TS+8,ey=y*TS+16;if(c==='e')ens.push({k:'e',x:ex,y:ey,vx:.5,hp:2,fl:0,w:12,h:10});if(c==='f')ens.push({k:'f',x:ex,y:ey-8,hx:ex,hy:ey-8,vx:0,vy:0,hp:2,fl:0,w:12,h:12,t:ri(100)});if(c==='g')ens.push({k:'g',x:ex,y:ey,hp:3,fl:0,w:12,h:12,t:60+ri(60)});}));
  if(R_.boss&&!beaten[R_.boss])spawnBoss(R_.boss);};
 const spawnBoss=b=>{if(b===1)boss={b,n:'MOSS BRUTE',x:230,y:12*TS,vx:0,vy:0,hp:14,max:14,w:30,h:28,t:60,st:'walk',fl:0};if(b===2)boss={b,n:'LANTERN WRAITH',x:220,y:100,vx:0,vy:0,hp:16,max:16,w:22,h:22,t:90,st:'float',fl:0,a:0};if(b===3)boss={b,n:'CAVERN KING',x:240,y:12*TS,vx:0,vy:0,hp:30,max:30,w:36,h:34,t:80,st:'walk',fl:0};say(boss.n,120);S('boom');};
 const respawn=()=>{rx=save.rx;ry=save.ry;px=save.x;py=save.y;vx=vy=0;hp=hpMax;inv=60;fade=40;deaths++;enterRoom();safe={x:px,y:py};say('YOU AWAKEN AT THE LAST BENCH',120);};
 const hurt=(sx,n)=>{if(inv>0||fade>20)return;hp-=n||1;inv=70;vx=(px<sx?-1:1)*2.6;vy=-3.2;lockT=12;S('hit');A.shake=6;A.burst(px,py-8,K.r,10,2);if(hp<=0){S('lose');A.burst(px,py-8,K.w,30,3);respawn();}};
 const hitBox=(nx,ny)=>{const x0=Math.floor((nx-5)/TS),x1=Math.floor((nx+4.99)/TS),y0=Math.floor((ny-14)/TS),y1=Math.floor((ny-.01)/TS);for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)if(sol(tAt(cx*TS+1,cy*TS+1)))return true;return false;};
 const oneWay=(oy,ny)=>{if(keyHeld)return false;for(const x of[px-5,px+4.99]){if(tAt(x,ny-.01)==='='){const top=Math.floor((ny-.01)/TS)*TS;if(oy<=top+.01)return true;}}return false;};
 const mvX=d=>{const n=Math.ceil(Math.abs(d));if(!n)return true;const s_=d/n;for(let i=0;i<n;i++){if(hitBox(px+s_,py))return false;px+=s_;}return true;};
 const mvY=d=>{const n=Math.ceil(Math.abs(d));if(!n)return true;const s_=d/n;for(let i=0;i<n;i++){const ny=py+s_;if(hitBox(px,ny)||(s_>0&&oneWay(py,ny)))return false;py=ny;}return true;};
 const collide=(nx,ny)=>hitBox(nx,ny);
 enterRoom();say('FIND RELICS TO OPEN NEW PATHS. BENCHES SAVE.',220);
 g.dbg={get:()=>({px,py,rx,ry,vx,vy,onG,hp,abil,boss:!!boss,beaten}),set:o=>{if(o.rx!==undefined){rx=o.rx;ry=o.ry;enterRoom();}if(o.px!==undefined)px=o.px;if(o.py!==undefined)py=o.py;if(o.abil)abil=o.abil;if(o.hp)hp=o.hp;}};
 const boxHit=(ax,ay,aw,ah,bx,by,bw,bh)=>ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
 const explode=(x,y)=>{S('boom');A.shake=10;A.burst(x,y,K.o,30,3);const t=ROOM();for(let cy=0;cy<14;cy++)for(let cx=0;cx<20;cx++)if(t[cy][cx]==='X'&&Math.hypot(cx*TS+8-x,cy*TS+8-y)<40){t[cy][cx]='.';A.burst(cx*TS+8,cy*TS+8+OY,'#8a7a6a',8,2);g.score+=20;}
  for(const e of ens)if(Math.hypot(e.x-x,e.y-y)<34){e.hp-=3;e.fl=8;}if(boss&&Math.hypot(boss.x-x,boss.y-boss.h/2-y)<40){boss.hp-=2;boss.fl=8;}};
 const killCheck=()=>{for(const e of ens)if(e.hp<=0&&!e.dead){e.dead=1;g.score+=10;A.burst(e.x,e.y-6+OY,'#d0f0a0',14,2);S('score');}ens=ens.filter(e=>!e.dead);
  if(boss&&boss.hp<=0){g.score+=300;S('win');A.shake=14;A.burst(boss.x,boss.y-boss.h/2+OY,K.y,50,3);beaten[boss.b]=1;const b=boss.b;boss=null;shots=[];
   if(b===1)say('THE BRUTE FALLS. A GLOWING ORB APPEARS...',150);if(b===2)say('THE WRAITH FADES. AN ORB REMAINS...',150);if(b===3){g.score+=1000+Math.max(0,600-deaths*50);g.over='VICTORY - CAVERN CLEARED';}}};
 const abOrb=()=>{const k=rx+','+ry,R_=RM[k];if(R_.ab&&!taken[k]){let ox=0,oy=0;R_.m.forEach((r,y)=>{const i=r.indexOf('A');if(i>=0){ox=i*TS+8;oy=y*TS+8;}});return{x:ox,y:oy,ab:R_.ab};}
  if(R_.boss&&beaten[R_.boss]&&!taken[k]&&R_.boss<3)return{x:160,y:174,ab:R_.boss===1?'dj':'bomb'};return null;};
 const ABN={dj:'DOUBLE JUMP - PRESS A AGAIN IN THE AIR',dash:'SHADE DASH - TAP LEFT OR RIGHT TWICE',wall:'WALL CLIMB - HOLD INTO A WALL, PRESS A',bomb:'BOMBS - HOLD DOWN AND PRESS B'};
 g.update=()=>{const k=A.in(0),h=A.hit(0);if(msgT)msgT--;if(fade)fade--;if(inv)inv--;if(dashCd)dashCd--;if(lockT)lockT--;st+=.2;
  keyHeld=k.d&&k.a;
  if(k.u&&onG&&!ax(k)&&!k.b)mapT++;else mapT=0;if(mapT>20)return;
  // input
  const dx=lockT?0:ax(k);
  if(abil.dash&&!dashT&&!dashCd){for(const d of['l','r'])if(h[d]){if(A.t-lastTap[d]<14&&(onG||!airDash)){dashT=16;f=d==='l'?-1:1;if(!onG)airDash=1;S('jump');A.burst(px,py-7+OY,'#a0e0ff',8,1.5);}lastTap[d]=A.t;}}
  if(dashT){dashT--;vx=f*5;vy=0;if(!dashT){dashCd=16;vx=f*1.7;}}
  else{if(dx){vx+=(dx*1.75-vx)*.35;f=dx;}else vx*=onG?.6:.85;
   wallSide=0;if(abil.wall&&!onG&&vy>-.5){if(dx===1&&collide(px+2,py))wallSide=1;if(dx===-1&&collide(px-2,py))wallSide=-1;}
   if(wallSide){vy=Math.min(vy,.9);if(h.a){vy=-5.3;vx=-wallSide*2.4;lockT=8;f=-wallSide;S('jump');A.burst(px+wallSide*5,py-6+OY,'#cfe8ff',5,1);}}
   else if(h.a&&!keyHeld){if(onG){vy=-5.4;jumps=1;S('jump');}else if(abil.dj&&jumps<2){vy=-5;jumps=2;S('jump');A.burst(px,py+OY,'#e0f0ff',8,1.5);}}
   if(!k.a&&vy<-2&&!wallSide)vy+=.35;
   vy=Math.min(vy+.32,6.5);}
  // attack / bomb
  if(atk)atk--;if(h.b&&!atk){if(k.d&&onG&&abil.bomb&&!bomb){bomb={x:px,y:py-4,t:70};S('blip');}else{atk=14;atkHit=false;atkDir=k.u?-1:(k.d&&!onG)?1:0;S('shoot');}}
  if(bomb&&--bomb.t<=0){explode(bomb.x,bomb.y);bomb=null;}
  // move
  if(!mvX(vx)){vx=0;if(dashT){dashT=0;dashCd=16;}}
  if(!mvY(vy)){if(vy>0){jumps=0;airDash=0;}vy=0;}
  onG=hitBox(px,py+1)||oneWay(py,py+1);if(onG){jumps=0;airDash=0;}
  if(onG&&A.t%20===0&&tAt(px-6,py+2)!=='^'&&tAt(px+6,py+2)!=='^'&&tAt(px,py+2)!=='^'&&!boss)safe={x:px,y:py};
  if(tAt(px,py-2)==='^'||tAt(px-4,py+1)==='^'&&tAt(px+4,py+1)==='^'){if(inv<=0){hurt(px+1,1);px=safe.x;py=safe.y;vx=vy=0;}}
  // room transitions
  const go=(dx_,dy_)=>{const nk=(rx+dx_)+','+(ry+dy_);if(!RM[nk])return false;rx+=dx_;ry+=dy_;if(dx_)px=dx_>0?6:314;if(dy_>0){py=16;}if(dy_<0){py=220;vy=Math.min(vy,-6.6);}fade=10;enterRoom();safe={x:px,y:dy_<0?py:py};S('blip');return true;};
  if(!boss){if(px<2)go(-1,0);else if(px>318)go(1,0);else if(py-14<-4)go(0,-1);else if(py>226)go(0,1);}else{px=cl(px,20,300);}
  if(py>240){px=safe.x;py=safe.y;}
  // benches & pickups
  const tc=tAt(px,py-6);if(tc==='S'&&onG){if(hp<hpMax||save.rx!==rx||save.ry!==ry||Math.abs(save.x-px)>20){hp=hpMax;save={rx,ry,x:px,y:py};say('RESTED AT THE BENCH. PROGRESS SAVED.',100);S('coin');A.burst(px,py-10+OY,K.y,14,1.5);}}
  const orb=abOrb();if(orb&&Math.abs(px-orb.x)<12&&Math.abs(py-8-orb.y)<16){abil[orb.ab]=1;taken[rx+','+ry]=1;g.score+=200;say(ABN[orb.ab],260);S('win');A.confetti();}
  const k_=rx+','+ry;if(!taken['H'+k_]){const t=ROOM();for(let y=0;y<14;y++){const i=t[y].indexOf('H');if(i>=0&&Math.abs(px-(i*TS+8))<12&&Math.abs(py-8-(y*TS+8))<14){taken['H'+k_]=1;hpMax++;hp=hpMax;g.score+=100;say('MASK SHARD! MAX HEALTH UP',150);S('win');}}}
  // attack hitbox
  let ab_=null;if(atk>4){ab_=atkDir===-1?[px-10,py-34,20,22]:atkDir===1?[px-10,py-2,20,20]:[f>0?px+2:px-24,py-16,22,16];}
  const pogo=()=>{if(atkDir===1){vy=-5;jumps=1;airDash=0;}};
  if(ab_&&atkDir===1&&!atkHit){if(tAt(ab_[0]+10,ab_[1]+10)==='^'||tAt(ab_[0]+10,ab_[1]+18)==='^'){atkHit=true;pogo();S('hit');}}
  for(const e of ens){if(e.fl)e.fl--;const eb=[e.x-e.w/2,e.y-e.h,e.w,e.h];if(ab_&&!e.hitT&&boxHit(...ab_,...eb)){e.hp--;e.fl=8;e.hitT=10;atkHit=true;pogo();e.x+=f*(atkDir?0:8);S('hit');A.burst(e.x,e.y-e.h/2+OY,K.w,5,1.5);if(!atkDir)vx-=f*1.2;}if(e.hitT)e.hitT--;
   if(boxHit(px-5,py-14,10,14,...eb))hurt(e.x,1);
   if(e.k==='e'){e.x+=e.vx;const ahead=e.x+Math.sign(e.vx)*7;if(sol(tAt(ahead,e.y-4))||!sol(tAt(ahead,e.y+2))&&tAt(ahead,e.y+2)!=='=')e.vx=-e.vx;}
   if(e.k==='f'){e.t++;const d=Math.hypot(px-e.x,py-8-e.y);if(d<110){e.vx+=(px-e.x)/d*.06;e.vy+=(py-10-e.y)/d*.06;}else{e.vx+=(e.hx-e.x)*.002;e.vy+=(e.hy+Math.sin(e.t*.05)*10-e.y)*.004;}e.vx*=.96;e.vy*=.96;const nx2=e.x+e.vx,ny2=e.y+e.vy;if(!sol(tAt(nx2,ny2-6)))e.x=nx2;else e.vx*=-.5;if(!sol(tAt(e.x,ny2-6)))e.y=ny2;else e.vy*=-.5;}
   if(e.k==='g'){if(--e.t<=0){e.t=110;const d=px-e.x;shots.push({x:e.x,y:e.y-12,vx:cl(d/50,-2.5,2.5),vy:-4,gr:.15,r:3});S('shoot');}}}
  for(const s of shots){s.x+=s.vx;s.y+=s.vy;s.vy+=s.gr||0;s.life=(s.life||200)-1;if(sol(tAt(s.x,s.y))&&!s.thru)s.life=0;if(Math.abs(s.x-px)<4+s.r&&Math.abs(s.y-(py-7))<7+s.r){hurt(s.x,1);s.life=0;}}shots=shots.filter(s=>s.life>0&&s.x>-10&&s.x<330&&s.y<240);
  if(boss)bossUp(ab_);
  killCheck();};
 const bossUp=(ab_)=>{const b=boss;if(b.fl)b.fl--;b.t--;const bb=[b.x-b.w/2,b.y-b.h,b.w,b.h];
  if(ab_&&!b.hitT&&boxHit(...ab_,...bb)){b.hp--;b.fl=8;b.hitT=12;S('hit');A.burst(b.x,b.y-b.h/2+OY,K.w,6,2);if(atkDir===1){vy=-5;jumps=1;}else vx-=f*1.5;}if(b.hitT)b.hitT--;
  if(boxHit(px-5,py-14,10,14,...bb))hurt(b.x,1);
  const ground=()=>{b.vy+=.3;b.y+=b.vy;if(b.y>=12*TS){b.y=12*TS;if(b.vy>3&&b.st==='leap'){A.shake=10;S('boom');shots.push({x:b.x-b.w/2,y:b.y-5,vx:-2.6,vy:0,r:4,thru:1,life:120,wave:1},{x:b.x+b.w/2,y:b.y-5,vx:2.6,vy:0,r:4,thru:1,life:120,wave:1});b.st='walk';b.t=70;}b.vy=0;}};
  if(b.b===1){if(b.st==='walk'){b.x+=Math.sign(px-b.x)*.6;if(b.t<=0){b.st=rnd(1)<.55?'wind':'leap';b.t=30;if(b.st==='leap'){b.vy=-7;b.vx=(px-b.x)/50;}}}
   else if(b.st==='wind'){if(b.t<=0){b.st='charge';b.vx=Math.sign(px-b.x)*3.6;}}else if(b.st==='charge'){b.x+=b.vx;if(b.x<28||b.x>292){b.x=cl(b.x,28,292);b.st='stun';b.t=50;A.shake=8;S('boom');for(let i=0;i<3;i++)shots.push({x:40+rnd(240),y:20,vx:0,vy:1,gr:.12,r:4});}}
   else if(b.st==='stun'){if(b.t<=0){b.st='walk';b.t=100+ri(60);}}else if(b.st==='leap'){b.x=cl(b.x+b.vx,28,292);}ground();}
  if(b.b===2){b.a+=.02;if(b.st==='float'){const tx=160+Math.cos(b.a)*100,ty=90+Math.sin(b.a*2)*40;b.x+=(tx-b.x)*.04;b.y+=(ty-b.y)*.04;if(b.t<=0){if(rnd(1)<.6){const a0=Math.atan2(py-8-b.y+11,px-b.x);for(let i=-1;i<=1;i++)shots.push({x:b.x,y:b.y-11,vx:Math.cos(a0+i*.3)*2.2,vy:Math.sin(a0+i*.3)*2.2,r:3,thru:1,life:200});S('shoot');b.t=80+ri(40);}else{b.st='dive';b.tx=px;b.ty=py;b.t=60;}}}
   else if(b.st==='dive'){if(b.t>40){b.fl=b.t%4<2?2:0;}else{b.x+=(b.tx-b.x)*.1;b.y+=(b.ty-b.y)*.1;}if(b.t<=0){b.st='float';b.t=90;}}}
  if(b.b===3){const ph2=b.hp<=15;if(b.st==='walk'){b.x+=Math.sign(px-b.x)*(ph2?.9:.6);if(b.t<=0){const r=rnd(1);if(r<.4){b.st='leap';b.vy=-7.5;b.vx=(px-b.x)/55;}else if(r<.7||!ph2){b.st='summon';b.t=40;}else{b.st='spread';b.t=30;}}}
   else if(b.st==='leap'){b.x=cl(b.x+b.vx,30,290);}
   else if(b.st==='summon'){if(b.t===20){if(ens.length<4)ens.push({k:'e',x:b.x<160?280:40,y:12*TS,vx:.6,hp:2,fl:0,w:12,h:10});if(ph2)for(let i=0;i<4;i++)shots.push({x:20+rnd(280),y:20,vx:0,vy:.5,gr:.1,r:5});S('boom');}if(b.t<=0){b.st='walk';b.t=80+ri(50);}}
   else if(b.st==='spread'){if(b.t===10){for(let i=-2;i<=2;i++){const a=-Math.PI/2+i*.45+(px<b.x?-.4:.4);shots.push({x:b.x,y:b.y-30,vx:Math.cos(a)*2.6,vy:Math.sin(a)*2.6,gr:.06,r:4,thru:1,life:220});}S('shoot');}if(b.t<=0){b.st='walk';b.t=70;}}ground();}};
 // ---- drawing ----
 const hero=(x,y)=>{const c=A.c;if(inv&&A.t%6<3)return;const fl=f;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x-5,y-1,10,2);
  A.poly([[x-5,y],[x+5,y],[x+4,y-9],[x-4,y-9]],'#2a7a8a',1);A.poly([[x-5*fl,y-8],[x-9*fl,y-2+Math.sin(st)*1.5],[x-4*fl,y-2]],'#1a5a6a',1);
  const run=onG&&Math.abs(vx)>.4;R(x-3,y-2+(run&&Math.sin(st*1.6)>0?-1:0),2,2,'#1a1a2a');R(x+1,y-2+(run&&Math.sin(st*1.6)<0?-1:0),2,2,'#1a1a2a');
  C(x,y-12,4.5,'#f0e0c8');A.c.fillStyle='#3a2a4a';A.c.beginPath();A.c.arc(x,y-13,5,Math.PI,0);A.c.fill();R(x+fl*1-2,y-13,5,2,'#5ae0ff');R(x+fl*2-1,y-13,2,1,'#ffffff');
  if(dashT){GA(.35);R(x-fl*20,y-12,20,10,'#a0e0ff');GA(1);}
  if(atk>4){const a=(14-atk)/10;c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();if(atkDir===-1)c.arc(x,y-16,14,-Math.PI*(.9-a*.8),-Math.PI*(.1+ (1-a)*.2));else if(atkDir===1)c.arc(x,y+2,13,Math.PI*.1,Math.PI*.9);else c.arc(x+fl*6,y-8,14,fl>0?-1.2+a*.6:Math.PI+1.2-a*.6,fl>0?1.0:Math.PI-1.0,fl<0);c.stroke();}};
 const drawRoom=()=>{const t=ROOM(),p=PAL[ry]||PAL[0],c=A.c;A.cls(p[2]);
  c.fillStyle=A.mix(p[2],'#000000',.3);for(let i=0;i<9;i++){const bx=(i*47+rx*31)%340-10;c.beginPath();c.moveTo(bx,240);c.lineTo(bx+20,120+(i*29)%60);c.lineTo(bx+40,240);c.fill();}
  for(let i=0;i<14;i++){const gx=(i*71+ry*13)%320,gy=40+(i*53)%180;GA(.25+.15*Math.sin(A.t*.05+i));C(gx,gy,1.5,i%2?'#7affd0':'#ffb0ff');GA(1);}
  for(let y=0;y<14;y++)for(let x=0;x<20;x++){const ch=t[y][x],sx=x*TS,sy=y*TS+OY;
   if(ch==='#'){const hv=(x*7+y*13+rx*3)%5;c.fillStyle=hv===0?A.mix(p[0],'#000000',.14):hv===1?A.mix(p[0],'#ffffff',.06):p[0];c.fillRect(sx,sy,TS,TS);c.fillStyle='rgba(0,0,0,.22)';if((x+y)%2)c.fillRect(sx,sy+8,TS,1);else c.fillRect(sx+8,sy,1,8);if(y>0&&!sol(t[y-1][x])){c.fillStyle=p[1];c.fillRect(sx,sy,TS,3);c.fillStyle=ry===1?'#6ac070':'#7a6ab0';c.fillRect(sx+((x*5)%12),sy+2,2,3);}
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(sx+((x*7+y*3)%11),sy+((x*3+y*5)%11),3,2);if(x<19&&!sol(t[y][x+1])){c.fillStyle='rgba(255,255,255,.06)';c.fillRect(sx+TS-2,sy,2,TS);}}
   else if(ch==='X'){R(sx,sy,TS,TS,'#6a5a4a');L(sx+3,sy+2,sx+8,sy+9,'#2a2018',1);L(sx+8,sy+9,sx+13,sy+5,'#2a2018',1);L(sx+8,sy+9,sx+6,sy+15,'#2a2018',1);}
   else if(ch==='='){R(sx,sy,TS,5,p[1]);R(sx,sy+5,TS,1,p[2]);R(sx+2,sy+5,2,3,p[0]);R(sx+12,sy+5,2,3,p[0]);}
   else if(ch==='^'){c.fillStyle='#c8c8d8';for(let i=0;i<4;i++){c.beginPath();c.moveTo(sx+i*4,sy+TS);c.lineTo(sx+i*4+2,sy+6);c.lineTo(sx+i*4+4,sy+TS);c.fill();}}
   else if(ch==='S'){R(sx-2,sy+8,20,3,'#8a6a3a');R(sx,sy+11,2,5,'#6a4a2a');R(sx+14,sy+11,2,5,'#6a4a2a');GA(.2+.1*Math.sin(A.t*.1));C(sx+8,sy+6,12,'#ffd84a');GA(1);}
   else if(ch==='H'&&!taken['H'+rx+','+ry]){const b=Math.sin(A.t*.1)*2;C(sx+8,sy+8+b,5,'#f0f0ff');C(sx+6,sy+6+b,2,'#ffffff');GA(.3);C(sx+8,sy+8+b,9,'#a0c0ff');GA(1);}}
  const orb=abOrb();if(orb){const b=Math.sin(A.t*.08)*3;GA(.3);C(orb.x,orb.y+OY+b,14,'#ffe08a');GA(1);C(orb.x,orb.y+OY+b,6,'#ffd84a');C(orb.x-2,orb.y+OY+b-2,2,'#ffffff');}};
 g.draw=()=>{drawRoom();const c=A.c;
  for(const e of ens){const x=e.x,y=e.y+OY,fl=e.fl&&e.fl%4<2;if(e.k==='e'){A.poly([[x-7,y],[x+7,y],[x+5,y-8],[x-5,y-8]],fl?'#ffffff':'#8a5aa0',1);C(x+(e.vx>0?4:-4),y-6,2,'#ffe060');R(x-6,y-1,2,1,'#2a1a2a');R(x+4,y-1,2,1,'#2a1a2a');}
   else if(e.k==='f'){const w=Math.sin(A.t*.4)*4;A.poly([[x-2,y-6],[x-11,y-10-w],[x-6,y-3]],fl?'#ffffff':'#3a8a9a',1);A.poly([[x+2,y-6],[x+11,y-10-w],[x+6,y-3]],fl?'#ffffff':'#3a8a9a',1);C(x,y-6,5,fl?'#ffffff':'#2a5a6a');R(x-2,y-7,1,1,K.r);R(x+1,y-7,1,1,K.r);}
   else{C(x,y-6,7,fl?'#ffffff':'#5a7a3a');C(x,y-9,3,'#ff8a3a');R(x-7,y-2,14,2,'#3a5a2a');}}
  if(boss){const b=boss,x=b.x,y=b.y+OY,fl=b.fl&&b.fl%4<2;
   if(b.b===1){A.poly([[x-15,y],[x+15,y],[x+12,y-24],[x-12,y-24]],fl?'#ffffff':b.st==='stun'?'#7a8a5a':'#4a7a3a',1);C(x,y-26,10,fl?'#ffffff':'#5a8a4a');R(x+(px>x?3:-7),y-29,4,3,b.st==='wind'?K.r:K.y);for(let i=-1;i<=1;i++)R(x+i*8-2,y-34,4,6,'#3a5a2a');}
   if(b.b===2){GA(.25);C(x,y-11,20,'#ffb050');GA(1);A.poly([[x-11,y-4],[x+11,y-4],[x,y+10+Math.sin(A.t*.2)*3]],fl?'#ffffff':'#3a2a5a',1);C(x,y-11,11,fl?'#ffffff':'#4a3a7a');C(x,y-11,5,b.st==='dive'?K.r:'#ffd060');R(x-6,y-15,3,2,'#ffffff');R(x+3,y-15,3,2,'#ffffff');}
   if(b.b===3){A.poly([[x-18,y],[x+18,y],[x+14,y-28],[x-14,y-28]],fl?'#ffffff':b.hp<=15?'#8a2a3a':'#6a3a5a',1);C(x,y-30,11,fl?'#ffffff':'#8a6a7a');for(let i=0;i<5;i++)A.poly([[x-10+i*5,y-38],[x-8+i*5,y-48],[x-6+i*5,y-38]],K.y,1);R(x-6,y-33,4,3,K.r);R(x+2,y-33,4,3,K.r);}
   R(60,226,200,6,'#1a1020');R(60,226,200*b.hp/b.max,6,'#e04a6a');T(b.n,160,218,K.w,1,'c');}
  for(const s of shots){if(s.wave){R(s.x-4,s.y-6+OY,8,8,'#c0e070');}else{GA(.4);C(s.x,s.y+OY,s.r+2,'#ff9a4a');GA(1);C(s.x,s.y+OY,s.r,'#ffd06a');}}
  if(bomb){C(bomb.x,bomb.y+OY,4,'#2a2a3a');if(bomb.t%10<5)C(bomb.x+2,bomb.y-4+OY,1.5,K.r);}
  hero(px,py+OY);
  if(wallSide&&A.t%6===0)A.burst(px+wallSide*5,py-4+OY,'#cfe8ff',1,.5);
  if(fade){GA(fade/40);R(0,16,320,224,'#000000');GA(1);}
  // HUD
  R(0,0,320,16,'#0a0814');for(let i=0;i<hpMax;i++){const x=6+i*11;A.poly([[x,3],[x+8,3],[x+8,9],[x+4,13],[x,9]],i<hp?'#f0f0ff':'#2a2a3a',1);}
  const ic=[['dj','2J'],['dash','DS'],['wall','WC'],['bomb','BM']];ic.forEach((a,i)=>{const x=110+i*20;box(x,3,17,10,abil[a[0]]?'#3a2a78':'#14102a',abil[a[0]]?K.y:'#2a2a40');T(a[1],x+9,5,abil[a[0]]?K.y:'#4a4a60',1,'c');});
  T(''+g.score,250,5,K.w,1,'r');for(const k in RM){const[mx,my]=k.split(',').map(Number);R(262+mx*14,2+my*4,12,3,k===rx+','+ry?(A.t%20<10?K.y:K.c):seen[k]?'#5a5a8a':'#1a1a2a');}
  if(msgT){const w=Math.min(316,msg.length*4+10);box(160-w/2,22,w,13,'rgba(5,5,15,.85)','#5a5a8a');T(msg,160,26,K.w,1,'c');}
  if(mapT>20){GA(.92);R(20,30,280,190,'#0a0814');GA(1);A.box(20,30,280,190,K.c);T('MAP - '+RM[rx+','+ry].n,160,38,K.y,1,'c');
   for(const k in RM){const[mx,my]=k.split(',').map(Number);const x=40+mx*62,y=56+my*52;if(!seen[k]){R(x,y,56,44,'#14102a');continue;}box(x,y,56,44,'#2a2a5a',k===rx+','+ry?K.y:'#5a5a9a');T(RM[k].n.split(' ')[0],x+28,y+4,K.w,1,'c');if(RM[k].boss)T(beaten[RM[k].boss]?'BOSS X':'BOSS!',x+28,y+16,beaten[RM[k].boss]?K.gr:K.r,1,'c');if(RM[k].m.some(r=>r.indexOf('S')>=0))T('BENCH',x+28,y+28,K.y,1,'c');if(k===rx+','+ry){C(x+4+px/320*48,y+4+py/224*36,2.5,K.c);}}
   T('ABILITIES: '+(Object.keys(abil).length)+'/4   DEATHS '+deaths,160,210,K.gr,1,'c');}};
 return g;}});

/* ---- HERO QUEST: top-down adventure with items, keys, two dungeons and bosses ---- */
A.add({id:'heroquest',name:'HERO QUEST',cat:'ACTION',time:600,tags:'zelda link adventure top-down dungeon',how:'ARROWS MOVE, A SWORD, TAP B USES ITEM, HOLD B SWAPS ITEM. CLEAR BOTH DUNGEONS.',make(){
 const g={over:null,score:0},TS=16,OY=32;
 const R0={
  v:{n:'VILLAGE',ow:[0,1],ex:{n:'f',e:'fi'},m:['TTTTTTTTT..TTTTTTTTT','T..................T','T..####......####..T','T..####......####..T','T..##S#......##O#..T','T..................T','T...,...............','T.....b......b......','T..bb..........,...T','T......,...bb......T','T..,...............T','T.........,........T','TTTTTTTTTTTTTTTTTTTT'],en:[]},
  f:{n:'WHISPER WOODS',ow:[0,0],ex:{s:'v',e:'h'},warp:'d1a',m:['TTTTTTTTTTTTTTTTTTTT','TTTTTTT######TTTTTTT','TTTT...######...TTTT','TT.....##DD##.....TT','T..................T','T...T.......b...T..T','T...................','T..b..........T.....','T.....T............T','T..........b.......T','T...T..............T','T........,.....T...T','TTTTTTTTT..TTTTTTTTT'],en:[['sl',5,8],['sl',14,9],['oc',10,6]]},
  h:{n:'HIGH HILLS',ow:[1,0],ex:{w:'f',s:'fi',e:'m'},m:['####################','#..........#####...#','#..........#.C.#...#','#..........#...#...#','#..b.......##|##.E.#','#..................#','...........b.......%','...................%','#....#.......#.....#','#..................#','#...b........b.....#','#..................#','#########..#########'],en:[['oc',4,9],['oc',15,10],['sl',8,3]]},
  fi:{n:'OPEN FIELD',ow:[1,1],ex:{w:'v',n:'h',e:'l'},m:['TTTTTTTTT..TTTTTTTTT','T..................T','T..TT.........TT...T','T..................T','T.....b.....b......T','T..................T','....................','....................','T..................T','T...TT.......b.....T','T..........TT......T','T..................T','TTTTTTTTTTTTTTTTTTTT'],en:[['sl',6,3],['sl',13,9],['oc',9,5],['bt',15,3]]},
  l:{n:'MIRROR LAKE',ow:[2,1],ex:{w:'fi'},m:['TTTTTTTTTTTTTTTTTTTT','T..................T','T...~~~~~~~~~~~~...T','T...~~~~~~~~~~~~...T','T...~~~~...~~~~~...T','T...~~~~.H.~~~~~...T','....~~~~.P.~~~~~...T','....~~~~~~~~~~~~...T','T...~~~~~~~~~~~~...T','T..................T','T.........P........T','T.....b.......b....T','TTTTTTTTTTTTTTTTTTTT'],en:[['oc',17,4],['sl',3,10]]},
  m:{n:'EMBER PEAK',ow:[2,0],ex:{w:'h'},warp:'d2a',m:['####################','########....########','#######..DD..#######','#.....#........#...#','#..................#','#...#.......#......#','...................#','...................#','#.......#.......#..#','#..................#','#...#........#.....#','#..................#','####################'],en:[['oc',4,4],['oc',15,9],['bt',10,9],['bt',5,10]]},
  d1a:{n:'TEMPLE GATE',dg:1,ex:{n:'d1b',s:'@f'},m:['#########..#########','#..................#','#..#............#..#','#..................#','#..................#','#......#....#......#','#..................#','#..................#','#......#....#......#','#..................#','#..#............#..#','#..................#','#########..#########'],en:[['sl',5,4],['sl',14,4],['sl',9,9]]},
  d1b:{n:'ROOT CHAMBER',dg:1,key:1,ex:{s:'d1a',e:'d1c'},m:['####################','#..................#','#..................#','#...##........##...#','#..................#','#..................#','#..................L','#..................L','#..................#','#...##........##...#','#..................#','#..................#','#########..#########'],en:[['bt',4,2],['bt',15,2],['bt',9,5],['sl',5,10],['sl',14,10]]},
  d1c:{n:'BOW SHRINE',dg:1,ex:{w:'d1b',n:'d1x'},m:['####E####||#########','#..................#','#..................#','#..~~~~......~~~~..#','#..~~~~......~~~~..#','#........C.........#','...................#','...................#','#..~~~~......~~~~..#','#..~~~~......~~~~..#','#..................#','#..................#','####################'],en:[['oc',4,6],['oc',15,6]]},
  d1x:{n:'GOLEM POOL',dg:1,boss:1,ex:{s:'d1c'},m:['####################','#..................#','#..................#','#...#..........#...#','#..................#','#..................#','#..................#','#..................#','#..................#','#...#..........#...#','#..................#','#..................#','#########..#########'],en:[]},
  d2a:{n:'KEEP HALL',dg:2,ex:{n:'d2b',s:'@m'},m:['#########%%#########','#..................#','#..##..........##..#','#..................#','#..................#','#.......#..#.......#','#..................#','#..................#','#.......#..#.......#','#..................#','#..##..........##..#','#..................#','#########..#########'],en:[['kn',5,6],['kn',14,6]]},
  d2b:{n:'CHAIN VAULT',dg:2,ex:{s:'d2a',e:'d2c'},m:['####################','#.............~~~..#','#.............~~~..#','#.............~~~P.#','#.............~~~..#','#.............~~~..#','#.......C.....~~~...','#.............~~~...','#.............~~~..#','#............P~~~..#','#.............~~~..#','#.............~~~..#','#########..#########'],en:[['bt',6,3],['bt',9,9]]},
  d2c:{n:'GUARD ROOM',dg:2,key:2,ex:{w:'d2b',n:'d2x'},m:['#########LL#########','#..................#','#..#............#..#','#..................#','#.....#......#.....#','#..................#','...................#','...................#','#.....#......#.....#','#..................#','#..#............#..#','#..................#','####################'],en:[['kn',6,3],['kn',13,9],['bt',9,6],['bt',15,4]]},
  d2x:{n:'WYRM NEST',dg:2,boss:2,ex:{s:'d2c'},m:['####################','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#..................#','#########..#########'],en:[]}};
 const T_={};for(const k in R0)T_[k]=R0[k].m.map(r=>r.split(''));
 const CHEST={'h:13,2':'BOMBS','d1c:9,5':'BOW','d2b:8,6':'HOOK'};
 const SOL='T#~bPLE|C%SOX';
 let rm='v',px=160,py=120,dir=2,hp=6,hpMax=6,rup=10,keys=0,arrows=0,bombs=0,items=[],cur=0,swing=0,bHold=0,inv=0,kbx=0,kby=0,ens=[],shots=[],drops=[],bombO=null,hook=null,boss=null,flags={},msg='',msgT=0,shop=null,fade=0,deaths=0,cleared={},seen={v:1},beam=null,stun=0;
 const RR=()=>R0[rm],TM=()=>T_[rm];
 const tAt=(x,y)=>{const cx=Math.floor(x/TS),cy=Math.floor(y/TS);if(cx<0||cx>19||cy<0||cy>12)return'.';return TM()[cy][cx];};
 const setT=(cx,cy,c)=>{if(cx>=0&&cx<20&&cy>=0&&cy<13)TM()[cy][cx]=c;};
 const solidAt=(x,y)=>SOL.indexOf(tAt(x,y))>=0;
 const free=(x,y)=>!solidAt(x-5,y-5)&&!solidAt(x+5,y-5)&&!solidAt(x-5,y+5)&&!solidAt(x+5,y+5);
 const say=(m,t)=>{msg=m;msgT=t||150;};
 const DX=[0,1,0,-1],DY=[-1,0,1,0];
 const mkE=(k,cx,cy)=>{const b={k,x:cx*TS+8,y:cy*TS+8,hp:{sl:1,bt:1,oc:2,kn:4}[k],d:ri(4),t:ri(60),vx:0,vy:0,fl:0,kx:0,ky:0};return b;};
 const enter=(id,x,y)=>{rm=id;px=x;py=y;ens=[];shots=[];drops=[];bombO=null;hook=null;boss=null;beam=null;fade=12;if(!seen[id]){seen[id]=1;g.score+=25;}
  if(!(RR().key&&cleared[id]))for(const e of RR().en)ens.push(mkE(e[0],e[1],e[2]));
  if(RR().key&&cleared[id]&&!flags['kp'+id])drops.push({k:'KEY',x:160,y:110,t:1e9});const bb=RR().boss;if(bb&&flags['boss'+bb]){if(!flags['hc'+bb])drops.push({k:'HC',x:160,y:104,t:1e9,b:bb});if(bb===2)drops.push({k:'SUN',x:160,y:130,t:1e9});}
  if(RR().boss&&!flags['boss'+RR().boss]){boss=RR().boss===1?{b:1,n:'BOG GOLEM',x:160,y:70,hp:12,max:12,t:60,st:'walk',fl:0,r:14}:{b:2,n:'FLAME WYRM',x:160,y:60,hp:16,max:16,t:90,st:'swim',fl:0,r:9,a:0,seg:[]};if(boss.b===2)for(let i=0;i<7;i++)boss.seg.push({x:160,y:60});say(boss.n+' AWAKENS!',100);S('boom');}};
 const hurt=(sx,sy,d)=>{if(inv>0)return;hp-=d;inv=50;const a=Math.atan2(py-sy,px-sx);kbx=Math.cos(a)*3;kby=Math.sin(a)*3;S('hit');A.shake=4;if(hp<=0){deaths++;S('lose');hp=hpMax;rup=Math.floor(rup/2);say('YOU FELL... THE VILLAGE ELDER REVIVED YOU.',180);enter('v',160,120);}};
 const drop=(x,y)=>{const r=rnd(1);if(r<.35)drops.push({k:rnd(1)<.15?'R5':'R1',x,y,t:400});else if(r<.55)drops.push({k:'HT',x,y,t:400});else if(r<.65&&items.includes('BOW'))drops.push({k:'AR',x,y,t:400});else if(r<.75&&items.includes('BOMBS'))drops.push({k:'BM',x,y,t:400});};
 const killE=e=>{e.dead=1;g.score+=10;A.burst(e.x,e.y+OY,'#ffffff',10,1.6);S('score');drop(e.x,e.y);};
 const dmgE=(e,d,sx,sy,blockable)=>{if(e.k==='kn'&&blockable){const fx=DX[e.d],fy=DY[e.d];const ax_=Math.sign(sx-e.x),ay_=Math.sign(sy-e.y);if((fx&&fx===ax_&&Math.abs(sx-e.x)>Math.abs(sy-e.y))||(fy&&fy===ay_&&Math.abs(sy-e.y)>=Math.abs(sx-e.x))){S('blip');A.burst(e.x+fx*6,e.y+fy*6+OY,'#c0c0d0',4,1);return false;}}
  if(e.fl)return false;e.hp-=d;e.fl=14;const a=Math.atan2(e.y-sy,e.x-sx);e.kx=Math.cos(a)*3;e.ky=Math.sin(a)*3;S('hit');if(e.hp<=0)killE(e);return true;};
 const dmgBoss=(d,isHook)=>{const b=boss;if(!b||b.fl)return;if(isHook&&b.b===2){b.stun=90;S('hit');say('THE WYRM IS STUNNED!',60);return;}b.hp-=d;b.fl=16;S('hit');A.shake=3;if(b.hp<=0){g.score+=500;S('win');A.shake=12;A.burst(b.x,b.y+OY,K.y,50,3);flags['boss'+b.b]=1;drops.push({k:'HC',x:160,y:104,t:1e9,b:b.b});if(b.b===2)drops.push({k:'SUN',x:160,y:130,t:1e9});boss=null;shots=[];say(b.b===1?'THE GOLEM CRUMBLES! TAKE THE HEART.':'THE WYRM IS SLAIN! CLAIM THE SUN SHARD!',200);}};
 const explode=(x,y)=>{S('boom');A.shake=10;A.burst(x,y+OY,K.o,30,3);for(let cy=0;cy<13;cy++)for(let cx=0;cx<20;cx++){const d=Math.hypot(cx*TS+8-x,cy*TS+8-y);if(d<30&&TM()[cy][cx]==='%'){setT(cx,cy,'.');g.score+=20;A.burst(cx*TS+8,cy*TS+8+OY,'#8a8a8a',10,2);S('win');}if(d<26&&TM()[cy][cx]==='b')setT(cx,cy,'.');}
  for(const e of ens)if(Math.hypot(e.x-x,e.y-y)<30)dmgE(e,3,x,y,false);if(boss&&Math.hypot(boss.x-x,boss.y-y)<34)dmgBoss(3);if(Math.hypot(px-x,py-y)<20)hurt(x,y,1);};
 const pickup=k=>{if(k==='R1')rup++;if(k==='R5')rup+=5;if(k==='HT')hp=Math.min(hpMax,hp+2);if(k==='AR')arrows+=5;if(k==='BM')bombs+=3;if(k==='HC'){hpMax+=2;hp=hpMax;g.score+=150;say('HEART CONTAINER! MAX LIFE UP.',150);S('win');return;}if(k==='SUN'){g.score+=1000+Math.max(0,500-deaths*60);g.over='QUEST COMPLETE!';return;}S('coin');g.score+=k==='R5'?5:1;};
 const openChest=(cx,cy)=>{const key=rm+':'+cx+','+cy,it=CHEST[key];setT(cx,cy,'.');if(!it)return;items.push(it);cur=items.length-1;g.score+=200;S('win');A.confetti();if(it==='BOW'){arrows+=15;say('YOU GOT THE BOW! TAP B TO SHOOT. HIT EYE SWITCHES.',220);}if(it==='BOMBS'){bombs+=8;say('YOU GOT BOMBS! TAP B TO PLACE. CRACKED ROCK BREAKS.',220);}if(it==='HOOK'){say('YOU GOT THE HOOKSHOT! TAP B TO PULL TO POSTS.',220);}};
 const shopL=()=>[{n:'ARROWS X10',p:20,ok:()=>items.includes('BOW'),f:()=>arrows+=10},{n:'BOMBS X5',p:30,ok:()=>items.includes('BOMBS'),f:()=>bombs+=5},{n:'RED POTION',p:40,f:()=>hp=hpMax},{n:'HEART PIECE',p:120,ok:()=>!flags.hp1,f:()=>{flags.hp1=1;hpMax+=2;hp=hpMax;}}];
 const TIPS=['THE WOODS TO THE NORTH HIDE A TEMPLE. TAKE CARE.','A BOW CAN WAKE A SLEEPING EYE.','CRACKED ROCK FEARS BOMBS. EAST OF THE HILLS...','ARMORED GUARDS ONLY FEAR A BLOW FROM BEHIND.','THEY SAY A HEART RESTS ON THE LAKE ISLAND.'];
 const useItem=()=>{const it=items[cur];if(!it){say('NO ITEM YET. EXPLORE!',60);return;}
  if(it==='BOW'){if(arrows<=0){say('NO ARROWS. BUY SOME IN THE VILLAGE.',80);S('lose');return;}arrows--;shots.push({x:px+DX[dir]*8,y:py+DY[dir]*8,vx:DX[dir]*4.5,vy:DY[dir]*4.5,mine:1,arrow:1,d:2,life:80});S('shoot');}
  if(it==='BOMBS'){if(bombs<=0||bombO){if(!bombs)say('NO BOMBS LEFT.',60);return;}bombs--;bombO={x:px+DX[dir]*14,y:py+DY[dir]*14,t:60};S('blip');}
  if(it==='HOOK'&&!hook){hook={x:px,y:py,d:dir,len:0,st:'out'};S('shoot');}};
 g.dbg={get:()=>({rm,px,py,hp,items,keys,boss:!!boss,arrows,bombs}),set:o=>{if(o.rm)enter(o.rm,o.px||160,o.py||120);if(o.items)items=o.items;if(o.arrows)arrows=o.arrows;if(o.bombs)bombs=o.bombs;if(o.keys)keys=o.keys;if(o.dir!==undefined)dir=o.dir;if(o.px)px=o.px;if(o.py)py=o.py;}};
 enter('v',160,120);say('A SWORD AND A SHIELD. GO! THE ELDER KNOWS MORE.',200);
 g.update=()=>{const k=A.in(0),h=A.hit(0);if(msgT)msgT--;if(fade)fade--;if(inv)inv--;if(swing)swing--;
  if(shop){if(h.u)shop.i=(shop.i+3)%4;if(h.d)shop.i=(shop.i+1)%4;if(h.b){shop=null;return;}if(h.a){const it=shop.L[shop.i];if(it.ok&&!it.ok()){say('NOT AVAILABLE YET.',60);S('lose');}else if(rup<it.p){say('NOT ENOUGH RUPEES.',60);S('lose');}else{rup-=it.p;it.f();S('coin');say('THANK YOU!',60);}}return;}
  // hookshot travel
  if(hook){const sp=5;if(hook.st==='out'){hook.len+=sp;const hx=px+DX[hook.d]*hook.len,hy=py+DY[hook.d]*hook.len;const c=tAt(hx,hy);
    for(const e of ens)if(Math.hypot(e.x-hx,e.y-hy)<9){dmgE(e,1,px,py,false);hook.st='back';}if(boss&&Math.hypot(boss.x-hx,boss.y-hy)<boss.r+4){dmgBoss(1,true);hook.st='back';}
    if(c==='P'||c==='C'){hook.st='pull';hook.tx=Math.floor(hx/TS)*TS+8;hook.ty=Math.floor(hy/TS)*TS+8;S('hit');}else if(SOL.indexOf(c)>=0&&c!=='~'||hook.len>=112){hook.st='back';}}
   else if(hook.st==='back'){hook.len-=7;if(hook.len<=0)hook=null;}
   else if(hook.st==='pull'){const d=Math.hypot(hook.tx-px,hook.ty-py);if(d>14){px+=(hook.tx-px)/d*5;py+=(hook.ty-py)/d*5;hook.len=d;}else{let best=null,bd=-1e9;for(let i=0;i<4;i++){const nx=hook.tx+DX[i]*16,ny=hook.ty+DY[i]*16;if(free(nx,ny)){const sc=DX[i]*DX[hook.d]+DY[i]*DY[hook.d];if(sc>bd){bd=sc;best=[nx,ny];}}}if(best){px=best[0];py=best[1];}hook=null;}}
   if(hook&&hook.st==='pull')return;}
  // movement
  let mx=ax(k),my=ay(k);if(kbx||kby){mx=0;my=0;const nx=px+kbx,ny=py+kby;if(free(nx,py))px=nx;if(free(px,ny))py=ny;kbx*=.75;kby*=.75;if(Math.abs(kbx)+Math.abs(kby)<.3)kbx=kby=0;}
  if(!swing&&!hook&&(mx||my)){if(mx&&!my)dir=mx>0?1:3;else if(my&&!mx)dir=my>0?0+2:0;else if(mx&&my&&!((DX[dir]===mx&&mx)||(DY[dir]===my&&my)))dir=my>0?2:0;const s=1.35;const nx=px+mx*s,ny=py+my*s;if(free(nx,py))px=nx;else if(!my){if(free(nx,py-4))py-=.7;else if(free(nx,py+4))py+=.7;}if(free(px,ny))py=ny;else if(!mx){if(free(px-4,ny))px-=.7;else if(free(px+4,ny))px+=.7;}}
  // edges
  const ex=RR().ex;const edge=(d,nx,ny)=>{const t=ex[d];if(!t)return;if(t[0]==='@'){const o=t.slice(1);const m=T_[o];let wx=160,wy=120;m.forEach((r,y)=>{const i=r.indexOf('D');if(i>=0){wx=i*TS+16;wy=y*TS+24;}});enter(o,wx,wy+8);dir=2;return;}enter(t,nx,ny);};
  if(py<2)edge('n',px,200);else if(py>206)edge('s',px,8);else if(px<2)edge('w',314,py);else if(px>318)edge('e',6,py);
  if(boss){px=cl(px,20,300);py=cl(py,20,186);}
  // warp
  if(tAt(px,py)==='D'&&RR().warp){enter(RR().warp,160,190);dir=0;S('jump');return;}
  // B: tap uses / hold swaps
  if(k.b){bHold++;if(bHold===22&&items.length>1){cur=(cur+1)%items.length;S('coin');say('ITEM: '+items[cur],60);}}else{if(bHold>0&&bHold<22)useItem();bHold=0;}
  // A: interact or swing
  if(h.a&&!swing){const fx=px+DX[dir]*12,fy=py+DY[dir]*12,c=tAt(fx,fy),cx=Math.floor(fx/TS),cy=Math.floor(fy/TS);
   if(c==='C'){openChest(cx,cy);}else if(c==='S'){shop={i:0,L:shopL()};S('blip');}else if(c==='O'){say('ELDER: '+TIPS[(flags.tip=(flags.tip||0)+1)%TIPS.length],200);S('blip');}
   else{swing=14;S('shoot');if(hp>=hpMax&&!beam){beam={x:px,y:py,vx:DX[dir]*4,vy:DY[dir]*4,d:dir,life:60};}}}
  if(swing===10){const sx=px+DX[dir]*14,sy=py+DY[dir]*14;for(const e of ens)if(Math.abs(e.x-sx)<15&&Math.abs(e.y-sy)<15)dmgE(e,1,px,py,true);if(boss&&Math.hypot(boss.x-sx,boss.y-sy)<boss.r+10)dmgBoss(1);
   for(const[ox,oy]of[[0,0],[DY[dir]*8,DX[dir]*8],[-DY[dir]*8,-DX[dir]*8]]){const cx=Math.floor((sx+ox)/TS),cy=Math.floor((sy+oy)/TS);if(tAt(sx+ox,sy+oy)==='b'){setT(cx,cy,'.');A.burst(cx*TS+8,cy*TS+8+OY,'#4ab04a',8,1.5);if(rnd(1)<.3)drop(cx*TS+8,cy*TS+8);g.score+=1;}}}
  // locked doors
  if(keys>0){const fx=px+DX[dir]*10,fy=py+DY[dir]*10;if(tAt(fx,fy)==='L'&&(mx||my)){keys--;for(let cy=0;cy<13;cy++)for(let cx=0;cx<20;cx++)if(TM()[cy][cx]==='L')setT(cx,cy,'.');S('win');say('UNLOCKED!',60);}}
  else{const fx=px+DX[dir]*10,fy=py+DY[dir]*10;if(tAt(fx,fy)==='L'&&(mx||my)&&!msgT)say('LOCKED. FIND A SMALL KEY.',80);}
  // bomb
  if(bombO&&--bombO.t<=0){explode(bombO.x,bombO.y);bombO=null;}
  // beam
  if(beam){beam.x+=beam.vx;beam.y+=beam.vy;beam.life--;for(const e of ens)if(Math.abs(e.x-beam.x)<10&&Math.abs(e.y-beam.y)<10){dmgE(e,1,beam.x-beam.vx*4,beam.y-beam.vy*4,true);beam.life=0;}if(boss&&Math.hypot(boss.x-beam.x,boss.y-beam.y)<boss.r+4){dmgBoss(1);beam.life=0;}if(solidAt(beam.x,beam.y)&&tAt(beam.x,beam.y)!=='~')beam.life=0;if(beam.life<=0)beam=null;}
  // shots
  for(const s of shots){s.x+=s.vx;s.y+=s.vy;s.life--;const c=tAt(s.x,s.y);
   if(s.mine){if(c==='E'){s.life=0;const cx=Math.floor(s.x/TS),cy=Math.floor(s.y/TS);setT(cx,cy,'e');for(let y=0;y<13;y++)for(let x=0;x<20;x++)if(TM()[y][x]==='|')setT(x,y,'.');S('win');say('THE EYE OPENS A PASSAGE!',100);g.score+=30;}
    for(const e of ens)if(Math.abs(e.x-s.x)<9&&Math.abs(e.y-s.y)<9){dmgE(e,s.d,s.x-s.vx*3,s.y-s.vy*3,true);s.life=0;}if(boss&&Math.hypot(boss.x-s.x,boss.y-s.y)<boss.r+3){dmgBoss(2);s.life=0;}if(SOL.indexOf(c)>=0&&c!=='~')s.life=0;}
   else{if(SOL.indexOf(c)>=0&&c!=='~'&&!s.fire)s.life=0;if(Math.abs(s.x-px)<7&&Math.abs(s.y-py)<7){const facing=(DX[dir]&&Math.sign(-s.vx)===DX[dir]&&Math.abs(s.vx)>Math.abs(s.vy))||(DY[dir]&&Math.sign(-s.vy)===DY[dir]&&Math.abs(s.vy)>=Math.abs(s.vx));if(facing&&!swing&&!s.fire){S('blip');A.burst(s.x,s.y+OY,'#c0d0ff',5,1);s.life=0;}else{hurt(s.x,s.y,s.d||1);s.life=0;}}}}
  shots=shots.filter(s=>s.life>0&&s.x>-5&&s.x<325&&s.y>-5&&s.y<213);
  // enemies
  for(const e of ens){if(e.fl)e.fl--;if(e.kx||e.ky){const nx=e.x+e.kx,ny=e.y+e.ky;if(free(nx,ny)){e.x=nx;e.y=ny;}e.kx*=.7;e.ky*=.7;if(Math.abs(e.kx)+Math.abs(e.ky)<.2)e.kx=e.ky=0;}
   e.t--;if(e.k==='sl'){if(e.t<=0){e.t=40+ri(40);const a=ri(5);e.vx=[0,.7,-.7,0,0][a];e.vy=[0,0,0,.7,-.7][a];}if(free(e.x+e.vx,e.y+e.vy)){e.x+=e.vx;e.y+=e.vy;}else e.t=0;}
   if(e.k==='bt'){if(e.t<=0){e.t=20+ri(30);const a=rnd(6.28);e.vx=Math.cos(a)*1.3;e.vy=Math.sin(a)*1.3;}e.x=cl(e.x+e.vx,20,300);e.y=cl(e.y+e.vy,20,190);}
   if(e.k==='oc'){if(e.t<=0){if(rnd(1)<.4){shots.push({x:e.x+DX[e.d]*8,y:e.y+DY[e.d]*8,vx:DX[e.d]*2.4,vy:DY[e.d]*2.4,life:120,d:1});S('shoot');e.t=50;}else{e.d=rnd(1)<.5?(Math.abs(px-e.x)>Math.abs(py-e.y)?(px>e.x?1:3):(py>e.y?2:0)):ri(4);e.t=50+ri(40);}}else{const nx=e.x+DX[e.d]*.6,ny=e.y+DY[e.d]*.6;if(free(nx,ny)){e.x=nx;e.y=ny;}else e.d=ri(4);}}
   if(e.k==='kn'){if(e.t<=0){e.t=30+ri(30);e.d=Math.abs(px-e.x)>Math.abs(py-e.y)?(px>e.x?1:3):(py>e.y?2:0);if(rnd(1)<.3)e.d=ri(4);}const nx=e.x+DX[e.d]*.55,ny=e.y+DY[e.d]*.55;if(free(nx,ny)){e.x=nx;e.y=ny;}else e.t=0;}
   if(Math.abs(e.x-px)<11&&Math.abs(e.y-py)<11)hurt(e.x,e.y,e.k==='kn'?2:1);}
  ens=ens.filter(e=>!e.dead);
  if(RR().key&&!cleared[rm]&&!ens.length){cleared[rm]=1;drops.push({k:'KEY',x:160,y:110,t:1e9});S('score');say('A SMALL KEY APPEARS!',100);}
  for(const d of drops){d.t--;if(Math.abs(d.x-px)<10&&Math.abs(d.y-py)<10){d.t=0;if(d.k==='KEY'){keys++;flags['kp'+rm]=1;S('win');g.score+=20;}else{if(d.k==='HC'&&d.b)flags['hc'+d.b]=1;pickup(d.k);}}}drops=drops.filter(d=>d.t>0);
  if(tAt(px,py)==='H'){setT(Math.floor(px/TS),Math.floor(py/TS),'.');pickup('HC');}
  if(boss)bossUp();};
 const bossUp=()=>{const b=boss;if(b.fl)b.fl--;b.t--;
  if(b.b===1){if(b.st==='walk'){const d=Math.hypot(px-b.x,py-b.y)||1;b.x+=(px-b.x)/d*.45;b.y+=(py-b.y)/d*.45;if(b.t<=0){b.st=rnd(1)<.5?'spit':'stomp';b.t=40;}}
   else if(b.st==='spit'){if(b.t===20){const a=Math.atan2(py-b.y,px-b.x);for(let i=-1;i<=1;i++)shots.push({x:b.x,y:b.y,vx:Math.cos(a+i*.35)*2.2,vy:Math.sin(a+i*.35)*2.2,life:140,d:1});S('shoot');}if(b.t<=0){b.st='walk';b.t=70+ri(50);}}
   else if(b.st==='stomp'){if(b.t===10){A.shake=10;S('boom');for(let i=0;i<8;i++){const a=i/8*6.283;shots.push({x:b.x,y:b.y,vx:Math.cos(a)*1.8,vy:Math.sin(a)*1.8,life:90,d:1,fire:1});}}if(b.t<=0){b.st='walk';b.t=80;}}
   if(Math.hypot(px-b.x,py-b.y)<b.r+6)hurt(b.x,b.y,2);}
  if(b.b===2){b.seg.unshift({x:b.x,y:b.y});b.seg.length=Math.min(b.seg.length,42);if(b.stun>0){b.stun--;}else{b.a+=.022;const tx=160+Math.cos(b.a)*110,ty=100+Math.sin(b.a*1.7)*70;b.x+=(tx-b.x)*.05;b.y+=(ty-b.y)*.05;
   if(b.t<=0){const a=Math.atan2(py-b.y,px-b.x);for(let i=-2;i<=2;i++)shots.push({x:b.x,y:b.y,vx:Math.cos(a+i*.25)*2.4,vy:Math.sin(a+i*.25)*2.4,life:160,d:1});S('shoot');b.t=b.hp<8?55:85;}}
   if(Math.hypot(px-b.x,py-b.y)<b.r+6)hurt(b.x,b.y,2);for(let i=6;i<b.seg.length;i+=6){const s=b.seg[i];if(Math.hypot(px-s.x,py-s.y)<10)hurt(s.x,s.y,1);}}};
 // ---- drawing ----
 const OWC={g:'#5cb85a',g2:'#4ea84c'},DGC=['#5a5a86','#7a4a46'];
 const tile=(c,x,y,cx,cy,dg)=>{const C_=A.c;
  if(c==='T'){C_.fillStyle='#2a6a2a';C_.fillRect(x,y,TS,TS);C(x+8,y+7,8,'#3a8a3a');C(x+5,y+5,3,'#5aaa5a');R(x+6,y+13,4,3,'#5a3a1a');return;}
  if(c==='#'){if(dg){C_.fillStyle=DGC[dg-1];C_.fillRect(x,y,TS,TS);C_.fillStyle='rgba(0,0,0,.3)';C_.fillRect(x,y+7,TS,1);C_.fillRect(x+((cy%2)*8),y,1,7);C_.fillRect(x+((cy%2)*8+4)%16,y+8,1,8);}else{C_.fillStyle='#9a7a5a';C_.fillRect(x,y,TS,TS);C_.fillStyle='#7a5a3a';C_.fillRect(x,y+10,TS,6);C_.fillStyle='rgba(255,255,255,.15)';C_.fillRect(x+3,y+3,5,2);}return;}
  if(c==='~'){C_.fillStyle='#2a6ad0';C_.fillRect(x,y,TS,TS);C_.fillStyle='rgba(255,255,255,.3)';C_.fillRect(x+((cx*5+A.t/6)|0)%12,y+(cy*7)%12+2,4,1);return;}
  if(c==='b'){C(x+8,y+9,7,'#2a8a3a');C(x+6,y+7,3,'#4ab04a');return;}
  if(c==='%'){R(x,y,TS,TS,'#8a8a8a');L(x+3,y+3,x+9,y+9,'#3a3a3a',1);L(x+9,y+9,x+13,y+4,'#3a3a3a',1);L(x+9,y+9,x+7,y+14,'#3a3a3a',1);return;}
  if(c==='P'){R(x+5,y+2,6,13,'#8a5a2a');R(x+4,y+1,8,3,'#c08a4a');C(x+8,y+3,1.5,'#3a3a3a');return;}
  if(c==='L'){R(x,y,TS,TS,'#6a4a2a');R(x+5,y+5,6,7,K.y);R(x+7,y+8,2,3,'#3a2a1a');return;}
  if(c==='E'||c==='e'){R(x,y,TS,TS,dg?DGC[dg-1]:'#9a7a5a');C(x+8,y+8,6,'#ffffff');C(x+8,y+8,3,c==='E'?K.r:K.g);C(x+8,y+8,1.2,'#000000');return;}
  if(c==='|'){for(let i=0;i<4;i++)R(x+1+i*4,y,2,TS,'#a0a0b8');return;}
  if(c==='C'){R(x+2,y+4,12,10,'#8a5a2a');R(x+2,y+4,12,4,'#a86a3a');R(x+7,y+7,2,3,K.y);return;}
  if(c==='D'){R(x,y,TS,TS,'#0a0a0a');return;}
  if(c==='S'){R(x,y,TS,TS,'#c0a070');R(x,y+10,TS,6,'#8a5a2a');A.poly([[x+8,y+1],[x+11,y+5],[x+8,y+9],[x+5,y+5]],'#3dff8b',1);return;}
  if(c==='O'){R(x,y,TS,TS,'#c0a070');A.person(x+8,y+15,{c:'#a03a3a',hair:'#e8e0d0',s:.45});return;}
  if(c==='H'){C(x+5,y+7,4,K.r);C(x+11,y+7,4,K.r);A.poly([[x+1,y+8],[x+15,y+8],[x+8,y+15]],K.r,1);return;}
  if(c===','){C_.fillStyle='#ffd0e0';C_.fillRect(x+4,y+5,2,2);C_.fillRect(x+10,y+9,2,2);}};
 const hero=()=>{const x=px,y=py+OY,c=A.c;if(inv&&A.t%6<3)return;A.person(x,y+8,{c:'#3a6ad8',pants:'#5a3a2a',hair:'#8a5a2a',s:.55,st:(ax(A.in(0))||ay(A.in(0)))?A.t*.3:0,d:dir===3?-1:1,id:1});
  const sx=dir===3?-1:1;if(dir!==0){R(x+(dir===1?3:dir===3?-7:-6),y-3,4,7,'#8a8aa0');R(x+(dir===1?4:dir===3?-6:-5),y-2,2,5,'#c0c0d8');}
  if(swing){const p=(14-swing)/14,a0=dir*Math.PI/2-Math.PI/2,a=a0-1+p*2;L(x+Math.cos(a)*4,y-4+Math.sin(a)*4,x+Math.cos(a)*16,y-4+Math.sin(a)*16,'#e8f0ff',2);GA(.3);c.strokeStyle='#ffffff';c.lineWidth=3;c.beginPath();c.arc(x,y-4,14,a0-1,a,false);c.stroke();GA(1);}
  if(hook){const hx=px+DX[hook.d]*hook.len,hy=py+DY[hook.d]*hook.len+OY;L(x,y-2,hx,hy,'#c0c0c0',1);C(hx,hy,2.5,'#e0e0f0');}};
 const enemy=e=>{const x=e.x,y=e.y+OY,fl=e.fl&&e.fl%4<2;if(e.k==='sl'){const sq=Math.sin(A.t*.2+x)*1.5;A.c.fillStyle=fl?'#ffffff':'#4ad0a0';A.c.beginPath();A.c.ellipse(x,y+2,7+sq*.5,6-sq*.5,0,0,6.283);A.c.fill();R(x-3,y,2,2,'#1a1a1a');R(x+1,y,2,2,'#1a1a1a');}
  if(e.k==='bt'){const w=Math.sin(A.t*.5)*4;A.poly([[x,y],[x-9,y-4-w],[x-4,y+2]],fl?'#ffffff':'#5a3a7a',1);A.poly([[x,y],[x+9,y-4-w],[x+4,y+2]],fl?'#ffffff':'#5a3a7a',1);C(x,y,3,fl?'#ffffff':'#3a2a5a');R(x-2,y-1,1,1,K.y);R(x+1,y-1,1,1,K.y);}
  if(e.k==='oc'){C(x,y,7,fl?'#ffffff':'#e05a4a');R(x+DX[e.d]*6-2,y+DY[e.d]*6-2,4,4,'#a03a2a');R(x-3,y-3,2,2,'#ffffff');R(x+1,y-3,2,2,'#ffffff');for(let i=0;i<4;i++)R(x-6+i*4,y+5,2,3,'#c04a3a');}
  if(e.k==='kn'){R(x-6,y-7,12,14,fl?'#ffffff':'#5a6a8a');R(x-4,y-9,8,5,'#8a9aba');R(x-2,y-6,4,1,K.r);R(x+DX[e.d]*7-(DX[e.d]?2:5),y+DY[e.d]*7-(DY[e.d]?2:5),DX[e.d]?4:10,DY[e.d]?4:10,'#c0a050');}};
 g.draw=()=>{const dg=RR().dg||0,C_=A.c;C_.fillStyle=dg?(dg===1?'#2a2a3a':'#3a2a2a'):OWC.g;C_.fillRect(0,OY,320,208);
  if(!dg){C_.fillStyle=OWC.g2;for(let i=0;i<40;i++){C_.fillRect((i*53)%320,OY+(i*37)%208,2,3);}}else{C_.fillStyle='rgba(255,255,255,.04)';for(let y=0;y<13;y++)for(let x=(y%2);x<20;x+=2)C_.fillRect(x*TS,OY+y*TS,TS,TS);}
  const tm=TM();for(let y=0;y<13;y++)for(let x=0;x<20;x++){const c=tm[y][x];if(c!=='.')tile(c,x*TS,y*TS+OY,x,y,dg);}
  if(rm==='v'){const house=(bx,wall,roof,sign)=>{const x=bx*TS,y=2*TS+OY;R(x,y+6,64,42,wall);R(x,y+44,64,4,A.mix(wall,'#000000',.3));A.poly([[x-4,y+10],[x+10,y-8],[x+54,y-8],[x+68,y+10]],roof,1);R(x+6,y+16,12,10,'#a8d8ff');R(x+46,y+16,12,10,'#a8d8ff');R(x+6,y+21,12,1,'#5a3a2a');R(x+46,y+21,12,1,'#5a3a2a');if(sign){R(x+20,y-4,24,9,'#f0e0b0');T('SHOP',x+32,y-2,'#8a3a2a',1,'c');}};
   house(3,'#e8d0a8','#c04a3a',1);house(13,'#d8c8e0','#4a6ab0',0);R(5*TS,4*TS+OY,TS,TS,'#8a5a2a');R(5*TS,4*TS+OY+2,TS,3,'#c08a4a');A.poly([[5*TS+8,4*TS+OY+7],[5*TS+11,4*TS+OY+11],[5*TS+8,4*TS+OY+15],[5*TS+5,4*TS+OY+11]],'#3dff8b',1);R(15*TS,4*TS+OY,TS,TS,'#5a3a2a');A.person(15*TS+8,4*TS+OY+15,{c:'#a03a3a',hair:'#e8e0d0',s:.5});}
  for(const d of drops){const x=d.x,y=d.y+OY+Math.sin(A.t*.15)*1.5;if(d.t<90&&A.t%6<3)continue;if(d.k==='R1'||d.k==='R5'){A.poly([[x,y-5],[x+3,y],[x,y+5],[x-3,y]],d.k==='R5'?'#4a8aff':'#3dff8b',1);}else if(d.k==='HT'||d.k==='HC'){const s=d.k==='HC'?1.6:1;C(x-2*s,y-1,2.5*s,K.r);C(x+2*s,y-1,2.5*s,K.r);A.poly([[x-4.5*s,y],[x+4.5*s,y],[x,y+5*s]],K.r,1);}else if(d.k==='KEY'){R(x-1,y-5,2,9,K.y);C(x,y-5,3,K.y);R(x,y+2,3,2,K.y);}else if(d.k==='AR'){L(x-4,y+3,x+4,y-3,'#c0a070',1.5);}else if(d.k==='BM'){C(x,y,4,'#2a2a5a');}else if(d.k==='SUN'){GA(.4);C(x,y,14+Math.sin(A.t*.1)*3,'#ffe08a');GA(1);A.poly([[x,y-8],[x+7,y],[x,y+8],[x-7,y]],K.y,1);}}
  if(bombO){C(bombO.x,bombO.y+OY,5,'#2a2a5a');if(bombO.t%10<5)C(bombO.x+3,bombO.y-5+OY,1.5,K.o);}
  for(const e of ens)enemy(e);
  if(boss){const b=boss,fl=b.fl&&b.fl%4<2;if(b.b===1){C(b.x,b.y+OY,b.r,fl?'#ffffff':'#6a5a3a');C(b.x-4,b.y-5+OY,6,fl?'#ffffff':'#8a7a4a');R(b.x-7,b.y-4+OY,4,3,b.st==='walk'?K.y:K.r);R(b.x+3,b.y-4+OY,4,3,b.st==='walk'?K.y:K.r);C(b.x-14,b.y+6+OY,5,'#5a4a2a');C(b.x+14,b.y+6+OY,5,'#5a4a2a');}
   else{for(let i=b.seg.length-1;i>=6;i-=6){const s=b.seg[i];C(s.x,s.y+OY,8-i/12,fl?'#ffffff':'#c04a2a');C(s.x,s.y-2+OY,3,'#ffa04a');}C(b.x,b.y+OY,b.r,b.stun?'#8a8aff':fl?'#ffffff':'#e05a2a');R(b.x-5,b.y-4+OY,3,3,K.y);R(b.x+2,b.y-4+OY,3,3,K.y);A.poly([[b.x-8,b.y-6+OY],[b.x-12,b.y-14+OY],[b.x-4,b.y-8+OY]],'#ffd06a',1);A.poly([[b.x+8,b.y-6+OY],[b.x+12,b.y-14+OY],[b.x+4,b.y-8+OY]],'#ffd06a',1);}
   R(60,OY+200,200,5,'#1a1020');R(60,OY+200,200*b.hp/b.max,5,'#e04a6a');T(b.n,160,OY+192,K.w,1,'c');}
  hero();
  for(const s of shots){if(s.arrow){L(s.x-s.vx*1.5,s.y-s.vy*1.5+OY,s.x+s.vx*.5,s.y+s.vy*.5+OY,'#e0d0a0',1.5);}else{C(s.x,s.y+OY,3,s.fire?'#ff8a3a':'#c08a5a');}}
  if(beam){GA(.8);C(beam.x,beam.y+OY,4,'#bfe8ff');GA(1);L(beam.x-beam.vx*2,beam.y-beam.vy*2+OY,beam.x+beam.vx,beam.y+beam.vy+OY,'#ffffff',2);}
  if(fade){GA(fade/12);R(0,OY,320,208,'#000000');GA(1);}
  // HUD
  R(0,0,320,OY,'#0a0a14');R(0,OY-1,320,1,'#3a3a5a');
  for(let i=0;i<hpMax/2;i++){const x=8+(i%8)*11,y=6+(i/8|0)*10,v=hp-i*2;const col=v>=2?K.r:v===1?'#ff9aa0':'#3a2a3a';C(x-2,y,2.6,col);C(x+2,y,2.6,col);A.poly([[x-4.6,y+.5],[x+4.6,y+.5],[x,y+5]],col,1);}
  A.poly([[8,22],[11,26],[8,30],[5,26]],'#3dff8b',1);T(''+rup,14,24,K.w,1);R(40,23,2,6,K.y);C(41,23,2,K.y);T(''+keys,46,24,K.w,1);
  if(items.includes('BOW'))T('ARW '+arrows,60,24,K.gr,1);if(items.includes('BOMBS'))T('BMB '+bombs,100,24,K.gr,1);
  box(140,4,26,24,'#14142a',K.y);T('B',143,6,K.y,1);const it=items[cur];if(it==='BOW'){A.c.strokeStyle='#c08a4a';A.c.lineWidth=1.5;A.c.beginPath();A.c.arc(150,16,7,-1.2,1.2);A.c.stroke();L(152,9,152,23,'#e0e0e0',.5);}else if(it==='BOMBS'){C(153,17,6,'#2a2a5a');R(153,9,1,3,K.o);}else if(it==='HOOK'){L(146,22,158,10,'#c0c0c0',1.5);C(158,10,2.5,'#e0e0f0');}
  T(RR().n,240,6,dg?K.p:K.c,1,'c');const ow=RR().ow;if(!dg){for(const id in R0){const o=R0[id].ow;if(!o)continue;R(206+o[0]*24,14+o[1]*8,22,7,id===rm?(A.t%20<10?K.y:K.c):seen[id]?'#3a5a3a':'#1a1a2a');}}else{const ids=Object.keys(R0).filter(i=>R0[i].dg===dg);ids.forEach((id,i)=>{R(206+i*20,15,18,10,id===rm?(A.t%20<10?K.y:K.c):seen[id]?'#5a3a5a':'#1a1a2a');if(R0[id].boss)T('!',215+i*20,17,K.r,1,'c');});}
  T(''+g.score,316,24,K.w,1,'r');
  if(msgT){const w=Math.min(316,msg.length*4+10);box(160-w/2,OY+4,w,13,'rgba(5,5,15,.85)','#5a5a8a');T(msg,160,OY+8,K.w,1,'c');}
  if(shop){box(80,70,160,100,'#1a1428',K.y);T('VILLAGE SHOP',160,76,K.y,1,'c');T('RUPEES '+rup,160,86,K.w,1,'c');shop.L.forEach((it,i)=>{const y=100+i*13,on=i===shop.i,dis=(it.ok&&!it.ok())||rup<it.p;if(on)R(84,y-3,152,11,'#3a2a5a');T((on?'> ':'  ')+it.n,88,y,dis?'#6a6a7a':on?K.y:K.w,1);T(''+it.p,232,y,dis?'#6a6a7a':'#3dff8b',1,'r');});T('A BUY   B LEAVE',160,158,K.gr,1,'c');}};
 return g;}});

/* ---- TERRA BLOCK: generated 2D sandbox with mining, crafting stations, ores, night monsters and a summoned boss ---- */
A.add({id:'terrablock',name:'TERRA BLOCK',cat:'SIM',time:900,tags:'terraria minecraft 2d sandbox mining crafting',how:'ARROWS MOVE, UP JUMPS, HOLD A TO DIG/BUILD/HIT, B NEXT ITEM, DOWN+B CRAFTS. SLAY THE BOSS.',make(){
 const g={over:null,score:0},TS=8,WW=180,WH=90,OY=16,VW=40,VH=28;
 const w=new Uint8Array(WW*WH);const gt=(x,y)=>x<0||y<0||x>=WW||y>=WH?11:w[y*WW+x];const stt=(x,y,v)=>{if(x>=0&&y>=0&&x<WW&&y<WH)w[y*WW+x]=v;};
 // tile defs: name, color, solid, hardness, drop
 const TD=[null,{n:'DIRT',c:'#8a5a32',s:1,h:1,d:'DIRT'},{n:'GRASS',c:'#4aa83a',s:1,h:1,d:'DIRT'},{n:'STONE',c:'#7a7a86',s:1,h:3,d:'STONE'},{n:'COPPER',c:'#7a7a86',o:'#e0803a',s:1,h:4,d:'COPPER ORE',t:1},{n:'IRON',c:'#7a7a86',o:'#d8c0b0',s:1,h:6,d:'IRON ORE',t:2},{n:'GOLD',c:'#7a7a86',o:'#ffd23f',s:1,h:8,d:'GOLD ORE',t:3},
  {n:'WOOD',c:'#b07a42',s:1,h:2,d:'WOOD'},{n:'TRUNK',c:'#7a4a22',s:0,h:2,d:'WOOD'},{n:'LEAF',c:'#2e8a3a',s:0,h:.5,d:null},{n:'SAND',c:'#e0c878',s:1,h:1,d:'SAND'},{n:'BEDROCK',c:'#2a2430',s:1,h:999},{n:'WORKBENCH',c:'#a06a32',s:0,h:2,d:'WORKBENCH'},{n:'FURNACE',c:'#5a5a62',s:0,h:3,d:'FURNACE'},{n:'ANVIL',c:'#4a4a5a',s:0,h:3,d:'ANVIL'},{n:'TORCH',c:'#ffb040',s:0,h:.3,d:'TORCH'},{n:'MUSHROOM',c:'#e04a4a',s:0,h:.3,d:'MUSHROOM'}];
 const PLACE={DIRT:1,STONE:3,WOOD:7,SAND:10,WORKBENCH:12,FURNACE:13,ANVIL:14,TORCH:15};
 // ---- world generation ----
 const surf=[];let ph=[rnd(6),rnd(6),rnd(6)];for(let x=0;x<WW;x++)surf.push(Math.round(30+Math.sin(x*.05+ph[0])*4+Math.sin(x*.13+ph[1])*2+Math.sin(x*.021+ph[2])*5));
 for(let x=0;x<WW;x++){const s=surf[x],dd=5+ri(3);for(let y=s;y<WH;y++){let v=y===s?2:y<s+dd?1:3;if(y>=WH-2)v=11;stt(x,y,v);}if(x>120&&x<150&&rnd(1)<.9){for(let y=s;y<s+3;y++)stt(x,y,10);}}
 for(let i=0;i<34;i++){let x=rnd(WW),y=40+rnd(42),a=rnd(6.28);const len=50+ri(110),r=1+rnd(1.6);for(let j=0;j<len;j++){for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=r*r&&gt(x+dx|0,y+dy|0)!==11)stt(x+dx|0,y+dy|0,0);a+=rnd(.8)-.4;x+=Math.cos(a);y+=Math.sin(a)*.6;if(x<2||x>WW-3||y<surf[cl(x|0,0,WW-1)]+6||y>WH-4)a+=Math.PI;}}
 const vein=(k,n,ymin,ymax,sz)=>{for(let i=0;i<n;i++){let x=ri(WW),y=ymin+ri(ymax-ymin);for(let j=0;j<sz+ri(sz);j++){if(gt(x,y)===3)stt(x,y,k);x+=ri(3)-1;y+=ri(3)-1;}}};
 vein(4,70,34,80,4);vein(5,55,44,86,4);vein(6,40,58,87,4);
 for(let x=3;x<WW-3;x++){const s=surf[x];if(gt(x,s)===2&&rnd(1)<.11&&gt(x-1,s-1)===0&&gt(x+1,s-1)===0){const h=4+ri(4);for(let y=s-1;y>=s-h;y--)stt(x,y,8);for(let dy=-2;dy<=1;dy++)for(let dx=-2;dx<=2;dx++)if(Math.abs(dx)+Math.abs(dy)<4&&gt(x+dx,s-h+dy)===0)stt(x+dx,s-h+dy,9);x+=3;}else if(gt(x,s)===2&&rnd(1)<.05)stt(x,s-1,16);}
 for(let i=0;i<30;i++){const x=ri(WW),y=50+ri(36);if(gt(x,y)===0&&TD[gt(x,y+1)]&&TD[gt(x,y+1)].s)stt(x,y,16);}
 const sx=WW/2|0;let px=sx*TS+4,py=(surf[sx])*TS,vx=0,vy=0,f=1,onG=false,hp=100,hpMax=100,inv={WOOD:6,TORCH:6},tools={pick:1,sword:1,armor:0},sel='PICK',mining=null,swing=0,regen=0,el=0,ens=[],boss=null,msg='',msgT=0,craft=null,light=null,lightT=0,camX=0,camY=0,deaths=0,spawnX=px,spawnY=py,hitInv=0,placeT=0,stats={mined:0},parts=[];
 // clear the spawn column of trees
 for(let y=0;y<surf[sx];y++)for(let dx=-2;dx<=2;dx++)if(gt(sx+dx,y)===8||gt(sx+dx,y)===9)stt(sx+dx,y,0);
 const say=(m,t)=>{msg=m;msgT=t||140;};say('CHOP TREES (HOLD A). 10 WOOD MAKES A WORKBENCH: DOWN+B.',300);
 const DAY=9000,NIGHT=5400,CYC=DAY+NIGHT;const isNight=()=>el%CYC>=DAY;
 const solid=(x,y)=>{const t=TD[gt(Math.floor(x/TS),Math.floor(y/TS))];return!!(t&&t.s);};
 const boxHit=(x,y,hw,h)=>{for(let yy=y-h;yy<y;yy+=4)for(const xx of[x-hw,x,x+hw-.01])if(solid(xx,yy))return true;return solid(x-hw,y-.01)||solid(x+hw-.01,y-.01)||solid(x,y-.01);};
 const RC=[
  {n:'WORKBENCH',need:{WOOD:10},at:null,give:['WORKBENCH',1]},
  {n:'TORCH X4',need:{WOOD:1},at:null,give:['TORCH',4]},
  {n:'POTION',need:{MUSHROOM:2},at:12,give:['POTION',1]},
  {n:'FURNACE',need:{STONE:15,WOOD:4,TORCH:2},at:12,give:['FURNACE',1]},
  {n:'COPPER BAR',need:{'COPPER ORE':2},at:13,give:['COPPER BAR',1]},
  {n:'IRON BAR',need:{'IRON ORE':2},at:13,give:['IRON BAR',1]},
  {n:'GOLD BAR',need:{'GOLD ORE':2},at:13,give:['GOLD BAR',1]},
  {n:'COPPER PICK',need:{'COPPER BAR':4,WOOD:2},at:12,tool:['pick',2],give:null},
  {n:'COPPER SWORD',need:{'COPPER BAR':4},at:12,tool:['sword',2],give:null},
  {n:'ANVIL',need:{'IRON BAR':3},at:12,give:['ANVIL',1]},
  {n:'IRON PICK',need:{'IRON BAR':4,WOOD:2},at:14,tool:['pick',3],give:null},
  {n:'IRON SWORD',need:{'IRON BAR':5},at:14,tool:['sword',3],give:null},
  {n:'IRON ARMOR',need:{'IRON BAR':8},at:14,tool:['armor',1],give:null},
  {n:'GOLD SWORD',need:{'GOLD BAR':5},at:14,tool:['sword',4],give:null},
  {n:'STAR LURE',need:{'GOLD BAR':4,LENS:2},at:14,give:['STAR LURE',1]}];
 const near=k=>{const cx=Math.floor(px/TS),cy=Math.floor((py-10)/TS);for(let y=cy-6;y<=cy+6;y++)for(let x=cx-7;x<=cx+7;x++)if(gt(x,y)===k)return true;return false;};
 const canCraft=r=>(!r.at||near(r.at))&&Object.entries(r.need).every(([k,v])=>(inv[k]||0)>=v)&&!(r.tool&&tools[r.tool[0]]>=r.tool[1]);
 const doCraft=r=>{if(!canCraft(r)){S('lose');say(r.at&&!near(r.at)?'NEED TO BE NEAR A '+TD[r.at].n:'MISSING MATERIALS',80);return;}for(const[k,v]of Object.entries(r.need)){inv[k]-=v;if(!inv[k])delete inv[k];}if(r.give)inv[r.give[0]]=(inv[r.give[0]]||0)+r.give[1];if(r.tool){tools[r.tool[0]]=r.tool[1];}g.score+=r.tool?60:15;S('win');say('CRAFTED '+r.n+'!',90);};
 const ORDER=['PICK','SWORD','WOOD','DIRT','STONE','SAND','TORCH','WORKBENCH','FURNACE','ANVIL','POTION','STAR LURE','COPPER ORE','IRON ORE','GOLD ORE','COPPER BAR','IRON BAR','GOLD BAR','LENS','MUSHROOM'];
 const slots=()=>ORDER.filter(k=>k==='PICK'||k==='SWORD'||(inv[k]||0)>0);
 const target=(k)=>{const cx=Math.floor(px/TS);const hy=Math.floor((py-14)/TS),fy=Math.floor((py-4)/TS);
  if(A.mouse.t>0){const mx=Math.floor((A.mouse.x+camX)/TS),my=Math.floor((A.mouse.y-OY+camY)/TS);if(Math.hypot(mx*TS+4-px,my*TS+4-(py-10))<48)return[mx,my];return null;}
  if(k.u)return[cx,Math.floor((py-21)/TS)];if(k.d)return[cx,Math.floor((py+2)/TS)];
  const fx=Math.floor((px+f*7)/TS);if(sel!=='PICK'){if(!TD[gt(fx,fy)]||!TD[gt(fx,fy)].s&&gt(fx,fy)===0)return[fx,fy];return[fx,hy];}
  for(const y of[hy,fy])if(gt(fx,y)!==0)return[fx,y];const by=Math.floor((py+2)/TS);if(gt(fx,by)!==0&&gt(fx,by)!==11)return[fx,by];return[fx,fy];};
 const mineTile=(x,y)=>{const t=gt(x,y),d=TD[t];if(!d||t===11)return;if(d.t&&d.t>tools.pick+0){if(!msgT)say('YOUR PICK IS TOO WEAK FOR '+d.n,80);return;}
  const pw=[0,1,1.7,2.6][tools.pick];if(!mining||mining.x!==x||mining.y!==y)mining={x,y,p:0};mining.p+=pw/20;if(A.t%8===0)S('hit');if(mining.p>=d.h){stt(x,y,0);if(d.d)inv[d.d]=(inv[d.d]||0)+1;stats.mined++;g.score+=d.t?d.t*6:1;mining=null;for(let i=0;i<5;i++)parts.push({x:x*TS+4,y:y*TS+4,vx:rnd(2)-1,vy:-rnd(2),t:20,c:d.o||d.c});
   if(t===8){for(let yy=y-1;gt(x,yy)===8||gt(x,yy)===9;yy--){if(gt(x,yy)===8)inv.WOOD=(inv.WOOD||0)+1;stt(x,yy,0);}for(let yy=y-12;yy<y;yy++)for(let xx=x-2;xx<=x+2;xx++)if(gt(xx,yy)===9)stt(xx,yy,0);}
   if(t===2||t===1)for(let yy=y-1;yy>=0;yy--){if(gt(x,yy)===16||gt(x,yy)===15){stt(x,yy,0);}else break;}light=null;}};
 const placeTile=(x,y,item)=>{const v=PLACE[item];if(!v||gt(x,y)!==0)return;const tx=Math.floor(px/TS);if(TD[v].s&&x>=Math.floor((px-5)/TS)&&x<=Math.floor((px+4.99)/TS)&&y>=Math.floor((py-20)/TS)&&y<=Math.floor((py-.01)/TS))return;
  const sup=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>gt(x+dx,y+dy)!==0);if(!sup)return;if((v===12||v===13||v===14)&&!(TD[gt(x,y+1)]&&TD[gt(x,y+1)].s))return;stt(x,y,v);inv[item]--;if(!inv[item]){delete inv[item];sel='PICK';}S('blip');light=null;if(v>=12&&v<=14)say(TD[v].n+' PLACED. STAND NEAR IT TO CRAFT (DOWN+B).',160);};
 const hurt=(d,sx)=>{if(hitInv>0)return;d=Math.round(d*(tools.armor?.65:1));hp-=d;hitInv=40;regen=0;vx=(px<sx?-1:1)*2.5;vy=-3;S('hit');A.shake=4;parts.push({txt:'-'+d,x:px,y:py-24,t:40});if(hp<=0){deaths++;S('lose');say('YOU DIED. RESPAWNED AT THE START.',150);hp=hpMax;px=spawnX;py=spawnY;vx=vy=0;g.score=Math.max(0,g.score-50);ens=ens.filter(e=>Math.abs(e.x-px)>200);}};
 const spawnEnemy=()=>{if(boss)return;const n=isNight(),cnt=ens.length;if(cnt>=(n?7:3))return;const side=rnd(1)<.5?-1:1,ex=cl(px+side*(170+rnd(40)),16,WW*TS-16);
  if(n&&rnd(1)<.45){ens.push({k:'eye',x:ex,y:py-90-rnd(40),vx:-side*1.2,vy:0,hp:22,fl:0,w:7});}
  else{const cx=Math.floor(ex/TS);let y=0;while(y<WH&&!(TD[gt(cx,y)]&&TD[gt(cx,y)].s))y++;if(y<WH-2)ens.push(n?{k:'zom',x:ex,y:y*TS,vx:0,vy:0,hp:40,fl:0,w:5}:{k:'slime',x:ex,y:y*TS,vx:0,vy:0,hp:16,fl:0,w:6,t:30});}};
 const SW=[0,6,10,15,22];
 g.update=()=>{el++;if(msgT)msgT--;if(hitInv)hitInv--;if(swing)swing--;const k=A.in(0),h=A.hit(0);
  parts.forEach(p=>{p.t--;if(!p.txt){p.x+=p.vx;p.y+=p.vy;p.vy+=.15;}else p.y-=.4;});parts=parts.filter(p=>p.t>0);
  if(craft){const L_=RC;if(h.u)craft.i=(craft.i+L_.length-1)%L_.length;if(h.d)craft.i=(craft.i+1)%L_.length;if(h.a)doCraft(L_[craft.i]);if(h.b)craft=null;return;}
  if(h.b){if(k.d){craft={i:0};S('blip');return;}const s=slots();let i=s.indexOf(sel);sel=s[(i+1)%s.length];S('blip');}
  if(mClick()&&A.mouse.y<OY){const s=slots(),i=Math.floor((A.mouse.x-110)/18);if(s[i]){sel=s[i];S('blip');}}
  // movement
  const dx=ax(k);if(dx){vx+=(dx*1.6-vx)*.3;f=dx;}else vx*=onG?.6:.9;if(k.u&&onG){vy=-5.3;S('jump');}vy=Math.min(vy+.32,7);
  const nx=px+vx;if(!boxHit(nx,py,5,20))px=nx;else if(onG&&!boxHit(nx,py-TS,5,20)&&dx){px=nx;py-=TS;}else vx=0;
  const ny=py+vy;if(!boxHit(px,ny,5,20)){py=ny;onG=false;}else{if(vy>0){onG=true;py=Math.floor((ny-.01)/TS)*TS;if(boxHit(px,py,5,20))py-=TS;if(vy>6.5)hurt((vy-6.5)*12|0,px);}vy=0;}
  if(onG&&!boxHit(px,py+1,5,20))onG=false;px=cl(px,6,WW*TS-6);if(py>WH*TS)py=spawnY;
  // tool use
  if(k.a&&!(mClick()&&A.mouse.y<OY)){const tg=target(k);
   if(sel==='PICK'){if(tg&&gt(tg[0],tg[1])!==0)mineTile(tg[0],tg[1]);else mining=null;}
   else if(sel==='SWORD'){if(!swing){swing=16;S('shoot');const dmg=SW[tools.sword];for(const e of ens)if(Math.abs(e.x-(px+f*12))<16+e.w&&Math.abs(e.y-(py-10))<22){e.hp-=dmg;e.fl=8;e.vx=f*2.5;e.vy=-2;A.burst(e.x-camX,e.y-camY+OY,'#ffffff',4,1);}if(boss&&Math.hypot(boss.x-(px+f*12),boss.y-(py-10))<boss.r+14&&!boss.hitT){boss.hp-=dmg;boss.hitT=10;boss.fl=6;S('hit');}}}
   else if(sel==='POTION'){if(h.a&&hp<hpMax){hp=Math.min(hpMax,hp+50);inv.POTION--;if(!inv.POTION){delete inv.POTION;sel='PICK';}S('coin');}}
   else if(sel==='STAR LURE'){if(h.a){if(!isNight())say('THE LURE ONLY WORKS AT NIGHT.',100);else if(!boss){inv['STAR LURE']--;if(!inv['STAR LURE']){delete inv['STAR LURE'];sel='PICK';}boss={x:px,y:py-120,vx:0,vy:0,hp:320,max:320,r:16,st:'hover',t:120,fl:0,a:0,hitT:0};ens=[];say('THE WATCHER HAS AWOKEN!',160);S('boom');A.shake=12;}}}
   else if(PLACE[sel]){if(--placeT<=0&&tg){placeT=7;placeTile(tg[0],tg[1],sel);}}
  }else{mining=null;placeT=0;}
  if(++regen>300&&hp<hpMax&&el%20===0)hp++;
  // enemies
  if(el%(isNight()?150:420)===0)spawnEnemy();
  for(const e of ens){if(e.fl)e.fl--;const ddx=px-e.x,ddy=py-10-e.y;
   if(e.k==='eye'){e.vx+=Math.sign(ddx)*.05;e.vy+=Math.sign(ddy)*.05;e.vx=cl(e.vx,-1.8,1.8);e.vy=cl(e.vy,-1.4,1.4);e.x+=e.vx;e.y+=e.vy;if(solid(e.x,e.y)){e.vx*=-1;e.vy*=-1;e.x+=e.vx*2;e.y+=e.vy*2;}}
   else{const sp=e.k==='zom'?.55:0;if(e.k==='slime'){if(--e.t<=0&&e.onG){e.t=60+ri(40);e.vy=-4;e.vx=Math.sign(ddx)*1.4;}}else{e.vx=Math.sign(ddx)*sp;}
    e.vy=Math.min(e.vy+.3,6);const nx2=e.x+e.vx;if(!boxHit(nx2,e.y,e.w,14))e.x=nx2;else if(e.onG&&e.k==='zom'){e.vy=-4.5;}const ny2=e.y+e.vy;if(!boxHit(e.x,ny2,e.w,14)){e.y=ny2;e.onG=false;}else{if(e.vy>0){e.onG=true;e.y=Math.floor((ny2-.01)/TS)*TS;if(e.k==='slime')e.vx=0;}e.vy=0;}}
   if(Math.abs(ddx)<e.w+5&&Math.abs(ddy)<16)hurt(e.k==='zom'?12:e.k==='eye'?9:6,e.x);
   if(e.hp<=0&&!e.dead){e.dead=1;g.score+=e.k==='zom'?15:e.k==='eye'?20:10;S('score');A.burst(e.x-camX,e.y-camY+OY-6,e.k==='slime'?'#5ad0ff':'#c04a4a',12,1.6);if(e.k==='eye'&&rnd(1)<.6){inv.LENS=(inv.LENS||0)+1;say('+1 LENS',50);}}
   if(Math.abs(ddx)>420)e.dead=1;if(!isNight()&&e.k!=='slime'&&rnd(1)<.003)e.dead=1;}
  ens=ens.filter(e=>!e.dead);
  if(boss){const b=boss;b.t--;if(b.fl)b.fl--;if(b.hitT)b.hitT--;b.a+=.03;const ph2=b.hp<b.max/2;
   if(b.st==='hover'){const tx=px+Math.cos(b.a)*90,ty=py-80+Math.sin(b.a*2)*20;b.x+=(tx-b.x)*.04;b.y+=(ty-b.y)*.04;if(b.t<=0){b.st='dash';const an=Math.atan2(py-10-b.y,px-b.x);b.vx=Math.cos(an)*(ph2?6:4.5);b.vy=Math.sin(an)*(ph2?6:4.5);b.t=ph2?28:36;S('boom');}if(b.t===60&&!ph2&&ens.length<4)ens.push({k:'eye',x:b.x,y:b.y,vx:0,vy:0,hp:14,fl:0,w:6});}
   else{b.x+=b.vx;b.y+=b.vy;b.vx*=.985;b.vy*=.985;if(b.t<=0){b.st=ph2&&rnd(1)<.5?'dash2':'hover';b.t=ph2?50:110;if(b.st==='dash2'){b.st='hover';b.t=20;}}}
   if(Math.hypot(b.x-px,b.y-(py-10))<b.r+6)hurt(ph2?22:16,b.x);
   if(b.hp<=0){g.score+=2000+Math.max(0,800-deaths*100);S('win');A.burst(b.x-camX,b.y-camY+OY,K.r,60,3);g.over='VICTORY - WATCHER SLAIN';return;}
   if(!isNight()){boss=null;say('THE WATCHER FLEES WITH THE DAWN...',160);}}
  if(el%CYC===DAY){say('NIGHT FALLS. MONSTERS ROAM. EYES DROP LENSES.',160);}if(el%CYC===0&&el>0)say('A NEW DAY DAWNS.',120);
  camX=cl(px-160,0,WW*TS-320);camY=cl(py-120,0,WH*TS-224);};
 // lighting
 const calcLight=()=>{const x0=Math.floor(camX/TS)-1,y0=Math.floor(camY/TS)-1,w_=VW+3,h_=VH+3;const L_=new Float32Array(w_*h_);const day=isNight()?(el%CYC>CYC-600?.3+.7*(1-(CYC-el%CYC)/600):.22):(el%CYC<600&&el>600?.22+.78*(el%CYC)/600:1);
  for(let i=0;i<w_;i++){const x=x0+i;let lit=day;for(let y=0;y<y0+h_;y++){const t=gt(x,y);if(y>=y0){const j=y-y0;L_[j*w_+i]=Math.max(L_[j*w_+i],lit);}if(TD[t]&&TD[t].s)lit*=.7;else if(t===9)lit*=.96;if(lit<.02&&y>=y0)break;}}
  const lights=[[px,py-12,4.5]];for(let y=y0-7;y<y0+h_+7;y++)for(let x=x0-7;x<x0+w_+7;x++)if(gt(x,y)===15||gt(x,y)===13)lights.push([x*TS+4,y*TS+4,7]);
  for(const[lx,ly,r]of lights){const cx=Math.floor(lx/TS)-x0,cy=Math.floor(ly/TS)-y0;for(let j=Math.max(0,cy-r|0);j<Math.min(h_,cy+r+1);j++)for(let i=Math.max(0,cx-r|0);i<Math.min(w_,cx+r+1);i++){const d=Math.hypot(i-cx,j-cy);const v=1-d/r;if(v>L_[j*w_+i])L_[j*w_+i]=v;}}
  light={x0,y0,w_,h_,L_};};
 g.draw=()=>{const c=A.c,night=isNight();const sky=night?['#0a0a2a','#1a1a4a']:['#5aa0ff','#bfe0ff'];const gr=c.createLinearGradient?c.createLinearGradient(0,0,0,240):null;if(gr&&gr.addColorStop){gr.addColorStop(0,sky[0]);gr.addColorStop(1,sky[1]);c.fillStyle=gr;}else c.fillStyle=sky[0];c.fillRect(0,0,320,240);
  const ca=(el%CYC)/(night?NIGHT:DAY);if(!night){C(40+((el%CYC)/DAY)*240,40-Math.sin((el%CYC)/DAY*3.14)*20,8,'#fff2a0');}else{C(40+((el%CYC-DAY)/NIGHT)*240,40-Math.sin((el%CYC-DAY)/NIGHT*3.14)*20,6,'#f0f0ff');c.fillStyle='#ffffff';for(let i=0;i<30;i++)c.fillRect((i*97)%320,(i*53)%120+OY,1,1);}
  const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS),ox=-(camX%TS),oy=OY-(camY%TS);
  // underground backwall
  for(let i=0;i<=VW;i++){const x=x0+i,s=surf[cl(x,0,WW-1)];const top=(s+2-y0)*TS+oy;if(top<240){c.fillStyle='#3a2a20';c.fillRect(i*TS+ox,Math.max(OY,top),TS,240-Math.max(OY,top));}}
  for(let j=0;j<=VH;j++){const y=y0+j,sy=j*TS+oy;let i=0;while(i<=VW){const t=gt(x0+i,y);let n=1;while(i+n<=VW&&gt(x0+i+n,y)===t&&!(TD[t]&&TD[t].o))n++;if(t&&TD[t]){const d=TD[t];if(t===8){c.fillStyle=d.c;for(let q=0;q<n;q++)c.fillRect((i+q)*TS+ox+2,sy,4,TS);}else if(t===9){c.fillStyle=d.c;c.fillRect(i*TS+ox,sy,n*TS,TS);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(i*TS+ox+1,sy+1,n*TS-2,2);}else if(t>=12){for(let q=0;q<n;q++)furn(t,(i+q)*TS+ox,sy);}else{c.fillStyle=d.c;c.fillRect(i*TS+ox,sy,n*TS,TS);if(t===2){c.fillStyle='#8a5a32';c.fillRect(i*TS+ox,sy+3,n*TS,TS-3);c.fillStyle='#6ad04a';c.fillRect(i*TS+ox,sy,n*TS,2);}
       if(d.o){c.fillStyle=d.o;c.fillRect(i*TS+ox+1,sy+2,2,2);c.fillRect(i*TS+ox+5,sy+1,2,2);c.fillRect(i*TS+ox+3,sy+5,2,2);}else{c.fillStyle='rgba(0,0,0,.12)';for(let q=0;q<n;q++)if(((x0+i+q)*7+y*13)%3===0)c.fillRect((i+q)*TS+ox+((y*5+i+q)%6),sy+((i+q+y)%5)+1,2,2);}}}i+=n;}}
  if(mining){const d=TD[gt(mining.x,mining.y)];if(d){const p=mining.p/d.h,x=mining.x*TS-camX,y=mining.y*TS-camY+OY;c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x,y+TS-2,TS*p,2);L(x+1,y+1,x+1+6*p,y+1+6*p,'#1a1a1a',1);}}
  // entities
  for(const e of ens){const x=e.x-camX,y=e.y-camY+OY,fl=e.fl&&e.fl%4<2;if(e.k==='zom')A.person(x,y,{c:fl?'#ffffff':'#4a6a8a',skin:'#7ab07a',pants:'#3a3a5a',s:.62,st:A.t*.2,d:e.vx<0?-1:1,arm1:e.vx<0?1.4:-1.4,arm2:e.vx<0?1.3:-1.3});
   else if(e.k==='eye'){C(x,y,e.w,fl?'#ffffff':'#f0e8e8');C(x+Math.sign(e.vx)*2,y,3,'#c02a2a');C(x+Math.sign(e.vx)*3,y,1.5,'#1a1a1a');L(x-Math.sign(e.vx)*e.w,y,x-Math.sign(e.vx)*(e.w+6),y+Math.sin(A.t*.3)*3,'#c02a2a',1.5);}
   else{c.fillStyle=fl?'#ffffff':'rgba(80,190,255,.85)';c.beginPath();c.ellipse(x,y-5,7,5+(e.onG?0:1),0,0,6.283);c.fill();R(x-3,y-7,2,2,'#1a1a3a');R(x+1,y-7,2,2,'#1a1a3a');}}
  if(boss){const b=boss,x=b.x-camX,y=b.y-camY+OY;GA(.3);C(x,y,b.r+6,'#ff4a4a');GA(1);C(x,y,b.r,b.fl?'#ffffff':'#f0e0e0');const an=Math.atan2(py-10-b.y,px-b.x);C(x+Math.cos(an)*7,y+Math.sin(an)*7,7,b.hp<b.max/2?'#ff2a2a':'#3a6ad0');C(x+Math.cos(an)*9,y+Math.sin(an)*9,3,'#0a0a0a');for(let i=0;i<5;i++){const q=-an+3.14+(i-2)*.35;L(x+Math.cos(an+3.14+(i-2)*.3)*b.r,y+Math.sin(an+3.14+(i-2)*.3)*b.r,x+Math.cos(an+3.14+(i-2)*.3)*(b.r+10),y+Math.sin(an+3.14+(i-2)*.3)*(b.r+10)+Math.sin(A.t*.2+i)*3,'#c02a2a',2);}}
  const pxs=px-camX,pys=py-camY+OY;if(!(hitInv&&A.t%6<3)){A.person(pxs,pys,{c:tools.armor?'#a0a8b8':'#3a8ad8',pants:'#5a4a3a',hair:'#6a3a1a',s:.66,st:Math.abs(vx)>.3?el*.25:0,d:f,id:3,arm2:swing?(f>0?-2.2+(16-swing)*.18:2.2-(16-swing)*.18):undefined});
   const it=sel;if(it==='PICK'||it==='SWORD'){const a=swing?(f>0?-2.2+(16-swing)*.18:2.2-(16-swing)*.18):(k_=A.in(0)).a&&sel==='PICK'?Math.sin(A.t*.5)*.8-(f>0?.6:-.6):(f>0?-.4:.4);const hx=pxs+f*3,hy=pys-13;const ex=hx+Math.sin(-a)*-1*10*(f>0?-1:1)*-1,ey=hy+Math.cos(a)*10;L(hx,hy,hx+Math.cos(a+1.57)*-9*-1,hy+Math.sin(a+1.57)*9,it==='SWORD'?['','#c8a060','#e08a4a','#d8d8e8','#ffd23f'][tools.sword]:'#8a5a2a',it==='SWORD'?2:1.5);if(it==='PICK'){const tx_=hx+Math.cos(a+1.57)*-9*-1,ty_=hy+Math.sin(a+1.57)*9;L(tx_-3,ty_-2,tx_+3,ty_+2,['','#9a9aa8','#e0803a','#d8c0b0'][tools.pick],2);}}}
  for(const p of parts){if(p.txt)T(p.txt,p.x-camX,p.y-camY+OY,K.r,1,'c');else{c.fillStyle=p.c;c.fillRect(p.x-camX,p.y-camY+OY,2,2);}}
  // darkness
  if(!light||A.t%6===0||lightT++>6){calcLight();lightT=0;}const LL=light;if(LL){for(let j=0;j<LL.h_;j++){const sy=(LL.y0+j)*TS-camY+OY;if(sy<OY-TS||sy>240)continue;let i=0;while(i<LL.w_){const v=LL.L_[j*LL.w_+i];const q=Math.round(Math.min(1,Math.max(0,1-v))*6);let n=1;while(i+n<LL.w_&&Math.round(Math.min(1,Math.max(0,1-LL.L_[j*LL.w_+i+n]))*6)===q)n++;if(q>0){c.fillStyle='rgba(0,0,0,'+(q/6*.94).toFixed(2)+')';c.fillRect((LL.x0+i)*TS-camX,Math.max(OY,sy),n*TS,sy<OY?TS-(OY-sy):TS);}i+=n;}}}
  // target highlight
  const tg=target(A.in(0));if(tg){A.box(tg[0]*TS-camX,tg[1]*TS-camY+OY,TS,TS,'rgba(255,255,255,.7)');}
  // HUD
  R(0,0,320,OY,'#14101e');for(let i=0;i<5;i++){const v=cl((hp-i*20)/20,0,1),x=6+i*12;C(x-2,7,3,'#3a2a3a');C(x+2,7,3,'#3a2a3a');A.poly([[x-5,8],[x+5,8],[x,13]],'#3a2a3a',1);if(v>0){GA(.4+.6*v);C(x-2,7,3*v,K.r);C(x+2,7,3*v,K.r);A.poly([[x-5*v,8],[x+5*v,8],[x,8+5*v]],K.r,1);GA(1);}}
  T(night?'NIGHT':'DAY',70,5,night?'#9a9aff':K.y,1);const s=slots(),si=s.indexOf(sel);for(let i=0;i<Math.min(11,s.length);i++){const it=s[i],x=110+i*18,on=it===sel;R(x,1,16,14,on?'#5a4a2a':'#2a2238');if(on)A.box(x,1,16,14,K.y);icon(it,x+8,8);const n=inv[it];if(n)T(''+Math.min(n,99),x+15,10,K.w,1,'r');}
  T(sel==='PICK'?['','STONE','COPPER','IRON'][tools.pick]+' PICK':sel==='SWORD'?['','WOOD','COPPER','IRON','GOLD'][tools.sword]+' SWORD':sel,160,OY+3,K.w,1,'c');
  if(boss){R(60,228,200,6,'#1a1020');R(60,228,200*boss.hp/boss.max,6,'#e04a6a');T('THE WATCHER',160,220,K.w,1,'c');}
  if(msgT){const w=Math.min(316,msg.length*4+10);box(160-w/2,OY+12,w,12,'rgba(5,5,15,.85)','#6a5a8a');T(msg,160,OY+15,K.w,1,'c');}
  if(craft){box(40,30,240,190,'#1a1428',K.y);T('CRAFTING',160,35,K.y,1,'c');RC.forEach((r,i)=>{const y=46+i*11,on=i===craft.i,ok=canCraft(r);if(on)R(44,y-2,232,10,'#3a2a5a');T((on?'> ':'  ')+r.n,48,y,ok?(on?K.y:K.w):'#6a6a7a',1);const need=Object.entries(r.need).map(([k,v])=>v+' '+k.replace(' ORE','').replace(' BAR','B').slice(0,8)).join(' ');T(need,274,y,ok?K.c:'#5a5a6a',1,'r');});T('A CRAFT  B CLOSE  (STATIONS: STAND NEAR)',160,212,K.gr,1,'c');}};
 let k_;
 const furn=(t,x,y)=>{if(t===12){R(x,y+3,8,2,'#a06a32');R(x,y+5,1,3,'#7a4a22');R(x+7,y+5,1,3,'#7a4a22');}else if(t===13){R(x,y,8,8,'#5a5a62');R(x+2,y+4,4,3,A.t%10<5?'#ff8a2a':'#ffb040');}else if(t===14){R(x,y+3,8,2,'#4a4a5a');R(x+2,y+5,4,3,'#3a3a4a');}else if(t===15){R(x+3,y+3,2,5,'#8a5a2a');C(x+4,y+2,1.6+Math.sin(A.t*.3)*.3,'#ffd060');}else if(t===16){R(x+3,y+5,2,3,'#f0e0d0');R(x+1,y+3,6,3,'#e04a4a');R(x+2,y+3,1,1,'#ffffff');}};
 const icon=(it,x,y)=>{const t=PLACE[it];if(it==='PICK'){L(x-4,y+4,x+3,y-3,'#8a5a2a',1.5);L(x,y-5,x+6,y,['','#9a9aa8','#e0803a','#d8c0b0'][tools.pick],2);return;}if(it==='SWORD'){L(x-4,y+4,x+4,y-4,['','#c8a060','#e08a4a','#d8d8e8','#ffd23f'][tools.sword],2);L(x-4,y,x,y+4,'#5a3a1a',1.5);return;}
  if(t){if(t>=12)furn(t,x-4,y-4);else{R(x-4,y-4,8,8,TD[t].c);}return;}const col={'COPPER ORE':'#e0803a','IRON ORE':'#d8c0b0','GOLD ORE':'#ffd23f','COPPER BAR':'#e0803a','IRON BAR':'#d8c0b0','GOLD BAR':'#ffd23f',LENS:'#e0f0ff',MUSHROOM:'#e04a4a',POTION:'#ff4a8a','STAR LURE':'#ffe060'}[it]||'#ffffff';
  if(it.endsWith('ORE')){R(x-4,y-3,8,7,'#7a7a86');R(x-2,y-1,3,3,col);}else if(it.endsWith('BAR')){A.poly([[x-5,y+3],[x+5,y+3],[x+3,y-2],[x-3,y-2]],col,1);}else if(it==='LENS'){C(x,y,4,col);C(x,y,2,'#3a6ad0');}else if(it==='MUSHROOM')furn(16,x-4,y-4);else if(it==='POTION'){C(x,y+1,4,col);R(x-1,y-5,2,3,'#c0c0c0');}else{A.poly([[x,y-5],[x+2,y-1],[x+5,y],[x+2,y+1],[x,y+5],[x-2,y+1],[x-5,y],[x-2,y-1]],col,1);}};
 return g;}});

/* ---- LANE DEFENSE: sun economy, 8 defenders, 5 lanes, flag waves and lawnmowers ---- */
A.add({id:'lanedefense',name:'LANE DEFENSE',cat:'ACTION',time:360,tags:'plants vs zombies lawn tower defense',how:'ARROWS MOVE, B PICKS A SEED, A PLANTS. GRAB SUN. HOLD 5 LANES THROUGH 3 FLAG WAVES.',make(){
 const g={over:null,score:0},LX=46,LY=44,CW=29,LH=36,COLS=9,LN=5;
 const PL=[{n:'SUNBLOOM',c:50,cd:450,hp:300,col:'#ffd23f'},{n:'SEED GUN',c:100,cd:450,hp:300,col:'#5ad04a'},{n:'FROST LILY',c:175,cd:450,hp:300,col:'#6ac8ff'},{n:'STONE GOURD',c:50,cd:1800,hp:4000,col:'#b08a5a'},
  {n:'TWIN GUN',c:200,cd:450,hp:300,col:'#3ab03a'},{n:'FIRE PEPPER',c:125,cd:3000,hp:300,col:'#ff4a2a'},{n:'JAW FLOWER',c:150,cd:450,hp:300,col:'#a04ad0'},{n:'SPIKE MOSS',c:100,cd:450,hp:300,col:'#8a9a8a'}];
 const ZT={walk:{hp:190,arm:0,sp:.1,v:10},cone:{hp:190,arm:280,sp:.1,v:20},bucket:{hp:190,arm:850,sp:.1,v:40},run:{hp:300,arm:0,sp:.26,v:25},shield:{hp:190,arm:0,sh:800,sp:.1,v:40},flag:{hp:190,arm:0,sp:.13,v:15},brute:{hp:2600,arm:0,sp:.07,v:150}};
 let sun=150,sel=1,cx=2,cy=2,plants=Array(LN*COLS).fill(null),zs=[],peas=[],suns=[],mowers=[1,1,1,1,1],cds=PL.map(()=>0),el=0,wave=0,nextW=1500,waveTot=15,msg='',msgT=0,kills=0,done=false,flash=[];
 const at=(l,c)=>plants[l*COLS+c];
 const cellX=c=>LX+c*CW+CW/2,laneY=l=>LY+l*LH+LH-6;
 const say=(m,t)=>{msg=m;msgT=t||120;};
 const spawnW=()=>{wave++;const flag=wave%5===0;let bud=1+wave*.8;if(flag)bud=bud*1.6+1;const L_=[];if(flag)L_.push('flag');
  if(wave===10)L_.push('brute');if(wave===15)L_.push('brute','brute');
  const pool=['walk'];if(wave>=2)pool.push('cone','cone');if(wave>=5)pool.push('run');if(wave>=7)pool.push('bucket');if(wave>=10)pool.push('shield');const cost={walk:1,cone:2,run:2,bucket:4,shield:4};
  while(bud>=1){const k=pick(pool);if(cost[k]>bud)continue;bud-=cost[k];L_.push(k);}
  L_.forEach((k,i)=>{const z=ZT[k];zs.push({k,l:ri(LN),x:330+i*(flag?10:26)+rnd(10),hp:z.hp,arm:z.arm,sh:z.sh||0,sp:z.sp,slow:0,eat:0,st:rnd(6),jumped:k!=='run',fl:0,smash:0});});
  if(flag){say(wave===waveTot?'FINAL WAVE!':'A HUGE WAVE IS APPROACHING!',150);S('boom');A.shake=6;}nextW=wave<waveTot?(flag?1500:wave<5?1080:wave<10?960:840):1e9;};
 const plant=(l,c)=>{const p=PL[sel];if(sel===8){if(at(l,c)){plants[l*COLS+c]=null;S('blip');}return;}if(at(l,c)){S('lose');return;}if(sun<p.c){say('NOT ENOUGH SUN',50);S('lose');return;}if(cds[sel]>0){S('lose');return;}
  sun-=p.c;cds[sel]=p.cd;plants[l*COLS+c]={k:sel,hp:p.hp,t:sel===0?300:0,chew:0,fuse:sel===5?50:0,fl:0};S('hit');A.burst(cellX(c),laneY(l)-8,p.col,10,1.5);};
 const hitZ=(z,d,frost,fire)=>{if(z.sh>0&&!fire){z.sh-=d;if(z.sh<0){z.hp+=z.sh;z.sh=0;}}else if(z.arm>0){z.arm-=d;if(z.arm<0){z.hp+=z.arm;z.arm=0;}}else z.hp-=d;z.fl=5;if(frost)z.slow=600;if(z.hp<=0&&!z.dead){z.dead=1;kills++;g.score+=ZT[z.k].v;A.burst(z.x,laneY(z.l)-14,'#8aa06a',12,1.5);S('score');}};
 g.dbg={get:()=>({sun,wave,zs:zs.length,mowers,plants,cds}),plant:(l,c,k)=>{sel=k;plant(l,c);}};
 g.update=()=>{el++;if(msgT)msgT--;for(let i=0;i<cds.length;i++)if(cds[i]>0)cds[i]--;flash.forEach(f=>f.t--);flash=flash.filter(f=>f.t>0);
  const k=A.in(0),h=A.hit(0);if(h.l)cx=Math.max(0,cx-1);if(h.r)cx=Math.min(COLS-1,cx+1);if(h.u)cy=Math.max(0,cy-1);if(h.d)cy=Math.min(LN-1,cy+1);if(h.b){sel=(sel+1)%9;S('blip');}
  if(A.mouse.t>0){const mx=A.mouse.x,my=A.mouse.y;if(mx>=LX&&mx<LX+COLS*CW&&my>=LY&&my<LY+LN*LH){cx=Math.floor((mx-LX)/CW);cy=Math.floor((my-LY)/LH);}}
  let clickUsed=false;if(mClick()){const mx=A.mouse.x,my=A.mouse.y;for(const s of suns)if(Math.hypot(s.x-mx,s.y-my)<12){s.got=1;clickUsed=true;}if(!clickUsed&&my<40){const i=Math.floor((mx-38)/31);if(i>=0&&i<9){sel=i;S('blip');}clickUsed=true;}}
  if(h.a&&!clickUsed)plant(cy,cx);
  // sun
  if(el%420===240&&!done)suns.push({x:LX+20+rnd(220),y:40,ty:LY+30+rnd(150),t:0,v:25});
  for(const s of suns){if(s.y<s.ty)s.y+=.6;s.t++;const cxp=cellX(cx),cyp=laneY(cy)-12;if(Math.hypot(s.x-cxp,s.y-cyp)<16||s.t>300)s.got=1;if(s.got&&!s.coll){s.coll=1;sun+=s.v;g.score+=2;S('coin');s.fly=0;}if(s.coll){s.fly++;s.x+=(18-s.x)*.15;s.y+=(18-s.y)*.15;}}suns=suns.filter(s=>!(s.coll&&s.fly>14));
  // waves
  if(--nextW<=0&&wave<waveTot)spawnW();
  if(el===60)say('PLANT SUNBLOOMS EARLY. ZOMBIES COMING!',150);
  // plants
  for(let l=0;l<LN;l++)for(let c=0;c<COLS;c++){const p=at(l,c);if(!p)continue;if(p.fl)p.fl--;const x=cellX(c),y=laneY(l);const ahead=zs.some(z=>z.l===l&&z.x>x-6&&z.x<330&&!z.dead);
   if(p.k===0){if(--p.t<=0){p.t=1200;suns.push({x:x+6,y:y-20,ty:y-10,t:0,v:25});}}
   if(p.k===1||p.k===2||p.k===4){p.t--;if(ahead&&p.t<=0){p.t=66;peas.push({x:x+8,y:y-18,l,fr:p.k===2,d:20});if(p.k===4)peas.push({x:x-4,y:y-18,l,d:20});S('shoot');}}
   if(p.k===5){if(--p.fuse<=0){for(const z of zs)if(z.l===l&&z.x<335)hitZ(z,1800,false,true);flash.push({l,t:30});A.shake=8;S('boom');for(let i=0;i<9;i++)A.burst(cellX(i),y-10,'#ff8a2a',6,2);plants[l*COLS+c]=null;}}
   if(p.k===6){if(p.chew>0)p.chew--;else{const z=zs.find(z=>z.l===l&&!z.dead&&z.x>x-8&&z.x<x+CW*1.4&&z.k!=='brute');if(z){z.dead=1;kills++;g.score+=ZT[z.k].v;p.chew=2400;S('boom');A.burst(z.x,y-14,'#a04ad0',14,2);}}}
   if(p.k===7){if(el%60===0)for(const z of zs)if(z.l===l&&Math.abs(z.x-x)<CW/2+4)hitZ(z,20,false,true);}}
  // peas
  for(const p of peas){p.x+=3.2;for(const z of zs)if(!z.dead&&z.l===p.l&&Math.abs(z.x-p.x)<6){hitZ(z,p.d,p.fr);p.hit=1;A.burst(p.x,p.y,p.fr?'#bfe8ff':'#9aff7a',3,1);break;}}peas=peas.filter(p=>!p.hit&&p.x<330);
  // zombies
  for(const z of zs){if(z.dead)continue;if(z.fl)z.fl--;if(z.slow)z.slow--;const sp=z.sp*(z.slow?.5:1);z.st+=sp*.6;const c=Math.floor((z.x-LX-6)/CW),y=laneY(z.l);const p=c>=0&&c<COLS?at(z.l,c):null;
   if(p&&p.k!==7&&z.x-cellX(c)<10&&z.x>cellX(c)-14){if(!z.jumped){z.jumped=true;z.x-=CW+4;z.sp=.1;S('jump');continue;}
    if(z.k==='brute'){z.smash++;if(z.smash>90){plants[z.l*COLS+c]=null;z.smash=0;A.shake=8;S('boom');A.burst(cellX(c),y-8,'#7a5a3a',14,2);}}else{z.eat=1;p.hp-=(z.slow?.8:1.6);p.fl=2;if(el%20===0)S('hit');if(p.hp<=0){plants[z.l*COLS+c]=null;S('lose');}}}
   else{z.eat=0;z.x-=sp;}
   if(z.x<LX-10){if(mowers[z.l]===1){mowers[z.l]=2;S('boom');say('LAWNMOWER!',60);}else if(mowers[z.l]===0&&z.x<12){g.over='THE HORDE BROKE THROUGH';S('lose');return;}}}
  for(let l=0;l<LN;l++)if(mowers[l]>=2){mowers[l]+=4;for(const z of zs)if(z.l===l&&!z.dead&&Math.abs(z.x-(mowers[l]-2+LX-20))<12){z.dead=1;kills++;g.score+=ZT[z.k].v/2|0;A.burst(z.x,laneY(l)-12,'#8aa06a',10,2);}if(mowers[l]>360)mowers[l]=0;}
  zs=zs.filter(z=>!z.dead);
  if(wave>=waveTot&&!zs.length&&!done){done=true;g.score+=500+mowers.filter(m=>m===1).length*100+Math.floor(sun/5);g.over='LAWN DEFENDED!';}};
 // drawing
 const drawPlant=(p,x,y)=>{const t=A.t*.08,fl=p.fl&&p.fl%2?'#ffffff':null,b=Math.sin(t+x)*1;
  if(p.k===7){A.c.fillStyle='#5a7a4a';A.c.fillRect(x-12,y-3,24,4);for(let i=0;i<6;i++)A.poly([[x-12+i*4,y-2],[x-10+i*4,y-8],[x-8+i*4,y-2]],fl||'#c0c8c0',1);return;}
  L(x,y,x,y-12,'#3a8a2a',2.5);A.poly([[x,y-4],[x-7,y-8],[x-2,y-2]],'#4ab03a',1);A.poly([[x,y-5],[x+7,y-9],[x+2,y-3]],'#4ab03a',1);
  if(p.k===0){for(let i=0;i<8;i++){const a=i/8*6.283+t*.3;C(x+Math.cos(a)*7,y-18+b+Math.sin(a)*7,3.5,fl||'#ffd23f');}C(x,y-18+b,5,fl||'#ff9a2a');R(x-2,y-19+b,1,2,'#3a2a1a');R(x+1,y-19+b,1,2,'#3a2a1a');}
  if(p.k===1||p.k===2||p.k===4){const col=fl||(p.k===2?'#6ac8ff':p.k===4?'#3ab03a':'#5ad04a');const heads=p.k===4?[[-4,-20],[5,-15]]:[[0,-18]];for(const[hx,hy]of heads){C(x+hx,y+hy+b,6,col);R(x+hx+4,y+hy-3+b,6,6,col);R(x+hx+8,y+hy-2+b,2,4,'#1a3a1a');R(x+hx,y+hy-3+b,2,2,'#1a1a1a');}if(p.k===2){A.poly([[x-5,y-24],[x-2,y-29],[x,y-24]],'#ffffff',1);}}
  if(p.k===3){const dmg=p.hp/4000;A.c.fillStyle=fl||(dmg<.33?'#8a6a4a':'#b08a5a');A.c.beginPath();A.c.ellipse(x,y-12,10,13,0,0,6.283);A.c.fill();R(x-5,y-16,3,3,'#2a1a10');R(x+2,y-16,3,3,'#2a1a10');if(dmg<.66)L(x-6,y-6,x,y-12,'#5a3a2a',1);if(dmg<.33)L(x+2,y-22,x+6,y-10,'#5a3a2a',1);}
  if(p.k===5){const s=1+Math.sin(A.t*.5)*.1*(50-p.fuse)/50;A.c.fillStyle=fl||'#ff3a2a';A.c.beginPath();A.c.ellipse(x,y-12,5*s,10*s,.3,0,6.283);A.c.fill();R(x+1,y-24,3,4,'#3a8a2a');}
  if(p.k===6){const open=p.chew>0?0:3+Math.sin(A.t*.15)*2;C(x,y-18,8,fl||'#a04ad0');R(x-1,y-18-open,10,open*2,'#3a0a2a');for(let i=0;i<3;i++){R(x+1+i*3,y-18-open,1,2,'#ffffff');R(x+1+i*3,y-18+open-2,1,2,'#ffffff');}if(p.chew>0){C(x+4,y-14,3,'#8aa06a');}}};
 const drawZ=z=>{const y=laneY(z.l),x=z.x,fl=z.fl?'#ffffff':null,sc=z.k==='brute'?1.35:.78,o={c:fl||(z.k==='flag'?'#8a3a3a':'#6a6a7a'),pants:'#3a3a4a',skin:fl||'#9ab08a',hair:'#3a3a2a',s:sc,st:z.st,d:-1,arm1:z.eat?1.2+Math.sin(A.t*.3)*.3:1.45,arm2:z.eat?1.0+Math.cos(A.t*.3)*.3:1.3};
  if(z.slow){o.c=fl||'#6a8aba';o.skin=fl||'#9ac0d8';}A.person(x,y,o);const hy=y-29*sc;
  if(z.arm>0&&z.k==='cone')A.poly([[x-5,hy-1],[x+5,hy-1],[x,hy-12]],'#ff8a2a',1);if(z.arm>0&&z.k==='bucket'){R(x-5,hy-7,10,8,'#9a9aa8');R(x-5,hy-7,10,2,'#c0c0d0');}
  if(z.sh>0){R(x-13,y-26*sc,8,20,'#8a8a9a');for(let i=0;i<4;i++)R(x-12,y-25*sc+i*5,6,1,'#5a5a6a');}
  if(z.k==='flag'){L(x+4,y-14,x+4,y-40,'#5a3a2a',1.5);R(x+4,y-40,12,8,K.r);}
  if(z.k==='run'&&!z.jumped)L(x-14,y-18,x+10,y-22,'#c0a070',1.5);
  if(z.k==='brute'&&z.smash>40){L(x-6,y-30,x-20,y-46+z.smash*.2,'#6a4a2a',4);}};
 g.draw=()=>{const c=A.c;A.cls('#2a5a2a');
  // house + lawn
  R(0,LY-6,LX-6,LN*LH+6,'#c8b088');for(let i=0;i<6;i++)R(0,LY-6+i*34,LX-6,2,'#a89068');
  for(let l=0;l<LN;l++)for(let cc=0;cc<COLS;cc++){c.fillStyle=(l+cc)%2?'#5cb84a':'#4eaa42';c.fillRect(LX+cc*CW,LY+l*LH,CW,LH);}
  c.fillStyle='rgba(0,0,0,.08)';for(let l=0;l<LN;l++)c.fillRect(LX,LY+l*LH+LH-3,COLS*CW,3);
  for(const f of flash){GA(f.t/30);R(LX,LY+f.l*LH,COLS*CW,LH,'#ff6a2a');GA(1);}
  // cursor
  const P=PL[sel];GA(.25+.1*Math.sin(A.t*.2));R(LX+cx*CW,LY+cy*LH,CW,LH,sel===8?'#ff4040':(sun>=(P?P.c:0)&&!cds[sel]?'#ffffff':'#ff4040'));GA(1);A.box(LX+cx*CW,LY+cy*LH,CW,LH,K.y);
  // mowers
  for(let l=0;l<LN;l++){if(mowers[l]===0)continue;const x=mowers[l]===1?LX-18:LX-20+mowers[l]-2,y=laneY(l);R(x-8,y-9,16,8,'#d04a3a');R(x-8,y-11,10,3,'#e86a5a');C(x-5,y-1,3,'#2a2a2a');C(x+5,y-1,3,'#2a2a2a');L(x+6,y-9,x+10,y-18,'#5a5a5a',1.5);}
  // plants & zombies by lane
  for(let l=0;l<LN;l++){for(let cc=0;cc<COLS;cc++){const p=at(l,cc);if(p)drawPlant(p,cellX(cc),laneY(l));}for(const z of zs)if(z.l===l&&z.x<340)drawZ(z);}
  for(const p of peas)C(p.x,p.y,3,p.fr?'#bfe8ff':'#8aff5a');
  for(const s of suns){GA(.35);C(s.x,s.y,11,'#ffe08a');GA(1);C(s.x,s.y,6,'#ffd23f');C(s.x-2,s.y-2,2,'#ffffff');}
  // seed bar
  R(0,0,320,40,'#5a3a1a');R(0,38,320,2,'#3a2410');box(2,3,34,34,'#3a2410','#8a6a3a');C(19,15,7,'#ffd23f');T(''+sun,19,26,K.w,1,'c');
  for(let i=0;i<9;i++){const x=38+i*31,on=sel===i;box(x,3,29,34,on?'#f0e0b0':'#c8b888',on?K.y:'#8a6a3a');if(i<8){const p=PL[i];drawPlant({k:i,hp:p.hp,chew:0,fuse:50},x+14,i===7?26:33);R(x+5,29,19,8,'rgba(40,24,10,.75)');T(''+p.c,x+14,30,'#fff3d6',1,'c');if(cds[i]>0||sun<p.c){GA(.5);R(x,3,29,34*(cds[i]>0?cds[i]/p.cd:1),'#000000');GA(1);}}else{L(x+8,30,x+20,10,'#8a8a9a',3);R(x+17,7,6,8,'#c0c0d0');}}
  // progress
  const prog=Math.min(1,wave/waveTot);R(196,230,118,6,'#1a2a1a');R(196,230,118*prog,6,'#9ad04a');for(const fw of[5,10,15]){const fx=196+118*fw/waveTot;R(fx-1,224,1,8,'#5a3a1a');R(fx,224,6,4,wave>=fw?K.r:'#ffd0d0');}T('WAVE '+wave+'/'+waveTot,190,231,K.w,1,'r');
  T(sel<8?PL[sel].n:'SHOVEL',4,231,K.y,1);if(msgT)T(msg,183,108,K.y,2,'c');};
 return g;}});

/* ---- POP DEFENSE: layered balloons, six towers with two upgrade paths, camo/lead, 30 rounds ---- */
A.add({id:'popdefense',name:'POP DEFENSE',cat:'ACTION',time:840,tags:'bloons tower defense balloons td',how:'MOVE CURSOR, A BUILDS, B PICKS TOWER. ON A TOWER: A/B BUY UPGRADES. SURVIVE 30 ROUNDS.',make(){
 const g={over:null,score:0},MW=256;
 const PATH=[[-12,30],[210,30],[210,88],[48,88],[48,148],[214,148],[214,204],[30,204],[30,252]];
 const seg=[];let plen=0;for(let i=0;i<PATH.length-1;i++){const[a,b]=[PATH[i],PATH[i+1]];const l=Math.hypot(b[0]-a[0],b[1]-a[1]);seg.push({a,b,l,s:plen});plen+=l;}
 const posAt=d=>{for(const s of seg)if(d<=s.s+s.l){const t=(d-s.s)/s.l;return[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];}return PATH[PATH.length-1];};
 const BT=[{n:'RED',c:'#ff3a3a',s:1,ch:[]},{n:'BLUE',c:'#3a8aff',s:1.35,ch:[0]},{n:'GREEN',c:'#3ad03a',s:1.7,ch:[1]},{n:'YELLOW',c:'#ffe03a',s:2.9,ch:[2]},{n:'PINK',c:'#ff7ab8',s:3.2,ch:[3]},
  {n:'BLACK',c:'#2a2a2a',s:1.7,ch:[4,4],ne:1},{n:'WHITE',c:'#f0f0f0',s:1.9,ch:[4,4],nf:1},{n:'LEAD',c:'#8a8a9a',s:1,ch:[5,5],ns:1},{n:'ZEBRA',c:'#f0f0f0',s:1.7,ch:[5,6],ne:1,nf:1},{n:'RAINBOW',c:'#ff9a3a',s:2.1,ch:[8,8]},{n:'CERAMIC',c:'#b0702a',s:2.2,ch:[9,9],hp:8},{n:'BLIMP',c:'#3a6ad0',s:.8,ch:[10,10,10,10],hp:140,big:1}];
 const rbe=t=>1+BT[t].ch.reduce((a,c)=>a+rbe(c),0)+(BT[t].hp?BT[t].hp-1:0);const RBE=BT.map((_,i)=>rbe(i));
 // towers: base stats and upgrades [path][tier] = {n,c,f(stats)}
 const TW=[
  {n:'DART POST',c:170,col:'#a0703a',r:68,rate:38,p:2,d:1,kind:'dart',ty:'sharp',desc:'FAST DARTS. CANNOT POP LEAD.',
   up:[[{n:'SHARP SHOTS',c:90,f:s=>s.p+=2},{n:'RAZOR DARTS',c:180,f:s=>s.p+=4},{n:'TRIPLE DARTS',c:450,f:s=>s.n=3}],[{n:'QUICK SHOTS',c:100,f:s=>s.rate*=.75},{n:'EAGLE EYE',c:200,f:s=>{s.r+=28;s.camo=1;}},{n:'CROSSBOW',c:600,f:s=>{s.d=2;s.p+=3;s.r+=18;s.ty='normal';}}]]},
  {n:'TACK RING',c:280,col:'#d05a8a',r:44,rate:58,p:1,d:1,kind:'tack',cnt:8,ty:'sharp',desc:'SPRAYS 8 TACKS ALL AROUND.',
   up:[[{n:'FASTER TACKS',c:150,f:s=>s.rate*=.7},{n:'HOT TACKS',c:300,f:s=>s.ty='fire'},{n:'RING OF FIRE',c:1200,f:s=>{s.kind='ring';s.rate=8;s.r+=6;s.ty='fire';}}],[{n:'MORE TACKS',c:100,f:s=>s.n=12},{n:'LONG TACKS',c:200,f:s=>{s.r+=14;s.p+=1;}},{n:'BLADE STORM',c:900,f:s=>{s.n=16;s.p=4;s.d=2;}}]]},
  {n:'BOMB CANNON',c:520,col:'#3a3a4a',r:80,rate:70,p:30,d:1,kind:'bomb',ty:'boom',bl:22,desc:'SPLASH. POPS LEAD, NOT BLACK.',
   up:[[{n:'BIGGER BOMBS',c:300,f:s=>s.bl=32},{n:'HEAVY BOMBS',c:500,f:s=>s.d=3},{n:'CLUSTER BOMBS',c:900,f:s=>s.cl=1}],[{n:'LONG RANGE',c:200,f:s=>s.r+=24},{n:'FAST RELOAD',c:400,f:s=>s.rate*=.7},{n:'BLIMP MAULER',c:800,f:s=>s.moab=1}]]},
  {n:'FROST CORE',c:300,col:'#7ad8ff',r:42,rate:100,p:40,d:1,kind:'ice',ty:'ice',fz:60,desc:'FREEZES NEARBY. NOT WHITE.',
   up:[[{n:'LONG FREEZE',c:150,f:s=>s.fz=90},{n:'PERMAFROST',c:250,f:s=>s.perma=1},{n:'ICICLES',c:500,f:s=>{s.d=2;s.icy=1;}}],[{n:'WIDE FREEZE',c:150,f:s=>s.r+=16},{n:'FAST FREEZE',c:350,f:s=>s.rate*=.6},{n:'ARCTIC SHARDS',c:700,f:s=>s.shard=1}]]},
  {n:'SNIPER NEST',c:350,col:'#5a7a3a',r:999,rate:80,p:1,d:2,kind:'snipe',ty:'normal',desc:'ANY RANGE. NEEDS SCOPE FOR CAMO.',
   up:[[{n:'FULL METAL',c:350,f:s=>s.d=4},{n:'LARGE CALIBER',c:1200,f:s=>s.d=7},{n:'DECIMATOR',c:2500,f:s=>{s.d=12;s.moab=1;}}],[{n:'NIGHT SCOPE',c:300,f:s=>s.camo=1},{n:'SEMI-AUTO',c:500,f:s=>s.rate*=.5},{n:'FULL AUTO',c:1600,f:s=>s.rate*=.4}]]},
  {n:'GLYPH TOWER',c:420,col:'#8a4ad0',r:64,rate:40,p:4,d:1,kind:'bolt',ty:'magic',desc:'MAGIC BOLTS PIERCE 4. NOT LEAD.',
   up:[[{n:'ARCANE BOLT',c:250,f:s=>s.d=2},{n:'FIREBALL',c:500,f:s=>s.fb=1},{n:'PHOENIX',c:2800,f:s=>s.phx=1}],[{n:'INTENSE FOCUS',c:200,f:s=>s.rate*=.7},{n:'SEER SIGHT',c:300,f:s=>s.camo=1},{n:'STORM CALL',c:1100,f:s=>s.storm=1}]]}];
 const R_=r=>{const L_=[];const add=(t,n,sp,camo)=>L_.push({t,n,sp,camo});
  const D={1:[[0,20,16]],2:[[0,30,12]],3:[[0,20,12],[1,6,20]],4:[[0,25,10],[1,12,16]],5:[[1,15,14],[0,10,10]],6:[[1,20,12],[2,4,24]],7:[[1,25,12],[2,6,22]],8:[[1,20,12],[2,12,18]],9:[[2,25,14]],10:[[1,40,8],[2,10,16]],
   11:[[3,10,22],[2,15,14]],12:[[2,20,12],[3,8,20]],13:[[1,30,8],[2,15,12],[3,6,20]],14:[[2,12,16,1],[3,10,20]],15:[[7,4,40],[3,15,16]],16:[[4,8,24],[2,15,12]],17:[[5,8,30],[3,12,16]],18:[[6,8,30],[4,10,18]],19:[[7,6,34],[3,10,18,1]],20:[[5,6,28],[6,6,28],[4,12,16]],
   21:[[8,4,40],[4,14,14]],22:[[8,8,34]],23:[[5,6,24],[6,6,24],[4,6,20,1],[7,4,30]],24:[[9,3,50],[8,10,30]],25:[[10,2,80],[9,6,40]],26:[[10,6,50],[4,10,16,1]],27:[[9,4,40],[10,6,44],[7,6,26]],28:[[11,1,1],[10,4,60]],29:[[10,8,44],[9,4,40,1]],30:[[11,2,260],[10,4,60]]};
  for(const e of D[r])add(e[0],e[1],e[2],e[3]);return L_;};
 let cash=750,lives=200,round=0,bal=[],shots=[],fx=[],towers=[],spawnQ=[],between=480,cur={x:120,y:120},sel=0,selT=null,ff=false,bid=0,msg='',msgT=0,phoenix=[];
 const say=(m,t)=>{msg=m;msgT=t||120;};
 const stats=t=>{const b=TW[t.k],s={r:b.r,rate:b.rate,p:b.p,d:b.d,kind:b.kind,ty:b.ty,n:b.cnt||1,bl:b.bl||0,fz:b.fz||0,camo:0};for(let p=0;p<2;p++)for(let i=0;i<t.u[p];i++)b.up[p][i].f(s);return s;};
 const nearPath=(x,y,m)=>{for(const s of seg){const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1];const t=cl(((x-s.a[0])*dx+(y-s.a[1])*dy)/(s.l*s.l),0,1);if(Math.hypot(s.a[0]+dx*t-x,s.a[1]+dy*t-y)<m)return true;}return false;};
 const canPlace=(x,y)=>x>8&&x<MW-8&&y>8&&y<232&&!nearPath(x,y,15)&&!towers.some(t=>Math.hypot(t.x-x,t.y-y)<16);
 const towerAt=(x,y)=>towers.find(t=>Math.hypot(t.x-x,t.y-y)<9);
 const canUp=(t,p)=>{const o=t.u[1-p],m=t.u[p];if(m>=3)return false;if(m>=2&&o>=3)return false;if(m>=2&&o>=2)return false;return true;};
 const upgrade=(t,p)=>{if(!canUp(t,p)){say('PATH LOCKED',60);S('lose');return;}const u=TW[t.k].up[p][t.u[p]];if(cash<u.c){say('NEED '+u.c,60);S('lose');return;}cash-=u.c;t.spent+=u.c;t.u[p]++;t.s=stats(t);S('win');A.burst(t.x,t.y,K.y,12,1.6);g.score+=u.c/10|0;};
 const place=(x,y)=>{const b=TW[sel];if(!canPlace(x,y)){S('lose');say('CANNOT BUILD THERE',50);return;}if(cash<b.c){S('lose');say('NOT ENOUGH CASH',50);return;}cash-=b.c;const t={k:sel,x,y,u:[0,0],cd:0,a:0,spent:b.c,pops:0,shots:0};t.s=stats(t);towers.push(t);selT=t;S('hit');A.burst(x,y,b.col,10,1.4);};
 const sell=t=>{cash+=Math.floor(t.spent*.7);towers=towers.filter(o=>o!==t);if(selT===t)selT=null;S('coin');};
 const mkB=(t,d,camo)=>({id:bid++,t,d,hp:BT[t].hp||1,camo,frz:0,slow:0,fl:0});
 const pop=(b,dmg,ty,tw,proj)=>{const T_=BT[b.t];if(ty==='sharp'&&T_.ns)return false;if(ty==='magic'&&T_.ns)return false;if(ty==='boom'&&T_.ne)return false;if(ty==='ice'&&(T_.nf||T_.ns))return false;
  if(b.frz&&ty==='sharp'&&!(tw&&tw.s.icy))return false;
  let d=dmg;if(tw&&tw.s.moab&&(b.t>=10))d*=5;while(d>0&&!b.dead){if(b.hp>1){const k=Math.min(d,b.hp-1);b.hp-=k;d-=k;b.fl=4;if(d<=0)break;}d--;cash+=1;g.score+=1;if(tw)tw.pops++;
   const ch=BT[b.t].ch;if(!ch.length){b.dead=1;fx.push({x:b.px,y:b.py,t:8,c:T_.c});break;}
   if(ch.length===1){b.t=ch[0];b.hp=BT[b.t].hp||1;fx.push({x:b.px,y:b.py,t:6,c:T_.c});}
   else{b.dead=1;fx.push({x:b.px,y:b.py,t:10,c:T_.c});ch.forEach((c,i)=>{const nb=mkB(c,b.d-i*4,b.camo);nb.px=b.px;nb.py=b.py;nb.frz=0;if(proj)proj.hit.add(nb.id);if(d>0&&i===0){nb.pend=d;}bal.push(nb);});break;}}
  if(T_.big&&b.dead){A.shake=8;S('boom');}return true;};
 const visible=(t,b)=>!b.camo||t.s.camo;
 const target=(t,r)=>{let best=null;for(const b of bal){if(b.dead||!visible(t,b))continue;if(Math.hypot(b.px-t.x,b.py-t.y)>r+(BT[b.t].big?8:4))continue;if(!best||b.d>best.d)best=b;}return best;};
 const startRound=()=>{round++;spawnQ=[];let at=0;for(const gp of R_(round)){for(let i=0;i<gp.n;i++){spawnQ.push({t:gp.t,at,camo:gp.camo});at+=gp.sp;}at+=20;}spawnQ.sort((a,b)=>a.at-b.at);say('ROUND '+round+(round===30?' - FINAL!':''),90);};
 let rt=0;
 g.dbg={add:(t,c,d)=>{const b=mkB(t,d,c);bal.push(b);},cash:v=>{cash=v;},get:()=>({cash,lives,round,towers,bal:bal.length}),place:(k,x,y)=>{sel=k;place(x,y);},up:(t,p)=>upgrade(t,p),canPlace,canUp};
 const step=()=>{if(spawnQ.length||bal.length){rt++;while(spawnQ.length&&spawnQ[0].at<=rt){const q=spawnQ.shift();const b=mkB(q.t,0,q.camo);bal.push(b);}}
  else if(round>0&&between===0){between=150;cash+=150+round*6;g.score+=50;S('score');if(round>=30){g.score+=lives*10;g.over='ROUND 30 CLEAR - VICTORY!';return;}}
  if(between>0){between--;if(between===0){rt=0;startRound();}}
  // balloons
  for(const b of bal){if(b.dead)continue;if(b.pend){const p=b.pend;b.pend=0;pop(b,p,'normal');}if(b.fl)b.fl--;if(b.frz>0){b.frz--;}else{b.d+=BT[b.t].s*.85*(b.slow>0?.5:1);if(b.slow>0)b.slow--;}const[x,y]=posAt(b.d);b.px=x;b.py=y;if(b.d>=plen){b.dead=1;lives-=Math.min(90,RBE[b.t]);S('lose');A.shake=3;if(lives<=0){lives=0;g.over='OUT OF LIVES - ROUND '+round;return;}}}
  // towers
  for(const t of towers){const s=t.s;if(t.cd>0)t.cd--;
   if(s.kind==='ring'){if(t.cd<=0){t.cd=s.rate;let hit=0;for(const b of bal)if(!b.dead&&Math.hypot(b.px-t.x,b.py-t.y)<s.r&&visible(t,b)){pop(b,s.d,'fire',t);if(++hit>=12)break;}}continue;}
   if(t.cd>0)continue;
   if(s.kind==='ice'){let any=false;for(const b of bal)if(!b.dead&&Math.hypot(b.px-t.x,b.py-t.y)<s.r&&(visible(t,b)||true)){any=true;}if(any){t.cd=s.rate;fx.push({ring:1,x:t.x,y:t.y,r:s.r,t:14,c:'#bfefff'});S('blip');for(const b of bal)if(!b.dead&&Math.hypot(b.px-t.x,b.py-t.y)<s.r){const T_=BT[b.t];if(T_.big)continue;if(T_.nf&&!s.icy||T_.ns)continue;pop(b,s.d,s.icy?'normal':'ice',t);if(!b.dead){b.frz=s.fz;if(s.perma)b.slow=300;}}
     if(s.shard){const tg=target(t,s.r+30);if(tg)for(let i=0;i<3;i++){const a=Math.atan2(tg.py-t.y,tg.px-t.x)+(i-1)*.25;shots.push({x:t.x,y:t.y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,p:3,d:1,ty:'sharp',life:30,hit:new Set(),tw:t,k:'shard'});}}}continue;}
   const tg=target(t,s.r);if(!tg)continue;t.cd=s.rate;{const fl=Math.hypot(tg.px-t.x,tg.py-t.y)/5;const pp=tg.frz?[tg.px,tg.py]:posAt(tg.d+BT[tg.t].s*.85*(tg.slow>0?.5:1)*fl);t.a=Math.atan2(pp[1]-t.y,pp[0]-t.x);}t.shots++;
   if(s.kind==='dart'||s.kind==='bolt'){for(let i=0;i<s.n;i++){const a=t.a+(i-(s.n-1)/2)*.2;shots.push({x:t.x,y:t.y,vx:Math.cos(a)*5,vy:Math.sin(a)*5,p:s.p,d:s.d,ty:s.ty,life:Math.ceil(s.r/5)+6,hit:new Set(),tw:t,k:s.kind});}S('shoot');
    if(s.fb&&t.shots%4===0)shots.push({x:t.x,y:t.y,tx:tg.px,ty_:tg.py,bomb:1,bl:24,d:2,ty:'fire',tw:t,life:40,k:'fb',vx:0,vy:0,hit:new Set()});
    if(s.storm&&t.shots%3===0){let last=tg,ch=[tg];for(let j=0;j<7;j++){let nb=null,nd=60;for(const b of bal)if(!b.dead&&!ch.includes(b)&&visible(t,b)){const d=Math.hypot(b.px-last.px,b.py-last.py);if(d<nd){nd=d;nb=b;}}if(!nb)break;ch.push(nb);last=nb;}fx.push({bolt:ch.map(b=>[b.px,b.py]),from:[t.x,t.y],t:10});ch.forEach(b=>pop(b,2,'normal',t));S('hit');}}
   else if(s.kind==='tack'){for(let i=0;i<s.n;i++){const a=i/s.n*6.283;shots.push({x:t.x,y:t.y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,p:s.p,d:s.d,ty:s.ty,life:Math.ceil(s.r/4),hit:new Set(),tw:t,k:'tack'});}S('shoot');}
   else if(s.kind==='bomb'){shots.push({x:t.x,y:t.y,tx:tg.px,ty_:tg.py,bomb:1,bl:s.bl,d:s.d,ty:'boom',tw:t,life:60,k:'bomb',cl:s.cl,vx:0,vy:0,hit:new Set()});S('shoot');}
   else if(s.kind==='snipe'){pop(tg,s.d,'normal',t);fx.push({line:[t.x,t.y,tg.px,tg.py],t:5});S('hit');}}
  if(towers.some(t=>t.s.phx)){for(const t of towers)if(t.s.phx){t.ph=(t.ph||0)+.04;const x=t.x+Math.cos(t.ph)*50,y=t.y+Math.sin(t.ph)*36;t.phx=x;t.phy=y;if(A.t%6===0)for(const b of bal)if(!b.dead&&Math.hypot(b.px-x,b.py-y)<16){pop(b,3,'fire',t);}}}
  // shots
  for(const s of shots){if(s.bomb){const d=Math.hypot(s.tx-s.x,s.ty_-s.y);if(d<5||--s.life<=0){s.dead=1;fx.push({ring:1,x:s.x,y:s.y,r:s.bl,t:10,c:'#ffb050'});S('boom');let n=0;for(const b of bal)if(!b.dead&&Math.hypot(b.px-s.x,b.py-s.y)<s.bl&&n<40){pop(b,s.d,s.ty,s.tw);n++;}if(s.cl)for(let i=0;i<6;i++){const a=i/6*6.283;shots.push({x:s.x,y:s.y,tx:s.x+Math.cos(a)*24,ty_:s.y+Math.sin(a)*24,bomb:1,bl:14,d:1,ty:'boom',tw:s.tw,life:12,vx:0,vy:0,hit:new Set()});}}else{s.x+=(s.tx-s.x)/d*5;s.y+=(s.ty_-s.y)/d*5;}continue;}
   s.x+=s.vx;s.y+=s.vy;if(--s.life<=0){s.dead=1;continue;}
   for(const b of bal){if(b.dead||s.hit.has(b.id))continue;const rr=BT[b.t].big?14:6;if(Math.abs(b.px-s.x)<rr&&Math.abs(b.py-s.y)<rr&&visible(s.tw,b)){s.hit.add(b.id);if(pop(b,s.d,s.ty,s.tw,s)){if(--s.p<=0){s.dead=1;break;}}else{s.dead=1;fx.push({x:s.x,y:s.y,t:4,c:'#c0c0c0'});break;}}}}
  shots=shots.filter(s=>!s.dead);bal=bal.filter(b=>!b.dead);fx.forEach(f=>f.t--);fx=fx.filter(f=>f.t>0);};
 g.update=()=>{if(msgT)msgT--;const k=A.in(0),h=A.hit(0);
  if(A.mouse.t>0&&!A.mouse.down){cur.x=A.mouse.x;cur.y=A.mouse.y;}else{const sp=k.b&&false?0:2;cur.x=cl(cur.x+ax(k)*sp,2,318);cur.y=cl(cur.y+ay(k)*sp,2,238);}
  if(A.mouse.down&&A.mouse.t>0){cur.x=A.mouse.x;cur.y=A.mouse.y;}
  const onMap=cur.x<MW,ht=onMap?towerAt(cur.x,cur.y):null,mouse=A.mouse.down;
  if(h.a){if(onMap){if(ht){if(mouse)selT=ht;else upgrade(ht,0);}else{place(Math.round(cur.x),Math.round(cur.y));}}
   else{for(let i=0;i<6;i++)if(cur.y>=34+i*19&&cur.y<34+i*19+18){sel=i;selT=null;S('blip');}
    if(selT){for(let p=0;p<2;p++)if(cur.y>=166+p*22&&cur.y<166+p*22+20)upgrade(selT,p);if(cur.y>=211&&cur.y<222)sell(selT);}
    if(cur.y>=226){ff=!ff;S('blip');}}}
  if(h.b){if(ht)upgrade(ht,1);else{sel=(sel+1)%6;selT=null;S('blip');}}
  if(ht&&!mouse)selT=ht;
  if(round===0&&between>0&&h.a&&!onMap&&cur.y>=226)between=1;
  step();if(ff&&!g.over)step();};
 // drawing
 const drawB=b=>{const T_=BT[b.t],x=b.px,y=b.py;if(x===undefined)return;const c=A.c;
  if(T_.big){c.fillStyle=b.fl?'#ffffff':T_.c;c.beginPath();c.ellipse(x,y,14,8,0,0,6.283);c.fill();R(x-10,y-1,20,2,'#2a4a9a');R(x+12,y-6,4,12,'#2a4a9a');T(''+b.hp,x,y-3,K.w,1,'c');return;}
  const r=b.t===10?6:4.6;if(b.camo)GA(.75);
  if(b.t===8){C(x,y,r,'#f0f0f0');R(x-r+1,y-2,r*2-2,1,'#1a1a1a');R(x-r+1,y+1,r*2-2,1,'#1a1a1a');}
  else if(b.t===9){C(x,y,r,'#ff4a4a');R(x-4,y-3,8,2,'#ffd040');R(x-4,y-1,8,2,'#4ad04a');R(x-4,y+1,8,2,'#4a8aff');}
  else{C(x,y,r,b.fl?'#ffffff':T_.c);if(b.t===10){L(x-3,y-4,x+1,y,'#5a3a1a',1);if(b.hp<6)L(x+1,y,x+4,y+3,'#5a3a1a',1);}}
  if(b.camo){c.fillStyle='#4a6a2a';c.fillRect(x-3,y-2,2,2);c.fillRect(x+1,y,2,2);c.fillRect(x-1,y+2,2,1);}
  if(b.frz){GA(.5);C(x,y,r+1.5,'#bfefff');}GA(1);R(x-1,y+r,2,2,A.mix(T_.c,'#000000',.3));};
 const drawT=t=>{const b=TW[t.k],c=A.c;C(t.x,t.y,8,'#3a3a3a');C(t.x,t.y,7,b.col);const a=t.a||0;
  if(t.k===0)L(t.x,t.y,t.x+Math.cos(a)*10,t.y+Math.sin(a)*10,'#5a3a1a',3);if(t.k===1){for(let i=0;i<8;i++){const q=i/8*6.283;R(t.x+Math.cos(q)*6-1,t.y+Math.sin(q)*6-1,2,2,'#ffd0e0');}}
  if(t.k===2)L(t.x,t.y,t.x+Math.cos(a)*11,t.y+Math.sin(a)*11,'#1a1a1a',5);if(t.k===3){C(t.x,t.y,4,'#ffffff');}if(t.k===4){L(t.x,t.y,t.x+Math.cos(a)*13,t.y+Math.sin(a)*13,'#2a2a1a',2);C(t.x,t.y,3,'#3a5a2a');}if(t.k===5){A.poly([[t.x,t.y-6],[t.x+5,t.y+4],[t.x-5,t.y+4]],'#d0a0ff',1);}
  for(let p=0;p<2;p++)for(let i=0;i<t.u[p];i++)R(t.x-7+i*3+p*8,t.y+9,2,2,p?K.c:K.y);};
 g.draw=()=>{const c=A.c;A.cls('#4a9a3a');c.fillStyle='#3e8a32';for(let i=0;i<70;i++)c.fillRect((i*67)%MW,(i*43)%240,3,2);
  c.strokeStyle='#8a6a3a';c.lineWidth=18;c.lineJoin='round';c.beginPath();c.moveTo(PATH[0][0],PATH[0][1]);for(const p of PATH)c.lineTo(p[0],p[1]);c.stroke();c.strokeStyle='#c8a868';c.lineWidth=14;c.stroke();
  for(const t of towers)drawT(t);
  for(const b of bal)if(!b.dead)drawB(b);
  for(const s of shots){if(s.bomb)C(s.x,s.y,3,'#1a1a1a');else if(s.k==='bolt')C(s.x,s.y,2.5,'#d0a0ff');else if(s.k==='tack')R(s.x-1,s.y-1,2,2,s.ty==='fire'?'#ff8a3a':'#e0e0e0');else if(s.k==='shard')R(s.x-1,s.y-1,3,3,'#bfefff');else L(s.x-s.vx,s.y-s.vy,s.x,s.y,'#3a2a1a',1.5);}
  for(const t of towers){if(t.s.kind==='ring'){GA(.18+.08*Math.sin(A.t*.3));C(t.x,t.y,t.s.r,'#ff7a2a');GA(1);}if(t.s.phx&&t.phx!==undefined){GA(.4);C(t.phx,t.phy,9,'#ffb030');GA(1);C(t.phx,t.phy,4,'#ffe060');}}
  for(const f of fx){GA(Math.min(1,f.t/8));if(f.ring)A.ring(f.x,f.y,f.r*(1-f.t/16),f.c);else if(f.line)L(f.line[0],f.line[1],f.line[2],f.line[3],'#ffffff',1);else if(f.bolt){let p=f.from;for(const q of f.bolt){L(p[0],p[1],q[0],q[1],'#bfe0ff',1.5);p=q;}}else{for(let i=0;i<4;i++)R(f.x+Math.cos(i*1.6+f.t)*(10-f.t),f.y+Math.sin(i*1.6+f.t)*(10-f.t),2,2,f.c);}GA(1);}
  // cursor & range
  const onMap=cur.x<MW,ht=onMap?towerAt(cur.x,cur.y):null;const sh=selT||ht;
  if(sh){GA(.15);C(sh.x,sh.y,Math.min(sh.s.r,300),'#ffffff');GA(1);A.ring(sh.x,sh.y,Math.min(sh.s.r,300),'#ffffff');}
  else if(onMap){const ok=canPlace(cur.x,cur.y)&&cash>=TW[sel].c;GA(.18);C(cur.x,cur.y,Math.min(TW[sel].r,300),ok?'#ffffff':'#ff3030');GA(.6);C(cur.x,cur.y,7,TW[sel].col);GA(1);A.ring(cur.x,cur.y,8,ok?K.w:K.r);}
  // sidebar
  R(MW,0,64,240,'#2a1a10');R(MW,0,2,240,'#8a6a3a');T('LIVES',MW+5,4,K.r,1);T(''+lives,316,4,K.w,1,'r');T('CASH',MW+5,13,K.y,1);T(''+cash,316,13,K.w,1,'r');T('ROUND',MW+5,22,K.c,1);T(Math.max(1,round)+'/30',316,22,K.w,1,'r');
  for(let i=0;i<6;i++){const b=TW[i],y=34+i*19,on=sel===i&&!selT;box(MW+4,y,58,18,on?'#5a3a1a':'#3a2410',on?K.y:'#5a4a2a');C(MW+13,y+9,6,b.col);T(b.n.split(' ')[0],MW+22,y+3,cash>=b.c?K.w:'#8a7a6a',1);T(''+b.c,MW+22,y+10,cash>=b.c?K.y:'#8a6a4a',1);}
  if(selT){const b=TW[selT.k];T(b.n,MW+33,152,K.w,1,'c');T('POPS '+selT.pops,MW+33,159,K.gr,1,'c');for(let p=0;p<2;p++){const y=166+p*22,lv=selT.u[p],can=canUp(selT,p),u=lv<3?b.up[p][lv]:null;box(MW+4,y,58,20,can&&u&&cash>=u.c?'#3a5a2a':'#3a2a1a',p?K.c:K.y);T((p?'B ':'A ')+(u?u.n.split(' ')[0]:'MAX'),MW+7,y+3,K.w,1);if(u)T(can?''+u.c:'LOCKED',MW+7,y+11,can?K.y:K.r,1);for(let i=0;i<3;i++)R(MW+52,y+3+i*5,6,3,i<lv?(p?K.c:K.y):'#1a1a1a');}
   box(MW+4,211,58,11,'#5a2a2a','#8a4a4a');T('SELL '+Math.floor(selT.spent*.7),MW+33,214,K.w,1,'c');}
  else{const b=TW[sel];T(b.n,MW+33,154,K.w,1,'c');const w=b.desc.split(' ');let ln='',yy=166;for(const x of w){if((ln+' '+x).trim().length>14){T(ln,MW+33,yy,K.gr,1,'c');yy+=8;ln=x;}else ln=(ln+' '+x).trim();}T(ln,MW+33,yy,K.gr,1,'c');}
  box(MW+4,226,58,12,ff?'#5a3a1a':'#3a2410',ff?K.y:'#5a4a2a');T(round===0&&between>0?'START':ff?'>> FAST':'> NORMAL',MW+33,229,ff?K.y:K.w,1,'c');
  if(!onMap){A.ring(cur.x,cur.y,3,K.y);R(cur.x-1,cur.y-1,2,2,K.y);}
  if(msgT)T(msg,MW/2,110,K.y,2,'c');if(between>0&&round<30)T(round===0?'BUILD TOWERS! ROUND 1 SOON':'NEXT ROUND IN '+Math.ceil(between/60),MW/2,226,K.w,1,'c');};
 return g;}});

/* ---- POKER ROGUE: poker hands vs blind targets, chips x mult, jokers, shop, antes and boss blinds ---- */
A.add({id:'pokerrogue',name:'POKER ROGUE',cat:'CARDS',time:1200,tags:'balatro poker roguelike deckbuilder jokers',how:'LEFT/RIGHT PICK, A SELECTS, UP PLAYS HAND, DOWN DISCARDS, B SORTS. BEAT EVERY BLIND.',make(){
 const g={over:null,score:0},ANTES=6,BASE=[300,700,1600,3600,7500,14000];
 const HN=['HIGH CARD','PAIR','TWO PAIR','THREE KIND','STRAIGHT','FLUSH','FULL HOUSE','FOUR KIND','STR FLUSH'],HB=[[5,1],[10,2],[20,2],[30,3],[30,4],[35,4],[40,4],[60,7],[100,8]],HU=[[10,1],[15,1],[20,1],[20,2],[30,3],[15,2],[25,2],[30,3],[40,4]];
 const RK=r=>r<=10?''+r:'JQKA'[r-11],CV=r=>r===14?11:r>10?10:r,SC=['#e8384f','#e8384f','#2a2a3a','#2a2a3a'];// hearts diamonds spades clubs
 const JK=[
  {n:'JESTER',c:2,d:'+4 MULT',e:{h:x=>x.m+=4}},
  {n:'HEART LOCKET',c:5,d:'+3 MULT PER HEART',e:{c:(x,cd)=>{if(cd.s===0)x.m+=3;}}},
  {n:'RUBY RING',c:5,d:'+3 MULT PER DIAMOND',e:{c:(x,cd)=>{if(cd.s===1)x.m+=3;}}},
  {n:'SPADE PIN',c:5,d:'+3 MULT PER SPADE',e:{c:(x,cd)=>{if(cd.s===2)x.m+=3;}}},
  {n:'CLOVER CHARM',c:5,d:'+3 MULT PER CLUB',e:{c:(x,cd)=>{if(cd.s===3)x.m+=3;}}},
  {n:'TWIN BELLS',c:4,d:'+8 MULT IF A PAIR',e:{h:(x,H)=>{if(H.pair)x.m+=8;}}},
  {n:'TRIPLE CROWN',xm:1,c:6,d:'X3 MULT IF 3 OF A KIND',e:{h:(x,H)=>{if(H.trip)x.m*=3;}}},
  {n:'ROAD RUNNER',c:5,d:'+12 MULT IF STRAIGHT',e:{h:(x,H)=>{if(H.str)x.m+=12;}}},
  {n:'PAINTER',c:5,d:'+10 MULT IF FLUSH',e:{h:(x,H)=>{if(H.fl)x.m+=10;}}},
  {n:'ODDBALL',c:4,d:'ODD RANKS +15 CHIPS',e:{c:(x,cd)=>{if(cd.r===14||cd.r%2===1&&cd.r<10)x.ch+=15;}}},
  {n:'EVENSTAR',c:4,d:'EVEN RANKS +4 MULT',e:{c:(x,cd)=>{if(cd.r<=10&&cd.r%2===0)x.m+=4;}}},
  {n:'COURTIER',c:5,d:'FACE CARDS +30 CHIPS',e:{c:(x,cd)=>{if(cd.r>=11&&cd.r<=13)x.ch+=30;}}},
  {n:'SCHOLAR',c:4,d:'ACES +20 CHIPS +4 MULT',e:{c:(x,cd)=>{if(cd.r===14){x.ch+=20;x.m+=4;}}}},
  {n:'BANKER',c:6,d:'+1 MULT PER 4 CASH',e:{h:x=>x.m+=Math.floor(st.cash/4)}},
  {n:'HOARDER',c:5,d:'+2 CHIPS PER DECK CARD',e:{h:x=>x.ch+=2*deck.length}},
  {n:'LAST CALL',xm:1,c:6,d:'X3 MULT ON LAST HAND',e:{h:x=>{if(st.hands===1)x.m*=3;}}},
  {n:'SNOWBALL',c:6,d:'+1 MULT EVERY HAND (GROWS)',e:{h:(x,H,j)=>{j.v=(j.v||0)+1;x.m+=j.v;}}},
  {n:'FRUGAL',c:5,d:'+3 MULT PER DISCARD LEFT',e:{h:x=>x.m+=3*st.disc}},
  {n:'MIRROR',c:7,d:'RETRIGGER FIRST CARD',e:{re:1}},
  {n:'GOLDEN GOOSE',c:6,d:'EARN 4 CASH EACH ROUND',e:{gold:4}},
  {n:'WILD CARD',c:5,d:'+0 TO 23 MULT',e:{h:x=>x.m+=ri(24)}},
  {n:'HALF MOON',c:5,d:'+20 MULT IF 3 OR FEWER',e:{h:(x,H)=>{if(H.n<=3)x.m+=20;}}},
  {n:'SPLASH',c:3,d:'EVERY PLAYED CARD SCORES',e:{sp:1}},
  {n:'OVERDRIVE',xm:1,c:8,d:'X1.5 MULT',e:{h:x=>x.m*=1.5}}];
 const BOSS=[{n:'THE WALL',d:'HUGE TARGET (X4)',t:4},{n:'THE THORN',d:'CLUBS ARE DEBUFFED',db:3},{n:'THE TIDE',d:'HEARTS ARE DEBUFFED',db:0},{n:'THE SINGLE',d:'ONLY ONE HAND',one:1,t:1.5},{n:'THE HALVER',d:'BASE CHIPS+MULT HALVED',half:1},{n:'THE FIVE',d:'MUST PLAY 5 CARDS',five:1},{n:'THE FANG',d:'DISCARDS 2 CARDS PER HAND',fang:1}];
 const st={ante:1,blind:0,cash:4,hands:4,disc:3,rs:0};let lv=Array(9).fill(1),jok=[],deck=[],hand=[],cur=0,sortS=false,phase='pre',anim=null,shopS=null,boss=null,bossOrder=shuf(BOSS.slice()),msg='',msgT=0,played=[],last=null,hist=[],pcount=Array(9).fill(0);
 const target=()=>{const b=BASE[st.ante-1];return Math.round(b*(st.blind===0?1:st.blind===1?1.5:(boss&&boss.t)||2));};
 const say=(m,t)=>{msg=m;msgT=t||100;};
 const newDeck=()=>{deck=[];for(let s=0;s<4;s++)for(let r=2;r<=14;r++)deck.push({r,s});shuf(deck);};
 const sortH=()=>{hand.sort((a,b)=>sortS?(a.s-b.s||b.r-a.r):(b.r-a.r||a.s-b.s));};
 const draw=()=>{while(hand.length<8&&deck.length)hand.push(Object.assign(deck.pop(),{sel:false,fx:0}));sortH();cur=Math.min(cur,hand.length-1);};
 const startBlind=()=>{boss=st.blind===2?bossOrder[(st.ante-1)%bossOrder.length]:null;st.hands=boss&&boss.one?1:4;st.disc=3;st.rs=0;newDeck();hand=[];draw();phase='play';played=[];S('coin');};
 const evalH=cs=>{const n=cs.length,cnt={};cs.forEach(c=>cnt[c.r]=(cnt[c.r]||0)+1);const groups=Object.entries(cnt).map(([r,c])=>({r:+r,c})).sort((a,b)=>b.c-a.c||b.r-a.r);
  const fl=n===5&&cs.every(c=>c.s===cs[0].s);let str=false;if(n===5&&groups.length===5){const rs=cs.map(c=>c.r).sort((a,b)=>a-b);str=rs[4]-rs[0]===4||rs.join()==='2,3,4,5,14';}
  let t=0,sc=[];const by=r=>cs.filter(c=>c.r===r);
  if(str&&fl){t=8;sc=cs;}else if(groups[0].c===4){t=7;sc=by(groups[0].r);}else if(groups[0].c===3&&groups[1]&&groups[1].c===2){t=6;sc=cs;}else if(fl){t=5;sc=cs;}else if(str){t=4;sc=cs;}else if(groups[0].c===3){t=3;sc=by(groups[0].r);}else if(groups[0].c===2&&groups[1]&&groups[1].c===2){t=2;sc=by(groups[0].r).concat(by(groups[1].r));}else if(groups[0].c===2){t=1;sc=by(groups[0].r);}else{t=0;sc=[cs.slice().sort((a,b)=>b.r-a.r)[0]];}
  return{t,sc,n,pair:groups[0].c>=2,trip:groups[0].c>=3,str,fl};};
 const base=t=>{let c=HB[t][0]+HU[t][0]*(lv[t]-1),m=HB[t][1]+HU[t][1]*(lv[t]-1);if(boss&&boss.half){c=Math.floor(c/2);m=Math.max(1,Math.floor(m/2));}return[c,m];};
 const debuffed=cd=>boss&&boss.db!==undefined&&cd.s===boss.db;
 const playHand=()=>{const sel=hand.filter(c=>c.sel);if(!sel.length){say('SELECT 1 TO 5 CARDS',60);S('lose');return;}if(boss&&boss.five&&sel.length!==5){say('THE FIVE: PLAY EXACTLY 5 CARDS',80);S('lose');return;}
  played=sel;hand=hand.filter(c=>!c.sel);const H=evalH(sel);const splash=jok.some(j=>JK[j.k].e.sp);const scoring=splash?sel:H.sc;const[bc,bm]=base(H.t);const x={ch:bc,m:bm};const steps=[];
  steps.push({k:'base',txt:HN[H.t]+' LV'+lv[H.t],ch:bc,m:bm});
  const seq=scoring.slice();if(jok.some(j=>JK[j.k].e.re)&&seq.length)seq.splice(1,0,seq[0]);
  for(const cd of seq){if(debuffed(cd)){steps.push({k:'card',cd,txt:'DEBUFFED',ch:x.ch,m:x.m});continue;}x.ch+=CV(cd.r);steps.push({k:'card',cd,txt:'+'+CV(cd.r),ch:x.ch,m:x.m});
   jok.forEach((j,ji)=>{const e=JK[j.k].e;if(e.c){const o=x.ch,om=x.m;e.c(x,cd);if(x.ch!==o||x.m!==om)steps.push({k:'joker',ji,txt:x.ch!==o?'+'+(x.ch-o)+' CHIPS':'+'+(x.m-om)+' MULT',ch:x.ch,m:x.m});}});}
  jok.forEach((j,ji)=>{const e=JK[j.k].e;if(e.h){const o=x.ch,om=x.m;e.h(x,H,j);if(x.ch!==o||x.m!==om){const txt=x.ch!==o?'+'+(x.ch-o)+' CHIPS':JK[j.k].xm?'X'+(Math.round(x.m/om*10)/10)+' MULT':'+'+Math.round(x.m-om)+' MULT';steps.push({k:'joker',ji,txt,ch:x.ch,m:x.m});}}});
  const tot=Math.floor(x.ch*x.m);steps.push({k:'total',tot,ch:x.ch,m:x.m});pcount[H.t]++;
  anim={steps,i:0,t:0,H,tot,scoring:new Set(scoring),showCh:bc,showM:bm,txt:'',ti:-1};phase='score';st.hands--;S('blip');};
 const finishHand=()=>{const a=anim;st.rs+=a.tot;g.score+=a.tot;last={n:HN[a.H.t],tot:a.tot};anim=null;played=[];
  if(st.rs>=target()){const rew=[3,4,5][st.blind],intr=Math.min(5,Math.floor(st.cash/5)),gold=jok.reduce((s,j)=>s+(JK[j.k].e.gold||0),0);const tot=rew+st.hands+intr+gold;st.cash+=tot;S('win');A.burst(160,90,K.y,30,2.5);
   say('BLIND BEATEN! +'+tot+' CASH ('+rew+' REWARD, '+st.hands+' HANDS, '+intr+' INTEREST'+(gold?', '+gold+' GOOSE':'')+')',220);
   if(st.blind===2&&st.ante===ANTES){g.score+=5000;g.over='VICTORY - ALL '+ANTES+' ANTES!';return;}openShop();return;}
  if(st.hands<=0){g.over='BUSTED ON ANTE '+st.ante;S('lose');return;}
  if(boss&&boss.fang){for(let i=0;i<2&&hand.length;i++)hand.splice(ri(hand.length),1);say('THE FANG TEARS 2 CARDS AWAY',80);}
  draw();phase='play';};
 const rollShop=()=>{const owned=new Set(jok.map(j=>j.k));const pool=JK.map((_,i)=>i).filter(i=>!owned.has(i));shuf(pool);const it=[];for(let i=0;i<2&&pool.length;i++)it.push({t:'j',k:pool.pop()});for(let i=0;i<2;i++)it.push({t:'p',k:ri(9)});return it;};
 const openShop=()=>{phase='shop';shopS={items:rollShop(),row:1,col:0,rr:5};};
 const nextBlind=()=>{st.blind++;if(st.blind>2){st.blind=0;st.ante++;}phase='pre';shopS=null;};
 const shopAct=(b)=>{const s=shopS;if(s.row===0){const j=jok[s.col];if(!j)return;if(b){if(s.col>0){jok.splice(s.col,1);jok.splice(s.col-1,0,j);s.col--;S('blip');}return;}st.cash+=Math.floor(JK[j.k].c/2);jok.splice(s.col,1);S('coin');say('SOLD '+JK[j.k].n,60);s.col=Math.max(0,Math.min(s.col,jok.length-1));return;}
  if(s.row===1){const it=s.items[s.col];if(!it)return;const cost=it.t==='j'?JK[it.k].c:3;if(st.cash<cost){say('NOT ENOUGH CASH',60);S('lose');return;}if(it.t==='j'&&jok.length>=5){say('JOKER SLOTS FULL (5). SELL ONE.',80);S('lose');return;}st.cash-=cost;if(it.t==='j'){jok.push({k:it.k,v:0});say('BOUGHT '+JK[it.k].n,60);}else{lv[it.k]++;say(HN[it.k]+' LEVEL UP! NOW LV'+lv[it.k],80);}s.items.splice(s.col,1);s.col=Math.max(0,Math.min(s.col,s.items.length-1));S('win');return;}
  if(s.row===2){if(s.col===0){if(st.cash<s.rr){say('NOT ENOUGH CASH',60);S('lose');return;}st.cash-=s.rr;s.rr++;s.items=rollShop();S('coin');}else nextBlind();}};
 g.dbg={get:()=>({st,hand,phase,jok,shopS,deck,lv}),evalH,base,play:idx=>{hand.forEach((c,i)=>c.sel=idx.includes(i));playHand();},disc:idx=>{hand.forEach((c,i)=>c.sel=idx.includes(i));discard();},start:startBlind,shopAct:(row,col,b)=>{shopS.row=row;shopS.col=col;shopAct(b);},JK};
 g.update=()=>{if(msgT)msgT--;const h=A.hit(0);
  if(phase==='pre'){if(h.a||mClick()){startBlind();}return;}
  if(phase==='score'){const a=anim;a.t++;const sp=A.in(0).a?3:9;if(a.t>=sp){a.t=0;if(a.i<a.steps.length){const s=a.steps[a.i];a.showCh=s.ch;a.showM=s.m;a.txt=s.txt||'';a.ti=s.k==='card'?played.indexOf(s.cd):-1;a.ji=s.k==='joker'?s.ji:-1;a.kind=s.k;if(s.k==='card'&&a.ti>=0){played[a.ti].fx=8;S('hit');}if(s.k==='joker')S('coin');if(s.k==='total'){S('score');A.shake=a.tot>=target()/2?6:2;}a.i++;}else if(a.t===0&&a.i>=a.steps.length){a.done=(a.done||0)+1;if(a.done>3)finishHand();}}return;}
  if(phase==='shop'){const s=shopS;const rows=[jok.length,s.items.length,2];if(h.u){s.row=(s.row+2)%3;S('blip');}if(h.d){s.row=(s.row+1)%3;S('blip');}if(rows[s.row]===0&&(h.u||h.d)){s.row=(s.row+(h.u?2:1))%3;}
   if(h.l)s.col--;if(h.r)s.col++;s.col=cl(s.col,0,Math.max(0,rows[s.row]-1));
   if(mClick()){const mx=A.mouse.x,my=A.mouse.y;if(my>=10&&my<56){s.row=0;s.col=cl(Math.floor((mx-90)/46),0,Math.max(0,jok.length-1));}else if(my>=84&&my<150){s.row=1;s.col=cl(Math.floor((mx-90)/56),0,Math.max(0,s.items.length-1));}else if(my>=164&&my<186){s.row=2;s.col=mx<205?0:1;}}
   if(h.a)shopAct(false);else if(h.b)shopAct(true);return;}
  if(phase==='play'){for(const c of hand)if(c.fx)c.fx--;
   if(h.l){cur=(cur+hand.length-1)%hand.length;S('blip');}if(h.r){cur=(cur+1)%hand.length;S('blip');}
   if(mClick()){const mx=A.mouse.x,my=A.mouse.y;if(my>=150){const i=Math.floor((mx-88)/29);if(i>=0&&i<hand.length){cur=i;const c=hand[i];if(c.sel||hand.filter(c=>c.sel).length<5){c.sel=!c.sel;S('blip');}}}else if(my>=128&&my<146){if(mx<200)playHand();else if(mx<260)discard();}return;}
   if(h.a&&hand[cur]){const c=hand[cur];if(c.sel||hand.filter(c=>c.sel).length<5){c.sel=!c.sel;S('blip');}else S('lose');}
   if(h.b){sortS=!sortS;const sel=hand[cur];sortH();cur=Math.max(0,hand.indexOf(sel));S('blip');}
   if(h.u)playHand();else if(h.d)discard();}};
 const discard=()=>{const sel=hand.filter(c=>c.sel);if(!sel.length){say('SELECT CARDS TO DISCARD',60);return;}if(st.disc<=0){say('NO DISCARDS LEFT',60);S('lose');return;}st.disc--;hand=hand.filter(c=>!c.sel);draw();S('shoot');};
 // ---- drawing ----
 const suit=(s,x,y,z)=>{const c=SC[s];if(s===0){C(x-z*.45,y-z*.2,z*.5,c);C(x+z*.45,y-z*.2,z*.5,c);A.poly([[x-z*.95,y],[x+z*.95,y],[x,y+z]],c,1);}else if(s===1){A.poly([[x,y-z],[x+z*.75,y],[x,y+z],[x-z*.75,y]],c,1);}else if(s===2){C(x-z*.45,y+z*.2,z*.5,c);C(x+z*.45,y+z*.2,z*.5,c);A.poly([[x-z*.95,y],[x+z*.95,y],[x,y-z]],c,1);R(x-.5,y+z*.2,1.5,z*.8,c);}else{C(x,y-z*.45,z*.42,c);C(x-z*.45,y+z*.15,z*.42,c);C(x+z*.45,y+z*.15,z*.42,c);R(x-.5,y,1.5,z,c);}};
 const card=(cd,x,y,hi,dim)=>{const c=A.c;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+2,y+2,26,36);R(x,y,26,36,'#f8f4ea');A.box(x,y,26,36,hi?K.y:'#b8b0a0');if(hi)A.box(x-1,y-1,28,38,K.y);const col=SC[cd.s];T(RK(cd.r),x+3,y+3,col,1);suit(cd.s,x+5,y+13,3);suit(cd.s,x+15,y+23,6.5);if(cd.r>=11&&cd.r<=13){R(x+4,y+31,18,2,'#d8b040');}
  if(dim||debuffed(cd)){GA(.55);R(x,y,26,36,'#5a5a6a');GA(1);if(debuffed(cd)){L(x+4,y+4,x+22,y+32,K.r,2);L(x+22,y+4,x+4,y+32,K.r,2);}}};
 const jcard=(j,x,y,hi,w)=>{w=w||40;const J=JK[j.k];box(x,y,w,44,'#2a1a4a',hi?K.y:'#8a5ad0');R(x+2,y+2,w-4,22,'#4a2a7a');C(x+w/2,y+13,7,'#ffd23f');R(x+w/2-3,y+11,2,2,'#2a1a10');R(x+w/2+1,y+11,2,2,'#2a1a10');R(x+w/2-3,y+16,6,1,'#2a1a10');A.poly([[x+w/2-8,y+8],[x+w/2-12,y+2],[x+w/2-3,y+6]],K.r,1);A.poly([[x+w/2+8,y+8],[x+w/2+12,y+2],[x+w/2+3,y+6]],K.c,1);
  const ws=J.n.split(' ');T(ws[0].slice(0,9),x+w/2,y+27,K.w,1,'c');if(ws[1])T(ws[1].slice(0,9),x+w/2,y+34,K.w,1,'c');if(j.v)T('+'+j.v,x+w-3,y+3,K.y,1,'r');};
 const wrap=(s,n)=>{const out=[''];for(const w of s.split(' ')){if((out[out.length-1]+' '+w).trim().length>n)out.push(w);else out[out.length-1]=(out[out.length-1]+' '+w).trim();}return out;};
 const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?Math.round(n/1e3)+'K':''+Math.round(n);
 const side=()=>{R(0,0,84,240,'#1a1230');R(84,0,1,240,'#4a3a7a');const bl=['SMALL BLIND','BIG BLIND',boss?boss.n:'BOSS BLIND'][st.blind];box(4,4,76,38,st.blind===2?'#5a1a2a':'#2a2a5a',st.blind===2?K.r:K.c);T(bl,42,8,K.w,1,'c');T('SCORE AT LEAST',42,17,K.gr,1,'c');T(fmt(target()),42,26,K.r,2,'c');
  box(4,46,76,18,'#120c22','#3a2a5a');T('ROUND',8,48,K.gr,1);T(fmt(st.rs),76,55,K.w,1,'r');
  const a=anim;const ch=a?a.showCh:0,m=a?a.showM:0;let hn=a?HN[a.H.t]:'';if(!a&&phase==='play'){const sel=hand.filter(c=>c.sel);if(sel.length){const H=evalH(sel);hn=HN[H.t]+' LV'+lv[H.t];const b=base(H.t);box(4,68,76,32,'#120c22','#3a2a5a');T(hn,42,71,K.w,1,'c');box(8,80,32,14,'#1a5aa0');T(''+b[0],24,84,K.w,1,'c');T('X',42,84,K.r,1,'c');box(44,80,32,14,'#a02a3a');T(''+b[1],60,84,K.w,1,'c');}}
  if(a){box(4,68,76,32,'#120c22','#3a2a5a');T(hn,42,71,K.w,1,'c');box(8,80,32,14,'#1a5aa0');T(fmt(ch),24,84,K.w,1,'c');T('X',42,84,K.r,1,'c');box(44,80,32,14,'#a02a3a');T(fmt(m),60,84,K.w,1,'c');}
  box(4,104,36,20,'#14204a','#3a5aa0');T('HANDS',22,106,K.gr,1,'c');T(''+st.hands,22,114,K.c,1,'c');box(44,104,36,20,'#4a1420','#a03a5a');T('DISC',62,106,K.gr,1,'c');T(''+st.disc,62,114,K.r,1,'c');
  box(4,128,76,14,'#2a2a10','#a08a3a');C(13,135,4,K.y);T('CASH '+st.cash,22,133,K.y,1);
  T('ANTE '+st.ante+'/'+ANTES,42,148,K.w,1,'c');T('DECK '+deck.length+'/52',42,158,K.gr,1,'c');if(last)T(last.n,42,172,K.gr,1,'c'),T(fmt(last.tot),42,180,K.w,1,'c');
  if(boss){wrap(boss.d,18).forEach((l,i)=>T(l,42,196+i*8,K.r,1,'c'));}};
 g.draw=()=>{A.cls('#2a5a3a');const c=A.c;c.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<12;i++){c.beginPath();c.arc(200,120,40+i*22,0,6.283);c.lineWidth=8;c.strokeStyle='rgba(0,0,0,.06)';c.stroke();}
  side();
  // jokers
  for(let i=0;i<5;i++){const x=90+i*46,y=8;if(jok[i]){const hi=anim&&anim.ji===i&&anim.kind==='joker';jcard(jok[i],x,y-(hi?4:0),hi||(phase==='shop'&&shopS.row===0&&shopS.col===i));}else{GA(.25);A.box(x,y,40,44,'#ffffff');GA(1);}}
  T(jok.length+'/5 JOKERS',314,56,K.gr,1,'r');
  if(phase==='pre'){box(96,66,216,120,'#1a1230',K.y);T('ANTE '+st.ante,204,72,K.y,2,'c');for(let b=0;b<3;b++){const x=104+b*68,on=b===st.blind,bb=b===2?bossOrder[(st.ante-1)%bossOrder.length]:null;box(x,88,64,74,on?(b===2?'#5a1a2a':'#2a2a5a'):'#140c22',on?K.y:'#3a2a5a');T(b<2?['SMALL','BIG'][b]:bb.n.replace('THE ',''),x+32,92,on?K.w:K.gr,1,'c');T(fmt(Math.round(BASE[st.ante-1]*[1,1.5,(bb&&bb.t)||2][b])),x+32,104,K.r,1,'c');T('REWARD '+[3,4,5][b],x+32,114,K.y,1,'c');if(bb)wrap(bb.d,15).forEach((l,i)=>T(l,x+32,128+i*8,K.r,1,'c'));if(b<st.blind)T('BEATEN',x+32,150,K.g,1,'c');}
   if(A.t%60<40)T('PRESS A TO PLAY THE BLIND',204,170,K.w,1,'c');}
  if(phase==='play'||phase==='score'){
   // played cards
   played.forEach((cd,i)=>{const x=200-played.length*15+i*30,sc=anim&&anim.scoring.has(cd);card(cd,x,70-(cd.fx||0),anim&&anim.ti===i,!sc&&!!anim);if(anim&&anim.ti===i&&anim.kind==='card')T(anim.txt,x+13,60-(cd.fx||0),anim.txt==='DEBUFFED'?K.r:'#6ac0ff',1,'c');});
   if(anim&&anim.kind==='joker'&&anim.ji>=0)T(anim.txt,110+anim.ji*46,56,K.y,1,'c');
   if(anim&&anim.kind==='total')T(fmt(anim.tot),204,112,K.y,3,'c');
   // buttons
   if(phase==='play'){box(140,128,58,16,'#1a5aa0','#6ac0ff');T('UP: PLAY',169,133,K.w,1,'c');box(206,128,58,16,'#a02a3a','#ff8a9a');T('DN: DISCARD',235,133,K.w,1,'c');T(sortS?'B: SORT RANK':'B: SORT SUIT',314,120,K.gr,1,'r');}
   // hand
   hand.forEach((cd,i)=>{const x=88+i*29,y=180-(cd.sel?12:0);card(cd,x,y,i===cur&&phase==='play');});if(phase==='play'&&hand[cur])A.poly([[88+cur*29+13,226],[88+cur*29+9,232],[88+cur*29+17,232]],K.y,1);
   T(hand.filter(c=>c.sel).length+'/5 SELECTED',314,110,K.gr,1,'r');}
  if(phase==='shop'){const s=shopS;box(88,62,228,170,'#1a1230','#d0a040');T('SHOP',202,66,K.y,2,'c');
   s.items.forEach((it,i)=>{const x=94+i*56,y=84,on=s.row===1&&s.col===i;if(it.t==='j'){jcard({k:it.k},x,y,on,50);const lines=wrap(JK[it.k].d,12);lines.forEach((l,j)=>T(l,x+25,y+48+j*7,K.c,1,'c'));}else{box(x,y,50,44,'#1a2a4a',on?K.y:'#4a8ad0');C(x+25,y+15,9,['#ff8a5a','#5aa0ff','#ffd06a','#a06aff','#5ad08a','#ff6aa0','#c0c0c0','#ff4a4a','#ffffff'][it.k]);R(x+12,y+14,26,2,'#e0e0ff');T('PLANET',x+25,y+28,K.w,1,'c');T('LV '+lv[it.k]+'>'+(lv[it.k]+1),x+25,y+36,K.y,1,'c');wrap(HN[it.k],12).forEach((l,j)=>T(l,x+25,y+48+j*7,K.c,1,'c'));}
    const cost=it.t==='j'?JK[it.k].c:3;box(x+14,y-6,22,8,'#2a2a10');T(''+cost,x+25,y-5,st.cash>=cost?K.y:K.r,1,'c');});
   const b0=s.row===2&&s.col===0,b1=s.row===2&&s.col===1;box(100,167,96,16,b0?'#5a3a1a':'#3a2410',b0?K.y:'#8a6a3a');T('REROLL ('+s.rr+')',148,172,K.w,1,'c');box(208,167,100,16,b1?'#1a5a2a':'#143a1a',b1?K.y:'#4a8a4a');T('NEXT BLIND >',258,172,K.w,1,'c');
   if(s.row===0&&jok[s.col]){const J=JK[jok[s.col].k];T(J.n+': '+J.d,202,190,K.c,1,'c');T('A SELL FOR '+Math.floor(J.c/2)+'   B MOVE LEFT',202,200,K.gr,1,'c');}else T('UP/DOWN ROWS  LEFT/RIGHT PICK  A BUY',202,196,K.gr,1,'c');
   T('CASH '+st.cash,202,214,K.y,1,'c');}
  if(msgT){const w=Math.min(232,msg.length*4+8);box(202-w/2,151,w,12,'rgba(10,6,20,.9)','#d0a040');T(msg.length>57?msg.slice(0,57):msg,202,154,K.w,1,'c');}};
 return g;}});
})();
