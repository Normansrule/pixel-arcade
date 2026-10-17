/* PIXEL ARCADE engine · Pseudo-3D: flat-shaded painter's renderer with fog (A.p3, A.face, A.box3, A.flush). */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;


/* ---------- mini 3D (flat-shaded painter's renderer with fog) ---------- */
A.cam={x:0,y:1.2,z:-4,ry:0,rx:0,f:210};A.fog=null;A.sun=[.35,.85,-.4];let F3=[];
A.p3=(x,y,z)=>{const c=A.cam;let dx=x-c.x,dy=y-c.y,dz=z-c.z;const cy=Math.cos(c.ry),sy=Math.sin(c.ry);let tx=dx*cy-dz*sy,tz=dx*sy+dz*cy;const cx=Math.cos(c.rx),sx=Math.sin(c.rx);let ty=dy*cx-tz*sx;tz=dy*sx+tz*cx;return[160+tx*c.f/tz,120-ty*c.f/tz,tz];};
const hex2=h=>{const n=parseInt(h.slice(1),16);return[n>>16,(n>>8)&255,n&255];};
A.mix=(a,b,t)=>{const A_=hex2(a),B_=hex2(b);return'rgb('+(A_[0]+(B_[0]-A_[0])*t|0)+','+(A_[1]+(B_[1]-A_[1])*t|0)+','+(A_[2]+(B_[2]-A_[2])*t|0)+')';};
A.shade=(hex,f,z)=>{if(!hex)hex='#888888';if(hex[0]!=='#')return hex;let[r,g,b]=hex2(hex);r=Math.min(255,r*f);g=Math.min(255,g*f);b=Math.min(255,b*f);if(A.fog&&z!==undefined){const t=A.clamp((z-A.fog.near)/(A.fog.far-A.fog.near),0,1);const F_=hex2(A.fog.col);r+=(F_[0]-r)*t;g+=(F_[1]-g)*t;b+=(F_[2]-b)*t;}return'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';};
A.face=(pts,col,shade)=>{const P=pts.map(p=>A.p3(p[0],p[1],p[2]));if(P.some(p=>p[2]<.08))return;if(P.every(p=>p[0]<-40)||P.every(p=>p[0]>360)||P.every(p=>p[1]<-40)||P.every(p=>p[1]>280))return;let z=0;for(const p of P)z+=p[2];z/=P.length;let f=1;if(shade!==false){const a=pts[0],b=pts[1],c=pts[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const n=Math.hypot(nx,ny,nz)||1;const s=A.sun,d=(nx*s[0]+ny*s[1]+nz*s[2])/n;f=.5+.5*Math.abs(d)+(d>0?.15:0);}F3.push({z,P,col:A.shade(col,f,z)});};
A.box3=(x,y,z,w,h,d,col)=>{const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2;A.face([[a,y+h,c],[b,y+h,c],[b,y+h,e],[a,y+h,e]],col);A.face([[a,y,c],[a,y+h,c],[b,y+h,c],[b,y,c]],col);A.face([[b,y,e],[b,y+h,e],[a,y+h,e],[a,y,e]],col);A.face([[a,y,e],[a,y+h,e],[a,y+h,c],[a,y,c]],col);A.face([[b,y,c],[b,y+h,c],[b,y+h,e],[b,y,e]],col);};
A.cyl3=(x,y,z,r,h,col,n,ax_)=>{n=n||8;for(let i=0;i<n;i++){const a=i/n*6.283,b=(i+1)/n*6.283;if(ax_==='x'){A.face([[x-h/2,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+h/2,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+h/2,y+Math.cos(b)*r,z+Math.sin(b)*r],[x-h/2,y+Math.cos(b)*r,z+Math.sin(b)*r]],col);}else{A.face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r],[x+Math.cos(b)*r,y+h,z+Math.sin(b)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],col);}}if(ax_!=='x'){const top=[];for(let i=0;i<n;i++)top.push([x+Math.cos(i/n*6.283)*r,y+h,z+Math.sin(i/n*6.283)*r]);A.face(top,col);}};
A.shadow3=(x,z,w,d)=>{const P=[[x-w/2,.01,z-d/2],[x+w/2,.01,z-d/2],[x+w/2,.01,z+d/2],[x-w/2,.01,z+d/2]].map(p=>A.p3(p[0],p[1],p[2]));if(P.some(p=>p[2]<.08))return;F3.push({z:Math.max(...P.map(p=>p[2]))+.01,P,col:'rgba(0,0,0,.35)'});};
A.flush=()=>{F3.sort((a,b)=>b.z-a.z);const c=A.c;for(const f of F3){c.fillStyle=f.col;c.beginPath();c.moveTo(f.P[0][0],f.P[0][1]);for(let i=1;i<f.P.length;i++)c.lineTo(f.P[i][0],f.P[i][1]);c.closePath();c.fill();if(A.hd){c.strokeStyle=f.col;c.lineWidth=.6;c.stroke();}}F3=[];};
A.skyband=(top,bot,horizon)=>{horizon=horizon||130;for(let i=0;i<24;i++)A.rect(0,i*horizon/24,W,horizon/24+1,A.mix(top,bot,i/23));};
})();
