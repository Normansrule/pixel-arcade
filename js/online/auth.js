/* PIXEL ARCADE · Optional sign-in (Supabase Auth over plain fetch, no library). Online play never needs it.
   Switched off until js/online/config.js has accounts.url and accounts.anonKey (see docs/ONLINE.md). When on:
   - sign in with a 6-digit code sent by email (web page and desktop app), or with GitHub (web page only: the
     desktop app has no web address for GitHub to send the player back to);
   - the player's name, tokens and wins are saved to their own row in the `profiles` table, which row level security
     lets only them read or change; the database also checks every value (docs/supabase.sql).
   Tokens stay in this browser's localStorage and are never sent to the other player. All requests go through
   PostgREST with JSON bodies and fixed, validated URL parts, so there is no query string built from user text. */
(function(){
'use strict';
const A=window.A,S=window.PXSafe,C=window.PX_ONLINE&&window.PX_ONLINE.accounts;if(!A||!S)return;
const URL_OK=C&&/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(C.url||'')&&/^[A-Za-z0-9._-]{20,400}$/.test(C.anonKey||'');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,EMAIL=/^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/;
const KEY='pxd_auth',VKEY='pxd_auth_pkce';
const au=A.auth={enabled:!!URL_OK,user:null,name:'',ready:Promise.resolve(),app:location.protocol==='arcade:'};
const load=()=>{try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s.access_token==='string'&&typeof s.refresh_token==='string'&&s.user&&UUID.test(s.user.id))return s;}catch(_){}return null;};
const save=s=>{try{s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY);}catch(_){}};
let sess=null;const bucket=new S.Bucket(.5,6);// at most a few account calls in a burst, then one every 2 s
async function call(path,opt){if(!au.enabled)throw new Error('Accounts are not switched on for this arcade.');if(!bucket.take(performance.now()))throw new Error('Too many tries. Wait a moment.');
 const o=opt||{},h={apikey:C.anonKey,'Content-Type':'application/json'};if(o.auth&&sess)h.Authorization='Bearer '+sess.access_token;Object.assign(h,o.headers||{});
 const r=await fetch(C.url+path,{method:o.method||'GET',headers:h,body:o.body?JSON.stringify(o.body):undefined,credentials:'omit',cache:'no-store',redirect:'error'});
 const t=await r.text();if(t.length>20000)throw new Error('Unexpected reply from the account server.');let j=null;try{j=t?JSON.parse(t):null;}catch(_){}
 if(!r.ok){const m=j&&(j.msg||j.error_description||j.message);throw new Error(m?S.cleanText(m,120):'Account server error '+r.status);}return j;}
function adopt(j){if(!j||typeof j.access_token!=='string'||typeof j.refresh_token!=='string'||!j.user||!UUID.test(j.user.id))throw new Error('Unexpected reply from the account server.');
 const meta=j.user.user_metadata||{};sess={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+Math.min(86400,Math.max(60,+j.expires_in||3600))*1000,user:{id:j.user.id,hint:S.cleanName(meta.user_name||meta.preferred_username||meta.name||String(j.user.email||'').split('@')[0],'')}};save(sess);return sess;}
async function fresh(){if(!sess)return null;if(Date.now()<sess.expires_at-60000)return sess;try{return adopt(await call('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:sess.refresh_token}}));}catch(e){sess=null;save(null);set(null);return null;}}
function set(s){au.user=s?s.user:null;if(!s)au.name='';if(A.renderProfile)A.renderProfile();if(au.onchange)au.onchange();}
/* ---------- profile row ---------- */
async function pull(){const s=await fresh();if(!s)return;const rows=await call('/rest/v1/profiles?select=name,tokens,wins,played&id=eq.'+s.user.id,{auth:1});
 const row=Array.isArray(rows)&&rows[0];if(row){au.name=S.cleanName(row.name,'');const n=v=>Number.isInteger(v)&&v>=0?v:0;const p=A.profile;p.tokens=Math.max(p.tokens,n(row.tokens));p.wins=Math.max(p.wins,n(row.wins));p.played=Math.max(p.played,n(row.played));A.saveProfile&&A.saveProfile();}
 else{au.name=s.user.hint||'';await push();}set(s);}
let pushT=null;async function push(){const s=await fresh();if(!s)return;const p=A.profile,name=S.cleanName(au.name||s.user.hint,'')||'Player';
 await call('/rest/v1/profiles?on_conflict=id',{method:'POST',auth:1,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{id:s.user.id,name,tokens:p.tokens|0,wins:p.wins|0,played:p.played|0}});}
au.save=()=>{if(!au.user)return;clearTimeout(pushT);pushT=setTimeout(()=>push().catch(()=>{}),4000);};
au.rename=async v=>{const n=S.cleanName(v,'');if(!n)throw new Error('Names use letters, numbers, spaces, dots and dashes.');au.name=n;await push();set(sess);return n;};
/* ---------- sign in ---------- */
au.emailCode=async email=>{email=String(email||'').trim().toLowerCase();if(!EMAIL.test(email)||email.length>254)throw new Error('That does not look like an email address.');
 await call('/auth/v1/otp',{method:'POST',body:{email,create_user:true}});return email;};
au.verify=async(email,code)=>{code=String(code||'').replace(/\s/g,'');if(!/^\d{6,10}$/.test(code))throw new Error('The code is the 6 digits from the email.');
 adopt(await call('/auth/v1/verify',{method:'POST',body:{type:'email',email:String(email).trim().toLowerCase(),token:code}}));await pull();};
const b64u=u=>btoa(String.fromCharCode(...u)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
au.github=async()=>{if(!au.enabled||au.app)throw new Error('GitHub sign-in works on the web page; in the app, use an email code.');
 const v=b64u(crypto.getRandomValues(new Uint8Array(48))),ch=b64u(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))));
 try{sessionStorage.setItem(VKEY,v);}catch(_){}const back=location.origin+location.pathname;
 location.assign(C.url+'/auth/v1/authorize?provider=github&code_challenge='+ch+'&code_challenge_method=s256&redirect_to='+encodeURIComponent(back));};
au.signOut=async()=>{const s=sess;sess=null;save(null);set(null);if(s)try{await fetch(C.url+'/auth/v1/logout',{method:'POST',headers:{apikey:C.anonKey,Authorization:'Bearer '+s.access_token},credentials:'omit'});}catch(_){}};
/* ---------- start-up: restore the session, or finish a GitHub sign-in (?code=…) ---------- */
if(au.enabled){au.ready=(async()=>{const q=new URLSearchParams(location.search),code=q.get('code');let v=null;try{v=sessionStorage.getItem(VKEY);sessionStorage.removeItem(VKEY);}catch(_){}
 if(code&&v){try{history.replaceState(null,'',location.pathname+location.hash);}catch(_){}if(/^[A-Za-z0-9-]{8,128}$/.test(code)){try{adopt(await call('/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code:code,code_verifier:v}}));}catch(e){au.error=e.message;}}}
 if(!sess)sess=load();if(sess){try{await pull();}catch(_){set(sess);}}})();}
A.authSave=au.save;
})();
