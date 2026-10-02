// STRIKER 11 — original fictional clubs, kits, formations, difficulty, squad generation.
// pat: 0 plain · 1 stripes · 2 hoops · 3 halves · 4 sash · 5 chest band · 6 contrast sleeves/side panels
export const CLUBS=[
 {n:'Northbridge Rovers',s:'NBR',r:84,home:{c1:'#d11f2f',c2:'#ffffff',sh:'#ffffff',so:'#d11f2f',pat:6},away:{c1:'#1a1c24',c2:'#d11f2f',sh:'#1a1c24',so:'#1a1c24',pat:5},gk:'#2fbf71',crest:0},
 {n:'Port Aldermere',s:'ALD',r:81,home:{c1:'#14275e',c2:'#f2c230',sh:'#14275e',so:'#f2c230',pat:5},away:{c1:'#f2c230',c2:'#14275e',sh:'#f2c230',so:'#14275e',pat:0},gk:'#ff6b9e',crest:1},
 {n:'Kestrel Vale',s:'KVL',r:79,home:{c1:'#1f8a4c',c2:'#ffffff',sh:'#ffffff',so:'#1f8a4c',pat:2},away:{c1:'#f3efe4',c2:'#1f8a4c',sh:'#1f8a4c',so:'#f3efe4',pat:5},gk:'#f0a020',crest:2},
 {n:'Ironmoor Athletic',s:'IRA',r:78,home:{c1:'#7a1f3d',c2:'#8fc8ef',sh:'#ffffff',so:'#7a1f3d',pat:6},away:{c1:'#8fc8ef',c2:'#7a1f3d',sh:'#7a1f3d',so:'#8fc8ef',pat:4},gk:'#d8e04a',crest:3},
 {n:'Solano Dynamo',s:'SOL',r:80,home:{c1:'#ff7a12',c2:'#121212',sh:'#121212',so:'#ff7a12',pat:4},away:{c1:'#121212',c2:'#ff7a12',sh:'#121212',so:'#121212',pat:4},gk:'#3fa9ff',crest:4},
 {n:'Riverhaven United',s:'RVU',r:83,home:{c1:'#6cb4ee',c2:'#ffffff',sh:'#ffffff',so:'#6cb4ee',pat:0},away:{c1:'#e8432e',c2:'#ffffff',sh:'#e8432e',so:'#e8432e',pat:6},gk:'#a14bd6',crest:5},
 {n:'Crown Heath',s:'CRH',r:76,home:{c1:'#5b2a86',c2:'#ffffff',sh:'#5b2a86',so:'#ffffff',pat:1},away:{c1:'#ffffff',c2:'#5b2a86',sh:'#ffffff',so:'#5b2a86',pat:2},gk:'#f2e14a',crest:6},
 {n:'Glasswick Town',s:'GLW',r:74,home:{c1:'#f5d000',c2:'#121212',sh:'#121212',so:'#f5d000',pat:1},away:{c1:'#2a62d6',c2:'#f5d000',sh:'#2a62d6',so:'#2a62d6',pat:5},gk:'#e04040',crest:7},
 {n:'Embervale Lions',s:'EMB',r:77,home:{c1:'#e8a317',c2:'#6b1020',sh:'#6b1020',so:'#e8a317',pat:5},away:{c1:'#6b1020',c2:'#e8a317',sh:'#6b1020',so:'#6b1020',pat:0},gk:'#29c2b5',crest:0},
 {n:'Tidewater Mariners',s:'TDM',r:75,home:{c1:'#0f8f8a',c2:'#ffffff',sh:'#0b3b4a',so:'#0f8f8a',pat:2},away:{c1:'#ffffff',c2:'#0f8f8a',sh:'#ffffff',so:'#0f8f8a',pat:6},gk:'#ff8a3a',crest:1},
 {n:'Stonegate SC',s:'STG',r:82,home:{c1:'#151515',c2:'#f4f4f4',sh:'#151515',so:'#151515',pat:1},away:{c1:'#d4af37',c2:'#151515',sh:'#151515',so:'#d4af37',pat:5},gk:'#7ad13c',crest:2},
 {n:'Lumen City',s:'LUM',r:86,home:{c1:'#f4f6fa',c2:'#19c3e6',sh:'#f4f6fa',so:'#19c3e6',pat:4},away:{c1:'#0d1b33',c2:'#19c3e6',sh:'#0d1b33',so:'#0d1b33',pat:4},gk:'#ff4fa0',crest:3},
 {n:'Brackenford',s:'BRK',r:72,home:{c1:'#1d4d2b',c2:'#ff8c1a',sh:'#1d4d2b',so:'#ff8c1a',pat:5},away:{c1:'#ff8c1a',c2:'#1d4d2b',sh:'#1d4d2b',so:'#ff8c1a',pat:0},gk:'#d6d6d6',crest:4},
 {n:'Corvana CF',s:'CVN',r:80,home:{c1:'#1a3fb0',c2:'#c81d25',sh:'#1a3fb0',so:'#c81d25',pat:3},away:{c1:'#f2f2f2',c2:'#c81d25',sh:'#1a3fb0',so:'#f2f2f2',pat:4},gk:'#33d17a',crest:5},
 {n:'Halcyon Comets',s:'HAL',r:73,home:{c1:'#ff5fa2',c2:'#151515',sh:'#151515',so:'#ff5fa2',pat:0},away:{c1:'#151515',c2:'#ff5fa2',sh:'#151515',so:'#151515',pat:1},gk:'#3ad1ff',crest:6},
 {n:'Granite Peak',s:'GPK',r:71,home:{c1:'#7d8590',c2:'#b8f53b',sh:'#3a3f47',so:'#b8f53b',pat:6},away:{c1:'#b8f53b',c2:'#3a3f47',sh:'#3a3f47',so:'#b8f53b',pat:5},gk:'#ff6a3a',crest:7}];

// slots: x lateral (-1 left .. 1 right), z depth (0 own goal line .. 1 opponent goal line) in the compact defensive block
export const FORMS={
 '4-4-2':[['GK',0,.02],['DF',-.74,.2],['DF',-.26,.17],['DF',.26,.17],['DF',.74,.2],['MF',-.72,.4],['MF',-.22,.36],['MF',.22,.36],['MF',.72,.4],['FW',-.2,.56],['FW',.22,.58]],
 '4-3-3':[['GK',0,.02],['DF',-.74,.2],['DF',-.26,.17],['DF',.26,.17],['DF',.74,.2],['MF',-.42,.37],['MF',0,.32],['MF',.42,.37],['FW',-.7,.55],['FW',0,.6],['FW',.7,.55]],
 '3-5-2':[['GK',0,.02],['DF',-.5,.18],['DF',0,.16],['DF',.5,.18],['MF',-.86,.4],['MF',-.36,.36],['MF',0,.3],['MF',.36,.36],['MF',.86,.4],['FW',-.2,.57],['FW',.2,.59]]};
export const FORMS5={'4-4-2':[['GK',0,.03],['DF',-.5,.24],['DF',.5,.24],['FW',-.45,.55],['FW',.45,.55]],
 '4-3-3':[['GK',0,.03],['DF',0,.22],['MF',-.6,.4],['MF',.6,.4],['FW',0,.6]],
 '3-5-2':[['GK',0,.03],['DF',-.45,.22],['DF',.45,.22],['MF',0,.42],['FW',0,.62]]};
export const FORM_NAMES=Object.keys(FORMS);

// CPU difficulty: reaction delay, tackle skill, shot accuracy multiplier (error), keeper save factor, pass error, pressing, pace
export const DIFF=[
 {n:'AMATEUR',react:.42,tackle:.3,shotErr:1.6,save:.56,passErr:1.6,press:.55,pace:.93,decide:1.25,r:-6},
 {n:'PRO',react:.25,tackle:.5,shotErr:1.05,save:.77,passErr:1,press:.8,pace:1,decide:1,r:0},
 {n:'WORLD CLASS',react:.13,tackle:.68,shotErr:.72,save:.88,passErr:.65,press:1,pace:1.04,decide:.8,r:5}];

// deterministic per-club squads (original invented names)
const A=['Var','Kel','Mor','Dax','Tor','Bel','Ruan','Sil','Ost','Pell','Quin','Mar','Lev','Cor','Fen','Hal','Jor','Nev','Riv','Tam','Vel','Zan','Ade','Oku','Bri','Cas','Dren','Eli','Gal','Ivo','Yar','Sev','Lom','Dov','Ari','Kov'];
const B=['no','ra','sson','ez','ani','ow','ford','ini','ek','o','ard','ley','ic','ena','sen','ri','ado','ski','ton','ec','ves','ett','ula','imo','ax','ard','ens','ou'];
const I='ABCDEFGHJKLMNOPRSTVWYZ';
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
// returns 11 players for formation slots with attributes 0-99
export function squad(ci,form,size=11){const c=CLUBS[ci],rr=rng(ci*7919+13),slots=(size===5?FORMS5:FORMS)[form];const used=new Set();
 const nums={GK:[1],DF:[2,3,4,5,6,12,15],MF:[8,6,10,14,16,18,7],FW:[9,11,7,19,17,20]};const taken=new Set();
 return slots.map(([role,x,z],i)=>{let nm;do{nm=I[rr()*I.length|0]+'. '+A[rr()*A.length|0]+B[rr()*B.length|0];}while(used.has(nm));used.add(nm);
  let num=nums[role].find(n=>!taken.has(n))||(22+i);taken.add(num);
  const v=()=>Math.round((rr()-.5)*10),r=c.r;
  const at={pace:r+v()+(role==='FW'?4:role==='DF'?-2:0),shot:r+v()+(role==='FW'?6:role==='MF'?0:role==='GK'?-30:-10),pass:r+v()+(role==='MF'?5:role==='GK'?-14:0),
   drib:r+v()+(role==='FW'?4:role==='MF'?2:role==='GK'?-30:-6),def:r+v()+(role==='DF'?7:role==='MF'?0:role==='GK'?-20:-16),gk:role==='GK'?r+v()+4:30,head:r+v()};
  for(const k in at)at[k]=Math.max(25,Math.min(97,at[k]));
  const ovr=role==='GK'?at.gk:role==='DF'?Math.round(at.def*.5+at.pace*.2+at.pass*.15+at.head*.15):role==='MF'?Math.round(at.pass*.4+at.drib*.25+at.def*.15+at.shot*.2):Math.round(at.shot*.45+at.pace*.25+at.drib*.3);
  return{name:nm,num,role,x,z,at,ovr,skin:rr(),hair:rr(),boot:rr()*5|0,h:.95+rr()*.1};});}
export const SKIN=['#f1c9a5','#e0ac85','#c68b5f','#a8714a','#8a5636','#6b3f26','#4f2d1c'];
export const HAIR=['#1a1410','#2e1f14','#4a3018','#6b4a26','#a3773e','#d6b06a','#121212','#3b2a22','#8c4a2a'];
export const BOOTS=['#141414','#f2f2f2','#ff4d00','#2ad1ff','#d6ff3a'];
// clash: if both shirts look too similar, the away side switches kit
export function hexToRgb(h){const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
export function clash(a,b){const x=hexToRgb(a),y=hexToRgb(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])<.45;}
export function kitsFor(h,a){const H=CLUBS[h].home;let Akit=CLUBS[a].home;if(clash(H.c1,Akit.c1)||clash(H.sh,Akit.sh)&&clash(H.c2,Akit.c2))Akit=CLUBS[a].away;if(clash(H.c1,Akit.c1))Akit={...Akit,c1:'#f4f4f4',c2:Akit.c1};return[H,Akit];}
// draw a club crest into a 2d context (original simple heraldic shapes)
export function crest(x,ci,s){const c=CLUBS[ci],k=c.home;x.save();x.scale(s/64,s/64);x.lineJoin='round';
 const shape=c.crest%4;x.beginPath();if(shape===0){x.moveTo(8,6);x.lineTo(56,6);x.lineTo(56,30);x.quadraticCurveTo(56,50,32,60);x.quadraticCurveTo(8,50,8,30);x.closePath();}
 else if(shape===1){x.arc(32,32,27,0,7);}else if(shape===2){x.moveTo(32,4);x.lineTo(58,18);x.lineTo(58,44);x.lineTo(32,60);x.lineTo(6,44);x.lineTo(6,18);x.closePath();}
 else{x.moveTo(10,8);x.lineTo(54,8);x.lineTo(50,46);x.lineTo(32,60);x.lineTo(14,46);x.closePath();}
 x.fillStyle=k.c1;x.fill();x.save();x.clip();x.fillStyle=k.c2;const p=c.crest>>2;if(p===0)for(let i=0;i<4;i++)x.fillRect(10+i*13,0,6,64);else{x.beginPath();x.moveTo(0,64);x.lineTo(64,10);x.lineTo(64,26);x.lineTo(0,80);x.fill();}x.restore();
 x.lineWidth=4;x.strokeStyle='#0b0d12';x.stroke();x.lineWidth=1.5;x.strokeStyle=k.c2;x.stroke();
 x.fillStyle='#fff';x.strokeStyle='#0b0d12';x.lineWidth=3;x.font='700 17px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.strokeText(c.s,32,33);x.fillText(c.s,32,33);x.restore();}
