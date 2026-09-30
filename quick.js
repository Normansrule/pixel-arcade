// Quick test for specific games: node quick.js id1 id2 ...  (all modes, random input, draws)
global.window=global;const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
require('./js/engine.js');require('fs').readFileSync('index.html','utf8').match(/games\/[a-z0-9]+\.js/g).forEach(f=>require('./'+f));
const A=global.A;A.c=ctx;A.silent=true;let fails=0;
for(const id of process.argv.slice(2)){const gm=A.games.find(g=>g.id===id);if(!gm){console.log('MISSING',id);fails++;continue;}const modes=gm.vs?[[1,0],[1,2],[0,0]]:[[0,0]];
 for(const[cpu,lvl]of modes){A.cpu=!!cpu;A.two=!cpu&&!!gm.vs;A.lvl=lvl;A.ai=[.5,.75,1][lvl];let g=gm.make(),ov=[];const t0=Date.now();try{for(let f=0;f<5000;f++){A.t++;const r={l:Math.random()<.2,r:Math.random()<.2,u:Math.random()<.2,d:Math.random()<.2,a:Math.random()<.25,b:Math.random()<.05};A._set(0,r);A._set(1,{a:Math.random()<.2,l:Math.random()<.2});if(gm.typing&&f%25===0)A.typed.push('ETAOINS'[f%7]);g.update();if(f%5===0)g.draw();if(g.over){ov.push(g.over);g=gm.make();}}}catch(e){fails++;console.log('FAIL',id,cpu?'cpu'+lvl:'2p',e.message,e.stack.split('\n')[1]);continue;}
  console.log(id.padEnd(12),(cpu?'cpu'+lvl:gm.vs?'2p':'solo').padEnd(5),(Date.now()-t0+'ms').padEnd(7),ov.length+' ends',ov[0]||'');}}
process.exit(fails?1:0);
