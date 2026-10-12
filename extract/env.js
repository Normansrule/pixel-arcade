// EXFIL — environment: terrain meshes, sea shader, overcast sky dome with drifting clouds, rain, grass, distant ridges.
import * as THREE from '../vendor/three.module.min.js';
import {H,WATER,shoreX} from './world.js';

const sst=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
function n2(x,z){return Math.sin(x*.071+Math.sin(z*.05))*Math.cos(z*.063-Math.sin(x*.04))*.5+.5;}
function farH(x,z){const h=H(x,z);const r=Math.max(0,-x-140,-z-120,z-110);return h+(r>0?r*.22+Math.sin(x*.02)*Math.cos(z*.025)*14*sst(0,80,r):0);}

export function buildTerrain(T,roads){const g=new THREE.Group();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,map:T.ground.map,normalMap:T.ground.normalMap,normalScale:new THREE.Vector2(.7,.7),roughness:.97,metalness:0});
 const mk=(x0,z0,x1,z1,step,inner)=>{const nx=Math.round((x1-x0)/step),nz=Math.round((z1-z0)/step);const geo=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz);geo.rotateX(-Math.PI/2);geo.translate((x0+x1)/2,0,(z0+z1)/2);
  const p=geo.attributes.position,uv=geo.attributes.uv,col=new Float32Array(p.count*3);const c=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);let h=inner?H(x,z):farH(x,z);if(!inner&&x>-152&&x<152&&z>-132&&z<122)h-=4;p.setY(i,h);uv.setXY(i,x/5,z/5);
   const e=1.5,sl=Math.hypot(H(x+e,z)-H(x-e,z),H(x,z+e)-H(x,z-e))/(2*e);const s=x-shoreX(z);const nn=n2(x,z),n3=n2(x*3.1+40,z*2.7);
   // palette: gravel / coastal grass / rock / sand / wet sand
   const gravel=[.44,.41,.37],grass=[.38+.08*n3,.42+.06*n3,.25],dry=[.52,.5,.36],rock=[.42,.41,.4],sand=[.62,.57,.46],wet=[.34,.31,.26];
   let r,gg,b;const gw=h>.4||Math.abs(x)>100||z<-60||z>78?.85:sst(.45,.7,nn)*.8;
   r=gravel[0]+(grass[0]-gravel[0])*gw;gg=gravel[1]+(grass[1]-gravel[1])*gw;b=gravel[2]+(grass[2]-gravel[2])*gw;
   const dz=sst(.55,.85,n3)*.5;r+=(dry[0]-r)*dz;gg+=(dry[1]-gg)*dz;b+=(dry[2]-b)*dz;
   const rk=sst(.35,.8,sl);r+=(rock[0]-r)*rk;gg+=(rock[1]-gg)*rk;b+=(rock[2]-b)*rk;
   const sd=sst(-14,-6,s);r+=(sand[0]-r)*sd;gg+=(sand[1]-gg)*sd;b+=(sand[2]-b)*sd;const wt=sst(-1,4,s);r+=(wet[0]-r)*wt;gg+=(wet[1]-gg)*wt;b+=(wet[2]-b)*wt;
   for(const rd of roads){if(x>rd[0]-2&&x<rd[2]+2&&z>rd[1]-2&&z<rd[3]+2){r*=.85;gg*=.85;b*=.85;}}
   c.setRGB(r,gg,b);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;m.castShadow=inner;g.add(m);return m;};
 mk(-150,-130,150,120,2,true);mk(-760,-700,760,720,12,false);return g;}

/* ---------- sea ---------- */
export function buildSea(T){const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uSky:{value:new THREE.Color(0x9aa6b0)},uDeep:{value:new THREE.Color(0x16262c)},uShal:{value:new THREE.Color(0x3c5a58)},uSun:{value:new THREE.Vector3(.3,.8,.4)},uSunC:{value:new THREE.Color(1,1,1)},uN:{value:T.water.normalMap}}]);
 const mat=new THREE.ShaderMaterial({uniforms:U,fog:true,
  vertexShader:`uniform float uT;varying vec3 vW;varying float vD;
   #include <fog_pars_vertex>
   float shore(float z){return 80.+4.*sin(z*.04)+2.5*sin(z*.11+1.);}
   void main(){vec3 p=position;vec4 w=modelMatrix*vec4(p,1.);float s=w.x-shore(w.z);float h=-3.6*smoothstep(-10.,18.,s);vD=${WATER.toFixed(2)}-h;
    float a=clamp(vD*.5,0.,1.);w.y+=(sin(w.x*.08+uT*.9)*.16+sin(w.z*.13-uT*1.3)*.1+sin((w.x+w.z)*.21+uT*1.7)*.05)*a;vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
   }`,
  fragmentShader:`uniform float uT;uniform vec3 uSky,uDeep,uShal,uSun,uSunC;uniform sampler2D uN;varying vec3 vW;varying float vD;
   #include <fog_pars_fragment>
   void main(){vec2 uv=vW.xz*.035;vec3 n1=texture2D(uN,uv+vec2(uT*.012,uT*.007)).xyz*2.-1.;vec3 n2=texture2D(uN,uv*2.3-vec2(uT*.017,-uT*.01)).xyz*2.-1.;vec3 n=normalize(vec3(n1.x+n2.x,6.,n1.y+n2.y));
    vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(n,V),0.),4.)*.85+.06;vec3 base=mix(uShal,uDeep,smoothstep(.2,3.,vD));vec3 c=mix(base,uSky,fr);
    vec3 R=reflect(-V,n);float sp=pow(max(dot(R,normalize(uSun)),0.),180.);c+=uSunC*sp*2.5;
    float foam=smoothstep(.55,.0,vD)*(.55+.45*sin(vW.z*.7+uT*2.+n1.x*3.));foam+=smoothstep(.25,.0,vD)*.5;c=mix(c,vec3(.82,.84,.82),clamp(foam,0.,.85));
    gl_FragColor=vec4(c,1.);
    #include <fog_fragment>
   }`});
 const geo=new THREE.PlaneGeometry(1600,1600,160,160);geo.rotateX(-Math.PI/2);geo.translate(500,WATER,0);const m=new THREE.Mesh(geo,mat);m.receiveShadow=false;return{mesh:m,U};}

/* ---------- sky ---------- */
export function buildSky(){const U={uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSun:{value:new THREE.Vector3(0,1,0)},uSunC:{value:new THREE.Color()},uCloud:{value:1},uT:{value:0},uFog:{value:new THREE.Color()}};
 const mat=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunC,uFog;uniform float uCloud,uT;varying vec3 vD;
   float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.03;a*=.5;}return s;}
   void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uTop,smoothstep(0.,.55,y));
    vec2 cp=d.xz/(max(y,.04)+.15)*1.4+vec2(uT*.01,uT*.004);float cl=fbm(cp)*.85+fbm(cp*3.1)*.3;float cov=smoothstep(.62-uCloud*.32,1.05,cl);
    vec3 cc=mix(uHor*1.05,uTop*.75+uHor*.2,smoothstep(.4,1.,cl));c=mix(c,cc,cov*smoothstep(-.02,.15,y));
    float sd=max(dot(d,normalize(uSun)),0.);c+=uSunC*(pow(sd,8.)*.25+pow(sd,90.)*.9)*(1.-cov*.75);
    c=mix(uFog,c,smoothstep(-.05,.22,y));gl_FragColor=vec4(c,1.);}`});
 const m=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),mat);m.renderOrder=-1;m.frustumCulled=false;return{mesh:m,U};}

/* ---------- rain ---------- */
export function buildRain(n=4000){const p=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(Math.random()-.5)*50,y=Math.random()*24,z=(Math.random()-.5)*50;p.set([x,y,z,x+.05,y+.55,z+.02],i*6);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));const U={uT:{value:0},uC:{value:new THREE.Vector3()}};
 const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
  vertexShader:`uniform float uT;uniform vec3 uC;varying float vA;void main(){vec3 p=position;p.y=mod(p.y-uT*14.,24.)-8.;p.x=mod(p.x-uC.x+25.,50.)-25.+uC.x;p.z=mod(p.z-uC.z+25.,50.)-25.+uC.z;p.y+=uC.y;p.x+=uT*.6;vA=.18;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying float vA;void main(){gl_FragColor=vec4(.75,.8,.85,vA);}`});
 const m=new THREE.LineSegments(geo,mat);m.frustumCulled=false;return{mesh:m,U};}

/* ---------- grass tufts (instanced crossed quads) ---------- */
export function buildGrass(world,count,roads,foot){const cv=document.createElement('canvas');cv.width=64;cv.height=64;const x=cv.getContext('2d');
 for(let i=0;i<26;i++){const bx=6+Math.random()*52,h=24+Math.random()*38,lean=(Math.random()-.5)*16;x.strokeStyle=`rgba(${150+Math.random()*60|0},${150+Math.random()*50|0},${80+Math.random()*30|0},1)`;x.lineWidth=2+Math.random()*2;x.beginPath();x.moveTo(bx,64);x.quadraticCurveTo(bx+lean*.3,64-h*.6,bx+lean,64-h);x.stroke();}
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const g1=new THREE.PlaneGeometry(1,1);g1.translate(0,.5,0);const g2=g1.clone().rotateY(Math.PI/2);const pos=[...g1.attributes.position.array,...g2.attributes.position.array],uv=[...g1.attributes.uv.array,...g2.attributes.uv.array],idx=[...g1.index.array,...g2.index.array.map(i=>i+4)];
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const nn=geo.attributes.normal;for(let i=0;i<nn.count;i++)nn.setXYZ(i,0,1,0);
 const mat=new THREE.MeshStandardMaterial({map:tex,alphaTest:.5,side:THREE.DoubleSide,color:0x8a8c5a,roughness:1});
 const im=new THREE.InstancedMesh(geo,mat,count);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),c=new THREE.Color();let k=0;
 for(let t=0;t<count*6&&k<count;t++){const px=-120+Math.random()*235,pz=-108+Math.random()*204;const h=H(px,pz);if(h<.05&&n2(px,pz)<.5&&Math.abs(px)<100&&pz>-60&&pz<78)continue;if(px>shoreX(pz)-12)continue;
  let bad=false;for(const r of roads)if(px>r[0]-1&&px<r[2]+1&&pz>r[1]-1&&pz<r[3]+1){bad=true;break;}if(bad)continue;for(const f of foot)if(px>f[0]-1&&px<f[2]+1&&pz>f[1]-1&&pz<f[3]+1){bad=true;break;}if(bad)continue;
  if(world.groundAt(px,pz,h+3,.3)>h+.05)continue;const sc=.5+Math.random()*.7;q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*3);s.set(sc*1.2,sc,sc*1.2);p.set(px,h-.03,pz);m4.compose(p,q,s);im.setMatrixAt(k,m4);c.setHSL(.15+Math.random()*.05,.35,.45+Math.random()*.2);im.setColorAt(k,c);k++;}
 im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.receiveShadow=true;return im;}
