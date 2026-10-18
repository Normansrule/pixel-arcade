// DUSTWATER — the natural world's look: a culled + LOD instance scatter, the layered terrain material (sand, cracked
// earth, pebbles, dry-grass ground, banded sandstone cliffs with desert varnish), saguaros, foliage cards that sway,
// yucca, ocotillo, snags, layered sandstone boulders, hoodoos, spires and balanced rocks. Everything is generated in code.
import * as THREE from '../vendor/three.module.min.js';
import {V,M,merge,cl,lerp,smooth,rng,loft,lumpy,wuv,tnoise} from './util.js';

/* ---------------- instance scatter: per-frame distance + view culling with level-of-detail ---------------- */
const _e=new THREE.Matrix4();
export class Scatter{
 // levels: [{d, parts:[{geo,mat,shadow}]}] nearest first; items: [{x,z,e:Float32Array(16),c?:[r,g,b]}]
 constructor(scene,levels,items,o={}){this.items=items;this.k=1;this.t=0;this.last=new V(1e9,0,1e9);this.lf=new V();this.force=true;this.n=items.length;
  this.levels=levels.map(L=>({d:L.d,meshes:L.parts.map(p=>{const im=new THREE.InstancedMesh(p.geo,p.mat,Math.max(1,items.length));im.count=0;im.frustumCulled=false;im.castShadow=!!p.shadow;im.receiveShadow=p.receive!==false;
   if(o.colors)im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1,items.length)*3).fill(1),3);if(p.order)im.renderOrder=p.order;scene.add(im);return im;})}));}
 setScale(k){this.k=k;this.force=true;}
 // LOW quality: detail-only scatters hide, LOW-only stand-ins show, the rest draw everything with their cheapest level (one draw call)
 setLow(l){this.single=l&&this.levels.length>1;this.hidden=(this.hideLow&&l)||(this.onlyLow&&!l);for(const L of this.levels)for(const im of L.meshes)im.visible=!this.hidden;this.force=true;}
 update(cam,fwd,dt){if(this.hidden)return;this.t-=dt;const mv=Math.hypot(cam.x-this.last.x,cam.z-this.last.z),tn=1-(fwd.x*this.lf.x+fwd.z*this.lf.z);
  if(!this.force&&this.t>0&&mv<4&&tn<.05)return;if(!this.force&&mv<.6&&tn<.01&&this.t>-2)return;this.force=false;this.t=.3;this.last.copy(cam);const fl=Math.hypot(fwd.x,fwd.z)||1;this.lf.set(fwd.x/fl,0,fwd.z/fl);
  const cx=cam.x,cz=cam.z,fx=fwd.x/fl,fz=fwd.z/fl,Ls=this.levels,D2=Ls.map((L,i)=>this.single&&i<Ls.length-1?-1:(L.d*this.k)**2),cnt=Ls.map(()=>0);
  for(let i=0;i<this.n;i++){const it=this.items[i],dx=it.x-cx,dz=it.z-cz,d2=dx*dx+dz*dz;let li=-1;for(let l=0;l<Ls.length;l++)if(d2<D2[l]){li=l;break;}if(li<0)continue;
   if(d2>2500&&dx*fx+dz*fz<-.25*Math.sqrt(d2))continue;const k=cnt[li]++;for(const im of Ls[li].meshes){im.instanceMatrix.array.set(it.e,k*16);if(im.instanceColor&&it.c)im.instanceColor.array.set(it.c,k*3);}}
  Ls.forEach((L,i)=>L.meshes.forEach(im=>{im.count=cnt[i];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;}));}
 get drawn(){let n=0;for(const L of this.levels)n+=L.meshes[0].count;return n;}}
export const item=(x,y,z,ry,s,c,sy=s,rx=0,rz=0)=>({x,z,e:new Float32Array(M(x,y,z,rx,ry,rz,s,sy,s).elements),c});

/* ---------------- data textures (no canvas premultiply issues) ---------------- */
function dtex(data,n,srgb){const t=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;}
// tileable worley edges: returns [f1, f2-f1] per pixel
function worley(n,cells,seed){const r=rng(seed),pts=new Float32Array(cells*cells*2);for(let i=0;i<cells*cells;i++){pts[i*2]=r();pts[i*2+1]=r();}const out=new Float32Array(n*n*2),cs=n/cells;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const gx=Math.floor(x/cs),gy=Math.floor(y/cs);let d1=9,d2=9;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const cx=(gx+ox+cells)%cells,cy=(gy+oy+cells)%cells,px=(gx+ox+pts[(cy*cells+cx)*2])*cs,py=(gy+oy+pts[(cy*cells+cx)*2+1])*cs,d=Math.hypot(px-x,py-y)/cs;if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
  out[(y*n+x)*2]=d1;out[(y*n+x)*2+1]=d2-d1;}return out;}
function nrm(h,n,str){const o=new Float32Array(n*n*2),H=(x,y)=>h[((y+n)%n)*n+((x+n)%n)];for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=(H(x+1,y)-H(x-1,y))*str,dy=(H(x,y+1)-H(x,y-1))*str,l=Math.hypot(dx,dy,1);o[(y*n+x)*2]=-dx/l;o[(y*n+x)*2+1]=-dy/l;}return o;}
// terrain detail: R sand ripples, G cracked earth plates, B pebbles, A grain / rock noise; two packed normal textures
export function terrainTextures(n=512){const sz=n*n,r=rng(12),f1=tnoise(n,8,5,4),f2=tnoise(n,16,9,3),f3=tnoise(n,4,13,3),W=worley(n,10,7);
 const sand=new Float32Array(sz),crack=new Float32Array(sz),peb=new Float32Array(sz),grain=new Float32Array(sz);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,u=x/n,v=y/n,warp=f3[i]*6.28;sand[i]=.5+.32*Math.sin((u*9+v*3)*6.2832+warp*1.4)*(.4+.6*f1[i])+(f2[i]-.5)*.35;
  const e=W[i*2+1],plate=smooth(.015,.07,e);crack[i]=plate*(.75+.25*smooth(0,.35,e))*(.85+.15*f2[i]);grain[i]=f1[i]*.6+f2[i]*.4;}
 for(let k=0;k<1400;k++){const cx=r()*n,cy=r()*n,rad=1.5+r()*r()*7,h=.5+r()*.5;for(let y=Math.floor(cy-rad);y<=cy+rad;y++)for(let x=Math.floor(cx-rad);x<=cx+rad;x++){const d=Math.hypot(x-cx,y-cy)/rad;if(d>=1)continue;const i=((y+n)%n)*n+((x+n)%n);peb[i]=Math.max(peb[i],h*Math.sqrt(1-d*d));}}
 const det=new Uint8Array(sz*4);for(let i=0;i<sz;i++){det[i*4]=cl(sand[i],0,1)*255;det[i*4+1]=cl(crack[i],0,1)*255;det[i*4+2]=cl(peb[i],0,1)*255;det[i*4+3]=cl(grain[i],0,1)*255;}
 const nS=nrm(sand,n,3),nC=nrm(crack,n,5),nP=nrm(peb,n,6),nG=nrm(grain,n,7),a=new Uint8Array(sz*4),b=new Uint8Array(sz*4);
 for(let i=0;i<sz;i++){a[i*4]=(nS[i*2]*.5+.5)*255;a[i*4+1]=(nS[i*2+1]*.5+.5)*255;a[i*4+2]=(nC[i*2]*.5+.5)*255;a[i*4+3]=(nC[i*2+1]*.5+.5)*255;b[i*4]=(nP[i*2]*.5+.5)*255;b[i*4+1]=(nP[i*2+1]*.5+.5)*255;b[i*4+2]=(nG[i*2]*.5+.5)*255;b[i*4+3]=(nG[i*2+1]*.5+.5)*255;}
 return{det:dtex(det,n),n1:dtex(a,n),n2:dtex(b,n)};}
// the terrain material: vertex colour = macro tint, aSplat = (cracked earth, grassy ground, pebbles, packed road)
export function terrainMaterial(T,hq){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0,envMapIntensity:.45});m.userData.T=T;
 m.onBeforeCompile=s=>{s.uniforms.tDet={value:T.det};s.uniforms.tN1={value:T.n1};s.uniforms.tN2={value:T.n2};
  s.vertexShader='attribute vec4 aSplat;varying vec4 vSp;varying vec3 vWP;varying vec3 vWN;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSp=aSplat;vWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  s.fragmentShader=`uniform sampler2D tDet,tN1,tN2;varying vec4 vSp;varying vec3 vWP;varying vec3 vWN;float tRough;vec2 tNrm;
   float hb(float a,float b,float t){return smoothstep(t-.12,t+.12,a-b);}
`+s.fragmentShader.replace('#include <map_fragment>',`
   vec2 uv=vWP.xz*.23,uv2=vWP.xz*.041+vec2(.31,.67);vec4 D=texture2D(tDet,uv),D2=texture2D(tDet,uv2),N1=texture2D(tN1,uv)*2.-1.,N2=texture2D(tN2,uv)*2.-1.,N1b=texture2D(tN1,uv2)*2.-1.;
   vec3 base=diffuseColor.rgb;float mac=D2.a;
   float wC=hb(vSp.x+D2.g*.35,.55,.0),wG=hb(vSp.y+mac*.3,.5,.0),wP=hb(vSp.z+D.b*.6,.62,.0),wR=vSp.w;float flat0=1.-smoothstep(.08,.24,1.-normalize(vWN).y);wC*=flat0;wP*=mix(.4,1.,flat0);
   vec3 sandC=base*(.86+.24*D.r)*(.92+.16*mac);
   vec3 crackC=base*vec3(.86,.77,.67)*mix(.6,1.02,D.g)*(.9+.2*mac);
   vec3 grassC=mix(base*vec3(.86,.82,.62),base*vec3(.7,.66,.5),D.a)*(.9+.2*D.r);
   vec3 pebC=mix(base*.82,vec3(.56,.44,.36)*(.7+.6*D.a),smoothstep(.15,.5,D.b))*(.85+.3*D.b);
   vec3 roadC=base*vec3(1.04,.97,.9)*(.9+.12*D.a);
   vec3 c=sandC;vec2 tn=N1.xy*(.9-wR*.5)+N1b.xy*.6;float ro=.95;
   c=mix(c,grassC,wG);tn=mix(tn,N2.zw*.6,wG);ro=mix(ro,.97,wG);
   c=mix(c,crackC,wC);tn=mix(tn,N1.zw*1.2,wC);ro=mix(ro,.9,wC);
   c=mix(c,pebC,wP);tn=mix(tn,N2.xy*1.4,wP);ro=mix(ro,.84,wP);
   c=mix(c,roadC,wR*.85);ro=mix(ro,.97,wR);tn=mix(tn,N2.zw*.45+N1.xy*.15,wR*.9);
   // wheel ruts + hoof-churned centre on the main street
   {float rz=abs(vWP.z+sin(vWP.x*.07)*.35);float rut=(smoothstep(.42,.08,abs(rz-1.15))+smoothstep(.38,.06,abs(rz-3.6))*.6)*smoothstep(150.,120.,abs(vWP.x))*wR;
    float hoof=smoothstep(.9,0.,abs(vWP.z+sin(vWP.x*.05)*.5-2.4))*smoothstep(.4,.7,D.b)*wR;
    c*=1.-rut*.22-hoof*.08;tn.y+=sign(rz-1.15)*rut*.35;ro=mix(ro,.99,rut);}
   // banded sandstone with desert varnish on steep ground
   float stp=smoothstep(.24,.5,1.-normalize(vWN).y);float bnd=vWP.y*.95+sin(vWP.x*.045)*1.6+sin(vWP.z*.039+1.)*1.6;float s1=fract(bnd*.16);
   vec3 sc=mix(vec3(.55,.22,.11),vec3(.78,.42,.24),smoothstep(.15,.45,s1));sc=mix(sc,vec3(.9,.68,.48),smoothstep(.72,.92,s1)*.75);sc=mix(sc,vec3(.42,.17,.09),smoothstep(.05,0.,abs(s1-.6))*.6);
   // triplanar rock face: fractured blocks (stretched worley plates), grain, desert-varnish streaks running down
   vec3 an=abs(normalize(vWN));float bx=an.x/(an.x+an.z+1e-4);vec2 pA=vec2(vWP.z,vWP.y),pB=vec2(vWP.x,vWP.y);
   vec4 RA=texture2D(tDet,pA*vec2(.11,.42)),RB=texture2D(tDet,pB*vec2(.11,.42)),R2A=texture2D(tDet,pA*.031+.4),R2B=texture2D(tDet,pB*.031+.4);
   vec4 QA=texture2D(tN1,pA*vec2(.11,.42)),QB=texture2D(tN1,pB*vec2(.11,.42));vec4 R=mix(RB,RA,bx),R2=mix(R2B,R2A,bx);vec2 rq=mix(QB.zw,QA.zw,bx)*2.-1.;
   float vs=mix(texture2D(tDet,vec2(vWP.z*.11,vWP.y*.008)).a,texture2D(tDet,vec2(vWP.x*.11,vWP.y*.008)).a,1.-bx);
   float varn=smoothstep(.5,.78,vs)*smoothstep(.25,.8,fract(bnd*.16+.35));
   sc*=(.66+.44*R.a)*(.82+.3*R2.a)*mix(.93,1.,R.g)*(1.-varn*.55);sc=mix(sc,sc*vec3(.75,.7,.72),smoothstep(.6,.9,R2.b)*.4);
   // break up the cake-layer look: noise-warped thin sub-beds, overhang shadow under each ledge, vertical joints, cooler weathered tone
   float wb=vWP.y*2.6+(R2.a-.5)*5.+(R.a-.5)*1.2;float sub=fract(wb*.5);sc*=.86+.18*smoothstep(.0,.25,sub)*smoothstep(1.,.7,sub);
   float ledge=smoothstep(.08,.0,s1)+smoothstep(.97,1.,s1);sc*=1.-ledge*.38;
   float jt=smoothstep(.06,.0,abs(fract(mix(vWP.x,vWP.z,bx)*.09+R2.r*.6)-.5)-.44)*smoothstep(.45,.75,R2.a);sc*=1.-jt*.3;
   sc=mix(sc,vec3(dot(sc,vec3(.3,.55,.15)))*vec3(1.08,.92,.82),.32);
   c=mix(c,sc,stp);tn=mix(tn,rq*.35+N2.zw*1.2+N1.xy*.4+vec2(0.,(sub-.5)*.6),stp);ro=mix(ro,.86,stp);
   // wet sand band at the water line
   float wet=smoothstep(${'1.9'},${'1.25'},vWP.y)*(1.-stp);c*=1.-wet*.38;ro=mix(ro,.45,wet);
   diffuseColor.rgb=c;tRough=ro;tNrm=tn*${hq?'1.':'0.55'};`).replace('#include <roughnessmap_fragment>','float roughnessFactor=tRough;')
   .replace('#include <normal_fragment_maps>',`{vec3 nw=normalize(vWN);vec3 tw=normalize(vec3(1.,0.,0.)-nw*nw.x),bw=normalize(cross(tw,nw));vec3 pn=normalize(nw+tw*tNrm.x*.9+bw*tNrm.y*.9);normal=normalize((viewMatrix*vec4(pn,0.)).xyz);}`);};
 return m;}

/* ---------------- foliage cards ---------------- */
// alpha-tested leaf cluster texture (colour everywhere, alpha = mask) + a twig/leaf variant for desert scrub
export function leafTex(kind,seed){const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),r=rng(seed);x.fillStyle='#000';x.fillRect(0,0,n,n);x.fillStyle='#fff';x.strokeStyle='#fff';
 if(kind==='scrub'){for(let i=0;i<26;i++){const a=-Math.PI/2+(r()-.5)*2.2,L=n*(.25+r()*.25),sx=n/2+(r()-.5)*30,sy=n*.98;x.lineWidth=1.2+r();x.beginPath();x.moveTo(sx,sy);const ex=sx+Math.cos(a)*L,ey=sy+Math.sin(a)*L;x.quadraticCurveTo(sx+(ex-sx)*.3,sy+(ey-sy)*.6,ex,ey);x.stroke();
   for(let k=0;k<26;k++){const t=r(),px=sx+(ex-sx)*t+(r()-.5)*14,py=sy+(ey-sy)*t+(r()-.5)*14;x.beginPath();x.ellipse(px,py,2+r()*3.4,1.2+r()*1.6,r()*3,0,7);x.fill();}}}
 else{for(let i=0;i<420;i++){const a=r()*6.28,d=Math.sqrt(r())*n*.44,px=n/2+Math.cos(a)*d,py=n/2+Math.sin(a)*d*.85;x.save();x.translate(px,py);x.rotate(r()*6.28);x.beginPath();x.ellipse(0,0,4+r()*5,2.2+r()*2.5,0,0,7);x.fill();x.restore();}
  x.lineWidth=2;for(let i=0;i<8;i++){x.beginPath();x.moveTo(n/2,n*.9);x.lineTo(n/2+(r()-.5)*n*.7,n*.15+r()*n*.5);x.stroke();}}
 const m=x.getImageData(0,0,n,n).data,col=tnoise(n,6,seed+3,3),d=new Uint8Array(n*n*4);
 for(let i=0;i<n*n;i++){const v=180+col[i]*75,lum=m[i*4]/255;d[i*4]=v;d[i*4+1]=v;d[i*4+2]=v;d[i*4+3]=lum>.45?255:lum*255;}return dtex(d,n,true);}
// wind sway for instanced vegetation: displacement grows with local height, phase from the instance position
export function sway(mat,U,amt=.06,stiff=1.2){mat.onBeforeCompile=s=>{s.uniforms.uT=U.uT;s.uniforms.uWind=U.uWind;s.vertexShader='uniform float uT,uWind;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
  #else
  vec3 ip=vec3(0.);
  #endif
  float hh=max(0.,position.y);float ph=ip.x*.13+ip.z*.17;float w=(sin(uT*1.7+ph)*.6+sin(uT*3.3+ph*1.7+position.x*2.)*.25+sin(uT*.6+ph*.3)*.5)*uWind;
  transformed.x+=w*${amt.toFixed(3)}*pow(hh,${stiff.toFixed(2)});transformed.z+=w*${(amt*.5).toFixed(3)}*pow(hh,${stiff.toFixed(2)})*sin(uT*1.1+ph);`);};mat.customProgramCacheKey=()=>'sway'+amt+stiff;return mat;}
// a ring of crossed foliage cards around a centre with normals bent outward (soft, volumetric lighting)
export function cards(list,col,o={}){const out=[];for(const[cx,cy,cz,w,h,ry,tilt]of list){const g=new THREE.PlaneGeometry(w,h,2,2);g.translate(0,h/2-(o.sink||0)*h,0);g.applyMatrix4(M(cx,cy,cz,tilt||0,ry,0));
  const p=g.attributes.position,nn=g.attributes.normal;for(let i=0;i<p.count;i++){const d=new V(p.getX(i)-(o.cx??0),(p.getY(i)-(o.cy??cy))*.8+.35,p.getZ(i)-(o.cz??0)).normalize();nn.setXYZ(i,d.x,d.y,d.z);}out.push([g,null,col]);}return out;}

/* ---------------- saguaro / small plants ---------------- */
const ribL=(S,seg,ribs,amp)=>{const g=loft(S,seg,{up:[0,1,0],sub:2}),p=g.attributes.position;// ribs: radial modulation around each ring
 const ns=seg,rings=p.count/ns|0;for(let rI=0;rI<rings;rI++){let cx=0,cy=0,cz=0;for(let j=0;j<ns;j++){const k=rI*ns+j;if(k>=p.count)break;cx+=p.getX(k);cy+=p.getY(k);cz+=p.getZ(k);}cx/=ns;cy/=ns;cz/=ns;
  for(let j=0;j<ns;j++){const k=rI*ns+j;if(k>=p.count)break;const f=1+amp*Math.cos(j/ns*Math.PI*2*ribs);p.setXYZ(k,cx+(p.getX(k)-cx)*f,cy+(p.getY(k)-cy)*f,cz+(p.getZ(k)-cz)*f);}}g.computeVertexNormals();return g;};
export function saguaroGeo(v,lod){const seg=lod?8:20,ribs=lod?0:10,amp=lod?0:.07,H=[5.2,6.4,4.2,7.2][v],R=[.36,.42,.32,.44][v];
 const trunk=(h,r)=>ribL([{c:[0,-.3,0],rx:r*1.04,ry:r*1.04},{c:[0,h*.3,0],rx:r,ry:r},{c:[0,h*.8,0],rx:r*.97,ry:r*.97},{c:[0,h-.25*r,0],rx:r*.8,ry:r*.8},{c:[0,h+.06,0],rx:r*.25,ry:r*.25}],seg,ribs,amp);
 const arm=(s,y,out,up,r,ry=0)=>{const pts=[[0,0],[out*.45,-.05],[out,.18],[out*1.08,.6],[out*1.08,up*.7],[out*1.06,up]],c=Math.cos(ry),sn=Math.sin(ry),S=pts.map(([a,b],i)=>({c:[s*a*c,y+b,s*a*sn],rx:r*(i<2?.92:1)*(i===5?.3:1),ry:r*(i<2?.92:1)*(i===5?.3:1)}));return ribL(S,seg,ribs,amp*.8);};
 const P=[[trunk(H,R),null,0x5c7d3c]];const A=[[[1,H*.45,1.1,2.1,R*.68,.2],[-1,H*.55,.9,1.6,R*.62,-.3]],[[1,H*.4,1.2,2.6,R*.7,.1],[-1,H*.5,1,2.2,R*.66,.4],[1,H*.62,.8,1.4,R*.55,1.9]],[],[[1,H*.38,1.3,3,R*.72,-.4],[-1,H*.48,1.15,2.8,R*.7,.3],[1,H*.6,.9,1.9,R*.62,1.6],[-1,H*.66,.8,1.5,R*.55,-1.8]]][v];
 for(const a of A)P.push([arm(...a),null,0x5f803e]);const g=merge(P);// lighter growing tips, darker base
 const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const y=p.getY(i),k=lerp(.62,1.08,smooth(-.2,H*.5,y));c.setXYZ(i,c.getX(i)*k,c.getY(i)*k*(1+.04*smooth(H*.8,H,y)),c.getZ(i)*k);}return g;}
export function yuccaGeo(seed){const r=rng(seed),P=[];for(let i=0;i<34;i++){const a=r()*6.28,t=.25+r()*1.15,L=.7+r()*.5,g=new THREE.ConeGeometry(.045,L,3,1);g.translate(0,L/2,0);g.scale(1,1,.35);P.push([g,M(Math.cos(a)*.05,.05,Math.sin(a)*.05,Math.cos(a+1.57)*0,0,0).multiply(M(0,0,0,0,-a+Math.PI/2,0)).multiply(M(0,0,0,t*.85,0,0)),i%3?0x6a7a48:0x7d8a52]);}
 P.push([new THREE.SphereGeometry(.2,6,4),M(0,.08,0,0,0,0,1,.5,1),0x4a5432]);return merge(P);}
export function ocotilloGeo(seed){const r=rng(seed),P=[];for(let i=0;i<11;i++){const a=r()*6.28,t=.12+r()*.32,L=2.6+r()*2.2,g=new THREE.CylinderGeometry(.018,.035,L,4,4);g.translate(0,L/2,0);const p=g.attributes.position;for(let k=0;k<p.count;k++){const y=p.getY(k);p.setX(k,p.getX(k)+Math.sin(y*.9+i)*.06*y/L);}g.computeVertexNormals();
  P.push([g,M(Math.cos(a)*.08,0,Math.sin(a)*.08,0,-a,0).multiply(M(0,0,0,t,0,0)),i%2?0x4a4a3a:0x55553f]);P.push([new THREE.ConeGeometry(.04,.3,4),M(0,0,0,0,-a,0).multiply(M(0,0,0,t,0,0)).multiply(M(0,L+.1,0)),0xb0402a]);}return merge(P);}
export function snagGeo(seed){const r=rng(seed),P=[];const tr=loft([{c:[0,-.2,0],rx:.22,ry:.2},{c:[.05,1.2,.02],rx:.15,ry:.14},{c:[.2,2.6,.0],rx:.09,ry:.09},{c:[.35,3.6,.05],rx:.035,ry:.035}],7,{sub:2});P.push([tr,null,0x8a8278]);
 for(let i=0;i<5;i++){const y=1+r()*2.2,a=r()*6.28,L=.8+r()*1.2,b=loft([{c:[0,0,0],rx:.07,ry:.07},{c:[L*.5,L*.35,0],rx:.045,ry:.045},{c:[L,L*.55+(r()-.5)*.4,0],rx:.015,ry:.015}],5,{sub:1});b.applyMatrix4(M(.05,y,0,0,a,0));P.push([b,null,0x7a7268]);}return merge(P);}

/* ---------------- rocks ---------------- */
// layered sandstone boulder: noisy icosphere, flattened base, horizontal strata ledges baked into shape and colour
export function boulderGeo(seed,det=3,o={}){const r=rng(seed),g=new THREE.IcosahedronGeometry(1,det),p=g.attributes.position,ph=[r()*9,r()*9,r()*9,r()*9],sx=.8+r()*.5,sz=.8+r()*.5,sy=o.sy??(.55+r()*.35);
 const map=new Map();for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),key=x.toFixed(3)+','+y.toFixed(3)+','+z.toFixed(3);let q=map.get(key);
  if(!q){const n=Math.sin(x*2.1+ph[0])*Math.cos(z*1.9+ph[1])*.16+Math.sin(x*4.3+y*3.1+ph[2])*.07+Math.sin(z*5.7+x*3.3+ph[3])*.05,k=1+n;let X=x*k*sx,Y=y*k*sy,Z=z*k*sz;
   const st=o.strata??.24;if(st){const b=Y/st,fr=b-Math.floor(b);const ledge=smooth(.0,.25,fr)*(1-smooth(.75,1,fr));const inset=1-.06*(1-ledge);X*=inset;Z*=inset;}
   if(o.clip){const c=o.clip*sy;if(Y>c)Y=c+(Y-c)*.15;if(Y<-c)Y=-c+(Y+c)*.15;}else if(Y<-.25*sy){Y=-.25*sy+(Y+.25*sy)*.25;}q=[X,Y,Z];map.set(key,q);}p.setXYZ(i,q[0],q[1],q[2]);}
 const gi=merge([[g.index?g.toNonIndexed():g,null,o.col??0xc08060]]);const nonIdx=gi;// smooth normals: weld by position
 nonIdx.computeVertexNormals();const P=nonIdx.attributes.position,N=nonIdx.attributes.normal,acc=new Map();for(let i=0;i<P.count;i++){const k=P.getX(i).toFixed(3)+','+P.getY(i).toFixed(3)+','+P.getZ(i).toFixed(3);const a=acc.get(k)||[0,0,0];a[0]+=N.getX(i);a[1]+=N.getY(i);a[2]+=N.getZ(i);acc.set(k,a);}
 for(let i=0;i<P.count;i++){const a=acc.get(P.getX(i).toFixed(3)+','+P.getY(i).toFixed(3)+','+P.getZ(i).toFixed(3)),l=Math.hypot(a[0],a[1],a[2])||1;N.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}
 const C=nonIdx.attributes.color;for(let i=0;i<P.count;i++){const y=P.getY(i),b=y*4.2+Math.sin(P.getX(i)*1.3)*.3,s=.86+.16*Math.sin(b*3.1)+.08*Math.sin(b*7.3),ao=lerp(.55,1.05,smooth(-.3*sy,.6*sy,y));C.setXYZ(i,C.getX(i)*s*ao,C.getY(i)*s*ao*.97,C.getZ(i)*s*ao*.94);}
 wuv(nonIdx,.6);return nonIdx;}
// hoodoo / spire / balanced rock: stacks of layered sandstone blocks, narrowing (or bulging) with height, hard cap rock on top
export function stackGeo(seed,kind,det=2){const r=rng(seed),P=[];let y=0,ox=0,oz=0;const n=kind==='spire'?11:kind==='hoodoo'?6:2;
 for(let i=0;i<n;i++){const t=i/(n-1||1);let rad,hh;
  if(kind==='spire'){rad=(1.25-.55*t+.12*(r()-.5))*1.6;hh=1.9+r()*.6;}else if(kind==='hoodoo'){rad=(i===n-1?1.15:.95-.35*t+.25*Math.sin(i*2.1+seed)*.5);hh=i===n-1?.9:1.3+r()*.5;}else{rad=i?2.3:1.2;hh=i?2.2:3.2;}
  const g=boulderGeo(seed*13+i,det,{sy:1,clip:.62,strata:.2,col:kind!=='balance'&&i===n-1?0x9a6448:0xc07a4e});g.applyMatrix4(M(ox,y+hh*.5,oz,0,r()*6.28,0,rad,hh*.82,rad*(.85+r()*.3)));P.push([g,null,null]);y+=hh*.82;ox+=(r()-.5)*.25;oz+=(r()-.5)*.25;}
 const g=merge(P);g.userData.h=y;return g;}
// rock detail: grain + strata scratches, used with world-ish box UVs
export function rockTex(){const n=256,f=tnoise(n,6,41,5),g=tnoise(n,24,7,2),W=worley(n,7,43),d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,s=.5+.5*Math.sin(y/n*6.2832*7+f[i]*4),s2=.5+.5*Math.sin(y/n*6.2832*23+f[i]*7+g[i]*2);const cr=smooth(.012,.06,W[i*2+1]+g[i]*.03);const v=(140+f[i]*80+g[i]*38-s*30-s2*12)*(.84+.16*cr);d[i*4]=d[i*4+1]=d[i*4+2]=cl(v,0,255);d[i*4+3]=255;}
 const t=dtex(d,n,true),h=new Float32Array(n*n);for(let i=0;i<n*n;i++)h[i]=d[i*4]/255;const nn=nrm(h,n,4.5),nd=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){nd[i*4]=(nn[i*2]*.5+.5)*255;nd[i*4+1]=(nn[i*2+1]*.5+.5)*255;nd[i*4+2]=255;nd[i*4+3]=255;}
 // normal z from xy
 for(let i=0;i<n*n;i++){const x=nn[i*2],y=nn[i*2+1];nd[i*4+2]=(Math.sqrt(Math.max(0,1-x*x-y*y))*.5+.5)*255;}return{map:t,normal:dtex(nd,n)};}
