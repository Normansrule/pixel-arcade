/* PIXEL ARCADE engine · Core: the A namespace, palette, registry (A.add) and small helpers. */
(function(){
'use strict';
const W=320,H=240;
const A=window.A={W,H,t:0,cpu:false,two:false,lvl:1,ai:.75,c:null,silent:false,games:[]};
const E=A._e={};
const lift=(h,f)=>{const n=parseInt(h.slice(1),16);const r=n>>16,g=(n>>8)&255,b=n&255;const m=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return`rgb(${m(r)},${m(g)},${m(b)})`;};E.lift=lift;
A.K={bg:'#0d0926',w:'#fff3d6',r:'#ff4f6d',g:'#3dff8b',b:'#4dabff',y:'#ffcf3f',o:'#ff9838',p:'#ff4f9a',c:'#2fd6c3',d:'#2b2257',gr:'#8d86b8',k:'#000'};
const K=A.K;
A.add=g=>{try{const s=document.currentScript&&document.currentScript.src;if(s)g.src=s.replace(/^.*?(games\/[^?#]+).*$/,'$1');}catch(_){}A.games.push(g);};
A.rnd=n=>Math.random()*n;A.ri=n=>Math.random()*n|0;A.clamp=(v,a,b)=>v<a?a:v>b?b:v;
A.win=i=>i===0?'PLAYER 1 WINS!':A.cpu?'CPU WINS!':'PLAYER 2 WINS!';
A.nm=i=>i===0?'P1':A.cpu?'CPU':'P2';
})();
