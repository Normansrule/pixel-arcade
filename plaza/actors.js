// PENGUIN PLAZA — actors (player + NPC penguins): movement, belly slides, pets, NPC brains, canned chat.
import {THREE,V3,cl,rnd,ri,pick,damp,dampAng,angDiff} from './util.js';
import {Penguin} from './penguin.js';
import {makePomlet,animPomlet,PETS,WEAR,BODY_COLORS} from './items.js';
import {ROOMS,SPACE_ORIGIN} from './world.js';

export const PSCALE=1.3;
export const NAMES=['Pebble','Biscuit','Sprinkles','Noodle','Flurry','Tofu','Pip','Juniper','Marble','Puddle','Skipper','Clementine','Dumpling','Frost','Bean','Sunny','Coco','Maple','Ollie','Pippin','Sleet','Taffy','Zuzu','Bramble','Crumpet','Wafer','Kipper'];
export const LINES={
 greet:['Hi there!','Hello!','Hey hey!','Hiya!','Waddle on!','Nice to see you!','Howdy, friend!','Oh hi!'],
 small:['Brr, chilly today!','I love the snow here.','Have you seen the lighthouse at night?','The cocoa at the Coffee Shop is the best!','My pomlet loves belly slides.','I just bought a new hat!','Anyone want to play?','I\'m saving up for a crown!','The dance club is jumping!','Did you find any golden snowflakes?','Let\'s have a snowball fight!','I like your outfit!','The fish are biting at the dock!','Slide down the ski hill on your belly!','I decorated my igloo yesterday.','This island is so cosy.'],
 tips:['Hold W to tuck in Sled Dash - but steering gets harder!','Jellyfish make you drop your catch in Frosty Fishing.','Pull pizzas out of the oven when the bar is golden!','Keep your combo up in Disco Floe for Fever mode!','Whistle with Space to scare pomlets into the pen!','Duck under low beams with S in Rail Rider!','Stand still to pack more snowballs in Snow Fort Showdown!','Golden snowflakes are hidden all over the island - 5 coins each!','You can decorate your igloo with furniture from the catalog.','Press M to open the island map and travel fast.'],
 jokes:['What\'s a penguin\'s favourite relative? Aunt Arctica!','Why can\'t penguins fly? No room in the overhead bin!','What do penguins wear on their heads? Ice caps!','How do penguins build houses? Igloos them together!','What\'s black, white and goes round and round? A penguin in a revolving door!','Where do penguins go to vote? The North Poll!'],
 night:['Look at all the stars!','Time for one more game before bed!','The aurora is glowing tonight!','The lighthouse beam is so pretty.'],
 party:['Happy {party}!','Have you claimed your free party hat?','This {party} is the best one yet!','I love the decorations!'],
 bye:['See you later!','Bye bye!','Catch you on the ice!','Waddle you later!'],
 thanks:['Aww, thank you!','You\'re too kind!','Thanks, friend!','That made my day!'],
 hit:['Hey!','Oof!','No fair!','Ha! Got me!','Brrr!','You\'re on!'],
 play:['Sure, let\'s play!','Race you to the ski hill!','I\'m in!','Maybe later, I\'m busy sipping cocoa.'],
 fav:['Sled Dash, for sure!','I love Disco Floe!','Frosty Fishing is so relaxing.','Pizza Rush! I\'m a great chef.','Rail Rider is wild!','Snow Fort Showdown, obviously!','Pomlet Roundup - they\'re so fluffy!'],
 friend:['Yes! Best buddies!','Of course!','Friends forever!'],
 howru:['I\'m great, thanks!','Super chilly - perfect!','Never better!','A little sleepy, but good!'],
};
export const EMOTES=['♥','☺','★','♪','☃','❄','!','?','☕','✿'];
export const SAFE=[
 {n:'Greetings',l:[['Hello!','greet'],['Hi everyone!','greet'],['How are you?','howru'],['Nice to meet you!','greet']]},
 {n:'Questions',l:[['Want to play a game?','play'],['What\'s your favourite game?','fav'],['Want to be friends?','friend'],['Any tips?','tips']]},
 {n:'Compliments',l:[['Cool outfit!','thanks'],['Nice dance moves!','thanks'],['You\'re awesome!','thanks'],['I love this island!','small']]},
 {n:'Fun',l:[['Snowball fight!','fight'],['Let\'s dance!','dance'],['Tell me a joke!','jokes'],['Party time!','party']]},
 {n:'Goodbyes',l:[['See you later!','bye'],['Gotta go!','bye'],['Bye!','bye']]},
];

export class Actor{
 constructor(o){this.pg=new Penguin({color:o.color,wear:o.wear,scale:PSCALE});this.name=o.name;this.npc=!!o.npc;this.space=o.space||'out';this.pos=new V3(o.x||0,0,o.z||0);this.ry=o.ry??0;this.target=null;this.speed=0;this.maxSp=o.speed??(this.npc?3.1+rnd(.6):4.6);
  this.state='idle';this.stT=rnd(3);this.home=o.home;this.bubble=null;this.pet=null;this.slide=0;this.stuckT=0;this.lastPos=new V3();this.vy=0;this.yv=0;this.seat=null;this.color=o.color;this.wear=o.wear||{};this.hp=3;
  this.cool=0;this.dressT=rnd(60);}
 setPet(id,scene){if(this.pet){scene.remove(this.pet.m);this.pet=null;}const p=PETS.find(x=>x.id===id);if(!p)return;const m=makePomlet(p.c);m.scale.setScalar(1.25);scene.add(m);this.pet={m,id,pos:this.pos.clone().add(new V3(1,0,1)),ry:0,t:0};}
 face(x,z){this.ry=Math.atan2(x-this.pos.x,z-this.pos.z);}}

/* ---------- movement shared by player and NPCs ---------- */
const tv=new V3();
export function moveActor(a,dt,W,fx){const pg=a.pg;let moving=false,spd=0;
 if(a.target&&a.state!=='sit'){tv.set(a.target.x-a.pos.x,0,a.target.z-a.pos.z);const d=tv.length();
  if(d<.25){a.target=null;}else{tv.divideScalar(d);
   // belly slide downhill (outdoors, steep)
   let slope=0;if(a.space==='out'&&!W.onPlatform(a.pos.x,a.pos.z)){const h0=W.height(a.pos.x,a.pos.z),h1=W.height(a.pos.x+tv.x,a.pos.z+tv.z);slope=h1-h0;}
   a.slide=damp(a.slide,slope<-.32?1:0,slope<-.32?6:3,dt);
   const sp=a.maxSp*(1+a.slide*.9)*Math.min(1,d/.6+.35);const ox=a.pos.x,oz=a.pos.z;a.pos.x+=tv.x*sp*dt;a.pos.z+=tv.z*sp*dt;W.collide(a.space,a.pos,.55*PSCALE);
   if(!W.walkable(a.space,a.pos.x,a.pos.z)){a.pos.x=ox;a.pos.z=oz;a.target=null;}
   a.ry=dampAng(a.ry,Math.atan2(tv.x,tv.z),12,dt);moving=true;spd=Math.hypot(a.pos.x-ox,a.pos.z-oz)/dt;
   a.stuckT+=dt;if(a.stuckT>.8){if(a.lastPos.distanceTo(a.pos)<.35){a.target=null;a.slide=0;}a.lastPos.copy(a.pos);a.stuckT=0;}}}
 else a.slide=damp(a.slide,0,4,dt);
 const gy=W.ground(a.space,a.pos.x,a.pos.z)+(a.seat?a.seat.y-W.ground(a.space,a.seat.x,a.seat.z):0);
 a.pos.y=a.pos.y===0||Math.abs(gy-a.pos.y)>3?gy:damp(a.pos.y,gy,14,dt);
 pg.pose=a.state==='sit'?'sit':a.state==='dance'?'dance':a.slide>.5&&moving?'slide':a.state==='crouch'?'crouch':'stand';
 pg.group.position.copy(a.pos);pg.group.rotation.y=a.ry;pg.update(dt,moving?spd/PSCALE:0);a.speed=spd;
 // pet follows with hops
 if(a.pet){const p=a.pet,m=p.m;tv.set(a.pos.x-Math.sin(a.ry+.9)*2.1-p.pos.x,0,a.pos.z-Math.cos(a.ry+.9)*2.1-p.pos.z);const d=tv.length();let mv=false;
  if(d>.4){tv.normalize();const s=Math.min(d*3,a.maxSp*1.6+a.slide*4);p.pos.addScaledVector(tv,s*dt);p.ry=dampAng(p.ry,Math.atan2(tv.x,tv.z),8,dt);mv=true;}
  if(p.pos.distanceTo(a.pos)>14)p.pos.copy(a.pos).add(new V3(1,0,1));
  p.pos.y=W.ground(a.space,p.pos.x,p.pos.z);m.position.copy(p.pos);m.rotation.y=p.ry;animPomlet(m,dt,mv,a.state==='dance'?1:0);}
 return moving;}

/* ---------- NPC brains ---------- */
export function makeNPCs(n,W,scene,rand=Math.random){const plan={town:6,coffee:3,club:4,stage:3,dock:3,ski:2,street:2,light:2};const list=[];let k=0;const names=NAMES.slice().sort(()=>rand()-.5);
 const hats=WEAR.filter(w=>w.slot==='hat'),necks=WEAR.filter(w=>w.slot==='neck'),faces=WEAR.filter(w=>w.slot==='face');
 for(const room in plan)for(let i=0;i<plan[room]&&k<n;i++,k++){const R=ROOMS[room],o=SPACE_ORIGIN[R.space];const c=BODY_COLORS[(rand()*BODY_COLORS.length)|0].hex;
  const wear={hat:rand()<.7?pick(hats).id:null,neck:rand()<.5?pick(necks).id:null,face:rand()<.25?pick(faces).id:null};
  const p=randomPoint(W,room,rand);const a=new Actor({npc:true,name:names[k%names.length],color:c,wear,space:R.space,x:p.x,z:p.z,ry:rand()*6.28,home:room});
  a.pos.y=W.ground(a.space,a.pos.x,a.pos.z);a.pg.danceStyle=k%4;scene.add(a.pg.group);if(rand()<.18)a.setPet(PETS[(rand()*5)|0].id,scene);list.push(a);}
 return list;}
export function randomPoint(W,room,rand=Math.random){const R=ROOMS[room],o=SPACE_ORIGIN[R.space];for(let t=0;t<30;t++){let x,z;
  if(R.space==='out'){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*R.r*.75;x=R.x+Math.cos(a)*r;z=R.z+Math.sin(a)*r;}else{x=o[0]+(rand()*2-1)*7;z=o[2]+(rand()*2-1)*5.5;}
  const p=new V3(x,0,z);W.collide(R.space,p,.8);if(W.walkable(R.space,p.x,p.z)&&Math.abs(W.ground(R.space,p.x,p.z)-W.ground(R.space,R.space==='out'?R.x:o[0],R.space==='out'?R.z:o[2]))<6)return p;}
 return new V3(R.space==='out'?R.x:o[0],0,(R.space==='out'?R.z:o[2])+3);}

// ctx: {W,actors,player,say(a,txt,dur),emote(a,sym),throwAt(a,target),party,night,snd}
export function thinkNPC(a,dt,ctx){const{W,player}=ctx;a.stT-=dt;a.cool-=dt;
 const room=a.home,R=ROOMS[room];
 if(a.state==='walk'&&!a.target){a.state='idle';a.stT=1+rnd(3);}
 if(a.state==='travel'&&!a.target){if(a.via){a.target=a.via;a.via=null;}else{a.state='idle';a.stT=2;}}
 if(a.state==='sit'&&a.stT<=0){a.state='idle';a.stT=1+rnd(2);if(a.seat){a.seat.taken=null;a.pos.x+=Math.sin(a.seat.ry)*1;a.pos.z+=Math.cos(a.seat.ry)*1;a.seat=null;}}
 if(a.state==='dance'&&a.stT<=0){a.state='idle';a.stT=1;}
 if(a.state==='chat'){if(a.partner)a.face(a.partner.pos.x,a.partner.pos.z);if(a.stT<=0){if(a.lines>0&&a.partner){a.lines--;ctx.say(a,pick(Math.random()<.2?LINES.jokes:LINES.small),3);a.partner.stT=1.6+rnd(1);a.stT=99;a.partner.lines=a.lines;}else{a.state='idle';a.stT=2+rnd(3);if(a.partner&&a.partner.state==='chat'){a.partner.state='idle';a.partner.stT=2;}a.partner=null;}}return;}
 if(a.state==='react'){if(a.stT<=0){a.state='idle';a.stT=1;}return;}
 if(a.state!=='idle'||a.stT>0)return;
 // choose something to do
 const r=Math.random(),sp=a.space,space=R.space;
 if(room==='club'&&r<.7){a.state='dance';a.stT=6+rnd(10);a.pg.danceStyle=ri(4);a.pg.danceRate=2.07;return;}
 const seats=(W.seats[room]||[]).filter(s=>!s.taken);
 if(r<.18&&seats.length){const s=pick(seats);s.taken=a;a.seat=s;a.target=new V3(s.x,0,s.z);a.state='toSeat';a.stT=12;a.after=()=>{a.state='sit';a.ry=s.ry;a.pos.x=s.x;a.pos.z=s.z;a.stT=8+rnd(14);};return;}
 if(r<.3){const other=ctx.actors.find(b=>b!==a&&b.npc&&b.space===sp&&b.state==='idle'&&b.pos.distanceTo(a.pos)<9);if(other){a.state=other.state='chat';a.partner=other;other.partner=a;a.lines=2+ri(3);a.stT=.2;other.stT=99;a.face(other.pos.x,other.pos.z);other.face(a.pos.x,a.pos.z);
   const mid=a.pos.clone().lerp(other.pos,.5),dir=a.pos.clone().sub(other.pos).setY(0).normalize();a.target=mid.clone().addScaledVector(dir,1.4);other.target=mid.clone().addScaledVector(dir,-1.4);return;}}
 if(r<.38){a.pg.play(pick(['wave','cheer','hop','laugh','spin']));if(Math.random()<.6)ctx.emote(a,pick(EMOTES));a.stT=2+rnd(2);return;}
 if(r<.44&&space==='out'&&a.cool<=0){const tgt=ctx.actors.find(b=>b!==a&&b.space===sp&&b.pos.distanceTo(a.pos)<14&&b.pos.distanceTo(a.pos)>4&&Math.random()<.5);if(tgt){a.face(tgt.pos.x,tgt.pos.z);ctx.throwAt(a,tgt);a.cool=6;a.stT=2;return;}}
 if(r<.52){let line=pick(LINES.small);if(ctx.night>.6&&Math.random()<.5)line=pick(LINES.night);if(ctx.party&&Math.random()<.35)line=pick(LINES.party).replace('{party}',ctx.party.n);if(Math.random()<.25)line=pick(LINES.tips);ctx.say(a,line,3.5);a.stT=3+rnd(3);return;}
 if(r<.58&&space==='out'&&a.npc&&Math.random()<.5){// stroll to a neighbouring outdoor room
  const rooms=Object.keys(ROOMS).filter(k=>ROOMS[k].space==='out'&&k!==room);const to=pick(rooms);a.home=to;const dest=randomPoint(W,to);a.via=dest;a.target=new V3(ROOMS.town.x+rnd(-6,6),0,ROOMS.town.z+rnd(6,10));if(room==='town'){a.target=dest;a.via=null;}a.state='travel';return;}
 if(r<.62&&player&&player.space===sp&&player.pos.distanceTo(a.pos)<16&&player.pos.distanceTo(a.pos)>4){a.target=player.pos.clone().add(new V3(rnd(-2.5,2.5),0,rnd(-2.5,2.5)));a.state='walk';a.greet=true;return;}
 a.target=randomPoint(W,room);a.state='walk';}
export function arrive(a){if(a.state==="toSeat"&&a.seat){const d=Math.hypot(a.pos.x-a.seat.x,a.pos.z-a.seat.z);if(d<1.9||!a.target){a.target=null;if(d<3.2){if(a.after)a.after();}else{a.seat.taken=null;a.seat=null;a.state="idle";a.stT=1;}a.after=null;}}
 if(a.state==='toSeat'&&a.stT<=0){if(a.seat)a.seat.taken=null;a.seat=null;a.state='idle';a.target=null;}}
