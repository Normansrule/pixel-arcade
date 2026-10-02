(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const SU=['H','D','C','S'],RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const deck=()=>{const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r});for(let i=d.length-1;i>0;i--){const j=ri(i+1);[d[i],d[j]]=[d[j],d[i]];}return d;};
/* vector suit glyph: 0 heart 1 diamond 2 club 3 spade; k = scale */
const suit=(x,y,s,col,k)=>{const c=A.c;k=k||1;c.save();c.translate(x,y);c.scale(k,k);c.fillStyle=col;c.beginPath();
 if(s===0){c.moveTo(0,4.2);c.bezierCurveTo(-6.5,-.5,-3.2,-6.2,0,-2.4);c.bezierCurveTo(3.2,-6.2,6.5,-.5,0,4.2);}
 else if(s===1){c.moveTo(0,-4.6);c.lineTo(3.6,0);c.lineTo(0,4.6);c.lineTo(-3.6,0);}
 else if(s===2){c.arc(0,-2.1,2.2,0,6.283);c.moveTo(-.1,1);c.arc(-2.3,1,2.2,0,6.283);c.moveTo(4.5,1);c.arc(2.3,1,2.2,0,6.283);c.moveTo(0,0);c.lineTo(1.7,4.4);c.lineTo(-1.7,4.4);}
 else{c.moveTo(0,-4.6);c.bezierCurveTo(-6.5,.2,-3.2,4.6,0,1.6);c.bezierCurveTo(3.2,4.6,6.5,.2,0,-4.6);c.moveTo(0,.5);c.lineTo(1.7,4.4);c.lineTo(-1.7,4.4);}
 c.closePath();c.fill();c.restore();};
/* card 22x30 at scale s; hi lifts + glows */
const card=(x,y,cd,up,hi,s)=>{s=s||1;const c=A.c;if(hi)y-=4;c.save();c.translate(x,y);c.scale(s,s);X.rr(.8,1.8,22,30,3,'rgba(0,0,0,.35)');if(hi)X.glow(11,15,24,'#ffcf3f',.4);
 if(!up||!cd||cd.s===undefined){X.rr(0,0,22,30,3,X.lg(0,0,0,30,['#4a5af0','#2333b0']));X.rrs(2.5,2.5,17,25,2,'rgba(255,255,255,.5)',1);for(let j=0;j<4;j++)for(let i=0;i<3;i++){const px=5.5+i*5.5,py=6+j*6;X.poly([[px,py-2],[px+2,py],[px,py+2],[px-2,py]],'rgba(255,255,255,.2)');}c.fillStyle='rgba(255,255,255,.25)';c.fillRect(3,1,16,1);X.rrs(.5,.5,21,29,3,hi?K.y:'rgba(0,0,0,.5)',hi?1.5:1);c.restore();return;}
 X.rr(0,0,22,30,3,X.lg(0,0,0,30,['#ffffff','#fff6e0','#efe0bc']));const col=cd.s<2?'#d02040':'#1a1a2a';T(RK[cd.r],2.2,2.2,col,1,'l',1);suit(4.6,13.8,cd.s,col,.6);
 if(cd.r>=10){X.rr(8.5,8,11.5,19,1.5,X.lg(0,8,0,27,['#ffeab0','#f0c060']));X.rrs(9,8.5,10.5,18,1.5,col,.7);X.poly([[10.2,14],[11,11],[12.7,12.8],[14.25,10.2],[15.8,12.8],[17.5,11],[18.3,14]],col);suit(14.25,20.5,cd.s,col,.72);}
 else suit(14,18.5,cd.s,col,cd.r===0?1.55:1.15);
 X.rrs(.5,.5,21,29,3,hi?K.y:'rgba(0,0,0,.4)',hi?1.5:1);c.restore();};
const slot=(x,y,s,col,lbl)=>{s=s||1;X.rr(x,y,22*s,30*s,3*s,'rgba(0,0,0,.18)');X.rrs(x+.5,y+.5,22*s-1,30*s-1,3*s,col||'rgba(255,255,255,.3)',1);if(lbl!==undefined)lbl();};
const felt=(key,c1,c2,extra)=>X.cache(key,()=>{X.vg(0,0,W,H,[c1,c2]);X.disc(160,110,150,X.rg(160,110,0,160,110,170,['rgba(255,255,255,.12)','rgba(255,255,255,0)']));const cx=A.c;for(let i=0;i<700;i++){cx.fillStyle=i%2?'rgba(0,0,0,.07)':'rgba(255,255,255,.04)';cx.fillRect((i*73)%W,(i*131+i%7)%H,1,1);}if(extra)extra();X.vignette(.6);});
const val=c=>c.r===0?11:c.r>=9?10:c.r+1;
const total=h=>{let t=0,a=0;for(const c of h){t+=val(c);if(c.r===0)a++;}while(t>21&&a>0){t-=10;a--;}return t;};
const mkAnim=()=>{const an={};return{at:(k,tx,ty,sx,sy,d)=>{if(an[k]===undefined)an[k]=A.t;const f=Math.min(1,(A.t-an[k])/(d||10)),e=1-(1-f)*(1-f);return[sx+(tx-sx)*e,sy+(ty-sy)*e];},clear:()=>{for(const k in an)delete an[k];}};};
const badge=(x,y,txt,col,bg)=>{const w=txt.length*6+10;X.rr(x-w/2,y,w,13,6.5,bg||'rgba(0,0,0,.55)');X.rrs(x-w/2+.5,y+.5,w-1,12,6,X.rgba(col||'#ffffff',.6),1);T(txt,x,y+3,col||'#ffffff',1,'c',1);};
const chips=(x,y,n,c1)=>{for(let k=0;k<n;k++){const yy=y-k*3;X.ell(x,yy+1.5,10,4,'rgba(0,0,0,.35)');X.ell(x,yy,10,4,k%2?(c1||'#ff4f6d'):'#f4f0e6');X.ell(x,yy-.5,6.5,2.2,k%2?'#f4f0e6':(c1||'#ff4f6d'));}};

/* ---- BLACKJACK ---- */
A.add({id:'blackjack',name:'BLACKJACK',cat:'CARDS',how:'A HITS. B STANDS. BEAT THE DEALER. START WITH 100 CHIPS.',make(){
 const g={over:null,score:100},fx=X.fx(),an=mkAnim();let d,pl,dl,ph='bet',bet=10,msg='',mt=0,hands=0,lastW=0;
 const deal=()=>{if(d.length<15)d=deck();an.clear();pl=[d.pop(),d.pop()];dl=[d.pop(),d.pop()];ph='play';if(total(pl)===21){finish();}};d=deck();
 const finish=()=>{while(total(dl)<17)dl.push(d.pop());const p=total(pl),q=total(dl);let w=0;if(p>21)w=-1;else if(q>21||p>q)w=1;else if(p<q)w=-1;const bj=p===21&&pl.length===2;g.score+=w*bet*(bj&&w>0?1.5:1);msg=w>0?(bj?'BLACKJACK! +'+bet*1.5:'YOU WIN +'+bet):w<0?(p>21?'BUST -'+bet:'DEALER WINS -'+bet):'PUSH';S(w>0?'score':w<0?'lose':'blip');lastW=w;if(w>0){fx.spark(160,170,K.y,18,2.6);fx.ring(160,110,K.y,40);}if(w<0&&p>21)A.shake=3;ph='res';mt=90;hands++;};
 g.update=()=>{if(mt>0){mt--;if(mt===0){if(g.score<=0){g.over='BROKE AFTER '+hands+' HANDS';return;}if(hands>=15){g.over=g.score+' CHIPS';return;}ph='bet';bet=Math.min(bet,g.score);}return;}const h=A.hit(0);
  if(ph==='bet'){if(h.l)bet=Math.max(5,bet-5);if(h.r)bet=Math.min(g.score,bet+5);if(h.a){S('coin');deal();}}
  else if(ph==='play'){if(h.a){pl.push(d.pop());S('blip');if(total(pl)>21)finish();}if(h.b)finish();}};
 const extra=()=>{const cx=A.c;cx.strokeStyle='rgba(255,230,160,.4)';cx.lineWidth=1.5;cx.beginPath();cx.arc(160,-60,190,.55,2.59);cx.stroke();cx.beginPath();cx.arc(160,-60,176,.6,2.54);cx.stroke();T('BLACKJACK PAYS 3 TO 2',160,112,'rgba(255,230,160,.55)',1,'c',1);T('DEALER STANDS ON 17',160,124,'rgba(255,230,160,.4)',1,'c',1);
  for(let k=0;k<4;k++){X.rr(262-k*1.5,22+k*1.5,30,38,3,'rgba(0,0,0,.3)');}X.rr(258,20,34,42,4,X.lg(0,20,0,62,['#7a4a2a','#4a2a14']));X.rr(262,24,26,30,3,X.lg(0,24,0,54,['#4a5af0','#2333b0']));T('SHOE',275,56,'#e8c890',1,'c',1);};
 g.draw=()=>{felt('bj_bg','#1f8a48','#08401c',extra);const S2=1.25,cw=22*S2;
  if(ph!=='bet'){const hand=(arr,y,face)=>{const n=arr.length,x0=160-(n*(cw+4)-4)/2;arr.forEach((c,i)=>{const[x,yy]=an.at((y<100?'d':'p')+i,x0+i*(cw+4),y,262,24,9);card(x,yy,c,face(i),false,S2);});return x0+n*(cw+4);};
   const dx=hand(dl,26,i=>ph!=='play'||i===0),px=hand(pl,146,()=>true);badge(Math.max(dx+14,214),36,ph==='play'?'?':String(total(dl)),'#ffffff');const pt=total(pl);badge(Math.max(px+14,214),156,String(pt),pt>21?'#ff4f6d':pt===21?K.y:'#ffffff');}
  X.ot('DEALER',60,30,'rgba(255,255,255,.75)',1,'c');X.ot('YOU',60,150,'rgba(255,255,255,.75)',1,'c');
  chips(40,206,Math.max(1,Math.min(10,Math.ceil(bet/5))),'#ff4f6d');badge(40,214,'BET '+bet,K.y);
  X.bar('CHIPS '+g.score,'HAND '+Math.min(hands+1,15)+'/15','',K.y,'#ffffff');
  if(ph==='bet'){X.panel(90,196,140,20,K.y);T('< BET >   A DEAL',160,203,K.y,1,'c',1);}if(ph==='play'){X.panel(90,196,140,20,'#ffffff');T('A HIT   B STAND',160,203,'#ffffff',1,'c',1);}
  if(mt>0){const pop=Math.min(1,(90-mt)/6);X.panel(70,92,180,26,lastW>0?K.y:lastW<0?'#ff4f6d':'#ffffff');X.ot(msg,160,99,lastW>0?K.y:lastW<0?'#ff8a9a':'#ffffff',pop>.9?2:1,'c');}fx.draw();};
 return g;}});

/* ---- VIDEO POKER ---- */
A.add({id:'poker',name:'VIDEO POKER',cat:'CARDS',how:'A HOLDS A CARD. B DRAWS. JACKS OR BETTER PAYS. 10 HANDS.',make(){
 const g={over:null,score:50},fx=X.fx(),an=mkAnim();let d,hand,hold=[0,0,0,0,0],c=0,ph='hold',msg='',mt=0,n=0,lastPay=0,dealt=[0,0,0,0,0];const deal=()=>{d=deck();hand=[d.pop(),d.pop(),d.pop(),d.pop(),d.pop()];hold=[0,0,0,0,0];ph='hold';g.score-=5;an.clear();dealt=[0,0,0,0,0];};deal();
 const rank=h=>{const rs=h.map(c=>c.r).sort((a,b)=>a-b),ss=h.map(c=>c.s),cnt={};rs.forEach(r=>cnt[r]=(cnt[r]||0)+1);const v=Object.values(cnt).sort((a,b)=>b-a),fl=ss.every(s=>s===ss[0]),st=rs.every((r,i)=>i===0||r===rs[i-1]+1)||(rs.join()==='0,9,10,11,12');
  if(fl&&st)return[rs[0]===0&&rs[1]===9?'ROYAL FLUSH':'STRAIGHT FLUSH',rs[0]===0&&rs[1]===9?250:50];if(v[0]===4)return['FOUR OF A KIND',25];if(v[0]===3&&v[1]===2)return['FULL HOUSE',9];if(fl)return['FLUSH',6];if(st)return['STRAIGHT',4];if(v[0]===3)return['THREE OF A KIND',3];if(v[0]===2&&v[1]===2)return['TWO PAIR',2];if(v[0]===2){const pr=+Object.keys(cnt).find(k=>cnt[k]===2);if(pr===0||pr>=10)return['JACKS OR BETTER',1];}return['NO PAY',0];};
 g.update=()=>{if(mt>0){mt--;if(mt===0){n++;if(n>=10||g.score<5)g.over=g.score+' CHIPS';else deal();}return;}const h=A.hit(0);if(h.l)c=(c+4)%5;if(h.r)c=(c+1)%5;if(h.a){hold[c]^=1;S('blip');}
  if(h.b){hand=hand.map((cd,i)=>hold[i]?cd:d.pop());hold.forEach((v,i)=>{if(!v)dealt[i]=A.t;});const[nm,pay]=rank(hand);g.score+=pay*5;lastPay=pay;msg=nm+(pay?'  +'+pay*5:'');if(pay){fx.spark(160,140,K.y,10+Math.min(30,pay*3),2.6);fx.flash(K.y,4);}S(pay?'score':'lose');ph='res';mt=90;}};
 const PT=[['ROYAL FLUSH',250],['STRAIGHT FLUSH',50],['4 OF A KIND',25],['FULL HOUSE',9],['FLUSH',6],['STRAIGHT',4],['3 OF A KIND',3],['TWO PAIR',2],['JACKS+',1]];
 const extra=()=>{X.rr(10,21,300,88,5,X.lg(0,21,0,109,['#1a1a6a','#0a0a3a']));X.rrs(10.5,21.5,299,87,5,'#ffcf3f',1.5);X.rrs(13.5,24.5,293,81,4,'rgba(255,207,63,.35)',1);};
 g.draw=()=>{felt('poker_bg','#2a1a5a','#0a0620',extra);
  PT.forEach((p,i)=>{const col=i<5?20:166,row=i<5?i:i-5,y=29+row*15,on=mt>0&&lastPay===p[1];if(on){X.rr(col-4,y-3,140,13,3,(A.t>>3)%2?'#ffcf3f':'#ff9a3f');}T(p[0],col,y,on?'#1a1238':i<2?'#ffcf3f':'#cfd0ff',1,'l',1);T(String(p[1]*5),col+128,y,on?'#1a1238':K.y,1,'r',1);});
  const s=1.55,cw=22*s;hand.forEach((cd,i)=>{const x=46+i*48,y=124,t0=dealt[i],fl=t0&&A.t-t0<10?Math.abs(1-(A.t-t0)/5):1;const cxp=A.c;cxp.save();cxp.translate(x+cw/2,0);cxp.scale(Math.max(.05,fl),1);cxp.translate(-(x+cw/2),0);card(x,y,cd,!(t0&&A.t-t0<5),i===c&&ph==='hold',s);cxp.restore();
   if(hold[i]){X.rr(x+2,y+50,cw-4,11,5.5,X.lg(0,y+50,0,y+61,['#ffe070','#e0a020']));T('HELD',x+cw/2,y+52,'#3a2000',1,'c',1);}});
  X.bar('CHIPS '+g.score,'HAND '+(n+1)+'/10','JACKS OR BETTER',K.y,'#ffffff');
  if(ph==='hold'){X.panel(96,212,128,18,'#ffffff');T('A HOLD   B DRAW',160,218,'#ffffff',1,'c',1);}if(mt>0){X.panel(50,190,220,20,lastPay?K.y:'#ff4f6d');X.ot(msg,160,196,lastPay?K.y:'#ff8a9a',1,'c');}fx.draw();};
 return g;}});

/* ---- KLONDIKE ---- */
A.add({id:'klondike',name:'KLONDIKE',cat:'CARDS',how:'A PICKS UP / DROPS. UP SENDS TO FOUNDATION. A ON THE DECK DEALS.',make(){
 const g={over:null,score:0},fx=X.fx();let d=deck(),cols=[],found=[[],[],[],[]],waste=[],sel=null,cx=0,moves=0;for(let i=0;i<7;i++){cols.push([]);for(let j=0;j<=i;j++){const c=d.pop();c.up=j===i;cols[i].push(c);}}
 const red=c=>c.s<2;const canF=(c,f)=>f.length?f[f.length-1].s===c.s&&f[f.length-1].r===c.r-1:c.r===0;
 const canC=(c,col)=>col.length?col[col.length-1].up&&red(col[col.length-1])!==red(c)&&col[col.length-1].r===c.r+1:c.r===12;
 const top=()=>{if(cx===0)return waste.length?[waste,waste.length-1]:null;if(cx>=1&&cx<=7){const col=cols[cx-1];if(!col.length)return null;let i=col.length-1;return[col,i];}return null;};
 const SC=1.2,CW=22*SC,CH=30*SC,FX=i=>170+i*36,CX=i=>14+i*42,CY0=50;
 const ys=col=>{const o=[];let y=CY0;col.forEach((c,j)=>{o.push(y);y+=c.up?(col.length>12?9:11):5;});return o;};
 g.update=()=>{const h=A.hit(0);if(h.l)cx=(cx+7)%8;if(h.r)cx=(cx+1)%8;if(h.d&&sel&&sel[0]!==waste){if(sel[1]>0&&sel[0][sel[1]-1].up)sel=[sel[0],sel[1]-1];}
  if(h.u){const t=top();if(t){const c=t[0][t[1]];const fi=found.findIndex(f=>canF(c,f)),f=found[fi];if(f){f.push(t[0].pop());g.score+=10;moves++;S('coin');fx.spark(FX(fi)+CW/2,6+CH/2,K.y,10,2);fx.pop(FX(fi)+CW/2,30,'+10',K.y);if(t[0].length&&!t[0][t[0].length-1].up)t[0][t[0].length-1].up=true;sel=null;if(found.every(f=>f.length===13))g.over='SOLVED! WIN';}else S('lose');}}
  if(h.a){if(cx===8||(cx===0&&!waste.length&&false)){}
   if(cx===0&&!sel&&!waste.length&&!d.length){}if(cx===0&&!sel){if(d.length){waste.push(Object.assign(d.pop(),{up:true}));S('blip');moves++;}else if(waste.length){while(waste.length)d.push(waste.pop());S('blip');}return;}
   if(!sel){const t=top();if(t&&t[0][t[1]].up){sel=t;S('blip');}}else{if(cx>=1&&cx<=7){const col=cols[cx-1],run=sel[0].slice(sel[1]);if(sel[0]===col){sel=null;return;}if(canC(run[0],col)){col.push(...sel[0].splice(sel[1]));if(sel[0].length&&!sel[0][sel[0].length-1].up){sel[0][sel[0].length-1].up=true;g.score+=5;}moves++;S('hit');sel=null;}else{S('lose');sel=null;}}else sel=null;}}};
 const cur=(x,y,w,h)=>{const p=1+Math.sin(A.t*.25)*1;X.rrs(x-1-p,y-1-p,w+2+2*p,h+2+2*p,4,K.y,1.5);X.glow(x+w/2,y+h/2,w,K.y,.15);};
 g.draw=()=>{felt('klon_bg','#1f7a44','#083a1c');
  if(d.length)card(8,6,{},false,false,SC);else{slot(8,6,SC,'rgba(255,255,255,.35)');A.ring(8+CW/2,6+CH/2,6,'rgba(255,255,255,.5)');}
  if(waste.length){if(waste.length>1)card(40,6,waste[waste.length-2],true,false,SC);card(44,6,waste[waste.length-1],true,cx===0&&sel&&sel[0]===waste,SC);}else slot(44,6,SC);
  if(cx===0&&!sel)cur(waste.length?44:8,6,CW,CH);
  found.forEach((f,i)=>{if(f.length)card(FX(i),6,f[f.length-1],true,false,SC);else{slot(FX(i),6,SC,'rgba(255,255,255,.25)');suit(FX(i)+CW/2,6+CH/2,i,'rgba(255,255,255,.18)',1.6);}});
  cols.forEach((col,i)=>{const x=CX(i),Y=ys(col);if(!col.length){slot(x,CY0,SC,cx===i+1?K.y:'rgba(255,255,255,.25)');T('K',x+CW/2,CY0+CH/2-3,'rgba(255,255,255,.25)',1,'c',1);}col.forEach((c,j)=>card(x,Y[j],c,c.up,sel&&sel[0]===col&&j>=sel[1],SC));if(cx===i+1&&col.length&&!sel)cur(x,Y[col.length-1],CW,CH);if(cx===i+1&&sel)X.poly([[x+CW/2,CY0-6+Math.sin(A.t*.25)*2],[x+CW/2-4,CY0-11],[x+CW/2+4,CY0-11]],K.y);});
  X.rr(0,224,W,16,0,'rgba(0,0,0,.45)');T('MOVES '+moves+'   SCORE '+g.score,6,229,K.y,1,'l',1);T('DOWN = TAKE MORE OF A RUN',W-6,229,'#cfe8d0',1,'r',1);fx.draw();};
 return g;}});

/* ---- CRAZY EIGHTS ---- */
A.add({id:'eights',name:'CRAZY EIGHTS',cat:'CARDS',vs:1,how:'MATCH SUIT OR RANK. 8 IS WILD. A PLAYS, B DRAWS. EMPTY YOUR HAND.',make(){
 const g={over:null,score:0},fx=X.fx();let d=deck(),hands=[[],[]],pile=[],p=0,c=0,think=0,wild=-1,pickS=0,pt=-99;for(let i=0;i<7;i++){hands[0].push(d.pop());hands[1].push(d.pop());}pile.push(d.pop());
 const topS=()=>wild>=0?wild:pile[pile.length-1].s,topR=()=>pile[pile.length-1].r;const ok=cd=>cd.r===7||cd.s===topS()||cd.r===topR();
 const play=(i,hand)=>{const cd=hand.splice(i,1)[0];pile.push(cd);pt=A.t;wild=-1;S('hit');fx.ring(176,111,cd.r===7?K.y:'#ffffff',30);if(cd.r===7)fx.spark(176,111,K.y,14,2.4);if(!hand.length){g.over=A.win(p);return;}if(cd.r===7){if(p===1&&A.cpu){const cnt=[0,0,0,0];hands[1].forEach(x=>cnt[x.s]++);wild=cnt.indexOf(Math.max(...cnt));}else{wild=cd.s;pickS=1;return;}}p=1-p;think=0;c=0;};
 const draw=hand=>{if(!d.length){const t=pile.pop();while(pile.length)d.push(pile.pop());pile.push(t);for(let i=d.length-1;i>0;i--){const j=ri(i+1);[d[i],d[j]]=[d[j],d[i]];}}if(d.length)hand.push(d.pop());S('blip');};
 g.update=()=>{if(pickS){const h=A.hit(A.two?p:0);if(h.l)wild=(wild+3)%4;if(h.r)wild=(wild+1)%4;if(h.a){pickS=0;p=1-p;think=0;c=0;}return;}
  if(A.cpu&&p===1){if(++think>40){const hand=hands[1];let idx=-1;const opts=hand.map((cd,i)=>i).filter(i=>ok(hand[i]));if(opts.length){opts.sort((a,b)=>(hand[a].r===7?1:0)-(hand[b].r===7?1:0));idx=A.lvl?opts[0]:opts[ri(opts.length)];}if(idx>=0)play(idx,hand);else{draw(hand);const j=hand.length-1;if(ok(hand[j]))play(j,hand);else{p=0;think=0;}}}return;}
  const hand=hands[p],h=A.hit(A.two?p:0);if(!hand.length)return;c=cl(c,0,hand.length-1);if(h.l)c=(c+hand.length-1)%hand.length;if(h.r)c=(c+1)%hand.length;if(h.a){if(ok(hand[c]))play(c,hand);else{S('lose');A.shake=2;}}if(h.b){draw(hand);c=hand.length-1;if(!ok(hand[c])){p=1-p;think=0;c=0;}}};
 const extra=()=>{A.c.strokeStyle='rgba(255,255,255,.12)';A.c.lineWidth=1.5;A.c.beginPath();if(A.c.ellipse)A.c.ellipse(160,112,90,34,0,0,6.283);A.c.stroke();};
 g.draw=()=>{felt('eights_bg','#1a7a5a','#073a2a',extra);const ps=1.4;
  for(let k=Math.min(3,d.length)-1;k>=0;k--)card(110-k*1.2,90-k*1.2,{},false,false,ps);badge(125,136,String(d.length),'#ffffff');
  const tp=pile[pile.length-1],dt=A.t-pt,sc2=dt<8?1+(1-dt/8)*.4:1;if(pile.length>1)card(158,92,pile[pile.length-2],true,false,ps);card(160-(sc2-1)*15,90-(sc2-1)*20,tp,true,false,ps*sc2);
  if(wild>=0){X.panel(206,92,48,38,K.y);T('SUIT',230,96,'#ffffff',1,'c',1);X.disc(230,117,10,'#fff6e0');suit(230,117,wild,wild<2?'#d02040':'#1a1a2a',1.5);if(pickS){T('<',212,114,K.y,1,'c',1);T('>',248,114,K.y,1,'c',1);}}
  const show=(hand,y,face,hi,s)=>{const cw=22*s,w=Math.min(cw+3,250/Math.max(1,hand.length));hand.forEach((cd,i)=>{const pl=face&&p===(y>100?0:1)&&!pickS&&!(A.cpu&&p===1)&&ok(cd);card(160-(hand.length-1)*w/2-cw/2+i*w,y-(pl&&hi!==i?1.5:0),cd,face,hi===i,s);});};
  show(hands[1],22,A.two&&p===1||!!g.over,p===1&&!A.cpu&&!pickS?c:-1,1);show(hands[0],180,true,p===0&&!pickS?c:-1,1.25);
  X.bar(A.nm(0)+' '+hands[0].length,hands[1].length+' '+A.nm(1),'CARDS LEFT',K.c,K.p);
  const m=pickS?'PICK A SUIT: LEFT/RIGHT, A':A.nm(p)+(A.cpu&&p===1?' THINKS...':' TO PLAY   A PLAY   B DRAW');X.panel(50,146,220,16,p?K.p:K.c);T(m,160,151,K.y,1,'c',1);fx.draw();};
 return g;}});

/* ---- HI-LO ---- */
A.add({id:'hilo',name:'HI-LO',cat:'CARDS',how:'UP = NEXT IS HIGHER. DOWN = LOWER. BUILD A STREAK.',make(){
 const g={over:null,score:0},fx=X.fx();let d=deck(),cur=d.pop(),nxt=null,mt=0,msg='',streak=0,lives=3,gs=0,res=0;
 g.update=()=>{if(mt>0){mt--;if(mt===0){cur=nxt;nxt=null;if(d.length<2)d=deck();}return;}const h=A.hit(0);if(h.u||h.d){gs=h.u?1:-1;nxt=d.pop();const hi=nxt.r>cur.r,lo=nxt.r<cur.r;if((h.u&&hi)||(h.d&&lo)){streak++;g.score+=streak*10;msg='+'+streak*10;res=1;S('coin');fx.spark(227,105,K.y,10+streak*2,2.5);fx.ring(227,105,K.y,50);}else if(nxt.r===cur.r){msg='TIE';res=0;S('blip');}else{streak=0;lives--;msg='WRONG';res=-1;S('lose');A.shake=5;fx.flash('#ff2040',6);if(lives<=0){g.over='OUT OF LIVES';return;}}mt=45;}};
 const extra=()=>{X.rr(40,50,240,112,14,'rgba(0,0,0,.16)');X.rrs(40.5,50.5,239,111,14,'rgba(255,255,255,.08)',1);};
 g.draw=()=>{felt('hilo_bg','#3a1a6a','#0d0626',extra);
  X.glow(93,105,60,'#9a8aff',.15);card(60,60,cur,true,false,3);
  const f=mt>0?Math.min(1,(45-mt)/8):0,sx=nxt?Math.abs(Math.cos(f*3.1416)):1,face=nxt&&f>.5,cxp=A.c;cxp.save();cxp.translate(227,0);cxp.scale(Math.max(.04,sx),1);cxp.translate(-227,0);card(194,60,face?nxt:{},!!face,false,3);cxp.restore();if(!nxt){X.ot('?',227,96,'#ffffff',4,'c');}
  const up=Math.sin(A.t*.15)*2;X.poly([[160,72-up],[150,84-up],[170,84-up]],gs>0&&mt?K.g:'rgba(255,255,255,.7)');X.poly([[160,138+up],[150,126+up],[170,126+up]],gs<0&&mt?K.g:'rgba(255,255,255,.7)');T('UP',160,88,'#ffffff',1,'c',1);T('DN',160,116,'#ffffff',1,'c',1);
  X.bar('SCORE '+g.score,'','STREAK '+streak,K.y);for(let i=0;i<3;i++)X.heart(W-12-i*13,7,1.3,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');
  for(let i=0;i<Math.min(10,streak);i++)X.orb(115+i*10,166,3.5,i<5?K.c:i<8?K.y:K.o);
  if(mt){X.panel(90,180,140,26,res>0?K.y:res<0?'#ff4f6d':'#ffffff');X.ot(msg,160,187,res>0?K.y:res<0?'#ff8a9a':'#ffffff',2,'c');}else{X.panel(56,182,208,22,'#ffffff');T('UP HIGHER     DOWN LOWER',160,189,'#ffffff',1,'c',1);}fx.draw();};
 return g;}});

/* ---- CARD CLASH ---- */
A.add({id:'clash',name:'CARD CLASH',cat:'CARDS',vs:1,how:'PICK A CARD EACH ROUND. HIGHER WINS, SUIT BEATS: H>D>C>S>H ON TIES. 7 ROUNDS.',make(){
 const g={over:null,score:0},fx=X.fx();let d=deck(),hands=[[],[]],c=0,pick=[-1,-1],sc=[0,0],round=0,mt=0,msg='',lw=-1;for(let i=0;i<7;i++){hands[0].push(d.pop());hands[1].push(d.pop());}
 const beats=(a,b)=>a.r!==b.r?a.r>b.r:(a.s+1)%4===b.s;
 const resolve=()=>{const a=hands[0].splice(pick[0],1)[0],b=hands[1].splice(pick[1],1)[0];const w=beats(a,b)?0:beats(b,a)?1:-1;lw=w;if(w>=0){sc[w]++;const x=w?199:121;fx.spark(x,104,w?K.p:K.c,18,2.6);fx.ring(x,104,w?K.p:K.c,36);A.shake=3;}msg=w<0?'DRAW':A.nm(w)+' TAKES IT';mt=60;round++;S(w===0?'score':w===1?'lose':'blip');last=[a,b];};let last=null;
 g.update=()=>{if(mt>0){mt--;if(mt===0){pick=[-1,-1];c=0;if(round>=7)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}return;}
  for(let i=0;i<2;i++){if(pick[i]>=0)continue;if(i===1&&A.cpu){const hand=hands[1];if(A.lvl===0)pick[1]=ri(hand.length);else{const s=hand.map(x=>x.r);pick[1]=A.lvl===2&&round%2?s.indexOf(Math.min(...s)):s.indexOf(Math.max(...s));}continue;}
   const h=A.hit(A.two?i:0),hand=hands[i];if(h.l)c=(c+hand.length-1)%hand.length;if(h.r)c=(c+1)%hand.length;if(h.a){pick[i]=c;c=0;S('blip');}}
  if(pick[0]>=0&&pick[1]>=0)resolve();};
 const extra=()=>{X.rr(30,72,260,90,12,'rgba(0,0,0,.18)');X.rrs(30.5,72.5,259,89,12,'rgba(255,255,255,.12)',1);A.text('VS',160,98,'rgba(255,255,255,.12)',3,'c',1);};
 g.draw=()=>{felt('clash_bg','#4a1a3a','#12061a',extra);const show=(hand,y,face,hi,s)=>{const w=22*s+5;hand.forEach((cd,i)=>card(160-(hand.length*w-5)/2+i*w,y,cd,face,hi===i,s));};
  show(hands[1],22,A.two||!!g.over,pick[1]<0&&!A.cpu&&pick[0]>=0?c:-1,1.1);show(hands[0],182,true,pick[0]<0?c:-1,1.25);
  if(mt>0&&last){const f=Math.min(1,(60-mt)/8);for(let i=0;i<2;i++){const s=1.6*(lw===i?1.1:1),tx=i?184:100,x=160+(tx-160)*f;if(lw===i)X.glow(x+18,104,40,i?K.p:K.c,.35);card(x,80,last[i],true,false,s);}X.panel(90,140,140,20,lw<0?'#ffffff':lw?K.p:K.c);X.ot(msg,160,146,K.y,1,'c');}
  else{X.ot(pick[0]<0?A.nm(0)+' PICKS':A.nm(1)+' PICKS',160,104,'#ffffff',2,'c');}
  const lg=162;['H','D','C','S'].forEach((_,i)=>{suit(124+i*20,lg+6,i,i<2?'#ff6a80':'#e0e0f0',1);if(i<3)T('>',134+i*20,lg+3,'rgba(255,255,255,.5)',1,'c',1);});T('>',194,lg+3,'rgba(255,255,255,.5)',1,'c',1);suit(204,lg+6,0,'#ff6a80',1);
  X.bar(A.nm(0)+' '+sc[0],sc[1]+' '+A.nm(1),'ROUND '+Math.min(round+1,7)+'/7',K.c,K.p);fx.draw();};
 return g;}});
})();
