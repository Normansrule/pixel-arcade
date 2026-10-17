// STARWARDEN — dresses the strike layout per destination: masonry/rock PBR sets, glowing glyphs and trims, alien skies baked
// to a cubemap (shattered moon, ringed giant, aurora twin moons), ruins set pieces, crystals, flora, floating isles, doors.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,boxUV,ctex,rng} from './util.js';
import {panelSet,rockSet,stoneSet,glowTex,hexTex} from './tex.js';

const C=(r,g,b)=>new THREE.Color(r,g,b);
export const THEMES={
 moon:{fog:[0x1a1d34,.0052],hemi:[0x9aa0d8,0x2a2236,.62],sun:[0xdfe2ff,2.3,[-.45,.6,.55]],exp:1.04,bloom:.72,thr:.8,sat:1.06,tint:'#eef0ff',glow:0xb46bff,glow2:0x6fd8ff,
  ground:[[132,132,150],[52,50,70]],cliff:[[150,148,166],[46,44,62]],stone:[[200,196,192],[112,108,118]],mega:[[110,106,128],[38,36,52]],hull:'#555c6c',dark:0x15131f,flora:'spike'},
 wastes:{fog:[0x6a3e2c,.0046],hemi:[0xffd8b8,0x34241c,.6],sun:[0xffd0a0,2.5,[.55,.32,-.5]],exp:.98,bloom:.6,thr:.86,sat:.98,tint:'#fff4ea',glow:0xff7a22,glow2:0xffc040,
  ground:[[184,148,112],[98,70,52]],cliff:[[164,118,92],[66,42,34]],stone:[[214,184,150],[126,98,78]],mega:[[140,100,80],[56,36,30]],hull:'#5a5048',dark:0x241010,flora:'dead'},
 reach:{fog:[0x0f2a2e,.0055],hemi:[0x80e0d0,0x10241e,.62],sun:[0xc8fff0,2.1,[.35,.55,.62]],exp:1.06,bloom:.75,thr:.8,sat:1.1,tint:'#eafff8',glow:0x5fe8ff,glow2:0x9dff7a,
  ground:[[70,118,96],[22,46,40]],cliff:[[96,124,118],[30,46,48]],stone:[[170,186,172],[86,104,96]],mega:[[86,110,104],[26,40,40]],hull:'#4a5a5c',dark:0x0a1a18,flora:'glow'}};

/* ---------- skies (baked once into a cubemap) ---------- */
const SKYV='varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}';
const NOISE=`float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=vn(p)*a;p*=2.03;a*=.5;}return s;}
float stars(vec3 d,float dens){vec3 q=d*dens;vec3 id=floor(q);float s=h3(id);vec3 f=fract(q)-.5-(vec3(h3(id+3.),h3(id+5.),h3(id+7.))-.5)*.6;return step(.965,s)*smoothstep(.09,0.,length(f))*(.4+1.6*h3(id+1.));}`;
function skyMat(theme,sunDir){const U={uSun:{value:sunDir.clone()}};let f;
 if(theme==='moon')f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  float n=fbm(d*2.4+vec3(3.)),n2=fbm(d*5.+vec3(9.));vec3 neb=vec3(.16,.05,.26)*smoothstep(.42,.85,n)+vec3(.02,.1,.18)*smoothstep(.5,.9,n2);
  float band=exp(-pow(dot(d,normalize(vec3(.5,.35,-.8)))*2.6,2.));vec3 c=vec3(.012,.012,.03)+neb*1.3+vec3(.08,.06,.12)*band*n2;
  c+=vec3(1.,.95,1.)*stars(d,330.)*1.5+vec3(.85,.85,1.)*stars(d,150.)*.9*band;c=mix(c,vec3(.14,.13,.22),smoothstep(.25,-.05,y)*.85);
  float sd=max(dot(d,uSun),0.);c+=vec3(.9,.9,1.)*(pow(sd,900.)*24.+pow(sd,14.)*.18);gl_FragColor=vec4(c,1.);}`;
 else if(theme==='wastes')f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 top=vec3(.08,.03,.09),mid=vec3(.55,.16,.12),hor=vec3(1.25,.55,.26);vec3 c=mix(hor,mid,smoothstep(-.02,.2,y));c=mix(c,top,smoothstep(.16,.75,y));c=mix(c,vec3(.36,.14,.08),smoothstep(0.,-.2,y));
  c+=vec3(1.,.9,.85)*stars(d,260.)*smoothstep(.35,.7,y)*.9;float cl=fbm(vec3(d.x*3.,d.y*12.,d.z*3.));c=mix(c,c*.7+vec3(.5,.18,.08),smoothstep(.5,.75,cl)*smoothstep(.4,.05,abs(y-.1)));
  float sd=max(dot(d,uSun),0.);c+=vec3(1.5,.7,.3)*(pow(sd,6.)*.5+pow(sd,60.)*1.2)+vec3(2.,1.6,1.)*pow(sd,1500.)*20.;gl_FragColor=vec4(c,1.);}`;
 else f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 c=mix(vec3(.05,.2,.22),vec3(.01,.04,.08),smoothstep(-.02,.55,y));c=mix(c,vec3(.04,.12,.12),smoothstep(0.,-.2,y));
  c+=vec3(.9,1.,1.)*stars(d,300.)*smoothstep(.05,.4,y)*1.3;
  float ax=atan(d.x,d.z);float cur=fbm(vec3(ax*3.,y*2.,1.3))*1.2;float a1=smoothstep(.0,.2,y)*smoothstep(.75,.3,y)*smoothstep(.45,.75,fbm(vec3(ax*6.+cur*2.,y*1.5,4.)));
  float stripes=pow(.5+.5*sin(ax*90.+cur*30.),3.);c+=mix(vec3(.1,1.,.6),vec3(.35,.3,1.),smoothstep(.2,.6,y))*a1*(.35+.65*stripes)*.9;
  float sd=max(dot(d,uSun),0.);c+=vec3(.6,1.,.9)*(pow(sd,14.)*.15);gl_FragColor=vec4(c,1.);}`;
 return new THREE.ShaderMaterial({uniforms:U,vertexShader:SKYV,fragmentShader:f,side:THREE.BackSide,depthWrite:false,fog:false});}
function body(kind,sunDir,c1,c2,glow){const U={uSun:{value:sunDir},uC1:{value:new THREE.Color(...c1)},uC2:{value:new THREE.Color(...c2)},uG:{value:new THREE.Color(...glow)}};
 const fs=kind==='gas'?`${NOISE}uniform vec3 uSun,uC1,uC2,uG;varying vec3 vN,vP,vW;void main(){float b=vP.y*7.+fbm(vP*3.)*2.2+fbm(vP*vec3(1.,12.,1.))*.6;vec3 col=mix(uC1,uC2,.5+.5*sin(b*3.1));col=mix(col,uC1*1.3,smoothstep(.6,.9,fbm(vP*9.+vec3(b))));
  float l=dot(vN,uSun);vec3 c=col*smoothstep(-.15,.5,l)*1.2;float rim=pow(1.-abs(dot(vN,-vW)),3.);c+=uG*rim*smoothstep(-.3,.3,l)*.8;gl_FragColor=vec4(c,1.);}`
 :kind==='shattered'?`${NOISE}uniform vec3 uSun,uC1,uC2,uG;varying vec3 vN,vP,vW;void main(){float n=fbm(vP*4.),m=fbm(vP*11.+vec3(4.));vec3 col=mix(uC2,uC1,n*.8+m*.3);
  float cr=abs(fbm(vP*2.6+vec3(7.))-.5);float crack=smoothstep(.035,0.,cr);float big=smoothstep(.02,0.,abs(vP.x*.6+vP.y-.15+fbm(vP*3.)*.3))*step(-.2,vP.z);
  float l=dot(vN,uSun);vec3 c=col*smoothstep(-.1,.45,l);c+=uG*(crack*.8+big*2.)*(.6+.4*m);float rim=pow(1.-abs(dot(vN,-vW)),3.);c+=uG*.25*rim;gl_FragColor=vec4(c,1.);}`
 :`${NOISE}uniform vec3 uSun,uC1,uC2,uG;varying vec3 vN,vP,vW;void main(){float n=fbm(vP*5.);vec3 col=mix(uC2,uC1,n);float l=dot(vN,uSun);vec3 c=col*smoothstep(-.1,.4,l)*1.2;float rim=pow(1.-abs(dot(vN,-vW)),2.5);c+=uG*rim*.6;gl_FragColor=vec4(c,1.);}`;
 return new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.ShaderMaterial({uniforms:U,fog:false,vertexShader:'varying vec3 vN,vP,vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:fs}));}
function ring(inner,outer,c,alpha){const g=new THREE.RingGeometry(inner,outer,160,4);return new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false,uniforms:{uC:{value:new THREE.Color(...c)},uI:{value:inner},uO:{value:outer},uA:{value:alpha}},
 vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 uC;uniform float uI,uO,uA;varying vec3 vP;void main(){float r=(length(vP.xy)-uI)/(uO-uI);float b=.5+.5*sin(r*90.)*sin(r*37.+1.);float a=smoothstep(0.,.05,r)*smoothstep(1.,.9,r)*(.35+.65*b)*uA;gl_FragColor=vec4(uC*(.6+.6*b),a);}'}));}
function skyPieces(theme,sunDir,sc){
 if(theme==='moon'){const m=body('shattered',sunDir,[.75,.74,.8],[.32,.3,.38],[.9,.4,1.6]);m.scale.setScalar(900);m.position.set(1400,900,-2600);m.rotation.set(.4,.3,.2);sc.add(m);
  const deb=[],r=rng(5);for(let i=0;i<70;i++){const g=new THREE.IcosahedronGeometry(1,0);const a=r()*6.28,d=1100+r()*500;deb.push([g,M4(1400+Math.cos(a)*d,900+Math.sin(a)*d*.25+(r()-.5)*80,-2600+Math.sin(a)*d*.4,r()*3,r()*3,0,10+r()*50)]);}
  sc.add(new THREE.Mesh(merge(deb),new THREE.MeshBasicMaterial({color:0x4a4658,fog:false})));const rg=ring(1050,1650,[.6,.5,.8],.55);rg.position.copy(m.position);rg.rotation.set(1.25,.2,.35);sc.add(rg);}
 else if(theme==='wastes'){const m=body('gas',sunDir,[1.1,.7,.45],[.55,.25,.18],[1.,.5,.3]);m.scale.setScalar(1500);m.position.set(-2200,500,-3000);m.rotation.set(.3,0,.25);sc.add(m);
  const rg=ring(1750,2900,[1.,.75,.5],.75);rg.position.copy(m.position);rg.rotation.set(1.35,0,.3);sc.add(rg);
  const s2=body('moon',sunDir,[.9,.8,.7],[.4,.3,.25],[.6,.3,.2]);s2.scale.setScalar(120);s2.position.set(1800,1300,-2600);sc.add(s2);}
 else{for(const[p,s,c]of[[[-1500,1300,-2700],260,[.8,1,.95]],[[900,1700,-2300],120,[.75,.85,1.]]]){const m=body('moon',sunDir,c,[.25,.35,.38],[.3,.9,.8]);m.scale.setScalar(s);m.position.set(...p);sc.add(m);}}}

/* ---------- materials ---------- */
function makeMats(T,theme){const k=(n,o)=>{n.repeat?.set(1,1);return o;};const std=o=>new THREE.MeshStandardMaterial(o);
 const rk=(c,seed,r=1)=>{const s=rockSet(c[0],c[1],seed);return std({...s,roughness:r,metalness:0});};
 const st=(c,seed,o={})=>{const s=stoneSet(c[0],c[1],seed,o);const m=std({...s,roughness:.9,metalness:0});if(s.emissiveMap){m.emissive=new THREE.Color(T.glow);m.emissiveIntensity=1.6;}return m;};
 const ground=rk(T.ground,17,1),cliff=rk(T.cliff,29,1),mega=rk(T.mega,41,1);
 const stone=st(T.stone,7,{rows:4}),glyph=st(T.stone,9,{rows:4,glyph:1}),floor=st(T.stone.map(c=>c.map(v=>v*.82)),13,{rows:2,glyph:1});
 const hs=panelSet(T.hull,23,{stripes:'#'+new THREE.Color(T.glow).getHexString()});const hull=std({...hs,roughness:.45,metalness:.75});
 floor.emissiveIntensity=.9;
 return{ground,ground2:floor,floor,cliff,rock:cliff,megalith:mega,wall:glyph,plat:stone,column:stone,mono:glyph,stone,hull,door:glyph};}

/* ---------- build ---------- */
export function buildScene(D,R,gfx){const dest=D.dest,theme=dest.theme,T=THEMES[theme],root=new THREE.Group(),anim=[];const sunDir=new V(...T.sun[2]).normalize();
 const mats=makeMats(T,theme);const gc=new THREE.Color(T.glow),gc2=new THREE.Color(T.glow2);
 const trimC={g:gc.clone().multiplyScalar(2.4),h:gc.clone().multiplyScalar(2),m:gc.clone().multiplyScalar(2.6),s:C(3,1.2,.3)};
 const buckets={},trims={};const add=(b,g)=>(buckets[b]||(buckets[b]=[])).push([g]);const trim=(k,g)=>(trims[k]||(trims[k]=[])).push([g]);
 const cylUV=(g,Rr,scale)=>{const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)*scale,p.getZ(i)*scale);else uv.setXY(i,Math.atan2(p.getZ(i),p.getX(i))*Rr*scale,p.getY(i)*scale);}return g;};
 for(const s of D.solids){if(s.o.door||s.o.novis)continue;const h=s.b[1]-s.a[1];
  if(s.c){const seg=s.mat==='megalith'?7:Math.max(12,Math.min(64,s.R*10|0));const g=new THREE.CylinderGeometry(s.mat==='megalith'?s.R*.82:s.R,s.R,h,seg,1);g.translate(s.cx,s.a[1]+h/2,s.cz);
    if(s.mat==='megalith')g.rotateY(0);cylUV(g,s.R,.2);add(s.mat,g);
    if(s.mat==='column'){const cap=new THREE.CylinderGeometry(s.R*1.35,s.R*1.2,.35,14);cap.translate(s.cx,s.b[1]-.175,s.cz);cylUV(cap,s.R,.2);add('stone',cap);const bs=new THREE.CylinderGeometry(s.R*1.25,s.R*1.4,.4,14);bs.translate(s.cx,s.a[1]+.2,s.cz);cylUV(bs,s.R,.2);add('stone',bs);}
    if(s.o.trim){const t=new THREE.TorusGeometry(s.R+.015,.045,6,Math.max(24,s.R*12|0));t.rotateX(Math.PI/2);t.translate(s.cx,s.b[1]-.12,s.cz);trim(s.o.trim,t);}continue;}
  const w=s.b[0]-s.a[0],d=s.b[2]-s.a[2],cx=(s.a[0]+s.b[0])/2,cz=(s.a[2]+s.b[2])/2;const g=new THREE.BoxGeometry(w,h,d);g.translate(cx,s.a[1]+h/2,cz);boxUV(g,s.mat==='ground'||s.mat==='cliff'||s.mat==='rock'?.12:.25);add(s.mat,g);
  if(s.o.trim){const y=s.b[1]-.1;for(const[sx,sz,len,rot]of[[0,d/2+.012,w-.12,0],[0,-d/2-.012,w-.12,0],[w/2+.012,0,d-.12,1],[-w/2-.012,0,d-.12,1]]){if(len<.2)continue;const t=new THREE.BoxGeometry(rot?.03:len,.06,rot?len:.03);t.translate(cx+sx,y,cz+sz);trim(s.o.trim,t);}}}
 for(const r of D.ramps){add(r.mat,wedge(r));}
 const solidMeshes=[];for(const k in buckets){const m=new THREE.Mesh(merge(buckets[k]),mats[k]||mats.stone);m.castShadow=k!=='ground'&&k!=='ground2'&&k!=='floor';m.receiveShadow=true;root.add(m);solidMeshes.push(m);}
 for(const k in trims){root.add(new THREE.Mesh(merge(trims[k]),new THREE.MeshBasicMaterial({color:trimC[k]||trimC.g})));}
 const glowMat=k=>new THREE.MeshBasicMaterial({color:gc.clone().multiplyScalar(k)}),glow=glowTex(),r=rng(dest.seed*7+3);
 const crystalM=new THREE.MeshStandardMaterial({color:gc.clone().multiplyScalar(.5),emissive:gc,emissiveIntensity:1.4,roughness:.15,metalness:.2,transparent:true,opacity:.92});
 // ---- set pieces ----
 for(const d of D.deco){
  if(d.type==='gateframe'){const parts=[],gl=[];for(const s of[-1,1]){parts.push([new THREE.BoxGeometry(.7,d.h+1,.7),M4(d.x+s*(d.w/2+.35),(d.h+1)/2,d.z)]);gl.push([new THREE.BoxGeometry(.08,d.h,.08),M4(d.x+s*(d.w/2+.02),d.h/2,d.z+.1)]);}
    parts.push([new THREE.BoxGeometry(d.w+2.2,.8,.8),M4(d.x,d.h+1.2,d.z)]);gl.push([new THREE.BoxGeometry(d.w,.08,.08),M4(d.x,d.h+.05,d.z+.1)]);const t=new THREE.TorusGeometry(1.4,.07,6,40);gl.push([t,M4(d.x,d.h+2.6,d.z+.2)]);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;gl.push([new THREE.OctahedronGeometry(.18,0),M4(d.x+Math.cos(a)*1.4,d.h+2.6+Math.sin(a)*1.4,d.z+.2)]);}
    const m=new THREE.Mesh(merge(parts),mats.stone);m.castShadow=true;root.add(m);root.add(new THREE.Mesh(merge(gl),glowMat(2.4)));}
  else if(d.type==='altar'){const g=new THREE.Group();g.position.set(d.x,d.y+1.2,d.z);const cr=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),crystalM);cr.scale.set(.7,1.4,.7);g.add(cr);
    for(let i=0;i<2;i++){const rr=new THREE.Mesh(new THREE.TorusGeometry(1+i*.35,.03,6,48),glowMat(2));rr.rotation.x=Math.PI/2;g.add(rr);}const pl=new THREE.PointLight(T.glow,18,14,1.6);g.add(pl);root.add(g);
    anim.push(t=>{cr.rotation.y=t*.6;g.position.y=d.y+1.2+Math.sin(t*1.3)*.15;g.children[1].rotation.z=t*.5;g.children[2].rotation.y=t*.7;g.children[2].rotation.x=Math.PI/2+Math.sin(t)*.3;});}
  else if(d.type==='arch'){const g=new THREE.BoxGeometry(d.ax==='x'?d.w+1.6:1.8,1.1,d.ax==='x'?1.8:d.w+1.6);g.translate(d.x,d.h+.55,d.z);boxUV(g,.25);const m=new THREE.Mesh(g,mats.plat);m.castShadow=true;root.add(m);
    const k=new THREE.BoxGeometry(d.ax==='x'?.8:.3,.8,d.ax==='x'?.3:.8);k.translate(d.x,d.h+.5,d.z+(d.ax==='x'?.92:0));root.add(new THREE.Mesh(k,glowMat(2.2)));}
  else if(d.type==='glyph'){const parts=[];for(const[sx,sz]of[[0,1],[0,-1],[1,0],[-1,0]]){for(let k=0;k<3;k++){const y=1+k*(d.h-2)/3+r()*.6;parts.push([new THREE.BoxGeometry(sx?.04:.12+r()*.25,.06+r()*.3,sz?.04:.12+r()*.25),M4(d.x+sx*.72,y,d.z+sz*.72)]);}}
    parts.push([new THREE.OctahedronGeometry(.3,0),M4(d.x,d.h+.9,d.z)]);root.add(new THREE.Mesh(merge(parts),glowMat(2.6)));}
  else if(d.type==='ship'){const g=new THREE.Group();g.position.set(d.x,0,d.z);const hm=mats.hull;const fus=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,16,12,1),hm);fus.rotation.set(Math.PI/2,0,.2);fus.position.set(0,2.2,1);g.add(fus);
    const nose=new THREE.Mesh(new THREE.ConeGeometry(2.2,5,12),hm);nose.rotation.set(Math.PI/2+.25,0,.2);nose.position.set(0,1.6,-9.2);g.add(nose);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(14,.4,5),hm);wing.position.set(-2,1.3,3);wing.rotation.set(0,.15,-.25);g.add(wing);const fin=new THREE.Mesh(new THREE.BoxGeometry(.4,4,4),hm);fin.position.set(0,5,7);fin.rotation.z=.2;g.add(fin);
    const eng=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,.4,16),new THREE.MeshBasicMaterial({color:C(3,1.2,.4)}));eng.rotation.x=Math.PI/2;eng.position.set(0,2.4,9.1);g.add(eng);
    const cp=new THREE.Mesh(new THREE.SphereGeometry(1.5,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x223040,roughness:.05,metalness:1,envMapIntensity:2}));cp.position.set(0,3.8,-4);cp.scale.set(1,.6,1.6);g.add(cp);
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(g);}
  else if(d.type==='span'){const g=new THREE.BoxGeometry(d.w,1.4,1.6);g.translate(0,d.y+.7,d.z);boxUV(g,.25);const parts=[[g]];for(const s of[-1,1]){const b=new THREE.BoxGeometry(1.6,3,1.6);b.rotateZ(s*.7);b.translate(s*(d.w/2-1.6),d.y-.6,d.z);boxUV(b,.25);parts.push([b]);}
    const m=new THREE.Mesh(merge(parts),mats.wall);m.castShadow=true;root.add(m);const t=new THREE.BoxGeometry(d.w-1,.08,.08);t.translate(0,d.y-.05,d.z-.82);root.add(new THREE.Mesh(t,glowMat(2)));}
  else if(d.type==='dais'){const U={uT:{value:0},uC:{value:gc.clone().multiplyScalar(1.4)}};const m=new THREE.Mesh(new THREE.RingGeometry(7.2,12,96,1),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
     vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vP;void main(){float r=length(vP),a=atan(vP.y,vP.x);float g=step(.5,fract(a*12./6.2832+r*.05-uT*.05))*smoothstep(.06,.0,abs(fract(r*.5)-.5)-.18);float e=smoothstep(.15,0.,abs(r-7.6))+smoothstep(.15,0.,abs(r-11.6));gl_FragColor=vec4(uC*(e*.9+g*.25),1.);}'}));
    m.rotation.x=-Math.PI/2;m.position.set(d.x,.03,d.z);root.add(m);anim.push(t=>U.uT.value=t);}
  else if(d.type==='beacon'){const g=new THREE.Group();g.position.set(d.x,d.y,d.z);const ob=new THREE.Mesh(new THREE.CylinderGeometry(.25,.5,3,6),mats.plat);ob.position.y=1.5;g.add(ob);
    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.4,2),new THREE.MeshBasicMaterial({color:gc2.clone().multiplyScalar(3)}));orb.position.y=3.6;g.add(orb);
    const U={uT:{value:0},uK:{value:.15},uC:{value:gc2.clone()}};const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.9,120,24,1,true),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
     vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT,uK;uniform vec3 uC;varying vec2 vU;void main(){float s=fract(vU.y*20.-uT*1.5);float a=(.35+.65*smoothstep(0.,.2,s)*smoothstep(.6,.2,s))*pow(1.-vU.y,1.5)*uK;gl_FragColor=vec4(uC*a*2.,1.);}'}));
    beam.position.y=63;g.add(beam);const pl=new THREE.PointLight(T.glow2,10,16,1.6);pl.position.y=3.6;g.add(pl);root.add(g);D.beaconFx={U,orb,pl};anim.push(t=>{U.uT.value=t;orb.rotation.y=t;orb.position.y=3.6+Math.sin(t*2)*.12;});}}
 // ---- doors (dynamic) ----
 const doors={};for(const k in D.doors){const s=D.doors[k];const w=s.b[0]-s.a[0],h=s.b[1]-s.a[1],d=s.b[2]-s.a[2];const g=new THREE.BoxGeometry(w,h,d);boxUV(g,.25);const m=new THREE.Mesh(g,mats.door);m.position.set((s.a[0]+s.b[0])/2,s.a[1]+h/2,(s.a[2]+s.b[2])/2);m.castShadow=true;root.add(m);
  const seam=new THREE.Mesh(new THREE.BoxGeometry(.12,h-.4,d+.06),glowMat(3));m.add(seam);const ring=new THREE.Mesh(new THREE.TorusGeometry(Math.min(w,h)*.28,.08,6,48),glowMat(3));ring.position.z=d/2+.04;m.add(ring);const ring2=ring.clone();ring2.position.z=-d/2-.04;m.add(ring2);
  doors[k]={m,y0:m.position.y,h,open:0};}
 // ---- crystals along cliffs and in corners ----
 const cr=[];for(let i=0;i<90;i++){let x,z;const zone=r();if(zone<.55){const s=r()<.5?-1:1;x=s*(43-r()*4);z=-6+r()*78;}else if(zone<.75){x=(r()-.5)*86;z=70-r()*4;}else{const a=r()*6.28;x=Math.cos(a)*31;z=-134+Math.sin(a)*31;if(z>-108)continue;}
  const n=2+(r()*4|0);for(let k=0;k<n;k++){const g=new THREE.OctahedronGeometry(1,0);const s=.25+r()*.6,hh=s*(2.5+r()*3);cr.push([g,M4(x+(r()-.5)*1.4,hh*.4,z+(r()-.5)*1.4,(r()-.5)*.8,r()*3,(r()-.5)*.8,s,hh,s)]);}}
 const crm=new THREE.Mesh(merge(cr),crystalM);root.add(crm);
 // ---- flora / rubble ----
 const fl=[],rb=[];for(let i=0;i<260;i++){const x=(r()-.5)*88,z=-6+r()*78;if(Math.abs(x)<5&&z>34)continue;
  if(T.flora==='glow'){const h=.6+r()*1.8;const g=new THREE.ConeGeometry(.05,h,5);fl.push([g,M4(x,h/2,z,(r()-.5)*.3,0,(r()-.5)*.3)]);const t=new THREE.SphereGeometry(.09,6,4);fl.push([t,M4(x,h,z)]);}
  else if(T.flora==='dead'){const h=.8+r()*2.2;const g=new THREE.CylinderGeometry(.02,.07,h,5);fl.push([g,M4(x,h/2,z,(r()-.5)*.5,0,(r()-.5)*.5)]);}
  else{const h=.5+r()*1.6;const g=new THREE.ConeGeometry(.08,h,4);fl.push([g,M4(x,h/2,z,(r()-.5)*.6,r()*3,(r()-.5)*.6)]);}
  if(r()<.5){const s=.15+r()*.45;const g=new THREE.DodecahedronGeometry(s,0);rb.push([g,M4(x+r()*2,s*.4,z+r()*2,r()*3,r()*3,0,1,.6+r()*.5,1)]);}}
 for(let i=0;i<120;i++){const x=(r()-.5)*18,z=-14-r()*86;const s=.12+r()*.3;rb.push([new THREE.DodecahedronGeometry(s,0),M4(x,s*.3,z,r()*3,r()*3,0,1,.6,1)]);}
 const flM=T.flora==='glow'?new THREE.MeshStandardMaterial({color:0x1a4a3e,emissive:gc2,emissiveIntensity:.9,roughness:.6}):T.flora==='dead'?new THREE.MeshStandardMaterial({color:0x2a1a14,roughness:1}):new THREE.MeshStandardMaterial({color:0xd8d0c4,roughness:.6,emissive:gc,emissiveIntensity:.08});
 const flm=new THREE.Mesh(merge(fl),flM);flm.castShadow=gfx>1;root.add(flm);const rbm=new THREE.Mesh(merge(rb),mats.rock);rbm.castShadow=true;rbm.receiveShadow=true;root.add(rbm);
 // ---- distant spires + floating isles (silhouettes beyond the cliffs) ----
 const far=[];for(let i=0;i<54;i++){const a=r()*Math.PI*2,dist=120+r()*240,cx=Math.cos(a)*dist,cz=-40+Math.sin(a)*dist*1.3;const h=40+r()*130,w=8+r()*22;
  const g=theme==='wastes'?new THREE.CylinderGeometry(w*.75,w,h,6+(r()*3|0)):new THREE.ConeGeometry(w,h,5+(r()*3|0));far.push([g,M4(cx,h/2-10,cz,(r()-.5)*.15,r()*3,(r()-.5)*.15)]);}
 const isl=[];for(let i=0;i<16;i++){const a=r()*Math.PI*2,dist=70+r()*120,s=4+r()*10,y=30+r()*40;const top=new THREE.CylinderGeometry(s,s*.8,s*.35,8);const bot=new THREE.ConeGeometry(s*.8,s*1.8,8);bot.rotateX(Math.PI);
  isl.push([top,M4(Math.cos(a)*dist,y,-40+Math.sin(a)*dist)]);isl.push([bot,M4(Math.cos(a)*dist,y-s*1.05,-40+Math.sin(a)*dist)]);}
 const farM=new THREE.Mesh(merge(far),mats.megalith);root.add(farM);const islM=new THREE.Mesh(merge(isl),mats.cliff);root.add(islM);anim.push(t=>{islM.position.y=Math.sin(t*.25)*1.5;});
 // ---- sky + environment ----
 const skyScene=new THREE.Scene();const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),skyMat(theme,sunDir));sky.frustumCulled=false;skyScene.add(sky);skyPieces(theme,sunDir,skyScene);
 const crt=new THREE.WebGLCubeRenderTarget(gfx>=2?1024:512,{type:THREE.HalfFloatType});const cc=new THREE.CubeCamera(1,20000,crt);cc.position.set(0,4,0);skyScene.add(cc);cc.update(R,skyScene);
 skyScene.traverse(o=>{if(o.geometry&&o!==cc)o.geometry.dispose();});const bgTex=crt.texture;
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uC:{value:bgTex}},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform samplerCube uC;varying vec3 vD;void main(){gl_FragColor=vec4(textureCube(uC,normalize(vD)).rgb*1.6,1.);}'})));
 const p=new THREE.Mesh(new THREE.PlaneGeometry(40,6),new THREE.MeshBasicMaterial({color:new THREE.Color(T.sun[0]).multiplyScalar(2.2),side:THREE.DoubleSide}));p.position.set(sunDir.x*40,sunDir.y*40,sunDir.z*40);p.lookAt(0,0,0);envScene.add(p);
 const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(envScene,.03).texture;pm.dispose();
 const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);root.add(hemi);
 const sun=new THREE.DirectionalLight(T.sun[0],T.sun[1]);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:10,far:260});sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;root.add(sun,sun.target);
 const follow=(x,z)=>{sun.position.set(x+sunDir.x*120,sunDir.y*120,z+sunDir.z*120);sun.target.position.set(x,0,z);};follow(0,30);
 for(const l of D.lights){const pl=new THREE.PointLight(l.c||T.glow,l.i,l.d,1.6);pl.position.copy(l.p);root.add(pl);}
 return{root,env,sun,follow,hemi,anim,theme:T,fog:new THREE.FogExp2(T.fog[0],T.fog[1]),bg:bgTex,solidMeshes,doors,glow:gc,glow2:gc2,
  setDoor(k,t){const d=doors[k];if(!d)return;d.open=t;d.m.position.y=d.y0-d.h*Math.min(1,t)*1.02;d.m.visible=t<.99;},
  update(t){for(const f of anim)f(t);}};}
function wedge(r){const{x0,z0,x1,z1,axis,dir,y0,y1}=r;const P=(u,w,y)=>axis==='x'?[u,y,w]:[w,y,u];const u0=axis==='x'?x0:z0,u1=axis==='x'?x1:z1,w0=axis==='x'?z0:x0,w1=axis==='x'?z1:x1;const lo=dir>0?u0:u1,hi=dir>0?u1:u0;
 const tri=[];const q=(a,b,c,d)=>tri.push(a,b,c,a,c,d);const A=P(lo,w0,y0),B=P(lo,w1,y0),Ct=P(hi,w1,y1),Dt=P(hi,w0,y1),Cb=P(hi,w1,y0),Db=P(hi,w0,y0);
 q(A,B,Ct,Dt);q(Db,Dt,Ct,Cb);tri.push(A,Dt,Db);tri.push(B,Cb,Ct);q(A,Db,Cb,B);
 const pos=new Float32Array(tri.length*3);tri.forEach((p,i)=>pos.set(p,i*3));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(tri.length*2),2));g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;for(let i=0;i<p.count;i+=3){const mx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-cx,my=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3-cy,mz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-cz;
  if(mx*n.getX(i)+my*n.getY(i)+mz*n.getZ(i)<0){const t=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)];p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,...t);}}
 g.computeVertexNormals();boxUV(g,.25);return g;}
