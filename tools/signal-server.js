#!/usr/bin/env node
/* PIXEL ARCADE · Tiny self-hosted signaling server (PeerJS wire protocol), no dependencies.
   The arcade uses the free public PeerJS server by default (js/online/config.js). Run this instead if that server is
   down, or to test online play on a local network:
       node tools/signal-server.js 9000
   then set signal to {host:'<this machine>',port:9000,path:'/',key:'peerjs',secure:false} in js/online/config.js
   (browsers only allow secure:false on http pages, such as a local test server).
   It only relays connection offers between two browsers; it never sees game data. Limits: 24 KB per message,
   20 messages per second per client, 2000 clients, peer ids must match [a-z0-9-]{8,48}. */
'use strict';
const http=require('http'),crypto=require('crypto');
const PORT=+process.argv[2]||9000,MAX=24000,ID=/^[a-z0-9-]{8,48}$/,TYPES=new Set(['OFFER','ANSWER','CANDIDATE','LEAVE']);
const peers=new Map();
function frame(str){const p=Buffer.from(str);const n=p.length;const h=n<126?Buffer.from([0x81,n]):n<65536?Buffer.from([0x81,126,n>>8,n&255]):null;if(!h)return null;return Buffer.concat([h,p]);}
function sendTo(sock,obj){if(!sock.destroyed){const f=frame(JSON.stringify(obj));if(f)sock.write(f);}}
const srv=http.createServer((q,r)=>{r.writeHead(404);r.end();});
srv.on('upgrade',(req,sock)=>{let u;try{u=new URL(req.url,'http://x');}catch(_){sock.destroy();return;}
 const id=u.searchParams.get('id')||'',key=req.headers['sec-websocket-key'];
 if(!/\/peerjs$/.test(u.pathname)||!key||!ID.test(id)||peers.size>=2000){sock.destroy();return;}
 const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
 if(peers.has(id)){sendTo(sock,{type:'ID-TAKEN',payload:{msg:'ID is taken'}});sock.end();return;}
 peers.set(id,sock);sendTo(sock,{type:'OPEN'});
 let buf=Buffer.alloc(0),tokens=40,last=Date.now();
 sock.on('data',d=>{buf=Buffer.concat([buf,d]);if(buf.length>MAX*2){sock.destroy();return;}
  for(;;){if(buf.length<2)return;const op=buf[0]&15,masked=buf[1]&128;let len=buf[1]&127,o=2;
   if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);o=4;}else if(len===127){sock.destroy();return;}
   if(!masked||len>MAX){sock.destroy();return;}if(buf.length<o+4+len)return;const mask=buf.slice(o,o+4),p=Buffer.from(buf.slice(o+4,o+4+len));buf=buf.slice(o+4+len);
   for(let i=0;i<p.length;i++)p[i]^=mask[i&3];
   if(op===8){sock.end();return;}if(op===9){sock.write(Buffer.from([0x8a,0]));continue;}if(op!==1)continue;
   const t=Date.now();tokens=Math.min(40,tokens+(t-last)/50);last=t;if(tokens<1)continue;tokens--;
   let m;try{m=JSON.parse(p.toString('utf8'));}catch(_){continue;}
   if(!m||typeof m!=='object'||!TYPES.has(m.type)||typeof m.dst!=='string'||!ID.test(m.dst))continue;
   const to=peers.get(m.dst);if(to)sendTo(to,{type:m.type,src:id,payload:m.payload});
   else if(m.type!=='LEAVE')setTimeout(()=>sendTo(sock,{type:'EXPIRE',src:m.dst,payload:{msg:'Could not send message to '+m.dst}}),500);}});
 const bye=()=>{if(peers.get(id)===sock)peers.delete(id);};sock.on('close',bye);sock.on('error',bye);sock.setTimeout(70000,()=>sock.destroy());});
srv.listen(PORT,()=>console.log('Pixel Arcade signaling server on port',PORT));
