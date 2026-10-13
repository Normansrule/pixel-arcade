// DROPZONE — environment: ground + beach, sea shader, sky dome, the toxic gas wall, instanced street props, the transport plane, parachutes, supply crates, rovers.
import * as THREE from '../vendor/three.module.min.js';
import {Geo,LAND,WATER} from './world.js';
const V=THREE.Vector3;
const sst=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const n2=(x,z)=>Math.sin(x*.071+Math.sin(z*.05))*Math.cos(z*.063-Math.sin(x*.04))*.5+.5;
export const groundH=(x,z)=>{const e=Math.max(Math.abs(x),Math.abs(z))-LAND;return e>0?-Math.min(5,e*.22):-.02;};

export function buildGround(T,MAP){const g=new THREE.Group();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,map:T.ground.map,normalMap:T.ground.normalMap,normalScale:new THREE.Vector2(.6,.6),roughness:.97});
 const mk=(half,step,inner)=>{const n=Math.round(half*2/step);const geo=new THREE.PlaneGeometry(half*2,half*2,n,n);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,uv=geo.attributes.uv,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);let h=groundH(x,z);if(!inner&&Math.abs(x)<LAND+30&&Math.abs(z)<LAND+30)h-=6;p.setY(i,h);uv.setXY(i,x/7,z/7);
   const e=Math.max(Math.abs(x),Math.abs(z))-LAND;const nn=n2(x,z),n3=n2(x*3.1+40,z*2.7);
   let r=.46+nn*.06,gg=.45+nn*.05,b=.42+nn*.04;// dusty concrete lots
   const grassy=(x<-170&&z>-170&&z<230)||MAP.parks.some(q=>x>q[0]&&x<q[2]&&z>q[1]&&z<q[3]);if(grassy){const k=.75+n3*.25;r=.33*k+.06;gg=.43*k+.04;b=.2*k;}
   if(z<-246&&x>40)r*=.88,gg*=.86,b*=.84;// foundry soot
   const sd=sst(-14,-2,e);r+=(.7-r)*sd;gg+=(.64-gg)*sd;b+=(.5-b)*sd;const wt=sst(0,6,e);r+=(.42-r)*wt;gg+=(.38-gg)*wt;b+=(.31-b)*wt;
   col[i*3]=r;col[i*3+1]=gg;col[i*3+2]=b;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;g.add(m);return m;};
 mk(LAND+40,4,true);mk(1400,40,false);return g;}

/* ---------- sea ---------- */
export function buildSea(T){const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uSky:{value:new THREE.Color(0xa8c4dc)},uDeep:{value:new THREE.Color(0x0e3a4c)},uShal:{value:new THREE.Color(0x2a7a7a)},uSun:{value:new V(.3,.8,.4)},uSunC:{value:new THREE.Color(1,.95,.85)},uN:{value:T.water.normalMap}}]);
 const mat=new THREE.ShaderMaterial({uniforms:U,fog:true,
  vertexShader:`uniform float uT;varying vec3 vW;varying float vD;
   #include <fog_pars_vertex>
   void main(){vec4 w=modelMatrix*vec4(position,1.);float e=max(abs(w.x),abs(w.z))-${LAND.toFixed(1)};float h=e>0.?-min(5.,e*.22):0.;vD=${WATER.toFixed(2)}-h;
    float a=clamp(vD*.4,0.,1.);w.y+=(sin(w.x*.06+uT*.8)*.22+sin(w.z*.09-uT*1.1)*.14+sin((w.x+w.z)*.17+uT*1.6)*.05)*a;vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
   }`,
  fragmentShader:`uniform float uT;uniform vec3 uSky,uDeep,uShal,uSun,uSunC;uniform sampler2D uN;varying vec3 vW;varying float vD;
   #include <fog_pars_fragment>
   void main(){vec2 uv=vW.xz*.03;vec3 n1=texture2D(uN,uv+vec2(uT*.012,uT*.007)).xyz*2.-1.;vec3 n2=texture2D(uN,uv*2.3-vec2(uT*.017,-uT*.01)).xyz*2.-1.;vec3 n=normalize(vec3(n1.x+n2.x,5.,n1.y+n2.y));
    vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(n,V),0.),4.)*.8+.05;vec3 base=mix(uShal,uDeep,smoothstep(.2,4.,vD));vec3 c=mix(base,uSky,fr);
    vec3 R=reflect(-V,n);float sp=pow(max(dot(R,normalize(uSun)),0.),220.);c+=uSunC*sp*3.;
    float foam=smoothstep(.6,.0,vD)*(.55+.45*sin(length(vW.xz)*.6+uT*2.+n1.x*3.));c=mix(c,vec3(.9,.92,.9),clamp(foam,0.,.8));
    gl_FragColor=vec4(c,1.);
    #include <fog_fragment>
   }`});
 const geo=new THREE.PlaneGeometry(3000,3000,150,150);geo.rotateX(-Math.PI/2);geo.translate(0,WATER,0);const m=new THREE.Mesh(geo,mat);return{mesh:m,U};}

/* ---------- sky ---------- */
export function buildSky(){const U={uTop:{value:new THREE.Color(0x3a72b8)},uHor:{value:new THREE.Color(0xc8dcea)},uSun:{value:new V(.4,.6,.5).normalize()},uSunC:{value:new THREE.Color(1,.92,.8)},uCloud:{value:.45},uT:{value:0},uFog:{value:new THREE.Color(0xb8ccd8)}};
 const mat=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunC,uFog;uniform float uCloud,uT;varying vec3 vD;
   float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.03;a*=.5;}return s;}
   void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uTop,smoothstep(0.,.5,y));
    vec2 cp=d.xz/(max(y,.04)+.12)*1.2+vec2(uT*.008,uT*.003);float cl=fbm(cp)*.85+fbm(cp*3.1)*.3;float cov=smoothstep(.66-uCloud*.32,1.05,cl);
    vec3 cc=mix(vec3(1.),uHor*.85+uTop*.15,smoothstep(.5,1.1,cl));c=mix(c,cc,cov*smoothstep(-.02,.15,y)*.9);
    float sd=max(dot(d,normalize(uSun)),0.);c+=uSunC*(pow(sd,8.)*.22+pow(sd,120.)*1.6)*(1.-cov*.6);
    c=mix(uFog,c,smoothstep(-.03,.18,y));gl_FragColor=vec4(c,1.);}`});
 const m=new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),mat);m.renderOrder=-1;m.frustumCulled=false;return{mesh:m,U};}

/* ---------- gas wall ---------- */
const NOISE=`float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=n(p)*a;p*=2.07;a*=.5;}return s;}`;
export function buildGas(scene){const U={uT:{value:0},uR:{value:400},uC:{value:new THREE.Vector2()}};
 const geo=new THREE.CylinderGeometry(1,1,320,128,1,true);geo.translate(0,150,0);
 const wall=layer=>new THREE.ShaderMaterial({uniforms:{...U,uL:{value:layer}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT,uR,uL;uniform vec2 uC;varying vec2 vUv;varying vec3 vW;${NOISE}
   void main(){float t=uT*(1.-uL*.4)+uL*13.,a=vUv.x*6.2832*uR,y=vW.y;vec2 q=vec2(a*.02,y*.014);vec2 w=vec2(fb(q+vec2(t*.05,-t*.12)),fb(q*1.3+vec2(4.1,-t*.16)));float f=fb(q*2.1+w*1.7+vec2(-t*.08,-t*.22));
    vec3 c=mix(vec3(.42,.3,.05),vec3(1.,.62,.12),smoothstep(.3,.8,f));c=mix(c,vec3(1.,.86,.45),smoothstep(.65,.92,f)*.6);float seam=exp(-max(y,0.)*.12);c+=seam*vec3(1.,.55,.1)*.5;
    float d=length(cameraPosition-vW);float al=(.34+.4*f)*(1.-uL*.4)*(1.-smoothstep(90.,300.,y))*(.25+.75*smoothstep(1.5,30.,d));al=clamp(al+seam*.25,0.,.9);gl_FragColor=vec4(c*1.1,al);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 const m=new THREE.Mesh(geo,wall(0));m.renderOrder=2;m.frustumCulled=false;scene.add(m);const inner=new THREE.Mesh(geo,wall(1));inner.scale.set(.985,1,.985);inner.renderOrder=2;inner.frustumCulled=false;m.add(inner);
 // haze ceiling outside the circle
 const ceil=new THREE.Mesh(new THREE.PlaneGeometry(2,2).rotateX(Math.PI/2),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT,uR;uniform vec2 uC;varying vec3 vW;${NOISE}
   void main(){float d=length(vW.xz-uC);vec2 p=vW.xz*.01;float f=fb(p+fb(p*1.7+uT*.02)*1.4+vec2(uT*.02,0.));vec3 c=mix(vec3(.4,.28,.06),vec3(.9,.6,.16),smoothstep(.3,.85,f));
    float al=smoothstep(uR-2.,uR+50.,d)*(.5+.4*f)*(1.-smoothstep(120.,170.,cameraPosition.y));gl_FragColor=vec4(c,al);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));ceil.scale.set(1500,1,1500);ceil.position.y=60;ceil.renderOrder=1;ceil.frustumCulled=false;scene.add(ceil);
 return{U,mesh:m,update(x,z,r,t,on){U.uT.value=t;U.uR.value=Math.max(.5,r);U.uC.value.set(x,z);m.visible=on;ceil.visible=on;m.position.set(x,0,z);m.scale.set(Math.max(.5,r),1,Math.max(.5,r));ceil.position.x=0;ceil.position.z=0;}};}

/* ---------- prop geometry (vertex coloured, merged) ---------- */
function pg(fn){const g=new Geo();fn(g);let P=[],N=[],Uv=[],C=[];for(const k in g.k){const b=g.k[k];P=P.concat(b.p);N=N.concat(b.n);Uv=Uv.concat(b.u);C=C.concat(b.c);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(Uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.computeBoundingSphere();return geo;}
export const PROPG={
 car:()=>pg(g=>{g.box(-.9,.32,-2.15,.9,.95,2.15,'p',0xffffff);g.box(-.82,.95,-1.1,.82,1.45,.9,'p',0xffffff);g.box(-.84,1.,-1.05,.84,1.38,.85,'p',0x1a2028,{ind:1});g.box(-.86,.55,-2.2,-.5,.7,-2.12,'p',0xfff0c0);g.box(.5,.55,-2.2,.86,.7,-2.12,'p',0xfff0c0);g.box(-.86,.55,2.12,-.5,.7,2.2,'p',0xc02020);g.box(.5,.55,2.12,.86,.7,2.2,'p',0xc02020);
  for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])g.cyl(a*.86,.34,b*1.35,.34,.22,'p',0x141414,10,'x');g.box(-.92,.32,-2.2,.92,.42,2.2,'p',0x222222);}),
 dump:()=>pg(g=>{g.box(-1,0,-.7,1,1.2,.7,'p',0xffffff);g.box(-1.05,1.2,-.75,1.05,1.3,.75,'p',0x222222);g.box(-1.08,.3,-.72,1.08,.4,.72,'p',0x333333);}),
 barrel:()=>pg(g=>{g.cyl(0,0,0,.3,.92,'p',0xffffff,12);g.cyl(0,.3,0,.31,.04,'p',0x333333,12,'y',{open:true});g.cyl(0,.62,0,.31,.04,'p',0x333333,12,'y',{open:true});}),
 lamp:()=>pg(g=>{g.cyl(0,0,0,.09,7,'p',0x5a5e60,8);g.box(-.1,6.8,-.1,.1,7,1.3,'p',0x5a5e60);g.box(-.18,6.7,.7,.18,6.8,1.3,'p',0xfff8e0);}),
 tree:()=>pg(g=>{g.cyl(0,0,0,.18,3.2,'p',0x5a4636,7);for(let k=0;k<3;k++){const r=2.6-k*.6,y=2.2+k*1.5;g.cyl(0,y,0,r,2.4,'p',[0xa8c890,0xb8d498,0xc8e0a4][k],9,'y',{r2:.25});}}),
 ac:()=>pg(g=>{g.box(-.7,0,-.5,.7,1,.5,'p',0xa8acb0);g.cyl(0,1,0,.38,.06,'p',0x333333,12);g.box(-.72,.1,-.52,.72,.2,.52,'p',0x6a6e72);}),
 water:()=>pg(g=>{for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])g.box(a*1-.08,0,b*1-.08,a*1+.08,2,b*1+.08,'p',0x4a3a2a);g.cyl(0,2,0,1.4,2.2,'p',0x8a6a4a,12);g.cyl(0,4.2,0,1.5,.5,'p',0x5a4a3a,12,'y',{r2:.2});}),
 bench:()=>pg(g=>{g.box(-1,.42,-.25,1,.5,.25,'p',0x8a6a4a);g.box(-1,.5,.2,1,.95,.26,'p',0x8a6a4a);for(const a of[-.85,.85])g.box(a-.04,0,-.22,a+.04,.42,.22,'p',0x333333);}),
 dish:()=>pg(g=>{g.cyl(0,0,0,1.6,.5,'p',0xe8e8e8,16,'z',{r2:.4});g.box(-.05,-.05,.2,.05,.05,1.4,'p',0x888888);}),
 amb:()=>pg(g=>{g.box(-1.1,.4,-2.6,1.1,2.6,2.6,'p',0xf0f0ec);g.box(-1.12,1.4,-2.62,1.12,1.7,2.62,'p',0xd02a2a);g.box(-1,1.6,-2.62,1,2.3,-1.6,'p',0x1a2028);for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])g.cyl(a*1.05,.4,b*1.7,.4,.25,'p',0x141414,10,'x');g.box(-.3,2.6,-.3,.3,2.75,.3,'p',0x3060ff);}),
};
export function buildProps(MAP,T){const by={};for(const p of MAP.props)(by[p.k]||(by[p.k]=[])).push(p);const group=new THREE.Group();const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new V(),pos=new V(),c=new THREE.Color(),Y=new V(0,1,0);
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.2,map:T.conc.map});const tmat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,map:T.grass.map});
 for(const k in by){const list=by[k];const geo=PROPG[k]();const im=new THREE.InstancedMesh(geo,k==='tree'?tmat:mat,list.length);list.forEach((p,i)=>{q.setFromAxisAngle(Y,p.r||0);const sc=p.s||1;s.set(sc,sc,sc);pos.set(p.x,p.y||0,p.z);m4.compose(pos,q,s);im.setMatrixAt(i,m4);c.set(p.c??0xffffff);im.setColorAt(i,c);});
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();group.add(im);}return group;}

/* ---------- transport plane ---------- */
export function makePlane(){const g=new THREE.Group();const body=new THREE.MeshStandardMaterial({color:0x6a7268,roughness:.55,metalness:.35}),dark=new THREE.MeshStandardMaterial({color:0x22262a,roughness:.4,metalness:.5}),glass=new THREE.MeshStandardMaterial({color:0x1a2a36,roughness:.05,metalness:.9});
 const M=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;g.add(o);return o;};
 M(new THREE.CylinderGeometry(2.6,2.6,30,16),body,0,0,0,Math.PI/2);M(new THREE.SphereGeometry(2.6,16,10,0,Math.PI*2,0,Math.PI/2),body,0,0,15,Math.PI/2);M(new THREE.CylinderGeometry(2.6,.8,12,16),body,0,1,-21,-Math.PI/2+.12);
 M(new THREE.BoxGeometry(44,.5,6),body,0,2,2);M(new THREE.BoxGeometry(16,.4,4),body,0,2.6,-25);M(new THREE.BoxGeometry(.5,8,5),body,0,6,-25);M(new THREE.BoxGeometry(3.4,1,1.2),glass,0,1.6,16.2,-.3);
 const props=[];for(const x of[-14,-7,7,14]){M(new THREE.CylinderGeometry(.9,1,4.4,12),dark,x,1.4,4.4,Math.PI/2);const p=new THREE.Group();p.position.set(x,1.4,6.8);g.add(p);for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.3,4.4,.08),dark);b.rotation.z=k*Math.PI/4;p.add(b);}props.push(p);}
 // open rear ramp
 M(new THREE.BoxGeometry(4.2,.3,6),dark,0,-2.2,-19,.4);const lt=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0xff3030}));lt.position.set(-22,2.2,2);g.add(lt);const lt2=lt.clone();lt2.material=new THREE.MeshBasicMaterial({color:0x30ff60});lt2.position.x=22;g.add(lt2);
 g.userData.props=props;g.scale.setScalar(1.2);return g;}

/* ---------- parachute canopy ---------- */
let CANOPY=null;
export function makeChute(col=0xd8402a){if(!CANOPY){const geo=new THREE.SphereGeometry(3.2,14,6,0,Math.PI*2,0,Math.PI*.36);geo.scale(1,.55,.75);const cc=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<geo.attributes.position.count;i++){const x=geo.attributes.position.getX(i),z=geo.attributes.position.getZ(i);const a=Math.atan2(z,x);const s=Math.floor((a+Math.PI)/(Math.PI*2)*14)%2;cc.set(s?[1,1,1]:[.85,.85,.85],i*3);}geo.setAttribute('color',new THREE.BufferAttribute(cc,3));
  const lines=[];for(let k=0;k<8;k++){const a=k/8*Math.PI*2;lines.push(0,-3.6,0,Math.cos(a)*2.9,.2,Math.sin(a)*2.1);}const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));CANOPY={geo,lg,lm:new THREE.LineBasicMaterial({color:0x222222,transparent:true,opacity:.6})};}
 const g=new THREE.Group();const m=new THREE.Mesh(CANOPY.geo,new THREE.MeshStandardMaterial({color:col,vertexColors:true,roughness:.8,side:THREE.DoubleSide}));m.position.y=4;m.castShadow=true;g.add(m);const l=new THREE.LineSegments(CANOPY.lg,CANOPY.lm);l.position.y=4;g.add(l);g.visible=false;return g;}

/* ---------- loadout / supply crate ---------- */
export function makeCrate(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x3a4a3a,roughness:.6,metalness:.3}),o=new THREE.MeshStandardMaterial({color:0xff7a1a,roughness:.5,emissive:0x401800}),d=new THREE.MeshStandardMaterial({color:0x1a1c1e,roughness:.5});
 const B=(w,h,dd,mm,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),mm);b.position.set(x,y,z);b.castShadow=true;g.add(b);return b;};B(1.6,1,1.1,m,0,.5,0);B(1.64,.14,1.14,o,0,.85,0);B(1.64,.14,1.14,o,0,.2,0);B(.2,1.04,1.14,d,-.6,.5,0);B(.2,1.04,1.14,d,.6,.5,0);
 const lid=B(1.62,.12,1.12,m,0,1.06,0);g.userData.lid=lid;return g;}

/* ---------- rover (armoured SUV) ---------- */
export function makeRover(){const g=new THREE.Group();const paint=new THREE.MeshStandardMaterial({color:0x4a5440,roughness:.55,metalness:.4}),dk=new THREE.MeshStandardMaterial({color:0x1a1c1e,roughness:.6,metalness:.3}),gl=new THREE.MeshStandardMaterial({color:0x223040,roughness:.05,metalness:.9}),lt=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff0c0,emissiveIntensity:1.5});
 const B=(w,h,d,m,x,y,z,rx=0)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.rotation.x=rx;b.castShadow=true;g.add(b);return b;};
 B(2.1,.9,4.6,paint,0,.95,0);B(1.9,.8,2.6,paint,0,1.8,-.4);B(1.92,.55,.1,gl,0,1.85,.92,-.35);B(1.94,.5,2.2,gl,0,1.85,-.45);B(2.2,.3,1,dk,0,.7,2.35);B(2.2,.3,.8,dk,0,.7,-2.35);B(.3,.18,.06,lt,-.7,1.15,2.32);B(.3,.18,.06,lt,.7,1.15,2.32);
 B(1.6,.12,1.2,dk,0,2.26,-.9);for(const s of[-1,1])B(.08,.5,3.6,dk,s*1.08,1,0);
 const wheels=[];const wg=new THREE.CylinderGeometry(.48,.48,.36,14);wg.rotateZ(Math.PI/2);for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const w=new THREE.Mesh(wg,dk);w.position.set(a*1.02,.48,b*1.5);w.castShadow=true;g.add(w);wheels.push(w);}g.userData.wheels=wheels;return g;}
