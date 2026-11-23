(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const hi=()=>A.gfx==='high',lo=()=>A.gfx!=='off';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],SU=['♥','♦','♣','♠'];const deck=n=>{const d=[];for(let k=0;k<(n||1);k++)for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r,up:false});return shuf(d);};
const felt=key=>X.cache(key,()=>{X.vg(0,0,W,H,['#1a7a40','#106a34','#0a4a24']);const c=A.c;for(let i=0;i<600;i++){c.fillStyle=i%2?'rgba(255,255,255,.03)':'rgba(0,0,0,.06)';c.fillRect((i*137)%W,(i*71)%H,1,1);}X.glow(160,110,170,'#5aff9a',.06);X.vignette(.55);});
const card=(x,y,c,hl,w,h)=>{w=w||22;h=h||30;const cc=A.c;if(!c){X.rrs(x+.5,y+.5,w-1,h-1,3,hl?'#ffcf3f':'rgba(255,255,255,.28)',hl?1.5:1);X.rr(x+1,y+1,w-2,h-2,3,'rgba(0,0,0,.12)');return;}
 X.rr(x+1,y+1.5,w,h,3,'rgba(0,0,0,.3)');if(hl&&lo())X.glow(x+w/2,y+h/2,w,'#ffcf3f',.35);
 if(!c.up){X.rr(x,y,w,h,3,X.lg(x,y,x+w,y+h,['#4a6ae0','#2a4ab0','#1a3088']));X.rrs(x+2.5,y+2.5,w-5,h-5,2,'rgba(255,255,255,.5)',.8);cc.fillStyle='rgba(255,255,255,.12)';for(let i=4;i<w-3;i+=4)for(let j=4;j<h-3;j+=4)if((i+j)%8===0)cc.fillRect(x+i,y+j,1.5,1.5);if(hl)X.rrs(x-.5,y-.5,w+1,h+1,3,'#ffcf3f',1.5);return;}
 X.rr(x,y,w,h,3,X.lg(x,y,x,y+h,['#ffffff','#f6f0e2']));X.rrs(x+.5,y+.5,w-1,h-1,3,hl?'#ffcf3f':'rgba(60,50,30,.45)',hl?1.5:1);const col=c.s<2?'#d02040':'#1a1a24';T(RK[c.r],x+2.5,y+2.5,col,1);
 if(cc.fillText){cc.save();cc.font='8px "Segoe UI Symbol","DejaVu Sans",sans-serif';cc.fillStyle=col;cc.textAlign='center';cc.textBaseline='middle';cc.fillText(SU[c.s],x+w-5.5,y+6);cc.font=(h>26?14:11)+'px "Segoe UI Symbol","DejaVu Sans",sans-serif';cc.fillText(SU[c.s],x+w/2,y+h/2+3);cc.restore();}if(c.r>=10){cc.fillStyle=c.s<2?'rgba(208,32,64,.12)':'rgba(30,30,40,.1)';cc.fillRect(x+3,y+10,w-6,h-13);}};
const PIPS={1:[[0,0]],2:[[-5,-5],[5,5]],3:[[-5,-5],[0,0],[5,5]],4:[[-5,-5],[5,-5],[-5,5],[5,5]],5:[[-5,-5],[5,-5],[0,0],[-5,5],[5,5]],6:[[-5,-6],[5,-6],[-5,0],[5,0],[-5,6],[5,6]]};
const die=(x,y,v,col)=>{X.rr(x+1.5,y+2.5,22,22,5,'rgba(0,0,0,.35)');X.rr(x,y,22,22,5,X.lg(x,y,x+22,y+22,col?[X.lt(col,1.15),col,X.lt(col,.8)]:['#ffffff','#f0eadc','#d8cfb8']));X.rrs(x+.5,y+.5,21,21,5,'rgba(0,0,0,.25)',1);(PIPS[v]||[]).forEach(p=>{X.disc(x+11+p[0],y+11+p[1],2,v===1?'#d02040':'#1a1a24');X.disc(x+10.5+p[0],y+10.5+p[1],.6,'rgba(255,255,255,.4)');});};

/* ---- DICE KINGS (Yahtzee-style) ---- */
const CAT=['ONES','TWOS','THREES','FOURS','FIVES','SIXES','3 OF A KIND','4 OF A KIND','FULL HOUSE','SM STRAIGHT','LG STRAIGHT','FIVE ALIKE','CHANCE'];
const scoreCat=(d,c)=>{const cnt=[0,0,0,0,0,0,0];d.forEach(v=>cnt[v]++);const sum=d.reduce((a,b)=>a+b,0),mx=Math.max(...cnt),s=[...new Set(d)].sort().join('');if(c<6)return cnt[c+1]*(c+1);if(c===6)return mx>=3?sum:0;if(c===7)return mx>=4?sum:0;if(c===8)return cnt.includes(3)&&cnt.includes(2)?25:0;if(c===9)return /1234|2345|3456/.test(s)?30:0;if(c===10)return /12345|23456/.test(s)?40:0;if(c===11)return mx===5?50:0;return sum;};
A.add({id:'dicekings',name:'DICE KINGS',cat:'BOARD',vs:1,how:'A ROLLS (3 A TURN), B HOLDS A DIE, UP/DOWN PICK A ROW, A SCORES IT.',make(){
 const g={over:null,score:0},fx=X.fx();let sc=[Array(13).fill(null),Array(13).fill(null)],p=0,d=[1,1,1,1,1],hold=[0,0,0,0,0],rolls=0,dc=0,row=0,mode='dice',think=0,anim=0,flashRow=-1,fr=0;
 const tot=i=>{const up=sc[i].slice(0,6).reduce((a,b)=>a+(b||0),0);return sc[i].reduce((a,b)=>a+(b||0),0)+(up>=63?35:0);};
 const roll=()=>{d=d.map((v,i)=>hold[i]?v:1+ri(6));rolls++;anim=14;S('blip');};const take=c=>{const v=scoreCat(d,c);sc[p][c]=v;flashRow=c;fr=30;S(v>=25?'score':'coin');if(v>=25){fx.spark(250,6+c*14+5,'#ffcf3f',10,2.2);A.burst(250,6+c*14,K.y,8);}if(c===11&&v===50){fx.flash('#ffcf3f',10);A.confetti();}rolls=0;hold=[0,0,0,0,0];p=1-p;think=0;mode='dice';row=sc[p].findIndex(v=>v===null);if(sc[0].every(v=>v!==null)&&sc[1].every(v=>v!==null)){const a=tot(0),b=tot(1);g.over=a===b?'DRAW!':A.win(a>b?0:1);}};
 g.update=()=>{if(anim)anim--;if(fr)fr--;if(A.cpu&&p===1){if(++think<30)return;think=0;if(rolls===0){roll();return;}const open=[...Array(13).keys()].filter(c=>sc[1][c]===null);const best=open.reduce((b,c)=>scoreCat(d,c)+(c<6?c*.3:0)>scoreCat(d,b)+(b<6?b*.3:0)?c:b,open[0]);if(rolls<3&&scoreCat(d,best)<(A.lvl===0?5:20)){const cnt=[0,0,0,0,0,0,0];d.forEach(v=>cnt[v]++);const keep=cnt.indexOf(Math.max(...cnt));hold=d.map(v=>v===keep?1:0);roll();return;}take(best);return;}
  const h=A.hit(human(p));if(mode==='dice'){if(h.l)dc=(dc+4)%5;if(h.r)dc=(dc+1)%5;if(h.b&&rolls>0){hold[dc]^=1;S('blip');}if(h.a&&rolls<3)roll();if((h.u||h.d)&&rolls>0){mode='rows';row=sc[p].findIndex(v=>v===null);}}else{if(h.u){do{row=(row+12)%13;}while(sc[p][row]!==null);}if(h.d){do{row=(row+1)%13;}while(sc[p][row]!==null);}if(h.a)take(row);if(h.b||h.l||h.r)mode='dice';}};
 g.draw=()=>{X.cache('dk_court2',()=>{const c=A.c;X.vg(0,0,W,H,['#3a0e3a','#2a0a2c','#16061a']);for(let x=0;x<W;x+=16){c.fillStyle=X.lg(x,0,x+16,0,['rgba(0,0,0,.25)','rgba(255,255,255,.05)','rgba(0,0,0,.25)']);c.fillRect(x,0,16,H);}
   for(let y=10;y<H;y+=22)for(let x=(y%44?11:0);x<W;x+=22){c.fillStyle='rgba(216,176,80,.13)';c.beginPath();c.moveTo(x,y-4);c.lineTo(x+3,y);c.lineTo(x,y+4);c.lineTo(x-3,y);c.fill();}
   X.glow(72,110,110,'#ffd080',.18);X.poly([[54,96],[60,82],[66,92],[72,78],[78,92],[84,82],[90,96]],'rgba(216,176,80,.35)');X.rr(54,96,36,6,1,'rgba(216,176,80,.35)');
   X.vg(0,170,146,H-170,['#2a6a3a','#1a4a26']);c.strokeStyle='#d8b050';c.lineWidth=1.5;c.strokeRect(2.5,170.5,141,66);for(let k=0;k<200;k++){c.fillStyle=k%2?'rgba(0,0,0,.08)':'rgba(255,255,255,.04)';c.fillRect(4+(k*73)%138,172+(k*31)%62,1,1);}
   c.fillStyle='#d8b050';c.fillRect(0,0,W,1.5);c.fillRect(0,H-1.5,W,1.5);X.vignette(.5);});X.cache('dk_card',()=>{X.shadow(234,190,86,5,.35);X.rr(146,2,172,186,4,X.lg(0,2,0,188,['#fff8e8','#efe4cc']));X.rr(146,1,172,3,1.5,'#c8343c');for(let i=0;i<13;i++)if(i%2)X.rr(148,4+i*14+1,168,13,0,'rgba(140,110,60,.08)');A.c.fillStyle='rgba(140,110,60,.3)';A.c.fillRect(146,90,172,1);A.c.fillRect(264,4,1,182);A.c.fillRect(292,4,1,182);X.panel(6,6,132,58,null);X.rr(4,182,140,40,6,'rgba(0,0,0,.25)');});
  const cc=A.c;CAT.forEach((c,i)=>{const y=6+i*14,act=mode==='rows'&&i===row&&!(A.cpu&&p===1);if(act)X.rr(148,y-1,168,13,2,'rgba(255,207,63,.45)');if(fr&&i===flashRow){cc.globalAlpha=fr/30;X.rr(148,y-1,168,13,2,'#ffcf3f');cc.globalAlpha=1;}T(c,152,y+2,'#3a2a1a',1);for(let q=0;q<2;q++){const v=sc[q][i];T(v===null?(q===p&&rolls?'('+scoreCat(d,i)+')':'-'):v,q?314:288,y+2,v===null?(q===p&&rolls&&scoreCat(d,i)>0?'#2a8a4a':'#a89878'):q?'#c83a8a':'#1a8a8a',1,'r');}});
  X.ot(A.nm(0),14,12,'#2fd6c3',1);X.ot(tot(0),130,10,'#2fd6c3',2,'r');X.ot(A.nm(1),14,34,'#ff4f9a',1);X.ot(tot(1),130,32,'#ff4f9a',2,'r');X.disc(9,p?37:15,2.5,p?'#ff4f9a':'#2fd6c3');T('UP/DOWN: PICK ROW',14,52,'#8d86b8',1);
  d.forEach((v,i)=>{const sh=anim&&!hold[i],x=14+i*26,y=190-(hold[i]?6:0)-(sh?Math.abs(Math.sin(anim*.5+i))*10:0);const ccx=A.c;ccx.save();if(sh){ccx.translate(x+11,y+11);ccx.rotate(Math.sin(anim+i)*.4);ccx.translate(-x-11,-y-11);}die(x,y,sh?1+ri(6):v,hold[i]?'#ffe98a':null);ccx.restore();if(hold[i])T('HOLD',x+11,y+25,'#ffcf3f',1,'c');});if(mode==='dice'&&!(A.cpu&&p===1))X.rrs(13+dc*26-.5,189-(hold[dc]?6:0)-.5,25,25,6,'rgba(255,207,63,'+(.6+.4*Math.sin(A.t*.2))+')',2);
  for(let i=0;i<3;i++)X.disc(14+i*9,176,3,i<rolls?'rgba(255,255,255,.2)':'#ffcf3f');T('ROLLS LEFT',44,173,'#fff3d6',1);X.ot(A.nm(p)+' TO PLAY',72,150,p?'#ff4f9a':'#2fd6c3',1,'c');fx.draw();};
 return g;}});

/* ---- CODE BREAKER (Mastermind) ---- */
A.add({id:'codebreaker',name:'CODE BREAKER',cat:'PUZZLE',how:'CRACK THE 4-COLOUR CODE. LEFT/RIGHT PICK A SLOT, UP/DOWN COLOUR, A SUBMITS. 10 TRIES.',make(){
 const g={over:null,score:0},PC=['#ff4f6d','#ffcf3f','#3dff8b','#4dabff','#ff4f9a','#ff9838'],fx=X.fx();let code=[...Array(4)].map(()=>ri(6)),rows=[],cur=[0,0,0,0],slot=0,solved=0,wait=0,pop=[0,0,0,0],bestPeg=0;
 const mark=gs=>{let bl=0,wh=0;const a=[],b=[];for(let i=0;i<4;i++){if(gs[i]===code[i])bl++;else{a.push(code[i]);b.push(gs[i]);}}b.forEach(v=>{const j=a.indexOf(v);if(j>=0){wh++;a.splice(j,1);}});return[bl,wh];};
 g.update=()=>{pop=pop.map(v=>v?v-1:0);rows.forEach(r=>{if(r.t)r.t--;});if(wait){if(--wait===0){if(g.lost){g.over='CODE WAS SAFE';return;}code=[...Array(4)].map(()=>ri(6));rows=[];cur=[0,0,0,0];bestPeg=0;}return;}const h=A.hit(0);if(h.l)slot=(slot+3)%4;if(h.r)slot=(slot+1)%4;if(h.u){cur[slot]=(cur[slot]+1)%6;pop[slot]=6;}if(h.d){cur[slot]=(cur[slot]+5)%6;pop[slot]=6;}if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){const m=mark(cur);rows.push({g:cur.slice(),m,t:12});S('hit');const y=210-(rows.length-1)*20,pv=m[0]*2+m[1];if(pv>bestPeg&&m[0]<4){g.score+=(pv-bestPeg)*5;fx.pop(236,y-8,'+'+(pv-bestPeg)*5,'#3dff8b');bestPeg=pv;}fx.spark(204,y,'#ffffff',4,1.4);if(m[0]===4){solved++;g.score+=(11-rows.length)*100;S('win');A.confetti();A.burst(135,16,K.y,20,2.5);fx.ring(135,13,'#ffcf3f',50,22);fx.pop(135,34,'CRACKED! +'+(11-rows.length)*100,K.y);fx.flash('#ffcf3f',6);A.shake=3;wait=80;}else if(rows.length>=10){g.lost=1;wait=100;S('lose');A.shake=6;fx.flash('#ff4f6d',8);}else{fx.ring(204,y,m[0]?'#ffffff':'#8d86b8',10,10);}}};
 g.draw=()=>{X.cache('cb_bg',()=>{X.wood(0,0,W,H,'#3a2614',false);X.vignette(.5);X.shadow(160,234,90,5,.5);X.rr(80,4,160,232,8,X.lg(80,0,240,0,['#7a4a28','#5b3a1e','#6a4224']));X.rrs(80.5,4.5,159,231,8,'rgba(255,220,160,.25)',1);const c=A.c;for(let i=0;i<10;i++){const y=210-i*20;for(let j=0;j<4;j++)X.disc(100+j*22,y,6,'rgba(0,0,0,.35)');for(let k=0;k<4;k++)X.disc(200+(k%2)*8,y-4+(k>>1)*8,2.2,'rgba(0,0,0,.35)');c.fillStyle='rgba(0,0,0,.2)';c.fillRect(86,y+10,148,1);}X.panel(246,30,70,76,'#ffcf3f');X.panel(8,30,62,180,'#4dabff');A.text('COLOURS',39,36,'#8d86b8',1,'c',1);A.text('UP/DOWN',39,198,'#8d86b8',1,'c',1);X.glow(160,0,120,'#ffb060',.12);});
  const c=A.c;rows.forEach((r,i)=>{const y=210-i*20;r.g.forEach((col,j)=>{X.shadow(101+j*22,y+5,6,2,.3);X.orb(100+j*22,y,7,PC[col]);});for(let k=0;k<4;k++){const px=200+(k%2)*8,py=y-4+(k>>1)*8,ps=2.6+(r.t>k*2?(r.t-k*2)*.25:0);if(k<r.m[0])X.orb(px,py,ps,'#1a1a1a');else if(k<r.m[0]+r.m[1])X.orb(px,py,ps,'#ffffff');}if(r.m[0]===4&&lo())X.glow(160,y,60,'#3dff8b',.15);});
  const y=210-rows.length*20;if(!wait&&rows.length<10){X.rr(84,y-10,152,20,4,'rgba(255,207,63,.12)');cur.forEach((col,j)=>{const s=7+pop[j]*.4;if(j===slot&&lo())X.glow(100+j*22,y,13,'#ffcf3f',.5);X.orb(100+j*22,y,s,PC[col]);if(j===slot){c.strokeStyle='#ffcf3f';c.lineWidth=1.5;c.beginPath();c.arc(100+j*22,y,10,0,6.283);c.stroke();X.poly([[100+j*22-3,y-13],[100+j*22+3,y-13],[100+j*22,y-10]],'#ffcf3f');}});}
  X.rr(86,4,100,18,4,'rgba(0,0,0,.4)');if(wait){if(lo())X.glow(135,13,50,g.lost?'#ff4f6d':'#ffcf3f',.3);code.forEach((col,j)=>X.orb(102+j*22,13,7,PC[col]));}else{X.rr(88,5,96,15,3,X.lg(0,5,0,20,['#c8c8d8','#7a7a8a','#4a4a5a']));c.fillStyle='rgba(0,0,0,.25)';for(let k=0;k<4;k++)c.fillRect(90,8+k*3,92,1);X.disc(178,12.5,3.5,X.lg(0,9,0,16,['#ffe080','#a07010']));X.ot('? ? ? ?',131,10,'#fff3d6',1,'c');}
  PC.forEach((col,k)=>{const yy=50+k*24,on=!wait&&rows.length<10&&cur[slot]===k;if(on&&lo())X.glow(39,yy,16,col,.4);X.orb(39,yy,on?9:6.5,col);if(on){X.poly([[20,yy-4],[26,yy],[20,yy+4]],'#ffcf3f');X.poly([[58,yy-4],[52,yy],[58,yy+4]],'#ffcf3f');}});
  X.ot('BLACK =',252,36,'#fff3d6',1);T('RIGHT SPOT',252,46,'#8d86b8',1);X.ot('WHITE =',252,58,'#fff3d6',1);T('WRONG SPOT',252,68,'#8d86b8',1);X.ot('SOLVED '+solved,252,84,'#ffcf3f',1);X.ot('TRIES '+rows.length+'/10',252,94,'#fff3d6',1);fx.draw();};
 return g;}});

/* ---- solitaire helpers ---- */
const seqDown=(a,b)=>b.r===a.r-1;const redBlack=(a,b)=>(a.s<2)!==(b.s<2);

/* ---- FREECELL ---- */
A.add({id:'freecell',name:'FREECELL',cat:'CARDS',how:'PICK A COLUMN (UP FOR CELLS). A LIFTS, A DROPS. BUILD DOWN IN ALTERNATE COLOURS.',make(){
 const g={over:null,score:0},fx=X.fx();let cols=[[],[],[],[],[],[],[],[]],cells=[null,null,null,null],found=[[],[],[],[]],cur=0,top=false,held=null,moves=0,ff=[0,0,0,0];deck().forEach((c,i)=>{c.up=true;cols[i%8].push(c);});
 const src=()=>top?(cur<4?{k:'cell',i:cur}:{k:'f',i:cur-4}):{k:'col',i:cur};
 const place=(c,t)=>{if(t.k==='cell'){if(cells[t.i])return false;cells[t.i]=c;return true;}if(t.k==='f'){const f=found[t.i];if((!f.length&&c.r===0)||(f.length&&f[f.length-1].s===c.s&&f[f.length-1].r===c.r-1)){f.push(c);ff[t.i]=14;g.score+=10;return true;}return false;}const col=cols[t.i];if(!col.length||(seqDown(col[col.length-1],c)&&redBlack(col[col.length-1],c))){col.push(c);return true;}return false;};
 const auto=()=>{let mv=true;while(mv){mv=false;for(const arr of[...cols,cells.map(c=>c?[c]:[])]){const c=arr[arr.length-1];if(!c)continue;for(let f=0;f<4;f++){const F=found[f];if((!F.length&&c.r===0)||(F.length&&F[F.length-1].s===c.s&&F[F.length-1].r===c.r-1&&c.r<=Math.min(...found.map(q=>q.length))+1)){F.push(c);ff[f]=14;g.score+=10;fx.pop(207+f*31,46,'+10','#ffcf3f');fx.spark(207+f*31,24,'#ffcf3f',6,1.6);const ci=cells.indexOf(c);if(ci>=0)cells[ci]=null;else cols.find(q=>q[q.length-1]===c).pop();mv=true;break;}}if(mv)break;}}};
 const ret=()=>{const f=held.from;if(f.k==='cell')cells[f.i]=held.c;else cols[f.i].push(held.c);held=null;};
 g.update=()=>{ff=ff.map(v=>v?v-1:0);const h=A.hit(0);if(h.l)cur=(cur+7)%8;if(h.r)cur=(cur+1)%8;if(h.u)top=true;if(h.d)top=false;if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){const s=src();if(!held){let c=null;if(s.k==='cell'){c=cells[s.i];if(c)cells[s.i]=null;}else if(s.k==='col'){c=cols[s.i].pop();}if(c){held={c,from:s};S('hit');}}else{if(place(held.c,s)){moves++;S('coin');const x=top?(cur<4?6+cur*31:193+(cur-4)*31)+14:12+cur*38+14;fx.spark(x,top?24:70,'#ffffff',8,1.8);fx.ring(x,top?24:70,'#ffcf3f',14,10);held=null;auto();if(found.every(f=>f.length===13)){g.score+=Math.max(100,1000-moves*5);g.over='SOLVED IN '+moves+' MOVES! WIN';A.confetti();}}else{ret();S('lose');A.shake=3;fx.pop(160,48,'NOT THERE',K.r);}}}if(h.b&&held)ret();};
 g.draw=()=>{const CW=28,CH=38;X.cache('fc_felt2',()=>{X.vg(0,0,W,H,['#1c8448','#126c38','#0a4a24']);const c=A.c;for(let i=0;i<900;i++){c.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.07)';c.fillRect((i*137)%W,(i*71)%H,1,1);}X.glow(160,130,170,'#7affb0',.08);c.strokeStyle='rgba(255,240,200,.12)';c.lineWidth=1;c.beginPath();if(c.ellipse)c.ellipse(160,150,130,70,0,0,6.283);c.stroke();X.rr(3,2,128,44,5,'rgba(0,0,0,.18)');X.rr(189,2,128,44,5,'rgba(0,0,0,.18)');A.text('FREE CELLS',67,40,'rgba(255,255,255,.3)',1,'c',1);A.text('FOUNDATIONS',253,40,'rgba(255,255,255,.3)',1,'c',1);X.vignette(.5);});
  cells.forEach((c,i)=>card(6+i*31,3,c,top&&cur===i,CW,CH));found.forEach((f,i)=>{const x=193+i*31;if(ff[i]&&lo())X.glow(x+14,22,24,'#ffcf3f',ff[i]/18);card(x,3,f[f.length-1]||null,top&&cur===4+i,CW,CH);if(!f.length)A.text('A',x+14,18,'rgba(255,255,255,.3)',2,'c',1);else{X.disc(x+CW-2,CH-1,4.5,'#ffcf3f');A.text(''+f.length,x+CW-2,CH-3,'#3a2000',1,'c',1);}});
  cols.forEach((col,i)=>{const x=12+i*38,step=Math.min(13,136/Math.max(1,col.length-1));X.rr(x,50,CW,CH,3,'rgba(0,0,0,.12)');col.forEach((c,j)=>card(x,50+j*step,c,!top&&cur===i&&j===col.length-1,CW,CH));if(!col.length)card(x,50,null,!top&&cur===i,CW,CH);});
  if(!top&&!held){const x=12+cur*38+14,bb=Math.sin(A.t*.2)*1.5;X.poly([[x-4,232+bb],[x+4,232+bb],[x,227+bb]],'#ffcf3f');}
  if(held){const x=top?(cur<4?6+cur*31:193+(cur-4)*31):12+cur*38,y=(top?44:34)+Math.sin(A.t*.15)*1.5;X.shadow(x+18,y+46,14,3.5,.4);card(x+4,y,held.c,true,CW,CH);}X.panel(134,8,52,24,'#ffcf3f');A.text('MOVES',160,12,'#c8b8a0',1,'c',1);X.ot(''+moves,160,21,'#fff3d6',1,'c');fx.draw();};
 return g;}});

/* ---- SPIDER (one suit) ---- */
A.add({id:'spider',name:'SPIDER SOLITAIRE',cat:'CARDS',how:'PICK A COLUMN, UP/DOWN SETS HOW MANY, A MOVES. B DEALS. BUILD K TO A.',make(){
 const g={over:null,score:0},fx=X.fx();const CX=i=>4+i*31.2,bp=[];let d=deck(2).map(c=>({...c,s:3})),cols=[...Array(10)].map(()=>[]),cur=0,n=1,held=null,done=0,moves=0;for(let i=0;i<54;i++){const c=d.pop();cols[i%10].push(c);}cols.forEach(c=>c[c.length-1].up=true);
 const runLen=col=>{let k=1;while(k<col.length&&col[col.length-k-1].up&&col[col.length-k-1].r===col[col.length-k].r+1)k++;return k;};
 const flip=()=>cols.forEach((c,i)=>{if(c.length&&!c[c.length-1].up){c[c.length-1].up=true;g.score+=5;fx.ring(CX(i)+14,30+c.length*7,'#ffcf3f',18,12);A.burst(CX(i)+14,30+c.length*7,K.y,4,1.4);}});const complete=()=>{cols.forEach((c,i)=>{if(c.length>=13){const tail=c.slice(-13);if(tail.every((q,i)=>q.up&&q.r===12-i)){c.splice(-13);done++;g.score+=100;S('win');A.burst(CX(i)+14,90,K.y,18,2.8);fx.ring(CX(i)+14,90,'#ffcf3f',40,20);fx.ring(CX(i)+14,90,'#ffffff',24,14);fx.spark(CX(i)+14,90,'#ffcf3f',16,3);fx.flash('#ffffff',6);A.shake=5;bp.push({t:50,i});}}});flip();if(done>=8){g.over='ALL SUITS BUILT! WIN';A.confetti();}};
 g.update=()=>{const h=A.hit(0);if(h.l)cur=(cur+9)%10;if(h.r)cur=(cur+1)%10;if(!held){const mx=cols[cur].length?runLen(cols[cur]):1;if(h.u)n=Math.min(mx,n+1);if(h.d)n=Math.max(1,n-1);n=Math.min(n,mx);}if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){if(!held){if(cols[cur].length){held={cs:cols[cur].splice(-n),from:cur};S('hit');}}else{const col=cols[cur],top=col[col.length-1];if(cur!==held.from&&(!top||top.r===held.cs[0].r+1)){col.push(...held.cs);moves++;if(top&&!held.cs[0].pd){held.cs[0].pd=1;g.score+=2;}S('coin');fx.spark(CX(cur)+14,40+col.length*9,'#ffffff',6,1.6);fx.ring(CX(cur)+14,40+col.length*9,'#ffffff',16,10);complete();}else{cols[held.from].push(...held.cs);S('lose');A.shake=1.5;}held=null;n=1;}}
  if(h.b&&!held){if(d.length&&cols.every(c=>c.length)){cols.forEach((c,k)=>{const q=d.pop();q.up=true;q.dl=A.t+k*2;c.push(q);});S('blip');complete();}else{S('lose');A.shake=1.5;}}
  if(!d.length&&!held&&A.t%30===0){const can=cols.some((c,i)=>c.length&&cols.some((o,j)=>j!==i&&(!o.length||[...Array(runLen(c)).keys()].some(k=>o[o.length-1].r===c[c.length-1-k].r+1))));if(!can)g.over='NO MOVES - '+done+'/8 BUILT';}};
 const lay=col=>{let dn=0;col.forEach(c=>{if(!c.up)dn++;});const up=col.length-dn,dv=Math.min(7,dn?90/dn:7),uv=Math.max(5,Math.min(17,(160-dn*dv)/Math.max(1,up-1)));const ys=[];let y=22;col.forEach(c=>{ys.push(y);y+=c.up?uv:dv;});return ys;};
 g.draw=()=>{X.cache('tt_spider',()=>{const c=A.c;X.vg(0,0,W,H,['#13603a','#0e5230','#073a20']);for(let i=0;i<700;i++){c.fillStyle=i%2?'rgba(255,255,255,.03)':'rgba(0,0,0,.07)';c.fillRect((i*137)%W,(i*71)%H,1,1);}X.glow(160,120,180,'#7affb0',.07);
   c.strokeStyle='rgba(200,255,220,.07)';c.lineWidth=.8;for(const[ox,oy,sx,sy]of[[0,240,1,-1],[320,240,-1,-1]]){for(let k=0;k<6;k++){const a=k/5*1.5708;c.beginPath();c.moveTo(ox,oy);c.lineTo(ox+sx*Math.cos(a)*90,oy+sy*Math.sin(a)*90);c.stroke();}for(let r=18;r<90;r+=16){c.beginPath();for(let k=0;k<6;k++){const a=k/5*1.5708,x=ox+sx*Math.cos(a)*r,y=oy+sy*Math.sin(a)*r;k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}}
   for(let i=0;i<10;i++)X.rr(4+i*31.2,22,28,38,4,'rgba(0,0,0,.14)');X.vg(0,0,W,24,['rgba(0,0,0,.35)','rgba(0,0,0,0)']);X.vignette(.55);});
  const cc=A.c,ok=held?cols.map((col,i)=>i!==held.from&&(!col.length||col[col.length-1].r===held.cs[0].r+1)):null;
  cols.forEach((col,i)=>{const x=CX(i),ys=lay(col);if(ok&&ok[i]&&lo()){const ty=col.length?ys[ys.length-1]:22;X.glow(x+14,ty+19,26,'#3dff8b',.25+.1*Math.sin(A.t*.2));}
   col.forEach((c,j)=>{let cx_=x,cy_=ys[j];if(c.dl&&A.t-c.dl<14){const f=Math.max(0,(A.t-c.dl)/14),e=1-(1-f)*(1-f);cx_=290+(x-290)*e;cy_=200+(ys[j]-200)*e;}card(cx_,cy_,c,i===cur&&!held&&j>=col.length-n,28,38);});if(!col.length)card(x,22,null,i===cur,28,38);});
  if(held){const ys=lay(cols[cur]),by=(cols[cur].length?ys[ys.length-1]+16:22)-14+Math.sin(A.t*.15)*1.5,v=ok[cur];X.shadow(CX(cur)+17,by+44+(held.cs.length-1)*12,15,3,.4);held.cs.forEach((c,j)=>card(CX(cur)+3,by+j*12,c,true,28,38));X.ot(v?'DROP':'NO',CX(cur)+17,by-9,v?'#3dff8b':'#ff4f6d',1,'c');}
  const sk=Math.ceil(d.length/10);for(let i=0;i<sk;i++)card(282+i*4,198,{up:false},false,22,30);if(sk)X.ot(sk+'',304,190,'#fff3d6',1,'c');
  for(let i=0;i<done;i++){const x=8+i*13,y=200;X.glow(x+11,y+15,14,'#ffcf3f',.15);card(x,y,{r:12,s:3,up:true},false,22,30);}
  for(let k=bp.length-1;k>=0;k--){const q=bp[k];if(--q.t<=0){bp.splice(k,1);continue;}cc.globalAlpha=Math.min(1,q.t/12);X.ot('SUIT BUILT!',CX(q.i)+14,70-(50-q.t)*.4,'#ffcf3f',2,'c');cc.globalAlpha=1;}
  fx.draw();X.bar('BUILT '+done+'/8','MOVES '+moves,held?'':'B DEALS',K.y,'#fff3d6');};
 return g;}});

/* ---- PYRAMID ---- */
A.add({id:'pyramid',name:'PYRAMID',cat:'CARDS',how:'PAIR OPEN CARDS THAT SUM TO 13 (K ALONE). A SELECTS, B DRAWS.',make(){
 const g={over:null,score:0},fx=X.fx();let d=deck(),py=[],stock,waste=[],cur=0,sel=null,passes=0,fly=[],shk=0;for(let r=0;r<7;r++)for(let c=0;c<=r;c++){const q=d.pop();q.up=true;py.push({c:q,r,i:c,gone:false});}stock=d;
 const free=p=>!p.gone&&!py.some(q=>!q.gone&&q.r===p.r+1&&(q.i===p.i||q.i===p.i+1));const avail=()=>{const a=py.filter(free);if(waste.length)a.push({c:waste[waste.length-1],w:true});return a;};
 const pos=x=>x.w?[55,211]:[160-x.r*13+x.i*26,8+x.r*18+15];
 g.update=()=>{if(shk)shk--;fly.forEach(f=>{f.t++;f.x+=f.vx;f.y+=f.vy;f.vy+=.3;f.r+=f.vx*.03;});fly=fly.filter(f=>f.t<50);const av=avail();const anyPair=av.some(x=>x.c.r===12)||av.some((x,i)=>av.some((y,j)=>j>i&&x.c.r+y.c.r+2===13));if(!anyPair&&!stock.length&&passes>=2){g.over='STUCK - '+py.filter(p=>p.gone).length+'/28 CLEARED';return;}cur=Math.min(cur,av.length-1);const h=A.hit(0);if(h.l)cur=(cur+av.length-1)%av.length;if(h.r)cur=(cur+1)%av.length;if(h.l||h.r)S('blip');
  if(h.b){if(stock.length){const q=stock.pop();q.up=true;waste.push(q);S('blip');}else if(passes<2){stock=waste.reverse();waste=[];stock.forEach(q=>q.up=false);passes++;}else S('lose');sel=null;}
  if(h.a&&av[cur]){const it=av[cur];const rem=x=>{const[px,py_]=pos(x);fx.spark(px,py_,'#ffcf3f',8,2);fx.ring(px,py_,'#ffffff',16,12);A.burst(px,py_,K.y,6);fly.push({c:x.c,x:px-11,y:py_-15,vx:(px<160?-1:1)*(1.5+Math.random()),vy:-3,r:0,t:0});if(x.w)waste.pop();else x.gone=true;};if(it.c.r===12){rem(it);g.score+=13;S('coin');fx.pop(pos(it)[0],pos(it)[1]-20,'KING +13','#ffcf3f');sel=null;}else if(!sel){sel=it;S('blip');}else if(sel===it||(sel.c===it.c)){sel=null;}else if(sel.c.r+it.c.r+2===13){const[qx,qy]=pos(it);rem(sel);rem(it);g.score+=13;S('coin');fx.pop(qx,qy-20,'13! +13','#ffcf3f');A.shake=1;sel=null;}else{sel=null;S('lose');A.shake=2;shk=10;}if(py.every(p=>p.gone)){g.score+=500;g.over='PYRAMID CLEARED! WIN';A.confetti();fx.flash('#ffcf3f',10);}}};
 g.draw=()=>{X.cache('pyr_bg2',()=>{X.wood(0,0,W,H,'#3a2010');X.rr(4,4,312,232,16,X.lg(0,4,0,236,['#8a5a2a','#5a3416','#3a200a']));X.rr(10,10,300,220,12,X.rg(160,90,10,160,120,200,['#24a058','#167a40','#0a4a26']));const c=A.c;c.fillStyle='rgba(255,255,255,.03)';for(let i=0;i<600;i++)c.fillRect(10+(i*977+(i*i)%37)%300,10+(i*613+(i*i)%53)%220,1,1);
   X.poly([[160,14],[256,152],[64,152]],'rgba(255,230,150,.05)');X.polys([[160,14],[256,152],[64,152]],'rgba(255,230,150,.14)',1);X.glow(160,60,150,'#fff0c0',.1);X.rr(8,180,72,54,8,'rgba(0,0,0,.22)');X.rrs(8.5,180.5,71,53,8,'rgba(255,230,150,.2)',1);X.vignette(.5);});
  const av=avail(),cl=py.filter(p=>p.gone).length,ox=shk?Math.sin(shk*2)*2:0;py.forEach(p=>{if(p.gone)return;const x=160-p.r*13+p.i*26-11,y=8+p.r*18;const i=av.findIndex(a=>a.c===p.c),fr=free(p),hl=i===cur||(sel&&sel.c===p.c),sl=sel&&sel.c===p.c;card(x+(sl?ox:0),y-(sl?3:hl?1:0),p.c,hl);if(!fr)X.rr(x,y,22,30,3,'rgba(0,20,10,.32)');});
  fly.forEach(f=>{const c=A.c;c.save();c.globalAlpha=Math.max(0,1-f.t/50);c.translate(f.x+11,f.y+15);c.rotate(f.r);card(-11,-15,f.c,false);c.restore();});
  if(sel){X.panel(W-70,26,62,16,'#ffcf3f');X.ot('NEED '+RK[11-sel.c.r],W-39,30,'#ffcf3f',1,'c');}
  if(stock.length){for(let k=Math.min(3,stock.length)-1;k>0;k--)card(14-k,196-k,{up:false},false);card(14,196,{up:false},false);}else card(14,196,null,false);card(44,196,waste[waste.length-1]||null,av[cur]&&av[cur].w||(sel&&sel.w));X.ot('STOCK '+stock.length,14,186,'#fff3d6',1);
  X.panel(W-92,196,84,30,'#ffcf3f');X.ot('CLEARED '+cl+'/28',W-50,201,'#fff3d6',1,'c');X.meter(W-86,214,72,5,cl/28,'#3dff8b');
  X.panel(W-92,4,84,20,null);X.ot('SCORE '+g.score,W-50,7,'#ffcf3f',1,'c');X.ot('PASSES '+(2-passes),W-50,16,'#c8c0e8',1,'c');fx.draw();};
 return g;}});

/* ---- GOLF SOLITAIRE ---- */
A.add({id:'golfsol',name:'GOLF SOLITAIRE',cat:'CARDS',how:'PLAY A CARD ONE ABOVE OR BELOW THE PILE. A PLAYS, B DRAWS. CLEAR ALL 35.',make(){
 const g={over:null,score:0},fx=X.fx();let d=deck(),cols=[...Array(7)].map(()=>[]),pile,cur=0,streak=0,fly=null,best=0;for(let i=0;i<35;i++){const q=d.pop();q.up=true;cols[i%7].push(q);}pile=[d.pop()];pile[0].up=true;
 const ok=c=>Math.abs(c.r-pile[pile.length-1].r)===1,CS=1.3,CX=i=>20+i*42,CY=j=>12+j*20,PX=150,PY=180,SX=94;
 const big=(x,y,c,hl)=>{const cc=A.c;cc.save();cc.translate(x,y);cc.scale(CS,CS);card(0,0,c,hl);cc.restore();};
 g.update=()=>{if(fly&&++fly.t>=12)fly=null;const h=A.hit(0);if(h.l)cur=(cur+6)%7;if(h.r)cur=(cur+1)%7;if(h.l||h.r)S('blip');if(h.a){const col=cols[cur],c=col[col.length-1];if(c&&ok(c)){fly={c,x0:CX(cur),y0:CY(col.length-1),t:0};pile.push(col.pop());streak++;best=Math.max(best,streak);g.score+=10;S('coin');A.burst(PX+14,PY+20,K.y,6);fx.spark(PX+14,PY+20,'#ffffff',8,1.8);fx.ring(PX+14,PY+20,'#ffcf3f',26,16);fx.pop(PX+14,PY-6,'+10','#ffcf3f');if(streak>=5&&streak%5===0){fx.pop(PX+14,PY-18,streak+' STREAK','#3dff8b');fx.flash('#ffcf3f',4);}if(!col.length)fx.ring(CX(cur)+14,CY(0)+20,'#3dff8b',30);if(cols.every(q=>!q.length)){g.score+=d.length*20;g.over='CLEARED! WIN';A.confetti();}}else{S('lose');A.shake=2;if(c)fx.pop(CX(cur)+14,CY(col.length-1)-4,'NO','#ff8a9a');}}
  if(h.b){if(d.length){const q=d.pop();q.up=true;pile.push(q);streak=0;S('blip');fx.spark(PX+14,PY+20,'#9ab8ff',5,1.2);}}if(!d.length&&!cols.some(q=>q.length&&ok(q[q.length-1]))&&cols.some(q=>q.length))g.over=cols.reduce((a,q)=>a+q.length,0)+' CARDS LEFT';};
 g.draw=()=>{felt('tt_felt');const c=A.c;X.cache('gs_mat',()=>{X.rr(8,170,304,64,8,'rgba(0,0,0,.18)');X.rrs(8.5,170.5,303,63,8,'rgba(255,255,255,.12)',1);for(let i=0;i<7;i++)X.rrs(CX(i)+.5,CY(0)+.5,28,38,4,'rgba(255,255,255,.1)',1);A.text('STOCK',SX+14,222,'rgba(255,255,255,.4)',1,'c');A.text('PILE',PX+14,222,'rgba(255,255,255,.4)',1,'c');});
  const top=pile[pile.length-1],rk=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  cols.forEach((col,i)=>{col.forEach((cd,j)=>{const t=j===col.length-1,can=t&&ok(cd);if(can&&lo())X.glow(CX(i)+14,CY(j)+20,20,'#3dff8b',.3);big(CX(i),CY(j)-(i===cur&&t?2:0),cd,i===cur&&t);});if(!col.length)big(CX(i),CY(0),null,i===cur);});
  const ay=CY(Math.max(0,cols[cur].length-1))+44+Math.sin(A.t*.2)*1.5;X.poly([[CX(cur)+14,ay],[CX(cur)+9,ay+6],[CX(cur)+19,ay+6]],'#ffcf3f');
  if(lo())X.glow(PX+14,PY+20,30,'#ffcf3f',.15);big(PX,PY,fly?pile[pile.length-2]:top);if(fly){const f=fly.t/12,e=f*f*(3-2*f);big(fly.x0+(PX-fly.x0)*e,fly.y0+(PY-fly.y0)*e-Math.sin(f*Math.PI)*24,fly.c,false);}
  for(let i=0;i<Math.min(6,Math.ceil(d.length/3));i++)big(SX-i*1.5,PY-i*1.5,{up:false},false);if(!d.length)big(SX,PY,null,false);X.ot(''+d.length,SX+14,PY-14,'#fff3d6',1,'c');
  X.panel(204,176,104,48,'#ffcf3f');T('SCORE',212,182,'#fff3d6',1);T(''+g.score,300,182,K.y,1,'r');T('STREAK',212,193,'#fff3d6',1);T(''+streak,300,193,streak>=5?'#3dff8b':'#ffffff',1,'r');T('LEFT',212,204,'#fff3d6',1);T(''+cols.reduce((a,q)=>a+q.length,0),300,204,'#ffffff',1,'r');X.meter(212,214,88,4,Math.min(1,(streak%5)/5+(streak&&streak%5===0?1:0)),'#3dff8b');
  X.panel(14,176,64,48);T('NEED',46,182,'#fff3d6',1,'c');const a=rk[(top.r+12)%13],b=rk[(top.r+1)%13];X.ot(top.r===0?'2':top.r===12?'Q':a+' / '+b,46,196,'#ffcf3f',top.r===0||top.r===12?2:1,'c');T('B DRAWS',46,212,'rgba(255,255,255,.55)',1,'c');
  fx.draw();};
 return g;}});

/* ---- LUDO RACE ---- */
A.add({id:'ludo',name:'LUDO RACE',cat:'BOARD',vs:1,how:'A ROLLS. A 6 FREES A TOKEN. PICK A TOKEN, A MOVES. GET ALL 4 HOME.',make(){
 const g={over:null,score:0},TRACK=40,fx=X.fx(),PCOL=['#2fd6c3','#ff4f9a'];let tok=[[-1,-1,-1,-1],[-1,-1,-1,-1]],p=0,dv=0,rolled=false,sel=0,think=0,roll=0,msg='',mt=0,hop=null;const START=[0,20],SAFE=[0,8,20,28];
 const abs=(pl,s)=>(START[pl]+s)%TRACK;const moves=pl=>tok[pl].map((s,i)=>({s,i})).filter(o=>(o.s===-1&&dv===6)||(o.s>=0&&o.s+dv<=TRACK+3));
 const xy=a=>{const t=a/TRACK*6.283-1.57;return[160+Math.cos(t)*96,124+Math.sin(t)*92];};
 const tpos=(pl,i)=>{const s=tok[pl][i];if(s===-1)return[pl?250+(i%2)*14:56+(i%2)*14,pl?40+(i>>1)*14:190+(i>>1)*14];if(s>=TRACK)return[160+(pl?1:-1)*(10+(s-TRACK)*10),124];return xy(abs(pl,s));};
 const doMove=i=>{const s=tok[p][i];tok[p][i]=s===-1?0:s+dv;const ns=tok[p][i];hop={pl:p,i,t:12};S('hit');const[x,y]=tpos(p,i);fx.spark(x,y,PCOL[p],5,1.5);if(ns<TRACK){const a=abs(p,ns);if(!SAFE.includes(a))tok[1-p].forEach((o,j)=>{if(o>=0&&o<TRACK&&abs(1-p,o)===a){fx.debris(x,y,PCOL[1-p],10,2.2);fx.ring(x,y,'#ffffff',20,14);A.shake=4;tok[1-p][j]=-1;msg='SENT HOME!';mt=60;S('boom');}});}else if(ns===TRACK+3){A.burst(x,y,K.y,12);fx.ring(x,y,'#ffcf3f',20,14);}if(tok[p].every(v=>v===TRACK+3)){g.over=A.win(p);return;}rolled=false;if(dv!==6){p=1-p;}think=0;};
 g.update=()=>{if(mt)mt--;if(hop&&--hop.t<=0)hop=null;if(roll>0){dv=1+ri(6);if(--roll===0){rolled=true;S('hit');if(!moves(p).length){msg='NO MOVE';mt=50;rolled=false;p=1-p;think=0;}}return;}const cpu=A.cpu&&p===1;
  if(!rolled){if(cpu?++think>30:A.hit(human(p)).a){roll=14;msg='';think=0;S('blip');}return;}const ms=moves(p);if(cpu){if(++think<30)return;let best=ms[0];for(const o of ms){const ns=o.s===-1?0:o.s+dv;if(ns<TRACK&&tok[0].some(v=>v>=0&&v<TRACK&&abs(0,v)===abs(1,ns)))best=o;else if(o.s===-1&&A.lvl>0)best=best.s===-1?best:o;}doMove(best.i);return;}
  const h=A.hit(human(p));const idx=ms.map(o=>o.i);if(!idx.includes(sel))sel=idx[0];if(h.l||h.r){const k=idx.indexOf(sel);sel=idx[(k+(h.r?1:idx.length-1))%idx.length];S('blip');}if(h.a)doMove(sel);};
 const pawn=(x,y,col,j)=>{X.shadow(x,y+5,5,1.6,.35);X.poly([[x-5,y+4],[x+5,y+4],[x+2,y-3],[x-2,y-3]],X.lg(x-5,0,x+5,0,[X.lt(col,1.3),col,X.lt(col,.6)]));X.orb(x,y-5,3.6,col);X.ell(x,y+4,5,1.6,X.lt(col,.7));};
 g.draw=()=>{X.cache('ld_bg2',()=>{const c0=A.c;X.vg(0,0,W,H,['#7a4a28','#5a3418','#3a200c']);for(let y=0;y<H;y+=4){c0.fillStyle='rgba(30,12,2,'+(.05+((y*7)%5)*.02)+')';c0.fillRect(0,y,W,1);}
   X.ell(160,128,128,108,'rgba(0,0,0,.25)');X.ell(160,124,126,106,'#f6efe0');for(let k=0;k<36;k++){const a=k/36*6.283;X.disc(160+Math.cos(a)*126,124+Math.sin(a)*106,5,'#f6efe0');X.disc(160+Math.cos(a)*126,124+Math.sin(a)*106,2,'rgba(200,180,150,.6)');}X.ell(160,124,112,94,'rgba(220,200,170,.25)');
   X.shadow(26,214,16,4,.4);X.disc(26,204,12,'#f4f4f4');X.disc(26,204,9,'#a8642a');X.disc(23,201,2.5,'rgba(255,255,255,.3)');X.rr(37,200,6,7,3,'#f4f4f4');
   X.shadow(294,224,18,4,.4);X.ell(294,214,15,12,'#3a7aa8');X.rr(286,199,16,5,2,'#2a5a80');X.disc(294,198,3,'#ffcf3f');X.poly([[308,212],[316,206],[316,210],[309,216]],'#3a7aa8');for(let k=0;k<3;k++){X.disc(284+k*7,216,1.6,'#ffffff');}
   X.rr(36,14,70,60,8,'rgba(255,79,154,.0)');X.rr(220,16,84,56,10,'rgba(255,79,154,.18)');X.rrs(220.5,16.5,83,55,10,'#ff4f9a',1.5);X.rr(40,170,84,56,10,'rgba(47,214,195,.2)');X.rrs(40.5,170.5,83,55,10,'#2fd6c3',1.5);
   const c=A.c;c.strokeStyle='rgba(160,130,90,.35)';c.lineWidth=14;c.beginPath();if(c.ellipse)c.ellipse(160,124,96,92,0,0,6.283);c.stroke();for(let a=0;a<TRACK;a++){const[x,y]=xy(a),sf=SAFE.includes(a);X.disc(x+1,y+1.5,7,'rgba(0,0,0,.15)');X.disc(x,y,7,X.rg(x-2,y-2,1,x,y,7,sf?['#fff6d0','#e8d098']:['#ffffff','#e8e0d0']));if(sf){const P=[];for(let i=0;i<10;i++){const an=-Math.PI/2+i*Math.PI/5,rr=i%2?1.8:4;P.push([x+Math.cos(an)*rr,y+Math.sin(an)*rr]);}X.poly(P,'#c8a040');}}
   [[0,'#2fd6c3'],[20,'#ff4f9a']].forEach(([a,col])=>{const[x,y]=xy(a);c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.arc(x,y,9,0,6.283);c.stroke();});X.disc(160,124,30,'rgba(255,255,255,.4)');X.vignette(.25);});
  [0,1].forEach(pl=>tok[pl].forEach((s,i)=>{let[x,y]=tpos(pl,i);y+=pl?-2:2;let lift=0;if(hop&&hop.pl===pl&&hop.i===i)lift=Math.sin(hop.t/12*Math.PI)*8;const can=pl===p&&rolled&&i===sel&&!(A.cpu&&p===1);if(can&&lo())X.glow(x,y-3,12,'#ffcf3f',.6);pawn(x,y-lift,PCOL[pl],i);if(can)X.poly([[x-3,y-17],[x+3,y-17],[x,y-13]],'#ffcf3f');}));
  const c=A.c;c.save();if(roll){c.translate(160,124);c.rotate(roll*.5);c.translate(-160,-124);}die(149,113-(roll?Math.abs(Math.sin(roll*.4))*6:0),dv||1);c.restore();X.ot(A.nm(p)+(rolled?' MOVES':' ROLLS'),160,142,PCOL[p],1,'c');if(msg&&mt)X.ot(msg,160,154,'#ff4f6d',1,'c');X.ot('HOME '+tok[0].filter(v=>v===TRACK+3).length+'/4',8,8,'#1a8a8a',1);X.ot('HOME '+tok[1].filter(v=>v===TRACK+3).length+'/4',W-8,8,'#c83a8a',1,'r');fx.draw();};
 return g;}});

/* ---- HEX MINES ---- */
A.add({id:'hexmines',name:'HEX MINES',cat:'PUZZLE',how:'MINESWEEPER ON HEXAGONS: SIX NEIGHBOURS. A OPENS, B FLAGS. CLEAR EVERY SAFE CELL.',make(){
 const g={over:null,score:0},NX=13,NY=10,MN=22,fx=X.fx();let mine=[],open=[],flag=[],c={x:6,y:5},first=true,t=0,ot=[];for(let i=0;i<NX*NY;i++){mine.push(false);open.push(false);flag.push(false);ot.push(0);}
 const nb=i=>{const x=i%NX,y=(i/NX)|0,od=y%2,ds=od?[[-1,0],[1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[-1,0],[1,0],[-1,-1],[0,-1],[-1,1],[0,1]];return ds.map(d=>[x+d[0],y+d[1]]).filter(q=>q[0]>=0&&q[1]>=0&&q[0]<NX&&q[1]<NY).map(q=>q[1]*NX+q[0]);};const cnt=i=>nb(i).filter(j=>mine[j]).length;
 const place=safe=>{let n=0;while(n<MN){const i=ri(NX*NY);if(mine[i]||i===safe||nb(safe).includes(i))continue;mine[i]=true;n++;}};
 const cxy=i=>{const x=i%NX,y=(i/NX)|0;return[35+x*20+(y%2)*10,32+y*18];};
 const reveal=i=>{const st=[i];let k=0;while(st.length){const j=st.pop();if(open[j]||flag[j])continue;open[j]=true;ot[j]=Math.min(20,k++);if(cnt(j)===0&&!mine[j])st.push(...nb(j));}if(k>6){const[x,y]=cxy(i);fx.ring(x,y,'#ffffff',30,16);}};
 g.update=()=>{t++;for(let i=0;i<ot.length;i++)if(ot[i]>0)ot[i]-=.5;const h=A.hit(0);if(h.l)c.x=(c.x+NX-1)%NX;if(h.r)c.x=(c.x+1)%NX;if(h.u)c.y=(c.y+NY-1)%NY;if(h.d)c.y=(c.y+1)%NY;if(h.l||h.r||h.u||h.d)S('blip');const i=c.y*NX+c.x;if(h.b&&!open[i]){flag[i]=!flag[i];S('blip');if(flag[i]){const[fx_,fy_]=cxy(i);fx.ring(fx_,fy_,'#ff3a4f',14,10);}}
  if(h.a&&!flag[i]){if(first){place(i);first=false;}const[px,py]=cxy(i);if(mine[i]){open.forEach((_,j)=>{if(mine[j])open[j]=true;});g.over='BOOM';S('boom');A.shake=10;fx.flash('#ff9838',12);fx.debris(px,py,'#2a2a2a',14,3);fx.spark(px,py,'#ffcf3f',16,3.5);return;}reveal(i);S('hit');fx.spark(px,py,'#c8c0e8',5,1.4);const safe=open.filter((o,j)=>o&&!mine[j]).length;if(safe>g.score)A.burst(px,py,K.c,4,1.2);g.score=safe;if(safe===NX*NY-MN){g.score+=Math.max(0,600-(t/60|0));g.over='FIELD CLEARED! WIN';A.confetti();}}};
 const NC=['#4dabff','#2fbf5a','#ff4f6d','#a64dff','#ff8a1f','#1a1a24'];
 const hexP=(px,py,r)=>{const pts=[];for(let k=0;k<6;k++){const a=k/6*6.283+.5236;pts.push([px+Math.cos(a)*r,py+Math.sin(a)*r]);}return pts;};
 g.draw=()=>{X.cache('hm_bg3',()=>{X.sky(['#2a1d5a','#1a1240','#0b0820']);X.glow(160,110,170,'#6a4aff',.16);X.glow(40,220,90,'#2fd6c3',.08);X.glow(290,30,90,'#ff4f9a',.08);const c=A.c;c.strokeStyle='rgba(255,255,255,.04)';c.lineWidth=1;for(let y=0;y<H+20;y+=26)for(let x=(y/26%2)*15;x<W+30;x+=30)X.polys(hexP(x,y,14),'rgba(160,140,255,.06)',1);X.rr(17,15,288,196,10,'rgba(0,0,0,.35)');X.rrs(17.5,15.5,287,195,10,'rgba(170,150,255,.25)',1);X.vignette(.45);});const cc=A.c,dead=g.over==='BOOM';
  for(let i=0;i<NX*NY;i++){const x=i%NX,y=(i/NX)|0,[px,py]=cxy(i),pts=hexP(px,py,10.5);
   if(open[i]){const s=ot[i]>0?1-ot[i]/40:1;if(mine[i]){X.poly(pts,X.rg(px,py,1,px,py,11,['#ffb070','#ff4f3d','#9a1a2a']));if(lo())X.glow(px,py,16,'#ff6a3d',.35+.15*Math.sin(A.t*.3+i));X.orb(px,py+.5,5.2,'#2a2a34');for(let k=0;k<6;k++){const a=k*1.047+A.t*.02;X.stroke([[px+Math.cos(a)*4,py+.5+Math.sin(a)*4],[px+Math.cos(a)*7.5,py+.5+Math.sin(a)*7.5]],'#2a2a34',1.6);}X.disc(px-1.6,py-1.2,1.3,'#fff');}
    else{X.poly(pts,'#8a80bc');X.poly(hexP(px,py+.6,9.4),X.lg(px,py-10,px,py+10,['#c4bce6','#e6e0fa','#d8d0f2']));const n=cnt(i);if(n){cc.globalAlpha=Math.max(.2,s);X.ot(n,px,py-6,NC[n-1],2,'c');cc.globalAlpha=1;}}}
   else{X.poly(hexP(px,py+2,10.5),'rgba(0,0,0,.45)');X.poly(pts,X.lg(px,py-10,px,py+10,['#9a8ae8','#5a48b0','#33256e']));X.poly(hexP(px,py-1,8.2),X.lg(px,py-9,px,py+7,['#9e90f0','#6a58c4','#4e3ea0']));X.ell(px-2.5,py-5,3.5,1.4,'rgba(255,255,255,.28)',-.5);
    if(flag[i]){X.shadow(px+.5,py+6,4,1.4,.45);X.stroke([[px-1.5,py+6],[px-1.5,py-7]],'#f0f0f8',1.4);const w=Math.sin(A.t*.2+i)*.8;X.poly([[px-1,py-7],[px+6,py-4.5+w],[px-1,py-2]],X.lg(px,py-7,px,py-2,['#ff7080','#d01a34']));}
    else if(dead&&mine[i]){X.orb(px,py,3.5,'#2a2a34');}}
   if(x===c.x&&y===c.y&&!g.over){const pu=Math.sin(A.t*.2);if(lo())X.glow(px,py,16,'#ffcf3f',.35+.1*pu);X.polys(hexP(px,py,11.5+pu*.6),'#ffcf3f',2);}}
  fx.draw();const safe=open.filter((o,j)=>o&&!mine[j]).length,tot=NX*NY-MN;X.bar('MINES '+(MN-flag.filter(Boolean).length),Math.floor(t/60)+'S','SAFE '+safe+'/'+tot,'#ff8a9a',K.w);
  X.panel(20,216,280,20,'#9a8ae8');X.meter(26,222,110,8,safe/tot,'#3ddc84');T('A OPEN   B FLAG',222,223,'#d8d0f2',1,'c',1);};
 return g;}});

/* ---- AIR TRAFFIC (round 35: storm over a detailed airfield, fuel, holding patterns) ---- */
A.add({id:'airtraffic',name:'AIR TRAFFIC',cat:'SIM',how:'LEFT/RIGHT PICK A PLANE, UP/DOWN TURN. LAND ON ITS RUNWAY. A LOW FUEL, B HOLD.',make(){
 const g={over:null,score:0},RW=[{x:118,y:104,a:0,c:'#2fd6c3',n:'09'},{x:222,y:150,a:1.57,c:'#ff4f9a',n:'18'}],fx=X.fx();
 let pl=[],sel=0,t=0,lives=3,landed=0,streak=0,flt=100+ri(800),bolt=0;
 const storm={x:-60,y:60+rnd(120),vx:.12+rnd(.06),vy:rnd(.06)-.03,r:46};
 const clouds=[0,1,2,3].map(i=>({x:rnd(W),y:rnd(H),r:30+rnd(30),v:.08+rnd(.08)}));
 const angd=(a,b)=>{let d=Math.abs(((a-b)%6.283+6.283)%6.283);return Math.min(d,6.283-d);};
 const spawn=()=>{const side=ri(4),r=ri(2);const[x,y]=side===0?[20+rnd(W-40),-12]:side===1?[W+12,20+rnd(H-40)]:side===2?[20+rnd(W-40),H+12]:[-12,20+rnd(H-40)];
  pl.push({x,y,a:Math.atan2(120-y,160-x)+rnd(.5)-.25,r,land:0,tr:[],fuel:1,hold:0,id:'PX'+(flt++),spd:.5+rnd(.12)+.1*A.ai});};
 g.update=()=>{t++;const gap=Math.max(140,(380-landed*9)/(.7+A.ai*.4));if(t===1||t===90||t%Math.round(gap)===0)spawn();
  storm.x+=storm.vx;storm.y+=storm.vy;if(storm.x>W+80){storm.x=-80;storm.y=40+rnd(160);}if(storm.y<30||storm.y>210)storm.vy*=-1;
  clouds.forEach(c=>{c.x+=c.v;if(c.x>W+70)c.x=-70;});if(bolt>0)bolt--;else if(Math.random()<.006){bolt=8;S('boom');}
  const h=A.hit(0),live=pl.filter(q=>!q.land);
  if(live.length){let i=Math.max(0,live.indexOf(pl[sel]));if(h.l)i=(i+live.length-1)%live.length;if(h.r)i=(i+1)%live.length;
   if(h.a){let lo=0;live.forEach((q,k)=>{if(q.fuel<live[lo].fuel)lo=k;});i=lo;}
   if(h.l||h.r||h.a)S('blip');sel=pl.indexOf(live[i]);const q=pl[sel],k=A.in(0);
   if(h.b){q.hold=!q.hold;S(q.hold?'select':'blip');}
   if(ay(k)){q.a+=ay(k)*.045;q.hold=false;}}
  for(const q of pl){if(t%5===0){q.tr.unshift([q.x,q.y]);if(q.tr.length>10)q.tr.pop();}
   if(q.land){q.land++;q.spd*=.985;q.x+=Math.cos(q.a)*q.spd;q.y+=Math.sin(q.a)*q.spd;continue;}
   if(q.hold)q.a+=.028;const ds=Math.hypot(q.x-storm.x,q.y-storm.y);if(ds<storm.r){q.a+=(Math.random()-.5)*.09;q.fuel-=.0003;}
   q.x+=Math.cos(q.a)*q.spd;q.y+=Math.sin(q.a)*q.spd;q.fuel-=1/(2600-A.ai*600);
   if(q.fuel<=0){q.dead=1;lives--;streak=0;S('lose');fx.flash('#ff2040',6);fx.debris(q.x,q.y,'#e8e8f0',12,2);A.shake=6;if(lives<=0)g.over='OUT OF FUEL';continue;}
   const rw=RW[q.r];if(Math.hypot(q.x-rw.x,q.y-rw.y)<12&&angd(q.a,rw.a)<.5){q.land=1;q.hold=false;landed++;streak++;const pts=100+Math.round(q.fuel*100)+(streak>1?25*streak:0);g.score+=pts;S('score');fx.ring(q.x,q.y,rw.c,26,18);fx.pop(q.x,q.y-12,'+'+pts,rw.c);}}
  for(let i=0;i<pl.length;i++)for(let j=i+1;j<pl.length;j++){const a=pl[i],b=pl[j];if(a.land||b.land||a.dead||b.dead)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<11){g.over='MID-AIR COLLISION';S('boom');A.shake=12;fx.flash('#ff9838',14);fx.debris(a.x,a.y,'#e8e8f0',18,3);fx.spark(b.x,b.y,'#ffb040',16,3);return;}}
  const keep=pl.filter(q=>{if(q.dead)return false;if(q.land>90)return false;if(!q.land&&(q.x<-46||q.x>W+46||q.y<-46||q.y>H+46)){lives--;streak=0;S('lose');fx.flash('#ff2040',5);if(lives<=0)g.over='TOO MANY LOST';return false;}return true;});
  const cur=pl[sel];pl=keep;sel=Math.max(0,pl.indexOf(cur));};
 const ground=()=>X.cache('atc_bg3',()=>{const c=A.c;
  X.vg(0,0,W,H,['#4f7a3a','#47703a','#3c6432']);
  const farm=[[0,0,70,46,'#6f8a3e'],[70,0,60,30,'#8a7a46'],[0,46,46,60,'#5d8a44'],[0,180,80,60,'#7d8f45'],[80,206,90,34,'#668c3f'],[262,0,58,40,'#7a8a40']];
  farm.forEach(([x,y,w,h,col],i)=>{c.fillStyle=col;c.fillRect(x,y,w,h);c.fillStyle='rgba(0,0,0,.08)';for(let k=2;k<(i%2?w:h);k+=3)i%2?c.fillRect(x+k,y,1,h):c.fillRect(x,y+k,w,1);c.strokeStyle='rgba(40,60,20,.5)';c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);});
  for(let i=0;i<900;i++){c.fillStyle=['rgba(255,255,200,.05)','rgba(0,40,0,.08)','rgba(120,160,60,.08)'][i%3];c.fillRect((i*137)%W,(i*71)%H,1+(i%3),1);}
  c.save();c.globalAlpha=.04;c.fillStyle='#fff';for(let k=-H;k<W;k+=16){c.beginPath();c.moveTo(k,0);c.lineTo(k+8,0);c.lineTo(k+8+H*.4,H);c.lineTo(k+H*.4,H);c.fill();}c.restore();
  c.strokeStyle='#2a4a6a';c.lineWidth=16;c.lineCap='round';c.beginPath();c.moveTo(W+10,198);c.bezierCurveTo(280,190,270,236,230,250);c.stroke();c.strokeStyle='#3a6a9a';c.lineWidth=12;c.stroke();c.strokeStyle='rgba(160,210,255,.25)';c.lineWidth=2;c.stroke();
  c.strokeStyle='#5a5a60';c.lineWidth=6;c.beginPath();c.moveTo(0,160);c.lineTo(60,150);c.lineTo(150,176);c.lineTo(180,240);c.stroke();c.strokeStyle='rgba(255,230,140,.6)';c.lineWidth=.6;c.setLineDash([3,3]);c.stroke();c.setLineDash([]);
  [[30,153,'#d04040'],[110,166,'#e8e8f0'],[164,206,'#3a6ad0']].forEach(([x,y,col])=>{X.rr(x-2.5,y-1.5,5,3,1,col);});
  const tree=(x,y,r)=>{X.ell(x+2,y+2,r,r*.8,'rgba(0,20,0,.35)');X.disc(x,y,r,'#2d5a28');X.disc(x-r*.3,y-r*.3,r*.6,'#3f7a34');X.disc(x-r*.4,y-r*.45,r*.25,'rgba(200,255,150,.25)');};
  [[12,120,5],[22,126,4],[8,132,4],[300,70,5],[292,82,4],[308,90,5],[60,214,4],[72,222,5],[300,120,4],[44,72,5],[150,226,4],[268,218,5],[196,20,4],[206,28,5],[240,60,4]].forEach(a=>tree(...a));
  // apron, terminal, tower, hangars
  X.rr(244,6,70,42,2,'#8a8a90');c.fillStyle='rgba(0,0,0,.06)';for(let x=246;x<312;x+=8)c.fillRect(x,6,1,42);for(let y=8;y<48;y+=8)c.fillRect(244,y,70,1);
  X.rr(248,8,62,12,2,'#d8d4cc');X.rr(248,8,62,5,2,'#b8c8d8');c.fillStyle='rgba(60,90,120,.7)';for(let x=252;x<308;x+=4)c.fillRect(x,15,2,3);
  [256,272,288,304].forEach(x=>{c.fillStyle='#c8c8cc';c.fillRect(x-1,20,2,8);});
  const plane=(x,y,a,s,col)=>{c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);X.poly([[9,0],[-7,-1.6],[-7,1.6]],'#f2f2f6');X.poly([[2,-1],[-3,-9],[-5,-9],[-3,-1]],'#e2e2ea');X.poly([[2,1],[-3,9],[-5,9],[-3,1]],'#e2e2ea');X.poly([[-6,-1],[-9,-4],[-9,4],[-6,1]],col);c.restore();};
  plane(258,34,1.57,.8,'#e85a3a');plane(282,36,1.57,.8,'#3a8ae8');plane(300,32,1.57,.8,'#f0c040');
  X.disc(236,24,4,'#c8c8cc');X.disc(236,24,3,'#5a8ab0');X.disc(235,23,1,'rgba(255,255,255,.7)');
  [[40,26],[56,26]].forEach(([x,y])=>{X.rr(x-7,y-6,14,12,2,'#9aa0a8');c.fillStyle='rgba(0,0,0,.15)';for(let k=-5;k<6;k+=2)c.fillRect(x+k,y-6,1,12);});
  // taxiways
  c.strokeStyle='#6a6a70';c.lineWidth=7;c.lineCap='butt';c.beginPath();c.moveTo(150,104);c.lineTo(222,104);c.moveTo(222,104);c.lineTo(222,48);c.lineTo(244,30);c.moveTo(90,104);c.lineTo(70,40);c.lineTo(52,32);c.stroke();
  c.strokeStyle='#f0c840';c.lineWidth=.6;c.stroke();
  RW.forEach(r=>{c.save();c.translate(r.x,r.y);c.rotate(r.a);const L=46;
   X.rr(-L-4,-9,2*L+8,18,2,'rgba(0,0,0,.25)');X.rr(-L,-7,2*L,14,1,X.lg(0,-7,0,7,['#46464e','#3a3a42','#46464e']));
   c.fillStyle='rgba(0,0,0,.18)';for(let k=-L;k<L;k+=3)c.fillRect(k,-7+((k*7)&7)*1.6,2,1);
   c.fillStyle='#ececf2';c.fillRect(-L,-6.4,2*L,.6);c.fillRect(-L,5.8,2*L,.6);for(let k=-L+14;k<L-14;k+=9)c.fillRect(k,-.4,5,.8);
   for(const e of[-1,1]){for(let j=-5;j<=5;j+=2)c.fillRect(e*(L-5)-1.2,j-.5,2.4,1);c.fillStyle=r.c;c.fillRect(e>0?L-2:-L,-7,2,14);c.fillStyle='#ececf2';for(const j of[-3.5,3.5])c.fillRect(e*(L-18)-2,j-.6,4,1.2);}
   c.fillStyle='#ffe08a';for(let k=-L;k<=L;k+=8){c.fillRect(k-.5,-8,1,1);c.fillRect(k-.5,7,1,1);}
   c.restore();T(r.n,r.x+Math.cos(r.a+Math.PI)*36-4+(r.a?6:0),r.y+Math.sin(r.a+Math.PI)*36-(r.a?2:3),'#ececf2',1);});
  X.vignette(.45);});
 g.draw=()=>{const c=A.c;ground();
  clouds.forEach(q=>X.ell(q.x+10,q.y+12,q.r,q.r*.55,'rgba(10,20,10,.13)'));
  RW.forEach(r=>{for(let k=0;k<5;k++){const f=((A.t*.045+k*.2)%1);const d=50+f*28;X.disc(r.x+Math.cos(r.a+Math.PI)*d,r.y+Math.sin(r.a+Math.PI)*d,1.3,X.rgba(r.c,1-f));}
   if(lo()){c.save();c.translate(r.x,r.y);c.rotate(r.a+Math.PI);X.poly([[46,0],[120,-16],[120,16]],X.rgba(r.c,.06));c.restore();}});
  // radar sweep
  c.save();c.translate(236,24);c.rotate(A.t*.03);X.poly([[0,0],[360,-40],[360,40]],'rgba(120,255,160,.035)');c.restore();
  pl.forEach(q=>{q.tr.forEach((p,k)=>{c.globalAlpha=(1-k/10)*.3;X.disc(p[0],p[1],1.4-k*.08,'#ffffff');});c.globalAlpha=1;});
  for(let i=0;i<pl.length;i++)for(let j=i+1;j<pl.length;j++){const a=pl[i],b=pl[j];if(!a.land&&!b.land&&Math.hypot(a.x-b.x,a.y-b.y)<32&&A.t%16<8){A.ring(a.x,a.y,14,'#ff3040');A.ring(b.x,b.y,14,'#ff3040');}}
  pl.forEach((q,i)=>{const s=(q.land?Math.max(.55,1-q.land/90):1)*1.25,col=RW[q.r].c,alt=q.land?Math.max(0,6-q.land*.2):7;
   c.save();c.translate(q.x+alt,q.y+alt*1.1);c.rotate(q.a);c.scale(s,s);X.poly([[9,0],[-7,-2],[-3,-9],[-6,-9],[-8,-1],[-10,-4],[-11,-4],[-10,0],[-11,4],[-10,4],[-8,1],[-6,9],[-3,9],[-7,2]],'rgba(0,10,0,.28)');c.restore();
   c.save();c.translate(q.x,q.y);c.rotate(q.a);c.scale(s,s);
   X.poly([[2,-1.2],[-3,-9],[-5.5,-9],[-3.5,-1.2]],'#d6d6e0');X.poly([[2,1.2],[-3,9],[-5.5,9],[-3.5,1.2]],'#c4c4d0');
   X.rr(-1.6,-5.6,3.2,1.6,.8,'#8a8a98');X.rr(-1.6,4,3.2,1.6,.8,'#8a8a98');
   X.poly([[-7,-1],[-10,-4.5],[-11.5,-4.5],[-10,0],[-11.5,4.5],[-10,4.5],[-7,1]],col);
   X.rr(-10,-1.6,19,3.2,1.6,X.lg(0,-1.6,0,1.6,['#ffffff','#e8e8f2','#b8b8c8']));c.fillStyle=col;c.fillRect(-9,-.3,14,.6);X.disc(7.6,0,.9,'#3a5a7a');
   if(A.t%40<4){X.disc(-4,-9,1,'#ff3040');X.disc(-4,9,1,'#30ff70');}if(A.t%60<3)X.disc(-10,0,1,'#ffffff');
   c.restore();
   if(!q.land&&lo()&&q.fuel<.25&&A.t%20<10)A.ring(q.x,q.y,10,'#ff5040');
   if(i===sel&&!q.land){if(lo())X.glow(q.x,q.y,16,'#ffcf3f',.3);A.ring(q.x,q.y,13,'#ffcf3f');c.setLineDash&&c.setLineDash([3,3]);X.stroke([[q.x,q.y],[q.x+Math.cos(q.a)*40,q.y+Math.sin(q.a)*40]],'rgba(255,255,255,.55)',1);c.setLineDash&&c.setLineDash([]);
    const tx=cl(q.x+12,2,W-46),ty=cl(q.y-22,14,H-20);X.rr(tx,ty,42,13,2,'rgba(8,16,12,.72)');T(q.id+(q.hold?' HLD':''),tx+3,ty+2,'#bfffd0',1,'l',1);X.meter(tx+3,ty+9,36,2,q.fuel,q.fuel<.25?'#ff5040':'#3ddc84');}});
  // storm cell
  if(lo()){c.save();for(let k=0;k<4;k++)X.ell(storm.x+Math.cos(A.t*.01+k*1.7)*10,storm.y+Math.sin(A.t*.013+k)*8,storm.r-k*6,(storm.r-k*6)*.7,'rgba(40,46,60,.17)');
   c.strokeStyle='rgba(170,190,220,.35)';c.lineWidth=.8;c.beginPath();for(let k=0;k<26;k++){const a=k*2.4,rr=(k*13%storm.r)*.9,x=storm.x+Math.cos(a)*rr,y=storm.y+Math.sin(a)*rr*.7+((A.t*3+k*9)%14)-7;c.moveTo(x,y);c.lineTo(x-2,y+6);}c.stroke();c.restore();
   if(bolt>4){X.stroke([[storm.x,storm.y-20],[storm.x-6,storm.y-6],[storm.x+3,storm.y],[storm.x-4,storm.y+16]],'#f0f4ff',1.4);}}
  if(bolt>5){c.fillStyle='rgba(220,230,255,.18)';c.fillRect(0,0,W,H);}
  fx.draw();X.ot('SCORE '+g.score,6,6,'#3dff8b',1);T('LANDED '+landed+(streak>1?'  CHAIN X'+streak:''),6,16,'#d0f0d8',1,'l',1);for(let i=0;i<3;i++)X.heart(W-34+i*12,8,.85,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ---- GOLF TOUR (9 holes, top-down) ---- */
A.add({id:'golftour',name:'GOLF TOUR',cat:'SPORTS',how:'AIM LEFT/RIGHT, HOLD A FOR POWER. AVOID WATER AND SAND. THE FLAG SHOWS THE WIND. 9 HOLES.',low:1,make(){
 const g={over:null,score:0},fx=X.fx();let wind={x:0,y:0},gid=0,hole=0,ball,cup,ang=0,pw=0,strokes=0,total=0,haz=[],mv=false,par=3,msg='',mt=0,last,tr=[],sink=0;
 const gen=()=>{hole++;gid=ri(1e9);ball={x:30+rnd(40),y:60+rnd(120),vx:0,vy:0};cup={x:240+rnd(50),y:40+rnd(160)};haz=[];for(let i=0;i<2+hole/2;i++){const x=90+rnd(140),y=30+rnd(180);haz.push({x,y,r:14+rnd(14),k:Math.random()<.5?'w':'s'});}ang=Math.atan2(cup.y-ball.y,cup.x-ball.x);strokes=0;par=3+(hole%3===0?1:0);{const wa=rnd(6.283),ws=hole<2?0:rnd(.6+hole*.1)*(.6+A.ai*.5);wind={x:Math.cos(wa)*ws,y:Math.sin(wa)*ws};}last={...ball};tr=[];};gen();
 g.update=()=>{if(mt)mt--;if(sink)sink--;const k=A.in(0);if(!mv){ang+=ax(k)*.035;if(k.a)pw=Math.min(1,pw+.018);else if(pw>.03){ball.vx=Math.cos(ang)*pw*7;ball.vy=Math.sin(ang)*pw*7;pw=0;mv=true;strokes++;last={x:ball.x,y:ball.y};S('hit');fx.debris(ball.x,ball.y,'#7ad05a',4,1.2);}return;}
  if(Math.hypot(ball.vx,ball.vy)>.6){ball.vx+=wind.x*.012;ball.vy+=wind.y*.012;}ball.x+=ball.vx;ball.y+=ball.vy;tr.unshift([ball.x,ball.y]);if(tr.length>10)tr.pop();const hz=haz.find(z=>Math.hypot(ball.x-z.x,ball.y-z.y)<z.r);const fr=hz&&hz.k==='s'?.9:.975;if(hz&&hz.k==='s'&&Math.hypot(ball.vx,ball.vy)>1&&A.t%3===0)fx.debris(ball.x,ball.y,'#e8d8a0',2,1);ball.vx*=fr;ball.vy*=fr;if(ball.x<6||ball.x>W-6){ball.vx*=-.6;ball.x=cl(ball.x,6,W-6);}if(ball.y<24||ball.y>H-6){ball.vy*=-.6;ball.y=cl(ball.y,24,H-6);}
  const sp=Math.hypot(ball.vx,ball.vy);if(Math.hypot(ball.x-cup.x,ball.y-cup.y)<5&&sp<3.5){total+=strokes;g.score=total;msg=strokes===1?'HOLE IN ONE!':strokes<par?'BIRDIE':strokes===par?'PAR':'BOGEY';mt=90;S('win');A.burst(cup.x,cup.y,K.y,16,2.2);fx.ring(cup.x,cup.y,'#ffffff',26,16);if(strokes<par)A.confetti();mv=false;if(hole>=9){g.over=total+' STROKES';return;}gen();return;}
  if(sp<.08){mv=false;tr=[];if(hz&&hz.k==='w'){fx.ring(ball.x,ball.y,'#bfe8ff',16,16);fx.spark(ball.x,ball.y,'#bfe8ff',8,1.8);ball={...last,vx:0,vy:0};strokes++;msg='WATER +1';mt=60;S('lose');}ang=Math.atan2(cup.y-ball.y,cup.x-ball.x);}};
 g.draw=()=>{X.cache('gt_bg'+gid,()=>{const c=A.c,h=(a,b)=>{const v=Math.sin(a*127.1+b*311.7+gid%997)*43758.5;return v-Math.floor(v);};
   X.vg(0,0,W,H,['#2e6e2a','#2a6626','#245e22']);for(let i=0;i<900;i++){c.fillStyle=['rgba(10,40,10,.25)','rgba(120,180,80,.12)','rgba(60,110,40,.3)'][i%3];c.fillRect(h(i,1)*W,h(i,2)*H,1+(i%2),1);}
   const tee={x:last.x,y:last.y};c.lineCap='round';c.lineJoin='round';const mx=(tee.x+cup.x)/2+(h(3,3)-.5)*60,my=(tee.y+cup.y)/2+(h(4,4)-.5)*60;
   c.strokeStyle='#3e8a36';c.lineWidth=58;c.beginPath();c.moveTo(tee.x,tee.y);c.quadraticCurveTo(mx,my,cup.x,cup.y);c.stroke();c.strokeStyle='#4c9c40';c.lineWidth=48;c.stroke();
   c.save();c.clip&&0;c.restore();c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=48;c.setLineDash([10,10]);c.stroke();c.setLineDash([]);
   X.rr(tee.x-9,tee.y-7,18,14,3,'#5aae4a');X.disc(tee.x-6,tee.y-5,1.2,'#f0f0f0');X.disc(tee.x+6,tee.y-5,1.2,'#f0f0f0');
   const tree=(x,y,r,k)=>{X.ell(x+r*.6,y+r*.7,r*1.05,r*.55,'rgba(0,20,0,.35)');if(k){X.poly([[x,y-r*1.3],[x-r,y+r*.6],[x+r,y+r*.6]],'#1c4a20');X.poly([[x,y-r*1.3],[x-r*.55,y],[x+r*.2,y]],'#2a6a2c');}else{X.disc(x,y,r,'#1e5224');X.disc(x-r*.3,y-r*.25,r*.7,'#2e6e2e');X.disc(x-r*.45,y-r*.45,r*.3,'rgba(180,255,140,.18)');}};
   for(let i=0;i<14;i++){const e=i%4,tx=e===0?4+h(i,5)*26:e===1?W-4-h(i,5)*26:6+h(i,6)*(W-12),ty=e<2?30+h(i,7)*(H-40):(e===2?32+h(i,8)*12:H-4-h(i,8)*12);if(Math.hypot(tx-cup.x,ty-cup.y)<24||Math.hypot(tx-tee.x,ty-tee.y)<20)continue;tree(tx,ty,6+h(i,9)*5,i%3===0);}
   haz.forEach((z,zi)=>{const lobes=[[0,0,1]].concat([0,1,2].map(k=>{const a=h(zi,k)*6.283;return[Math.cos(a)*z.r*.45,Math.sin(a)*z.r*.35,.55+h(zi,k+5)*.2];}));const blob=(d,col)=>lobes.forEach(([ox,oy,s])=>X.ell(z.x+ox,z.y+oy,z.r*s+d,(z.r*s+d)*.82,col));
    if(z.k==='w'){blob(3,'#2a5a26');blob(1.4,'#6a8a4a');blob(0,'#1e4a7a');blob(-2,'#2a6aa8');blob(-z.r*.45,'rgba(120,190,240,.35)');for(let k=0;k<5;k++){const a=k*1.3+zi;X.stroke([[z.x+Math.cos(a)*(z.r+1),z.y+Math.sin(a)*(z.r+1)*.82],[z.x+Math.cos(a)*(z.r+1)+1,z.y+Math.sin(a)*(z.r+1)*.82-4]],'#3a6a2a',1);}}
    else{blob(2.2,'#2e6a2a');blob(1,'#b89a5a');blob(0,'#e4cc8e');blob(-z.r*.35,'rgba(255,245,210,.45)');c.strokeStyle='rgba(160,130,70,.35)';c.lineWidth=.6;for(let k=-z.r+3;k<z.r-2;k+=3){const w=Math.sqrt(Math.max(0,z.r*z.r-k*k))*.8;c.beginPath();c.moveTo(z.x-w,z.y+k*.82);c.quadraticCurveTo(z.x,z.y+k*.82-1.5,z.x+w,z.y+k*.82);c.stroke();}}});
   X.ell(cup.x,cup.y,22,19,'#4aa040');X.ell(cup.x,cup.y,19,16,X.rg(cup.x-5,cup.y-5,1,cup.x,cup.y,19,['#9af07a','#6ac860','#58b450']));c.fillStyle='rgba(255,255,255,.06)';for(let k=-16;k<17;k+=4)c.fillRect(cup.x-18,cup.y+k,36,2);X.ell(cup.x,cup.y,19,16,'rgba(0,0,0,0)');X.disc(cup.x,cup.y,4,'#111111');X.ell(cup.x,cup.y-1,3,1.5,'#000');});
  const c=A.c;haz.forEach(z=>{if(z.k==='w'){c.fillStyle='rgba(255,255,255,.18)';for(let k=0;k<3;k++){const o=(A.t*.3+k*9)%(z.r*1.6)-z.r*.8;c.fillRect(z.x+o-3,z.y-z.r*.4+k*z.r*.35,6,1);}}});
  const wv=Math.sin(A.t*.15)*2,fw=Math.hypot(wind.x,wind.y)>.02?Math.atan2(wind.y,wind.x):0,fl=10+Math.hypot(wind.x,wind.y)*4;X.ell(cup.x+6,cup.y+1,8,1.6,'rgba(0,0,0,.25)');X.stroke([[cup.x,cup.y],[cup.x,cup.y-22]],'#f0f0f0',1.2);X.poly([[cup.x,cup.y-22],[cup.x+Math.cos(fw)*fl,cup.y-19+Math.sin(fw)*fl*.5+wv*.5],[cup.x,cup.y-15]],'#ff3a4f');
  tr.forEach((p,i)=>{c.globalAlpha=(1-i/10)*.4;X.disc(p[0],p[1],2.2-i*.15,'#ffffff');});c.globalAlpha=1;
  X.shadow(ball.x+1.5,ball.y+2,3,1.5,.35);X.orb(ball.x,ball.y,3,'#ffffff');if(!mv){for(let i=1;i<9;i++){c.globalAlpha=1-i/10;X.disc(ball.x+Math.cos(ang)*i*7,ball.y+Math.sin(ang)*i*7,1.2,'#ffffff');}c.globalAlpha=1;const ex=ball.x+Math.cos(ang)*64,ey=ball.y+Math.sin(ang)*64;X.poly([[ex+Math.cos(ang)*5,ey+Math.sin(ang)*5],[ex+Math.cos(ang+2.3)*4,ey+Math.sin(ang+2.3)*4],[ex+Math.cos(ang-2.3)*4,ey+Math.sin(ang-2.3)*4]],'rgba(255,255,255,.8)');if(pw){X.rr(6,58,8,84,4,'rgba(0,0,0,.5)');X.rr(7,141-pw*82,6,pw*82,3,X.lg(0,58,0,142,['#ff3a4f','#ffcf3f','#3dff8b']));}}
  fx.draw();X.bar('HOLE '+hole+'/9  PAR '+par,'','',K.w);{const ws=Math.hypot(wind.x,wind.y),wx=W-30,wy=34;X.rr(wx-20,wy-8,44,16,3,'rgba(0,0,0,.45)');if(ws>.02){const a=Math.atan2(wind.y,wind.x);X.stroke([[wx-Math.cos(a)*8,wy-Math.sin(a)*8],[wx+Math.cos(a)*8,wy+Math.sin(a)*8]],'#ffffff',1.5);X.poly([[wx+Math.cos(a)*10,wy+Math.sin(a)*10],[wx+Math.cos(a+2.5)*5,wy+Math.sin(a+2.5)*5],[wx+Math.cos(a-2.5)*5,wy+Math.sin(a-2.5)*5]],'#ffffff');}if(ws>.02)T(Math.round(ws*20)+'',wx+13,wy-2,'#bfe8ff',1,'l',1);else T('CALM',wx+2,wy-2,'#bfe8ff',1,'c',1);}X.ot('STROKES '+strokes+'  TOTAL '+total,W-6,5,'#ffcf3f',1,'r');if(mt)X.ot(msg,160,30,'#ffcf3f',2,'c');};
 return g;}});
})();
