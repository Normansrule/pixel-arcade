// NEON BAY — sky, sun/moon, time of day, fog, water, rain, reflections env map.
import {THREE,cl,sstep,keyed,lerp} from './util.js';
import {WL} from './world.js';
const C=h=>new THREE.Color(h);
// hour, top, horizon, sun colour, sun intensity, hemi intensity, fog colour, exposure
const PAL=[[0,'#03050e','#141a34','#7f93ff',0.198,0.225,'#0e1226',1.159],[4.8,'#060a20','#2a2448','#8090ff',0.186,0.225,'#1c1a34',1.14],[6,'#24346c','#ff9070','#ffa060',0.558,0.413,'#b08080',0.997],[7.4,'#3f78cc','#ffd2a6','#ffd2a0',1.488,0.637,'#c4c8d2',0.874],
 [10,'#2a68d4','#a6d0ff','#fff1de',1.922,0.75,'#b4cce6',0.817],[15.5,'#2b66cc','#b0d2f6','#fff0dc',1.86,0.75,'#b8cce0',0.817],[17.6,'#3462b8','#ffc890','#ffc488',1.55,0.637,'#e2bea0',0.855],[18.6,'#383685','#ff6c52','#ff7440',0.93,0.465,'#cc7c6e',0.931],
 [19.35,'#251c58','#ff4a86','#ff5a5c',0.341,0.338,'#80487a',1.026],[20.4,'#0b0d2c','#3e2464','#8a8cff',0.198,0.24,'#241c44',1.14],[24,'#03050e','#141a34','#7f93ff',0.198,0.225,'#0e1226',1.159]];
const cache={};function col(hex){return cache[hex]||(cache[hex]=C(hex));}
export function palette(hour,rain){let a=PAL[0],b=PAL[1];for(let i=1;i<PAL.length;i++){if(hour<=PAL[i][0]){a=PAL[i-1];b=PAL[i];break;}}const f=(hour-a[0])/(b[0]-a[0]||1);
 const mixC=(i)=>col(a[i]).clone().lerp(col(b[i]),f);const p={top:mixC(1),hor:mixC(2),sun:mixC(3),sunI:lerp(a[4],b[4],f),hemi:lerp(a[5],b[5],f),fog:mixC(6),exp:lerp(a[7],b[7],f)};
 // rain: desaturate and darken
 if(rain>0){const g=new THREE.Color(.36,.38,.42);const night=nightOf(hour);g.multiplyScalar(1-night*.75);p.top.lerp(g,rain*.8);p.hor.lerp(g.clone().multiplyScalar(1.15),rain*.75);p.fog.lerp(g,rain*.8);p.sunI*=1-rain*.7;p.hemi*=1-rain*.15;}
 return p;}
export function nightOf(h){return h<5.6||h>20.2?1:h<7?1-sstep(5.6,7,h):h>18.2?sstep(18.2,20.2,h):0;}
export function sunDir(h,o=new THREE.Vector3()){const t=(h-6)/12*Math.PI;return o.set(Math.cos(t),Math.sin(t)*.95,.42).normalize();}
export function moonDir(h,o=new THREE.Vector3()){const t=((h+12)%24-6)/12*Math.PI;return o.set(Math.cos(t)*.8,Math.max(.25,Math.sin(t)*.9),-.35).normalize();}

const NOISE=`float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}`;

export class Env{
 constructor(R,scene,world,U){this.R=R;this.scene=scene;this.w=world;this.U=U;this.hour=8;this.rain=0;this.sunV=new THREE.Vector3();this.moonV=new THREE.Vector3();
  this.SU={uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSunDir:{value:new THREE.Vector3(0,1,0)},uSunCol:{value:new THREE.Color()},uMoonDir:{value:new THREE.Vector3()},uNight:U.uNight,uTime:U.uTime,uCloud:{value:.35},uRain:U.uRain};
  this.sky=new THREE.Mesh(new THREE.SphereGeometry(2000,48,24),new THREE.ShaderMaterial({uniforms:this.SU,side:THREE.BackSide,depthWrite:false,fog:false,
   vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
   fragmentShader:`uniform vec3 uTop,uHor,uSunDir,uSunCol,uMoonDir;uniform float uNight,uTime,uCloud,uRain;varying vec3 vD;${NOISE}
   float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(uHor,uTop,pow(clamp(h,0.,1.),.42));if(h<0.)c=mix(uHor*.85,uHor*.3,clamp(-h*5.,0.,1.));
    float sd=max(dot(d,uSunDir),0.);float day=1.-uNight;c+=uSunCol*(pow(sd,5.)*.28+pow(sd,48.)*.5)*day*(1.-uRain*.7);c+=uSunCol*.3*pow(sd,2.)*exp(-abs(h)*7.)*day;
    c+=uSunCol*10.*smoothstep(.99935,.9997,sd)*(1.-uRain)*step(-.02,h);
    float md=dot(d,uMoonDir);c+=vec3(1.,.96,.88)*(smoothstep(.99905,.9993,md)*2.2+pow(max(md,0.),60.)*.12)*uNight*(1.-uRain*.8);
    if(uNight>0.01&&h>0.){vec3 sp=floor(d*260.);float s=h3(sp);float st=step(.9978,s)*(.55+.45*sin(uTime*2.+s*90.));c+=vec3(.9,.95,1.)*st*uNight*smoothstep(0.,.3,h)*(1.-uCloud)*1.6;}
    if(h>-.02){vec2 uv=d.xz/(max(h,0.)+.18)*1.15+vec2(uTime*.006,uTime*.002);float n=fbm(uv*1.4);float cov=mix(.62,.25,uCloud);float cl=smoothstep(cov,cov+.28,n)*smoothstep(-.02,.18,h);
     vec3 lit=mix(vec3(1.),uSunCol*1.2+.2,.55)*(.55+.45*day);vec3 shade=mix(uHor*.7,vec3(.25,.26,.3),uRain);vec3 cc=mix(shade,lit,smoothstep(.0,.6,n-cov+.3)*(1.-uRain*.7));cc=mix(cc,cc*vec3(.18,.18,.28)+uHor*.15,uNight);
     cc+=uSunCol*pow(sd,6.)*.6*day;c=mix(c,cc,cl*.92);}
    gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));this.sky.frustumCulled=false;this.sky.renderOrder=-10;scene.add(this.sky);
  // lights
  this.hemiL=new THREE.HemisphereLight(0xbfd8ff,0x5a4a3a,.9);scene.add(this.hemiL);
  this.sun=new THREE.DirectionalLight(0xffffff,3);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);const sc=this.sun.shadow.camera;sc.left=-95;sc.right=95;sc.top=95;sc.bottom=-95;sc.near=10;sc.far=520;this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.06;scene.add(this.sun,this.sun.target);
  scene.fog=new THREE.Fog(0x9ab0c8,260,1300);
  this.buildWater();this.buildRain();this.pmrem=new THREE.PMREMGenerator(R);this.envScene=this.makeEnvScene();this.envKey='';this.envRT=null;}
 makeEnvScene(){const s=new THREE.Scene();this.EU={uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSunDir:{value:new THREE.Vector3()},uSunCol:{value:new THREE.Color()},uNight:{value:0}};
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40,32,16),new THREE.ShaderMaterial({uniforms:this.EU,side:THREE.BackSide,vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`uniform vec3 uTop,uHor,uSunDir,uSunCol;uniform float uNight;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(uHor,uTop,pow(clamp(h,0.,1.),.5));if(h<0.)c=mix(uHor*.5,vec3(.06,.055,.05),clamp(-h*3.,0.,1.));
    c+=uSunCol*pow(max(dot(d,uSunDir),0.),24.)*3.*(1.-uNight);
    float band=smoothstep(.0,.04,h)*smoothstep(.22,.05,h);float stripes=.5+.5*sin(atan(d.z,d.x)*5.);c+=mix(vec3(1.,.35,.75),vec3(.25,.9,1.),stripes)*band*uNight*1.4;gl_FragColor=vec4(c,1.);}`})));return s;}
 updateEnv(force){const key=Math.round(this.hour*3)+'_'+Math.round(this.rain*4);if(!force&&key===this.envKey)return;this.envKey=key;const p=this.pal;this.EU.uTop.value.copy(p.top);this.EU.uHor.value.copy(p.hor);this.EU.uSunDir.value.copy(this.sunV);this.EU.uSunCol.value.copy(p.sun).multiplyScalar(Math.min(1.5,p.sunI*.5));this.EU.uNight.value=this.U.uNight.value;
  const rt=this.pmrem.fromScene(this.envScene,.02);if(this.envRT)this.envRT.dispose();this.envRT=rt;this.scene.environment=rt.texture;}
 buildWater(){const w=this.w;// terrain height texture for depth/foam
  const X0=-900,Z0=-860,X1=1100,Z1=1100,N=256,data=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=X0+(X1-X0)*i/(N-1),z=Z0+(Z1-Z0)*j/(N-1);const h=w.terrainH(x,z);const v=cl((h+12)/16,0,1)*255|0;data[(j*N+i)*4]=v;data[(j*N+i)*4+3]=255;}
  const ht=new THREE.DataTexture(data,N,N,THREE.RGBAFormat);ht.magFilter=ht.minFilter=THREE.LinearFilter;ht.needsUpdate=true;
  this.WU={uTime:this.U.uTime,uSunDir:this.SU.uSunDir,uSunCol:this.SU.uSunCol,uTop:this.SU.uTop,uHor:this.SU.uHor,uNight:this.U.uNight,uRain:this.U.uRain,uH:{value:ht},uHB:{value:new THREE.Vector4(X0,Z0,X1-X0,Z1-Z0)},uFog:{value:new THREE.Color()},uFogN:{value:200},uFogF:{value:1200},uWL:{value:WL}};
  const g=new THREE.PlaneGeometry(4200,4200,1,1);g.rotateX(-Math.PI/2);
  this.water=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:this.WU,transparent:true,depthWrite:false,
   vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float uTime,uNight,uRain,uFogN,uFogF,uWL;uniform vec3 uSunDir,uSunCol,uTop,uHor,uFog;uniform sampler2D uH;uniform vec4 uHB;varying vec3 vW;${NOISE}
   vec2 wv(vec2 p,vec2 d,float f,float a,float s){float ph=dot(p,d)*f+uTime*s;return d*cos(ph)*a*f;}
   void main(){vec2 p=vW.xz;vec2 g=wv(p,normalize(vec2(1.,.6)),.06,.35,1.1)+wv(p,normalize(vec2(-.4,1.)),.11,.18,1.6)+wv(p,normalize(vec2(.8,-.3)),.23,.08,2.3)+wv(p,normalize(vec2(-1.,-.2)),.41,.035,3.1);
    g+=(vec2(vn(p*.35+uTime*.3),vn(p*.35-uTime*.25+7.))-.5)*.22;g*=1.+uRain*.6;vec3 n=normalize(vec3(-g.x,1.,-g.y));
    vec3 v=normalize(cameraPosition-vW);float dist=length(cameraPosition-vW);n=normalize(mix(n,vec3(0,1,0),smoothstep(150.,900.,dist)*.7));
    float fr=.03+.97*pow(1.-max(dot(n,v),0.),5.);vec3 r=reflect(-v,n);r.y=abs(r.y);vec3 sky=mix(uHor,uTop,pow(clamp(r.y,0.,1.),.5));
    float sd=max(dot(r,uSunDir),0.);float spec=(pow(sd,420.)*6.+pow(sd,24.)*.25)*(1.-uNight)*(1.-uRain*.8);
    float th=texture2D(uH,(p-uHB.xy)/uHB.zw).r*16.-12.;float depth=max(0.,uWL-th);
    float day=1.-uNight*.85;vec3 shallow=vec3(.12,.72,.68),deep=vec3(.02,.16,.27);vec3 wc=mix(shallow,deep,smoothstep(0.,8.,depth))*(.25+.75*day)*mix(1.,.6,uRain);
    vec3 c=mix(wc,sky,fr*.85)+uSunCol*spec;
    float fo=smoothstep(.9,.0,depth)*(.55+.45*sin(uTime*1.7-depth*9.+vn(p*.6)*5.));c=mix(c,vec3(.92,.95,.95)*(.3+.7*day),fo*.65);
    c+=vec3(1.,.42,.75)*uNight*.08*fr+vec3(.2,.6,1.)*uNight*.03;
    float a=clamp(smoothstep(0.,1.6,depth)*.7+.3+fr*.3+fo*.4,0.,1.);
    float fg=smoothstep(uFogN,uFogF,dist);c=mix(c,uFog,fg);gl_FragColor=vec4(c,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));this.water.position.y=WL;this.water.position.set(100,WL,200);this.water.renderOrder=1;this.water.frustumCulled=false;this.scene.add(this.water);}
 buildRain(){const N=7000,pos=new Float32Array(N*6),R=Math.random;for(let i=0;i<N;i++){const x=R(),y=R(),z=R();pos.set([x,y,z,x,y,z],i*6);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const end=new Float32Array(N*2);for(let i=0;i<N;i++){end[i*2+1]=1;}g.setAttribute('aE',new THREE.BufferAttribute(end,1));
  this.RU={uTime:this.U.uTime,uRain:this.U.uRain,uCam:{value:new THREE.Vector3()},uVel:{value:new THREE.Vector3()}};
  this.rainM=new THREE.LineSegments(g,new THREE.ShaderMaterial({uniforms:this.RU,transparent:true,depthWrite:false,
   vertexShader:`attribute float aE;uniform float uTime,uRain;uniform vec3 uCam,uVel;varying float vA;void main(){vec3 S=vec3(60.,36.,60.);vec3 p=position;p.y=fract(p.y-uTime*.75-p.x*3.1);
    vec3 w=uCam+(fract(p+vec3(-uCam.x/S.x,0.,-uCam.z/S.z))-.5)*S;w.y=uCam.y+(p.y-.5)*S.y;vec3 fall=vec3(1.5,-22.,.8)-uVel*.35;w+=normalize(fall)*aE*.9*(.6+.4*fract(p.x*91.));
    vA=uRain*(.18+.25*fract(p.z*37.))*(1.-aE*.6)*step(fract(p.x*13.7),uRain*1.2);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
   fragmentShader:'varying float vA;void main(){gl_FragColor=vec4(vec3(.75,.8,.9),vA);}'}));this.rainM.frustumCulled=false;this.rainM.visible=false;this.scene.add(this.rainM);}
 // per frame: hour (0-24), rain (0-1), focus point for shadows, camera
 update(dt,hour,rain,focus,cam,q){this.hour=hour;this.rain=rain;const U=this.U;U.uNight.value=nightOf(hour);U.uRain.value=rain;const p=this.pal=palette(hour,rain);
  sunDir(hour,this.sunV);moonDir(hour,this.moonV);const SU=this.SU;SU.uTop.value.copy(p.top);SU.uHor.value.copy(p.hor);SU.uSunDir.value.copy(this.sunV);SU.uSunCol.value.copy(p.sun);SU.uMoonDir.value.copy(this.moonV);SU.uCloud.value=cl(.3+rain*.7,0,1);
  this.sky.position.copy(cam.position);
  const sunUp=this.sunV.y>-.04;const L=sunUp?this.sunV:this.moonV;const fade=sunUp?sstep(-.04,.08,this.sunV.y):1;
  this.sun.color.copy(sunUp?p.sun:new THREE.Color(.55,.62,1));this.sun.intensity=sunUp?p.sunI*fade:.38*(1-rain*.6);
  this.sun.position.set(focus.x+L.x*260,focus.y+L.y*260,focus.z+L.z*260);this.sun.target.position.copy(focus);
  // stabilise shadow map against shimmering: snap to texel grid
  const sc=this.sun.shadow.camera,tex=(sc.right-sc.left)/this.sun.shadow.mapSize.x;this.sun.target.updateMatrixWorld();
  this.hemiL.color.copy(p.top).lerp(p.hor,.5).lerp(new THREE.Color(1,1,1),.35);this.hemiL.groundColor.set(0x6a5a48).multiplyScalar(.5+.5*(1-U.uNight.value));this.hemiL.intensity=p.hemi*1.05;
  const f=this.scene.fog;f.color.copy(p.fog);const near=lerp(260,90,rain),far=lerp(1300,520,rain)*(1-U.uNight.value*.18);f.near=near;f.far=far;
  this.WU.uFog.value.copy(p.fog);this.WU.uFogN.value=near;this.WU.uFogF.value=far;
  this.rainM.visible=rain>.02;this.RU.uCam.value.copy(cam.position);
  this.updateEnv(false);}}
