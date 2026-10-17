// GLOSS RIOT — the ink layer. Every visible face of every map solid (box tops and sides, ramp tops) gets its own
// rectangle in one texture atlas at TD texels per metre. Splats write team ink into a CPU copy (R = team 0, G = team 1)
// with soft, noisy blob edges; only the touched rectangles are re-uploaded with texSubImage2D. Floor texels keep live
// turf counts per team (the Turf Control score), and the level material renders glossy, bumped ink from the atlas.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl} from './util.js';

export const TD=4;
const AW=1024,CELL=4;
const hash=(i,j)=>{let h=Math.imul(i,374761393)+Math.imul(j,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
function vnoise(x,y){const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const tv=new V();

export class Paint{
 constructor(D,palette){this.D=D;const W=D.W;this.faces=[];this.grid=new Map();this.fgrid=new Map();
  // ---- faces ----
  const inside=(x,y,z)=>{let hit=false;W.query(x,z,x,z,b=>{if(!b.c&&x>b.a[0]&&x<b.b[0]&&y>b.a[1]&&y<b.b[1]&&z>b.a[2]&&z<b.b[2]){hit=true;return false;}});return hit;};
  const add=(o,U,Vv,floor,src,nop)=>{const lu=U.length(),lv=Vv.length();if(lu<.05||lv<.05)return null;const f={o,u:U.clone().divideScalar(lu),v:Vv.clone().divideScalar(lv),lu,lv,n:new V().crossVectors(U,Vv).normalize(),floor,src,nop:!!nop,
    w:Math.max(1,Math.ceil(lu*TD-.01)),h:Math.max(1,Math.ceil(lv*TD-.01)),id:this.faces.length};
   // skip faces buried inside another solid (sample a few points just outside the face)
   let vis=0;for(const[a,b]of[[.5,.5],[.15,.15],[.85,.15],[.15,.85],[.85,.85]]){tv.copy(o).addScaledVector(f.u,lu*a).addScaledVector(f.v,lv*b).addScaledVector(f.n,.06);if(!inside(tv.x,tv.y,tv.z))vis++;}
   if(!vis)return null;this.faces.push(f);return f;};
  for(const b of D.solids){if(b.o.novis)continue;const[ax,ay,az]=b.a,[bx,by,bz]=b.b,dx=bx-ax,dy=by-ay,dz=bz-az,np=b.o.nopaint;b.f=[];
   b.f[3]=add(new V(ax,by,bz),new V(dx,0,0),new V(0,0,-dz),true,b,np);
   b.f[0]=add(new V(ax,ay,az),new V(0,0,dz),new V(0,dy,0),false,b,np);b.f[1]=add(new V(bx,ay,bz),new V(0,0,-dz),new V(0,dy,0),false,b,np);
   b.f[4]=add(new V(bx,ay,az),new V(-dx,0,0),new V(0,dy,0),false,b,np);b.f[5]=add(new V(ax,ay,bz),new V(dx,0,0),new V(0,dy,0),false,b,np);
   for(const f of b.f)if(f)f.mat=b.mat;}
  this.rampSides=[];
  for(const r of D.ramps){const P=(x,z)=>new V(x,W.rampH(r,x,z),z);const o=P(r.x0,r.z1);r.face=add(o,P(r.x1,r.z1).sub(o),P(r.x0,r.z0).sub(o),true,r,false);if(r.face)r.face.mat=r.mat;
   const yb=Math.min(r.y0,r.y1);const c=[[r.x0,r.z0],[r.x1,r.z0],[r.x1,r.z1],[r.x0,r.z1]];// closing sides (unpainted)
   for(let k=0;k<4;k++){const[x1,z1]=c[k],[x2,z2]=c[(k+1)%4];this.rampSides.push([new V(x1,yb,z1),new V(x2,yb,z2),P(x2,z2),P(x1,z1)]);}}
  // ---- atlas (shelf packing, 1 texel padding) ----
  const pk=this.faces.filter(f=>!f.nop).sort((a,b)=>b.h-a.h);let cx=0,cy=0,rh=0;
  for(const f of pk){if(cx+f.w+2>AW){cx=0;cy+=rh;rh=0;}f.x=cx+1;f.y=cy+1;cx+=f.w+2;rh=Math.max(rh,f.h+2);}
  const AH=Math.max(4,Math.ceil((cy+rh)/4)*4);this.AW=AW;this.AH=AH;
  this.data=new Uint8Array(AW*AH*2);this.owner=new Uint8Array(AW*AH);this.mask=new Uint8Array(AW*AH);this.total=0;this.cnt=[0,0,0];
  for(const f of pk){for(let j=0;j<f.h;j++)for(let i=0;i<f.w;i++)this.mask[(f.y+j)*AW+f.x+i]=f.floor?1:2;if(f.floor)this.total+=f.w*f.h;}
  this.cnt[0]=this.total;
  // ---- spatial hash of faces (xz bounds) ----
  for(const f of this.faces){if(f.nop)continue;const xs=[f.o.x,f.o.x+f.u.x*f.lu,f.o.x+f.v.x*f.lv,f.o.x+f.u.x*f.lu+f.v.x*f.lv],zs=[f.o.z,f.o.z+f.u.z*f.lu,f.o.z+f.v.z*f.lv,f.o.z+f.u.z*f.lu+f.v.z*f.lv];
   f.bx=[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)];
   for(let i=Math.floor((f.bx[0]-.5)/CELL);i<=Math.floor((f.bx[1]+.5)/CELL);i++)for(let j=Math.floor((f.bx[2]-.5)/CELL);j<=Math.floor((f.bx[3]+.5)/CELL);j++){const k=i*4096+j;let l=this.grid.get(k);if(!l)this.grid.set(k,l=[]);l.push(f);if(f.floor){let m=this.fgrid.get(k);if(!m)this.fgrid.set(k,m=[]);m.push(f);}}}
  this.tex=new THREE.DataTexture(this.data,AW,AH,THREE.RGFormat,THREE.UnsignedByteType);this.tex.magFilter=this.tex.minFilter=THREE.LinearFilter;this.tex.generateMipmaps=false;this.tex.needsUpdate=true;
  this.dirty=[];this.full=true;this.stamp=0;
  this.U={tPaint:{value:this.tex},uColA:{value:new THREE.Color()},uColB:{value:new THREE.Color()},uBump:{value:1.6},uT:{value:0}};
  this.setColors(palette);
  this._mini();this._zones();}
 setColors(p){this.cols=p;this.U.uColA.value.set(p[0]);this.U.uColB.value.set(p[1]);}
 reset(){this.data.fill(0);this.owner.fill(0);this.cnt=[this.total,0,0];this.full=true;this.dirty.length=0;}
 _near(x,z,r,fn){const st=++this.stamp;for(let i=Math.floor((x-r)/CELL);i<=Math.floor((x+r)/CELL);i++)for(let j=Math.floor((z-r)/CELL);j<=Math.floor((z+r)/CELL);j++){const l=this.grid.get(i*4096+j);if(!l)continue;for(const f of l){if(f.s===st)continue;f.s=st;fn(f);}}}
 // paint a soft noisy disc of radius r around p for team t (0/1). Returns floor texels newly won by t.
 splat(p,r,t,str=1,floorOnly=false){let gained=0;const AWl=AW,data=this.data,own=this.owner,mask=this.mask,cnt=this.cnt,team=t+1;const seed=(p.x*7.13+p.z*3.71)%97;
  this._near(p.x,p.z,r,f=>{if(floorOnly&&!f.floor)return;const dx=p.x-f.o.x,dy=p.y-f.o.y,dz=p.z-f.o.z;const d=dx*f.n.x+dy*f.n.y+dz*f.n.z;if(d>r*.95||d<-Math.min(.45,r*.6))return;
   const re=Math.sqrt(Math.max(0,r*r-d*d*.8));if(re<.08)return;const lu=dx*f.u.x+dy*f.u.y+dz*f.u.z,lv=dx*f.v.x+dy*f.v.y+dz*f.v.z;if(lu<-re||lu>f.lu+re||lv<-re||lv>f.lv+re)return;
   const i0=Math.max(-1,Math.floor((lu-re)*TD)),i1=Math.min(f.w,Math.ceil((lu+re)*TD)),j0=Math.max(-1,Math.floor((lv-re)*TD)),j1=Math.min(f.h,Math.ceil((lv+re)*TD));if(i0>i1||j0>j1)return;
   for(let j=j0;j<=j1;j++){const cv=cl((j+.5)/TD,0,f.lv)-lv;for(let i=i0;i<=i1;i++){const cu=cl((i+.5)/TD,0,f.lu)-lu;const dist=Math.sqrt(cu*cu+cv*cv);if(dist>re*1.25)continue;
     const nz=vnoise((f.x+i)*.42+seed,(f.y+j)*.42)*.7+vnoise((f.x+i)*1.1,(f.y+j)*1.1+seed)*.3;const e=re*(.72+.5*nz);let s=(e-dist)/(e*.28+.06);if(s<=0)continue;if(s>1)s=1;const v=s*255*str|0;
     const idx=(f.y+j)*AWl+f.x+i,k=idx*2;const a=data[k+t],b=data[k+1-t];if(v<=a&&b===0)continue;data[k+t]=v>a?v:a;data[k+1-t]=b>v?b-v:0;
     const A=data[k],Bv=data[k+1],no=A>=110&&A>Bv?1:Bv>=110&&Bv>A?2:0;if(no!==own[idx]){if(mask[idx]===1){cnt[own[idx]]--;cnt[no]++;if(no===team)gained++;}own[idx]=no;}}}
   this._dirty(f.x+i0,f.y+j0,i1-i0+1,j1-j0+1);});
  return gained;}
 _dirty(x,y,w,h){const d=this.dirty;for(const r of d){if(x<r[0]+r[2]+2&&x+w+2>r[0]&&y<r[1]+r[3]+2&&y+h+2>r[1]){const x0=Math.min(r[0],x),y0=Math.min(r[1],y);r[2]=Math.max(r[0]+r[2],x+w)-x0;r[3]=Math.max(r[1]+r[3],y+h)-y0;r[0]=x0;r[1]=y0;return;}}d.push([x,y,w,h]);}
 // upload touched rectangles only
 flush(R){if(!this.dirty.length&&!this.full)return;const p=R.properties.get(this.tex);const gl=R.getContext();
  if(this.full||!p.__webglTexture||!(gl instanceof WebGL2RenderingContext)||this.dirty.length>48){this.tex.needsUpdate=true;this.full=false;this.dirty.length=0;return;}
  R.state.bindTexture(gl.TEXTURE_2D,p.__webglTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.pixelStorei(gl.UNPACK_ROW_LENGTH,AW);
  for(const[x,y,w,h]of this.dirty){const x0=cl(x,0,AW-1),y0=cl(y,0,this.AH-1),ww=Math.min(AW-x0,w),hh=Math.min(this.AH-y0,h);if(ww<=0||hh<=0)continue;gl.pixelStorei(gl.UNPACK_SKIP_PIXELS,x0);gl.pixelStorei(gl.UNPACK_SKIP_ROWS,y0);gl.texSubImage2D(gl.TEXTURE_2D,0,x0,y0,ww,hh,gl.RG,gl.UNSIGNED_BYTE,this.data);}
  gl.pixelStorei(gl.UNPACK_ROW_LENGTH,0);gl.pixelStorei(gl.UNPACK_SKIP_PIXELS,0);gl.pixelStorei(gl.UNPACK_SKIP_ROWS,0);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);this.dirty.length=0;}
 // ---- queries ----
 texel(f,p){const dx=p.x-f.o.x,dy=p.y-f.o.y,dz=p.z-f.o.z;const i=cl(Math.floor((dx*f.u.x+dy*f.u.y+dz*f.u.z)*TD),0,f.w-1),j=cl(Math.floor((dx*f.v.x+dy*f.v.y+dz*f.v.z)*TD),0,f.h-1);return(f.y+j)*AW+f.x+i;}
 // owner (0 none, 1 team0, 2 team1) of the walkable surface at p (feet)
 floorAt(p,tol=.3){const l=this.fgrid.get(Math.floor(p.x/CELL)*4096+Math.floor(p.z/CELL));if(!l)return null;let best=null,bd=tol;
  for(const f of l){if(p.x<f.bx[0]-.01||p.x>f.bx[1]+.01||p.z<f.bx[2]-.01||p.z>f.bx[3]+.01)continue;const dx=p.x-f.o.x,dy=p.y-f.o.y,dz=p.z-f.o.z;const d=Math.abs(dx*f.n.x+dy*f.n.y+dz*f.n.z);if(d<bd){bd=d;best=f;}}return best;}
 ownerAt(p,tol){const f=this.floorAt(p,tol);return f?this.owner[this.texel(f,p)]:0;}
 // owner of the wall a ray hit (World.ray out with b + n)
 wallOwner(ho,p){if(!ho||!ho.b||!ho.b.f)return 0;const n=ho.n;const k=Math.abs(n.x)>.5?(n.x<0?0:1):Math.abs(n.z)>.5?(n.z<0?4:5):n.y>0?3:-1;const f=k>=0?ho.b.f[k]:null;if(!f||f.nop)return 0;return this.owner[this.texel(f,p)];}
 share(){const t=this.total||1;return[this.cnt[1]/t,this.cnt[2]/t];}
 // ---- minimap: topmost floor texel per half-metre cell ----
 _mini(){const[x0,x1,z0,z1]=this.D.def.bounds,S=.5,w=Math.ceil((x1-x0)/S),h=Math.ceil((z1-z0)/S);this.mm={x0,z0,S,w,h,idx:new Int32Array(w*h).fill(-1),ht:new Float32Array(w*h)};const p=new V();
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){p.set(x0+(i+.5)*S,0,z0+(j+.5)*S);const l=this.fgrid.get(Math.floor(p.x/CELL)*4096+Math.floor(p.z/CELL));if(!l)continue;let best=null,by=-1e9;
   for(const f of l){if(p.x<f.bx[0]||p.x>f.bx[1]||p.z<f.bx[2]||p.z>f.bx[3])continue;// height of the face plane at (x,z)
    const y=f.o.y-((p.x-f.o.x)*f.n.x+(p.z-f.o.z)*f.n.z)/f.n.y;if(y>by){by=y;best=f;}}
   if(best){p.y=by;this.mm.idx[j*w+i]=this.texel(best,p);this.mm.ht[j*w+i]=by;}}
  const c=document.createElement('canvas');c.width=w;c.height=h;this.mmCanvas=c;this.mmImg=c.getContext('2d').createImageData(w,h);}
 drawMini(){const m=this.mm,d=this.mmImg.data,A=new THREE.Color(this.cols[0]),B=new THREE.Color(this.cols[1]);const ca=[A.r*255,A.g*255,A.b*255],cb=[B.r*255,B.g*255,B.b*255];
  for(let k=0;k<m.w*m.h;k++){const ix=m.idx[k],o=k*4;if(ix<0){d[o+3]=0;continue;}const ow=this.owner[ix],sh=cl(.82+m.ht[k]*.06,.6,1.08);
   if(ow===1){d[o]=ca[0];d[o+1]=ca[1];d[o+2]=ca[2];}else if(ow===2){d[o]=cb[0];d[o+1]=cb[1];d[o+2]=cb[2];}else{d[o]=d[o+1]=d[o+2]=200*sh;d[o+2]=210*sh;}d[o+3]=255;}
  this.mmCanvas.getContext('2d').putImageData(this.mmImg,0,0);return this.mmCanvas;}
 // ---- zones: list of floor texels inside each zone rectangle ----
 _zones(){this.zoneIdx=[];for(const z of this.D.zones){const out=[];const p=new V();for(const f of this.faces){if(!f.floor||f.nop)continue;
   for(let j=0;j<f.h;j++)for(let i=0;i<f.w;i++){p.copy(f.o).addScaledVector(f.u,(i+.5)/TD).addScaledVector(f.v,(j+.5)/TD);if(p.x>z.x0&&p.x<z.x1&&p.z>z.z0&&p.z<z.z1&&Math.abs(p.y-z.y)<.6)out.push((f.y+j)*AW+f.x+i);}}
  this.zoneIdx.push(Int32Array.from(out));}}
 zoneShare(k){const l=this.zoneIdx[k];if(!l||!l.length)return[0,0];let a=0,b=0;for(const i of l){const o=this.owner[i];if(o===1)a++;else if(o===2)b++;}return[a/l.length,b/l.length];}

 /* ---------- level geometry + ink material ---------- */
 build(pal,detail){const groups={floor:[],wall:[]};const col=new THREE.Color();
  for(const f of this.faces){const g=f.floor?groups.floor:groups.wall;const c=pal[f.mat]||pal.floor;col.set(c);// face shading variety
   const k=f.floor?1:(.94+.06*Math.abs(f.n.x));g.push({f,c:col.clone().multiplyScalar(k)});}
  const mk=(list,extra)=>{const n=list.length*4+(extra?extra.length*4:0);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),puv=new Float32Array(n*2),loc=new Float32Array(n*4),cola=new Float32Array(n*3),idx=[];let v=0;
   const quad=(P,N,UVs,PU,L,C)=>{for(let q=0;q<4;q++){pos.set([P[q].x,P[q].y,P[q].z],(v+q)*3);nor.set([N.x,N.y,N.z],(v+q)*3);uv.set(UVs[q],(v+q)*2);puv.set(PU[q],(v+q)*2);loc.set(L[q],(v+q)*4);cola.set([C.r,C.g,C.b],(v+q)*3);}idx.push(v,v+1,v+2,v,v+2,v+3);v+=4;};
   for(const{f,c}of list){const U=f.u.clone().multiplyScalar(f.lu),Vv=f.v.clone().multiplyScalar(f.lv);const P=[f.o.clone(),f.o.clone().add(U),f.o.clone().add(U).add(Vv),f.o.clone().add(Vv)];
    const wuv=f.floor?P.map(p=>[p.x*.25,-p.z*.25]):[[0,f.o.y*.25],[f.lu*.25,f.o.y*.25],[f.lu*.25,(f.o.y+f.lv)*.25],[0,(f.o.y+f.lv)*.25]];
    const PU=f.nop?[[-1,-1],[-1,-1],[-1,-1],[-1,-1]]:[[f.x/AW,f.y/this.AH],[(f.x+f.lu*TD)/AW,f.y/this.AH],[(f.x+f.lu*TD)/AW,(f.y+f.lv*TD)/this.AH],[f.x/AW,(f.y+f.lv*TD)/this.AH]];
    const L=[[0,0,f.lu,f.lv],[f.lu,0,f.lu,f.lv],[f.lu,f.lv,f.lu,f.lv],[0,f.lv,f.lu,f.lv]];quad(P,f.n,wuv,PU,L,c);}
   if(extra)for(const q of extra){const N=new V().subVectors(q[2],q[0]).cross(new V().subVectors(q[3],q[1]));if(!(N.lengthSq()>1e-8))continue;N.normalize();const L=[[0,0,9,9],[9,0,9,9],[9,9,9,9],[0,9,9,9]];
    quad(q,N,q.map(p=>[(p.x+p.z)*.25,p.y*.25]),[[-1,-1],[-1,-1],[-1,-1],[-1,-1]],L,col.set(pal.ramp||pal.floor).multiplyScalar(.8));}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos.subarray(0,v*3),3));g.setAttribute('normal',new THREE.BufferAttribute(nor.subarray(0,v*3),3));g.setAttribute('uv',new THREE.BufferAttribute(uv.subarray(0,v*2),2));
   g.setAttribute('puv',new THREE.BufferAttribute(puv.subarray(0,v*2),2));g.setAttribute('loc',new THREE.BufferAttribute(loc.subarray(0,v*4),4));g.setAttribute('color',new THREE.BufferAttribute(cola.subarray(0,v*3),3));g.setIndex(idx);g.computeBoundingSphere();return g;};
  const floorM=inkMaterial(new THREE.MeshStandardMaterial({vertexColors:true,map:detail.floor,roughness:.62,metalness:0,envMapIntensity:.5}),this.U),wallM=inkMaterial(new THREE.MeshStandardMaterial({vertexColors:true,map:detail.wall,roughness:.55,metalness:0,envMapIntensity:.65}),this.U);
  const fm=new THREE.Mesh(mk(groups.floor),floorM),wm=new THREE.Mesh(mk(groups.wall,this.rampSides),wallM);fm.receiveShadow=wm.receiveShadow=true;wm.castShadow=true;fm.castShadow=true;return[fm,wm];}
}

// Standard material + glossy ink from the atlas: colour, near-mirror roughness, a bump rim from the ink height, a bevel highlight on face edges.
export function inkMaterial(mat,U){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 puv;attribute vec4 loc;varying vec2 vPuv;varying vec4 vLoc;varying vec3 vWp;')
  .replace('#include <project_vertex>','#include <project_vertex>\nvPuv=puv;vLoc=loc;vWp=(modelMatrix*vec4(transformed,1.)).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D tPaint;uniform vec3 uColA,uColB;uniform float uBump,uT;varying vec2 vPuv;varying vec4 vLoc;varying vec3 vWp;float inkM;vec3 inkC;float inkH;
float ih(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ih(i),ih(i+vec2(1,0)),f.x),mix(ih(i+vec2(0,1)),ih(i+vec2(1,1)),f.x),f.y);}
vec3 inkBump(vec3 sp,vec3 sn,vec2 dH,float fd){vec3 ex=dFdx(sp),ey=dFdy(sp);if(dot(ex,ex)<1e-12||dot(ey,ey)<1e-12)return sn;vec3 sx=normalize(ex),sy=normalize(ey);vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1)*fd;vec3 g=sign(det)*(dH.x*r1+dH.y*r2);vec3 r=abs(det)*sn-g;return dot(r,r)>1e-10?normalize(r):sn;}`)
  .replace('#include <color_fragment>',`#include <color_fragment>
 {float e=min(min(vLoc.x,vLoc.z-vLoc.x),min(vLoc.y,vLoc.w-vLoc.y));diffuseColor.rgb*=1.+.24*(1.-smoothstep(.0,.07,e))-.06*smoothstep(.07,.12,e)*(1.-smoothstep(.12,.4,e));}
 inkM=0.;inkH=0.;inkC=vec3(0.);
 if(vPuv.x>=0.){vec2 pk=texture2D(tPaint,vPuv).rg;float m=max(pk.r,pk.g);float n=vn(vWp.xz*2.3+vWp.y*1.7)*.6+vn(vWp.zy*5.1+vWp.x*3.3)*.4;
  float mm=m+(n-.5)*.16;inkM=smoothstep(.40,.47,mm);inkH=smoothstep(.36,.62,mm);inkC=mix(uColB,uColA,step(pk.g,pk.r));
  diffuseColor.rgb=mix(diffuseColor.rgb,inkC*(.92+.16*n),inkM);}`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,.1,inkM);')
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n if(inkH>0.&&inkH<1.){normal=inkBump(-vViewPosition,normal,vec2(dFdx(inkH),dFdy(inkH))*uBump,faceDirection);}')
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=inkC*inkM*.12;');};
 mat.customProgramCacheKey=()=>'ink';return mat;}
