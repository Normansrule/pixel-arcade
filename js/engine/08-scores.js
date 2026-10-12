/* PIXEL ARCADE engine · Profile and scores: localStorage profile, tokens, high scores, GitHub-issue leaderboard. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;
E.getHS=getHS;E.setHS=setHS;
/* ---------- profile (GitHub username, local), tokens, leaderboard via GitHub issues ---------- */
const REPO='Normansrule/pixel-arcade';
A.profile=(()=>{try{return JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};}catch(e){return{user:'',tokens:0,played:0,wins:0};}})();
A.saveProfile=()=>{try{localStorage.setItem('pxd_profile',JSON.stringify(A.profile));}catch(e){}A.renderProfile&&A.renderProfile();};
A.setUser=u=>{A.profile.user=(u||'').trim().replace(/^@/,'').slice(0,39);A.saveProfile();};
const hsKey=()=>'pxd_hs_'+(A.profile.user?A.profile.user.toLowerCase()+'_':'')+E.cur.id;
A.award=g=>{const p=A.profile;p.played++;let t=5;const win=/WIN|CLEAR|COMPLETE|VICTORY|1ST|SOLVED|PERFECT|CHECKOUT|ACE|DEFENDED|ALIGNED|GALLERY|FLOODED|SUMMIT|FLOW|HOME|CHAMP|ROYAL/.test(g.over)||(/PLAYER 1 WINS/.test(g.over)&&A.cpu);if(win){p.wins++;t+=A.cpu?[10,20,35][A.lvl]:15;}if(!E.cur.vs&&g.score>0)t+=Math.min(20,Math.floor(Math.log2(g.score+1)));p.tokens+=t;g.tok=t;A.saveProfile();};
A.level=()=>Math.floor(Math.sqrt(A.profile.tokens/40))+1;
A.submitScore=(g)=>{const u=A.profile.user;const title=`[score] ${E.cur.id} ${g.score}`;const body=`Game: ${E.cur.name}\nScore: ${g.score}\nMode: ${E.cur.vs?(A.cpu?'vs CPU '+['easy','normal','hard'][A.lvl]:'2 players'):'solo'}\nResult: ${g.over}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;window.open('https://github.com/'+REPO+'/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body),'_blank');};
A.leaderboard=async id=>{const r=await fetch('https://api.github.com/search/issues?q='+encodeURIComponent('repo:'+REPO+' in:title "[score] '+id+' "')+'&per_page=50');if(!r.ok)throw new Error('GitHub API '+r.status);const j=await r.json();const rows=[];for(const it of j.items||[]){const m=/^\[score\]\s+(\S+)\s+(-?\d+)/.exec(it.title);if(!m||m[1]!==id)continue;rows.push({user:it.user.login,avatar:it.user.avatar_url,score:+m[2],url:it.html_url,date:it.created_at.slice(0,10)});}const low=!!E.cur&&E.cur.low;rows.sort((a,b)=>low?a.score-b.score:b.score-a.score);const seen=new Set();return rows.filter(r=>!seen.has(r.user)&&seen.add(r.user)).slice(0,10);};
function getHS(){try{const v=localStorage.getItem(hsKey());return v===null?null:+v;}catch(e){return null;}}
function setHS(v){try{localStorage.setItem(hsKey(),v);}catch(e){}}
})();
