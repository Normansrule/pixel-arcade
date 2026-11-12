/* PIXEL ARCADE · Online play, as a guest or signed in.
   How it connects: the host opens a room and gets a 6-character code. The guest types it (or opens the room link /
   scans the QR code). The two browsers swap connection offers through a free public signaling server (PeerJS
   protocol, js/online/config.js), find each other with public STUN servers, then talk directly over a WebRTC data
   channel. The signaling link closes as soon as the players are connected; no game data goes through any server.
   No internet server at all? "Swap codes" does the same exchange by copy-paste / QR code (works on one network).

   What can be played: every canvas cabinet.
   - 2-player cabinets (vs) run in LOCKSTEP: both browsers run the same simulation from the same seed and only send
     each other their buttons, a few frames ahead (input delay). Math.random is swapped for a seeded generator
     during game steps, so both screens stay identical; a state hash is compared every 2 seconds.
   - solo cabinets run as a SCORE DUEL: both players get the same seed and the same round clock, see each other's
     score live, and the results card names the winner.

   Security: every message is parsed by PXSafe.parse (strict schema, size limit), every peer is rate limited, other
   players' names and chat are shown with textContent / canvas text only, and nothing here uses innerHTML. */
(function(){
'use strict';
const A=window.A,E=A._e,S=window.PXSafe,CFG=window.PX_ONLINE;
if(!A||!S||!CFG)return;
A.net={on:false};// legacy per-game protocol (round 30): unused, lockstep needs no game code

/* ---------- which games can be played online ---------- */
// vs cabinets that read the mouse or typed letters (not part of the synced input), or that failed the lockstep
// determinism probe in tests/net.test.js. They stay local only.
const NO_LOCK=new Set(['trivia','lanerush','kitchenchaos','melondrop','sinkhole','ttt','dots','fighters','rps','dominoes','fencing','go7','amazons','wizardduel','fjordrace']);
const modeOf=g=>!g||g.href?null:g.vs?(NO_LOCK.has(g.id)||g.typing?null:'lock'):'duel';
A.onlineMode=modeOf;
const EMO=['GG','NICE!','WOW','OOPS','REMATCH?','HELLO','GOOD LUCK','TOO EASY'];
const now=()=>performance.now();

/* ---------- QR code (byte mode, error correction L, versions 1-20) ---------- */
const QL=[,[19,7,1,0],[34,10,1,0],[55,15,1,0],[80,20,1,0],[108,26,1,0],[68,18,2,0],[78,20,2,0],[97,24,2,0],[116,30,2,0],[68,18,2,2],[81,20,4,0],[92,24,2,2],[107,26,4,0],[115,30,3,1],[87,22,5,1],[98,24,5,1],[107,28,1,5],[120,30,5,1],[113,28,3,4],[107,28,3,5]];
const AL=[,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90]];
const gmul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((y>>>i)&1)*x;}return z&255;};
const rsDiv=n=>{const r=Array(n).fill(0);r[n-1]=1;let root=1;for(let i=0;i<n;i++){for(let j=0;j<n;j++){r[j]=gmul(r[j],root);if(j+1<n)r[j]^=r[j+1];}root=gmul(root,2);}return r;};
const rsRem=(d,dv)=>{const r=dv.map(()=>0);for(const b of d){const f=b^r.shift();r.push(0);dv.forEach((c,i)=>r[i]^=gmul(c,f));}return r;};
function qr(text){const bytes=[...new TextEncoder().encode(text)];let v=1;for(;v<=20;v++){const[q,,s,l]=QL[v];if(4+(v<10?8:16)+bytes.length*8<=(q*s+(q+1)*l)*8)break;}if(v>20)return null;
 const[q,ec,s,l]=QL[v],cap=q*s+(q+1)*l,bits=[];const put=(x,n)=>{for(let i=n-1;i>=0;i--)bits.push((x>>>i)&1);};put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
 put(0,Math.min(4,cap*8-bits.length));while(bits.length%8)bits.push(0);const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));for(let p=0xEC;data.length<cap;p^=0xEC^0x11)data.push(p);
 const blocks=[],dv=rsDiv(ec);let k=0;for(let b=0;b<s+l;b++){const n=q+(b<s?0:1),d=data.slice(k,k+n);k+=n;blocks.push([d,rsRem(d,dv)]);}
 const cw=[];for(let i=0;i<=q;i++)blocks.forEach(([d])=>{if(i<d.length)cw.push(d[i]);});for(let i=0;i<ec;i++)blocks.forEach(([,e])=>cw.push(e[i]));
 const N=v*4+17,M=[...Array(N)].map(()=>Array(N).fill(0)),F=[...Array(N)].map(()=>Array(N).fill(false));const set=(x,y,d)=>{M[y][x]=d?1:0;F[y][x]=true;};
 for(let i=0;i<N;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
 for(const[cx,cy]of[[3,3],[N-4,3],[3,N-4]])for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy,d=Math.max(Math.abs(dx),Math.abs(dy));if(x>=0&&y>=0&&x<N&&y<N)set(x,y,d!==2&&d!==4);}
 const ap=AL[v];for(const ay of ap)for(const ax of ap){if(ax===6&&ay===6||ax===6&&ay===N-7||ax===N-7&&ay===6)continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);}
 const fmt=mask=>{const d=1<<3|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412,bit=i=>(b>>>i)&1;
  for(let i=0;i<=5;i++)set(8,i,bit(i));set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));for(let i=9;i<15;i++)set(14-i,8,bit(i));for(let i=0;i<8;i++)set(N-1-i,8,bit(i));for(let i=8;i<15;i++)set(8,N-15+i,bit(i));set(8,N-8,1);};
 fmt(0);if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1f25);const b=v<<12|r;for(let i=0;i<18;i++){const d=(b>>>i)&1,a=N-11+i%3,c=(i/3)|0;set(a,c,d);set(c,a,d);}}
 let i=0;for(let right=N-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<N;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?N-1-vert:vert;if(!F[y][x]){M[y][x]=i<cw.length*8?(cw[i>>>3]>>>(7-(i&7)))&1:0;i++;}}}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!F[y][x]&&(x+y)%2===0)M[y][x]^=1;
 return M;}
function drawQR(cv,text){const M=qr(text),c=cv.getContext('2d');if(!M){cv.hidden=true;return;}cv.hidden=false;const n=M.length+8,s=Math.max(3,Math.floor(240/n));cv.width=cv.height=n*s;c.fillStyle='#fff';c.fillRect(0,0,n*s,n*s);c.fillStyle='#000';
 M.forEach((row,y)=>row.forEach((d,x)=>{if(d)c.fillRect((x+4)*s,(y+4)*s,s,s);}));}

/* ---------- copy-paste codes (no server): session description -> deflate -> base64url ---------- */
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

/* ---------- signaling server client (PeerJS wire protocol) ---------- */
function Signal(id,on){const c=CFG.signal;const url=(c.secure?'wss':'ws')+'://'+c.host+':'+c.port+c.path.replace(/\/?$/,'/')+'peerjs?key='+encodeURIComponent(c.key)+'&id='+encodeURIComponent(id)+'&token='+S.randomId(12);
 let ws,hb=null,dead=false;const bucket=new S.Bucket(30,60);const fin=t=>{if(dead)return;dead=true;clearInterval(hb);on({type:t});};
 try{ws=new WebSocket(url);}catch(e){setTimeout(()=>fin('FAIL'));return{send(){},close(){}};}
 ws.onopen=()=>{hb=setInterval(()=>{if(ws.readyState===1)ws.send('{"type":"HEARTBEAT"}');},5000);};
 ws.onmessage=e=>{if(dead||!bucket.take(now()))return;const m=S.parseSignal(typeof e.data==='string'?e.data:'');if(m&&m.type!=='HEARTBEAT')on(m);};
 ws.onerror=()=>fin('FAIL');ws.onclose=()=>fin('CLOSED');
 return{send(type,dst,payload){if(!dead&&ws.readyState===1)ws.send(JSON.stringify({type,dst,payload}));},close(){dead=true;clearInterval(hb);try{ws.close();}catch(_){}}};}

/* ---------- the link ---------- */
const st={phase:'idle',role:null,room:null,sig:null,pc:null,dc:null,peer:null,cands:[],nc:0,rival:null,match:null,strikes:0,inB:null,chatB:null,myChatB:null,rtt:0,pingT:null,timer:null,tries:0,pick:null,n:0};
A.online=st;
const myName=()=>{if(A.auth&&A.auth.user&&A.auth.name)return A.auth.name;let v='';try{v=localStorage.getItem('pxd_nick')||'';}catch(_){}return S.cleanName(v||(A.auth&&A.auth.name)||(A.profile&&A.profile.user)||'','')||('Guest '+S.randomId(3).toUpperCase());};
const setName=v=>{const n=S.cleanName(v,'');try{n?localStorage.setItem('pxd_nick',n):localStorage.removeItem('pxd_nick');}catch(_){}return n;};
function send(m){if(!st.dc||st.dc.readyState!=='open')return false;try{st.dc.send(S.encode(m));return true;}catch(e){return false;}}
function teardown(){clearTimeout(st.timer);clearInterval(st.pingT);if(st.sig)st.sig.close();try{st.dc&&st.dc.close();}catch(_){}try{st.pc&&st.pc.close();}catch(_){}
 Object.assign(st,{phase:'idle',role:null,room:null,sig:null,pc:null,dc:null,peer:null,cands:[],nc:0,rival:null,strikes:0,rtt:0,pingT:null,timer:null,pick:null});endMatch();ui.dock();}
function makePC(){const pc=st.pc=new RTCPeerConnection({iceServers:JSON.parse(JSON.stringify(CFG.ice))});
 pc.onicecandidate=e=>{if(e.candidate&&st.sig&&st.peer)st.sig.send('CANDIDATE',st.peer,{c:e.candidate.candidate||'',m:String(e.candidate.sdpMid||'').slice(0,64),i:e.candidate.sdpMLineIndex||0});};
 pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'&&st.phase!=='linked')fail('Could not link the two browsers. One of you may be on a strict network (some school, office or mobile networks block direct links). Try another network.');};
 return pc;}
function wire(dc){st.dc=dc;st.inB=new S.Bucket(240,480);st.chatB=new S.Bucket(.6,4);st.myChatB=new S.Bucket(.6,4);
 dc.onopen=linked;dc.onclose=()=>{if(st.phase==='linked')lost('Your rival left.');};
 dc.onmessage=e=>{if(typeof e.data!=='string'||!st.inB.take(now())){strike();return;}const m=S.parse(e.data);if(!m){strike();return;}handle(m);};}
function strike(){if(++st.strikes>60)lost('The link was closed because the other browser sent too much bad data.');}
function linked(){clearTimeout(st.timer);st.phase='linked';if(st.sig){st.sig.close();st.sig=null;}// leave the signaling server: the room is now full
 send({t:'hi',v:1,name:myName(),app:CFG.app});st.pingT=setInterval(()=>send({t:'ping',p:Math.round(now())>>>0}),2000);ui.lobby();if(A.uiSfx)A.uiSfx('coin',.4);}
function fail(msg){teardown();ui.home(msg);}
function lost(msg){const M=st.match;teardown();if(M&&E.state!=='hub'){if(M.mode==='lock')oc();else if(A.toast)A.toast('RIVAL LEFT');}ui.home(msg);}
function onSig(m){switch(m.type){
 case'OPEN':st.tries=0;if(st.role==='host'){st.phase='waiting';ui.room();}else offer();break;
 case'ID-TAKEN':if(st.role==='host'&&st.tries++<3){st.sig.close();st.sig=null;openRoom();}else fail('Could not open a room. Try again.');break;
 case'OFFER':answer(m);break;
 case'ANSWER':if(st.role==='guest'&&m.src===st.peer&&st.pc&&!st.pc.remoteDescription)st.pc.setRemoteDescription({type:'answer',sdp:m.payload.sdp}).then(flushCands).catch(()=>fail('The host sent a bad answer.'));break;
 case'CANDIDATE':if(m.src===st.peer&&st.pc&&st.nc++<60){if(st.pc.remoteDescription)st.pc.addIceCandidate({candidate:m.payload.c,sdpMid:m.payload.m||'0',sdpMLineIndex:m.payload.i||0}).catch(()=>{});else st.cands.push(m.payload);}break;
 case'EXPIRE':if(st.role==='guest'&&st.phase!=='linked')fail('No open room has that code. Check it, or ask your friend to make a new room.');break;
 case'LEAVE':if(st.phase!=='linked'&&m.src===st.peer){if(st.role==='host'){resetGuest();}else fail('The host closed the room.');}break;
 case'INVALID-KEY':case'ERROR':case'FAIL':case'CLOSED':if(st.phase!=='linked'&&st.phase!=='idle')fail('Could not reach the free online server. Check your internet connection, or use "Swap codes" instead.');break;}}
function flushCands(){const c=st.cands.splice(0);c.forEach(p=>st.pc.addIceCandidate({candidate:p.c,sdpMid:p.m||'0',sdpMLineIndex:p.i||0}).catch(()=>{}));}
function resetGuest(){try{st.pc&&st.pc.close();}catch(_){}st.pc=st.dc=st.peer=null;st.cands=[];st.nc=0;ui.room();}
const GUEST=new RegExp('^'+CFG.prefix.replace(/[-]/g,'\\-')+'g[a-z0-9]{12}$');
async function answer(m){if(st.role!=='host'||st.phase!=='waiting'||st.peer||!GUEST.test(m.src))return;// one guest per room; later offers are ignored
 st.peer=m.src;ui.status('Linking with '+(m.payload.name||'a friend')+'…');const pc=makePC();pc.ondatachannel=e=>{if(!st.dc&&e.channel.label==='px')wire(e.channel);};
 try{await pc.setRemoteDescription({type:'offer',sdp:m.payload.sdp});flushCands();await pc.setLocalDescription(await pc.createAnswer());st.sig.send('ANSWER',st.peer,{k:'a',sdp:pc.localDescription.sdp});
  st.timer=setTimeout(()=>{if(st.phase!=='linked'){resetGuest();ui.status('That friend could not link. Still waiting…');}},20000);}catch(e){resetGuest();}}
async function offer(){const pc=makePC();wire(pc.createDataChannel('px',{ordered:true}));
 try{await pc.setLocalDescription(await pc.createOffer());st.sig.send('OFFER',st.peer,{k:'o',sdp:pc.localDescription.sdp,name:myName()});}catch(e){fail('Your browser could not start a connection.');return;}
 st.timer=setTimeout(()=>{if(st.phase!=='linked')fail('No answer from that room. Check the code, or ask your friend to make a new room.');},20000);}
function openRoom(){st.role='host';st.room=S.newRoom();st.phase='opening';st.sig=Signal(CFG.prefix+st.room.toLowerCase(),onSig);ui.status('Opening a room…');}
function hostRoom(){teardown();st.tries=0;openRoom();}
function joinRoom(code){const c=S.cleanRoom(code);if(!c){ui.err('Room codes are 6 letters and numbers, like K7QF2M.');return;}teardown();st.role='guest';st.room=c;st.phase='joining';st.peer=CFG.prefix+c.toLowerCase();
 st.sig=Signal(CFG.prefix+'g'+S.randomId(12),onSig);ui.status('Looking for room '+c+'…');}
/* no-server mode: the same link, set up by swapping two codes */
async function codesHost(){teardown();st.role='host';st.phase='codes';const pc=makePC();wire(pc.createDataChannel('px',{ordered:true}));await pc.setLocalDescription(await pc.createOffer());await gathered(pc);return pack({t:'o',s:pc.localDescription.sdp,name:myName()});}
async function codesAccept(code){const o=await unpack(code);if(o.t!=='a')throw new Error('Paste the answer code from your friend.');if(!st.pc||st.pc.remoteDescription)throw new Error('Start again: make a new code.');await st.pc.setRemoteDescription({type:'answer',sdp:o.s});}
async function codesJoin(code){const o=await unpack(code);if(o.t!=='o')throw new Error('Paste the host\'s code.');teardown();st.role='guest';st.phase='codes';const pc=makePC();pc.ondatachannel=e=>{if(!st.dc&&e.channel.label==='px')wire(e.channel);};
 await pc.setRemoteDescription({type:'offer',sdp:o.s});await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);return pack({t:'a',s:pc.localDescription.sdp,name:myName()});}

/* ---------- messages ---------- */
function handle(m){const M=st.match;switch(m.t){
 case'hi':st.rival={name:m.name,app:m.app};ui.lobby();ui.sys(m.name+' joined.');if(m.app!==CFG.app)ui.sys('Your rival runs a different arcade version. Both of you should reload the page.');break;
 case'chat':if(st.chatB.take(now()))ui.chat(rivalName(),m.text,false);break;
 case'emo':if(st.chatB.take(now())){ui.chat(rivalName(),EMO[m.e],false);if(E.state!=='hub'&&A.toast)A.toast(rivalName().toUpperCase()+': '+EMO[m.e]);}break;
 case'pick':if(st.role==='guest'){const g=A.games.find(x=>x.id===m.game);st.pick=g&&modeOf(g)?g:null;ui.lobby();}break;
 case'go':if(st.role==='guest')start(m);break;
 case'in':if(M&&M.mode==='lock'){if(m.f<M.F||m.f+m.k.length>M.F+240){strike();break;}m.k.forEach((k,i)=>{if(!M.remote.has(m.f+i))M.remote.set(m.f+i,k);});}break;
 case'h':if(M&&M.mode==='lock'){M.theirs.set(m.f,m.h);checkHash(m.f);}break;
 case'sc':if(M&&M.mode==='duel'&&m.n===M.n&&!M.rival.done){M.rival.score=m.s;if(m.done){M.rival.done=true;M.rival.over=m.over||'';}}break;
 case'again':if(M&&m.n===M.n){M.again.them=true;if(st.role==='host'&&M.again.me)rematch();else if(A.toast&&E.state==='over')A.toast(rivalName().toUpperCase()+' WANTS A REMATCH');}break;
 case'quit':if(M&&m.n===M.n){if(M.mode==='lock'){endMatch();oc();ui.open();ui.sys(rivalName()+' left the game.');}else{M.rival.done=true;M.rival.quit=true;if(A.toast)A.toast('RIVAL LEFT THE GAME');}}break;
 case'ping':send({t:'pong',p:m.p});break;
 case'pong':st.rtt=Math.max(0,Math.round(now())-m.p);ui.ping();break;
 case'bye':lost('Your rival left.');break;}}
const rivalName=()=>st.rival?st.rival.name:'Rival';

/* ---------- matches ---------- */
function choose(g){if(st.role!=='host'||st.phase!=='linked')return;const mode=modeOf(g);if(!mode)return;
 const m={t:'go',game:g.id,seed:S.randomSeed(),mode,delay:Math.max(3,Math.min(10,Math.ceil((st.rtt/2+20)/16.7))),n:++st.n};if(send(m))start(m);}
function rematch(){const M=st.match;if(!M)return;const m={t:'go',game:M.g.id,seed:S.randomSeed(),mode:M.mode,delay:M.delay,n:++st.n};if(send(m))start(m);}
function start(m){const g=A.games.find(x=>x.id===m.game);if(!g||modeOf(g)!==m.mode)return;st.n=m.n;
 const M=st.match={g,mode:m.mode,n:m.n,delay:m.delay,F:0,local:new Map(),remote:new Map(),theirs:new Map(),mine:new Map(),prev:[0,0],rand:S.mulberry(m.seed),stall:0,rival:{score:null,done:false,over:''},meDone:false,again:{me:false,them:false},desync:false};
 for(let f=0;f<M.delay;f++){M.local.set(f,0);M.remote.set(f,0);}
 ui.hide();if(E.state==='hub'||E.cur!==g)A.open(g);
 E.netTick=tick;E.netIn=M.mode==='lock'?applyInputs:null;E.onAgain=onAgain;E.netInfo=info;E.netHud=hud;
 E.sel=M.mode==='lock'?1:0;withSim(()=>E.start());if(A.toast)A.toast('ONLINE · '+(M.mode==='lock'?(st.role==='host'?'YOU ARE P1':'YOU ARE P2'):'SCORE DUEL')+' VS '+rivalName().toUpperCase());}
function endMatch(){st.match=null;E.netTick=E.netIn=E.onAgain=E.netInfo=E.netHud=null;}
function withSim(fn){const M=st.match,r=Math.random;if(M)Math.random=M.rand;try{fn();}finally{Math.random=r;}}
/* called by the cabinet loop instead of step(); returns false to wait for the rival's input */
function tick(step){const M=st.match;if(!M){step();return true;}
 if(M.mode==='duel'){withSim(step);duelSync();return true;}
 if(!M.remote.has(M.F)){M.stall++;return false;}
 M.stall=0;const ms=A.mouse,md=ms.down,mb=ms.bdown;withSim(step);ms.down=md;ms.bdown=mb;M.local.delete(M.F);M.remote.delete(M.F);M.F++;
 if(M.F%120===0&&E.g){const v=S.stateHash(E.g);M.mine.set(M.F,v);send({t:'h',f:M.F,h:v});checkHash(M.F);}
 return true;}
const bits=o=>(o.l?1:0)|(o.r?2:0)|(o.u?4:0)|(o.d?8:0)|(o.a?16:0)|(o.b?32:0);
/* called by step() right after the keyboard is read: replace both players' buttons with the synced ones */
function applyInputs(){const M=st.match;if(!M)return;E.paused=false;const f=M.F+M.delay;const ms=A.mouse;// the mouse is not synced: clicks already count as button A in the bits, so games must not read it directly
 ms.dx=ms.dy=0;
 if(!M.local.has(f)){const k=bits(E.held[0])|bits(E.held[1]);M.local.set(f,k);send({t:'in',f,k:[k]});}
 const mine=M.local.get(M.F)||0,theirs=M.remote.get(M.F)||0,v=st.role==='host'?[mine,theirs]:[theirs,mine];
 E.N.forEach((n,i)=>{for(let p=0;p<2;p++){const on=!!(v[p]>>i&1);E.held[p][n]=on;E.hitS[p][n]=on&&!(M.prev[p]>>i&1);}});M.prev=v;ms.down=ms.bdown=false;}
function checkHash(f){const M=st.match;if(!M||M.desync||!M.mine.has(f)||!M.theirs.has(f))return;if(M.mine.get(f)!==M.theirs.get(f)){M.desync=true;if(A.toast)A.toast('OUT OF SYNC · RESULTS MAY DIFFER');}M.mine.delete(f);M.theirs.delete(f);}
function duelSync(){const M=st.match;if(!M||!E.g)return;const s=S.cleanScore(E.g.score);
 if(E.state==='play'&&A.t%20===0&&s!==null)send({t:'sc',n:M.n,s});
 if(E.state==='over'&&!M.meDone){M.meDone=true;send({t:'sc',n:M.n,s:s===null?0:s,done:true,over:S.cleanText(E.g.over,40)});}}
function onAgain(){const M=st.match;if(!M||M.mode!=='duel')return false;// lockstep: the host's SPACE restarts both screens on the same frame
 if(!M.again.me){M.again.me=true;send({t:'again',n:M.n});}if(st.role==='host'&&M.again.them)rematch();else if(A.toast)A.toast('WAITING FOR '+rivalName().toUpperCase());return true;}
const winHead=s=>{const me=st.role==='host'?1:2,m=/PLAYER ([12]) WINS/.exec(s||'');return m?(+m[1]===me?'YOU WIN!':'RIVAL WINS!'):s;};
/* the results card asks for: a headline, the rival's name and score, and the mode label */
function info(){const M=st.match;if(!M||!E.g)return null;const out={label:'ONLINE · VS '+rivalName().toUpperCase().slice(0,12),rival:rivalName()};
 if(M.mode==='lock'){out.head=winHead(E.g.over);out.lock=1;return out;}
 const me=S.cleanScore(E.g.score);out.score=M.rival.score;out.done=M.rival.done;
 if(M.rival.done&&me!==null&&M.rival.score!==null){const low=!!M.g.low,d=me-M.rival.score;out.head=M.rival.quit?'RIVAL LEFT':d===0?'DRAW!':(low?d<0:d>0)?'YOU WIN!':'RIVAL WINS!';}else out.head=E.g.over;
 return out;}
/* live overlay on the cabinet screen: rival score (duel), waiting notice (lockstep) */
function hud(){const M=st.match;if(!M||E.state!=='play')return;const c=A.c;c.save();c.font='700 6.5px "JetBrains Mono",ui-monospace,monospace';c.textBaseline='middle';
 if(M.mode==='duel'){const nm=rivalName().toUpperCase().slice(0,12),sc=M.rival.score===null?'…':String(Math.round(M.rival.score)),t=nm+' '+sc+(M.rival.done?' ✓':''),w=c.measureText(t).width+14;
  c.fillStyle='rgba(8,8,8,.78)';c.fillRect(A.W-w-4,22,w,12);c.fillStyle='#ff4d00';c.fillRect(A.W-w-4,22,2,12);c.fillStyle='#f4f2ec';c.textAlign='right';c.fillText(t,A.W-10,28.5);}
 else if(M.stall>20){c.fillStyle='rgba(0,0,0,.55)';c.fillRect(0,A.H/2-12,A.W,24);c.fillStyle='#f4f2ec';c.textAlign='center';c.fillText('WAITING FOR '+rivalName().toUpperCase().slice(0,12)+'…',A.W/2,A.H/2);}
 c.restore();}
const oc=A.close;A.close=(...a)=>{const M=st.match;if(M){send({t:'quit',n:M.n});endMatch();}const r=oc(...a);if(st.phase==='linked')ui.open();return r;};

/* ---------- lobby UI (DOM built with textContent only) ---------- */
function h(tag,attrs,...kids){const el=document.createElement(tag);if(attrs)for(const k of Object.keys(attrs)){const v=attrs[k];if(v===null||v===undefined||v===false)continue;
 if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k.slice(0,2)==='on')el.addEventListener(k.slice(2),v);else el.setAttribute(k,v===true?'':String(v));}
 for(const c of kids.flat()){if(c===null||c===undefined||c===false)continue;el.append(c instanceof Node?c:document.createTextNode(String(c)));}return el;}
const ui={};let box=null,body=null,dockEl=null,logEl=null;const log=[];
const clear=n=>{while(n.firstChild)n.removeChild(n.firstChild);};
function ensure(){if(box)return;box=h('div',{class:'board netbox',hidden:true,role:'dialog','aria-modal':'true','aria-labelledby':'netTitle'},h('div',{class:'bpanel'},h('h3',{id:'netTitle',text:'PLAY ONLINE'}),body=h('div',{class:'nb'}),
 h('p',{class:'bnote',text:'Play anyone, anywhere, as a guest. A free public server introduces your two browsers once; after that the game runs directly between you. Like any direct link, your rival\'s browser can see your internet address, so play with people you know.'}),
 h('button',{type:'button',class:'nclose',text:'Close',onclick:()=>ui.hide()})));document.body.appendChild(box);
 box.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')ui.hide();});}
ui.open=pre=>{if(!window.RTCPeerConnection){alert('This browser cannot play online.');return;}ensure();box.hidden=false;
 if(st.phase==='linked')ui.lobby();else if(st.phase==='waiting')ui.room();else if(st.phase==='idle'||st.phase==='codes'&&!pre)ui.home('',pre);const f=box.querySelector('input,button');if(f)f.focus();};
ui.hide=()=>{if(box)box.hidden=true;if(st.phase!=='linked'&&st.phase!=='idle'&&st.phase!=='codes')teardown();ui.dock();};
ui.status=t=>{ensure();clear(body);body.append(h('p',{class:'nmsg',text:t}),h('div',{class:'nrow'},h('button',{type:'button',text:'Cancel',onclick:()=>{teardown();ui.home();}})));};
ui.err=t=>{if(!body)return;let s=body.querySelector('.nerr');if(!s){s=h('p',{class:'nmsg nerr',role:'alert'});body.appendChild(s);}s.textContent=t;};
function nameRow(){const inp=h('input',{class:'ninp',type:'text',maxlength:S.NAME_MAX,autocomplete:'nickname',spellcheck:'false','aria-label':'Your name'});inp.value=myName();
 inp.addEventListener('change',()=>{inp.value=setName(inp.value)||myName();});return h('label',{class:'nlab'},'Your name ',inp,h('small',{text:' letters, numbers, spaces; 16 max'}));}
ui.home=(msg,pre)=>{ensure();box.hidden=false;clear(body);const code=h('input',{class:'ninp ncode',type:'text',maxlength:9,autocomplete:'off',autocapitalize:'characters',spellcheck:'false',placeholder:'K7QF2M','aria-label':'Room code'});
 if(pre&&pre.room)code.value=pre.room;
 body.append(nameRow(),
  h('div',{class:'ncols'},
   h('div',{class:'ncol'},h('b',{text:'Make a room'}),h('p',{text:'You get a code to send to a friend.'}),h('button',{type:'button',class:'nhot',text:'CREATE ROOM',onclick:hostRoom})),
   h('div',{class:'ncol'},h('b',{text:'Join a room'}),h('p',{text:'Type your friend\'s room code.'}),code,h('button',{type:'button',class:'nhot',text:'JOIN',onclick:()=>joinRoom(code.value)}))),
  accountBox(),
  h('p',{class:'nsmall'},h('a',{href:'#',text:'No internet server? Swap codes instead (works on one network)',onclick:e=>{e.preventDefault();ui.codes(pre&&pre.code);}})));
 code.addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom(code.value);});if(msg)ui.err(msg);if(pre&&pre.code)ui.codes(pre.code);};
/* optional sign-in (js/online/auth.js); hidden until accounts are switched on in js/online/config.js */
function accountBox(){const au=A.auth;if(!au||!au.enabled)return '';const box=h('div',{class:'nacct'});const msg=t=>{let p=box.querySelector('.nmsg');if(!p){p=h('p',{class:'nmsg',role:'status'});box.append(p);}p.textContent=t;};
 if(au.user){box.append(h('p',null,'Signed in as ',h('b',{text:au.name||'player'}),'. Your tokens and wins are saved to your account. '),h('button',{type:'button',text:'Sign out',onclick:async()=>{await au.signOut();ui.home();}}));return box;}
 const em=h('input',{class:'ninp',type:'email',maxlength:254,autocomplete:'email','aria-label':'Email for a sign-in code',placeholder:'you@example.com'}),cd=h('input',{class:'ninp',type:'text',inputmode:'numeric',maxlength:10,autocomplete:'one-time-code','aria-label':'Code from the email',placeholder:'123456',hidden:true});
 const vb=h('button',{type:'button',text:'Verify',hidden:true,onclick:async()=>{try{await au.verify(em.value,cd.value);ui.home();}catch(e){msg(e.message);}}});
 box.append(h('details',null,h('summary',{text:'Sign in (optional): save your tokens and keep your name'}),h('p',{text:'Guests can play everything. Signing in only saves your progress to your account.'}),em,
  h('div',{class:'nrow'},h('button',{type:'button',text:'Email me a code',onclick:async()=>{try{await au.emailCode(em.value);cd.hidden=false;vb.hidden=false;cd.focus();msg('Check your email for a 6-digit code.');}catch(e){msg(e.message);}}}),
   au.app?null:h('button',{type:'button',text:'Sign in with GitHub',onclick:()=>au.github().catch(e=>msg(e.message))})),cd,vb));
 [em,cd].forEach(i=>{i.addEventListener('keydown',e=>e.stopPropagation());});return box;}
ui.room=()=>{ensure();clear(body);const link=location.href.split('#')[0]+'#room='+st.room,cv=h('canvas',{class:'nqr','aria-label':'QR code for the room link'});
 body.append(h('p',{text:'Send this room code to your friend, or let them scan the QR code:'}),h('div',{class:'nroom',text:st.room.slice(0,3)+' '+st.room.slice(3)}),
  h('div',{class:'nrow'},h('button',{type:'button',text:'Copy link',onclick:async e=>{try{await navigator.clipboard.writeText(link);e.target.textContent='Copied';}catch(_){e.target.textContent='Copy failed';}}}),h('button',{type:'button',text:'Close room',onclick:()=>{teardown();ui.home();}})),
  cv,h('p',{class:'nmsg',text:'Waiting for a friend… the room closes when you close this.'}));drawQR(cv,link);};
ui.codes=async pre=>{ensure();clear(body);const ta=h('textarea',{class:'noff',rows:3,placeholder:'PXA2…',spellcheck:'false','aria-label':'Host code'});if(pre)ta.value=pre;
 body.append(h('p',{text:'Without a server, the two browsers set up the link by swapping two codes. This normally only works when you are both on the same network.'}),
  h('div',{class:'nrow'},h('button',{type:'button',class:'nhot',text:'MAKE A HOST CODE',onclick:hostCodes})),h('label',{text:'Or paste the host\'s code:'}),ta,
  h('div',{class:'nrow'},h('button',{type:'button',text:'MAKE ANSWER',onclick:async()=>{try{const a=await codesJoin(ta.value);showCode('Send this answer code back to the host:',a);ui.err('Waiting for the host…');}catch(e){ui.err(e.message);}}}),h('button',{type:'button',text:'Back',onclick:()=>{teardown();ui.home();}})));
 async function hostCodes(){try{const code=await codesHost();showCode('1 · Send this code to your friend:',code,location.href.split('#')[0]+'#join='+code);const ans=h('textarea',{rows:3,placeholder:'PXA2…',spellcheck:'false','aria-label':'Answer code'});
  body.append(h('label',{text:'2 · Paste the answer code they send back:'}),ans,h('div',{class:'nrow'},h('button',{type:'button',class:'nhot',text:'CONNECT',onclick:async()=>{try{await codesAccept(ans.value);ui.err('Connecting…');}catch(e){ui.err(e.message);}}})));}catch(e){ui.err(e.message||'Could not make a code.');}}
 function showCode(label,code,qrText){clear(body);const t=h('textarea',{readonly:true,rows:3});t.value=code;const cv=h('canvas',{class:'nqr'});
  body.append(h('label',{text:label}),t,h('div',{class:'nrow'},h('button',{type:'button',text:'Copy code',onclick:async e=>{try{await navigator.clipboard.writeText(code);e.target.textContent='Copied';}catch(_){t.select();}}})),cv);drawQR(cv,qrText||code);}};
ui.lobby=()=>{ui.dock();if(!box||box.hidden)return;clear(body);const host=st.role==='host';
 body.append(h('div',{class:'nvs'},h('span',{class:'nme',text:myName()}),h('i',{text:' vs '}),h('span',{class:'nthem',text:st.rival?st.rival.name:'…'}),h('small',{class:'nping',text:st.rtt?st.rtt+' ms':''})));
 if(host){const q=h('input',{class:'ninp',type:'search',maxlength:30,placeholder:'Search 544 games',spellcheck:'false','aria-label':'Search games'}),list=h('div',{class:'ngames',role:'list'});
  const fill=()=>{clear(list);const t=S.cleanText(q.value,30).toLowerCase();let n=0;for(const g of A.games){const md=modeOf(g);if(!md||t&&g.name.toLowerCase().indexOf(t)<0&&g.cat.toLowerCase().indexOf(t)<0)continue;
   list.append(h('button',{type:'button',role:'listitem',class:'ngame',onclick:()=>choose(g)},h('b',{text:E.tc?E.tc(g.name):g.name}),h('small',{text:md==='lock'?'2 PLAYERS':'SCORE DUEL'})));if(++n>=60)break;}
   if(!n)list.append(h('p',{text:'No game matches that search.'}));};
  q.addEventListener('input',fill);fill();body.append(h('p',{text:'Pick a game. 2-player games put you head to head; solo games become a score duel on the same level and clock.'}),q,list);}
 else body.append(h('p',{class:'nmsg',text:st.pick?(rivalName()+' is looking at '+(E.tc?E.tc(st.pick.name):st.pick.name)+'…'):(rivalName()+' is picking a game…')}));
 body.append(chatBox(),h('div',{class:'nrow'},h('button',{type:'button',text:'Leave',onclick:()=>{send({t:'bye'});teardown();ui.home();}})));};
ui.ping=()=>{if(box){const p=box.querySelector('.nping');if(p)p.textContent=st.rtt+' ms';}};
function chatBox(){const inp=h('input',{class:'ninp',type:'text',maxlength:S.CHAT_MAX,autocomplete:'off','aria-label':'Chat message',placeholder:'Say something…'});logEl=h('div',{class:'nlog','aria-live':'polite'});drawLog();
 const go=()=>{const t=S.cleanChat(inp.value);if(!t)return;if(!st.myChatB.take(now())){ui.sys('Slow down a little.');return;}if(send({t:'chat',text:t}))ui.chat(myName(),t,true);inp.value='';};
 inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();go();}else if(e.key==='Escape')inp.blur();});inp.addEventListener('keyup',e=>e.stopPropagation());
 return h('div',{class:'nchat'},logEl,h('div',{class:'nrow'},inp,h('button',{type:'button',text:'Send',onclick:go})),
  h('div',{class:'nemo'},EMO.map((t,i)=>h('button',{type:'button',text:t,onclick:()=>{if(!st.myChatB.take(now()))return;if(send({t:'emo',e:i}))ui.chat(myName(),t,true);}}))));}
function drawLog(){for(const el of [logEl,dockEl&&dockEl.querySelector('.nlog')]){if(!el)continue;clear(el);log.slice(-30).forEach(l=>el.append(h('p',{class:l.sys?'sys':l.me?'me':''},l.sys?null:h('b',{text:l.who+': '}),l.text)));el.scrollTop=el.scrollHeight;}}
ui.chat=(who,text,me)=>{log.push({who,text,me});if(log.length>60)log.shift();drawLog();if(dockEl&&!me)dockEl.classList.add('new');};
ui.sys=t=>{log.push({sys:1,text:t});drawLog();};
/* small dock while linked and the lobby is closed: opens the lobby (chat, game list) */
ui.dock=()=>{const on=st.phase==='linked';if(!dockEl){if(!on)return;dockEl=h('button',{type:'button',class:'ndock',onclick:()=>{dockEl.classList.remove('new');ui.open();}});document.body.appendChild(dockEl);}
 dockEl.hidden=!on||(box&&!box.hidden);if(on)dockEl.textContent='ONLINE · '+rivalName()+' · chat';};
A.netLobby=()=>ui.open();
const fromHash=()=>{const r=location.hash.match(/^#room=([A-Za-z0-9-]{6,9})$/),c=location.hash.match(/^#join=(PXA2\.[A-Za-z0-9_-]{8,12000})$/);if(!r&&!c)return;
 try{history.replaceState(null,'',location.pathname+location.search);}catch(_){}// the player still has to press JOIN: opening a link never connects by itself
 if(st.phase!=='idle')return;ui.open(r?{room:S.cleanRoom(r[1])||''}:{code:c[1]});};
const boot=()=>{const b=document.getElementById('netBtn');if(b){b.title='Play a friend anywhere, as a guest';b.onclick=e=>{e.preventDefault();ui.open();};}fromHash();addEventListener('hashchange',fromHash);};
if(typeof document!=='undefined')document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
A._net={st,handle,start,tick,applyInputs,info,choose,modeOf};// test hooks
})();
