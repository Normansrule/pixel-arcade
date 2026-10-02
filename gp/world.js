// KART GRAND PRIX — world visuals: sky, light, water/lava, terrain, road, walls, ramps, pads, boxes, coins, hazards, props.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,sstep,rng,ctex,merge,M,lumpy,fbm,noise2} from './util.js';
import {query,at,F,SURF,STEP} from './trackmath.js';

const FOGV='\n#include <fog_pars_vertex>\n',FOGF='\n#include <fog_pars_fragment>\n';
function fogMat(o){return new THREE.ShaderMaterial({...o,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,o.uniforms||{}]),fog:true});}

/* ================= textures ================= */
function noiseCanvas(x,w,h,base,spread,n=6000,sz=2){x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){const v=(Math.random()-.5)*spread;x.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;x.fillRect(Math.random()*w,Math.random()*h,sz,sz);}}
export function roadTex(style){
 let emissive=null,o={rough:.85,metal:0,color:0xffffff};
 const map=ctex(512,512,(x,w,h)=>{
  if(style==='asphalt'){noiseCanvas(x,w,h,'#55565e',.18,30000);x.fillStyle='rgba(255,255,255,.85)';x.fillRect(14,0,8,h);x.fillRect(w-22,0,8,h);x.fillStyle='rgba(255,220,120,.75)';x.fillRect(w/2-4,0,8,h*.45);}
  else if(style==='stone'){noiseCanvas(x,w,h,'#8a8a78',.12,8000);for(let r=0;r<8;r++)for(let c=0;c<6;c++){const ox=(r%2)*42;x.fillStyle=`hsl(${55+Math.random()*30},${12+Math.random()*12}%,${42+Math.random()*14}%)`;x.fillRect(c*86+ox-40+3,r*64+3,80,58);}x.fillStyle='rgba(60,110,40,.35)';for(let i=0;i<220;i++)x.fillRect(Math.random()*w,Math.random()*h,6+Math.random()*14,3);}
  else if(style==='packed'){noiseCanvas(x,w,h,'#d8e4f0',.12,20000);x.fillStyle='rgba(120,140,170,.18)';for(const c of[.25,.32,.68,.75])x.fillRect(c*w,0,18,h);}
  else if(style==='clay'){noiseCanvas(x,w,h,'#b87848',.16,26000);x.fillStyle='rgba(90,50,30,.22)';for(const c of[.28,.36,.64,.72])x.fillRect(c*w,0,16,h);x.fillStyle='rgba(255,255,255,.7)';x.fillRect(12,0,7,h);x.fillRect(w-19,0,7,h);}
  else if(style==='neon'){noiseCanvas(x,w,h,'#1c1c28',.1,20000);x.strokeStyle='rgba(80,90,130,.5)';x.lineWidth=2;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*w/8,0);x.lineTo(i*w/8,h);x.stroke();x.beginPath();x.moveTo(0,i*h/8);x.lineTo(w,i*h/8);x.stroke();}}
  else if(style==='basalt'){noiseCanvas(x,w,h,'#38302e',.2,30000);x.strokeStyle='#120a08';x.lineWidth=3;for(let i=0;i<30;i++){x.beginPath();let px=Math.random()*w,py=Math.random()*h;x.moveTo(px,py);for(let k=0;k<5;k++){px+=(Math.random()-.5)*80;py+=(Math.random()-.5)*80;x.lineTo(px,py);}x.stroke();}}
  else if(style==='cobble'){x.fillStyle='#2a2830';x.fillRect(0,0,w,h);for(let r=0;r<16;r++)for(let c=0;c<16;c++){const l=30+Math.random()*16;x.fillStyle=`hsl(${250+Math.random()*30},10%,${l}%)`;x.beginPath();x.ellipse(c*32+16+(r%2)*16,r*32+16,13+Math.random()*2,12,Math.random(),0,7);x.fill();}}
  else if(style==='glass'){const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#e8e0ff');g.addColorStop(.5,'#fff8f0');g.addColorStop(1,'#e8e0ff');x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle='rgba(180,150,90,.6)';x.lineWidth=4;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke();}x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.stroke();}
 });
 if(style==='neon'){emissive=ctex(512,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#16e0ff';x.fillRect(10,0,6,h);x.fillRect(w-16,0,6,h);x.fillStyle='#ff2a9a';for(let i=0;i<4;i++)x.fillRect(w/2-3,i*h/4,6,h/8);});o.rough=.35;o.metal=.3;}
 if(style==='basalt'){emissive=ctex(512,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.strokeStyle='#ff4a10';x.lineWidth=3;x.shadowColor='#ff6a20';x.shadowBlur=8;for(let i=0;i<14;i++){x.beginPath();let px=Math.random()*w,py=Math.random()*h;x.moveTo(px,py);for(let k=0;k<4;k++){px+=(Math.random()-.5)*70;py+=(Math.random()-.5)*70;x.lineTo(px,py);}x.stroke();}});}
 if(style==='glass'){emissive=ctex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#ffb040';x.fillRect(0,h/2-2,w,4);x.fillRect(4,0,4,h);x.fillRect(w-8,0,4,h);});o.rough=.25;o.metal=.1;}
 if(style==='stone'||style==='cobble')o.rough=.92;if(style==='packed')o.rough=.7;
 return{map,emissive,...o};}
let _ground=null;
function groundTex(){return _ground||(_ground=ctex(256,256,(x,w,h)=>{noiseCanvas(x,w,h,'#9a9a9a',.25,9000,3);for(let i=0;i<500;i++){x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.025)`;x.beginPath();x.arc(Math.random()*w,Math.random()*h,4+Math.random()*12,0,7);x.fill();}}));}
function stripeTex(c1,c2){return ctex(64,64,(x,w,h)=>{x.fillStyle=c1;x.fillRect(0,0,w,h);x.fillStyle=c2;x.fillRect(0,0,w,h/2);});}
const hex=c=>'#'+new THREE.Color(c).getHexString();

/* ================= ribbon geometry along a branch ================= */
function runs(B,ok){// contiguous index runs where ok(i)
 const out=[];let cur=null;for(let i=0;i<B.n;i++){if(ok(i)){if(!cur){cur=[i,i];out.push(cur);}else cur[1]=i;}else cur=null;}
 if(B.closed&&out.length>1&&out[0][0]===0&&out[out.length-1][1]===B.n-1){const l=out.pop();out[0]=[l[0],out[0][1]+B.n];}
 else if(B.closed&&out.length===1&&out[0][0]===0&&out[0][1]===B.n-1)out[0]=[0,B.n];
 return out;}
function ribbon(B,rs,prof,yOff,tile){// prof: array of u offsets (functions of i allowed), returns geometry with uv
 const pos=[],uv=[],idx=[];let base=0;
 for(const[a,b]of rs){const cnt=b-a+1;for(let k=a;k<=b;k++){const i=k%B.n;for(let j=0;j<prof.length;j++){const u=typeof prof[j]==='function'?prof[j](i):prof[j],yo=typeof yOff==='function'?yOff(i,j):yOff;pos.push(B.x[i]+B.nx[i]*u,B.y[i]+yo,B.z[i]+B.nz[i]*u);uv.push(j/(prof.length-1),(B.s[i]+(k>=B.n?B.len:0))/tile);}}
  for(let k=0;k<cnt-1;k++)for(let j=0;j<prof.length-1;j++){const o=base+k*prof.length+j;idx.push(o,o+prof.length,o+1,o+1,o+prof.length,o+prof.length+1);}base+=cnt*prof.length;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}

/* ================= sky dome ================= */
function sky(T){const U={uTop:{value:new THREE.Color(T.sky[0])},uHor:{value:new THREE.Color(T.sky[1])},uSun:{value:new V(...T.sun).normalize()},uSunC:{value:new THREE.Color(T.sunC)},uNight:{value:T.night?1:0},uT:{value:0},uCloud:{value:T.night?.25:.8}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:U,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunC;uniform float uNight,uT,uCloud;varying vec3 vD;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.1;a*=.5;}return s;}
  void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uTop,pow(smoothstep(-.02,.65,y),.75));c=mix(c,uHor*.85,smoothstep(0.,-.25,y));
   float sd=max(0.,dot(d,uSun));c+=uSunC*(pow(sd,900.)*18.+pow(sd,24.)*.35+pow(sd,4.)*.12)*(1.-uNight*.6);
   if(y>0.){vec2 q=d.xz/(y+.12)*1.4+vec2(uT*.006,0.);float cl=smoothstep(.48,.85,fb(q))*uCloud*smoothstep(0.,.18,y);c=mix(c,mix(vec3(1.),uHor,.25)*(1.-uNight*.85)+uSunC*pow(sd,6.)*.4,cl*.85);
    if(uNight>.5){vec2 g=floor(d.xz/(y+.3)*180.);float s=step(.996,h(g))*smoothstep(.05,.4,y);c+=vec3(s)*(.6+.4*sin(uT*3.+h(g)*40.));}}
   gl_FragColor=vec4(c,1.);}`}));
 m.renderOrder=-10;m.frustumCulled=false;m.userData.U=U;return m;}

/* ================= water + lava + cloud sea ================= */
function water(y,col,T){const U={uT:{value:0},uC:{value:new THREE.Color(col)},uSky:{value:new THREE.Color(T.sky[1])},uSun:{value:new V(...T.sun).normalize()},uSunC:{value:new THREE.Color(T.sunC)}};
 const m=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000,1,1).rotateX(-Math.PI/2),fogMat({uniforms:U,transparent:true,side:THREE.DoubleSide,
  vertexShader:`varying vec3 vW;${FOGV}void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float uT;uniform vec3 uC,uSky,uSun,uSunC;varying vec3 vW;${FOGF}
  void main(){vec2 p=vW.xz;float a=sin(p.x*.21+uT*1.3)*.5+sin(p.y*.17-uT*1.1)*.5+sin((p.x+p.y)*.43+uT*2.)*.25+sin((p.x-p.y)*.9-uT*2.6)*.12;
   vec3 nn=normalize(vec3(cos(p.x*.21+uT*1.3)*.1+cos((p.x+p.y)*.43+uT*2.)*.1+cos((p.x-p.y)*.9-uT*2.6)*.1,1.,cos(p.y*.17-uT*1.1)*.1+cos((p.x+p.y)*.43+uT*2.)*.1-cos((p.x-p.y)*.9-uT*2.6)*.1));
   vec3 v=normalize(cameraPosition-vW);float fr=pow(1.-max(0.,dot(nn,v)),3.);vec3 c;float al;
   if(gl_FrontFacing){vec3 r=reflect(-v,nn);float sp=pow(max(0.,dot(r,uSun)),120.)*3.;c=mix(uC*(.8+a*.1),uSky,fr*.7)+uSunC*sp;al=mix(.62,.96,fr);}
   else{c=uC*.55+vec3(.2,.5,.6)*pow(max(0.,a),3.);al=.75;}
   gl_FragColor=vec4(c,al);
   #include <fog_fragment>
  }`}));m.position.y=y;m.renderOrder=2;m.userData.U=U;return m;}
function lava(y){const U={uT:{value:0}};const m=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000,1,1).rotateX(-Math.PI/2),fogMat({uniforms:U,
 vertexShader:`varying vec3 vW;${FOGV}void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,
 fragmentShader:`uniform float uT;varying vec3 vW;${FOGF}
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 p=vW.xz*.05;float s=n(p+vec2(uT*.05,uT*.03))*.5+n(p*2.3-vec2(uT*.08,0.))*.3+n(p*5.1+uT*.1)*.2;float crust=smoothstep(.42,.62,s);
  vec3 hot=mix(vec3(1.5,.38,.05),vec3(2.2,1.,.2),smoothstep(.2,.0,abs(s-.35)));vec3 c=mix(hot,vec3(.09,.05,.04),crust);gl_FragColor=vec4(c,1.);
  #include <fog_fragment>
 }`}));m.position.y=y;m.userData.U=U;return m;}
function cloudSea(y){const U={uT:{value:0}};const m=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000,1,1).rotateX(-Math.PI/2),fogMat({uniforms:U,transparent:true,depthWrite:false,
 vertexShader:`varying vec3 vW;${FOGV}void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,
 fragmentShader:`uniform float uT;varying vec3 vW;${FOGF}
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 p=vW.xz*.012+vec2(uT*.01,0.);float s=n(p)*.5+n(p*2.1)*.25+n(p*4.3)*.125+n(p*8.7)*.06;float a=smoothstep(.3,.7,s);
  vec3 c=mix(vec3(.95,.72,.75),vec3(1.,.95,.9),smoothstep(.45,.9,s));gl_FragColor=vec4(c,a*.95+.05);
  #include <fog_fragment>
 }`}));m.position.y=y;m.userData.U=U;return m;}

/* ================= props (instanced, vertex coloured) ================= */
const C3=c=>new THREE.Color(c);
function propGeo(k,r){const L=[],G=[];const add=(g,m,c)=>L.push([g,m,c]),glow=(g,m,c)=>G.push([g,m,c]);
 switch(k){
  case'palm':{let x=0,y=0;for(let i=0;i<6;i++){add(new THREE.CylinderGeometry(.32-.03*i,.38-.03*i,1.3,7),M(x,y+.65,0,0,0,-.08*i),0x8a6a44);x+=.1*i*.5;y+=1.25;}for(let i=0;i<7;i++){const a=i/7*Math.PI*2;add(new THREE.ConeGeometry(.7,4.2,4,1).scale(1,1,.15),M(x+Math.cos(a)*1.7,y-.3,Math.sin(a)*1.7,Math.sin(a)*1.25,0,-Math.cos(a)*1.25,1),i%2?0x2e9a3a:0x3ab84a);}add(new THREE.SphereGeometry(.35,6,5),M(x,y-.2,0),0x6a4a2a);break;}
  case'umbrella':add(new THREE.CylinderGeometry(.06,.06,2.6,5),M(0,1.3,0),0xdddddd);add(new THREE.ConeGeometry(1.6,.7,10,1,true),M(0,2.5,0),0xffffff);add(new THREE.BoxGeometry(.8,.12,1.8),M(.9,.3,0),0xffffff);break;
  case'rock':add(lumpy(new THREE.DodecahedronGeometry(1.4,1),.5,r()*99|0),M(0,.6,0,0,0,0,1,.7,1),0xffffff);break;
  case'hut':add(new THREE.BoxGeometry(3,2.2,3),M(0,1.1,0),0xe8d0a8);add(new THREE.ConeGeometry(2.8,1.8,4),M(0,3.1,0,0,Math.PI/4,0),0xc89a52);add(new THREE.BoxGeometry(.8,1.3,.1),M(0,.65,1.52),0x6a4a2a);break;
  case'lighthouse':for(let i=0;i<5;i++)add(new THREE.CylinderGeometry(1.6-i*.15,1.75-i*.15,2.6,14),M(0,1.3+i*2.6,0),i%2?0xd83a3a:0xffffff);add(new THREE.CylinderGeometry(1.2,1.2,.3,12),M(0,13.2,0),0x333333);glow(new THREE.CylinderGeometry(.8,.8,1.4,10),M(0,14,0),0xfff0a0);add(new THREE.ConeGeometry(1.2,1.2,12),M(0,15.3,0),0xd83a3a);break;
  case'boat':add(new THREE.BoxGeometry(2,1,5).translate(0,.5,0),M(),0xffffff);add(new THREE.CylinderGeometry(.08,.08,6,5),M(0,3.5,0),0x8a6a44);add(new THREE.ConeGeometry(1.4,4.5,3,1).scale(1,1,.08),M(.6,3.8,0),0xfff0e0);break;
  case'jtree':add(new THREE.CylinderGeometry(.6,1.1,9,8),M(0,4.5,0),0x6a4a30);for(let i=0;i<5;i++){const a=i*1.3;add(lumpy(new THREE.IcosahedronGeometry(2.8+r()*1.2,1),.8,i),M(Math.cos(a)*2,9+r()*2,Math.sin(a)*2),i%2?0x2d7a2a:0x3f9a34);}break;
  case'fern':for(let i=0;i<8;i++){const a=i/8*Math.PI*2;add(new THREE.ConeGeometry(.5,3,3,1).scale(1,1,.2),M(Math.cos(a)*.9,.9,Math.sin(a)*.9,Math.sin(a)*1,0,-Math.cos(a)*1),0x4aaa3a);}break;
  case'pillar':add(new THREE.BoxGeometry(2.6,.6,2.6),M(0,.3,0),0xb0a888);add(new THREE.CylinderGeometry(.9,1,7,10),M(0,4,0),0xc8c0a0);add(new THREE.BoxGeometry(2.4,.6,2.4),M(0,7.7,0),0xb0a888);add(lumpy(new THREE.IcosahedronGeometry(.8,1),.4,3),M(.6,8.4,.2,0,0,0,1,.5,1),0x4a8a3a);break;
  case'idol':add(new THREE.BoxGeometry(3,3,3),M(0,1.5,0),0x8a8a70);add(new THREE.BoxGeometry(2.6,2.6,2.6),M(0,4.3,0),0x9a9a7a);add(new THREE.BoxGeometry(2,.5,.3),M(0,4.4,1.4),0x3a3a30);glow(new THREE.BoxGeometry(.5,.4,.2),M(-.6,5,1.35),0x40ffb0);glow(new THREE.BoxGeometry(.5,.4,.2),M(.6,5,1.35),0x40ffb0);break;
  case'pine':add(new THREE.CylinderGeometry(.3,.4,2,6),M(0,1,0),0x5a3a20);for(let i=0;i<4;i++){add(new THREE.ConeGeometry(2.6-i*.5,2.6,8),M(0,2.4+i*1.5,0),0x1e5a3a);add(new THREE.ConeGeometry(2.0-i*.45,1.0,8),M(0,3.2+i*1.5,0),0xf2f6ff);}break;
  case'snowman':add(new THREE.SphereGeometry(1.2,12,10),M(0,1.1,0),0xffffff);add(new THREE.SphereGeometry(.85,12,10),M(0,2.8,0),0xffffff);add(new THREE.SphereGeometry(.6,12,10),M(0,4.1,0),0xffffff);add(new THREE.ConeGeometry(.12,.7,6),M(0,4.1,.75,Math.PI/2,0,0),0xff7a1a);add(new THREE.CylinderGeometry(.5,.5,.6,10),M(0,4.8,0),0x222222);add(new THREE.TorusGeometry(.6,.12,6,12),M(0,3.4,0,Math.PI/2),0xd83a3a);break;
  case'crystal':for(let i=0;i<4;i++)glow(new THREE.OctahedronGeometry(1,0).scale(.6,2.6,.6),M((r()-.5)*2,1.8,(r()-.5)*2,(r()-.5)*.6,r()*3,(r()-.5)*.6,1+r()*.6),0x6ad0ff);break;
  case'cabin':add(new THREE.BoxGeometry(4,2.6,3.2),M(0,1.3,0),0x7a4a2a);add(new THREE.BoxGeometry(4.6,.4,3.8).translate(0,0,0),M(0,3.2,0,0,0,0,1,1,1),0xf4f8ff);add(new THREE.CylinderGeometry(.01,2.6,1.6,4,1),M(0,3.4,0,0,Math.PI/4,0,1.15,1,.9),0xf4f8ff);glow(new THREE.BoxGeometry(.8,.7,.1),M(-.9,1.5,1.62),0xffc860);glow(new THREE.BoxGeometry(.8,.7,.1),M(.9,1.5,1.62),0xffc860);break;
  case'flagpole':add(new THREE.CylinderGeometry(.08,.08,7,5),M(0,3.5,0),0xdddddd);add(new THREE.BoxGeometry(.05,1.2,2),M(0,6.2,1),0xff4d00);break;
  case'cactus':add(new THREE.CylinderGeometry(.55,.6,5,8),M(0,2.5,0),0x3a8a3a);add(new THREE.CylinderGeometry(.4,.4,2,8),M(1,2.4,0,0,0,Math.PI/2),0x3a8a3a);add(new THREE.CylinderGeometry(.4,.4,1.8,8),M(1.6,3.3,0),0x3a8a3a);add(new THREE.CylinderGeometry(.35,.35,1.4,8),M(-.9,2,0,0,0,Math.PI/2),0x3a8a3a);add(new THREE.CylinderGeometry(.35,.35,1.4,8),M(-1.4,2.6,0),0x3a8a3a);glow(new THREE.SphereGeometry(.25,6,5),M(0,5.1,0),0xff6ab0);break;
  case'mesa':for(let i=0;i<4;i++)add(lumpy(new THREE.CylinderGeometry(7-i*.7,7.5-i*.7,5,9),1.2,i+7),M(0,2.5+i*5,0),[0xc0602a,0xd88a4a,0xa84a22,0xe0a060][i]);break;
  case'skull':add(lumpy(new THREE.SphereGeometry(1,10,8),.2,5),M(0,.8,0,0,0,0,1,.8,1.2),0xf0e8d8);add(new THREE.ConeGeometry(.25,1.6,6),M(-.9,1.2,.2,0,0,.9),0xf0e8d8);add(new THREE.ConeGeometry(.25,1.6,6),M(.9,1.2,.2,0,0,-.9),0xf0e8d8);break;
  case'bones':for(let i=0;i<5;i++)add(new THREE.TorusGeometry(2.2-i*.2,.18,5,12,Math.PI),M(0,0,i*1.1-2.2),0xf0e8d8);add(new THREE.CylinderGeometry(.25,.25,5.5,6),M(0,2.2,0,Math.PI/2),0xf0e8d8);break;
  case'tent':add(new THREE.ConeGeometry(3,3.6,6),M(0,1.8,0),0xe8d8b0);add(new THREE.CylinderGeometry(.06,.06,1.2,4),M(0,4,0),0x6a4a2a);add(new THREE.BoxGeometry(.1,.8,1.2),M(0,4.3,.6),0xd83a3a);break;
  case'tower':{const h=1;add(new THREE.BoxGeometry(14,40,14).translate(0,20,0),M(),0x1a1c2c);glow(new THREE.BoxGeometry(14.2,.5,14.2),M(0,40,0),0xff2a9a);glow(new THREE.BoxGeometry(.3,38,.3),M(7,19,7),0x2ae0ff);glow(new THREE.BoxGeometry(.3,38,.3),M(-7,19,7),0x2ae0ff);for(let i=0;i<9;i++)glow(new THREE.BoxGeometry(14.1,.4,14.1),M(0,4+i*4,0),r()<.5?0x8a6aff:0x30406a);break;}
  case'tower2':add(new THREE.CylinderGeometry(6,8,60,8).translate(0,30,0),M(),0x202238);for(let i=0;i<12;i++)glow(new THREE.CylinderGeometry(6.2+(12-i)*.16,6.3+(12-i)*.16,.35,8),M(0,4+i*4.8,0),i%3?0x2ae0ff:0xff2a9a);glow(new THREE.CylinderGeometry(.2,.2,10,4),M(0,65,0),0xff4040);break;
  case'lamp':add(new THREE.CylinderGeometry(.12,.16,7,6),M(0,3.5,0),0x2a2a3a);add(new THREE.BoxGeometry(2,.15,.3),M(.9,7,0),0x2a2a3a);glow(new THREE.BoxGeometry(1.2,.12,.5),M(1.3,6.9,0),0xfff0c0);break;
  case'sign':add(new THREE.CylinderGeometry(.15,.15,6,6),M(0,3,0),0x2a2a3a);glow(new THREE.TorusGeometry(1.4,.15,6,24),M(0,7,0),0xff2a9a);glow(new THREE.TorusGeometry(.8,.15,6,3),M(0,7,0,0,0,Math.PI/2),0x2ae0ff);break;
  case'billboard':add(new THREE.BoxGeometry(.4,8,.4),M(-3,4,0),0x2a2a3a);add(new THREE.BoxGeometry(.4,8,.4),M(3,4,0),0x2a2a3a);add(new THREE.BoxGeometry(9,4.5,.4),M(0,9,0),0x15151f);glow(new THREE.BoxGeometry(8.4,3.9,.1),M(0,9,.25),0xffffff);break;
  case'tree':add(new THREE.CylinderGeometry(.2,.3,3,6),M(0,1.5,0),0x3a2a2a);glow(lumpy(new THREE.IcosahedronGeometry(1.6,1),.3,4),M(0,4,0),0x40ffc0);break;
  case'vrock':add(lumpy(new THREE.DodecahedronGeometry(2,1),.9,r()*99|0),M(0,1,0,0,0,0,1,.8,1),0x2a2224);break;
  case'spire':add(lumpy(new THREE.ConeGeometry(2.2,12,7,4),.8,r()*99|0),M(0,6,0),0x221a1a);glow(new THREE.ConeGeometry(.5,3,5),M(.4,4,1.6,.3,0,0),0xff5a10);break;
  case'ember':glow(lumpy(new THREE.IcosahedronGeometry(1,0),.4,3),M(0,.6,0),0xff4a10);add(lumpy(new THREE.DodecahedronGeometry(1.4,0),.4,4),M(0,.3,0,0,0,0,1.2,.5,1.2),0x1a1214);break;
  case'vent':add(lumpy(new THREE.CylinderGeometry(1.2,3,3,9,2,true),.5,9),M(0,1.5,0),0x2a2224);glow(new THREE.CircleGeometry(1.1,12).rotateX(-Math.PI/2),M(0,2.6,0),0xff6a10);break;
  case'cone':add(lumpy(new THREE.ConeGeometry(120,150,16,6,true),18,4),M(0,40,0),0x2a1e1e);glow(new THREE.CylinderGeometry(22,24,4,16),M(0,113,0),0xff5a10);break;
  case'deadtree':add(new THREE.CylinderGeometry(.35,.7,8,6),M(0,4,0),0x3a3030);for(let i=0;i<5;i++){const a=i*1.9;add(new THREE.CylinderGeometry(.1,.25,4,5),M(Math.cos(a)*1.2,6+i*.4,Math.sin(a)*1.2,Math.sin(a)*.9,0,-Math.cos(a)*.9),0x3a3030);}break;
  case'tomb':add(new THREE.BoxGeometry(1.6,2,.4),M(0,1,0,0,0,(r()-.5)*.3),0x6a6a7a);add(new THREE.CylinderGeometry(.8,.8,.4,12,1,false,0,Math.PI),M(0,2,0,Math.PI/2,0,Math.PI/2),0x6a6a7a);add(new THREE.BoxGeometry(2,.3,2.6),M(0,.15,1.2),0x3a4a3a);break;
  case'lantern':add(new THREE.CylinderGeometry(.1,.12,4,5),M(0,2,0),0x2a2a2a);add(new THREE.BoxGeometry(.7,.9,.7),M(0,4.3,0),0x1a1a1a);glow(new THREE.BoxGeometry(.5,.6,.5),M(0,4.3,0),0x9affc0);break;
  case'pumpkin':add(lumpy(new THREE.SphereGeometry(1,10,8),.15,2),M(0,.75,0,0,0,0,1.2,.8,1.2),0xff7a1a);add(new THREE.CylinderGeometry(.1,.15,.5,5),M(0,1.6,0),0x3a6a2a);glow(new THREE.ConeGeometry(.22,.3,3),M(-.4,.95,1.05,Math.PI/2),0xffd040);glow(new THREE.ConeGeometry(.22,.3,3),M(.4,.95,1.05,Math.PI/2),0xffd040);break;
  case'manor':add(new THREE.BoxGeometry(30,16,18),M(0,8,0),0x3a3448);add(new THREE.ConeGeometry(17,10,4),M(0,21,0,0,Math.PI/4,0,1.25,1,.75),0x1a1622);for(const s of[-1,1]){add(new THREE.CylinderGeometry(3,3,26,8),M(s*16,13,0),0x3a3448);add(new THREE.ConeGeometry(3.8,8,8),M(s*16,30,0),0x1a1622);}for(let i=0;i<10;i++)glow(new THREE.BoxGeometry(1.6,2.4,.2),M(-11+(i%5)*5.5,i<5?5:11,9.1),r()<.6?0xffc860:0x9affc0);break;
  case'crypt':add(new THREE.BoxGeometry(5,4,6),M(0,2,0),0x5a5a68);add(new THREE.ConeGeometry(4.4,2.5,4),M(0,5.2,0,0,Math.PI/4,0,1,1,1.3),0x3a3a48);glow(new THREE.BoxGeometry(1.4,2.4,.1),M(0,1.2,3.02),0x6a5aff);break;
  case'cloud':for(let i=0;i<6;i++)add(new THREE.IcosahedronGeometry(3+r()*3,1),M((r()-.5)*12,(r()-.3)*3,(r()-.5)*6),0xffffff);break;
  case'island':add(lumpy(new THREE.ConeGeometry(9,14,8,3),2.5,r()*99|0),M(0,-7,0,Math.PI),0x8a6a5a);add(lumpy(new THREE.CylinderGeometry(9.5,9.2,1.4,10),1,3),M(0,.4,0),0x6ac85a);add(new THREE.CylinderGeometry(.3,.4,3,6),M(2,2.5,1),0x6a4a30);add(lumpy(new THREE.IcosahedronGeometry(2,1),.5,6),M(2,4.8,1),0x3aa84a);break;
  case'balloon':add(new THREE.SphereGeometry(4,14,12).scale(1,1.2,1),M(0,8,0),0xffffff);add(new THREE.CylinderGeometry(1,.8,1,8),M(0,1.5,0),0x8a6a44);break;
  case'pylon':add(new THREE.CylinderGeometry(.6,1.2,40,8),M(0,-16,0),0xe8e0f0);glow(new THREE.TorusGeometry(2.2,.25,6,20),M(0,4.5,0,Math.PI/2),0xffc040);glow(new THREE.SphereGeometry(.7,10,8),M(0,4.5,0),0xffe090);break;
  case'ring':glow(new THREE.TorusGeometry(9,.5,8,40),M(0,0,0),0xffc040);break;
  case'windmill':add(new THREE.CylinderGeometry(1.2,2,10,8),M(0,5,0),0xf0f0f0);for(let i=0;i<4;i++)add(new THREE.BoxGeometry(.8,7,.2),M(Math.cos(i*Math.PI/2)*3.5,10+Math.sin(i*Math.PI/2)*3.5,1.4,0,0,i*Math.PI/2),0xffd0a0);break;}
 return{solid:L.length?merge(L):null,glow:G.length?merge(G):null};}
const PROP_SIZE={lighthouse:1,boat:.3,manor:1,cone:1,tower:.25,tower2:.25,mesa:.6,island:.5,balloon:.4,ring:.5,windmill:.4,cabin:.4,hut:.5,crypt:.5,billboard:.5};

/* ================= main world builder ================= */
export function buildWorld(R,C,T,opt={}){
 const grp=new THREE.Group(),W={grp,T,C,upd:[],boxes:[],coins:[],haz:[],pads:[],sunTarget:new V()},rnd=rng(opt.seed||7);
 // lights + sky
 const sk=sky(T);grp.add(sk);W.sky=sk;
 const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);grp.add(hemi);
 const sun=new THREE.DirectionalLight(T.sunC,T.sunI);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:400});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;grp.add(sun,sun.target);W.sun=sun;W.sunDir=new V(...T.sun).normalize();
 W.fog=new THREE.FogExp2(T.fog[0],T.fog[1]);W.fogC=new THREE.Color(T.fog[0]);W.fogD=T.fog[1];
 // environment map from the sky
 {const pm=new THREE.PMREMGenerator(R),s=new THREE.Scene();const sk2=sky(T);s.add(sk2);const rt=pm.fromScene(s,0,.1,4000);W.env=rt.texture;pm.dispose();sk2.geometry.dispose();}
 if(C.seaY!==undefined){const w=water(C.seaY,T.sea,T);grp.add(w);W.water=w;W.waterY=C.seaY;}
 if(T.lavaY!==undefined){const l=lava(T.lavaY);grp.add(l);W.lava=l;W.lavaY=T.lavaY;}
 if(T.fall&&!C.arena){const cs=cloudSea(C.main?Math.min(...C.main.y)-38:0);grp.add(cs);W.clouds=cs;}
 if(C.arena)buildArenaMesh(W,C,T,rnd);else buildCourseMesh(W,C,T,rnd,opt);
 return W;}

/* ---------- terrain height ---------- */
function makeHeight(C,T){const M=C.main,seaY=C.seaY;const coarse=[];for(const B of C.branches)for(let i=0;i<B.n;i+=3)coarse.push(B,i);
 const nat=(x,z)=>{switch(T===undefined?'':T.key){
   case'seaside':{const land=6+fbm(x*.008,z*.008)*14;return lerp(land,-14,sstep(150,300,x));}
   case'jungle':return 2+fbm(x*.01,z*.01)*16+Math.max(0,fbm(x*.004+9,z*.004)*40);
   case'snow':return 6+Math.abs(fbm(x*.006,z*.006))*70;
   case'desert':return 2+Math.max(0,fbm(x*.01,z*.01))*10;
   case'city':return 0;
   case'volcano':return -16+Math.abs(fbm(x*.01,z*.01))*30;
   case'haunted':return fbm(x*.012,z*.012)*7;
   default:return 0;}};
 return(x,z)=>{let best=1e18,bB=null,bi=0;for(let k=0;k<coarse.length;k+=2){const B=coarse[k],i=coarse[k+1],d=(B.x[i]-x)**2+(B.z[i]-z)**2;if(d<best){best=d;bB=B;bi=i;}}
  for(let o=-3;o<=3;o++){const i=bB.closed?(bi+o+bB.n)%bB.n:cl(bi+o,0,bB.n-1),d=(bB.x[i]-x)**2+(bB.z[i]-z)**2;if(d<best){best=d;bi=i;}}
  const d=Math.sqrt(best),e=d-(bB.w[bi]+bB.sh[bi]),ty=bB.y[bi],gap=bB.flag[bi]&F.gap,nw=bB.flag[bi]&F.noWall;
  let h=nat(x,z);
  if(T.key==='desert')h+=sstep(10,40,e)*(26+fbm(x*.02,z*.02)*16);// canyon walls
  if(T.key==='city')h=0;
  if(T.key==='volcano'){const ridge=lerp(ty-.4,T.lavaY-6,sstep(1,nw?7:16,e));return e<1?ty-.4:lerp(ridge,h,sstep(25,90,e));}
  if(gap){const pit=ty-55;return e<-bB.sh[bi]-bB.w[bi]*2?pit:lerp(pit,h,sstep(10,50,e));}
  if(e<=.6)return ty-.35;const k=sstep(.6,T.key==='desert'?10:34,e);let v=lerp(ty-.35,h,k);
  if(T.wall!=='none'&&e<6&&!nw)v=Math.max(v,ty-.35+sstep(.6,3,e)*.6);return v;};}

/* ---------- course meshes ---------- */
function buildCourseMesh(W,C,T,rnd,opt){const grp=W.grp,key=T.key,quality=opt.quality??2;
 const rt=roadTex(T.road),shoulderC=key==='city'?0x2a2a34:key==='sky'?0xf8f0ff:T.ground;
 const roadMat=new THREE.MeshStandardMaterial({map:rt.map,roughness:rt.rough,metalness:rt.metal,emissiveMap:rt.emissive,emissive:rt.emissive?0xffffff:0x000000,emissiveIntensity:rt.emissive?(key==='sky'?.6:1.6):0,envMapIntensity:.6});
 const cutRoadMat=roadMat.clone();cutRoadMat.polygonOffset=true;cutRoadMat.polygonOffsetFactor=2;cutRoadMat.polygonOffsetUnits=2;
 const offTex=groundTex(),offCol={[SURF.sand]:0xe8cf90,[SURF.mud]:0x6a4a2a,[SURF.off]:key==='snow'?0xf4f8ff:T.ground,[SURF.ice]:0xbfe6ff,[SURF.oil]:0x1a1024};
 const shMat=new THREE.MeshStandardMaterial({map:offTex,color:shoulderC,roughness:.95});const shMat2=shMat.clone();shMat2.polygonOffset=true;shMat2.polygonOffsetFactor=3;shMat2.polygonOffsetUnits=3;
 const curbMat=new THREE.MeshStandardMaterial({map:stripeTex(hex(T.curb[0]),hex(T.curb[1])),roughness:.6,emissive:key==='city'?0xffffff:0,emissiveMap:key==='city'?stripeTex(hex(T.curb[0]),hex(T.curb[1])):null,emissiveIntensity:key==='city'?1.2:0});
 for(const B of C.branches){const isCut=B.kind==='cut',ok=i=>!(B.flag[i]&F.gap);const rs=runs(B,ok);
  const surfMats={};
  const wf=i=>B.w[i];
  // road surface, per surface type (cuts may be off-road)
  const roadRuns=isCut&&B.def.surf?runs(B,i=>ok(i)&&B.surf[i]===SURF.road):rs,offRuns=isCut&&B.def.surf?runs(B,i=>ok(i)&&B.surf[i]!==SURF.road):[];
  const add=(g,m,cast=false)=>{const me=new THREE.Mesh(g,m);me.receiveShadow=true;me.castShadow=cast;grp.add(me);return me;};
  if(roadRuns.length)add(ribbon(B,roadRuns,[i=>-B.w[i],i=>-B.w[i]*.5,0,i=>B.w[i]*.5,i=>B.w[i]],.02,24),isCut?cutRoadMat:roadMat);
  if(offRuns.length){const s=B.def.surf,m=new THREE.MeshStandardMaterial({map:offTex,color:offCol[SURF[s]]??T.ground,roughness:1,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2});m.map=offTex;add(ribbon(B,offRuns,[i=>-B.w[i],0,i=>B.w[i]],.03,10),m);}
  // curbs + shoulders
  if(T.wall!=='none'||true){const cw=1.1;
   add(ribbon(B,rs,[i=>-B.w[i]-cw,i=>-B.w[i]],(i,j)=>j===0?.04:.06,4),curbMat);add(ribbon(B,rs,[i=>B.w[i],i=>B.w[i]+cw],(i,j)=>j===1?.04:.06,4),curbMat);
   const shR=runs(B,i=>ok(i)&&B.sh[i]>cw+.1);if(shR.length){add(ribbon(B,shR,[i=>-B.w[i]-B.sh[i],i=>-B.w[i]-cw],-.02,8),isCut?shMat2:shMat);add(ribbon(B,shR,[i=>B.w[i]+cw,i=>B.w[i]+B.sh[i]],-.02,8),isCut?shMat2:shMat);}}
  // slab skirt for raised roads (sky / volcano ridges / gap edges)
  if(key==='sky'||key==='volcano'||rs.length>1||B.flag.some(f=>f&F.gap)){const skirt=new THREE.MeshStandardMaterial({color:key==='sky'?0xf0e8ff:key==='volcano'?0x2a2224:0x8a7a6a,roughness:.7,metalness:key==='sky'?.2:0,side:THREE.DoubleSide,emissive:key==='sky'?0xffa040:0,emissiveIntensity:key==='sky'?.06:0});
   const L=i=>B.w[i]+Math.max(B.sh[i],1.1),D=key==='sky'?-3.2:-6;
   add(ribbon(B,rs,[i=>-L(i),i=>-L(i),i=>L(i),i=>L(i)],(i,j)=>j===1||j===2?D:-.05,8),skirt);
   if(key==='sky'){const trim=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.4,.5)});add(ribbon(B,rs,[i=>-L(i)-.02,i=>-L(i)-.02],(i,j)=>j?-.5:-.8,8),trim);add(ribbon(B,rs,[i=>L(i)+.02,i=>L(i)+.02],(i,j)=>j?-.8:-.5,8),trim);}}
  // walls
  if(T.wall!=='none'||B.flag.some(f=>f&F.rail))buildWalls(W,C,B,T,add);}
 // patches (mud/ice/sand/oil decals)
 for(const p of C.pads){if(p.kind!=='patch')continue;const B=p.B,n=Math.round(p.len/B.step),a=p.i,rs=[[a,a+n]];
  const col={[SURF.mud]:0x4a3018,[SURF.ice]:0xcdeeff,[SURF.sand]:0xe0c080,[SURF.oil]:0x120818}[p.surf];
  const m=new THREE.MeshStandardMaterial({map:offTex,color:col,roughness:p.surf===SURF.ice?.08:p.surf===SURF.oil?.15:1,metalness:p.surf===SURF.oil?.6:0,transparent:true,opacity:.92,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const g=ribbon(B,rs,[p.u-p.hw,p.u-p.hw*.5,p.u,p.u+p.hw*.5,p.u+p.hw],(i,j)=>.05,8);const me=new THREE.Mesh(g,m);me.receiveShadow=true;grp.add(me);}
 // ramps
 const rampMat=new THREE.MeshStandardMaterial({map:ctex(128,128,(x,w,h)=>{x.fillStyle='#ffcf1a';x.fillRect(0,0,w,h);x.fillStyle='#1a1a22';for(let i=-2;i<6;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32+16,0);x.lineTo(i*32+16+h,h);x.lineTo(i*32+h,h);x.fill();}}),roughness:.5,metalness:.2});
 const glowArrow=new THREE.MeshBasicMaterial({color:new THREE.Color(.4,2.2,2.6),transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false});
 for(const r of C.ramps){const B=r.B,n=Math.max(2,Math.round(r.len/B.step)),hw=Math.min(r.hw,B.w[r.i]),u0=Math.max(r.u0,-B.w[r.i]),u1=Math.min(r.u1,B.w[r.i]);
  const pos=[],idx=[];for(let k=0;k<=n;k++){const i=(r.i+k)%B.n,d=k*B.step,hh=r.h*Math.pow(Math.min(1,d/r.len),1.3);for(const u of[u0,u1]){pos.push(B.x[i]+B.nx[i]*u,B.y[i]+hh+.05,B.z[i]+B.nz[i]*u);}}
  for(let k=0;k<n;k++){const o=k*2;idx.push(o,o+2,o+1,o+1,o+2,o+3);}
  // back face + sides
  const top=pos.length/3,iE=(r.i+n)%B.n;for(const u of[u0,u1])pos.push(B.x[iE]+B.nx[iE]*u,B.y[iE],B.z[iE]+B.nz[iE]*u);idx.push(top-2,top-1,top,top-1,top+1,top);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const uv=[];for(let k=0;k<pos.length/3;k++)uv.push(k%2,Math.floor(k/2)*.25);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const me=new THREE.Mesh(g,rampMat);me.castShadow=me.receiveShadow=true;W.grp.add(me);
  if(r.trick){for(let k=1;k<n;k+=Math.max(1,n/3|0)){const i=(r.i+k)%B.n,d=k*B.step,hh=r.h*Math.pow(d/r.len,1.3);const a=new THREE.Mesh(chevGeo(),glowArrow);a.position.set(B.x[i],B.y[i]+hh+.12,B.z[i]);a.rotation.set(-Math.PI/2+Math.atan(r.h/r.len*1.3),0,0,'YXZ');a.rotation.y=Math.atan2(B.tx[i],B.tz[i]);a.rotation.order='YXZ';a.scale.setScalar(Math.min(3,hw*.4));W.grp.add(a);}}}
 // boost / jump / glide pads
 const padU={uT:{value:0}};W.padU=padU;
 for(const p of C.pads){if(p.kind==='patch')continue;const B=p.B,n=Math.max(1,Math.round(p.len/B.step)),hw=Math.min(p.hw,B.w[p.i]);
  const nm=T.night?.55:1,col=(p.kind==='boost'?new THREE.Color(2.2,.9,.12):p.kind==='jump'?new THREE.Color(.3,1.2,2.4):new THREE.Color(.3,2,1.5)).multiplyScalar(nm);
  const g=ribbon(B,[[p.i,p.i+n]],[p.u-hw,p.u+hw],.07,1);// uv.y in metres
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,uniforms:{uT:padU.uT,uC:{value:col},uS:{value:B.s[p.i]},uL:{value:p.len},uK:{value:p.kind==='boost'?0:p.kind==='jump'?1:2}},
   vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`uniform float uT,uS,uL,uK;uniform vec3 uC;varying vec2 vU;void main(){float y=(vU.y-uS)/uL;float x=abs(vU.x-.5)*2.;
    float ch=fract(y*3.-x*.6*(1.-step(.5,uK)) -uT*1.6);float band=smoothstep(.0,.08,ch)*smoothstep(.45,.3,ch);float edge=smoothstep(.82,.95,x)+smoothstep(.06,0.,y)+smoothstep(.94,1.,y);
    float ring=uK>.5&&uK<1.5?smoothstep(.1,0.,abs(fract(length(vec2(x,y*2.-1.))*2.-uT*1.5)-.5)-.2):0.;
    gl_FragColor=vec4(uC*(band*.8+edge*.6+ring*.8+.06),.9);}`});
  const me=new THREE.Mesh(g,m);W.grp.add(me);W.pads.push(p);}
 // start line + gantry
 startGantry(W,C,T);
 // terrain
 const hgt=makeHeight(C,T);W.height=hgt;
 if(T.key!=='sky'){const bb=C.bbox,pad=380,x0=bb[0]-pad,x1=bb[2]+pad,z0=bb[1]-pad,z1=bb[3]+pad,res=quality>=2?3.4:4.6,nx=Math.ceil((x1-x0)/res),nz=Math.ceil((z1-z0)/res);
  const g=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz).rotateX(-Math.PI/2);g.translate((x0+x1)/2,0,(z0+z1)/2);const pa=g.attributes.position,col=new Float32Array(pa.count*3),c1=new THREE.Color(T.ground),c2=new THREE.Color(T.ground2),tc=new THREE.Color();
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);const y=hgt(x,z);pa.setY(i,y);const n=fbm(x*.03,z*.03,3);tc.copy(c1).lerp(c2,cl(.5+n*1.2,0,1));
   if(T.key==='snow'&&y>30)tc.lerp(new THREE.Color(0xffffff),.5);if(T.key==='seaside'&&C.seaY!==undefined&&y<C.seaY+1.2)tc.lerp(new THREE.Color(0xd8c08a),.7);if(T.key==='jungle'&&y<-8)tc.set(0x5a5a48);if(T.key==='volcano'&&y<T.lavaY+3)tc.lerp(new THREE.Color(0x8a2a0a),.6);if(T.key==='desert'&&y>14){const b=Math.floor(y/5)%3;tc.lerp(new THREE.Color([0xc0602a,0xd88a4a,0xa84a22][b]),.6);}
   col[i*3]=tc.r;col[i*3+1]=tc.g;col[i*3+2]=tc.b;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
  // slope shading
  const nr=g.attributes.normal;for(let i=0;i<pa.count;i++){const s=1-nr.getY(i);if(s>.25){const f=cl((s-.25)*1.6,0,.7);const rock=T.key==='snow'?0x8a96aa:T.key==='jungle'?0x6a6a50:T.key==='desert'?0xb05a2a:0x6a5a50;tc.setRGB(col[i*3],col[i*3+1],col[i*3+2]).lerp(new THREE.Color(rock),f);col[i*3]=tc.r;col[i*3+1]=tc.g;col[i*3+2]=tc.b;}}
  const tex=groundTex().clone();tex.needsUpdate=true;tex.repeat.set((x1-x0)/14,(z1-z0)/14);
  const m=new THREE.MeshStandardMaterial({vertexColors:true,map:tex,roughness:T.key==='snow'?.75:.96,envMapIntensity:.5});const me=new THREE.Mesh(g,m);me.receiveShadow=true;W.grp.add(me);W.terrain=me;}
 // props
 buildProps(W,C,T,rnd,hgt,quality);
 // boxes, coins, hazards
 for(const ft of C.def.feats){if(ft.t==='boxes'){const B=ft.cut!==undefined?C.branches[ft.cut+1]:C.main,i=Math.round(ft.s*B.n)%B.n,w=B.w[i],n=w>11?5:4;for(let k=0;k<n;k++){const u=(k/(n-1)-.5)*w*1.3;W.boxes.push({p:new V(B.x[i]+B.nx[i]*u,B.y[i]+1.25,B.z[i]+B.nz[i]*u),t:0,ph:rnd()*6});}}
  if(ft.t==='coins'){const B=ft.cut!==undefined?C.branches[ft.cut+1]:C.main,i0=Math.round(ft.s*B.n)%B.n;for(let k=0;k<(ft.n||5);k++){const i=(i0+k*2)%B.n;W.coins.push({p:new V(B.x[i]+B.nx[i]*(ft.u||0),B.y[i]+1,B.z[i]+B.nz[i]*(ft.u||0)),t:0});}}
  if(ft.t==='haz')for(let k=0;k<(ft.n||1);k++)W.haz.push(makeHazard(ft.k,C,ft.s+k*.012,k,rnd));}
 boxMeshes(W);coinMeshes(W);for(const h of W.haz)W.grp.add(h.mesh);}

function chevGeo(){const s=new THREE.Shape();s.moveTo(-1,-.4);s.lineTo(0,.5);s.lineTo(1,-.4);s.lineTo(.6,-.4);s.lineTo(0,.15);s.lineTo(-.6,-.4);s.closePath();return new THREE.ShapeGeometry(s);}

function buildWalls(W,C,B,T,add){const key=T.key,cw=1.1;
 const wallMat=T.wall==='none'?new THREE.MeshPhysicalMaterial({color:0xffe8b0,roughness:.1,metalness:.2,transparent:true,opacity:.45,emissive:0xffa030,emissiveIntensity:.35,depthWrite:false}):new THREE.MeshStandardMaterial({color:{rope:0xb08a5a,stone:0x8a8a6a,snowbank:0xf8fbff,rock:0xa0603a,neon:0x22222e,basalt:0x2a2224,fence:0x2a2a34}[T.wall]||0x888888,roughness:T.wall==='neon'?.4:.85,metalness:T.wall==='neon'||T.wall==='fence'?.5:0,map:groundTex()});
 const ok=(i,s)=>{if(B.flag[i]&(F.gap|F.noWall))return false;if(T.wall==='none'&&!(B.flag[i]&F.rail))return false;const u=s*(B.w[i]+B.sh[i]+.6),x=B.x[i]+B.nx[i]*u,z=B.z[i]+B.nz[i]*u;const q=query(C,x,z,B.y[i]);return !(q.ok&&q.B!==B&&q.inside);};
 const th=key==='snow'?1.6:1.0,h=key==='snow'?1.4:key==='city'?1.1:1.2;
 for(const s of[-1,1]){const rs=runs(B,i=>ok(i,s));if(!rs.length)continue;const L=i=>s*(B.w[i]+B.sh[i]);
  const prof=s<0?[i=>L(i)-th,i=>L(i)-th,i=>L(i)-th*.3,i=>L(i),i=>L(i)]:[i=>L(i),i=>L(i),i=>L(i)+th*.3,i=>L(i)+th,i=>L(i)+th];
  const yy=s<0?[-1.5,h*.85,h,h*.6,-.1]:[-.1,h*.6,h,h*.85,-1.5];
  add(ribbon(B,rs,prof,(i,j)=>yy[j],6),wallMat,true);
  if(T.wall==='neon'){const gm=new THREE.MeshBasicMaterial({color:s<0?new THREE.Color(2.6,.4,1.4):new THREE.Color(.3,2.2,2.8)});add(ribbon(B,rs,[i=>L(i)+(s<0?0:.02)-(s<0?.02:0),i=>L(i)+(s<0?0:.02)-(s<0?.02:0)],(i,j)=>j?.75:.55,6),gm);}
  if(T.wall==='rope'||T.wall==='fence'){const n=[];for(const[a,b]of rs)for(let k=a;k<=b;k+=3)n.push(k%B.n);const im=new THREE.InstancedMesh(new THREE.BoxGeometry(.25,1.8,.25),new THREE.MeshStandardMaterial({color:T.wall==='rope'?0x6a4a2a:0x15151c,roughness:.8,metalness:T.wall==='fence'?.6:0}),n.length);n.forEach((i,k)=>{const u=s*(B.w[i]+B.sh[i]+th*.5);im.setMatrixAt(k,M(B.x[i]+B.nx[i]*u,B.y[i]+.9+h*.4,B.z[i]+B.nz[i]*u));});im.castShadow=true;W.grp.add(im);}}}

function startGantry(W,C,T){const B=C.main,i=0,w=B.w[i]+B.sh[i]*.6,yaw=Math.atan2(B.tx[i],B.tz[i]),g=new THREE.Group();g.position.set(B.x[i],B.y[i],B.z[i]);g.rotation.y=yaw;
 const chk=ctex(128,32,(x,w2,h)=>{for(let a=0;a<16;a++)for(let b=0;b<4;b++){x.fillStyle=(a+b)%2?'#111':'#f4f4f4';x.fillRect(a*8,b*8,8,8);}});chk.magFilter=THREE.NearestFilter;
 const line=new THREE.Mesh(new THREE.PlaneGeometry(B.w[i]*2,3).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:chk,roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));line.position.y=.08;line.receiveShadow=true;g.add(line);
 const pm=new THREE.MeshStandardMaterial({color:0x22252e,roughness:.4,metalness:.7});for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(1,10,1),pm);p.position.set(s*w,5,0);p.castShadow=true;g.add(p);}
 const beam=new THREE.Mesh(new THREE.BoxGeometry(w*2+1,2.2,1.2),pm);beam.position.y=10.4;beam.castShadow=true;g.add(beam);
 const ban=ctex(1024,128,(x,w2,h)=>{x.fillStyle='#0b0c12';x.fillRect(0,0,w2,h);x.fillStyle='#ff4d00';x.fillRect(0,h-10,w2,10);x.fillStyle='#fff';x.font='78px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('KART GRAND PRIX',w2/2,h/2-4);});
 for(const sd of[-1,1]){const b=new THREE.Mesh(new THREE.PlaneGeometry(w*1.6,1.8),new THREE.MeshStandardMaterial({map:ban,emissive:0xffffff,emissiveMap:ban,emissiveIntensity:.6,roughness:.5}));b.position.set(0,10.4,sd*.61);if(sd<0)b.rotation.y=Math.PI;g.add(b);}
 W.lamps=[];for(let k=0;k<3;k++){const l=new THREE.Mesh(new THREE.SphereGeometry(.55,14,10),new THREE.MeshBasicMaterial({color:0x220808}));l.position.set((k-1)*1.6,8.6,-.2);g.add(l);W.lamps.push(l);}
 W.grp.add(g);W.gantry=g;}

function buildProps(W,C,T,rnd,hgt,q){const list=T.props,cnt=q>=2?340:q===1?220:120;const per={};list.forEach(k=>per[k]=[]);const M0=C.main;
 const free=(x,z,r)=>{const qq=query(C,x,z);if(!qq.ok)return true;return Math.abs(qq.u)>qq.lim+r+2.5;};
 const place=(k,x,z,s,ry)=>{per[k].push({x,z,y:hgt(x,z),s,ry});};
 for(let n=0;n<cnt*3&&Object.values(per).reduce((a,b)=>a+b.length,0)<cnt;n++){const k=list[(rnd()*list.length)|0];const big=PROP_SIZE[k];if(big===1&&per[k].length)continue;if(big&&rnd()>big)continue;
  const i=(rnd()*M0.n)|0,side=rnd()<.5?-1:1,e=(big===1?60:6)+rnd()*(big?110:60)+(k==='tower'||k==='tower2'?6:0),u=side*(M0.w[i]+M0.sh[i]+e),x=M0.x[i]+M0.nx[i]*u,z=M0.z[i]+M0.nz[i]*u;const rad={tower:12,tower2:10,mesa:9,manor:22,cone:130,island:10,lighthouse:3}[k]||3;
  if(!free(x,z,rad))continue;if(C.seaY!==undefined&&hgt(x,z)<C.seaY-.5&&!['boat','rock'].includes(k))continue;if(k==='boat'&&(C.seaY===undefined||hgt(x,z)>C.seaY-1.5))continue;
  place(k,x,z,(k==='cone'?1:.8+rnd()*.6),rnd()*6.28);}
 if(T.key==='volcano'&&!per.cone.length)per.cone.push({x:(C.bbox[0]+C.bbox[2])/2+40,z:C.bbox[1]-260,y:-30,s:1,ry:0});
 if(T.key==='sky'){per.cloud=per.cloud||[];for(let n=0;n<90;n++){const i=(rnd()*M0.n)|0,side=rnd()<.5?-1:1,u=side*(M0.w[i]+20+rnd()*160);per.cloud.push({x:M0.x[i]+M0.nx[i]*u,z:M0.z[i]+M0.nz[i]*u,y:M0.y[i]-10-rnd()*40,s:1+rnd()*2.4,ry:rnd()*6});}
  for(const k of['island','balloon','pylon','ring'])for(const p of per[k]||[]){const qq=query(C,p.x,p.z);p.y=(qq.ok?qq.y:60)+(k==='pylon'?-2:k==='ring'?14+rnd()*10:-8+rnd()*20);if(k==='pylon'){p.y=qq.y;}}
  // pylons along the road edges
  per.pylon=per.pylon||[];for(let i=0;i<M0.n;i+=22){if(M0.flag[i]&F.gap)continue;for(const s of[-1,1]){const u=s*(M0.w[i]+1.2);per.pylon.push({x:M0.x[i]+M0.nx[i]*u,z:M0.z[i]+M0.nz[i]*u,y:M0.y[i],s:.6,ry:0});}}}
 if(T.key==='city'){// skyline ring of towers
  for(let n=0;n<60;n++){const a=rnd()*6.28,r=420+rnd()*300,cx=(C.bbox[0]+C.bbox[2])/2,cz=(C.bbox[1]+C.bbox[3])/2;per[rnd()<.5?'tower':'tower2'].push({x:cx+Math.cos(a)*r,z:cz+Math.sin(a)*r,y:0,s:1.5+rnd()*2.5,ry:rnd()*6});}}
 if(T.key==='seaside'||T.key==='snow'||T.key==='desert'||T.key==='jungle'||T.key==='haunted'){// distant mountains for the horizon
  const cx=(C.bbox[0]+C.bbox[2])/2,cz=(C.bbox[1]+C.bbox[3])/2,mt=[];for(let n=0;n<26;n++){const a=n/26*6.28+rnd()*.2,r=700+rnd()*260;if(T.key==='seaside'&&Math.cos(a)>.2)continue;mt.push([lumpy(new THREE.ConeGeometry(120+rnd()*120,120+rnd()*(T.key==='snow'?260:140),9,4),26,n),M(cx+Math.cos(a)*r,-10,cz+Math.sin(a)*r),T.key==='snow'?0xb8c8e0:T.key==='desert'?0xc87a4a:T.key==='haunted'?0x24203a:T.key==='jungle'?0x3a6a4a:0x6a8a6a]);}
  if(mt.length){const g=merge(mt);if(T.key==='snow'){const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++)if(p.getY(i)>90){c.setXYZ(i,1,1,1);}}const me=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));W.grp.add(me);}}
 const tint={palm:[.85,1.1],umbrella:[0,1],rock:[.7,1],tomb:[.8,1.05],pumpkin:[.85,1.1],balloon:[0,1],sign:[0,1],tent:[.85,1.05]};
 const palette={umbrella:[0xff4060,0x3a8aff,0xffd23a,0x2ad0a0],balloon:[0xff6a4a,0x6a8aff,0xffd23a,0xd05aff],sign:[0xff2a9a,0x2ae0ff,0xffd040,0x8a6aff],rock:{seaside:0xb8a080,jungle:0x7a7a6a,snow:0x8a96aa,desert:0xa86a40,city:0x4a4a5a,volcano:0x2a2224,haunted:0x4a4a58,sky:0xd8d0e8}};
 for(const k in per){const L=per[k];if(!L.length)continue;const r2=rng(k.length*31+7),pg=propGeo(k,r2);const tc=new THREE.Color();
  const mk=(geo,glow)=>{if(!geo)return;const mat=glow?new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2),toneMapped:true}):new THREE.MeshStandardMaterial({vertexColors:true,roughness:k==='crystal'?.2:.85,metalness:0,envMapIntensity:.6,flatShading:['rock','vrock','spire','mesa','island','ember'].includes(k)});
   const im=new THREE.InstancedMesh(geo,mat,L.length);L.forEach((p,j)=>{im.setMatrixAt(j,M(p.x,p.y,p.z,0,p.ry,0,p.s));
    if(palette[k]){const pl=palette[k];tc.set(Array.isArray(pl)?pl[j%pl.length]:pl[T.key]||0xffffff);im.setColorAt(j,glow&&k!=='sign'?new THREE.Color(1,1,1):tc);}else{const f=.85+r2()*.3;im.setColorAt(j,tc.setRGB(f,f,f));}});
   im.castShadow=!glow&&!['cloud','mesa','cone','tower','tower2'].includes(k);im.receiveShadow=!glow;if(k==='cloud'){im.castShadow=false;im.material.emissive=new THREE.Color(0x6a5a6a);}W.grp.add(im);im.computeBoundingSphere();};
  mk(pg.solid,false);mk(pg.glow,true);}}

/* ---------- item boxes + coins ---------- */
function boxMeshes(W){const n=Math.max(1,W.boxes.length);
 const outer=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.05,metalness:.1,transparent:true,opacity:.5,iridescence:1,iridescenceIOR:1.6,clearcoat:1,emissive:0x3a4a8a,emissiveIntensity:.25,depthWrite:false}),n);
 const inner=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.42,0),new THREE.MeshBasicMaterial({color:0xffffff}),n);inner.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);
 outer.renderOrder=3;outer.frustumCulled=inner.frustumCulled=false;W.grp.add(outer,inner);W.boxIM=[outer,inner];}
function coinMeshes(W){const n=Math.max(1,W.coins.length);const g=new THREE.CylinderGeometry(.6,.6,.14,20).rotateX(Math.PI/2);
 const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xffc21a,metalness:1,roughness:.25,emissive:0x8a5200,emissiveIntensity:.5}),n);im.castShadow=true;im.frustumCulled=false;W.grp.add(im);W.coinIM=im;}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new V(),_c=new THREE.Color();
export function updateWorld(W,t,dt){
 W.sky.userData.U.uT.value=t;if(W.water)W.water.userData.U.uT.value=t;if(W.lava)W.lava.userData.U.uT.value=t;if(W.clouds)W.clouds.userData.U.uT.value=t;if(W.padU)W.padU.uT.value=t;
 if(W.boxIM){const[o,inn]=W.boxIM;W.boxes.forEach((b,j)=>{const vis=b.t<=0,grow=vis?Math.min(1,(b.grow??1)):0;if(b.t>0){b.t-=dt;if(b.t<=0)b.grow=0;}if(vis&&b.grow<1)b.grow=Math.min(1,(b.grow||0)+dt*3);
  const sc=vis?grow*(1+Math.sin(t*3+b.ph)*.04):0;_e.set(t*.9+b.ph,t*1.3+b.ph,0);_q.setFromEuler(_e);_s.set(sc,sc,sc);_m.compose(_s.set(b.p.x,b.p.y+Math.sin(t*2+b.ph)*.18,b.p.z),_q,new V(sc*1.15,sc*1.15,sc*1.15));o.setMatrixAt(j,_m);
  _e.set(0,-t*2,0);_q.setFromEuler(_e);_m.compose(_s,_q,new V(sc,sc*1.4,sc));inn.setMatrixAt(j,_m);_c.setHSL((t*.25+j*.13)%1,.9,.6).multiplyScalar(2.2);inn.setColorAt(j,_c);});
  o.instanceMatrix.needsUpdate=inn.instanceMatrix.needsUpdate=true;inn.instanceColor.needsUpdate=true;}
 if(W.coinIM){W.coins.forEach((c,j)=>{if(c.t>0)c.t-=dt;const sc=c.t>0?0:1;_e.set(0,t*3+j*.4,0);_q.setFromEuler(_e);_m.compose(_s.set(c.p.x,c.p.y+Math.sin(t*3+j)*.12,c.p.z),_q,new V(sc,sc,sc));W.coinIM.setMatrixAt(j,_m);});W.coinIM.instanceMatrix.needsUpdate=true;}
 for(const h of W.haz)h.update(t,dt);
 for(const u of W.upd)u(t,dt);}

/* ---------- hazards ---------- */
function makeHazard(kind,C,s,k,rnd){const B=C.main,g=new THREE.Group(),h={kind,mesh:g,p:new V(),r:1.6,active:true,launch:false,ph:rnd()*6.28,s};
 const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,...o});
 const i0=Math.round(((s%1)+1)%1*B.n)%B.n,w=B.w[i0];
 if(kind==='crab'){const body=new THREE.Mesh(new THREE.SphereGeometry(1.1,16,12).scale(1.3,.6,1),mat(0xff4a2a,{roughness:.4}));body.position.y=.9;g.add(body);const legs=[];
  for(const sd of[-1,1]){for(let l=0;l<3;l++){const lg=new THREE.Mesh(new THREE.CylinderGeometry(.08,.06,1.2,5),mat(0xd83a1a));lg.position.set(sd*1.1,.5,(l-1)*.5);lg.rotation.z=sd*.8;g.add(lg);legs.push(lg);}
   const claw=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8).scale(1,.7,1.3),mat(0xff5a3a));claw.position.set(sd*.9,1.1,1.1);g.add(claw);legs.push(claw);
   const eye=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),mat(0xffffff));eye.position.set(sd*.35,1.6,.6);g.add(eye);const pu=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),mat(0x000000));pu.position.set(sd*.35,1.65,.75);g.add(pu);}
  h.r=1.5;h.update=(t)=>{const a=t*.5+h.ph,u=Math.sin(a)*w*.8,p=at(B,s,u,h.p);g.position.copy(p);g.rotation.y=Math.atan2(B.tx[i0],B.tz[i0])+Math.PI/2;g.position.y+=Math.abs(Math.sin(t*12))*.12;legs.forEach((l,j)=>l.rotation.x=Math.sin(t*14+j)*.5);h.p.y+=.8;};}
 else if(kind==='boulder'||kind==='snowball'){const r=kind==='boulder'?2.3:2;const ball=new THREE.Mesh(kind==='boulder'?lumpy(new THREE.DodecahedronGeometry(r,1),.5,k+3):new THREE.SphereGeometry(r,18,14),mat(kind==='boulder'?0x7a7466:0xf8fbff,{flatShading:kind==='boulder',roughness:kind==='boulder'?.95:.7}));ball.castShadow=true;g.add(ball);
  h.r=r+.6;h.launch=kind==='boulder';let rot=0;h.update=(t,dt)=>{const a=t*.42+h.ph,u=Math.sin(a)*w*.85,p=at(B,s,u,h.p);const vel=Math.cos(a)*.42*w*.85;rot+=vel*dt/r;g.position.copy(p);g.position.y+=r;ball.rotation.set(0,0,0);ball.rotateOnWorldAxis(new V(B.tx[i0],0,B.tz[i0]),-rot);h.p.y+=r*.6;};}
 else if(kind==='tumble'){const ball=new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(1.4,1),.6,k),new THREE.MeshStandardMaterial({color:0xb08a50,wireframe:true}));const core=new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(1.1,1),.5,k+9),new THREE.MeshStandardMaterial({color:0x8a6a3a,wireframe:true}));g.add(ball,core);
  h.r=1.5;h.update=(t)=>{const a=t*.7+h.ph,u=Math.sin(a)*w*.9,p=at(B,s,u,h.p);g.position.copy(p);g.position.y+=1.4+Math.abs(Math.sin(t*4+h.ph))*1.4;ball.rotation.z=-t*4*Math.sign(Math.cos(a));core.rotation.x=t*3;h.p.y+=1.4;};}
 else if(kind==='ghost'){const body=new THREE.Mesh(new THREE.SphereGeometry(1.2,16,12,0,Math.PI*2,0,Math.PI*.6),new THREE.MeshStandardMaterial({color:0xd8e8ff,transparent:true,opacity:.75,emissive:0x6a7aff,emissiveIntensity:.5}));
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(1.2*Math.sin(Math.PI*.6),1.5,1.6,16,3,true),body.material);skirt.position.y=-.55-.2;g.add(body,skirt);
  for(const sd of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(.2,2.4,1.6)}));e.position.set(sd*.38,.35,1.05);g.add(e);}
  h.r=1.6;h.update=(t)=>{const a=t*.6+h.ph,u=Math.sin(a)*w*.9,p=at(B,s,u,h.p);g.position.copy(p);g.position.y+=2+Math.sin(t*2+h.ph)*.6;g.rotation.y=Math.atan2(B.tx[i0],B.tz[i0])+Math.PI/2*Math.sign(Math.cos(a));skirt.scale.x=1+Math.sin(t*6)*.08;h.p.y+=1.4;};}
 else if(kind==='traffic'){const col=[0x2ae0ff,0xff2a9a,0xffd040][k%3];const body=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.1,5),mat(0x1a1a26,{metalness:.7,roughness:.3}));body.position.y=1.2;body.castShadow=true;g.add(body);
  const top=new THREE.Mesh(new THREE.BoxGeometry(2.1,.8,2.6),mat(0x0a0a12,{metalness:.9,roughness:.1}));top.position.set(0,2.1,-.3);g.add(top);
  const glow=new THREE.Mesh(new THREE.BoxGeometry(2.7,.15,5.1),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(2.5)}));glow.position.y=.7;g.add(glow);
  const tl=new THREE.Mesh(new THREE.BoxGeometry(2.2,.25,.1),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.2)}));tl.position.set(0,1.3,-2.52);g.add(tl);
  h.r=2.4;h.launch=true;h.u=((k%3)-1)*w*.55;h.f=s;const spd=16+k*2;h.update=(t,dt)=>{h.f=(h.f+spd*dt/B.len)%1;const p=at(B,h.f,h.u,h.p),i=Math.round(h.f*B.n)%B.n;g.position.copy(p);g.position.y+=.4+Math.sin(t*3+k)*.15;g.rotation.y=Math.atan2(B.tx[i],B.tz[i]);h.p.y+=1.2;h.vel=spd;h.dir=g.rotation.y;};}
 else if(kind==='geyser'){const u=((k%2)?1:-1)*w*.35;const base=new THREE.Mesh(new THREE.CircleGeometry(2.2,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,.6,.1),transparent:true,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));base.position.y=.09;g.add(base);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.3,.4,6,18).rotateX(Math.PI/2),mat(0x1a1214,{roughness:.9}));rim.position.y=.1;g.add(rim);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(1.2,2,14,14,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uT:{value:0},uA:{value:0}},
   vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uT,uA;varying vec2 vU;void main(){float f=sin(vU.x*30.+vU.y*8.-uT*20.)*.5+.5;float a=uA*(1.-vU.y)*(.6+.4*f);gl_FragColor=vec4(vec3(3.,1.,.2)*a,1.);}'}));col.position.y=7;g.add(col);
  h.r=2.3;h.launch=true;h.erupt=0;const per=4.2+k*.7;h.update=(t)=>{const p=at(B,s,u,h.p);g.position.copy(p);const c=((t+h.ph)%per)/per;const warn=c>.62&&c<.75,on=c>=.75;h.active=on;h.warn=warn;h.erupt=on?1:0;
   col.material.uniforms.uT.value=t;col.material.uniforms.uA.value=on?1:warn?.15:0;col.scale.set(1,on?1:.2,1);col.position.y=on?7:1.4;base.material.color.setRGB(2.4+(warn?Math.sin(t*30)*1.5:0),.6,.1);h.p.y+=1;};h.isGeyser=true;}
 g.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true;});
 h.update(0,0);return h;}

/* ---------- battle arena ---------- */
export function arenaHeight(x,z,R){const r=Math.hypot(x,z);let y=0;
 y+=sstep(R-22,R,r)*5;// bowl rim
 y+=Math.max(0,1-r/16)**2*0;// centre plaza flat
 const a=Math.atan2(z,x);for(let k=0;k<4;k++){const ka=k*Math.PI/2+Math.PI/4,d=Math.abs(Math.sin(a-ka))*r,along=Math.cos(a-ka)*r;if(along>24&&along<40&&d<6){y+=sstep(24,38,along)*2.6*(1-sstep(4,6,d));}}
 return y;}
function buildArenaMesh(W,C,T,rnd){const R=C.R,grp=W.grp;
 const g=new THREE.CircleGeometry(R+40,160,0,Math.PI*2);g.rotateX(-Math.PI/2);// rings for detail
 const pg=new THREE.PlaneGeometry((R+60)*2,(R+60)*2,140,140).rotateX(-Math.PI/2),pa=pg.attributes.position,col=new Float32Array(pa.count*3),c1=new THREE.Color(T.ground),c2=new THREE.Color(T.ground2),tc=new THREE.Color();
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i),r=Math.hypot(x,z);let y=arenaHeight(x,z,R);if(r>R)y=5+sstep(R,R+12,r)*14+fbm(x*.04,z*.04)*4;pa.setY(i,y);tc.copy(c1).lerp(c2,cl(.5+fbm(x*.05,z*.05)*1.4,0,1));
  if(r<R-22&&(Math.floor(r/9)%2===0))tc.multiplyScalar(.92);if(Math.abs(r-14)<1)tc.set(0xffd040);col[i*3]=tc.r;col[i*3+1]=tc.g;col[i*3+2]=tc.b;}
 pg.setAttribute('color',new THREE.BufferAttribute(col,3));pg.computeVertexNormals();const tex=groundTex().clone();tex.needsUpdate=true;tex.repeat.set(30,30);
 const me=new THREE.Mesh(pg,new THREE.MeshStandardMaterial({vertexColors:true,map:tex,roughness:.95}));me.receiveShadow=true;grp.add(me);W.height=(x,z)=>arenaHeight(x,z,R);
 // pillars (colliders) + crates
 const pm=new THREE.MeshStandardMaterial({color:0xc08060,roughness:.85,flatShading:true});
 for(const c of C.cols){const m=new THREE.Mesh(lumpy(new THREE.CylinderGeometry(c.r,c.r*1.15,c.h,9,3),.4,c.r*10|0),pm);m.position.set(c.x,c.h/2,c.z);m.castShadow=m.receiveShadow=true;grp.add(m);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(c.r*1.25,c.r*1.25,.6,9),new THREE.MeshStandardMaterial({color:0x3a2a28}));cap.position.set(c.x,c.h,c.z);grp.add(cap);
  const gl=new THREE.Mesh(new THREE.TorusGeometry(c.r*1.18,.12,6,24).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,1.2,.2)}));gl.position.set(c.x,c.h-1,c.z);grp.add(gl);}
 // ring wall
 const wall=new THREE.Mesh(new THREE.TorusGeometry(R+1.2,1.2,8,120).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0x3a2a30,roughness:.6,metalness:.3}));wall.position.y=5.6;wall.castShadow=true;grp.add(wall);
 const neon=new THREE.Mesh(new THREE.TorusGeometry(R,.15,6,160).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(2.8,1,.2)}));neon.position.y=5.4;grp.add(neon);
 // spectators-ish props outside
 const per={mesa:[],rock:[],cactus:[],tent:[]};for(let n=0;n<70;n++){const a=rnd()*6.28,r=R+20+rnd()*150,k=['mesa','rock','cactus','tent'][n%4];per[k].push({x:Math.cos(a)*r,z:Math.sin(a)*r,y:arenaHeight(0,0,R)+5+sstep(R,R+12,r)*14,s:.8+rnd()*.7,ry:rnd()*6});}
 for(const k in per){const pg2=propGeo(k,rng(k.length));if(pg2.solid){const im=new THREE.InstancedMesh(pg2.solid,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:k==='mesa'||k==='rock'}),per[k].length);per[k].forEach((p,j)=>im.setMatrixAt(j,M(p.x,p.y,p.z,0,p.ry,0,p.s)));im.castShadow=true;grp.add(im);}}
 // boxes
 for(let k=0;k<16;k++){const a=k/16*Math.PI*2,r=k%2?28:50;W.boxes.push({p:new V(Math.cos(a)*r,arenaHeight(Math.cos(a)*r,Math.sin(a)*r,R)+1.25,Math.sin(a)*r),t:0,ph:k});}
 for(let k=0;k<4;k++)W.boxes.push({p:new V(Math.cos(k*Math.PI/2)*7,1.25,Math.sin(k*Math.PI/2)*7),t:0,ph:k*2});
 boxMeshes(W);}
