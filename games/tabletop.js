(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],SU=['♥','♦','♣','♠'];const deck=n=>{const d=[];for(let k=0;k<(n||1);k++)for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r,up:false});return shuf(d);};
const card=(x,y,c,hl,w,h)=>{w=w||22;h=h||30;if(!c){A.box(x,y,w,h,'rgba(255,255,255,.3)');return;}if(!c.up){R(x,y,w,h,'#2a4ab0');A.box(x,y,w,h,'#ffffff');R(x+3,y+3,w-6,h-6,'#3a5ad0');if(hl)A.box(x-1,y-1,w+2,h+2,K.y);return;}R(x,y,w,h,'#fdfaf2');A.box(x,y,w,h,hl?K.y:'#333');const col=c.s<2?'#d02040':'#111';T(RK[c.r],x+2,y+2,col,1);const cc=A.c;if(cc.fillText){cc.save();cc.font='10px "Segoe UI Symbol","DejaVu Sans",sans-serif';cc.fillStyle=col;cc.textAlign='center';cc.textBaseline='middle';cc.fillText(SU[c.s],x+w-6,y+6);cc.font='14px "Segoe UI Symbol","DejaVu Sans",sans-serif';cc.fillText(SU[c.s],x+w/2,y+h/2+3);cc.restore();}if(hl)A.box(x-1,y-1,w+2,h+2,K.y);};
const die=(x,y,v,col)=>{R(x,y,22,22,col||'#fdfaf2');A.box(x,y,22,22,'#333');const P={1:[[11,11]],2:[[6,6],[16,16]],3:[[6,6],[11,11],[16,16]],4:[[6,6],[16,6],[6,16],[16,16]],5:[[6,6],[16,6],[11,11],[6,16],[16,16]],6:[[6,5],[16,5],[6,11],[16,11],[6,17],[16,17]]}[v]||[];P.forEach(p=>C(x+p[0],y+p[1],1.8,K.k));};

/* ---- DICE KINGS (Yahtzee-style) ---- */
const CAT=['ONES','TWOS','THREES','FOURS','FIVES','SIXES','3 OF A KIND','4 OF A KIND','FULL HOUSE','SM STRAIGHT','LG STRAIGHT','FIVE ALIKE','CHANCE'];
const scoreCat=(d,c)=>{const cnt=[0,0,0,0,0,0,0];d.forEach(v=>cnt[v]++);const sum=d.reduce((a,b)=>a+b,0),mx=Math.max(...cnt),s=[...new Set(d)].sort().join('');if(c<6)return cnt[c+1]*(c+1);if(c===6)return mx>=3?sum:0;if(c===7)return mx>=4?sum:0;if(c===8)return cnt.includes(3)&&cnt.includes(2)?25:0;if(c===9)return /1234|2345|3456/.test(s)?30:0;if(c===10)return /12345|23456/.test(s)?40:0;if(c===11)return mx===5?50:0;return sum;};
A.add({id:'dicekings',name:'DICE KINGS',cat:'BOARD',vs:1,how:'A ROLLS (3 A TURN), B HOLDS A DIE, UP/DOWN PICK A ROW, A SCORES IT.',make(){
 const g={over:null,score:0};let sc=[Array(13).fill(null),Array(13).fill(null)],p=0,d=[1,1,1,1,1],hold=[0,0,0,0,0],rolls=0,dc=0,row=0,mode='dice',think=0,anim=0;
 const tot=i=>{const up=sc[i].slice(0,6).reduce((a,b)=>a+(b||0),0);return sc[i].reduce((a,b)=>a+(b||0),0)+(up>=63?35:0);};
 const roll=()=>{d=d.map((v,i)=>hold[i]?v:1+ri(6));rolls++;anim=12;S('blip');};const take=c=>{sc[p][c]=scoreCat(d,c);S('coin');rolls=0;hold=[0,0,0,0,0];p=1-p;think=0;mode='dice';row=sc[p].findIndex(v=>v===null);if(sc[0].every(v=>v!==null)&&sc[1].every(v=>v!==null)){const a=tot(0),b=tot(1);g.over=a===b?'DRAW!':A.win(a>b?0:1);}};
 g.update=()=>{if(anim)anim--;if(A.cpu&&p===1){if(++think<30)return;think=0;if(rolls===0){roll();return;}const open=[...Array(13).keys()].filter(c=>sc[1][c]===null);const best=open.reduce((b,c)=>scoreCat(d,c)+(c<6?c*.3:0)>scoreCat(d,b)+(b<6?b*.3:0)?c:b,open[0]);if(rolls<3&&scoreCat(d,best)<(A.lvl===0?5:20)){const cnt=[0,0,0,0,0,0,0];d.forEach(v=>cnt[v]++);const keep=cnt.indexOf(Math.max(...cnt));hold=d.map(v=>v===keep?1:0);roll();return;}take(best);return;}
  const h=A.hit(human(p));if(mode==='dice'){if(h.l)dc=(dc+4)%5;if(h.r)dc=(dc+1)%5;if(h.b&&rolls>0){hold[dc]^=1;S('blip');}if(h.a&&rolls<3)roll();if((h.u||h.d)&&rolls>0){mode='rows';row=sc[p].findIndex(v=>v===null);}}else{if(h.u){do{row=(row+12)%13;}while(sc[p][row]!==null);}if(h.d){do{row=(row+1)%13;}while(sc[p][row]!==null);}if(h.a)take(row);if(h.b||h.l||h.r)mode='dice';}};
 g.draw=()=>{A.cls('#0f5a2a');d.forEach((v,i)=>die(14+i*28,196,anim&&!hold[i]?1+ri(6):v,hold[i]?'#ffe98a':null));if(mode==='dice'&&!(A.cpu&&p===1))A.box(13+dc*28,195,24,24,K.y);T('ROLLS '+rolls+'/3',160,204,K.w,1);T(A.nm(p)+' TO PLAY',160,216,p?K.p:K.c,1);
  CAT.forEach((c,i)=>{const y=6+i*14,act=mode==='rows'&&i===row&&!(A.cpu&&p===1);R(150,y-1,166,13,act?'#3a7a4a':i%2?'#136a33':'#0f5a2a');T(c,154,y+2,K.w,1);for(let q=0;q<2;q++){const v=sc[q][i];T(v===null?(q===p&&rolls?'('+scoreCat(d,i)+')':'-'):v,q?310:280,y+2,v===null?K.gr:q?K.p:K.c,1,'r');}});T(A.nm(0)+' '+tot(0),14,20,K.c,2);T(A.nm(1)+' '+tot(1),14,44,K.p,2);T('UP/DOWN: PICK ROW',14,80,K.gr,1);};
 return g;}});

/* ---- CODE BREAKER (Mastermind) ---- */
A.add({id:'codebreaker',name:'CODE BREAKER',cat:'PUZZLE',how:'CRACK THE 4-COLOUR CODE. LEFT/RIGHT PICK A SLOT, UP/DOWN COLOUR, A SUBMITS. 10 TRIES.',make(){
 const g={over:null,score:0},PC=[K.r,K.y,K.g,K.b,K.p,K.o];let code=[...Array(4)].map(()=>ri(6)),rows=[],cur=[0,0,0,0],slot=0,solved=0,wait=0;
 const mark=gs=>{let bl=0,wh=0;const a=[],b=[];for(let i=0;i<4;i++){if(gs[i]===code[i])bl++;else{a.push(code[i]);b.push(gs[i]);}}b.forEach(v=>{const j=a.indexOf(v);if(j>=0){wh++;a.splice(j,1);}});return[bl,wh];};
 g.update=()=>{if(wait){if(--wait===0){if(g.lost){g.over='CODE WAS SAFE';return;}code=[...Array(4)].map(()=>ri(6));rows=[];cur=[0,0,0,0];}return;}const h=A.hit(0);if(h.l)slot=(slot+3)%4;if(h.r)slot=(slot+1)%4;if(h.u)cur[slot]=(cur[slot]+1)%6;if(h.d)cur[slot]=(cur[slot]+5)%6;if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){const m=mark(cur);rows.push({g:cur.slice(),m});S('hit');if(m[0]===4){solved++;g.score+=(11-rows.length)*100;S('win');A.confetti();wait=80;}else if(rows.length>=10){g.lost=1;wait=100;S('lose');}}};
 g.draw=()=>{A.cls('#3a2a18');R(80,4,160,232,'#5b3a1e');rows.forEach((r,i)=>{const y=210-i*20;r.g.forEach((c,j)=>C(100+j*22,y,7,PC[c]));for(let k=0;k<4;k++){const px=200+(k%2)*8,py=y-4+(k>>1)*8;C(px,py,2.5,k<r.m[0]?K.k:k<r.m[0]+r.m[1]?K.w:'#3a2a18');}});
  const y=210-rows.length*20;if(!wait&&rows.length<10){cur.forEach((c,j)=>{C(100+j*22,y,7,PC[c]);if(j===slot)A.ring(100+j*22,y,9,K.y);});}if(wait)code.forEach((c,j)=>C(100+j*22,16,7,PC[c]));else{R(90,10,90,14,'#2a1a0a');T('? ? ? ?',135,14,K.gr,1,'c');}
  T('BLACK = RIGHT SPOT',250,40,K.w,1);T('WHITE = WRONG SPOT',250,52,K.w,1);T('SOLVED '+solved,250,80,K.y,1);T('SCORE '+g.score,250,92,K.y,1);};
 return g;}});

/* ---- solitaire helpers ---- */
const seqDown=(a,b)=>b.r===a.r-1;const redBlack=(a,b)=>(a.s<2)!==(b.s<2);

/* ---- FREECELL ---- */
A.add({id:'freecell',name:'FREECELL',cat:'CARDS',low:1,how:'PICK A COLUMN (UP FOR CELLS). A LIFTS, A DROPS. BUILD DOWN IN ALTERNATE COLOURS.',make(){
 const g={over:null,score:0};let cols=[[],[],[],[],[],[],[],[]],cells=[null,null,null,null],found=[[],[],[],[]],cur=0,top=false,held=null,moves=0;deck().forEach((c,i)=>{c.up=true;cols[i%8].push(c);});
 const src=()=>top?(cur<4?{k:'cell',i:cur}:{k:'f',i:cur-4}):{k:'col',i:cur};
 const place=(c,t)=>{if(t.k==='cell'){if(cells[t.i])return false;cells[t.i]=c;return true;}if(t.k==='f'){const f=found[t.i];if((!f.length&&c.r===0)||(f.length&&f[f.length-1].s===c.s&&f[f.length-1].r===c.r-1)){f.push(c);return true;}return false;}const col=cols[t.i];if(!col.length||(seqDown(col[col.length-1],c)&&redBlack(col[col.length-1],c))){col.push(c);return true;}return false;};
 const auto=()=>{let mv=true;while(mv){mv=false;for(const arr of[...cols,cells.map(c=>c?[c]:[])]){const c=arr[arr.length-1];if(!c)continue;for(let f=0;f<4;f++){const F=found[f];if((!F.length&&c.r===0)||(F.length&&F[F.length-1].s===c.s&&F[F.length-1].r===c.r-1&&c.r<=Math.min(...found.map(q=>q.length))+1)){F.push(c);const ci=cells.indexOf(c);if(ci>=0)cells[ci]=null;else cols.find(q=>q[q.length-1]===c).pop();mv=true;break;}}if(mv)break;}}};
 g.update=()=>{const h=A.hit(0);if(h.l)cur=(cur+7)%8;if(h.r)cur=(cur+1)%8;if(h.u)top=true;if(h.d)top=false;if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){const s=src();if(!held){let c=null;if(s.k==='cell'){c=cells[s.i];if(c)cells[s.i]=null;}else if(s.k==='col'){c=cols[s.i].pop();}if(c){held={c,from:s};S('hit');}}else{if(place(held.c,s)){moves++;S('coin');held=null;auto();if(found.every(f=>f.length===13)){g.score=Math.max(100,1000-moves*5);g.over='SOLVED IN '+moves+' MOVES! WIN';A.confetti();}}else{const f=held.from;if(f.k==='cell')cells[f.i]=held.c;else cols[f.i].push(held.c);held=null;S('lose');}}}if(h.b&&held){const f=held.from;if(f.k==='cell')cells[f.i]=held.c;else cols[f.i].push(held.c);held=null;}};
 g.draw=()=>{A.cls('#0f5a2a');cells.forEach((c,i)=>card(8+i*26,6,c,top&&cur===i));found.forEach((f,i)=>card(210+i*26,6,f[f.length-1]||null,top&&cur===4+i));cols.forEach((col,i)=>{const x=10+i*38,step=Math.min(12,150/Math.max(1,col.length));col.forEach((c,j)=>card(x,44+j*step,c,!top&&cur===i&&j===col.length-1));if(!col.length)card(x,44,null,!top&&cur===i);});
  if(held){const x=top?(cur<4?8+cur*26:210+(cur-4)*26):10+cur*38;card(x+4,top?40:30,held.c,true);}T('MOVES '+moves,160,14,K.w,1,'c');};
 return g;}});

/* ---- SPIDER (one suit) ---- */
A.add({id:'spider',name:'SPIDER SOLITAIRE',cat:'CARDS',how:'PICK A COLUMN, UP/DOWN SETS HOW MANY, A MOVES. B DEALS. BUILD K TO A.',make(){
 const g={over:null,score:0};let d=deck(2).map(c=>({...c,s:3})),cols=[...Array(10)].map(()=>[]),cur=0,n=1,held=null,done=0,moves=0;for(let i=0;i<54;i++){const c=d.pop();cols[i%10].push(c);}cols.forEach(c=>c[c.length-1].up=true);
 const runLen=col=>{let k=1;while(k<col.length&&col[col.length-k-1].up&&col[col.length-k-1].r===col[col.length-k].r+1)k++;return k;};
 const flip=()=>cols.forEach(c=>{if(c.length&&!c[c.length-1].up)c[c.length-1].up=true;});const complete=()=>{cols.forEach(c=>{if(c.length>=13){const tail=c.slice(-13);if(tail.every((q,i)=>q.up&&q.r===12-i)){c.splice(-13);done++;g.score+=100;S('win');}}});flip();if(done>=8){g.over='ALL SUITS BUILT! WIN';A.confetti();}};
 g.update=()=>{const h=A.hit(0);if(h.l)cur=(cur+9)%10;if(h.r)cur=(cur+1)%10;if(!held){const mx=cols[cur].length?runLen(cols[cur]):1;if(h.u)n=Math.min(mx,n+1);if(h.d)n=Math.max(1,n-1);n=Math.min(n,mx);}if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){if(!held){if(cols[cur].length){held={cs:cols[cur].splice(-n),from:cur};S('hit');}}else{const col=cols[cur],top=col[col.length-1];if(cur!==held.from&&(!top||top.r===held.cs[0].r+1)){col.push(...held.cs);moves++;S('coin');complete();}else{cols[held.from].push(...held.cs);S('lose');}held=null;n=1;}}
  if(h.b&&!held){if(d.length&&cols.every(c=>c.length)){cols.forEach(c=>{const q=d.pop();q.up=true;c.push(q);});S('blip');complete();}else S('lose');}
  if(!d.length&&!held&&A.t%30===0){const can=cols.some((c,i)=>c.length&&cols.some((o,j)=>j!==i&&(!o.length||[...Array(runLen(c)).keys()].some(k=>o[o.length-1].r===c[c.length-1-k].r+1))));if(!can)g.over='NO MOVES - '+done+'/8 BUILT';}};
 g.draw=()=>{A.cls('#0f5a2a');cols.forEach((col,i)=>{const x=6+i*31,step=Math.min(10,170/Math.max(1,col.length));col.forEach((c,j)=>card(x,20+j*step,c,i===cur&&!held&&j>=col.length-n));if(!col.length)card(x,20,null,i===cur);});if(held)held.cs.forEach((c,j)=>card(6+cur*31+3,12+j*8,c,true));
  for(let i=0;i<Math.ceil(d.length/10);i++)R(290+i*3,212,18,24,'#2a4ab0');T('DONE '+done+'/8',6,6,K.w,1);T('B DEALS',W-40,204,K.w,1,'c');};
 return g;}});

/* ---- PYRAMID ---- */
A.add({id:'pyramid',name:'PYRAMID',cat:'CARDS',how:'PAIR OPEN CARDS THAT SUM TO 13 (K ALONE). A SELECTS, B DRAWS.',make(){
 const g={over:null,score:0};let d=deck(),py=[],stock,waste=[],cur=0,sel=null,passes=0;for(let r=0;r<7;r++)for(let c=0;c<=r;c++){const q=d.pop();q.up=true;py.push({c:q,r,i:c,gone:false});}stock=d;
 const free=p=>!p.gone&&!py.some(q=>!q.gone&&q.r===p.r+1&&(q.i===p.i||q.i===p.i+1));const avail=()=>{const a=py.filter(free);if(waste.length)a.push({c:waste[waste.length-1],w:true});return a;};
 g.update=()=>{const av=avail();const anyPair=av.some(x=>x.c.r===12)||av.some((x,i)=>av.some((y,j)=>j>i&&x.c.r+y.c.r+2===13));if(!anyPair&&!stock.length&&passes>=2){g.over='STUCK - '+py.filter(p=>p.gone).length+'/28 CLEARED';return;}cur=Math.min(cur,av.length-1);const h=A.hit(0);if(h.l)cur=(cur+av.length-1)%av.length;if(h.r)cur=(cur+1)%av.length;if(h.l||h.r)S('blip');
  if(h.b){if(stock.length){const q=stock.pop();q.up=true;waste.push(q);S('blip');}else if(passes<2){stock=waste.reverse();waste=[];stock.forEach(q=>q.up=false);passes++;}else S('lose');sel=null;}
  if(h.a&&av[cur]){const it=av[cur];const rem=x=>{if(x.w)waste.pop();else x.gone=true;};if(it.c.r===12){rem(it);g.score+=13;S('coin');sel=null;}else if(!sel){sel=it;S('blip');}else if(sel===it||(sel.c===it.c)){sel=null;}else if(sel.c.r+it.c.r+2===13){rem(sel);rem(it);g.score+=13;S('coin');sel=null;}else{sel=null;S('lose');}if(py.every(p=>p.gone)){g.score+=500;g.over='PYRAMID CLEARED! WIN';A.confetti();}}};
 g.draw=()=>{A.cls('#0f5a2a');const av=avail();py.forEach(p=>{if(p.gone)return;const x=160-p.r*13+p.i*26-11,y=8+p.r*18;const i=av.findIndex(a=>a.c===p.c);card(x,y,free(p)?p.c:{...p.c},i===cur||(sel&&sel.c===p.c));});R(14,196,22,30,stock.length?'#2a4ab0':'rgba(0,0,0,.2)');card(44,196,waste[waste.length-1]||null,av[cur]&&av[cur].w||(sel&&sel.w));T('STOCK '+stock.length,14,188,K.w,1);T('SCORE '+g.score,W-6,6,K.y,1,'r');T('PASSES LEFT '+(2-passes),W-6,16,K.w,1,'r');};
 return g;}});

/* ---- GOLF SOLITAIRE ---- */
A.add({id:'golfsol',name:'GOLF SOLITAIRE',cat:'CARDS',how:'PLAY A CARD ONE ABOVE OR BELOW THE PILE. A PLAYS, B DRAWS. CLEAR ALL 35.',make(){
 const g={over:null,score:0};let d=deck(),cols=[...Array(7)].map(()=>[]),pile,cur=0;for(let i=0;i<35;i++){const q=d.pop();q.up=true;cols[i%7].push(q);}pile=[d.pop()];pile[0].up=true;
 const ok=c=>Math.abs(c.r-pile[pile.length-1].r)===1;
 g.update=()=>{const h=A.hit(0);if(h.l)cur=(cur+6)%7;if(h.r)cur=(cur+1)%7;if(h.l||h.r)S('blip');if(h.a){const col=cols[cur],c=col[col.length-1];if(c&&ok(c)){pile.push(col.pop());g.score+=10;S('coin');if(cols.every(q=>!q.length)){g.score+=d.length*20;g.over='CLEARED! WIN';A.confetti();}}else S('lose');}
  if(h.b){if(d.length){const q=d.pop();q.up=true;pile.push(q);S('blip');}}if(!d.length&&!cols.some(q=>q.length&&ok(q[q.length-1]))&&cols.some(q=>q.length))g.over=cols.reduce((a,q)=>a+q.length,0)+' CARDS LEFT';};
 g.draw=()=>{A.cls('#0f5a2a');cols.forEach((col,i)=>{col.forEach((c,j)=>card(22+i*40,10+j*18,c,i===cur&&j===col.length-1));if(!col.length)card(22+i*40,10,null,i===cur);});card(150,196,pile[pile.length-1]);R(110,196,22,30,d.length?'#2a4ab0':'rgba(0,0,0,.2)');T(d.length,121,188,K.w,1,'c');T('SCORE '+g.score,W-6,210,K.y,1,'r');};
 return g;}});

/* ---- LUDO RACE ---- */
A.add({id:'ludo',name:'LUDO RACE',cat:'BOARD',vs:1,how:'A ROLLS. A 6 FREES A TOKEN. PICK A TOKEN, A MOVES. GET ALL 4 HOME.',make(){
 const g={over:null,score:0},TRACK=40;let tok=[[-1,-1,-1,-1],[-1,-1,-1,-1]],p=0,dv=0,rolled=false,sel=0,think=0,roll=0,msg='';const START=[0,20],SAFE=[0,8,20,28];
 const abs=(pl,s)=>(START[pl]+s)%TRACK;const moves=pl=>tok[pl].map((s,i)=>({s,i})).filter(o=>(o.s===-1&&dv===6)||(o.s>=0&&o.s+dv<=TRACK+3));
 const doMove=i=>{const s=tok[p][i];tok[p][i]=s===-1?0:s+dv;const ns=tok[p][i];S('hit');if(ns<TRACK){const a=abs(p,ns);if(!SAFE.includes(a))tok[1-p].forEach((o,j)=>{if(o>=0&&o<TRACK&&abs(1-p,o)===a){tok[1-p][j]=-1;msg='SENT HOME!';S('boom');}});}if(tok[p].every(v=>v===TRACK+3)){g.over=A.win(p);return;}rolled=false;if(dv!==6){p=1-p;}think=0;};
 const xy=a=>{const t=a/TRACK*6.283-1.57;return[160+Math.cos(t)*96,124+Math.sin(t)*92];};
 g.update=()=>{if(roll>0){dv=1+ri(6);if(--roll===0){rolled=true;if(!moves(p).length){msg='NO MOVE';rolled=false;p=1-p;think=0;}}return;}const cpu=A.cpu&&p===1;
  if(!rolled){if(cpu?++think>30:A.hit(human(p)).a){roll=14;msg='';think=0;S('blip');}return;}const ms=moves(p);if(cpu){if(++think<30)return;let best=ms[0];for(const o of ms){const ns=o.s===-1?0:o.s+dv;if(ns<TRACK&&tok[0].some(v=>v>=0&&v<TRACK&&abs(0,v)===abs(1,ns)))best=o;else if(o.s===-1&&A.lvl>0)best=best.s===-1?best:o;}doMove(best.i);return;}
  const h=A.hit(human(p));const idx=ms.map(o=>o.i);if(!idx.includes(sel))sel=idx[0];if(h.l||h.r){const k=idx.indexOf(sel);sel=idx[(k+(h.r?1:idx.length-1))%idx.length];S('blip');}if(h.a)doMove(sel);};
 g.draw=()=>{A.cls('#f4ecd8');for(let a=0;a<TRACK;a++){const[x,y]=xy(a);C(x,y,7,SAFE.includes(a)?'#e8d8a8':'#ffffff');A.ring(x,y,7,'#b8a888');}[[0,K.c],[20,K.p]].forEach(([a,c])=>{const[x,y]=xy(a);A.ring(x,y,9,c);});
  [0,1].forEach(pl=>{const col=pl?K.p:K.c;tok[pl].forEach((s,i)=>{let x,y;if(s===-1){x=pl?250+(i%2)*14:56+(i%2)*14;y=pl?40+(i>>1)*14:190+(i>>1)*14;}else if(s>=TRACK){x=160+(pl?1:-1)*(10+(s-TRACK)*10);y=124;}else[x,y]=xy(abs(pl,s));C(x,y+(pl?-2:2),5,col);C(x-1,y+(pl?-3:1),2,'rgba(255,255,255,.7)');if(pl===p&&rolled&&i===sel&&!(A.cpu&&p===1))A.ring(x,y,8,K.y);});});
  die(149,113,dv||1);T(A.nm(p)+(rolled?' MOVES':' ROLLS'),160,142,p?K.p:K.c,1,'c');if(msg)T(msg,160,154,K.r,1,'c');T('HOME '+tok[0].filter(v=>v===TRACK+3).length+'/4',8,8,K.c,1);T('HOME '+tok[1].filter(v=>v===TRACK+3).length+'/4',W-8,8,K.p,1,'r');};
 return g;}});

/* ---- HEX MINES ---- */
A.add({id:'hexmines',name:'HEX MINES',cat:'PUZZLE',how:'MINESWEEPER ON HEXAGONS: SIX NEIGHBOURS. A OPENS, B FLAGS. CLEAR EVERY SAFE CELL.',make(){
 const g={over:null,score:0},NX=13,NY=10,MN=22;let mine=[],open=[],flag=[],c={x:6,y:5},first=true,t=0;for(let i=0;i<NX*NY;i++){mine.push(false);open.push(false);flag.push(false);}
 const nb=i=>{const x=i%NX,y=(i/NX)|0,od=y%2,ds=od?[[-1,0],[1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[-1,0],[1,0],[-1,-1],[0,-1],[-1,1],[0,1]];return ds.map(d=>[x+d[0],y+d[1]]).filter(q=>q[0]>=0&&q[1]>=0&&q[0]<NX&&q[1]<NY).map(q=>q[1]*NX+q[0]);};const cnt=i=>nb(i).filter(j=>mine[j]).length;
 const place=safe=>{let n=0;while(n<MN){const i=ri(NX*NY);if(mine[i]||i===safe||nb(safe).includes(i))continue;mine[i]=true;n++;}};
 const reveal=i=>{const st=[i];while(st.length){const j=st.pop();if(open[j]||flag[j])continue;open[j]=true;if(cnt(j)===0&&!mine[j])st.push(...nb(j));}};
 g.update=()=>{t++;const h=A.hit(0);if(h.l)c.x=(c.x+NX-1)%NX;if(h.r)c.x=(c.x+1)%NX;if(h.u)c.y=(c.y+NY-1)%NY;if(h.d)c.y=(c.y+1)%NY;const i=c.y*NX+c.x;if(h.b&&!open[i]){flag[i]=!flag[i];S('blip');}
  if(h.a&&!flag[i]){if(first){place(i);first=false;}if(mine[i]){open.forEach((_,j)=>{if(mine[j])open[j]=true;});g.over='BOOM';S('boom');A.shake=10;return;}reveal(i);S('hit');const safe=open.filter((o,j)=>o&&!mine[j]).length;g.score=safe;if(safe===NX*NY-MN){g.score+=Math.max(0,600-(t/60|0));g.over='FIELD CLEARED! WIN';A.confetti();}}};
 g.draw=()=>{A.cls('#1a1238');for(let i=0;i<NX*NY;i++){const x=i%NX,y=(i/NX)|0,px=30+x*20+(y%2)*10,py=24+y*18;const pts=[];for(let k=0;k<6;k++){const a=k/6*6.283+.5236;pts.push([px+Math.cos(a)*10.5,py+Math.sin(a)*10.5]);}A.poly(pts,open[i]?(mine[i]?K.r:'#c8c0e8'):'#4a3a8a',1);
  if(open[i]&&mine[i])E('💣',px,py,11);else if(open[i]&&cnt(i))T(cnt(i),px,py-3,[K.b,K.g,K.r,K.p,K.o,K.k][cnt(i)-1],1,'c');else if(flag[i])E('🚩',px,py,11);if(x===c.x&&y===c.y)A.ring(px,py,10,K.y);}T('MINES '+(MN-flag.filter(Boolean).length),6,6,K.w,1);T(Math.floor(t/60)+'S',W-6,6,K.w,1,'r');};
 return g;}});

/* ---- AIR TRAFFIC ---- */
A.add({id:'airtraffic',name:'AIR TRAFFIC',cat:'SIM',how:'PICK A PLANE WITH LEFT/RIGHT, UP/DOWN TURNS IT. LAND ON ITS COLOUR RUNWAY.',make(){
 const g={over:null,score:0},RW=[{x:120,y:110,a:0,c:K.c},{x:200,y:150,a:1.57,c:K.p}];let pl=[],sel=0,t=0,lives=3;
 g.update=()=>{t++;if(t===1||t%Math.max(150,360-g.score*8)===0){const side=ri(4),r=ri(2);const[x,y]=side===0?[rnd(W),-10]:side===1?[W+10,rnd(H)]:side===2?[rnd(W),H+10]:[-10,rnd(H)];pl.push({x,y,a:Math.atan2(120-y,160-x),r,land:0});}
  const h=A.hit(0);if(pl.length){if(h.l)sel=(sel+pl.length-1)%pl.length;if(h.r)sel=(sel+1)%pl.length;sel=Math.min(sel,pl.length-1);const k=A.in(0),q=pl[sel];if(q&&!q.land)q.a+=ay(k)*.04;}
  for(const q of pl){if(q.land){q.land++;q.x+=Math.cos(q.a)*.5;q.y+=Math.sin(q.a)*.5;continue;}q.x+=Math.cos(q.a)*.55;q.y+=Math.sin(q.a)*.55;const rw=RW[q.r];const dx=q.x-rw.x,dy=q.y-rw.y;let da=Math.abs(((q.a-rw.a)%6.283+6.283)%6.283);da=Math.min(da,6.283-da);if(Math.hypot(dx,dy)<10&&da<.5){q.land=1;g.score++;S('score');}}
  for(let i=0;i<pl.length;i++)for(let j=i+1;j<pl.length;j++){const a=pl[i],b=pl[j];if(a.land||b.land)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<9){g.over='MID-AIR COLLISION';S('boom');A.shake=10;return;}}
  pl=pl.filter(q=>{if(q.land>80)return false;if(!q.land&&(q.x<-40||q.x>W+40||q.y<-40||q.y>H+40)){lives--;S('lose');if(lives<=0)g.over='TOO MANY LOST';return false;}return true;});};
 g.draw=()=>{A.cls('#2a4a2a');for(let i=0;i<30;i++)C((i*97)%W,(i*53)%H,8+(i%4)*3,'rgba(40,90,40,.5)');RW.forEach(r=>{A.c.save&&A.c.save();A.c.translate&&A.c.translate(r.x,r.y);A.c.rotate&&A.c.rotate(r.a);R(-30,-5,60,10,'#44444e');for(let k=-25;k<25;k+=10)R(k,-1,5,2,K.w);R(-34,-6,4,12,r.c);A.c.restore&&A.c.restore();});
  pl.forEach((q,i)=>{const s=q.land?Math.max(.3,1-q.land/80):1,c=RW[q.r].c;const cs=Math.cos(q.a),sn=Math.sin(q.a);A.poly([[q.x+cs*8*s,q.y+sn*8*s],[q.x-cs*6*s-sn*6*s,q.y-sn*6*s+cs*6*s],[q.x-cs*3*s,q.y-sn*3*s],[q.x-cs*6*s+sn*6*s,q.y-sn*6*s-cs*6*s]],c,1);if(i===sel&&!q.land){A.ring(q.x,q.y,11,K.y);L(q.x,q.y,q.x+cs*30,q.y+sn*30,'rgba(255,255,255,.35)');}});T('LANDED '+g.score,6,6,K.w,1);T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

/* ---- GOLF TOUR (9 holes, top-down) ---- */
A.add({id:'golftour',name:'GOLF TOUR',cat:'SPORTS',how:'AIM LEFT/RIGHT, HOLD A FOR POWER. AVOID WATER AND SAND. 9 HOLES.',low:1,make(){
 const g={over:null,score:0};let hole=0,ball,cup,ang=0,pw=0,strokes=0,total=0,haz=[],mv=false,par=3,msg='',mt=0,last;
 const gen=()=>{hole++;ball={x:30+rnd(40),y:60+rnd(120),vx:0,vy:0};cup={x:240+rnd(50),y:40+rnd(160)};haz=[];for(let i=0;i<2+hole/2;i++){const x=90+rnd(140),y=30+rnd(180);haz.push({x,y,r:14+rnd(14),k:Math.random()<.5?'w':'s'});}ang=Math.atan2(cup.y-ball.y,cup.x-ball.x);strokes=0;par=3+(hole%3===0?1:0);last={...ball};};gen();
 g.update=()=>{if(mt)mt--;const k=A.in(0);if(!mv){ang+=ax(k)*.035;if(k.a)pw=Math.min(1,pw+.018);else if(pw>.03){ball.vx=Math.cos(ang)*pw*7;ball.vy=Math.sin(ang)*pw*7;pw=0;mv=true;strokes++;last={x:ball.x,y:ball.y};S('hit');}return;}
  ball.x+=ball.vx;ball.y+=ball.vy;const hz=haz.find(z=>Math.hypot(ball.x-z.x,ball.y-z.y)<z.r);const fr=hz&&hz.k==='s'?.9:.975;ball.vx*=fr;ball.vy*=fr;if(ball.x<6||ball.x>W-6){ball.vx*=-.6;ball.x=cl(ball.x,6,W-6);}if(ball.y<24||ball.y>H-6){ball.vy*=-.6;ball.y=cl(ball.y,24,H-6);}
  const sp=Math.hypot(ball.vx,ball.vy);if(Math.hypot(ball.x-cup.x,ball.y-cup.y)<5&&sp<3.5){total+=strokes;g.score=total;msg=strokes===1?'HOLE IN ONE!':strokes<par?'BIRDIE':strokes===par?'PAR':'BOGEY';mt=90;S('win');mv=false;if(hole>=9){g.over=total+' STROKES';return;}gen();return;}
  if(sp<.08){mv=false;if(hz&&hz.k==='w'){ball={...last,vx:0,vy:0};strokes++;msg='WATER +1';mt=60;S('lose');}ang=Math.atan2(cup.y-ball.y,cup.x-ball.x);}};
 g.draw=()=>{A.cls('#3a8a3a');for(let i=0;i<40;i++)R((i*83)%W,(i*47)%H,3,1,'#4a9a4a');haz.forEach(z=>C(z.x,z.y,z.r,z.k==='w'?'#2a6ab8':'#e0cc8a'));C(cup.x,cup.y,12,'#5ab85a');C(cup.x,cup.y,4,'#111111');R(cup.x,cup.y-20,1,20,K.w);R(cup.x+1,cup.y-20,8,5,K.r);
  C(ball.x,ball.y,3,K.w);if(!mv){for(let i=1;i<8;i++)C(ball.x+Math.cos(ang)*i*7,ball.y+Math.sin(ang)*i*7,1,'rgba(255,255,255,.7)');if(pw){R(6,60,6,80,K.d);R(6,140-pw*80,6,pw*80,pw>.8?K.r:K.y);}}R(0,0,W,18,'rgba(0,0,0,.4)');T('HOLE '+hole+'/9  PAR '+par,6,5,K.w,1);T('STROKES '+strokes+'  TOTAL '+total,W-6,5,K.y,1,'r');if(mt)T(msg,160,30,K.y,2,'c');};
 return g;}});
})();
