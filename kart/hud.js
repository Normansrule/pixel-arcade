// CRITTER KART — HUD: per-view overlays (place, lap, item roulette, berries, coins, speed), minimap, item icons.
import {ORD,fmtT} from './util.js';
import {ITEMS} from './data.js';
const ICON={};
export function icon(id,size=96){const k=id+size;if(ICON[k])return ICON[k];const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),s=size/96;x.scale(s,s);x.lineJoin='round';x.lineCap='round';
 const orb=(cx,cy,r,c1,c2)=>{const g=x.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r);g.addColorStop(0,'#fff');g.addColorStop(.3,c1);g.addColorStop(1,c2);x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();};
 const eye=(cx,cy,r)=>{x.fillStyle='#fff';x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(cx+r*.25,cy,r*.5,0,7);x.fill();};
 switch(id){
  case'zip':{x.fillStyle='#3ac8ff';x.strokeStyle='#08306a';x.lineWidth=5;for(const o of[0,22]){x.beginPath();x.moveTo(18+o,22);x.lineTo(48+o,48);x.lineTo(18+o,74);x.lineTo(30+o,48);x.closePath();x.fill();x.stroke();}break;}
  case'hornet':{x.save();x.translate(48,50);x.rotate(-.6);x.fillStyle='#ff4a3a';x.strokeStyle='#5a0a0a';x.lineWidth=4;x.beginPath();x.ellipse(0,0,30,14,0,0,7);x.fill();x.stroke();x.fillStyle='#ffe04a';x.beginPath();x.moveTo(28,-8);x.lineTo(44,0);x.lineTo(28,8);x.fill();x.fillStyle='#2a2a2a';x.beginPath();x.moveTo(-26,-6);x.lineTo(-40,-20);x.lineTo(-34,0);x.lineTo(-40,20);x.lineTo(-26,6);x.fill();eye(10,-3,6);x.restore();break;}
  case'darts':{for(const[o,a]of[[-22,-.2],[0,0],[22,.2]]){x.save();x.translate(48+o,52);x.rotate(a);x.fillStyle='#ffb02a';x.strokeStyle='#6a3a00';x.lineWidth=3;x.beginPath();x.moveTo(0,-34);x.lineTo(9,10);x.lineTo(-9,10);x.closePath();x.fill();x.stroke();x.fillStyle='#ff4d00';x.fillRect(-6,10,12,14);x.restore();}break;}
  case'bubble':{orb(48,48,34,'rgba(160,240,255,.8)','rgba(40,140,220,.55)');x.strokeStyle='#e8ffff';x.lineWidth=4;x.beginPath();x.arc(48,48,34,0,7);x.stroke();x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.ellipse(36,32,9,5,-.6,0,7);x.fill();break;}
  case'goo':{x.fillStyle='#7aff4a';x.strokeStyle='#1a5a0a';x.lineWidth=4;x.beginPath();x.moveTo(14,70);x.quadraticCurveTo(12,30,48,28);x.quadraticCurveTo(84,30,82,70);x.quadraticCurveTo(70,78,60,70);x.quadraticCurveTo(48,82,36,70);x.quadraticCurveTo(24,80,14,70);x.fill();x.stroke();eye(38,48,8);eye(58,48,8);break;}
  case'magnet':{x.lineWidth=16;x.strokeStyle='#c06aff';x.beginPath();x.arc(48,44,24,Math.PI,0,true);x.stroke();x.beginPath();x.moveTo(24,44);x.lineTo(24,70);x.moveTo(72,44);x.lineTo(72,70);x.stroke();x.strokeStyle='#eee';x.beginPath();x.moveTo(24,64);x.lineTo(24,80);x.moveTo(72,64);x.lineTo(72,80);x.stroke();break;}
  case'berry':{orb(42,56,22,'#ff6a8a','#a0102a');orb(62,46,16,'#ff7a9a','#b0203a');x.fillStyle='#3ac84a';x.beginPath();x.moveTo(50,30);x.lineTo(60,10);x.lineTo(66,26);x.fill();break;}
  case'coin':{const g=x.createLinearGradient(20,20,76,76);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#c8d0e0');g.addColorStop(1,'#7a8498');x.fillStyle=g;x.beginPath();x.arc(48,48,30,0,7);x.fill();x.strokeStyle='#5a6478';x.lineWidth=4;x.stroke();x.fillStyle='#fff';x.font='bold 34px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('★',48,50);break;}
  case'balloon':{orb(48,40,26,'#ff6aa0','#a01a4a');x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.moveTo(48,66);x.quadraticCurveTo(40,78,50,92);x.stroke();break;}
  case'key':{orb(48,48,30,'#ffd03a','#a06a00');x.fillStyle='#fff';x.font='bold 30px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('♛',48,50);break;}}
 return ICON[k]=c.toDataURL();}
const ROLL=Object.keys(ITEMS);
export class HUD{
 constructor(root){this.root=root;this.views=[];this.cache=new Map();}
 setViews(n,racers){this.root.innerHTML='';this.views=[];for(let v=0;v<n;v++){const d=document.createElement('div');d.className='pv';d.innerHTML=`<div class="place"><b>1</b><i>st</i></div><div class="lap"></div><div class="ltime"></div>
  <div class="ibox"><img alt=""><span></span></div><div class="cnt"><span class="bb"><img src="${icon('berry',48)}">×<b>0</b></span><span class="cc"><img src="${icon('coin',48)}"><b>0</b>/8</span></div><div class="spd"><b>0</b><i>KM/H</i></div><div class="wrong">WRONG WAY</div><div class="vmsg"></div><div class="drift"><i></i></div>`;this.root.appendChild(d);
  this.views.push({el:d,r:racers[v],q:k=>d.querySelector(k),last:{}});}
  this.root.classList.toggle('split',n>1);}
 set(v,key,val,fn){if(v.last[key]===val)return;v.last[key]=val;fn(val);}
 update(views,ctx){for(let k=0;k<this.views.length;k++){const V=this.views[k],r=V.r,top=views.length>1?(k===0?0:50):0,h=views.length>1?50:100;V.el.style.top=top+'%';V.el.style.height=h+'%';
  this.set(V,'pl',r.place+'/'+ctx.n,()=>{V.q('.place b').textContent=r.place;V.q('.place i').textContent=ORD(r.place).replace(/\d+/,'');V.q('.place').className='place p'+Math.min(r.place,4);});
  this.set(V,'lap',ctx.hub?'':`LAP ${Math.min(Math.max(1,r.lap),ctx.laps)}/${ctx.laps}`,s=>V.q('.lap').textContent=s);
  this.set(V,'lt',ctx.hub?'':fmtT(r.fin?r.fin:Math.max(0,ctx.raceT)),s=>V.q('.ltime').textContent=s);
  const it=r.roll_>0?ROLL[Math.floor(ctx.t*14)%ROLL.length]:r.item;this.set(V,'it',it+'|'+(r.roll_>0),()=>{const img=V.q('.ibox img');if(it){img.src=icon(it);img.style.opacity=r.roll_>0?.6:1;V.q('.ibox span').textContent=r.roll_>0?'':ITEMS[it].n;}else{img.removeAttribute('src');img.style.opacity=0;V.q('.ibox span').textContent='';}V.q('.ibox').classList.toggle('full',!!it&&r.roll_<=0);});
  this.set(V,'b',r.berries,b=>{V.q('.bb b').textContent=b;V.q('.bb').classList.toggle('max',b>=10);});
  this.set(V,'c',ctx.coinsOn?r.coins:-1,c=>{V.q('.cc').style.display=c<0?'none':'';V.q('.cc b').textContent=c;});
  this.set(V,'s',Math.round(Math.abs(r.v)*3.6),s=>V.q('.spd b').textContent=s);
  this.set(V,'w',!!r.wrong,w=>V.q('.wrong').classList.toggle('on',w));
  this.set(V,'m',r.vmsg||'',m=>{const e=V.q('.vmsg');e.textContent=m;e.classList.toggle('on',!!m);});
  const dl=r.drift.on?r.drift.lvl+1:0;this.set(V,'d',dl,d=>{const e=V.q('.drift');e.className='drift'+(d?' on l'+d:'');});
  this.set(V,'hide',!!ctx.hub,hb=>{for(const s of['.place','.lap','.ltime','.ibox','.spd','.cnt'])V.q(s).style.display=hb&&s!=='.spd'?'none':'';});}}}

export function drawMini(cv,C,rs,me){const x=cv.getContext('2d'),w=cv.width,h=cv.height,B=C.B;if(!C._mini){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<B.n;i++){x0=Math.min(x0,B.x[i]);x1=Math.max(x1,B.x[i]);z0=Math.min(z0,B.z[i]);z1=Math.max(z1,B.z[i]);}C._mini={x0,z0,s:Math.min((w-24)/(x1-x0),(h-24)/(z1-z0)),cx:(x0+x1)/2,cz:(z0+z1)/2};}
 const M=C._mini,P=(px,pz)=>[w/2-(px-M.cx)*M.s,h/2-(pz-M.cz)*M.s];x.clearRect(0,0,w,h);
 x.lineJoin='round';x.lineCap='round';for(const[lw,c]of[[9,'rgba(0,0,0,.55)'],[5,'rgba(255,255,255,.85)']]){x.strokeStyle=c;x.lineWidth=lw;x.beginPath();for(let i=0;i<=B.n;i+=3){const[a,b]=P(B.x[i%B.n],B.z[i%B.n]);i?x.lineTo(a,b):x.moveTo(a,b);}x.closePath();x.stroke();}
 x.strokeStyle='rgba(60,170,255,.9)';x.lineWidth=5;for(let i=0;i<B.n;i+=3){if(!B.wet[i])continue;const[a,b]=P(B.x[i],B.z[i]),[c,d]=P(B.x[(i+3)%B.n],B.z[(i+3)%B.n]);x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke();}
 const[s0,s1]=P(B.x[0],B.z[0]);x.fillStyle='#111';x.fillRect(s0-5,s1-2,10,4);
 for(const r of rs){if(r.rescueT>0&&r.human<0)continue;const[a,b]=P(r.p.x,r.p.z);x.fillStyle=r.boss?'#ff3a3a':'#'+r.d.kc.toString(16).padStart(6,'0');x.beginPath();x.arc(a,b,r.human>=0?6:r.boss?7:4,0,7);x.fill();if(r.human>=0){x.strokeStyle='#fff';x.lineWidth=2;x.stroke();}}}
