(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
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
A.add({id:'flood',name:'COLOR FLOOD',cat:'PUZZLE',how:'PICK A COLOUR, A FLOODS FROM THE CORNER. FILL IT IN 22 MOVES.',make(){
 const g={over:null,score:0},N=12,CO=['#ff4f6d','#ffcf3f','#3ddc84','#4dabff','#ff4f9a','#ff9838'],fx=X.fx();let b=[],sel=0,moves=22,wave=Array(N*N).fill(0);for(let i=0;i<N*N;i++)b.push(ri(6));
 const owned=()=>{const s=new Set(),st=[0],v=b[0];while(st.length){const i=st.pop();if(s.has(i)||b[i]!==v)continue;s.add(i);const x=i%N,y=(i/N)|0;if(x>0)st.push(i-1);if(x<N-1)st.push(i+1);if(y>0)st.push(i-N);if(y<N-1)st.push(i+N);}return s;};
 g.update=()=>{wave=wave.map(v=>v?v-1:0);const h=A.hit(0);if(h.l)sel=(sel+5)%6;if(h.r)sel=(sel+1)%6;if(h.u)sel=(sel+4)%6;if(h.d)sel=(sel+2)%6;if(h.l||h.r||h.u||h.d)S('blip');if(h.a){const old=b[0];if(old===sel){S('lose');return;}const st=[0];while(st.length){const i=st.pop();if(b[i]!==old)continue;b[i]=sel;const x=i%N,y=(i/N)|0;wave[i]=6+((x+y)%6);if(x>0)st.push(i-1);if(x<N-1)st.push(i+1);if(y>0)st.push(i-N);if(y<N-1)st.push(i+N);}moves--;S('hit');const own=owned().size;if(own>N*N*.5&&own-0>0&&moves%5===0)fx.pop(160,24,Math.round(own/N/N*100)+'%',K.y);if(b.every(v=>v===b[0])){g.score=moves*10+10;g.over='FLOODED! WIN';S('win');fx.flash('#ffffff',8);}else if(moves<=0)g.over='OUT OF MOVES';}};
 g.draw=()=>{X.cache('flood_bg',()=>{X.sky(['#1e1636','#0e0a1e']);X.rr(64,24,192,192,6,'#0a0814');X.panel(248,50,64,96,'#ffffff');});const cx=A.c;
  b.forEach((v,i)=>{const x=70+(i%N)*15,y=30+((i/N)|0)*15,w=wave[i]?1+wave[i]*.02:1,col=CO[v];X.rr(x+7-7*w,y+7-7*w,14*w,14*w,3,X.lg(0,y,0,y+14,[X.lt(col,1.3),col,X.lt(col,.75)]));if(i===0){X.disc(x+7,y+7,2.5,'#ffffff');}});
  CO.forEach((col,i)=>{const x=258+(i%2)*26,y=60+((i/2)|0)*26,s=i===sel;if(s)X.glow(x+11,y+11,18,col,.4);X.rr(x,y,22,22,5,X.lg(0,y,0,y+22,[X.lt(col,1.4),col,X.lt(col,.7)]));if(s)X.rrs(x-2,y-2,26,26,6,'#ffffff',1.5);});
  fx.draw();X.bar('MOVES '+moves,'','',moves<5?K.r:K.w);X.meter(110,6,100,6,owned().size/N/N,'#3ddc84');T('A FLOOD',280,150,K.gr,1,'c');};
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
 const g={over:null,score:0},fx=X.fx();let N,m,p,ex,lvl=0,time=0,mv=0,pp={x:1,y:1},trail=[];
 let mid=0;const build=()=>{lvl++;mid=Math.random()*1e9|0;N=Math.min(9+lvl*2,25);m=[];for(let y=0;y<N;y++)m.push(Array(N).fill(1));const st=[[1,1]];m[1][1]=0;while(st.length){const c=st[st.length-1],ds=[[2,0],[-2,0],[0,2],[0,-2]].filter(d=>{const x=c[0]+d[0],y=c[1]+d[1];return x>0&&y>0&&x<N-1&&y<N-1&&m[y][x];});if(!ds.length){st.pop();continue;}const d=ds[ri(ds.length)];m[c[1]+d[1]/2][c[0]+d[0]/2]=0;m[c[1]+d[1]][c[0]+d[0]]=0;st.push([c[0]+d[0],c[1]+d[1]]);}p={x:1,y:1};pp={x:1,y:1};trail=[];ex=[N-2,N-2];time=(20+N*2)*60;};build();
 g.update=()=>{time--;if(mv>0)mv--;const k=A.in(0);if(mv===0){pp={x:p.x,y:p.y};const dx=ax(k),dy=dx?0:ay(k);if((dx||dy)&&!m[p.y+dy][p.x+dx]){trail.push([p.x,p.y]);if(trail.length>30)trail.shift();p.x+=dx;p.y+=dy;mv=4;}}if(p.x===ex[0]&&p.y===ex[1]){const pts=100+(time/60|0)*5;g.score+=pts;S('win');fx.flash('#3ddc84',8);fx.pop(160,120,'+'+pts,K.y);build();}if(time<=0)g.over='LOST IN THE MAZE';};
 g.draw=()=>{const CS=Math.floor(200/N),OX=160-N*CS/2,OY=122-N*CS/2,c=A.c;X.cache('maze_bg'+lvl+'_'+mid,()=>{X.sky(['#1a1236','#0a0618']);m.forEach((row,y)=>row.forEach((v,x)=>{const X0=OX+x*CS,Y0=OY+y*CS;if(v){A.c.fillStyle=X.lg(0,Y0,0,Y0+CS,['#8a6ad8','#5a3ab0']);A.c.fillRect(X0,Y0,CS,CS);if(y+1<N&&!m[y+1][x]){A.c.fillStyle='#2a1a5a';A.c.fillRect(X0,Y0+CS-Math.max(1,CS*.25),CS,Math.max(1,CS*.25));}}else{A.c.fillStyle=(x+y)%2?'#18122e':'#1c1534';A.c.fillRect(X0,Y0,CS,CS);}}));});
  trail.forEach((q,i)=>{c.globalAlpha=.4*(i/trail.length);X.disc(OX+q[0]*CS+CS/2,OY+q[1]*CS+CS/2,CS*.18,'#ffcf3f');});c.globalAlpha=1;
  const pu=.5+.5*Math.sin(A.t*.15);X.glow(OX+ex[0]*CS+CS/2,OY+ex[1]*CS+CS/2,CS*1.5,'#3ddc84',.3+pu*.2);X.rr(OX+ex[0]*CS+1,OY+ex[1]*CS+1,CS-2,CS-2,2,'#3ddc84');
  const t=mv?1-mv/4:1,px=OX+(pp.x+(p.x-pp.x)*t)*CS+CS/2,py=OY+(pp.y+(p.y-pp.y)*t)*CS+CS/2;X.glow(px,py,CS,'#ffcf3f',.4);X.orb(px,py,Math.max(2,CS*.38),'#ffcf3f');
  fx.draw();X.bar('MAZE '+lvl,''+Math.ceil(time/60),'',K.w,time<300?K.r:K.w);};
 return g;}});

/* ---- TOWER OF HANOI ---- */
A.add({id:'hanoi',name:'TOWER OF HANOI',cat:'PUZZLE',low:1,how:'A LIFTS THE TOP DISC, A DROPS IT. SMALLER ON BIGGER ONLY. MOVE THE TOWER RIGHT.',make(){
 const g={over:null,score:0},N=5,fx=X.fx();let pegs=[[5,4,3,2,1],[],[]],c=0,hold=0,hx=70,bad=0;
 g.update=()=>{if(bad)bad--;hx+=(70+c*90-hx)*.3;const h=A.hit(0);if(h.l)c=(c+2)%3;if(h.r)c=(c+1)%3;if(h.l||h.r)S('blip');if(h.a){if(hold){const top=pegs[c][pegs[c].length-1];if(!top||top>hold){pegs[c].push(hold);fx.spark(70+c*90,192-(pegs[c].length-1)*12,'#ffffff',5,1.5);hold=0;g.score++;S('hit');if(pegs[2].length===N){g.over='SOLVED IN '+g.score+'! WIN';fx.flash('#ffffff',8);}}else{S('lose');bad=12;}}else if(pegs[c].length){hold=pegs[c].pop();S('blip');}}};
 const CO=['#ff4f6d','#ff9838','#ffcf3f','#3ddc84','#2fd6c3'];const disc=(x,y,d)=>{const w=d*22,col=CO[d-1];X.shadow(x,y+11,w/2,2,.25);X.rr(x-w/2,y,w,10,5,X.lg(0,y,0,y+10,[X.lt(col,1.5),col,X.lt(col,.6)]));A.c.fillStyle='rgba(255,255,255,.35)';A.c.fillRect(x-w/2+4,y+1.5,w-8,1.2);};
 g.draw=()=>{X.cache('hanoi_bg',()=>{X.vg(0,0,W,H,['#2a1e3a','#140e1e']);X.glow(160,140,140,'#ffd890',.12);X.shadow(160,210,150,6,.4);X.rr(20,200,280,10,4,X.lg(0,200,0,210,['#c8884a','#7a4a20']));for(let i=0;i<3;i++){const x=70+i*90;A.c.fillStyle=X.lg(x-3,0,x+3,0,['#7a4a20','#c8884a','#7a4a20']);A.c.fillRect(x-3,86,6,114);X.disc(x,86,3.5,'#c8884a');}});
  pegs.forEach((pg,i)=>{const x=70+i*90;pg.forEach((d,j)=>disc(x,190-j*12,d));if(i===2){for(let k=0;k<N;k++)if(k>=pg.length){A.c.globalAlpha=.12;X.rr(x-(N-k)*11,190-k*12,(N-k)*22,10,5,'#ffffff');A.c.globalAlpha=1;}}});
  const sh=bad?Math.sin(bad*2)*3:0;X.poly([[hx-6+sh,68],[hx+6+sh,68],[hx+sh,76]],'#ffcf3f');if(hold)disc(hx+sh,46+Math.sin(A.t*.15)*2,hold);
  fx.draw();X.bar('MOVES '+g.score,'BEST POSSIBLE 31','',K.w,K.gr);};
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
 const g={over:null,score:32},N=7,fx=X.fx();let b=[],c={x:3,y:2},sel=-1,hop=null;for(let i=0;i<49;i++){const x=i%7,y=(i/7)|0,ok=(x>1&&x<5)||(y>1&&y<5);b.push(ok?1:-1);}b[24]=0;
 const jumps=i=>{const x=i%7,y=(i/7)|0,o=[];for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const mx=x+d[0],my=y+d[1],tx=x+2*d[0],ty=y+2*d[1];if(tx<0||ty<0||tx>6||ty>6)continue;if(b[my*7+mx]===1&&b[ty*7+tx]===0)o.push([my*7+mx,ty*7+tx]);}return o;};
 const pos=i=>[76+(i%7)*24+12,36+((i/7)|0)*24+12];
 g.update=()=>{if(hop){hop.t+=.12;if(hop.t>=1)hop=null;}const h=A.hit(0);mvCur(h,c,7,7);if(h.l||h.r||h.u||h.d)S('blip');if(h.a){const i=c.y*7+c.x;if(sel<0){if(b[i]===1&&jumps(i).length){sel=i;S('blip');}else S('lose');}else{const j=jumps(sel).find(j=>j[1]===i);if(j){b[sel]=0;b[j[0]]=0;b[i]=1;hop={f:sel,to:i,t:0};const[mx,my]=pos(j[0]);fx.debris(mx,my,'#ff9838',6,2);sel=-1;g.score=b.filter(v=>v===1).length;S('hit');if(!b.some((v,k)=>v===1&&jumps(k).length))g.over=g.score===1?'PERFECT! WIN':g.score+' PEGS LEFT';}else{sel=-1;S('lose');}}}};
 const peg=(x,y,s)=>{X.shadow(x+1,y+3,7,3,.4);X.orb(x,y,7,s?'#ffcf3f':'#ff9838');};
 g.draw=()=>{X.cache('pegs_bg',()=>{X.vg(0,0,W,H,['#2a1a10','#140a04']);X.disc(160,120,98,'rgba(0,0,0,.4)');X.disc(160,118,96,X.rg(140,90,10,160,118,96,['#d89a5a','#a8743a','#7a4a20']));A.c.fillStyle='rgba(80,40,10,.15)';for(let i=0;i<20;i++){A.c.beginPath();A.c.arc(160,118,10+i*4.5,0,6.283);A.c.strokeStyle='rgba(80,40,10,.12)';A.c.stroke();}
   for(let i=0;i<49;i++){const x=i%7,y=(i/7)|0;if(!((x>1&&x<5)||(y>1&&y<5)))continue;const[px,py]=pos(i);X.disc(px,py,7.5,X.rg(px,py-2,1,px,py,7.5,['#1a0e04','#3a2410','#6a4020']));}});
  b.forEach((v,i)=>{if(v<0)return;const[x,y]=pos(i);if(v===1&&!(hop&&hop.to===i))peg(x,y-(i===sel?3:0),i===sel);if(sel>=0&&jumps(sel).some(j=>j[1]===i)){X.glow(x,y,10,'#3ddc84',.4);X.disc(x,y,3,'#3ddc84');}});
  if(hop){const[a,b_]=[pos(hop.f),pos(hop.to)],t=hop.t;peg(a[0]+(b_[0]-a[0])*t,a[1]+(b_[1]-a[1])*t-Math.sin(t*3.1416)*14,false);}
  cur2(76+c.x*24,36+c.y*24,24,24,'#ffcf3f');fx.draw();X.bar('PEGS '+g.score,'');};
 return g;}});

/* ---- QUICK MATH ---- */
A.add({id:'math',name:'QUICK MATH',cat:'PUZZLE',how:'LEFT/RIGHT PICK THE ANSWER, A CONFIRMS. FAST = MORE POINTS. 3 STRIKES.',make(){
 const g={over:null,score:0},fx=X.fx();let q,opts,ans,sel=1,t=0,strikes=0,n=0,pop=0,shake=0;
 const gen=()=>{n++;const d=1+Math.min(3,n/5|0),a=ri(10*d)+1,b=ri(10*d)+1,op=['+','-','x'][ri(n>4?3:2)];ans=op==='+'?a+b:op==='-'?a-b:a*b;q=a+' '+op+' '+b;const s=new Set([ans]);while(s.size<3)s.add(ans+ri(9)-4+(ans>20?ri(10)-5:0));opts=[...s].sort(()=>Math.random()-.5);sel=1;t=0;pop=10;};gen();
 g.update=()=>{t++;if(pop)pop--;if(shake)shake--;const h=A.hit(0);if(h.l)sel=(sel+2)%3;if(h.r)sel=(sel+1)%3;if(h.l||h.r)S('blip');if(h.a){if(opts[sel]===ans){const pts=Math.max(1,10-(t/30|0));g.score+=pts;S('coin');fx.spark(70+sel*90,145,'#3ddc84',10,2.5);fx.pop(70+sel*90,120,'+'+pts,K.g);}else{strikes++;S('lose');shake=12;fx.flash(K.r,6);if(strikes>=3){g.over='3 STRIKES';return;}}gen();}if(t>360){strikes++;S('lose');shake=12;if(strikes>=3){g.over='TOO SLOW';return;}gen();}};
 g.draw=()=>{X.cache('math_bg',()=>{X.vg(0,0,W,H,['#5a3a20','#3a2410']);X.rr(14,24,292,196,6,'#7a5030');X.rr(20,30,280,184,4,X.lg(0,30,0,214,['#2a4a3a','#1e3a2c']));A.c.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<60;i++)A.c.fillRect(24+(i*53)%270,34+(i*37)%170,14,1);});const c=A.c,s=1+pop*.03,ox=shake?Math.sin(shake*2)*3:0;
  c.save();c.translate(160+ox,74);c.scale(s,s);T(q+' = ?',0,-10,'#f0f0e8',4,'c',1);c.restore();
  opts.forEach((o,i)=>{const x=70+i*90,on=i===sel;if(on)X.glow(x,145,40,'#ffcf3f',.2);X.rr(x-32,128+(on?-2:0),64,34,6,on?X.lg(0,128,0,162,['#fff3a0','#ffcf3f']):'rgba(255,255,255,.1)');X.rrs(x-32,128+(on?-2:0),64,34,6,on?'#ffffff':'rgba(255,255,255,.35)',1);T(o,x,138+(on?-2:0),on?'#3a2a10':'#f0f0e8',2,'c',1);});
  X.meter(60,186,200,6,1-t/360,t>240?'#ff4f6d':'#3ddc84');fx.draw();X.bar('SCORE '+g.score,'');for(let i=0;i<3;i++){c.fillStyle=i<strikes?'#ff4f6d':'rgba(255,255,255,.2)';T('X',W-10-i*12,4,i<strikes?K.r:'#555',2,'r');}};
 return g;}});
})();
