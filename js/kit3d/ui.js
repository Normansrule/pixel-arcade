// Shared menu / results / HUD helpers for the full-3D worlds. Each world keeps its own HTML, CSS and screens;
// this module holds the small pieces of wiring they all repeated.
//
//  $(id)                         document.getElementById
//  stored(key, opt)              load saved options from localStorage[key] into opt (defaults stay for missing fields);
//                                returns save(), which writes opt back. Storage errors are ignored (private mode).
//  pickers(opt, save)            returns seg(id, key, num=true, cb): a segmented picker (menu option, difficulty...) built from the
//                                <button data-v> children of #id. The button matching opt[key] gets class "on"; a click sets
//                                opt[key] (a number unless num is false), then calls save() and cb(v). seg.sync() re-marks every
//                                picker from opt (after something else changed it).
//  postButton(el, id, info)      wire a POST SCORE button: info() returns [points, issue text] for the last round; the
//                                "Posted from Pixel Arcade as @user" footer is added and the issue opened through score.js.
//  toast(host, html, ms, max=0, top=true)  transient line for a kill feed, toast or note stack: a <div> with html, prepended
//                                (top) or appended, removed after ms; at most max kept (0 = no cap; the oldest go first).
//                                Returns the element so callers can add a class or style.
// The results screen itself (stats table, tokens line, best score) stays in each world: their layouts differ.
import {postScore,userName} from './score.js';

export const $=id=>document.getElementById(id);
export function stored(key,opt){try{Object.assign(opt,JSON.parse(localStorage.getItem(key))||{});}catch(e){}return()=>{try{localStorage.setItem(key,JSON.stringify(opt));}catch(e){}};}
export function pickers(opt,save){const all=[];
 const seg=(id,key,num=true,cb)=>{const el=$(id),bs=()=>el.querySelectorAll('button'),val=b=>num?+b.dataset.v:b.dataset.v;const mark=v=>bs().forEach(b=>b.classList.toggle('on',String(val(b))===String(v)));all.push(()=>mark(opt[key]));
  const set=(v,init)=>{opt[key]=v;mark(v);if(!init){if(save)save();if(cb)cb(v);}};set(opt[key],true);bs().forEach(b=>b.onclick=()=>set(val(b)));};
 seg.sync=()=>all.forEach(f=>f());return seg;}
export function postButton(el,id,info){el.onclick=()=>{const[pts,text]=info(),u=userName();postScore(id,pts,text+`\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`);};}
export function toast(host,html,ms,max=0,top=true){const d=document.createElement('div');d.innerHTML=html;if(top)host.prepend(d);else host.appendChild(d);setTimeout(()=>d.remove(),ms);
 while(max&&host.children.length>max)(top?host.lastChild:host.firstChild).remove();return d;}
