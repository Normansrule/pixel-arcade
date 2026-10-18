// LANTERN STREET — the street on festival night: cobbles, houses, string lanterns, lantern posts, three stalls, Teodor's workshop corner,
// the courtyard, the canal steps, the loft roof terrace, the plaza with the parade bell and the paper-whale float.
// Static dressing is merged per material; lanterns, bulbs and windows are lit-instance meshes whose glow follows the restoration wave.
import {THREE,V3,M,ctex,mat,bucket,litInstances,pools,cl,sstep,rng,rnd,lerp} from './util.js';
import {tex} from './chars.js';
import {PARTS} from './data.js';
const B=(x,y,z)=>new THREE.BoxGeometry(x,y,z),C=(a,b,h,s=12,open=false)=>new THREE.CylinderGeometry(a,b,h,s,1,open),S=(r,w=12,h=8)=>new THREE.SphereGeometry(r,w,h),ICO=(r,d=1)=>new THREE.IcosahedronGeometry(r,d);
export const LOFT={x:11.6,y:4.5,z:-21};          // battle stage centre on the loft roof
export const KNOT={x:7.6,z:-8.9};                 // the gloom knot at the foot of the loft stairs
export const BENCH={x:9.9,z:6.6};                 // Teodor's workbench
export const BELL={x:2.6,z:-30};                  // parade bell
export const START={x:0,z:22};

/* ---------- walkable ground: y at (x,z), or null outside the street ---------- */
export function ground(x,z){
 if(x>6.1&&x<9.2&&z<-7.5&&z>-14.3)return cl((-8-z)/6,0,1)*4.5;                 // loft stairs (ramp)
 if(x>6.1&&x<16.6&&z<=-14.3&&z>-27.6)return 4.5;                                 // loft roof terrace
 if(x>-6.2&&x<6.2&&z>-26.2&&z<30)return 0;                                     // the street
 if(x>-13.6&&x<6.2&&z>-37&&z<=-26.2)return 0;                                    // plaza
 if(x>-14.2&&x<=-6.2&&z>-1.6&&z<5.6)return 0;                                    // courtyard
 if(x>-9.4&&x<=-6.2&&z>16.4&&z<21.6)return 0;                                    // recycling nook behind Fern's stall
 if(x>=6.2&&x<11.2&&z>1.4&&z<9.6)return 0;                                       // Teodor's workshop
 if(x>-12.9&&x<=-6.2&&z>-21.6&&z<-14.8)return -.35*Math.min(4,Math.ceil(Math.max(0,-6.5-x)/1.05));   // canal steps
 return null;}

/* ---------- textures ---------- */
function textures(){const r=rng(7);
 const cobble=ctex(512,512,(x,w,h)=>{x.fillStyle='#2a2420';x.fillRect(0,0,w,h);const rows=14,rh=h/rows;
  for(let j=0;j<rows;j++){let cx=(j%2)*18-r()*10;while(cx<w){const sw=26+r()*22,v=88+r()*46|0,warm=r()*14|0;const y0=j*rh+1.5+r()*1.5,hh=rh-3-r()*2;
    for(const ox of[0,-w,w]){x.fillStyle=`rgb(${v+warm+8},${v+warm-2},${v-8})`;x.beginPath();x.roundRect(cx+ox+1.5,y0,sw-3,hh,7+r()*4);x.fill();
     x.fillStyle='rgba(255,236,210,.08)';x.beginPath();x.roundRect(cx+ox+4,y0+2,sw-12,hh*.4,5);x.fill();x.fillStyle='rgba(0,0,0,.12)';x.fillRect(cx+ox+3,y0+hh-4,sw-6,3);}
    cx+=sw;}}
  for(let k=0;k<3000;k++){x.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:240},${r()<.5?0:200},${r()*.05})`;x.fillRect(r()*w,r()*h,2,2);}
  for(let k=0;k<14;k++){const g=x.createRadialGradient(r()*w,r()*h,4,r()*w,r()*h,60+r()*60);g.addColorStop(0,'rgba(40,60,30,.10)');g.addColorStop(1,'rgba(40,60,30,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}},{rep:[1,1]});
 const plaster=ctex(256,256,(x,w,h)=>{x.fillStyle='#e8e2d6';x.fillRect(0,0,w,h);for(let k=0;k<3000;k++){const v=200+r()*55|0;x.fillStyle=`rgba(${v},${v-6},${v-14},.18)`;x.fillRect(r()*w,r()*h,1+r()*3,1+r()*3);}
  for(let k=0;k<8;k++){const g=x.createRadialGradient(r()*w,r()*h,2,r()*w,r()*h,40+r()*60);g.addColorStop(0,'rgba(120,100,80,.12)');g.addColorStop(1,'rgba(120,100,80,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}
  x.strokeStyle='rgba(90,70,60,.25)';for(let k=0;k<5;k++){x.beginPath();let px=r()*w,py=r()*h;x.moveTo(px,py);for(let i=0;i<5;i++){px+=(r()-.5)*24;py+=r()*14;x.lineTo(px,py);}x.stroke();}
  x.fillStyle='rgba(60,40,30,.12)';x.fillRect(0,h-26,w,26);});
 const tile=ctex(128,128,(x,w,h)=>{x.fillStyle='#5a3a30';x.fillRect(0,0,w,h);for(let j=0;j<8;j++)for(let i=0;i<8;i++){const ox=(j%2)*8;const v=150+r()*50|0;x.fillStyle=`rgb(${v},${v},${v})`;x.beginPath();x.ellipse(i*16+ox+8,j*16+10,8,9,0,0,Math.PI);x.fill();x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i*16+ox+3,j*16+9,10,2);}});
 const wood=ctex(128,128,(x,w,h)=>{x.fillStyle='#c8a070';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=16){const v=150+r()*60|0;x.fillStyle=`rgb(${v},${v*.8|0},${v*.6|0})`;x.fillRect(0,j,w,15);x.fillStyle='rgba(40,20,10,.5)';x.fillRect(0,j+15,w,1);
  for(let k=0;k<6;k++){x.strokeStyle=`rgba(80,40,20,${.15+r()*.1})`;x.beginPath();x.moveTo(0,j+r()*14);x.bezierCurveTo(w*.3,j+r()*14,w*.6,j+r()*14,w,j+r()*14);x.stroke();}x.fillStyle='rgba(40,20,10,.4)';x.fillRect((r()*w)|0,j,1,15);}});
 const stripe=(a,b)=>ctex(128,64,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?b:a;x.fillRect(i*16,0,16,h);}x.fillStyle='rgba(0,0,0,.15)';x.fillRect(0,h-6,w,6);for(let i=0;i<8;i++){x.fillStyle=i%2?b:a;x.beginPath();x.arc(i*16+8,h-6,8,0,Math.PI);x.fill();}});
 const stone=ctex(128,128,(x,w,h)=>{x.fillStyle='#6a6058';x.fillRect(0,0,w,h);for(let j=0;j<4;j++)for(let i=0;i<4;i++){const v=120+r()*40|0;x.fillStyle=`rgb(${v},${v-8},${v-16})`;x.fillRect(i*32+(j%2)*16+1,j*32+1,30,30);}});
 const clock=ctex(256,256,(x,w,h)=>{x.fillStyle='#f2e6c8';x.beginPath();x.arc(128,128,124,0,6.283);x.fill();x.lineWidth=10;x.strokeStyle='#3a2a1a';x.stroke();x.fillStyle='#3a2a1a';for(let i=0;i<12;i++){const a=i/12*6.283;x.save();x.translate(128+Math.sin(a)*100,128-Math.cos(a)*100);x.rotate(a);x.fillRect(-4,-12,8,24);x.restore();}
  x.fillStyle='#d63a2e';x.beginPath();x.arc(128,28,10,0,6.283);x.fill();},{clamp:true});
 return{cobble,plaster,tile,wood,stone,clock,aw:[stripe('#c8382c','#f2e6d0'),stripe('#1e8a8a','#f2e6d0'),stripe('#e8a020','#f2e6d0')]};}

/* ---------- build ---------- */
export function buildWorld(scene,q){const T=textures(),CT=tex(),r=rng(11);const W={objs:[],colliders:[],t:0};const root=new THREE.Group();scene.add(root);W.root=root;
 const MT={plaster:mat(0xffffff,{vc:true,map:T.plaster,r:.92}),wood:mat(0xffffff,{vc:true,map:T.wood,r:.85}),dark:mat(0xffffff,{vc:true,r:.8}),roof:mat(0xffffff,{vc:true,map:T.tile,r:.8}),stone:mat(0xffffff,{vc:true,map:T.stone,r:.9}),
  leaf:mat(0xffffff,{vc:true,r:.9,flat:true}),metal:mat(0xffffff,{vc:true,r:.4,m:.6}),cloth:mat(0xffffff,{vc:true,r:.95}),card:mat(0xffffff,{map:CT.card,r:.9}),cob:mat(0xffffff,{map:T.cobble,r:.88,vc:true})};
 const add=bucket(),P=(mt,g,m,c)=>add(MT[mt]||mt,g,m,c);
 /* ground: cobbles mapped by world xz so pieces line up */
 const gp=(x0,x1,z0,z1,y=0,c=0xffffff)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++){uv.setXY(i,(p.getX(i)+(x0+x1)/2)/3.6,-(p.getZ(i)+(z0+z1)/2)/3.6);}P('cob',g,M((x0+x1)/2,y,(z0+z1)/2),c);};
 gp(-6.5,6.5,-26.2,34);gp(-14,6.5,-38,-26.2);gp(6.5,18,-38,-28);gp(-14.5,-6.5,-2,6,0,0xd8e0c8);gp(-9.6,-6.5,16,22);
 P('wood',B(5.8,.1,8.8).translate(0,-.04,0),M(9.1,0,5.5),0xb08060);// workshop floor
 // Teodor's workshop: an open pergola shed (low side walls, beams overhead) so the camera sees in from above
 for(const z of[1.1,9.9]){P('plaster',B(5.5,1.1,.3),M(9.25,.55,z),0xd8c8a8);P('wood',B(5.6,.1,.4),M(9.25,1.12,z),0x6a4a30);}
 for(const z of[1.1,9.9])P('wood',B(.24,3.4,.24),M(6.62,1.7,z),0x5a3a24);P('wood',B(.24,.26,9.2),M(6.62,3.35,5.5),0x5a3a24);
 for(let i=0;i<8;i++)P('wood',B(5.6,.16,.14),M(9.3,3.4,1.4+i*1.18),0x6a4a30);
 for(const[x0,x1,z0,z1]of[[-6.5,40,-47,43],[-13,-6.5,-14,43],[-13,-6.5,-47,-22],[-45,-25,-47,43]])P('dark',B(x1-x0,.1,z1-z0),M((x0+x1)/2,-.12,(z0+z1)/2),0x1a1620);// outskirts
 for(const[z0,z1]of[[-47,-22],[-14,43]])P('stone',B(.5,1.8,z1-z0),M(-13.25,-.85,(z0+z1)/2),0x5a5048);P('stone',B(.5,1.8,90),M(-24.75,-.85,-2),0x5a5048);
 // a dark canal beyond the west houses and water at the steps
 const water=new THREE.Mesh(new THREE.PlaneGeometry(12,80).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x10203a,roughness:.08,metalness:.4,emissive:0x061020}));water.position.set(-19,-1.65,-4);root.add(water);
 /* canal steps */
 for(let i=0;i<3;i++){const x0=-6.5-1.05*(i+1),top=-.35*(i+1),hh=1.7+top;P('stone',B(1.05,hh,7.4),M(x0+.525,top-hh/2,-18.2),i%2?0x9a8a7a:0x8a7a6a);}
 P('stone',B(3.4,.3,7.4),M(-11.35,-1.55,-18.2),0x7a6a5a);
 for(const z of[-21.7,-14.7])P('stone',B(7,.6,.3),M(-9.7,.3,z),0x9a8a7a);
 /* ----- houses ----- */
 const PAL=[0xe9b8a0,0xd8c8a8,0x9ec0b8,0xe0a878,0xc8b0d0,0xa8c4d8,0xe8d090,0xd89888];
 const wins=[];// window instances: {m:matrix, lit0}
 const signs=[];
 function house(side,z0,z1,h,ci,o={}){const w=z1-z0,zc=(z0+z1)/2,D=o.d??7.4;const fx=6.5+(o.off||0),T0=side<0?M(-fx,0,zc):M(fx,0,zc,0,Math.PI,0);
  const p=(mt,g,lm,c)=>P(mt,g,T0.clone().multiply(lm),c);const col=PAL[ci%PAL.length],wd=[0x5a3a26,0x3a4a5a,0x6a2a2a,0x2a4a3a][ci%4];
  if(!o.open)p('plaster',B(D,h,w),M(-D/2,h/2,0),col);else{p('plaster',B(D,h-3.1,w),M(-D/2,3.1+(h-3.1)/2,0),col);p('plaster',B(.4,3.1,w),M(-D+.2,1.55,0),new THREE.Color(col).multiplyScalar(.75));for(const s of[-1,1])p('plaster',B(D,3.1,.4),M(-D/2,1.55,s*(w/2-.2)),col);}
  p('stone',B(.14,.7,w),M(.07,.35,0),0x9a8a7a);
  p('wood',B(.2,.24,w+.1),M(.1,3.1,0),wd);for(const s of[-1,1])p('wood',B(.22,h,.26),M(.1,h/2,s*(w/2-.13)),wd);
  const ang=.38,L=D+1.5;if(!o.flat)p('roof',B(L,.28,w+.5),M(-D/2+.5,h+Math.sin(ang)*L/2-.05,0,0,0,-ang),[0x8a4a3a,0x4a6a6a,0x6a4a5a,0x9a5a3a][ci%4]);
  if(!o.flat)p('wood',B(.3,.3,w+.5),M(.85,h-.02,0),0x3a2a1a);else p('wood',B(.3,.3,w),M(.15,h-.15,0),0x3a2a1a);
  if(o.chim)p('stone',B(.8,1.8,.8),M(-D*.6,h+2,w*.25),0x8a7068);
  // upper floors
  const floors=Math.floor((h-3.4)/2.6);for(let f=0;f<floors;f++){const y=3.6+f*2.6+1.1,n=Math.max(1,Math.floor(w/2.6));for(let i=0;i<n;i++){const zz=-w/2+(i+.5)*w/n;
    p('wood',B(.16,1.5,1.12),M(.04,y,zz),0xf2ead8);wins.push({m:T0.clone().multiply(M(.13,y,zz,0,0,0,1,1.3,.92)),lit0:r()<.4});
    if(r()<.55)for(const s of[-1,1])p('wood',B(.06,1.4,.5),M(.12,y,zz+s*.84),wd);
    if(r()<.5){p('wood',B(.4,.26,1.1),M(.22,y-.85,zz),0x6a4a2a);for(let k=0;k<4;k++)P('leaf',ICO(.17,0),T0.clone().multiply(M(.3,y-.62,zz-.4+k*.27)),[0x4a8a3a,0x5a9a4a,0xd84a6a,0xf2c040][(k+i)%4]);}}
   if(o.bal&&f===0){p('wood',B(1.1,.14,w*.7),M(.55,3.75,0),wd);for(let k=0;k<=8;k++)p('wood',B(.05,.8,.05),M(1.05,4.2,-w*.35+k*w*.7/8),wd);p('wood',B(.08,.08,w*.7),M(1.05,4.6,0),wd);}}
  // ground floor: a door and a shop window
  if(!o.open){const dz=o.door??(r()<.5?-1:1)*(w/2-1.1);p('wood',B(.18,2.3,1.2),M(.02,1.15,dz),0x3a2418);p('wood',B(.12,2.1,1),M(.06,1.1,dz),wd);p('metal',S(.05,6,4),M(.16,1.1,dz+.3),0xd8b040);
   const sw=Math.min(2.6,w-3.2);if(sw>1){wins.push({m:T0.clone().multiply(M(.11,1.6,-dz*.45,0,0,0,1,1.5,sw)),lit0:r()<.35});p('wood',B(.18,1.7,sw+.2),M(.02,1.6,-dz*.45),0xf2ead8);}
   if(r()<.7)P('leaf',ICO(.35,1),T0.clone().multiply(M(.5,.45,dz+(dz>0?-1:1))),0x3a7a3a);
   if(o.sign!==undefined)signs.push({T0,dz,i:o.sign});}}
 // west side (facing +x)
 house(-1,22,30,7.5,0,{chim:1});house(-1,16,16,6,1);house(-1,11.2,16,8.2,2,{bal:1});house(-1,6,11.2,6.8,3,{chim:1});house(-1,-8,-2,7.6,4,{bal:1,sign:2});house(-1,-14.4,-8,6.4,5,{chim:1});house(-1,-26.2,-21.8,8.4,6,{bal:1});
 house(-1,16,22,6.4,1,{off:3.2});house(-1,-2,6,5.6,7,{off:8,d:5});
 // east side (facing -x)
 house(1,22,30,6.6,7,{bal:1});house(1,16,22,8.4,1,{chim:1,sign:1});house(1,10,16,6.4,2);house(1,1,10,7.2,4,{off:5.5,d:6});house(1,-7.6,1,7.8,6,{bal:1,chim:1,sign:0});
 house(1,-28,-14,4.5,3,{d:10.6,flat:1});house(1,-14,-7.6,9,5,{off:3.2});
 // plaza backdrop
 for(const[x,z,w,h,ci]of[[-12,-40,6,9,2],[-5,-41,7,12,5],[2.5,-40.5,6,8.5,0],[9,-40,6,10,4],[15,-39,6,7.5,1],[-16,-31,5,8,7]]){const p=(mt,g,m,c)=>P(mt,g,m,c);
  p('plaster',B(w,h,6),M(x,h/2,z-2),PAL[ci]);p('roof',B(w+.5,.3,7.5),M(x,h+1,z-2,-.35),0x5a3a40);
  for(let i=0;i<Math.floor(w/2);i++)for(let f=0;f<Math.floor((h-3)/2.6);f++)wins.push({m:M(x-w/2+(i+.5)*w/Math.floor(w/2),3.2+f*2.6,z+1.02,0,-Math.PI/2,0,1,1.3,1),lit0:r()<.45});}
 // clock tower over the plaza
 P('plaster',B(4,16,4),M(-5,8,-44.5),0xd8c8a8);P('roof',new THREE.ConeGeometry(3.4,3.5,4).rotateY(Math.PI/4),M(-5,17.7,-44.5),0x6a3a3a);
 const clockFace=new THREE.Mesh(new THREE.CircleGeometry(1.5,32),new THREE.MeshStandardMaterial({map:T.clock,emissive:0xffe0a0,emissiveMap:T.clock,emissiveIntensity:.5,roughness:.7}));clockFace.position.set(-5,13,-42.45);root.add(clockFace);
 const hand=new THREE.Mesh(B(.12,1.1,.06).translate(0,.45,0),mat(0x2a1a10));hand.position.set(-5,13,-42.4);root.add(hand);const hand2=new THREE.Mesh(B(.16,.7,.06).translate(0,.3,0),mat(0x2a1a10));hand2.position.set(-5,13,-42.38);root.add(hand2);W.clockHands=[hand,hand2];
 // houses beyond the canal (silhouettes with windows)
 for(let i=0;i<8;i++){const z=24-i*8.5,h=6+r()*5;P('plaster',B(6,h,7),M(-28,h/2-1.6,z),PAL[(i+3)%8]);P('roof',B(7,.3,7.6),M(-27.4,h-1.2,z,0,0,-.35),0x4a3a40);for(let k=0;k<2;k++)wins.push({m:M(-24.9,1.5+k*2.6,z,0,0,0,1,1.2,1),lit0:r()<.55});}
 /* ----- loft roof terrace (y 4.5) ----- */
 const Y=4.5;P('wood',B(10.6,.2,14).translate(0,-.1,0),M(11.8,Y,-21),0xa87a58);
 const rail=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(x1-x0,z1-z0),n=Math.ceil(L/1.2);P('wood',B(.1,.1,L),M((x0+x1)/2,Y+1,(z0+z1)/2,0,a,0),0x6a4a30);for(let i=0;i<=n;i++){const t=i/n;P('wood',B(.1,1,.1),M(lerp(x0,x1,t),Y+.5,lerp(z0,z1,t)),0x6a4a30);}};
 rail(6.6,-27.9,6.6,-14.4);rail(6.6,-27.9,17,-27.9);rail(17,-27.9,17,-14.1);rail(9.5,-14.1,17,-14.1);
 // stairs: steps up from the street to the terrace, with a side wall
 for(let i=0;i<12;i++){const z=-8.1-i*.5,y=(i+1)*4.5/12;P('wood',B(3,.16,.52),M(7.7,y-.08,z),0x9a7050);P('wood',B(3,y,.5),M(7.7,y/2-.08,z),0x6a4a34);}
 P('plaster',B(.3,5.6,7),M(9.45,2.8,-11),PAL[3]);rail(6.25,-9.4,6.25,-14.1);
 // terrace furniture: sofa, fire pit, crates, planters, chimneys, water tank, string-light poles
 const sofa=(x,z,ry,c)=>{const t=M(x,Y,z,0,ry,0);const q=(g,m,cc)=>P('cloth',g,t.clone().multiply(m),cc);q(B(2.4,.45,.9),M(0,.35,0),c);q(B(2.4,.7,.25),M(0,.75,-.38),c);for(const s of[-1,1])q(B(.25,.6,.9),M(s*1.15,.55,0),c);for(const s of[-1,1])q(B(1.05,.18,.8),M(s*.55,.65,.02),new THREE.Color(c).multiplyScalar(1.15));};
 sofa(16,-20.6,-Math.PI/2,0x6a4a9a);W.colliders.push({x:16,z:-21.2,r:.9,y:Y},{x:16,z:-20,r:.9,y:Y});
 P('stone',C(.95,1.05,.45,12),M(15.2,Y+.22,-16.2),0x8a7a6a);P('dark',C(.7,.7,.47,12),M(15.2,Y+.23,-16.2),0x2a2020);W.colliders.push({x:15.2,z:-16.2,r:1.1,y:Y});W.firePit=new V3(15.2,Y+.5,-16.2);
 for(const[x,z]of[[13.6,-27],[14.5,-27.1],[14,-26.9]])P('wood',B(.8,.8,.8),M(x,Y+.4+(x===14?.8:0),z,0,r(),0),0x8a6a40);W.colliders.push({x:14,z:-27,r:1,y:Y});
 for(const[x,z]of[[7.4,-27],[16.2,-14.9],[16.2,-24.2]]){P('wood',B(.9,.6,.9),M(x,Y+.3,z),0x6a4a30);for(let k=0;k<5;k++)P('leaf',ICO(.3,1),M(x+(r()-.5)*.5,Y+.7+r()*.3,z+(r()-.5)*.5),[0x4a8a3a,0x6aa04a,0xe86a8a][k%3]);W.colliders.push({x,z,r:.7,y:Y});}
 for(const[x,z]of[[9.4,-27.1],[11.6,-27.2]]){P('stone',B(1,2.4,1),M(x,Y+1.2,z),0x8a6a60);P('dark',B(1.2,.2,1.2),M(x,Y+2.45,z),0x3a2a2a);W.colliders.push({x,z,r:.8,y:Y});}
 P('metal',C(1,1,1.8,14),M(16,Y+2.1,-26.6),0x5a8aa0);for(const s of[-1,1])for(const t of[-1,1])P('metal',C(.06,.06,1.2,5),M(16+s*.7,Y+.6,-26.6+t*.7),0x3a4a5a);W.colliders.push({x:16,z:-26.6,r:1.1,y:Y});
 const poles=[[6.9,-14.6],[16.7,-14.4],[16.7,-27.6],[6.9,-27.6]];for(const[x,z]of poles)P('wood',C(.07,.09,3.4,6),M(x,Y+1.7,z),0x5a3a24);
 /* ----- Teodor's workshop corner (always warm) ----- */
 const wx=10.4;P('cloth',B(4.2,.02,6.4),M(8.8,.02,5.5),0x2a4a8a);
 P('wood',B(1.1,.95,2.6),M(BENCH.x+.3,.48,BENCH.z),0x8a5a32);P('wood',B(1.25,.08,2.8),M(BENCH.x+.3,.98,BENCH.z),0xb07a48);W.colliders.push({x:BENCH.x+.3,z:BENCH.z,r:1.3});
 for(let i=0;i<6;i++)P('card',B(.3+r()*.4,.04+r()*.25,.3+r()*.4),M(BENCH.x+.3+(r()-.5)*.7,1.08,BENCH.z+(r()-.5)*2.2,0,r()*3,0));
 for(let i=0;i<3;i++)P('metal',new THREE.TorusGeometry(.09,.04,6,12).rotateX(Math.PI/2),M(BENCH.x+.1,1.06,BENCH.z-1+i*.35),0xd8d8e0);
 P('wood',B(.4,2.6,3),M(wx+.6,1.3,7.6),0x6a4a2a);for(let k=0;k<4;k++){P('wood',B(.5,.06,3),M(wx+.55,.5+k*.6,7.6),0x8a6a3a);for(let i=0;i<5;i++)P('dark',C(.09,.09,.22,8),M(wx+.5,.65+k*.6,6.4+i*.55),[0xd8483a,0x3a8ad8,0xf2c040,0x5aa06a,0xe8e0d0][(i+k)%5]);}
 const sofa2=t=>{};void sofa2;
 { const t=M(8.6,0,2.6,0,Math.PI,0);const q=(g,m,cc)=>P('cloth',g,t.clone().multiply(m),cc);q(B(2.6,.45,.95),M(0,.33,0),0x6a3a8a);q(B(2.6,.75,.25),M(0,.75,-.4),0x6a3a8a);for(const s of[-1,1])q(B(.25,.6,.95),M(s*1.25,.5,0),0x6a3a8a);q(B(1.1,.16,.8),M(-.6,.62,0),0x8a5aaa);q(B(1.1,.16,.8),M(.6,.62,0),0x8a5aaa);W.colliders.push({x:8.6,z:2.6,r:1.3}); }
 P('metal',B(1.1,2.2,.9),M(wx+.4,1.1,3.6),0x2a8a8a);P('dark',B(.05,1.4,.7),M(wx-.17,1.3,3.6),0x9ae8e0);W.colliders.push({x:wx+.4,z:3.6,r:.8});
 P('wood',B(.6,.5,.6),M(7.2,.25,4.2),0x8a6a40);
 // half-made lanterns: paper globes on the bench and hanging from the pergola (Teodor's work in progress)
 { const pm=mat(0xffffff,{vc:true,r:.8,e:0x3a2010,ei:.6});for(const[x,y,z,c,sc]of[[10.1,1.25,7.6,0xff8a5a,.8],[10.3,1.2,5.5,0xffd070,.7],[9.4,2.6,8.4,0xff6a7a,1],[9.0,2.7,3.4,0xffc050,1.1],[10.6,2.55,6,0x8ad0ff,.9]]){P(pm,new THREE.SphereGeometry(.28,12,8).scale(1,1.15,1),M(x,y,z,0,0,0,sc),c);if(y>2)P('dark',C(.01,.01,.7,4),M(x,y+.6,z),0x2a2018);}
  for(let i=0;i<4;i++)P('card',B(.5,.4,.5),M(7.2+(i%2)*.55,.2+(i>1?.4:0),8.9,0,r()*.4,0)); }P('leaf',ICO(.45,1),M(10.6,.9,9.1),0x3a8a4a);P('wood',C(.3,.25,.5,10),M(10.6,.25,9.1),0xb06a3a);
 /* ----- courtyard: well, garden beds, tree, bench ----- */
 P('stone',C(1,1.05,.9,14),M(-10.4,.45,1.8),0x9a8a7a);P('dark',C(.8,.8,.92,14),M(-10.4,.46,1.8),0x101820);for(const s of[-1,1])P('wood',B(.14,2.2,.14),M(-10.4+s*.85,1.1,1.8),0x5a3a24);P('roof',B(2.4,.12,1.6),M(-10.4,2.3,1.8,.4),0x8a4a3a);P('roof',B(2.4,.12,1.6),M(-10.4,2.3,1.8,-.4),0x8a4a3a);
 W.colliders.push({x:-10.4,z:1.8,r:1.2});
 for(const[x,z]of[[-8,-.6],[-13.2,-.4]]){P('wood',B(1.8,.45,1.1),M(x,.22,z),0x7a5432);P('dark',B(1.6,.05,.9),M(x,.46,z),0x3a2a1a);for(let k=0;k<6;k++)P('leaf',ICO(.18+r()*.1,0),M(x-.6+k*.24,.6+r()*.15,z+(r()-.5)*.4),[0x5a9a3a,0xe85a7a,0xf2d040,0x6ab04a][k%4]);W.colliders.push({x,z,r:1});}
 P('wood',C(.18,.24,2.6,8),M(-13.4,1.3,4.6),0x5a3a24);for(let k=0;k<6;k++)P('leaf',ICO(.9+r()*.4,1),M(-13.4+(r()-.5)*1.4,3+r()*1.2,4.6+(r()-.5)*1.4),[0x3a6a3a,0x4a7a3a,0x2a5a3a][k%3]);W.colliders.push({x:-13.4,z:4.6,r:.5});
 P('wood',B(.5,.45,2),M(-7.2,.3,4),0x8a6a40);
 // laundry line across the courtyard
 for(let i=0;i<5;i++)P('cloth',B(.04,.6+r()*.3,.5),M(-10.4,3.1,-1+i*1.3),[0xe8e0d0,0xd85a4a,0x4a8ad8,0xf2c040,0x6aa06a][i]);
 /* ----- recycling nook (behind Fern's stall) ----- */
 for(const[x,z,c]of[[-8.9,17.2,0x2a6a9a],[-8.9,18.5,0x3a8a4a]]){P('metal',B(.9,1,1),M(x,.5,z),c);P('metal',B(.95,.08,1.05),M(x+.05,1.04,z,0,0,.15),new THREE.Color(c).multiplyScalar(.7));W.colliders.push({x,z,r:.7});}
 for(let i=0;i<7;i++)P('card',B(.5+r()*.4,.3+r()*.4,.5+r()*.4),M(-8.6+r()*1.6,.2+(i>4?.45:0),20.4+r()*.9,0,r()*2,0));W.colliders.push({x:-8,z:21,r:.8});
 /* ----- street clutter ----- */
 const crate=(x,z,s=1,ry=0)=>{P('wood',B(.8*s,.8*s,.8*s),M(x,.4*s,z,0,ry,0),0x9a7448);W.colliders.push({x,z,r:.55*s});};
 const barrel=(x,z)=>{P('wood',C(.4,.36,.9,12),M(x,.45,z),0x7a5432);P('metal',new THREE.TorusGeometry(.4,.03,4,14).rotateX(Math.PI/2),M(x,.7,z),0x3a3a3a);W.colliders.push({x,z,r:.5});};
 const plant=(x,z,s=1)=>{P('wood',C(.3*s,.24*s,.5*s,10),M(x,.25*s,z),0xb86a3a);P('leaf',ICO(.42*s,1),M(x,.75*s,z),0x3a7a3a);P('leaf',ICO(.2*s,0),M(x+.15,.95*s,z+.1),0xe86a8a);W.colliders.push({x,z,r:.4*s});};
 crate(-5.6,27);crate(-5.5,26.1,.8,.4);barrel(5.6,24);plant(5.7,12.4);plant(-5.7,8);crate(5.6,13.4,.7);barrel(-5.6,-9.6);plant(-5.7,-12.6,1.2);crate(3.7,-5.2,.7);plant(5.75,-3.9);barrel(-5.6,-23);crate(5.7,-24,.9,.3);plant(-5.7,22.6);
 // benches in the plaza, trees
 for(const[x,z,ry]of[[-10,-33,0],[4.5,-34.5,0]]){P('wood',B(2.2,.12,.6),M(x,.5,z,0,ry,0),0x9a6a40);for(const s of[-1,1])P('dark',B(.1,.5,.5),M(x+s*.9,.25,z,0,ry,0),0x2a2a2a);W.colliders.push({x:x-.6,z,r:.6},{x:x+.6,z,r:.6});}
 for(const[x,z]of[[-12,-28],[5,-36.2],[-12.6,-36]]){P('wood',C(.18,.25,2.2,8),M(x,1.1,z),0x5a3a24);for(let k=0;k<5;k++)P('leaf',ICO(.8+r()*.4,1),M(x+(r()-.5)*1.2,2.6+r(),z+(r()-.5)*1.2),[0x3a6a3a,0x4a7a3a][k%2]);W.colliders.push({x,z,r:.5});}
 // gate arch at the street's south end
 for(const s of[-1,1]){P('wood',C(.2,.25,5.6,8),M(s*5.4,2.8,30.6),0x8a2a22);P('stone',B(.7,.5,.7),M(s*5.4,.25,30.6),0x8a7a6a);W.colliders.push({x:s*5.4,z:30.6,r:.4});}
 P('wood',B(12,.35,.4),M(0,5.4,30.6),0x8a2a22);P('wood',B(12.8,.25,.5),M(0,5.9,30.6,0,0,0),0x3a2018);P('cloth',B(3,.9,.06),M(0,4.7,30.6),0xf2e0b0);
 // low fence & bushes closing the south end (keeps the camera's view open)
 for(let i=0;i<9;i++){P('leaf',ICO(.8+r()*.4,1),M(-6+i*1.5,.5,31.5+r()),[0x2a4a2a,0x3a5a2a][i%2]);}
 /* ----- lantern posts (14) ----- */
 W.posts=[];const PZ={'-1':[28,22.4,15.6,7.2,-3,-9.6,-23.5],'1':[25,15.6,10.8,-5.6,-16,-21.5,-27]};for(const s of[-1,1])for(let i=0;i<7;i++){const z=PZ[s][i],x=s*5.55;W.posts.push({x,z,y:3.05});P('wood',C(.09,.13,3.4,8),M(x,1.7,z),0x2a2220);P('stone',C(.25,.3,.3,8),M(x,.15,z),0x6a6058);P('wood',B(.9,.08,.08),M(x-s*.4,3.4,z),0x2a2220);W.colliders.push({x,z,r:.3});}
 W.posts.forEach(p=>p.x-=Math.sign(p.x)*.8);
 /* ----- plaza: the paper whale float and the parade bell ----- */
 const fl=new THREE.Group();fl.position.set(-4.5,0,-32);root.add(fl);W.float=fl;
 { const fb=bucket(),q=(mt,g,m,c)=>fb(MT[mt]||mt,g,m,c);q('wood',B(5,.5,2.6),M(0,.75,0),0x8a3a2a);for(const sx of[-1.8,1.8])for(const sz of[-1.3,1.3])q('dark',C(.45,.45,.2,12).rotateX(Math.PI/2),M(sx,.45,sz),0x2a2020);q('wood',B(5.2,.12,2.8),M(0,1.06,0),0xe8b040);fb.flush(fl); }
 const wtx=ctex(256,128,(x,w,h)=>{x.fillStyle='#3a7ac8';x.fillRect(0,0,w,h);x.fillStyle='#5a9ae0';for(let i=0;i<12;i++){x.beginPath();x.arc(i*24,h*.62,14,0,Math.PI);x.fill();}x.fillStyle='#f2c040';for(let i=0;i<30;i++){x.beginPath();x.arc(r()*w,r()*h*.5,2+r()*3,0,6.283);x.fill();}x.strokeStyle='rgba(20,30,60,.35)';x.lineWidth=2;for(let i=0;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}});
 const whaleM=new THREE.MeshStandardMaterial({color:0xffffff,map:wtx,roughness:.7,emissive:0x2a70d0,emissiveMap:wtx,emissiveIntensity:.02});const whale=new THREE.Group();whale.position.y=2.4;fl.add(whale);
 { const b=new THREE.Mesh(new THREE.LatheGeometry([[0,-1.9],[.55,-1.6],[.95,-1],[1.15,-.2],[1.2,.5],[1.05,1.2],[.6,1.75],[0,1.9]].map(([a,c])=>new THREE.Vector2(a,c)),22),whaleM);b.rotation.z=Math.PI/2;b.scale.set(1,1,.92);whale.add(b);
  const tail=new THREE.Group();tail.position.set(-1.9,.1,0);whale.add(tail);const tb=new THREE.Mesh(new THREE.ConeGeometry(.42,1.3,12),whaleM);tb.rotation.z=Math.PI/2+.25;tb.position.set(-.5,.15,0);tail.add(tb);
  for(const s2 of[-1,1]){const fl2=new THREE.Mesh(S(.6,12,8),whaleM);fl2.scale.set(.45,.12,1);fl2.position.set(-1.15,.55,s2*.5);fl2.rotation.set(s2*.3,0,.6);tail.add(fl2);
   const fin=new THREE.Mesh(S(.5,10,6),whaleM);fin.scale.set(.9,.12,.45);fin.position.set(.6,-.55,s2*1.05);fin.rotation.x=s2*.5;whale.add(fin);
   const ew=new THREE.Mesh(S(.17,10,8),mat(0xffffff,{r:.4}));ew.position.set(1.25,.25,s2*.92);whale.add(ew);const e=new THREE.Mesh(S(.09,8,6),mat(0x1a1a2a));e.position.set(1.36,.26,s2*.99);whale.add(e);}
  const belly=new THREE.Mesh(S(1,18,10),mat(0xf2ead8,{r:.6,e:0x5a4a30,ei:.3}));belly.scale.set(1.75,.55,.9);belly.position.set(.1,-.55,0);whale.add(belly);
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.5,.03,4,16,Math.PI*.8),mat(0x1a1a2a));mouth.position.set(1.5,-.2,0);mouth.rotation.set(0,Math.PI/2,Math.PI*1.1);whale.add(mouth);
  const sp=new THREE.Group();sp.position.set(.6,1.15,0);whale.add(sp);const sc=[0xffd040,0xff6a5a,0x6ae0ff,0xff9ad8,0xffffff];for(let i=0;i<7;i++){const st=new THREE.Mesh(B(.05,.9+r()*.5,.12),mat(sc[i%5],{e:sc[i%5],ei:.25}));const a=(i/7)*Math.PI*2;st.position.set(Math.cos(a)*.25,.5,Math.sin(a)*.25);st.rotation.set(Math.sin(a)*.6,0,-Math.cos(a)*.6);sp.add(st);}W.spout=sp;
  for(let i=0;i<5;i++){const rib=new THREE.Mesh(new THREE.TorusGeometry(1.17-Math.abs(i-2)*.1,.022,4,28),mat(0x2a2a4a));rib.position.x=-1+i*.55;rib.rotation.y=Math.PI/2;whale.add(rib);} }
 W.whale=whale;W.whaleM=whaleM;W.colliders.push({x:-6,z:-32,r:1.7},{x:-3,z:-32,r:1.7});
 { const bg=new THREE.Group();bg.position.set(BELL.x,0,BELL.z);root.add(bg);const wm=mat(0x5a2a1a,{r:.8});for(const s of[-1,1]){const p=new THREE.Mesh(B(.22,3,.22),wm);p.position.set(s*.9,1.5,0);p.castShadow=true;bg.add(p);}
  const top=new THREE.Mesh(B(2.4,.25,.35),wm);top.position.y=3.05;bg.add(top);const roofb=new THREE.Mesh(new THREE.ConeGeometry(1.6,.7,4).rotateY(Math.PI/4),mat(0x8a3a2a));roofb.scale.z=.4;roofb.position.y=3.5;bg.add(roofb);
  const bell=new THREE.Group();bell.position.y=2.95;bell.scale.setScalar(1.45);bg.add(bell);const bm=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.5,-.05],[.45,-.2],[.35,-.6],[.3,-.85],[0,-.9]].map(([a,b])=>new THREE.Vector2(a,b)),18),mat(0xf0b840,{m:.7,r:.28,e:0x5a3a08,ei:1}));bm.castShadow=true;bell.add(bm);W.bell=bell;
  W.colliders.push({x:BELL.x-.9,z:BELL.z,r:.35},{x:BELL.x+.9,z:BELL.z,r:.35}); }
 /* ----- stalls ----- */
 W.stalls=[];const stall=(x,z,face,awTex,kind)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=face;root.add(g);const sb=bucket(),q=(mt,gg,m,c)=>sb(MT[mt]||mt,gg,m,c);
  q('wood',B(1,1,2.8),M(0,.5,0),0x8a5a32);q('wood',B(1.2,.08,3),M(.05,1.02,0),0xc89a60);for(const sx of[-.45,.45])for(const sz of[-1.35,1.35])q('wood',B(.1,2.6,.1),M(sx,1.3,sz),0x5a3a24);q('wood',B(1.3,.1,3.1),M(0,2.6,0),0x5a3a24);sb.flush(g);
  const aw=new THREE.Mesh(new THREE.PlaneGeometry(1.6,3.2).rotateX(-Math.PI/2).translate(.8,0,0),new THREE.MeshStandardMaterial({map:awTex,side:THREE.DoubleSide,roughness:.9}));aw.position.set(.5,2.6,0);aw.castShadow=true;g.add(aw);
  const roll=new THREE.Mesh(C(.12,.12,3.2,10).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({map:awTex,roughness:.9}));roll.position.set(.55,2.55,0);g.add(roll);
  const sh=new THREE.Mesh(B(.08,1.5,2.8),MT.wood);sh.position.set(.55,1.8,0);sh.castShadow=true;g.add(sh);
  const goods=new THREE.Group();goods.position.y=1.06;g.add(goods);
  if(kind==='dumpling'){for(let i=0;i<3;i++)for(let k=0;k<2;k++){const st=new THREE.Mesh(C(.28,.28,.16,14),mat(0xc8a060,{r:.8}));st.position.set(-.1,.08+k*.17,-.9+i*.9);goods.add(st);}const pot=new THREE.Mesh(C(.35,.3,.4,14),mat(0x4a4a50,{m:.6,r:.4}));pot.position.set(-.2,.2,.9);goods.add(pot);}
  else if(kind==='mask'){const cs=[0xe85a4a,0x4ab0d8,0xf2c040,0xf2f2e8,0x8a5ad8];for(let i=0;i<5;i++){const mk=new THREE.Mesh(C(.22,.22,.05,14).rotateZ(Math.PI/2),mat(cs[i],{r:.6}));mk.position.set(-.35,.9+(i%2)*.35,-1.1+i*.55);goods.add(mk);for(const s of[-1,1]){const e=new THREE.Mesh(S(.04,6,4),mat(0x1a1a1a));e.position.set(.03,.05,s*.07);mk.add(e);}}}
  else{for(let i=0;i<4;i++){const f=new THREE.Mesh(S(.18,12,8),new THREE.MeshStandardMaterial({map:tex().fishScale,emissive:0xff6a20,emissiveIntensity:.8}));f.scale.set(1.5,1,1);f.position.set(.2,1.1-(i%2)*.2,-1+i*.66);goods.add(f);}}
  goods.scale.setScalar(.001);W.colliders.push({x:x,z:z-1,r:.9},{x:x,z:z,r:.9},{x:x,z:z+1,r:.9});
  const s={g,aw,roll,sh,goods,open:0,kind,x,z};W.stalls.push(s);return s;};
 stall(-5,13.6,0,T.aw[0],'dumpling');stall(5,19.5,Math.PI,T.aw[1],'mask');stall(5,-2.2,Math.PI,T.aw[2],'fish');
 /* ----- hanging signs (icons, no words) ----- */
 const sc=ctex(256,64,(x,w,h)=>{const cs=['#2a6a8a','#8a3a5a','#4a7a3a','#8a5a2a'];for(let i=0;i<4;i++){x.fillStyle=cs[i];x.fillRect(i*64+2,2,60,60);x.strokeStyle='#e8c070';x.lineWidth=3;x.strokeRect(i*64+6,6,52,52);x.fillStyle='#f2e6c8';x.beginPath();
   if(i===0){x.arc(i*64+32,34,14,0,6.283);x.fill();x.fillRect(i*64+29,14,6,8);}else if(i===1){x.arc(i*64+32,32,16,0,6.283);x.fill();x.fillStyle=cs[i];x.fillRect(i*64+24,26,5,5);x.fillRect(i*64+35,26,5,5);}else if(i===2){x.ellipse(i*64+30,32,16,9,0,0,6.283);x.fill();x.moveTo(i*64+44,32);x.lineTo(i*64+54,24);x.lineTo(i*64+54,40);x.fill();}else{x.fillRect(i*64+20,18,24,28);}}},{clamp:true});
 for(const sg of signs){const t=sg.T0.clone().multiply(M(.7,3.6,sg.dz));const g=new THREE.PlaneGeometry(.9,.9);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setX(k,(sg.i+uv.getX(k))/4);
  const mm=new THREE.Mesh(g.rotateY(Math.PI/2),new THREE.MeshStandardMaterial({map:sc,side:THREE.DoubleSide,roughness:.8}));mm.applyMatrix4(t);root.add(mm);P('wood',B(.8,.06,.06),sg.T0.clone().multiply(M(.4,4.1,sg.dz)),0x2a2220);}
 /* ----- flush static ----- */
 add.flush(root);
 /* ----- windows (lit instances) ----- */
 const wg=new THREE.PlaneGeometry(1,1).rotateY(Math.PI/2);W.win=litInstances(wg,wins.length,{glow:.75,dark:.05,r:.3});const wc=[0xffa850,0xffc070,0xff9a60,0xffd890];const cc=new THREE.Color();
 wins.forEach((w,i)=>{W.win.setMatrixAt(i,w.m);W.win.setColorAt(i,cc.set(wc[i%4]));W.win.lit(i,w.lit0?1:0);w.lit1=w.lit0||r()<.75;const p=new V3().setFromMatrixPosition(w.m);w.d=Math.hypot(p.x-LOFT.x,p.z-LOFT.z);});W.wins=wins;root.add(W.win);
 /* ----- lanterns: post lanterns, string lanterns over the street, stall lanterns; bulbs on the terrace ----- */
 const L=[];const LC=[0xff5a3a,0xff8a30,0xffc040,0xff6a7a];
 W.posts.forEach((p,i)=>L.push({x:p.x,y:p.y,z:p.z,s:1.15,c:LC[i%3],post:1,sway:r()*6}));
 const strings=[];for(let i=0;i<9;i++){const z0=27-i*6.4,z1=z0-3.2,a=new V3(-6.5,6.9,z0),b=new V3(6.5,6.9,z1);strings.push([a,b]);for(let k=1;k<=6;k++){const t=k/7,p=a.clone().lerp(b,t);p.y-=Math.sin(t*Math.PI)*1.1+.35;L.push({x:p.x,y:p.y,z:p.z,s:.72,c:LC[(i+k)%4],sway:r()*6});}}
 W.stalls.forEach(s=>L.push({x:s.x+(s.x<0?.9:-.9),y:2.35,z:s.z,s:1,c:0xffb040,stall:1,sway:r()*6}));
 for(const[x,z]of[[-7,-32],[0,-37],[-12,-30]])L.push({x,y:3.6,z,s:1.2,c:LC[2],sway:r()*6});
 const lg=new THREE.SphereGeometry(.28,14,10);lg.scale(1,1.15,1);W.lan=litInstances(lg,L.length,{glow:1.55,dark:.03,r:.7});
 L.forEach((l,i)=>{l.d=Math.hypot(l.x-LOFT.x,l.z-LOFT.z)+(l.y<3?0:2);W.lan.setMatrixAt(i,M(l.x,l.y,l.z,0,0,0,l.s));W.lan.setColorAt(i,cc.set(l.c));W.lan.lit(i,0);});W.L=L;root.add(W.lan);
 // caps & strings
 { const cb=bucket();for(const l of L){cb(MT.dark,C(.12*l.s,.16*l.s,.08,8),M(l.x,l.y+.33*l.s,l.z),0x2a2018);cb(MT.dark,C(.13*l.s,.1*l.s,.06,8),M(l.x,l.y-.33*l.s,l.z),0x2a2018);}cb.flush(root,{cast:false});
  const pts=[];for(const[a,b]of strings){let prev=a;for(let k=1;k<=24;k++){const t=k/24,p=a.clone().lerp(b,t);p.y-=Math.sin(t*Math.PI)*1.1;pts.push(prev,p);prev=p;}}
  for(let i=0;i<poles.length;i++){const[a0,b0]=[poles[i],poles[(i+1)%poles.length]];const a=new V3(a0[0],Y+3.3,a0[1]),b=new V3(b0[0],Y+3.3,b0[1]);let prev=a;for(let k=1;k<=16;k++){const t=k/16,p=a.clone().lerp(b,t);p.y-=Math.sin(t*Math.PI)*.8;pts.push(prev,p);prev=p;}}
  const lgeo=new THREE.BufferGeometry().setFromPoints(pts);root.add(new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({color:0x1a1410})));}
 const BL=[];for(let i=0;i<poles.length;i++){const[a0,b0]=[poles[i],poles[(i+1)%poles.length]];for(let k=1;k<10;k++){const t=k/10;BL.push({x:lerp(a0[0],b0[0],t),y:Y+3.3-Math.sin(t*Math.PI)*.8-.12,z:lerp(a0[1],b0[1],t)});}}
 // workshop string lights (always on)
 for(let k=0;k<12;k++){const t=k/11;BL.push({x:6.6,y:3.2-Math.sin(t*Math.PI)*.4,z:1.6+t*7.8,shop:1});}
 W.bulb=litInstances(new THREE.SphereGeometry(.07,8,6),BL.length,{glow:2.4,dark:.05});BL.forEach((b,i)=>{W.bulb.setMatrixAt(i,M(b.x,b.y,b.z));W.bulb.setColorAt(i,cc.set(b.shop?0xffd890:0xfff0a0));W.bulb.lit(i,b.shop?1:0);b.d=Math.hypot(b.x-LOFT.x,b.z-LOFT.z);});W.BL=BL;root.add(W.bulb);
 /* ----- glow pools on the ground ----- */
 const PL=[];W.posts.forEach((p,i)=>PL.push({x:p.x,y:.03,z:p.z,s:7,src:i}));W.stalls.forEach((s,k)=>PL.push({x:s.x+(s.x<0?1.6:-1.6),y:.03,z:s.z,s:6,src:14+9*6+k}));PL.push({x:8.4,y:.04,z:5.5,s:9,always:1});PL.push({x:LOFT.x,y:Y+.04,z:LOFT.z,s:12,deck:1});PL.push({x:-4.5,y:.04,z:-32,s:9,whale:1});
 W.pool=pools(PL.length);PL.forEach((p,i)=>{W.pool.setMatrixAt(i,M(p.x,p.y,p.z,0,0,0,p.s,1,p.s));W.pool.setA(i,p.always?1:0);});W.PL=PL;root.add(W.pool);
 /* ----- fire pit flames (terrace) ----- */
 const fm=new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});W.flames=[];for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.25,.9,8),fm);f.position.set(W.firePit.x+(i%2-.5)*.3,W.firePit.y+.25,W.firePit.z+((i>>1)-.5)*.3);f.visible=false;root.add(f);W.flames.push(f);}
 /* ----- the gloom knot ----- */
 const kn=new THREE.Group();kn.position.set(KNOT.x,1.1,KNOT.z);root.add(kn);const km=new THREE.MeshStandardMaterial({color:0x2a1840,roughness:.6,emissive:0x5a2a9a,emissiveIntensity:.5,flatShading:true});
 for(let i=0;i<9;i++){const s=new THREE.Mesh(ICO(.5+r()*.4,0),km);s.position.set((r()-.5)*1.4,(r()-.5)*1.3,(r()-.5)*1.1);s.rotation.set(r()*3,r()*3,0);s.castShadow=true;kn.add(s);}
 for(let i=0;i<10;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(.09,.9,5),km);const a=r()*6.28,b=r()*3;sp.position.set(Math.cos(a)*.8,Math.cos(b)*.7,Math.sin(a)*.6);sp.quaternion.setFromUnitVectors(new V3(0,1,0),sp.position.clone().normalize());kn.add(sp);}
 const ke=new THREE.MeshBasicMaterial({color:0xd8a0ff});for(const s of[-1,1]){const e=new THREE.Mesh(S(.09,8,6),ke);e.position.set(-.55,.2,s*.25);e.scale.set(.5,1,1.4);kn.add(e);}
 W.knot=kn;W.knotMat=km;
 /* ----- costume parts on the street ----- */
 W.partMesh={};{const cm=new THREE.MeshStandardMaterial({map:CT.card,roughness:.85}),sm=new THREE.MeshStandardMaterial({map:CT.stripes,roughness:.85});
  for(const k in PARTS){const[x,z]=PARTS[k].pos,g=new THREE.Group(),y=ground(x,z)??0;g.position.set(x,y,z);root.add(g);const h=new THREE.Group();h.position.y=.7;g.add(h);
   if(k==='helm'){h.add(new THREE.Mesh(B(.6,.5,.55),cm));const j=new THREE.Mesh(C(.15,.15,.22,12),new THREE.MeshStandardMaterial({color:0xfff2b0,emissive:0xffc040,emissiveIntensity:1,transparent:true,opacity:.9}));j.position.y=.36;h.add(j);}
   else if(k==='body'){const t=new THREE.Mesh(C(.34,.38,.95,16),sm);h.add(t);h.rotation.z=.25;}
   else{const s=new THREE.Mesh(C(.36,.36,.05,20),new THREE.MeshStandardMaterial({map:CT.emblem,roughness:.8}));s.rotation.x=Math.PI/2;h.add(s);}
   h.traverse(o=>{if(o.isMesh)o.castShadow=true;});const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.7,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));ring.position.y=.04;g.add(ring);
   W.partMesh[k]={g,h,ring};}}
 /* ----- sky: gradient dome, stars, moon ----- */
 const sky=new THREE.Mesh(new THREE.SphereGeometry(180,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 d=normalize(vP);float y=d.y;vec3 c=mix(vec3(.16,.09,.22),vec3(.05,.06,.16),smoothstep(0.,.5,y));c=mix(c,vec3(.02,.02,.06),smoothstep(.5,1.,y));c+=vec3(.35,.14,.1)*pow(max(0.,1.-abs(y)*4.),3.)*.6;vec2 g=floor(vec2(atan(d.z,d.x)*120.,y*120.));float s=step(.994,h(g))*smoothstep(.05,.3,y);gl_FragColor=vec4(c+s*vec3(.9,.9,1.),1.);}'}));
 sky.renderOrder=-1;scene.add(sky);W.sky=sky;
 const moon=new THREE.Mesh(new THREE.CircleGeometry(5,32),new THREE.MeshBasicMaterial({color:0xfff2d0,fog:false}));moon.position.set(-60,70,-120);moon.lookAt(0,0,0);scene.add(moon);
 const halo=new THREE.Mesh(new THREE.CircleGeometry(14,32),new THREE.MeshBasicMaterial({color:0x6a7aa0,transparent:true,opacity:.18,fog:false,depthWrite:false}));halo.position.copy(moon.position).multiplyScalar(1.01);halo.lookAt(0,0,0);scene.add(halo);
 W.restore=-1;return W;}

/* restoration state: r 0..1 (the relight wave from the loft out to the street). lit counts lit post lanterns */
export function setRestore(W,r){if(W.restore===r)return;W.restore=r;const R=r*70;// metres the wave has travelled
 W.L.forEach((l,i)=>W.lan.lit(i,sstep(0,4,R-l.d)));
 W.BL.forEach((b,i)=>{if(!b.shop)W.bulb.lit(i,sstep(0,3,R-b.d));});
 W.wins.forEach((w,i)=>W.win.lit(i,w.lit0?1:w.lit1?sstep(0,6,R-w.d-4):0));
 W.PL.forEach((p,i)=>{if(p.always)return;if(p.deck)W.pool.setA(i,sstep(0,3,R));else if(p.whale)W.pool.setA(i,sstep(0,4,R-50));else W.pool.setA(i,W.lan.litArr[p.src]||0);});
 W.stalls.forEach(s=>{s.target=sstep(0,5,R-Math.hypot(s.x-11.6,s.z+21)-2);});
 W.whaleM.emissiveIntensity=.02+sstep(0,4,R-48)*.55;W.flames.forEach(f=>f.visible=r>.02);}
export function litCount(W){let n=0;for(let i=0;i<14;i++)if(W.lan.litArr[i]>.5)n++;return n;}

/* per-frame animation */
export function updateWorld(W,dt,o){W.t+=dt;const t=W.t;
 for(const s of W.stalls){const tg=s.target||0;s.open+=(tg-s.open)*Math.min(1,dt*2.5);const k=s.open;s.sh.position.y=1.8+k*1.05;s.sh.scale.y=1-k*.85;s.aw.scale.x=.08+k*.92;s.aw.rotation.z=-.35*k;s.roll.position.x=.55+k*1.25;s.roll.position.y=2.55-k*.5;s.goods.scale.setScalar(Math.max(.001,k));}
 W.flames.forEach((f,i)=>{if(!f.visible)return;const k=1+Math.sin(t*13+i*2)*.2+Math.sin(t*7.3+i)*.15;f.scale.set(1,k,1);f.rotation.y=t*2+i;});
 // knot: pulse, shrink with beam progress, gone when open
 const kn=W.knot;if(kn.visible){const p=o.knot||0;kn.rotation.y+=dt*(.4+p*3);kn.scale.setScalar(Math.max(.05,(1-p*.75)*(1+Math.sin(t*3)*.05)));W.knotMat.emissiveIntensity=.5+p*2.5+Math.sin(t*5)*.15;kn.position.y=1.1+Math.sin(t*1.6)*.08;}
 for(const k in W.partMesh){const m=W.partMesh[k];if(!m.g.visible)continue;m.h.rotation.y=t*1.4;m.h.position.y=.7+Math.sin(t*2.4)*.12;m.ring.material.opacity=.35+Math.sin(t*3)*.2;}
 // float: bob and, during the parade, roll forward
 const pr=o.parade||0;W.whale.position.y=2.4+Math.sin(t*1.3)*.15*(1+pr*2);W.whale.rotation.z=Math.sin(t*1.1)*.05*(1+pr*3);W.float.position.x=-4.5+pr*4;
 if(o.bell>0){W.bell.rotation.z=Math.sin(t*12)*o.bell*.5;}else W.bell.rotation.z*=.9;
 // festival clock hands: 1 turn of the minute hand per remaining hour
 if(o.clockFrac!=null){W.clockHands[0].rotation.z=-o.clockFrac*Math.PI*2;W.clockHands[1].rotation.z=-(11+o.clockFrac)/12*Math.PI*2;}}
