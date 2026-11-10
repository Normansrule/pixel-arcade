// GLOSS RIOT — dresses a map: procedural sky dome with clouds (also baked into the reflection environment), sun + soft
// shadows, an animated harbour sea or a city backdrop, lamps, buoys, spawn pads and the glossy ink level itself.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,ctex,rng} from './util.js';

const C=c=>new THREE.Color(c);
export const THEMES={
 pier:{skyTop:'#2f86ff',skyHor:'#c8f0ff',sunCol:'#fff4e0',sunDir:[-.45,.78,.42],sun:2.7,hemi:['#d8ecff','#8a7f70',1.05],fog:['#bfe6ff',.0016],exp:.92,bloom:.28,thr:.92,sat:1.22,tint:'#fffaf2',ground:null,
  pal:{floor:'#a8a49e',deck:'#b9854f',tower:'#e8e2d4',trim:'#ffc12e',ramp:'#c4bcb0',base:'#7d8aa6',rail:'#2e3346',ledge:'#d9c39a',block:'#5fc4d8',pillar:'#f08cab',crate:'#ffc54d',crate2:'#a48cff',wall:'#6fd08a'},
  bld:['#ff7a6a','#ffc13a','#4fb8f0','#9a7cff','#5fd690','#ff8ac4','#f2ebdc']},
 park:{skyTop:'#5a4cd8',skyHor:'#ffc49a',sunCol:'#ffd6a8',sunDir:[.55,.42,-.5],sun:2.6,hemi:['#ffd9c8','#6a5a78',1.0],fog:['#f4b8a0',.0018],exp:.95,bloom:.32,thr:.9,sat:1.2,tint:'#fff4ec',ground:'#8f8a9c',
  pal:{floor:'#9f9aa3',bowl:'#7f7a96',ramp:'#c9c0bb',base:'#7a86a8',deck:'#c09060',ledge:'#d6c29e',fun:'#ffb070',block:'#62b8ea',pillar:'#ee86b4',crate:'#ffcc4a',crate2:'#a78bff',wall:'#74d495',outer:'#b8a6d8'},
  bld:['#ff6f90','#ffb43a','#58b4ff','#8f72ff','#5fd69a','#ff82c0','#efe0ff']}};

// grayscale detail textures (vertex colours tint them)
function detailTex(kind){return ctex(512,512,(x,w,h)=>{const r=rng(kind==='floor'?3:9);x.fillStyle='#f4f4f4';x.fillRect(0,0,w,h);
 for(let i=0;i<9000;i++){const v=225+r()*30|0;x.fillStyle=`rgba(${v},${v},${v},.5)`;x.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);}
 if(kind==='floor'){x.strokeStyle='rgba(120,120,130,.55)';x.lineWidth=3;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(i*w/2,0);x.lineTo(i*w/2,h);x.stroke();x.beginPath();x.moveTo(0,i*h/2);x.lineTo(w,i*h/2);x.stroke();}
  x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=2;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(i*w/2+3,0);x.lineTo(i*w/2+3,h);x.stroke();x.beginPath();x.moveTo(0,i*h/2+3);x.lineTo(w,i*h/2+3);x.stroke();}
  for(let k=0;k<4;k++){x.fillStyle='rgba(150,150,160,.5)';const cx=(k%2)*w/2+w/4,cy=(k>>1)*h/2+h/4;x.beginPath();x.arc(cx,cy,5,0,7);x.fill();}}
 else{x.strokeStyle='rgba(110,110,120,.5)';x.lineWidth=3;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke();}x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=2;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*h/4+3);x.lineTo(w,i*h/4+3);x.stroke();}
  for(let i=0;i<4;i++)for(let j=0;j<8;j++){x.fillStyle='rgba(140,140,150,.45)';x.beginPath();x.arc(j*w/8+w/16,i*h/4+10,3,0,7);x.fill();}}});}

// building facades: one storey, two bays per tile; the wall is light grey so each building's vertex colour tints it,
// and the windows are dark glass with frames, sills and the odd blind. A matching roughness map keeps glass glossy.
function facadeTex(){const draw=(rough)=>(x,w,h)=>{const r=rng(rough?41:41);x.fillStyle=rough?'#e6e6e6':'#efeae2';x.fillRect(0,0,w,h);
  if(!rough){for(let i=0;i<2600;i++){const v=200+r()*50|0;x.fillStyle=`rgba(${v},${v-4},${v-10},.35)`;x.fillRect(r()*w,r()*h,2,2);}
   x.fillStyle='rgba(0,0,0,.10)';x.fillRect(0,h-14,w,14);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(0,h-16,w,2);}
  for(let b=0;b<2;b++){const x0=b*w/2+22,y0=34,ww=w/2-44,hh=h-84;const r2=rng(7+b);
   if(!rough){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(x0-6,y0-6,ww+12,hh+12);x.fillStyle='#f6f2ea';x.fillRect(x0-4,y0-4,ww+8,hh+8);
    const g=x.createLinearGradient(x0,y0,x0+ww,y0+hh);g.addColorStop(0,'#24384c');g.addColorStop(.55,'#3a5a74');g.addColorStop(1,'#1c2a3a');x.fillStyle=g;x.fillRect(x0,y0,ww,hh);
    if(b===1){x.fillStyle='#d9cdb4';x.fillRect(x0,y0,ww,hh*.38);x.fillStyle='rgba(0,0,0,.15)';for(let k=0;k<6;k++)x.fillRect(x0,y0+k*hh*.38/6,ww,2);}
    x.fillStyle='#f6f2ea';x.fillRect(x0+ww/2-3,y0,6,hh);x.fillRect(x0,y0+hh*.45,ww,5);
    x.fillStyle='rgba(255,255,255,.22)';x.beginPath();x.moveTo(x0,y0+hh*.3);x.lineTo(x0+ww*.35,y0);x.lineTo(x0+ww*.55,y0);x.lineTo(x0,y0+hh*.55);x.fill();
    x.fillStyle='#ffffff';x.fillRect(x0-10,y0+hh+4,ww+20,8);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(x0-10,y0+hh+12,ww+20,4);}
   else{x.fillStyle='#262626';x.fillRect(x0,y0,ww,hh);}}};
 return[ctex(256,256,draw(false)),ctex(256,256,draw(true),{srgb:false})];}
// side faces tile one storey (3.4 m) by two bays (6 m) from the ground up; tops sample plain wall
function facadeUV(g,h){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));
  if(ay>.5)uv.setXY(i,.02,.03);else uv.setXY(i,(ax>.5?p.getZ(i):p.getX(i))/6,(p.getY(i)+h/2)/3.4);}uv.needsUpdate=true;return g;}

function skyMat(T){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:C(T.skyTop)},hor:{value:C(T.skyHor)},sun:{value:new V(...T.sunDir).normalize()},sunC:{value:C(T.sunCol)},uT:{value:0}},
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);p.z=p.w*.99995;gl_Position=p;}',
 fragmentShader:`uniform vec3 top,hor,sun,sunC;uniform float uT;varying vec3 vD;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(hor,top,pow(y,.55));c=mix(c,hor*1.05,smoothstep(.02,-.25,d.y));
  float sd=max(dot(d,sun),0.);c+=sunC*(pow(sd,900.)*6.+pow(sd,24.)*.35);
  if(d.y>0.){vec2 uv=d.xz/(d.y+.12)*1.4+vec2(uT*.01,0.);float cl=smoothstep(.5,.78,fbm(uv*.6));float sh=fbm(uv*.6+vec2(.05,.08));vec3 cc=mix(vec3(1.),hor*.85+vec3(.1),smoothstep(.45,.8,sh)*.6);c=mix(c,cc,cl*smoothstep(.0,.18,d.y)*.92);}
  gl_FragColor=vec4(c,1.);}`});}

function waterNormal(){const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),img=x.createImageData(n,n),d=img.data;const r=rng(5);const waves=[];for(let i=0;i<14;i++)waves.push([(r()*6|0)+1,(r()*6|0)-3,r()*6.28,.3+r()*.7]);
 const H=(i,j)=>{let s=0;for(const[a,b,p,amp]of waves)s+=Math.sin((a*i+b*j)/n*Math.PI*2+p)*amp/Math.hypot(a,b);return s;};
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const dx=H(i+1,j)-H(i-1,j),dy=H(i,j+1)-H(i,j-1),l=Math.hypot(dx*3,dy*3,1),k=(j*n+i)*4;d[k]=(-dx*3/l*.5+.5)*255;d[k+1]=(-dy*3/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}

export function buildScene(D,paint,R,gfx){const T=THEMES[D.def.theme],root=new THREE.Group();const S={root,theme:T,spawnPads:[],anim:[]};
 // sky + environment
 const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),skyMat(T));sky.frustumCulled=false;sky.renderOrder=-10;root.add(sky);S.sky=sky;
 {const es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),skyMat(T)));const fl=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshBasicMaterial({color:C(T.pal.floor).multiplyScalar(.7)}));fl.rotation.x=-Math.PI/2;fl.position.y=-2;es.add(fl);
  const pm=new THREE.PMREMGenerator(R);S.env=pm.fromScene(es,.02).texture;pm.dispose();}
 S.fog=new THREE.FogExp2(C(T.fog[0]),T.fog[1]);
 const hemi=new THREE.HemisphereLight(C(T.hemi[0]),C(T.hemi[1]),T.hemi[2]);root.add(hemi);
 const sun=new THREE.DirectionalLight(C(T.sunCol),T.sun);const sd=new V(...T.sunDir).normalize();const b=D.def.bounds,ext=Math.max(b[1]-b[0],b[3]-b[2])*.62;
 sun.position.copy(sd).multiplyScalar(80);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:10,far:180});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;
 root.add(sun,sun.target);S.sun=sun;
 // the paintable level
 const[fm,wm]=paint.build(T.pal,{floor:detailTex('floor'),wall:detailTex('wall')});root.add(fm,wm);S.level=[fm,wm];
 const R0=rng(D.def.seed+5);
 // backdrop: colourful skyline / islands, merged
 const bl=[];const ring=(n,r0,r1,hmin,hmax)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2+R0()*.1,r=r0+R0()*(r1-r0),w=8+R0()*14,d=8+R0()*12,h=hmin+R0()*(hmax-hmin);const x=Math.cos(a)*r,z=Math.sin(a)*r*1.25;
   const c=C(T.bld[i%T.bld.length]);fc.push([facadeUV(new THREE.BoxGeometry(w,h,d),h),M4(x,h/2-6,z,0,-a,0),c]);
   // parapet, a stair head and rooftop kit: water tank on legs, air-con boxes, an aerial
   const top=h-6,rot=-a,pt=(u,v)=>{const ca=Math.cos(rot),sa=Math.sin(rot);return[x+u*ca+v*sa,z-u*sa+v*ca];};
   bl.push([new THREE.BoxGeometry(w+.3,.6,d+.3),M4(x,top+.3,z,0,rot,0),c.clone().multiplyScalar(.82)]);
   {const[sx,sz]=pt(-w*.22,d*.2);bl.push([new THREE.BoxGeometry(w*.3,2.2,d*.28),M4(sx,top+1.1,sz,0,rot,0),c.clone().multiplyScalar(.7)]);}
   if(R0()<.55){const[tx,tz]=pt(w*.2,-d*.18);for(const[lx,lz]of[[-.8,-.8],[.8,-.8],[-.8,.8],[.8,.8]])bl.push([new THREE.CylinderGeometry(.08,.08,1.8,5),M4(tx+lx,top+.9,tz+lz),C('#4a3a30')]);
    bl.push([new THREE.CylinderGeometry(1.25,1.25,2.6,14),M4(tx,top+3.1,tz),C('#8a6a4a')],[new THREE.ConeGeometry(1.35,1,14),M4(tx,top+4.9,tz),C('#5a4a40')]);}
   for(let k=0;k<2;k++)if(R0()<.6){const[ax2,az2]=pt((R0()-.5)*w*.6,(R0()-.5)*d*.6);bl.push([new THREE.BoxGeometry(1.4,.9,1),M4(ax2,top+.45+.3,az2,0,rot,0),C('#c8ccd2')]);}
   if(R0()<.35){const[ex,ez]=pt(-w*.3,-d*.3);bl.push([new THREE.CylinderGeometry(.05,.07,6,4),M4(ex,top+3,ez),C('#cfd3d8')]);}
   // shopfront band with an awning at street level on the larger blocks
   if(h>16&&R0()<.7){const[fx,fz]=pt(0,-d/2-.6);bl.push([new THREE.BoxGeometry(w*.86,.25,1.4),M4(fx,-6+3.9,fz,-.25,rot,0),C(T.bld[(i+3)%T.bld.length])]);}}};
 const fc=[];
 if(D.def.theme==='pier'){ring(22,95,150,10,46);{const g=new THREE.RingGeometry(88,175,64,1);g.rotateX(-Math.PI/2);g.scale(1,1,1.25);bl.push([g,M4(0,-.6,0),C('#e8d6a8')]);}
  for(let i=0;i<7;i++){const a=R0()*6.28,r=70+R0()*40,x=Math.cos(a)*r,z=Math.sin(a)*r*1.3;if(Math.abs(x)<40&&Math.abs(z)<60)continue;bl.push([new THREE.ConeGeometry(10+R0()*10,8+R0()*8,9),M4(x,-1,z),C('#6fc48a')]);}
  // palms along the beach ring, leaning out to sea
  for(let i=0;i<34;i++){const a=i/34*Math.PI*2+R0()*.12,r=91+R0()*7,x=Math.cos(a)*r,z=Math.sin(a)*r*1.25,lean=.12+R0()*.14,hgt=6+R0()*3.5;const ox=Math.cos(a)*lean,oz=Math.sin(a)*lean;
   for(let k=0;k<5;k++){const t=k/5;bl.push([new THREE.CylinderGeometry(.26-t*.07,.3-t*.07,hgt/5+.05,7),M4(x+ox*hgt*t*t,-.6+hgt*(t+.1),z+oz*hgt*t*t,oz*1.2,0,-ox*1.2),C(k%2?'#8a6a48':'#7a5a3c')]);}
   const tx=x+ox*hgt,tz=z+oz*hgt,ty=-.6+hgt*1.08;for(let f=0;f<7;f++){const fa=f/7*Math.PI*2+R0();bl.push([new THREE.BoxGeometry(3.4,.06,.75),M4(tx+Math.cos(fa)*1.5,ty-.35,tz+Math.sin(fa)*1.5,0,-fa,-.38),C(f%2?'#3f9a52':'#4fae5e')]);}
   bl.push([new THREE.SphereGeometry(.38,8,6),M4(tx,ty-.2,tz),C('#6a4a2a')]);}
  // moored sailboats between the pier and the beach, bobbing
  for(let i=0;i<9;i++){const a=R0()*6.28,r=58+R0()*24,x=Math.cos(a)*r,z=Math.sin(a)*r*1.25;if(Math.abs(x)<44&&Math.abs(z)<64)continue;const g=new THREE.Group(),hc=C(T.bld[i%T.bld.length]);
   g.add(new THREE.Mesh(merge([[new THREE.BoxGeometry(1.6,.7,4.6),M4(0,.1,0),C('#f4f1ea')],[new THREE.ConeGeometry(.8,1.4,4),M4(0,.1,2.9,Math.PI/2,Math.PI/4,0,1,1,.7),C('#f4f1ea')],[new THREE.BoxGeometry(1.64,.18,4.64),M4(0,-.12,0),hc],
    [new THREE.CylinderGeometry(.05,.06,6.5,5),M4(0,3.6,.3),C('#d8d8d8')],[new THREE.BoxGeometry(.6,.4,1.2),M4(0,.65,-.9),C('#d0c8b8')]]),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5})));
   const sail=new THREE.BufferGeometry();sail.setAttribute('position',new THREE.Float32BufferAttribute([0,.8,.45,0,6.6,.45,0,.9,-1.9],3));sail.computeVertexNormals();
   g.add(new THREE.Mesh(sail,new THREE.MeshStandardMaterial({color:i%3?0xffffff:hc,roughness:.8,side:THREE.DoubleSide})));
   g.position.set(x,(D.water??-1)+.2,z);g.rotation.y=R0()*6.28;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});root.add(g);const ph=R0()*6.28;
   S.anim.push(t=>{g.position.y=(D.water??-1)+.2+Math.sin(t*1.1+ph)*.12;g.rotation.z=Math.sin(t*.9+ph)*.05;g.rotation.x=Math.sin(t*.7+ph)*.03;});}
  // lighthouse
  for(let k=0;k<6;k++)bl.push([new THREE.CylinderGeometry(2.2-k*.18,2.4-k*.18,3,16),M4(46,-1+k*3+1.5,-70),C(k%2?'#ffffff':'#ff5a5a')]);bl.push([new THREE.CylinderGeometry(1.6,1.6,2.4,12),M4(46,18.2,-70),C('#ffe9a0')]);bl.push([new THREE.ConeGeometry(2,2,12),M4(46,20.4,-70),C('#ff5a5a')]);}
 else{ring(26,60,120,14,60);
  for(let i=0;i<40;i++){const a=i/40*6.28,r=40+R0()*10,x=Math.cos(a)*r,z=Math.sin(a)*r*1.15;bl.push([new THREE.CylinderGeometry(.3,.4,3,6),M4(x,-.5,z),C('#7a5a48')]);bl.push([new THREE.SphereGeometry(2.4,10,8),M4(x,2.8,z,0,0,0,1,1.25,1),C(i%3?'#7ccf8a':'#a8d870')]);}}
 const bm=new THREE.Mesh(merge(bl),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}));bm.castShadow=true;root.add(bm);
 if(fc.length){const[fm2,fr]=facadeTex();fm2.anisotropy=8;const fmesh=new THREE.Mesh(merge(fc),new THREE.MeshStandardMaterial({vertexColors:true,map:fm2,roughnessMap:fr,roughness:1,metalness:.05,envMapIntensity:1.1}));root.add(fmesh);}
 // windows on the skyline: emissive-ish dots via a second merged mesh would be heavy; a fog-tinted face texture suffices
 if(T.ground){const g=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:C(T.ground),roughness:.9}));g.rotation.x=-Math.PI/2;g.position.y=-2.05;g.receiveShadow=true;root.add(g);}
 // sea
 if(D.water!=null){const wn=waterNormal();wn.repeat.set(60,60);const wm2=new THREE.MeshStandardMaterial({color:C('#1fb8c8'),roughness:.12,metalness:.1,normalMap:wn,normalScale:new THREE.Vector2(.45,.45),transparent:true,opacity:.92,envMapIntensity:1.2});
  const w=new THREE.Mesh(new THREE.PlaneGeometry(700,700),wm2);w.rotation.x=-Math.PI/2;w.position.y=D.water;w.receiveShadow=true;root.add(w);S.water=w;S.anim.push(t=>{wn.offset.set(t*.006,t*.004);});
  // pier pilings under the slabs
  const pl=[];for(const s of D.solids){if(s.mat!=='floor'&&s.mat!=='deck'&&s.mat!=='base')continue;for(let x=s.a[0]+1;x<s.b[0];x+=4)for(const z of[s.a[2]+.4,s.b[2]-.4])pl.push([new THREE.CylinderGeometry(.35,.4,6,8),M4(x,s.a[1]-2,z),C('#7a5638')]);}
  if(pl.length){const pm=new THREE.Mesh(merge(pl),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}));root.add(pm);}}
 // props
 const pm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.2});const pr=[];
 for(const p of D.props){const y=p.y??0;
  if(p.type==='lamp'){pr.push([new THREE.CylinderGeometry(.12,.16,5,8),M4(p.x,y+2.5,p.z),C('#3a3f52')],[new THREE.SphereGeometry(.45,14,10),M4(p.x,y+5.2,p.z),C('#fff6d8')],[new THREE.CylinderGeometry(.5,.3,.3,10),M4(p.x,y+4.85,p.z),C('#3a3f52')]);}
  else if(p.type==='buoy'){const g=new THREE.Group();g.add(new THREE.Mesh(merge([[new THREE.SphereGeometry(.7,14,10),M4(0,0,0,0,0,0,1,.7,1),C('#ff4a4a')],[new THREE.CylinderGeometry(.72,.72,.25,14),M4(0,.15,0),C('#ffffff')],[new THREE.CylinderGeometry(.06,.06,1.4,6),M4(0,.8,0),C('#ffffff')]]),pm));g.position.set(p.x,y,p.z);root.add(g);S.anim.push(t=>{g.position.y=y+Math.sin(t*1.6+p.x)*.12;g.rotation.z=Math.sin(t*1.3+p.z)*.08;});}
  else if(p.type==='spawnpad'){const g=new THREE.Group();g.position.set(p.x,p.y+.02,p.z);const ringM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false});
   const disc=new THREE.Mesh(new THREE.CircleGeometry(4.2,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));disc.rotation.x=-Math.PI/2;g.add(disc);
   const rg=new THREE.Mesh(new THREE.RingGeometry(3.9,4.2,48),ringM);rg.rotation.x=-Math.PI/2;rg.position.y=.01;g.add(rg);const rg2=new THREE.Mesh(new THREE.RingGeometry(2.2,2.4,40),ringM);rg2.rotation.x=-Math.PI/2;rg2.position.y=.01;g.add(rg2);
   root.add(g);S.spawnPads.push({g,team:p.team,mats:[disc.material,ringM]});S.anim.push(t=>{rg2.scale.setScalar(1+Math.sin(t*2)*.08);});}}
 if(pr.length){const m=new THREE.Mesh(merge(pr),pm);m.castShadow=true;root.add(m);}
 S.update=t=>{sky.material.uniforms.uT.value=t;for(const f of S.anim)f(t);};
 S.recolor=cols=>{for(const s of S.spawnPads){const c=C(cols[s.team]);s.mats[0].color.copy(c);s.mats[1].color.copy(c).multiplyScalar(1.4);}};
 return S;}
