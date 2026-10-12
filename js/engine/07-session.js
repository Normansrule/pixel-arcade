/* PIXEL ARCADE engine · Session state shared by the cabinet loop and UI (current game, mode, turn, pause). */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;

/* ---------- shell ---------- */
E.cur=null;E.g=null;E.sel=0;E.hot=false;E.turn=0;E.ts=[0,0];E.overT=0;E.paused=false;E.record=false;
})();
