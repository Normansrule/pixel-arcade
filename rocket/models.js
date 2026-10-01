// ROCKET ARENA — visuals: stadium, arena shell, pitch reflection, cars, ball, pads, goals, particles, trails.
import * as THREE from '../vendor/three.module.min.js';
import {W,L,H,RC,RF,GW,GH,GD,PR,RB,CAR} from './physics.js';
const V=THREE.Vector3;
export const TEAM=[{n:'BLUE',c:0x1f6bff,glow:new THREE.Color(.25,.55,2.6),css:'#3d8bff',paint:0x1450e0,alt:0x0b2a78},{n:'ORANGE',c:0xff6a10,glow:new THREE.Color(2.6,.9,.15),css:'#ff6a1a',paint:0xff5a00,alt:0x7a2400}];
const rnd=(a=1)=>Math.random()*a;
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

/* ---------- geometry helpers ---------- */
// merge [geometry, matrix?, color?] entries into one geometry; a color (or the geometry's own color attribute) becomes vertex colors
export function merge(list){const withCol=list.some(e=>e[2]||e[0].attributes.color);const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=withCol?new Float32Array(n*3).fill(1):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(col){if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)r.setAttribute('color',new THREE.BufferAttribute(col,3));return r;}
const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(s,s,s));
// perimeter of the arena's rounded rectangle pushed out by `off`; points carry outward normals and arc length u
export function perimeter(off=0,step=2,breaks=[GW]){const pts=[],cx=W-RC,cz=L-RC,r=RC+off;let u=0,last=null;
 const add=(x,z,ox,oz)=>{if(last)u+=Math.hypot(x-last.x,z-last.z);last={x,z,ox,oz,u};pts.push(last);};
 const line=(x0,z0,x1,z1,ox,oz,br)=>{const len=Math.hypot(x1-x0,z1-z0),ts=[];const n=Math.max(1,Math.ceil(len/step));for(let i=0;i<n;i++)ts.push(i/n);
  if(br)for(const b of br){for(const s of[-1,1]){const t=(s*b-x0)/(x1-x0);if(t>0&&t<1)ts.push(t);}}ts.sort((a,b)=>a-b);for(const t of ts)add(x0+(x1-x0)*t,z0+(z1-z0)*t,ox,oz);};
 const arc=(ccx,ccz,a0)=>{const n=Math.max(3,Math.ceil(r*Math.PI/2/step));for(let i=0;i<n;i++){const a=a0+i/n*Math.PI/2;add(ccx+Math.cos(a)*r,ccz+Math.sin(a)*r,Math.cos(a),Math.sin(a));}};
 line(W+off,-cz,W+off,cz,1,0);arc(cx,cz,0);line(cx,L+off,-cx,L+off,0,1,breaks);arc(-cx,cz,Math.PI/2);line(-(W+off),cz,-(W+off),-cz,-1,0);arc(-cx,-cz,Math.PI);line(-cx,-(L+off),cx,-(L+off),0,-1,breaks);arc(cx,-cz,Math.PI*1.5);
 const f=pts[0];add(f.x,f.z,f.ox,f.oz);return pts;}
// sweep a cross-section profile [{s,y,v}] along the perimeter; skip(i,j) drops quads
function sweep(per,prof,skip,tint){const nP=prof.length,pos=[],uv=[],col=[],idx=[];
 for(const p of per)for(const q of prof){pos.push(p.x+p.ox*q.s,q.y,p.z+p.oz*q.s);uv.push(p.u,q.v);if(tint){const c=tint(p.z,q.y);col.push(c.r,c.g,c.b);}}
 for(let i=0;i<per.length-1;i++)for(let j=0;j<nP-1;j++){if(skip&&skip(per[i],per[i+1],prof[j],prof[j+1]))continue;const a=i*nP+j,b=a+nP;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(tint)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
const inMouth=(a,b)=>Math.abs(a.x)<=GW+1e-4&&Math.abs(b.x)<=GW+1e-4&&Math.abs(a.z)>L-1&&Math.abs(b.z)>L-1;
const teamTint=(base,amt)=>(z)=>{const t=THREE.MathUtils.clamp(z/(L*.8),-1,1),c=new THREE.Color(base);const tc=new THREE.Color(t<0?TEAM[0].c:TEAM[1].c);return c.lerp(tc,Math.abs(t)*amt);};

/* ---------- planar reflection for the pitch ---------- */
export class Mirror{constructor(scale=.5){this.rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType});this.cam=new THREE.PerspectiveCamera();this.mat=new THREE.Matrix4();this.scale=scale;this.on=true;
  this.U={tRefl:{value:this.rt.texture},uTexMat:{value:this.mat},uReflStr:{value:.42}};}
 render(R,scene,cam,w,h,hide){if(!this.on)return;const rw=Math.max(4,w*this.scale|0),rh=Math.max(4,h*this.scale|0);if(this.rt.width!==rw||this.rt.height!==rh)this.rt.setSize(rw,rh);
  const vc=this.cam,d=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion);
  vc.position.set(cam.position.x,-cam.position.y,cam.position.z);vc.up.set(up.x,-up.y,up.z);vc.lookAt(cam.position.x+d.x,-(cam.position.y+d.y),cam.position.z+d.z);
  vc.near=cam.near;vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);
  this.mat.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  // oblique near plane = the pitch (y=0)
  const pl=new THREE.Plane(new V(0,1,0),0).applyMatrix4(vc.matrixWorldInverse),cp=new THREE.Vector4(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant),pm=vc.projectionMatrix.elements;
  const q=new THREE.Vector4((Math.sign(cp.x)+pm[8])/pm[0],(Math.sign(cp.y)+pm[9])/pm[5],-1,(1+pm[10])/pm[14]);cp.multiplyScalar(2/cp.dot(q));pm[2]=cp.x;pm[6]=cp.y;pm[10]=cp.z+1-.003;pm[14]=cp.w;
  vc.layers.set(0);hide.forEach(o=>o.visible=false);const prev=R.getRenderTarget();R.setRenderTarget(this.rt);R.clear();R.render(scene,vc);R.setRenderTarget(prev);hide.forEach(o=>o.visible=true);}}
function reflective(mat,U){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uTexMat;varying vec4 vRefl;').replace('#include <project_vertex>','#include <project_vertex>\nvRefl=uTexMat*modelMatrix*vec4(transformed,1.);');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRefl;uniform float uReflStr;varying vec4 vRefl;').replace('#include <opaque_fragment>',`
 {vec2 ruv=vRefl.xy/vRefl.w;float h1=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5,h2=fract(sin(dot(gl_FragCoord.xy,vec2(39.346,11.135)))*23421.631)-.5;vec2 j=vec2(h1,h2)*.006;
  vec3 rc=(texture2D(tRefl,ruv+j).rgb+texture2D(tRefl,ruv-j*1.6+vec2(.002,0.)).rgb+texture2D(tRefl,ruv+vec2(-.0016,.0024)).rgb+texture2D(tRefl,ruv+vec2(j.y,-j.x)*2.).rgb)*.25;
  float fr=.3+.7*pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);outgoingLight+=rc*uReflStr*fr;}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>'refl';return mat;}

/* ---------- pitch ---------- */
const PX=8.26;
function pitchTextures(){const w=Math.round(2*W*PX),h=Math.round(2*(L+GD)*PX),X=x=>(x+W)*PX,Z=z=>(z+L+GD)*PX;
 const lines=(x,glow)=>{x.strokeStyle=glow?'#fff':'rgba(255,255,255,.82)';x.lineWidth=.42*PX;x.lineCap='round';
  const rr=(x0,z0,x1,z1,r)=>{x.beginPath();x.roundRect(X(x0),Z(z0),(x1-x0)*PX,(z1-z0)*PX,r*PX);x.stroke();};
  rr(-W+RF,-L+RF,W-RF,L-RF,RC-RF);x.beginPath();x.moveTo(X(-W+RF),Z(0));x.lineTo(X(W-RF),Z(0));x.stroke();
  x.beginPath();x.arc(X(0),Z(0),15*PX,0,7);x.stroke();x.beginPath();x.arc(X(0),Z(0),.9*PX,0,7);x.fillStyle=x.strokeStyle;x.fill();
  for(const s of[-1,1]){const gl=s*L;x.beginPath();x.moveTo(X(-30),Z(gl));x.lineTo(X(-30),Z(gl-s*24));x.lineTo(X(30),Z(gl-s*24));x.lineTo(X(30),Z(gl));x.stroke();
   x.beginPath();x.moveTo(X(-GW-2),Z(gl));x.lineTo(X(-GW-2),Z(gl-s*9));x.lineTo(X(GW+2),Z(gl-s*9));x.lineTo(X(GW+2),Z(gl));x.stroke();
   x.beginPath();x.arc(X(0),Z(gl-s*24),10*PX,s<0?0:Math.PI,s<0?Math.PI:Math.PI*2);x.stroke();
   x.save();x.lineWidth=.7*PX;x.strokeStyle=glow?'#fff':'rgba(255,255,255,.95)';x.beginPath();x.moveTo(X(-GW),Z(gl));x.lineTo(X(GW),Z(gl));x.stroke();x.restore();}};
 const map=ctex(w,h,(x)=>{const stripe=12.5*PX;for(let i=0;i*stripe<h;i++){x.fillStyle=i%2?'#1e5530':'#19482a';x.fillRect(0,i*stripe,w,stripe+1);}
  for(let i=0;i<w*h/22;i++){const v=Math.random();x.fillStyle=v<.5?`rgba(0,0,0,${rnd(.18)})`:`rgba(120,200,120,${rnd(.08)})`;x.fillRect(rnd(w),rnd(h),1.5,1.5+rnd(2));}
  for(const s of[-1,1]){const g=x.createLinearGradient(0,Z(s*(L+GD)),0,Z(s*L*.35));const c=s<0?'40,90,255':'255,110,20';g.addColorStop(0,`rgba(${c},.34)`);g.addColorStop(1,`rgba(${c},0)`);x.fillStyle=g;x.fillRect(0,0,w,h);
   x.fillStyle=`rgba(${c},.35)`;x.fillRect(X(-GW),Math.min(Z(s*L),Z(s*(L+GD))),2*GW*PX,GD*PX);}
  lines(x,false);
  // centre emblem
  x.save();x.translate(X(0),Z(0));x.strokeStyle='rgba(255,255,255,.22)';x.lineWidth=.3*PX;x.beginPath();for(let i=0;i<7;i++){const a=i/6*Math.PI*2+Math.PI/6;x.lineTo(Math.cos(a)*10*PX,Math.sin(a)*10*PX);}x.stroke();
  x.fillStyle='rgba(255,255,255,.2)';x.font=`${2.6*PX}px Anton, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.rotate(Math.PI);x.fillText('ROCKET',0,-1.7*PX);x.fillText('ARENA',0,1.7*PX);x.restore();});
 const em=ctex(w,h,(x)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);lines(x,true);for(const s of[-1,1]){x.fillStyle=s<0?'#0a2a90':'#903000';x.fillRect(X(-GW),Math.min(Z(s*L),Z(s*(L+GD))),2*GW*PX,GD*PX);}});
 map.anisotropy=em.anisotropy=8;return{map,em};}

/* ---------- environment map (what glossy paint reflects) ---------- */
export function makeEnv(R){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.05,.07,.06),vec3(.09,.1,.18),smoothstep(-.2,.2,h));c=mix(c,vec3(.02,.03,.07),smoothstep(.3,1.,h));gl_FragColor=vec4(c,1.);}'})));
 const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(14,13,12),side:THREE.DoubleSide});
 for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(22,9),lm);m.position.set(x*55,48,z*65);m.lookAt(0,0,0);s.add(m);}
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2,z=Math.sin(a);const m=new THREE.Mesh(new THREE.PlaneGeometry(14,2.2),new THREE.MeshBasicMaterial({color:z<0?new THREE.Color(.3,.7,3):new THREE.Color(3,1.1,.25),side:THREE.DoubleSide}));m.position.set(Math.cos(a)*70,14,z*80);m.lookAt(0,14,0);s.add(m);}
 const top=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({color:new THREE.Color(.35,.4,.6),side:THREE.DoubleSide}));top.rotation.x=Math.PI/2;top.position.y=80;s.add(top);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.02);pm.dispose();return rt.texture;}

/* ---------- stadium + arena ---------- */
export function buildArena(scene,mirror){const out={hype:{value:0},time:{value:0},nets:[]};
 // sky dome + stars
 scene.add(new THREE.Mesh(new THREE.SphereGeometry(950,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.10,.07,.16),vec3(.012,.018,.05),smoothstep(0.,.45,h));c+=vec3(.12,.05,.1)*exp(-h*h*60.);gl_FragColor=vec4(c,1.);}'})));
 {const p=[];for(let i=0;i<1600;i++){const a=rnd(6.283),e=Math.asin(.15+rnd(.85)),r=900;p.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xcfd8ff,size:1.6,fog:false,sizeAttenuation:false,transparent:true,opacity:.8})));}
 // pitch with planar reflection
 const pt=pitchTextures();const pitchM=reflective(new THREE.MeshStandardMaterial({map:pt.map,emissiveMap:pt.em,emissive:0xffffff,emissiveIntensity:.42,roughness:.58,metalness:.05,envMapIntensity:.25}),mirror.U);
 const pitch=new THREE.Mesh(new THREE.PlaneGeometry(2*W,2*(L+GD)),pitchM);pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);out.pitch=pitch;
 const under=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:0x07080c,roughness:1}));under.rotation.x=-Math.PI/2;under.position.y=-.6;scene.add(under);
 // arena shell: quarter-pipe ramps (solid) + glass walls with a glowing hex grid
 const per=perimeter(0,2.2);
 const ramp=[],wall=[],top=[];for(let i=0;i<=8;i++){const a=i/8*Math.PI/2;ramp.push({s:-RF+RF*Math.sin(a),y:RF-RF*Math.cos(a),v:a*RF/8});}
 [RF,GH,GH+(H-RF-GH)/3,GH+(H-RF-GH)*2/3,H-RF].forEach(y=>wall.push({s:0,y,v:y/8}));for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;top.push({s:-RF+RF*Math.cos(a),y:H-RF+RF*Math.sin(a),v:(H-RF)/8+a*RF/8});}
 const panel=ctex(256,256,(x,w,h)=>{x.fillStyle='#8a92a6';x.fillRect(0,0,w,h);for(let i=0;i<2000;i++){x.fillStyle=`rgba(0,0,0,${rnd(.08)})`;x.fillRect(rnd(w),rnd(h),2,2);}x.fillStyle='rgba(10,14,24,.7)';x.fillRect(0,0,w,5);x.fillRect(0,0,4,h);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(0,6,w,2);x.fillRect(5,0,2,h);
  x.fillStyle='rgba(20,24,34,.55)';for(let i=0;i<4;i++)x.fillRect(30+i*56,120,30,8);});panel.repeat.set(1/8,1/4);
 const rampG=sweep(per,ramp,(a,b)=>inMouth(a,b),teamTint(0xffffff,.22));
 const rampM=new THREE.MeshStandardMaterial({color:0x3a4252,map:panel,roughness:.42,metalness:.45,vertexColors:true,side:THREE.DoubleSide,envMapIntensity:.6});
 const rampMesh=new THREE.Mesh(rampG,rampM);rampMesh.receiveShadow=true;scene.add(rampMesh);
 // ramp end caps beside each goal mouth
 {const pos=[];for(const sz of[-1,1])for(const sx of[-1,1]){for(let i=0;i<8;i++){const a0=i/8*Math.PI/2,a1=(i+1)/8*Math.PI/2;const p=a=>[sx*GW,RF-RF*Math.cos(a),sz*(L-RF+RF*Math.sin(a))];pos.push(sx*GW,0,sz*L,...p(a0),...p(a1));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x232833,roughness:.5,metalness:.4,side:THREE.DoubleSide})));}
 const hex=ctex(256,148,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=3;const r=w/6;const hx=(cx,cy)=>{x.beginPath();for(let i=0;i<=6;i++){const a=i/6*Math.PI*2;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.stroke();};
  for(let i=-1;i<5;i++)for(let j=-1;j<4;j++)hx(i*r*3+(j%2?r*1.5:0),j*h/2);},{srgb:false});hex.repeat.set(1/9,1/5.2);
 const gt=teamTint(0x6f7fa0,.9);const glassG=sweep(per,[...wall,...top.slice(1)],(a,b,p,q)=>inMouth(a,b)&&q.y<=GH+1e-4,(z,y)=>gt(z).multiplyScalar(1-.85*THREE.MathUtils.smoothstep(y,RF+4,H)));
 const gridM=new THREE.MeshBasicMaterial({map:hex,vertexColors:true,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
 const glassM=new THREE.MeshStandardMaterial({color:0x8090b0,transparent:true,opacity:.07,roughness:.05,metalness:.2,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.4});
 const glass=new THREE.Mesh(glassG,glassM),grid=new THREE.Mesh(glassG,gridM);glass.renderOrder=2;grid.renderOrder=3;scene.add(glass,grid);
 // glowing trims: top of the ramps + floor edge
 const trim=(prof,str)=>{const g=sweep(per,prof,(a,b,p,q)=>inMouth(a,b)&&q.y<=GH,(z)=>{const t=THREE.MathUtils.clamp(z/(L*.7),-1,1);const c=(t<0?TEAM[0].glow:TEAM[1].glow).clone().multiplyScalar(Math.abs(t)*.8+.2).add(new THREE.Color(.35,.35,.4).multiplyScalar(1-Math.abs(t)));return c.multiplyScalar(str);});
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:false}));scene.add(m);return m;};
 trim([{s:-.06,y:RF-.25,v:0},{s:-.06,y:RF+.3,v:1}],1.2);trim([{s:-.06,y:H-RF-.18,v:0},{s:-.06,y:H-RF+.18,v:1}],.6);
 // stands (stepped bowl) + instanced crowd
 const TI=15,s0=4,dS=3.5,dY=3.3,Y0=20;const sp=[{s:s0,y:Y0-.01,v:0}];for(let t=0;t<TI;t++){sp.push({s:s0+t*dS,y:Y0+t*dY,v:t},{s:s0+t*dS,y:Y0+(t+1)*dY,v:t+.5});}sp.push({s:s0+TI*dS+2,y:Y0+TI*dY,v:TI},{s:s0+TI*dS+2,y:Y0+TI*dY+6,v:TI+1});
 // LED advertising boards under the stands (open behind each goal mouth)
 {const ads=ctex(1024,64,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#0a1a50');g.addColorStop(.5,'#1a0a20');g.addColorStop(1,'#501a00');x.fillStyle=g;x.fillRect(0,0,w,h);x.font='44px Anton, Impact, sans-serif';x.textBaseline='middle';
   const items=[['ROCKET ARENA','#ffffff'],['◆','#ff4d00'],['PIXEL ARCADE','#ffcf3f'],['◆','#3d8bff'],['BOOST · JUMP · FLIP','#9ec0ff'],['◆','#ff6a1a']];let px=12;for(const[t,c]of items){x.fillStyle=c;x.fillText(t,px,h/2+2);px+=x.measureText(t).width+28;}
   x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<w;i+=3)x.fillRect(i,0,1,h);});ads.repeat.set(1/42,1);out.ads=ads;
  const fg=sweep(perimeter(0,3),[{s:s0,y:0,v:0},{s:s0,y:Y0,v:1}],(a,b)=>inMouth(a,b));const fm=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({map:ads,color:new THREE.Color(1.05,1.05,1.05),side:THREE.DoubleSide}));scene.add(fm);
  const lip=sweep(perimeter(0,3),[{s:s0,y:Y0-.15,v:0},{s:s0,y:Y0+.25,v:1}],null,()=>new THREE.Color(1.6,1.7,2));scene.add(new THREE.Mesh(lip,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})));}
 const per2=perimeter(0,3,[]);
 const standM=new THREE.MeshStandardMaterial({color:0x2a2f3c,roughness:.85,metalness:.1,side:THREE.DoubleSide});
 const stands=new THREE.Mesh(sweep(per2,sp.map(p=>({s:p.s,y:p.y,v:p.v}))),standM);scene.add(stands);stands.layers.set(1);
 {const fg=new THREE.BoxGeometry(.8,1,.55);fg.translate(0,.5,0);const hd=new THREE.BoxGeometry(.42,.42,.42);hd.translate(0,1.28,0);const geo=merge([[fg],[hd]]);
  const mat=new THREE.MeshLambertMaterial({color:0xffffff});mat.onBeforeCompile=sh=>{sh.uniforms.uTime=out.time;sh.uniforms.uHype=out.hype;
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime,uHype;').replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
   vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453);
   float jb=max(0.,sin(uTime*(4.+ph*5.)+ph*40.));transformed.y+=jb*jb*(.08+uHype*.95)*(.4+ph);
   #endif`);sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#if defined(USE_INSTANCING_COLOR)||defined(USE_COLOR)\ntotalEmissiveRadiance+=vColor*.22;\n#endif');};
  const pal=['#e8e8e8','#2a2a2e','#c8c8d0','#7a7a84','#3d5a8a','#8a3d3d','#d8c060','#5a8a5a','#3a3a44'];const pts=[];
  for(let t=0;t<TI;t++){const s=s0+t*dS+dS*.55,ring=perimeter(s,1.45,[]);for(const p of ring){if(Math.random()<.14)continue;pts.push([p.x,Y0+t*dY+dY,p.z,Math.atan2(-p.ox,-p.oz),t]);}}
  const mesh=new THREE.InstancedMesh(geo,mat,pts.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  pts.forEach((p,i)=>{q.setFromAxisAngle(new V(0,1,0),p[3]);const s=.9+rnd(.3);m4.compose(new V(p[0]+rnd(.3),p[1],p[2]+rnd(.3)),q,new V(s,s*(.85+rnd(.35)),s));mesh.setMatrixAt(i,m4);
   const side=p[2]/(L+40),r=Math.random();if(r<Math.abs(side)*.85)c.set(side<0?(Math.random()<.5?'#2f6bff':'#9ec0ff'):(Math.random()<.5?'#ff6a10':'#ffc08a'));else c.set(pal[Math.random()*pal.length|0]);mesh.setColorAt(i,c);});
  mesh.layers.set(1);scene.add(mesh);out.crowd=mesh;
  // camera flashes in the crowd
  const fp=[],fr=[];for(let i=0;i<700;i++){const p=pts[Math.random()*pts.length|0];fp.push(p[0],p[1]+1.4,p[2]);fr.push(Math.random());}
  const fg2=new THREE.BufferGeometry();fg2.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg2.setAttribute('ph',new THREE.Float32BufferAttribute(fr,1));
  const fl=new THREE.Points(fg2,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:out.time,uHype:out.hype},
   vertexShader:'attribute float ph;uniform float uTime,uHype;varying float vA;void main(){float t=fract(uTime*(.15+ph*.2+uHype*.6)+ph*7.);vA=smoothstep(.97,1.,t)*(1.-smoothstep(.995,1.,t)*.5);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=vA*2400./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(3.)*vA*smoothstep(.5,0.,d),1.);}'}));fl.layers.set(1);scene.add(fl);}
 // stand rim lights
 {const s=s0+TI*dS+2.05;const g=sweep(perimeter(s,3,[]),[{s:0,y:Y0+TI*dY+4,v:0},{s:0,y:Y0+TI*dY+5,v:1}],null,()=>new THREE.Color(2.2,2.3,2.6));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));scene.add(m);}
 // floodlight towers
 const lampT=ctex(256,128,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);for(let i=0;i<8;i++)for(let j=0;j<4;j++){const g=x.createRadialGradient(16+i*32,16+j*32,1,16+i*32,16+j*32,14);g.addColorStop(0,'#fff');g.addColorStop(.6,'#fff6e0');g.addColorStop(1,'#333');x.fillStyle=g;x.fillRect(i*32+2,j*32+2,28,28);}});
 const towerM=new THREE.MeshStandardMaterial({color:0x2a2e38,roughness:.6,metalness:.6});const lampM=new THREE.MeshBasicMaterial({map:lampT,color:new THREE.Color(6,5.6,5)});
 const glowT=ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,235,1)');g.addColorStop(.2,'rgba(255,240,210,.45)');g.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});
 for(const[sx,sz]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const x=sx*(W+52),z=sz*(L+48),g=new THREE.Group();g.position.set(x,0,z);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.2,2.6,106,8),towerM);pole.position.y=53;g.add(pole);
  const head=new THREE.Group();head.position.y=108;const back=new THREE.Mesh(new THREE.BoxGeometry(26,14,2),towerM);head.add(back);const lamp=new THREE.Mesh(new THREE.PlaneGeometry(24,12),lampM);lamp.position.z=1.05;head.add(lamp);g.add(head);head.lookAt(new V(-x,-70,-z).add(new V(x,108,z)));
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:0xfff2dd,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9,fog:false}));sp.scale.set(70,70,1);sp.position.set(0,108,0);g.add(sp);scene.add(g);}
 // jumbotrons
 const jc=document.createElement('canvas');jc.width=512;jc.height=176;const jt=new THREE.CanvasTexture(jc);jt.colorSpace=THREE.SRGBColorSpace;out.jumbo={c:jc,t:jt};
 for(const sz of[-1,1]){const g=new THREE.Group();g.position.set(0,Y0+TI*dY+20,sz*(L+s0+TI*dS-8));g.lookAt(0,24,0);const fr=new THREE.Mesh(new THREE.BoxGeometry(50,18,2),towerM);g.add(fr);const sc=new THREE.Mesh(new THREE.PlaneGeometry(47,15.5),new THREE.MeshBasicMaterial({map:jt,color:new THREE.Color(1.6,1.6,1.6)}));sc.position.z=1.05;g.add(sc);
  const leg=new THREE.Mesh(new THREE.BoxGeometry(2,26,2),towerM);leg.position.set(0,-20,-1);g.add(leg);scene.add(g);}
 // goals: posts, nets, back glow
 for(const sz of[-1,1]){const tm=TEAM[sz<0?0:1];
  const pg=merge([[new THREE.CylinderGeometry(PR,PR,GH+PR,16),M(-GW,(GH+PR)/2,sz*L)],[new THREE.CylinderGeometry(PR,PR,GH+PR,16),M(GW,(GH+PR)/2,sz*L)],[new THREE.CylinderGeometry(PR,PR,2*GW,16),M(0,GH,sz*L,0,0,Math.PI/2)],
   [new THREE.CylinderGeometry(.25,.25,GD,8),M(-GW,GH,sz*(L+GD/2),Math.PI/2)],[new THREE.CylinderGeometry(.25,.25,GD,8),M(GW,GH,sz*(L+GD/2),Math.PI/2)],[new THREE.CylinderGeometry(.25,.25,2*GW,8),M(0,GH,sz*(L+GD),0,0,Math.PI/2)],
   [new THREE.CylinderGeometry(.25,.25,GH,8),M(-GW,GH/2,sz*(L+GD))],[new THREE.CylinderGeometry(.25,.25,GH,8),M(GW,GH/2,sz*(L+GD))]]);
  const post=new THREE.Mesh(pg,new THREE.MeshStandardMaterial({color:0xf2f4ff,emissive:tm.c,emissiveIntensity:1.4,roughness:.25,metalness:.6}));post.castShadow=true;scene.add(post);
  // net: back, two sides and roof, finely subdivided so it can ripple
  const net=new THREE.Group();const U={uHit:{value:new V(0,-99,0)},uT:{value:9},uAmp:{value:0},uCol:{value:tm.glow.clone().multiplyScalar(.55)}};
  const nm=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
   vertexShader:`uniform vec3 uHit;uniform float uT,uAmp;varying vec2 vUv;varying float vD;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vec3 n=normalize(mat3(modelMatrix)*normal);float d=distance(w.xyz,uHit);
    float k=uAmp*exp(-d*d/40.)*exp(-uT*2.5)*sin(uT*18.-d*.8);w.xyz+=n*k*1.6;vD=k;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`uniform vec3 uCol;varying vec2 vUv;varying float vD;void main(){vec2 g=vUv*vec2(26.,12.);vec2 f=abs(fract(g)-.5);float l=smoothstep(.42,.5,max(f.x,f.y));gl_FragColor=vec4(uCol*(l*.9+.06)*(1.+abs(vD)*1.5),1.);}`});
  const back=new THREE.Mesh(new THREE.PlaneGeometry(2*GW,GH,26,10),nm);back.position.set(0,GH/2,sz*(L+GD-.05));back.rotation.y=sz>0?Math.PI:0;
  const roof=new THREE.Mesh(new THREE.PlaneGeometry(2*GW,GD,26,10),nm);roof.position.set(0,GH-.05,sz*(L+GD/2));roof.rotation.x=Math.PI/2;
  const sideA=new THREE.Mesh(new THREE.PlaneGeometry(GD,GH,10,10),nm);sideA.position.set(-GW+.05,GH/2,sz*(L+GD/2));sideA.rotation.y=Math.PI/2;
  const sideB=sideA.clone();sideB.position.x=GW-.05;sideB.rotation.y=-Math.PI/2;net.add(back,roof,sideA,sideB);scene.add(net);out.nets.push({side:sz,U});
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(2*GW,GH),new THREE.MeshBasicMaterial({color:tm.glow.clone().multiplyScalar(.12),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));gl.position.set(0,GH/2,sz*(L+GD+.3));gl.rotation.y=sz>0?Math.PI:0;scene.add(gl);
  const bl=new THREE.Mesh(new THREE.BoxGeometry(2*GW+6,GH+8,1),towerM);bl.position.set(0,(GH+8)/2-1,sz*(L+GD+1.2));scene.add(bl);}
 return out;}

/* ---------- boost pads ---------- */
export function buildPads(scene,pads){const n=pads.length,sm=pads.filter(p=>!p.big),bg=pads.filter(p=>p.big);
 const baseM=new THREE.MeshStandardMaterial({color:0x2b2f38,roughness:.4,metalness:.7});
 const ring=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=10;x.beginPath();x.arc(64,64,52,0,7);x.stroke();x.lineWidth=4;x.beginPath();x.arc(64,64,30,0,7);x.stroke();},{clamp:true});
 const glowM=new THREE.MeshBasicMaterial({map:ring,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffffff});
 const mk=(list,r)=>{const b=new THREE.InstancedMesh(new THREE.CylinderGeometry(r,r*1.15,.14,24),baseM,list.length),g=new THREE.InstancedMesh(new THREE.PlaneGeometry(r*2.1,r*2.1).rotateX(-Math.PI/2),glowM,list.length);const m4=new THREE.Matrix4();
  list.forEach((p,i)=>{m4.makeTranslation(p.x,.07,p.z);b.setMatrixAt(i,m4);m4.makeTranslation(p.x,.16,p.z);g.setMatrixAt(i,m4);g.setColorAt(i,new THREE.Color(2.4,1.2,.2));});b.receiveShadow=true;scene.add(b,g);return g;};
 const gs=mk(sm,1.35),gb=mk(bg,2.6);
 const orbM=new THREE.MeshStandardMaterial({color:0xffb030,emissive:0xff8a10,emissiveIntensity:2.6,roughness:.3});
 const orbs=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.05,1),orbM,bg.length),minis=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.42,0),orbM,sm.length);scene.add(orbs,minis);
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
 return function update(t){bg.forEach((p,i)=>{const on=p.t<=0;q.setFromEuler(new THREE.Euler(t*.7,t*1.3+i,0));m4.compose(new V(p.x,1.9+Math.sin(t*2+i)*.25,p.z),q,new V(1,1,1).multiplyScalar(on?1:0));orbs.setMatrixAt(i,m4);gb.setColorAt(i,on?c.setRGB(2.6,1.3,.2):c.setRGB(.25,.12,.04));});
  sm.forEach((p,i)=>{const on=p.t<=0;q.setFromEuler(new THREE.Euler(0,t*2+i,0));m4.compose(new V(p.x,.75+Math.sin(t*3+i)*.12,p.z),q,new V(1,1,1).multiplyScalar(on?1:0));minis.setMatrixAt(i,m4);gs.setColorAt(i,on?c.setRGB(2.2,1.1,.18):c.setRGB(.2,.1,.03));});
  orbs.instanceMatrix.needsUpdate=minis.instanceMatrix.needsUpdate=true;gs.instanceColor.needsUpdate=gb.instanceColor.needsUpdate=true;};}

/* ---------- cars (two original body styles, lofted from superellipse cross-sections) ---------- */
// secs: [z, halfWidth, yBottom, yTop] from tail to nose
const STYLES=[
 {n:'VANGUARD',wing:true,body:[[-1.96,.84,.38,.84],[-1.84,1.0,.3,.95],[-1.45,1.02,.28,.98],[-1.05,.98,.28,.97],[-.55,1.07,.27,.94],[0,1.09,.27,.9],[.6,1.04,.27,.84],[1.05,.97,.27,.77],[1.5,.99,.28,.67],[1.84,.93,.3,.55],[2.04,.74,.33,.45]],
  cab:[[-1.66,.42,.82,.9],[-1.42,.62,.8,1.12],[-.96,.74,.8,1.3],[-.36,.76,.8,1.33],[.14,.7,.8,1.17],[.55,.55,.8,.93],[.74,.38,.8,.83]]},
 {n:'COMET',wing:false,body:[[-2.02,.86,.34,.78],[-1.88,1.04,.28,.87],[-1.4,1.04,.26,.88],[-1.0,.99,.26,.86],[-.4,1.08,.26,.84],[.3,1.08,.26,.79],[.95,1.0,.26,.71],[1.45,1.0,.27,.6],[1.85,.94,.29,.48],[2.12,.72,.32,.38]],
  cab:[[-1.78,.4,.76,.82],[-1.48,.62,.74,1.02],[-.92,.72,.74,1.17],[-.3,.72,.74,1.17],[.22,.62,.74,.98],[.58,.42,.74,.78]]}];
function loft(secs,n=4.5,M=28,color){const ring=[];for(let j=0;j<M;j++){const a=j/M*Math.PI*2,c=Math.cos(a),s=Math.sin(a);ring.push([Math.sign(c)*Math.pow(Math.abs(c),2/n),Math.sign(s)*Math.pow(Math.abs(s),2/n)]);}
 const pos=[],col=[],idx=[],push=(x,y,z)=>{pos.push(x,y,z);if(color){const c=color(x,y,z);col.push(c.r,c.g,c.b);}};
 secs.forEach(([z,w,yb,yt])=>{const yc=(yb+yt)/2,h=(yt-yb)/2;for(const[rx,ry]of ring)push(rx*w,yc+ry*h,z);});
 for(let i=0;i<secs.length-1;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M,c=(i+1)*M+j,d=(i+1)*M+(j+1)%M;idx.push(a,b,c,b,d,c);}
 const cap=(i,front)=>{const[z,,yb,yt]=secs[i],ci=pos.length/3;push(0,(yb+yt)/2,z);for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;front?idx.push(ci,a,b):idx.push(ci,b,a);}};
 cap(0,false);cap(secs.length-1,true);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(color)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
const flameMat=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uC:{value:new THREE.Color()},uS:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float uT,uS;uniform vec3 uC;varying vec2 vUv;float h(float x){return fract(sin(x*91.7)*437.5);}void main(){float y=vUv.y;float fl=.75+.25*sin(uT*70.+y*20.)*h(floor(uT*30.));float core=smoothstep(.0,.85,y);vec3 c=mix(uC,vec3(4.,3.6,3.),core*core);float a=pow(y,1.4)*fl*uS;gl_FragColor=vec4(c*a,1.);}'});
const WX=1.13,WR=.45;
export function makeCar(team,style){const T=TEAM[team],S=STYLES[style%2];const root=new THREE.Group(),body=new THREE.Group();root.add(body);body.position.y=-CAR.ride;
 const paint=new THREE.MeshPhysicalMaterial({color:T.paint,metalness:.5,roughness:.28,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.3,vertexColors:true});
 const carbon=new THREE.MeshStandardMaterial({color:0x15171d,roughness:.42,metalness:.55,envMapIntensity:.9});
 const glass=new THREE.MeshPhysicalMaterial({color:0x060910,metalness:.7,roughness:.03,clearcoat:1,envMapIntensity:2});
 const glow=new THREE.MeshBasicMaterial({color:T.glow}),white=new THREE.MeshBasicMaterial({color:new THREE.Color(3.4,3.3,3)}),red=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.12,.1)});
 // two-tone: dark lower skirt, bright accent along the shoulder
 const skirt=new THREE.Color(.09,.09,.1),acc=new THREE.Color(1.35,1.35,1.4);
 const tone=(x,y,z)=>{const t=THREE.MathUtils.smoothstep(y,.4,.5);const c=skirt.clone().lerp(new THREE.Color(1,1,1),t);if(Math.abs(x)<.16&&y>.6)c.copy(acc);return c;};
 const bodyG=loft(S.body,4.6,32,tone);const W1=[],P=[],K=[],Gl=[],E=[],Wt=[],R=[];
 Gl.push([loft(S.cab,3.2,28)]);
 for(const sx of[-1,1])for(const sz of[-1,1]){const f=new THREE.TorusGeometry(WR+.07,.1,8,18,Math.PI);f.rotateY(Math.PI/2);f.scale(1.9,1,1);f.translate(sx*WX,WR,sz*1.18);P.push([f]);}
 K.push([new THREE.BoxGeometry(2.0,.06,.42),M(0,.29,1.92)],[new THREE.BoxGeometry(1.7,.2,.3),M(0,.36,-1.92)],[new THREE.BoxGeometry(.12,.14,1.3),M(1.02,.33,-.02)],[new THREE.BoxGeometry(.12,.14,1.3),M(-1.02,.33,-.02)]);
 for(const sx of[-1,1])K.push([new THREE.CylinderGeometry(.13,.15,.3,14),M(sx*.36,.5,-1.98,Math.PI/2)]);
 if(S.wing){P.push([new THREE.BoxGeometry(2.25,.06,.5),M(0,1.36,-1.64,-.1)]);K.push([new THREE.BoxGeometry(.07,.42,.26),M(.55,1.14,-1.6,.15)],[new THREE.BoxGeometry(.07,.42,.26),M(-.55,1.14,-1.6,.15)],[new THREE.BoxGeometry(.05,.3,.6),M(1.13,1.36,-1.64)],[new THREE.BoxGeometry(.05,.3,.6),M(-1.13,1.36,-1.64)]);}
 else{P.push([new THREE.BoxGeometry(.06,.42,.8),M(.62,1.02,-1.5,0,0,.12)],[new THREE.BoxGeometry(.06,.42,.8),M(-.62,1.02,-1.5,0,0,-.12)]);K.push([new THREE.BoxGeometry(1.9,.06,.3),M(0,.84,-1.98,.3)]);}
 E.push([new THREE.BoxGeometry(.04,.05,1.25),M(1.09,.44,-.02)],[new THREE.BoxGeometry(.04,.05,1.25),M(-1.09,.44,-.02)],[new THREE.BoxGeometry(.9,.03,.04),M(0,.58,2.0)]);
 Wt.push([new THREE.BoxGeometry(.42,.07,.07),M(.52,.56,1.96,0,.35)],[new THREE.BoxGeometry(.42,.07,.07),M(-.52,.56,1.96,0,-.35)]);
 R.push([new THREE.BoxGeometry(1.4,.06,.05),M(0,.74,-1.97)]);
 const mesh=(g,m,cast=true)=>{const o=new THREE.Mesh(g,m);o.castShadow=cast;body.add(o);return o;};
 const ONE=new THREE.Color(1,1,1);mesh(merge([[bodyG],...P.map(e=>[e[0],e[1],ONE])]),paint);
 mesh(merge(K),carbon);mesh(merge(Gl),glass);
 const lights=new THREE.MeshBasicMaterial({vertexColors:true});mesh(merge([...E.map(e=>[e[0],e[1],T.glow]),...Wt.map(e=>[e[0],e[1],white.color]),...R.map(e=>[e[0],e[1],red.color])]),lights,false);
 // exhaust flames
 const fm=flameMat();fm.uniforms.uC.value.copy(T.glow).multiplyScalar(.8);
 const fg=merge([[new THREE.ConeGeometry(.18,1.8,12,1,true),M(.36,.5,-2.95,-Math.PI/2)],[new THREE.ConeGeometry(.18,1.8,12,1,true),M(-.36,.5,-2.95,-Math.PI/2)]]);
 const flame=new THREE.Mesh(fg,fm);flame.visible=false;body.add(flame);
 // wheels: pivot (steer) > spin > tyre + rim + glowing ring
 const rimC=new THREE.Color(.16,.17,.2),tyC=new THREE.Color(.035,.035,.04);
 const sp=[[new THREE.CylinderGeometry(WR,WR,.36,26),M(0,0,0,0,0,Math.PI/2),tyC],[new THREE.CylinderGeometry(.29,.29,.37,18),M(0,0,0,0,0,Math.PI/2),rimC]];for(let k=0;k<5;k++)sp.push([new THREE.BoxGeometry(.375,.07,.52),M(0,0,0,k*Math.PI/5),rimC]);const wheelG=merge(sp);
 const ringG=merge([[new THREE.TorusGeometry(.31,.022,6,24),M(.19,0,0,0,Math.PI/2)],[new THREE.TorusGeometry(.31,.022,6,24),M(-.19,0,0,0,Math.PI/2)]]);
 const wheelM=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.6,roughness:.55,envMapIntensity:.8});
 const wheels=[];for(const[sx,sz]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const piv=new THREE.Group();piv.position.set(sx*WX,WR-CAR.ride,sz*1.18);const spin=new THREE.Group();piv.add(spin);
  const t=new THREE.Mesh(wheelG,wheelM);t.castShadow=true;spin.add(t,new THREE.Mesh(ringG,glow));root.add(piv);wheels.push({piv,spin,front:sz>0,base:WR-CAR.ride});}
 root.userData={body,wheels,flame,fm,paint,susp:0,suspV:0,pitch:0,roll:0,style:S.n};return root;}

/* ---------- ball ---------- */
export function makeBall(){const tex=ctex(1024,512,(x,w,h)=>{x.fillStyle='#b8bcc6';x.fillRect(0,0,w,h);for(let i=0;i<6000;i++){x.fillStyle=`rgba(0,0,0,${rnd(.06)})`;x.fillRect(rnd(w),rnd(h),2,2);}
  x.strokeStyle='#4a505c';x.lineWidth=5;const r=40;for(let j=0;j<8;j++)for(let i=0;i<14;i++){const cx=i*r*1.8+(j%2?r*.9:0),cy=j*r*1.55;x.beginPath();for(let k=0;k<=6;k++){const a=k/6*Math.PI*2+Math.PI/6;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.stroke();}
  x.fillStyle='#2c3038';x.fillRect(0,h/2-10,w,20);},{});
 const em=ctex(1024,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.fillRect(0,h/2-3,w,6);x.fillStyle='#bcd';for(let i=0;i<8;i++)x.fillRect(i*w/8,0,4,h);});
 const m=new THREE.Mesh(new THREE.SphereGeometry(RB,48,32),new THREE.MeshStandardMaterial({map:tex,emissiveMap:em,emissive:new THREE.Color(.8,.9,1),emissiveIntensity:1.1,roughness:.32,metalness:.35,envMapIntensity:1.1}));m.castShadow=true;
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(128,128,(x)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(.35,'rgba(200,220,255,.18)');g.addColorStop(1,'rgba(200,220,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);},{clamp:true}),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));halo.scale.set(RB*5,RB*5,1);
 const g=new THREE.Group();g.add(m);g.add(halo);g.userData={mesh:m,halo};return g;}

/* ---------- particles (one draw call) ---------- */
export class Particles{constructor(scene,n=4000){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
   vertexShader:'attribute float size;uniform float uScale;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color*smoothstep(1.5,7.,-mv.z);gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC*a,1.);}'}));this.pts.frustumCulled=false;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){dx=dx*(o.spread??.6)+o.dir.x;dy=dy*(o.spread??.6)+o.dir.y;dz=dz*(o.spread??.6)+o.dir.z;}if(o.up)dy=Math.abs(dy);const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0){s[i]=0;}continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(p[i*3+1]<.05&&g[i]>0){p[i*3+1]=.05;v[i*3+1]*=-.4;}
   const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;s[i]=os[i]*(.4+.6*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ---------- ribbon trails ---------- */
export class Trail{constructor(scene,n,width,color){this.n=n;this.w=width;this.col=color;this.pts=[];this.pos=new Float32Array(n*2*3);this.c=new Float32Array(n*2*3);const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));this.mesh.frustumCulled=false;scene.add(this.mesh);this.str=0;}
 push(p,on,dt){this.str+=((on?1:0)-this.str)*Math.min(1,dt*(on?8:3));const last=this.pts[0];if(!last||last.distanceToSquared(p)>.25){this.pts.unshift(p.clone());if(this.pts.length>this.n)this.pts.pop();}else last.copy(p);}
 clear(){this.pts.length=0;this.str=0;}
 update(cam){const P=this.pts,n=P.length,tmp=new V(),side=new V(),tan=new V();for(let i=0;i<this.n;i++){const k=Math.min(i,n-1);if(n<2){this.pos.fill(0);this.c.fill(0);break;}const p=P[k];tan.subVectors(P[Math.max(0,k-1)],P[Math.min(n-1,k+1)]);tmp.subVectors(cam.position,p);side.crossVectors(tan,tmp).normalize();
   const f=1-i/(this.n-1),w=this.w*(.3+.7*f);this.pos[i*6]=p.x+side.x*w;this.pos[i*6+1]=p.y+side.y*w;this.pos[i*6+2]=p.z+side.z*w;this.pos[i*6+3]=p.x-side.x*w;this.pos[i*6+4]=p.y-side.y*w;this.pos[i*6+5]=p.z-side.z*w;
   const a=f*f*this.str*(i<n?1:0)*THREE.MathUtils.smoothstep(tmp.length(),3,14);for(let j=0;j<2;j++){this.c[i*6+j*3]=this.col.r*a;this.c[i*6+j*3+1]=this.col.g*a;this.c[i*6+j*3+2]=this.col.b*a;}}
  this.mesh.geometry.attributes.position.needsUpdate=this.mesh.geometry.attributes.color.needsUpdate=true;this.mesh.visible=this.str>.01&&n>1;}}

/* ---------- shockwave shells ---------- */
export class Shocks{constructor(scene,n=6){this.list=[];const geo=new THREE.SphereGeometry(1,40,20);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color()},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.2);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;scene.add(m);this.list.push({m,t:0,d:1,r:1});}}
 fire(p,col,radius,dur){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.m.material.uniforms.uC.value.copy(col);s.t=0;s.d=dur;s.r=radius;s.m.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(.5+s.r*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.6;}}}
