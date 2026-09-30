(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const human=p=>A.two?p:0;const mv=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

/* ---- CHESS ---- */
const GL={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'},VAL={p:1,n:3,b:3.2,r:5,q:9,k:0};
A.add({id:'chess',name:'CHESS',cat:'BOARD',vs:1,how:'A PICKS A PIECE, A AGAIN MOVES IT (GREEN DOTS SHOW LEGAL MOVES). WHITE MOVES FIRST.',make(){
 const g={over:null,score:0};let b='rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR'.split(''),turn=0,c={x:4,y:6},sel=-1,legal=[],think=0,last=null,msg='';
 const white=p=>p!=='.'&&p===p.toUpperCase(),own=(p,s)=>p!=='.'&&(s===0?white(p):!white(p));
 const gen=(bd,s,caps)=>{const out=[];for(let i=0;i<64;i++){const p=bd[i];if(!own(p,s))continue;const x=i%8,y=i>>3,t=p.toLowerCase();const add=(nx,ny)=>{if(nx<0||ny<0||nx>7||ny>7)return false;const j=ny*8+nx;if(own(bd[j],s))return false;out.push([i,j]);return bd[j]==='.';};
  if(t==='p'){const d=s===0?-1:1,ny=y+d;if(ny>=0&&ny<8&&bd[ny*8+x]==='.'){out.push([i,ny*8+x]);const sy=s===0?6:1;if(y===sy&&bd[(y+2*d)*8+x]==='.')out.push([i,(y+2*d)*8+x]);}for(const dx of[-1,1]){const nx=x+dx;if(nx>=0&&nx<8&&ny>=0&&ny<8&&bd[ny*8+nx]!=='.'&&!own(bd[ny*8+nx],s))out.push([i,ny*8+nx]);}}
  else if(t==='n')[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(d=>add(x+d[0],y+d[1]));else if(t==='k')[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(d=>add(x+d[0],y+d[1]));
  else{const dirs=t==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:t==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];for(const d of dirs){let k=1;while(add(x+d[0]*k,y+d[1]*k))k++;}}}return out;};
 const apply=(bd,m)=>{const n=bd.slice();let p=n[m[0]];if(p==='P'&&m[1]<8)p='Q';if(p==='p'&&m[1]>=56)p='q';n[m[1]]=p;n[m[0]]='.';return n;};
 const inCheck=(bd,s)=>{const k=bd.indexOf(s===0?'K':'k');return gen(bd,1-s).some(m=>m[1]===k);};
 const legalMoves=(bd,s)=>gen(bd,s).filter(m=>!inCheck(apply(bd,m),s));
 const evalB=bd=>{let v=0;for(let i=0;i<64;i++){const p=bd[i];if(p==='.')continue;const t=p.toLowerCase(),x=i%8,y=i>>3,center=(3.5-Math.abs(3.5-x)+3.5-Math.abs(3.5-y))*.04*(t==='n'||t==='p'?1:.4),adv=t==='p'?(white(p)?6-y:y-1)*.05:0;v+=(white(p)?-1:1)*(VAL[t]+center+adv);}return v;};
 const search=(bd,s,d,a,bt)=>{const ms=legalMoves(bd,s);if(!ms.length)return inCheck(bd,s)?(s===1?-999:999):0;if(d===0)return evalB(bd);if(s===1){let v=-1e9;for(const m of ms){v=Math.max(v,search(apply(bd,m),0,d-1,a,bt));a=Math.max(a,v);if(a>=bt)break;}return v;}let v=1e9;for(const m of ms){v=Math.min(v,search(apply(bd,m),1,d-1,a,bt));bt=Math.min(bt,v);if(a>=bt)break;}return v;};
 const doMove=m=>{const cap=b[m[1]]!=='.';b=apply(b,m);last=m;turn=1-turn;S(cap?'hit':'blip');const ms=legalMoves(b,turn);if(!ms.length){g.over=inCheck(b,turn)?A.win(1-turn):'STALEMATE - DRAW!';S('win');}else msg=inCheck(b,turn)?'CHECK!':'';};
 g.update=()=>{if(g.over)return;if(A.cpu&&turn===1){if(++think<20)return;think=0;const ms=shuf(legalMoves(b,1));const depth=A.lvl===0?1:2;let best=-1e9,bm=ms[0];for(const m of ms){let v=search(apply(b,m),0,depth-1,-1e9,1e9)+rnd(A.lvl===0?1.5:.08);if(v>best){best=v;bm=m;}}doMove(bm);return;}
  const h=A.hit(human(turn));mv(h,c,8,8);if(h.a){const i=c.y*8+c.x;if(sel>=0&&legal.some(m=>m[1]===i)){doMove([sel,i]);sel=-1;legal=[];return;}if(own(b[i],turn)){sel=i;legal=legalMoves(b,turn).filter(m=>m[0]===i);S('blip');}else{sel=-1;legal=[];}}if(h.b){sel=-1;legal=[];}};
 g.draw=()=>{A.cls('#2a1a10');const CS=27,OX=52,OY=12;for(let i=0;i<64;i++){const x=i%8,y=i>>3,px=OX+x*CS,py=OY+y*CS;R(px,py,CS,CS,(x+y)%2?'#b58863':'#f0d9b5');if(last&&(i===last[0]||i===last[1]))R(px,py,CS,CS,'rgba(255,220,60,.35)');if(i===sel)R(px,py,CS,CS,'rgba(47,232,208,.5)');const p=b[i];if(p!=='.'){const cc=A.c;if(cc.fillText){cc.save();cc.font='24px "Segoe UI Symbol","DejaVu Sans",serif';cc.textAlign='center';cc.textBaseline='middle';cc.fillStyle=white(p)?'#ffffff':'#111111';cc.strokeStyle=white(p)?'#222':'#ddd';cc.lineWidth=1;const gch=GL[p.toLowerCase()];cc.strokeText(gch,px+CS/2,py+CS/2+1);cc.fillText(gch,px+CS/2,py+CS/2+1);cc.restore();}}}
  legal.forEach(m=>{const x=m[1]%8,y=m[1]>>3;C(OX+x*CS+CS/2,OY+y*CS+CS/2,4,'rgba(60,200,80,.8)');});if(!(A.cpu&&turn===1))A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,turn?K.p:K.c);T(turn?'BLACK':'WHITE',290,20,turn?K.p:K.w,1,'c');T('TO MOVE',290,30,K.gr,1,'c');if(msg)T(msg,290,60,K.r,1,'c');if(A.cpu)T('YOU: WHITE',290,210,K.gr,1,'c');};
 return g;}});

/* ---- SNAKES & LADDERS ---- */
A.add({id:'snakes',name:'SNAKES & LADDERS',cat:'BOARD',vs:1,how:'A ROLLS THE DIE. LADDERS CLIMB, SNAKES SLIDE. FIRST TO 100 WINS.',make(){
 const g={over:null,score:0},JUMP={3:22,8:30,28:84,21:42,50:67,71:92,80:99,97:78,95:56,88:24,62:18,48:26,36:6,32:10};let pos=[1,1],p=0,roll=0,dv=1,anim=0,target=0,think=0,msg='';
 const xy=n=>{const r=Math.floor((n-1)/10),c=(n-1)%10,x=r%2?9-c:c;return[40+x*24+12,228-r*22-11];};
 g.update=()=>{if(roll>0){dv=1+ri(6);if(--roll===0){target=Math.min(100,pos[p]+dv);if(pos[p]+dv>100){msg='NEED EXACT ROLL';p=1-p;}else anim=1;}return;}
  if(anim){if(A.t%6===0){if(pos[p]<target){pos[p]++;S('blip');}else{const j=JUMP[pos[p]];if(j){msg=j>pos[p]?'LADDER!':'SNAKE!';S(j>pos[p]?'score':'lose');pos[p]=j;}anim=0;if(pos[p]===100){g.over=A.win(p);return;}if(dv!==6)p=1-p;else msg='ROLL AGAIN';}}return;}
  const go=A.cpu&&p===1?++think>40:A.hit(human(p)).a;if(go){think=0;roll=16;msg='';S('blip');}};
 g.draw=()=>{A.cls('#1a1238');for(let n=1;n<=100;n++){const[x,y]=xy(n);R(x-12,y-11,24,22,(Math.floor((n-1)/10)+(n-1)%10)%2?'#f2e2b8':'#e8c890');T(n,x-10,y-9,'#8a6a4a',1);}
  Object.entries(JUMP).forEach(([a,b])=>{a=+a;const[x1,y1]=xy(a),[x2,y2]=xy(b);if(b>a){L(x1-4,y1,x2-4,y2,'#8a5c33',2);L(x1+4,y1,x2+4,y2,'#8a5c33',2);for(let k=1;k<6;k++){const t=k/6;L(x1-4+(x2-x1)*t,y1+(y2-y1)*t,x1+4+(x2-x1)*t,y1+(y2-y1)*t,'#8a5c33',1);}}else{for(let k=0;k<12;k++){const t=k/11,wx=Math.sin(t*12)*5;C(x1+(x2-x1)*t+wx,y1+(y2-y1)*t,3.5-t*1.5,k%2?'#3a9a3a':'#2a7a2a');}C(x1,y1,4,'#3a9a3a');}});
  pos.forEach((n,i)=>{const[x,y]=xy(n);C(x+(i?5:-5),y+3,6,i?K.p:K.c);});R(282,90,30,30,K.w);T(dv,297,99,K.k,2,'c');T(A.nm(p),297,130,p?K.p:K.c,1,'c');if(msg)T(msg,297,150,K.y,1,'c');};
 return g;}});

/* ---- HANGMAN ---- */
const HW='ASTRONAUT BICYCLE CAMERA DOLPHIN ELEPHANT FOOTBALL GALAXY HAMBURGER ISLAND JUNGLE KEYBOARD LIBRARY MOUNTAIN NOTEBOOK OCTOPUS PENGUIN PYRAMID QUARTERBACK RAINBOW SANDWICH TELESCOPE UMBRELLA VOLCANO WATERMELON XYLOPHONE YOGURT ZEPPELIN ARCADE JOYSTICK PIXEL DRAGON CASTLE WIZARD PIRATE ROCKET SUBMARINE TORNADO VAMPIRE LANTERN MARATHON'.split(' ');
A.add({id:'hangman',name:'HANGMAN',cat:'PUZZLE',typing:1,how:'TYPE LETTERS (OR PICK WITH ARROWS + A). GUESS THE WORD BEFORE THE DRAWING IS FINISHED.',make(){
 const g={over:null,score:0},AB='ABCDEFGHIJKLMNOPQRSTUVWXYZ';let word=HW[ri(HW.length)],got=new Set(),bad=new Set(),c=0,streak=0,wait=0;
 const guess=ch=>{if(got.has(ch)||bad.has(ch)||!/[A-Z]/.test(ch))return;if(word.includes(ch)){got.add(ch);S('coin');if([...word].every(x=>got.has(x))){streak++;g.score+=10*(7-bad.size);S('win');A.confetti();wait=90;}}else{bad.add(ch);S('lose');if(bad.size>=6){wait=120;}}};
 g.update=()=>{if(wait>0){if(--wait===0){if(bad.size>=6){g.over='IT WAS '+word;return;}word=HW[ri(HW.length)];got=new Set();bad=new Set();}return;}while(A.typed.length)guess(A.typed.shift());const h=A.hit(0);if(h.l)c=(c+25)%26;if(h.r)c=(c+1)%26;if(h.u)c=(c+13)%26;if(h.d)c=(c+13)%26;if(h.a)guess(AB[c]);};
 g.draw=()=>{A.cls('#f4ecd8');const n=bad.size;R(30,180,80,4,'#5b3a1e');R(50,40,4,140,'#5b3a1e');R(50,40,60,4,'#5b3a1e');R(106,40,2,16,'#5b3a1e');if(n>0)A.ring(107,64,8,K.k);if(n>1)L(107,72,107,110,K.k,2);if(n>2)L(107,82,95,98,K.k,2);if(n>3)L(107,82,119,98,K.k,2);if(n>4)L(107,110,97,130,K.k,2);if(n>5)L(107,110,117,130,K.k,2);
  [...word].forEach((ch,i)=>{const x=150+i*(160/word.length);R(x,110,Math.min(14,150/word.length-3),2,K.k);if(got.has(ch)||wait&&bad.size>=6)T(ch,x+5,98,got.has(ch)?K.k:K.r,2,'c');});
  [...AB].forEach((ch,i)=>{const x=150+(i%13)*12,y=150+Math.floor(i/13)*18;const col=got.has(ch)?K.g:bad.has(ch)?K.r:K.k;T(ch,x,y,col,1);if(i===c)A.box(x-3,y-3,10,11,K.p);});T('STREAK '+streak,6,6,K.k,1);T('SCORE '+g.score,W-6,6,K.k,1,'r');};
 return g;}});

/* ---- BINGO ---- */
A.add({id:'bingo',name:'BINGO',cat:'PARTY',how:'NUMBERS ARE CALLED. A DAUBS THE CURSOR SQUARE. COMPLETE A LINE BEFORE 3 CPU PLAYERS.',make(){
 const g={over:null,score:0};const card=()=>{const cols=[];for(let c=0;c<5;c++){cols.push(shuf([...Array(15)].map((_,i)=>c*15+i+1)).slice(0,5));}const cd=[];for(let r=0;r<5;r++)for(let c=0;c<5;c++)cd.push(cols[c][r]);cd[12]=0;return cd;};
 let me=card(),cpus=[card(),card(),card()],mark=new Set([12]),cpuM=cpus.map(()=>new Set([12])),calls=shuf([...Array(75)].map((_,i)=>i+1)),called=[],t=0,cur={x:0,y:0},msg='';
 const lines=[];for(let i=0;i<5;i++){lines.push([0,1,2,3,4].map(k=>i*5+k),[0,1,2,3,4].map(k=>k*5+i));}lines.push([0,6,12,18,24],[4,8,12,16,20]);const win=m=>lines.some(l=>l.every(i=>m.has(i)));
 g.update=()=>{t++;if(t%150===0&&calls.length){const n=calls.pop();called.push(n);S('blip');cpus.forEach((cd,k)=>{const i=cd.indexOf(n);if(i>=0&&Math.random()<.9)cpuM[k].add(i);});const w=cpuM.findIndex(win);if(w>=0){g.over='CPU '+(w+1)+' CALLED BINGO';S('lose');return;}}
  const h=A.hit(0);mv(h,cur,5,5);if(h.a){const i=cur.y*5+cur.x;if(called.includes(me[i])){mark.add(i);S('coin');if(win(mark)){g.score=100-called.length;g.over='BINGO! WIN';A.confetti();}}else{msg='NOT CALLED YET';t=Math.max(0,t-40);S('lose');}}};
 g.draw=()=>{A.cls('#1a4a8a');const L_='BINGO';for(let c=0;c<5;c++)T(L_[c],70+c*30+14,16,K.y,2,'c');for(let i=0;i<25;i++){const x=70+(i%5)*30,y=34+((i/5)|0)*30;R(x,y,28,28,'#fff3d6');T(i===12?'★':me[i],x+14,y+10,called.includes(me[i])&&!mark.has(i)?'#2a6ab0':K.k,1,'c');if(mark.has(i))C(x+14,y+14,11,'rgba(255,63,142,.55)');}A.box(70+cur.x*30-1,34+cur.y*30-1,30,30,K.p);
  const last=called[called.length-1];C(260,70,26,K.y);if(last)T(L_[Math.floor((last-1)/15)]+last,260,64,K.k,2,'c');T('CALLED '+called.length,260,108,K.w,1,'c');cpuM.forEach((m,k)=>{T('CPU '+(k+1),230,140+k*16,K.w,1);const best=Math.max(...lines.map(l=>l.filter(i=>m.has(i)).length));for(let j=0;j<5;j++)R(262+j*9,140+k*16,7,7,j<best?K.p:'#3a5a9a');});};
 return g;}});

/* ---- DOMINOES ---- */
A.add({id:'dominoes',name:'DOMINOES',cat:'BOARD',vs:1,how:'LEFT/RIGHT PICK A TILE, A PLAYS IT ON A MATCHING END. B DRAWS. EMPTY YOUR HAND FIRST.',make(){
 const g={over:null,score:0};let set=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)set.push([a,b]);shuf(set);let hands=[set.splice(0,7),set.splice(0,7)],line=[],p=0,sel=0,think=0,msg='';
 const ends=()=>line.length?[line[0][0],line[line.length-1][1]]:null;const fits=t=>{const e=ends();return !e||t.includes(e[0])||t.includes(e[1]);};
 const play=(i)=>{const t=hands[p][i],e=ends();if(!e){line.push(t);}else if(t[1]===e[0])line.unshift(t);else if(t[0]===e[0])line.unshift([t[1],t[0]]);else if(t[0]===e[1])line.push(t);else if(t[1]===e[1])line.push([t[1],t[0]]);else return false;hands[p].splice(i,1);S('hit');if(!hands[p].length){g.over=A.win(p);return true;}p=1-p;think=0;sel=0;return true;};
 const blocked=()=>!set.length&&!hands[0].some(fits)&&!hands[1].some(fits);
 g.update=()=>{if(blocked()){const s=hands.map(h=>h.reduce((a,t)=>a+t[0]+t[1],0));g.over=s[0]===s[1]?'BLOCKED - DRAW!':A.win(s[0]<s[1]?0:1);return;}if(A.cpu&&p===1){if(++think<35)return;const opts=hands[1].map((t,i)=>[t,i]).filter(x=>fits(x[0])).sort((a,b)=>(b[0][0]+b[0][1])-(a[0][0]+a[0][1]));if(opts.length)play(opts[A.lvl===0?ri(opts.length):0][1]);else if(set.length){hands[1].push(set.pop());S('blip');}else{p=0;}return;}
  const h=A.hit(human(p)),hd=hands[p];if(h.l)sel=(sel+hd.length-1)%hd.length;if(h.r)sel=(sel+1)%hd.length;if(h.a){if(!fits(hd[sel])||!play(sel)){msg='DOESN\'T FIT';S('lose');}}if(h.b){if(hd.some(fits)){msg='YOU CAN PLAY';S('lose');}else if(set.length){hd.push(set.pop());S('blip');}else{p=1-p;}}};
 const tile=(x,y,t,on,hz)=>{const w=hz?30:15,hh=hz?15:30;R(x,y,w,hh,on?'#fff3a0':'#f8f4ea');A.box(x,y,w,hh,'#333');if(hz)R(x+14,y+2,1,11,'#999');else R(x+2,y+14,11,1,'#999');const pip=(cx,cy,n)=>{const P={1:[[0,0]],2:[[-3,-3],[3,3]],3:[[-3,-3],[0,0],[3,3]],4:[[-3,-3],[3,-3],[-3,3],[3,3]],5:[[-3,-3],[3,-3],[0,0],[-3,3],[3,3]],6:[[-3,-3],[3,-3],[-3,0],[3,0],[-3,3],[3,3]]}[n]||[];P.forEach(q=>R(cx+q[0]-1,cy+q[1]-1,2,2,'#111'));};if(hz){pip(x+7,y+7,t[0]);pip(x+22,y+7,t[1]);}else{pip(x+7,y+7,t[0]);pip(x+7,y+22,t[1]);}};
 g.draw=()=>{A.cls('#0f5a2a');const n=line.length,start=160-Math.min(n,10)*16;line.slice(-10).forEach((t,i)=>tile(start+i*32,100,t,false,true));if(n>10)T('+'+(n-10)+' MORE',20,106,K.w,1);
  const me=A.cpu?0:p;hands[me].forEach((t,i)=>tile(20+i*19,190,t,i===sel&&(p===me||!A.cpu),false));for(let i=0;i<hands[1-me].length;i++)R(20+i*19,20,15,30,'#2a2a38');T('BONEYARD '+set.length,W-6,140,K.w,1,'r');T(A.nm(p)+' TO PLAY',160,150,p?K.p:K.c,1,'c');if(msg&&A.t%120<100)T(msg,160,166,K.y,1,'c');};
 return g;}});
})();
