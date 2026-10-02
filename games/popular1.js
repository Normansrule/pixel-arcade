(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const hi=()=>A.gfx==='high',lo=()=>A.gfx!=='off';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

const FR=[['🍒','#d0203a',7],['🍓','#e8384a',9],['🍇','#8a3ab8',11],['🍊','#ff8a1a',13],['🍋','#ffd83a',15],['🍎','#e0302a',18],['🍐','#b8d040',21],['🍑','#ffa080',24],['🍍','#f0c030',28],['🍈','#a8e070',32],['🍉','#3aa040',37]];
A.add({id:'fruitmerge',name:'FRUIT MERGE',cat:'PUZZLE',mouse:1,how:'MOVE AND DROP WITH A OR CLICK. TWO OF THE SAME FRUIT MERGE. DON\'T OVERFILL.',make(){
 const g={over:null,score:0},BX=90,BW=140,BY=40,BH=190,fx=X.fx();let fr=[],x=160,next=ri(4),cur=ri(3),cd=0,over=0,best=0;
 g.update=()=>{const k=A.in(0);if(A.mouse.t>0)x+=(A.mouse.x-x)*.5;else x+=ax(k)*3.4;const r=FR[cur][2];x=cl(x,BX+r,BX+BW-r);if(cd>0)cd--;if(A.hit(0).a&&cd===0){fr.push({x:x+rnd(.2),y:BY+r+2,vx:0,vy:0,k:cur,age:0,sq:0,born:0});cur=next;next=ri(5);cd=24;S('blip');}
  for(let it=0;it<3;it++){for(const f of fr){if(it===0){f.vy+=.25;f.age++;if(f.sq>0)f.sq*=.85;if(f.born<10)f.born++;}f.x+=f.vx/3;f.y+=f.vy/3;const r=FR[f.k][2];if(f.x<BX+r){f.x=BX+r;f.vx*=-.3;}if(f.x>BX+BW-r){f.x=BX+BW-r;f.vx*=-.3;}if(f.y>BY+BH-r){if(f.vy>2.5)f.sq=Math.min(1,f.vy/7);f.y=BY+BH-r;f.vy*=-.2;f.vx*=.95;}}
   for(let i=0;i<fr.length;i++)for(let j=i+1;j<fr.length;j++){const a=fr[i],b=fr[j];if(a.dead||b.dead)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,rr=FR[a.k][2]+FR[b.k][2];if(d<rr){if(a.k===b.k&&a.k<FR.length-1){a.dead=b.dead=1;const nk=a.k+1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;fr.push({x:mx,y:my,vx:0,vy:-1,k:nk,age:60,sq:0,born:0});g.score+=(nk+1)*(nk+2);best=Math.max(best,nk);S('coin');A.burst(mx,my,FR[nk][1],12+nk*2,2+nk*.15);fx.ring(mx,my,'#ffffff',FR[nk][2]*1.8,16);fx.spark(mx,my,'#fff6c0',8,2);if(nk>=6){A.shake=3+nk/2;fx.flash('#fff3d6',6);}continue;}if(Math.abs(a.vy-b.vy)>2.5){a.sq=Math.max(a.sq,.4);b.sq=Math.max(b.sq,.4);}const o=(rr-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx*.5;a.vy+=rv*ny*.5;b.vx-=rv*nx*.5;b.vy-=rv*ny*.5;}}}fr=fr.filter(f=>!f.dead);}
  fr.forEach(f=>{f.vx*=.99;});if(fr.some(f=>f.age>90&&f.y-FR[f.k][2]<BY+14))over++;else over=0;if(over>90){g.over='OVERFLOW';S('lose');}};
 const fruit=(f,x,y,k,sq,born)=>{const r=FR[k][2],c=A.c,s=born<10?.3+.7*(born/10)*(1.2-.2*born/10):1,sx=(1+sq*.3)*s,sy=(1-sq*.25)*s;c.save();c.translate(x,y+r*(1-sy));c.scale(sx,sy);X.orb(0,0,r,FR[k][1]);E(FR[k][0],0,1,r*1.5);c.restore();};
 g.draw=()=>{X.cache('fm_bg',()=>{X.sky(['#ffeccc','#fbd6a4','#eeb184']);const c=A.c;for(let y=0;y<180;y+=14)for(let x=(y/14%2)*7;x<W;x+=14){c.fillStyle='rgba(255,255,255,.22)';c.fillRect(x+1,y+1,12,12);c.fillStyle='rgba(170,90,40,.08)';c.fillRect(x+1,y+12,12,1);}
   X.vg(0,214,W,26,['#a8643a','#6a3a1e']);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(0,214,W,1.5);
   X.panel(4,14,44,210,'#ff9838');X.panel(244,30,70,56,'#ffcf3f');X.panel(244,96,70,74,'#2fd6c3');X.vignette(.3);});
  FR.forEach((f,i)=>{const yy=24+i*18.6;if(i<=best)X.glow(26,yy,10,f[1],.5);c_alpha(i<=best?1:.35,()=>E(f[0],26,yy,13));});
  const c=A.c;X.rr(BX,BY,BW,BH,4,X.lg(BX,0,BX+BW,0,['rgba(255,255,255,.42)','rgba(255,255,255,.18)','rgba(255,255,255,.32)']));
  const r=FR[cur][2];c.fillStyle='rgba(120,60,30,.22)';for(let yy=BY+r*2+4;yy<BY+BH;yy+=8)c.fillRect(x-.5,yy,1,4);
  for(const f of fr)X.shadow(f.x,Math.min(BY+BH-1,f.y+FR[f.k][2]*.85),FR[f.k][2]*.8,2,.12);
  fr.forEach(f=>fruit(f,f.x,f.y,f.k,f.sq,f.born));
  const dl=over>0;c.fillStyle=dl?(A.t%10<5?'#ff3050':'rgba(255,60,80,.5)'):'rgba(200,80,60,.35)';for(let xx=BX;xx<BX+BW;xx+=8)c.fillRect(xx,BY+14,5,1.2);if(dl&&lo())X.glow(160,BY+14,70,'#ff3050',.25*Math.min(1,over/40));
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(BX+4,BY+20,3,BH-30);c.fillRect(BX+BW-8,BY+30,1.5,BH-60);
  X.block(BX-7,BY-4,7,BH+10,'#b5651d',2);X.block(BX+BW,BY-4,7,BH+10,'#b5651d',2);X.block(BX-7,BY+BH,BW+14,6,'#9a5418',2);
  X.rr(x-12,BY-9,24,5,2,'#6a3a1e');X.rr(x-3,BY-6,6,4,1,'#c88a50');fruit(null,x,BY-2,cur,0,cd>12?10-(cd-12)*.6:10);
  X.ot('SCORE',279,36,'#ffcf3f',1,'c');X.ot(g.score,279,50,'#fff3d6',2,'c');X.ot('NEXT',279,102,'#2fd6c3',1,'c');fruit(null,279,138,next,0,10);
  fx.draw();};
 const c_alpha=(a,f)=>{const c=A.c,o=c.globalAlpha;c.globalAlpha=a;f();c.globalAlpha=o;};
 return g;}});

const SL=['🍉','🍍','🍎','🍊','🍋','🍑','🥥','🍐'],JU=['#ff4060','#ffd040','#ffe8b0','#ffa020','#fff060','#ffb080','#ffffff','#e8f0a0'];
A.add({id:'fruitslice',name:'FRUIT SLICE',cat:'CLASSICS',mouse:1,how:'SWIPE THROUGH FRUIT WITH THE MOUSE (OR MOVE + HOLD A). AVOID BOMBS. 3 MISSES.',make(){
 const g={over:null,score:0},fx=X.fx();let items=[],trail=[],cx=160,cy=120,miss=0,t=0,combo=0,ct=0,halves=[],stains=[],mt=0;
 g.update=()=>{t++;const k=A.in(0);let px=cx,py=cy;if(A.mouse.t>0){cx=A.mouse.x;cy=A.mouse.y;}else{cx=cl(cx+ax(k)*5.5,0,W);cy=cl(cy+ay(k)*5.5,0,H);}const cutting=A.mouse.t>0?Math.hypot(cx-px,cy-py)>3:A.in(0).a;trail.push({x:cx,y:cy,on:cutting});if(trail.length>9)trail.shift();if(mt>0)mt--;
  if(t%Math.max(26,60-(t/300|0))===0){const n=1+ri(Math.min(4,1+t/900|0));for(let i=0;i<n;i++){const j=ri(SL.length);items.push({x:60+rnd(200),y:H+14,vx:rnd(2)-1,vy:-6.5-rnd(1.8),bomb:Math.random()<.14,j,e:SL[j],a:rnd(6),va:rnd(.2)-.1});}}
  if(ct>0)ct--;else{if(combo>2)fx.pop(160,44,combo+' FRUIT COMBO!','#ffcf3f');combo=0;}for(const f of items){f.vy+=.12;f.x+=f.vx;f.y+=f.vy;f.a+=f.va;if(!f.cut&&cutting){const d=Math.hypot(f.x-cx,f.y-cy);if(d<17){f.cut=1;if(f.bomb){g.over='BOOM';S('boom');A.burst(f.x,f.y,K.o,40,4);fx.flash('#ffffff',14);fx.debris(f.x,f.y,'#2a2a34',14,3);A.shake=10;}else{combo++;ct=12;g.score+=1+(combo>2?combo:0);S('hit');A.burst(f.x,f.y,JU[f.j],14,2.6);fx.spark(f.x,f.y,'#ffffff',6,3);const ang=Math.atan2(cy-py,cx-px)||0;halves.push({x:f.x,y:f.y,vx:-1.6+f.vx*.5,vy:-1.2,e:f.e,a:ang+1.57,va:-.08,s:-1,j:f.j},{x:f.x,y:f.y,vx:1.6+f.vx*.5,vy:-1.2,e:f.e,a:ang+1.57,va:.08,s:1,j:f.j});stains.push({x:f.x,y:f.y,c:JU[f.j],r:8+rnd(8),t:420,s:ri(999)});if(stains.length>24)stains.shift();}}}
   if(f.y>H+20&&f.vy>0&&!f.cut&&!f.bomb&&!f.gone){f.gone=1;miss++;mt=20;S('lose');A.shake=4;if(miss>=3)g.over='3 DROPPED';}}items=items.filter(f=>!f.cut&&f.y<H+30);halves.forEach(h=>{h.vy+=.15;h.x+=h.vx;h.y+=h.vy;h.a+=h.va;});halves=halves.filter(h=>h.y<H+24);stains.forEach(s=>s.t--);stains=stains.filter(s=>s.t>0);};
 g.draw=()=>{X.cache('fs_bg',()=>{const c=A.c;for(let i=0;i<8;i++){const x=i*40;X.vg(x,0,40,H,[['#7a4a2e','#6a3e26','#83532f','#704428'][i%4],'#3e2214']);c.fillStyle='rgba(0,0,0,.12)';for(let y=(i*37)%23;y<H;y+=11+i%4)c.fillRect(x+4+(y*7)%30,y,6+(y%9),1);c.fillStyle='rgba(255,220,180,.06)';c.fillRect(x+2,0,2,H);c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x+39,0,1.5,H);c.fillStyle='rgba(30,16,8,.6)';X.disc(x+20,12,1.3,'#2a160a');X.disc(x+20,H-10,1.3,'#2a160a');}X.vignette(.6);});
  const c=A.c;for(const s of stains){c.globalAlpha=Math.min(.5,s.t/300);X.disc(s.x,s.y,s.r,s.c);for(let i=0;i<5;i++){const a=(s.s+i*73)%628/100;X.disc(s.x+Math.cos(a)*s.r*1.4,s.y+Math.sin(a)*s.r*1.3,1.5+(i+s.s)%3,s.c);}}c.globalAlpha=1;
  items.forEach(f=>{if(f.bomb){if(lo())X.glow(f.x,f.y,22,'#ff2a2a',.25+.15*Math.sin(A.t*.4));X.orb(f.x,f.y,10,'#33333f');c.fillStyle='#8a8a9a';c.fillRect(f.x-3,f.y-12,6,3);X.stroke([[f.x,f.y-12],[f.x+2,f.y-16],[f.x+5,f.y-17]],'#c8a060',1.2);X.glow(f.x+5,f.y-17,6,'#ffcf3f',.9);if(A.t%4<2)X.disc(f.x+5,f.y-17,1.6,'#ffffff');T('X',f.x,f.y-2,'#ff4f6d',1,'c');}else{X.shadow(f.x+4,f.y+6,10,4,.18);c.save();c.translate(f.x,f.y);c.rotate(f.a*.3);E(f.e,0,0,26);c.restore();}});
  halves.forEach(h=>{c.save();c.translate(h.x,h.y);c.rotate(h.a);c.beginPath();c.rect(h.s<0?-15:0,-15,15,30);if(c.clip)c.clip();E(h.e,0,0,24);X.ell(0,0,2,10,JU[h.j]);c.restore();});
  const tr=trail;for(let i=1;i<tr.length;i++)if(tr[i].on&&tr[i-1].on){const f=i/tr.length;X.stroke([[tr[i-1].x,tr[i-1].y],[tr[i].x,tr[i].y]],'rgba(160,220,255,'+(f*.5).toFixed(2)+')',f*7);X.stroke([[tr[i-1].x,tr[i-1].y],[tr[i].x,tr[i].y]],'#ffffff',f*3);}
  if(A.mouse.t<=0){A.ring(cx,cy,6,A.in(0).a?'#ffffff':'rgba(255,255,255,.5)');c.fillStyle='#ffffff';c.fillRect(cx-.5,cy-.5,1,1);}
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);for(let i=0;i<3;i++){const xx=W-14-i*16,lost=i<miss;X.ot('X',xx,lost?3:4,lost?(mt>0&&i===miss-1&&A.t%4<2?'#ffffff':'#ff3a4f'):'rgba(255,255,255,.25)',2,'c');}if(combo>2)X.ot(combo+' COMBO',W-60,22,'#ffcf3f',1,'c');};
 return g;}});

A.add({id:'beatlanes',name:'BEAT LANES',cat:'CLASSICS',how:'NOTES FALL IN 4 LANES. PRESS LEFT, DOWN, UP, RIGHT AS THEY HIT THE LINE.',make(){
 const g={over:null,score:0},LK=['l','d','u','r'],LC=['#ff4f9a','#2fd6c3','#3dff8b','#ff9838'],fx=X.fx();let notes=[],t=0,combo=0,best=0,hp=100,judge='',jt=0,beat=0,bpm=110,flash=[0,0,0,0],bad=[0,0,0,0],pulse=0;
 const sp=2.2,HY=196,songLen=60*75,LX=l=>88+l*50;
 g.update=()=>{t++;const per=Math.round(3600/bpm/2);if(t<songLen&&t%per===0){beat++;if(beat%2===0)pulse=1;const pat=beat%16;if(beat<32?pat%4===0:(Math.random()<.7||pat%4===0)){const l=ri(4);notes.push({l,y:-10});if(beat>40&&Math.random()<.2)notes.push({l:(l+2)%4,y:-10});}}if(t%(60*20)===0)bpm+=10;pulse*=.9;
  const h=A.hit(0);for(let l=0;l<4;l++)if(h[LK[l]]){flash[l]=8;const n=notes.filter(n=>n.l===l&&!n.hit).sort((a,b)=>Math.abs(a.y-HY)-Math.abs(b.y-HY))[0];if(n&&Math.abs(n.y-HY)<18){n.hit=1;const p=Math.abs(n.y-HY)<7;combo++;best=Math.max(best,combo);g.score+=(p?300:100)*(1+Math.min(4,combo/10|0));judge=p?'PERFECT':'GOOD';jt=20;hp=Math.min(100,hp+2);A.burst(LX(l),HY,LC[l],p?14:8,p?2.6:2);fx.ring(LX(l),HY,p?'#ffffff':LC[l],26,14);if(p)fx.spark(LX(l),HY,LC[l],8,3);S('blip');if(combo%25===0)fx.flash(LC[l],6);}else{combo=0;hp-=2;judge='MISS';jt=20;bad[l]=10;}}
  for(const n of notes){n.y+=sp;if(!n.hit&&n.y>HY+20&&!n.miss){n.miss=1;combo=0;hp-=5;judge='MISS';jt=20;bad[n.l]=12;A.shake=2;}}notes=notes.filter(n=>!n.hit&&n.y<H+10);for(let l=0;l<4;l++){if(flash[l])flash[l]--;if(bad[l])bad[l]--;}if(jt)jt--;
  if(hp<=0){g.over='BOOED OFF STAGE';S('lose');}if(t>songLen+200){g.over='ENCORE! '+best+' MAX COMBO';S('win');}};
 const arrow=(x,y,l,col,s)=>{const c=A.c;c.save();c.translate(x,y);c.rotate([Math.PI,Math.PI/2,-Math.PI/2,0][l]);c.scale(s,s);X.poly([[-5,-2],[1,-2],[1,-6],[7,0],[1,6],[1,2],[-5,2]],col);c.restore();};
 g.draw=()=>{X.cache('bl_bg',()=>{X.sky(['#1c0838','#0e0420','#05020c']);const c=A.c;for(let i=0;i<5;i++){const sx=30+i*65;X.poly([[sx-3,0],[sx+3,0],[sx+40-i*18,H],[sx-30-i*6,H]],'rgba(180,120,255,.05)');}
   for(const sx of[8,276]){X.rr(sx,70,36,110,4,X.lg(sx,0,sx+36,0,['#2a2238','#14101e']));for(const[yy,r]of[[96,11],[142,15]]){X.disc(sx+18,yy,r,'#0a0810');X.disc(sx+18,yy,r*.75,X.rg(sx+16,yy-2,1,sx+18,yy,r*.75,['#4a4258','#16121e']));X.disc(sx+18,yy,r*.25,'#2a2436');}}
   X.vg(56,0,208,H,['rgba(0,0,0,.35)','rgba(0,0,0,.6)']);X.vignette(.4);});
  const c=A.c;for(let l=0;l<4;l++){const x=LX(l);X.vg(x-23,0,46,H,['rgba(255,255,255,0)',X.rgba(LC[l],.10+pulse*.08)]);c.fillStyle=X.rgba(LC[l],.25);c.fillRect(x-23,0,1,H);c.fillRect(x+22,0,1,H);if(flash[l])c.fillStyle=X.rgba(LC[l],flash[l]/30),c.fillRect(x-23,0,46,HY);if(bad[l])c.fillStyle='rgba(255,40,60,'+(bad[l]/40)+')',c.fillRect(x-23,0,46,H);}
  X.hg(62,HY-1,196,2,['rgba(255,255,255,0)','rgba(255,255,255,.8)','rgba(255,255,255,0)']);
  for(let l=0;l<4;l++){const x=LX(l),pr=flash[l]>0;if(lo())X.glow(x,HY,pr?30:18,LC[l],pr?.6:.25);X.disc(x,HY,17,'#120a22');A.c.lineWidth=2;A.ring(x,HY,16,LC[l]);X.disc(x,HY,pr?14:12,pr?LC[l]:X.rgba(LC[l],.18));arrow(x,HY,l,pr?'#ffffff':LC[l],pr?1.25:1);}
  notes.forEach(n=>{const x=LX(n.l),k=cl(1-(HY-n.y)/220,.6,1);if(lo())X.glow(x,n.y,18,LC[n.l],.35);X.orb(x,n.y,12*k,LC[n.l]);arrow(x,n.y,n.l,'#ffffff',.9*k);});
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);X.ot('X'+(1+Math.min(4,combo/10|0)),W-8,4,'#ff9838',2,'r');X.meter(6,21,46,5,t/songLen,'#c86dff');
  X.rr(300,40,10,150,5,'rgba(0,0,0,.55)');const hf=Math.max(0,hp/100);X.rr(301,41+148*(1-hf),8,148*hf,4,X.lg(0,40,0,190,['#3dff8b','#ffcf3f','#ff3a4f']));T('HP',305,193,'#fff3d6',1,'c');
  if(combo>=5)X.ot(combo+' COMBO',160,96,'#fff3d6',2,'c');if(jt){const s=jt>14?3+(jt-14)*.15:3;X.ot(judge,160,118-(20-jt)*.6,judge==='MISS'?'#ff4f6d':judge==='PERFECT'?'#ffcf3f':'#2fd6c3',Math.round(s),'c');}};
 return g;}});

const LV=[
'                                                                                  ',
'                                                                          F       ',
'                    ooo                               ooo                 #       ',
'                   #####          o o o              #####      ^^       ##       ',
'          ooo                    #######      e                        ###       ',
'         #####      e                     ########          ####     ####       ',
'   P            #######    ^^         e                e             #####       ',
'##########    ###########################   ##############  #################   ',
];
A.add({id:'pixelquest',name:'PIXEL QUEST',cat:'CLASSICS',how:'ARROWS RUN, A JUMPS (HOLD FOR HIGHER). STOMP ENEMIES, GRAB COINS, REACH THE FLAG.',make(){
 const g={over:null,score:0},TS=16,fx=X.fx();let map,p,cam=0,en=[],lives=3,lvl=0,coins=0,inv=0,coy=0,jb=0,dust=[],land=0;
 const load=()=>{lvl++;map=LV.map(r=>r.split(''));en=[];map.forEach((r,y)=>r.forEach((c,x)=>{if(c==='P'){p={x:x*TS,y:y*TS,vx:0,vy:0,on:false,f:1};r[x]=' ';}if(c==='e'){en.push({x:x*TS,y:y*TS,vx:-.6-lvl*.2,dead:0});r[x]=' ';}}));if(lvl>1){for(let i=0;i<lvl*3;i++){const x=10+ri(60);if(map[6][x]===' '&&map[7][x]==='#')map[6][x]='^';}}};load();
 const tile=(x,y)=>{const r=map[Math.floor(y/TS)];return r?r[Math.floor(x/TS)]||' ':' ';};const solid=(x,y)=>tile(x,y)==='#';const oy=()=>H-map.length*TS;
 g.update=()=>{const k=A.in(0);if(inv>0)inv--;if(land>0)land--;p.vx+=(ax(k)*.55-p.vx*.18);if(ax(k))p.f=ax(k);if(A.hit(0).a)jb=8;else if(jb>0)jb--;if(p.on)coy=6;else if(coy>0)coy--;if(jb>0&&coy>0){p.vy=-5.6;jb=0;coy=0;S('jump');for(let i=0;i<4;i++)dust.push({x:p.x+8,y:p.y+15,vx:rnd(2)-1,t:14});}if(!A.in(0).a&&p.vy<-2)p.vy+=.35;p.vy=Math.min(p.vy+.3,7);
  let nx=p.x+p.vx;if(!solid(nx+2,p.y+2)&&!solid(nx+12,p.y+2)&&!solid(nx+2,p.y+14)&&!solid(nx+12,p.y+14))p.x=Math.max(0,nx);else p.vx=0;let ny=p.y+p.vy;const was=p.on,fall=p.vy;p.on=false;
  if(p.vy>0&&(solid(p.x+3,ny+15)||solid(p.x+11,ny+15))){p.y=Math.floor((ny+15)/TS)*TS-15.01;p.vy=0;p.on=true;if(!was&&fall>3){land=8;for(let i=0;i<5;i++)dust.push({x:p.x+8,y:p.y+15,vx:(i-2)*.6,t:16});}}else if(p.vy<0&&(solid(p.x+3,ny)||solid(p.x+11,ny))){p.vy=0;}else p.y=ny;
  if(p.on&&Math.abs(p.vx)>1.5&&A.t%7===0)dust.push({x:p.x+8-p.f*4,y:p.y+15,vx:-p.f*.4,t:12});dust.forEach(d=>{d.x+=d.vx;d.y-=.25;d.t--;});dust=dust.filter(d=>d.t>0);
  for(let dx of[4,10])for(let dy of[4,12]){const tx=Math.floor((p.x+dx)/TS),ty=Math.floor((p.y+dy)/TS);const c=map[ty]&&map[ty][tx];if(c==='o'){map[ty][tx]=' ';coins++;g.score+=10;S('coin');const sx=tx*TS+8-cam,sy=ty*TS+8+oy();A.burst(sx,sy,K.y,6,1.5);fx.spark(sx,sy,'#fff6a0',6,2);}if(c==='^'&&inv===0){hurt();}if(c==='F'){g.score+=500+lives*100;S('win');A.confetti();if(lvl>=3){g.over='QUEST COMPLETE! WIN';}else{load();fx.flash('#ffffff',10);}return;}}
  for(const e of en){if(e.dead){e.dead++;continue;}const ex=e.x+e.vx;if(solid(ex+(e.vx<0?0:14),e.y+8)||!solid(ex+(e.vx<0?0:14),e.y+18))e.vx*=-1;else e.x=ex;if(Math.abs(e.x-p.x)<13&&Math.abs(e.y-p.y)<14){if(p.vy>0&&p.y<e.y-4){e.dead=1;p.vy=-4.5;g.score+=50;S('hit');A.burst(e.x+8-cam,e.y+8+oy(),K.r,10);fx.ring(e.x+8-cam,e.y+12+oy(),'#ffffff',16,12);A.shake=2;}else if(inv===0)hurt();}}en=en.filter(e=>e.dead<20);
  if(p.y>H+20)hurt(true);const tc=cl(p.x-120+p.f*20,0,LV[0].length*TS-W);cam+=(tc-cam)*.12;};
 const hurt=fell=>{lives--;inv=90;S('boom');A.shake=6;fx.flash('#ff3050',8);if(lives<=0){g.over='GAME OVER';return;}if(fell){p.x=Math.max(0,p.x-120);p.y=40;p.vy=0;while(solid(p.x+8,p.y+15)||!solid(p.x+8,p.y+40)&&p.x>0)p.x-=TS;}};
 g.draw=()=>{X.cache('pq_sky',()=>{X.sky(['#3f8fe8','#7cc0ff','#d8f0ff']);X.glow(260,40,60,'#fff6c0',.5);X.disc(260,40,13,'#fff8d0');});
  const c=A.c,O=oy();X.hills(150,60,'#a8cce8',cam*.15,.012,2);X.hills(175,46,'#7bbf6a',cam*.3,.018,5);X.hills(200,30,'#4fa04a',cam*.5,.03,9);
  for(let i=0;i<6;i++){const x=((i*110-cam*.25-A.t*.1)%(W+120)+W+120)%(W+120)-60,y=40+(i%3)*20;X.ell(x,y+4,22,6,'rgba(150,180,220,.35)');X.disc(x-8,y,9,'#ffffff');X.disc(x+6,y-3,12,'#ffffff');X.disc(x+18,y+1,8,'#ffffff');X.ell(x+4,y+4,22,5,'#eef6ff');}
  const x0=Math.floor(cam/TS);for(let y=0;y<map.length;y++)for(let x=x0;x<x0+22;x++){const ch=map[y][x],sx=Math.round(x*TS-cam),sy=y*TS+O;if(ch==='#'){const top=!(y>0&&map[y-1][x]==='#');X.vg(sx,sy,TS,TS,['#c47a3a','#8e4f22']);c.fillStyle='rgba(60,30,10,.35)';c.fillRect(sx+((x*7+y*3)%11),sy+6+((x*5)%7),2,2);c.fillRect(sx+((x*13+y)%12),sy+11,3,1.5);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(sx+TS-1,sy,1,TS);if(top){X.vg(sx,sy,TS,5,['#7be05a','#3d9a30']);c.fillStyle='#9cf07a';c.fillRect(sx,sy,TS,1);c.fillStyle='#3d9a30';c.fillRect(sx+3,sy+5,2,2);c.fillRect(sx+10,sy+5,2,1);}}
   if(ch==='o'){const w=Math.abs(Math.cos(A.t*.08+x*.7))*5+.6,yy=sy+8+Math.sin(A.t*.1+x)*1.5;if(lo())X.glow(sx+8,yy,9,'#ffcf3f',.3);X.ell(sx+8,yy,w,5.5,X.lg(sx+8-w,0,sx+8+w,0,['#fff3a0','#ffcf3f','#c88a10']));if(w>2)c.fillStyle='rgba(255,255,255,.7)',c.fillRect(sx+8-w*.4,yy-3,1,3);}
   if(ch==='^'){for(let i=0;i<2;i++){const bx=sx+i*8;X.poly([[bx,sy+TS],[bx+4,sy+5],[bx+8,sy+TS]],X.lg(bx,0,bx+8,0,['#f0f0ff','#9090a8','#5a5a70']));}}
   if(ch==='F'){X.rr(sx+6,sy-34,3,50,1,X.lg(sx+6,0,sx+9,0,['#ffffff','#a0a0b0']));X.orb(sx+7.5,sy-35,3,'#ffcf3f');const wv=k=>Math.sin(A.t*.15+k)*2;X.poly([[sx+9,sy-32],[sx+23,sy-30+wv(1)],[sx+21,sy-26+wv(2)],[sx+23,sy-22+wv(3)],[sx+9,sy-21]],'#ff3a4f');X.rr(sx+2,sy+12,11,4,1,'#5a5a6a');}}
  en.forEach(e=>{const sx=e.x-cam,sy=e.y+O;if(e.dead){X.ell(sx+8,sy+14,9,2.5,'#7a3018');return;}const st=Math.sin(A.t*.3+e.x)*2;X.shadow(sx+8,sy+16,7,1.6,.25);X.ell(sx+5+st,sy+15,3,1.6,'#2a1408');X.ell(sx+11-st,sy+15,3,1.6,'#2a1408');X.ell(sx+8,sy+12,5,3.5,'#f0d0a0');X.ell(sx+8,sy+8,8,6,X.rg(sx+5,sy+5,1,sx+8,sy+8,8,['#d0603a','#8a2a18']));X.disc(sx+4,sy+6,1.3,'rgba(255,220,200,.6)');const d=e.vx<0?-1:1;X.disc(sx+6,sy+11,1.8,'#fff');X.disc(sx+10,sy+11,1.8,'#fff');c.fillStyle='#000';c.fillRect(sx+6+d*.6-.6,sy+10.5,1.2,1.6);c.fillRect(sx+10+d*.6-.6,sy+10.5,1.2,1.6);c.fillStyle='#3a1008';c.fillRect(sx+4,sy+8.5,3,.9);c.fillRect(sx+9,sy+8.5,3,.9);});
  dust.forEach(d=>{c.globalAlpha=d.t/16;X.disc(d.x-cam,d.y+O,2+(16-d.t)*.2,'#f0e8d8');});c.globalAlpha=1;
  if(inv%8<5){const air=!p.on,sq=land/8;c.save();c.translate(p.x+8-cam,p.y+16+O);c.scale(1+sq*.25,1-sq*.2);A.person(0,0,{c:'#e8343c',pants:'#2a4ab0',cap:'#e8343c',st:p.on?p.x*.3:1.2,d:p.f,s:.55,id:1,arm1:air?-2.6:undefined,arm2:air?2.4:undefined});c.restore();}
  fx.draw();X.bar('','','');X.orb(10,9,4.5,'#ffcf3f');X.ot('X'+coins,18,4,'#ffcf3f',2);X.ot('1-'+lvl,74,6,'#fff3d6',1);for(let i=0;i<3;i++)X.heart(W-12-i*13,7,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

A.add({id:'coinclicker',name:'COIN TYCOON',cat:'SIM',mouse:1,how:'CLICK THE COIN (OR A). UP/DOWN PICK A BUILDING, B BUYS. REACH 1 MILLION.',make(){
 const g={over:null,score:0},fx=X.fx(),UP=[['CURSOR','👆',15,0,1],['MINER','⛏️',100,1,0],['DRILL','🚜',1100,8,0],['FACTORY','🏭',12000,47,0],['BANK','🏦',130000,260,0],['ROCKET','🚀',1400000,1400,0]];let coins=0,own=UP.map(()=>0),sel=0,t=0,pops=[],pulse=0,rain=[],buyF=[0,0,0,0,0,0];
 const cost=i=>Math.ceil(UP[i][2]*Math.pow(1.15,own[i]));const cps=()=>UP.reduce((a,u,i)=>a+u[3]*own[i],0);const click=()=>1+own[0];
 const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':Math.floor(n)+'';
 const buy=i=>{coins-=cost(i);own[i]++;S('score');buyF[i]=14;A.burst(250,58+i*30,K.y,10);fx.spark(250,55+i*30,'#ffcf3f',8,2);};
 g.update=()=>{t++;coins+=cps()/60;const m=A.mouse.t>0&&Math.hypot(A.mouse.x-90,A.mouse.y-130)<45;if(A.hit(0).a&&(A.mouse.t<=0||m)){coins+=click();pulse=7;pops.push({x:90+rnd(40)-20,y:108,t:30,v:'+'+click()});S('coin');fx.spark(90+rnd(30)-15,130+rnd(30)-15,'#fff6c0',5,2.2);for(let i=0;i<2;i++)rain.push({x:90,y:120,vx:rnd(3)-1.5,vy:-2-rnd(2),a:rnd(6),t:60});}
  const h=A.hit(0);if(h.u)sel=(sel+UP.length-1)%UP.length;if(h.d)sel=(sel+1)%UP.length;if(h.u||h.d)S('blip');if(A.mouse.t>0&&A.hit(0).a&&A.mouse.x>170){const i=Math.floor((A.mouse.y-40)/30);if(i>=0&&i<UP.length){sel=i;if(coins>=cost(i))buy(i);}}
  if(h.b&&coins>=cost(sel))buy(sel);const rate=Math.min(.5,cps()/200);if(lo()&&Math.random()<rate)rain.push({x:10+rnd(150),y:12,vx:0,vy:.5,a:rnd(6),t:200});rain.forEach(r=>{r.vy+=.12;r.x+=r.vx;r.y+=r.vy;r.a+=.15;r.t--;});rain=rain.filter(r=>r.t>0&&r.y<H);if(rain.length>60)rain.splice(0,rain.length-60);
  pops.forEach(p=>{p.t--;p.y-=1;});pops=pops.filter(p=>p.t>0);if(pulse)pulse--;buyF=buyF.map(v=>v?v-1:0);g.score=Math.floor(coins/100);if(coins>=1e6){g.score=10000;g.over='MILLIONAIRE IN '+Math.floor(t/60)+'S! WIN';A.confetti();}};
 g.draw=()=>{X.cache('cc_bg',()=>{X.sky(['#2a1858','#1a1038','#0c0820']);const c=A.c;c.fillStyle='rgba(255,255,255,.03)';for(let i=-20;i<40;i++)c.fillRect(i*12,0,5,H);X.vg(0,190,170,50,['rgba(0,0,0,0)','rgba(0,0,0,.4)']);X.vignette(.5);});
  const c=A.c;if(lo()){c.save();c.translate(90,130);c.rotate(A.t*.006);for(let i=0;i<12;i++){c.rotate(Math.PI/6);X.poly([[0,0],[-10,-90],[10,-90]],'rgba(255,220,120,.07)');}c.restore();X.glow(90,130,70,'#ffcf3f',.35);}
  rain.forEach(r=>{const w=Math.abs(Math.cos(r.a))*3.5+.5;X.ell(r.x,r.y,w,3.5,'#ffcf3f');c.fillStyle='rgba(255,255,255,.6)';c.fillRect(r.x-w*.3,r.y-2,1,2);});
  const r=40+(pulse?pulse*.6:0),sx=1+(pulse>4?.06:0),sy=1-(pulse>4?.06:0);c.save();c.translate(90,130);c.scale(sx,sy);X.shadow(0,44,34,6,.35);X.orb(0,0,r,'#ffcf3f',0);A.c.lineWidth=2;A.ring(0,0,r-6,'#b07810');X.disc(0,0,r-8,X.rg(-8,-10,2,0,0,r-8,['#ffe680','#f0b020','#c88a10']));const st=(o,col)=>{const P=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?9:20;P.push([Math.cos(a)*rr+o,Math.sin(a)*rr+o]);}X.poly(P,col);};st(1.5,'#a06808');st(0,'#fff0a0');c.beginPath();c.arc(0,0,r-1,0,6.283);if(c.clip)c.clip();const sh=((A.t*2)%200)-100;c.globalAlpha=.3;X.poly([[sh-6,-r],[sh+6,-r],[sh-4,r],[sh-16,r]],'#ffffff');c.globalAlpha=1;c.restore();
  pops.forEach(p=>{c.globalAlpha=p.t/30;X.ot(p.v,p.x,p.y,'#fff3d6',1,'c');});c.globalAlpha=1;
  X.ot(fmt(coins),90,24,'#ffcf3f',3,'c');X.ot(fmt(cps())+' PER SEC',90,48,'#fff3d6',1,'c');X.meter(30,186,120,7,Math.log10(Math.max(1,coins))/6,'#ffcf3f');T('GOAL 1M',90,197,'#8d86b8',1,'c');
  UP.forEach((u,i)=>{const y=40+i*30,can=coins>=cost(i);X.panel(172,y,142,27,i===sel?'#ffcf3f':can?'#3dff8b':null);if(buyF[i]){c.globalAlpha=buyF[i]/20;X.rr(172,y,142,27,3,'#ffcf3f');c.globalAlpha=1;}if(i===sel&&lo())X.glow(186,y+13,16,'#ffcf3f',.3);E(u[1],186,y+13,16);T(u[0],200,y+5,can?K.w:K.gr,1);T(fmt(cost(i)),200,y+16,can?K.y:K.gr,1);X.ot(own[i],308,y+9,'#2fd6c3',2,'r');});T('B BUYS SELECTED',243,224,K.gr,1,'c');fx.draw();};
 return g;}});
})();
