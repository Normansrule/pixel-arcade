// VOXEL FRONTIER — block + item tables, recipes, the procedural 16px texture atlas (padded for mipmaps),
// isometric inventory icons and pixel-extruded item meshes.
import * as THREE from '../vendor/three.module.min.js';

export const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export const hash=(x,y,z,s)=>{let h=(x*374761393+y*668265263+z*1440662683+s*1013904223)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};

/* ---------------- texture atlas ---------------- */
// 16 columns x 4 rows of 16px tiles, each in a 32px cell with 8px wrap padding so mip levels don't bleed.
const TN={};const PAINT=[];
const tile=(name,fn,glow)=>{TN[name]=PAINT.length;PAINT.push({fn,glow});};
const cl=v=>v<0?0:v>255?255:v|0;
function P(r){ // painter context for one 16x16 tile
 const px=new Array(256).fill(null);
 return{px,r,set(x,y,c,a=1){if(x<0||y<0||x>15||y>15)return;px[y*16+x]=c?[cl(c[0]),cl(c[1]),cl(c[2]),a]:null;},
  get(x,y){return px[((y&15)*16)+(x&15)];},
  j(c,k){const n=(r()-.5)*k;return[c[0]+n,c[1]+n,c[2]+n];},
  mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];},
  fill(c,k){for(let y=0;y<16;y++)for(let x=0;x<16;x++)this.set(x,y,this.j(c,k));}};}
const dk=(c,f)=>[c[0]*f,c[1]*f,c[2]*f];
// value noise for blotches
function vn(R,s){const g=[];for(let i=0;i<64;i++)g.push(R());return(x,y)=>{const fx=x/s,fy=y/s,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;const n=16/s|0||1;const G=(a,b)=>g[((((a%n)+n)%n)*7+(((b%n)+n)%n)*13)%64];const sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);return(G(ix,iy)*(1-sx)+G(ix+1,iy)*sx)*(1-sy)+(G(ix,iy+1)*(1-sx)+G(ix+1,iy+1)*sx)*sy;};}

const GRASS=[96,166,52],DIRT=[128,90,60],STONE=[124,124,128];
const grassTop=(base)=>p=>{const n=vn(p.r,4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=n(x,y);let c=p.j(dk(base,.84+v*.3),18);if(p.r()<.12)c=dk(c,.78);else if(p.r()<.08)c=dk(c,1.18);p.set(x,y,c);}};
const dirt=p=>{const n=vn(p.r,4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j(dk(DIRT,.86+n(x,y)*.28),20);if(p.r()<.1)c=dk(c,.72);if(p.r()<.04)c=[150,128,104];p.set(x,y,c);}};
const sideTop=(top,base)=>p=>{dirt(p);for(let x=0;x<16;x++){const d=3+(p.r()*3|0)+(x%5===2?1:0);for(let y=0;y<d;y++)p.set(x,y,p.j(dk(top,y===d-1?.8:.95+(p.r()*.15)),14));}};
const stone=p=>{const n=vn(p.r,8),m=vn(p.r,4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j(dk(STONE,.86+n(x,y)*.18+m(x,y)*.1),12);p.set(x,y,c);}
 for(let k=0;k<3;k++){let x=p.r()*16|0,y=p.r()*16|0;for(let i=0;i<5;i++){p.set(x,y,dk(STONE,.66));x+=p.r()<.5?1:0;y+=p.r()<.6?1:0;}}};
const ore=(col,hi)=>p=>{stone(p);for(let b=0;b<4;b++){const cx=2+p.r()*12|0,cy=2+p.r()*12|0;for(let i=0;i<5;i++){const x=cx+(p.r()*3|0)-1,y=cy+(p.r()*3|0)-1;p.set(x,y,p.j(col,20));}p.set(cx,cy,hi);p.set(cx+1,cy,dk(col,.7));}};
const cobble=(moss)=>p=>{const C=[];for(let i=0;i<9;i++)C.push([p.r()*16,p.r()*16,.78+p.r()*.32]);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){let d1=1e9,d2=1e9,s=1;for(const c of C)for(let ox=-16;ox<=16;ox+=16)for(let oy=-16;oy<=16;oy+=16){const d=Math.hypot(x-c[0]-ox,y-c[1]-oy);if(d<d1){d2=d1;d1=d;s=c[2];}else if(d<d2)d2=d;}
  let c=d2-d1<1.1?[70,70,74]:p.j(dk([132,132,136],s-(d1>3.2?.08:0)),14);if(moss&&p.r()<.35&&d2-d1>1.1&&(x+y*3)%5<3)c=p.j([80,120,52],22);p.set(x,y,c);}};
const bark=(base,lines)=>p=>{for(let x=0;x<16;x++){const cs=.82+p.r()*.3;for(let y=0;y<16;y++){let c=p.j(dk(base,cs),14);if(x%4===lines&&p.r()<.8)c=dk(base,.62);p.set(x,y,c);}}};
const ring=(outer,inner,ringc)=>p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));let c=d>6.5?p.j(outer,14):(Math.floor(d)%2?p.j(ringc,10):p.j(inner,10));p.set(x,y,c);}};
const leaves=(base,holes)=>p=>{const n=vn(p.r,4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(p.r()<holes){p.set(x,y,null);continue;}let c=p.j(dk(base,.78+n(x,y)*.4),24);if(p.r()<.18)c=dk(c,.7);if(p.r()<.1)c=dk(c,1.25);p.set(x,y,c);}};
const plants=(fn)=>p=>{for(let i=0;i<256;i++)p.px[i]=null;fn(p);};

tile('grass_top',grassTop(GRASS));                         //0
tile('grass_side',sideTop(GRASS,DIRT));                    //1
tile('dirt',dirt);                                         //2
tile('stone',stone);                                       //3
tile('sand',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([222,208,160],16);if(p.r()<.08)c=dk(c,.88);p.set(x,y,c);}}); //4
tile('water',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j([40,100,190],18));});
tile('oak_side',bark([110,84,50],1));
tile('oak_top',ring([96,74,44],[178,142,90],[150,116,70]));
tile('oak_leaves',leaves([64,128,40],.1));
tile('planks',p=>{for(let y=0;y<16;y++){const b=y>>2,bc=[[176,138,86],[166,128,78],[182,144,92],[170,132,80]][b];const off=(b*7)%16;for(let x=0;x<16;x++){let c=p.j(bc,10);if(y%4===0)c=dk(bc,.66);else if((x+off)%16===0)c=dk(bc,.72);else if(p.r()<.12)c=dk(c,.9);p.set(x,y,c);}}});
tile('glass',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(x===0||y===0||x===15||y===15)p.set(x,y,p.j([220,236,246],10));else if((x-y===4&&x<9)||(x-y===6&&x>8&&x<12))p.set(x,y,[240,248,255],1);else p.set(x,y,null);}});
tile('snow',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j([236,244,252],10));});
tile('snow_side',sideTop([236,244,252],DIRT));
tile('coal_ore',ore([36,36,38],[70,70,74]));
tile('iron_ore',ore([214,168,126],[240,210,180]));
tile('cobble',cobble(false));
tile('brick',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const row=y>>2,off=row%2?4:0;let c;if(y%4===3||(x+off)%8===7)c=p.j([186,178,168],10);else c=p.j([156,68,52],20);p.set(x,y,c);}});
tile('lamp',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const e=x===0||y===0||x===15||y===15||x===7||y===7;p.set(x,y,e?p.j([150,104,52],10):p.j([255,214,120],34));}},true);
tile('bedrock',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j(p.r()<.5?[52,52,56]:[92,92,96],26));});
tile('gold_ore',ore([248,210,60],[255,250,170]));
tile('diamond_ore',ore([90,230,226],[220,255,255]));
tile('cactus_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([74,140,52],12);if(x%4===1)c=dk(c,1.2);if(x===0||x===15)c=dk(c,.7);if((x%4===3)&&y%3===1)c=[226,226,180];p.set(x,y,c);}});
tile('cactus_top',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));p.set(x,y,p.j(d>6.5?[60,118,44]:d<3?[120,180,90]:[96,162,70],12));}});
tile('lava',p=>{const n=vn(p.r,8),m=vn(p.r,4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=n(x,y)*.7+m(x,y)*.5;p.set(x,y,v>.75?[255,236,120]:v>.5?p.j([255,150,40],20):p.j([210,70,20],20));}},.5);
tile('torch',plants(p=>{for(let y=6;y<16;y++){p.set(7,y,[128,92,52]);p.set(8,y,[100,70,40]);}p.set(7,5,[255,230,120]);p.set(8,5,[255,190,70]);p.set(7,4,[255,250,200]);p.set(8,4,[255,214,100]);p.set(7,3,[255,170,60]);p.set(8,6,[255,140,40]);}),true);
tile('tnt_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c;if(y>=5&&y<=10)c=y===5||y===10?[40,40,40]:p.j([236,232,220],8);else c=p.j([206,52,40],16);if(!(y>=5&&y<=10)&&x%4===0)c=dk(c,.75);if(y>=7&&y<=8&&(x%5===1||x%5===2))c=[40,40,40];p.set(x,y,c);}});
tile('tnt_top',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-7.5);p.set(x,y,d<2?[40,40,40]:d<3?[120,120,110]:p.j([206,52,40],16));}});
tile('birch_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j([222,220,212],10));for(let k=0;k<6;k++){const y=p.r()*16|0,x=p.r()*12|0,l=2+p.r()*4|0;for(let i=0;i<l;i++)p.set(x+i,y,[40,40,36]);}});
tile('birch_top',ring([222,220,212],[214,190,140],[190,166,116]));
tile('birch_leaves',leaves([118,160,66],.1));
tile('spruce_side',bark([70,50,30],2));
tile('spruce_top',ring([60,42,26],[140,104,62],[116,84,48]));
tile('spruce_leaves',leaves([46,92,58],.08));
tile('sandstone_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([216,198,140],10);if(y<3)c=dk(c,1.04);if(y===3||y===10)c=dk(c,.82);p.set(x,y,c);}});
tile('sandstone_top',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j([224,206,150],10));});
tile('gravel',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j([120,114,110],20));for(let k=0;k<14;k++){const x=p.r()*15|0,y=p.r()*15|0,c=p.r()<.5?[150,140,132]:[88,84,80];p.set(x,y,c);p.set(x+1,y,dk(c,.9));p.set(x,y+1,dk(c,.8));}});
tile('dry_top',grassTop([168,170,74]));
tile('dry_side',sideTop([168,170,74],DIRT));
tile('acacia_side',bark([110,104,94],3));
tile('acacia_top',ring([110,104,94],[196,110,58],[170,92,48]));
tile('acacia_leaves',leaves([98,142,42],.12));
tile('ice',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([156,198,244],10);if((x+y)%9===0||(x*2-y)%13===0)c=[206,230,255];p.set(x,y,c);}});
tile('bench_top',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([176,138,86],12);if(x===0||y===0||x===15||y===15)c=[110,80,46];else if(x%5===0||y%5===0)c=[132,98,58];p.set(x,y,c);}});
tile('bench_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([156,118,72],12);if(y<3)c=p.j([176,138,86],10);if(y===3)c=[96,70,40];p.set(x,y,c);}for(let y=6;y<13;y++){p.set(3,y,[120,120,126]);p.set(4,y,[150,150,156]);}for(let x=9;x<14;x++)p.set(x,6,[120,120,126]);for(let y=6;y<13;y++)p.set(11,y,[96,70,40]);});
tile('furnace_front',p=>{cobble(false)(p);for(let y=7;y<14;y++)for(let x=3;x<13;x++)p.set(x,y,y>11?p.j([255,140,40],40):[26,22,22]);for(let x=3;x<13;x++)p.set(x,6,[70,70,74]);},true);
tile('furnace_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([128,128,132],10);if(y===0||y===15)c=[90,90,94];p.set(x,y,c);}});
tile('furnace_top',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));p.set(x,y,p.j(d>6.5?[96,96,100]:[140,140,144],10));}});
tile('tall_grass',plants(p=>{for(let b=0;b<7;b++){let x=1+p.r()*14,h=6+p.r()*9|0,lean=(p.r()-.5)*.4;for(let y=15;y>15-h;y--){p.set(Math.round(x),y,p.j(dk(GRASS,.75+(15-y)/h*.45),14));x+=lean;}}}));
tile('red_flower',plants(p=>{for(let y=8;y<16;y++)p.set(7,y,[60,120,40]);p.set(6,11,[70,140,46]);p.set(8,12,[70,140,46]);for(const[dx,dy]of[[0,-1],[1,0],[-1,0],[0,1],[0,0]])p.set(7+dx,6+dy,dx||dy?[220,40,40]:[255,210,60]);p.set(6,5,[180,26,30]);p.set(8,7,[180,26,30]);}));
tile('yellow_flower',plants(p=>{for(let y=9;y<16;y++)p.set(8,y,[60,120,40]);p.set(9,12,[70,140,46]);for(const[dx,dy]of[[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,1]])p.set(8+dx,7+dy,[255,214,40]);p.set(8,7,[200,110,30]);}));
tile('dead_bush',plants(p=>{const br=(x,y,dx,n)=>{for(let i=0;i<n;i++){p.set(Math.round(x),y,[128,92,46]);x+=dx;y--;}};br(8,15,0,6);br(8,11,.7,5);br(8,12,-.8,5);br(8,10,.3,6);}));
tile('mushroom',plants(p=>{for(let y=10;y<16;y++){p.set(7,y,[220,220,200]);p.set(8,y,[200,200,184]);}for(let y=6;y<10;y++)for(let x=4+(y===6?2:0);x<12-(y===6?2:0);x++)p.set(x,y,(x+y)%3===0?[200,255,250]:[60,210,200]);}),.6);
tile('crystal_ore',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)p.set(x,y,p.j([60,56,70],16));for(let k=0;k<4;k++){const cx=2+p.r()*12|0,cy=3+p.r()*11|0,h=2+p.r()*3|0;for(let i=0;i<h;i++){p.set(cx,cy-i,i===h-1?[250,210,255]:[200,110,250]);p.set(cx+1,cy-i,[150,70,210]);}}},true);
tile('mossy_cobble',cobble(true));
tile('wool',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([234,234,228],10);if((x+y*2)%7===0)c=dk(c,.9);p.set(x,y,c);}});
tile('beacon',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const e=x<2||y<2||x>13||y>13;const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));p.set(x,y,e?p.j([120,230,240],14):d<3?[240,255,255]:p.j([60,180,210],20));}},true);
tile('bone_side',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){let c=p.j([226,222,200],8);if(x%5===2)c=dk(c,.86);p.set(x,y,c);}});
tile('bone_top',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-7.5);p.set(x,y,p.j(d<3?[200,192,166]:d<5?[230,226,206]:[214,210,188],8));}});
tile('stone_bricks',p=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const row=y>>3,off=row?4:0;let c=p.j([128,128,132],10);if(y%8===7||(x+off)%8===7)c=[86,86,90];else if(y%8===0||(x+off)%8===0)c=dk(c,1.1);p.set(x,y,c);}});
export const TILE=TN;

export const AT=(()=>{const W=512,H=128;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');const e=document.createElement('canvas');e.width=W;e.height=H;const ex=e.getContext('2d');ex.fillStyle='#000';ex.fillRect(0,0,W,H);
 const small=document.createElement('canvas');small.width=16*16;small.height=16*4;const sx=small.getContext('2d');
 const R=mulberry(91);const id=x.createImageData(W,H),ed=ex.getImageData(0,0,W,H);
 PAINT.forEach((t,i)=>{const p=P(R);t.fn(p);const col=i%16,row=i>>4;
  for(let py=-8;py<24;py++)for(let qx=-8;qx<24;qx++){const v=p.px[((py+16)%16)*16+((qx+16)%16)];const X=col*32+8+qx,Y=row*32+8+py,o=(Y*W+X)*4;if(!v){id.data[o+3]=0;continue;}
   id.data[o]=v[0];id.data[o+1]=v[1];id.data[o+2]=v[2];id.data[o+3]=255;if(t.glow){const g=(v[0]+v[1]+v[2])/3>150||v[0]>200,k=t.glow===true?1:t.glow;ed.data[o]=g?v[0]*k:0;ed.data[o+1]=g?v[1]*k:0;ed.data[o+2]=g?v[2]*k:0;}}
  for(let py=0;py<16;py++)for(let qx=0;qx<16;qx++){const v=p.px[py*16+qx];if(!v)continue;sx.fillStyle=`rgb(${v[0]},${v[1]},${v[2]})`;sx.fillRect(col*16+qx,row*16+py,1,1);}});
 x.putImageData(id,0,0);ex.putImageData(ed,0,0);
 const mk=cv=>{const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.colorSpace=THREE.SRGBColorSpace;return t;};
 return{map:mk(c),em:mk(e),canvas:c,small};})();
export const tileUV=t=>{const col=t%16,row=t>>4;return[(col*32+8)/512,1-(row*32+24)/128,(col*32+24)/512,1-(row*32+8)/128];};

/* ---------------- blocks ---------------- */
// t/s/b = top/side/bottom tile; hard = seconds by hand; need = pickaxe tier; mat = sound family
const T=TN;
const blk=(n,t,s,b,o={})=>({n,t:T[t],s:T[s??t],b:T[b??s??t],hard:.6,mat:'stone',...o});
export const B=[null,
 blk('GRASS','grass_top','grass_side','dirt',{hard:.55,mat:'grass',drop:2}),           //1
 blk('DIRT','dirt',null,null,{hard:.5,mat:'dirt'}),                                     //2
 blk('STONE','stone',null,null,{hard:1.5,need:1,drop:13,mat:'stone',rock:1}),          //3
 blk('SAND','sand',null,null,{hard:.45,mat:'sand',fall:1}),                             //4
 blk('WATER','water',null,null,{liquid:1,mat:'water'}),                                 //5
 blk('OAK LOG','oak_top','oak_side',null,{hard:1.4,mat:'wood',log:1}),                 //6
 blk('OAK LEAVES','oak_leaves',null,null,{hard:.2,trans:1,mat:'leaf',leaf:1}),          //7
 blk('PLANKS','planks',null,null,{hard:1.1,mat:'wood'}),                                //8
 blk('GLASS','glass',null,null,{hard:.35,trans:1,mat:'glass',drop:0}),                  //9
 blk('SNOWY GRASS','snow','snow_side','dirt',{hard:.55,mat:'snow',drop:2}),             //10
 blk('COAL ORE','coal_ore',null,null,{hard:1.7,need:1,drop:101,ore:12,mat:'stone',rock:1}),   //11
 blk('IRON ORE','iron_ore',null,null,{hard:2,need:2,ore:30,mat:'stone',rock:1}),        //12
 blk('COBBLESTONE','cobble',null,null,{hard:1.6,need:1,mat:'stone',rock:1}),           //13
 blk('BRICKS','brick',null,null,{hard:1.8,need:1,mat:'stone',rock:1}),                 //14
 blk('LAMP','lamp',null,null,{hard:.5,glow:15,mat:'glass'}),                            //15
 blk('BEDROCK','bedrock',null,null,{hard:1e9,mat:'stone'}),                             //16
 blk('GOLD ORE','gold_ore',null,null,{hard:2.4,need:3,ore:60,mat:'stone',rock:1}),     //17
 blk('DIAMOND ORE','diamond_ore',null,null,{hard:2.8,need:3,drop:102,ore:160,mat:'stone',rock:1}), //18
 blk('CACTUS','cactus_top','cactus_side',null,{hard:.4,mat:'leaf',cactus:1}),           //19
 blk('LAVA','lava',null,null,{liquid:1,glow:15,mat:'water'}),                           //20
 blk('TORCH','torch',null,null,{hard:.05,torch:1,glow:14,mat:'wood'}),                  //21
 blk('TNT','tnt_top','tnt_side',null,{hard:.2,tnt:1,mat:'grass'}),                      //22
 blk('BIRCH LOG','birch_top','birch_side',null,{hard:1.4,mat:'wood',log:1}),           //23
 blk('BIRCH LEAVES','birch_leaves',null,null,{hard:.2,trans:1,mat:'leaf',leaf:1}),      //24
 blk('SPRUCE LOG','spruce_top','spruce_side',null,{hard:1.4,mat:'wood',log:1}),        //25
 blk('SPRUCE LEAVES','spruce_leaves',null,null,{hard:.2,trans:1,mat:'leaf',leaf:1}),    //26
 blk('SANDSTONE','sandstone_top','sandstone_side',null,{hard:1.1,need:1,mat:'stone',rock:1}), //27
 blk('GRAVEL','gravel',null,null,{hard:.55,mat:'sand',fall:1}),                         //28
 blk('DRY GRASS','dry_top','dry_side','dirt',{hard:.55,mat:'grass',drop:2}),            //29
 blk('ACACIA LOG','acacia_top','acacia_side',null,{hard:1.4,mat:'wood',log:1}),        //30
 blk('ACACIA LEAVES','acacia_leaves',null,null,{hard:.2,trans:1,mat:'leaf',leaf:1}),    //31
 blk('SNOW','snow',null,null,{hard:.3,mat:'snow'}),                                     //32
 blk('ICE','ice',null,null,{hard:.5,mat:'glass'}),                                      //33
 blk('WORKBENCH','bench_top','bench_side','planks',{hard:1.2,mat:'wood',station:1}),   //34
 blk('FURNACE','furnace_top','furnace_side',null,{hard:1.8,need:1,mat:'stone',station:2,front:'furnace_front',glow:8}), //35
 blk('TALL GRASS','tall_grass',null,null,{hard:0,plant:1,mat:'grass',drop:0}),          //36
 blk('RED FLOWER','red_flower',null,null,{hard:0,plant:1,mat:'grass'}),                 //37
 blk('YELLOW FLOWER','yellow_flower',null,null,{hard:0,plant:1,mat:'grass'}),           //38
 blk('DEAD BUSH','dead_bush',null,null,{hard:0,plant:1,mat:'grass',drop:100}),          //39
 blk('GLOWCAP','mushroom',null,null,{hard:0,plant:1,mat:'grass',glow:9}),               //40
 blk('CRYSTAL ORE','crystal_ore',null,null,{hard:2.2,need:3,drop:111,ore:90,glow:7,mat:'glass',rock:1}), //41
 blk('MOSSY COBBLE','mossy_cobble',null,null,{hard:1.6,need:1,mat:'stone',rock:1}),    //42
 blk('WOOL','wool',null,null,{hard:.4,mat:'cloth'}),                                    //43
 blk('BEACON','beacon',null,null,{hard:1,glow:15,mat:'glass',beacon:1}),                //44
 blk('BONE BLOCK','bone_top','bone_side',null,{hard:1.2,need:1,mat:'stone',rock:1}),   //45
 blk('STONE BRICKS','stone_bricks',null,null,{hard:1.6,need:1,mat:'stone',rock:1}),    //46
];
B[35].f=T.furnace_front;
export const NB=B.length;
// fast lookup tables
export const OPQ=new Uint8Array(256),SOL=new Uint8Array(256),LIQ=new Uint8Array(256),EMIT=new Uint8Array(256),TRN=new Uint8Array(256),PLANT=new Uint8Array(256);
for(let i=1;i<NB;i++){const b=B[i];LIQ[i]=b.liquid?1:0;PLANT[i]=b.plant||b.torch?1:0;TRN[i]=b.trans?1:0;OPQ[i]=!b.liquid&&!b.trans&&!PLANT[i]?1:0;SOL[i]=!b.liquid&&!PLANT[i]?1:0;EMIT[i]=b.glow||0;}
export const LOGS=[6,23,25,30];

/* ---------------- items ---------------- */
export const ITEMS={
 100:{n:'STICK'},101:{n:'COAL',fuel:1},102:{n:'DIAMOND'},103:{n:'RAW MUTTON',food:3},104:{n:'RAW PORK',food:3},105:{n:'ROAST MUTTON',food:8},106:{n:'ROAST PORK',food:8},
 107:{n:'APPLE',food:4},108:{n:'RAW CHICKEN',food:2},109:{n:'IRON INGOT'},110:{n:'GOLD INGOT'},111:{n:'CRYSTAL SHARD'},112:{n:'BONE'},113:{n:'SILK'},114:{n:'ROAST CHICKEN',food:6},
 120:{n:'WOOD PICKAXE',pick:1,c:'#b48a52'},121:{n:'STONE PICKAXE',pick:2,c:'#8c8c92'},122:{n:'IRON PICKAXE',pick:3,c:'#e8e2dc'},123:{n:'DIAMOND PICKAXE',pick:4,c:'#5ee8e4'},
 130:{n:'WOOD SWORD',sword:4,c:'#b48a52'},131:{n:'STONE SWORD',sword:5,c:'#8c8c92'},132:{n:'IRON SWORD',sword:6.5,c:'#e8e2dc'},133:{n:'DIAMOND SWORD',sword:8,c:'#5ee8e4'},
 150:{n:'IRON ARMOR',armor:.35,c:'#d8d4d0'},151:{n:'DIAMOND ARMOR',armor:.6,c:'#5ee8e4'}};
export const nameOf=id=>id>=100?(ITEMS[id]?.n||'?'):(B[id]?.n||'?');
export const isTool=id=>!!(ITEMS[id]&&(ITEMS[id].pick||ITEMS[id].sword||ITEMS[id].armor));

/* ---------------- recipes ---------------- */
// in: [[id|'LOG'|'FUEL', n]], st: 0 anywhere, 1 workbench nearby, 2 furnace nearby
const r=(out,n,inp,st=0,tip='')=>({out,n,in:inp,st,tip});
export const RECIPES=[
 r(8,4,[['LOG',1]],0,'Any log'),r(100,4,[[8,2]]),r(34,1,[[8,4]],0,'Place it to unlock tools'),r(21,4,[[100,1],[101,1]]),
 r(120,1,[[8,3],[100,2]],1),r(130,1,[[8,2],[100,1]],1),r(121,1,[[13,3],[100,2]],1),r(131,1,[[13,2],[100,1]],1),r(35,1,[[13,8]],1,'Place it to smelt'),
 r(109,1,[[12,1],['FUEL',1]],2),r(110,1,[[17,1],['FUEL',1]],2),r(9,2,[[4,2],['FUEL',1]],2),r(105,1,[[103,1],['FUEL',1]],2),r(106,1,[[104,1],['FUEL',1]],2),r(114,1,[[108,1],['FUEL',1]],2),r(14,4,[[13,4],['FUEL',1]],2),
 r(122,1,[[109,3],[100,2]],1),r(132,1,[[109,2],[100,1]],1),r(150,1,[[109,5]],1,'Blocks 35% damage'),
 r(123,1,[[102,3],[100,2]],1),r(133,1,[[102,2],[100,1]],1),r(151,1,[[102,4]],1,'Blocks 60% damage'),
 r(22,1,[[4,4],[101,2]],1),r(15,2,[[111,1],[9,1]],1),r(46,4,[[13,4]],1),r(43,1,[[113,4]]),r(45,1,[[112,3]]),
 r(44,1,[[102,2],[110,3],[9,4],[111,2]],1,'Place under open sky to win'),
];
export const GROUP={LOG:LOGS,FUEL:[101,8]};
export const CREATIVE=[1,2,3,13,8,6,9,14,46,15,21,22,4,27,23,25,30,7,43,33,32,45,42,35,34,17,18,41,44,37,38,36];

/* ---------------- icons ---------------- */
const icons={};
function sprite(id){const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');const px=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
 const stick=(o=0)=>{for(let i=0;i<10;i++)px(2+i+o,13-i-o,2,2,i%2?'#8a6236':'#6a4a26');};
 const it=ITEMS[id];
 if(id===100)stick();
 else if(id===101){px(4,5,8,7,'#1c1c1e');px(5,4,6,9,'#26262a');px(6,6,2,2,'#5a5a62');px(9,8,2,2,'#3a3a40');}
 else if(id===102){px(7,2,2,1,'#e8ffff');px(5,3,6,2,'#9ff');px(3,5,10,2,'#5ee8e4');px(4,7,8,2,'#3cc6c4');px(6,9,4,2,'#2aa');px(7,11,2,2,'#188');px(6,4,2,2,'#fff');}
 else if(id===103||id===104||id===108){const m=id===103?'#d86a6a':id===104?'#f09a9a':'#f0c8b0';px(3,5,10,7,m);px(4,6,5,4,'#fff3');px(11,9,3,2,'#f2e8d8');px(3,11,9,1,'#0002');}
 else if(id===105||id===106||id===114){const m=id===105?'#8a4a2a':id===106?'#b0703c':'#c08a50';px(3,5,10,7,m);px(4,6,5,3,'#fff2');px(11,9,3,2,'#f2e8d8');px(3,11,9,1,'#0003');}
 else if(id===107){px(5,5,7,8,'#d0282a');px(4,7,9,5,'#d0282a');px(6,6,2,2,'#ff8a80');px(8,2,1,4,'#6a4a26');px(9,3,3,2,'#4caa3c');}
 else if(id===109||id===110){const a=id===109?'#e8e2dc':'#ffd34a',b=id===109?'#a8a29c':'#c8901a';px(2,8,12,5,b);px(3,6,10,4,a);px(4,6,4,1,'#fff');}
 else if(id===111){px(7,1,2,13,'#d090ff');px(5,4,2,9,'#a050e0');px(9,5,2,8,'#b868f0');px(7,1,1,6,'#fff');}
 else if(id===112){px(3,11,3,3,'#e8e4d0');px(10,2,3,3,'#e8e4d0');for(let i=0;i<7;i++)px(5+i,11-i,2,2,'#f2eee0');}
 else if(id===113){for(let i=0;i<5;i++)px(3+i*2,3+i*2,3,1,'#f2f2f2');px(4,10,8,1,'#ddd');px(8,4,1,8,'#eee');}
 else if(it?.pick){stick();px(2,2,11,2,it.c);px(1,3,3,3,it.c);px(11,3,3,3,it.c);px(13,5,2,3,it.c);px(1,5,2,3,it.c);px(3,2,8,1,'#fff6');}
 else if(it?.sword){for(let i=0;i<8;i++){px(5+i,9-i,2,2,it.c);}px(12,2,2,1,'#fff8');for(let i=0;i<6;i++)px(7+i,7-i,1,1,'#fff6');px(2,9,6,2,'#4a4a50');px(4,7,2,6,'#4a4a50');px(1,12,3,3,'#6a4a26');}
 else if(it?.armor){px(2,2,4,3,it.c);px(10,2,4,3,it.c);px(3,4,10,10,it.c);px(6,2,4,2,'#0000');px(6,4,4,1,'#0004');px(4,5,2,7,'#fff5');px(3,13,10,1,'#0003');}
 else if(id<100){const t=B[id];const tt=t.s;const col=tt%16,row=tt>>4;x.drawImage(AT.small,col*16,row*16,16,16,0,0,16,16);}
 return c;}
export function icon(id){if(icons[id])return icons[id];const S=32;const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const b=B[id];if(id<100&&b&&!b.plant&&!b.torch&&id!==5&&id!==20){const face=(tt,a,bb,cc,d,e,f,shade)=>{const col=tt%16,row=tt>>4;x.setTransform(a,bb,cc,d,e,f);x.drawImage(AT.small,col*16,row*16,16,16,0,0,16,16);if(shade){x.fillStyle=`rgba(0,0,0,${shade})`;x.fillRect(0,0,16,16);}};
  face(b.t,14/16,-7/16,14/16,7/16,2,9,0);face(b.s,14/16,7/16,0,16/16,2,9,.22);face(b.f??b.s,14/16,-7/16,0,16/16,16,16,.4);x.setTransform(1,0,0,1,0,0);}
 else{x.drawImage(sprite(id),0,0,16,16,0,0,S,S);}
 icons[id]=c;return c;}
export function spriteOf(id){return sprite(id);}

/* ---------------- pixel-extruded item geometry ---------------- */
const exCache={};
export function extruded(id){if(exCache[id])return exCache[id];const c=sprite(id),d=c.getContext('2d').getImageData(0,0,16,16).data;const P=[],N=[],C=[],I=[];const s=1/16,th=s;
 const A=(x,y)=>x>=0&&y>=0&&x<16&&y<16&&d[(y*16+x)*4+3]>100;const lin=v=>Math.pow(v/255,2.2);
 const quad=(v,n,col)=>{const b=P.length/3;for(const q of v)P.push(...q);for(let i=0;i<4;i++){N.push(...n);C.push(...col);}I.push(b,b+1,b+2,b,b+2,b+3);};
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(!A(x,y))continue;const o=(y*16+x)*4,col=[lin(d[o]),lin(d[o+1]),lin(d[o+2])];const X=(x-8)*s,Y=(8-y)*s,z0=-th/2,z1=th/2;const dc=col.map(v=>v*.7);
  quad([[X,Y-s,z1],[X+s,Y-s,z1],[X+s,Y,z1],[X,Y,z1]],[0,0,1],col);quad([[X+s,Y-s,z0],[X,Y-s,z0],[X,Y,z0],[X+s,Y,z0]],[0,0,-1],col);
  if(!A(x-1,y))quad([[X,Y-s,z0],[X,Y-s,z1],[X,Y,z1],[X,Y,z0]],[-1,0,0],dc);if(!A(x+1,y))quad([[X+s,Y-s,z1],[X+s,Y-s,z0],[X+s,Y,z0],[X+s,Y,z1]],[1,0,0],dc);
  if(!A(x,y-1))quad([[X,Y,z1],[X+s,Y,z1],[X+s,Y,z0],[X,Y,z0]],[0,1,0],dc);if(!A(x,y+1))quad([[X,Y-s,z0],[X+s,Y-s,z0],[X+s,Y-s,z1],[X,Y-s,z1]],[0,-1,0],dc);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeBoundingSphere();exCache[id]=g;return g;}
// a textured unit cube for a block id (held block, dropped block, primed TNT)
const cubeCache={};
export function blockCube(id,size=1){const k=id+'_'+size;if(cubeCache[k])return cubeCache[k];const b=B[id];const g=new THREE.BoxGeometry(size,size,size);const uv=g.attributes.uv;
 // box face order: +x,-x,+y,-y,+z,-z
 const ft=[b.s,b.s,b.t,b.b,b.f??b.s,b.s];for(let f=0;f<6;f++){const[u0,v0,u1,v1]=tileUV(ft[f]);for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i));}}cubeCache[k]=g;return g;}
// crack overlay stages
export const CRACK=(()=>{const c=document.createElement('canvas');c.width=16*8;c.height=16;const x=c.getContext('2d');const R=mulberry(5);const lines=[];for(let i=0;i<14;i++){let px=4+R()*8,py=4+R()*8;const seg=[];for(let k=0;k<5;k++){seg.push([px|0,py|0]);px+=(R()-.5)*5;py+=(R()-.5)*5;}lines.push(seg);}
 for(let s=0;s<8;s++){const n=Math.ceil((s+1)/8*lines.length);x.fillStyle='rgba(0,0,0,.75)';for(let l=0;l<n;l++){const seg=lines[l];for(let k=0;k<seg.length-1;k++){const[a,b]=seg[k],[cx,cy]=seg[k+1];const steps=Math.max(Math.abs(cx-a),Math.abs(cy-b))||1;for(let i=0;i<=steps;i++){const X=Math.round(a+(cx-a)*i/steps),Y=Math.round(b+(cy-b)*i/steps);if(X>=0&&Y>=0&&X<16&&Y<16)x.fillRect(s*16+X,Y,1,1);}}}}
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(1/8,1);return t;})();
// pixel HUD glyphs (hearts, food, armor)
export function glyph(kind,state){const c=document.createElement('canvas');c.width=c.height=9;const x=c.getContext('2d');const px=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
 if(kind==='heart'){const full=state==='full',half=state==='half';const mask=['.##...##.','#########','#########','#########','.#######.','..#####..','...###...','....#....'];
  mask.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch!=='#')return;const filled=full||(half&&i<5);px(i,j,1,1,filled?(j<2&&i%7<3?'#ff8a8a':'#e8262c'):'#3a1414');}));px(0,0,0,0,'#000');}
 else if(kind==='food'){const mask=['.....##..','....####.','...######','..#######','.######..','.#####...','##.......','#........'];mask.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch!=='#')return;const filled=state==='full'||(state==='half'&&i>3);px(i,j,1,1,filled?(i<2&&j>5?'#f2e8d8':'#c87a3c'):'#2c1c10');}));}
 else{const mask=['##.###.##','#########','#########','.#######.','.#######.','.#######.','..#####..','...###...'];mask.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch!=='#')return;px(i,j,1,1,state==='full'?(i<3?'#ffffff':'#c8d0dc'):'#1c2028');}));}
 return c.toDataURL();}
