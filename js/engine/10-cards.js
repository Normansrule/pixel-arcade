/* PIXEL ARCADE engine · Cabinet UI: HD typography, title, pause and results cards, clock bar, how-to strip. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
E.toastDraw=toastDraw;E.drawTitle=drawTitle;E.clockUI=clockUI;E.howStrip=howStrip;E.pauseCard=pauseCard;E.resultCard=resultCard;
/* ---------- cabinet UI layer: HD typography, cards, chrome (drawn at backing resolution) ---------- */
const ACC='#ff4d00',FD="'PA Display',Anton,Impact,'Arial Narrow',sans-serif",FM="'PA Mono','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const WIN_RE=/WIN|CLEAR|COMPLETE|VICTORY|1ST|SOLVED|PERFECT|CHECKOUT|ACE|DEFENDED|ALIGNED|GALLERY|FLOODED|SUMMIT|FLOW|HOME|CHAMP|ROYAL/;
const isWin=o=>WIN_RE.test(o)&&!/WINS!/.test(o)||/PLAYER 1 WINS/.test(o)&&A.cpu;E.isWin=isWin;
let TOUCH=false;try{TOUCH=matchMedia('(pointer:coarse)').matches;}catch(e){}
E.howEnd=230;E.sT=0;E.pT=0;E.toastT=0;E.hits=[];let LS=null,toastM='';
const ease=t=>{t=t<0?0:t>1?1:t;return 1-Math.pow(1-t,3);};
const fmtT=f=>{const s=Math.max(0,Math.ceil(f/60));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
const fmtN=n=>typeof n==='number'?n.toLocaleString('en-US'):String(n);
function font(f,z,w){A.c.font=(w?w+' ':'')+z+'px '+(f==='d'?FD:FM);}
function tx(s,x,y,o){const c=A.c;o=o||{};s=String(s);font(o.f,o.z||7,o.w);if(LS===null)LS='letterSpacing' in c;c.textAlign=o.a==='c'?'center':o.a==='r'?'right':'left';c.textBaseline=o.b||'alphabetic';if(o.ls&&LS)c.letterSpacing=o.ls+'px';c.fillStyle=o.c||'#f2f2f2';if(o.mw)c.fillText(s,x,y,o.mw);else c.fillText(s,x,y);if(o.ls&&LS)c.letterSpacing='0px';}
function tw(s,o){o=o||{};font(o.f,o.z||7,o.w);return A.c.measureText(String(s)).width+(o.ls&&LS?o.ls*String(s).length:0);}
function rr(x,y,w,h,r){const c=A.c;c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else{c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}}
function frr(x,y,w,h,r,col){rr(x,y,w,h,r);A.c.fillStyle=col;A.c.fill();}
function srr(x,y,w,h,r,col){const c=A.c,l=1/(A.scale||2);rr(x+l/2,y+l/2,w-l,h-l,r);c.strokeStyle=col;c.lineWidth=l;c.stroke();}
function hair(x,y,w,col){A.c.fillStyle=col;A.c.fillRect(x,y,w,1/(A.scale||2));}
function wrap(s,maxW,o){const ws=String(s||'').split(/\s+/),L=[''];for(const w of ws){const t=(L[L.length-1]+' '+w).trim();if(tw(t,o)>maxW&&L[L.length-1])L.push(w);else L[L.length-1]=t;}return L.filter(Boolean);}
const hov=(x,y,w,h)=>A.mouse.t>0&&!document.pointerLockElement&&A.mouse.x>=x&&A.mouse.x<=x+w&&A.mouse.y>=y&&A.mouse.y<=y+h;
/* keycap + label chip; returns width */
function kchip(x,y,k,l,o){o=o||{};const kz=5.6,kw=Math.max(11,tw(k,{z:kz,w:700})+7),lw=l?tw(l,{z:6}):0,w=kw+(l?lw+5:0),h=11,on=o.fn&&hov(x-2,y-2,w+4,h+4);
 if(on)frr(x-3,y-2,w+6,h+4,4,'rgba(255,77,0,.14)');
 frr(x,y,kw,h,2.5,o.hot?ACC:'#1b1b1b');srr(x,y,kw,h,2.5,o.hot?ACC:'#3a3a3a');tx(k,x+kw/2,y+h/2+.4,{z:kz,w:700,a:'c',b:'middle',c:o.hot?'#000':'#f2f2f2'});
 if(l)tx(l,x+kw+5,y+h/2+.4,{z:6,b:'middle',c:on?'#fff':o.dim?'#5c5c5c':'#a3a3a3'});if(o.fn)E.hits.push({x:x-3,y:y-2,w:w+6,h:h+4,fn:o.fn,pass:o.pass});return w;}
function krow(items,cx,y,gap){gap=gap||10;const ws=items.map(i=>{const kw=Math.max(11,tw(i.k,{z:5.6,w:700})+7);return kw+(i.l?tw(i.l,{z:6})+5:0);});let x=cx-(ws.reduce((a,b)=>a+b,0)+gap*(items.length-1))/2;items.forEach((i,n)=>{kchip(x,y,i.k,i.l,i);x+=ws[n]+gap;});}
function pill(x,y,s,o){o=o||{};const z=o.z||5.6,w=tw(s,{z,w:700,ls:.6})+10,h=o.h||11;if(o.fill)frr(x,y,w,h,h/2,o.fill);else srr(x,y,w,h,h/2,o.line||'rgba(255,255,255,.22)');tx(s,x+w/2,y+h/2+.4,{z,w:700,ls:.6,a:'c',b:'middle',c:o.c||'#d9d9d9'});return w;}
/* blurred, darkened copy of the current frame behind menus */
let blurC=null;function veil(k,dark){const c=A.c;if(!c.canvas||!c.drawImage){c.globalAlpha=k*(dark||.6);c.fillStyle='#000';c.fillRect(0,0,W,H);c.globalAlpha=1;return;}
 if(A.gfx!=='off'){try{if(!blurC){blurC=document.createElement('canvas');blurC.width=160;blurC.height=120;}const bx=blurC.getContext('2d');bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality='high';if('filter' in bx){bx.filter='blur(2.5px)';bx.drawImage(c.canvas,-6,-6,172,132);bx.filter='none';}else{bx.drawImage(c.canvas,0,0,40,30);bx.drawImage(blurC,0,0,40,30,0,0,160,120);}c.save();c.imageSmoothingEnabled=true;c.globalAlpha=k;c.drawImage(blurC,0,0,W,H);c.restore();}catch(e){}}
 c.globalAlpha=k*(dark||.6);c.fillStyle='#050505';c.fillRect(0,0,W,H);c.globalAlpha=1;}
function card(x,y,w,h,a){const c=A.c;c.save();if(A.gfx!=='off'){c.shadowColor='rgba(0,0,0,'+(.7*a)+')';c.shadowBlur=30;c.shadowOffsetY=8;}frr(x,y,w,h,6,'rgba(10,10,10,.94)');c.restore();srr(x,y,w,h,6,'rgba(255,255,255,.13)');A.c.fillStyle=ACC;A.c.fillRect(x+14,y,26,1);}
function anim(e,dy,fn){const c=A.c;c.save();c.globalAlpha*=e;c.translate(0,(1-e)*(dy===undefined?8:dy));fn();c.restore();}
A.toast=m=>{toastM=m;E.toastT=100;};
function toastDraw(){if(E.toastT<=0)return;E.toastT--;const a=Math.min(1,E.toastT/16,(100-E.toastT)/8);anim(a,-6,()=>{const w=tw(toastM,{z:6.5,w:700,ls:.8})+20;frr(W/2-w/2,8,w,15,7.5,'rgba(8,8,8,.9)');srr(W/2-w/2,8,w,15,7.5,'rgba(255,77,0,.6)');tx(toastM,W/2,15.9,{z:6.5,w:700,ls:.8,a:'c',b:'middle'});});}

function drawTitle(){const c=A.c;A.cls();if(E.demo){const sv=A.silent,sf=A.fx,sc=A.cpu,st=A.two;A.silent=true;A.fx=[];A.cpu=true;A.two=false;try{A.bot({});E.demo.update();if(E.demo.over)E.demo=E.cur.make();E.demo.draw();A.flush&&A.flush();}catch(_){E.demo=null;}A.silent=sv;A.fx=sf;A.cpu=sc;A.two=st;}
 veil(1,.5);let gr=c.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(.45,'rgba(0,0,0,.05)');gr.addColorStop(1,'rgba(0,0,0,.7)');c.fillStyle=gr;c.fillRect(0,0,W,H);
 if(A.gfx!=='off'){gr=c.createRadialGradient(W/2,86,4,W/2,86,150);gr.addColorStop(0,'rgba(255,77,0,.10)');gr.addColorStop(1,'rgba(255,77,0,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);}
 const e=i=>ease((E.sT-4-i*4)/22),best=E.cur.vs?null:E.getHS(),L=A.limitOf(E.cur);
 /* top row: chips + stats */
 anim(e(0),-6,()=>{let x=12;x+=pill(x,11,E.cur.cat,{fill:ACC,c:'#000'})+5;x+=pill(x,11,E.cur.vs?'VS CPU · 2P':'SOLO')+5;if(E.cur.hd)x+=pill(x,11,'3D')+5;if(E.cur.mouse)x+=pill(x,11,'MOUSE')+5;if(E.cur.typing)x+=pill(x,11,'KEYBOARD')+5;
  tx('TIME '+fmtT(L*60),W-12,18.6,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#9a9a9a'});if(best!==null){const bw=tw('TIME '+fmtT(L*60),{z:6,w:700,ls:.6});tx('BEST '+fmtN(best),W-22-bw,18.6,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#f2f2f2'});}
  hair(12,30,W-24,'rgba(255,255,255,.12)');});
 /* name */
 anim(e(1),12,()=>{const nm=E.cur.name,dot=/[A-Z0-9]$/.test(nm);let z=Math.min(46,46*292/Math.max(1,tw(nm+(dot?'.':''),{f:'d',z:46})));z=Math.max(20,z);const w=tw(nm,{f:'d',z}),dw=dot?tw('.',{f:'d',z}):0,x0=W/2-(w+dw)/2,by=50+z*.62+10;
  c.save();if(A.gfx!=='off'){c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=18;}tx(nm,x0,by,{f:'d',z,mw:292});c.restore();if(dot)tx('.',x0+w,by,{f:'d',z,c:ACC});
  const lw=Math.min(w,120)*e(2);c.fillStyle=ACC;c.fillRect(W/2-lw/2,by+8,lw,1);});
 anim(e(2),8,()=>{wrap(E.cur.how,262,{z:6.6,ls:.3}).slice(0,2).forEach((l,i)=>tx(l,W/2,122+i*10,{z:6.6,ls:.3,a:'c',c:'#c9c9c9'}));});
 /* mode selector */
 const ops=E.cur.vs?['VS CPU','2 PLAYERS']:['1 PLAYER','2P TAKE TURNS'];
 anim(e(3),8,()=>{const bw=112,gap=6,x0=W/2-bw-gap/2;ops.forEach((o,i)=>{const x=x0+i*(bw+gap),y=152,on=E.sel===i,hv=hov(x,y,bw,18);frr(x,y,bw,18,9,on?ACC:hv?'rgba(255,255,255,.08)':'rgba(10,10,10,.6)');srr(x,y,bw,18,9,on?ACC:hv?'rgba(255,255,255,.4)':'rgba(255,255,255,.2)');tx(o,x+bw/2,y+9.6,{z:7,w:700,ls:.8,a:'c',b:'middle',c:on?'#000':'#bdbdbd'});E.hits.push({x,y,w:bw,h:18,fn:()=>{E.sel=i;},pass:true});});});
 anim(e(4),8,()=>{const y=178;if(E.cur.vs&&E.sel===0){const lv=['EASY','NORMAL','HARD'],sw=52,x0=W/2-sw*1.5;tx('CPU',x0-8,y+6.4,{z:5.6,w:700,ls:.8,a:'r',b:'middle',c:'#7a7a7a'});srr(x0,y,sw*3,13,6.5,'rgba(255,255,255,.2)');lv.forEach((l,i)=>{const x=x0+i*sw,on=A.lvl===i,hv=hov(x,y,sw,13);if(on)frr(x+1.5,y+1.5,sw-3,10,5,'#f2f2f2');else if(hv)frr(x+1.5,y+1.5,sw-3,10,5,'rgba(255,255,255,.1)');tx(l,x+sw/2,y+6.8,{z:5.8,w:700,ls:.6,a:'c',b:'middle',c:on?'#000':'#9a9a9a'});E.hits.push({x,y,w:sw,h:13,fn:()=>{if(A.lvl!==i){A.lvl=i;A.sfx('blip');}}});});tx('◀ ▶',x0+sw*3+8,y+6.6,{z:5.6,b:'middle',c:'#5f5f5f'});}
  else if(E.cur.vs&&E.sel===1)krow([{k:'P1',l:'WASD + F / G'},{k:'P2',l:'ARROWS + ENTER / SHIFT'}],W/2,y+1,14);
  else if(E.cur.typing)krow([{k:'A–Z',l:'TYPE'},{k:'ENTER',l:'SUBMIT'},{k:'⌫',l:'DELETE'}],W/2,y+1);
  else if(E.cur.mouse)krow([{k:'MOUSE',l:'AIM'},{k:'CLICK',l:'FIRE'},{k:'←→↑↓',l:'ALT'}],W/2,y+1);
  else krow([{k:'←→↑↓',l:'MOVE'},{k:'SPACE',l:'A'},{k:'X',l:'B'}],W/2,y+1);});
 /* start prompt + footer */
 anim(e(5),6,()=>{const p=.6+.4*Math.sin(E.sT*.09);c.globalAlpha*=p;tx(TOUCH?'TAP TO PLAY':'PRESS SPACE OR CLICK TO PLAY',W/2,210,{z:7.6,w:700,ls:1.4,a:'c',b:'middle'});c.globalAlpha/=p;const tw2=tw(TOUCH?'TAP TO PLAY':'PRESS SPACE OR CLICK TO PLAY',{z:7.6,w:700,ls:1.4});c.fillStyle=ACC;c.beginPath();const ax=W/2-tw2/2-9;c.moveTo(ax,206.5);c.lineTo(ax+5,210);c.lineTo(ax,213.5);c.fill();});
 if(!TOUCH)anim(e(6),0,()=>{hair(12,222,W-24,'rgba(255,255,255,.08)');const ks=[['ESC','LOBBY'],['P','PAUSE'],['R','RESTART'],['M','MUTE'],['G','GFX'],['L','SCORES']];let tot=0;const ws=ks.map(([k,l])=>{const w=tw(k,{z:5.4,w:700})+3+tw(l,{z:5.4});tot+=w;return w;});let x=W/2-(tot+9*(ks.length-1))/2;ks.forEach(([k,l],i)=>{tx(k,x,231,{z:5.4,w:700,b:'middle',c:'#d0d0d0'});tx(l,x+tw(k,{z:5.4,w:700})+3,231,{z:5.4,b:'middle',c:'#6a6a6a'});x+=ws[i]+9;});});}

function clockUI(){if(!(E.state==='play'&&E.clockMax))return;const c=A.c,f=E.clock/E.clockMax,lo=E.clock<=600,hd=A.hd;
 if(!hd){c.globalAlpha=lo?.9:.45;A.rect(0,H-2,W*f,2,lo?(A.t%30<15?K.r:K.y):K.w);c.globalAlpha=1;return;}
 c.fillStyle='rgba(255,255,255,.07)';c.fillRect(0,H-1,W,1);c.fillStyle=lo?ACC:'rgba(255,255,255,.42)';c.fillRect(0,H-1,W*f,1);
 if(lo&&E.clock>0){const n=Math.ceil(E.clock/60),fr=(E.clock%60)/60,pop=1+.18*ease((fr-.82)/.18),pw=34,px=W/2-pw/2,py=H-17;
  c.fillStyle=ACC;c.globalAlpha=.6+.4*fr;c.fillRect(W*f-2,H-2,3,2);c.globalAlpha=1;
  c.save();c.translate(W/2,py+6);c.scale(pop,pop);c.translate(-W/2,-py-6);frr(px,py,pw,12,6,'rgba(8,8,8,.86)');srr(px,py,pw,12,6,n<=3?ACC:'rgba(255,77,0,.5)');tx('0:'+String(n).padStart(2,'0'),W/2,py+6.5,{z:6.6,w:700,ls:.4,a:'c',b:'middle',c:n<=3?'#fff':'#ffb08a'});c.restore();
  if(n<=3){const k=ease(1-fr);c.save();c.globalAlpha=.42*Math.pow(fr,1.4);c.translate(W/2,H/2);c.scale(1+k*.35,1+k*.35);tx(String(n),0,0,{f:'d',z:72,a:'c',b:'middle',c:'#fff'});c.restore();}}}

function howStrip(){if(E.hot){const w=tw('P'+(E.turn+1)+' TURN',{z:6,w:700,ls:.8})+16;frr(W/2-w/2,H-17,w,12,6,'rgba(8,8,8,.82)');tx('P'+(E.turn+1)+' TURN',W/2,H-10.6,{z:6,w:700,ls:.8,a:'c',b:'middle',c:ACC});return;}
 if(A.t>=E.howEnd||(E.clockMax&&E.clock<=600))return;const a=ease(Math.min(A.t-6,E.howEnd-A.t)/14);if(a<=0)return;const L=wrap(E.cur.how,236,{z:6.2,ls:.2}).slice(0,2),h=L.length>1?27:17,tg=tw('HOW TO',{z:5.4,w:700,ls:1}),w=Math.min(W-16,Math.max(...L.map(l=>tw(l,{z:6.2,ls:.2})))+tg+30);
 anim(a,10,()=>{const x=W/2-w/2,y=H-8-h;frr(x,y,w,h,7,'rgba(8,8,8,.84)');srr(x,y,w,h,7,'rgba(255,255,255,.12)');tx('HOW TO',x+10,y+h/2+.4,{z:5.4,w:700,ls:1,b:'middle',c:ACC});A.c.fillStyle='rgba(255,255,255,.15)';A.c.fillRect(x+16+tg,y+4,1/(A.scale||2),h-8);L.forEach((l,i)=>tx(l,x+22+tg,y+h/2+.4+(L.length>1?(i-.5)*10:0),{z:6.2,ls:.2,b:'middle',c:'#e6e6e6'}));});}

function pauseCard(){const e=ease(E.pT/12);veil(e,.55);anim(e,10,()=>{const how=wrap(E.cur.how,212,{z:6.4,ls:.2}).slice(0,3),w=244,h=118+how.length*10,x=W/2-w/2,y=H/2-h/2;card(x,y,w,h,e);
 tx('PAUSED',x+14,y+17,{z:6,w:700,ls:1.6,b:'middle',c:ACC});tx(E.clockMax?fmtT(E.clock)+' LEFT':'',x+w-14,y+17,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#8a8a8a'});
 tx(E.cur.name,x+14,y+46,{f:'d',z:Math.min(24,24*(w-28)/Math.max(1,tw(E.cur.name,{f:'d',z:24}))),mw:w-28});
 how.forEach((l,i)=>tx(l,x+14,y+62+i*10,{z:6.4,ls:.2,c:'#bdbdbd'}));const ry=y+66+how.length*10;hair(x+14,ry,w-28,'rgba(255,255,255,.1)');
 krow([{k:'P',l:'RESUME',hot:1,fn:()=>{E.paused=false;}},{k:'R',l:'RESTART',fn:()=>{if(E.hot){E.turn=0;E.ts=[0,0];}E.begin();}},{k:'ESC',l:'LOBBY',fn:()=>A.close()}],W/2,ry+12);
 krow([{k:'M',l:E.mute?'SOUND OFF':'SOUND ON',fn:()=>A.toggleMute()},{k:'G',l:'GFX '+A.gfx.toUpperCase(),fn:()=>A.cycleGfx()}].concat(!E.cur.vs||A.cpu?[{k:'L',l:'SCORES',fn:()=>A.showBoard(E.cur)}]:[]),W/2,ry+30);});}

function resultCard(kind){const e=ease(E.sT/16),c=A.c;veil(e,.5);anim(e,12,()=>{const solo=kind==='over'&&!E.hot&&!E.cur.vs,w=248;let h=kind==='swap'?132:solo||E.hot?150:124;const x=W/2-w/2,y=H/2-h/2-4;card(x,y,w,h,e);
 const mode=E.hot?'2P TAKE TURNS':E.cur.vs?(A.cpu?'VS CPU · '+['EASY','NORMAL','HARD'][A.lvl]:'2 PLAYERS'):'SOLO';
 tx(kind==='swap'?'ROUND 1 OF 2':'RESULT',x+14,y+17,{z:6,w:700,ls:1.6,b:'middle',c:ACC});tx(mode,x+w-14,y+17,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#8a8a8a'});
 let head,won=false;if(kind==='swap')head='PLAYER 1 DONE';else if(E.hot){const wv=E.ts[0]===E.ts[1]?-1:(E.cur.low?E.ts[0]<E.ts[1]:E.ts[0]>E.ts[1])?0:1;head=wv<0?'DRAW!':'PLAYER '+(wv+1)+' WINS!';won=wv>=0;}else{head=E.g.over;won=isWin(E.g.over);}
 const hz=Math.min(30,30*(w-28)/Math.max(1,tw(head,{f:'d',z:30})));tx(head,x+14,y+48,{f:'d',z:hz,c:won?ACC:'#f2f2f2',mw:w-28});hair(x+14,y+58,w-28,'rgba(255,255,255,.1)');
 const cu=ease(E.sT/40);
 if(kind==='swap'){tx('SCORE',x+14,y+72,{z:5.6,w:700,ls:1,c:'#7a7a7a',b:'middle'});tx(fmtN(Math.round(E.ts[0]*cu)),x+14,y+94,{f:'d',z:24});tx('PLAYER 2, GET READY',x+w-14,y+92,{z:6.4,w:700,ls:.6,a:'r',c:'#bdbdbd'});}
 else if(E.hot){[0,1].forEach(i=>{const cx=x+14+i*(w-28)/2,win=(E.cur.low?E.ts[i]<E.ts[1-i]:E.ts[i]>E.ts[1-i]);tx('PLAYER '+(i+1),cx,y+72,{z:5.6,w:700,ls:1,b:'middle',c:win?ACC:'#7a7a7a'});tx(fmtN(Math.round(E.ts[i]*cu)),cx,y+100,{f:'d',z:28,c:win?'#fff':'#9a9a9a'});});if(E.g.tok)pill(x+14,y+110,'+'+E.g.tok+' TOKENS',{line:'rgba(255,77,0,.6)',c:'#ffb08a'});}
 else if(solo){tx('SCORE',x+14,y+72,{z:5.6,w:700,ls:1,b:'middle',c:'#7a7a7a'});const sv=fmtN(typeof E.g.score==='number'?Math.round(E.g.score*cu):E.g.score);tx(sv,x+14,y+104,{f:'d',z:34});const sw_=tw(fmtN(E.g.score),{f:'d',z:34});
  const b=E.getHS(),rx=x+w-14;tx('BEST',rx,y+72,{z:5.6,w:700,ls:1,a:'r',b:'middle',c:'#7a7a7a'});tx(b===null?'—':fmtN(b),rx,y+90,{f:'d',z:16,a:'r',c:E.record?ACC:'#d9d9d9'});
  if(E.g.tok){const tw_=tw('+'+E.g.tok+' TOKENS',{z:5.6,w:700,ls:.6})+10;pill(rx-tw_,y+96,'+'+E.g.tok+' TOKENS',{line:'rgba(255,77,0,.6)',c:'#ffb08a'});}
  if(E.record&&E.sT>20){const k=ease((E.sT-20)/10),bx_=x+14+sw_+10;c.save();c.translate(bx_,y+93);c.scale(k,k);pill(0,-5.5,'NEW BEST',{fill:ACC,c:'#000'});c.restore();}}
 else{if(E.g.tok)pill(x+14,y+68,'+'+E.g.tok+' TOKENS',{line:'rgba(255,77,0,.6)',c:'#ffb08a'});tx('LV '+A.level()+' · '+fmtN(A.profile.tokens)+' TOKENS TOTAL',x+w-14,y+73.4,{z:5.6,ls:.4,a:'r',b:'middle',c:'#7a7a7a'});}
 const ready=E.overT>30,ay=y+h-22;hair(x+14,ay-8,w-28,'rgba(255,255,255,.08)');
 if(kind==='swap')krow([{k:'SPACE',l:'PLAYER 2 START',hot:ready,dim:!ready,pass:ready,fn:()=>{}},{k:'ESC',l:'LOBBY',fn:()=>A.close()}],W/2,ay);
 else krow([{k:'SPACE',l:'AGAIN',hot:ready,dim:!ready,pass:ready,fn:()=>{}},{k:'ESC',l:'LOBBY',fn:()=>A.close()}].concat(!E.hot&&(!E.cur.vs||A.cpu)?[{k:'U',l:'POST',fn:()=>A.submitScore(E.g)},{k:'L',l:'TOP 10',fn:()=>A.showBoard(E.cur)}]:[]),W/2,ay,9);});}
})();
