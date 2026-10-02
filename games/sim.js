(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};
const coin=(x,y,r)=>{X.orb(x,y,r,'#ffcf3f');A.line(x,y-r*.55,x,y+r*.55,'#a06a00',Math.max(.8,r*.32));};
const TM=(s,x,y,col,sc,al,ns)=>{s=String(s);sc=sc||1;const w=s.length*4*sc-sc,x0=al==='c'?x-w/2:al==='r'?x-w:x;A.text(s.replace(/\$/g,' '),x,y,col,sc,al,ns);for(let i=0;i<s.length;i++)if(s[i]==='$')coin(x0+i*4*sc+1.5*sc,y+2.5*sc,2.3*sc);};
const eye=(x,y,r)=>{X.disc(x,y,r||1.4,'#1a1a1a');X.disc(x-.4,y-.5,(r||1.4)*.4,'#ffffff');};
const leg=(x,y,h,col,w)=>X.rr(x-(w||3)/2,y,w||3,h,1,col);
/* vector animals: origin = body centre, feet near y+12 */
const AN=[{n:'LION',c:'#d9a55b',c2:'#8a5c33',cost:60,draw:60,d(x,y,f){const br=Math.sin(f*.08)*.6,tw=Math.sin(f*.1)*3;X.shadow(x,y+12,13,2.5,.25);X.stroke([[x-10,y-1],[x-15,y-4+tw*.3],[x-17,y-9+tw]],'#c08a48',1.6);X.disc(x-17,y-9+tw,2.2,'#8a5c33');
  leg(x-7,y+3,9,'#c89048');leg(x+5,y+3,9,'#c89048');X.ell(x-1,y+br*.3,11,7+br*.4,X.lg(0,y-7,0,y+7,['#f0c070','#d9a55b','#b07a3a']));leg(x-4,y+4,8,'#d9a55b');leg(x+8,y+4,8,'#d9a55b');
  for(let k=0;k<10;k++){const a=k*.628;X.disc(x+9+Math.cos(a)*7,y-6+Math.sin(a)*7,3.2,k%2?'#8a5c33':'#a0682e');}X.disc(x+9,y-6,6,'#e8b468');X.disc(x+5,y-11,1.6,'#c08a48');X.disc(x+13,y-11,1.6,'#c08a48');eye(x+7,y-7,1.1);eye(x+11.5,y-7,1.1);X.ell(x+10,y-3.5,2.6,1.8,'#f4d8a0');X.poly([[x+8.8,y-4.6],[x+11.2,y-4.6],[x+10,y-3.2]],'#5a3020');}},
 {n:'PENGUIN',c:'#222233',c2:'#ffffff',cost:30,draw:30,d(x,y,f){const fl=Math.sin(f*.15)*.5,wd=Math.sin(f*.05)*.08;X.shadow(x,y+12,8,2,.25);A.c.save();A.c.translate(x,y+12);A.c.rotate(wd);A.c.translate(-x,-y-12);
  X.ell(x-3,y+11,3,1.4,'#ff9a20');X.ell(x+3,y+11,3,1.4,'#ff9a20');X.ell(x,y-1,8,12,X.lg(x-8,0,x+8,0,['#3a3a50','#1a1a28']));X.ell(x+1,y+1,5.5,9,X.lg(0,y-8,0,y+10,['#ffffff','#e8eef8']));
  X.ell(x-7,y,2.2,6,'#2a2a3a',.3+fl);X.ell(x+7,y,2.2,6,'#2a2a3a',-.3-fl);eye(x-2,y-8,1.1);eye(x+3,y-8,1.1);X.poly([[x-.5,y-6.5],[x+4,y-5.5],[x-.5,y-4.5]],'#ff9a20');X.ell(x-3.5,y-5.5,1.3,.8,'rgba(255,150,170,.6)');A.c.restore();}},
 {n:'MONKEY',c:'#8a5c33',c2:'#ffd9a8',cost:40,draw:45,d(x,y,f){const sw=Math.sin(f*.2)*3;X.shadow(x,y+12,9,2,.25);X.stroke([[x+6,y+5],[x+13,y+2],[x+14,y-6+sw],[x+11,y-8+sw]],'#7a4c28',2);
  leg(x-4,y+5,7,'#7a4c28',3.5);leg(x+3,y+5,7,'#7a4c28',3.5);X.ell(x,y+1,7,8,X.lg(0,y-7,0,y+9,['#a06a3c','#7a4c28']));X.ell(x,y+3,4,5,'#e8c090');X.stroke([[x-6,y-2],[x-10,y+4+sw*.4]],'#7a4c28',3);
  X.disc(x-6.5,y-11,3,'#8a5c33');X.disc(x+6.5,y-11,3,'#8a5c33');X.disc(x-6.5,y-11,1.6,'#e8b080');X.disc(x+6.5,y-11,1.6,'#e8b080');X.disc(x,y-10,6.5,'#8a5c33');X.ell(x,y-8.5,4.5,4,'#f0c898');eye(x-2,y-10,1);eye(x+2,y-10,1);X.rr(x-1.5,y-6.5,3,1,.5,'#6a3a20');}},
 {n:'GIRAFFE',c:'#f0c040',c2:'#a0521a',cost:80,draw:70,d(x,y,f){const nb=Math.sin(f*.05)*1.5;X.shadow(x,y+12,12,2.5,.25);leg(x-7,y+3,10,'#d8a830',2.5);leg(x+5,y+3,10,'#d8a830',2.5);
  X.poly([[x+3,y-2],[x+7,y-2],[x+9+nb,y-22],[x+5+nb,y-22]],'#f0c040');X.ell(x,y+1,10,6,X.lg(0,y-5,0,y+7,['#ffd860','#f0c040','#c89a20']));leg(x-4,y+3,10,'#f0c040',2.5);leg(x+8,y+3,10,'#f0c040',2.5);
  [[x-5,y-1],[x+1,y+2],[x+5,y-2],[x-1,y-3],[x+6,y-11],[x+7,y-17],[x-8,y+2]].forEach((p,i)=>X.ell(p[0]+(i>3?nb*.6:0),p[1],1.8,1.4,'#a0521a'));
  X.ell(x+9+nb,y-24,5,3,'#f0c040');X.ell(x+13+nb,y-23,2.4,2,'#f4d890');A.line(x+6+nb,y-27,x+6+nb,y-30,'#a0521a',1);A.line(x+8+nb,y-27,x+8+nb,y-30,'#a0521a',1);X.disc(x+6+nb,y-30,1,'#6a3a10');X.disc(x+8+nb,y-30,1,'#6a3a10');eye(x+9+nb,y-25,.9);X.stroke([[x-10,y-1],[x-12,y+5]],'#c89a20',1);}},
 {n:'PANDA',c:'#ffffff',c2:'#111111',cost:100,draw:90,d(x,y,f){const ch=Math.sin(f*.12);X.shadow(x,y+12,12,2.5,.25);X.rr(x-9,y+3,6,9,3,'#1a1a1a');X.rr(x+3,y+3,6,9,3,'#1a1a1a');X.ell(x,y,10,8,X.lg(0,y-8,0,y+8,['#ffffff','#e4e4ec']));X.ell(x,y-1,10.5,3.5,'#1a1a1a');
  X.disc(x-6.5,y-14,3,'#1a1a1a');X.disc(x+6.5,y-14,3,'#1a1a1a');X.disc(x,y-9,7.5,X.rg(x-2,y-12,0,x,y-9,8,['#ffffff','#e8e8f0']));X.ell(x-3,y-9.5,2.3,3,'#1a1a1a',.4);X.ell(x+3,y-9.5,2.3,3,'#1a1a1a',-.4);X.disc(x-3,y-10,.9,'#ffffff');X.disc(x+3,y-10,.9,'#ffffff');X.ell(x,y-6,1.6,1,'#1a1a1a');
  X.stroke([[x+8,y-3],[x+5,y-6+ch]],'#1a1a1a',3.5);X.stroke([[x+5,y-7+ch],[x+3,y-12+ch]],'#4a9a3a',1.5);}},
 {n:'FLAMINGO',c:'#ff70a8',c2:'#111111',cost:50,draw:50,d(x,y,f){const bb=Math.sin(f*.06)*1.5;X.shadow(x,y+12,8,2,.25);X.stroke([[x,y+3],[x+1,y+7],[x-1,y+12]],'#e86090',1.2);X.stroke([[x,y+3],[x+3,y+8],[x+.5,y+8]],'#e86090',1.2);
  X.ell(x,y-1+bb*.3,8,5,X.lg(0,y-6,0,y+4,['#ffa0c8','#ff70a8','#e05090']));X.ell(x-2,y-1,5,3,'#ff5a98',-.2);X.stroke([[x+5,y-3],[x+8,y-9],[x+5,y-14],[x+6,y-19+bb]],'#ff70a8',2.2);X.disc(x+7,y-20+bb,2.8,'#ff80b0');
  X.poly([[x+9,y-21+bb],[x+13,y-19+bb],[x+11,y-16+bb],[x+9,y-18.5+bb]],'#f4f0e6');X.poly([[x+11.5,y-18.5+bb],[x+13,y-19+bb],[x+11,y-16+bb]],'#1a1a1a');eye(x+7.5,y-21+bb,.8);}}];

/* ---- PIXEL ZOO ---- */
A.add({id:'zoo',name:'PIXEL ZOO',cat:'SIM',how:'A BUYS AN ANIMAL. B FEEDS. HAPPY ANIMALS BRING VISITORS. 3 MIN.',make(){
 const g={over:null,score:0},fx=X.fx();let pens=Array(9).fill(null),c={x:0,y:0},money=120,time=10800,vis=[],pick=0,t=0,msg='',mt=0;const CU=c;
 const PX=i=>20+(i%3)*100,PY=i=>50+((i/3)|0)*58;
 g.update=()=>{t++;time--;if(mt>0)mt--;const h=A.hit(0);mvCur(h,c,3,3);const i=c.y*3+c.x;if(h.l||h.r||h.u||h.d)S('blip');
  if(h.a){if(!pens[i]){if(money>=AN[pick].cost){money-=AN[pick].cost;pens[i]={a:pick,hun:100,t:0};S('coin');fx.spark(PX(i)+45,PY(i)+28,K.y,14,2.2);fx.pop(PX(i)+45,PY(i)+10,'-'+AN[pick].cost,'#ff8a9a');pick=(pick+1)%AN.length;}else{msg='NEED '+AN[pick].cost+' COINS';mt=40;S('lose');}}else{pick=(pick+1)%AN.length;S('blip');}}
  if(h.b&&pens[i]){if(money>=10){money-=10;pens[i].hun=100;S('coin');pens[i].fed=30;fx.spark(PX(i)+45,PY(i)+30,'#ffd080',8,1.5);}else{msg='NO MONEY';mt=40;}}
  let draw=0;pens.forEach((p,j)=>{if(!p)return;p.t++;if(p.fed>0)p.fed--;if(t%30===0)p.hun-=1+(AN[p.a].cost/50|0);if(p.hun<=0){pens[j]=null;msg=AN[p.a].n+' LEFT THE ZOO';mt=60;S('boom');fx.debris(PX(j)+45,PY(j)+28,AN[p.a].c,8,1.8);return;}if(p.hun>30)draw+=AN[p.a].draw*(p.hun>70?1:.5);});
  if(t%Math.max(10,120-draw/3|0)===0&&draw>0){vis.push({x:-10,y:225+rnd(10),v:.6+rnd(.6),id:ri(6)});money+=3;g.score+=3;}vis.forEach(v=>v.x+=v.v);vis=vis.filter(v=>v.x<W+10);
  if(time<=0){g.score=money;g.over='$'+money+' RAISED';}};
 const bg=()=>{X.sky(['#4a90e0','#a8d8ff'],44);X.hills(44,14,'#5aa04a',0,.03,2);X.vg(0,40,W,H-40,['#5aa54a','#3f8a3a']);const cx=A.c;cx.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<300;i++)cx.fillRect((i*71)%W,40+(i*37)%180,2,1);
  X.vg(0,214,W,26,['#d8c08a','#c4a870']);cx.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<40;i++)cx.fillRect((i*29)%W,216+(i*7)%22,3,1);X.rr(0,213,W,2,0,'#a08860');
  for(let i=0;i<9;i++){const x=PX(i),y=PY(i);X.shadow(x+45,y+50,48,4,.2);}};
 const pen=(i,p,sel)=>{const x=PX(i),y=PY(i),cx=A.c,a=p?p.a:-1;
  X.rr(x,y,90,50,3,a===1?X.lg(0,y,0,y+50,['#d8f0ff','#a8d0f0']):a===5?X.lg(0,y,0,y+50,['#7ac0e0','#5aa04a']):X.lg(0,y,0,y+50,[p?'#7ac860':'#6a9a50','#4a8a3a']));
  if(a===1){X.ell(x+70,y+38,14,6,'#4a9ae0');X.ell(x+70,y+37,10,3,'rgba(255,255,255,.4)');}else if(a===5)X.ell(x+22,y+38,16,6,'#3a8ad0');else if(a===2||a===4){X.rr(x+70,y+8,3,36,1,'#7a5030');X.disc(x+71,y+8,9,'#3a8a3a');}else if(p)for(let k=0;k<5;k++){X.poly([[x+8+k*17,y+44],[x+10+k*17,y+38],[x+12+k*17,y+44]],'#3a7a2a');}
  if(p){AN[p.a].d(x+42,y+28,p.t);if(p.fed>0)for(let k=0;k<3;k++)X.heart(x+42+(k-1)*8,y+8-(30-p.fed)*.4,.8,'#ff4f6d');X.panel(x+3,y+3,46,8);X.meter(x+5,y+5,42,4,p.hun/100,p.hun>30?K.g:K.r);if(p.hun<30){const b=A.t%30<15;X.disc(x+80,y+10,7,'#ffffff');X.disc(x+74,y+17,1.6,'#ffffff');T('!',x+80,y+6,b?K.r:'#aa3030',1,'c',1);}}
  else{T('EMPTY',x+45,y+18,'rgba(255,255,255,.55)',1,'c',1);TM('$'+AN[pick].cost,x+45,y+28,'rgba(255,255,255,.4)',1,'c',1);}
  cx.fillStyle='#8a5c33';for(let k=0;k<10;k++){X.rr(x+k*10-1,y+40,3,12,1,X.lg(0,y+40,0,y+52,['#b07a48','#7a4c28']));}X.rr(x-2,y+43,94,2.5,1,'#a06a3a');X.rr(x-2,y+48,94,2.5,1,'#8a5c33');X.rrs(x+.5,y+.5,89,49,3,'rgba(90,60,30,.8)',1.5);
  if(sel){const pu=1+Math.sin(A.t*.25);X.rrs(x-2-pu,y-2-pu,94+2*pu,54+2*pu,5,K.y,2);X.glow(x+45,y+25,50,K.y,.12);}};
 g.draw=()=>{X.cache('zoo_bg',bg);for(let i=0;i<9;i++)pen(i,pens[i],CU.y*3+CU.x===i);
  vis.forEach(v=>A.person(v.x,v.y+4,{s:.5,c:['#ff4f6d','#2fe8d0','#ff70d0','#ff9a3f','#7a8aff','#4fd06a'][v.id],st:A.t*.3+v.x,d:1,id:v.id}));
  X.bar('  '+money,Math.ceil(time/60)+' SEC','',K.y,'#ffffff');coin(12,9,5);X.panel(206,19,112,22,'#ffcf3f');A.c.save();A.c.translate(216,34);A.c.scale(.55,.55);AN[pick].d(0,0,A.t);A.c.restore();T('NEXT '+AN[pick].n,229,22,'#ffffff',1,'l',1);TM('$'+AN[pick].cost,229,31,money>=AN[pick].cost?K.g:K.r,1,'l',1);
  TM('A BUY/NEXT  B FEED $10',6,24,'#ffffff',1,'l',1);if(mt>0)X.ot(msg,102,33,K.y,1,'c');fx.draw();};
 return g;}});

/* ---- SAFARI SNAP ---- */
A.add({id:'safari',name:'SAFARI SNAP',cat:'SIM',how:'MOVE THE CAMERA. A SNAPS. CLOSER + CENTRED = MORE POINTS. 24 SHOTS.',make(){
 const g={over:null,score:0},fx=X.fx();let cx=160,cy=120,an=[],shots=24,fl=0,msg='',mt=0,t=0,snap=null;
 const spawn=()=>{const a=ri(AN.length),z=.5+rnd(.9);an.push({a,x:Math.random()<.5?-30:W+30,y:100+z*60,z,v:(.4+rnd(.8))*(z),d:0});an[an.length-1].d=an[an.length-1].x<0?1:-1;};for(let i=0;i<3;i++)spawn();
 g.update=()=>{t++;if(fl>0)fl--;if(mt>0)mt--;const k=A.in(0);if(A.mouse.t>0){cx=cl(A.mouse.x,20,W-20);cy=cl(A.mouse.y,60,200);}else{cx=cl(cx+ax(k)*3,20,W-20);cy=cl(cy+ay(k)*3,60,200);}an.forEach(o=>{o.x+=o.d*o.v;});an=an.filter(o=>o.x>-40&&o.x<W+40);if(t%90===0&&an.length<5)spawn();
  if(A.hit(0).a&&shots>0){shots--;fl=6;S('shoot');let best=null,bd=1e9;for(const o of an){const d=Math.hypot(o.x-cx,o.y-cy);if(d<40*o.z&&d<bd){bd=d;best=o;}}if(best){const p=Math.round((40*best.z-bd)/(40*best.z)*50*best.z+10);g.score+=p;msg=AN[best.a].n+' +'+p;S('coin');snap={a:best.a,p,t:60};fx.pop(cx,cy-30,'+'+p,K.y);}else{msg='EMPTY SHOT';snap=null;}mt=50;if(shots===0)g.over='FILM FULL';}};
 const acacia=(x,y,s)=>{X.stroke([[x,y],[x+2*s,y-14*s],[x-6*s,y-22*s]],'#3a2414',2*s);X.stroke([[x+2*s,y-14*s],[x+8*s,y-22*s]],'#3a2414',1.6*s);X.ell(x,y-24*s,20*s,4*s,'#2a4a1a');X.ell(x+4*s,y-26*s,14*s,3*s,'#3a5a24');};
 const bg=()=>{X.sky(['#ff7a38','#ffb060','#ffe0a0'],100);X.disc(230,62,22,X.rg(230,62,0,230,62,22,['#fff8d0','#ffd060','#ffb040']));X.glow(230,62,70,'#ffd080',.4);
  X.hills(96,14,'#c47a48',0,.02,3);X.hills(100,8,'#a86a3a',80,.04,6);X.vg(0,92,W,H-92,['#d8b058','#c4a54a','#a8883a']);const c=A.c;c.fillStyle='rgba(120,80,20,.25)';for(let i=0;i<220;i++)c.fillRect((i*53)%W,94+(i*29)%146,2+(i%3),1);
  acacia(40,96,.8);acacia(150,94,.6);acacia(290,98,1);acacia(100,95,.45);c.fillStyle='rgba(60,40,20,.5)';[[70,60],[90,54],[110,62]].forEach(b=>{c.fillRect(b[0],b[1],3,1);c.fillRect(b[0]+1,b[1]-1,1,1);});};
 g.draw=()=>{X.cache('safari_bg',bg);an.slice().sort((a,b)=>a.z-b.z).forEach(o=>{A.c.save();A.c.translate(o.x,o.y);A.c.scale(o.z*1.3*o.d,o.z*1.3);AN[o.a].d(0,0,t);A.c.restore();});
  const c=A.c;for(let i=0;i<24;i++){const x=(i*41)%W,y=200+(i*13)%40;X.poly([[x-3,y+4],[x,y-6-(i%3)*2],[x+3,y+4]],'#8a7028');}
  c.fillStyle='rgba(0,0,0,.28)';c.fillRect(0,0,W,cy-22);c.fillRect(0,cy+22,W,H-cy-22);c.fillRect(0,cy-22,cx-30,44);c.fillRect(cx+30,cy-22,W-cx-30,44);
  let foc=false;for(const o of an)if(Math.hypot(o.x-cx,o.y-cy)<40*o.z)foc=true;const bc=foc?K.g:'#ffffff';[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{const x=cx+sx*30,y=cy+sy*22;X.stroke([[x,y-sy*8],[x,y],[x-sx*10,y]],bc,2);});
  A.line(cx-6,cy,cx-2,cy,bc,1);A.line(cx+2,cy,cx+6,cy,bc,1);A.line(cx,cy-6,cx,cy-2,bc,1);A.line(cx,cy+2,cx,cy+6,bc,1);if(foc)T('FOCUS',cx,cy+14,K.g,1,'c',1);if(A.t%40<26)X.disc(cx-24,cy-16,1.6,'#ff3040');
  if(snap&&mt>0){const sx=8,sy=150,sl=Math.min(1,(50-mt)/8);c.save();c.translate(sx+28,sy+30-(1-sl)*30);c.rotate(-.12);X.rr(-28,-30,56,62,2,'#fffaf0');X.rr(-24,-26,48,40,1,X.lg(0,-26,0,14,['#ffb060','#d8b058']));c.save();c.translate(0,-4);c.scale(.9,.9);AN[snap.a].d(0,0,t);c.restore();T(AN[snap.a].n,0,18,'#3a2a1a',1,'c',1);c.restore();}
  if(fl>0){c.fillStyle='rgba(255,255,255,'+fl/7+')';c.fillRect(0,0,W,H);}
  X.bar('SCORE '+g.score,'','',K.y);for(let i=0;i<24;i++)X.rr(W-8-i*5,5,4,7,1,i<shots?'#f4f0e6':'rgba(255,255,255,.15)');if(mt>0){X.panel(90,212,140,18,snap?K.y:'#ffffff');X.ot(msg,160,217,snap?K.y:'#ffffff',1,'c');}fx.draw();};
 return g;}});

/* ---- POCKET PET ---- */
A.add({id:'pet',name:'POCKET PET',cat:'SIM',how:'LEFT FEED, UP PLAY, RIGHT WASH, DOWN SLEEP. KEEP ALL BARS UP. EARN AGE.',make(){
 const g={over:null,score:0},fx=X.fx();let s={food:70,fun:70,clean:70,rest:70},t=0,act='',at=0,age=0,mood=0;
 g.update=()=>{t++;if(at>0){at--;if(act==='WASH'&&at%4===0)fx.spark(160+rnd(40)-20,110+rnd(30),'#bfe8ff',2,1.2);return;}const h=A.hit(0);if(h.l){act='EAT';at=30;s.food=Math.min(100,s.food+30);s.clean-=5;S('coin');}if(h.u){act='PLAY';at=30;s.fun=Math.min(100,s.fun+30);s.rest-=8;s.food-=5;S('jump');}if(h.r){act='WASH';at=30;s.clean=Math.min(100,s.clean+40);S('blip');}if(h.d){act='SLEEP';at=60;s.rest=Math.min(100,s.rest+40);s.fun-=5;S('blip');}
  if(h.l||h.u||h.r||h.d)fx.ring(160,120,'#ffffff',40);
  if(t%40===0){s.food-=1.2+age*.05;s.fun-=1+age*.04;s.clean-=.7;s.rest-=.8;}for(const k in s)s[k]=cl(s[k],0,100);mood=(s.food+s.fun+s.clean+s.rest)/4;if(t%300===0){age++;g.score=age*10+(mood|0);fx.pop(160,70,'AGE '+age+'!',K.y);fx.spark(160,110,K.y,16,2.2);}
  if(Object.values(s).some(v=>v<=0))g.over='PET RAN AWAY AT AGE '+age;};
 const bg=()=>{X.vg(0,0,W,H,['#ffd8e0','#f8c0d0']);const c=A.c;c.fillStyle='rgba(255,255,255,.35)';for(let y=20;y<150;y+=16)for(let x=(y/16%2)*8;x<W;x+=16)X.disc(x,y,2,'rgba(255,255,255,.35)');
  X.rr(214,30,70,56,3,'#8a5c33');X.rr(218,34,62,48,2,X.lg(0,34,0,82,['#7ac8ff','#c8ecff']));X.ell(240,50,10,4,'rgba(255,255,255,.8)');A.line(249,34,249,82,'#8a5c33',2);A.line(218,58,280,58,'#8a5c33',2);
  X.rr(30,40,40,30,2,'#6a4a2a');X.rr(33,43,34,24,1,X.lg(0,43,0,67,['#5ab0e0','#3a8a3a']));X.wood(0,150,W,H-150,'#c89060');X.rr(0,148,W,4,0,'#a87040');X.ell(160,176,90,16,'#7a5ae0');X.ell(160,176,74,11,'#9a7aff');X.vignette(.35);};
 g.draw=()=>{X.cache('pet_bg',bg);const c=A.c,bob=Math.sin(t*.1)*3,sl=act==='SLEEP'&&at,x=160,y=128+(sl?4:bob),happy=mood>60,sq=act==='PLAY'&&at?Math.abs(Math.sin(at*.3))*.12:0,yJ=act==='PLAY'&&at?-Math.abs(Math.sin(at*.3))*16:0;
  if(sl){c.fillStyle='rgba(10,10,60,.45)';c.fillRect(0,0,W,H);}
  X.shadow(x,y+30,28-yJ*.4,6,.3);c.save();c.translate(x,y+yJ+28);c.scale(1+sq,1-sq);c.translate(-x,-(y+28));
  const bc=act==='WASH'&&at?'#fff0a0':'#ffcf3f';X.disc(x-21,y-20,9,bc);X.disc(x+21,y-20,9,bc);X.disc(x-21,y-20,5,'#ff9ab0');X.disc(x+21,y-20,5,'#ff9ab0');X.disc(x,y,29,X.rg(x-10,y-12,2,x,y,29,['#fff4b0',bc,'#e0a020']));X.ell(x-10,y-14,8,5,'rgba(255,255,255,.45)',-.5);
  if(s.clean<40)[[x-12,y+8],[x+14,y-4],[x+4,y+16]].forEach(p=>X.ell(p[0],p[1],3.5,2.5,'rgba(110,80,40,.55)'));
  if(sl){A.line(x-14,y-5,x-6,y-5,'#3a2a1a',2);A.line(x+6,y-5,x+14,y-5,'#3a2a1a',2);}else{const bl=(t%160)<6;if(bl){A.line(x-14,y-6,x-6,y-6,'#3a2a1a',2);A.line(x+6,y-6,x+14,y-6,'#3a2a1a',2);}else{X.ell(x-10,y-6,4,5,'#2a1a1a');X.ell(x+10,y-6,4,5,'#2a1a1a');X.disc(x-11,y-8,1.6,'#ffffff');X.disc(x+9,y-8,1.6,'#ffffff');}}
  X.ell(x-18,y+3,4,2.5,'rgba(255,110,140,.5)');X.ell(x+18,y+3,4,2.5,'rgba(255,110,140,.5)');
  if(act==='EAT'&&at){const o=Math.abs(Math.sin(at*.5))*4;X.ell(x,y+10,6,2+o,'#6a2a2a');}else if(happy)X.poly([[x-8,y+7],[x+8,y+7],[x+5,y+13],[x-5,y+13]],'#6a2a2a');else X.stroke([[x-7,y+12],[x,y+9],[x+7,y+12]],'#6a2a2a',2);
  c.restore();
  if(sl)for(let k=0;k<3;k++){const zz=(at+k*20)%60;X.ot('Z',x+28+k*6+zz*.2,y-30-zz*.6,'#ffffff',1+(k===2?1:0),'c');}
  if(act==='EAT'&&at){X.ell(x-48,y+26,14,4,'#d04040');X.ell(x-48,y+23,12,3,'#ffb060');for(let k=0;k<4;k++)X.disc(x-54+k*4,y+22,1.5,'#a06030');}
  if(act==='PLAY'&&at){const by=y+10-Math.abs(Math.sin(at*.3))*28;X.shadow(x+44,y+30,6,2,.25);X.orb(x+44,by,7,'#ff4f8a');A.line(x+38,by,x+50,by,'rgba(255,255,255,.6)',1);}
  if(act==='WASH'&&at){for(let k=0;k<8;k++){const dx=x-30+k*8,dy=y-50+((at*3+k*11)%40);A.line(dx,dy,dx-1,dy+4,'#7ac8ff',1.5);}for(let k=0;k<6;k++)X.orb(x-22+k*9,y+22-((k*7+at)%8),3+k%2,'#e8f8ff');}
  [['FOOD',s.food,'#ff9a3f'],['FUN',s.fun,'#ff70d0'],['CLEAN',s.clean,'#4fb0ff'],['REST',s.rest,'#4fd06a']].forEach((b,i)=>{const bx=6+i*78;X.panel(bx,196,74,22,b[1]<25?'#ff4f6d':b[2]);T(['<','^','>','V'][i]+' '+b[0],bx+5,200,b[1]<25&&A.t%30<15?'#ff4f6d':'#ffffff',1,'l',1);X.meter(bx+5,209,64,6,b[1]/100,b[1]<25?'#ff4f6d':b[2]);});
  X.bar('AGE '+age,happy?'HAPPY':'GRUMPY','',K.y,happy?K.g:K.r);T('LEFT FEED  UP PLAY  RIGHT WASH  DOWN SLEEP',160,228,'#5a3a4a',1,'c',1);fx.draw();};
 return g;}});

/* ---- FARM PLOT ---- */
A.add({id:'farm',name:'FARM PLOT',cat:'SIM',how:'A PLANTS (5). A AGAIN HARVESTS WHEN RIPE. B WATERS. 2 MIN.',make(){
 const g={over:null,score:0},fx=X.fx();let plots=Array(12).fill(null),c={x:0,y:0},money=30,time=7200,t=0;const CU=c;const CROPS=[{n:'WHEAT',t:400,v:12,c:'#f0c040'},{n:'CARROT',t:600,v:20,c:'#ff8a20'},{n:'BERRY',t:900,v:35,c:'#d0306a'}];
 const PX=i=>24+(i%4)*70,PY=i=>52+((i/4)|0)*58;
 g.update=()=>{t++;time--;const h=A.hit(0);mvCur(h,c,4,3);const i=c.y*4+c.x,p=plots[i];
  if(h.a){if(!p){if(money>=5){money-=5;plots[i]={k:ri(3),g:0,w:0};S('blip');fx.debris(PX(i)+30,PY(i)+30,'#6a4a28',6,1.4);}else S('lose');}else if(p.g>=CROPS[p.k].t){money+=CROPS[p.k].v;g.score+=CROPS[p.k].v;fx.spark(PX(i)+30,PY(i)+20,CROPS[p.k].c,14,2.4);fx.pop(PX(i)+30,PY(i)+8,'+'+CROPS[p.k].v,K.y);plots[i]=null;S('coin');}}
  if(h.b&&p){p.w=300;S('blip');for(let k=0;k<6;k++)fx.spark(PX(i)+10+k*8,PY(i)+10,'#7ac8ff',1,1);}plots.forEach(p=>{if(!p)return;p.g+=p.w>0?2:1;if(p.w>0)p.w--;});if(time<=0){g.score=money;g.over='$'+money+' EARNED';}};
 const bg=()=>{X.sky(['#4a9ae8','#bfe4ff'],48);X.disc(40,26,10,'#fff0a0');X.glow(40,26,28,'#fff0a0',.4);[[120,22],[220,16]].forEach(([x,y])=>{X.ell(x,y,14,4,'#ffffff');X.ell(x+8,y-3,9,4,'#ffffff');});
  X.hills(48,12,'#6ab050',0,.025,1);X.rr(258,20,30,24,1,'#c03a2a');X.poly([[255,21],[273,9],[291,21]],'#8a2a1a');X.rr(268,32,10,12,1,'#f4f0e6');A.line(268,32,278,44,'#c03a2a',1);A.line(278,32,268,44,'#c03a2a',1);
  X.vg(0,44,W,H-44,['#6ab050','#4a8a3a']);const c=A.c;c.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<260;i++)c.fillRect((i*61)%W,46+(i*37)%190,2,1);for(let x=0;x<W;x+=12){X.rr(x,40,3,10,1,'#e8dcc0');}X.rr(0,42,W,2,0,'#e8dcc0');X.rr(0,47,W,2,0,'#e8dcc0');
  X.panel(40,222,240,16,'#ffffff');};
 const crop=(x,y,p)=>{const cr=CROPS[p.k],f=Math.min(1,p.g/cr.t),ripe=f>=1,sw=Math.sin(A.t*.06+x)*1.2;for(let k=0;k<3;k++){const px=x+12+k*18,base=y+40,ph=4+f*20,bob=ripe?Math.sin(A.t*.15+k)*1:0;
   if(f<.15){X.ell(px,base-1,3,1.5,'#6a4a28');X.stroke([[px,base-1],[px,base-4]],'#4fb04a',1.2);continue;}
   if(p.k===0){for(let s=-1;s<=1;s++)X.stroke([[px+s*2,base],[px+s*3+sw,base-ph]],ripe?'#d8a830':'#5ab04a',1.3);if(f>.5)for(let s=-1;s<=1;s++)X.ell(px+s*3+sw,base-ph-2+bob,1.6,3.5,ripe?cr.c:'#8ac850');}
   else if(p.k===1){if(f>.6)X.poly([[px-3,base-1],[px+3,base-1],[px,base+6*f]],ripe?cr.c:'#e0a050');for(let s=-1;s<=1;s++)X.ell(px+s*2.5+sw*.5,base-ph*.5,1.6,ph*.5,'#3a9a3a',s*.4);}
   else{X.disc(px,base-ph*.5,4+f*4,'#2a7a3a');X.disc(px-2,base-ph*.5-2,3+f*2,'#3a9a4a');if(f>.5)for(let s=0;s<4;s++)X.orb(px-3+(s%2)*6,base-ph*.5-3+(s>>1)*5+bob,1.6+f*.6,ripe?cr.c:'#8ac850');}}
  if(ripe){X.glow(x+30,y+22,26,cr.c,.18+.1*Math.sin(A.t*.2));if(A.t%40<26){X.disc(x+52,y+6,6,'#ffffff');T('!',x+52,y+3,K.r,1,'c',1);}}};
 g.draw=()=>{X.cache('farm_bg',bg);
  for(let i=0;i<12;i++){const x=PX(i),y=PY(i),p=plots[i],wet=p&&p.w>0;X.shadow(x+30,y+49,32,3,.2);X.rr(x,y,60,48,4,X.lg(0,y,0,y+48,wet?['#5a3e24','#3a2814']:['#9a6a3a','#7a4e28']));for(let r=0;r<4;r++){X.rr(x+3,y+5+r*11,54,4,2,wet?'rgba(0,0,0,.25)':'rgba(60,30,10,.3)');X.rr(x+3,y+4+r*11,54,1.2,.6,'rgba(255,255,255,.08)');}
   if(wet&&(A.t+i*7)%30<4)X.disc(x+10+(i*13+A.t)%40,y+10+(i*7)%30,1.2,'rgba(200,230,255,.8)');if(p){crop(x,y,p);if(wet)X.meter(x+4,y+43,52,3,p.w/300,'#4fb0ff');}else TM('+$5',x+30,y+20,'rgba(255,255,255,.35)',1,'c',1);
   if(CU.y*4+CU.x===i){const pu=1+Math.sin(A.t*.25);X.rrs(x-2-pu,y-2-pu,64+2*pu,52+2*pu,6,K.y,2);}}
  X.bar('  '+money,Math.ceil(time/60)+' SEC','A PLANT/HARVEST  B WATER',K.y,'#ffffff');coin(12,9,5);
  CROPS.forEach((cr,i)=>{const x=72+i*72;X.disc(x,230,3,cr.c);T(cr.n+' '+cr.v,x+6,227,'#ffffff',1,'l',1);});fx.draw();};
 return g;}});

/* ---- REEF KEEPER ---- */
A.add({id:'reef',name:'REEF KEEPER',cat:'SIM',how:'MOVE. A DROPS FOOD. FED FISH BREED, HUNGRY FISH DIE. GROW THE SCHOOL IN 2 MIN.',make(){
 const g={over:null,score:0},fx=X.fx();let fish=[],food=[],cx=160,cy=60,time=7200,bub=[];for(let i=0;i<4;i++)fish.push({x:rnd(W),y:80+rnd(120),vx:rnd(2)-1,vy:0,h:80,c:[K.o,K.y,K.p,K.c][i]});
 g.update=()=>{time--;const k=A.in(0);cx=cl(cx+ax(k)*3,10,W-10);cy=cl(cy+ay(k)*3,40,200);if(A.hit(0).a&&food.length<12){food.push({x:cx,y:cy});S('blip');}food.forEach(f=>f.y+=.4);food=food.filter(f=>f.y<H-14);
  for(const f of fish){f.h-=.06;let tg=null,td=1e9;for(const fd of food){const d=Math.hypot(fd.x-f.x,fd.y-f.y);if(d<td){td=d;tg=fd;}}if(tg&&f.h<90){f.vx+=(tg.x-f.x)*.002;f.vy+=(tg.y-f.y)*.002;if(td<8){food.splice(food.indexOf(tg),1);f.h=Math.min(100,f.h+35);S('coin');fx.spark(f.x,f.y,'#ffe0a0',4,1);if(f.h>95&&fish.length<20){fish.push({x:f.x,y:f.y,vx:-f.vx,vy:0,h:60,c:f.c});g.score+=10;fx.ring(f.x,f.y,'#ffffff',18);fx.pop(f.x,f.y-10,'BABY!',K.y);}}}else{f.vx+=rnd(.1)-.05;f.vy+=rnd(.1)-.05;}
   f.vx=cl(f.vx*.98,-1.5,1.5);f.vy=cl(f.vy*.98,-1,1);f.x+=f.vx;f.y+=f.vy;if(f.x<10||f.x>W-10)f.vx*=-1;if(f.y<40||f.y>H-20)f.vy*=-1;}
  fish.forEach(f=>{if(f.h<=0)fx.debris(f.x,f.y,'#8a8aa0',5,1);});fish=fish.filter(f=>f.h>0);if(!fish.length){g.over='TANK EMPTY';return;}if(A.t%20===0)bub.push({x:40+rnd(240),y:H,r:1+rnd(2)});bub.forEach(b=>b.y-=1);bub=bub.filter(b=>b.y>30);if(time<=0){g.score=fish.length*10;g.over=fish.length+' FISH';}};
 const bg=()=>{X.vg(0,0,W,H,['#2a8ad8','#1560a8','#0a3060']);const c=A.c;for(let i=0;i<6;i++){X.poly([[20+i*55,30],[44+i*55,30],[70+i*55-30,H],[10+i*55-30,H]],'rgba(200,240,255,.05)');}
  X.vg(0,24,W,10,['#9fdcff','rgba(127,195,255,.2)']);X.hills(H-6,16,'#d8c070',0,.03,4);X.vg(0,H-12,W,12,['#c4a54a','#a08838']);
  [[30,H-14,12,'#7a6a8a'],[250,H-16,16,'#6a5a7a'],[290,H-12,9,'#8a7a9a']].forEach(r=>X.ell(r[0],r[1],r[2],r[2]*.6,r[3]));
  const coral=(x,y,col,n)=>{for(let k=0;k<n;k++){const a=-1.57+(k-(n-1)/2)*.35;X.stroke([[x,y],[x+Math.cos(a)*10,y+Math.sin(a)*10],[x+Math.cos(a)*16+(k%2?3:-3),y+Math.sin(a)*18]],col,2.5);X.disc(x+Math.cos(a)*16+(k%2?3:-3),y+Math.sin(a)*18,2,X.lt(col,1.3));}};
  coral(70,H-10,'#ff6a8a',5);coral(200,H-10,'#ffa040',4);coral(130,H-8,'#c06aff',3);X.ell(270,H-28,10,14,'rgba(255,120,160,.5)');for(let k=0;k<6;k++)A.line(270,H-16,262+k*3.2,H-40,'rgba(255,160,190,.6)',.8);};
 const fishD=(f)=>{const d=f.vx<0?-1:1,col=f.h<30?'#9aa0b0':f.c,tw=Math.sin(A.t*(f.h<30?.15:.4)+f.x*.1)*2.5,c=A.c;c.save();c.translate(f.x,f.y);c.scale(d,1);
  X.poly([[-6,0],[-11,-4+tw*.5],[-10,0],[-11,4+tw*.5]],X.lt(col,.8));X.poly([[-1,-4],[3,-7],[4,-4]],X.lt(col,.75));X.ell(0,0,7,4.2,X.lg(0,-4,0,4,[X.lt(col,1.4),col,X.lt(col,.6)]));A.line(-2,-3.5,-2,3.5,'rgba(255,255,255,.55)',1);A.line(2,-3.8,2,3.8,'rgba(255,255,255,.35)',.8);X.disc(4,-1,1.4,'#ffffff');X.disc(4.4,-1,.8,'#1a1a1a');c.restore();
  if(f.h<30&&A.t%40<20)X.disc(f.x,f.y-8,1.4,'#ff4f6d');};
 g.draw=()=>{X.cache('reef_bg',bg);const c=A.c;for(let i=0;i<7;i++){const x=20+i*46;for(let j=0;j<6;j++){const sw=Math.sin(A.t*.05+j*.6+i)*(j*.8);X.ell(x+sw,H-16-j*9,3,6,j%2?'#2fa352':'#3ab85a',sw*.05);}}
  bub.forEach(b=>{A.ring(b.x+Math.sin(b.y*.08)*2,b.y,b.r||2,'rgba(255,255,255,.55)');X.disc(b.x+Math.sin(b.y*.08)*2-.5,b.y-.6,.6,'rgba(255,255,255,.7)');});
  food.forEach(fd=>{X.rr(fd.x-1.5,fd.y-1,3,2.4,.8,'#c87838');});fish.forEach(fishD);
  c.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<3;i++){const x=(A.t*.3+i*120)%(W+60)-30;X.poly([[x,24],[x+18,24],[x-12,H],[x-40,H]],'rgba(255,255,255,.035)');}
  const sh=Math.sin(A.t*.2)*1.5;X.rr(cx-5,cy-16+sh,10,12,3,X.lg(cx-5,0,cx+5,0,['#ffd060','#e09020']));X.rr(cx-4,cy-19+sh,8,4,1.5,'#d04040');for(let k=0;k<3;k++)X.disc(cx-2+k*2,cy-3+sh,.6,'#5a3a20');A.ring(cx,cy+6,4,'rgba(255,255,255,.6)');
  const hun=fish.filter(f=>f.h<30).length;X.bar('FISH '+fish.length,Math.ceil(time/60)+' SEC',hun?hun+' HUNGRY!':'',K.y,'#ffffff');fx.draw();};
 return g;}});
})();
