(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const SU=['H','D','C','S'],RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const deck=()=>{const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r});for(let i=d.length-1;i>0;i--){const j=ri(i+1);[d[i],d[j]]=[d[j],d[i]];}return d;};
const suit=(x,y,s,col)=>{if(s===0){C(x-2,y-1,2.5,col);C(x+2,y-1,2.5,col);A.poly([[x-4,y],[x+4,y],[x,y+4]],col,1);}else if(s===1)A.poly([[x,y-4],[x+4,y],[x,y+4],[x-4,y]],col,1);else if(s===2){C(x,y-2,2.5,col);C(x-2.5,y+1,2.5,col);C(x+2.5,y+1,2.5,col);R(x-1,y+1,2,4,col);}else{A.poly([[x,y-4],[x+4,y+1],[x-4,y+1]],col,1);C(x-2.5,y+1,2.5,col);C(x+2.5,y+1,2.5,col);R(x-1,y+1,2,4,col);}};
const card=(x,y,c,up,hi)=>{R(x,y,22,30,hi?K.y:K.k);if(!up){R(x+1,y+1,20,28,'#2b3bd6');A.box(x+3,y+3,16,24,'#4d6bff');return;}R(x+1,y+1,20,28,'#fff3d6');const col=c.s<2?'#d02040':'#111';T(RK[c.r],x+3,y+3,col);suit(x+15,y+22,c.s,col);};
const val=c=>c.r===0?11:c.r>=9?10:c.r+1;
const total=h=>{let t=0,a=0;for(const c of h){t+=val(c);if(c.r===0)a++;}while(t>21&&a>0){t-=10;a--;}return t;};

/* ---- BLACKJACK ---- */
A.add({id:'blackjack',name:'BLACKJACK',cat:'CARDS',how:'A HITS. B STANDS. BEAT THE DEALER. START WITH 100 CHIPS.',make(){
 const g={over:null,score:100};let d,pl,dl,ph='bet',bet=10,msg='',mt=0,hands=0;
 const deal=()=>{if(d.length<15)d=deck();pl=[d.pop(),d.pop()];dl=[d.pop(),d.pop()];ph='play';if(total(pl)===21){finish();}};d=deck();
 const finish=()=>{while(total(dl)<17)dl.push(d.pop());const p=total(pl),q=total(dl);let w=0;if(p>21)w=-1;else if(q>21||p>q)w=1;else if(p<q)w=-1;const bj=p===21&&pl.length===2;g.score+=w*bet*(bj&&w>0?1.5:1);msg=w>0?(bj?'BLACKJACK! +'+bet*1.5:'YOU WIN +'+bet):w<0?(p>21?'BUST -'+bet:'DEALER WINS -'+bet):'PUSH';S(w>0?'score':w<0?'lose':'blip');ph='res';mt=90;hands++;};
 g.update=()=>{if(mt>0){mt--;if(mt===0){if(g.score<=0){g.over='BROKE AFTER '+hands+' HANDS';return;}if(hands>=15){g.over=g.score+' CHIPS';return;}ph='bet';bet=Math.min(bet,g.score);}return;}const h=A.hit(0);
  if(ph==='bet'){if(h.l)bet=Math.max(5,bet-5);if(h.r)bet=Math.min(g.score,bet+5);if(h.a){S('coin');deal();}}
  else if(ph==='play'){if(h.a){pl.push(d.pop());S('blip');if(total(pl)>21)finish();}if(h.b)finish();}};
 g.draw=()=>{A.cls('#0f5a2a');A.ring(160,120,90,'#1e8a45');A.ring(160,120,86,'#1e8a45');T('DEALER',160,22,K.w,1,'c');T('YOU',160,140,K.w,1,'c');
  if(ph!=='bet'){dl.forEach((c,i)=>card(120+i*26,32,c,ph!=='play'||i===0));pl.forEach((c,i)=>card(120+i*26,150,c,true));T(ph==='play'?'?':total(dl),240,40,K.w,2);T(total(pl),240,158,K.w,2);}
  T('CHIPS '+g.score,6,6,K.y,2);T('BET '+bet,W-6,6,K.w,2,'r');T('HAND '+Math.min(hands+1,15)+'/15',W-6,20,K.gr,1,'r');
  if(ph==='bet')T('LEFT/RIGHT BET   A DEAL',160,210,K.y,1,'c');if(ph==='play')T('A HIT   B STAND',160,210,K.y,1,'c');if(mt>0)T(msg,160,100,K.y,2,'c');};
 return g;}});

/* ---- VIDEO POKER ---- */
A.add({id:'poker',name:'VIDEO POKER',cat:'CARDS',how:'A HOLDS A CARD. B DRAWS. JACKS OR BETTER PAYS. 10 HANDS.',make(){
 const g={over:null,score:50};let d,hand,hold=[0,0,0,0,0],c=0,ph='hold',msg='',mt=0,n=0;const deal=()=>{d=deck();hand=[d.pop(),d.pop(),d.pop(),d.pop(),d.pop()];hold=[0,0,0,0,0];ph='hold';g.score-=5;};deal();
 const rank=h=>{const rs=h.map(c=>c.r).sort((a,b)=>a-b),ss=h.map(c=>c.s),cnt={};rs.forEach(r=>cnt[r]=(cnt[r]||0)+1);const v=Object.values(cnt).sort((a,b)=>b-a),fl=ss.every(s=>s===ss[0]),st=rs.every((r,i)=>i===0||r===rs[i-1]+1)||(rs.join()==='0,9,10,11,12');
  if(fl&&st)return[rs[0]===0&&rs[1]===9?'ROYAL FLUSH':'STRAIGHT FLUSH',rs[0]===0&&rs[1]===9?250:50];if(v[0]===4)return['FOUR OF A KIND',25];if(v[0]===3&&v[1]===2)return['FULL HOUSE',9];if(fl)return['FLUSH',6];if(st)return['STRAIGHT',4];if(v[0]===3)return['THREE OF A KIND',3];if(v[0]===2&&v[1]===2)return['TWO PAIR',2];if(v[0]===2){const pr=+Object.keys(cnt).find(k=>cnt[k]===2);if(pr===0||pr>=10)return['JACKS OR BETTER',1];}return['NO PAY',0];};
 g.update=()=>{if(mt>0){mt--;if(mt===0){n++;if(n>=10||g.score<5)g.over=g.score+' CHIPS';else deal();}return;}const h=A.hit(0);if(h.l)c=(c+4)%5;if(h.r)c=(c+1)%5;if(h.a){hold[c]^=1;S('blip');}
  if(h.b){hand=hand.map((cd,i)=>hold[i]?cd:d.pop());const[nm,pay]=rank(hand);g.score+=pay*5;msg=nm+(pay?'  +'+pay*5:'');S(pay?'score':'lose');ph='res';mt=90;}};
 g.draw=()=>{A.cls('#1a1238');R(20,30,280,80,'#0d0926');[['ROYAL FLUSH',250],['STRAIGHT FLUSH',50],['4 OF A KIND',25],['FULL HOUSE',9],['FLUSH',6],['STRAIGHT',4],['3 OF A KIND',3],['TWO PAIR',2],['JACKS+',1]].forEach((p,i)=>{const col=i<5?24:170,row=i<5?i:i-5;T(p[0],col,34+row*14,K.gr);T(p[1]*5,col+120,34+row*14,K.y,1,'r');});
  hand.forEach((cd,i)=>{const x=80+i*34,y=130;card(x,y,cd,true,i===c&&ph==='hold');if(hold[i])T('HOLD',x+11,y+34,K.y,1,'c');});T('CHIPS '+g.score,6,6,K.y,2);T('HAND '+(n+1)+'/10',W-6,6,K.w,2,'r');
  if(ph==='hold')T('A HOLD   B DRAW',160,200,K.w,1,'c');if(mt>0)T(msg,160,190,K.y,2,'c');};
 return g;}});

/* ---- KLONDIKE ---- */
A.add({id:'klondike',name:'KLONDIKE',cat:'CARDS',how:'A PICKS UP / DROPS. UP SENDS TO FOUNDATION. A ON THE DECK DEALS.',make(){
 const g={over:null,score:0};let d=deck(),cols=[],found=[[],[],[],[]],waste=[],sel=null,cx=0,moves=0;for(let i=0;i<7;i++){cols.push([]);for(let j=0;j<=i;j++){const c=d.pop();c.up=j===i;cols[i].push(c);}}
 const red=c=>c.s<2;const canF=(c,f)=>f.length?f[f.length-1].s===c.s&&f[f.length-1].r===c.r-1:c.r===0;
 const canC=(c,col)=>col.length?col[col.length-1].up&&red(col[col.length-1])!==red(c)&&col[col.length-1].r===c.r+1:c.r===12;
 const top=()=>{if(cx===0)return waste.length?[waste,waste.length-1]:null;if(cx>=1&&cx<=7){const col=cols[cx-1];if(!col.length)return null;let i=col.length-1;return[col,i];}return null;};
 g.update=()=>{const h=A.hit(0);if(h.l)cx=(cx+7)%8;if(h.r)cx=(cx+1)%8;if(h.d&&sel&&sel[0]!==waste){if(sel[1]>0&&sel[0][sel[1]-1].up)sel=[sel[0],sel[1]-1];}
  if(h.u){const t=top();if(t){const c=t[0][t[1]];const f=found.find(f=>canF(c,f));if(f){f.push(t[0].pop());g.score+=10;moves++;S('coin');if(t[0].length&&!t[0][t[0].length-1].up)t[0][t[0].length-1].up=true;sel=null;if(found.every(f=>f.length===13))g.over='SOLVED! WIN';}else S('lose');}}
  if(h.a){if(cx===8||(cx===0&&!waste.length&&false)){}
   if(cx===0&&!sel&&!waste.length&&!d.length){}if(cx===0&&!sel){if(d.length){waste.push(Object.assign(d.pop(),{up:true}));S('blip');moves++;}else if(waste.length){while(waste.length)d.push(waste.pop());S('blip');}return;}
   if(!sel){const t=top();if(t&&t[0][t[1]].up){sel=t;S('blip');}}else{if(cx>=1&&cx<=7){const col=cols[cx-1],run=sel[0].slice(sel[1]);if(sel[0]===col){sel=null;return;}if(canC(run[0],col)){col.push(...sel[0].splice(sel[1]));if(sel[0].length&&!sel[0][sel[0].length-1].up){sel[0][sel[0].length-1].up=true;g.score+=5;}moves++;S('hit');sel=null;}else{S('lose');sel=null;}}else sel=null;}}};
 g.draw=()=>{A.cls('#0f5a2a');card(8,8,{},false);if(!d.length)A.box(8,8,22,30,K.w);if(waste.length)card(34,8,waste[waste.length-1],true,cx===0&&sel&&sel[0]===waste);else if(cx===0)A.box(34,8,22,30,K.y);if(cx===0&&!sel)A.box(8,8,22,30,K.y);
  found.forEach((f,i)=>{if(f.length)card(180+i*30,8,f[f.length-1],true);else A.box(180+i*30,8,22,30,'#1e8a45');});
  cols.forEach((col,i)=>{const x=20+i*40;if(!col.length)A.box(x,50,22,30,cx===i+1?K.y:'#1e8a45');col.forEach((c,j)=>card(x,50+j*12,c,c.up,sel&&sel[0]===col&&j>=sel[1]));if(cx===i+1&&col.length&&!sel)A.box(x-1,49+(col.length-1)*12,24,32,K.y);});
  T('MOVES '+moves+'   SCORE '+g.score,6,226,K.w,1);T('DOWN = TAKE MORE OF A RUN',W-6,226,K.gr,1,'r');};
 return g;}});

/* ---- CRAZY EIGHTS ---- */
A.add({id:'eights',name:'CRAZY EIGHTS',cat:'CARDS',vs:1,how:'MATCH SUIT OR RANK. 8 IS WILD. A PLAYS, B DRAWS. EMPTY YOUR HAND.',make(){
 const g={over:null,score:0};let d=deck(),hands=[[],[]],pile=[],p=0,c=0,think=0,wild=-1,pickS=0;for(let i=0;i<7;i++){hands[0].push(d.pop());hands[1].push(d.pop());}pile.push(d.pop());
 const topS=()=>wild>=0?wild:pile[pile.length-1].s,topR=()=>pile[pile.length-1].r;const ok=cd=>cd.r===7||cd.s===topS()||cd.r===topR();
 const play=(i,hand)=>{const cd=hand.splice(i,1)[0];pile.push(cd);wild=-1;S('hit');if(!hand.length){g.over=A.win(p);return;}if(cd.r===7){if(p===1&&A.cpu){const cnt=[0,0,0,0];hands[1].forEach(x=>cnt[x.s]++);wild=cnt.indexOf(Math.max(...cnt));}else{wild=cd.s;pickS=1;return;}}p=1-p;think=0;c=0;};
 const draw=hand=>{if(!d.length){const t=pile.pop();while(pile.length)d.push(pile.pop());pile.push(t);for(let i=d.length-1;i>0;i--){const j=ri(i+1);[d[i],d[j]]=[d[j],d[i]];}}if(d.length)hand.push(d.pop());S('blip');};
 g.update=()=>{if(pickS){const h=A.hit(A.two?p:0);if(h.l)wild=(wild+3)%4;if(h.r)wild=(wild+1)%4;if(h.a){pickS=0;p=1-p;think=0;c=0;}return;}
  if(A.cpu&&p===1){if(++think>40){const hand=hands[1];let idx=-1;const opts=hand.map((cd,i)=>i).filter(i=>ok(hand[i]));if(opts.length){opts.sort((a,b)=>(hand[a].r===7?1:0)-(hand[b].r===7?1:0));idx=A.lvl?opts[0]:opts[ri(opts.length)];}if(idx>=0)play(idx,hand);else{draw(hand);const j=hand.length-1;if(ok(hand[j]))play(j,hand);else{p=0;think=0;}}}return;}
  const hand=hands[p],h=A.hit(A.two?p:0);if(!hand.length)return;c=cl(c,0,hand.length-1);if(h.l)c=(c+hand.length-1)%hand.length;if(h.r)c=(c+1)%hand.length;if(h.a){if(ok(hand[c]))play(c,hand);else S('lose');}if(h.b){draw(hand);c=hand.length-1;if(!ok(hand[c])){p=1-p;think=0;c=0;}}};
 g.draw=()=>{A.cls('#0f5a2a');card(150,95,pile[pile.length-1],true);card(120,95,{},false);T(d.length,131,128,K.w,1,'c');if(wild>=0){T('SUIT',185,98,K.w);suit(190,116,wild,K.y);}
  const show=(hand,y,face,hi)=>{const w=Math.min(26,220/Math.max(1,hand.length));hand.forEach((cd,i)=>card(160-hand.length*w/2+i*w,y,cd,face,hi===i));};
  show(hands[1],20,A.two&&p===1||g.over,p===1&&!A.cpu&&!pickS?c:-1);show(hands[0],180,true,p===0&&!pickS?c:-1);
  T(A.nm(1)+' '+hands[1].length,W-6,6,K.p,1,'r');T(A.nm(0)+' '+hands[0].length,6,6,K.c,1);T(pickS?'PICK A SUIT: LEFT/RIGHT, A':A.nm(p)+(A.cpu&&p===1?' THINKS':' TO PLAY   A PLAY   B DRAW'),160,150,K.y,1,'c');};
 return g;}});

/* ---- HI-LO ---- */
A.add({id:'hilo',name:'HI-LO',cat:'CARDS',how:'UP = NEXT IS HIGHER. DOWN = LOWER. BUILD A STREAK.',make(){
 const g={over:null,score:0};let d=deck(),cur=d.pop(),nxt=null,mt=0,msg='',streak=0,lives=3;
 g.update=()=>{if(mt>0){mt--;if(mt===0){cur=nxt;nxt=null;if(d.length<2)d=deck();}return;}const h=A.hit(0);if(h.u||h.d){nxt=d.pop();const hi=nxt.r>cur.r,lo=nxt.r<cur.r;if((h.u&&hi)||(h.d&&lo)){streak++;g.score+=streak*10;msg='+'+streak*10;S('coin');}else if(nxt.r===cur.r){msg='TIE';S('blip');}else{streak=0;lives--;msg='WRONG';S('lose');if(lives<=0){g.over='OUT OF LIVES';return;}}mt=45;}};
 g.draw=()=>{A.cls('#1a1238');const big=(x,y,c)=>{R(x,y,66,90,K.k);R(x+2,y+2,62,86,'#fff3d6');const col=c.s<2?'#d02040':'#111';T(RK[c.r],x+8,y+8,col,3);const s=c.s;A.c.save();A.c.translate(x+33,y+55);A.c.scale(3,3);suit(0,0,s,col);A.c.restore();};
  big(60,60,cur);if(nxt)big(194,60,nxt);else{R(194,60,66,90,K.k);R(196,62,62,86,'#2b3bd6');T('?',227,96,K.w,4,'c');}T('>',160,96,K.w,3,'c');
  T('SCORE '+g.score,6,6,K.y,2);T('STREAK '+streak,160,6,K.c,2,'c');T('LIVES '+lives,W-6,6,K.r,2,'r');T(mt?msg:'UP HIGHER   DOWN LOWER',160,180,K.w,2,'c');};
 return g;}});

/* ---- CARD CLASH ---- */
A.add({id:'clash',name:'CARD CLASH',cat:'CARDS',vs:1,how:'PICK A CARD EACH ROUND. HIGHER WINS, SUIT BEATS: H>D>C>S>H ON TIES. 7 ROUNDS.',make(){
 const g={over:null,score:0};let d=deck(),hands=[[],[]],c=0,pick=[-1,-1],sc=[0,0],round=0,mt=0,msg='';for(let i=0;i<7;i++){hands[0].push(d.pop());hands[1].push(d.pop());}
 const beats=(a,b)=>a.r!==b.r?a.r>b.r:(a.s+1)%4===b.s;
 const resolve=()=>{const a=hands[0].splice(pick[0],1)[0],b=hands[1].splice(pick[1],1)[0];const w=beats(a,b)?0:beats(b,a)?1:-1;if(w>=0)sc[w]++;msg=w<0?'DRAW':A.nm(w)+' TAKES IT';mt=60;round++;S(w===0?'score':w===1?'lose':'blip');last=[a,b];};let last=null;
 g.update=()=>{if(mt>0){mt--;if(mt===0){pick=[-1,-1];c=0;if(round>=7)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}return;}
  for(let i=0;i<2;i++){if(pick[i]>=0)continue;if(i===1&&A.cpu){const hand=hands[1];if(A.lvl===0)pick[1]=ri(hand.length);else{const s=hand.map(x=>x.r);pick[1]=A.lvl===2&&round%2?s.indexOf(Math.min(...s)):s.indexOf(Math.max(...s));}continue;}
   const h=A.hit(A.two?i:0),hand=hands[i];if(h.l)c=(c+hand.length-1)%hand.length;if(h.r)c=(c+1)%hand.length;if(h.a){pick[i]=c;c=0;S('blip');}}
  if(pick[0]>=0&&pick[1]>=0)resolve();};
 g.draw=()=>{A.cls('#1a1238');const show=(hand,y,face,hi)=>hand.forEach((cd,i)=>card(160-hand.length*14+i*28,y,cd,face,hi===i));show(hands[1],20,A.two||g.over,pick[1]<0&&!A.cpu&&pick[0]>=0?c:-1);show(hands[0],180,true,pick[0]<0?c:-1);
  if(mt>0&&last){card(120,100,last[0],true);card(178,100,last[1],true);T(msg,160,140,K.y,2,'c');}else T(pick[0]<0?A.nm(0)+' PICKS':A.nm(1)+' PICKS',160,110,K.w,2,'c');
  A.hud2(sc[0],sc[1]);T('ROUND '+Math.min(round+1,7)+'/7',160,6,K.w,1,'c');};
 return g;}});
})();
