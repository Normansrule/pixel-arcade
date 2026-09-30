(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

const FR=[['🍒','#d0203a',7],['🍓','#e8384a',9],['🍇','#8a3ab8',11],['🍊','#ff8a1a',13],['🍋','#ffd83a',15],['🍎','#e0302a',18],['🍐','#b8d040',21],['🍑','#ffa080',24],['🍍','#f0c030',28],['🍈','#a8e070',32],['🍉','#3aa040',37]];
A.add({id:'fruitmerge',name:'FRUIT MERGE',cat:'PUZZLE',mouse:1,how:'MOVE AND DROP WITH A OR CLICK. TWO OF THE SAME FRUIT MERGE. DON\'T OVERFILL.',make(){
 const g={over:null,score:0},BX=90,BW=140,BY=40,BH=190;let fr=[],x=160,next=ri(4),cur=ri(3),cd=0,over=0;
 g.update=()=>{const k=A.in(0);if(A.mouse.t>0)x=A.mouse.x;else x+=ax(k)*3;const r=FR[cur][2];x=cl(x,BX+r,BX+BW-r);if(cd>0)cd--;if(A.hit(0).a&&cd===0){fr.push({x:x+rnd(.2),y:BY+r+2,vx:0,vy:0,k:cur,age:0});cur=next;next=ri(5);cd=30;S('blip');}
  for(let it=0;it<3;it++){for(const f of fr){if(it===0){f.vy+=.25;f.age++;}f.x+=f.vx/3;f.y+=f.vy/3;const r=FR[f.k][2];if(f.x<BX+r){f.x=BX+r;f.vx*=-.3;}if(f.x>BX+BW-r){f.x=BX+BW-r;f.vx*=-.3;}if(f.y>BY+BH-r){f.y=BY+BH-r;f.vy*=-.2;f.vx*=.95;}}
   for(let i=0;i<fr.length;i++)for(let j=i+1;j<fr.length;j++){const a=fr[i],b=fr[j];if(a.dead||b.dead)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,rr=FR[a.k][2]+FR[b.k][2];if(d<rr){if(a.k===b.k&&a.k<FR.length-1){a.dead=b.dead=1;const nk=a.k+1;fr.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:0,vy:-1,k:nk,age:60});g.score+=(nk+1)*(nk+2);S('coin');A.burst((a.x+b.x)/2,(a.y+b.y)/2,FR[nk][1],12,2);continue;}const o=(rr-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx*.5;a.vy+=rv*ny*.5;b.vx-=rv*nx*.5;b.vy-=rv*ny*.5;}}}fr=fr.filter(f=>!f.dead);}
  fr.forEach(f=>{f.vx*=.99;});if(fr.some(f=>f.age>90&&f.y-FR[f.k][2]<BY+14))over++;else over=0;if(over>90){g.over='OVERFLOW';S('lose');}};
 g.draw=()=>{A.cls('#fbe4c0');R(BX-6,BY,6,BH+6,'#b5651d');R(BX+BW,BY,6,BH+6,'#b5651d');R(BX-6,BY+BH,BW+12,6,'#b5651d');R(BX,BY+14,BW,1,over>0&&A.t%10<5?K.r:'rgba(200,80,60,.4)');
  fr.forEach(f=>{const r=FR[f.k][2];C(f.x,f.y,r,FR[f.k][1]);E(FR[f.k][0],f.x,f.y+1,r*1.5);});const r=FR[cur][2];R(x,BY,1,BH,'rgba(0,0,0,.15)');C(x,BY-2,r,FR[cur][1]);E(FR[cur][0],x,BY-1,r*1.5);
  T('SCORE',270,40,K.k,1,'c');T(g.score,270,52,K.k,2,'c');T('NEXT',270,90,K.k,1,'c');C(270,116,FR[next][2],FR[next][1]);E(FR[next][0],270,117,FR[next][2]*1.5);FR.forEach((f,i)=>E(f[0],12+ (i%2)*22+ (i>5?0:0),20+i*19,14));};
 return g;}});

const SL=['🍉','🍍','🍎','🍊','🍋','🍑','🥥','🍐'];
A.add({id:'fruitslice',name:'FRUIT SLICE',cat:'CLASSICS',mouse:1,how:'SWIPE THROUGH FRUIT WITH THE MOUSE (OR MOVE + HOLD A). AVOID BOMBS. 3 MISSES.',make(){
 const g={over:null,score:0};let items=[],trail=[],cx=160,cy=120,miss=0,t=0,combo=0,ct=0,halves=[];
 g.update=()=>{t++;const k=A.in(0);let px=cx,py=cy;if(A.mouse.t>0){cx=A.mouse.x;cy=A.mouse.y;}else{cx=cl(cx+ax(k)*5,0,W);cy=cl(cy+ay(k)*5,0,H);}const cutting=A.mouse.t>0?Math.hypot(cx-px,cy-py)>3:A.in(0).a;trail.push({x:cx,y:cy,on:cutting});if(trail.length>8)trail.shift();
  if(t%Math.max(26,60-(t/300|0))===0){const n=1+ri(Math.min(4,1+t/900|0));for(let i=0;i<n;i++)items.push({x:60+rnd(200),y:H+14,vx:rnd(2)-1,vy:-6.5-rnd(1.8),bomb:Math.random()<.14,e:SL[ri(SL.length)],a:rnd(6),va:rnd(.2)-.1});}
  if(ct>0)ct--;else combo=0;for(const f of items){f.vy+=.12;f.x+=f.vx;f.y+=f.vy;f.a+=f.va;if(!f.cut&&cutting){const d=Math.hypot(f.x-cx,f.y-cy);if(d<16){f.cut=1;if(f.bomb){g.over='BOOM';S('boom');A.burst(f.x,f.y,K.o,40,4);}else{combo++;ct=12;g.score+=1+(combo>2?combo:0);S('hit');A.burst(f.x,f.y,'#ffd0a0',12,2.5);halves.push({x:f.x-4,y:f.y,vx:-1.4,vy:-1,e:f.e,a:f.a},{x:f.x+4,y:f.y,vx:1.4,vy:-1,e:f.e,a:f.a+1});}}}
   if(f.y>H+20&&f.vy>0&&!f.cut&&!f.bomb&&!f.gone){f.gone=1;miss++;S('lose');if(miss>=3)g.over='3 DROPPED';}}items=items.filter(f=>!f.cut&&f.y<H+30);halves.forEach(h=>{h.vy+=.15;h.x+=h.vx;h.y+=h.vy;h.a+=.1;});halves=halves.filter(h=>h.y<H+20);};
 g.draw=()=>{A.cls('#5a3a28');for(let i=0;i<8;i++)R(0,i*30,W,2,'#4a2a1a');items.forEach(f=>{if(f.bomb){C(f.x,f.y,10,'#2a2a34');R(f.x-1,f.y-15,2,5,K.o);if(A.t%6<3)C(f.x,f.y-16,2,K.y);}else E(f.e,f.x,f.y,26);});halves.forEach(h=>{A.c.save&&A.c.save();A.c.globalAlpha=.8;E(h.e,h.x,h.y,18);A.c.globalAlpha=1;A.c.restore&&A.c.restore();});
  for(let i=1;i<trail.length;i++)if(trail[i].on)L(trail[i-1].x,trail[i-1].y,trail[i].x,trail[i].y,'#ffffff',i/2);T('SCORE '+g.score,6,6,K.y,2);T('X'.repeat(miss)+'x'.repeat(3-miss),W-6,6,K.r,2,'r');if(combo>2)T(combo+' COMBO!',160,30,K.y,2,'c');};
 return g;}});

A.add({id:'beatlanes',name:'BEAT LANES',cat:'CLASSICS',how:'NOTES FALL IN 4 LANES. PRESS LEFT, DOWN, UP, RIGHT AS THEY HIT THE LINE.',make(){
 const g={over:null,score:0},LK=['l','d','u','r'],LC=[K.p,K.c,K.g,K.o];let notes=[],t=0,combo=0,best=0,hp=100,judge='',jt=0,beat=0,bpm=110,flash=[0,0,0,0];
 const sp=2.2,HY=200,songLen=60*75;
 g.update=()=>{t++;const per=Math.round(3600/bpm/2);if(t<songLen&&t%per===0){beat++;const pat=beat%16;if(beat<32?pat%4===0:(Math.random()<.7||pat%4===0)){const l=ri(4);notes.push({l,y:-10});if(beat>40&&Math.random()<.2)notes.push({l:(l+2)%4,y:-10});}}if(t%(60*20)===0)bpm+=10;
  const h=A.hit(0);for(let l=0;l<4;l++)if(h[LK[l]]){flash[l]=8;const n=notes.filter(n=>n.l===l&&!n.hit).sort((a,b)=>Math.abs(a.y-HY)-Math.abs(b.y-HY))[0];if(n&&Math.abs(n.y-HY)<18){n.hit=1;const p=Math.abs(n.y-HY)<7;combo++;best=Math.max(best,combo);g.score+=(p?300:100)*(1+Math.min(4,combo/10|0));judge=p?'PERFECT':'GOOD';jt=20;hp=Math.min(100,hp+2);A.burst(80+l*54,HY,LC[l],8,2);S('blip');}else{combo=0;hp-=2;judge='MISS';jt=20;}}
  for(const n of notes){n.y+=sp;if(!n.hit&&n.y>HY+20&&!n.miss){n.miss=1;combo=0;hp-=5;judge='MISS';jt=20;}}notes=notes.filter(n=>!n.hit&&n.y<H+10);for(let l=0;l<4;l++)if(flash[l])flash[l]--;if(jt)jt--;
  if(hp<=0){g.over='BOOED OFF STAGE';S('lose');}if(t>songLen+200){g.over='ENCORE! '+best+' MAX COMBO';S('win');}};
 g.draw=()=>{A.cls('#12081f');for(let l=0;l<4;l++){const x=80+l*54;R(x-24,0,48,H,l%2?'#1a0f2e':'#160b28');if(flash[l])R(x-24,0,48,H,'rgba(255,255,255,'+flash[l]/40+')');C(x,HY,16,flash[l]?LC[l]:'#2b2257');A.ring(x,HY,16,LC[l]);T(['<','V','^','>'][l],x,HY-3,K.w,1,'c');}
  notes.forEach(n=>{const x=80+n.l*54;C(x,n.y,13,LC[n.l]);C(x,n.y,6,K.w);});R(290,40,8,160,K.d);R(290,40+160*(1-hp/100),8,160*hp/100,hp<30?K.r:K.g);T('SCORE '+g.score,6,6,K.y,1);T('COMBO '+combo,6,18,K.w,1);if(jt)T(judge,160,120,judge==='MISS'?K.r:judge==='PERFECT'?K.y:K.c,3,'c');R(0,H-3,W*Math.min(1,t/songLen),3,K.p);};
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
 const g={over:null,score:0},TS=16;let map,p,cam=0,en=[],lives=3,lvl=0,coins=0,inv=0;
 const load=()=>{lvl++;map=LV.map(r=>r.split(''));en=[];map.forEach((r,y)=>r.forEach((c,x)=>{if(c==='P'){p={x:x*TS,y:y*TS,vx:0,vy:0,on:false,f:1};r[x]=' ';}if(c==='e'){en.push({x:x*TS,y:y*TS,vx:-.6-lvl*.2,dead:0});r[x]=' ';}}));if(lvl>1){for(let i=0;i<lvl*3;i++){const x=10+ri(60);if(map[6][x]===' '&&map[7][x]==='#')map[6][x]='^';}}};load();
 const tile=(x,y)=>{const r=map[Math.floor(y/TS)];return r?r[Math.floor(x/TS)]||' ':' ';};const solid=(x,y)=>tile(x,y)==='#';
 g.update=()=>{const k=A.in(0);if(inv>0)inv--;p.vx+=(ax(k)*.5-p.vx*.18);if(ax(k))p.f=ax(k);if(A.hit(0).a&&p.on){p.vy=-5.6;S('jump');}if(!A.in(0).a&&p.vy<-2)p.vy+=.35;p.vy=Math.min(p.vy+.3,7);
  let nx=p.x+p.vx;if(!solid(nx+2,p.y+2)&&!solid(nx+12,p.y+2)&&!solid(nx+2,p.y+14)&&!solid(nx+12,p.y+14))p.x=Math.max(0,nx);else p.vx=0;let ny=p.y+p.vy;p.on=false;
  if(p.vy>0&&(solid(p.x+3,ny+15)||solid(p.x+11,ny+15))){p.y=Math.floor((ny+15)/TS)*TS-15.01;p.vy=0;p.on=true;}else if(p.vy<0&&(solid(p.x+3,ny)||solid(p.x+11,ny))){p.vy=0;}else p.y=ny;
  for(let dx of[4,10])for(let dy of[4,12]){const tx=Math.floor((p.x+dx)/TS),ty=Math.floor((p.y+dy)/TS);const c=map[ty]&&map[ty][tx];if(c==='o'){map[ty][tx]=' ';coins++;g.score+=10;S('coin');}if(c==='^'&&inv===0){hurt();}if(c==='F'){g.score+=500+lives*100;S('win');A.confetti();if(lvl>=3){g.over='QUEST COMPLETE! WIN';}else load();return;}}
  for(const e of en){if(e.dead){e.dead++;continue;}const ex=e.x+e.vx;if(solid(ex+(e.vx<0?0:14),e.y+8)||!solid(ex+(e.vx<0?0:14),e.y+18))e.vx*=-1;else e.x=ex;if(Math.abs(e.x-p.x)<13&&Math.abs(e.y-p.y)<14){if(p.vy>0&&p.y<e.y-4){e.dead=1;p.vy=-4;g.score+=50;S('hit');A.burst(e.x+8-cam,e.y+8,K.r,10);}else if(inv===0)hurt();}}en=en.filter(e=>e.dead<20);
  if(p.y>H+20)hurt(true);cam=cl(p.x-120,0,LV[0].length*TS-W);};
 const hurt=fell=>{lives--;inv=90;S('boom');if(lives<=0){g.over='GAME OVER';return;}if(fell){p.x=Math.max(0,p.x-120);p.y=40;p.vy=0;while(solid(p.x+8,p.y+15)||!solid(p.x+8,p.y+40)&&p.x>0)p.x-=TS;}};
 g.draw=()=>{A.skyband('#5ab0ff','#d8f0ff',H);for(let i=0;i<6;i++){const x=((i*110-cam*.3)%(W+120)+W+120)%(W+120)-60;C(x,60+(i%3)*18,16,'#ffffff');C(x+16,64+(i%3)*18,12,'#ffffff');}for(let i=0;i<5;i++){const x=((i*140-cam*.5)%(W+160)+W+160)%(W+160)-80;A.poly([[x-60,H],[x,110],[x+60,H]],'#7ab85a',1);}
  const x0=Math.floor(cam/TS);for(let y=0;y<map.length;y++)for(let x=x0;x<x0+22;x++){const c=map[y][x],sx=x*TS-cam,sy=y*TS+(H-map.length*TS);if(c==='#'){R(sx,sy,TS,TS,'#b5651d');R(sx,sy,TS,4,y>0&&map[y-1][x]!=='#'?'#4ab040':'#b5651d');}if(c==='o'){C(sx+8,sy+8,4+Math.sin(A.t*.15+x)*1,K.y);}if(c==='^')A.poly([[sx,sy+TS],[sx+8,sy+4],[sx+16,sy+TS]],'#c8c8d8',1);if(c==='F'){R(sx+7,sy-30,2,46,K.w);R(sx+9,sy-30,14,10,K.r);}}
  const oy=H-map.length*TS;en.forEach(e=>{const sx=e.x-cam,sy=e.y+oy;if(e.dead){R(sx,sy+12,16,4,'#8a3a2a');return;}C(sx+8,sy+9,7,'#8a3a2a');R(sx+2,sy+13,12,3,'#5a2a1a');R(sx+4,sy+6,3,3,K.w);R(sx+9,sy+6,3,3,K.w);});
  if(inv%8<5)A.person(p.x+8-cam,p.y+16+oy,{c:K.r,pants:'#2a4ab0',cap:K.r,st:p.on?p.x*.3:1.2,d:p.f,s:.55,id:1});T('COINS '+coins,6,6,K.y,1);T('WORLD 1-'+lvl,160,6,K.w,1,'c');T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'coinclicker',name:'COIN TYCOON',cat:'SIM',mouse:1,how:'CLICK THE COIN (OR A). UP/DOWN PICK A BUILDING, B BUYS. REACH 1 MILLION.',make(){
 const g={over:null,score:0},UP=[['CURSOR','👆',15,0,1],['MINER','⛏️',100,1,0],['DRILL','🚜',1100,8,0],['FACTORY','🏭',12000,47,0],['BANK','🏦',130000,260,0],['ROCKET','🚀',1400000,1400,0]];let coins=0,own=UP.map(()=>0),sel=0,t=0,pops=[],pulse=0;
 const cost=i=>Math.ceil(UP[i][2]*Math.pow(1.15,own[i]));const cps=()=>UP.reduce((a,u,i)=>a+u[3]*own[i],0);const click=()=>1+own[0];
 const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':Math.floor(n)+'';
 g.update=()=>{t++;coins+=cps()/60;const m=A.mouse.t>0&&Math.hypot(A.mouse.x-90,A.mouse.y-130)<45;if(A.hit(0).a&&(A.mouse.t<=0||m)){coins+=click();pulse=6;pops.push({x:90+rnd(40)-20,y:110,t:30,v:'+'+click()});S('coin');}
  const h=A.hit(0);if(h.u)sel=(sel+UP.length-1)%UP.length;if(h.d)sel=(sel+1)%UP.length;if(h.u||h.d)S('blip');if(A.mouse.t>0&&A.hit(0).a&&A.mouse.x>170){const i=Math.floor((A.mouse.y-40)/30);if(i>=0&&i<UP.length){sel=i;if(coins>=cost(i)){coins-=cost(i);own[i]++;S('score');}}}
  if(h.b&&coins>=cost(sel)){coins-=cost(sel);own[sel]++;S('score');A.burst(250,55+sel*30,K.y,8);}pops.forEach(p=>{p.t--;p.y-=1;});pops=pops.filter(p=>p.t>0);if(pulse)pulse--;g.score=Math.floor(coins/100);if(coins>=1e6){g.score=10000;g.over='MILLIONAIRE IN '+Math.floor(t/60)+'S! WIN';A.confetti();}};
 g.draw=()=>{A.cls('#1a1238');T(fmt(coins),90,40,K.y,3,'c');T(fmt(cps())+' PER SEC',90,64,K.w,1,'c');const r=40+(pulse?3:0);C(90,130,r,'#ffcf3f');A.ring(90,130,r-6,'#c89020');A.emoji('🪙',90,130,44);pops.forEach(p=>T(p.v,p.x,p.y,K.w,1,'c'));
  UP.forEach((u,i)=>{const y=40+i*30,can=coins>=cost(i);R(172,y,142,27,i===sel?'#3a2a78':'#241a4d');if(i===sel)A.box(172,y,142,27,K.y);A.emoji(u[1],186,y+13,16);T(u[0],200,y+5,can?K.w:K.gr,1);T(fmt(cost(i)),200,y+16,can?K.y:K.gr,1);T(own[i],308,y+10,K.c,2,'r');});T('B BUYS SELECTED',243,226,K.gr,1,'c');};
 return g;}});
})();
