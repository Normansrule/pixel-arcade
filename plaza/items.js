// PENGUIN PLAZA — catalog data + procedural models for clothing, igloo furniture and pomlet pets.
import {THREE,V3,M,merge,ctex,rnd} from './util.js';
const G=THREE;
const S=(r,ws=16,hs=12)=>new G.SphereGeometry(r,ws,hs),C=(rt,rb,h,s=16,open=false)=>new G.CylinderGeometry(rt,rb,h,s,1,open),B=(w,h,d)=>new G.BoxGeometry(w,h,d),T=(r,t,rs=10,ts=24,arc=Math.PI*2)=>new G.TorusGeometry(r,t,rs,ts,arc),K=(r,h,s=16)=>new G.ConeGeometry(r,h,s);
const P=(g,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx,c=0xffffff)=>[g,M(x,y,z,rx,ry,rz,sx,sy,sz),c];
const meshOf=(list,o={})=>{const m=new G.Mesh(merge(list),new G.MeshStandardMaterial({vertexColors:true,roughness:o.r??.6,metalness:o.m??0,envMapIntensity:o.env??.7,emissive:o.e??0,emissiveIntensity:o.ei??1}));m.castShadow=o.shadow??false;m.receiveShadow=true;return m;};

export const BODY_COLORS=[
 {id:'col_sky',n:'Sky Blue',hex:0x3f86e0,p:0},{id:'col_navy',n:'Midnight',hex:0x2a3566,p:60},{id:'col_rose',n:'Rose',hex:0xe86a9a,p:60},{id:'col_mint',n:'Mint',hex:0x4cc7a0,p:60},
 {id:'col_sun',n:'Sunflower',hex:0xf2c230,p:80},{id:'col_tang',n:'Tangerine',hex:0xf28a2e,p:80},{id:'col_grape',n:'Grape',hex:0x8a55d0,p:80},{id:'col_cherry',n:'Cherry',hex:0xd8383e,p:80},
 {id:'col_forest',n:'Pine',hex:0x2f7d4a,p:100},{id:'col_coal',n:'Charcoal',hex:0x34363d,p:100},{id:'col_cocoa',n:'Cocoa',hex:0x7a4e33,p:100},{id:'col_lilac',n:'Lilac',hex:0xc8a8f0,p:120},
 {id:'col_aqua',n:'Aqua',hex:0x2fc4d8,p:120},{id:'col_lime',n:'Lime',hex:0x8ad03a,p:120},{id:'col_snow',n:'Snowball',hex:0xdfe6ee,p:200},{id:'col_gold',n:'Gold Rush',hex:0xd8a838,p:400}];
// clothing: slot hat | neck | face
export const WEAR=[
 {id:'h_beanie_r',n:'Red Beanie',slot:'hat',p:40,m:'beanie',c:0xd8383e},{id:'h_beanie_b',n:'Blue Beanie',slot:'hat',p:40,m:'beanie',c:0x3f6fe0},
 {id:'h_cap',n:'Sport Cap',slot:'hat',p:60,m:'cap',c:0x26a35a},{id:'h_prop',n:'Propeller Cap',slot:'hat',p:120,m:'prop',c:0xf2c230},
 {id:'h_top',n:'Top Hat',slot:'hat',p:150,m:'top',c:0x202228},{id:'h_chef',n:'Chef Hat',slot:'hat',p:90,m:'chef',c:0xffffff},
 {id:'h_party',n:'Party Cone',slot:'hat',p:70,m:'party',c:0xe86a9a},{id:'h_flower',n:'Flower Crown',slot:'hat',p:110,m:'flower',c:0xffffff},
 {id:'h_muffs',n:'Earmuffs',slot:'hat',p:80,m:'muffs',c:0xf28a2e},{id:'h_phones',n:'DJ Headphones',slot:'hat',p:160,m:'phones',c:0x22252c},
 {id:'h_wizard',n:'Star Wizard Hat',slot:'hat',p:220,m:'wizard',c:0x3a3fb0},{id:'h_bow',n:'Big Bow',slot:'hat',p:60,m:'bow',c:0xff6fae},
 {id:'h_helmet',n:'Explorer Helmet',slot:'hat',p:180,m:'helmet',c:0xc8b070},{id:'h_crown',n:'Royal Crown',slot:'hat',p:600,m:'crown',c:0xffc83a},
 {id:'n_scarf_r',n:'Red Scarf',slot:'neck',p:40,m:'scarf',c:0xd8383e},{id:'n_scarf_s',n:'Striped Scarf',slot:'neck',p:70,m:'scarf',c:0x3f86e0,c2:0xffffff},
 {id:'n_scarf_g',n:'Green Scarf',slot:'neck',p:40,m:'scarf',c:0x2f9d5a},{id:'n_rainbow',n:'Rainbow Scarf',slot:'neck',p:200,m:'scarf',c:0xff0000,rainbow:true},
 {id:'n_bowtie',n:'Bow Tie',slot:'neck',p:50,m:'bowtie',c:0xd8383e},{id:'n_lei',n:'Flower Lei',slot:'neck',p:90,m:'lei',c:0xff8ac0},
 {id:'n_medal',n:'Gold Medal',slot:'neck',p:300,m:'medal',c:0xffc83a},{id:'n_bell',n:'Jingle Collar',slot:'neck',p:80,m:'bell',c:0x2f9d5a},
 {id:'f_round',n:'Round Specs',slot:'face',p:60,m:'round',c:0x2a2a30},{id:'f_shades',n:'Cool Shades',slot:'face',p:90,m:'shades',c:0x111114},
 {id:'f_star',n:'Star Glasses',slot:'face',p:120,m:'star',c:0xff5fa8},{id:'f_heart',n:'Heart Glasses',slot:'face',p:120,m:'heart',c:0xff3355},
 {id:'f_goggles',n:'Ski Goggles',slot:'face',p:150,m:'goggles',c:0xff8a1a},{id:'f_mono',n:'Monocle',slot:'face',p:180,m:'mono',c:0xd8b040},
];
export const FURN=[
 {id:'fu_rug',n:'Round Rug',p:40,m:'rug'},{id:'fu_stool',n:'Ice Stool',p:30,m:'stool'},{id:'fu_table',n:'Round Table',p:60,m:'table'},{id:'fu_chair',n:'Comfy Armchair',p:90,m:'chair'},
 {id:'fu_sofa',n:'Snug Sofa',p:150,m:'sofa'},{id:'fu_bean',n:'Beanbag',p:70,m:'bean'},{id:'fu_lamp',n:'Floor Lamp',p:80,m:'lamp'},{id:'fu_plant',n:'Potted Fern',p:50,m:'plant'},
 {id:'fu_shelf',n:'Bookshelf',p:120,m:'shelf'},{id:'fu_tv',n:'Big Screen',p:220,m:'tv'},{id:'fu_fire',n:'Fireplace',p:260,m:'fire'},{id:'fu_bed',n:'Cosy Bed',p:200,m:'bed'},
 {id:'fu_tank',n:'Fish Tank',p:180,m:'tank'},{id:'fu_tree',n:'Twinkle Pine',p:160,m:'tree'},{id:'fu_arcade',n:'Arcade Cabinet',p:300,m:'arcade'},{id:'fu_piano',n:'Little Piano',p:340,m:'piano'},
 {id:'fu_snowman',n:'Indoor Snowman',p:60,m:'snowman'},{id:'fu_jukebox',n:'Jukebox',p:280,m:'jukebox'},
];
export const PETS=[
 {id:'pet_pink',n:'Pink Pomlet',p:150,c:0xff8ac0,trait:'cuddly'},{id:'pet_blue',n:'Blue Pomlet',p:150,c:0x58a8ff,trait:'speedy'},{id:'pet_green',n:'Green Pomlet',p:150,c:0x6ad86a,trait:'bouncy'},
 {id:'pet_yellow',n:'Yellow Pomlet',p:180,c:0xffd84a,trait:'sleepy'},{id:'pet_purple',n:'Purple Pomlet',p:220,c:0xb07aff,trait:'curious'},{id:'pet_gold',n:'Golden Pomlet',p:500,c:0xffc23a,trait:'sparkly'},
];
export const PARTIES=[
 {id:'flake',n:'Snowflake Festival',cols:[0x7ec8ff,0xffffff,0xb8e0ff],hat:{id:'h_party_flake',n:'Snowflake Party Cone',slot:'hat',p:0,m:'party',c:0x7ec8ff}},
 {id:'lantern',n:'Lantern Night',cols:[0xff5a3a,0xffc23a,0xff8a2a],hat:{id:'h_party_lantern',n:'Lantern Party Cone',slot:'hat',p:0,m:'party',c:0xff5a3a}},
 {id:'beach',n:'Frosty Beach Bash',cols:[0x2fc4d8,0xffd84a,0xff6f9a],hat:{id:'h_party_beach',n:'Beach Party Cone',slot:'hat',p:0,m:'party',c:0x2fc4d8}},
 {id:'music',n:'Music Jam',cols:[0xb07aff,0x2fe0c0,0xff4d9a],hat:{id:'h_party_music',n:'Music Jam Cone',slot:'hat',p:0,m:'party',c:0xb07aff}},
 {id:'pom',n:'Pomlet Parade',cols:[0xff8ac0,0x58a8ff,0x6ad86a],hat:{id:'h_party_pom',n:'Pom Party Cone',slot:'hat',p:0,m:'party',c:0x6ad86a}},
 {id:'cocoa',n:'Cocoa Carnival',cols:[0x8a5030,0xf4e0c0,0xd8383e],hat:{id:'h_party_cocoa',n:'Cocoa Party Cone',slot:'hat',p:0,m:'party',c:0x8a5030}},
 {id:'aurora',n:'Aurora Gala',cols:[0x40f0b0,0x8a55ff,0x2fb0ff],hat:{id:'h_party_aurora',n:'Aurora Party Cone',slot:'hat',p:0,m:'party',c:0x40f0b0}},
];
export const ALL={};for(const a of[...BODY_COLORS.map(x=>({...x,kind:'color'})),...WEAR.map(x=>({...x,kind:'wear'})),...FURN.map(x=>({...x,kind:'furn'})),...PETS.map(x=>({...x,kind:'pet'})),...PARTIES.map(x=>({...x.hat,kind:'wear',party:true}))])ALL[a.id]=a;

/* ---------- clothing models (relative to the head centre at y=1.22 / neck at y=1.0 / eyes plane) ---------- */
const stripeTex=(a,b,n=6,diag=true)=>ctex(64,64,(x,w,h)=>{x.fillStyle=a;x.fillRect(0,0,w,h);x.fillStyle=b;for(let i=-n;i<n*2;i++){x.beginPath();const s=w/n;x.moveTo(i*s,0);x.lineTo(i*s+s/2,0);x.lineTo(i*s+s/2-(diag?w:0),h);x.lineTo(i*s-(diag?w:0),h);x.fill();}});
const hex=c=>'#'+new G.Color(c).getHexString();
export function wearModel(it){const g=new G.Group(),c=it.c??0xffffff,col=new G.Color(c);let m;
 switch(it.m){
  case'beanie':m=meshOf([P(new G.SphereGeometry(.5,24,12,0,Math.PI*2,0,Math.PI/2),0,.15,0,0,0,0,1,.78,1,c),P(T(.49,.07,8,28),0,.17,0,Math.PI/2,0,0,1,1,1,col.clone().multiplyScalar(.8)),P(S(.12,10,8),0,.56,0,0,0,0,1,1,1,0xffffff)],{r:.95});break;
  case'cap':m=meshOf([P(new G.SphereGeometry(.5,24,12,0,Math.PI*2,0,Math.PI/2),0,.08,0,0,0,0,1,.7,1,c),P(C(.36,.38,.03,24),0,.1,.36,.12,0,0,1,1,.8,col.clone().multiplyScalar(.75)),P(S(.05,8,6),0,.43,0,0,0,0,1,1,1,0xffffff)],{r:.8});break;
  case'prop':{m=meshOf([P(new G.SphereGeometry(.5,24,12,0,Math.PI*2,0,Math.PI/2),0,.06,0,0,0,0,1,.75,1,c),P(C(.36,.38,.03,24),0,.08,.36,.1,0,0,1,1,.7,0xd8383e),P(C(.02,.02,.14),0,.48,0,0,0,0,1,1,1,0x666666)],{r:.7});
   const pr=meshOf([P(B(.62,.015,.1),0,0,0,0,0,.15,1,1,1,0xd8383e),P(B(.1,.015,.62),0,0,0,.15,0,0,1,1,1,0x3f86e0),P(S(.04),0,0,0,0,0,0,1,1,1,0xf2c230)],{r:.5});pr.position.y=.56;pr.userData.spin=14;g.add(pr);break;}
  case'top':m=meshOf([P(C(.55,.55,.03,28),0,.3,0,0,0,0,1,1,1,c),P(C(.33,.31,.55,24),0,.58,0,0,0,0,1,1,1,c),P(C(.335,.335,.1,24,true),0,.38,0,0,0,0,1,1,1,0xb02030)],{r:.45});m.rotation.z=-.08;break;
  case'chef':m=meshOf([P(C(.4,.38,.25,24),0,.33,0,0,0,0,1,1,1,0xf4f4f4),...[0,1,2,3,4,5].map(i=>P(S(.2,12,8),Math.cos(i)*.2,.55+rnd(.08),Math.sin(i)*.2,0,0,0,1,1,1,0xffffff)),P(S(.24,12,8),0,.65,0,0,0,0,1,1,1,0xffffff)],{r:.95});break;
  case'party':{const tx=stripeTex(hex(c),'#ffffff',4);const cone=new G.Mesh(K(.26,.62,24),new G.MeshStandardMaterial({map:tx,roughness:.6}));cone.position.y=.72;cone.castShadow=false;g.add(cone);
   m=meshOf([P(S(.09,10,8),0,1.05,0,0,0,0,1,1,1,0xffffff),P(T(.25,.035,6,24),0,.42,0,Math.PI/2,0,0,1,1,1,0xffffff)]);g.rotation.z=.18;break;}
  case'flower':{const L=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2,fc=[0xff6fae,0xffd84a,0xffffff,0xb07aff][i%4];L.push(P(S(.085,10,8),Math.cos(a)*.42,.22,Math.sin(a)*.42,0,0,0,1,.7,1,fc),P(S(.04,6,6),Math.cos(a)*.47,.25,Math.sin(a)*.47,0,0,0,1,1,1,0xffc83a));}L.push(P(T(.42,.03,6,28),0,.2,0,Math.PI/2,0,0,1,1,1,0x3a9a4a));m=meshOf(L,{r:.7});break;}
  case'muffs':m=meshOf([P(T(.47,.035,6,24,Math.PI),0,.08,0,0,0,0,1,1,1,0xcfcfd8),P(S(.16,14,10),.47,.02,0,0,0,0,.7,1,1,c),P(S(.16,14,10),-.47,.02,0,0,0,0,.7,1,1,c)],{r:.95});break;
  case'phones':m=meshOf([P(T(.5,.04,6,24,Math.PI),0,.06,0,0,0,0,1,1,1,c),P(C(.15,.15,.12,18),.5,0,0,0,0,Math.PI/2,1,1,1,c),P(C(.15,.15,.12,18),-.5,0,0,0,0,Math.PI/2,1,1,1,c),P(C(.11,.11,.13,18),.51,0,0,0,0,Math.PI/2,1,1,1,0xff4d00),P(C(.11,.11,.13,18),-.51,0,0,0,0,Math.PI/2,1,1,1,0xff4d00)],{r:.35,m:.3});break;
  case'wizard':{const tx=ctex(128,128,(x,w,h)=>{x.fillStyle=hex(c);x.fillRect(0,0,w,h);x.fillStyle='#ffe066';for(let i=0;i<14;i++){const sx=rnd(w),sy=rnd(h),r=4+rnd(5);x.beginPath();for(let k=0;k<10;k++){const a=k/10*Math.PI*2,rr=k%2?r*.45:r;x.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr);}x.fill();}});
   const cone=new G.Mesh(K(.42,1.0,28),new G.MeshStandardMaterial({map:tx,roughness:.7}));cone.position.y=.78;cone.rotation.z=-.15;g.add(cone);m=meshOf([P(C(.62,.62,.04,32),0,.28,0,0,0,0,1,1,1,c)],{r:.7});break;}
  case'bow':m=meshOf([P(K(.17,.32,12),.2,.22,.08,0,0,Math.PI/2+.3,1,1,.55,c),P(K(.17,.32,12),-.2,.22,.08,0,0,-Math.PI/2-.3,1,1,.55,c),P(S(.08,10,8),0,.22,.08,0,0,0,1,1,1,col.clone().multiplyScalar(.8))],{r:.5});m.position.set(.28,.12,0);m.rotation.z=-.5;break;
  case'helmet':m=meshOf([P(new G.SphereGeometry(.52,24,12,0,Math.PI*2,0,Math.PI/2),0,.05,0,0,0,0,1,.85,1,c),P(C(.62,.64,.04,28),0,.07,0,0,0,0,1,1,1,col.clone().multiplyScalar(.85)),P(C(.09,.09,.08,14),0,.3,.42,Math.PI/2-.5,0,0,1,1,1,0xfff2b0)],{r:.6});
   {const lamp=new G.Mesh(S(.07,10,8),new G.MeshBasicMaterial({color:new G.Color(3,2.8,2)}));lamp.position.set(0,.33,.46);g.add(lamp);}break;
  case'crown':{const L=[P(C(.36,.34,.2,24,true),0,.3,0,0,0,0,1,1,1,0xffc83a)];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;L.push(P(K(.07,.18,6),Math.cos(a)*.35,.47,Math.sin(a)*.35,0,0,0,1,1,1,0xffc83a),P(S(.035,6,6),Math.cos(a)*.37,.3,Math.sin(a)*.37,0,0,0,1,1,1,[0xff2050,0x30a0ff,0x30e080][i%3]));}
   m=meshOf(L,{r:.25,m:.9,env:1.4});m.material.side=G.DoubleSide;m.rotation.z=-.08;break;}
  // neck (origin at the neck ring y=1.0)
  case'scarf':{const ring=new G.Mesh(T(.5,.1,10,32),it.rainbow?new G.MeshStandardMaterial({map:ctex(128,8,(x,w,h)=>{['#ff3b3b','#ff9a2e','#ffe14a','#4cd06a','#3f86e0','#9a55e0'].forEach((cc,i)=>{x.fillStyle=cc;x.fillRect(i*w/6,0,w/6+1,h);});}),roughness:.9}):
    it.c2?new G.MeshStandardMaterial({map:(()=>{const t=ctex(128,8,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?hex(it.c2):hex(c);x.fillRect(i*w/8,0,w/8+1,h);}});return t;})(),roughness:.9}):new G.MeshStandardMaterial({color:c,roughness:.95}));
   ring.rotation.x=Math.PI/2;ring.scale.set(1.04,1.04,1.3);g.add(ring);const tail=new G.Mesh(B(.18,.5,.06),ring.material);tail.position.set(.22,-.22,.5);tail.rotation.set(.15,0,.12);g.add(tail);tail.userData.sway=1;g.userData.tail=tail;return g;}
  case'bowtie':m=meshOf([P(K(.11,.2,4),.11,0,.52,0,0,Math.PI/2,1,1,.5,c),P(K(.11,.2,4),-.11,0,.52,0,0,-Math.PI/2,1,1,.5,c),P(S(.05,8,6),0,0,.54,0,0,0,1,1,1,col.clone().multiplyScalar(.7))],{r:.5});break;
  case'lei':{const L=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;L.push(P(S(.075,8,6),Math.sin(a)*.52,-.02+Math.cos(a)*-.05,Math.cos(a)*.52,0,0,0,1,.7,1,[0xff8ac0,0xffffff,0xffd84a,0xff5a7a][i%4]));}m=meshOf(L,{r:.7});break;}
  case'medal':m=meshOf([P(T(.5,.03,6,28),0,.02,0,Math.PI/2,0,0,1,1,1,0x3050c0),P(C(.12,.12,.03,20),0,-.28,.56,Math.PI/2-.25,0,0,1,1,1,0xffc83a),P(B(.06,.3,.02),0,-.12,.55,-.25,0,0,1,1,1,0x3050c0)],{r:.3,m:.6});break;
  case'bell':m=meshOf([P(T(.5,.05,8,28),0,0,0,Math.PI/2,0,0,1,1,1,c),P(S(.09,12,8),0,-.1,.54,0,0,0,1,1,1,0xffc83a)],{r:.35,m:.4});break;
  // face (origin at eye height y=1.25)
  case'round':m=meshOf([P(T(.11,.018,6,20),.17,0,.5,0,.3,0,1,1,1,c),P(T(.11,.018,6,20),-.17,0,.5,0,-.3,0,1,1,1,c),P(C(.012,.012,.12,6),0,.02,.53,0,0,Math.PI/2,1,1,1,c)],{r:.3,m:.7});
   {const lens=new G.Mesh(merge([P(new G.CircleGeometry(.1,18),.17,0,.505,0,.3,0),P(new G.CircleGeometry(.1,18),-.17,0,.505,0,-.3,0)]),new G.MeshStandardMaterial({color:0xcfe8ff,transparent:true,opacity:.22,roughness:.05,metalness:.2}));g.add(lens);}break;
  case'shades':m=meshOf([P(B(.22,.13,.03),.15,0,.51,0,.28,0,1,1,1,c),P(B(.22,.13,.03),-.15,0,.51,0,-.28,0,1,1,1,c),P(B(.1,.025,.02),0,.04,.535,0,0,0,1,1,1,0x333333)],{r:.08,m:.5,env:1.6});break;
  case'star':case'heart':{const sh=new G.Shape();if(it.m==='star'){for(let k=0;k<10;k++){const a=k/10*Math.PI*2+Math.PI/2,r=k%2?.055:.13;k?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r);}}
   else{sh.moveTo(0,-.1);sh.bezierCurveTo(-.16,0,-.12,.13,0,.06);sh.bezierCurveTo(.12,.13,.16,0,0,-.1);}
   const eg=new G.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:false});m=meshOf([P(eg,.17,0,.5,0,.3,0,1,1,1,c),P(eg,-.17,0,.5,0,-.3,0,1,1,1,c),P(B(.1,.02,.02),0,.02,.53,0,0,0,1,1,1,c)],{r:.3});break;}
  case'goggles':m=meshOf([P(T(.5,.035,6,32),0,0,0,Math.PI/2,0,0,1,1,1,0x222228),P(new G.SphereGeometry(.24,20,10,-.9,1.8,.9,1.3),0,-.02,.29,0,0,0,1.3,.7,1,c)],{r:.05,m:.8,env:2});break;
  case'mono':m=meshOf([P(T(.1,.016,6,20),.17,0,.5,0,.3,0,1,1,1,c),P(C(.006,.006,.4,4),.24,-.22,.48,0,0,.1,1,1,1,c)],{r:.2,m:.9});break;
 }
 if(m)g.add(m);if(['cap','prop','helmet','muffs','phones'].includes(it.m))g.position.y=.08;return g;}
export const SLOT_POS={hat:[0,1.22,0],neck:[0,1.0,0],face:[0,1.25,0]};

/* ---------- pomlets (original fuzzy pets) ---------- */
let pomGeo=null;
function pomGeometry(){if(pomGeo)return pomGeo;const g=new G.IcosahedronGeometry(.3,4),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new V3().fromBufferAttribute(p,i);const n=v.clone().normalize();const f=1+.08*Math.sin(n.x*23+n.y*17)*Math.sin(n.z*19-n.y*11)+.04*Math.sin(n.x*51+n.z*47);v.copy(n.multiplyScalar(.3*f));v.y*=.92;p.setXYZ(i,v.x,v.y,v.z);}
 g.computeVertexNormals();pomGeo=g;g.userData.keep=true;return g;}
const eyeMat=new G.MeshStandardMaterial({vertexColors:true,roughness:.08,envMapIntensity:1.2});eyeMat.userData.keep=true;
let pomEyes=null;
export function makePomlet(color){const root=new G.Group(),body=new G.Group();root.add(body);
 const m=new G.MeshStandardMaterial({color,roughness:.95,envMapIntensity:.5});
 m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat fz=pow(1.-abs(dot(normalize(vViewPosition),normal)),2.);totalEmissiveRadiance+=diffuseColor.rgb*fz*.55;');};m.customProgramCacheKey=()=>'pom';
 const ball=new G.Mesh(pomGeometry(),m);ball.position.y=.3;ball.castShadow=true;body.add(ball);
 if(!pomEyes){pomEyes=merge([P(S(.075,12,10),.11,0,0,0,0,0,1,1,.6,0x111118),P(S(.075,12,10),-.11,0,0,0,0,0,1,1,.6,0x111118),P(S(.025,6,6),.13,.03,.04,0,0,0,1,1,1,0xffffff),P(S(.025,6,6),-.09,.03,.04,0,0,0,1,1,1,0xffffff)]);pomEyes.userData.keep=true;}
 const eyes=new G.Mesh(pomEyes,eyeMat);eyes.position.set(0,.36,.25);body.add(eyes);
 const tuft=new G.Mesh(merge([P(K(.05,.2,6),0,.1,0,0,0,.3),P(K(.04,.16,6),.05,.07,0,0,0,-.4),P(K(.04,.16,6),-.05,.07,0,0,0,.7)]),m);tuft.position.y=.58;body.add(tuft);
 root.userData={body,eyes,t:Math.random()*10,hop:0,blink:2};return root;}
export function animPomlet(p,dt,moving,excited=0){const u=p.userData;u.t+=dt;const b=u.body;
 if(moving||excited){u.hop+=dt*(moving?9:7);const h=Math.abs(Math.sin(u.hop));b.position.y=h*(.32+excited*.2);const sq=1-(1-h)*.25;b.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));}
 else{b.position.y*=Math.exp(-dt*10);const br=1+Math.sin(u.t*2.4)*.03;b.scale.set(1/Math.sqrt(br),br,1/Math.sqrt(br));}
 u.blink-=dt;u.eyes.scale.y=u.blink<.12?.1:1;if(u.blink<0)u.blink=2+Math.random()*3;}

/* ---------- igloo furniture ---------- */
export function furnModel(id){const it=ALL[id]||{m:'stool'};let list=[],o={},extra=null;const W=0xf4f1ea,WD=0x8a5a3a,WDL=0xb07a50;
 switch(it.m){
  case'rug':list=[P(C(1.6,1.6,.04,40),0,.02,0,0,0,0,1,1,1,0xc84a5a),P(C(1.25,1.25,.05,40),0,.025,0,0,0,0,1,1,1,0xf2c060),P(C(.8,.8,.06,40),0,.03,0,0,0,0,1,1,1,0x3f86e0)];o.r=1;break;
  case'stool':list=[P(C(.42,.36,.5,20),0,.25,0,0,0,0,1,1,1,0xcfe8ff)];o.r=.15;break;
  case'table':list=[P(C(.9,.9,.08,28),0,.8,0,0,0,0,1,1,1,WDL),P(C(.08,.12,.8,10),0,.4,0,0,0,0,1,1,1,WD),P(C(.45,.5,.06,20),0,.03,0,0,0,0,1,1,1,WD),P(C(.12,.1,.18,12),.2,.93,.1,0,0,0,1,1,1,0xffffff)];break;
  case'chair':list=[P(B(1.3,.45,1.1),0,.35,0,0,0,0,1,1,1,0x4a7ad0),P(B(1.3,1,.3),0,.8,-.42,0,0,0,1,1,1,0x4a7ad0),P(B(.25,.7,1.1),.6,.55,0,0,0,0,1,1,1,0x3a68b8),P(B(.25,.7,1.1),-.6,.55,0,0,0,0,1,1,1,0x3a68b8),P(B(.9,.15,.8),0,.62,.05,0,0,0,1,1,1,0x6a96e8)];o.r=.95;break;
  case'sofa':list=[P(B(2.6,.45,1.1),0,.35,0,0,0,0,1,1,1,0xd86a5a),P(B(2.6,1,.3),0,.8,-.42,0,0,0,1,1,1,0xd86a5a),P(B(.3,.75,1.1),1.3,.55,0,0,0,0,1,1,1,0xc05a4a),P(B(.3,.75,1.1),-1.3,.55,0,0,0,0,1,1,1,0xc05a4a),P(B(1.1,.16,.8),.58,.64,.05,0,0,0,1,1,1,0xe88a7a),P(B(1.1,.16,.8),-.58,.64,.05,0,0,0,1,1,1,0xe88a7a),P(B(.45,.45,.15),.8,.95,-.2,0,0,.2,1,1,1,0xf2c060)];o.r=.95;break;
  case'bean':{const g=S(.75,20,14);list=[P(g,0,.42,0,0,0,0,1,.6,1,0x9a55e0),P(S(.5,16,10),0,.62,-.3,0,0,0,1,.8,.7,0x8a45d0)];o.r=1;break;}
  case'lamp':list=[P(C(.3,.35,.06,20),0,.03,0,0,0,0,1,1,1,0x333338),P(C(.04,.04,1.9,8),0,1,0,0,0,0,1,1,1,0x333338)];extra=new G.Mesh(C(.28,.45,.45,20,true),new G.MeshStandardMaterial({color:0xfff0c8,emissive:0xffb050,emissiveIntensity:2.2,side:G.DoubleSide,roughness:.9}));extra.position.y=1.95;o.light=[0,1.9,0];break;
  case'plant':{list=[P(C(.32,.25,.5,16),0,.25,0,0,0,0,1,1,1,0xc8603a),P(C(.3,.3,.04,16),0,.5,0,0,0,0,1,1,1,0x4a3020)];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;list.push(P(K(.1,.9,6),Math.cos(a)*.15,.9,Math.sin(a)*.15,Math.sin(a)*.5,0,-Math.cos(a)*.5,1,1,.4,i%2?0x3a9a4a:0x2f8040));}break;}
  case'shelf':{list=[P(B(1.6,2.2,.5),0,1.1,0,0,0,0,1,1,1,WD)];for(let r=0;r<3;r++){list.push(P(B(1.45,.5,.4),0,.45+r*.65,.06,0,0,0,1,1,1,0x5a3a26));for(let k=0;k<7;k++)list.push(P(B(.14+rnd(.06),.36+rnd(.08),.32),-.55+k*.18,.42+r*.65,.1,0,0,rnd(.1),1,1,1,[0xd8383e,0x3f86e0,0xf2c230,0x2f9d5a,0x9a55e0][(k+r)%5]));}o.r=.75;break;}
  case'tv':list=[P(B(1.8,.5,.6),0,.25,0,0,0,0,1,1,1,0x3a3a40),P(B(2,1.15,.1),0,1.15,0,0,0,0,1,1,1,0x18181c)];extra=new G.Mesh(new G.PlaneGeometry(1.84,1),new G.MeshBasicMaterial({map:ctex(128,72,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#5ab0ff');g.addColorStop(1,'#d8f0ff');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.beginPath();x.ellipse(64,48,22,26,0,0,7);x.fill();x.fillStyle='#2a3566';x.beginPath();x.ellipse(64,40,20,20,0,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.ellipse(64,46,13,15,0,0,7);x.fill();x.fillStyle='#111';x.fillRect(57,36,4,5);x.fillRect(67,36,4,5);x.fillStyle='#f28a2e';x.fillRect(62,43,5,3);}),toneMapped:false,color:new G.Color(1.3,1.3,1.3)}));extra.position.set(0,1.15,.06);break;
  case'fire':list=[P(B(2,1.5,.7),0,.75,0,0,0,0,1,1,1,0x9a6a5a),P(B(1.1,.85,.4),0,.5,.2,0,0,0,1,1,1,0x2a1a18),P(B(2.2,.15,.85),0,1.55,.02,0,0,0,1,1,1,0x7a4a3a),P(C(.08,.08,.8,8),0,.2,.25,0,0,Math.PI/2,1,1,1,0x5a3a26)];
   extra=new G.Mesh(merge([P(K(.22,.6,8),0,.5,.3),P(K(.15,.45,8),.2,.42,.3),P(K(.15,.45,8),-.2,.42,.3)]),new G.MeshBasicMaterial({color:new G.Color(4,1.6,.4),vertexColors:true}));extra.userData.flicker=1;o.light=[0,.7,.9];o.lightCol=0xff8030;break;
  case'bed':list=[P(B(1.6,.45,2.4),0,.25,0,0,0,0,1,1,1,WD),P(B(1.5,.25,2.2),0,.55,0,0,0,0,1,1,1,0xffffff),P(B(1.55,.12,1.5),0,.68,.35,0,0,0,1,1,1,0x58a8ff),P(B(1,.2,.45),0,.75,-.8,0,0,0,1,1,1,0xffffff),P(B(1.6,1,.15),0,.75,-1.15,0,0,0,1,1,1,WDL)];o.r=1.2;break;
  case'tank':{list=[P(B(1.6,.7,.7),0,.35,0,0,0,0,1,1,1,0x2a2a30),P(B(1.5,.06,.6),0,.74,0,0,0,0,1,1,1,0xe8d8a0)];extra=new G.Group();const gl=new G.Mesh(B(1.5,.9,.6),new G.MeshStandardMaterial({color:0x7ad0ff,transparent:true,opacity:.35,roughness:.05,emissive:0x2070a0,emissiveIntensity:.6}));gl.position.y=1.2;extra.add(gl);
   for(let i=0;i<3;i++){const f=new G.Mesh(merge([P(S(.08,8,6),0,0,0,0,0,0,1.4,1,.6,0xff8a2a),P(K(.06,.1,4),-.13,0,0,0,0,Math.PI/2,1,1,.4,0xff8a2a)]),new G.MeshStandardMaterial({vertexColors:true,emissive:0x803010}));f.position.set(-.4+i*.4,1.05+i*.12,0);f.userData.fish=i;extra.add(f);}break;}
  case'tree':{list=[P(C(.12,.15,.5,8),0,.25,0,0,0,0,1,1,1,0x6a4a30)];for(let i=0;i<4;i++)list.push(P(K(.9-i*.18,.9,12),0,.8+i*.5,0,0,0,0,1,1,1,0x2f7d4a));extra=new G.Mesh(merge(Array.from({length:22},(_,i)=>{const h=.6+rnd(1.7),r=(.85-h*.33)*.95,a=rnd(7);return P(S(.06,6,4),Math.cos(a)*r,h,Math.sin(a)*r,0,0,0,1,1,1,[0xff4040,0xffd040,0x40c0ff,0xff60c0][i%4]);})),new G.MeshBasicMaterial({vertexColors:true,color:new G.Color(2.5,2.5,2.5)}));
   const star=new G.Mesh(S(.14,8,6),new G.MeshBasicMaterial({color:new G.Color(4,3.2,1)}));star.position.y=2.75;extra.add(star);break;}
  case'arcade':list=[P(B(1,2.1,.9),0,1.05,0,0,0,0,1,1,1,0x2a2a6a),P(B(1.02,.4,.5),0,1.2,.35,-.4,0,0,1,1,1,0x1a1a40),P(S(.06,8,6),-.2,1.4,.6,0,0,0,1,1,1,0xff3040),P(S(.05,8,6),.15,1.38,.6,0,0,0,1,1,1,0x30e0ff),P(S(.05,8,6),.3,1.38,.6,0,0,0,1,1,1,0xffe040)];
   extra=new G.Mesh(new G.PlaneGeometry(.8,.65),new G.MeshBasicMaterial({map:ctex(64,52,(x,w,h)=>{x.fillStyle='#08081a';x.fillRect(0,0,w,h);for(let i=0;i<30;i++){x.fillStyle=['#ff4d00','#30e0ff','#ffe040'][i%3];x.fillRect(rnd(w),rnd(h),3,3);}x.fillStyle='#fff';x.fillRect(28,40,8,6);}),toneMapped:false,color:new G.Color(1.6,1.6,1.6)}));extra.position.set(0,1.75,.46);extra.rotation.x=-.12;o.r=.7;break;
  case'piano':{list=[P(B(1.9,1.1,.7),0,.95,0,0,0,0,1,1,1,0x1a1a1e),P(B(1.9,.08,.4),0,.85,.5,0,0,0,1,1,1,0xffffff),P(B(.12,.75,.12),-.85,.38,.5,0,0,0,1,1,1,0x1a1a1e),P(B(.12,.75,.12),.85,.38,.5,0,0,0,1,1,1,0x1a1a1e)];for(let k=0;k<12;k++)if(k%7!==2&&k%7!==6)list.push(P(B(.07,.06,.22),-.8+k*.145+.07,.9,.45,0,0,0,1,1,1,0x111111));o.r=.15;o.m=.2;break;}
  case'snowman':list=[P(S(.55,16,12),0,.5,0,0,0,0,1,1,1,0xffffff),P(S(.4,16,12),0,1.25,0,0,0,0,1,1,1,0xffffff),P(S(.28,16,12),0,1.8,0,0,0,0,1,1,1,0xffffff),P(K(.06,.3,8),0,1.8,.38,Math.PI/2,0,0,1,1,1,0xff7a1a),P(S(.04),.1,1.88,.24,0,0,0,1,1,1,0x111111),P(S(.04),-.1,1.88,.24,0,0,0,1,1,1,0x111111),P(T(.3,.07,8,20),0,1.55,0,Math.PI/2,0,0,1,1,1,0xd8383e)];o.r=.9;break;
  case'jukebox':list=[P(B(1.2,1.6,.7),0,.8,0,0,0,0,1,1,1,0x8a2a3a),P(new G.CylinderGeometry(.6,.6,.7,24,1,false,-Math.PI/2,Math.PI),0,1.6,0,Math.PI/2,0,Math.PI/2,1,1,1,0x8a2a3a)];
   extra=new G.Mesh(merge([P(B(.9,.08,.05),0,.5,.36),P(B(.9,.08,.05),0,.9,.36),P(T(.5,.04,6,24,Math.PI),0,1.55,.36)]),new G.MeshBasicMaterial({color:new G.Color(3,1.2,2.6)}));extra.userData.pulse=1;o.r=.3;break;
 }
 const g=new G.Group();const body=meshOf(list,{r:o.r??.75,m:o.m??0});body.castShadow=true;g.add(body);if(extra)g.add(extra);g.userData={id,light:o.light,lightCol:o.lightCol,extra};
 const bb=new G.Box3().setFromObject(g);g.userData.radius=Math.max(.5,Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)*.5);return g;}
