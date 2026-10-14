// ABYSS DIVER — heads-up display, markers, feed, banners.
import * as THREE from '../vendor/three.module.min.js';
import {$,mmss,cl} from './util.js';
import {ITEMS} from './data.js';
import {toast} from '../js/kit3d/ui.js';

const tp=new THREE.Vector3();
export class HUD{
 constructor(){this.bT=0;this.aT=0;this.feedN=0;this.last={};this.pT=0;}
 set(id,v){if(this.last[id]!==v){this.last[id]=v;$(id).textContent=v;}}
 bar(id,p){const k='b_'+id;const v=Math.round(cl(p,0,1)*1000)/10;if(this.last[k]!==v){this.last[k]=v;$(id).style.width=v+'%';}}
 banner(t,s='',dur=3.2,col){$('bt').textContent=t;$('bs').textContent=s;$('bt').style.color=col||'';$('banner').classList.add('on');this.bT=dur;}
 alert(t,s,dur=3){$('alt').textContent=t;$('als').textContent=s||'';$('alert').classList.add('on');this.aT=dur;}
 feed(txt,col='#56e8ff',tag=''){toast($('feed'),(tag?`<b style="color:${col}">${tag}</b>`:'')+txt,4200,6,false).style.borderLeftColor=col;}
 prompt(s){if(this.last.prompt===s)return;this.last.prompt=s;const p=$('prompt');if(s){p.innerHTML=s;p.classList.add('on');}else p.classList.remove('on');}
 marker(cam,pos,label,col,sub,op=1){tp.copy(pos).project(cam);if(tp.z>1)return '';const x=cl(tp.x,-.9,.9),y=cl(tp.y,-.55,.72);const edge=x!==tp.x||y!==tp.y;
  return `<div class="mk" style="left:${(x*.5+.5)*100}%;top:${(-y*.5+.5)*100}%;color:${col};opacity:${edge?op*.6:op}">${label}<em>${sub}</em><i></i></div>`;}
 update(G,P,S,dt){
  if(this.bT>0){this.bT-=dt;if(this.bT<=0)$('banner').classList.remove('on');}
  if(this.aT>0){this.aT-=dt;if(this.aT<=0)$('alert').classList.remove('on');}
  this.set('clock',mmss(P.diveT));const low=P.diveT<60;if(this.last.low!==low){this.last.low=low;$('clock').classList.toggle('low',low);}
  this.set('loc',G.loc);
  const o2p=P.o2/P.o2max;$('o2ring').style.strokeDashoffset=(263.9*(1-cl(o2p,0,1))).toFixed(1);this.set('o2t',Math.ceil(P.o2));const ol=o2p<.25&&P.under&&!P.inSub;if(this.last.ol!==ol){this.last.ol=ol;document.querySelector('.o2').classList.toggle('low',ol);}
  this.bar('hpb',P.hp/100);this.set('hpt',Math.ceil(P.hp));this.bar('fdb',P.food/100);this.set('fdt',Math.ceil(P.food));this.bar('wtb',P.water/100);this.set('wtt',Math.ceil(P.water));
  const crit=(id,v)=>{const k='c_'+id;const c=v<.2;if(this.last[k]!==c){this.last[k]=c;$(id).parentElement.parentElement.classList.toggle('crit',c);}};crit('hpb',P.hp/100);crit('fdb',P.food/100);crit('wtb',P.water/100);
  const jr=!!P.tools.jet;if(this.last.jr!==jr){this.last.jr=jr;$('batrow').style.display=jr?'':'none';}if(jr){this.bar('btb',P.bat/100);this.set('btt',Math.ceil(P.bat));}
  const d=Math.max(0,Math.round(P.depth));this.set('dm',d);const rate=P.inSub?500:P.rating;this.bar('dmr',d/rate);
  const cr=d>rate?'bad':d>rate*.88?'warn':'';const ct=d>rate?'CRUSH DEPTH · ASCEND':(P.inSub?'HULL':'SUIT')+' RATED '+rate+' M';this.set('crush',ct);if(this.last.cr!==cr){this.last.cr=cr;$('crush').className=cr;}
  // quick items
  const inv=(k)=>(P.inv[k]||0);const food=inv('cookedfish')+inv('rawfish'),wat=inv('flask')+inv('bulb');
  const q=`<div class="${food?'':'off'}"><kbd>1</kbd> FOOD<b>${food}</b></div><div class="${wat?'':'off'}"><kbd>2</kbd> WATER<b>${wat}</b></div><div class="${inv('medkit')?'':'off'}"><kbd>3</kbd> MEDKIT<b>${inv('medkit')}</b></div><div class="${inv('flare')?'':'off'}"><kbd>F</kbd> FLARE<b>${inv('flare')}</b></div>`;
  if(this.last.q!==q){this.last.q=q;$('quick').innerHTML=q;}
  // sub
  if(this.last.sub!==P.inSub){this.last.sub=P.inSub;$('subhud').hidden=!P.inSub;}
  if(P.inSub){this.bar('hullb',S.hull/100);this.set('hullt',Math.ceil(S.hull));this.bar('pwb',S.power/100);this.set('pwt',Math.ceil(S.power));}
  // compass
  const deg=((-P.yaw*180/Math.PI)%360+360)%360;let s='';for(let a=-180;a<=540;a+=15){const lab=a%90===0?['N','E','S','W'][((a%360)+360)%360/90]:a%45===0?'·':'';if(!lab)continue;const x=(a-deg)*2+180;if(x<-20||x>380)continue;s+=`<span style="left:${x}px;${a%90?'opacity:.5':''}">${lab}</span>`;}
  for(const m of G.compassMarks){let b=((Math.atan2(m.x-P.pos.x,-(m.z-P.pos.z))*180/Math.PI)%360+360)%360-deg;while(b>180)b-=360;while(b<-180)b+=360;if(Math.abs(b)>88)continue;s+=`<span style="left:${b*2+180}px;color:${m.c}">${m.l}</span>`;}
  $('compin').innerHTML=s;
  // objective
  const o=G.obj;if(o&&this.last.objk!==o.key){this.last.objk=o.key;this.set('objn',o.n);$('objt').textContent=o.title;$('objl').innerHTML=o.chips.map(c=>`<span class="${c.ok?'ok':''}">${c.t}</span>`).join('');}
  if(o)this.set('objs',G.tip||'');
  // scan
  const sc=G.scanP;$('scanring').style.strokeDashoffset=(163.4*(1-sc)).toFixed(1);$('cross').classList.toggle('scan',G.scanning);this.set('scanlab',G.scanLab||'');
  // overlays
  $('hurtov').style.opacity=Math.min(1,G.hurtT*1.4).toFixed(2);$('lowov').style.opacity=(P.hp<30?(.55-P.hp/60)*(.75+.25*Math.sin(G.time*5)):0).toFixed(2);}
}
export function invHTML(inv,filter){const rows=Object.entries(inv).filter(([k,v])=>v>0&&(!filter||filter(k)));if(!rows.length)return '<div class="it" style="opacity:.5">EMPTY</div>';return rows.map(([k,v])=>`<div class="it"><span style="color:${ITEMS[k].c}">${ITEMS[k].ic} ${ITEMS[k].n}</span><b>${v}</b></div>`).join('');}
