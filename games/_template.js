// Copy this file to games/yourname.js, add a <script> tag in index.html, run `node test.js`.
(function(){const A=window.A,{W,H,K}=A;
A.add({id:'mygame',name:'MY GAME',cat:'CLASSICS',how:'MOVE. CATCH THE STARS.',make(){
  const g={over:null,score:0};let x=160,star={x:100,y:0};
  g.update=()=>{const k=A.in(0);x+=((k.r?1:0)-(k.l?1:0))*3;star.y+=2;
    if(star.y>220){if(Math.abs(star.x-x)<14){g.score++;A.sfx('coin');A.burst(star.x,star.y,K.y);star={x:A.rnd(W),y:0};}else g.over='GAME OVER';}};
  g.draw=()=>{A.cls();A.rect(x-12,222,24,6,K.c);A.circ(star.x,star.y,3,K.y);A.text('SCORE '+g.score,6,6,K.w,2);};
  return g;}});
})();
