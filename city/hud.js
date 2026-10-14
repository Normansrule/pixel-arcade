// NEON BAY — HUD: cash/clock/stars, minimap with GPS route, full map (M) with waypoints, phone (T), garage + spray shop panels.
import {THREE,cl,fmtCash,fmtClock,fmtRace} from './util.js';
import {XS,ZS,RW,CANAL,QUAY,BEACH,WL,FWY_HW,BOUND} from './world.js';
import {SPECS,SHOP,PAINTS} from './vehicles.js';
import {KIND} from './missions.js';
import {STATIONS} from './sound.js';
import {toast} from '../js/kit3d/ui.js';
const $=id=>document.getElementById(id);
const MB={x0:-700,x1:800,z0:-780,z1:660},MS=1.3;// map bounds, metres per pixel of the base map

export class Hud{constructor(G){this.G=G;this.el={};this.banT=0;this.toastT=0;this.bigT=0;this.cashShown=0;this.phoneOpen=false;this.phoneApp='home';this.sel=0;this.mapOpen=false;this.mapZoom=1;this.mapPan={x:0,z:0};this.shopOpen=null;
  this.mini=$('mini').getContext('2d');this.base=this.renderBase();this.bindPhone();this.bindMap();}
 /* ---------- base map ---------- */
 renderBase(){const W=this.G.W,w=Math.ceil((MB.x1-MB.x0)/MS),h=Math.ceil((MB.z1-MB.z0)/MS);const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const X=v=>(v-MB.x0)/MS,Z=v=>(v-MB.z0)/MS;
  const img=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const wx=MB.x0+i*MS,wz=MB.z0+j*MS;const t=W.terrainH(wx,wz);let r,g,b;
   if(t<WL){const d=cl((WL-t)/8,0,1);r=20-d*8;g=70-d*30;b=105-d*25;}else if(wz>BEACH-2&&t<3){r=170;g=150;b=105;}else if(t>.5){const k=cl(t/110,0,1);r=46+k*60;g=58+k*40;b=40+k*30;const sh=(W.terrainH(wx+3,wz-3)-t)*6;r+=sh;g+=sh;b+=sh;}else{r=40;g=48;b=38;}
   const k=(j*w+i)*4;img.data[k]=r;img.data[k+1]=g;img.data[k+2]=b;img.data[k+3]=255;}x.putImageData(img,0,0);
  for(const b of W.blocks){x.fillStyle=b.d==='park'?'#3d6a3a':b.d==='harbor'?'#4a4d55':b.d==='boardwalk'?'#8a6a48':b.d==='canal'?'#556055':'#3c3f48';x.fillRect(X(b.x0),Z(b.z0),(b.x1-b.x0)/MS,(b.z1-b.z0)/MS);}
  x.fillStyle='#5a5f6c';for(const b of W.bld)x.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),b.w/MS,b.d/MS);
  const line=(P,wd,col)=>{x.strokeStyle=col;x.lineWidth=wd/MS;x.lineCap='round';x.lineJoin='round';x.beginPath();P.forEach((p,i)=>i?x.lineTo(X(p.x),Z(p.z)):x.moveTo(X(p.x),Z(p.z)));x.stroke();};
  for(const e of W.edges)if(e.kind==='street')line(e.pts,RW*2,'#9a9ca4');line(W.hill,12,'#9a9ca4');for(const r of W.ramps)line(r.pts,12,'#d8b06a');line(W.fwy,FWY_HW*2,'#e8c070');
  for(const e of W.edges)if(e.kind==='street')line(e.pts,.6,'rgba(30,30,36,.5)');
  return c;}
 w2m(x,z){return[(x-MB.x0)/MS,(z-MB.z0)/MS];}
 /* ---------- small helpers ---------- */
 banner(t,s,col,dur=2.5){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('banner').classList.add('on');this.banT=dur;}
 toast(t,dur=2.6){const e=$('toast');e.textContent=t;e.classList.add('on');this.toastT=dur;}
 big(t){const e=$('big');e.textContent=t;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');this.bigT=1;}
 objective(t,s){const e=$('obj');if(!t){e.hidden=true;return;}e.hidden=false;$('ot').textContent=t;$('os').textContent=s||'';}
 prompt(t){const e=$('prompt');if(e._t!==t){e._t=t;e.innerHTML=t||'';e.style.opacity=t?1:0;}}
 cashPop(n,label){const d=toast($('cashd'),'',2400,4);d.className='pop '+(n<0?'neg':'');d.textContent=(n<0?'-':'+')+fmtCash(Math.abs(n)).replace('-','')+(label?' '+label:'');}
 flash(){const f=$('flash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}
 /* ---------- per frame ---------- */
 update(dt){const G=this.G,P=G.player;if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)$('toast').classList.remove('on');}
  this.cashShown+=(G.cash-this.cashShown)*Math.min(1,dt*6);if(Math.abs(G.cash-this.cashShown)<1)this.cashShown=G.cash;this.set('cash',fmtCash(this.cashShown));
  const h=G.hour,hh=Math.floor(h)%24,mm=Math.floor((h%1)*60);this.set('tod',String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'));this.set('left','DAY ENDS '+fmtClock(G.clock));$('left').classList.toggle('low',G.clock<60);
  this.set('rep',G.rank()+' · '+G.rep+' REP');
  const st=G.police.stars,flash=!G.police.seen&&st>0&&(G.police.flash*3%1<.5);let s='';for(let i=0;i<5;i++)s+=`<i class="${i<st?(flash?'f':'on'):''}">★</i>`;if(this._st!==s){this._st=s;$('stars').innerHTML=s;}
  const v=P.veh;$('veh').hidden=!v;if(v){this.set('kmh',Math.round(Math.abs(v.vf)*3.6));this.set('vname',v.spec.name+(v.owned?'':''));$('vhp').style.width=Math.max(0,100-v.dmg/v.hp*100)+'%';$('vhp').classList.toggle('low',v.dmg>v.hp*.6);}
  this.set('zone',G.zoneName);const m=G.missions.active;if(m&&m.timer!=null){$('otime').hidden=false;this.set('otime',fmtClock(m.timer));$('otime').classList.toggle('low',m.timer<10);}else $('otime').hidden=true;
  const bt=G.police.bustT;$('bust').hidden=bt<=.05;if(bt>.05)$('bustb').style.width=Math.min(100,bt/2.4*100)+'%';
  this.drawMini();if(this.mapOpen)this.drawMap();}
 set(id,v){const e=this.el[id]||(this.el[id]=$(id));if(e._v!==v){e._v=v;if(typeof v==='string'&&v.includes('<'))e.innerHTML=v;else e.textContent=v;}}
 /* ---------- minimap ---------- */
 drawMini(){const G=this.G,x=this.mini,S=220,P=G.player;const yaw=G.viewYaw??G.camYaw;const scale=P.veh&&P.veh.speed>20?.75:1.05;// px per metre
  x.save();x.clearRect(0,0,S,S);x.beginPath();x.arc(S/2,S/2,S/2-2,0,7);x.clip();x.fillStyle='#14361e';x.fillRect(0,0,S,S);
  x.translate(S/2,S/2+18);x.rotate(yaw+Math.PI);x.scale(scale,scale);const[mx,mz]=this.w2m(P.x,P.z);x.scale(MS,MS);x.translate(-mx,-mz);x.imageSmoothingEnabled=true;x.drawImage(this.base,0,0);
  // GPS route
  const r=G.route;if(r&&r.length>1){x.strokeStyle='#ff4d00';x.lineWidth=5/scale/MS;x.lineJoin='round';x.lineCap='round';x.shadowColor='#ff4d00';x.shadowBlur=6;x.beginPath();r.forEach((p,i)=>{const[a,b]=this.w2m(p.x,p.z);i?x.lineTo(a,b):x.moveTo(a,b);});x.stroke();x.shadowBlur=0;}
  const dot=(wx,wz,col,rad,txt)=>{const[a,b]=this.w2m(wx,wz);x.save();x.translate(a,b);x.rotate(-(yaw+Math.PI));x.scale(1/scale/MS,1/scale/MS);x.fillStyle=col;x.beginPath();x.arc(0,0,rad,0,7);x.fill();if(txt){x.fillStyle='#000';x.font='bold 9px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,0,.5);}x.restore();};
  if(!G.missions.active)for(const p of G.W.pois){const K=KIND[p.kind];if(!K.icon)continue;dot(p.x,p.z,'#'+new THREE.Color(K.col).getHexString(),7,K.icon);}
  for(const s of G.W.stunts)if(!s.done&&Math.hypot(s.x-P.x,s.z-P.z)<260)dot(s.x,s.z,'#ffe14a',3.5);
  const g=G.gpsTarget;if(g)dot(g.x,g.z,'#ff4d00',6,'');
  for(const v of G.vehicles){if(v.cop&&(v.cop.chase||v.cop.block)){const f=G.time*4%2<1;dot(v.x,v.z,f?'#ff3040':'#3d6bff',4.2);}else if(v.racer)dot(v.x,v.z,'#ffb000',3.6);}
  x.restore();
  // player arrow + north marker
  x.save();x.translate(S/2,S/2+18);x.rotate(-(P.yaw-yaw)+0);x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=1.5;x.beginPath();x.moveTo(0,-9);x.lineTo(6.5,7);x.lineTo(0,3.5);x.lineTo(-6.5,7);x.closePath();x.fill();x.stroke();x.restore();
  const na=yaw+Math.PI;const nx=S/2+Math.sin(na)*(S/2-14),nz=S/2-Math.cos(na)*(S/2-14);x.fillStyle='rgba(0,0,0,.6)';x.beginPath();x.arc(nx,nz,8,0,7);x.fill();x.fillStyle='#fff';x.font='bold 10px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText('N',nx,nz+.5);
  if(G.police.stars>0){x.strokeStyle=G.time*4%2<1?'rgba(255,48,64,.8)':'rgba(61,107,255,.8)';x.lineWidth=5;x.beginPath();x.arc(S/2,S/2,S/2-4,0,7);x.stroke();}}
 /* ---------- full map ---------- */
 bindMap(){const c=$('mapc');let drag=null;c.addEventListener('mousedown',e=>{drag={x:e.clientX,y:e.clientY,px:this.mapPan.x,pz:this.mapPan.z,moved:false};});
  addEventListener('mousemove',e=>{if(!drag)return;const k=this.mapK();const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;this.mapPan.x=drag.px-dx/k;this.mapPan.z=drag.pz-dy/k;});
  addEventListener('mouseup',e=>{if(drag&&!drag.moved&&this.mapOpen){const r=c.getBoundingClientRect();const k=this.mapK();const wx=(e.clientX-r.left-r.width/2)/k+this.mapPan.x,wz=(e.clientY-r.top-r.height/2)/k+this.mapPan.z;this.G.setWaypoint(wx,wz);}drag=null;});
  c.addEventListener('wheel',e=>{e.preventDefault();this.mapZoom=cl(this.mapZoom*(e.deltaY<0?1.15:1/1.15),.6,5);},{passive:false});}
 mapK(){const c=$('mapc');return Math.min(c.width/(MB.x1-MB.x0),c.height/(MB.z1-MB.z0))*this.mapZoom/ (devicePixelRatio>1?1:1);}
 openMap(on){this.mapOpen=on;$('map').hidden=!on;if(on){const c=$('mapc');c.width=c.clientWidth;c.height=c.clientHeight;this.mapPan.x=this.G.player.x;this.mapPan.z=this.G.player.z;this.mapZoom=1.6;this.drawMap();this.legend();}}
 legend(){const L=[['T','TAXI SHIFT','#ffc61a'],['D','PACKAGE RUN','#7dff6a'],['R','STREET RACE','#ff4d00'],['C','TIME TRIAL','#36f0ff'],['P','PHOTO HUNT','#ff3fa4'],['!','HOT PURSUIT','#3d8bff'],['$','GARAGE','#8a7cff'],['S','SPRAY SHOP','#ff8a3d'],['H','SAFEHOUSE','#ffffff'],['•','STUNT JUMP','#ffe14a']];
  $('legend').innerHTML=L.map(([i,t,c])=>`<div><b style="background:${c}">${i}</b>${t}</div>`).join('')+'<p>CLICK TO SET A WAYPOINT · DRAG TO PAN · WHEEL TO ZOOM · M TO CLOSE</p>';}
 drawMap(){const G=this.G,c=$('mapc'),x=c.getContext('2d'),k=this.mapK();x.fillStyle='#0e2a3c';x.fillRect(0,0,c.width,c.height);x.save();x.translate(c.width/2,c.height/2);x.scale(k,k);x.translate(-this.mapPan.x,-this.mapPan.z);
  x.drawImage(this.base,MB.x0,MB.z0,(MB.x1-MB.x0),(MB.z1-MB.z0));const r=G.route;if(r&&r.length>1){x.strokeStyle='#ff4d00';x.lineWidth=5/k;x.beginPath();r.forEach((p,i)=>i?x.lineTo(p.x,p.z):x.moveTo(p.x,p.z));x.stroke();}
  const ic=(wx,wz,col,t,rad=9)=>{x.save();x.translate(wx,wz);x.scale(1/k,1/k);x.fillStyle=col;x.strokeStyle='#000';x.lineWidth=2;x.beginPath();x.arc(0,0,rad,0,7);x.fill();x.stroke();if(t){x.fillStyle='#000';x.font='bold 11px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(t,0,1);}x.restore();};
  for(const p of G.W.pois){const K=KIND[p.kind];if(K.icon)ic(p.x,p.z,'#'+new THREE.Color(K.col).getHexString(),K.icon);}for(const s of G.W.stunts)ic(s.x,s.z,s.done?'#666':'#ffe14a','',5);
  if(G.gpsTarget)ic(G.gpsTarget.x,G.gpsTarget.z,'#ff4d00','◎',8);
  x.save();x.translate(G.player.x,G.player.z);x.scale(1/k,1/k);x.rotate(-G.player.yaw);x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=2;x.beginPath();x.moveTo(0,12);x.lineTo(8,-8);x.lineTo(0,-3);x.lineTo(-8,-8);x.closePath();x.fill();x.stroke();x.restore();
  x.font=`bold ${Math.round(13/k)}px "JetBrains Mono",monospace`;x.fillStyle='rgba(255,255,255,.55)';x.textAlign='center';for(const[t,a,b]of[['DOWNTOWN',90,-190],['NEON STRIP',-60,250],['OCEAN DRIVE',-200,395],['PALMWOOD',-410,40],['PORT SALT',575,-40],['CREST RIDGE',-160,-610],['SUNSET BEACH',150,470],['MIDTOWN',-150,-90],['THE BAY',400,600]])x.fillText(t,a,b);
  x.restore();}
 /* ---------- phone ---------- */
 bindPhone(){$('phone').addEventListener('click',e=>{const it=e.target.closest('[data-i]');if(it){this.sel=+it.dataset.i;this.phoneEnter();}const bk=e.target.closest('.pback');if(bk)this.phoneBack();});}
 togglePhone(on=!this.phoneOpen){this.phoneOpen=on;$('phone').classList.toggle('on',on);if(on){this.phoneApp='home';this.sel=0;this.renderPhone();this.G.snd.play('phone');}}
 phoneItems(){const G=this.G;if(this.phoneApp==='home')return[['JOBS','Missions near you'],['MAP','Full city map'],['RADIO',STATIONS[G.snd.station].name],['GARAGE','Your cars'],['STATS','How the day is going'],[G.missions.active?'QUIT JOB':'CLEAR GPS',G.missions.active?'Abandon the current mission':'Remove the waypoint']];
  if(this.phoneApp==='jobs'){const P=G.player;return G.W.pois.filter(p=>KIND[p.kind].icon&&p.kind!=='home').map(p=>[p.name,KIND[p.kind].label+' · '+Math.round(Math.hypot(p.x-P.x,p.z-P.z))+' m',p]).sort((a,b)=>Math.hypot(a[2].x-P.x,a[2].z-P.z)-Math.hypot(b[2].x-P.x,b[2].z-P.z));}
  if(this.phoneApp==='radio')return STATIONS.map((s,i)=>[s.name,s.tag+(i===G.snd.station?' · ON AIR':''),i]);
  if(this.phoneApp==='garage')return SHOP.map(id=>[SPECS[id].name,G.owned.includes(id)?'OWNED · GPS to the garage':fmtCash(SPECS[id].price)+' at Bayside Motors',id]);
  if(this.phoneApp==='stats'){const s=G.stats;return[['CASH',fmtCash(G.cash)],['EARNED TODAY',fmtCash(s.earned)],['REPUTATION',G.rep+' · '+G.rank()],['MISSIONS PASSED',String(G.missions.passed)],['BEST RACE',fmtRace(s.bestRace)],['STUNT JUMPS',s.stunts+' / '+G.W.stunts.length],['PHOTOS',String(s.photos)],['TIMES BUSTED',String(s.busted)]];}return[];}
 renderPhone(){const items=this.phoneItems();const title={home:'NEON BAY',jobs:'JOBS',radio:'RADIO',garage:'GARAGE',stats:'STATS'}[this.phoneApp];this.sel=cl(this.sel,0,Math.max(0,items.length-1));
  $('pbody').innerHTML=`<div class="ptop"><span>${this.phoneApp!=='home'?'<b class="pback">‹</b>':''}${title}</span><i>${String(Math.floor(this.G.hour)%24).padStart(2,'0')}:${String(Math.floor(this.G.hour%1*60)).padStart(2,'0')}</i></div>`+
   items.map((it,i)=>`<div class="pit${i===this.sel?' on':''}" data-i="${i}"><b>${it[0]}</b><span>${it[1]}</span></div>`).join('')+`<p class="phint">↑ ↓ SELECT · ENTER OPEN · BACKSPACE BACK · T CLOSE</p>`;
  const on=$('pbody').querySelector('.pit.on');if(on)on.scrollIntoView({block:'nearest'});}
 phoneKey(code){if(!this.phoneOpen)return false;const n=this.phoneItems().length;if(code==='ArrowUp'||code==='KeyW'&&false){this.sel=(this.sel-1+n)%n;this.renderPhone();this.G.snd.play('phone');return true;}if(code==='ArrowDown'){this.sel=(this.sel+1)%n;this.renderPhone();this.G.snd.play('phone');return true;}
  if(code==='Enter'||code==='NumpadEnter'){this.phoneEnter();return true;}if(code==='Backspace'||code==='ArrowLeft'){this.phoneBack();return true;}return false;}
 phoneBack(){if(this.phoneApp==='home')this.togglePhone(false);else{this.phoneApp='home';this.sel=0;this.renderPhone();}}
 phoneEnter(){const G=this.G,it=this.phoneItems()[this.sel];if(!it)return;G.snd.play('phone');
  if(this.phoneApp==='home'){const k=['jobs','map','radio','garage','stats','quit'][this.sel];if(k==='map'){this.togglePhone(false);G.toggleMap(true);return;}if(k==='quit'){if(G.missions.active)G.missions.abort();else G.setWaypoint(null);this.togglePhone(false);return;}this.phoneApp=k;this.sel=0;this.renderPhone();return;}
  if(this.phoneApp==='jobs'){const p=it[2];G.setWaypoint(p.x,p.z);this.toast('GPS SET · '+p.name);this.togglePhone(false);return;}
  if(this.phoneApp==='radio'){G.setStation(it[2]);this.renderPhone();return;}
  if(this.phoneApp==='garage'){const g=G.W.pois.find(p=>p.kind==='garage');G.setWaypoint(g.x,g.z);this.toast('GPS SET · BAYSIDE MOTORS');this.togglePhone(false);return;}}
 /* ---------- garage + spray ---------- */
 openShop(kind){const G=this.G;this.shopOpen=kind;$('shop').hidden=false;this.shopSel=0;this.renderShop();}
 closeShop(){this.shopOpen=null;$('shop').hidden=true;}
 renderShop(){const G=this.G,k=this.shopOpen;if(!k)return;let h='';
  if(k==='garage'){h=`<p class="eye">BAYSIDE MOTORS · CASH ${fmtCash(G.cash)}</p><h2>PICK YOUR RIDE<em>.</em></h2><div class="cars">`+SHOP.map((id,i)=>{const s=SPECS[id],own=G.owned.includes(id);const bar=(v,m)=>`<i><u style="width:${Math.round(cl(v/m,0,1)*100)}%"></u></i>`;
    return`<div class="car${i===this.shopSel?' on':''}" data-c="${id}"><b>${s.name}</b><span class="cls">${s.cls}</span><p>${s.blurb||''}</p><div class="st"><label>SPEED</label>${bar(s.max,70)}<label>ACCEL</label>${bar(s.acc,26)}<label>GRIP</label>${bar(s.grip,10)}<label>ARMOUR</label>${bar(s.hp,220)}</div><button class="${own?'ghost':'go'}" data-buy="${id}">${own?'TAKE IT':s.price?'BUY '+fmtCash(s.price):'FREE'}</button></div>`;}).join('')+`</div><div class="row"><button class="ghost" id="shopx">CLOSE (ESC)</button></div>`;}
  else{const v=G.player.veh;h=`<p class="eye">SPRAY 'N' SHINE · CASH ${fmtCash(G.cash)}</p><h2>FRESH COAT<em>.</em></h2><p class="how">$150 respray: full repair${G.police.stars?' and <b>the cops lose your description</b>':''}. Pick a colour.</p><div class="sw">`+PAINTS.map(c=>`<button data-paint="${c}" style="background:#${new THREE.Color(c).getHexString()}" class="${v&&v.paint===c?'on':''}"></button>`).join('')+`</div><div class="row"><button class="ghost" id="shopx">CLOSE (ESC)</button></div>`;}
  $('shop').innerHTML=h;$('shop').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>G.buyCar(b.dataset.buy));$('shop').querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>G.respray(+b.dataset.paint));const x=$('shopx');if(x)x.onclick=()=>this.closeShop();}}
