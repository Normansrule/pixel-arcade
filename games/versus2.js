(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const PC=['#2fd6c3','#ff4f9a'];
const turnTag=(txt,col)=>{const w=txt.length*8+16;X.panel(160-w/2,1,w,16,col);T(txt,160,4,col,2,'c');};
const cursor=(x,y,w,h,col)=>{const p=1+Math.sin(A.t*.15)*.8;X.glow(x+w/2,y+h/2,Math.max(w,h)*.8,col||'#ffcf3f',.15);X.rrs(x-p,y-p,w+2*p,h+2*p,3,col||'#ffcf3f',1.5);};

/* ---- SNAKE DUEL ---- */
A.add({id:'snakeduel',name:'SNAKE DUEL',cat:'VERSUS',vs:1,how:'STEER. EAT TO GROW. CRASH AND YOU LOSE. FIRST TO 3.',make(){
 const g={over:null,score:0},CW=32,CH=21,fx=X.fx();let s,d,nd,f,t=0,sc=[0,0],wait=40;
 const occ=(x,y)=>s[0].some(c=>c[0]===x&&c[1]===y)||s[1].some(c=>c[0]===x&&c[1]===y);
 const reset=()=>{s=[[[6,10],[5,10],[4,10]],[[25,10],[26,10],[27,10]]];d=[[1,0],[-1,0]];nd=[[1,0],[-1,0]];f=[16,10];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const h=s[1][0],opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(v=>!(v[0]===-d[1][0]&&v[1]===-d[1][1]));let best=null,bs=-1e9;for(const v of opts){const nx=h[0]+v[0],ny=h[1]+v[1];if(nx<0||ny<0||nx>=CW||ny>=CH||occ(nx,ny))continue;let sc_=-Math.abs(nx-f[0])-Math.abs(ny-f[1]);let room=0;for(const w of opts){const px=nx+w[0],py=ny+w[1];if(px>=0&&py>=0&&px<CW&&py<CH&&!occ(px,py))room++;}sc_+=room*3*A.ai+rnd(A.ai<.6?4:.5);if(sc_>bs){bs=sc_;best=v;}}if(best)nd[1]=best;}
  for(let i=0;i<(A.cpu?1:2);i++){const h=A.hit(i);if(h.l&&d[i][0]!==1)nd[i]=[-1,0];if(h.r&&d[i][0]!==-1)nd[i]=[1,0];if(h.u&&d[i][1]!==1)nd[i]=[0,-1];if(h.d&&d[i][1]!==-1)nd[i]=[0,1];}
  if(++t<6)return;t=0;const dead=[0,0];for(let i=0;i<2;i++){d[i]=nd[i];const n=[s[i][0][0]+d[i][0],s[i][0][1]+d[i][1]];if(n[0]<0||n[1]<0||n[0]>=CW||n[1]>=CH||occ(n[0],n[1]))dead[i]=1;else{s[i].unshift(n);if(n[0]===f[0]&&n[1]===f[1]){S('coin');fx.ring(f[0]*10+5,f[1]*10+25,PC[i],16);fx.spark(f[0]*10+5,f[1]*10+25,'#ffd0a0',8,2);f=[ri(CW),ri(CH)];}else s[i].pop();}}
  if(s[0][0][0]===s[1][0][0]&&s[0][0][1]===s[1][0][1])dead[0]=dead[1]=1;if(dead[0]||dead[1]){S('boom');s.forEach((sn,i)=>{if(dead[i])sn.forEach((c,j)=>{if(j%2===0)fx.debris(c[0]*10+5,c[1]*10+25,PC[i],2,1.5);});});fx.flash('#ffffff',6);if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{X.cache('snakeduel_bg',()=>{for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){A.c.fillStyle=(x+y)%2?'#141a30':'#181f38';A.c.fillRect(x*10,y*10+20,10,10);}X.vignette(.45);});const c=A.c,cx=q=>q[0]*10+5,cy=q=>q[1]*10+25;
  X.glow(cx(f),cy(f),14,'#ff4040',.35);X.orb(cx(f),cy(f),4.2,'#e8303a');c.fillStyle='#4ccf5a';c.fillRect(cx(f),cy(f)-6,2,2);
  s.forEach((sn,i)=>{const n=sn.length;for(let j=n-1;j>=0;j--){const q=sn[j],k=j/Math.max(1,n-1),r=4.6-k*1.6+(j?0:.6);if(j<n-1){c.strokeStyle=A.mix(i?'#ff7fc0':'#5ff0e0',i?'#7a1040':'#0e6a62',k);c.lineWidth=r*2-1;c.lineCap='round';c.beginPath();c.moveTo(cx(sn[j+1]),cy(sn[j+1]));c.lineTo(cx(q),cy(q));c.stroke();c.lineCap='butt';}X.orb(cx(q),cy(q),r,j?(i?'#e83a8a':'#2ac0b0'):(i?'#ff9ad0':'#8ffff0'),j?0:1);}
   const h=sn[0],dd=d[i];for(const sd of[-1,1]){const px=cx(h)+dd[0]*1.5-dd[1]*sd*2.4,py=cy(h)+dd[1]*1.5+dd[0]*sd*2.4;X.disc(px,py,1.6,'#fff');X.disc(px+dd[0]*.7,py+dd[1]*.7,.8,'#111');}});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(wait>0)X.ot(wait>15?'READY':'GO!',160,110,K.y,2,'c');};
 return g;}});

/* ---- BLAST MAZE ---- */
A.add({id:'blast',name:'BLAST MAZE',cat:'VERSUS',vs:1,how:'MOVE. A DROPS A BOMB. BLOW UP CRATES AND YOUR RIVAL. FIRST TO 3.',make(){
 const g={over:null,score:0},GW=15,GH=11,CS=18,OX=25,OY=24,fx=X.fx();let m,p,bombs,fire,sc=[0,0],wait=40,step=[0,0];
 const reset=()=>{m=[];for(let y=0;y<GH;y++){m.push([]);for(let x=0;x<GW;x++)m[y].push(x===0||y===0||x===GW-1||y===GH-1||(x%2===0&&y%2===0)?1:Math.random()<.55?2:0);}[[1,1],[2,1],[1,2],[GW-2,GH-2],[GW-3,GH-2],[GW-2,GH-3]].forEach(c=>m[c[1]][c[0]]=0);p=[{x:1,y:1,fx:1,fy:1,mv:0,d:1},{x:GW-2,y:GH-2,fx:GW-2,fy:GH-2,mv:0,d:-1}];bombs=[];fire=[];wait=40;};reset();
 const dang=(x,y)=>bombs.some(b=>(b.x===x&&Math.abs(b.y-y)<=2)||(b.y===y&&Math.abs(b.x-x)<=2))||fire.some(f=>f.x===x&&f.y===y);
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const q=p[1],o=p[0];let o2={};const opts=[[1,0,'r'],[-1,0,'l'],[0,1,'d'],[0,-1,'u']].filter(v=>m[q.y+v[1]][q.x+v[0]]===0&&!bombs.some(b=>b.x===q.x+v[0]&&b.y===q.y+v[1]));
   if(dang(q.x,q.y)){const safe=opts.filter(v=>!dang(q.x+v[0],q.y+v[1]));const v=(safe.length?safe:opts)[0];if(v)o2[v[2]]=1;}
   else{const near=Math.abs(o.x-q.x)+Math.abs(o.y-q.y)<=2,crate=[[1,0],[-1,0],[0,1],[0,-1]].some(v=>m[q.y+v[1]][q.x+v[0]]===2);if((near||crate)&&Math.random()<.04+.06*A.ai&&!bombs.some(b=>b.o===1)&&opts.some(v=>!dang(q.x+v[0],q.y+v[1])))o2.a=1;else if(Math.random()<.5){let best=opts.filter(v=>!dang(q.x+v[0],q.y+v[1]));best.sort((a,b)=>(Math.abs(o.x-q.x-a[0])+Math.abs(o.y-q.y-a[1]))-(Math.abs(o.x-q.x-b[0])+Math.abs(o.y-q.y-b[1])));if(best.length){const v=Math.random()<A.ai?best[0]:best[ri(best.length)];o2[v[2]]=1;}}}A.bot(o2);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i);if(q.mv>0){q.mv--;step[i]+=.4;q.fx+=(q.x-q.fx)*.35;q.fy+=(q.y-q.fy)*.35;}else{q.fx=q.x;q.fy=q.y;const dx=ax(k),dy=dx?0:ay(k);if(dx)q.d=dx;if((dx||dy)&&m[q.y+dy][q.x+dx]===0&&!bombs.some(b=>b.x===q.x+dx&&b.y===q.y+dy)){q.x+=dx;q.y+=dy;q.mv=i&&A.cpu?9-3*A.ai:6;}}
   if(A.hit(i).a&&!bombs.some(b=>b.x===q.x&&b.y===q.y)&&bombs.filter(b=>b.o===i).length<2){bombs.push({x:q.x,y:q.y,t:120,o:i});S('blip');}}
  for(const b of bombs){b.t--;if(b.t<=0){b.dead=1;S('boom');const bx=OX+b.x*CS+9,by=OY+b.y*CS+9;fx.ring(bx,by,'#ffd080',30,14);fire.push({x:b.x,y:b.y,t:20});for(const v of[[1,0],[-1,0],[0,1],[0,-1]])for(let n=1;n<=2;n++){const x=b.x+v[0]*n,y=b.y+v[1]*n;if(m[y][x]===1)break;fire.push({x,y,t:20});if(m[y][x]===2){m[y][x]=0;fx.debris(OX+x*CS+9,OY+y*CS+9,'#c8853a',7,2);break;}const ob=bombs.find(o=>o.x===x&&o.y===y&&!o.dead);if(ob)ob.t=1;}}}
  bombs=bombs.filter(b=>!b.dead);fire.forEach(f=>f.t--);fire=fire.filter(f=>f.t>0);const dead=p.map(q=>fire.some(f=>f.x===q.x&&f.y===q.y));
  if(dead[0]||dead[1]){p.forEach((q,i)=>{if(dead[i])fx.spark(OX+q.x*CS+9,OY+q.y*CS+9,PC[i],18,3);});fx.flash('#ffffff',8);if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{const c=A.c;X.cache('blast_floor',()=>{X.sky(['#1a3a1a','#0e200e']);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){A.c.fillStyle=(x+y)%2?'#3a9a46':'#42a84e';A.c.fillRect(OX+x*CS,OY+y*CS,CS,CS);}});
  m.forEach((row,y)=>row.forEach((v,x)=>{const X0=OX+x*CS,Y0=OY+y*CS;if(v){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(X0+3,Y0+4,CS,CS-2);}}));
  m.forEach((row,y)=>row.forEach((v,x)=>{const X0=OX+x*CS,Y0=OY+y*CS;if(v===1){X.block(X0,Y0,CS,CS,'#7a7a98',2);c.fillStyle='rgba(255,255,255,.15)';c.fillRect(X0+4,Y0+4,CS-8,CS-8);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(X0+4,Y0+CS-5,CS-8,1);}else if(v===2){c.fillStyle=X.lg(0,Y0,0,Y0+CS,['#e8b070','#c8853a','#8a5a24']);c.fillRect(X0+1,Y0+1,CS-2,CS-2);c.strokeStyle='#5a3a14';c.lineWidth=1;c.strokeRect(X0+1.5,Y0+1.5,CS-3,CS-3);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(X0+2,Y0+6,CS-4,1);c.fillRect(X0+2,Y0+11,CS-4,1);c.fillStyle='rgba(255,255,255,.2)';c.fillRect(X0+2,Y0+2,CS-4,1);}}));
  fire.forEach(f=>{const X0=OX+f.x*CS+9,Y0=OY+f.y*CS+9,k=f.t/20;X.glow(X0,Y0,16,'#ff8020',.6*k);X.rr(X0-8,Y0-8,16,16,6,X.rg(X0,Y0,0,X0,Y0,10,['#ffffff','#fff080','#ff9020','rgba(255,60,0,.5)']));});
  bombs.forEach(b=>{const X0=OX+b.x*CS+9,Y0=OY+b.y*CS+10,pu=b.t%20<10?1:0,r=6+pu*.8+(b.t<40?Math.sin(b.t)*1:0);X.shadow(X0,Y0+6,6,2,.35);X.orb(X0,Y0,r,b.t<40&&b.t%8<4?'#a02020':'#2a2a3a');c.fillStyle='#8a7a5a';c.fillRect(X0+2,Y0-r-2,2,3);X.glow(X0+3,Y0-r-3,5,'#ffd060',.8);X.disc(X0+3,Y0-r-3,1.2,'#fff');});
  p.forEach((q,i)=>{const X0=OX+q.fx*CS+9,Y0=OY+q.fy*CS+17;A.person(X0,Y0,{s:.5,c:PC[i],pants:i?'#5a1a3a':'#0a4a44',st:step[i],d:q.d,id:i*3+1,cap:i?'#ffcf3f':'#ffffff'});});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(wait>0)X.ot('FIGHT!',160,110,K.y,3,'c');};
 return g;}});

/* ---- TUG OF WAR ---- */
A.add({id:'tug',name:'TUG OF WAR',cat:'VERSUS',vs:1,how:'TAP LEFT/RIGHT FAST. PULL THE FLAG OVER YOUR LINE.',make(){
 const g={over:null,score:0},fx=X.fx();let pos=0,last=['',''],t=-90,yank=[0,0];
 g.update=()=>{t++;yank=yank.map(v=>v?v-1:0);if(t<0)return;for(let i=0;i<2;i++){if(A.cpu&&i===1){pos+=(.28+.32*A.ai)*(Math.random()<.9?1:0);if(A.t%10===0)yank[1]=5;continue;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&last[i]!==n){last[i]=n;pos+=i?1.6:-1.6;yank[i]=5;if(Math.random()<.3)fx.spark(i?250+pos:70+pos,186,'#c8a070',2,1.2);}}pos*=.995;if(Math.abs(pos)>=60){g.over=A.win(pos<0?0:1);S('win');}};
 const bg=()=>{X.sky(['#4a9ae0','#bfe6ff'],150);X.hills(150,30,'#6ab050',0,.02,4);const c=A.c;for(let y=118;y<150;y+=6)for(let x=(y/6%2)*4;x<W;x+=8){c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0'][((x|0)+(y|0))%4];c.globalAlpha=.6;c.fillRect(x,y,5,4);c.globalAlpha=1;}
  X.turf(0,150,W,90,'#3a9a3a','#45a845',16,true);X.ell(160,192,40,9,X.lg(0,183,0,201,['#6a4a2a','#4a3018']));X.ell(152,190,10,2.5,'rgba(255,255,255,.15)');c.fillStyle='rgba(255,255,255,.85)';c.fillRect(99,160,3,50);c.fillRect(218,160,3,50);};
 g.draw=()=>{X.cache('tug_bg',bg);const c=A.c,fxp=160+pos,y0=176;
  c.strokeStyle='#a8743a';c.lineWidth=3;c.beginPath();c.moveTo(20+pos,y0);c.quadraticCurveTo(160+pos,y0+3,300+pos,y0);c.stroke();c.strokeStyle='rgba(60,30,10,.5)';c.lineWidth=1;for(let x=24;x<300;x+=6){c.beginPath();c.moveTo(x+pos,y0-1.5);c.lineTo(x+3+pos,y0+1.5);c.stroke();}
  c.fillStyle='#ddd';c.fillRect(fxp-1,y0-34,2,36);const w=Math.sin(A.t*.2)*2;X.poly([[fxp+1,y0-34],[fxp+18,y0-30+w],[fxp+1,y0-24]],X.lg(fxp,0,fxp+18,0,['#ffe680','#ffb020']));
  [0,1].forEach(i=>{const d=i?-1:1;for(let j=0;j<3;j++){const x=(i?236+j*22:84-j*22)+pos-(yank[i]?d*2:0);c.save();c.translate(x,200);c.rotate(-d*.32);A.person(0,0,{s:.85,c:PC[i],pants:'#2a2a3a',st:yank[i]?1:0,d,id:i*3+j,arm1:d>0?-1.3:1.85,arm2:d>0?-1.85:1.3,cap:j===0?(i?'#ffcf3f':'#ffffff'):undefined});c.restore();}});
  fx.draw();X.bar();A.hud2('','');const bw=120;X.meter(160-bw/2,20,bw,6,.5-pos/120,'#2fd6c3','rgba(255,79,154,.8)');X.ot(t<0?'READY...':'PULL!',160,40,K.y,3,'c');};
 return g;}});

/* ---- LASER PAINT ---- */
A.add({id:'paint',name:'LASER PAINT',cat:'VERSUS',vs:1,how:'MOVE TO PAINT TILES. A FIRES A LASER THAT PAINTS A LINE. MOST TILES IN 45 SEC.',make(){
 const g={over:null,score:0},GW=20,GH=13,CS=14,OX=20,OY=26,fx=X.fx();let gr=new Uint8Array(GW*GH),age=new Uint8Array(GW*GH),p=[{x:2,y:6,fx:1,fy:0,cd:0},{x:17,y:6,fx:-1,fy:0,cd:0}],time=2700,t=0,lasers=[];
 const paint=(i,v)=>{if(gr[i]!==v){gr[i]=v;age[i]=10;}};
 g.update=()=>{time--;t++;for(let i=0;i<age.length;i++)if(age[i])age[i]--;if(A.cpu){const q=p[1];let best=null,bs=-1;for(const v of[[1,0,'r'],[-1,0,'l'],[0,1,'d'],[0,-1,'u']]){let n=0,x=q.x,y=q.y;for(let k=0;k<6;k++){x+=v[0];y+=v[1];if(x<0||y<0||x>=GW||y>=GH)break;if(gr[y*GW+x]!==2)n++;}n+=rnd(A.ai<.6?4:1);if(n>bs){bs=n;best=v;}}A.bot({[best[2]]:t%2===0,a:bs>3&&Math.random()<.08*A.ai});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i);if(q.cd>0)q.cd--;if(t%(i&&A.cpu?7-2*A.ai:5)===0){const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){q.fx=dx;q.fy=dy;const nx=q.x+dx,ny=q.y+dy;if(nx>=0&&ny>=0&&nx<GW&&ny<GH&&!p.some((o,j)=>j!==i&&o.x===nx&&o.y===ny)){q.x=nx;q.y=ny;}}}paint(q.y*GW+q.x,i+1);
   if(A.hit(i).a&&q.cd===0){q.cd=60;let x=q.x,y=q.y;const cells=[];for(let n=0;n<8;n++){x+=q.fx;y+=q.fy;if(x<0||y<0||x>=GW||y>=GH)break;paint(y*GW+x,i+1);cells.push([x,y]);}lasers.push({c:cells,t:10,i,x0:q.x,y0:q.y});S('shoot');if(cells.length){const e=cells[cells.length-1];fx.spark(OX+e[0]*CS+7,OY+e[1]*CS+7,PC[i],8,2);}}}
  lasers.forEach(l=>l.t--);lasers=lasers.filter(l=>l.t>0);if(time<=0){let a=0,b=0;for(const v of gr){if(v===1)a++;if(v===2)b++;}g.over=a===b?'DRAW!':A.win(a>b?0:1);}};
 g.draw=()=>{X.cache('paint_bg',()=>{X.sky(['#1a1236','#0e0a20']);for(let i=0;i<GW*GH;i++)X.rr(OX+(i%GW)*CS,OY+((i/GW)|0)*CS,CS-1,CS-1,2,(i%GW+((i/GW)|0))%2?'#2a2450':'#26204a');});const c=A.c;let a=0,b=0;
  for(let i=0;i<GW*GH;i++){const v=gr[i];if(!v)continue;if(v===1)a++;else b++;const x=OX+(i%GW)*CS,y=OY+((i/GW)|0)*CS,s=age[i]?1+age[i]*.04:1,col=v===1?'#1fb8a8':'#d83a84';X.rr(x+6.5-6.5*s,y+6.5-6.5*s,13*s,13*s,3,X.lg(0,y,0,y+13,[X.lt(col,1.3),col]));if(i%3===0){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x+3,y+3,3,2);}}
  lasers.forEach(l=>{if(!l.c.length)return;const e=l.c[l.c.length-1],k=l.t/10;c.globalAlpha=k;X.glow(OX+e[0]*CS+7,OY+e[1]*CS+7,14,PC[l.i],.6);X.stroke([[OX+l.x0*CS+7,OY+l.y0*CS+7],[OX+e[0]*CS+7,OY+e[1]*CS+7]],PC[l.i],5);X.stroke([[OX+l.x0*CS+7,OY+l.y0*CS+7],[OX+e[0]*CS+7,OY+e[1]*CS+7]],'#ffffff',2);c.globalAlpha=1;});
  p.forEach((q,i)=>{const X0=OX+q.x*CS+6.5,Y0=OY+q.y*CS+6.5;X.glow(X0,Y0,12,PC[i],.35);X.shadow(X0,Y0+5,6,2,.4);X.orb(X0,Y0,5.5,PC[i]);X.stroke([[X0,Y0],[X0+q.fx*7,Y0+q.fy*7]],'#ffffff',2.2);if(q.cd===0)A.ring(X0,Y0,8,'rgba(255,255,255,.5)');});
  fx.draw();X.bar();A.hud2(a,b);X.panel(140,2,40,14,K.c);T(Math.ceil(time/60),160,4,K.w,2,'c');const tot=Math.max(1,a+b);X.meter(20,229,280,6,a/tot,'#2fd6c3','rgba(255,79,154,.85)');};
 return g;}});

/* ---- ARENA BLAST ---- */
A.add({id:'arena',name:'ARENA BLAST',cat:'VERSUS',vs:1,how:'MOVE. A FIRES WHERE YOU FACE. 5 HITS WINS.',make(){
 const g={over:null,score:0},PIL=[[80,70],[240,70],[80,170],[240,170],[160,120]],fx=X.fx();let p,sh=[],sc=[0,0],wait=30,hitF=[0,0];
 const blk=(x,y)=>x<12||x>W-12||y<28||y>H-12||PIL.some(c=>Math.hypot(c[0]-x,c[1]-y)<14);
 const reset=()=>{p=[{x:40,y:120,fx:1,fy:0,cd:0},{x:280,y:120,fx:-1,fy:0,cd:0}];sh=[];wait=30;};reset();
 g.update=()=>{hitF=hitF.map(v=>v?v-1:0);if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],dx=o.x-q.x,dy=o.y-q.y,al=Math.abs(dx)<8,alY=Math.abs(dy)<8;const rowBlk=PIL.some(c=>Math.abs(c.y-o.y)<16&&(c.x-q.x)*(c.x-o.x)<0),colBlk=PIL.some(c=>Math.abs(c.x-o.x)<16&&(c.y-q.y)*(c.y-o.y)<0);
   const near=sh.find(s=>s.o===0&&Math.hypot(s.x-q.x,s.y-q.y)<90&&(Math.abs(s.vx)>1?Math.abs(s.y-q.y)<14&&(s.x-q.x)*s.vx<0:Math.abs(s.x-q.x)<14&&(s.y-q.y)*s.vy<0));let o2={};
   if(near&&A.ai>.55){o2[Math.abs(near.vx)>Math.abs(near.vy)?(q.y<120?'d':'u'):(q.x<160?'r':'l')]=1;}
   else if((alY&&!rowBlk)||(al&&!colBlk)){o2={l:alY&&dx<0,r:alY&&dx>0,u:al&&dy<0,d:al&&dy>0,a:q.cd===0&&Math.random()<.15+.25*A.ai};}
   else{let mx=0,my=0;if(!rowBlk&&!alY)my=dy<0?-1:1;else if(!colBlk&&!al)mx=dx<0?-1:1;else{const lane=q.y<120?40:200;if(Math.abs(q.y-lane)>6)my=lane<q.y?-1:1;else mx=dx<0?-1:1;}
    if(mx&&blk(q.x+mx*22,q.y)){my=q.y<120?-1:1;mx=0;}else if(my&&blk(q.x,q.y+my*22)){mx=q.x<160?-1:1;my=0;}o2={l:mx<0,r:mx>0,u:my<0,d:my>0};if(Math.random()<.15-.12*A.ai)o2={[['l','r','u','d'][ri(4)]]:1};}A.bot(o2);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),sp=i&&A.cpu?1.2+1.2*A.ai:2.4,dx=ax(k),dy=ay(k);if(dx||dy){q.fx=dx;q.fy=dy;if(!blk(q.x+dx*sp,q.y))q.x+=dx*sp;if(!blk(q.x,q.y+dy*sp))q.y+=dy*sp;}if(q.cd>0)q.cd--;
   if(A.hit(i).a&&q.cd===0){q.cd=25;const m=Math.hypot(q.fx,q.fy)||1;sh.push({x:q.x+q.fx/m*10,y:q.y+q.fy/m*10,vx:q.fx/m*5,vy:q.fy/m*5,o:i});S('shoot');fx.spark(q.x+q.fx/m*12,q.y+q.fy/m*12,PC[i],4,1.5);}}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;if(blk(s.x,s.y)){s.dead=1;fx.spark(s.x,s.y,PC[s.o],5,1.8);}const o=p[1-s.o];if(Math.hypot(s.x-o.x,s.y-o.y)<8){s.dead=1;sc[s.o]++;S('boom');hitF[1-s.o]=20;fx.spark(o.x,o.y,'#ffffff',16,3);fx.ring(o.x,o.y,PC[1-s.o],30);fx.flash(PC[s.o],6);if(sc[s.o]>=5){g.over=A.win(s.o);return;}reset();return;}}sh=sh.filter(s=>!s.dead);};
 const bg=()=>{X.sky(['#1a1c2e','#101220']);const c=A.c;for(let x=12;x<W-12;x+=24)for(let y=28;y<H-12;y+=24){c.fillStyle=(x/24+y/24)%2<1?'#2a2e48':'#252840';c.fillRect(x,y,23,23);c.fillStyle='rgba(120,140,255,.06)';c.fillRect(x,y,23,1);}c.strokeStyle='rgba(120,200,255,.25)';c.lineWidth=1;c.strokeRect(12,28,W-24,H-40);
  X.glow(40,120,50,'#2fd6c3',.12);X.glow(280,120,50,'#ff4f9a',.12);PIL.forEach(q=>{X.shadow(q[0]+3,q[1]+5,13,9,.4);X.disc(q[0],q[1],12,X.lg(0,q[1]-12,0,q[1]+12,['#9a96c8','#4a4570']));X.disc(q[0],q[1],8,X.rg(q[0]-2,q[1]-3,0,q[0],q[1],8,['#c8c0ff','#6a65a0']));});};
 g.draw=()=>{X.cache('arena_bg',bg);const c=A.c;PIL.forEach(q=>X.glow(q[0],q[1],10,'#9a8aff',.15+.08*Math.sin(A.t*.1)));
  sh.forEach(s=>{X.glow(s.x,s.y,8,PC[s.o],.7);X.stroke([[s.x,s.y],[s.x-s.vx*2,s.y-s.vy*2]],'#ffffff',2);});
  p.forEach((q,i)=>{const m=Math.hypot(q.fx,q.fy)||1,a=Math.atan2(q.fy/m,q.fx/m);X.shadow(q.x+1,q.y+5,8,3,.4);X.glow(q.x,q.y,14,PC[i],.25);if(hitF[i]&&hitF[i]%4<2)return;c.save();c.translate(q.x,q.y);X.orb(0,0,8,PC[i]);c.rotate(a);c.fillStyle='#e8e8f0';c.fillRect(3,-1.8,9,3.6);c.fillStyle='#555';c.fillRect(10,-2,2,4);X.disc(0,0,3.5,'#1a1a2a');X.disc(1,0,1.4,q.cd===0?'#3dff8b':'#ff4040');c.restore();});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);for(let i=0;i<5;i++){X.disc(110+i*7,9,2,i<sc[0]?'#2fd6c3':'rgba(255,255,255,.15)');X.disc(210-i*7,9,2,i<sc[1]?'#ff4f9a':'rgba(255,255,255,.15)');}};
 return g;}});

/* ---- CHECKERS ---- */
A.add({id:'checkers',name:'CHECKERS',cat:'BOARD',vs:1,how:'PICK A PIECE, PICK A SQUARE. JUMPS CAPTURE. KINGS GO BACK.',make(){
 const g={over:null,score:0},fx=X.fx();let b=Array(64).fill(0),p=0,c={x:0,y:5},sel=-1,think=0,last=null;for(let i=0;i<64;i++){const x=i%8,y=(i/8)|0;if((x+y)%2){if(y<3)b[i]=2;if(y>4)b[i]=1;}}
 const own=(v,pl)=>v&&((v===1||v===3)?pl===0:pl===1);
 const moves=(bd,pl)=>{const out=[],caps=[];for(let i=0;i<64;i++){const v=bd[i];if(!own(v,pl))continue;const x=i%8,y=(i/8)|0,dirs=v>2?[[1,1],[-1,1],[1,-1],[-1,-1]]:pl===0?[[1,-1],[-1,-1]]:[[1,1],[-1,1]];
   for(const d of dirs){const nx=x+d[0],ny=y+d[1];if(nx<0||ny<0||nx>7||ny>7)continue;const t=ny*8+nx;if(!bd[t])out.push([i,t,-1]);else if(!own(bd[t],pl)){const jx=nx+d[0],jy=ny+d[1];if(jx>=0&&jy>=0&&jx<8&&jy<8&&!bd[jy*8+jx])caps.push([i,jy*8+jx,t]);}}}return caps.length?caps:out;};
 const apply=(bd,m)=>{let v=bd[m[0]];bd[m[0]]=0;if(m[2]>=0)bd[m[2]]=0;const y=(m[1]/8)|0;if(v===1&&y===0)v=3;if(v===2&&y===7)v=4;bd[m[1]]=v;};
 const ev=bd=>{let s=0;for(const v of bd)s+=v===2?1:v===4?2:v===1?-1:v===3?-2:0;return s;};
 const mm=(bd,pl,dp)=>{const ms=moves(bd,pl);if(!ms.length)return pl===1?-99:99;if(dp===0)return ev(bd);let best=pl===1?-1e9:1e9;for(const m of ms){const nb=bd.slice();apply(nb,m);const v=mm(nb,1-pl,dp-1);best=pl===1?Math.max(best,v):Math.min(best,v);}return best;};
 const sq=i=>[76+(i%8)*21+10.5,36+((i/8)|0)*21+10.5];
 const play=m=>{const was=b[m[0]];apply(b,m);last={f:m[0],t:m[1],k:0};S('hit');if(m[2]>=0){const[x,y]=sq(m[2]);fx.debris(x,y,(b[m[1]]%2)?'#ff4f9a':'#2fd6c3',8,2);fx.ring(x,y,'#ffffff',16,12);}if(b[m[1]]>2&&was<=2){const[x,y]=sq(m[1]);fx.pop(x,y-12,'KING!',K.y);fx.ring(x,y,K.y,20);}p=1-p;sel=-1;think=0;if(!moves(b,p).length){g.over=A.win(1-p);}};
 g.update=()=>{if(last&&last.k<1)last.k+=.15;if(A.cpu&&p===1){if(++think>35){const ms=moves(b,1);let best=-1e9,mv=ms[0];for(const m of ms){const nb=b.slice();apply(nb,m);const v=mm(nb,0,[0,1,3][A.lvl])+rnd(A.lvl?.3:3);if(v>best){best=v;mv=m;}}play(mv);}return;}
  const h=A.hit(human(p));mvCur(h,c,8,8);if(h.a){const i=c.y*8+c.x,ms=moves(b,p);if(sel>=0){const m=ms.find(m=>m[0]===sel&&m[1]===i);if(m)play(m);else if(own(b[i],p))sel=i;else S('lose');}else if(ms.some(m=>m[0]===i)){sel=i;S('blip');}else S('lose');}};
 const piece=(x,y,v,lift)=>{const col=v%2?'#2fd6c3':'#ff4f9a';X.shadow(x+1,y+3,8,4,.4);y-=lift||0;X.disc(x,y+1.6,8,X.lt(col,.45));X.disc(x,y,8,X.rg(x-3,y-3,1,x,y,8,[X.lt(col,1.4),col,X.lt(col,.7)]));A.c.strokeStyle=X.lt(col,.6);A.c.lineWidth=.8;A.c.beginPath();A.c.arc(x,y,5.5,0,6.283);A.c.stroke();if(v>2){X.poly([[x-4,y+2],[x-4,y-2],[x-2,y],[x,y-3.5],[x+2,y],[x+4,y-2],[x+4,y+2]],'#ffcf3f');}};
 g.draw=()=>{X.cache('checkers_bg',()=>{X.vg(0,0,W,H,['#2a1a10','#140c06']);X.rr(70,30,180,180,6,X.lg(0,30,0,210,['#8a5a2a','#5a3414']));for(let i=0;i<64;i++){const x=76+(i%8)*21,y=36+((i/8)|0)*21,dk=(i%8+((i/8)|0))%2;A.c.fillStyle=dk?X.lg(0,y,0,y+21,['#6a3a1a','#5a2e14']):X.lg(0,y,0,y+21,['#f4dca0','#e0c080']);A.c.fillRect(x,y,21,21);}});
  const ms=moves(b,p),mine=!(A.cpu&&p===1);if(last){[last.f,last.t].forEach(i=>{const[x,y]=sq(i);A.c.fillStyle='rgba(255,230,120,.18)';A.c.fillRect(x-10.5,y-10.5,21,21);});}
  if(mine&&sel<0)ms.forEach(m=>{const[x,y]=sq(m[0]);X.glow(x,y,10,'#ffffff',.12);});
  for(let i=0;i<64;i++){const v=b[i],[x,y]=sq(i);if(sel>=0&&ms.some(m=>m[0]===sel&&m[1]===i)){X.disc(x,y,3+Math.sin(A.t*.2),'rgba(255,207,63,.8)');}if(v)piece(x,y,v,i===sel?3:0);}
  if(mine)cursor(76+c.x*21,36+c.y*21,21,21,sel===c.y*8+c.x?'#3ddc84':'#ffcf3f');fx.draw();X.bar();A.hud2('','');turnTag(A.nm(p)+' TO MOVE',PC[p]);};
 return g;}});

/* ---- NIM STICKS ---- */
A.add({id:'nim',name:'NIM STICKS',cat:'BOARD',vs:1,how:'PICK A ROW, TAKE 1+ STICKS. TAKE THE LAST STICK TO WIN.',make(){
 const g={over:null,score:0},fx=X.fx();let rows=[1,3,5,7],p=0,row=0,take=1,think=0,gone=[];
 const play=(r,n)=>{const y=50+r*40,cnt=rows[r];for(let i=cnt-n;i<cnt;i++){const x=160-(cnt-1)*12+i*24;gone.push({x,y,vx:rnd(2)-1,vy:-2-rnd(2),r:0,vr:rnd(.3)-.15});}rows[r]-=n;S('hit');if(rows.every(v=>!v)){g.over=A.win(p);return;}p=1-p;row=rows.findIndex(v=>v);take=1;think=0;};
 g.update=()=>{gone.forEach(q=>{q.vy+=.25;q.x+=q.vx;q.y+=q.vy;q.r+=q.vr;});gone=gone.filter(q=>q.y<H+40);if(A.cpu&&p===1){if(++think>40){let x=rows.reduce((a,v)=>a^v,0),mv=null;if(x&&Math.random()<[.4,.8,1][A.lvl])for(let r=0;r<4;r++){const t=rows[r]^x;if(t<rows[r]){mv=[r,rows[r]-t];break;}}if(!mv){const rs=rows.map((v,i)=>i).filter(i=>rows[i]);const r=rs[ri(rs.length)];mv=[r,1+ri(rows[r])];}play(mv[0],mv[1]);}return;}
  const h=A.hit(human(p));if(h.u||h.d){do{row=(row+(h.u?3:1))%4;}while(!rows[row]);take=1;S('blip');}if(h.l){take=Math.max(1,take-1);S('blip');}if(h.r){take=Math.min(rows[row],take+1);S('blip');}if(h.a)play(row,take);};
 const stick=(x,y,hi,rot)=>{const c=A.c;c.save();c.translate(x,y+15);if(rot)c.rotate(rot);X.shadow(2,16,4,1.5,.3);c.fillStyle=X.lg(-3,0,3,0,hi?['#fff0a0','#ffd060','#c89020']:['#f0d0a0','#d8a868','#a87838']);c.fillRect(-2.5,-13,5,28);X.ell(0,-14,3.6,4.5,X.rg(-1,-16,0,0,-14,4.5,hi?['#ffffff','#ff6a6a','#c01020']:['#ff9a9a','#d02a3a','#801020']));if(hi)X.glow(0,0,16,'#ffcf3f',.25);c.restore();};
 g.draw=()=>{X.cache('nim_bg',()=>{X.wood(0,0,W,H,'#5a3a20');X.vignette(.5);X.glow(160,120,140,'#ffd890',.12);});const mine=!(A.cpu&&p===1);
  rows.forEach((n,r)=>{const y=50+r*40;if(r===row&&mine){X.rr(160-(n-1)*12-16,y-8,(n-1)*24+32,42,8,'rgba(255,207,63,.08)');X.ot('>',56,y+10,K.y,2);}for(let i=0;i<n;i++){const x=160-(n-1)*12+i*24,hi=r===row&&i>=n-take&&mine;stick(x,y-(hi?3:0),hi);}});
  gone.forEach(q=>stick(q.x,q.y,false,q.r));fx.draw();X.bar();A.hud2('','');turnTag(A.nm(p)+(A.cpu&&p===1?' THINKS':' TAKES '+take),PC[p]);X.ot('UP/DOWN ROW  LEFT/RIGHT AMOUNT  A TAKE',160,226,K.gr,1,'c');};
 return g;}});

/* ---- DOTS AND BOXES ---- */
A.add({id:'dots',name:'DOTS AND BOXES',cat:'BOARD',vs:1,how:'PICK AN EDGE, PRESS A. CLOSE A BOX TO SCORE AND GO AGAIN.',make(){
 const g={over:null,score:0},N=5,fx=X.fx();let hE=[],vE=[],box=[],bt=[],p=0,c={x:0,y:0,v:0},sc=[0,0],think=0;for(let i=0;i<N*(N-1);i++){hE.push(0);vE.push(0);}for(let i=0;i<(N-1)*(N-1);i++){box.push(0);bt.push(0);}
 const sides=(bx,by)=>(hE[by*(N-1)+bx]?1:0)+(hE[(by+1)*(N-1)+bx]?1:0)+(vE[by*N+bx]?1:0)+(vE[by*N+bx+1]?1:0);
 const place=(v,i)=>{(v?vE:hE)[i]=p+1;let got=0;for(let by=0;by<N-1;by++)for(let bx=0;bx<N-1;bx++)if(!box[by*(N-1)+bx]&&sides(bx,by)===4){box[by*(N-1)+bx]=p+1;bt[by*(N-1)+bx]=12;sc[p]++;got++;fx.spark(88+bx*36+18,48+by*36+18,PC[p],10,2.2);}S(got?'score':'blip');if(box.every(v=>v)){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}if(!got)p=1-p;think=0;};
 const gain=(v,i)=>{(v?vE:hE)[i]=1;let g_=0,bad=0;for(let by=0;by<N-1;by++)for(let bx=0;bx<N-1;bx++){const s=sides(bx,by);if(!box[by*(N-1)+bx]){if(s===4)g_++;if(s===3)bad++;}}(v?vE:hE)[i]=0;return[g_,bad];};
 g.update=()=>{bt=bt.map(v=>v?v-1:0);if(A.cpu&&p===1){if(++think>35){let best=-1e9,mv=null;for(let v=0;v<2;v++)for(let i=0;i<N*(N-1);i++){if((v?vE:hE)[i])continue;const[g_,bad]=gain(v,i);let s=g_*10-(A.lvl?bad*5:0)+rnd(A.lvl===2?.5:3);if(s>best){best=s;mv=[v,i];}}place(mv[0],mv[1]);}return;}
  const h=A.hit(human(p));if(h.b){c.v^=1;}if(h.l)c.x=(c.x+(c.v?N:N-1)-1)%(c.v?N:N-1);if(h.r)c.x=(c.x+1)%(c.v?N:N-1);if(h.u)c.y=(c.y+(c.v?N-1:N)-1)%(c.v?N-1:N);if(h.d)c.y=(c.y+1)%(c.v?N-1:N);if(c.v){c.x=Math.min(c.x,N-1);c.y=Math.min(c.y,N-2);}else{c.x=Math.min(c.x,N-2);c.y=Math.min(c.y,N-1);}if(h.a){const i=c.v?c.y*N+c.x:c.y*(N-1)+c.x;if(!(c.v?vE:hE)[i])place(c.v,i);else S('lose');}};
 g.draw=()=>{const S_=36,OX=88,OY=48,cx=A.c;X.cache('dots_bg',()=>{X.vg(0,0,W,H,['#f4f0e4','#e4dcc8']);A.c.strokeStyle='rgba(80,120,200,.18)';A.c.lineWidth=1;for(let y=12;y<H;y+=12){A.c.beginPath();A.c.moveTo(0,y);A.c.lineTo(W,y);A.c.stroke();}A.c.strokeStyle='rgba(220,60,60,.3)';A.c.beginPath();A.c.moveTo(40,0);A.c.lineTo(40,H);A.c.stroke();});
  box.forEach((v,i)=>{if(!v)return;const x=OX+(i%(N-1))*S_,y=OY+((i/(N-1))|0)*S_,s=bt[i]?1-bt[i]*.05:1;X.rr(x+S_/2-(S_-8)*s/2,y+S_/2-(S_-8)*s/2,(S_-8)*s,(S_-8)*s,4,X.lg(0,y,0,y+S_,[X.lt(PC[v-1],1.3),PC[v-1]]));T(v===1?'1':'2',x+S_/2,y+S_/2-4,'#ffffff',2,'c');});
  hE.forEach((v,i)=>{if(v){const x=OX+(i%(N-1))*S_,y=OY+((i/(N-1))|0)*S_;X.stroke([[x,y],[x+S_,y]],X.lt(PC[v-1],.8),3.2);}});vE.forEach((v,i)=>{if(v){const x=OX+(i%N)*S_,y=OY+((i/N)|0)*S_;X.stroke([[x,y],[x,y+S_]],X.lt(PC[v-1],.8),3.2);}});
  if(!(A.cpu&&p===1)){const a=.5+.3*Math.sin(A.t*.2);cx.globalAlpha=a;if(c.v)X.stroke([[OX+c.x*S_,OY+c.y*S_+3],[OX+c.x*S_,OY+c.y*S_+S_-3]],PC[p],4);else X.stroke([[OX+c.x*S_+3,OY+c.y*S_],[OX+c.x*S_+S_-3,OY+c.y*S_]],PC[p],4);cx.globalAlpha=1;}
  for(let i=0;i<N*N;i++)X.orb(OX+(i%N)*S_,OY+((i/N)|0)*S_,3.2,'#3a3a5a');fx.draw();X.bar();A.hud2(sc[0],sc[1]);turnTag(A.nm(p)+' TO MOVE',PC[p]);X.ot('B FLIPS EDGE DIRECTION',160,226,K.gr,1,'c');};
 return g;}});

/* ---- MANCALA ---- */
A.add({id:'mancala',name:'MANCALA',cat:'BOARD',vs:1,how:'PICK A PIT, A SOWS COUNTER-CLOCKWISE. MOST IN YOUR STORE WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let b=Array(14).fill(4),p=0,cur=0,think=0,pulse=Array(14).fill(0);b[6]=b[13]=0;
 const move=(bd,pl,pit)=>{let i=pl?7+pit:pit,n=bd[i];bd[i]=0;while(n>0){i=(i+1)%14;if(i===(pl?6:13))continue;bd[i]++;n--;}const own=pl?i>=7&&i<13:i<6;if(own&&bd[i]===1&&bd[12-i]>0){bd[pl?13:6]+=bd[12-i]+1;bd[i]=0;bd[12-i]=0;}return i===(pl?13:6);};
 const finish=()=>{for(let i=0;i<6;i++){b[6]+=b[i];b[i]=0;b[13]+=b[i+7];b[i+7]=0;}g.over=b[6]===b[13]?'DRAW!':A.win(b[6]>b[13]?0:1);};
 const pp=i=>i===6?[288,120]:i===13?[36,120]:i<6?[75+i*34,145]:[75+(12-i)*34,95];
 const play=pit=>{const before=b.slice(),again=move(b,p,pit);b.forEach((v,i)=>{if(v>before[i]){pulse[i]=10;}});S('hit');const st=p?13:6;if(b[st]-before[st]>1){const[x,y]=pp(st);fx.spark(x,y,PC[p],8,2);}if(again){const[x,y]=pp(st);fx.pop(x,y-30,'AGAIN!',K.y);}if(b.slice(0,6).every(v=>!v)||b.slice(7,13).every(v=>!v)){finish();return;}if(!again)p=1-p;think=0;cur=b.slice(p?7:0,p?13:6).findIndex(v=>v>0);if(cur<0)cur=0;};
 g.update=()=>{pulse=pulse.map(v=>v?v-1:0);if(A.cpu&&p===1){if(++think>40){let best=-1e9,mv=0;for(let i=0;i<6;i++){if(!b[7+i])continue;const nb=b.slice(),again=move(nb,1,i);let s=(nb[13]-b[13])*2+(again?4:0)+rnd(A.lvl===0?6:A.lvl===1?1.5:.2);if(A.lvl===2){let worst=0;for(let j=0;j<6;j++)if(nb[j]){const n2=nb.slice();move(n2,0,j);worst=Math.max(worst,n2[6]-nb[6]);}s-=worst*.7;}if(s>best){best=s;mv=i;}}play(mv);}return;}
  const h=A.hit(human(p)),has=i=>b[p?7+i:i]>0;if(h.l){let n=0;do{cur=(cur+5)%6;}while(!has(cur)&&++n<6);S('blip');}if(h.r){let n=0;do{cur=(cur+1)%6;}while(!has(cur)&&++n<6);S('blip');}if(!has(cur)){const f=[0,1,2,3,4,5].find(has);if(f!==undefined)cur=f;}if(h.a&&has(cur))play(cur);};
 const GC=['#ff4f6d','#4dabff','#ffcf3f','#3ddc84','#c86dff','#ff9838'];
 const stones=(x,y,n,r,tall)=>{for(let i=0;i<Math.min(n,tall?30:12);i++){const a=i*2.4,d=Math.sqrt(i)*(tall?3.2:3.6);X.orb(x+Math.cos(a)*d*(tall?.6:1),y+Math.sin(a)*d*(tall?1.6:.8),2.2,GC[(i*7+n)%6]);}};
 g.draw=()=>{X.cache('mancala_bg',()=>{X.wood(0,0,W,H,'#3a2414');X.vignette(.5);X.rr(14,56,292,128,30,'rgba(0,0,0,.4)');X.rr(12,52,296,128,30,X.lg(0,52,0,180,['#c8884a','#9a5a2a','#6a3a18']));A.c.fillStyle='rgba(0,0,0,.08)';for(let y=58;y<178;y+=5)A.c.fillRect(20,y,280,1);
   const pit=(x,y,rx,ry)=>{X.ell(x,y+1,rx+1,ry+1,'rgba(255,220,170,.25)');X.ell(x,y,rx,ry,X.rg(x,y-ry*.3,1,x,y,rx,['#2a1608','#4a2a12','#6a3a18']));};for(let i=0;i<6;i++){pit(75+i*34,145,14,13);pit(75+i*34,95,14,13);}pit(36,120,14,40);pit(288,120,14,40);});
  const mine=!(A.cpu&&p===1);for(let i=0;i<6;i++){const sel0=p===0&&cur===i&&mine,sel1=p===1&&cur===i&&mine;if(sel0){X.glow(75+i*34,145,20,'#2fd6c3',.35);A.ring(75+i*34,145,15,'#7ff0e0');}if(sel1){X.glow(75+(5-i)*34,95,20,'#ff4f9a',.35);A.ring(75+(5-i)*34,95,15,'#ff9ad0');}}
  for(let i=0;i<14;i++){const[x,y]=pp(i),tall=i===6||i===13,s=pulse[i]?1+pulse[i]*.02:1;stones(x,y,b[i],2,tall);X.ot(b[i],x,y+(tall?46:17),i===6?K.c:i===13?K.p:K.w,1,'c');}
  fx.draw();X.bar();A.hud2('','');turnTag(A.nm(p)+' TO SOW',PC[p]);X.ot('P1 BOTTOM ROW, STORE RIGHT   P2 TOP ROW, STORE LEFT',160,224,K.gr,1,'c');};
 return g;}});

/* ---- GOMOKU ---- */
A.add({id:'gomoku',name:'GOMOKU',cat:'BOARD',vs:1,how:'PLACE STONES. FIVE IN A ROW WINS.',make(){
 const g={over:null,score:0},N=11,fx=X.fx();let b=Array(N*N).fill(0),p=0,c={x:5,y:5},CU=c,think=0,winL=null,lastI=-1;
 const line=(bd,i,v)=>{const x=i%N,y=(i/N)|0;for(const d of[[1,0],[0,1],[1,1],[1,-1]]){const cells=[i];for(const s of[1,-1]){let nx=x+d[0]*s,ny=y+d[1]*s;while(nx>=0&&ny>=0&&nx<N&&ny<N&&bd[ny*N+nx]===v){cells.push(ny*N+nx);nx+=d[0]*s;ny+=d[1]*s;}}if(cells.length>=5)return cells;}return null;};
 const score=(bd,i,v)=>{let s=0;const x=i%N,y=(i/N)|0;for(const d of[[1,0],[0,1],[1,1],[1,-1]]){let n=1,open=0;for(const sg of[1,-1]){let nx=x+d[0]*sg,ny=y+d[1]*sg;while(nx>=0&&ny>=0&&nx<N&&ny<N&&bd[ny*N+nx]===v){n++;nx+=d[0]*sg;ny+=d[1]*sg;}if(nx>=0&&ny>=0&&nx<N&&ny<N&&!bd[ny*N+nx])open++;}s+=n>=5?1e6:n===4?(open===2?1e4:open?1e3:0):n===3?(open===2?500:open?50:0):n===2?open*8:1;}return s;};
 const play=i=>{b[i]=p+1;lastI=i;S('hit');fx.ring(70+(i%N)*18,32+((i/N)|0)*18,PC[p],12,10);const w=line(b,i,p+1);if(w){winL=w;g.over=A.win(p);}else if(b.every(v=>v))g.over='DRAW!';else p=1-p;think=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>30){let best=-1,mv=60;for(let i=0;i<N*N;i++){if(b[i])continue;const s=score(b,i,2)+score(b,i,1)*(A.lvl?.9:.3)+rnd(A.lvl===2?2:A.lvl===1?30:200);if(s>best){best=s;mv=i;}}play(mv);}return;}
  const h=A.hit(human(p));mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(!b[i])play(i);else S('lose');}};
 g.draw=()=>{X.cache('gomoku_bg',()=>{X.vg(0,0,W,H,['#1a2a3a','#0c141c']);X.rr(56,18,208,208,6,'rgba(0,0,0,.4)');X.rr(54,16,208,208,6,X.lg(54,16,262,224,['#f0c880','#d9a55b','#b8843a']));const cc=A.c;cc.fillStyle='rgba(120,70,20,.12)';for(let i=0;i<30;i++)cc.fillRect(58,20+i*7,200,2);cc.strokeStyle='rgba(70,40,15,.85)';cc.lineWidth=1;cc.beginPath();for(let i=0;i<N;i++){cc.moveTo(70+i*18,32);cc.lineTo(70+i*18,212);cc.moveTo(70,32+i*18);cc.lineTo(250,32+i*18);}cc.stroke();for(const[x,y]of[[2,2],[8,2],[5,5],[2,8],[8,8]])X.disc(70+x*18,32+y*18,2,'#5a3010');});
  b.forEach((v,i)=>{if(!v)return;const x=70+(i%N)*18,y=32+((i/N)|0)*18;X.shadow(x+1.5,y+2,7,6,.35);X.disc(x,y,7.2,X.rg(x-2.5,y-3,.5,x,y,7.2,v===1?['#e0ffff','#2fd6c3','#0a5a52']:['#ffd0e8','#ff4f9a','#7a1040']));X.ell(x-2.2,y-2.8,2.4,1.4,'rgba(255,255,255,.6)',-.5);if(i===lastI){X.disc(x,y,1.5,'#ffffff');}});
  if(winL)winL.forEach(i=>{const x=70+(i%N)*18,y=32+((i/N)|0)*18;X.glow(x,y,14,'#ffffff',.4);A.ring(x,y,8,A.t%20<10?K.w:K.y);});
  if(!g.over&&!(A.cpu&&p===1)){const x=70+CU.x*18,y=32+CU.y*18;A.c.globalAlpha=.45;X.disc(x,y,7,PC[p]);A.c.globalAlpha=1;cursor(x-9,y-9,18,18,PC[p]);}fx.draw();X.bar();A.hud2('','');turnTag(A.nm(p)+' TO MOVE',PC[p]);};
 return g;}});
})();
