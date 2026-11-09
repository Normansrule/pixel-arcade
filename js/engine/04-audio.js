/* PIXEL ARCADE engine · Audio: sound effects (A.sfx), sound style and mute state.
   STUDIO style (the default) plays recorded CC0 takes from the sound bank (js/sfxbank.js, files in sfx/), a random
   take each time with a small pitch wobble so repeats don't sound copied. RETRO style, and STUDIO while a take is
   still loading, plays the original one-oscillator synth beeps. */
(function(){
'use strict';
const A=window.A,E=A._e;
/* ---------- sound ---------- */
E.mute=false;let ac=null,bk=null,mix=null;
const SFX={blip:[440,.05],hit:[220,.08],score:[660,.15,'square',.07,440],boom:[110,.3,'sawtooth',.1,-80],jump:[300,.12,'square',.06,300],lose:[300,.5,'sawtooth',.09,-250],win:[520,.4,'square',.07,520],shoot:[880,.08,'square',.04,-600],coin:[990,.1,'square',.05,300],power:[392,.25,'triangle',.08,392]};
// per-name level for the recorded takes (blip and shoot fire many times a second in some games, so they sit lower)
const VOL={blip:.32,hit:.55,score:.5,boom:.75,jump:.45,lose:.55,win:.55,shoot:.3,coin:.42,power:.5};
const last={};
const ST=['studio','retro'];
try{A.sfxStyle=ST.includes(localStorage.getItem('pa.sfx'))?localStorage.getItem('pa.sfx'):'studio';}catch(e){A.sfxStyle='studio';}
A.cycleSfx=()=>{A.sfxStyle=A.sfxStyle==='studio'?'retro':'studio';try{localStorage.setItem('pa.sfx',A.sfxStyle);}catch(e){}if(E.state!=='hub'&&A.toast)A.toast(A.sfxStyle==='studio'?'STUDIO SOUND':'RETRO SOUND');A.sfx('blip');};
function synth(s){const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=s[2]||'square';o.frequency.setValueAtTime(s[0],t);if(s[4])o.frequency.linearRampToValueAtTime(Math.max(40,s[0]+s[4]),t+s[1]);g.gain.setValueAtTime(s[3]||.06,t);g.gain.linearRampToValueAtTime(0,t+s[1]);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+s[1]);}
A.sfx=n=>{if(n==='boom'&&!A.silent)A.shake=8;if(E.mute||A.silent)return;const s=SFX[n];if(!s)return;
 try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended'&&ac.resume)ac.resume();
  // the same sound fired again within 30 ms (a dozen bricks breaking on one frame) plays once
  const now=ac.currentTime;if(last[n]!=null&&now-last[n]<.03)return;last[n]=now;
  if(A.sfxStyle!=='retro'&&window.PASFX){
   if(!mix){const c=ac.createDynamicsCompressor();c.threshold.value=-16;c.ratio.value=4;c.connect(ac.destination);mix=ac.createGain();mix.gain.value=.8;mix.connect(c);}
   if(!bk)bk=window.PASFX.bank(ac,'sfx/').want(...Object.keys(SFX));
   if(bk.play(n,mix,{vol:VOL[n]}))return;}
  synth(s);}catch(e){}};
// interface sounds for the hub (cartridge insert, hover ticks, back): recorded takes only, quiet, and only after the
// visitor has clicked or pressed something (browsers keep audio locked until then)
const uiLast={};
A.uiSfx=(n,vol)=>{if(E.mute||A.silent||A.sfxStyle==='retro'||!window.PASFX)return;const ua=navigator.userActivation;if(ua&&!ua.hasBeenActive)return;
 try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended'&&ac.resume)ac.resume();const now=ac.currentTime;if(uiLast[n]!=null&&now-uiLast[n]<.07)return;uiLast[n]=now;
  if(!mix){const c=ac.createDynamicsCompressor();c.threshold.value=-16;c.ratio.value=4;c.connect(ac.destination);mix=ac.createGain();mix.gain.value=.8;mix.connect(c);}
  if(!bk)bk=window.PASFX.bank(ac,'sfx/').want(...Object.keys(SFX));bk.want('hover','open','back','insert','toggle');bk.play(n,mix,{vol:vol==null?.3:vol,jit:.02});}catch(e){}};
})();
