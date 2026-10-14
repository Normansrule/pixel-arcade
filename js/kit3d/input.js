// Shared input for the full-3D worlds: keyboard state, pointer lock with a click-to-play overlay, mouse look deltas,
// hold-and-spam-click fire, and gamepad polling. Each world keeps its own bindings; this module holds the listeners they all repeat.
//
//  const I=controls(canvas,{...options})
//   I.keys[code]      true while held          I.edge[code]  true from the first keydown until I.flush()
//   I.mouse           {dx,dy}: look delta, accumulated while locked (the world zeroes it after reading)
//                     {l,r}: buttons held  {le,re}: pressed since the world last cleared them (a click shorter than a frame still counts)
//                     {wheel}: summed wheel steps while locked and canLock() (the world zeroes it)
//   I.locked          pointer is locked to the canvas
//   I.lock()          request pointer lock (no-op while canLock() is false)    I.unlock()  release it
//   I.fire()          hold-and-spam-click trigger: mouse.l || mouse.le, then clears le
//   I.flush()         clear I.edge (call once per frame after reading input)
//  options (all optional):
//   canLock()         may the pointer lock now (usually G.app==='play'); a canvas click while true and unlocked takes the lock
//   clickLock()       may a canvas click take the lock (default: canLock)
//   clickThrough      that locking click also counts as a button press (default: it is swallowed)
//   overlay           click-to-play element: shown while canLock() and unlocked, its click takes the lock
//   onLock(on,was)    after each pointer-lock change (e.g. pause when the lock is lost mid-round)
//   onDown(e)         canvas mousedown, before the button is recorded; return true to swallow it
//   look(e)           mousemove counts towards dx/dy when true (default: while locked)
//   onWheel(e)        replaces the default wheel accumulation
//   menu(e)           block the context menu while true (default: always); e is the contextmenu event
//   onKey(e,first)    after keydown updated keys/edge (keydowns in <input> fields are ignored); onKeyUp(e) after keyup
//  Window blur releases every key and mouse button.
//
//  gamepad()          first connected gamepad, or null
//  deadzone(v,t=.15)  0 inside the dead zone, v outside;  deadzone(v,t,true) rescales the rest to 0..1
export function controls(canvas,o={}){
 const keys={},edge={},mouse={dx:0,dy:0,l:false,r:false,le:false,re:false,wheel:0},can=()=>!o.canLock||o.canLock(),ov=o.overlay;
 const I={keys,edge,mouse,locked:false,
  lock(){if(!can())return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}},
  unlock(){try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}},
  fire(){const f=mouse.l||mouse.le;mouse.le=false;return f;},
  flush(){for(const k in edge)delete edge[k];}};
 document.addEventListener('pointerlockchange',()=>{const was=I.locked;I.locked=document.pointerLockElement===canvas;if(ov)ov.hidden=I.locked||!can();if(o.onLock)o.onLock(I.locked,was);});
 if(ov)ov.onclick=()=>I.lock();
 canvas.addEventListener('mousedown',e=>{if(!I.locked&&(o.clickLock||can)()){I.lock();if(!o.clickThrough)return;}if(o.onDown&&o.onDown(e))return;if(e.button===0)mouse.l=mouse.le=true;if(e.button===2)mouse.r=mouse.re=true;});
 addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
 addEventListener('contextmenu',e=>{if(!o.menu||o.menu(e))e.preventDefault();});
 addEventListener('mousemove',e=>{if(o.look?o.look(e):I.locked){mouse.dx+=e.movementX;mouse.dy+=e.movementY;}});
 addEventListener('wheel',e=>{if(o.onWheel)o.onWheel(e);else if(can()&&I.locked)mouse.wheel+=Math.sign(e.deltaY);},{passive:true});
 addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];if(first)edge[e.code]=true;keys[e.code]=true;if(o.onKey)o.onKey(e,first);});
 addEventListener('keyup',e=>{keys[e.code]=false;if(o.onKeyUp)o.onKeyUp(e);});
 addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
 return I;}

export function gamepad(){return navigator.getGamepads?[...navigator.getGamepads()].find(Boolean)||null:null;}
export function deadzone(v,t=.15,rescale){return Math.abs(v)>t?(rescale?(v-Math.sign(v)*t)/(1-t):v):0;}
