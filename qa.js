// QA sweep: text clipping, frozen screens, games that never end, runaway particles.
global.window=global;let calls=[],textBad={};let curId='';
const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{calls.push(k+':'+a.map(v=>typeof v==='number'?Math.round(v):'').join(','));},set:(t,k,v)=>{t[k]=v;return true;}});
require('./js/engine.js');const fs=require('fs');const files=fs.readFileSync('index.html','utf8').match(/games\/[a-z0-9]+\.js/g);files.forEach(f=>require('./'+f));
const A=global.A;A.c=ctx;A.silent=true;
const ot=A.text;A.text=(s,x,y,col,sc,al,ns)=>{s=String(s).toUpperCase();sc=sc||1;const w=s.length*4*sc-sc;let x0=al==='c'?x-w/2:al==='r'?x-w:x;if(x0<-1||x0+w>321||y<-1||y+5*sc>241)(textBad[curId]=textBad[curId]||new Set()).add(s.slice(0,30)+' @'+Math.round(x0)+','+Math.round(y));ot(s,x,y,col,sc,al,ns);};
const N=['l','r','u','d','a','b'];const rin=b=>{const o={};for(const n of N)o[n]=Math.random()<b;return o;};
const rep=[];
for(const gm of A.games.filter(g=>!g.href)){curId=gm.id;A.cpu=!!gm.vs;A.two=false;A.lvl=1;A.ai=.75;let g=gm.make(),overs=0,frozen=0,maxFrozen=0,last='',scoreCh=0,lastScore=g.score,hold=rin(.3);
 for(let f=0;f<9000;f++){A.t++;if(f%6===0)hold=rin(.35);A._set(0,hold);g.update();calls=[];g.draw();if(A.flush)A.flush();const h=calls.join('|');if(h===last)frozen++;else frozen=0;maxFrozen=Math.max(maxFrozen,frozen);last=h;if(g.score!==lastScore){scoreCh++;lastScore=g.score;}if(g.over){overs++;g=gm.make();}}
 rep.push({id:gm.id,overs,maxFrozen,scoreCh,text:textBad[gm.id]?[...textBad[gm.id]].slice(0,3):null});}
const bad=rep.filter(r=>r.maxFrozen>600||r.text||(r.overs===0&&r.scoreCh===0));
bad.forEach(r=>console.log(JSON.stringify(r)));console.log('checked',rep.length,'flagged',bad.length);
