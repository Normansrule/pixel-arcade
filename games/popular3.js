(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

A.add({id:'blackhole',name:'BLACK HOLE',cat:'CLASSICS',mouse:1,how:'MOVE THE HOLE. SWALLOW THINGS SMALLER THAN YOU TO GROW. 90 SECONDS.',make(){
 const g={over:null,score:0},ITEMS=[['🌸',4,1],['🍎',5,1],['⚽',6,2],['🪑',8,3],['🧍',10,5],['🌳',14,8],['🚗',16,12],['🏠',24,25],['🏢',34,50]];let h={x:0,y:0,r:10},obj=[],time=5400,fall=[];
 for(let i=0;i<420;i++){const k=Math.min(ITEMS.length-1,Math.floor(Math.pow(Math.random(),2)*ITEMS.length));obj.push({x:rnd(900)-450,y:rnd(900)-450,k});}
 g.update=()=>{time--;if(time<=0){g.over='SWALLOWED '+g.score;return;}const k=A.in(0);let dx=ax(k),dy=ay(k);if(A.mouse.t>0){dx=(A.mouse.x-160)/60;dy=(A.mouse.y-120)/60;}const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}h.x=cl(h.x+dx*2.4,-440,440);h.y=cl(h.y+dy*2.4,-440,440);
  obj=obj.filter(o=>{const it=ITEMS[o.k],d=Math.hypot(o.x-h.x,o.y-h.y);if(d<h.r-it[1]*.3&&it[1]<h.r*.9){fall.push({...o,t:20});g.score+=it[2];h.r=Math.min(60,h.r+it[2]*.06);S('coin');return false;}return true;});fall.forEach(f=>{f.t--;f.x+=(h.x-f.x)*.2;f.y+=(h.y-f.y)*.2;});fall=fall.filter(f=>f.t>0);};
 g.draw=()=>{A.cls('#8fbf6a');const cx=h.x-160,cy=h.y-120;for(let x=-450;x<=450;x+=60)R(x-cx-10,-450-cy,20,900,'#9a9aa8');for(let y=-450;y<=450;y+=60)R(-450-cx,y-cy-10,900,20,'#9a9aa8');
  A.c.fillStyle='#050505';A.c.beginPath();A.c.arc(160,120,h.r,0,7);A.c.fill();A.ring(160,120,h.r,'#3a3a4a');
  obj.forEach(o=>{const x=o.x-cx,y=o.y-cy,it=ITEMS[o.k];if(x>-40&&x<W+40&&y>-40&&y<H+40)E(it[0],x,y,it[1]*2);});fall.forEach(f=>E(ITEMS[f.k][0],f.x-cx,f.y-cy,ITEMS[f.k][1]*2*f.t/20));T('SCORE '+g.score,6,6,K.k,2);T(Math.ceil(time/60),W-6,6,K.k,2,'r');T('SIZE '+Math.round(h.r),160,6,K.k,1,'c');};
 return g;}});

A.add({id:'territory',name:'TERRITORY',cat:'ACTION',how:'LEAVE YOUR ZONE, LOOP BACK TO CLAIM LAND. DON\'T LET ANYONE CROSS YOUR TRAIL.',make(){
 const g={over:null,score:0},GW=64,GH=44,CS=5;let own=new Int8Array(GW*GH).fill(-1),trail=new Int8Array(GW*GH).fill(-1),pl=[],time=5400;const COL=[K.c,K.p,K.o,K.g];
 const spawn=(i,x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)own[(y+dy)*GW+x+dx]=i;pl[i]={x,y,d:[1,0],alive:true,mv:0,t:0};};spawn(0,10,10);spawn(1,52,10);spawn(2,10,34);spawn(3,52,34);
 const fill=i=>{const out=new Uint8Array(GW*GH),q=[];for(let x=0;x<GW;x++){q.push(x,(GH-1)*GW+x);}for(let y=0;y<GH;y++){q.push(y*GW,y*GW+GW-1);}while(q.length){const c=q.pop();if(out[c]||own[c]===i||trail[c]===i)continue;out[c]=1;const x=c%GW,y=(c/GW)|0;if(x>0)q.push(c-1);if(x<GW-1)q.push(c+1);if(y>0)q.push(c-GW);if(y<GH-1)q.push(c+GW);}let n=0;for(let c=0;c<GW*GH;c++){if(!out[c]&&own[c]!==i){own[c]=i;n++;}if(trail[c]===i)trail[c]=-1;}return n;};
 const die=i=>{pl[i].alive=false;for(let c=0;c<GW*GH;c++){if(trail[c]===i)trail[c]=-1;if(own[c]===i)own[c]=-1;}if(i===0){g.over='CUT OFF';S('boom');}else{S('hit');setTimeout&&0;pl[i].respawn=240;}};
 g.update=()=>{time--;if(time<=0){g.over=(g.score/(GW*GH)*100).toFixed(1)+'% CLAIMED';return;}
  for(let i=0;i<4;i++){const p=pl[i];if(!p.alive){if(i>0&&--p.respawn<=0){const x=6+ri(52),y=6+ri(32);spawn(i,x,y);}continue;}
   if(i===0){const k=A.hit(0);if(k.l&&p.d[0]!==1)p.d=[-1,0];if(k.r&&p.d[0]!==-1)p.d=[1,0];if(k.u&&p.d[1]!==1)p.d=[0,-1];if(k.d&&p.d[1]!==-1)p.d=[0,1];}
   else{p.t++;const inOwn=own[p.y*GW+p.x]===i;if((!inOwn&&p.t>18+ri(10))||(inOwn&&p.t>12&&Math.random()<.1)){p.t=0;const opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>!(d[0]===-p.d[0]&&d[1]===-p.d[1]));let best=opts[0],bd=-1e9;for(const d of opts){const nx=p.x+d[0]*3,ny=p.y+d[1]*3;if(nx<1||ny<1||nx>=GW-1||ny>=GH-1)continue;let s=Math.random()*3;if(!inOwn){s+=own[ny*GW+nx]===i?10:0;}if(trail[ny*GW+nx]===i)s-=50;if(s>bd){bd=s;best=d;}}p.d=best;}}
   if(++p.mv<(i===0?4:5))continue;p.mv=0;const nx=p.x+p.d[0],ny=p.y+p.d[1];if(nx<0||ny<0||nx>=GW||ny>=GH){if(i===0){die(0);return;}p.d=[-p.d[0],-p.d[1]];continue;}const c=ny*GW+nx;
   if(trail[c]>=0&&trail[c]!==i){const v=trail[c];die(v);if(v===0)return;g.score+=i===0?300:0;}if(trail[c]===i){die(i);if(i===0)return;continue;}p.x=nx;p.y=ny;
   if(own[c]===i){if(pl[i].out){const n=fill(i);if(i===0)S('score');pl[i].out=false;}}else{trail[c]=i;pl[i].out=true;}
   for(let j=0;j<4;j++)if(j!==i&&pl[j].alive&&pl[j].x===nx&&pl[j].y===ny){const loser=own[c]===j?i:j;die(loser);if(loser===0)return;}}
  let n=0;for(let c=0;c<GW*GH;c++)if(own[c]===0)n++;g.score=n;};
 g.draw=()=>{A.cls('#eef0f6');for(let c=0;c<GW*GH;c++){const x=(c%GW)*CS,y=20+((c/GW)|0)*CS;if(own[c]>=0)R(x,y,CS,CS,A.mix(COL[own[c]],'#ffffff',.35));if(trail[c]>=0)R(x+1,y+1,CS-2,CS-2,COL[trail[c]]);}pl.forEach((p,i)=>{if(p.alive){R(p.x*CS-1,20+p.y*CS-1,CS+2,CS+2,A.mix(COL[i],'#000000',.3));}});
  R(0,0,W,20,'#1a1238');T('YOU '+(g.score/(GW*GH)*100).toFixed(1)+'%',6,6,K.c,1);T(Math.ceil(time/60),W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'knifehit',name:'KNIFE HIT',cat:'CLASSICS',how:'A THROWS A KNIFE INTO THE SPINNING LOG. DON\'T HIT ANOTHER KNIFE. CLEAR 8 LOGS.',make(){
 const g={over:null,score:0};let lvl=0,a=0,sp,stuck,left,fly=null,apples,wob=0,rev;const gen=()=>{lvl++;a=0;sp=.03+lvl*.006;stuck=[];for(let i=0;i<Math.min(4,lvl-1);i++)stuck.push(rnd(6.28));apples=[rnd(6.28)];left=5+lvl;rev=lvl>3;};gen();
 g.update=()=>{const t=A.t;const spd=rev?sp*(1+Math.sin(t*.02)*1.2):sp;a+=spd;if(wob)wob--;if(A.hit(0).a&&!fly&&left>0){fly={y:210};S('shoot');}
  if(fly){fly.y-=12;if(fly.y<=150){const hitA=((Math.PI/2-a)%6.283+6.283)%6.283;if(stuck.some(s=>Math.abs(((s-hitA+9.42)%6.283)-3.14)<.18)){g.over='CLANG! LOG '+lvl;S('boom');A.shake=8;return;}const ap=apples.findIndex(s=>Math.abs(((s-hitA+9.42)%6.283)-3.14)<.25);if(ap>=0){apples.splice(ap,1);g.score+=5;S('coin');}stuck.push(hitA);left--;g.score++;wob=6;S('hit');fly=null;if(left===0){S('win');A.burst(160,100,'#8a5c33',40,4);gen();if(lvl>8){g.over='ALL LOGS CLEARED! WIN';}}}}};
 g.draw=()=>{A.cls('#2a2438');const cy=100,r=40+(wob?1:0);C(160,cy,r,'#a0703a');A.ring(160,cy,r*.7,'#8a5c33');A.ring(160,cy,r*.4,'#8a5c33');stuck.forEach(s=>{const ang=s+a;const x=160+Math.cos(ang)*r,y=cy+Math.sin(ang)*r;L(x,y,160+Math.cos(ang)*(r+22),cy+Math.sin(ang)*(r+22),'#d8d8e8',3);R(160+Math.cos(ang)*(r+22)-2,cy+Math.sin(ang)*(r+22)-2,4,4,'#3a2a1a');});
  apples.forEach(s=>E('🍎',160+Math.cos(s+a)*(r+8),cy+Math.sin(s+a)*(r+8),14));if(fly){R(158,fly.y,4,24,'#d8d8e8');R(157,fly.y+18,6,10,'#3a2a1a');}else if(left>0){R(158,200,4,24,'#d8d8e8');R(157,218,6,10,'#3a2a1a');}
  for(let i=0;i<left;i++)R(12,220-i*9,4,7,K.w);T('LOG '+lvl,160,6,K.w,1,'c');T(g.score,160,16,K.y,2,'c');};
 return g;}});

A.add({id:'colorswitch',name:'COLOR SWITCH',cat:'CLASSICS',how:'TAP A TO HOP. PASS ONLY THROUGH YOUR OWN COLOUR. STARS SCORE, SWITCHERS CHANGE COLOUR.',make(){
 const g={over:null,score:0},CO=['#ff3f8e','#ffcf3f','#2fe8d0','#7a5cff'];let b={y:190,vy:0,c:0},obs=[],cam=0,t=0;const add=y=>obs.push({y,k:ri(3),a:rnd(6.28),sp:(.02+Math.min(.03,g.score*.002))*(Math.random()<.5?1:-1),star:true,sw:true});for(let i=0;i<4;i++)add(90-i*170);
 g.update=()=>{t++;if(A.hit(0).a){b.vy=-4.2;S('jump');}b.vy+=.22;b.y+=b.vy;if(b.y-120<cam)cam+=(b.y-120-cam)*.2;if(b.y>cam+H+10){g.over='FELL';return;}
  for(const o of obs){o.a+=o.sp;if(o.star&&Math.abs(b.y-o.y)<6){o.star=false;g.score++;S('coin');}if(o.sw&&Math.abs(b.y-(o.y-85))<8){o.sw=false;b.c=(b.c+1+ri(3))%4;S('blip');}
   if(o.k===0){const dy=b.y-o.y,d=Math.abs(dy);if(d>44&&d<54){const ang=((Math.atan2(dy,0)-o.a)%6.283+6.283)%6.283,seg=Math.floor(ang/1.5708);if(seg!==b.c){die();return;}}}
   if(o.k===1){const dy=b.y-o.y;if(Math.abs(dy)<5){const seg=Math.floor((((160-(o.a*60))%320+320)%320)/80);if(seg!==b.c){die();return;}}}
   if(o.k===2){for(let s=0;s<4;s++){const ang=o.a+s*1.5708,x=160+Math.cos(ang)*38,y=o.y+Math.sin(ang)*38;if(Math.abs(b.y-y)<7&&Math.abs(160-x)<8&&s!==b.c){die();return;}}}}
  if(obs[obs.length-1].y>cam-200)add(obs[obs.length-1].y-170);obs=obs.filter(o=>o.y<cam+H+80);};
 const die=()=>{g.over='WRONG COLOUR';S('boom');A.burst(160,b.y-cam,CO[b.c],30,3);};
 g.draw=()=>{A.cls('#141418');obs.forEach(o=>{const y=o.y-cam;if(o.k===0){for(let s=0;s<4;s++){A.c.strokeStyle=CO[s];A.c.lineWidth=9;A.c.beginPath();A.c.arc(160,y,49,o.a+s*1.5708,o.a+(s+1)*1.5708);A.c.stroke();}}if(o.k===1){for(let s=0;s<5;s++){const x=((s*80+o.a*60)%400+400)%400-80;R(x,y-4,80,8,CO[s%4]);}}if(o.k===2){for(let s=0;s<4;s++){const ang=o.a+s*1.5708;L(160,y,160+Math.cos(ang)*44,y+Math.sin(ang)*44,CO[s],7);}}
   if(o.star)E('⭐',160,y,14);if(o.sw){for(let s=0;s<4;s++){A.c.fillStyle=CO[s];A.c.beginPath();A.c.moveTo(160,y-85);A.c.arc(160,y-85,7,s*1.5708,(s+1)*1.5708);A.c.fill();}}});C(160,b.y-cam,7,CO[b.c]);T(g.score,W-12,10,K.w,3,'r');};
 return g;}});

A.add({id:'pianotiles',name:'PIANO TILES',cat:'CLASSICS',how:'PRESS THE LANE OF THE LOWEST BLACK TILE: LEFT, DOWN, UP, RIGHT. DON\'T MISS ONE.',make(){
 const g={over:null,score:0},LK=['l','d','u','r'];let rows=[],sp=1.6,t=0;const NOTES=[262,294,330,349,392,440,494,523];for(let i=0;i<6;i++)rows.push({y:-i*60+120,l:ri(4),hit:false});
 g.update=()=>{t++;sp=1.6+g.score*.03;rows.forEach(r=>r.y+=sp);if(rows[rows.length-1].y>-60)rows.push({y:rows[rows.length-1].y-60,l:ri(4),hit:false});const lowest=rows.find(r=>!r.hit);
  const h=A.hit(0);for(let l=0;l<4;l++)if(h[LK[l]]){if(lowest&&lowest.l===l){lowest.hit=true;g.score++;S('blip');}else{g.over='WRONG TILE';S('lose');return;}}
  if(lowest&&lowest.y>H){g.over='MISSED A TILE';S('lose');}rows=rows.filter(r=>r.y<H+60);};
 g.draw=()=>{A.cls('#f2f2f2');for(let l=1;l<4;l++)R(l*80,0,1,H,'#c8c8d0');rows.forEach(r=>{R(r.l*80+1,r.y,78,58,r.hit?'#c8c8d8':'#101014');if(!r.hit)R(r.l*80+1,r.y,78,3,'#3a3a44');});T(g.score,160,10,K.r,4,'c');['<','V','^','>'].forEach((s,i)=>T(s,i*80+40,226,K.gr,1,'c'));};
 return g;}});

A.add({id:'sling',name:'SLING SIEGE',cat:'CLASSICS',how:'UP/DOWN AIM, HOLD A FOR POWER, RELEASE TO LAUNCH. TOPPLE THE TOWER AND HIT THE PIGS.',make(){
 const g={over:null,score:0};let ang=.6,pw=0,birds,shot=null,blocks=[],pigs=[],lvl=0,settle=0;
 const gen=()=>{lvl++;birds=3+(lvl>2?1:0);blocks=[];pigs=[];const bx=200+ri(20);const layers=2+Math.min(3,lvl);for(let l=0;l<layers;l++){const y=210-l*26;blocks.push({x:bx,y:y-12,w:6,h:24,vx:0,vy:0,va:0,a:0},{x:bx+40,y:y-12,w:6,h:24,vx:0,vy:0,va:0,a:0},{x:bx+20,y:y-27,w:50,h:6,vx:0,vy:0,va:0,a:0});pigs.push({x:bx+20,y:y-6,vx:0,vy:0,hp:1});}shot=null;};gen();
 const phys=o=>{if(!o.awake)return;o.vy+=.2;o.x+=o.vx;o.y+=o.vy;o.vx*=.97;let floorY=214;for(const q of blocks){if(q===o)continue;if(Math.abs(q.x-o.x)<(q.w+o.w)/2-1&&q.y>o.y&&q.y-q.h/2<o.y+o.h/2+1&&q.y-q.h/2>o.y-2)floorY=Math.min(floorY,q.y-q.h/2);}const gy=floorY-o.h/2;if(o.y>gy){o.y=gy;if(o.vy>1.5){for(const q of blocks)if(q!==o&&Math.abs(q.x-o.x)<(q.w+o.w)/2&&q.y>o.y)q.awake=true;}o.vy*=-.15;o.vx*=.7;}if(Math.abs(o.vx)+Math.abs(o.vy)<.05){o.rest=(o.rest||0)+1;if(o.rest>30)o.awake=false;}else o.rest=0;};
 const unsupported=()=>{for(const b of blocks){if(b.awake||b.y>=214-b.h/2-1)continue;const sup=blocks.some(q=>q!==b&&Math.abs(q.x-b.x)<(q.w+b.w)/2&&Math.abs((q.y-q.h/2)-(b.y+b.h/2))<2);if(!sup)b.awake=true;}};
 g.update=()=>{const k=A.in(0);if(!shot){if(birds>0&&!settle){ang=cl(ang-ay(k)*.02,.1,1.3);if(k.a)pw=Math.min(1,pw+.02);else if(pw>.08){shot={x:50,y:180,vx:Math.cos(ang)*(3+pw*6),vy:-Math.sin(ang)*(3+pw*6),t:0};birds--;pw=0;S('shoot');}}}
  else{shot.vy+=.15;shot.x+=shot.vx;shot.y+=shot.vy;shot.t++;for(const b of blocks){if(Math.abs(shot.x-b.x)<b.w/2+5&&Math.abs(shot.y-b.y)<b.h/2+5){b.awake=true;b.vx+=shot.vx*.6;b.vy+=shot.vy*.3-1;shot.vx*=.4;S('hit');}}for(const p of pigs)if(p.hp>0&&Math.hypot(shot.x-p.x,shot.y-p.y)<10){p.hp=0;g.score+=500;S('score');A.burst(p.x,p.y,K.g,16);}
   if(shot.y>210){shot.vy*=-.3;shot.vx*=.7;shot.y=210;}if(shot.t>240||shot.x>W+20){shot=null;settle=60;}}
  unsupported();blocks.forEach(b=>{phys(b);for(const p of pigs)if(p.hp>0&&b.awake&&Math.abs(b.x-p.x)<b.w/2+6&&Math.abs(b.y-p.y)<b.h/2+6&&Math.hypot(b.vx,b.vy)>1.2){p.hp=0;g.score+=500;S('score');A.burst(p.x,p.y,K.g,16);}});pigs.forEach(p=>{if(p.hp<=0)return;let fy=208;for(const b of blocks)if(Math.abs(b.x-p.x)<b.w/2+2&&b.y-b.h/2>=p.y+4)fy=Math.min(fy,b.y-b.h/2-6);if(p.y<fy){p.vy+=.2;p.y=Math.min(fy,p.y+p.vy);if(p.y>=fy){if(p.vy>4){p.hp=0;g.score+=500;S('score');A.burst(p.x,p.y,K.g,16);}p.vy=0;}}});
  if(settle>0)settle--;if(!shot&&!settle){if(pigs.every(p=>p.hp<=0)){g.score+=birds*1000;S('win');A.confetti();if(lvl>=5)g.over='FORTS FLATTENED! WIN';else gen();}else if(birds<=0)g.over='OUT OF BIRDS';}};
 g.draw=()=>{A.skyband('#7ac8ff','#dff4ff',214);R(0,214,W,26,'#5a9a3a');R(46,180,4,34,'#6a4020');R(54,180,4,34,'#6a4020');blocks.forEach(b=>R(b.x-b.w/2,b.y-b.h/2,b.w,b.h,'#c4915a'));pigs.forEach(p=>{if(p.hp>0)E('🐷',p.x,p.y,16);});
  if(shot)E('🐦',shot.x,shot.y,16);else{E('🐦',50-Math.cos(ang)*pw*14,180+Math.sin(ang)*pw*14,16);for(let i=1;i<7;i++)C(50+Math.cos(ang)*i*10,180-Math.sin(ang)*i*10,1.5,K.k);if(pw){R(20,120,6,50,K.d);R(20,170-pw*50,6,pw*50,K.r);}}for(let i=0;i<birds;i++)E('🐦',14+i*14,224,10);T('SCORE '+g.score,6,6,K.k,1);T('LEVEL '+lvl+'/5',W-6,6,K.k,1,'r');};
 return g;}});

A.add({id:'aimtrainer',name:'AIM TRAINER',cat:'CLASSICS',mouse:1,how:'CLICK TARGETS AS FAST AS YOU CAN (OR MOVE + A). SMALLER AND FASTER OVER 45 SECONDS.',make(){
 const g={over:null,score:0};let tg=[],cx=160,cy=120,time=2700,shots=0,hits=0,spawnT=0;
 g.update=()=>{time--;if(time<=0){g.over=(hits/Math.max(1,shots)*100|0)+'% ACCURACY';return;}const k=A.in(0);if(A.mouse.t>0){cx=A.mouse.x;cy=A.mouse.y;}else{cx=cl(cx+ax(k)*4,0,W);cy=cl(cy+ay(k)*4,20,H);}
  if(--spawnT<=0&&tg.length<3){spawnT=Math.max(10,40-(2700-time)/90|0);const r=Math.max(5,14-(2700-time)/300);tg.push({x:20+rnd(280),y:34+rnd(190),r,life:Math.max(50,120-(2700-time)/40),max:0});tg[tg.length-1].max=tg[tg.length-1].life;}
  if(A.hit(0).a){shots++;const i=tg.findIndex(t=>Math.hypot(t.x-cx,t.y-cy)<t.r);if(i>=0){hits++;const t=tg[i];g.score+=Math.round(10+t.life/t.max*20);S('hit');A.burst(t.x,t.y,K.r,10);tg.splice(i,1);}else S('blip');}tg.forEach(t=>t.life--);tg=tg.filter(t=>t.life>0);};
 g.draw=()=>{A.cls('#1a1a24');tg.forEach(t=>{const s=t.r*(0.6+.4*t.life/t.max);C(t.x,t.y,s,K.w);C(t.x,t.y,s*.7,K.r);C(t.x,t.y,s*.4,K.w);C(t.x,t.y,s*.15,K.r);});L(cx-8,cy,cx-3,cy,K.g);L(cx+3,cy,cx+8,cy,K.g);L(cx,cy-8,cx,cy-3,K.g);L(cx,cy+3,cx,cy+8,K.g);T('SCORE '+g.score,6,6,K.y,1);T(hits+'/'+shots,160,6,K.w,1,'c');T(Math.ceil(time/60),W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'plinko',name:'PLINKO',cat:'PARTY',how:'LEFT/RIGHT AIM, A DROPS A CHIP. 10 CHIPS. AIM FOR THE BIG SLOTS.',make(){
 const g={over:null,score:0},VAL=[5,20,50,100,500,100,50,20,5];let x=160,chips=[],left=10,pegs=[];for(let r=0;r<9;r++)for(let c=0;c<=r+2;c++)pegs.push({x:160+(c-(r+2)/2)*28,y:50+r*18});
 g.update=()=>{x=cl(x+ax(A.in(0))*2.5,40,280);if(A.hit(0).a&&left>0&&chips.every(c=>c.y>120)){chips.push({x:x+rnd(.4)-.2,y:30,vx:0,vy:0});left--;S('blip');}
  for(const c of chips){if(c.done)continue;c.vy+=.12;c.x+=c.vx;c.y+=c.vy;c.vx*=.99;for(const p of pegs){const dx=c.x-p.x,dy=c.y-p.y,d=Math.hypot(dx,dy);if(d<7){const nx=dx/d,ny=dy/d,vn=c.vx*nx+c.vy*ny;if(vn<0){c.vx-=1.6*vn*nx;c.vy-=1.6*vn*ny;c.vx+=rnd(.4)-.2;}c.x=p.x+nx*7;c.y=p.y+ny*7;S('hit');}}if(c.x<30||c.x>290)c.vx*=-1;if(c.y>218){c.done=1;const s=cl(Math.floor((c.x-34)/28),0,8);g.score+=VAL[s];S(VAL[s]>=100?'score':'coin');A.burst(c.x,218,VAL[s]>=100?K.y:K.c,VAL[s]>=100?20:8);}}
  if(left===0&&chips.every(c=>c.done))g.over=g.score+' POINTS';};
 g.draw=()=>{A.cls('#1a1238');pegs.forEach(p=>C(p.x,p.y,3,'#c8c8e0'));VAL.forEach((v,i)=>{const x=34+i*28;R(x,218,27,22,v>=500?K.y:v>=100?K.o:v>=50?K.p:'#3a2a78');T(v,x+14,226,K.k,1,'c');});chips.filter(c=>!c.done).forEach(c=>C(c.x,c.y,5,K.r));if(left>0){C(x,26,5,K.r);R(x,34,1,10,'rgba(255,255,255,.4)');}T('CHIPS '+left,6,6,K.w,1);T(g.score,W-6,6,K.y,2,'r');};
 return g;}});

A.add({id:'jetpack',name:'JETPACK RUN',cat:'CLASSICS',how:'HOLD A TO FLY UP, RELEASE TO FALL. DODGE ZAPPERS AND MISSILES, GRAB COINS.',make(){
 const g={over:null,score:0};let y=180,vy=0,d=0,zap=[],coins=[],miss=[],t=0,nz=120;
 g.update=()=>{t++;const sp=3+d/4000;d+=sp;if(A.in(0).a){vy-=.35;if(t%3===0)A.burst(46,y+10,K.o,1,1);}vy+=.2;vy=cl(vy,-4,5);y+=vy;if(y<28){y=28;vy=0;}if(y>200){y=200;vy=0;}
  if((nz-=sp)<=0){nz=90+rnd(80);const v=Math.random()<.5;zap.push({x:W+20,y:40+rnd(130),v,len:40+rnd(40),a:0,rot:Math.random()<.3?.03:0});if(Math.random()<.5)for(let i=0;i<6;i++)coins.push({x:W+80+i*14,y:40+rnd(1)+(Math.sin(i)*20)+80});}
  if(t%240===0){miss.push({x:W+60,y,warn:60});}zap.forEach(z=>{z.x-=sp;z.a+=z.rot;});coins.forEach(c=>c.x-=sp);miss.forEach(m=>{if(m.warn>0){m.warn--;m.y+=(y-m.y)*.05;}else m.x-=sp*2.2;});
  for(const z of zap){const dx=Math.cos(z.v?1.5708+z.a:z.a)*z.len/2,dy=Math.sin(z.v?1.5708+z.a:z.a)*z.len/2,px=50-z.x,py=y-z.y,t_=cl((px*dx+py*dy)/(dx*dx+dy*dy),-1,1);if(Math.hypot(px-dx*t_,py-dy*t_)<7){g.over='ZAPPED';S('boom');A.burst(50,y,K.c,30,3);return;}}
  for(const m of miss)if(m.warn<=0&&Math.abs(m.x-50)<10&&Math.abs(m.y-y)<8){g.over='BLASTED';S('boom');return;}coins=coins.filter(c=>{if(Math.hypot(c.x-50,c.y-y)<10){g.score+=5;S('coin');return false;}return c.x>-10;});zap=zap.filter(z=>z.x>-60);miss=miss.filter(m=>m.x>-20);if(t%10===0)g.score++;};
 g.draw=()=>{A.cls('#3a3a4a');for(let x=-(d*.5%60);x<W;x+=60){R(x,20,40,6,'#4a4a5a');R(x+10,212,40,8,'#4a4a5a');}R(0,214,W,26,'#2a2a34');R(0,0,W,22,'#2a2a34');coins.forEach(c=>C(c.x,c.y,4,K.y));
  zap.forEach(z=>{const dx=Math.cos(z.v?1.5708+z.a:z.a)*z.len/2,dy=Math.sin(z.v?1.5708+z.a:z.a)*z.len/2;L(z.x-dx,z.y-dy,z.x+dx,z.y+dy,A.t%4<2?K.c:'#9ff8ff',4);C(z.x-dx,z.y-dy,5,'#8a8aa0');C(z.x+dx,z.y+dy,5,'#8a8aa0');});miss.forEach(m=>{if(m.warn>0){if(m.warn%10<5)T('!',W-12,m.y-4,K.r,2,'c');}else{R(m.x-10,m.y-3,20,6,K.r);R(m.x+10,m.y-2,6,4,K.o);}});
  A.person(50,y+14,{c:K.o,pants:'#2a2a3a',st:y>=200?d*.2:1,s:.7,id:3});R(40,y-6,6,12,'#8a8aa0');T(g.score,W-6,6,K.y,2,'r');T(Math.floor(d/10)+'M',6,6,K.w,1);};
 return g;}});

A.add({id:'stacktower',name:'STACK TOWER',cat:'CLASSICS',how:'A DROPS THE SWINGING FLOOR. LAND IT ON THE TOWER. PERFECT DROPS BUILD A COMBO.',make(){
 const g={over:null,score:0};let tower=[{x:160,w:60}],sw=0,crane=null,fall=null,lives=3,combo=0,cam=0;const newC=()=>{crane={a:0,len:70};};newC();
 g.update=()=>{sw+=.035+Math.min(.04,tower.length*.002);if(crane){crane.a=Math.sin(sw)*1.1;if(A.hit(0).a){fall={x:160+Math.sin(crane.a)*crane.len,y:40+Math.cos(crane.a)*crane.len,vy:0,w:60};crane=null;S('blip');}}
  if(fall){fall.vy+=.3;fall.y+=fall.vy;const top=tower[tower.length-1],ty=220-tower.length*20+cam;if(fall.y>=ty-20){const off=fall.x-top.x;if(Math.abs(off)<top.w*.6){const perfect=Math.abs(off)<4;combo=perfect?combo+1:0;tower.push({x:perfect?top.x:fall.x,w:60});g.score+=perfect?5+combo:2;S(perfect?'score':'hit');if(perfect)A.burst(fall.x,ty-10,K.y,14);}else{lives--;S('boom');if(lives<=0){g.over='TOWER OF '+(tower.length-1);return;}}fall=null;newC();}}
  const want=Math.max(0,(tower.length-6)*20);cam+=(want-cam)*.1;};
 g.draw=()=>{A.skyband(A.mix('#4dabff','#0a0a2a',Math.min(1,tower.length/40)),'#ffd0a0',H);tower.forEach((b,i)=>{const y=220-(i+1)*20+cam;if(y>H)return;R(b.x-b.w/2,y,b.w,20,i%2?'#d8c8b8':'#c8b8a8');for(let k=0;k<4;k++)R(b.x-b.w/2+5+k*14,y+5,8,9,A.t%60<30&&(i+k)%3===0?K.y:'#3a4a6a');});
  R(160,0,2,40,'#555');if(crane){const x=160+Math.sin(crane.a)*crane.len,y=40+Math.cos(crane.a)*crane.len;L(161,40,x,y,'#888',1);R(x-30,y,60,20,'#e8d8c8');for(let k=0;k<4;k++)R(x-25+k*14,y+5,8,9,'#3a4a6a');}if(fall){R(fall.x-30,fall.y,60,20,'#e8d8c8');}
  T('FLOORS '+(tower.length-1),6,6,K.k,2);T('LIVES '+lives,W-6,6,K.r,2,'r');if(combo>1)T('PERFECT X'+combo,160,24,K.y,1,'c');};
 return g;}});
})();
