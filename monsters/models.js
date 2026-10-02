// BLOCK BEASTS — procedural voxel/low-poly models: 24 creatures, people, capture cubes.
// Each model is a small rig of pivoted parts; every part's boxes are merged into one vertex-coloured mesh
// (plus an optional glowing mesh), so a creature is ~6-10 draw calls. Animations are procedural.
import * as THREE from '../vendor/three.module.min.js';

const C=new THREE.Color();
const E3=new THREE.Euler(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),Nn=new THREE.Vector3();
const FACE=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
class Builder{
 constructor(){this.parts=[{name:'root',parent:null,pv:[0,0,0],box:[],glow:[]}];this.map={root:this.parts[0]};}
 part(name,parent,x,y,z){const p={name,parent,pv:[x,y,z],box:[],glow:[]};this.parts.push(p);this.map[name]=p;return this;}
 // box centred at model-space (x,y,z); o.r = [rx,ry,rz] rotation about the box centre; o.g = glowing; o.flat = no bottom shading
 b(part,x,y,z,w,h,d,col,o={}){this.map[part][o.g?'glow':'box'].push({x,y,z,w,h,d,col,r:o.r,flat:o.flat||o.g});return this;}
 // mirrored pair on +/- x
 m(part,x,y,z,w,h,d,col,o={}){this.b(part,x,y,z,w,h,d,col,o);const r=o.r?[o.r[0],-o.r[1],-o.r[2]]:undefined;return this.b(part,-x,y,z,w,h,d,col,{...o,r});}
}
function geo(boxes,pv){if(!boxes.length)return null;const P=[],N=[],Cc=[],I=[];
 for(const bx of boxes){C.set(bx.col);const hw=bx.w/2,hh=bx.h/2,hd=bx.d/2;if(bx.r)Q.setFromEuler(E3.set(bx.r[0],bx.r[1],bx.r[2]));
  for(let f=0;f<6;f++){const n=FACE[f];const base=P.length/3;
   // 4 corners of the face
   const ax=f<2?[1,2]:f<4?[0,2]:[0,1];const corners=[[-1,-1],[1,-1],[-1,1],[1,1]];
   for(const[u,v]of corners){const c=[0,0,0];c[f>>1]=n[f>>1];c[ax[0]]=u;c[ax[1]]=v;V.set(c[0]*hw,c[1]*hh,c[2]*hd);if(bx.r)V.applyQuaternion(Q);
    P.push(V.x+bx.x-pv[0],V.y+bx.y-pv[1],V.z+bx.z-pv[2]);Nn.set(n[0],n[1],n[2]);if(bx.r)Nn.applyQuaternion(Q);N.push(Nn.x,Nn.y,Nn.z);
    const sh=bx.flat?1:(c[1]<0?.78:1)*(f===3?.7:1);Cc.push(C.r*sh,C.g*sh,C.b*sh);}
   // winding: ensure outward facing
   const a=base,b1=base+1,c1=base+2,d1=base+3;const e1=[P[b1*3]-P[a*3],P[b1*3+1]-P[a*3+1],P[b1*3+2]-P[a*3+2]],e2=[P[c1*3]-P[a*3],P[c1*3+1]-P[a*3+1],P[c1*3+2]-P[a*3+2]];
   const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const dot=cr[0]*N[a*3]+cr[1]*N[a*3+1]+cr[2]*N[a*3+2];
   if(dot>0)I.push(a,b1,c1,c1,b1,d1);else I.push(a,c1,b1,b1,c1,d1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setIndex(I);g.computeBoundingSphere();return g;}
function finish(B,kind,extra={}){const out=[];let minY=1e9,maxY=-1e9,maxR=0;
 for(const p of B.parts){const par=p.parent?B.map[p.parent]:null;const pos=par?[p.pv[0]-par.pv[0],p.pv[1]-par.pv[1],p.pv[2]-par.pv[2]]:[0,0,0];
  for(const bx of[...p.box,...p.glow]){minY=Math.min(minY,bx.y-bx.h/2);maxY=Math.max(maxY,bx.y+bx.h/2);maxR=Math.max(maxR,Math.hypot(bx.x,bx.z)+Math.max(bx.w,bx.d)/2);}
  out.push({name:p.name,parent:p.parent,pos,geo:geo(p.box,p.pv),ggeo:geo(p.glow,p.pv)});}
 return{kind,parts:out,h:maxY,r:Math.min(maxR,1.6),...extra};}

/* ---------- face helpers ---------- */
const EYE='#17121a';
function eyes(B,part,y,z,sx,s,o={}){const col=o.col||EYE;B.m(part,sx,y,z,s,s*(o.tall||1.15),.04,col,{g:o.glow});if(!o.glow&&!o.noShine)B.m(part,sx-s*.18,y+s*.22,z+.022,s*.34,s*.34,.02,'#ffffff',{g:1});return B;}

/* ---------- archetypes ---------- */
// quadruped. o: body [w,h,l], leg [w,h], head [w,h,d], col {b,u,h,l}, hy/hz head offset
function quad(o){const B=new Builder();const[bw,bh,bl]=o.body,[lw,lh]=o.leg,[hw,hh,hd]=o.head;const by=lh+bh/2;const c=o.col;
 B.part('body','root',0,by,0).b('body',0,by,0,bw,bh,bl,c.b);if(c.u)B.b('body',0,by-bh*.32,.0,bw*1.04,bh*.36,bl*.84,c.u);
 const lx=bw/2-lw/2-.01,lz=bl/2-lw/2-.02;[[lx,lz],[-lx,lz],[lx,-lz],[-lx,-lz]].forEach(([x,z],i)=>{B.part('l'+i,'body',x,lh+.02,z).b('l'+i,x,lh/2,z,lw,lh+.04,lw,c.l).b('l'+i,x,lh*.08,z+.01,lw*1.1,lh*.18,lw*1.18,c.p||c.l);});
 const ny=by+bh*.25,nz=bl/2-.02;const hy=by+bh/2+(o.hy??hh*.12),hz=bl/2+hd*.32+(o.hz||0);
 B.part('head','body',0,ny,nz).b('head',0,hy,hz,hw,hh,hd,c.h||c.b);
 B.part('tail','body',0,by+bh*.2,-bl/2);
 const A={B,by,bh,bl,bw,lh,hy,hz,hw,hh,hd,front:hz+hd/2,top:hy+hh/2,back:-bl/2};return A;}
function biped(o){const B=new Builder();const[bw,bh,bd]=o.body,[lw,lh]=o.leg,[hw,hh,hd]=o.head,[aw,ah]=o.arm;const by=lh+bh/2,c=o.col;
 B.part('body','root',0,lh,0).b('body',0,by,0,bw,bh,bd,c.b);if(c.u)B.b('body',0,by-bh*.05,bd*.06,bw*.7,bh*.7,bd*.96,c.u);
 const lx=bw/2-lw/2-.02;[lx,-lx].forEach((x,i)=>{B.part('l'+i,'root',x,lh,0).b('l'+i,x,lh/2,0,lw,lh,lw*1.05,c.l).b('l'+i,x,lh*.1,lw*.12,lw*1.1,lh*.2,lw*1.35,c.p||c.l);});
 const sx=bw/2+aw/2;[sx,-sx].forEach((x,i)=>{B.part('a'+i,'body',x,lh+bh*.88,0).b('a'+i,x,lh+bh*.88-ah/2,0,aw,ah,aw,c.a||c.b);});
 const hy=lh+bh+hh/2-(o.sink||0);B.part('head','body',0,lh+bh,0).b('head',0,hy,(o.hz||0),hw,hh,hd,c.h||c.b);
 B.part('tail','body',0,lh+bh*.25,-bd/2);
 return{B,by,lh,bh,bd,bw,hy,hw,hh,hd,front:(o.hz||0)+hd/2,top:hy+hh/2,aw,ah,sx};}
function bird(o){const B=new Builder();const[bw,bh,bl]=o.body,lh=o.leg||.1;const by=lh+bh/2,c=o.col;
 B.part('body','root',0,by,0).b('body',0,by,0,bw,bh,bl,c.b);if(c.u)B.b('body',0,by-bh*.12,bl*.08,bw*.8,bh*.7,bl*.9,c.u);
 [.12,-.12].forEach((x,i)=>{const X=x*bw/.4;B.part('l'+i,'root',X,lh,0).b('l'+i,X,lh/2,.02,.05,lh,.05,c.l||'#f0a030').b('l'+i,X,.02,.06,.1,.04,.14,c.l||'#f0a030');});
 const ww=o.wing||[.06,bh*.7,bl*.8];[1,-1].forEach((s,i)=>{const x=s*(bw/2+ww[0]/2);B.part('w'+i,'body',x-s*ww[0]/2,by+bh*.25,0).b('w'+i,x,by+bh*.25-ww[1]/2+.02,-.02,ww[0],ww[1],ww[2],c.w||c.b);});
 const hs=o.head||null;let hy=by+bh*.32,hz=bl/2;if(hs){hy=by+bh/2+hs[1]*.25;hz=bl/2+hs[2]*.2;B.part('head','body',0,by+bh*.3,bl/2-.02).b('head',0,hy,hz,hs[0],hs[1],hs[2],c.h||c.b);}else B.part('head','body',0,by,bl/2);
 B.part('tail','body',0,by,-bl/2);
 return{B,by,bh,bl,bw,lh,hy,hz,front:hs?hz+hs[2]/2:bl/2,hs,top:hs?hy+hs[1]/2:by+bh/2};}

/* ---------- species ---------- */
const SPEC={};
SPEC[1]=()=>{const A=quad({body:[.42,.32,.52],leg:[.12,.15],head:[.4,.34,.34],col:{b:'#d2522a',u:'#f2c48e',l:'#a8401f',p:'#7a2e14'}});const B=A.B;
 for(const y of[-.06,.06])B.b('body',0,A.by+y,0,A.bw+.012,.016,A.bl*.9,'#f0b48a',{flat:1});
 B.b('head',0,A.hy-.07,A.front+.04,.2,.12,.1,'#f2c48e').b('head',0,A.hy-.03,A.front+.095,.07,.05,.03,'#3a1a10');eyes(B,'head',A.hy+.05,A.front+.005,.1,.075);
 B.m('head',.14,A.top+.05,A.hz-.04,.1,.12,.07,'#8e3418',{r:[0,0,-.3]});
 B.b('tail',0,A.by+.06,A.back-.06,.09,.09,.14,'#a8401f',{r:[.6,0,0]}).part('fx','tail',0,A.by+.16,A.back-.12).b('fx',0,A.by+.17,A.back-.12,.15,.15,.15,'#ff9a26',{g:1}).b('fx',0,A.by+.27,A.back-.12,.08,.11,.08,'#fff07a',{g:1});
 return finish(B,'quad');};
SPEC[2]=()=>{const A=quad({body:[.55,.46,.95],leg:[.15,.42],head:[.42,.4,.46],hy:.08,col:{b:'#b8401e',u:'#f0b070',l:'#7a2a14',p:'#4a180c'}});const B=A.B;
 B.b('head',0,A.hy-.08,A.front+.07,.24,.16,.16,'#f0b070').b('head',0,A.hy-.03,A.front+.15,.08,.06,.03,'#2a100a');eyes(B,'head',A.hy+.07,A.front+.005,.11,.08);
 B.m('head',.15,A.top+.09,A.hz-.06,.1,.2,.08,'#7a2a14',{r:[0,0,-.2]});
 B.part('fx','body',0,A.by+A.bh/2,A.bl/2-.1);for(let i=0;i<7;i++){const a=(i/6-.5)*2.6;B.b('fx',Math.sin(a)*.3,A.by+A.bh/2+Math.cos(a)*.12+.04,A.bl/2-.12,.16,.22,.16,i%2?'#ffd040':'#ff7a1a',{g:1,r:[0,0,-a*.5]});}
 B.b('tail',0,A.by+.12,A.back-.16,.1,.1,.32,'#7a2a14',{r:[.7,0,0]}).b('tail',0,A.by+.3,A.back-.3,.18,.22,.18,'#ff8a20',{g:1}).b('tail',0,A.by+.42,A.back-.3,.1,.14,.1,'#fff07a',{g:1});
 return finish(B,'quad');};
SPEC[3]=()=>{const A=quad({body:[.85,.7,1.45],leg:[.24,.6],head:[.56,.5,.6],hy:.12,col:{b:'#3a2826',u:'#5a3a30',l:'#2a1c1a',p:'#1a1010'}});const B=A.B;
 for(let i=0;i<5;i++)B.b('body',(i%2?.12:-.12),A.by+A.bh/2+.005,-.5+i*.25,.08,.02,.2,'#ff6a10',{g:1});B.m('body',A.bw/2+.005,A.by,.1,.02,.06,.8,'#ff5a10',{g:1});
 B.b('head',0,A.hy-.1,A.front+.1,.32,.2,.22,'#2a1c1a').b('head',0,A.hy-.17,A.front+.12,.3,.04,.2,'#ff8a20',{g:1});eyes(B,'head',A.hy+.08,A.front+.005,.15,.08,{glow:1,col:'#ffe14a'});
 B.m('head',.2,A.top+.1,A.hz-.05,.1,.26,.1,'#e8d8c0',{r:[-.5,0,-.25]}).m('head',.24,A.top+.26,A.hz-.16,.08,.16,.08,'#f4eadc',{r:[-1.1,0,-.25]});
 B.part('fx','body',0,A.by+A.bh/2,A.bl/2-.1);for(let i=0;i<9;i++){const a=(i/8-.5)*2.8;B.b('fx',Math.sin(a)*.45,A.by+A.bh/2+Math.cos(a)*.18+.06,A.bl/2-.18,.22,.32,.22,i%2?'#ffd040':'#ff6a10',{g:1,r:[0,0,-a*.5]});}
 B.b('tail',0,A.by+.1,A.back-.25,.16,.16,.5,'#2a1c1a',{r:[.5,0,0]}).b('tail',0,A.by+.32,A.back-.52,.3,.36,.3,'#ff7a1a',{g:1}).b('tail',0,A.by+.52,A.back-.52,.16,.2,.16,'#fff07a',{g:1});
 return finish(B,'quad');};
SPEC[4]=()=>{const B=new Builder();const s=.52;B.part('body','root',0,0,0).b('body',0,s/2,0,s+.04,s*.92,s,'#4aa8ff').b('body',0,s*.34,s/2+.01,s*.72,s*.5,.04,'#c8ecff',{flat:1});
 B.part('head','body',0,s,0);B.m('head',.14,s*.95,.16,.16,.14,.16,'#4aa8ff');eyes(B,'head',s*.98,.245,.14,.09);
 B.b('body',0,s*.55,s/2+.012,.12,.03,.02,'#1a3a6a',{flat:1});for(const i of[0,1,2])B.m('body',s/2+.06,s*.62-i*.1,-.02-i*.04,.12,.05,.05,'#ff8ab8',{r:[0,0,-.4+i*.3]});
 B.part('tail','body',0,s*.4,-s/2).b('tail',0,s*.42,-s/2-.08,.04,.22,.18,'#7cc4ff');
 B.part('l0','root',.14,.05,.1).b('l0',.14,.03,.12,.14,.06,.16,'#2f7fd0').part('l1','root',-.14,.05,.1).b('l1',-.14,.03,.12,.14,.06,.16,'#2f7fd0');
 return finish(B,'blob');};
SPEC[5]=()=>{const A=biped({body:[.42,.52,.36],leg:[.13,.2],head:[.42,.36,.38],arm:[.11,.3],hz:.02,col:{b:'#3d7ee0',u:'#e8f4ff',l:'#2a5fb0',a:'#3d7ee0'}});const B=A.B;
 B.b('head',0,A.hy-.07,A.front+.04,.22,.14,.1,'#e8f4ff').b('head',0,A.hy-.04,A.front+.1,.07,.05,.03,'#16264a');eyes(B,'head',A.hy+.05,A.front+.005,.11,.075);
 B.b('head',0,A.top+.06,-.02,.04,.14,.28,'#8fd0ff').m('head',.2,A.hy+.12,0,.06,.1,.1,'#2a5fb0');
 B.b('tail',0,A.lh+.04,-A.bd/2-.24,.32,.05,.46,'#2a5fb0',{r:[-.25,0,0]});
 return finish(B,'biped');};
SPEC[6]=()=>{const A=quad({body:[1.0,.55,1.25],leg:[.3,.32],head:[.62,.46,.6],hy:-.02,col:{b:'#2a6ab8',u:'#d8ecff',l:'#1f4e8a'}});const B=A.B;
 B.b('body',0,A.by+A.bh/2+.12,-.05,1.1,.3,1.15,'#e0707a');for(let i=0;i<4;i++)B.b('body',(i%2?.25:-.25),A.by+A.bh/2+.3,-.4+i*.25,.16,.1+(i%2)*.08,.16,'#ffc8a0');
 B.b('body',0,A.by+A.bh/2+.42,-.1,.06,.36,.4,'#1f4e8a',{r:[-.3,0,0]});
 B.b('head',0,A.hy-.12,A.front+.02,.5,.08,.06,'#ffffff',{flat:1});eyes(B,'head',A.hy+.08,A.front+.005,.2,.09);B.b('head',0,A.top+.04,A.hz,.5,.06,.5,'#1f4e8a');
 B.b('tail',0,A.by,A.back-.2,.3,.2,.4,'#1f4e8a').b('tail',0,A.by+.1,A.back-.42,.06,.4,.24,'#2a6ab8');
 return finish(B,'quad');};
SPEC[7]=()=>{const A=quad({body:[.42,.2,.48],leg:[.13,.12],head:[.3,.28,.3],hy:-.04,col:{b:'#d8c088',l:'#c0a870'}});const B=A.B;
 B.b('body',0,A.by+.12,-.02,.54,.24,.58,'#6a9a3a').b('body',0,A.by+.02,-.02,.58,.06,.62,'#b8d070').b('body',0,A.by+.25,-.02,.3,.04,.3,'#88b84a');
 eyes(B,'head',A.hy+.03,A.front+.005,.08,.07);B.b('head',0,A.hy-.07,A.front+.005,.1,.02,.02,'#6a4a2a',{flat:1});
 B.part('fx','body',0,A.by+.26,-.02).b('fx',0,A.by+.34,-.02,.05,.16,.05,'#5aa83a').b('fx',.08,A.by+.43,-.02,.16,.04,.1,'#7ad84a',{r:[0,0,.4]}).b('fx',-.08,A.by+.45,-.02,.16,.04,.1,'#8ae85a',{r:[0,0,-.4]});
 B.b('tail',0,A.by,A.back-.04,.06,.06,.1,'#c0a870');
 return finish(B,'quad');};
SPEC[8]=()=>{const A=quad({body:[.62,.3,.8],leg:[.18,.22],head:[.38,.34,.38],hy:-.04,col:{b:'#c8b078',l:'#a89060'}});const B=A.B;
 B.b('body',0,A.by+.16,-.04,.8,.34,.9,'#5a8a34').b('body',0,A.by,-.04,.84,.08,.94,'#a8c060');
 for(const[x,y,z,s,c]of[[0,.42,-.05,.42,'#4f9a34'],[.2,.36,.15,.3,'#5aaa3a'],[-.22,.37,-.22,.32,'#468a2e'],[.15,.38,-.3,.26,'#5aaa3a'],[-.12,.52,.08,.24,'#62b440']])B.b('body',x,A.by+y,z,s,s*.8,s,c);
 for(const[x,z]of[[.18,.05],[-.2,-.1],[.05,-.34]])B.b('body',x,A.by+.6,z,.07,.07,.07,'#ff8ab8',{g:1});
 eyes(B,'head',A.hy+.04,A.front+.005,.1,.08);B.b('tail',0,A.by,A.back-.05,.08,.08,.12,'#a89060');
 return finish(B,'quad');};
SPEC[9]=()=>{const A=quad({body:[.95,.4,1.25],leg:[.3,.36],head:[.5,.44,.5],hy:-.06,col:{b:'#a89060',l:'#8a7448'}});const B=A.B;
 B.b('body',0,A.by+.24,-.05,1.2,.5,1.35,'#4a6a2a').b('body',0,A.by,-.05,1.26,.1,1.4,'#7a9a48');for(let i=0;i<6;i++)B.b('body',(hashf(i)-.5)*.9,A.by+.5,(hashf(i+9)-.5)*1.1,.22,.06,.22,'#6aa040');
 B.b('body',0,A.by+.95,-.1,.22,.9,.22,'#6a4a2a').b('body',.15,A.by+1.2,-.1,.3,.08,.08,'#6a4a2a',{r:[0,0,.5]});
 for(const[x,y,z,s,c]of[[0,1.55,-.1,1.0,'#3f8a2c'],[.32,1.35,.18,.6,'#4c9a34'],[-.35,1.4,-.3,.62,'#357a26'],[.05,1.9,-.05,.6,'#58a83c']])B.b('body',x,A.by+y,z,s,s*.6,s,c);
 for(const[x,z]of[[.3,.2],[-.25,-.4],[.1,.35]])B.b('body',x,A.by+1.88,z,.08,.08,.08,'#fff07a',{g:1});
 eyes(B,'head',A.hy+.05,A.front+.005,.13,.09);B.b('head',0,A.hy-.12,A.front+.005,.18,.03,.02,'#4a3220',{flat:1});
 return finish(B,'quad');};
function hashf(i){const x=Math.sin(i*127.1+11.7)*43758.5453;return x-Math.floor(x);}
SPEC[10]=()=>{const A=quad({body:[.32,.26,.4],leg:[.1,.1],head:[.34,.3,.3],hy:.04,col:{b:'#ffd23a',u:'#fff8e0',l:'#e0a820'}});const B=A.B;
 eyes(B,'head',A.hy+.03,A.front+.005,.085,.075);B.m('head',.13,A.hy-.06,A.front+.005,.06,.05,.02,'#ff8a4a',{flat:1});
 B.m('head',.1,A.top+.11,A.hz-.04,.03,.22,.03,'#3a3020',{r:[0,0,-.25]});B.part('fx','head',0,A.top+.22,A.hz-.04).m('fx',.13,A.top+.24,A.hz-.04,.08,.08,.08,'#fff27a',{g:1});
 B.m('head',.16,A.top+.02,A.hz,.1,.08,.06,'#e0a820');
 B.b('tail',0,A.by+.06,A.back-.06,.06,.06,.12,'#e0a820').b('tail',0,A.by+.14,A.back-.12,.06,.12,.06,'#e0a820').b('tail',0,A.by+.22,A.back-.08,.1,.08,.08,'#e0a820');
 return finish(B,'quad');};
SPEC[11]=()=>{const A=quad({body:[.4,.34,.78],leg:[.11,.36],head:[.36,.32,.4],hy:.1,col:{b:'#f2b51e',u:'#fff4dc',l:'#c88a10',p:'#2a2018'}});const B=A.B;
 B.b('head',0,A.hy-.07,A.front+.06,.16,.12,.14,'#fff4dc').b('head',0,A.hy-.04,A.front+.13,.06,.05,.03,'#1a1410');eyes(B,'head',A.hy+.06,A.front+.005,.1,.07);
 B.m('head',.11,A.top+.14,A.hz-.04,.1,.26,.06,'#f2b51e',{r:[0,0,-.12]}).m('head',.12,A.top+.25,A.hz-.04,.07,.07,.065,'#2a2018');B.m('head',.16,A.hy-.06,A.front-.02,.06,.06,.02,'#ffe060',{g:1});
 B.b('tail',0,A.by+.08,A.back-.12,.12,.12,.24,'#f2b51e',{r:[.6,0,0]}).b('tail',.06,A.by+.24,A.back-.2,.14,.2,.12,'#f2b51e',{r:[0,0,.6]}).b('tail',-.04,A.by+.42,A.back-.22,.14,.2,.12,'#f2b51e',{r:[0,0,-.6]}).b('tail',.02,A.by+.58,A.back-.22,.12,.14,.1,'#fff6a0',{g:1});
 return finish(B,'quad');};
SPEC[12]=()=>{const A=quad({body:[.65,.55,1.15],leg:[.18,.48],head:[.46,.4,.56],hy:.14,col:{b:'#3a4a7a',u:'#e8d890',l:'#2a3560'}});const B=A.B;
 for(let i=0;i<5;i++)B.b('body',0,A.by+A.bh/2+.08-Math.abs(i-2)*.02,.4-i*.22,.06,.18,.14,'#ffe14a',{g:1,r:[-.3,0,0]});
 B.b('head',0,A.hy-.08,A.front+.08,.3,.16,.18,'#3a4a7a');eyes(B,'head',A.hy+.07,A.front+.005,.13,.08,{glow:1,col:'#fff27a'});B.m('head',.16,A.top+.12,A.hz-.12,.07,.26,.07,'#ffd23a',{r:[-.7,0,-.2]});
 B.part('w0','body',A.bw/2,A.by+A.bh/2,.1).b('w0',A.bw/2+.36,A.by+A.bh/2+.06,.05,.7,.04,.62,'#4a5aa0').b('w0',A.bw/2+.36,A.by+A.bh/2+.1,.34,.72,.06,.06,'#ffd23a');
 B.part('w1','body',-A.bw/2,A.by+A.bh/2,.1).b('w1',-A.bw/2-.36,A.by+A.bh/2+.06,.05,.7,.04,.62,'#4a5aa0').b('w1',-A.bw/2-.36,A.by+A.bh/2+.1,.34,.72,.06,.06,'#ffd23a');
 B.b('tail',0,A.by+.02,A.back-.25,.22,.2,.5,'#3a4a7a',{r:[.25,0,0]}).b('tail',0,A.by-.1,A.back-.6,.14,.14,.4,'#3a4a7a',{r:[.1,0,0]}).b('tail',0,A.by-.08,A.back-.82,.06,.24,.16,'#ffe14a',{g:1});
 return finish(B,'quad',{wings:1});};
SPEC[13]=()=>{const B=new Builder();const s=.48;B.part('body','root',0,0,0).b('body',0,s*.45,0,s,s*.86,s*.96,'#8a8a90').b('body',0,s*.9,0,s*.84,.08,s*.8,'#6aa848').b('body',.1,s*.96,.06,.16,.06,.16,'#7ac058').b('body',-.17,s*.5,s*.4,.12,.1,.06,'#74747a');
 B.part('head','body',0,s*.7,s/2);B.m('head',.11,s*.62,s*.485,.1,.025,.03,EYE,{flat:1});B.b('head',0,s*.42,s*.485,.06,.04,.03,'#3a3a40',{flat:1});
 B.part('l0','root',.13,.05,0).b('l0',.13,.03,.04,.14,.07,.18,'#6a6a70').part('l1','root',-.13,.05,0).b('l1',-.13,.03,.04,.14,.07,.18,'#6a6a70');B.part('tail','body',0,.2,-s/2);
 return finish(B,'blob');};
SPEC[14]=()=>{const A=biped({body:[.75,.66,.56],leg:[.24,.26],head:[.4,.32,.36],arm:[.28,.56],sink:.06,hz:.1,col:{b:'#7a746c',l:'#5e5850',a:'#6e685f'}});const B=A.B;
 B.b('a0',A.sx,A.lh+A.bh*.88-A.ah-.08,.02,.36,.3,.36,'#5e5850').b('a1',-A.sx,A.lh+A.bh*.88-A.ah-.08,.02,.36,.3,.36,'#5e5850');B.b('body',.18,A.by+.2,A.bd/2,.18,.14,.04,'#6aa848').b('body',-.22,A.lh+A.bh+.01,-.05,.3,.04,.3,'#6aa848');
 eyes(B,'head',A.hy+.02,A.front+.005,.1,.07);B.b('head',0,A.hy-.09,A.front+.005,.16,.03,.02,'#3a3630',{flat:1});
 return finish(B,'biped');};
SPEC[15]=()=>{const A=biped({body:[.82,1.25,.6],leg:[.3,.5],head:[.52,.42,.48],arm:[.26,.95],col:{b:'#6a6e78',l:'#50545e',a:'#5c606a'}});const B=A.B;
 B.b('body',0,A.by+.18,A.bd/2+.02,.26,.3,.06,'#7af0ff',{g:1}).b('body',0,A.by+.18,A.bd/2,.36,.4,.04,'#40444c');
 B.m('body',.36,A.lh+A.bh+.08,0,.12,.26,.12,'#8af4ff',{g:1,r:[0,0,-.3]}).m('body',.3,A.lh+A.bh+.02,.14,.08,.16,.08,'#8af4ff',{g:1,r:[.3,0,-.2]});
 for(let i=0;i<4;i++)B.b('body',(i%2?.2:-.2),A.by-.3+i*.18,A.bd/2+.005,.18,.02,.02,'#50545e',{flat:1});
 eyes(B,'head',A.hy+.03,A.front+.005,.13,.07,{glow:1,col:'#7af0ff',tall:.6});
 return finish(B,'biped');};
SPEC[16]=()=>{const A=quad({body:[.42,.34,.46],leg:[.1,.08],head:[.36,.32,.32],hy:.02,col:{b:'#f4f8ff',l:'#dfe8f4'}});const B=A.B;
 eyes(B,'head',A.hy+.03,A.front+.005,.09,.08);B.b('head',0,A.hy-.06,A.front+.01,.06,.04,.03,'#ff9ab8');B.m('head',.13,A.hy-.07,A.front+.005,.05,.03,.02,'#ffc8dc',{flat:1});
 B.m('head',.09,A.top+.17,A.hz-.04,.08,.34,.05,'#aeeaff',{g:1,r:[0,0,-.12]});B.b('tail',0,A.by+.06,A.back-.06,.14,.14,.12,'#ffffff');
 return finish(B,'quad',{hop:1});};
SPEC[17]=()=>{const A=quad({body:[.5,.46,.95],leg:[.1,.62],head:[.3,.3,.4],hy:.45,hz:.12,col:{b:'#dff2ff',u:'#ffffff',l:'#bcd8f0',p:'#7aa0c8'}});const B=A.B;
 B.b('head',0,A.by+.42,A.bl/2+.02,.2,.5,.18,'#dff2ff',{r:[.35,0,0]}).b('head',0,A.by+.42,A.bl/2+.06,.22,.44,.08,'#ffffff',{r:[.35,0,0]});
 eyes(B,'head',A.hy+.03,A.front+.005,.09,.07);B.b('head',0,A.hy-.06,A.front+.01,.08,.05,.03,'#5a7aa0');
 B.part('fx','head',0,A.top,A.hz-.05);for(const s of[1,-1]){B.b('fx',s*.1,A.top+.14,A.hz-.06,.05,.28,.05,'#9ff0ff',{g:1,r:[0,0,-s*.35]}).b('fx',s*.22,A.top+.26,A.hz-.06,.04,.2,.04,'#9ff0ff',{g:1,r:[0,0,-s*.9]}).b('fx',s*.12,A.top+.34,A.hz-.02,.04,.18,.04,'#c8f8ff',{g:1,r:[-.4,0,-s*.2]});}
 B.b('tail',0,A.by+.12,A.back-.06,.12,.16,.1,'#ffffff');
 return finish(B,'quad');};
SPEC[18]=()=>{const A=bird({body:[.4,.38,.42],leg:.08,col:{b:'#8cc8ff',u:'#ffffff',w:'#5aa0e8'}});const B=A.B;
 eyes(B,'head',A.by+.08,A.bl/2+.005,.1,.08);B.b('head',0,A.by,A.bl/2+.05,.1,.07,.1,'#ffb030');B.b('head',0,A.by+A.bh/2+.06,.04,.05,.12,.12,'#5aa0e8',{r:[-.5,0,0]});
 B.b('tail',0,A.by+.04,-A.bl/2-.06,.18,.04,.14,'#5aa0e8',{r:[-.4,0,0]});
 return finish(B,'bird');};
SPEC[19]=()=>{const A=bird({body:[.48,.5,.62],leg:.16,head:[.34,.32,.34],wing:[.07,.4,.56],col:{b:'#4a7ad0',u:'#f0f4ff',w:'#3a64b8'}});const B=A.B;
 eyes(B,'head',A.hy+.04,A.front+.005,.09,.07);B.b('head',0,A.hy-.04,A.front+.06,.1,.08,.14,'#f0c040');
 for(let i=0;i<3;i++)B.b('head',0,A.hy+A.hs[1]/2+.08,-.02-i*.08,.04,.2-i*.03,.08,i?'#c8d8ff':'#e8f0ff',{r:[-.7-i*.2,0,0]});
 B.b('tail',0,A.by-.02,-A.bl/2-.14,.24,.04,.3,'#3a64b8',{r:[-.3,0,0]}).b('tail',0,A.by-.04,-A.bl/2-.2,.12,.03,.26,'#e8f0ff',{r:[-.3,0,0]});
 return finish(B,'bird');};
SPEC[20]=()=>{const A=bird({body:[.7,.7,.95],leg:.28,head:[.46,.42,.46],wing:[.09,.6,.86],col:{b:'#28406a',u:'#e8eef8',w:'#22385e',l:'#e0b040'}});const B=A.B;
 B.b('w0',A.bw/2+.05,A.by+A.bh*.25-.62,-.02,.1,.12,.8,'#e8eef8').b('w1',-A.bw/2-.05,A.by+A.bh*.25-.62,-.02,.1,.12,.8,'#e8eef8');
 eyes(B,'head',A.hy+.05,A.front+.005,.12,.08,{glow:1,col:'#ffe14a'});B.b('head',0,A.hy-.05,A.front+.08,.14,.12,.18,'#f0c040').b('head',0,A.hy-.12,A.front+.15,.08,.08,.06,'#c89020');
 for(let i=0;i<4;i++)B.b('head',(i%2?.08:-.08),A.hy+A.hs[1]/2+.1,-.06-i*.08,.06,.28,.08,'#e8eef8',{r:[-.9,0,0]});
 B.b('tail',0,A.by-.1,-A.bl/2-.2,.4,.06,.46,'#22385e',{r:[-.25,0,0]}).b('tail',0,A.by-.12,-A.bl/2-.34,.3,.04,.3,'#e8eef8',{r:[-.25,0,0]});
 return finish(B,'bird');};
SPEC[21]=()=>{const A=quad({body:[.32,.28,.5],leg:[.09,.16],head:[.34,.3,.3],hy:.06,col:{b:'#2c2440',u:'#4a3a66',l:'#221a32'}});const B=A.B;
 eyes(B,'head',A.hy+.03,A.front+.005,.085,.085,{glow:1,col:'#c08aff'});B.b('head',0,A.hy-.07,A.front+.005,.04,.03,.02,'#ff9ad8');
 B.m('head',.11,A.top+.07,A.hz-.02,.1,.14,.06,'#2c2440',{r:[0,0,-.2]}).m('head',.11,A.top+.07,A.hz+.01,.05,.08,.02,'#7a5aaa');
 B.b('tail',0,A.by+.1,A.back-.1,.06,.06,.22,'#2c2440',{r:[.9,0,0]}).b('tail',0,A.by+.3,A.back-.16,.06,.24,.06,'#2c2440').b('tail',0,A.by+.44,A.back-.1,.06,.06,.14,'#a274ff',{g:1});
 return finish(B,'quad');};
SPEC[22]=()=>{const A=quad({body:[.55,.46,1.05],leg:[.15,.42],head:[.44,.38,.42],hy:.08,col:{b:'#1e1a2e',u:'#2a2440',l:'#16121f'}});const B=A.B;
 for(let i=0;i<4;i++){B.m('body',A.bw/2+.005,A.by+.04,.3-i*.22,.02,.24,.05,'#a274ff',{g:1,r:[.4,0,0]});B.b('body',0,A.by+A.bh/2+.005,.3-i*.22,.24,.02,.05,'#8a5aff',{g:1});}
 eyes(B,'head',A.hy+.04,A.front+.005,.11,.08,{glow:1,col:'#d8a8ff',tall:.7});B.b('head',0,A.hy-.06,A.front+.04,.22,.14,.1,'#1e1a2e');
 B.m('head',.15,A.top+.08,A.hz-.04,.1,.16,.06,'#1e1a2e',{r:[0,0,-.25]});
 B.b('tail',0,A.by+.08,A.back-.2,.08,.08,.44,'#1e1a2e',{r:[.5,0,0]}).b('tail',0,A.by+.32,A.back-.38,.08,.08,.22,'#1e1a2e',{r:[1.2,0,0]}).b('tail',0,A.by+.42,A.back-.44,.1,.1,.1,'#a274ff',{g:1});
 return finish(B,'quad');};
SPEC[23]=()=>{const B=new Builder();const by=.24;B.part('body','root',0,by,0).b('body',0,by,0,.62,.22,.5,'#d86a3a').b('body',0,by+.16,-.02,.5,.14,.4,'#ffb030',{g:1}).b('body',0,by+.25,-.02,.3,.06,.24,'#ffe07a',{g:1}).b('body',0,by+.1,-.02,.58,.04,.46,'#a84a24');
 B.part('head','body',0,by+.1,.25);for(const s of[1,-1]){B.b('head',s*.12,by+.2,.24,.04,.16,.04,'#a84a24').b('head',s*.12,by+.3,.24,.08,.08,.08,EYE).b('head',s*.12-.015,by+.32,.285,.03,.03,.02,'#fff',{g:1});}
 for(let i=0;i<3;i++)for(const s of[1,-1]){const n=i*2+(s>0?0:1);B.part('l'+n,'body',s*.3,by,.12-i*.15).b('l'+n,s*.4,by-.1,.12-i*.15,.2,.05,.05,'#c85a2e',{r:[0,0,s*.7]});}
 for(const[s,n]of[[1,0],[-1,1]]){B.part('a'+n,'body',s*.28,by,.24).b('a'+n,s*.34,by+.02,.36,.08,.08,.2,'#d86a3a').b('a'+n,s*.36,by+.06,.52,.22,.16,.2,'#e07a40').b('a'+n,s*.36,by+.16,.58,.18,.06,.1,'#f09060');}
 B.part('tail','body',0,by,-.25);
 return finish(B,'crab');};
SPEC[24]=()=>{const B=new Builder();const by=.7;B.part('body','root',0,by,0).b('body',0,by,-.06,.2,.2,.42,'#d8c8a0').b('body',0,by+.04,.14,.3,.24,.14,'#ffffff');
 B.part('head','body',0,by,.2).b('head',0,by+.02,.27,.22,.2,.14,'#f2e6c8');eyes(B,'head',by+.04,.345,.07,.08,{noShine:0});
 B.m('head',.06,by+.2,.3,.03,.22,.03,'#e8d8a8',{r:[-.4,0,-.3]}).m('head',.12,by+.3,.36,.1,.08,.02,'#e8d8a8',{r:[-.4,0,-.3]});
 const wing=(n,s,z,len,wd)=>{B.part(n,'body',s*.1,by+.04,z).b(n,s*(.1+len/2),by+.05,z,len,.025,wd,'#5a4a8a').b(n,s*(.1+len*.55),by+.07,z,len*.3,.02,wd*.4,'#fff07a',{g:1}).b(n,s*(.1+len*.85),by+.07,z+wd*.25,len*.12,.02,wd*.2,'#ffc04a',{g:1});};
 wing('w0',1,.04,.62,.38);wing('w1',-1,.04,.62,.38);wing('w2',1,-.2,.46,.28);wing('w3',-1,-.2,.46,.28);
 B.part('tail','body',0,by,-.25);
 return finish(B,'moth');};

/* ---------- instancing + animation ---------- */
const TEMPL={};
export function template(id){return TEMPL[id]||(TEMPL[id]=SPEC[id]());}
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2),fog:true});
const baseMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:0});
function instance(T){const root=new THREE.Group();const mat=baseMat.clone();const gm=glowMat.clone();const parts={};
 for(const p of T.parts){let g;if(p.name==='root')g=root;else{g=new THREE.Group();g.position.set(...p.pos);(parts[p.parent]||root).add(g);}
  if(p.geo){const m=new THREE.Mesh(p.geo,mat);m.castShadow=true;m.receiveShadow=true;g.add(m);}if(p.ggeo){const m=new THREE.Mesh(p.ggeo,gm);g.add(m);}parts[p.name]=g;g.userData.rest=g.position.clone();}
 const inner=new THREE.Group();inner.add(root);// root animates inside inner (inner carries world transform)
 return{obj:inner,root,parts,mat,gm,kind:T.kind,h:T.h,r:T.r,t:Math.random()*10,ph:0,hop:T.hop,wings:T.wings,flash:0};}
export function makeCreature(id){const m=instance(template(id));m.id=id;return m;}
// speed: 0 idle .. 1 walk .. 2 run; air: flying/hovering
export function animate(m,dt,speed=0,air=false){m.t+=dt;const P=m.parts,t=m.t;const mv=Math.min(1,speed);m.ph+=dt*(5+speed*5)*(mv>.05?1:.0);const ph=m.ph;
 const sw=Math.sin(ph)*.7*mv;const breathe=1+Math.sin(t*2.2)*.025;
 if(P.body)P.body.scale.set(1,breathe,1);
 if(P.head){P.head.rotation.y=Math.sin(t*.7)*.25*(1-mv);P.head.rotation.x=Math.sin(t*1.3)*.06+(mv?Math.sin(ph*2)*.05:0);}
 if(P.tail)P.tail.rotation.y=Math.sin(t*(3+mv*4))*.35;
 if(P.fx){const s=1+Math.sin(t*17)*.08+Math.sin(t*29)*.05;P.fx.scale.set(s,1+Math.sin(t*13)*.12,s);}
 const root=m.root;root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.set(1,1,1);
 if(m.kind==='quad'){[0,1,2,3].forEach(i=>{if(P['l'+i])P['l'+i].rotation.x=(i===0||i===3?sw:-sw);});if(P.body)P.body.position.y=P.body.userData.rest.y+Math.abs(Math.sin(ph))*.03*mv;
  if(m.hop&&mv>.05){const h=Math.abs(Math.sin(ph*.8));root.position.y=h*.22;root.scale.set(1-h*.06,1+h*.1,1-h*.06);}
  if(m.wings){const a=air?Math.sin(t*9)*.6:.15+Math.sin(t*1.5)*.05;P.w0.rotation.z=a;P.w1.rotation.z=-a;}}
 else if(m.kind==='biped'){if(P.l0){P.l0.rotation.x=sw;P.l1.rotation.x=-sw;}if(P.a0){P.a0.rotation.x=-sw*.8+Math.sin(t*1.8)*.05;P.a1.rotation.x=sw*.8-Math.sin(t*1.8)*.05;}root.rotation.z=Math.sin(ph)*.04*mv;root.position.y=Math.abs(Math.cos(ph))*.03*mv;}
 else if(m.kind==='blob'){const h=mv>.05?Math.abs(Math.sin(ph*.9)):0;root.position.y=h*.25;const sq=mv>.05?(h<.2?(.2-h)*.6:0):Math.sin(t*2.5)*.03;root.scale.set(1+sq,1-sq*1.4+h*.08,1+sq);if(P.l0){P.l0.rotation.x=sw;P.l1.rotation.x=-sw;}}
 else if(m.kind==='bird'){const fl=air;const a=fl?Math.sin(t*13)*.75+.2:.08+Math.sin(t*2)*.04;if(P.w0){P.w0.rotation.z=a;P.w1.rotation.z=-a;}if(P.l0){P.l0.rotation.x=fl?.6:sw;P.l1.rotation.x=fl?.6:-sw;}if(!fl&&mv>.05)root.position.y=Math.abs(Math.sin(ph*1.2))*.06;if(fl)root.rotation.x=.12*mv;}
 else if(m.kind==='moth'){const a=Math.sin(t*16)*.6;['w0','w2'].forEach(k=>P[k].rotation.z=a+.15);['w1','w3'].forEach(k=>P[k].rotation.z=-a-.15);root.position.y=Math.sin(t*2.4)*.08;}
 else if(m.kind==='crab'){for(let i=0;i<6;i++)if(P['l'+i])P['l'+i].rotation.z=Math.sin(ph*1.5+i*1.3)*.3*mv+Math.sin(t*2+i)*.04;if(P.a0){P.a0.rotation.y=Math.sin(t*2)*.12;P.a1.rotation.y=-Math.sin(t*2)*.12;P.a0.rotation.x=-Math.max(0,Math.sin(t*3.1))*.2;P.a1.rotation.x=-Math.max(0,Math.sin(t*2.7+1))*.2;}root.rotation.y=0;}
 if(m.flash>0){m.flash-=dt;const f=Math.max(0,m.flash)*4;m.mat.emissive.setRGB(f,f,f);}else m.mat.emissive.setRGB(0,0,0);}

/* ---------- people ---------- */
export function makeHuman(o={}){const B=new Builder();const skin=o.skin||'#e8b890',shirt=o.shirt||'#3a6ab0',pants=o.pants||'#2a2f3a',shoe=o.shoe||'#2a1e18',hair=o.hair||'#3a2a1a';
 B.part('body','root',0,.68,0).b('body',0,.99,0,.5,.62,.28,shirt).b('body',0,.72,0,.52,.1,.3,o.belt||'#2a2420');
 if(o.coat)B.b('body',0,.86,0,.54,.86,.32,o.coat).b('body',0,1.1,.155,.18,.38,.02,shirt,{flat:1});
 if(o.cape)B.b('body',0,.9,-.18,.56,1.0,.05,o.cape);
 if(o.pack)B.b('body',0,1.0,-.2,.38,.44,.16,o.pack).b('body',0,1.18,-.2,.4,.08,.18,o.packTop||'#c86a2a');
 [.13,-.13].forEach((x,i)=>B.part('l'+i,'root',x,.68,0).b('l'+i,x,.36,0,.21,.62,.23,pants).b('l'+i,x,.05,.03,.22,.1,.28,shoe));
 [.34,-.34].forEach((x,i)=>B.part('a'+i,'body',x,1.25,0).b('a'+i,x,1.0,0,.17,.56,.19,o.sleeve||o.coat||shirt).b('a'+i,x,.68,0,.16,.12,.17,skin));
 B.part('head','body',0,1.3,0).b('head',0,1.54,0,.46,.46,.44,skin);eyes(B,'head',1.54,.225,.1,.06,{tall:1.4});B.b('head',0,1.45,.222,.12,.025,.02,'#a0605a',{flat:1});
 const hb=o.hat||'none',hc=o.hatCol||'#c84a2a';
 B.b('head',0,1.74,-.02,.5,.1,.48,hair).b('head',0,1.58,-.21,.5,.36,.06,hair);
 if(hb==='cap')B.b('head',0,1.81,-.02,.5,.12,.48,hc).b('head',0,1.77,.3,.44,.04,.2,hc);
 if(hb==='wide')B.b('head',0,1.8,0,.78,.04,.78,hc).b('head',0,1.88,0,.5,.14,.48,hc).b('head',0,1.82,0,.52,.04,.5,o.band||'#2a2420');
 if(hb==='beanie')B.b('head',0,1.82,-.01,.52,.16,.5,hc).b('head',0,1.95,-.01,.14,.1,.14,o.band||'#ffffff');
 if(hb==='hood')B.b('head',0,1.6,-.04,.54,.56,.5,hc).b('head',0,1.54,.21,.4,.36,.04,skin,{flat:1});
 if(hb==='crown')B.b('head',0,1.82,0,.5,.1,.48,hc,{g:1}).m('head',.18,1.92,.18,.08,.12,.08,hc,{g:1}).m('head',.18,1.92,-.18,.08,.12,.08,hc,{g:1});
 if(hb==='band')B.b('head',0,1.68,0,.48,.07,.46,hc);
 if(o.beard)B.b('head',0,1.39,.2,.4,.16,.06,o.beard);
 if(o.glasses)B.b('head',0,1.56,.235,.38,.06,.02,'#e0e8f0',{g:1});
 const T=finish(B,'human');const m=instance(T);return m;}
export function animHuman(m,dt,speed=0,o={}){m.t+=dt;const P=m.parts,t=m.t;const mv=Math.min(1,speed);m.ph+=dt*(6+speed*4)*(mv>.05?1:0);const sw=Math.sin(m.ph)*.8*mv;
 P.l0.rotation.x=sw;P.l1.rotation.x=-sw;P.a0.rotation.x=-sw*.9;P.a1.rotation.x=sw*.9;P.a0.rotation.z=.05+Math.sin(t*1.7)*.02;P.a1.rotation.z=-.05-Math.sin(t*1.7)*.02;
 P.body.position.y=P.body.userData.rest.y+Math.abs(Math.cos(m.ph))*.04*mv;P.body.scale.y=1+Math.sin(t*2)*.01;P.head.rotation.y=o.look??Math.sin(t*.5)*.2*(1-mv);
 if(o.throw>0){P.a0.rotation.x=-2.6+(1-o.throw)*3;}
 if(o.wave){P.a1.rotation.z=-2.6+Math.sin(t*10)*.3;P.a1.rotation.x=0;}
 if(o.ride){P.l0.rotation.x=P.l1.rotation.x=-1.2;P.l0.rotation.z=.35;P.l1.rotation.z=-.35;}
 if(m.flash>0){m.flash-=dt;}}

/* ---------- capture cubes ---------- */
export function makeCube(kind='cube'){const B=new Builder();const top=kind==='great'?'#8a5ad8':'#22b8ac',edge=kind==='great'?'#ffd23a':'#bffcff';const s=.3;
 B.b('root',0,-s*.25,0,s,s*.5,s,'#2a3040').b('root',0,s*.25,0,s,s*.5,s,top).b('root',0,0,0,s*1.04,.03,s*1.04,edge,{g:1}).b('root',0,0,s*.53,.08,.08,.02,edge,{g:1});
 for(const x of[-1,1])for(const z of[-1,1])B.b('root',x*s*.46,s*.46,z*s*.46,.04,.04,.04,edge,{g:1});
 const m=instance(finish(B,'cube'));return m;}
