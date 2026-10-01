/* PIXEL ARCADE pack misc6: cards (last card, go fish, hearts, hold'em, tripeaks, gin rummy), party, sims */
(function(){'use strict';const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1),t=a[i];a[i]=a[j];a[j]=t;}return a;};
const RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const deck52=()=>{const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r});return shuf(d);};
const ORD=['1ST','2ND','3RD','4TH','5TH','6TH'];
/* ---------- drawing helpers ---------- */
const lg=(x0,y0,x1,y1,st)=>{const c=A.c,g=c.createLinearGradient?c.createLinearGradient(x0,y0,x1,y1):null;if(g&&g.addColorStop){st.forEach((s,i)=>g.addColorStop(i/(st.length-1),s));return g;}return st[0];};
const rg=(x,y,r0,r1,st)=>{const c=A.c,g=c.createRadialGradient?c.createRadialGradient(x,y,r0,x,y,r1):null;if(g&&g.addColorStop){st.forEach((s,i)=>g.addColorStop(i/(st.length-1),s));return g;}return st[0];};
const rrp=(x,y,w,h,r)=>{const c=A.c;c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();};
const rrf=(x,y,w,h,r,f)=>{rrp(x,y,w,h,r);A.c.fillStyle=f;A.c.fill();};
const rrs=(x,y,w,h,r,col,lw)=>{rrp(x,y,w,h,r);A.c.strokeStyle=col;A.c.lineWidth=lw||1;A.c.stroke();};
const ell=(x,y,rx,ry,f,rot)=>{const c=A.c;c.beginPath();c.ellipse(x,y,Math.max(.5,rx),Math.max(.5,ry),rot||0,0,6.2832);c.fillStyle=f;c.fill();};
const ells=(x,y,rx,ry,col,lw)=>{const c=A.c;c.beginPath();c.ellipse(x,y,Math.max(.5,rx),Math.max(.5,ry),0,0,6.2832);c.strokeStyle=col;c.lineWidth=lw||1;c.stroke();};
const ga=(a,f)=>{A.c.globalAlpha=a;f();A.c.globalAlpha=1;};
const felt=(col,edge)=>{A.cls(col);A.c.fillStyle=rg(160,120,30,230,['rgba(255,255,255,.10)','rgba(0,0,0,0)','rgba(0,0,0,.45)']);A.c.fillRect(0,0,W,H);if(edge){ells(160,118,150,92,'rgba(255,255,255,.10)',2);ells(160,118,146,88,'rgba(0,0,0,.18)',1);}};
const suitP=(s,x,y,z)=>{const c=A.c;c.beginPath();
 if(s===0){c.moveTo(x,y+z);c.bezierCurveTo(x-z*1.15,y+z*.05,x-z*1.05,y-z*1.1,x,y-z*.42);c.bezierCurveTo(x+z*1.05,y-z*1.1,x+z*1.15,y+z*.05,x,y+z);}
 else if(s===1){c.moveTo(x,y-z);c.lineTo(x+z*.78,y);c.lineTo(x,y+z);c.lineTo(x-z*.78,y);}
 else if(s===3){c.moveTo(x,y-z);c.bezierCurveTo(x+z*.35,y-z*.5,x+z*1.15,y-z*.1,x+z*.95,y+z*.38);c.bezierCurveTo(x+z*.8,y+z*.75,x+z*.3,y+z*.72,x+z*.1,y+z*.38);c.lineTo(x+z*.4,y+z);c.lineTo(x-z*.4,y+z);c.lineTo(x-z*.1,y+z*.38);c.bezierCurveTo(x-z*.3,y+z*.72,x-z*.8,y+z*.75,x-z*.95,y+z*.38);c.bezierCurveTo(x-z*1.15,y-z*.1,x-z*.35,y-z*.5,x,y-z);}
 else{const r=z*.44;c.moveTo(x+r,y-z*.48);c.arc(x,y-z*.48,r,0,6.2832);c.moveTo(x-z*.48+r,y+z*.14);c.arc(x-z*.48,y+z*.14,r,0,6.2832);c.moveTo(x+z*.48+r,y+z*.14);c.arc(x+z*.48,y+z*.14,r,0,6.2832);c.moveTo(x-z*.12,y);c.lineTo(x+z*.12,y);c.lineTo(x+z*.38,y+z);c.lineTo(x-z*.38,y+z);}
 c.closePath();};
const SCOL=['#d3203c','#d3203c','#17171f','#17171f'];
const suit=(s,x,y,z,col)=>{suitP(s,x,y,z);A.c.fillStyle=col||SCOL[s];A.c.fill();};
const CC=new Map();const cached=(key,w,h,fn)=>{if(typeof document==='undefined'||!document.createElement)return null;let cv=CC.get(key);if(!cv){cv=document.createElement('canvas');cv.width=(w+4)*2;cv.height=(h+4)*2;const cx=cv.getContext&&cv.getContext('2d');if(!cx)return null;cx.scale(2,2);cx.translate(1,1);const sv=A.c;A.c=cx;try{fn();}finally{A.c=sv;}if(CC.size>500)CC.clear();CC.set(key,cv);}return cv;};
const blit=(cv,x,y,w,h)=>A.c.drawImage(cv,x-1,y-1,w+4,h+4);
const TCC=new Map();const TX=(s,x,y,col,sc,al)=>{s=String(s).toUpperCase();sc=sc||1;const w=s.length*4*sc+2,h=6*sc+1,key=s+'|'+col+'|'+sc;let cv=TCC.get(key);
 if(cv===undefined){cv=null;if(typeof document!=='undefined'&&document.createElement){cv=document.createElement('canvas');cv.width=w*2;cv.height=h*2;const cx=cv.getContext&&cv.getContext('2d');if(cx){cx.scale(2,2);const sv=A.c;A.c=cx;try{T(s,0,0,col,sc);}finally{A.c=sv;}}else cv=null;}if(TCC.size>300)TCC.clear();TCC.set(key,cv);}
 if(!cv){T(s,x,y,col,sc,al);return;}const tw=s.length*4*sc-sc;const x0=Math.round(al==='c'?x-tw/2:al==='r'?x-tw:x);A.c.drawImage(cv,x0,Math.round(y),w,h);};
const CW=24,CH=34;
const cardBackRaw=(x,y,w,h,col)=>{const c=A.c;rrf(x+1,y+1.5,w,h,3,'rgba(0,0,0,.35)');rrf(x,y,w,h,3,'#f6f1e6');rrf(x+2,y+2,w-4,h-4,2,col||'#b3203a');c.save();rrp(x+2,y+2,w-4,h-4,2);if(c.clip)c.clip();c.strokeStyle='rgba(255,255,255,.26)';c.lineWidth=.6;c.beginPath();for(let i=-h;i<w+h;i+=4){c.moveTo(x+i,y);c.lineTo(x+i+h,y+h);c.moveTo(x+i+h,y);c.lineTo(x+i,y+h);}c.stroke();c.restore();rrs(x+3.5,y+3.5,w-7,h-7,1.5,'rgba(255,255,255,.55)',.7);};
const cardBack=(x,y,w,h,col)=>{const cv=cached('B'+w+'_'+h+(col||''),w,h,()=>cardBackRaw(0,0,w,h,col));if(cv)blit(cv,x,y,w,h);else cardBackRaw(x,y,w,h,col);};
/* a real-looking playing card: corner index, suit pips, face-card portrait panel (rendered once, then cached) */
const card=(x,y,cd,o)=>{o=o||{};const w=o.w||CW,h=o.h||CH;if(o.lift)y-=o.lift;
 if(!cd||o.back){cardBack(x,y,w,h,o.bc);if(o.hl)rrs(x-1,y-1,w+2,h+2,4,o.hlc||K.y,1.6);return;}
 const cv=cached('F'+cd.s+'_'+cd.r+'_'+w+'_'+h,w,h,()=>cardFace(0,0,cd,w,h));if(cv)blit(cv,x,y,w,h);else cardFace(x,y,cd,w,h);
 if(o.dim)rrf(x,y,w,h,3,'rgba(8,16,24,.5)');if(o.hl)rrs(x-1,y-1,w+2,h+2,4,o.hlc||K.y,1.6);};
const cardFace=(x,y,cd,w,h)=>{
 rrf(x+1,y+1.5,w,h,3,'rgba(0,0,0,.35)');rrf(x,y,w,h,3,lg(x,y,x+w*.5,y+h,['#ffffff','#f1eadb']));rrs(x+.5,y+.5,w-1,h-1,3,'#8f8672',1);
 const col=SCOL[cd.s],big=w>=34,sc=big?2:1,rs=RK[cd.r];
 T(rs,x+(rs.length>1?2:3)*(big?1.5:1),y+3,col,sc,null,1);suit(cd.s,x+(big?7:4.5),y+(big?20:12),big?3.6:2.3,col);
 if(cd.r>=10){const px=x+w*.32,py=y+h*.24,pw=w*.6,ph=h*.64;rrf(px,py,pw,ph,2,lg(px,py,px,py+ph,cd.s<2?['#ffe39a','#e8b850']:['#bcd6ff','#7fa4e0']));rrs(px,py,pw,ph,2,col,.8);
  const mx=px+pw/2,my=py+ph*.42,z=pw*.16;C(mx,my,z*1.6,'#f4cfa8');A.poly([[mx-z*1.7,my-z*1.2],[mx-z*1.7,my-z*2.8],[mx-z*.8,my-z*1.9],[mx,my-z*3],[mx+z*.8,my-z*1.9],[mx+z*1.7,my-z*2.8],[mx+z*1.7,my-z*1.2]],cd.r===10?'#3b6fd8':cd.r===11?'#d23a5a':'#f0b020',1);
  R(mx-z*2,my+z*1.4,z*4,ph*.34,cd.s<2?'#c8243c':'#243c8c');T(rs,mx,py+ph-(big?12:7),'#fff3d6',big?2:1,'c',1);}
 else if(cd.r===0)suit(cd.s,x+w*.6,y+h*.58,w*.3,col);
 else{suit(cd.s,x+w*.6,y+h*.6,w*.2,col);if(big){T(rs,x+w-4,y+h-12,col,1,'r',1);}}};
const fan=(n,cx,maxW,cw,sp)=>{sp=sp||cw+3;const s=n>1?Math.min(sp,(maxW-cw)/(n-1)):0;return{x0:cx-(s*(n-1)+cw)/2,s};};
const mIn=(x,y,w,h)=>A.mouse.x>=x&&A.mouse.x<x+w&&A.mouse.y>=y&&A.mouse.y<y+h;
const mAct=()=>!!(A.mouse.dx||A.mouse.dy||(A.mouse.down&&A.hit(0).a));
const clickOff=()=>A.mouse.down&&A.hit(0).a;
const pop=(txt,x,y,col)=>{if(A.silent)return;txt=String(txt);const hw=txt.length*4+2;x=cl(x,hw,W-hw);for(let k=0;k<5;k++){if(!A.fx.some(p=>p.txt&&p.t>14&&Math.abs(p.y-y)<12&&Math.abs(p.x-x)<(p.txt.length*4+hw)))break;y-=13;}A.fx.push({txt,x,y:Math.max(2,y),vx:0,vy:-.3,t:60,c:col||K.y,g:0});};
const endClock=()=>{let seen=false;return()=>{const c=A.clock?A.clock():0;if(c>90)seen=true;return seen&&c<=1;};};
const panelBox=(x,y,w,h,col)=>{rrf(x+2,y+3,w,h,5,'rgba(0,0,0,.45)');rrf(x,y,w,h,5,col||'rgba(12,10,30,.92)');rrs(x+.5,y+.5,w-1,h-1,5,'rgba(255,207,63,.8)',1);};
const chip=(x,y,col,n)=>{for(let i=0;i<(n||1);i++){const yy=y-i*2;ell(x,yy+1,6,2.6,'rgba(0,0,0,.35)');ell(x,yy,6,2.6,col);ells(x,yy,4.2,1.7,'rgba(255,255,255,.55)',.8);}};
/* tiny synth for party music (respects mute button and A.silent) */
let AC=null;const muted=()=>{if(A.silent)return true;try{const b=typeof document!=='undefined'&&document.getElementById('mute');return!!(b&&/off/i.test(b.textContent||''));}catch(e){return true;}};
const tone=(f,d,type,v)=>{if(muted())return;try{const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return;AC=AC||new Ctor();const o=AC.createOscillator(),gn=AC.createGain(),t=AC.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f,t);gn.gain.setValueAtTime(v||.03,t);gn.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(gn);gn.connect(AC.destination);o.start(t);o.stop(t+d+.03);}catch(e){}};
const hz=n=>440*Math.pow(2,(n-69)/12);
const SONGS=[{m:[72,0,76,79,76,0,74,72,69,0,72,76,74,0,71,67],b:[48,55,45,52,41,48,43,50]},{m:[67,69,71,74,0,71,74,76,79,0,76,74,71,0,69,67],b:[43,50,40,47,36,43,38,45]},{m:[76,76,0,76,0,72,76,0,79,0,0,0,67,0,0,0],b:[48,48,43,43,45,45,41,43]},{m:[69,72,76,72,69,72,76,79,77,74,71,74,72,69,64,0],b:[45,45,41,41,43,43,40,40]}];
const music=(t,song,tempo)=>{if(t%tempo)return;const i=t/tempo|0,m=song.m[i%song.m.length],sec=tempo/60;if(m)tone(hz(m),sec*.9,'square',.028);if(i%2===0)tone(hz(song.b[(i>>1)%song.b.length]),sec*1.7,'triangle',.07);if(i%4===2)tone(hz(90),.05,'sawtooth',.02);};

/* =================== LAST CARD =================== */
const LCC=['#e3343f','#f2b92a','#2fa84f','#2a6fd6'],LCN=['RED','YELLOW','GREEN','BLUE'];
const lcDeck=()=>{const d=[];for(let c=0;c<4;c++){d.push({c,v:0});for(let v=1;v<=12;v++){d.push({c,v});d.push({c,v});}}for(let i=0;i<4;i++){d.push({c:4,v:13});d.push({c:4,v:14});}return shuf(d);};
const lcPts=cd=>cd.v<10?cd.v:cd.v<13?20:50;
const quad=(x,y,rx,ry,rot)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(rot);for(let k=0;k<4;k++){c.beginPath();c.moveTo(0,0);c.ellipse(0,0,rx,ry,0,k*1.5708,(k+1)*1.5708);c.closePath();c.fillStyle=LCC[k];c.fill();}c.restore();};
const lcSym=(cd,x,y,col,big)=>{const v=cd.v,s=big?1:.55;
 if(v<10)T(''+v,x,y-(big?5:2),col,big?2:1,'c',1);
 else if(v===10){const c=A.c;c.beginPath();c.arc(x,y,5*s+.5,0,6.2832);c.strokeStyle=col;c.lineWidth=big?2:1;c.stroke();L(x-3.5*s,y+3.5*s,x+3.5*s,y-3.5*s,col,big?2:1);}
 else if(v===11){const lw=big?1.6:1;L(x-4*s,y+1*s,x+2*s,y-5*s,col,lw);A.poly([[x+3.5*s,y-6.5*s],[x+3.5*s,y-2*s],[x-.5*s,y-6.5*s]],col,1);L(x+4*s,y-1*s,x-2*s,y+5*s,col,lw);A.poly([[x-3.5*s,y+6.5*s],[x-3.5*s,y+2*s],[x+.5*s,y+6.5*s]],col,1);}
 else if(v===12)T('+2',x,y-(big?5:2),col,big?2:1,'c',1);
 else if(v===14)T('+4',x,y-(big?5:2),col,big?2:1,'c',1);
 else if(!big)T('W',x,y-2,col,1,'c',1);};
const lcCard=(x,y,cd,o)=>{o=o||{};const w=o.w||CW,h=o.h||CH;if(o.lift)y-=o.lift;const bk=!cd||o.back;
 const cv=cached('L'+(bk?'b':cd.c+'_'+cd.v)+'_'+w+'_'+h,w,h,()=>lcRaw(0,0,bk?null:cd,w,h));if(cv)blit(cv,x,y,w,h);else lcRaw(x,y,bk?null:cd,w,h);
 if(o.dim&&!bk)rrf(x,y,w,h,3,'rgba(8,8,16,.48)');if(o.hl)rrs(x-1,y-1,w+2,h+2,4,o.hlc||K.y,1.6);};
const lcRaw=(x,y,cd,w,h)=>{const c=A.c;
 rrf(x+1,y+1.5,w,h,3,'rgba(0,0,0,.35)');rrf(x,y,w,h,3,'#fbfbf6');
 if(!cd){rrf(x+1.5,y+1.5,w-3,h-3,2.5,'#18181f');c.save();c.translate(x+w/2,y+h/2);c.rotate(-.5);ell(0,0,w*.34,h*.33,'#e3343f');c.restore();T('LC',x+w/2,y+h/2-2,'#ffcf3f',1,'c',1);return;}
 const base=cd.c<4?LCC[cd.c]:'#1c1c24';rrf(x+1.5,y+1.5,w-3,h-3,2.5,lg(x,y,x+w,y+h,[A.mix(base,'#ffffff',.18),base,A.mix(base,'#000000',.25)]));
 const mx=x+w/2,my=y+h/2;if(cd.c===4)quad(mx,my,w*.3,h*.34,-.5);else{c.save();c.translate(mx,my);c.rotate(-.5);ell(0,0,w*.3,h*.36,'#fbfbf6');c.restore();}
 const sc=cd.c<4?base:'#fbfbf6';if(cd.c<4||cd.v===14){if(cd.v===14){T('+4',mx+1,my-4,'#000',2,'c',1);T('+4',mx,my-5,'#fbfbf6',2,'c',1);}else lcSym(cd,mx,my,sc,w>=22);}
 lcSym(cd,x+5,y+5,'#fbfbf6',false);};

A.add({id:'lastcard',name:'LAST CARD',cat:'CARDS',time:420,how:'MATCH COLOUR OR NUMBER. A PLAYS, B DRAWS, UP CALLS LAST CARD. EMPTY YOUR HAND FIRST.',make(){
 const g={over:null,score:0},NM=['YOU','WEST','NORTH','EAST'],SEAT=[[160,196],[22,110],[160,26],[298,110]],ck=endClock(),ROUNDS=5;
 let d,pile,hands,turn=0,dir=1,curC=0,curV=0,sel=null,wait=0,ph='play',drawn=null,pickC=0,pickCard=null,called=false,round=0,pts=[0,0,0,0],fly=null,endT=0,lastWin=-1,think='';
 const sortH=()=>hands[0].sort((a,b)=>a.c-b.c||a.v-b.v);
 const deal=()=>{d=lcDeck();hands=[[],[],[],[]];for(let k=0;k<7;k++)for(let i=0;i<4;i++)hands[i].push(d.pop());let t=d.pop();while(t.v>=10){d.unshift(t);t=d.pop();}t.ang=rnd(.4)-.2;pile=[t];curC=t.c;curV=t.v;dir=1;turn=round%4;wait=45;ph='play';drawn=null;called=false;sortH();sel=null;};
 const legal=(i,cd)=>cd.c===4?(cd.v===13||!hands[i].some(x=>x.c===curC)):(cd.c===curC||cd.v===curV);
 const nxt=k=>(turn+dir*k+8)%4;
 const drawN=(i,n)=>{let got=null;for(let k=0;k<n;k++){if(!d.length&&pile.length>1){const t=pile.pop();d=shuf(pile);pile=[t];}if(!d.length)break;got=d.pop();hands[i].push(got);}if(i===0)sortH();return got;};
 const bestCol=(i)=>{const cnt=[0,0,0,0];hands[i].forEach(c=>{if(c.c<4)cnt[c.c]+=1+lcPts(c)/30;});let b=0;for(let k=1;k<4;k++)if(cnt[k]>cnt[b])b=k;return cnt[b]>0?b:ri(4);};
 const finish=()=>{let pos=0;for(let i=1;i<4;i++)if(pts[i]>pts[0])pos++;g.score=pts[0];g.over=pos===0?'YOU FINISH 1ST - WIN!':'YOU FINISH '+ORD[pos]+' ('+pts[0]+' PTS)';};
 const endRound=w=>{let s=0;for(let i=0;i<4;i++)if(i!==w)s+=hands[i].reduce((a,c)=>a+lcPts(c),0);pts[w]+=s;g.score=pts[0];lastWin=w;ph='end';endT=170;S(w===0?'win':'lose');if(w===0)A.burst(160,190,K.y,30,3);};
 const play=(i,cd,col)=>{const hd=hands[i];hd.splice(hd.indexOf(cd),1);cd.ang=rnd(.5)-.25;pile.push(cd);curV=cd.v;curC=cd.c<4?cd.c:col;pts[i]+=2;g.score=pts[0];S('hit');fly={cd,x:SEAT[i][0],y:SEAT[i][1],t:0};drawn=null;
  if(hd.length===1){if(i===0&&!called&&Math.random()<.85){drawN(0,2);pop('CAUGHT! +2',160,160,K.r);S('lose');}else pop('LAST CARD!',SEAT[i][0],SEAT[i][1]+(i===2?30:i===0?-24:0),K.y);}
  called=false;if(cd.c===4)pop(LCN[curC]+'!',160,78,LCC[curC]);
  if(!hd.length){if(cd.v===12)drawN(nxt(1),2);if(cd.v===14)drawN(nxt(1),4);endRound(i);return;}
  let k=1;if(cd.v===10){k=2;pop(NM[nxt(1)]+' SKIPPED',160,150,K.o);}else if(cd.v===11){dir=-dir;pop('REVERSE!',160,150,K.c);}else if(cd.v===12){drawN(nxt(1),2);pop(NM[nxt(1)]+' +2',160,150,K.r);k=2;}else if(cd.v===14){drawN(nxt(1),4);pop(NM[nxt(1)]+' +4',160,150,K.r);k=2;}
  turn=nxt(k);wait=i===0?22:34;sel=null;};
 const cpuPick=i=>{const hd=hands[i],n=hands[nxt(1)].length,cnt=[0,0,0,0];hd.forEach(c=>{if(c.c<4)cnt[c.c]++;});let bc=null,bs=-1e9;
  for(const cd of hd){if(!legal(i,cd))continue;let s;if(cd.c===4){s=-28-(cd.v===14?8:0);if(n<=2)s+=cd.v===14?60:30;if(hd.length<=2)s+=50;}
   else{s=cnt[cd.c]*4+lcPts(cd)*.25;if(cd.v>=10&&cd.v<=12)s+=n<=2?40:nxt(1)===0?7:3;if(cd.c!==curC&&cnt[cd.c]<cnt[curC])s-=3;}
   s+=rnd(1.5);if(s>bs){bs=s;bc=cd;}}return bc;};
 deal();
 g.update=()=>{if(fly&&++fly.t>=10)fly=null;if(ck()){finish();return;}
  if(ph==='end'){if(--endT<=0||(endT<130&&A.hit(0).a)){round++;if(round>=ROUNDS)finish();else deal();}return;}
  if(wait>0){wait--;return;}
  if(turn!==0){const i=turn;think=NM[i];
   if(drawn){if(legal(i,drawn))play(i,drawn,drawn.c===4?bestCol(i):0);else{turn=nxt(1);wait=26;drawn=null;}return;}
   const cd=cpuPick(i);if(cd)play(i,cd,cd.c===4?bestCol(i):0);else{drawn=drawN(i,1);S('blip');wait=24;if(!drawn){turn=nxt(1);}}return;}
  const hd=hands[0],h=A.hit(0);
  if(ph==='pick'){if(h.l){pickC=(pickC+3)%4;S('blip');}if(h.r){pickC=(pickC+1)%4;S('blip');}for(let k=0;k<4;k++)if(mIn(96+k*34,104,28,28)&&mAct())pickC=k;if(h.a){ph='play';play(0,pickCard,pickC);}if(h.b)ph='play';return;}
  const leg=drawn?[drawn].filter(c=>legal(0,c)):hd.filter(c=>legal(0,c)),tg=leg.concat(drawn?[]:['pile']);
  if(sel===null||(sel!=='pile'&&!hd.includes(sel))||(drawn&&sel!==drawn&&sel!=='pile'))sel=tg[0]||'pile';
  const f=fan(hd.length,160,300,CW);let hov=null;for(let k=hd.length-1;k>=0;k--)if(mIn(f.x0+k*f.s,196-7,k===hd.length-1?CW:f.s,CH+7)){hov=hd[k];break;}if(mIn(118,90,30,42))hov='pile';
  if(hov&&mAct())sel=hov;if(h.l||h.r){let k=tg.indexOf(sel);k=k<0?0:(k+(h.r?1:tg.length-1))%tg.length;sel=tg[k];S('blip');}
  if(h.u&&hd.length===2&&!called){called=true;pop('LAST CARD!',160,170,K.y);S('coin');}
  const doDraw=()=>{if(drawn){turn=nxt(1);wait=20;drawn=null;return;}drawn=drawN(0,1);S('blip');if(!drawn||!legal(0,drawn)){pop(drawn?'NO LUCK':'EMPTY',160,160,K.gr);turn=nxt(1);wait=26;drawn=null;}else sel=drawn;};
  if(h.a&&!(clickOff()&&!hov)){if(sel==='pile')doDraw();else if(sel&&legal(0,sel)){if(sel.c===4){pickCard=sel;ph='pick';hd.splice(hd.indexOf(sel),1);pickC=bestCol(0);hd.push(sel);sortH();}else play(0,sel,0);}else S('lose');}
  else if(h.b)doDraw();};
 g.draw=()=>{felt('#0e5a3a',1);const cx=A.c;
  // direction ring
  cx.strokeStyle='rgba(255,255,255,.12)';cx.lineWidth=3;cx.beginPath();cx.ellipse(160,112,74,46,0,0,6.2832);cx.stroke();for(let k=0;k<6;k++){const a=k*1.047+A.t*.02*-dir,x=160+Math.cos(a)*74,y=112+Math.sin(a)*46,a2=a-dir*.25;A.poly([[x,y],[160+Math.cos(a2)*80,112+Math.sin(a2)*50],[160+Math.cos(a2)*68,112+Math.sin(a2)*42]],'rgba(255,255,255,.22)',1);}
  // piles
  for(let k=2;k>=0;k--)lcCard(118+k,92-k,null,{back:1,w:30,h:42,hl:turn===0&&sel==='pile'&&!k&&ph==='play'});T(''+d.length,133,137,'#dfe',1,'c');
  const n=pile.length;for(let k=Math.max(0,n-3);k<n;k++){const cd=pile[k];if(fly&&cd===fly.cd)continue;cx.save();cx.translate(179,113);cx.rotate(cd.ang||0);lcCard(-15,-21,cd,{w:30,h:42});cx.restore();}
  ells(179,113,26,30,LCC[curC],2);T(LCN[curC],179,142,LCC[curC],1,'c');
  if(fly){const t=fly.t/10,x=fly.x+(179-fly.x)*t,y=fly.y+(113-fly.y)*t;lcCard(x-15,y-21,fly.cd,{w:30,h:42});}
  // opponents
  const lab=(i,x,y,al)=>{const on=turn===i&&ph==='play';T(NM[i]+' '+hands[i].length,x,y,on?K.y:'#cfe8d8',1,al);if(on)C(al==='r'?x+4:al==='c'?x-NM[i].length*4-10:x-5,y+2,2,K.y);};
  {const hd=hands[1],sp=Math.min(9,104/Math.max(1,hd.length));hd.forEach((c,k)=>lcCard(6,58+k*sp,null,{back:1,w:22,h:30}));lab(1,6,48);}
  {const hd=hands[3],sp=Math.min(9,104/Math.max(1,hd.length));hd.forEach((c,k)=>lcCard(292,58+k*sp,null,{back:1,w:22,h:30}));lab(3,314,48,'r');}
  {const hd=hands[2],f=fan(hd.length,160,150,20);hd.forEach((c,k)=>lcCard(f.x0+k*f.s,12,null,{back:1,w:20,h:28}));lab(2,160,43,'c');}
  // your hand
  const hd=hands[0],f=fan(hd.length,160,300,CW),my=turn===0&&ph==='play'&&!wait;hd.forEach((c,k)=>{const s=my&&c===sel;lcCard(f.x0+k*f.s,200,c,{lift:s?8:0,dim:my&&(drawn?c!==drawn:!legal(0,c)),hl:s});});
  // hud
  T('ROUND '+Math.min(round+1,ROUNDS)+'/'+ROUNDS,4,4,K.w,1);T('YOU '+pts[0]+'  W '+pts[1]+'  N '+pts[2]+'  E '+pts[3],316,4,K.y,1,'r');
  let m='';if(ph==='play'){if(turn===0&&!wait)m=drawn?'PLAY IT? A PLAYS  B KEEPS':hd.length===2&&!called?'UP = CALL LAST CARD!':'A PLAYS  B DRAWS';else if(turn!==0)m=NM[turn]+' IS THINKING...';}
  if(m)T(m,160,164,turn===0?K.w:'#b8d8c8',1,'c');
  if(ph==='pick'){panelBox(84,86,152,58);T('PICK A COLOUR',160,92,K.w,1,'c');for(let k=0;k<4;k++){rrf(96+k*34,104,28,28,4,LCC[k]);if(k===pickC)rrs(94+k*34,102,32,32,5,K.w,2);}T('LEFT/RIGHT  A OK',160,136,K.gr,1,'c');}
  if(ph==='end'){panelBox(70,62,180,96);T(lastWin===0?'YOU WENT OUT!':NM[lastWin]+' WENT OUT',160,70,lastWin===0?K.y:K.w,1,'c');for(let i=0;i<4;i++){T(NM[i],90,88+i*12,i===lastWin?K.y:K.w,1);T(hands[i].length+' LEFT',170,88+i*12,K.gr,1,'c');T(pts[i]+' PTS',230,88+i*12,K.c,1,'r');}T(round+1<ROUNDS?'NEXT ROUND...':'FINAL SCORES',160,142,K.gr,1,'c');}};
 return g;}});

/* =================== GO FISH =================== */
const RKP=['ACES','TWOS','THREES','FOURS','FIVES','SIXES','SEVENS','EIGHTS','NINES','TENS','JACKS','QUEENS','KINGS'];
A.add({id:'gofish',name:'GO FISH',cat:'CARDS',time:420,how:'LEFT/RIGHT PICK A RANK, UP/DOWN PICK A PLAYER, A ASKS. COLLECT BOOKS OF FOUR.',make(){
 const g={over:null,score:0},NM=['YOU','MAX','ZOE'],ck=endClock(),MEM=[0,.8,.65];
 let d=deck52(),hands=[[],[],[]],books=[[],[],[]],turn=0,ph='ask',wait=40,selR=0,tgt=1,bub=[null,null,null],ask=null,got=0,know=[null,[{},{},{}],[{},{},{}]],no=[null,[{},{},{}],[{},{},{}]],pondX=[];
 for(let k=0;k<7;k++)for(let i=0;i<3;i++)hands[i].push(d.pop());for(let k=0;k<52;k++)pondX.push([rnd(60)-30,rnd(30)-15,rnd(1)-.5]);
 const sortH=i=>hands[i].sort((a,b)=>a.r-b.r||a.s-b.s);[0,1,2].forEach(sortH);
 const say=(i,t,n)=>{bub[i]={t,n:n||70};};
 const ranks=i=>[...new Set(hands[i].map(c=>c.r))];
 const forget=(r,q)=>{for(let i=1;i<3;i++)delete know[i][q][r];};
 const checkBooks=i=>{for(let r=0;r<13;r++){const cs=hands[i].filter(c=>c.r===r);if(cs.length===4){hands[i]=hands[i].filter(c=>c.r!==r);books[i].push(r);for(let q=0;q<3;q++)forget(r,q);if(i===0){g.score+=10;A.burst(160,190,K.y,24,3);}say(i,'BOOK OF '+RKP[r]+'!',80);S('score');}}};
 const total=()=>books[0].length+books[1].length+books[2].length;
 const finish=()=>{const b=books.map(x=>x.length),m=Math.max(...b),lead=b.filter(x=>x===m).length;g.over=b[0]===m?(lead>1?'TIED AT '+m+' BOOKS':'YOU WIN WITH '+m+' BOOKS!'):NM[b.indexOf(m)]+' TAKES IT, '+m+' BOOKS';};
 const draw=i=>{if(!d.length)return null;const c=d.pop();hands[i].push(c);sortH(i);for(let k=1;k<3;k++)no[k][i]={};return c;};
 const nextTurn=()=>{turn=(turn+1)%3;wait=30;ph='ask';};
 const startAsk=(i,q,r)=>{ask={i,q,r};say(i,NM[q]+', ANY '+RKP[r]+'?',60);ph='wait';wait=48;for(let k=1;k<3;k++)if(k!==i&&Math.random()<MEM[k])know[k][i][r]=1;S('blip');};
 const resolve=()=>{const{i,q,r}=ask,has=hands[q].filter(c=>c.r===r);if(has.length){hands[q]=hands[q].filter(c=>c.r!==r);hands[i].push(...has);sortH(i);forget(r,q);say(q,'YES, '+has.length+'. HERE.',60);if(i===0)g.score+=has.length;S('coin');checkBooks(i);ph='ask';wait=50;}
  else{say(q,'GO FISH!',60);for(let k=1;k<3;k++)no[k][q][r]=1;const c=draw(i);S('hit');if(c&&c.r===r){if(i===0){g.score+=1;pop('LUCKY FISH!',160,170,K.c);}else say(i,'LUCKY! AGAIN',50);checkBooks(i);ph='ask';wait=50;}else{if(c)checkBooks(i);nextTurn();wait=60;}}ask=null;
  if(total()>=13)ph='done',wait=70;};
 const cpu=i=>{const rs=ranks(i),cnt={};hands[i].forEach(c=>cnt[c.r]=(cnt[c.r]||0)+1);let best=null,bs=-1e9;for(const r of rs)for(const q of [0,1,2]){if(q===i||!hands[q].length)continue;let s=(know[i][q][r]?10:0)-(no[i][q][r]?7:0)+cnt[r]*1.4+rnd(1.2);if(s>bs){bs=s;best=[q,r];}}return best;};
 g.update=()=>{for(let i=0;i<3;i++)if(bub[i]&&--bub[i].n<=0)bub[i]=null;if(ck()){finish();return;}if(wait>0){wait--;return;}
  if(ph==='done'){finish();return;}if(ph==='wait'){resolve();return;}
  const i=turn;if(!hands[i].length){if(d.length){draw(i);say(i,'DRAWS A CARD',40);checkBooks(i);wait=30;if(total()>=13)ph='done';return;}if(!hands[0].length&&!hands[1].length&&!hands[2].length){finish();return;}nextTurn();return;}
  if(!hands[0].length&&!hands[1].length&&!hands[2].length){finish();return;}
  if(i!==0){const c=cpu(i);if(c)startAsk(i,c[0],c[1]);else nextTurn();return;}
  const rs=ranks(0),h=A.hit(0);selR=cl(selR,0,rs.length-1);if(!hands[tgt].length)tgt=3-tgt;
  const f=fan(hands[0].length,160,300,CW);let hov=-1;for(let k=hands[0].length-1;k>=0;k--)if(mIn(f.x0+k*f.s,190,k===hands[0].length-1?CW:f.s,42)){hov=rs.indexOf(hands[0][k].r);break;}if(hov>=0&&mAct())selR=hov;
  let tq=-1;if(mIn(6,6,130,70))tq=1;if(mIn(184,6,130,70))tq=2;if(tq>0&&hands[tq].length&&mAct())tgt=tq;
  if(h.l){selR=(selR+rs.length-1)%rs.length;S('blip');}if(h.r){selR=(selR+1)%rs.length;S('blip');}if((h.u||h.d)&&hands[3-tgt].length){tgt=3-tgt;S('blip');}
  if(h.a&&!(clickOff()&&hov<0&&tq<0))startAsk(0,tgt,rs[selR]);};
 g.draw=()=>{felt('#12506a');const rs=hands[0].length?ranks(0):[],my=turn===0&&ph==='ask'&&!wait;
  // pond
  const pn=d.length;for(let k=0;k<pn;k++){const p=pondX[k];A.c.save();A.c.translate(160+p[0],108+p[1]);A.c.rotate(p[2]);cardBack(-9,-12,18,24,'#2a5fb0');A.c.restore();}T('POND '+pn,160,138,'#bfe0f0',1,'c');
  // opponents
  for(const i of [1,2]){const bx=i===1?6:184,on=turn===i;rrf(bx,6,130,70,6,on?'rgba(255,207,63,.16)':'rgba(0,0,0,.22)');if(tgt===i&&my)rrs(bx,6,130,70,6,K.y,1.5);
   A.person(bx+18,62,{s:1.1,c:i===1?'#e0663a':'#a05ae0',id:i+2,arm1:bub[i]?-1.2:undefined});T(NM[i],bx+36,12,on?K.y:K.w,1);T(hands[i].length+' CARDS',bx+36,22,'#bfe0f0',1);
   const f=fan(hands[i].length,bx+84,90,14,8);hands[i].forEach((c,k)=>cardBack(f.x0+k*f.s,32,14,20,'#2a5fb0'));
   T('BOOKS '+books[i].length,bx+36,58,K.c,1);books[i].forEach((r,k)=>{card(bx+84+k*5,54,{s:k%4,r},{w:12,h:16});});}
  // your books
  T('YOUR BOOKS '+books[0].length,6,150,K.c,1);books[0].forEach((r,k)=>card(6+k*14,158,{s:(k+1)%4,r},{w:13,h:18}));
  // hand
  const f=fan(hands[0].length,160,300,CW);hands[0].forEach((c,k)=>{const s=my&&c.r===rs[selR];card(f.x0+k*f.s,200,c,{lift:s?9:0,hl:s});});
  // bubbles
  const bp=[[160,176],[72,86],[250,86]];for(let i=0;i<3;i++){const b=bub[i];if(!b)continue;const w=b.t.length*4+10,x=cl(bp[i][0]-w/2,2,W-w-2),y=bp[i][1];rrf(x,y,w,13,4,'#fff8e8');A.poly([[bp[i][0]-4,y],[bp[i][0]+4,y],[bp[i][0],y-5]],'#fff8e8',1);T(b.t,x+5,y+4,'#222',1);}
  T('BOOKS LEFT '+(13-books[0].length-books[1].length-books[2].length),314,150,'#bfe0f0',1,'r');
  if(my&&rs.length)T('ASK '+NM[tgt]+' FOR '+RKP[rs[selR]]+'  (A)',160,176,K.y,1,'c');else if(turn!==0&&!bub[turn]&&ph==='ask')T(NM[turn]+' IS THINKING',160,176,'#bfe0f0',1,'c');};
 return g;}});

/* =================== HEARTS =================== */
const hv=c=>c.r===0?14:c.r+1,isQS=c=>c.s===3&&c.r===11;
A.add({id:'hearts',name:'HEARTS',cat:'CARDS',time:480,how:'PASS 3 CARDS, THEN FOLLOW SUIT. AVOID HEARTS AND THE QUEEN OF SPADES. LOW SCORE WINS.',make(){
 const g={over:null,score:0},NM=['YOU','WEST','NORTH','EAST'],ck=endClock(),PD=[1,3,2,0],PDN=['','LEFT','ACROSS','RIGHT'],TP=[[148,120],[112,98],[148,76],[184,98]],SEAT=[[160,210],[16,110],[160,20],[304,110]],GOAL=50;
 let hands,trick=[],lead=0,turn=0,broken=false,first=true,taken=[0,0,0,0],tot=[0,0,0,0],handNo=0,ph='pass',wait=0,sel=null,picks=[],passT=0,qsOut=true,collect=null,moon=-1,endT=0,won=[0,0,0,0];
 const sortH=h=>h.sort((a,b)=>a.s===b.s?hv(a)-hv(b):[2,1,3,0].indexOf(a.s)-[2,1,3,0].indexOf(b.s));
 const deal=()=>{const d=deck52();hands=[[],[],[],[]];for(let k=0;k<52;k++)hands[k%4].push(d[k]);hands.forEach(sortH);trick=[];broken=false;first=true;taken=[0,0,0,0];won=[0,0,0,0];qsOut=true;picks=[];sel=null;moon=-1;const pd=PD[handNo%4];if(pd){ph='pass';wait=20;}else startPlay();};
 const startPlay=()=>{ph='play';for(let i=0;i<4;i++)if(hands[i].some(c=>c.s===2&&c.r===1)){turn=lead=i;}wait=40;};
 const legalH=i=>{const h=hands[i];if(!trick.length){if(first)return h.filter(c=>c.s===2&&c.r===1);const nh=h.filter(c=>c.s!==0);return broken||!nh.length?h:nh;}
  const ls=trick[0].c.s,f=h.filter(c=>c.s===ls);if(f.length)return f;if(first){const sf=h.filter(c=>c.s!==0&&!isQS(c));if(sf.length)return sf;}return h;};
 const passPick=i=>{const h=hands[i],low=h.filter(x=>x.s===3&&hv(x)<12).length;const sc=c=>{let s=hv(c);if(c.s===3&&hv(c)>=12)s+=low>=4?-8:22;if(c.s===0)s+=4;const n=h.filter(x=>x.s===c.s).length;if(n<=2&&c.s!==3)s+=5;if(c.s===2&&c.r===1)s-=20;return s;};return h.slice().sort((a,b)=>sc(b)-sc(a)).slice(0,3);};
 const doPass=()=>{const pd=PD[handNo%4],out=[picks.slice(),passPick(1),passPick(2),passPick(3)];for(let i=0;i<4;i++)for(const c of out[i]){hands[i].splice(hands[i].indexOf(c),1);}for(let i=0;i<4;i++)for(const c of out[i]){c.nw=(i+pd)%4===0?1:0;hands[(i+pd)%4].push(c);}hands.forEach(sortH);picks=[];S('coin');startPlay();};
 const tPts=()=>trick.reduce((a,t)=>a+(t.c.s===0?1:0)+(isQS(t.c)?13:0),0);
 const winner=()=>{const ls=trick[0].c.s;let b=trick[0];for(const t of trick)if(t.c.s===ls&&hv(t.c)>hv(b.c))b=t;return b;};
 const choose=i=>{const Lg=legalH(i),h=hands[i];if(Lg.length===1)return Lg[0];const hasQS=h.some(isQS),mx=a=>a.reduce((p,c)=>hv(c)>hv(p)?c:p),mn=a=>a.reduce((p,c)=>hv(c)<hv(p)?c:p),cnt=s=>h.filter(c=>c.s===s).length;
  if(!trick.length){let b=null,bs=1e9;for(const c of Lg){let s=hv(c)+cnt(c.s)*.9;if(c.s===3){if(hasQS)s+=hv(c)>=12?40:6;else if(qsOut&&hv(c)<12)s-=5;else if(qsOut)s+=30;}if(c.s===0)s+=5;s+=rnd(1);if(s<bs){bs=s;b=c;}}return b;}
  const ls=trick[0].c.s,w=winner().c,last=trick.length===3,p=tPts();
  if(Lg[0].s===ls&&Lg.every(c=>c.s===ls)){if(first)return mx(Lg);const q=Lg.find(isQS);if(q&&ls===3&&hv(w)>12)return q;
   if(last&&p===0){const nq=Lg.filter(c=>!isQS(c));return mx(nq.length?nq:Lg);}
   const under=Lg.filter(c=>hv(c)<hv(w)&&!isQS(c));if(under.length)return mx(under);if(q&&hv(w)>12)return q;
   const nq=Lg.filter(c=>!isQS(c));const pool=nq.length?nq:Lg;return ls===3&&qsOut?mn(pool):mx(pool);}
  const q=Lg.find(isQS);if(q)return q;if(qsOut){const hs=Lg.filter(c=>c.s===3&&hv(c)>=13);if(hs.length)return mx(hs);}const hr=Lg.filter(c=>c.s===0);if(hr.length)return mx(hr);
  let b=Lg[0],bs=-1e9;for(const c of Lg){const s=hv(c)-cnt(c.s)*1.5;if(s>bs){bs=s;b=c;}}return b;};
 const playC=(i,c)=>{hands[i].splice(hands[i].indexOf(c),1);trick.push({p:i,c});if(c.s===0&&!broken){broken=true;pop('HEARTS BROKEN',160,150,K.r);}if(isQS(c))qsOut=false;S(isQS(c)?'boom':'hit');hands[0].forEach(x=>x.nw=0);
  if(trick.length===4){const wn=winner().p;collect={p:wn,t:0};ph='collect';wait=48;}else{turn=(turn+1)%4;wait=i===0?14:24;}sel=null;};
 const endHand=()=>{moon=-1;for(let i=0;i<4;i++)if(taken[i]===26)moon=i;if(moon>=0){for(let i=0;i<4;i++)tot[i]+=i===moon?0:26;}else for(let i=0;i<4;i++)tot[i]+=taken[i];
  g.score+=moon===0?52:moon>=0?0:26-taken[0];ph='handEnd';endT=200;S(taken[0]===0||moon===0?'win':'blip');handNo++;};
 const finish=()=>{const m=Math.min(...tot),me=tot[0]===m;let pos=0;for(let i=1;i<4;i++)if(tot[i]<tot[0])pos++;if(me)g.score+=50;g.over=me?'YOU WIN HEARTS WITH '+tot[0]+'!':'YOU FINISH '+ORD[pos]+' WITH '+tot[0];};
 deal();
 g.update=()=>{if(ck()){finish();return;}if(collect)collect.t++;
  if(ph==='handEnd'){if(--endT<=0||(endT<160&&A.hit(0).a)){if(Math.max(...tot)>=GOAL)finish();else deal();}return;}
  if(wait>0){wait--;return;}
  if(ph==='collect'){const wn=collect.p;taken[wn]+=tPts();won[wn]++;if(tPts()&&wn===0)S('lose');trick=[];first=false;collect=null;lead=turn=wn;if(!hands[0].length){endHand();return;}ph='play';wait=10;return;}
  const h=A.hit(0),hd=hands[0],f=fan(hd.length,160,300,CW);let hov=null;for(let k=hd.length-1;k>=0;k--)if(mIn(f.x0+k*f.s,192,k===hd.length-1?CW:f.s,42)){hov=hd[k];break;}
  if(ph==='pass'){if(passT>0){if(--passT===0){doPass();return;}}if(hov&&mAct())sel=hov;if(!sel||!hd.includes(sel))sel=hd[0];
   if(h.l||h.r){let k=hd.indexOf(sel);sel=hd[(k+(h.r?1:hd.length-1))%hd.length];S('blip');}
   if(h.a&&!(clickOff()&&!hov)){const k=picks.indexOf(sel);if(k>=0){picks.splice(k,1);passT=0;}else if(picks.length<3){picks.push(sel);if(picks.length===3)passT=50;{const nx=hd.find((c,i)=>i>hd.indexOf(sel)&&!picks.includes(c))||hd.find(c=>!picks.includes(c));if(nx)sel=nx;}}S('blip');}return;}
  if(ph!=='play')return;
  if(turn!==0){playC(turn,choose(turn));return;}
  const Lg=legalH(0);if(!sel||!Lg.includes(sel))sel=Lg[0];if(hov&&mAct())sel=hov;
  if(h.l||h.r){let k=Lg.indexOf(sel);k=k<0?0:(k+(h.r?1:Lg.length-1))%Lg.length;sel=Lg[k];S('blip');}
  if(h.a&&!(clickOff()&&!hov)){if(Lg.includes(sel))playC(0,sel);else{S('lose');pop(trick.length?'FOLLOW SUIT':first?'LEAD 2 OF CLUBS':'HEARTS NOT BROKEN',160,170,K.r);}}};
 g.draw=()=>{felt('#1b5e3b',1);const hd=hands[0];
  // opponents
  {const n=hands[1].length;for(let k=0;k<n;k++)cardBack(4,50+k*8,22,30,'#8a2233');}{const n=hands[3].length;for(let k=0;k<n;k++)cardBack(294,50+k*8,22,30,'#8a2233');}
  {const n=hands[2].length,f=fan(n,160,130,20);for(let k=0;k<n;k++)cardBack(f.x0+k*f.s,8,20,28,'#8a2233');}
  const lab=(i,x,y,al)=>T(NM[i]+' '+tot[i]+(taken[i]?' +'+taken[i]:''),x,y,turn===i&&ph==='play'?K.y:'#d8f0e0',1,al);lab(1,4,40);lab(3,316,40,'r');lab(2,160,40,'c');
  // trick
  const ctr=[160,110];for(const t of trick){let[x,y]=TP[t.p];if(collect&&collect.t>30){const k=Math.min(1,(collect.t-30)/16),s=SEAT[collect.p];x+=(s[0]-x-12)*k;y+=(s[1]-y-17)*k;}card(x,y,t.c);}
  if(!trick.length&&ph==='play'&&!collect)T(broken?'HEARTS BROKEN':'HEARTS NOT BROKEN',ctr[0],ctr[1],broken?'#ff9aa8':'#9ad0b0',1,'c');
  // hand
  const my=turn===0&&ph==='play'&&!wait,Lg=my?legalH(0):null,f=fan(hd.length,160,300,CW);
  hd.forEach((c,k)=>{const pk=picks.includes(c),s=c===sel&&(my||ph==='pass');card(f.x0+k*f.s,202,c,{lift:pk?12:s?6:c.nw?4:0,dim:my&&!Lg.includes(c),hl:s||pk,hlc:pk?K.c:K.y});});
  T('HAND '+(handNo+1),4,4,K.w,1);T('FIRST TO '+GOAL+' ENDS IT',316,4,'#a8d0b8',1,'r');
  if(ph==='pass'){const pd=PD[handNo%4];panelBox(90,128,140,34);T('PASS 3 CARDS '+PDN[pd],160,134,K.y,1,'c');T(passT?'PASSING...  A UNDOES':picks.length+'/3 PICKED  A PICKS',160,148,K.w,1,'c');}
  else if(my)T(trick.length?'FOLLOW SUIT IF YOU CAN':'YOUR LEAD',160,178,K.w,1,'c');
  if(ph==='handEnd'){panelBox(66,58,188,110);T(moon>=0?NM[moon]+' SHOT THE MOON!':'HAND OVER',160,66,moon>=0?K.r:K.y,1,'c');T('HAND',180,82,K.gr,1,'c');T('TOTAL',236,82,K.gr,1,'r');for(let i=0;i<4;i++){T(NM[i],80,96+i*13,i===0?K.c:K.w,1);suit(0,150,98+i*13,3,'#ff5a6a');T('+'+(moon>=0?(i===moon?0:26):taken[i]),180,96+i*13,K.w,1,'c');T(''+tot[i],236,96+i*13,K.y,1,'r');}T(Math.max(...tot)>=GOAL?'GAME OVER':'NEXT HAND...',160,154,K.gr,1,'c');}};
 return g;}});

/* =================== HOLD'EM HEADS-UP =================== */
const pv=c=>c.r===0?14:c.r+1;
const HN=['HIGH CARD','PAIR','TWO PAIR','THREE OF A KIND','STRAIGHT','FLUSH','FULL HOUSE','FOUR OF A KIND','STRAIGHT FLUSH'];
const stHigh=has=>{for(let v=14;v>=5;v--){let ok=true;for(let k=0;k<5;k++){const q=v-k;if(!(q===1?has[14]:has[q])){ok=false;break;}}if(ok)return v;}return 0;};
const eval7=cs=>{const cnt=Array(15).fill(0),bs=[[],[],[],[]];for(const c of cs){const v=pv(c);cnt[v]++;bs[c.s].push(v);}
 const sc=(cat,ks)=>{let s=cat;for(let i=0;i<5;i++)s=s*15+(ks[i]||0);return s;};
 let fs=-1;for(let s=0;s<4;s++)if(bs[s].length>=5)fs=s;
 if(fs>=0){const has=Array(15).fill(0);bs[fs].forEach(v=>has[v]=1);const h=stHigh(has);if(h)return sc(8,[h]);}
 const q=[],t=[],p=[],sing=[];for(let v=14;v>=2;v--){if(cnt[v]===4)q.push(v);else if(cnt[v]===3)t.push(v);else if(cnt[v]===2)p.push(v);else if(cnt[v]===1)sing.push(v);}
 const kick=(ex,n)=>{const o=[];for(let v=14;v>=2&&o.length<n;v--)if(cnt[v]&&!ex.includes(v))o.push(v);return o;};
 if(q.length)return sc(7,[q[0],...kick([q[0]],1)]);
 if(t.length&&(t.length>1||p.length))return sc(6,[t[0],t.length>1?Math.max(t[1],p[0]||0):p[0]]);
 if(fs>=0)return sc(5,bs[fs].sort((a,b)=>b-a).slice(0,5));
 const has=cnt.map(x=>x>0?1:0),sh=stHigh(has);if(sh)return sc(4,[sh]);
 if(t.length)return sc(3,[t[0],...kick([t[0]],2)]);
 if(p.length>1)return sc(2,[p[0],p[1],...kick([p[0],p[1]],1)]);
 if(p.length)return sc(1,[p[0],...kick([p[0]],3)]);
 return sc(0,kick([],5));};
const catOf=s=>Math.floor(s/759375);
A.add({id:'holdem',name:"HOLD'EM HEADS-UP",cat:'CARDS',time:480,how:'LEFT/RIGHT PICK FOLD, CALL, RAISE OR ALL-IN. UP/DOWN SIZES THE RAISE. A ACTS.',make(){
 const g={over:null,score:1000},ck=endClock(),BL=[20,30,40,60,80,100,150,200,300,400];
 let st=[1000,1000],bet=[0,0],pot=0,board=[],hole=[[],[]],btn=0,street=0,toAct=0,acted=[0,0],minR=20,bb=20,hn=0,ph='bet',wait=40,sel=1,raiseTo=40,show=false,res=null,eq=null,log=['',''],best5=[[],[]],fresh=true;
 const post=(p,a)=>{a=Math.min(a,st[p]);st[p]-=a;bet[p]+=a;};
 const maxB=()=>Math.max(bet[0],bet[1]),toCall=p=>Math.min(maxB()-bet[p],st[p]),canRaise=p=>st[p]>toCall(p)&&st[1-p]>0;
 const minTo=p=>Math.min(maxB()+minR,bet[p]+st[p]),maxTo=p=>bet[p]+st[p];
 const newHand=()=>{bb=BL[Math.min(BL.length-1,(hn/6)|0)];hn++;btn=1-btn;const d=deck52();hole=[[d.pop(),d.pop()],[d.pop(),d.pop()]];board=[];g.deck=d;pot=0;bet=[0,0];street=0;show=false;res=null;eq=null;log=['',''];best5=[[],[]];
  post(btn,bb/2);post(1-btn,bb);toAct=btn;acted=[0,0];minR=bb;ph='bet';wait=30;fresh=true;S('blip');if(streetDone())nextStreet();};
 const streetDone=()=>{const m=maxB();for(let p=0;p<2;p++)if(st[p]>0&&bet[p]<m)return false;if(st[0]>0&&st[1]>0)return!!(acted[0]&&acted[1]);return true;};
 const award=(w)=>{const tot=pot+bet[0]+bet[1];pot=0;bet=[0,0];if(w<0){const h=tot>>1;st[0]+=h;st[1]+=tot-h;}else st[w]+=tot;g.score=st[0];};
 const nextStreet=()=>{const m=Math.min(bet[0],bet[1]);for(let p=0;p<2;p++)if(bet[p]>m){st[p]+=bet[p]-m;bet[p]=m;}pot+=bet[0]+bet[1];bet=[0,0];acted=[0,0];minR=bb;eq=null;
  if(street>=3){showdown();return;}street++;const d=g.deck;if(street===1)board.push(d.pop(),d.pop(),d.pop());else board.push(d.pop());S('hit');
  if(st[0]===0||st[1]===0){ph='runout';wait=55;return;}toAct=1-btn;ph='bet';wait=34;fresh=true;};
 const bestOf=cs=>{let b=-1,bc=null;for(let a=0;a<7;a++)for(let c=a+1;c<7;c++){const five=cs.filter((_,i)=>i!==a&&i!==c),s=eval7(five);if(s>b){b=s;bc=five;}}return bc;};
 const showdown=()=>{while(board.length<5)board.push(g.deck.pop());const s0=eval7([...hole[0],...board]),s1=eval7([...hole[1],...board]);const w=s0>s1?0:s1>s0?1:-1;show=true;best5=[bestOf([...hole[0],...board]),bestOf([...hole[1],...board])];
  res={w,t:w<0?'SPLIT POT - '+HN[catOf(s0)]:(w===0?'YOU WIN WITH ':'CPU WINS WITH ')+HN[catOf(w===0?s0:s1)],n0:HN[catOf(s0)],n1:HN[catOf(s1)]};award(w);S(w===0?'win':w===1?'lose':'blip');if(w===0)A.burst(160,128,K.y,30,3);ph='result';wait=200;};
 const act=(p,k,to)=>{if(k==='f'){log[p]='FOLD';res={w:1-p,t:(p===0?'YOU FOLD':'CPU FOLDS')+' - '+(p===0?'CPU':'YOU')+' TAKE'+(p===0?'S':'')+' THE POT'};award(1-p);S(p===0?'lose':'score');ph='result';wait=110;return;}
  if(k==='c'){const a=toCall(p);log[p]=a?(a>=st[p]?'CALL ALL IN':'CALL '+a):'CHECK';post(p,a);S('blip');}
  else{to=cl(to,minTo(p),maxTo(p));const inc=to-maxB();if(inc>=minR)minR=inc;log[p]=(to===maxTo(p)?'ALL IN ':(maxB()>0?'RAISE TO ':'BET '))+to;post(p,to-bet[p]);acted=[0,0];S('coin');}
  acted[p]=1;log[1-p]=log[1-p]&&acted[1-p]?log[1-p]:'';if(streetDone())nextStreet();else{toAct=1-p;wait=p===1?10:28;fresh=true;}};
 const equity=n=>{const known=[...hole[1],...board],rest=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)if(!known.some(c=>c.s===s&&c.r===r))rest.push({s,r});const need=2+5-board.length;let w=0;
  for(let k=0;k<n;k++){for(let j=0;j<need;j++){const q=j+ri(rest.length-j),t=rest[j];rest[j]=rest[q];rest[q]=t;}const bd=board.concat(rest.slice(2,need)),a=eval7([...hole[1],...bd]),b=eval7([rest[0],rest[1],...bd]);w+=a>b?1:a===b?.5:0;}return w/n;};
 const cpuAct=()=>{if(eq===null)eq=equity(260);const e=eq,c=toCall(1),potT=pot+bet[0]+bet[1],odds=c/(potT+c),r=rnd(1),cr=canRaise(1);
  const sizeTo=f=>maxB()+Math.max(minR,Math.round(potT*f/10)*10);
  if(c===0){if(cr&&(e>.72||(e>.58&&r<.65)||(r<.13&&street>0)))act(1,'r',sizeTo(e>.8?.9:.6));else act(1,'c');return;}
  if(cr&&e>.74&&r<.8)act(1,'r',sizeTo(e>.85?1.2:.8));
  else if(e>odds+.05+(c>st[1]*.5?.12:0)||(street===0&&c<=bb/2&&e>.36))act(1,'c');
  else if(r<.04&&c<potT*.4)act(1,'c');else act(1,'f');};
 const finish=()=>{g.score=st[0];g.over=st[0]>st[1]?'TIME UP - CHIP LEAD, YOU WIN!':st[0]===st[1]?'TIME UP - EVEN STACKS':'TIME UP - CPU HOLDS THE CHIP LEAD';};
 const BTN=[[8,'FOLD'],[86,'CALL'],[164,'RAISE'],[242,'ALL IN']];
 const enabled=k=>k===0?toCall(0)>0:k===1?true:canRaise(0);
 newHand();
 g.update=()=>{if(ck()){finish();return;}if(wait>0){wait--;if(ph==='result'&&wait<170&&A.hit(0).a)wait=0;return;}
  if(ph==='result'){if(st[0]<=0){g.score=0;g.over='BUSTED AFTER '+hn+' HANDS';return;}if(st[1]<=0){g.score=st[0];g.over='CPU BUSTED - YOU WIN!';return;}newHand();return;}
  if(ph==='runout'){if(street>=3)showdown();else{street++;const d=g.deck;if(street===1)board.push(d.pop(),d.pop(),d.pop());else board.push(d.pop());S('hit');wait=55;}return;}
  if(toAct===1){cpuAct();return;}
  if(fresh){fresh=false;sel=1;raiseTo=minTo(0);}
  const h=A.hit(0);let hov=-1;BTN.forEach((b,k)=>{if(mIn(b[0],204,70,22))hov=k;});if(hov>=0&&mAct()&&enabled(hov))sel=hov;
  if(h.l||h.r){let k=sel;do{k=(k+(h.r?1:3))%4;}while(!enabled(k));sel=k;S('blip');}
  const step=Math.max(10,bb);if(h.u&&canRaise(0)){raiseTo=Math.min(maxTo(0),raiseTo+step);if(sel<2)sel=2;S('blip');}if(h.d&&canRaise(0)){raiseTo=Math.max(minTo(0),raiseTo-step);if(sel<2)sel=2;S('blip');}
  if(!enabled(sel))sel=1;
  if(h.a&&!(clickOff()&&hov<0)){if(sel===0)act(0,'f');else if(sel===1)act(0,'c');else if(sel===2)act(0,'r',raiseTo);else act(0,'r',maxTo(0));}};
 g.draw=()=>{A.cls('#2a1a14');for(let i=0;i<8;i++)R(0,i*30,W,1,'#33211a');
  ell(160,114,158,98,'#5a3418');ell(160,112,154,94,lg(0,20,0,210,['#6e4020','#3e2210']));ell(160,112,144,84,rg(160,100,10,150,['#2a9a58','#1a7a42','#0e4e2a']));ells(160,112,132,74,'rgba(255,255,255,.12)',1);
  T('CPU',30,8,K.p,2);T(''+st[1],30,26,K.y,1);chip(20,28,'#d03050',Math.min(5,1+st[1]/400|0));T('YOU',30,152,K.c,2);T(''+st[0],30,170,K.y,1);chip(20,172,'#3070d0',Math.min(5,1+st[0]/400|0));
  T('BLINDS '+bb/2+'/'+bb,316,4,K.w,1,'r');T('HAND '+hn,316,14,K.gr,1,'r');
  // dealer button
  const dbx=btn===0?112:112,dby=btn===0?132:30;C(dbx,dby,6,'#f4f4f4');T('D',dbx,dby-2,'#222',1,'c');
  // cpu cards
  hole[1].forEach((c,k)=>card(134+k*28,10,c,{back:!show,bc:'#2a4ab0',hl:show&&res&&res.w===1&&best5[1]&&best5[1].includes(c)}));
  if(log[1]&&!show)T(log[1],160,48,K.p,1,'c');
  // board
  for(let k=0;k<5;k++){const x=91+k*28;if(board[k])card(x,62,board[k],{hl:show&&res&&res.w>=0&&best5[res.w]&&best5[res.w].includes(board[k])});else rrs(x,62,24,34,3,'rgba(255,255,255,.18)',1);}
  // pot & bets
  const potT=pot+bet[0]+bet[1];if(potT){chip(256,90,'#e0b030',Math.min(6,1+potT/150|0));T('POT '+potT,256,98,K.y,1,'c');}
  if(bet[1]){chip(206,52,'#d03050',Math.min(4,1+bet[1]/80|0));T(''+bet[1],218,48,K.w,1);}if(bet[0]){chip(206,160,'#3070d0',Math.min(4,1+bet[0]/80|0));T(''+bet[0],218,156,K.w,1);}
  // your cards
  hole[0].forEach((c,k)=>card(124+k*38,112,c,{w:34,h:46,hl:show&&res&&res.w===0&&best5[0]&&best5[0].includes(c)}));if(log[0]&&!show)T(log[0],160,162,K.c,1,'c');
  if(show&&res){T(res.n1,160,48,K.p,1,'c');T(res.n0,160,162,K.c,1,'c');}
  if(res){panelBox(60,170,200,18);T(res.t,160,176,res.w===0?K.y:K.w,1,'c');}
  // buttons
  const my=ph==='bet'&&toAct===0&&!wait;BTN.forEach((b,k)=>{const en=my&&enabled(k),on=en&&sel===k;rrf(b[0],204,70,22,4,on?'#ffcf3f':en?'#2b2257':'#1a1530');rrs(b[0]+.5,204.5,69,21,4,on?'#fff3d6':en?'#8d86b8':'#3a3550',1);
   let t=b[1];if(k===1)t=toCall(0)?(toCall(0)>=st[0]?'CALL ALL':'CALL '+toCall(0)):'CHECK';if(k===2)t=(maxB()>0&&street===0||bet[1]>0?'RAISE ':'BET ')+(canRaise(0)?raiseTo:'');if(k===3)t='ALL IN '+st[0];
   T(t,b[0]+35,212,on?'#1a1238':en?K.w:'#5a5470',1,'c');});
  T(my?'LEFT/RIGHT CHOOSE  UP/DOWN SIZE  A ACT':ph==='bet'&&toAct===1?'CPU IS THINKING...':ph==='runout'?'ALL IN - RUNNING IT OUT':'',160,230,K.gr,1,'c');};
 return g;}});

/* =================== TRIPEAKS =================== */
A.add({id:'tripeaks',name:'TRIPEAKS',cat:'CARDS',time:420,how:'PLAY AN OPEN CARD ONE ABOVE OR BELOW THE PILE (K-A WRAPS). B DRAWS. CHAIN STREAKS.',make(){
 const g={over:null,score:0},ck=endClock(),BOARDS=3;
 let tab,stock,waste,sel=0,streak=0,best=0,boardN=0,cleared=0,ph='play',wait=0,msg='',peaks=[0,0,0];
 const X3=i=>31+i*26,pos=[];
 // index layout: 0-2 row0, 3-8 row1, 9-17 row2, 18-27 row3
 for(let p=0;p<3;p++)pos.push([X3(p*3)+39,18]);for(let i=0;i<6;i++){const p=i>>1,q=i&1;pos.push([X3(p*3+q)+26,34]);}for(let i=0;i<9;i++)pos.push([X3(i)+13,50]);for(let i=0;i<10;i++)pos.push([X3(i),66]);
 const cov=[];for(let p=0;p<3;p++)cov.push([3+2*p,4+2*p]);for(let i=0;i<6;i++){const p=i>>1,q=i&1;cov.push([9+p*3+q,10+p*3+q]);}for(let i=0;i<9;i++)cov.push([18+i,19+i]);for(let i=0;i<10;i++)cov.push([]);
 const peakOf=i=>i<3?i:i<9?(i-3)>>1:i<18?Math.min(2,((i-9)/3)|0):-1;
 const deal=()=>{const d=deck52();tab=[];for(let i=0;i<28;i++)tab.push({c:d.pop(),gone:false});stock=d;waste=[stock.pop()];streak=0;ph='play';sel=null;peaks=[0,0,0];};
 const open=i=>!tab[i].gone&&cov[i].every(j=>tab[j].gone);
 const fits=c=>{const t=waste[waste.length-1],a=c.r,b=t.r;return(a+1)%13===b||(b+1)%13===a;};
 const targets=()=>{const o=[];for(let i=0;i<28;i++)if(open(i))o.push(i);o.sort((a,b)=>pos[a][0]-pos[b][0]||pos[a][1]-pos[b][1]);o.push(-1);return o;};
 const anyMove=()=>{for(let i=0;i<28;i++)if(open(i)&&fits(tab[i].c))return true;return false;};
 const endBoard=win=>{ph='end';wait=110;if(win){cleared++;const b=150+stock.length*15;g.score+=b;msg='BOARD CLEARED! +'+b;A.confetti();S('win');}else{msg='NO MOVES LEFT';S('lose');}};
 const drawS=()=>{if(!stock.length){S('lose');return;}waste.push(stock.pop());streak=0;S('blip');if(!stock.length&&!anyMove())endBoard(false);};
 const playI=i=>{const c=tab[i].c;if(!fits(c)){S('lose');A.shake=3;return;}tab[i].gone=true;waste.push(c);streak++;best=Math.max(best,streak);const pts=10+5*(streak-1);g.score+=pts;S(streak>4?'score':'coin');A.burst(pos[i][0]+12,pos[i][1]+17,K.y,8+streak,2);if(streak>=3)pop('STREAK X'+streak,160,118,streak>=8?K.p:K.c);
  if(i<3&&!peaks[i]){peaks[i]=1;const b=peaks.every(x=>x)?60:30;g.score+=b;pop('PEAK! +'+b,pos[i][0]+12,30,K.y);}
  if(tab.every(t=>t.gone))endBoard(true);else if(!stock.length&&!anyMove())endBoard(false);};
 const finish=()=>{g.over=cleared>=2?'TRIPEAKS - '+cleared+'/'+BOARDS+' BOARDS CLEARED, WIN!':'TRIPEAKS OVER - '+cleared+'/'+BOARDS+' BOARDS';};
 deal();
 g.update=()=>{if(ck()){finish();return;}if(ph==='end'){if(--wait<=0){boardN++;if(boardN>=BOARDS)finish();else deal();}return;}
  const h=A.hit(0),tg=targets();if(sel===null){const p=tg.filter(i=>i>=0&&fits(tab[i].c));sel=p.length?p[0]:-1;}if(!tg.includes(sel))sel=tg[0];
  let hov=null;for(let k=27;k>=0;k--)if(open(k)&&mIn(pos[k][0],pos[k][1],24,34)){hov=k;break;}if(mIn(108,170,30,42))hov=-1;if(hov!==null&&mAct())sel=hov;
  if(h.l||h.r){let k=tg.indexOf(sel);sel=tg[(k+(h.r?1:tg.length-1))%tg.length];S('blip');}
  if(h.u){const p=tg.filter(i=>i>=0&&fits(tab[i].c));if(p.length){sel=p[0];S('blip');}}
  const auto=()=>{const t2=targets(),p=t2.filter(i=>i>=0&&fits(tab[i].c));sel=p.length?p[0]:-1;};
  if(h.a&&!(clickOff()&&hov===null)){if(sel===-1){drawS();auto();}else{const was=tab[sel].gone;playI(sel);if(!was&&tab[sel]&&tab[sel].gone)auto();}}else if(h.b){drawS();auto();}};
 g.draw=()=>{felt('#17604a');const t=waste[waste.length-1];
  for(let i=0;i<28;i++){if(tab[i].gone)continue;const o=open(i),[x,y]=pos[i];if(o)card(x,y,tab[i].c,{hl:sel===i&&ph==='play',dim:false});else card(x,y,null,{back:1,bc:'#1f4fa8'});if(o&&fits(tab[i].c)&&ph==='play'&&sel!==i)rrs(x-.5,y-.5,25,35,3,'rgba(120,255,190,.55)',1);}
  // stock & waste
  const n=stock.length;for(let k=Math.min(n,6)-1;k>=0;k--)card(108-k,170-k,null,{back:1,bc:'#1f4fa8',w:30,h:42,hl:sel===-1&&!k&&ph==='play'});if(!n)rrs(108,170,30,42,3,'rgba(255,255,255,.25)',1);T(n+' LEFT',123,216,'#cfe8dc',1,'c');
  if(waste.length>1)card(166,172,waste[waste.length-2],{w:30,h:42});card(172,170,t,{w:34,h:46});
  T('SCORE '+g.score,4,4,K.y,1);T('BOARD '+Math.min(boardN+1,BOARDS)+'/'+BOARDS,316,4,K.w,1,'r');
  rrf(222,176,90,30,4,'rgba(0,0,0,.25)');T('STREAK',267,182,K.gr,1,'c');T(''+streak,267,192,streak>=5?K.p:K.c,2,'c');T('BEST '+best,4,226,K.gr,1);
  T('A PLAYS  B DRAWS  UP JUMPS TO A MATCH',316,226,'#9fc8b4',1,'r');
  if(ph==='end'){panelBox(70,100,180,40);T(msg,160,108,K.y,1,'c');T(boardN+1<BOARDS?'DEALING NEXT BOARD...':'LAST BOARD DONE',160,124,K.w,1,'c');}};
 return g;}});

/* =================== GIN RUMMY =================== */
const gv=c=>Math.min(10,c.r+1);
const meldsOf=h=>{const out=[];for(let r=0;r<13;r++){const ix=[];h.forEach((c,i)=>{if(c.r===r)ix.push(i);});const mk=a=>a.reduce((m,i)=>m|1<<i,0);if(ix.length>=3){out.push(mk(ix));if(ix.length===4)for(let k=0;k<4;k++)out.push(mk(ix.filter((_,j)=>j!==k)));}}
 for(let s=0;s<4;s++){const by=Array(13).fill(-1);h.forEach((c,i)=>{if(c.s===s)by[c.r]=i;});for(let a=0;a<13;a++){if(by[a]<0)continue;let m=1<<by[a];for(let b=a+1;b<13&&by[b]>=0;b++){m|=1<<by[b];if(b-a>=2)out.push(m);}}}return out;};
const BMC=new Map();const bestMelds=h=>{const key=h.map(c=>c.s*13+c.r).join(',');const hit=BMC.get(key);if(hit)return hit;if(BMC.size>80)BMC.clear();const out=bestMelds0(h);BMC.set(key,out);return out;};
const bestMelds0=h=>{const M=meldsOf(h),memo=new Map();const f=rem=>{if(!rem)return[0,[]];const mm=memo.get(rem);if(mm)return mm;let i=0;while(!((rem>>i)&1))i++;const r=f(rem&~(1<<i));let b=[r[0]+gv(h[i]),r[1]];for(const m of M)if(((m>>i)&1)&&(m&rem)===m){const q=f(rem&~m);if(q[0]<b[0])b=[q[0],[m].concat(q[1])];}memo.set(rem,b);return b;};
 const[dw,ms]=f((1<<h.length)-1);const melds=ms.map(m=>h.filter((_,i)=>(m>>i)&1).sort((a,b)=>a.r-b.r));const used=new Set(melds.flat());return{dw,melds,dead:h.filter(c=>!used.has(c)).sort((a,b)=>a.r-b.r)};};
A.add({id:'ginrummy',name:'GIN RUMMY',cat:'CARDS',time:480,how:'TAKE FROM STOCK OR DISCARD, THEN DISCARD ONE. KNOCK AT 10 DEADWOOD OR LESS. FIRST TO 100.',make(){
 const g={over:null,score:0},ck=endClock(),GOAL=100;
 let stock,disc,hands,turn=0,ph='draw',wait=0,sel=0,pileSel=0,taken=null,newC=null,dealer=1,pts=[0,0],res=null,oppWants=[],hn=0,ask=0;
 const order=h=>{const b=bestMelds(h);return{b,list:b.melds.flat().concat(b.dead)};};
 const deal=()=>{const d=deck52();hands=[[],[]];for(let k=0;k<10;k++){hands[0].push(d.pop());hands[1].push(d.pop());}disc=[d.pop()];stock=d;dealer=1-dealer;turn=1-dealer;ph='draw';wait=30;taken=null;newC=null;res=null;oppWants=[];hn++;sel=0;pileSel=suggestPile();};
 const finish=()=>{g.score=pts[0];g.over=pts[0]>pts[1]?(pts[0]>=GOAL?'YOU WIN THE MATCH ':'TIME UP - YOU WIN ')+pts[0]+'-'+pts[1]:pts[0]===pts[1]?'TIME UP - LEVEL AT '+pts[0]:(pts[1]>=GOAL?'CPU TAKES THE MATCH ':'TIME UP - CPU LEADS ')+pts[1]+'-'+pts[0];};
 const layoff=(melds,dead)=>{const ms=melds.map(m=>m.slice());let rem=dead.slice(),laid=[],ch=true;while(ch){ch=false;for(let k=0;k<rem.length;k++){const c=rem[k];for(const m of ms){const set=m.every(x=>x.r===m[0].r);let ok=false;if(set)ok=m.length<4&&c.r===m[0].r;else if(c.s===m[0].s){const lo=Math.min(...m.map(x=>x.r)),hi=Math.max(...m.map(x=>x.r));ok=c.r===lo-1||c.r===hi+1;}if(ok){m.push(c);m.sort((a,b)=>a.r-b.r);laid.push(c);rem.splice(k,1);ch=true;break;}}if(ch)break;}}return{rem,laid,ms};};
 const knock=p=>{const kb=bestMelds(hands[p]),db=bestMelds(hands[1-p]),gin=kb.dw===0;let ddw=db.dw,laid=[],kms=kb.melds;if(!gin){const lo=layoff(kb.melds,db.dead);ddw=lo.rem.reduce((a,c)=>a+gv(c),0);laid=lo.laid;kms=lo.ms;}
  let w,amt,t;if(gin){w=p;amt=25+ddw;t='GIN!';}else if(ddw<=kb.dw){w=1-p;amt=25+kb.dw-ddw;t='UNDERCUT!';}else{w=p;amt=ddw-kb.dw;t='KNOCK';}
  pts[w]+=amt;g.score=pts[0];res={p,w,amt,t,kb,db,kms,laid,ddw};ph='show';wait=60;S(w===0?'win':'lose');if(w===0)A.burst(160,190,K.y,30,3);};
 const suggestPile=()=>{const h=hands[0],t=disc[disc.length-1];if(!t)return 0;const cur=bestMelds(h).dw,hh=h.concat([t]);let bd=1e9;for(let i=0;i<10;i++){const r=hh.slice();r.splice(i,1);bd=Math.min(bd,bestMelds(r).dw);}return bd<cur&&bestMelds(hh).melds.some(m=>m.includes(t))?1:0;};
 const suggestDiscard=o=>{let b=0,bs=1e9;o.forEach((c,i)=>{if(c===taken)return;const r=hands[0].filter(x=>x!==c),s=bestMelds(r).dw-gv(c)*.05;if(s<bs){bs=s;b=i;}});return b;};
 const afterDiscard=p=>{taken=null;newC=null;if(stock.length<=2){res={t:'DEAD HAND - STOCK RAN OUT',w:-1};ph='show';wait=60;return;}turn=1-p;ph='draw';wait=p===0?22:30;if(p===1)pileSel=suggestPile();};
 const cpuTurn=()=>{const h=hands[1];if(ph==='draw'){const cur=bestMelds(h).dw,t=disc[disc.length-1],hh=h.concat([t]);let bd=1e9;for(let i=0;i<10;i++){const r=hh.slice();r.splice(i,1);bd=Math.min(bd,bestMelds(r).dw);}
   if(bd<cur&&bestMelds(hh).melds.some(m=>m.includes(t))){h.push(disc.pop());taken=t;pop('CPU TAKES '+RK[t.r],160,58,K.p);}else{h.push(stock.pop());taken=null;}ph='discard';wait=34;S('blip');return;}
  let bi=0,bs=1e9,bdw=0;for(let i=0;i<h.length;i++){const c=h[i];if(c===taken)continue;const r=h.slice();r.splice(i,1);const dw=bestMelds(r).dw;let danger=0;for(const o of oppWants){if(o.r===c.r)danger+=3;if(o.s===c.s&&Math.abs(o.r-c.r)<=2)danger+=2;}const s=dw*1.0+danger-gv(c)*.15;if(s<bs){bs=s;bi=i;bdw=dw;}}
  const c=h.splice(bi,1)[0];disc.push(c);S('hit');if(bdw<=10){pop(bdw?'CPU KNOCKS':'CPU GIN!',160,58,K.p);knock(1);return;}afterDiscard(1);};
 deal();
 g.update=()=>{if(ck()){finish();return;}if(wait>0){wait--;return;}
  if(ph==='show'){if(A.hit(0).a||++ask>360){ask=0;if(pts[0]>=GOAL||pts[1]>=GOAL)finish();else deal();}return;}ask=0;
  if(turn===1){cpuTurn();return;}
  const h=A.hit(0),hd=hands[0];
  if(ph==='draw'){let hov=-1;if(mIn(112,84,30,42))hov=0;if(mIn(166,84,30,42))hov=1;if(hov>=0&&mAct())pileSel=hov;if(h.l||h.r){pileSel^=1;S('blip');}
   const take=k=>{if(k===1&&disc.length){taken=disc.pop();oppWants.push(taken);if(oppWants.length>6)oppWants.shift();hd.push(taken);newC=taken;}else{newC=stock.pop();hd.push(newC);taken=null;}S('blip');ph='discard';const o=order(hd).list;sel=suggestDiscard(o);};
   if(h.u&&disc.length)take(1);else if(h.d)take(0);else if(h.a&&!(clickOff()&&hov<0))take(pileSel);return;}
  if(ph==='knock?'){if(h.a){knock(0);}else if(h.b){afterDiscard(0);}return;}
  const o=order(hd).list,lay=handLay(o);sel=cl(sel,0,o.length-1);let hov=-1;for(let k=o.length-1;k>=0;k--)if(mIn(lay[k],190,26,44)){hov=k;break;}if(hov>=0&&mAct())sel=hov;
  if(h.l){sel=(sel+o.length-1)%o.length;S('blip');}if(h.r){sel=(sel+1)%o.length;S('blip');}
  if(h.a&&!(clickOff()&&hov<0)){const c=o[sel];if(c===taken){S('lose');pop("CAN'T DISCARD IT",160,170,K.r);return;}hd.splice(hd.indexOf(c),1);disc.push(c);S('hit');newC=null;const dw=bestMelds(hd).dw;if(dw<=10&&stock.length>2){ph='knock?';}else afterDiscard(0);}};
 const handLay=o=>{const b=bestMelds(hands[0]);const xs=[];let gaps=0,x=0;const grp=c=>{for(let k=0;k<b.melds.length;k++)if(b.melds[k].includes(c))return k;return -1;};let pg=null;o.forEach((c,k)=>{const gp=grp(c);if(k&&gp!==pg)gaps++;pg=gp;});const sp=Math.min(26,(300-24-gaps*6)/Math.max(1,o.length-1));const tw=sp*(o.length-1)+24+gaps*6;x=160-tw/2;pg=null;o.forEach((c,k)=>{const gp=grp(c);if(k){x+=sp;if(gp!==pg)x+=6;}pg=gp;xs.push(x);});return xs;};
 g.draw=()=>{felt('#245a3c',0);const hd=hands[0];
  // cpu hand
  const showAll=ph==='show'&&res&&res.w>=0;if(!showAll){const f=fan(hands[1].length,160,200,24,14);hands[1].forEach((c,k)=>card(f.x0+k*f.s,6,null,{back:1,bc:'#8a2a2a'}));}
  T('YOU '+pts[0]+'   CPU '+pts[1]+'   GAME TO '+GOAL,4,46,K.w,1);T('HAND '+hn,316,46,K.gr,1,'r');
  // piles
  const n=stock.length;for(let k=Math.min(n,5)-1;k>=0;k--)card(112-k*.7,84-k*.7,null,{back:1,bc:'#2a4ab0',w:30,h:42,hl:!k&&turn===0&&ph==='draw'&&pileSel===0});T('STOCK '+n,127,130,'#cfe8dc',1,'c');
  if(disc.length>1)card(168,86,disc[disc.length-2],{w:30,h:42});if(disc.length)card(166,84,disc[disc.length-1],{w:30,h:42,hl:turn===0&&ph==='draw'&&pileSel===1});else rrs(166,84,30,42,3,'rgba(255,255,255,.25)',1);T('DISCARD',181,130,'#cfe8dc',1,'c');
  // your hand
  const ob=order(hd),o=ob.list,lay=handLay(o),dwN=ob.b.dw;
  ob.b.melds.forEach((m,mi)=>{const xs=m.map(c=>lay[o.indexOf(c)]);R(Math.min(...xs),234,Math.max(...xs)-Math.min(...xs)+24,3,['#3dff8b','#4dabff','#ff9838','#ff4f9a'][mi%4]);});
  o.forEach((c,k)=>{const s=k===sel&&turn===0&&ph==='discard';card(lay[k],196,c,{lift:s?9:c===newC?4:0,hl:s,hlc:c===taken?K.r:K.y});});
  T('DEADWOOD '+dwN,4,182,dwN<=10?K.g:K.w,1);
  let m='';if(turn===0&&!wait){if(ph==='draw')m='UP TAKES DISCARD  DOWN DRAWS STOCK';else if(ph==='discard')m='PICK A CARD TO DISCARD  (A)';}else if(turn===1)m='CPU IS PLAYING...';T(m,316,182,K.y,1,'r');
  if(ph==='knock?'){panelBox(84,138,152,34);T(bestMelds(hd).dw===0?'GIN! A TO LAY DOWN':'KNOCK WITH '+bestMelds(hd).dw+'?',160,144,K.y,1,'c');T('A KNOCK   B PLAY ON',160,158,K.w,1,'c');}
  if(ph==='show'&&res){if(res.w<0){panelBox(70,140,180,30);T(res.t,160,146,K.y,1,'c');T('A TO REDEAL',160,158,K.gr,1,'c');return;}
   // show cpu hand as melds
   const cb=res.p===1?res.kms:res.db.melds,cd=res.p===1?res.kb.dead:res.db.dead;let x=8;const row=(ms,dead,y,laid)=>{ms.forEach(m=>{m.forEach(c=>{card(x,y,c,{w:18,h:26,hl:laid.includes(c),hlc:K.c});x+=12;});x+=10;});dead.forEach(c=>{const l=laid.includes(c);card(x,y,c,{w:18,h:26,dim:!l,hl:l,hlc:K.c});x+=12;});};
   row(cb,cd,8,res.laid);panelBox(60,138,200,40);T((res.p===0?'YOU ':'CPU ')+res.t,160,144,K.y,1,'c');T((res.w===0?'YOU SCORE ':'CPU SCORES ')+res.amt+'  (DEADWOOD '+res.kb.dw+' V '+res.ddw+')',160,156,K.w,1,'c');T('A TO CONTINUE',160,168,K.gr,1,'c');}};
 return g;}});

/* =================== TRIVIA NIGHT =================== */
const TQ={
SCIENCE:['WHAT IS THE CHEMICAL SYMBOL FOR GOLD?|AU|AG|GD|GO','WHICH PLANET IS KNOWN AS THE RED PLANET?|MARS|VENUS|JUPITER|MERCURY','WHICH GAS DO PLANTS TAKE IN FROM THE AIR FOR PHOTOSYNTHESIS?|CARBON DIOXIDE|OXYGEN|NITROGEN|HELIUM','HOW MANY BONES ARE IN A TYPICAL ADULT HUMAN BODY?|206|186|226|306','WHAT IS THE HARDEST NATURAL MATERIAL?|DIAMOND|QUARTZ|IRON|GRANITE','AT SEA LEVEL, WATER BOILS AT HOW MANY DEGREES CELSIUS?|100|90|120|212','WHAT IS THE LARGEST PLANET IN OUR SOLAR SYSTEM?|JUPITER|SATURN|NEPTUNE|EARTH','WHICH PART OF A CELL HOLDS MOST OF ITS DNA?|NUCLEUS|MEMBRANE|RIBOSOME|CYTOPLASM','WHAT FORCE KEEPS THE PLANETS IN ORBIT AROUND THE SUN?|GRAVITY|MAGNETISM|FRICTION|STATIC','WHICH ORGAN PUMPS BLOOD AROUND THE BODY?|HEART|LUNGS|LIVER|KIDNEYS','WHAT IS THE CLOSEST STAR TO EARTH?|THE SUN|SIRIUS|POLARIS|BETELGEUSE','WHICH PARTICLE IN AN ATOM HAS A NEGATIVE CHARGE?|ELECTRON|PROTON|NEUTRON|NUCLEUS','HOW MANY PLANETS ARE IN OUR SOLAR SYSTEM?|8|7|9|10','WHICH METAL IS LIQUID AT ROOM TEMPERATURE?|MERCURY|LEAD|TIN|ALUMINIUM','ABOUT HOW FAST DOES LIGHT TRAVEL, IN KM PER SECOND?|300,000|30,000|3,000|3 MILLION','WHAT IS THE MOST COMMON GAS IN EARTH\'S ATMOSPHERE?|NITROGEN|OXYGEN|ARGON|CARBON DIOXIDE','WHICH PLANET IS FAMOUS FOR ITS BRIGHT, WIDE RINGS?|SATURN|MARS|VENUS|MERCURY','WHAT IS THE PH OF PURE WATER AT 25 C?|7|1|10|14','WHICH VITAMIN DOES YOUR SKIN MAKE IN SUNLIGHT?|VITAMIN D|VITAMIN C|VITAMIN A|VITAMIN K','WHAT IS THE LARGEST ORGAN OF THE HUMAN BODY?|SKIN|LIVER|BRAIN|LUNGS','WHO DEVELOPED THE THEORY OF GENERAL RELATIVITY?|ALBERT EINSTEIN|ISAAC NEWTON|NIELS BOHR|MARIE CURIE','BEES MAKE HONEY FROM WHICH SUGARY FLOWER LIQUID?|NECTAR|SAP|DEW|RESIN','WHAT IS FROZEN CARBON DIOXIDE COMMONLY CALLED?|DRY ICE|FROST|SLEET|HAIL','HOW MANY SIDES DOES A HEXAGON HAVE?|6|5|7|8','WHAT IS THE SQUARE ROOT OF 144?|12|14|11|16','WHICH BLOOD CELLS CARRY OXYGEN AROUND THE BODY?|RED BLOOD CELLS|WHITE BLOOD CELLS|PLATELETS|NERVE CELLS','WHAT IS THE CHEMICAL SYMBOL FOR SODIUM?|NA|SO|SD|NO','WHICH PLANET IS CLOSEST TO THE SUN?|MERCURY|VENUS|MARS|EARTH'],
GEOGRAPHY:['WHAT IS THE CAPITAL OF FRANCE?|PARIS|LYON|MARSEILLE|NICE','WHAT IS THE LARGEST OCEAN ON EARTH?|PACIFIC|ATLANTIC|INDIAN|ARCTIC','THE SAHARA DESERT IS ON WHICH CONTINENT?|AFRICA|ASIA|AUSTRALIA|SOUTH AMERICA','WHAT IS THE CAPITAL OF JAPAN?|TOKYO|OSAKA|KYOTO|NAGOYA','WHICH IS THE HIGHEST MOUNTAIN ABOVE SEA LEVEL?|EVEREST|K2|KILIMANJARO|DENALI','WHICH COUNTRY HAS THE LARGEST LAND AREA?|RUSSIA|CANADA|CHINA|BRAZIL','WHAT IS THE CAPITAL OF AUSTRALIA?|CANBERRA|SYDNEY|MELBOURNE|PERTH','MOST OF THE AMAZON RIVER FLOWS THROUGH WHICH COUNTRY?|BRAZIL|PERU|COLOMBIA|VENEZUELA','WHICH IS THE SMALLEST CONTINENT BY LAND AREA?|AUSTRALIA|EUROPE|ANTARCTICA|SOUTH AMERICA','WHAT IS THE CAPITAL OF CANADA?|OTTAWA|TORONTO|VANCOUVER|MONTREAL','WHICH COUNTRY IS SHAPED LIKE A BOOT?|ITALY|GREECE|SPAIN|PORTUGAL','WHAT IS THE CAPITAL OF EGYPT?|CAIRO|ALEXANDRIA|LUXOR|GIZA','IN THE USUAL SEVEN-CONTINENT MODEL, WHICH IS NOT A CONTINENT?|GREENLAND|ANTARCTICA|EUROPE|ASIA','WHICH RIVER IS THE LONGEST IN AFRICA?|NILE|CONGO|NIGER|ZAMBEZI','WHICH US STATE IS MADE UP ENTIRELY OF ISLANDS?|HAWAII|ALASKA|FLORIDA|MAINE','WHAT IS THE CAPITAL OF SPAIN?|MADRID|BARCELONA|SEVILLE|VALENCIA','MOUNT FUJI IS IN WHICH COUNTRY?|JAPAN|CHINA|SOUTH KOREA|NEPAL','WHAT IS THE LARGEST HOT DESERT IN THE WORLD?|SAHARA|GOBI|KALAHARI|MOJAVE','WHICH OCEAN LIES BETWEEN AFRICA AND AUSTRALIA?|INDIAN|PACIFIC|ATLANTIC|ARCTIC','WHAT IS THE CAPITAL OF ITALY?|ROME|MILAN|VENICE|NAPLES','THE ANCIENT CITY OF MACHU PICCHU IS IN WHICH COUNTRY?|PERU|MEXICO|CHILE|BOLIVIA','WHAT IS THE CAPITAL OF GERMANY?|BERLIN|MUNICH|HAMBURG|FRANKFURT','THE GREAT BARRIER REEF LIES OFF THE COAST OF WHICH COUNTRY?|AUSTRALIA|INDONESIA|FIJI|NEW ZEALAND','WHICH RIVER FLOWS THROUGH LONDON?|THAMES|SEINE|DANUBE|RHINE','WHAT IS THE CAPITAL OF CHINA?|BEIJING|SHANGHAI|HONG KONG|GUANGZHOU','WHAT IS THE CAPITAL OF ICELAND?|REYKJAVIK|OSLO|HELSINKI|DUBLIN','WHAT IS THE CAPITAL OF KENYA?|NAIROBI|MOMBASA|KAMPALA|ADDIS ABABA','THE ANDES MOUNTAINS ARE ON WHICH CONTINENT?|SOUTH AMERICA|AFRICA|ASIA|EUROPE'],
HISTORY:['WHO WAS THE FIRST PRESIDENT OF THE UNITED STATES?|GEORGE WASHINGTON|JOHN ADAMS|THOMAS JEFFERSON|ABRAHAM LINCOLN','IN WHAT YEAR DID WORLD WAR II END?|1945|1939|1918|1950','WHICH ANCIENT CIVILISATION BUILT THE PYRAMIDS OF GIZA?|THE EGYPTIANS|THE ROMANS|THE GREEKS|THE MAYA','WHO WAS THE FIRST PERSON TO WALK ON THE MOON?|NEIL ARMSTRONG|BUZZ ALDRIN|YURI GAGARIN|JOHN GLENN','IN WHAT YEAR DID THE TITANIC SINK?|1912|1905|1920|1898','IN WHAT YEAR DID THE BERLIN WALL FALL?|1989|1991|1975|1961','JULIUS CAESAR WAS A LEADER OF WHICH ANCIENT STATE?|ROME|GREECE|PERSIA|EGYPT','WHO WAS THE FIRST HUMAN TO TRAVEL INTO SPACE?|YURI GAGARIN|NEIL ARMSTRONG|ALAN SHEPARD|JOHN GLENN','IN WHAT YEAR DID COLUMBUS FIRST REACH THE AMERICAS?|1492|1512|1453|1607','WHICH SHIP CARRIED THE PILGRIMS TO AMERICA IN 1620?|MAYFLOWER|SANTA MARIA|BEAGLE|ENDEAVOUR','WHO WROTE THE FIRST DRAFT OF THE US DECLARATION OF INDEPENDENCE?|THOMAS JEFFERSON|BENJAMIN FRANKLIN|JOHN ADAMS|JAMES MADISON','WHAT WAS THE FIRST ARTIFICIAL SATELLITE, LAUNCHED IN 1957?|SPUTNIK 1|EXPLORER 1|VOSTOK 1|APOLLO 1','WHO WAS BRITAIN\'S PRIME MINISTER FOR MOST OF WORLD WAR II?|WINSTON CHURCHILL|NEVILLE CHAMBERLAIN|CLEMENT ATTLEE|DAVID LLOYD GEORGE','THE ANCIENT OLYMPIC GAMES BEGAN IN WHICH COUNTRY?|GREECE|ITALY|EGYPT|TURKEY','WHICH FRENCH EMPEROR WAS DEFEATED AT WATERLOO IN 1815?|NAPOLEON|LOUIS XIV|CHARLEMAGNE|LOUIS XVI','WHO WAS GRANTED THE FIRST US PATENT FOR THE TELEPHONE IN 1876?|ALEXANDER GRAHAM BELL|THOMAS EDISON|NIKOLA TESLA|SAMUEL MORSE','IN WHAT YEAR DID WORLD WAR I BEGIN?|1914|1912|1918|1939','WHICH QUEEN RULED BRITAIN FROM 1837 TO 1901?|VICTORIA|ELIZABETH I|ANNE|MARY I','WHO MADE THE FIRST POWERED AIRPLANE FLIGHTS IN 1903?|THE WRIGHT BROTHERS|CHARLES LINDBERGH|AMELIA EARHART|LOUIS BLERIOT','WHO GAVE THE FAMOUS I HAVE A DREAM SPEECH IN 1963?|MARTIN LUTHER KING JR.|MALCOLM X|JOHN F. KENNEDY|FREDERICK DOUGLASS','WHAT WAS THE CAPITAL CITY OF THE AZTEC EMPIRE?|TENOCHTITLAN|CUZCO|CHICHEN ITZA|TIKAL','WHOSE EXPEDITION MADE THE FIRST VOYAGE AROUND THE WORLD?|MAGELLAN\'S|COLUMBUS\'S|DA GAMA\'S|CABOT\'S','THE MAGNA CARTA WAS AGREED IN 1215 IN WHICH COUNTRY?|ENGLAND|FRANCE|SPAIN|SCOTLAND','WHO WAS THE 16TH PRESIDENT OF THE UNITED STATES?|ABRAHAM LINCOLN|ULYSSES S. GRANT|ANDREW JOHNSON|JAMES BUCHANAN','THE RENAISSANCE BEGAN IN WHICH COUNTRY?|ITALY|FRANCE|ENGLAND|GERMANY','WHICH ANCIENT WONDER STOOD AT THE HARBOUR OF ALEXANDRIA?|THE LIGHTHOUSE|THE COLOSSUS|THE HANGING GARDENS|THE MAUSOLEUM','WHICH EMPIRE BUILT MACHU PICCHU?|THE INCA|THE AZTEC|THE MAYA|THE OLMEC','WHO WAS THE FIRST WOMAN TO WIN A NOBEL PRIZE?|MARIE CURIE|ADA LOVELACE|ROSALIND FRANKLIN|FLORENCE NIGHTINGALE'],
NATURE:['WHAT IS THE LARGEST ANIMAL EVER KNOWN TO HAVE LIVED?|BLUE WHALE|AFRICAN ELEPHANT|SPERM WHALE|WHALE SHARK','WHAT IS THE FASTEST LAND ANIMAL?|CHEETAH|LION|PRONGHORN|GREYHOUND','HOW MANY LEGS DOES A SPIDER HAVE?|8|6|10|12','WHAT IS A BABY KANGAROO CALLED?|JOEY|CUB|KID|PUP','WHAT IS THE LARGEST LIVING BIRD?|OSTRICH|EMU|ALBATROSS|CONDOR','WHAT IS A GROUP OF LIONS CALLED?|PRIDE|PACK|HERD|FLOCK','WHICH ANIMAL IS KNOWN AS THE SHIP OF THE DESERT?|CAMEL|HORSE|GOAT|DONKEY','WHAT IS THE ONLY MAMMAL CAPABLE OF TRUE FLIGHT?|BAT|FLYING SQUIRREL|SUGAR GLIDER|COLUGO','HOW MANY HEARTS DOES AN OCTOPUS HAVE?|3|1|2|8','WHAT DO GIANT PANDAS MAINLY EAT?|BAMBOO|FISH|FRUIT|INSECTS','A CATERPILLAR TURNS INTO WHICH INSECT?|BUTTERFLY OR MOTH|BEETLE|DRAGONFLY|GRASSHOPPER','WHAT IS THE TALLEST LIVING ANIMAL?|GIRAFFE|ELEPHANT|OSTRICH|MOOSE','FROGS BELONG TO WHICH GROUP OF ANIMALS?|AMPHIBIANS|REPTILES|MAMMALS|FISH','WHAT IS A GROUP OF WOLVES CALLED?|PACK|PRIDE|SCHOOL|GAGGLE','WHAT IS THE LARGEST KIND OF FISH?|WHALE SHARK|GREAT WHITE SHARK|BLUE MARLIN|TUNA','HOW MANY LEGS DOES AN INSECT HAVE?|6|8|4|10','WHAT IS THE CHANGE FROM TADPOLE TO FROG CALLED?|METAMORPHOSIS|PHOTOSYNTHESIS|MIGRATION|HIBERNATION','WHAT IS IT CALLED WHEN AN ANIMAL SLEEPS THROUGH WINTER?|HIBERNATION|MIGRATION|POLLINATION|CAMOUFLAGE','WHICH TREE PRODUCES ACORNS?|OAK|MAPLE|PINE|BIRCH','WHAT COLOUR IS CHLOROPHYLL?|GREEN|RED|YELLOW|BLUE','WHICH OF THESE MAMMALS LAYS EGGS?|PLATYPUS|KOALA|BEAVER|OTTER','WILD PENGUINS LIVE MAINLY IN WHICH HEMISPHERE?|SOUTHERN|NORTHERN|EASTERN|WESTERN','WHAT IS A BABY GOAT CALLED?|KID|CALF|LAMB|FOAL','WHAT IS THE LARGEST LIVING REPTILE?|SALTWATER CROCODILE|KOMODO DRAGON|GREEN ANACONDA|LEATHERBACK TURTLE','WHAT DO KOALAS MAINLY EAT?|EUCALYPTUS LEAVES|BAMBOO|GRASS|BERRIES','WHICH BIRD CAN FLY BACKWARDS?|HUMMINGBIRD|SPARROW|EAGLE|PARROT','A SPIDER\'S WEB IS MADE FROM WHAT?|SILK|WAX|HAIR|SAP','WHICH ANIMAL HAS THE LONGEST NOSE-LIKE TRUNK?|ELEPHANT|TAPIR|ANTEATER|ELEPHANT SEAL'],
SPORTS:['HOW MANY PLAYERS DOES A SOCCER TEAM HAVE ON THE FIELD?|11|9|10|12','IN WHICH SPORT IS A SHUTTLECOCK USED?|BADMINTON|TENNIS|SQUASH|VOLLEYBALL','HOW MANY SQUARES ARE ON A CHESSBOARD?|64|81|100|49','WHICH CHESS PIECE MOVES ONLY DIAGONALLY?|BISHOP|ROOK|KNIGHT|QUEEN','HOW MANY POINTS IS A TOUCHDOWN WORTH IN AMERICAN FOOTBALL?|6|7|3|5','HOW MANY RINGS ARE ON THE OLYMPIC FLAG?|5|4|6|7','IN BOWLING, WHAT IS IT CALLED TO KNOCK DOWN ALL 10 PINS WITH THE FIRST BALL?|STRIKE|SPARE|SPLIT|GUTTER','WHICH SPORT IS PLAYED AT THE WIMBLEDON CHAMPIONSHIPS?|TENNIS|GOLF|CRICKET|POLO','HOW MANY PLAYERS DOES A BASKETBALL TEAM HAVE ON THE COURT?|5|6|7|4','IN GOLF, WHAT IS A SCORE OF ONE UNDER PAR ON A HOLE?|BIRDIE|EAGLE|BOGEY|ALBATROSS','HOW MANY CARDS ARE IN A STANDARD DECK WITHOUT JOKERS?|52|54|48|50','WHAT IS THE HIGHEST SCORE WITH THREE DARTS?|180|150|160|200','HOW MANY DOTS ARE ON A STANDARD SIX-SIDED DIE IN TOTAL?|21|18|24|20','WHICH SPORT USES THE SCORING WORDS LOVE AND DEUCE?|TENNIS|GOLF|BOXING|RUGBY','HOW MANY HOLES ARE IN A STANDARD ROUND OF GOLF?|18|9|12|21','IN WHICH SPORT DO PLAYERS SLAM DUNK?|BASKETBALL|VOLLEYBALL|HANDBALL|WATER POLO','ROUGHLY HOW LONG IS A MARATHON IN KILOMETRES?|42|26|50|36','WHAT COLOUR IS THE CENTRE RING OF AN ARCHERY TARGET?|GOLD|RED|BLUE|BLACK','WHICH CHESS PIECE MOVES IN AN L SHAPE?|KNIGHT|BISHOP|ROOK|KING','HOW MANY POINTS IS THE BLACK BALL WORTH IN SNOOKER?|7|5|6|10','IN BASEBALL, HOW MANY STRIKES MAKE AN OUT?|3|4|2|5','HOW MANY PLAYERS DOES A VOLLEYBALL TEAM HAVE ON THE COURT?|6|5|7|4','WHICH COUNTRY DID THE MARTIAL ART JUDO COME FROM?|JAPAN|CHINA|KOREA|THAILAND','WHAT IS A PERFECT SCORE IN TEN-PIN BOWLING?|300|200|250|100','WHICH SPORT FEATURES SCRUMS AND LINEOUTS?|RUGBY|CRICKET|HOCKEY|LACROSSE','HOW MANY PIECES DOES EACH PLAYER START WITH IN CHESS?|16|12|18|20','WHAT IS THE MAXIMUM BREAK IN A STANDARD GAME OF SNOOKER?|147|155|100|180','HOW MANY PLAYERS DOES A CRICKET TEAM HAVE ON THE FIELD?|11|9|10|13'],
'ARTS + WORDS':['WHO PAINTED THE MONA LISA?|LEONARDO DA VINCI|MICHELANGELO|RAPHAEL|VINCENT VAN GOGH','WHO WROTE ROMEO AND JULIET?|WILLIAM SHAKESPEARE|CHARLES DICKENS|JANE AUSTEN|MARK TWAIN','HOW MANY KEYS ARE ON A STANDARD PIANO?|88|76|96|64','WHAT IS THE PLURAL OF MOUSE?|MICE|MOUSES|MEESE|MOUSEN','MIXING BLUE AND YELLOW PAINT MAKES WHICH COLOUR?|GREEN|PURPLE|ORANGE|BROWN','WHO PAINTED THE STARRY NIGHT?|VINCENT VAN GOGH|REMBRANDT|JOHANNES VERMEER|CLAUDE MONET','HOW MANY LINES DOES A HAIKU HAVE?|3|5|14|4','WHAT IS A WORD MEANING THE OPPOSITE OF ANOTHER WORD?|ANTONYM|SYNONYM|HOMONYM|ACRONYM','WHO WROTE PRIDE AND PREJUDICE?|JANE AUSTEN|CHARLOTTE BRONTE|MARY SHELLEY|GEORGE ELIOT','HOW MANY STRINGS DOES A STANDARD GUITAR HAVE?|6|4|5|8','WHICH COMPOSER WROTE THE MOONLIGHT SONATA?|BEETHOVEN|MOZART|BACH|CHOPIN','HOW MANY LINES DOES A SONNET HAVE?|14|12|10|16','WHICH ANCIENT GREEK POET IS CREDITED WITH THE ODYSSEY?|HOMER|VIRGIL|SOPHOCLES|PLATO','MIXING RED AND WHITE PAINT MAKES WHICH COLOUR?|PINK|ORANGE|PURPLE|MAROON','WHAT IS THE FIRST LETTER OF THE GREEK ALPHABET?|ALPHA|BETA|OMEGA|GAMMA','WHICH ORCHESTRA INSTRUMENT HAS 47 STRINGS AND 7 PEDALS?|HARP|PIANO|CELLO|LUTE','WHO WROTE A CHRISTMAS CAROL?|CHARLES DICKENS|LEO TOLSTOY|MARK TWAIN|OSCAR WILDE','WHO CARVED THE MARBLE STATUE OF DAVID IN FLORENCE?|MICHELANGELO|DONATELLO|BERNINI|RODIN','WHAT IS A GROUP OF FOUR MUSICIANS CALLED?|QUARTET|TRIO|QUINTET|DUET','IN MUSIC, WHAT DOES FORTE MEAN?|LOUD|SOFT|FAST|SLOW','HOW MANY LETTERS ARE IN THE ENGLISH ALPHABET?|26|24|28|25','WHICH PART OF SPEECH DESCRIBES A NOUN?|ADJECTIVE|VERB|ADVERB|PRONOUN','WHO WROTE ALICE\'S ADVENTURES IN WONDERLAND?|LEWIS CARROLL|ROALD DAHL|J. M. BARRIE|C. S. LEWIS','THE PRIMARY COLOURS OF LIGHT ARE RED, GREEN AND WHAT?|BLUE|YELLOW|WHITE|ORANGE','IN WHICH MUSEUM DOES THE MONA LISA HANG?|THE LOUVRE|THE PRADO|THE UFFIZI|THE BRITISH MUSEUM','WHO WROTE MOBY-DICK?|HERMAN MELVILLE|EDGAR ALLAN POE|NATHANIEL HAWTHORNE|JACK LONDON','WHICH MUSIC SYMBOL RAISES A NOTE BY A SEMITONE?|SHARP|FLAT|NATURAL|REST','WHAT DO YOU CALL A WORD THAT READS THE SAME BACKWARDS?|PALINDROME|ANAGRAM|ACRONYM|HOMOPHONE']};
const TOP=Object.keys(TQ),TCOL=['#4dabff','#3dff8b','#ff9838','#2fd6c3','#ff4f6d','#ff4f9a'];
const wrap=(s,n)=>{const ws=s.split(' '),ls=[''];for(const w of ws){if((ls[ls.length-1]+' '+w).trim().length>n)ls.push(w);else ls[ls.length-1]=(ls[ls.length-1]+' '+w).trim();}return ls;};
A.add({id:'trivia',name:'TRIVIA NIGHT',cat:'PARTY',vs:1,time:300,how:'PRESS THE DIRECTION OF YOUR ANSWER. RIGHT AND FAST SCORES MORE. 15 QUESTIONS.',make(){
 const g={over:null,score:0},NQ=15,LIM=600,BOX=[[85,84,150,22],[164,112,150,22],[85,140,150,22],[6,112,150,22]],AR=['u','r','d','l'];
 const pools=TOP.map(t=>shuf(TQ[t].slice()));let qs=[];const ord=shuf([0,1,2,3,4,5]);for(let i=0;i<NQ;i++){const ti=ord[i%6];const raw=pools[ti].pop().split('|');const opts=shuf([0,1,2,3]);qs.push({t:ti,q:raw[0],o:opts.map(k=>raw[1+k]),c:opts.indexOf(0)});}
 let qi=0,t=0,ph='intro',wait=70,pick=[-1,-1],at=[0,0],sc=[0,0],gain=[0,0],cpuT=0,cpuP=-1,streak=[0,0];
 const setQ=()=>{t=0;pick=[-1,-1];gain=[0,0];ph='ask';if(A.cpu){const acc=.42+.43*A.ai,q=qs[qi];cpuT=70+ri(200)+(1-A.ai)*120;cpuP=Math.random()<acc?q.c:(q.c+1+ri(3))%4;}};
 const reveal=()=>{const q=qs[qi];for(let p=0;p<2;p++){if(pick[p]===q.c){gain[p]=100+Math.round((LIM-at[p])/LIM*50);streak[p]++;if(streak[p]>=3)gain[p]+=25;sc[p]+=gain[p];}else streak[p]=0;}ph='reveal';wait=130;S(pick[0]===q.c?'score':'lose');if(pick[0]===q.c)A.burst(60,190,K.c,16,2);if(pick[1]===q.c)A.burst(260,190,K.p,16,2);};
 g.timeUp=()=>sc[0]===sc[1]?'TIME UP - DRAW':sc[0]>sc[1]?'TIME UP - P1 WINS':'TIME UP - '+(A.cpu?'CPU':'P2')+' WINS';
 g.update=()=>{if(wait>0){wait--;if(ph==='intro'&&wait===0)setQ();return;}
  if(ph==='reveal'){qi++;if(qi>=NQ){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}setQ();return;}
  if(ph!=='ask')return;t++;
  for(let p=0;p<2;p++){if(pick[p]>=0)continue;if(p===1&&A.cpu){if(t>=cpuT){pick[1]=cpuP;at[1]=t;S('blip');}continue;}if(p===1&&!A.two)continue;
   const h=A.hit(p);for(let k=0;k<4;k++)if(h[AR[k]]){pick[p]=k;at[p]=t;S('blip');break;}
   if(p===0&&pick[0]<0&&A.mouse.down&&h.a)for(let k=0;k<4;k++){const b=BOX[k];if(mIn(b[0],b[1],b[2],b[3])){pick[0]=k;at[0]=t;S('blip');}}}
  if((pick[0]>=0&&(pick[1]>=0||(!A.cpu&&!A.two)))||t>=LIM)reveal();};
 g.draw=()=>{A.cls('#1a1040');A.c.fillStyle=rg(160,60,10,200,['rgba(120,80,255,.35)','rgba(0,0,0,0)']);A.c.fillRect(0,0,W,H);
  for(let i=0;i<10;i++){const x=16+i*32,on=(A.t>>3)%10===i;C(x,3,2,on?K.y:'#5a4a90');}
  const q=qs[Math.min(qi,NQ-1)],col=TCOL[q.t];
  T('Q '+Math.min(qi+1,NQ)+'/'+NQ,6,8,K.w,1);rrf(110,6,100,11,4,col);TX(TOP[q.t],160,9,'#120830',1,'c');
  if(ph==='intro'){T('TRIVIA NIGHT',160,60,K.y,3,'c');T('15 QUESTIONS - 6 TOPICS',160,92,K.w,1,'c');T('PRESS THE ARROW THAT POINTS AT YOUR ANSWER',160,110,K.c,1,'c');}
  else{panelBox(6,20,308,58,'rgba(20,12,50,.95)');const ls=wrap(q.q,36);const y0=49-ls.length*6;ls.slice(0,4).forEach((l,i)=>TX(l,160,y0+i*12,K.w,2,'c'));
   if(ph==='ask'){const f=1-t/LIM;R(8,74,304*f,3,f<.3?K.r:K.y);}
   for(let k=0;k<4;k++){const b=BOX[k],rv=ph==='reveal',ok=rv&&k===q.c,bad=rv&&!ok&&(pick[0]===k||pick[1]===k);rrf(b[0],b[1],b[2],b[3],5,ok?'#1f8a4a':bad?'#8a1f30':'#2b2257');rrs(b[0]+.5,b[1]+.5,b[2]-1,b[3]-1,5,ok?K.g:col,1);
    const ax=b[0]+11,ay=b[1]+11,d=[[0,-1],[1,0],[0,1],[-1,0]][k];A.poly([[ax+d[0]*5,ay+d[1]*5],[ax-d[1]*4-d[0]*2,ay+d[0]*4-d[1]*2],[ax+d[1]*4-d[0]*2,ay-d[0]*4-d[1]*2]],K.y,1);
    TX(q.o[k],b[0]+20,b[1]+8,K.w,1);if(rv){if(pick[0]===k)T('P1',b[0]+b[2]-4,b[1]+3,K.c,1,'r');if(pick[1]===k)T(A.nm(1),b[0]+b[2]-4,b[1]+13,K.p,1,'r');}}}
  // podiums
  const pod=(x,p,c)=>{A.person(x,214,{s:1.15,c,id:p+1,arm1:pick[p]>=0&&ph==='ask'?-2.8:undefined});rrf(x-34,198,68,42,4,lg(0,198,0,240,['#4a3a90','#1a1240']));rrs(x-33.5,198.5,67,41,4,c,1);R(x-30,202,60,2,c);T(''+sc[p],x,208,c,2,'c');T(p?A.nm(1):'P1',x,226,K.w,1,'c');
   if(ph==='ask'&&pick[p]>=0)T('LOCKED',x+38,176,K.y,1,'c');if(ph==='reveal'&&gain[p])T('+'+gain[p],x+38,176,K.g,1,'c');};
  pod(56,0,K.c);pod(264,1,K.p);A.person(160,222,{s:1.2,c:'#ffcf3f',id:4,pants:'#222',arm2:-1.2});C(168,190,2.2,'#333');R(167,192,2,6,'#888');};
 return g;}});

/* =================== MUSICAL CHAIRS =================== */
A.add({id:'musicchairs',name:'MUSICAL CHAIRS',cat:'PARTY',vs:1,time:240,how:'LEFT/RIGHT SET YOUR PACE. WHEN THE MUSIC STOPS, A DIVES FOR A CHAIR. NO FALSE STARTS!',make(){
 const g={over:null,score:0},CX=160,CY=128,PR=[104,60],CR=[46,27],COL=[K.c,K.p,'#ff9838','#3dff8b','#ffcf3f'],GAMES=3;
 let pl,ca=[],ph='walk',mt=0,songT=0,song=0,games=0,sc=[0,0],msg='',wait=0,off=0;
 const pos=a=>[CX+Math.cos(a)*PR[0],CY+Math.sin(a)*PR[1]],cpos=i=>[CX+Math.cos(ca[i])*CR[0],CY+Math.sin(ca[i])*CR[1]];
 const human=i=>i===0||(i===1&&A.two);
 const newGame=()=>{pl=[];for(let i=0;i<5;i++)pl.push({a:i*1.2566+.3,v:.014,st:'walk',ch:-1,stun:0,x:0,y:0,rt:0,out:false,sk:i===1?A.ai:.62+rnd(.1)});songT=0;song=games%SONGS.length;layChairs();startMusic();};
 const alive=()=>pl.filter(p=>!p.out);
 const layChairs=()=>{const n=alive().length-1;off=rnd(6.28);ca=[];for(let i=0;i<n;i++)ca.push(off+i*6.2832/n);};
 const startMusic=()=>{ph='walk';mt=200+ri(300);for(const p of pl)if(!p.out){p.st='walk';p.ch=-1;const q=pos(p.a);p.x=q[0];p.y=q[1];}};
 const taken=i=>pl.some(p=>!p.out&&p.st==='seat'&&p.ch===i);
 const target=p=>{let b=-1,bd=1e9;for(let i=0;i<ca.length;i++){if(taken(i))continue;const q=cpos(i),d=Math.hypot(q[0]-p.x,q[1]-p.y);if(d<bd){bd=d;b=i;}}return b;};
 const dive=p=>{p.st='dash';p.ch=target(p);};
 g.timeUp=()=>sc[0]===sc[1]?'TIME UP - DRAW':sc[0]>sc[1]?'TIME UP - P1 WINS':'TIME UP - '+(A.cpu?'CPU':'P2')+' WINS';
 newGame();
 g.update=()=>{if(wait>0){wait--;if(wait===0){if(ph==='gameover'){games++;if(games>=GAMES){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}newGame();}else{layChairs();startMusic();}}return;}
  if(ph==='walk'){songT++;music(songT,SONGS[song],8);if(--mt<=0){ph='grab';S('boom');A.shake=4;for(const p of pl)p.rt=Math.round(12+(1-p.sk)*34+rnd(14));}}
  for(let i=0;i<5;i++){const p=pl[i];if(p.out)continue;if(p.stun>0)p.stun--;const hu=human(i),k=hu?A.in(i):null,h=hu?A.hit(i):null;
   if(p.st==='walk'){let want=.014;if(hu){want=k.r?.024:k.l?.008:.014;}else{let dmin=9;for(const c of ca){let d=c-p.a;d=((d%6.2832)+6.2832)%6.2832;if(d<dmin)dmin=d;}want=dmin<.35+p.sk*.15?.008:.022;if(ph==='walk'&&Math.random()<.0015*(1-p.sk))p.stun=40;}
    if(p.stun)want=.004;p.v+=(want-p.v)*.12;p.a+=p.v;const q=pos(p.a);p.x=q[0];p.y=q[1];
    if(ph==='walk'&&hu&&h.a&&!p.stun){p.stun=50;pop('FALSE START!',p.x,p.y-40,K.r);S('lose');}
    if(ph==='grab'&&!p.stun){if(hu?h.a:--p.rt<=0)dive(p);}}
   else if(p.st==='dash'){if(p.ch<0||taken(p.ch))p.ch=target(p);if(p.ch<0)continue;const q=cpos(p.ch),dx=q[0]-p.x,dy=q[1]-p.y,d=Math.hypot(dx,dy),sp=2.4;if(d<=sp){p.x=q[0];p.y=q[1];p.st='seat';S('coin');A.burst(p.x,p.y-10,COL[i],8,1.5);}else{p.x+=dx/d*sp;p.y+=dy/d*sp;}}}
  if(ph==='grab'){const al=alive();if(al.filter(p=>p.st==='seat').length>=ca.length){const loser=al.find(p=>p.st!=='seat');loser.out=true;const li=pl.indexOf(loser);msg=(li===0?'P1':li===1?A.nm(1):'CPU '+(li-1))+' IS OUT!';S(li<2?'lose':'hit');A.burst(loser.x,loser.y-12,K.r,16,2);
    for(let k=0;k<2;k++)if(!pl[k].out)sc[k]+=1;const al2=alive();
    if(al2.length<=1||(pl[0].out&&pl[1].out)){if(al2.length===1){const w=pl.indexOf(al2[0]);if(w<2){sc[w]+=3;msg=(w===0?'P1':A.nm(1))+' WINS THE GAME!';}}ph='gameover';wait=150;}else{ph='result';wait=110;}}}};
 const chair=(x,y,a,col)=>{const bx=-Math.cos(a)*5,by=-Math.sin(a)*3;ell(x,y+8,9,3,'rgba(0,0,0,.3)');R(x+bx-6,y+by-17,12,15,col||'#c0302a');R(x+bx-6,y+by-17,12,3,'#e85a4a');R(x-7,y-3,14,7,'#7a4a24');R(x-7,y-3,14,2,'#b8803a');R(x-6,y+4,2,5,'#4a2a10');R(x+4,y+4,2,5,'#4a2a10');};
 g.draw=()=>{A.cls('#8a5a34');for(let i=0;i<12;i++)R(0,40+i*17,W,1,'#6a4224');for(let y=40;y<240;y+=17)for(let x=(y/17|0)%3*24;x<W;x+=72)R(x,y,1,17,'#6a4224');
  R(0,0,W,40,'#4a3a6a');R(0,36,W,4,'#2a1a40');for(let i=0;i<8;i++){const on=ph==='walk'&&((A.t>>3)+i)%3===0;C(20+i*40,14,5,on?COL[i%5]:'#3a2a50');}
  ell(CX,CY+4,128,74,'#7a2a3a');ells(CX,CY+4,122,69,'#c8a050',1.5);ell(CX,CY+4,60,34,'#8e3646');
  // boombox
  R(270,48,40,22,'#222');C(280,59,7,ph==='walk'&&A.t%8<4?'#666':'#555');C(300,59,7,ph==='walk'&&A.t%8>=4?'#666':'#555');R(284,50,12,4,'#3dff8b');if(ph==='walk')for(let k=0;k<3;k++){const yy=44-((A.t+k*20)%60)*.5;T(k%2?'*':'+',266+k*14+Math.sin(A.t*.1+k)*4,yy,COL[k],1);}
  const items=[];ca.forEach((a,i)=>{const q=cpos(i);items.push({y:q[1],f:()=>chair(q[0],q[1],a)});});
  pl.forEach((p,i)=>{if(p.out)return;items.push({y:p.st==='seat'?cpos(p.ch)[1]+.5:p.y,f:()=>{if(p.st==='seat'){const q=cpos(p.ch);A.person(q[0],q[1]+1,{c:COL[i],id:i+1,s:1});R(q[0]-7,q[1]-3,14,7,'#7a4a24');R(q[0]-7,q[1]-3,14,2,'#b8803a');}else A.person(p.x,p.y,{c:COL[i],id:i+1,s:1,st:p.a*30,d:Math.sin(p.a)>0?-1:1});if(i<2||A.two)T(i===0?'P1':A.nm(1),(p.st==='seat'?cpos(p.ch)[0]:p.x),(p.st==='seat'?cpos(p.ch)[1]:p.y)-44,COL[i],1,'c');if(p.stun)T('!',p.x+6,p.y-40,K.r,1);}});});
  items.sort((a,b)=>a.y-b.y).forEach(it=>it.f());
  // out bench
  let ox=8;pl.forEach((p,i)=>{if(!p.out)return;ga(.55,()=>A.person(ox+8,236,{c:COL[i],id:i+1,s:.8}));ox+=18;});
  A.hud2(sc[0],sc[1]);T('GAME '+Math.min(games+1,GAMES)+'/'+GAMES+'  CHAIRS '+ca.length,160,26,K.w,1,'c');
  if(ph==='walk')T('MUSIC PLAYING - KEEP WALKING',160,226,'#ffd8a8',1,'c');if(ph==='grab'&&A.t%16<10)T('STOP! GRAB A CHAIR!',160,112,K.y,2,'c');if(ph==='result'||ph==='gameover')T(msg,160,112,K.y,2,'c');};
 return g;}});

/* =================== FREEZE DANCE =================== */
A.add({id:'freezedance',name:'FREEZE DANCE',cat:'PARTY',vs:1,time:240,how:'DANCE ON THE ARROWS WHILE MUSIC PLAYS. MATCH THE CUE. FREEZE THE MOMENT IT STOPS!',make(){
 const g={over:null,score:0},COL=[K.c,K.p,'#ff9838','#3dff8b'],XS=[52,124,196,268],AR=['u','r','d','l'],ROUNDS=3,GR=20;
 let ds,ph='intro',intro=80,nf=0,mt=90,songT=0,song=0,round=0,sc=[0,0],cue=0,cueT=0,beat=0,msg='',wait=0,frz=0;
 const human=i=>i===0||(i===1&&A.two);
 const newRound=()=>{ds=[];for(let i=0;i<4;i++)ds.push({out:false,groove:100,pose:-1,pt:0,hit:-1,slip:-1,nt:20+ri(20),sk:i===1?A.ai:.55+rnd(.2),why:''});song=round%SONGS.length;ph='intro';intro=80;nf=0;mt=180+ri(180);songT=0;};
 const alive=()=>ds.filter(d=>!d.out);
 const out=(i,why)=>{const d=ds[i];if(d.out)return;d.out=true;d.why=why;pop((i===0?'P1':i===1?A.nm(1):'CPU')+' '+why,XS[i],140,K.r);S(i<2?'lose':'hit');A.burst(XS[i],170,K.r,12,2);};
 const move=(i,k)=>{const d=ds[i];d.pose=k;d.pt=12;if(ph==='music'){d.groove=Math.min(100,d.groove+34);if(k===cue&&d.hit!==beat){d.hit=beat;if(i<2){sc[i]+=10;}A.burst(XS[i],128,COL[i],5,1.5);}}else if(ph==='freeze'&&frz>GR)out(i,'MOVED!');};
 const endRound=()=>{const al=alive();for(const d of al){const i=ds.indexOf(d);if(i<2)sc[i]+=al.length===1?50:20;}const w=al.length===1?ds.indexOf(al[0]):-1;msg=w>=0?(w===0?'P1':w===1?A.nm(1):'CPU '+(w-1))+' IS THE LAST DANCER!':al.length?al.length+' DANCERS SURVIVED!':'EVERYONE IS OUT!';ph='end';wait=150;S('win');};
 g.timeUp=()=>sc[0]===sc[1]?'TIME UP - DRAW':sc[0]>sc[1]?'TIME UP - P1 WINS':'TIME UP - '+(A.cpu?'CPU':'P2')+' WINS';
 newRound();
 g.update=()=>{if(wait>0){wait--;if(wait===0){round++;if(round>=ROUNDS){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}newRound();}return;}
  if(ph==='intro'){if(--intro<=0)ph='music';return;}
  if(ph==='music'){songT++;music(songT,SONGS[song],7);if(++cueT>=28){cueT=0;beat++;cue=ri(4);}if(--mt<=0){ph='freeze';frz=0;mt=80+ri(120);S('boom');A.shake=3;for(let i=0;i<4;i++){const d=ds[i];d.slip=!d.out&&!human(i)&&Math.random()<(i===1?.2*(1.1-A.ai)+.01:.1)?GR+4+ri(30):-1;}}}
  else if(ph==='freeze'){frz++;if(--mt<=0){nf++;if(nf>=6){endRound();return;}ph='music';mt=120+ri(200)-round*20;cueT=0;}}
  for(let i=0;i<4;i++){const d=ds[i];if(d.out)continue;if(d.pt>0)d.pt--;
   if(human(i)){const h=A.hit(i);for(let k=0;k<4;k++)if(h[AR[k]]){move(i,k);break;}if(ph==='freeze'&&frz>GR&&h.a)out(i,'MOVED!');}
   else{if(ph==='music'){if(--d.nt<=0){d.nt=14+ri(16);const k=Math.random()<.45+.5*d.sk?cue:ri(4);move(i,k);}}else if(ph==='freeze'&&d.slip>0&&frz===d.slip)move(i,ri(4));}
   if(ph==='music'){d.groove-=.85;if(d.groove<=0)out(i,'STOPPED!');}}
  if(ph==='end')return;const al=alive();if(al.length<=1||(ds[0].out&&ds[1].out))endRound();};
 g.draw=()=>{const on=ph==='music';A.cls(on?'#1a0c38':'#0c1838');
  for(let y=0;y<6;y++)for(let x=0;x<10;x++){const lit=on&&((x+y+beat)%3===0);R(x*32,150+y*15,32,15,lit?['#ff4f9a','#4dabff','#ffcf3f','#3dff8b'][(x+y+beat)%4]:(x+y)%2?'#2a2050':'#221a44');}
  C(160,16,10,'#cfd8e8');for(let k=0;k<12;k++){const a=k*.52+A.t*.04;R(160+Math.cos(a)*6-1,16+Math.sin(a)*6-1,2,2,on?'#ffffff':'#8899aa');}
  if(on)for(let k=0;k<4;k++){const a=A.t*.03+k*1.57;A.c.fillStyle=['rgba(255,79,154,.12)','rgba(77,171,255,.12)','rgba(255,207,63,.12)','rgba(61,255,139,.12)'][k];A.poly([[160,16],[160+Math.cos(a)*240-30,240],[160+Math.cos(a)*240+30,240]],A.c.fillStyle,1);}
  // cue
  if(on){rrf(136,30,48,40,6,'rgba(0,0,0,.5)');const d=[[0,-1],[1,0],[0,1],[-1,0]][cue],cx=160,cy=50,sz=1-cueT/28*.3;A.poly([[cx+d[0]*14*sz,cy+d[1]*14*sz],[cx-d[1]*11*sz-d[0]*4,cy+d[0]*11*sz-d[1]*4],[cx+d[1]*11*sz-d[0]*4,cy-d[0]*11*sz-d[1]*4]],K.y,1);T('MATCH IT',160,74,K.w,1,'c');}
  else if(ph==='freeze'){T('FREEZE!',160,40,'#9fe8ff',3,'c');}else if(ph==='intro')T('GET READY...',160,44,K.y,2,'c');
  R(0,207,W,33,'rgba(10,6,30,.6)');ds.forEach((d,i)=>{const x=XS[i],y=200;if(d.out){ga(.35,()=>A.person(x,y,{c:COL[i],id:i+1,s:1.6}));T(d.why,x,206,K.r,1,'c');return;}
   const p=d.pose,bob=on?Math.sin(A.t*.4+i)*1.5:0,arms=p===0?[-2.8,2.8]:p===1?[-.4,-1.6]:p===2?[.3,-.3]:p===3?[1.6,.4]:[0,0];
   ell(x,y+2,16,4,'rgba(0,0,0,.35)');A.person(x,y+bob,{c:COL[i],id:i+1,s:1.6,arm1:arms[0],arm2:arms[1],st:on&&p===2?A.t*.5:0});
   if(ph==='freeze')ga(.25,()=>rrf(x-14,y-58,28,60,6,'#9fe8ff'));
   R(x-16,y+10,32,4,'#000');R(x-16,y+10,32*d.groove/100,4,d.groove<30?K.r:COL[i]);if(i<2||A.two)T(i===0?'P1':A.nm(1),x,y+18,COL[i],1,'c');});
  A.hud2(sc[0],sc[1]);T('ROUND '+Math.min(round+1,ROUNDS)+'/'+ROUNDS,160,232,K.w,1,'c');if(ph==='end')T(msg,160,96,K.y,1,'c');};
 return g;}});

/* =================== PUMP IT =================== */
A.add({id:'balloonpump',name:'PUMP IT',cat:'PARTY',vs:1,time:300,how:'TAKE TURNS: A PUMPS (AT LEAST ONCE), B PASSES. BIG PUMPS PAY. POP IT, LOSE YOUR POT.',make(){
 const g={over:null,score:0},BAL=6,BCOL=['#ff4f6d','#4dabff','#ffcf3f','#3dff8b','#ff9838','#ff4f9a'];
 let sc=[0,0],pot=[0,0],n=0,burst=0,turn=0,did=0,bal=0,ph='play',wait=40,plT=[0,0],msg='',creak=0,cpuPlan=0,wob=0,shards=[];
 const newBal=()=>{n=0;burst=8+ri(20);pot=[0,0];turn=bal%2;did=0;ph='play';wait=40;creak=0;cpuPlan=-1;shards=[];};
 const size=()=>10+Math.sqrt(n)*9;
 const pump=p=>{n++;did++;pot[p]+=n;plT[p]=14;wob=8;S('blip');tone(hz(48+n*1.5),.12,'triangle',.05);
  if(n>=burst){ph='pop';wait=120;const o=1-p;sc[o]+=pot[o]+10;msg=(p===0?'P1':A.nm(1))+' POPPED IT! LOSES '+pot[p];pot[p]=0;S('boom');A.shake=10;A.burst(160,100,BCOL[bal%6],50,4);for(let k=0;k<14;k++)shards.push({x:160+rnd(40)-20,y:100+rnd(40)-20,vx:rnd(4)-2,vy:rnd(3)-3,r:rnd(6.28)});return;}
  creak=(burst-n<=2?Math.random()<.65:Math.random()<.12)?40:0;if(creak)tone(hz(30),.25,'sawtooth',.03);};
 const pass=p=>{if(!did){S('lose');return;}turn=1-p;did=0;S('coin');cpuPlan=-1;wait=20;};
 const cpuStop=()=>{ // number of pumps CPU wants this turn
  const lo=Math.max(n+1,8),hz_=k=>k<8?0:1/Math.max(1,27-k+1);let want=1;for(let k=n+1;k<n+12;k++){const h=hz_(k),ev=(1-h)*k-h*(pot[1]+k);if(ev<0&&k>n+1)break;if(A.ai>=1&&creak)break;want=k-n;}
  if(A.ai<.6)want=1+ri(4);else if(A.ai<.9)want=Math.max(1,want+ri(3)-1);if(sc[1]+pot[1]<sc[0]-30&&bal>=BAL-2)want+=2;return Math.max(1,want);};
 g.timeUp=()=>sc[0]===sc[1]?'TIME UP - DRAW':sc[0]>sc[1]?'TIME UP - P1 WINS':'TIME UP - '+(A.cpu?'CPU':'P2')+' WINS';
 newBal();
 g.update=()=>{for(let p=0;p<2;p++)if(plT[p]>0)plT[p]--;if(wob>0)wob--;if(creak>0)creak--;shards.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.vy+=.15;s.r+=.2;});
  if(wait>0){wait--;return;}
  if(ph==='pop'){bal++;if(bal>=BAL){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}newBal();return;}
  if(turn===1&&A.cpu){if(cpuPlan<0)cpuPlan=cpuStop();if(did<cpuPlan){pump(1);wait=20+ri(10);}else pass(1);return;}
  const h=A.hit(A.two?turn:0);if(h.a)pump(turn);else if(h.b)pass(turn);};
 g.draw=()=>{A.cls('#2a1850');A.c.fillStyle=rg(160,100,20,220,['rgba(255,200,120,.25)','rgba(0,0,0,0)']);A.c.fillRect(0,0,W,H);
  for(let i=0;i<14;i++){const x=i*24+12;A.poly([[x-10,0],[x+10,0],[x,14]],BCOL[i%6],1);}L(0,1,W,1,'#ddd',1);
  R(0,196,W,44,'#3a2a20');R(0,196,W,3,'#5a4030');
  // hoses
  const cx=160,cy=100,s=size()*(1+Math.sin(A.t*.8)*.01*wob)+(creak?Math.sin(A.t*1.7)*1.2:0),col=BCOL[bal%6];
  A.c.strokeStyle='#333';A.c.lineWidth=3;A.c.beginPath();A.c.moveTo(66,170);A.c.quadraticCurveTo(110,200,cx,cy+s+14);A.c.moveTo(254,170);A.c.quadraticCurveTo(210,200,cx,cy+s+14);A.c.stroke();
  if(ph!=='pop'){const tr=Math.min(.55,n/40);ell(cx,cy,s*.92,s,rg(cx-s*.35,cy-s*.4,s*.1,s*1.1,[A.mix(col,'#ffffff',.45+tr*.3),col,A.mix(col,'#000000',.35)]));ga(.5,()=>ell(cx-s*.35,cy-s*.45,s*.18,s*.28,'#ffffff',-.5));A.poly([[cx-4,cy+s+6],[cx+4,cy+s+6],[cx,cy+s-1]],col,1);L(cx,cy+s+6,cx,cy+s+14,'#ddd',1);
   if(creak)T('CREAK',cx+s+8,cy-s*.5,K.w,1);}
  else shards.forEach(sh=>{A.c.save();A.c.translate(sh.x,sh.y);A.c.rotate(sh.r);R(-4,-2,8,4,col);A.c.restore();});
  // pumps + people
  for(let p=0;p<2;p++){const x=p?254:66,dn=plT[p]>0?Math.sin(plT[p]/14*3.14)*10:0,c=p?K.p:K.c;R(x-6,150,12,26,'#888');R(x-8,174,16,4,'#555');R(x-1,136+dn,2,16,'#ccc');R(x-9,134+dn,18,4,'#222');
   A.person(x+(p?18:-18),196,{c,id:p+1,s:1.4,d:p?-1:1,arm1:dn?-1.2:-.6,arm2:dn?-1.2:-.6});
   const on=turn===p&&ph==='play';rrf(p?228:12,8,80,36,5,on?'rgba(255,207,63,.25)':'rgba(0,0,0,.3)');if(on)rrs(p?228:12,8,80,36,5,K.y,1);T(p?A.nm(1):'P1',p?268:52,12,c,1,'c');T(''+sc[p],p?268:52,22,K.w,2,'c');T('POT '+pot[p],p?268:52,212,c,1,'c');}
  T('BALLOON '+Math.min(bal+1,BAL)+'/'+BAL,160,22,K.w,1,'c');T('PUMPS '+n,160,32,K.gr,1,'c');
  if(ph==='play'){const who=turn===0?'P1':A.nm(1);T(who+(did?' - A PUMP AGAIN  B PASS':' - PUMP AT LEAST ONCE'),160,226,K.y,1,'c');T('NEXT PUMP +'+(n+1),160,214,K.w,1,'c');}
  if(ph==='pop')T(msg,160,150,K.y,1,'c');};
 return g;}});

/* =================== DEFUSE =================== */
const WC=[['RED','#e0303a'],['BLUE','#2a6fd6'],['YELLOW','#f2c12e'],['WHITE','#f2f2f2'],['BLACK','#1a1a1a'],['GREEN','#2fa84f']];
const perms=a=>a.length<=1?[a]:a.flatMap((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).map(p=>[x].concat(p)));
const NTH=['FIRST','SECOND','THIRD','FOURTH','FIFTH','SIXTH'];
A.add({id:'defuse',name:'DEFUSE',cat:'PARTY',time:300,how:'READ THE MANUAL. UP/DOWN PICK A WIRE, A CUTS. CUT IN THE RIGHT ORDER BEFORE ZERO.',make(){
 const g={over:null,score:0};
 let bomb,sel=0,lvl=0,timer=0,strikes=0,ph='play',wait=0,msg='',defused=0,flash=0,sparks=[];
 const gen=()=>{const nw=Math.min(6,3+((lvl+1)>>1)),cols=shuf([0,1,2,3,4,5]).slice(0,nw),decoy=lvl>=2?1+(lvl>=6?1:0):0;
  const wires=cols.map(c=>({c,cut:false,spark:0}));const decoys=shuf(cols.slice()).slice(0,decoy),cutters=cols.filter(c=>!decoys.includes(c)),order=shuf(cutters.slice());
  const serial=[...Array(5)].map(()=>'ABCDEFGHJKLMNPRSTUVXZ0123456789'[ri(31)]).join('')+ri(10),bat=ri(5),led=ri(3);
  const conds=[['THE SERIAL ENDS IN AN ODD DIGIT',(+serial[5])%2===1],['THE SERIAL HAS A VOWEL',/[AEU]/.test(serial)],['THERE ARE 2 OR MORE BATTERIES',bat>=2],['THE LIGHT IS RED',led===0],['THE LIGHT IS GREEN',led===1]];
  const nm=c=>WC[c][0],posOf=c=>cols.indexOf(c);
  let cand=perms(cutters);const clues=[];decoys.forEach(c=>clues.push({t:'NEVER CUT THE '+nm(c)+' WIRE.',f:()=>true}));
  const mk=()=>{const k=order.length,i=ri(k),j=(i+1+ri(Math.max(1,k-1)))%k,a=order[i],b=order[j],ty=ri(6);
   if(ty===0)return{t:'CUT '+nm(order[0])+' FIRST.',f:p=>p[0]===order[0]};if(ty===1)return{t:'CUT '+nm(order[k-1])+' LAST.',f:p=>p[k-1]===order[k-1]};
   if(ty===2&&i!==j){const x=i<j?a:b,y=i<j?b:a;return{t:'CUT '+nm(x)+' SOMETIME BEFORE '+nm(y)+'.',f:p=>p.indexOf(x)<p.indexOf(y)};}
   if(ty===3&&i<k-1){const y=order[i+1];return{t:'CUT '+nm(y)+' RIGHT AFTER '+nm(a)+'.',f:p=>p.indexOf(y)===p.indexOf(a)+1};}
   if(ty===4)return{t:'THE '+NTH[posOf(a)]+' WIRE FROM THE TOP IS CUT '+NTH[i]+'.',f:p=>p.indexOf(a)===i};
   return{t:'CUT '+nm(a)+' '+NTH[i]+'.',f:p=>p.indexOf(a)===i};};
  let guard=0;while(cand.length>1&&guard++<200){let c=mk();const nc=cand.filter(c.f);if(nc.length===cand.length||!nc.length)continue;
   if(lvl>=1&&Math.random()<.45){const cd=conds[ri(conds.length)];let alt=null;for(let t=0;t<20&&!alt;t++){const a2=mk();if(!a2.f(order))alt=a2;}if(alt){c={t:(cd[1]?'IF ':'UNLESS ')+cd[0]+': '+c.t+' OTHERWISE: '+alt.t,f:c.f};}}
   clues.push(c);cand=nc;}
  let lines=0;clues.forEach((c,i)=>lines+=wrap((i+1)+'. '+c.t,36).length);return{wires,order,serial,bat,led,clues:shuf(clues),step:0,cand,lines,decoys};};
 const newBomb=()=>{let b=gen(),k=0;while((b.lines+b.clues.length*.5>23||b.cand.length!==1)&&k++<30)b=gen();bomb=b;sel=0;timer=Math.max(40,70-lvl*4)*60;strikes=0;ph='play';};
 newBomb();
 const boom=()=>{ph='boom';wait=150;S('boom');A.shake=14;A.burst(80,120,K.o,60,5);A.burst(80,120,K.r,40,3);g.over=null;};
 g.update=()=>{if(flash>0)flash--;bomb.wires.forEach(w=>{if(w.spark>0)w.spark--;});
  if(wait>0){wait--;if(wait===0){if(ph==='boom'){g.over='BOOM! '+defused+' BOMB'+(defused===1?'':'S')+' DEFUSED';return;}lvl++;newBomb();}return;}
  if(ph!=='play')return;timer-=1+strikes*.5;if(timer<=0){timer=0;boom();return;}if(timer<600&&timer%60<1.5)S('blip');
  const h=A.hit(0),n=bomb.wires.length;let hov=-1;for(let k=0;k<n;k++)if(mIn(20,58+k*24-6,120,14))hov=k;if(hov>=0&&mAct())sel=hov;
  if(h.u){sel=(sel+n-1)%n;S('blip');}if(h.d){sel=(sel+1)%n;S('blip');}
  if(h.a&&!(clickOff()&&hov<0)){const w=bomb.wires[sel];if(w.cut)return;const nc=bomb.cand.filter(p=>p[bomb.step]===w.c);if(nc.length){bomb.cand=nc;w.cut=true;bomb.step++;g.score+=10;S('coin');A.burst(80,58+sel*24,'#ffffff',8,1.5);
    if(bomb.step>=bomb.order.length){defused++;const b=100+Math.round(timer/60)*3;g.score+=b;msg='DEFUSED! +'+b;ph='won';wait=110;S('win');A.burst(80,120,K.g,30,3);}}
   else{strikes++;w.spark=30;flash=12;S('lose');A.shake=6;timer=Math.max(1,timer-8*60);msg='WRONG WIRE!';if(strikes>=3)boom();}}};
 g.draw=()=>{A.cls('#20242c');for(let i=0;i<W;i+=16)R(i,0,1,H,'#262b34');
  // bomb case
  rrf(6,22,150,212,8,lg(0,22,0,234,['#5a5f6a','#3a3e48']));rrs(6.5,22.5,149,211,8,'#7a808c',1);
  rrf(16,28,130,22,3,'#101010');const s=Math.ceil(timer/60);T((s/60|0)+':'+String(s%60).padStart(2,'0'),81,32,s<=10&&A.t%20<10?'#ff8080':'#ff3030',3,'c');
  // wires
  bomb.wires.forEach((w,k)=>{const y=58+k*24,col=WC[w.c][1],on=k===sel&&ph==='play';C(22,y,4,'#b0b4bc');C(140,y,4,'#b0b4bc');
   if(w.cut){L(22,y,70,y+4,col,4);L(92,y-4,140,y,col,4);}else{A.c.strokeStyle=col;A.c.lineWidth=4;A.c.beginPath();A.c.moveTo(22,y);A.c.bezierCurveTo(60,y+8,100,y-8,140,y);A.c.stroke();if(w.c===4){A.c.strokeStyle='#555';A.c.lineWidth=1;A.c.stroke();}}
   if(on){rrs(14,y-9,134,18,4,K.y,1);T('>',8,y-2,K.y,1);}if(w.spark)A.burst(81,y,K.y,2,1.2);});
  // features
  const fy=206;rrf(12,fy,62,22,3,'#f4f0e0');T('SERIAL',15,fy+3,'#666',1);T(bomb.serial,15,fy+12,'#111',1);
  for(let b=0;b<bomb.bat;b++){R(80+b*12,fy+2,9,18,'#2a2a2a');R(80+b*12,fy+2,9,6,'#d8a020');R(82+b*12,fy,5,2,'#999');}if(!bomb.bat)T('NO BATT',80,fy+8,'#aaa',1);
  C(142,fy+11,6,['#ff3030','#30e060','#444444'][bomb.led]);if(bomb.led<2)ga(.3,()=>C(142,fy+11,10,['#ff3030','#30e060'][bomb.led]));
  for(let k=0;k<3;k++)rrf(118+k*10,30,8,8,2,k<strikes?'#ff3030':'#303030');
  // manual
  rrf(162,8,154,226,4,'#efe6cc');R(162,8,154,16,'#c8b88a');T('BOMB MANUAL - CASE '+(lvl+1),239,13,'#3a2a10',1,'c');let y=30;
  bomb.clues.forEach((c,i)=>{const ls=wrap((i+1)+'. '+c.t,36);ls.forEach((l,j)=>{if(y<226)T((j?'   ':'')+l,166,y,'#2a2010',1);y+=8;});y+=4;});
  if(flash)ga(flash/24,()=>R(0,0,W,H,'#ff2020'));
  T('DEFUSED '+defused+'   SCORE '+g.score,4,4,K.w,1);
  if(ph==='won'||(ph==='play'&&msg==='WRONG WIRE!'&&flash))T(msg,81,186,ph==='won'?K.g:K.r,1,'c');if(ph==='boom'){ga(.6,()=>R(0,0,W,H,'#ff8020'));T('BOOM!',160,100,K.y,4,'c');}};
 return g;}});

/* =================== CAFE TYCOON =================== */
A.add({id:'cafetycoon',name:'CAFE TYCOON',cat:'SIM',time:420,how:'TAP A TO BREW FOR THE FRONT CUSTOMER. UP/DOWN SETS PRICE. LEFT/RIGHT AND B BUY UPGRADES.',make(){
 const g={over:null,score:0},ck=endClock(),GOAL=2500;
 let cash=60,price=4,rep=1.5,tables=1,baristas=0,mach=0,pastry=0,decor=0,cus=[],prog=0,sel=0,earned=0,served=0,t=0,steam=[],nid=0,lost=0;
 const UP=[['TABLE',()=>tables<6,()=>40+tables*35,()=>tables++,'+2 SEATS'],['BARISTA',()=>baristas<3,()=>[100,190,300][baristas],()=>baristas++,'AUTO BREWS, WAGES'],['MACHINE',()=>mach<3,()=>[120,240,400][mach],()=>mach++,'FASTER, FAIR PRICE UP'],['PASTRY',()=>pastry<2,()=>[90,210][pastry],()=>pastry++,'EXTRA SALES'],['DECOR',()=>decor<3,()=>[70,160,280][decor],()=>decor++,'STARS + FAIR PRICE']];
 const fair=()=>3+mach*.9+decor*.6+pastry*.4,spd=()=>[1,1.45,1.9,2.5][mach];
 const tablePos=tb=>[206+(tb%3)*40,tb<3?146:186],seatPos=i=>{const p=tablePos(i>>1);return[p[0]+(i&1?13:-13),p[1]];};
 const seatFree=i=>!cus.some(c=>c.seat===i);
 const line=()=>cus.filter(c=>c.st==='queue'||c.st==='enter');
 const slot=k=>[104+k*13,172];
 const leave=(c,ang)=>{c.st='leave';c.tx=322;c.ty=176;if(ang){rep=Math.max(0,rep-.12);lost++;pop('TOO SLOW!',c.x,c.y-40,K.r);}};
 const finish=()=>{const st=Math.round(rep*10)/10;g.over=earned>=GOAL?'CLOSING TIME - GOAL COMPLETE, '+st+' STARS':'CLOSING TIME - '+earned+' EARNED, '+st+' STARS';};
 g.update=()=>{t++;if(ck()){finish();return;}const h=A.hit(0);
  if(h.u&&price<12){price++;S('blip');}if(h.d&&price>1){price--;S('blip');}
  let hov=-1;for(let k=0;k<5;k++)if(mIn(4+k*63,202,60,26))hov=k;if(hov>=0&&mAct())sel=hov;
  if(h.l){sel=(sel+4)%5;S('blip');}if(h.r){sel=(sel+1)%5;S('blip');}
  const u=UP[sel];if(h.b||(hov>=0&&clickOff())){if(u[1]()&&cash>=u[2]()){cash-=u[2]();u[3]();S('coin');A.burst(4+sel*63+30,206,K.y,14,2);pop(u[0]+'!',4+sel*63+30,190,K.y);}else S('lose');}
  // arrivals
  const f=fair(),dem=cl(1.55-.24*(price-f),.12,2.2),pA=(.0055+rep*.0042)*dem;
  if(Math.random()<pA){if(line().length<7)cus.push({x:322,y:176,st:'enter',tx:0,ty:0,pat:900+rep*120,seat:-1,id:nid++,c:['#e0663a','#4dabff','#3dff8b','#ff4f9a','#ffcf3f','#a05ae0','#2fd6c3'][ri(7)],t:0,wt:0});else if(t%30===0)rep=Math.max(0,rep-.01);}
  // serve
  const q=line().filter(c=>c.st==='queue');q.sort((a,b)=>a.k-b.k);const front=q.length&&q[0].k===0?q[0]:null;
  if(front){if(h.a&&!(clickOff()&&hov<0)){prog+=19*spd();steam.push({x:44+rnd(10),y:96,t:30});S('blip');}prog+=baristas*.32*spd();
   if(prog>=100){prog=0;let pay=price;if(pastry&&Math.random()<.35+pastry*.2)pay+=2+pastry;cash+=pay;earned+=pay;g.score=earned;served++;S('coin');A.burst(80,120,K.y,8,1.5);pop('+'+pay,90,110,K.y);
    const happy=(price<=f+.5?.035:-.05*(price-f))+(front.wt<300?.015:-.02)+decor*.008;rep=cl(rep+happy,0,5);
    let si=-1;for(let i=0;i<tables*2;i++)if(seatFree(i)){si=i;break;}if(si>=0){front.st='seat';front.seat=si;const p=seatPos(si);front.tx=p[0];front.ty=p[1];}else{leave(front,false);rep=Math.max(0,rep-.02);}}}
  else prog=Math.max(0,prog-.5);
  if(baristas&&t%240===0&&cash>0)cash=Math.max(0,cash-baristas*2);
  // queue order
  let k=0;for(const c of cus)if(c.st==='queue'||c.st==='enter'){c.k=k;const s=slot(k);c.tx=s[0];c.ty=s[1];k++;}
  for(const c of cus){const dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy),sp=1.3;c.mv=d>.5;if(d>sp){c.x+=dx/d*sp;c.y+=dy/d*sp;}else{c.x=c.tx;c.y=c.ty;}
   if(c.st==='enter'&&d<=sp)c.st='queue';if(c.st==='queue'){c.wt++;if(--c.pat<=0)leave(c,true);}
   if(c.st==='seat'&&d<=sp){c.st='sit';c.t=500+ri(400);}if(c.st==='sit'&&--c.t<=0){c.seat=-1;leave(c,false);rep=cl(rep+.02,0,5);}}
  cus=cus.filter(c=>!(c.st==='leave'&&c.x>=321));steam=steam.filter(s=>(s.y-=.4,--s.t>0));};
 const star=(x,y,r,on)=>{const p=[];for(let i=0;i<10;i++){const a=-1.5708+i*.6283,rr=i%2?r*.45:r;p.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}A.poly(p,on?K.y:'#4a3a2a',1);};
 g.draw=()=>{A.cls('#f0d8b0');R(0,20,W,100,lg(0,20,0,120,['#e8c89a','#d8b080']));for(let x=0;x<W;x+=24)R(x,20,12,100,'rgba(255,255,255,.08)');
  R(0,118,W,82,lg(0,118,0,200,['#9a6a40','#6a4424']));for(let y=124;y<200;y+=10)R(0,y,W,1,'rgba(0,0,0,.15)');
  // windows + menu board
  for(let k=0;k<2+decor;k++){const x=200+k*38;if(x>300)break;R(x,34,30,40,'#5a3a1a');R(x+2,36,26,36,lg(0,36,0,72,['#bfe8ff','#7ab8e0']));R(x+14,36,2,36,'#5a3a1a');}
  R(96,30,90,52,'#2a2a2a');R(98,32,86,48,'#1a3a2a');T('MENU',141,36,K.w,1,'c');T('COFFEE '+price,141,48,K.y,1,'c');if(pastry)T('PASTRY +'+(2+pastry),141,58,'#ffd8a8',1,'c');T('FAIR ~'+fair().toFixed(1),141,70,'#9fd8b0',1,'c');
  if(decor>=1){C(14,40,6,'#3a8a3a');R(12,46,4,10,'#6a4a2a');}if(decor>=2)for(let k=0;k<6;k++)C(20+k*50,24,3,['#ff4f6d','#ffcf3f','#4dabff'][k%3]);if(decor>=3){R(190,92,8,26,'#6a4a2a');C(194,88,9,'#3a9a3a');}
  // door
  R(304,98,16,100,'#7a4a24');R(306,100,12,40,'#bfe8ff');
  // counter + barista
  A.person(46,121,{c:'#2a2a2a',id:3,cap:'#8a3a1a',arm1:prog>0&&A.t%10<5?-1.4:-.4});
  R(6,112,84,44,lg(0,112,0,156,['#8a5a34','#5a3a1a']));R(4,108,88,6,'#c8a070');R(14,90,22,18,'#c0c0c8');R(16,92,18,6,'#3a3a40');C(25,104,3,'#e8e8e8');
  for(let b=0;b<baristas;b++)A.person(64+b*8,121,{c:'#2a2a2a',id:b+4,cap:'#3a6a8a',arm1:A.t%14<7?-1.2:-.3});
  if(pastry){R(58,96,26,12,'rgba(200,240,255,.6)');for(let k=0;k<3;k++)C(63+k*8,104,2.5,'#d89a50');}
  steam.forEach(s=>ga(s.t/30,()=>C(s.x,s.y,2,'#ffffff')));
  // brew bar
  R(10,160,76,6,'#2a1a10');R(10,160,76*prog/100,6,K.y);T('BREW',48,170,'#f0e0c0',1,'c');
  // tables + people sorted by y
  const it=[];for(let tb=0;tb<tables;tb++){const p=tablePos(tb);it.push({y:p[1]+1,f:()=>{ell(p[0],p[1]+2,16,4,'rgba(0,0,0,.3)');R(p[0]-11,p[1]-12,22,4,'#e8e0d0');R(p[0]-2,p[1]-8,4,10,'#5a3a1a');R(p[0]-6,p[1],12,2,'#5a3a1a');}});for(let s=0;s<2;s++){const q=seatPos(tb*2+s);it.push({y:q[1]-.5,f:()=>{R(q[0]-4,q[1]-8,8,2,'#7a3a1a');R(q[0]-4,q[1]-6,2,6,'#5a2a10');R(q[0]+2,q[1]-6,2,6,'#5a2a10');}});}}
  cus.forEach(c=>it.push({y:c.y,f:()=>{const sit=c.st==='sit';A.person(c.x,sit?c.y-2:c.y,{c:c.c,id:c.id,st:c.mv?A.t*.3:0,d:sit?(c.seat&1?-1:1):c.x>c.tx?-1:1});if(sit){R(c.x-5,c.y-9,10,3,'#8a4a24');R(c.x-5,c.y-6,10,6,'#5a2a10');R(c.x+(c.seat&1?-9:5),c.y-15,4,4,'#ffffff');}if(c.st==='queue'&&c.pat<300&&A.t%20<12)T('!',c.x,c.y-42,K.r,1,'c');}}));
  it.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  // hud
  R(0,0,W,20,'#2a1a10');T('CASH '+cash,4,4,K.y,1);T('EARNED '+earned+'/'+GOAL,4,12,'#ffd8a8',1);T('PRICE '+price,160,4,K.w,1,'c');T('UP/DOWN',160,12,'#a08060',1,'c');for(let i=0;i<5;i++)star(246+i*14,10,6,rep>=i+.5);
  // shop bar
  R(0,200,W,40,'#1a1008');UP.forEach((u,k)=>{const x=4+k*63,can=u[1](),cost=can?u[2]():0,on=k===sel;rrf(x,202,60,26,4,on?'#5a3a1a':'#2a1a10');rrs(x+.5,202.5,59,25,4,on?K.y:'#5a4030',1);T(u[0],x+30,206,on?K.y:K.w,1,'c');T(can?''+cost:'MAX',x+30,216,can&&cash>=cost?K.g:'#a07050',1,'c');});
  T(UP[sel][4]+'  (B BUYS)',160,232,'#d8b890',1,'c');};
 return g;}});

/* =================== TINY CITY =================== */
const TOOLS=[['ROAD',10,'#555a66'],['HOME',30,'#3dff8b'],['SHOP',50,'#4dabff'],['FACTORY',70,'#ff9838'],['POWER',200,'#ffcf3f'],['PARK',40,'#2fa84f'],['BULLDOZE',5,'#ff4f6d']];
A.add({id:'tinycity',name:'TINY CITY',cat:'SIM',time:480,how:'ARROWS MOVE, A BUILDS, B SWITCHES TOOL. HOUSES NEED ROADS, POWER AND JOBS NEARBY.',make(){
 const g={over:null,score:0},ck=endClock(),GW=20,GH=11,TS=16,OY=20;
 let map=[],cash=500,tool=1,cx=6,cy=6,tick=0,popn=0,jobs=0,happy=0,peak=0,ms=0,rep=0,smoke=[],msg='',mt=0,hold=0;
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)map.push({t:'',lv:0,pw:0,rd:0,hp:0,v:ri(4)});
 const M=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH?map[y*GW+x]:null;
 for(let x=1;x<GW-1;x++)M(x,5).t='R';M(1,3).t='P';M(1,3).lv=1;
 const MIL=[[60,'VILLAGE',150],[200,'TOWN',300],[450,'CITY',500],[800,'METROPOLIS',800]];
 const near=(x,y,r,t)=>{let n=0;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const m=M(x+i,y+j);if(m&&m.t===t)n+=Math.max(1,m.lv);}return n;};
 const sim=()=>{for(const m of map){m.pw=0;m.rd=0;}for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const m=M(x,y);if(m.t==='P')for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const q=M(x+i,y+j);if(q)q.pw=1;}
   if(m.t&&m.t!=='R')for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const q=M(x+d[0],y+d[1]);if(q&&q.t==='R')m.rd=1;}}
  const HP=[0,4,10,20,34],SJ=[0,6,14,24],FJ=[0,10,22,36];popn=0;jobs=0;let hs=0,hn=0;
  for(const m of map){if(m.t==='H')popn+=HP[m.lv];if(m.t==='S')jobs+=SJ[m.lv];if(m.t==='F')jobs+=FJ[m.lv];}
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const m=M(x,y),ok=m.pw&&m.rd;if(!m.t||m.t==='R'||m.t==='P'||m.t==='K')continue;
   if(m.t==='H'){const hp=cl(.62+Math.min(.4,near(x,y,3,'K')*.18)+(near(x,y,4,'S')?.1:0)-near(x,y,3,'F')*.12,0,1);m.hp=hp;hs+=hp;hn++;
    if(!ok){if(m.lv>0&&Math.random()<.2)m.lv--;}else if(m.lv===0&&Math.random()<.35)m.lv=1;else if(jobs>=popn+4&&hp>=.4&&m.lv<4&&Math.random()<.18+hp*.12)m.lv++;else if((jobs<popn*.75||hp<.3)&&m.lv>1&&Math.random()<.08)m.lv--;}
   else if(m.t==='S'){if(!ok){if(m.lv>0&&Math.random()<.2)m.lv--;}else if(m.lv<3&&near(x,y,6,'H')>=(m.lv+1)*3&&popn>=(m.lv+1)*12&&Math.random()<.2)m.lv++;}
   else if(m.t==='F'){if(!ok){if(m.lv>0&&Math.random()<.2)m.lv--;}else if(m.lv<3&&popn>=jobs*.5&&Math.random()<.2)m.lv++;}}
  happy=hn?hs/hn:0;let inc=.6+popn*.025,up=0;for(const m of map){if(m.t==='S')inc+=m.lv*.45;if(m.t==='F')inc+=m.lv*.55;if(m.t==='P')up+=.3;if(m.t==='R')up+=.005;if(m.t==='K')up+=.05;}cash=Math.max(0,Math.round((cash+inc-up)*10)/10);
  peak=Math.max(peak,popn);g.score=peak;while(ms<MIL.length&&peak>=MIL[ms][0]){cash+=MIL[ms][2];msg=MIL[ms][1]+'! +'+MIL[ms][2]+' BONUS';mt=150;S('win');A.confetti();ms++;}};
 const build=()=>{const m=M(cx,cy),tl=TOOLS[tool],cost=tl[1];if(tool===6){if(!m.t||m.t==='P'&&map.filter(q=>q.t==='P').length<=0)return S('lose');if(cash<cost)return S('lose');m.t='';m.lv=0;cash-=cost;S('hit');A.burst(cx*TS+8,OY+cy*TS+8,'#a08060',8,1.5);sim();return;}
  if(m.t)return S('lose');if(cash<cost){S('lose');pop('NEED '+cost,cx*TS+8,OY+cy*TS-4,K.r);return;}m.t='RHSFPK'[tool];m.lv=tool===0||tool===5||tool===4?1:0;cash-=cost;S('coin');A.burst(cx*TS+8,OY+cy*TS+8,tl[2],6,1.2);sim();};
 const finish=()=>{g.over=peak>=MIL[2][0]?'TIME UP - CITY COMPLETE, POP '+peak:'TIME UP - POPULATION '+peak;};
 sim();
 g.update=()=>{if(ck()){finish();return;}if(mt>0)mt--;const h=A.hit(0),k=A.in(0);
  const mv=(dx,dy)=>{cx=cl(cx+dx,0,GW-1);cy=cl(cy+dy,0,GH-1);};
  if(h.l)mv(-1,0);if(h.r)mv(1,0);if(h.u)mv(0,-1);if(h.d)mv(0,1);if(k.l||k.r||k.u||k.d){if(++hold>14&&hold%4===0)mv(k.r?1:k.l?-1:0,k.d?1:k.u?-1:0);}else hold=0;
  let tb=-1;for(let i=0;i<7;i++)if(mIn(2+i*45,202,44,26))tb=i;if(tb>=0&&clickOff()){tool=tb;S('blip');return;}
  if(A.mouse.y>=OY&&A.mouse.y<OY+GH*TS&&mAct()){cx=cl(A.mouse.x/TS|0,0,GW-1);cy=cl((A.mouse.y-OY)/TS|0,0,GH-1);}
  if(h.b){tool=(tool+1)%7;S('blip');}if(A.fire(10)&&tb<0)build();
  if(++tick%40===0)sim();
  if(tick%8===0)for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const m=M(x,y);if((m.t==='F'&&m.lv>0||m.t==='P')&&Math.random()<.3)smoke.push({x:x*TS+(m.t==='P'?5:11),y:OY+y*TS-2,t:40});}
  smoke=smoke.filter(s=>(s.y-=.3,s.x+=.15,--s.t>0));if(smoke.length>80)smoke.splice(0,smoke.length-80);};
 const house=(x,y,lv,c)=>{if(lv===0){R(x+3,y+11,10,1,'#7a6a40');R(x+7,y+4,1,7,'#7a5a3a');R(x+4,y+4,8,4,'#f2f2f2');R(x+5,y+5,6,1,'#c83a2a');return;}ell(x+8,y+14,7,2,'rgba(0,0,0,.25)');
 if(lv<=2){const hs=lv===1?[[x+2,12]]:[[x+1,7],[x+8,7]];for(const[hx,w]of hs){R(hx,y+7,w,7,'#f0e0c8');R(hx+w-2,y+7,2,7,'#c8b8a0');A.poly([[hx-1,y+7.5],[hx+w/2,y+(lv===1?1:3)],[hx+w+1,y+7.5]],c,1);R(hx+w/2-1,y+10,2,4,'#7a4a24');R(hx+1,y+9,2,2,'#7ab8f0');}return;}
 const hh=lv===3?13:20,top=y+14-hh;R(x+3,top,10,hh,lv===3?'#e8d0b0':'#c8ccd8');R(x+11,top,2,hh,lv===3?'#c0a888':'#9aa0b0');R(x+2,top-1,12,2,c);for(let j=top+3;j<y+12;j+=4)for(let i=0;i<3;i++)R(x+4+i*3,j,2,2,(i+j)%3?'#7ab8f0':'#ffe8a0');R(x+7,y+11,2,3,'#5a3a1a');};
 g.draw=()=>{A.cls('#2a5a2a');
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const m=M(x,y),px=x*TS,py=OY+y*TS;R(px,py,TS,TS,['#4a8a3a','#4e903e','#468636','#4c8c3c'][m.v]);R(px,py+15,TS,1,'rgba(0,0,0,.10)');R(px+15,py,1,TS,'rgba(0,0,0,.06)');if(!m.t){R(px+3+m.v*2,py+4+m.v,1,2,'#6ab04a');R(px+10-m.v,py+11-m.v,1,2,'#6ab04a');}
   if(m.t==='R'){R(px,py+3,TS,10,'#4a4e58');const l=M(x-1,y),r=M(x+1,y),u=M(x,y-1),dd=M(x,y+1),ud=(u&&u.t==='R')||(dd&&dd.t==='R'),lr=(l&&l.t==='R')||(r&&r.t==='R');if(ud){R(px+3,py,10,TS,'#4a4e58');}if(!lr&&ud)R(px,py+3,3,10,['#4a8a3a','#4e903e','#468636','#4c8c3c'][m.v]),R(px+13,py+3,3,10,['#4a8a3a','#4e903e','#468636','#4c8c3c'][m.v]);if(lr)for(let i=2;i<TS;i+=6)R(px+i,py+7,3,1,'#e8d870');if(ud&&!lr)for(let i=2;i<TS;i+=6)R(px+7,py+i,1,3,'#e8d870');}
   else if(m.t==='H')house(px,py,m.lv,m.hp<.4?'#a04030':'#c8503a');
   else if(m.t==='S'){if(!m.lv){R(px+3,py+9,10,1,'#7a6a40');R(px+5,py+4,6,3,'#4dabff');}else{const hh=4+m.lv*3;R(px+2,py+14-hh,12,hh,'#6a8ad0');R(px+2,py+14-hh,12,2,'#9ab8ff');R(px+2,py+10,12,2,(x+y)%2?'#ff6a6a':'#ffffff');R(px+5,py+11,6,3,'#2a3a6a');}}
   else if(m.t==='F'){if(!m.lv){R(px+3,py+9,10,1,'#7a6a40');R(px+5,py+4,6,3,'#ff9838');}else{R(px+1,py+6,14,9,'#8a8a90');A.poly([[px+1,py+6],[px+5,py+3],[px+5,py+6],[px+9,py+3],[px+9,py+6]],'#6a6a70',1);R(px+11,py+1-m.lv,3,6+m.lv,'#5a5a60');}}
   else if(m.t==='P'){ell(px+8,py+12,7,3,'#888');R(px+3,py+2,10,10,'#c8c8c0');ell(px+8,py+2,5,2,'#e8e8e0');R(px+4,py+9,8,2,'#ffcf3f');}
   else if(m.t==='K'){C(px+5,py+6,4,'#2a7a2a');C(px+11,py+9,4,'#2f8a2f');R(px+4,py+9,2,4,'#5a3a1a');C(px+8,py+12,1.5,'#ff8ac8');}
   if(m.t&&m.t!=='R'&&m.t!=='P'&&m.t!=='K'&&(!m.pw||!m.rd)&&A.t%40<24){if(!m.pw)A.poly([[px+9,py],[px+5,py+5],[px+8,py+5],[px+6,py+9],[px+11,py+3],[px+8,py+3]],K.y,1);else T('R',px+12,py,K.r,1);}}
  smoke.forEach(s=>ga(s.t/60,()=>C(s.x,s.y,2+(40-s.t)/12,'#d0d0d0')));
  // power radius preview + cursor
  if(tool===4)ga(.15,()=>R((cx-6)*TS,OY+(cy-6)*TS,13*TS,13*TS,K.y));const ok=!M(cx,cy).t||tool===6;rrs(cx*TS+.5,OY+cy*TS+.5,TS-1,TS-1,2,ok?K.w:K.r,1.5);
  // hud
  R(0,0,W,20,'#14201a');T('CASH '+Math.floor(cash),4,3,K.y,1);T('POP '+popn,4,12,K.g,1);T('JOBS '+jobs,70,12,K.c,1);T('HAPPY '+Math.round(happy*100)+'%',70,3,happy<.45?K.r:'#c8ffc8',1);
  const nx=MIL[Math.min(ms,MIL.length-1)];T(ms<MIL.length?'NEXT: '+nx[1]+' AT '+nx[0]:'METROPOLIS REACHED',316,3,K.w,1,'r');T('PEAK '+peak,316,12,'#a8d0b8',1,'r');
  R(0,196,W,44,'#14201a');TOOLS.forEach((tl,i)=>{const x=2+i*45,on=i===tool;rrf(x,202,44,26,4,on?'#2a4a3a':'#1a2a22');rrs(x+.5,202.5,43,25,4,on?K.y:'#3a5a4a',1);R(x+4,206,6,6,tl[2]);T(tl[0].slice(0,5),x+26,206,on?K.y:K.w,1,'c');T(''+tl[1],x+22,217,cash>=tl[1]?'#9fd8b0':K.r,1,'c');});
  T(mt?msg:'A BUILD  B NEXT TOOL  HOLD A TO PAINT ROADS',160,231,mt?K.y:'#8ab09a',1,'c');};
 return g;}});

/* =================== PIZZA MAKER =================== */
const TOP_=[['SAUCE','#c8281e'],['CHEESE','#f6d860'],['PEPPERONI','#a8281e'],['MUSHROOM','#d8c8a8'],['PEPPER','#3a9a3a'],['OLIVE','#222222'],['ONION','#e8d8f0'],['BIN','#555555']],DN=[['LIGHT',30,50],['MEDIUM',50,70],['WELL DONE',70,88]];
A.add({id:'pizzamaker',name:'PIZZA MAKER',cat:'SIM',time:480,how:'LEFT/RIGHT TOPPING, A ADDS. UP/DOWN PICKS THE ORDER. B PUTS PIZZA IN OR TAKES IT OUT.',make(){
 const g={over:null,score:0},ck=endClock(),DAYS=5,DAYLEN=3900,GOAL=900;
 let day=0,dt=0,orders=[],pz=null,oven=null,sel=0,osel=0,deliv=[],cash=0,earned=0,nextO=60,ph='work',shopSel=0,lvl={oven:0,scoot:0,sign:0,prem:0},stars=3,nid=1,dayEarn=0,missed=0,heat=0;
 const SH=[['BIG OVEN','oven',[70,150,260],'BAKES FASTER'],['SCOOTER','scoot',[60,130,220],'DELIVERS FASTER'],['NEON SIGN','sign',[90,190],'MORE ORDERS, +2 PRICE'],['PREMIUM','prem',[140],'+4 PER PIZZA']];
 const newPz=()=>{pz={tp:[0,0,0,0,0,0,0],bits:[],bake:0,oid:orders[osel]?orders[osel].id:0};};
 const newOrder=()=>{const nx=Math.min(4,1+ri(2+day));const ex=shuf([2,3,4,5,6]).slice(0,ri(nx+1));const want=[0,1].filter(()=>Math.random()<.92).concat(ex);if(!want.length)want.push(1);const lim=Math.max(1500,2700-day*180);
  orders.push({id:nid++,want,dn:ri(3),t:lim,max:lim,price:8+ex.length*2+lvl.sign*2+lvl.prem*4,who:ri(6)});};
 const pay=(o,p)=>{let miss=0,extra=0;for(let k=0;k<7;k++){const w=o.want.includes(k);if(w&&!p.tp[k])miss++;if(!w&&p.tp[k])extra++;}const ts=cl(1-.3*(miss+extra),0,1),d=DN[o.dn],b=p.bake;const bs=b>94?.1:b>=d[1]&&b<=d[2]?1:Math.min(Math.abs(b-d[1]),Math.abs(b-d[2]))<=10?.6:.3;
  const q=ts*bs;return{amt:Math.max(1,Math.round(o.price*q+o.price*.5*q*(o.t/o.max))),q};};
 const finishDay=()=>{ph='shop';shopSel=0;S('win');};
 const finish=()=>{g.score=earned;g.over=earned>=GOAL?'SHOP CLOSED - PIZZA EMPIRE COMPLETE! '+earned:'SHOP CLOSED - EARNED '+earned;};
 newOrder();newPz();
 g.update=()=>{if(ck()){finish();return;}const h=A.hit(0);
  if(ph==='shop'){let hov=-1;for(let k=0;k<4;k++)if(mIn(40,64+k*28,240,24))hov=k;if(hov>=0&&mAct())shopSel=hov;if(h.u)shopSel=(shopSel+3)%4;if(h.d)shopSel=(shopSel+1)%4;
   if(h.a){const s=SH[shopSel],lv=lvl[s[1]],c=s[2][lv];if(c!==undefined&&cash>=c){cash-=c;lvl[s[1]]++;S('coin');A.burst(160,76+shopSel*28,K.y,16,2);}else S('lose');}
   if(h.b||(mIn(110,184,100,18)&&clickOff())){day++;if(day>=DAYS){finish();return;}dt=0;orders=[];deliv=[];oven=null;newOrder();newPz();nextO=90;dayEarn=0;ph='work';}return;}
  dt++;if(dt>=DAYLEN&&!deliv.length){finishDay();return;}
  if(dt<DAYLEN&&--nextO<=0){if(orders.length<3)newOrder();nextO=Math.max(260,620-day*60-lvl.sign*80)+ri(200);}
  if(!orders.length&&dt<DAYLEN-600)newOrder();
  orders.forEach(o=>o.t--);for(const o of orders.filter(o=>o.t<=0&&!o.out)){missed++;stars=Math.max(0,stars-.5);pop('ORDER CANCELLED',160,70,K.r);S('lose');}orders=orders.filter(o=>o.t>0||o.out);
  osel=cl(osel,0,Math.max(0,orders.length-1));
  // input
  let hov=-1;for(let k=0;k<8;k++)if(mIn(4+k*39,200,37,36))hov=k;if(hov>=0&&mAct())sel=hov;let oh=-1;orders.forEach((o,k)=>{if(!o.out&&mIn(4+k*105,4,100,52))oh=k;});if(oh>=0&&clickOff())osel=oh;
  if(h.l){sel=(sel+7)%8;S('blip');}if(h.r){sel=(sel+1)%8;S('blip');}const live=orders.filter(o=>!o.out);if((h.u||h.d)&&live.length){let k=orders.indexOf(orders[osel]);for(let n=0;n<3;n++){k=(k+(h.d?1:orders.length-1))%orders.length;if(!orders[k].out)break;}osel=k;S('blip');}
  if(pz&&orders[osel])pz.oid=orders[osel].id;
  if(h.a&&hov===sel||h.a&&!clickOff()){if(sel===7){if(pz&&pz.tp.some(x=>x)){newPz();S('lose');pop('BINNED',100,110,K.gr);}}else if(pz){pz.tp[sel]++;S('hit');const n=sel<2?0:5+ri(3);for(let i=0;i<n;i++){const a=rnd(6.28),r=rnd(26);pz.bits.push([sel,Math.cos(a)*r,Math.sin(a)*r,rnd(6.28)]);}A.burst(100,118,TOP_[sel][1],6,1.5);}}
  if(h.b||(mIn(196,72,90,90)&&clickOff())){if(oven){const o=orders.find(q=>q.id===oven.oid&&!q.out)||orders.find(q=>!q.out);if(o){o.out=true;deliv.push({o,p:oven,t:0,dur:Math.round(170/(1+lvl.scoot*.45))});S('coin');}else{pop('NO ORDER FOR IT',240,60,K.r);S('lose');}oven=null;}else if(pz&&pz.tp.some(x=>x)){oven=pz;oven.oid=orders[osel]?orders[osel].id:0;newPz();S('blip');}}
  if(oven){oven.bake+=.3*(1+lvl.oven*.45);if(oven.bake>100)oven.bake=100;}heat+=(oven?1:-1)*.05;heat=cl(heat,0,1);
  for(const d of deliv){d.t++;if(d.t>=d.dur){const r=pay(d.o,d.p);cash+=r.amt;earned+=r.amt;dayEarn+=r.amt;g.score=earned;stars=cl(stars+(r.q>.8?.15:r.q<.4?-.25:0),0,5);pop('+'+r.amt+(r.q>.9?' PERFECT':''),250,186,r.q>.8?K.y:K.w);S(r.q>.8?'score':'blip');orders=orders.filter(o=>o!==d.o);}}deliv=deliv.filter(d=>d.t<d.dur);};
 const pizza=(x,y,r,p,bk)=>{const b=bk===undefined?0:bk,crust=A.mix('#f0d090','#5a2a10',Math.min(1,b/110));C(x,y,r,crust);C(x,y,r*.86,A.mix('#f6e2b0','#c08040',Math.min(1,b/120)));
  if(p.tp[0])C(x,y,r*.8,A.mix('#d0301e','#6a1a10',b/160));if(p.tp[1]){ell(x,y,r*.74,r*.72,A.mix('#ffe070','#c08020',b/130));for(let k=0;k<5;k++)C(x+Math.cos(k*1.3)*r*.4,y+Math.sin(k*1.3)*r*.4,r*.12,A.mix('#fff0a0','#d09030',b/130));}
  const s=r/36;for(const bt of p.bits){const bx=x+bt[1]*s,by=y+bt[2]*s,k=bt[0];if(k===2)C(bx,by,4*s,'#a8281e');else if(k===3){C(bx,by,3*s,'#d8c8a8');R(bx-.5,by,1.5*s,3*s,'#c0b090');}else if(k===4)R(bx-3*s,by-1,6*s,2*s,'#3a9a3a');else if(k===5){C(bx,by,2.4*s,'#222');C(bx,by,1*s,'#666');}else if(k===6)A.ring(bx,by,2.6*s,'#e8d8f0');}};
 g.draw=()=>{A.cls('#f4e0c0');R(0,60,W,140,lg(0,60,0,200,['#e8c898','#c8a070']));for(let x=0;x<W;x+=20)for(let y=60;y<196;y+=20)if((x+y)%40===0)R(x,y,20,20,'rgba(0,0,0,.05)');
  // tickets
  orders.forEach((o,k)=>{const x=4+k*105,on=k===osel&&!o.out;rrf(x,4,100,52,3,o.out?'#d8d0c0':'#fffdf4');rrs(x+.5,4.5,99,51,3,on?K.r:'#b8a888',on?2:1);T('ORDER '+o.id,x+4,8,'#333',1);T(''+o.price,x+96,8,'#2a8a3a',1,'r');
   o.want.forEach((w,j)=>{const ix=x+8+j*14,iy=26;C(ix,iy,5,TOP_[w][1]);if(w===5)C(ix,iy,2,'#666');});T(DN[o.dn][0],x+4,36,['#c89040','#a05020','#5a2a10'][o.dn],1);
   if(o.out)T('ON ITS WAY',x+50,46,'#2a6a3a',1,'c');else{const f=o.t/o.max;R(x+4,47,92,4,'#ddd');R(x+4,47,92*f,4,f<.3?K.r:f<.6?K.o:K.g);}});
  // prep table
  ell(100,166,70,18,'rgba(0,0,0,.2)');R(30,120,140,40,'#b88a5a');ell(100,120,70,16,'#d8b080');if(pz)pizza(100,116,40,pz,0);T('PREP',100,168,'#6a4a2a',1,'c');
  // oven
  rrf(196,64,104,112,8,'#8a4a32');for(let y=68;y<174;y+=8)for(let x=198+((y/8|0)%2)*6;x<298;x+=12)R(x,y,10,6,'#a85a3a');rrf(210,90,76,60,30,'#1a0a06');ga(.25+heat*.5,()=>ell(248,140,34,10,'#ff7a20'));
  if(oven){ga(1,()=>pizza(248,128,22,oven,oven.bake));const tg=orders.find(o=>o.id===oven.oid);R(288,66,8,104,'#222');const fz=b=>66+104*(1-b/100);if(tg){const d=DN[tg.dn];R(288,fz(d[2]),8,fz(d[1])-fz(d[2]),'#3dff8b');}R(286,fz(oven.bake)-1,12,3,oven.bake>94?K.r:K.y);if(oven.bake>94&&A.t%10<5)for(let k=0;k<2;k++)C(248+rnd(30)-15,90-rnd(10),3,'#555');}
  T('OVEN',248,156,'#ffd8a8',1,'c');
  // delivery strip
  R(0,178,W,20,'#4a4e58');for(let x=0;x<W;x+=20)R(x+(dt%20),187,10,2,'#e8d870');deliv.forEach(d=>{const x=10+300*d.t/d.dur;R(x-8,180,16,8,K.r);C(x-6,190,3,'#222');C(x+6,190,3,'#222');R(x-2,176,8,6,'#f0c040');});
  // bins
  TOP_.forEach((tp,k)=>{const x=4+k*39,on=k===sel;rrf(x,200,37,36,4,on?'#fff3c0':'#8a6a4a');rrs(x+.5,200.5,36,35,4,on?K.r:'#5a3a1a',1);if(k<7){C(x+18,213,8,tp[1]);if(k===5)C(x+18,213,3,'#666');}else{R(x+12,206,14,14,'#666');R(x+10,205,18,2,'#888');}T(tp[0].slice(0,6),x+18,226,on?'#5a1a1a':'#f4e0c0',1,'c');});
  // hud
  T('DAY '+(day+1)+'/'+DAYS,4,60,'#5a3a1a',1);const left=Math.max(0,DAYLEN-dt);T(dt>=DAYLEN?'LAST DELIVERIES':(left/3600|0)+':'+String((left/60|0)%60).padStart(2,'0'),4,68,'#5a3a1a',1);T('CASH '+cash,316,60,'#2a6a2a',1,'r');for(let i=0;i<5;i++)C(8+i*9,80,3,stars>=i+.5?'#f0b020':'#c8b090');
  if(ph==='shop'){A.c.fillStyle='rgba(20,10,5,.85)';A.c.fillRect(0,0,W,H);T('DAY '+(day+1)+' DONE',160,24,K.y,2,'c');T('EARNED '+dayEarn+'   CASH '+cash,160,44,K.w,1,'c');
   SH.forEach((s,k)=>{const lv=lvl[s[1]],c=s[2][lv],on=k===shopSel;rrf(40,64+k*28,240,24,4,on?'#5a3a1a':'#2a1a10');rrs(40.5,64.5+k*28,239,23,4,on?K.y:'#5a4030',1);T(s[0]+' '+'*'.repeat(lv),48,68+k*28,on?K.y:K.w,1);T(s[3],48,78+k*28,'#c8a888',1);T(c===undefined?'MAX':''+c,272,72+k*28,c!==undefined&&cash>=c?K.g:'#a07050',1,'r');});
   rrf(110,184,100,18,4,'#2a6a3a');T('B: NEXT DAY',160,190,K.w,1,'c');T('UP/DOWN PICK  A BUY',160,210,K.gr,1,'c');}};
 return g;}});

/* =================== ANT FARM =================== */
A.add({id:'antfarm',name:'ANT FARM',cat:'SIM',time:420,how:'ARROWS MOVE, A MARKS SOIL TO DIG. DIG ROOMS TO GROW. B HATCHES A SOLDIER FOR 8 FOOD.',make(){
 const g={over:null,score:0},ck=endClock(),GW=40,GH=22,CS=8,OY=56,SY=51,EX=6,RX=34;
 const N=GW*GH,dug=new Uint8Array(N),mark=new Uint8Array(N),rock=new Uint8Array(N),riv=new Uint8Array(N),tex=new Float32Array(N);let dQ=new Int16Array(N),dE=new Int16Array(N),dD=new Int16Array(N);
 const I=(x,y)=>y*GW+x,ok=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH;
 for(let i=0;i<N;i++){tex[i]=rnd(1);if(Math.random()<.022&&(i/GW|0)>2)rock[i]=1;}
 for(let y=0;y<6;y++)dug[I(EX,y)]=1;for(let y=5;y<8;y++)for(let x=EX-2;x<=EX+3;x++)dug[I(x,y)]=1;
 for(let y=0;y<5;y++){dug[I(RX,y)]=1;riv[I(RX,y)]=1;}for(let y=4;y<7;y++)for(let x=RX-2;x<=RX+3;x++){dug[I(x,y)]=1;riv[I(x,y)]=1;}for(let i=0;i<N;i++)if(dug[i])rock[i]=0;
 const QX=EX+1,QY=6,soil=[];let terr=null,tDirty=true,food=12,ants=[],eggs=[],items=[],qhp=150,rivalS=30,wave=0,nextWave=4200,layT=0,gath=0,kills=0,curX=EX+4,curY=9,hold=0,msg='',mt=0;
 const bfs=(out,src)=>{out.fill(-1);const q=[];for(const s of src){out[s]=0;q.push(s);}for(let h=0;h<q.length;h++){const c=q[h],x=c%GW,y=c/GW|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+d[0],ny=y+d[1];if(!ok(nx,ny))continue;const n=I(nx,ny);if(dug[n]&&!riv[n]&&out[n]<0){out[n]=out[c]+1;q.push(n);}}}};
 const front=()=>{const s=[];for(let i=0;i<N;i++){if(!dug[i]||riv[i])continue;const x=i%GW,y=i/GW|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+d[0],ny=y+d[1];if(ok(nx,ny)&&mark[I(nx,ny)]){s.push(i);break;}}}return s;};
 const refresh=()=>{tDirty=true;bfs(dQ,[I(QX,QY)]);bfs(dE,[I(EX,0)]);bfs(dD,front());};
 refresh();
 const dugN=()=>{let n=0;for(let i=0;i<N;i++)if(dug[i]&&!riv[i])n++;return n;};
 const cap=()=>4+Math.floor(dugN()/4);
 const mine=()=>ants.filter(a=>a.ty!=='r');
 const spawn=(ty,x,y)=>{ants.push({ty,cx:x,cy:y,px:x*CS+4,py:OY+y*CS+4,hp:ty==='s'?70:ty==='r'?24+wave*3:20,job:'idle',carry:0,dig:0,tx:0,sx:0});};
 for(let k=0;k<5;k++)spawn('w',QX,QY);
 const step=(a,field,dir)=>{const x=a.cx,y=a.cy,c=field[I(x,y)];let best=null;const opts=[];for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+d[0],ny=y+d[1];if(!ok(nx,ny))continue;const v=field[I(nx,ny)];if(v<0)continue;if(dir<0?v<c:dir>0?v>c:true)opts.push([nx,ny]);}if(opts.length)best=opts[ri(opts.length)];return best;};
 const moveTo=(a,tx,ty,sp)=>{const dx=tx-a.px,dy=ty-a.py,d=Math.hypot(dx,dy);if(d<=sp){a.px=tx;a.py=ty;return true;}a.px+=dx/d*sp;a.py+=dy/d*sp;return false;};
 const nearestFoe=a=>{let b=null,bd=1e9;for(const o of ants){if((o.ty==='r')===(a.ty==='r')||o.hp<=0)continue;const d=Math.hypot(o.px-a.px,o.py-a.py);if(d<bd){bd=d;b=o;}}return[b,bd];};
 const assign=a=>{if(a.ty!=='w')return;const diggers=ants.filter(o=>o.job==='dig').length,ws=ants.filter(o=>o.ty==='w').length;let fr=false;for(let i=0;i<N;i++)if(dD[i]>=0&&dD[i]<999){fr=true;break;}
  if(fr&&mark.some(v=>v)&&diggers<Math.max(1,Math.ceil(ws/3)))a.job='dig';else if(items.length)a.job='forage';else a.job='wander';};
 const finish=()=>{g.over='SEASON ENDS - COLONY OF '+mine().length+(rivalS<=0?' - RIVALS BEATEN, WIN':'');};
 g.update=()=>{if(ck()){finish();return;}if(mt>0)mt--;const h=A.hit(0),k=A.in(0);
  const mv=(dx,dy)=>{curX=cl(curX+dx,0,GW-1);curY=cl(curY+dy,0,GH-1);};if(h.l)mv(-1,0);if(h.r)mv(1,0);if(h.u)mv(0,-1);if(h.d)mv(0,1);if(k.l||k.r||k.u||k.d){if(++hold>14&&hold%4===0)mv(k.r?1:k.l?-1:0,k.d?1:k.u?-1:0);}else hold=0;
  if(A.mouse.y>=OY&&mAct()){curX=cl(A.mouse.x/CS|0,0,GW-1);curY=cl((A.mouse.y-OY)/CS|0,0,GH-1);}
  if(A.fire(8)){const i=I(curX,curY);if(dug[i]||rock[i]||curX>=RX-5)S('lose');else{mark[i]^=1;S('blip');bfs(dD,front());}}
  if(h.b){if(food>=8&&mine().length<cap()){food-=8;spawn('s',QX,QY);S('coin');pop('SOLDIER!',QX*CS,OY+QY*CS-10,K.r);}else{S('lose');pop(food<8?'NEED 8 FOOD':'DIG MORE ROOM',QX*CS+30,OY+QY*CS-10,K.r);}}
  // spawning
  if(A.t%200===0&&items.length<4){const x=20+rnd(200);items.push({x,n:3+ri(5),k:ri(3)});}
  if(++layT>=150){layT=0;if(food>=5&&mine().length+eggs.length<cap()){food-=5;eggs.push({x:QX*CS+rnd(20)-14,y:OY+QY*CS+2+rnd(6),t:300});}}
  for(const e of eggs)if(--e.t<=0){spawn('w',QX,QY);}eggs=eggs.filter(e=>e.t>0);
  if(--nextWave<=0&&rivalS>0){wave++;const n=Math.min(rivalS,2+wave);for(let j=0;j<n;j++){spawn('r',RX,0);const a=ants[ants.length-1];a.py=SY;a.cy=-1;a.px=RX*CS+4+j*6;}rivalS-=n;nextWave=3000;msg='RIVAL RAID! '+n+' RED ANTS';mt=160;S('boom');}
  // ants
  for(const a of ants){if(a.hp<=0)continue;const[f,fd]=nearestFoe(a);
   if(f&&fd<7){const dmg=a.ty==='s'?1.1:a.ty==='r'?.35:.3;f.hp-=dmg;if(A.t%10===0)A.burst((a.px+f.px)/2,(a.py+f.py)/2,'#ffffff',1,1);continue;}
   const sp=a.ty==='s'?.75:a.ty==='r'?.55:.7;
   // surface walking
   if(a.cy<0){let tx=a.ty==='r'?EX*CS+4:a.carry?EX*CS+4:a.sx;if(a.ty==='s')tx=f&&f.cy<0?f.px:EX*CS+4;if(moveTo(a,tx,SY,sp)){if(a.ty==='w'&&!a.carry&&a.job==='forage'){const it=items.find(i=>Math.abs(i.x-a.px)<4);if(it){it.n--;a.carry=1;}else{a.job='idle';}if(a.carry===0)a.sx=EX*CS+4;}else if(Math.abs(a.px-(EX*CS+4))<1){a.cy=0;a.cx=EX;a.tx=0;}}
    if(a.ty==='w'&&a.job==='forage'&&!a.carry){const it=items.find(i=>i.n>0);if(it)a.sx=it.x;else a.carry=0,a.sx=EX*CS+4;}continue;}
   const tx=a.cx*CS+4,ty=OY+a.cy*CS+4;if(!moveTo(a,tx,ty,sp))continue;
   const here=I(a.cx,a.cy);let nx=null;
   if(a.ty==='r'){if(dQ[here]===0){qhp-=.25;a.hp-=.4;if(A.t%12===0)A.burst(a.px,a.py,K.r,2,1);continue;}nx=step(a,dQ,-1);}
   else if(a.ty==='s'){const inv=ants.some(o=>o.ty==='r'&&o.hp>0);if(inv&&f){if(f.cy<0||dE[here]>=0&&f.py<a.py-2){if(dE[here]===0){a.cy=-1;a.py=SY;continue;}nx=step(a,dE,-1);}else{let b=null,bd=1e9;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const qx=a.cx+d[0],qy=a.cy+d[1];if(!ok(qx,qy)||!dug[I(qx,qy)]||riv[I(qx,qy)])continue;const dd=Math.hypot(qx*CS+4-f.px,OY+qy*CS+4-f.py);if(dd<bd){bd=dd;b=[qx,qy];}}nx=b;}}else nx=dQ[here]>4?step(a,dQ,-1):Math.random()<.3?step(a,dQ,0):null;}
   else{if(a.job==='idle')assign(a);
    if(a.carry){if(dQ[here]===0){a.carry=0;food++;gath++;g.score=gath+kills*5;a.job='idle';S('coin');continue;}nx=step(a,dQ,-1);}
    else if(a.job==='forage'){if(!items.length){a.job='idle';continue;}if(dE[here]===0){a.cy=-1;a.py=SY;const it=items[ri(items.length)];a.sx=it.x;continue;}nx=step(a,dE,-1);}
    else if(a.job==='dig'){if(dD[here]<0){a.job='idle';continue;}if(dD[here]===0){let t=null;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const qx=a.cx+d[0],qy=a.cy+d[1];if(ok(qx,qy)&&mark[I(qx,qy)]){t=[qx,qy];break;}}if(!t){a.job='idle';continue;}if(++a.dig>=26){a.dig=0;const ti=I(t[0],t[1]);dug[ti]=1;mark[ti]=0;refresh();A.burst(t[0]*CS+4,OY+t[1]*CS+4,'#8a5a30',5,1);for(const o of ants)if(o.job==='dig')o.job='idle';}else if(A.t%6===0)A.burst(t[0]*CS+4,OY+t[1]*CS+4,'#6a4020',1,.8);continue;}nx=step(a,dD,-1);}
    else{nx=Math.random()<.5?step(a,dQ,0):null;if(Math.random()<.02)a.job='idle';}}
   if(nx){a.cx=nx[0];a.cy=nx[1];}}
  for(const a of ants)if(a.hp<=0){A.burst(a.px,a.py,a.ty==='r'?K.r:'#3a2a1a',6,1.2);if(a.ty==='r'){kills++;g.score=gath+kills*5;}}
  ants=ants.filter(a=>a.hp>0);items=items.filter(i=>i.n>0);
  if(qhp<=0){g.over='THE QUEEN HAS FALLEN - '+gath+' FOOD GATHERED';return;}
  if(rivalS<=0&&!ants.some(a=>a.ty==='r')){g.score+=200;g.over='RIVAL NEST DEFEATED - VICTORY!';return;}
  if(!mine().length&&!eggs.length&&food<5){g.over='THE COLONY DIED OUT';}};
 const ant=(x,y,col,s,carry,f)=>{const w=Math.sin(A.t*.5+x)*.8*s;L(x-2*s,y-1*s+w,x+2*s,y+1*s-w,'#000',.6);L(x-2*s,y+1*s-w,x+2*s,y-1*s+w,'#000',.6);C(x-2.2*s,y,1.6*s,col);C(x,y,1.1*s,col);C(x+2*s*(f||1),y-.3*s,1.2*s,col);if(carry)C(x+2*s,y-2.5*s,1.6,'#5ad040');};
 g.draw=()=>{A.cls('#7ac8f0');R(0,20,W,32,lg(0,20,0,52,['#8ad0f8','#c8ecff']));C(150,30,8,'#fff4b0');R(0,48,W,8,'#4aa03a');for(let x=0;x<W;x+=3)R(x,46+((x*7)%3),1,3,'#3a8a2a');
  const soilDraw=()=>{for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=I(x,y),px=x*CS,py=OY+y*CS;if(dug[i]){R(px,py,CS,CS,riv[i]?'#3a1410':'#2a170c');}else{if(!soil[i])soil[i]=A.mix('#8a5a30','#5a3418',Math.min(1,y/GH+tex[i]*.15));R(px,py,CS,CS,soil[i]);if(tex[i]>.8)R(px+2,py+3,1,1,'#a07040');if(rock[i]){const o=tex[i]*3;A.poly([[px+1,py+4+o*.3],[px+3+o*.4,py+1],[px+7,py+2+o*.5],[px+7.5,py+6],[px+4,py+7.5],[px+1.5,py+6.5]],'#7a7a82',1);R(px+3,py+2.5,2,1,'#b0b0b8');}if(x>=RX-5)R(px,py,CS,CS,'rgba(120,20,10,.18)');}}};
  if(typeof document!=='undefined'&&document.createElement){if(!terr){terr=document.createElement('canvas');terr.width=W*2;terr.height=GH*CS*2;}if(tDirty){const cx=terr.getContext('2d');cx.setTransform(2,0,0,2,0,-OY*2);cx.clearRect(0,OY,W,GH*CS);const sv=A.c;A.c=cx;try{soilDraw();}finally{A.c=sv;}tDirty=false;}A.c.drawImage(terr,0,OY,W,GH*CS);}else soilDraw();
  if((A.t>>3)%2)for(let i=0;i<N;i++)if(mark[i])A.box((i%GW)*CS+1,OY+(i/GW|0)*CS+1,CS-2,CS-2,K.y);
  // entrance mounds
  ell(EX*CS+4,52,9,3,'#7a4a24');ell(RX*CS+4,52,9,3,'#7a2a1a');
  items.forEach(it=>{const c=['#5ad040','#f0d070','#e05030'][it.k];for(let k=0;k<Math.min(it.n,5);k++)C(it.x+k*2-4,49-(k%2),2.4,c);});
  // queen + eggs
  ant(QX*CS+4,OY+QY*CS+4,'#4a2a10',2.2);ga(qhp/150*.6+.2,()=>C(QX*CS+10,OY+QY*CS-4,1.5,'#ffcf3f'));eggs.forEach(e=>ell(e.x,e.y,1.6,2.2,'#f8f4e8'));
  for(const a of ants)ant(a.px,a.py,a.ty==='r'?'#d02a1a':a.ty==='s'?'#6a1a08':'#1a1008',a.ty==='s'?1.4:1,a.carry);
  // rival nest marker
  T('RIVAL NEST',RX*CS+4,24,'#a02010',1,'c');R(RX*CS-16,32,40,4,'#2a0a0a');R(RX*CS-16,32,40*rivalS/30,4,K.r);
  // cursor
  rrs(curX*CS-.5,OY+curY*CS-.5,CS+1,CS+1,1,K.w,1);
  R(0,0,W,20,'#2a1a10');T('FOOD '+food,4,3,'#9fe870',1);T('ANTS '+mine().length+'/'+cap(),4,12,K.w,1);T('SOLDIERS '+ants.filter(a=>a.ty==='s').length,74,3,'#ff9a8a',1);T('QUEEN',74,12,K.y,1);R(98,12,40,5,'#000');R(98,12,40*Math.max(0,qhp)/150,5,qhp<50?K.r:K.y);
  T('SCORE '+g.score,316,3,K.y,1,'r');T(mt?msg:nextWave<600&&rivalS>0?'RAID INCOMING!':'GATHERED '+gath,316,12,mt||nextWave<600?K.r:'#d8c0a0',1,'r');};
 return g;}});

/* =================== MARS COLONY =================== */
const MB=[{n:'SOLAR',c:20,pw:7,col:'#4dabff',d:'+7 POWER IN DAYLIGHT'},{n:'DRILL',c:25,pw:-2,w:2.4,col:'#2fd6c3',d:'ICE TO +2.4 WATER'},{n:'OXYGEN',c:30,pw:-3,w:-1,o:3.4,col:'#9fe8ff',d:'WATER TO +3.4 OXYGEN'},{n:'FARM',c:35,pw:-2,w:-1.2,f:2.8,o:.6,col:'#3dff8b',d:'+2.8 FOOD, +0.6 O2'},{n:'MINE',c:30,pw:-2,m:1.3,col:'#ff9838',d:'+1.3 METAL'},{n:'DOME',c:60,pw:-1,cap:4,col:'#e8e8ff',d:'+4 CREW, +3 BUILD PLOTS'},{n:'REACTOR',c:130,pw:9,col:'#ffcf3f',d:'+9 POWER DAY AND NIGHT'}];
A.add({id:'marscolony',name:'MARS COLONY',cat:'SIM',time:480,how:'LEFT/RIGHT PICK A MODULE, A BUILDS, B SWITCHES THAT TYPE OFF/ON. KEEP O2, WATER, FOOD UP.',make(){
 const g={over:null,score:0},ck=endClock(),SOL=2400,STO=120;
 const BMAX=300;let res={o:60,w:50,f:50,m:70},bat=220,crew=4,blds=[0,0,1,2,3],off=[0,0,0,0,0,0,0],sel=0,t=0,sol=1,storm=0,stormIn=4000+ri(2000),ship=2400,growT=0,dieT=0,net={o:0,w:0,f:0,m:0,p:0},flash='',ft=0,rocket=null,walkers=[],peak=4,brown=1;
 const slots=()=>Math.min(16,6+blds.filter(b=>b===5).length*3),capN=()=>6+blds.filter(b=>b===5).length*4;
 const dayF=()=>{const p=(t%SOL)/SOL;return p<.6?Math.min(1,Math.sin(p/.6*3.1416)*1.6):0;};
 for(let i=0;i<8;i++)walkers.push({x:rnd(300)+10,v:rnd(.4)+.2,d:Math.random()<.5?1:-1});
 const finish=()=>{g.over=crew>=14?'MISSION COMPLETE - '+crew+' COLONISTS ON SOL '+sol:'MISSION ENDS - '+crew+' COLONISTS ON SOL '+sol;};
 const tick=()=>{const df=dayF()*(storm>0?.3:1);let sup=0,dem=0;blds.forEach(b=>{if(off[b])return;const B=MB[b];if(B.pw>0)sup+=B.n==='SOLAR'?B.pw*df:B.pw;else dem-=B.pw;});
  const pw=sup-dem;if(pw>=0){bat=Math.min(BMAX,bat+pw);brown=1;}else{const use=Math.min(bat,-pw);bat-=use;brown=dem?cl((sup+use)/dem,0,1):1;}
  const d={o:-crew*.32,w:-crew*.22,f:-crew*.2,m:0};blds.forEach(b=>{if(off[b])return;const B=MB[b];let e=B.pw<0?brown:1;for(const k of['o','w','f','m'])if(B[k]<0&&res[k]<=.5)e=0;if(e>0)for(const k of['o','w','f','m'])if(B[k])d[k]+=B[k]*e;});
  for(const k of['o','w','f','m']){res[k]=cl(res[k]+d[k],0,k==='m'?999:STO);net[k]=d[k];}net.p=sup-dem;
  if(++growT>=12){growT=0;if(crew<capN()&&res.o>30&&res.w>30&&res.f>30){crew++;g.score+=5;pop('NEW COLONIST',160,90,K.g);S('coin');}}
  const starve=res.o<=0?3:res.w<=0?5:res.f<=0?8:0;if(starve){if(++dieT>=starve){dieT=0;crew--;flash=res.o<=0?'NO OXYGEN!':res.w<=0?'NO WATER!':'NO FOOD!';ft=90;S('lose');A.shake=4;}}else dieT=0;peak=Math.max(peak,crew);};
 g.update=()=>{if(ck()){finish();return;}t++;if(ft>0)ft--;const h=A.hit(0);
  let hov=-1;for(let k=0;k<7;k++)if(mIn(2+k*45,200,44,30))hov=k;if(hov>=0&&mAct())sel=hov;
  if(h.l){sel=(sel+6)%7;S('blip');}if(h.r){sel=(sel+1)%7;S('blip');}
  if(h.a&&!(clickOff()&&hov<0)){const B=MB[sel];if(res.m<B.c){S('lose');pop('NEED '+B.c+' METAL',160,180,K.r);}else if(blds.length>=16||(sel===5&&blds.filter(b=>b===5).length>=4)){S('lose');pop('NO ROOM LEFT',160,180,K.r);}else if(sel!==5&&blds.length>=slots()){S('lose');pop('BUILD A DOME FIRST',160,180,K.r);}else{res.m-=B.c;blds.push(sel);S('coin');A.burst(160,150,B.col,16,2);pop(B.n+' BUILT',160,180,B.col);}}
  if(h.b){off[sel]^=1;S('blip');pop(MB[sel].n+(off[sel]?' OFF':' ON'),160,180,off[sel]?K.r:K.g);}
  if(t%60===0)tick();if(t%SOL===0){sol++;g.score+=crew*10;pop('SOL '+sol,160,60,K.y);}
  if(storm>0)storm--;else if(--stormIn<=0){storm=900+ri(600);stormIn=3600+ri(2400);flash='DUST STORM! SOLAR DOWN';ft=150;S('boom');}
  if(--ship<=0){ship=3000;rocket={y:-40,t:0};}if(rocket){rocket.t++;rocket.y=Math.min(130,rocket.y+2.2-rocket.t*.008);if(rocket.t===90){res.m+=40;const n=Math.min(3,capN()-crew);crew+=Math.max(0,n);flash='SUPPLY SHIP: +40 METAL'+(n>0?', +'+n+' CREW':'');ft=150;S('win');}if(rocket.t>200)rocket=null;}
  walkers.forEach(w=>{w.x+=w.v*w.d;if(w.x<10||w.x>310)w.d*=-1;});
  if(crew<=0){g.over='COLONY LOST ON SOL '+sol;}};
 const bpos=i=>{const row=i<8?0:1,k=i%8;return[24+k*38+(row?19:0),row?188:156];};
 const drawB=(b,x,y,on)=>{const B=MB[b],dim=on?1:.45;ga(dim,()=>{ell(x,y+2,16,4,'rgba(0,0,0,.35)');
  if(b===0){L(x,y,x,y-8,'#888',1.5);A.poly([[x-14,y-8],[x+14,y-8],[x+10,y-18],[x-10,y-18]],'#2a4a8a',1);for(let k=-1;k<2;k++)L(x+k*7,y-8,x+k*5,y-18,'#9ac8ff',.6);}
  else if(b===1){R(x-8,y-10,16,10,'#6a6a70');R(x-2,y-22,4,14,'#9a9aa0');R(x-6,y-24,12,3,'#2fd6c3');if(on)R(x-1,y-2+((A.t>>2)%3),2,3,'#ddd');}
  else if(b===2){R(x-10,y-12,20,12,'#c8c8d0');ell(x-4,y-12,5,3,'#9fe8ff');ell(x+5,y-12,4,3,'#9fe8ff');if(on&&A.t%20<10)C(x+5,y-17-(A.t%20)/3,1.5,'#dff');}
  else if(b===3){A.c.beginPath();A.c.moveTo(x-14,y);A.c.quadraticCurveTo(x,y-24,x+14,y);A.c.closePath();A.c.fillStyle='rgba(120,255,160,.45)';A.c.fill();for(let k=-2;k<3;k++)C(x+k*5,y-3,2.4,'#2a9a3a');ells(x,y,14,1,'#8ae8a8',.5);}
  else if(b===4){A.poly([[x-12,y],[x-4,y-14],[x+4,y-10],[x+12,y]],'#8a5a3a',1);R(x-2,y-20,3,10,'#5a5a60');L(x,y-20,x+8,y-14+Math.sin(A.t*.1)*3,'#ff9838',2);}
  else if(b===5){A.c.beginPath();A.c.arc(x,y,15,3.1416,0);A.c.closePath();A.c.fillStyle=rg(x-5,y-10,2,18,['rgba(255,255,255,.7)','rgba(180,200,255,.35)']);A.c.fill();A.c.strokeStyle='#e8e8ff';A.c.lineWidth=1;A.c.stroke();R(x-3,y-5,6,5,'#ffcf3f');}
  else{R(x-9,y-16,18,16,'#8a8a90');ell(x,y-16,9,3,'#aaa');C(x,y-8,3,on?(A.t%30<15?'#ffcf3f':'#ffe68a'):'#555');}});if(!on)T('OFF',x,y-28,K.r,1,'c');};
 g.draw=()=>{const df=dayF(),sky1=A.mix('#1a1030','#d89a6a',df),sky2=A.mix('#3a2040','#f0c890',df);R(0,22,W,100,lg(0,22,0,122,[sky1,sky2]));
  if(df<.3)for(let k=0;k<30;k++)R((k*97)%W,24+(k*53)%80,1,1,'rgba(255,255,255,'+(.8-df*2)+')');
  const p=(t%SOL)/SOL;if(p<.6){const a=p/.6*3.1416;C(160-Math.cos(a)*140,110-Math.sin(a)*80,7,'#fff0c0');}else{C(60+(p-.6)/.4*200,40,3,'#e8e8f0');}
  A.poly([[0,122],[40,104],[80,114],[130,98],[190,112],[240,100],[290,110],[320,104],[320,130],[0,130]],'#8a3a1e',1);R(0,128,W,72,lg(0,128,0,200,['#b8562a','#7a3418']));
  for(let k=0;k<9;k++)ell(20+k*37,140+(k%3)*18,6,2,'rgba(60,20,10,.4)');
  for(let i=0;i<blds.length;i++){const[x,y]=bpos(i);drawB(blds[i],x,y,!off[blds[i]]);}
  for(let i=blds.length;i<slots();i++){const[x,y]=bpos(i);ells(x,y,12,3,'rgba(255,255,255,.25)',1);}
  walkers.slice(0,Math.min(8,crew)).forEach((w,k)=>A.person(w.x,k%2?172:142,{s:.55,c:'#f0f0f0',id:k,cap:'#e8e8ff',st:A.t*.2*w.v,d:w.d}));
  if(rocket){const y=rocket.y;R(150,y-26,12,26,'#e8e8f0');A.poly([[150,y-26],[156,y-36],[162,y-26]],'#d0303a',1);A.poly([[150,y],[146,y+4],[150,y-6]],'#888',1);A.poly([[162,y],[166,y+4],[162,y-6]],'#888',1);if(rocket.t<90)for(let k=0;k<3;k++)C(156+rnd(4)-2,y+4+rnd(6),2+rnd(2),k?'#ff9838':'#ffcf3f');}
  if(storm>0)ga(.35,()=>{R(0,22,W,178,'#c88a50');for(let k=0;k<40;k++)R((k*61+A.t*3)%W,22+(k*37)%170,6,1,'#f0c890');});
  // hud
  R(0,0,W,22,'#140c18');const bar=(x,lbl,v,mx,col,n)=>{T(lbl,x,2,col,1);R(x,10,64,5,'#000');R(x,10,64*cl(v/mx,0,1),5,v/mx<.2&&A.t%20<10?K.r:col);T((n>=0?'+':'')+n.toFixed(1),x+64,2,n<0?K.r:'#9fd8b0',1,'r');};
  bar(4,'O2',res.o,STO,'#9fe8ff',net.o);bar(84,'H2O',res.w,STO,'#4dabff',net.w);bar(164,'FOOD',res.f,STO,'#3dff8b',net.f);bar(244,'BATT',bat,BMAX,'#ffcf3f',net.p);
  T('METAL '+Math.floor(res.m),4,16,'#ffb878',1);T('CREW '+crew+'/'+capN(),84,16,K.w,1);T('PLOTS '+blds.length+'/'+slots(),150,16,'#c8c8d8',1);T('SOL '+sol+(df>0?' DAY':' NIGHT'),316,16,df>0?K.y:'#9a9ad8',1,'r');
  if(ft)T(flash,160,30,ft%20<12?K.y:K.w,1,'c');
  // menu
  R(0,198,W,42,'#140c18');MB.forEach((B,k)=>{const x=2+k*45,on=k===sel;rrf(x,200,44,30,4,on?'#3a2a4a':'#22182a');rrs(x+.5,200.5,43,29,4,on?K.y:'#4a3a5a',1);R(x+4,204,6,6,B.col);if(off[k])R(x+4,206,6,2,K.r);T(B.n.slice(0,5),x+26,204,on?K.y:K.w,1,'c');T(''+B.c,x+22,215,res.m>=B.c?'#ffb878':K.r,1,'c');T(''+blds.filter(b=>b===k).length,x+40,222,'#8a8aa8',1,'r');});
  T(MB[sel].d+'   B: '+(off[sel]?'TURN ON':'TURN OFF'),160,232,'#b8b0d0',1,'c');};
 return g;}});
})();
