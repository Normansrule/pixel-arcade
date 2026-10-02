(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const human=p=>A.two?p:0;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const turnTag=(txt,col,y)=>{const w=txt.length*8+16;X.panel(160-w/2,y-4,w,18,col);T(txt,160,y,col,2,'c');};
const cursor=(x,y,w,h,col)=>{const p=1+Math.sin(A.t*.15)*.8;X.glow(x+w/2,y+h/2,Math.max(w,h)*.8,col||'#ffcf3f',.15);X.rrs(x-p,y-p,w+2*p,h+2*p,4,col||'#ffcf3f',1.5);};

/* ---- FOUR IN A ROW ---- */
A.add({id:'four',name:'FOUR IN A ROW',cat:'BOARD',vs:1,how:'PICK COLUMN. A DROPS. CONNECT 4.',make(){
 const g={over:null,score:0},WN=[],fx=X.fx();for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const d of[[0,1],[1,0],[1,1],[1,-1]]){const er=r+d[0]*3,ec=c+d[1]*3;if(er<6&&ec>=0&&ec<7)WN.push([0,1,2,3].map(i=>(r+d[0]*i)*7+c+d[1]*i));}
 let b=Array(42).fill(0),p=0,col=3,think=0,winL=null,fall=null;
 const drop=(bd,c)=>{for(let r=5;r>=0;r--)if(!bd[r*7+c])return r*7+c;return -1;};const won=(bd,v)=>WN.find(w=>w.every(i=>bd[i]===v));
 const ev=bd=>{let s=0;for(const w of WN){let a=0,o=0;for(const i of w){if(bd[i]===2)a++;else if(bd[i]===1)o++;}if(a&&o)continue;s+=a===3?6:a===2?2:o===3?-7:o===2?-2:0;}for(let r=0;r<6;r++)if(bd[r*7+3]===2)s+=2;return s;};
 const mm=(bd,dp,al,be,mx)=>{if(won(bd,2))return 1e5+dp;if(won(bd,1))return -1e5-dp;if(dp===0||bd.every(v=>v))return ev(bd);let best=mx?-1e9:1e9;for(const c of[3,2,4,1,5,0,6]){const i=drop(bd,c);if(i<0)continue;bd[i]=mx?2:1;const v=mm(bd,dp-1,al,be,!mx);bd[i]=0;if(mx){if(v>best)best=v;if(v>al)al=v;}else{if(v<best)best=v;if(v<be)be=v;}if(al>=be)break;}return best;};
 const play=c=>{const i=drop(b,c);if(i<0){S('lose');return;}b[i]=p+1;fall={i,y:0,v:p+1};S('hit');const w=won(b,p+1);if(w){winL=w;g.over=A.win(p);}else if(b.every(v=>v))g.over='DRAW!';else p=1-p;think=0;};
 const pos=i=>[76+(i%7)*28,64+((i/7)|0)*28];
 g.update=()=>{if(fall){fall.y+=.09+fall.y*.12;if(fall.y>=1){const[x,y]=pos(fall.i);fx.spark(x,y+8,'#ffffff',4,1.5);A.shake=2;fall=null;}}if(A.cpu&&p===1){if(++think>35){let best=-1e9,bc=3;const dp=[1,3,5][A.lvl];for(const c of[3,2,4,1,5,0,6]){const i=drop(b,c);if(i<0)continue;b[i]=2;const v=mm(b,dp,-1e9,1e9,false)+rnd(A.lvl?1:8);b[i]=0;if(v>best){best=v;bc=c;}}col=bc;play(bc);}return;}
  const h=A.hit(human(p));if(h.l)col=(col+6)%7;if(h.r)col=(col+1)%7;if(h.l||h.r)S('blip');if(h.a||h.d)play(col);};
 const disc=(x,y,v,r)=>{const cc=v===1?'#2fd6c3':'#ff4f9a';X.disc(x,y,r||11,X.rg(x-3,y-4,1,x,y,r||11,[X.lt(cc,1.5),cc,X.lt(cc,.5)]));A.c.strokeStyle=X.lt(cc,.6);A.c.lineWidth=1;A.c.beginPath();A.c.arc(x,y,(r||11)*.62,0,6.283);A.c.stroke();X.ell(x-3,y-4,3.5,2,'rgba(255,255,255,.5)',-.5);};
 g.draw=()=>{X.cache('fourbg',()=>{X.sky(['#1a1240','#0c0824']);X.glow(160,130,140,'#3a4aff',.2);X.vg(0,226,W,14,['#3a2a1a','#1a1008']);});const c=A.c;
  for(let i=0;i<42;i++){if(!b[i]||(fall&&fall.i===i))continue;const[x,y]=pos(i);disc(x,y,b[i]);}
  if(fall){const[x,y]=pos(fall.i),y0=34;disc(x,y0+(y-y0)*Math.min(1,fall.y),fall.v);}
  /* frame with holes (evenodd) */c.beginPath();if(c.roundRect)c.roundRect(60,46,200,174,8);else c.rect(60,46,200,174);for(let i=0;i<42;i++){const[x,y]=pos(i);c.moveTo(x+11.5,y);c.arc(x,y,11.5,0,6.283);}c.fillStyle=X.lg(0,46,0,220,['#4a6aff','#2b3bd6','#1a2490']);c.fill('evenodd');
  for(let i=0;i<42;i++){const[x,y]=pos(i);c.strokeStyle='rgba(0,0,30,.5)';c.lineWidth=1.2;c.beginPath();c.arc(x,y,11.6,.3,2.8);c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.beginPath();c.arc(x,y,11.6,3.5,5.9);c.stroke();}
  c.fillStyle='rgba(255,255,255,.2)';c.fillRect(66,48,188,2);X.vg(54,214,212,10,['#2b3bd6','#121a60']);
  if(winL){winL.forEach(i=>{const[x,y]=pos(i);X.glow(x,y,18,'#ffffff',.3+.2*Math.sin(A.t*.2));A.ring(x,y,12,'#ffffff');});}
  if(!g.over&&!fall){const hx=76+col*28,bob=Math.sin(A.t*.15)*2;disc(hx,32+bob,p+1,10);X.poly([[hx-4,45+bob],[hx+4,45+bob],[hx,49+bob]],p?'#ff4f9a':'#2fd6c3');}
  fx.draw();X.bar();A.hud2('','');turnTag(g.over?'':A.nm(p)+' TO MOVE',p?K.p:K.c,4);};
 return g;}});

/* ---- TIC TAC TOE ---- */
A.add({id:'ttt',name:'TIC TAC TOE',cat:'BOARD',vs:1,how:'MOVE. A MARKS. 3 IN A ROW. BEST OF 5.',make(){
 const g={over:null,score:0},LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],fx=X.fx();let b,p,c={x:1,y:1},sc=[0,0],wait=0,msg='',think=0,first=0,age=Array(9).fill(0),wl=null;
 const reset=()=>{b=Array(9).fill(0);p=first;first=1-first;think=0;wl=null;};reset();const won=v=>LN.some(l=>l.every(i=>b[i]===v));
 const mm=mx=>{if(won(2))return 1;if(won(1))return -1;if(b.every(v=>v))return 0;let best=mx?-2:2;for(let i=0;i<9;i++)if(!b[i]){b[i]=mx?2:1;const v=mm(!mx);b[i]=0;best=mx?Math.max(best,v):Math.min(best,v);}return best;};
 const cx=i=>110+(i%3)*50,cy=i=>70+((i/3)|0)*50;
 const play=i=>{if(b[i])return;b[i]=p+1;age[i]=0;S('hit');fx.ring(cx(i),cy(i),p?'#ff4f9a':'#2fd6c3',22,14);if(won(p+1)){wl=LN.find(l=>l.every(j=>b[j]===p+1));sc[p]++;msg=A.nm(p)+' TAKES IT';wait=80;S('score');}else if(b.every(v=>v)){msg='DRAW';wait=80;}else p=1-p;think=0;};
 g.update=()=>{age=age.map(v=>v+1);if(wait>0){if(--wait===0){if(sc[0]>=3||sc[1]>=3)g.over=A.win(sc[0]>=3?0:1);else reset();}return;}
  if(A.cpu&&p===1){if(++think>30){const fr=[];b.forEach((v,i)=>{if(!v)fr.push(i);});let mv=fr[ri(fr.length)];if(Math.random()<[.45,.85,1][A.lvl]){let best=-2;for(const i of fr){b[i]=2;const v=mm(false)+rnd(.01);b[i]=0;if(v>best){best=v;mv=i;}}}play(mv);}return;}
  const h=A.hit(human(p));mvCur(h,c,3,3);if(h.a)play(c.y*3+c.x);};
 g.draw=()=>{X.cache('tttbg',()=>{X.sky(['#0a1a2a','#0e2436','#06101a']);X.glow(160,120,130,'#1a6a8a',.25);const ch=A.c;ch.fillStyle='rgba(255,255,255,.03)';for(let i=0;i<120;i++)ch.fillRect((i*71)%W,(i*37)%H,2,1);
   for(let i=1;i<3;i++){X.glow(85+i*50,120,30,'#9fd8ff',.08);X.stroke([[86+i*50,48],[86+i*50,192]],'rgba(200,235,255,.75)',2.2);X.stroke([[88,46+i*50],[232,46+i*50]],'rgba(200,235,255,.75)',2.2);}});
  b.forEach((v,i)=>{const x=cx(i),y=cy(i),k=Math.min(1,age[i]/10);if(v===1){const s=15*k;X.glow(x,y,22,'#2fd6c3',.3);X.stroke([[x-15,y-15],[x-15+30*Math.min(1,k*2),y-15+30*Math.min(1,k*2)]],'#5ff0e0',3.5);if(k>.5)X.stroke([[x+15,y-15],[x+15-30*(k-.5)*2,y-15+30*(k-.5)*2]],'#5ff0e0',3.5);}
   if(v===2){X.glow(x,y,22,'#ff4f9a',.3);A.c.strokeStyle='#ff7fc0';A.c.lineWidth=3.5;A.c.beginPath();A.c.arc(x,y,14,-1.57,-1.57+6.283*k);A.c.stroke();}});
  if(wl){const a=wl[0],z=wl[2];X.glow((cx(a)+cx(z))/2,(cy(a)+cy(z))/2,60,'#ffffff',.15);X.stroke([[cx(a),cy(a)],[cx(z),cy(z)]],'#ffffff',3);}
  if(!wait&&!(A.cpu&&p===1))cursor(88+c.x*50,48+c.y*50,46,46,p?'#ff4f9a':'#2fd6c3');fx.draw();X.bar();A.hud2(sc[0],sc[1]);turnTag(wait?msg:A.nm(p)+' TO MOVE',wait?K.y:p?K.p:K.c,214);};
 return g;}});

/* ---- FLIP DISKS ---- */
A.add({id:'flip',name:'FLIP DISKS',cat:'BOARD',vs:1,how:'TRAP RIVAL DISCS TO FLIP THEM. MOST WINS.',make(){
 const g={over:null,score:0},DR=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],WT=[100,-10,10,5,5,10,-10,100,-10,-25,1,1,1,1,-25,-10,10,1,3,2,2,3,1,10,5,1,2,1,1,2,1,5],fx=X.fx();
 let b=Array(64).fill(0),p=0,c={x:2,y:3},think=0,pass=0,ft=Array(64).fill(0);b[27]=b[36]=2;b[28]=b[35]=1;const wt=i=>{const r=(i/8)|0;return WT[(r<4?r:7-r)*8+i%8];};
 const flips=(bd,i,v)=>{if(bd[i])return[];const out=[],x0=i%8,y0=(i/8)|0;for(const d of DR){const ln=[];let x=x0+d[0],y=y0+d[1];while(x>=0&&y>=0&&x<8&&y<8&&bd[y*8+x]===3-v){ln.push(y*8+x);x+=d[0];y+=d[1];}if(ln.length&&x>=0&&y>=0&&x<8&&y<8&&bd[y*8+x]===v)out.push(...ln);}return out;};
 const moves=(bd,v)=>{const m=[];for(let i=0;i<64;i++){const f=flips(bd,i,v);if(f.length)m.push([i,f]);}return m;};
 const finish=()=>{const a=b.filter(v=>v===1).length,z=b.filter(v=>v===2).length;g.over=a===z?'DRAW!':A.win(a>z?0:1);};
 const play=(i,f)=>{b[i]=p+1;ft[i]=12;f.forEach((j,k)=>{b[j]=p+1;ft[j]=14+k*2;});S('hit');fx.ring(81+(i%8)*23,39+((i/8)|0)*23,'#ffffff',14,12);if(f.length>=4)fx.pop(81+(i%8)*23,30+((i/8)|0)*23,'x'+f.length,K.y);p=1-p;think=0;if(!moves(b,p+1).length){p=1-p;pass=60;if(!moves(b,p+1).length)finish();}};
 g.update=()=>{ft=ft.map(v=>v?v-1:0);if(pass>0)pass--;if(A.cpu&&p===1){if(++think>40){const ms=moves(b,2);let best=-1e9,mv=ms[0];for(const m of ms){let v=wt(m[0])+m[1].length*(A.lvl===0?3:1)+rnd(A.lvl===0?30:3);if(A.lvl===2){const nb=b.slice();nb[m[0]]=2;m[1].forEach(j=>nb[j]=2);let worst=0;for(const o of moves(nb,1))worst=Math.max(worst,wt(o[0])+o[1].length);v-=worst;}if(v>best){best=v;mv=m;}}play(mv[0],mv[1]);}return;}
  const h=A.hit(human(p));mvCur(h,c,8,8);if(h.a){const f=flips(b,c.y*8+c.x,p+1);if(f.length)play(c.y*8+c.x,f);else S('lose');}};
 g.draw=()=>{X.cache('flipbg',()=>{X.sky(['#2a1a10','#1a0f08']);X.rr(62,20,196,196,6,X.lg(0,20,0,216,['#a0683a','#6a3a1a']));X.rr(68,26,184,184,3,'#0a3a1a');for(let i=0;i<64;i++){const x=70+(i%8)*23,y=28+((i/8)|0)*23;A.c.fillStyle=X.lg(0,y,0,y+21,['#24a050','#1a8040']);A.c.fillRect(x,y,21,21);}X.glow(160,110,120,'#ffffd0',.1);for(const[x,y]of[[116,74],[208,74],[116,166],[208,166]])X.disc(x-.5,y-.5,1.6,'#0a3a1a');});
  const mine=!(A.cpu&&p===1)&&!g.over;for(let i=0;i<64;i++){const x=70+(i%8)*23+10.5,y=28+((i/8)|0)*23+10.5;if(b[i]){const f=ft[i],sx=f>0?Math.abs(Math.cos(f/14*3.1416)):1,col=f>7?(b[i]===1?'#ff4f9a':'#2fd6c3'):(b[i]===1?'#2fd6c3':'#ff4f9a');X.shadow(x+1,y+2,8*sx+.3,7,.35);A.c.save();A.c.translate(x,y);A.c.scale(Math.max(.08,sx),1);X.disc(0,1.2,8,X.lt(col,.45));X.disc(0,0,8,X.rg(-3,-3,1,0,0,8,[X.lt(col,1.5),col,X.lt(col,.65)]));A.c.restore();}else if(mine&&flips(b,i,p+1).length)X.disc(x,y,2.2+Math.sin(A.t*.15)*.6,'rgba(255,255,255,.35)');}
  if(mine)cursor(70+c.x*23,28+c.y*23,21,21,p?'#ff4f9a':'#2fd6c3');fx.draw();X.bar();A.hud2(b.filter(v=>v===1).length,b.filter(v=>v===2).length);turnTag(pass>0?A.nm(1-p)+' HAD NO MOVE':A.nm(p)+' TO MOVE',p?K.p:K.c,221);};
 return g;}});

/* ---- POWER TILES ---- */
A.add({id:'tiles',name:'POWER TILES',cat:'PUZZLE',how:'SLIDE. MATCHING TILES MERGE.',make(){
 const g={over:null,score:0},fx=X.fx(),TC=['#3a3260','#eee4da','#ede0c8','#f2b179','#f59563','#f67c5f','#f65e3b','#edcf72','#edcc61','#edc850','#edc53f','#edc22e','#3c3a32'];let b=Array(16).fill(0),pop=Array(16).fill(0),best=0;
 const add=()=>{const e=[];b.forEach((v,i)=>{if(!v)e.push(i);});if(e.length){const i=e[ri(e.length)];b[i]=Math.random()<.9?2:4;pop[i]=-8;}};add();add();
 const slide=(bd,d)=>{let moved=false,gain=0;for(let n=0;n<4;n++){const idx=[0,1,2,3].map(i=>d==='l'?n*4+i:d==='r'?n*4+3-i:d==='u'?i*4+n:(3-i)*4+n),v=idx.map(i=>bd[i]).filter(x=>x),o=[];for(let i=0;i<v.length;i++){if(v[i]===v[i+1]){o.push(v[i]*2);gain+=v[i]*2;i++;}else o.push(v[i]);}while(o.length<4)o.push(0);idx.forEach((i,j)=>{if(bd[i]!==o[j])moved=true;bd[i]=o[j];});}return moved?gain+1:0;};
 g.update=()=>{pop=pop.map(v=>v>0?v-1:v<0?v+1:0);const h=A.hit(0);for(const d of['l','r','u','d'])if(h[d]){const prev=b.slice(),r=slide(b,d);if(r){g.score+=r-1;const mx=Math.max(...b);if(r>1){const cnt={};prev.forEach(v=>{if(v)cnt[v]=(cnt[v]||0)+1;});b.forEach((v,i)=>{if(v&&v!==prev[i]&&v>=4&&cnt[v/2]>=2&&!(prev[i]===v)){pop[i]=8;const x=78+(i%4)*42+19,y=42+((i/4)|0)*42+19;fx.spark(x,y,TC[Math.min(12,Math.log2(v))],5,1.8);}});if(mx>best&&mx>=64){best=mx;fx.pop(160,26,mx+'!',K.y);fx.flash('#ffe8a0',6);}}add();S(r>1?'coin':'blip');if(!['l','r','u','d'].some(x=>slide(b.slice(),x)))g.over='NO MOVES LEFT';}break;}};
 g.draw=()=>{X.cache('tilesbg',()=>{X.sky(['#2a1e4e','#1a1236','#0e0a20']);X.glow(160,124,140,'#7a5aff',.15);X.rr(72,36,176,176,8,X.lg(0,36,0,212,['#4a4078','#2e2852']));for(let i=0;i<16;i++)X.rr(78+(i%4)*42,42+((i/4)|0)*42,38,38,5,'rgba(10,6,30,.45)');});
  b.forEach((v,i)=>{if(!v)return;const n=Math.min(12,Math.log2(v)),x=78+(i%4)*42,y=42+((i/4)|0)*42,pv=pop[i],s=pv<0?1+pv/10:1+pv*.025,col=TC[n],cx=x+19,cy=y+19,w=38*s;
   if(n>=7)X.glow(cx,cy,30,col,.3);X.rr(cx-w/2,cy-w/2+1.5,w,w,5,'rgba(0,0,0,.3)');X.rr(cx-w/2,cy-w/2,w,w,5,X.lg(0,cy-w/2,0,cy+w/2,[X.lt(col,1.15),col,X.lt(col,.85)]));A.c.fillStyle='rgba(255,255,255,.25)';A.c.fillRect(cx-w/2+4,cy-w/2+2,w-8,2);
   if(s>.5)T(v,cx,cy-(v>999?3:5),n<=2?'#6a5a4a':'#ffffff',v>999?1:2,'c');});
  fx.draw();X.panel(110,6,100,22,K.y);T('SCORE '+g.score,160,13,K.y,1,'c');T('ARROWS SLIDE',160,222,K.gr,1,'c');};
 return g;}});

/* ---- MINE FIELD ---- */
A.add({id:'mines',name:'MINE FIELD',cat:'PUZZLE',how:'A DIGS. B FLAGS. NUMBERS = NEARBY MINES. EVERY SAFE CELL SCORES.',make(){
 const g={over:null,score:0},GW=16,GH=10,NM=26,CS=18,OX=16,OY=36,fx=X.fx();let mine=null,open=Array(GW*GH).fill(0),flag=Array(GW*GH).fill(0),c={x:8,y:5},CU=c,t=0,left=GW*GH-NM,boomI=-1;
 const nb=i=>{const o=[],x=i%GW,y=(i/GW)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((dx||dy)&&nx>=0&&ny>=0&&nx<GW&&ny<GH)o.push(ny*GW+nx);}return o;};const cnt=i=>nb(i).filter(j=>mine[j]).length;
 const rev=i=>{const st=[i];let n=0;while(st.length){const j=st.pop();if(open[j]||flag[j])continue;open[j]=1+((Math.abs((j%GW)-(i%GW))+Math.abs(((j/GW)|0)-((i/GW)|0)))*2);left--;n++;if(cnt(j)===0)st.push(...nb(j));}return n;};
 g.update=()=>{if(mine&&!g.over)t++;for(let i=0;i<open.length;i++)if(open[i]>1)open[i]--;const h=A.hit(0);mvCur(h,c,GW,GH);const i=c.y*GW+c.x;if(h.b&&!open[i]){flag[i]^=1;S('blip');if(flag[i])fx.ring(OX+c.x*CS+8.5,OY+c.y*CS+8.5,K.r,12,10);}
  if(h.a&&!flag[i]&&!open[i]){if(!mine){mine=Array(GW*GH).fill(0);const safe=nb(i).concat(i);let n=0;while(n<NM){const j=ri(GW*GH);if(!mine[j]&&!safe.includes(j)){mine[j]=1;n++;}}}
   if(mine[i]){open[i]=1;boomI=i;g.over='BOOM!';S('boom');const x=OX+c.x*CS+8.5,y=OY+c.y*CS+8.5;fx.spark(x,y,K.o,24,3.5);fx.ring(x,y,'#ffffff',40);fx.flash(K.r,12);return;}const n=rev(i);g.score+=n;S('hit');if(n>6)fx.ring(OX+c.x*CS+8.5,OY+c.y*CS+8.5,'#9fd0ff',50,20);if(left===0){g.score+=Math.max(50,1500-(t/60|0)*5);g.over='FIELD CLEARED! WIN';}}};
 const NC=['#4dabff','#3ddc84','#ff4f6d','#9a6aff','#ff9838','#2fd6c3','#ffffff','#aaaaaa'];
 g.draw=()=>{X.cache('minesbg',()=>{X.sky(['#1e2a1a','#121a10']);X.rr(OX-5,OY-5,GW*CS+9,GH*CS+9,5,X.lg(0,OY,0,OY+GH*CS,['#4a5a3a','#2a3420']));});const c=A.c;
  for(let i=0;i<GW*GH;i++){const x=OX+(i%GW)*CS,y=OY+((i/GW)|0)*CS;if(open[i]===1){c.fillStyle=((i%GW)+((i/GW)|0))%2?'#d8c8a0':'#cfbe94';c.fillRect(x,y,CS-1,CS-1);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x,y,CS-1,1);
    if(mine&&mine[i]){c.fillStyle=i===boomI?'#ff4f6d':'#d8c8a0';c.fillRect(x,y,CS-1,CS-1);for(let a=0;a<4;a++)X.stroke([[x+8.5+Math.cos(a*.785)*6,y+8.5+Math.sin(a*.785)*6],[x+8.5-Math.cos(a*.785)*6,y+8.5-Math.sin(a*.785)*6]],'#222',1.2);X.orb(x+8.5,y+8.5,4.2,'#333');}else{const n=cnt(i);if(n)T(n,x+8.5,y+4,NC[n-1],2,'c',1);}}
   else{const pop=open[i]>1?open[i]*.4:0;X.block(x+pop/2,y+pop/2,CS-1-pop,CS-1-pop,((i%GW)+((i/GW)|0))%2?'#5aa040':'#4e9438',2);if(flag[i]){c.fillStyle='#eee';c.fillRect(x+7,y+3,1.2,12);X.poly([[x+8.2,y+3],[x+14,y+6],[x+8.2,y+9]],X.lg(x+8,0,x+14,0,['#ff7080','#d01030']));X.ell(x+8,y+15,3,1,'rgba(0,0,0,.3)');}
    if(g.over&&mine&&mine[i]&&!flag[i])X.orb(x+8.5,y+8.5,3.5,'#333');}}
  if(!g.over)cursor(OX+CU.x*CS-1,OY+CU.y*CS-1,CS+1,CS+1,'#ffcf3f');fx.draw();X.bar('','');X.ot('MINES '+(NM-flag.filter(v=>v).length),6,6,K.r,2);X.ot('TIME '+(t/60|0),W-6,6,K.w,2,'r');T('A DIG   B FLAG',160,222,K.gr,1,'c');};
 return g;}});

/* ---- CRATE PUSHER ---- */
const CRATES=[['#######','#     #','# .$@ #','#     #','#######'],['########','#  .   #','# $$ . #','#  @   #','########'],['#########','#   #   #','# $ # . #','#   $ . #','# @ #   #','#########'],[' #######','##  .  #','# $ #$ #','# .$  .#','##  @ ##',' ###### '],['##########','#  .  #  #','# $$$    #','# .@. #  #','#     #  #','##########']];
A.CRATES=CRATES;
A.add({id:'crates',name:'CRATE PUSHER',cat:'PUZZLE',low:1,how:'PUSH CRATES ONTO SPOTS. B RESETS.',make(){
 const g={over:null,score:0},fx=X.fx();let li=0,m,p,bx,wait=0,face=1,step=0,bump=0;const load=()=>{m=CRATES[li].map(r=>r.split(''));bx=[];m.forEach((r,y)=>r.forEach((ch,x)=>{if(ch==='@'){p={x,y};r[x]=' ';}if(ch==='$'){bx.push({x,y,ox:0,oy:0});r[x]=' ';}if(ch==='*'){bx.push({x,y,ox:0,oy:0});r[x]='.';}}));inside=new Set();const st=[[p.x,p.y]];while(st.length){const[x,y]=st.pop(),k=x+','+y;if(inside.has(k)||!m[y]||m[y][x]===undefined||m[y][x]==='#')continue;inside.add(k);st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}};let inside;load();
 const at=(x,y)=>(m[y]&&m[y][x])||'#',box=(x,y)=>bx.find(b=>b.x===x&&b.y===y);
 g.update=()=>{if(bump)bump--;bx.forEach(b=>{b.ox*=.6;b.oy*=.6;});if(wait>0){if(--wait===0){li++;if(li>=CRATES.length)g.over='ALL CRATES HOME! WIN';else load();}return;}const h=A.hit(0);if(h.b){load();S('lose');return;}
  const d=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:h.d?[0,1]:null;if(!d)return;if(d[0])face=d[0];const nx=p.x+d[0],ny=p.y+d[1];if(at(nx,ny)==='#'){bump=6;return;}const b=box(nx,ny);if(b){if(at(nx+d[0],ny+d[1])==='#'||box(nx+d[0],ny+d[1])){bump=6;return;}b.x+=d[0];b.y+=d[1];b.ox=-d[0]*22;b.oy=-d[1]*22;S('hit');if(at(b.x,b.y)==='.'){b.glow=20;S('coin');}}else S('blip');p.x=nx;p.y=ny;step++;g.score++;
  if(bx.every(b=>at(b.x,b.y)==='.')){wait=60;S('score');fx.flash('#ffffff',8);}};
 g.draw=()=>{const CS=22,ox=160-m[0].length*CS/2,oy=130-m.length*CS/2,c=A.c;X.cache('cratesbg',()=>{X.sky(['#2a2438','#16121e']);X.vignette(.5);});
  m.forEach((r,y)=>r.forEach((ch,x)=>{const X0=ox+x*CS,Y0=oy+y*CS;if(ch!=='#'&&inside.has(x+','+y)){if(ch===' '||ch==='.'){c.fillStyle=(x+y)%2?'#5a5468':'#524c60';c.fillRect(X0,Y0,CS,CS);c.fillStyle='rgba(0,0,0,.15)';c.fillRect(X0,Y0,CS,1);c.fillRect(X0,Y0,1,CS);}}}));
  m.forEach((r,y)=>r.forEach((ch,x)=>{const X0=ox+x*CS,Y0=oy+y*CS;if(ch==='.'){const pu=Math.sin(A.t*.1+x+y)*.5+.5;X.glow(X0+11,Y0+11,12,K.y,.2+pu*.15);c.strokeStyle='#ffcf3f';c.lineWidth=1.5;c.beginPath();c.arc(X0+11,Y0+11,5,0,6.283);c.stroke();X.disc(X0+11,Y0+11,1.8,'#ffcf3f');}}));
  m.forEach((r,y)=>r.forEach((ch,x)=>{const X0=ox+x*CS,Y0=oy+y*CS;if(ch==='#'){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(X0+3,Y0+3,CS,CS);c.fillStyle=X.lg(0,Y0,0,Y0+CS,['#9a7ad8','#6a4fb5']);c.fillRect(X0,Y0,CS,CS);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(X0,Y0+7,CS,1);c.fillRect(X0,Y0+14,CS,1);c.fillRect(X0+((y%2)?6:14),Y0,1,7);c.fillRect(X0+((y%2)?14:6),Y0+7,1,7);c.fillRect(X0+((y%2)?6:14),Y0+14,1,8);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(X0,Y0,CS,1.5);}}));
  bx.forEach(b=>{const X0=ox+b.x*CS+b.ox+2,Y0=oy+b.y*CS+b.oy+2,on=at(b.x,b.y)==='.',s=CS-4;if(on)X.glow(X0+s/2,Y0+s/2,18,K.g,.35);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(X0+2,Y0+2,s,s);c.fillStyle=X.lg(0,Y0,0,Y0+s,on?['#a0ffb8','#3ddc84','#1a8a4a']:['#e8b070','#c8853a','#8a5a24']);c.fillRect(X0,Y0,s,s);c.strokeStyle=on?'#0e5a2e':'#5a3a14';c.lineWidth=1.4;c.strokeRect(X0+1,Y0+1,s-2,s-2);c.beginPath();c.moveTo(X0+2,Y0+2);c.lineTo(X0+s-2,Y0+s-2);c.moveTo(X0+s-2,Y0+2);c.lineTo(X0+2,Y0+s-2);c.stroke();});
  const bo=bump?Math.sin(bump)*1.5:0;A.person(ox+p.x*CS+11+bo,oy+p.y*CS+19,{s:.55,c:'#2fd6c3',pants:'#3a3a5a',cap:'#ffcf3f',st:step*1.2,d:face,id:2,arm1:-1.2*face,arm2:-1.2*face});
  fx.draw();X.bar('ROOM '+(li+1)+'/'+CRATES.length,'MOVES '+g.score,'',K.w,K.y);if(wait)X.ot('ROOM CLEAR!',160,28,K.g,2,'c');T('B RESET',160,226,K.gr,1,'c');};
 return g;}});

/* ---- MEMORY MATCH ---- */
A.add({id:'memory',name:'MEMORY MATCH',cat:'BOARD',vs:1,how:'FLIP 2. MATCH = SCORE + GO AGAIN.',make(){
 const g={over:null,score:0},GW=5,GH=4,fx=X.fx();let cards=[],c={x:0,y:0},CU=c,p=0,pick=[],sc=[0,0],wait=0,seen={},think=0;
 for(let i=0;i<10;i++)cards.push({v:i,f:0},{v:i,f:0});cards.sort(()=>Math.random()-.5);
 const flip=i=>{if(cards[i].up||cards[i].gone||pick.length>=2)return;cards[i].up=1;pick.push(i);S('blip');if(Math.random()<A.ai+.15||!A.cpu)seen[i]=cards[i].v;if(pick.length===2)wait=55;};
 const cxy=i=>[50+(i%GW)*46+20,36+((i/GW)|0)*46+20];
 g.update=()=>{cards.forEach(q=>{const tg=q.up?1:0;q.f+=(tg-q.f)*.25;if(q.gone)q.g=(q.g||0)+1;});if(wait>0){if(--wait===0){const[a,b]=pick;if(cards[a].v===cards[b].v){cards[a].gone=cards[b].gone=1;sc[p]++;S('score');[a,b].forEach(j=>{const[x,y]=cxy(j);fx.spark(x,y,p?'#ff4f9a':'#2fd6c3',10,2.5);fx.ring(x,y,'#ffffff',22);});if(cards.every(q=>q.gone)){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}else{cards[a].up=cards[b].up=0;p=1-p;S('lose');}pick=[];think=0;}return;}
  if(A.cpu&&p===1){if(++think<35)return;think=0;const live=cards.map((q,i)=>i).filter(i=>!cards[i].gone&&!cards[i].up),known=live.filter(i=>i in seen);let ch=-1;
   if(pick.length===1){ch=known.find(i=>seen[i]===cards[pick[0]].v&&i!==pick[0]);}else{for(const i of known){const j=known.find(j=>j!==i&&seen[j]===seen[i]);if(j!==undefined){ch=i;break;}}}
   if(ch===undefined||ch<0){const unk=live.filter(i=>!(i in seen));ch=(unk.length?unk:live)[ri((unk.length?unk:live).length)];}c.x=ch%GW;c.y=(ch/GW)|0;flip(ch);return;}
  const h=A.hit(human(p));mvCur(h,c,GW,GH);if(h.a)flip(c.y*GW+c.x);};
 const CO=['#ff4f6d','#ff9838','#ffcf3f','#3ddc84','#2fd6c3','#4dabff','#c86dff','#ff7fd0','#a0e040','#d08a4a'];
 const sym=(s,cx,cy)=>{const col=CO[s],c=A.c;X.glow(cx,cy,16,col,.25);if(s%5===0)X.orb(cx,cy,9,col);else if(s%5===1)X.block(cx-9,cy-9,18,18,col,3);else if(s%5===2)X.poly([[cx,cy-11],[cx+11,cy+9],[cx-11,cy+9]],X.lg(0,cy-11,0,cy+9,[X.lt(col,1.4),col]));else if(s%5===3)X.gem(cx,cy,22,col);else{const pts=[];for(let i=0;i<10;i++){const r=i%2?4.5:11,a=i*.628-1.57;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}X.poly(pts,X.lg(0,cy-11,0,cy+11,[X.lt(col,1.4),col]));}T('ABCDEFGHIJ'[s],cx+13,cy+10,'#555',1,'c');};
 g.draw=()=>{X.cache('membg',()=>{X.sky(['#2a1a4a','#140c2a']);X.glow(160,120,150,'#6a3aff',.15);});const c=A.c;
  cards.forEach((q,i)=>{if(q.gone&&(q.g||0)>20)return;const[cx,cy]=cxy(i),sx=Math.abs(Math.cos(q.f*3.1416)),front=q.f>.5,gs=q.gone?1+(q.g||0)*.03:1;c.save();c.translate(cx,cy);if(q.gone)c.globalAlpha=Math.max(0,1-(q.g||0)/20);c.scale(Math.max(.05,sx)*gs,gs);X.rr(-20,-18,40,40,5,'rgba(0,0,0,.35)');
   if(front){X.rr(-20,-20,40,40,5,X.lg(0,-20,0,20,['#ffffff','#e8e4f0']));c.restore();c.save();c.translate(cx,cy);if(q.gone)c.globalAlpha=Math.max(0,1-(q.g||0)/20);c.scale(Math.max(.05,sx)*gs,gs);sym(q.v,0,0);}
   else{X.rr(-20,-20,40,40,5,X.lg(0,-20,0,20,['#5a6aff','#2b3bd6','#1a2490']));c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;c.strokeRect(-15,-15,30,30);X.gem(0,0,14,'#9fb0ff');}c.restore();c.globalAlpha=1;});
  if(!(A.cpu&&p===1))cursor(48+CU.x*46,34+CU.y*46,44,44,p?'#ff4f9a':'#2fd6c3');fx.draw();X.bar();A.hud2(sc[0],sc[1]);turnTag(A.nm(p)+' TO FLIP',p?K.p:K.c,222);};
 return g;}});

/* ---- ECHO PADS ---- */
A.add({id:'echo',name:'ECHO PADS',cat:'PUZZLE',how:'WATCH, THEN REPEAT WITH ARROWS.',make(){
 const g={over:null,score:0},P={u:[-2.356,'#3ddc84'],r:[-.785,'#4dabff'],d:[.785,'#ffcf3f'],l:[2.356,'#ff4f6d']},KS=['u','l','r','d'],fx=X.fx(),CX=160,CY=124;let seq=[],ph='show',i=0,t=0,lit='',lt=0;const grow=()=>{seq.push(KS[ri(4)]);ph='show';i=0;t=-30;};grow();
 g.update=()=>{if(lt>0)lt--;else lit='';if(ph==='show'){if(++t>=Math.max(14,34-seq.length)){t=0;if(i<seq.length){lit=seq[i++];lt=Math.max(9,22-seq.length);S(['blip','hit','coin','jump'][KS.indexOf(lit)]);}else{ph='in';i=0;}}}
  else{const h=A.hit(0);for(const k of KS)if(h[k]){lit=k;lt=10;if(k===seq[i]){S(['blip','hit','coin','jump'][KS.indexOf(k)]);const a=P[k][0]+1.5708*.5-.785;if(++i>=seq.length){g.score=seq.length;fx.ring(CX,CY,'#ffffff',90,22);fx.pop(CX,CY-6,'ROUND '+(seq.length+1),K.y);grow();}}else{g.over='WRONG PAD';fx.flash(K.r,12);S('boom');}break;}}};
 g.draw=()=>{X.cache('echobg',()=>{X.sky(['#140c2a','#0a0618']);X.glow(CX,CY,120,'#5a3aff',.2);X.disc(CX,CY+4,96,'rgba(0,0,0,.45)');X.disc(CX,CY,94,X.lg(0,CY-94,0,CY+94,['#4a4a5a','#1a1a24']));});const c=A.c;
  for(const k of KS){const[a,col]=P[k],on=lit===k;c.beginPath();c.arc(CX,CY,86,a-.72,a+.72);c.arc(CX,CY,34,a+.72,a-.72,true);c.closePath();c.fillStyle=on?X.rg(CX,CY,30,CX,CY,90,[X.lt(col,1.6),col]):X.rg(CX,CY,30,CX,CY,90,[X.lt(col,.55),X.lt(col,.35)]);c.fill();c.strokeStyle='rgba(255,255,255,'+(on?.6:.12)+')';c.lineWidth=1;c.stroke();
   const mx=CX+Math.cos(a)*60,my=CY+Math.sin(a)*60;if(on){X.glow(mx,my,50,col,.6);}const ar={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[k];const bx=CX+Math.cos(a)*60,by=CY+Math.sin(a)*60;X.poly([[bx+ar[0]*6,by+ar[1]*6],[bx-ar[1]*5-ar[0]*3,by+ar[0]*5-ar[1]*3],[bx+ar[1]*5-ar[0]*3,by-ar[0]*5-ar[1]*3]],on?'#ffffff':'rgba(255,255,255,.3)');}
  X.disc(CX,CY,32,X.lg(0,CY-32,0,CY+32,['#3a3a4a','#121218']));A.ring(CX,CY,32,'rgba(255,255,255,.2)');T(seq.length,CX,CY-9,K.y,3,'c');T(ph==='show'?'WATCH':'REPEAT',CX,CY+10,ph==='show'?K.c:K.g,1,'c');
  if(ph==='in'){for(let j=0;j<seq.length&&j<20;j++)X.disc(CX-(Math.min(seq.length,20)-1)*4+j*8,226,2.4,j<i?'#3ddc84':'rgba(255,255,255,.25)');}fx.draw();X.bar('ROUND '+seq.length,'');};
 return g;}});

/* ---- LIGHTS OUT ---- */
A.add({id:'lights',name:'LIGHTS OUT',cat:'PUZZLE',how:'A FLIPS A LAMP + NEIGHBOURS. ALL OFF WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let b,c={x:2,y:2},lvl=0,time=10800,fl=Array(25).fill(0);const tog=(x,y)=>{[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const X_=x+d[0],Y=y+d[1];if(X_>=0&&Y>=0&&X_<5&&Y<5){b[Y*5+X_]^=1;fl[Y*5+X_]=8;}});};
 const build=()=>{lvl++;b=Array(25).fill(0);do{for(let i=0;i<2+lvl;i++)tog(ri(5),ri(5));}while(!b.some(v=>v));fl.fill(0);};build();
 g.update=()=>{fl=fl.map(v=>v?v-1:0);const h=A.hit(0);mvCur(h,c,5,5);if(h.a){tog(c.x,c.y);S('hit');if(!b.some(v=>v)){g.score+=100;S('score');fx.flash('#fff3c0',8);fx.pop(160,120,'BOARD CLEAR +100',K.y);build();}}if(--time<=0)g.over='TIME UP';};
 g.draw=()=>{X.cache('lightsbg',()=>{X.sky(['#1a1430','#0a0818']);X.rr(64,34,192,192,8,X.lg(0,34,0,226,['#3a3450','#1e1a2c']));for(let i=0;i<25;i++)X.rr(70+(i%5)*36,40+((i/5)|0)*36,32,32,5,'#141020');});
  b.forEach((v,i)=>{const x=70+(i%5)*36+16,y=40+((i/5)|0)*36+16,f=fl[i]/8;if(v){X.glow(x,y,30,'#ffcf3f',.35+f*.2);X.disc(x,y,12,X.rg(x-3,y-4,1,x,y,12,['#fffbe0','#ffe070','#e8a020']));X.ell(x-4,y-5,4,2.5,'rgba(255,255,255,.7)',-.5);}else{X.disc(x,y,12,X.rg(x-3,y-4,1,x,y,12,['#5a5470','#2e2a40','#1a1628']));X.ell(x-4,y-5,4,2.5,'rgba(255,255,255,.12)',-.5);}if(f)A.ring(x,y,12+(1-f)*6,X.rgba('#ffffff',f*.6));});
  cursor(68+c.x*36,38+c.y*36,36,36,'#ff4f9a');fx.draw();X.bar('BOARDS '+(lvl-1),'TIME '+Math.ceil(time/60),'LIT '+b.filter(v=>v).length);};
 return g;}});
})();
