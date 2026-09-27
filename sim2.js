global.window=global;const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
require('./js/engine.js');const ids=process.argv.slice(2);const fs=require('fs');fs.readFileSync('index.html','utf8').match(/games\/[a-z0-9]+\.js/g).forEach(f=>require('./'+f));
const A=global.A;A.c=ctx;A.silent=true;A.cpu=true;A.two=false;
for(const id of ids){const gm=A.games.find(g=>g.id===id);const out=[];for(const lvl of[0,2]){A.lvl=lvl;A.ai=[.5,.75,1][lvl];let g=gm.make(),res=null;for(let f=0;f<40000;f++){A.t++;A._set(0,{a:f%45===0});g.update();if(g.over){res=g.over+'@'+f;break;}}out.push('lvl'+lvl+' '+(res||'NONE'));}console.log(id.padEnd(12),out.join(' | '));}
