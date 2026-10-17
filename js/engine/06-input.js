/* PIXEL ARCADE engine · Input: keyboard, mouse, touch pad, CPU bot input, hold-to-fire (A.fire). */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
E.poll=poll;

/* ---------- input ---------- */
const N=['l','r','u','d','a','b'],keys={},vk={};E.N=N;E.keys=keys;E.vk=vk;E.tap={};
const MAP1={l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],a:['KeyF','Space'],b:['KeyG','ShiftLeft']};
const MAP2={l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],a:['Enter','Slash','Period'],b:['ShiftRight','Comma']};
const MAPS={};for(const n of N)MAPS[n]=MAP1[n].concat(MAP2[n],n==='a'?['KeyZ']:n==='b'?['KeyX']:[]);
const held=[{},{}],hitS=[{},{}],prev=[{},{}];E.held=held;E.hitS=hitS;E.botPrev={};
E.state='hub';
function poll(){A.mouse.dx=E.mdx;A.mouse.dy=E.mdy;E.mdx=0;E.mdy=0;if(A.mouse.t>0)A.mouse.t--;const split=A.two&&E.state==='play';for(let p=0;p<2;p++){const m=split?(p?MAP2:MAP1):(p?null:MAPS);for(const n of N){let v=m?m[n].some(k=>keys[k]||E.tap[k]):false;if(p===0&&(vk[n]||E.mtap[n]||(n==='a'&&A.mouse.down)||(n==='b'&&A.mouse.bdown)))v=true;hitS[p][n]=v&&(!prev[p][n]||(p===0&&E.mtap[n+'!']));prev[p][n]=v;held[p][n]=v;}}E.tap={};E.mtap={};}
A.in=p=>held[p];A.hit=p=>hitS[p];
A.typed=[];A.mouse={x:160,y:120,dx:0,dy:0,t:0,down:false};const fireT={};A.fire=(rate,p)=>{p=p||0;if(A.hit(p).a||(A.in(p).a&&A.t-(fireT[p]||-999)>=rate)){fireT[p]=A.t;return true;}return false;};E.mdx=0;E.mdy=0;E.mtap={};
A.bot=o=>{for(const n of N){const v=!!o[n];hitS[1][n]=v&&!E.botPrev[n];E.botPrev[n]=v;held[1][n]=v;}};
A._set=(p,o)=>{for(const n of N){const v=!!o[n];hitS[p][n]=v&&!held[p][n];held[p][n]=v;}}; /* test hook */
})();
