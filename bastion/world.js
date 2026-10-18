// BASTION LINE — the diorama: a slab of vertex-coloured terrain with cut soil sides, textured roads laid along each path,
// rivers with timber bridges, snowy crags, ruined city blocks with braziers, instanced trees, rocks, reeds and grass,
// the keep at the road's end and the spawn gates where the roads enter.
import * as THREE from '../vendor/three.module.min.js';
import {rng,cl} from './util.js';
import {W,D,PATH_W,STEP,noise} from './map.js';
import {merge,keepModel,gateModel,MAT} from './models.js';

function canvasTex(n,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=c.height=n;draw(c.getContext('2d'),n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.anisotropy=8;return t;}
function roadTex(kind){return canvasTex(256,(x,n)=>{const r=rng(kind==='city'?5:kind==='snow'?7:9);
 const base=kind==='city'?'#8a8278':kind==='snow'?'#9a8a72':'#a08a64';x.fillStyle=base;x.fillRect(0,0,n,n);
 for(let i=0;i<2500;i++){const v=r()*40-20;x.fillStyle=`rgba(${v>0?255:0},${v>0?240:0},${v>0?220:0},${Math.abs(v)/200})`;x.fillRect(r()*n,r()*n,2+r()*4,2+r()*4);}
 const rows=kind==='city'?8:6;for(let j=0;j<rows;j++)for(let i=0;i<(kind==='city'?8:7);i++){if(kind!=='city'&&r()<.45)continue;const w=n/(kind==='city'?8:7),h=n/rows,px=i*w+(j%2)*w/2+(r()-.5)*4,py=j*h+(r()-.5)*4;
  const g=150+r()*50|0;x.fillStyle=kind==='city'?`rgb(${g-10},${g-14},${g-20})`:`rgb(${g},${g-14},${g-34})`;x.beginPath();x.roundRect?x.roundRect(px+2,py+2,w*(kind==='city'?.92:.6+r()*.3)-4,h*.85-4,6):x.rect(px+2,py+2,w*.8-4,h*.8-4);x.fill();
  x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,255,255,.12)';x.fillRect(px+4,py+3,w*.4,3);}
 // soft shoulders: alpha fades at the edges (u axis)
 const img=x.getImageData(0,0,n,n),d=img.data;for(let yy=0;yy<n;yy++)for(let xx=0;xx<n;xx++){const u=Math.abs(xx/n-.5)*2;const a=cl((1-u)/.18,0,1)*(.85+.15*Math.sin(yy*.2+xx*.05));d[(yy*n+xx)*4+3]=a*255;}x.putImageData(img,0,0);},[1,1]);}
export function buildWorld(scene,M,q){const out={objs:[],anim:[],fires:[],portals:[],water:null};const add=o=>{scene.add(o);out.objs.push(o);return o;};const Dm=M.D,r=rng(41+M.idx);
 const snow=!!Dm.snow,city=!!Dm.city,wet=M.water!=null;
 /* ---- terrain slab ---- */
 const SX=Math.round(W*2/(q>=1?.8:1.3)),SZ=Math.round(D*2/(q>=1?.8:1.3));const geo=new THREE.PlaneGeometry(W*2,D*2,SX,SZ);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=new Float32Array(pos.count*3);
 const c=new THREE.Color(),c2=new THREE.Color(),tint=new THREE.Color(Dm.tint);
 const grassA=new THREE.Color(snow?'#5a7a44':city?'#6e7258':'#4f8a3c').lerp(tint,.2),grassB=new THREE.Color(snow?'#8a9a5a':city?'#7a8a50':'#8aa850'),dirt=new THREE.Color(snow?'#7a6a52':city?'#5a524a':'#8a6a44'),
  rock=new THREE.Color('#8a8478'),snowC=new THREE.Color('#f2f4f8'),sand=new THREE.Color('#d8c890'),mud=new THREE.Color('#5a6a4a'),ash=new THREE.Color('#4a4440'),flag=new THREE.Color('#b0aa9c');
 const hs=new Float32Array(pos.count);
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);let h=M.height(x,z);if(Math.abs(x)>=W-.01||Math.abs(z)>=D-.01)h=Math.min(h,Math.max(h,0));pos.setY(i,h);hs[i]=h;
  const n=noise(x*.15,z*.15),n2=noise(x*.5+40,z*.5),n3=noise(x*1.7,z*1.7);c.copy(grassA).lerp(grassB,cl(n*1.6-.4,0,1));c.multiplyScalar(.88+n3*.22);
  if(noise(x*.09+90,z*.09)>.66)c.lerp(dirt,.45);
  if(city){if(n2>.48)c.lerp(ash,cl((n2-.48)*4,0,.7));const fx=Math.abs(((x%3)+3)%3-1.5),fz=Math.abs(((z%3)+3)%3-1.5);if(noise(x*.08+5,z*.08)>.42)c.lerp(flag,.7*(fx<1.42&&fz<1.42?1:.35));}
  if(h>1.3){c2.copy(rock).multiplyScalar(.75+n2*.4);c.lerp(c2,cl((h-1.3)/1.5,0,1));}
  if(snow&&h>3.2+n2*1.5)c.lerp(snowC,cl((h-3.2-n2*1.5)/1.2,0,1));if(snow)c.lerp(snowC,cl((noise(x*.07+3,z*.07)-.68)*3,0,.3));
  if(wet){const rd=M.riverD(x,z);if(rd<7)c.lerp(sand,cl((7-rd)/3,0,.75));if(rd<4.6)c.lerp(mud,cl((4.6-rd)/2,0,1));}
  const pd=M.pathD(x,z);if(pd<PATH_W+1.4)c.lerp(dirt,cl((PATH_W+1.4-pd)/1.2,0,.7)*(city?.4:1));
  col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
 geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
 const detail=canvasTex(256,(x,n)=>{const rr=rng(3);x.fillStyle='#d8d8d8';x.fillRect(0,0,n,n);for(let i=0;i<7000;i++){const v=170+rr()*85|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(rr()*n,rr()*n,1+rr()*2,1+rr()*2);}
  for(let i=0;i<500;i++){x.strokeStyle=`rgba(255,255,255,${rr()*.3})`;x.beginPath();const px=rr()*n,py=rr()*n;x.moveTo(px,py);x.lineTo(px+(rr()-.5)*4,py-2-rr()*4);x.stroke();}},[W/4,D/4]);
 const terrain=add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,map:detail})));terrain.receiveShadow=true;out.terrain=terrain;
 // soil sides of the slab: follow the edge heights down to a base
 {const P=[],Cc=[],I=[];const soil=[new THREE.Color(snow?'#6a5a4a':'#6a4a32'),new THREE.Color('#4a3424'),new THREE.Color('#2e241c')];const B=-7;
  const edge=(ax,az,bx,bz,n)=>{const base=P.length/3;for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;const h=Math.max(M.height(x,z),wet?-1.6:-9);
    for(const[y,cc]of[[h,0],[h-.6,0],[Math.min(h-.6,-1.6),1],[-3.8+noise(x*.3,z*.3)*.8,1],[-4.2,2],[B,2]]){P.push(x,y,z);const k=soil[cc];const v=.85+noise(x*.8,y*.8)*.3;Cc.push(k.r*v,k.g*v,k.b*v);}}
   for(let i=0;i<n;i++)for(let j=0;j<5;j++){const a=base+i*6+j,b=a+6;I.push(a,b,a+1,b,b+1,a+1);}};
  edge(-W,D,W,D,SX);edge(W,-D,-W,-D,SX);edge(W,D,W,-D,SZ);edge(-W,-D,-W,D,SZ);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setIndex(I);g.computeVertexNormals();
  const sides=add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})));sides.receiveShadow=true;
  const plate=add(new THREE.Mesh(new THREE.BoxGeometry(W*2+3,1.2,D*2+3),new THREE.MeshStandardMaterial({color:'#2a2622',roughness:.6,metalness:.2})));plate.position.y=B-.5;plate.receiveShadow=true;
  const trim=add(new THREE.Mesh(new THREE.BoxGeometry(W*2+3.4,.25,D*2+3.4),new THREE.MeshStandardMaterial({color:'#b08a4a',roughness:.35,metalness:.7})));trim.position.y=B+.12;}
 /* ---- water ---- */
 if(wet){const wU={uT:{value:0}};const wg=new THREE.PlaneGeometry(W*2,D*2,1,1);wg.rotateX(-Math.PI/2);
  const water=add(new THREE.Mesh(wg,new THREE.ShaderMaterial({uniforms:wU,transparent:true,depthWrite:false,
   vertexShader:'varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float uT;varying vec2 vW;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   void main(){vec2 p=vW*.35;float t=uT*.6;float w=n(p+vec2(t*.3,t*.5))*.6+n(p*2.3-vec2(t*.4,t*.2))*.4;vec3 c=mix(vec3(.1,.36,.42),vec3(.32,.62,.62),w*.6);c+=vec3(.9,1.,1.)*smoothstep(.78,.92,w)*.4;gl_FragColor=vec4(c,.82);}`})));
  water.position.y=M.water;water.renderOrder=1;out.water=wU;
  // water face on the slab sides
  const wf=new THREE.MeshStandardMaterial({color:'#2a6a7a',transparent:true,opacity:.55,roughness:.2});
  // bridges
  const bl=[];for(const b of M.bridges){const dx=b.bx-b.ax,dz=b.bz-b.az,len=Math.hypot(dx,dz)+1,yaw=Math.atan2(dx,dz),mx=(b.ax+b.bx)/2,mz=(b.az+b.bz)/2;
   const n=Math.ceil(len/.5);const ux=dx/Math.hypot(dx,dz),uz=dz/Math.hypot(dx,dz);
   for(let i=0;i<n;i++){const t=(i+.5)/n-.5;bl.push(['box',i%3?'#8a6a44':'#7a5a3a',[mx+ux*t*len,.18,mz+uz*t*len],[PATH_W*2+.8,.16,.44],[0,yaw,0]]);}
   for(const s of[-1,1]){const ox=uz*s*(PATH_W+.45),oz=-ux*s*(PATH_W+.45);bl.push(['box','#6a4a2a',[mx+ox,.75,mz+oz],[.14,.14,len],[0,yaw,0]]);
    for(let i=0;i<=Math.floor(len/1.6);i++){const t=i/Math.floor(len/1.6)-.5;bl.push(['box','#5a3a20',[mx+ox+ux*t*len,0,mz+oz+uz*t*len],[.22,1.7,.22],[0,yaw,0]]);}}}
  if(bl.length){const m=add(new THREE.Mesh(merge(bl),MAT.solid));m.castShadow=m.receiveShadow=true;}}
 /* ---- roads ---- */
 const rt=roadTex(city?'city':snow?'snow':'dirt');const rmat=new THREE.MeshStandardMaterial({map:rt,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 M.paths.forEach((P,pi)=>{const pp=[],uv=[],idx=[];const hw=PATH_W+.55;let v=0,k=0;
  for(let i=0;i<P.n;i++){const i0=Math.max(0,i-4),i1=Math.min(P.n-1,i+4);const tx=P.X[i1]-P.X[i0],tz=P.Z[i1]-P.Z[i0],l=Math.hypot(tx,tz)||1;const nx=-tz/l,nz=tx/l;
   // skip what an earlier path already paved (shared trunk)
   let dup=false;for(let o=0;o<pi;o++){const Q=M.paths[o];for(let j=0;j<Q.n;j+=2)if(Math.abs(Q.X[j]-P.X[i])<.3&&Math.abs(Q.Z[j]-P.Z[i])<.3){dup=true;break;}if(dup)break;}
   const onBridge=wet&&M.riverD(P.X[i],P.Z[i])<4.4;
   for(const s of[-1,1]){const x=P.X[i]+nx*hw*s,z=P.Z[i]+nz*hw*s;pp.push(x,Math.max(M.height(x,z),P.Y[i]-.3)+.06,z);uv.push(s<0?0:1,v);}
   if(i>0&&!dup&&!onBridge){const a=(i-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}v+=STEP/(hw*2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);const nn=new Float32Array(pp.length);for(let k=1;k<nn.length;k+=3)nn[k]=1;g.setAttribute('normal',new THREE.BufferAttribute(nn,3));
  const m=add(new THREE.Mesh(g,rmat));m.receiveShadow=true;m.renderOrder=0;});
 /* ---- scatter: trees, rocks, tufts, reeds ---- */
 const pines=[],leafy=[],dead=[],rocks=[],tufts=[],reeds=[],flowers=[];const step=q>=2?1.5:q>=1?1.9:2.6;
 for(let z=-D+1;z<D-.5;z+=step)for(let x=-W+1;x<W-.5;x+=step){const px=x+(r()-.5)*step,pz=z+(r()-.5)*step;if(Math.abs(px)>W-.6||Math.abs(pz)>D-.6)continue;const pd=M.pathD(px,pz);if(pd<PATH_W+1.2)continue;
  const h=M.height(px,pz),n=noise(px*.12+20,pz*.12);if(wet&&M.riverD(px,pz)<4.2){if(M.riverD(px,pz)>2.6&&r()<.5)reeds.push([px,h,pz,.7+r()*.5,r()*6]);continue;}if(city&&M.inBlock(px,pz,.3))continue;
  const edge=Math.max(Math.abs(px)/W,Math.abs(pz)/D);const dense=n>.64||edge>.93||h>2.2;
  if(dense&&r()<(city?.14:.3)&&pd>4.2){(city?dead:snow||r()<.5?pines:leafy).push([px,h-.1,pz,.8+r()*.7+(h>2?.2:0),r()*6]);continue;}
  if((h>1.6||r()<.04)&&r()<.5)rocks.push([px,h-.2,pz,.5+r()*1.2+cl(h*.15,0,1),r()*6]);
  else if(q>=1&&r()<.75)tufts.push([px,h,pz,.6+r()*.6,r()*6]);if(!city&&!snow&&r()<.05&&q>=1)flowers.push([px,h,pz,.7+r()*.4,r()*6]);}
 for(const[x,z,rr]of M.rocks)for(let i=0;i<5;i++){const a=r()*6.28,d=r()*rr*.8;rocks.push([x+Math.cos(a)*d,M.height(x+Math.cos(a)*d,z+Math.sin(a)*d)-.4,z+Math.sin(a)*d,1+r()*rr*.35,r()*6]);}
 const inst=(g,list,mat,shadow)=>{if(!list.length)return null;const m=new THREE.InstancedMesh(g,mat,list.length);const o=new THREE.Object3D(),cc=new THREE.Color();
  list.forEach((t,i)=>{o.position.set(t[0],t[1],t[2]);o.rotation.set(0,t[4],0);o.scale.setScalar(t[3]);o.updateMatrix();m.setMatrixAt(i,o.matrix);const v=.82+r()*.3;cc.setRGB(v,v*(.95+r()*.1),v*(.94+r()*.08));m.setColorAt(i,cc);});
  m.castShadow=shadow;m.receiveShadow=true;add(m);return m;};
 const pineG=merge([['cyl','#5a3a24',[0,.5,0],[.24,1,.24]],['cone',snow?'#2e5a3e':'#2e6a3a',[0,1.5,0],[1.7,1.6,1.7]],['cone',snow?'#3a6a48':'#3a7a44',[0,2.4,0],[1.3,1.4,1.3]],['cone',snow?'#e8eef4':'#4a8a4e',[0,3.2,0],[.8,1.1,.8]]]);
 const leafG=merge([['cyl','#5a3a24',[0,.7,0],[.26,1.4,.26]],['ico','#4a8a34',[0,2,0],[1.9,1.6,1.9]],['ico','#5a9a3a',[.4,2.6,.2],[1.2,1.1,1.2]],['ico','#3e7a2e',[-.4,2.3,-.3],[1.2,1,1.2]]]);
 const deadG=merge([['cyl','#3a2e28',[0,1,0],[.2,2,.2]],['cyl','#3a2e28',[.35,1.8,0],[.1,1,.1],[0,0,-.7]],['cyl','#3a2e28',[-.3,1.5,.1],[.08,.8,.08],[0,0,.8]]]);
 const rockG=merge([['dod','#8a8478',[0,.3,0],[1.2,.9,1]],['dod','#7a746a',[.4,.2,.3],[.6,.5,.6]]]);
 const tuftG=merge([['cone',city?'#7a7a50':'#5a8a3a',[0,.2,0],[.12,.45,.12],[0,0,.3]],['cone',city?'#8a8a5a':'#6a9a44',[.1,.2,.05],[.12,.4,.12],[0,0,-.3]],['cone',city?'#6a6a48':'#4a7a34',[-.05,.2,-.08],[.1,.5,.1],[.3,0,0]]]);
 const reedG=merge([['cyl','#7a8a4a',[0,.6,0],[.05,1.2,.05]],['cyl','#8a7a4a',[.15,.55,.05],[.05,1.1,.05],[0,0,.15]],['cap','#6a4a2a',[0,1.15,0],[.09,.12,.09]],['cyl','#7a8a4a',[-.12,.5,-.06],[.04,1,.04],[0,0,-.12]]]);
 const flowerG=merge([['sph','#f0e060',[0,.18,0],[.14,.14,.14]],['sph','#e07090',[.2,.15,.1],[.12,.12,.12]],['sph','#ffffff',[-.15,.15,.1],[.12,.12,.12]]]);
 inst(pineG,pines,MAT.solid,q>=1);inst(leafG,leafy,MAT.solid,q>=1);inst(deadG,dead,MAT.solid,q>=1);inst(rockG,rocks,MAT.solid,q>=1);inst(tuftG,tufts,MAT.solid,false);inst(reedG,reeds,MAT.solid,false);inst(flowerG,flowers,MAT.solid,false);
 /* ---- ruined city blocks ---- */
 if(city){const L=[],GL=[];for(const b of M.blocks){const h0=M.height(b.x,b.z),cs=Math.cos(b.rot),sn=Math.sin(b.rot);const P=(lx,lz)=>[b.x+lx*cs+lz*sn,b.z-lx*sn+lz*cs];
   const wall=(lx,lz,len,along)=>{const segs=Math.max(2,Math.round(len/1.2));for(let i=0;i<segs;i++){const t=(i+.5)/segs-.5;const hh=b.h*(b.ruin>.4?(.35+.65*noise(b.x+i*.7,b.z)):.9+.1*r());const[x,z]=P(lx+(along?t*len:0),lz+(along?0:t*len));
     L.push(['box',i%2?'#c8baa2':(b.ruin>.7?'#a89a86':'#b8a88e'),[x,h0+hh/2,z],[along?len/segs+.02:.4,hh,along?.4:len/segs+.02],[0,b.rot,0]]);if(hh>2.2&&i%2===0)L.push(['box','#2a2420',[x,h0+hh*.6,z],[along?.5:.44,.8,along?.44:.5],[0,b.rot,0]]);}};
   wall(0,-b.d/2,b.w,1);wall(0,b.d/2,b.w,1);wall(-b.w/2,0,b.d,0);wall(b.w/2,0,b.d,0);for(let i=0;i<4;i++){const[x,z]=P((r()-.5)*b.w*.8,(r()-.5)*b.d*.8);L.push(['dod',r()<.5?'#8a7e70':'#6a6058',[x,h0+.2,z],[.6+r()*.8,.5+r()*.5,.6+r()*.8]]);}
   if(b.ruin<.2){const[x,z]=P(0,0);L.push(['box','#7a4a3a',[x,h0+b.h*.86,z],[b.w*.9,.2,b.d*.9],[.12,b.rot,0]]);}
   for(const[cx,cz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const[x,z]=P(cx*b.w/2,cz*b.d/2);L.push(['box','#9a8c78',[x,h0+b.h*.5,z],[.6,b.h*(.6+r()*.5),.6],[0,b.rot,0]]);}}
  // braziers along the avenues
  for(const P of M.paths)for(let i=20;i<P.n-10;i+=34){const tx=P.X[i+1]-P.X[i],tz=P.Z[i+1]-P.Z[i],l=Math.hypot(tx,tz)||1;const x=P.X[i]-tz/l*(PATH_W+.9),z=P.Z[i]+tx/l*(PATH_W+.9);if(M.inBlock(x,z,.2))continue;const h=M.height(x,z);
   L.push(['cyl','#3a3430',[x,h+.5,z],[.2,1,.2]],['cyl','#4a4440',[x,h+1.05,z],[.6,.25,.6]]);GL.push(['cone','#ff9a30',[x,h+1.35,z],[.42,.6,.42]]);out.fires.push([x,h+1.5,z]);}
  // a broken fountain in the plaza
  L.push(['cyl','#9a9488',[4,.3,4],[3,.6,3]],['cyl','#7a8a9a',[4,.62,4],[2.6,.05,2.6]],['cyl','#9a9488',[4,1.2,4],[.5,1.6,.5]],['dod','#8a8478',[4.8,.8,3.6],[.6,.5,.6]]);
  if(L.length){const m=add(new THREE.Mesh(merge(L),MAT.solid));m.castShadow=m.receiveShadow=true;}if(GL.length)add(new THREE.Mesh(merge(GL),MAT.glow));}
 /* ---- snowy crags: extra boulders on the high ground, a frozen tarn ---- */
 if(snow){const L=[];for(let i=0;i<40;i++){const x=(r()-.5)*W*2,z=-D+r()*10;const h=M.height(x,z);if(h<2)continue;L.push(['dod',r()<.5?'#8a8a90':'#9a9aa0',[x,h,z],[1.5+r()*2.5,1+r()*2,1.5+r()*2]],['dod','#f0f4f8',[x,h+.9,z],[1+r()*1.5,.5,1+r()*1.5]]);}
  if(L.length){const m=add(new THREE.Mesh(merge(L),MAT.solid));m.castShadow=m.receiveShadow=true;}}
 /* ---- keep and gates ---- */
 for(const[i,e]of M.end.entries()){if(i>0&&Math.hypot(e[0]-M.end[0][0],e[1]-M.end[0][1])<3)continue;const k=keepModel();const P=M.paths[i];const yaw=Math.atan2(P.X[P.n-1]-P.X[P.n-8],P.Z[P.n-1]-P.Z[P.n-8]);
  k.position.set(e[0]-Math.sin(yaw)*1.5,M.height(e[0],e[1])-.2,e[1]-Math.cos(yaw)*1.5);k.rotation.y=yaw+Math.PI;k.scale.setScalar(.85);add(k);out.keep=k;}
 for(const[i,s]of M.start.entries()){const g=gateModel();const P=M.paths[i];const yaw=Math.atan2(P.X[6]-P.X[0],P.Z[6]-P.Z[0]);g.position.set(s[0]+Math.sin(yaw)*1.2,M.height(s[0],s[1])-.1,s[1]+Math.cos(yaw)*1.2);g.rotation.y=yaw;add(g);out.portals.push(g.userData.portal);}
 return out;}
