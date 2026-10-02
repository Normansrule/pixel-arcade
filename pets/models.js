// PET BRAWL — procedural low-poly pets (14 body plans + features), baked into a few vertex-coloured meshes each.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const GEO={sph:new THREE.IcosahedronGeometry(1,1),sph2:new THREE.IcosahedronGeometry(1,2),cyl:new THREE.CylinderGeometry(1,1,1,7),cone:new THREE.ConeGeometry(1,1,6),box:new THREE.BoxGeometry(1,1,1),tor:new THREE.TorusGeometry(1,.3,6,14),oct:new THREE.OctahedronGeometry(1,0)};
const MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0,flatShading:true});
const MATS=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:0,flatShading:false});
const C=c=>new THREE.Color(c);
// a part = [geo, pos, scale, rot, color, smooth?]
function part(g,geo,col,x,y,z,sx,sy=sx,sz=sx,rx=0,ry=0,rz=0,smooth){const m=new THREE.Mesh(GEO[geo]||geo,null);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.userData.c=C(col);m.userData.smooth=smooth;g.add(m);return m;}
function bake(g){// merge direct child meshes into one or two meshes (flat + smooth)
 const flat=[],smooth=[];for(const m of [...g.children])if(m.isMesh&&m.userData.c){(m.userData.smooth?smooth:flat).push(m);g.remove(m);}
 for(const[list,mat]of[[flat,MAT],[smooth,MATS]]){if(!list.length)continue;let n=0;const gs=list.map(m=>{m.updateMatrix();const q=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());q.applyMatrix4(m.matrix);n+=q.attributes.position.count;return[q,m.userData.c];});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;for(const[q,c]of gs){const k=q.attributes.position.count;pos.set(q.attributes.position.array,o*3);if(!q.attributes.normal)q.computeVertexNormals();nor.set(q.attributes.normal.array,o*3);for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}o+=k;q.dispose();}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeBoundingSphere();
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
 for(const c of g.children)if(c.isGroup)bake(c);}
function eyes(g,y,z,sep,r,o={}){for(const s of[-1,1]){part(g,'sph2','#ffffff',s*sep,y,z,r,r*1.1,r*.7,0,0,0,1);part(g,'sph2',o.col||'#14141a',s*sep,y+.005,z+r*.5,r*.62,r*.72,r*.4,0,0,0,1);part(g,'sph2','#ffffff',s*sep+r*.2,y+r*.3,z+r*.78,r*.2,r*.2,r*.15,0,0,0,1);}}
function grp(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
const dark='#2a2a30';

export function makePet(m){const s=m.s||1,root=new THREE.Group(),body=grp(root,0,0,0);const U={legs:[],wings:[],body,root,plan:m.b,s};
 const c=m.c,c2=m.c2;let head=null;
 const legsQuad=(h,spread,zf,zb,r=.09)=>{for(const[x,z]of[[-spread,zf],[spread,zf],[-spread,zb],[spread,zb]]){const L=grp(body,x*s,h*s,z*s);part(L,'cyl',c,0,-h*s/2,0,r*s,h*s,r*s);part(L,'sph',c2,0,-h*s,0,r*1.25*s,r*.8*s,r*1.4*s);U.legs.push(L);}};
 const tail=(type,y,z)=>{if(!type||type==='none')return;const T=grp(body,0,y*s,z*s);U.tail=T;
  if(type==='long')part(T,'cone',c,0,.05*s,-.3*s,.08*s,.65*s,.08*s,-1.9,0,0);
  else if(type==='fluffy'){part(T,'sph',c,0,.15*s,-.25*s,.17*s,.17*s,.32*s,-.6);part(T,'sph',c2,0,.3*s,-.48*s,.12*s);}
  else if(type==='stub')part(T,'sph',c2,0,0,-.05*s,.1*s);
  else if(type==='curl'){const t=part(T,'tor',c,0,.1*s,-.08*s,.09*s,.09*s,.09*s,0,Math.PI/2,0);}
  else if(type==='flat')part(T,'sph',c,0,-.05*s,-.3*s,.12*s,.05*s,.35*s,.3);};
 const ears=(type,hd,r)=>{if(!type||type==='none')return;
  if(type==='point'||type==='tuft')for(const sd of[-1,1]){part(hd,'cone',c,sd*r*.55,r*.95,-.02*s,.11*s,.26*s,.07*s,0,0,-sd*.3);part(hd,'cone',c2,sd*r*.55,r*.93,.01*s,.06*s,.15*s,.03*s,0,0,-sd*.3);}
  if(type==='round')for(const sd of[-1,1])part(hd,'sph',c,sd*r*.72,r*.78,-.02*s,.12*s,.12*s,.06*s);
  if(type==='long')for(const sd of[-1,1]){const e=grp(hd,sd*r*.35,r*.85,-.04*s);e.rotation.z=-sd*.15;part(e,'sph',c,0,.26*s,0,.08*s,.3*s,.05*s);part(e,'sph',c2,0,.26*s,.03*s,.05*s,.22*s,.02*s);(U.ears||(U.ears=[])).push(e);}
  if(type==='flop')for(const sd of[-1,1])part(hd,'sph',c2===dark?c:c,sd*r*.85,r*.35,0,.07*s,.2*s,.12*s,0,0,sd*.5);
  if(type==='horn')for(const sd of[-1,1]){part(hd,'cone','#f0e8d0',sd*r*.6,r*.85,-.02*s,.06*s,.28*s,.06*s,0,0,-sd*.7);}
  if(type==='antler')for(const sd of[-1,1]){const a=grp(hd,sd*r*.5,r*.9,0);a.rotation.z=-sd*.5;part(a,'cyl','#d8c0a0',0,.25*s,0,.035*s,.5*s,.035*s);part(a,'cyl','#d8c0a0',sd*.1*s,.4*s,0,.03*s,.3*s,.03*s,0,0,-sd*.9);part(a,'cyl','#d8c0a0',-sd*.05*s,.45*s,.05*s,.03*s,.25*s,.03*s,.5,0,sd*.5);}};
 // ---------------- body plans
 const plan=m.b;
 if(plan==='quad'||plan==='turtle'||plan==='frog'){const flat=m.flat?.65:1,len=(m.long?1.35:1)*(m.wide?1.1:1),wide=m.wide?1.25:1,hh=plan==='frog'?.18:m.flat?.2:.3,up=m.upright;
  const by=(hh+.32*flat)*s;
  if(up){part(body,'sph',c,0,by+.15*s,0,.3*s,.48*s,.3*s);part(body,'sph',c2,0,by+.1*s,.16*s,.2*s,.36*s,.16*s);}
  else if(m.wool){for(let i=0;i<9;i++){const a=i/9*Math.PI*2;part(body,'sph',c,Math.cos(a)*.22*s*wide,by+Math.sin(i*1.7)*.08*s,Math.sin(a)*.3*s*len,.24*s);}part(body,'sph',c,0,by+.1*s,0,.38*s*wide,.32*s,.48*s*len);}
  else{part(body,'sph',c,0,by,0,.4*s*wide,.34*s*flat,.55*s*len);part(body,'sph',c2,0,by-.1*s*flat,.08*s,.3*s*wide,.2*s*flat,.4*s*len);}
  if(plan==='turtle'){part(body,'sph',c2,0,by+.1*s,-.02*s,.48*s,.34*s,.58*s);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;part(body,'sph',c,Math.cos(a)*.27*s,by+.27*s,Math.sin(a)*.32*s-.02*s,.13*s,.06*s,.13*s);}part(body,'sph',c,0,by+.36*s,0,.14*s,.07*s,.14*s);}
  if(plan==='frog')legsQuad(.15,.3,.25,-.25,.11);else if(!up)legsQuad(hh,.24*wide,.3*len,-.3*len,m.wide?.12:.09);else legsQuad(.2,.14,.08,-.08,.08);
  const hy=up?by+.72*s:plan==='frog'?by+.18*s:by+.3*s,hz=up?.05*s:plan==='frog'?.28*s:(.48*len+.05)*s;head=grp(body,0,hy,hz);const hr=(plan==='frog'?.3:.29)*s;
  if(m.neck){head.position.y+=.45*s;head.position.z-=.08*s;part(body,'cyl',c,0,hy-.2*s,hz-.04*s,.12*s,.6*s,.12*s,.25);}
  part(head,'sph',c,0,0,0,hr*(plan==='frog'?1.3:1),hr*(plan==='frog'?.8:1),hr);
  if(plan==='frog'){eyes(head,hr*.62,hr*.35,hr*.62,.11*s);part(head,'tor','#c03a3a',0,-hr*.15,hr*.75,hr*.5,hr*.5,hr*.3,0,0,0);}
  else{const sn=(m.sn||.4)*s;part(head,'sph',c2,0,-hr*.25,hr*.75+sn*.25,hr*.5,hr*.42,sn*.7+.05*s);part(head,'sph',dark,0,-hr*.05,hr*.9+sn*.6,.05*s,.04*s,.04*s,0,0,0,1);
   if(m.snout)part(head,'cyl','#ff8aa8',0,-hr*.2,hr+sn*.35,.1*s,.06*s,.08*s,Math.PI/2);
   if(m.teethRow){part(head,'box',c,0,-hr*.25,hr+sn*.5,hr*.9,hr*.4,sn*1.6);for(let i=0;i<4;i++)for(const sd of[-1,1])part(head,'cone','#ffffff',sd*hr*.38,-hr*.48,hr+i*.12*s,.03*s,.07*s,.03*s,Math.PI);}
   eyes(head,hr*.25,hr*.72,hr*.42,.085*s,{});
   if(m.mask)part(head,'box',dark,0,hr*.25,hr*.6,hr*1.7,hr*.35,hr*.5);if(m.eyepatch)for(const sd of[-1,1])part(head,'sph',dark,sd*hr*.42,hr*.22,hr*.6,.1*s,.12*s,.08*s);
   if(m.teeth)part(head,'box','#ffffff',0,-hr*.62,hr*.95,.08*s,.1*s,.03*s);
   if(m.horn1){const uni=m.c2==='#ff9ae8';part(head,'cone',uni?'#ffd86a':'#f0ece0',0,hr*(uni?1.05:.25),hr*(uni?.3:1.2),.09*s,.5*s,.09*s,uni?.3:.9);}
   if(m.trunk){const t=grp(head,0,-hr*.2,hr*.9);part(t,'cyl',c,0,-.2*s,.1*s,.08*s,.5*s,.08*s,-.5);part(t,'cyl',c,0,-.45*s,.18*s,.065*s,.25*s,.065*s,-.1);U.trunk=t;}
   if(m.tusks)for(const sd of[-1,1])part(head,'cone','#fff8e0',sd*hr*.45,-hr*.55,hr*.9,.05*s,.38*s,.05*s,2.2);}
  ears(m.e,head,hr);
  if(m.mane){for(let i=0;i<10;i++){const a=i/10*Math.PI*2;part(head,'sph',c2,Math.cos(a)*hr*.95,Math.sin(a)*hr*.95,-hr*.25,hr*.4);}}
  if(m.crest)for(let i=0;i<3;i++)part(head,'cone',c2,0,hr*(.9+i*.05),-hr*(.1+i*.35),.06*s,.25*s,.06*s,-.4-i*.3);
  if(m.patch)part(body,'sph',c2,.1*s,by+.12*s,-.1*s,.3*s,.25*s,.35*s);
  if(m.stripes&&!m.wool)for(let i=-1;i<=1;i++)part(body,'box',c2,0,by+.2*s,i*.22*s*len,.62*s*wide,.08*s,.07*s,0,0,0);
  if(m.stripeTop)part(body,'sph',c2,0,by+.24*s,-.02*s,.18*s,.12*s,.55*s*len);
  if(m.spots)for(let i=0;i<6;i++)part(body,'sph',c2,(i%2?1:-1)*.28*s*wide,by+((i*7)%3)*.06*s,(i/3-1)*.28*s*len,.08*s,.08*s,.06*s);
  if(m.hump)part(body,'sph',c,0,by+.28*s,-.05*s,.25*s,.25*s,.3*s);
  if(m.quills)for(let i=0;i<18;i++){const a=(i%6)/5-.5,b=Math.floor(i/6);part(body,'cone','#4a3020',a*.55*s,by+.26*s+b*.05*s,(-.32+b*.22)*s,.07*s,.4*s,.07*s,-1.05+b*.15,0,a*1.1);}
  if(m.plates)for(let i=-2;i<=2;i++)part(body,'tor',c2,0,by,i*.15*s,.38*s,.36*s,.4*s,0,0,0);
  if(m.spikes)for(let i=0;i<5;i++)part(body,'cone',c2,0,by+.3*s,(.3-i*.18)*s*len,.06*s,.2*s,.06*s);
  if(m.batwings||m.dragonwings)for(const sd of[-1,1]){const w=grp(body,sd*.3*s,by+.22*s,0);const big=m.dragonwings?1.35:1;const wc=m.dragonwings?c2:c;part(w,'cone',wc,sd*.38*s*big,.08*s,-.05*s,.4*s*big,.05*s,.3*s*big,0,0,sd*.35);part(w,'cyl',dark,sd*.3*s*big,.12*s,-.05*s,.025*s,.6*s*big,.025*s,0,0,sd*(Math.PI/2-.35));U.wings.push(w);}
  tail(m.t,by,-.5*s*len);
 }
 else if(plan==='bird'){const up=m.upright,hl=m.legs?.55:.18,by=hl*s+.3*s;
  part(body,'sph',c,0,by+(up?.12*s:0),0,.34*s,(up?.46:.32)*s,(up?.3:.4)*s);part(body,'sph',c2,0,by-.04*s+(up?.08*s:0),.14*s,.24*s,(up?.36:.24)*s,.2*s);
  for(const sd of[-1,1]){const L=grp(body,sd*.12*s,hl*s,0);part(L,'cyl','#ffb030',0,-hl*s/2,0,.03*s,hl*s,.03*s);part(L,'sph','#ffb030',0,-hl*s,.06*s,.07*s,.03*s,.1*s);U.legs.push(L);}
  for(const sd of[-1,1]){const w=grp(body,sd*.32*s,by+.06*s,-.02*s);part(w,'sph',m.fan&&m.glow?c2:c,sd*.04*s,0,-.05*s,.07*s,.22*s,.3*s,.2,0,0);U.wings.push(w);}
  const hy=by+(up?.55:.38)*s+(m.neck?.35*s:0),hz=(up?.04:.22)*s;if(m.neck)part(body,'cyl',c,0,by+.3*s,.2*s,.07*s,.55*s,.07*s,.25);
  head=grp(body,0,hy,hz);const hr=(m.owl?.3:.22)*s;part(head,'sph',c,0,0,0,hr);
  if(m.owl){part(head,'sph',c2,0,0,hr*.6,hr*.85,hr*.75,hr*.4);eyes(head,hr*.1,hr*.85,hr*.38,.1*s);for(const sd of[-1,1])part(head,'cone',c,sd*hr*.6,hr*.9,0,.06*s,.18*s,.05*s,0,0,-sd*.4);part(head,'cone','#ffb030',0,-hr*.25,hr*1.05,.05*s,.12*s,.05*s,Math.PI/2+.4);}
  else{eyes(head,hr*.2,hr*.7,hr*.5,.07*s);const bl=m.bigbeak?.45:m.neck?.35:.2;part(head,'cone',m.bigbeak?'#ff9a1a':m.hook?'#ffd04a':'#ffb030',0,-hr*.1,hr+bl*s*.45,.07*s*(m.bigbeak?1.6:1),bl*s,.07*s*(m.bigbeak?1.4:1),Math.PI/2+(m.hook?.35:0));}
  if(m.crest)for(let i=0;i<3;i++)part(head,'cone',c2,0,hr*(.95+i*.05),-hr*(.1+i*.35),.05*s,.25*s,.05*s,-.4-i*.3);
  if(m.fan){const T=grp(body,0,by+.1*s,-.3*s);for(let i=0;i<7;i++){const a=(i/6-.5)*2.2;part(T,'sph',i%2?c2:c,Math.sin(a)*.38*s,Math.cos(a)*.38*s+.1*s,-.05*s,.09*s,.3*s,.04*s,0,0,-a);}U.tail=T;}
  else{const T=grp(body,0,by,-.32*s);part(T,'cone',c,0,.02*s,-.1*s,.13*s,.3*s,.05*s,-2);U.tail=T;}
  if(m.spots)for(let i=0;i<5;i++)part(body,'sph',c2,(i%2?1:-1)*.2*s,by+(i%3)*.08*s,(i/2-1)*.15*s,.05*s);}
 else if(plan==='fish'){const by=(m.seal?.28:.62)*s,L=(m.whale?1.3:m.round?.8:1.1);
  if(m.round){part(body,'sph',c,0,by,0,.42*s);part(body,'sph',c2,0,by-.12*s,.12*s,.3*s,.25*s,.3*s);}else{part(body,'sph',c,0,by,0,.34*s*(m.whale?1.2:1),.3*s*(m.whale?1.05:1),.55*s*L);part(body,'sph',c2,0,by-.12*s,.06*s,.26*s,.18*s,.48*s*L);}
  if(m.spikes)for(let i=0;i<16;i++){const a=i/16*Math.PI*2,b=(i%4)/4*Math.PI;const d=new V(Math.cos(a)*Math.sin(b+.4),Math.cos(b+.4),Math.sin(a)*Math.sin(b+.4));part(body,'cone','#c8a040',d.x*.42*s,by+d.y*.42*s,d.z*.42*s,.04*s,.16*s,.04*s,Math.acos(d.y)*Math.sign(d.z||1),0,-Math.atan2(d.x,d.y));}
  const T=grp(body,0,by,-(m.round?.4:.55*L)*s);part(T,'cone',c,0,0,-.18*s,.22*s*(m.seal?.6:1),.3*s,.06*s,m.seal?-Math.PI/2:-Math.PI/2,0,m.seal?Math.PI/2:0);if(m.whale)part(T,'box',c,0,0,-.32*s,.6*s,.05*s,.2*s);U.tail=T;
  if(m.fin||m.whale)part(body,'cone',c,0,by+.33*s,-.05*s,.06*s,.32*s,.18*s,-.4);
  for(const sd of[-1,1]){const w=grp(body,sd*.3*s,by-.08*s,.15*s);part(w,'sph',c,sd*.08*s,0,0,.14*s,.03*s,.09*s,0,0,sd*.4);U.wings.push(w);}
  head=grp(body,0,by+.05*s,(m.round?.3:.42*L)*s);eyes(head,.08*s,.05*s,.2*s,.08*s);if(m.seal){part(head,'sph',c2,0,-.07*s,.12*s,.12*s,.08*s,.08*s);part(head,'sph',dark,0,-.03*s,.18*s,.04*s);}
  if(m.whale){part(body,'cyl','#c8e8ff',0,by+.4*s,.2*s,.03*s,.3*s,.03*s);}
  if(m.seal)U.legs=[];}
 else if(plan==='bug'||plan==='scorpion'){const by=.35*s;const ab=grp(body,0,by,-.25*s);U.tail=ab;
  part(ab,'sph',c,0,0,-.05*s,.28*s,.25*s,.36*s);if(m.stripes)for(let i=0;i<3;i++)part(ab,'tor',c2,0,0,(-.18+i*.13)*s,.26*s,.24*s,.18*s,0,0,0);if(m.glow)part(ab,'sph',m.glow,0,-.02*s,-.2*s,.2*s,.18*s,.2*s,0,0,0,1);
  part(body,'sph',plan==='scorpion'?c:c2,0,by,.05*s,.18*s,.16*s,.2*s);head=grp(body,0,by+.05*s,.28*s);part(head,'sph',c,0,0,0,.17*s);eyes(head,.04*s,.13*s,.08*s,.06*s);
  if(plan==='bug'){for(const sd of[-1,1])part(head,'cyl',dark,sd*.07*s,.2*s,.05*s,.015*s,.3*s,.015*s,.4,0,-sd*.4);}
  if(m.mandibles)for(const sd of[-1,1])part(head,'cone',c2,sd*.08*s,-.04*s,.22*s,.04*s,.3*s,.04*s,Math.PI/2,0,-sd*.4);
  for(let i=0;i<3;i++)for(const sd of[-1,1]){const L=grp(body,sd*.14*s,by,(.12-i*.13)*s);part(L,'cyl',dark,sd*.15*s,-.12*s,0,.022*s,.38*s,.022*s,0,0,sd*.9);if(i===1)U.legs.push(L);}
  if(m.wings)for(const sd of[-1,1]){const w=grp(body,sd*.1*s,by+.2*s,-.05*s);const mm=part(w,'sph','#e8f4ff',sd*.2*s,.02*s,-.05*s,.22*s,.02*s,.12*s,0,0,sd*.3,1);U.wings.push(w);}
  if(plan==='scorpion'){for(const sd of[-1,1]){part(head,'cyl',c,sd*.15*s,-.03*s,.18*s,.04*s,.25*s,.04*s,Math.PI/2.4,0,-sd*.5);part(head,'sph',c2,sd*.24*s,-.03*s,.34*s,.1*s,.07*s,.12*s);}
   for(let i=0;i<5;i++){const a=i/4*2.2;part(ab,'sph',c,0,Math.sin(a)*.4*s,-.35*s-Math.sin(a*.7)*.1*s+Math.cos(a)*-.2*s+(i>2?(i-2)*.12*s:0),.1*s-i*.008*s);}part(ab,'cone','#ff3a2a',0,.5*s,-.15*s,.05*s,.18*s,.05*s,1.4);}}
 else if(plan==='crab'){const by=.28*s;part(body,'sph',c,0,by,0,.45*s,.22*s,.34*s);part(body,'sph',c2,0,by-.08*s,.04*s,.36*s,.12*s,.26*s);
  head=grp(body,0,by+.1*s,.2*s);for(const sd of[-1,1]){part(head,'cyl',c,sd*.1*s,.1*s,0,.025*s,.2*s,.025*s);eyes(head,.22*s,.0,.1*s,.06*s);}
  for(const sd of[-1,1]){const w=grp(body,sd*.42*s,by+.05*s,.25*s);part(w,'sph',c,sd*.05*s,0,.12*s,.16*s,.13*s,.18*s);part(w,'cone',c,sd*.08*s,.06*s,.3*s,.06*s,.16*s,.05*s,1.4);part(w,'cone',c,sd*.02*s,-.04*s,.3*s,.05*s,.14*s,.05*s,1.8);U.wings.push(w);}
  for(let i=0;i<3;i++)for(const sd of[-1,1]){const L=grp(body,sd*.35*s,by,(-.12+i*.1)*s);part(L,'cyl',c,sd*.1*s,-.1*s,0,.03*s,.3*s,.03*s,0,0,sd*.8);if(i===1)U.legs.push(L);}}
 else if(plan==='snake'){const pts=[];for(let i=0;i<8;i++)pts.push(new V(Math.sin(i*.9)*.22*s,.16*s+(i===7?.25*s:0),(i-5)*.16*s));
  pts.forEach((p,i)=>part(body,'sph',i%2?c:c2,p.x*1.3,p.y*1.2,p.z*1.2,(.17+i*.014)*s));head=grp(body,pts[7].x*1.3,.6*s,.92*s);part(head,'sph',c,0,0,0,.26*s,.2*s,.3*s);eyes(head,.08*s,.12*s,.1*s,.06*s);part(head,'cone','#ff3a5a',0,-.04*s,.3*s,.02*s,.15*s,.02*s,Math.PI/2);U.tail=grp(body,0,0,0);}
 else if(plan==='snail'){part(body,'sph',c,0,.14*s,.05*s,.2*s,.14*s,.5*s);const sh=grp(body,0,.42*s,-.08*s);for(let i=0;i<4;i++)part(sh,'tor',c2,0,0,0,(.28-i*.06)*s,(.28-i*.06)*s,(.36-i*.06)*s,0,Math.PI/2,0);U.tail=sh;
  head=grp(body,0,.28*s,.42*s);part(head,'sph',c,0,0,0,.14*s);for(const sd of[-1,1]){part(head,'cyl',c,sd*.06*s,.15*s,0,.02*s,.25*s,.02*s,0,0,-sd*.2);}eyes(head,.28*s,0,.09*s,.05*s);}
 else if(plan==='ape'){const by=.55*s;part(body,'sph',c,0,by,0,.36*s,.42*s,.3*s);part(body,'sph',c2,0,by-.05*s,.16*s,.24*s,.3*s,.14*s);
  for(const sd of[-1,1]){const L=grp(body,sd*.16*s,.25*s,0);part(L,'cyl',c,0,-.12*s,0,.1*s,.25*s,.1*s);part(L,'sph',c2,0,-.25*s,.05*s,.11*s,.06*s,.14*s);U.legs.push(L);}
  for(const sd of[-1,1]){const w=grp(body,sd*.38*s,by+.25*s,.05*s);part(w,'cyl',c,0,-.28*s,0,.09*s,.55*s,.09*s,0,0,sd*.15);part(w,'sph',c2,sd*.05*s,-.56*s,.04*s,.12*s);U.wings.push(w);}
  head=grp(body,0,by+.5*s,.08*s);part(head,'sph',c,0,0,0,.27*s);part(head,'sph',c2,0,-.04*s,.18*s,.2*s,.16*s,.12*s);eyes(head,.06*s,.2*s,.1*s,.06*s);for(const sd of[-1,1])part(head,'sph',c2,sd*.27*s,.02*s,0,.08*s,.1*s,.05*s);
  if(m.tail){const T=grp(body,0,.4*s,-.25*s);part(T,'tor',c,0,.2*s,-.15*s,.18*s,.18*s,.18*s,0,Math.PI/2,0);U.tail=T;}}
 else if(plan==='octo'){const by=.75*s;part(body,'sph',c,0,by,0,.45*s,.5*s,.45*s);for(let i=0;i<5;i++)part(body,'sph',c2,Math.cos(i)*.3*s,by+.1*s+Math.sin(i*2)*.15*s,.3*s,.06*s);
  head=grp(body,0,by,.3*s);eyes(head,0,.1*s,.18*s,.1*s);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const L=grp(body,Math.cos(a)*.3*s,by-.35*s,Math.sin(a)*.3*s);L.rotation.y=-a;for(let k=0;k<3;k++)part(L,'sph',k%2?c2:c,.12*s+k*.14*s,-.15*s-k*.08*s+k*k*.04*s,0,(.1-k*.02)*s);U.legs.push(L);}}
 U.head=head;bake(root);
 // shadow-friendly glow material for firefly / phoenix parts handled via emissive tint
 if(m.glow)root.traverse(o=>{if(o.isMesh&&o.material===MATS){o.material=MATS.clone();o.material.emissive=new THREE.Color(m.glow);o.material.emissiveIntensity=.6;}});
 root.userData=U;return root;}

// idle / walk / attack pose; t = time, k = per-pet phase
export function animatePet(g,t,k,mode='idle',amt=0){const U=g.userData;if(!U)return;const s=U.s,f=mode==='walk'?9:2.2;
 const bob=mode==='walk'?Math.abs(Math.sin(t*f+k))*.08*s:Math.sin(t*f+k)*.02*s;U.body.position.y=bob;
 U.legs.forEach((L,i)=>{L.rotation.x=mode==='walk'?Math.sin(t*f+k+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.6:Math.sin(t*1.5+k+i)*.05;});
 if(U.head){U.head.rotation.x=Math.sin(t*1.3+k)*.06;U.head.rotation.y=Math.sin(t*.7+k*2)*.15;}
 if(U.tail)U.tail.rotation.y=Math.sin(t*(U.plan==='fish'?5:3)+k)*(U.plan==='fish'?.35:.25);
 U.wings.forEach((w,i)=>{w.rotation.z=(i?-1:1)*Math.sin(t*(U.plan==='bug'?24:U.plan==='bird'?(mode==='walk'?14:3):4)+k)*(U.plan==='bug'?.6:.25);});
 if(U.ears)U.ears.forEach((e,i)=>e.rotation.x=Math.sin(t*2+k+i)*.12);
 if(U.plan==='fish'&&!U.legs.length)U.body.rotation.z=Math.sin(t*1.7+k)*.06;}
