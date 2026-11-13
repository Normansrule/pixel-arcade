/* PIXEL ARCADE · Online safety: sanitisers, strict message schemas and rate limits for everything that arrives
   from another player or from the signaling server. Every network message goes through PXSafe.parse() before
   any code reads it; text from other people is only ever shown with textContent or canvas fillText, never as HTML.
   Pure functions with no DOM access, so tests/safe.test.js runs them in Node. */
(function(root){
'use strict';
const MAX_MSG=2048;                 // bytes (UTF-16 code units) per data-channel message
const MAX_SIGNAL=24000;             // per signaling-server message (session descriptions are large)
const NAME_MAX=16,CHAT_MAX=120;
const ROOM_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';// no 0/O, 1/I: easy to read aloud
const ROOM_LEN=6;
/* control characters, bidirectional overrides, zero-width and filler characters that can hide or reorder text */
const INVISIBLE=/[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180f\u200b-\u200f\u2028-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\uffff]/g;
const MARKS=/(\p{M}{2})\p{M}+/gu;   // stacked combining marks ("zalgo" text): keep at most two per letter
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const str=v=>typeof v==='string'?v:(v===null||v===undefined?'':String(v));

/* ---------- text ---------- */
function cleanText(v,max){let s=str(v);if(s.length>max*8)s=s.slice(0,max*8);try{s=s.normalize('NFKC');}catch(_){}
 s=s.replace(INVISIBLE,'').replace(MARKS,'$1').replace(/\s+/g,' ').trim();const cps=Array.from(s);return cps.length>max?cps.slice(0,max).join('').trim():s;}
/* display names: letters (any script), digits, space, dot, dash, underscore; 1-16 characters */
function cleanName(v,fallback){const s=cleanText(v,NAME_MAX*2).replace(/[^\p{L}\p{N} ._-]/gu,'').replace(/\s+/g,' ').trim();const out=Array.from(s).slice(0,NAME_MAX).join('').trim();return out||(fallback===undefined?'Guest':fallback);}
function cleanChat(v){return cleanText(v,CHAT_MAX);}
/* room codes: 6 characters from ROOM_ABC; spaces and dashes are ignored, lower case is accepted */
function cleanRoom(v){const s=str(v).toUpperCase().replace(/[\s-]/g,'');if(s.length!==ROOM_LEN)return null;for(const ch of s)if(ROOM_ABC.indexOf(ch)<0)return null;return s;}
function newRoom(rand){const out=[];const r=rand||cryptoBytes;const b=r(ROOM_LEN);for(let i=0;i<ROOM_LEN;i++)out.push(ROOM_ABC[b[i]&31]);return out.join('');}
function cryptoBytes(n){const u=new Uint8Array(n);const c=root.crypto||(typeof require==='function'?require('crypto').webcrypto:null);c.getRandomValues(u);return u;}
function randomId(n){const abc='abcdefghijklmnopqrstuvwxyz0123456789',b=cryptoBytes(n);let s='';for(let i=0;i<n;i++)s+=abc[b[i]%36];return s;}
function randomSeed(){const b=cryptoBytes(4);return((b[0]<<24|b[1]<<16|b[2]<<8|b[3])>>>0)&0x7fffffff;}
const GAME_ID=/^[a-z0-9_]{1,24}$/;
function cleanGameId(v){return typeof v==='string'&&GAME_ID.test(v)?v:null;}
/* scores: finite, whole, and inside a sane range; anything else is rejected rather than coerced */
function cleanScore(v){return typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e9?Math.round(v):null;}
/* links stored in localStorage (the "My games" shelf) may only point inside the arcade's own builder */
function safeLocalUrl(v,prefix){const s=str(v);if(s.length>60000)return null;if(!s.startsWith(prefix))return null;if(/[\u0000-\u001f\s\\]/.test(s.slice(0,prefix.length+8)))return null;return s;}
function safeImage(v){const s=str(v);return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)&&s.length<400000?s:'';}

/* ---------- schemas ----------
   A schema is {field: rule}. Rules: {t:'str',max,re?}, {t:'int',min,max}, {t:'num',min,max}, {t:'bool'},
   {t:'enum',of:[...]}, {t:'arr',max,of:rule}, {t:'obj',schema}; add opt:1 for optional fields.
   validate() rejects unknown fields, wrong types, out-of-range numbers and objects that are not plain JSON. */
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
function check(v,r,d){if(d>4)return false;switch(r.t){
 case'str':return typeof v==='string'&&v.length<=r.max&&(!r.min||v.length>=r.min)&&(!r.re||r.re.test(v));
 case'int':return Number.isInteger(v)&&v>=r.min&&v<=r.max;
 case'num':return typeof v==='number'&&Number.isFinite(v)&&v>=r.min&&v<=r.max;
 case'bool':return typeof v==='boolean';
 case'enum':return r.of.indexOf(v)>=0;
 case'arr':return Array.isArray(v)&&v.length<=r.max&&(!r.min||v.length>=r.min)&&v.every(x=>check(x,r.of,d+1));
 case'obj':return validate(v,r.schema,d+1)!==null;
 default:return false;}}
function validate(o,schema,d){if(!plain(o))return null;const out={};
 for(const k of Object.keys(o)){if(!hasOwn(schema,k))return null;}
 for(const k of Object.keys(schema)){const r=schema[k];if(!hasOwn(o,k)||o[k]===undefined){if(r.opt)continue;return null;}if(!check(o[k],r,d||0))return null;out[k]=o[k];}
 return out;}
const U32={t:'int',min:0,max:4294967295},FRAME={t:'int',min:0,max:1e8};
/* messages between the two players' browsers (over the WebRTC data channel) */
const MSG={
 hi:{t:{t:'str',max:4},v:{t:'int',min:1,max:99},name:{t:'str',max:64},app:{t:'str',max:16,re:/^[0-9a-z.-]*$/}},
 chat:{t:{t:'str',max:4},text:{t:'str',max:CHAT_MAX*4}},
 emo:{t:{t:'str',max:4},e:{t:'int',min:0,max:7}},
 pick:{t:{t:'str',max:4},game:{t:'str',max:24,re:GAME_ID}},
 go:{t:{t:'str',max:4},game:{t:'str',max:24,re:GAME_ID},seed:{t:'int',min:0,max:2147483647},mode:{t:'enum',of:['lock','duel']},delay:{t:'int',min:2,max:12},n:{t:'int',min:0,max:1e6}},
 in:{t:{t:'str',max:4},f:FRAME,k:{t:'arr',min:1,max:16,of:{t:'int',min:0,max:63}},m:{t:'arr',min:6,max:6,of:{t:'int',min:-512,max:600},opt:1}},
 h:{t:{t:'str',max:4},f:FRAME,h:U32},
 sc:{t:{t:'str',max:4},n:{t:'int',min:0,max:1e6},s:{t:'num',min:-1e9,max:1e9},done:{t:'bool',opt:1},over:{t:'str',max:40,opt:1}},
 again:{t:{t:'str',max:4},n:{t:'int',min:0,max:1e6}},
 ping:{t:{t:'str',max:4},p:U32},
 pong:{t:{t:'str',max:4},p:U32},
 quit:{t:{t:'str',max:4},n:{t:'int',min:0,max:1e6}},
 bye:{t:{t:'str',max:4}},
 wh:{t:{t:'str',max:4},world:{t:'str',max:16,re:/^[a-z0-9]{2,16}$/}},
 w3d:{t:{t:'str',max:4},game:{t:'str',max:24,re:GAME_ID},room:{t:'str',max:6,re:/^[A-HJ-NP-Z2-9]{6}$/}}
};
function parse(raw){if(typeof raw!=='string'||raw.length>MAX_MSG)return null;let o;try{o=JSON.parse(raw);}catch(_){return null;}
 if(!plain(o)||typeof o.t!=='string'||!hasOwn(MSG,o.t))return null;const m=validate(o,MSG[o.t]);if(!m)return null;
 if(m.t==='hi')m.name=cleanName(m.name);
 if(m.t==='chat'){m.text=cleanChat(m.text);if(!m.text)return null;}
 if(m.t==='sc'){if(m.over!==undefined)m.over=cleanText(m.over,40).toUpperCase();}
 return m;}
function encode(m){if(!plain(m)||typeof m.t!=='string'||!hasOwn(MSG,m.t))throw new Error('unknown message');if(!validate(m,MSG[m.t]))throw new Error('bad '+m.t+' message');const s=JSON.stringify(m);if(s.length>MAX_MSG)throw new Error('message too big');return s;}
/* messages from the signaling server (PeerJS protocol). Payloads are written by the other player's browser. */
const PEER_ID=/^[a-z0-9-]{8,48}$/;
const SIG_TYPES=['OPEN','ID-TAKEN','INVALID-KEY','ERROR','OFFER','ANSWER','CANDIDATE','LEAVE','EXPIRE','HEARTBEAT'];
const SDP={k:{t:'enum',of:['o','a']},sdp:{t:'str',min:8,max:20000,re:/^v=0\r?\n/},name:{t:'str',max:64,opt:1}};
const CAND={c:{t:'str',max:1024,re:/^(candidate:[^\n\r]*)?$/},m:{t:'str',max:64,opt:1},i:{t:'int',min:0,max:64,opt:1}};
function parseSignal(raw){if(typeof raw!=='string'||raw.length>MAX_SIGNAL)return null;let o;try{o=JSON.parse(raw);}catch(_){return null;}
 if(!plain(o)||SIG_TYPES.indexOf(o.type)<0)return null;const out={type:o.type};
 if(o.src!==undefined){if(typeof o.src!=='string'||!PEER_ID.test(o.src))return null;out.src=o.src;}
 if(o.type==='OFFER'||o.type==='ANSWER'){const p=validate(o.payload,SDP);if(!p||(o.type==='OFFER')!==(p.k==='o'))return null;if(p.name!==undefined)p.name=cleanName(p.name);out.payload=p;}
 else if(o.type==='CANDIDATE'){const p=validate(o.payload,CAND);if(!p)return null;out.payload=p;}
 else if(o.type==='ERROR'){const msg=o.payload&&typeof o.payload.msg==='string'?cleanText(o.payload.msg,120):'';out.payload={msg};}
 return out;}
/* copy-paste codes (no-server mode): decoded JSON must look exactly like this */
const CODE={g:{t:'str',max:24,re:GAME_ID,opt:1},t:{t:'enum',of:['o','a']},s:{t:'str',min:8,max:20000,re:/^v=0\r?\n/},name:{t:'str',max:64,opt:1}};
function parseCode(o){const m=validate(o,CODE);if(m&&m.name!==undefined)m.name=cleanName(m.name);return m;}

/* ---------- rate limiting: token bucket ---------- */
function Bucket(perSec,burst){this.rate=perSec;this.cap=burst;this.tokens=burst;this.last=0;}
Bucket.prototype.take=function(now,n){n=n||1;if(this.last===0)this.last=now;this.tokens=Math.min(this.cap,this.tokens+(now-this.last)/1000*this.rate);this.last=now;if(this.tokens>=n){this.tokens-=n;return true;}return false;};

/* ---------- seeded random (lockstep simulation) and state hash (desync check) ---------- */
function mulberry(seed){let s=seed|0;return function(){s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function stateHash(o){let h=2166136261,n=0;const seen=new Set();const mix=v=>{h=Math.imul(h^v,16777619);};
 const walk=(v,d)=>{if(n++>20000)return;const ty=typeof v;if(ty==='number'){mix(Number.isFinite(v)?Math.round(v*1000)|0:7);return;}if(ty==='boolean'){mix(v?1:2);return;}
  if(!v||ty!=='object'||d>5||seen.has(v)||v.getContext||v.nodeType)return;seen.add(v);
  if(Array.isArray(v)||ArrayBuffer.isView(v)){mix(v.length);for(let i=0;i<v.length;i++)walk(v[i],d+1);return;}
  for(const k of Object.keys(v)){const x=v[k];if(typeof x!=='function'&&typeof x!=='string')walk(x,d+1);}};
 walk(o,0);return h>>>0;}

const api={MAX_MSG,MAX_SIGNAL,NAME_MAX,CHAT_MAX,ROOM_ABC,ROOM_LEN,MSG,cleanText,cleanName,cleanChat,cleanRoom,newRoom,randomId,randomSeed,cleanGameId,cleanScore,
 safeLocalUrl,safeImage,validate,parse,encode,parseSignal,parseCode,PEER_ID,Bucket,mulberry,stateHash};
root.PXSafe=Object.freeze(api);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
