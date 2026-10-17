/* PIXEL ARCADE engine · Round clock: category time limits, per-game overrides, round start. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
E.begin=begin;E.start=start;
// every cabinet runs against a round clock: per-game `time` (seconds) or a category default
const LIMITS={PUZZLE:300,BOARD:360,CARDS:360,SIM:300,VERSUS:180,PARTY:120,SPORTS:180,ACTION:180,CLASSICS:180,'RETRO 3D':180};
const TIMES={chess:900,checkers:600,gomoku:480,uttt:480,battleship:480,mancala:480,dominoes:480,hex:480,dicepoker:360,eights:360,war:300,snakes:300,freecell:600,spider:600,sudoku6:420,nonogram:420};
A.limitOf=gm=>gm.time||TIMES[gm.id]||LIMITS[gm.cat]||180;E.clock=0;E.clockMax=0;A.clock=()=>E.clock;A.setClock=v=>{E.clock=v;};
function begin(){E.botPrev={};A.t=0;E.howEnd=230;E.g=E.cur.make();E.state='play';E.paused=false;E.clockMax=E.clock=A.limitOf(E.cur)*60;}
function start(){E.hot=false;A.cpu=false;A.two=false;if(E.cur.vs){if(E.sel===0)A.cpu=true;else A.two=true;}else if(E.sel===1){E.hot=true;E.turn=0;E.ts=[0,0];}A.ai=[.5,.75,1][A.lvl];begin();}
})();
