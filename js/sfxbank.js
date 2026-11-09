/* PIXEL ARCADE · Sound bank: recorded CC0 sound effects by Kenney (www.kenney.nl), stored in sfx/ so they work offline.
   Credits and licence: sfx/LICENSE.txt and THIRD_PARTY.md.

   Works as a classic <script> (the canvas arcade) and as a side-effect module import (the 3D worlds): it only sets
   window.PASFX. Nothing loads until a page asks for a bank, and every sound decodes lazily, so a page that never
   plays a sound never fetches one.

     const b = PASFX.bank(audioContext, '../sfx/')   one bank per AudioContext; base is the path to sfx/ from the page
     b.want('hit','boom')                            start fetching + decoding those pools (or single file names)
     b.play('hit', dst, {vol, rate, jit, when})      a random take from the pool; returns the source, or null while the
                                                     pool is still decoding (callers fall back to their synth sound)
     b.loop('engine', dst, vol)                      looping source + gain {s, g} (or null while decoding)
     b.ready(name)                                   true once at least one take of that pool decoded
   Pool names are listed in POOLS; any other name is treated as one file, sfx/<name>.mp3. */
(function(){
'use strict';
if(typeof window==='undefined'||window.PASFX)return;
// the canvas arcade's nine A.sfx names plus a few shared ones; every pool is a list of takes picked at random
const POOLS={
 blip:['select_001','select_002','click_001','tile-swap','pluck_001'],
 hit:['impact_punch_medium_000','impact_punch_medium_001','impact_punch_medium_002','impact_generic_light_000','impact_generic_light_001','impact_plate_light_000'],
 boom:['explosion_crunch_000','explosion_crunch_001','explosion_crunch_002','explosion_crunch_003'],
 bigboom:['low_frequency_explosion_000'],
 lose:['error_003','error_005','error_006'],
 coin:['coin','tile-match','glass_002'],
 win:['confirmation_002','confirmation_004','maximize_004'],
 score:['confirmation_001','confirmation_003','maximize_001'],
 shoot:['laser_small_000','laser_small_001','laser_small_002','laser_retro_000','laser_retro_001'],
 jump:['jump','jump_a','jump_b','jump_c'],
 power:['force_field_000','maximize_002','maximize_003'],
 // interface (hub, cards, menus)
 hover:['tick_001','tick_002'],open:['select_003'],back:['back_001'],toggle:['toggle_001','switch_002'],
 insert:['placement-a','placement-b'],drop:['drop_001'],
 // shared by the 3D worlds
 metal:['impact_metal_heavy_000','impact_metal_heavy_001','impact_metal_heavy_002'],clank:['impact_metal_light_000'],
 thud:['impact_soft_heavy_000','impact_soft_heavy_001'],wood:['impact_wood_heavy_000'],glass:['impact_glass_medium_000'],
 crash:['impact'],skid:['skid'],engine:['engine'],blaster:['blaster'],repeater:['blaster_repeater'],
 destroy:['enemy_destroy'],hurt:['enemy_hurt'],swap:['weapon_change'],thrust:['thruster_fire_000'],
 step:['footstep_concrete_000','footstep_concrete_001','footstep_concrete_002','footstep_concrete_003'],
 grass:['footstep_grass_000','footstep_grass_001','footstep_grass_002','footstep_grass_003'],
 land:['land'],smash:['break']};
const banks=new WeakMap();
function bank(ac,base){
 if(!ac)return null;let b=banks.get(ac);if(b)return b;
 base=base||'sfx/';const buf={},busy={},last={};
 const files=n=>POOLS[n]||[n];
 const fetchOne=f=>{if(buf[f]||busy[f])return;busy[f]=1;
  try{fetch(base+f+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject(r.status))
   .then(a=>new Promise((ok,no)=>{const p=ac.decodeAudioData(a,ok,no);if(p&&p.catch)p.catch(no);}))
   .then(d=>{buf[f]=d;},()=>{}).then(()=>{busy[f]=0;});}catch(e){busy[f]=0;}};
 const want=(...names)=>{for(const n of names)files(n).forEach(fetchOne);return b;};
 const takes=n=>files(n).filter(f=>buf[f]);
 b={POOLS,
  want,
  ready:n=>takes(n).length>0,
  play(n,dst,o){o=o||{};const t=takes(n);if(!t.length){want(n);return null;}
   // never the same take twice in a row when the pool has more than one
   let i=Math.floor(Math.random()*t.length);if(t.length>1&&t[i]===last[n])i=(i+1)%t.length;last[n]=t[i];
   try{const s=ac.createBufferSource();s.buffer=buf[t[i]];const jit=o.jit==null?.05:o.jit;
    s.playbackRate.value=Math.max(.25,(o.rate||1)*(1+(Math.random()*2-1)*jit));
    const g=ac.createGain();g.gain.value=o.vol==null?1:o.vol;s.connect(g);g.connect(dst||ac.destination);
    s.start(o.when||0);s.onended=()=>{try{g.disconnect();}catch(e){}};return s;}catch(e){return null;}},
  loop(n,dst,vol){const t=takes(n);if(!t.length){want(n);return null;}
   try{const s=ac.createBufferSource();s.buffer=buf[t[0]];s.loop=true;
    // skip the encoder's padding at both ends so the loop has no click
    const d=s.buffer.duration;if(d>1){s.loopStart=.06;s.loopEnd=d-.06;}
    const g=ac.createGain();g.gain.value=vol||0;s.connect(g);g.connect(dst||ac.destination);s.start(0,d>1?.06:0);return{s,g};}catch(e){return null;}}};
 banks.set(ac,b);return b;}
window.PASFX={POOLS,bank};
})();
