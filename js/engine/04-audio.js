/* PIXEL ARCADE engine · Audio: synthesized sound effects (A.sfx) and mute state. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
/* ---------- sound ---------- */
E.mute=false;let ac=null;
const SFX={blip:[440,.05],hit:[220,.08],score:[660,.15,'square',.07,440],boom:[110,.3,'sawtooth',.1,-80],jump:[300,.12,'square',.06,300],lose:[300,.5,'sawtooth',.09,-250],win:[520,.4,'square',.07,520],shoot:[880,.08,'square',.04,-600],coin:[990,.1,'square',.05,300]};
A.sfx=n=>{if(n==='boom'&&!A.silent)A.shake=8;if(E.mute||A.silent)return;const s=SFX[n];if(!s)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=s[2]||'square';o.frequency.setValueAtTime(s[0],t);if(s[4])o.frequency.linearRampToValueAtTime(Math.max(40,s[0]+s[4]),t+s[1]);g.gain.setValueAtTime(s[3]||.06,t);g.gain.linearRampToValueAtTime(0,t+s[1]);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+s[1]);}catch(e){}};
})();
