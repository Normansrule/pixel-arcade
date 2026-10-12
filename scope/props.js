// LONG SHOT — reusable set-dressing + structures for mission builders (all batched into the World).
import * as THREE from '../vendor/three.module.min.js';
import {rng} from './world.js';
const V=THREE.Vector3;
const M=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
export {M};
// straight railing / low wall between two points
export function rail(W,x0,z0,x1,z1,y,h=1,mat='white',o={}){const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz);W.box((x0+x1)/2,y,(z0+z1)/2,L,h,o.t||.18,mat,{ry:Math.atan2(-dz,dx),walk:false,matK:o.matK||'stone'});
 if(o.posts){const n=Math.max(1,Math.round(L/o.posts));for(let i=0;i<=n;i++){const t=i/n;W.box(x0+dx*t,y,z0+dz*t,.14,h+.06,.14,mat,{collide:false});}}}
// visual stair steps along x or z plus the walkable ramp
export function stairs(W,a0,a1,b0,b1,y0,y1,axis='x',mat='paving',n=0){n=n||Math.max(3,Math.round(Math.abs(y1-y0)/.18));const lo=Math.min(y0,y1)-.3;
 for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,a=a0+(a1-a0)*(t0+t1)/2,top=y0+(y1-y0)*(i+.5)/n;const len=Math.abs(a1-a0)/n+.02,wid=Math.abs(b1-b0);
  if(axis==='x')W.box(a,lo,(b0+b1)/2,len,top-lo,wid,mat,{walk:false});else W.box((b0+b1)/2,lo,a,wid,top-lo,len,mat,{walk:false});}
 if(axis==='x')W.ramp(a0,b0,a1,b1,y0,y1,'x');else W.ramp(b0,a0,b1,a1,y0,y1,'z');}
export function parasol(W,x,y,z,col=0xe8e0d0,r=1.6){W.cyl(x,y,z,.04,.05,2.5,'white',{seg:6});const g=new THREE.ConeGeometry(r,.55,10,1,true);W.geo(g,'vcol',M(x,y+2.45,z),{col});
 const g2=new THREE.ConeGeometry(r,.55,10,1,true);g2.scale(1,-1,1);g2.translate(0,-.01,0);W.geo(g2,'vcol',M(x,y+2.45,z),{col:new THREE.Color(col).multiplyScalar(.75).getHex()});W.collider(x,y+2.45,z,r*.7,.25,r*.7,0,false,'fabric');}
export function lounger(W,x,y,z,ry=0,col=0x2a5a8a){const c=Math.cos(ry),s=Math.sin(ry),p=(a,b)=>[x+a*c+b*s,z-a*s+b*c];let[q,w]=p(0,0);W.box(q,y,w,.7,.32,1.9,'white',{ry,col:0xffffff,walk:false});
 W.box(q,y+.32,w,.66,.08,1.86,'vcol',{ry,col,collide:false});[q,w]=p(0,-.75);W.geo(new THREE.BoxGeometry(.66,.08,.7),'vcol',M(q,y+.62,w,-.9,ry,0),{col});}
export function table(W,x,y,z,o={}){W.cyl(x,y,z,.05,.18,.74,o.leg||'darksteel',{seg:8});W.cyl(x,y+.72,z,o.r||.45,o.r||.45,.04,o.top||'white',{seg:16,collide:true,walk:false,matK:'wood'});
 if(o.chairs!==false)for(let i=0;i<(o.n||3);i++){const a=i/(o.n||3)*6.283+(o.a||0),cx=x+Math.cos(a)*.85,cz=z+Math.sin(a)*.85;W.box(cx,y,cz,.42,.45,.42,o.chair||'darksteel',{collide:false});W.geo(new THREE.BoxGeometry(.42,.45,.05),o.chair||'darksteel',M(cx+Math.cos(a)*.2,y+.66,cz+Math.sin(a)*.2,0,-a+Math.PI/2,0));}}
// hip roof (square pyramid stretched to w×d)
export function hipRoof(W,x,y,z,w,d,h,mat='terracotta'){const g=new THREE.ConeGeometry(1,1,4,1);g.rotateY(Math.PI/4);g.translate(0,.5,0);W.geo(g,mat,M(x,y,z,0,0,0,w*.7071*1.04,h,d*.7071*1.04),{us:Math.max(w,d)/3,vs:h/1.5});W.collider(x,y+h*.3,z,w/2,h*.3,d/2,0,false,'stone');}
// gable roof along x
export function gableRoof(W,x,y,z,w,d,h,mat='terracotta',ry=0){const p=new Float32Array([-w/2,0,-d/2, w/2,0,-d/2, w/2,h,0, -w/2,h,0, -w/2,0,d/2, -w/2,h,0, w/2,h,0, w/2,0,d/2, -w/2,0,-d/2, -w/2,h,0, -w/2,0,d/2, w/2,0,-d/2, w/2,0,d/2, w/2,h,0]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const sl=Math.hypot(h,d/2);g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,w/3,0,w/3,sl/3,0,sl/3, 0,0,0,sl/3,w/3,sl/3,w/3,0, 0,0,.5,1,1,0, 0,0,1,0,.5,1]),2));g.setIndex([0,3,2,0,2,1,4,7,6,4,6,5,8,10,9,11,13,12]);g.computeVertexNormals();
 W.geo(g,mat,M(x,y,z,0,ry,0));W.collider(x,y+h*.35,z,w/2,h*.35,d/2*.8,ry,false,'stone');}
// simple building: box with facade sides + flat roof material, optional parapet
export function building(W,x,z,w,d,h,st='concrete',o={}){const y=o.y??W.groundAt(x,z,1e9)-.2;W.box(x,y,z,w,h,d,{side:'facade:'+st,top:o.roof||'concreteD'},{ry:o.ry||0,matK:'stone'});
 if(o.parapet){const t=y+h,p=.25;for(const[a,b,c,e]of[[x-w/2,z-d/2,x+w/2,z-d/2],[x+w/2,z-d/2,x+w/2,z+d/2],[x+w/2,z+d/2,x-w/2,z+d/2],[x-w/2,z+d/2,x-w/2,z-d/2]])rail(W,a,b,c,e,t,o.parapet,o.roof||'concreteD',{t:p});}
 return y+h;}
export function lamp(W,x,y,z,o={}){W.cyl(x,y,z,.07,.1,o.h||5,'darksteel',{seg:6,collide:true,walk:false});W.box(x,y+(o.h||5)-.1,z,.5,.18,.25,'black',{collide:false});const b=new THREE.Mesh(new THREE.BoxGeometry(.4,.06,.2),W.mat('bulb'));b.position.set(x,y+(o.h||5)-.13,z);W.add(b);
 if(o.light)W.pointLight(x,y+(o.h||5)-.6,z,o.col||0xffd6a0,o.int||60,o.dist||22);}
export function crate(W,x,y,z,s=1.2,mat='wood',ry=0){W.box(x,y,z,s,s,s,mat,{ry,matK:'wood'});}
// perch structures ---------------------------------------------------------------------
// returns the eye position for a perch built on top of the structure
export function lighthouse(W,x,z,h=13){const y=W.groundAt(x,z)-.5;for(let i=0;i<4;i++)W.cyl(x,y+i*h/4,z,2.6-(i+1)*.18,2.6-i*.18,h/4,i%2?'red':'white',{seg:20,collide:i===0});W.collider(x,y+h/2,z,2.2,h/2,2.2,0,false,'stone');
 W.cyl(x,y+h,z,3.4,3.4,.3,'darksteel',{seg:20,collide:true});for(let i=0;i<16;i++){const a=i/16*6.283;W.cyl(x+Math.cos(a)*3.3,y+h+.3,z+Math.sin(a)*3.3,.03,.03,1.1,'darksteel',{seg:4});}
 W.cyl(x,y+h+.3,z,3.35,3.35,.06,'darksteel',{seg:20,open:true});W.cyl(x,y+h+1.35,z,3.35,3.35,.06,'darksteel',{seg:20,open:true});
 W.cyl(x,y+h+.3,z,1.5,1.5,2.2,'glass',{seg:12});W.geo(new THREE.ConeGeometry(1.7,1.4,12),'red',M(x,y+h+3.2,z));return y+h+.3;}
export function waterTower(W,x,z,h=14,o={}){const y=o.y??W.groundAt(x,z)-.3;for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.cyl(x+a*2.4,y,z+b*2.4,.16,.2,h,'rust',{seg:6,collide:true,walk:false});
 for(let k=1;k<4;k++){const yy=y+k*h/4;rail(W,x-2.4,z-2.4,x+2.4,z+2.4,yy,.12,'rust',{t:.08,matK:'fabric'});rail(W,x+2.4,z-2.4,x-2.4,z+2.4,yy,.12,'rust',{t:.08,matK:'fabric'});}
 W.box(x,y+h,z,7,.25,7,'wood',{matK:'wood'});for(const[a,b,c,d]of[[-3.5,-3.5,3.5,-3.5],[3.5,-3.5,3.5,3.5],[3.5,3.5,-3.5,3.5],[-3.5,3.5,-3.5,-3.5]]){for(const hh of[.5,.95])rail(W,x+a,z+b,x+c,z+d,y+h+.25+hh,.06,'rust',{t:.05,matK:'fabric'});W.box(x+a,y+h+.25,z+b,.08,1,.08,'rust',{collide:false});}
 W.cyl(x,y+h+.25,z+(o.tankOff||1.6)*0,2.3,2.3,4.2,'wood',{seg:16,collide:true,walk:false,matK:'wood'});W.geo(new THREE.ConeGeometry(2.5,1.2,16),'rust',M(x,y+h+5.05,z));return y+h+.25;}
export function chapel(W,x,z,ry=0){const y=W.groundAt(x,z)-.3;W.box(x,y,z,7,6,12,{side:'stucco',top:'stucco'},{ry});gableRoof(W,x,y+6,z,12,7.4,3,'terracotta',ry+Math.PI/2);
 const c=Math.cos(ry),s=Math.sin(ry),tx=x+(-7)*s,tz=z+(-7)*c;W.box(tx,y,tz,3.6,12,3.6,{side:'stucco',top:'stucco'},{ry});W.box(tx,y+12,tz,3.8,.3,3.8,'stucco',{ry});
 for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(tx+(a*c+b*s)*1.6,y+12.3,tz+(-a*s+b*c)*1.6,.5,2.4,.5,'stucco',{ry,walk:false});W.box(tx,y+14.7,tz,4,.4,4,'stucco',{ry,walk:false});hipRoof(W,tx,y+15.1,tz,4,4,2.4,'terracotta');return{x:tx,y:y+12.3,z:tz};}
export function mast(W,x,z,h=30){const y=W.groundAt(x,z)-.3;for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.cyl(x+a*1.2,y,z+b*1.2,.07,.09,h,'steel',{seg:5,collide:false});W.collider(x,y+h/2,z,1.3,h/2,1.3,0,false,'metal');
 for(let k=0;k<h/3;k++){const yy=y+k*3+1.5;rail(W,x-1.2,z-1.2,x+1.2,z+1.2,yy,.05,'steel',{t:.04,matK:'fabric'});rail(W,x+1.2,z-1.2,x-1.2,z+1.2,yy,.05,'steel',{t:.04,matK:'fabric'});}
 W.box(x,y+h,z,3.4,.18,3.4,'darksteel',{matK:'metal'});for(const[a,b,c,d]of[[-1.7,-1.7,1.7,-1.7],[1.7,-1.7,1.7,1.7],[1.7,1.7,-1.7,1.7],[-1.7,1.7,-1.7,-1.7]]){for(const hh of[.5,.95])rail(W,x+a,z+b,x+c,z+d,y+h+.18+hh,.05,'steel',{t:.04,matK:'fabric'});W.box(x+a,y+h+.18,z+b,.06,1,.06,'steel',{collide:false});}
 W.cyl(x,y+h+.18,z,.08,.06,8,'steel',{seg:5});const l=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0xff2010}));l.position.set(x,y+h+8.3,z);W.add(l);return y+h+.18;}
export function hut(W,x,z,ry=0,o={}){const y=o.y??W.groundAt(x,z)-.4;W.box(x,y,z,5,3.2,4,{side:o.mat||'wood',top:o.mat||'wood'},{ry,matK:'wood'});gableRoof(W,x,y+3.2,z,5.6,4.6,1.6,o.roof||'darksteel',ry);return y+3.2;}
export function craneTower(W,x,z,h,ry=0){const y=W.groundAt(x,z)-.2;for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(x+a*1.1,y,z+b*1.1,.2,h,.2,'yellow',{collide:false});W.collider(x,y+h/2,z,1.3,h/2,1.3,0,false,'metal');
 for(let k=0;k<h/2.5;k++){const yy=y+k*2.5+1;for(const[a,b,c,d]of[[-1.1,-1.1,1.1,-1.1],[1.1,-1.1,1.1,1.1],[1.1,1.1,-1.1,1.1],[-1.1,1.1,-1.1,-1.1]])rail(W,x+a,z+b,x+c,z+d,yy,.08,'yellow',{t:.06});}
 const c=Math.cos(ry),s=Math.sin(ry);W.box(x,y+h,z,3,.4,3,'yellow',{ry});// jib + counter-jib
 W.box(x+(-s)*14,y+h+2.6,z+(-c)*14,1.4,1.4,42,'yellow',{ry,collide:false,walk:false});W.box(x+(s)*8,y+h+1.8,z+(c)*8,2.6,1.6,3,'concreteD',{ry,collide:false});
 W.box(x,y+h+.4,z,1.6,4.4,1.6,'yellow',{ry,walk:false,collide:false});W.box(x+(-s)*1.4,y+h,z+(-c)*1.4,2.4,.25,2.4,'darksteel',{ry});
 return y+h+.25;}
export function billboard(W,x,y,z,ry,txt,col){W.box(x,y,z,.4,4,.4,'darksteel',{walk:false});W.box(x,y+4,z,12,.2,2.4,'darksteel',{ry});W.sign(x-Math.sin(ry)*.5,y+8,z-Math.cos(ry)*.5,11.6,5,txt,{ry:ry+Math.PI,bg:'#1a1030',fg:col||'#ffd040',size:96,tw:768,th:330});
 W.box(x-Math.sin(ry)*.2,y+5.4,z-Math.cos(ry)*.2,12,5.4,.3,'darksteel',{ry,walk:false});return y+4.2;}
export function sandbags(W,p,yaw,o={}){// a crescent of sandbags in front of a perch (yaw = facing)
 const c=Math.cos(yaw),s=Math.sin(yaw);const fx=-s,fz=-c,rx=c,rz=-s;const r=rng(9);
 for(let row=0;row<2;row++)for(let i=-3;i<=3;i++){const a=i*.17,d=.95+Math.abs(i)*.04;const x=p.x+(fx*Math.cos(a)+rx*Math.sin(a))*d,z=p.z+(fz*Math.cos(a)+rz*Math.sin(a))*d;
  const g=new THREE.SphereGeometry(.5,10,6);g.scale(.55,.22,.32);W.geo(g,'vcol',M(x,p.y-.86+row*.2+r()*.02,z,0,yaw+a+(row%2)*.1,0),{col:o.col||0x8a7a5a,cast:false});}}
export function scatter(n,seed,f){const r=rng(seed),out=[];let tries=0;while(out.length<n&&tries++<n*30){const p=f(r);if(p)out.push(p);}return out;}
