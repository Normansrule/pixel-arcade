(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji,B3=A.box3,F=A.face;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- BURGER RUSH ---- */
const ING=[['BUN','#e0a050'],['PATTY','#6a3a1a'],['CHEESE','#ffd83a'],['LETTUCE','#5ac040'],['TOMATO','#e03a2a'],['ONION','#f0e0f0']];
A.add({id:'burger',name:'BURGER RUSH',cat:'SIM',how:'PICK AN INGREDIENT, A ADDS IT, B SERVES. MATCH THE ORDER BEFORE THEY LEAVE.',make(){
 const g={over:null,score:0};let sel=0,stack=[],orders=[],t=0,lives=3,msg='',mt=0;const newO=()=>{const n=2+ri(Math.min(4,1+g.score/60|0));const mid=[];for(let i=0;i<n;i++)mid.push(1+ri(5));orders.push({want:[0,...mid,0],pat:Math.max(600,1400-g.score*6),max:0});orders[orders.length-1].max=orders[orders.length-1].pat;};newO();
 g.update=()=>{t++;if(mt)mt--;const h=A.hit(0);if(h.l)sel=(sel+5)%6;if(h.r)sel=(sel+1)%6;if(h.l||h.r)S('blip');if(h.a&&stack.length<9){stack.push(sel);S('hit');}if(h.u&&stack.length){stack.pop();S('blip');}
  if(h.b&&stack.length){const o=orders[0];if(o&&o.want.join()===stack.join()){const tip=Math.round(o.pat/o.max*20);g.score+=10+stack.length*3+tip;msg='ORDER UP! +'+(10+stack.length*3+tip);S('score');A.burst(160,140,K.y,16);orders.shift();}else{msg='WRONG ORDER';S('lose');lives--;if(lives<=0){g.over='KITCHEN CLOSED';return;}}stack=[];mt=50;}
  orders.forEach(o=>o.pat--);if(orders[0]&&orders[0].pat<=0){orders.shift();lives--;msg='CUSTOMER LEFT';mt=50;S('lose');if(lives<=0){g.over='KITCHEN CLOSED';return;}}if(orders.length<3&&t%Math.max(240,480-g.score)===0||!orders.length)newO();};
 const layer=(x,y,k,w)=>{const c=ING[k][1];if(k===0){R(x-w/2,y-5,w,6,c);R(x-w/2+2,y-7,w-4,3,A.mix(c,'#ffffff',.2));}else if(k===3){for(let i=0;i<w;i+=5)C(x-w/2+i+2,y-1,3,c);}else if(k===5){A.ring(x-w/4,y-1,3,'#d8c0e0');A.ring(x+w/4,y-1,3,'#d8c0e0');}else R(x-w/2,y-4,w,k===2?3:5,c);};
 g.draw=()=>{A.cls('#f6e8d0');R(0,170,W,70,'#b88a5a');R(0,168,W,4,'#8a5c33');orders.forEach((o,i)=>{const x=50+i*110;R(x-40,14,80,94,'#ffffff');A.box(x-40,14,80,94,i===0?K.r:'#d8c8b8');o.want.forEach((k,j)=>layer(x,96-j*7,k,50));R(x-38,104,76*o.pat/o.max,3,o.pat/o.max<.3?K.r:K.g);E(['🙂','😀','🤓','😎'][i%4],x+30,22,12);});
  R(116,196,88,6,'#e8e8f0');stack.forEach((k,j)=>layer(160,194-j*7,k,56));ING.forEach((ing,i)=>{const x=24+i*54;R(x-20,212,40,24,i===sel?'#fff3a0':'#e8d8c0');A.box(x-20,212,40,24,i===sel?K.r:'#b8a888');layer(x,226,i,30);});
  T('SCORE '+g.score,W-6,120,K.k,1,'r');T('LIVES '+'X'.repeat(lives),W-6,132,K.r,1,'r');T('UP UNDOES',W-6,144,K.gr,1,'r');if(mt)T(msg,160,150,msg.startsWith('ORDER')?'#2a8a3a':K.r,1,'c');};
 return g;}});

/* ---- TEMPLE DASH 3D ---- */
A.add({id:'templedash',name:'TEMPLE DASH 3D',cat:'RETRO 3D',hd:1,how:'LEFT/RIGHT CHANGE LANE, UP JUMPS, DOWN SLIDES. GRAB COINS, DODGE EVERYTHING.',make(){
 const g={over:null,score:0};let lane=0,lx=0,z=0,sp=.3,jy=0,vy=0,slide=0,ob=[],coins=0,nz=20;
 g.update=()=>{const h=A.hit(0);if(h.l&&lane>-1){lane--;S('blip');}if(h.r&&lane<1){lane++;S('blip');}if(h.u&&jy===0){vy=.28;S('jump');}if(h.d&&jy===0){slide=34;S('blip');}lx+=(lane*1.6-lx)*.25;if(jy>0||vy>0){jy+=vy;vy-=.018;if(jy<=0){jy=0;vy=0;}}if(slide)slide--;
  sp=Math.min(.75,.3+z/2500);z+=sp;g.score=Math.floor(z)+coins*10;if(z+60>nz){const k=ri(4),l=ri(3)-1;ob.push({z:nz,l,k});if(Math.random()<.6)for(let i=0;i<5;i++)ob.push({z:nz+6+i*2,l:(l+1+ri(2))%3-1,k:9});nz+=10+rnd(12)-Math.min(6,z/600);}
  for(const o of ob){if(o.hit||Math.abs(o.z-z-2)>.6)continue;if(Math.abs(o.l*1.6-lx)>.8)continue;if(o.k===9){o.hit=1;coins++;S('coin');continue;}const ok=o.k===0?jy>.5:o.k===1?slide>0:false;if(!ok){g.over='CRASHED AT '+Math.floor(z)+'M';S('boom');A.shake=10;}}ob=ob.filter(o=>o.z>z-3);};
 g.draw=()=>{A.skyband('#ff8a5a','#ffd8a0',H*.55);A.cam.x=lx*.6;A.cam.y=2.4;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=-.25;A.fog={col:'#ffc890',near:25,far:55};
  for(let i=Math.floor(z/4)*4-4;i<z+56;i+=4){F([[-2.6,0,i],[2.6,0,i],[2.6,0,i+4],[-2.6,0,i+4]],(i/4)%2?'#b8905a':'#a88050',false);F([[-2.6,0,i],[-2.6,1.2,i],[-2.6,1.2,i+4],[-2.6,0,i+4]],'#7a6040',false);F([[2.6,0,i],[2.6,0,i+4],[2.6,1.2,i+4],[2.6,1.2,i]],'#7a6040',false);if(i%16===0){B3(-3.4,0,i,.8,4,.8,'#8a7a5a');B3(3.4,0,i,.8,4,.8,'#8a7a5a');B3(-3.8,4,i,1.4,.4,1.4,'#3a8a3a');B3(3.8,4,i,1.4,.4,1.4,'#3a8a3a');}}
  ob.forEach(o=>{if(o.hit||o.z<z-1)return;const x=o.l*1.6;if(o.k===9){B3(x,.6+Math.sin(o.z+A.t*.1)*.1,o.z,.35,.35,.1,'#ffcf3f');return;}if(o.k===0)B3(x,0,o.z,1.3,.5,.4,'#8a5c33');else if(o.k===1){B3(x-.6,0,o.z,.2,1.8,.2,'#6a4a2a');B3(x+.6,0,o.z,.2,1.8,.2,'#6a4a2a');B3(x,1.2,o.z,1.4,.35,.3,'#9a6a3a');}else B3(x,0,o.z,1.3,1.8,.6,'#6a6a78');});
  const py=jy,ph=slide?.5:1.4;A.shadow3(lx,z+1,.6,.4);B3(lx,py,z+1,.6,ph*.55,.4,'#2a4ab0');B3(lx,py+ph*.55,z+1,.7,ph*.35,.45,'#e84a2a');B3(lx,py+ph*.9,z+1,.4,.4,.4,'#f1c7a3');A.flush();A.fog=null;
  T(g.score,W-12,10,K.w,3,'r');T('COINS '+coins,12,10,K.y,2);};
 return g;}});

/* ---- MARBLE CHAIN (Zuma-style) ---- */
A.add({id:'marblechain',name:'MARBLE CHAIN',cat:'CLASSICS',mouse:1,how:'AIM, A SHOOTS, B SWAPS. MATCH 3 TO POP. KEEP THE CHAIN FROM THE SKULL.',make(){
 const g={over:null,score:0},CO=[K.r,K.y,K.g,K.b,K.p];const PTS=[];for(let i=0;i<600;i++){const a=i/600*Math.PI*5.2,r=112-i*.16;PTS.push([160+Math.cos(a)*r*1.25,124+Math.sin(a)*r*.95]);}
 let chain=[],head=0,sp=.35,ang=0,cur=ri(4),nxt=ri(4),shot=null,push=0,lvl=1,toAdd=45;const pt=s=>PTS[cl(Math.floor(s),0,PTS.length-1)];
 for(let i=0;i<20;i++)chain.push({c:ri(4),s:-i*7});
 g.update=()=>{const k=A.in(0);if(A.mouse.t>0)ang=Math.atan2(A.mouse.y-124,A.mouse.x-160);else ang+=ax(k)*.06;if(A.hit(0).b){[cur,nxt]=[nxt,cur];S('blip');}if(A.hit(0).a&&!shot){shot={x:160,y:124,vx:Math.cos(ang)*6,vy:Math.sin(ang)*6,c:cur};cur=nxt;nxt=chain.length?chain[ri(chain.length)].c:ri(4);S('shoot');}
  if(toAdd>0&&(!chain.length||chain[chain.length-1].s>7)){chain.push({c:ri(3+Math.min(2,lvl-1)),s:0});toAdd--;}
  for(let i=0;i<chain.length;i++){const m=chain[i];if(i===chain.length-1)m.s+=sp+push;else{const nx=chain[i+1];if(m.s<nx.s+7)m.s=nx.s+7;else if(m.s>nx.s+7.5)m.s-=.8;}}chain.sort((a,b)=>b.s-a.s);if(push>0)push*=.9;
  if(chain.length&&chain[0].s>=PTS.length-1){g.over='THE CHAIN WON';S('lose');return;}
  if(shot){shot.x+=shot.vx;shot.y+=shot.vy;if(shot.x<0||shot.x>W||shot.y<0||shot.y>H){shot=null;return;}for(let i=0;i<chain.length;i++){const p=pt(chain[i].s);if(Math.hypot(p[0]-shot.x,p[1]-shot.y)<8){chain.splice(i,0,{c:shot.c,s:chain[i].s+3.5});shot=null;S('hit');
    let a=i,b=i;const c=chain[i].c;while(a>0&&chain[a-1].c===c)a--;while(b<chain.length-1&&chain[b+1].c===c)b++;if(b-a+1>=3){const n=b-a+1;const pos=pt(chain[i].s);chain.splice(a,n);g.score+=n*10;S('score');A.burst(pos[0],pos[1],CO[c],16,2.5);push=-1.2;}break;}}}
  if(!chain.length&&toAdd===0){lvl++;g.score+=500;S('win');A.confetti();if(lvl>4){g.over='CHAIN BROKEN! WIN';return;}toAdd=45+lvl*10;sp=.35+lvl*.06;}};
 g.draw=()=>{A.cls('#3a2a18');for(let i=0;i<PTS.length;i+=4)C(PTS[i][0],PTS[i][1],6,'#5a4228');E('💀',PTS[PTS.length-1][0],PTS[PTS.length-1][1],18);chain.forEach(m=>{if(m.s<0)return;const p=pt(m.s);C(p[0],p[1],6,CO[m.c]);});if(shot)C(shot.x,shot.y,6,CO[shot.c]);
  C(160,124,14,'#6a8a3a');E('🐸',160,124,22);C(160+Math.cos(ang)*16,124+Math.sin(ang)*16,6,CO[cur]);C(160-Math.cos(ang)*8,124-Math.sin(ang)*8,3,CO[nxt]);T('SCORE '+g.score,6,6,K.y,1);T('LEVEL '+lvl+'/4',W-6,6,K.w,1,'r');};
 return g;}});

/* ---- CANDY ROPE (Cut the Rope-style) ---- */
const CR=[{anc:[[160,30]],star:[[160,120],[120,160],[200,190]],mouth:[160,215]},{anc:[[100,30],[220,40]],star:[[130,110],[190,140],[160,180]],mouth:[240,210]},{anc:[[60,40],[260,30]],star:[[100,120],[220,100],[160,170]],mouth:[80,215]},{anc:[[160,20],[80,90]],star:[[200,90],[240,150],[120,190]],mouth:[260,200]}];
A.add({id:'candyrope',name:'CANDY ROPE',cat:'PUZZLE',how:'A CUTS THE NEXT ROPE. SWING THE CANDY INTO THE MONSTER\'S MOUTH. GRAB STARS.',make(){
 const g={over:null,score:0};let lvl=-1,cd,ropes,stars,got,cut,t,done;const step=(c,rs)=>{c.vy+=.18;c.x+=c.vx;c.y+=c.vy;c.vx*=.995;c.vy*=.995;for(const r of rs){if(r.cut)continue;const dx=c.x-r.ax,dy=c.y-r.ay,d=Math.hypot(dx,dy);if(d>r.len){const nx=dx/d,ny=dy/d;c.x=r.ax+nx*r.len;c.y=r.ay+ny*r.len;const vn=c.vx*nx+c.vy*ny;if(vn>0){c.vx-=vn*nx;c.vy-=vn*ny;}}}};
 const load=()=>{lvl++;const L_=CR[lvl];for(let tr=0;tr<60;tr++){const sx=L_.anc.reduce((a,p)=>a+p[0],0)/L_.anc.length+(lvl===0?-10:rnd(60)-30);cd={x:sx,y:90,vx:0,vy:0};ropes=L_.anc.map(a=>({ax:a[0],ay:a[1],len:Math.hypot(a[0]-cd.x,a[1]-cd.y)+4}));
   const sim={...cd},rs=ropes.map(r=>({...r})),plan=[20+ri(60),0];plan[1]=plan[0]+20+ri(60);const path=[];let ok=false;for(let f=0;f<600;f++){if(f===plan[0]&&rs[0])rs[0].cut=1;if(f===plan[1]&&rs[1])rs[1].cut=1;step(sim,rs);if(rs.every(r=>r.cut))path.push([sim.x,sim.y]);if(sim.y>=200){ok=sim.x>30&&sim.x<290&&path.length>12;break;}}
   if(ok){const n=path.length;stars=[.25,.5,.75].map(q=>{const p=path[Math.floor(n*q)];return{x:p[0],y:p[1],on:true};});CR[lvl].mouth=[path[n-1][0],Math.min(222,path[n-1][1]+8)];break;}}got=0;cut=0;t=0;done=0;};load();g._level=n=>{lvl=n-1;load();};
 g.update=()=>{t++;if(done){if(--done===0){if(lvl>=CR.length-1){g.over='ALL FED! WIN';A.confetti();}else load();}return;}if(A.hit(0).a&&cut<ropes.length){ropes[cut].cut=1;cut++;S('shoot');}
  step(cd,ropes);
  stars.forEach(s=>{if(s.on&&Math.hypot(s.x-cd.x,s.y-cd.y)<12){s.on=false;got++;g.score+=100;S('coin');A.burst(s.x,s.y,K.y,12);}});const m=CR[lvl].mouth;if(Math.hypot(m[0]-cd.x,m[1]-cd.y)<16){g.score+=200;S('win');done=60;cd.x=-99;}if(cd.y>H+20||cd.x<-20||cd.x>W+20){if(cd.x!==-99){g.over='CANDY LOST';S('lose');}}};
 g.draw=()=>{A.cls('#c8e0b8');for(let i=0;i<12;i++)R(0,i*20,W,10,'#bcd6aa');ropes.forEach((r,i)=>{C(r.ax,r.ay,4,'#5a3a1a');if(!r.cut){const n=10;for(let k=0;k<=n;k++){const tt=k/n,sag=Math.sin(tt*Math.PI)*4;C(r.ax+(cd.x-r.ax)*tt,r.ay+(cd.y-r.ay)*tt+sag,1.5,i===cut?'#c8703a':'#8a5c33');}}});
  stars.forEach(s=>{if(s.on)E('⭐',s.x,s.y+Math.sin(A.t*.1+s.x)*2,16);});const m=CR[lvl].mouth;E(done?'😋':Math.hypot(m[0]-cd.x,m[1]-cd.y)<60?'😮':'👾',m[0],m[1],28);if(cd.x>-50)E('🍬',cd.x,cd.y,18);T('LEVEL '+(lvl+1)+'/'+CR.length,6,6,K.k,1);T('STARS '+got+'/3',W-6,6,K.k,1,'r');T('ROPES LEFT '+(ropes.length-cut),160,6,K.k,1,'c');};
 return g;}});

/* ---- SKATE PARK ---- */
A.add({id:'skatepark',name:'SKATE PARK',cat:'SPORTS',how:'PUMP WITH LEFT/RIGHT. IN THE AIR A FLIPS, B GRABS, UP SPINS. 60 SEC.',make(){
 const g={over:null,score:0};let x=160,vx=2,y=0,vy=0,air=false,rot=0,tricks=[],combo=0,time=3600,msg='',mt=0,bail=0;const ramp=px=>{const d=Math.abs(px-160);return d<60?0:Math.min(90,(d-60)**2/40);};
 g.update=()=>{time--;if(time<=0){g.over=g.score+' POINTS';return;}if(mt)mt--;if(bail>0){bail--;if(bail===0){x=160;vx=2;y=0;air=false;rot=0;}return;}const k=A.in(0),h=A.hit(0);
  if(!air){const slope=Math.sign(x-160)*(Math.abs(x-160)>60?(Math.abs(x-160)-60)/20:0);vx-=slope*.12;if((ax(k)>0&&vx>0)||(ax(k)<0&&vx<0))vx*=1.012;vx=cl(vx,-7,7);x+=vx;y=ramp(x);if(Math.abs(x-160)>=145){air=true;vy=-Math.abs(vx)*1.1;x=cl(x,16,304);tricks=[];rot=0;S('jump');}}
  else{vy+=.2;y-=vy;if(h.a){tricks.push('FLIP');rot+=6.283;S('blip');}if(h.b){tricks.push('GRAB');S('blip');}if(h.u){tricks.push('360');rot+=6.283;S('blip');}const ry=ramp(x);if(y<=ry&&vy>0){air=false;y=ry;vx=-Math.sign(x-160)*Math.abs(vx)*.95;if(tricks.length){const clean=tricks.length<=Math.max(1,Math.floor(Math.abs(vy)/1.5));if(clean){combo++;const pts=tricks.length*100*combo;g.score+=pts;msg=tricks.join(' + ')+' +'+pts;S('score');}else{combo=0;msg='BAIL!';S('boom');bail=60;}mt=70;}}}};
 g.draw=()=>{A.cls('#5a8ac8');R(0,180,W,60,'#6a6a78');A.c.fillStyle='#9a9aa8';A.c.beginPath();A.c.moveTo(0,H);for(let px=0;px<=W;px+=4)A.c.lineTo(px,190-ramp(px));A.c.lineTo(W,H);A.c.fill();A.c.strokeStyle='#e8e8f0';A.c.lineWidth=2;A.c.beginPath();for(let px=0;px<=W;px+=4)A.c.lineTo(px,190-ramp(px));A.c.stroke();
  const sy=190-y,c=A.c;c.save&&c.save();c.translate&&c.translate(x,sy);c.rotate&&c.rotate(air?-(rot*(1-Math.max(0,vy)/10))*0:Math.atan2(ramp(x+2)-ramp(x-2),4)*-1);if(!bail){R(-10,-3,20,3,'#e84a2a');C(-7,1,2,'#222');C(7,1,2,'#222');A.person(0,-3,{c:K.c,pants:'#2a2a3a',cap:K.o,st:0,s:.8,id:5,arm1:-1.2,arm2:1.2});}else A.person(0,0,{c:K.c,s:.8,id:5});c.restore&&c.restore();
  T('SCORE '+g.score,6,6,K.w,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');if(combo>1)T('COMBO X'+combo,160,24,K.y,1,'c');if(mt)T(msg,160,40,msg==='BAIL!'?K.r:K.y,1,'c');};
 return g;}});
})();
