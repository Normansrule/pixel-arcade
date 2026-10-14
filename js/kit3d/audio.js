// Shared WebAudio synthesis for the full-3D worlds: no audio files, every sound is built from oscillators and noise.
// Each world keeps its own sound.js (its recipes, music and ambience); this module holds the plumbing they all repeat.
//
//  boot(snd, build)                    create snd.ac on the first call (from a click) and run build(ac); later calls resume a
//                                      suspended context. Any throw leaves snd.ac null, so the world just plays silently.
//  master(ac, vol, threshold, ratio, via?)  master gain → (via →) compressor → speakers; returns the master gain
//  gain(ac, v, dst)                    a gain node at v feeding dst
//  noiseBuf(ac, secs=2)                mono white-noise buffer
//  reverb(ac, secs, decay, send, dst)  convolution reverb from a synthetic impulse; returns its send gain
//  bed(ac, buf, type, f, q, dst, v=0, offset)  looping filtered-noise bed (wind, rain, jet); returns {s, f, g}
//  panTo(ac, pan, dst)                 dst itself for pan 0, else a stereo panner (clamped to ±1) feeding dst
//  tone(ac, dst, t, type, f0, f1, dur, vol, atk=.004)   oscillator blip: pitch sweep f0→f1, gain 0→vol over atk then decay
//  hiss(ac, buf, dst, t, dur, f0, f1, q, vol, type='lowpass', atk=0, lo=30)  filtered-noise burst (atk 0 = starts at vol)
//  SpatialSound                        base class for the worlds that place one-shots around the listener with play(kind, pos)
//                                      (arena, titans, ink, campaign, looter): buses, delay room, jet/ambience beds, _dst/_n/_o,
//                                      setVol/setMusic/listener/announce.
// tone() and hiss() return their gain node, already connected to dst, so a caller can add a reverb send.
const AC=()=>new (window.AudioContext||window.webkitAudioContext)();

export function boot(snd,build){if(snd.ac){if(snd.ac.state==='suspended')snd.ac.resume();return;}try{build(snd.ac=AC());}catch(e){snd.ac=null;}}
export function master(ac,vol,threshold,ratio,via){const c=ac.createDynamicsCompressor();c.threshold.value=threshold;c.ratio.value=ratio;c.connect(ac.destination);const m=ac.createGain();m.gain.value=vol;if(via){via.connect(c);m.connect(via);}else m.connect(c);return m;}
export function gain(ac,v,dst){const g=ac.createGain();g.gain.value=v;g.connect(dst);return g;}
export function noiseBuf(ac,secs=2){const n=ac.sampleRate*secs,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;}
export function reverb(ac,secs,decay,send,dst){const il=ac.sampleRate*secs,ib=ac.createBuffer(2,il,ac.sampleRate);for(let c=0;c<2;c++){const x=ib.getChannelData(c);for(let i=0;i<il;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/il,decay);}
 const v=ac.createConvolver();v.buffer=ib;v.connect(dst);return gain(ac,send,v);}
export function bed(ac,buf,type,f,q,dst,v=0,offset){const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;if(q!=null)fl.Q.value=q;const g=gain(ac,v,dst);s.connect(fl);fl.connect(g);offset?s.start(0,offset):s.start();return{s,f:fl,g};}
export function panTo(ac,pan,dst){if(!pan)return dst;const s=ac.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,pan));s.connect(dst);return s;}
export function tone(ac,dst,t,type,f0,f1,dur,vol,atk=.004){const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+atk);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(dst);o.start(t);o.stop(t+dur+.03);return g;}
export function hiss(ac,buf,dst,t,dur,f0,f1,q,vol,type='lowpass',atk=0,lo=30){const s=ac.createBufferSource();s.buffer=buf;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(Math.max(lo,f0),t);f.frequency.exponentialRampToValueAtTime(Math.max(lo,f1),t+dur);
 const g=ac.createGain();if(atk){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+atk);}else g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(g);g.connect(dst);s.start(t,Math.random()*1.5);s.stop(t+dur+.02);return g;}

/** Positional one-shot synth. Subclasses write init() with boot() and the helpers below, and a play(kind,pos,vol) that does
 *  `if(!this._dst(pos,v,range))return;` and then layers this._o / this._n on that destination. this.range is the default
 *  audible range in metres; this.verb (optional) is the send that loud panned sounds also feed. */
export class SpatialSound{
 constructor(){this.ac=null;this.vol=.8;this.musVol=.5;this.annOn=true;this.lp={x:0,y:0,z:0,yaw:0};this.mus=null;this.range=60;}
 /** master(vol) → compressor(-14 dB, 5:1); this.sfx and this.musG (musVol*.5) buses; this.noise (2 s). */
 bus(ac){this.master=master(ac,this.vol,-14,5);this.sfx=gain(ac,1,this.master);this.musG=gain(ac,this.musVol*.5,this.master);this.noise=noiseBuf(ac);}
 /** Reverb-ish send this.verb: short feedback delay through a low-pass back into sfx. */
 room(ac){const dl=ac.createDelay();dl.delayTime.value=.09;this.verb=gain(ac,.22,dl);const fb=gain(ac,.35,dl),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;dl.connect(lp);lp.connect(fb);lp.connect(this.sfx);}
 /** Jet loop (this.jf/this.jg, band-pass at jetHz, into sfx) plus ambience bed (this.af/this.ag) and hum (this.hum/this.hg) into master; all silent until driven. */
 beds(ac,jetHz){const j=bed(ac,this.noise,'bandpass',jetHz,.7,this.sfx);this.jf=j.f;this.jg=j.g;const a=bed(ac,this.noise,'lowpass',300,null,this.master);this.af=a.f;this.ag=a.g;
  this.hum=ac.createOscillator();this.hum.type='sine';this.hum.frequency.value=55;this.hg=gain(ac,0,this.master);this.hum.connect(this.hg);this.hum.start();}
 /** Glide the ambience to cfg = [bed low-pass Hz, bed gain, hum Hz (0 = 50), hum gain]. */
 amb(cfg){const t=this.ac.currentTime;this.af.frequency.setTargetAtTime(cfg[0],t,.5);this.ag.gain.setTargetAtTime(cfg[1],t,.5);this.hum.frequency.setTargetAtTime(cfg[2]||50,t,.5);this.hg.gain.setTargetAtTime(cfg[3],t,.5);}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setMusic(v){this.musVol=v;if(this.musG)this.musG.gain.value=v*.5;}
 listener(x,y,z,yaw){this.lp.x=x;this.lp.y=y;this.lp.z=z;this.lp.yaw=yaw;}
 // destination node for a positioned sound (gain + stereo pan by listener-relative angle); null when too far to hear
 _dst(pos,vol,range=this.range){const ac=this.ac,g=ac.createGain();let v=vol,pan=0;if(pos){const dx=pos.x-this.lp.x,dy=pos.y-this.lp.y,dz=pos.z-this.lp.z,d=Math.hypot(dx,dy,dz);v*=1/(1+(d/(range*.25))**2);if(d>.5){const rx=Math.cos(this.lp.yaw),rz=-Math.sin(this.lp.yaw);pan=Math.max(-.85,Math.min(.85,(dx*rx+dz*rz)/d));}if(v<.004)return null;}
  if(ac.createStereoPanner&&pan){const p=ac.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(this.sfx);if(vol>.15&&this.verb)p.connect(this.verb);}else g.connect(this.sfx);this._v=v;return g;}
 _n(dst,dur,f0,f1,q,vol,type='lowpass',delay=0){hiss(this.ac,this.noise,dst,this.ac.currentTime+delay,dur,f0,f1,q,vol*this._v,type,.004,20);}
 _o(dst,type,f0,f1,dur,vol,delay=0,att=.004){tone(this.ac,dst,this.ac.currentTime+delay,type,f0,f1,dur,vol*this._v,att);}
 announce(text){if(!this.annOn)return;try{const s=window.speechSynthesis;if(!s)return;if(s.speaking&&s.pending)s.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.02;u.pitch=.55;u.volume=Math.min(1,this.vol*1.1);s.speak(u);}catch(e){}}}
