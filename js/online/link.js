/* PIXEL ARCADE · The online link, shared by the arcade hub (js/net.js) and the 3D worlds (js/kit3d/duel.js).
   One host and one guest. The host opens a room on the signaling server (PeerJS wire protocol, js/online/config.js)
   under a 6-character code; the guest sends an offer to that code; the two browsers then connect directly over a
   WebRTC data channel and both leave the signaling server, so nobody else can join. Every data-channel message goes
   through PXSafe.parse (strict schema, size limit) and a rate limit; a peer that keeps sending bad data is dropped.
   Copy-paste codes (no server at all) set up the same link.
   PXLink.make(hooks) -> link. hooks (all optional): status(text), room(code), linked(), message(m), fail(text),
   lost(text), waiting() (the host's guest dropped out before linking; the room stays open). */
(function(root){
'use strict';
const S=root.PXSafe,CFG=root.PX_ONLINE;if(!S||!CFG)return;
const now=()=>performance.now();
const NET_FAIL='Could not reach the free online server. Check your internet connection, or use "Swap codes" instead.';
const STRICT='Could not link the two browsers. One of you may be on a strict network (some school, office or mobile networks block direct links). Try another network, such as a phone hotspot.';

/* ---------- signaling server client ---------- */
function Signal(id,on){const c=CFG.signal;const url=(c.secure?'wss':'ws')+'://'+c.host+':'+c.port+c.path.replace(/\/?$/,'/')+'peerjs?key='+encodeURIComponent(c.key)+'&id='+encodeURIComponent(id)+'&token='+S.randomId(12);
 let ws,hb=null,dead=false;const bucket=new S.Bucket(30,60);const fin=t=>{if(dead)return;dead=true;clearInterval(hb);on({type:t});};
 try{ws=new WebSocket(url);}catch(e){setTimeout(()=>fin('FAIL'));return{send(){},close(){}};}
 ws.onopen=()=>{hb=setInterval(()=>{if(ws.readyState===1)ws.send('{"type":"HEARTBEAT"}');},5000);};
 ws.onmessage=e=>{if(dead||!bucket.take(now()))return;const m=S.parseSignal(typeof e.data==='string'?e.data:'');if(m&&m.type!=='HEARTBEAT')on(m);};
 ws.onerror=()=>fin('FAIL');ws.onclose=()=>fin('CLOSED');
 return{send(type,dst,payload){if(!dead&&ws.readyState===1)ws.send(JSON.stringify({type,dst,payload}));},close(){dead=true;clearInterval(hb);try{ws.close();}catch(_){}}};}

/* ---------- copy-paste codes: session description -> deflate -> base64url ---------- */
const b64=u=>{let s='';for(let i=0;i<u.length;i+=4096)s+=String.fromCharCode.apply(null,u.subarray(i,i+4096));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function squeeze(u,T,limit){const rd=new Blob([u]).stream().pipeThrough(new T('deflate-raw')).getReader();const parts=[];let n=0;
 for(;;){const{done,value}=await rd.read();if(done)break;n+=value.length;if(n>limit){rd.cancel();throw new Error('That code is too long.');}parts.push(value);}
 const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
async function pack(o){return'PXA2.'+b64(await squeeze(new TextEncoder().encode(JSON.stringify(o)),CompressionStream,60000));}
async function unpack(code){code=String(code||'').trim();if(code.length>12000)throw new Error('That code is too long.');const m=code.match(/^PXA2\.([A-Za-z0-9_-]{8,})$/);if(!m)throw new Error('That is not an arcade code (they start with PXA2).');
 let o;try{o=JSON.parse(new TextDecoder().decode(await squeeze(unb64(m[1]),DecompressionStream,30000)));}catch(e){throw new Error(e.message==='That code is too long.'?e.message:'That code is damaged. Copy it again.');}
 const v=S.parseCode(o);if(!v)throw new Error('That code is damaged. Copy it again.');return v;}
const gathered=pc=>new Promise(r=>{if(pc.iceGatheringState==='complete')return r();const t=setTimeout(r,5000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);r();}});});
const GUEST=new RegExp('^'+CFG.prefix.replace(/[-]/g,'\\-')+'g[a-z0-9]{12}$');

function make(hooks){const H=hooks||{},call=(k,...a)=>{if(typeof H[k]==='function')H[k](...a);};
 const st={phase:'idle',role:null,room:null,sig:null,pc:null,dc:null,peer:null,cands:[],nc:0,strikes:0,inB:null,rtt:0,pingT:null,timer:null,tries:0,until:0,name:''};
 const send=m=>{if(!st.dc||st.dc.readyState!=='open')return false;try{st.dc.send(S.encode(m));return true;}catch(e){return false;}};
 function close(){clearTimeout(st.timer);clearInterval(st.pingT);if(st.sig)st.sig.close();try{st.dc&&st.dc.close();}catch(_){}try{st.pc&&st.pc.close();}catch(_){}
  Object.assign(st,{phase:'idle',role:null,room:null,sig:null,pc:null,dc:null,peer:null,cands:[],nc:0,strikes:0,rtt:0,pingT:null,timer:null,until:0});}
 const fail=msg=>{close();call('fail',msg);};
 const lost=msg=>{if(st.phase!=='linked')return;close();call('lost',msg);};
 function makePC(){const pc=st.pc=new RTCPeerConnection({iceServers:JSON.parse(JSON.stringify(CFG.ice))});
  pc.onicecandidate=e=>{if(e.candidate&&st.sig&&st.peer)st.sig.send('CANDIDATE',st.peer,{c:e.candidate.candidate||'',m:String(e.candidate.sdpMid||'').slice(0,64),i:e.candidate.sdpMLineIndex||0});};
  pc.onconnectionstatechange=()=>{if(pc!==st.pc)return;if(pc.connectionState==='failed'){if(st.phase==='linked')lost('The connection dropped.');else if(st.role==='host'&&st.room)resetGuest('That friend could not link (a strict network?). Still waiting…');else fail(STRICT);}};
  return pc;}
 function wire(dc){st.dc=dc;st.inB=new S.Bucket(240,480);
  dc.onopen=linked;dc.onclose=()=>lost('Your rival left.');
  dc.onmessage=e=>{if(typeof e.data!=='string'||!st.inB.take(now())){strike();return;}const m=S.parse(e.data);if(!m){strike();return;}
   if(m.t==='ping'){send({t:'pong',p:m.p});return;}if(m.t==='pong'){st.rtt=Math.max(0,Math.round(now())-m.p);}if(m.t==='bye'){lost('Your rival left.');return;}call('message',m);};}
 function strike(){if(++st.strikes>60)lost('The link was closed because the other browser sent too much bad data.');}
 function linked(){clearTimeout(st.timer);st.phase='linked';if(st.sig){st.sig.close();st.sig=null;}// leave the signaling server: the room is now full
  st.pingT=setInterval(()=>send({t:'ping',p:Math.round(now())>>>0}),2000);call('linked');}
 function onSig(m){switch(m.type){
  case'OPEN':st.tries=0;if(st.role==='host'){st.phase='waiting';call('room',st.room);}else offer();break;
  case'ID-TAKEN':if(st.role==='host'&&!st.fixed&&st.tries++<3){st.sig.close();st.sig=null;openRoom();}else fail(st.fixed?'That room is busy. Make a new room.':'Could not open a room. Try again.');break;
  case'OFFER':answer(m);break;
  case'ANSWER':if(st.role==='guest'&&m.src===st.peer&&st.pc&&!st.pc.remoteDescription)st.pc.setRemoteDescription({type:'answer',sdp:m.payload.sdp}).then(flushCands).catch(()=>fail('The host sent a bad answer.'));break;
  case'CANDIDATE':if(m.src===st.peer&&st.pc&&st.nc++<60){if(st.pc.remoteDescription)st.pc.addIceCandidate({candidate:m.payload.c,sdpMid:m.payload.m||'0',sdpMLineIndex:m.payload.i||0}).catch(()=>{});else st.cands.push(m.payload);}break;
  case'EXPIRE':if(st.role==='guest'&&st.phase==='joining'){if(now()<st.until){retryJoin();}else fail('No open room has that code. Check it, or ask your friend to make a new room.');}break;
  case'LEAVE':if(st.phase!=='linked'&&m.src===st.peer){if(st.role==='host')resetGuest('Still waiting for a friend…');else fail('The host closed the room.');}break;
  case'INVALID-KEY':case'ERROR':case'FAIL':case'CLOSED':if(st.phase!=='linked'&&st.phase!=='idle'&&st.phase!=='codes')fail(NET_FAIL);break;}}
 function flushCands(){const c=st.cands.splice(0);c.forEach(p=>st.pc.addIceCandidate({candidate:p.c,sdpMid:p.m||'0',sdpMLineIndex:p.i||0}).catch(()=>{}));}
 function resetGuest(msg){clearTimeout(st.timer);const pc=st.pc;st.pc=null;try{pc&&pc.close();}catch(_){}st.dc=st.peer=null;st.cands=[];st.nc=0;st.phase='waiting';call('waiting',msg);}
 async function answer(m){if(st.role!=='host'||st.phase!=='waiting'||st.peer||!GUEST.test(m.src))return;// one guest per room; later offers are ignored
  st.peer=m.src;st.phase='answering';call('status','Linking with '+S.cleanName(m.payload.name,'a friend')+'…');const pc=makePC();pc.ondatachannel=e=>{if(!st.dc&&e.channel.label==='px')wire(e.channel);};
  try{await pc.setRemoteDescription({type:'offer',sdp:m.payload.sdp});flushCands();await pc.setLocalDescription(await pc.createAnswer());st.sig.send('ANSWER',st.peer,{k:'a',sdp:pc.localDescription.sdp});
   st.timer=setTimeout(()=>{if(st.phase!=='linked')resetGuest('That friend could not link. Still waiting…');},20000);}catch(e){resetGuest('Still waiting for a friend…');}}
 async function offer(){const pc=makePC();wire(pc.createDataChannel('px',{ordered:true}));
  try{await pc.setLocalDescription(await pc.createOffer());st.sig.send('OFFER',st.peer,{k:'o',sdp:pc.localDescription.sdp,name:st.name});}catch(e){fail('Your browser could not start a connection.');return;}
  clearTimeout(st.timer);st.timer=setTimeout(()=>{if(st.phase!=='linked')fail('No answer from that room. Check the code, or ask your friend to make a new room.');},20000);}
 function retryJoin(){try{st.pc&&st.pc.close();}catch(_){}st.pc=st.dc=null;st.cands=[];st.nc=0;setTimeout(()=>{if(st.phase==='joining'&&st.sig)offer();},1500);}
 function openRoom(){st.role='host';if(!st.fixed)st.room=S.newRoom();st.phase='opening';st.sig=Signal(CFG.prefix+st.room.toLowerCase(),onSig);call('status','Opening a room…');}
 /* host(name, code?): a given code is used as-is (the hub hands one to a 3D world); otherwise a random one */
 function host(name,code){close();st.name=S.cleanName(name);st.tries=0;st.fixed=false;if(code){const c=S.cleanRoom(code);if(!c){fail('That room code is not valid.');return;}st.room=c;st.fixed=true;}openRoom();}
 /* join(name, code, waitMs): with waitMs the guest keeps knocking until the host's room opens */
 function join(name,code,waitMs){const c=S.cleanRoom(code);if(!c)return false;close();st.name=S.cleanName(name);st.role='guest';st.room=c;st.phase='joining';st.peer=CFG.prefix+c.toLowerCase();st.until=now()+(waitMs||0);
  st.sig=Signal(CFG.prefix+'g'+S.randomId(12),onSig);call('status','Looking for room '+c+'…');return true;}
 async function codesHost(name){close();st.role='host';st.phase='codes';const pc=makePC();wire(pc.createDataChannel('px',{ordered:true}));await pc.setLocalDescription(await pc.createOffer());await gathered(pc);return pack({t:'o',s:pc.localDescription.sdp,name:S.cleanName(name)});}
 async function codesAccept(code){const o=await unpack(code);if(o.t!=='a')throw new Error('Paste the answer code from your friend.');if(!st.pc||st.pc.remoteDescription)throw new Error('Start again: make a new code.');await st.pc.setRemoteDescription({type:'answer',sdp:o.s});}
 async function codesJoin(name,code){const o=await unpack(code);if(o.t!=='o')throw new Error('Paste the host\'s code.');close();st.role='guest';st.phase='codes';const pc=makePC();pc.ondatachannel=e=>{if(!st.dc&&e.channel.label==='px')wire(e.channel);};
  await pc.setRemoteDescription({type:'offer',sdp:o.s});await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);return pack({t:'a',s:pc.localDescription.sdp,name:S.cleanName(name)});}
 const leave=()=>{send({t:'bye'});close();};
 return{st,send,close,leave,strike,host,join,codesHost,codesAccept,codesJoin};}

/* names are shared by the hub and the worlds: stored on this device only */
function myName(){let v='',u='';try{v=localStorage.getItem('pxd_nick')||'';u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(_){}return S.cleanName(v||u,'')||('Guest '+S.randomId(3).toUpperCase());}
function setName(v){const n=S.cleanName(v,'');try{n?localStorage.setItem('pxd_nick',n):localStorage.removeItem('pxd_nick');}catch(_){}return n;}
root.PXLink=Object.freeze({make,myName,setName,pack,unpack});
})(typeof window!=='undefined'?window:globalThis);
