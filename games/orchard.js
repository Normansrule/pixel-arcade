/* PIXEL ARCADE - orchard pack: MELON DROP, a fruit-merge drop duel (VS CPU with difficulty, or 2 players) */
(function(){'use strict';const A=window.A,{W,H,K}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const hi=()=>A.gfx==='high',lo=()=>A.gfx!=='off';
const ax=k=>(k.r?1:0)-(k.l?1:0),TAU=Math.PI*2;
const PC=['#2fd6c3','#ff4f9a'];
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';

// the merge chain: name, colour, radius. Two of a kind touching become the next one; two watermelons burst.
const FR=[['CHERRY','#e3263f',5],['STRAWBERRY','#ff4b5c',6.6],['GRAPE','#8f5cf0',8.4],['ORANGE','#ffa424',10.4],['PERSIMMON','#ff6f1e',12.6],
 ['APPLE','#e5352b',15],['PEAR','#d6e05a',17.6],['PEACH','#ff9fb2',20.4],['PINEAPPLE','#ffcf3a',23.6],['MELON','#a4dc6a',27],['WATERMELON','#2e9a46',31]];
const PTS=[1,3,6,10,15,21,28,36,45,55,66];

/* ---- fruit painter: body shading and the light stay fixed, the skin pattern and face roll with the fruit ---- */
const leaf=(c,x,y,r,a,col)=>{c.save();c.translate(x,y);c.rotate(a);X.ell(r*.5,0,r*.55,r*.24,col||'#3fae4a');c.strokeStyle='rgba(20,70,30,.5)';c.lineWidth=Math.max(.4,r*.06);c.beginPath();c.moveTo(0,0);c.lineTo(r*.95,0);c.stroke();c.restore();};
const stem=(c,r,len,bend)=>{c.strokeStyle='#6b4423';c.lineWidth=Math.max(.7,r*.1);c.lineCap='round';c.beginPath();c.moveTo(0,-r*.82);c.quadraticCurveTo(r*bend,-r*(1+len*.6),r*bend*1.4,-r*(1+len));c.stroke();c.lineCap='butt';};
const clip=(c,r,f)=>{c.save();c.beginPath();c.arc(0,0,r*.97,0,TAU);if(c.clip)c.clip();f();c.restore();};
const SKIN=[
 (c,r)=>{stem(c,r,1,.35);leaf(c,r*.48,-r*1.85,r*.9,-.4);},
 (c,r)=>{for(let i=0;i<9;i++){const a=i*2.4,d=r*(.25+.45*((i*7)%5)/5);X.ell(Math.cos(a)*d,Math.sin(a)*d+r*.1,r*.07,r*.11,'#ffe28a');}
  for(let i=0;i<5;i++)leaf(c,0,-r*.85,r*.55,-Math.PI/2+(i-2)*.7,'#3cb04a');},
 (c,r)=>{for(const[x,y]of[[-.35,-.25],[.3,-.3],[0,.2],[-.3,.35],[.35,.3]])X.disc(x*r,y*r,r*.36,'rgba(255,255,255,.1)');stem(c,r,.5,.1);},
 (c,r)=>{for(let i=0;i<12;i++){const a=i*2.1,d=r*(.2+.65*((i*5)%7)/7);X.disc(Math.cos(a)*d,Math.sin(a)*d,r*.05,'rgba(170,80,0,.35)');}
  X.disc(0,-r*.86,r*.24,'#ffb240');leaf(c,0,-r*1.02,r*.7,-.5);},
 (c,r)=>{for(let i=0;i<4;i++)leaf(c,0,-r*.78,r*.5,i*Math.PI/2+.4,'#2e7a34');X.disc(0,-r*.8,r*.12,'#5a3a1a');},
 (c,r)=>{for(const x of[-.45,0,.42])X.ell(x*r,0,r*.1,r*.7,'rgba(255,235,190,.13)');stem(c,r,.55,.15);leaf(c,r*.12,-r*1.18,r*.75,-.3);},
 (c,r)=>{for(let i=0;i<16;i++){const a=i*2.3,d=r*(.2+.7*((i*3)%8)/8);X.disc(Math.cos(a)*d,Math.sin(a)*d,r*.035,'rgba(110,100,20,.45)');}
  X.disc(r*.3,r*.25,r*.5,'rgba(255,170,60,.18)');stem(c,r,.45,.2);},
 (c,r)=>{X.disc(r*.28,r*.15,r*.62,'rgba(255,70,110,.22)');c.strokeStyle='rgba(200,60,90,.38)';c.lineWidth=r*.06;c.beginPath();c.moveTo(-r*.05,-r*.95);c.quadraticCurveTo(-r*.42,-r*.1,-r*.05,r*.92);c.stroke();leaf(c,0,-r*.92,r*.62,-.6);},
 (c,r)=>{clip(c,r,()=>{c.strokeStyle='rgba(150,95,0,.45)';c.lineWidth=r*.05;const s=r*.36;for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(i*s-r,-r);c.lineTo(i*s+r,r);c.stroke();c.beginPath();c.moveTo(i*s+r,-r);c.lineTo(i*s-r,r);c.stroke();}
   for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++)X.disc(i*s*.71+(j%2)*s*.35,j*s*.71,r*.035,'rgba(120,70,0,.5)');});
  for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.32,l=r*(.55+.12*(2-Math.abs(i-2)));X.poly([[Math.cos(a-.12)*r*.85,Math.sin(a-.12)*r*.85],[Math.cos(a)*(r*.85+l),Math.sin(a)*(r*.85+l)],[Math.cos(a+.12)*r*.85,Math.sin(a+.12)*r*.85]],i%2?'#3a9a3f':'#4cbc4c');}},
 (c,r)=>{clip(c,r,()=>{c.strokeStyle='rgba(255,255,225,.55)';c.lineWidth=Math.max(.5,r*.035);for(let i=0;i<9;i++){const a=i*.7,b=a+2.2;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.quadraticCurveTo(Math.cos(a+1.1)*r*.15,Math.sin(a+1.1)*r*.15,Math.cos(b)*r,Math.sin(b)*r);c.stroke();}});
  X.disc(0,-r*.95,r*.1,'#7a9a3a');},
 (c,r)=>{clip(c,r,()=>{c.strokeStyle='#14592a';c.lineWidth=r*.13;for(let i=-3;i<=3;i++){c.beginPath();for(let s=0;s<=10;s++){const y=-r+s*r/5,x=i*r*.3*Math.cos(y/r*1.2)+(s%2?r*.05:-r*.05);s?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}});
  X.disc(0,-r*.96,r*.07,'#6b4423');}];
const face=(c,r,blink,mood)=>{const ey=r*.02,ex=r*.3,es=Math.max(.6,r*.11);
 if(blink){c.strokeStyle='#2a1418';c.lineWidth=Math.max(.5,es*.5);for(const s of[-1,1]){c.beginPath();c.moveTo(s*ex-es,ey);c.lineTo(s*ex+es,ey);c.stroke();}}
 else for(const s of[-1,1]){X.ell(s*ex,ey,es,es*1.25,'#2a1418');if(r>8)X.disc(s*ex-es*.3,ey-es*.45,es*.38,'#ffffff');}
 if(r>9)for(const s of[-1,1])X.ell(s*r*.5,r*.24,r*.13,r*.08,'rgba(255,110,140,.4)');
 c.strokeStyle='#2a1418';c.lineWidth=Math.max(.5,r*.05);c.beginPath();if(mood)c.arc(0,r*.42,r*.12,1.15*Math.PI,1.85*Math.PI);else c.arc(0,r*.2,r*.13,.15*Math.PI,.85*Math.PI);c.stroke();};
const fruit=(x,y,k,r,a,sq,o)=>{const c=A.c,col=FR[k][1],s1=1+(sq||0)*.16,s2=1-(sq||0)*.14;
 c.save();c.translate(x,y+r*(1-s2));c.scale(s1,s2);
 if(o&&o.glow)X.glow(0,0,r*1.6,col,o.glow);
 X.disc(0,0,r,X.rg(-r*.35,-r*.42,r*.08,0,0,r,[X.lt(col,1.5),col,X.lt(col,.58)]));
 c.save();c.rotate(a||0);SKIN[k](c,r);if(o&&o.face&&r>4.5)face(c,r,o.blink,o.mood);c.restore();
 if(r>12&&lo())X.disc(0,0,r,X.rg(0,0,r*.6,0,0,r,['rgba(0,0,0,0)','rgba(30,10,20,.22)']));
 X.ell(-r*.36,-r*.44,r*.3,r*.16,'rgba(255,255,255,.6)',-.6);
 c.strokeStyle='rgba(50,20,25,.4)';c.lineWidth=Math.max(.6,r*.055);c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
 c.restore();};
A.fruitArt=fruit;   // shared with the solo FRUIT MERGE

A.add({id:'melondrop',name:'MELON DROP',cat:'VERSUS',vs:1,mouse:1,time:180,tags:'suika game watermelon fruit merge drop physics stack 2048 jar',
 how:'MOVE, A OR CLICK DROPS. SAME FRUITS MERGE. A PEAR OR BIGGER SENDS CHERRIES TO YOUR RIVAL. DON\'T OVERFILL.',make(){
 const g={over:null,score:0},fx=X.fx(),JX=[22,186],JW=112,JY=50,JH=172,LY=JY+14,CY=JY-14,SUB=4,G=.24/(SUB*SUB);
 let t=0,top=4,uid=0;
 const demo=()=>!!(g.auto||A._e&&A._e.state==='title');
 const tier=p=>p.drops<3?ri(3):ri(5);
 const mk=(k,x,y,born)=>({k,x,y,px:x,py:y,r:born?FR[k][2]*.45:FR[k][2],a:rnd(6.28),age:0,sq:0,id:++uid,blink:ri(240)});
 const P=[0,1].map(i=>({i,fr:[],born:[],x:JX[i]+JW/2,cur:ri(3),next:ri(3),cd:30,over:0,sc:0,q:[],qt:0,drops:0,tx:null,wait:0,vk:{},flash:0}));
 // where a fruit dropped at x would come to rest first (used by the guide line and the CPU)
 const land=(p,x,r)=>{let y=JY+JH-r,hit=null;for(const o of p.fr){const dx=Math.abs(o.x-x),rr=o.r+r;if(dx<rr){const yy=o.y-Math.sqrt(rr*rr-dx*dx);if(yy<y){y=yy;hit=o;}}}return{y,hit};};
 const merge=(p,a,b)=>{a.dead=b.dead=1;const k=a.k+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2,col=FR[a.k][1];p.sc+=PTS[a.k];
  if(k<FR.length){p.born.push(mk(k,x,y,1));top=Math.max(top,k);fx.pop(x,y-FR[k][2]*.6,'+'+PTS[a.k],k>=7?'#ffcf3f':'#ffffff');if(k===10)fx.pop(x,y-30,'WATERMELON!','#3dff8b');}
  else{p.sc+=100;fx.pop(x,y-10,'MELON BURST +100','#ffcf3f');fx.flash('#ffffff',6);}
  fx.ring(x,y,X.lt(col,1.3),FR[Math.min(k,10)][2]+8,16);if(lo())fx.spark(x,y,X.lt(col,1.4),4+k,1.2+k*.18);if(hi()&&k>=4)fx.debris(x,y,col,k,1.2);
  if(k>=5)A.shake=Math.min(6,k-3);S(k>=6?'coin':'blip');
  if(k>=6){const n=Math.min(3,k-5),r=P[1-p.i];for(let j=0;j<n;j++)r.q.push(0);r.qt=Math.max(r.qt,60);}};
 const step=p=>{const L=JX[p.i],RR=L+JW,B=JY+JH;
  for(const o of p.fr){o.age++;const R=FR[o.k][2];if(o.r<R)o.r=Math.min(R,o.r+R*.09);if(o.sq>0)o.sq*=.84;}
  for(let s=0;s<SUB;s++){const f=p.fr;
   for(const o of f){const vx=(o.x-o.px)*.995,vy=(o.y-o.py)*.995;o.px=o.x;o.py=o.y;o.x+=vx;o.y+=vy+G;o.a+=vx/o.r;}
   for(let it=0;it<2;it++){
    for(let i=0;i<f.length;i++){const a=f[i];if(a.dead)continue;for(let j=i+1;j<f.length;j++){const b=f[j];if(b.dead)continue;const dx=b.x-a.x,dy=b.y-a.y,rr=a.r+b.r,d2=dx*dx+dy*dy;if(d2>=rr*rr)continue;
      if(a.k===b.k&&a.age>2&&b.age>2){merge(p,a,b);break;}
      const d=Math.sqrt(d2)||.01,ov=rr-d,ma=a.r*a.r,mb=b.r*b.r,ta=mb/(ma+mb)*.9,tb=ma/(ma+mb)*.9,nx=dx/d,ny=dy/d;a.x-=nx*ov*ta;a.y-=ny*ov*ta;b.x+=nx*ov*tb;b.y+=ny*ov*tb;}}
    for(const o of f){if(o.dead)continue;if(o.x<L+o.r)o.x=L+o.r;if(o.x>RR-o.r)o.x=RR-o.r;if(o.y>B-o.r){const vy=o.y-o.py;o.y=B-o.r;if(vy>.35&&!o.sq)o.sq=Math.min(.8,vy*.5);o.px+=(o.x-o.px)*.15;}}}
   if(p.born.length||f.some(o=>o.dead)){p.fr=f.filter(o=>!o.dead).concat(p.born);p.born=[];}}};
 // CPU: try 15 drop points; prefer landing on (or next to) the same fruit, low and not burying a smaller one
 const think=p=>{const r=FR[p.cur][2],L=JX[p.i],noise=A._e&&A._e.state==='play'?(1-A.ai)*70:20;let best=-1e9,bx=L+JW/2;
  for(let s=0;s<=14;s++){const x=L+r+(JW-2*r)*s/14,{y,hit}=land(p,x,r);let v=y*.25+rnd(noise);
   if(hit&&hit.k===p.cur)v+=60;for(const o of p.fr)if(o.k===p.cur&&Math.hypot(o.x-x,o.y-y)<o.r+r+5)v+=22;
   if(hit&&hit.k<p.cur)v-=7*(p.cur-hit.k);if(y-r<LY+12)v-=200;if(v>best){best=v;bx=x;}}
  p.tx=bx;p.wait=6+ri(Math.round(40*(1.3-A.ai)));};
 const aiKeys=p=>{if(p.cd>0)return{};if(p.tx===null)think(p);if(p.wait>0){p.wait--;}const dx=p.tx-p.x;return Math.abs(dx)>1.6?(dx<0?{l:1}:{r:1}):p.wait>0?{}:{a:1};};
 const drop=p=>{const r=FR[p.cur][2];p.fr.push(mk(p.cur,p.x+rnd(.2)-.1,CY));p.cur=p.next;p.next=tier(p);p.cd=26;p.drops++;p.tx=null;S('blip');void r;};
 const ctl=(p,k,ha)=>{const r=FR[p.cur][2],L=JX[p.i];
  if(p.i===0&&A.mouse.t>0&&!demo())p.x+=(A.mouse.x-p.x)*.5;else p.x+=ax(k)*2.6;
  p.x=cl(p.x,L+r,L+JW-r);if(p.cd>0)p.cd--;else if(ha)drop(p);};
 g.update=()=>{t++;
  if(A.cpu&&!demo())A.bot(aiKeys(P[1]));
  for(const p of P){let k,ha;
   if(demo()){const v=aiKeys(p);k=v;ha=!!v.a&&!p.vk.a;p.vk=v;}else{k=A.in(p.i);ha=A.hit(p.i).a;}
   ctl(p,k,ha);
   if(p.qt>0)p.qt--;else if(p.q.length&&t%7===0){p.q.pop();const o=mk(0,JX[p.i]+6+rnd(JW-12),JY-4);o.py=o.y-1.5;p.fr.push(o);S('blip');}
   step(p);
   const full=p.fr.some(o=>o.age>90&&o.y-o.r<LY&&Math.abs(o.y-o.py)<.4);p.over=full?p.over+1:Math.max(0,p.over-3);if(p.flash>0)p.flash--;}
  g.score=P[0].sc;
  const lost=P.filter(p=>p.over>150);
  if(lost.length&&!g.over){if(demo()){P.forEach(p=>{p.fr=[];p.over=0;});return;}
   g.over=lost.length===2?tu(P[0].sc,P[1].sc).replace('TIME UP','BOTH JARS FULL'):'JAR FULL - '+A.win(1-lost[0].i);S('lose');}};
 g.timeUp=()=>tu(P[0].sc,P[1].sc);

 /* ---- scene ---- */
 const scene=()=>X.cache('melondrop_bg',()=>{const c=A.c;
  X.sky(['#8fd0ff','#c6ecff','#ffe7c4'],170);X.glow(262,40,90,'#fff2b0',.5);X.disc(262,40,15,X.rg(258,36,2,262,40,15,['#fffbe0','#ffe07a']));
  for(const[y,cA,cB,amp,ph]of[[118,'#a6d9a0','#8cc58a',10,0],[136,'#7cbf6e','#5fa35a',8,2],[156,'#5aa752','#468a42',6,4]]){const pts=[[0,H]];for(let x=0;x<=W;x+=10)pts.push([x,y+Math.sin(x*.025+ph)*amp+Math.sin(x*.07+ph)*amp*.4]);pts.push([W,H]);X.poly(pts,X.lg(0,y-amp,0,y+40,[cA,cB]));}
  for(const[x,y,s]of[[8,140,1],[150,128,.8],[300,142,1.1],[96,150,.9],[226,152,.95]]){c.fillStyle='#6b4a2c';c.fillRect(x-2*s,y,4*s,22*s);
   for(const[dx,dy,r]of[[0,-6,14],[-10,0,10],[10,-1,11],[-4,-14,10],[6,-12,9]])X.disc(x+dx*s,y+dy*s,r*s,X.rg(x+dx*s-3,y+dy*s-4,1,x+dx*s,y+dy*s,r*s,['#5cc45a','#2f8a3a']));
   for(let i=0;i<6;i++)X.disc(x+((i*13)%26-13)*s,y+((i*7)%20-16)*s,1.6*s,['#ff4b5c','#ffa424','#ffd23f'][i%3]);}
  X.vg(0,200,W,40,['#b27a48','#7a4a26']);c.fillStyle='rgba(255,230,190,.35)';c.fillRect(0,200,W,1.5);for(let y=208;y<240;y+=9){c.fillStyle='rgba(60,30,10,.25)';c.fillRect(0,y,W,1);}
  for(let i=0;i<14;i++){c.fillStyle='rgba(60,30,10,.18)';c.fillRect((i*53)%W,203+(i*11)%34,18+(i*7)%20,1);}
  X.rr(136,21,48,206,8,'rgba(255,248,236,.78)');X.rrs(136.5,21.5,47,205,8,'rgba(150,100,60,.35)',1);
  for(const i of[0,1]){const x=JX[i];X.shadow(x+JW/2,JY+JH+8,JW*.62,5,.28);
   X.rr(x-4,JY-4,JW+8,JH+8,6,X.lg(x,0,x+JW,0,['rgba(255,255,255,.42)','rgba(235,250,255,.2)','rgba(255,255,255,.36)']));
   c.fillStyle=X.lg(0,JY,0,JY+JH,['rgba(255,255,255,.05)',X.rgba(PC[i],.1)]);c.fillRect(x,JY,JW,JH);
   for(let yy=JY+30;yy<JY+JH;yy+=28){c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x+2,yy,JW-4,1);}}
  X.vignette(.22);});
 g.draw=()=>{const c=A.c;scene();
  for(const p of P){const x0=JX[p.i],r=FR[p.cur][2];
   // guide from the held fruit to where it will land
   if(p.cd===0){const {y}=land(p,p.x,r);c.fillStyle=X.rgba(PC[p.i],.55);for(let yy=CY+r+3;yy<y;yy+=7)c.fillRect(p.x-.6,yy,1.2,3.5);X.ell(p.x,y+r-1,r*.7,1.6,X.rgba(PC[p.i],.35));}
   for(const o of p.fr)fruit(o.x,o.y,o.k,o.r,o.a,o.sq,{face:1,blink:(t+o.blink)%240<7,mood:p.over>30});
   // danger line, flashing as the jar overflows
   const d=p.over>0,ph=A.t%12<6;c.fillStyle=d?(ph?'#ff3050':'rgba(255,60,80,.55)'):'rgba(220,80,70,.4)';for(let xx=x0;xx<x0+JW;xx+=9)c.fillRect(xx+1,LY,5,1.3);
   if(d){const f=Math.min(1,p.over/150);if(lo())X.glow(x0+JW/2,LY,60,'#ff3050',.3*f);c.strokeStyle='#ff3050';c.lineWidth=2;c.beginPath();c.arc(x0+JW/2,LY-12,7,-Math.PI/2,-Math.PI/2+TAU*f);c.stroke();X.ot('!',x0+JW/2,LY-15,'#ffffff',1,'c');}
   // front glass, rim and base
   c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x0+5,JY+16,2.5,JH-40);c.fillStyle='rgba(255,255,255,.22)';c.fillRect(x0+11,JY+24,1.2,JH-70);c.fillRect(x0+JW-8,JY+40,1.5,JH-80);
   X.rr(x0-5,JY-6,JW+10,5,2.5,X.lg(0,JY-6,0,JY-1,['#ffffff','#bfe0ea']));X.block(x0-7,JY+JH+1,JW+14,7,p.i?'#c23a78':'#1f9c8e',2);
   // the dropper: a little claw in the player's colour holding the next fruit
   const bob=Math.sin(A.t*.12+p.i)*1;X.rr(p.x-9,CY-r-7+bob,18,4,2,PC[p.i]);c.fillStyle=X.lt(PC[p.i],.6);c.fillRect(p.x-.8,CY-r-11+bob,1.6,4);
   if(p.cd<18)fruit(p.x,CY+bob,p.cur,r*(p.cd>0?1-p.cd/18*.5:1),0,0,{face:1});
   // cherries on the way from the rival
   if(p.q.length){const xx=x0+JW-10;for(let j=0;j<p.q.length;j++)fruit(xx-j*11,JY+6,0,4.2,0,0,null);if(A.t%16<10)X.ot('INCOMING',x0+JW/2,JY+16,'#ff4f6d',1,'c');}}
  // middle column: next fruits and the merge chain
  X.ot('NEXT',160,26,'#7a4a26',1,'c');for(const p of P){const nx=p.i?172:148;X.disc(nx,44,10,'rgba(255,255,255,.85)');c.strokeStyle=PC[p.i];c.lineWidth=1.5;c.beginPath();c.arc(nx,44,10,0,TAU);c.stroke();fruit(nx,44,p.next,Math.min(7,FR[p.next][2]),0,0,null);}
  for(let k=0;k<FR.length;k++){const y=70+k*14.2,on=k<=top,rr=3.2+k*.42;c.globalAlpha=on?1:.32;fruit(160,y,k,rr,0,0,k===top&&lo()?{glow:.35+.15*Math.sin(A.t*.1)}:null);c.globalAlpha=1;}
  c.fillStyle='rgba(122,74,38,.5)';c.fillRect(150,222,20,1);
  fx.draw();X.bar();A.hud2(P[0].sc,P[1].sc);};
 return g;}});
})();
