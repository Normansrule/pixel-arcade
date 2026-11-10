// SUMMIT RUSH - a golden-hour snowboard race for Pixel Arcade (original game).
// One long winding valley run: flag gates (100 each), eight kickers for spins (land within a quarter turn of straight or
// wipe out), tuck and carve physics on a real height field, three CPU riders (EASY/NORMAL/HARD), a three-minute race
// clock and a race report. Graphics: Preetham sky at sunset, sky-lit environment reflections, glittering snow,
// instanced pine forests with snow caps, distant peaks, soft shadows, powder spray and the shared cinematic post stack.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {postButton,stored,pickers} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id);
const ID='summitrush',DT=1/60,L=2600,LIMIT=180,HALF=48;
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
const DIFF=[{drag:.0037},{drag:.00315},{drag:.00268}];
const PLACE_PTS=[1500,1000,600,300],ORD=['1ST','2ND','3RD','4TH'],TOKENS=[25,12,8,5];
const RIDERS=[{name:'YOU',jacket:0xff6a3a,pants:0x2a2a44,board:0xffd04a,helm:0xffffff},{name:'MIRA',jacket:0x3a9aff,pants:0xe8e8f0,board:0x2a2a34,helm:0x2a2a34},
 {name:'OSKAR',jacket:0x46e0b0,pants:0x3a2a4a,board:0xff4a8a,helm:0xffd04a},{name:'JUNO',jacket:0xc86aff,pants:0x2a3a3a,board:0xffffff,helm:0xc86aff}];

/* ================= the course ================= */
const cx=z=>55*Math.sin(z*.0035)+25*Math.sin(z*.0091+1);
const hz=z=>-z*.3+6*Math.sin(z*.013);
const side=ad=>ad<=40?0:ad<=80?(ad-40)*(ad-40)*.02:32+(ad-80)*(.8+Math.min(.6,(ad-80)/400));
function base(x,z){const d=x-cx(z),ad=Math.abs(d);return hz(z)+d*d*.004*Math.min(1,48/Math.max(ad,1))+side(ad)+.6*Math.sin(x*.21+z*.13)*Math.sin(z*.07-x*.05);}
const KICK=[];for(let k=0;k<8;k++){const z=260+k*300;KICK.push({z,x:cx(z)+(k%2?6:-6)});}
function kick(x,z){for(const k of KICK){const dz=z-k.z;if(dz>-14&&dz<0&&Math.abs(x-k.x)<5.5)return 2.8*Math.pow((dz+14)/14,1.6);}return 0;}
const ground=(x,z)=>base(x,z)+kick(x,z);
const GATE=[];for(let z=140;z<L-60;z+=110){if(KICK.some(k=>Math.abs(k.z-z)<40))continue;GATE.push({z,x:cx(z)+(GATE.length%2?12:-12),poles:[]});}

/* ================= renderer, sky, light ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xb8b4d0,.0015);
const cam=new THREE.PerspectiveCamera(60,1,.3,12000);
const SUN=new THREE.Vector3().setFromSphericalCoords(1,THREE.MathUtils.degToRad(85.5),THREE.MathUtils.degToRad(28));
function makeSky(s){const sk=new Sky();sk.scale.setScalar(s);const u=sk.material.uniforms;u.turbidity.value=7;u.rayleigh.value=2.0;u.mieCoefficient.value=.006;u.mieDirectionalG.value=.86;u.sunPosition.value.copy(SUN);return sk;}
scene.add(makeSky(9000));
{const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene();es.add(makeSky(1000));scene.environment=pm.fromScene(es).texture;scene.environmentIntensity=.32;}
const hemi=new THREE.HemisphereLight(0x8aa8f0,0xe8c8b8,.42);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffb880,2.5);sun.castShadow=true;const sc=sun.shadow.camera;sc.left=-70;sc.right=70;sc.top=70;sc.bottom=-70;sc.near=1;sc.far=900;sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;scene.add(sun,sun.target);

/* ================= snow ================= */
function snowNormal(){const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N),h=new Float32Array(N*N);
 const G=16,g=[];for(let i=0;i<G*G;i++)g.push(rnd());const vn=(px,py)=>{const fx=px/N*G,fy=py/N*G,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0,s=t=>t*t*(3-2*t),at=(i,j)=>g[((j%G+G)%G)*G+((i%G+G)%G)];
  return lerp(lerp(at(i0,j0),at(i0+1,j0),s(tx)),lerp(at(i0,j0+1),at(i0+1,j0+1),s(tx)),s(ty));};
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)h[j*N+i]=vn(i,j)*.7+vn(i*3%N,j*3%N)*.25+rnd()*.08+Math.sin(j/N*Math.PI*2*24)*.05;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const dx=h[j*N+(i+1)%N]-h[j*N+(i+N-1)%N],dy=h[((j+1)%N)*N+i]-h[((j+N-1)%N)*N+i],nx=-dx*3,ny=-dy*3,l=Math.hypot(nx,ny,1),k=(j*N+i)*4;
  im.data[k]=(nx/l*.5+.5)*255;im.data[k+1]=(ny/l*.5+.5)*255;im.data[k+2]=(1/l*.5+.5)*255;im.data[k+3]=255;}
 x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const SNOWN=snowNormal();
function sparkle(m,dens=.9965){m.onBeforeCompile=sh=>{sh.uniforms.uSun={value:SUN};
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform vec3 uSun;')
  .replace('#include <tonemapping_fragment>','{float hh=fract(sin(dot(floor(vWP*26.),vec3(12.9898,78.233,37.719)))*43758.5453);vec3 vd=normalize(cameraPosition-vWP);float g=pow(max(0.,dot(reflect(-normalize(uSun),vec3(0.,1.,0.)),vd)),3.);gl_FragColor.rgb+=vec3(step('+dens.toFixed(4)+',hh)*(.6+g*5.))*smoothstep(160.,20.,length(cameraPosition-vWP));}\n#include <tonemapping_fragment>');};
 m.customProgramCacheKey=()=>'snowspark'+dens;return m;}
const snowMat=sparkle(new THREE.MeshStandardMaterial({color:0xf0f2fa,roughness:.62,metalness:0,vertexColors:true,normalMap:SNOWN,normalScale:new THREE.Vector2(.7,.7),envMapIntensity:.45}));

/* ================= terrain ================= */
const world=new THREE.Group();scene.add(world);
{const US=[-460,-360,-280,-220,-180,-150];for(let u=-142;u<=142;u+=4)US.push(u);US.push(150,180,220,280,360,460);
 const Z0=-160,Z1=L+320,DZ=3,rows=Math.floor((Z1-Z0)/DZ)+1,cols=US.length,pos=new Float32Array(rows*cols*3),uv=new Float32Array(rows*cols*2),col=new Float32Array(rows*cols*3),idx=[];
 const cA=new THREE.Color(0xffffff),cB=new THREE.Color(0xdfe6ff),cC=new THREE.Color(0xc8cfe8),tmp=new THREE.Color();
 for(let r=0;r<rows;r++){const z=Z0+r*DZ,c0=cx(z);for(let k=0;k<cols;k++){const x=c0+US[k],i=r*cols+k;pos[i*3]=x;pos[i*3+1]=base(x,z);pos[i*3+2]=z;uv[i*2]=x/7;uv[i*2+1]=z/7;
   const a=Math.abs(US[k]);tmp.copy(cA).lerp(cB,cl(a/90,0,1));if(a>150)tmp.lerp(cC,cl((a-150)/300,0,1));col[i*3]=tmp.r;col[i*3+1]=tmp.g;col[i*3+2]=tmp.b;}}
 for(let r=0;r<rows-1;r++)for(let k=0;k<cols-1;k++){const a=r*cols+k,b=a+1,c=a+cols,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,snowMat);m.receiveShadow=true;world.add(m);}

/* kickers: a ramp of packed snow with a blue lip line */
for(const k of KICK){const nx=8,nz=10,P=[],I=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=k.x-5.5+i/nx*11,z=k.z-14+j/nz*14-.001;P.push(x,ground(x,z),z);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;I.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 const s=P.length/3;for(let i=0;i<=nx;i++){const x=k.x-5.5+i/nx*11,z=k.z-.001;P.push(x,ground(x,z),z,x,base(x,z+.01)-.2,z+.02);}for(let i=0;i<nx;i++){const a=s+i*2;I.push(a,a+1,a+2,a+2,a+1,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const cc=new Float32Array(P.length).fill(.97);g.setAttribute('color',new THREE.BufferAttribute(cc,3));
 const uvs=[];for(let i=0;i<P.length/3;i++)uvs.push(P[i*3]/7,P[i*3+2]/7);g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 const m=new THREE.Mesh(g,snowMat);m.castShadow=m.receiveShadow=true;world.add(m);
 const lip=new THREE.Mesh(new THREE.BoxGeometry(11,.12,.18),new THREE.MeshStandardMaterial({color:0x3a8aff,emissive:0x1a4aaa,emissiveIntensity:.8}));lip.position.set(k.x,ground(k.x,k.z-.05)+.04,k.z-.05);world.add(lip);
 for(const s2 of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.6,6),new THREE.MeshStandardMaterial({color:0xff7a3a,emissive:0xff5a1a,emissiveIntensity:.6}));p.position.set(k.x+s2*6.2,base(k.x+s2*6.2,k.z)+.8,k.z);world.add(p);}}

/* gates: two poles with a triangular flag */
{const poleG=new THREE.CylinderGeometry(.07,.07,2.4,6),flagS=new THREE.Shape();flagS.moveTo(0,0);flagS.lineTo(1.1,-.35);flagS.lineTo(0,-.7);flagS.closePath();const flagG=new THREE.ShapeGeometry(flagS);
 GATE.forEach((g,i)=>{const colr=i%2?0x3a7aff:0xff3a4a,mat=new THREE.MeshStandardMaterial({color:colr,emissive:colr,emissiveIntensity:.25,side:THREE.DoubleSide});g.mat=mat;
  for(const s of[-1,1]){const x=g.x+s*4.5,y=base(x,g.z);const p=new THREE.Mesh(poleG,mat);p.position.set(x,y+1.2,g.z);p.castShadow=true;world.add(p);const f=new THREE.Mesh(flagG,mat);f.position.set(x,y+2.35,g.z);f.rotation.y=s>0?Math.PI:0;world.add(f);g.poles.push(f);}});}

/* forest: instanced pines with snow-capped tiers, trunks and rocks */
{const N=1700,foliG=new THREE.ConeGeometry(1,1,9),capG=new THREE.ConeGeometry(1,1,9),trunkG=new THREE.CylinderGeometry(.18,.26,1,6),rockG=new THREE.DodecahedronGeometry(1,0);
 const foli=new THREE.InstancedMesh(foliG,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),N*3),caps=new THREE.InstancedMesh(capG,sparkle(new THREE.MeshStandardMaterial({color:0xf4f8ff,roughness:.6}),.993),N*3),trunks=new THREE.InstancedMesh(trunkG,new THREE.MeshStandardMaterial({color:0x4a3424,roughness:.9}),N);
 const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),Pv=new THREE.Vector3(),C=new THREE.Color();let n=0;
 for(let i=0;i<N*3&&n<N;i++){const z=-140+rnd()*(L+440),sgn=rnd()<.5?-1:1,u=sgn*(30+Math.pow(rnd(),1.7)*260),x=cx(z)+u;if(Math.abs(u)<34)continue;if(KICK.some(k=>Math.abs(k.z-z)<20&&Math.abs(k.x-x)<10))continue;
  const y=base(x,z),h=7+rnd()*11*(Math.abs(u)>60?1.3:1);Q.setFromAxisAngle(new THREE.Vector3(0,1,0),rnd()*6.28);
  Pv.set(x,y+h*.12,z);S.set(1,h*.25,1);M.compose(Pv,Q,S);trunks.setMatrixAt(n,M);
  for(let j=0;j<3;j++){const r=h*(.32-.075*j),th=h*.44;Pv.set(x,y+h*(.3+.21*j)+th*.5-th*.25,z);S.set(r,th,r);M.compose(Pv,Q,S);foli.setMatrixAt(n*3+j,M);C.setHSL(.40+rnd()*.05,.35+rnd()*.15,.14+rnd()*.06);foli.setColorAt(n*3+j,C);
   Pv.y+=th*.18;S.set(r*.78,th*.62,r*.78);M.compose(Pv,Q,S);caps.setMatrixAt(n*3+j,M);}n++;}
 foli.count=caps.count=n*3;trunks.count=n;for(const m of[foli,caps,trunks]){m.castShadow=true;m.receiveShadow=true;world.add(m);}
 const RN=320,rocks=new THREE.InstancedMesh(rockG,new THREE.MeshStandardMaterial({color:0x6a6a7c,roughness:.9,flatShading:true}),RN);for(let i=0;i<RN;i++){const z=rnd()*L,u=(rnd()<.5?-1:1)*(44+rnd()*120),x=cx(z)+u,s=.8+rnd()*2.8;Q.setFromEuler(new THREE.Euler(rnd()*3,rnd()*3,rnd()*3));Pv.set(x,base(x,z)+s*.3,z);S.set(s,s*.7,s);M.compose(Pv,Q,S);rocks.setMatrixAt(i,M);}
 rocks.castShadow=rocks.receiveShadow=true;world.add(rocks);}

/* distant peaks: displaced icosahedra, rock below and snow above */
{const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,flatShading:true});
 const peak=(x,z,w,h)=>{const g=new THREE.IcosahedronGeometry(1,4),p=g.attributes.position,c=new Float32Array(p.count*3),cs=new THREE.Color(0xf4f6ff),cr=new THREE.Color(0x5a5470),t=new THREE.Color();const ph=rnd()*9;
  for(let i=0;i<p.count;i++){let vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i);const n=1+.16*Math.sin(vx*5+ph)*Math.sin(vz*4.3+vy*3+ph)+.07*Math.sin(vx*13+vy*11+ph);vx*=n;vz*=n;vy=Math.max(vy,-.2);
   p.setXYZ(i,vx,vy*n,vz);const k=cl((vy*n+.1+.12*Math.sin(vx*9+vz*7))/.75,0,1);t.copy(cr).lerp(cs,k>.45?1:k*.6);c[i*3]=t.r;c[i*3+1]=t.g;c[i*3+2]=t.b;}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.scale.set(w,h,w);m.position.set(x,hz(z)-140,z);world.add(m);};
 for(let i=0;i<9;i++)peak(cx(L)+(i-4)*520+rnd()*200,L+1400+rnd()*1600,420+rnd()*420,700+rnd()*700);
 for(let i=0;i<12;i++){const z=-200+i*260,s=i%2?1:-1;peak(cx(z)+s*(900+rnd()*500),z,380+rnd()*300,520+rnd()*500);}}

/* the lodge and finish arch */
{const z=L+40,x=cx(z),y=base(x,z),wood=new THREE.MeshStandardMaterial({color:0x6a3e24,roughness:.8}),roof=new THREE.MeshStandardMaterial({color:0xf4f6ff,roughness:.6}),glow=new THREE.MeshStandardMaterial({color:0xffc070,emissive:0xff9a3a,emissiveIntensity:2.4});
 const lodge=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(22,8,12),wood);b.position.y=4;b.castShadow=b.receiveShadow=true;lodge.add(b);
 const r=new THREE.Mesh(new THREE.CylinderGeometry(0,14.5,7,4,1),roof);r.rotation.y=Math.PI/4;r.scale.set(1.05,1,.62);r.position.y=11.5;r.castShadow=true;lodge.add(r);
 for(let i=0;i<5;i++){const w=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.6),glow);w.position.set(-8+i*4,4.4,-6.02);w.rotation.y=Math.PI;lodge.add(w);}
 const ch=new THREE.Mesh(new THREE.BoxGeometry(1.6,5,1.6),new THREE.MeshStandardMaterial({color:0x8a7a7a}));ch.position.set(6,13,0);lodge.add(ch);
 lodge.position.set(x+18,y-1,z+30);world.add(lodge);const pl=new THREE.PointLight(0xffa050,60,40,2);pl.position.set(x+18,y+5,z+20);world.add(pl);
 const fz=L,fx=cx(fz),fy=base(fx,fz),arch=new THREE.MeshStandardMaterial({color:0xff6a3a,emissive:0xff4a1a,emissiveIntensity:.7});
 for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,9,10),arch);p.position.set(fx+s*12,base(fx+s*12,fz)+4.5,fz);p.castShadow=true;world.add(p);}
 const ban=new THREE.Mesh(new THREE.BoxGeometry(25,2.2,.3),new THREE.MeshStandardMaterial({color:0x1a1830,emissive:0xffd04a,emissiveIntensity:.35}));ban.position.set(fx,fy+9.5,fz);world.add(ban);}

/* ================= riders ================= */
function makeRider(c){const g=new THREE.Group(),body=new THREE.Group();g.add(body);const M=(col,o={})=>new THREE.MeshStandardMaterial({color:col,roughness:.55,...o});
 const jk=M(c.jacket,{roughness:.45}),pt=M(c.pants,{roughness:.7}),bd=M(c.board,{roughness:.25,metalness:.2});
 const board=new THREE.Mesh(new THREE.BoxGeometry(.36,.06,1.6),bd);board.position.y=.04;g.add(board);for(const s of[-1,1]){const tip=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.06,12,1,false,0,Math.PI),bd);tip.position.set(0,.04,s*.8);tip.rotation.y=s>0?-Math.PI/2:Math.PI/2;g.add(tip);}
 const leg=new THREE.CapsuleGeometry(.11,.5,4,8);for(const s of[-1,1]){const l=new THREE.Mesh(leg,pt);l.position.set(0,.45,s*.26);l.rotation.x=s*.18;body.add(l);const bt=new THREE.Mesh(new THREE.BoxGeometry(.22,.16,.3),M(0x2a2a30));bt.position.set(0,.12,s*.28);body.add(bt);}
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.21,.42,4,10),jk);torso.position.y=1.12;torso.rotation.z=.12;body.add(torso);
 const arm=new THREE.CapsuleGeometry(.08,.46,4,8);for(const s of[-1,1]){const a=new THREE.Mesh(arm,jk);a.position.set(.04,1.18,s*.36);a.rotation.x=s*1.05;body.add(a);const gl=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),M(0x1a1a20));gl.position.set(.04,1.0,s*.6);body.add(gl);}
 const head=new THREE.Mesh(new THREE.SphereGeometry(.15,14,10),M(0xe8b898));head.position.set(.05,1.58,0);body.add(head);
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.175,14,10,0,Math.PI*2,0,Math.PI*.58),M(c.helm,{roughness:.3,metalness:.1}));helm.position.copy(head.position);helm.position.y+=.02;body.add(helm);
 const gog=new THREE.Mesh(new THREE.BoxGeometry(.06,.08,.26),new THREE.MeshStandardMaterial({color:0xffa040,emissive:0xff7a20,emissiveIntensity:.6,metalness:.8,roughness:.1}));gog.position.set(.19,1.6,0);body.add(gog);
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);return{g,body};}
const racers=RIDERS.map((c,i)=>({i,c,...makeRider(c),x:0,z:0,y:0,vy:0,gp:0,h:0,s:0,air:false,airT:0,spin:0,spinTo:0,stun:0,st:0,gates:0,trick:0,best:0,fin:false,finT:0,lane:0,tuck:0}));
const P=racers[0];

/* ================= powder spray ================= */
const PN=1400,pp=new Float32Array(PN*3),pv=new Float32Array(PN*3),pa=new Float32Array(PN),pl=new Float32Array(PN),ps=new Float32Array(PN);let pk=0;
const pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.BufferAttribute(pp,3));pgeo.setAttribute('a',new THREE.BufferAttribute(pa,1));pgeo.setAttribute('sz',new THREE.BufferAttribute(ps,1));
const pmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uC:{value:new THREE.Color(0xfff6f0)}},
 vertexShader:'attribute float a;attribute float sz;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=sz*190./max(.5,-mv.z);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 uC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d);if(r>.25)discard;float f=1.-r*4.;gl_FragColor=vec4(uC*1.1,vA*f*f*.8);}'});
const puffs=new THREE.Points(pgeo,pmat);puffs.frustumCulled=false;scene.add(puffs);
function spray(x,y,z,vx,vy,vz,n,sz=.5){for(let k=0;k<n;k++){const i=pk;pk=(pk+1)%PN;pp[i*3]=x+(Math.random()-.5)*.6;pp[i*3+1]=y+Math.random()*.3;pp[i*3+2]=z+(Math.random()-.5)*.6;pv[i*3]=vx+(Math.random()-.5)*3;pv[i*3+1]=vy+Math.random()*2.5;pv[i*3+2]=vz+(Math.random()-.5)*3;pl[i]=.6+Math.random()*.7;pa[i]=.85;ps[i]=sz*(.6+Math.random()*.8);}}
function stepSpray(dt){for(let i=0;i<PN;i++){if(pl[i]<=0){pa[i]=0;continue;}pl[i]-=dt;pv[i*3+1]-=4*dt;for(let k=0;k<3;k++){pv[i*3+k]*=1-1.6*dt;pp[i*3+k]+=pv[i*3+k]*dt;}pa[i]=Math.max(0,Math.min(.85,pl[i]));ps[i]+=dt*.8;}
 pgeo.attributes.position.needsUpdate=true;pgeo.attributes.a.needsUpdate=true;pgeo.attributes.sz.needsUpdate=true;}

/* ================= sound ================= */
const snd={ac:null,vol:.8};
function boot(){if(snd.ac){if(snd.ac.state==='suspended')snd.ac.resume();return;}try{const ac=new (window.AudioContext||window.webkitAudioContext)();snd.ac=ac;snd.out=ac.createGain();snd.out.gain.value=snd.vol;snd.out.connect(ac.destination);
 const buf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;snd.noise=buf;
 const bed=(type,f,q)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(snd.out);s.start();return{f:fl,g};};
 snd.wind=bed('lowpass',600,.5);snd.carve=bed('bandpass',2400,1.2);}catch(e){snd.ac=null;}}
function blip(f0,f1,dur,vol=.15,type='triangle'){const ac=snd.ac;if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(snd.out);o.start(t);o.stop(t+dur+.02);}
function thump(vol=.4){const ac=snd.ac;if(!ac)return;const t=ac.currentTime,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=snd.noise;f.type='lowpass';f.frequency.value=380;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);s.connect(f);f.connect(g);g.connect(snd.out);s.start(t);s.stop(t+.4);}

/* ================= state, options, input ================= */
const opt={diff:1,vol:.8};const save=stored('pxd_summitrush_opt',opt);const seg=pickers(opt,save);
seg('o-diff','diff');seg('o-vol','vol',true,v=>{snd.vol=v;if(snd.out)snd.out.gain.value=v;});snd.vol=opt.vol;
let app='menu',cdT=0,raceT=0,result=null,endT=0,gfx=quality(),override=null,autopilot=false;
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();if(e.code==='Escape'&&!e.repeat){if(app==='race'||app==='count')pause();else if(app==='paused')resume();}boot();});
addEventListener('keyup',e=>{keys[e.code]=false;});
const touch={l:0,r:0,j:0,t:0};if(matchMedia('(pointer:coarse)').matches){for(const[id,k]of[['tL','l'],['tR','r'],['tJ','j'],['tT','t']]){const b=$(id);b.onpointerdown=e=>{e.preventDefault();touch[k]=1;boot();};b.onpointerup=b.onpointerleave=()=>touch[k]=0;}}
let jumpHeld=false;
function readInput(){if(override)return override;const pad=(navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null);const ax=pad?pad.axes[0]:0;
 const l=keys.KeyA||keys.ArrowLeft||touch.l||ax<-.3,r=keys.KeyD||keys.ArrowRight||touch.r||ax>.3,j=keys.Space||touch.j||(pad&&pad.buttons[0]&&pad.buttons[0].pressed);
 const o={st:(r?1:0)-(l?1:0),t:!!(keys.KeyW||keys.ArrowUp||touch.t||(pad&&pad.buttons[7]&&pad.buttons[7].value>.3)),b:!!(keys.KeyS||keys.ArrowDown||(pad&&pad.buttons[6]&&pad.buttons[6].value>.3)),j:false};
 if(j&&!jumpHeld)o.j=true;jumpHeld=!!j;return o;}

/* ================= toasts + HUD ================= */
function toast(t,cls=''){const d=document.createElement('div');d.textContent=t;if(cls)d.className=cls;$('toasts').prepend(d);setTimeout(()=>d.remove(),1400);while($('toasts').children.length>3)$('toasts').lastChild.remove();}
const fmt=s=>{s=Math.max(0,s);const m=Math.floor(s/60),ss=Math.floor(s%60);return m+':'+(ss<10?'0':'')+ss;};
const fmtT=s=>{const m=Math.floor(s/60),ss=s%60;return m+':'+(ss<10?'0':'')+ss.toFixed(2);};
const trickPts=n=>n*n*100+50*n;
function standings(){return racers.slice().sort((a,b)=>(a.fin&&b.fin)?a.finT-b.finT:a.fin?-1:b.fin?1:b.z-a.z);}
function liveScore(){return P.gates*100+P.trick;}
{const dots=$('dots');racers.slice(1).forEach(r=>{const i=document.createElement('i');i.style.background='#'+r.c.jacket.toString(16).padStart(6,'0');r.dot=i;dots.appendChild(i);});}
function hud(){const st=standings(),pl=st.indexOf(P);$('place').innerHTML=(pl+1)+'<i>'+ORD[pl].slice(-2)+'</i><small>/4</small>';$('place').className=pl===0?'p1':'';
 const left=LIMIT-raceT;$('clock').textContent=fmt(left);$('clock').className='pill'+(left<20?' low':'');$('spd').textContent=Math.round(P.s*3.6)+' KM/H'+(P.tuck?' · TUCK':'');
 $('pts').textContent=liveScore();$('gates').textContent='GATES '+P.gates+'/'+GATE.length;$('trk').textContent='TRICKS '+P.trick;$('prog').style.width=cl(P.z/L*100,0,100)+'%';for(const r of racers.slice(1))r.dot.style.left=cl(r.z/L*100,0,100)+'%';}

/* ================= race ================= */
function place0(){seed=4242;const xs=[-3,3,-9,9];racers.forEach((r,i)=>{r.z=8+(i%2)*2;r.x=cx(r.z)+xs[i];r.y=ground(r.x,r.z);r.gp=r.y;r.vy=0;r.h=0;r.s=0;r.air=false;r.airT=0;r.spin=0;r.spinTo=0;r.stun=0;r.st=0;r.gates=0;r.trick=0;r.best=0;r.fin=false;r.finT=0;r.lane=(rnd()-.5)*10;r.tuck=0;r.g.visible=true;});}
function startRace(){boot();place0();raceT=0;cdT=3.2;result=null;endT=0;app='count';$('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.className='racing';if(matchMedia('(pointer:coarse)').matches)$('touch').hidden=false;$('count').textContent='3';}
function pause(){app='paused';$('pause').hidden=false;}
function resume(){app=cdT>0?'count':'race';$('pause').hidden=true;}
function toMenu(){app='menu';place0();$('menu').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('touch').hidden=true;document.body.className='';const b=bestScore(ID);$('best').textContent=b?'YOUR BEST · '+b:'';}
function land(r){const err=r.spin-Math.round(r.spin/Math.PI)*Math.PI,n=Math.round(Math.abs(r.spin)/Math.PI);const f=new THREE.Vector3(Math.sin(r.h),0,Math.cos(r.h));
 if(Math.abs(err)<.75){let pts=n?trickPts(n):0;if(r.airT>.9)pts+=Math.round(r.airT*40);if(r===P){if(pts){r.trick+=pts;toast((n?n*180+' ':'BIG AIR ')+'+'+pts,'g');blip(520,1040,.18,.12);}thump(.3);}spray(r.x,r.y,r.z,f.x*r.s*.3,1,f.z*r.s*.3,24,.6);}
 else{r.s*=.3;r.stun=1.3;if(r===P){toast('WIPEOUT','bad');thump(.6);}spray(r.x,r.y,r.z,f.x*r.s*.3,2,f.z*r.s*.3,70,.8);}
 r.spin=0;r.spinTo=0;}
function think(r){const look=12+r.s*.6,tz=r.z+look;let tx=cx(tz)+r.lane;const gnext=GATE.find(g=>g.z>r.z&&g.z<r.z+look*1.5);if(gnext)tx=lerp(tx,gnext.x,.7);const kn=KICK.find(k=>k.z>r.z&&k.z<r.z+40);if(kn)tx=kn.x;
 const hd=Math.atan2(tx-r.x,look);r.st=cl((r.h-hd)*2.4,-1,1);if(Math.random()<.004)r.lane=(Math.random()-.5)*14;
 if(r.air){if(r.airT<.05&&!r.spinTo)r.spinTo=Math.PI*Math.floor(Math.random()*(opt.diff+2))*(Math.random()<.5?-1:1);r.st=r.spinTo?cl((r.spinTo-r.spin)*2,-1,1):0;}}
function tickRider(r,dt,inp){if(r.fin){r.s=Math.max(0,r.s-7*dt);}
 let st=inp.st,dg;r.tuck=!!inp.t&&!r.air;
 if(r.stun>0){r.stun-=dt;st=0;}
 if(!r.air){if(!r.fin)r.h+=-st*(1.8-r.s*.02)*dt;r.h=cl(r.h,-1.3,1.3);const fx=Math.sin(r.h),fz=Math.cos(r.h),g0=ground(r.x,r.z),acc=-9.8*(ground(r.x+fx*.6,r.z+fz*.6)-g0)/.6;
  dg=r.i?DIFF[opt.diff].drag*(P.z-r.z>140?.86:r.z-P.z>140?1.14:1):(r.tuck?.0019:.0031);if(!r.fin)r.s+=(acc-dg*r.s*r.s-Math.abs(st)*r.s*.2-(inp.b?9:0)-.35)*dt;if(r.stun>0)r.s-=6*dt;r.s=Math.max(0,r.s);
  if(inp.j&&r.stun<=0&&!r.fin){r.vy+=5.4;r.air=true;r.airT=0;if(r===P)blip(300,520,.12,.08);}
  if(r.s>9&&Math.abs(st)>.3&&Math.random()<.9)spray(r.x-fx*.6,r.y,r.z-fz*.6,-Math.cos(r.h)*st*4,1.2,Math.sin(r.h)*st*4,2,.45);}
 else{r.airT+=dt;r.spin+=st*7.2*dt;}
 const pz=r.z;r.x+=Math.sin(r.h)*r.s*dt;r.z+=Math.cos(r.h)*r.s*dt;const d=r.x-cx(r.z);if(Math.abs(d)>HALF){r.x=cx(r.z)+Math.sign(d)*HALF;r.h+=Math.sign(d)*.05;r.s*=.985;}
 for(const g of GATE)if(pz<g.z&&r.z>=g.z&&Math.abs(r.x-g.x)<4.5){r.gates++;if(r===P){toast('GATE +100');blip(880,1320,.12,.1,'sine');g.flash=1;}}
 r.vy-=9.8*dt;r.y+=r.vy*dt;const gr=ground(r.x,r.z);if(r.y<=gr){if(r.air&&r.airT>.2)land(r);r.air=false;r.vy=Math.min(14,(gr-r.gp)/dt);r.y=gr;}else if(r.y-gr>.35&&!r.air){r.air=true;r.airT=0;}r.gp=gr;
 if(!r.fin&&r.z>=L){r.fin=true;r.finT=raceT;if(r===P){toast(ORD[standings().indexOf(P)]+' AT THE LODGE','g');blip(660,1320,.4,.15);endT=2.4;}}}
function tick(dt){if(app==='count'){cdT-=dt;$('count').textContent=cdT>0?Math.ceil(cdT-.2)||'GO':'';if(cdT<=.2&&cdT+dt>.2)blip(880,880,.3,.15,'square');else if(Math.ceil(cdT-.2)!==Math.ceil(cdT+dt-.2)&&cdT>.2)blip(440,440,.12,.1,'square');if(cdT<=0){app='race';$('count').textContent='';}return;}
 if(app!=='race')return;raceT+=dt;const inp=autopilot?(think(P),{st:P.st,t:1}):readInput();tickRider(P,dt,inp);
 for(const r of racers.slice(1)){think(r);tickRider(r,dt,{st:r.st,t:1,j:false});}
 if(endT>0){endT-=dt;if(endT<=0)endRace(false);}else if(raceT>=LIMIT)endRace(true);}
function endRace(timeUp){if(app==='over')return;app='over';const st=standings(),pl=st.indexOf(P),fin=P.fin;const tb=fin?Math.max(0,Math.round((LIMIT-P.finT)*10)):0,pp2=fin?PLACE_PTS[pl]:0,pts=pp2+P.gates*100+P.trick+tb;
 result={place:pl,pts,fin,time:P.finT};saveBest(ID,pts);const tok=fin?TOKENS[pl]:3;addRound(tok,fin&&pl===0);
 $('ores').textContent=fin?ORD[pl]+' PLACE':'TIME UP';$('osub').textContent=fin?'AT THE LODGE IN '+fmtT(P.finT):'THE LIFTS CLOSED BEFORE YOU REACHED THE LODGE';$('ofs').textContent=pts;
 const rows=[['FINISH',fin?ORD[pl]+' · +'+pp2:'DNF'],['GATES',P.gates+'/'+GATE.length+' · +'+P.gates*100],['TRICKS','+'+P.trick],['TIME BONUS','+'+tb],['RIVALS',st.filter(r=>r!==P).map(r=>r.c.name+' '+(r.fin?fmtT(r.finT):'DNF')).join(' · ')],['BEST',String(Math.max(pts,bestScore(ID)))]];
 $('stats').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('');$('otok').textContent='+'+tok+' TOKENS';
 $('over').hidden=false;$('hud').hidden=true;$('touch').hidden=true;document.body.className='over';blip(timeUp?300:520,timeUp?150:1040,.5,.15);}
$('go').onclick=startRace;$('again').onclick=startRace;$('omenu').onclick=toMenu;$('resume').onclick=resume;$('quit').onclick=toMenu;
postButton($('post'),ID,()=>[result?result.pts:0,'Summit Rush: '+(result&&result.fin?ORD[result.place]+' place in '+fmtT(result.time):'time up')+', difficulty '+['EASY','NORMAL','HARD'][opt.diff]+'.']);

/* ================= visuals ================= */
const camT=new THREE.Vector3(),camL=new THREE.Vector3(),tmpV=new THREE.Vector3();let menuA=0;
function pose(r,dt){r.g.position.set(r.x,r.y,r.z);const tgt=r.h+(r.air?r.spin:0);r.g.rotation.y=tgt;
 const gN=new THREE.Vector3(ground(r.x+.5,r.z)-ground(r.x-.5,r.z),0,ground(r.x,r.z+.5)-ground(r.x,r.z-.5));r.g.rotation.x=r.air?lerp(r.g.rotation.x,0,.1):Math.atan(-gN.z)*.9;
 r.body.rotation.z=lerp(r.body.rotation.z,r.air?0:r.st*.35*Math.min(1,r.s/12),.15);r.body.scale.y=lerp(r.body.scale.y,r.tuck?.8:1,.15);r.body.position.y=r.stun>0?-.2:0;r.body.rotation.x=r.stun>0?Math.sin(r.stun*12)*.3:0;}
function visuals(dt){for(const r of racers)pose(r,dt);stepSpray(dt);for(const g of GATE){if(g.flash){g.flash=Math.max(0,g.flash-dt*1.5);g.mat.emissiveIntensity=.25+g.flash*2;}for(const f of g.poles)f.rotation.z=Math.sin(performance.now()*.004+g.z)*.12;}
 let fwd;if(app==='menu'){menuA+=dt*.08;const z=60+Math.sin(menuA)*30,x=cx(z);camT.set(x+Math.cos(menuA*1.3)*26,ground(x,z)+9+Math.sin(menuA)*3,z-34);camL.set(cx(z+60),ground(cx(z+60),z+60)+2,z+60);cam.position.lerp(camT,1-Math.exp(-dt*2));cam.lookAt(camL);cam.fov=55;}
 else{fwd=tmpV.set(Math.sin(P.h),0,Math.cos(P.h));const back=4.9+P.s*.03;camT.set(P.x-fwd.x*back,0,P.z-fwd.z*back);camT.y=Math.max(P.y+2.5,ground(camT.x,camT.z)+1.6);
  cam.position.lerp(camT,1-Math.exp(-dt*(app==='count'?3:6)));camL.lerp(new THREE.Vector3(P.x+fwd.x*7,P.y+1.1,P.z+fwd.z*7),1-Math.exp(-dt*8));cam.lookAt(camL);cam.fov=lerp(cam.fov,cl(56+P.s*.42,56,76),.08);}
 cam.updateProjectionMatrix();const f=app==='menu'?camL:P.g.position;sun.position.copy(f).addScaledVector(SUN,400);sun.target.position.copy(f);
 if(snd.ac&&snd.wind){const s=app==='race'?P.s:0;snd.wind.g.gain.value=lerp(snd.wind.g.gain.value,Math.min(.5,s*.012),.1);snd.wind.f.frequency.value=300+s*30;snd.carve.g.gain.value=lerp(snd.carve.g.gain.value,app==='race'&&!P.air?Math.min(.3,Math.abs(P.st)*P.s*.012):0,.2);}
 if(app==='race'||app==='count')hud();}

/* ================= quality, render, loop ================= */
const POST={exposure:.74,bloom:.38,bloomThreshold:.9,bloomRadius:.5,vignette:.32,saturation:1.14,contrast:1.08,grain:.015,warm:.03,lens:{flare:.9,sunColor:0xffd0a0}};
let post=null;
function applyQuality(q){gfx=q;sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}R.shadowMap.enabled=q>0;
 scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));post=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));applyQuality(gfx);
function render(){const w=innerWidth,h=innerHeight;if(!post||post.w!==w||post.h!==h||post.dpr!==R.getPixelRatio()){R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();post=cinematic(R,scene,cam,{...POST,quality:gfx,ao:gfx>=2});post.w=w;post.h=h;post.dpr=R.getPixelRatio();post.setSize(w,h);}
 post.setLens({speed:app==='race'?cl((P.s-16)/26,0,1)*.7:0,sun:SUN});post.render();}
let acc=0;function step(dt){acc+=dt;let n=0;while(acc>=DT&&n<240){if(app!=='paused')tick(DT);acc-=DT;n++;}if(n>=240)acc=0;visuals(Math.min(dt,.1));}
toMenu();
let last=performance.now(),first=true;function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();if(first){first=false;$('loading').classList.add('gone');}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hook ================= */
window.SUMMIT={get app(){return app;},get score(){return result?result.pts:liveScore();},get result(){return result;},step,render,
 start(o={}){if(o.diff!=null)opt.diff=o.diff;startRace();},skipCount(){if(app==='count'){cdT=0;tick(DT);}},setInput(o){override=o?{st:0,t:0,b:0,j:false,...o}:null;},autopilot(on=true){autopilot=on;},
 warp(z){P.z=z;P.x=cx(z);P.y=ground(P.x,z);P.gp=P.y;P.s=24;},endNow(timeUp=true){endRace(timeUp);},setClock(t){raceT=LIMIT-t;},get player(){return P;},get racers(){return racers;},GATE,KICK,L,ground,setQuality:applyQuality,scene,cam,R};
