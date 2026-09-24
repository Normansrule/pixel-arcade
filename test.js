// Headless smoke test: runs every game with random input and checks for exceptions / NaN draws.
global.window=global;let nanHits={};let curId='';
const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{if(a.some(v=>typeof v==='number'&&!isFinite(v)))nanHits[curId+':'+String(k)]=1;},set:(t,k,v)=>{t[k]=v;return true;}});
require('./js/engine.js');['sports1','sports2','classics1','classics2','threed','puzzle'].forEach(f=>require('./games/'+f+'.js'));
const A=global.A;A.c=ctx;A.silent=true;const N=['l','r','u','d','a','b'];let fails=0;
const rin=(bias)=>{const o={};for(const n of N)o[n]=Math.random()<bias;return o;};
for(const gm of A.games){curId=gm.id;const modes=gm.vs?[['cpu',1,0],['two',0,1]]:[['solo',0,0]];
 for(const [name,cpu,two] of modes)for(const lvl of [0,2]){A.cpu=!!cpu;A.two=!!two;A.lvl=lvl;A.ai=[.5,.75,1][lvl];let overs=0,g=gm.make(),hold=rin(.3),hold2=rin(.3);
  try{for(let f=0;f<6000;f++){A.t++;if(f%7===0){hold=rin(.35);hold2=rin(.35);}A._set(0,hold);if(two)A._set(1,hold2);g.update();g.draw();if(g.over){overs++;if(typeof g.over!=='string'||!isFinite(g.score))throw new Error('bad over/score '+g.over+' '+g.score);g=gm.make();}}
   console.log('ok  ',gm.id.padEnd(10),name,'lvl'+lvl,'games finished:',overs);}catch(e){fails++;console.log('FAIL',gm.id,name,e.stack.split('\n').slice(0,3).join(' | '));}}}
// Crate Pusher solvability (BFS)
A.CRATES.forEach((lv,n)=>{const m=lv.map(r=>r.split(''));let p,bx=[],tg=[];m.forEach((r,y)=>r.forEach((c,x)=>{if(c==='@')p=[x,y];if(c==='$'||c==='*')bx.push(x+','+y);if(c==='.'||c==='*')tg.push(x+','+y);}));
 const wall=(x,y)=>!m[y]||!m[y][x]||m[y][x]==='#';const key=(p,b)=>p+'|'+b.slice().sort().join(';');let q=[[p,bx]],seen=new Set([key(p,bx)]),ok=false,it=0;
 while(q.length&&it++<400000){const [pp,bb]=q.shift();if(bb.every(b=>tg.includes(b))){ok=true;break;}for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=pp[0]+d[0],ny=pp[1]+d[1];if(wall(nx,ny))continue;let nb=bb;const bi=bb.indexOf(nx+','+ny);if(bi>=0){const tx=nx+d[0],ty=ny+d[1];if(wall(tx,ty)||bb.includes(tx+','+ty))continue;nb=bb.slice();nb[bi]=tx+','+ty;}const k=key([nx,ny],nb);if(!seen.has(k)){seen.add(k);q.push([[nx,ny],nb]);}}}
 console.log('crates room',n+1,ok&&bx.length===tg.length?'solvable':'NOT SOLVABLE');if(!ok)fails++;});
console.log('NaN draws:',Object.keys(nanHits).join(' ')||'none');console.log(A.games.length,'games,',fails,'failures');process.exit(fails?1:0);
