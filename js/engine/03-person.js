/* PIXEL ARCADE engine · Characters: detailed human figure (A.person) and emoji sprites. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;


/* ---------- detailed human figure (feet at x,y) ---------- */
const shG=new WeakMap();
const SKIN=['#f1c7a3','#e0a57c','#c68a5e','#9a6440','#6e4428','#f6d2b8'],HAIR=['#2a1a10','#5a3a1e','#1a1a1a','#c89040','#8a2a1a','#e8e0d0'];
A.person=(x,y,o)=>{o=o||{};const s=o.s||1,c=A.c,sh=o.c||'#2fe8d0',pants=o.pants||'#2a2a3a',seed=(o.id!==undefined?o.id:(parseInt(String(sh).slice(1,7),16)||7))%6,skin=o.skin||SKIN[seed],hair=o.hair||HAIR[(seed*5+1)%6],st=o.st||0,d=o.d||1,sw=Math.sin(st)*4*s;
 c.save();c.translate(x,y);c.scale(s,s);
 if(A.hd&&A.gfx!=='off'&&c.createRadialGradient){let sg=shG.get(c);if(!sg){sg=c.createRadialGradient(0,0,0,0,0,10);sg.addColorStop(0,'rgba(0,0,0,.46)');sg.addColorStop(.55,'rgba(0,0,0,.24)');sg.addColorStop(1,'rgba(0,0,0,0)');shG.set(c,sg);}c.save();c.scale(1,.3);c.fillStyle=sg;c.beginPath();c.arc(0,0,10,0,6.283);c.fill();c.restore();}else{c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(0,0,8,2.2,0,0,6.283);c.fill();}
 const leg=(lx,a)=>{c.save();c.translate(lx,-12);c.rotate(a);c.fillStyle=pants;c.fillRect(-2,0,4.2,11);c.fillStyle='#161616';c.fillRect(-2.4+(d>0?0:-1),10,5.4,2.4);c.restore();};
 leg(-2,sw*.09);leg(2,-sw*.09);
 const arm=(ax,a)=>{c.save();c.translate(ax,-21);c.rotate(a);c.fillStyle=sh;c.fillRect(-1.6,0,3.2,5);c.fillStyle=skin;c.fillRect(-1.4,5,2.8,5);c.restore();};
 arm(-5,o.arm1!==undefined?o.arm1:-sw*.09);
 let gr=c.createLinearGradient?c.createLinearGradient(-5,0,5,0):null;if(gr&&gr.addColorStop){gr.addColorStop(0,E.lift(sh,1.25));gr.addColorStop(1,E.lift(sh,.7));c.fillStyle=gr;}else c.fillStyle=sh;
 c.beginPath();c.moveTo(-5,-23);c.lineTo(5,-23);c.lineTo(4.4,-12);c.lineTo(-4.4,-12);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-4.4,-13.5,8.8,1.5);c.fillStyle=E.lift(sh,1.5);c.fillRect(-2,-23,4,1.3);
 if(o.num!==undefined){c.fillStyle='rgba(255,255,255,.85)';c.font='bold 5px monospace';c.textAlign='center';c.fillText(o.num,0,-15.5);}
 arm(5,o.arm2!==undefined?o.arm2:sw*.09);
 c.fillStyle=skin;c.fillRect(-1.5,-25,3,2.5);
 gr=c.createRadialGradient?c.createRadialGradient(-1.5*d,-29,.5,0,-28,5):null;if(gr&&gr.addColorStop){gr.addColorStop(0,E.lift(skin,1.2));gr.addColorStop(1,E.lift(skin,.8));c.fillStyle=gr;}else c.fillStyle=skin;
 c.beginPath();c.arc(0,-28.5,4.2,0,6.283);c.fill();
 c.fillStyle=hair;c.beginPath();c.arc(0,-29.6,4.4,Math.PI*1.02,Math.PI*1.98);c.fill();c.fillRect(-4.4,-30,1.6,2.5+seed%2*2);
 if(o.cap){c.fillStyle=o.cap;c.beginPath();c.arc(0,-29.8,4.5,Math.PI,0);c.fill();c.fillRect(d>0?0:-7,-30.2,7,1.5);}
 c.fillStyle='#1a1a1a';c.fillRect(d>0?.6:-2.2,-29,1.2,1.4);c.fillRect(d>0?2.6:-.2-2.2+1,-29,1.2,1.4);c.fillStyle='rgba(120,40,40,.6)';c.fillRect(d>0?.8:-2,-26.2,2,.7);
 c.restore();};

A.emoji=(ch,x,y,size)=>{const c=A.c;if(!c.fillText)return;c.save();c.font=size+'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffffff';c.fillText(ch,x,y);c.restore();};
})();
