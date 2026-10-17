// NOVA ARENA — WebAudio synthesis (no audio files): spatial weapon/impact one-shots, jetpack loop, ambience, a small music sequencer, announcer.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,900);});}
 ambience(theme){if(!this.ac)return;this.amb({space:[260,.05,46,.03],canyon:[520,.07,0,0],sky:[900,.06,0,0]}[theme]||[300,0,0,0]);}
 jet(on,k=1){if(!this.ac)return;const t=this.ac.currentTime;this.jg.gain.setTargetAtTime(on?.13*k:0,t,.05);this.jf.frequency.setTargetAtTime(on?700+Math.random()*300:500,t,.05);}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.08;let d;
  const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'pulse':if(!D(.5,70))return;this._o(d,'square',1300*r,260,.07,.14);this._o(d,'sawtooth',520*r,90,.09,.12);this._n(d,.06,6000,1500,.8,.22,'bandpass');break;
  case'carbine':if(!D(.55,90))return;this._o(d,'triangle',820*r,150,.11,.3);this._n(d,.09,3200,500,.9,.3,'bandpass');this._o(d,'sine',150,50,.12,.25);break;
  case'scatter':if(!D(.8,90))return;this._n(d,.42,4200,140,.6,.6);this._o(d,'sine',120,36,.35,.55);this._n(d,.08,9000,3000,.6,.25,'highpass');break;
  case'charge':if(!D(.45,40))return;this._o(d,'sine',220,1500,.42,.12,0,.2);this._o(d,'triangle',110,750,.42,.08,0,.2);break;
  case'rail':if(!D(.9,160))return;this._n(d,.25,12000,2000,.7,.45,'highpass');this._o(d,'sawtooth',2400,70,.5,.28);this._o(d,'sine',1210,1180,.9,.12,.02);this._o(d,'sine',1820,1790,.7,.08,.02);this._o(d,'sine',90,30,.4,.5);break;
  case'plasma':if(!D(.7,90))return;this._o(d,'sine',360*r,70,.35,.45);this._n(d,.3,1600,200,1,.35,'bandpass');this._o(d,'triangle',900,200,.2,.12);break;
  case'boom':if(!D(1,150))return;this._n(d,1.3,2600,50,.5,.9);this._o(d,'sine',95,24,1.1,.9);this._n(d,.25,8000,1000,.5,.35,'highpass');break;
  case'blade':if(!D(.6,40))return;this._n(d,.28,500,3800,2,.45,'bandpass');this._o(d,'sawtooth',180,420,.25,.08);break;
  case'bladeHum':if(!D(.25,20))return;this._o(d,'sawtooth',96,100,.3,.05);break;
  case'melee':if(!D(.6,40))return;this._n(d,.16,1800,200,1,.5);this._o(d,'sine',140,60,.15,.5);break;
  case'hitShield':if(!D(.45,50))return;this._o(d,'triangle',2100*r,900,.12,.22);this._n(d,.08,7000,3000,2,.12,'bandpass');break;
  case'hitBody':if(!D(.5,50))return;this._o(d,'sine',220*r,70,.1,.4);this._n(d,.06,1200,300,1,.25);break;
  case'headshot':if(!D(.8,80))return;this._o(d,'sine',2600,2500,.18,.3);this._o(d,'sine',3900,3800,.12,.18);this._o(d,'triangle',1300,600,.08,.25);break;
  case'hitmark':D(.35);this._o(d,'square',a?1900:1500,a?1700:1300,.03,.12);break;
  case'kill':D(.5);this._o(d,'sine',880,880,.1,.25);this._o(d,'sine',1320,1320,.18,.25,.08);break;
  case'shieldBreak':if(!D(.7,50))return;this._n(d,.45,9000,1200,.8,.4,'highpass');[1600,1250,980].forEach((f,i)=>this._o(d,'triangle',f,f*.5,.35,.12,i*.04));break;
  case'recharge':D(.35);this._o(d,'sine',300,1400,.7,.12,0,.3);this._o(d,'triangle',150,700,.7,.06,0,.3);break;
  case'lowShield':D(.3);this._o(d,'square',720,720,.07,.08);this._o(d,'square',720,720,.07,.08,.14);break;
  case'jump':if(!D(.25,30))return;this._n(d,.15,700,2500,1.4,.25,'bandpass');break;
  case'land':if(!D(.3,30))return;this._o(d,'sine',100,45,.12,.4*Math.min(1,a/10));this._n(d,.08,900,200,1,.2);break;
  case'step':if(!D(.12,20))return;this._n(d,.05,1400*r,500,1.2,.3,'bandpass');break;
  case'jetPuff':if(!D(.3,40))return;this._n(d,.3,900,600,.8,.35,'bandpass');break;
  case'slide':if(!D(.3,30))return;this._n(d,.5,2500,600,.7,.25,'bandpass');break;
  case'pad':if(!D(.6,50))return;this._o(d,'sine',180,900,.35,.35);this._o(d,'triangle',360,1600,.3,.12);this._n(d,.3,800,4000,1,.2,'bandpass');break;
  case'tele':if(!D(.6,50))return;this._o(d,'sine',1600,200,.5,.25);this._o(d,'sawtooth',400,1600,.4,.06);this._n(d,.4,5000,300,3,.2,'bandpass');break;
  case'pickup':D(.45);this._o(d,'triangle',660,660,.08,.2);this._o(d,'triangle',990,990,.12,.2,.06);break;
  case'power':D(.7);[523,659,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.35,.18,i*.06));this._o(d,'sine',130,260,.6,.3);break;
  case'reload':if(!D(.35,25))return;this._n(d,.05,3000,1500,2,.4,'bandpass');this._n(d,.06,2400,1200,2,.4,'bandpass',.35);this._o(d,'square',300,200,.04,.1,.6);break;
  case'empty':D(.3);this._o(d,'square',1800,1700,.02,.12);break;
  case'swap':D(.25);this._n(d,.12,1800,800,2,.35,'bandpass');break;
  case'throw':if(!D(.35,30))return;this._n(d,.2,600,2200,1.5,.35,'bandpass');break;
  case'tink':if(!D(.3,40))return;this._o(d,'sine',2600*r,2400,.08,.15);break;
  case'stick':if(!D(.6,40))return;this._o(d,'sawtooth',400,1600,.25,.12);this._n(d,.4,3000,6000,4,.2,'bandpass');break;
  case'beep':D(.4);this._o(d,'square',a?1046:660,a?1046:660,a?.5:.15,.1);break;
  case'horn':D(.6);[196,247,294,392].forEach(f=>this._o(d,'sawtooth',f,f,1.6,.06,0,.05));break;
  case'medal':D(.45);[880,1175,1568].forEach((f,i)=>this._o(d,'triangle',f,f,.22,.13,i*.05));break;
  case'streak':D(.6);[392,523,659,784].forEach((f,i)=>this._o(d,'sawtooth',f,f*1.002,.5,.06,i*.07));this._o(d,'sine',98,98,.8,.25);break;
  case'hill':D(.5);[660,550,660,550].forEach((f,i)=>this._o(d,'square',f,f,.12,.08,i*.14));break;
  case'spawn':if(!D(.35,40))return;this._o(d,'sine',200,800,.4,.15);this._n(d,.4,600,3000,2,.12,'bandpass');break;
  case'death':if(!D(.5,50))return;this._o(d,'sawtooth',300,60,.6,.15);this._n(d,.5,2000,200,.8,.3);break;
  }}catch(e){}}
 // tiny music sequencer (bass + arp + hats); intensity 0..1
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/118/4;
   while(st.next<ac.currentTime+.25){const s=st.step%64,bar=(st.step/16|0)%4,root=[45,41,48,43][bar],t=st.next;const hz=m=>440*Math.pow(2,(m-69)/12);
    const g=ac.createGain();g.connect(this.musG);this._v=1;
    if(s%4===0||s%16===14){const o=ac.createOscillator(),f=ac.createBiquadFilter(),gg=ac.createGain();o.type='sawtooth';o.frequency.value=hz(root-12);f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(140,t+.22);gg.gain.setValueAtTime(.32,t);gg.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    const arp=[0,7,12,15,19,15,12,7][s%8];if(s%2===0||this.musI>.5){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+arp);gg.gain.setValueAtTime(.07*(.6+this.musI*.6),t);gg.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.18);}
    if(s%4===2||this.musI>.6&&s%2===1){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),gg=ac.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=7000;gg.gain.setValueAtTime(.05,t);gg.gain.exponentialRampToValueAtTime(.001,t+.05);n.connect(f);f.connect(gg);gg.connect(g);n.start(t,Math.random());n.stop(t+.06);}
    if(s%16===8&&this.musI>.3){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.2);gg.gain.setValueAtTime(.3,t);gg.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    st.step++;st.next+=spb;}setTimeout(tick,60);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
