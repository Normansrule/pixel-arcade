// GLOSS RIOT — WebAudio synthesis (no audio files): wet blaster pops, charger whine + zap, roller rumble loop, squelchy
// splats, swim swishes, bomb fizz, the INKQUAKE slam, a funky bass + clap music loop, and the results drumroll / fanfare.
import {boot,bed,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 constructor(){super();this.range=50;}
 // roller rumble loop + swim loop
 init(){boot(this,ac=>{this.bus(ac);this.rollL=bed(ac,this.noise,'lowpass',260,2,this.sfx);this.swimL=bed(ac,this.noise,'bandpass',700,1.4,this.sfx);});}
 loops(roll,swim){if(!this.ac)return;const t=this.ac.currentTime;this.rollL.g.gain.setTargetAtTime(roll*.22,t,.06);this.rollL.f.frequency.setTargetAtTime(180+roll*220,t,.06);this.swimL.g.gain.setTargetAtTime(swim*.08,t,.08);this.swimL.f.frequency.setTargetAtTime(500+swim*700,t,.08);}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.1;let d;const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'shot':if(!D(.45,55))return;this._o(d,'square',900*r,300,.06,.1);this._n(d,.09,2600*r,500,2.5,.4,'bandpass');this._o(d,'sine',300*r,120,.07,.25);break;
  case'flick':if(!D(.6,55))return;this._n(d,.3,600,2600,1.2,.5,'bandpass');this._o(d,'sine',160,60,.25,.4);break;
  case'charge':if(!D(.35,30))return;this._o(d,'sine',300,1400,.9,.1,0,.3);this._o(d,'triangle',150,700,.9,.06,0,.3);break;
  case'zap':if(!D(.8,90))return;this._n(d,.22,9000,1500,.8,.4,'highpass');this._o(d,'sawtooth',1800*r,140,.32,.22);this._o(d,'sine',220,60,.3,.4);this._n(d,.25,1800,300,2,.3,'bandpass',.04);break;
  case'splat':if(!D(.28,35))return;this._n(d,.12,1400*r,240,3,.5,'bandpass');this._o(d,'sine',420*r,110,.08,.18);break;
  case'bigsplat':if(!D(.7,60))return;this._n(d,.45,1100,90,1.5,.7,'bandpass');this._o(d,'sine',180,40,.35,.6);this._n(d,.25,3000,600,2,.3,'bandpass',.05);break;
  case'throw':if(!D(.4,30))return;this._n(d,.2,500,2400,1.5,.35,'bandpass');break;
  case'fizz':if(!D(.35,40))return;this._n(d,.5,5000,9000,4,.18,'bandpass');this._o(d,'square',1200,1900,.5,.03);break;
  case'boom':if(!D(1,90))return;this._n(d,.9,1800,60,.7,.9);this._o(d,'sine',120,30,.8,.9);this._n(d,.35,1200,200,2,.5,'bandpass',.02);break;
  case'quake':if(!D(1,120))return;this._n(d,1.4,2400,40,.6,1);this._o(d,'sine',90,22,1.3,1);[0,.08,.16].forEach(t=>this._n(d,.4,900,120,2,.5,'bandpass',t));break;
  case'rise':D(.6);this._o(d,'sawtooth',180,900,.5,.12);this._n(d,.5,400,4000,2,.3,'bandpass');break;
  case'hit':if(!D(.5,40))return;this._o(d,'triangle',600*r,180,.09,.35);this._n(d,.07,2200,700,2,.35,'bandpass');break;
  case'hitmark':D(.32);this._o(d,'square',a?1500:1250,a?1350:1100,.035,.12);break;
  case'splatted':if(!D(.75,60))return;this._n(d,.5,1600,120,1.4,.6,'bandpass');this._o(d,'sine',500,70,.45,.45);this._o(d,'square',250,80,.3,.08,.05);break;
  case'kill':D(.55);this._o(d,'triangle',660,660,.08,.25);this._o(d,'triangle',990,990,.16,.25,.07);break;
  case'swim':if(!D(.35,25))return;this._n(d,.25,500,1800,2,.4,'bandpass');this._o(d,'sine',240,520,.18,.15);break;
  case'surface':if(!D(.35,25))return;this._n(d,.2,1800,500,2,.35,'bandpass');this._o(d,'sine',500,220,.15,.15);break;
  case'jump':if(!D(.22,25))return;this._n(d,.14,600,2200,1.4,.25,'bandpass');break;
  case'land':if(!D(.25,25))return;this._o(d,'sine',110,50,.1,.35);break;
  case'step':if(!D(.1,18))return;this._n(d,.05,1200*r,500,1.2,.3,'bandpass');break;
  case'empty':D(.35);this._o(d,'square',300,220,.08,.12);this._o(d,'square',300,220,.08,.12,.1);break;
  case'refill':D(.3);this._o(d,'sine',500,1100,.2,.12);break;
  case'ready':D(.6);[523,659,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.25,.16,i*.06));break;
  case'beep':D(.4);this._o(d,'square',a?1046:660,a?1046:660,a?.5:.14,.1);break;
  case'whistle':D(.7);this._o(d,'sine',2300,2250,.25,.25);this._o(d,'sine',2300,2250,.6,.25,.3);this._n(d,.85,3000,2600,8,.08,'bandpass');break;
  case'spawn':if(!D(.35,40))return;this._o(d,'sine',300,900,.35,.15);this._n(d,.35,800,3000,2,.12,'bandpass');break;
  case'drum':D(.5);for(let i=0;i<Math.floor(a*16);i++)this._n(d,.07,900,300,1.2,.25+i/(a*16)*.4,'bandpass',i/16);break;
  case'cymbal':D(.6);this._n(d,1.4,9000,4000,.6,.5,'highpass');this._o(d,'sine',110,55,.5,.4);break;
  case'fanfare':D(.6);[[523,0],[659,.12],[784,.24],[1046,.36],[784,.6],[1046,.72]].forEach(([f,t])=>{this._o(d,'sawtooth',f,f,.3,.07,t);this._o(d,'triangle',f*2,f*2,.25,.06,t);});break;
  case'lose':D(.5);[[392,0],[349,.2],[311,.4],[262,.65]].forEach(([f,t])=>this._o(d,'triangle',f,f*.98,.35,.16,t));break;
  case'special':D(.7);[392,523,659,784,1046].forEach((f,i)=>this._o(d,'square',f,f,.18,.07,i*.05));break;
  case'zone':D(.5);[660,880,660,880].forEach((f,i)=>this._o(d,'square',f,f,.1,.07,i*.12));break;
  }}catch(e){}}
 // funky loop: slap bass, clap, hats and a stab arp; intensity 0..1 raises the energy in the last minute
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/(124+this.musI*10)/4;
   while(st.next<ac.currentTime+.25){const s=st.step%64,bar=(st.step/16|0)%4,root=[40,45,43,38][bar],t=st.next;const hz=m=>440*Math.pow(2,(m-69)/12);const g=this.musG;
    const bassPat=[1,0,0,1,0,0,1,0,1,0,1,0,0,1,0,1],oct=[0,0,0,12,0,0,0,0,7,0,12,0,0,10,0,12];
    if(bassPat[s%16]){const o=ac.createOscillator(),f=ac.createBiquadFilter(),gg=ac.createGain();o.type='square';o.frequency.value=hz(root+oct[s%16]);f.type='lowpass';f.Q.value=6;f.frequency.setValueAtTime(1600,t);f.frequency.exponentialRampToValueAtTime(180,t+.16);gg.gain.setValueAtTime(.2,t);gg.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+.2);}
    if(s%8===4){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),gg=ac.createGain();n.buffer=this.noise;f.type='bandpass';f.frequency.value=1500;f.Q.value=.8;gg.gain.setValueAtTime(.22,t);gg.gain.exponentialRampToValueAtTime(.001,t+.14);n.connect(f);f.connect(gg);gg.connect(g);n.start(t,Math.random());n.stop(t+.15);}
    if(s%4===0){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);gg.gain.setValueAtTime(.3,t);gg.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.17);}
    if(s%2===1||this.musI>.5){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),gg=ac.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=8000;gg.gain.setValueAtTime(s%4===2?.05:.03,t);gg.gain.exponentialRampToValueAtTime(.001,t+.04);n.connect(f);f.connect(gg);gg.connect(g);n.start(t,Math.random());n.stop(t+.05);}
    const stab=[0,0,1,0,0,1,0,0,0,0,1,0,0,0,1,0][s%16];if(stab&&(bar%2===1||this.musI>.3)){for(const iv of[12,16,19]){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+iv+(bar===3?-1:0));gg.gain.setValueAtTime(.035,t);gg.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.13);}}
    st.step++;st.next+=spb;}setTimeout(tick,60);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
