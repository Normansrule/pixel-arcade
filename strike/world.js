// STRIKE ZONE — builds the arena meshes from a Level: merged column geometry, lava, sky, lights, jump pads, teleporters, rune walls, props.
import * as THREE from '../vendor/three.module.min.js';
import {CS} from './levels.js';
const V=THREE.Vector3,R=Math.random;

class GB{constructor(){this.p=[];this.n=[];this.u=[];this.c=[];this.i=[];}
 quad(a,b,c,d,n,ua,ub,uc,ud,col){const k=this.p.length/3;this.p.push(...a,...b,...c,...d);for(let q=0;q<4;q++){this.n.push(...n);if(col)this.c.push(...col);}this.u.push(...ua,...ub,...uc,...ud);this.i.push(k,k+1,k+2,k,k+2,k+3);}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));if(this.c.length)g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingSphere();return g;}}

const NOISE=`float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}`;
function fogMat(o){return new THREE.ShaderMaterial({...o,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,o.uniforms||{}]),fog:true});}

export const MOOD={
 ash:{fog:0x1c0d08,fogD:.010,sky:[0x0c0302,0x4a1408,0xff5010],hemi:[0xffb090,0x2a1410,.55],sun:[0xffa060,2.2],sunDir:[-30,60,20],exp:1.0,bloom:.6,thr:.8,sat:1.12,tint:0xfff0e6,lava:[1,.32,.05],ember:[2.6,.9,.2]},
 nave:{fog:0x0e0a18,fogD:.014,sky:[0x05030c,0x2a1048,0xb050ff],hemi:[0xc0a0ff,0x1a1028,.6],sun:[0xd0b0ff,1.7],sunDir:[40,60,-20],exp:1.05,bloom:.8,thr:.7,sat:1.1,tint:0xf2ecff,lava:[.9,.25,.6],ember:[1.6,.5,2.6]},
 void:{fog:0x041210,fogD:.011,sky:[0x010406,0x05201a,0x1a9060],hemi:[0xa0ffe0,0x081814,.55],sun:[0xb8ffe8,1.8],sunDir:[30,70,30],exp:1.0,bloom:.8,thr:.7,sat:1.08,tint:0xeefff6,lava:[.2,1,.5],ember:[.4,2.4,1.2]}};

const ENV={};
// reflection environment: a gradient dome with a few hot panels, prefiltered with PMREM (gives metals something to reflect)
function envFor(mood,M,renderer){if(ENV[mood]||!renderer)return ENV[mood]||null;const s=new THREE.Scene();const geo=new THREE.SphereGeometry(10,32,16);const c0=new THREE.Color(M.sky[0]),c1=new THREE.Color(M.sky[1]).multiplyScalar(1.6),c2=new THREE.Color(M.sky[2]);const col=[];const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i)/10;const c=new THREE.Color().copy(c1).lerp(c0,Math.max(0,y)).lerp(new THREE.Color(.05,.04,.04),Math.max(0,-y)*1.4);col.push(c.r,c.g,c.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 s.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));const lav=new THREE.Color(...M.lava).multiplyScalar(4);
 for(let k=0;k<6;k++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(3,1.2),new THREE.MeshBasicMaterial({color:k%2?lav:c2.clone().multiplyScalar(2.5),side:THREE.DoubleSide}));const a=k/6*Math.PI*2;pl.position.set(Math.cos(a)*8,k%2?-1.5:3,Math.sin(a)*8);pl.lookAt(0,0,0);s.add(pl);}
 const top=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({color:new THREE.Color(M.hemi[0]).multiplyScalar(1.5),side:THREE.DoubleSide}));top.position.y=9;top.rotation.x=Math.PI/2;s.add(top);
 const pm=new THREE.PMREMGenerator(renderer);ENV[mood]=pm.fromScene(s,.03).texture;pm.dispose();return ENV[mood];}
export function buildWorld(L,TX,renderer){const def=L.def,M=MOOD[def.mood],group=new THREE.Group(),W=L.W,H=L.H;
 const std=(o)=>new THREE.MeshStandardMaterial(o);
 const rep=(t,x,y)=>{t.repeat.set(x,y);return t;};
 const mats={floor:std({map:TX.floor,emissiveMap:TX.floorE,emissive:0xffffff,emissiveIntensity:def.mood==='void'?.45:.8,roughnessMap:TX.floorR,roughness:.85,metalness:.45}),
  side:std({map:TX.side,roughness:.6,metalness:.3}),
  wall:std({map:TX.wall,emissiveMap:TX.wallE,emissive:0xffffff,emissiveIntensity:1.6,roughness:.9,metalness:.05}),
  pillar:std({map:TX.pillar,emissiveMap:TX.pillarE,emissive:0xffffff,emissiveIntensity:1.8,roughness:.8,metalness:.15}),
  crate:std({map:TX.crate,roughness:.75,metalness:.2}),lip:new THREE.MeshBasicMaterial({color:new THREE.Color(M.lava[0],M.lava[1],M.lava[2]).multiplyScalar(2.2)})};
 for(const k of['floor','side','wall','pillar','crate'])mats[k].envMapIntensity=.3;
 const B={floor:new GB(),side:new GB(),wall:new GB(),pillar:new GB(),crate:new GB(),lip:new GB()};
 const kind=c=>c==='#'||c==='W'?'wall':c==='H'||c==='C'?'pillar':c==='x'?'crate':'side';
 const vt=(i,j)=>{if(i<0||j<0||i>=W||j>=H)return def.mood==='void'?-60:8;return L.top[j*W+i];};
 const isW=(i,j)=>i>=0&&j>=0&&i<W&&j<H&&L.ch[j*W+i]==='W';
 const floorBottom=def.mood==='void'?-9:-2;
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const c=L.ch[j*W+i];if(c==='v'||c==='W')continue;const t=L.top[j*W+i],x0=i*CS,x1=x0+CS,z0=j*CS,z1=z0+CS;
  // top face
  const tk=c==='#'?'wall':c==='H'||c==='C'?'pillar':c==='x'?'crate':'floor';if(c!=='L')B[tk].quad([x0,t,z1],[x1,t,z1],[x1,t,z0],[x0,t,z0],[0,1,0],[x0/4,-z1/4],[x1/4,-z1/4],[x1/4,-z0/4],[x0/4,-z0/4]);
  // sides where the neighbour is lower (and hull walls facing in)
  for(const[di,dj,nx,nz]of[[1,0,1,0],[-1,0,-1,0],[0,1,0,1],[0,-1,0,-1]]){const ni=i+di,nj=j+dj;let nt=vt(ni,nj);if(isW(ni,nj))nt=Math.min(nt,-2);const out=ni<0||nj<0||ni>=W||nj>=H;
   const bot=Math.max(nt,c==='L'?-2:floorBottom);
   if(t>nt+.01||(c!=='L'&&nt<-50)){const yb=nt<-50?floorBottom:bot;side(B[kind(c)],i,j,di,dj,yb,t,c);}
   if(out&&nt>t+.01){side(B.wall,i+di,j+dj,-di,-dj,t,nt,'#');}}}
 function side(b,i,j,di,dj,y0,y1,c){const x0=i*CS,z0=j*CS;let a,bb;if(di===1){a=[x0+CS,z0+CS];bb=[x0+CS,z0];}else if(di===-1){a=[x0,z0];bb=[x0,z0+CS];}else if(dj===1){a=[x0,z0+CS];bb=[x0+CS,z0+CS];}else{a=[x0+CS,z0];bb=[x0,z0];}
  const u0=(a[0]+a[1])/4,u1=u0+CS/4;const sideK=c!=='#'&&c!=='H'&&c!=='C'&&c!=='x';
  // platform sides: v anchored at the top edge so the hazard band sits on the lip (texture covers 4 m)
  const v1=sideK?1:y1*.25,v0=sideK?1-(y1-y0)*.25:y0*.25;
  b.quad([a[0],y0,a[1]],[bb[0],y0,bb[1]],[bb[0],y1,bb[1]],[a[0],y1,a[1]],[di,0,dj],[u0,v0],[u1,v0],[u1,v1],[u0,v1]);
  if(sideK&&y1>-.1){const o=.012,ya=y1-.075,yb=y1-.03;B.lip.quad([a[0]+di*o,ya,a[1]+dj*o],[bb[0]+di*o,ya,bb[1]+dj*o],[bb[0]+di*o,yb,bb[1]+dj*o],[a[0]+di*o,yb,a[1]+dj*o],[di,0,dj],[0,0],[1,0],[1,1],[0,1]);}}
 for(const k in B){if(!B[k].p.length)continue;const m=new THREE.Mesh(B[k].geo(),mats[k]);m.castShadow=k!=='floor'&&k!=='lip';m.receiveShadow=true;group.add(m);}
 // void underside: dark rock skirt below islands
 if(def.mood==='void'){const gb=new GB();for(let j=0;j<H;j++)for(let i=0;i<W;i++){const c=L.ch[j*W+i];if(c==='v')continue;const x0=i*CS,z0=j*CS;gb.quad([x0,-9,z0],[x0+CS,-9,z0],[x0+CS,-9,z0+CS],[x0,-9,z0+CS],[0,-1,0],[0,0],[1,0],[1,1],[0,1]);}
  const m=new THREE.Mesh(gb.geo(),std({color:0x0a1210,roughness:1}));group.add(m);}

 /* ---------- lava ---------- */
 const lavaU={uT:{value:0},uCol:{value:new THREE.Color(...M.lava)}};let lava=null;
 {const gb=new GB();for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(L.ch[j*W+i]!=='L')continue;const x0=i*CS,z0=j*CS,y=-.22;gb.quad([x0,y,z0+CS],[x0+CS,y,z0+CS],[x0+CS,y,z0],[x0,y,z0],[0,1,0],[0,0],[1,0],[1,1],[0,1]);}
  if(gb.p.length){lava=new THREE.Mesh(gb.geo(),fogMat({uniforms:lavaU,vertexShader:`varying vec3 wp;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}`,
   fragmentShader:`uniform float uT;uniform vec3 uCol;varying vec3 wp;\n#include <fog_pars_fragment>\n${NOISE}\nvoid main(){vec2 p=wp.xz*.32;float n=fbm(p+vec2(uT*.07,uT*.05)+fbm(p*1.7-uT*.04)*1.6);float crust=smoothstep(.36,.56,n);float hot=pow(1.-crust,2.);vec3 c=mix(uCol*.85,vec3(.03,.012,.006),crust)+uCol*hot*.3*(.7+.3*sin(uT*2.+n*9.));c+=vec3(1.,.7,.4)*pow(hot,10.)*.3;gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}`}));group.add(lava);}}

 /* ---------- sky dome ---------- */
 const skyU={uT:{value:0},c0:{value:new THREE.Color(M.sky[0])},c1:{value:new THREE.Color(M.sky[1])},c2:{value:new THREE.Color(M.sky[2])}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vd;void main(){vd=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform float uT;uniform vec3 c0,c1,c2;varying vec3 vd;${NOISE}\nvoid main(){float y=vd.y;vec2 q=vd.xz/(abs(y)+.35);float a=atan(vd.z,vd.x);float sw=fbm(vec2(a*3.+uT*.02,length(q)*1.2-uT*.05)+q*.6);
   vec3 col=mix(c1,c0,smoothstep(-.05,.6,y));float cl=smoothstep(.45,.85,sw)*smoothstep(-.1,.3,y)*(1.-smoothstep(.6,1.,y));col=mix(col,c1*1.6,cl*.55);col+=c2*pow(max(0.,1.-abs(y+.02)*3.5),3.)*.55;col+=c2*smoothstep(.62,.9,sw)*smoothstep(.0,.25,y)*.25;
   gl_FragColor=vec4(col,1.);}`}));sky.position.set(W,0,H);sky.renderOrder=-1;group.add(sky);
 // distant silhouettes
 {const sil=std({color:0x050304,roughness:1});const g=new THREE.Group();for(let k=0;k<26;k++){const a=k/26*Math.PI*2+R()*.2,d=150+R()*80;const h=30+R()*70;let m;
   if(def.mood==='nave')m=new THREE.Mesh(new THREE.ConeGeometry(6+R()*6,h,4),sil);else if(def.mood==='void'){m=new THREE.Mesh(new THREE.DodecahedronGeometry(4+R()*7,0),std({color:0x0a1a16,roughness:1}));m.position.y=-30+R()*50;m.userData.far=1.6;}else m=new THREE.Mesh(new THREE.CylinderGeometry(3+R()*3,5+R()*5,h,7),sil);
   const fd=d*(m.userData.far||1);m.position.x=W+Math.cos(a)*fd;m.position.z=H+Math.sin(a)*fd;if(def.mood!=='void')m.position.y=h/2-12;m.rotation.y=R()*6;g.add(m);
   if(def.mood==='ash'&&R()<.6){const top=new THREE.Mesh(new THREE.SphereGeometry(2.2,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(3,1,.25),fog:false}));top.position.set(m.position.x,m.position.y+h/2+1,m.position.z);g.add(top);}}group.add(g);}

 /* ---------- lights ---------- */
 const hemi=new THREE.HemisphereLight(M.hemi[0],M.hemi[1],M.hemi[2]);group.add(hemi);
 const sun=new THREE.DirectionalLight(M.sun[0],M.sun[1]);sun.position.set(W+M.sunDir[0],M.sunDir[1],H+M.sunDir[2]);sun.target.position.set(W,0,H);sun.castShadow=true;const ext=Math.max(W,H)*1.15;
 Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:220});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;group.add(sun,sun.target);
 const plights=[];for(const l of def.lights){const p=new THREE.PointLight(l[3],l[4],l[5],1.6);p.position.set(l[0]*CS,l[2],l[1]*CS);group.add(p);plights.push({l:p,base:l[4],ph:R()*6});}

 /* ---------- jump pads + teleporters ---------- */
 const padMat=new THREE.MeshBasicMaterial({map:TX.ring,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(...M.ember).multiplyScalar(.8)});
 const gradT=(()=>{const c=document.createElement('canvas');c.width=4;c.height=128;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.6,'rgba(60,60,60,1)');g.addColorStop(1,'rgba(255,255,255,1)');x.fillStyle=g;x.fillRect(0,0,4,128);for(let i=0;i<128;i+=8){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,i,4,3);}const t=new THREE.CanvasTexture(c);return t;})();
 const pads=[];for(const pd of def.pads){const p=L.P(pd.at);const g=new THREE.Group();g.position.set(p.x,p.y,p.z);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.3,.16,24),std({color:0x1a1a1e,metalness:.8,roughness:.35}));base.position.y=.08;base.receiveShadow=true;g.add(base);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.05,32),padMat.clone());disc.rotation.x=-Math.PI/2;disc.position.y=.17;if(pd.hidden)disc.material.opacity=.35;g.add(disc);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.05,3.2,20,1,true),new THREE.MeshBasicMaterial({map:gradT,color:new THREE.Color(...M.ember).multiplyScalar(.045),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=1.7;if(pd.hidden)beam.visible=false;g.add(beam);
  group.add(g);const t=L.P(pd.to);pads.push({x:p.x,y:p.y,z:p.z,to:new V(t.x,t.y,t.z),disc,beam,hidden:pd.hidden,pulse:0});}
 const portMat=new THREE.MeshBasicMaterial({map:TX.portal,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,color:new THREE.Color(...M.ember).multiplyScalar(.7)});
 const teles=[];for(const tp of def.tele){const p=L.P(tp.at);const g=new THREE.Group();g.position.set(p.x,p.y,p.z);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.13,10,36),std({color:0x202024,metalness:.9,roughness:.3,emissive:new THREE.Color(...M.ember).multiplyScalar(.25)}));ring.position.y=1.45;g.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.15,32),portMat.clone());disc.position.y=1.45;g.add(disc);const disc2=disc.clone();disc2.rotation.y=Math.PI/2;g.add(disc2);
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.4,.14,24),std({color:0x16161a,metalness:.8,roughness:.4}));plate.position.y=.07;g.add(plate);
  group.add(g);const t=L.P(tp.to);teles.push({x:p.x,y:p.y,z:p.z,to:new V(t.x,t.y,t.z),yaw:tp.yaw??0,disc,disc2,ring});}

 /* ---------- rune walls (shoot the sigil to open a secret) ---------- */
 const runes=[];for(const r of L.runes){const[x0,z0,x1,z1]=r.cells;const w=(x1-x0+1)*CS,d=(z1-z0+1)*CS;const m=new THREE.Mesh(new THREE.BoxGeometry(w,8,d),[mats.wall,mats.wall,mats.wall,mats.wall,mats.wall,mats.wall]);m.position.set(x0*CS+w/2,4,z0*CS+d/2);m.castShadow=m.receiveShadow=true;group.add(m);
  const facing=z0<=1?1:z1>=H-2?-1:0;const sg=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:TX.sigil,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(...M.ember).multiplyScalar(.45)}));
  sg.position.set(0,-1.2,facing*(d/2+.02));if(facing<0)sg.rotation.y=Math.PI;m.add(sg);runes.push({r,m,sg});}

 /* ---------- props ---------- */
 const props=[],flames=[];const metal=std({color:0x2a2622,metalness:.85,roughness:.4});
 const brazier=(x,y,z,s=1)=>{const g=new THREE.Group();const stand=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.3*s,1.1*s,8),metal);stand.position.y=.55*s;const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.55*s,.25*s,.4*s,10,1,true),metal);bowl.position.y=1.25*s;
  const coal=new THREE.Mesh(new THREE.CircleGeometry(.5*s,10),new THREE.MeshBasicMaterial({color:new THREE.Color(...M.ember)}));coal.rotation.x=-Math.PI/2;coal.position.y=1.3*s;g.add(stand,bowl,coal);stand.castShadow=bowl.castShadow=true;g.position.set(x,y,z);group.add(g);flames.push(new V(x,y+1.4*s,z));};
 const links=[];const chain=(x,z,top,len)=>{for(let k=0;k<len/.16;k++)links.push([x,top-k*.16,z,k%2]);};
 const banner=(x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,3.2,1,6),std({map:TX.banner,side:THREE.DoubleSide,roughness:.9,emissive:0xffffff,emissiveMap:TX.banner,emissiveIntensity:.15}));m.position.set(x,y,z);m.rotation.y=ry;group.add(m);props.push({g:m,cloth:true,sw:R()*6});};
 // place braziers next to the walls at intervals, banners on walls
 const inner=(i,j)=>i>=0&&j>=0&&i<W&&j<H&&L.ch[j*W+i]!=='#'&&L.ch[j*W+i]!=='v'&&L.ch[j*W+i]!=='W';
 if(def.mood!=='void'){let n=0;for(let j=1;j<H-1;j++)for(let i=1;i<W-1;i++){if(!inner(i,j))continue;const wallN=['#'].includes(L.ch[(j-1)*W+i]),wallS=L.ch[(j+1)*W+i]==='#',wallE=L.ch[j*W+i+1]==='#',wallWst=L.ch[j*W+i-1]==='#';
   if(!(wallN||wallS||wallE||wallWst))continue;n++;const t=L.top[j*W+i];const cx=i*CS+1,cz=j*CS+1;
   if(n%7===0&&L.ch[j*W+i]==='.')brazier(cx+(wallE?.3:wallWst?-.3:0),t,cz+(wallS?.3:wallN?-.3:0));
   if(n%5===2){const ry=wallN?0:wallS?Math.PI:wallE?-Math.PI/2:Math.PI/2;banner(cx+(wallE?.95:wallWst?-.95:0),t+4.2,cz+(wallS?.95:wallN?-.95:0),ry);}}}
 if(def.mood==='ash'){for(let k=0;k<14;k++){const x=4+R()*(W*CS-8),z=4+R()*(H*CS-8);if(L.cellTop(x,z)>1)continue;chain(x,z,14,4+R()*6);}
  for(const[x,z]of[[17,17]])brazier(x*CS,L.visTop(x*CS,z*CS),z*CS,1.8);}
 if(links.length){const im=new THREE.InstancedMesh(new THREE.TorusGeometry(.09,.025,5,8),metal,links.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new V(1,1,1);links.forEach((l,k)=>{q.setFromAxisAngle(new V(0,1,0),l[3]?Math.PI/2:0);m4.compose(new V(l[0],l[1],l[2]),q,s);im.setMatrixAt(k,m4);});im.castShadow=true;group.add(im);}
 if(def.mood==='nave'){// stained-glass lancets along the long walls
  const glass=new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,.6,2.6)});const frame=std({color:0x0c0a10,roughness:.6,metalness:.4});
  for(let x=6;x<W*CS-6;x+=8){for(const z of[1.9*CS-.02,(H-2)*CS+.02]){const g=new THREE.Group();const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.2,5.4),glass);const arch=new THREE.Mesh(new THREE.CircleGeometry(1.1,16,0,Math.PI),glass);arch.position.y=2.7;g.add(pane,arch);
    for(let k=-1;k<=1;k++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.12,6.6,.1),frame);bar.position.set(k*.75,.5,.02);g.add(bar);}const hb=new THREE.Mesh(new THREE.BoxGeometry(2.3,.12,.1),frame);hb.position.set(0,.8,.02);g.add(hb);
    g.position.set(x,5.6,z);if(z>H)g.rotation.y=Math.PI;group.add(g);}}
  for(const[x,z]of[[36,10.2],[36,14.8]])brazier(x*CS,2,z*CS,1.4);
  const cand=new THREE.MeshBasicMaterial({color:new THREE.Color(2.5,1.4,3)});for(let k=0;k<30;k++){const x=(34+R()*5)*CS,z=(10+R()*6)*CS;const c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.2+R()*.4,6),cand);c.position.set(x,2+.15,z);group.add(c);}}
 let core=null;if(def.mood==='void'){// reactor core: banded cylinder with spinning rings and a sky beam
  core=new THREE.Group();const c=L.P([19.5,19.5]);core.position.set(c.x,0,c.z);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.4,14,24,1),std({color:0x101614,metalness:.8,roughness:.35}));body.position.y=7;body.castShadow=true;core.add(body);
  const bandM=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,3,1.4)});for(let k=0;k<5;k++){const b=new THREE.Mesh(new THREE.CylinderGeometry(3.45,3.45,.25,24,1,true),bandM);b.position.y=1.5+k*2.8;core.add(b);}
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,2,200,16,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.2,1.4,.6),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));beam.position.y=110;core.add(beam);
  core.userData.rings=[];for(let k=0;k<3;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(5+k*1.6,.12,6,48),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,2.2,1)}));r.position.y=6+k*2.2;core.add(r);core.userData.rings.push(r);}group.add(core);
  // abyss glow far below
  const abyss=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshBasicMaterial({color:new THREE.Color(.02,.12,.08),fog:false}));abyss.rotation.x=-Math.PI/2;abyss.position.set(W,-120,H);group.add(abyss);}
 const fog=new THREE.FogExp2(M.fog,M.fogD);
 const env=envFor(def.mood,M,renderer);
 let t=0;
 function update(dt,fx){t+=dt;lavaU.uT.value=t;skyU.uT.value=t;
  for(const p of plights)p.l.intensity=p.base*(.85+.15*Math.sin(t*7+p.ph)*Math.sin(t*3.1+p.ph*2));
  for(const p of pads){p.disc.rotation.z+=dt*2.4;p.pulse=Math.max(0,p.pulse-dt*2);p.disc.material.opacity=(p.hidden?.35:1)*(.7+.3*Math.sin(t*5))+p.pulse;p.beam.scale.y=1+p.pulse*.6;}
  for(const tp of teles){tp.disc.rotation.z-=dt*3;tp.disc2.rotation.z+=dt*2.2;tp.ring.rotation.z+=dt*.5;}
  for(const p of props){if(p.cloth){p.g.rotation.x=Math.sin(t*1.3+p.sw)*.05;}else{p.g.rotation.z=Math.sin(t*.8+p.sw)*.04;p.g.rotation.x=Math.cos(t*.6+p.sw)*.04;}}
  if(core){core.userData.rings.forEach((r,k)=>{r.rotation.x=Math.sin(t*.4+k)*.6;r.rotation.y+=dt*(.5+k*.3);});}
  for(const ru of runes){const r=ru.r;if(r.opening){r.open=Math.min(1,r.open+dt*.6);L.openRune(r,r.open);ru.m.position.y=4-8*r.open;if(r.open>=1)r.opening=false;}ru.sg.material.opacity=r.open>0?0:.6+.4*Math.sin(t*4);}
  if(fx){for(const f of flames)if(R()<dt*30)fx.sparks.emit(f.x+(R()-.5)*.5,f.y,f.z+(R()-.5)*.5,(R()-.5)*.4,1.6+R()*1.5,(R()-.5)*.4,M.ember[0],M.ember[1],M.ember[2],.22+R()*.2,.35+R()*.3,-1,.6);
   // drifting embers over the whole arena
   if(R()<dt*20){const x=R()*W*CS,z=R()*H*CS;fx.sparks.emit(x,-1+R()*3,z,(R()-.5)*.6,1+R()*1.5,(R()-.5)*.6,M.ember[0]*.6,M.ember[1]*.6,M.ember[2]*.6,.05,3+R()*3,-.15,.2);}
   if(lava&&R()<dt*14){for(let k=0;k<4;k++){const i=(R()*W)|0,j=(R()*H)|0;if(L.ch[j*W+i]==='L'){fx.sparks.emit(i*CS+R()*CS,-.2,j*CS+R()*CS,(R()-.5),2+R()*3,(R()-.5),M.ember[0],M.ember[1],M.ember[2],.12,.6+R()*.6,6,.3);break;}}}}}
 return{group,update,sun,fog,M,mats,pads,teles,runes,lavaU,hemi,plights,env};}
