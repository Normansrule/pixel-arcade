/* PIXEL ARCADE · Online play over WebRTC with copy-paste / QR codes. No server: the two browsers swap an offer code and an answer code,
   then talk directly over a data channel. No STUN/TURN servers are contacted (owner rule: no network calls), so it connects players on the
   same network (home Wi-Fi, LAN); across the internet most routers block it. Games opt in with `net:1` and read A.net (see games/puzzle.js FOUR). */
(function(){const A=window.A,E=A._e;
/* ---------- QR code (byte mode, error correction L, versions 1-20) ---------- */
const QL=[,[19,7,1,0],[34,10,1,0],[55,15,1,0],[80,20,1,0],[108,26,1,0],[68,18,2,0],[78,20,2,0],[97,24,2,0],[116,30,2,0],[68,18,2,2],[81,20,4,0],[92,24,2,2],[107,26,4,0],[115,30,3,1],[87,22,5,1],[98,24,5,1],[107,28,1,5],[120,30,5,1],[113,28,3,4],[107,28,3,5]];// [data per short block, ec per block, short blocks, long blocks(+1 data)]
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
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!F[y][x]&&(x+y)%2===0)M[y][x]^=1;// mask 0
 return M;}
function drawQR(cv,text){const M=qr(text),c=cv.getContext('2d');if(!M){cv.hidden=true;return;}cv.hidden=false;const n=M.length+8,s=Math.max(3,Math.floor(320/n));cv.width=cv.height=n*s;c.fillStyle='#fff';c.fillRect(0,0,n*s,n*s);c.fillStyle='#000';
 M.forEach((row,y)=>row.forEach((d,x)=>{if(d)c.fillRect((x+4)*s,(y+4)*s,s,s);}));}
/* ---------- codes: session description -> deflate -> base64url ---------- */
const b64=u=>btoa(String.fromCharCode(...u)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const pipe=async(u,T)=>new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new T('deflate-raw'))).arrayBuffer());
async function pack(o){return 'PXA1.'+b64(await pipe(new TextEncoder().encode(JSON.stringify(o)),CompressionStream));}
async function unpack(code){code=String(code||'').trim();const m=code.match(/PXA1\.([A-Za-z0-9_-]+)/);if(!m)throw new Error('That is not an arcade code.');return JSON.parse(new TextDecoder().decode(await pipe(unb64(m[1]),DecompressionStream)));}
const gathered=pc=>new Promise(r=>{if(pc.iceGatheringState==='complete')return r();const t=setTimeout(r,4000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);r();}});});
/* ---------- the link: A.net ---------- */
let pc=null,dc=null;const N=A.net={on:false,me:0,game:null,inbox:[],send(o){if(dc&&dc.readyState==='open')dc.send(JSON.stringify(o));},take(){return N.inbox.splice(0);}};
function wire(ch){dc=ch;ch.onopen=()=>{N.on=true;N.inbox=[];ui.go();};ch.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(_){return;}if(m.bye){N.on=false;ui.lost();return;}N.inbox.push(m);};ch.onclose=()=>{if(N.on){N.on=false;ui.lost();}};}
function reset(){N.on=false;N.inbox=[];try{dc&&dc.close();}catch(_){}try{pc&&pc.close();}catch(_){}pc=dc=null;}
async function host(gid){reset();N.me=0;N.game=gid;pc=new RTCPeerConnection({iceServers:[]});wire(pc.createDataChannel('px',{ordered:true}));await pc.setLocalDescription(await pc.createOffer());await gathered(pc);return pack({g:gid,t:'o',s:pc.localDescription.sdp});}
async function accept(code){const o=await unpack(code);if(o.t!=='a')throw new Error('Paste the answer code from your friend.');await pc.setRemoteDescription({type:'answer',sdp:o.s});}
async function join(code){const o=await unpack(code);if(o.t!=='o')throw new Error('Paste the host code (it starts with PXA1).');if(!A.games.find(g=>g.id===o.g&&g.net))throw new Error('This arcade does not know that game. Update the page.');
 reset();N.me=1;N.game=o.g;pc=new RTCPeerConnection({iceServers:[]});pc.ondatachannel=e=>wire(e.channel);await pc.setRemoteDescription({type:'offer',sdp:o.s});await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);return pack({t:'a',s:pc.localDescription.sdp});}
N.host=host;N.accept=accept;N.join=join;N.qr=qr;N.pack=pack;N.unpack=unpack;
const oc=A.close;A.close=(...a)=>{if(N.on){N.send({bye:1});reset();}return oc(...a);};
/* ---------- lobby UI ---------- */
const ui={};let box=null;const el=(h)=>{const d=document.createElement('div');d.innerHTML=h;return d.firstElementChild;};
function open(pre){if(!window.RTCPeerConnection||!window.CompressionStream){alert('This browser cannot play online.');return;}if(!box){box=el(`<div class="board netbox" hidden><div class="bpanel"><h3>PLAY ONLINE</h3><div class="nb"></div><p class="bnote">Swap two codes with a friend (chat, text, or scan the QR code). The games then talk directly between your browsers; no server is used, so you both need to be on the same network, such as the same Wi-Fi.</p><button type="button" class="nclose">Close</button></div></div>`);document.body.appendChild(box);box.querySelector('.nclose').onclick=()=>{box.hidden=true;if(!N.on)reset();};}
 box.hidden=false;pre?showJoin(pre):pick();}
const nb=()=>box.querySelector('.nb'),games=()=>A.games.filter(g=>g.net);
function pick(){nb().innerHTML=`<p>Choose a game, then HOST and send your friend the code, or JOIN with theirs.</p><div class="nrow">${games().map(g=>`<button type="button" data-g="${g.id}">HOST ${g.name}</button>`).join('')}<button type="button" class="njoin">JOIN WITH A CODE</button></div>`;
 nb().querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>showHost(b.dataset.g));nb().querySelector('.njoin').onclick=()=>showJoin('');}
const codeBox=(label,code)=>`<label>${label}</label><textarea readonly rows="3">${code}</textarea><div class="nrow"><button type="button" class="ncopy">Copy code</button></div><canvas class="nqr"></canvas>`;
function wireCopy(code){const b=nb().querySelector('.ncopy');b.onclick=async()=>{try{await navigator.clipboard.writeText(code);b.textContent='Copied';}catch(_){nb().querySelector('textarea').select();}};}
const say=(t,bad)=>{let s=nb().querySelector('.nmsg');if(!s){s=document.createElement('p');s.className='nmsg';nb().appendChild(s);}s.textContent=t;s.style.color=bad?'#ff6b6b':'';};
async function showHost(gid){nb().innerHTML='<p>Making your code…</p>';try{const code=await host(gid),link=location.href.split('#')[0]+'#join='+code;
 nb().innerHTML=codeBox('1 · Send this code to your friend (or let them scan the QR code with their phone):',code)+`<label>2 · Paste the answer code they send back:</label><textarea class="nans" rows="3" placeholder="PXA1…"></textarea><div class="nrow"><button type="button" class="ngo">CONNECT</button></div>`;
 drawQR(nb().querySelector('.nqr'),link);wireCopy(code);nb().querySelector('.ngo').onclick=async()=>{try{await accept(nb().querySelector('.nans').value);say('Connecting…');setTimeout(()=>{if(!N.on)say('Still not connected. Are you both on the same network?',1);},8000);}catch(e){say(e.message,1);}};}catch(e){say(e.message,1);}}
async function showJoin(pre){nb().innerHTML=`<label>Paste the host's code:</label><textarea class="noff" rows="3" placeholder="PXA1…">${pre}</textarea><div class="nrow"><button type="button" class="ngo">MAKE ANSWER</button></div>`;
 const go=async()=>{try{const code=await join(nb().querySelector('.noff').value);nb().innerHTML=codeBox('Send this answer code back to the host. The game starts as soon as they paste it:',code);drawQR(nb().querySelector('.nqr'),code);wireCopy(code);say('Waiting for the host…');}catch(e){say(e.message,1);}};
 nb().querySelector('.ngo').onclick=go;if(pre)go();}
ui.go=()=>{if(box)box.hidden=true;const g=A.games.find(x=>x.id===N.game);if(!g)return;A.open(g);E.sel=1;E.start();A.two=false;A.cpu=false;A.toast&&A.toast(N.me?'ONLINE · YOU ARE P2':'ONLINE · YOU ARE P1');};
ui.lost=()=>{if(E.state!=='hub'){A.toast&&A.toast('OPPONENT LEFT');}};
A.netLobby=open;
const fromHash=()=>{const m=location.hash.match(/^#join=(PXA1\.[A-Za-z0-9_-]+)/);if(m){history.replaceState(null,'',location.pathname+location.search);open(m[1]);}};
const boot=()=>{const b=document.getElementById('netBtn');if(b)b.onclick=e=>{e.preventDefault();open('');};fromHash();addEventListener('hashchange',fromHash);};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();
