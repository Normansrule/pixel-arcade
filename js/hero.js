// 3D hero: a draggable ring of arcade cabinets, each screen running a live game.
import * as THREE from '../vendor/three.module.min.js';
const host=document.getElementById('hero3d');
if(host&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const start=()=>{
 const A=window.A,W=host.clientWidth,H=host.clientHeight;
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.setSize(W,H);host.appendChild(r.domElement);
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x12082a,14,34);
 const cam=new THREE.PerspectiveCamera(42,W/H,.1,100);cam.position.set(0,2.4,15);cam.lookAt(0,1.6,0);
 scene.add(new THREE.HemisphereLight(0xb0a0ff,0x100820,.9));const key=new THREE.DirectionalLight(0xffe0f0,1.2);key.position.set(4,8,6);scene.add(key);
 const rim=new THREE.PointLight(0x2fe8d0,40,30);rim.position.set(0,5,-6);scene.add(rim);const pink=new THREE.PointLight(0xff3f8e,12,24);pink.position.set(0,6,10);scene.add(pink);
 // floor grid
 const grid=new THREE.GridHelper(80,40,0xff3f8e,0x2fe8d0);grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
 const ring=new THREE.Group();scene.add(ring);
 const pool=A.games.filter(g=>!g.href);const pick=[];while(pick.length<10){const g=pool[Math.random()*pool.length|0];if(!pick.includes(g))pick.push(g);}
 const cols=[0x3a2a78,0x4a2a6a,0x2a3a78,0x3a2a58];const cabs=[],stops=[];
 pick.forEach((gm,i)=>{const cv=document.createElement('canvas');cv.width=320;cv.height=240;const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;
  const g=new THREE.Group(),m=c=>new THREE.MeshStandardMaterial({color:c,roughness:.5,metalness:.2});const col=cols[i%4];
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.6,3.2,1.2),m(col));body.position.y=1.6;g.add(body);
  const top=new THREE.Mesh(new THREE.BoxGeometry(1.7,.45,1.3),new THREE.MeshStandardMaterial({color:0xffcf3f,emissive:0x6a4a00}));top.position.y=3.3;g.add(top);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.98),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));screen.position.set(0,2.25,.645);screen.rotation.x=-.08;g.add(screen);
  const bezel=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.12,.05),m(0x07030f));bezel.position.set(0,2.25,.59);bezel.rotation.x=-.08;g.add(bezel);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(1.6,.18,.6),m(0x1a1140));panel.position.set(0,1.45,.8);panel.rotation.x=.35;g.add(panel);
  [[-.35,0xff3f8e],[0,0x2fe8d0],[.3,0xffcf3f]].forEach(b=>{const bt=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.06,12),new THREE.MeshStandardMaterial({color:b[1],emissive:b[1],emissiveIntensity:.4}));bt.position.set(b[0],1.56,.86);bt.rotation.x=.35;g.add(bt);});
  const stick=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.2,6),m(0x222222));stick.position.set(-.55,1.62,.78);g.add(stick);const ball=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color:0xff3f8e}));ball.position.set(-.55,1.73,.78);g.add(ball);
  const a=i/pick.length*Math.PI*2,R=6.2;g.position.set(Math.sin(a)*R,0,Math.cos(a)*R);g.rotation.y=a;g.userData={gm,tex,screen};ring.add(g);cabs.push(g);
  stops.push(A.preview(gm,cv,20));});
 // input: drag to spin, click to play
 let rot=0,vel=.0025,drag=false,lx=0,moved=0,hover=null;const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
 const pos=ev=>{const b=r.domElement.getBoundingClientRect();mv.set((ev.clientX-b.left)/b.width*2-1,-(ev.clientY-b.top)/b.height*2+1);};
 r.domElement.addEventListener('pointerdown',ev=>{drag=true;lx=ev.clientX;moved=0;r.domElement.setPointerCapture(ev.pointerId);});
 r.domElement.addEventListener('pointermove',ev=>{pos(ev);if(drag){const d=ev.clientX-lx;lx=ev.clientX;moved+=Math.abs(d);vel=d*.0009;rot+=d*.005;}});
 r.domElement.addEventListener('pointerup',ev=>{drag=false;if(moved<6){pos(ev);ray.setFromCamera(mv,cam);const hit=ray.intersectObjects(cabs,true)[0];if(hit){let o=hit.object;while(o.parent!==ring)o=o.parent;A.open(o.userData.gm);}}});
 r.domElement.style.cursor='grab';
 const clock=new THREE.Clock();let visible=true;new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(host);
 const loop=()=>{requestAnimationFrame(loop);if(!visible||document.body.classList.contains('playing'))return;const dt=clock.getDelta();if(!drag){rot+=vel;vel+=(.0025-vel)*.02;}ring.rotation.y=rot;
  ray.setFromCamera(mv,cam);const hit=ray.intersectObjects(cabs,true)[0];let h=null;if(hit){h=hit.object;while(h.parent!==ring)h=h.parent;}if(h!==hover){hover=h;r.domElement.style.cursor=h?'pointer':'grab';const lab=document.getElementById('herolabel');if(lab)lab.textContent=h?h.userData.gm.name:'';}
  cabs.forEach(c=>{c.userData.tex.needsUpdate=true;const t=c===hover?.35:0;c.position.y+=(t-c.position.y)*.15;});
  cam.position.x+=((window.__mx||0)*1.5-cam.position.x)*.05;cam.lookAt(0,1.6,0);grid.position.z=(clock.elapsedTime*1.2)%2;r.render(scene,cam);};loop();
 addEventListener('resize',()=>{const w=host.clientWidth,h=host.clientHeight;r.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();});
 addEventListener('pointermove',e=>{window.__mx=e.clientX/innerWidth-.5;});
 };
 if(window.A&&window.A.ready)start();else addEventListener('arcade-ready',start,{once:true});
}
