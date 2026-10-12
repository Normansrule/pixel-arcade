/* PIXEL ARCADE engine · Effects: particles, screen shake, confetti, score pops. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
/* ---------- effects: particles, shake, confetti ---------- */
A.fx=[];A.shake=0;const lastB={x:W/2,y:54,t:-99};E.lastB=lastB;
A.burst=(x,y,col,n,sp)=>{if(A.silent)return;lastB.x=x;lastB.y=y;lastB.t=A.t;for(let i=0;i<(n||12);i++){const a=A.rnd(6.283),v=(sp||2)*(0.4+A.rnd(1));A.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,t:20+A.ri(20),c:col||K.y,g:.08});}};
A.confetti=()=>{for(let i=0;i<70;i++)A.fx.push({x:A.rnd(W),y:-10-A.rnd(40),vx:A.rnd(2)-1,vy:1+A.rnd(2),t:80+A.ri(60),c:[K.y,K.p,K.c,K.g,K.o,'#ff4d00'][i%6],g:.02,w:3+A.ri(3),cf:1,ph:i*1.7});};
A.fxStep=()=>{for(const p of A.fx){p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.t--;}A.fx=A.fx.filter(p=>p.t>0);if(A.shake>0)A.shake--;};
const glowC=new Map();function glowSpr(col){let s=glowC.get(col);if(s!==undefined)return s;if(glowC.size>80)glowC.clear();s=null;try{s=document.createElement('canvas');s.width=s.height=32;const x=s.getContext('2d'),gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,col);gr.addColorStop(.25,col);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);}catch(e){s=null;}glowC.set(col,s);return s;}
function popDraw(p){const c=A.c;if(!A.hd||!c.fillText){c.globalAlpha=Math.min(1,p.t/20);A.text(p.txt,p.x,p.y,p.c,2,'c');c.globalAlpha=1;return;}
 if(p.t0===undefined)p.t0=p.t;const age=p.t0-p.t,k=age<7?.55+.6*Math.sin(age/7*2.2):1,z=p.pop?11:10,s=String(p.txt).toUpperCase();
 c.save();c.globalAlpha=Math.min(1,p.t/14);c.font=z+"px 'PA Display',Anton,Impact,'Arial Narrow',sans-serif";const hw=c.measureText(s).width/2+2;c.translate(A.clamp(p.x,hw,W-hw),p.y+5);c.scale(k,k);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=2.6;c.strokeStyle='rgba(0,0,0,.75)';c.strokeText(s,0,0);c.fillStyle=p.c;c.fillText(s,0,0);c.restore();}
A.fxDraw=()=>{const c=A.c,lo=A.hd&&A.gfx!=='off',hi=lo&&A.gfx==='high'&&c.drawImage;
 if(!lo){for(const p of A.fx){if(p.txt){popDraw(p);continue;}c.fillStyle=p.c;c.fillRect(p.x|0,p.y|0,p.w||2,p.w||2);}return;}
 if(hi){c.globalCompositeOperation='lighter';for(const p of A.fx){if(p.txt||p.cf||typeof p.c!=='string')continue;const s=glowSpr(p.c);if(!s)continue;const a=Math.min(1,p.t/18),r=(p.w||2)*2.6+2;c.globalAlpha=a*.45;c.drawImage(s,p.x+1-r,p.y+1-r,r*2,r*2);}c.globalCompositeOperation='source-over';}
 for(const p of A.fx){if(p.txt)continue;const a=Math.min(1,p.t/12);c.globalAlpha=a;c.fillStyle=p.c;if(p.cf){const w=p.w,f=Math.cos(p.t*.22+p.ph),fw=w*Math.abs(f)+.5;if(f<0)c.globalAlpha=a*.7;c.fillRect(p.x+w/2-fw/2,p.y,fw,w*.62);continue;}const w=(p.w||2)*(.55+.45*a);c.fillRect(p.x+(p.w||2)/2-w/2,p.y+(p.w||2)/2-w/2,w,w);}
 c.globalAlpha=1;for(const p of A.fx)if(p.txt)popDraw(p);};
})();
