/* PIXEL ARCADE engine · Cabinet loop: step/render, bloom, open/close, graphics quality, previews, HD fit. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
E.syncGfx=syncGfx;

function step(){E.poll();A.t++;E.sT++;const h=E.hitS[0];
 if(E.state==='title'){if(h.u||h.d){E.sel^=1;A.sfx('blip');}if(E.cur.vs&&E.sel===0){if(h.l&&A.lvl>0){A.lvl--;A.sfx('blip');}if(h.r&&A.lvl<2){A.lvl++;A.sfx('blip');}}if(h.a){A.sfx('coin');E.start();}}
 else if(E.state==='play'){if(E.paused){E.pT++;return;}E.pT=0;if(A.t>50&&E.howEnd>A.t+14&&E.N.some(n=>E.held[0][n]))E.howEnd=A.t+14;const s0=E.g.score;E.g.update();A.fxStep();if(!E.g.over&&E.clock>0){E.clock--;if(E.clock<=600&&E.clock%60===0&&E.clock>0&&!A.silent)A.sfx('blip');if(E.clock===0){E.g.over=E.cur.vs?(E.g.timeUp?E.g.timeUp():'TIME UP · DRAW'):'TIME UP';E.g.timeout=true;}}
  if(!E.cur.vs&&typeof E.g.score==='number'&&E.g.score>s0&&!A.silent){const d=E.g.score-s0;if(d>=5||A.t%6===0){const near=A.t-E.lastB.t<=2,px=near?A.clamp(E.lastB.x,24,W-24):W/2+A.rnd(60)-30,py=near?A.clamp(E.lastB.y-10,34,H-20):54;A.fx.push({txt:'+'+d,x:px,y:py,vx:0,vy:near?-.45:-.3,t:40,c:d>=50?K.y:K.w,g:0,pop:1});}}
  if(E.g.over){E.overT=0;E.sT=0;E.record=false;A.award(E.g);if(E.isWin(E.g.over))A.confetti();if(E.hot){E.ts[E.turn]=E.g.score;E.state=E.turn===0?'swap':'over';}else{E.state='over';if(!E.cur.vs){const b=E.getHS();if(b===null||(E.cur.low?E.g.score<b:E.g.score>b)){if(!(E.cur.low&&E.g.lost)){E.setHS(E.g.score);E.record=true;}}}}A.sfx(E.record||/WIN|CLEAR/.test(E.g.over)?'win':'lose');}}
 else if(E.state==='swap'){E.overT++;if(E.overT>30&&h.a){E.turn=1;E.begin();}}
 else if(E.state==='over'){E.overT++;A.fxStep();if(E.overT>30&&h.a){if(E.hot){E.turn=0;E.ts=[0,0];}E.begin();}}
}
function crtFx(){if(crtOn>0){crtOn--;A.c.globalAlpha=Math.pow(crtOn/crtMax,1.6);A.c.fillStyle='#000';A.c.fillRect(0,0,W,H);A.c.globalAlpha=1;}}
let crtEl=null;
function render(){E.hits=[];
 if(E.state==='title'){bloom(false);E.drawTitle();E.toastDraw();return;}
 if(!E.g)return;E.g.draw();A.flush&&A.flush();
 if(E.state==='play'){A.fxDraw();E.clockUI();bloom(!E.paused);if(E.paused)E.pauseCard();else E.howStrip();}
 else if(E.state==='swap'){bloom(false);A.fxDraw();E.resultCard('swap');}
 else if(E.state==='over'){bloom(false);E.resultCard('over');A.fxDraw();}
 E.toastDraw();
 if(!crtEl)crtEl=document.querySelector('.crt');if(crtEl){const s=E.paused?0:A.shake;crtEl.style.transform=s>0?'translate('+(A.rnd(s)-s/2)+'px,'+(A.rnd(s)-s/2)+'px)':'';}}
let last=0,acc=0;
/* bloom: thresholded (v^4 via self-multiply) low-res copy, blurred + screen-blended by CSS; ambient colour sampled rarely */
E.needFit=true;let bloomC=null,ambC=null,pauseLbl=null;
function bloom(live){if(A.gfx==='off'||!A.c.canvas)return;if(!bloomC){bloomC=document.getElementById('bloom');if(!bloomC)return;}const bx=bloomC.getContext('2d'),scr=A.c.canvas;if(!live){bx.globalCompositeOperation='destination-out';bx.fillStyle='rgba(0,0,0,.18)';bx.fillRect(0,0,bloomC.width,bloomC.height);bx.globalCompositeOperation='source-over';return;}if(A.gfx==='low'&&A.t%2)return;
 bx.globalCompositeOperation='copy';bx.drawImage(scr,0,0,bloomC.width,bloomC.height);bx.globalCompositeOperation='multiply';bx.drawImage(bloomC,0,0);bx.drawImage(bloomC,0,0);bx.globalCompositeOperation='source-over';
 if(A.gfx==='high'&&A.t%20===0){try{if(!ambC){ambC=document.createElement('canvas');ambC.width=4;ambC.height=3;}const ax=ambC.getContext('2d',{willReadFrequently:true});ax.drawImage(bloomC,0,0,4,3);const d=ax.getImageData(0,0,4,3).data;let r=0,g2=0,b=0;for(let i=0;i<d.length;i+=4){r+=d[i];g2+=d[i+1];b+=d[i+2];}const n=d.length/4,m=Math.max(1,r/n,g2/n,b/n),k=Math.min(1,m/60);if(!crtEl)crtEl=document.querySelector('.crt');if(crtEl)crtEl.style.setProperty('--amb','rgba('+(r/n/m*255|0)+','+(g2/n/m*255|0)+','+(b/n/m*255|0)+','+(.08+.22*k).toFixed(2)+')');}catch(e){}}}
function frame(ts_){if(E.state==='hub')return;if(E.needFit){E.needFit=false;fitScr();}acc+=Math.min(100,ts_-last);last=ts_;let n=0;while(acc>=16.667&&n<5){step();acc-=16.667;n++;}if(n===5)acc=0;if(E.state!=='hub'){render();crtFx();if(pauseLbl!==E.paused){pauseLbl=E.paused;const pb=document.getElementById('pause');if(pb)pb.setAttribute('aria-pressed',E.paused);const pl=pb&&pb.querySelector('span');if(pl)pl.textContent=E.paused?'Resume':'Pause';}}requestAnimationFrame(frame);}
E.demo=null;let crtOn=0,crtMax=24;A.open=game=>{E.cur=game;E.sel=0;E.state='title';E.sT=0;E.toastT=0;E.paused=false;A.fx=[];E.g=null;A.setHD(true);crtOn=crtMax=20;try{const sv=A.silent;A.silent=true;E.demo=game.make();A.silent=sv;}catch(_){E.demo=null;}try{if(location.hash!=='#'+game.id)history.replaceState(null,'','#'+game.id);}catch(e){}document.body.classList.add('playing');E.needFit=true;
 const nm=document.getElementById('cabname'),mt=document.getElementById('cabmeta');if(nm)nm.textContent=tc(game.name);if(mt)mt.textContent=tc(game.cat)+' · '+(game.vs?'VS CPU · 2P':'Solo');
 last=performance.now();acc=0;requestAnimationFrame(frame);};
A.close=()=>{E.state='hub';E.g=null;E.paused=false;if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock();A.mouse.down=false;A.mouse.bdown=false;A.setHD(false);try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}document.body.classList.remove('playing');if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});const f=document.querySelector('[data-id="'+(E.cur&&E.cur.id)+'"]');if(f)f.focus();};
A.toggleMute=()=>{E.mute=!E.mute;const b=document.getElementById('mute');if(b){b.setAttribute('aria-pressed',E.mute);const s=b.querySelector('span');(s||b).textContent=E.mute?'Sound off':'Sound on';}if(E.state!=='hub')A.toast(E.mute?'SOUND OFF':'SOUND ON');};
/* graphics: off / low / high, stored per browser */
const GFX=['off','low','high'];
A.gfx=(()=>{try{const v=localStorage.getItem('pxd_gfx2D');if(GFX.includes(v))return v;}catch(e){}try{return matchMedia('(pointer:coarse)').matches?'low':'high';}catch(e){return'high';}})();
function syncGfx(){const cab=document.getElementById('cab');if(cab)cab.dataset.gfx=A.gfx;const b=document.getElementById('gfx');if(b){const s=b.querySelector('span');(s||b).textContent='GFX '+A.gfx;b.title='Graphics: '+A.gfx+' (G)';}}
A.setGfx=v=>{if(!GFX.includes(v))return;A.gfx=v;try{localStorage.setItem('pxd_gfx2D',v);}catch(e){}syncGfx();E.needFit=true;E.bgC.clear();if(E.state!=='hub')A.toast('GRAPHICS · '+v.toUpperCase());};
A.cycleGfx=()=>A.setGfx(GFX[(GFX.indexOf(A.gfx)+1)%3]);
const tc=t=>t.split(' ').map(w=>/\d/.test(w)?w:w.charAt(0)+w.slice(1).toLowerCase()).join(' ');E.tc=tc;
A.preview=(gm,cv,fps)=>{let t;try{A.silent=true;t=gm.make();}catch(e){return()=>{};}const off=document.createElement('canvas');off.width=320;off.height=240;const octx=off.getContext('2d');octx.imageSmoothingEnabled=false;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;let f=0,alive=true;
 const id=setInterval(()=>{if(!alive||E.state!=='hub')return;const sc=A.c,st=A.t,scpu=A.cpu,stwo=A.two,ss=A.silent,sfx=A.fx;A.c=octx;A.silent=true;A.cpu=true;A.two=false;A.fx=[];try{const k=f%30<15?{r:1,a:f%7===0}:{l:1,u:f%5===0,a:f%9===0};A._set(0,f%60<30?k:{d:1,a:f%6===0});A.bot({});A.t=f;t.update();A.cls();t.draw();A.flush&&A.flush();x.drawImage(off,0,0,cv.width,cv.height);if(t.over)t=gm.make();}catch(e){alive=false;}A.c=sc;A.t=st;A.cpu=scpu;A.two=stwo;A.silent=ss;A.fx=sfx;A._set(0,{});f++;},1000/(fps||30));
 return()=>{alive=false;clearInterval(id);};};
A.hdOn=true;A.hd=false;A.scale=1;
function fitScr(){const scr=document.getElementById('scr');if(!scr)return;const dpr=window.devicePixelRatio||1;let s=1;if(A.hd){s=2;if(A.gfx==='high'){const r=scr.getBoundingClientRect();if(r.width>0)s=Math.max(2,Math.min(dpr>=1.5?4:3,Math.round(r.width*dpr/320)));}}
 const cw=320*s;if(scr.width!==cw){scr.width=cw;scr.height=240*s;}A.c=scr.getContext('2d');A.c.setTransform(s,0,0,s,0,0);A.c.imageSmoothingEnabled=false;A.scale=s;
 if(A.hd){const r=scr.getBoundingClientRect(),q=r.width*dpr/cw;scr.style.imageRendering=q>.98&&Math.abs(q-Math.round(q))<.03?'pixelated':'auto';}else scr.style.imageRendering='';}
A.setHD=on=>{const scr=document.getElementById('scr');if(!scr||A.hd===on)return;A.hd=on;fitScr();};
})();
