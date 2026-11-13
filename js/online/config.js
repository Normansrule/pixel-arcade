/* PIXEL ARCADE · Online settings. Everything here is public on purpose: no secrets belong in this file or anywhere
   in the repository (the site is static and anyone can read it).
   - signal: the free public PeerJS signaling server. It only passes the two browsers' connection offers to each
     other (a few kilobytes, once per match); game data then flows directly between the players' browsers.
   - ice: public STUN servers. They tell each browser its public address so players on different networks can
     connect. They see that address, nothing else.
   There are no accounts: players pick a nickname, stored only on their own device (owner decision, 12 Nov 2026). */
(function(root){
'use strict';
const cfg={
 app:'32',
 signal:{host:'0.peerjs.com',port:443,path:'/',key:'peerjs',secure:true},
 ice:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}],
 prefix:'pxarc32-'
};
const deep=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')deep(v);});return Object.freeze(o);};
root.PX_ONLINE=deep(cfg);
if(typeof module!=='undefined'&&module.exports)module.exports=root.PX_ONLINE;
})(typeof window!=='undefined'?window:globalThis);
