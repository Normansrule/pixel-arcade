// COURT KINGS — original fictional teams, rosters, ratings, difficulty and logos (no real leagues, clubs or players).
// pat: 0 plain · 1 side panels · 2 pinstripes · 3 fade · 4 chest band
export const TEAMS=[
 {city:'Harbor City',n:'Breakers',s:'HCB',r:88,c1:'#0f8f94',c2:'#0b1c33',c3:'#f2f2f2',alt:{c1:'#f4f4f2',c2:'#0f8f94'},pat:1,logo:0,arena:'THE DOCKYARD'},
 {city:'Ironridge',n:'Forge',s:'IRF',r:85,c1:'#ff6a13',c2:'#1d1f24',c3:'#ffffff',alt:{c1:'#1d1f24',c2:'#ff6a13'},pat:4,logo:1,arena:'FOUNDRY HALL'},
 {city:'Sunvale',n:'Flares',s:'SVF',r:83,c1:'#f5b70f',c2:'#4b1d7a',c3:'#ffffff',alt:{c1:'#4b1d7a',c2:'#f5b70f'},pat:3,logo:2,arena:'SOLSTICE CENTER'},
 {city:'Glacier Bay',n:'Huskies',s:'GBH',r:81,c1:'#bfe3ff',c2:'#123a6b',c3:'#ffffff',alt:{c1:'#123a6b',c2:'#bfe3ff'},pat:2,logo:3,arena:'ICEHOUSE'},
 {city:'Crescent',n:'Monarchs',s:'CRM',r:86,c1:'#b0122b',c2:'#121216',c3:'#e8c35a',alt:{c1:'#121216',c2:'#b0122b'},pat:4,logo:4,arena:'THE CROWN'},
 {city:'Redrock',n:'Vipers',s:'RRV',r:79,c1:'#1f7a3e',c2:'#0d0f0e',c3:'#c9f73a',alt:{c1:'#0d0f0e',c2:'#c9f73a'},pat:1,logo:5,arena:'CANYON DOME'},
 {city:'Bayshore',n:'Tides',s:'BST',r:77,c1:'#ff6f61',c2:'#13324d',c3:'#ffffff',alt:{c1:'#13324d',c2:'#ff6f61'},pat:3,logo:6,arena:'TIDEPOOL ARENA'},
 {city:'Capital',n:'Sentinels',s:'CPS',r:84,c1:'#1b3fa0',c2:'#d7263d',c3:'#ffffff',alt:{c1:'#f4f4f2',c2:'#1b3fa0'},pat:2,logo:7,arena:'MONUMENT GARDEN'}];
export const POS=['PG','SG','SF','PF','C'];
// CPU difficulty: shot bias, reaction time (s), steal + block aggression, help defence, switching on screens, decision IQ, pace, human green window scale
export const DIFF=[
 {n:'EASY',shot:-.1,react:.42,steal:.35,block:.4,help:.35,sw:false,iq:.55,pace:.93,win:1.35,foul:.6},
 {n:'NORMAL',shot:0,react:.26,steal:.7,block:.75,help:.75,sw:true,iq:.82,pace:1,win:1,foul:1},
 {n:'HARD',shot:.06,react:.14,steal:1,block:1,help:1,sw:true,iq:1,pace:1.04,win:.78,foul:1.15}];
const F=['Darnell','Marcus','Theo','Isaiah','Andre','Rafe','Corin','Jace','Malik','Tobias','Dorian','Quentin','Elias','Kade','Nico','Rowan','Sol','Bram','Lucan','Tariq','Ezra','Silas','Omari','Callum','Dante','Jalon','Kofi','Mateo','Reid','Zeke','Vance','Anton'];
const A=['Var','Kel','Mor','Dax','Tor','Bel','Ruan','Sil','Ost','Pell','Quin','Mar','Lev','Cor','Fen','Hal','Jor','Nev','Riv','Tam','Vel','Zan','Ade','Oku','Bri','Cas','Dren','Ell','Gal','Ivo','Yar','Sev','Lom','Dov','Ash','Kov','Wes','Thorn'];
const B=['ner','ridge','ston','ez','away','ow','ford','ini','ek','o','ard','ley','ick','ena','sen','ry','ado','ski','ton','well','ves','ett','ula','imo','ax','by','ens','ou','mond','field'];
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
export const SKIN=['#f1c9a5','#e0ac85','#c68b5f','#a8714a','#8a5636','#6b3f26','#4f2d1c','#3c2215'];
export const HAIR=['#1a1410','#2e1f14','#4a3018','#6b4a26','#a3773e','#d6b06a','#121212','#3b2a22'];
// position archetypes: bonus per attribute
const ARCH={PG:{three:4,mid:3,ins:-2,dunk:-10,ft:5,pass:10,hand:10,spd:8,perd:3,stl:6,blk:-14,reb:-12,hops:2},
 SG:{three:8,mid:5,ins:0,dunk:-3,ft:4,pass:2,hand:5,spd:6,perd:4,stl:4,blk:-9,reb:-8,hops:4},
 SF:{three:2,mid:3,ins:3,dunk:4,ft:0,pass:0,hand:0,spd:2,perd:5,stl:2,blk:-2,reb:-1,hops:5},
 PF:{three:-6,mid:0,ins:6,dunk:8,ft:-4,pass:-4,hand:-8,spd:-3,perd:-2,stl:-3,blk:6,reb:8,hops:2},
 C:{three:-16,mid:-6,ins:9,dunk:12,ft:-12,pass:-6,hand:-15,spd:-8,perd:-6,stl:-6,blk:12,reb:14,hops:0}};
const HCM={PG:[185,193],SG:[192,199],SF:[198,204],PF:[203,209],C:[208,217]};
// deterministic five-man rotation per team with 0-99 ratings
export function roster(ti){const T=TEAMS[ti],rr=rng(ti*7919+101);const used=new Set(),nums=new Set();
 return POS.map((pos,i)=>{let nm;do{nm=F[rr()*F.length|0]+' '+A[rr()*A.length|0]+B[rr()*B.length|0];}while(used.has(nm));used.add(nm);
  let num;do{num=[0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,20,21,22,23,24,25,30,31,32,33,34,35,40,41,42,44,50,55][rr()*33|0];}while(nums.has(num));nums.add(num);
  const star=i===(ti%5)?6:0,at={};for(const k in ARCH[pos])at[k]=Math.max(30,Math.min(99,Math.round(T.r-4+ARCH[pos][k]+(rr()-.5)*12+star)));
  const[h0,h1]=HCM[pos],cm=Math.round(h0+rr()*(h1-h0));
  const ovr=Math.min(99,Math.round(pos==='PG'?at.pass*.25+at.hand*.2+at.three*.2+at.spd*.15+at.perd*.2:pos==='SG'?at.three*.3+at.mid*.2+at.hand*.15+at.spd*.15+at.perd*.2:
   pos==='SF'?at.three*.15+at.mid*.2+at.ins*.2+at.perd*.2+at.dunk*.1+at.reb*.15:pos==='PF'?at.ins*.25+at.reb*.25+at.blk*.15+at.dunk*.15+at.mid*.2:at.ins*.25+at.reb*.3+at.blk*.25+at.dunk*.2)+star*.5);
  return{name:nm,short:nm.split(' ')[0][0]+'. '+nm.split(' ')[1],last:nm.split(' ')[1].toUpperCase(),num,pos,at,ovr,cm,h:cm/186,skin:rr(),hair:rr(),style:rr()*4|0,sleeve:rr()<.3,band:rr()<.25,shoe:rr()*4|0};});}
export const SHOES=['#f4f4f2','#151515','#e8e8e8','#ff4d00'];
export function hexToRgb(h){const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
const clash=(a,b)=>{const x=hexToRgb(a),y=hexToRgb(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])<.5;};
// home team wears its home jersey; the road team switches to its alternate if the colours clash
export function kitsFor(h,a){const H=TEAMS[h],Aw=TEAMS[a];const hk={c1:H.c1,c2:H.c2,c3:H.c3,pat:H.pat};let ak={c1:Aw.c1,c2:Aw.c2,c3:Aw.c3,pat:Aw.pat};
 if(clash(hk.c1,ak.c1))ak={c1:Aw.alt.c1,c2:Aw.alt.c2,c3:Aw.c3,pat:Aw.pat};if(clash(hk.c1,ak.c1))ak={c1:'#f4f4f2',c2:Aw.c1,c3:Aw.c2,pat:Aw.pat};return[hk,ak];}
// team logo drawn into a 2d context at size s (original simple marks)
export function logo(x,ti,s){const T=TEAMS[ti];x.save();x.scale(s/64,s/64);x.lineJoin='round';x.lineCap='round';
 x.beginPath();x.arc(32,32,29,0,7);x.fillStyle=T.c2;x.fill();x.lineWidth=3;x.strokeStyle=T.c1;x.stroke();x.beginPath();x.arc(32,32,24,0,7);x.lineWidth=1.5;x.strokeStyle=T.c3;x.globalAlpha=.6;x.stroke();x.globalAlpha=1;
 x.fillStyle=T.c1;x.strokeStyle=T.c1;x.lineWidth=4;x.beginPath();
 switch(T.logo){
  case 0:for(let i=0;i<3;i++){x.moveTo(12,26+i*8);for(let u=0;u<=40;u+=4)x.lineTo(12+u,26+i*8+Math.sin(u/40*Math.PI*2+i)*4);}x.stroke();break;// waves
  case 1:x.moveTo(18,46);x.lineTo(46,46);x.lineTo(42,38);x.lineTo(22,38);x.closePath();x.fill();x.fillRect(29,22,6,16);x.beginPath();x.moveTo(20,22);x.lineTo(44,22);x.lineTo(40,16);x.lineTo(24,16);x.closePath();x.fill();break;// anvil
  case 2:x.arc(32,34,9,0,7);x.fill();for(let i=0;i<10;i++){const a=i/10*6.283;x.beginPath();x.moveTo(32+Math.cos(a)*13,34+Math.sin(a)*13);x.lineTo(32+Math.cos(a)*19,34+Math.sin(a)*19);x.stroke();}break;// sun
  case 3:x.moveTo(16,44);x.lineTo(22,18);x.lineTo(30,30);x.lineTo(34,30);x.lineTo(42,18);x.lineTo(48,44);x.lineTo(32,52);x.closePath();x.fill();x.fillStyle=T.c2;x.fillRect(25,34,4,3);x.fillRect(35,34,4,3);break;// husky
  case 4:x.moveTo(14,44);x.lineTo(14,22);x.lineTo(23,32);x.lineTo(32,16);x.lineTo(41,32);x.lineTo(50,22);x.lineTo(50,44);x.closePath();x.fill();break;// crown
  case 5:x.lineWidth=6;x.moveTo(16,40);x.bezierCurveTo(24,20,34,52,42,28);x.lineTo(48,22);x.stroke();x.fillRect(44,18,6,6);break;// viper
  case 6:x.moveTo(12,40);x.quadraticCurveTo(26,10,50,26);x.quadraticCurveTo(36,24,34,40);x.closePath();x.fill();break;// wave crest
  default:x.moveTo(32,12);x.lineTo(48,22);x.lineTo(48,36);x.quadraticCurveTo(48,48,32,54);x.quadraticCurveTo(16,48,16,36);x.lineTo(16,22);x.closePath();x.fill();x.fillStyle=T.c2;x.fillRect(29,22,6,22);x.fillRect(22,29,20,6);}// shield
 x.fillStyle='#fff';x.strokeStyle=T.c2;x.lineWidth=3;x.font='700 11px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.strokeText(T.s,32,57-6);x.fillText(T.s,32,57-6);x.restore();}
