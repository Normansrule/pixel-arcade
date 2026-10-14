(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),lo=()=>A.gfx!=='off';
const cur2=(x,y,w,h,col)=>{const p=1+Math.sin(A.t*.15)*.8;X.glow(x+w/2,y+h/2,Math.max(w,h)*.8,col||'#ffcf3f',.15);X.rrs(x-p,y-p,w+2*p,h+2*p,3,col||'#ffcf3f',1.5);};
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};

/* ---- PIPE FLOW ---- */
A.add({id:'pipes',name:'PIPE FLOW',cat:'PUZZLE',how:'A ROTATES A PIPE. CONNECT LEFT TAP TO RIGHT DRAIN.',make(){
 const g={over:null,score:0},N=6,fx=X.fx();let b,c={x:0,y:0},lvl=0,time=0,fl=[],rot={};
 const gen=()=>{lvl++;b=[];let path=[];let x=0,y=ri(N);path.push([x,y]);while(x<N-1){const r=Math.random();let nx=x,ny=y;if(r<.5)nx++;else if(r<.75&&y>0)ny--;else if(y<N-1)ny++;else nx++;if(path.some(p=>p[0]===nx&&p[1]===ny))continue;x=nx;y=ny;path.push([x,y]);}
  for(let i=0;i<N*N;i++)b.push({t:ri(2),r:ri(4)});path.forEach((p,i)=>{const cell=b[p[1]*N+p[0]];const prev=i?path[i-1]:[p[0]-1,p[1]],next=path[i+1]||[p[0]+1,p[1]];const dIn=[prev[0]-p[0],prev[1]-p[1]],dOut=[next[0]-p[0],next[1]-p[1]];cell.t=(dIn[0]===-dOut[0]&&dIn[1]===-dOut[1])?0:1;cell.r=ri(4);});g.start=path[0][1];g.end=path[path.length-1][1];time=0;};gen();
 const ports=cell=>{const s=cell.t===0?[[1,0],[-1,0]]:[[1,0],[0,-1]];return s.map(d=>{for(let i=0;i<cell.r;i++)d=[-d[1],d[0]];return d;});};
 const trace=()=>{fl=[];let x=0,y=g.start,from=[-1,0],n=0;while(n++<40){if(x<0||y<0||x>=N||y>=N)return false;const cell=b[y*N+x],ps=ports(cell);const inD=[-from[0],-from[1]];const has=ps.find(d=>d[0]===inD[0]&&d[1]===inD[1]);if(!has)return false;fl.push(y*N+x);const out=ps.find(d=>!(d[0]===inD[0]&&d[1]===inD[1]));if(x===N-1&&y===g.end&&out[0]===1)return true;x+=out[0];y+=out[1];from=out;}return false;};trace();
 const CS=28,OX=76,OY=36;
 g.update=()=>{time++;for(const k in rot)if(rot[k]>0)rot[k]--;const h=A.hit(0);mvCur(h,c,N,N);if(h.l||h.r||h.u||h.d)S('blip');if(h.a){b[c.y*N+c.x].r=(b[c.y*N+c.x].r+1)%4;rot[c.y*N+c.x]=6;S('hit');if(trace()){g.score+=Math.max(20,200-(time/60|0)*5);S('score');fx.flash('#9fd8ff',8);fx.spark(OX+N*CS+7,OY+g.end*CS+14,'#4dabff',16,3);fx.pop(160,24,'FLOWING!',K.b);if(lvl>=6)g.over='ALL PIPES FLOW! WIN';else{gen();trace();}}}};
 g.draw=()=>{const cx=A.c;X.cache('pipes_bg',()=>{X.vg(0,0,W,H,['#2a2a3a','#14141e']);X.rr(OX-6,OY-6,N*CS+12,N*CS+12,6,X.lg(0,OY,0,OY+N*CS,['#4a4a5e','#2a2a3a']));for(let i=0;i<N*N;i++)X.rr(OX+(i%N)*CS+1,OY+((i/N)|0)*CS+1,CS-2,CS-2,3,'#1e1e2a');});
  X.block(OX-18,OY+g.start*CS+7,18,14,'#4a6a9a',3);X.glow(OX-8,OY+g.start*CS+14,10,'#4dabff',.5);X.block(OX+N*CS,OY+g.end*CS+7,18,14,'#5a5a6a',3);X.disc(OX+N*CS+9,OY+g.end*CS+14,3.5,'#111');
  b.forEach((cell,i)=>{const x=OX+(i%N)*CS+CS/2,y=OY+((i/N)|0)*CS+CS/2,on=fl.includes(i),r=rot[i]||0;cx.save();cx.translate(x,y);cx.rotate(-r*.26);ports(cell).forEach(d=>{const ex=d[0]*CS/2,ey=d[1]*CS/2;cx.strokeStyle='#2a2a34';cx.lineWidth=10;cx.lineCap='butt';cx.beginPath();cx.moveTo(0,0);cx.lineTo(ex,ey);cx.stroke();cx.strokeStyle=on?'#3a8ad8':'#8a8aa0';cx.lineWidth=7;cx.beginPath();cx.moveTo(0,0);cx.lineTo(ex,ey);cx.stroke();cx.strokeStyle=on?'#9fd8ff':'#c8c8d8';cx.lineWidth=2;cx.beginPath();cx.moveTo(-d[1]*1.5,-d[0]*1.5);cx.lineTo(ex-d[1]*1.5,ey-d[0]*1.5);cx.stroke();});X.disc(0,0,5.5,on?'#3a8ad8':'#8a8aa0');X.disc(-1,-1,2,on?'#c8ecff':'#d8d8e8');cx.restore();if(on){const ph=(A.t*.1+fl.indexOf(i)*.6)%1;X.glow(x,y,10,'#4dabff',.25+.15*Math.sin(A.t*.2+i));}});
  cur2(OX+c.x*CS,OY+c.y*CS,CS,CS,'#ffcf3f');fx.draw();X.bar('LEVEL '+lvl+'/6','SCORE '+g.score,'',K.w,K.y);};
 return g;}});

/* ---- COLOR FLOOD ---- */
const room=(key,c1,c2,a1,a2,fn)=>X.cache(key,()=>{X.vg(0,0,W,H,[c1,c2]);X.disc(60,50,170,X.rg(60,50,0,60,50,170,[X.rgba(a1,.26),X.rgba(a1,0)]));X.disc(280,210,170,X.rg(280,210,0,280,210,170,[X.rgba(a2,.2),X.rgba(a2,0)]));const c=A.c;c.fillStyle='rgba(255,255,255,.04)';for(let y=20;y<H;y+=10)for(let x=(y/10%2)*5;x<W;x+=10)c.fillRect(x,y,1.2,1.2);X.vignette(.55);if(fn)fn();});
const tray=(x,y,w,h,col)=>{for(let i=1;i<4;i++)X.rr(x-6+i,y-2+i*3,w+12-2*i,h+8,10,'rgba(0,0,0,.16)');X.rr(x-6,y-6,w+12,h+12,10,X.lg(0,y-6,0,y+h+6,[X.lt(col,1.6),col,X.lt(col,.4)]));X.rrs(x-5.5,y-5.5,w+11,h+11,9.5,'rgba(255,255,255,.22)',1);X.rr(x-1,y-1,w+2,h+2,7,X.lg(0,y,0,y+h,[X.lt(col,.25),X.lt(col,.42)]));A.c.fillStyle='rgba(0,0,0,.35)';A.c.fillRect(x+5,y-1,w-10,2);for(const[sx,sy]of[[x-2,y-2],[x+w+2,y-2],[x-2,y+h+2],[x+w+2,y+h+2]])X.orb(sx,sy,1.8,'#c8c0e0');};
A.add({id:'flood',name:'COLOR FLOOD',cat:'PUZZLE',how:'PICK A COLOUR, A FLOODS FROM THE CORNER. FILL IT IN 22 MOVES.',make(){
 const g={over:null,score:0},N=12,CO=['#ff4f6d','#ffcf3f','#3ddc84','#4dabff','#ff4f9a','#ff9838'],fx=X.fx();let b=[],sel=0,moves=22,wave=Array(N*N).fill(0),own=new Set([0]);for(let i=0;i<N*N;i++)b.push(ri(6));
 const owned=()=>{const s=new Set(),st=[0],v=b[0];while(st.length){const i=st.pop();if(s.has(i)||b[i]!==v)continue;s.add(i);const x=i%N,y=(i/N)|0;if(x>0)st.push(i-1);if(x<N-1)st.push(i+1);if(y>0)st.push(i-N);if(y<N-1)st.push(i+N);}return s;};own=owned();
 g.update=()=>{wave=wave.map(v=>v?v-1:0);const h=A.hit(0);if(h.l)sel=(sel+5)%6;if(h.r)sel=(sel+1)%6;if(h.u)sel=(sel+4)%6;if(h.d)sel=(sel+2)%6;if(h.l||h.r||h.u||h.d)S('blip');if(h.a){const old=b[0];if(old===sel){S('lose');A.shake=3;return;}const was=own.size,st=[0];while(st.length){const i=st.pop();if(b[i]!==old)continue;b[i]=sel;const x=i%N,y=(i/N)|0;wave[i]=6+((x+y)%6);if(x>0)st.push(i-1);if(x<N-1)st.push(i+1);if(y>0)st.push(i-N);if(y<N-1)st.push(i+N);}moves--;S('hit');own=owned();const gain=own.size-was;g.score=Math.max(g.score,Math.floor(own.size/N/N*100));
   if(gain>0){let n=0;own.forEach(i=>{if(wave[i]===0&&n<14&&(i*7)%3===0){n++;A.burst(70+(i%N)*15+7,30+((i/N)|0)*15+7,CO[sel],2,1.4);}});fx.pop(96,40,'+'+gain,'#ffffff');if(gain>=10)A.shake=3;}
   if(own.size>N*N*.5&&moves%5===0)fx.pop(160,24,Math.round(own.size/N/N*100)+'%',K.y);if(b.every(v=>v===b[0])){g.score=100+moves*10+10;g.over='FLOODED! WIN';S('win');fx.flash('#ffffff',8);A.confetti();A.shake=6;}else if(moves<=0)g.over='OUT OF MOVES';}};
 g.draw=()=>{room('flood_bg2','#221a44','#07050f','#4dabff','#ff4f9a',()=>{tray(64,24,192,192,'#4a4270');X.panel(264,40,52,112,'#ffffff');X.panel(4,40,54,58,'#3ddc84');});
  const fr=own.size/N/N;
  b.forEach((v,i)=>{const x=70+(i%N)*15,y=30+((i/N)|0)*15,wv=wave[i],w=wv?1+wv*.025:1,col=CO[v],o=own.has(i);X.rr(x+7-7*w,y+7-7*w,14*w,14*w,3,X.lg(0,y,0,y+14,[X.lt(col,o?1.45:1.3),col,X.lt(col,o?.85:.7)]));A.c.fillStyle='rgba(255,255,255,'+(o?.42:.28)+')';A.c.fillRect(x+3,y+1.5,8,1.2);if(o)X.rrs(x+.5,y+.5,13,13,3,'rgba(255,255,255,'+(.3+.15*Math.sin(A.t*.12)).toFixed(2)+')',1);if(wv){A.c.fillStyle='rgba(255,255,255,'+(wv/16).toFixed(2)+')';A.c.fillRect(x+1,y+1,12,12);}});
  X.glow(77,37,10+Math.sin(A.t*.12)*2,'#ffffff',.5);X.disc(77,37,2.5,'#ffffff');
  CO.forEach((col,i)=>{const x=267+(i%2)*24,y=50+((i/2)|0)*28,s=i===sel,cur=i===b[0],bob=s?Math.sin(A.t*.18)*1.2:0;if(s)X.glow(x+11,y+11,20,col,.45);X.block(x,y+bob,22,22,cur?X.lt(col,.45):col,5);if(s)X.rrs(x-2,y-2+bob,26,26,6,'#ffffff',1.5);if(cur)T('X',x+11,y+8,'rgba(255,255,255,.5)',1,'c');});
  T('A FLOOD',290,138,K.gr,1,'c');T('FILLED',31,46,K.gr,1,'c');X.ot(Math.round(fr*100)+'%',31,58,'#7dffb0',2,'c');X.meter(10,82,42,6,fr,'#3ddc84');
  fx.draw();X.bar('MOVES '+moves,'','',moves<5?K.r:K.w);X.meter(110,6,100,6,fr,'#3ddc84');};
 return g;}});

/* ---- GEM SWAP ---- */
A.add({id:'gems',name:'GEM SWAP',cat:'PUZZLE',how:'A GRABS A GEM, ARROW SWAPS IT. MATCH 3+. 60 SEC.',make(){
 const g={over:null,score:0},N=8,CO=['#ff4f6d','#ffcf3f','#3ddc84','#4dabff','#ff4f9a','#2fd6c3'],fx=X.fx();let b=[],c={x:3,y:3},CU=c,hold=false,time=3600,anim=0,combo=0,drop=Array(64).fill(0);
 const matches=()=>{const m=new Set();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=b[y*N+x];if(v<0)continue;if(x<N-2&&b[y*N+x+1]===v&&b[y*N+x+2]===v){m.add(y*N+x);m.add(y*N+x+1);m.add(y*N+x+2);}if(y<N-2&&b[(y+1)*N+x]===v&&b[(y+2)*N+x]===v){m.add(y*N+x);m.add((y+1)*N+x);m.add((y+2)*N+x);}}return m;};
 for(let i=0;i<N*N;i++)b.push(ri(6));let m;while((m=matches()).size)m.forEach(i=>b[i]=ri(6));
 const settle=()=>{for(let x=0;x<N;x++){let w=N-1;for(let y=N-1;y>=0;y--)if(b[y*N+x]>=0){if(w!==y)drop[w*N+x]=(w-y)*25;b[w--*N+x]=b[y*N+x];}while(w>=0){drop[w*N+x]=(w+2)*25;b[w--*N+x]=ri(6);}}};
 g.update=()=>{drop=drop.map(v=>Math.max(0,v*.7-1));time--;if(time<=0){g.over='TIME UP';return;}if(anim>0){if(--anim===0){const m=matches();if(m.size){combo++;g.score+=m.size*10*combo;m.forEach(i=>{fx.spark(74+(i%N)*25,34+((i/N)|0)*25,CO[b[i]],5,2.2);b[i]=-1;});if(combo>1)fx.pop(160,24,'COMBO x'+combo,K.y);settle();anim=12;S('coin');}else combo=0;}return;}
  const h=A.hit(0);if(hold){const dx=ax(h),dy=dx?0:ay(h);if(dx||dy){const nx=c.x+dx,ny=c.y+dy;if(nx>=0&&ny>=0&&nx<N&&ny<N){const i=c.y*N+c.x,j=ny*N+nx;[b[i],b[j]]=[b[j],b[i]];if(matches().size){anim=6;c.x=nx;c.y=ny;S('hit');}else{[b[i],b[j]]=[b[j],b[i]];S('lose');}}hold=false;}else if(h.a||h.b)hold=false;}
  else{mvCur(h,c,N,N);if(h.l||h.r||h.u||h.d)S('blip');if(h.a){hold=true;S('blip');}}};
 const gem=(x,y,v)=>{const col=CO[v],c=A.c;if(v%3===0)X.orb(x,y,9,col);else if(v%3===1){X.poly([[x-8,y-4],[x-4,y-9],[x+4,y-9],[x+8,y-4],[x+8,y+4],[x+4,y+9],[x-4,y+9],[x-8,y+4]],X.lg(x-8,y-9,x+8,y+9,[X.lt(col,1.6),col,X.lt(col,.55)]));X.poly([[x-4,y-6],[x+4,y-6],[x+5,y-2],[x-5,y-2]],'rgba(255,255,255,.4)');}else X.gem(x,y,20,col);};
 g.draw=()=>{X.cache('gems_bg',()=>{X.sky(['#1a1036','#0a0618']);X.glow(160,120,130,'#6a3aff',.18);X.rr(58,18,204,204,8,X.lg(0,18,0,222,['#3a2a6a','#20163e']));for(let i=0;i<64;i++)if(((i%N)+((i/N)|0))%2)X.rr(62+(i%N)*25,22+((i/N)|0)*25,24,24,3,'rgba(255,255,255,.04)');});
  b.forEach((v,i)=>{if(v<0)return;const x=74+(i%N)*25,y=34+((i/N)|0)*25-drop[i];if(y<10)return;gem(x,y,v);});
  cur2(60+CU.x*25,20+CU.y*25,25,25,hold?'#ffffff':'#ffcf3f');if(hold){for(const d of[[1,0],[-1,0],[0,1],[0,-1]])X.disc(72+CU.x*25+d[0]*16,32+CU.y*25+d[1]*16,1.6,'#ffffff');}
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);};
 return g;}});

/* ---- MAZE DASH ---- */
A.add({id:'maze',name:'MAZE DASH',cat:'PUZZLE',how:'FIND THE EXIT. EACH MAZE IS BIGGER. BEAT THE CLOCK.',make(){
 const g={over:null,score:0},fx=X.fx();let N,m,p,ex,lvl=0,time=0,tmax=1,mv=0,pp={x:1,y:1},trail=[],gems=[],dir=[1,0],sq=0,intro=0;
 let mid=0;const build=()=>{lvl++;mid=Math.random()*1e9|0;N=Math.min(9+lvl*2,25);m=[];for(let y=0;y<N;y++)m.push(Array(N).fill(1));const st=[[1,1]];m[1][1]=0;while(st.length){const c=st[st.length-1],ds=[[2,0],[-2,0],[0,2],[0,-2]].filter(d=>{const x=c[0]+d[0],y=c[1]+d[1];return x>0&&y>0&&x<N-1&&y<N-1&&m[y][x];});if(!ds.length){st.pop();continue;}const d=ds[ri(ds.length)];m[c[1]+d[1]/2][c[0]+d[0]/2]=0;m[c[1]+d[1]][c[0]+d[0]]=0;st.push([c[0]+d[0],c[1]+d[1]]);}p={x:1,y:1};pp={x:1,y:1};trail=[];ex=[N-2,N-2];time=tmax=(20+N*2)*60;intro=24;
  const de=[];for(let y=1;y<N-1;y+=2)for(let x=1;x<N-1;x+=2)if((x>1||y>1)&&(x!==ex[0]||y!==ex[1])&&[m[y][x-1],m[y][x+1],m[y-1][x],m[y+1][x]].filter(v=>v).length===3)de.push([x,y]);gems=[];for(let k=Math.min(2+lvl,6);k>0&&de.length;k--)gems.push(de.splice(ri(de.length),1)[0].concat(rnd(6)));};build();
 g.update=()=>{time--;if(mv>0)mv--;if(sq>0)sq--;if(intro>0)intro--;const k=A.in(0);if(mv===0){pp={x:p.x,y:p.y};const dx=ax(k),dy=dx?0:ay(k);if((dx||dy)&&!m[p.y+dy][p.x+dx]){trail.push([p.x,p.y]);if(trail.length>30)trail.shift();p.x+=dx;p.y+=dy;mv=4;dir=[dx,dy];sq=4;}}
  const CS=Math.floor(200/N),OX=160-N*CS/2,OY=122-N*CS/2,cx=q=>OX+q*CS+CS/2,cy=q=>OY+q*CS+CS/2;
  for(let i=gems.length-1;i>=0;i--){const q=gems[i];if(q[0]===p.x&&q[1]===p.y){gems.splice(i,1);g.score+=25;S('coin');fx.spark(cx(q[0]),cy(q[1]),'#7ff6ff',10,2);fx.ring(cx(q[0]),cy(q[1]),'#7ff6ff',CS*1.4,14);fx.pop(cx(q[0]),cy(q[1])-CS,'+25','#7ff6ff');}}
  if(A.t%5===0)fx.spark(cx(ex[0]),cy(ex[1]),'#7dffb0',1,.7);
  if(p.x===ex[0]&&p.y===ex[1]){const pts=100+(time/60|0)*5;g.score+=pts;S('win');fx.flash('#3ddc84',8);fx.ring(cx(ex[0]),cy(ex[1]),'#7dffb0',60,22);A.burst(cx(ex[0]),cy(ex[1]),'#7dffb0',24,3);A.shake=6;fx.pop(160,120,'+'+pts,K.y);build();}if(time<=0)g.over='LOST IN THE MAZE';};
 g.draw=()=>{const CS=Math.floor(200/N),OX=160-N*CS/2,OY=122-N*CS/2,c=A.c,MW=N*CS;
  X.cache('maze_bg'+lvl+'_'+mid,()=>{const c=A.c;X.sky(['#170e34','#0b0720','#05030e']);X.stars(70,lvl,0,0,H,.7);X.glow(160,122,180,'#6a3aff',.22);X.glow(60,40,90,'#ff4f9a',.08);
   X.rr(OX-6,OY-3,MW+12,MW+12,6,'rgba(0,0,0,.55)');X.rr(OX-6,OY-7,MW+12,MW+12,6,X.lg(0,OY-7,0,OY+MW+5,['#4a3a86','#2a1e58','#160f34']));X.rrs(OX-5.5,OY-6.5,MW+11,MW+11,6,'rgba(200,180,255,.35)',1);
   const wg=X.lg(OX,OY,OX+MW,OY+MW,['#b49cf8','#8a68e0','#6a48c8','#5232a8']),w=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&m[y][x],d=Math.max(1.5,CS*.32);
   m.forEach((row,y)=>row.forEach((v,x)=>{if(v)return;const X0=OX+x*CS,Y0=OY+y*CS,h=((x*73856093)^(y*19349663))>>>0;c.fillStyle=(x+y)%2?'#231a44':'#271d4c';c.fillRect(X0,Y0,CS,CS);c.fillStyle='rgba(255,255,255,.035)';c.fillRect(X0,Y0,CS,1);c.fillStyle='rgba(0,0,0,.28)';c.fillRect(X0,Y0+CS-.6,CS,.6);c.fillRect(X0+CS-.6,Y0,.6,CS);if(CS>9){c.fillStyle='rgba(160,140,255,.07)';c.fillRect(X0+h%(CS-3)+1,Y0+(h>>5)%(CS-3)+1,1.5,1);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(X0+(h>>9)%(CS-3)+1,Y0+(h>>13)%(CS-3)+1,1,1);}
    if(w(x-1,y)){c.fillStyle='rgba(0,0,0,.32)';c.fillRect(X0,Y0,CS*.3,CS);}if(w(x,y-1)){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(X0,Y0,CS,CS*.22);}}));
   m.forEach((row,y)=>row.forEach((v,x)=>{if(!v)return;const X0=OX+x*CS,Y0=OY+y*CS,fb=!w(x,y+1)&&y+1<N,th=fb?CS-d:CS;
    if(fb){c.fillStyle=X.lg(0,Y0+th,0,Y0+CS,['#3a2478','#1c1040']);c.fillRect(X0,Y0+th,CS,d);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(X0,Y0+CS-.7,CS,.7);if(CS>10){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(X0+((x%2)?CS/2:CS/4),Y0+th,.6,d);}}
    c.fillStyle=wg;c.fillRect(X0,Y0,CS,th);
    if(!w(x,y-1)&&y>0){c.fillStyle='rgba(225,210,255,.75)';c.fillRect(X0,Y0,CS,.9);}if(!w(x-1,y)&&x>0){c.fillStyle='rgba(225,210,255,.45)';c.fillRect(X0,Y0,.9,th);}if(!w(x+1,y)&&x<N-1){c.fillStyle='rgba(20,8,60,.55)';c.fillRect(X0+CS-.9,Y0,.9,th);}
    if(fb){c.fillStyle='rgba(190,160,255,.55)';c.fillRect(X0,Y0+th-.8,CS,.8);}}));
   X.vignette(.35);});
  const t=mv?1-mv/4:1,px=OX+(pp.x+(p.x-pp.x)*t)*CS+CS/2,py=OY+(pp.y+(p.y-pp.y)*t)*CS+CS/2,LR=Math.max(46,CS*4);
  c.fillStyle=X.rg(px,py,LR*.35,px,py,LR*2.3,['rgba(4,2,14,0)','rgba(4,2,14,.35)','rgba(4,2,14,.7)']);c.fillRect(0,0,W,H);
  trail.forEach((q,i)=>{const f=i/trail.length;X.glow(OX+q[0]*CS+CS/2,OY+q[1]*CS+CS/2,CS*.5,'#ffcf3f',.25*f);X.disc(OX+q[0]*CS+CS/2,OY+q[1]*CS+CS/2,CS*.12*(.4+f),X.rgba('#ffe08a',.55*f));});
  gems.forEach(q=>{const gx=OX+q[0]*CS+CS/2,gy=OY+q[1]*CS+CS/2,bb=Math.sin(A.t*.1+q[2])*CS*.08;X.glow(gx,gy,CS*1.1,'#4ff0ff',.3+.12*Math.sin(A.t*.15+q[2]));X.shadow(gx,gy+CS*.3,CS*.22,CS*.08,.4);X.gem(gx,gy-CS*.05+bb,Math.max(4,CS*.62),'#4fd8ff');if((A.t+q[2]*10|0)%40<6)X.disc(gx+CS*.18,gy-CS*.22+bb,.8,'#ffffff');});
  const exx=OX+ex[0]*CS+CS/2,exy=OY+ex[1]*CS+CS/2,pu=.5+.5*Math.sin(A.t*.15),pr=CS*.46;X.glow(exx,exy,CS*2.2,'#3ddc84',.35+pu*.2);X.disc(exx,exy,pr,X.rg(exx,exy,0,exx,exy,pr,['#eafff0','#5dffa0','#0f6a3a','#03200f']));
  for(let k=0;k<3;k++){c.strokeStyle=X.rgba(k===1?'#b0ffcf':'#3ddc84',.75);c.lineWidth=k===1?1.2:.8;c.beginPath();const a0=A.t*(.08+k*.03)*(k%2?-1:1)+k*2;c.arc(exx,exy,pr*(.5+k*.22),a0,a0+3.6);c.stroke();}
  for(let k=0;k<5;k++){const a=A.t*.05+k*1.2566;X.disc(exx+Math.cos(a)*pr*1.15,exy+Math.sin(a)*pr*1.15,.9,'#d8ffe6');}
  const s=sq/4,sx=1+(dir[0]?s*.3:-s*.15),sy=1+(dir[1]?s*.3:-s*.15),r=Math.max(2.4,CS*.38);X.glow(px,py,CS*1.6,'#ffcf3f',.45);X.shadow(px+1,py+r*.75,r*.9,r*.3,.45);c.save();c.translate(px,py);c.scale(sx,sy);X.orb(0,0,r,'#ffc23a');if(r>3.5){const ex2=dir[0]*r*.28,ey2=dir[1]*r*.28;X.disc(ex2-r*.28,ey2-r*.05,r*.17,'#2a1600');X.disc(ex2+r*.28,ey2-r*.05,r*.17,'#2a1600');}c.restore();
  if(time<300&&(A.t>>3)%2)X.vg(0,0,W,H,['rgba(255,40,60,.12)','rgba(255,40,60,0)','rgba(255,40,60,.12)']);
  if(intro>0){c.globalAlpha=Math.min(1,intro/12);X.panel(110,104,100,26,'#a58cf0');X.ot('MAZE '+lvl,160,112,'#ffffff',2,'c');c.globalAlpha=1;}
  fx.draw();X.bar('MAZE '+lvl,''+Math.ceil(time/60),'SCORE '+g.score,K.w,time<300?K.r:K.w);X.meter(110,13,100,3,time/tmax,time<300?'#ff4f6d':'#3ddc84');};
 return g;}});

/* ---- TOWER OF HANOI ---- */
A.add({id:'hanoi',name:'TOWER OF HANOI',cat:'PUZZLE',low:1,how:'A LIFTS THE TOP DISC, A DROPS IT. SMALLER ON BIGGER ONLY. MOVE THE TOWER RIGHT.',make(){
 const g={over:null,score:0},N=5,fx=X.fx();let pegs=[[5,4,3,2,1],[],[]],c=0,hold=0,hx=70,bad=0,lift=0;
 g.update=()=>{if(bad)bad--;if(lift)lift--;hx+=(70+c*90-hx)*.3;const h=A.hit(0);if(h.l)c=(c+2)%3;if(h.r)c=(c+1)%3;if(h.l||h.r)S('blip');if(h.a){if(hold){const top=pegs[c][pegs[c].length-1];if(!top||top>hold){pegs[c].push(hold);const y=196-(pegs[c].length-1)*12;fx.spark(70+c*90,y,'#ffffff',6,1.6);A.burst(70+c*90,y,'#e8c890',5,1.2);fx.ring(70+c*90,y-4,'#ffe0a0',hold*12,12);A.shake=Math.max(A.shake,1);hold=0;g.score++;S('hit');if(pegs[2].length===N){g.over='SOLVED IN '+g.score+'! WIN';fx.flash('#ffffff',8);A.confetti();A.shake=5;}}else{S('lose');bad=12;A.shake=4;fx.pop(70+c*90,60,'TOO BIG',K.r);}}else if(pegs[c].length){hold=pegs[c].pop();lift=8;S('blip');fx.spark(70+c*90,196-pegs[c].length*12,'#ffe0a0',4,1.2);}}};
 const CO=['#ff4f6d','#ff9838','#ffcf3f','#3ddc84','#2fd6c3'];const disc=(x,y,d,a)=>{const w=d*22,col=CO[d-1];X.shadow(x,y+11,w/2,2.2,.3);X.rr(x-w/2,y+2,w,9,4.5,X.lt(col,.45));X.rr(x-w/2,y,w,8,4,X.lg(0,y,0,y+8,[X.lt(col,1.6),col,X.lt(col,.7)]));A.c.fillStyle='rgba(255,255,255,.45)';A.c.fillRect(x-w/2+4,y+1.4,w-8,1.2);A.c.fillStyle='rgba(0,0,0,.35)';A.c.fillRect(x-1.5,y,3,2);T(''+d,x+w/2-6,y+1.5,X.lt(col,.35),1,'c');};
 g.draw=()=>{X.cache('hanoi_bg2',()=>{X.vg(0,0,W,H,['#3a2440','#160e1c']);const c=A.c;for(let x=0;x<W;x+=26){c.fillStyle='rgba(255,255,255,.03)';c.fillRect(x,18,1,150);}X.vg(0,150,W,90,['#2a1820','#120a10']);c.fillStyle='rgba(255,220,160,.08)';c.fillRect(0,150,W,1);X.disc(160,60,190,X.rg(160,40,0,160,60,190,['rgba(255,216,144,.22)','rgba(255,216,144,0)']));X.poly([[120,18],[200,18],[290,200],[30,200]],X.lg(0,18,0,200,['rgba(255,230,180,.08)','rgba(255,230,180,0)']));X.vignette(.5);
   X.shadow(160,214,152,8,.5);X.rr(18,204,284,12,4,X.lt('#6a3a18',1));X.wood(20,196,280,9,'#a86c34');X.rrs(20,196,280,9,3,'rgba(0,0,0,.35)',1);c.fillStyle='rgba(255,230,180,.35)';c.fillRect(22,196,276,1);
   for(let i=0;i<3;i++){const x=70+i*90;X.shadow(x,196,22,3,.35);X.ell(x,197,14,3,'#5a3418');c.fillStyle=X.lg(x-3,0,x+3,0,['#8a6a30','#f0d890','#8a6a30']);c.fillRect(x-2.5,86,5,111);X.orb(x,86,4,'#e8c870');}});
  const cx=70+c*90;X.glow(cx,192,40,bad?'#ff4f6d':'#ffcf3f',bad?.3:.14);
  pegs.forEach((pg,i)=>{const x=70+i*90;if(i===2){for(let k=0;k<N;k++)if(k>=pg.length){A.c.globalAlpha=.1;X.rr(x-(N-k)*11,188-k*12,(N-k)*22,8,4,'#ffffff');A.c.globalAlpha=1;}}pg.forEach((d,j)=>disc(x,188-j*12,d));});
  const sh=bad?Math.sin(bad*2)*3:0,hy=40+Math.sin(A.t*.15)*2+lift*1.5;X.poly([[hx-6+sh,70],[hx+6+sh,70],[hx+sh,78]],bad?'#ff4f6d':'#ffcf3f');if(hold){X.glow(hx+sh,hy+4,hold*14,CO[hold-1],.25);disc(hx+sh,hy,hold);A.c.globalAlpha=.25;A.c.fillStyle='#ffe0a0';A.c.fillRect(hx-.5,hy+12,1,20);A.c.globalAlpha=1;}
  fx.draw();X.bar('MOVES '+g.score,'BEST POSSIBLE 31','',g.score>31?K.o:K.w,K.gr);X.panel(256,220,58,16,'#2fd6c3');T('GOAL',262,225,K.gr,1);X.meter(282,225,28,5,pegs[2].length/N,'#2fd6c3');};
 return g;}});

/* ---- BLOCK FIT ---- */
A.add({id:'blockfit',name:'BLOCK FIT',cat:'PUZZLE',how:'PLACE 3 PIECES ANYWHERE. FULL ROWS AND COLUMNS CLEAR. NO ROTATION.',make(){
 const g={over:null,score:0},N=8,SH=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,1],[0,1],[1,0],[2,0],[2,1]]],fx=X.fx();
 let b=Array(N*N).fill(0),hand=[],sel=0,c={x:0,y:0},CU=c,fl=Array(N*N).fill(0);const deal=()=>{hand=[ri(SH.length),ri(SH.length),ri(SH.length)];};deal();
 const fits=(s,x,y)=>SH[s].every(p=>x+p[0]<N&&y+p[1]<N&&!b[(y+p[1])*N+x+p[0]]);
 const any=()=>hand.some(s=>s>=0&&[...Array(N*N).keys()].some(i=>fits(s,i%N,(i/N)|0)));
 const CS=22,OX=40,OY=32,CO=['#ff4f6d','#ff9838','#ffcf3f','#3ddc84','#2fd6c3','#4dabff','#c86dff'];
 g.update=()=>{fl=fl.map(v=>v?v-1:0);const h=A.hit(0);if(h.b){do{sel=(sel+1)%3;}while(hand[sel]<0);S('blip');}mvCur(h,c,N,N);if(h.a&&hand[sel]>=0){const s=hand[sel];if(fits(s,c.x,c.y)){SH[s].forEach(p=>b[(c.y+p[1])*N+c.x+p[0]]=1+(s%6));g.score+=SH[s].length;let cleared=0;for(let i=0;i<N;i++){if([...Array(N).keys()].every(j=>b[i*N+j])){for(let j=0;j<N;j++)b[i*N+j]=-1;cleared++;}if([...Array(N).keys()].every(j=>b[j*N+i])){for(let j=0;j<N;j++)b[j*N+i]=-1;cleared++;}}b.forEach((v,i)=>{if(v<0){fl[i]=10;fx.spark(OX+(i%N)*CS+11,OY+((i/N)|0)*CS+11,'#ffffff',2,2);}});b=b.map(v=>v<0?0:v);g.score+=cleared*10*cleared;S(cleared?'score':'hit');if(cleared){fx.pop(OX+N*CS/2,OY-6,cleared>1?'COMBO x'+cleared:'CLEAR!',K.y);if(cleared>1)fx.flash('#ffffff',6);}hand[sel]=-1;if(hand.every(v=>v<0))deal();else{sel=hand.findIndex(v=>v>=0);}if(!any())g.over='NO ROOM LEFT';}else S('lose');}};
 g.draw=()=>{X.cache('bfit_bg',()=>{X.sky(['#1e1640','#0e0a20']);X.rr(OX-5,OY-5,N*CS+9,N*CS+9,6,X.lg(0,OY,0,OY+N*CS,['#3a2e70','#221a48']));for(let i=0;i<N*N;i++)X.rr(OX+(i%N)*CS,OY+((i/N)|0)*CS,CS-1,CS-1,3,'#16102e');X.panel(228,30,74,184,'#ffffff');});
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS;if(b[i])X.block(x,y,CS-1,CS-1,CO[b[i]],3);if(fl[i]){A.c.globalAlpha=fl[i]/10;X.rr(x,y,CS-1,CS-1,3,'#ffffff');A.c.globalAlpha=1;}}
  const s=hand[sel];if(s>=0){const ok=fits(s,CU.x,CU.y);SH[s].forEach(p=>{const x=CU.x+p[0],y=CU.y+p[1];if(x<N&&y<N){A.c.globalAlpha=.55;X.rr(OX+x*CS+1,OY+y*CS+1,CS-3,CS-3,3,ok?CO[s%6]:'#ff4f6d');A.c.globalAlpha=1;X.rrs(OX+x*CS+1.5,OY+y*CS+1.5,CS-4,CS-4,3,ok?'#ffffff':'#ff4f6d',1);}});}
  hand.forEach((s,i)=>{const y=40+i*60;if(i===sel){X.glow(265,y+20,30,'#ffcf3f',.15);X.rrs(232,y-4,66,54,4,'#ffcf3f',1.5);}if(s>=0)SH[s].forEach(p=>X.block(240+p[0]*12,y+p[1]*12,11,11,CO[s%6],2));});
  fx.draw();X.bar('SCORE '+g.score,'');T('B NEXT PIECE',W-6,224,K.gr,1,'r');};
 return g;}});

/* ---- PEG JUMP ---- */
A.add({id:'pegs',name:'PEG JUMP',cat:'PUZZLE',low:1,how:'A PICKS A PEG, A JUMPS IT OVER A NEIGHBOUR. FEWEST LEFT WINS.',make(){
 const g={over:null,score:32},N=7,fx=X.fx();let b=[],c={x:3,y:2},sel=-1,hop=null,fly=[],pc=[];for(let i=0;i<49;i++){const x=i%7,y=(i/7)|0,ok=(x>1&&x<5)||(y>1&&y<5);b.push(ok?1:-1);}b[24]=0;
 const jumps=i=>{const x=i%7,y=(i/7)|0,o=[];for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const mx=x+d[0],my=y+d[1],tx=x+2*d[0],ty=y+2*d[1];if(tx<0||ty<0||tx>6||ty>6)continue;if(b[my*7+mx]===1&&b[ty*7+tx]===0)o.push([my*7+mx,ty*7+tx]);}return o;};
 const pos=i=>[76+(i%7)*24+12,36+((i/7)|0)*24+12];
 g.update=()=>{fly.forEach(f=>f.t=Math.min(1,f.t+.05));if(hop){hop.t+=.12;if(hop.t>=1){const[x,y]=pos(hop.to);fx.ring(x,y,'#ffffff',12,8);hop=null;}}const h=A.hit(0);mvCur(h,c,7,7);if(h.l||h.r||h.u||h.d)S('blip');if(h.a){const i=c.y*7+c.x;if(sel<0){if(b[i]===1&&jumps(i).length){sel=i;S('blip');}else S('lose');}else{const j=jumps(sel).find(j=>j[1]===i);if(j){b[sel]=0;b[j[0]]=0;b[i]=1;pc[i]=pc[sel];hop={f:sel,to:i,t:0};const[mx,my]=pos(j[0]);fx.debris(mx,my,'#ff9838',6,2);fx.spark(mx,my,'#ffe0a0',8,2);fx.ring(mx,my,'#ffcf3f',16,10);fly.push({x:mx,y:my,t:0,k:32-b.filter(v=>v===1).length,c:pc[j[0]]});sel=-1;g.score=b.filter(v=>v===1).length;S('hit');A.shake=Math.max(A.shake,1);if(g.score<=8)fx.pop(mx,my-12,g.score+' LEFT',g.score<=3?'#3dff8b':'#ffcf3f');if(!b.some((v,k)=>v===1&&jumps(k).length)){g.over=g.score===1?'PERFECT! WIN':g.score+' PEGS LEFT';if(g.score<=3){A.confetti&&A.confetti();fx.flash('#ffcf3f',8);}}}else{sel=-1;S('lose');}}}};
 const PC=['#ff9838','#ff4f6d','#ffcf3f','#3ddc84','#4dabff','#c86dff'],pcol=i=>PC[(i*7+(i/7|0)*3)%6];for(let i=0;i<49;i++)pc.push(pcol(i));
 const tray=k=>[k<16?22+(k%2)*14:284+(k%2)*14,46+((k%16)/2|0)*20];
 const peg=(x,y,s,col)=>{X.shadow(x+1.5,y+4,7.5,3,.45);if(s)X.glow(x,y,16,'#ffcf3f',.4);X.orb(x,y,8,s?'#ffe070':col);};
 g.draw=()=>{X.cache('pegs_bg2',()=>{X.wood(0,0,W,H,'#2e1a0c');X.glow(160,100,190,'#ffd890',.16);for(const tx of[14,276]){X.rr(tx+2,34,30,170,8,'rgba(0,0,0,.4)');X.rr(tx,30,30,170,8,X.lg(0,30,0,200,['#8a5a2a','#5a3416','#3a200a']));X.rr(tx+3,33,24,164,6,'rgba(0,0,0,.35)');}
   X.disc(162,124,102,'rgba(0,0,0,.45)');X.disc(160,118,101,X.lg(0,17,0,219,['#f0c080','#8a5424','#4a2a10']));X.disc(160,118,95,X.rg(140,90,10,160,118,96,['#e8aa66','#b07a3c','#7a4a20']));const c=A.c;for(let i=0;i<20;i++){c.beginPath();c.arc(160+Math.sin(i)*1.5,118,8+i*4.5,0,6.283);c.strokeStyle='rgba(80,40,10,'+(.08+(i%3)*.04)+')';c.lineWidth=1;c.stroke();}X.ell(130,70,40,14,'rgba(255,255,255,.07)',-.4);
   for(let i=0;i<49;i++){const x=i%7,y=(i/7)|0;if(!((x>1&&x<5)||(y>1&&y<5)))continue;const[px,py]=pos(i);X.disc(px,py+.8,8.6,'rgba(255,230,180,.25)');X.disc(px,py,8,X.rg(px,py-2,1,px,py,8,['#1a0e04','#3a2410','#6a4020']));}X.vignette(.5);});
  for(let k=0;k<fly.length;k++){const f=fly[k],[tx,ty]=tray(f.k),e=f.t*f.t*(3-2*f.t),x=f.x+(tx-f.x)*e,y=f.y+(ty-f.y)*e-Math.sin(f.t*3.1416)*30;X.shadow(x+1,y+3,5,2,.35);X.orb(x,y,5.5,f.c);}
  const mv=sel<0?b.map((v,i)=>v===1&&jumps(i).length>0):null;
  b.forEach((v,i)=>{if(v<0)return;const[x,y]=pos(i);if(v===1&&!(hop&&hop.to===i)){peg(x,y-(i===sel?4+Math.sin(A.t*.2):0),i===sel,pc[i]);if(mv&&mv[i]&&lo())X.disc(x,y+9,1.2,'rgba(61,255,139,.8)');}if(sel>=0&&jumps(sel).some(j=>j[1]===i)){const pu=.5+.3*Math.sin(A.t*.25);X.glow(x,y,13,'#3ddc84',pu);A.ring(x,y,6,'#9fffc0');X.disc(x,y,2.5,'#3ddc84');}});
  if(hop){const[a,b_]=[pos(hop.f),pos(hop.to)],t=hop.t;peg(a[0]+(b_[0]-a[0])*t,a[1]+(b_[1]-a[1])*t-Math.sin(t*3.1416)*16,false,pc[hop.to]);}
  cur2(76+c.x*24,36+c.y*24,24,24,'#ffcf3f');fx.draw();X.bar('PEGS '+g.score,g.score<=1?'PERFECT':g.score<=3?'GREAT':g.score<=6?'GOOD':'',' TAKEN '+(32-g.score),K.y,'#3dff8b');};
 return g;}});

/* ---- QUICK MATH ---- */
A.add({id:'math',name:'QUICK MATH',cat:'PUZZLE',how:'LEFT/RIGHT PICK THE ANSWER, A CONFIRMS. FAST = MORE POINTS. 3 STRIKES.',make(){
 const g={over:null,score:0},fx=X.fx();let q,opts,ans,sel=1,t=0,strikes=0,n=0,pop=0,shake=0,streak=0,ok=0,okI=-1;
 const gen=()=>{n++;const d=1+Math.min(3,n/5|0),a=ri(10*d)+1,b=ri(10*d)+1,op=['+','-','x'][ri(n>4?3:2)];ans=op==='+'?a+b:op==='-'?a-b:a*b;q=a+' '+op+' '+b;const s=new Set([ans]);while(s.size<3)s.add(ans+ri(9)-4+(ans>20?ri(10)-5:0));opts=[...s].sort(()=>Math.random()-.5);sel=1;t=0;pop=10;};gen();
 g.update=()=>{t++;if(pop)pop--;if(shake)shake--;if(ok)ok--;const h=A.hit(0);if(h.l)sel=(sel+2)%3;if(h.r)sel=(sel+1)%3;if(h.l||h.r)S('blip');if(h.a){if(opts[sel]===ans){const pts=Math.max(1,10-(t/30|0));g.score+=pts;streak++;ok=14;okI=sel;S('coin');fx.spark(70+sel*90,145,'#3ddc84',12,2.8);fx.ring(70+sel*90,145,'#9fffc0',40,14);A.burst(70+sel*90,145,'#f0f0e8',8,2);if(streak>2&&streak%3===0){fx.pop(160,104,'STREAK '+streak,K.y);A.shake=2;}}else{strikes++;streak=0;S('lose');shake=12;A.shake=6;fx.flash(K.r,6);A.burst(70+sel*90,145,'#ff4f6d',10,2);if(strikes>=3){g.over='3 STRIKES';return;}}gen();}if(t>360){strikes++;streak=0;S('lose');shake=12;A.shake=5;if(strikes>=3){g.over='TOO SLOW';return;}gen();}};
 g.draw=()=>{X.cache('math_bg2',()=>{X.vg(0,0,W,H,['#6a4a30','#2a180c']);const c=A.c;for(let x=0;x<W;x+=16){c.fillStyle='rgba(0,0,0,.08)';c.fillRect(x,0,1,H);}X.disc(160,20,200,X.rg(160,20,0,160,20,200,['rgba(255,230,180,.22)','rgba(255,230,180,0)']));X.vignette(.5);
   for(let i=1;i<4;i++)X.rr(14+i,26+i*2,292,196,6,'rgba(0,0,0,.18)');X.wood(12,22,296,200,'#8a5a30');X.rrs(12.5,22.5,295,199,5,'rgba(255,220,170,.3)',1);X.rr(20,30,280,180,3,X.lg(0,30,0,210,['#2e5444','#1a3628']));X.disc(160,60,180,X.rg(140,50,0,160,90,180,['rgba(255,255,255,.07)','rgba(255,255,255,0)']));
   c.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<70;i++)c.fillRect(24+(i*53)%270,34+(i*37)%170,8+(i%4)*5,1);c.fillStyle='rgba(255,255,255,.025)';for(let i=0;i<8;i++){c.beginPath();c.arc(40+i*36,60+(i*47)%120,12+(i%3)*6,0,6.28);c.fill();}
   X.rr(20,206,280,8,2,X.lg(0,206,0,214,['#a87040','#5a3418']));X.rr(220,203,22,4,2,'#f4f0e0');X.rr(250,203,14,4,2,'#ffb0c8');X.rr(60,203,18,4,2,'#a0e0ff');T('2+2=4',260,190,'rgba(255,255,255,.18)',1,'c');T('7X8',58,192,'rgba(255,255,255,.14)',1,'c');});
  const c=A.c,s=1+pop*.03,ox=shake?Math.sin(shake*2)*3:0;
  c.save();c.translate(160+ox,74);c.scale(s,s);X.glow(0,-2,60,'#ffffff',.06);c.globalAlpha=.35;T(q+' = ?',1,-9,'#ffffff',4,'c',1);c.globalAlpha=1;T(q+' = ?',0,-10,'#f4f4ea',4,'c',1);c.restore();
  opts.forEach((o,i)=>{const x=70+i*90,on=i===sel,yy=128+(on?-3+Math.sin(A.t*.2):0);X.rr(x-31,yy+3,64,34,6,'rgba(0,0,0,.3)');if(on)X.glow(x,145,44,'#ffcf3f',.22);X.rr(x-32,yy,64,34,6,on?X.lg(0,yy,0,yy+34,['#fff6b8','#ffcf3f','#e8a020']):X.lg(0,yy,0,yy+34,['rgba(255,255,255,.16)','rgba(255,255,255,.06)']));A.c.fillStyle='rgba(255,255,255,'+(on?.6:.15)+')';A.c.fillRect(x-28,yy+2,56,1.2);X.rrs(x-32,yy,64,34,6,on?'#ffffff':'rgba(255,255,255,.35)',1);T(o,x,yy+10,on?'#3a2a10':'#f0f0e8',2,'c',1);});
  if(ok)X.glow(70+okI*90,145,50,'#3ddc84',ok/30);
  const f=1-t/360;X.meter(60,180,200,8,f,t>240?'#ff4f6d':t>150?'#ffcf3f':'#3ddc84');if(t>240&&A.t%20<10)X.glow(60+200*f,184,12,'#ff4f6d',.4);
  fx.draw();X.bar('SCORE '+g.score,'',streak>1?'STREAK '+streak:'');for(let i=0;i<3;i++)X.ot('X',W-10-i*12,4,i<strikes?K.r:'#3a3040',2,'r');};
 return g;}});
})();
