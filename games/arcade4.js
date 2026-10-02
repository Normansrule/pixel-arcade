(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const star=(x,y,r,col,rot)=>{const pts=[];for(let i=0;i<10;i++){const rr=i%2?r*.45:r,a=i*.628-1.57+(rot||0);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}X.poly(pts,X.lg(x,y-r,x,y+r,[X.lt(col,1.5),col,X.lt(col,.7)]));};
/* top-down car facing up (dir=-1) or down (1) */
const tcar=(x,y,col,dir)=>{const c=A.c;X.shadow(x+2,y+3,14,21,.3);c.fillStyle='#111';for(const sx of[-13,10])for(const sy of[-13,9])c.fillRect(x+sx,y+sy,3,7);X.rr(x-11,y-19,22,38,6,X.lg(x-11,0,x+11,0,[X.lt(col,.7),X.lt(col,1.3),col,X.lt(col,.6)]));X.rr(x-8,y-dir*9-4,16,8,2,X.lg(0,y-12,0,y+12,['#d8f2ff','#4a8ab8']));X.rr(x-8,y+dir*7-3,16,6,2,'rgba(30,40,60,.85)');X.rr(x-7,y-3,14,7,2,X.lt(col,1.15));
 const fy=y-dir*18;c.fillStyle='#fff6c0';c.fillRect(x-9,fy-1,4,2);c.fillRect(x+5,fy-1,4,2);c.fillStyle='#ff3040';c.fillRect(x-9,y+dir*18-1,4,2);c.fillRect(x+5,y+dir*18-1,4,2);};

A.add({id:'lanes',name:'LANE DODGE',cat:'CLASSICS',how:'LEFT/RIGHT CHANGE LANE. GRAB COINS. DODGE TRAFFIC.',make(){
 const g={over:null,score:0},fx=X.fx();let lane=1,x=160,ob=[],sp=3,d=0,nx=40,inv=0,lives=3,tilt=0;const LX=[100,160,220];
 g.update=()=>{const h=A.hit(0);if(h.l&&lane>0){lane--;S('blip');}if(h.r&&lane<2){lane++;S('blip');}const ox=x;x+=(LX[lane]-x)*.3;tilt=(x-ox)*.06;sp=3+d/2500;d+=sp;g.score=(d/20|0)+g.bonus|0;if(inv>0)inv--;
  if((nx-=sp)<=0){nx=50+rnd(60);const l=ri(3);ob.push({x:LX[l],y:-30,c:Math.random()<.3,col:['#ff4f6d','#4dabff','#ff9838','#c86dff','#ffcf3f'][ri(5)]});}
  for(const o of ob){o.y+=sp*(o.c?1:.6);if(Math.abs(o.x-x)<18&&Math.abs(o.y-200)<24){if(o.c){g.bonus=(g.bonus||0)+25;S('coin');fx.spark(o.x,o.y,K.y,10,2);fx.pop(o.x,o.y-14,'+25',K.y);o.y=999;}else if(inv===0){lives--;inv=60;S('boom');fx.spark(x,200,K.o,18,3);fx.debris(x,200,o.col,8,2.5);fx.flash(K.r,8);if(lives<=0)g.over='CRASHED';}}}ob=ob.filter(o=>o.y<H+30);};g.bonus=0;
 g.draw=()=>{const c=A.c;X.cache('lanes_bg',()=>{X.turf(0,0,W,H,'#2e6a2a','#347432',20);X.vg(66,0,188,H,['#3a3a46','#2e2e38']);c.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<60;i++)A.c.fillRect(70+(i*37)%180,(i*53)%H,2,2);A.c.fillStyle='#e8e8e8';A.c.fillRect(66,0,3,H);A.c.fillRect(251,0,3,H);A.c.fillStyle='#d0a020';A.c.fillRect(71,0,1.5,H);A.c.fillRect(247.5,0,1.5,H);});
  const off=(d*1.2)%40;for(let i=0;i<2;i++)for(let y=off-40;y<H;y+=40){c.fillStyle='rgba(255,255,255,.85)';c.fillRect(129+i*60,y,2,20);}
  for(let i=0;i<8;i++){const yy=((i*70+d*1.2)%560)-60,side=i%2?290:30;X.shadow(side+4,yy+8,12,5,.3);X.disc(side,yy,11,X.rg(side-3,yy-4,1,side,yy,11,['#6ad06a','#2a8a2a','#1a5a1a']));}
  ob.forEach(o=>{if(o.c){const sx=Math.abs(Math.cos(A.t*.1+o.x));X.glow(o.x,o.y,12,K.y,.4);c.save();c.translate(o.x,o.y);c.scale(Math.max(.15,sx),1);X.orb(0,0,7,'#ffcf3f');T('$',0,-2,'#8a5a00',1,'c',1);c.restore();}else tcar(o.x,o.y,o.col,1);});
  if(inv%8<5){c.save();c.translate(x,200);c.rotate(tilt);tcar(0,0,'#2fd6c3',-1);c.restore();c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<3;i++)c.fillRect(x-14+i*14,222+(A.t*3+i*5)%14,1,6);}
  fx.draw();X.bar('SCORE '+g.score,'');for(let i=0;i<lives;i++)X.heart(W-10-i*11,8,1);};
 return g;}});

A.add({id:'plane',name:'PAPER PLANE',cat:'CLASSICS',how:'HOLD A TO CLIMB. RELEASE TO GLIDE DOWN. COLLECT STARS.',make(){
 const g={over:null,score:0},fx=X.fx();let y=100,vy=0,d=0,st=[],walls=[],t=0,tr=[];
 g.update=()=>{t++;vy+=A.in(0).a?-.12:.09;vy=cl(vy,-2.4,2.4);y+=vy;d+=2+t/3000;if(t%3===0){tr.unshift([60,y]);if(tr.length>12)tr.pop();}tr.forEach(q=>q[0]-=2);if(t%70===0)st.push({x:W+10,y:40+rnd(150)});if(t%110===0){const gap=70-Math.min(25,t/200);const gy=40+rnd(160-gap);walls.push({x:W+10,gy,gap});}
  st.forEach(s=>s.x-=2+t/3000);walls.forEach(w=>w.x-=2+t/3000);st=st.filter(s=>{if(Math.hypot(s.x-60,s.y-y)<12){g.score+=10;S('coin');fx.spark(s.x,s.y,K.y,10,2);fx.ring(s.x,s.y,'#ffffff',14,10);fx.pop(s.x,s.y-12,'+10',K.y);return false;}return s.x>-10;});walls=walls.filter(w=>w.x>-20);
  if(walls.some(w=>Math.abs(w.x-60)<10&&(y<w.gy||y>w.gy+w.gap))||y<4||y>H-8){g.over='CRUMPLED';S('boom');fx.debris(60,y,'#ffffff',10,2);fx.flash('#ffffff',6);}if(t%30===0)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('plane_sky',()=>{X.sky(['#3a8ae0','#8ac8f8','#e8f6ff']);X.disc(270,40,16,'rgba(255,255,220,.85)');X.glow(270,40,50,'#fff0a0',.3);});
  for(let i=0;i<5;i++){const cx=((i*90-d*.4)%(W+80)+W+80)%(W+80)-40,cy=40+i*30;c.globalAlpha=.9;X.disc(cx,cy,14,'#ffffff');X.disc(cx+14,cy+4,10,'#ffffff');X.disc(cx-12,cy+5,9,'#ffffff');X.ell(cx+2,cy+10,22,4,'#e0eefc');c.globalAlpha=1;}
  X.hills(H,40,'rgba(120,180,120,.6)',d*.3,.02,3);X.hills(H,24,'#5a9a4a',d*.7,.035,7);
  walls.forEach(w=>{const pil=(y0,h)=>{c.fillStyle=X.lg(w.x-8,0,w.x+8,0,['#7a4a20','#c8884a','#8a5428']);c.fillRect(w.x-8,y0,16,h);c.fillStyle='rgba(0,0,0,.15)';for(let yy=y0+6;yy<y0+h;yy+=10)c.fillRect(w.x-8,yy,16,1);};pil(0,w.gy);pil(w.gy+w.gap,H);X.block(w.x-11,w.gy-6,22,6,'#5b3a1e',2);X.block(w.x-11,w.gy+w.gap,22,6,'#5b3a1e',2);});
  st.forEach(s=>{X.glow(s.x,s.y,12,K.y,.4);star(s.x,s.y,7,'#ffcf3f',A.t*.05);});
  tr.forEach((q,i)=>{c.globalAlpha=.4*(1-i/12);c.fillStyle='#ffffff';c.fillRect(q[0]-12,q[1],5,1);});c.globalAlpha=1;
  const a=Math.atan(vy*.4);c.save();c.translate(60,y);c.rotate(a);X.shadow(0,14,10,2,.1);X.poly([[13,0],[-10,-7],[-5,0]],X.lg(0,-7,0,0,['#ffffff','#e0e6f0']));X.poly([[13,0],[-5,0],[-10,6]],'#c8d0e0');X.poly([[13,0],[-5,0],[-8,2.5]],'#a8b0c4');c.restore();
  fx.draw();X.ot(g.score,160,8,K.w,3,'c');};
 return g;}});

A.add({id:'meteors',name:'METEOR SHOWER',cat:'CLASSICS',how:'MOVE. DODGE METEORS. BLUE ORBS GIVE A SHIELD.',make(){
 const g={over:null,score:0},fx=X.fx();let x=160,m=[],t=0,shield=0,tilt=0;
 g.update=()=>{t++;const ox=x;x=cl(x+ax(A.in(0))*3.2,10,W-10);tilt=(x-ox)*.08;if(shield>0)shield--;if(t%Math.max(6,24-t/300|0)===0)m.push({x:rnd(W),y:-10,v:1.5+rnd(2)+t/2000,r:4+rnd(7),o:Math.random()<.04,dx:rnd(.6)-.3});
  for(const o of m){o.y+=o.v;o.x+=o.dx;if(Math.hypot(o.x-x,o.y-210)<o.r+8){if(o.o){shield=300;S('coin');fx.ring(x,210,'#4dabff',24);fx.pop(x,190,'SHIELD!',K.b);o.y=999;}else if(shield>0){fx.spark(o.x,o.y,K.c,10,2.5);S('hit');o.y=999;}else{g.over='HIT';fx.spark(x,210,K.o,30,3.5);fx.flash(K.o,10);S('boom');}}else if(o.y>220&&o.y<900&&!o.o){fx.debris(o.x,222,'#a07050',3,1.5);o.y=999;}}m=m.filter(o=>o.y<H+20);if(t%6===0)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('met_bg',()=>{X.sky(['#05020f','#140830','#2a0f3a']);X.stars(90,4,0,0,200,.8);X.glow(250,60,90,'#8a2a6a',.22);X.disc(160,420,210,X.rg(160,300,20,160,420,210,['#8a5a7a','#4a2a4a','#2a1428']));X.glow(160,240,160,'#ff6a3a',.12);});
  m.forEach(o=>{if(o.o){X.glow(o.x,o.y,14,'#4dabff',.6);X.orb(o.x,o.y,6,'#6ac0ff');return;}const tl=o.r*3+o.v*6;c.fillStyle=X.lg(o.x,o.y-tl,o.x,o.y,['rgba(255,120,30,0)','rgba(255,170,60,.85)']);c.beginPath();c.moveTo(o.x-o.r*.8,o.y);c.lineTo(o.x-o.dx*tl*2,o.y-tl);c.lineTo(o.x+o.r*.8,o.y);c.closePath();c.fill();X.glow(o.x,o.y,o.r*2.2,'#ff8030',.45);X.orb(o.x,o.y,o.r,'#9a6a4a',0);X.disc(o.x+o.r*.25,o.y+o.r*.2,o.r*.3,'rgba(0,0,0,.3)');});
  c.save();c.translate(x,210);c.rotate(tilt);X.glow(0,10,8,'#ff8030',.6);c.fillStyle='#ffb040';c.fillRect(-2,8,4,3+rnd(4));X.poly([[0,-12],[10,8],[0,4],[-10,8]],X.lg(-10,0,10,0,['#2a8aa0','#bff8ff','#2a8aa0']));X.disc(0,-2,2,'#ff4f9a');c.restore();if(shield>0&&(shield>60||t%10<5)){X.glow(x,210,20,'#4dabff',.3);A.ring(x,210,15+Math.sin(t*.3),'#9fd0ff');}
  fx.draw();X.bar('SCORE '+g.score,shield>0?'SHIELD '+Math.ceil(shield/60):'','',K.y,K.b);};
 return g;}});

A.add({id:'catcher',name:'STAR CATCHER',cat:'CLASSICS',how:'MOVE THE BASKET. CATCH STARS, AVOID BOMBS. 3 MISSES.',make(){
 const g={over:null,score:0},fx=X.fx();let x=160,it=[],t=0,miss=0,combo=0,bump=0;
 g.update=()=>{t++;if(bump)bump--;x=cl(x+ax(A.in(0))*3.6,20,W-20);if(t%Math.max(16,45-t/200|0)===0)it.push({x:20+rnd(W-40),y:-10,v:1.2+rnd(1)+t/2500,b:Math.random()<.22,r:rnd(6)});
  for(const o of it){o.y+=o.v;o.r+=.03;if(o.y>196&&o.y<212&&Math.abs(o.x-x)<22){o.y=999;bump=8;if(o.b){miss++;combo=0;S('boom');fx.spark(o.x,200,K.o,20,3);fx.flash(K.r,8);}else{combo++;const pts=10*Math.min(5,1+combo/5|0);g.score+=pts;S('coin');fx.spark(o.x,198,K.y,8,2);fx.pop(o.x,186,'+'+pts,K.y);}}else if(o.y>H&&o.y<900&&!o.b){miss++;combo=0;S('lose');o.y=999;fx.pop(o.x,224,'MISS',K.r);}}it=it.filter(o=>o.y<H+10);if(miss>=3)g.over='GAME OVER';};
 g.draw=()=>{const c=A.c;X.cache('catch_bg',()=>{X.sky(['#0a0628','#1a1050','#3a2060']);X.stars(80,6,0,0,180,.8);X.disc(260,50,18,'#f8f0d0');X.disc(266,46,16,'#2a1a50');X.hills(226,30,'#1a1238',0,.02,3);X.vg(0,222,W,18,['#2a2050','#140c28']);});
  it.forEach(o=>{if(o.b){X.orb(o.x,o.y,7,'#2a2a3a');c.fillStyle='#8a7a5a';c.fillRect(o.x-1,o.y-11,2,4);X.glow(o.x,o.y-11,5,'#ffb040',.8);}else{X.glow(o.x,o.y,12,K.y,.35);star(o.x,o.y,7.5,'#ffcf3f',o.r);}});
  const s=bump*.03;c.save();c.translate(x,209);c.scale(1+s,1-s);X.poly([[-22,-9],[22,-9],[16,9],[-16,9]],X.lg(-22,0,22,0,['#8a4a1d','#d8904a','#8a4a1d']));c.strokeStyle='rgba(80,40,10,.6)';c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-19+i*9.5,-8);c.lineTo(-14+i*7,8);c.stroke();}for(let yy=-4;yy<8;yy+=4){c.beginPath();c.moveTo(-20+yy*.3,yy);c.lineTo(20-yy*.3,yy);c.stroke();}X.rr(-23,-11,46,4,2,'#c8803a');c.restore();
  fx.draw();X.bar('SCORE '+g.score,'');for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<3-miss?'#ff4f6d':'rgba(255,255,255,.15)');if(combo>4)X.ot('COMBO '+combo,160,26,K.c,1,'c');};
 return g;}});

A.add({id:'laserdodge',name:'LASER DODGE',cat:'CLASSICS',how:'MOVE. STAY OFF THE RED LASERS. SURVIVE.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:130},lz=[],t=0,tr=[];
 g.update=()=>{t++;const k=A.in(0);p.x=cl(p.x+ax(k)*2.6,20,W-20);p.y=cl(p.y+ay(k)*2.6,40,H-20);tr.unshift([p.x,p.y]);if(tr.length>8)tr.pop();if(t%Math.max(40,110-t/40|0)===0){const v=Math.random()<.5;lz.push({v,pos:v?20+rnd(W-40):40+rnd(H-60),warn:60,life:40,sweep:Math.random()<.3?(Math.random()<.5?1:-1):0});}
  for(const l of lz){if(l.warn>0){l.warn--;if(l.warn===0)S('shoot');}else{l.life--;if(l.sweep)l.pos+=l.sweep*2;if(l.v?Math.abs(p.x-l.pos)<5:Math.abs(p.y-l.pos)<5){g.over='FRIED';fx.spark(p.x,p.y,K.r,24,3.5);fx.flash(K.r,10);S('boom');}}}lz=lz.filter(l=>l.life>0);const s0=g.score;g.score=t/6|0;if(g.score%100===0&&g.score!==s0)fx.pop(160,60,g.score+'!',K.y);};
 g.draw=()=>{const c=A.c;X.cache('laser_bg',()=>{X.sky(['#0a0620','#120a30']);A.c.strokeStyle='rgba(90,70,200,.22)';A.c.lineWidth=.8;A.c.beginPath();for(let i=0;i<W;i+=20){A.c.moveTo(i,30);A.c.lineTo(i,H);}for(let j=30;j<H;j+=20){A.c.moveTo(0,j);A.c.lineTo(W,j);}A.c.stroke();X.vignette(.5);});
  lz.forEach(l=>{if(l.warn>0){const a=l.warn%10<5?.5:.2;c.globalAlpha=a;if(l.v){X.stroke([[l.pos,30],[l.pos,H]],'#ff4f6d',1);X.poly([[l.pos-5,30],[l.pos+5,30],[l.pos,37]],'#ff4f6d');}else{X.stroke([[0,l.pos],[W,l.pos]],'#ff4f6d',1);X.poly([[0,l.pos-5],[0,l.pos+5],[7,l.pos]],'#ff4f6d');}c.globalAlpha=1;}
   else{const w=4+Math.sin(A.t*.8)*1.2;if(l.v){c.fillStyle=X.lg(l.pos-12,0,l.pos+12,0,['rgba(255,40,80,0)','rgba(255,40,80,.35)','rgba(255,40,80,0)']);c.fillRect(l.pos-12,30,24,H);c.fillStyle='#ff4f6d';c.fillRect(l.pos-w/2,30,w,H);c.fillStyle='#ffffff';c.fillRect(l.pos-1,30,2,H);X.block(l.pos-6,26,12,6,'#5a5a78',2);}else{c.fillStyle=X.lg(0,l.pos-12,0,l.pos+12,['rgba(255,40,80,0)','rgba(255,40,80,.35)','rgba(255,40,80,0)']);c.fillRect(0,l.pos-12,W,24);c.fillStyle='#ff4f6d';c.fillRect(0,l.pos-w/2,W,w);c.fillStyle='#ffffff';c.fillRect(0,l.pos-1,W,2);X.block(-2,l.pos-6,6,12,'#5a5a78',2);X.block(W-4,l.pos-6,6,12,'#5a5a78',2);}}});
  tr.forEach((q,i)=>{c.globalAlpha=.35*(1-i/8);X.disc(q[0],q[1],5-i*.5,'#2fd6c3');});c.globalAlpha=1;X.glow(p.x,p.y,14,'#2fd6c3',.5);X.orb(p.x,p.y,6,'#5ff0e0');
  fx.draw();X.bar('SURVIVED '+g.score,'');};
 return g;}});

A.add({id:'orbitguard',name:'ORBIT GUARD',cat:'CLASSICS',how:'LEFT/RIGHT SPIN THE SHIELD. BLOCK ROCKS. 3 HITS AND THE PLANET FALLS.',make(){
 const g={over:null,score:0},fx=X.fx();let a=0,rocks=[],t=0,hp=3,hitF=0,blk=0;
 g.update=()=>{t++;if(hitF)hitF--;if(blk)blk--;a+=ax(A.in(0))*.07;if(t%Math.max(22,70-t/80|0)===0){const r=rnd(6.283);rocks.push({a:r,d:170,v:.8+rnd(.6)+t/4000,rot:rnd(6),s:4+rnd(3)});}
  for(const r of rocks){r.d-=r.v;r.rot+=.05;if(r.d<52&&r.d>44){let da=((r.a-a)%6.283+9.425)%6.283-3.1416;if(Math.abs(da)<.55){r.d=-1;g.score+=10;S('hit');blk=8;const x=160+Math.cos(r.a)*48,y=125+Math.sin(r.a)*48;fx.spark(x,y,K.c,10,2.5);fx.debris(x,y,'#a09ac0',5,2);}}if(r.d<28&&r.d>0){r.d=-1;hp--;hitF=20;S('boom');fx.spark(160+Math.cos(r.a)*26,125+Math.sin(r.a)*26,K.o,20,3);fx.flash(K.r,8);if(hp<=0)g.over='PLANET LOST';}}rocks=rocks.filter(r=>r.d>0);};
 g.draw=()=>{const c=A.c;X.cache('og_bg',()=>{X.sky(['#02010a','#080420']);X.stars(110,5,0,0,H,.9);X.glow(60,60,80,'#3a1a8a',.25);X.glow(270,200,80,'#0a4a7a',.25);});
  X.glow(160,125,46,'#4dabff',.35);X.disc(160,125,26,X.rg(152,116,2,160,125,26,['#8ad0ff','#2a7ad0','#0a2a6a']));c.save();c.beginPath();c.arc(160,125,25,0,6.283);if(c.clip)c.clip();const sp=A.t*.3;for(const[cx,cy,r]of[[0,-6,8],[14,8,6],[30,-2,7],[44,6,5]]){const xx=((cx+sp)%60+60)%60-30;X.disc(160+xx,125+cy,r,'#3ab060');X.disc(160+xx-2,125+cy-2,r*.5,'#5ad080');}c.restore();X.disc(160,125,26,X.rg(160,125,18,160,125,26,['rgba(0,0,0,0)','rgba(0,0,20,.45)']));if(hitF&&hitF%4<2)X.disc(160,125,26,'rgba(255,60,60,.4)');
  c.strokeStyle='rgba(127,240,255,.15)';c.lineWidth=1;c.beginPath();c.arc(160,125,48,0,6.283);c.stroke();X.glow(160+Math.cos(a)*48,125+Math.sin(a)*48,20,'#2fd6c3',.35+blk*.04);c.strokeStyle='#5ff0e0';c.lineWidth=5+blk*.3;c.lineCap='round';c.beginPath();c.arc(160,125,48,a-.5,a+.5);c.stroke();c.strokeStyle='#ffffff';c.lineWidth=1.5;c.beginPath();c.arc(160,125,48,a-.45,a+.45);c.stroke();c.lineCap='butt';
  rocks.forEach(r=>{const x=160+Math.cos(r.a)*r.d,y=125+Math.sin(r.a)*r.d,pts=[];for(let i=0;i<7;i++){const an=r.rot+i*.898,rr=r.s*(.75+.25*Math.sin(i*2.3+r.s));pts.push([x+Math.cos(an)*rr,y+Math.sin(an)*rr]);}X.glow(x,y,10,'#ff6a3a',.15);X.poly(pts,X.rg(x-2,y-2,0,x,y,r.s,['#d0c8e8','#8d86b8','#4a4570']));});
  fx.draw();X.bar('SCORE '+g.score,'');for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<hp?'#ff4f6d':'rgba(255,255,255,.15)');};
 return g;}});

A.add({id:'chain',name:'CHAIN REACTION',cat:'PUZZLE',how:'ONE SHOT PER LEVEL. MOVE, PRESS A TO BLAST. CHAIN ENOUGH ORBS.',make(){
 const g={over:null,score:0},fx=X.fx(),CO=['#ff4f6d','#ffcf3f','#2fd6c3','#ff4f9a','#3ddc84'];let lvl=0,orbs,ex,cx=160,cy=120,used,need,wait=0;
 const build=()=>{lvl++;orbs=[];for(let i=0;i<10+lvl*3;i++)orbs.push({x:20+rnd(W-40),y:40+rnd(H-60),vx:rnd(1.2)-.6,vy:rnd(1.2)-.6,c:CO[i%5]});ex=[];used=false;need=Math.min(orbs.length-2,3+lvl*2);wait=0;};build();let got=0;
 g.update=()=>{const k=A.in(0);if(A.mouse&&A.mouse.t>0){cx=A.mouse.x;cy=A.mouse.y;}else{cx=cl(cx+ax(k)*3,10,W-10);cy=cl(cy+ay(k)*3,30,H-10);}
  orbs.forEach(o=>{o.x+=o.vx;o.y+=o.vy;if(o.x<10||o.x>W-10)o.vx*=-1;if(o.y<30||o.y>H-10)o.vy*=-1;});if(!used&&A.hit(0).a){used=true;got=0;ex.push({x:cx,y:cy,r:1,g:1,c:'#ffffff'});S('shoot');}
  for(const e of ex){e.r+=e.g*1.2;if(e.r>24)e.g=-.5;for(const o of orbs)if(!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<e.r){o.dead=1;got++;g.score+=10*got;ex.push({x:o.x,y:o.y,r:1,g:1,c:o.c});S('hit');fx.spark(o.x,o.y,o.c,6,2);if(got>2)fx.pop(o.x,o.y-10,'x'+got,K.w);}}ex=ex.filter(e=>e.r>0);orbs=orbs.filter(o=>!o.dead);
  if(used&&!ex.length){if(wait++>30){if(got>=need){S('win');fx.flash('#ffffff',6);build();}else g.over='CHAIN TOO SHORT';}}};
 g.draw=()=>{const c=A.c;X.cache('chain_bg',()=>{X.sky(['#0d0926','#140c36','#0a0620']);X.glow(80,80,120,'#3a1a8a',.2);X.glow(250,180,120,'#0a4a7a',.2);});
  ex.forEach(e=>{const col=e.c||'#ffffff';X.disc(e.x,e.y,e.r,X.rg(e.x,e.y,0,e.x,e.y,Math.max(1,e.r),[X.rgba(col,.05),X.rgba(col,.35)]));c.strokeStyle=col;c.lineWidth=1.4;c.beginPath();c.arc(e.x,e.y,Math.max(.5,e.r),0,6.283);c.stroke();});
  orbs.forEach(o=>{X.glow(o.x,o.y,10,o.c,.35);X.orb(o.x,o.y,5,o.c);});
  if(!used){const pu=24+Math.sin(A.t*.15)*1.5;c.setLineDash&&c.setLineDash([4,3]);c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.arc(cx,cy,pu,0,6.283);c.stroke();c.setLineDash&&c.setLineDash([]);X.stroke([[cx-6,cy],[cx+6,cy]],'#ffffff',1.2);X.stroke([[cx,cy-6],[cx,cy+6]],'#ffffff',1.2);}
  fx.draw();X.bar('LEVEL '+lvl,'NEED '+need+'  GOT '+(used?got:0),'',K.w,(used?got:0)>=need?K.g:K.y);};
 return g;}});

A.add({id:'helix',name:'HELIX DROP',cat:'CLASSICS',how:'LEFT/RIGHT SLIDE THE FLOORS. DROP THROUGH GAPS. AVOID RED.',make(){
 const g={over:null,score:0},fx=X.fx();let off=0,by=40,vy=0,fl=[],cam=0,sq=0,splats=[];for(let i=0;i<60;i++){const gap=rnd(260),red=i>2?rnd(260):-999;fl.push({y:100+i*60,gap,red,rw:30+Math.min(80,i*3)});}
 const inRange=(v,s,w)=>{const d=((v-s)%320+320)%320;return d<w;};
 g.update=()=>{if(sq)sq--;off+=ax(A.in(0))*3.5;vy+=.3;by+=vy;const bxw=160-off;for(const f of fl){if(vy>0&&by+6>=f.y&&by+6-vy<f.y+2){if(inRange(bxw,f.gap,46)){if(!f.pass){f.pass=1;g.score+=10;S('coin');fx.ring(160,f.y-cam,'#ffcf3f',20,12);fx.pop(160,f.y-cam-14,'+10',K.y);}}else if(f.red>-999&&inRange(bxw,f.red,f.rw)){g.over='SMASHED';S('boom');fx.spark(160,by-cam,K.r,20,3);fx.flash(K.r,8);return;}else{by=f.y-6;vy=-5.2;sq=8;S('jump');splats.push({f,w:bxw});if(splats.length>20)splats.shift();fx.spark(160,f.y-cam,'#ffd060',4,1.4);}}}
  const want=by-90;if(want>cam)cam+=(want-cam)*.2;if(fl.every(f=>f.pass))g.over='BOTTOM REACHED! WIN';};
 g.draw=()=>{const c=A.c;X.cache('helix_bg',()=>{X.sky(['#2a1a5a','#1a1238','#0e0a24']);X.glow(160,120,120,'#6a3aff',.15);A.c.fillStyle=X.lg(146,0,174,0,['#3a2a7a','#7a6ad8','#3a2a7a']);A.c.fillRect(148,0,24,H);});
  fl.forEach(f=>{const y=f.y-cam;if(y<-12||y>H+10)return;for(let x=0;x<W;x+=4){const w=((x-off)%320+320)%320;if(inRange(w,f.gap,46))continue;const red=f.red>-999&&inRange(w,f.red,f.rw),shade=.75+.35*Math.cos((x-160)/110);c.fillStyle=red?(A.t%20<10?'#ff3a50':'#e02a40'):A.mix('#4a3aa0','#9a8aff',cl(shade-.5,0,1));c.fillRect(x,y,4.2,8);c.fillStyle=red?'#ff9aa8':'rgba(255,255,255,.35)';c.fillRect(x,y,4.2,1.5);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,y+8,4.2,3);}if(f.red>-999){const rx=((f.red+f.rw/2+off)%320+320)%320;X.glow(rx,y+4,16,'#ff3040',.2);}});
  splats.forEach(q=>{const y=q.f.y-cam;if(y>-5&&y<H)X.ell(((q.w+off)%320+320)%320,y+.5,5,1.4,'rgba(255,207,63,.5)');});
  const s=sq*.05;c.save();c.translate(160,by-cam);c.scale(1+s,1-s);X.shadow(0,6,5,1.5,.3);X.orb(0,0,6,'#ffcf3f');c.restore();
  fx.draw();X.ot(g.score,160,8,K.w,3,'c');};
 return g;}});

A.add({id:'timing',name:'TIMING BAR',cat:'PUZZLE',how:'PRESS A WHEN THE NEEDLE IS IN THE GREEN. IT SHRINKS.',make(){
 const g={over:null,score:0},fx=X.fx();let n=0,d=1,zone=[130,190],sp=2,lives=3,fl=0,msg='',shake=0;const nz=()=>{const w=Math.max(10,60-g.score*2);const s=20+rnd(280-w);zone=[s,s+w];sp=2+g.score*.12;};
 g.update=()=>{if(fl>0)fl--;if(shake)shake--;n+=d*sp;if(n<20||n>300){d*=-1;n=cl(n,20,300);}if(A.hit(0).a){const perfect=Math.abs(n-(zone[0]+zone[1])/2)<3;if(n>=zone[0]&&n<=zone[1]){g.score+=perfect?3:1;msg=perfect?'PERFECT':'GOOD';S(perfect?'coin':'hit');fx.spark(n,120,perfect?K.y:K.g,perfect?16:8,2.5);fx.ring(n,120,perfect?K.y:K.g,24,14);nz();}else{lives--;msg='MISS';S('lose');shake=10;fx.flash(K.r,6);if(lives<=0)g.over='GAME OVER';}fl=30;}};
 g.draw=()=>{const c=A.c;X.cache('timing_bg',()=>{X.sky(['#1a1036','#0a0618']);X.glow(160,120,140,'#3a2a8a',.2);X.panel(10,88,300,64,'#ffffff');});const ox=shake?Math.sin(shake*2)*3:0;
  X.rr(20+ox,110,280,20,6,X.lg(0,110,0,130,['#1a1440','#2a2060']));const pu=.5+.5*Math.sin(A.t*.15);X.glow((zone[0]+zone[1])/2+ox,120,(zone[1]-zone[0])*.8+6,'#3ddc84',.2+pu*.15);X.rr(zone[0]+ox,110,zone[1]-zone[0],20,4,X.lg(0,110,0,130,['#9affb0','#3ddc84','#1a8a4a']));c.fillStyle='#fff3a0';c.fillRect((zone[0]+zone[1])/2-1+ox,110,2,20);
  for(let x=20;x<=300;x+=20){c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x+ox,132,1,4);}X.glow(n+ox,120,10,'#ffffff',.5);X.poly([[n-5+ox,96],[n+5+ox,96],[n+ox,104]],'#ffffff');c.fillStyle='#ffffff';c.fillRect(n-1+ox,102,2,36);
  fx.draw();X.bar('SCORE '+g.score,'');for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.15)');if(fl)X.ot(msg,160,60,msg==='MISS'?K.r:K.y,3,'c');T('ZONE '+Math.round(zone[1]-zone[0])+'PX',160,160,K.gr,1,'c');};
 return g;}});

A.add({id:'colorwheel',name:'COLOR WHEEL',cat:'PUZZLE',how:'LEFT/RIGHT SPIN THE WHEEL. MATCH THE FALLING BALL TO ITS COLOUR.',make(){
 const g={over:null,score:0},CO=['#ff4f6d','#ffcf3f','#2fd6c3','#ff4f9a'],fx=X.fx();let a=0,ta=0,ball={y:30,c:0},v=1.2,tr=[];const nb=()=>{ball={y:30,c:ri(4)};v=1.2+g.score*.08;tr=[];};nb();
 g.update=()=>{const h=A.hit(0);if(h.l){ta-=1.5708;S('blip');}if(h.r){ta+=1.5708;S('blip');}a+=(ta-a)*.25;tr.unshift(ball.y);if(tr.length>8)tr.pop();ball.y+=v;if(ball.y>=150){const seg=(((Math.round(-ta/1.5708))%4)+4)%4;if(seg===ball.c){g.score++;S('coin');fx.spark(160,150,CO[ball.c],14,2.5);fx.ring(160,150,CO[ball.c],22,12);nb();}else{g.over='WRONG COLOUR';S('boom');fx.flash(K.r,8);}}};
 g.draw=()=>{const c=A.c;X.cache('cw_bg',()=>{X.sky(['#0d0926','#1a1040','#0d0926']);X.stars(50,8,0,0,H,.5);});X.glow(160,200,70,CO[(((Math.round(-ta/1.5708))%4)+4)%4],.18);
  for(let i=0;i<4;i++){c.fillStyle=X.rg(160,200,18,160,200,52,[X.lt(CO[i],1.3),CO[i],X.lt(CO[i],.6)]);c.beginPath();c.moveTo(160,200);c.arc(160,200,52,a+i*1.5708-2.356,a+i*1.5708-.785);c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1.5;c.stroke();}
  X.disc(160,200,18,X.rg(156,195,1,160,200,18,['#3a3060','#0d0926']));A.ring(160,200,52,'rgba(255,255,255,.3)');X.poly([[156,144],[164,144],[160,149]],'#ffffff');
  tr.forEach((y,i)=>{c.globalAlpha=.3*(1-i/8);X.disc(160,y,6-i*.5,CO[ball.c]);});c.globalAlpha=1;X.glow(160,ball.y,14,CO[ball.c],.5);X.orb(160,ball.y,7,CO[ball.c]);
  fx.draw();X.ot(g.score,160,8,K.w,3,'c');};
 return g;}});
})();
