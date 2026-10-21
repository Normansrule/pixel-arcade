// STORM ROYALE — nature look: procedural sky (gradient, sun, two cloud layers), splatted terrain textures and
// material (grass / forest floor / dirt / rock / sand / snow with triplanar rock and wet shorelines), and the
// alpha-card foliage atlas + tree / bush geometry. Everything is drawn into canvases once at load (<= 512 px).
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,smooth,rng,M,lumpy,tnoise,normalFrom} from './util.js';

/* ---------------- sky ---------------- */
const SKYNOISE=`float sh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sh(i),sh(i+vec2(1,0)),f.x),mix(sh(i+vec2(0,1)),sh(i+vec2(1,1)),f.x),f.y);}
float sfb(vec2 p){float a=0.,w=.5;for(int i=0;i<5;i++){a+=sn(p)*w;p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(3.1,1.7);w*=.5;}return a;}`;
export function skyMaterial(SUN,top,hor,o={}){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{uSun:{value:SUN},uTop:{value:top},uHor:{value:hor},uT:{value:0},uCov:{value:o.cov??.5},uStorm:{value:0},uGround:{value:new THREE.Color(o.ground??0x55603e)}},
 vertexShader:`varying vec3 vP;void main(){vP=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=${o.env?'p':'p.xyww'};}`,
 fragmentShader:`uniform vec3 uSun,uTop,uHor,uGround;uniform float uT,uCov,uStorm;varying vec3 vP;${SKYNOISE}
  void main(){vec3 d=normalize(vP);float h=d.y,sd=max(dot(d,uSun),0.);
   vec3 c=mix(uHor,uTop,pow(clamp(h,0.,1.),.48));c=mix(c,uHor*vec3(1.04,1.02,1.),exp(-max(h,0.)*14.)*.6);
   c+=vec3(1.,.82,.58)*pow(sd,6.)*.22*(1.-clamp(h*1.5,0.,1.))+vec3(1.,.9,.75)*pow(sd,60.)*.35;
   if(h>0.){vec2 uv=d.xz/(h+.12);
    // cumulus layer
    vec2 q=uv*.75+vec2(uT*.004,uT*.0015);float n=sfb(q),n2=sfb(q*2.7+vec2(9.,2.));float v=n*.82+n2*.3;float th=.62-uCov*.1;float dens=smoothstep(th,th+.09,v);
    vec2 qs=q+uSun.xz*.06;float vl=sfb(qs)*.82+sfb(qs*2.7+vec2(9.,2.))*.3;float lit=clamp(.62+(v-vl)*5.,0.,1.);float core=smoothstep(th+.04,th+.2,v);
    vec3 cc=mix(vec3(.58,.62,.7),vec3(1.1,1.07,1.02),lit*(1.-core*.35));cc+=vec3(1.,.85,.62)*pow(sd,4.)*.9*(1.-core)*lit;cc=mix(cc,uHor*1.02,smoothstep(.3,.0,h)*.55);
    float fade=smoothstep(.0,.18,h);c=mix(c,cc,dens*fade*.97);
    // high wispy cirrus
    vec2 q2=uv*vec2(.35,1.1)+vec2(uT*.002,0.);float ci=smoothstep(.55,.85,sfb(q2*1.7))*.35*fade*(1.-dens);c=mix(c,vec3(1.02,1.02,1.04),ci);}
   else{c=mix(uHor*.94,uGround,smoothstep(0.,-.25,h));}
   c+=vec3(1.,.96,.88)*smoothstep(.99955,.99985,sd)*24.;
   c=mix(c,vec3(.16,.08,.26),uStorm*.0);
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});}

/* ---------------- terrain textures ---------------- */
function canvas(n,draw){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');draw(x,n);return c;}
function tex(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
// fill with a base colour modulated by tileable fbm (and an optional second, coarser colour field)
function base(x,n,c0,c1,cells,seed,amp=.35){const f=tnoise(n,cells,seed,5),g=tnoise(n,Math.max(2,cells>>2),seed+9,3),img=x.createImageData(n,n),d=img.data;
 for(let i=0;i<n*n;i++){const t=g[i],m=1+(f[i]-.5)*2*amp;for(let k=0;k<3;k++)d[i*4+k]=cl((c0[k]+(c1[k]-c0[k])*t)*m,0,255);d[i*4+3]=255;}x.putImageData(img,0,0);}
// tileable draw helper: draws fn at (px,py) and its wrapped copies
const wrap=(n,px,py,r,fn)=>{for(const ox of[-n,0,n])for(const oy of[-n,0,n]){const X=px+ox,Y=py+oy;if(X<-r||Y<-r||X>n+r||Y>n+r)continue;fn(X,Y);}};
export function terrainTextures(){const n=512;let r=rng(301);const R=()=>r();
 const grass=canvas(n,(x)=>{base(x,n,[64,86,36],[92,108,44],8,11,.32);
  for(let i=0;i<26000;i++){const px=R()*n,py=R()*n,l=3+R()*7,a=(R()-.5)*1.2,v=R();const c=v<.45?[52+R()*30,80+R()*34,30+R()*14]:v<.85?[86+R()*40,112+R()*30,40+R()*18]:[140+R()*40,140+R()*30,70+R()*20];
   x.strokeStyle=`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${.55+R()*.4})`;x.lineWidth=.8+R()*.9;wrap(n,px,py,12,(X,Y)=>{x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.sin(a)*l,Y-Math.cos(a)*l);x.stroke();});}
  for(let i=0;i<500;i++){x.fillStyle=`rgba(40,34,20,${.15+R()*.25})`;const px=R()*n,py=R()*n,s=1+R()*2.5;wrap(n,px,py,4,(X,Y)=>{x.beginPath();x.arc(X,Y,s,0,7);x.fill();});}
  for(let i=0;i<90;i++){const px=R()*n,py=R()*n,col=R()<.5?'rgba(250,250,240,.8)':R()<.5?'rgba(250,220,90,.8)':'rgba(200,150,230,.75)';wrap(n,px,py,4,(X,Y)=>{x.fillStyle=col;x.beginPath();x.arc(X,Y,1.3,0,7);x.fill();});}});
 const forest=canvas(n,(x)=>{base(x,n,[58,46,30],[74,64,38],8,21,.35);
  for(let i=0;i<9000;i++){const px=R()*n,py=R()*n,l=4+R()*8,a=R()*6.28,v=R();x.strokeStyle=v<.6?`rgba(${120+R()*50|0},${70+R()*30|0},${30+R()*20|0},${.5+R()*.4})`:`rgba(${60+R()*30|0},${80+R()*30|0},${34},${.5+R()*.4})`;x.lineWidth=.8+R()*.6;
   wrap(n,px,py,12,(X,Y)=>{x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);x.stroke();});}
  for(let i=0;i<260;i++){const px=R()*n,py=R()*n,s=3+R()*5,a=R()*6.28,c=R()<.5?[150,96,40]:[110,120,46];wrap(n,px,py,8,(X,Y)=>{x.save();x.translate(X,Y);x.rotate(a);x.fillStyle=`rgba(${c},${.6+R()*.3})`;x.beginPath();x.ellipse(0,0,s,s*.45,0,0,7);x.fill();x.restore();});}
  for(let i=0;i<120;i++){const px=R()*n,py=R()*n,s=2+R()*4;wrap(n,px,py,6,(X,Y)=>{x.fillStyle=`rgba(${80+R()*30|0},${110+R()*40|0},40,.55)`;x.beginPath();x.arc(X,Y,s,0,7);x.fill();});}});
 const dirt=canvas(n,(x)=>{base(x,n,[112,86,58],[138,108,72],8,31,.3);
  for(let i=0;i<2600;i++){const px=R()*n,py=R()*n,s=.8+R()*3.2,l=.6+R()*.6;wrap(n,px,py,5,(X,Y)=>{x.fillStyle=`rgba(${150*l|0},${135*l|0},${115*l|0},.9)`;x.beginPath();x.ellipse(X,Y,s,s*.75,R()*3,0,7);x.fill();x.fillStyle='rgba(30,20,10,.35)';x.beginPath();x.ellipse(X+.6,Y+.8,s,s*.5,0,0,7);x.fill();});}
  x.strokeStyle='rgba(50,36,24,.35)';for(let i=0;i<40;i++){x.lineWidth=.7+R();x.beginPath();let px=R()*n,py=R()*n;x.moveTo(px,py);for(let k=0;k<5;k++){px+=(R()-.5)*30;py+=(R()-.5)*30;x.lineTo(px,py);}x.stroke();}});
 const rock=canvas(n,(x)=>{base(x,n,[112,108,102],[150,144,134],6,41,.42);const f=tnoise(n,3,47,3),img=x.getImageData(0,0,n,n),d=img.data;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=(j*n+i)*4,s=Math.sin((j/n*14+f[j*n+i]*6)*Math.PI)*.1;for(let c=0;c<3;c++)d[k+c]*=1+s;}x.putImageData(img,0,0);
  x.strokeStyle='rgba(40,38,36,.55)';for(let i=0;i<60;i++){x.lineWidth=.6+R()*1.6;x.beginPath();let px=R()*n,py=R()*n;x.moveTo(px,py);for(let k=0;k<6;k++){px+=(R()-.5)*44;py+=(R()-.5)*20;x.lineTo(px,py);}x.stroke();}
  for(let i=0;i<300;i++){const px=R()*n,py=R()*n,s=2+R()*6,c=R()<.6?'120,130,70':'190,180,120';wrap(n,px,py,8,(X,Y)=>{x.fillStyle=`rgba(${c},${.15+R()*.25})`;x.beginPath();x.arc(X,Y,s,0,7);x.fill();});}});
 const sand=canvas(n,(x)=>{base(x,n,[206,186,140],[224,206,160],10,51,.14);const img=x.getImageData(0,0,n,n),d=img.data;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=(j*n+i)*4,s=Math.sin((i/n*22+Math.sin(j/n*6.283*2)*1.5)*6.283)*.05+(R()-.5)*.12;for(let c=0;c<3;c++)d[k+c]*=1+s;}x.putImageData(img,0,0);
  for(let i=0;i<160;i++){const px=R()*n,py=R()*n;wrap(n,px,py,4,(X,Y)=>{x.fillStyle=R()<.5?'rgba(250,245,235,.7)':'rgba(120,100,80,.5)';x.fillRect(X,Y,1.5,1.5);});}});
 const T={grass:tex(grass),forest:tex(forest),dirt:tex(dirt),rock:tex(rock),sand:tex(sand)};
 T.grassN=normalFrom(grass,2.2);T.rockN=normalFrom(rock,3.2);T.dirtN=normalFrom(dirt,2.6);
 // average colour of grass for the grass-blade field
 {const x=grass.getContext('2d'),d=x.getImageData(0,0,n,n).data;let s=[0,0,0];for(let i=0;i<d.length;i+=64){s[0]+=d[i];s[1]+=d[i+1];s[2]+=d[i+2];}const k=d.length/64;T.grassAvg=new THREE.Color(s[0]/k/255,s[1]/k/255,s[2]/k/255).convertSRGBToLinear();}
 return T;}
// material: vertex colour = grass tint, aW = (dirt, rock, sand, forest) weights
export function terrainMaterial(T){const m=new THREE.MeshStandardMaterial({vertexColors:true,map:T.grass,normalMap:T.grassN,normalScale:new THREE.Vector2(.85,.85),roughness:.95,metalness:0,envMapIntensity:.55});
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,{tF:{value:T.forest},tD:{value:T.dirt},tR:{value:T.rock},tS:{value:T.sand},tRN:{value:T.rockN},tDN:{value:T.dirtN}});
  s.vertexShader='attribute vec4 aW;varying vec4 vW4;varying vec3 vWp,vNw;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvW4=aW;vWp=(modelMatrix*vec4(position,1.)).xyz;vNw=normal;');
  s.fragmentShader='uniform sampler2D tF,tD,tR,tS,tRN,tDN;varying vec4 vW4;varying vec3 vWp,vNw;float gW,gRk,gD,gSn;vec2 gUv;\n'+s.fragmentShader
   .replace('#include <map_fragment>',`vec2 wp=vWp.xz;gUv=wp*.21;vec3 nw=normalize(vNw);
    vec3 tg=mix(texture2D(map,gUv).rgb,texture2D(map,wp*.047+vec2(.31,.17)).rgb,.42)*vColor*1.06;
    vec3 tf=mix(texture2D(tF,wp*.19).rgb,texture2D(tF,wp*.051+.4).rgb,.4);
    vec3 td=mix(texture2D(tD,wp*.2).rgb,texture2D(tD,wp*.06+.2).rgb,.4);
    vec3 bw=pow(abs(nw),vec3(4.));bw/=bw.x+bw.y+bw.z;vec3 tr=texture2D(tR,vWp.zy*.09).rgb*bw.x+texture2D(tR,vWp.xz*.09).rgb*bw.y+texture2D(tR,vWp.xy*.09).rgb*bw.z;tr=mix(tr,texture2D(tR,wp*.023).rgb,.3);
    vec3 ts=mix(texture2D(tS,wp*.16).rgb,texture2D(tS,wp*.045).rgb,.35);
    float br=texture2D(tD,wp*.013).r;// breakup noise for blend edges
    float wD=clamp(vW4.x+(br-.45)*.5*vW4.x,0.,1.),wR=clamp(vW4.y*(1.+(br-.5)*.8),0.,1.),wS=vW4.z,wF=vW4.w;
    vec3 col=mix(tg,tf,wF);col=mix(col,td,wD);col=mix(col,ts,wS);
    float wet=smoothstep(1.1,.2,vWp.y)*wS;col*=1.-wet*.38;
    gSn=smoothstep(47.,53.,vWp.y+br*6.)*smoothstep(.55,.8,nw.y);col=mix(col,tr,wR);col=mix(col,vec3(.93,.95,1.),gSn);
    gW=wet;gRk=wR;gD=wD;
    diffuseColor.rgb*=col;`)
   .replace('#include <color_fragment>','')
   .replace('#include <roughnessmap_fragment>','float roughnessFactor=roughness*mix(1.,.86,gRk)*mix(1.,.45,gW)*mix(1.,.7,gSn);')
   .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;','vec3 mapN=texture2D(normalMap,gUv).xyz;mapN=mix(mapN,texture2D(tDN,vWp.xz*.2).xyz,gD);mapN=mix(mapN,texture2D(tRN,vWp.xz*.09).xyz,gRk);mapN=mapN*2.-1.;');};
 m.customProgramCacheKey=()=>'royale-terrain';return m;}

/* ---------------- foliage atlas: [pine spray | leaf cluster] over [bark | dense leaves] ---------------- */
export function foliageAtlas(){const n=512,h=256;let r=rng(77);const R=()=>r();
 const c=canvas(n,(x)=>{x.clearRect(0,0,n,n);
  // pine spray (u 0...5, v .5..1): stem from bottom centre to top, needles in fans
  x.save();x.beginPath();x.rect(0,0,h,h);x.clip();
  const stem=(x0,y0,x1,y1,w)=>{x.strokeStyle='#4a3420';x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();};
  stem(128,256,128,6,4);const twigs=[];for(let i=0;i<16;i++){const t=.08+i/16*.86,y=256-t*250,len=(1-t)*82+26,s=i%2?1:-1;twigs.push([128,y,128+s*len,y-len*.55]);stem(128,y,128+s*len,y-len*.55,2);}
  const needle=(px,py,a,l,col)=>{x.strokeStyle=col;x.lineWidth=1.6;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();};
  for(const[x0,y0,x1,y1]of[[128,256,128,6],...twigs]){const L=Math.hypot(x1-x0,y1-y0),ang=Math.atan2(y1-y0,x1-x0);for(let k=0;k<L;k+=2.2){const px=x0+(x1-x0)*k/L,py=y0+(y1-y0)*k/L,l=10+R()*9;
    for(const s of[-1,1]){const g=60+R()*60|0;needle(px,py,ang+s*(.75+R()*.35),l,`rgb(${30+R()*20|0},${g},${36+R()*22|0})`);}}}
  x.restore();
  // leaf cluster (u .5..1, v .5..1)
  x.save();x.beginPath();x.rect(h,0,h,h);x.clip();
  for(let i=0;i<520;i++){const a=R()*6.28,d=Math.pow(R(),.6)*108,px=h+128+Math.cos(a)*d,py=128+Math.sin(a)*d*.92,l=9+R()*8,rot=R()*6.28,v=R(),g=v<.5?[50+R()*25,90+R()*35,32]:[80+R()*40,122+R()*35,40+R()*15];
   x.save();x.translate(px,py);x.rotate(rot);x.fillStyle=`rgb(${g[0]|0},${g[1]|0},${g[2]|0})`;x.beginPath();x.ellipse(0,0,l,l*.48,0,0,7);x.fill();x.strokeStyle='rgba(20,40,10,.35)';x.lineWidth=.8;x.beginPath();x.moveTo(-l,0);x.lineTo(l,0);x.stroke();x.restore();}
  x.restore();
  // bark (u 0...5, v 0..0.5)
  {const f=tnoise(h,4,91,4),img=x.createImageData(h,h),d=img.data;for(let j=0;j<h;j++)for(let i=0;i<h;i++){const k=(j*h+i)*4,s=Math.abs(Math.sin((i/h*9+f[j*h+i]*2.4)*Math.PI)),v=60+f[((j*4)%h)*h+i]*50+s*40;d[k]=v*1.02;d[k+1]=v*.84;d[k+2]=v*.66;d[k+3]=255;}x.putImageData(img,0,h);
   for(let i=0;i<70;i++){x.fillStyle='rgba(25,18,12,.55)';x.fillRect(R()*h,h+R()*h,1.5+R()*2,10+R()*40);}}
  // dense leaves (u .5..1, v 0..0.5)
  x.fillStyle='#2f5222';x.fillRect(h,h,h,h);for(let i=0;i<1800;i++){const px=h+R()*h,py=h+R()*h,l=7+R()*7,v=R(),g=v<.5?[44+R()*25,80+R()*35,28]:[74+R()*40,112+R()*35,38];x.save();x.translate(px,py);x.rotate(R()*6.28);x.fillStyle=`rgb(${g[0]|0},${g[1]|0},${g[2]|0})`;x.beginPath();x.ellipse(0,0,l,l*.5,0,0,7);x.fill();x.restore();}});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
 const m=new THREE.MeshStandardMaterial({map:t,alphaTest:.42,side:THREE.DoubleSide,vertexColors:true,roughness:.82,envMapIntensity:.55});
 const U={uT:{value:0}};m.userData.U=U;
 m.onBeforeCompile=s=>{s.uniforms.uT=U.uT;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec3 ip=instanceMatrix[3].xyz;float lf=step(.5,uv.y)*max(position.y-1.2,0.);transformed.x+=sin(uT*1.6+ip.x*.13+ip.z*.07+position.y*.4)*.05*lf;transformed.z+=cos(uT*1.3+ip.z*.11+position.x)*.04*lf;
  #endif`);
  s.fragmentShader=s.fragmentShader.replace('float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;','float faceDirection = 1.0;');};
 m.customProgramCacheKey=()=>'royale-foliage';return m;}

// uv remapping helpers into atlas regions
function region(g,u0,v0,u1,v1){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+(u1-u0)*cl(uv.getX(i),0,1),v0+(v1-v0)*cl(uv.getY(i),0,1));return g;}
function boxUV(g,s,u0,v0,u1,v1,cy=0){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let a,b;if(ay>=ax&&ay>=az){a=p.getX(i);b=p.getZ(i);}else if(ax>=az){a=p.getZ(i);b=p.getY(i)-cy;}else{a=p.getX(i);b=p.getY(i)-cy;}
  uv.setXY(i,u0+(u1-u0)*cl(.5+a*s,.03,.97),v0+(v1-v0)*cl(.5+b*s,.03,.97));}return g;}
// merge with per-vertex colours from a callback (pos, normal) -> [r,g,b]
function mergeC(list){let n=0;const gs=list.map(([g,col])=>{g=g.index?g.toNonIndexed():g;n+=g.attributes.position.count;return[g,col];});const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),cc=new Float32Array(n*3);let o=0;
 for(const[g,col]of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);const p=g.attributes.position;
  for(let i=0;i<k;i++){const c=typeof col==='function'?col(p.getX(i),p.getY(i),p.getZ(i)):col;cc[(o+i)*3]=c[0];cc[(o+i)*3+1]=c[1];cc[(o+i)*3+2]=c[2];}o+=k;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(cc,3));r.computeBoundingSphere();return r;}
// a card: quad from base point outward along dir (unit, horizontal-ish), width w, length l; normals faked outward from (cx,cy,cz)
function card(o,dir,up,w,l,u0,v0,u1,v1,ctr){const side=new V().crossVectors(dir,up).normalize().multiplyScalar(w/2),e=o.clone().addScaledVector(dir,l);
 const P=[o.clone().sub(side),o.clone().add(side),e.clone().add(side),e.clone().sub(side)],UV=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];const pos=[],uv=[],nor=[];
 for(const i of[0,1,2,0,2,3]){pos.push(P[i].x,P[i].y,P[i].z);uv.push(...UV[i]);const nn=new V(P[i].x-ctr.x,(P[i].y-ctr.y)*.8+.6,P[i].z-ctr.z).normalize();nor.push(nn.x,nn.y,nn.z);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return g;}
function trunkGeo(r0,r1,h,seg=7,lean=0){const g=new THREE.CylinderGeometry(r0,r1,h,seg,3,true);g.translate(0,h/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+Math.sin(y*1.3)*.06+lean*y*y*.02);}g.computeVertexNormals();
 const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.01+uv.getX(i)*.48,.01+cl(uv.getY(i)*h*.12,0,.98)*.48);return g;}
const sphereN=(g,c,k=1)=>{const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new V(p.getX(i)-c.x,(p.getY(i)-c.y)*.8+.3*k,p.getZ(i)-c.z).normalize();n.setXYZ(i,v.x,v.y,v.z);}return g;};
export function pineGeo(seed){const r=rng(seed),R=()=>r(),list=[],ctr=new V(0,4.6,0);
 list.push([trunkGeo(.17,.36,8.4,7),[.8,.75,.7]]);
 {const core=new THREE.ConeGeometry(1.25,6.6,7,3,true);core.translate(0,5.1,0);const p=core.attributes.position;for(let i=0;i<p.count;i++){const k=1+(R()-.5)*.25;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}core.computeVertexNormals();boxUV(core,.11,.5,0,1,.5,5);sphereN(core,ctr,0);list.push([core,(x,y)=>{const t=.32+.4*smooth(1.5,8,y);return[t*.85,t,t*.8];}]);}
 const L=13;for(let i=0;i<L;i++){const t=i/(L-1),y=1.9+t*6.6,rad=lerp(3.1,.6,Math.pow(t,.85))*(.88+R()*.24),n=i>L-3?4:7,off=R()*6.28,droop=.42+R()*.15-t*.1;
  for(let k=0;k<n;k++){const a=off+k/n*6.28+(R()-.5)*.4,dir=new V(Math.cos(a),-droop,Math.sin(a)).normalize(),up=new V(0,1,0);const o=new V(Math.cos(a)*.1,y,Math.sin(a)*.1);
   const g=card(o,dir,up,rad*1.2,rad*1.08,0,.5,.5,1,ctr);const sh=.6+.5*t+R()*.12;list.push([g,(x,yy,z)=>{const d=Math.hypot(x,z)/rad;const s=sh*(.7+.4*d);return[s*.9,s,s*.82];}]);}}
 // tip
 for(let k=0;k<2;k++){const a=k*Math.PI/2+.3,o=new V(0,7.6,0),dir=new V(0,1,0),up=new V(Math.cos(a),0,Math.sin(a));list.push([card(o,dir,up,1.1,1.6,0,.5,.5,1,ctr),[1.05,1.1,.95]]);}
 return mergeC(list);}
export function broadGeo(seed,lo=0){const r=rng(seed),R=()=>r(),list=[],ctr=new V(0,5.1,0);
 list.push([trunkGeo(.2,.42,4.6,7,.3),[.85,.8,.75]]);
 for(const[a,t,len]of[[.4,.85,1.9],[2.6,-.8,1.7],[4.3,.7,1.6]]){const g=new THREE.CylinderGeometry(.06,.13,len,5,1,true);g.translate(0,len/2,0);g.applyMatrix4(M(0,0,0,0,a,t));g.translate(0,3.2+R()*.6,0);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.02+uv.getX(i)*.3,.02+uv.getY(i)*.3);list.push([g,[.8,.75,.7]]);}
 const clumps=[[0,5.2,0,2.25],[1.4,4.6,.6,1.7],[-1.25,4.8,-.6,1.65],[.2,6.5,.15,1.5],[-.4,4.5,1.35,1.4],[.65,5.7,-1.2,1.35]];
 for(const[cx,cy,cz,cr]of clumps){const core=lumpy(new THREE.IcosahedronGeometry(cr*.86,lo?0:1),cr*.22,R()*99|0);core.translate(cx,cy,cz);boxUV(core,.12,.5,0,1,.5,5);sphereN(core,ctr);list.push([core,(x,y,z)=>{const t=.38+.45*smooth(3.4,7,y);return[t*.9,t,t*.78];}]);
  for(let k=0;k<(lo?5:8);k++){const u=R()*2-1,a=R()*6.28,s=Math.sqrt(1-u*u),nrm=new V(Math.cos(a)*s,u*.8+.25,Math.sin(a)*s).normalize();const o=new V(cx,cy,cz).addScaledVector(nrm,cr*(.62+R()*.2));const w=cr*1.2*(.85+R()*.3);
   const t1=new V().crossVectors(nrm,new V(R()-.5,R()-.5,R()-.5)).normalize();let g;
   if(k%2)g=card(o.clone().addScaledVector(t1,-w/2),t1,nrm,w,w,.5,.5,1,1,ctr);else{const dir=nrm.clone().add(new V(0,-.2,0)).normalize();g=card(o.clone().addScaledVector(dir,-w*.45),dir,t1,w,w,.5,.5,1,1,ctr);}
   const sh=.75+.4*smooth(3.5,7,o.y)+R()*.1;list.push([g,[sh*.92,sh,sh*.8]]);}}
 return mergeC(list);}
export function bushGeo(seed,lo=0){const r=rng(seed),R=()=>r(),list=[],ctr=new V(0,.2,0);
 for(const[cx,cy,cz,cr]of[[0,.2,0,.95],[.75,.05,.35,.65],[-.6,.1,-.35,.62]]){const core=lumpy(new THREE.IcosahedronGeometry(cr*.85,lo?0:1),cr*.18,R()*99|0);core.scale(1.15,.8,1.15);core.translate(cx,cy,cz);boxUV(core,.3,.5,0,1,.5,0);sphereN(core,ctr);list.push([core,(x,y)=>{const t=.45+.4*smooth(-.4,.8,y);return[t*.9,t,t*.78];}]);
  for(let k=0;k<(lo?3:4);k++){const a=R()*6.28,nrm=new V(Math.cos(a),.5+R()*.4,Math.sin(a)).normalize(),o=new V(cx,cy,cz).addScaledVector(nrm,cr*.45),w=cr*1.3;list.push([card(o.clone().addScaledVector(nrm,-w*.3),nrm,new V(0,1,0),w,w,.5,.5,1,1,ctr),[.95,1.05,.85]]);}}
 return mergeC(list);}
