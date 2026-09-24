(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const human=p=>A.two?p:0;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};

/* ---- FOUR IN A ROW ---- */
A.add({id:'four',name:'FOUR IN A ROW',cat:'BOARD',vs:1,how:'PICK COLUMN. A DROPS. CONNECT 4.',make(){
 const g={over:null,score:0},WN=[];for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const d of[[0,1],[1,0],[1,1],[1,-1]]){const er=r+d[0]*3,ec=c+d[1]*3;if(er<6&&ec>=0&&ec<7)WN.push([0,1,2,3].map(i=>(r+d[0]*i)*7+c+d[1]*i));}
 let b=Array(42).fill(0),p=0,col=3,think=0,winL=null,fall=null;
 const drop=(bd,c)=>{for(let r=5;r>=0;r--)if(!bd[r*7+c])return r*7+c;return -1;};const won=(bd,v)=>WN.find(w=>w.every(i=>bd[i]===v));
 const ev=bd=>{let s=0;for(const w of WN){let a=0,o=0;for(const i of w){if(bd[i]===2)a++;else if(bd[i]===1)o++;}if(a&&o)continue;s+=a===3?6:a===2?2:o===3?-7:o===2?-2:0;}for(let r=0;r<6;r++)if(bd[r*7+3]===2)s+=2;return s;};
 const mm=(bd,dp,al,be,mx)=>{if(won(bd,2))return 1e5+dp;if(won(bd,1))return -1e5-dp;if(dp===0||bd.every(v=>v))return ev(bd);let best=mx?-1e9:1e9;for(const c of[3,2,4,1,5,0,6]){const i=drop(bd,c);if(i<0)continue;bd[i]=mx?2:1;const v=mm(bd,dp-1,al,be,!mx);bd[i]=0;if(mx){if(v>best)best=v;if(v>al)al=v;}else{if(v<best)best=v;if(v<be)be=v;}if(al>=be)break;}return best;};
 const play=c=>{const i=drop(b,c);if(i<0)return;b[i]=p+1;fall={i,y:0};S('hit');const w=won(b,p+1);if(w){winL=w;g.over=A.win(p);}else if(b.every(v=>v))g.over='DRAW!';else p=1-p;think=0;};
 g.update=()=>{if(fall){fall.y+=.12;if(fall.y>=1)fall=null;}if(A.cpu&&p===1){if(++think>35){let best=-1e9,bc=3;const dp=[1,3,5][A.lvl];for(const c of[3,2,4,1,5,0,6]){const i=drop(b,c);if(i<0)continue;b[i]=2;const v=mm(b,dp,-1e9,1e9,false)+rnd(A.lvl?1:8);b[i]=0;if(v>best){best=v;bc=c;}}col=bc;play(bc);}return;}
  const h=A.hit(human(p));if(h.l)col=(col+6)%7;if(h.r)col=(col+1)%7;if(h.a||h.d)play(col);};
 g.draw=()=>{A.cls();R(62,48,196,170,'#2b3bd6');for(let i=0;i<42;i++){const x=76+(i%7)*28,y=64+((i/7)|0)*28,v=b[i];C(x,y,11,v===1?K.c:v===2?K.p:K.bg);if(winL&&winL.includes(i)&&A.t%20<10)A.ring(x,y,12,K.w);}
  if(!g.over)C(76+col*28,34,10,p?K.p:K.c);A.hud2('','');T(A.nm(p)+' TO MOVE',160,6,p?K.p:K.c,2,'c');};
 return g;}});

/* ---- TIC TAC TOE ---- */
A.add({id:'ttt',name:'TIC TAC TOE',cat:'BOARD',vs:1,how:'MOVE. A MARKS. 3 IN A ROW. BEST OF 5.',make(){
 const g={over:null,score:0},LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];let b,p,c={x:1,y:1},sc=[0,0],wait=0,msg='',think=0,first=0;
 const reset=()=>{b=Array(9).fill(0);p=first;first=1-first;think=0;};reset();const won=v=>LN.some(l=>l.every(i=>b[i]===v));
 const mm=mx=>{if(won(2))return 1;if(won(1))return -1;if(b.every(v=>v))return 0;let best=mx?-2:2;for(let i=0;i<9;i++)if(!b[i]){b[i]=mx?2:1;const v=mm(!mx);b[i]=0;best=mx?Math.max(best,v):Math.min(best,v);}return best;};
 const play=i=>{if(b[i])return;b[i]=p+1;S('hit');if(won(p+1)){sc[p]++;msg=A.nm(p)+' TAKES IT';wait=80;S('score');}else if(b.every(v=>v)){msg='DRAW';wait=80;}else p=1-p;think=0;};
 g.update=()=>{if(wait>0){if(--wait===0){if(sc[0]>=3||sc[1]>=3)g.over=A.win(sc[0]>=3?0:1);else reset();}return;}
  if(A.cpu&&p===1){if(++think>30){const fr=[];b.forEach((v,i)=>{if(!v)fr.push(i);});let mv=fr[ri(fr.length)];if(Math.random()<[.45,.85,1][A.lvl]){let best=-2;for(const i of fr){b[i]=2;const v=mm(false)+rnd(.01);b[i]=0;if(v>best){best=v;mv=i;}}}play(mv);}return;}
  const h=A.hit(human(p));mvCur(h,c,3,3);if(h.a)play(c.y*3+c.x);};
 g.draw=()=>{A.cls();for(let i=1;i<3;i++){R(85+i*50,45,2,150,K.gr);R(85,45+i*50,150,2,K.gr);}b.forEach((v,i)=>{const x=110+(i%3)*50,y=70+((i/3)|0)*50;if(v===1){L(x-15,y-15,x+15,y+15,K.c,3);L(x+15,y-15,x-15,y+15,K.c,3);}if(v===2){C(x,y,16,K.p);C(x,y,11,K.bg);}});
  if(!wait&&!(A.cpu&&p===1))A.box(88+c.x*50,48+c.y*50,46,46,K.y);A.hud2(sc[0],sc[1]);T(wait?msg:A.nm(p)+' TO MOVE',160,215,K.w,2,'c');};
 return g;}});

/* ---- FLIP DISKS ---- */
A.add({id:'flip',name:'FLIP DISKS',cat:'BOARD',vs:1,how:'TRAP RIVAL DISCS TO FLIP THEM. MOST WINS.',make(){
 const g={over:null,score:0},DR=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],WT=[100,-10,10,5,5,10,-10,100,-10,-25,1,1,1,1,-25,-10,10,1,3,2,2,3,1,10,5,1,2,1,1,2,1,5];
 let b=Array(64).fill(0),p=0,c={x:2,y:3},think=0,pass=0;b[27]=b[36]=2;b[28]=b[35]=1;const wt=i=>{const r=(i/8)|0;return WT[(r<4?r:7-r)*8+i%8];};
 const flips=(bd,i,v)=>{if(bd[i])return[];const out=[],x0=i%8,y0=(i/8)|0;for(const d of DR){const ln=[];let x=x0+d[0],y=y0+d[1];while(x>=0&&y>=0&&x<8&&y<8&&bd[y*8+x]===3-v){ln.push(y*8+x);x+=d[0];y+=d[1];}if(ln.length&&x>=0&&y>=0&&x<8&&y<8&&bd[y*8+x]===v)out.push(...ln);}return out;};
 const moves=(bd,v)=>{const m=[];for(let i=0;i<64;i++){const f=flips(bd,i,v);if(f.length)m.push([i,f]);}return m;};
 const finish=()=>{const a=b.filter(v=>v===1).length,z=b.filter(v=>v===2).length;g.over=a===z?'DRAW!':A.win(a>z?0:1);};
 const play=(i,f)=>{b[i]=p+1;f.forEach(j=>b[j]=p+1);S('hit');p=1-p;think=0;if(!moves(b,p+1).length){p=1-p;pass=60;if(!moves(b,p+1).length)finish();}};
 g.update=()=>{if(pass>0)pass--;if(A.cpu&&p===1){if(++think>40){const ms=moves(b,2);let best=-1e9,mv=ms[0];for(const m of ms){let v=wt(m[0])+m[1].length*(A.lvl===0?3:1)+rnd(A.lvl===0?30:3);if(A.lvl===2){const nb=b.slice();nb[m[0]]=2;m[1].forEach(j=>nb[j]=2);let worst=0;for(const o of moves(nb,1))worst=Math.max(worst,wt(o[0])+o[1].length);v-=worst;}if(v>best){best=v;mv=m;}}play(mv[0],mv[1]);}return;}
  const h=A.hit(human(p));mvCur(h,c,8,8);if(h.a){const f=flips(b,c.y*8+c.x,p+1);if(f.length)play(c.y*8+c.x,f);else S('lose');}};
 g.draw=()=>{A.cls();R(68,26,184,184,'#0f5a2a');for(let i=0;i<64;i++){const x=70+(i%8)*23,y=28+((i/8)|0)*23;R(x,y,21,21,'#1e8a45');if(b[i])C(x+10.5,y+10.5,8,b[i]===1?K.c:K.p);else if(!(A.cpu&&p===1)&&flips(b,i,p+1).length)R(x+9,y+9,3,3,'#0f5a2a');}
  if(!g.over&&!(A.cpu&&p===1))A.box(70+c.x*23,28+c.y*23,21,21,K.y);A.hud2(b.filter(v=>v===1).length,b.filter(v=>v===2).length);T(pass>0?A.nm(1-p)+' HAD NO MOVE':A.nm(p)+' TO MOVE',160,220,K.w,2,'c');};
 return g;}});

/* ---- POWER TILES ---- */
A.add({id:'tiles',name:'POWER TILES',cat:'PUZZLE',how:'SLIDE. MATCHING TILES MERGE.',make(){
 const g={over:null,score:0};let b=Array(16).fill(0);const add=()=>{const e=[];b.forEach((v,i)=>{if(!v)e.push(i);});if(e.length)b[e[ri(e.length)]]=Math.random()<.9?2:4;};add();add();
 const slide=(bd,d)=>{let moved=false,gain=0;for(let n=0;n<4;n++){const idx=[0,1,2,3].map(i=>d==='l'?n*4+i:d==='r'?n*4+3-i:d==='u'?i*4+n:(3-i)*4+n),v=idx.map(i=>bd[i]).filter(x=>x),o=[];for(let i=0;i<v.length;i++){if(v[i]===v[i+1]){o.push(v[i]*2);gain+=v[i]*2;i++;}else o.push(v[i]);}while(o.length<4)o.push(0);idx.forEach((i,j)=>{if(bd[i]!==o[j])moved=true;bd[i]=o[j];});}return moved?gain+1:0;};
 g.update=()=>{const h=A.hit(0);for(const d of['l','r','u','d'])if(h[d]){const r=slide(b,d);if(r){g.score+=r-1;add();S(r>1?'coin':'blip');if(!['l','r','u','d'].some(x=>slide(b.slice(),x)))g.over='NO MOVES LEFT';}break;}};
 g.draw=()=>{A.cls();R(74,38,172,172,K.d);b.forEach((v,i)=>{const x=78+(i%4)*42,y=42+((i/4)|0)*42,n=v?Math.log2(v):0;R(x,y,38,38,v?[K.gr,K.c,K.b,K.g,K.y,K.o,K.r,K.p,K.w,K.w,K.w,K.y][Math.min(n,11)]:'#1a1440');if(v)T(v,x+19,y+(v>999?16:14),K.k,v>999?1:2,'c');});T('SCORE '+g.score,160,12,K.y,2,'c');};
 return g;}});

/* ---- MINE FIELD ---- */
A.add({id:'mines',name:'MINE FIELD',cat:'PUZZLE',how:'A DIGS. B FLAGS. NUMBERS = NEARBY MINES.',make(){
 const g={over:null,score:0},GW=16,GH=10,NM=26,CS=18,OX=16,OY=36;let mine=null,open=Array(GW*GH).fill(0),flag=Array(GW*GH).fill(0),c={x:8,y:5},t=0,left=GW*GH-NM;
 const nb=i=>{const o=[],x=i%GW,y=(i/GW)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((dx||dy)&&nx>=0&&ny>=0&&nx<GW&&ny<GH)o.push(ny*GW+nx);}return o;};const cnt=i=>nb(i).filter(j=>mine[j]).length;
 const rev=i=>{const st=[i];while(st.length){const j=st.pop();if(open[j]||flag[j])continue;open[j]=1;left--;if(cnt(j)===0)st.push(...nb(j));}};
 g.update=()=>{if(mine)t++;const h=A.hit(0);mvCur(h,c,GW,GH);const i=c.y*GW+c.x;if(h.b&&!open[i]){flag[i]^=1;S('blip');}
  if(h.a&&!flag[i]&&!open[i]){if(!mine){mine=Array(GW*GH).fill(0);const safe=nb(i).concat(i);let n=0;while(n<NM){const j=ri(GW*GH);if(!mine[j]&&!safe.includes(j)){mine[j]=1;n++;}}}
   if(mine[i]){open[i]=1;g.score=0;g.over='BOOM!';S('boom');return;}rev(i);S('hit');if(left===0){g.score=Math.max(50,1500-(t/60|0)*5);g.over='FIELD CLEARED! WIN';}}};
 g.draw=()=>{A.cls();for(let i=0;i<GW*GH;i++){const x=OX+(i%GW)*CS,y=OY+((i/GW)|0)*CS;if(open[i]){R(x,y,CS-1,CS-1,'#1a1440');if(mine&&mine[i])C(x+8.5,y+8.5,5,K.r);else{const n=cnt(i);if(n)T(n,x+8.5,y+4,[K.c,K.g,K.y,K.o,K.r,K.p,K.w,K.w][n-1],2,'c');}}else{R(x,y,CS-1,CS-1,'#4a4570');R(x,y,CS-1,2,'#6a65a0');if(flag[i]){R(x+8,y+4,1,10,K.w);R(x+9,y+4,5,4,K.r);}if(g.over&&mine&&mine[i])C(x+8.5,y+8.5,4,K.k);}}
  A.box(OX+c.x*CS-1,OY+c.y*CS-1,CS+1,CS+1,K.y);T('MINES '+(NM-flag.filter(v=>v).length),6,8,K.r,2);T('TIME '+(t/60|0),W-6,8,K.w,2,'r');};
 return g;}});

/* ---- CRATE PUSHER ---- */
const CRATES=[['#######','#     #','# .$@ #','#     #','#######'],['########','#  .   #','# $$ . #','#  @   #','########'],['#########','#   #   #','# $ # . #','#   $ . #','# @ #   #','#########'],[' #######','##  .  #','# $ #$ #','# .$  .#','##  @ ##',' ###### '],['##########','#  .  #  #','# $$$    #','# .@. #  #','#     #  #','##########']];
A.CRATES=CRATES;
A.add({id:'crates',name:'CRATE PUSHER',cat:'PUZZLE',low:1,how:'PUSH CRATES ONTO SPOTS. B RESETS.',make(){
 const g={over:null,score:0};let li=0,m,p,bx,wait=0;const load=()=>{m=CRATES[li].map(r=>r.split(''));bx=[];m.forEach((r,y)=>r.forEach((ch,x)=>{if(ch==='@'){p={x,y};r[x]=' ';}if(ch==='$'){bx.push({x,y});r[x]=' ';}if(ch==='*'){bx.push({x,y});r[x]='.';}}));};load();
 const at=(x,y)=>(m[y]&&m[y][x])||'#',box=(x,y)=>bx.find(b=>b.x===x&&b.y===y);
 g.update=()=>{if(wait>0){if(--wait===0){li++;if(li>=CRATES.length)g.over='ALL CRATES HOME! WIN';else load();}return;}const h=A.hit(0);if(h.b){load();S('lose');return;}
  const d=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:h.d?[0,1]:null;if(!d)return;const nx=p.x+d[0],ny=p.y+d[1];if(at(nx,ny)==='#')return;const b=box(nx,ny);if(b){if(at(nx+d[0],ny+d[1])==='#'||box(nx+d[0],ny+d[1]))return;b.x+=d[0];b.y+=d[1];S('hit');}else S('blip');p.x=nx;p.y=ny;g.score++;
  if(bx.every(b=>at(b.x,b.y)==='.')){wait=60;S('score');}};
 g.draw=()=>{A.cls();const CS=22,ox=160-m[0].length*CS/2,oy=130-m.length*CS/2;m.forEach((r,y)=>r.forEach((ch,x)=>{const X=ox+x*CS,Y=oy+y*CS;if(ch==='#'){R(X,Y,CS,CS,'#6a4fb5');R(X+1,Y+1,CS-2,4,'#8d78d6');}else if(ch==='.'){R(X+8,Y+8,6,6,K.y);}}));
  bx.forEach(b=>{const X=ox+b.x*CS,Y=oy+b.y*CS,on=at(b.x,b.y)==='.';R(X+2,Y+2,CS-4,CS-4,on?K.g:K.o);A.box(X+2,Y+2,CS-4,CS-4,K.k);L(X+3,Y+3,X+CS-4,Y+CS-4,K.k);});R(ox+p.x*CS+6,oy+p.y*CS+8,10,11,K.c);R(ox+p.x*CS+7,oy+p.y*CS+2,8,7,'#ffd9a8');
  T('ROOM '+(li+1)+'/'+CRATES.length,6,6,K.w,2);T('MOVES '+g.score,W-6,6,K.y,2,'r');if(wait)T('ROOM CLEAR!',160,28,K.g,2,'c');};
 return g;}});

/* ---- MEMORY MATCH ---- */
A.add({id:'memory',name:'MEMORY MATCH',cat:'BOARD',vs:1,how:'FLIP 2. MATCH = SCORE + GO AGAIN.',make(){
 const g={over:null,score:0},GW=5,GH=4;let cards=[],c={x:0,y:0},p=0,pick=[],sc=[0,0],wait=0,seen={},think=0;
 for(let i=0;i<10;i++)cards.push({v:i},{v:i});cards.sort(()=>Math.random()-.5);
 const flip=i=>{if(cards[i].up||cards[i].gone||pick.length>=2)return;cards[i].up=1;pick.push(i);S('blip');if(Math.random()<A.ai+.15||!A.cpu)seen[i]=cards[i].v;if(pick.length===2)wait=55;};
 g.update=()=>{if(wait>0){if(--wait===0){const[a,b]=pick;if(cards[a].v===cards[b].v){cards[a].gone=cards[b].gone=1;sc[p]++;S('score');if(cards.every(q=>q.gone)){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}else{cards[a].up=cards[b].up=0;p=1-p;}pick=[];think=0;}return;}
  if(A.cpu&&p===1){if(++think<35)return;think=0;const live=cards.map((q,i)=>i).filter(i=>!cards[i].gone&&!cards[i].up),known=live.filter(i=>i in seen);let ch=-1;
   if(pick.length===1){ch=known.find(i=>seen[i]===cards[pick[0]].v&&i!==pick[0]);}else{for(const i of known){const j=known.find(j=>j!==i&&seen[j]===seen[i]);if(j!==undefined){ch=i;break;}}}
   if(ch===undefined||ch<0){const unk=live.filter(i=>!(i in seen));ch=(unk.length?unk:live)[ri((unk.length?unk:live).length)];}c.x=ch%GW;c.y=(ch/GW)|0;flip(ch);return;}
  const h=A.hit(human(p));mvCur(h,c,GW,GH);if(h.a)flip(c.y*GW+c.x);};
 g.draw=()=>{A.cls();const CO=[K.r,K.o,K.y,K.g,K.c,K.b,K.p,K.w,K.gr,'#8a5c33'];cards.forEach((q,i)=>{if(q.gone)return;const x=50+(i%GW)*46,y=36+((i/GW)|0)*46;if(q.up){R(x,y,40,40,K.w);const s=q.v,cx=x+20,cy=y+20;if(s%3===0)C(cx,cy,11,CO[s]);else if(s%3===1)R(cx-10,cy-10,20,20,CO[s]);else A.poly([[cx,cy-12],[cx+12,cy+10],[cx-12,cy+10]],CO[s],1);T('ABCDEFGHIJ'[s],cx,cy-4,K.k,2,'c');}else{R(x,y,40,40,'#2b3bd6');A.box(x+3,y+3,34,34,'#4d6bff');}});
  if(!(A.cpu&&p===1))A.box(48+c.x*46,34+c.y*46,44,44,K.y);A.hud2(sc[0],sc[1]);T(A.nm(p)+' TO FLIP',160,226,p?K.p:K.c,2,'c');};
 return g;}});

/* ---- ECHO PADS ---- */
A.add({id:'echo',name:'ECHO PADS',cat:'PUZZLE',how:'WATCH, THEN REPEAT WITH ARROWS.',make(){
 const g={over:null,score:0},P={u:[160,60,K.g],l:[90,130,K.r],r:[230,130,K.b],d:[160,200,K.y]},KS=['u','l','r','d'];let seq=[],ph='show',i=0,t=0,lit='',lt=0;const grow=()=>{seq.push(KS[ri(4)]);ph='show';i=0;t=-30;};grow();
 g.update=()=>{if(lt>0)lt--;else lit='';if(ph==='show'){if(++t>=Math.max(14,34-seq.length)){t=0;if(i<seq.length){lit=seq[i++];lt=Math.max(9,22-seq.length);S(['blip','hit','coin','jump'][KS.indexOf(lit)]);}else{ph='in';i=0;}}}
  else{const h=A.hit(0);for(const k of KS)if(h[k]){lit=k;lt=10;if(k===seq[i]){S(['blip','hit','coin','jump'][KS.indexOf(k)]);if(++i>=seq.length){g.score=seq.length;grow();}}else g.over='WRONG PAD';break;}}};
 g.draw=()=>{A.cls();for(const k of KS){const v=P[k],on=lit===k;R(v[0]-32,v[1]-26,64,52,on?v[2]:K.d);A.box(v[0]-32,v[1]-26,64,52,v[2]);}T(ph==='show'?'WATCH':'REPEAT',160,124,K.w,2,'c');T('ROUND '+seq.length,6,6,K.y,2);};
 return g;}});

/* ---- LIGHTS OUT ---- */
A.add({id:'lights',name:'LIGHTS OUT',cat:'PUZZLE',how:'A FLIPS A LAMP + NEIGHBOURS. ALL OFF WINS.',make(){
 const g={over:null,score:0};let b,c={x:2,y:2},lvl=0,time=10800;const tog=(x,y)=>{[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const X=x+d[0],Y=y+d[1];if(X>=0&&Y>=0&&X<5&&Y<5)b[Y*5+X]^=1;});};
 const build=()=>{lvl++;b=Array(25).fill(0);do{for(let i=0;i<2+lvl;i++)tog(ri(5),ri(5));}while(!b.some(v=>v));};build();
 g.update=()=>{const h=A.hit(0);mvCur(h,c,5,5);if(h.a){tog(c.x,c.y);S('hit');if(!b.some(v=>v)){g.score+=100;S('score');build();}}if(--time<=0)g.over='TIME UP';};
 g.draw=()=>{A.cls();b.forEach((v,i)=>{const x=70+(i%5)*36,y=40+((i/5)|0)*36;R(x,y,32,32,v?K.y:K.d);if(v)R(x+4,y+4,24,6,'#fff3d6');});A.box(68+c.x*36,38+c.y*36,36,36,K.p);T('BOARDS '+(lvl-1),6,8,K.y,2);T('TIME '+Math.ceil(time/60),W-6,8,K.w,2,'r');};
 return g;}});
})();
