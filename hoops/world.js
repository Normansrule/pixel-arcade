// COURT KINGS — venues. ARENA: glossy maple court (painted keys, centre logo, team apron) with a mirrored reflection pass,
// glass backboards on padded stanchions with shot clocks, animated nets, scorer's table, benches, a two-tier bowl with an
// instanced cheering crowd, LED ribbon boards, catwalk lights, banners and a centre-hung jumbotron.
// STREET: painted half court in a chain-link cage at sunset, gooseneck hoop with a chain net, graffiti wall, brick and
// glass blocks with lit windows, string lights, street lamps and a standing crowd along the fence.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {C,CT} from './physics.js';
import {TEAMS,logo} from './data.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function makeEnv(R2,kind){const s=new THREE.Scene();const street=kind==='street';
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{n:{value:street?0:1}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float n;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=d.y;vec3 st=mix(vec3(.35,.25,.2),mix(vec3(1.,.55,.3),vec3(.25,.35,.6),smoothstep(0.,.5,h)),smoothstep(-.2,.05,h));st+=vec3(2.,1.,.4)*pow(max(0.,dot(d,normalize(vec3(-1.,.12,.3)))),24.);vec3 ar=mix(vec3(.03,.03,.04),vec3(.05,.05,.07),smoothstep(-.1,.4,h));gl_FragColor=vec4(mix(st,ar,n),1.);}'})));
 if(!street){const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(9,8.6,8),side:THREE.DoubleSide});for(let i=0;i<10;i++){const a=i/10*6.283,m=new THREE.Mesh(new THREE.PlaneGeometry(14,4),lm);m.position.set(Math.cos(a)*30,48,Math.sin(a)*22);m.lookAt(0,0,0);s.add(m);}
  const top=new THREE.Mesh(new THREE.PlaneGeometry(30,14),new THREE.MeshBasicMaterial({color:new THREE.Color(3,3,3.2),side:THREE.DoubleSide}));top.position.y=60;top.rotation.x=Math.PI/2;s.add(top);
  const rib=new THREE.Mesh(new THREE.CylinderGeometry(60,60,3,48,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.6,.3,.9),side:THREE.DoubleSide}));rib.position.y=8;s.add(rib);}
 const pm=new THREE.PMREMGenerator(R2);const rt=pm.fromScene(s,.02);pm.dispose();return rt.texture;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
function mergeG(list){const gs=list.map(([g,m])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}
// rounded-rectangle perimeter at half sizes (a,b) + offset `off`, corner radius rc; points carry outward normals
function perimeter(a,b,rc,off,step){const pts=[],cx=a-rc,cz=b-rc,r=rc+off;let u=0,last=null;
 const add=(x,z,ox,oz)=>{if(last)u+=Math.hypot(x-last.x,z-last.z);last={x,z,ox,oz,u};pts.push(last);};
 const line=(x0,z0,x1,z1,ox,oz)=>{const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)/step));for(let i=0;i<n;i++){const t=i/n;add(x0+(x1-x0)*t,z0+(z1-z0)*t,ox,oz);}};
 const arc=(ccx,ccz,a0)=>{const n=Math.max(3,Math.ceil(r*Math.PI/2/step));for(let i=0;i<n;i++){const t=a0+i/n*Math.PI/2;add(ccx+Math.cos(t)*r,ccz+Math.sin(t)*r,Math.cos(t),Math.sin(t));}};
 line(a+off,-cz,a+off,cz,1,0);arc(cx,cz,0);line(cx,b+off,-cx,b+off,0,1);arc(-cx,cz,Math.PI/2);line(-(a+off),cz,-(a+off),-cz,-1,0);arc(-cx,-cz,Math.PI);line(-cx,-(b+off),cx,-(b+off),0,-1);arc(cx,-cz,Math.PI*1.5);
 const f=pts[0];add(f.x,f.z,f.ox,f.oz);return pts;}
function sweep(per,prof){const nP=prof.length,pos=[],uv=[],idx=[];
 for(const p of per)for(const q of prof){pos.push(p.x+p.ox*q.s,q.y,p.z+p.oz*q.s);uv.push(p.u/4,q.v);}
 for(let i=0;i<per.length-1;i++)for(let j=0;j<nP-1;j++){const a=i*nP+j,b=a+nP;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}

/* ---------- court painting (shared by both venues) ---------- */
// draws the regulation lines for the hoops in CT onto ctx where px(x,z) maps metres to pixels; k = px per metre
function courtLines(x,px,k,col,lw=.05,half=false){const L=C.L,W=C.W;x.strokeStyle=col;x.lineWidth=lw*k;x.lineCap='butt';
 const seg=(x0,z0,x1,z1)=>{x.beginPath();x.moveTo(...px(x0,z0));x.lineTo(...px(x1,z1));x.stroke();};
 const arc=(cx,cz,r,a0,a1,dash)=>{x.beginPath();const n=64;for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n;const p=px(cx+Math.cos(t)*r,cz+Math.sin(t)*r);i?x.lineTo(...p):x.moveTo(...p);}if(dash)x.setLineDash([.38*k,.3*k]);x.stroke();x.setLineDash([]);};
 const xm=half?0:-L;x.strokeRect(...px(xm,-W),(L-xm)*k,2*W*k);if(!half)seg(0,-W,0,W);arc(0,0,C.CR,0,6.2832);if(!half)arc(0,0,.61,0,6.2832);
 for(const H of CT.hoops){const s=H.s,bl=s*L,hx=H.x,dx=Math.sqrt(C.TR*C.TR-C.TC*C.TC);
  for(const z of[-C.TC,C.TC])seg(bl,z,hx-s*dx,z);const a=Math.atan2(C.TC,-s*dx);arc(hx,0,C.TR,s>0?Math.PI-Math.atan2(C.TC,dx):-Math.atan2(C.TC,dx),s>0?Math.PI+Math.atan2(C.TC,dx):Math.atan2(C.TC,dx));
  const ft=bl-s*C.FTX;seg(bl,-C.KW/2,ft,-C.KW/2);seg(bl,C.KW/2,ft,C.KW/2);seg(ft,-C.KW/2,ft,C.KW/2);
  arc(ft,0,C.CR,s>0?Math.PI/2:-Math.PI/2,s>0?Math.PI*1.5:Math.PI/2);arc(ft,0,C.CR,s>0?-Math.PI/2:Math.PI/2,s>0?Math.PI/2:Math.PI*1.5,true);
  arc(hx,0,1.22,s>0?Math.PI/2:-Math.PI/2,s>0?Math.PI*1.5:Math.PI/2);for(const z of[-1.22,1.22])seg(hx,z,hx+s*.3,z);
  for(const zs of[-1,1])for(const d of[2.13,3.0,3.87,4.74])seg(bl-s*d,zs*C.KW/2,bl-s*(d+.05),zs*C.KW/2),x.beginPath(),x.moveTo(...px(bl-s*d,zs*C.KW/2)),x.lineTo(...px(bl-s*d,zs*(C.KW/2+.2))),x.stroke();
}}
function woodFloor(x,w,h,k,FX,FZ,T,ti){// maple planks along x
 x.fillStyle='#c9925a';x.fillRect(0,0,w,h);const pw=.057*k;let row=0;
 for(let y=0;y<h;y+=pw,row++){let px=-rnd(2)*k;while(px<w){const len=(.8+rnd(2.2))*k,t=rnd();const c=[200+t*30|0,140+t*32|0,82+t*30|0];x.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;x.fillRect(px,y,len,pw);
   x.fillStyle='rgba(60,30,10,.28)';x.fillRect(px,y,1,pw);px+=len;}x.fillStyle='rgba(70,40,15,.22)';x.fillRect(0,y,w,1);}
 for(let i=0;i<w*h/900;i++){x.fillStyle=`rgba(${rnd()<.5?'90,50,20':'255,230,190'},${rnd(.08)})`;x.fillRect(rnd(w),rnd(h),4+rnd(40),1);}
 const g=x.createRadialGradient(w/2,h/2,h*.1,w/2,h/2,w*.6);g.addColorStop(0,'rgba(255,220,170,.06)');g.addColorStop(1,'rgba(80,40,10,.18)');x.fillStyle=g;x.fillRect(0,0,w,h);}

/* ---------- hoop assembly ---------- */
function netMat(tex,chain){const u={uT:{value:0},uSw:{value:0},uFx:{value:0}};const m=new THREE.MeshStandardMaterial({map:tex,alphaTest:.4,side:THREE.DoubleSide,roughness:chain?.35:.85,metalness:chain?.85:0,color:chain?0xb8bcc4:0xffffff});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uSw,uFx;').replace('#include <begin_vertex>',`#include <begin_vertex>
  float dn=clamp(-transformed.y/.42,0.,1.);float sw=uSw*sin(uT*18.-dn*4.)*dn;transformed.x*=1.+sw*.25-uSw*dn*.15;transformed.z*=1.+sw*.25-uSw*dn*.15;transformed.y-=uSw*dn*.1;transformed.x+=sin(uT*1.3+dn*3.)*.006*dn+uFx*dn*.03;`);};
 m.customProgramCacheKey=()=>'ck_net'+(chain?'c':'');m.u=u;return m;}
function netTex(chain){return ctex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle=chain?'#ddd':'#fff';x.lineWidth=chain?5:3;x.beginPath();x.moveTo(0,0);x.lineTo(w,h);x.moveTo(w,0);x.lineTo(0,h);x.stroke();if(chain){x.fillStyle='#ddd';for(let i=0;i<4;i++){x.fillRect(w/2-3,i*16,6,10);}}},{});}
function makeHoop(H,o){const g=new THREE.Group(),s=H.s;const street=o.street;
 // glass (or steel) board with frame + shooter's square
 const bw=C.BBW,bh=C.BBH,by=C.BBY+bh/2,bx=H.bx+s*.025;
 const boardT=ctex(366,214,(x,w,h)=>{x.clearRect(0,0,w,h);if(street){x.fillStyle='#e8e6e0';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=`rgba(80,60,40,${rnd(.12)})`;x.fillRect(rnd(w),rnd(h),rnd(6),rnd(3));}x.strokeStyle='#d24a1e';}else{x.fillStyle='rgba(190,215,235,.16)';x.fillRect(0,0,w,h);x.strokeStyle='#fff';}
  x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);x.lineWidth=8;x.strokeRect(w/2-61,h-30-92,122,92);},{clamp:true});
 const board=new THREE.Mesh(new THREE.BoxGeometry(.05,bh,bw),new THREE.MeshStandardMaterial({map:boardT,transparent:!street,roughness:street?.6:.04,metalness:street?.4:.1,envMapIntensity:street?.6:1.6,depthWrite:street}));
 board.material.map.rotation=0;board.position.set(bx,by,0);g.add(board);
 {const uv=board.geometry.attributes.uv;}// side faces of the box reuse the map: fine at 5 cm
 if(!street){const pad=new THREE.Mesh(new THREE.BoxGeometry(.09,.07,bw+.06),new THREE.MeshStandardMaterial({color:o.pad,roughness:.6}));pad.position.set(bx,C.BBY-.02,0);g.add(pad);
  const sc=document.createElement('canvas');sc.width=128;sc.height=64;const st=new THREE.CanvasTexture(sc);st.colorSpace=THREE.SRGBColorSpace;H.sc={c:sc,t:st,last:-1};
  const scm=new THREE.MeshBasicMaterial({map:st,color:new THREE.Color(1.6,1.6,1.6)}),dark=new THREE.MeshStandardMaterial({color:0x111215,roughness:.5,metalness:.4});
  const clk=new THREE.Mesh(new THREE.BoxGeometry(.32,.26,.62),[dark,dark,dark,dark,dark,dark]);clk.position.set(bx+s*.08,C.BBY+bh+.16,0);g.add(clk);
  for(const f of[-1,1]){const face=new THREE.Mesh(new THREE.PlaneGeometry(.56,.22),scm);face.position.set(bx+s*.08-s*.161*(f<0?1:0)+(f>0?s*.161:0)*0,C.BBY+bh+.16,0);face.position.x=bx+s*.08-s*.162*f;face.rotation.y=-s*f*Math.PI/2;g.add(face);}}
 // rim + bracket + net
 const rim=new THREE.Group();rim.position.set(H.x+s*C.RR,C.RH,0);g.add(rim);
 const rm=new THREE.Mesh(new THREE.TorusGeometry(C.RR,.011,8,40).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:street?0xd0521e:0xff4a12,roughness:.35,metalness:.55}));rm.position.x=-s*C.RR;rm.castShadow=true;rim.add(rm);
 const br=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(H.bx-H.x)-C.RR+.02,.05,.16),rm.material);br.position.x=s*(Math.abs(H.bx-H.x)-C.RR)/2;br.position.y=-.02;rim.add(br);
 const nm=netMat(netTex(street),street),net=new THREE.Mesh(new THREE.CylinderGeometry(C.RR,.135,.42,16,6,true),nm);net.position.set(-s*C.RR,-.21,0);
 {const uv=net.geometry.attributes.uv;for(let i=0;i<uv.count;i++){uv.setX(i,uv.getX(i)*8);uv.setY(i,uv.getY(i)*3.5);}}net.geometry.translate(0,.21,0);net.position.y=-.42;
 {const p=net.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)-.42);}net.position.y=0;rim.add(net);H.rim=rim;H.net=nm;
 // support
 const padM=new THREE.MeshStandardMaterial({color:o.pad,roughness:.55}),steel=new THREE.MeshStandardMaterial({color:street?0x3c4a52:0x1b1d22,roughness:.45,metalness:.7});
 if(street){const px=s*(C.L+1.1);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,3.6,12),steel);pole.position.set(px,1.8,0);pole.castShadow=true;g.add(pole);
  const curve=new THREE.CatmullRomCurve3([new V(px,3.5,0),new V(px,4.1,0),new V(px-s*.5,4.35,0),new V(H.bx+s*.6,4.0,0),new V(H.bx+s*.06,3.55,0)]);const arm=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.07,8),steel);arm.castShadow=true;g.add(arm);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,1.8,12),padM);pad.position.set(px,.9,0);g.add(pad);}
 else{const bxp=s*(C.L+2.3);const base=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.05,1.7),padM);base.position.set(bxp,.525,0);base.castShadow=true;g.add(base);
  const lt=ctex(256,128,(x,w,h)=>{x.fillStyle=o.pad;x.fillRect(0,0,w,h);x.save();x.translate(w/2-48,h/2-48);logo(x,o.ti,96);x.restore();});const face=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.8),new THREE.MeshStandardMaterial({map:lt,roughness:.6}));face.position.set(bxp-s*.751,.55,0);face.rotation.y=-s*Math.PI/2;g.add(face);
  const post=new THREE.Mesh(new THREE.BoxGeometry(.32,2.6,.36),padM);post.position.set(s*(C.L+1.85),2.1,0);post.rotation.z=s*.12;post.castShadow=true;g.add(post);
  const armL=Math.abs(s*(C.L+1.75)-(H.bx+s*.05));const arm=new THREE.Mesh(new THREE.BoxGeometry(armL,.22,.22),steel);arm.position.set(s*(C.L+1.75)-s*armL/2,3.45,0);arm.castShadow=true;g.add(arm);
  const brace=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,.1),steel);brace.position.set(H.bx+s*.75,3.0,0);brace.rotation.z=-s*.45;g.add(brace);}
 g.traverse(m=>{if(m.isMesh&&m!==board&&m!==net)m.castShadow=true;});return g;}

/* ---------- crowd ---------- */
function crowdGeo(legs){const parts=[[new THREE.BoxGeometry(.46,.5,.3),M4(0,.3,0),0,0],[new THREE.BoxGeometry(.21,.23,.21),M4(0,.68,.02),0,1],[new THREE.BoxGeometry(.1,.4,.1),M4(.29,.38,0),1,0],[new THREE.BoxGeometry(.1,.4,.1),M4(-.29,.38,0),1,0]];
 if(legs){parts.forEach(p=>p[1].premultiply(M4(0,.82,0)));parts.push([new THREE.BoxGeometry(.4,.86,.24),M4(0,.43,0),0,2]);}
 const gs=parts.map(([g,m,a,h])=>{g=g.toNonIndexed();g.applyMatrix4(m);const c=g.attributes.position.count;g.setAttribute('arm',new THREE.Float32BufferAttribute(new Float32Array(c).fill(a),1));g.setAttribute('head',new THREE.Float32BufferAttribute(new Float32Array(c).fill(h),1));return g;});
 let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),arm=new Float32Array(n),hd=new Float32Array(n);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);arm.set(g.attributes.arm.array,o);hd.set(g.attributes.head.array,o);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('arm',new THREE.BufferAttribute(arm,1));r.setAttribute('head',new THREE.BufferAttribute(hd,1));return r;}
function crowdMat(out,legs){const mat=new THREE.MeshLambertMaterial({color:0xffffff});const base=legs?.82:0;
 mat.onBeforeCompile=sh=>{sh.uniforms.uT=out.time;sh.uniforms.uH=out.hypeH;sh.uniforms.uA=out.hypeA;sh.uniforms.uN=out.hype;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uH,uA,uN;attribute float arm;attribute float fan;attribute float head;varying float vHead,vPh,vArm;varying vec3 vLoc;')
   .replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453);
   vHead=head;vPh=ph;vArm=arm;vLoc=position;vLoc.y-=${base.toFixed(2)};float hy=fan>1.5?uA:fan>.5?uH:uN*.5;float ex=clamp(hy+uN*.35,0.,1.);
   float jb=max(0.,sin(uT*(5.+ph*4.)+ph*40.));float up=smoothstep(.15,.6,ex)*step(.25,ph+ex*.6);
   float raise=clamp(ex*1.4-ph*.5,0.,1.)*arm*up;float ly=transformed.y-${base.toFixed(2)};ly=mix(ly,1.16-ly,raise);transformed.y=ly+${base.toFixed(2)};transformed.x*=1.+raise*.2;
   if(head<1.5)transformed.y+=jb*jb*(.04+ex*.4)*(.5+ph)*up+up*${legs?'.0':'.3'};`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vHead,vPh,vArm;varying vec3 vLoc;').replace('#include <color_fragment>',`#include <color_fragment>
   float k=fract(vPh*7.31);vec3 skin=mix(vec3(.93,.72,.56),vec3(.3,.19,.12),k*k);
   if(vHead>1.5){diffuseColor.rgb=mix(vec3(.12,.13,.17),vec3(.35,.38,.45),step(.6,fract(vPh*9.1)));}
   else if(vHead>.5){float hr=fract(vPh*3.17);diffuseColor.rgb=vLoc.y>.745-step(.8,hr)*.2?mix(vec3(.05,.04,.03),vec3(.55,.4,.22),step(.7,hr)):skin;if(vLoc.z<-.05&&vLoc.y>.62)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.06,.05,.04),step(.4,hr));}
   else if(vArm>.5){if(vLoc.y<.36-step(.5,fract(vPh*5.3))*.12)diffuseColor.rgb=skin;}
   diffuseColor.rgb*=.82+.18*smoothstep(.05,.6,vLoc.y);`);};
 mat.customProgramCacheKey=()=>'ck_crowd'+(legs?'l':'');return mat;}
function crowdMesh(out,pts,cols,legs){const geo=crowdGeo(legs);const mesh=new THREE.InstancedMesh(geo,crowdMat(out,legs),pts.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();const fanA=new Float32Array(pts.length);
 pts.forEach((p,i)=>{q.setFromAxisAngle(new V(0,1,0),p[3]);const s=.92+rnd(.2);m4.compose(new V(p[0],p[1],p[2]),q,new V(s,s*(.9+rnd(.2)),s));mesh.setMatrixAt(i,m4);const r=cols(p);c.set(r[0]).multiplyScalar(.72+rnd(.38));mesh.setColorAt(i,c);fanA[i]=r[1];});
 geo.setAttribute('fan',new THREE.InstancedBufferAttribute(fanA,1));mesh.frustumCulled=false;return mesh;}
const PAL=['#e8e8e8','#2a2a2e','#c8c8d0','#6a6a74','#3d5a8a','#8a3d3d','#d8c060','#5a8a5a','#3a3a44','#b06a3a','#204060'];

/* ---------- LED ad strip texture ---------- */
function adsTex(items,hgt=64){const mc=document.createElement('canvas').getContext('2d');mc.font=`${hgt*.66|0}px Anton, Impact, sans-serif`;const cyc=items.reduce((s,[t])=>s+mc.measureText(t).width+hgt*.6,0);const AW=Math.ceil(cyc);
 const t=ctex(AW,hgt,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0c1022');g.addColorStop(1,'#05060c');x.fillStyle=g;x.fillRect(0,0,w,h);x.font=`${h*.66|0}px Anton, Impact, sans-serif`;x.textBaseline='middle';let px=h*.3;
  for(const[s,c]of items){x.fillStyle=c;x.fillText(s,px,h/2+3);px+=x.measureText(s).width+h*.6;}x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<w;i+=3)x.fillRect(i,0,1,h);});t.aw=AW;return t;}

/* ================= ARENA ================= */
export function buildArena(scene,o){// o: {home, away, kits:[k0,k1], q (0..2), crowd density}
 const G=new THREE.Group();scene.add(G);const out={group:G,time:{value:0},hypeH:{value:0},hypeA:{value:0},hype:{value:0},nets:[],mirror:null,kind:'arena'};
 const L=C.L,W=C.W,T=TEAMS[o.home],q=o.q,FX=L+1.95,FZ=W+1.95;
 // ----- lights -----
 G.add(new THREE.HemisphereLight(0x9fb2d8,0x2a1c10,.55));
 const key=new THREE.DirectionalLight(0xfff4e6,2.6);key.position.set(6,40,14);key.castShadow=true;Object.assign(key.shadow.camera,{left:-L-4,right:L+4,top:W+6,bottom:-W-6,near:10,far:80});key.shadow.bias=-.0004;key.shadow.normalBias=.025;G.add(key,key.target);out.key=key;
 for(const[x,y,z,i]of[[-30,22,18,.55],[30,22,-18,.5],[0,25,-30,.35]]){const f=new THREE.DirectionalLight(0xdfe6ff,i);f.position.set(x,y,z);G.add(f);}
 // ----- floor -----
 const k=q>=1?126:63,cw=Math.round(2*FX*k),ch=Math.round(2*FZ*k),px=(x,z)=>[(x+FX)*k,(z+FZ)*k];
 const floorT=ctex(cw,ch,(x,w,h)=>{woodFloor(x,w,h,k,FX,FZ);
  // apron in the team's dark colour, with the city and nickname painted on
  x.fillStyle=T.c2;x.globalAlpha=.92;x.fillRect(0,0,w,(FZ-W)*k);x.fillRect(0,h-(FZ-W)*k,w,(FZ-W)*k);x.fillRect(0,0,(FX-L)*k,h);x.fillRect(w-(FX-L)*k,0,(FX-L)*k,h);x.globalAlpha=1;
  x.fillStyle='rgba(255,255,255,.9)';x.font=`${1.15*k|0}px Anton, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';
  x.fillText(T.n.toUpperCase(),...px(-L*.5,-W-.98));x.fillText(T.city.toUpperCase(),...px(L*.5,-W-.98));x.fillText('COURT KINGS',...px(0,W+.98));
  for(const s of[-1,1]){x.save();x.translate(...px(s*(L+.98),0));x.rotate(s*Math.PI/2);x.fillText(T.n.toUpperCase(),0,0);x.restore();}
  // painted keys + centre circle
  x.fillStyle=T.c1;x.globalAlpha=.88;for(const s of[-1,1]){const bl=s*L,ft=bl-s*C.FTX;const a=px(Math.min(bl,ft),-C.KW/2);x.fillRect(a[0],a[1],C.FTX*k,C.KW*k);}
  x.beginPath();x.arc(...px(0,0),C.CR*k,0,7);x.fill();x.globalAlpha=1;
  x.save();x.translate(...px(0,0));const ls=2.9*k;x.translate(-ls/2,-ls/2);logo(x,o.home,ls);x.restore();
  // three-point area tint, then lines
  courtLines(x,px,k,'#fbfbf6',.055);
  x.fillStyle='rgba(255,255,255,.8)';x.font=`${.5*k|0}px Anton, Impact, sans-serif`;});
 floorT.anisotropy=16;const mirror=q>=1;
 const floorM=new THREE.MeshStandardMaterial({map:floorT,roughness:.24,metalness:0,envMapIntensity:1.1,transparent:mirror,opacity:mirror?.86:1});
 floorM.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <map_fragment>',`#include <map_fragment>
  {vec3 vd=normalize(cameraPosition-vWP);float g=1.-vd.y;diffuseColor.a*=1.-.32*g*g;float d=max(abs(vWP.x)/${(L+3).toFixed(1)},abs(vWP.z)/${(W+3).toFixed(1)});diffuseColor.rgb*=1.-.25*smoothstep(.7,1.,d);}`);};
 floorM.customProgramCacheKey=()=>'ck_floor'+(mirror?'m':'');
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(2*FX,2*FZ),floorM);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.renderOrder=-1;G.add(floor);out.floor=floor;
 const darkM=new THREE.MeshStandardMaterial({color:0x111318,roughness:.55,metalness:.1,envMapIntensity:.5});
 for(const[x,z,w,d]of[[0,-FZ-20,120,40],[0,FZ+20,120,40],[-FX-30,0,60,2*FZ],[FX+30,0,60,2*FZ]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),darkM);m.rotation.x=-Math.PI/2;m.position.set(x,-.002,z);m.receiveShadow=true;G.add(m);}
 // ----- mirrored reflection group (filled by the game with players + ball; hoops + jumbotron added here) -----
 if(mirror){const mg=new THREE.Group();mg.scale.y=-1;G.add(mg);out.mirror=mg;}
 // ----- hoops -----
 for(const H of CT.hoops){const h=makeHoop(H,{pad:T.c2,ti:o.home});G.add(h);out.nets.push(H);if(out.mirror){const m=h.clone();m.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});out.mirror.add(m);}}
 // ----- scorer's table + benches (far side) -----
 {const ads=adsTex([['COURT KINGS','#ffffff'],['◆','#ff4d00'],['PIXEL ARCADE','#ffcf3f'],['◆','#2ad1ff'],['VOLTWAVE','#9cff6a'],['◆',T.c1],['HALCYON AIR','#9ec0ff'],['◆','#ffcf3f'],['GRIPLINE','#ff8fd1']]);out.ads=[ads];
  const tz=-(W+2.5);const tbl=new THREE.Mesh(new THREE.BoxGeometry(9,.85,.8),darkM);tbl.position.set(0,.425,tz);tbl.castShadow=true;G.add(tbl);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(9,.62),new THREE.MeshBasicMaterial({map:ads,color:new THREE.Color(1.5,1.5,1.5)}));ads.repeat.set(9/(ads.aw/64*.62),1);scr.position.set(0,.45,tz+.41);G.add(scr);
  const chairM=[new THREE.MeshStandardMaterial({color:o.kits[0].c1,roughness:.5}),new THREE.MeshStandardMaterial({color:o.kits[1].c1,roughness:.5})];const ch=[];
  for(const s of[-1,1])for(let i=0;i<6;i++){const x=s*(5.6+i*.75);ch.push([s<0?0:1,x]);}
  for(const[t,x]of ch){const c=new THREE.Group();c.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.08,.5),chairM[t]).translateY(.46));c.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.55,.07),chairM[t]).translateY(.74).translateZ(-.25));c.position.set(x,0,tz-.3);G.add(c);}
  out.benchSeats=ch.map(([t,x])=>({t,x,z:tz-.3}));}
 // ----- stands: lower bowl from the floor, fascia LED ribbon, suites, upper bowl -----
 const a=L+4.4,b=W+4.0,rc=5,N1=q===0?12:16,N2=q===0?10:14,d1=.85,r1=.42,d2=.8,r2=.6;const prof=[{s:0,y:0,v:0},{s:0,y:.5,v:.1}];
 for(let i=0;i<N1;i++)prof.push({s:.4+i*d1,y:.5+i*r1,v:i},{s:.4+i*d1,y:.5+(i+1)*r1,v:i+.5});const y1=.5+N1*r1,s1=.4+N1*d1;
 prof.push({s:s1+1.2,y:y1,v:N1+1},{s:s1+1.2,y:y1+3.2,v:N1+2});const y2=y1+3.2,s2=s1+1.8;for(let i=0;i<N2;i++)prof.push({s:s2+i*d2,y:y2+i*r2,v:N1+3+i},{s:s2+i*d2,y:y2+(i+1)*r2,v:N1+3.5+i});
 const sTop=s2+N2*d2,yTop=y2+N2*r2;prof.push({s:sTop+.6,y:yTop,v:N1+N2+4},{s:sTop+.6,y:yTop+9,v:N1+N2+5});
 const per=perimeter(a,b,rc,0,2.5);
 const seatT=ctex(512,64,(x,w,h)=>{x.fillStyle='#24262c';x.fillRect(0,h/2,w,h/2);x.fillStyle='#1a1b20';x.fillRect(0,0,w,h/2);for(let i=0;i<16;i++){x.fillStyle=i%5?T.c2:'#2b2d33';x.fillRect(i*32+3,4,26,h*.4);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(i*32+3,4,26,3);}});seatT.repeat.set(1,1);
 const stands=new THREE.Mesh(sweep(per,prof),new THREE.MeshStandardMaterial({map:seatT,roughness:.85,color:0x9a9ca4,side:THREE.DoubleSide}));stands.receiveShadow=true;G.add(stands);
 {const ads=adsTex([['COURT KINGS','#ffffff'],['◆',T.c1],[T.city.toUpperCase()+' '+T.n.toUpperCase(),T.c1==='#f4f4f2'?'#fff':T.c1],['◆','#ffcf3f'],['DEFENSE!','#ff4d4d'],['◆','#2ad1ff'],['NORTHLINE TELECOM','#9ec0ff'],['◆','#9cff6a'],['MAKE SOME NOISE','#ffcf3f']],48);
  const g=sweep(per,[{s:s1+1.22,y:y1+.25,v:0},{s:s1+1.22,y:y1+1.35,v:1}]);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*4/(ads.aw/48*1.1));
  G.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:ads,color:new THREE.Color(1.7,1.7,1.7),side:THREE.DoubleSide})));out.ads.push(ads);
  const win=ctex(256,32,(x,w,h)=>{x.fillStyle='#0b0d12';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){const gg=x.createLinearGradient(0,4,0,h-4);gg.addColorStop(0,'#ffe3b0');gg.addColorStop(1,'#80502a');x.fillStyle=gg;x.fillRect(i*32+3,6,26,h-12);}});
  G.add(new THREE.Mesh(sweep(per,[{s:s1+1.21,y:y1+1.6,v:0},{s:s1+1.21,y:y1+3.1,v:1}]),new THREE.MeshBasicMaterial({map:win,color:new THREE.Color(.9,.85,.8),side:THREE.DoubleSide})));}
 // crowd (home colours dominate; a pocket of road fans behind one basket)
 {const den=o.crowd??1,pts=[];const ring=(s,y,step)=>{for(const p of perimeter(a,b,rc,s,step)){if(rnd()>den*.95)continue;pts.push([p.x+rnd(.1),y,p.z+rnd(.1),Math.atan2(-p.ox,-p.oz),p]);}};
  for(let i=0;i<N1;i++)ring(.4+i*d1+.42,.5+(i+1)*r1-.02,.62);for(let i=0;i<N2;i++)ring(s2+i*d2+.4,y2+(i+1)*r2,.66);
  const K=o.kits;const mesh=crowdMesh(out,pts,p=>{const road=p[0]<-a+2&&p[2]>0;const r=rnd();if(road&&r<.6)return[rnd()<.6?K[1].c1:K[1].c2,2];if(!road&&r<.6)return[rnd()<.65?K[0].c1:K[0].c2,1];return[PAL[rnd(PAL.length)|0],0];});G.add(mesh);out.crowdN=pts.length;
  // phone lights
  const fp=[],fr=[];for(let i=0;i<500;i++){const p=pts[rnd(pts.length)|0];fp.push(p[0],p[1]+1.1,p[2]);fr.push(rnd());}const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('ph',new THREE.Float32BufferAttribute(fr,1));
  G.add(new THREE.Points(fg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:out.time,uN:out.hype},
   vertexShader:'attribute float ph;uniform float uT,uN;varying float vA;void main(){float t=fract(uT*(.12+ph*.2+uN*.6)+ph*7.);vA=smoothstep(.975,1.,t);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=vA*900./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(3.)*vA*smoothstep(.5,0.,d),1.);}'})));}
 // ----- roof: dark ceiling, catwalk light ring, banners -----
 const ceilY=yTop+9;{const ceil=new THREE.Mesh(new THREE.PlaneGeometry(4*a,4*b),new THREE.MeshStandardMaterial({color:0x0a0b0f,roughness:1}));ceil.rotation.x=Math.PI/2;ceil.position.y=ceilY;G.add(ceil);
  const lampM=new THREE.MeshBasicMaterial({color:new THREE.Color(8,7.6,7)}),lamps=[];for(let i=0;i<24;i++){const t=i/24*6.283;lamps.push([new THREE.BoxGeometry(1.2,.3,.8),M4(Math.cos(t)*(L+2),ceilY-2,Math.sin(t)*(W+3),.5*Math.sin(t),-t,0)]);}
  const lm=new THREE.Mesh(mergeG(lamps),lampM);G.add(lm);if(out.mirror)out.mirror.add(lm.clone());
  const truss=new THREE.Mesh(new THREE.TorusGeometry(1,.12,6,48).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0x22252c,roughness:.6,metalness:.6}));truss.scale.set(L+2,1,W+3);truss.position.y=ceilY-1.7;G.add(truss);
  // championship banners at both ends
  const bm=[];for(let i=0;i<5;i++){const yr=2019+i*1;const bt=ctex(128,256,(x,w,h)=>{x.fillStyle=T.c2;x.fillRect(0,0,w,h);x.fillStyle=T.c1;x.fillRect(0,h-40,w,40);x.fillRect(0,0,w,8);x.save();x.translate(24,22);logo(x,o.home,80);x.restore();x.fillStyle='#fff';x.font='28px Anton, Impact, sans-serif';x.textAlign='center';
   x.fillText(i<3?'CHAMPIONS':'DIVISION',w/2,140);x.font='40px Anton, Impact, sans-serif';x.fillText(String(yr+i*2),w/2,190);x.beginPath();x.moveTo(0,h);x.lineTo(w/2,h-20);x.lineTo(w,h);x.fillStyle='#000';});
   const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.4),new THREE.MeshStandardMaterial({map:bt,roughness:.8,side:THREE.DoubleSide}));m.position.set(-(a+sTop*.7),yTop+2.2,-6+i*3);m.rotation.y=Math.PI/2;G.add(m);}}
 // ----- centre-hung jumbotron -----
 {const jc=document.createElement('canvas');jc.width=512;jc.height=288;const jt=new THREE.CanvasTexture(jc);jt.colorSpace=THREE.SRGBColorSpace;out.screen={c:jc,t:jt};
  const jb=new THREE.Group();jb.position.y=ceilY-7.5;const fm=new THREE.MeshStandardMaterial({color:0x15171c,roughness:.5,metalness:.6}),scm=new THREE.MeshBasicMaterial({map:jt,color:new THREE.Color(1.5,1.5,1.5)});
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(7.6,4.6,5.4),fm));for(const[x,z,ry,w]of[[0,2.71,0,7.2],[0,-2.71,Math.PI,7.2],[3.81,0,Math.PI/2,5],[-3.81,0,-Math.PI/2,5]]){const s=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.5625),scm);s.position.set(x,0,z);s.rotation.y=ry;jb.add(s);}
  const ringM=new THREE.MeshBasicMaterial({color:new THREE.Color(o.kits[0].c1).multiplyScalar(3)});for(const y of[2.45,-2.45]){const r=new THREE.Mesh(new THREE.BoxGeometry(7.8,.25,5.6),ringM);r.position.y=y;jb.add(r);}
  const low=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,1,32,1,true),new THREE.MeshBasicMaterial({map:out.ads[1],color:new THREE.Color(1.6,1.6,1.6),side:THREE.DoubleSide}));low.position.y=-3.1;jb.add(low);
  G.add(jb);out.jumbo=jb;if(out.mirror){const m=jb.clone();out.mirror.add(m);}}
 out.yTop=yTop;
 out.update=(dt)=>{out.time.value+=dt;for(const ad of out.ads)ad.offset.x=(out.time.value*.03)%1;for(const H of CT.hoops){if(!H.rim)continue;H.flex=Math.max(0,H.flex-dt*3);H.rim.rotation.z=-H.s*H.flex*.22;H.swish=Math.max(0,H.swish-dt*1.6);H.net.u.uSw.value=H.swish;H.net.u.uT.value=out.time.value;H.net.u.uFx.value=H.flex;}};
 out.dispose=()=>disposeG(scene,G);return out;}
function disposeG(scene,G){scene.remove(G);G.traverse(o=>{if(o.userData.keep)return;if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});}

/* ================= STREET ================= */
export function buildStreet(scene,o){const G=new THREE.Group();scene.add(G);const out={group:G,time:{value:0},hypeH:{value:0},hypeA:{value:0},hype:{value:0},nets:[],kind:'street',ads:[]};
 const L=C.L,W=C.W,q=o.q;
 // ----- sky + sun -----
 const sky=new Sky();sky.scale.setScalar(3000);const u=sky.material.uniforms;u.turbidity.value=8;u.rayleigh.value=2.6;u.mieCoefficient.value=.006;u.mieDirectionalG.value=.9;
 const sun=new V().setFromSphericalCoords(1,THREE.MathUtils.degToRad(84),THREE.MathUtils.degToRad(-115));u.sunPosition.value.copy(sun);G.add(sky);out.sun=sun;
 G.add(new THREE.HemisphereLight(0x9db4e0,0x5a3a28,.75));
 const key=new THREE.DirectionalLight(0xffb070,2.7);key.position.copy(sun).multiplyScalar(60).add(new V(L/2,0,0));key.target.position.set(L/2,0,0);key.castShadow=true;
 Object.assign(key.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:5,far:140});key.shadow.bias=-.0005;key.shadow.normalBias=.03;G.add(key,key.target);out.key=key;
 {const f=new THREE.DirectionalLight(0x8fa8ff,.45);f.position.set(30,25,30);G.add(f);}
 // ----- ground: asphalt lot + painted court -----
 const asph=ctex(512,512,(x,w,h)=>{x.fillStyle='#3a3a3d';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=40+rnd(60)|0;x.fillStyle=`rgba(${v},${v},${v+4},${rnd(.5)})`;x.fillRect(rnd(w),rnd(h),1+rnd(2),1+rnd(2));}
  x.strokeStyle='rgba(15,15,18,.6)';x.lineWidth=1.5;for(let i=0;i<14;i++){x.beginPath();let px=rnd(w),py=rnd(h);x.moveTo(px,py);for(let j=0;j<8;j++){px+=(rnd()-.5)*60;py+=(rnd()-.5)*60;x.lineTo(px,py);}x.stroke();}});asph.repeat.set(14,14);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(140,140),new THREE.MeshStandardMaterial({map:asph,roughness:.92,color:0x9a9aa0}));ground.rotation.x=-Math.PI/2;ground.position.set(L/2,-.004,0);ground.receiveShadow=true;G.add(ground);
 const X0=-1.6,X1=L+2.2,Z0=W+1.8,k=q>=1?90:48,cw=Math.round((X1-X0)*k),ch=Math.round(2*Z0*k),px=(x,z)=>[(x-X0)*k,(z+Z0)*k];
 const courtT=ctex(cw,ch,(x,w,h)=>{x.fillStyle='#2f3437';x.fillRect(0,0,w,h);x.fillStyle='#1f5a66';x.fillRect(...px(0,-W),(L)*k,2*W*k);
  x.fillStyle='#2a7482';x.beginPath();const H=CT.hoops[0];x.moveTo(...px(L,-C.TC));x.lineTo(...px(H.x-Math.sqrt(C.TR**2-C.TC**2),-C.TC));for(let i=0;i<=40;i++){const t=-Math.atan2(C.TC,Math.sqrt(C.TR**2-C.TC**2))+i/40*2*Math.atan2(C.TC,Math.sqrt(C.TR**2-C.TC**2));x.lineTo(...px(H.x-Math.cos(t)*C.TR,Math.sin(t)*C.TR));}x.lineTo(...px(L,C.TC));x.closePath();x.fill();
  x.fillStyle='#c9503a';x.fillRect(...px(L-C.FTX,-C.KW/2),C.FTX*k,C.KW*k);x.beginPath();x.arc(...px(0,0),C.CR*k,-Math.PI/2,Math.PI/2);x.fill();
  courtLines(x,px,k,'#f2efe6',.06,true);
  x.save();x.translate(...px(L*.38,-W+1.2));x.fillStyle='rgba(242,239,230,.85)';x.font=`${1.1*k|0}px Anton, Impact, sans-serif`;x.textAlign='center';x.fillText('THE CAGE · PIER 9',0,0);x.restore();
  // wear: scuffs and faded paint
  for(let i=0;i<w*h/120;i++){const v=rnd();x.fillStyle=v<.5?`rgba(30,30,32,${rnd(.18)})`:`rgba(200,200,190,${rnd(.06)})`;x.fillRect(rnd(w),rnd(h),1+rnd(3),1+rnd(3));}
  for(let i=0;i<40;i++){const g=x.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(20,20,22,.22)');g.addColorStop(1,'rgba(20,20,22,0)');x.save();x.translate(rnd(w),rnd(h));x.scale(20+rnd(80),10+rnd(40));x.fillStyle=g;x.beginPath();x.arc(0,0,1,0,7);x.fill();x.restore();}});
 const court=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,2*Z0),new THREE.MeshStandardMaterial({map:courtT,roughness:.78,metalness:0,envMapIntensity:.6}));court.rotation.x=-Math.PI/2;court.position.set((X0+X1)/2,0,0);court.receiveShadow=true;G.add(court);out.floor=court;
 // ----- hoop -----
 for(const H of CT.hoops){G.add(makeHoop(H,{street:true,pad:'#1f5a66'}));out.nets.push(H);}
 // ----- chain-link cage (open on the street side) -----
 {const fT=ctex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#c8ccd2';x.lineWidth=3;x.beginPath();x.moveTo(0,h/2);x.lineTo(w/2,0);x.lineTo(w,h/2);x.lineTo(w/2,h);x.closePath();x.stroke();},{});
  const fm=new THREE.MeshStandardMaterial({map:fT,alphaTest:.45,side:THREE.DoubleSide,metalness:.7,roughness:.45,color:0xaab0b8});const postM=new THREE.MeshStandardMaterial({color:0x5c636b,metalness:.7,roughness:.4});
  const FH=4.6,xa=-3.2,xb=L+4.2,zb=W+3.2;const segs=[[xa,-zb,xb,-zb],[xb,-zb,xb,zb],[xb,zb,xa,zb]];const posts=[];
  for(const[x0,z0,x1,z1]of segs){const len=Math.hypot(x1-x0,z1-z0),g=new THREE.PlaneGeometry(len,FH);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setX(i,uv.getX(i)*len/.12);uv.setY(i,uv.getY(i)*FH/.12);}
   const m=new THREE.Mesh(g,fm);m.position.set((x0+x1)/2,FH/2,(z0+z1)/2);m.rotation.y=Math.abs(x1-x0)<.1?Math.PI/2:0;m.castShadow=true;G.add(m);
   const n=Math.ceil(len/3);for(let i=0;i<=n;i++){const t=i/n;posts.push([new THREE.CylinderGeometry(.05,.05,FH+.1,8),M4(x0+(x1-x0)*t,FH/2,z0+(z1-z0)*t)]);}
   posts.push([new THREE.CylinderGeometry(.035,.035,len,6),M4((x0+x1)/2,FH,(z0+z1)/2,0,Math.abs(x1-x0)<.1?0:Math.PI/2,Math.PI/2)]);}
  const pm=new THREE.Mesh(mergeG(posts),postM);pm.castShadow=true;G.add(pm);}
 // ----- surroundings: brick wall with a mural, blocks with lit windows, water towers -----
 {const brick=ctex(512,256,(x,w,h)=>{x.fillStyle='#5a2e22';x.fillRect(0,0,w,h);for(let r=0;r<16;r++)for(let c=0;c<9;c++){const t=rnd();x.fillStyle=`rgb(${120+t*50|0},${52+t*22|0},${38+t*16|0})`;x.fillRect(c*60+(r%2)*30-30+2,r*16+2,56,12);}});brick.repeat.set(3,2);
  const mural=ctex(1024,256,(x,w,h)=>{x.fillStyle='#4a2a22';x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.fillStyle=['#ff4d00','#ffcf3f','#2ad1ff','#ff5fa2','#9cff6a','#7b5cff'][i%6];x.globalAlpha=.75;x.beginPath();x.arc(rnd(w),rnd(h),10+rnd(70),0,7);x.fill();}x.globalAlpha=1;
   x.font='150px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=18;x.strokeStyle='#111';x.strokeText('COURT KINGS',w/2,h/2+6);x.fillStyle='#ffcf3f';x.fillText('COURT KINGS',w/2,h/2);x.lineWidth=4;x.strokeStyle='#ff4d00';x.strokeText('COURT KINGS',w/2,h/2);
   x.fillStyle='rgba(0,0,0,.15)';for(let i=0;i<w;i+=4)x.fillRect(i,0,1,h);});
  const wall=new THREE.Mesh(new THREE.BoxGeometry(L+10,6,.6),[new THREE.MeshStandardMaterial({map:brick,roughness:.9}),new THREE.MeshStandardMaterial({map:brick,roughness:.9}),new THREE.MeshStandardMaterial({map:brick,roughness:.9}),new THREE.MeshStandardMaterial({map:brick,roughness:.9}),new THREE.MeshStandardMaterial({map:mural,roughness:.85}),new THREE.MeshStandardMaterial({map:brick,roughness:.9})]);
  wall.position.set(L/2+.5,3,-(W+6.5));wall.receiveShadow=true;wall.castShadow=true;G.add(wall);
  const winT=ctex(256,512,(x,w,h)=>{x.fillStyle='#2a2c33';x.fillRect(0,0,w,h);for(let r=0;r<24;r++)for(let c=0;c<8;c++){const lit=rnd()<.35;x.fillStyle=lit?`rgb(${230+rnd(25)|0},${180+rnd(50)|0},${110+rnd(40)|0})`:`rgb(${30+rnd(20)|0},${36+rnd(20)|0},${48+rnd(20)|0})`;x.fillRect(c*32+5,r*21+5,22,13);}});
  const bm=[],wm=new THREE.MeshStandardMaterial({map:winT,roughness:.6,emissive:0xffffff,emissiveMap:winT,emissiveIntensity:.55}),roofM=new THREE.MeshStandardMaterial({color:0x26282e,roughness:.8});
  const place=(x,z,w,d,h)=>{const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setX(i,uv.getX(i)*Math.max(1,Math.round(w/6)));uv.setY(i,uv.getY(i)*h/26);}const m=new THREE.Mesh(g,[wm,wm,roofM,roofM,wm,wm]);m.position.set(x,h/2,z);G.add(m);bm.push(m);};
  for(let i=0;i<9;i++)place(-12+i*6.5,-(W+16+rnd(8)),6+rnd(3),8,14+rnd(26));for(let i=0;i<8;i++)place(-10+i*7,W+18+rnd(10),6+rnd(3),8,12+rnd(30));for(let i=0;i<5;i++)place(L+16+rnd(6),-16+i*8,8,7,16+rnd(24));for(let i=0;i<4;i++)place(-26-rnd(8),-14+i*9,8,7,20+rnd(30));
  const tw=new THREE.Group();const tm=new THREE.MeshStandardMaterial({color:0x6b4a32,roughness:.85});tw.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,2.4,16),tm).translateY(2.2));tw.add(new THREE.Mesh(new THREE.ConeGeometry(1.6,1,16),tm).translateY(3.9));
  for(const[x,z]of[[-1,1],[1,-1]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.2,6),roofM);l.position.set(x*.9,.6,z*.9);tw.add(l);}const b0=bm[3];tw.position.set(b0.position.x,b0.geometry.parameters.height,b0.position.z);G.add(tw);}
 // ----- street lamps, string lights -----
 {const poleM=new THREE.MeshStandardMaterial({color:0x2a2e34,metalness:.6,roughness:.5}),lampM=new THREE.MeshBasicMaterial({color:new THREE.Color(6,4.6,2.6)});const glow=ctex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,220,160,1)');g.addColorStop(1,'rgba(255,200,140,0)');x.fillStyle=g;x.fillRect(0,0,64,64);},{clamp:true});
  for(const[x,z]of[[-4.5,-W-4],[-4.5,W+4],[L+5.5,-W-4],[L+5.5,W+4],[L*.5,W+4.6]]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,7,8),poleM);p.position.set(x,3.5,z);p.castShadow=true;G.add(p);const h=new THREE.Mesh(new THREE.BoxGeometry(.8,.18,.35),lampM);h.position.set(x+(x<L/2?.4:-.4),7,z);G.add(h);
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));sp.scale.set(3,3,1);sp.position.copy(h.position);G.add(sp);}
  const bulbs=[];for(let j=0;j<4;j++){const z0=-W-3.2,z1=W+3.2,x=1.5+j*3.6;for(let i=0;i<=22;i++){const t=i/22,z=z0+(z1-z0)*t,y=6.2-Math.sin(t*Math.PI)*1.2;bulbs.push([new THREE.SphereGeometry(.07,6,4),M4(x,y,z)]);}}
  G.add(new THREE.Mesh(mergeG(bulbs),new THREE.MeshBasicMaterial({color:new THREE.Color(5,3.6,1.8)})));}
 // ----- bleachers + crowd along the fence -----
 {const bl=new THREE.Group(),bM=new THREE.MeshStandardMaterial({color:0x8a9098,metalness:.6,roughness:.5});for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(9,.08,.5),bM);s.position.set(L*.45,.45+i*.45,W+4.2+i*.6);s.castShadow=true;bl.add(s);}G.add(bl);
  const den=o.crowd??1,pts=[],seat=[];for(let i=0;i<4;i++)for(let j=0;j<16;j++){if(rnd()>den*.85)continue;seat.push([L*.45-4.2+j*.56+rnd(.1),.49+i*.45,W+4.25+i*.6,Math.PI,null]);}
  for(let i=0;i<60*den;i++){const side=rnd()<.5;const x=side?-1+rnd(L+4):L+4.8+rnd(1.6),z=side?-(W+3.9+rnd(1.6)):-W+rnd(2*W);pts.push([x,0,z,side?0:-Math.PI/2+(rnd()-.5),null]);}
  const K=o.kits;const cols=()=>{const r=rnd();return r<.3?[K[0].c1,1]:r<.55?[K[1].c1,2]:[PAL[rnd(PAL.length)|0],0];};
  if(pts.length)G.add(crowdMesh(out,pts,cols,true));if(seat.length)G.add(crowdMesh(out,seat,cols,false));out.crowdN=pts.length+seat.length;}
 out.update=(dt)=>{out.time.value+=dt;for(const H of CT.hoops){if(!H.rim)continue;H.flex=Math.max(0,H.flex-dt*3);H.rim.rotation.z=-H.s*H.flex*.18;H.swish=Math.max(0,H.swish-dt*1.6);H.net.u.uSw.value=H.swish;H.net.u.uT.value=out.time.value;H.net.u.uFx.value=H.flex;}};
 out.dispose=()=>disposeG(scene,G);return out;}
