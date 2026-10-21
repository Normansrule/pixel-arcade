// STRIKER 11 — stadium: sky, lights, striped pitch + line geometry, goals with cloth nets, corner flags,
// LED boards, tiered bowl with instanced animated crowd, roofs, floodlight towers, dugouts and big screens.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {P,R} from './physics.js';
import {grass,pitchMaps,netTex as netTexture} from './tex.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;
const TC={},KEEP=new Set();// static canvas textures, baked once per page and reused by every world rebuild
export function ktex(key,w,h,draw,o){if(TC[key])return TC[key];const t=TC[key]=Object.assign(ctex(w,h,draw,o),{userData:{keep:true}});
 // canvases with lettering are redrawn once the display font has loaded
 if(document.fonts&&document.fonts.status!=='loaded')document.fonts.ready.then(()=>{const x=t.image.getContext('2d');x.clearRect(0,0,w,h);draw(x,w,h);t.needsUpdate=true;});return t;}
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function makeEnv(R2,night){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{n:{value:night?1:0}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float n;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 day=mix(vec3(.18,.22,.14),vec3(.55,.7,.95),smoothstep(-.1,.4,h));vec3 nt=mix(vec3(.04,.06,.04),vec3(.04,.05,.1),smoothstep(-.1,.4,h));gl_FragColor=vec4(mix(day,nt,n),1.);}'})));
 const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(night?12:6,night?11.5:6,night?10:5.5),side:THREE.DoubleSide});
 for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(18,8),lm);m.position.set(x*50,45,z*60);m.lookAt(0,0,0);s.add(m);}
 const pm=new THREE.PMREMGenerator(R2);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}

// rounded-rectangle perimeter at half sizes (a,b) + offset `off`, corner radius rc; points carry outward normals
function perimeter(a,b,rc,off,step){const pts=[],cx=a-rc,cz=b-rc,r=rc+off;let u=0,ub=0,k=1,last=null;
 const add=(x,z,ox,oz)=>{if(last){const d=Math.hypot(x-last.x,z-last.z);u+=d;ub+=d*k;}last={x,z,ox,oz,u,ub};pts.push(last);};
 const line=(x0,z0,x1,z1,ox,oz)=>{k=1;const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)/step));for(let i=0;i<n;i++){const t=i/n;add(x0+(x1-x0)*t,z0+(z1-z0)*t,ox,oz);}};
 const arc=(ccx,ccz,a0)=>{k=rc/r;const n=Math.max(3,Math.ceil(r*Math.PI/2/step));for(let i=0;i<n;i++){const t=a0+i/n*Math.PI/2;add(ccx+Math.cos(t)*r,ccz+Math.sin(t)*r,Math.cos(t),Math.sin(t));}};
 line(a+off,-cz,a+off,cz,1,0);arc(cx,cz,0);line(cx,b+off,-cx,b+off,0,1);arc(-cx,cz,Math.PI/2);line(-(a+off),cz,-(a+off),-cz,-1,0);arc(-cx,-cz,Math.PI);line(-cx,-(b+off),cx,-(b+off),0,-1);arc(cx,-cz,Math.PI*1.5);
 const f=pts[0];add(f.x,f.z,f.ox,f.oz);return pts;}
function sweep(per,prof,skip,tint){const nP=prof.length,pos=[],uv=[],col=[],idx=[];
 for(const p of per)for(const q of prof){pos.push(p.x+p.ox*q.s,q.y,p.z+p.oz*q.s);uv.push(p.u/4,q.v);if(tint){const c=tint(p,q);col.push(c.r,c.g,c.b);}}
 for(let i=0;i<per.length-1;i++)for(let j=0;j<nP-1;j++){if(skip&&skip(per[i],per[i+1],prof[j]))continue;const a=i*nP+j,b=a+nP;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(tint)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function mergeG(list){const gs=list.map(([g,m])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));

/* ---------- cloth net (roof + back) ---------- */
class NetCloth{constructor(side,tex){this.s=side;const nu=26,nr=6,nb=10,nv=nr+nb;this.nu=nu;this.nv=nv;const L=P.L,GW=P.GW,GH=P.GH,GD=P.GD;
  const prof=[];for(let j=0;j<=nr;j++){const t=j/nr;prof.push([GH-t*.18,L+t*GD]);}for(let j=1;j<nb;j++){const t=j/(nb-1);prof.push([(GH-.18)*(1-t),L+GD]);}
  this.n=nu*prof.length;this.nvv=prof.length;this.p=new Float32Array(this.n*3);this.o=new Float32Array(this.n*3);this.rest=new Float32Array(this.n*3);this.pin=new Uint8Array(this.n);
  const uv=[],idx=[];let arc=0,lastP=null;for(let j=0;j<prof.length;j++){const[y,z]=prof[j];if(lastP)arc+=Math.hypot(y-lastP[0],z-lastP[1]);lastP=prof[j];
   for(let i=0;i<nu;i++){const k=j*nu+i,x=-GW+2*GW*i/(nu-1);this.p[k*3]=x;this.p[k*3+1]=y;this.p[k*3+2]=side*z;uv.push(x/.13,arc/.13);if(j===0||j===prof.length-1||i===0||i===nu-1)this.pin[k]=1;}}
  this.rest.set(this.p);this.o.set(this.p);
  for(let j=0;j<prof.length-1;j++)for(let i=0;i<nu-1;i++){const a=j*nu+i,b=a+nu;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new THREE.BufferGeometry();this.attr=new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage);g.setAttribute('position',this.attr);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  this.mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tex,alphaTest:.3,side:THREE.DoubleSide,roughness:.85,color:0xe8eaec}));this.mesh.frustumCulled=false;
  // constraints: horizontal + vertical neighbours
  this.c=[];const nvv=prof.length;for(let j=0;j<nvv;j++)for(let i=0;i<nu;i++){const k=j*nu+i;if(i<nu-1)this.c.push(k,k+1,this.d(k,k+1));if(j<nvv-1)this.c.push(k,k+nu,this.d(k,k+nu));}
  this.active=0;}
 d(a,b){const p=this.p;return Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);}
 kick(hp,v,str){// impulse to nodes near the hit point along the ball velocity
  const p=this.p,o=this.o;for(let k=0;k<this.n;k++){if(this.pin[k])continue;const dx=p[k*3]-hp.x,dy=p[k*3+1]-hp.y,dz=p[k*3+2]-hp.z,d2=dx*dx+dy*dy+dz*dz;if(d2>2.2)continue;const f=Math.exp(-d2*2.2)*str*.016;o[k*3]-=v.x*f;o[k*3+1]-=v.y*f*.6;o[k*3+2]-=v.z*f;}this.active=3;}
 step(dt,ball){const p=this.p,o=this.o,near=Math.abs(ball.z-this.s*(P.L+P.GD*.5))<P.GD&&Math.abs(ball.x)<P.GW+.5&&ball.y<P.GH+.5;if(near)this.active=3;if(this.active<=0)return;this.active-=dt;
  const dt2=dt*dt;for(let k=0;k<this.n;k++){if(this.pin[k])continue;const i=k*3;for(let a=0;a<3;a++){const x=p[i+a],vv=(x-o[i+a])*.93;o[i+a]=x;p[i+a]=x+vv+(a===1?-2.5*dt2:0);}
   // gentle pull back to the rest shape so the net keeps its form
   p[i]+=(this.rest[i]-p[i])*.02;p[i+1]+=(this.rest[i+1]-p[i+1])*.02;p[i+2]+=(this.rest[i+2]-p[i+2])*.02;}
  const c=this.c;for(let it=0;it<3;it++){for(let q=0;q<c.length;q+=3){const a=c[q]*3,b=c[q+1]*3,rl=c[q+2];const dx=p[b]-p[a],dy=p[b+1]-p[a+1],dz=p[b+2]-p[a+2],d=Math.hypot(dx,dy,dz)||1e-6;if(d<=rl)continue;const f=(d-rl)/d*.5;
    const pa=this.pin[c[q]],pb=this.pin[c[q+1]];if(!pa&&!pb){p[a]+=dx*f;p[a+1]+=dy*f;p[a+2]+=dz*f;p[b]-=dx*f;p[b+1]-=dy*f;p[b+2]-=dz*f;}else if(!pa){p[a]+=dx*f*2;p[a+1]+=dy*f*2;p[a+2]+=dz*f*2;}else if(!pb){p[b]-=dx*f*2;p[b+1]-=dy*f*2;p[b+2]-=dz*f*2;}}
   if(near){const rr=R+.05;for(let k=0;k<this.n;k++){if(this.pin[k])continue;const i=k*3,dx=p[i]-ball.x,dy=p[i+1]-ball.y,dz=p[i+2]-ball.z,d2=dx*dx+dy*dy+dz*dz;if(d2<rr*rr){const d=Math.sqrt(d2)||1e-4,f=(rr-d)/d;p[i]+=dx*f;p[i+1]+=dy*f;p[i+2]+=dz*f;}}}}
  this.attr.needsUpdate=true;}}

/* ---------- the whole venue ---------- */
export function buildWorld(scene,o){// o: {night, crowd(0..1), kits:[home,away], name}
 const G=new THREE.Group();scene.add(G);const out={group:G,nets:[],time:{value:0},hypeH:{value:0},hypeA:{value:0},hype:{value:0},flags:[],screens:[]};
 const L=P.L,W=P.W,night=o.night;
 // ----- sky -----
 if(night){G.add(new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 vP;
   float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
   void main(){vec3 d=normalize(vP);float h=d.y;vec3 c=mix(vec3(.075,.07,.11),vec3(.008,.012,.035),smoothstep(0.,.55,h));
    c+=vec3(.26,.13,.06)*exp(-h*h*60.)+vec3(.06,.05,.07)*exp(-h*h*8.);// city light pollution low on the horizon
    // thin cloud deck lit orange from below by the city and the floodlights
    vec2 q=d.xz/(h+.12)*2.2;float n=vn(q)*.55+vn(q*2.3+3.1)*.3+vn(q*5.1)*.15;float cl=smoothstep(.5,.85,n)*smoothstep(.02,.18,h)*(1.-smoothstep(.6,.95,h));
    c=mix(c,vec3(.17,.12,.11)*(1.2-h),cl*.55);c+=vec3(.05,.045,.04)*exp(-pow(acos(clamp(h,-1.,1.)),2.)*1.5);gl_FragColor=vec4(c,1.);}`})));
  const p=[];for(let i=0;i<1400;i++){const a=rnd(6.283),e=Math.asin(.12+rnd(.88)),r=1700;p.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  G.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xcfd8ff,size:1.4,fog:false,sizeAttenuation:false,transparent:true,opacity:.7})));}
 else{const sky=new Sky();sky.scale.setScalar(3000);const u=sky.material.uniforms;u.turbidity.value=5;u.rayleigh.value=1.4;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;
  out.sun=new V(-.84,.5,.3).normalize();u.sunPosition.value.copy(out.sun);u.turbidity.value=6.5;u.rayleigh.value=1.9;u.mieCoefficient.value=.005;u.mieDirectionalG.value=.86;G.add(sky);}

 // ----- distant city skyline: two layers of procedurally drawn buildings on one open cylinder (MEDIUM+); lit windows at night -----
 if((o.q??2)>=1){const sk=ktex(night?'skyN':'skyD',1024,256,(x,w,h)=>{x.clearRect(0,0,w,h);
   const layer=(y0,y1,hmin,hmax,col,win,seed)=>{let px=0,k=seed;const r=()=>{k=(k*16807)%2147483647;return k/2147483647;};
    while(px<w){const bw=10+r()*42,bh=hmin+Math.pow(r(),2.2)*(hmax-hmin),top=y1-bh;x.fillStyle=col;x.fillRect(px,top,bw,y1-top);
     if(r()<.25){x.fillRect(px+bw*.4,top-bh*.18,bw*.2,bh*.18);if(r()<.5)x.fillRect(px+bw*.48,top-bh*.18-12,2,12);}
     if(win){for(let yy=top+4;yy<y1-3;yy+=5)for(let xx=px+3;xx<px+bw-3;xx+=4)if(r()<win){x.fillStyle=r()<.8?'rgba(255,214,150,.9)':'rgba(190,220,255,.9)';x.fillRect(xx,yy,2,2);}x.fillStyle=col;}
     px+=bw+(r()<.3?r()*30:1);}};
   if(night){layer(0,128,18,110,'#0d1018',.07,7);layer(128,256,10,120,'#07080c',.16,11);}
   else{layer(0,128,18,110,'#9fb1c6',0,7);layer(128,256,10,120,'#7f90a6',0,11);
    const g=x.createLinearGradient(0,128,0,256);g.addColorStop(0,'rgba(170,190,210,.0)');g.addColorStop(1,'rgba(170,190,210,.35)');x.globalCompositeOperation='source-atop';x.fillStyle=g;x.fillRect(0,128,w,128);x.globalCompositeOperation='source-over';}},{});
  sk.wrapT=THREE.ClampToEdgeWrapping;const pos=[],uv=[],idx=[];const ring=(R,y0,y1,v0,v1,rep,ph)=>{const n=96,b0=pos.length/3;for(let i=0;i<=n;i++){const t=i/n,an=t*Math.PI*2+ph;for(const[y,v]of[[y0,v0],[y1,v1]]){pos.push(Math.cos(an)*R,y,Math.sin(an)*R);uv.push(t*rep,v);}}
    for(let i=0;i<n;i++){const q=b0+i*2;idx.push(q,q+2,q+1,q+1,q+2,q+3);}};
  ring(900,-6,110,.5,1,6,.4);ring(620,-6,62,0,.5,5,1.3);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:sk,alphaTest:.5,side:THREE.DoubleSide,color:night?0xffffff:0xe8eef6}));m.renderOrder=-1;G.add(m);}
 // ----- lights -----
 const hemi=new THREE.HemisphereLight(night?0x9fb0d8:0xc4d8f5,night?0x1c2a1a:0x56603a,night?.55:.52);G.add(hemi);
 const key=new THREE.DirectionalLight(night?0xf2f5ff:0xffe0b8,night?2.5:4.8);
 if(night)key.position.set(18,95,24);else key.position.copy(out.sun).multiplyScalar(160);
 key.castShadow=true;const ext=night?Math.max(W,L)+12:Math.max(W,L)+52;Object.assign(key.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:10,far:420});key.shadow.bias=-.0004;key.shadow.normalBias=.03;
 G.add(key,key.target);out.key=key;
 if(night){const f=new THREE.DirectionalLight(0xdcdff2,1.05);f.position.set(-10,60,-62);G.add(f);}// one fill bank (opposite the key) keeps every lit shader to two directional lights
 else{const f=new THREE.DirectionalLight(0xbfd4ff,.3);f.position.set(50,40,-30);G.add(f);}// sky fill from the side away from the sun, so the shade under the stand reads cool, not black
 // ----- pitch: mown stripes computed per pixel from world position, blade-level albedo/normal/roughness tiles,
 // macro patchiness + goalmouth wear from one small mask, and a view-dependent sheen (blades bent toward/away from camera) -----
 const a=W+7,b=L+8;// grass extends to the stand fronts
 const GT=grass(),wear=pitchMaps(P,a,b);const rep=new THREE.Vector2(2*a/1.25,2*b/1.25);
 const tile=t=>{const c=t.clone();c.repeat.copy(rep);c.needsUpdate=true;return c;};
 const nStr=P.size===5?10:18;
 const grassM=new THREE.MeshStandardMaterial({map:tile(GT.albedo),normalMap:tile(GT.normal),normalScale:new THREE.Vector2(.9,.9),roughnessMap:tile(GT.rough),roughness:1,metalness:0,envMapIntensity:night?.45:.42,color:night?0xd6e6d8:0xffffff});
 const lampU=out.lampU=[new V(),new V(),new V(),new V()];
 grassM.onBeforeCompile=sh=>{sh.uniforms.tWear={value:wear};sh.uniforms.uSz={value:new THREE.Vector4(a,b,L*2/nStr,W)};sh.uniforms.uNight={value:night?1:0};sh.uniforms.uWet={value:o.rain?1:0};sh.uniforms.uLamp={value:lampU};sh.uniforms.uSun={value:out.sun||new V(0,1,0)};sh.uniforms.uHi={value:(o.q??2)>=1?1:0};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D tWear;uniform vec4 uSz;uniform float uNight,uWet,uHi;uniform vec3 uLamp[4];uniform vec3 uSun;varying vec3 vWP;float gWr,gPud;
float ghs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float gvn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ghs(i),ghs(i+vec2(1.,0.)),f.x),mix(ghs(i+vec2(0.,1.)),ghs(i+vec2(1.,1.)),f.x),f.y);}`)
   .replace('#include <map_fragment>',`#include <map_fragment>
   {vec2 wu=vec2(vWP.x/(2.*uSz.x)+.5,.5-vWP.z/(2.*uSz.y));vec4 wm=texture2D(tWear,wu);
    // far-field: average the blade texture away so distant grass does not shimmer (mip + explicit fade)
    float dist=length(cameraPosition-vWP);float far=smoothstep(25.,120.,dist);
    vec3 base=mix(diffuseColor.rgb,vec3(.06,.2,.035),far*.5);
    float macro=(wm.g-.5)*.5;base*=1.+macro;
    // mowing: bands along the pitch length, each laid in the opposite direction across the pitch (x)
    float band=floor((vWP.z+uSz.z*.5)/uSz.z);float sz=mod(band,2.)*2.-1.;float bx=floor((vWP.x+60.)/7.);float sx=mod(bx,2.)*2.-1.;
    vec3 vd=normalize(cameraPosition-vWP);vec2 vh=normalize(vd.xz+1e-4);float graze=1.-vd.y;
    float stripe=sz*(.075+.2*graze*abs(vh.x))*sign(vh.x+1e-3)+sx*.025*(.4+graze);
    float inP=step(abs(vWP.x),uSz.w+3.)*step(abs(vWP.z),uSz.y-4.);base*=1.+stripe*mix(.5,1.,inP);
    // worn goalmouths: grass thins into dry soil, rougher and flatter
    gWr=smoothstep(.08,.85,wm.r);vec3 soil=vec3(.2,.15,.09)*(.7+.6*diffuseColor.g/.2);base=mix(base,mix(base*vec3(1.25,.92,.6),soil,smoothstep(.25,.9,gWr)),gWr*.92);
    // grazing sheen: a pale, slightly desaturated haze like blades catching the floodlights
    base=mix(base,base*vec3(1.05,1.1,.95),graze*graze*.5);
    // organic colour variation: soft patches of lusher / drier turf at a few scales, a faint yellow-blue drift
    float n1=gvn(vWP.xz*.085),n2=gvn(vWP.xz*.31+5.7),n3=gvn(vWP.xz*.045+13.);base*=.9+.13*n1+.07*n2;base.rg*=vec2(1.+(n3-.5)*.18,1.+(n3-.5)*.06);
    // floodlight pools at night: brighter turf toward each lamp bank, run-off beyond the lines falls into shade
    float pool=1.;if(uNight>.5){float pl=0.;for(int i=0;i<4;i++){vec2 d=uLamp[i].xz-vWP.xz;pl+=1./(1.+dot(d,d)/5200.);}pool=mix(.82,1.24,smoothstep(.95,1.75,pl));}
    float run=smoothstep(uSz.w+1.5,uSz.w+7.,abs(vWP.x))+smoothstep(uSz.y-8.,uSz.y-1.,abs(vWP.z));pool*=1.-.22*clamp(run,0.,1.)*uNight;base*=pool;
    // low sun: blades lit from behind the viewer glow (opposition sheen)
    if(uNight<.5){float op=max(dot(vd,normalize(uSun)),0.);base*=1.+.22*pow(op,5.)*(1.-gWr);}
    // rain: darker, saturated, with standing-water patches
    gPud=uWet*smoothstep(.58,.74,gvn(vWP.xz*.16+2.3))*(.4+.6*gWr);base*=1.-uWet*.3-gPud*.25;base=mix(base,base*vec3(.85,1.05,.9),uWet*.3);
    diffuseColor.rgb=base;}`)
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n normal=normalize(mix(normal,nonPerturbedNormal,gWr*.6+smoothstep(30.,140.,length(cameraPosition-vWP))*.5));')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,.98,gWr);roughnessFactor=mix(roughnessFactor,roughnessFactor*.62,uWet*(1.-gWr*.5));roughnessFactor=mix(roughnessFactor,.2,gPud);')
   .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   // floodlight glints on the blades (dry: soft broad sheen; wet: tight bright streaks), only MEDIUM+
   if(uHi>.5){vec3 vv=normalize(vViewPosition);float gl=0.;float ex=mix(10.,320.,uWet),k=mix(.035,.16,uWet);
    if(uNight>.5){for(int i=0;i<4;i++){vec3 ll=normalize((viewMatrix*vec4(uLamp[i]-vWP,0.)).xyz);float nh=max(dot(normal,normalize(ll+vv)),0.);gl+=pow(nh,ex);}}
    else{vec3 ll=normalize((viewMatrix*vec4(uSun,0.)).xyz);gl=pow(max(dot(normal,normalize(ll+vv)),0.),ex)*1.6;}
    totalEmissiveRadiance+=vec3(1.,.97,.9)*min(gl*k*(1.-gWr*.7)*(1.+gPud*1.4),.55);}`);};
 grassM.customProgramCacheKey=()=>'grass2';
 const grassG=new THREE.PlaneGeometry(2*a,2*b);
 const grassMesh=new THREE.Mesh(grassG,grassM);grassMesh.rotation.x=-Math.PI/2;grassMesh.receiveShadow=true;G.add(grassMesh);
 const under=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({color:night?0x0a0b0e:0x3b3d3a,roughness:1}));under.rotation.x=-Math.PI/2;under.position.y=-.05;G.add(under);
 // ----- lines (geometry: crisp at any zoom) -----
 {const lw=.12,q=[];const quad=(x0,z0,x1,z1)=>{const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz),ux=-dz/l,uz=dx/l,nx=ux*lw/2,nz=uz*lw/2;q.push(x0+nx,z0+nz,ux,uz,x1+nx,z1+nz,ux,uz,x1-nx,z1-nz,-ux,-uz,x0+nx,z0+nz,ux,uz,x1-nx,z1-nz,-ux,-uz,x0-nx,z0-nz,-ux,-uz);};
  const arc=(cx,cz,r,a0,a1,clip)=>{const n=Math.max(8,Math.ceil(Math.abs(a1-a0)*r/.5));for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n;if(clip&&!clip(cx+Math.cos(t0)*r,cz+Math.sin(t0)*r))continue;
   const ri=Math.max(0,r-lw/2),ro=r+lw/2,c0=Math.cos(t0),s0=Math.sin(t0),c1=Math.cos(t1),s1=Math.sin(t1);
   const ki=r>lw?1:0;q.push(cx+c0*ri,cz+s0*ri,-c0*ki,-s0*ki,cx+c1*ro,cz+s1*ro,c1,s1,cx+c1*ri,cz+s1*ri,-c1*ki,-s1*ki,cx+c0*ri,cz+s0*ri,-c0*ki,-s0*ki,cx+c0*ro,cz+s0*ro,c0,s0,cx+c1*ro,cz+s1*ro,c1,s1);}};
  const rect=(x0,z0,x1,z1)=>{quad(x0,z0,x1,z0);quad(x1,z0,x1,z1);quad(x1,z1,x0,z1);quad(x0,z1,x0,z0);};
  rect(-W,-L,W,L);quad(-W,0,W,0);arc(0,0,P.CR,0,Math.PI*2);arc(0,0,.18,0,Math.PI*2);arc(0,0,.09,0,Math.PI*2);
  for(const s of[-1,1]){const gl=s*L;quad(-P.BW,gl,-P.BW,gl-s*P.BD);quad(-P.BW,gl-s*P.BD,P.BW,gl-s*P.BD);quad(P.BW,gl-s*P.BD,P.BW,gl);
   quad(-P.SW,gl,-P.SW,gl-s*P.SD);quad(-P.SW,gl-s*P.SD,P.SW,gl-s*P.SD);quad(P.SW,gl-s*P.SD,P.SW,gl);
   const sp=gl-s*P.SPOT;arc(0,sp,.11,0,Math.PI*2);arc(0,sp,.05,0,Math.PI*2);arc(0,sp,P.CR,0,Math.PI*2,(x,z)=>s*(z-(gl-s*P.BD))<-.05);
   for(const sx of[-1,1])arc(sx*W,gl,1,0,Math.PI*2,(x,z)=>Math.abs(x)<=W+.01&&Math.abs(z)<=L+.01);}
  const pos=[],off=[];for(let i=0;i<q.length;i+=12){let[x0,z0,a0,b0,x1,z1,a1,b1,x2,z2,a2,b2]=q.slice(i,i+12);if((x1-x0)*(z2-z0)-(z1-z0)*(x2-x0)>0){[x1,z1,a1,b1,x2,z2,a2,b2]=[x2,z2,a2,b2,x1,z1,a1,b1];}pos.push(x0,.012,z0,x1,.012,z1,x2,.012,z2);off.push(a0,b0,a1,b1,a2,b2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const nrm=new Float32Array(pos.length);for(let i=1;i<nrm.length;i+=3)nrm[i]=1;g.setAttribute('normal',new THREE.BufferAttribute(nrm,3));g.setAttribute('aOff',new THREE.Float32BufferAttribute(off,2));
  const luv=[];for(let i=0;i<pos.length;i+=3)luv.push(pos[i]/1.25,-pos[i+2]/1.25);g.setAttribute('uv',new THREE.Float32BufferAttribute(luv,2));
  // painted lines: the blade normal + roughness show through the paint, edges slightly translucent
  const lnm=GT.normal.clone(),lrm=GT.rough.clone();lnm.needsUpdate=lrm.needsUpdate=true;
  const lm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:night?0xc4c8c2:0xe9ece6,roughness:.95,roughnessMap:lrm,normalMap:lnm,normalScale:new THREE.Vector2(.7,.7),transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));lm.receiveShadow=true;
  // far lines would thin below a pixel and break into dashes: widen them with distance and fade them to keep the same weight
  lm.material.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aOff;varying float vLw;').replace('#include <begin_vertex>','#include <begin_vertex>\n{vec3 wp=(modelMatrix*vec4(transformed,1.)).xyz;float w=max(0.,length(cameraPosition-wp)*.0024-.06);transformed.xz+=aOff*w;vLw=pow(.06/(.06+w),.7);}');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLw;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vLw;');};lm.material.customProgramCacheKey=()=>'lines2';lm.renderOrder=1;G.add(lm);}
 // ----- goals -----
 const netTex=netTexture();
 const postM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.1,envMapIntensity:.8});const barM=new THREE.MeshStandardMaterial({color:0xb8bcc4,roughness:.5,metalness:.6});
 for(const s of[-1,1]){const z=s*L,GW=P.GW,GH=P.GH,GD=P.GD,pr=.065;
  const pg=mergeG([[new THREE.CylinderGeometry(pr,pr,GH+pr,14),M4(-GW,(GH+pr)/2,z)],[new THREE.CylinderGeometry(pr,pr,GH+pr,14),M4(GW,(GH+pr)/2,z)],[new THREE.CylinderGeometry(pr,pr,2*GW+pr*2,14),M4(0,GH,z,0,0,Math.PI/2)]]);
  const post=new THREE.Mesh(pg,postM);post.castShadow=true;G.add(post);
  const bg=mergeG([[new THREE.CylinderGeometry(.03,.03,Math.hypot(GD,.18),6),M4(-GW,GH-.09,z+s*GD/2,s*Math.PI/2-Math.atan2(.18,GD)*s)],[new THREE.CylinderGeometry(.03,.03,Math.hypot(GD,.18),6),M4(GW,GH-.09,z+s*GD/2,s*Math.PI/2-Math.atan2(.18,GD)*s)],
   [new THREE.CylinderGeometry(.03,.03,GH-.18,6),M4(-GW,(GH-.18)/2,z+s*GD)],[new THREE.CylinderGeometry(.03,.03,GH-.18,6),M4(GW,(GH-.18)/2,z+s*GD)],[new THREE.CylinderGeometry(.03,.03,2*GW,6),M4(0,.03,z+s*GD,0,0,Math.PI/2)],
   [new THREE.CylinderGeometry(.03,.03,GD,6),M4(-GW,.03,z+s*GD/2,Math.PI/2)],[new THREE.CylinderGeometry(.03,.03,GD,6),M4(GW,.03,z+s*GD/2,Math.PI/2)]]);G.add(new THREE.Mesh(bg,barM));
  const cloth=new NetCloth(s,netTex);cloth.mesh.castShadow=(o.q??2)>=2;G.add(cloth.mesh);out.nets.push(cloth);
  // static side nets
  for(const sx of[-1,1]){const sg=new THREE.BufferGeometry();const p=[sx*GW,GH,z,sx*GW,GH-.18,z+s*GD,sx*GW,0,z+s*GD,sx*GW,0,z];sg.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
   sg.setAttribute('uv',new THREE.Float32BufferAttribute([0,GH/.13,GD/.13,(GH-.18)/.13,GD/.13,0,0,0],2));sg.setIndex([0,1,2,0,2,3]);sg.computeVertexNormals();{const sm=new THREE.Mesh(sg,cloth.mesh.material);sm.castShadow=cloth.mesh.castShadow;G.add(sm);}}}
 // ----- corner flags -----
 {const flagM=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uT:out.time,uC:{value:new THREE.Color(night?1.6:1.2,night?.45:.35,0)}},vertexShader:'uniform float uT;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin(uT*7.+p.x*9.)*.06*uv.x;p.x*=1.-.12*abs(sin(uT*3.));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform vec3 uC;varying vec2 vUv;void main(){gl_FragColor=vec4(uC*(.8+.2*vUv.y),1.);}'});const poleM=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.5});
  for(const sx of[-1,1])for(const sz of[-1,1]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.55,6),poleM);pole.position.set(sx*W,.775,sz*L);pole.castShadow=true;G.add(pole);
   const fl=new THREE.Mesh(new THREE.PlaneGeometry(.42,.3,6,1),flagM);fl.geometry.translate(.21,0,0);fl.position.set(sx*W,1.38,sz*L);fl.rotation.y=Math.atan2(-sx,-sz)+Math.PI/2;G.add(fl);}}
 // ----- LED advertising boards -----
 {// two rows of sponsors in one 1024x128 canvas (row 0 on the touchline boards, row 1 behind the goals), scrolling
  const rows=[[['STRIKER 11','#ffffff'],['◆','#ff4d00'],['PIXEL ARCADE','#ffcf3f'],['◆','#2ad1ff'],['VOLTWAVE','#9cff6a'],['◆','#ff4d00'],['ORBITAIR','#9ec0ff']],
   [['KITECORE','#ff8fd1'],['◆','#2ad1ff'],['MERIDIAN BANK','#ffffff'],['◆','#ffcf3f'],['NOVAPAY','#7dffcf'],['◆','#ff4d00'],['HALO','#ffd27a']]];
  const ads=ktex('ads',1024,128,(x,w,h)=>{x.fillStyle='#05060c';x.fillRect(0,0,w,h);
   rows.forEach((br,r)=>{const y0=r*64,g=x.createLinearGradient(0,y0,0,y0+64);g.addColorStop(0,'#101634');g.addColorStop(1,'#04050b');x.fillStyle=g;x.fillRect(0,y0,w,64);
    let fs=44;const tw=()=>{x.font=`${fs}px Anton, Impact, sans-serif`;return br.reduce((s2,[t])=>s2+x.measureText(t).width,0);};while(tw()>w-br.length*18&&fs>20)fs--;const gap=(w-tw())/br.length;
    x.textBaseline='middle';let px=gap/2;for(const[t,c]of br){x.fillStyle=c;x.shadowColor=c;x.shadowBlur=6;x.fillText(t,px,y0+35);px+=x.measureText(t).width+gap;}x.shadowBlur=0;});
   x.fillStyle='rgba(0,0,0,.32)';for(let i=0;i<w;i+=3)x.fillRect(i,0,1,h);});
  ads.repeat.set(1,1);out.ads=ads;const span=1024/64*.9;const bm=out.boardM=new THREE.MeshBasicMaterial({map:ads,color:new THREE.Color(night?1.12:1,night?1.12:1,night?1.12:1)}),back=new THREE.MeshStandardMaterial({color:0x15171d,roughness:.6});
  const segs=[[-W-3.6,-L-1,-W-3.6,L+1,0],[W+3.6,-L-1,W+3.6,L+1,0],[-W+2,-L-4.2,W-2,-L-4.2,1],[-W+2,L+4.2,W-2,L+4.2,1]];
  for(const[x0,z0,x1,z1,row]of segs){const len=Math.hypot(x1-x0,z1-z0),g=new THREE.BoxGeometry(len,.9,.12);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setX(i,uv.getX(i)*len/span);uv.setY(i,(row?0:.5)+uv.getY(i)*.5);}
   const m=new THREE.Mesh(g,[back,back,back,back,bm,bm]);m.position.set((x0+x1)/2,.45,(z0+z1)/2);m.rotation.y=Math.abs(x1-x0)<1?Math.PI/2:0;m.castShadow=true;G.add(m);}}
 // ----- stands (two tiers) + crowd -----
 const rc=14,N1=P.size===5?12:20,N2=P.size===5?10:16,d1=.85,r1=.42,d2=.85,r2=.6;const prof=[{s:0,y:0,v:0},{s:0,y:1.3,v:.1}];
 for(let i=0;i<N1;i++){prof.push({s:.4+i*d1,y:1.3+i*r1,v:i},{s:.4+i*d1,y:1.3+(i+1)*r1,v:i+.5});}const y1=1.3+N1*r1,s1=.4+N1*d1;
 prof.push({s:s1+1.6,y:y1,v:N1+1},{s:s1+1.6,y:y1+2.6,v:N1+2});const y2=y1+2.6,s2=s1+2.2;for(let i=0;i<N2;i++){prof.push({s:s2+i*d2,y:y2+i*r2,v:N1+3+i},{s:s2+i*d2,y:y2+(i+1)*r2,v:N1+3.5+i});}
 const sTop=s2+N2*d2,yTop=y2+N2*r2;prof.push({s:sTop+.8,y:yTop,v:N1+N2+4},{s:sTop+.8,y:yTop+4,v:N1+N2+5});
 const per=perimeter(a,b,rc,0,3);const near=(p)=>p.x<-a+1&&Math.abs(p.z)<b-rc*.2;
 // one texture tile = AISLE metres of one row: concrete riser (bottom half), tread with tip-up seats (top half), and a stepped aisle
 const AISLE=24,AW=1.4,seatT=ktex('seat',768,64,(x,w,h)=>{const pm=w/AISLE;x.fillStyle='#5a5f68';x.fillRect(0,h/2,w,h/2);x.fillStyle='#43474f';x.fillRect(0,0,w,h/2);
  for(let i=0;i<AISLE/.52;i++){const sx=AW*pm+i*.52*pm;if(sx>w-8)break;const c=['#1d3a6e','#22427a','#1a3363'][i%7?0:i%3];x.fillStyle=c;x.fillRect(sx+2,4,.44*pm,h*.36);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(sx+2,4,.44*pm,3);x.fillStyle='#14161b';x.fillRect(sx+4,h*.36+4,.36*pm,3);}
  x.fillStyle='#8d9098';x.fillRect(0,0,AW*pm,h);x.fillStyle='#6c6f77';x.fillRect(0,h/2-3,AW*pm,6);x.fillRect(0,h-4,AW*pm,4);x.fillStyle='#e8c040';x.fillRect(0,h/2-2,AW*pm,2);x.fillStyle='#b8bcc4';x.fillRect(2,0,3,h);x.fillRect(AW*pm-5,0,3,h);
  for(let i=0;i<1400;i++){x.fillStyle=`rgba(0,0,0,${rnd(.12)})`;x.fillRect(rnd(w),rnd(h),2,2);}});seatT.repeat.set(4/AISLE,1);
 const standM=new THREE.MeshStandardMaterial({color:night?0x737985:0xb4b8c0,map:seatT,roughness:.82,side:THREE.DoubleSide});
 const stands=new THREE.Mesh(sweep(per,prof),standM);stands.receiveShadow=true;stands.castShadow=!night;G.add(stands);
 // hospitality boxes band (glowing windows)
 {const win=ktex('win',256,32,(x,w,h)=>{x.fillStyle='#0b0d12';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){const g=x.createLinearGradient(0,4,0,h-4);g.addColorStop(0,'#ffe3b0');g.addColorStop(1,'#a07040');x.fillStyle=g;x.fillRect(i*32+3,6,26,h-12);}});
  const g=sweep(per,[{s:s1+1.55,y:y1+.2,v:0},{s:s1+1.55,y:y1+2.4,v:1}]);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:win,color:new THREE.Color(night?1.3:.75,night?1.25:.75,night?1.2:.75),side:THREE.DoubleSide}));G.add(m);}
 // ----- roof: a closed cantilevered ring over all four stands. Profiled sheet with panel seams and a translucent front
 // band, a deep fascia girder carrying a light strip, triangulated trusses at every bay and purlins between them
 // (truss web + purlins MEDIUM+), back columns. One sheet draw + one steel draw for the whole ring. -----
 {const hiQ=(o.q??2)>=1,R0={s:sTop+1,y:yTop+4.2},R1={s:8,y:yTop+6.5},ry=sv=>R0.y+(R0.s-sv)/(R0.s-R1.s)*(R1.y-R0.y);
  const roofT=ktex('roof',256,256,(x,w,h)=>{x.fillStyle='#c9cdd4';x.fillRect(0,0,w,h);
   for(let i=0;i<w;i+=8){x.fillStyle=i%32?'rgba(0,0,0,.08)':'rgba(0,0,0,.28)';x.fillRect(i,0,i%32?2:3,h);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(i+3,0,1,h);}// standing seams
   const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(40,44,52,.0)');g.addColorStop(.7,'rgba(40,44,52,.0)');g.addColorStop(.72,'rgba(170,205,230,.55)');g.addColorStop(1,'rgba(200,225,245,.6)');x.fillStyle=g;x.fillRect(0,0,w,h);// translucent front band
   for(let i=0;i<900;i++){x.fillStyle=`rgba(${rnd()<.5?0:255},${rnd()<.5?0:255},${rnd()<.5?0:255},${rnd(.05)})`;x.fillRect(rnd(w),rnd(h),rnd(6),rnd(3));}});
  const rp=[{s:R0.s,y:R0.y,v:0},{s:R1.s,y:R1.y,v:1}];const g=sweep(per,rp);
  const roof=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:roofT,color:night?0x6a707c:0xe2e5ea,roughness:.55,metalness:.35,side:THREE.DoubleSide}));roof.castShadow=!night;roof.receiveShadow=!night;G.add(roof);
  const steel=[],up=new V(0,1,0);const bar=(A,B,t,t2=t)=>{const d=B.clone().sub(A),l=d.length();if(l<1e-3)return;const m=new THREE.Matrix4().lookAt(A,B,Math.abs(d.y)>l*.99?new V(1,0,0):up);m.setPosition(A.clone().add(B).multiplyScalar(.5));steel.push([new THREE.BoxGeometry(t,t2,l),m]);};
  const at=(p,sv,y)=>new V(p.x+p.ox*sv,y,p.z+p.oz*sv);let nxt=0;
  // the gantry side keeps only the sheet, fascia and columns: truss webs and purlins there would hang in front of the TV camera
  const camSide=p=>p.x<-(a-rc*.5);
  for(const p of per){if(p.ub<nxt)continue;nxt=p.ub+9;
   // truss: top chord under the sheet, bottom chord rising to the tip, verticals + diagonals between (MEDIUM+)
   const A=at(p,R0.s,R0.y-.15),B=at(p,R1.s+.4,R1.y-.2),A2=at(p,R0.s,R0.y-3.2),B2=at(p,R1.s+.6,R1.y-1.1);bar(A,B,.32,.5);if(!camSide(p))bar(A2,B2,.26);
   if(hiQ&&!camSide(p)){const n=6;for(let i=0;i<=n;i++){const t=i/n,T1=A.clone().lerp(B,t),T2=A2.clone().lerp(B2,t);bar(T1,T2,.12);if(i<n){const U2=A2.clone().lerp(B2,(i+1)/n);bar(T1,U2,.1);}}}
   const C=at(p,R0.s-.1,0);bar(C,at(p,R0.s-.1,R0.y),.55);// back column
  }
  if(hiQ)for(const sv of[R0.s-4,R0.s-10,R0.s-16,R1.s+5]){const y=ry(sv)-.45;const g2=sweep(per,[{s:sv,y:y-.3,v:0},{s:sv,y,v:1},{s:sv+.25,y,v:1}],(p0,p1)=>camSide(p0)||camSide(p1));steel.push([g2,null]);}// purlins
  // fascia girder (front face + soffit)
  const fy0=R1.y-1.9,fy1=R1.y+.25;steel.push([sweep(per,[{s:R1.s-.15,y:fy1,v:0},{s:R1.s-.15,y:fy0,v:1},{s:R1.s+1.4,y:fy0+.4,v:1}]),null]);
  const rm=new THREE.Mesh(mergeG(steel),new THREE.MeshStandardMaterial({color:night?0x4a4f5a:0xb9bec6,roughness:.45,metalness:.7}));rm.castShadow=!night;G.add(rm);
  // light strip along the fascia
  const lip=sweep(per,[{s:R1.s-.2,y:fy0+.05,v:0},{s:R1.s-.2,y:fy0+.45,v:1}]);G.add(new THREE.Mesh(lip,new THREE.MeshBasicMaterial({color:night?new THREE.Color(2.6,2.5,2.3):new THREE.Color(.85,.86,.9),side:THREE.DoubleSide})));
  out.roofY=R1.y;
  // gantry over the near side: a thin truss that the TV cameras sit on
  const gt=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.2,2*b*.55),new THREE.MeshStandardMaterial({color:0x22252c,roughness:.7,metalness:.4}));gt.position.set(-a-sTop*.7,yTop+3,0);G.add(gt);}
 // crowd: one instanced draw. Supporters sit in sections: the home end and most of the main stands in home colours
 // (shirts, striped shirts, scarves), the away end in theirs, neutrals in between, and clumps of colour where groups of
 // friends sit together. Scarf-holders lift them overhead when their team scores (MEDIUM+). Colours are per instance.
 {const q=o.q??2,geo=crowdGeo(q);const kits=o.kits;const mat=new THREE.MeshLambertMaterial({color:0xffffff});
  mat.onBeforeCompile=sh=>{sh.uniforms.uRoof={value:new THREE.Vector2(y2,yTop)};sh.uniforms.uNb={value:night?.74:.88};// stands sit in less light than the pitchsh.uniforms.uT=out.time;sh.uniforms.uH=out.hypeH;sh.uniforms.uA=out.hypeA;sh.uniforms.uN=out.hype;
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uH,uA,uN,uNb;uniform vec2 uRoof;attribute float arm;attribute float fan;attribute float head;attribute float scf;attribute vec4 aC2;varying float vHead,vPh,vArm,vShade,vScf;varying vec3 vLoc;varying vec4 vC2;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
    vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453);
    vHead=head;vPh=ph;vArm=arm;vLoc=position;vC2=aC2;vScf=scf;vShade=mix(1.,.55,smoothstep(uRoof.x-1.,uRoof.y,ip.y))*mix(1.,.82,smoothstep(1.,uRoof.x-2.,ip.y))*(.86+.24*fract(ph*13.7))*uNb;float hy=fan>1.5?uA:fan>.5?uH:uN*.5;float ex=clamp(hy+uN*.35,0.,1.);
    float jb=max(0.,sin(uT*(5.+ph*4.)+ph*40.));float up=smoothstep(.15,.6,ex)*step(.25,ph+ex*.6);
    float hasS=mod(aC2.w,2.);float raise=clamp(ex*1.4-ph*.5,0.,1.)*up;raise=max(raise,hasS*step(.5,fan)*smoothstep(.3,.6,hy));
    if(scf>.5){float sw=sin(uT*7.+ph*30.);transformed.x+=sw*.05;transformed.y+=abs(sw)*.03;transformed*=hasS*step(.55,raise);}
    else{float ra=raise*arm;transformed.y=mix(transformed.y,1.16-transformed.y,ra);transformed.x*=1.+ra*.2;}
    transformed.y+=jb*jb*(.04+ex*.5)*(.5+ph)*up+up*.3;`);
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vHead,vPh,vArm,vShade,vScf;varying vec3 vLoc;varying vec4 vC2;').replace('#include <color_fragment>',`#include <color_fragment>
    float k=fract(vPh*7.31);vec3 skin=mix(vec3(.93,.72,.56),vec3(.32,.2,.13),k*k);float fl=vC2.w;
    if(vScf>.5)diffuseColor.rgb=mix(diffuseColor.rgb,vC2.rgb,step(.5,fract(vLoc.x*9.)));
    else if(vHead>.5){float hr=fract(vPh*3.17);diffuseColor.rgb=vLoc.y>.745-step(.8,hr)*.2?mix(vec3(.05,.04,.03),vec3(.55,.4,.22),step(.7,hr)):skin;if(vLoc.z<-.05&&vLoc.y>.62)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.06,.05,.04),step(.4,hr));
     if(fl>3.5&&vLoc.y>.73)diffuseColor.rgb=vC2.rgb;}
    else if(vArm>.5){if(vLoc.y<.36-step(.5,fract(vPh*5.3))*.12)diffuseColor.rgb=skin;}
    else if(vLoc.y<.11)diffuseColor.rgb=vec3(.1,.11,.14)*(1.+k);
    else{if(mod(floor(fl/2.),2.)>.5)diffuseColor.rgb=mix(diffuseColor.rgb,vC2.rgb,step(.5,fract(vLoc.x*11.)));
     if(mod(fl,2.)>.5&&vLoc.y>.47&&vLoc.z>-.02)diffuseColor.rgb=mix(diffuseColor.rgb,vC2.rgb,step(.5,fract(vLoc.y*30.)));}
    diffuseColor.rgb*=(.8+.2*smoothstep(.05,.6,vLoc.y))*vShade;`);};
  mat.customProgramCacheKey=()=>'crowd3';
  const den=o.crowd??1,pts=[],dk=q>=1?.95:.92,st=q>=1?.7:.72;const ring=(s,y,t,step)=>{for(const p of perimeter(a,b,rc,s,step)){if(rnd()>den*dk||p.ub%AISLE<AW+.2)continue;if(near(p)&&y>y2+6)continue;pts.push([p.x+rnd(.15),y,p.z+rnd(.15),Math.atan2(-p.ox,-p.oz),p,t]);}};
  for(let i=0;i<N1;i++)ring(.4+i*d1+.45,1.3+(i+1)*r1,0,st);for(let i=0;i<N2;i++)ring(s2+i*d2+.45,y2+(i+1)*r2,1,st);
  const mesh=new THREE.InstancedMesh(geo,mat,pts.length);const m4=new THREE.Matrix4(),qq=new THREE.Quaternion(),c=new THREE.Color(),c2=new THREE.Color();const fanA=new Float32Array(pts.length),k2=new Float32Array(pts.length*4);
  const pal=['#e9e7e0','#1b1c20','#2b2d35','#9a9ca4','#5a5e66','#2d4a7a','#7a2e2e','#c9b47a','#3f5a3e','#d4d2c8','#a83a2a','#e0c040','#4a6fa8','#6b4a32','#b0b4bc','#283548','#8a2340','#f4f4ee','#1f6e8c','#c87a30','#3a3a3a','#e86a8a','#62a8d8','#f0f0f0'];
  const cell=(u,t)=>{const h=Math.sin(Math.floor(u/7)*12.9898+t*78.233)*43758.5453;return h-Math.floor(h);};
  pts.forEach((p,i)=>{qq.setFromAxisAngle(new V(0,1,0),p[3]+(rnd()-.5)*.5);const sc=.88+rnd(.24);m4.compose(new V(p[0],p[1],p[2]),qq,new V(sc,sc*(.9+rnd(.2)),sc));mesh.setMatrixAt(i,m4);
   const homeEnd=p[2]<-(b-2),awayEnd=p[2]>b-2,awayPocket=!awayEnd&&p[2]>b-30&&p[0]>a-2&&p[5]===1;const cv=cell(p[4].ub,p[5]);
   const share=homeEnd?.86:awayEnd||awayPocket?0:cv<.42?.72:cv<.7?.38:.18,away=awayEnd?.8:awayPocket?.72:cv>.93?.5:0;
   const r=rnd();let fan=0,kit=null;if(r<away){fan=2;kit=kits[1];}else if(r<away+share*(1-away)){fan=1;kit=kits[0];}
   let fl=0;if(kit){const u=rnd();c.set(u<.62?kit.c1:u<.88?kit.c2:'#f2f2f2');c2.set(c.getHex()===new THREE.Color(kit.c1).getHex()?kit.c2:kit.c1);
    if(q>=1&&rnd()<(homeEnd||awayEnd?.55:.3))fl+=1;if(rnd()<.2)fl+=2;if(rnd()<.12)fl+=4;}
   else{c.set(pal[rnd(pal.length)|0]).multiplyScalar(.85);c2.set(pal[rnd(pal.length)|0]);if(rnd()<.08)fl+=2;if(rnd()<.06)fl+=4;}
   c.multiplyScalar(.72+rnd(.34));mesh.setColorAt(i,c);fanA[i]=fan;k2.set([c2.r,c2.g,c2.b,fl],i*4);});
  geo.setAttribute('fan',new THREE.InstancedBufferAttribute(fanA,1));geo.setAttribute('aC2',new THREE.InstancedBufferAttribute(k2,4));mesh.frustumCulled=false;mesh.receiveShadow=!night&&q>=1;G.add(mesh);out.crowd=mesh;out.crowdN=pts.length;
  // supporters' flags waved in the ends and in pockets along the sides (MEDIUM+): one instanced draw, cloth wave in the
  // vertex shader, a band in the club's second colour, wilder after goals
  const nF=q>=2?160:q>=1?70:0;if(nF){const fg=new THREE.PlaneGeometry(1.3,.85,10,2);fg.translate(.65,0,0);const fm=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
   fm.onBeforeCompile=sh=>{sh.uniforms.uT=out.time;sh.uniforms.uH=out.hypeH;sh.uniforms.uA=out.hypeA;sh.uniforms.uN=out.hype;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uH,uA,uN;attribute float fan;attribute vec4 aC2;varying vec2 vU;varying vec4 vF;').replace('#include <begin_vertex>',`#include <begin_vertex>
     vU=uv;vF=aC2;vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=fract(sin(dot(ip.xz,vec2(12.9,78.2)))*437.5);float ex=clamp((fan>1.5?uA:uH)+uN*.4,0.,1.);
     float sw=sin(uT*(1.4+ex*3.)+ph*6.3)*(.35+ex*.6);float x=transformed.x;transformed.z+=sin(x*3.2-uT*(5.+ex*5.)+ph*9.)*.12*x+sw*x*.5;transformed.y+=1.+ex*.6+sin(uT*2.+ph*7.)*.15-x*x*.05;`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vU;varying vec4 vF;').replace('#include <color_fragment>',`#include <color_fragment>
     float st=vF.w<.5?step(abs(vU.y-.5),.16):vF.w<1.5?step(.5,fract(vU.x*3.)):step(abs(vU.x-.5),.17);diffuseColor.rgb=mix(diffuseColor.rgb,vF.rgb,st);`);};
   fm.customProgramCacheKey=()=>'cflag2';
   const fl=new THREE.InstancedMesh(fg,fm,nF),fa=new Float32Array(nF),fc=new Float32Array(nF*4);const cand=pts.map((p,i)=>i).filter(i=>fanA[i]>0);
   for(let i=0;i<nF;i++){const j=cand.length?cand[rnd(cand.length)|0]:i,p=pts[j];const k=fanA[j]>1.5?1:0;m4.compose(new V(p[0],p[1]+.6,p[2]),qq.setFromAxisAngle(new V(0,1,0),p[3]+Math.PI/2+(rnd()-.5)),new V(1,1,1));fl.setMatrixAt(i,m4);
    const kt=kits[k];const sw=rnd()<.3;fl.setColorAt(i,c.set(sw?kt.c2:kt.c1).multiplyScalar(.9));c2.set(sw?kt.c1:kt.c2);if(c2.getHex()===c.getHex())c2.set('#f2f2f2');fc.set([c2.r,c2.g,c2.b,rnd(3)|0],i*4);fa[i]=k?2:1;}
   fg.setAttribute('fan',new THREE.InstancedBufferAttribute(fa,1));fg.setAttribute('aC2',new THREE.InstancedBufferAttribute(fc,4));fl.frustumCulled=false;G.add(fl);}
  // supporters' banners hung over the balcony in front of the hospitality boxes (MEDIUM+): one draw from one atlas
  if(q>=1){const hb=bannerTex(kits,o.names||['HOME','AWAY']);const pos=[],uv=[],nor=[];let nxt=4;
   for(const p of per){if(p.ub<nxt)continue;const end=Math.abs(p.z)>b-3,awayE=p.z>b-3;if(near(p)){nxt=p.ub+3;continue;}const wdt=end?8.5:7.5;nxt=p.ub+wdt+(end?1.2:5+rnd(8));
    const cellI=awayE?4+(rnd(4)|0):(rnd(4)|0),u0=(cellI%2)*.5,v0=1-(1+(cellI>>1))*.25;const tx=-p.oz,tz=p.ox,s0=s1+1.45,yT=y1+2.45,yB=yT-2.1;
    const A=[p.x+p.ox*s0,p.z+p.oz*s0];const P2=[A[0]+tx*wdt,A[1]+tz*wdt];
    const q4=[[A[0],yT,A[1],u0,v0+.25],[P2[0],yT,P2[1],u0+.5,v0+.25],[P2[0],yB,P2[1],u0+.5,v0],[A[0],yB,A[1],u0,v0]];
    for(const k of[0,2,1,0,3,2]){const v=q4[k];pos.push(v[0],v[1],v[2]);uv.push(v[3],v[4]);nor.push(-p.ox,0,-p.oz);}}
   const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bg.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
   G.add(new THREE.Mesh(bg,new THREE.MeshBasicMaterial({map:hb,side:THREE.DoubleSide,color:night?new THREE.Color(.92,.9,.86):new THREE.Color(.82,.82,.82)})));}
  // phone/camera flashes at night
  if(night){const fp=[],fr=[];for(let i=0;i<600;i++){const p=pts[rnd(pts.length)|0];fp.push(p[0],p[1]+1.3,p[2]);fr.push(rnd());}
   const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('ph',new THREE.Float32BufferAttribute(fr,1));
   G.add(new THREE.Points(fg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:out.time,uN:out.hype},
    vertexShader:'attribute float ph;uniform float uT,uN;varying float vA;void main(){float t=fract(uT*(.12+ph*.2+uN*.5)+ph*7.);vA=smoothstep(.975,1.,t);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(9.,vA*520./-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(3.)*vA*smoothstep(.5,0.,d),1.);}'})));}}
 // ----- floodlight towers: tapered steel lattice, lamp banks of individual reflectors, halo, light shafts (ULTRA night);
 // everything for all four towers is merged into a few draws -----
 {const towerM=new THREE.MeshStandardMaterial({color:0x3a3f4a,roughness:.55,metalness:.75});
  const lampT=ktex('lamp',64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,1,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.55,'#fff4dc');g.addColorStop(.8,'#9a958a');g.addColorStop(1,'#2a2a2a');x.fillStyle=g;x.fillRect(0,0,64,64);});
  const lampM=new THREE.MeshBasicMaterial({map:lampT,color:night?new THREE.Color(9,8.6,7.8):new THREE.Color(.6,.6,.62)});
  const glowT=ktex('glow',128,128,(x)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,235,1)');g.addColorStop(.12,'rgba(255,244,220,.55)');g.addColorStop(.4,'rgba(255,236,200,.1)');g.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=g;x.fillRect(0,0,128,128);},{clamp:true});
  const H=yTop+34,steel=[],lamps=[],beams=[];out.lamps=[];
  for(const[sx,sz]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const x=sx*(a+sTop*.62+6),z=sz*(b+sTop*.62+6),g=new THREE.Group();g.position.set(x,0,z);G.add(g);
   // lattice: four legs leaning in, braced with X diagonals every 4 m
   const r0=2.4,r1=.9,lv=Math.ceil(H/4);const leg=(i,y)=>{const r=r0+(r1-r0)*y/H,an=Math.PI/4+i*Math.PI/2;return new V(Math.cos(an)*r,y,Math.sin(an)*r);};
   const bar=(A,B,t)=>{const d=B.clone().sub(A),l=d.length(),m=new THREE.Matrix4().lookAt(A,B,new V(0,1,0).cross(d).lengthSq()<1e-6?new V(1,0,0):new V(0,1,0));m.setPosition(A.clone().add(B).multiplyScalar(.5));const gg=new THREE.BoxGeometry(t,t,l);gg.applyMatrix4(m);steel.push([gg,g]);};
   const lo=(o.q??2)===0;if(lo){const pg=new THREE.CylinderGeometry(.9,2.2,H,8);pg.translate(0,H/2,0);steel.push([pg,g]);}
   else for(let i=0;i<4;i++){bar(leg(i,0),leg(i,H),.34);for(let k=0;k<lv;k++){const y0=k*H/lv,y1=(k+1)*H/lv;bar(leg(i,y0),leg((i+1)%4,y1),.1);bar(leg((i+1)%4,y0),leg(i,y1),.1);bar(leg(i,y1),leg((i+1)%4,y1),.12);}}
   const head=new THREE.Group();head.position.y=H+2;g.add(head);head.lookAt(new V(-x*.4,-H*.9,-z*.4).add(new V(x,H,z)));
   const fr=new THREE.BoxGeometry(22,12,1.2);steel.push([fr,head]);const ws=new THREE.BoxGeometry(23,.4,3);ws.translate(0,6.4,.6);steel.push([ws,head]);// walkway
   if(lo){const pl=new THREE.PlaneGeometry(21.6,11.2);const uv=pl.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*8,uv.getY(k)*4);pl.translate(0,0,.66);lamps.push([pl,head]);}
   else for(let i=0;i<8;i++)for(let j=0;j<4;j++){const c=new THREE.CircleGeometry(1.05,14);c.translate(-9.45+i*2.7,-4.2+j*2.8,.66);lamps.push([c,head]);const hd=new THREE.CylinderGeometry(1.15,1.2,.5,14,1,true);hd.rotateX(Math.PI/2);hd.translate(-9.45+i*2.7,-4.2+j*2.8,.85);steel.push([hd,head]);}
   g.updateMatrixWorld(true);const hp=new V(0,0,1.5).applyMatrix4(head.matrixWorld);out.lamps.push(hp);if(out.lampU)out.lampU[out.lamps.length-1].copy(hp);
   if(night){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:0xfff2dd,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9,fog:false}));sp.scale.set(40,40,1);sp.position.copy(hp);G.add(sp);}
   if(night&&(o.q??2)>=2){// light shaft toward the far half of the pitch
    const tgt=new V(-x*.25,0,-z*.25),d=tgt.clone().sub(hp),l=d.length();const cg=new THREE.CylinderGeometry(9,30,l*.55,24,1,true);cg.translate(0,-l*.275,0);
    const m=new THREE.Matrix4().lookAt(d,new V(),new V(0,1,0));const rot=new THREE.Matrix4().makeRotationX(-Math.PI/2);m.multiply(rot);m.setPosition(hp);cg.applyMatrix4(m);beams.push(cg);}}
  // one steel mesh + one lamp mesh per tower, so towers behind the camera are frustum-culled
  const bake=list=>mergeG(list.map(([gg,par])=>{par.updateMatrixWorld(true);return[gg,par.matrixWorld];}));const byTower=(list,mat)=>{const groups=new Map();for(const e of list){let r=e[1];while(r.parent&&r.parent!==G)r=r.parent;if(!groups.has(r))groups.set(r,[]);groups.get(r).push(e);}for(const l of groups.values())G.add(new THREE.Mesh(bake(l),mat));};
  byTower(steel,towerM);byTower(lamps,lampM);
  if(beams.length){const bg=mergeG(beams.map(g=>[g,null]));const bm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uH:out.hype},
    vertexShader:'varying vec3 vN,vV;varying float vY,vD;void main(){vY=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.);vD=length(mv.xyz);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uH;varying vec3 vN,vV;varying float vY,vD;void main(){float f=abs(dot(vN,vV));float a=pow(f,2.2)*pow(vY,1.6)*.04*(1.+uH*.4)*smoothstep(25.,90.,vD)*smoothstep(46.,26.,cameraPosition.y);gl_FragColor=vec4(vec3(1.,.96,.88)*a,1.);}'});
   const bmsh=new THREE.Mesh(bg,bm);bmsh.renderOrder=3;G.add(bmsh);}}
 // ----- big screens on the end roofs -----
 {const jc=document.createElement('canvas');jc.width=512;jc.height=192;const jt=new THREE.CanvasTexture(jc);jt.colorSpace=THREE.SRGBColorSpace;out.screen={c:jc,t:jt};
  const fm=new THREE.MeshStandardMaterial({color:0x20232a,roughness:.6,metalness:.5});
  for(const sz of[-1,1]){const g=new THREE.Group();g.position.set(0,yTop+12,sz*(b+sTop-2));g.lookAt(0,yTop*.4,0);g.add(new THREE.Mesh(new THREE.BoxGeometry(26,10,1.2),fm));
   const sc=new THREE.Mesh(new THREE.PlaneGeometry(24.5,8.8),new THREE.MeshBasicMaterial({map:jt,color:new THREE.Color(night?1.4:1.1,night?1.4:1.1,night?1.4:1.1)}));sc.position.z=.65;g.add(sc);G.add(g);}}
 // ----- dugouts on the far touchline -----
 {const shell=new THREE.MeshStandardMaterial({color:0x1d2028,roughness:.5,metalness:.3}),glass=new THREE.MeshStandardMaterial({color:0x8fb0d0,transparent:true,opacity:.28,roughness:.05,metalness:.2});
  for(const s of[-1,1]){const g=new THREE.Group();g.position.set(W+5.4,0,s*(P.size===5?5:9));g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6,2.2,7),shell).translateX(.7).translateY(1.1));
   const roof=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,7,16,1,true,0,Math.PI/2),glass);roof.rotation.x=Math.PI/2;roof.rotation.z=Math.PI/2;roof.position.set(-.1,1.9,0);roof.scale.set(1,1,.9);if((o.q??2)>=1)g.add(roof);// LOW: no glass canopies (two draws fewer)
   g.add(new THREE.Mesh(new THREE.BoxGeometry(.8,.5,6.4),new THREE.MeshStandardMaterial({color:s<0?o.kits[0].c1:o.kits[1].c1,roughness:.6})).translateX(.2).translateY(.5));G.add(g);}}
 // ----- rain: streaks in a box that follows the play, one line draw; lit brighter at night by the floodlights -----
 if(o.rain){const n=[2200,4200,7000][o.q??2],pos=new Float32Array(n*6),sd=new Float32Array(n*6);
  for(let i=0;i<n;i++){const x=rnd(),y=rnd(),z=rnd();for(let k=0;k<2;k++){const j=(i*2+k)*3;pos[j]=k;pos[j+1]=0;pos[j+2]=0;sd[j]=x;sd[j+1]=y;sd[j+2]=z;}}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(pos,3));rg.setAttribute('seed',new THREE.BufferAttribute(sd,3));
  out.rainC={value:new V()};const rm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,uniforms:{uT:out.time,uC:out.rainC,uN:{value:night?1:0}},
   vertexShader:`attribute vec3 seed;uniform float uT;uniform vec3 uC;varying float vA;void main(){vec3 box=vec3(70.,34.,60.);float sp=18.+seed.x*6.;
    vec3 p=uC+(seed-.5)*box;p.y=uC.y+box.y*(1.-fract(seed.y+uT*sp/box.y))-6.;p.x+=uT*1.6*.0;vec3 vel=vec3(.9,-sp,.4);p+=position.x*vel*.028;
    vec4 mv=modelViewMatrix*vec4(p,1.);vA=(.35+.65*position.x)*smoothstep(90.,15.,-mv.z)*step(.0,p.y);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:'uniform float uN;varying float vA;void main(){gl_FragColor=vec4(vec3(.62,.68,.78)*(uN>.5?.4:.26)*vA,1.);}'});
  const rl=new THREE.LineSegments(rg,rm);rl.frustumCulled=false;rl.renderOrder=4;G.add(rl);}
 out.yTop=yTop;out.sTop=sTop;out.a=a;out.b=b;
 out.update=(dt,ball,cam)=>{out.time.value+=dt;if(out.rainC&&cam){out.rainC.value.copy(cam);out.rainC.value.y=Math.max(8,cam.y*.6);}if(out.ads)out.ads.offset.x=(out.time.value*.02)%1;
  if(out.goalT>0){out.goalT-=dt;const gt=out.goalTex;gt.offset.x=(out.time.value*.35)%1;out.boardM.color.setScalar((night?1.2:1)*(.75+.35*Math.abs(Math.sin(out.time.value*7))));if(out.goalT<=0){out.boardM.map=out.ads;out.boardM.color.setScalar(night?1.12:1);out.boardM.needsUpdate=true;}}for(const n of out.nets)n.step(Math.min(dt,1/30),ball);};
 // LED boards switch to a pulsing GOAL loop in the scorers' colours
 out.goalBoards=(c1,c2,txt)=>{const t=TC.goal||(TC.goal=ktex('goal',1024,128,()=>{}));const c=t.image,x=c.getContext('2d');
  for(let r=0;r<2;r++){const g=x.createLinearGradient(0,r*64,0,r*64+64);g.addColorStop(0,c1);g.addColorStop(1,'#05060c');x.fillStyle=g;x.fillRect(0,r*64,1024,64);
   x.font='46px Anton, Impact, sans-serif';x.textBaseline='middle';for(let i=0;i<4;i++){x.fillStyle=i%2?c2:'#ffffff';x.fillText(txt,12+i*256,r*64+35);}}x.fillStyle='rgba(0,0,0,.3)';for(let i=0;i<1024;i+=3)x.fillRect(i,0,1,128);
  t.needsUpdate=true;out.goalTex=t;out.boardM.map=t;out.boardM.needsUpdate=true;out.goalT=6;};
 out.dispose=()=>{scene.remove(G);G.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map&&!m.map.userData.keep&&!(m.map.source&&KEEP.has(m.map.source)))m.map.dispose();m.dispose();});}});};
 return out;}
// spectator: torso + head + two arms (arm vertices tagged so the shader can raise them)
function crowdGeo(q){// LOW: four boxes with shoulders tapered (no extra triangles); ULTRA: rounded torso, smooth head, seated thighs;
 // MEDIUM+: a scarf strip between the hands, collapsed unless the spectator holds one up
 const hi=q>=2;const parts=hi?[[(()=>{const g=new THREE.CylinderGeometry(.225,.19,.5,8,1,false);g.scale(1,1,.62);return g;})(),M4(0,.3,0),0,0],[(()=>{const g=new THREE.IcosahedronGeometry(.112,0);g.scale(.92,1.08,1);return g;})(),M4(0,.69,.02),0,1],
  [new THREE.BoxGeometry(.085,.4,.085),M4(.27,.38,0),1,0],[new THREE.BoxGeometry(.085,.4,.085),M4(-.27,.38,0),1,0],[new THREE.BoxGeometry(.36,.11,.38),M4(0,.08,.17),0,0]]
  :[[new THREE.BoxGeometry(.46,.5,.3),M4(0,.3,0),0,0],[new THREE.BoxGeometry(.21,.23,.21),M4(0,.68,.02),0,1],[new THREE.BoxGeometry(.1,.4,.1),M4(.29,.38,0),1,0],[new THREE.BoxGeometry(.1,.4,.1),M4(-.29,.38,0),1,0]];
 if(q>=1)parts.push([new THREE.PlaneGeometry(.66,.13),M4(0,1.0,.05),0,0,1]);
 const gs=parts.map(([g,m,a,h,sc=0])=>{g=g.index?g.toNonIndexed():g;const p0=g.attributes.position;
  if(!hi&&!a&&!h&&!sc)for(let i=0;i<p0.count;i++)if(p0.getY(i)>0)p0.setX(i,p0.getX(i)*.8);// sloped shoulders
  if(h){g.computeVertexNormals();const n=g.attributes.normal;for(let i=0;i<p0.count;i++){const v=new V(p0.getX(i),p0.getY(i),p0.getZ(i)).normalize();n.setXYZ(i,v.x,v.y,v.z);}}// smooth head
  g.applyMatrix4(m);const c=g.attributes.position.count;g.setAttribute('arm',new THREE.Float32BufferAttribute(new Float32Array(c).fill(a),1));g.setAttribute('head',new THREE.Float32BufferAttribute(new Float32Array(c).fill(h),1));g.setAttribute('scf',new THREE.Float32BufferAttribute(new Float32Array(c).fill(sc),1));return g;});
 let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),arm=new Float32Array(n),hd=new Float32Array(n),sf=new Float32Array(n);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);arm.set(g.attributes.arm.array,o);hd.set(g.attributes.head.array,o);sf.set(g.attributes.scf.array,o);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('arm',new THREE.BufferAttribute(arm,1));r.setAttribute('head',new THREE.BufferAttribute(hd,1));r.setAttribute('scf',new THREE.BufferAttribute(sf,1));return r;}

// supporters' banners: 8 cells (4 home, 4 away) in one 512x256 canvas (drawn at half scale), redrawn per match (club colours + names)
const BAN={c:null,t:null};
function bannerTex(kits,names){if(!BAN.c){BAN.c=document.createElement('canvas');BAN.c.width=512;BAN.c.height=256;BAN.t=new THREE.CanvasTexture(BAN.c);BAN.t.colorSpace=THREE.SRGBColorSpace;BAN.t.anisotropy=4;BAN.t.userData.keep=true;}
 const x=BAN.c.getContext('2d'),draw=()=>{x.setTransform(.5,0,0,.5,0,0);x.clearRect(0,0,1024,512);
  for(let i=0;i<8;i++){const k=kits[i<4?0:1],nm=(names[i<4?0:1]||'').toUpperCase(),X0=(i%2)*512,Y0=((i>>1))*128;
   const txt=[nm,'★ '+nm+' ★','ULTRAS','FOREVER '+nm][i%4];x.fillStyle=i%2?k.c2:k.c1;x.fillRect(X0,Y0,512,128);
   x.fillStyle=i%2?k.c1:k.c2;x.fillRect(X0,Y0+8,512,10);x.fillRect(X0,Y0+110,512,10);if(i%4===2){for(let j=0;j<512;j+=64)x.fillRect(X0+j,Y0+18,24,92);}
   let fs=78;x.font=`${fs}px Anton, Impact, sans-serif`;while(x.measureText(txt).width>470&&fs>30){fs-=2;x.font=`${fs}px Anton, Impact, sans-serif`;}
   x.textAlign='center';x.textBaseline='middle';x.lineWidth=8;x.strokeStyle='rgba(0,0,0,.35)';x.strokeText(txt,X0+256,Y0+66);const bc=new THREE.Color(i%2?k.c2:k.c1),lu=bc.r*.3+bc.g*.59+bc.b*.11;x.fillStyle=lu>.55?'#121212':'#ffffff';x.fillText(txt,X0+256,Y0+66);
   // cloth: weave + sag shading
   const g=x.createLinearGradient(X0,0,X0+512,0);g.addColorStop(0,'rgba(0,0,0,.22)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.22)');x.fillStyle=g;x.fillRect(X0,Y0,512,128);}
  BAN.t.needsUpdate=true;};draw();if(document.fonts&&document.fonts.status!=='loaded')document.fonts.ready.then(draw);return BAN.t;}
