/* BOARD PACK 2: sixteen classic board games, each with a searching CPU (alpha-beta / expectimax / MCTS) */
(function(){'use strict';const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const now=()=>(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1),t=a[i];a[i]=a[j];a[j]=t;}return a;};
const hsh=n=>{n=Math.imul(n^(n>>>15),0x2c1b3c6d);n=Math.imul(n^(n>>>12),0x297a2d39);n^=n>>>15;return(n>>>0)/4294967296;};
/* ---- turn / control plumbing shared by every game ---- */
const LVL=t=>A._b2lv?A._b2lv[t]:A.lvl;                            // per-side level (test hook)
const BUD=t=>A.silent&&!A._b2ms?3:A._b2ms||[140,350,700][LVL(t)]||350;   // CPU think budget (ms)
const cfg=(t,tab)=>Object.assign({ms:BUD(t)},tab[LVL(t)]||tab[1]);
const touch=g=>{if(!g._t){const k=A.in(0),M=A.mouse;if(k.l||k.r||k.u||k.d||k.a||k.b||M.dx||M.dy||M.down)g._t=1;}};
const demo=g=>(A.silent&&A.cpu&&!g._t)||!!A._b2sp;                             // attract mode: CPU plays both sides
const isCPU=(g,s)=>demo(g)||(A.cpu&&s===g.cs);
const owner=(g,s)=>A.two?(s===g.p1s?0:1):0;
const nm=(g,s)=>A.two?'P'+(owner(g,s)+1):s===g.cs?'CPU':'P1';
const winT=(g,s)=>A.two?'PLAYER '+(owner(g,s)+1)+' WINS!':s===g.cs?'CPU WINS!':'PLAYER 1 WINS!';
const tupT=(g,s)=>s<0?'TIME UP - DRAW':'TIME UP - '+winT(g,s);
const inp=(g,s)=>{const h=A.hit(owner(g,s)),M=A.mouse,ca=!!(M.down&&A.hit(0).a),cb=!!(M.bdown&&A.hit(0).b);return{l:h.l,r:h.r,u:h.u,d:h.d,a:h.a||ca,b:h.b||cb,mv:!!(M.dx||M.dy)||ca||cb,x:M.x,y:M.y};};
const cpuGo=g=>{if(++g.th<(A._b2sp?4:demo(g)?12:26))return false;g.th=0;return true;};
const base=o=>Object.assign({over:null,score:0,turn:0,cs:1,p1s:0,th:0,msg:'',_t:0},o||{});
const moveCur=(I,c,nx,ny)=>{const ox=c.x,oy=c.y;if(I.l)c.x=Math.max(0,c.x-1);if(I.r)c.x=Math.min(nx-1,c.x+1);if(I.u)c.y=Math.max(0,c.y-1);if(I.d)c.y=Math.min(ny-1,c.y+1);if(c.x!==ox||c.y!==oy)S('blip');};
const mouseGrid=(I,c,nx,ny,ox,oy,cs,ch)=>{if(!I.mv)return;const X=Math.floor((I.x-ox)/cs),Y=Math.floor((I.y-oy)/(ch||cs));if(X>=0&&Y>=0&&X<nx&&Y<ny){c.x=X;c.y=Y;}};
/* point-set navigation for non-square boards (morris, star, hex, cross) */
const navPt=(P,cur,dx,dy,ok)=>{const p=P[cur];let best=cur,bs=1e9;for(let i=0;i<P.length;i++){if(i===cur||(ok&&!ok(i)))continue;const vx=P[i][0]-p[0],vy=P[i][1]-p[1],d=Math.hypot(vx,vy)||1,dot=(vx*dx+vy*dy)/d;if(dot<.45)continue;const s=d*(1+(1-dot)*3);if(s<bs){bs=s;best=i;}}return best;};
const nearPt=(P,x,y,rad)=>{let b=-1,bd=rad*rad;for(let i=0;i<P.length;i++){const d=(P[i][0]-x)**2+(P[i][1]-y)**2;if(d<bd){bd=d;b=i;}}return b;};
const ptCur=(I,P,cur,ok)=>{let c=cur;if(I.l)c=navPt(P,c,-1,0,ok);if(I.r)c=navPt(P,c,1,0,ok);if(I.u)c=navPt(P,c,0,-1,ok);if(I.d)c=navPt(P,c,0,1,ok);if(c!==cur)S('blip');if(I.mv){const m=nearPt(P,I.x,I.y,16);if(m>=0)c=m;}return c;};
/* ---- generic iterative-deepening alpha-beta (negamax). G: moves, play, ev, over, stuck, order ---- */
const WIN=1e6;
function search(G,s0,o){const t0=now(),ms=o.ms||BUD(0),maxD=o.maxD||40,nz=o.noise||0;let nodes=0,stop=false;
 const neg=(s,d,a,b,ply)=>{if((++nodes&15)===0&&now()-t0>ms)stop=true;if(stop)return 0;const e=G.over(s,ply);if(e!==null)return e;if(d<=0)return G.ev(s)+(nz?(Math.random()-.5)*nz:0);
  const mv=G.moves(s,ply);if(!mv.length)return G.stuck(s,ply);if(G.order)G.order(s,mv);let best=-1e9;
  for(let i=0;i<mv.length;i++){const v=-neg(G.play(s,mv[i]),d-1,-b,-a,ply+1);if(stop)return 0;if(v>best){best=v;if(v>a){a=v;if(a>=b)break;}}}return best;};
 const root=G.moves(s0,0);if(!root.length)return null;if(root.length===1)return root[0];shuf(root);if(G.order)G.order(s0,root);let best=root[0],dd=0;
 for(let d=1;d<=maxD;d++){dd=d;let a=-1e9,cb=null,cv=-1e9;for(let i=0;i<root.length;i++){const v=-neg(G.play(s0,root[i]),d-1,-1e9,-a,1);if(stop)break;if(v>cv){cv=v;cb=root[i];}if(v>a)a=v;}
  if(cb)best=cb;if(stop)break;const k=root.indexOf(best);root.splice(k,1);root.unshift(best);if(cv>WIN/2||cv<-WIN/2)break;if(now()-t0>ms*.55)break;}
 A._b2last={d:dd,nodes,ms:Math.round(now()-t0)};return best;}
/* ---- materials: polished stone, glass and turned wood ---- */
const rg=(x0,y0,r0,x1,y1,r1,st,fb)=>{const c=A.c,g=c.createRadialGradient?c.createRadialGradient(x0,y0,r0,x1,y1,r1):null;if(!g||!g.addColorStop)return fb;for(const s of st)g.addColorStop(s[0],s[1]);return g;};
const lg=(x0,y0,x1,y1,st,fb)=>{const c=A.c,g=c.createLinearGradient?c.createLinearGradient(x0,y0,x1,y1):null;if(!g||!g.addColorStop)return fb;for(const s of st)g.addColorStop(s[0],s[1]);return g;};
const disc=(x,y,r,f)=>{const c=A.c;c.fillStyle=f;c.beginPath();c.arc(x,y,Math.max(.3,r),0,6.2832);c.fill();};
const oval=(x,y,rx,ry,a,f)=>{const c=A.c;c.fillStyle=f;c.beginPath();if(c.ellipse)c.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),a,0,6.2832);else c.arc(x,y,Math.max(.2,rx),0,6.2832);c.fill();};
const MAT={ivory:['#fbf6ea','#e9dcc0','#a8916a','stone'],ebony:['#8c8a98','#2e2c34','#060608','stone'],slate:['#7a7f8a','#26282e','#050507','stone'],shell:['#ffffff','#ece8de','#a8a296','stone'],
 ruby:['#ffb4c0','#d0203e','#4a0010','glass'],sapph:['#c0d4ff','#2a5ae0','#061656','glass'],emer:['#b0ffd0','#18a860','#023a18','glass'],amber:['#fff0b0','#f0a020','#6a3000','glass'],smoke:['#e0e0f0','#50506a','#0a0a14','glass'],pearl:['#ffffff','#e6e2f0','#9a94b0','glass'],
 maple:['#fff0cc','#dcb070','#8a5a24','wood'],walnut:['#c08a5a','#6a3a1c','#200c02','wood'],cherry:['#f0a080','#a8402a','#3a0e04','wood'],jade:['#d8ffe8','#40b88a','#0a4a30','stone'],coral:['#ffd0b8','#f0704a','#6a1a08','stone']};
const piece=(x,y,r,m,o)=>{const t=MAT[m]||MAT.ivory,c=A.c;o=o||{};if(!o.flat)oval(x+r*.16,y+r*.3,r*1.04,r*.92,0,'rgba(0,0,0,.38)');
 disc(x,y,r,rg(x-r*.38,y-r*.45,r*.08,x,y,r*1.04,[[0,t[0]],[.5,t[1]],[1,t[2]]],t[1]));
 if(t[3]==='glass'){disc(x+r*.22,y+r*.3,r*.5,rg(x+r*.25,y+r*.35,0,x+r*.25,y+r*.35,r*.55,[[0,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']],'rgba(255,255,255,.1)'));oval(x-r*.34,y-r*.4,r*.36,r*.2,-.7,'rgba(255,255,255,.85)');}
 else if(t[3]==='wood'){c.lineWidth=.6;c.strokeStyle='rgba(40,16,0,.28)';for(const k of[.74,.46]){c.beginPath();c.arc(x,y,r*k,0,6.2832);c.stroke();}oval(x-r*.3,y-r*.42,r*.42,r*.18,-.5,'rgba(255,255,255,.28)');}
 else{oval(x-r*.32,y-r*.4,r*.34,r*.2,-.6,'rgba(255,255,255,.55)');}
 c.lineWidth=.7;c.strokeStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(x,y,Math.max(.3,r),0,6.2832);c.stroke();
 if(o.king){c.strokeStyle=o.kc||'#ffd850';c.lineWidth=1.2;c.beginPath();c.arc(x,y,r*.55,0,6.2832);c.stroke();disc(x,y,r*.22,o.kc||'#ffd850');}
 if(o.sel){c.strokeStyle=o.sel===true?'#ffe060':o.sel;c.lineWidth=1.5;c.beginPath();c.arc(x,y,r+2,0,6.2832);c.stroke();}};
const WOOD={oak:['#d4a464','#b07c40','#6a4418'],maple:['#ecd09a','#d6ac70','#8a6430'],walnut:['#86542e','#603618','#2a1608'],kaya:['#f0cc80','#dcb060','#94682a'],cherry:['#b8683e','#8e4626','#4a2010'],ebon:['#4a3a36','#2e2424','#100c0c'],teak:['#a87040','#84522a','#3a2008']};
const wood=(x,y,w,h,k,seed)=>{const c=A.c,t=WOOD[k]||WOOD.oak;seed=seed||7;c.fillStyle=lg(x,y,x+w*.35,y+h,[[0,t[0]],[.55,t[1]],[1,t[0]]],t[1]);c.fillRect(x,y,w,h);
 c.save();c.beginPath();c.rect(x,y,w,h);if(c.clip)c.clip();c.lineWidth=.7;const n=Math.max(5,h/5|0);
 for(let i=0;i<n;i++){const yy=y+(i+hsh(seed*97+i))*h/n,a=.6+hsh(seed+i*13)*2.4,f=.015+hsh(i*7+seed)*.035,ph=hsh(i+seed*3)*6;c.strokeStyle=i%3?'rgba(50,22,4,.13)':'rgba(255,240,210,.10)';c.beginPath();c.moveTo(x,yy+Math.sin(ph)*a);for(let xx=8;xx<=w+8;xx+=8)c.lineTo(x+xx,yy+Math.sin(xx*f+ph)*a);c.stroke();}
 c.restore();c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x,y,w,1);c.fillRect(x,y,1,h);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x,y+h-1,w,1);c.fillRect(x+w-1,y,1,h);};
const frame=(x,y,w,h,k,b)=>{b=b||6;const c=A.c;c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x-b+3,y-b+4,w+b*2,h+b*2);wood(x-b,y-b,w+b*2,h+b*2,k||'walnut',3);};
const table=(col)=>{A.cls(col||'#1a120c');const c=A.c;c.fillStyle=rg(120,110,20,120,120,260,[[0,'rgba(255,220,160,.10)'],[1,'rgba(0,0,0,.5)']],'rgba(0,0,0,0)');c.fillRect(0,0,W,H);};
const plate=(x,y,w,h,on,col)=>{const c=A.c;c.fillStyle=on?'rgba(20,14,30,.82)':'rgba(10,8,14,.6)';c.fillRect(x,y,w,h);A.box(x,y,w,h,on?(col||K.y):'rgba(255,255,255,.14)');};
/* right-hand side panel: two player cards (top = side 1), status and hint lines */
const panel=(g,o)=>{const x=o.x||232,w=W-4-x;[1,0].forEach((s,k)=>{const y=(o.y||8)+k*50,on=!g.over&&g.turn===s&&!o.noTurn;plate(x,y,w,44,on,o.col?o.col[s]:K.y);piece(x+12,y+13,7,o.mat[s]);
  T(nm(g,s),x+24,y+7,on?K.w:K.gr,2);if(o.stat)T(o.stat[s],x+5,y+26,K.w,1);if(o.stat2)T(o.stat2[s],x+5,y+35,K.gr,1);if(on&&isCPU(g,s)&&!demo(g))T('THINKING'+'...'.slice(0,(A.t>>4)%4),x+w-4,y+8,K.c,1,'r');});
 let y=(o.y||8)+104;(o.lines||[]).forEach(l=>{if(!l)return;const s=String(l[0]);T(s,x+w/2,y,l[1]||K.w,1,'c');y+=10;});};
const statusLine=(g,s,txt)=>isCPU(g,s)?nm(g,s)+' TO MOVE':txt;
const fxHit=(x,y,col)=>{A.burst(x,y,col||K.y,14,2);A.shake=Math.max(A.shake,4);};
const ring2=(x,y,r,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1.5;c.beginPath();c.arc(x,y,Math.max(.5,r),0,6.2832);c.stroke();};
const dot=(x,y,r,col)=>disc(x,y,r,col||'rgba(80,255,140,.75)');
const pulse=()=>.55+.45*Math.sin(A.t*.15);

/* ================= NINE MEN'S MORRIS ================= */
const MP=[[0,0],[3,0],[6,0],[1,1],[3,1],[5,1],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[1,5],[3,5],[5,5],[0,6],[3,6],[6,6]];
const MILLS=[[0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17],[18,19,20],[21,22,23],[0,9,21],[3,10,18],[6,11,15],[1,4,7],[16,19,22],[8,12,17],[5,13,20],[2,14,23]];
const MADJ=MP.map(()=>[]),MOF=MP.map(()=>[]);MILLS.forEach(m=>{m.forEach(i=>MOF[i].push(m));MADJ[m[0]].push(m[1]);MADJ[m[1]].push(m[0],m[2]);MADJ[m[2]].push(m[1]);});
const mMill=(b,i,v)=>MOF[i].some(m=>b[m[0]]===v&&b[m[1]]===v&&b[m[2]]===v);
const mMob=(b,v)=>{let k=0;for(let i=0;i<24;i++)if(b[i]===v)for(const j of MADJ[i])if(!b[j])k++;return k;};
const MG={
 moves(s){const out=[],v=s.t+1,ov=2-s.t,b=s.b,bs=[];if(s.h[s.t]>0){for(let i=0;i<24;i++)if(!b[i])bs.push([-1,i]);}else{const fly=s.n[s.t]===3;for(let i=0;i<24;i++)if(b[i]===v){if(fly){for(let j=0;j<24;j++)if(!b[j])bs.push([i,j]);}else for(const j of MADJ[i])if(!b[j])bs.push([i,j]);}}
  for(const[f,t]of bs){const b2=b.slice();if(f>=0)b2[f]=0;b2[t]=v;if(mMill(b2,t,v)){const rm=[];for(let j=0;j<24;j++)if(b2[j]===ov&&!mMill(b2,j,ov))rm.push(j);if(!rm.length)for(let j=0;j<24;j++)if(b2[j]===ov)rm.push(j);if(rm.length){for(const x of rm)out.push({f,t,x});continue;}}out.push({f,t,x:-1});}return out;},
 play(s,m){const b=s.b.slice(),h=s.h.slice(),n=s.n.slice(),t=s.t;if(m.f>=0)b[m.f]=0;else{h[t]--;n[t]++;}b[m.t]=t+1;if(m.x>=0){b[m.x]=0;n[1-t]--;}return{b,h,n,t:1-t,nc:m.x>=0||m.f<0?0:s.nc+1};},
 over(s,ply){if(s.h[s.t]+s.n[s.t]<3)return -WIN+ply;if(s.nc>=100)return 0;return null;},
 stuck(s,ply){return -WIN+ply;},
 ev(s){const me=s.t,op=1-me,v=me+1,ov=op+1,b=s.b;let e=((s.h[me]+s.n[me])-(s.h[op]+s.n[op]))*120;
  for(const m of MILLS){let a=0,o=0;for(const i of m){if(b[i]===v)a++;else if(b[i]===ov)o++;}if(a===2&&!o)e+=14;else if(o===2&&!a)e-=18;else if(a===3)e+=7;else if(o===3)e-=7;else if(a===2&&o===1)e-=3;}
  const mb=mMob(b,v),mo=mMob(b,ov);e+=(mb-mo)*(s.h[me]||s.h[op]?1.5:4);if(!s.h[op]&&s.n[op]>3&&mo===0)e+=600;if(!s.h[me]&&s.n[me]>3&&mb===0)e-=600;return e;},
 order(s,mv){mv.sort((a,b)=>(b.x>=0)-(a.x>=0));}};
A.add({id:'morris',name:"NINE MEN'S MORRIS",cat:'BOARD',vs:1,warm:30,time:480,how:'PLACE 9 EACH, THEN SLIDE. 3 IN A LINE (A MILL) TAKES A PIECE. LEAVE THEM WITH 2.',make(){
 const g=base();g.st={b:Array(24).fill(0),h:[9,9],n:[0,0],t:0,nc:0};g.c=16;g.sel=-1;g.pend=null;g.legal=null;g.last=null;g.flash=0;
 const OX=24,OY=24,SP=30,PTS=MP.map(p=>[OX+p[0]*SP,OY+p[1]*SP]);
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=MG.moves(s);const o=MG.over(s,0);if(o!==null){g.over=o===0?'DRAW BY 50-MOVE RULE':winT(g,1-s.t);g.msg=o===0?'NO MILL IN 50 MOVES':'DOWN TO TWO PIECES';}else if(!g.legal.length){g.over=winT(g,1-s.t);g.msg='NO LEGAL MOVES';}};
 const doMove=m=>{const s=g.st;g.st=MG.play(s,m);g.last=m;g.sel=-1;g.pend=null;S(m.x>=0?'boom':'hit');const P=PTS[m.t];if(m.x>=0){fxHit(PTS[m.x][0],PTS[m.x][1],K.r);g.flash=30;g.msg='MILL!';}else{A.burst(P[0],P[1],'#ffe8b0',5,1);g.msg='';}finish();};
 finish();
 g.timeUp=()=>{const s=g.st,a=s.h[0]+s.n[0],b=s.h[1]+s.n[1];return tupT(g,a===b?-1:a>b?0:1);};
 g.update=()=>{touch(g);if(g.over)return;if(g.flash)g.flash--;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const L=cfg(t,[{maxD:2,noise:120},{maxD:5,noise:8},{maxD:14}]);const m=search(MG,s,L);if(m)doMove(m);}return;}
  const I=inp(g,t);g.c=ptCur(I,PTS,g.c);if(I.b&&(g.sel>=0||g.pend)){g.sel=-1;g.pend=null;S('blip');}
  if(!I.a)return;const c=g.c,lg_=g.legal;
  if(g.pend){const m=lg_.find(m=>m.f===g.pend.f&&m.t===g.pend.t&&m.x===c);if(m)doMove(m);else S('lose');return;}
  const pick=f=>{const ms=lg_.filter(m=>m.f===f&&m.t===c);if(!ms.length){S('lose');return;}if(ms[0].x>=0){g.pend={f,t:c};g.sel=-1;S('score');A.burst(PTS[c][0],PTS[c][1],K.y,10,1.5);}else doMove(ms[0]);};
  if(s.h[t]>0)pick(-1);else if(s.b[c]===t+1){if(lg_.some(m=>m.f===c)){g.sel=c;S('blip');}else S('lose');}else if(g.sel>=0)pick(g.sel);else S('lose');};
 g.draw=()=>{table('#1b130d');frame(8,8,208,208,'walnut',8);wood(8,8,208,208,'maple',11);const c=A.c;const s=g.st,t=s.t;
  const b=s.b.slice();if(g.pend){if(g.pend.f>=0)b[g.pend.f]=0;b[g.pend.t]=t+1;}
  c.lineCap='round';for(const w of[[3,'rgba(60,30,8,.55)'],[1,'rgba(255,240,200,.35)']]){c.lineWidth=w[0];c.strokeStyle=w[1];for(const m of MILLS){const a=PTS[m[0]],z=PTS[m[2]];c.beginPath();c.moveTo(a[0]+(w[0]<2?.5:0),a[1]+(w[0]<2?.5:0));c.lineTo(z[0]+(w[0]<2?.5:0),z[1]+(w[0]<2?.5:0));c.stroke();}}
  if(g.flash&&g.last){const m=MOF[g.last.t].find(m=>m.every(i=>s.b[i]===2-s.t));if(m){c.globalAlpha=g.flash/30;c.lineWidth=5;c.strokeStyle=K.y;c.beginPath();c.moveTo(PTS[m[0]][0],PTS[m[0]][1]);c.lineTo(PTS[m[2]][0],PTS[m[2]][1]);c.stroke();c.globalAlpha=1;}}
  PTS.forEach((p,i)=>{disc(p[0],p[1],4.2,'#5a3a1a');disc(p[0],p[1],2.6,rg(p[0]-1,p[1]-1,0,p[0],p[1],3,[[0,'#fff0b0'],[1,'#a07020']],'#c89040'));});
  const hum=!isCPU(g,t)&&!g.over,lg_=g.legal||[];
  if(hum){if(g.pend)lg_.filter(m=>m.f===g.pend.f&&m.t===g.pend.t).forEach(m=>ring2(PTS[m.x][0],PTS[m.x][1],12,'rgba(255,80,80,'+pulse()+')',2));
   else if(s.h[t]>0)lg_.forEach(m=>{if(m.f<0)dot(PTS[m.t][0],PTS[m.t][1],2.2,'rgba(80,255,140,.5)');});else if(g.sel>=0)lg_.forEach(m=>{if(m.f===g.sel)dot(PTS[m.t][0],PTS[m.t][1],3.2);});}
  if(g.last&&g.last.f>=0){const p=PTS[g.last.f];ring2(p[0],p[1],6,'rgba(255,220,120,.4)',1);}
  b.forEach((v,i)=>{if(v)piece(PTS[i][0],PTS[i][1],10,v===1?'ivory':'ebony',{sel:i===g.sel||(g.pend&&i===g.pend.t)});});
  if(g.last&&!g.pend){const p=PTS[g.last.t];if(b[g.last.t])ring2(p[0],p[1],12,'rgba(255,200,80,.55)',1);}
  if(hum){const p=PTS[g.c];ring2(p[0],p[1],13,t?K.p:K.c,2);}
  const phase=v=>s.h[v]>0?'PLACE':s.n[v]===3?'FLY!':'SLIDE';
  panel(g,{mat:['ivory','ebony'],stat:[0,1].map(v=>'IN HAND '+s.h[v]),stat2:[0,1].map(v=>'ON BOARD '+s.n[v]+' '+phase(v)),
   lines:[[g.pend?'MILL! PICK A PIECE':isCPU(g,t)?'':s.h[t]>0?'PLACE A PIECE':g.sel>=0?'PICK A SPOT':'PICK A PIECE',g.pend?K.r:K.y],g.over?[g.msg,K.c]:null,[g.pend||g.sel>=0?'B CANCELS':'',K.gr]]});
  for(let v=0;v<2;v++)for(let k=0;k<s.h[v];k++)piece(237+k*8.6,v?200:214,3.6,v?'ebony':'ivory',{flat:1});};
 return g;}});

/* ================= STAR CHECKERS (two-player Chinese checkers) ================= */
const SC=[],SCI=new Int16Array(17*17).fill(-1);for(let r=-8;r<=8;r++)for(let q=-8;q<=8;q++){const s=-q-r;if(Math.abs(s)>8)continue;if((q>=-4&&r>=-4&&s>=-4)||(q<=4&&r<=4&&s<=4)){SCI[(q+8)*17+r+8]=SC.length;SC.push([q,r]);}}
const SDIR=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];const scAt=(q,r)=>q<-8||q>8||r<-8||r>8?-1:SCI[(q+8)*17+r+8];
const SNB=SC.map(([q,r])=>SDIR.map(d=>scAt(q+d[0],r+d[1])));const SJP=SC.map(([q,r])=>SDIR.map(d=>scAt(q+2*d[0],r+2*d[1])));
const inGoal=(i,t)=>t===0?SC[i][1]<=-5:SC[i][1]>=5;const inHome=(i,t)=>inGoal(i,1-t);
const GOAL=[SC.map((c,i)=>i).filter(i=>inGoal(i,0)),SC.map((c,i)=>i).filter(i=>inGoal(i,1))];
const scDist=(i,t)=>t===0?SC[i][1]+8:8-SC[i][1];
const scReach=(b,f)=>{const out=[],seen=new Set([f]),par={};for(let k=0;k<6;k++){const n=SNB[f][k];if(n>=0&&!b[n]){out.push(n);par[n]=f;seen.add(n);}}
 const st=[f];while(st.length){const c=st.pop();for(let k=0;k<6;k++){const m=SNB[c][k],j=SJP[c][k];if(m>=0&&j>=0&&b[m]&&!b[j]&&!seen.has(j)){seen.add(j);par[j]=c;out.push(j);st.push(j);}}}return{out,par};};
const SG={
 moves(s){const out=[],v=s.t+1,b=s.b;for(let i=0;i<SC.length;i++)if(b[i]===v){const g_=inGoal(i,s.t),{out:ds}=scReach(b,i);for(const j of ds){if(g_&&!inGoal(j,s.t))continue;out.push({f:i,t:j,g:scDist(i,s.t)-scDist(j,s.t)});}}return out;},
 play(s,m){const b=s.b.slice();b[m.t]=b[m.f];b[m.f]=0;return{b,t:1-s.t};},
 won(b,t){let mine=0;for(const i of GOAL[t]){if(!b[i])return false;if(b[i]===t+1)mine++;}return mine>0;},
 over(s,ply){if(SG.won(s.b,1-s.t))return -WIN+ply;return null;},
 stuck(s,ply){return -WIN+ply;},
 side(b,t){let sum=0,mx=0,ig=0;for(let i=0;i<SC.length;i++)if(b[i]===t+1){const d=scDist(i,t),[q,r]=SC[i];sum+=d;if(d>mx)mx=d;if(inGoal(i,t))ig++;else sum+=Math.abs(2*q+r)*.18;}return sum+mx*.6-ig*1.5+(ig<10?GOAL[t].filter(i=>!b[i]).length*0:0);},
 ev(s){return SG.side(s.b,1-s.t)-SG.side(s.b,s.t);},
 order(s,mv){mv.sort((a,b)=>b.g-a.g);}};
A.add({id:'starcheckers',name:'STAR CHECKERS',cat:'BOARD',vs:1,warm:30,time:600,how:'STEP OR CHAIN HOPS OVER ANY MARBLE. FILL THE FAR POINT OF THE STAR FIRST.',make(){
 const g=base(),b=Array(SC.length).fill(0);SC.forEach((c,i)=>{if(c[1]>=5)b[i]=1;if(c[1]<=-5)b[i]=2;});g.st={b,t:0};g.sel=-1;g.legal=[];g.anim=null;g.last=null;
 const OX=116,OY=121,DX=14,DY=12.1,PT=SC.map(([q,r])=>[OX+(q+r/2)*DX,OY+r*DY]);g.c=SC.findIndex(c=>c[0]===-3&&c[1]===6);
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=SG.moves(s);if(SG.won(s.b,1-s.t)){g.over=winT(g,1-s.t);g.msg='STAR POINT FILLED';}else if(!g.legal.length){g.over=winT(g,1-s.t);g.msg='NO MOVES';}};
 const doMove=m=>{const{par}=scReach(g.st.b,m.f),path=[m.t];let k=m.t,guard=0;while(k!==m.f&&guard++<40){k=par[k];path.unshift(k);}g.anim={pts:path.map(i=>PT[i]),k:0,mat:g.st.t?'ruby':'sapph',to:m.t};g.st=SG.play(g.st,m);g.last=m;g.sel=-1;S(path.length>2?'jump':'hit');finish();};
 finish();
 const prog=t=>{let n=0,d=0;for(let i=0;i<SC.length;i++)if(g.st.b[i]===t+1){if(inGoal(i,t))n++;d+=scDist(i,t);}return n*100-d;};
 g.timeUp=()=>{const a=prog(0),b_=prog(1);return tupT(g,a===b_?-1:a>b_?0:1);};
 g.update=()=>{touch(g);if(g.anim){g.anim.k+=demo(g)?.5:.2;if(g.anim.k>=g.anim.pts.length-1){g.anim=null;S('blip');}return;}if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const L=cfg(t,[{maxD:1,noise:5},{maxD:3,noise:.4},{maxD:8}]);const m=search(SG,s,L);if(m)doMove(m);}return;}
  const I=inp(g,t);g.c=ptCur(I,PT,g.c);if(I.b&&g.sel>=0){g.sel=-1;S('blip');}if(!I.a)return;const c=g.c;
  if(s.b[c]===t+1){if(g.legal.some(m=>m.f===c)){g.sel=c;S('blip');}else S('lose');}else if(g.sel>=0){const m=g.legal.find(m=>m.f===g.sel&&m.t===c);if(m)doMove(m);else S('lose');}else S('lose');};
 const tri=(pts,f,st)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=f;c.fill();if(st){c.strokeStyle=st;c.lineWidth=1.2;c.stroke();}};
 const px=(q,r,k)=>[OX+(q+r/2)*DX*k,OY+r*DY*k];
 g.draw=()=>{table('#10141c');const c=A.c,s=g.st,t=s.t;const k1=1.13;
  const T1=[px(-4,-4,k1),px(8,-4,k1),px(-4,8,k1)],T2=[px(4,4,k1),px(4,-8,k1),px(-8,4,k1)];
  for(const tp of[T1,T2])tri(tp.map(p=>[p[0]+3,p[1]+4]),'rgba(0,0,0,.5)');
  const wg=lg(0,20,0,220,[[0,'#e8c890'],[.5,'#c89858'],[1,'#a87438']],'#c89858');tri(T1,wg,'#5a3412');tri(T2,wg,'#5a3412');
  c.save();c.beginPath();c.moveTo(T1[0][0],T1[0][1]);c.lineTo(T1[1][0],T1[1][1]);c.lineTo(T1[2][0],T1[2][1]);c.closePath();c.moveTo(T2[0][0],T2[0][1]);c.lineTo(T2[1][0],T2[1][1]);c.lineTo(T2[2][0],T2[2][1]);c.closePath();if(c.clip)c.clip('nonzero');
  c.lineWidth=.7;for(let i=0;i<34;i++){const yy=20+i*6+hsh(i)*4;c.strokeStyle=i%3?'rgba(60,30,6,.12)':'rgba(255,240,200,.1)';c.beginPath();c.moveTo(0,yy);for(let x=10;x<=240;x+=10)c.lineTo(x,yy+Math.sin(x*.03+i)*1.5);c.stroke();}c.restore();
  const tx=(cs,f)=>{const P=cs.map(q=>px(q[0],q[1],1)),cx=(P[0][0]+P[1][0]+P[2][0])/3,cy=(P[0][1]+P[1][1]+P[2][1])/3;return P.map(p=>[cx+(p[0]-cx)*f,cy+(p[1]-cy)*f]);};
  tri(tx([[-4,5],[-1,5],[-4,8]],1.55),'rgba(40,110,255,.25)');tri(tx([[1,-5],[4,-5],[4,-8]],1.55),'rgba(255,40,70,.25)');
  const hum=!isCPU(g,t)&&!g.over&&!g.anim;const dests=hum&&g.sel>=0?g.legal.filter(m=>m.f===g.sel).map(m=>m.t):[];
  PT.forEach((p,i)=>{disc(p[0],p[1],4.3,rg(p[0]-1,p[1]-1.5,0,p[0],p[1],4.6,[[0,'#2a1606'],[.8,'#5a3414'],[1,'#e8c890']],'#3a2008'));});
  if(g.last&&!g.anim){const a=PT[g.last.f];ring2(a[0],a[1],5,'rgba(255,230,140,.5)',1);}
  s.b.forEach((v,i)=>{if(!v||(g.anim&&i===g.anim.to))return;const p=PT[i];piece(p[0],p[1],5.6,v===1?'sapph':'ruby',{sel:i===g.sel});});
  dests.forEach(i=>dot(PT[i][0],PT[i][1],2.6));
  if(g.anim){const a=g.anim,k=Math.min(a.pts.length-1.001,a.k),i=Math.floor(k),f=k-i,P=a.pts[i],Q=a.pts[i+1],hop=Math.sin(f*Math.PI)*(a.pts.length>2||Math.hypot(Q[0]-P[0],Q[1]-P[1])>18?7:2);piece(P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f-hop,5.6+hop*.12,a.mat);}
  if(hum){const p=PT[g.c];ring2(p[0],p[1],8.5,t?K.p:K.c,1.8);}
  const cnt=v=>GOAL[v].filter(i=>s.b[i]===v+1).length;
  panel(g,{mat:['sapph','ruby'],stat:[0,1].map(v=>'HOME '+cnt(v)+'/10'),stat2:[0,1].map(v=>v?'GOAL: BOTTOM':'GOAL: TOP'),lines:[[isCPU(g,t)?'':g.sel>=0?'PICK A HOLE':'PICK A MARBLE',K.y],['HOP CHAINS ALLOWED',K.gr],g.over?[g.msg,K.c]:[g.sel>=0?'B CANCELS':'',K.gr]]});};
 return g;}});

/* ================= BACKGAMMON ================= */
const BG={};
BG.canOff=(s,t)=>{if(s.bar[t])return false;if(t===0){for(let i=6;i<24;i++)if(s.p[i]>0)return false;}else{for(let i=0;i<18;i++)if(s.p[i]<0)return false;}return true;};
BG.steps=(s,t,d)=>{const out=[],p=s.p,sg=t?-1:1,open=j=>t?p[j]<=1:p[j]>=-1;
 if(s.bar[t]){const j=t?d-1:24-d;if(open(j))out.push({f:-1,to:j,d});return out;}
 const off=BG.canOff(s,t);for(let i=0;i<24;i++){if(p[i]*sg<=0)continue;const j=t?i+d:i-d;
  if(j>=0&&j<24){if(open(j))out.push({f:i,to:j,d});}
  else if(off){if(j===-1||j===24)out.push({f:i,to:-2,d});else{let hi=false;if(t===0){for(let k=i+1;k<6;k++)if(p[k]>0){hi=true;break;}}else{for(let k=18;k<i;k++)if(p[k]<0){hi=true;break;}}if(!hi)out.push({f:i,to:-2,d});}}}return out;};
BG.apply=(s,t,m)=>{const p=s.p.slice(),bar=s.bar.slice(),off=s.off.slice(),sg=t?-1:1;let hit=false;if(m.f<0)bar[t]--;else p[m.f]-=sg;if(m.to===-2)off[t]++;else{if(p[m.to]===-sg){p[m.to]=0;bar[1-t]++;hit=true;}p[m.to]+=sg;}return{p,bar,off,hit};};
BG.key=s=>s.p.join(',')+'|'+s.bar[0]+','+s.bar[1]+'|'+s.off[0]+','+s.off[1];
BG.ends=(s,t,dice)=>{const seen=new Set(),res=[];let mx=0;
 const rec=(st,rem,steps)=>{const k=BG.key(st)+'#'+rem.join('');if(seen.has(k))return;seen.add(k);let any=false;const tr={};
  for(let i=0;i<rem.length;i++){const d=rem[i];if(tr[d])continue;tr[d]=1;for(const m of BG.steps(st,t,d)){any=true;const r2=rem.slice();r2.splice(i,1);rec(BG.apply(st,t,m),r2,steps.concat([m]));}}
  if(!any){if(steps.length>mx)mx=steps.length;res.push({steps,end:st});}};
 rec(s,dice,[]);let out=res.filter(r=>r.steps.length===mx);
 if(mx===1&&dice.length===2&&dice[0]!==dice[1]){const hi=Math.max(dice[0],dice[1]);if(out.some(r=>r.steps[0].d===hi))out=out.filter(r=>r.steps[0].d===hi);}
 const u=new Map();for(const r of out){const k=BG.key(r.end);if(!u.has(k))u.set(k,r);}return{list:[...u.values()],mx};};
BG.maxLen=(st,t,rem,memo)=>{const k=BG.key(st)+'#'+rem.slice().sort().join('');if(memo.has(k))return memo.get(k);let best=0;const tr={};
 for(let i=0;i<rem.length&&best<rem.length;i++){const d=rem[i];if(tr[d])continue;tr[d]=1;for(const m of BG.steps(st,t,d)){const r2=rem.slice();r2.splice(i,1);const v=1+BG.maxLen(BG.apply(st,t,m),t,r2,memo);if(v>best)best=v;if(best===rem.length)break;}}memo.set(k,best);return best;};
BG.pip=(s,t)=>{let n=s.bar[t]*25;for(let i=0;i<24;i++){if(t===0&&s.p[i]>0)n+=s.p[i]*(i+1);if(t===1&&s.p[i]<0)n+=-s.p[i]*(24-i);}return n;};
BG.F=(s,me)=>{if(s.off[me]===15)return 5000;const mine=[],opp=[];for(let j=0;j<24;j++){const v=me?-s.p[23-j]:s.p[j];mine.push(v>0?v:0);opp.push(v<0?-v:0);}
 let pip=s.bar[me]*25,mxM=s.bar[me]?24:-1,mnO=s.bar[1-me]?-1:24;for(let j=0;j<24;j++){pip+=mine[j]*(j+1);if(mine[j]&&j>mxM)mxM=j;if(opp[j]&&j<mnO)mnO=j;}
 let sc=-pip+s.off[me]*.5;if(mxM<mnO)return sc*1.2;
 let run=0,best=0,hp=0;for(let j=0;j<24;j++){if(mine[j]>=2){sc+=j<6?3.2:j===6?2.6:j>=17?2.4:1.2;if(j<6)hp++;run++;if(run>best)best=run;}else run=0;if(mine[j]>3)sc-=(mine[j]-3)*.6;}
 if(best>=3)sc+=(best-2)*best*1.3;
 const ob=s.bar[1-me];for(let j=0;j<24;j++){if(mine[j]!==1)continue;let pr=0;if(ob&&j<=11)pr+=j<6?.4:.12;for(let k=Math.max(0,j-12);k<j;k++)if(opp[k])pr+=j-k<=6?.3:.08;if(pr>.95)pr=.95;sc-=pr*(24-j)*.9+pr*2;}
 sc-=s.bar[me]*4;sc+=ob*hp*1.6;return sc;};
BG.ev=(s,t)=>BG.F(s,t)-BG.F(s,1-t);
BG.cpu=(s,t,dice,lv,ms)=>{const{list}=BG.ends(s,t,dice);if(!list.length)return null;const nz=[26,1.5,0][lv]||0;list.forEach(r=>r.h=BG.ev(r.end,t)+(Math.random()-.5)*nz);list.sort((a,b)=>b.h-a.h);
 const N=[1,4,9][lv]||1;if(N===1||list.length===1||list[0].end.off[t]===15)return list[0];const t0=now();let best=null,bv=-1e9;
 for(let i=0;i<Math.min(N,list.length);i++){if(i>0&&now()-t0>ms)break;let tot=0,wt=0;const e=list[i].end;
  for(let a=1;a<=6;a++)for(let b=a;b<=6;b++){const w=a===b?1:2,o=BG.ends(e,1-t,a===b?[a,a,a,a]:[a,b]).list;let m=-1e9;for(const r of o){const v=BG.ev(r.end,1-t);if(v>m)m=v;}if(!o.length)m=BG.ev(e,1-t);tot-=m*w;wt+=w;}
  const v=tot/wt;if(v>bv){bv=v;best=list[i];}}return best||list[0];};
const die3=(x,y,s,v,dim,col)=>{const c=A.c;c.globalAlpha=dim?.4:1;c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+2,y+3,s,s);c.fillStyle=lg(x,y,x+s,y+s,[[0,'#ffffff'],[1,col||'#e4dcc8']],'#f4eee0');c.fillRect(x,y,s,s);
 c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x,y,s,1);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x,y+s-1,s,1);c.fillRect(x+s-1,y,1,s);
 const q=s/4,P={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]}[v]||[];for(const p of P)disc(x+p[0]*q,y+p[1]*q,s*.09,v===1?'#c01020':'#1a1a1a');c.globalAlpha=1;};
A.add({id:'backgammon',name:'BACKGAMMON',cat:'BOARD',vs:1,warm:30,time:600,how:'A ROLLS. PICK A CHECKER, THEN A POINT. HIT BLOTS, BEAR ALL 15 OFF FIRST. B UNDOES.',make(){
 const g=base(),p=Array(24).fill(0);p[23]=2;p[12]=5;p[7]=3;p[5]=5;p[0]=-2;p[11]=-5;p[16]=-3;p[18]=-5;
 g.s={p,bar:[0,0],off:[0,0]};g.cur=g.s;g.ph='open';g.w=40;g.dice=[1,1];g.od=[1,1];g.rem=[];g.done=[];g.src=null;g.cu={c:12,r:1};g.q=[];g.anim=null;g.hl=[];g.memo=new Map();
  const colX=vc=>vc<6?8+vc*17+8.5:vc===6?118:vc<13?126+(vc-7)*17+8.5:246;
 const pc=i=>i>=12?{vc:i-12<6?i-12:i-12+1,r:0}:{vc:11-i<6?11-i:11-i+1,r:1};
 const logical=(vc,r)=>vc===6?-1:vc===13?-2:r===0?(vc<6?12+vc:12+vc-1):(vc<6?11-vc:11-vc+1);
 const cnt=(s,i,t)=>i===-1?s.bar[t]:i===-2?s.off[t]:Math.abs(s.p[i]);
 const slot=(i,k,t)=>{if(i===-1)return[118,t===0?96-k*13:144+k*13];if(i===-2)return[246,t===0?226-k*4.4:26+k*4.4];const{vc,r}=pc(i),kk=Math.min(k,4);return[colX(vc),r?224-kk*16:28+kk*16];};
 const legalNow=()=>{const t=g.turn,need=BG.maxLen(g.cur,t,g.rem,g.memo);if(!need)return[];const out=[],tr={};for(let i=0;i<g.rem.length;i++){const d=g.rem[i];if(tr[d])continue;tr[d]=1;for(const m of BG.steps(g.cur,t,d)){const r2=g.rem.slice();r2.splice(i,1);if(1+BG.maxLen(BG.apply(g.cur,t,m),t,r2,g.memo)===need)out.push(m);}}
  if(g.mx0===1&&!g.done.length&&g.dice[0]!==g.dice[1]){const hi=Math.max(g.dice[0],g.dice[1]);if(out.some(m=>m.d===hi))return out.filter(m=>m.d===hi);}return out;};
 const step=m=>{const t=g.turn,k0=cnt(g.cur,m.f,t)-1;const a=slot(m.f,Math.max(0,k0),t);const ns=BG.apply(g.cur,t,m);const k1=cnt(ns,m.to,t)-1,b=slot(m.to,Math.max(0,k1),t);
  g.anim={x0:a[0],y0:a[1],x1:b[0],y1:b[1],k:0,to:m.to,t};g.cur=ns;g.done.push(m);g.rem.splice(g.rem.indexOf(m.d),1);g.src=null;S(ns.hit?'boom':'hit');if(ns.hit){fxHit(b[0],b[1],K.r);g.msg='HIT!';}g.hl=legalNow();};
 const newTurn=t=>{g.turn=t;g.ph='roll';g.src=null;g.done=[];g.memo=new Map();g.msg='';};
 const startMoves=()=>{const t=g.turn;g.rem=g.dice[0]===g.dice[1]?[g.dice[0],g.dice[0],g.dice[0],g.dice[0]]:[g.dice[0],g.dice[1]];g.cur=g.s;g.done=[];g.memo=new Map();g.mx0=BG.maxLen(g.cur,t,g.rem,g.memo);
  if(!g.mx0){g.ph='pass';g.w=80;g.msg='NO LEGAL MOVE';S('lose');return;}g.ph='move';g.hl=legalNow();
  if(isCPU(g,t)){const r=BG.cpu(g.s,t,g.rem.slice(),LVL(t),BUD(t));g.q=r?r.steps.slice():[];g.w=18;}else if(g.s.bar[t])g.src=-1;};
 const endTurn=()=>{g.s=g.cur;const t=g.turn;if(g.s.off[t]===15){const o=1-t,lo=g.s;let kind='';if(!lo.off[o]){kind=' GAMMON';let bk=lo.bar[o]>0;for(let i=0;i<24;i++){if(t===0&&i<6&&lo.p[i]<0)bk=true;if(t===1&&i>17&&lo.p[i]>0)bk=true;}if(bk)kind=' BACKGAMMON';}g.over=(kind?kind.trim()+' - ':'')+winT(g,t);g.msg='ALL 15 BORNE OFF';S('win');return;}newTurn(1-t);};
 g.timeUp=()=>{const a=BG.pip(g.cur,0)-(g.cur.off[0]*0),b=BG.pip(g.cur,1);return tupT(g,a===b?-1:a<b?0:1);};
 g.update=()=>{touch(g);if(g.over)return;if(g.anim){g.anim.k+=demo(g)?.34:.12;if(g.anim.k>=1)g.anim=null;return;}const t=g.turn,cpu=isCPU(g,t);
  if(g.ph==='open'){if(--g.w>0){g.od=[1+ri(6),1+ri(6)];return;}if(g.od[0]===g.od[1]){g.w=30;g.msg='TIE - ROLL AGAIN';return;}g.turn=g.od[0]>g.od[1]?0:1;g.dice=g.od.slice();g.msg=nm(g,g.turn)+' GOES FIRST';g.ph='show';g.w=50;return;}
  if(g.ph==='show'){if(--g.w<=0)startMoves();return;}
  if(g.ph==='roll'){if(cpu?cpuGo(g):inp(g,t).a){g.ph='rolling';g.w=16;S('blip');}return;}
  if(g.ph==='rolling'){g.dice=[1+ri(6),1+ri(6)];if(--g.w<=0){S('hit');startMoves();}return;}
  if(g.ph==='pass'){if(--g.w<=0){g.cur=g.s;newTurn(1-t);}return;}
  if(g.ph==='end'){if(--g.w<=0)endTurn();return;}
  if(g.ph!=='move')return;
  if(cpu){if(--g.w>0)return;if(g.q.length){step(g.q.shift());g.w=demo(g)?2:16;}else{g.ph='end';g.w=demo(g)?2:14;}return;}
  if(!g.hl.length){g.ph='end';g.w=16;return;}
  const I=inp(g,t),c=g.cu;const ox=c.c,oy=c.r;if(I.l)c.c=Math.max(0,c.c-1);if(I.r)c.c=Math.min(13,c.c+1);if(I.u)c.r=0;if(I.d)c.r=1;if(c.c!==ox||c.r!==oy)S('blip');
  if(I.mv&&I.y>18&&I.y<236&&I.x<266){c.c=I.x<110?cl(Math.floor((I.x-8)/17),0,5):I.x<126?6:I.x<230?cl(7+Math.floor((I.x-126)/17),7,12):13;c.r=I.y<126?0:1;}
  if(I.b){if(g.done.length){g.cur=g.s;g.rem=g.dice[0]===g.dice[1]?[g.dice[0],g.dice[0],g.dice[0],g.dice[0]]:[g.dice[0],g.dice[1]];g.done=[];g.hl=legalNow();g.src=g.s.bar[t]?-1:null;g.msg='UNDONE';S('blip');}else g.src=null;}
  if(!I.a)return;const L_=logical(c.c,c.r);
  if(g.src!==null){const ms=g.hl.filter(m=>m.f===g.src&&m.to===L_).sort((a,b)=>a.d-b.d);if(ms.length){step(ms[0]);if(g.cur.bar[t]&&g.hl.some(m=>m.f===-1))g.src=-1;return;}}
  if(g.hl.some(m=>m.f===L_)){g.src=L_;S('blip');}else if(L_>=0&&g.src===null){const ms=g.hl.filter(m=>m.to===L_);if(ms.length===1||(ms.length&&ms.every(m=>m.f===ms[0].f))){step(ms.sort((a,b)=>a.d-b.d)[0]);}else S('lose');}else S('lose');};
 g.draw=()=>{table('#16100c');const c=A.c,s=g.cur,t=g.turn;frame(6,20,256,212,'walnut',6);
  c.fillStyle=lg(0,20,0,232,[[0,'#24583e'],[.5,'#1c4630'],[1,'#24583e']],'#1e4a36');c.fillRect(6,20,104,212);c.fillRect(128,20,102,212);
  wood(110,14,16,224,'walnut',9);wood(230,20,32,212,'teak',5);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(234,24,24,96);c.fillRect(234,132,24,96);
  const hum=!isCPU(g,t)&&g.ph==='move'&&!g.over;const srcs=hum?new Set(g.hl.map(m=>m.f)):new Set(),dsts=hum&&g.src!==null?new Set(g.hl.filter(m=>m.f===g.src).map(m=>m.to)):new Set();
  for(let i=0;i<24;i++){const{vc,r}=pc(i),x=colX(vc),y0=r?232:20,y1=r?142:110;c.fillStyle=lg(x,y0,x,y1,[[0,i%2?'#f0e2c0':'#a01c1c'],[1,i%2?'#c8b488':'#6a0e0e']],i%2?'#e8dcc0':'#8a1c1c');c.beginPath();c.moveTo(x-8.2,y0);c.lineTo(x+8.2,y0);c.lineTo(x,y1);c.closePath();c.fill();
   if(dsts.has(i)){c.globalAlpha=.35+.3*pulse();c.fillStyle='#50ff90';c.beginPath();c.moveTo(x-8.2,y0);c.lineTo(x+8.2,y0);c.lineTo(x,y1);c.closePath();c.fill();c.globalAlpha=1;}}
  const hide=g.anim?g.anim.to:null;
  for(let i=0;i<24;i++){const v=s.p[i];if(!v)continue;const o=v>0?0:1,n=Math.abs(v)-(hide===i&&g.anim.t===o?1:0);for(let k=0;k<Math.min(n,5);k++){const[x,y]=slot(i,k,o);piece(x,y,7.8,o?'ebony':'ivory',{sel:hum&&g.src===i&&k===Math.min(n,5)-1});}if(n>5){const[x,y]=slot(i,4,o);T(n,x,y-2,o?K.w:K.k,1,'c');}
   if(hum&&g.src===null&&srcs.has(i)&&n){const[x,y]=slot(i,Math.min(n,5)-1,o);ring2(x,y,9.5,'rgba(80,255,140,'+(.4+.4*pulse())+')',1.2);}}
  for(let o=0;o<2;o++){const n=s.bar[o]-(hide===-1&&g.anim.t===o?0:0);for(let k=0;k<n;k++){const[x,y]=slot(-1,k,o);piece(x,y,7.8,o?'ebony':'ivory',{sel:hum&&g.src===-1&&o===t});}
   const nf=s.off[o]-(hide===-2&&g.anim.t===o?1:0);for(let k=0;k<nf;k++){const[x,y]=slot(-2,k,o);c.fillStyle=o?'#2e2c34':'#efe6d2';c.fillRect(x-10,y-1.6,20,3.6);c.fillStyle=o?'#5a5866':'#ffffff';c.fillRect(x-10,y-1.6,20,1);}}
  if(dsts.has(-2)){ring2(246,t?70:180,14,'rgba(80,255,140,'+pulse()+')',2);T('OFF',246,t?68:178,K.g,1,'c');}
  if(g.anim){const a=g.anim,e=a.k*a.k*(3-2*a.k),x=a.x0+(a.x1-a.x0)*e,y=a.y0+(a.y1-a.y0)*e-Math.sin(a.k*Math.PI)*8;if(a.to===-2){c.fillStyle=a.t?'#2e2c34':'#efe6d2';c.fillRect(x-10,y-2,20,4);}else piece(x,y,7.8+Math.sin(a.k*Math.PI)*1.5,a.t?'ebony':'ivory');}
  if(hum){const cx=g.cu.c===13?246:colX(g.cu.c),cy=g.cu.c===6?(g.cu.r?160:80):g.cu.r?186:66;c.strokeStyle=t?K.p:K.c;c.lineWidth=1.5;c.strokeRect(cx-(g.cu.c===13?13:9),g.cu.r?142:20,g.cu.c===13?26:18,90);}
  const dx=t===0?150:30,dv=g.ph==='open'?g.od:g.dice,show=g.ph!=='roll'||g.done.length;if(g.ph==='open'){die3(40,116,20,g.od[0],0,'#f0e8d8');die3(160,116,20,g.od[1],0,'#d8d0e8');}
  else if(g.ph!=='roll'){const used=g.dice[0]===g.dice[1]?4-g.rem.length:0;if(g.dice[0]===g.dice[1]){for(let k=0;k<4;k++)die3(dx+k*18,118,15,g.dice[0],k<used&&g.ph==='move');}else{die3(dx,116,20,g.dice[0],g.ph==='move'&&!g.rem.includes(g.dice[0]));die3(dx+26,116,20,g.dice[1],g.ph==='move'&&!g.rem.includes(g.dice[1]));}}
  const mx=t===0?30:150;let st='';if(g.ph==='roll')st=isCPU(g,t)?nm(g,t)+' ROLLING':(A.two?nm(g,t)+': ':'')+'A TO ROLL';else if(g.ph==='move'&&!isCPU(g,t))st=g.src===null?'PICK A CHECKER':'PICK A POINT';else if(g.ph==='pass'||g.ph==='open'||g.ph==='show')st=g.msg;
  if(st){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(mx-24,119,st.length*4+8>104?104:st.length*4+8,13);T(st,mx-20,123,g.ph==='pass'?K.r:K.y,1);}
  for(let o=0;o<2;o++){const y=o?8:130,on=t===o&&!g.over;plate(266,y,50,100,on,o?K.p:K.c);piece(278,y+13,7,o?'ebony':'ivory');T(nm(g,o),290,y+9,on?K.w:K.gr,1);T('PIPS',270,y+30,K.gr,1);T(BG.pip(s,o),312,y+42,K.w,2,'r');T('OFF',270,y+62,K.gr,1);T(s.off[o]+'/15',312,y+74,K.w,1,'r');if(on&&isCPU(g,o)&&!demo(g))T('THINK',291,y+90,K.c,1,'c');else if(on&&g.done.length&&!isCPU(g,o))T('B UNDO',291,y+90,K.gr,1,'c');}
  T(g.over?g.msg:'',133,4,K.c,1,'c');};
 return g;}});

/* ================= WALL RACE (Quoridor rules) ================= */
const QW={};
QW.can=(s,x,y,dx,dy)=>{const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>8||ny>8)return false;const hw=s.hw,vw=s.vw,H_=(cx,cy)=>cx>=0&&cy>=0&&cx<8&&cy<8&&hw[cy*8+cx],V_=(cx,cy)=>cx>=0&&cy>=0&&cx<8&&cy<8&&vw[cy*8+cx];
 if(dx===1)return!(V_(x,y)||V_(x,y-1));if(dx===-1)return!(V_(x-1,y)||V_(x-1,y-1));if(dy===1)return!(H_(x,y)||H_(x-1,y));return!(H_(x,y-1)||H_(x-1,y-1));};
QW.D4=[[1,0],[-1,0],[0,1],[0,-1]];
QW.dist=(s,t,par)=>{const gy=t?8:0,[sx,sy]=s.p[t],D=new Int8Array(81).fill(-1),q=[sy*9+sx];D[sy*9+sx]=0;if(sy===gy)return 0;
 for(let h=0;h<q.length;h++){const c=q[h],x=c%9,y=c/9|0;for(const[dx,dy]of QW.D4){if(!QW.can(s,x,y,dx,dy))continue;const n=(y+dy)*9+x+dx;if(D[n]>=0)continue;D[n]=D[c]+1;if(par)par[n]=c;if(y+dy===gy){if(par)par.end=n;return D[n];}q.push(n);}}return 99;};
QW.pawn=(s,t)=>{const out=[],[x,y]=s.p[t],[ox,oy]=s.p[1-t];for(const[dx,dy]of QW.D4){if(!QW.can(s,x,y,dx,dy))continue;const nx=x+dx,ny=y+dy;if(nx===ox&&ny===oy){if(QW.can(s,nx,ny,dx,dy))out.push({k:0,x:nx+dx,y:ny+dy});else for(const[px,py]of dx?[[0,1],[0,-1]]:[[1,0],[-1,0]])if(QW.can(s,nx,ny,px,py))out.push({k:0,x:nx+px,y:ny+py});}else out.push({k:0,x:nx,y:ny});}return out;};
QW.wallOk=(s,k,i)=>{const cx=i%8,cy=i/8|0,hw=s.hw,vw=s.vw;if(hw[i]||vw[i])return false;if(k===1){if(cx>0&&hw[i-1])return false;if(cx<7&&hw[i+1])return false;}else{if(cy>0&&vw[i-8])return false;if(cy<7&&vw[i+8])return false;}return true;};
QW.put=(s,m)=>{const hw=s.hw.slice(),vw=s.vw.slice(),p=[s.p[0].slice(),s.p[1].slice()],w=s.w.slice();if(m.k===0)p[s.t]=[m.x,m.y];else{(m.k===1?hw:vw)[m.i]=s.t+1;w[s.t]--;}return{p,w,hw,vw,t:1-s.t};};
QW.pathOk=s=>QW.dist(s,0)<99&&QW.dist(s,1)<99;
QW.blockers=(s,t)=>{const par={};QW.dist(s,t,par);const set=new Set();let c=par.end;const add=(k,cx,cy)=>{if(cx>=0&&cy>=0&&cx<8&&cy<8)set.add(k*100+cy*8+cx);};
 while(c!==undefined&&par[c]!==undefined){const a=par[c],ax=a%9,ay=a/9|0,bx=c%9,by=c/9|0;if(ax===bx){const y=Math.min(ay,by);add(1,ax,y);add(1,ax-1,y);}else{const x=Math.min(ax,bx);add(2,x,ay);add(2,x,ay-1);}c=a;}
 const[px,py]=s.p[t];for(let dy=-1;dy<=0;dy++)for(let dx=-1;dx<=0;dx++){add(1,px+dx,py+dy);add(2,px+dx,py+dy);}return[...set];};
const QG={
 moves(s){const out=QW.pawn(s,s.t);if(s.w[s.t]>0){for(const c of QW.blockers(s,1-s.t)){const k=c/100|0,i=c%100;if(!QW.wallOk(s,k,i))continue;const m={k,i};const ns=QW.put(s,m);if(QW.pathOk(ns))out.push(m);}}return out;},
 play:QW.put,
 over(s,ply){const t=1-s.t;if(s.p[t][1]===(t?8:0))return -WIN+ply;return null;},
 stuck(s,ply){return 0;},
 ev(s){const me=s.t,op=1-me,dm=QW.dist(s,me),dp=QW.dist(s,op);return(dp-dm)*10+(s.w[me]-s.w[op])*2.2+(s.w[op]===0?(dp-dm)*3:0)+3;},
 order(s,mv){const d0=QW.dist(s,s.t);for(const m of mv){if(m.k===0){const ns=QW.put(s,m);ns.t=s.t;m.o=(d0-QW.dist(ns,s.t))*10;}else m.o=4;}mv.sort((a,b)=>b.o-a.o);}};
A.add({id:'wallrace',name:'WALL RACE',cat:'BOARD',vs:1,warm:30,time:480,how:'REACH THE FAR SIDE FIRST. A MOVES OR BUILDS. B SWITCHES PAWN / ACROSS WALL / DOWN WALL.',make(){
 const g=base();g.st={p:[[4,8],[4,0]],w:[10,10],hw:new Uint8Array(64),vw:new Uint8Array(64),t:0};g.mode=0;g.c={x:4,y:8};g.wc={x:3,y:6};g.last=null;g.anim=null;
 const OX=10,OY=14,CS=20,GP=4,ST=CS+GP,cxy=(x,y)=>[OX+x*ST+CS/2,OY+y*ST+CS/2],wxy=(cx,cy)=>[OX+(cx+1)*ST-GP/2,OY+(cy+1)*ST-GP/2];
 const finish=()=>{const s=g.st;g.turn=s.t;const t=1-s.t;if(s.p[t][1]===(t?8:0)){g.over=winT(g,t);g.msg='REACHED THE FAR SIDE';S('win');}g.pl=QW.pawn(s,s.t);};
 const doMove=m=>{const s=g.st;if(m.k===0){const a=cxy(s.p[s.t][0],s.p[s.t][1]),b=cxy(m.x,m.y);g.anim={a,b,k:0,t:s.t};S('hit');}else{const[x,y]=wxy(m.i%8,m.i/8|0);A.burst(x,y,'#e8c890',10,1.5);S('boom');A.shake=3;}g.st=QW.put(s,m);g.last=m;if(g.st.w[s.t]===0&&g.mode)g.mode=0;finish();};
 finish();
 g.timeUp=()=>{const a=QW.dist(g.st,0),b=QW.dist(g.st,1);return tupT(g,a===b?-1:a<b?0:1);};
 g.update=()=>{touch(g);if(g.anim){g.anim.k+=demo(g)?.5:.2;if(g.anim.k>=1)g.anim=null;}if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(QG,s,cfg(t,[{maxD:1,noise:14},{maxD:2,noise:1},{maxD:6}]));if(m)doMove(m);}return;}
  const I=inp(g,t);if(I.b){const n=s.w[t]>0?(g.mode+1)%3:0;if(n&&!g.mode){g.wc.x=cl(g.c.x-(t?0:1),0,7);g.wc.y=cl(g.c.y-(t?0:1),0,7);}else if(!n&&g.mode){g.c={x:s.p[t][0],y:s.p[t][1]};}g.mode=n;S('blip');}
  if(g.mode===0){moveCur(I,g.c,9,9);if(I.mv){const X=Math.floor((I.x-OX)/ST),Y=Math.floor((I.y-OY)/ST);if(X>=0&&Y>=0&&X<9&&Y<9){g.c.x=X;g.c.y=Y;}}}
  else{moveCur(I,g.wc,8,8);if(I.mv&&I.x<OX+9*ST){const fx=(I.x-OX+GP/2)/ST-1,fy=(I.y-OY+GP/2)/ST-1;g.wc.x=cl(Math.round(fx),0,7);g.wc.y=cl(Math.round(fy),0,7);if(!I.b){const ex=Math.abs(fx-Math.round(fx)),ey=Math.abs(fy-Math.round(fy));if(ey<.2&&ex>.2)g.mode=1;else if(ex<.2&&ey>.2)g.mode=2;}}}
  if(!I.a)return;
  if(g.mode===0){const m=g.pl.find(m=>m.x===g.c.x&&m.y===g.c.y);if(m)doMove(m);else S('lose');}
  else{const i=g.wc.y*8+g.wc.x,m={k:g.mode,i};if(s.w[t]>0&&QW.wallOk(s,m.k,i)&&QW.pathOk(QW.put(s,m)))doMove(m);else{S('lose');g.msg=QW.wallOk(s,m.k,i)?'CANNOT SEAL A PATH':'WALLS CROSS';g.mt=60;}}};
 const pawn=(x,y,m,sel)=>{const c=A.c;oval(x+1.5,y+6,8,3.2,0,'rgba(0,0,0,.4)');const t=MAT[m];c.fillStyle=lg(x-7,0,x+7,0,[[0,t[2]],[.35,t[0]],[.7,t[1]],[1,t[2]]],t[1]);c.beginPath();c.moveTo(x-7,y+5);c.lineTo(x+7,y+5);c.lineTo(x+3,y-3);c.lineTo(x-3,y-3);c.closePath();c.fill();oval(x,y+5,7,2.2,0,t[2]);piece(x,y-5,4.6,m,{flat:1});if(sel)ring2(x,y,11,K.y,1.5);};
 const wallBar=(k,i,o,alpha,bad)=>{const[x,y]=wxy(i%8,i/8|0),c=A.c;c.globalAlpha=alpha||1;const L_=CS*2+GP,wd=GP+2,stripe=bad?'#ff3040':o===1?'#40a0ff':'#ff4070';
  if(k===1){c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x-L_/2+1,y-wd/2+2,L_,wd);wood(x-L_/2,y-wd/2,L_,wd,'walnut',i+3);c.fillStyle=stripe;c.fillRect(x-L_/2+2,y-.5,L_-4,1);}
  else{c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x-wd/2+1,y-L_/2+2,wd,L_);wood(x-wd/2,y-L_/2,wd,L_,'walnut',i+5);c.fillStyle=stripe;c.fillRect(x-.5,y-L_/2+2,1,L_-4);}c.globalAlpha=1;};
 g.draw=()=>{table('#15110e');const c=A.c,s=g.st,t=s.t;frame(OX-2,OY-2,9*ST-GP+4,9*ST-GP+4,'walnut',6);c.fillStyle='#2a1a0e';c.fillRect(OX-2,OY-2,9*ST-GP+4,9*ST-GP+4);
  for(let y=0;y<9;y++)for(let x=0;x<9;x++){const px=OX+x*ST,py=OY+y*ST;wood(px,py,CS,CS,'maple',x*9+y);if(y===0){c.fillStyle='rgba(60,160,255,.22)';c.fillRect(px,py,CS,CS);}if(y===8){c.fillStyle='rgba(255,60,110,.22)';c.fillRect(px,py,CS,CS);}}
  const hum=!isCPU(g,t)&&!g.over;if(hum&&g.mode===0)g.pl.forEach(m=>{const[x,y]=cxy(m.x,m.y);dot(x,y,3.2);});
  for(let i=0;i<64;i++){if(s.hw[i])wallBar(1,i,s.hw[i]);if(s.vw[i])wallBar(2,i,s.vw[i]);}
  for(let o=0;o<2;o++){let[x,y]=cxy(s.p[o][0],s.p[o][1]);if(g.anim&&g.anim.t===o){const a=g.anim,e=a.k;x=a.a[0]+(a.b[0]-a.a[0])*e;y=a.a[1]+(a.b[1]-a.a[1])*e-Math.sin(e*Math.PI)*6;}pawn(x,y,o?'ruby':'sapph');}
  if(hum){if(g.mode===0){const[x,y]=cxy(g.c.x,g.c.y);c.strokeStyle=t?K.p:K.c;c.lineWidth=1.5;c.strokeRect(x-CS/2-1,y-CS/2-1,CS+2,CS+2);}
   else{const i=g.wc.y*8+g.wc.x,m={k:g.mode,i},ok=QW.wallOk(s,m.k,i)&&QW.pathOk(QW.put(s,m));wallBar(g.mode,i,t+1,.5+.3*pulse(),!ok);const[x,y]=wxy(g.wc.x,g.wc.y);ring2(x,y,4,ok?K.g:K.r,1.5);}}
  if(g.mt)g.mt--;
  panel(g,{mat:['sapph','ruby'],stat:[0,1].map(v=>'WALLS '+s.w[v]),stat2:[0,1].map(v=>'STEPS LEFT '+QW.dist(s,v)),
   lines:[[isCPU(g,t)?'':['MODE: MOVE PAWN','MODE: WALL ACROSS','MODE: WALL DOWN'][g.mode],K.y],[isCPU(g,t)?'':s.w[t]?'B: NEXT MODE':'NO WALLS LEFT',K.gr],g.mt?[g.msg,K.r]:g.over?[g.msg,K.c]:null]});
  for(let o=0;o<2;o++)for(let k=0;k<s.w[o];k++){const x=236+k*7.8,y=o?200:214;wood(x,y-5,4,11,'walnut',k);A.c.fillStyle=o?'#ff4070':'#40a0ff';A.c.fillRect(x+1.5,y-4,1,9);}};
 return g;}});

/* ================= TWIST FIVE (Pentago rules) ================= */
const PL=[];for(let y=0;y<6;y++)for(let x=0;x<2;x++){PL.push([0,1,2,3,4].map(k=>y*6+x+k));PL.push([0,1,2,3,4].map(k=>(x+k)*6+y));}
for(const[sx,sy]of[[0,0],[1,0],[0,1],[1,1]]){PL.push([0,1,2,3,4].map(k=>(sy+k)*6+sx+k));PL.push([0,1,2,3,4].map(k=>(sy+k)*6+5-sx-k));}
const pRot=(b,q,d)=>{const n=b.slice(),ox=(q%2)*3,oy=(q>>1)*3;for(let y=0;y<3;y++)for(let x=0;x<3;x++){const v=b[(oy+y)*6+ox+x];if(d>0)n[(oy+x)*6+ox+2-y]=v;else n[(oy+2-x)*6+ox+y]=v;}return n;};
const pWin=(b,v)=>PL.some(l=>b[l[0]]===v&&b[l[1]]===v&&b[l[2]]===v&&b[l[3]]===v&&b[l[4]]===v);
const pSym=(b,q)=>{const o=(q>>1)*18+(q%2)*3,a=b[o],c=b[o+2],d=b[o+14],e=b[o+12];if(a!==c||a!==d||a!==e)return false;const f=b[o+1],h=b[o+8],j=b[o+13],k=b[o+6];return f===h&&f===j&&f===k;};
const PLC=[...Array(36)].map((_,i)=>PL.filter(l=>l.includes(i)));const pWinAt=(b,v,i)=>PLC[i].some(l=>b[l[0]]===v&&b[l[1]]===v&&b[l[2]]===v&&b[l[3]]===v&&b[l[4]]===v);
const PW=[0,1,5,24,120];
const PG={
 moves(s){const out=[],v=s.t+1,b=s.b;for(let i=0;i<36;i++){if(b[i])continue;b[i]=v;if(pWinAt(b,v,i)){b[i]=0;out.push({i,q:-1,d:0});continue;}for(let q=0;q<4;q++){out.push({i,q,d:1});if(!pSym(b,q))out.push({i,q,d:-1});}b[i]=0;}return out;},
 play(s,m){let b=s.b.slice();b[m.i]=s.t+1;if(m.q>=0)b=pRot(b,m.q,m.d);return{b,t:1-s.t,n:s.n+1};},
 over(s,ply){const me=s.t+1,op=2-s.t,wm=pWin(s.b,me),wo=pWin(s.b,op);if(wm&&wo)return 0;if(wo)return -WIN+ply;if(wm)return WIN-ply;if(s.n>=36)return 0;return null;},
 stuck(){return 0;},
 ev(s){const me=s.t+1,b=s.b;let e=0;for(const l of PL){let a=0,o=0;for(const i of l){const v=b[i];if(v===me)a++;else if(v)o++;}if(!o)e+=PW[a];else if(!a)e-=PW[o]*1.15;}for(const i of[7,10,25,28]){if(b[i]===me)e+=3;else if(b[i])e-=3;}return e;},
 order(s,mv){const b=s.b,w=new Float32Array(36);for(let i=0;i<36;i++){if(b[i])continue;const x=i%6,y=i/6|0;let k=(x%3===1&&y%3===1)?3:0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<6&&Y<6&&b[Y*6+X])k+=1;}w[i]=k;}mv.sort((a,c)=>(c.q<0?99:w[c.i])-(a.q<0?99:w[a.i]));}};
A.add({id:'twistfive',name:'TWIST FIVE',cat:'BOARD',vs:1,warm:30,time:420,how:'PLACE A MARBLE, THEN TWIST A QUADRANT (A CLOCKWISE, B ANTI). FIVE IN A ROW WINS.',make(){
 const g=base();g.st={b:Array(36).fill(0),t:0,n:0};g.c={x:2,y:2};g.qc=0;g.ph='place';g.pre=null;g.rot=null;g.last=-1;g.pm=null;
 const OX=14,OY=20,QS=96,QG=6,qxy=q=>[OX+(q%2)*(QS+QG),OY+(q>>1)*(QS+QG)],cxy=i=>{const x=i%6,y=i/6|0,q=(y>=3?2:0)+(x>=3?1:0),[qx,qy]=qxy(q);return[qx+(x%3)*32+16,qy+(y%3)*32+16];};
 const judge=(mover)=>{const b=g.st.b,wm=pWin(b,mover+1),wo=pWin(b,2-mover);if(wm&&wo){g.over='DRAW - BOTH MADE FIVE';g.msg='TWO LINES AT ONCE';}else if(wm||wo){const w=wm?mover:1-mover;g.over=winT(g,w);g.msg='FIVE IN A ROW';g.line=PL.find(l=>l.every(i=>b[i]===w+1));S('win');}else if(g.st.n>=36){g.over='DRAW - BOARD FULL';g.msg='NO FIVE';}};
 const place=i=>{const t=g.st.t;g.pre=g.st.b.slice();g.pre[i]=t+1;g.last=i;S('hit');const[x,y]=cxy(i);A.burst(x,y,K.w,6,1);if(pWin(g.pre,t+1)){g.st={b:g.pre,t:1-t,n:g.st.n+1};judge(t);g.ph='done';return true;}g.ph='twist';g.qc=(i%6>=3?1:0)+(i>=18?2:0);return false;};
 const twist=(q,d)=>{g.rot={q,d,k:0,t:g.st.t};g.ph='anim';S('jump');};
 const endRot=()=>{const r=g.rot,t=r.t;g.st={b:pRot(g.pre,r.q,r.d),t:1-t,n:g.st.n+1};g.rot=null;g.pre=null;g.ph='place';g.turn=g.st.t;judge(t);g.c={x:g.last%6,y:g.last/6|0};};
 g.timeUp=()=>{const s={b:g.pre||g.st.b,t:0},e=PG.ev(s);return tupT(g,Math.abs(e)<4?-1:e>0?0:1);};
 g.update=()=>{touch(g);if(g.over)return;if(g.rot){g.rot.k+=demo(g)?.25:.08;if(g.rot.k>=1)endRot();return;}const t=g.st.t;g.turn=t;
  if(isCPU(g,t)){if(g.ph==='place'){if(cpuGo(g)){const m=search(PG,g.st,cfg(t,[{maxD:1,noise:30},{maxD:2,noise:2},{maxD:4}]));if(!m)return;g.pm=m;if(!place(m.i))g.ph='cwait';}}else if(g.ph==='cwait'){if(++g.th>(demo(g)?3:22)){g.th=0;twist(g.pm.q,g.pm.d);}}return;}
  const I=inp(g,t);
  if(g.ph==='place'){moveCur(I,g.c,6,6);if(I.mv){for(let i=0;i<36;i++){const[x,y]=cxy(i);if(Math.abs(I.x-x)<16&&Math.abs(I.y-y)<16){g.c.x=i%6;g.c.y=i/6|0;}}}if(I.a){const i=g.c.y*6+g.c.x;if(!g.st.b[i])place(i);else S('lose');}return;}
  if(g.ph==='twist'){const q0=g.qc;let qx=g.qc%2,qy=g.qc>>1;if(I.l)qx=0;if(I.r)qx=1;if(I.u)qy=0;if(I.d)qy=1;g.qc=qy*2+qx;if(I.mv&&I.x<OX+2*QS+QG+4){g.qc=(I.y>OY+QS+QG/2?2:0)+(I.x>OX+QS+QG/2?1:0);}if(g.qc!==q0)S('blip');if(I.a)twist(g.qc,1);else if(I.b)twist(g.qc,-1);}};
 const arrow=(cx,cy,r,a0,a1,col)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=2.5;c.beginPath();c.arc(cx,cy,r,a0,a1,a1<a0);c.stroke();const ex=cx+Math.cos(a1)*r,ey=cy+Math.sin(a1)*r,tg=a1>a0?a1+1.5708:a1-1.5708;c.fillStyle=col;c.beginPath();c.moveTo(ex+Math.cos(tg)*6,ey+Math.sin(tg)*6);c.lineTo(ex+Math.cos(tg+2.3)*5,ey+Math.sin(tg+2.3)*5);c.lineTo(ex+Math.cos(tg-2.3)*5,ey+Math.sin(tg-2.3)*5);c.closePath();c.fill();};
 g.draw=()=>{table('#14121a');const c=A.c,t=g.st.t,b=g.pre||g.st.b;frame(OX-4,OY-4,2*QS+QG+8,2*QS+QG+8,'ebon',6);c.fillStyle='#0c0a0a';c.fillRect(OX-4,OY-4,2*QS+QG+8,2*QS+QG+8);
  for(let q=0;q<4;q++){const[qx,qy]=qxy(q),r=g.rot&&g.rot.q===q;c.save();if(r){const a=g.rot.k*g.rot.k*(3-2*g.rot.k)*g.rot.d*1.5708;c.translate(qx+QS/2,qy+QS/2);if(c.rotate)c.rotate(a);c.translate(-qx-QS/2,-qy-QS/2);c.fillStyle='rgba(0,0,0,.5)';c.fillRect(qx+4,qy+6,QS,QS);}
   wood(qx,qy,QS,QS,q%3?'cherry':'teak',q*7+2);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;c.strokeRect(qx+3.5,qy+3.5,QS-7,QS-7);
   for(let ly=0;ly<3;ly++)for(let lx=0;lx<3;lx++){const x=qx+lx*32+16,y=qy+ly*32+16,i=((q>>1)*3+ly)*6+(q%2)*3+lx,v=b[i];disc(x,y,11,rg(x-2,y-3,1,x,y,12,[[0,'#1a0a02'],[.85,'#3a1c08'],[1,'rgba(255,220,180,.5)']],'#2a1408'));
    if(v)piece(x,y,12,v===1?'pearl':'smoke',{flat:0});if(i===g.last&&v)ring2(x,y,13.5,'rgba(255,220,100,.7)',1.2);}
   c.restore();}
  if(g.line){const a=cxy(g.line[0]),z=cxy(g.line[4]);c.globalAlpha=.5+.4*pulse();c.strokeStyle=K.y;c.lineWidth=4;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(z[0],z[1]);c.stroke();c.globalAlpha=1;}
  const hum=!isCPU(g,t)&&!g.over;
  if(hum&&g.ph==='place'){const[x,y]=cxy(g.c.y*6+g.c.x);ring2(x,y,14.5,t?K.p:K.c,2);if(!b[g.c.y*6+g.c.x]){c.globalAlpha=.35;piece(x,y,12,t?'smoke':'pearl',{flat:1});c.globalAlpha=1;}}
  if(hum&&g.ph==='twist'){const[qx,qy]=qxy(g.qc),cx=qx+QS/2,cy=qy+QS/2;c.strokeStyle=t?K.p:K.c;c.lineWidth=2;c.strokeRect(qx-2,qy-2,QS+4,QS+4);arrow(cx,cy,30,-2.6,-.55,'rgba(80,255,140,.9)');arrow(cx,cy,30,2.6,.55,'rgba(255,200,80,.9)');T('A',cx+30,cy-36,K.g,1,'c');T('B',cx+30,cy+32,K.y,1,'c');}
  panel(g,{mat:['pearl','smoke'],stat:[0,1].map(v=>'MARBLES '+g.st.b.filter(x=>x===v+1).length),
   lines:[[isCPU(g,t)?'':g.ph==='twist'?'TWIST A QUADRANT':g.ph==='place'?'PLACE A MARBLE':'',K.y],[hum&&g.ph==='twist'?'A CLOCKWISE':'',K.g],[hum&&g.ph==='twist'?'B ANTI-CLOCKWISE':'',K.y],g.over?[g.msg,K.c]:null]});};
 return g;}});

/* ================= CORNER BLOCKS (two-player polyomino duel, 14x14) ================= */
const CBP=[[[0,0]],[[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[1,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],
 [[1,0],[2,0],[0,1],[1,1],[1,2]],[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,0],[0,1],[0,2],[0,3],[1,3]],[[1,0],[1,1],[1,2],[0,2],[0,3]],[[0,0],[1,0],[0,1],[1,1],[0,2]],[[0,0],[1,0],[2,0],[1,1],[1,2]],[[0,0],[2,0],[0,1],[1,1],[2,1]],[[0,0],[0,1],[0,2],[1,2],[2,2]],[[0,0],[0,1],[1,1],[1,2],[2,2]],[[1,0],[0,1],[1,1],[2,1],[1,2]],[[1,0],[0,1],[1,1],[1,2],[1,3]],[[0,0],[1,0],[1,1],[1,2],[2,2]]];
const cbNorm=c=>{const mx=Math.min(...c.map(p=>p[0])),my=Math.min(...c.map(p=>p[1]));return c.map(p=>[p[0]-mx,p[1]-my]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);};
const CBO=CBP.map(pc=>{const out=[],seen=new Set();let c=pc;for(let f=0;f<2;f++){for(let r=0;r<4;r++){const n=cbNorm(c),k=n.join(';');if(!seen.has(k)){seen.add(k);out.push(n);}c=c.map(p=>[p[1],-p[0]]);}c=c.map(p=>[-p[0],p[1]]);}return out;});
const CBST=[60,135];
const cbOk=(b,v,first,start,cells,x,y)=>{let corner=false,cov=false;for(const[cx,cy]of cells){const X=cx+x,Y=cy+y;if(X<0||Y<0||X>13||Y>13)return false;const i=Y*14+X;if(b[i])return false;
 if((X>0&&b[i-1]===v)||(X<13&&b[i+1]===v)||(Y>0&&b[i-14]===v)||(Y<13&&b[i+14]===v))return false;if(!corner&&((X>0&&Y>0&&b[i-15]===v)||(X<13&&Y>0&&b[i-13]===v)||(X>0&&Y<13&&b[i+13]===v)||(X<13&&Y<13&&b[i+15]===v)))corner=true;if(i===start)cov=true;}return first?cov:corner;};
const cbAnc=(b,v,first,start)=>{if(first)return b[start]?[]:[start];const a=[];for(let i=0;i<196;i++){if(b[i])continue;const X=i%14,Y=i/14|0;if((X>0&&b[i-1]===v)||(X<13&&b[i+1]===v)||(Y>0&&b[i-14]===v)||(Y<13&&b[i+14]===v))continue;if((X>0&&Y>0&&b[i-15]===v)||(X<13&&Y>0&&b[i-13]===v)||(X>0&&Y<13&&b[i+13]===v)||(X<13&&Y<13&&b[i+15]===v))a.push(i);}return a;};
const cbMoves=(s,t)=>{const v=t+1,b=s.b,first=!s.np[t],start=CBST[t],anc=cbAnc(b,v,first,start),out=[],seen=new Set();
 for(let p=0;p<21;p++){if(s.used[t][p])continue;CBO[p].forEach((cells,o)=>{for(const a of anc){const ax=a%14,ay=a/14|0;for(const[cx,cy]of cells){const x=ax-cx,y=ay-cy,k=((p*8+o)*20+y+5)*20+x+5;if(seen.has(k))continue;seen.add(k);if(cbOk(b,v,first,start,cells,x,y))out.push({p,o,x,y});}}});}return out;};
const cbPlay=(s,m,t)=>{const b=s.b.slice(),used=[s.used[0].slice(),s.used[1].slice()],np=s.np.slice(),sq=s.sq.slice(),lm=s.lm.slice();for(const[cx,cy]of CBO[m.p][m.o])b[(cy+m.y)*14+cx+m.x]=t+1;used[t][m.p]=1;np[t]++;sq[t]+=CBP[m.p].length;lm[t]=m.p===0;return{b,used,np,sq,lm};};
const cbScore=(s,t)=>s.sq[t]+(s.np[t]===21?15+(s.lm[t]?5:0):0);
const cbE=(s,me)=>{const op=1-me,a=cbAnc(s.b,me+1,!s.np[me],CBST[me]).length,o=cbAnc(s.b,op+1,!s.np[op],CBST[op]).length;return(s.sq[me]-s.sq[op])*1.2+(a-o)*.55+(s.np[me]===21?15:0)-(s.np[op]===21?15:0);};
const cbCPU=(s,t,lv,ms)=>{let mv=cbMoves(s,t);if(!mv.length)return null;if(ms<10)mv=shuf(mv).slice(0,30);const t0=now(),nz=[7,.6,.1][lv]||0;for(const m of mv)m.h=cbE(cbPlay(s,m,t),t)+(Math.random()-.5)*nz;mv.sort((a,b)=>b.h-a.h);const K=ms<10?1:[1,6,16][lv]||1;if(K===1)return mv[0];
 let best=mv[0],bv=-1e9;for(let i=0;i<Math.min(K,mv.length);i++){if(i>0&&now()-t0>ms)break;const ns=cbPlay(s,mv[i],t),rep=cbMoves(ns,1-t);let worst=1e9;if(!rep.length)worst=cbE(ns,t)+4;else for(const r of rep){const v=cbE(cbPlay(ns,r,1-t),t);if(v<worst){worst=v;if(worst<=bv)break;}}if(worst>bv){bv=worst;best=mv[i];}}return best;};
const tile=(x,y,s,col,a)=>{const c=A.c;c.globalAlpha=a||1;c.fillStyle=lg(x,y,x+s,y+s,[[0,A.mix(col,'#ffffff',.35)],[.5,col],[1,A.mix(col,'#000000',.35)]],col);c.fillRect(x,y,s,s);c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x+1,y+1,s-2,Math.max(1,s*.12));c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x,y+s-1,s,1);c.fillRect(x+s-1,y,1,s);c.globalAlpha=1;};
A.add({id:'cornerblocks',name:'CORNER BLOCKS',cat:'BOARD',vs:1,warm:30,time:600,how:'YOUR PIECES MAY TOUCH ONLY AT CORNERS. B TURNS, RIGHT EDGE = TRAY. MOST SQUARES WINS.',make(){
 const g=base();g.st={b:new Uint8Array(196),used:[new Uint8Array(21),new Uint8Array(21)],np:[0,0],sq:[0,0],lm:[false,false]};g.pc=[20,20];g.or=0;g.cu={x:4,y:4};g.inT=false;g.tc=20;g.pass=[false,false];g.mv=null;g.lastC=[];g.wait=0;
 const OX=8,OY=26,CS=13,COL=['#2a74f0','#f07a1a'],TX=198,TY=26;
 const sz=(p,o)=>{const c=CBO[p][o];return[Math.max(...c.map(q=>q[0]))+1,Math.max(...c.map(q=>q[1]))+1];};
 const ghostXY=()=>{const t=g.turn,[w,h]=sz(g.pc[t],g.or);return[g.cu.x-(w>>1),g.cu.y-(h>>1)];};
 const prep=()=>{const t=g.turn;g.mv=cbMoves(g.st,t);if(!g.mv.length){g.pass[t]=true;}if(g.st.used[t][g.pc[t]]){for(let p=20;p>=0;p--)if(!g.st.used[t][p]){g.pc[t]=p;break;}g.or=0;}};
 const endCheck=()=>{if(g.pass[0]&&g.pass[1]){const a=cbScore(g.st,0),b=cbScore(g.st,1);g.over=a===b?'DRAW - EQUAL SCORES':winT(g,a>b?0:1);g.msg=a+' TO '+b;S(a===b?'blip':'win');return true;}return false;};
 const doMove=m=>{const t=g.turn;g.st=cbPlay(g.st,m,t);g.lastC=CBO[m.p][m.o].map(([cx,cy])=>(cy+m.y)*14+cx+m.x);S('hit');const[x,y]=[OX+(m.x+1)*CS,OY+(m.y+1)*CS];A.burst(x,y,COL[t],12,1.6);if(g.st.np[t]===21){g.pass[t]=true;g.msg=nm(g,t)+' PLACED ALL!';}next();};
 const next=()=>{g.turn=1-g.turn;g.or=0;if(endCheck())return;prep();if(g.pass[g.turn]){g.msg=nm(g,g.turn)+' IS BLOCKED';g.wait=50;if(!endCheck()){}}};
 g.turn=0;prep();
 g.timeUp=()=>{const a=cbScore(g.st,0),b=cbScore(g.st,1);return tupT(g,a===b?-1:a>b?0:1);};
 g.update=()=>{touch(g);if(g.over)return;if(g.wait){if(--g.wait===0){g.turn=1-g.turn;if(!endCheck()){prep();if(g.pass[g.turn]){g.wait=30;}}}return;}const t=g.turn;
  if(g.pass[t]){g.wait=20;return;}
  if(isCPU(g,t)){if(cpuGo(g)){const m=cbCPU(g.st,t,LVL(t),BUD(t));if(m)doMove(m);else{g.pass[t]=true;g.wait=30;}}return;}
  const I=inp(g,t);
  if(I.mv){if(I.x>=TX-2){const col=cl(Math.floor((I.x-TX)/40),0,2),row=cl(Math.floor((I.y-TY)/27),0,6);g.inT=true;g.tc=row*3+col;}else if(I.x>=OX&&I.y>=OY&&I.x<OX+14*CS&&I.y<OY+14*CS){g.inT=false;g.cu.x=Math.floor((I.x-OX)/CS);g.cu.y=Math.floor((I.y-OY)/CS);}}
  if(g.inT){const c0=g.tc;let col=g.tc%3,row=g.tc/3|0;if(I.l){if(col===0){g.inT=false;g.cu.x=13;g.cu.y=cl(row*2,0,13);}else col--;}if(I.r)col=Math.min(2,col+1);if(I.u)row=Math.max(0,row-1);if(I.d)row=Math.min(6,row+1);g.tc=row*3+col;if(g.tc!==c0||!g.inT)S('blip');
   if(I.a){const p=20-g.tc;if(!g.st.used[t][p]){g.pc[t]=p;g.or=0;g.inT=false;S('coin');}else S('lose');}if(I.b&&!I.a){g.or=(g.or+1)%CBO[g.pc[t]].length;S('blip');}return;}
  if(I.r&&g.cu.x===13&&!I.mv){g.inT=true;g.tc=cl(Math.floor(g.cu.y/2),0,6)*3;S('blip');return;}
  moveCur(I,g.cu,14,14);if(I.b){g.or=(g.or+1)%CBO[g.pc[t]].length;S('blip');}
  if(I.a){const[x,y]=ghostXY(),cells=CBO[g.pc[t]][g.or];if(cbOk(g.st.b,t+1,!g.st.np[t],CBST[t],cells,x,y))doMove({p:g.pc[t],o:g.or,x,y});else{S('lose');g.msg='MUST TOUCH A CORNER';g.mt=50;}}};
 g.draw=()=>{table('#121620');const c=A.c,s=g.st,t=g.turn;frame(OX,OY,14*CS,14*CS,'ebon',5);c.fillStyle='#e8e4dc';c.fillRect(OX,OY,14*CS,14*CS);
  for(let i=0;i<196;i++){const x=OX+(i%14)*CS,y=OY+(i/14|0)*CS;if(s.b[i])tile(x,y,CS,COL[s.b[i]-1]);else{c.fillStyle=(i%14+(i/14|0))%2?'#dedad0':'#e8e4dc';c.fillRect(x,y,CS,CS);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x,y+CS-1,CS,1);c.fillRect(x+CS-1,y,1,CS);}}
  for(let k=0;k<2;k++)if(!s.b[CBST[k]]){const i=CBST[k];disc(OX+(i%14)*CS+CS/2,OY+(i/14|0)*CS+CS/2,3.5,COL[k]);}
  if(g.lastC.length&&!g.over){c.globalAlpha=.35+.25*pulse();c.strokeStyle='#ffffff';c.lineWidth=1.2;for(const i of g.lastC)c.strokeRect(OX+(i%14)*CS+1.5,OY+(i/14|0)*CS+1.5,CS-3,CS-3);c.globalAlpha=1;}
  const hum=!isCPU(g,t)&&!g.over&&!g.pass[t]&&!g.wait;
  if(hum){for(const i of cbAnc(s.b,t+1,!s.np[t],CBST[t]))disc(OX+(i%14)*CS+CS/2,OY+(i/14|0)*CS+CS/2,1.6,'rgba(40,180,90,.8)');
   if(!g.inT){const[x,y]=ghostXY(),cells=CBO[g.pc[t]][g.or],ok=cbOk(s.b,t+1,!s.np[t],CBST[t],cells,x,y);for(const[cx,cy]of cells){const X=cx+x,Y=cy+y;if(X<0||Y<0||X>13||Y>13)continue;tile(OX+X*CS,OY+Y*CS,CS,ok?COL[t]:'#c02030',.45+.3*pulse());}c.strokeStyle=t?K.p:K.c;c.lineWidth=1;c.strokeRect(OX+g.cu.x*CS+.5,OY+g.cu.y*CS+.5,CS-1,CS-1);}}
  const tt=hum||A.two?t:g.p1s;plate(TX-4,TY-4,122,196,hum&&g.inT,K.y);
  for(let k=0;k<21;k++){const p=20-k,col=k%3,row=k/3|0,bx=TX+col*40,by=TY+row*27,used=s.used[tt][p];const sel=g.pc[tt]===p,cur=hum&&g.inT&&g.tc===k;if(sel){c.fillStyle='rgba(255,220,80,.18)';c.fillRect(bx,by,38,25);}if(cur){c.strokeStyle=K.y;c.lineWidth=1.5;c.strokeRect(bx+.5,by+.5,37,24);}
   if(used)continue;const o=sel&&!g.inT?g.or:0,cells=CBO[p][o],[w,h]=sz(p,o),ms=Math.min(5,Math.floor(Math.min(34/w,21/h))),ox=bx+19-w*ms/2,oy=by+12.5-h*ms/2;for(const[cx,cy]of cells)tile(ox+cx*ms,oy+cy*ms,ms,COL[tt]);}
  const sa=cbScore(s,0),sb=cbScore(s,1);plate(4,2,96,20,t===0&&!g.over,K.c);tile(8,6,11,COL[0]);T(nm(g,0)+' '+sa,24,8,K.w,1);T(21-s.np[0]+' LEFT',96,8,K.gr,1,'r');plate(104,2,96,20,t===1&&!g.over,K.p);tile(108,6,11,COL[1]);T(nm(g,1)+' '+sb,124,8,K.w,1);T(21-s.np[1]+' LEFT',196,8,K.gr,1,'r');
  if(g.mt)g.mt--;const msg=g.over?g.msg:g.mt?g.msg:g.wait?g.msg:isCPU(g,t)?nm(g,t)+' THINKING'+'...'.slice(0,(A.t>>4)%4):g.inT?'A PICKS  B TURNS  LEFT: BOARD':'A PLACES  B TURNS';T(msg,160,229,g.mt?K.r:K.y,1,'c');T(hum&&!g.inT?'GREEN DOTS = OPEN CORNERS':'',OX+91,216,K.gr,1,'c');};
 return g;}});

/* ================= MARBLE PUSH (Abalone rules) ================= */
const MC=[],MCI={};for(let r=-4;r<=4;r++)for(let q=-4;q<=4;q++)if(Math.abs(q+r)<=4){MCI[q+','+r]=MC.length;MC.push([q,r]);}
const MD=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];const MNB=MC.map(([q,r])=>MD.map(d=>{const k=(q+d[0])+','+(r+d[1]);return k in MCI?MCI[k]:-1;}));
const MDV=MD.map(([q,r])=>[q+r/2,r*.866]);const MCEN=MC.map(([q,r])=>Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r)));
const mpInline=(b,v,lead,k,size)=>{const p=MNB[lead][k];if(p<0)return null;if(!b[p])return{push:0,off:false};if(b[p]===v)return null;let n=0,c=p;while(c>=0&&b[c]&&b[c]!==v){n++;c=MNB[c][k];}if(n>=size)return null;if(c>=0&&b[c])return null;return{push:n,off:c<0};};
const MPG={
 moves(s){const out=[],v=s.t+1,b=s.b;for(let i=0;i<61;i++){if(b[i]!==v)continue;for(let k=0;k<6;k++){const n=MNB[i][k];if(n>=0&&!b[n])out.push({c:[i],k,push:0,off:false});}
  for(let a=0;a<3;a++){const j=MNB[i][a];if(j<0||b[j]!==v)continue;const l=MNB[j][a],gs=[[i,j]];if(l>=0&&b[l]===v)gs.push([i,j,l]);
   for(const gp of gs){for(let k=0;k<6;k++){if(k===a||k===(a+3)%6){const lead=k===a?gp[gp.length-1]:gp[0],r=mpInline(b,v,lead,k,gp.length);if(r)out.push({c:gp,k,push:r.push,off:r.off});}else if(gp.every(c=>{const n=MNB[c][k];return n>=0&&!b[n];}))out.push({c:gp,k,push:0,off:false});}}}}return out;},
 play(s,m){const b=s.b.slice(),cap=s.cap.slice(),v=s.t+1,mv=m.c.slice();if(m.push){const a=m.c.length>1?(MNB[m.c[0]][m.k]===m.c[1]?m.c[m.c.length-1]:m.c[0]):m.c[0];let c=MNB[a][m.k];for(let i=0;i<m.push;i++){mv.push(c);c=MNB[c][m.k];}}
  for(const c of mv)b[c]=0;for(const c of mv){const d=MNB[c][m.k];if(d>=0)b[d]=s.b[c];else if(s.b[c]!==v)cap[s.t]++;}return{b,cap,t:1-s.t,n:s.n+1};},
 over(s,ply){if(s.cap[1-s.t]>=6)return -WIN+ply;return null;},stuck(s,ply){return -WIN+ply;},
 ev(s){const me=s.t+1,b=s.b;let e=(s.cap[s.t]-s.cap[1-s.t])*140;for(let i=0;i<61;i++){const v=b[i];if(!v)continue;const sg=v===me?1:-1;let w=(4-MCEN[i])*4;if(MCEN[i]===4)w-=5;for(let k=0;k<3;k++){const n=MNB[i][k];if(n>=0&&b[n]===v)w+=1.6;}e+=sg*w;}return e;},
 order(s,mv){for(const m of mv)m.o=(m.off?100:0)+m.push*10+m.c.length;mv.sort((a,b)=>b.o-a.o);}};
A.add({id:'marblepush',name:'MARBLE PUSH',cat:'BOARD',vs:1,warm:30,time:600,how:'PICK 1-3 MARBLES IN A LINE, THEN A GREEN TARGET. OUTNUMBER TO PUSH. EJECT 6 TO WIN.',make(){
 const g=base(),b=Array(61).fill(0);MC.forEach(([q,r],i)=>{if(r>=3||(r===2&&q>=-2&&q<=0))b[i]=1;if(r<=-3||(r===-2&&q>=0&&q<=2))b[i]=2;});g.st={b,cap:[0,0],t:0,n:0};g.sel=[];g.legal=[];g.anim=null;g.last=null;
 const OX=118,OY=121,DX=23.5,DY=20.5,PT=MC.map(([q,r])=>[OX+(q+r/2)*DX,OY+r*DY]);g.c=MC.findIndex(c=>c[0]===-1&&c[1]===2);
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=MPG.moves(s);if(s.cap[1-s.t]>=6){g.over=winT(g,1-s.t);g.msg='SIX MARBLES EJECTED';S('win');}else if(!g.legal.length){g.over=winT(g,1-s.t);g.msg='NO MOVES';}};
 const markers=()=>{const set=new Set(g.sel),out=[];for(const m of g.legal){if(m.c.length!==set.size||!m.c.every(c=>set.has(c)))continue;let lead=m.c[0],bp=-1e9;for(const c of m.c){const p=PT[c][0]*MDV[m.k][0]+PT[c][1]*MDV[m.k][1];if(p>bp){bp=p;lead=c;}}out.push({m,cell:MNB[lead][m.k]});}return out;};
 const doMove=m=>{const s=g.st,ns=MPG.play(s,m);g.anim={k:0,k_:m.k,from:s.b.slice(),cells:new Set()};
  const a=m.push?(m.c.length>1?(MNB[m.c[0]][m.k]===m.c[1]?m.c[m.c.length-1]:m.c[0]):m.c[0]):-1;const mv=m.c.slice();if(m.push){let c=MNB[a][m.k];for(let i=0;i<m.push;i++){mv.push(c);c=MNB[c][m.k];}}mv.forEach(c=>g.anim.cells.add(c));
  g.st=ns;g.last=m;g.sel=[];S(m.push?'hit':'blip');if(m.off){const e=mv[mv.length-1];fxHit(PT[e][0]+(MD[m.k][0]+MD[m.k][1]/2)*DX,PT[e][1]+MD[m.k][1]*DY,K.r);S('boom');g.msg='EJECTED!';}finish();};
 finish();
 g.timeUp=()=>{const s=g.st,a=s.cap[0],b_=s.cap[1];if(a!==b_)return tupT(g,a>b_?0:1);const e=MPG.ev({b:s.b,cap:s.cap,t:0});return tupT(g,Math.abs(e)<8?-1:e>0?0:1);};
 g.update=()=>{touch(g);if(g.anim){g.anim.k+=demo(g)?.34:.1;if(g.anim.k>=1)g.anim=null;return;}if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(MPG,s,cfg(t,[{maxD:1,noise:30},{maxD:2,noise:3},{maxD:5}]));if(m)doMove(m);}return;}
  const I=inp(g,t);g.c=ptCur(I,PT,g.c);if(I.b&&g.sel.length){g.sel=[];S('blip');}if(!I.a)return;const c=g.c,v=t+1;
  const mk=markers().find(o=>o.cell===c);if(mk){doMove(mk.m);return;}
  if(s.b[c]===v){if(g.sel.includes(c)){g.sel=[];S('blip');return;}const ns=g.sel.concat([c]);if(ns.length<=3&&g.legal.some(m=>m.c.length===ns.length&&ns.every(x=>m.c.includes(x))))g.sel=ns;else g.sel=[c];S('blip');return;}S('lose');};
 g.draw=()=>{table('#101418');const c=A.c,s=g.st,t=s.t;const hx=(f,dx,dy)=>{const P=[[0,-4],[4,-4],[4,0],[0,4],[-4,4],[-4,0]].map(([q,r])=>[OX+(q+r/2)*DX*f+dx,OY+r*DY*f+dy]);c.beginPath();c.moveTo(P[0][0],P[0][1]);for(const p of P)c.lineTo(p[0],p[1]);c.closePath();};
  hx(1.27,3,5);c.fillStyle='rgba(0,0,0,.5)';c.fill();hx(1.27,0,0);c.fillStyle=lg(0,10,0,230,[[0,'#6a3a1c'],[.5,'#4a2410'],[1,'#6a3a1c']],'#5a3018');c.fill();hx(1.17,0,0);c.fillStyle=lg(0,20,0,220,[[0,'#8a5a32'],[.5,'#6a3e1e'],[1,'#8a5a32']],'#7a4a28');c.fill();c.strokeStyle='rgba(255,220,170,.35)';c.lineWidth=1;c.stroke();
  const ms=g.sel.length&&!isCPU(g,t)?markers():[];const hide=g.anim?g.anim.cells:null;
  PT.forEach((p,i)=>{disc(p[0],p[1],9.5,rg(p[0]-2,p[1]-3,1,p[0],p[1],10,[[0,'#1a0c04'],[.8,'#3a200c'],[1,'rgba(255,210,160,.55)']],'#2a1408'));});
  if(g.last&&!g.anim)for(const i of g.last.c){const n=MNB[i][g.last.k];if(n>=0)ring2(PT[n][0],PT[n][1],12,'rgba(255,220,120,.35)',1);}
  const src=g.anim?g.anim.from:s.b,off=k=>[(MD[k][0]+MD[k][1]/2)*DX,MD[k][1]*DY];
  src.forEach((v,i)=>{if(!v||(hide&&hide.has(i)))return;piece(PT[i][0],PT[i][1],10,v===1?'shell':'slate',{sel:g.sel.includes(i)});});
  if(g.anim){const a=g.anim,e=a.k*a.k*(3-2*a.k),[ox,oy]=off(a.k_);for(const h of a.cells){const v=a.from[h];if(!v)continue;const p=PT[h],gone=MNB[h][a.k_]<0;c.globalAlpha=gone?Math.max(0,1-e):1;piece(p[0]+ox*e,p[1]+oy*e,10,v===1?'shell':'slate');c.globalAlpha=1;}}
  ms.forEach(o=>{const p=PT[o.cell];disc(p[0],p[1],4,'rgba(80,255,140,'+(.5+.35*pulse())+')');if(o.m.push)ring2(p[0],p[1],11,'rgba(255,90,90,.9)',1.5);});
  if(!isCPU(g,t)&&!g.over&&!g.anim){const p=PT[g.c];ring2(p[0],p[1],12.5,t?K.p:K.c,2);}
  panel(g,{mat:['shell','slate'],stat:[0,1].map(v=>'EJECTED '+s.cap[v]+'/6'),stat2:[0,1].map(v=>'MARBLES '+s.b.filter(x=>x===v+1).length),
   lines:[[isCPU(g,t)?'':g.sel.length?'PICK A GREEN DOT':'PICK MARBLES',K.y],[isCPU(g,t)?'':'A ADDS UP TO 3',K.gr],['RED RING = PUSH',K.r],g.over?[g.msg,K.c]:[g.sel.length?'B CLEARS':'',K.gr]]});};
 return g;}});

/* ================= MINI SHOGI (5x5 Gogo shogi) ================= */
const SHV=[0,0,6,5,8,10,1,6,11,13,7],SHU={7:3,8:4,9:5,10:6},SHP={3:7,4:8,5:9,6:10},SHL=['','K','G','S','B','R','P','S','B','R','P'];
const SHK=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],SHO=[[1,0],[-1,0],[0,1],[0,-1]],SHD=[[1,1],[1,-1],[-1,1],[-1,-1]];
const SHST=[0,1].map(t=>{const f=t?1:-1,G=[[0,f],[1,f],[-1,f],[1,0],[-1,0],[0,-f]];return[[],SHK,G,[[0,f],[1,f],[-1,f],[1,-f],[-1,-f]],[],[],[[0,f]],G,SHO,SHD,G];});
const SHSL=[null,null,null,null,SHD,SHO,null,null,SHD,SHO,null];
const SH={};
SH.att=(b,sq,by)=>{const sg=by?-1:1,X=sq%5,Y=sq/5|0;for(let i=0;i<25;i++){const v=b[i];if(v*sg<=0)continue;const ty=v*sg,x=i%5,y=i/5|0,dx=X-x,dy=Y-y;for(const s of SHST[by][ty])if(s[0]===dx&&s[1]===dy)return true;const sl=SHSL[ty];if(sl){for(const d of sl){let nx=x+d[0],ny=y+d[1];while(nx>=0&&ny>=0&&nx<5&&ny<5){if(nx===X&&ny===Y)return true;if(b[ny*5+nx])break;nx+=d[0];ny+=d[1];}}}}return false;};
SH.king=(b,t)=>b.indexOf(t?-1:1);
SH.play=(s,m)=>{const b=s.b.slice(),h=[s.h[0].slice(),s.h[1].slice()],t=s.t,sg=t?-1:1;if(m.f<0){b[m.t]=sg*m.d;h[t][m.d]--;}else{const cap=b[m.t];if(cap){const ct=Math.abs(cap);h[t][SHU[ct]||ct]++;}let ty=b[m.f]*sg;if(m.pr)ty=SHP[ty];b[m.t]=sg*ty;b[m.f]=0;}return{b,h,t:1-t};};
SH.pseudo=s=>{const out=[],t=s.t,b=s.b,sg=t?-1:1,zone=y=>t?y===4:y===0;
 for(let i=0;i<25;i++){const v=b[i];if(v*sg<=0)continue;const ty=v*sg,x=i%5,y=i/5|0;
  const add=n=>{const ny=n/5|0,can=SHP[ty]&&(zone(y)||zone(ny));if(ty===6&&zone(ny)){out.push({f:i,t:n,pr:1,c:b[n]});return;}out.push({f:i,t:n,pr:0,c:b[n]});if(can)out.push({f:i,t:n,pr:1,c:b[n]});};
  for(const d of SHST[t][ty]){const nx=x+d[0],ny=y+d[1];if(nx<0||ny<0||nx>4||ny>4)continue;const n=ny*5+nx;if(b[n]*sg>0)continue;add(n);}
  const sl=SHSL[ty];if(sl)for(const d of sl){let nx=x+d[0],ny=y+d[1];while(nx>=0&&ny>=0&&nx<5&&ny<5){const n=ny*5+nx;if(b[n]*sg>0)break;add(n);if(b[n])break;nx+=d[0];ny+=d[1];}}}
 for(let ty=2;ty<=6;ty++){if(!s.h[t][ty])continue;for(let n=0;n<25;n++){if(b[n])continue;if(ty===6){const y=n/5|0,x=n%5;if(zone(y))continue;let nf=false;for(let yy=0;yy<5;yy++)if(b[yy*5+x]===sg*6){nf=true;break;}if(nf)continue;}out.push({f:-1,t:n,d:ty,pr:0,c:0});}}return out;};
SH.legal=(s,deep)=>{const t=s.t,out=[];for(const m of SH.pseudo(s)){const ns=SH.play(s,m),k=SH.king(ns.b,t);if(k>=0&&SH.att(ns.b,k,1-t))continue;
  if(m.d===6&&deep!==false){const ok=SH.king(ns.b,1-t);if(ok>=0&&SH.att(ns.b,ok,t)&&!SH.legal(ns,false).length)continue;}out.push(m);}return out;};
SH.check=s=>{const k=SH.king(s.b,s.t);return k>=0&&SH.att(s.b,k,1-s.t);};
SH.key=s=>s.b.join(',')+'|'+s.h[0].join('')+s.h[1].join('')+s.t;
const SHG={moves:s=>SH.legal(s),play:SH.play,over:()=>null,stuck:(s,ply)=>-WIN+ply,
 ev(s){const me=s.t,sm=me?-1:1;let e=0;const k0=SH.king(s.b,me),k1=SH.king(s.b,1-me);for(let i=0;i<25;i++){const v=s.b[i];if(!v)continue;const ty=Math.abs(v),own=v*sm>0,y=i/5|0;let w=SHV[ty]*100;if(ty===6||ty===3)w+=(own?(me?y:4-y):(me?4-y:y))*4;
  const kk=own?k1:k0;if(kk>=0&&ty!==1){const dd=Math.max(Math.abs(i%5-kk%5),Math.abs(y-(kk/5|0)));if(dd<=1)w+=22;else if(dd===2)w+=8;}e+=own?w:-w;}
  for(let ty=2;ty<=6;ty++)e+=(s.h[me][ty]-s.h[1-me][ty])*SHV[ty]*112;return e;},
 order(s,mv){for(const m of mv)m.o=(m.c?SHV[Math.abs(m.c)]*10:0)+(m.pr?5:0)-(m.f<0?1:0);mv.sort((a,b)=>b.o-a.o);}};
A.add({id:'minishogi',name:'MINI SHOGI',cat:'BOARD',vs:1,warm:30,time:600,how:'MOVE ON THE 5X5 BOARD OR DROP CAPTURED PIECES (RIGHT EDGE = HAND). CHECKMATE THE KING.',make(){
 const g=base(),b=new Int8Array(25);[1,2,3,4,5].forEach((ty,x)=>{b[20+x]=ty;b[4-x]=-ty;});b[15]=6;b[9]=-6;
 g.st={b:Array.from(b),h:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],t:0};g.c={x:0,y:3};g.inH=false;g.hc=0;g.sel=null;g.promo=null;g.last=null;g.hist=[];g.anim=null;
 const OX=12,OY=24,CS=38,HT=[5,4,2,3,6],HX=214,HW=20;
 const histPush=()=>{g.hist.push({k:SH.key(g.st),chk:SH.check(g.st),t:g.st.t});};
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=SH.legal(s);histPush();const key=g.hist[g.hist.length-1].k,occ=g.hist.filter(e=>e.k===key);g.chk=SH.check(s);
  if(!g.legal.length){g.over=winT(g,1-s.t);g.msg=g.chk?'CHECKMATE':'NO LEGAL MOVES';S('win');return;}
  if(occ.length>=4){const from=g.hist.findIndex(e=>e.k===key),seg=g.hist.slice(from);const perp=t=>{const L_=seg.filter(e=>e.t===1-t);return L_.length&&L_.every(e=>e.chk);};let loser=0;if(perp(0))loser=0;else if(perp(1))loser=1;g.over=winT(g,1-loser);g.msg=perp(0)||perp(1)?'PERPETUAL CHECK':'REPETITION: SENTE LOSES';}};
 const sqXY=i=>[OX+(i%5)*CS+CS/2,OY+(i/5|0)*CS+CS/2],handXY=(t,k)=>[HX+k*HW+HW/2,t?36:206];
 const doMove=m=>{const s=g.st,t=s.t,from=m.f<0?handXY(t,HT.indexOf(m.d)):sqXY(m.f),to=sqXY(m.t);g.anim={a:from,b:to,k:0,i:m.t};g.st=SH.play(s,m);g.last=m;g.sel=null;g.inH=false;g.promo=null;S(m.c?'hit':'blip');if(m.c){fxHit(to[0],to[1],K.y);}if(m.pr){A.burst(to[0],to[1],K.r,14,1.5);S('score');}finish();if(g.chk&&!g.over){g.msg='CHECK!';S('boom');}else if(!g.over)g.msg='';};
 finish();
 const mat=t=>{let e=0;for(const v of g.st.b){if(v&&(v>0)===(t===0))e+=SHV[Math.abs(v)];}for(let ty=2;ty<=6;ty++)e+=g.st.h[t][ty]*SHV[ty];return e;};
 g.timeUp=()=>{const a=mat(0),b_=mat(1);return tupT(g,a===b_?-1:a>b_?0:1);};
 g.update=()=>{touch(g);if(g.anim){g.anim.k+=demo(g)?.34:.12;if(g.anim.k>=1)g.anim=null;}if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(SHG,s,cfg(t,[{maxD:1,noise:260},{maxD:3,noise:25},{maxD:9}]));if(m)doMove(m);}return;}
  const I=inp(g,t);
  if(g.promo){if(I.a||I.b){const ms=g.legal.filter(m=>m.f===g.promo.f&&m.t===g.promo.t),m=ms.find(m=>m.pr===(I.a?1:0))||ms[0];if(m)doMove(m);}return;}
  if(I.mv){if(I.x>=HX&&Math.abs(I.y-handXY(t,0)[1])<14){g.inH=true;g.hc=cl(Math.floor((I.x-HX)/HW),0,4);}else if(I.x>=OX&&I.x<OX+5*CS&&I.y>=OY&&I.y<OY+5*CS){g.inH=false;g.c.x=Math.floor((I.x-OX)/CS);g.c.y=Math.floor((I.y-OY)/CS);}}
  if(g.inH){const h0=g.hc;if(I.l){if(g.hc===0){g.inH=false;g.c.x=4;}else g.hc--;}if(I.r)g.hc=Math.min(4,g.hc+1);if(I.u||I.d){g.inH=false;g.c.x=4;}if(g.hc!==h0||!g.inH)S('blip');
   if(I.a&&g.inH){const ty=HT[g.hc];if(s.h[t][ty]&&g.legal.some(m=>m.f<0&&m.d===ty)){g.sel={drop:ty};S('blip');g.inH=false;}else S('lose');}if(I.b){g.sel=null;}return;}
  if(I.r&&g.c.x===4&&!I.mv){g.inH=true;g.hc=0;S('blip');return;}
  moveCur(I,g.c,5,5);if(I.b&&g.sel){g.sel=null;S('blip');}if(!I.a)return;const i=g.c.y*5+g.c.x,sg=t?-1:1;
  if(g.sel){const ms=g.sel.drop?g.legal.filter(m=>m.f<0&&m.d===g.sel.drop&&m.t===i):g.legal.filter(m=>m.f===g.sel.f&&m.t===i);if(ms.length){if(ms.length>1){g.promo={f:ms[0].f,t:i};S('score');}else doMove(ms[0]);return;}}
  if(s.b[i]*sg>0){if(g.legal.some(m=>m.f===i)){g.sel={f:i};S('blip');}else S('lose');}else{S('lose');g.sel=null;}};
 const shPiece=(x,y,v,sc,hl)=>{const c=A.c,up=v>0,ty=Math.abs(v),w=13*sc,h=16*sc,d=up?1:-1;c.save();c.translate(x,y);oval(1.5,3+h*.45*0,w*.9,h*.75,0,'rgba(0,0,0,.0)');
  const P=[[0,-h],[w*.62,-h*.62],[w*.82,h*.95],[-w*.82,h*.95],[-w*.62,-h*.62]].map(p=>[p[0],p[1]*d]);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();P.forEach((p,k)=>k?c.lineTo(p[0]+1.5,p[1]+2.5):c.moveTo(p[0]+1.5,p[1]+2.5));c.closePath();c.fill();
  c.fillStyle=up?lg(-w,-h,w,h,[[0,'#fdeec4'],[.55,'#ecca86'],[1,'#bc8e48']],'#ecca86'):lg(-w,-h,w,h,[[0,'#e8c890'],[.55,'#c89a58'],[1,'#8a5e28']],'#c89a58');c.beginPath();P.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.strokeStyle=hl?'#ffe060':'rgba(80,40,10,.75)';c.lineWidth=hl?2:1;c.stroke();
  c.strokeStyle='rgba(120,70,20,.18)';c.lineWidth=.6;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(-w*.7,k*h*.3+1);c.lineTo(w*.7,k*h*.3-1);c.stroke();}c.restore();
  const pr=ty>=7,L_=SHL[ty],ink=pr?'#c01818':ty===1?'#1a1010':'#2a1a10';if(sc>=1){T(L_,x-(pr?1:3),y-5+(up?2:-1),ink,2,pr?'l':'l',1);if(pr)T('+',x-8,y-3+(up?2:-1),ink,1,'l',1);}else{T((pr?'+':'')+L_,x,y-2,ink,1,'c',1);}};
 g.draw=()=>{table('#1c1712');const c=A.c,s=g.st,t=s.t;frame(OX,OY,5*CS,5*CS,'walnut',7);wood(OX,OY,5*CS,5*CS,'kaya',17);c.strokeStyle='rgba(40,20,4,.75)';c.lineWidth=1;for(let k=0;k<=5;k++){c.beginPath();c.moveTo(OX+k*CS+.5,OY);c.lineTo(OX+k*CS+.5,OY+5*CS);c.stroke();c.beginPath();c.moveTo(OX,OY+k*CS+.5);c.lineTo(OX+5*CS,OY+k*CS+.5);c.stroke();}
  c.fillStyle='rgba(255,40,40,.07)';c.fillRect(OX,OY,5*CS,CS);c.fillStyle='rgba(40,120,255,.07)';c.fillRect(OX,OY+4*CS,5*CS,CS);
  const hum=!isCPU(g,t)&&!g.over;if(g.last){const[x,y]=sqXY(g.last.t);c.fillStyle='rgba(255,210,80,.22)';c.fillRect(x-CS/2,y-CS/2,CS,CS);if(g.last.f>=0){const[a,b_]=sqXY(g.last.f);c.fillStyle='rgba(255,210,80,.12)';c.fillRect(a-CS/2,b_-CS/2,CS,CS);}}
  if(g.chk&&!g.over){const k=SH.king(s.b,t);if(k>=0){const[x,y]=sqXY(k);c.fillStyle='rgba(255,40,40,'+(.25+.2*pulse())+')';c.fillRect(x-CS/2,y-CS/2,CS,CS);}}
  for(let i=0;i<25;i++){const v=s.b[i];if(!v||(g.anim&&g.anim.i===i))continue;const[x,y]=sqXY(i);shPiece(x,y+1,v,1,g.sel&&g.sel.f===i);}
  if(g.anim){const a=g.anim,e=a.k*a.k*(3-2*a.k),v=s.b[a.i];if(v)shPiece(a.a[0]+(a.b[0]-a.a[0])*e,a.b[1]===a.a[1]?a.a[1]:a.a[1]+(a.b[1]-a.a[1])*e-Math.sin(e*3.14)*5,v,1+Math.sin(e*3.14)*.12,0);}
  if(hum&&g.sel){const ms=g.sel.drop?g.legal.filter(m=>m.f<0&&m.d===g.sel.drop):g.legal.filter(m=>m.f===g.sel.f);for(const m of ms){const[x,y]=sqXY(m.t);if(s.b[m.t])ring2(x,y,15,'rgba(255,80,80,.85)',2);else dot(x,y,4);}}
  if(hum&&!g.inH){const x=OX+g.c.x*CS,y=OY+g.c.y*CS;c.strokeStyle=t?K.p:K.c;c.lineWidth=2;c.strokeRect(x+1,y+1,CS-2,CS-2);}
  for(let o=0;o<2;o++){const y=o?24:194;plate(HX-4,y,W-HX,24,hum&&g.inH&&t===o,o?K.p:K.c);HT.forEach((ty,k)=>{const[x,yy]=handXY(o,k),n=s.h[o][ty];c.globalAlpha=n?1:.22;shPiece(x,yy,(o?-1:1)*ty,.62,g.sel&&g.sel.drop===ty&&t===o);c.globalAlpha=1;if(n>1)T(n,x+8,yy+3,K.y,1);});
   if(hum&&g.inH&&t===o){const[x,yy]=handXY(o,g.hc);c.strokeStyle=K.y;c.lineWidth=1.5;c.strokeRect(x-HW/2+.5,yy-11.5,HW-1,23);}}
  for(let o=0;o<2;o++){const y=o?54:142,on=t===o&&!g.over;plate(HX-4,y,W-HX,40,on,o?K.p:K.c);T(nm(g,o),HX+2,y+6,on?K.w:K.gr,2);T(o?'TOP - HAND ABOVE':'BOTTOM - HAND BELOW',HX+2,y+22,K.gr,1);if(on&&isCPU(g,o)&&!demo(g))T('THINKING'+'...'.slice(0,(A.t>>4)%4),HX+2,y+31,K.c,1);}
  let msg=g.over?g.msg:g.promo?'PROMOTE? A YES  B NO':g.msg;T(msg,HX+48,104,g.promo?K.y:g.over?K.c:K.r,1,'c');T(hum&&!g.promo?(g.sel?'PICK A SQUARE':'PICK A PIECE'):'',HX+48,118,K.y,1,'c');T(hum&&!g.promo?'RIGHT EDGE: HAND':'',HX+48,128,K.gr,1,'c');};
 return g;}});

/* ---- shared pick-then-target UI for square-grid games ---- */
const gridSel=(g,I,nx,ny,OX,OY,CS,own)=>{moveCur(I,g.c,nx,ny);mouseGrid(I,g.c,nx,ny,OX,OY,CS);if(I.b&&g.sel>=0){g.sel=-1;S('blip');}if(!I.a)return null;const i=g.c.y*nx+g.c.x;
 if(g.sel>=0){const m=g.legal.find(m=>m.f===g.sel&&m.t===i);if(m)return m;}if(own(i)){if(g.legal.some(m=>m.f===i)){g.sel=i;S('blip');}else S('lose');}else{S('lose');g.sel=-1;}return null;};
const checker=(OX,OY,nx,ny,CS,a,b,seed)=>{wood(OX,OY,nx*CS,ny*CS,a,seed);const c=A.c;c.fillStyle=b;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)if((x+y)%2)c.fillRect(OX+x*CS,OY+y*CS,CS,CS);};
const selMarks=(g,cxy,CS,t,occ)=>{const hum=!isCPU(g,t)&&!g.over;if(g.last&&g.last.f>=0){const a=cxy(g.last.f),b=cxy(g.last.t),c=A.c;c.fillStyle='rgba(255,210,80,.2)';c.fillRect(a[0]-CS/2,a[1]-CS/2,CS,CS);c.fillRect(b[0]-CS/2,b[1]-CS/2,CS,CS);}
 if(hum&&g.sel>=0)for(const m of g.legal)if(m.f===g.sel){const[x,y]=cxy(m.t);if(occ(m.t))ring2(x,y,CS*.42,'rgba(255,80,80,.9)',2);else dot(x,y,CS*.13);}};
const gridCursor=(g,OX,OY,CS,t)=>{if(isCPU(g,t)||g.over)return;const c=A.c;c.strokeStyle=t?K.p:K.c;c.lineWidth=2;c.strokeRect(OX+g.c.x*CS+1,OY+g.c.y*CS+1,CS-2,CS-2);};
const slide=(g,from,to)=>{g.anim={a:from,b:to,k:0};};
const slideStep=g=>{if(g.anim){g.anim.k+=demo(g)?.34:.14;if(g.anim.k>=1)g.anim=null;}};
const slidePos=a=>{const e=a.k*a.k*(3-2*a.k);return[a.a[0]+(a.b[0]-a.a[0])*e,a.a[1]+(a.b[1]-a.a[1])*e-Math.sin(e*Math.PI)*5];};

/* ================= BREAKTHROUGH ================= */
const BTG={
 moves(s){const out=[],v=s.t+1,b=s.b,dy=s.t?1:-1;for(let i=0;i<64;i++){if(b[i]!==v)continue;const x=i%8,y=(i>>3)+dy;if(y<0||y>7)continue;for(const dx of[-1,0,1]){const nx=x+dx;if(nx<0||nx>7)continue;const n=y*8+nx,q=b[n];if(!q||(dx&&q!==v))if(!(dx===0&&q))out.push({f:i,t:n,c:q&&q!==v?1:0});}}return out;},
 play(s,m){const b=s.b.slice();b[m.t]=b[m.f];b[m.f]=0;const n=s.n.slice();if(m.c)n[1-s.t]--;return{b,n,t:1-s.t};},
 over(s,ply){const mv=1-s.t,gr=mv?7:0;for(let x=0;x<8;x++)if(s.b[gr*8+x]===mv+1)return -WIN+ply;if(!s.n[s.t])return -WIN+ply;return null;},
 stuck(s,ply){return -WIN+ply;},
 ev(s){const me=s.t,b=s.b;let e=(s.n[me]-s.n[1-me])*100;for(let i=0;i<64;i++){const v=b[i];if(!v)continue;const o=v-1,y=i>>3,x=i%8,adv=o?y:7-y,sg=o===me?1:-1;let w=adv*adv*1.6;if(adv===0)w+=x===2||x===5?14:6;
   const fy=y+(o?1:-1),by=y-(o?1:-1);let def=0,att=0;for(const dx of[-1,1]){const nx=x+dx;if(nx<0||nx>7)continue;if(by>=0&&by<8&&b[by*8+nx]===v)def++;if(fy>=0&&fy<8&&b[fy*8+nx]&&b[fy*8+nx]!==v)att++;}
   if(att&&!def)w-=o===me?12:45;else if(att)w-=o===me?2:8;w+=def*3;if(adv>=6){const can=fy>=0&&fy<8&&([-1,0,1].some(dx=>{const nx=x+dx;if(nx<0||nx>7)return false;const q=b[fy*8+nx];return dx?q!==v:!q;}));if(can)w+=o===me?900:300;}e+=sg*w;}return e;},
 order(s,mv){mv.sort((a,b)=>b.c-a.c);}};
A.add({id:'breakthrough',name:'BREAKTHROUGH',cat:'BOARD',vs:1,warm:30,time:420,how:'PAWNS STEP FORWARD, CAPTURE DIAGONALLY. FIRST TO REACH THE FAR ROW WINS.',make(){
 const g=base(),b=Array(64).fill(0);for(let i=0;i<16;i++){b[i]=2;b[48+i]=1;}g.st={b,n:[16,16],t:0};g.c={x:3,y:6};g.sel=-1;g.last=null;g.anim=null;
 const OX=10,OY=14,CS=26,cxy=i=>[OX+(i%8)*CS+CS/2,OY+(i>>3)*CS+CS/2];
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=BTG.moves(s);const o=BTG.over(s,0);if(o!==null){g.over=winT(g,1-s.t);g.msg=s.n[s.t]?'BROKE THROUGH!':'ALL PAWNS TAKEN';S('win');}else if(!g.legal.length){g.over=winT(g,1-s.t);g.msg='NO MOVES';}};
 const doMove=m=>{slide(g,cxy(m.f),cxy(m.t));g.animI=m.t;g.st=BTG.play(g.st,m);g.last=m;g.sel=-1;if(m.c){const[x,y]=cxy(m.t);fxHit(x,y,K.r);S('hit');}else S('blip');finish();};
 finish();
 g.timeUp=()=>{const s=g.st,a=s.n[0],b_=s.n[1];if(a!==b_)return tupT(g,a>b_?0:1);const e=BTG.ev({b:s.b,n:s.n,t:0});return tupT(g,Math.abs(e)<20?-1:e>0?0:1);};
 g.update=()=>{touch(g);slideStep(g);if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(BTG,s,cfg(t,[{maxD:2,noise:120},{maxD:4,noise:6},{maxD:12}]));if(m)doMove(m);}return;}
  const m=gridSel(g,inp(g,t),8,8,OX,OY,CS,i=>s.b[i]===t+1);if(m)doMove(m);};
 g.draw=()=>{table('#14100c');const c=A.c,s=g.st,t=s.t;frame(OX,OY,8*CS,8*CS,'walnut',6);checker(OX,OY,8,8,CS,'maple','rgba(90,40,10,.55)',21);
  c.fillStyle='rgba(60,140,255,.16)';c.fillRect(OX,OY,8*CS,CS);c.fillStyle='rgba(255,60,90,.16)';c.fillRect(OX,OY+7*CS,8*CS,CS);
  selMarks(g,cxy,CS,t,i=>s.b[i]);for(let i=0;i<64;i++){const v=s.b[i];if(!v||(g.anim&&g.animI===i))continue;const[x,y]=cxy(i);piece(x,y,10,v===1?'jade':'coral',{sel:i===g.sel});disc(x,y-1,3.2,v===1?'rgba(220,255,235,.35)':'rgba(255,230,220,.35)');}
  if(g.anim){const[x,y]=slidePos(g.anim),v=s.b[g.animI];if(v)piece(x,y,10,v===1?'jade':'coral');}gridCursor(g,OX,OY,CS,t);
  panel(g,{mat:['jade','coral'],stat:[0,1].map(v=>'PAWNS '+s.n[v]),stat2:[0,1].map(v=>v?'GOAL: BOTTOM ROW':'GOAL: TOP ROW'),lines:[[isCPU(g,t)?'':g.sel>=0?'PICK A SQUARE':'PICK A PAWN',K.y],['STRAIGHT: MOVE ONLY',K.gr],['DIAGONAL: CAPTURE',K.gr],g.over?[g.msg,K.c]:null]});};
 return g;}});

/* ================= LINES OF ACTION ================= */
const LD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
const loaConn=(b,v)=>{let st=-1,n=0;for(let i=0;i<64;i++)if(b[i]===v){n++;if(st<0)st=i;}if(n<=1)return true;const seen=new Uint8Array(64),q=[st];seen[st]=1;let k=1;while(q.length){const c=q.pop(),x=c%8,y=c>>3;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>7||ny>7)continue;const j=ny*8+nx;if(!seen[j]&&b[j]===v){seen[j]=1;k++;q.push(j);}}}return k===n;};
const loaGroups=(b,v)=>{const seen=new Uint8Array(64);let gN=0;for(let i=0;i<64;i++){if(b[i]!==v||seen[i])continue;gN++;const q=[i];seen[i]=1;while(q.length){const c=q.pop(),x=c%8,y=c>>3;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>7||ny>7)continue;const j=ny*8+nx;if(!seen[j]&&b[j]===v){seen[j]=1;q.push(j);}}}}return gN;};
const LOG={
 moves(s){const out=[],v=s.t+1,b=s.b,R_=new Int8Array(8),Cc=new Int8Array(8),D1=new Int8Array(15),D2=new Int8Array(15);for(let i=0;i<64;i++)if(b[i]){const x=i%8,y=i>>3;R_[y]++;Cc[x]++;D1[x-y+7]++;D2[x+y]++;}
  for(let i=0;i<64;i++){if(b[i]!==v)continue;const x=i%8,y=i>>3;for(const[dx,dy]of LD){const N=dy===0?R_[y]:dx===0?Cc[x]:dx===dy?D1[x-y+7]:D2[x+y],tx=x+dx*N,ty=y+dy*N;if(tx<0||ty<0||tx>7||ty>7)continue;const t=ty*8+tx;if(b[t]===v)continue;let ok=true;for(let k=1;k<N;k++){const q=b[(y+dy*k)*8+x+dx*k];if(q&&q!==v){ok=false;break;}}if(ok)out.push({f:i,t,c:b[t]?1:0});}}return out;},
 play(s,m){const b=s.b.slice();b[m.t]=b[m.f];b[m.f]=0;const n=s.n.slice();if(m.c)n[1-s.t]--;return{b,n,t:1-s.t};},
 over(s,ply){const mv=2-s.t,op=s.t+1;if(loaConn(s.b,mv))return -WIN+ply;if(loaConn(s.b,op))return WIN-ply;return null;},stuck(s,ply){return -WIN+ply;},
 side(b,v){let sx=0,sy=0,n=0;for(let i=0;i<64;i++)if(b[i]===v){sx+=i%8;sy+=i>>3;n++;}if(!n)return 0;const cx=sx/n,cy=sy/n;let d=0,cen=0;for(let i=0;i<64;i++)if(b[i]===v){const x=i%8,y=i>>3;d+=Math.max(Math.abs(x-cx),Math.abs(y-cy));cen+=Math.max(Math.abs(x-3.5),Math.abs(y-3.5));}const avg=d/n;return-avg*14-loaGroups(b,v)*6-cen*.6/n*4;},
 ev(s){const me=s.t+1,op=2-s.t;return LOG.side(s.b,me)-LOG.side(s.b,op)+(s.n[s.t]-s.n[1-s.t])*0;},
 order(s,mv){mv.sort((a,b)=>b.c-a.c);}};
A.add({id:'linesofaction',name:'LINES OF ACTION',cat:'BOARD',vs:1,warm:30,time:480,how:'MOVE EXACTLY AS MANY SQUARES AS PIECES ON THAT LINE. JOIN ALL YOUR PIECES TO WIN.',make(){
 const g=base(),b=Array(64).fill(0);for(let k=1;k<7;k++){b[k]=1;b[56+k]=1;b[k*8]=2;b[k*8+7]=2;}g.st={b,n:[12,12],t:0};g.c={x:3,y:7};g.sel=-1;g.last=null;g.anim=null;
 const OX=10,OY=14,CS=26,cxy=i=>[OX+(i%8)*CS+CS/2,OY+(i>>3)*CS+CS/2];
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=LOG.moves(s);const mv=1-s.t;if(loaConn(s.b,mv+1)){g.over=winT(g,mv);g.msg='ALL PIECES JOINED';S('win');}else if(loaConn(s.b,s.t+1)){g.over=winT(g,s.t);g.msg='ALL PIECES JOINED';S('win');}else if(!g.legal.length){g.over=winT(g,mv);g.msg='NO MOVES';}};
 const doMove=m=>{slide(g,cxy(m.f),cxy(m.t));g.animI=m.t;g.st=LOG.play(g.st,m);g.last=m;g.sel=-1;if(m.c){const[x,y]=cxy(m.t);fxHit(x,y,K.r);S('hit');}else S('blip');finish();};
 finish();
 g.timeUp=()=>{const s=g.st,a=loaGroups(s.b,1),b_=loaGroups(s.b,2);return tupT(g,a===b_?-1:a<b_?0:1);};
 g.update=()=>{touch(g);slideStep(g);if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(LOG,s,cfg(t,[{maxD:1,noise:40},{maxD:3,noise:4},{maxD:10}]));if(m)doMove(m);}return;}
  const m=gridSel(g,inp(g,t),8,8,OX,OY,CS,i=>s.b[i]===t+1);if(m)doMove(m);};
 g.draw=()=>{table('#12100e');const c=A.c,s=g.st,t=s.t;frame(OX,OY,8*CS,8*CS,'ebon',6);checker(OX,OY,8,8,CS,'oak','rgba(40,60,30,.5)',8);
  selMarks(g,cxy,CS,t,i=>s.b[i]);if(!isCPU(g,t)&&!g.over&&g.sel>=0){const[x,y]=cxy(g.sel);for(const m of g.legal)if(m.f===g.sel){const[a,b_]=cxy(m.t);c.strokeStyle='rgba(80,255,140,.35)';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(a,b_);c.stroke();}}
  for(let i=0;i<64;i++){const v=s.b[i];if(!v||(g.anim&&g.animI===i))continue;const[x,y]=cxy(i);piece(x,y,10.5,v===1?'walnut':'maple',{sel:i===g.sel});}
  if(g.anim){const[x,y]=slidePos(g.anim),v=s.b[g.animI];if(v)piece(x,y,10.5,v===1?'walnut':'maple');}gridCursor(g,OX,OY,CS,t);
  panel(g,{mat:['walnut','maple'],stat:[0,1].map(v=>'PIECES '+s.n[v]),stat2:[0,1].map(v=>'GROUPS '+loaGroups(s.b,v+1)),lines:[[isCPU(g,t)?'':g.sel>=0?'PICK A SQUARE':'PICK A PIECE',K.y],['JUMP OWN, NOT ENEMY',K.gr],['LAND ON ENEMY = TAKE',K.gr],g.over?[g.msg,K.c]:null]});};
 return g;}});

/* ---- side picker for asymmetric games: P1 chooses which side to play ---- */
const pickUpd=(g,n)=>{if(g.ph!=='pick')return false;if(demo(g)){g.p1s=0;g.cs=1;g.ph='play';return false;}const I=inp(g,0);if(I.l||I.r||I.u||I.d){g.pk^=1;S('blip');}if(I.mv&&I.y>96&&I.y<136&&I.x>40&&I.x<200)g.pk=I.x<120?0:1;
 if(I.a){g.p1s=g.pk;g.cs=1-g.pk;g.ph='play';S('coin');}return true;};
const pickDraw=(g,names,mats)=>{if(g.ph!=='pick')return;const c=A.c;c.fillStyle='rgba(0,0,0,.6)';c.fillRect(0,0,W,H);plate(30,62,180,104,true,K.y);T('PLAYER 1 PLAYS',120,72,K.w,2,'c');
 for(let k=0;k<2;k++){const x=40+k*84,on=g.pk===k;plate(x,96,76,40,on,on?K.y:null);piece(x+14,116,8,mats[k]);T(names[k],x+28,113,on?K.y:K.gr,1);}T('LEFT/RIGHT, THEN A',120,148,K.gr,1,'c');T(names[0]+' MOVES FIRST',120,156,K.gr,1,'c');};

/* ================= FOX AND GEESE ================= */
const FP=[],FPI=new Int8Array(49).fill(-1);for(let y=0;y<7;y++)for(let x=0;x<7;x++)if((x>=2&&x<=4)||(y>=2&&y<=4)){FPI[y*7+x]=FP.length;FP.push([x,y]);}
const fAt=(x,y)=>x<0||y<0||x>6||y>6?-1:FPI[y*7+x];
const FDIR=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
const FADJ=FP.map(([x,y])=>FDIR.filter((d,k)=>k<4||(x+y)%2===0).map(d=>({d,n:fAt(x+d[0],y+d[1]),l:fAt(x+2*d[0],y+2*d[1])})).filter(o=>o.n>=0));
const FOXWIN=8;
const FGG={
 fox(s){const out=[],f=s.f,gs=s.g;for(const o of FADJ[f])if(!gs[o.n])out.push({p:[f,o.n],c:[]});
  const dfs=(pos,path,caps,G)=>{for(const o of FADJ[pos]){if(o.l<0||!G[o.n]||G[o.l])continue;const G2=G.slice();G2[o.n]=0;const np=path.concat([o.l]),nc=caps.concat([o.n]);out.push({p:np,c:nc});dfs(o.l,np,nc,G2);}};dfs(f,[f],[],gs);return out;},
 geese(s){const out=[];for(let i=0;i<33;i++){if(!s.g[i])continue;for(const o of FADJ[i]){if(o.d[1]<0)continue;if(!s.g[o.n]&&o.n!==s.f)out.push({f:i,t:o.n});}}return out;},
 moves(s){return s.t?FGG.fox(s):FGG.geese(s);},
 play(s,m){const g2=s.g.slice();let f=s.f,n=s.n;if(s.t){f=m.p[m.p.length-1];for(const c of m.c)g2[c]=0;n-=m.c.length;}else{g2[m.f]=0;g2[m.t]=1;}return{g:g2,f,n,t:1-s.t};},
 over(s,ply){if(s.n<FOXWIN)return s.t===0?-WIN+ply:WIN-ply;return null;},stuck(s,ply){return -WIN+ply;},
 gv(s){let e=s.n*40;const seen=new Uint8Array(33),q=[s.f];seen[s.f]=1;let area=0,thr=0,mob=0;while(q.length){const c=q.pop();area++;for(const o of FADJ[c])if(!seen[o.n]&&!s.g[o.n]){seen[o.n]=1;q.push(o.n);}}
  for(const o of FADJ[s.f]){if(!s.g[o.n])mob++;else if(o.l>=0&&!s.g[o.l])thr++;}for(let i=0;i<33;i++)if(s.g[i])e+=FP[i][1]*1.2;return e-area*2-mob*5-thr*(s.t?28:9);},
 ev(s){const v=FGG.gv(s);return s.t?-v:v;},
 order(s,mv){if(s.t)mv.sort((a,b)=>b.c.length-a.c.length);}};
A.add({id:'foxgeese',name:'FOX AND GEESE',cat:'BOARD',vs:1,warm:30,time:420,how:'PICK A SIDE. GEESE MUST TRAP THE FOX. THE FOX JUMPS TO EAT GEESE AND WINS AT 6 EATEN.',make(){
 const g=base(),gs=Array(33).fill(0);FP.forEach(([x,y],i)=>{if(y<2||(y===2))gs[i]=1;});g.st={g:gs,f:fAt(3,4),n:13,t:0};g.ph='pick';g.pk=0;g.c=fAt(3,2);g.sel=-1;g.path=null;g.last=null;g.anim=null;
 const OX=24,OY=24,SP=32,PT=FP.map(([x,y])=>[OX+x*SP,OY+y*SP]);
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=FGG.moves(s);g.path=null;g.sel=-1;if(s.n<FOXWIN){g.over=winT(g,1);g.msg='THE FOX ATE '+(13-s.n);S('win');}else if(!g.legal.length){g.over=winT(g,s.t?0:1);g.msg=s.t?'FOX IS TRAPPED':'GEESE ARE STUCK';S('win');}};
 const doMove=m=>{const s=g.st;if(s.t){g.anim={pts:m.p.map(i=>PT[i]),k:0};m.c.forEach(c=>{fxHit(PT[c][0],PT[c][1],'#ffffff');});S(m.c.length?'boom':'hit');}else{g.anim={pts:[PT[m.f],PT[m.t]],k:0,goose:m.t};S('blip');}g.st=FGG.play(s,m);g.last=m;finish();};
 finish();
 g.timeUp=()=>tupT(g,13-g.st.n>=4?1:0);
 g.update=()=>{touch(g);if(pickUpd(g))return;if(g.anim){g.anim.k+=demo(g)?.4:.13;if(g.anim.k>=g.anim.pts.length-1)g.anim=null;return;}if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(FGG,s,cfg(t,[{maxD:2,noise:40},{maxD:5,noise:4},{maxD:14}]));if(m)doMove(m);}return;}
  const I=inp(g,t);g.c=ptCur(I,PT,g.c);if(I.b){if(g.path&&g.path.length>1){const m=g.legal.find(m=>m.p.length===g.path.length&&m.p.every((v,k)=>v===g.path[k]));if(m){doMove(m);return;}}g.sel=-1;g.path=null;S('blip');}
  if(!I.a)return;const c=g.c;
  if(t===0){if(g.sel>=0){const m=g.legal.find(m=>m.f===g.sel&&m.t===c);if(m){doMove(m);return;}}if(s.g[c]&&g.legal.some(m=>m.f===c)){g.sel=c;S('blip');}else S('lose');return;}
  const path=g.path||[s.f];if(c===path[path.length-1]&&path.length>1){const m=g.legal.find(m=>m.p.length===path.length&&m.p.every((v,k)=>v===path[k]));if(m)doMove(m);return;}
  const np=path.concat([c]),ext=g.legal.filter(m=>m.p.length>=np.length&&np.every((v,k)=>m.p[k]===v));if(!ext.length){S('lose');return;}
  const exact=ext.find(m=>m.p.length===np.length);if(exact&&ext.length===1){doMove(exact);return;}g.path=np;S('jump');const p=PT[c];A.burst(p[0],p[1],K.w,6,1);};
 g.draw=()=>{table('#16120c');const c=A.c,s=g.st,t=s.t;c.fillStyle='rgba(0,0,0,.45)';c.fillRect(OX+2*SP-14+3,OY-14+4,2*SP+28,6*SP+28);c.fillRect(OX-14+3,OY+2*SP-14+4,6*SP+28,2*SP+28);
  wood(OX+2*SP-14,OY-14,2*SP+28,6*SP+28,'teak',4);wood(OX-14,OY+2*SP-14,6*SP+28,2*SP+28,'teak',9);
  c.lineCap='round';for(const w of[[3,'rgba(40,18,4,.6)'],[1,'rgba(255,230,190,.35)']]){c.lineWidth=w[0];c.strokeStyle=w[1];FP.forEach((p,i)=>{for(const o of FADJ[i]){if(o.n<i)continue;c.beginPath();c.moveTo(PT[i][0],PT[i][1]);c.lineTo(PT[o.n][0],PT[o.n][1]);c.stroke();}});}
  PT.forEach(p=>disc(p[0],p[1],3.4,rg(p[0]-1,p[1]-1,0,p[0],p[1],4,[[0,'#3a2008'],[1,'#120800']],'#2a1408')));
  const hum=g.ph==='play'&&!isCPU(g,t)&&!g.over&&!g.anim;let caps=[];if(g.path&&hum){for(const m of g.legal)if(m.p.length===g.path.length&&m.p.every((v,k)=>v===g.path[k])){caps=m.c;break;}}
  if(hum){if(t===0&&g.sel>=0)g.legal.forEach(m=>{if(m.f===g.sel)dot(PT[m.t][0],PT[m.t][1],4);});if(t===1){const path=g.path||[s.f];g.legal.forEach(m=>{if(m.p.length>path.length&&path.every((v,k)=>m.p[k]===v)){const n=m.p[path.length];if(m.c.length>caps.length){ring2(PT[n][0],PT[n][1],9,'rgba(255,80,80,.9)',2);}else dot(PT[n][0],PT[n][1],4);}});}}
  const ag=g.anim&&g.anim.goose!==undefined?g.anim.goose:-1;
  s.g.forEach((v,i)=>{if(!v||i===ag)return;const p=PT[i];c.globalAlpha=caps.includes(i)?.35:1;piece(p[0],p[1],10,'shell',{sel:i===g.sel});c.globalAlpha=1;disc(p[0]+3,p[1]-1,2,'#f0a020');disc(p[0]-2,p[1]-2.5,1,'#111');});
  let fx=PT[s.f][0],fy=PT[s.f][1];if(g.path&&hum){fx=PT[g.path[g.path.length-1]][0];fy=PT[g.path[g.path.length-1]][1];}
  if(g.anim){const a=g.anim,k=Math.min(a.pts.length-1.001,a.k),i=Math.floor(k),f=k-i,P=a.pts[i],Q=a.pts[i+1],x=P[0]+(Q[0]-P[0])*f,y=P[1]+(Q[1]-P[1])*f-Math.sin(f*3.14)*6;if(ag>=0){piece(x,y,10,'shell');}else{fx=x;fy=y;}}
  piece(fx,fy,11.5,'amber',{sel:t===1&&hum});A.poly([[fx-7,fy-6],[fx-4,fy-14],[fx-1,fy-7]],'#c06010',1);A.poly([[fx+7,fy-6],[fx+4,fy-14],[fx+1,fy-7]],'#c06010',1);disc(fx-3,fy-2,1.3,'#111');disc(fx+3,fy-2,1.3,'#111');disc(fx,fy+3,1.6,'#2a1408');
  if(hum){const p=PT[g.c];ring2(p[0],p[1],13,owner(g,t)?K.p:K.c,2);}
  panel(g,{mat:['shell','amber'],stat:['GEESE '+s.n,'EATEN '+(13-s.n)+'/6'],stat2:['TRAP THE FOX','EAT 6 GEESE'],lines:[[!hum?'':t?(g.path?'JUMP AGAIN OR B':'MOVE THE FOX'):g.sel>=0?'PICK A SPOT':'PICK A GOOSE',K.y],['GEESE NEVER RETREAT',K.gr],g.over?[g.msg,K.c]:null]});
  pickDraw(g,['GEESE','FOX'],['shell','amber']);};
 return g;}});

/* ================= HNEFATAFL (9x9, corner escape) ================= */
const HN={};const HCOR=[0,8,72,80],HTH=40;
HN.restricted=i=>i===HTH||i===0||i===8||i===72||i===80;
HN.moves=s=>{const out=[],b=s.b,att=s.t===0;for(let i=0;i<81;i++){const v=b[i];if(!v||(att?v!==1:v===1))continue;const x=i%9,y=i/9|0,king=v===3;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,ny=y+dy;while(nx>=0&&ny>=0&&nx<9&&ny<9){const n=ny*9+nx;if(b[n])break;if(!HN.restricted(n)||king)out.push({f:i,t:n});else if(n!==HTH)break;nx+=dx;ny+=dy;}}}return out;};
HN.hostile=(b,n,forAtt)=>{if(HCOR.includes(n))return true;if(n===HTH)return forAtt?true:!b[HTH];return false;};
HN.play=(s,m)=>{const b=s.b.slice(),v=b[m.f];b[m.t]=v;b[m.f]=0;const att=v===1,x=m.t%9,y=m.t/9|0;let cap=0,kc=false;
 for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,fx=x+2*dx,fy=y+2*dy;if(nx<0||ny<0||nx>8||ny>8)continue;const n=ny*9+nx,e=b[n];if(!e)continue;
  if(att&&e===3){let sur=0;for(const[ex,ey]of[[1,0],[-1,0],[0,1],[0,-1]]){const kx=nx+ex,ky=ny+ey;if(kx<0||ky<0||kx>8||ky>8)break;const k=ky*9+kx;if(b[k]===1||k===HTH)sur++;}if(sur===4){b[n]=0;kc=true;}continue;}
  if(att?(e===2):(e===1)){if(fx<0||fy<0||fx>8||fy>8)continue;const f=fy*9+fx,o=b[f],friend=att?o===1:(o===2||o===3);if(friend||(!o&&HN.hostile(b,f,e===1))){b[n]=0;cap++;}}}
 const k=b.indexOf(3);return{b,t:1-s.t,ca:s.ca+(att?0:cap),cd:s.cd+(att?cap:0),kc,ke:k>=0&&HCOR.includes(k)};};
HN.kdist=b=>{const k=b.indexOf(3);if(k<0)return 9;if(HCOR.includes(k))return 0;let fr=[k],seen=new Uint8Array(81);seen[k]=1;for(let d=1;d<=3;d++){const nf=[];for(const c of fr){const x=c%9,y=c/9|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,ny=y+dy;while(nx>=0&&ny>=0&&nx<9&&ny<9){const n=ny*9+nx;if(b[n]&&n!==k)break;if(HCOR.includes(n))return d;if(!seen[n]){seen[n]=1;nf.push(n);}nx+=dx;ny+=dy;}}}fr=nf;}return 4;};
const HNG={moves:HN.moves,play:HN.play,
 over(s,ply){if(s.kc)return s.t===1?-WIN+ply:WIN-ply;if(s.ke)return s.t===0?-WIN+ply:WIN-ply;return null;},stuck(s,ply){return -WIN+ply;},
 av(s){const b=s.b;let na=0,nd=0;for(const v of b){if(v===1)na++;else if(v===2)nd++;}let e=na*10-nd*22;const kd=HN.kdist(b);e+=kd===1?(s.t===1?-3000:-120):kd===2?-45:kd===3?-12:0;const k=b.indexOf(3);if(k>=0){const x=k%9,y=k/9|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<9&&ny<9&&b[ny*9+nx]===1)e+=9;}e+=(Math.abs(x-4)+Math.abs(y-4))*-2;}
  for(const c of[10,16,64,70])if(b[c]===1)e+=7;for(const c of[1,9,7,17,63,73,71,79])if(b[c]===1)e+=3;return e;},
 ev(s){const v=HNG.av(s);return s.t===0?v:-v;},
 order(s,mv){}};
A.add({id:'hnefatafl',name:'HNEFATAFL',cat:'BOARD',vs:1,warm:30,time:540,how:'PICK A SIDE. PIECES MOVE LIKE ROOKS AND CAPTURE BY SANDWICH. KING ESCAPES TO A CORNER.',make(){
 const g=base(),b=Array(81).fill(0);[3,4,5,13,27,36,45,37,35,44,53,43,75,76,77,67].forEach(i=>b[i]=1);[22,31,49,58,38,39,41,42].forEach(i=>b[i]=2);b[40]=3;
 g.st={b,t:0,ca:0,cd:0,kc:false,ke:false};g.ph='pick';g.pk=0;g.c={x:4,y:1};g.sel=-1;g.last=null;g.anim=null;
 const OX=10,OY=13,CS=23,cxy=i=>[OX+(i%9)*CS+CS/2,OY+(i/9|0)*CS+CS/2];
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=HN.moves(s);g.sel=-1;if(s.kc){g.over=winT(g,0);g.msg='KING CAPTURED';S('win');}else if(s.ke){g.over=winT(g,1);g.msg='THE KING ESCAPED';S('win');}else if(!g.legal.length){g.over=winT(g,1-s.t);g.msg='NO MOVES LEFT';}};
 const doMove=m=>{const s=g.st,ns=HN.play(s,m);slide(g,cxy(m.f),cxy(m.t));g.animI=m.t;for(let i=0;i<81;i++)if(s.b[i]&&!ns.b[i]&&i!==m.f){const[x,y]=cxy(i);fxHit(x,y,K.r);}S(ns.ca+ns.cd>s.ca+s.cd?'hit':'blip');g.st=ns;g.last=m;finish();};
 finish();
 g.timeUp=()=>{const s=g.st,la=s.ca/16,ld=s.cd/8;return tupT(g,Math.abs(la-ld)<.01?-1:la<ld?0:1);};
 g.update=()=>{touch(g);if(pickUpd(g)){g.c=g.pk?{x:4,y:3}:{x:4,y:1};return;}slideStep(g);if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(HNG,s,cfg(t,[{maxD:1,noise:30},{maxD:2,noise:3},{maxD:6}]));if(m)doMove(m);}return;}
  const m=gridSel(g,inp(g,t),9,9,OX,OY,CS,i=>t===0?s.b[i]===1:s.b[i]>=2);if(m)doMove(m);};
 g.draw=()=>{table('#14110d');const c=A.c,s=g.st,t=s.t;frame(OX,OY,9*CS,9*CS,'walnut',6);wood(OX,OY,9*CS,9*CS,'oak',33);c.strokeStyle='rgba(50,24,6,.55)';c.lineWidth=1;for(let k=0;k<=9;k++){c.beginPath();c.moveTo(OX+k*CS+.5,OY);c.lineTo(OX+k*CS+.5,OY+9*CS);c.stroke();c.beginPath();c.moveTo(OX,OY+k*CS+.5);c.lineTo(OX+9*CS,OY+k*CS+.5);c.stroke();}
  for(const i of HCOR.concat([HTH])){const[x,y]=cxy(i);c.fillStyle='rgba(90,40,10,.45)';c.fillRect(x-CS/2+2,y-CS/2+2,CS-4,CS-4);c.strokeStyle='rgba(255,220,150,.5)';c.beginPath();c.moveTo(x-7,y-7);c.lineTo(x+7,y+7);c.moveTo(x+7,y-7);c.lineTo(x-7,y+7);c.stroke();}
  if(g.ph==='play')selMarks(g,cxy,CS,t,i=>s.b[i]);
  for(let i=0;i<81;i++){const v=s.b[i];if(!v||(g.anim&&g.animI===i))continue;const[x,y]=cxy(i);piece(x,y,v===3?10:9,v===1?'ebony':'maple',{sel:i===g.sel,king:v===3});}
  if(g.anim){const[x,y]=slidePos(g.anim),v=s.b[g.animI];if(v)piece(x,y,v===3?10:9,v===1?'ebony':'maple',{king:v===3});}if(g.ph==='play')gridCursor(g,OX,OY,CS,owner(g,t)?1:0);
  const kd=HN.kdist(s.b);panel(g,{mat:['ebony','maple'],stat:['ATTACKERS '+(16-s.ca),'DEFENDERS '+(8-s.cd)],stat2:['CAPTURE THE KING','KING TO A CORNER'],lines:[[g.ph!=='play'||isCPU(g,t)?'':g.sel>=0?'PICK A SQUARE':'PICK A PIECE',K.y],['SANDWICH TO CAPTURE',K.gr],[kd<=2&&!g.over?'KING '+kd+' MOVE'+(kd>1?'S':'')+' FROM ESCAPE':'',K.o],g.over?[g.msg,K.c]:null]});
  pickDraw(g,['ATTACK','DEFEND'],['ebony','maple']);};
 return g;}});

/* ================= YACHT DICE (classic Yacht scoring, expectimax CPU) ================= */
const YC=['ONES','TWOS','THREES','FOURS','FIVES','SIXES','FULL HOUSE','FOUR OF A KIND','LITTLE STRAIGHT','BIG STRAIGHT','CHOICE','YACHT'];
const YBASE=[2,5,8,11,13,15,20,12,19,19,23,13];
const ySc=(cn,c)=>{let sum=0;for(let f=1;f<=6;f++)sum+=cn[f]*f;if(c<6)return cn[c+1]*(c+1);if(c===6){let t3=0,t2=0;for(let f=1;f<=6;f++){if(cn[f]===3)t3=1;if(cn[f]===2)t2=1;}return t3&&t2?sum:0;}
 if(c===7){for(let f=1;f<=6;f++)if(cn[f]>=4)return f*4;return 0;}if(c===8)return cn[1]&&cn[2]&&cn[3]&&cn[4]&&cn[5]?30:0;if(c===9)return cn[2]&&cn[3]&&cn[4]&&cn[5]&&cn[6]?30:0;if(c===10)return sum;for(let f=1;f<=6;f++)if(cn[f]===5)return 50;return 0;};
const yCnt=d=>{const c=[0,0,0,0,0,0,0];for(const v of d)c[v]++;return c;};const yKey=c=>c[1]+c[2]*6+c[3]*36+c[4]*216+c[5]*1296+c[6]*7776;
const YOUT=[];{const fact=[1,1,2,6,24,120];for(let n=0;n<=5;n++){const L_=[];const rec=(f,left,c)=>{if(f===7){if(left)return;let p=fact[n];for(let k=1;k<=6;k++)p/=fact[c[k]];L_.push({c:c.slice(),p:p/Math.pow(6,n)});return;}for(let k=0;k<=left;k++){c[f]=k;rec(f+1,left-k,c);}c[f]=0;};rec(1,n,[0,0,0,0,0,0,0]);YOUT.push(L_);}}
const yKeeps=cn=>{const out=[];const rec=(f,k)=>{if(f===7){out.push(k.slice());return;}for(let i=0;i<=cn[f];i++){k[f]=i;rec(f+1,k);}k[f]=0;};rec(1,[0,0,0,0,0,0,0]);return out;};
const yPlan=(open,lv)=>{const m0=new Map(),m1=new Map();const V0=cn=>{const k=yKey(cn);if(m0.has(k))return m0.get(k);let b=-1e9;for(const c of open){const v=ySc(cn,c)-YBASE[c];if(v>b)b=v;}m0.set(k,b);return b;};
 const EV=(keep,Vn)=>{let n=5,s=0;for(let f=1;f<=6;f++)n-=keep[f];for(const o of YOUT[n]){const cn=[0];for(let f=1;f<=6;f++)cn.push(keep[f]+o.c[f]);s+=o.p*Vn(cn);}return s;};
 const best=(cn,Vn)=>{let b=-1e9,bk=null;for(const k of yKeeps(cn)){const v=EV(k,Vn);if(v>b+1e-9){b=v;bk=k;}}return[b,bk];};
 const V1=cn=>{const k=yKey(cn);if(m1.has(k))return m1.get(k);const v=best(cn,V0)[0];m1.set(k,v);return v;};
 return{V0,keep:(cn,left)=>best(cn,left>=2&&lv>=2?V1:V0)[1],cat:cn=>{let b=-1e9,bc=open[0];for(const c of open){const v=ySc(cn,c)-YBASE[c]+(lv===0?rnd(14):lv===1?rnd(3):0);if(v>b){b=v;bc=c;}}return bc;}};};
const yDie=(x,y,s,v,held,hl,spin)=>{const c=A.c;c.save();c.translate(x+s/2,y+s/2);if(spin&&c.rotate)c.rotate(spin);oval(2,s*.55,s*.55,s*.16,0,'rgba(0,0,0,.35)');const h=s/2,r=s*.18;
 c.fillStyle=lg(-h,-h,h,h,[[0,held?'#fff8d0':'#ffffff'],[1,held?'#e8c860':'#d8d0c0']],'#f4f0e8');c.beginPath();c.moveTo(-h+r,-h);c.lineTo(h-r,-h);c.quadraticCurveTo&&c.quadraticCurveTo(h,-h,h,-h+r);c.lineTo(h,h-r);c.quadraticCurveTo&&c.quadraticCurveTo(h,h,h-r,h);c.lineTo(-h+r,h);c.quadraticCurveTo&&c.quadraticCurveTo(-h,h,-h,h-r);c.lineTo(-h,-h+r);c.quadraticCurveTo&&c.quadraticCurveTo(-h,-h,-h+r,-h);c.closePath();c.fill();
 c.strokeStyle=hl?'#ffe060':'rgba(0,0,0,.35)';c.lineWidth=hl?2:1;c.stroke();const q=s/4,P={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]}[v]||[];
 for(const p of P){disc(p[0]*q-h,p[1]*q-h,s*.085,v===1?'#c01020':'#181818');disc(p[0]*q-h-.4,p[1]*q-h-.5,s*.03,'rgba(255,255,255,.5)');}c.restore();};
A.add({id:'yacht',name:'YACHT DICE',cat:'BOARD',vs:1,warm:30,time:540,how:'A ROLLS OR HOLDS THE PICKED DIE (3 ROLLS). UP/DOWN TO THE CARD, A SCORES A ROW. 12 ROUNDS.',make(){
 const g=base();g.sc=[Array(12).fill(null),Array(12).fill(null)];g.d=[1,2,3,4,5];g.hold=[0,0,0,0,0];g.rolls=0;g.anim=0;g.foc=5;g.row=-1;g.cp=null;g.cw=0;g.flash=null;
 const tot=p=>g.sc[p].reduce((a,b)=>a+(b||0),0),open=p=>[...Array(12).keys()].filter(c=>g.sc[p][c]===null);
 const DX=k=>16+k*27,DY=104,DS=22,RB={x:22,y:150,w:110,h:22},CX=158,CY=22,RH=15;
 const roll=()=>{if(g.rolls>=3)return;g.rolls++;g.anim=18;S('blip');};
 const score=c=>{const t=g.turn;const v=ySc(yCnt(g.d),c);g.sc[t][c]=v;g.flash={c,t,k:40};S(v?'coin':'lose');if(v>=30)A.burst(CX+80,CY+18+c*RH,K.y,16,2);g.rolls=0;g.hold=[0,0,0,0,0];g.foc=5;g.row=-1;g.cp=null;
  if(g.sc[0].every(v=>v!==null)&&g.sc[1].every(v=>v!==null)){const a=tot(0),b=tot(1);g.over=a===b?'DRAW - '+a+' EACH':winT(g,a>b?0:1);g.msg=a+' TO '+b;return;}g.turn=1-t;};
 g.timeUp=()=>{const a=tot(0),b=tot(1);return tupT(g,a===b?-1:a>b?0:1);};
 g.update=()=>{touch(g);if(g.flash&&--g.flash.k<=0)g.flash=null;if(g.over)return;if(g.anim){g.anim--;g.d=g.d.map((v,i)=>g.hold[i]?v:1+ri(6));if(!g.anim)S('hit');return;}const t=g.turn;
  if(isCPU(g,t)){if(++g.cw<(demo(g)?6:30))return;g.cw=0;const lv=LVL(t),pl=yPlan(open(t),lv);if(g.rolls===0){roll();return;}const cn=yCnt(g.d);
   if(g.cp==='score'){score(g.row);return;}if(g.rolls<3){const k=pl.keep(cn,3-g.rolls);let ks=0;for(let f=1;f<=6;f++)ks+=k[f];if(ks<5){const need=k.slice();g.hold=g.d.map(v=>need[v]>0?(need[v]--,1):0);g.cp='hold';roll();return;}}
   g.row=pl.cat(cn);g.cp='score';return;}
  const I=inp(g,t);
  if(I.mv){let hit=false;for(let k=0;k<5;k++)if(I.x>=DX(k)&&I.x<DX(k)+DS&&I.y>=DY&&I.y<DY+DS){g.foc=k;g.row=-1;hit=true;}if(I.x>=RB.x&&I.x<RB.x+RB.w&&I.y>=RB.y&&I.y<RB.y+RB.h){g.foc=5;g.row=-1;}if(I.x>=CX&&I.y>=CY+12&&I.y<CY+12+12*RH&&g.rolls){const r=Math.floor((I.y-CY-12)/RH);if(g.sc[t][r]===null){g.row=r;}}}
  if(g.row>=0){if(I.u||I.d){const o=open(t);let k=o.indexOf(g.row);k=I.u?k-1:k+1;if(k<0||k>=o.length)g.row=-1;else g.row=o[k];S('blip');}if(I.l||I.r){g.row=-1;S('blip');}if(I.a&&g.row>=0&&g.rolls){score(g.row);return;}if(I.b&&g.rolls<3&&g.rolls){g.row=-1;roll();}return;}
  if(I.l){g.foc=Math.max(0,g.foc-1);S('blip');}if(I.r){g.foc=Math.min(5,g.foc+1);S('blip');}if((I.u||I.d)&&g.rolls){const o=open(t);g.row=I.u?o[o.length-1]:o[0];S('blip');return;}
  if(I.b&&g.rolls<3){roll();return;}if(I.a){if(g.rolls===0||g.foc===5){if(g.rolls<3)roll();else S('lose');}else{g.hold[g.foc]^=1;S('blip');}}};
 g.draw=()=>{A.cls('#0c2a1c');const c=A.c,t=g.turn;c.fillStyle=rg(80,120,10,80,120,170,[[0,'rgba(60,160,90,.35)'],[1,'rgba(0,0,0,.4)']],'rgba(0,0,0,0)');c.fillRect(0,0,W,H);
  frame(8,40,140,150,'walnut',6);c.fillStyle=rg(78,110,10,78,115,110,[[0,'#2a8a4e'],[1,'#0e4a26']],'#1a6a3a');c.fillRect(8,40,140,150);
  for(let i=0;i<60;i++){c.fillStyle='rgba(0,0,0,.06)';c.fillRect(8+hsh(i)*138,40+hsh(i+99)*148,1,1);}
  const hum=!isCPU(g,t)&&!g.over;T((A.two?'':'')+nm(g,t)+(isCPU(g,t)?' IS ROLLING':' TO PLAY'),78,50,t?K.p:K.c,1,'c');
  for(let k=0;k<3;k++)disc(58+k*10,64,3,k<g.rolls?K.y:'rgba(255,255,255,.2)');T('ROLLS',98,62,K.gr,1);
  for(let k=0;k<5;k++){const x=DX(k),y=DY+(g.hold[k]?-10:0),sp=g.anim&&!g.hold[k]?(hsh(k*31+g.anim)-.5)*1.4:0;if(g.rolls||g.anim)yDie(x,y,DS,g.d[k],g.hold[k],hum&&g.foc===k&&g.row<0,sp);else{c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x,DY,DS,DS);}if(g.hold[k])T('HELD',x+DS/2,DY+DS+2,K.y,1,'c');}
  const canR=g.rolls<3&&!isCPU(g,t);c.fillStyle=canR?lg(0,RB.y,0,RB.y+RB.h,[[0,'#ffd860'],[1,'#d08a10']],'#e8a830'):'rgba(0,0,0,.3)';c.fillRect(RB.x,RB.y,RB.w,RB.h);A.box(RB.x,RB.y,RB.w,RB.h,hum&&g.foc===5&&g.row<0?K.w:'rgba(0,0,0,.5)');T(g.rolls===0?'ROLL':g.rolls<3?'ROLL AGAIN':'PICK A ROW',RB.x+RB.w/2,RB.y+8,canR?'#3a1a00':K.gr,1,'c');
  T(hum?(g.rolls?'A HOLDS, B ROLLS':'A ROLLS'):'',78,200,K.gr,1,'c');T(hum&&g.rolls?'UP/DOWN: SCORECARD':'',78,210,K.gr,1,'c');
  c.fillStyle='rgba(0,0,0,.4)';c.fillRect(CX+3,CY-14+3,156,226);c.fillStyle=lg(CX,0,CX+156,0,[[0,'#fbf6e6'],[1,'#ece2c8']],'#f6f0dc');c.fillRect(CX,CY-14,156,226);
  T('YACHT CARD',CX+6,CY-10,'#7a2a10',1);T(nm(g,0),CX+116,CY-2,t===0?'#0a6a8a':'#8a8070',1,'c');T(nm(g,1),CX+142,CY-2,t===1?'#a01a5a':'#8a8070',1,'c');c.fillStyle='rgba(120,90,60,.5)';c.fillRect(CX+4,CY+9,148,1);
  const cn=yCnt(g.d);for(let r=0;r<12;r++){const y=CY+12+r*RH;if(r%2){c.fillStyle='rgba(120,90,40,.07)';c.fillRect(CX+2,y,152,RH);}if(g.row===r&&!g.over){c.fillStyle=t?'rgba(255,80,160,.25)':'rgba(40,200,220,.25)';c.fillRect(CX+2,y,152,RH);}if(g.flash&&g.flash.c===r){c.fillStyle='rgba(255,220,60,'+(g.flash.k/50)+')';c.fillRect(CX+2,y,152,RH);}
   T(YC[r],CX+6,y+5,'#3a2a1a',1);for(let p=0;p<2;p++){const v=g.sc[p][r],x=CX+116+p*26;if(v!==null)T(v,x,y+5,p?'#a01a5a':'#0a6a8a',1,'c');else if(p===t&&g.rolls&&!g.anim)T(ySc(cn,r),x,y+5,'rgba(90,80,60,.45)',1,'c');else T('-',x,y+5,'#b8ac90',1,'c');}}
  c.fillStyle='rgba(120,90,60,.6)';c.fillRect(CX+4,CY+12+12*RH+1,148,1);T('TOTAL',CX+6,CY+12+12*RH+6,'#7a2a10',1);T(tot(0),CX+116,CY+12+12*RH+6,'#0a6a8a',1,'c');T(tot(1),CX+142,CY+12+12*RH+6,'#a01a5a',1,'c');
  const rd=Math.min(12,Math.min(g.sc[0].filter(v=>v!==null).length,g.sc[1].filter(v=>v!==null).length)+1);T('ROUND '+rd+'/12',78,22,K.w,2,'c');if(g.over)T(g.msg,78,214,K.y,1,'c');};
 return g;}});

/* ================= GO 7X7 (area scoring, positional superko, MCTS CPU) ================= */
const GNB=[...Array(49)].map((_,i)=>{const x=i%7,y=i/7|0,o=[];if(x>0)o.push(i-1);if(x<6)o.push(i+1);if(y>0)o.push(i-7);if(y<6)o.push(i+7);return o;});
const GDG=[...Array(49)].map((_,i)=>{const x=i%7,y=i/7|0,o=[];for(const[dx,dy]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<7&&ny<7)o.push(ny*7+nx);}return o;});
const GVS=new Int32Array(49);let GST=1,GCAP=-1;const KOMI=7.5;
const goLib=(b,i)=>{const v=b[i],st=[i];GST++;GVS[i]=GST;while(st.length){const c=st.pop();for(const n of GNB[c]){if(!b[n])return true;if(b[n]===v&&GVS[n]!==GST){GVS[n]=GST;st.push(n);}}}return false;};
const goRem=(b,i)=>{const v=b[i],st=[i];b[i]=0;let n=1;while(st.length){const c=st.pop();for(const k of GNB[c])if(b[k]===v){b[k]=0;n++;st.push(k);}}return n;};
const goPlay=(b,i,v)=>{if(b[i])return -1;b[i]=v;const o=3-v;let cap=0;GCAP=-1;for(const n of GNB[i])if(b[n]===o&&!goLib(b,n)){cap+=goRem(b,n);GCAP=n;}if(!cap&&!goLib(b,i)){b[i]=0;return -1;}return cap;};
const goEye=(b,i,v)=>{if(b[i])return false;for(const n of GNB[i])if(b[n]!==v)return false;let bad=0;for(const d of GDG[i])if(b[d]===3-v)bad++;return GDG[i].length<4?bad===0:bad<=1;};
const goArea=b=>{let s=[0,0,0];const seen=new Uint8Array(49);for(let i=0;i<49;i++){if(b[i]){s[b[i]]++;continue;}if(seen[i])continue;const st=[i];seen[i]=1;let n=0,touch=0;while(st.length){const c=st.pop();n++;for(const k of GNB[c]){if(!b[k]){if(!seen[k]){seen[k]=1;st.push(k);}}else touch|=b[k];}}if(touch===1)s[1]+=n;else if(touch===2)s[2]+=n;}return s;};
const goSettled=b=>{const seen=new Uint8Array(49);for(let i=0;i<49;i++){if(b[i]||seen[i])continue;const st=[i];seen[i]=1;let touch=0;while(st.length){const c=st.pop();for(const k of GNB[c]){if(!b[k]){if(!seen[k]){seen[k]=1;st.push(k);}}else touch|=b[k];}}if(touch===3)return false;}return true;};
const goScore=b=>{const a=goArea(b);return a[1]-a[2]-KOMI;};
const goKo=(b,i,cap,v)=>{if(cap!==1)return -1;for(const n of GNB[i])if(b[n]===v)return -1;let lib=0;for(const n of GNB[i])if(!b[n])lib++;return lib===1?GCAP:-1;};
const goPlayout=(b,turn,ko)=>{let pass=0;const E=new Int8Array(49);for(let m=0;m<110&&pass<2;m++){let n=0;for(let i=0;i<49;i++)if(!b[i])E[n++]=i;let moved=false;while(n){const k=ri(n),i=E[k];E[k]=E[--n];if(i===ko||goEye(b,i,turn))continue;const r=goPlay(b,i,turn);if(r<0)continue;ko=goKo(b,i,r,turn);moved=true;break;}if(moved)pass=0;else{pass++;ko=-1;}turn=3-turn;}return goScore(b);};
const goCands=(b,v,ko,hist)=>{const out=[];for(let i=0;i<49;i++){if(b[i]||i===ko||goEye(b,i,v))continue;const nb=b.slice();if(goPlay(nb,i,v)<0)continue;if(hist&&hist.has(nb.join('')))continue;out.push(i);}return out;};
const goMCTS=(b0,v,ko0,hist,ms,lv)=>{const root={ch:[],N:0,W:0,un:shuf(goCands(b0,v,ko0,hist)),mv:-1};if(!root.un.length)return{mv:-1,wr:0};if(root.un.length===1&&lv>0)return{mv:root.un[0],wr:.5};const t0=now();let it=0;
 while(it<(ms<10?8:40)||now()-t0<ms){it++;if(it>200000)break;const b=Int8Array.from(b0);let node=root,turn=v,ko=ko0;const path=[root];
  while(!node.un.length&&node.ch.length){let best=null,bs=-1;const ln=Math.log(node.N+1);for(const c of node.ch){const s=c.W/(c.N+1e-9)+.9*Math.sqrt(ln/(c.N+1e-9));if(s>bs){bs=s;best=c;}}const r=goPlay(b,best.mv,turn);if(r<0)break;ko=goKo(b,best.mv,r,turn);turn=3-turn;node=best;path.push(node);}
  if(node.un.length){const mv=node.un.pop(),r=goPlay(b,mv,turn);if(r>=0){ko=goKo(b,mv,r,turn);const ch={ch:[],N:0,W:0,un:null,mv,who:turn};turn=3-turn;ch.un=shuf(goCands(b,turn,ko,null));node.ch.push(ch);node=ch;path.push(ch);}}
  const sc=goPlayout(b,turn,ko),win=sc>0?1:2;for(const n of path){n.N++;if(n.who===win)n.W++;}}
 if(!root.ch.length)return{mv:root.un[0]!==undefined?root.un[0]:-1,wr:.5};root.ch.sort((a,b)=>b.N-a.N);let pick=root.ch[0];if(lv===0&&root.ch.length>2&&Math.random()<.45)pick=root.ch[1+ri(Math.min(3,root.ch.length-1))];return{mv:pick.mv,wr:pick.W/pick.N,it};};
A.add({id:'go7',name:'GO 7X7',cat:'BOARD',vs:1,warm:30,time:540,how:'PLACE STONES, SURROUND TO CAPTURE. B TWICE PASSES. TWO PASSES END IT. MOST AREA WINS.',make(){
 const g=base();g.b=new Int8Array(49);g.hist=new Set([g.b.join('')]);g.ko=-1;g.caps=[0,0];g.c={x:3,y:3};g.last=-1;g.passes=0;g.pconf=0;g.msg='';g.mt=0;g.drop=null;
 const OX=26,OY=30,SP=28,cxy=i=>[OX+(i%7)*SP,OY+(i/7|0)*SP];
 const end=()=>{const a=goArea(g.b),d=a[1]-a[2]-KOMI;g.over=winT(g,d>0?0:1);g.msg='B '+a[1]+' - W '+a[2]+'+'+KOMI;g.fin=true;S('win');};
 const pass=()=>{const t=g.turn;g.passes++;g.msg=nm(g,t)+' PASSES';g.mt=90;S('blip');g.last=-1;if(g.passes>=2){end();return;}g.ko=-1;g.turn=1-t;};
 const place=i=>{const t=g.turn,v=t+1,nb=g.b.slice(),r=goPlay(nb,i,v);if(r<0||g.hist.has(nb.join(''))){S('lose');g.msg=r<0?'NO SUICIDE':'KO - PLAY ELSEWHERE';g.mt=60;return false;}g.ko=goKo(nb,i,r,v);g.b=nb;g.hist.add(nb.join(''));g.caps[t]+=r;g.last=i;g.passes=0;g.drop={i,k:0};S(r?'hit':'blip');if(r){const[x,y]=cxy(i);fxHit(x,y,K.w);g.msg=r+' CAPTURED';g.mt=50;}g.turn=1-t;return true;};
 g.timeUp=()=>{const d=goScore(g.b);return tupT(g,d>0?0:1);};
 g.update=()=>{touch(g);if(g.drop&&++g.drop.k>8)g.drop=null;if(g.mt)g.mt--;if(g.pconf)g.pconf--;if(g.over)return;const t=g.turn,v=t+1;
  if(isCPU(g,t)){if(cpuGo(g)){const lv=LVL(t),r=goMCTS(g.b,v,g.ko,g.hist,BUD(t),lv),sc=goScore(g.b),ahead=v===1?sc>0:sc<0;
    if(r.mv<0||(g.passes>0&&ahead)||(r.wr<.03&&g.passes>0)||(ahead&&goSettled(g.b)&&r.wr>.85))pass();else place(r.mv);}return;}
  const I=inp(g,t);moveCur(I,g.c,7,7);if(I.mv){const X=Math.round((I.x-OX)/SP),Y=Math.round((I.y-OY)/SP);if(X>=0&&Y>=0&&X<7&&Y<7){g.c.x=X;g.c.y=Y;}}
  if(I.b){if(g.pconf){g.pconf=0;pass();}else{g.pconf=120;S('blip');}return;}if(I.a){const i=g.c.y*7+g.c.x;if(g.b[i]){S('lose');return;}place(i);}};
 g.draw=()=>{table('#18130d');const c=A.c,t=g.turn;frame(OX-18,OY-18,6*SP+36,6*SP+36,'walnut',5);wood(OX-18,OY-18,6*SP+36,6*SP+36,'kaya',27);c.strokeStyle='rgba(30,16,4,.85)';c.lineWidth=1;
  for(let k=0;k<7;k++){c.beginPath();c.moveTo(OX+k*SP+.5,OY);c.lineTo(OX+k*SP+.5,OY+6*SP);c.stroke();c.beginPath();c.moveTo(OX,OY+k*SP+.5);c.lineTo(OX+6*SP,OY+k*SP+.5);c.stroke();}c.lineWidth=1.6;c.strokeRect(OX,OY,6*SP,6*SP);
  for(const i of[24,16,18,30,32])disc(cxy(i)[0]+.5,cxy(i)[1]+.5,i===24?2.6:2,'#2a1606');
  if(g.fin){const seen=new Uint8Array(49);for(let i=0;i<49;i++){if(g.b[i]||seen[i])continue;const st=[i],reg=[];seen[i]=1;let touch=0;while(st.length){const q=st.pop();reg.push(q);for(const k of GNB[q]){if(!g.b[k]){if(!seen[k]){seen[k]=1;st.push(k);}}else touch|=g.b[k];}}if(touch===1||touch===2)for(const q of reg){const[x,y]=cxy(q);c.fillStyle=touch===1?'#141418':'#f8f6f0';c.fillRect(x-4,y-4,8,8);}}}
  for(let i=0;i<49;i++){const v=g.b[i];if(!v)continue;const[x,y]=cxy(i);const dr=g.drop&&g.drop.i===i?(8-g.drop.k)*.9:0;piece(x,y-dr,12.6+dr*.08,v===1?'slate':'shell');if(i===g.last)ring2(x,y-dr,5,v===1?'#ffffff':'#202020',1.5);}
  const hum=!isCPU(g,t)&&!g.over;if(hum){const i=g.c.y*7+g.c.x,[x,y]=cxy(i);if(!g.b[i]){c.globalAlpha=.4;piece(x,y,12.6,t?'shell':'slate',{flat:1});c.globalAlpha=1;}ring2(x,y,14.5,t?K.p:K.c,2);}
  const a=goArea(g.b);panel(g,{mat:['slate','shell'],stat:[0,1].map(o=>'AREA '+a[o+1]+(o?' +'+KOMI:'')),stat2:[0,1].map(o=>'CAPTURED '+g.caps[o]),
   lines:[[g.over?g.msg:g.mt?g.msg:'',g.over?K.c:K.y],[g.pconf?'B AGAIN TO PASS':hum?'A PLACES A STONE':'',g.pconf?K.r:K.gr],[hum&&!g.pconf?'B B = PASS':'',K.gr],['KOMI '+KOMI+' TO WHITE',K.gr],[g.passes&&!g.over?'OPPONENT PASSED':'',K.o]]});};
 return g;}});

/* ================= AMAZONS (8x8, four amazons each) ================= */
const AQD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const ARAY=[...Array(64)].map((_,i)=>AQD.map(([dx,dy])=>{const o=[];let x=i%8+dx,y=(i>>3)+dy;while(x>=0&&y>=0&&x<8&&y<8){o.push(y*8+x);x+=dx;y+=dy;}return o;}));
const AM={};
AM.reach=(b,i)=>{const o=[];for(const r of ARAY[i])for(const j of r){if(b[j])break;o.push(j);}return o;};
AM.moves=(b,v)=>{const out=[];for(let f=0;f<64;f++){if(b[f]!==v)continue;b[f]=0;for(const t of AM.reach(b,f)){b[t]=v;for(const a of AM.reach(b,t))out.push({f,t,a});b[t]=0;}b[f]=v;}return out;};
AM.any=(b,v)=>{for(let f=0;f<64;f++){if(b[f]!==v)continue;for(const r of ARAY[f])if(r.length&&!b[r[0]])return true;}return false;};
AM.play=(b,m)=>{const n=b.slice();n[m.t]=n[m.f];n[m.f]=0;n[m.a]=3;return n;};
const AQ1=new Int8Array(64),AQ2=new Int8Array(64),AFR=new Int16Array(70);
AM.qd=(b,v,D)=>{D.fill(99);let n=0;for(let i=0;i<64;i++)if(b[i]===v){D[i]=0;AFR[n++]=i;}let s=0,e=n;for(let d=1;s<e&&d<10;d++){for(let k=s;k<e;k++){const R=ARAY[AFR[k]];for(let r=0;r<8;r++){const ray=R[r];for(let q=0;q<ray.length;q++){const j=ray[q];if(b[j])break;if(D[j]>d){D[j]=d;AFR[n++]=j;}}}}s=e;e=n;}return D;};
AM.ev=(b,v)=>{const a=AM.qd(b,v,AQ1),o=AM.qd(b,3-v,AQ2);let e=0,ma=0,mo=0;for(let i=0;i<64;i++){const q=b[i];if(q){if(q===3)continue;const R=ARAY[i];let k=0;for(let r=0;r<8;r++)if(R[r].length&&!b[R[r][0]])k++;const p=k===0?12:k<=2?3:0;e+=q===v?-p:p;continue;}const x=a[i],y=o[i];if(x<y)e+=1;else if(y<x)e-=1;else if(x<99)e+=.15;if(x===1)ma++;if(y===1)mo++;}return e+(ma-mo)*.08;};
AM.evm=(b,m,v)=>{b[m.f]=0;b[m.t]=v;b[m.a]=3;const e=AM.ev(b,v);b[m.a]=0;b[m.t]=0;b[m.f]=v;return e;};
AM.cpu=(b,v,lv,ms)=>{const t0=now();let mv=AM.moves(b,v);if(!mv.length)return null;if(ms<10){mv=shuf(mv).slice(0,40);lv=0;}const nz=[2.5,.2,0][lv]||0;for(const m of mv)m.h=AM.evm(b,m,v)+(Math.random()-.5)*nz;mv.sort((a,b)=>b.h-a.h);const K=[1,8,20][lv]||1;if(K===1)return mv[0];
 let best=mv[0],bv=-1e9;for(let i=0;i<Math.min(K,mv.length);i++){if(i>0&&now()-t0>ms)break;const nb=AM.play(b,mv[i]);if(!AM.any(nb,3-v))return mv[i];const rep=AM.moves(nb,3-v);let worst=1e9;
  for(const r of rep){const e=-AM.evm(nb,r,3-v);if(e<worst){worst=e;if(worst<=bv)break;}if(now()-t0>ms*2.2)break;}if(worst>bv){bv=worst;best=mv[i];}}return best;};
A.add({id:'amazons',name:'AMAZONS',cat:'BOARD',vs:1,warm:30,time:600,how:'MOVE AN AMAZON LIKE A QUEEN, THEN FIRE AN ARROW THE SAME WAY. LAST ONE ABLE TO MOVE WINS.',make(){
 const g=base();g.b=Array(64).fill(0);[40,58,61,47].forEach(i=>g.b[i]=1);[16,2,5,23].forEach(i=>g.b[i]=2);g.c={x:2,y:7};g.ph=0;g.sel=-1;g.to=-1;g.last=null;g.anim=null;g.arrow=null;
 const OX=10,OY=14,CS=26,cxy=i=>[OX+(i%8)*CS+CS/2,OY+(i>>3)*CS+CS/2];
 const finish=()=>{const v=g.turn+1;if(!AM.any(g.b,v)){g.over=winT(g,1-g.turn);g.msg=nm(g,g.turn)+' IS WALLED IN';S('win');}};
 const doMove=m=>{const v=g.turn+1;g.anim={a:cxy(m.f),b:cxy(m.t),k:0,i:m.t};g.arrow={a:cxy(m.t),b:cxy(m.a),k:-1,i:m.a};g.b=AM.play(g.b,m);g.last=m;g.ph=0;g.sel=-1;g.to=-1;S('hit');g.turn=1-g.turn;finish();};
 g.timeUp=()=>{const e=AM.ev(g.b,1);return tupT(g,Math.abs(e)<1?-1:e>0?0:1);};
 g.update=()=>{touch(g);if(g.anim){g.anim.k+=demo(g)?.34:.12;if(g.anim.k>=1){g.anim=null;if(g.arrow)g.arrow.k=0;S('shoot');}return;}if(g.arrow){g.arrow.k+=demo(g)?.34:.14;if(g.arrow.k>=1){const[x,y]=g.arrow.b;A.burst(x,y,K.o,8,1.2);g.arrow=null;}return;}
  if(g.over)return;const t=g.turn,v=t+1;
  if(isCPU(g,t)){if(cpuGo(g)){const m=AM.cpu(g.b,v,LVL(t),BUD(t));if(m)doMove(m);}return;}
  const I=inp(g,t);moveCur(I,g.c,8,8);mouseGrid(I,g.c,8,8,OX,OY,CS);if(I.b){if(g.ph>0){g.ph--;if(g.ph===0)g.sel=-1;else g.to=-1;S('blip');}return;}if(!I.a)return;const i=g.c.y*8+g.c.x;
  if(g.ph===0||(g.ph===1&&g.b[i]===v&&i!==g.sel)){if(g.b[i]===v){const tb=g.b.slice();tb[i]=0;if(AM.reach(g.b,i).length){g.sel=i;g.ph=1;S('blip');}else S('lose');}else S('lose');return;}
  if(g.ph===1){if(i===g.sel){g.ph=0;g.sel=-1;return;}if(AM.reach(g.b,g.sel).includes(i)){g.to=i;g.ph=2;S('blip');}else S('lose');return;}
  if(g.ph===2){const tb=g.b.slice();tb[g.sel]=0;tb[g.to]=v;if(AM.reach(tb,g.to).includes(i))doMove({f:g.sel,t:g.to,a:i});else S('lose');}};
 g.draw=()=>{table('#121014');const c=A.c,t=g.turn,v=t+1;frame(OX,OY,8*CS,8*CS,'walnut',6);checker(OX,OY,8,8,CS,'maple','rgba(110,60,20,.45)',41);
  let vb=g.b;if(g.ph>=2){vb=g.b.slice();vb[g.sel]=0;vb[g.to]=v;}
  if(g.last){for(const i of[g.last.f,g.last.t]){const[x,y]=cxy(i);c.fillStyle='rgba(255,210,80,.18)';c.fillRect(x-CS/2,y-CS/2,CS,CS);}}
  for(let i=0;i<64;i++){if(g.b[i]!==3||(g.arrow&&g.arrow.i===i))continue;const x=OX+(i%8)*CS,y=OY+(i>>3)*CS;c.fillStyle=lg(x,y,x+CS,y+CS,[[0,'#3a2a22'],[1,'#120a08']],'#221612');c.fillRect(x+1,y+1,CS-2,CS-2);c.strokeStyle='rgba(255,140,60,.35)';c.lineWidth=1;c.strokeRect(x+2.5,y+2.5,CS-5,CS-5);
   const cx=x+CS/2,cy=y+CS/2;L(cx-7,cy+7,cx+6,cy-6,'#c8a070',1.5);A.poly([[cx+8,cy-8],[cx+3,cy-7],[cx+7,cy-3]],'#e0e0e0',1);L(cx-7,cy+7,cx-9,cy+3,'#e04040',1.5);L(cx-7,cy+7,cx-3,cy+9,'#e04040',1.5);}
  const hum=!isCPU(g,t)&&!g.over&&!g.anim&&!g.arrow;
  if(hum){let opts=[];if(g.ph===1)opts=AM.reach(g.b,g.sel);else if(g.ph===2)opts=AM.reach(vb,g.to);for(const i of opts){const[x,y]=cxy(i);if(g.ph===2){c.fillStyle='rgba(255,120,40,.25)';c.fillRect(x-CS/2+3,y-CS/2+3,CS-6,CS-6);}else dot(x,y,3.4);}}
  const amz=(x,y,o,sel)=>{piece(x,y,10.5,o===1?'shell':'ebony',{sel});const col=o===1?'#c8a040':'#e8c860';A.poly([[x-6,y+3],[x-6,y-4],[x-3,y-1],[x,y-6],[x+3,y-1],[x+6,y-4],[x+6,y+3]],col,1);A.poly([[x-6,y+3],[x-6,y-4],[x-3,y-1],[x,y-6],[x+3,y-1],[x+6,y-4],[x+6,y+3]],'rgba(60,30,0,.6)');};
  for(let i=0;i<64;i++){const o=vb[i];if((o!==1&&o!==2)||(g.anim&&g.anim.i===i))continue;const[x,y]=cxy(i);amz(x,y,o,(g.ph===1&&i===g.sel)||(g.ph===2&&i===g.to));}
  if(g.anim){const[x,y]=slidePos(g.anim);amz(x,y,g.b[g.anim.i]);}
  if(g.arrow&&g.arrow.k>=0){const a=g.arrow,e=a.k,x=a.a[0]+(a.b[0]-a.a[0])*e,y=a.a[1]+(a.b[1]-a.a[1])*e,ang=Math.atan2(a.b[1]-a.a[1],a.b[0]-a.a[0]);L(x-Math.cos(ang)*9,y-Math.sin(ang)*9,x,y,'#e8c080',2);disc(x,y,2,'#ffffff');}
  if(hum){const x=OX+g.c.x*CS,y=OY+g.c.y*CS;c.strokeStyle=t?K.p:K.c;c.lineWidth=2;c.strokeRect(x+1,y+1,CS-2,CS-2);}
  const e=AM.ev(g.b,1);panel(g,{mat:['shell','ebony'],stat:[0,1].map(o=>'SPACE '+(o?Math.max(0,Math.round(-e)):Math.max(0,Math.round(e)))+' AHEAD'),stat2:[0,1].map(o=>'ARROWS ON BOARD '+g.b.filter(x=>x===3).length),
   lines:[[!hum?'':['PICK AN AMAZON','PICK WHERE TO GO','SHOOT AN ARROW'][g.ph],g.ph===2?K.o:K.y],[hum&&g.ph?'B STEPS BACK':'',K.gr],['NO MOVE = YOU LOSE',K.gr],g.over?[g.msg,K.c]:null]});};
 return g;}});

/* ================= CLOBBER ================= */
const CLG={
 moves(s){const out=[],v=s.t+1,o=2-s.t,b=s.b;for(let i=0;i<30;i++){if(b[i]!==v)continue;const x=i%6,y=i/6|0;if(x>0&&b[i-1]===o)out.push({f:i,t:i-1});if(x<5&&b[i+1]===o)out.push({f:i,t:i+1});if(y>0&&b[i-6]===o)out.push({f:i,t:i-6});if(y<4&&b[i+6]===o)out.push({f:i,t:i+6});}return out;},
 play(s,m){const b=s.b.slice();b[m.t]=b[m.f];b[m.f]=0;return{b,t:1-s.t};},
 over(){return null;},stuck(s,ply){return -WIN+ply;},
 mob(b,v){const o=3-v;let n=0,iso=0;for(let i=0;i<30;i++){if(b[i]!==v)continue;const x=i%6,y=i/6|0;let k=0;if(x>0&&b[i-1]===o)k++;if(x<5&&b[i+1]===o)k++;if(y>0&&b[i-6]===o)k++;if(y<4&&b[i+6]===o)k++;n+=k;if(!k)iso++;}return[n,iso];},
 ev(s){const v=s.t+1,[a,ia]=CLG.mob(s.b,v),[o,io]=CLG.mob(s.b,3-v);return(a-o)*2+(ia-io)*1.5+1;},order(){}};
A.add({id:'clobber',name:'CLOBBER',cat:'BOARD',vs:1,warm:30,time:360,how:'MOVE A STONE ONTO AN ADJACENT ENEMY STONE TO CLOBBER IT. WHOEVER CANNOT MOVE LOSES.',make(){
 const g=base(),b=Array(30).fill(0);for(let i=0;i<30;i++)b[i]=((i%6)+(i/6|0))%2?2:1;g.st={b,t:0};g.c={x:2,y:4};g.sel=-1;g.last=null;g.anim=null;
 const OX=12,OY=36,CS=34,cxy=i=>[OX+(i%6)*CS+CS/2,OY+(i/6|0)*CS+CS/2];
 const finish=()=>{const s=g.st;g.turn=s.t;g.legal=CLG.moves(s);if(!g.legal.length){g.over=winT(g,1-s.t);g.msg=nm(g,s.t)+' HAS NO MOVE';S('win');}};
 const doMove=m=>{slide(g,cxy(m.f),cxy(m.t));g.animI=m.t;const[x,y]=cxy(m.t);fxHit(x,y,g.st.t?'#ffe0a0':'#80ffa0');S('hit');g.st=CLG.play(g.st,m);g.last=m;g.sel=-1;finish();};
 finish();
 g.timeUp=()=>{const a=CLG.mob(g.st.b,1)[0],b_=CLG.mob(g.st.b,2)[0];return tupT(g,a===b_?-1:a>b_?0:1);};
 g.update=()=>{touch(g);slideStep(g);if(g.over)return;const s=g.st,t=s.t;
  if(isCPU(g,t)){if(cpuGo(g)){const m=search(CLG,s,cfg(t,[{maxD:1,noise:10},{maxD:4,noise:1},{maxD:30}]));if(m)doMove(m);}return;}
  const m=gridSel(g,inp(g,t),6,5,OX,OY,CS,i=>s.b[i]===t+1);if(m)doMove(m);};
 g.draw=()=>{table('#10121a');const c=A.c,s=g.st,t=s.t;frame(OX,OY,6*CS,5*CS,'ebon',7);checker(OX,OY,6,5,CS,'oak','rgba(70,30,6,.4)',55);
  selMarks(g,cxy,CS,t,i=>s.b[i]);for(let i=0;i<30;i++){const v=s.b[i];if(!v||(g.anim&&g.animI===i))continue;const[x,y]=cxy(i);piece(x,y,13,v===1?'emer':'amber',{sel:i===g.sel});}
  if(g.anim){const[x,y]=slidePos(g.anim),v=s.b[g.animI];if(v)piece(x,y,13,v===1?'emer':'amber');}gridCursor(g,OX,OY,CS,t);
  T(nm(g,t)+(g.over?'':' TO MOVE'),OX+3*CS,14,t?K.p:K.c,2,'c');
  panel(g,{mat:['emer','amber'],stat:[0,1].map(o=>'STONES '+s.b.filter(x=>x===o+1).length),stat2:[0,1].map(o=>'MOVES '+CLG.mob(s.b,o+1)[0]),lines:[[isCPU(g,t)?'':g.sel>=0?'PICK AN ENEMY':'PICK A STONE',K.y],['ONLY CAPTURES ALLOWED',K.gr],['LAST MOVE WINS',K.gr],g.over?[g.msg,K.c]:null]});};
 return g;}});

A._b2={MG,SG,BG,QW,QG,PG,MPG,SH,SHG,BTG,LOG,FGG,HN,HNG,ySc,yCnt,yPlan,YC,cbMoves,cbCPU,search,AM,CLG,goPlay,goArea,goMCTS};
})();
