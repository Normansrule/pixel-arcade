(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- BYTE SNAKE ---- */
A.add({id:'snake',name:'BYTE SNAKE',cat:'CLASSICS',tags:'snake nokia classic slither garden fruit',how:'ARROWS STEER. EAT FRUIT, CATCH MICE. DON\'T HIT WALLS, ROCKS OR YOURSELF.',make(){
 const g={over:null,score:0},CW=32,CH=22,fx=X.fx();let s=[[8,11],[7,11],[6,11]],ol=s.map(c=>c.slice()),d=[1,0],q=[],f,t=0,eaten=0,gold=null,grow=0,pulse=0,mouse=null,rocks=[],step=8,tongue=0;
 const occ=(p,skipFood)=>s.some(c=>c[0]===p[0]&&c[1]===p[1])||rocks.some(r=>r[0]===p[0]&&r[1]===p[1])||(!skipFood&&f&&f.p[0]===p[0]&&f.p[1]===p[1])||(mouse&&mouse.p[0]===p[0]&&mouse.p[1]===p[1]);
 const free=()=>{let p;do{p=[ri(CW),ri(CH)];}while(occ(p));return p;};
 // apples are common, cherries less so, grapes rare and worth the most
 const food=()=>{const r=Math.random();f={p:free(),k:r<.62?0:r<.9?1:2};};food();
 const PTS=[10,20,30];
 const cx=c=>c[0]*10+5,cy=c=>c[1]*10+25;
 g.update=()=>{const h=A.hit(0);const want=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:h.d?[0,1]:null;
  if(want&&q.length<2){const last=q.length?q[q.length-1]:d;if(want[0]!==-last[0]||want[1]!==-last[1])if(want[0]!==last[0]||want[1]!==last[1])q.push(want);}
  if(pulse>0)pulse--;if(gold&&--gold.t<=0)gold=null;if(tongue>0)tongue--;else if(Math.random()<.02)tongue=14;
  // the mouse scurries a cell at a time, away from the snake's head when it gets close
  if(mouse&&A.t%10===0){const hd=s[0],opts=[[1,0],[-1,0],[0,1],[0,-1]].map(v=>[mouse.p[0]+v[0],mouse.p[1]+v[1]]).filter(p=>p[0]>=0&&p[1]>=0&&p[0]<CW&&p[1]<CH&&!occ(p,true));
   if(opts.length){const far=Math.abs(hd[0]-mouse.p[0])+Math.abs(hd[1]-mouse.p[1])<6;opts.sort((a,b)=>far?(Math.abs(b[0]-hd[0])+Math.abs(b[1]-hd[1]))-(Math.abs(a[0]-hd[0])+Math.abs(a[1]-hd[1])):Math.random()-.5);if(far||Math.random()<.6){mouse.face=opts[0][0]-mouse.p[0]||mouse.face;mouse.p=opts[0];mouse.hop=6;}}
   if(--mouse.life<=0){fx.spark(cx(mouse.p),cy(mouse.p),'#c8b8a8',6,1.4);mouse=null;}}
  if(mouse&&mouse.hop>0)mouse.hop--;
  step=Math.max(3,8-(g.score/70|0));if(++t<step)return;t=0;if(q.length)d=q.shift();const n=[s[0][0]+d[0],s[0][1]+d[1]];
  if(n[0]<0||n[1]<0||n[0]>=CW||n[1]>=CH||rocks.some(r=>r[0]===n[0]&&r[1]===n[1])||s.some((c,i)=>i<s.length-1&&c[0]===n[0]&&c[1]===n[1])){S('boom');A.shake=6;fx.flash(K.r,10);s.forEach((c,i)=>{if(i%2===0)fx.debris(cx(c),cy(c),i?'#3ddc84':'#b8ffcf',2,1.5);});g.over='GAME OVER';return;}
  ol=s.map(c=>c.slice());s.unshift(n);let ate=false;
  if(n[0]===f.p[0]&&n[1]===f.p[1]){const p=PTS[f.k];g.score+=p;eaten++;ate=true;if(f.k)grow+=f.k;S('coin');fx.ring(cx(n),cy(n),['#ff6d6d','#ff3a5a','#b06aff'][f.k],16);fx.spark(cx(n),cy(n),'#ffd0a0',8,2);if(f.k)fx.pop(cx(n),cy(n)-8,'+'+p,K.y);pulse=10;food();
   if(eaten%5===0&&!gold)gold={p:free(),t:360};
   if(eaten%7===0&&!mouse){mouse={p:free(),life:60,hop:0,face:1};}
   // the garden gets rockier as you grow
   if(eaten%6===0&&rocks.length<10){let p,tries=0;do{p=free();tries++;}while(tries<50&&Math.abs(p[0]-n[0])+Math.abs(p[1]-n[1])<6);rocks.push(p);fx.debris(cx(p),cy(p),'#8a8270',6,1.6);}}
  else if(gold&&n[0]===gold.p[0]&&n[1]===gold.p[1]){g.score+=50;grow+=2;ate=true;S('score');fx.ring(cx(gold.p),cy(gold.p),K.y,26);fx.spark(cx(gold.p),cy(gold.p),K.y,14,3);fx.pop(cx(gold.p),cy(gold.p)-8,'+50',K.y);pulse=14;gold=null;}
  else if(mouse&&n[0]===mouse.p[0]&&n[1]===mouse.p[1]){g.score+=40;grow+=2;ate=true;S('score');fx.spark(cx(n),cy(n),'#f0e0d0',12,2.4);fx.pop(cx(n),cy(n)-8,'+40',K.y);pulse=14;mouse=null;}
  if(!ate){if(grow>0)grow--;else s.pop();}};
 // a sunny walled garden: mown stripes, clover, daisies, and a low stone wall all round
 const back=()=>X.cache('snakebg4',()=>{const c=A.c;X.vg(0,0,W,H,['#2a4a22','#1e3a1a']);
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){let k=(x*374761393+y*668265263)|0;k=(k^(k>>>13))*1274126177|0;k=(k^(k>>>16))>>>0;const X0=x*10,Y0=y*10+20;
   c.fillStyle=(x+y)%2?'#5aa83c':'#4e9a34';c.fillRect(X0,Y0,10,10);c.fillStyle=Math.floor(x/4)%2?'rgba(255,255,220,.05)':'rgba(0,0,0,.04)';c.fillRect(X0,Y0,10,10);
   for(let b=0;b<3;b++){const bx=X0+((k>>b*3)&7)+1,by=Y0+((k>>b*3+9)&7)+2;c.fillStyle=b%2?'rgba(140,210,90,.55)':'rgba(30,80,20,.35)';c.fillRect(bx,by,.8,2);}
   if(k%41===0){for(const[a,b]of[[0,-1.4],[1.4,0],[0,1.4],[-1.4,0]])X.disc(X0+5+a,Y0+5+b,1.2,'#ffffff');X.disc(X0+5,Y0+5,.9,'#ffd84a');}
   else if(k%47===3){for(const[a,b]of[[-1,0],[1,0],[0,-1.4]])X.disc(X0+5+a,Y0+5+b,1.2,'#3a8a2a');}
   else if(k%59===5){X.disc(X0+5,Y0+5,1.1,'#ff8ac8');X.disc(X0+6,Y0+4,.8,'#ffb8e0');}}
  // sunlight from the top left and soft shade under the wall
  c.fillStyle=X.rg(70,40,10,90,80,260,['rgba(255,240,180,.16)','rgba(255,240,180,0)']);c.fillRect(0,20,W,220);
  c.fillStyle=X.lg(0,20,0,30,['rgba(0,0,0,.35)','rgba(0,0,0,0)']);c.fillRect(0,20,W,10);
  for(let x=0;x<W;x+=8){X.rr(x,17,8,4,1.5,(x/8)%2?'#a8a090':'#b8b0a0');}
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;c.strokeRect(.5,20.5,W-1,H-21);X.vignette(.35);});
 const fruit=(k,x,y,b)=>{const c=A.c;X.shadow(x,y+5,4,1.3,.3);
  if(k===0){X.orb(x,y+b,4.4,'#e8303a');c.fillStyle='#5a3a1a';c.fillRect(x-.5,y-6+b,1.2,3);X.ell(x+2,y-5+b,2.4,1.2,'#4ccf5a',-.5);}
  else if(k===1){c.strokeStyle='#3a6a1a';c.lineWidth=.8;c.beginPath();c.moveTo(x-2,y+b);c.quadraticCurveTo(x,y-7+b,x+2,y-6+b);c.lineTo(x+3,y+1+b);c.stroke();X.orb(x-2,y+1+b,2.8,'#d8183a');X.orb(x+3,y+2+b,2.8,'#c8102e');X.ell(x+2,y-6+b,2,1,'#4ccf5a');}
  else{for(const[a,bb]of[[-2,-2],[1,-2],[-.5,.4],[2.5,.4],[-2,.6],[1,2.6],[-1,2.8],[.2,5]])X.orb(x+a,y+bb+b-1,1.9,'#8a3ad8',0);c.fillStyle='#5a3a1a';c.fillRect(x,y-6+b,1,2.4);X.ell(x+2,y-5+b,2,1,'#4ccf5a');}};
 g.draw=()=>{const c=A.c;back();const a=step?t/step:0,lp=(i)=>{const p=s[i],o=ol[i]||ol[ol.length-1]||p;return[cx(o)+(cx(p)-cx(o))*a,cy(o)+(cy(p)-cy(o))*a];};
  for(const r of rocks){const x=cx(r),y=cy(r);X.shadow(x+1,y+4,5,1.6,.35);X.rr(x-5,y-4,10,8,3.4,X.lg(x-5,y-4,x+5,y+4,['#c8c4b4','#8a8678','#4a4840']));X.ell(x-2,y-3,3,1.4,'rgba(110,170,70,.8)');c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x-3,y-2,3,.8);}
  const fb=Math.sin(A.t*.12)*1.2;X.glow(cx(f.p),cy(f.p),12,['#ff4040','#ff2a5a','#b06aff'][f.k],.25);fruit(f.k,cx(f.p),cy(f.p),fb*.3);
  if(gold){const gx=cx(gold.p),gy=cy(gold.p),al=gold.t<90&&A.t%10<5?.3:1;c.globalAlpha=al;X.glow(gx,gy,18,K.y,.5);const pts=[];for(let i=0;i<10;i++){const r=i%2?2.6:6,an=i*.628-1.57+A.t*.03;pts.push([gx+Math.cos(an)*r,gy+Math.sin(an)*r]);}X.poly(pts,X.lg(gx,gy-6,gx,gy+6,['#fff6a0','#ffb020']));c.globalAlpha=1;}
  if(mouse){const mx=cx(mouse.p),my=cy(mouse.p)-(mouse.hop>0?Math.sin(mouse.hop/6*Math.PI)*2:0),fc=mouse.face;X.shadow(mx,cy(mouse.p)+4,4,1.2,.3);
   c.strokeStyle='#e8a8a8';c.lineWidth=.7;c.beginPath();c.moveTo(mx-fc*3,my+1);c.quadraticCurveTo(mx-fc*7,my-3,mx-fc*8,my+2);c.stroke();
   X.ell(mx,my,4,2.8,X.lg(0,my-3,0,my+3,['#d8d0c8','#9a9088']));X.disc(mx+fc*3.4,my-.4,1.8,'#b8b0a8');X.disc(mx+fc*1.6,my-2.4,1.5,'#f0c8c8');X.disc(mx+fc*4.6,my-.6,.6,'#ff8a9a');c.fillStyle='#000';c.fillRect(mx+fc*3.4-.4,my-1.4,.8,.8);if(mouse.life<15&&A.t%6<3)X.glow(mx,my,8,'#ffffff',.4);}
  // the body: a smooth tube through the cell centres that glides between steps, patterned with scales
  const n=s.length,pts=[];for(let i=0;i<n;i++)pts.push(lp(i));
  c.lineCap='round';c.lineJoin='round';
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=8;c.beginPath();pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](p[0]+1.5,p[1]+3));c.stroke();
  for(let i=n-1;i>0;i--){const k=i/Math.max(1,n-1),w=9.6-k*5+(pulse>0&&i<4?pulse*.12:0);c.strokeStyle=A.mix('#3ad86a','#1a7a3a',k);c.lineWidth=w;c.beginPath();c.moveTo(pts[i][0],pts[i][1]);c.lineTo(pts[i-1][0],pts[i-1][1]);c.stroke();}
  // a yellow saddle pattern and a gloss stripe along the back
  for(let i=1;i<n;i++){const k=i/Math.max(1,n-1),[x,y]=pts[i];if(i%2===0)X.disc(x,y,2.6-k*1.4,'rgba(250,220,80,.75)');else X.disc(x,y,1.6-k*.8,'rgba(10,50,20,.5)');}
  c.strokeStyle='rgba(220,255,220,.35)';c.lineWidth=1.2;c.beginPath();pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](p[0]-.6,p[1]-1.8));c.stroke();c.lineCap='butt';c.lineJoin='miter';
  // the head: a rounded wedge that looks at the food, with a flicking tongue
  const [hx,hy]=pts[0],ex=d[0],ey=d[1],ang=Math.atan2(ey,ex);if(A.gfx!=='off')X.glow(hx,hy,14+(pulse>0?pulse:0),'#5dff9a',.18);
  c.save();c.translate(hx,hy);c.rotate(ang);
  if(tongue>0&&tongue<10){c.strokeStyle='#ff3a5a';c.lineWidth=.8;c.beginPath();c.moveTo(5,0);c.lineTo(9,0);c.lineTo(11,-1.4);c.moveTo(9,0);c.lineTo(11,1.4);c.stroke();}
  X.ell(0,0,6.6,5.4,X.lg(0,-5,0,5,['#8affb0','#3ad86a','#1a8a40']));X.ell(-2,0,3,2.6,'rgba(250,220,80,.6)');
  const fx_=cx(f.p)-hx,fy=cy(f.p)-hy,fl=Math.hypot(fx_,fy)||1,lx=(fx_*Math.cos(-ang)-fy*Math.sin(-ang))/fl,ly=(fx_*Math.sin(-ang)+fy*Math.cos(-ang))/fl;
  for(const sd of[-1,1]){X.disc(2,sd*2.8,2,'#ffffff');X.disc(2+lx*.8,sd*2.8+ly*.8,1.1,'#0a0a0a');c.fillStyle='rgba(255,255,255,.9)';c.fillRect(1.6,sd*2.8-1.2,.7,.7);}
  c.fillStyle='rgba(0,40,10,.6)';c.fillRect(5.2,-1.2,.8,.8);c.fillRect(5.2,.6,.8,.8);c.restore();
  fx.draw();X.bar('SCORE '+g.score,'LENGTH '+s.length);};
 g._s=()=>s;g._f=()=>f;g._d=()=>d;
 return g;}});

/* ---- BRICK BUSTER ---- */
A.add({id:'bricks',name:'BRICK BUSTER',cat:'CLASSICS',tags:'breakout arkanoid brick breaker paddle ball classic',how:'MOVE THE BAT. A LAUNCHES AND FIRES LASERS. CATCH CAPSULES. CLEAR EVERY BRICK.',make(){
 const g={over:null,score:0},fx=X.fx(),lo=()=>A.gfx!=='off',COL=['#ff4f6d','#ff9838','#ffcf3f','#3ddc84','#4dabff','#b06dff','#ff6ad8','#5ae8ff'];
 // brick maps: 1-8 colours, m metal, g gold (unbreakable), b bomb, ? mystery capsule
 const MAPS=[['1111111111','2222222222','3333333333','4444444444','5555555555','6666666666'],
  ['....gg....','...1111...','..222222..','.33333333.','4444444444','5555555555','m.m.m.m.m.'],
  ['..1....1..','...2..2...','..333333..','.44b44b44.','5555555555','6.6?66?6.6','7.7....7.7','...88.88..'],
  ['.77....77.','7777..7777','7777777777','8888b88888','.88888888.','..666666..','...6666...','....66....'],
  ['gmmmmmmmmg','m44444444m','m4b4??4b4m','m44444444m','gmm....mmg'],
  ['....55....','...5665...','..567765..','.56788765.','..567765..','...5665...','....55....']];
 const CAPS={W:['#3ddc84','WIDE'],M:['#ff4f9a','MULTI'],S:['#4dabff','SLOW'],L:['#ff6a3a','LASER'],C:['#ffcf3f','CATCH'],F:['#ff3a1a','FIREBALL'],E:['#ffffff','EXTRA LIFE']};
 const BAG='WWWWMMMMSSSLLLCCCFFE';
 let px=140,pw=40,balls=[],br=[],lives=3,lvl=0,stuck=true,drops=[],shards=[],bolts=[],hitT=0,combo=0,eff={W:0,L:0,C:0,F:0},catchO=0,intro=0;
 const build=()=>{lvl++;br=[];const m=MAPS[(lvl-1)%MAPS.length],cyc=Math.floor((lvl-1)/MAPS.length);
  m.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch==='.')return;const k=ch==='m'?'m':ch==='g'?'g':ch==='b'?'b':ch==='?'?'q':'n',hp=k==='m'?2+Math.min(2,cyc+(lvl>4?1:0)):k==='n'?1+Math.min(1,cyc):1;
   br.push({x:10+c*30,y:28+r*12,c:k==='n'?COL[(+ch-1)%8]:null,k,hp,mx:hp,sh:0,drop:70+r*9+c*3,p:k==='m'?50:k==='b'?40:k==='q'?60:(9-r)*10});}));intro=1;};
 const nb=()=>{balls=[{x:0,y:0,vx:1.4,vy:-(2.5+Math.min(lvl,8)*.18),tr:[]}];stuck=true;catchO=pw/2;};build();nb();
 const shatter=(q,col)=>{for(let i=0;i<(lo()?7:3);i++)shards.push({x:q.x+4+rnd(20),y:q.y+2+rnd(6),vx:rnd(3)-1.5,vy:-rnd(2)-.3,r:rnd(6),va:rnd(.4)-.2,s:2+rnd(3),c:col,t:40+ri(20)});};
 const kill=(q,b)=>{const i=br.indexOf(q);if(i<0)return;br.splice(i,1);combo++;const pts=Math.round(q.p*(1+Math.min(combo,10)*.2));g.score+=pts;
  shatter(q,q.c||(q.k==='m'?'#c8ccd8':q.k==='b'?'#c83a2a':'#b06dff'));fx.spark(q.x+14,q.y+5,'#ffffff',5,2);
  if(combo>=5&&combo%5===0)fx.pop(q.x+14,Math.max(30,q.y-4),'COMBO X'+combo,K.y);
  if(q.k==='q'||Math.random()<.13)drops.push({x:q.x+14,y:q.y+5,k:BAG[ri(BAG.length)],r:0});
  if(q.k==='b'){S('boom');A.shake=Math.max(A.shake||0,6);fx.ring(q.x+14,q.y+5,'#ffb34a',40,18);fx.spark(q.x+14,q.y+5,'#ff9838',16,3);fx.flash('#ff9838',4);
   for(const o of br.filter(o=>o!==q&&o.k!=='g'&&Math.abs(o.x-q.x)<=31&&Math.abs(o.y-q.y)<=13))kill(o,b);}else S('hit');};
 const hitBrick=(q,b)=>{q.sh=8;if(q.k==='g'){S('blip');fx.spark(b?b.x:q.x+14,b?b.y:q.y+5,'#ffe27a',4,1.6);return false;}
  if(b&&b.fire||--q.hp<=0){kill(q,b);return true;}S('blip');fx.spark(q.x+14,q.y+5,'#e8ecff',4,1.5);return false;};
 const inB=(x,y,q)=>x>q.x-2.6&&x<q.x+30.6&&y>q.y-2.6&&y<q.y+12.6;
 g.update=()=>{if(hitT)hitT--;for(const q of br){if(q.sh)q.sh--;if(q.drop>0)q.drop=Math.max(0,q.drop-3);}const landing=br.some(q=>q.drop>0);
  for(const k in eff)if(eff[k]>0&&--eff[k]===0&&k==='W'){px+=10;pw=40;}
  px=cl(px+ax(A.in(0))*4.6,6,W-6-pw);
  for(const s of shards){s.x+=s.vx;s.y+=s.vy;s.vy+=.12;s.r+=s.va;s.t--;}shards=shards.filter(s=>s.t>0&&s.y<H+10);
  // capsules
  for(const d of drops){d.y+=1.25;d.r+=.12;if(d.y>210&&d.y<224&&d.x>px-6&&d.x<px+pw+6){d.y=999;S('coin');fx.ring(d.x,216,CAPS[d.k][0],22);fx.pop(cl(d.x,40,W-40),196,CAPS[d.k][1],CAPS[d.k][0]);g.score+=25;
   if(d.k==='W'){if(!eff.W){px-=10;pw=60;}eff.W=900;}else if(d.k==='S')balls.forEach(b=>{b.vx*=.68;b.vy*=.68;});else if(d.k==='L')eff.L=600;else if(d.k==='C')eff.C=700;else if(d.k==='F')eff.F=480;else if(d.k==='E')lives=Math.min(5,lives+1);
   else if(balls.length<8){const b0=balls[0];if(b0)for(const a of[-.5,.5]){const sp=Math.hypot(b0.vx,b0.vy),an=Math.atan2(b0.vy,b0.vx)+a;balls.push({x:b0.x,y:b0.y,vx:Math.cos(an)*sp,vy:-Math.abs(Math.sin(an)*sp),tr:[]});}}}}
  drops=drops.filter(d=>d.y<H);
  // twin lasers
  if(eff.L>0&&!stuck&&A.fire(14)){for(const o of[4,pw-4])bolts.push({x:px+o,y:210});S('shoot');}
  for(const b of bolts){b.y-=5;const q=br.find(q=>b.x>q.x&&b.x<q.x+28&&b.y>q.y&&b.y<q.y+10&&!q.drop);if(q){hitBrick(q,null);b.y=-99;}}bolts=bolts.filter(b=>b.y>18);
  if(stuck){const b=balls[0];b.x=px+cl(catchO,4,pw-4);b.y=211;if(A.hit(0).a&&!landing){stuck=false;S('blip');}return;}
  for(const b of balls){b.fire=eff.F>0;b.tr.unshift([b.x,b.y]);if(b.tr.length>9)b.tr.pop();
   // two half-steps per frame so a fast ball can't skip through a brick
   for(let st=0;st<2;st++){
    b.x+=b.vx/2;if(b.x<7||b.x>W-7){b.vx*=-1;b.x=cl(b.x,7,W-7);S('blip');}
    let q=br.find(q=>!q.drop&&inB(b.x,b.y,q));if(q){const gone=hitBrick(q,b);if(!(gone&&b.fire)){b.vx*=-1;b.x+=b.vx/2;}}
    b.y+=b.vy/2;if(b.y<22){b.vy=Math.abs(b.vy);b.y=22;S('blip');}
    q=br.find(q=>!q.drop&&inB(b.x,b.y,q));if(q){const gone=hitBrick(q,b);if(!(gone&&b.fire)){b.vy*=-1;b.y+=b.vy/2;}}}
   const sp=Math.hypot(b.vx,b.vy);if(sp<4.6){b.vx*=1.0007;b.vy*=1.0007;}
   if(b.vy>0&&b.y>210&&b.y<220&&b.x>px-4&&b.x<px+pw+4){b.vy=-Math.abs(b.vy);b.vx=cl((b.x-px-pw/2)/(pw/5.5),-2.8,2.8);if(Math.abs(b.vy)<1.4)b.vy=-1.4;hitT=8;combo=0;S('blip');fx.ring(b.x,216,'#7ff0ff',12,10);
    if(eff.C>0&&balls.length===1){stuck=true;catchO=b.x-px;}}
   if(b.y>H+6)b.dead=1;}
  balls=balls.filter(b=>!b.dead);
  if(!balls.length){lives--;combo=0;S('lose');fx.flash(K.r,8);A.shake=5;if(lives<=0)g.over='GAME OVER';else{for(const k in eff)eff[k]=0;pw=40;nb();}}
  if(!br.some(q=>q.k!=='g')){g.score+=200+lvl*50;S('win');fx.flash(K.c,10);fx.pop(160,120,'LEVEL '+(lvl+1),K.y);for(const k in eff)eff[k]=0;pw=40;build();nb();drops=[];bolts=[];}};
 const brick=q=>{const c=A.c,o=q.sh?Math.sin(q.sh*1.7)*1.2:0,x=q.x+o,y=q.y-q.drop*q.drop*.02;if(y<-12)return;
  if(q.k==='g'){X.block(x,y,28,10,'#e0a830',2);c.fillStyle='rgba(255,255,220,.7)';const sx=x+((A.t*.8+q.x*3)%60)-16;if(sx>x&&sx<x+25)c.fillRect(sx,y+1.5,3,7);c.fillStyle='rgba(120,70,0,.5)';c.fillRect(x+3,y+3,1,1);c.fillRect(x+24,y+3,1,1);c.fillRect(x+3,y+7,1,1);c.fillRect(x+24,y+7,1,1);return;}
  if(q.k==='m'){X.block(x,y,28,10,q.hp>1?'#b8bcd0':'#8a8ea0',2);c.fillStyle='rgba(40,44,60,.6)';for(const[rx,ry]of[[3,2.5],[24,2.5],[3,6.5],[24,6.5]])c.fillRect(x+rx,y+ry,1.3,1.3);
   if(q.hp<q.mx){c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=.8;c.beginPath();c.moveTo(x+9,y);c.lineTo(x+13,y+5);c.lineTo(x+11,y+10);if(q.mx-q.hp>1){c.moveTo(x+19,y);c.lineTo(x+17,y+6);}c.stroke();}return;}
  if(q.k==='b'){X.block(x,y,28,10,'#8a2a22',2);X.disc(x+14,y+5.5,3.4,'#141418');X.disc(x+13,y+4.4,1,'rgba(255,255,255,.5)');c.fillStyle='#c8a060';c.fillRect(x+15.5,y+1,1,2);if(A.t%16<8){X.disc(x+16,y+1,1.2,'#ffcf3f');if(lo())X.glow(x+16,y+1,5,'#ff9838',.7);}return;}
  if(q.k==='q'){X.block(x,y,28,10,'#6a3ad0',2);A.text('?',x+14,y+2.5,A.t%30<15?'#ffffff':'#ffcf3f',1,'c');return;}
  X.block(x,y,28,10,q.c,2);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x+3,y+2,9,1);if(q.mx>1&&q.hp===1){c.strokeStyle='rgba(0,0,0,.45)';c.beginPath();c.moveTo(x+10,y);c.lineTo(x+14,y+5);c.lineTo(x+19,y+10);c.stroke();}
  else if(q.mx>1){c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+2,y+1,24,1);}};
 g.draw=()=>{const c=A.c;
  X.cache('bricks2bg',()=>{X.sky(['#160a3a','#0a0626','#04030f']);for(const[x,y,r,col]of[[70,70,90,'#5a2aff'],[250,50,80,'#ff2a9a'],[180,150,110,'#2a6aff'],[40,190,70,'#7a2aff']])X.glow(x,y,r,col,.16);X.stars(140,5,0,0,H,.8);
   const c=A.c;c.strokeStyle='rgba(150,110,255,.16)';c.lineWidth=.7;c.beginPath();for(let i=-10;i<=10;i++){c.moveTo(160+i*10,170);c.lineTo(160+i*44,H);}for(let j=0;j<6;j++){const y=170+(H-170)*Math.pow(j/6,1.7);c.moveTo(0,y);c.lineTo(W,y);}c.stroke();
   X.hg(0,18,5,H,['#3a3a5a','#9a9ac8','#3a3a5a']);X.hg(W-5,18,5,H,['#3a3a5a','#9a9ac8','#3a3a5a']);});
  if(lo()){X.stars(30,13,A.t*.25,0,H,.5);for(let i=0;i<6;i++){const y=(A.t*1.4+i*40)%(H-18)+18;X.disc(2.5,y,1,'#7ff0ff');X.disc(W-2.5,H+18-y,1,'#ff6ad8');}}
  br.forEach(brick);
  // the ball lights the bricks around it
  if(lo())balls.forEach(b=>X.glow(b.x,b.y,26,b.fire?'#ff7a2a':'#7fd8ff',.16));
  for(const s of shards){c.globalAlpha=Math.min(1,s.t/18);c.save();c.translate(s.x,s.y);c.rotate(s.r);X.poly([[-s.s,-s.s*.6],[s.s,0],[-s.s*.4,s.s*.8]],s.c);c.restore();}c.globalAlpha=1;
  for(const d of drops){const[col,nm]=CAPS[d.k];if(lo())X.glow(d.x,d.y,12,col,.35);X.rr(d.x-9,d.y-4,18,8,4,X.lg(0,d.y-4,0,d.y+4,[X.lt(col,1.5),col,X.lt(col,.45)]));const sx=Math.sin(d.r)*7;c.fillStyle='rgba(255,255,255,.55)';c.fillRect(d.x+sx-.6,d.y-3,1.2,6);T(nm[0],d.x,d.y-2,d.k==='E'||d.k==='C'?'#202020':K.w,1,'c');}
  for(const b of bolts){X.stroke([[b.x,b.y],[b.x,b.y+7]],'#ffd0a0',1.6);if(lo())X.glow(b.x,b.y+3,6,'#ff6a3a',.6);}
  balls.forEach(b=>{const tc=b.fire?'#ff7a2a':'#9fe8ff';b.tr.forEach((p,i)=>{c.globalAlpha=(b.fire?.6:.35)*(1-i/9);X.disc(p[0],p[1],(b.fire?3.4:2.6)-i*.25,tc);});c.globalAlpha=1;X.glow(b.x,b.y,b.fire?14:9,b.fire?'#ff5a1a':'#7fd8ff',.55);X.orb(b.x,b.y,2.9,b.fire?'#ffd07a':'#f0f8ff');});
  // the bat: end caps, glowing core, and the laser pods or catch field when powered up
  const sq=hitT/8,cy=215-sq;X.glow(px+pw/2,217,pw*.7,'#2fd6c3',.18+sq*.2);
  X.rr(px,cy,pw,7+sq,3.5,X.lg(0,215,0,222,['#e8f0ff','#8a90b0','#3a3e58']));X.rr(px+6,cy+2,pw-12,3+sq,1.5,X.lg(px,0,px+pw,0,['#2fd6c3','#c8fff8','#2fd6c3']));
  for(const ex of[px,px+pw-6])X.rr(ex,cy,6,7+sq,3,X.lg(0,215,0,222,eff.L>0?['#ffd0a0','#ff6a3a','#801a10']:['#ffb0b0','#ff4f6d','#801020']));
  if(eff.L>0)for(const ex of[px+2,px+pw-4]){c.fillStyle='#ffd0a0';c.fillRect(ex,cy-3,2,3);}
  if(eff.C>0){c.strokeStyle='rgba(255,207,63,'+(.4+.3*Math.sin(A.t*.2)).toFixed(2)+')';c.lineWidth=1;c.strokeRect(px+1,cy-1.5,pw-2,1);}
  c.fillStyle='rgba(255,255,255,.55)';c.fillRect(px+7,cy+.6,pw-14,.8);
  if(stuck&&!br.some(q=>q.drop>0)&&A.t%50<35)X.ot(lvl>1&&balls[0]&&combo===0&&g.score>0?'LEVEL '+lvl+' - PRESS A':'PRESS A TO LAUNCH',160,150,K.w,1,'c');
  fx.draw();X.bar('SCORE '+g.score,'LV '+lvl);for(let i=0;i<lives;i++)X.heart(W-62-i*11,8,1);
  let ix=8;for(const k of['W','L','C','F'])if(eff[k]>0){const[col]=CAPS[k];X.rr(ix,228,22,8,3,'rgba(0,0,0,.55)');T(k,ix+4,229.5,col,1);X.meter(ix+9,230,11,4,eff[k]/(k==='W'?900:k==='L'?600:k==='C'?700:480),col);ix+=25;}
  if(combo>=3){X.ot('X'+combo,W-8,226,combo>=10?K.y:K.c,1,'r');}};
 g._b=()=>({balls,px,pw,br});g._skip=n=>{lvl=n-1;build();nb();};
 return g;}});

/* ---- BLOCK DROP ---- */
A.add({id:'blocks',name:'BLOCK DROP',cat:'CLASSICS',how:'SLIDE. A ROTATES. B SLAMS. FILL ROWS.',make(){
 const g={over:null,score:0},fx=X.fx(),BW=12,BH=18,CS=12,OX=88,OY=20,SH=['0000111100000000','100111000','001111000','1111','011110000','010111000','110011000'],CO=['#2fd6c3','#4dabff','#ff9838','#ffcf3f','#3ddc84','#c86dff','#ff4f6d'];
 let bd=[],pc,nx=ri(7),t=0,lines=0,rep=0,clr=null,slam=0;for(let i=0;i<BH;i++)bd.push(Array(BW).fill(0));
 const mk=i=>{const n=Math.sqrt(SH[i].length),m=[];for(let r=0;r<n;r++){m.push([]);for(let c=0;c<n;c++)m[r].push(+SH[i][r*n+c]);}return m;};
 const fits=(m,x,y)=>m.every((row,r)=>row.every((v,c)=>!v||(x+c>=0&&x+c<BW&&y+r<BH&&(y+r<0||!bd[y+r][x+c]))));
 const spawn=()=>{pc={m:mk(nx),i:nx,x:4,y:0};if(pc.i===0)pc.y=-1;nx=ri(7);if(!fits(pc.m,pc.x,pc.y)){g.over='GAME OVER';S('boom');}};
 const lock=()=>{pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&pc.y+r>=0)bd[pc.y+r][pc.x+c]=pc.i+1;}));const full=[];for(let r=0;r<BH;r++)if(bd[r].every(v=>v))full.push(r);
  if(full.length){clr={rows:full,t:16};const n=full.length;lines+=n;const pts=[0,100,300,500,800][n]*(1+(lines/10|0));g.score+=pts;S('score');full.forEach(r=>{for(let c=0;c<BW;c+=2)fx.spark(OX+c*CS+6,OY+r*CS+6,'#ffffff',2,2.5);});fx.pop(OX+BW*CS/2,OY+full[0]*CS-4,n===4?'BLOCK DROP! +'+pts:'+'+pts,n===4?K.y:K.w);if(n===4){fx.flash('#ffffff',8);A.shake=6;}}else S('hit');pc=null;if(!clr)spawn();};spawn();
 const ghostY=()=>{let y=pc.y;while(fits(pc.m,pc.x,y+1))y++;return y;};
 g.update=()=>{if(slam)slam--;if(clr){if(--clr.t<=0){clr.rows.forEach(r=>{bd.splice(r,1);bd.unshift(Array(BW).fill(0));});clr=null;spawn();}return;}if(!pc)return;
  const h=A.hit(0),k=A.in(0),dx=ax(k);if(dx){if(rep===0||(rep>9&&rep%3===0)){if(fits(pc.m,pc.x+dx,pc.y))pc.x+=dx;}rep++;}else rep=0;
  if(h.u||h.a){const n=pc.m.length,m=pc.m.map((row,r)=>row.map((_,c)=>pc.m[n-1-c][r]));for(const o of[0,-1,1,-2,2])if(fits(m,pc.x+o,pc.y)){pc.m=m;pc.x+=o;S('blip');break;}}
  if(h.b){const y0=pc.y;while(fits(pc.m,pc.x,pc.y+1)){pc.y++;g.score++;}slam=8;A.shake=3;pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&r===pc.m.length-1||v&&!(pc.m[r+1]&&pc.m[r+1][c]))fx.spark(OX+(pc.x+c)*CS+6,OY+(pc.y+r)*CS+12,CO[pc.i],2,1.5);}));lock();t=0;return;}
  t+=k.d?8:1;if(k.d&&t%8===0)g.score+=0;if(t>=Math.max(4,40-(lines/6|0)*4)){t=0;if(fits(pc.m,pc.x,pc.y+1))pc.y++;else lock();}};
 const cell=(x,y,i,a)=>{if(a!==undefined)A.c.globalAlpha=a;X.block(OX+x*CS,OY+y*CS,CS,CS,CO[i],2);A.c.globalAlpha=1;};
 g.draw=()=>{X.cache('blocksbg',()=>{X.sky(['#2a1a5e','#120a30','#06040f']);X.stars(50,4,0,0,H,.5);X.glow(60,200,120,'#ff4f9a',.12);X.glow(270,40,120,'#2fd6c3',.12);X.rr(OX-5,OY-5,BW*CS+10,BH*CS+10,5,X.lg(0,OY,0,OY+BH*CS,['#6a5ab0','#2a2060']));X.vg(OX,OY,BW*CS,BH*CS,['#0c0a24','#05040e']);A.c.strokeStyle='rgba(255,255,255,.05)';A.c.lineWidth=1;A.c.beginPath();for(let c=1;c<BW;c++){A.c.moveTo(OX+c*CS,OY);A.c.lineTo(OX+c*CS,OY+BH*CS);}for(let r=1;r<BH;r++){A.c.moveTo(OX,OY+r*CS);A.c.lineTo(OX+BW*CS,OY+r*CS);}A.c.stroke();X.panel(6,22,76,46,K.y);X.panel(6,74,76,46,K.c);X.panel(6,126,76,30,K.p);X.panel(242,22,72,60,K.g);T('SCORE',12,28,K.gr);T('LINES',12,80,K.gr);T('LEVEL',12,132,K.gr);T('NEXT',248,28,K.gr);});
  bd.forEach((row,r)=>{const fl=clr&&clr.rows.includes(r);row.forEach((v,c)=>{if(v){if(fl){X.rr(OX+c*CS,OY+r*CS,CS,CS,2,clr.t%4<2?'#ffffff':CO[v-1]);}else cell(c,r,v-1);}});});
  if(pc&&!g.over){const gy=ghostY();pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&gy+r>=0)X.rrs(OX+(pc.x+c)*CS+1.5,OY+(gy+r)*CS+1.5,CS-3,CS-3,2,X.rgba(CO[pc.i],.6),1);}));
   X.glow(OX+(pc.x+pc.m.length/2)*CS,OY+(pc.y+pc.m.length/2)*CS,30,CO[pc.i],.18);pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&pc.y+r>=0)cell(pc.x+c,pc.y+r,pc.i);}));}
  T(g.score,12,40,K.y,2);T(lines,12,92,K.w,2);T(1+(lines/10|0),40,132,K.p,2);const m=mk(nx),n=m.length;m.forEach((row,r)=>row.forEach((v,c)=>{if(v)X.block(278-n*5+c*10,52-n*5+r*10,10,10,CO[nx],2);}));
  T('A ROTATE',248,92,K.gr);T('B SLAM',248,102,K.gr);T('DOWN SOFT',248,112,K.gr);fx.draw();};
 return g;}});

/* ---- MUNCH MAZE ---- */
A.add({id:'munch',name:'MUNCH MAZE',cat:'CLASSICS',how:'EAT EVERY PELLET. BIG PELLET = EAT BUGS.',make(){
 const g={over:null,score:0},fx=X.fx(),M=['###################','#........#........#','#o##.###.#.###.##o#','#.................#','#.##.#.#####.#.##.#','#....#...#...#....#','####.### # ###.####','   #.#       #.#   ','####.# ## ## #.####','    .  #   #  .    ','####.# ##### #.####','   #.#       #.#   ','####.# ##### #.####','#........#........#','#.##.###.#.###.##.#','#o..#....P....#..o#','##.#.#.#####.#.#.##','#....#...#...#....#','#.######.#.######.#','#.................#','###################'],CS=11,OX=8,OY=5;
 let dots,left,pl,bugs,lives=3,lvl=1,fr=0,wait=60,combo=0;
 const wall=(x,y)=>{x=(x+19)%19;return y<0||y>20||M[y][x]==='#';};
 const fill=()=>{dots=M.map(r=>r.split('').map(c=>c==='.'?1:c==='o'?2:0));left=dots.flat().filter(v=>v).length;};
 const place=()=>{pl={x:9,y:15,dx:0,dy:0,wx:0,wy:0,p:0,f:1,fy:0};bugs=[0,1,2].map(i=>({x:8+i,y:9,dx:0,dy:-1,p:0,home:60+i*90,c:['#ff4f4f','#ff7fd0','#ffa63f'][i],i}));fr=0;wait=60;};fill();place();
 g.update=()=>{if(wait>0){wait--;return;}if(fr>0)fr--;const k=A.in(0);if(ax(k)){pl.wx=ax(k);pl.wy=0;}else if(ay(k)){pl.wx=0;pl.wy=ay(k);}
  if(pl.p>0&&pl.wx===-pl.dx&&pl.wy===-pl.dy&&(pl.dx||pl.dy)){pl.x+=pl.dx;pl.y+=pl.dy;pl.x=(pl.x+19)%19;pl.dx=-pl.dx;pl.dy=-pl.dy;pl.p=1-pl.p;}
  if(pl.p===0){if((pl.wx||pl.wy)&&!wall(pl.x+pl.wx,pl.y+pl.wy)){pl.dx=pl.wx;pl.dy=pl.wy;}else if(wall(pl.x+pl.dx,pl.y+pl.dy)){pl.dx=pl.dy=0;}}
  if(pl.dx||pl.dy){pl.f=pl.dx;pl.fy=pl.dy;pl.p+=.13;if(pl.p>=1){pl.p=0;pl.x=(pl.x+pl.dx+19)%19;pl.y+=pl.dy;const v=dots[pl.y][pl.x];if(v){dots[pl.y][pl.x]=0;left--;g.score+=v===2?50:10;if(v===2){fr=360;combo=0;S('score');fx.ring(OX+pl.x*CS+5,OY+pl.y*CS+5,'#ffe08a',30);}else if(left%2)S('blip');
    if(left===0){lvl++;S('win');fx.flash('#ffffff',10);fill();place();return;}}}}
  for(const b of bugs){if(b.home>0){b.home--;if(b.home===0){b.x=9;b.y=7;b.p=0;b.dx=b.i%2?1:-1;b.dy=0;}continue;}
   if(b.p===0){let tx=pl.x,ty=pl.y;if(b.i===1){tx+=pl.dx*4;ty+=pl.dy*4;}if(b.i===2&&Math.hypot(b.x-pl.x,b.y-pl.y)<6){tx=1;ty=19;}
    let best=null,bd=1e9;for(const d of[[0,-1],[-1,0],[0,1],[1,0]]){if(d[0]===-b.dx&&d[1]===-b.dy)continue;if(wall(b.x+d[0],b.y+d[1]))continue;if(b.y+d[1]===8&&b.x===9&&d[1]===1)continue;
     let ds=Math.hypot(b.x+d[0]-tx,b.y+d[1]-ty);if(fr>0)ds=-ds+rnd(6);else ds+=rnd(2.5);if(ds<bd){bd=ds;best=d;}}
    if(!best)best=[-b.dx,-b.dy];b.dx=best[0];b.dy=best[1];}
   b.p+=(fr>0?.06:.085+lvl*.008);if(b.p>=1){b.p=0;b.x=(b.x+b.dx+19)%19;b.y+=b.dy;}
   const bx=b.x+b.dx*b.p,by=b.y+b.dy*b.p,px=pl.x+pl.dx*pl.p,py=pl.y+pl.dy*pl.p;
   if(Math.abs(bx-px)+Math.abs(by-py)<.7){if(fr>0){combo++;const pts=200*combo;g.score+=pts;S('coin');fx.spark(OX+bx*CS+5,OY+by*CS+5,'#6d8dff',12,2.5);fx.pop(OX+bx*CS+5,OY+by*CS-4,'+'+pts,'#9fd0ff');b.x=9;b.y=9;b.p=0;b.home=150;}else{lives--;S('boom');fx.flash(K.r,10);fx.spark(OX+px*CS+5,OY+py*CS+5,K.y,16,3);if(lives<=0){g.over='GAME OVER';return;}place();return;}}}};
 const drawMaze=()=>{const c=A.c;c.fillStyle='#04030c';c.fillRect(0,0,W,H);X.glow(110,120,150,'#2030a0',.18);
  for(let y=0;y<21;y++)for(let x=0;x<19;x++)if(M[y][x]==='#'){const X0=OX+x*CS,Y0=OY+y*CS;c.fillStyle='#3a5cff';c.fillRect(X0,Y0,CS,CS);}
  for(let y=0;y<21;y++)for(let x=0;x<19;x++)if(M[y][x]==='#'){const X0=OX+x*CS,Y0=OY+y*CS,wl=(xx,yy)=>xx<0||xx>18||yy<0||yy>20||M[yy][xx]==='#';const l=wl(x-1,y)?0:2,r=wl(x+1,y)?0:2,t=wl(x,y-1)?0:2,b=wl(x,y+1)?0:2;c.fillStyle='#0d1250';c.fillRect(X0+l,Y0+t,CS-l-r,CS-t-b);c.fillStyle='#16207a';c.fillRect(X0+l+1,Y0+t+1,CS-l-r-2>0?CS-l-r-2:0,1);}
  c.fillStyle='#ff9fd0';c.fillRect(OX+9*CS,OY+8*CS+4,CS,2);X.panel(222,6,94,228,'#3a5cff');T('SCORE',230,14,K.gr);T('LIVES',230,52,K.gr);T('LEVEL',230,92,K.gr);};
 g.draw=()=>{X.cache('munchbg',drawMaze);const pw=Math.sin(A.t*.15);
  for(let y=0;y<21;y++)for(let x=0;x<19;x++){const v=dots[y][x];if(v===1){A.c.fillStyle='#ffe6c0';A.c.fillRect(OX+x*CS+4.5,OY+y*CS+4.5,2,2);}else if(v===2){X.glow(OX+x*CS+5.5,OY+y*CS+5.5,9+pw*2,'#ffd080',.45);X.orb(OX+x*CS+5.5,OY+y*CS+5.5,3+pw*.6,'#ffe0a0');}}
  const px=OX+(pl.x+pl.dx*pl.p)*CS+5.5,py=OY+(pl.y+pl.dy*pl.p)*CS+5.5,an=pl.fy?pl.fy*1.5708:pl.f<0?Math.PI:0,mo=(pl.dx||pl.dy)?Math.abs(Math.sin(A.t*.35))*.75:.35;
  X.glow(px,py,14,'#ffd83a',.3);A.c.fillStyle=X.rg(px-2,py-2,.5,px,py,5.5,['#fff6b0','#ffd83a','#c89000']);A.c.beginPath();A.c.moveTo(px,py);A.c.arc(px,py,5.3,an+mo,an+6.2832-mo);A.c.closePath();A.c.fill();X.disc(px+Math.cos(an-1.6)*2.4,py+Math.sin(an-1.6)*2.4-(pl.fy?0:.5),.9,'#1a1a1a');
  bugs.forEach(b=>{const x=OX+(b.x+b.dx*b.p)*CS+5.5,y=OY+(b.y+b.dy*b.p)*CS+5.5+(b.home>0?Math.sin(A.t*.2+b.i)*1.5:0),scared=fr>0&&b.home===0,col=scared?(fr<90&&A.t%12<6?'#f0f0ff':'#2b4dff'):b.c;
   X.glow(x,y,12,scared?'#2b4dff':b.c,.25);A.c.fillStyle=X.lg(0,y-5,0,y+5,[X.lt(col.length===7?col:'#2b4dff',1.35),col]);A.c.beginPath();A.c.arc(x,y-1,5,Math.PI,0);A.c.lineTo(x+5,y+5);for(let i=0;i<3;i++){const w=10/3,xx=x+5-(i+1)*w,o=(A.t>>3)%2?1:0;A.c.lineTo(xx+w/2,y+3+o);A.c.lineTo(xx,y+5);}A.c.closePath();A.c.fill();
   if(scared){A.c.fillStyle='#ffd0d0';A.c.fillRect(x-2.5,y-2,1.4,1.4);A.c.fillRect(x+1.2,y-2,1.4,1.4);X.stroke([[x-3,y+2],[x-1.5,y+1],[0+x,y+2],[x+1.5,y+1],[x+3,y+2]],'#ffd0d0',.6);}
   else for(const s of[-2,2]){X.disc(x+s,y-1.5,1.7,'#ffffff');X.disc(x+s+b.dx*.8,y-1.5+b.dy*.8,.9,'#1a3aff');}});
  T(g.score,230,24,K.y,2);for(let i=0;i<lives;i++){const lx=238+i*16,ly=70;A.c.fillStyle='#ffd83a';A.c.beginPath();A.c.moveTo(lx,ly);A.c.arc(lx,ly,5,.6,5.68);A.c.closePath();A.c.fill();}T(lvl,230,102,K.c,2);
  if(fr>0){X.meter(230,130,78,6,fr/360,'#4d7dff');T('POWER!',230,140,'#9fd0ff');}if(wait>0)X.ot('READY!',113,125,K.y,2,'c');fx.draw();};
 return g;}});

/* ---- GIRDER CLIMB ---- */
A.add({id:'girder',name:'GIRDER CLIMB',cat:'CLASSICS',how:'REACH THE FLAG. A JUMPS COGS. UP/DOWN ON LADDERS.',make(){
 const g={over:null,score:0},fx=X.fx(),PL=[{y:222,x0:0,x1:320},{y:182,x0:0,x1:286},{y:142,x0:34,x1:320},{y:102,x0:0,x1:286},{y:62,x0:34,x1:320}],LD=[{x:250,a:182,b:222},{x:70,a:142,b:182},{x:170,a:142,b:182},{x:250,a:102,b:142},{x:120,a:102,b:142},{x:70,a:62,b:102}];
 let p,cogs,lives=3,lvl=1,sp=0,bonus=3000,boss=0;const dirOf=q=>q.x0>0?-1:q.x1<320?1:-1;
 const platAt=(x,y)=>PL.find(q=>Math.abs(q.y-y)<1.5&&x>=q.x0&&x<=q.x1);
 const reset=()=>{p={x:30,y:222,vy:0,lad:null,air:false,f:1,st:0};cogs=[];sp=40;};reset();
 g.update=()=>{const k=A.in(0),h=A.hit(0);if(bonus>0&&A.t%6===0)bonus-=10;if(boss)boss--;
  if(p.lad){p.y+=ay(k)*1.1;if(ay(k))p.st+=.25;if(p.y<=p.lad.a){p.y=p.lad.a;p.lad=null;}else if(p.y>=p.lad.b){p.y=p.lad.b;p.lad=null;}}
  else{const on=platAt(p.x,p.y)&&p.vy>=0;if(on){p.air=false;p.vy=0;const l=LD.find(l=>Math.abs(l.x-p.x)<7&&((k.u&&Math.abs(p.y-l.b)<2)||(k.d&&Math.abs(p.y-l.a)<2)));if(l){p.lad=l;p.x=l.x;p.y+=k.u?-1:1;}else if(h.a){p.vy=-3.1;p.air=true;S('jump');fx.spark(p.x,p.y,'#c8b8a0',4,1);}}
   if(!p.lad){p.x=cl(p.x+ax(k)*1.5,6,W-6);if(ax(k)){p.f=ax(k);if(!p.air)p.st+=.3;}if(!platAt(p.x,p.y)||p.vy<0||p.air){p.air=true;const oy=p.y;p.vy+=.22;p.y+=p.vy;if(p.vy>0){const q=PL.find(q=>oy<=q.y&&p.y>=q.y&&p.x>=q.x0&&p.x<=q.x1);if(q){p.y=q.y;p.vy=0;p.air=false;}}}}}
  if(p.y<=62&&!p.lad&&p.x<110){g.score+=bonus+500;fx.pop(p.x,p.y-40,'+'+(bonus+500),K.y);fx.flash(K.y,10);bonus=3000;lvl++;S('win');reset();return;}
  if(--sp<=0){sp=Math.max(45,130-lvl*12)+rnd(40);cogs.push({x:286,y:62,d:-1,vy:0,lad:null,j:0,r:0});boss=20;}
  for(const c of cogs){const v=1.1+lvl*.15;c.r+=c.d*v*.18;if(c.lad){c.y+=1.2;if(c.y>=c.lad.b){c.y=c.lad.b;c.lad=null;c.d=dirOf(platAt(c.x,c.y)||PL[0]);}}
   else{const q=platAt(c.x,c.y);if(q&&c.vy>=0){c.vy=0;c.y=q.y;if(!c.set||c.set!==q){c.set=q;c.d=dirOf(q);}c.x+=c.d*v;const l=LD.find(l=>Math.abs(l.x-c.x)<v/2+.1&&l.a===q.y);if(l&&Math.random()<.3){c.lad=l;c.x=l.x;}}
    else{c.vy+=.2;const oy=c.y;c.y+=c.vy;const n=PL.find(q=>oy<q.y&&c.y>=q.y&&c.x>=q.x0-2&&c.x<=q.x1+2);if(n){c.y=n.y;c.vy=0;c.x=cl(c.x,n.x0,n.x1);fx.spark(c.x,c.y,'#ffb060',4,1.2);}}}
   const dx=Math.abs(c.x-p.x),dy=p.y-c.y;if(dx<8&&Math.abs(dy)<9){lives--;S('boom');fx.flash(K.r,10);fx.debris(p.x,p.y-10,'#4dabff',10,2);if(lives<=0){g.over='GAME OVER';return;}reset();return;}
   if(p.air&&!c.j&&dx<5&&dy<-8&&dy>-30){c.j=1;g.score+=100;S('coin');fx.pop(p.x,p.y-38,'+100',K.y);}}
  cogs=cogs.filter(c=>c.x>-10&&c.y<H+10);};
 const bg=()=>{X.sky(['#0b1240','#3b2a70','#d06a5a'],H);X.stars(40,7,0,0,120,.7);X.disc(250,150,30,'rgba(255,190,120,.25)');X.skyline(240,'#1a1438',0,3,'rgba(255,210,120,.5)');X.skyline(240,'#0e0b22',140,9,'rgba(255,230,160,.35)');
  LD.forEach(l=>{const c=A.c;for(const sx of[-5,4]){c.fillStyle=X.lg(l.x+sx,0,l.x+sx+2,0,['#d0e8f0','#5a8a9a']);c.fillRect(l.x+sx,l.a,2,l.b-l.a);}for(let y=l.a+4;y<l.b;y+=6){c.fillStyle='#9ac8d8';c.fillRect(l.x-4,y,9,1.4);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(l.x-4,y+1.4,9,.6);}});
  PL.forEach(q=>{const w=q.x1-q.x0,c=A.c;c.fillStyle=X.lg(0,q.y,0,q.y+6,['#ff8090','#d02848','#701020']);c.fillRect(q.x0,q.y,w,6);c.strokeStyle='#7a1028';c.lineWidth=1;c.beginPath();for(let x=q.x0;x<q.x1-6;x+=8){c.moveTo(x,q.y+5.5);c.lineTo(x+4,q.y+1);c.lineTo(x+8,q.y+5.5);}c.stroke();c.fillStyle='#ffd0d8';c.fillRect(q.x0,q.y,w,1);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(q.x0,q.y+6,w,2);for(let x=q.x0+4;x<q.x1;x+=16){c.fillStyle='#ffe0e0';c.fillRect(x,q.y+2,1,1);}});};
 g.draw=()=>{X.cache('girderbg',bg);
  /* flag */const fw=Math.sin(A.t*.15);A.c.fillStyle='#ddd';A.c.fillRect(60,36,2,26);X.poly([[62,37],[76,39+fw],[74,44+fw],[62,46]],X.lg(62,0,76,0,['#ffe680','#ffb020']));
  /* boss robot */const bx=300,by=62,sh=boss?Math.sin(boss)*1.5:0;X.shadow(bx,by,12,2);X.block(bx-12+sh,by-30,24,22,'#7a7f9a',4);X.block(bx-8+sh,by-38,16,10,'#8a90ae',3);X.glow(bx-3+sh,by-33,6,'#ff3040',.6);X.disc(bx-3+sh,by-33,1.6,'#ff6070');X.disc(bx+3+sh,by-33,1.6,'#ff6070');A.c.fillStyle='#222';A.c.fillRect(bx-6+sh,by-18,12,2);R(bx-16+sh,by-26+(boss?-4:0),5,12,'#5a5f7a');R(bx+11+sh,by-26,5,12,'#5a5f7a');
  cogs.forEach(c=>{const cx=c.x,cy=c.y-6;X.shadow(cx,c.y,5,1.3,.35);A.c.save();A.c.translate(cx,cy);A.c.rotate(c.r);A.c.fillStyle='#8a4a10';for(let i=0;i<8;i++){A.c.rotate(.785);A.c.fillRect(-1.3,-7.2,2.6,3);}A.c.restore();X.orb(cx,cy,5.6,'#ff9a30',0);X.disc(cx,cy,2,'#5a2a08');X.disc(cx-1.6,cy-2,1,'rgba(255,255,255,.6)');});
  const st=p.lad?Math.sin(p.st)*1.2:p.air?1.2:p.st;A.person(p.x,p.y,{s:.6,c:'#3a7bff',pants:'#2a3a6a',cap:'#ff4f4f',st,d:p.f,arm1:p.lad?-2.8+Math.sin(p.st)*.4:p.air?-2.4:undefined,arm2:p.lad?2.8-Math.sin(p.st)*.4:p.air?2.4:undefined,id:2});
  fx.draw();X.bar('SCORE '+g.score,'LV '+lvl,'BONUS '+bonus);for(let i=0;i<lives;i++)X.heart(W-50-i*11,8,1);};
 return g;}});

/* ---- INVADER WAVE ---- */
A.add({id:'invaders',name:'INVADER WAVE',cat:'CLASSICS',tags:'space invaders galaxian alien shooter classic',how:'MOVE. A FIRES. HIDE BEHIND SHIELDS. SHOOT THE SAUCER FOR A DOUBLE CANNON.',make(){
 const g={over:null,score:0},fx=X.fx();
 const SC=['#ff5fb0','#3fe0ff','#7dff6a'];let px=160,shs=[],en,bm=[],dir=1,lives=3,wave=1,t=0,bunk=[],ufo=null,hitF=0,muz=0,frame=0,caps=[],dbl=0,shake=0;
 const build=()=>{en=[];for(let r=0;r<5;r++)for(let c=0;c<9;c++){const x=30+c*26,y=40+r*16+Math.min(wave-1,4)*8;en.push({x,y,hx:x,hy:y,r,ty:r===0?0:r<3?1:2,dv:null,ph:Math.random()*6});}dir=1;bm=[];};
 // shields are domes of small cells that chip away
 const mkB=()=>{bunk=[];for(let b=0;b<4;b++)for(let y=0;y<6;y++)for(let x=0;x<10;x++){const dx=x-4.5,dy=y;if(dy<2&&Math.abs(dx)>3.5-dy)continue;if(y>=4&&Math.abs(dx)<1.6)continue;bunk.push({x:26+b*76+x*2.6,y:182+y*2.6,s:b});}};build();mkB();
 const hitBunk=(x,y)=>{const i=bunk.findIndex(c=>x>=c.x-1&&x<c.x+3.6&&y>=c.y-1&&y<c.y+3.6);if(i>=0){fx.spark(bunk[i].x+1,bunk[i].y+1,'#7ae8ff',3,1);bunk.splice(i,1);return true;}return false;};
 const kill=e=>{en.splice(en.indexOf(e),1);g.score+=(5-e.r)*10+(e.dv?40:0);S('hit');fx.spark(e.x,e.y,SC[e.ty],12,2.6);fx.ring(e.x,e.y,SC[e.ty],14,12);fx.debris(e.x,e.y,SC[e.ty],5,1.6);if(e.dv)fx.pop(e.x,e.y-8,'+'+((5-e.r)*10+40),K.y);};
 const hurt=()=>{lives--;S('boom');hitF=40;shake=6;fx.flash(K.r,10);fx.spark(px,214,'#7dff6a',16,3);fx.debris(px,214,'#6ae070',8,2);if(lives<=0)g.over='GAME OVER';};
 g.update=()=>{px=cl(px+ax(A.in(0))*2.8,10,W-10);if(hitF)hitF--;if(muz)muz--;if(dbl)dbl--;if(shake>0)shake*=.85;
  if(A.fire(10)&&shs.length<(dbl?8:4)){if(dbl){shs.push({x:px-5,y:208},{x:px+5,y:208});}else shs.push({x:px,y:208});S('shoot');muz=4;}
  for(const sh of shs){sh.y-=6;if(hitBunk(sh.x,sh.y)){sh.y=-99;continue;}const e=en.find(e=>Math.abs(e.x-sh.x)<9&&Math.abs(e.y-sh.y)<7);if(e){kill(e);sh.y=-99;}
   if(ufo&&Math.abs(sh.x-ufo.x)<12&&Math.abs(sh.y-ufo.y)<6){const pts=[100,150,300][ri(3)];g.score+=pts;S('score');fx.spark(ufo.x,ufo.y,K.r,18,3);fx.ring(ufo.x,ufo.y,K.y,30);fx.pop(ufo.x,ufo.y+8,'+'+pts,K.y);caps.push({x:ufo.x,y:ufo.y});ufo=null;sh.y=-99;}}shs=shs.filter(s=>s.y>=20);
  // the formation steps sideways and down; divers keep their slot and fly back to it
  if(++t>=Math.max(2,Math.floor(en.length/2.2))){t=0;frame^=1;let edge=en.some(e=>(dir>0&&e.hx>W-16)||(dir<0&&e.hx<16));if(edge){dir=-dir;en.forEach(e=>e.hy+=8);}else en.forEach(e=>e.hx+=dir*4);}
  for(const e of en){if(!e.dv){e.x=e.hx;e.y=e.hy;continue;}const v=e.dv;v.t++;
   if(!v.back){e.y+=1.4+wave*.1;e.x+=cl(px-e.x,-1,1)*1.1+Math.sin(v.t*.09)*1.4;if(v.t===36)bm.push({x:e.x,y:e.y+6});if(e.y>H+10){e.y=-12;v.back=1;}
    if(Math.abs(e.x-px)<9&&Math.abs(e.y-214)<8&&!hitF){kill(e);hurt();}}
   else{e.x+=(e.hx-e.x)*.08;e.y+=(e.hy-e.y)*.08;if(Math.abs(e.x-e.hx)+Math.abs(e.y-e.hy)<1.5)e.dv=null;}}
  if(wave>=2&&en.filter(e=>e.dv).length<Math.min(3,wave-1)&&Math.random()<.004*wave){const c=en.filter(e=>!e.dv);if(c.length){const e=c[ri(c.length)];e.dv={t:0};S('blip');}}
  en.forEach(e=>{if(!e.dv&&e.y>176)hitBunk(e.x,e.y)||hitBunk(e.x-4,e.y)||hitBunk(e.x+4,e.y);});
  if(!ufo&&A.t%1200===600)ufo={x:-14,y:30,v:1.1};if(ufo){ufo.x+=ufo.v;if(ufo.x>W+16)ufo=null;}
  for(const cp of caps){cp.y+=1;if(Math.abs(cp.x-px)<10&&cp.y>206&&cp.y<222){cp.y=999;dbl=600;S('score');fx.pop(px,196,'DOUBLE CANNON','#7ae8ff');fx.ring(px,214,'#7ae8ff',24,16);}}caps=caps.filter(c=>c.y<H);
  if(en.length&&Math.random()<.015+wave*.004){const e=en[ri(en.length)];bm.push({x:e.x,y:e.y+6});}
  for(const b of bm){b.y+=2.2+wave*.15;if(hitBunk(b.x,b.y)){b.y=999;continue;}if(Math.abs(b.x-px)<8&&b.y>206&&b.y<222&&!hitF){b.y=999;hurt();}}bm=bm.filter(b=>b.y<H);
  if(en.some(e=>!e.dv&&e.hy>200))g.over='THEY LANDED!';if(!en.length){wave++;g.score+=100;S('win');fx.pop(160,110,'WAVE '+wave,K.y);build();if(bunk.length<120)mkB();}};
 // a city under siege at night: nebula, a ringed planet, and the skyline you are defending
 const bg=()=>{const c=A.c;X.sky(['#02010a','#0c0830','#241046','#3a1450'],H);X.glow(250,60,120,'#7a2aff',.2);X.glow(50,120,100,'#ff2a8a',.12);X.glow(160,200,140,'#ff6a3a',.12);X.stars(110,11,0,0,180,.85);
  X.disc(262,70,26,X.rg(254,62,2,262,70,26,['#ffd8a8','#c87a5a','#4a2030']));c.save();c.translate(262,70);c.rotate(-.35);c.strokeStyle='rgba(255,220,180,.55)';c.lineWidth=2;c.beginPath();c.ellipse(0,0,42,8,0,Math.PI*.05,Math.PI*.95);c.stroke();c.restore();
  X.skyline(236,'#150828',0,5,'rgba(255,200,120,.35)');X.skyline(244,'#0a0418',30,9,'rgba(120,220,255,.3)');
  X.vg(0,226,W,14,['#1a2a3a','#06080e']);c.fillStyle='rgba(125,255,106,.6)';c.fillRect(0,226,W,1);X.vignette(.3);};
 // painted aliens: squid (top row), crab (middle) and octopus (bottom), two animation frames
 const alien=e=>{const c=A.c,x=e.x,y=e.y,col=SC[e.ty],f=frame,w=Math.sin(A.t*.2+e.ph);c.save();c.translate(x,y);if(e.dv)c.rotate(Math.sin(e.dv.t*.09)*.4);
  const body=X.lg(0,-5,0,5,[X.lt(col,1.5),col,X.lt(col,.5)]);
  if(e.ty===0){X.ell(0,-1.5,4.4,4,body);for(let k=-2;k<=2;k++){c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.moveTo(k*1.6,2);c.quadraticCurveTo(k*1.6+(f?1.4:-1.4),4.5,k*2.2,6+(k%2?1:0));c.stroke();}}
  else if(e.ty===1){X.rr(-5.5,-3.5,11,7,3,body);for(const s of[-1,1]){c.strokeStyle=col;c.lineWidth=1.4;c.beginPath();c.moveTo(s*5,0);c.lineTo(s*7.5,f?-3.5:2);c.lineTo(s*6.5,f?-5:3.5);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(s*2.5,3.5);c.lineTo(s*(f?3.5:2),6);c.stroke();}
   c.strokeStyle=col;c.lineWidth=.8;c.beginPath();c.moveTo(-2,-3.5);c.lineTo(-3,-6);c.moveTo(2,-3.5);c.lineTo(3,-6);c.stroke();}
  else{X.ell(0,-1,5.6,4.2,body);for(let k=-3;k<=3;k+=2){c.strokeStyle=col;c.lineWidth=1.1;c.beginPath();c.moveTo(k*1.4,2.5);c.lineTo(k*1.8+(f?.8:-.8)*Math.sign(k),5.5);c.stroke();}}
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-3,-4.2,3,.8);
  const ey=e.ty===1?-.5:-1.5;X.disc(-1.8,ey,1.2,'#1a0a20');X.disc(1.8,ey,1.2,'#1a0a20');c.fillStyle=e.dv?'#ff4a4a':'#ffffff';c.fillRect(-2+(w>0?.4:0),ey-.6,.8,.8);c.fillRect(1.6+(w>0?.4:0),ey-.6,.8,.8);
  c.restore();};
 g.draw=()=>{const c=A.c,sx=shake?rnd(shake)-shake/2:0;c.save();c.translate(sx,0);X.cache('invbg2',bg);
  if(A.gfx!=='off')en.forEach(e=>X.glow(e.x,e.y,10,SC[e.ty],e.dv?.3:.13));en.forEach(alien);
  for(const cl_ of bunk){c.fillStyle=(cl_.x*3+cl_.y)%5<2?'#5ad8ff':'#3aa8e0';c.fillRect(cl_.x,cl_.y,2.4,2.4);}
  if(A.gfx!=='off')for(let b=0;b<4;b++)if(bunk.some(cl_=>cl_.s===b))X.glow(38+b*76,190,22,'#3ad8ff',.12);
  if(ufo){X.glow(ufo.x,ufo.y,18,K.r,.45);X.ell(ufo.x,ufo.y+1,13,4,X.lg(0,ufo.y-3,0,ufo.y+5,['#ffb0b8','#d02040','#6a1020']));X.ell(ufo.x,ufo.y-2,5.5,3.8,'rgba(180,240,255,.85)');for(let i=-2;i<=2;i++)X.disc(ufo.x+i*4.5,ufo.y+2,.9,(A.t>>3)%5===i+2?K.y:'#ffd0d0');c.fillStyle='rgba(255,120,140,.12)';c.beginPath();c.moveTo(ufo.x-4,ufo.y+4);c.lineTo(ufo.x+4,ufo.y+4);c.lineTo(ufo.x+12,ufo.y+30);c.lineTo(ufo.x-12,ufo.y+30);c.fill();}
  for(const cp of caps){X.glow(cp.x,cp.y,10,'#7ae8ff',.6);X.rr(cp.x-5,cp.y-3,10,6,3,X.lg(0,cp.y-3,0,cp.y+3,['#dffaff','#3ab8ff']));A.text('2',cp.x,cp.y-2,'#0a2040',1,'c');}
  bm.forEach(b=>{X.glow(b.x,b.y+3,6,K.o,.5);X.stroke([[b.x,b.y],[b.x+1.5,b.y+2],[b.x-1.5,b.y+4],[b.x,b.y+6]],'#ffd070',1.2);});
  shs.forEach(sh=>{X.glow(sh.x,sh.y+3,7,dbl?'#7ae8ff':'#7ff0ff',.6);c.fillStyle='#e8ffff';c.fillRect(sh.x-.8,sh.y,1.6,7);});
  if(!(hitF&&A.t%4<2)){X.glow(px,216,18,dbl?'#7ae8ff':'#7dff6a',.22);
   X.poly([[px-11,223],[px+11,223],[px+9,217],[px+4,215],[px+2,209],[px-2,209],[px-4,215],[px-9,217]],X.lg(0,209,0,223,['#e0ffe0','#6ae070','#1c7a2a']));
   if(dbl){c.fillStyle='#9ad8ff';c.fillRect(px-6,211,2,5);c.fillRect(px+4,211,2,5);}
   X.ell(px,216,3,2,'rgba(180,255,255,.9)');c.fillStyle='rgba(255,255,255,.4)';c.fillRect(px-8,218,16,.8);c.fillStyle='#ff6a4a';c.fillRect(px-10,222,2,1);c.fillRect(px+8,222,2,1);if(muz)X.glow(px,207,9,'#ffffff',.85);}
  c.restore();fx.draw();X.bar('SCORE '+g.score,'WAVE '+wave);for(let i=0;i<lives;i++)X.heart(W-72-i*11,8,1,'#7dff6a');if(dbl)X.meter(120,10,80,4,dbl/600,'#7ae8ff');};
 return g;}});

/* ---- ROCK BLASTER ---- */
A.add({id:'rocks',name:'ROCK BLASTER',cat:'CLASSICS',warm:100,tags:'asteroids space rocks shooter saucer',how:'TURN. UP THRUSTS. A FIRES, B HYPERSPACE. SHOOT SAUCERS FOR POWER-UPS.',make(){
 const g={over:null,score:0},fx=X.fx();let s,rk=[],bl=[],eb=[],dust=[],pu=[],ufo=null,lives=3,lvl=0,inv=120,sx=0,sy=0,msg=90,t=0,hyp=0,pow=null,powT=0,ufoT=900,shield=0;
 // the sun is up and to the left: rocks are lit from there
 const SUN=[-.6,-.8];
 const mkR=(x,y,r)=>{const sh=[];for(let i=0;i<12;i++)sh.push(.74+rnd(.28));const cr=[];for(let i=0;i<(r>15?5:r>8?3:1);i++)cr.push([rnd(1.1)-.55,rnd(1.1)-.55,.1+rnd(.16)]);const sp=.5+lvl*.08+(r<8?.7:r<14?.35:0);const a=rnd(6.28);return{x,y,vx:Math.cos(a)*sp*(.5+rnd(.8)),vy:Math.sin(a)*sp*(.5+rnd(.8)),r,sh,cr,a:rnd(6),va:rnd(.04)-.02,tone:ri(3)};};
 const wave=()=>{lvl++;msg=90;for(let i=0;i<3+lvl;i++){let x,y;do{x=rnd(W);y=20+rnd(H-20);}while(Math.hypot(x-s.x,y-s.y)<80);rk.push(mkR(x,y,21));}};
 s={x:160,y:130,vx:0,vy:0,a:-1.57};wave();const wr=o=>{o.x=(o.x+W)%W;o.y=o.y<18?H:o.y>H?18:o.y;};
 const wrap=(a,b)=>{let dx=b.x-a.x,dy=b.y-a.y;if(dx>W/2)dx-=W;if(dx<-W/2)dx+=W;if(dy>(H-18)/2)dy-=H-18;if(dy<-(H-18)/2)dy+=H-18;return[dx,dy];};
 const puff=(x,y,col,n,sp)=>{for(let i=0;i<n;i++){const a=rnd(6.28),v=rnd(sp);dust.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:2+rnd(3),t:30+ri(30),m:60,c:col});}if(dust.length>160)dust.splice(0,dust.length-160);};
 const hurt=()=>{if(shield>0){shield=0;inv=60;fx.ring(s.x,s.y,'#7ff0ff',30,16);S('hit');return;}lives--;inv=150;fx.spark(s.x,s.y,'#7ff0ff',20,3.5);fx.ring(s.x,s.y,'#7ff0ff',40);fx.flash(K.r,8);puff(s.x,s.y,'#8adfff',14,2);s.x=160;s.y=130;s.vx=s.vy=0;pow=null;S('boom');if(lives<=0)g.over='GAME OVER';};
 const shoot=(a)=>{bl.push({x:s.x+Math.cos(a)*9,y:s.y+Math.sin(a)*9,vx:Math.cos(a)*4.8+s.vx,vy:Math.sin(a)*4.8+s.vy,t:52});};
 g.update=()=>{const k=A.in(0);t++;if(msg)msg--;if(hyp>0)hyp--;if(powT>0&&--powT===0)pow=null;if(shield>0)shield--;
  s.a+=ax(k)*.075;if(k.u){s.vx+=Math.cos(s.a)*.075;s.vy+=Math.sin(s.a)*.075;if(A.gfx!=='off'&&t%2===0)dust.push({x:s.x-Math.cos(s.a)*8,y:s.y-Math.sin(s.a)*8,vx:-Math.cos(s.a)*1.2+rnd(.4)-.2,vy:-Math.sin(s.a)*1.2+rnd(.4)-.2,r:1.5,t:18,m:18,c:'#ff9a50'});}
  const sp=Math.hypot(s.vx,s.vy);if(sp>4.2){s.vx*=4.2/sp;s.vy*=4.2/sp;}s.vx*=.993;s.vy*=.993;s.x+=s.vx;s.y+=s.vy;sx+=s.vx;sy+=s.vy;wr(s);if(inv>0)inv--;
  // hyperspace: vanish and reappear somewhere random (it might be next to a rock)
  if(A.hit(0).b&&hyp===0){fx.ring(s.x,s.y,'#bff8ff',22,14);s.x=20+rnd(W-40);s.y=40+rnd(H-60);s.vx*=.3;s.vy*=.3;hyp=90;inv=Math.max(inv,20);fx.ring(s.x,s.y,'#bff8ff',22,14);S('jump');}
  if(A.fire(pow==='rapid'?4:8)&&bl.length<(pow?24:12)){shoot(s.a);if(pow==='triple'){shoot(s.a-.2);shoot(s.a+.2);}S('shoot');}
  bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;wr(b);b.t--;});eb.forEach(b=>{b.x+=b.vx;b.y+=b.vy;wr(b);b.t--;if(inv===0&&b.t>0&&Math.hypot(b.x-s.x,b.y-s.y)<5){b.t=0;hurt();}});
  for(const d of dust){d.x+=d.vx;d.y+=d.vy;d.vx*=.97;d.vy*=.97;d.t--;}dust=dust.filter(d=>d.t>0);
  // the flying saucer: crosses the screen, changes course and takes aimed shots (the small one aims well)
  if(!ufo&&--ufoT<=0&&!g.over){const small=lvl>=3&&Math.random()<.5,l=Math.random()<.5;ufo={x:l?-12:W+12,y:40+rnd(160),vx:(l?1:-1)*(small?1.3:.9),vy:0,small,hp:small?1:2,cd:70,t:0};ufoT=1100+ri(500)-Math.min(500,lvl*60);}
  if(ufo){ufo.t++;ufo.x+=ufo.vx;ufo.y+=ufo.vy;if(ufo.t%80===0)ufo.vy=(Math.random()<.5?-1:1)*rnd(.8);if(ufo.y<30||ufo.y>H-14)ufo.vy*=-1;
   if(--ufo.cd<=0&&!g.over){ufo.cd=ufo.small?55:85;const[dx,dy]=wrap(ufo,s);const a=Math.atan2(dy,dx)+(ufo.small?rnd(.2)-.1:rnd(1.2)-.6);eb.push({x:ufo.x,y:ufo.y,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4,t:110});S('blip');}
   if(ufo.x<-20||ufo.x>W+20)ufo=null;}
  if(ufo){for(const b of bl)if(b.t>0&&Math.abs(b.x-ufo.x)<(ufo.small?7:11)&&Math.abs(b.y-ufo.y)<6){b.t=0;if(--ufo.hp<=0){const v=ufo.small?1000:250;g.score+=v;fx.pop(ufo.x,ufo.y-10,'+'+v,K.y);fx.spark(ufo.x,ufo.y,'#9affea',18,3);fx.ring(ufo.x,ufo.y,'#9affea',30,18);puff(ufo.x,ufo.y,'#6ad0c0',12,1.6);A.shake=5;S('boom');pu.push({x:ufo.x,y:ufo.y,k:['triple','rapid','shield'][ri(3)],t:480});ufo=null;break;}else{fx.spark(b.x,b.y,'#ffffff',5,1.5);S('hit');}}
   if(ufo&&inv===0&&Math.hypot(ufo.x-s.x,ufo.y-s.y)<12){hurt();}}
  for(const p of pu){p.t--;p.y+=Math.sin(t*.05+p.x)*.15;if(Math.hypot(p.x-s.x,p.y-s.y)<11){p.t=0;if(p.k==='shield')shield=900;else{pow=p.k;powT=540;}fx.pop(p.x,p.y-10,p.k.toUpperCase()+'!',K.c);fx.ring(p.x,p.y,K.c,20,14);S('score');}}pu=pu.filter(p=>p.t>0);
  const add=[];
  for(const r of rk){r.x+=r.vx;r.y+=r.vy;r.a+=r.va;wr(r);for(const b of bl)if(b.t>0&&Math.hypot(b.x-r.x,b.y-r.y)<r.r){b.t=0;r.dead=1;g.score+=r.r>15?20:r.r>8?50:100;S(r.r>15?'boom':'hit');if(r.r>15)A.shake=4;
    const base=['#9a8470','#7c7c92','#a88a62'][r.tone];fx.debris(r.x,r.y,base,r.r>15?12:6,2.2);fx.spark(r.x,r.y,'#ffd0a0',8,2.5);puff(r.x,r.y,'#b8a898',r.r>15?10:5,1.2);
    if(r.r>8)for(let i=0;i<2;i++){const n=mkR(r.x,r.y,r.r>15?12:6.5);n.vx+=b.vx*.08;n.vy+=b.vy*.08;add.push(n);}break;}
   if(!r.dead&&inv===0&&Math.hypot(s.x-r.x,s.y-r.y)<r.r*.9+4){r.dead=1;add.push(...(r.r>8?[mkR(r.x,r.y,r.r>15?12:6.5),mkR(r.x,r.y,r.r>15?12:6.5)]:[]));fx.debris(r.x,r.y,'#9a8470',8,2);hurt();}}
  rk=rk.filter(r=>!r.dead).concat(add);bl=bl.filter(b=>b.t>0);eb=eb.filter(b=>b.t>0);if(!rk.length)wave();};
 const rock=r=>{const p=[];for(let i=0;i<12;i++){const a=r.a+i*.5236;p.push([r.x+Math.cos(a)*r.r*r.sh[i],r.y+Math.sin(a)*r.r*r.sh[i]]);}const base=['#9a8470','#7c7c92','#a88a62'][r.tone],c=A.c;
  X.poly(p,X.rg(r.x+SUN[0]*r.r*.45,r.y+SUN[1]*r.r*.45,r.r*.08,r.x-SUN[0]*r.r*.2,r.y-SUN[1]*r.r*.2,r.r*1.15,[X.lt(base,1.55),base,X.lt(base,.5),'#120c14']));
  r.cr.forEach(q=>{const cx=r.x+(q[0]*Math.cos(r.a)-q[1]*Math.sin(r.a))*r.r,cy=r.y+(q[0]*Math.sin(r.a)+q[1]*Math.cos(r.a))*r.r,cr=q[2]*r.r;X.disc(cx,cy,cr,'rgba(20,10,10,.32)');X.disc(cx-SUN[0]*cr*.35,cy-SUN[1]*cr*.35,cr*.7,'rgba(255,240,220,.12)');X.disc(cx+SUN[0]*cr*.25,cy+SUN[1]*cr*.25,cr*.72,'rgba(20,10,10,.25)');});
  // a thin sunlit rim on the lit side
  c.save();c.beginPath();c.moveTo(p[0][0],p[0][1]);for(const q of p)c.lineTo(q[0],q[1]);c.closePath();c.strokeStyle='rgba(255,236,210,.28)';c.lineWidth=.7;c.stroke();c.restore();};
 g.draw=()=>{const c=A.c;X.cache('rocksbg3',()=>{X.sky(['#05030f','#0b0a26','#070512']);X.glow(80,70,140,'#4a1a9a',.38);X.glow(260,190,130,'#0a6a8a',.3);X.glow(200,40,80,'#9a2a6a',.2);
   // a big ringed planet low on the right, and a distant moon
   X.glow(282,226,90,'#5aa0ff',.22);X.disc(282,226,58,X.rg(258,196,4,282,226,60,['#a8d8ff','#3a6ab0','#14204a','#060818']));c.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<6;i++)c.fillRect(226,184+i*9,120,2);
   c.strokeStyle='rgba(200,220,255,.35)';c.lineWidth=2.2;c.beginPath();if(c.ellipse)c.ellipse(282,226,92,15,-.28,Math.PI*.95,Math.PI*2.05);c.stroke();
   X.disc(46,52,9,X.rg(42,48,1,46,52,9,['#f4ece0','#a89e90','#3a3430']));});
  X.stars(70,3,sx*.6,sy*.6,H,.9);X.stars(30,9,sx*1.6,sy*1.6,H,.6);
  for(const d of dust){c.globalAlpha=Math.max(0,d.t/d.m)*.55;X.disc(d.x,d.y,d.r*(1.6-d.t/d.m),d.c);}c.globalAlpha=1;
  rk.forEach(rock);
  for(const p of pu){const a=p.t<120&&t%10<5?.4:1;c.globalAlpha=a;X.glow(p.x,p.y,13,K.c,.5);X.orb(p.x,p.y,5.5,p.k==='shield'?'#4dabff':p.k==='rapid'?'#ff9838':'#3dff8b');A.text(p.k[0].toUpperCase(),p.x,p.y-2,'#ffffff',1,'c');c.globalAlpha=1;}
  if(ufo){const u=ufo,w=u.small?7:11;X.glow(u.x,u.y,w*2,'#5affd0',.3);X.ell(u.x,u.y+1,w,w*.32,X.lg(0,u.y-3,0,u.y+4,['#d8e0ec','#7a8296','#3a4052']));X.ell(u.x,u.y-w*.22,w*.45,w*.35,'rgba(140,255,220,.8)');
   for(let i=0;i<5;i++){const on=(t>>2)%5===i;X.disc(u.x-w*.7+i*w*.35,u.y+1.5,.9,on?'#ffcf3f':'#5a4a20');}}
  bl.forEach(b=>{X.glow(b.x,b.y,6,pow==='rapid'?'#ffa040':'#ffd070',.6);X.stroke([[b.x,b.y],[b.x-b.vx*1.2,b.y-b.vy*1.2]],'#fff0b0',1.4);});
  eb.forEach(b=>{X.glow(b.x,b.y,7,'#5affd0',.7);X.disc(b.x,b.y,1.6,'#e0fff8');});
  if(inv%10<6||inv===0){const co=Math.cos(s.a),n=Math.sin(s.a),T_=(u,v)=>[s.x+co*u-n*v,s.y+n*u+co*v];if(A.in(0).u){const fl=8+rnd(5);X.glow(s.x-co*9,s.y-n*9,11,'#ff8030',.6);X.poly([T_(-5,-2.6),T_(-5-fl,0),T_(-5,2.6)],X.lg(s.x-co*5,s.y-n*5,s.x-co*15,s.y-n*15,['#fff0a0','#ff8030','rgba(255,40,0,0)']));}
   X.poly([T_(-4,-7),T_(-8,-8),T_(-6,-3)],'#2a6a86');X.poly([T_(-4,7),T_(-8,8),T_(-6,3)],'#2a6a86');
   const P=[T_(11,0),T_(-6,-6),T_(-3,0),T_(-6,6)];X.poly(P,X.lg(s.x-n*6,s.y+co*6,s.x+n*6,s.y-co*6,['#2a8aa0','#dffcff','#2a8aa0']));X.polys(P,'#e8ffff',.7);
   X.ell(s.x+co*3.5,s.y+n*3.5,2.6,1.4,'#1a2a4a',s.a);X.disc(s.x+co*4.2-n*.5,s.y+n*4.2+co*.5,.6,'#bff8ff');X.disc(s.x-co*5,s.y-n*5,1.3,'#ff9a50');
   if(inv>0)A.ring(s.x,s.y,12+Math.sin(A.t*.3)*1.5,'rgba(127,240,255,.5)');if(shield>0){c.globalAlpha=shield<120&&t%8<4?.3:.75;X.glow(s.x,s.y,15,'#4dabff',.25);A.ring(s.x,s.y,13,'rgba(120,200,255,.8)');c.globalAlpha=1;}}
  fx.draw();X.bar('SCORE '+g.score,'',' WAVE '+lvl);for(let i=0;i<lives;i++){const lx=W-10-i*12,ly=9;X.poly([[lx,ly-5],[lx+4,ly+4],[lx,ly+2],[lx-4,ly+4]],'#7ff0ff');}
  if(pow){X.meter(6,20,50,4,powT/540,pow==='rapid'?'#ff9838':'#3dff8b');A.text(pow.toUpperCase(),60,19,'#fff3d6',1);}
  X.meter(W-56,20,50,4,1-hyp/90,'#bff8ff');A.text('HYPER',W-60,19,hyp?'rgba(255,255,255,.4)':'#bff8ff',1,'r');
  if(msg&&msg<80)X.ot('WAVE '+lvl,160,104,K.y,3,'c');};
 return g;}});
})();
