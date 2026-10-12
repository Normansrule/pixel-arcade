// SIDEWAYS — world building for the four venues: road ribbons, guardrails, barriers, terrain, city, harbour, circuit dressing,
// lamps (pooled real lights + glow decals), skies, environment maps.
import * as THREE from '../vendor/three.module.min.js';
import {sampleTrack,clipPoints,lotLayout,nearestGlobal,frame} from './trackdata.js';
import {ctex,merge,M4,cl,lerp,smooth,fbm,seeded,vnoise} from './util.js';
import {Mirror,reflective} from './fx.js';
const V=THREE.Vector3;

const TIMES={
 night:{fog:0x070b16,fogD:.0042,amb:[0x3a4a78,0x0c0c10,.32],sun:[0x9ab0ff,.55],sunPos:[-160,220,120],exposure:1.05,smokeAmb:[.07,.08,.12],sky:'night',lampCol:0xffa04a,headI:1,wet:.22},
 rain:{fog:0x141a22,fogD:.0075,amb:[0x5a6a80,0x101214,.42],sun:[0xa8b8d0,.3],sunPos:[120,200,-80],exposure:1.1,smokeAmb:[.12,.13,.15],sky:'rain',lampCol:0xffb060,headI:1,wet:1},
 sunset:{fog:0xd08a60,fogD:.0019,amb:[0xffb080,0x3a2a2a,.75],sun:[0xffa060,2.4],sunPos:[-420,70,-260],exposure:.92,smokeAmb:[.62,.48,.42],sky:'sunset',lampCol:0xffd8a0,headI:.35,wet:0}};

/* ---------- skies ---------- */
function skyMesh(kind){const U={uK:{value:kind==='night'?0:kind==='rain'?1:2},uSun:{value:new V(-420,70,-260).normalize()}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(2600,40,20),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform int uK;uniform vec3 uSun;varying vec3 vP;
   float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
   void main(){vec3 d=normalize(vP);float h=d.y;vec3 c;
    if(uK==0){c=mix(vec3(.05,.06,.1),vec3(.006,.01,.03),smoothstep(0.,.5,h));c+=vec3(.22,.12,.06)*exp(-max(h+.02,0.)*14.)*smoothstep(.3,-.6,d.x);// city glow to the west
     float cl=n2(d.xz/(h+.25)*3.)*n2(d.xz/(h+.25)*7.);c+=vec3(.03,.035,.05)*smoothstep(.35,.7,cl)*smoothstep(0.,.3,h);}
    else if(uK==1){c=mix(vec3(.11,.13,.16),vec3(.04,.05,.07),smoothstep(-.05,.6,h));float cl=n2(d.xz/(h+.3)*2.5+3.)*.6+n2(d.xz/(h+.3)*6.)*.4;c=mix(c,vec3(.15,.16,.19),smoothstep(.4,.8,cl)*smoothstep(-.1,.4,h)*.6);c+=vec3(.12,.08,.04)*exp(-max(h,0.)*10.);}
    else{float sd=max(dot(d,uSun),0.);vec3 top=vec3(.12,.2,.42),mid=vec3(.98,.5,.26),low=vec3(1.,.72,.42);c=mix(low,mid,smoothstep(-.02,.12,h));c=mix(c,top,smoothstep(.1,.6,h));
     c+=vec3(1.,.55,.25)*pow(sd,8.)*.8+vec3(1.,.8,.5)*pow(sd,600.)*20.;float cl=n2(vec2(atan(d.x,d.z)*6.,h*28.))*n2(vec2(atan(d.x,d.z)*13.,h*50.));
     c=mix(c,mix(vec3(.5,.22,.25),vec3(1.,.6,.4),pow(sd,3.)),smoothstep(.3,.6,cl)*smoothstep(.02,.08,h)*smoothstep(.35,.12,h)*.8);if(h<0.)c=mix(c,vec3(.35,.22,.2),smoothstep(0.,-.1,h));}
    gl_FragColor=vec4(c,1.);}`}));m.renderOrder=-10;m.frustumCulled=false;return m;}
function stars(n=1800){const p=[];const r=seeded(7);for(let i=0;i<n;i++){const a=r()*6.283,e=Math.asin(.06+r()*.94),R=2400;p.push(Math.cos(a)*Math.cos(e)*R,Math.sin(e)*R,Math.sin(a)*Math.cos(e)*R);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xcfd8ff,size:1.5,sizeAttenuation:false,fog:false,transparent:true,opacity:.85}));}
function moon(){const t=ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.36,'rgba(240,244,255,1)');g.addColorStop(.42,'rgba(160,180,255,.25)');g.addColorStop(1,'rgba(80,100,200,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,color:new THREE.Color(2.2,2.2,2.4),fog:false,depthWrite:false}));s.scale.set(260,260,1);s.position.set(-900,1300,700);return s;}

/* ---------- environment map for paint reflections ---------- */
function envMap(R,time,lampCol){const s=new THREE.Scene();s.add(skyMesh(time.sky));
 const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(lampCol).multiplyScalar(time.sky==='sunset'?1:6),side:THREE.DoubleSide});
 for(let i=0;i<10;i++){const a=i/10*6.283,m=new THREE.Mesh(new THREE.PlaneGeometry(40,14),lm);m.position.set(Math.cos(a)*300,90+i%3*30,Math.sin(a)*300);m.lookAt(0,0,0);s.add(m);}
 if(time.sky==='sunset'){const sun=new THREE.Mesh(new THREE.SphereGeometry(120,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(30,14,6)}));sun.position.set(-1500,250,-900);s.add(sun);}
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshBasicMaterial({color:time.sky==='sunset'?0x3a2a22:0x0a0b0e}));fl.rotation.x=-Math.PI/2;fl.position.y=-5;s.add(fl);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03,1,5000);pm.dispose();return rt.texture;}

/* ---------- textures ---------- */
function asphaltTex(kind){const W=512,H=1024,r=seeded(kind.length*97+3);
 const map=ctex(W,H,(x)=>{x.fillStyle=kind==='docks'?'#3a3b3d':kind==='ring'?'#2c2c2e':'#2a2a2c';x.fillRect(0,0,W,H);
  const id=x.getImageData(0,0,W,H),d=id.data;for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=(j*W+i)*4,n=(fbm(i/40,j/40,4)-.5)*30+(r()-.5)*26;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(id,0,0);
  // patches + cracks
  for(let i=0;i<14;i++){x.fillStyle=`rgba(${r()<.5?0:60},${r()<.5?0:60},${r()<.5?0:60},${.06+r()*.08})`;x.fillRect(r()*W,r()*H,40+r()*160,30+r()*200);}
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.2;for(let i=0;i<26;i++){let px=r()*W,py=r()*H;x.beginPath();x.moveTo(px,py);for(let k=0;k<8;k++){px+=(r()-.5)*40;py+=(r()-.5)*40;x.lineTo(px,py);}x.stroke();}
  if(kind==='pass'){x.fillStyle='rgba(236,236,226,.88)';x.fillRect(10,0,9,H);x.fillRect(W-19,0,9,H);x.fillStyle='rgba(240,190,40,.9)';for(let j=0;j<H;j+=128){x.fillRect(W/2-12,j,8,72);x.fillRect(W/2+4,j,8,72);}}
  if(kind==='docks'){x.fillStyle='rgba(230,190,40,.75)';x.fillRect(16,0,12,H);x.fillRect(W-28,0,12,H);x.fillStyle='rgba(220,220,220,.5)';for(let j=0;j<H;j+=256)x.fillRect(W/2-5,j,10,130);}
  if(kind==='ring'){for(let i=0;i<40;i++){x.fillStyle=`rgba(0,0,0,${.05+r()*.1})`;const cx=W*.3+r()*W*.4;x.fillRect(cx,0,8+r()*20,H);}x.fillStyle='rgba(240,240,240,.85)';x.fillRect(6,0,10,H);x.fillRect(W-16,0,10,H);}
 });
 const rough=ctex(W,H,(x)=>{x.fillStyle=kind==='docks'?'#7a7a7a':'#c8c8c8';x.fillRect(0,0,W,H);
  if(kind==='docks'||kind==='lot'){for(let i=0;i<70;i++){const cx=r()*W,cy=r()*H,rr=20+r()*90;const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);g.addColorStop(0,'rgba(10,10,10,.95)');g.addColorStop(.7,'rgba(20,20,20,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.save();x.translate(cx,cy);x.scale(1,1.8);x.translate(-cx,-cy);x.fillRect(cx-rr,cy-rr,rr*2,rr*2);x.restore();}}
  const id=x.getImageData(0,0,W,H),d=id.data;for(let k=0;k<d.length;k+=4){const n=(r()-.5)*30;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(id,0,0);},{srgb:false});
 return{map,rough};}
function noiseTex(c1,c2,scale=40,size=256){return ctex(size,size,(x,w,h)=>{const id=x.createImageData(w,h),d=id.data,a=new THREE.Color(c1),b=new THREE.Color(c2);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const t=fbm(i/scale,j/scale,5);const k=(j*w+i)*4;d[k]=(a.r+(b.r-a.r)*t)*255;d[k+1]=(a.g+(b.g-a.g)*t)*255;d[k+2]=(a.b+(b.b-a.b)*t)*255;d[k+3]=255;}x.putImageData(id,0,0);});}

/* ---------- ribbon helpers ---------- */
// sweep a profile [{o (metres past the wall line or offset), y, v}] along one side of the track. base: 'wall' (wl/wr) | 'edge' (hw) | 'centre'
function sweep(B,side,prof,base='wall',every=1,opt={}){const pos=[],uv=[],idx=[],n=B.n,nP=prof.length;let rows=0;
 for(let i=0;i<=n;i+=every){const k=i%n,b=base==='wall'?(side>0?B.wl[k]:B.wr[k]):base==='edge'?B.hw[k]:0;
  for(const q of prof){const lat=side*(b+q.o);pos.push(B.x[k]+B.nx[k]*lat,B.y[k]+q.y,B.z[k]+B.nz[k]*lat);const uu=(i===n?B.len:B.s[k])/(opt.uScale||4);uv.push(opt.flip&&side<0?-uu:uu,q.v);}rows++;}
 for(let i=0;i<rows-1;i++)for(let j=0;j<nP-1;j++){const a=i*nP+j,b=a+nP;if(opt.skip&&opt.skip(i*every%n))continue;side>0?idx.push(a,a+1,b,a+1,b+1,b):idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function roadGeo(B,lo,hi,uDiv){// strip from lateral lo(i) to hi(i) (functions), u across 0..1, v = s/uDiv
 const pos=[],uv=[],idx=[],n=B.n;for(let i=0;i<=n;i++){const k=i%n,s=i===n?B.len:B.s[k];for(const[f,u]of[[lo,0],[hi,1]]){const lat=f(k);pos.push(B.x[k]+B.nx[k]*lat,B.y[k]+.002,B.z[k]+B.nz[k]*lat);uv.push(u,s/uDiv);}}
 for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function inside(B,x,z){let c=false;for(let i=0,j=B.n-1;i<B.n;j=i++){if((B.z[i]>z)!==(B.z[j]>z)&&x<(B.x[j]-B.x[i])*(z-B.z[i])/(B.z[j]-B.z[i])+B.x[i])c=!c;}return c;}

/* ---------- lamps ---------- */
function lampHeads(list,col,group){if(!list.length)return;const g=new THREE.SphereGeometry(.42,10,6);g.scale(1.6,.45,1);
 const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(5.5),fog:true}),list.length);const M=new THREE.Matrix4();
 list.forEach((l,i)=>{M.makeTranslation(l.x,l.y,l.z);m.setMatrixAt(i,M);});group.add(m);
 // soft glow pools on the ground under each lamp
 const t=ctex(128,128,(x,w,h)=>{const gg=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gg.addColorStop(0,'rgba(255,255,255,.9)');gg.addColorStop(.45,'rgba(255,255,255,.32)');gg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gg;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});
 const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const pm=new THREE.InstancedMesh(pg,new THREE.MeshBasicMaterial({map:t,color:new THREE.Color(col).multiplyScalar(.22),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}),list.length);
 list.forEach((l,i)=>{M.compose(new V(l.gx??l.x,(l.gy??0)+.05,l.gz??l.z),new THREE.Quaternion(),new V(l.pool||22,1,l.pool||22));pm.setMatrixAt(i,M);});pm.renderOrder=2;group.add(pm);}

/* ================= public: build a venue ================= */
export function buildWorld(R,def,q=2){const time=TIMES[def.time]||TIMES.night,group=new THREE.Group(),out={def,group,time,lamps:[],clips:[],hideRefl:[],mirror:null,update:null,colliders:null};
 const lampCol=time.lampCol;
 group.add(skyMesh(time.sky));if(time.sky==='night'){group.add(stars());group.add(moon());}if(time.sky==='rain'){const s=stars(300);s.material.opacity=.15;group.add(s);}
 out.env=envMap(R,time,lampCol);
 out.fog=new THREE.FogExp2(time.fog,time.fogD);
 const hemi=new THREE.HemisphereLight(time.amb[0],time.amb[1],time.amb[2]);group.add(hemi);
 const sun=new THREE.DirectionalLight(time.sun[0],time.sun[1]);sun.position.set(...time.sunPos);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:10,far:900});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;group.add(sun,sun.target);out.sun=sun;out.sunOff=new V(...time.sunPos).normalize().multiplyScalar(400);
 if(def.ribbon)buildRibbon(R,def,out,time,q);else buildLot(R,def,out,time,q);
 // pooled real point lights placed at the lamps nearest the camera
 out.pool=[];for(let i=0;i<6;i++){const l=new THREE.SpotLight(lampCol,0,52,1.1,.75,2);group.add(l,l.target);out.pool.push(l);}
 out.lampTimer=0;return out;}

export function updateLamps(W,focus,dt,force){W.lampTimer-=dt;if(W.lampTimer>0&&!force)return;W.lampTimer=.3;
 const L=W.lamps;if(!L.length){W.pool.forEach(l=>l.intensity=0);return;}
 const sorted=L.map((l,i)=>[(l.x-focus.x)**2+(l.z-focus.z)**2,i]).sort((a,b)=>a[0]-b[0]);
 W.pool.forEach((pl,k)=>{const e=sorted[k];if(!e||e[0]>120*120){pl.intensity=0;return;}const l=L[e[1]];pl.position.set(l.x,l.y-.3,l.z);pl.target.position.set(l.gx??l.x,(l.gy??0),l.gz??l.z);pl.intensity=(l.I||300)*.3;pl.color.set(l.col||W.time.lampCol);});
 W.nearLamps=sorted.slice(0,8).map(e=>L[e[1]]);}

/* ---------- ribbon venues ---------- */
function buildRibbon(R,def,out,time,q){const B=sampleTrack(def),g=out.group;out.B=B;out.clips=clipPoints(B);
 const kind=def.id,tex=asphaltTex(kind);tex.map.repeat.set(1,1);
 const flat=kind==='docks';
 const roadM=new THREE.MeshStandardMaterial({map:tex.map,roughnessMap:tex.rough,roughness:kind==='docks'?.55:kind==='ring'?.9:.82,metalness:0,envMapIntensity:kind==='docks'?1.3:.5});
 if(flat){out.mirror=new Mirror(.5);reflective(roadM,out.mirror.U,'road'+kind);out.mirror.U.uReflStr.value=kind==='docks'?.9:.18;}
 const road=new THREE.Mesh(roadGeo(B,k=>-B.hw[k],k=>B.hw[k],18),roadM);road.receiveShadow=true;g.add(road);out.hideRefl.push(road);out.road=road;
 // shoulders
 const shM=new THREE.MeshStandardMaterial({map:kind==='ring'?noiseTex('#2f4a22','#4a6a2a',22):noiseTex('#2c2b29','#4a4640',18),roughness:.95,envMapIntensity:.3});shM.map.repeat.set(1,6);
 if(flat&&kind==='docks')reflective(shM,out.mirror.U,'sh');
 for(const s of[-1,1]){const sg=roadGeo(B,s>0?k=>B.hw[k]:k=>-B.wr[k]-(kind==='ring'?0:.3),s>0?k=>B.wl[k]+(kind==='ring'?0:.3):k=>-B.hw[k],8);sg.translate(0,-.01,0);const m=new THREE.Mesh(sg,shM);m.receiveShadow=true;g.add(m);out.hideRefl.push(m);}
 // start/finish gantry line
 {const k=0,lat=B.hw[k];const sl=new THREE.Mesh(new THREE.PlaneGeometry(lat*2,1.2),new THREE.MeshStandardMaterial({map:ctex(256,32,(x,w,h)=>{for(let i=0;i<16;i++)for(let j=0;j<2;j++){x.fillStyle=(i+j)%2?'#eee':'#111';x.fillRect(i*16,j*16,16,16);}}),roughness:.7}));
  sl.rotation.x=-Math.PI/2;sl.rotation.z=Math.atan2(B.tx[k],B.tz[k]);sl.position.set(B.x[k],B.y[k]+.02,B.z[k]);g.add(sl);}
 const rr=seeded(def.id.length*31+5);
 if(kind==='pass')dressPass(R,B,out,time,q,rr);else if(kind==='docks')dressDocks(R,B,out,time,q,rr);else dressRing(R,B,out,time,q,rr);
 // clipping-point markers (glowing posts + painted zones)
 const cm=new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,.55,.12)}),zone=[],posts=[];
 for(const c of out.clips){const k=c.i,side=c.kind==='outer'?c.side:c.side,lat=side*(B.wl[k]-.25);posts.push([new THREE.CylinderGeometry(.05,.05,1.1,6),M4(B.x[k]+B.nx[k]*lat,B.y[k]+.55,B.z[k]+B.nz[k]*lat)]);
  posts.push([new THREE.SphereGeometry(.11,8,6),M4(B.x[k]+B.nx[k]*lat,B.y[k]+1.14,B.z[k]+B.nz[k]*lat)]);}
 if(posts.length)g.add(new THREE.Mesh(merge(posts),cm));
 const zt=ctex(128,128,(x,w,h)=>{x.strokeStyle='rgba(255,170,40,.9)';x.lineWidth=7;x.setLineDash([16,12]);x.beginPath();x.arc(w/2,h/2,w/2-6,0,7);x.stroke();x.fillStyle='rgba(255,140,30,.12)';x.fill();},{clamp:true});
 const zg=new THREE.PlaneGeometry(1,1);zg.rotateX(-Math.PI/2);const zm=new THREE.InstancedMesh(zg,new THREE.MeshBasicMaterial({map:zt,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}),out.clips.length||1);
 out.clips.forEach((c,i)=>{zm.setMatrixAt(i,new THREE.Matrix4().compose(new V(c.x,c.y+.03,c.z),new THREE.Quaternion(),new V(c.r*2,1,c.r*2)));});zm.count=out.clips.length;g.add(zm);out.clipMesh=zm;
 const k0=0;out.spawn={x:B.x[k0]+B.tx[k0]*6,z:B.z[k0]+B.tz[k0]*6,yaw:Math.atan2(B.tx[k0],B.tz[k0]),i:k0};
 lampHeads(out.lamps,time.lampCol,g);}

function guardrail(B,side,g,metal,every=1){// W-beam on posts at the wall line
 const prof=[{o:.12,y:.52,v:0},{o:.18,y:.6,v:.25},{o:.1,y:.68,v:.5},{o:.18,y:.76,v:.75},{o:.12,y:.84,v:1}];
 const m=new THREE.Mesh(sweep(B,side,prof,'wall',every,{uScale:4}),metal);m.castShadow=true;g.add(m);
 const posts=[],refl=[];const st=Math.round(4/B.step);
 for(let i=0;i<B.n;i+=st){const lat=side*(B.wl[i]+.28);posts.push([new THREE.BoxGeometry(.12,.85,.12),M4(B.x[i]+B.nx[i]*lat,B.y[i]+.42,B.z[i]+B.nz[i]*lat,0,Math.atan2(B.tx[i],B.tz[i]),0)]);
  if(i%(st*3)===0)refl.push([new THREE.BoxGeometry(.03,.1,.06),M4(B.x[i]+B.nx[i]*(lat-side*.22),B.y[i]+.72,B.z[i]+B.nz[i]*(lat-side*.22),0,Math.atan2(B.tx[i],B.tz[i]),0)]);}
 const pm=new THREE.Mesh(merge(posts),metal);pm.castShadow=true;g.add(pm);
 g.add(new THREE.Mesh(merge(refl),new THREE.MeshStandardMaterial({color:0x331a00,emissive:side>0?0xff8a20:0xffffff,emissiveIntensity:.9})));}

function dressPass(R,B,out,time,q,rr){const g=out.group;
 const metal=new THREE.MeshStandardMaterial({color:0xa8adb4,metalness:.85,roughness:.35,envMapIntensity:.9,side:THREE.DoubleSide});
 guardrail(B,1,g,metal);guardrail(B,-1,g,metal);
 // terrain carved around the road: peak inside the loop, falling away to the valley outside
 const cx=150,cz=-10,S=1500,N=q>=2?200:150;const tg=new THREE.PlaneGeometry(S,S,N,N);tg.rotateX(-Math.PI/2);const P=tg.attributes.position,col=new Float32Array(P.count*3);
 const ca=new THREE.Color(0x1d2a1a),cb=new THREE.Color(0x2b2a26),cr=new THREE.Color(0x3c3a36),tmp=new THREE.Color();const fr={};
 for(let i=0;i<P.count;i++){const x=P.getX(i)+cx,z=P.getZ(i)+cz;const k=nearestGlobal(B,x,z);const f=frame(B,x,z,k,fr);const d=Math.abs(f.d),ins=inside(B,x,z);
  const nat=ins?f.y+3+Math.pow(Math.max(0,d-6),.95)*.5+fbm(x/60,z/60)*14:f.y-2-Math.pow(Math.max(0,d-6),1.08)*.42-fbm(x/80,z/80)*18;
  const wall=B.wl[f.i]+1.2,t=smooth(wall,wall+(ins?10:14),d);let h=lerp(f.y-.35,nat,t);
  const far=Math.hypot(x-cx,z-cz);if(!ins)h=Math.max(h,-150)-smooth(500,740,far)*40;
  P.setY(i,h);const rock=ins?smooth(4,30,d)*.8:0;tmp.copy(ca).lerp(cb,fbm(x/30,z/30)).lerp(cr,rock*(.5+.5*vnoise(x/9,z/9)));col.set([tmp.r,tmp.g,tmp.b],i*3);}
 P.needsUpdate=true;tg.translate(cx,0,cz);tg.setAttribute('color',new THREE.BufferAttribute(col,3));tg.computeVertexNormals();
 const tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,map:noiseTex('#8a8a8a','#ffffff',8,256),envMapIntensity:.2});tm.map.repeat.set(160,160);
 const terr=new THREE.Mesh(tg,tm);terr.receiveShadow=true;g.add(terr);
 const hAt=(x,z)=>{const fx=(x-cx+S/2)/S*N,fz=(z-cz+S/2)/S*N,i=Math.floor(fx),j=Math.floor(fz);if(i<0||j<0||i>=N||j>=N)return-999;const a=fx-i,b=fz-j,Y=(ii,jj)=>P.getY(jj*(N+1)+ii);
  return(Y(i,j)*(1-a)+Y(i+1,j)*a)*(1-b)+(Y(i,j+1)*(1-a)+Y(i+1,j+1)*a)*b;};
 // pines
 const tree=merge([[new THREE.CylinderGeometry(.18,.25,2.2,6),M4(0,1.1,0),new THREE.Color(0x2a1c12)],[new THREE.ConeGeometry(2.2,5.5,7),M4(0,4.2,0),new THREE.Color(0x14261a)],[new THREE.ConeGeometry(1.6,4,7),M4(0,6.6,0),new THREE.Color(0x183020)]]);
 const spots=[];for(let i=0;i<4000&&spots.length<(q>=2?1300:700);i++){const x=cx+(rr()-.5)*S*.9,z=cz+(rr()-.5)*S*.9;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+5)continue;
  const hy=hAt(x,z);if(hy<-120)continue;spots.push([x,hy-.2,z]);}
 const tim=new THREE.InstancedMesh(tree,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),spots.length);spots.forEach((s,i)=>{const sc=.7+rr()*.9;tim.setMatrixAt(i,M4(s[0],s[1],s[2],0,rr()*6,0,sc,sc*(.8+rr()*.5),sc));});tim.castShadow=true;g.add(tim);
 // streetlights: pole + arm hanging over the road, alternating sides
 const st=Math.round(38/B.step),pole=[];
 for(let i=0,k=0;i<B.n;i+=st,k++){const side=k%2?1:-1,lat=side*(B.wl[i]+.7),hx=B.x[i]+B.nx[i]*lat,hz=B.z[i]+B.nz[i]*lat,y0=B.y[i];const yaw=Math.atan2(B.nx[i]*-side,B.nz[i]*-side);
  pole.push([new THREE.CylinderGeometry(.09,.13,8,8),M4(hx,y0+4,hz)]);pole.push([new THREE.BoxGeometry(.08,.08,2.6),M4(hx-B.nx[i]*side*1.3,y0+7.9,hz-B.nz[i]*side*1.3,0,yaw,0)]);
  const lx=hx-B.nx[i]*side*2.5,lz=hz-B.nz[i]*side*2.5;out.lamps.push({x:lx,y:y0+7.75,z:lz,gx:lx-B.nx[i]*side*.5,gz:lz-B.nz[i]*side*.5,gy:y0,pool:20,I:320});}
 const pm=new THREE.Mesh(merge(pole),new THREE.MeshStandardMaterial({color:0x3a3d42,metalness:.3,roughness:.75}));g.add(pm);
 // the city in the valley below
 city(g,-1200,-60,1100,1300,-150,q,rr);
 // distant ridges
 ridges(g,1900,new THREE.Color(0x090d16),-60,240,rr);}

function city(g,cx,cz,w,d,y,q,rr){const n=q>=2?2600:1500,geo=new THREE.BoxGeometry(1,1,1);geo.translate(0,.5,0);
 const wt=ctex(64,128,(x,W,H)=>{x.fillStyle='#000';x.fillRect(0,0,W,H);for(let j=4;j<H;j+=8)for(let i=3;i<W;i+=7){if(Math.random()<.42){const c=Math.random();x.fillStyle=c<.6?'#ffcf86':c<.85?'#bfe0ff':'#ff9a5a';x.globalAlpha=.4+Math.random()*.6;x.fillRect(i,j,4,5);}}x.globalAlpha=1;});
 const m=new THREE.MeshStandardMaterial({color:0x07080b,roughness:.8,emissiveMap:wt,emissive:0xffffff,emissiveIntensity:1.4,map:wt,fog:true});
 const im=new THREE.InstancedMesh(geo,m,n);for(let i=0;i<n;i++){const x=cx+(rr()-.5)*w,z=cz+(rr()-.5)*d,dc=Math.hypot(x-cx,z-cz)/(w*.5),h=8+rr()*rr()*(dc<.4?160:60),bw=10+rr()*24;im.setMatrixAt(i,M4(x,y,z,0,rr()*.3,0,bw,h,10+rr()*22));}g.add(im);
 const pts=[],cols=[];for(let i=0;i<(q>=2?9000:4000);i++){const x=cx+(rr()-.5)*w*1.3,z=cz+(rr()-.5)*d*1.3;pts.push(x,y+1+rr()*2,z);const c=rr();cols.push(1,c<.7?.62:.9,c<.7?.25:.8);}
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));pg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 g.add(new THREE.Points(pg,new THREE.PointsMaterial({size:2.2,vertexColors:true,transparent:true,opacity:.9,fog:false,depthWrite:false,blending:THREE.AdditiveBlending})));
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(w*1.6,d*1.6),new THREE.MeshBasicMaterial({color:0x07070a}));gr.rotation.x=-Math.PI/2;gr.position.set(cx,y-.2,cz);g.add(gr);}

function ridges(g,R0,col,y0,hgt,rr){const pos=[],idx=[],N=120;for(let i=0;i<=N;i++){const a=i/N*6.283,h=y0+hgt*(.35+.65*fbm(i*.08,3.3,4))*(.6+.4*Math.sin(a*3+1)**2);pos.push(Math.cos(a)*R0,y0-200,Math.sin(a)*R0,Math.cos(a)*R0,h,Math.sin(a)*R0);}
 for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,fog:false}));g.add(m);}

function dressDocks(R,B,out,time,q,rr){const g=out.group,fr={};
 // jersey barriers both sides
 const bt=ctex(256,64,(x,w,h)=>{x.fillStyle='#8f8c86';x.fillRect(0,0,w,h);for(let i=0;i<900;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.15})`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}x.fillStyle='#d9a400';for(let i=-2;i<10;i++){x.save();x.translate(i*32,44);x.transform(1,0,-.8,1,0,0);x.fillRect(0,0,16,20);x.restore();}x.fillStyle='#111';});
 bt.repeat.set(1,1);const bm=new THREE.MeshStandardMaterial({map:bt,roughness:.75,envMapIntensity:.4});
 const prof=[{o:-.05,y:0,v:1},{o:-.02,y:.25,v:.75},{o:.22,y:.4,v:.55},{o:.32,y:.95,v:0},{o:.6,y:.95,v:0},{o:.7,y:.4,v:.55},{o:.95,y:.25,v:.75},{o:.98,y:0,v:1}];
 for(const s of[-1,1]){const m=new THREE.Mesh(sweep(B,s,prof,'wall',1,{uScale:5}),bm);m.castShadow=true;m.receiveShadow=true;g.add(m);}
 // ground: wet concrete apron (reflective); water west of the quay
 const QX=-24,gm=new THREE.MeshStandardMaterial({map:noiseTex('#2c2d2f','#3e3f42',30),roughnessMap:asphaltTex('lot').rough,roughness:.6,envMapIntensity:1});gm.map.repeat.set(60,60);gm.roughnessMap.repeat.set(12,6);reflective(gm,out.mirror.U,'apron');
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,1000),gm);ground.rotation.x=-Math.PI/2;ground.position.set(QX+450,-.03,0);ground.receiveShadow=true;g.add(ground);out.hideRefl.push(ground);
 const quay=new THREE.Mesh(new THREE.BoxGeometry(2,4,1000),new THREE.MeshStandardMaterial({color:0x3a3936,roughness:.9}));quay.position.set(QX-1,-2,0);g.add(quay);
 const wm=new THREE.MeshStandardMaterial({color:0x02060a,roughness:.08,metalness:.4,envMapIntensity:.9});reflective(wm,out.mirror.U,'water');
 const water=new THREE.Mesh(new THREE.PlaneGeometry(1600,2000),wm);water.rotation.x=-Math.PI/2;water.position.set(QX-800,-1.6,0);g.add(water);out.hideRefl.push(water);
 // container stacks off the racing line
 const cont=new THREE.BoxGeometry(12.2,2.6,2.44);cont.translate(0,1.3,0);
 const ct=ctex(256,64,(x,w,h)=>{x.fillStyle='#bbb';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=6){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i,0,2,h);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i+3,0,1,h);}x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,0,w,3);x.fillRect(0,h-3,w,3);for(let i=0;i<300;i++){x.fillStyle=`rgba(90,50,20,${Math.random()*.2})`;x.fillRect(Math.random()*w,Math.random()*h,3,2);}});
 const cm=new THREE.MeshStandardMaterial({map:ct,roughness:.7,metalness:.35,envMapIntensity:.5});
 const C=[0x8a2a1c,0x1f4f8a,0x2d6a3a,0x9a9a96,0xc05a14,0x6a1a1a,0xd8d4c8,0x1a3a5a,0xa88a1a];const items=[];
 for(let x=-6;x<440;x+=14)for(let z=-280;z<300;z+=3.2){if(rr()<.12)continue;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+3.5)continue;
  const near=[-6,6].every(o=>{const f2=frame(B,x+o,z,k,{});return Math.abs(f2.d)>B.wl[f2.i]+3;});if(!near)continue;const st=1+(rr()*4|0);for(let s=0;s<st;s++)items.push([x+(rr()-.5)*.3,s*2.62,z,C[rr()*C.length|0]]);}
 const im=new THREE.InstancedMesh(cont,cm,items.length);const col=new THREE.Color();items.forEach((it,i)=>{im.setMatrixAt(i,M4(it[0],it[1],it[2]));im.setColorAt(i,col.set(it[3]));});im.castShadow=true;im.receiveShadow=true;g.add(im);
 // gantry cranes on the quay
 const red=new THREE.MeshStandardMaterial({color:0xb02a1a,roughness:.55,metalness:.5}),parts=[];
 for(const z of[-200,-60,80,220]){const X=QX+6;for(const dz of[-9,9])for(const dx of[-4,-18]){parts.push([new THREE.BoxGeometry(1.2,36,1.2),M4(X+dx,18,z+dz)]);}
  for(const dx of[-4,-18])parts.push([new THREE.BoxGeometry(1.2,1.2,20),M4(X+dx,36,z)]);parts.push([new THREE.BoxGeometry(70,2.2,3),M4(X-24,38,z-6)]);parts.push([new THREE.BoxGeometry(70,2.2,3),M4(X-24,38,z+6)]);
  parts.push([new THREE.BoxGeometry(7,5,8),M4(X-12,34,z)]);for(let k=0;k<6;k++)parts.push([new THREE.BoxGeometry(.4,.4,18),M4(X-50+k*11,40,z,0,0,.0)]);
  out.lamps.push({x:X-2,y:34,z,gx:X+8,gz:z,pool:34,I:900,col:0xdde8ff});}
 const crane=new THREE.Mesh(merge(parts),red);crane.castShadow=true;g.add(crane);
 // aviation lights + ship
 const av=[];for(const z of[-200,-60,80,220])av.push([new THREE.SphereGeometry(.5,8,6),M4(QX-58,40,z)],[new THREE.SphereGeometry(.5,8,6),M4(QX+2,39.5,z)]);
 const avm=new THREE.MeshBasicMaterial({color:new THREE.Color(6,.3,.2)});g.add(new THREE.Mesh(merge(av),avm));out.blink=avm;
 const hull=new THREE.Mesh(new THREE.BoxGeometry(34,14,260),new THREE.MeshStandardMaterial({color:0x101418,roughness:.6,metalness:.3}));hull.position.set(QX-40,3,10);g.add(hull);
 const deck=[];for(let z=-110;z<120;z+=13)for(let x=-12;x<=12;x+=2.6)if(rr()<.85)for(let s=0;s<1+(rr()*3|0);s++)deck.push([x,10+s*2.6,z]);
 const dm=new THREE.InstancedMesh(cont,cm,deck.length);deck.forEach((d,i)=>{dm.setMatrixAt(i,M4(QX-40+d[0],d[1],10+d[2],0,Math.PI/2,0));dm.setColorAt(i,col.set(C[rr()*C.length|0]));});g.add(dm);
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(30,16,10),new THREE.MeshStandardMaterial({color:0xd8d8d0,roughness:.6,emissive:0xffd8a0,emissiveIntensity:.0}));bridge.position.set(QX-40,18,-120);g.add(bridge);
 // floodlight masts along the track
 const mast=[],st=Math.round(64/B.step);for(let i=0,k=0;i<B.n;i+=st,k++){const side=k%2?1:-1,lat=side*(B.wl[i]+2.2),x=B.x[i]+B.nx[i]*lat,z=B.z[i]+B.nz[i]*lat;
  mast.push([new THREE.CylinderGeometry(.2,.32,16,8),M4(x,8,z)],[new THREE.BoxGeometry(2.6,.5,.8),M4(x,16,z,0,Math.atan2(B.tx[i],B.tz[i]),0)]);
  out.lamps.push({x:x-B.nx[i]*side*1,y:15.6,z:z-B.nz[i]*side*1,gx:B.x[i]+B.nx[i]*side*(B.hw[i]*.4),gz:B.z[i]+B.nz[i]*side*(B.hw[i]*.4),pool:30,I:700,col:k%3?0xffb060:0xd8e6ff});}
 g.add(new THREE.Mesh(merge(mast),new THREE.MeshStandardMaterial({color:0x5a5d62,metalness:.6,roughness:.5})));
 city(g,600,700,1500,500,-2,q,rr);ridges(g,2000,new THREE.Color(0x10141a),-20,120,rr);}

function dressRing(R,B,out,time,q,rr){const g=out.group;
 // grass everywhere + gravel traps behind corners
 const gm=new THREE.MeshStandardMaterial({map:noiseTex('#4a7a2e','#6a9a3a',14),roughness:.95,envMapIntensity:.25});gm.map.repeat.set(220,220);
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),gm);gr.rotation.x=-Math.PI/2;gr.position.set(160,-.06,-40);gr.receiveShadow=true;g.add(gr);
 // concrete wall with banner band
 const ads=ctex(1024,64,(x,w,h)=>{x.fillStyle='#e8e2d6';x.fillRect(0,0,w,h);x.font='38px Anton, Impact, sans-serif';x.textBaseline='middle';
  const items=[['SIDEWAYS','#ff4d00'],['PIXEL ARCADE','#111'],['EMBER RING','#c21a2a'],['SMOKE IS POINTS','#111'],['ANGLE · SPEED · LINE','#2a6dff']];let px=10;for(const[t,c]of items){x.fillStyle=c;x.fillText(t,px,h/2+2);px+=x.measureText(t).width+40;}});
 const wm=new THREE.MeshStandardMaterial({map:ads,roughness:.7});
 const prof=[{o:0,y:0,v:1},{o:0,y:1.1,v:0},{o:.3,y:1.1,v:0},{o:.3,y:0,v:1}];
 for(const s of[-1,1]){const m=new THREE.Mesh(sweep(B,s,prof,'wall',1,{uScale:16,flip:true}),wm);m.castShadow=true;g.add(m);}
 // kerbs on the edges of the corners
 const kt=ctex(64,64,(x,w,h)=>{x.fillStyle='#d01818';x.fillRect(0,0,w,h/2);x.fillStyle='#f0f0f0';x.fillRect(0,h/2,w,h/2);});kt.repeat.set(1,1);
 const km=new THREE.MeshStandardMaterial({map:kt,roughness:.6});
 for(const s of[-1,1]){const kprof=[{o:-.02,y:.0,v:0},{o:.5,y:.07,v:.5},{o:1.1,y:.02,v:1}];const skip=i=>Math.abs(B.curv[i])<.008;const geo=sweep(B,s,kprof,'edge',1,{uScale:3,skip});
  const m=new THREE.Mesh(geo,km);m.receiveShadow=true;g.add(m);}
 // tyre stacks around the outside of the hairpins
 const tyre=new THREE.TorusGeometry(.32,.15,6,12);tyre.rotateX(Math.PI/2);const ts=[];
 for(let i=0;i<B.n;i+=3){if(Math.abs(B.curv[i])<.012)continue;const side=-Math.sign(B.curv[i]),lat=side*(B.wl[i]-.45);for(let h=0;h<3;h++)ts.push([B.x[i]+B.nx[i]*lat,B.y[i]+.15+h*.3,B.z[i]+B.nz[i]*lat]);}
 const tm=new THREE.InstancedMesh(tyre,new THREE.MeshStandardMaterial({color:0x151515,roughness:.9}),ts.length);ts.forEach((p,i)=>tm.setMatrixAt(i,M4(p[0],p[1],p[2])));g.add(tm);
 // grandstand along the main straight + judges tower
 const stand=[],k0=Math.round(60/B.step);for(let t=0;t<9;t++)stand.push([new THREE.BoxGeometry(5,.6,170),M4(-B.wr[k0]-6-t*1.2,.3+t*.62,-20)]);stand.push([new THREE.BoxGeometry(1,10,170),M4(-B.wr[k0]-18,5,-20)]);
 stand.push([new THREE.BoxGeometry(12,.4,172),M4(-B.wr[k0]-12,10,-20,0,0,-.08)]);
 const sm=new THREE.Mesh(merge(stand),new THREE.MeshStandardMaterial({color:0x8a8d94,roughness:.8,metalness:.2}));sm.castShadow=true;sm.receiveShadow=true;g.add(sm);
 const crowdG=new THREE.BoxGeometry(.5,.9,.4);crowdG.translate(0,.45,0);const cr=[];for(let t=0;t<9;t++)for(let z=-100;z<60;z+=.75)if(rr()<.7)cr.push([-B.wr[k0]-5-t*1.2+(rr()-.5)*.3,.6+t*.62,z]);
 const cim=new THREE.InstancedMesh(crowdG,new THREE.MeshLambertMaterial({color:0xffffff}),cr.length);const col=new THREE.Color();const pal=['#e8e2d6','#222','#c21a2a','#2a6dff','#ff4d00','#ffcf3f','#5a8a5a','#777'];
 cr.forEach((p,i)=>{cim.setMatrixAt(i,M4(p[0],p[1],p[2],0,Math.PI/2,0,1,.8+rr()*.4,1));cim.setColorAt(i,col.set(pal[rr()*pal.length|0]));});g.add(cim);
 const tower=new THREE.Mesh(merge([[new THREE.BoxGeometry(6,12,6),M4(0,6,0)],[new THREE.BoxGeometry(9,4,9),M4(0,14,0)]]),new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.5,metalness:.4,emissive:0xff8a40,emissiveIntensity:.05}));tower.position.set(120,0,-120);g.add(tower);
 // trees ring + light towers (dusk, on)
 const tree=merge([[new THREE.CylinderGeometry(.25,.35,3,6),M4(0,1.5,0),new THREE.Color(0x3a2a1a)],[new THREE.IcosahedronGeometry(3.2,1),M4(0,5.4,0),new THREE.Color(0x2a4a20)],[new THREE.IcosahedronGeometry(2.4,1),M4(.8,7.4,.4),new THREE.Color(0x335a26)]]);
 const sp=[],fr={};for(let i=0;i<3000&&sp.length<(q>=2?700:400);i++){const a=rr()*6.283,r=200+rr()*700,x=160+Math.cos(a)*r,z=-40+Math.sin(a)*r;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+14)continue;sp.push([x,z]);}
 for(let i=0;i<500&&sp.length<(q>=2?900:500);i++){const x=-60+rr()*420,z=-320+rr()*560;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+10)continue;if(x<-B.wr[k0]-2&&x>-B.wr[k0]-24&&z>-110&&z<70)continue;sp.push([x,z]);}
 const tim=new THREE.InstancedMesh(tree,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),sp.length);sp.forEach((p,i)=>{const s=.8+rr()*.8;tim.setMatrixAt(i,M4(p[0],0,p[1],0,rr()*6,0,s));});tim.castShadow=true;g.add(tim);
 const tw=[],st=Math.round(120/B.step);for(let i=0,k=0;i<B.n;i+=st,k++){const side=k%2?1:-1,lat=side*(B.wl[i]+4),x=B.x[i]+B.nx[i]*lat,z=B.z[i]+B.nz[i]*lat;tw.push([new THREE.CylinderGeometry(.3,.45,22,8),M4(x,11,z)],[new THREE.BoxGeometry(4,2,.6),M4(x,22,z,0,Math.atan2(B.nx[i],B.nz[i]),0)]);
  out.lamps.push({x:x-B.nx[i]*side,y:21.5,z:z-B.nz[i]*side,gx:B.x[i],gz:B.z[i],pool:34,I:500,col:0xffe2b8});}
 g.add(new THREE.Mesh(merge(tw),new THREE.MeshStandardMaterial({color:0x6a6d72,metalness:.6,roughness:.5})));
 ridges(g,1700,new THREE.Color(0x4a2a32),-10,160,rr);ridges(g,2100,new THREE.Color(0x6a3a3a),-10,260,rr);}

/* ---------- the lot ---------- */
function buildLot(R,def,out,time,q){const g=out.group,lot=lotLayout(def);out.lot=lot;out.clips=lot.clips.map(c=>({...c}));
 const W=lot.W,L=lot.L;out.mirror=new Mirror(.5);out.mirror.U.uReflStr.value=.5;
 const lt=ctex(1024,768,(x,w,h)=>{x.fillStyle='#2b2b2d';x.fillRect(0,0,w,h);const id=x.getImageData(0,0,w,h),d=id.data;for(let k=0;k<d.length;k+=4){const n=(Math.random()-.5)*22;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(id,0,0);
  const X=v=>(v+W)/(2*W)*w,Z=v=>(v+L)/(2*L)*h;x.strokeStyle='rgba(235,235,225,.75)';x.lineWidth=2;
  for(const zz of[-38,38])for(let xx=-W+6;xx<W-6;xx+=3.2){if(Math.abs(xx%70)<15)continue;for(const s of[-1,1]){x.beginPath();x.moveTo(X(xx),Z(zz+s*3.2));x.lineTo(X(xx),Z(zz+s*9));x.stroke();}}
  x.strokeStyle='rgba(230,190,40,.8)';x.lineWidth=3;x.strokeRect(X(-W+2),Z(-L+2),X(W-2)-X(-W+2),Z(L-2)-Z(-L+2));
  x.fillStyle='rgba(235,235,225,.7)';x.font='bold 22px JetBrains Mono, monospace';x.fillText('LOT 22',X(-8),Z(2));
  for(let i=0;i<40;i++){x.fillStyle=`rgba(0,0,0,${.05+Math.random()*.1})`;x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*60,6+Math.random()*30,Math.random()*3,0,7);x.fill();}});
 const rough=asphaltTex('lot').rough;rough.repeat.set(4,3);
 const gm=new THREE.MeshStandardMaterial({map:lt,roughnessMap:rough,roughness:.68,envMapIntensity:.9});reflective(gm,out.mirror.U,'lot');
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(2*W,2*L),gm);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;g.add(ground);out.hideRefl.push(ground);out.road=ground;
 const outer=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({color:0x101112,roughness:.95}));outer.rotation.x=-Math.PI/2;outer.position.y=-.05;g.add(outer);
 // perimeter: low concrete wall + fence
 const P=[],fence=[];for(const[x,z,w,d]of[[0,L+.3,2*W+1.2,.6],[0,-L-.3,2*W+1.2,.6],[W+.3,0,.6,2*L],[-W-.3,0,.6,2*L]]){P.push([new THREE.BoxGeometry(w,.9,d),M4(x,.45,z)]);fence.push([new THREE.BoxGeometry(w,2.4,d*.1+.02),M4(x,2.1,z)]);}
 g.add(new THREE.Mesh(merge(P),new THREE.MeshStandardMaterial({color:0x6e6c68,roughness:.85})));
 const ft=ctex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='rgba(200,200,200,.8)';x.lineWidth=2;for(let i=-64;i<128;i+=12){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}});ft.repeat.set(80,1);
 g.add(new THREE.Mesh(merge(fence),new THREE.MeshStandardMaterial({map:ft,transparent:true,alphaTest:.3,side:THREE.DoubleSide,metalness:.6,roughness:.5})));
 // islands (painted curbs), light poles, pillars
 const isl=[];for(const b of lot.boxes)isl.push([new THREE.BoxGeometry(b.hx*2,b.h,b.hz*2),M4(b.x,b.h/2,b.z)]);
 g.add(new THREE.Mesh(merge(isl),new THREE.MeshStandardMaterial({color:0x8a8780,roughness:.8,map:ctex(64,64,(x,w,h)=>{x.fillStyle='#bdb8ac';x.fillRect(0,0,w,h);x.fillStyle='#c8a020';x.fillRect(0,0,w,6);x.fillRect(0,h-6,w,6);})})));
 const poles=[],pil=[];for(const c of lot.circles){if(c.kind==='pole'){poles.push([new THREE.CylinderGeometry(.2,.3,11,8),M4(c.x,5.5,c.z)],[new THREE.BoxGeometry(3,.3,.5),M4(c.x,11,c.z)]);for(const s of[-1,1])out.lamps.push({x:c.x+s*1.3,y:10.7,z:c.z,gx:c.x+s*4,gz:c.z,pool:30,I:520,col:0xe6eeff});}
  else pil.push([new THREE.CylinderGeometry(c.r,c.r,7,20),M4(c.x,3.5,c.z)]);}
 g.add(new THREE.Mesh(merge(poles),new THREE.MeshStandardMaterial({color:0x5a5d62,metalness:.6,roughness:.5})));
 const pt=ctex(128,256,(x,w,h)=>{x.fillStyle='#9a968c';x.fillRect(0,0,w,h);for(let i=0;i<w*2;i+=24){x.fillStyle='#e0b000';x.save();x.translate(i-w,h-60);x.transform(1,-.6,0,1,0,0);x.fillRect(0,0,12,80);x.restore();}x.fillStyle='rgba(0,0,0,.6)';x.fillRect(0,h-62,w,2);});
 const pm=new THREE.Mesh(merge(pil),new THREE.MeshStandardMaterial({map:pt,roughness:.8}));pm.castShadow=true;g.add(pm);
 // surrounding buildings with lit signage
 const bl=[],sg=[];const sign=ctex(512,96,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.font='64px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ff3a6a';x.shadowColor='#ff3a6a';x.shadowBlur=20;x.fillText('NITE MARKET',w/2,h/2+4);});
 bl.push([new THREE.BoxGeometry(2*W+40,22,30),M4(0,11,L+40)],[new THREE.BoxGeometry(60,30,80),M4(W+60,15,-20)],[new THREE.BoxGeometry(70,16,50),M4(-W-55,8,30)],[new THREE.BoxGeometry(2*W,12,24),M4(-20,6,-L-36)]);
 g.add(new THREE.Mesh(merge(bl),new THREE.MeshStandardMaterial({color:0x1a1b1e,roughness:.85})));
 const sm=new THREE.Mesh(new THREE.PlaneGeometry(60,11),new THREE.MeshBasicMaterial({map:sign,color:new THREE.Color(2.4,2.4,2.4),transparent:true,blending:THREE.AdditiveBlending}));sm.position.set(0,16,L+24.9);sm.rotation.y=Math.PI;g.add(sm);
 for(let i=0;i<14;i++)out.lamps.push({x:-W+i*(2*W/13),y:9,z:L+24,gx:-W+i*(2*W/13),gz:L-4,pool:16,I:120,col:0xffb080});
 city(g,0,-900,2600,800,-1,q,seeded(9));ridges(g,2100,new THREE.Color(0x0a0d14),-10,140,seeded(4));
 lampHeads(out.lamps,time.lampCol,g);
 // traffic cones (knockable)
 out.cones=[];const coneG=merge([[new THREE.ConeGeometry(.22,.7,10),M4(0,.38,0),new THREE.Color(0xff5a10)],[new THREE.CylinderGeometry(.16,.19,.1,10),M4(0,.4,0),new THREE.Color(0xf0f0f0)],[new THREE.BoxGeometry(.5,.05,.5),M4(0,.025,0),new THREE.Color(0xff5a10)]]);
 const cmI=new THREE.InstancedMesh(coneG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}),40);
 const cpos=[];for(let i=0;i<8;i++)cpos.push([-40+i*12,-70]);for(let i=0;i<8;i++){const a=i/8*6.283;cpos.push([0+Math.cos(a)*14,62+Math.sin(a)*14*.0+Math.sin(a)*8]);}for(let i=0;i<12;i++)cpos.push([60+i*4.5,-18+(i%2)*1.5]);
 for(let i=0;i<cpos.length;i++)out.cones.push({x:cpos[i][0],z:cpos[i][1],y:0,hx:cpos[i][0],hz:cpos[i][1],vx:0,vy:0,vz:0,rx:0,rz:0,wr:0,down:false});cmI.count=out.cones.length;g.add(cmI);out.coneMesh=cmI;
 out.spawn={x:0,z:-20,yaw:Math.PI/2,i:-1};}
