(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};

/* ---- PIPE FLOW ---- */
A.add({id:'pipes',name:'PIPE FLOW',cat:'PUZZLE',how:'A ROTATES A PIPE. CONNECT LEFT TAP TO RIGHT DRAIN.',make(){
 const g={over:null,score:0},N=6;let b,c={x:0,y:0},lvl=0,time=0,fl=[];
 const gen=()=>{lvl++;b=[];let path=[];let x=0,y=ri(N);path.push([x,y]);while(x<N-1){const r=Math.random();let nx=x,ny=y;if(r<.5)nx++;else if(r<.75&&y>0)ny--;else if(y<N-1)ny++;else nx++;if(path.some(p=>p[0]===nx&&p[1]===ny))continue;x=nx;y=ny;path.push([x,y]);}
  for(let i=0;i<N*N;i++)b.push({t:ri(2),r:ri(4)});path.forEach((p,i)=>{const cell=b[p[1]*N+p[0]];const prev=i?path[i-1]:[p[0]-1,p[1]],next=path[i+1]||[p[0]+1,p[1]];const dIn=[prev[0]-p[0],prev[1]-p[1]],dOut=[next[0]-p[0],next[1]-p[1]];cell.t=(dIn[0]===-dOut[0]&&dIn[1]===-dOut[1])?0:1;cell.r=ri(4);});g.start=path[0][1];g.end=path[path.length-1][1];time=0;};gen();
 const ports=cell=>{const s=cell.t===0?[[1,0],[-1,0]]:[[1,0],[0,-1]];return s.map(d=>{for(let i=0;i<cell.r;i++)d=[-d[1],d[0]];return d;});};
 const trace=()=>{fl=[];let x=0,y=g.start,from=[-1,0],n=0;while(n++<40){if(x<0||y<0||x>=N||y>=N)return false;const cell=b[y*N+x],ps=ports(cell);const inD=[-from[0],-from[1]];const has=ps.find(d=>d[0]===inD[0]&&d[1]===inD[1]);if(!has)return false;fl.push(y*N+x);const out=ps.find(d=>!(d[0]===inD[0]&&d[1]===inD[1]));if(x===N-1&&y===g.end&&out[0]===1)return true;x+=out[0];y+=out[1];from=out;}return false;};trace();
 g.update=()=>{time++;const h=A.hit(0);mvCur(h,c,N,N);if(h.a){b[c.y*N+c.x].r=(b[c.y*N+c.x].r+1)%4;S('blip');if(trace()){g.score+=Math.max(20,200-(time/60|0)*5);S('score');if(lvl>=6)g.over='ALL PIPES FLOW! WIN';else{gen();trace();}}}};
 g.draw=()=>{A.cls();const CS=28,OX=76,OY=36;R(OX-14,OY+g.start*CS+9,14,10,K.b);R(OX+N*CS,OY+g.end*CS+9,14,10,K.gr);b.forEach((cell,i)=>{const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS,on=fl.includes(i),col=on?K.b:'#6a65a0';R(x+1,y+1,CS-2,CS-2,K.d);ports(cell).forEach(d=>{R(x+CS/2-4+Math.min(0,d[0])*10,y+CS/2-4+Math.min(0,d[1])*10,8+Math.abs(d[0])*10,8+Math.abs(d[1])*10,col);});C(x+CS/2,y+CS/2,5,col);});
  A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.y);T('LEVEL '+lvl+'/6',6,6,K.w,2);T('SCORE '+g.score,W-6,6,K.y,2,'r');};
 return g;}});

/* ---- COLOR FLOOD ---- */
A.add({id:'flood',name:'COLOR FLOOD',cat:'PUZZLE',how:'PICK A COLOUR WITH LEFT/RIGHT, A FLOODS FROM THE CORNER. FILL THE BOARD IN 22 MOVES.',make(){
 const g={over:null,score:0},N=12,CO=[K.r,K.y,K.g,K.b,K.p,K.o];let b=[],sel=0,moves=22;for(let i=0;i<N*N;i++)b.push(ri(6));
 g.update=()=>{const h=A.hit(0);if(h.l)sel=(sel+5)%6;if(h.r)sel=(sel+1)%6;if(h.a){const old=b[0];if(old===sel){S('lose');return;}const st=[0];while(st.length){const i=st.pop();if(b[i]!==old)continue;b[i]=sel;const x=i%N,y=(i/N)|0;if(x>0)st.push(i-1);if(x<N-1)st.push(i+1);if(y>0)st.push(i-N);if(y<N-1)st.push(i+N);}moves--;S('blip');if(b.every(v=>v===b[0])){g.score=moves*10+10;g.over='FLOODED! WIN';S('win');}else if(moves<=0)g.over='OUT OF MOVES';}};
 g.draw=()=>{A.cls();b.forEach((v,i)=>R(70+(i%N)*15,30+((i/N)|0)*15,14,14,CO[v]));CO.forEach((col,i)=>{R(258+(i%2)*26,60+((i/2)|0)*26,22,22,col);if(i===sel)A.box(256+(i%2)*26,58+((i/2)|0)*26,26,26,K.w);});T('MOVES '+moves,6,6,moves<5?K.r:K.w,2);};
 return g;}});

/* ---- GEM SWAP ---- */
A.add({id:'gems',name:'GEM SWAP',cat:'PUZZLE',how:'A GRABS A GEM, ARROW SWAPS IT. MATCH 3+. 60 SEC.',make(){
 const g={over:null,score:0},N=8,CO=[K.r,K.y,K.g,K.b,K.p,K.c];let b=[],c={x:3,y:3},hold=false,time=3600,anim=0;
 const matches=()=>{const m=new Set();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=b[y*N+x];if(v<0)continue;if(x<N-2&&b[y*N+x+1]===v&&b[y*N+x+2]===v){m.add(y*N+x);m.add(y*N+x+1);m.add(y*N+x+2);}if(y<N-2&&b[(y+1)*N+x]===v&&b[(y+2)*N+x]===v){m.add(y*N+x);m.add((y+1)*N+x);m.add((y+2)*N+x);}}return m;};
 for(let i=0;i<N*N;i++)b.push(ri(6));let m;while((m=matches()).size)m.forEach(i=>b[i]=ri(6));
 const settle=()=>{for(let x=0;x<N;x++){let w=N-1;for(let y=N-1;y>=0;y--)if(b[y*N+x]>=0)b[w--*N+x]=b[y*N+x];while(w>=0)b[w--*N+x]=ri(6);}};
 g.update=()=>{time--;if(time<=0){g.over='TIME UP';return;}if(anim>0){if(--anim===0){const m=matches();if(m.size){g.score+=m.size*10;m.forEach(i=>b[i]=-1);settle();anim=12;S('coin');}}return;}
  const h=A.hit(0);if(hold){const dx=ax(h),dy=dx?0:ay(h);if(dx||dy){const nx=c.x+dx,ny=c.y+dy;if(nx>=0&&ny>=0&&nx<N&&ny<N){const i=c.y*N+c.x,j=ny*N+nx;[b[i],b[j]]=[b[j],b[i]];if(matches().size){anim=6;c.x=nx;c.y=ny;S('hit');}else{[b[i],b[j]]=[b[j],b[i]];S('lose');}}hold=false;}else if(h.a||h.b)hold=false;}
  else{mvCur(h,c,N,N);if(h.a){hold=true;S('blip');}}};
 g.draw=()=>{A.cls();R(60,20,200,200,K.d);b.forEach((v,i)=>{if(v<0)return;const x=62+(i%N)*25,y=22+((i/N)|0)*25;if(v%3===0)C(x+12,y+12,9,CO[v]);else if(v%3===1)R(x+3,y+3,18,18,CO[v]);else A.poly([[x+12,y+2],[x+22,y+12],[x+12,y+22],[x+2,y+12]],CO[v],1);});
  A.box(60+c.x*25,20+c.y*25,25,25,hold?K.w:K.y);T('SCORE '+g.score,6,6,K.y,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');};
 return g;}});

/* ---- MAZE DASH ---- */
A.add({id:'maze',name:'MAZE DASH',cat:'PUZZLE',how:'FIND THE EXIT. EACH MAZE IS BIGGER. BEAT THE CLOCK.',make(){
 const g={over:null,score:0};let N,m,p,ex,lvl=0,time=0,mv=0;
 const build=()=>{lvl++;N=Math.min(9+lvl*2,25);m=[];for(let y=0;y<N;y++)m.push(Array(N).fill(1));const st=[[1,1]];m[1][1]=0;while(st.length){const c=st[st.length-1],ds=[[2,0],[-2,0],[0,2],[0,-2]].filter(d=>{const x=c[0]+d[0],y=c[1]+d[1];return x>0&&y>0&&x<N-1&&y<N-1&&m[y][x];});if(!ds.length){st.pop();continue;}const d=ds[ri(ds.length)];m[c[1]+d[1]/2][c[0]+d[0]/2]=0;m[c[1]+d[1]][c[0]+d[0]]=0;st.push([c[0]+d[0],c[1]+d[1]]);}p={x:1,y:1};ex=[N-2,N-2];time=(20+N*2)*60;};build();
 g.update=()=>{time--;if(mv>0)mv--;const k=A.in(0);if(mv===0){const dx=ax(k),dy=dx?0:ay(k);if((dx||dy)&&!m[p.y+dy][p.x+dx]){p.x+=dx;p.y+=dy;mv=4;}}if(p.x===ex[0]&&p.y===ex[1]){g.score+=100+(time/60|0)*5;S('win');build();}if(time<=0)g.over='LOST IN THE MAZE';};
 g.draw=()=>{A.cls();const CS=Math.floor(200/N),OX=160-N*CS/2,OY=122-N*CS/2;m.forEach((row,y)=>row.forEach((v,x)=>{if(v)R(OX+x*CS,OY+y*CS,CS,CS,'#6a4fb5');}));R(OX+ex[0]*CS,OY+ex[1]*CS,CS,CS,K.g);R(OX+p.x*CS+1,OY+p.y*CS+1,CS-2,CS-2,K.y);T('MAZE '+lvl,6,6,K.w,2);T(Math.ceil(time/60),W-6,6,time<300?K.r:K.w,2,'r');};
 return g;}});

/* ---- TOWER OF HANOI ---- */
A.add({id:'hanoi',name:'TOWER OF HANOI',cat:'PUZZLE',low:1,how:'A LIFTS THE TOP DISC, A DROPS IT. SMALLER ON BIGGER ONLY. MOVE THE TOWER RIGHT.',make(){
 const g={over:null,score:0},N=5;let pegs=[[5,4,3,2,1],[],[]],c=0,hold=0;
 g.update=()=>{const h=A.hit(0);if(h.l)c=(c+2)%3;if(h.r)c=(c+1)%3;if(h.a){if(hold){const top=pegs[c][pegs[c].length-1];if(!top||top>hold){pegs[c].push(hold);hold=0;g.score++;S('hit');if(pegs[2].length===N)g.over='SOLVED IN '+g.score+'! WIN';}else S('lose');}else if(pegs[c].length){hold=pegs[c].pop();S('blip');}}};
 g.draw=()=>{A.cls();R(20,200,280,8,'#8a5c33');const CO=[K.r,K.o,K.y,K.g,K.c];pegs.forEach((pg,i)=>{const x=70+i*90;R(x-3,90,6,110,'#5b3a1e');pg.forEach((d,j)=>R(x-d*11,192-j*12,d*22,10,CO[d-1]));if(i===c){T('V',x,72,K.y,2,'c');if(hold)R(x-hold*11,50,hold*22,10,CO[hold-1]);}});
  T('MOVES '+g.score,6,6,K.w,2);T('BEST POSSIBLE 31',W-6,6,K.gr,1,'r');};
 return g;}});

/* ---- BLOCK FIT ---- */
A.add({id:'blockfit',name:'BLOCK FIT',cat:'PUZZLE',how:'PLACE 3 PIECES ANYWHERE. FULL ROWS AND COLUMNS CLEAR. NO ROTATION.',make(){
 const g={over:null,score:0},N=8,SH=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,1],[0,1],[1,0],[2,0],[2,1]]];
 let b=Array(N*N).fill(0),hand=[],sel=0,c={x:0,y:0};const deal=()=>{hand=[ri(SH.length),ri(SH.length),ri(SH.length)];};deal();
 const fits=(s,x,y)=>SH[s].every(p=>x+p[0]<N&&y+p[1]<N&&!b[(y+p[1])*N+x+p[0]]);
 const any=()=>hand.some(s=>s>=0&&[...Array(N*N).keys()].some(i=>fits(s,i%N,(i/N)|0)));
 g.update=()=>{const h=A.hit(0);if(h.b){do{sel=(sel+1)%3;}while(hand[sel]<0);S('blip');}mvCur(h,c,N,N);if(h.a&&hand[sel]>=0){const s=hand[sel];if(fits(s,c.x,c.y)){SH[s].forEach(p=>b[(c.y+p[1])*N+c.x+p[0]]=1+(s%6));g.score+=SH[s].length;let cleared=0;for(let i=0;i<N;i++){if([...Array(N).keys()].every(j=>b[i*N+j])){for(let j=0;j<N;j++)b[i*N+j]=-1;cleared++;}if([...Array(N).keys()].every(j=>b[j*N+i])){for(let j=0;j<N;j++)b[j*N+i]=-1;cleared++;}}b=b.map(v=>v<0?0:v);g.score+=cleared*10*cleared;S(cleared?'score':'hit');hand[sel]=-1;if(hand.every(v=>v<0))deal();else{sel=hand.findIndex(v=>v>=0);}if(!any())g.over='NO ROOM LEFT';}else S('lose');}};
 g.draw=()=>{A.cls();const CS=22,OX=40,OY=32,CO=[K.r,K.o,K.y,K.g,K.c,K.b,K.p];for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS;R(x,y,CS-1,CS-1,b[i]?CO[b[i]]:'#1a1440');}
  const s=hand[sel];if(s>=0){const ok=fits(s,c.x,c.y);SH[s].forEach(p=>{const x=c.x+p[0],y=c.y+p[1];if(x<N&&y<N)R(OX+x*CS+2,OY+y*CS+2,CS-5,CS-5,ok?'rgba(255,255,255,.6)':'rgba(255,79,109,.6)');});}
  hand.forEach((s,i)=>{const y=40+i*60;if(i===sel)A.box(236,y-4,60,54,K.y);if(s>=0)SH[s].forEach(p=>R(240+p[0]*12,y+p[1]*12,11,11,CO[s%6]));});T('SCORE '+g.score,6,6,K.y,2);T('B NEXT PIECE',W-6,222,K.gr,1,'r');};
 return g;}});

/* ---- PEG JUMP ---- */
A.add({id:'pegs',name:'PEG JUMP',cat:'PUZZLE',low:1,how:'A PICKS A PEG, A JUMPS IT OVER A NEIGHBOUR. FEWEST LEFT WINS.',make(){
 const g={over:null,score:32},N=7;let b=[],c={x:3,y:2},sel=-1;for(let i=0;i<49;i++){const x=i%7,y=(i/7)|0,ok=(x>1&&x<5)||(y>1&&y<5);b.push(ok?1:-1);}b[24]=0;
 const jumps=i=>{const x=i%7,y=(i/7)|0,o=[];for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const mx=x+d[0],my=y+d[1],tx=x+2*d[0],ty=y+2*d[1];if(tx<0||ty<0||tx>6||ty>6)continue;if(b[my*7+mx]===1&&b[ty*7+tx]===0)o.push([my*7+mx,ty*7+tx]);}return o;};
 g.update=()=>{const h=A.hit(0);mvCur(h,c,7,7);if(h.a){const i=c.y*7+c.x;if(sel<0){if(b[i]===1&&jumps(i).length){sel=i;S('blip');}else S('lose');}else{const j=jumps(sel).find(j=>j[1]===i);if(j){b[sel]=0;b[j[0]]=0;b[i]=1;sel=-1;g.score=b.filter(v=>v===1).length;S('hit');if(!b.some((v,k)=>v===1&&jumps(k).length))g.over=g.score===1?'PERFECT! WIN':g.score+' PEGS LEFT';}else{sel=-1;S('lose');}}}};
 g.draw=()=>{A.cls();b.forEach((v,i)=>{if(v<0)return;const x=76+(i%7)*24,y=36+((i/7)|0)*24;C(x+12,y+12,10,K.d);if(v===1)C(x+12,y+12,7,i===sel?K.y:K.o);if(sel>=0&&jumps(sel).some(j=>j[1]===i))C(x+12,y+12,3,K.g);});A.box(76+c.x*24,36+c.y*24,24,24,K.y);T('PEGS '+g.score,6,6,K.w,2);};
 return g;}});

/* ---- QUICK MATH ---- */
A.add({id:'math',name:'QUICK MATH',cat:'PUZZLE',how:'LEFT/RIGHT PICK THE ANSWER, A CONFIRMS. FAST = MORE POINTS. 3 STRIKES.',make(){
 const g={over:null,score:0};let q,opts,ans,sel=1,t=0,strikes=0,n=0;
 const gen=()=>{n++;const d=1+Math.min(3,n/5|0),a=ri(10*d)+1,b=ri(10*d)+1,op=['+','-','x'][ri(n>4?3:2)];ans=op==='+'?a+b:op==='-'?a-b:a*b;q=a+' '+op+' '+b;const s=new Set([ans]);while(s.size<3)s.add(ans+ri(9)-4+(ans>20?ri(10)-5:0));opts=[...s].sort(()=>Math.random()-.5);sel=1;t=0;};gen();
 g.update=()=>{t++;const h=A.hit(0);if(h.l)sel=(sel+2)%3;if(h.r)sel=(sel+1)%3;if(h.a){if(opts[sel]===ans){g.score+=Math.max(1,10-(t/30|0));S('coin');}else{strikes++;S('lose');if(strikes>=3){g.over='3 STRIKES';return;}}gen();}if(t>360){strikes++;S('lose');if(strikes>=3){g.over='TOO SLOW';return;}gen();}};
 g.draw=()=>{A.cls();T(q+' = ?',160,70,K.w,4,'c');opts.forEach((o,i)=>{const x=70+i*90;R(x-30,130,60,30,i===sel?K.y:K.d);T(o,x,140,i===sel?K.k:K.w,2,'c');});R(60,190,200,4,K.d);R(60,190,200*(1-t/360),4,t>240?K.r:K.g);T('SCORE '+g.score,6,6,K.y,2);T('X'.repeat(strikes),W-6,6,K.r,2,'r');};
 return g;}});
})();
