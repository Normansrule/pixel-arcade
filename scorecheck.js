global.window=global;const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
process.chdir('/home/claude/pixel-arcade');require('./js/engine.js');require('fs').readFileSync('index.html','utf8').match(/games\/[a-z0-9]+\.js/g).forEach(f=>require('./'+f));
const A=global.A;A.c=ctx;A.silent=true;A.cpu=false;A.two=false;
const scripts=[f=>({a:f%20===0,l:f%120<60,r:f%120>=60}),f=>({a:f%3===0,u:f%40<20,d:f%40>=20}),f=>({a:f%40<25,r:f%200<100,l:f%200>=100,u:f%90<10}),f=>({a:Math.random()<.3,l:Math.random()<.3,r:Math.random()<.3,u:Math.random()<.3,d:Math.random()<.3,b:Math.random()<.1})];
const bad=[];for(const gm of A.games.filter(g=>!g.href&&!g.vs)){let best=0,won=false;for(const s of scripts){let g=gm.make();for(let f=0;f<3000;f++){A.t++;A._set(0,s(f));try{g.update();}catch(e){bad.push(gm.id+' ERR '+e.message);break;}best=Math.max(best,g.score||0);if(g.over){if(/WIN/.test(g.over))won=true;g=gm.make();}}}if(best<=0&&!won)bad.push(gm.id+(gm.low?' (low-is-better)':''));}
console.log(bad.join('\n')||'all score');console.log('checked',A.games.filter(g=>!g.href&&!g.vs).length);
