// AEONFALL — procedural ability, item and spell icons drawn on canvas (no image files). icon(glyph, colour) -> data URL.
const cache=new Map();
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16&255,g=n>>8&255,b=n&255;r=Math.min(255,r*k|0);g=Math.min(255,g*k|0);b=Math.min(255,b*k|0);return`rgb(${r},${g},${b})`;}
export function icon(g,col='#f0c45a',size=96){const key=g+col+size;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),s=size,h=s/2;
 const bg=x.createRadialGradient(h*.7,h*.6,4,h,h,s*.75);bg.addColorStop(0,shade(col,.55));bg.addColorStop(1,shade(col,.12));x.fillStyle=bg;x.fillRect(0,0,s,s);
 // faint rune ring
 x.strokeStyle=shade(col,.5);x.globalAlpha=.4;x.lineWidth=s*.02;x.beginPath();x.arc(h,h,s*.42,0,7);x.stroke();x.globalAlpha=1;
 x.save();x.translate(h,h);x.scale(s/100,s/100);x.shadowColor=col;x.shadowBlur=14;x.fillStyle='#fff';x.strokeStyle='#fff';x.lineWidth=6;x.lineCap='round';x.lineJoin='round';
 const P=(pts,fill=true,close=true)=>{x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));if(close)x.closePath();fill?x.fill():x.stroke();};
 const circ=(a,b,r,f=true)=>{x.beginPath();x.arc(a,b,r,0,7);f?x.fill():x.stroke();};
 const star=(r1,r2,n,rot=0)=>{const p=[];for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2+rot,r=i%2?r2:r1;p.push([Math.sin(a)*r,-Math.cos(a)*r]);}P(p);};
 x.fillStyle=shade(col,1.5);x.strokeStyle=shade(col,1.6);
 switch(g){
  case'rock':case'stone':P([[-24,10],[-18,-16],[4,-26],[24,-10],[22,14],[0,26],[-20,22]]);x.fillStyle='rgba(0,0,0,.25)';P([[-6,-4],[8,-12],[14,4],[0,12]]);if(g==='stone'){x.strokeStyle='#fff';x.lineWidth=3;x.beginPath();x.arc(0,0,34,0,7);x.stroke();}break;
  case'dash':case'step':case'leap':for(let i=0;i<3;i++){x.globalAlpha=.4+i*.3;P([[-30+i*14,-18],[-14+i*14,0],[-30+i*14,18],[-24+i*14,0]]);}x.globalAlpha=1;break;
  case'meteor':case'comet':circ(10,-10,15);x.lineWidth=7;x.beginPath();x.moveTo(-2,2);x.lineTo(-30,30);x.moveTo(6,8);x.lineTo(-18,32);x.moveTo(-6,-4);x.lineTo(-32,16);x.stroke();break;
  case'wave':case'tsunami':x.lineWidth=8;for(let k=0;k<(g==='tsunami'?3:2);k++){x.beginPath();for(let i=-34;i<=34;i+=2)x.lineTo(i,-10+k*16+Math.sin(i*.16)*8);x.stroke();}break;
  case'hook':x.lineWidth=7;x.beginPath();x.moveTo(0,-32);x.lineTo(0,14);x.stroke();x.beginPath();x.arc(0,8,20,0,Math.PI);x.stroke();P([[-24,4],[-14,14],[-26,16]]);P([[24,4],[14,14],[26,16]]);x.beginPath();x.moveTo(-12,-18);x.lineTo(12,-18);x.stroke();circ(0,-32,6,false);break;
  case'shield':P([[0,-32],[26,-20],[22,10],[0,32],[-22,10],[-26,-20]]);x.fillStyle='rgba(0,0,0,.25)';P([[0,-22],[16,-14],[13,6],[0,22]]);break;
  case'flame':case'ember':x.beginPath();x.moveTo(0,32);x.bezierCurveTo(-30,24,-24,-6,-6,-30);x.bezierCurveTo(-4,-12,8,-14,10,-24);x.bezierCurveTo(30,0,26,26,0,32);x.fill();x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.moveTo(0,28);x.bezierCurveTo(-12,22,-10,6,0,-4);x.bezierCurveTo(10,8,12,22,0,28);x.fill();break;
  case'slash':x.lineWidth=8;x.beginPath();x.arc(0,10,32,-2.6,-.5);x.stroke();x.lineWidth=4;x.beginPath();x.arc(0,10,22,-2.4,-.7);x.stroke();break;
  case'execute':case'sword':x.save();x.rotate(-.78);P([[-5,-36],[5,-36],[5,14],[-5,14]]);P([[-16,14],[16,14],[16,20],[-16,20]]);P([[-4,20],[4,20],[4,34],[-4,34]]);x.restore();if(g==='execute'){x.lineWidth=4;x.beginPath();x.moveTo(16,-30);x.lineTo(30,-16);x.stroke();}break;
  case'eye':x.beginPath();x.moveTo(-34,0);x.quadraticCurveTo(0,-30,34,0);x.quadraticCurveTo(0,30,-34,0);x.fill();x.fillStyle=shade(col,.3);circ(0,0,11);x.fillStyle='#fff';circ(-4,-4,4);break;
  case'claw':for(let i=-1;i<=1;i++){x.lineWidth=7;x.beginPath();x.moveTo(i*14-8,-30);x.quadraticCurveTo(i*14+10,0,i*14-2,32);x.stroke();}break;
  case'howl':x.lineWidth=5;for(let r=10;r<=34;r+=12){x.beginPath();x.arc(-14,0,r,-.8,.8);x.stroke();}P([[-34,-10],[-20,-14],[-20,14],[-34,10]]);break;
  case'frenzy':star(34,14,8);x.fillStyle=shade(col,.4);circ(0,0,10);break;
  case'star':star(34,13,5);break;
  case'well':x.lineWidth=5;for(let i=0;i<3;i++){x.beginPath();x.arc(0,0,12+i*10,i,i+4.4);x.stroke();}circ(0,0,6);break;
  case'nova':star(36,8,12);circ(0,0,12);break;
  case'snow':x.lineWidth=6;for(let i=0;i<3;i++){x.save();x.rotate(i*Math.PI/3);x.beginPath();x.moveTo(0,-32);x.lineTo(0,32);x.moveTo(-8,-22);x.lineTo(0,-14);x.lineTo(8,-22);x.moveTo(-8,22);x.lineTo(0,14);x.lineTo(8,22);x.stroke();x.restore();}break;
  case'shard':x.save();x.rotate(.6);P([[0,-36],[10,-6],[0,30],[-10,-6]]);x.restore();break;
  case'blink':star(18,6,4);x.globalAlpha=.6;circ(-20,16,6);circ(20,-16,5);x.globalAlpha=1;x.lineWidth=3;x.beginPath();x.arc(0,0,30,0,7);x.setLineDash([6,6]);x.stroke();x.setLineDash([]);break;
  case'storm':for(let i=0;i<9;i++){const a=i*.7,r=6+i*3.2;x.save();x.rotate(a);x.translate(r,0);star(7,2.5,6);x.restore();}break;
  case'wind':x.lineWidth=6;x.beginPath();x.moveTo(-32,-12);x.lineTo(10,-12);x.arc(10,-20,8,Math.PI/2,-Math.PI/2*1.5,true);x.stroke();x.beginPath();x.moveTo(-32,4);x.lineTo(20,4);x.arc(20,14,10,-Math.PI/2,Math.PI*.8);x.stroke();x.beginPath();x.moveTo(-22,18);x.lineTo(2,18);x.stroke();break;
  case'volley':for(let i=-2;i<=2;i++){x.save();x.rotate(i*.22);x.lineWidth=4;x.beginPath();x.moveTo(0,30);x.lineTo(0,-22);x.stroke();P([[-6,-20],[6,-20],[0,-34]]);x.restore();}break;
  case'hawk':P([[0,-10],[34,-24],[20,0],[30,6],[6,8],[0,30],[-6,8],[-30,6],[-20,0],[-34,-24]]);break;
  case'arrowbig':case'rail':x.save();x.rotate(.78);x.lineWidth=7;x.beginPath();x.moveTo(0,36);x.lineTo(0,-20);x.stroke();P([[-12,-16],[12,-16],[0,-38]]);if(g==='arrowbig'){P([[-10,30],[0,22],[10,30],[0,36]]);}x.restore();if(g==='rail'){x.lineWidth=3;x.beginPath();x.arc(0,0,30,0,7);x.stroke();}break;
  case'bolt':P([[6,-36],[-16,4],[0,4],[-8,36],[18,-8],[2,-8]]);break;
  case'grenade':circ(0,6,22);P([[-6,-18],[6,-18],[6,-26],[-6,-26]]);x.lineWidth=4;x.beginPath();x.arc(10,-28,8,Math.PI,0);x.stroke();break;
  case'recoil':x.lineWidth=7;x.beginPath();x.moveTo(-30,0);x.lineTo(20,0);x.stroke();P([[14,-12],[34,0],[14,12]]);star(14,5,6);break;
  case'leaf':x.beginPath();x.moveTo(-26,26);x.quadraticCurveTo(-30,-24,28,-28);x.quadraticCurveTo(26,26,-26,26);x.fill();x.strokeStyle=shade(col,.4);x.lineWidth=3;x.beginPath();x.moveTo(-24,24);x.lineTo(18,-18);x.stroke();break;
  case'thorn':x.lineWidth=6;x.beginPath();x.moveTo(-30,24);x.bezierCurveTo(-10,-10,10,20,30,-24);x.stroke();for(const[a,b,r]of[[-16,6,-.6],[0,4,.6],[16,-6,-.6]]){x.save();x.translate(a,b);x.rotate(r);P([[-4,0],[4,0],[0,-14]]);x.restore();}break;
  case'heal':P([[-8,-30],[8,-30],[8,-8],[30,-8],[30,8],[8,8],[8,30],[-8,30],[-8,8],[-30,8],[-30,-8],[-8,-8]]);break;
  case'flower':for(let i=0;i<6;i++){x.save();x.rotate(i*Math.PI/3);x.beginPath();x.ellipse(0,-17,9,15,0,0,7);x.fill();x.restore();}x.fillStyle='#fff';circ(0,0,9);break;
  case'tree':P([[0,-36],[24,-4],[12,-4],[28,18],[-28,18],[-12,-4],[-24,-4]]);P([[-5,18],[5,18],[5,34],[-5,34]]);break;
  case'skull':circ(0,-6,24);P([[-14,10],[14,10],[12,28],[-12,28]]);x.fillStyle=shade(col,.25);circ(-9,-6,7);circ(9,-6,7);P([[0,4],[4,12],[-4,12]]);break;
  case'shuriken':star(36,8,4,.4);x.fillStyle=shade(col,.3);circ(0,0,6);break;
  case'veil':x.globalAlpha=.85;x.beginPath();x.moveTo(-30,30);x.quadraticCurveTo(-34,-30,0,-32);x.quadraticCurveTo(34,-30,30,30);x.quadraticCurveTo(15,16,0,30);x.quadraticCurveTo(-15,16,-30,30);x.fill();x.globalAlpha=1;x.fillStyle=shade(col,.25);x.beginPath();x.ellipse(-10,-8,6,3,0,0,7);x.ellipse(10,-8,6,3,0,0,7);x.fill();break;
  case'lotus':for(let i=0;i<8;i++){x.save();x.rotate(i*Math.PI/4);P([[-4,-6],[4,-6],[0,-36]]);x.restore();}circ(0,0,10);break;
  case'dagger':x.save();x.rotate(-.78);P([[0,-34],[7,-8],[0,10],[-7,-8]]);P([[-12,10],[12,10],[12,15],[-12,15]]);P([[-3,15],[3,15],[3,30],[-3,30]]);x.restore();break;
  case'gem':P([[-20,-12],[-10,-24],[10,-24],[20,-12],[0,28]]);x.fillStyle='rgba(255,255,255,.5)';P([[-10,-12],[0,-22],[10,-12],[0,18]]);break;
  case'orb':circ(0,0,24);x.fillStyle='rgba(255,255,255,.6)';circ(-8,-8,8);break;
  case'heart':x.beginPath();x.moveTo(0,28);x.bezierCurveTo(-36,4,-26,-30,0,-12);x.bezierCurveTo(26,-30,36,4,0,28);x.fill();break;
  case'cloak':x.beginPath();x.moveTo(0,-30);x.quadraticCurveTo(-30,0,-24,30);x.lineTo(24,30);x.quadraticCurveTo(30,0,0,-30);x.fill();x.fillStyle=shade(col,.3);circ(0,-18,6);break;
  case'boot':P([[-14,-30],[8,-30],[8,10],[30,14],[30,28],[-14,28]]);break;
  case'fang':x.beginPath();x.moveTo(-16,-30);x.quadraticCurveTo(-24,10,0,34);x.quadraticCurveTo(-4,0,16,-30);x.closePath();x.fill();break;
  case'bow':x.lineWidth=7;x.beginPath();x.arc(-14,0,34,-1.1,1.1);x.stroke();x.lineWidth=2;x.beginPath();x.moveTo(3,-30);x.lineTo(3,30);x.stroke();x.lineWidth=4;x.beginPath();x.moveTo(-30,0);x.lineTo(30,0);x.stroke();P([[30,-6],[38,0],[30,6]]);break;
  case'axe':x.lineWidth=6;x.beginPath();x.moveTo(-20,30);x.lineTo(14,-22);x.stroke();x.beginPath();x.moveTo(6,-34);x.quadraticCurveTo(36,-26,30,4);x.lineTo(10,-10);x.closePath();x.fill();break;
  case'staff':x.lineWidth=6;x.beginPath();x.moveTo(-24,32);x.lineTo(12,-14);x.stroke();star(16,6,4);x.save();x.translate(16,-18);star(14,5,4);x.restore();break;
  case'book':P([[-28,-22],[0,-16],[28,-22],[28,24],[0,30],[-28,24]]);x.strokeStyle=shade(col,.3);x.lineWidth=3;x.beginPath();x.moveTo(0,-16);x.lineTo(0,30);x.stroke();break;
  default:star(30,12,6);}
 x.restore();
 const vg=x.createRadialGradient(h,h,s*.3,h,h,s*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=vg;x.fillRect(0,0,s,s);
 const u=c.toDataURL();cache.set(key,u);return u;}
